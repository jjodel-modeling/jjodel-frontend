# VER2 — il riallineamento di `save` scriveva sull'oggetto vivo dello store

Data: 2026-09-02. Branch `alfonso-frontend-jjtl`. Corsia seriale.
File: `frontend/src/api/persistance/projects.ts`, `frontend/src/api/__tests__/projectsSaveVersionStore.test.ts`.
Sonde (gitignorate, `.gitignore:66`): `frontend/scripts/smoke/_tmp_ver2_{verify,isolate,dispatch,ambient,damage,after,window}.ts`.

## 1. L'ipotesi del prompt, e perche' era la meta' giusta della storia

Il prompt ipotizzava che la scrittura in place di `projects.ts` colpisse l'oggetto vivo
**a volte**, quando l'ottimizzazione del divergence point di `deepCopyButOnlyFollowingPath`
(`redux/reducer/reducer.ts:82`, condizione a `:96`) evita di duplicare un anello perche' il
path dell'azione precedente coincide.

Quella condizione esiste e funziona, ma **non e' il meccanismo**: `prevAction` e'
`actions[i-1]` **dentro un singolo giro del reducer** (`reducer.ts:505`), non l'azione del
dispatch precedente. Due save consecutivi sono due dispatch distinti, quindi `prevAction`
sarebbe `undefined` e l'anello verrebbe ricopiato comunque.

Il meccanismo vero e' un altro, ed e' peggiore: la scrittura colpisce l'oggetto vivo
**sempre**, non a volte.

## 2. Il regime misurato: l'app sta stabilmente dentro una transazione aperta

`redux/reducer/reducer.ts:1443` committa su intervallo:

```ts
documentEventsIntervalId = setInterval(()=>{ COMMIT(undefined, false) }, windoww.U.UpdatingTimer);
```

e `COMMIT` **riapre** il blocco prima di uscire (`redux/action/action.ts:137`, `BEGIN()`).
Il risultato e' che `transactionStatus` non torna mai a zero.

Misurato (`_tmp_ver2_ambient.ts`), tre contesti, due letture ciascuno a 12s e 17s dal load,
nessuna sonda che apra transazioni:

| contesto | `hasBegun` | `depth` | `aborted` | `pending` |
|---|---|---|---|---|
| `#/allProjects` | true | 1 | false | 0 |
| `#/project?id=…` (senza `smoke`) | true | 1 | false | 0 |
| `#/project?id=…&smoke=rowviews` | true | 1 | false | 0 |

Non e' un artefatto dello smoke: vale anche sul caricamento normale di un progetto e sulla
lista progetti. `U.UpdatingTimer` misurato = **300ms**.

Conseguenza su `Action.fire` (`action.ts:329`): con `t.hasBegun` vero l'azione **non viene
dispatchata**, finisce in `pendingActions`. Misurato attraversando la chiamata a `save`
(`_tmp_ver2_dispatch.ts`, intercettando `SetFieldAction.new` sullo stesso oggetto-classe che
`projects.ts` importa):

```
SetFieldAction.new(["Pointer_RowViewSmokeProject","version",1.1,"",false])
    txBefore {begun:true, depth:1, pending:0}
    txAfter  {begun:true, depth:1, pending:1}      <- accodata, non dispatchata
```

Quindi alla riga del riallineamento lo store e' **intatto** e `project.__raw` **e'**
`idlookup[id]` — per ogni call site di produzione, che prende un `LProject.getProject()`
fresco (`SaveManager.ts:33`, `common/libraries/saveProject.tsx:71`,
`editor-v2/hooks/useLayoutAutosave.ts:59`).

## 3. Punto 1 del prompt — i tre scenari, identita' e `clonedCounter`

`_tmp_ver2_verify.ts`, proxy preso fresco per scenario, `ident` = `project.__raw === idlookup[id]`,
`cIdl`/`cPrj` = `clonedCounter` dei due anelli del path `idlookup.<id>.version`.
**Prima della correzione:**

| passo | ident | cIdl | cPrj | A proxy | B `__raw` | C store |
|---|---|---|---|---|---|---|
| S1.0 prima del save 1 | true | 7 | 1 | 1 | 1 | 1 |
| S1.1 dopo il save 1 | **true** | 7 | 1 | 1.1 | 1.1 | 1.1 |
| S1.2 dopo il save 2 | **true** | 7 | 1 | 1.2 | 1.2 | 1.2 |
| S2.1 dopo il save 1 | **true** | 7 | 1 | 1.3 | 1.3 | 1.3 |
| S2.2 azione su altro id in mezzo | **true** | 7 | 1 | 1.3 | 1.3 | 1.3 |
| S2.3 dopo il save 2 | **true** | 7 | 1 | 1.4 | 1.4 | 1.4 |
| S3.1 dopo il save 1 | **true** | 7 | 1 | 1.5 | 1.5 | 1.5 |
| S3.2 dopo il save SILENZIOSO | true | 7 | 1 | 1.5 | 1.5 | 1.5 |
| S3.3 dopo il save 2 | **true** | 7 | 1 | 1.6 | 1.6 | 1.6 |

Otto save espliciti, **zero** incrementi di `clonedCounter`, `ident` sempre vero: nessun save
ha mai fatto ricopiare nulla al reducer. La versione nello store avanzava **soltanto** per la
scrittura in place. I tre scenari sono indistinguibili fra loro, perche' la variabile che il
prompt isolava (il path dell'azione precedente) non e' quella che decide.

CONTROLLO POSITIVO che lo strumento vede la ricopia quando c'e' (`_tmp_ver2_isolate.ts`,
stessa sessione, `SetFieldAction` lanciata **da sola**, senza `save`):

| passo | ident | cIdl | cPrj | store |
|---|---|---|---|---|
| baseline | true | 7 | 1 | 1 |
| dopo `SetFieldAction(version)` | **false** | 8 | 2 | 1.1 |
| dopo `SetFieldAction(name)` | false | 9 | 3 | 1.1 |
| dopo secondo `SetFieldAction(version)` | false | 10 | 4 | 1.2 |

La stessa azione, senza la scrittura in place, ricopia e stacca il proxy. Senza questo
controllo, «`clonedCounter` non si muove mai» sarebbe indistinguibile da «la sonda non misura
`clonedCounter`».

## 4. Punto 2 del prompt — il danno, tre domande e tre misure

`_tmp_ver2_damage.ts`. Confondenti eliminati per prima cosa: `U.userHasInteracted` era
`false` e `statehistory.globalcanundostate` era `false`, e in quello stato
`isRelevantChangeCheck` (`reducer.ts:1277`, `:1279`) scarta **ogni** delta — le tre risposte
sarebbero state «no» per la ragione sbagliata. Entrambi forzati a `true` prima di misurare.

| | Δ`clonedCounter` | Δ undo | Δ notifiche |
|---|---|---|---|
| CONTROLLO POSITIVO: `SetFieldAction` su `name` | +1 | +1 | +1 |
| CONTROFATTUALE: `SetFieldAction` su `version`, senza scrittura in place | +1 | +1 | +1 |
| **il `save` reale** | **0** | **0** | +1 |

**D1 — il valore finisce nel `delta`/`pastDelta` di `isRelevantChangeCheck`?** No. Zero
ricopie significa che quando l'azione in coda viene flushata il reducer non trova nulla da
cambiare: la scrittura in place aveva gia' portato `idlookup[id].version` al valore
dell'azione, e quell'oggetto e' lo stesso che il reducer rilegge come `oldState`. Il bump non
entra nel delta — quindi non entra neppure nel flusso `Collaborative`.

**D2 — diventa uno step di undo del D-layer?** No: `statehistory.all.undoable.length` invariato,
contro +1 del controfattuale.

**D3 — un componente sottoscritto a `version` ri-renderizza?** Una notifica arriva, ma **300ms
dopo** che il valore era gia' cambiato nello store, e non porta alcuna differenza su
`idlookup[id]` (stesso riferimento, stesso valore). Un selettore su `idlookup[id].version`
vede il nuovo numero **senza** che Redux lo abbia mai annunciato: lettura strappata.

A questo si aggiunge il difetto strutturale: lo stato Redux e' mutato fuori dal reducer, e
l'`oldState` che il reducer usa per il delta e' lo stesso oggetto — quindi un undo dell'azione
**precedente** ripristinerebbe uno stato che porta gia' la versione nuova.

Il punto 3 del prompt (fermarsi al referto se il danno non si misura) **non** si applica: il
danno si misura, ed e' su tutti e tre i piani.

## 5. La correzione, e le alternative scartate

Due righe, `projects.ts:129` e `:178-179`.

**Scelta: (a) guardia d'identita' sulla scrittura**, `if (raw && raw !== live)`, dove `live` e'
`store.getState().idlookup[dProject.id]`. E' il punto minimo che toglie il danno: la scrittura
resta esattamente dov'era e serve ancora il caso per cui VER1 l'aveva introdotta — un target
gia' staccato — ma non tocca piu' l'oggetto dello store.

La guardia da sola pero' **degradava** un caso che prima funzionava: un proxy tenuto in mano fra
due save perdeva un numero (misurato: `C: 1.5 -> 1.5 -> 1.6` invece di `1.5 -> 1.6 -> 1.7`),
perche' senza la scrittura in place la versione andava riletta da qualche parte. Da qui la
seconda riga.

**Aggiunta: la lettura di `currentVersion` viene da Redux**, non da `dProject.version` (che e'
una copia di `project.__raw`, cioe' del mirror che si stacca). Non sposta la fonte di verita':
Redux **e' gia'** la fonte di verita', e questa riga smette di leggerne un riflesso stantio.
`dProject.version` resta il fallback per un progetto assente da `idlookup`. Con le due righe
insieme la misura torna verde su tutti i casi (§6).

**(b) rileggere il `raw` dallo store dopo l'azione invece di scriverlo** — scartata perche'
**non funziona in questo regime**: l'azione e' ancora in coda, quindi l'oggetto riletto dallo
store e' lo **stesso** oggetto e porta ancora il valore vecchio. Scriverci sopra sarebbe la
stessa mutazione dell'oggetto vivo, con un giro in piu'.

**(c) far rileggere sempre il proxy da Redux** — scartata come riscrittura: significherebbe
ricostruire il proxy dentro `save`, cioe' cambiare il contratto del metodo con il chiamante
(che passa un `LProject`) per un difetto che si chiude in due righe. La meta' utile di questa
idea — leggere il **valore** da Redux — e' quella che ho preso.

**(d) memo modulare della versione gia' dispatchata** — provata, misurata, **rimossa**. Chiudeva
il residuo di §7 (`ritorni [1.1, 1.2]` invece di `[1.1, 1.1]`), ma faceva rosso un caso legittimo
del file di test di VER1: due save che partono dallo stesso numero riusavano il memo del giro
precedente. Il memo era gia' nella forma piu' stretta che sapessi dargli — chiave `{from, to}`,
consultato solo finche' lo store mostra ancora `from` — e non basta: `from` non distingue
«l'azione e' ancora in coda» da «il progetto e' tornato a quel valore per un undo o una
riapertura». Stato modulare che spara nel caso sbagliato,
per una finestra di 300ms: over-engineering (regola 6). Scartata.

**(e) forzare il dispatch con `COMMIT`/`.commit()`** — scartata: farebbe flushare tutte le azioni
pendenti di chiunque altro, e cambia la semantica di dispatch. E' una modifica core (regola 5),
va chiesta.

## 6. Dopo la correzione — misura

`_tmp_ver2_after.ts`, **9 PASS su 9**. `FLUSH` = 1500ms fra un save e l'altro, cioe' oltre
`U.UpdatingTimer`: sotto quella soglia l'azione e' ancora in coda e nessuna misura sullo store
significa qualcosa.

| asserzione | esito | misura |
|---|---|---|
| il save esplicito CLONA `idlookup[id]` (passa dal reducer) | PASS | Δ`cPrj` = 1 |
| il save esplicito notifica i sottoscritti | PASS | Δnotifiche = 1 |
| dopo il save il proxy e' DETACHED (nessuna scrittura sull'oggetto vivo) | PASS | `ident` = false |
| VER1 non regredisce, proxy ripreso ogni volta | PASS | `C: 1.2 -> 1.3 -> 1.4` |
| VER1 non regredisce, proxy tenuto in mano | PASS | `C: 1.5 -> 1.6 -> 1.7` |
| S1 due save consecutivi, due versioni | PASS | `1.7 -> 1.8`, `cPrj 8 -> 9` |
| S2 con azione a path divergente in mezzo | PASS | `1.9 -> 2` |
| S3 il silenzioso non avanza e non clona | PASS | `C 2.1 -> 2.1`, `cPrj 12 -> 12` |
| S3 l'esplicito dopo il silenzioso avanza | PASS | `2.1 -> 2.2` |

## 7. Cosa resta aperto — residuo dichiarato

**Due save espliciti entro 300ms condividono un numero di versione.** Misurato
(`_tmp_ver2_window.ts`): due `save` back-to-back senza attesa rendono `[1.1, 1.1]` e lo store si
ferma a 1.1; gli stessi due con l'attesa in mezzo rendono `1.1 -> 1.3`. Prima della correzione la
finestra era chiusa — dalla scrittura in place, cioe' dal difetto.

E' una **deroga dichiarata** alla regola 3 (RC-11): il baratto e' un numero di versione condiviso
fra due save che serializzano lo stesso identico contenuto, contro una mutazione dello stato Redux
fuori dal reducer che toglie il bump dal delta, dalla history di undo e dal flusso collaborativo.
Sanare o rifiutare e' del reviewer. La strada per chiuderlo senza stato modulare e' (e), che e'
una modifica core e va chiesta.

**Il regime della transazione sempre aperta** (§2) e' fuori perimetro qui, ma vale per **ogni**
`SetFieldAction` dell'applicazione, non solo per questa: nessuna azione raggiunge lo store in
modo sincrono, tutte passano da `pendingActions` e da un flush fino a 300ms dopo. Qualunque
codice che scriva un'azione e rilegga subito lo store sta leggendo il valore vecchio. Merita una
corsia sua.

## 8. Fuori perimetro — registrato, non toccato

- **`createAdapter.ts`**: comparso in albero a meta' sessione, `+115` righe non staged, di
  un'altra corsia. Constatato e lasciato dov'e' (RC-13).
- **EGO1**: il revert staged sui tre path e' ancora nell'indice, intatto. Decisione di Alfonso.
- **C7**: `ConformanceProblemSync.ownedIds` e i cleanup di unmount — puo' usare
  `getProblemIdsOwnedBy`?
- **CLAUDE.md §6.1 contro RC-13-bis**: §6.1 documenta ancora il pattern
  `cp docs/claude-code-log.md /tmp/… && cp /tmp/… docs/`, che e' il secondo dei tre incidenti
  che RC-13-bis vieta. Corsia a se' (tocca `check:agents`).
- Disallineamento chiavi canvas + `DVertex`: la conformance registra sull'id del `DVertex`,
  non sulla chiave dello storage.

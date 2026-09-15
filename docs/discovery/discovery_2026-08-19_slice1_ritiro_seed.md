# Slice 1 di `2.228` — ritiro effettivo del seed (R-IRN-15)

**Data**: 2026-08-19. **Prompt**: `2026-08-19 00:15`, Fase 2 slice 1 di 3, un commit.
**Base**: `44366ce4d`, working tree pulito, branch `alfonso-frontend-jjtl`.
**Layer Impact Report**: non prodotto di nuovo. Vale
`docs/discovery/discovery_2026-08-18_4_lir_versionfixer_2228.md` §4.2 e §5.2, riletti prima del
diff come il prompt richiede.

Questo non e' un report di discovery di Fase 1: e' il report di chiusura di una slice esecutiva,
richiesto dal prompt e archiviato sotto `docs/discovery/` con il naming di P4.

---

## 1. Prerequisiti

**Prerequisito 1 — verifica visiva della slice 0.** Confermato da Alfonso: leggendo il `Rev` in
dashboard **prima** di aprire il progetto, e riguardandolo dopo apri-e-salva, la revisione e' salita
di un decimo. Il criterio applicato e' quello del prompt («la revisione non deve mai scendere»,
qualunque sia il valore di partenza), non il «da `2.3` a `2.4`» del messaggio di chiusura della
slice 0.

**Prerequisito 2 — rilettura di `docs/decisions.md`, serie R-IRN 11..22, dal file.** Eseguita
leggendo `docs/decisions.md:779-968`, non dalla memoria di sessione e non dal prompt. Prima riga di
R-IRN-15, citata testualmente come richiesto:

> **R-IRN-15** (2026-08-18) — **Il ritiro del seed sono tre interventi, e il loop di coda va
> neutralizzato anche se non si purga niente.**

Nota su R-IRN-22, che il prompt riassume: `decisions.md` la colloca **dentro `2.228`, in un commit
suo**, e dice che `NestedView.tsx` e' gia' nel perimetro della slice 2. Il prompt dice «commit 2c».
Non c'e' conflitto sul contenuto — in questa slice `NestedView.tsx` non si tocca — ma la sigla del
commit va presa da chi scrivera' la slice 2.

---

## 2. Le tre modifiche, come sono state scritte

| # | File | Righe su `44366ce4d` | Modifica |
|---|---|---|---|
| 1 | `frontend/src/redux/store.tsx` | 325, 327 | le due righe del seed commentate, non rimosse |
| 2 | `frontend/src/redux/VersionFixer.tsx` | 145-151 | blocco `// add new default views` rimosso |
| 3 | `frontend/src/view/viewElement/view.tsx` | 1920 | guardia estesa a `typeof newView !== 'object'` |

### 2.1 `store.tsx`

Commentate, non cancellate, nella forma esatta indicata dal prompt. `CreateElementAction` ha
**esattamente due occorrenze** nel file (import a riga 5, uso a riga 327): verificato, e' la ragione
per cui cancellare la riga lascerebbe un import orfano e toccare l'import sarebbe fuori perimetro.

Restano intatti, come prescritto: `DViewPoint.newVP('Default', ...)` (246-322), il
`Log.exDev(viewpoint.id !== Defaults.viewpoints[0], ...)` di riga 323, i tipi primitivi e `EObject`.
`makeDefaultGraphViews` (ora a riga 360) e tutto `redux/defaults/views.ts` restano dove sono,
intatti e non chiamati.

### 2.2 `VersionFixer.tsx`

Rimosso il blocco intero, non reso condizionale (R-IRN-15). Il loop che precede — `// update default
views`, quello che chiama `LViewElement.updateDefaultView` — resta dov'e'.

### 2.3 `view.tsx`

Una riga sola. Il resto della funzione non e' stato toccato: ne' il carry-over di `ir`, ne' il
commento su `irLegacyClassic`, ne' il ramo `if (state) return;`.

---

## 3. Scostamenti rispetto al prompt

Tutti minori, nessuno ha cambiato il diff. Ancorate le modifiche al testo, non ai numeri di riga,
come il prompt chiede.

1. **`VersionFixer.tsx`, il loop che resta**: il prompt lo indica come «righe 132-143». Sul file e'
   **133-143**; la 132 e' una riga vuota. La chiamata a `updateDefaultView` e' a riga **141**.
2. **`NestedView.tsx`, secondo chiamante di `updateDefaultView`**: il prompt dice riga 396, il file
   dice **399**, che e' anche il numero riportato da R-IRN-22. File comunque non toccato.
3. **`store.tsx`, il commento**: la forma prescritta dal prompt contiene «see the scope decision
   below». Nel file non c'e' nessuna decisione «below»: il rimando e' alla sezione del prompt. E'
   stata scritta verbatim come richiesto, ma **il rimando e' cieco per chi legge il codice**, ed e' un
   candidato a una riformulazione in una passata successiva (per esempio, citare R-IRN-15 al posto
   di «below»).
4. **`view.tsx`**: il prompt indica «riga 1919-1920» per la guardia; la riga effettivamente toccata
   e' la **1920**, la 1919 e' la dichiarazione di `newView`, letta ma non modificata.

---

## 4. Verifica funzionale

Il dev server era gia' attivo su `localhost:3000`. Gli scenari 1, 2 e 4 sono stati eseguiti con uno
script Playwright temporaneo appoggiato agli helper di `frontend/scripts/smoke/states.ts` (`seed`,
`createProject`), cancellato a fine verifica e non committato.

### 4.1 Il controllo positivo, prima dei risultati

Un'asserzione di assenza vale solo se si dimostra che la misura sa vedere la presenza (CLAUDE.md §5).
Lo stesso identico script e' stato eseguito **due volte**, con le tre modifiche in albero e con le tre
modifiche in `git stash`:

| Misura | codice base (stash) | con le tre modifiche |
|---|---|---|
| id di default presenti in `idlookup`, progetto nuovo | **21** | **0** |
| `DViewElement` totali in `idlookup` | 21 | 0 |
| id di default presenti dopo salva-chiudi-riapri | **21** | **0** |
| dimensione dello stato persistito | 46140 byte | **12554 byte** |
| `subViews` del viewpoint `Default` | `[Pointer_ViewModel, Pointer_ViewFallback]` | `[]` |

La sonda distingue: sul codice base trova tutti e ventuno gli id (i venti del registro piu'
`Pointer_ViewEdge`, che il registro non elenca — R-IRN-13), con le modifiche non ne trova nessuno.
Lo zero e' un risultato, non un silenzio.

### 4.2 Scenario 1 — progetto nuovo — **passato**

```
presentDefaultIds: []            booleanIdlookupKeys: []
viewpointPresent: true           viewpointSubViews: []
totalViewElements: 0             stateVersion: 2.227
defaultViewsMapIsBoolean: true   defaultViewPointsMapIsObject: true
```

Le ultime due righe sono la conferma diretta del meccanismo descritto dal prompt: **la guardia di
`reducer.ts:1104` si chiude lo stesso**, perche' il viewpoint `Default` continua a essere creato e a
finire nella mappa dei viewpoint come oggetto; e **le venti chiavi di `defaultViewsMap` restano
booleane**, che e' esattamente il motivo per cui servivano le modifiche 2 e 3.

Sul «non compare nella lista dei viewpoint ne' nel selettore», misurato sul getter L invece che sul
DOM (una sonda su `select option` aveva restituito una lista vuota, che non prova niente perche' il
selettore potrebbe non essere montato):

```
rawProjectViewpoints: ["Pointer_ViewPointDefault"]   // il contenitore c'e', nel D-layer
lViewpointNames: []   lViewpointIds: []              // ma la lista utente e' vuota
holdsOnlySystemViews: true    isSystemViewpoint: true    vpSubViews: []
```

Il contenitore esiste e resta invisibile, che e' il comportamento previsto da R-IRN-9 e la ragione
per cui il perimetro tiene il viewpoint vuoto.

### 4.3 Scenario 2 — nuovo, salvato, chiuso, riaperto — **passato**

Salvataggio reale (`ProjectsApi.save`, stato compresso in `localStorage.projects`, revisione
`1.1`), poi navigazione a `#/allProjects` e riapertura del progetto, cioe' un ricaricamento pieno
che rifa' `init_editor` e poi passa da `SaveManager.load`. Dopo la riapertura: **zero** id di
default in `idlookup`, **zero** chiavi booleane. Sul codice base, la stessa sequenza ne riporta 21.

E' il test della rimozione del loop di coda, ed e' il motivo per cui la slice esiste: senza quella
rimozione il primo salva-e-riapri avrebbe rimesso tutto.

### 4.4 Scenario 4 — riaperto due volte — **passato**

Seconda riapertura identica alla prima, confronto su tutta la sonda serializzata: `SCENARIO 4
IDENTICAL TO 2: true`. Nessuna deriva fra il primo e il secondo caricamento.

### 4.5 Scenario 3 — progetto vecchio — **pendente su Alfonso**

Il progetto `State Machine v1` sta nel `localStorage` di Alfonso e non e' raggiungibile da qui.
L'istruzione esatta e' in §6.

**In compenso il punto di rottura che lo scenario 3 esercita e' stato verificato direttamente**, in
pagina, sul runtime post-ritiro. Due sonde nello stesso `page.evaluate`, su un record `v` con la
forma giusta (`{id: 'Pointer_ViewModel', className: 'DViewElement', version: 2.1, subViews: {},
pointedBy: []}`):

```
entryType: "boolean"              // Defaults.defaultViewsMap['Pointer_ViewModel'] dopo il ritiro
spreadOfEntry: "{}"               // {...true} da' {}, come dice R-IRN-15
guardedThrew: null                // updateDefaultView con la guardia: non solleva
guardedWroteIdlookup: false       // e non scrive in idlookup
unguardedThrew: "d1.pointedBy is not iterable"   // la stessa chiamata senza la guardia
```

L'ultima riga e' il TypeError di `PointedBy.merge` previsto da R-IRN-15 e dal LIR §5.3, riprodotto
sul codice di oggi e non ricordato da una sessione precedente. La guardia lo previene per
costruzione. Resta ad Alfonso la conferma end-to-end su un salvataggio vero, perche' quello esercita
anche il percorso `SaveManager.load` → `catch` di `reducer.ts:1577`.

---

## 5. Gate, con i numeri

| Gate | Baseline dichiarata | Misurato |
|---|---|---|
| `npm run typecheck` | 33 su macOS | **33** — conteggio su output completo, non su `tail` |
| `npm run test` | 1315 passati, 9 suite rosse | **1315 passati, 9 suite rosse su 59** |
| `npm run build` | exit 0 | **exit 0**, solo il warning di chunk-size preesistente |
| `npm run check:docs` | 3 check, 0 warning | **3/3, 0 warning** |
| `npm run check:agents` | pass | **pass** |
| `npm run smoke` | 3 stati, 10 assert | **10 passati, 0 falliti, 2 skip** |

`makeDefaultGraphViews` e' ora una funzione dichiarata e mai chiamata: come previsto dal prompt il
typecheck **non** e' salito, `tsconfig.json` non imposta `noUnusedLocals`.

**Uno scostamento nello smoke, non attribuibile a questa slice.** Lo smoke stampa tre righe
`IMPROVED` sul pattern `Encountered two children with the same key` (6→0, 18→0, 20→0). Verificato per
attribuzione: lo stesso smoke eseguito con le tre modifiche in `git stash` stampa **le stesse tre
righe identiche**. E' un residuo della baseline non aggiornata dopo R-IRN-10, che quel duplicato lo
ha gia' chiuso — il commento a `joiner/classes.ts:3329-3333` lo dice esplicitamente («18 and 20
occurrences, now 0»). Non e' un effetto del ritiro del seed. La pulizia di
`console-baseline.json` non e' in questo perimetro.

---

## 6. Istruzione per Alfonso — scenario 3

1. Apri il browser sull'origine dove vive il tuo `localStorage`, `http://localhost:3000`, con il dev
   server che serve **questo** albero (le tre modifiche in working tree o il commit di questa slice).
2. Apri la console del browser **prima** di caricare il progetto, e lasciala aperta.
3. Dalla dashboard apri `State Machine v1`.
4. Verifica due cose:
   - **il progetto carica**, cioe' la tela compare e non resta una pagina vuota o bloccata;
   - **in console non compare** ne' un TypeError con `pointedBy is not iterable`, ne' il messaggio
     del `catch` di `reducer.ts:1577`.
5. Se il progetto non carica e a schermo non appare nessun errore, e' esattamente il sintomo
   silenzioso descritto da R-IRN-15: la console e' l'unico posto dove si vede.
6. Atteso, e **non** un difetto: le view di default gia' salvate in quel progetto restano com'erano:
   il codice fresco non le rigenera piu' (vedi §7 punto 1).

---

## 7. Conseguenze attese, riportate come tali e non come regressioni

1. **Le view di default gia' salvate nei progetti vecchi non vengono piu' rigenerate.** Il loop di
   `VersionFixer.tsx:133-143` le raggiunge ancora, ma `updateDefaultView` esce subito sulla guardia
   di tipo. E' il prezzo dichiarato del ritiro. La purga che le toglie di mezzo e' `2.229`
   (R-IRN-19), non questa slice.
2. **Il bottone «una nuova versione dagli sviluppatori e' disponibile» resta visibile e diventa
   muto** sulle default vecchie: `Defaults.check(d.id)` risponde ancora `true` perche' i registri
   restano pieni (R-IRN-14), ma il click su `NestedView.tsx:399` non fa piu' niente. Noto, e'
   R-IRN-22, si chiude nella slice 2. `NestedView.tsx` non e' stato toccato qui.

### 7.1 Debito censito, non rimosso

Il loop di `VersionFixer.tsx:133-143` e' ora un ciclo su **tutto** `idlookup` che, dopo la guardia
di tipo, quasi sempre non fa niente: per ogni stato caricato scandisce ogni record, filtra i due
`className` di view, e poi si ferma su `typeof newView !== 'object'`. Costo O(|idlookup|) a ogni
caricamento per un effetto quasi sempre nullo. **Non rimosso** (Rule 9, fuori perimetro): censito
qui perche' chi scrivera' `2.229` decida se ha ancora un caso d'uso — ce l'ha finche' esiste un
salvataggio le cui view di sistema vanno rigenerate, cioe' finche' la purga di R-IRN-19 non ha
girato.

---

## 8. Perimetro

**Toccati**: `frontend/src/redux/store.tsx`, `frontend/src/redux/VersionFixer.tsx`,
`frontend/src/view/viewElement/view.tsx`. Piu' `docs/claude-code-log.md` e questo report.

**Non toccati**, come prescritto: `common/Defaults.ts`, `redux/reducer/reducer.ts`,
`joiner/classes.ts`, `utils/lastViewpoint.ts`, `components/editors/views/NestedView.tsx`,
`redux/selectors.ts`, `redux/defaults/views.ts`.

Nessuna espansione di perimetro richiesta e nessuna effettuata.

## 9. Stato

Slice 1 chiusa, commit unico. **HARD STOP**: la slice 2 non parte senza la verifica visiva di
Alfonso su questa, e senza l'esito dello scenario 3 di §6.

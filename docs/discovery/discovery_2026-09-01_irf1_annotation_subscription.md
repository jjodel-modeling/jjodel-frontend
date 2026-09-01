# IRF1 — la form non si ri-renderizza alla scrittura di un'annotation

Data: 2026-09-01. Protocollo `docs/PROTOCOL.md` P1..P10. Critical zone (`CLAUDE.md` §3.1,
riga `components/editor-v2/viewpoint/ir/`): il Layer Impact Report di §3.2 e' in §5, scritto
prima di qualunque diff. Sonda: `scripts/smoke/_tmp_irf1_verify.ts` (non committata,
`.gitignore:66`).

Il difetto e' quello che TXT1 Fase 2 ha trovato e dichiarato non riparato
(`discovery_2026-09-01_txt1_fase2_multiline.md` §6.1 e §9, primo punto).

---

## 1. Ipotesi che questa discovery falsifica

Il referto TXT1 attribuisce il difetto a una `useMemo`:

> La causa e' `IRForm`: i descriptor si ricalcolano da `useMemo(..., [slots, spec,
> resolution, offer])`, e un'annotation vive sulla **metafeature**, fuori da quelle
> dipendenze.

**La memo non e' la causa, ed e' una distinzione che cambia il rimedio.** `slots` e'
`lObject.features`, letto nel corpo del render; `LObject.get_features` (`LModelElement.tsx:6641`)
delega a `get_children`, che a `:773-776` fa

```ts
return LPointerTargetable.fromArr(this.get_children_idlist(context)).filter((e: any)=>!!e);
```

cioe' costruisce **un array nuovo a ogni lettura**. La dep `slots` cambia identita' a ogni
render, quindi la memo ricalcola sempre: non trattiene mai un descriptor vecchio. Lo dice
anche la frase successiva del referto TXT1, che con la diagnosi «memo» non torna — «la
dichiarazione si vede alla prima re-render che arriva per altra via»: se fosse la memo a
trattenere, una re-render qualunque non basterebbe, perche' le sue dipendenze non sarebbero
cambiate.

Quello che manca e' **la re-render**, cioe' la SOTTOSCRIZIONE. E infatti il prompt IRF1 la
nomina per prima. Il rimedio che seguirebbe dalla diagnosi «memo» — allargare le dipendenze
del ricalcolo — non ripara niente da solo.

## 2. File letti

`components/editor-v2/viewpoint/ir/{IRForm.tsx, useIRFormView.ts, useFormWidgets.ts,
formAutoLayout.ts}`, `components/editor-v2/nodes/{rowViewAnnotations.ts,
rowViewAnnotationsWrite.ts, DisplayAnnotations.tsx}`, `jjform/layout.ts`,
`components/editor-v2/viewpoint/ir/widgets/index.ts`,
`model/logicWrapper/LModelElement.tsx` (`get_features`, `get_children`),
`components/abstract/tabs/InstanceManagerTab.tsx` (montaggio),
`components/editors/PropertiesWithTreeView.tsx` (montaggio),
`frontend/scripts/smoke/{README-probes.md, _tmp_txt1_verify.ts}`.

## 3. Dove passa la reattivita' della form, misurato sul sorgente

Una sola sottoscrizione porta il modello dentro `IRForm`: `useIRFormView(objectId)`
(`IRForm.tsx:168`). La sua firma (`useIRFormView.ts:65-84`) e' l'istantanea

```
irSig | objectId | dObject.instanceof | dObject.name | per ogni feature: `${fid}=${JSON.stringify(dv.values)}` | crossSig
```

Le annotation non ci sono, e non per dimenticanza: vivono un livello sopra, sulla
**metafeature**. `DValue.instanceof` -> `DAttribute` / `DReference` -> `.annotations` ->
`DAnnotation.source`. Nessuno dei quattro passi compare nella firma.

Le altre due `useSelector` di `IRForm` non colmano il buco: `viewpointTheme`
(`IRForm.tsx:199-203`) legge `state.viewpoint`, `useNodeProblems(objectId)` legge il
registro dei problemi.

Il lettore che invece le annotation le legge davvero e' `describeSlot`
(`useFormWidgets.ts:341-347`), che prende `feature.annotations` dal proxy L e ne raccoglie
le `source`. Legge al render — e il render non arriva.

## 4. La misura: la sonda, prima di qualunque riparazione

`_tmp_irf1_verify.ts`, sette bracci, **nessun nudge in nessuno** (il nudge era la leva con
cui la sonda TXT1 aggirava il difetto; chi lo aggira non lo misura). Budget di assestamento
6000 ms. Fixture `rowviews`, soggetto `AllNine.description`, controllo `AllNine.notes`.

Risultato a codice invariato: **3 FAILED su 12**, e i tre sono esattamente il buco.

| braccio | criterio | misura |
|---|---|---|
| A | la form e' montata, il soggetto e' a span 6 con `<input>` | **PASS** (14 campi, `span: 6`, `tag: input`) |
| A | il lettore di firma ha segnale: la fixture porta gia' delle dichiarazioni | **PASS** (`unit=px`, `min=0`, `max=1`, `renderer=code`) |
| A | ma soggetto e controllo non ne portano nessuna | **PASS** |
| B | lo store porta la dichiarazione subito dopo la scrittura | **PASS** — `{multiline: true}` |
| B | **e la form si ridisegna da sola entro 6000 ms** | **FAIL** — `settled: false`, ancora `span 6`, `tag: input` |
| C | il campo di controllo partiva a span 6 con `<input>` | **PASS** |
| C | **`renderer=swatch`, chiave VECCHIA, si vede da sola** | **FAIL** — `settled: false`, ancora span 6 |
| D | **il campo era una growtext prima del clear** | **FAIL** — conseguenza di B |
| D | il `clear` NON toglie il puntatore: riscrive la sola `source` | **PASS** — `n` 1 -> 1, `sources: [""]` |
| E | un edit di valore non muove la firma delle annotation | **PASS** |
| F | una scrittura estranea non muove ne' firma ne' geometria | **PASS** |
| Z | zero errori di pagina | **PASS** |

### 4.1 Tre cose che la sonda ha corretto di se' stessa, e che valgono per chi verra' dopo

- **La fixture `rowviews` porta gia' quattro dichiarazioni `jjodel/`** — `unit=px`,
  `min=0`, `max=1` e un `renderer=code` su `AllNine.guard`. Il primo giro sceglieva soggetto
  e controllo per posizione e prendeva `guard`: la scrittura sarebbe stata **idempotente**,
  quindi nessun cambiamento di stato e quindi nessuna re-render possibile nemmeno a
  riparazione avvenuta. Soggetto e controllo si scelgono ora fra gli `EString` scalari
  **senza** dichiarazioni.
- **`renderer=code` su un `EString` non si vede nella form.** `RENDERER_WIDTH_KIND.code`
  vale `'code'` e `WIDTH_MAP.code` e' `{span: 6, widget: 'code'}` (`jjform/layout.ts:168`) —
  esattamente cio' che il campo era gia'; e `code` non e' nel registro degli extended widget
  (`formAutoLayout.ts:392`, «`code`, `picker` — returns `null` on purpose»), quindi il
  dispatch resta quello legacy e il controllo resta un `<input>`. La chiave vecchia si misura
  con **`swatch`**, che mappa su `{span: 3, widget: 'color'}` e si vede.
  Nota di lettura, fuori perimetro: e' anche il motivo per cui il secondo `check` del
  braccio G di `_tmp_txt1_verify.ts` era vacuo — la sua terza clausola in `||` e' `cols === 6`,
  che e' vera sempre.
- **Il dispatch e' differito** (`redux/action/action.ts:349`, `setTimeout(…, 0)`): leggere
  lo store subito dopo `clearRowViewAnnotation` misura lo stato **prima** della scrittura. Il
  primo giro dava per non avvenuto un clear che era solo in volo.

### 4.2 Il caso che DISCRIMINA la forma della sottoscrizione

Le due scritture del pannello Display non toccano gli stessi campi D:

| gesto | cosa cambia nel grafo D |
|---|---|
| accendere un toggle la **prima** volta | `DAnnotation.new` -> **`DAttribute.annotations` cresce** (+ la nuova `source`) |
| spegnerlo (`clearRowViewAnnotation`) | `SetFieldAction` su **`DAnnotation.source`** -> `''`. `DAttribute.annotations` **non cambia** |
| riaccenderlo | `SetFieldAction` sulla stessa `source`. `annotations` **non cambia** |

Misurato (braccio D): `annotations.length` **1 prima, 1 dopo**, `sources` da
`["jjodel/multiline=true"]` a `[""]`.

Questo esclude una delle due vie che il prompt lascia aperte: **un selettore che tocchi il
solo `DAttribute.annotations` sarebbe verde all'accensione e cieco allo spegnimento e alla
riaccensione**. La sottoscrizione deve arrivare fino alla `source` delle annotation lette.

## 5. LAYER IMPACT REPORT

```
Layers touched:
  [ ] D-layer (Redux raw data)          — in sola LETTURA (nuovo selettore), zero scritture
  [ ] L-layer (computed proxies)
  [ ] JjOM (model entities)
  [ ] Canvas v2-flow (ReactFlow nodes/edges)
  [ ] Canvas classic
  [ ] Sync layer (useJjomSync hooks)
  [ ] Persistence (VersionFixer / jsxString)
  [x] IR execution rendering (viewpoint/ir/) — il solo layer modificato
```

**D-layer — cosa cambia**: nulla. Si aggiunge una LETTURA: per ogni `DObject.features` ->
`DValue.instanceof` -> `DAttribute|DReference.annotations` -> `DAnnotation.source`. Nessuna
`SetFieldAction`, nessun creatore, nessuna TRANSACTION (§3.3 non si applica: non c'e' scrittura).

**IR execution rendering — cosa cambia**: `IRForm` acquisisce una seconda `useSelector` che
restituisce una **stringa**, e la stringa entra nelle dipendenze del ricalcolo dei descriptor.
**Cosa NON cambia**: `describeSlots`, `describeSlot`, `useFormWidgets`, `useIRFormView`, la
firma degli slot, `resolveIRView`, `publishCrossDeps`, `autoLayoutRows`, la scala delle
larghezze, i widget. Il prompt lo chiede esplicitamente («NON ristrutturare il recompute») e
il diff non lo fa.

**Interazione cross-layer**: nessuna. Il selettore non scrive, quindi non puo' innescare
cicli. Non tocca `resolution`, quindi la view IR non si ri-risolve e le cross-deps non si
ripubblicano quando un'annotation cambia: la re-render che il rimedio aggiunge e' la sola
`IRForm`, non la catena di risoluzione.

**Sicurezza rispetto agli altri layer**: il campo `DAnnotation.source` ha oggi cinque
lettori — `readRowViewAnnotations` / `findRowViewAnnotationId` (`nodes/rowViewAnnotations.ts`),
`DisplayAnnotations` (che ha gia' la sua `useSelector` con equality sui cinque valori
parsati, `DisplayAnnotations.tsx:95-99`), `describeSlot` (`useFormWidgets.ts:342`),
`jjomTransformers.ts:456-459` (canvas) e `instanceTable.ts:168-171` (tabella). Nessuno di
essi viene toccato: si aggiunge un sesto lettore, in sola lettura.

### 5.1 Censimento — chi altro legge le deps in gioco

| dep | chi la legge oggi | tocca il diff? |
|---|---|---|
| `useIRFormView(objectId)` | **solo** `IRForm.tsx:168` (`grep` su tutto `src`: 1 chiamata, il resto sono commenti) | no |
| la memo `fields` e le sue deps `[slots, spec, resolution, offer]` | solo `IRForm`, corpo locale | si', una dep in piu' |
| `IRForm` come componente | `InstanceManagerTab.tsx:2792` e `:2826`, `PropertiesWithTreeView.tsx:1110` | no — ereditano il rimedio |
| `DObject.features` / `DValue.instanceof` | mezzo codebase, in lettura | no |
| `DAttribute.annotations` / `DAnnotation.source` | i cinque lettori sopra | no |

Il perimetro del prompt («IRForm + hook di subscription») si restringe quindi a **un file**:
`useIRFormView` non ha altri chiamanti, ma non ha nemmeno bisogno di cambiare — la via meno
invasiva non lo tocca, per la ragione in §6.

### 5.2 Smoke-test scenarios potenzialmente toccati

- aprire un progetto e selezionare un'istanza -> la form rende (ogni montaggio di `IRForm`);
- il pannello Display sul metamodello -> i cinque toggle;
- il manager delle istanze (`InstanceManagerTab`), che monta due `IRForm`;
- il rail Properties (`PropertiesWithTreeView`);
- i quattro preset di tema della form (non toccati, ma sono la strada del braccio E di TXT1).

## 6. La via scelta, e le due scartate

**Scelta — una `useSelector` dedicata dentro `IRForm`, che restituisce una stringa.**

Ha un precedente nello stesso file, scritto e argomentato: `viewpointTheme`
(`IRForm.tsx:194-198`) e' «its own `useSelector` and not a field of `useIRFormView`'s
signature», perche' quella firma e' l'istantanea degli slot e allargarla farebbe ricalcolare
l'istantanea per un valore che cambia per altri motivi. E ha un secondo precedente sul
soggetto esatto: `DisplayAnnotations` (`:95-99`) si sottoscrive alle annotation di UNA
feature con la propria `useSelector` ed equality sui valori parsati. Qui le feature sono N,
quindi una stringa e l'uguaglianza di default.

**Scartata (a) — allargare la firma di `useIRFormView`.** Funzionerebbe e tocca lo stesso
numero di file, ma cambia l'identita' di `resolution`, e con essa fa ri-risolvere
`resolveIRView` e ripubblicare le cross-deps a ogni cambio di dichiarazione. Piu' lavoro per
lo stesso pixel, su un hook che e' il cuore della risoluzione.

**Scartata (b) — un selettore sul solo `DAttribute.annotations`.** Falsificata dalla misura
di §4.2: sarebbe cieca allo spegnimento e alla riaccensione di un toggle.

**Non fatto, per mandato esplicito del prompt**: ristrutturare il ricalcolo. `describeSlots`
resta dov'e' e come e'.

## 7. Il costo, e come si misura

Una `useSelector` gira a **ogni dispatch**. Quello che costa un render non e' girare: e'
restituire un valore nuovo. Due misure, entrambe nella sonda:

1. **la firma sta ferma su un gesto non pertinente** — braccio E, edit di un valore su uno
   slot: la firma delle annotation e' byte per byte la stessa prima e dopo. Gia' verde a
   codice invariato, e resta il criterio dopo;
2. **il conteggio di render della form**, prima e dopo la riparazione, sullo stesso gesto e
   a riposo. Serve una strumentazione temporanea (`window.__irfRenders`) che **non viene
   committata** (§2 del `CLAUDE.md`); quando non c'e', il braccio riporta `null` invece di
   inventare un numero.

Il corpo del selettore e' O(feature + annotation) di sole letture di dizionario, contro la
firma esistente che fa un `JSON.stringify` **per feature** (`useIRFormView.ts:79`): il
sovrapprezzo per dispatch e' una frazione di cio' che gia' gira.

## 8. Non-regressione: previsto, e poi misurato

- **`_tmp_txt1_verify.ts`: 21/21 ALL GREEN**, zero errori di pagina. I quattro preset del
  braccio E restano intatti (`scrollHeight <= clientHeight`, due righe restano due), il tetto
  A3 del braccio D pure, e il braccio F continua a mostrare che `renderer=code` vince e che
  togliendolo la growtext torna.
- **`_tmp_txt1_recon.ts`: 14/16**, con i rossi sui bracci **4** e **5b** — l'inversione gia'
  dichiarata da TXT1 Fase 2 §8, che misurava la PRESENZA del buco delle larghezze. IRF1 non
  la muove.
- **I quattro preset** non sono toccati: nessuna riga di `irFormStyle.scss`, di
  `formAutoLayout.ts` o di `jjform/themes.ts` entra nel diff.

### 8.1 Una previsione di questo referto che la misura ha smentito

La prima stesura di questo paragrafo prevedeva che il **braccio G** di `_tmp_txt1_verify.ts`
— «anche la chiave VECCHIA non ridisegna la form da sola» — sarebbe diventato **rosso**,
essendo la misura del buco che IRF1 chiude. **E' rimasto verde**, ed e' giusto cosi': quel
braccio scrive `jjodel/renderer=code` su un `EString`, e §4.1 ha misurato che quella
dichiarazione **non cambia nulla a schermo** (`WIDTH_MAP.code` e' `{span: 6, widget: 'code'}`,
cioe' quello che il campo gia' era, e `code` non e' un extended widget). Le tre letture del
braccio G, prima / dopo la scrittura / dopo il nudge, sono infatti byte per byte identiche:

```
ctrlBefore     {"cols": 6, "cls": "…ir-field__control"}
ctrlNoNudge    {"cols": 6, "cls": "…ir-field__control"}
ctrlAfterNudge {"cols": 6, "cls": "…ir-field__control"}
```

Il braccio G non misura la latenza ne' prima ne' dopo: e' **vacuo su entrambi i lati**. Il
suo secondo `check` lo era gia' per costruzione (§10). La chiave vecchia e' misurata qui dal
braccio C con `renderer=swatch`, che una differenza a schermo ce l'ha — 6 colonne -> 3 in
260 ms, contro il budget di 6000 ms scaduto senza cambiamenti prima del rimedio.

## 9. Corsie

- **AUTO1** e' atterrato (`05e9001d0`) e ha toccato `viewpoint/ir/useFormWidgets.ts:314-325`
  (`isAutoIdAttr`). IRF1 **non tocca quel file**: nessuna sovrapposizione.
- **CRUD2** lavora su `components/abstract/tabs/` (manager). Nessuna sovrapposizione.
- **EGO1** e' in albero non committato su `components/abstract/tabs/egoDiagram.scss` e il suo
  test. Nessuna sovrapposizione: l'indice va usato per pathspec (P6), e il commit di IRF1
  nomina i propri file.
- Nessun altro worktree, nessuna modifica non committata sotto `viewpoint/ir/`.

## 10. Domande aperte

- Il braccio G di `_tmp_txt1_verify.ts` ha un `check` con una clausola `|| cols === 6` che lo
  rende vero sempre (§4.1). La sonda non e' committata e non e' nel perimetro; segnalato qui
  perche' chi la rigirera' non lo scopra due volte.
- Restano aperte, invariate, le tre voci di `discovery_2026-09-01_txt1_fase2_multiline.md` §9
  che non sono questa: export Ecore delle annotation, `DAnnotationDetail`, `richtext`.

---

## 11. Il rimedio, e la misura dopo

Un file di prodotto, `IRForm.tsx`, tre punti:

| punto | cosa |
|---|---|
| import | `ROW_VIEW_ANNOTATION_PREFIX` da `../../nodes/rowViewAnnotations` — il formato di filo resta di un solo proprietario |
| `annotationSignature` | una `useSelector` che cammina `features -> instanceof -> annotations -> source`, tiene le sole `source` col prefisso, e le concatena chiavate per metafeature |
| deps | `annotationSignature` aggiunta a `[slots, spec, resolution, offer]` |

Piu' l'intestazione del file, che diceva «Reactivity comes entirely from `useIRFormView`» e
adesso dice cosa quella firma non vede. `describeSlots`, `describeSlot`, `useFormWidgets`,
`useIRFormView`, `autoLayoutRows` e i widget non sono toccati.

`_tmp_irf1_verify.ts`, stessa sonda dei tre rossi di §4: **12/12 ALL GREEN**, zero errori di
pagina.

| braccio | prima | dopo |
|---|---|---|
| B `multiline` -> growtext, senza nudge | budget 6000 ms scaduto, `span 6`, `input` | **254 ms**, `span 12`, `textarea.ir-growtext` |
| C `renderer=swatch`, chiave vecchia | budget scaduto, `span 6` | **260 ms**, `span 3` |
| D il `clear` riporta all'input | non misurabile (B non era mai partito) | **254 ms**, `span 6`, `input` |

### 11.1 Il costo, misurato invece che stimato

Strumentazione temporanea (`window.__irfRenders`, un contatore in testa al corpo di
`IRForm`), montata per la misura e **tolta prima del commit** — `grep` su `frontend/src/`
dopo la rimozione: zero occorrenze.

| gesto | render PRIMA del rimedio | render DOPO |
|---|---|---|
| edit di un valore su uno slot (gesto NON pertinente) | 5 -> 6, **+1** | 8 -> 9, **+1** |
| 4 s a riposo, nessun gesto | 6 -> 6, **0** | 9 -> 9, **0** |

**Delta zero su entrambi.** Il selettore gira a ogni dispatch — come ogni `useSelector` — ma
restituisce la stessa stringa, e `react-redux` non ridisegna. Misurato anche a monte, dal
braccio E: la firma delle annotation e' byte per byte identica prima e dopo l'edit del valore.

I due conteggi assoluti differiscono (5 contro 8) perche' fra A ed E, dopo il rimedio, i
bracci B / C / D provocano ciascuno una re-render che prima non avveniva: e' il rimedio che
funziona, non un sovrapprezzo.

## 12. Le sei mutazioni

Un test che non diventa rosso non pinna niente. Ogni punto portante e' stato girato e
rimesso.

| # | mutazione | rossi |
|---|---|---|
| 1 | la firma guarda il solo array di puntatori (niente `source`) — **sull'app, con la sonda** | **1**: il braccio **D**. B e C restano verdi — che e' esattamente la cecita' prevista in §4.2, mostrata invece che affermata |
| 2 | `annotationSignature` tolta dalle deps della memo | 1 |
| 3 | il prefisso riscritto a mano invece che importato | 1 |
| 4 | la firma non chiavata per metafeature (`parts.push(source)`) | 1 |
| 5 | la firma allargata dentro `useIRFormView` invece che qui (la via scartata (a)) | 1 |
| 6 | la `source` non letta, solo i puntatori — la mutazione 1 sulle unita' | 2 |

Ripristino: **14/14** sull'unita', **12/12** sulla sonda.

## 13. I gate

- `npx tsc --noEmit` su output **completo**, exit 2: **33** righe `error TS` — la baseline di
  `CLAUDE.md` §17, invariata. Zero errori nei file toccati.
- `npm run build`: **exit 0**, zero occorrenze di `error`, solo il warning di chunk noto.
- `vitest` su `viewpoint/ir/__tests__/` + `nodes/__tests__/`: **631/631**, 24 file.
- `vitest` su `jjform/__tests__/`: **16 rossi su 352**, e **non sono di IRF1**. Sono di una
  corsia CRUD2 che sta scrivendo in questo stesso albero: `create.test.ts` (+207 righe) e
  `outline.test.ts` (+40) sono modificati non committati, i rossi nominano
  `setDraftRefMany` / `draftTargets` / `draftModel`, e `setDraftRefMany` **non esiste** in
  `jjform/create.ts`. Test davanti alla loro implementazione, non una regressione.
  Il diff di IRF1 non tocca un solo file sotto `src/jjform/`.

## 14. Un incidente di sessione, e cosa lo ha causato

Durante i gate, per provare che i 16 rossi fossero pre-esistenti, ho lanciato

```
git stash push -- <un file tracciato> <un file NON tracciato>   # fallisce, in silenzio
git stash pop                                                    # spara il pop sullo stash sbagliato
```

`git stash push` con un pathspec che include un file **non tracciato** fallisce senza creare
nulla; l'output era rediretto a `/dev/null`, quindi il fallimento non si e' visto. Il `pop`
successivo ha quindi aperto `stash@{0}`, che era **«full WIP pre-reconstruction retry
2026-07-28»**, riversando in albero 7 file in conflitto.

Riparato: i 7 file riportati a HEAD uno per uno, zero marker di conflitto residui, lista
degli stash **invariata** (git conserva la entry quando il pop non si chiude), e il lavoro
non committato delle altre due corsie — EGO1 su `abstract/tabs/`, CRUD2 su
`jjform/__tests__/` — verificato intatto.

Regola che ne esce, e che vale al di la' di questa sessione: **un `git stash push -- <paths>`
non si redirige a `/dev/null` e il suo exit status si controlla**, perche' il `pop` che segue
non ha modo di sapere che lo stash che apre non e' quello che credevi di aver creato. E per
dimostrare che un rosso e' pre-esistente lo stash non serviva affatto: bastava — ed e' quello
che alla fine ha dato la prova — leggere il diff non committato dei file rossi e cercare
l'implementazione che i loro nomi invocano.

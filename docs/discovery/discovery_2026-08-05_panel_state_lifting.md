# Discovery 2026-08-05 — Sollevamento dello stato UI dai sotto-editor al pannello

**Tipo**: discovery read-only, HEAD `709004102` (branch `alfonso-frontend-jjtl`, working tree pulito
all'apertura e alla chiusura). Nessun file sorgente toccato. Task **1.2** del backlog; continuazione
diretta di `docs/discovery/discovery_2026-08-04_tab_map_authority_triage.md`.

**Obiettivo**: mappare quale stato UI vive dentro i tre pannelli di authoring IR e i loro sotto-editor,
quale si perderebbe allo smontaggio imposto dalla partizione della barra a cinque tab, e cosa costa
sollevarlo al pannello. Il report non progetta il sollevamento: fornisce il materiale su cui decidere.

**Nota sui riferimenti**: i due documenti di ratifica citati dal prompt
(`claude/ratifiche_2026-08-04_tab_partizione.md`, `claude/ratifiche_2026-08-02_eobj_object_as_edge.md`)
**non esistono nel repo**: non c'è alcuna directory `claude/` sotto `/Users/alfonso/jjodel`, e nessun
file `ratifiche_*` è raggiungibile dal filesystem locale. Le invarianti ratificate sono quindi assunte
nella forma in cui il prompt le enuncia; ogni verifica di questo report è fatta contro il **codice**.

---

## Ipotesi che questa discovery sta falsificando

1. *«La partizione introduce il rischio di perdere lo stato transiente dei sotto-editor.»*
   → **Falsificata nella forma prevista.** I sotto-editor **non hanno stato transiente**: tutti e nove
   sono componenti controllati puri, senza un solo `useState` (§1.2). Lo stato transiente esiste, ma
   vive **solo nei tre pannelli**, e il rischio di perderlo **esiste già a HEAD** — smontare l'attuale
   tab IR lo perde esattamente come lo perderebbe un cambio tab dopo la partizione (§0). La partizione
   non crea il buco: ne moltiplica la frequenza da un gesto raro a un gesto ordinario.

2. *«Il caso peggiore è che una compilazione a metà dei capi finisca nell'`ir` come scrittura
   parziale.»*
   → **Falsificata.** `applyEndpoints` (`EdgeAuthoringPanel.tsx:162-176`) rende la scrittura atomica
   **per costruzione**: o entrambe le chiavi entrano nell'`ir`, o nessuna delle due. Nessun percorso
   dell'UI produce un `ir` con un solo capo. Il caso peggiore è un altro, ed è **peggiore**: la perdita
   silenziosa dell'`ir` di un capo **già committato** quando l'autore ne svuota l'altro, con la view che
   torna viva come reference-as-edge (§2.4).

3. *«Il draft è frammentato fra pannello e sotto-editor, e va unificato.»*
   → **Falsificata.** Il draft è già uno solo per pannello, e i tre pannelli sono mutuamente esclusivi
   (`ViewData.tsx:89-102` è una route su `ir.kind`). La distanza dall'invariante non è nel numero di
   draft: è nei **tre atomi di stato che in `EdgeAuthoringPanel` vivono fuori dal draft** e ne
   costituiscono una sorgente di verità parallela (§3.2).

4. *«Il debounce di 300 ms a livello di pannello è un obiettivo da raggiungere.»*
   → **Falsificata: è già così.** `COMMIT_DEBOUNCE_MS = 300` è dichiarato identico nei tre pannelli
   (`VertexAuthoringPanel.tsx:34`, `RowAuthoringPanel.tsx:27`, `EdgeAuthoringPanel.tsx:27`) e usato in
   un solo `setTimeout` per pannello. Resta da unificare la **costante** (tre dichiarazioni), non il
   comportamento.

---

## File letti (path completi, tutti sotto `/Users/alfonso/jjodel`)

**Pannelli di authoring** (integrali):
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (356 righe)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (338)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (626)
- `frontend/src/components/editor-v2/viewpoint/authoring/EnableIRPanel.tsx` (149)

**Sotto-editor di authoring** (integrali):
- `.../authoring/MatchingSection.tsx` (167), `.../authoring/LabelListEditor.tsx` (77),
  `.../authoring/LabelEntryEditor.tsx` (118), `.../authoring/TextSourceEditor.tsx` (88),
  `.../authoring/TextStyleField.tsx` (197), `.../authoring/TextStyleEditor.tsx` (274),
  `.../authoring/FieldCompartmentListEditor.tsx` (270), `.../authoring/FieldSegmentEditor.tsx` (79),
  `.../authoring/BadgeListEditor.tsx` (118)

**Widget del design-system** montati sotto i pannelli:
- `frontend/src/components/ui/ListEditor/ListEditor.tsx` (96), `ui/ConditionalEditor/ConditionalEditor.tsx`
  (151), `ui/PathBuilder/PathBuilder.tsx` (148), `ui/PredicateBuilder/PredicateBuilder.tsx` (335, testa +
  grep hook), `ui/ColorPicker/ColorPicker.tsx` (92), `ui/Toggle/Toggle.tsx` (135),
  `ui/NumberInput/NumberInput.tsx` (79), `ui/Input/Input.tsx` (:1-80), `ui/index.ts`

**Host dei tab e montaggio**:
- `frontend/src/components/editors/views/ViewData.tsx` (249, integrale)
- `frontend/src/components/editors/Info.tsx` (:1180-1220)
- `frontend/src/components/editors/views/NestedView.tsx` (:493)

**IR core (per il protocollo dei capi e i campi non autorati)**:
- `frontend/src/components/editor-v2/viewpoint/ir/irTypes.ts` (:1-290)
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts` (:370-410)
- `frontend/src/components/editor-v2/viewpoint/ir/irResolveCore.ts` (:115-170)
- `frontend/src/components/editor-v2/viewpoint/ir/irEdgeViews.ts` (:185-190)
- `frontend/src/components/editor-v2/viewpoint/ir/irValidate.ts` (25, integrale)
- `frontend/src/components/editor-v2/viewpoint/ir/irDefaults.ts` (:26-95)
- `frontend/src/view/viewElement/view.tsx` (:484, `set_ir`)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/edgeAuthoring.test.ts` (:150-265)
- `frontend/src/components/editor-v2/viewpoint/authoring/__tests__/rowAuthoring.test.ts` (grep struttura)

**Precedenti (§7)**:
- `frontend/src/components/editor-v2/ActiveEditorContext.tsx` (:1-59)
- `frontend/src/components/editor-v2/contexts/EditorContext.tsx` (31, integrale)
- `frontend/src/components/editor-v2/contexts/HighlightContext.tsx` (:1-55)
- `frontend/src/components/Settings/UnifiedSettingsModal/UnifiedSettingsModal.tsx` (:1-140)
- `frontend/src/components/GlobalDrawer/SettingsDrawerContent.tsx` (:21-45)

Grep globali eseguiti su `frontend/src`: `useState|useRef|useReducer` sull'albero di authoring e sui
widget; `useReducer` sull'intero sorgente (**0 occorrenze**); `createContext` (9 file);
`isObjectAsEdge` (3 siti di prodotto + 6 di test); `activeTab|activeSection` (host a tab).

---

## §0 Premessa: chi smonta cosa, oggi

Prima di classificare lo stato, va fissato **quando** i pannelli si smontano. Sono tre eventi distinti,
e solo il primo è quello che la partizione moltiplica.

| evento | effetto sul pannello | sito |
|---|---|---|
| **cambio tab** dentro il pannello Properties | il corpo del tab attivo è l'**unico** montato: `activeDescriptor.render()` produce una sola sottostruttura. Cambiare tab smonta il pannello di authoring per intero | `ViewData.tsx:145`, `:149`, `:204` |
| **cambio della view selezionata** | `ViewData` è montato con `key={selectedView.id}` in entrambi gli host → **remount completo**, incluso il reset di `activeTab` | `Info.tsx:1208-1209`; `NestedView.tsx:493` |
| **aggiornamento Redux** (commit dell'`ir`, edit su un altro pannello) | nessuno smontaggio: `connect` ri-renderizza in place | `ViewData.tsx:240-243` |

Due conseguenze che valgono per tutto il resto del report.

**(a) Il buco esiste già a HEAD.** Oggi il tab IR è uno solo, quindi lo smontaggio a metà authoring
richiede un gesto laterale (andare su Style, o su Apply to). Dopo la partizione lo stesso identico
smontaggio avviene passando da `Structure` a `Text` — cioè **dentro** il flusso di lavoro normale. La
partizione non introduce un rischio nuovo: rende ordinario un rischio oggi occasionale.

**(b) L'effetto di reset `[view.id]` è ridondante ai due mount site attuali, non morto.**
`VertexAuthoringPanel.tsx:65-70`, `RowAuthoringPanel.tsx:59-64` ed `EdgeAuthoringPanel.tsx:124-133`
rileggono il seed quando cambia `view.id`. Poiché entrambi gli host montano `ViewData` con una `key`
sull'id della view, `view.id` non cambia mai **dentro** un'istanza montata: l'effetto scatta solo al
mount, dove ripete ciò che gli inizializzatori di `useState` hanno già fatto (un render in più).
Tornerebbe load-bearing se un host futuro montasse `ViewData` senza `key`.

---

## §1 Censimento dello stato locale

### §1.1 I tre pannelli

Legenda della classificazione:
- **derivabile** — il valore si ricalcola a ogni mount da una fonte persistita; la colonna *derivazione*
  dice **da dove**;
- **transiente** — esiste solo prima del commit e non è ricostruibile dall'`ir`;
- **incerto** — con la ragione.

| # | sito | hook | contiene | classificazione | derivazione / motivo |
|---|---|---|---|---|---|
| V1 | `VertexAuthoringPanel.tsx:53` | `useState<VertexViewIR>` | `draft` — clone profondo dell'`ir` + gli edit non ancora committati | **transiente (delta)**, derivabile solo nella parte già committata | il seed è `clone((view as any).ir ?? defaultObjectViewIR())` (`:51`). Ciò che si perde allo smontaggio è **la sola differenza fra `draft` e `view.ir`**: gli edit degli ultimi < 300 ms, o **tutti** gli edit fatti da quando la validazione fallisce (§3.3) |
| V2 | `VertexAuthoringPanel.tsx:54` | `useState<string\|null>` | `error` — messaggio di `validateIR` | **derivabile dal draft**, non dall'`ir` | ricalcolato a `:75` come `validateIR(view.id, draft)`. Con draft = `ir` è sempre `null` (l'`ir` committato è già passato dal gate). Se il draft viene sollevato, `error` lo segue gratis; se **non** viene sollevato mentre il draft sì, resta a `null` su un draft invalido (`:74` esce prima di validare quando `dirtyRef` è falso) |
| V3 | `VertexAuthoringPanel.tsx:61` | `useSelector` (non stato locale) | `advanced` — mode globale | **derivabile** | Redux `state.advanced`, scritto da `BottomBar`/`ProfileSection`/`LockedFeature`. Non si perde per definizione: non è stato del componente |
| V4 | `VertexAuthoringPanel.tsx:62` | `useRef<boolean>` | `dirtyRef` — «l'utente ha davvero editato» | **transiente e load-bearing** | non deriva da nulla. Vale `false` al mount **per costruzione del seed**; è la guardia che impedisce di ricommittare ciò che si è appena letto (`:74`). Se il draft sopravvive al mount e `dirtyRef` no, il commit pendente **non parte più** e l'errore non viene ricalcolato |
| R1 | `RowAuthoringPanel.tsx:54` | `useState<RowViewIR>` | `draft` | come V1 | seed `:52` |
| R2 | `RowAuthoringPanel.tsx:55` | `useState<string\|null>` | `error` | come V2 | `:69` |
| R3 | `RowAuthoringPanel.tsx:56` | `useRef<boolean>` | `dirtyRef` | come V4 | `:68` |
| E1 | `EdgeAuthoringPanel.tsx:111` | `useState<EdgeViewIR>` | `draft` | come V1 | seed `:109` |
| E2 | `EdgeAuthoringPanel.tsx:112` | `useState<string\|null>` | `error` | come V2 | `:138` |
| E3 | `EdgeAuthoringPanel.tsx:116` | `useState<EdgeNature>` | `nature` — `'reference' \| 'object'`, **scelta dell'autore** | **transiente** | l'inizializzatore è `natureOf((view as any).ir)` (`:65-67`), che ritorna `'object'` **solo se entrambi i capi sono già nell'`ir`**. Durante la compilazione del primo capo la scelta «object» **non è nell'`ir`** e non è ricostruibile: al remount la nature torna `'reference'` e la sezione «Capi» sparisce dal DOM (è gated su `isObject`, `:500`) |
| E4 | `EdgeAuthoringPanel.tsx:117` | `useState<string>` | `sourceExpr` — PathExpr del capo sorgente | **transiente** | seed `(view as any).ir?.edge?.source ?? ''`. Per il protocollo atomico (§2) l'espressione **non entra nell'`ir` finché anche l'altra non è usabile**: nella finestra di compilazione la sua unica copia è questo `useState` |
| E5 | `EdgeAuthoringPanel.tsx:118` | `useState<string>` | `targetExpr` | **transiente** | simmetrico a E4, seed `:118` |
| E6 | `EdgeAuthoringPanel.tsx:119` | `useRef<boolean>` | `dirtyRef` | come V4 | `:137` |
| X1 | `EnableIRPanel.tsx:57` | `useState<string\|null>` | `error` del seed | derivabile (sempre `null` al mount) | `:102` |
| X2 | `EnableIRPanel.tsx:61` | `useState<'vertex'\|'row'\|'edge'>` | `kind` del seed da creare | **transiente**, **fuori perimetro** | scelta prima di premere «Abilita»; nessuna traccia persistita. Ma `EnableIRPanel` è il ramo `!ir` (`ViewData.tsx:102`) e la partizione riguarda le view **con** `ir`: la perdita qui è un clic, non lavoro (§8, R5) |
| H1 | `ViewData.tsx:145` | `useState<TabId>` | `activeTab` | derivabile/navigazionale | fuori dai pannelli; è lo stato che la partizione moltiplica da 7 a 5 valori |
| H2 | `ViewData.tsx:156` | `useState<HTMLElement\|null>` | `headerSlot` — nodo DOM del portal | derivabile | `document.querySelector('.properties-panel-header__actions')` a `:158`, rifatto a ogni mount |

**La lista che conta è di cinque righe**: **V4, R3, E6** (`dirtyRef`), **E3** (`nature`), **E4/E5**
(i due capi). Più il **delta** di V1/R1/E1, che è transiente per la finestra descritta in §3.3.

### §1.2 I sotto-editor: zero stato, verificato

Grep `useState|useRef|useReducer|React.use*` su `authoring/*.tsx` e sui widget montati: **le uniche
occorrenze in tutto l'albero sotto i pannelli sono tre**, e nessuna contiene dati dell'`ir`.

| componente | stato | contiene | classificazione |
|---|---|---|---|
| `TextStyleField.tsx:104-106` | `open`, `triggerRef`, `popoverRef` | apertura del popover Tipografia + due ref DOM | **transiente, senza lavoro dentro**: chiudendo si perde solo la posizione del popover. Il valore `TextStyle` è tutto nel draft del pannello, via `onChange` |
| `ui/ColorPicker/ColorPicker.tsx:38` | `text` | hex **parzialmente digitato** | **transiente**: `onChange` è chiamato solo su hex valido (`:54`), quindi `#33` non è mai nel draft. Ri-sincronizzato dal valore controllato a `:41-43` |
| `ui/Toggle/Toggle.tsx:62` | `internalChecked` | fallback non-controllato | **morto in questo albero**: ogni uso nei pannelli passa `checked`, quindi `isControlled` (`:66`) è sempre vero |

**Senza stato** (verificato per lettura, non per grep soltanto): `MatchingSection`, `LabelListEditor`,
`LabelEntryEditor`, `TextSourceEditor`, `TextStyleEditor`, `FieldCompartmentListEditor`,
`FieldSegmentEditor`, `BadgeListEditor`, `ui/ListEditor`, `ui/ConditionalEditor`, `ui/PathBuilder`,
`ui/PredicateBuilder`, `ui/Input`, `ui/Select`, `ui/NumberInput`, `ui/FormSection`.

Due casi meritano una riga in più, perché *sembrano* stato e non lo sono:
- `ui/PathBuilder` **ricostruisce** feature/take/index a ogni render da `value` (`parseExpr`, `:36-42`,
  su `singleHopOf`): il widget non ricorda nulla di ciò che si è digitato — anche a componente montato,
  la sua verità è la stringa che riceve.
- `ui/ConditionalEditor` deriva il modo Fixed/Conditional dalla **forma del valore** (`:51-54`), non da
  uno stato: passare a conditional è già una scrittura nel draft (`:84`).

**Conseguenza operativa**: il sollevamento non tocca i sotto-editor. Sono già sollevati.

---

## §2 Il caso edge: protocollo della scrittura atomica

### §2.1 Dove si accumulano i due capi

`sourceExpr` (`:117`) e `targetExpr` (`:118`) sono `useState` del pannello, **non** campi del draft. Il
commento che li introduce (`:113-115`) lo dichiara: *«The endpoints live here (and not only in the
draft) because they are written atomically»*. I due `PathBuilder` sono cablati su di essi
(`value={sourceExpr}` a `:508`, `value={targetExpr}` a `:520`) e ogni `onChange` chiama
`applyEndpoints` passando **la coppia completa** (`:510`, `:522`).

### §2.2 La condizione che fa scattare la scrittura

`applyEndpoints(nextSource, nextTarget)` (`:162-176`), nell'ordine esatto:

1. `setSourceExpr(nextSource); setTargetExpr(nextTarget)` (`:163-164`) — **lo stato locale si muove
   sempre**, anche quando l'`ir` non si muoverà;
2. `const edge = { ...draft.edge }` (`:165`);
3. se `isUsableEndpointExpr(nextSource) && isUsableEndpointExpr(nextTarget)` (`:166`) → scrive
   **entrambe** le chiavi; **altrimenti** `delete edge.source; delete edge.target` (`:170-171`);
4. early return se `edge.source === draft.edge.source && edge.target === draft.edge.target` (`:174`) —
   *«The local expressions moved but the ir did not: no commit, no recompile»*;
5. altrimenti `patch({ ...draft, edge })` (`:175`) → `dirtyRef = true` + `setDraft` (`:148-151`).

`isUsableEndpointExpr` (`:78-81`) è vero per una stringa non vuota che non termina in `.values`.

Il commit vero è a valle, nell'effetto `:136-146`: se `dirtyRef`, `validateIR(view.id, draft)` (`:138`),
e **solo se valido** un `setTimeout` di 300 ms che esegue `(view as any).ir = draft` (`:142`) — replace
immutabile dell'oggetto intero via `set_ir` → `SetFieldAction` (`view.tsx:484`).

**Cosa viene scritto in una sola azione**: l'**intero oggetto `ir`**, non la coppia di capi. La coppia è
atomica perché `applyEndpoints` non produce mai un draft con una sola chiave; la scrittura è atomica
perché è sempre un whole-object replace.

### §2.3 La domanda operativa: cosa resterebbe di una compilazione a metà

Scenario: view edge in natura `reference` (l'`ir` non ha capi). L'autore passa a `object`, compila il
**capo sorgente**, e a questo punto il pannello viene smontato (cambio tab).

Traccia riga per riga:

- `changeNature('object')` (`:183-192`) → `setNature('object')`; il ramo object si limita a togliere
  `reference` dal draft se presente (`:187-190`). **Non tocca `sourceExpr`/`targetExpr`.** Se
  `reference` era assente, `patch` **non viene chiamato**: nessun dirty, nessun commit.
- `applyEndpoints('$src.value', '')` → passo 3 va nel ramo `else`: `delete edge.source; delete
  edge.target`. Poiché nel draft non c'erano, al passo 4 `undefined === undefined` per entrambi →
  **early return**. `patch` non viene chiamato, `dirtyRef` resta `false`, nessuna validazione, nessun
  timer.
- Smontaggio. La cleanup dell'effetto (`:144`) non ha timer da cancellare. `sourceExpr` e `nature`
  muoiono con il componente.
- Remount: `useState` rilegge il seed. `natureOf(ir)` → `'reference'` (`:65-67`, richiede entrambi);
  `sourceExpr` → `''` (`:117`).

**Risposta: non resta nulla.** Si perdono tre cose insieme — il path digitato, la scelta di natura, e la
visibilità stessa del campo (la sezione «Capi» è gated su `isObject`, `:500`, quindi al ritorno l'autore
non vede nemmeno *dove* stava lavorando). E si perdono **senza alcun segnale**: nessun errore, nessun
dirty, nessun warning — perché dal punto di vista del pannello non era ancora successo niente.

Va detto con precisione: **questo vale già oggi**, uscendo dal tab IR verso Style o Apply to. La
partizione lo rende raggiungibile passando da `Structure` a `Text`.

### §2.4 Il caso simmetrico: confermato, e con un percorso raggiungibile che il prompt non prevedeva

Il prompt chiede di confermare o smentire che **un capo scritto e uno no** produca `isObjectAsEdge =
false` e quindi una reference-as-edge **viva**.

**Confermato, per lettura del codice, in tre passaggi:**

1. `irCompile.ts:381-382`: `compileExpr` ritorna `null` per espressione assente o vuota; `:391`
   `isObjectAsEdge: !!(sourceExpr && targetExpr)` — serve che **entrambe** compilino.
2. `irResolveCore.ts:125`: `if (compiledE.isObjectAsEdge)` decide **solo** in quale bucket entra la
   view. Nel ramo `false` la entry finisce in `edgeWildcard` (`:134`) o nei bucket per metaclasse: cioè
   **nell'indice delle reference-as-edge, viva a tutti gli effetti**, a stilare gli edge M1 uscenti da
   quella metaclasse.
3. `irEdgeViews.ts:185`: il resolver object rifiuta comunque (`if (!cv || !cv.sourceExpr ||
   !cv.targetExpr) continue`), quindi la PathExpr superstite è **compilata e mai letta**.

Il commento del pannello (`:155-161`) descrive quindi esattamente il rischio reale, e la protezione
funziona: **nessun percorso dell'UI produce un `ir` con un solo capo** — `applyEndpoints` droppa
entrambe le chiavi, `changeNature('reference')` (`:193-200`) le droppa entrambe. È blindato anche dai
test: `edgeAuthoring.test.ts:153`, `:159`, `:165`.

**Ma c'è un percorso che il prompt non nomina e che è peggiore, perché passa da una scrittura
committata.** Partendo da una object-as-edge **funzionante** (entrambi i capi nell'`ir`):

- l'autore svuota il capo sorgente → `applyEndpoints('', '$tgt.value')` → ramo `else` → **delete di
  entrambe le chiavi** → il draft ora differisce → `patch` → validate ok → dopo 300 ms
  **`view.ir = draft` scrive davvero**: l'`ir` perde **anche il capo destinazione, che era valido e
  committato**;
- da quell'istante la view è **viva come reference-as-edge** (§2.4 punti 1-3): non è uno stato neutro,
  è **un'altra notazione**, e sul canvas gli oggetti tornano nodi mentre le loro reference vengono
  stilate;
- `nature` locale resta `'object'` (nessuno l'ha cambiata), quindi **il pannello continua a mostrare la
  sezione Capi** con il campo destinazione ancora pieno: l'UI e l'`ir` divergono;
- allo smontaggio successivo `natureOf` rilegge `'reference'` e `targetExpr` torna `''`. **Il capo
  destinazione è perso in tutte e due le sedi.**

Questa non è una scrittura parziale — l'atomicità regge. È la **cancellazione atomica di una coppia
valida come effetto collaterale dell'edit di un solo campo**. Il sollevamento dello stato non la
risolve; la sposta soltanto (con lo stato sollevato, `targetExpr` sopravvive al cambio tab, ma l'`ir`
resta comunque svuotato). Va registrata come questione a sé (§8, Q2).

Nota simmetrica minore: `changeNature('object')` non re-semina `sourceExpr`/`targetExpr` dal draft. Un
`ir` che arrivasse con un solo capo da un import o da una fixture verrebbe letto al mount, mostrato in
natura `reference`, e nella UI **non sarebbe visibile da nessuna parte** — la sezione Capi non è
renderizzata. Round-trippa verbatim e resta invisibile. La validazione non lo intercetta:
`irValidate.ts:17-21` delega a `compileEdgeView`, che la coppia non la verifica.

---

## §3 Il draft e il debounce

### §3.1 Dove vive il draft, oggi

**Uno per pannello, nessuno nei sotto-editor.** Tre siti, mutuamente esclusivi:

| pannello | draft | seed | commit |
|---|---|---|---|
| vertex | `VertexAuthoringPanel.tsx:53` | `:51` | `:78-82` |
| row | `RowAuthoringPanel.tsx:54` | `:52` | `:72-74` |
| edge | `EdgeAuthoringPanel.tsx:111` | `:109` | `:141-143` |

La mutua esclusione è strutturale: `ViewData.tsx:89-102` è una catena ternaria su `ir.kind` che monta
**un solo** pannello. Due draft non coesistono mai — nemmeno oggi, nemmeno per un render.

Tutti i sotto-editor ricevono `value` + `onChange` e riemettono strutture immutabili: `LabelListEditor`
(`:35-51`), `FieldCompartmentListEditor` (`:106-122`), `BadgeListEditor` (`:33-49`), `ListEditor` (che
si autodichiara *«Pure UI: it owns no state»*, `:26`). La catena arriva fino in fondo: un carattere
digitato in un letterale dentro un segmento di un compartment risale fino a `patch` del pannello.

### §3.2 La distanza reale dall'invariante

L'invariante «un solo draft a livello di pannello» **è già rispettata**. La distanza è altrove, ed è di
**un file e circa 35 righe**:

`EdgeAuthoringPanel` tiene **tre atomi fuori dal draft** — `nature` (`:116`), `sourceExpr` (`:117`),
`targetExpr` (`:118`) — che descrivono lo stesso dato che il draft descrive (`draft.edge.source/target`)
e che con esso possono **divergere** (§2.4). I siti che li mantengono:

| ruolo | sito | righe |
|---|---|---|
| dichiarazione | `:116-118` | 3 |
| ri-derivazione al reset | `:126-130` | 5 |
| scrittore unico dei capi | `applyEndpoints` `:162-176` | 15 |
| scrittore della natura | `changeNature` `:183-201` | 19 |
| lettori | `isObject` `:263`; gate sezione `:500`; `value=` dei PathBuilder `:508`,`:520`; error inline `:512`,`:524` | 6 |

Nulla li tiene allineati al draft se non la disciplina di `applyEndpoints`: non c'è un effetto di
sincronizzazione, non c'è un invariante controllato a runtime. **È l'unico punto di tutta la superficie
di authoring in cui esistono due sorgenti di verità per lo stesso dato.**

Per il resto: `dirtyRef` è triplicato (`Vertex:62`, `Row:56`, `Edge:119`) e `COMMIT_DEBOUNCE_MS = 300`
è dichiarato tre volte (`Vertex:34`, `Row:27`, `Edge:27`). Sono duplicazioni di **codice**, non di
stato: il comportamento è già quello ratificato.

### §3.3 Il debounce vale davvero 300 ms — e ha una cleanup che cancella

`return () => clearTimeout(t)` (`Vertex:83`, `Row:75`, `Edge:144`) gira quando cambiano le dipendenze
`[draft, view.id]` **e allo smontaggio**. Da qui due finestre di perdita, di natura diversa:

- **finestra breve, universale**: un edit fatto meno di 300 ms prima dello smontaggio **non viene mai
  scritto**. Vale per ogni campo di ogni pannello, non solo per i capi. È stretta ma reale: un clic su
  un altro tab subito dopo l'ultimo carattere la centra.
- **finestra illimitata, condizionale**: se `validateIR` fallisce (`:76`/`:70`/`:139`), l'effetto esce
  **prima** di schedulare (`:77`/`:71`/`:140`). Finché il draft resta invalido **nessun edit viene mai
  committato**, e allo smontaggio si perde tutto il lavoro accumulato da quando è comparso l'errore. Il
  pannello mostra l'`ErrorText`, ma non dice che uscendo si perde ciò che si vede.

---

## §4 Le due convenzioni che dipendono dal draft unico

### §4.1 Il drop della chiave: dov'è, e cosa succede con draft separati

La convenzione — *rimuovere la chiave invece di scrivere `undefined`, così che l'`ir` resti
byte-identico a uno autorato senza quel campo* — è implementata **undici volte**, sempre come
rest/spread o `delete` su una copia:

| convenzione | sito | forma |
|---|---|---|
| predicate (vertex) | `MatchingSection.tsx:64-68` | `const { predicate, ...rest } = draft` |
| predicate (row) | `RowAuthoringPanel.tsx:177-180` | idem |
| predicate (edge) | `EdgeAuthoringPanel.tsx:328-331` | idem |
| reference (edge) | `EdgeAuthoringPanel.tsx:314-316` | idem |
| capi (edge) | `EdgeAuthoringPanel.tsx:169-172` | `delete edge.source; delete edge.target` |
| natura → reference | `EdgeAuthoringPanel.tsx:195-199` | idem |
| label center | `EdgeAuthoringPanel.tsx:356-364` | droppa `center`, e `labels` se resta vuoto |
| ramo `else` di un conditional | `ConditionalEditor.tsx:132-133` | ricostruisce `{when, then}` |
| assi tipografici | `TextStyleEditor.tsx:39-46` (`setAxis`) | droppa la chiave, e collassa l'intero `TextStyle` a `undefined` |
| filtro children | `FieldCompartmentListEditor.tsx:56-58` (`withChildFilter`) | ricostruisce `{from:'children'}` nudo |
| sorgente compartment | `FieldCompartmentListEditor.tsx:44-48` | ricostruisce la sola chiave `from` |

**Cosa succede se due tab scrivono lo stesso oggetto `ir` con draft separati.** La domanda ha una
risposta netta perché il commit è un **whole-object replace** (`view.ir = draft`, non un merge):

- **draft simultanei** (due tab montati insieme, per esempio tenuti in vita per non perdere lo stato):
  chi committa per ultimo **riscrive l'oggetto intero con il proprio clone**. Ogni chiave droppata dal
  tab A riappare quando committa il tab B, che l'aveva clonata prima del drop; ogni chiave aggiunta da A
  sparisce. Il drop della chiave **non è idempotente rispetto a un secondo scrittore**: è per
  costruzione un'operazione sull'oggetto *intero*.
- **draft sequenziali** (tab smontati al cambio, come oggi): il clobber **non** può avvenire, perché la
  cleanup cancella il timer del tab uscente prima che scriva. Ma è esattamente il meccanismo che perde
  il lavoro (§3.3).

**È il vero contenuto della decisione.** Tenere i tab montati per preservare lo stato reintroduce il
clobber; smontarli evita il clobber e perde lo stato. L'unica via che evita entrambi è quella
ratificata: **un draft solo, sopra i tab**, con un solo timer e un solo `validateIR`.

### §4.2 I campi che sopravvivono solo per round-trip

Sono i campi che **nessun pannello autora** e che restano nell'`ir` unicamente perché il draft parte da
un clone dell'oggetto intero (`clone` è `JSON.parse(JSON.stringify(x))`, `Vertex:38`, `Row:31`,
`Edge:52`) e viene riscritto intero. Se un tab committasse la sola propria fetta, sparirebbero in
silenzio.

**Vertex** (`VertexViewIR`, `irTypes.ts:123-135`):

| campo | autorato? | note |
|---|---|---|
| `irVersion` | **no** | nessun writer in nessun pannello |
| `kind` | **no** | idem; è il discriminante del route `ViewData.tsx:89-102` |
| `metaclasses`, `predicate`, `priority`, `exclusive` | sì, **solo in Advanced** | `MatchingSection`, gated `advanced` (`:337`). In Basic sono invisibili e round-trippano |
| `fieldCompartments`, `shape.badges` | sì, **solo in Advanced** | `:310-333`, con commento esplicito (`:307-309`, `:322`) |
| `label`, `resizable`, `shape.form`, `shape.fill`, `shape.border`, `shape.labels` | sì | sempre visibili |

**Row** (`irTypes.ts:225-234`):

| campo | autorato? | note |
|---|---|---|
| `irVersion`, `kind` | **no** | |
| `visible` | **solo se già presente** | il blocco è gated `draft.visible !== undefined` (`:313`), col commento *«never seeded here → verbatim»*. Un `visible` assente non è creabile dal pannello |
| tutti gli altri | sì | |

**Edge** (`irTypes.ts:187-215`) — la lista più lunga:

| campo | autorato? | note |
|---|---|---|
| `irVersion`, `kind` | **no** | |
| `exclusive` | **no** | dichiarato sul tipo (`:194`) ma non compilato per gli edge: `irResolveCore.ts:168` lo legge solo nel ramo vertex/graphVertex. Scritto da nessuno, letto da nessuno |
| `label` | **no** | l'unico `label` che il pannello edge autora è `edge.labels.center`, che è un'altra cosa |
| `edge.routing` | **no** | compilato (`irCompile.ts:401`) e portato in `CompiledEdgeView.routing` |
| `edge.labels.placement` | **no** | compilato (`irCompile.ts:403`, default `'auto'`) |
| `edge.persistWaypoints` | **no** | compilato (`irCompile.ts:404`, default `true`); governa la persistenza dei waypoint |
| tutti gli altri (`metaclasses`, `reference`, `predicate`, `priority`, `edge.source/target/line/terminations/labels.center`) | sì | |

Due precisazioni utili al prompt di Fase 2:

- **il docstring di `EdgeAuthoringPanel` è invecchiato**: `:100-101` elenca fra i campi non toccati
  *«object-as-edge source/target, routing, persistWaypoints»*, ma i capi sono autorati da E-obj. La
  lista corretta oggi è `irVersion`, `kind`, `exclusive`, `label`, `edge.routing`,
  `edge.labels.placement`, `edge.persistWaypoints`.
- **il round-trip è già blindato da test**: `edgeAuthoring.test.ts:207-236` e `:238-265` pinnano
  esplicitamente `routing` e `persistWaypoints` come «fields the panel does not author must round-trip
  verbatim». Sono l'oracolo pronto per verificare che un eventuale sollevamento non li perda.

Oltre ai campi, round-trippano verbatim anche **le forme non rappresentabili in Basic**, che i
sotto-editor mostrano come chip di sola lettura e non riscrivono mai: la forma multi-regola di un
conditional (`ConditionalEditor.tsx:57-58`), un conditional in modo Basic (`:64-67`), `editable` come
oggetto-widget (`LabelEntryEditor.tsx:79-80`, `FieldSegmentEditor.tsx:65-66`), un `source.from`
sconosciuto e un filtro children non-`isKind` (`FieldCompartmentListEditor.tsx:188`, `:196`).

---

## §5 Le tre dipendenze cross-tab

Tutte e tre sono **già calcolate a livello di pannello**, nessuna dentro il sotto-editor che le mostra.
È la buona notizia del punto: il calcolo non va spostato, va solo deciso **dove si mostra il risultato**
quando produttore e consumatore finiscono su tab diversi.

### §5.1 PathBuilder disabilitato per assenza di metaclasse

- **Calcolo**: memo `featureInfo` del pannello — `VertexAuthoringPanel.tsx:103-161`,
  `RowAuthoringPanel.tsx:89-140`, `EdgeAuthoringPanel.tsx:209-260`. Ritorna `features: null` quando
  `draft.metaclasses` è `'*'`, non è un array, o è vuoto (`Vertex:109-111` e omologhi).
- **Consumo**: `PathBuilder.tsx:56-64` — con `features === null` non renderizza i select, renderizza il
  solo `disabledHint`. Il testo arriva dal pannello: `FEATURES_HINT` (`Vertex:35`, `Row:28`, `Edge:28`)
  e, per i capi, `ENDPOINT_FEATURES_HINT` (`Edge:29`).
- **Perché diventa cross-tab**: `metaclasses` va in `Applies to`; i `PathBuilder` vivono in `Text`
  (sorgenti di label e segmenti) e in `Structure` (capi dell'edge, `Edge:506`, `:518`). Il memo dipende
  anche da `view.appliableToClasses`, che è dato di `Applies to` (`Vertex:161`, dep `JSON.stringify`).
- **Nota**: `EdgeAuthoringPanel` ne deriva un secondo consumatore nello stesso memo — `refOptions`
  (`:305-312`) si popola da `features.references`. Con metaclasse assente il picker Reference resta
  vuoto, e l'`HelpText` che lo spiega è a `:457`.

### §5.2 Wildcard più natura object

- **Calcolo**: `isWildcard = mcs === '*'` (`Edge:291`, dal draft) e `isObject = nature === 'object'`
  (`:263`, dallo stato locale E3). Entrambi a livello di pannello.
- **Consumo**, tre siti in `Applies to` e uno che ne dipende:
  - il toggle wildcard è **disabilitato** quando la natura è object: `disabled={isObject}` (`:406`);
  - `HelpText` esplicativo quando object (`:408-410`);
  - `ErrorText` quando object **e** wildcard: *«sul substrato object non si applica a nulla»*
    (`:411-413`);
  - le etichette stesse cambiano: «Metaclasse dell'oggetto» vs «Metaclasse sorgente» (`:400`), e i due
    `HelpText` a `:428-430` e `:442-444`.
- **Perché diventa cross-tab**: la natura è ratificata in `Structure`, il wildcard è matching e va in
  `Applies to`. **È l'unico caso in cui un controllo di un tab è reso `disabled` da un valore che vive
  in un altro tab** — e quel valore (E3) è anche uno di quelli transienti. Il resolver conferma che il
  vincolo è reale: `irResolveCore.ts:126-133` popola `objectAsEdgeByMetaclass` **solo** se
  `ir.metaclasses !== '*'`, quindi una object-as-edge wildcard non finisce in alcun bucket.

### §5.3 Ambiguità di metaclasse fra metamodelli

- **Calcolo**: stesso memo `featureInfo`, campo `metamodelsWithClass` (`Vertex:126-141`, `Row:109-123`,
  `Edge:229-243`), con il pin d'identità da `appliableToClasses` (`Vertex:118-123`, riconfermato:
  il ciclo è esattamente a quelle righe).
- **Consumo**: un `ErrorText` in **testa al pannello** — `Vertex:208-212`, `Row:212-216`,
  `Edge:377-381`.
- **Perché diventa cross-tab**: la testa del pannello, dopo la partizione, non esiste più come luogo
  unico. L'avviso nasce da `metaclasses` (`Applies to`) + `appliableToClasses` (`Applies to`), ma il suo
  effetto pratico si subisce nei `PathBuilder` di `Text` e `Structure`.

---

## §6 Costo del sollevamento e rischio sui rami verificati

### §6.1 Cosa richiede ciascun pezzo transiente

| pezzo | cosa richiede | file toccati | cambia il comportamento osservabile di E-ref / E-obj? |
|---|---|---|---|
| `draft` (V1/R1/E1) | un owner sopra i tab che tenga draft + `dirtyRef` + il timer, e passi `draft`/`patch` ai corpi dei tab. I sotto-editor **non cambiano**: già puri | il pannello + il nuovo owner + `ViewData.tsx` (route) = **3** per kind | **no, se e solo se** il seed continua a girare una volta per `view.id` e non a ogni mount di tab. È l'unica condizione |
| `dirtyRef` (V4/R3/E6) | deve viaggiare **con** il draft, non replicato per tab | stesso file dell'owner | no. Ma separarlo dal draft **sì**: un draft che sopravvive con `dirtyRef` falso non committa più (`:74`/`:68`/`:137`) e non rivalida. È il pezzo che più facilmente si dimentica |
| `nature` (E3) | sollevata insieme ai capi: è funzione della stessa coppia | `EdgeAuthoringPanel.tsx` + owner | no, **purché non diventi un campo dell'`ir`**. `natureOf` (`:65-67`) e il commento `:56-61` la dichiarano derivata e mai persistita; introdurre un campo cambierebbe il discriminante `isObjectAsEdge` (`irCompile.ts:391`) e violerebbe R-1 di E-obj |
| `sourceExpr`/`targetExpr` (E4/E5) | sollevati **come coppia**, con `applyEndpoints` che resta **l'unico scrittore** | `EdgeAuthoringPanel.tsx` + owner = **2** | no, se l'atomicità resta dove sta. Sì, se il sollevamento tenta di scrivere i capi separatamente per «semplificare»: quello sarebbe il ramo E-obj che si rompe |
| `open` (TextStyleField) | nulla | 0 | no. Chiudere un popover al cambio tab è comportamento atteso |
| `text` (ColorPicker) | nulla | 0 | no. Al più si perde un hex parziale mai valido |

**Totale realistico**: 3 pannelli + 1 owner (nuovo) + `ViewData.tsx`. **Cinque file**, che è la soglia
della regola 19 di `CLAUDE.md` — il prompt di Fase 2 va scritto sapendolo. Zero file sotto `ui/`, zero
sotto-editor, zero file della critical zone.

### §6.2 Il sollevamento è dimostrabilmente neutro su E-ref ed E-obj?

Domanda che pesa, e la risposta non è un sì secco.

**Neutro, con evidenza:**
- I sotto-editor non cambiano: non hanno stato, quindi non c'è nulla da spostare e nessuna superficie di
  regressione (§1.2).
- Il write path resta `view.ir = draft` (`Edge:142`), un whole-object replace già coperto dai test di
  round-trip (`edgeAuthoring.test.ts:207-265`).
- Il discriminante `isObjectAsEdge` non viene toccato: vive nel compilatore (`irCompile.ts:391`), non
  nel pannello.

**Non dimostrabilmente neutro, e va detto invece di stimarlo neutro:**

1. **Il momento del seed.** Oggi il seed gira a ogni mount del pannello, e il mount coincide con
   «l'autore ha aperto il tab IR». Sollevando, il seed deve girare **una volta per `view.id`**: se
   girasse anche solo una volta di troppo (per esempio a un remount dell'owner), sovrascriverebbe il
   draft con l'`ir` committato — cioè produrrebbe **esattamente la perdita che il sollevamento vuole
   evitare**, ma in modo più difficile da vedere. Non è verificabile per lettura: dipende da dove
   l'owner viene montato in `ViewData`, che è codice ancora da scrivere.
2. **La divergenza UI/`ir` di §2.4 sopravvive al sollevamento e cambia forma.** Oggi si chiude allo
   smontaggio (l'UI torna coerente con l'`ir`, perdendo il lavoro). Con lo stato sollevato la
   divergenza **persiste** attraverso i cambi tab: il pannello mostrerebbe un capo destinazione che
   nell'`ir` non c'è più, potenzialmente per l'intera sessione di editing. È un cambiamento di
   comportamento osservabile su E-obj, e va deciso — non scoperto in Fase 2.
3. **La validazione diventa cross-tab.** `validateIR` è il gate unico del commit (`Edge:138-140`), e il
   suo `ErrorText` è renderizzato in testa al pannello (`:375`). Con un draft che sopravvive ai cambi
   tab, un draft invalido può essere prodotto in `Structure` e osservato da `Text`, dove la causa non è
   visibile. La ratifica lo prevede («validazione a livello di pannello riflessa dai tab»), ma la
   riflessione non esiste in codice: oggi il gate e il messaggio sono lo stesso punto.
4. **Il ramo Basic/Advanced resta asimmetrico.** `advanced` è letto **solo** da `VertexAuthoringPanel`
   (`:61`); `Row` ed `Edge` non lo leggono (riconfermato: nessun `useSelector` nei due file). Il vertex
   nasconde in Basic quattro sezioni intere (`:310`, `:323`, `:337`); gli altri due mostrano sempre
   tutto. Un owner comune ai tre kind eredita questa asimmetria e deve decidere per tutti e tre — è lo
   stesso R4 del report di tab map, che il sollevamento porta a maturazione.

**Sintesi onesta**: il sollevamento dei sotto-editor è neutro perché non c'è nulla da sollevare. Il
sollevamento del **draft** sopra i tab è neutro solo sotto la condizione (1), che oggi non è
verificabile; e i punti (2) e (3) sono **cambiamenti di comportamento reali**, piccoli ma osservabili,
sul ramo E-obj che è già stato verificato a video.

---

## §7 Precedenti in casa

**Non esiste, oggi, un pannello a tab che condivida un draft.** Verificato sui tre host a tab del
codebase:

| host | comportamento | sito |
|---|---|---|
| `ViewData` | monta il solo tab attivo, nessuno stato condiviso fra i corpi | `ViewData.tsx:145`, `:204` |
| `UnifiedSettingsModal` | `switch (activeSection)` su sezioni indipendenti, ciascuna col proprio stato | `UnifiedSettingsModal.tsx:75`, `:127-140` |
| `SettingsDrawerContent` | idem | `SettingsDrawerContent.tsx:21`, `:24` |

**Non esiste alcun `useReducer` in `frontend/src`** (grep globale: 0 occorrenze). Un reducer di pannello
sarebbe un pattern nuovo per questo codebase.

**Esistono invece tre precedenti di sollevamento**, in ordine di vicinanza al problema:

1. **I pannelli di authoring stessi.** È il precedente più forte e va nominato per primo: il draft sta
   nel pannello e **nove sotto-editor sono già componenti controllati puri** (`LabelListEditor`,
   `LabelEntryEditor`, `TextSourceEditor`, `TextStyleEditor`, `FieldCompartmentListEditor`,
   `FieldSegmentEditor`, `BadgeListEditor`, `MatchingSection`, più `ui/ListEditor`, che si autodichiara
   senza stato a `ListEditor.tsx:26`). `MatchingSection` è l'esempio canonico: riceve `draft` + `patch`
   e non tiene niente (`MatchingSection.tsx:14-20`, con il commento *«Presentational and stateless on
   the draft»* a `:29-31`). **Sollevare di un livello ancora significa applicare lo stesso pattern che
   il codebase già usa, non inventarne uno.**

2. **`ActiveEditorContext`** — `components/editor-v2/ActiveEditorContext.tsx:25-59`. Un provider che
   possiede `useState` + un `useRef<Map>` ed espone un'API stabile via context; i figli si registrano e
   si deregistrano. È il precedente più vicino a «un owner sopra i consumatori, con una superficie
   dichiarata», e mostra la forma già accettata in casa: `useState` nel provider, `useCallback`
   memoizzati, un `useMemo` sul value.

3. **`EditorContext`** — `components/editor-v2/contexts/EditorContext.tsx:20-30`, con provider a
   `EditorV2.tsx:3912`. Context nullable + due hook (`useEditorContext` che lancia, `useEditorContextSafe`
   che tollera l'assenza), usato per far arrivare callback (`takeSnapshot`, `selectEdge`) fino ai node
   type di React Flow, cioè attraverso un confine che le props non attraversano. È il precedente da
   citare **se e solo se** il corpo dei tab risultasse troppo distante per le props; per una gerarchia
   `owner → 5 tab` le props bastano, e `HighlightContext` (`contexts/HighlightContext.tsx:26-30`)
   mostra la variante ancora più leggera (provider + hook selettori, nessuna API).

**Non esiste un precedente per «tab montati ma nascosti»**: nessuno dei tre host usa `display:none` per
preservare lo stato di un tab inattivo. Se la Fase 2 sceglie quella strada, è un pattern nuovo — e
ricade nel clobber descritto in §4.1.

---

## §8 Rischi e domande aperte per Alfonso

**R1 — Il buco non è introdotto dalla partizione: è aggravato.** Ogni perdita descritta qui è
riproducibile a HEAD uscendo dal tab IR. La partizione cambia la probabilità, non la meccanica. Ne segue
che il sollevamento non è un costo *della* partizione: è un debito esistente che la partizione rende
esigibile.

**R2 — `dirtyRef` è il pezzo che si dimentica.** È un `useRef` senza rendering, invisibile in ogni
diff visuale. Sollevare il draft e lasciarlo indietro produce un pannello che **sembra** funzionare
(mostra il draft) e non committa più nulla, senza errore. Se la Fase 2 tocca il draft, deve toccare
`dirtyRef` nella stessa riga di prompt.

**R3 — La finestra di perdita per draft invalido è illimitata e non è segnalata.** Finché `validateIR`
fallisce, nessun edit raggiunge l'`ir` (`Edge:140`); allo smontaggio si perde tutto. L'`ErrorText` dice
che c'è un errore, non che uscendo si perde il lavoro. Vale già oggi, per tutti e tre i kind.

**R4 — Le tre politiche di disclosure restano divergenti** (§6.2 punto 4). Il vertex legge `advanced`,
row ed edge no. Un owner comune ai tre kind è il primo posto in cui la divergenza smette di essere
sostenibile.

**R5 — `EnableIRPanel` è fuori dal perimetro ma dentro lo stesso tab.** Oggi occupa il tab IR delle view
senza `ir` (`ViewData.tsx:102`) e tiene due `useState` (`:57`, `:61`). La partizione a cinque tab è
definita per le view **con** `ir`: va deciso che barra vede una view senza `ir` (probabilmente quella
vecchia), altrimenti `EnableIRPanel` finisce spalmato su cinque tab di cui riempirebbe uno.

### Domande

**Q1 — Dove vive l'owner del draft?** Due collocazioni possibili, con conseguenze diverse: (a) dentro
`ViewData`, che però è il componente dei tab *classici* e non conosce l'IR se non per il route
(`:89-102`); (b) un componente nuovo interposto fra `ViewData` e i cinque corpi, che possiede draft +
`dirtyRef` + timer + `validateIR` e monta il corpo attivo. La (b) tiene `ViewData` invariato e isola il
sollevamento, ma aggiunge un file. Non è una decisione tecnica sostituibile: dipende da quanto la
partizione debba restare confinata all'IR.

**Q2 — Lo svuotamento di un capo su una object-as-edge viva** (§2.4) **deve restare un drop atomico
silenzioso?** Oggi cancellare il capo sorgente cancella anche il destinazione dall'`ir` e riporta la
view a reference-as-edge, senza conferma. È coerente con l'atomicità ratificata, ma è l'unico punto in
cui **un edit di un campo cambia la notazione dell'intera view**. Alternative: chiedere conferma;
oppure trattenere il capo superstite nello stato sollevato e ripristinarlo se l'altro torna. La seconda
richiede che lo stato sia già sollevato — quindi la risposta a questa domanda cambia il valore del
task 1.2.

**Q3 — Con un draft che sopravvive ai cambi tab, dove si mostra l'errore di validazione?** Sul tab che
lo ha causato, su tutti, o sulla barra? La ratifica dice «validazione di pannello riflessa dai tab», ma
non esiste oggi alcun canale che dica *quale* tab è responsabile: `validateIR` ritorna una stringa
(`irValidate.ts:22`) prodotta dal compilatore, senza coordinate di campo.

**Q4 — L'avviso di ambiguità di metaclasse** (§5.3), oggi in testa al pannello, va su `Applies to`
(dove nasce) o su ogni tab che contiene un `PathBuilder` (dove si subisce)? È l'unico dei tre avvisi
cross-tab che oggi non ha una casa ovvia dopo la partizione.

**Q5 — Il toggle wildcard disabilitato dalla natura** (§5.2, `Edge:406`) è l'unica dipendenza
`disabled` fra due tab futuri. Si mantiene il `disabled` cross-tab (che l'utente vedrà come un controllo
bloccato senza causa visibile), o lo si converte in un errore di validazione a valle?

---

## Sintesi in tre righe

I sotto-editor non hanno stato: sono già nove componenti controllati puri, e il draft è già uno solo per
pannello, con il debounce già a 300 ms — la distanza dall'invariante ratificata è **un file e tre atomi
di stato**, `nature`/`sourceExpr`/`targetExpr` in `EdgeAuthoringPanel.tsx:116-118`, unica sorgente di
verità parallela al draft in tutta la superficie di authoring. La scrittura atomica dei capi regge:
nessun percorso dell'UI produce un `ir` con un solo capo, ma smontare il pannello a metà compilazione
perde il path, la natura e la visibilità stessa del campo — **e questo vale già a HEAD**, la partizione
lo rende soltanto ordinario. Il rischio non ovvio è un altro: svuotare un capo su una object-as-edge
viva cancella atomicamente anche l'altro, riportando la view a reference-as-edge senza conferma, con
l'UI che continua a mostrare il capo superstite.

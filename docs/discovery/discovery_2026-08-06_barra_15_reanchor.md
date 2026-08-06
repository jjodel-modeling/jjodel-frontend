# Discovery 2026-08-06 — Re-ancoraggio breve per la barra 1.5 (partizione a cinque tab, strada B)

**Tipo**: Fase 0 read-only del prompt `2026-08-06 12:27` (voce 4 della coda, slice 1.5). HEAD `061be4b5c`
(branch `alfonso-frontend-jjtl`). **Nessun file sorgente toccato.**

**Obiettivo**: verificare a HEAD le assunzioni del CONTESTO del prompt prima di implementare la
partizione della barra di `ViewData` in cinque tab (Applies to · Structure · Appearance · Text · Source)
per le view con `ir`, per strada B (tutti i corpi montati, gli inattivi `display: none`).

**Esito**: **hard stop sulla regola di uscita 1** — è scattata la prima guardia git del punto 4 di
"Prima di iniziare". Nessun codice toccato. Dettaglio in §Guardie. Le altre tre regole di uscita **non**
sono scattate: (2) è verde, (3) e (4) hanno solo scostamenti minori, elencati e con collocazione
proposta.

---

## Guardie git (punto 4 di "Prima di iniziare")

`git log --oneline -10` a HEAD:

```
061be4b5c docs: seed decisions.md with active binding decisions
423f19f01 feat(editor-v2): consume edge.routing in IR edges (manhattan/direct/bezier)
2f67ad8be chore(docs): sync CLAUDE.md with codebase reality
f15a22bd2 fix: anchor CLAUDE.md gitignore rule to repo root and land jjtl CLAUDE.md
d8159c2f0 fix: declare unsaved single-endpoint state and correct divergence messaging
59dfb096d refactor: extract edge endpoint helpers into a pure module
9518cb614 docs: land slice 0 log entry and discovery reports
e53a05cb6 chore(docs): rotate the prompt log, third batch
3e46ee608 fix(ir): exclude the authoring pin from the delegation comparison
6c75070a5 fix(styles): stop native checkboxes from swallowing their own click
```

`git status --short`:

```
 M docs/claude-code-log.md
?? CLAUDE-BAK-NOT-TO-USE.md
```

| guardia | esito |
|---|---|
| **1. `docs/claude-code-log.md` / `CLAUDE.md` / `.gitignore` modificati e non committati** | **SCATTATA** — `docs/claude-code-log.md` è ` M`. |
| 2. file bersaglio della Fase 1 sporco con WIP non di questa slice | **non scattata** — `git status --short` su `ViewData.tsx`, su tutto `viewpoint/authoring/` e su `nestedView.scss` è **vuoto**. |
| 3. commit di normalizzazione assente **E** file di log pulito | **non scattata** — la condizione richiede il file pulito, e il file non lo è. La normalizzazione **non è persa**: è esattamente il diff non committato (sotto). |

**Contenuto del diff non committato** (`+8 −5`, tre entry): è il micro-commit della normalizzazione del
log, mai atterrato. Riscrive `**Corregge**` / `**Causa**` in forma stretta e sposta la prosa in
`**Notes**` su tre entry:

- entry 2026-07-18: `**Corregge**: 2026-07-18` → `2026-07-18 00:00`, prosa spostata in `**Notes**`;
- entry R8 (2026-08-03): `**Corregge**: —`, `**Causa**: (c)`, prosa in `**Notes**`;
- entry R12 (2026-08-03): idem.

**Conseguenza operativa**: il commit `docs: normalize Causa in two 2026-08-03 log entries` non esiste; il
suo contenuto è nel working tree. Scrivere qui la entry di chiusura della 1.5 e fare
`git add docs/claude-code-log.md` trascinerebbe nel commit della 1.5 le modifiche di quel micro-commit —
cioè esattamente ciò che la guardia 1 esiste per impedire. Anche il secondo micro-commit atteso
(`chore: regenerate AGENTS.md`) non compare nel log.

**Nota fuori guardia**: `CLAUDE-BAK-NOT-TO-USE.md` è untracked alla root. Non è un file bersaglio e non è
nella lista della guardia 1; segnalato perché non risulta né in `.gitignore` né committato.

---

## File letti (path completi, tutti sotto `/Users/alfonso/jjodel`)

Integrali:
- `frontend/src/components/editors/views/ViewData.tsx` (256)
- `frontend/src/components/editor-v2/viewpoint/authoring/VertexAuthoringPanel.tsx` (392)
- `frontend/src/components/editor-v2/viewpoint/authoring/RowAuthoringPanel.tsx` (375)
- `frontend/src/components/editor-v2/viewpoint/authoring/EdgeAuthoringPanel.tsx` (688)
- `frontend/src/components/editor-v2/viewpoint/authoring/MatchingSection.tsx` (166)

Parziali:
- `frontend/src/components/editors/views/nestedView.scss` (:3582-3645)
- `frontend/src/components/editors/properties-with-tree-view.scss` (:340-395)
- `frontend/src/components/editors/views/data/viewapplyto.scss` (:14-60)
- `frontend/src/components/editors/views/data/InfoData.tsx` (:275-330)
- `frontend/src/components/editor-v2/viewpoint/ir/IRNodeContent.tsx` (:205-220, :270-282)
- `frontend/src/view/viewElement/view.tsx` (:1425-1440 `get_viewpoint`)
- `frontend/src/components/editor-v2/viewpoint/ir/metaclassPin.ts` (grep integrale sui riferimenti)

Report agli atti riletti: `docs/discovery/discovery_2026-08-04_tab_map_authority_triage.md` (integrale,
645 righe) e `docs/discovery/discovery_2026-08-05_panel_state_lifting.md` con l'addendum §10-§14
(integrale, 909 righe). Più `docs/decisions.md` e `docs/claude-code-log.md`.

Grep globali su `frontend/src`: `autoFocus|\.focus()|scrollIntoView`; `view-editor-tab` (`.scss` e
`.tsx`); `appliableToClasses`; `authoringMetaclassPins`.

---

## Esito punto per punto

### (a) `ViewData.tsx` — la barra oggi

| cosa | sito a HEAD |
|---|---|
| tipo `TabId` (7 valori) | `:34` |
| array `tabs: TabDescriptor[]` | apre `:72`, chiude `:149` |
| gate `showIRTab` | `:61` |
| descrittore del tab IR | `:91-112`, route per kind `:96-109` |
| ramo irraggiungibile «authoring non ancora disponibile» | `:102-108` (era `:95-101` alla discovery: **+7**) |
| `useState<TabId> activeTab` | `:152` |
| fallback `tabs.find(...) ?? tabs[0]` | `:156` |
| barra (`role="tablist"`, `.view-editor-tab-bar`) | `:195-209` |
| corpo (`role="tabpanel"`, `.view-editor-tab-content`), `activeDescriptor.render()` | `:210-212` |

**Il gate `view.isEdge !== true` resta, e vale solo sul ramo enable.** La condizione a `:61` è
`(ir?.kind === 'vertex') || (ir?.kind === 'row') || (ir?.kind === 'edge') || (isV && !ir && view.isEdge !== true)`:
le tre clausole IR non lo leggono, quindi una view **con** `ir` entra a prescindere da `isEdge`. Confermata
l'assunzione del prompt.

**Quali tab vede oggi una view con `ir`**: sei — Apply to (`:73`), Template (`:82`, `isV`), IR (`:91`),
Style (`:113`), Events (`:122`), Options (`:131`). Components è solo viewpoint (`:140`), e i viewpoint non
ricevono il tab IR.

**Conseguenza da mettere agli atti**: sostituire la barra per le view con `ir` rende **irraggiungibili**,
per quelle view, i corpi di Apply to / Template / Style / Events / Options. Il prompt lo prevede («i tab
legacy non compaiono più nella barra; i loro corpi e il loro codice restano dove sono»), ma tre controlli
che il triage del 2026-08-04 dava **autoritativi o incerti** vivono in Apply to (`InfoData.tsx`) e la
mappa R-5 non li accoglie: vedi (h) e la domanda **Q1**.

### (b) I tre pannelli a HEAD, mappati su R-5

Nota: `d8159c2f0` ha toccato `EdgeAuthoringPanel.tsx`; tutti i `file:riga` qui sotto sono **ri-ancorati a
HEAD**, non ripresi dai report.

**`VertexAuthoringPanel.tsx`** (392)

| sezione | righe | tab R-5 |
|---|---|---|
| `ErrorText` di `validateIR` | `:239` | **fuori dai corpi** (striscia, R-B) |
| `ErrorText` ambiguità metaclasse | `:245-249` | **fuori dai corpi** (R-B) |
| `FormSection` "General" → `draft.label` | `:255-260` | **orfano** → vedi O-1 |
| `FormSection` "Shape" (`shape.form`) | `:263-276` | Appearance |
| `FormSection` "Fill" | `:279-292` | Appearance |
| `FormSection` "Border" | `:295-304` | Appearance |
| `FormSection` "Sizing" (`resizable` + Propagate size) | `:308-330` | Appearance |
| `FormSection` "Labels" (`LabelListEditor`, con TextStyle) | `:333-342` | Text |
| `FormSection` "Field compartments" — gated `advanced` | `:347-357` | Structure |
| `FormSection` "Badges" — gated `advanced` | `:360-370` | Appearance |
| `MatchingSection` + HelpText di coda — gated `advanced` | `:374-387` | Applies to |

**`RowAuthoringPanel.tsx`** (375)

| sezione | righe | tab R-5 |
|---|---|---|
| intestazione «IR Row view authoring» + HelpText | `:245-246` | **chrome**, fuori dai corpi |
| `ErrorText` di `validateIR` | `:248` | fuori dai corpi |
| `ErrorText` ambiguità | `:250-254` | fuori dai corpi |
| Matching — metaclassi | `:256-293` | Applies to |
| Matching — predicate | `:295-318` | Applies to |
| Matching — priorità | `:320-328` | Applies to |
| Template (`ListEditor` di `TextSource`) | `:331-348` | Text |
| Visible (reso solo se `draft.visible !== undefined`) | `:350-364` | **orfano** → O-2 |
| Label (`draft.label`) | `:366-370` | **orfano** → O-1 |

Confermato: **nessun controllo di forma, fill, border, badge o compartimento** esiste nel pannello row.
Nascondere strutturalmente Structure e Appearance per la row (V1) non sottrae nulla: i corpi sarebbero
vuoti comunque.

**`EdgeAuthoringPanel.tsx`** (688)

| sezione | righe | tab R-5 |
|---|---|---|
| intestazione «IR Edge view authoring» + HelpText dipendente da `isObject` | `:409-412` | **chrome**, fuori dai corpi |
| `ErrorText` di `validateIR` | `:414` | fuori dai corpi |
| `ErrorText` ambiguità | `:416-420` | fuori dai corpi |
| **Natura** (`Select`, `changeNature`) | `:422-434` | Structure |
| Matching — metaclasse (Toggle wildcard `disabled={isObject}` a `:445`) | `:436-484` | Applies to |
| ↳ HelpText «object deve nominare una metaclasse» | `:447-449` | Applies to (cross-tab) |
| ↳ `ErrorText` wildcard **+** natura object | `:450-452` | Applies to (cross-tab, R-B) |
| Matching — **reference** | `:486-498` (solo `!isObject`) | **Structure** per R-5 → vedi Q2 |
| Matching — predicate | `:500-525` | Applies to |
| Matching — priorità | `:527-535` | Applies to |
| **Capi** (`PathBuilder` ×2 + i tre messaggi di divergenza) | `:537-579` (solo `isObject`) | Structure |
| ↳ `ErrorText` «capo che legge un array» ×2 | `:551-553`, `:563-565` | Structure (di campo) |
| ↳ HelpText a tre rami (R-D, C-1..C-4) | `:573-577` | Structure |
| **Linea** — colore / spessore / tratto | `:581-624` | Appearance |
| ↳ **Select Routing (E-route)** | `:625-638` | Appearance ✔ |
| Terminazioni — sorgente / destinazione | `:640-657` | Appearance |
| Label al centro (`edge.labels.center`) | `:659-683` | Text |

**Il Select Routing è l'ultimo campo della sezione «Linea»** (`:625-638`, opzioni `ROUTING_OPTIONS` a
`:55-59`, `setRouting` a `:373-384`), esattamente dove la mappa R-5 lo vuole (Appearance). Nessuno
spostamento fra sezioni: si sposta con il blocco «Linea».

**Controlli orfani rispetto alla mappa** (elencati come chiede la Fase 0, con collocazione proposta):

- **O-1 — `draft.label`** (`Vertex:255-260`, `Row:366-370`). È il campo `label` dell'IR, distinto sia da
  `DViewElement.name` sia da `shape.labels`. Non è matching, non è geometria, non è aspetto e non è testo
  reso. **Proposta**: Applies to, in coda, come campo di identità della view — è il compagno naturale della
  breadcrumb. *Alternativa*: Text, per omonimia con «label». Serve una conferma (Q3).
- **O-2 — `visible` della row** (`Row:350-364`). Reso solo quando la chiave è già presente
  (`draft.visible !== undefined`, mai seminata dal pannello). Governa *se* la row si rende, quindi è
  semanticamente vicino al matching. **Proposta**: Applies to. Nota: è l'unico controllo della row che, se
  finisse in Structure, verrebbe **nascosto strutturalmente** dalla matrice e diventerebbe irraggiungibile.
- **O-3 — «Propagate size»** (`Vertex:319-328`). Bottone, non campo; vive con `resizable`. **Proposta**:
  Appearance, insieme al blocco Sizing. Collocazione ovvia, elencata per completezza.
- **O-4 — chrome dei pannelli row ed edge** (`Row:245-246`, `Edge:409-412`). Intestazione + HelpText che
  descrivono il pannello nel suo insieme (per l'edge il testo dipende da `isObject`). **Proposta**: restano
  **fuori dai corpi**, sopra la striscia d'errore, sempre visibili — sono l'equivalente testuale del titolo
  del pannello.

**Nessuna delle quattro voci richiede di toccare stato o logica dei capi.** Sono blocchi JSX da collocare.

### (c) Striscia d'errore e i tre messaggi cross-tab

**`ErrorText` di `validateIR`** (quelli che R-B vuole fuori dai corpi, sempre visibili):
`Vertex:239`, `Row:248`, `Edge:414`. In tutti e tre è il **primo figlio** di
`<section className="properties-tab properties-panel">`, prima di ogni sezione. Restano dove sono: la
partizione raggruppa ciò che viene **dopo**.

I tre messaggi cross-tab nominati dal prompt:

| # | messaggio | dove nasce | dove si subisce | siti a HEAD |
|---|---|---|---|---|
| 1 | **PathBuilder disabilitato per assenza di metaclasse** | `metaclasses` → Applies to | `PathBuilder`/`ConditionalEditor` in **Text** e **Structure** | costanti `FEATURES_HINT` `Vertex:36`, `Row:29`, `Edge:38`; `ENDPOINT_FEATURES_HINT` `Edge:39`. Passate come `featuresHint=` / `disabledHint=` a ogni consumatore |
| 2 | **wildcard + natura object** | natura → **Structure** | toggle wildcard → **Applies to** | `ErrorText` `Edge:450-452`; HelpText `:447-449`; `disabled={isObject}` `:445` |
| 3 | **ambiguità di metaclasse fra metamodelli** | `metaclasses` (+ `appliableToClasses`) → Applies to | i `PathBuilder` di Text e Structure | `Vertex:245-249`, `Row:250-254`, `Edge:416-420` |

Il messaggio 3 è già in testa al pannello in tutti e tre: **resta nella striscia**, e va riformulato per
nominare il tab (R-B). I messaggi 1 e 2 sono **di campo** e viaggiano col campo nel suo corpo; vanno
riformulati per nominare il tab **altro** (quello dove sta la causa), non quello in cui si trovano.

### (d) Il gate `advanced` oggi

**Un solo lettore in tutto l'albero di authoring**: `VertexAuthoringPanel.tsx:62`
(`useSelector((s: any) => !!s.advanced)`). `RowAuthoringPanel` ed `EdgeAuthoringPanel` **non hanno alcun
`useSelector`** — confermato per lettura integrale. La divergenza R4 del report di tab map regge a HEAD.

Usi in `VertexAuthoringPanel`, divisi come li divide R-3:

| uso | sito | destino per R-3 |
|---|---|---|
| `allowConditional={advanced}` su Shape form | `:273` | **resta** (ramo Conditional) |
| `allowConditional={advanced}` su Fill | `:289` | **resta** |
| `allowConditional={advanced}` su `LabelListEditor` | `:339` | **resta** |
| gate di sezione **Field compartments** | `:347` | **si rimuove** → Structure raggiungibile in Basic |
| gate di sezione **Badges** | `:360` | **si rimuove** → Appearance in Basic |
| gate di sezione **Matching** | `:374` | **si rimuove** → Applies to in Basic |

**Come Source dovrà leggere `advanced`**: il tab Source va **omesso dalla barra** in Basic, e la barra è
costruita in `ViewData` — quindi il flag serve **in `ViewData`**, non (solo) nei pannelli. `ViewData` è
`connect`esso (`mapStateToProps` a `:231-239`, `interface StateProps` a `:222-227`, **non esportata**):
la via minima è aggiungere `advanced: state.advanced` a `StateProps` e leggerlo lì. Il fallback
`tabs.find(t => t.id === activeTab) ?? tabs[0]` (`:156`) copre già il passaggio Advanced→Basic con Source
attivo: la barra si riaggancia al primo tab senza stato vuoto.

Con il flag in `ViewData` **non serve introdurre `useSelector` in Row ed Edge**: il corpo Source può
riceverlo come prop, e la selezione del tab lo gatta a monte. Il `useSelector` esistente di Vertex resta
com'è.

### (e) `autoFocus` / `focus()` / `scrollIntoView` — premessa di R-A

```
grep -rn "autoFocus|\.focus()|scrollIntoView" components/editor-v2/viewpoint/authoring/  → ZERO
grep -rn "autoFocus|\.focus()|scrollIntoView" components/ui/                             → ZERO
```

**La premessa di R-A regge: zero occorrenze nel perimetro.**

Due occorrenze esistono nel `viewpoint/` più largo, ed è giusto nominarle per non lasciarle scoprire dopo:
`components/editor-v2/viewpoint/ir/IRNodeContent.tsx:215` e `:277`. Sono gli `<input>` dell'**edit inline
sul nodo del canvas** (label intrinseca e valore di riga), entrambi con `onFocus={(e) => e.target.select()}`.
Vivono nell'albero **IR di esecuzione**, montato su React Flow, mai dentro un corpo di tab del pannello
Properties: nessuno dei due finisce sotto un `display: none` della barra. Fuori perimetro, nessun impatto
su R-A.

### (f) `.view-editor-tab*` in SCSS — e un vincolo strutturale che il prompt non nomina

Classi esistenti, tutte riusabili senza rinomina (regola 2):

| classe | dichiarazione | note |
|---|---|---|
| `.view-editor-tabs` | `nestedView.scss:3582-3590` | colonna flex, `overflow: hidden` |
| `.view-editor-tab-bar` | `nestedView.scss:3592-3604` | `flex-wrap: nowrap` + `overflow-x: auto`, scrollbar nascosta. **Regge cinque tab senza modifiche**: la barra scorre invece di andare a capo |
| `.view-editor-tab` | `nestedView.scss:3606-3627` | base, `:hover`, `.active` (accento cyan `#0ea5e9`). Nessuno stato d'errore, nessuno slot per badge — coerente con R-B, che i badge non li vuole |
| `.view-editor-tab-content` | `nestedView.scss:3629+` | `overflow-y: auto`, padding verticale |
| override della card Properties | `properties-with-tree-view.scss:351`, `:353-364` | ridefinisce font-size e padding della barra e del tab |

**Vincolo strutturale — il combinatore figlio diretto.** Due regole, entrambe con `!important`, danno al
corpo del pannello **tutto** il suo padding orizzontale, e sono ancorate a un figlio **diretto**:

```scss
// viewapplyto.scss:28-33
.view-editor-tab-content > section.properties-tab.properties-panel { padding: 12px 16px !important; }
// properties-with-tree-view.scss:367-369
.view-editor-tab-content > section.properties-tab.properties-panel { padding: 16px 20px !important; }
```

I tre pannelli hanno per radice esattamente `<section className="properties-tab properties-panel">`
(`Vertex:238`, `Row:244`, `Edge:408`). **Quindi**: raggruppare i cinque corpi **dentro** quella `section`
mantiene il `>` soddisfatto e il padding intatto; interporre un qualsiasi wrapper **fra**
`.view-editor-tab-content` e la `section` lo rompe, e i tre pannelli perdono il loro padding su entrambi
gli host. È il rischio di regressione visiva più concreto della slice, ed è invisibile a `tsc`.
Registrato come **R-1** sotto.

Nessun identificatore nuovo è necessario per la barra. Se servisse una classe per i corpi (es.
`.ir-tab-body`), grep preventivo: `ir-tab-body` → 0 occorrenze in tutto `frontend/src`.

### (g) Breadcrumb — i nomi sono a portata del pannello: **sì**, con una riserva

- **viewpoint**: `LViewElement.viewpoint` è un getter L (`view.tsx:1061` dichiarazione, `:1427-1436`
  `get_viewpoint`). Risale la catena `father` **fino alla radice** e ritorna l'`LViewPoint`. I pannelli
  ricevono `view: LViewElement`, quindi `view.viewpoint?.name` è leggibile **senza plumbing nuovo**.
- **questa view**: `view.name`, già usato da `ViewData:187`.
- **parent**: `view.father`. Ed è qui la riserva.

**Riserva**: `viewpoint` e `parent view` scrivono **lo stesso campo `father`** — `InfoData.tsx:306` e
`:323`, due `Select` con `field={'father'}`, il primo con `getter={() => vpid}` e il secondo senza. È la
**Q3 del report di tab map, tuttora aperta**. Poiché `get_viewpoint` risale la catena fino alla radice,
quando `father` punta direttamente al viewpoint il segmento "parent" **coincide** con il segmento
"viewpoint", e la breadcrumb a tre segmenti degenera in `VP › VP › view`.

**Proposta**: rendere il segmento intermedio **solo quando** `view.father?.id !== view.viewpoint?.id`,
cioè breadcrumb a due segmenti nel caso comune e a tre solo per una view figlia di un'altra view. Non
richiede plumbing né decisioni di schema. Se anche questo sembra prematuro finché Q3 è aperta, la
breadcrumb si rinvia (COSA 4 lo prevede) — vedi **Q4**.

### (h) `Applicable to` (`appliableToClasses`) — e i due controlli che restano senza casa

**Dove si rende oggi**: `InfoData.tsx:281-294`, dentro il tab **Apply to**, come `Select`
multi-select su `field={'appliableToClasses'}`.

**Il passo 1.4 NON è atterrato**: `git log` su `InfoData.tsx` non ha commit recenti di rimozione (l'ultimo
è `915d07241`, migrazione a `JjSelect`), e il controllo è integro a HEAD.

**Con la partizione smette semplicemente di essere mostrato per le view IR, e non c'è niente da spostare**:
confermato, ma con una precisazione che cambia il verdetto del vecchio rischio R2 del tab map. Il pin
d'identità della 1.3 vive ora **dentro l'IR** (`draft.authoringMetaclassPins`) e la catena di risoluzione
è pins → appliesTo → candidates (`metaclassPin.ts:138`, consumata da `Vertex:155-159`, `Row:138-142`,
`Edge:244-248`). Quindi `appliableToClasses` è ormai **solo il fallback** per le view autorate prima del
pin: non mostrarlo più non regredisce il PathBuilder sulle view che hanno un pin proprio.

**Ma il pin non ha alcuna superficie di UI.** `grep authoringMetaclassPins` su tutto `frontend/src` dà
solo `metaclassPin.ts`, `irTypes.ts`, `irDefaults.ts` e le tre `useMemo` dei pannelli: **nessun
componente lo rende**. La voce «il pin di identità landato con la 1.3» della mappa R-5 per Applies to non
corrisponde quindi ad alcun controllo esistente: non c'è niente da collocare, a meno di costruire UI
nuova — che questa slice non prevede. Registrato come **Q3**.

**I due controlli che restano davvero senza casa** (conseguenza di (a), non di (b)):

| controllo | sito | verdetto tab map 2026-08-04 | dopo la 1.5, per una view IR |
|---|---|---|---|
| **Name** (`DViewElement.name`) | `InfoData.tsx` (tab Apply to) | **autoritativo** (unico writer; letto da albero, header, seed IR) | **non più raggiungibile dal pannello**. La card mostra il nome in sola lettura (`ViewData:187`) |
| **Viewpoint** (`father`) | `InfoData.tsx:297-312` | **autoritativo** — `irResolveCore.ts:113` filtra l'indice su `d.viewpoint !== vp` | **non più raggiungibile**. La breadcrumb di COSA 4 è **read-only** e non lo sostituisce |

La mappa R-5 di Applies to non li elenca. Sono la vera divergenza fra la mappa e HEAD — non nei pannelli
(punto b), ma nel tab legacy che la barra smette di mostrare. Vedi **Q1**.

### (i) `git status` dei file bersaglio

`git status --short` su `ViewData.tsx`, `components/editor-v2/viewpoint/authoring/` (tutta la directory) e
`components/editors/views/nestedView.scss`: **output vuoto — tutti puliti**. Nessun WIP di altre lane sui
bersagli della Fase 1.

---

## Dipendenze e rischi

**R-1 — Il combinatore `>` del padding (§f).** Interporre un wrapper fra `.view-editor-tab-content` e la
`section.properties-tab.properties-panel` dei pannelli disattiva due regole `!important` e fa collassare il
padding orizzontale di tutti e tre i pannelli, su entrambi gli host. **Vincolo di implementazione**: i
cinque corpi si raggruppano **dentro** la `section` esistente, che resta figlia diretta del contenitore.

**R-2 — Chi possiede `activeTab`, e il remount da evitare.** La barra vive in `ViewData` (`:195-209`),
i corpi nel pannello: `activeTab` (`:152`) resta in `ViewData` e scende al pannello come prop. Perché la
strada B funzioni, il pannello **non deve rimontarsi** al cambio tab. Con l'attuale
`activeDescriptor.render()` (`:211`) questo si ottiene se i cinque descrittori IR ritornano lo **stesso**
elemento `<PanelX view={view} activeTab={activeTab} />` nella stessa posizione dell'albero: React
riconcilia per tipo+posizione e il pannello resta montato con draft, `dirtyRef`, timer e i tre atomi dei
capi intatti. Se invece ogni descrittore ritornasse un elemento diverso, il pannello si rimonterebbe a ogni
click e la slice **non risolverebbe nulla** (sarebbe l'opzione C del report 1.2). È il punto da verificare
per primo in Fase 1.

**R-3 — Le props dei tre pannelli.** `VertexAuthoringPanelProps` (`:17-19`),
`RowAuthoringPanelProps` (`:24-26`), `EdgeAuthoringPanelProps` (`:33-35`) sono interfacce **esportate**.
La regola 11 di `CLAUDE.md` ammette solo l'aggiunta di proprietà **opzionali**: `activeTab?` e `advanced?`
vanno dichiarate opzionali, con il comportamento attuale come default quando assenti.

**R-4 — Conteggio file.** `ViewData.tsx` + tre pannelli = **4**. Con lo SCSS, **5**. Sotto la soglia della
regola 19 (>5), senza margine: qualunque quinto/sesto file va dichiarato prima.

**R-5 — Il tab Style diventa irraggiungibile per le view IR** (conseguenza di (a)). È esattamente il
rischio R3 del tab map: un progetto salvato con `cssIsGlobal = true` e una regola annidata `!important`
continua a ridipingere i nodi IR, e dopo questa slice **non esiste più una superficie da cui accorgersene**
per quelle view. Non è un difetto di questa slice — è il costo, già ratificato, della sostituzione della
barra. Va nominato nella entry di log perché la 1.6 non lo scopra come sorpresa.

**R-6 — `TextStyleField` e la strada B.** Confermato: `TextStyleField` è l'unico sotto-editor con
`useState` e con un popover in `createPortal`, e il suo listener `mousedown` in fase di cattura lo chiude a
ogni click fuori — cliccare un header di tab è quel caso. Con V2 (barra solo cliccabile, nessuna
navigazione da tastiera) la copertura è completa. Il punto 7 della checklist della voce 5 lo verifica.

---

## Domande aperte per Alfonso

**Q1 — Name e Viewpoint restano senza casa.** Dopo la 1.5 una view IR non ha più alcuna superficie per
rinominarsi né per cambiare viewpoint, e il viewpoint **decide l'indice del resolver**
(`irResolveCore.ts:113`). La mappa R-5 non li elenca in Applies to; la breadcrumb è read-only. Tre uscite:
(a) aggiungerli in coda ad Applies to in questa slice (allarga il COSA); (b) accettare la perdita per la
durata dell'arco e rimediarla nella 1.6, sapendo che le view IR sono «quasi tutto il parco view» dopo la
migration 2.226; (c) tenere il tab legacy **Apply to** anche per le view IR, come sesto elemento della
barra, fino alla 1.6. **Non procedo senza una scelta**: nessuna delle tre è deducibile dal prompt.

**Q2 — La reference dell'edge in Structure.** R-5 assegna «natura, capi PathExpr e **reference**» a
Structure, ma a HEAD la reference (`Edge:486-498`) è un criterio di **matching** — restringe quali
reference M1 la view stila, ed è sotto l'intestazione «Matching» insieme a metaclasse, predicate e
priorità. Seguo la mappa (reference → Structure, il resto del Matching → Applies to), il che **spezza in
due** un blocco oggi contiguo. Confermi, o la reference segue il resto del matching in Applies to?

**Q3 — «Il pin di identità landato con la 1.3» non ha UI.** `authoringMetaclassPins` è un campo dell'IR
riconciliato dentro `withMetaclassPins`, senza alcun componente che lo renda (§h). In Applies to non c'è
niente da collocare. Intendevi (a) niente — la voce della mappa è già soddisfatta dal fatto che il pin
viaggia con il matching; (b) una UI nuova, fuori dallo scope di questa slice; oppure (c) il controllo
legacy `Applicable to`, che è l'input storico del pin?

**Q4 — Breadcrumb, tre segmenti o due.** I nomi sono a portata (§g), ma `viewpoint` e `parent` scrivono lo
stesso campo `father` (Q3 del tab map, aperta), quindi il caso comune renderebbe `VP › VP › view`. Procedo
con il segmento intermedio condizionale (`father !== viewpoint`), o la rinvio come COSA 4 consente?

**Q5 — O-1 e O-2** (§b): `draft.label` in Applies to o in Text; `visible` della row in Applies to (in
Structure sarebbe nascosto strutturalmente e diventerebbe irraggiungibile). Confermi le proposte?

---

## Sintesi in tre righe

La Fase 0 è verde sulle assunzioni che rendono sicura la strada B — zero `autoFocus`/`focus()`/
`scrollIntoView` nel perimetro, pannelli e `ViewData` puliti nel working tree, Select Routing già dov'è la
mappa lo vuole, classi SCSS riusabili senza rinomina — e la partizione non richiede di toccare una riga di
`applyEndpoints`, `changeNature`, del seed o dei tre `useState` dei capi. Restano un vincolo di
implementazione non ovvio (il combinatore `>` che dà il padding ai tre pannelli: i corpi vanno raggruppati
**dentro** la `section` esistente) e cinque domande, di cui **Q1 è bloccante**: sostituire la barra rende
irraggiungibili Name e Viewpoint, due controlli che il triage del 2026-08-04 dà autoritativi e che la
mappa R-5 non accoglie. L'esecuzione è comunque ferma alla **guardia git 1**: il micro-commit di
normalizzazione del log non è atterrato e il suo diff è nel working tree, quindi qualunque
`git add docs/claude-code-log.md` da qui lo trascinerebbe nel commit della 1.5.

---

# Addendum 2026-08-06 — esiti dell'emendamento 1 (prompt `2026-08-06 12:50`)

Non riscrive nulla del report: registra le decisioni che l'emendamento ha preso sulle domande
aperte, e le collocazioni effettivamente scelte, con i `file:riga` **dopo** l'implementazione
(commit della 1.5 `fd92b3d1c` più questo).

## Q1 — ratificata: Applies to assorbe i controlli autoritativi (R-H)

Name e i due select del `father` sono ricollocati **verbatim** in testa al corpo Applies to di tutti
e tre i pannelli. Verbatim in senso stretto: stessi componenti — l'`Input` e il `Select` di `joiner`
legati per `data`/`field`, **non** quelli di `components/ui` — stesse props, stesso markup, stessi
tooltip, stesso write path.

| controllo | origine (legacy) | destinazione |
|---|---|---|
| Name | `InfoData.tsx:152-159` | `irTabs.tsx:110-117` (`IRIdentityFields`) |
| Viewpoint | `InfoData.tsx:297-312` | `irTabs.tsx:119-134` |
| Parent view | `InfoData.tsx:314-328` | `irTabs.tsx:136-150` |

Montati da `VertexAuthoringPanel.tsx:274`, `RowAuthoringPanel.tsx:280`, `EdgeAuthoringPanel.tsx:445`.

**Il doppio writer di `father` viaggia intatto e non è corretto qui**: i due `Select` scrivono lo
stesso campo senza setter custom. Registrato, non toccato.

**`readOnly` è preservato**: `ViewData` passa il proprio `readOnly` (`!debug && Defaults.check(view.id)`),
quindi su una default view i tre campi restano di sola lettura come in `InfoData`. Senza questo, la
ricollocazione avrebbe aperto in scrittura campi oggi protetti.

**Il prop aggiuntivo, dichiarato come richiede l'emendamento**: UNO per pannello,
`identity?: IRIdentityProps` (`irTabs.tsx:88-96`), che porta `{ viewpoints, readOnly }` — l'unica cosa
che i tre controlli richiedono oltre alla view. `vpid` e `allPossibleParentViews` si leggono dalla view
stessa. Nessun context nuovo, nessun altro plumbing. Passato da `ViewData.tsx:88`.

`Applicable to` / `appliableToClasses` **non** è ricollocato: sparisce dalla barra per le view IR, il
codice resta in `InfoData.tsx:281-294` per la 1.6.

## Q2 — reference: nessuno spezzamento, resta col matching

Il blocco `Matching — reference` era ed è renderizzato **dentro** la sezione matching, fra la
metaclasse e il predicate. Si applica quindi la clausola dell'emendamento: **resta col matching in
Applies to**, non va in Structure. `EdgeAuthoringPanel.tsx:499-513`.

Structure per l'edge resta quindi: Natura (`:562-575`) e Capi (`:579-620`).

## Q3 — pin: cancellato dal contenuto di Applies to

`authoringMetaclassPins` è metadato di authoring senza UI per decisione (R-1 del 2026-08-04). Nessun
lavoro in 1.5, nessuna voce nella mappa. Il §h del report resta valido come constatazione.

## Q4 — breadcrumb: rinviata

Il renvoi previsto da COSA 4 è scattato. La `IRBreadcrumb` scritta nella prima passata è stata
**rimossa**: con il select Viewpoint ora dentro Applies to non aggiungeva informazione, e con
viewpoint e parent che scrivono lo stesso `father` sarebbe degenerata in `VP › VP › view`. Si riapre
quando i due saranno distinguibili.

## Q5 — residui della row, e `draft.label`

Regola applicata: chi non sta nella sezione matching va in Text, in coda, nell'ordine che il JSX
aveva già.

| controllo | prima | ora |
|---|---|---|
| `draft.label` (row) | dopo `visible`, in coda al pannello | `RowAuthoringPanel.tsx:391-395` (Text, in coda) |
| `visible` (row) | dopo il Template | `RowAuthoringPanel.tsx:372-388` (Text, dopo il Template) |
| `draft.label` (vertex) | `FormSection` "General", in testa al pannello | `VertexAuthoringPanel.tsx:397-403` (Text, prima di Labels) |

Per la row l'ordine interno di Text — Template, Visible, Label — è **esattamente** quello che il
pannello aveva prima della partizione: nessun riordino.

Il `draft.label` del vertex segue la stessa regola del suo omologo di row (Q5 nomina la row, ma il
controllo è lo stesso in entrambi i pannelli): tenerlo in Applies to avrebbe messo due campi chiamati
"Name" e "Label" a due righe di distanza, con write path diversi — `DViewElement.name` contro
`ir.label`.

## R-1 del report — padding: vincolo rispettato

I cinque corpi sono `<div>` **dentro** la `section.properties-tab.properties-panel` già esistente
(`VertexAuthoringPanel.tsx:271`, `RowAuthoringPanel.tsx:277`, `EdgeAuthoringPanel.tsx:442` e omologhi).
Nessun wrapper fra `.view-editor-tab-content` e la section, quindi le due regole `!important` con
combinatore figlio diretto continuano a matchare. Verificato anche che le altre regole di
`viewapplyto.scss` usano combinatori **discendenti** (`.properties-panel .jj-field ...`), insensibili
al livello aggiunto.

## Resta aperto

Il tab **Style** continua a non essere raggiungibile per le view IR, con il rischio R3 del tab map
(un progetto salvato con `cssIsGlobal = true` e una regola annidata `!important` ridipinge i nodi IR
senza più una superficie da cui accorgersene). L'emendamento non lo affronta: va con la 1.6.

# Discovery (read-only) — Floating panels: canvas esteso sotto le card

**Data**: 2026-07-28
**Branch**: `alfonso-frontend-jjtl`
**Tipo**: discovery Fase 1 (read-only). Nessuna modifica al sorgente, nessun commit, nessun build.
**Nome documento prompt**: 2026-07-28 (Fase 1 floating panels canvas)

---

## Obiettivo

Mappare tutto ciò che serve per trasformare la coppia Properties+Tree da tab dockata (rc-dock, colonna
destra) a **overlay flottante sopra il canvas**, con il canvas a tutta larghezza sotto le card
(stile Figma/tldraw). Output: piano di Fase 2 con rischi quantificati e lista retire-candidates del
width-lock. Nessuna implementazione qui.

## Nota preliminare — stato del working tree

La **Fase 2A NON è committata**. `git log` in testa è `35da2610c docs: log Tree View refinement rounds
2-3`; non esiste il commit `refactor(panels): render properties and tree as inset cards`. Le modifiche
card (`properties-with-tree-view.scss`) sono presenti ma **unstaged** nel working tree. Questa discovery
analizza lo stato del codice così com'è (il card chrome esiste nel working tree); il commit 2A resta da
fare quando Alfonso dà l'OK visivo.

## Metodo / file letti

- Riuso della **Parte A** di `docs/discovery/discovery_2026-07-28_card_panels_progressive_disclosure.md`
  (dock rc-dock, width-lock, collapse, resize handle, floating cluster): referenziata, non rimappata.
- Lettura diretta (io): `hooks/useInterfaceMode.ts` (contesto precedente), `Dock.tsx` (regione layout),
  `PropertiesWithTreeView.tsx` (regioni width-lock/render/handle), `properties-with-tree-view.scss`.
- Due agenti read-only paralleli (findings verificati sui punti caldi), path sotto `frontend/src/`:
  - **Parte A canvas** → `pages/components/Dashboard.tsx`, `abstract/Dock.tsx`, `dock/MyRcDock.tsx`,
    `abstract/DockManager.tsx`, `abstract/tabs/{ModelsSummaryTab,TabDataMaker,ModelTab,EditorSwitch}.tsx`,
    `editor-v2/EditorV2.tsx` + `EditorV2.scss`, `editor-v2/problems/NodeProblemOverlay.tsx`,
    `editor-v2/Toolbar.tsx`, `Jodie/*`, `package.json`, `@xyflow/system` types.
  - **Parte B dock-exit** → `abstract/Dock.tsx`, `dock/{MyRcDock,MyDock}.tsx`, `abstract/DockManager.tsx`,
    `PropertiesWithTreeView.tsx`, `properties-with-tree-view.scss`, `abstract/style.scss`,
    `abstract/docking.scss`, `styles/tokens/_z-index.scss`, `Jodie.tsx`.

---

# PARTE A — Canvas host e viewport

## A1 — Chi rende il canvas (catena di mount)

**Correzione chiave:** `ModelsSummaryTab` (la tab iniziale del gruppo sinistro `'models'`) rende
`ProjectEditor` (il riepilogo progetto), **non** il canvas. Il canvas diagramma (`EditorV2`/ReactFlow) è
caricato come **tab separata nello stesso gruppo sinistro `'models'`**, sibling di `ModelsSummaryTab`,
aggiunta dinamicamente da `DockManager`.

Catena completa fino a `<ReactFlow>`:
1. `pages/components/Dashboard.tsx:622` — monta `<Dock/>`.
2. `abstract/Dock.tsx:281` — tab `ModelsSummary` (`content: <ModelsSummaryTab/>`); `:330` la pusha come
   figlio SINISTRO del dockbox (`children.push({tabs:[ModelsSummary], size:leftSize})`); `:398` rende
   `<PinnableDock ref={dock=>{DockManager.dock=dock}} defaultLayout={layout} .../>`.
3. `dock/MyRcDock.tsx:435` — `class PinnableDock extends DockLayout`; il `<DockLayout>` reale a `:293`
   (`width:100%;height:100%`).
4. `abstract/DockManager.tsx:16` — `static dock`. Le tab modello via `:105` `open2(model)` → `:107`
   `open('models', tab)` → `:101-102` `dockMove(tab, ...dockbox.children[0], 'middle')` (inserisce nel
   gruppo sinistro). Chiamato da `ProjectEditor.tsx:1096/1100/1794/2739`.
5. `abstract/tabs/TabDataMaker.tsx:26-33` — `TabDataMaker.model()` → `content: <ModelTab modelid=.../>`.
6. `abstract/tabs/ModelTab.tsx:41-44` — `<div className="w-100 h-100" style={{overflow:'hidden'}}>
   <ContextMenu/><EditorSwitch modelid=.../></div>`.
7. `abstract/tabs/EditorSwitch.tsx:114-140` — `<div className="editor-switch-container"><div
   className="editor-switch-stage"><EditorV2 modelid=... hasViewpoint=.../></div></div>`.
8. `editor-v2/EditorV2.tsx:4044-4056` — `EditorV2` = `<ReactFlowProvider><EditorV2Inner/></ReactFlowProvider>`;
   `:3905` outer `.editor-v2`; `:3917` `.editor-v2__main`; **`:3999`/`:3988` viewport wrapper
   `<div className="editor-v2__canvas" ref={editorContainerRef} style={{position:'relative'}}>`;
   `:3787` `<ReactFlow>` (MiniMap child `:3846-3857`).

**Wrapper del viewport = `.editor-v2__canvas`** (`EditorV2.tsx:3999`/`:3988`).

CSS (`EditorV2.scss`): `.editor-v2` `:12-25` `display:flex; height:100vh; width:100%`; `.editor-v2__main`
`:27-32` `flex:1; overflow:hidden`; `.editor-v2__canvas` `:34-37` `flex:1; position:relative`.
`.editor-switch-{container,stage}` `width/height:100%`. **Il canvas assume di riempire il proprio pannello
tab rc-dock (gruppo sinistro `'models'`)**, la cui larghezza è `leftSize` da
`calculatePanelSizes(layoutMode)` (`Dock.tsx:328`, ratio `:50-53`: split 50/50, sidebar 70/30,
canvas-only 100/0). **Attenzione**: `.editor-v2` usa `100vh`/`width:100%` (viewport-relative), non i px
misurati del pannello dock → un passaggio a tutta larghezza deve tenere conto di questa assunzione.

Rami collaterali da riconciliare (non nel percorso principale ma esistenti): `Dock.tsx:298-322`
(layout `vertical-console` rende `<ModelsSummaryTab/>` in un div piano, fuori dal dock); metamodelli via
`MetamodelTab`→`EditorSwitch` (`MetamodelTab.tsx:185`).

## A2 — Fit e centratura (call-site del viewport)

Tutti risolvono gli helper da `useReactFlow()` (`EditorV2.tsx:569`).

| # | file:linea | Trigger | Opzioni/math | Assume viewport intero? |
|---|-----------|---------|--------------|-------------------------|
| a | `EditorV2.tsx:572` | `fitViewRef` (fit al sync iniziale) | `fitView({padding:0.2, maxZoom:1})` | Sì (padding simmetrico) |
| b | `EditorV2.tsx:426` | callback sync iniziale (setTimeout 50ms) → invoca (a) | via (a) | Sì |
| c | `EditorV2.tsx:906-907` | evento `jjodel:selectNode` (TreeView→focus nodo) | `setViewport({x:-x*zoom + window.innerWidth/3, y:-y*zoom + window.innerHeight/3, zoom})`, 300ms | **Sì, HARD-CODED** `window.innerWidth/3` — caso peggiore |
| d/e | `EditorV2.tsx:3105/3110` | zoom in/out | `setViewport({...getViewport(), zoom})` | Neutro (solo zoom) |
| f | `EditorV2.tsx:3113-3114` | reset-zoom | `fitView({padding:0.2, maxZoom:1, duration:200})` | Sì |
| g | `EditorV2.tsx:3115` | `handleFitView` (bottone "fit" toolbar, `:3921`) | `fitView({padding:0.2, maxZoom:1, duration:200})` | Sì |
| h | `EditorV2.tsx:3124` | zoom controller esterno | `setViewport({...getViewport(), zoom})` | Neutro |
| i | `EditorV2.tsx:3281` | dopo auto-layout ELK (rAF) | `fitView({padding:0.2, maxZoom:1, duration:300})` | Sì |
| j | `EditorV2.tsx:3809-3810` | dichiarativo `<ReactFlow fitView={!isJjomMode && nodes>0} fitViewOptions={{padding:0.2, maxZoom:1}}>` | simmetrico | Sì (fit al load non-JjOM) |
| k | `problems/NodeProblemOverlay.tsx:162` | focus nodo dal badge problema | `fitView({nodes:[{id}], duration:300, padding:0.3})` | Sì |
| l | `repro/ReproHarness.tsx:77,113` | harness dev | `<ReactFlow fitView>` | N/A (non in produzione) |

`screenToFlowPosition` (`EditorV2.tsx:1944, 2152`) = math drop pointer-relative, **non** centratura,
non impattato. **Ogni centratura/fit (a,b,c,f,g,i,j,k) mira al rect intero → centrerebbe il contenuto
sotto le card.** Il caso (c) è il peggiore (hard-coded `window.innerWidth/3`).

## A3 — ReactFlow: versione e inset disponibili

- `package.json:27` `"@xyflow/react":"^12.10.0"` (installato 12.10.2; `@xyflow/system` 0.0.76).
- **`fitView` supporta padding PER-LATO** (`@xyflow/system .../types/general.d.ts:121-135`):
  `Padding = PaddingWithUnit | {top?,right?,bottom?,left?,x?,y?}`, `PaddingWithUnit = \`${number}px|%\` | number`;
  `FitViewOptionsBase.padding?: Padding`.
  → inset possibile: `fitView({ padding:{ left:'<Lpx>', right:'<Rpx>', top:0, bottom:0 }, maxZoom:1 })`,
  applicabile a tutti i `fitView` (a,f,g,i,k) e al `fitViewOptions` dichiarativo (j).
- **Caveat**: `fitBounds` padding è `number` (no per-lato, `:194-195`); `setCenter`/`setViewport` non
  prendono padding (`:180-190`) → il caso (c) va insettato **a mano** (sottrarre metà delta card-width dal
  termine `window.innerWidth/3`).

## A4 — Elementi ancorati (destra/alto/basso)

- **MiniMap** — `EditorV2.tsx:3846-3857`, figlio di `<ReactFlow>`, inline `{position:absolute,
  right:'20px', bottom:'100px'}`. Bottom-right → **finirebbe sotto la card destra**. Inset: alzare `right`
  della larghezza card destra (es. `right: calc(<cardW>px + 20px)`).
- **Controls / zoom** — **nessun `<Controls>` ReactFlow in produzione** (spostati in toolbar; CSS
  `.react-flow__controls{display:none}` `EditorV2.scss:993-995`). Zoom nel `Toolbar` (`EditorV2.tsx:3937-3940`).
- **`<Panel position>`** — **non usato** in `editor-v2/`.
- **Toolbar "Concrete syntax" (alto)** — `Toolbar` in-flow in cima a `.editor-v2__main`
  (`EditorV2.tsx:3918`), badge `Toolbar.tsx:436-439` sulla **sinistra** della barra;
  `.editor-v2-toolbar` `EditorV2.scss:220-230` `height:40px`, full-width. **La card sinistra coprirebbe la
  sinistra della toolbar (incluso il syntax badge)** → serve inset sinistro (`padding-left` = larghezza
  card sinistra). *(Nota: nel piano attuale le due card sono a destra; una card/rail sinistra è la
  Parte C Q10.)*
- **FAB "Jodie" (basso-destra)** — `App.tsx:170`, `JodieMinimized.tsx:18`, CSS `JodieWindow.css:871-876`
  `position:fixed; bottom:100px; right:30px; z-index:10000; 58×58`. Essendo `fixed`+`z-index:10000`
  **sta SOPRA la card destra** (non coperto) ma **collide spazialmente** con card destra e MiniMap
  (anch'essa `bottom:100px; right:20px`) → spostare a sinistra della card destra quando le card sono aperte.
- **Scrollbar** — nessuna scrollbar canvas custom (`overflow:hidden`, RF panna internamente);
  `.react-flow__attribution{display:none}` (`EditorV2.scss:997-999`). Nulla da insettare.

## A5 — Critical-zone (audit import file per file)

Critical-zone = import di `useJjomSync` / `portDistribution` / `editor-v2/sync/*`.

| File (catena canvas) | Critical-zone? | Evidenza |
|---|---|---|
| `Dashboard.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `DockManager.tsx` | No | grep vuoto |
| `ModelsSummaryTab.tsx`, `project/ProjectEditor.tsx` | No (solo commenti a `:1650/:1814`) | nessun import |
| `TabDataMaker.tsx`, `ModelTab.tsx`, `EditorSwitch.tsx` | No | grep vuoto |
| **`editor-v2/EditorV2.tsx`** | **SÌ** | `:50` `portDistribution`; `:55` `useJjomSync`; `:66/:92` `sync/syncState`, `sync/canvasToJjom` |

**Solo `EditorV2.tsx` è in critical-zone.** Tutta la catena dock/host sopra è critical-zone-free → il
lavoro host/layout (full-width, rimozione figlio destro, float delle card) si fa in `Dock.tsx`/CSS senza
toccare la sync.

### A5.bis — Chiarimento fitView-in-useJjomSync (IMPORTANTE)

La premessa "`fitView` è chiamato in `hooks/useJjomSync.ts`" **non è letteralmente accurata**:
`useJjomSync.ts` **non contiene alcun `fitView`**. A `useJjomSync.ts:1234-1237`, dopo l'idratazione
iniziale JjOM→canvas, spara il callback del chiamante (`if (onInitialized) requestAnimationFrame(() =>
onInitialized())`; il commento `:1234` dice "Notify caller (e.g. to fitView)"). Il `fitView` reale vive
nel **chiamante `EditorV2.tsx`**: la call `useJjomSync(modelid, setNodes, setEdges, () => {...})` a
`EditorV2.tsx:412`; dentro quel callback (`:414-433`), dopo 50ms, `fitViewRef.current?.()` a `:426`;
`fitViewRef.current` è definito a `:572` come `() => fitView({padding:0.2, maxZoom:1})`.

**Conseguenza per la Fase 2**: un "inset del fitView" tocca `EditorV2.tsx` (`:572` + gli altri site A2),
**non** `useJjomSync.ts` / `portDistribution` / `sync/*`. È codice **viewport** che vive in un file
critical-zone-adjacent (`EditorV2.tsx` importa la sync) ma **non è un write-path della sync né del D-layer**.
→ modificare il padding a `:572/:3114/:3115/:3281/:3810` e la math a `:907` **non richiede** di toccare i
moduli sync. Verdetto LIR: vedi "Critical-zone (Layer Impact Report)" sotto.

---

# PARTE B — Uscita dal dock

*(Meccaniche width-lock: vedi Parte A del discovery card_panels; qui solo l'uscita dal dock.)*
Il figlio destro del dockbox è creato a `Dock.tsx:348` (`children.push({tabs, size:rightSize})`) con la
tab `Properties` (`Dock.tsx:282`, `<PropertiesWithTreeView mode={'tab'}/>`).

## B5 — Dipendenze dal figlio destro del dock

**(a) PinnableDock / il "pin" della tab Properties.** `PinnableDock` (`MyRcDock.tsx:435`, `extends
DockLayout`, singleton `:436/:492`) aggiunge: edge-strip tab pinning (`:647-661`,
`hideTab/restoreTab/setAsActiveTab` `:506-529`), drop-anchor su drag (`:605-624`), dispatch
`EDITOR_TYPE_CHANGE` (`:574-603`), persistenza layout (`defaultLayout :437-485`, `load :665-687`,
`save :717-732`). **Il "pin" nell'header PROPERTIES è ALTRO**: `PropertiesWithTreeView.tsx:351-359`
(`properties-panel-pin-btn`, `togglePin :211-222`) cattura la selezione live da
`store.getState()._lastSelected` (`:215`) e **congela** il contenuto Properties su quella selezione
(effimero, no localStorage `:187-188`; auto-unpin su delete `:200-209`; re-target via `PROPERTIES_PIN_VIEW`
`:288-304`). È una **feature del contenuto del pannello**, disaccoppiata dal tab-pinning di PinnableDock →
**sopravvive intatta come overlay** (due "pin" omonimi ma indipendenti).

**(b) DockManager e tab-loading.** `DockManager.dock` (`DockManager.tsx:16`, assegnato `Dock.tsx:398`)
indicizza `dockbox.children` **per posizione**: `open` usa `index=(group==='models')?0:1` +
`dockMove(tab, ...children[index], 'middle')` (`:101-102`). Quindi `'models'`→`children[0]` (canvas sx),
`'editors'`→`children[1]` (**Properties**). Cosa si rompe togliendo il figlio destro:
1. **`DockManager.open('editors', tab)` — unico caller = `Jodie.tsx:690`** (apre la tab Documentation
   dall'assistente) → risolve `children[1]`; se assente, `dockMove(..., undefined, ...)` sbaglia →
   **da redirigere** (incertezza: comportamento rc-dock con target undefined non verificato).
2. `Dock.tsx:195-196` (`handleLayoutChange` scrive `children[1].size`/`children[0].size`), guardato
   `children?.length>=2` (`:172`) → **no-op** con un figlio solo.
3. `Dock.tsx:216` (`handleDockResize` legge `children[1].size`), guardato `>=2` (`:214`) → **no-op**.
4. **NON impattati**: `ACTIVE_TAB`/`EDITOR_TYPE_CHANGE` (`Dock.tsx:353-393`, legge `children[0]`);
   caricamento tab modello/doc/transformation (target `children[0]`).
5. **Layout persistiti** incorporano la forma a due pannelli (`MyRcDock.tsx:453-463` defaultLayout,
   `save/load :665-732`; `DUser/DProject.layout`) → **migrazione** da prevedere.

**(c) Kill-switch `body[data-active-tab]` / `[data-layout-mode]`.**
`properties-with-tree-view.scss:961-963` nasconde il cluster flottante in `canvas-only` e su `documentation`.
Setter: `data-active-tab` **solo** `Dock.tsx:390/392` (puro artefatto dock); `data-layout-mode`
`Navbar.tsx:872/880` + `Toolbar.tsx:218` (**sopravvive** all'uscita dal dock); `data-editor-type`
`Dock.tsx:248/252/259`. Altri consumatori dock-sizing in `abstract/style.scss` (`:1042/1057/1076/1085/1094/
1103/1267/1299`, `:1171`).

## B6 — Strategia overlay + z-index

- **(a) `position:absolute` nel container canvas**: il canvas vive nel DOM generato da rc-dock
  (`.dock-content-holder`, che rc-dock **ri-parenta** su drag/float/maximize — coupling già notato
  `MyRcDock.tsx:94-95`). Nessun container canvas con `position:relative` di nostra proprietà; overflow dei
  pannelli clippa. **Fattibile ma fragile.**
- **(b) Portal su `<body>` (precedente esistente)**: `.properties-tree-floating-cluster` **già** fa
  `createPortal(<div/>, document.body)` a `PropertiesWithTreeView.tsx:448-470`, `position:fixed`
  (`scss:898-902`). Sfugge a rc-dock, pattern collaudato (anche context menu editor-v2, modali). →
  **RACCOMANDATO (b)**.
- **Z-index landscape** (`styles/tokens/_z-index.scss`: dropdown 1000, tooltip 1050, modal 9999,
  toast 999998, debug 999999): rc-dock chrome 1–400; handle interni 10/11; **cluster flottante 900**
  (`scss:902`, "sopra canvas, sotto context-menu editor-v2 1000, sotto modal 9999+"); context menu
  editor-v2 999/1000 (`EditorV2.scss:3278/3286`); modali app 9000–99999; FAB 10000–10001; toast 999998.
  → **collocare le card al tier ~900** (stesso slot del cluster): sopra canvas+rc-dock, sotto il context
  menu del canvas (1000) e ben sotto modali/FAB/toast.

## B7 — Resize e persistenza nel mondo flottante

- **localStorage** (solo `PropertiesWithTreeView.tsx`, nessun lettore esterno → **portabili as-is**):
  `jjodel_property_tree_view_width` (read `:58`, write `:98`), `jjodel_property_panel_visible`
  (read `:150`, write `:157`), `jjodel_property_panel_width` (read `:104`, write `:142`).
  **Nessuna width in Redux** (tutto `useState` locale `:57/:103`).
- **Resize handler** (`handleResizeStart :65-95`, `handlePropsResizeStart :111-139`): pura math
  delta→clamp→`setWidth`, **nessuna API rc-dock** → **portabili**. Unico coupling dock: scrivono
  `body[data-properties-tree-dragging]` (`:94/:138`, cleared `:86/:131`), consumato solo da
  `style.scss:1133-1138` → diventa no-op innocuo.
- **Cluster flottante di riapertura**: render **dock-independent** (portal body, `position:fixed`), MA il
  **gating show/hide è ancora dock-driven** (`showFloatingCluster` = `bothCollapsed && activeEditorType ∈
  {model,metamodel}` `:245-247` + kill-switch CSS su `body[data-*]`). Nota design: il concetto
  "both-collapsed → cluster" potrebbe diventare **obsoleto** quando l'intero pannello è già un overlay.

## B8 — Retire-candidates del width-lock (inventario, nessuna cancellazione)

| # | Posizione | Cosa fa | Chi lo legge ancora (dip. rimozione) |
|---|-----------|---------|--------------------------------------|
| 1 | `PropertiesWithTreeView.tsx:257-280` | Effect width-lock (mode `'tab'`): scrive `--properties-tree-tab-width`, `data-properties-tree-width-lock`, `data-properties-tree-both-collapsed` su `document.body`. **Unico writer** dei 3 attributi. | Consumatori = righe #2,#3,#4 |
| 2 | `style.scss:1119-1128` | `body[data-...width-lock]` forza `.dock-hbox>.dock-panel:last-child` a `var(--...-tab-width)` | Legge var+attr di #1 |
| 3 | `style.scss:1133-1138` | `body[data-...dragging]` uccide la transizione durante il drag | Attr da handler `:94/138` (retire insieme ai setter) |
| 4 | `style.scss:1140-1168` | `body[data-...both-collapsed]` azzera last-child, espande first-child, nasconde `.dock-divider` | Attr da `:273` |
| 5 | `PropertiesWithTreeView.tsx:42-46` `COLLAPSED_PANEL_TOGGLE_WIDTH=28` | Costante margin-box del toggle, single source della formula width | Unico lettore = effect `:262-263` → retire **con #1**. NB: `.collapsed-panel-toggle` (elemento) **resta reso** (`:396-397/440-441/488-502`) → il blocco SCSS `scss:273-306` **NON è morto** |

**Downstream (più rischioso, NON dead pulito):** `style.scss:1042-1108` (sizing split/sidebar/responsive
del last-child) e `:1171-1288` (hide-in-mode: documentation/summary/transformation/viewpoint/canvas-only)
mirano al figlio destro ma gate anche su `data-editor-type`/`data-layout-mode`/`data-active-tab` con altri
scopi → cleanup separato, non nel set "dead" del width-lock.

**Ordine rimozione (dependency-safe):** i consumatori CSS (#2,#3,#4) escono solo quando nulla setta gli
attributi body; i writer JS (#1 + i 4 set/remove di `data-...dragging`) sono gli unici writer → writer+reader
si ritirano **insieme**. `COLLAPSED_PANEL_TOGGLE_WIDTH` (#5) con #1.

---

# PARTE C — Semantica e UX (da confermare)

## C9 — Pan-under (contenuto sotto le card)

Accettato come semantica Figma. Verifica che nessuna interazione critica diventi **impossibile** (solo
coperta):
- **Context menu su nodo vicino al bordo**: i context menu del canvas sono portalati a z 999/1000
  (`EditorV2.scss:3278/3286`), **sopra** le card (z ~900) → si aprono sopra le card, non clippati. Il
  right-click su un nodo parzialmente coperto funziona; il menu appare sopra. **OK.**
- **Drag di edge / grab di handle sotto una card**: un handle fisicamente sotto una card **non è
  afferrabile lì** (la card intercetta il pointer). Rimane possibile **pannare** il nodo fuori da sotto la
  card e poi interagire (pattern Figma). Nessuna interazione diventa impossibile in assoluto, solo
  temporaneamente coperta. **Accettabile**, ma da confermare come UX.
- Mitigazione opzionale (Fase 2): `pointer-events:none` sulle zone "vuote" della card, o un piccolo inset
  di default (C11) che riduce la sovrapposizione.

## C10 — "INSTANCES a sinistra"

**Non esiste alcun componente `INSTANCES`** nel codice (grep vuoto). Il figlio SINISTRO del dock è
`ModelsSummaryTab` (`ProjectEditor`, riepilogo), e il canvas è una tab sibling nello stesso gruppo
sinistro (A1). Quindi "INSTANCES a sinistra" non mappa su codice esistente: o è un concetto di mockup, o
si riferisce al futuro rail sinistro. **Estendere l'overlay a sinistra** replicherebbe il pattern destro
(stesso portal su body, stesso tier z ~900, stessi retire-candidate lato dock), MA il gruppo sinistro
ospita **le tab canvas + summary**, non un pannello isolato → farlo "flottare" è strutturalmente diverso
(non è togliere un figlio dock, è sovrapporre un rail al canvas). Il toolbar syntax badge (A4) sarebbe
coperto a sinistra → inset sinistro necessario. **Da decidere con Alfonso, non deciso qui.**

## C11 — Inset di default (proposta)

- Offset card dal bordo: **8–12px** (coerente griglia 8px; proposta 8px, o 12px per respiro).
- Larghezze card (da B7): Properties `propsWidth` default **440** (400–700), Tree `width` default **260**
  (200–500).
- **Inset destro per fitView/minimap/toolbar** = (larghezza overlay destro) + offset. Se Properties+Tree
  restano affiancate a destra come oggi: `right-inset ≈ 440 + 260 + gutter + offset` (~**710–720px**) —
  inset ampio, da valutare (forse le due card si impilano o si riducono nel mondo flottante). Formula da
  ratificare: `fitView({ padding:{ right: <overlayW+offset>px, left:<Loverlay?>px, top:0, bottom:0 } })`;
  MiniMap `right: calc(<overlayW>px + offset)`; toolbar `padding-left:<Loverlay>px` solo se rail sinistro.
- Il valore esatto dipende dalla **disposizione finale** delle card (affiancate vs impilate vs una sola
  colonna) → **decisione di layout prerequisita** al numero dell'inset.

---

## Critical-zone (Layer Impact Report) — verdetto

- **Host/layout/overlay (Parte A1, A4; Parte B)**: **nessun file critical-zone**. `Dock.tsx`, `DockManager`,
  `ModelTab`, `EditorSwitch`, `PropertiesWithTreeView`, SCSS → **niente LIR**.
- **Inset del fitView/viewport (Parte A2/A5.bis)**: vive in **`EditorV2.tsx`** (`:572` e altri site), che
  **importa** la sync (`:50/:55/:66/:92`) ma il cambiamento è **viewport-only** (padding/math di
  centratura), **non** un write-path sync/D-layer e **non** tocca `useJjomSync.ts`/`portDistribution.ts`/
  `canvasToJjom.ts`/`syncState.ts`. → Per §3.2 il LIR è richiesto quando si toccano *quei* file/write-path;
  un edit del padding di `fitView` in `EditorV2.tsx` **non** li tocca. **Verdetto**: LIR **non dovuto** per
  l'inset del fitView, **ma** ogni modifica va confinata alle righe viewport e **non** deve avvicinarsi al
  call-site `useJjomSync(...)` (`:412-433`) né alla logica di sync; se in Fase 2 l'inset richiedesse di
  toccare il callback di sync o la firma di `useJjomSync`, **fermarsi e produrre LIR + go-ahead**.
- **`NodeProblemOverlay.tsx:162`** (fitView focus) è fuori critical-zone (problems registry) → inset libero.

## Dipendenze e rischi (quantificati)

1. **Redirect `DockManager.open('editors')`** (unico caller `Jodie.tsx:690`, Documentation): **BLOCCANTE**
   se il figlio destro sparisce. Rischio ALTO se non gestito (comportamento `dockMove(undefined)` non
   verificato). Mitigazione: reindirizzare la doc a `children[0]` o a una tab dedicata.
2. **8 call-site fitView/centratura** (A2) da insettare, di cui **(c) `:907` hard-coded
   `window.innerWidth/3`** richiede math manuale (no padding API). Rischio MEDIO (diffuso ma meccanico);
   in `EditorV2.tsx` (critical-zone-adjacent, vedi verdetto LIR).
3. **MiniMap/FAB/toolbar** (A4) da insettare: MEDIO-BASSO (CSS/inline, ma FAB è app-level `App.tsx`,
   fuori dal file pannello → coordinamento cross-file).
4. **Layout persistiti** (`DUser/DProject.layout`, `defaultLayout`) incorporano i due pannelli: rischio
   **migrazione** (VersionFixer-like o reset layout) — ALTO se ignorato (progetti salvati aprono un dock a
   due pannelli inesistente).
5. **Width-lock retire** (B8): 5 candidate, ordine sicuro definito; rischio BASSO se si segue l'ordine
   writer+reader insieme; `.collapsed-panel-toggle` NON è dead.
6. **`.editor-v2` `100vh`/`width:100%`** (A1) vs px del pannello dock: possibile off-by-chrome a tutta
   larghezza — da verificare a runtime (Fase 2, verifica visiva).
7. **Gating cluster flottante** ancora dock-driven (B7): se il pannello diventa overlay, il concetto
   both-collapsed va ripensato — MEDIO (design + codice).

## Domande aperte per Alfonso

1. **Disposizione card nel mondo flottante**: Properties+Tree **affiancate** a destra (inset ~710px),
   **impilate** verticalmente, o **una colonna** con tab? L'inset del fitView dipende da questo (C11).
2. **Overlay = portal su body** (raccomandato, tier z ~900) confermato? O si vuole tentare
   l'absolute-in-canvas (fragile per via di rc-dock)?
3. **Redirect Documentation** (`Jodie.tsx:690`, `DockManager.open('editors')`): dove va la tab doc quando
   non c'è più il figlio destro? (canvas group / tab dedicata / overlay anch'essa?)
4. **Migrazione layout persistiti**: reset del `layout` salvato (accettando che gli utenti perdano il
   ratio dock) o migrazione mirata?
5. **Fase 2 fitView inset**: confermi che l'inset resta confinato a `EditorV2.tsx` (viewport), senza
   toccare `useJjomSync`/sync (niente LIR)? Se emergesse la necessità di toccare la sync, ci si ferma.
6. **INSTANCES / rail sinistro** (C10): in scope in questa evoluzione o fase separata? (oggi non esiste
   come componente).
7. **Inset di default** (C11): 8 o 12px? E il both-collapsed cluster: si mantiene o si ripensa nel mondo
   overlay?

---

## Hard stop

Report scritto. **STOP.** Nessuna modifica ai sorgenti, nessun commit, nessuna Fase 2. Nessuna entry in
`docs/claude-code-log.md` (fase read-only). L'analisi prosegue in chat; la Fase 2 sarà spezzata in commit
con verifica visiva pesante (overlay, insets fitView/minimap/toolbar, ritiro width-lock), preceduta dalla
ratifica di disposizione card + inset. Promemoria: **la Fase 2A card è ancora da committare**.

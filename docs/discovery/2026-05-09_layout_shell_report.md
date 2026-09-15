# Layout shell discovery — Report

**Data**: 2026-05-09
**Branch**: `alfonso-frontend-jjtl`
**Commit di riferimento**: `ed672736b`
**Tipo**: discovery read-only (Fase A pre-implementation della topologia 4-colonne)

---

## Task 1 — Layout shell root

### Catena di mounting

```
src/index.tsx
  → src/App.tsx (HashRouter, route '/project' → ProjectPage)
    → src/pages/Project.tsx:80 (renderizza <Dashboard active="Project">)
      → src/pages/components/Dashboard.tsx:634 (Dashboard switcher)
        → src/pages/components/Dashboard.tsx:544 (ProjectDashboard) ← root effettivo dell'editor
```

### Strategia di layout (current)

`ProjectDashboard` usa **CSS Flex** (classi `dashboard-container`, `two-column`). Snippet rilevante (Dashboard.tsx:609-631):

```tsx
return (<>
    <Try><style id="views-css-injector-d">{allViewsCss}</style></Try>
    <Try><Navbar /></Try>
    <div className={`dashboard-container two-column${hideLeftBar ? ' hide-leftbar' : ''}`}>
        {!hideLeftBar && <LeftBar active="Project" project={project} />}
        <div className="project-dock-wrapper">
            <Try><Dock /></Try>
        </div>
        {/* TODO: Add contextual RightPanel for project view ... */}
    </div>
    <Try><StatusBar /></Try>
</>);
```

Quindi la topologia attuale è **due colonne** (LeftBar + Dock-wrapper) con Navbar sopra e StatusBar sotto. **Il property panel e il tree non sono colonne shell-level**: vivono entrambi *dentro* un tab del rc-dock (`<PropertiesWithTreeView mode='tab'>`, registrato in `Dock.tsx:273`).

### Componenti SplitPane / Resizable già disponibili

| Componente | Path | Ruolo |
|---|---|---|
| `ResizeHandle` | `frontend/src/components/ResizeHandle/ResizeHandle.tsx:16-40` | Divider 1px (hit-area 5px) generico, callback-driven (`onMouseDown`, `onDoubleClick`), supporta horizontal/vertical |
| `SimpleResizeHandle` | `frontend/src/components/SimpleResizeHandle.tsx:8-67` | Variante self-contained per resize verticale console (clamp 200-600 hardcoded) |
| `SimpleFooterResizeHandle` | `frontend/src/components/SimpleFooterResizeHandle.tsx` | Variante per il footer |
| `useResizableConsole` (hook) | `frontend/src/hooks/useResizableConsole.ts:21-121` | Stato + drag listeners + localStorage persistence (key `jjodel_console_height`) |
| `useResizableFooter` (hook) | `frontend/src/hooks/useResizableFooter.ts` | Variante footer |
| `BottomDrawer` | `frontend/src/components/panels/BottomDrawer.tsx:18-103` | Bottom drawer resizabile (height drag), ESC chiude. Disabilitato in EditorV2 (commento line 85: "duplicates right Properties panel") |
| `ElementPropertiesDrawer` | `frontend/src/components/panels/ElementPropertiesDrawer.tsx` | Wrapper di Info dentro un BottomDrawer. Disabilitato. |
| `ResizableLayout.example.tsx` | `frontend/src/components/ResizeHandle/ResizableLayout.example.tsx` | Example/sandbox per vertical split canvas-console (non usato in prod) |
| `TestLayout.tsx` | `frontend/src/components/TestLayout.tsx` (route `/test-resize` in App.tsx:139) | Pagina di test layout |

**Nessuna libreria** di split-pane in `package.json`: zero hit per `react-split-pane`, `react-resizable-panels`, `allotment`, `re-resizable`. Pattern consigliato dal codebase è **handler `onMouseDown` su un component "handle" + `mousemove`/`mouseup` listener globali in un `useEffect`** (vedi `useResizableConsole`).

### Flag/modalità che alterano il layout oggi

| Flag | Effetto | File |
|---|---|---|
| `hideLeftBar` (state locale) | Nasconde `<LeftBar>` quando l'editor attivo è metamodel/model/transformation | Dashboard.tsx:548-587 |
| `body[data-editor-type]` (DOM attribute) | CSS-driven visibility di pannelli | Dock.tsx:247-258 |
| `layoutMode === 'vertical-console'` | Sostituisce rc-dock con vertical split (`ModelsSummaryTab` + Console) | Dock.tsx:288+ |
| `editorMode: 'flow'\|'classic'\|'split'` | Toggle 3-state dentro `EditorSwitch` (visibile solo con viewpoint attivo) | EditorSwitch.tsx:30, EditorV2 |
| `state.viewpoint` | Pointer al DViewPoint attivo, drive il toggle EditorSwitch | store.tsx:165 |
| `state.advanced` | Modalità advanced (mostra NODE section, ecc.) | usato in PropertiesWithTreeView.tsx:33 |
| `documentation-editor-wrapper.fullscreen` | Fullscreen locale di DocumentationTab | DocumentationTab.tsx:1021 |
| Editor V2 `layoutMode === 'canvas-only'` | Toolbar toggle canvas/sidebar | Toolbar.tsx:533 |

**Nessuna modalità "focus-canvas" / "focus-mode" esiste** (zero hit per `focusmode`, `focus-canvas`). Da introdurre.

---

## Task 2 — Tree view: implementazione attuale

### Componente principale

**`TreeViewContent`** in `frontend/src/components/TreeViewSidebar/TreeViewContent.tsx:1057` (component connesso, ~1170 righe). Refactorato il 2026-05-08 con persistente `expandedTreeNodes`. Sub-componenti memoizzati: `SectionNode`, `EntityRow`, `MetamodelNode`, `PackageNode`, `ClassNode`, `ModelNode`, `ViewpointNode`, `SubViewItem`, `FeatureRow`, `DocumentationEmptyState`, `TransformationItem`.

### File correlati

```
src/components/TreeViewSidebar/
├── index.ts                       — barrel export di TreeViewSidebar (default) + TreeViewContent
├── TreeViewSidebar.tsx            — DEAD CODE: standalone resolution-adaptive sidebar non montata da nessuna parte (vedi OQ)
├── TreeViewContent.tsx            — componente reale in uso
└── tree-view-sidebar.scss         — stili (1700+ righe, mix di legacy + nuovo refactor)
```

### Mounting reale

`TreeViewContent` viene mounted **solo** dentro `PropertiesWithTreeView` come split panel:

```
PropertiesWithTreeView.tsx:74-152
└── <div className="properties-with-tree-view tree-visible|tree-hidden">
    ├── <div className="properties-panel-container">  ← left, fluid
    │   ├── <Info mode="tab" />
    │   └── (advanced ? NODE collapsible section : null)
    └── <div className="tree-view-panel-container" style={{width: 260}}>  ← right, hardcoded 260px
        ├── header (icona + label + bottone collapse)
        └── <TreeViewContent />
```

`PropertiesWithTreeView` è renderizzato in `Dock.tsx:273` come tab `<TabContent><PropertiesWithTreeView mode='tab'/></TabContent>`, group `'editors'`.

### Data flow

| Aspetto | Sorgente |
|---|---|
| Metamodels/models/viewpoints | `mapStateToProps` in TreeViewContent.tsx → legge `state.m2models`, `state.m1models`, `state.graphs`, `LProject.getProject().viewpoints` |
| Selection corrente | `state._lastSelected.modelElement` (TreeViewContent.tsx:1131-1132) |
| Highlighting JjScript-driven | `useTreeViewPanel()` context → `highlightedElementId`, `highlightedAction` |
| Transformations | Custom event `JjodelEvents.TRANSFORMATIONS` ricevuto da ProjectEditor (TreeViewContent.tsx:1066-1075) |
| Expand/collapse persistente | Da `DProject.expandedTreeNodes: string[]` su projectId |

### `expandedTreeNodes` — stato

| Aspetto | File |
|---|---|
| Dichiarato su DProject | `frontend/src/joiner/classes.ts:2961` (`expandedTreeNodes: string[] = []`) |
| Dichiarato su LProject | `frontend/src/joiner/classes.ts:3035` (`expandedTreeNodes!: string[]`) |
| Init in DProject constructor | `classes.ts:1250` (`_this.expandedTreeNodes = []`) |
| Migration seeding | `frontend/src/redux/VersionFixer.tsx:715` (`'2.215 -> 2.216'`) |
| Lettore | `TreeViewContent.tsx` mapStateToProps + hook `isExpandedFn` |
| Scrittore | `TreeViewContent.tsx` `onToggleFn` → `SetFieldAction.new(projectId, 'expandedTreeNodes', next, '', false)`; cleanup orfani in `useEffect` |

**Stato**: già wired al tree component. Fully operational.

### Notifica selezione all'esterno

Il tree click chiama `SetRootFieldAction.new('_lastSelected', {node, view, modelElement}, '', false)` (canale Redux). **Non emette custom DOM event**, **non chiama `DockManager.open2`** (vedi Task 4 + Task 5 — gap da chiudere).

Per i nodi `Feature` (M1 instances) emette anche un custom event `JjodelEvents.SELECT_NODE` con `{nodeId, modelId}` (TreeViewContent.tsx:266-268) — consumato da EditorV2 per centrare il canvas sul nodo, **senza cambiare diagram view**.

### Width attuale e collapse

- Width: **hardcoded 260px** in `PropertiesWithTreeView.tsx:23` (`TREE_VIEW_WIDTH = 260`). Non resizabile dall'utente.
- Collapse: bottone chevron-right in tree header (PropertiesWithTreeView.tsx:127-133). Stato in `useTreeViewPanel()` context, persistito in localStorage `jjodel_treeview_visible` (TreeViewPanelContext.tsx:56).
- Auto-collapse transient quando `state._lastSelected.view` è truthy (PropertiesWithTreeView.tsx:42-53), per dare spazio ai Monaco editor di ViewData.
- Toggle keyboard via custom event `JjodelEvents.TOGGLE_TREE_VIEW`.

---

## Task 3 — Property panel: implementazione attuale

### Componente principale

**`Info`** in `frontend/src/components/editors/Info.tsx:1140` (component connesso, ~1380 righe). Mega-component con switch interno per categoria di nodo.

Switch a `Info.tsx:831`:

```tsx
switch (className) {
    case 'DModel':       return builder.model(data, advanced, skipTitle);
    case 'DPackage':     return builder.package(data, advanced, skipTitle);
    case 'DClass':       return builder.class(data, advanced, skipTitle);
    case 'DEnumerator':  return builder.enum(...);
    case 'DAttribute':   return builder.attribute(...);
    case 'DReference':   return builder.reference(...);
    case 'DOperation':   return builder.operation(...);
    case 'DParameter':   return builder.parameter(...);
    case 'DEnumLiteral': return builder.literal(...);
    case 'DObject':      return builder.object(...);
    case 'DValue':       return builder.value(...);
}
```

I "renderer" sono **static methods di una classe locale `builder`** (Info.tsx:285-...). Non ci sono file separati per categoria. Le sezioni Overview/General/Dependencies sono tutte assemblate nel singolo file via componente locale `CollapsibleSection` (Info.tsx:37-62).

### Sezioni del MODEL panel (corrisponde allo screenshot Alfonso)

`builder.model` (Info.tsx:297-349):

| Sezione | File:linea | Note |
|---|---|---|
| Conformance bar | Info.tsx:317-322 | Renderizzata sopra le sezioni quando il model è M1 (`<div className="jj-conformance-bar">Conforms to <strong>{metamodel.name}</strong></div>`). **Questa è la "conformance pill verde" dello screenshot** |
| `GENERAL` (Name input) | Info.tsx:324-326 | `CollapsibleSection title="GENERAL"` → `builder.named()` |
| `DEPENDENCIES` | Info.tsx:328-343 | `CollapsibleSection title="DEPENDENCIES"` → MultiSelect su altri DModel |
| `CONTENTS` | Info.tsx:345-347 | Solo se `l.isMetamodel` — lista classes/enumerators/packages |

**Nessuna sezione `OVERVIEW`** esiste oggi nel `builder.model` — lo screenshot menziona "Overview / General / Dependencies", quindi:
- **OVERVIEW** è da introdurre (oppure è alias per la conformance bar);
- L'ordine attuale è: conformance-bar (sopra le sezioni) → GENERAL → DEPENDENCIES → CONTENTS (only if metamodel).

### Driver del rendering

- Il selected `LObject` arriva tramite `state._lastSelected.modelElement` (mapStateToProps di Info.tsx:1140 e seguenti).
- `Info` è un connected component; lo stato globale di selezione drive il rendering.
- Se nessuno è selezionato → `<Empty />` (Info.tsx:1141).

### Apertura/chiusura del panel

**Non c'è** un meccanismo di "panel open/close" come prop o flag dedicato. La visibilità del panel è guidata da:

1. **Tab visibility nel rc-dock**: il tab "Properties" (`structure` in Dock.tsx:273) è sempre presente; rc-dock gestisce visibilità in base all'attivazione tab.
2. **CSS data-attribute `body[data-editor-type]`**: setato da Dock.tsx:247-258 e usato da `properties-with-tree-view.scss` per controlli visivi (vedi commento PropertiesWithTreeView.tsx:71-72).
3. **Tree side**: la collapse del solo tree usa `useTreeViewPanel().isVisible` con persistenza localStorage.
4. **Auto-suppress** del tree quando una view è selezionata (PropertiesWithTreeView.tsx:42-53).

**Width**: il properties container è fluido (CSS), il tree è fixed 260px. Nessuna persistenza di larghezza per il properties panel.

---

## Task 4 — Selection state: single source of truth

### Sorgente unica

`state._lastSelected` dichiarato in `frontend/src/redux/store.tsx:157-161`:

```ts
_lastSelected?: {
    node: Pointer<DGraphElement, 1, 1>,
    view: Pointer<DViewElement, 1, 1>,
    modelElement: Pointer<DModelElement, 0, 1>
    // se un node è cliccato: node + view sono presenti, modelElement opzionale.
    // un node può esistere senza modelElement counterpart.
};
```

È un **single object con 3 slot**: node (canvas-side graph element), view (DViewElement), modelElement (the M1/M2 element). Single-select: nessun array.

**Transient field**: dichiarato in `TRANSIENT_TOP_KEYS` del reducer (`frontend/src/redux/reducer/reducer.ts:1288`) — non persistito tra sessioni, non parte di `idlookup`.

### Sorgenti che scrivono

Tutti scrivono via `SetRootFieldAction.new('_lastSelected', {...}, '', false)`:

| Sorgente | File:linea | Categoria |
|---|---|---|
| Tree click (metamodel/package/class/model) | TreeViewContent.tsx — handlers `handleClick` di MetamodelNode/PackageNode/ClassNode/ModelNode | Tree |
| Tree click (feature M1 instance) | TreeViewContent.tsx (FeatureRow) — anche emette `JjodelEvents.SELECT_NODE` | Tree |
| Tree click (viewpoint / sub-view) | TreeViewContent.tsx (ViewpointNode/SubViewItem) | Tree |
| Canvas click (EditorV2 onNodeClick) | EditorV2.tsx (selectElement helper) | Canvas |
| Canvas requestAnimationFrame child select | EditorV2.tsx:2864 (`selectChildElement`) | Canvas |
| (vari altri write nel codebase, sempre stessa firma) | `grep -rn "SetRootFieldAction.new('_lastSelected'"` | — |

**Tree e canvas scrivono nello stesso campo**: bene, single channel.

### Custom DOM events della selezione

| Evento | File | Scopo |
|---|---|---|
| `jjodel:selectNode` (`SELECT_NODE`) | events/registry.ts:15 | Tree → EditorV2 per centrare il node (instance) sul canvas, NON cambia diagram |
| `treeview:scroll-to-element` (`TREEVIEW_SCROLL`) | events/registry.ts:95 | scroll del tree su un node id (canvas → tree) |
| `jjodel:openMegamodel` | events/registry.ts:30 | Apre il tab project_summary; consumato da ProjectEditor.tsx:362 |
| `jjodel:openTransformation` | events/registry.ts:34 | Apre tab transformation |
| `jjodel:editor-type-change` | events/registry.ts:10 | Notifica cambio tab attivo (su body data attribute) |

### Consumer della selezione

- `Info.tsx` → mapStateToProps legge `_lastSelected.modelElement` per sapere quale entity renderizzare
- `Selectors.getActiveModel()` (selectors.ts:64) → ricava il model ancestor dal `modelElement`
- `Selectors.getLastSelectedModel()` (selectors.ts:75) → wrapper più ricco
- `EditorV2.tsx:921` → `_lastSelected.modelElement` per badge "selezionato" sul canvas
- `TreeViewContent.tsx` → `state._lastSelected?.modelElement` (per highlight della row)
- `PropertiesWithTreeView.tsx:42` → `state._lastSelected?.view` (per auto-suppress tree)

### Stato del binding canvas↔tree

| Direzione | Stato |
|---|---|
| canvas → property panel | ✅ presente (canvas scrive `_lastSelected.modelElement`, Info legge) |
| tree → property panel | ✅ presente (tree scrive `_lastSelected`, Info legge) |
| canvas → tree | ⚠️ parziale: TreeViewContent ha handler `TREEVIEW_SCROLL` per scrollare sull'elemento, ma il tree NON evidenzia automaticamente l'elemento selezionato dal canvas (deve scattare anche un re-render con la row evidenziata via `selectedElementId`). Verificare runtime |
| tree (model/metamodel) → canvas swap | ❌ **assente**: cliccare un MODEL/METAMODEL nel tree NON cambia il tab attivo del Dock. Solo `LeftBar` (`pages/components/LeftBar.tsx:382, 390`) chiama `DockManager.open2` |
| tree (instance/feature) → canvas focus | ⚠️ parziale: tree emette `SELECT_NODE`, EditorV2 centra il canvas, ma assume che il modello giusto sia già aperto |

---

## Task 5 — Canvas: come cambia la view oggi

### Concetto di "view corrente del canvas"

Il "canvas" non ha un singolo stato globale "current diagram id". Invece:

1. **rc-dock tab attivo** — il `DockLayout` (libreria `rc-dock`) tiene la struttura tab e quale è attivo. `DockManager.dock` (DockManager.tsx:16) è il singleton.
2. **`state.viewpoint`** (store.tsx:165) — pointer al DViewPoint attivo (NB: non è la "view corrente", ma il viewpoint che drive l'editorMode toggle in EditorSwitch).
3. Per ogni model/metamodel aperto come tab, ha il proprio stato interno (selected, zoom, ecc.) localmente.

### Meccanismo per cambiare canvas

**API canonica**: `DockManager.open2(me: LModel)` (DockManager.tsx:105):

```ts
static async open2(me: LModel): Promise<void> {
    const tab = (me.isMetamodel) ? TabDataMaker.metamodel(me) : TabDataMaker.model(me);
    await DockManager.open('models', tab);
}
```

Auto-detects metamodel vs model via `me.isMetamodel`. Idempotente: `DockManager.open` (line 91-104) controlla se il tab esiste già con lo stesso `id`; se sì, lo riattiva via `dock.updateTab(id, null, true)` invece di duplicarlo.

### Call sites esistenti

| File:linea | Contesto |
|---|---|
| `pages/components/LeftBar.tsx:382, 390` | Click su un metamodel/model item nella sidebar sinistra |
| `pages/components/Dashboard.tsx:427, 433, 449, 454` | Click su una card metamodel/model nella dashboard |
| `components/project/ProjectEditor.tsx:848, 852, 1526, 2445` | Vari flow: open su creazione, open dopo restore, ecc. |
| `components/Jodie/Jodie.tsx:565` | `DockManager.open('editors', tab)` per mostrare un tab editor |
| `components/abstract/DockManager.tsx:221` | Open del primo metamodel automaticamente |

### Tipi di tab

`DockManager.closeTabsForEntity` (DockManager.tsx:54-89) elenca i prefissi tab supportati:
- Metamodel/Model: id diretto (entity ID)
- Documentation: `doc_${entityId}`
- Transformation: `jjtl_${entityId}`
- Viewpoint: `vp_${entityId}`
- (project_summary è un tab speciale fixed-id — Dock.tsx:272)

### API riusabile per il binding tree→canvas

**Sì**: `DockManager.open2(lModel)` è esattamente l'API che serve per "tree click metamodel/model → canvas swap". È idempotente, async, ben testata. Per i package/class non c'è canvas swap (il package non è un "canvas-aperto-able" — vedi le decisioni del prompt: classifier nodes restano sul parent diagram, non swappano).

---

## Task 6 — Persistenza dello stato di progetto

### Schema rilevante di `DProject`

File: `frontend/src/joiner/classes.ts:2920-2962`. Campi (lista non esaustiva, solo i pertinenti):

```ts
@Leaf @RuntimeAccessible('DProject')
export class DProject extends DPointerTargetable {
    id!: Pointer<DProject, 1, 1, LProject>;
    _Id?: string;                  // db GUID
    father!: Pointer<DUser>;
    type: 'public'|'private'|'collaborative' = 'public';
    name!: string;
    author: Pointer<DUser> = DUser.current;
    collaborators: Pointer<DUser, 0, 'N'> = [];
    metamodels: Pointer<DModel, 0, 'N'> = [];
    models: Pointer<DModel, 0, 'N'> = [];
    graphs: Pointer<DGraph, 0, 'N'> = [];
    viewpoints: Pointer<DViewPoint, 0, 'N'> = [];
    activeViewpoint: Pointer<DViewPoint, 1, 1>;
    favorite!: Dictionary<...>;
    description!: string;
    creation: number = Date.now();
    lastModified: number = Date.now();
    isFavorite: boolean = false;
    layout!: Dictionary<string, LayoutData>;        // ← già esiste (per dock layouts)
    autosaveLayout!: boolean;
    activeLayout?: string;
    state!: string;                                  // serialized state blob
    version!: number;
    tagNames!: string[];
    transformations: any[] = [];
    expandedTreeNodes: string[] = [];                // ← introdotto nella migration 2.215→2.216
}
```

`LProject` (logic wrapper) replica i campi al `:3035`. Pattern di accesso via proxy: `LProject.getProject().expandedTreeNodes`.

### Persistenza

**Blob unico**: l'intero stato Redux `idlookup` viene serializzato/deserializzato come unico blob. Punti di entry:

- **Save**: tramite `SaveManager` (`frontend/src/components/topbar/SaveManager.ts`) — chiamate `SetFieldAction.new(projectId, 'fieldName', val, '', false)` su DProject vengono incluse automaticamente nel save successivo.
- **Load**: `VersionFixer.update(state); LoadAction.new(state)` — pattern in `SaveManager.ts:42-57`.
- **Auto-repair**: `VersionFixer.autocorrect(state)` in caso di stato inconsistente.

**Nessuna config separata** è necessaria per aggiungere un nuovo campo a DProject: basta dichiararlo nella classe, init nel constructor, e (per progetti esistenti) seedlo via VersionFixer.

### VersionFixer

File: `frontend/src/redux/VersionFixer.tsx`. È invocato in `SaveManager.ts:56` durante il load, e in altri punti via `VersionFixer.update(state)`.

**Highest version corrente**: `2.216` (computata automaticamente da `setup()` line 76-103, dai nomi metodi `'X.X -> Y.Y'`).

**Snippet della migration `2.215 -> 2.216`** come template (VersionFixer.tsx:710-763):

```ts
// 2.215 → 2.216: introduce DProject.expandedTreeNodes for persistent
// tree-view expand/collapse state. For each existing project, seeds the
// array with synthetic section keys + every metamodel/package/sub-package/
// class/model id reachable from the project. Features (foglie) are not
// seeded. Idempotent: skips projects that already have an array set.
private ['2.215 -> 2.216'](s: DState): DState {
    let seeded = 0;
    for (let k in s.idlookup) {
        let e = s.idlookup[k] as any;
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DProject') continue;
        if (Array.isArray(e.expandedTreeNodes)) continue;

        const expanded: string[] = [
            '__section:megamodel',
            '__section:metamodels',
            '__section:viewpoints',
            ...
        ];
        // ... seeding logic
        e.expandedTreeNodes = expanded;
        seeded++;
    }
    if (seeded > 0) {
        console.log(`[VersionFixer 2.215 -> 2.216] Seeded ${seeded} project(s).`);
    }
    return s;
}
```

**Pattern**: idempotente (skip se già presente), iterazione su `s.idlookup`, filtro per `className`, console.log finale del count.

### Default per nuovi campi

I default per i nuovi campi vanno in **due posti**:
1. Class declaration (es. `expandedTreeNodes: string[] = []` in `classes.ts:2961`).
2. Constructor `DProject(...)` (`classes.ts:1248-1250`):
   ```ts
   _this.tagNames = [];
   _this.expandedTreeNodes = [];
   ```

Per layout-related fields che il prompt prevede (`layoutPropertyPanelWidth`, `layoutTreeWidth`, ecc.):
- **Conferma**: aggiunta a `DProject` schema + LProject + Constructor + nuova migration `'2.216 -> 2.217'`.
- **Non serve** aggiornare `Info` dichiarativa esterna (non ce n'è una per DProject; lo schema è la singola classe). I `__info_of__*` esistono solo per altri tipi (vedi GraphDataElements.tsx).

---

## Task 7 — Drag & resize: cosa esiste già

### Inventario componenti

| Componente | Path | Stato |
|---|---|---|
| `ResizeHandle` | `components/ResizeHandle/ResizeHandle.tsx:16-40` | **Riusabile**. Generico, callback-driven, supporta horizontal/vertical, double-click reset. |
| `SimpleResizeHandle` | `components/SimpleResizeHandle.tsx:8-67` | Specializzato per console (clamp 200-600 hardcoded, listener globali interni). Meno riutilizzabile. |
| `SimpleFooterResizeHandle` | `components/SimpleFooterResizeHandle.tsx` | Variante footer. |
| `useResizableConsole` | `hooks/useResizableConsole.ts:21-121` | Hook completo: state + drag listeners + localStorage. Pattern solido. |
| `useResizableFooter` | `hooks/useResizableFooter.ts` | Pari pattern per footer. |
| `BottomDrawer` | `components/panels/BottomDrawer.tsx` | Self-contained drawer con drag verticale. Disabilitato in EditorV2 (commento "duplicates right Properties panel"). |
| `ResizableLayout.example.tsx` | `components/ResizeHandle/ResizableLayout.example.tsx` | Esempio canvas+console split, non usato in prod. |
| Tree view sidebar resize (legacy) | `TreeViewSidebar.tsx:81-111` | Esiste in `TreeViewSidebar.tsx` (DEAD CODE). |

### Library disponibili

`grep -ri "splitpane\|react-split\|react-resizable\|allotment\|re-resizable" frontend/src/ frontend/package.json`: **0 hit**.

`rc-dock` esiste (libreria dock principale, gestisce internamente i resize tra panel del dock), ma non è applicabile fuori dal dock.

### Verdetto

**Riutilizzare** `ResizeHandle` + pattern `useResizableConsole` (state locale + global listeners). Per persistenza per-progetto dei width invece di localStorage, modificare il pattern in modo che invece di `localStorage.setItem(STORAGE_KEY, ...)` faccia `SetFieldAction.new(projectId, 'layoutPropertyPanelWidth', ..., '', false)`.

**Non introdurre** una libreria split-pane esterna. Pattern già consolidato e leggero (~50 righe per hook).

---

## Task 8 — Modalità "split editor" e altri layout switching

### EditorSwitch e ActiveEditorContext

Confermati:
- `frontend/src/components/abstract/tabs/EditorSwitch.tsx:26-66` — wrappa MetamodelTab e ModelTab. Espone toggle `flow|classic|split`.
- `frontend/src/components/editor-v2/ActiveEditorContext.tsx:22-62` — `ActiveEditorProvider` + `useActiveEditor()` hook. Singolo state `activeEditor: 'classic'|'flow'|null` per traccia visiva quale dei due ha focus.

`EditorSwitch` è ATTIVO solo quando `state.viewpoint` è truthy AND non è un metamodello. Per i metamodelli e per modelli senza viewpoint attivo, EditorV2 in modalità flow-only senza toggle.

### Composizione con la topologia X (4 colonne)

Il modo split è **scoped a un singolo tab del Dock** (al modello aperto): divide l'area canvas del tab in due sub-canvas (classic + flow v2 affiancati). I tab del Dock contengono ognuno il proprio EditorSwitch.

**Prevedere disambiguazione**: nella topologia X (`rail | canvas | property | tree`), il "canvas" sarà **lo spazio occupato da rc-dock** o **lo spazio singolo del tab attivo**?

- **Opzione A**: il "canvas" della topologia X coincide con `project-dock-wrapper`. Lo split editor vive interamente dentro quella colonna, il property panel + tree restano colonne separate. Pulito, no conflitti.
- **Opzione B**: la topologia X sostituisce il rc-dock con un layout custom. **Sconsigliato** (rc-dock ha N tab dinamici: model/metamodel/transformation/console/properties/...; refactor enorme).

**Verdetto**: l'opzione A è la naturale; lo split editor è ortogonale alla topologia X. Ma serve una conferma esplicita su come il "rail | canvas" si compone con il fatto che canvas può essere split-orizzontale (classic|flow).

### Stripe cyan 4px

CSS dedicato in `EditorV2.scss:3386`:

```scss
.editor-split-container .is-active-editor::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: var(--color-info);
    z-index: 200;
}
```

**Scoped a `.editor-split-container .is-active-editor`** (i due sub-canvas affiancati). NON è riusabile per la "selezione globale del nodo" della topologia X — è un pattern UI dedicato all'attivo dei due editor split. Per la selezione del nodo nel canvas, EditorV2 usa una "selected" property locale al graph element.

---

## Task 9 — Open Questions

### OQ1 — `TreeViewSidebar.tsx` standalone è dead code

**Cosa**: il file `frontend/src/components/TreeViewSidebar/TreeViewSidebar.tsx` (212 righe) implementa una sidebar resolution-adaptive (monitor/desktop/laptop, overlay floating, resize 200-400px). Esporta `TreeViewSidebar` (default) + `TreeViewContent` via `index.ts`. Tuttavia il grep per `<TreeViewSidebar` o `TreeViewSidebar />` ritorna **zero match** in tutto il codebase: il componente NON è mai montato. L'unico riferimento è un commento in `Dock.tsx:275` che dice "now using dedicated TreeViewSidebar component" — fuorviante.

**Perché ambiguità**: il suo SCSS (`tree-view-sidebar.scss`) è invece importato e ricco di stili "tree-view-sidebar*" che però sono effettivamente non usati al runtime (perché il container è `properties-with-tree-view` non `tree-view-sidebar`). Possibile dead code in entrambi (TSX + parte SCSS).

**Decisione**: rimuovere TreeViewSidebar.tsx e relative classi SCSS legacy nel refactor della topologia X (visto che la nuova shell userà comunque `<TreeViewContent>` direttamente come colonna shell-level)? Da Alfonso. **Raccomandato**: pianificare cleanup come task separato post-implementation.

### OQ2 — Sezione `OVERVIEW` del MODEL panel

**Cosa**: lo screenshot di Alfonso mostra il property panel di `model_1` con sezioni `Overview / General / Dependencies`. Il codice attuale (Info.tsx:316-348) ha solo `conformance-bar` (un alert sopra le sezioni) + `GENERAL` + `DEPENDENCIES` + `CONTENTS` (se metamodel). **Nessuna sezione `OVERVIEW`**.

**Perché ambiguità**: lo screenshot potrebbe essere (a) una mockup futura, (b) un layout diverso che emerge da un'altra path code, (c) un'evoluzione concordata in chat ma non ancora implementata.

**Decisione**: chiedere ad Alfonso se "OVERVIEW" è un wording change per "conformance-bar + qualche altra info compressa", oppure una sezione nuova da aggiungere, oppure il rendering attuale è proprio `conformance-bar + GENERAL + DEPENDENCIES` e lo screenshot rappresenta un mockup proposto (con OVERVIEW come label nuova).

### OQ3 — Canvas swap dal tree per metamodel/model click

**Cosa**: oggi `tree click su metamodel/model` scrive solo `_lastSelected` ma NON chiama `DockManager.open2(lModel)`. Il prompt v2 della topologia X dice "METAMODEL/MODEL/PACKAGE → canvas swappa alla loro diagram view". Quindi il binding va aggiunto.

**Perché ambiguità**: la `LeftBar` lo fa già. Il tree dovrebbe duplicare la logica oppure delegare a un'utility condivisa? Inoltre: per i package il prompt dice "canvas swappa" ma non c'è un tab "package canvas" oggi (i package vivono dentro un metamodel — il canvas swap dovrebbe essere `open2(parentMetamodel)` + scroll/zoom al package?).

**Decisione**: chiedere ad Alfonso. Raccomandato:
- Per metamodel/model: chiamare `DockManager.open2(lModel)` direttamente nel handler di MetamodelNode/ModelNode (parità con LeftBar).
- Per package: `DockManager.open2(parentMetamodel)` + dispatch di un evento/azione "scroll-to-package" (da definire).

### OQ4 — `state.viewpoint` vs `state._lastSelected.view`

**Cosa**: Esistono due "viewpoint state" simili:
- `state.viewpoint: Pointer<DViewPoint>` (store.tsx:165) — viewpoint attivo "globale", drive il toggle EditorSwitch.
- `state._lastSelected.view: Pointer<DViewElement>` (store.tsx:159) — view (DViewElement) selezionata corrente.

**Perché ambiguità**: il tree click su un viewpoint scrive solo `_lastSelected.view` — non aggiorna `state.viewpoint`. Il prompt dice "Configuration nodes (viewpoint, view-of-X, validation overlay) → canvas invariato, property panel mostra config". Quindi va bene non toccare `state.viewpoint` da tree click? Confermare con Alfonso.

### OQ5 — Width persistence: per-progetto vs globale

**Cosa**: il prompt v2 dice "Persistenza: per-progetto in DProject, migration 2.216 → 2.217". Però oggi il tree-view collapsed/expanded state è **per-progetto** (DProject.expandedTreeNodes), mentre il tree-view visibility flag è **globale localStorage** (TreeViewPanelContext: `jjodel_treeview_visible`), e width è **hardcoded** (260px).

**Perché ambiguità**: width per-progetto è nuovo. Decidere se anche il "tree visible/hidden" diventa per-progetto (deprecando la chiave localStorage) o resta globale. Raccomandato: per-progetto (consistenza con expandedTreeNodes); deprecare localStorage key con migration cleanup oppure leave-it-alone.

### OQ6 — `properties-with-tree-view` esiste come tab del Dock; topologia X lo eleva a shell

**Cosa**: il `<PropertiesWithTreeView mode='tab'>` è registrato come tab del Dock (Dock.tsx:273), group `'editors'`. Nella topologia X, properties + tree saranno colonne shell-level, non più tab del Dock.

**Perché ambiguità**: cosa succede al tab "Properties" del Dock? Si rimuove (eliminandolo da Dock.tsx)? Si tiene per backward compatibility? Inoltre, `mode='tab'` sembra suggerire altri modes (`popup`/`inline` esistono nel componente: PropertiesWithTreeView.tsx:26). La modalità `inline` ritorna solo `<Info>` (line 67-69) — è quella che andrebbe usata nella nuova shell?

**Decisione**: chiedere ad Alfonso. Raccomandato: la nuova shell elide il tab Properties e renderizza direttamente `<Info>` come colonna, senza wrapper. Eventuale rimozione del tab dal Dock e di `PropertiesWithTreeView` come componente intermedio.

### OQ7 — Selection multipla?

**Cosa**: `state._lastSelected` è single-object, single-select. EditorV2 ha però `selectedNodes` (array, riga 911-913) per multi-select su canvas (es. delete multipli, copy/paste, distribuzione spaziale).

**Perché ambiguità**: il prompt v2 dice "Selection è single source of truth: cliccare un nodo nel tree o nel canvas drive il property panel" — questo è già single-select. Ma se il canvas supporta multi-select, il property panel deve gestire un array? Oppure single-select continua a essere il driver per Info, e multi-select resta canvas-locale?

**Decisione**: confermare con Alfonso che single-select è sufficiente per il property panel; multi-select resta uno stato canvas-locale (transient, non in `_lastSelected`).

### OQ8 — Mounting iniziale del binding canvas-swap

**Cosa**: oggi il default tab del Dock al load progetto è `project_summary` (Dock.tsx:272). Quando si apre un metamodello dal tree (con il nuovo binding), il tab si apre — ma **se la topologia X mette il tree come colonna shell-level**, il tree è sempre visibile, quindi cliccare un metamodello SEMPRE swappa il canvas. Vogliamo questo comportamento al primo click? O serve un soft-default (es. solo doppio-click swappa, single-click solo seleziona)?

**Decisione**: Alfonso. Raccomandato: single-click swappa (parità con LeftBar). Il property panel si apre comunque (single source of truth).

### OQ9 — Dead BottomDrawer / ElementPropertiesDrawer

**Cosa**: `BottomDrawer` e `ElementPropertiesDrawer` sono in `components/panels/`, ancora compilati ma disabilitati (commenti in EditorV2.tsx:85-86). **Dead code parziale**.

**Perché ambiguità**: lasciarlo? Eliminarlo nel refactor topologia X? Raccomandato: lasciare per ora (basso costo manutenzione, niente conflitto), eliminare in un cleanup post-implementation.

### OQ10 — Width minima del canvas

**Cosa**: prompt v2 dice "canvas flex (min 300px)". Ma il canvas oggi (rc-dock) gestisce internamente la larghezza dei tab; non c'è un single "canvas div" facilmente vincolabile.

**Perché ambiguità**: imporre `min-width: 300px` sul `project-dock-wrapper` significa che drag oltre min sui dividers tree/property risulta clamped. Va bene? O preferiamo che il canvas possa contrarsi sotto 300 (con scrollbar interno)? Raccomandato: clamp con cursor:not-allowed feedback al limite.

---

## Sintesi architetturale

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              App.tsx (HashRouter)                       │
│   ┌── route '/project' → ProjectPage                                    │
│       └── Project.tsx → <Dashboard active="Project">                    │
│           └── ProjectDashboard (Dashboard.tsx:544)  ← shell editor      │
│               ├── <Navbar>                                              │
│               ├── <div .dashboard-container.two-column>                 │
│               │   ├── <LeftBar>  (hide if metamodel/model/transf tab)   │
│               │   └── <div .project-dock-wrapper>                       │
│               │       └── <Dock>  (rc-dock, tabs: Properties, Metadata, │
│               │           Node, Console, project_summary, model_X, ..) │
│               │           └── <PropertiesWithTreeView mode='tab'>       │
│               │               ├── <Info>  ← properties (mega-switch)    │
│               │               └── <TreeViewContent>  ← tree, 260px      │
│               └── <StatusBar>                                           │
└─────────────────────────────────────────────────────────────────────────┘

State channels:
  state._lastSelected: {node, view, modelElement}  ← single source of truth
    │
    ├── written by:  TreeViewContent (tree click)
    │                 EditorV2.onNodeClick (canvas click)
    │                 (selectChildElement, etc.)
    │
    └── read by:     Info (property panel)
                     Selectors.getActiveModel/getLastSelectedModel
                     EditorV2 (canvas highlight)
                     TreeViewContent (highlight row)

Canvas swap API:
  DockManager.open2(LModel)  ← idempotent, called by LeftBar / Dashboard / ProjectEditor
                                NOT called by TreeViewContent (gap)

Persistence:
  DProject.expandedTreeNodes  (per-project, migration 2.215→2.216)
  DProject.layout, .activeLayout  (already exists)
  localStorage `jjodel_treeview_visible`, `jjodel_console_height`  (global, legacy)
  state blob → SaveManager → backend
```

---

## Raccomandazioni operative

1. **Refactor incrementale**, non rewrite. La shell attuale è frammentata ma le primitive (ResizeHandle, useResizable*, DockManager.open2, _lastSelected, expandedTreeNodes) sono solide. Il refactor consiste nel **promuovere `Info` e `TreeViewContent` da contenuti-di-tab a colonne-shell-level**, dietro a una nuova `ProjectShell` o estendendo `ProjectDashboard`.

2. **Sequenza PR consigliata** (4-5 PR, ognuna ~1-2 sessioni):

   - **PR1 (foundations)**: aggiungere campi DProject (`layoutPropertyPanelWidth`, `layoutTreeWidth`, `layoutPropertyPanelOpen`, `layoutFocusMode` ecc.) + migration `2.216→2.217`. Default values. Niente UI changes.
   - **PR2 (shell layout)**: introdurre nuova shell 4-colonne in ProjectDashboard. Rail (50px), Canvas (project-dock-wrapper, flex), Property (driven da `_lastSelected`), Tree (always present). Dividers draggabili tra canvas/property e property/tree. Width persistite via PR1. **Risolvere OQ1, OQ6 (rimuovere il tab Properties dal Dock o tenerlo come fallback?)**.
   - **PR3 (selection bindings)**: tree click → `DockManager.open2` per metamodel/model; package → metamodel + scroll. Property auto-open su cambio `_lastSelected`. Focus canvas mode toggle.
   - **PR4 (polish)**: stripe cyan, conformance pill, OVERVIEW section (se OQ2 risolta), keyboard shortcuts (focus mode, toggle tree, ecc.), dark mode override.
   - **PR5 (cleanup)**: rimozione TreeViewSidebar.tsx dead code (OQ1), classi SCSS legacy non più usate, BottomDrawer/ElementPropertiesDrawer (OQ9).

3. **Parallelizzazione possibile**: PR1 e PR3 sono indipendenti se PR3 usa width hardcoded provvisorio. Le altre sono sequenziali.

4. **Open Questions da risolvere prima di iniziare**: OQ2 (OVERVIEW), OQ3 (canvas swap dal tree), OQ5 (visibility per-progetto?), OQ6 (cosa fare del tab Properties), OQ7 (single-select?). Le altre (OQ1, OQ4, OQ8, OQ9, OQ10) possono essere chiuse durante l'implementazione.

5. **Rischio principale**: la composizione tra topologia X (rail | canvas | property | tree) e split editor mode (canvas spezzato in classic|flow) può generare layouts complessi. **Test critico**: aprire un model con viewpoint attivo, attivare split mode, cliccare un classifier sul tree. Tutto deve funzionare senza che le 4 colonne shell vadano in conflitto con le 2 sub-colonne canvas. OQ8 da chiudere prima.

---

**Stop conditions: nessuna triggata.**
- Branch confermato `alfonso-frontend-jjtl`.
- Layout root identificato (ProjectDashboard).
- TreeViewSidebar.tsx duplicato confermato come dead code → annotato in OQ1, non risolto qui.
- DProject schema corrisponde ai pattern attesi.
- Migration `2.215 → 2.216` verificata, no side effects sospetti.
- Cronologia recente in `claude-code-log.md` allineata.
- `git status`: nessun file di codice toccato in questa sessione (i modified erano già pre-esistenti dal lavoro precedente).

# Viewpoint System — Codebase Map

**Generated**: 2026-03-28
**Purpose**: Reference for viewpoint management redesign (Phase A)

---

## 1. File Inventory

### Core Data Model
| File | Purpose |
|------|---------|
| `frontend/src/view/viewPoint/viewpoint.ts` | `DViewPoint`, `LViewPoint` class definitions |
| `frontend/src/view/viewElement/view.tsx` | `DViewElement`, `LViewElement` — base classes (50+ properties) |
| `frontend/src/joiner/classes.ts` | `NodeTransientProperties`, `ViewScore`, `ViewTransientProperties`, `ViewEClassMatch` enum |
| `frontend/src/common/Defaults.ts` | Default viewpoint pointer IDs and category arrays |
| `frontend/src/redux/defaults/views.ts` | `DefaultViews` — factory methods for default views (Model, Class, Enum, etc.) |

### Viewpoints UI — Tree & Editor
| File | Purpose |
|------|---------|
| `frontend/src/components/editors/views/NestedView.tsx` | Main Viewpoints tab — hierarchical tree + view list |
| `frontend/src/components/editors/views/ViewData.tsx` | View editor container — 6 sub-tabs |
| `frontend/src/components/editors/views/nestedView.scss` | Main viewpoints tree styling |
| `frontend/src/components/editors/views/data/InfoData.tsx` | **Apply To** sub-tab |
| `frontend/src/components/editors/views/data/TemplateData.tsx` | **Template** sub-tab (JSX editor) |
| `frontend/src/components/editors/views/data/PaletteData.tsx` | **Style** sub-tab (CSS + palette) |
| `frontend/src/components/editors/views/data/CustomData.tsx` | **Events** sub-tab |
| `frontend/src/components/editors/views/data/GenericNodeData.tsx` | **Options** sub-tab (delegates to NodeData/EdgeData/etc.) |
| `frontend/src/components/editors/views/data/NodeData.tsx` | Vertex-specific options |
| `frontend/src/components/editors/views/data/FieldData.tsx` | Field-specific options |
| `frontend/src/components/editors/views/data/EdgeData.tsx` | Edge-specific options |
| `frontend/src/components/editors/views/data/EdgePointData.tsx` | Edge point options |
| `frontend/src/components/editors/views/data/GraphData.tsx` | Graph options (grid, snap) |
| `frontend/src/components/editors/views/data/ComponentsTab.tsx` | Viewpoint components — **TODO placeholder** |
| `frontend/src/components/editors/views/data/PermissionViewTab.tsx` | View permissions — **disabled** |
| `frontend/src/components/editors/views/data/PermissionViewpointTab.tsx` | Viewpoint permissions — **disabled** |

### SCSS Files
| File | Purpose |
|------|---------|
| `frontend/src/components/editors/views/nestedView.scss` | Tree styling, badges, toggles |
| `frontend/src/components/editors/views/data/viewapplyto.scss` | Apply To tab form layout |
| `frontend/src/components/editors/views/data/viewoptions.scss` | Options tab styling |
| `frontend/src/components/editors/views/data/events-tab.scss` | Events tab styling |
| `frontend/src/components/editors/views/data/palette-data.scss` | Style tab palette editor |
| `frontend/src/components/editors/views/data/permissions.scss` | Permissions tab styling |

### Language Editors (used inside view sub-tabs)
| File | Purpose |
|------|---------|
| `frontend/src/components/editors/languages/Jsx.tsx` | JSX editor (Monaco, reads/writes `view.jsxString`) |
| `frontend/src/components/editors/languages/Js.tsx` | JavaScript editor (Monaco) |
| `frontend/src/components/editors/languages/Ocl.tsx` | OCL editor (Monaco, reads/writes `view.oclCondition`) |
| `frontend/src/components/editors/languages/index.ts` | Barrel exports |

### Tab System
| File | Purpose |
|------|---------|
| `frontend/src/components/abstract/DockManager.tsx` | `DockManager` — central tab lifecycle (open/close) |
| `frontend/src/components/abstract/tabs/TabDataMaker.tsx` | Factory for `TabData` objects (metamodel, model, doc, transformation) |
| `frontend/src/components/abstract/Dock.tsx` | Main dock layout, layout modes (split/sidebar/canvas-only) |
| `frontend/src/components/dock/MyRcDock.tsx` | `PinnableDock` — extended rc-dock with pinning |
| `frontend/src/components/abstract/tabs/MetamodelTab.tsx` | Metamodel editor tab |
| `frontend/src/components/abstract/tabs/ModelTab.tsx` | Model editor tab |
| `frontend/src/components/abstract/tabs/EditorSwitch.tsx` | Auto-switch classic ↔ v2 based on viewpoint |
| `frontend/src/components/abstract/tabs/ModelsSummaryTab.tsx` | Default overview tab |
| `frontend/src/components/abstract/tabs/DocumentationTab.tsx` | Documentation tab |

### Classic Editor (Rendering Pipeline)
| File | Purpose |
|------|---------|
| `frontend/src/graph/graphElement/graphElement.tsx` | `GraphElementComponent` — core view matching & JSX rendering |
| `frontend/src/graph/defaultNode/DefaultNode.tsx` | `DefaultNodeComponent` — routes to Graph/Vertex/Field based on className |
| `frontend/src/graph/vertex/Vertex.tsx` | `VertexComponent` — drag/resize/rotate interactions |
| `frontend/src/redux/reducer/reducer.ts` | JSX & UD compilation, measurable event compilation |
| `frontend/src/redux/selectors/selectors.ts` | `Selectors.getAppliedViewsNew()` — view matching & scoring |
| `frontend/src/ocl/ocl.tsx` | OCL predicate evaluation (`@stekoe/ocl.js`) |
| `frontend/src/common/UX.tsx` | JSX tree traversal, prop injection |
| `frontend/src/DSL/DSL.ts` | `<Children>` tag expansion and DSL processing |

### Flow Editor (Editor v2)
| File | Purpose |
|------|---------|
| `frontend/src/components/editor-v2/EditorV2.tsx` | Main React Flow editor (~2669 lines) |
| `frontend/src/components/editor-v2/viewpoint/ViewpointRenderer.tsx` | Runtime JSX renderer for concrete syntax |
| `frontend/src/components/editor-v2/sync/canvasToJjom.ts` | Canvas → JJOM sync |
| `frontend/src/components/editor-v2/utils/jjomTransformers.ts` | JJOM → React Flow transformers |
| `frontend/src/components/editor-v2/hooks/` | useJjomSync, useEditorMode, useAutoAnchor, etc. |
| `frontend/src/components/editor-v2/panels/PalettePanel.tsx` | Drag/drop feature palette |
| `frontend/src/components/editor-v2/panels/PropertiesPanel.tsx` | Element properties |

### Dashboard (Viewpoints Section)
| File | Purpose |
|------|---------|
| `frontend/src/components/project/ProjectEditor.tsx` | Dashboard — viewpoint listing, create, duplicate, delete |

### Examples / Defaults
| File | Purpose |
|------|---------|
| `frontend/src/redux/store.tsx` | Creates default viewpoints (`DViewPoint.newVP('Default', ...)`) at lines 251, 329 |
| `frontend/src/examples/StateMachine/index.ts` | Example: programmatic viewpoint/view manipulation |

---

## 2. Data Model

### Inheritance Hierarchy

```
DPointerTargetable
  └── DViewElement          (view.tsx:162)
       ├── DViewPoint       (viewpoint.ts:15) — viewpoint = a special view that acts as container
       └── (regular views)  — children of a viewpoint
```

### DViewPoint (extends DViewElement)

```typescript
// viewpoint.ts:15-37
class DViewPoint extends DViewElement {
    id!: Pointer<DViewPoint, 1, 1, LViewPoint>;
    name!: string;

    // Factory method
    static newVP(name: string, callback?: (d: DViewElement) => void, persist?: boolean, id?: string): DViewPoint
}
```

**Viewpoints ARE views** — they inherit all DViewElement properties but serve as containers/roots in the view hierarchy.

### DViewElement (Complete Property List)

```typescript
// view.tsx:162-374 — 50+ properties
class DViewElement extends DPointerTargetable {
    // Identity
    id!: Pointer<DViewElement, 1, 1, LViewElement>;
    name!: string;

    // Classification
    isValidation!: boolean;              // validation viewpoint group?
    isExclusiveView!: boolean;           // exclusive (main render) vs overlay (decoration)

    // Hierarchy
    viewpoint!: Pointer<DViewPoint>;     // parent viewpoint back-reference
    subViews!: Dictionary<Pointer<DViewElement>, number>;  // child views with priority

    // Selector / Predicate
    appliableTo!: 'Any' | 'Graph' | 'GraphVertex' | 'Vertex' | 'Edge' | 'EdgePoint' | 'Field';
    appliableToClasses!: string[];       // e.g. ['DClass', 'DAttribute']
    oclCondition!: string;               // OCL constraint
    jsCondition!: string;                // JavaScript condition
    explicitApplicationPriority!: number;

    // Template
    jsxString!: string;                  // JSX template code
    constants?: string;                  // JS constants evaluated once on load
    usageDeclarations?: string;          // observed properties (triggers re-render)

    // Style
    palette!: Readonly<PaletteType>;     // color/number/path controls
    css!: string;                        // SCSS/CSS code
    compiled_css!: string;               // compiled palette + CSS
    cssIsGlobal!: boolean;

    // Layout
    defaultVSize!: GraphSize;            // default width/height
    adaptWidth!: boolean;
    adaptHeight!: boolean;
    draggable!: boolean;
    resizable!: boolean;
    snap!: GraphPoint;
    grid!: { x?: number; y?: number; type?: "polar" | "cartesian"; center?: TLCoord; visible?: boolean };

    // Events
    events!: Dictionary<DocString<"functionName">, DocString<"functionBody">>;
    onDataUpdate!: string;
    onDragStart!: string; whileDragging!: string; onDragEnd!: string;
    onResizeStart!: string; whileResizing!: string; onResizeEnd!: string;
    onRotationStart!: string; whileRotating!: string; onRotationEnd!: string;

    // Edge-specific
    longestLabel!: labeltype;
    labels!: labeltype;
}
```

### PaletteType (Style Controls)

```typescript
type PaletteControl = { type: 'color', value: tinycolor.ColorFormats.RGBA[] };
type NumberControl  = { type: 'number', value: number, unit: string };
type StringControl  = { type: 'text', value: string };
type PathControl    = { type: 'path', value: string, x: string, y: string, options: {k: string, v: string}[] };
type PaletteType    = Dictionary<string, PaletteControl | NumberControl | StringControl | PathControl>;
```

### Relationship: Project → Viewpoint → View

```
DProject
├── viewpoints: Pointer<DViewPoint>[]        // all viewpoints in project
├── activeViewpoint: Pointer<DViewPoint>     // currently active
├── models: Pointer<DModel>[]
└── graphs: Pointer<DGraph>[]

DViewPoint (IS-A DViewElement)
├── name: string
├── isValidation: boolean
├── isExclusiveView: boolean
└── subViews: { [Pointer<DViewElement>]: priority }   // containment tree
     └── DViewElement (child view)
          ├── viewpoint: Pointer<DViewPoint>           // back-reference
          ├── appliableToClasses: string[]
          ├── jsxString, css, events, ...
          └── subViews: { ... }                        // nested further
```

### Viewpoint Differentiation

There is **no enum** for viewpoint types. Instead, two boolean flags create 4 combinations:

| `isExclusiveView` | `isValidation` | Role |
|---|---|---|
| `true` | `false` | **Exclusive Viewpoint** — renders main content (syntax) |
| `false` | `false` | **Overlay Viewpoint** — adds decoration/info on top |
| `true` | `true` | **Exclusive Validation** — renders validation as main content |
| `false` | `true` | **Overlay Validation** — validation decorations/overlays |

**Default viewpoints** created at store init (`redux/store.tsx:251,329`):
- `Pointer_ViewPointDefault` — name "Default", holds syntax views
- `Pointer_ViewPointValidation` — name "Default Validation", holds validation views

**Default views** organized by category (`Defaults.ts:5-30`):
- **Data structure**: Model, Package, Class, Enum, Attribute, Reference, Operation, Parameter, Literal, Object, Value
- **Edges**: EdgeAssociation, EdgeDependency, EdgeInheritance, EdgeAggregation, EdgeComposition, EdgePoint
- **UI utility**: Anchors, Singleton, Fallback
- **Validation**: CheckName, Overlay, Lowerbound

---

## 3. UI Components — Current Viewpoint Panel

### Main Component: NestedView

**File:** `components/editors/views/NestedView.tsx`
**Registered in Dock** (line 275): Title "Viewpoints", group "editors", non-closable.

**Structure:**
- **Basic mode** (lines 472-489): Shows locked-feature message — viewpoints only available in Advanced mode
- **Advanced mode** (lines 493-524): Renders tree + view editor

**Tree rendering** — `renderEntry()` (lines 85-287):
- Each viewpoint renders as a box with:
  - Radio button (if exclusive) or checkbox (if overlay)
  - `EX` or `OV` badge
  - Expand/collapse toggle
  - Child views listed underneath
- `select()` function (lines 109-127) handles viewpoint activation

**New viewpoint creation** (line 50-51):
```typescript
name = U.increaseEndingNumber(name, false, false, newName => viewpointNames.indexOf(newName) >= 0);
DViewPoint.newVP(name);
```

### View Editor: ViewData

**File:** `components/editors/views/ViewData.tsx` (135 lines)
**Tab ID prefix:** `"Dock_in_view_detail"`

**6 Sub-tabs** (lines 56-65):

| # | Tab | Component | Scope |
|---|-----|-----------|-------|
| 1 | Apply to | `InfoData` | All views |
| 2 | Template | `TemplateData` | Views only (not viewpoints) |
| 3 | Style | `PaletteData` | All |
| 4 | Events | `CustomData` | Views only |
| 5 | Options | `GenericNodeData` | Views only |
| 6 | Permissions | `PermissionViewTab` / `PermissionViewpointTab` | **Commented out** |

### Sub-tab Details

**Apply To** (`InfoData.tsx`):
- Name (text input)
- Is Exclusive (toggle)
- Priority (number, views only)
- Preferred appearance (dropdown, views only)
- Object types multi-select (DModel, DPackage, DClass, DEnumerator, etc.)

**Template** (`TemplateData.tsx`):
- `JsxEditor` — Monaco with TypeScript+JSX, reads `dview.jsxString`, writes `view.jsxString`
- Constants field — JS expression
- Observed properties (usageDeclarations) field — JS expression

**Style** (`PaletteData.tsx`):
- CSS/LESS Monaco editor
- Palette color pickers
- Numeric controls (px, em, %, etc.)
- Edge marker editor modal
- Expandable/collapsible

**Events** (`CustomData.tsx`):
- Default events: `onDataUpdate`, `onDragStart/End`, `whileDragging`, `onResizeStart/End`, `whileResizing`
- Custom events: add/edit/delete with inline name editor
- Each event uses `JsEditor` component

**Options** (`GenericNodeData.tsx`):
- Delegates to: `NodeData` (vertex), `FieldData`, `EdgeData`, `EdgePointData`, `GraphData`
- NodeData: store size, lazy update, adapt width/height, draggable, etc.
- GraphData: grid settings, snap-to, visibility

### Component Hierarchy

```
Dock.tsx
  └─> NestedView (Viewpoints tab)
       ├─> Tree view (renderEntry)
       │    ├─ Viewpoint box (radio/checkbox, EX/OV badge)
       │    └─ View entries (expand/collapse)
       └─> ViewData (when view selected)
            ├─> InfoData (Apply To)
            ├─> TemplateData → JsxEditor (Monaco)
            ├─> PaletteData → Monaco CSS editor + palette UI
            ├─> CustomData → JsEditor components
            ├─> GenericNodeData
            │    ├─> NodeData / FieldData / EdgeData / EdgePointData / GraphData
            └─> ComponentsTab (TODO placeholder)
```

---

## 4. Rendering Engine

### Full Pipeline

```
User edits model element
  ↓
Redux Action (SetFieldAction)
  ↓
reducer() → postProcessState()
  ├─ Detects VIEWS_RECOMPILE_jsxString[] / VIEWS_RECOMPILE_usageDeclarations[]
  ├─ Recompiles JSXFunction for affected views (new Function(...))
  └─ Marks nodes for re-evaluation
  ↓
GraphElementComponent.mapStateToProps()
  ├─ Calls Selectors.getAppliedViewsNew({data, node, nid, pv})
  ├─ Selectors.updateScores() — evaluates JS, OCL, metaclass conditions
  ├─ NodeTransientProperties.sort() — ranks views by final score
  └─ Returns mainView + stackViews (decorative)
  ↓
GraphElementComponent.shouldComponentUpdate()
  ├─ Compares UD changes via compareUsageDeclarations()
  └─ Returns true if re-render needed
  ↓
GraphElementComponent.render()
  ├─ For each view in [decorative...] + [main]:
  │   ├─ computeUsageDeclarations() → execute UDFunction
  │   ├─ getJSXContext(vid) → merge UD + constants + data + node + view
  │   ├─ getTemplate3(vid, view, context) → execute JSXFunction.call(context)
  │   ├─ renderView() → UX.recursiveMap + UX.injectProp + React.cloneElement
  │   └─ If decorative: store in decoratorViewsOutput[]
  └─ Return mainViewOutput (decorators accessible via context.decorators)
  ↓
Browser DOM render
```

### JSX Compilation

**File:** `redux/reducer/reducer.ts` (lines 976-1002)

```typescript
// Compile JSX string to executable function
const body = 'return (' + UX.parseAndInject(DSL.parser(dv.jsxString), dv) + ')';
tv.JSXFunction = new Function(paramStr, body);
// paramStr = '{data, node, view, constants, ...}'
// Stored in: transientProperties.view[vid].JSXFunction
```

**DSL.parser** (`DSL/DSL.ts`) processes custom `<Children>` tags with include/exclude filters before compilation.

### View Matching & Scoring

**File:** `redux/selectors/selectors.ts` (lines 356-606)

**Three-layer matching:**

1. **Metaclass matching** (`matchesMetaClassTarget()`):
   - Checks `view.appliableToClasses` vs `data.className`
   - Returns: `EXACT_MATCH(1)` | `INHERITANCE_MATCH(0.5)` | `IMPLICIT_MATCH(0.1)` | `MISMATCH(-1)`

2. **JS condition** (`updateJSScore()`, lines 718-743):
   - Compiled from `dview.jsCondition` string
   - Executed: `tv.jsCondition({data, node, view, constants})`

3. **OCL predicate** (`OCL.test()`, ocl.tsx:127):
   - Uses `@stekoe/ocl.js` engine
   - Cached via `lazyEvaluateOCL()` (only re-evaluates on data/condition change)

**Final score:**
```typescript
finalScore = viewPointMatch * metaclassScore * parentViewScore * explicitPriority
```

### ViewScore Enum

```typescript
enum ViewEClassMatch {
    EXACT_MATCH = 1,
    INHERITANCE_MATCH = 0.5,
    IMPLICIT_MATCH = 0.1,
    VP_Explicit = 1,
    VP_Default = 0.5,
    VP_Decorative = 1,
    VP_MISMATCH = 0,
    MISMATCH = -1,
    MISMATCH_PRECONDITIONS = -1,
    MISMATCH_JS = -0.5,
    MISMATCH_OCL = -0.5,
}
```

### View Composition (Overlays)

**File:** `joiner/classes.ts` (lines 3973-4021)

```typescript
class NodeTransientProperties {
    mainView!: LViewElement;           // THE exclusive view (highest score, isExclusiveView=true)
    validMainViews!: LViewElement[];   // All exclusive views ranked
    stackViews!: LViewElement[];       // All decorative views (isExclusiveView=false)
    viewScores: Dictionary<Pointer<DViewElement>, ViewScore> = {};
}
```

**Sorting logic** (lines 3997-4021):
- Separate views into `mainViews[]` (exclusive) and `decorativeViews[]` (overlay)
- Sort each by score (highest first)
- `mainView` = highest-scoring exclusive view
- `stackViews` = all matching decorative views

**Rendering composition** (graphElement.tsx:1300-1340):
- Decorative views render first, stored in `decoratorViewsOutput[]`
- Main view renders last, gets `context.decorators` = decorative outputs
- Main view receives full DOM props (ref, id, onClick, etc.)
- Decorative views receive minimal props (`data-viewid`, `data-mainview`)

### Usage Declarations (Observed Properties / Triggers)

**Compilation** (reducer.ts:878):
```typescript
tv.UDFunction = new Function(paramStr, 'return (' + dv.usageDeclarations + ')(ret)');
```

**Execution** (graphElement.tsx:120):
```typescript
tv.UDFunction.call(UDEvalContext, UDEvalContext, udret);
// Result stored in: ViewScore.usageDeclarations
```

**Re-evaluation trigger** (graphElement.tsx:448):
- `compareUsageDeclarations()` checks if any UD property changed
- If changed → `nodeviewentry.shouldUpdate = true` → forces JSX re-render

### Event Binding

**Compiled** (reducer.ts:1055-1057):
```typescript
tv[key] = new Function(paramStr, eventBody);
// key = 'onDataUpdate' | 'onDragStart' | 'whileDragging' | ...
```

**Executed** (graphElement.tsx:537-553):
```typescript
doMeasurableEvent(type: EMeasurableEvents, vid) {
    let func = transientProperties.view[vid][type];
    TRANSACTION(name + '.' + type + '()', () => {
        func.call(context, context);
    });
}
```

### Transient Properties Cache

```typescript
const transientProperties = {
    node: Dictionary<Pointer<DGraphElement>, NodeTransientProperties>,
    view: Dictionary<Pointer<DViewElement>, ViewTransientProperties>,
    modelElement: Dictionary<Pointer<DModelElement>, DataTransientProperties>,
};

class ViewTransientProperties {
    JSXFunction!: (scope) => ReactNode;
    UDFunction!: (scope, ret) => void;
    jsCondition!: (context) => boolean;
    onDataUpdate, onDragStart, onDragEnd, whileDragging, ...
    constants!: GObject;
    oclEngine!: OclEngine;
}

class ViewScore {
    viewPointMatch!: number;
    metaclassScore!: number;
    jsScore!: number | boolean;
    OCLScore!: boolean;
    finalScore!: number;
    usageDeclarations!: GObject;    // computed observed properties
    jsxOutput?: React.ReactNode;    // cached JSX render
    shouldUpdate!: boolean;
}
```

---

## 5. Tab System

### Architecture

Uses **rc-dock** library extended with `PinnableDock` (`dock/MyRcDock.tsx`).

### Tab ID Patterns

| Type | ID Format | Example |
|------|-----------|---------|
| Metamodel/Model | Entity ID directly | `"abc123"` |
| Documentation | `doc_${entityId}` | `"doc_abc123"` |
| Transformation | `jjtl_${entityId}` | `"jjtl_abc123"` |
| View detail | `Dock_in_view_detail` prefix | — |

### DockManager (`DockManager.tsx`, 279 lines)

```typescript
class DockManager {
    static dock: DockLayout | null;

    static closeTab(tabId: string): boolean;
    static closeTabsForEntity(entityId, entityType): void;
    static open(group: 'models' | 'editors', tab: TabData): void;
    static open2(me: LModel): void;                  // opens model with event dispatch
    static openDocumentation(project, doc): void;
    static openTransformation(transformation, source, target, ...): void;
}
```

### TabDataMaker (`TabDataMaker.tsx`, 46 lines)

```typescript
class TabDataMaker {
    static metamodel(model: DModel | LModel): TabData;
    static model(model: DModel | LModel): TabData;
    static documentation(model?: DModel | LModel): TabData;
}
```

### Layout Modes

**Type:** `'split' | 'sidebar' | 'canvas-only' | 'vertical-console'`

```
split:          [  models panel  |  editors panel  ]
sidebar:        [  models panel (wide) | editors (narrow) ]
canvas-only:    [  models panel (100%)  ]
vertical-console: [  models panel  |  console (bottom)  ]
```

- Saved/restored via `getSavedLayoutMode()` / `saveLayoutMode()`
- Changed via `jjodel:layout-mode-change` custom event

### Tab Groups

- **`models`** group → left panel: MetamodelTab, ModelTab, DocumentationTab, ModelsSummaryTab
- **`editors`** group → right panel: Properties, Tree View, Viewpoints, Node, Console

### How to Register a New Tab Type

1. Create component in `components/abstract/tabs/NewTab.tsx`
2. Add factory method in `TabDataMaker.tsx`:
   ```typescript
   static myTab(model?: DModel | LModel): TabData {
       return { id: 'my-tab', title: <div>My Tab</div>, group: 'models', closable: true, content: <MyTab /> };
   }
   ```
3. Open via `DockManager.open('models', TabDataMaker.myTab())`

### Custom Events

| Event | Detail | Purpose |
|-------|--------|---------|
| `jjodel:editor-type-change` | `{ editorType: 'metamodel' \| 'model' \| 'transformation' \| 'summary' }` | Active tab type changed |
| `jjodel:layout-mode-change` | `{ mode: LayoutMode, resetToDefault?: boolean }` | Layout mode changed |
| `jjodel:export-canvas` | — | Canvas export trigger |

### EditorSwitch (`EditorSwitch.tsx`, 53 lines)

Auto-switches between classic and v2 editor based on active viewpoint:
- `state.viewpoint` exists → Classic editor (concrete syntax)
- `state.viewpoint` is null → Editor v2 (abstract syntax)
- Displays badge: "Concrete syntax" or "Abstract syntax"

---

## 6. Dashboard

### Viewpoints Section in ProjectEditor

**File:** `components/project/ProjectEditor.tsx`

**Location in dashboard** (line 1531): Section ID `'viewpoints'`, group `'perspectives'`, icon letter `'V'`

**Section structure** (lines 2061-2120):
- Section header with count badge
- Empty state: "No viewpoints defined" + description
- List of viewpoint cards, each showing:
  - Name
  - Badge: "Overlay Viewpoint" or "Viewpoint" (based on `vp.isOverlay`)
  - Duplicate button → `vp.duplicate()`
  - Delete button → `vp.delete()`

**Viewpoints data source** (line 150):
```typescript
const viewpoints = project.viewpoints || [];
```

**Section ordering** (line 298):
```typescript
const sectionIds = ['metamodels', 'models', 'transformations', 'viewpoints', 'documentation'];
```

**Note:** There is no "New Viewpoint" button in the dashboard. Viewpoint creation happens only in the `NestedView` panel (Advanced mode) via `DViewPoint.newVP()`.

---

## 7. Flow Editor & Split View

### Editor v2 (`EditorV2.tsx`, ~2669 lines)

- Based on **React Flow**
- Node types: ClassNode, EnumNode, PackageNode, ObjectNode
- Edge types: UnifiedEdge (reference, inheritance, composition, instanceRef)
- Sync hooks: `useJjomSync`, `useJjomSelection`, `useEditorMode`, `useAutoAnchor`, `useHistory`, `useAlignment`
- Panels: PalettePanel (drag/drop), PropertiesPanel

### ViewpointRenderer (`editor-v2/viewpoint/ViewpointRenderer.tsx`, 31 lines)

Runtime JSX renderer for concrete syntax within Editor v2:
```typescript
const fn = new Function('React', 'data', `return (${jsxString})`);
return fn(React, context);
```

Memoized — only re-evaluates if `jsxString` or `context` changes.

### Split View

**No dedicated split-view between Classic and Flow editors exists.** The EditorSwitch component renders one OR the other:
- Viewpoint active → Classic
- No viewpoint → Editor v2

The dock layout itself supports split panels (left = models, right = editors), but there's no mechanism to show Classic + Flow side by side for the same model.

### Editor Switch Mechanism

Controlled by Redux `state.viewpoint`:
- Clicking a viewpoint in NestedView sets `state.viewpoint` → triggers switch to Classic
- Deactivating viewpoint clears `state.viewpoint` → triggers switch to v2

---

## 8. JSDL Components

### Current State

**No JSDL component system exists in the codebase.** Searches for "JSDL", "jsdl", "ComponentRegistry", "registerComponent" returned zero results.

### Component Registry (Runtime)

A simple global component registry exists at runtime:
```typescript
// DefaultNode.tsx:124
let componentMap: Dictionary<string, (props, children?) => ReactElement> = windoww.components;
let dmodelMap: Dictionary<string, typeof DModelElement> = RuntimeAccessibleClass.classes;
```

This maps class names to React component factories, but it's not a structured JSDL system — it's the internal routing mechanism for the Classic editor.

### GraphElements Enum

Predefined component types: `Graph`, `GraphVertex`, `Vertex`, `Field`, `VoidVertex`

### Monaco Autocomplete

No viewpoint-specific autocomplete exists for Monaco editors used in view sub-tabs (JSX, JS, OCL, CSS).

---

## 9. Key Patterns & Conventions

### State Management

- **Viewpoints stored in:** `DProject.viewpoints[]` (Redux, via `DPointerTargetable`)
- **Active viewpoint:** `DProject.activeViewpoint` + Redux `state.viewpoint`
- **View selection:** Computed in `transientProperties` (not Redux state) — pure computation from view scores
- **All view compilations** (JSX, UD, events, conditions) stored in `transientProperties.view[vid]`

### View Lifecycle

1. **Creation:** `DViewPoint.newVP(name)` or direct `DViewElement` creation
2. **Compilation:** Reducer compiles JSX/UD/events/conditions → `transientProperties.view`
3. **Matching:** `Selectors.getAppliedViewsNew()` scores views per node
4. **Rendering:** `GraphElementComponent.render()` executes JSX in context
5. **Update:** UD comparison triggers selective re-render

### Communication Between Components

- **NestedView ↔ ViewData**: Selection state in NestedView determines which view's data ViewData shows
- **NestedView → Classic Editor**: Setting active viewpoint triggers EditorSwitch to use Classic
- **Classic Editor → Views**: `GraphElementComponent` queries `transientProperties` for matching views
- **View edits → Re-render**: Reducer detects field changes, recompiles affected functions, marks nodes dirty

### Naming Conventions

- `DViewPoint` / `LViewPoint` — Data/Logic viewpoint classes
- `DViewElement` / `LViewElement` — Data/Logic view element classes
- `tv` = `transientProperties.view[vid]` (common abbreviation in code)
- `tn` = `transientProperties.node[nid]` (common abbreviation in code)
- `tnv` = `tn.viewScores[vid]` (node+view combination)

### Progressive Disclosure

- Viewpoints tab **only visible in Advanced mode** (NestedView.tsx:472-489)
- Basic mode shows a placeholder message

---

## 10. Risks & Dependencies

### Fragile Areas

1. **`graphElement.tsx` is massive** (~1500+ lines) — the core rendering pipeline is concentrated in one file. Changes to view matching/rendering affect everything.

2. **`new Function()` pattern** — JSX templates, UD, events, and conditions are all compiled via `new Function()`. This is a security surface if user-provided code is not sanitized (currently acceptable for a research tool).

3. **Transient properties are not Redux state** — View computations (scores, compiled functions, cached JSX) live in a mutable singleton. This bypasses Redux's immutability guarantees and can cause subtle bugs if invalidation is missed.

4. **OCL dependency** — Uses `@stekoe/ocl.js` which may be unmaintained. OCL evaluation is cached aggressively via `lazyEvaluateOCL()`.

5. **NestedView has two rendering paths** — `renderEntry()` (new) and `renderEntry2()` (legacy/deprecated). The legacy path should be removed to avoid confusion.

### Non-obvious Dependencies

- **EditorSwitch reads `state.viewpoint`** — Any change to how viewpoints activate/deactivate must update this Redux field, otherwise the editor won't switch correctly.

- **Reducer processes view changes** — JSX compilation happens in the reducer (`reducer.ts:976-1002`), not in components. If view properties change, the reducer must detect and recompile.

- **`DViewPoint extends DViewElement`** — Viewpoints and views share the same property set. This means viewpoints have JSX, CSS, events, etc. even though they typically don't use them directly (they act as containers).

- **View priority & scoring involves 4 factors** — metaclass match, OCL, JS condition, explicit priority. Missing any factor in the score calculation can cause wrong view selection.

### Dead / Disabled Code

- **PermissionViewTab / PermissionViewpointTab** — Components exist but commented out in ViewData.tsx (lines 62-64)
- **ComponentsTab** — Renders only "components tab todo" placeholder
- **`renderEntry2()`** in NestedView — Deprecated rendering function, still present
- **`rightbar/viewsEditor/`** — Legacy directory, mostly empty (1-line SCSS file)

### Potential Blockers for Redesign

1. **rc-dock coupling** — The entire tab/panel system depends on rc-dock. Changing panel layout requires understanding PinnableDock's extensions.

2. **Classic editor is jQuery-based** — `Vertex.tsx` uses jQuery UI for draggable/resizable/rotatable. Any redesign of the rendering pipeline must coexist with this.

3. **No test coverage for view matching** — The scoring/matching logic in `selectors.ts` lacks dedicated unit tests. Changes risk breaking view selection silently.

4. **Global `windoww.components`** — The component registry is a global mutable object. Adding new component types (e.g., for JSDL) requires careful namespace management.

5. **Advanced-mode gate** — Viewpoints are gated behind Advanced mode. If the redesign wants viewpoints accessible to Basic users, the NestedView component's mode check must be relaxed.

# Fase 0 — Report di Esplorazione della Codebase

## 0.1 Editor Attuale

### Percorsi chiave

| File | Descrizione |
|------|-------------|
| `frontend/src/pages/Project.tsx` | Route handler (`/#/project?id=...`) |
| `frontend/src/pages/components/Dashboard.tsx` | Layout principale (2-column con rc-dock) |
| `frontend/src/components/abstract/tabs/MetamodelTab.tsx` | Tab editor metamodello — monta il canvas |
| `frontend/src/components/abstract/tabs/ModelTab.tsx` | Tab editor modello |
| `frontend/src/components/abstract/DockManager.ts` | Gestione tab lifecycle (singleton) |
| `frontend/src/components/abstract/tabs/TabDataMaker.tsx` | Factory per creare tab (metamodel/model/doc) |
| `frontend/src/graph/defaultNode/DefaultNode.tsx` | Smistamento nodo → componente (Graph, Vertex, Field) |
| `frontend/src/graph/vertex/Vertex.tsx` | Componente Vertex (~600 righe), drag/resize via jQuery UI |
| `frontend/src/graph/graphElement/graphElement.tsx` | **CORE RENDERER** (~1560 righe) — rendering JSX template, viewport culling, interazioni |

### Come viene montato

1. **Route:** `/#/project?id={projectId}` → `ProjectPage` carica stato progetto da API
2. **Dashboard:** `active='Project'` → `ProjectDashboard` con `Dock` (rc-dock)
3. **Tab:** `DockManager.open2(model)` → `TabDataMaker.metamodel(model)` → `<MetamodelTab modelid={model.id} />`
4. **Canvas:** `MetamodelTab.mapStateToProps` risolve `LModel` e `LGraph` da Redux → rende `<DefaultNode data={model} />`
5. **Rendering:** `DefaultNode` → `GraphElementComponent.render()` → valuta JSX template dalle View → rendering ricorsivo dei figli

### Come legge Redux

```typescript
// MetamodelTab.mapStateToProps
const model = LModel.fromPointer(ownProps.modelid);
const graphs = DGraph.fromPointer(state.graphs);
const graph = graphs.find(g => g.model === model.id);
```

- Usa `connect()` (react-redux class components)
- `LModel.fromPointer()` ritorna proxy wrapper con computed properties
- Nodi visuali in `state.graphs[graphId].children[]`
- Dati semantici in `state.idlookup[elementId]`
- Posizioni in `DGraphElement.{x, y, w, h}`
- View matching tramite `Selectors.getAppliedViewsNew()`

### Rendering nodi/edge

- **Nodi:** `GraphElementComponent.render()` compila `jsxString` dalla View in funzione React, inietta props via `UX.injectProp()`, applica posizione CSS (`--top`, `--left`, `--width`, `--height`)
- **Edge:** `DEdge/LEdge` con `start`, `end`, `midPoints`, `segments` precomputati per SVG path
- **Drag:** jQuery UI draggable in `VertexComponent`, aggiorna Redux via `SetFieldAction`
- **Zoom:** `GraphElementComponent.onScroll()` → aggiorna `graph.zoom`

---

## 0.2 Editor v2 (React Flow)

### Percorso e dipendenze

| File | Descrizione |
|------|-------------|
| `frontend/src/components/editor-v2/` | **Directory completa** dell'editor v2 |
| `frontend/src/components/editor-v2/EditorV2.tsx` | Componente principale (~1160 righe) |
| `frontend/src/App.tsx:132` | Route: `<Route path={'editor-v2'} element={<EditorV2/>}/>` |

**Dipendenza:** `@xyflow/react: ^12.10.0` (moderna, non `reactflow` legacy)

### Struttura directory

```
editor-v2/
├── EditorV2.tsx                  # Main component (ReactFlowProvider + EditorV2Inner)
├── EditorV2.scss, _themes.scss, _notations.scss, _color-schemes.scss
├── types.ts                      # Tutti i tipi TS (180 righe)
├── contexts/
│   ├── EditorContext.tsx          # takeSnapshot, notation, callbacks
│   └── ObstacleGridContext.tsx    # Griglia A* per routing edge
├── hooks/
│   ├── useHistory.ts             # Undo/redo stack (50 snapshot)
│   ├── useAutoAnchor.ts          # Selezione anchor ottimale + isteresi
│   ├── useObstacleAwareAnchors.ts
│   ├── useAlignment.ts           # Align/distribute
│   └── useTreeLayout.ts          # Layout albero per ereditarietà multipla
├── nodes/
│   ├── ClassNode.tsx             # Nodo classe (attributi, operazioni)
│   ├── EnumNode.tsx              # Nodo enumerazione (literal)
│   └── PackageNode.tsx           # Nodo package (container, resizable)
├── edges/
│   ├── UnifiedEdge.tsx           # Edge unificato (reference + inheritance)
│   ├── SegmentHandles.tsx        # Drag waypoint su segmenti
│   └── EndpointHandles.tsx
├── components/
│   ├── DynamicHandles.tsx        # Pool pre-allocato (4 handle/lato)
│   ├── EdgeTypePopup.tsx         # Picker tipo connessione
│   └── ...
├── panels/
│   ├── PalettePanel.tsx          # Sidebar sinistra drag-to-create
│   └── PropertiesPanel.tsx       # Sidebar destra proprietà
├── utils/
│   ├── edgeUtils.ts              # Manhattan + A* routing
│   ├── astarPathfinder.ts        # Algoritmo A*
│   └── ObstacleGrid.ts, portDistribution.ts
└── viewpoint/
    └── ViewpointRenderer.tsx     # Rendering contenuto nodo per notazione
```

### Connessione a Redux

**NESSUNA.** L'editor v2 è **100% isolato** da Redux:
- Zero import di `useSelector`, `useDispatch`, `store`
- Stato locale con `useNodesState()`, `useEdgesState()` (hook React Flow)
- Dati demo hard-coded (Person, Address, NamedElement, Gender)
- Undo/redo custom con `useHistory` (ref-based stack)

### Feature già implementate

- ✅ Drag to create (Class, Enum, Package dalla palette)
- ✅ Drag to connect (edge con popup tipo: reference/inheritance)
- ✅ Pan, zoom, fit view, snap to grid
- ✅ Undo/redo (Ctrl+Z/Y, 50 snapshot)
- ✅ Copy/Cut/Paste, Select All
- ✅ Inline editing ovunque (nomi, attributi, tipi)
- ✅ 5 notazioni (UML, Simplified, Compact, Wireframe, ER)
- ✅ 9 color scheme + dark/light theme
- ✅ A* obstacle-aware routing per edge Manhattan
- ✅ Waypoint draggabili per routing manuale
- ✅ Multi-inheritance tree layout
- ✅ Bidirectional edge deconfliction
- ✅ Alignment e distribution (multi-select)
- ✅ Context menu (right-click)
- ✅ Properties panel destro
- ✅ Palette panel sinistro

---

## 0.3 Store Redux / JjOM

### Struttura dello store

**File:** `frontend/src/redux/store.tsx` — `DState extends DPointerTargetable`

```typescript
DState {
  // Lookup globale
  idlookup: Record<Pointer, DPointerTargetable>   // O(1) lookup per ID

  // Grafo visuale
  graphs: Pointer<DGraph>[]
  vertexs: Pointer<DVertex>[]
  graphvertexs: Pointer<DGraphVertex>[]
  edges: Pointer<DEdge>[]
  edgepoints: Pointer<DEdgePoint>[]

  // Modello semantico
  models: Pointer<DModel>[]
  m2models: Pointer<DModel>[]  // metamodelli
  m1models: Pointer<DModel>[]  // modelli
  classs: Pointer<DClass>[]
  packages: Pointer<DPackage>[]
  attributes: Pointer<DAttribute>[]
  references: Pointer<DReference>[]
  operations: Pointer<DOperation>[]
  // ...

  // UI state
  isEdgePending: { user, source }
  advanced: boolean
}
```

### Gerarchia classi JjOM (grafo visuale)

```
DGraphElement (base)
├── x, y, w, h, zIndex
├── anchors: Dictionary<string, GraphPoint>
├── edgesIn: Pointer<DEdge>[]
├── edgesOut: Pointer<DEdge>[]
├── graph: Pointer<DGraph>      (contenitore)
├── model: Pointer<DModelElement>  (dato semantico collegato)
├── subElements: Pointer<DGraphElement>[]
├── isSelected: Dictionary<userId, boolean>
├── view: Pointer<DViewElement>
│
├── DGraph (container)
│   ├── zoom: GraphPoint
│   └── offset: GraphSize
│
├── DVoidVertex → DVertex
│   ├── isResized: boolean
│   └── DGraphVertex (ibrido Graph + Vertex)
│       ├── zoom, offset (da Graph)
│       └── x, y, w, h, isResized (da Vertex)
│
└── DVoidEdge → DEdge → DExtEdge, DRefEdge
    ├── start: Pointer<DGraphElement>
    ├── end: Pointer<DGraphElement>
    ├── anchorStart?: string | {x, y}
    ├── anchorEnd?: string | {x, y}
    ├── midPoints: InitialVertexSize[]
    ├── midnodes: Pointer<DEdgePoint>[]
    ├── isExtend, isReference, isValue, isDependency: boolean
    └── longestLabel?, labels?
```

### Accesso alla geometria

```typescript
// D-Layer (dati puri)
dVertex.x, dVertex.y              // posizione
dVertex.w, dVertex.h              // dimensioni
dVertex.zIndex                    // z-order
dVertex.anchors                   // punti di ancoraggio

// L-Layer (proxy con computed props)
lVertex.position   // → {x, y}
lVertex.size       // → {x, y, w, h}
lVertex.width, lVertex.height     // alias
```

### Sistema di anchor

```typescript
anchors: Dictionary<string, GraphPoint>
// Esempio:
{
  "north": { x: 0.5, y: 0 },     // centro alto (coordinate relative 0-1)
  "south": { x: 0.5, y: 1 },     // centro basso
  "east":  { x: 1, y: 0.5 },     // centro destro
  "west":  { x: 0, y: 0.5 }      // centro sinistro
}
```

Nell'editor v2, il sistema handle usa un pool pre-allocato (4 handle/lato) con `DynamicHandles.tsx`.

### Edge

```typescript
DVoidEdge {
  start: Pointer<DGraphElement>       // nodo sorgente
  end: Pointer<DGraphElement>         // nodo destinazione
  anchorStart?: string | {x, y}      // nome anchor o coordinata
  anchorEnd?: string | {x, y}
  midPoints: InitialVertexSize[]      // istruzioni generazione punti intermedi
  midnodes: Pointer<DEdgePoint>[]     // punti generati effettivi
  isExtend, isReference, isValue, isDependency: boolean
}
```

### Action Redux esistenti

| Action | Uso |
|--------|-----|
| `SetFieldAction.new(obj, field, value, accessMod, isPointer)` | Modifica campo su qualsiasi oggetto |
| `SetRootFieldAction.new(field, value, accessMod, isPointer)` | Modifica campo root di DState |
| `TRANSACTION(name, fn)` | Batching atomico di multiple action |
| `BEGIN() / END() / ABORT()` | Controllo transazione manuale |

```typescript
// Spostare un nodo
SetFieldAction.new(dVertex, 'x', 100, undefined, false);
SetFieldAction.new(dVertex, 'y', 200, undefined, false);

// Aggiungere un edge
SetFieldAction.new(dVertex, 'edgesOut', edgePointer, '+=', true);

// Aggiungere un grafo allo state
SetRootFieldAction.new('graphs', graphPointer, '+=', true);
```

---

## 0.4 Layout dell'Applicazione

### Routing

- **HashRouter** (React Router v6): `/#/route?params`
- **Route progetto:** `/#/project?id={projectId}`
- **Route editor v2:** `/#/editor-v2` (standalone, nessun contesto progetto)

### Layout quando il progetto è aperto

```
┌─────────────────────────────────────────────────────────────┐
│  Navbar (top bar: undo/redo, zoom, layout mode toggle)      │
├────────┬────────────────────────────────┬───────────────────┤
│        │  Dock (rc-dock)                │                   │
│        │  ┌─────────────┬──────────────┐│                   │
│ LeftBar│  │ Models      │ Properties   ││                   │
│        │  │ Summary     │ Viewpoints   ││                   │
│        │  │ Tab         │ Console      ││                   │
│        │  │             │ Node (adv)   ││                   │
│        │  │ ← Canvas →  │              ││                   │
│        │  └─────────────┴──────────────┘│                   │
├────────┴────────────────────────────────┴───────────────────┤
│  BottomToolbar                                              │
└─────────────────────────────────────────────────────────────┘
```

- **LeftBar:** Menu progetto, lista metamodelli/modelli
- **Dock panel sinistro:** Canvas editor (MetamodelTab/ModelTab) — gestito da `DockManager`
- **Dock panel destro:** Properties, Viewpoints, Console (tab fissi)
- **4 layout mode:** split (50/50), sidebar (70/30), canvas-only, vertical-console

### Come viene passato il contesto modello/metamodello

```
User clicca metamodello in LeftBar
→ LeftBar chiama DockManager.open2(model)
→ DockManager crea TabData via TabDataMaker.metamodel(model)
→ rc-dock rende <MetamodelTab modelid={model.id} />
→ MetamodelTab.mapStateToProps risolve LModel e LGraph da Redux
→ Rende <DefaultNode data={model} nodeid={graphId} graphid={graphId} />
→ Canvas visibile con nodi e edge
```

---

## Problemi e Incompatibilità Rilevate

### 1. Modelli dati completamente diversi

| Aspetto | Editor Attuale | Editor v2 |
|---------|---------------|-----------|
| Nodo | `DVertex/DGraphElement` (x, y, w, h, anchors, view) | `Node<ClassNodeData>` (position, data.label, data.attributes) |
| Edge | `DEdge` (start, end, anchorStart, anchorEnd, midPoints, isExtend...) | `Edge<ReferenceEdgeData>` (source, target, data.reference, data.waypoints) |
| Anchor | `anchors: Dictionary<string, GraphPoint>` (nomi arbitrari, coordinate %) | Pool pre-allocato `top-source-0..3`, `right-source-0..3` etc. |
| Stato | Redux globale (`DState`, `idlookup`, `SetFieldAction`) | React Flow locale (`useNodesState`, `useEdgesState`) |

**Impatto:** Servono funzioni di trasformazione JjOM ↔ React Flow (previste in Fase 2).

### 2. Sistema anchor incompatibile

L'editor attuale usa nomi arbitrari (`"north"`, `"south"`, `"0"`, `"tl"`, ecc.) con coordinate relative. L'editor v2 usa un pool pre-allocato con naming `{side}-{type}-{index}`. Serve un mapping bidirezionale.

### 3. Editor v2 completamente isolato

Nessuna connessione a Redux. Per la Fase 1 (coesistenza) basta montarlo nello stesso spazio. Per la Fase 2+ serve integrare i selector Redux.

### 4. Editor v2 non riceve contesto progetto

Attualmente montato su route standalone `/#/editor-v2` senza `modelid` o contesto progetto. Per integrarlo nei tab del Dock, deve accettare `modelid` come prop.

### 5. Pattern class component vs function component

L'editor attuale usa `connect()` (class components). L'editor v2 usa hooks (`useState`, `useCallback`). Coesistenza possibile, ma le funzioni di trasformazione dovranno usare entrambi i pattern.

### 6. Toolbar e panel duplicati

L'editor v2 ha la propria Toolbar, PalettePanel, PropertiesPanel. Quando integrato nel Dock, bisogna decidere cosa tenere e cosa delegare alla struttura esistente (Navbar, LeftBar, Properties tab destro).

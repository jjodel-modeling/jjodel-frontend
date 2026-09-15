# Jjodel Editor V3 — Design Document

> **Versione:** 1.0 — Febbraio 2026
> **Autore:** Claude (AI-assisted design)
> **Status:** Draft — Sezioni 1-5 (Architettura, Nodi, Sync, Edge, Viewpoint)

---

## Indice

1. [Architettura ad Alto Livello](#1-architettura-ad-alto-livello)
2. [Struttura Directory](#2-struttura-directory)
3. [Interfacce TypeScript](#3-interfacce-typescript)
4. [Sistema di Nodi](#4-sistema-di-nodi)
5. [Sync Layer](#5-sync-layer)
6. [Sistema di Edge](#6-sistema-di-edge)
7. [Viewpoint Rendering Pipeline](#7-viewpoint-rendering-pipeline)
8. [Palette Adattiva](#8-palette-adattiva)
9. [Layout Mapping DVertex/DEdge <-> React Flow](#9-layout-mapping)
10. [Piano di Implementazione](#10-piano-di-implementazione)

---

## 1. Architettura ad Alto Livello

### 1.1 Principio Guida: Viewpoint-First

La decisione architetturale fondamentale di V3 e che **ogni nodo e renderizzato da un viewpoint**. Non esiste un "rendering built-in" separato dal sistema viewpoint — i metamodelli (M2) usano un **default viewpoint** con notazioni UML/Simplified/Compact etc., mentre i modelli (M1) usano viewpoint custom definiti dall'utente.

Questo unifica l'architettura ed elimina la dicotomia M2/M1 a livello di componenti React:

```
┌───────────────────────────────────────────────────────────────────────┐
│                         EditorV3Shell                                 │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │                    ReactFlowProvider                            │  │
│  │  ┌───────────────────────────────────────────────────────────┐  │  │
│  │  │                     ReactFlow                             │  │  │
│  │  │                                                           │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐               │  │  │
│  │  │  │ModelNode  │  │ModelNode  │  │ModelNode  │  ← UNICO    │  │  │
│  │  │  │(Viewpoint │  │(Viewpoint │  │(Viewpoint │    tipo     │  │  │
│  │  │  │ renders   │  │ renders   │  │ renders   │    nodo     │  │  │
│  │  │  │ DClass)   │  │ DObject)  │  │ DPackage) │             │  │  │
│  │  │  └──────────┘  └──────────┘  └──────────┘               │  │  │
│  │  │        │              │              │                    │  │  │
│  │  │        └──────────────┼──────────────┘                   │  │  │
│  │  │                       ▼                                   │  │  │
│  │  │              ViewpointRenderer                            │  │  │
│  │  │              (JSX compilation +                           │  │  │
│  │  │               built-in components)                        │  │  │
│  │  │                                                           │  │  │
│  │  │  ┌──────────┐  ┌──────────┐                              │  │  │
│  │  │  │UnifiedEdge│  │UnifiedEdge│  ← UNICO tipo edge         │  │  │
│  │  │  └──────────┘  └──────────┘                              │  │  │
│  │  └───────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │AdaptivePalette│  │PropertiesPanel│  │     Toolbar  │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
└───────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                         Sync Layer                                    │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │ useJjomSyncV3   │  │ canvasToJjomV3 │  │ syncCoordinator       │  │
│  │ (JjOM → Canvas) │  │ (Canvas → JjOM)│  │ (anti-bounce + state) │  │
│  └────────────────┘  └────────────────┘  └────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
┌───────────────────────────────────────────────────────────────────────┐
│                    JjOM (Redux Store)                                  │
│  DModel ── DClass, DAttribute, DReference, DObject, DValue            │
│  DGraph ── DVertex, DEdge, DEdgePoint, DGraphVertex                   │
│  DViewPoint ── DViewElement                                           │
└───────────────────────────────────────────────────────────────────────┘
```

### 1.2 Scelta: Opzione C — Viewpoint come Renderer Universale

Delle tre opzioni presentate nel prompt:
- ~~Opzione A: node type unico con rendering condizionale~~ — crea un mega-switch
- ~~Opzione B: node types separati con base comune~~ — duplica logica
- **Opzione C: viewpoint come renderer universale** — scelta adottata

**Motivazione:**
1. Unifica il rendering: un solo `ModelNode` che delega al ViewpointRenderer
2. I viewpoint built-in per M2 (UML, Simplified, etc.) sono view precablate con JSX statico (non compilato a runtime)
3. I viewpoint custom per M1 usano la pipeline di compilazione JSX
4. Aggiungere notazioni future = aggiungere nuove DViewElement, non nuovi componenti React

**Distinzione importante:** I viewpoint built-in (M2) NON passano per `new Function()` — sono componenti React nativi registrati come "view renderers" nel registry. Solo i viewpoint custom (M1) usano la compilazione JSX. Questo perche:
- Performance: nessun overhead di compilazione per M2
- Type safety: le notazioni built-in sono tipizzate
- Sicurezza: meno codice user-supplied eseguito

### 1.3 Flusso Dati Principale

```
Redux State Change
       │
       ▼
useJjomSyncV3 (selector)
       │
       ├─ Per-element reference equality check
       ├─ Anti-bounce filter (skip canvas-written)
       ├─ Hash check (child properties)
       │
       ▼
jjomToRFTransformer
       │
       ├─ DVertex → Node<ModelNodeData>
       │    ├─ Resolve DViewElement (from vertex.view or matching)
       │    ├─ Map position (x, y)
       │    ├─ Map size (w, h vs defaultVSize)
       │    ├─ Map anchors (Dictionary<string, GraphPoint>)
       │    ├─ Map state (CSS dict)
       │    └─ Map zIndex
       │
       ├─ DEdge → Edge<UnifiedEdgeData>
       │    ├─ Map start/end → source/target
       │    ├─ Map anchor names → handle IDs
       │    ├─ Convert midPoints with CoordinateMode → waypoints
       │    └─ Map edge type flags (isExtend, isReference, etc.)
       │
       └─ Surgical update (rfNodeCache, rfEdgeCache)
              │
              ▼
       React Flow renders
              │
              ├─ ModelNode receives data → ViewpointRenderer
              │    ├─ Built-in view? → Direct React component
              │    └─ Custom JSX? → Compile + execute + render
              │
              └─ UnifiedEdge receives data → Manhattan routing
```

### 1.4 Confini dei Moduli

| Modulo | Responsabilita | NON fa |
|--------|----------------|--------|
| **EditorV3Shell** | Orchestrazione ReactFlow, toolbar, panels, shortcuts | Non conosce JjOM |
| **Sync Layer** | Bidirezionale JjOM ↔ RF, anti-bounce, caching | Non fa rendering |
| **ModelNode** | Wrapper RF node, delega a ViewpointRenderer | Non legge JjOM direttamente |
| **ViewpointRenderer** | Esecuzione view (built-in o JSX), CSS scoped | Non gestisce drag/resize |
| **DynamicAnchors** | Handle generation dalle ancore JjOM | Non calcola routing |
| **UnifiedEdge** | Routing Manhattan, label, markers | Non modifica JjOM |
| **AdaptivePalette** | Lista elementi drag-droppabili per M2/M1 | Non crea direttamente |
| **PropertiesPanel** | Editing proprieta dell'elemento selezionato | Scrive via canvasToJjom |

### 1.5 Decisioni Architetturali Chiave

| Decisione | Scelta | Alternativa scartata | Motivo |
|-----------|--------|---------------------|--------|
| Node type unico vs multipli | **Unico** (ModelNode) | ClassNode + EnumNode + ObjectNode + ... | Meno registrazione, viewpoint decide il rendering |
| Viewpoint built-in: React vs JSX compilato | **React nativo** | JSX compilato per tutto | Performance e type safety per M2 |
| Sync: evoluzione V2 vs rewrite | **Evoluzione** | Rewrite da zero | V2 sync e maturo, ben testato |
| Coordinate transform | **Nel sync layer** | Nei componenti | Centralizza la logica |
| Undo/redo | **Redux-based** (JjOM transactions) | Canvas-only snapshots | Consistenza tra canvas e modello |
| DGraphVertex (nested graphs) | **Expand/collapse** + sub-flow on expand | Always nested sub-flow | Performance con grafi profondi |

---

## 2. Struttura Directory

```
frontend/src/components/editor-v3/
├── EditorV3Shell.tsx            — Orchestratore: ReactFlow + toolbar + panels
├── EditorV3Inner.tsx            — Componente interno (dentro ReactFlowProvider)
├── types.ts                     — Tutte le interfacce TypeScript
├── constants.ts                 — Costanti condivise (max handles, timing, etc.)
│
├── nodes/
│   ├── ModelNode.tsx            — UNICO node type: wrapper RF + resize + drag
│   ├── ModelNodeContent.tsx     — Rendering interno: delega a viewpoint
│   └── DynamicAnchors.tsx       — Handle generation da ancore JjOM + viewpoint
│
├── edges/
│   ├── UnifiedEdge.tsx          — Tutti i tipi di arco (inheritance, reference, link M1)
│   ├── edgeRouting.ts           — Manhattan routing side-aware con curve
│   ├── astarPathfinder.ts       — A* obstacle avoidance (opt-in)
│   ├── ObstacleGrid.ts          — Grid per obstacle avoidance
│   ├── SegmentHandles.tsx       — Handle interattivi per waypoint editing
│   └── edgeMarkers.ts           — Definizioni marcatori SVG (frecce, diamanti, triangoli)
│
├── viewpoint/
│   ├── ViewpointRenderer.tsx    — Dispatcher: built-in vs custom JSX rendering
│   ├── ViewpointCompiler.ts     — Compilazione JSX → Function (sandboxed)
│   ├── ViewpointContext.ts      — Costruzione contesto (data, node, view, constants, UD)
│   ├── ViewpointCache.ts        — Cache compilazione JSX per performance
│   ├── builtins/
│   │   ├── BuiltInComponents.tsx — View, Field, Input, Text, SubView, Selector, Toggle, Image
│   │   ├── ErrorBoundary.tsx     — Cattura errori JSX senza crashare l'editor
│   │   └── ScopedCSS.tsx         — Iniezione CSS scoped per view
│   ├── registry/
│   │   ├── ViewRegistry.ts       — Registry di built-in views per M2 (UML, Simplified, etc.)
│   │   └── ViewMatcher.ts        — Matching DViewElement → DVertex/DObject
│   └── notations/
│       ├── UMLClassView.tsx       — Notazione UML completa
│       ├── SimplifiedView.tsx     — Notazione semplificata
│       ├── CompactView.tsx        — Notazione compatta
│       ├── WireframeView.tsx      — Notazione wireframe
│       ├── ERView.tsx             — Notazione Entity-Relationship
│       └── GenericObjectView.tsx  — Fallback per DObject senza viewpoint custom
│
├── sync/
│   ├── useJjomSyncV3.ts         — JjOM → Canvas (evoluzione V2: + DObject, + DValue, + view)
│   ├── canvasToJjomV3.ts        — Canvas → JjOM (+ operazioni M1)
│   ├── syncCoordinator.ts       — Anti-bounce, drop-created, edge registry
│   ├── jjomTransformers.ts      — DVertex/DEdge → RF Node/Edge (+ ModelNodeData)
│   └── coordinateTransforms.ts  — Conversione GraphPoint/GraphSize ↔ RF coordinates
│
├── hooks/
│   ├── useEditorMode.ts          — M2 vs M1, modello corrente, viewpoint attivo
│   ├── useHistory.ts             — Undo/redo basato su Redux transactions
│   ├── useAutoAnchor.ts          — Calcolo ancore con hysteresis (evoluzione V2)
│   ├── useAlignment.ts           — Alignment + distribution tools
│   ├── useTreeLayout.ts          — Tree layout per multi-inheritance
│   ├── useKeyboardShortcuts.ts   — Keyboard shortcut manager
│   ├── useNodeResize.ts          — Resize logic con isResized flag sync
│   ├── useConnectionValidation.ts — Validazione connessioni (no cicli, tipi compatibili)
│   ├── useViewportCulling.ts     — Performance: skip rendering nodi fuori viewport
│   └── useJjomSelection.ts      — Selection sync JjOM ↔ Canvas
│
├── panels/
│   ├── AdaptivePalette.tsx       — Palette che si adatta a M2/M1
│   ├── PaletteItem.tsx           — Singolo elemento draggabile
│   ├── PropertiesPanel.tsx       — Pannello proprieta selezionate
│   ├── ModelExplorer.tsx         — Tree view della struttura modello
│   └── SearchPanel.tsx           — Ricerca elementi nel canvas
│
├── toolbar/
│   ├── Toolbar.tsx               — Toolbar principale (zoom, undo, notation, theme)
│   ├── AlignmentToolbar.tsx      — Tools di allineamento
│   ├── NotationSelector.tsx      — Selezione notazione attiva
│   └── BreadcrumbNav.tsx         — Navigazione grafi annidati (DGraphVertex)
│
├── context-menu/
│   └── ContextMenu.tsx           — Menu contestuale (right-click)
│
├── contexts/
│   ├── EditorV3Context.tsx       — Context principale (mode, notification, snap)
│   └── ViewpointContext.tsx      — Context per viewpoint rendering
│
└── styles/
    ├── editor-v3.scss            — Stili base dell'editor
    ├── _themes.scss              — Dark/light theme variables
    ├── _notations.scss           — Stili per notazioni built-in
    ├── _color-schemes.scss       — 9+ color schemes
    └── _viewpoint.scss           — Stili per viewpoint rendering
```

### 2.1 Confronto con V2

| Aspetto | V2 | V3 |
|---------|----|----|
| Node types | 3 (ClassNode, EnumNode, PackageNode) | 1 (ModelNode) |
| Edge types | 1 (UnifiedEdge — gia unificato) | 1 (UnifiedEdge evoluto) |
| Viewpoint | Non presente | viewpoint/ directory completa |
| Sync | sync/ + hooks/useJjomSync | sync/ evoluto (+ M1, + coordinate transforms) |
| Notazioni | Inline nei node components | Separate in viewpoint/notations/ |
| Palette | Solo M2 (Class, Enum, Package) | Adattiva M2/M1 |

---

## 3. Interfacce TypeScript

### 3.1 Core Types

```typescript
// ============================================================
// types.ts — Tutte le interfacce per Editor V3
// ============================================================

import type { Node, Edge } from '@xyflow/react';

// ---- Editor Modes ----

/** Modalita dell'editor */
type EditorMode = 'metamodel' | 'model';

/** Notazione attiva per il rendering */
type NotationMode = 'uml' | 'simplified' | 'compact' | 'wireframe' | 'er' | 'viewpoint';

/** Color scheme */
type ColorScheme =
    | 'default' | 'pastel' | 'ocean' | 'forest'
    | 'sunset' | 'monochrome' | 'neon' | 'earth' | 'nordic';

/** Theme */
type ThemeMode = 'light' | 'dark';

// ---- Node Data ----

/**
 * Data associata ad ogni nodo in React Flow.
 * UNICO tipo — il viewpoint decide come renderizzare.
 */
interface ModelNodeData {
    /** ID del DModelElement visualizzato (DClass, DObject, DEnumerator, DPackage) */
    modelElementId: string;

    /** Tipo dell'elemento nel modello (usato per fast-path decisions) */
    modelClassName: 'DClass' | 'DEnumerator' | 'DPackage' | 'DObject' | 'DDataType';

    /** ID della DViewElement che definisce il rendering */
    viewId: string | null;

    /** Flag: dimensioni esplicite (true) o da view default (false) */
    isResized: boolean;

    /** Dimensioni — sempre presenti, risolte dal sync layer */
    width: number;
    height: number;

    /** Ancore nominate — dal DVertex.anchors o dalla DViewElement di default */
    anchors: Record<string, { x: number; y: number }>;

    /** Stato CSS dinamico dal DVertex.state (rotation, opacity, transforms) */
    cssState: Record<string, string | number>;

    /** zIndex dal DVertex */
    zIndex: number;

    /** Campo zoom dal DVertex (fattore di scala) */
    zoom: { x: number; y: number };

    // ---- Dati del modello pre-risolti (per rendering veloce) ----

    /** Nome dell'elemento */
    label: string;

    /** Snapshot dei dati modello per il viewpoint renderer.
     *  Per DClass: { isAbstract, attributes, references, operations }
     *  Per DObject: { instanceOfClass, features }
     *  Per DEnumerator: { literals }
     *  Per DPackage: { children }
     */
    modelSnapshot: ModelSnapshot;

    /** Notazione attiva (per i built-in views) */
    notation: NotationMode;

    /** Color scheme attivo */
    colorScheme: ColorScheme;

    /** Theme */
    theme: ThemeMode;

    /** Flag per auto-edit dopo creazione da palette */
    autoEdit?: boolean;

    /** Flag: questo nodo e un DGraphVertex (contiene sotto-grafo) */
    isGraphVertex?: boolean;

    /** Se isGraphVertex, lo stato expand/collapse */
    isExpanded?: boolean;
}

// ---- Model Snapshots (per tipo) ----

type ModelSnapshot =
    | ClassSnapshot
    | EnumSnapshot
    | ObjectSnapshot
    | PackageSnapshot
    | DataTypeSnapshot;

interface ClassSnapshot {
    kind: 'class';
    isAbstract: boolean;
    isInterface: boolean;
    attributes: AttributeInfo[];
    references: ReferenceInfo[];
    operations: OperationInfo[];
    superclassNames: string[];
}

interface EnumSnapshot {
    kind: 'enum';
    literals: LiteralInfo[];
}

interface ObjectSnapshot {
    kind: 'object';
    instanceOfClassName: string;
    instanceOfClassId: string;
    features: FeatureValueInfo[];
}

interface PackageSnapshot {
    kind: 'package';
    childCount: number;
}

interface DataTypeSnapshot {
    kind: 'datatype';
    typeName: string;
}

// ---- Sub-structures ----

interface AttributeInfo {
    id: string;
    name: string;
    type: string;
    typeId: string;
    defaultValue: string;
    lowerBound: number;
    upperBound: number;
}

interface ReferenceInfo {
    id: string;
    name: string;
    targetClassName: string;
    targetClassId: string;
    kind: 'association' | 'composition' | 'aggregation';
    lowerBound: number;
    upperBound: number;
    containment: boolean;
    opposite: string | null;
}

interface OperationInfo {
    id: string;
    name: string;
    returnType: string;
    parameters: ParameterInfo[];
}

interface ParameterInfo {
    id: string;
    name: string;
    type: string;
}

interface LiteralInfo {
    id: string;
    name: string;
    value: number;
}

interface FeatureValueInfo {
    id: string;
    featureName: string;
    featureKind: 'attribute' | 'reference';
    featureTypeId: string;
    values: (string | number | boolean | null)[];
    /** Per reference: nomi degli oggetti puntati */
    resolvedNames?: string[];
}

// ---- Edge Data ----

/**
 * Data associata ad ogni edge in React Flow.
 * UNICO tipo — il rendering cambia in base a edgeKind.
 */
interface UnifiedEdgeData {
    /** Tipo semantico dell'arco */
    edgeKind: 'inheritance' | 'reference' | 'composition' | 'aggregation'
            | 'dependency' | 'instanceLink' | 'valueLink';

    /** ID del DEdge in JjOM */
    jjomEdgeId: string;

    /** ID del DModelElement associato (DReference, extends entry, DValue) */
    jjomModelId: string | null;

    /** Label dell'arco */
    label: string;

    /** Label aggiuntive (source role, target role, cardinality) */
    sourceLabel?: string;
    targetLabel?: string;
    sourceCardinality?: string;
    targetCardinality?: string;

    /** Waypoints per Manhattan routing (gia convertiti in coordinate assolute) */
    waypoints: Array<{ x: number; y: number }>;

    /** Ancore specifiche per questo arco */
    sourceAnchor: AnchorConfig;
    targetAnchor: AnchorConfig;

    /** Notazione + theme (per stili arco) */
    notation: NotationMode;
    colorScheme: ColorScheme;
    theme: ThemeMode;
}

// ---- Anchor Types ----

type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

interface AnchorConfig {
    mode: 'auto' | 'pinned' | 'named';
    /** Per mode 'auto' e 'pinned': side calcolata o fissata */
    side: AnchorSide;
    /** Per mode 'named': nome dell'ancora nel dizionario DVertex.anchors */
    anchorName?: string;
    /** Posizione percentuale lungo il lato (0-1) */
    position?: number;
}

// ---- Context Types ----

interface EditorV3ContextType {
    /** M2 o M1 */
    mode: EditorMode;
    /** ID del DModel in editing */
    modelId: string;
    /** ID del DGraph visualizzato */
    graphId: string;
    /** Se M1, ID del metamodello (instanceof) */
    metamodelId: string | null;
    /** Viewpoint attivo (null = built-in) */
    viewpointId: string | null;
    /** Notazione attiva */
    notation: NotationMode;
    /** Color scheme */
    colorScheme: ColorScheme;
    /** Theme */
    theme: ThemeMode;
    /** Snap to grid */
    snapToGrid: boolean;
    /** Grid size */
    gridSize: number;
    /** Callback per notifiche */
    onAnchorRecalcNeeded: () => void;
    onLayoutChanged: () => void;
}

// ---- Viewpoint Types ----

interface ViewContext {
    /** L'elemento del modello (LClass, LObject, etc.) */
    data: any;
    /** Il nodo grafico (LVertex) */
    node: any;
    /** La view corrente (LViewElement) */
    view: any;
    /** Stack di viste decorative */
    views: any[];
    /** Output del Tab Constants */
    constants: Record<string, any>;
    /** Output del Tab Observed Properties */
    usageDeclarations: Record<string, any>;
}

interface CompiledView {
    /** Funzione renderizzatrice */
    render: (context: ViewContext) => React.ReactNode;
    /** CSS scoped */
    css: string;
    /** Hash per invalidazione cache */
    hash: string;
    /** Errore di compilazione, se presente */
    error: string | null;
}

// ---- RF Node/Edge aliases ----

type V3Node = Node<ModelNodeData>;
type V3Edge = Edge<UnifiedEdgeData>;
```

### 3.2 Props dei Componenti Principali

```typescript
// ---- EditorV3Shell ----
interface EditorV3ShellProps {
    modelid: string;
    mode?: EditorMode;        // auto-detected if omitted
    viewpointId?: string;
    notation?: NotationMode;
    colorScheme?: ColorScheme;
    theme?: ThemeMode;
    readOnly?: boolean;
}

// ---- ModelNode ----
interface ModelNodeProps {
    id: string;
    data: ModelNodeData;
    selected: boolean;
    dragging: boolean;
}

// ---- ViewpointRenderer ----
interface ViewpointRendererProps {
    modelElementId: string;
    viewId: string | null;
    modelSnapshot: ModelSnapshot;
    notation: NotationMode;
    colorScheme: ColorScheme;
    theme: ThemeMode;
    width: number;
    height: number;
    onSizeChange?: (w: number, h: number) => void;
}

// ---- DynamicAnchors ----
interface DynamicAnchorsProps {
    nodeId: string;
    anchors: Record<string, { x: number; y: number }>;
}

// ---- AdaptivePalette ----
interface AdaptivePaletteProps {
    mode: EditorMode;
    metamodelId: string | null;
    onDragStart: (elementType: string, data: any) => void;
}

// ---- PropertiesPanel ----
interface PropertiesPanelProps {
    selectedNodeId: string | null;
    selectedEdgeId: string | null;
    mode: EditorMode;
}
```

---

## 4. Sistema di Nodi

### 4.1 Architettura: Un Solo Node Type

V3 registra un **unico** node type in React Flow:

```typescript
const nodeTypes: NodeTypes = {
    modelNode: ModelNode,
};
```

Ogni DVertex nel DGraph viene mappato a un `Node<ModelNodeData>` con `type: 'modelNode'`. Il rendering effettivo e determinato dal campo `viewId` nella data e delegato al `ViewpointRenderer`.

**Vantaggi rispetto a V2 (3 node types):**
- Nessuna duplicazione di logica drag/resize/selection
- Aggiungere nuovi tipi di elemento = aggiungere una view, non un componente
- Il viewpoint custom puo ridefinire completamente l'aspetto

### 4.2 ModelNode — Componente Wrapper

```
ModelNode (React Flow node component)
├── Gestisce: resize handles, drag behavior, selection style
├── Delega rendering a: ModelNodeContent
└── Contiene: DynamicAnchors

ModelNodeContent
├── Legge: data.viewId, data.modelSnapshot, data.notation
├── Se viewId punta a built-in view → Componente React diretto
├── Se viewId punta a custom view → ViewpointRenderer (JSX compilato)
└── Se viewId null → Fallback per notazione + tipo

DynamicAnchors
├── Legge: data.anchors (Record<string, {x, y}>)
├── Genera Handle per ogni ancora nominata
├── + Pool di handle extra per nuove connessioni (ghost handles)
└── Posiziona Handle con offset percentuale
```

**ModelNode.tsx — Struttura:**

```typescript
// Path: editor-v3/nodes/ModelNode.tsx
// Responsabilita: wrapper RF node con resize, drag, selection
// Props: NodeProps<ModelNodeData>
// State interno: isEditing (inline edit mode), resizeState
// Hooks: useNodeResize, useEditorV3Context
// Interazione JjOM: NESSUNA diretta — tutto via sync layer
// Interazione componenti: contiene ModelNodeContent + DynamicAnchors

const ModelNode = memo(({ id, data, selected, dragging }: NodeProps<ModelNodeData>) => {
    const { mode, theme, colorScheme } = useEditorV3Context();

    // Resize handles (corner + edge)
    const { resizeHandles, onResizeStart, onResizeEnd } = useNodeResize(id, data);

    // CSS state from DVertex.state
    const dynamicStyle = useMemo(() => ({
        width: data.width,
        height: data.height,
        zIndex: data.zIndex,
        ...cssStateToStyle(data.cssState),
    }), [data.width, data.height, data.zIndex, data.cssState]);

    return (
        <div className={cn('model-node', { selected, dragging })} style={dynamicStyle}>
            {/* Rendering delegato al viewpoint */}
            <ModelNodeContent
                modelElementId={data.modelElementId}
                viewId={data.viewId}
                modelSnapshot={data.modelSnapshot}
                notation={data.notation}
                colorScheme={data.colorScheme}
                theme={data.theme}
                width={data.width}
                height={data.height}
            />

            {/* Ancore/Handle per connessioni */}
            <DynamicAnchors nodeId={id} anchors={data.anchors} />

            {/* Resize handles */}
            {selected && resizeHandles}
        </div>
    );
});
```

### 4.3 ModelNodeContent — Dispatcher di Rendering

```typescript
// Path: editor-v3/nodes/ModelNodeContent.tsx
// Responsabilita: decide COME renderizzare in base a viewId e notation
// Props: ViewpointRendererProps
// State: nessuno (puro rendering)
// Hooks: nessuno
// Interazione: legge dal ViewRegistry per built-in, ViewpointRenderer per custom

const ModelNodeContent = memo((props: ViewpointRendererProps) => {
    const { viewId, modelSnapshot, notation } = props;

    // 1. Se c'e un viewId che punta a una custom view → ViewpointRenderer
    if (viewId && isCustomView(viewId)) {
        return (
            <ViewpointErrorBoundary viewId={viewId}>
                <ViewpointRenderer {...props} />
            </ViewpointErrorBoundary>
        );
    }

    // 2. Altrimenti, usa la notazione built-in
    const BuiltInView = getBuiltInView(notation, modelSnapshot.kind);
    if (BuiltInView) {
        return <BuiltInView {...props} />;
    }

    // 3. Fallback generico
    return <GenericFallbackView {...props} />;
});
```

**Logica di risoluzione view:**

```
viewId presente E custom?
  ├─ SI → ViewpointRenderer (compilazione JSX)
  └─ NO → getBuiltInView(notation, elementKind)
              ├─ 'uml' + 'class' → UMLClassView
              ├─ 'uml' + 'enum' → UMLEnumView
              ├─ 'uml' + 'object' → UMLObjectView
              ├─ 'simplified' + 'class' → SimplifiedClassView
              ├─ 'compact' + 'class' → CompactClassView
              ├─ ... (matrice notazione × tipo)
              └─ null → GenericFallbackView
```

### 4.4 DynamicAnchors — Handle da Ancore JjOM

In V2, i DynamicHandles usano un pool pre-allocato (4 lati × N handle per lato) con naming `${side}-${index}`. In V3, le ancore possono essere **arbitrarie** (definite dalla DViewElement o dal DVertex.anchors):

```typescript
// Path: editor-v3/nodes/DynamicAnchors.tsx
// Responsabilita: generare Handle RF dalle ancore JjOM
// Props: DynamicAnchorsProps
// Hooks: useEdges (per sapere quali sono attive)

const DynamicAnchors = memo(({ nodeId, anchors }: DynamicAnchorsProps) => {
    const edges = useEdges();

    // Classifica ancore:
    // - Ancore con nomi standard (north, south, east, west, center) → mappate a sides
    // - Ancore con nomi custom (da viewpoint) → posizione % arbitraria

    // Genera Handle per ogni ancora nominata
    const namedHandles = useMemo(() =>
        Object.entries(anchors).map(([name, pos]) => ({
            id: `anchor-${name}`,
            position: percentToPosition(pos),  // {x: 0.5, y: 0} → Position.Top
            style: percentToStyle(pos),         // offset CSS dal lato
        }))
    , [anchors]);

    // + Pool di handle extra per compatibilita V2 (side-based)
    // Necessario per auto-anchor che assegna side-index
    const poolHandles = useMemo(() =>
        generatePoolHandles(nodeId, edges, MAX_HANDLES_PER_SIDE)
    , [nodeId, edges]);

    return (
        <>
            {namedHandles.map(h => (
                <Handle
                    key={h.id}
                    id={h.id}
                    type="source"  // tutti bidirezionali
                    position={h.position}
                    style={h.style}
                    isConnectable={true}
                />
            ))}
            {poolHandles}
        </>
    );
});
```

**Mapping ancore percentuali → Handle React Flow:**

| Ancora JjOM | Posizione % | Handle RF Position | Offset CSS |
|-------------|-------------|-------------------|------------|
| `{x: 0.5, y: 0}` | Centro-top | `Position.Top` | `left: 50%` |
| `{x: 0.5, y: 1}` | Centro-bottom | `Position.Bottom` | `left: 50%` |
| `{x: 0, y: 0.5}` | Centro-left | `Position.Left` | `top: 50%` |
| `{x: 1, y: 0.5}` | Centro-right | `Position.Right` | `top: 50%` |
| `{x: 0.3, y: 0}` | 30% da sinistra, top | `Position.Top` | `left: 30%` |
| `{x: 0.7, y: 0.7}` | Custom interno | Nessun lato → `position: absolute` | `left: 70%; top: 70%` |

Per ancore che non cadono su un bordo (x e y entrambi != 0 e != 1), si usa un Handle con posizione assoluta all'interno del nodo. Questo richiede un wrapper `div` posizionato in absolute.

### 4.5 Rendering M2 vs M1

| Aspetto | M2 (Metamodello) | M1 (Modello) |
|---------|-------------------|--------------|
| ModelSnapshot | `ClassSnapshot`, `EnumSnapshot` | `ObjectSnapshot` |
| Default notation | UML/Simplified/Compact/etc. | GenericObjectView |
| Custom viewpoint | Possibile ma raro | Caso d'uso principale |
| Ancore | Standard (N,S,E,W) | Definite dalla view |
| Inline editing | Nome classe, attributi, operazioni | Valori DValue via Field/Input |
| Resize | Libero | Controllato da view (`resizable`, `adaptWidth`) |

### 4.6 DGraphVertex — Grafi Annidati

Un `DGraphVertex` e un nodo che contiene un sotto-grafo (usato per package). Ha proprieta di DVertex (posizione/dimensione esterna) + proprieta di DGraph (zoom/offset interni).

**Strategia: Expand/Collapse con Sub-Flow**

```
┌────────────────────────────────┐
│ Package: myMetamodel    [▼]    │  ← Collapsed: mostra solo nome + icona
└────────────────────────────────┘

         ↕ click [▼]/[▲]

┌────────────────────────────────┐
│ Package: myMetamodel    [▲]    │  ← Expanded: mostra contenuto
│ ┌──────────┐  ┌──────────┐    │
│ │ Person   │  │ Address  │    │
│ └──────────┘  └──────────┘    │
│       ↑──inheritance──↑       │
└────────────────────────────────┘
```

**Implementazione:**
- **Collapsed:** Il `ModelNode` renderizza un box compatto con `PackageSnapshot`
- **Expanded:** I figli (`subElements`) vengono aggiunti come nodi RF con `parentId` (React Flow nesting nativo). Il DGraphVertex ha `style.width/height` che si adatta ai figli
- **Breadcrumb:** Per navigare in profondita (package dentro package), il `BreadcrumbNav` mostra il percorso e permette drill-down/up
- Il zoom/offset interni del DGraphVertex controllano la vista del sotto-grafo

```typescript
// Nel sync layer, quando un DGraphVertex e espanso:
if (data.isGraphVertex && data.isExpanded) {
    // Aggiungi i figli come nodi RF con parentId
    for (const childVertex of graphVertex.subElements) {
        nodes.push({
            id: childVertex.id,
            parentId: graphVertex.id,  // RF nesting
            type: 'modelNode',
            position: { x: childVertex.x, y: childVertex.y },
            data: transformToModelNodeData(childVertex),
        });
    }
}
```

---

## 5. Sync Layer

### 5.1 Evoluzione da V2

Il sync layer di V3 e un'**evoluzione** del sistema V2, non un rewrite. Le fondamenta sono solide:

| Feature V2 | Status V3 | Modifiche |
|------------|-----------|-----------|
| Anti-bounce (300ms window) | **Mantenuto** | Identico |
| Per-element reference equality | **Mantenuto** | Esteso a DObject/DValue |
| Hash FNV-1a dei figli | **Mantenuto** | + hash features per DObject |
| Surgical setNodes/setEdges | **Mantenuto** | Identico |
| Drop-created tracking | **Mantenuto** | + tipi M1 |
| Edge-ref registry | **Mantenuto** | + instanceLink/valueLink |
| rfNodeCache/rfEdgeCache | **Mantenuto** | Cache usa ModelNodeData |

**Aggiunte V3:**
- Trasformazione DObject → ModelNodeData (con ObjectSnapshot)
- Trasformazione DValue link → UnifiedEdgeData (instanceLink/valueLink)
- Risoluzione DViewElement per ogni nodo
- Conversione ancore JjOM → anchors in ModelNodeData
- Conversione CSS state → cssState in ModelNodeData
- Coordinate transforms per DEdgePoint con CoordinateMode
- Supporto DGraphVertex expand/collapse

### 5.2 Architettura Sync

```
┌──────────────────────────────────────────────────────────┐
│                   syncCoordinator.ts                      │
│                                                          │
│  canvasUpdatedIds:  Map<id, timestamp>    ← anti-bounce  │
│  dropCreatedIds:    Set<id>               ← palette      │
│  edgeModelIds:      Map<edgeId, modelId>  ← edge→ref     │
│  syncModes:         Map<nodeId, mode>     ← drag mode    │
│                                                          │
│  Functions:                                              │
│  markCanvasUpdated(id) / isCanvasUpdated(id)             │
│  markDropCreated(id) / consumeDropCreated(id)            │
│  setEdgeModelId(edgeId, modelId) / getEdgeModelId(edgeId)│
│  purgeExpired()                                          │
└──────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  useJjomSyncV3.ts   │      │  canvasToJjomV3.ts      │
│  (JjOM → Canvas)    │      │  (Canvas → JjOM)        │
│                     │      │                         │
│  Input: Redux state │      │  Input: RF callbacks    │
│  Output: setNodes() │      │  Output: TRANSACTION    │
│          setEdges() │      │          SetFieldAction  │
│                     │      │          DObject.new     │
│  Cache:             │      │          DModel.new      │
│  rfNodeCache        │      │                         │
│  rfEdgeCache        │      │  Tipi operazioni:       │
│  prevElementsRef    │      │  syncPosition           │
│                     │      │  syncSize               │
│  Transforms via:    │      │  syncCreate (M2 + M1)   │
│  jjomTransformers   │      │  syncDelete             │
│  coordinateTransf.  │      │  syncProperty           │
└─────────────────────┘      │  syncEdge               │
                             │  syncFeatureValue (M1)  │
                             └─────────────────────────┘
```

### 5.3 useJjomSyncV3 — JjOM → Canvas

```typescript
// Path: editor-v3/sync/useJjomSyncV3.ts
// Responsabilita: trasforma stato Redux in nodi/archi React Flow
// Hooks utilizzati: useSelector (Redux), useReactFlow (setNodes/setEdges)
// Interazione JjOM: legge via selectors (elementSnapshots)
// Interazione componenti: chiama setNodes/setEdges di React Flow

function useJjomSyncV3(
    graphId: string | null,
    mode: EditorMode,
    notation: NotationMode,
    colorScheme: ColorScheme,
    theme: ThemeMode,
    viewpointId: string | null,
    setNodes: SetNodes,
    setEdges: SetEdges,
) {
    // ---- Caches (persistono tra render) ----
    const rfNodeCache = useRef(new Map<string, V3Node>());
    const rfEdgeCache = useRef(new Map<string, V3Edge>());
    const prevElementsRef = useRef(new Map<string, any>());
    const prevModelRef = useRef<any>(null);
    const prevHashesRef = useRef(new Map<string, number>());

    // ---- Redux Selector ----
    // Ritorna Map<id, DGraphElement reference> per il grafo corrente
    const elementSnapshots = useSelector(
        (state) => selectGraphElements(state, graphId),
        mapReferenceEqual   // confronta chiavi e reference values
    );

    // ---- View Resolution ----
    // Per ogni vertex, risolve quale DViewElement usare
    const viewResolution = useRef(new Map<string, string | null>());

    useEffect(() => {
        if (!graphId || !elementSnapshots) return;

        // 1. Detect structural changes (added/removed)
        const currentIds = new Set(elementSnapshots.keys());
        const prevIds = new Set(prevElementsRef.current.keys());

        const added = new Set([...currentIds].filter(id => !prevIds.has(id)));
        const removed = new Set([...prevIds].filter(id => !currentIds.has(id)));
        const retained = new Set([...currentIds].filter(id => prevIds.has(id)));

        // 2. Filter anti-bounce
        const toTransform = new Set<string>();
        for (const id of retained) {
            if (isCanvasUpdated(id)) continue;

            const prev = prevElementsRef.current.get(id);
            const curr = elementSnapshots.get(id);
            if (prev !== curr) {
                toTransform.add(id);
            }
        }

        // 3. Transform added + changed
        const addedNodes: V3Node[] = [];
        const addedEdges: V3Edge[] = [];

        for (const id of [...added, ...toTransform]) {
            const element = elementSnapshots.get(id);
            if (!element) continue;

            if (isVertex(element)) {
                // Risolvi view
                const viewId = resolveView(element, mode, viewpointId, notation);
                viewResolution.current.set(id, viewId);

                const rfNode = jjomVertexToModelNode(
                    element, viewId, mode, notation, colorScheme, theme
                );
                if (rfNode) {
                    rfNodeCache.current.set(id, rfNode);
                    if (added.has(id) && !consumeDropCreated(id)) {
                        addedNodes.push(rfNode);
                    }
                }
            } else if (isEdge(element)) {
                const rfEdge = jjomEdgeToUnifiedEdge(
                    element, notation, colorScheme, theme
                );
                if (rfEdge) {
                    rfEdgeCache.current.set(id, rfEdge);
                    if (added.has(id)) {
                        addedEdges.push(rfEdge);
                    }
                }
            }
        }

        // 4. Surgical update
        setNodes(prev => {
            let result = prev.filter(n => !removed.has(n.id));
            result = result.map(n => {
                const cached = rfNodeCache.current.get(n.id);
                if (cached && toTransform.has(n.id)) {
                    return { ...n, data: cached.data };  // patch data only
                }
                return n;
            });
            return [...result, ...addedNodes];
        });

        setEdges(prev => {
            let result = prev.filter(e => !removed.has(e.id));
            result = result.map(e => {
                const cached = rfEdgeCache.current.get(e.id);
                if (cached && toTransform.has(e.id)) {
                    return { ...e, data: cached.data };
                }
                return e;
            });
            return [...result, ...addedEdges];
        });

        // 5. Update prev refs
        prevElementsRef.current = new Map(elementSnapshots);
        purgeExpired();

    }, [elementSnapshots, notation, colorScheme, theme, viewpointId]);
}
```

### 5.4 canvasToJjomV3 — Canvas → JjOM

Evoluzione di V2 con aggiunta delle operazioni M1:

```typescript
// Path: editor-v3/sync/canvasToJjomV3.ts
// Responsabilita: scrive modifiche dal canvas a Redux/JjOM
// Interazione JjOM: scrive via SetFieldAction, TRANSACTION, L* proxy

// ---- Operazioni M2 (ereditate da V2) ----

export function syncPositionToJjom(vertexId: string, x: number, y: number): void;
export function syncPositionBatchToJjom(changes: Array<{id: string; x: number; y: number}>): void;
export function syncSizeToJjom(vertexId: string, w: number, h: number): void;
export function syncCreateClass(graphId: string, x: number, y: number): string;
export function syncCreateEnum(graphId: string, x: number, y: number): string;
export function syncCreatePackage(graphId: string, x: number, y: number): string;
export function syncDeleteVertex(vertexId: string): void;
export function syncDeleteEdge(edgeId: string): void;
export function syncInheritanceEdge(sourceId: string, targetId: string): string;
export function syncReferenceEdge(sourceId: string, targetId: string): string;
// ... (tutte le operazioni V2 per attributi, operazioni, enum literals, etc.)

// ---- Operazioni M1 (NUOVE in V3) ----

/**
 * Crea un DObject istanza di una DClass e il DVertex associato.
 * Chiamata dalla palette quando l'utente dropppa una classe M2 in un modello M1.
 */
export function syncCreateObject(
    graphId: string,
    classId: string,
    x: number,
    y: number,
    name?: string
): string {
    markCanvasUpdated(/* new vertex id — computed after creation */);

    const lGraph = LPointerTargetable.fromD(graphId) as LGraph;
    const modelId = lGraph.model;

    TRANSACTION('Create M1 instance', () => {
        // 1. Crea DObject con instanceof = classId
        const dObject = DObject.new(classId, modelId, DModel, name || autoName(classId), true);

        // 2. Crea DVertex per il grafo
        const dVertex = DVertex.new(graphId, dObject.id, x, y);

        // 3. Registra per anti-bounce
        markCanvasUpdated(dVertex.id);
        markDropCreated(dVertex.id);

        return dVertex.id;
    });
}

/**
 * Aggiorna un valore di attributo su un DObject.
 * Usata dai componenti built-in Field/Input nel viewpoint.
 */
export function syncFeatureValue(
    objectId: string,
    featureName: string,
    value: any
): void {
    markCanvasUpdated(objectId);

    // Usa il deferred pattern: trova via proxy L*
    const lModel = findParentModel(objectId);
    if (!lModel) return;

    const lObj = lModel.objects.find((o: any) => o.id === objectId);
    if (!lObj) return;

    (lObj as any)['$' + featureName].value = value;
}

/**
 * Crea un link tra due DObject (imposta un DValue di tipo reference).
 */
export function syncInstanceLink(
    sourceObjectId: string,
    targetObjectId: string,
    referenceId: string
): void {
    markCanvasUpdated(sourceObjectId);

    TRANSACTION('Create instance link', () => {
        const lSource = LPointerTargetable.fromD(sourceObjectId) as any;
        const refFeature = lSource.features.find(
            (f: any) => f.instanceof?.id === referenceId
        );
        if (refFeature) {
            // Aggiungi targetObjectId ai values del DValue
            const currentValues = [...(refFeature.values || [])];
            currentValues.push(targetObjectId);
            SetFieldAction.new(refFeature.id, 'values', currentValues, '', true);
        }
    });
}
```

### 5.5 jjomTransformers — DVertex/DEdge → React Flow

```typescript
// Path: editor-v3/sync/jjomTransformers.ts
// Responsabilita: trasforma strutture JjOM in ModelNodeData / UnifiedEdgeData

/**
 * Trasforma un DVertex in un Node<ModelNodeData>.
 * Funzione centrale del sync: mappa TUTTE le proprieta.
 */
export function jjomVertexToModelNode(
    vertex: any,          // LVertex proxy
    viewId: string | null,
    mode: EditorMode,
    notation: NotationMode,
    colorScheme: ColorScheme,
    theme: ThemeMode,
): V3Node | null {

    const model = vertex.model;  // LModelElement (LClass, LObject, LEnum, etc.)
    if (!model) return null;

    const className = model.className;  // 'DClass', 'DObject', etc.

    // 1. Risolvi dimensioni (isResized → esplicite, altrimenti view default)
    const { width, height } = resolveDimensions(vertex, viewId);

    // 2. Risolvi ancore (da vertex.anchors o dalla view, o default N/S/E/W)
    const anchors = resolveAnchors(vertex, viewId);

    // 3. Costruisci model snapshot
    const modelSnapshot = buildModelSnapshot(model, className, mode);

    // 4. Costruisci Node
    return {
        id: vertex.id,
        type: 'modelNode',
        position: { x: vertex.x, y: vertex.y },
        style: {
            width,
            height,
            zIndex: vertex.zIndex ?? 100,
        },
        data: {
            modelElementId: model.id,
            modelClassName: className,
            viewId,
            isResized: vertex.isResized ?? false,
            width,
            height,
            anchors,
            cssState: parseCssState(vertex.state),
            zIndex: vertex.zIndex ?? 100,
            zoom: vertex.zoom ?? { x: 1, y: 1 },
            label: model.name || '',
            modelSnapshot,
            notation,
            colorScheme,
            theme,
            isGraphVertex: className === 'DGraphVertex',
            isExpanded: false,  // default collapsed
        } satisfies ModelNodeData,
    };
}

/**
 * Costruisce il ModelSnapshot appropriato in base al tipo.
 */
function buildModelSnapshot(model: any, className: string, mode: EditorMode): ModelSnapshot {
    switch (className) {
        case 'DClass':
            return {
                kind: 'class',
                isAbstract: model.abstract ?? false,
                isInterface: model.interface ?? false,
                attributes: (model.attributes || []).map(mapAttribute),
                references: (model.references || []).map(mapReference),
                operations: (model.operations || []).map(mapOperation),
                superclassNames: (model.extends || []).map((s: any) => s.name),
            } satisfies ClassSnapshot;

        case 'DObject':
            return {
                kind: 'object',
                instanceOfClassName: model.instanceof?.name || 'Unknown',
                instanceOfClassId: model.instanceof?.id || '',
                features: (model.features || []).map(mapFeatureValue),
            } satisfies ObjectSnapshot;

        case 'DEnumerator':
            return {
                kind: 'enum',
                literals: (model.literals || []).map(mapLiteral),
            } satisfies EnumSnapshot;

        case 'DPackage':
            return {
                kind: 'package',
                childCount: (model.children || []).length,
            } satisfies PackageSnapshot;

        default:
            return { kind: 'datatype', typeName: model.name || 'Unknown' };
    }
}

/**
 * Trasforma un DEdge in un Edge<UnifiedEdgeData>.
 */
export function jjomEdgeToUnifiedEdge(
    edge: any,           // LEdge proxy
    notation: NotationMode,
    colorScheme: ColorScheme,
    theme: ThemeMode,
): V3Edge | null {
    const source = edge.start;  // Pointer a DVertex
    const target = edge.end;    // Pointer a DVertex

    if (!source || !target) return null;

    // Determina il tipo semantico
    const edgeKind = resolveEdgeKind(edge);

    // Converti midPoints con CoordinateMode → waypoints assoluti
    const waypoints = convertMidPointsToAbsolute(edge, source, target);

    // Risolvi ancore specifiche dell'arco
    const sourceAnchor = resolveEdgeAnchor(edge.anchorStart, 'source');
    const targetAnchor = resolveEdgeAnchor(edge.anchorEnd, 'target');

    // Determina handle IDs
    const { sourceHandle, targetHandle } = computeHandleIds(sourceAnchor, targetAnchor);

    // Label e cardinalita
    const { label, sourceLabel, targetLabel, sourceCardinality, targetCardinality } =
        resolveEdgeLabels(edge, edgeKind);

    return {
        id: edge.id,
        type: edgeKind === 'inheritance' ? 'inheritance' : 'reference',
        source: typeof source === 'string' ? source : source.id,
        target: typeof target === 'string' ? target : target.id,
        sourceHandle,
        targetHandle,
        data: {
            edgeKind,
            jjomEdgeId: edge.id,
            jjomModelId: edge.model?.id || null,
            label,
            sourceLabel,
            targetLabel,
            sourceCardinality,
            targetCardinality,
            waypoints,
            sourceAnchor,
            targetAnchor,
            notation,
            colorScheme,
            theme,
        } satisfies UnifiedEdgeData,
    };
}

/**
 * Determina il tipo semantico di un DEdge.
 */
function resolveEdgeKind(edge: any): UnifiedEdgeData['edgeKind'] {
    if (edge.isExtend) return 'inheritance';
    if (edge.isDependency) return 'dependency';
    if (edge.isReference) {
        const ref = edge.model;
        if (ref?.composition) return 'composition';
        if (ref?.aggregation) return 'aggregation';
        return 'reference';
    }
    if (edge.isValue) return 'valueLink';
    // M1 link tra istanze
    return 'instanceLink';
}
```

### 5.6 coordinateTransforms — Conversione CoordinateMode

```typescript
// Path: editor-v3/sync/coordinateTransforms.ts
// Responsabilita: converti tra sistemi di coordinate JjOM e React Flow

/**
 * Converte DEdgePoint con CoordinateMode in coordinate assolute.
 *
 * I 5 sistemi di coordinate per bend point:
 * - "absolute": coordinate pixel dirette → usale cosi come sono
 * - "relative%": % lungo il segmento start→end (0 = start, 1 = end)
 * - "relativeOffset": offset da start E end
 * - "relativeOffsetStart": offset solo da start
 * - "relativeOffsetEnd": offset solo da end
 */
export function convertMidPointsToAbsolute(
    edge: any,
    sourceVertex: any,
    targetVertex: any,
): Array<{ x: number; y: number }> {
    const midPoints = edge.midnodes || [];
    if (midPoints.length === 0) return [];

    const sx = sourceVertex.x + (sourceVertex.w ?? 0) / 2;
    const sy = sourceVertex.y + (sourceVertex.h ?? 0) / 2;
    const ex = targetVertex.x + (targetVertex.w ?? 0) / 2;
    const ey = targetVertex.y + (targetVertex.h ?? 0) / 2;

    return midPoints.map((mp: any) => {
        const mode = mp.currentCoordType || 'absolute';
        const px = mp.x;
        const py = mp.y;

        switch (mode) {
            case 'absolute':
                return { x: px, y: py };

            case 'relative%':
                // % lungo il path: 0 = source center, 1 = target center
                return {
                    x: sx + (ex - sx) * px,
                    y: sy + (ey - sy) * py,
                };

            case 'relativeOffset':
                // Offset da start + offset da end (media)
                return {
                    x: (sx + px + ex + py) / 2,  // px = offset from start, py = offset from end
                    y: (sy + px + ey + py) / 2,
                };

            case 'relativeOffsetStart':
                return { x: sx + px, y: sy + py };

            case 'relativeOffsetEnd':
                return { x: ex + px, y: ey + py };

            default:
                return { x: px, y: py };
        }
    });
}

/**
 * Converte coordinate assolute RF → CoordinateMode JjOM per persistenza.
 * Usato quando l'utente trascina un waypoint nel canvas.
 */
export function absoluteToCoordinateMode(
    absPoint: { x: number; y: number },
    sourceCenter: { x: number; y: number },
    targetCenter: { x: number; y: number },
    targetMode: string,
): { x: number; y: number } {
    switch (targetMode) {
        case 'absolute':
            return absPoint;

        case 'relative%': {
            const dx = targetCenter.x - sourceCenter.x;
            const dy = targetCenter.y - sourceCenter.y;
            return {
                x: dx !== 0 ? (absPoint.x - sourceCenter.x) / dx : 0.5,
                y: dy !== 0 ? (absPoint.y - sourceCenter.y) / dy : 0.5,
            };
        }

        case 'relativeOffsetStart':
            return {
                x: absPoint.x - sourceCenter.x,
                y: absPoint.y - sourceCenter.y,
            };

        case 'relativeOffsetEnd':
            return {
                x: absPoint.x - targetCenter.x,
                y: absPoint.y - targetCenter.y,
            };

        default:
            return absPoint;
    }
}
```

### 5.7 Anti-Bounce e Ciclo di Sync Completo

```
Tempo →  0ms    50ms    100ms   200ms   300ms   350ms
         │       │       │       │       │       │
Canvas:  │ DRAG  │       │ DROP  │       │       │
         │  │    │       │  │    │       │       │
         │  ▼    │       │  ▼    │       │       │
         │ mark  │       │ mark  │       │       │
         │ (id,  │       │ (id,  │       │       │
         │ t=0)  │       │ t=100)│       │       │
         │  │    │       │  │    │       │       │
         │  ▼    │       │  ▼    │       │       │
JjOM:    │ SET   │       │ SET   │       │       │
         │ x,y   │       │ x,y   │       │       │
         │       │       │       │       │       │
Redux:   │       │ fire  │       │ fire  │       │ fire
Selector │       │  │    │       │  │    │       │  │
         │       │  ▼    │       │  ▼    │       │  ▼
Sync:    │       │ SKIP  │       │ SKIP  │       │ OK (expired)
         │       │(t<300)│       │(t<300)│       │ re-transform
```

---

## 6. Sistema di Edge

### 6.1 UnifiedEdge — Evoluzione da V2

V2 usa gia un `UnifiedEdge` che gestisce tutti i tipi. V3 lo estende con:

| Feature | V2 | V3 |
|---------|----|----|
| Tipi | inheritance, reference | + composition, aggregation, dependency, instanceLink, valueLink |
| Marcatori | Triangolo (inheritance), freccia (reference), diamante | + diamante pieno (composition), freccia aperta (dependency) |
| Label | Nome reference | + cardinalita, ruoli source/target |
| Waypoints | Waypoint editing con SegmentHandles | + CoordinateMode conversion |
| Stile | Per notation | + per theme + per colorScheme |

### 6.2 Tipi di Arco e Marcatori

```
inheritance:    ───────▷  (triangolo vuoto al target)
reference:      ────────>  (freccia al target)
composition:    ◆────────>  (diamante pieno al source, freccia al target)
aggregation:    ◇────────>  (diamante vuoto al source, freccia al target)
dependency:     - - - - ->  (linea tratteggiata, freccia aperta al target)
instanceLink:   ─ ─ ─ ─ ─>  (linea tratteggiata M1)
valueLink:      ──────────  (linea continua M1, senza freccia)
```

### 6.3 Edge Routing

Il Manhattan routing di V2 e mantenuto e migliorato:

```typescript
// Path: editor-v3/edges/edgeRouting.ts

/**
 * Calcola il path Manhattan side-aware.
 * Identico a V2 ma con supporto per waypoints da CoordinateMode.
 */
export function computeManhattanPath(
    sourcePos: { x: number; y: number },
    targetPos: { x: number; y: number },
    sourceSide: Side,
    targetSide: Side,
    waypoints: Array<{ x: number; y: number }>,
    options: {
        cornerRadius: number;
        stubLength: number;
        obstacleNodes?: NodeRect[];
    }
): string {
    // Se ci sono waypoints, concatena segmenti:
    // source → wp1 → wp2 → ... → target
    // Ogni segmento usa il routing side-aware

    if (waypoints.length > 0) {
        return computeWaypointPath(sourcePos, targetPos, sourceSide, targetSide, waypoints, options);
    }

    // Altrimenti, routing diretto (identico a V2)
    return computeDirectPath(sourcePos, targetPos, sourceSide, targetSide, options);
}
```

### 6.4 Edge Labels e Cardinalita

```
         sourceCardinality          targetCardinality
              0..*                       1
               │                         │
    ┌──────┐   │   sourceLabel      targetLabel    ┌──────┐
    │Source │───┼───employees────label────manager───┼───│Target │
    └──────┘       (ruolo src)   (nome)  (ruolo tgt)   └──────┘
```

Le label sono posizionate usando il calcolo del punto medio del path Manhattan, con offset per evitare sovrapposizioni.

### 6.5 Connection Validation

```typescript
// Path: editor-v3/hooks/useConnectionValidation.ts

/**
 * Valida una connessione prima di crearla.
 * Ritorna null se valida, stringa di errore se invalida.
 */
export function validateConnection(
    source: ModelNodeData,
    target: ModelNodeData,
    edgeKind: string,
    existingEdges: V3Edge[],
): string | null {
    // 1. No self-loops per inheritance
    if (edgeKind === 'inheritance' && source.modelElementId === target.modelElementId) {
        return 'A class cannot inherit from itself';
    }

    // 2. No circular inheritance
    if (edgeKind === 'inheritance') {
        if (wouldCreateCycle(source.modelElementId, target.modelElementId, existingEdges)) {
            return 'Circular inheritance detected';
        }
    }

    // 3. Tipi compatibili
    if (edgeKind === 'inheritance') {
        // Solo class → class
        if (source.modelClassName !== 'DClass' || target.modelClassName !== 'DClass') {
            return 'Inheritance requires both ends to be classes';
        }
    }

    // 4. Per M1: il reference type deve essere compatibile
    if (edgeKind === 'instanceLink') {
        // target.instanceOfClass deve essere compatibile con il reference type
    }

    return null;
}
```

---

## 7. Viewpoint Rendering Pipeline

### 7.1 Architettura a Due Percorsi

```
ModelNodeContent
       │
       ├── viewId punta a built-in view?
       │     │
       │     ├─ SI → BuiltInViewRenderer
       │     │         │
       │     │         ├─ UMLClassView
       │     │         ├─ SimplifiedView
       │     │         ├─ CompactView
       │     │         ├─ ...
       │     │         └─ GenericObjectView
       │     │
       │     └─ NO → CustomViewRenderer (JSX pipeline)
       │               │
       │               ├─ 1. ViewpointCache.get(viewId)
       │               │     ├─ HIT → CompiledView
       │               │     └─ MISS → ViewpointCompiler.compile()
       │               │
       │               ├─ 2. ViewpointContext.build(data, node, view)
       │               │
       │               ├─ 3. ScopedCSS.inject(compiledView.css)
       │               │
       │               ├─ 4. compiledView.render(context)
       │               │     → React.ReactNode
       │               │
       │               └─ 5. ErrorBoundary wraps output
       │
       └── viewId null → Fallback (notation-based built-in)
```

### 7.2 Built-In View Registry

```typescript
// Path: editor-v3/viewpoint/registry/ViewRegistry.ts

/**
 * Registry di view built-in per le notazioni standard.
 * Matrice: notation × element kind → React component.
 */
const VIEW_REGISTRY: Record<NotationMode, Record<string, React.ComponentType<BuiltInViewProps>>> = {
    uml: {
        class: UMLClassView,
        enum: UMLEnumView,
        package: UMLPackageView,
        object: UMLObjectView,
        datatype: UMLDataTypeView,
    },
    simplified: {
        class: SimplifiedClassView,
        enum: SimplifiedEnumView,
        package: SimplifiedPackageView,
        object: SimplifiedObjectView,
        // datatype non ha view semplificata → fallback a UML
    },
    compact: {
        class: CompactClassView,
        // altri tipi → fallback
    },
    wireframe: {
        class: WireframeClassView,
        // ...
    },
    er: {
        class: EREntityView,
        // ...
    },
    viewpoint: {}, // nessun built-in — tutto via custom JSX
};

export function getBuiltInView(
    notation: NotationMode,
    elementKind: string,
): React.ComponentType<BuiltInViewProps> | null {
    return VIEW_REGISTRY[notation]?.[elementKind]
        ?? VIEW_REGISTRY['uml']?.[elementKind]  // fallback a UML
        ?? null;
}
```

### 7.3 ViewpointCompiler — Compilazione JSX → Function

```typescript
// Path: editor-v3/viewpoint/ViewpointCompiler.ts

/**
 * Compila il JSX di un DViewElement in una funzione eseguibile.
 *
 * Pipeline:
 * 1. Parse Constants tab → evaluateConstants()
 * 2. Parse UsageDeclarations tab → evaluateUD()
 * 3. Parse JSX template → DSL.parser()
 * 4. Inject dependencies → UX.parseAndInject()
 * 5. Compile → new Function() con sandboxing
 * 6. Wrap con error handling
 */
export function compileView(viewElement: any): CompiledView {
    try {
        // 1. Compila Constants
        const constantsFn = viewElement.constants
            ? safeCompile(`return (${viewElement.constants})()`)
            : () => ({});

        // 2. Compila UsageDeclarations
        const udFn = viewElement.usageDeclarations
            ? safeCompile(`const ret = {}; (${viewElement.usageDeclarations})(ret); return ret;`)
            : () => ({});

        // 3. Compila JSX
        const jsxString = viewElement.jsxString || '<View />';
        const parsed = DSL.parser(jsxString);
        const injected = UX.parseAndInject(parsed, viewElement);

        // 4. Crea render function con parametri destructurati
        const paramStr = '{data, node, view, views, constants, usageDeclarations, React, ' +
            'View, Field, Input, Text, SubView, Image, Toggle, Selector, Graph, Edge, Vertex}';

        const renderFn = new Function(paramStr, `return (${injected});`);

        // 5. Wrap con context builder
        const render = (context: ViewContext): React.ReactNode => {
            const allConstants = constantsFn();
            const allUD = udFn();

            return renderFn({
                ...context,
                constants: allConstants,
                usageDeclarations: allUD,
                ...allConstants,
                ...allUD,
                React,
                // Built-in components
                View: BuiltInView,
                Field: BuiltInField,
                Input: BuiltInInput,
                Text: BuiltInText,
                SubView: BuiltInSubView,
                Image: BuiltInImage,
                Toggle: BuiltInToggle,
                Selector: BuiltInSelector,
                Graph: BuiltInGraph,
                Edge: BuiltInEdge,
                Vertex: BuiltInVertex,
            });
        };

        return {
            render,
            css: viewElement.css || '',
            hash: hashString(jsxString + (viewElement.css || '') + (viewElement.constants || '')),
            error: null,
        };

    } catch (error) {
        return {
            render: () => null,
            css: '',
            hash: '',
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Compila codice con sandboxing base.
 * Errori catturati e mostrati inline, non crashano l'editor.
 */
function safeCompile(code: string): (...args: any[]) => any {
    try {
        const fn = new Function(code);
        return (...args: any[]) => {
            try {
                return fn.apply(null, args);
            } catch (e) {
                console.error('[ViewpointCompiler] Runtime error:', e);
                return {};
            }
        };
    } catch (e) {
        console.error('[ViewpointCompiler] Compile error:', e);
        return () => ({});
    }
}
```

### 7.4 ViewpointCache — Performance

```typescript
// Path: editor-v3/viewpoint/ViewpointCache.ts

/**
 * Cache LRU per CompiledView.
 * Evita ri-compilazione quando lo stesso viewpoint e usato su piu nodi.
 */
class ViewpointCache {
    private cache = new Map<string, { compiled: CompiledView; accessTime: number }>();
    private maxSize: number;

    constructor(maxSize = 100) {
        this.maxSize = maxSize;
    }

    get(viewId: string, viewElement: any): CompiledView {
        const hash = hashViewElement(viewElement);
        const key = `${viewId}:${hash}`;

        const cached = this.cache.get(key);
        if (cached) {
            cached.accessTime = Date.now();
            return cached.compiled;
        }

        // Compile
        const compiled = compileView(viewElement);
        this.cache.set(key, { compiled, accessTime: Date.now() });

        // Evict LRU if over capacity
        if (this.cache.size > this.maxSize) {
            this.evictLRU();
        }

        return compiled;
    }

    invalidate(viewId: string): void {
        for (const key of this.cache.keys()) {
            if (key.startsWith(viewId + ':')) {
                this.cache.delete(key);
            }
        }
    }

    private evictLRU(): void {
        let oldestKey = '';
        let oldestTime = Infinity;
        for (const [key, entry] of this.cache) {
            if (entry.accessTime < oldestTime) {
                oldestTime = entry.accessTime;
                oldestKey = key;
            }
        }
        if (oldestKey) this.cache.delete(oldestKey);
    }
}

export const viewpointCache = new ViewpointCache();
```

### 7.5 ViewpointRenderer — Rendering Custom JSX

```typescript
// Path: editor-v3/viewpoint/ViewpointRenderer.tsx
// Responsabilita: esegue la view compilata dentro il nodo RF
// Props: ViewpointRendererProps
// State: compiledView (cached), error
// Hooks: useViewpointCache, useViewContext

const ViewpointRenderer = memo(({
    modelElementId,
    viewId,
    modelSnapshot,
    width,
    height,
    onSizeChange,
}: ViewpointRendererProps) => {

    // 1. Ottieni la CompiledView (cached)
    const compiledView = useCompiledView(viewId);

    // 2. Costruisci il contesto
    const context = useViewContext(modelElementId, viewId, modelSnapshot);

    // 3. Se errore di compilazione, mostra inline
    if (compiledView.error) {
        return (
            <div className="viewpoint-error">
                <i className="bi bi-exclamation-triangle" />
                <pre>{compiledView.error}</pre>
            </div>
        );
    }

    // 4. Inietta CSS scoped
    // 5. Esegui il render
    return (
        <ScopedCSS css={compiledView.css} viewId={viewId!}>
            <ViewpointErrorBoundary viewId={viewId!}>
                {compiledView.render(context)}
            </ViewpointErrorBoundary>
        </ScopedCSS>
    );
});
```

### 7.6 ScopedCSS — CSS Isolato per View

```typescript
// Path: editor-v3/viewpoint/builtins/ScopedCSS.tsx

/**
 * Inietta CSS scoped per una view specifica.
 * Usa un wrapper div con data-attribute per scoping.
 * Il CSS della view viene prefissato con [data-view="viewId"].
 */
const ScopedCSS = ({ css, viewId, children }: {
    css: string;
    viewId: string;
    children: React.ReactNode;
}) => {
    // Prefixa ogni regola CSS con il selettore di scope
    const scopedCss = useMemo(() => {
        if (!css) return '';
        const scope = `[data-view="${viewId}"]`;
        // Sostituisci '&' con il selettore di scope
        return css.replace(/&/g, scope);
    }, [css, viewId]);

    return (
        <>
            {scopedCss && <style>{scopedCss}</style>}
            <div data-view={viewId}>
                {children}
            </div>
        </>
    );
};
```

### 7.7 Built-In Components per JSX

```typescript
// Path: editor-v3/viewpoint/builtins/BuiltInComponents.tsx

/**
 * <View> — Wrapper principale con className
 */
const BuiltInView: React.FC<{ className?: string; style?: React.CSSProperties; children?: React.ReactNode }> =
    ({ className, style, children }) => (
        <div className={cn('viewpoint-view', className)} style={style}>
            {children}
        </div>
    );

/**
 * <Field> — Renderizza un campo editabile collegato a un DValue.
 * Scrive via syncFeatureValue nel canvasToJjomV3.
 */
const BuiltInField: React.FC<{ feature: any; editable?: boolean }> =
    ({ feature, editable = true }) => {
        const [editing, setEditing] = useState(false);
        const [value, setValue] = useState(feature?.values?.[0] ?? '');

        const handleBlur = useCallback(() => {
            setEditing(false);
            if (feature?.father) {
                syncFeatureValue(feature.father, feature.instanceof?.name, value);
            }
        }, [feature, value]);

        if (!editable || !editing) {
            return (
                <span
                    className="viewpoint-field"
                    onDoubleClick={() => editable && setEditing(true)}
                >
                    {feature?.instanceof?.name}: {feature?.values?.join(', ') || '-'}
                </span>
            );
        }

        return (
            <input
                className="viewpoint-field-input"
                value={value}
                onChange={e => setValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={e => e.key === 'Enter' && handleBlur()}
                autoFocus
            />
        );
    };

/**
 * <Input> — Input diretto collegato a una proprieta.
 */
const BuiltInInput: React.FC<{ value: any; onChange: (v: any) => void; placeholder?: string }> =
    ({ value, onChange, placeholder }) => (
        <input
            className="viewpoint-input"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
        />
    );

/**
 * <SubView> — Renderizza un sotto-elemento con la sua view dedicata.
 * Usato per composizione gerarchica (es. Company → Employee).
 */
const BuiltInSubView: React.FC<{ data: any; viewId?: string }> =
    ({ data, viewId }) => {
        // Trova la view applicabile per questo sotto-elemento
        const resolvedViewId = viewId || resolveViewForElement(data);
        const compiledView = viewpointCache.get(resolvedViewId, /* ... */);
        const context = buildViewContext(data, resolvedViewId);

        return (
            <div className="viewpoint-subview">
                {compiledView.render(context)}
            </div>
        );
    };

/**
 * <Selector> — Dropdown per riferimenti (lista di istanze compatibili).
 */
const BuiltInSelector: React.FC<{
    feature: any;
    options?: any[];
    multiple?: boolean;
}> = ({ feature, options, multiple }) => {
    // Mostra dropdown con istanze compatibili nel modello
    // Scrive via syncFeatureValue
    // ...
};

/**
 * <Toggle> — Switch per booleani
 */
const BuiltInToggle: React.FC<{ value: boolean; onChange: (v: boolean) => void; label?: string }> =
    ({ value, onChange, label }) => (
        <label className="viewpoint-toggle">
            {label && <span>{label}</span>}
            <div
                className={cn('jjodel-switch', { active: value })}
                onClick={() => onChange(!value)}
            />
        </label>
    );
```

### 7.8 ViewMatcher — Matching View → Elemento

```typescript
// Path: editor-v3/viewpoint/registry/ViewMatcher.ts

/**
 * Trova la DViewElement applicabile per un dato elemento del modello.
 *
 * Ordine di priorita:
 * 1. vertex.view (se gia assegnata)
 * 2. Matching per appliableToClasses
 * 3. Matching per appliableTo (tipo generico)
 * 4. Filtro oclCondition / jsCondition
 * 5. Ordinamento per explicitApplicationPriority
 */
export function resolveViewForElement(
    element: any,          // LModelElement
    vertex: any,           // LVertex (optional)
    viewpointId: string | null,
    mode: EditorMode,
): string | null {
    // 1. View gia assegnata al vertex
    if (vertex?.view) return vertex.view;

    // 2. Se non c'e viewpoint attivo, usa built-in
    if (!viewpointId) return null;

    // 3. Carica viewpoint e filtra views applicabili
    const viewpoint = LPointerTargetable.fromD(viewpointId);
    const views = viewpoint?.views || [];

    const applicable = views.filter((view: any) => {
        // Controlla appliableToClasses
        if (view.appliableToClasses?.length > 0) {
            const className = element.instanceof?.name || element.name;
            if (!view.appliableToClasses.includes(className)) return false;
        }

        // Controlla appliableTo (tipo generico)
        if (view.appliableTo && view.appliableTo !== 'Any') {
            const elementGraphType = getGraphType(element);
            if (view.appliableTo !== elementGraphType) return false;
        }

        // Controlla jsCondition
        if (view.jsCondition) {
            try {
                const fn = new Function('data', `return (${view.jsCondition})`);
                if (!fn(element)) return false;
            } catch { return false; }
        }

        return true;
    });

    if (applicable.length === 0) return null;

    // 4. Ordina per priorita e ritorna la migliore
    applicable.sort((a: any, b: any) =>
        (b.explicitApplicationPriority ?? 0) - (a.explicitApplicationPriority ?? 0)
    );

    return applicable[0].id;
}
```

### 7.9 Performance con 500 Nodi

Per gestire 500 nodi con viewpoint JSX:

1. **ViewpointCache:** Compila una volta, riusa per tutti i nodi della stessa classe
2. **Viewport Culling:** Nodi fuori viewport non eseguono il render JSX
3. **Memoization:** `ModelNodeContent` e `memo()` — ri-renderizza solo se `data` cambia
4. **Built-in views per M2:** Nessun overhead di compilazione per metamodelli
5. **Lazy compilation:** Compila solo quando il nodo entra nel viewport per la prima volta
6. **Debounced UD evaluation:** Le usageDeclarations vengono rivalutate con debounce di 100ms

```typescript
// useViewportCulling — skip rendering per nodi fuori viewport
const useViewportCulling = (nodeId: string, data: ModelNodeData) => {
    const { getViewport } = useReactFlow();
    const viewport = getViewport();

    // Controlla se il nodo e visibile nel viewport corrente
    const isVisible = useMemo(() => {
        const vp = viewport;
        const nodeX = data.width; // posizione dal nodo RF
        // ... calcolo intersezione rettangoli
        return true; // semplificato
    }, [viewport, data]);

    return isVisible;
};
```

---

## 8. Palette Adattiva

### 8.1 Architettura

La palette cambia contenuto in base al `mode` (M2 vs M1):

```
AdaptivePalette
├── mode === 'metamodel' (M2)
│   ├── Sezione "Classifiers"
│   │   ├─ [Class]       → drag creates DClass + DVertex
│   │   ├─ [Enum]        → drag creates DEnumerator + DVertex
│   │   └─ [DataType]    → drag creates DDataType + DVertex
│   ├── Sezione "Structure"
│   │   ├─ [Package]     → drag creates DPackage + DGraphVertex
│   │   ├─ [Attribute]   → drop su classe aggiunge DAttribute
│   │   └─ [Operation]   → drop su classe aggiunge DOperation
│   └── Sezione "Relations"
│       ├─ [Reference]   → modalita draw-edge
│       ├─ [Inheritance] → modalita draw-edge
│       └─ [Dependency]  → modalita draw-edge
│
└── mode === 'model' (M1)
    ├── Sezione "Classes" (dal metamodello)
    │   ├─ [Person]      → drag creates DObject(instanceof=Person) + DVertex
    │   ├─ [Address]     → drag creates DObject(instanceof=Address) + DVertex
    │   └─ [Company]     → drag creates DObject(instanceof=Company) + DVertex
    │   (lista dinamica: legge DClass dal metamodello M2)
    │
    └── Sezione "Links" (opzionale)
        └─ Draw reference link tra istanze
```

### 8.2 Componente AdaptivePalette

```typescript
// Path: editor-v3/panels/AdaptivePalette.tsx
// Responsabilita: lista di elementi draggabili, adattiva al mode
// Props: AdaptivePaletteProps
// State: expandedSections
// Hooks: useEditorV3Context, useSelector (per classi M2)
// Interazione JjOM: legge classi del metamodello in mode M1
// Interazione componenti: onDragStart callback verso EditorV3Inner

const AdaptivePalette = ({ mode, metamodelId, onDragStart }: AdaptivePaletteProps) => {
    if (mode === 'metamodel') {
        return <MetamodelPalette onDragStart={onDragStart} />;
    }

    return <ModelPalette metamodelId={metamodelId!} onDragStart={onDragStart} />;
};

/**
 * Palette per M1: legge le classi dal metamodello e le mostra come istanziabili.
 */
const ModelPalette = ({ metamodelId, onDragStart }: { metamodelId: string; onDragStart: any }) => {
    // Legge le classi non-astratte dal metamodello
    const instantiableClasses = useSelector((state: any) => {
        const lModel = LPointerTargetable.fromD(metamodelId) as any;
        if (!lModel) return [];

        return (lModel.classes || [])
            .filter((c: any) => !c.abstract && !c.interface)
            .map((c: any) => ({
                id: c.id,
                name: c.name,
                attributeCount: (c.attributes || []).length,
                referenceCount: (c.references || []).length,
            }));
    });

    return (
        <div className="palette-section">
            <h4 className="palette-section-title">Instances</h4>
            {instantiableClasses.map(cls => (
                <PaletteItem
                    key={cls.id}
                    icon="bi-box"
                    label={cls.name}
                    sublabel={`${cls.attributeCount} attrs, ${cls.referenceCount} refs`}
                    onDragStart={() => onDragStart('createObject', { classId: cls.id })}
                />
            ))}
        </div>
    );
};
```

### 8.3 Drop Handling

```typescript
// In EditorV3Inner.tsx, onDrop handler:

const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();

    const type = event.dataTransfer.getData('application/jjodel-palette-type');
    const dataStr = event.dataTransfer.getData('application/jjodel-palette-data');
    const data = dataStr ? JSON.parse(dataStr) : {};

    const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });

    switch (type) {
        case 'createClass':
            syncCreateClass(graphId, position.x, position.y);
            break;
        case 'createEnum':
            syncCreateEnum(graphId, position.x, position.y);
            break;
        case 'createPackage':
            syncCreatePackage(graphId, position.x, position.y);
            break;
        case 'createObject':
            syncCreateObject(graphId, data.classId, position.x, position.y);
            break;
    }
}, [graphId, screenToFlowPosition]);
```

---

## 9. Layout Mapping DVertex/DEdge <-> React Flow

### 9.1 Tabella di Mapping Completa

| Proprieta JjOM | Direzione | Proprieta React Flow | Note |
|----------------|-----------|---------------------|------|
| `DVertex.x, .y` | ↔ | `Node.position.{x, y}` | Bidirezionale via sync |
| `DVertex.w, .h` | ↔ | `Node.style.{width, height}` + `ModelNodeData.{width, height}` | Solo se `isResized`, altrimenti da view |
| `DVertex.zIndex` | → | `Node.style.zIndex` + `ModelNodeData.zIndex` | JjOM → Canvas (canvas non modifica zIndex) |
| `DVertex.anchors` | → | `DynamicAnchors` → Handle components | Percentuali → posizione CSS |
| `DVertex.state` | → | `ModelNodeData.cssState` → `Node.style` | Dict CSS → inline style |
| `DVertex.view` | → | `ModelNodeData.viewId` → ViewpointRenderer | Determina rendering |
| `DVertex.isResized` | ↔ | `ModelNodeData.isResized` | Flag per resize behavior |
| `DVertex.zoom` | → | `ModelNodeData.zoom` → CSS `transform: scale()` | Per DGraphVertex |
| `DVertex.isSelected` | ↔ | `Node.selected` | Via useJjomSelection |
| `DEdge.start` | → | `Edge.source` | ID del DVertex sorgente |
| `DEdge.end` | → | `Edge.target` | ID del DVertex destinazione |
| `DEdge.anchorStart` | ↔ | `Edge.sourceHandle` | Nome → handle ID |
| `DEdge.anchorEnd` | ↔ | `Edge.targetHandle` | Nome → handle ID |
| `DEdge.midPoints` | ↔ | `UnifiedEdgeData.waypoints` | Con CoordinateMode conversion |
| `DEdge.isExtend/isReference/...` | → | `UnifiedEdgeData.edgeKind` | Tipo semantico |
| `DGraph.zoom` | ↔ | `ReactFlow viewport zoom` | Bidirezionale |
| `DGraph.offset` | ↔ | `ReactFlow viewport position` | Bidirezionale |
| `DGraphVertex.subElements` | → | Nodi figli con `parentId` | Solo se espanso |

### 9.2 Risoluzione Dimensioni

```typescript
function resolveDimensions(
    vertex: any,
    viewId: string | null,
): { width: number; height: number } {
    // Se il nodo e stato ridimensionato manualmente, usa le sue dimensioni
    if (vertex.isResized && vertex.w > 0 && vertex.h > 0) {
        return { width: vertex.w, height: vertex.h };
    }

    // Altrimenti, prendi le dimensioni di default dalla DViewElement
    if (viewId) {
        const viewElement = LPointerTargetable.fromD(viewId);
        if (viewElement?.defaultVSize) {
            return {
                width: viewElement.defaultVSize.w || 180,
                height: viewElement.defaultVSize.h || 80,
            };
        }
    }

    // Fallback: dimensioni di default per tipo
    return { width: 180, height: 80 };
}
```

### 9.3 Conversione CSS State

```typescript
/**
 * Converte il campo `state` di DVertex (dizionario CSS) in stile React inline.
 */
function cssStateToStyle(cssState: Record<string, string | number>): React.CSSProperties {
    const style: React.CSSProperties = {};

    for (const [key, value] of Object.entries(cssState)) {
        switch (key) {
            case 'rotation':
                style.transform = `${style.transform || ''} rotate(${value}deg)`.trim();
                break;
            case 'opacity':
                style.opacity = Number(value);
                break;
            case 'scaleX':
            case 'scaleY':
                style.transform = `${style.transform || ''} ${key}(${value})`.trim();
                break;
            case 'borderRadius':
                style.borderRadius = typeof value === 'number' ? `${value}px` : value;
                break;
            default:
                // Passa direttamente come CSS property
                (style as any)[camelCase(key)] = value;
        }
    }

    return style;
}
```

### 9.4 Conversione Ancore

```typescript
/**
 * Converte ancore JjOM (% della dimensione nodo) in posizionamento Handle RF.
 */
function resolveAnchors(
    vertex: any,
    viewId: string | null,
): Record<string, { x: number; y: number }> {
    // 1. Priorita: ancore dal vertex (override manuale)
    if (vertex.anchors && Object.keys(vertex.anchors).length > 0) {
        return vertex.anchors;
    }

    // 2. Ancore dalla view
    if (viewId) {
        const viewElement = LPointerTargetable.fromD(viewId);
        if (viewElement?.defaultAnchors) {
            return viewElement.defaultAnchors;
        }
    }

    // 3. Default: 4 ancore cardinali
    return {
        north: { x: 0.5, y: 0 },
        south: { x: 0.5, y: 1 },
        east:  { x: 1,   y: 0.5 },
        west:  { x: 0,   y: 0.5 },
    };
}
```

---

## 10. Piano di Implementazione

### 10.1 Fasi e Dipendenze

```
Fase 1: Scaffold + Sync Layer Base
    │
    ├── Fase 2: Nodi M2 con Built-in Views
    │       │
    │       ├── Fase 3: Edge System
    │       │       │
    │       │       └── Fase 4: Palette + Properties Panel
    │       │               │
    │       │               └── Fase 7: Undo/Redo + Keyboard + Refinement
    │       │
    │       └── Fase 5: Nodi M1 + Palette Adattiva
    │               │
    │               └── Fase 6: Viewpoint JSX Pipeline
    │                       │
    │                       └── Fase 7: Undo/Redo + Keyboard + Refinement
    │
    └── Fase 8: DGraphVertex + Search + Export
```

### Fase 1: Scaffold + Sync Layer Base (Fondamenta)

**Obiettivo:** EditorV3 renderizza nodi e archi da un DGraph esistente, con sync bidirezionale posizione.

**File da creare:**
- `EditorV3Shell.tsx`, `EditorV3Inner.tsx`
- `types.ts`, `constants.ts`
- `contexts/EditorV3Context.tsx`
- `sync/useJjomSyncV3.ts` (fork da V2, adattato a ModelNodeData)
- `sync/canvasToJjomV3.ts` (fork da V2)
- `sync/syncCoordinator.ts` (fork da V2 syncState.ts)
- `sync/jjomTransformers.ts` (fork + estensione da V2)
- `sync/coordinateTransforms.ts` (nuovo)
- `nodes/ModelNode.tsx` (placeholder — box con label)
- `nodes/DynamicAnchors.tsx` (fork da V2 DynamicHandles)
- `styles/editor-v3.scss`

**Criteri di completamento:**
- [ ] EditorV3Shell si monta con un `modelid` prop
- [ ] I DVertex del DGraph appaiono come rettangoli con label
- [ ] Drag di un nodo scrive posizione su JjOM
- [ ] Modifiche da Redux (altra tab) si riflettono sul canvas
- [ ] Anti-bounce funziona (no infinite loop)

**Dipendenze:** Nessuna — punto di partenza.

### Fase 2: Nodi M2 con Built-in Views

**Obiettivo:** Le classi, enum e package sono renderizzati con la notazione UML built-in.

**File da creare:**
- `nodes/ModelNodeContent.tsx`
- `viewpoint/registry/ViewRegistry.ts`
- `viewpoint/notations/UMLClassView.tsx`
- `viewpoint/notations/UMLEnumView.tsx`
- `viewpoint/notations/UMLPackageView.tsx`
- (almeno 1 notazione alternativa: `SimplifiedView.tsx`)
- `toolbar/NotationSelector.tsx`

**Criteri di completamento:**
- [ ] DClass renderizzati con nome, attributi, operazioni, riferimenti (UML)
- [ ] DEnumerator renderizzati con literals
- [ ] Cambio notazione live (UML → Simplified)
- [ ] Inline editing: doppio click per editare nomi
- [ ] 9 color schemes funzionanti
- [ ] Dark/light theme

**Dipendenze:** Fase 1.

### Fase 3: Edge System

**Obiettivo:** Archi di ereditarieta e riferimento con Manhattan routing.

**File da creare:**
- `edges/UnifiedEdge.tsx` (fork da V2 + edgeKind esteso)
- `edges/edgeRouting.ts` (fork da V2)
- `edges/edgeMarkers.ts`
- `edges/SegmentHandles.tsx` (fork da V2)
- `hooks/useAutoAnchor.ts` (fork da V2)
- `hooks/useConnectionValidation.ts`
- `components/EdgeTypePopup.tsx` (fork da V2)

**Criteri di completamento:**
- [ ] Drag-to-connect crea ereditarieta o riferimento
- [ ] Manhattan routing con curve
- [ ] Label con nome e cardinalita
- [ ] Marcatori corretti per tipo (triangolo, freccia, diamante)
- [ ] Auto-anchor con hysteresis
- [ ] Validazione connessioni (no cicli ereditarieta)

**Dipendenze:** Fase 1, Fase 2 (per i nodi a cui collegarsi).

### Fase 4: Palette + Properties Panel

**Obiettivo:** Palette drag-and-drop per M2, pannello proprieta completo.

**File da creare:**
- `panels/AdaptivePalette.tsx` (solo parte M2 inizialmente)
- `panels/PaletteItem.tsx`
- `panels/PropertiesPanel.tsx` (fork da V2, esteso)
- `context-menu/ContextMenu.tsx`

**Criteri di completamento:**
- [ ] Drag Class/Enum/Package dalla palette crea elementi
- [ ] Pannello proprieta mostra/edita tutte le proprieta della selezione
- [ ] Context menu con azioni contestuali
- [ ] Delete via tasto Delete e context menu

**Dipendenze:** Fase 1, Fase 2, Fase 3.

### Fase 5: Nodi M1 + Palette Adattiva

**Obiettivo:** Supporto completo per editing modelli (M1).

**File da creare/modificare:**
- `viewpoint/notations/GenericObjectView.tsx`
- `sync/canvasToJjomV3.ts` — aggiunta `syncCreateObject`, `syncFeatureValue`, `syncInstanceLink`
- `sync/jjomTransformers.ts` — aggiunta ObjectSnapshot
- `panels/AdaptivePalette.tsx` — aggiunta parte M1 (ModelPalette)
- `hooks/useEditorMode.ts`

**Criteri di completamento:**
- [ ] Switch M2/M1 nell'editor
- [ ] Palette M1 mostra classi del metamodello come istanziabili
- [ ] Drag di una classe crea DObject con DValue per ogni feature
- [ ] GenericObjectView mostra nome, classe, valori
- [ ] Inline editing dei valori DValue
- [ ] Link tra istanze (DValue di tipo reference)

**Dipendenze:** Fase 1, Fase 2 (le view M1 senza viewpoint usano GenericObjectView).

### Fase 6: Viewpoint JSX Pipeline

**Obiettivo:** Il sistema viewpoint completo — compilazione JSX, rendering custom, componenti built-in.

**File da creare:**
- `viewpoint/ViewpointRenderer.tsx`
- `viewpoint/ViewpointCompiler.ts`
- `viewpoint/ViewpointContext.ts`
- `viewpoint/ViewpointCache.ts`
- `viewpoint/builtins/BuiltInComponents.tsx` (View, Field, Input, Text, SubView, etc.)
- `viewpoint/builtins/ErrorBoundary.tsx`
- `viewpoint/builtins/ScopedCSS.tsx`
- `viewpoint/registry/ViewMatcher.ts`

**Criteri di completamento:**
- [ ] DViewElement con JSX compila ed esegue dentro nodo RF
- [ ] Componenti built-in (View, Field, Input, SubView, Selector, Toggle) funzionanti
- [ ] CSS scoped per view
- [ ] Error boundary — errori JSX non crashano l'editor
- [ ] Cache compilazione — stessa view su N nodi compila una volta sola
- [ ] Constants e UsageDeclarations funzionanti
- [ ] Editing interattivo dei valori via Field/Input

**Dipendenze:** Fase 5 (per avere DObject da visualizzare con viewpoint).

### Fase 7: Undo/Redo + Keyboard + Refinement

**Obiettivo:** Polish e completamento funzionalita.

**File da creare:**
- `hooks/useHistory.ts` (evoluzione da V2, Redux-based)
- `hooks/useKeyboardShortcuts.ts`
- `toolbar/Toolbar.tsx`
- `toolbar/AlignmentToolbar.tsx`
- `hooks/useAlignment.ts` (fork da V2)

**Criteri di completamento:**
- [ ] Undo/redo funzionante per tutte le operazioni
- [ ] Ctrl+Z / Ctrl+Shift+Z
- [ ] Delete, arrow nudge, Tab, Ctrl+A, Escape
- [ ] Copy/paste/duplicate con remapping ID
- [ ] Alignment e distribution tools
- [ ] Snap to grid (toggle)
- [ ] MiniMap
- [ ] Fit view

**Dipendenze:** Tutte le fasi precedenti.

### Fase 8: DGraphVertex + Search + Export + Advanced

**Obiettivo:** Feature avanzate e completamento.

**File da creare:**
- `toolbar/BreadcrumbNav.tsx`
- `panels/ModelExplorer.tsx`
- `panels/SearchPanel.tsx`
- `hooks/useViewportCulling.ts`
- `hooks/useTreeLayout.ts` (fork da V2)

**Criteri di completamento:**
- [ ] DGraphVertex expand/collapse con nodi annidati
- [ ] Breadcrumb navigation per grafi annidati
- [ ] Model Explorer tree view in sidebar
- [ ] Search/filter elementi nel canvas
- [ ] Export SVG/PNG
- [ ] Viewport culling per 500+ nodi
- [ ] Auto-layout (tree, hierarchical)
- [ ] Tooltip/hover info
- [ ] Layers/visibility toggle

**Dipendenze:** Tutte le fasi precedenti.

### 10.2 Stima di Effort

| Fase | Complessita | Rischio |
|------|-------------|---------|
| 1. Scaffold + Sync | Alta — fondamenta | Basso (fork V2) |
| 2. Nodi M2 Built-in | Media | Basso |
| 3. Edge System | Alta | Medio (fork V2 ma + tipi) |
| 4. Palette + Properties | Media | Basso |
| 5. Nodi M1 | Alta | Medio (DObject lifecycle) |
| 6. Viewpoint JSX | Molto Alta | Alto (compilazione, sandboxing, performance) |
| 7. Undo + Keyboard | Media | Basso |
| 8. Advanced | Alta (molte feature) | Medio |

### 10.3 Strategia di Migrazione V2 → V3

**NON sostituire V2 immediatamente.** V3 coesiste con V2 durante lo sviluppo:

1. V3 viene montato quando `DGraph.graphStyle === 'v3-editor'`
2. V2 continua a funzionare per grafi esistenti (`v2-flow`)
3. Un toggle nell'UI permette di provare V3 su grafi esistenti
4. Quando V3 raggiunge parita di feature con V2 (dopo Fase 4), V2 viene deprecato
5. V2 viene rimosso solo quando V3 e stabile in produzione

---

## Appendice A: Problemi Risolti

### A.1 Come un singolo node type gestisce M2 e M1?

**Risposta:** Tramite `ModelNodeData.modelSnapshot` che ha un discriminator `kind`:
- `kind: 'class'` → usa ClassSnapshot → built-in UMLClassView
- `kind: 'object'` → usa ObjectSnapshot → GenericObjectView o viewpoint custom
- Il rendering e delegato al ViewpointRenderer/ViewRegistry, non al node type

### A.2 Come la palette sa cosa mostrare?

**Risposta:** `AdaptivePalette` legge `mode` dal context:
- M2: lista statica (Class, Enum, Package, Attribute, etc.)
- M1: legge `metamodelId` → selettore Redux per classi non-astratte → lista dinamica

### A.3 Come il viewpoint JSX si integra con React Flow?

**Risposta:** Il `ModelNode` e il wrapper RF. Al suo interno:
1. `DynamicAnchors` genera Handle dalle ancore JjOM/view
2. `ModelNodeContent` → `ViewpointRenderer` esegue il JSX
3. L'output JSX e un albero React normale dentro il nodo RF
4. I componenti built-in (Field, Input) scrivono via `syncFeatureValue`
5. Drag/resize sono gestiti dal `ModelNode` wrapper, non dal JSX

### A.4 Come gestire undo/redo tra canvas e JjOM?

**Risposta:** V3 usa undo/redo **basato su Redux**, non su snapshot canvas:
- Ogni operazione significativa e una TRANSACTION
- L'undo reverte la TRANSACTION (il Redux middleware la traccia)
- Il sync layer propaga automaticamente lo stato reverted al canvas
- Non serve coordinare due stack separati

### A.5 Performance con viewpoint JSX su 500 nodi?

**Risposta:** Multi-layer:
1. ViewpointCache: compile once, render many
2. Viewport culling: nodi fuori viewport → placeholder leggero
3. memo() su ModelNodeContent: re-render solo se data cambia
4. Built-in views per M2: zero overhead di compilazione
5. Lazy compilation: prima volta nel viewport
6. CSS injection: una volta per viewId, non per nodo

### A.6 Mapping DVertex <-> React Flow Node?

**Risposta:** Tabella completa in Sezione 9.1. Transformer bidirezionali in `jjomTransformers.ts` (JjOM → RF) e `canvasToJjomV3.ts` (RF → JjOM).

### A.7 DGraphVertex (grafi annidati)?

**Risposta:** Expand/collapse. Collapsed = box compatto. Expanded = nodi figli con `parentId` in RF (nesting nativo). BreadcrumbNav per navigazione.

### A.8 5 sistemi di coordinate per DEdgePoint?

**Risposta:** `coordinateTransforms.ts` converte in entrambe le direzioni. Il sync layer traduce sempre in assoluto per RF, e riconverte nel CoordinateMode originale quando scrive su JjOM.

### A.9 Ancore nominate → Handle RF?

**Risposta:** `DynamicAnchors` genera Handle con ID `anchor-${name}` e posizionamento CSS calcolato dalla percentuale. Ancore su bordi → Handle con `position` enum. Ancore interne → Handle con `position: absolute`.

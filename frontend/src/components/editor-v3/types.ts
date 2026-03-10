/**
 * Editor V3 — Type definitions.
 *
 * Single unified type system: one node type (ModelNode), one edge type (UnifiedEdge).
 * The viewpoint system decides how to render each element.
 */

import type { Node, Edge } from '@xyflow/react';

// ---- Editor Modes ----

/** Editor mode: metamodel editing (M2) or model editing (M1) */
export type EditorMode = 'metamodel' | 'model';

/** Active notation for built-in views */
export type NotationMode = 'uml' | 'simplified' | 'compact' | 'wireframe' | 'er' | 'viewpoint';

/** Color scheme for node rendering */
export type ColorScheme =
    | 'default' | 'pastel' | 'ocean' | 'forest'
    | 'sunset' | 'monochrome' | 'neon' | 'earth' | 'nordic';

// ---- Node Data ----

/**
 * Data associated with every node in React Flow.
 * SINGLE type — the viewpoint decides how to render.
 */
export interface ModelNodeData {
    /** ID of the DModelElement being visualized (DClass, DObject, DEnumerator, DPackage) */
    modelElementId: string;

    /** Type of the model element (used for fast-path decisions) */
    modelClassName: 'DClass' | 'DEnumerator' | 'DPackage' | 'DObject' | 'DDataType';

    /** ID of the DViewElement defining rendering (null = use built-in) */
    viewId: string | null;

    /** Flag: explicit dimensions (true) or from view default (false) */
    isResized: boolean;

    /** Dimensions — always present, resolved by the sync layer */
    width: number;
    height: number;

    /** Named anchors — from DVertex.anchors or DViewElement defaults */
    anchors: Record<string, { x: number; y: number }>;

    /** Dynamic CSS state from DVertex.state (rotation, opacity, transforms) */
    cssState: Record<string, string | number>;

    /** zIndex from DVertex */
    zIndex: number;

    /** Zoom field from DVertex (scale factor) */
    zoom: { x: number; y: number };

    // ---- Pre-resolved model data (for fast rendering) ----

    /** Element name */
    label: string;

    /**
     * Snapshot of model data for the viewpoint renderer.
     * Discriminated union on `kind`.
     */
    modelSnapshot: ModelSnapshot;

    /** Active notation (for built-in views) */
    notation: NotationMode;

    /** Active color scheme */
    colorScheme: ColorScheme;

    /** Flag for auto-edit after creation from palette */
    autoEdit?: boolean;

    /** Flag: this node is a DGraphVertex (contains sub-graph) */
    isGraphVertex?: boolean;

    /** If isGraphVertex, expand/collapse state */
    isExpanded?: boolean;

    /** Index signature required by React Flow's Record<string, unknown> constraint */
    [key: string]: unknown;
}

// ---- Model Snapshots (discriminated union by kind) ----

export type ModelSnapshot =
    | ClassSnapshot
    | EnumSnapshot
    | ObjectSnapshot
    | PackageSnapshot
    | DataTypeSnapshot;

export interface ClassSnapshot {
    kind: 'class';
    isAbstract: boolean;
    isInterface: boolean;
    attributes: AttributeInfo[];
    references: ReferenceInfo[];
    operations: OperationInfo[];
    superclassNames: string[];
}

export interface EnumSnapshot {
    kind: 'enum';
    literals: LiteralInfo[];
}

export interface ObjectSnapshot {
    kind: 'object';
    instanceOfClassName: string;
    instanceOfClassId: string;
    features: FeatureValueInfo[];
}

export interface PackageSnapshot {
    kind: 'package';
    childCount: number;
}

export interface DataTypeSnapshot {
    kind: 'datatype';
    typeName: string;
}

// ---- Sub-structures ----

export interface AttributeInfo {
    id: string;
    name: string;
    type: string;
    typeId: string;
    defaultValue: string;
    lowerBound: number;
    upperBound: number;
}

export interface ReferenceInfo {
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

export interface OperationInfo {
    id: string;
    name: string;
    returnType: string;
    parameters: ParameterInfo[];
}

export interface ParameterInfo {
    id: string;
    name: string;
    type: string;
}

export interface LiteralInfo {
    id: string;
    name: string;
    value: number;
}

export interface FeatureValueInfo {
    id: string;
    featureName: string;
    featureKind: 'attribute' | 'reference';
    featureTypeId: string;
    values: (string | number | boolean | null)[];
    /** For references: names of pointed objects */
    resolvedNames?: string[];
}

// ---- Edge Data ----

/**
 * Data associated with every edge in React Flow.
 * SINGLE type — rendering changes based on edgeKind.
 */
export interface UnifiedEdgeData {
    /** Semantic type of the edge */
    edgeKind: 'inheritance' | 'reference' | 'composition' | 'aggregation'
            | 'dependency' | 'instanceLink' | 'valueLink';

    /** ID of the DEdge in JjOM */
    jjomEdgeId: string;

    /** ID of the associated DModelElement (DReference, extends entry, DValue) */
    jjomModelId: string | null;

    /** Edge label */
    label: string;

    /** Additional labels (source role, target role, cardinality) */
    sourceLabel?: string;
    targetLabel?: string;
    sourceCardinality?: string;
    targetCardinality?: string;

    /** Waypoints for Manhattan routing (segment-offset format) */
    waypoints: Array<{ segmentIndex: number; offset: number }>;

    /** Specific anchors for this edge */
    sourceAnchor: AnchorConfig;
    targetAnchor: AnchorConfig;

    /** Notation + color scheme (for edge styles) */
    notation: NotationMode;
    colorScheme: ColorScheme;

    /** Index signature required by React Flow's Record<string, unknown> constraint */
    [key: string]: unknown;
}

// ---- Anchor Types ----

export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';

export interface AnchorConfig {
    mode: 'auto' | 'pinned' | 'named';
    /** For mode 'auto' and 'pinned': calculated or fixed side */
    side: AnchorSide;
    /** For mode 'named': anchor name in DVertex.anchors dictionary */
    anchorName?: string;
    /** Percentage position along the side (0-1) */
    position?: number;
}

// ---- Context Types ----

export interface EditorV3ContextType {
    /** M2 or M1 */
    mode: EditorMode;
    /** ID of the DModel being edited */
    modelId: string;
    /** ID of the DGraph being visualized */
    graphId: string;
    /** If M1, ID of the metamodel (instanceof) */
    metamodelId: string | null;
    /** Active viewpoint (null = built-in) */
    viewpointId: string | null;
    /** Active notation */
    notation: NotationMode;
    /** Color scheme */
    colorScheme: ColorScheme;
    /** Snap to grid */
    snapToGrid: boolean;
    /** Grid size */
    gridSize: number;
    /** Take a snapshot for undo */
    takeSnapshot: () => void;
    /** Callback for anchor recalculation */
    onAnchorRecalcNeeded: () => void;
    /** Callback for layout changes */
    onLayoutChanged: () => void;
}

// ---- Viewpoint Types (Phase 6) ----

export interface ViewContext {
    /** Model element (LClass, LObject, etc.) */
    data: any;
    /** Graph node (LVertex) */
    node: any;
    /** Current view (LViewElement) */
    view: any;
    /** Decorative view stack */
    views: any[];
    /** Constants tab output */
    constants: Record<string, any>;
    /** Usage declarations tab output */
    usageDeclarations: Record<string, any>;
}

export interface CompiledView {
    /** Render function */
    render: (context: ViewContext) => React.ReactNode;
    /** Scoped CSS */
    css: string;
    /** Hash for cache invalidation */
    hash: string;
    /** Compilation error, if any */
    error: string | null;
}

// ---- RF Node/Edge type aliases ----

export type V3Node = Node<ModelNodeData>;
export type V3Edge = Edge<UnifiedEdgeData>;

// ---- Ecore primitive types (reused from V2) ----

export type EDataType =
    | 'EString' | 'EInt' | 'EFloat' | 'EBool'
    | 'EDate' | 'EChar' | 'ELong' | 'EDouble';

export const E_DATA_TYPES: EDataType[] = [
    'EString', 'EInt', 'EFloat', 'EBool', 'EDate', 'EChar', 'ELong', 'EDouble',
];

// ---- Helpers ----

export function formatCardinality(lower: number, upper: number): string {
    if (lower === 0 && upper === 1) return '0..1';
    if (lower === 0 && upper === -1) return '0..*';
    if (lower === 1 && upper === 1) return '1';
    if (lower === 1 && upper === -1) return '1..*';
    if (upper === -1) return `${lower}..*`;
    return `${lower}..${upper}`;
}

// === Notation modes ===
export type NotationMode = 'uml' | 'simplified' | 'compact' | 'wireframe' | 'er';

// === Color schemes ===
export type ColorScheme =
    | 'default'
    | 'monochrome'
    | 'sapphire'
    | 'amethyst'
    | 'jade'
    | 'terracotta'
    | 'crimson'
    | 'high-contrast'
    | 'print';

// === User-created (seed-driven) palettes ===
export interface CustomColorScheme {
    id: string;     // 'custom-<uuid>' — also the `scheme-<id>` root class suffix
    name: string;   // user-facing label
    seed: string;   // hex seed color the palette is derived from
}

// A built-in scheme id OR a custom palette id (`custom-<uuid>`).
export type ActiveColorScheme = ColorScheme | string;

// === Tipi primitivi Ecore ===
export type EDataType =
    | 'EString'
    | 'EInt'
    | 'EFloat'
    | 'EBool'
    | 'EDate'
    | 'EChar'
    | 'ELong'
    | 'EDouble';

// Single source of truth: canonical Ecore primitive name <-> Editor-v2 display label.
// Order here defines the dropdown order. Only EBoolean is abbreviated; the rest are identity.
// NB: named PRIMITIVE_TYPE_LABELS (not PRIMITIVE_TYPES) to avoid colliding with the existing
// jjscript autocomplete export `PRIMITIVE_TYPES` (jjscript/autocomplete/types.ts).
export const PRIMITIVE_TYPE_LABELS: ReadonlyArray<{ canonical: string; display: EDataType }> = [
    { canonical: 'EString',  display: 'EString' },
    { canonical: 'EInt',     display: 'EInt'    },
    { canonical: 'EFloat',   display: 'EFloat'  },
    { canonical: 'EBoolean', display: 'EBool'   },
    { canonical: 'EDate',    display: 'EDate'   },
    { canonical: 'EChar',    display: 'EChar'   },
    { canonical: 'ELong',    display: 'ELong'   },
    { canonical: 'EDouble',  display: 'EDouble' },
];

export const E_DATA_TYPES: EDataType[] = PRIMITIVE_TYPE_LABELS.map(t => t.display);

const CANONICAL_TO_DISPLAY: Record<string, EDataType> = Object.fromEntries(
    PRIMITIVE_TYPE_LABELS.map(t => [t.canonical, t.display] as [string, EDataType])
) as Record<string, EDataType>;

/** Canonical Ecore primitive name (e.g. 'EBoolean') -> Editor-v2 display label (e.g. 'EBool').
 *  Identity for names not in the table (enum names, class refs); 'EString' when undefined. */
export function displayTypeLabel(canonical?: string): string {
    if (!canonical) return 'EString';
    return CANONICAL_TO_DISPLAY[canonical] ?? canonical;
}

// === Attributo ===
export interface MetaAttribute {
    id: string;
    name: string;
    type: EDataType | string; // string per riferimento a Enum per nome
    defaultValue?: string;
    lowerBound: number;  // 0 = opzionale, 1 = obbligatorio
    upperBound: number;  // 1 = singolo, -1 = unbounded
}

// === Literal (valore di un Enum) ===
export interface MetaLiteral {
    id: string;
    name: string;
    value: number;  // valore numerico dell'enum literal
}

// === Reference ===
export type ReferenceKind = 'association' | 'composition' | 'aggregation';

export interface MetaReference {
    id: string;
    name: string;
    kind: ReferenceKind;
    targetClassId: string;  // ID del nodo target
    lowerBound: number;
    upperBound: number;     // -1 = unbounded (*)
    containment: boolean;   // true per composition
    opposite?: string;      // nome della reference opposta (bidirezionale)
    type?: { id: string; name: string };  // resolved type info from JjOM
}

// === Ghost parent (cross-metamodel extends, rendered as in-node overlay) ===
export interface GhostParentInfo {
    id: string;
    name: string;
    metamodelName: string;
    fullname: string;
    offset?: { dx: number; dy: number };
}

// === Ghost target (cross-metamodel reference, rendered as in-node overlay) ===
export interface GhostTargetInfo {
    refName: string;
    targetName: string;
    targetMetamodel: string;
    cardinality: string;
    targetFullname: string;
    refId?: string;
    offset?: { dx: number; dy: number };
}

// === Node Data ===
export interface ClassNodeData {
    label: string;
    isAbstract: boolean;
    isSingleton?: boolean;
    attributes: MetaAttribute[];
    references?: MetaReference[];
    operations?: MetaOperation[];
    jsxString?: string;
    ghostParents?: GhostParentInfo[];
    ghostTargets?: GhostTargetInfo[];
    [key: string]: unknown;
}

export interface EnumNodeData {
    label: string;
    literals: MetaLiteral[];
    [key: string]: unknown;
}

export interface PackageNodeData {
    label: string;
    [key: string]: unknown;
}

// === Operation ===
export interface MetaOperation {
    id: string;
    name: string;
    returnType: EDataType | string | 'void';
    parameters: MetaParameter[];
}

export interface MetaParameter {
    id: string;
    name: string;
    type: EDataType | string;
}

// === Edge Waypoint ===
export interface EdgeWaypoint {
    segmentIndex: number;  // which segment of the path
    offset: number;        // offset in pixels from auto-calculated position
}

// === Anchor Config ===
export type AnchorSide = 'top' | 'right' | 'bottom' | 'left';
export type AnchorMode = 'auto' | 'pinned';

export interface AnchorConfig {
    mode: AnchorMode;
    side: AnchorSide;
}

// === Edge Data ===
export interface ReferenceEdgeData {
    reference: MetaReference;
    waypoints?: EdgeWaypoint[];
    sourceAnchor?: AnchorConfig;
    targetAnchor?: AnchorConfig;
    /** Depth stagger (px) for the cardinality when several share a target side. Set by applyDistribution. */
    cardinalityShift?: number;
    /** Arc-length offset (px) sliding the role along its edge to de-overlap bundles. Set by applyDistribution. */
    roleArcShift?: number;
    [key: string]: unknown;
}

export interface InheritanceEdgeData {
    // No additional data — inheritance is just source → target
    waypoints?: EdgeWaypoint[];
    sourceAnchor?: AnchorConfig;
    targetAnchor?: AnchorConfig;
    [key: string]: unknown;
}

export type MetaEdgeData = ReferenceEdgeData | InheritanceEdgeData;

// === M1 (Model Instance) Node Data ===

export interface ObjectNodeData {
    label: string;                    // instance name
    instanceOfClassName: string;      // metaclass name (e.g. "Person")
    instanceOfClassId: string;        // metaclass JjOM id
    features: FeatureValueRow[];      // attribute values shown inline
    autoEdit?: boolean;               // auto-focus on creation
    [key: string]: unknown;
}

export interface FeatureValueRow {
    id: string;                       // DValue id or feature id
    featureName: string;
    featureKind: 'attribute' | 'reference';
    featureTypeId?: string;           // DClassifier id (for enum co-evolution)
    typeName?: string;                // DClassifier name (e.g. "Gender" for enum header)
    value: string;                    // display value
    /** For enum-typed attributes: allowed literal names */
    enumLiterals?: Array<{ name: string; value: number }>;
}

// === M1 Edge Data ===

export interface CompositionEdgeData {
    referenceName: string;            // composition reference name
    referenceId: string;              // DReference id in the metamodel
    sourceAnchor?: AnchorConfig;
    targetAnchor?: AnchorConfig;
    waypoints?: EdgeWaypoint[];
    [key: string]: unknown;
}

export interface InstanceReferenceEdgeData {
    referenceName: string;            // non-composition reference name
    referenceId: string;              // DReference id in the metamodel
    sourceAnchor?: AnchorConfig;
    targetAnchor?: AnchorConfig;
    waypoints?: EdgeWaypoint[];
    [key: string]: unknown;
}

export type M1EdgeData = CompositionEdgeData | InstanceReferenceEdgeData;

// === Helpers ===
export function createAttribute(name: string = 'newAttr', type: EDataType = 'EString'): MetaAttribute {
    return {
        id: `attr_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name,
        type,
        lowerBound: 0,
        upperBound: 1,
    };
}

export function createLiteral(name: string = 'NEW_VALUE', value: number): MetaLiteral {
    return {
        id: `lit_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name,
        value,
    };
}

export function createReference(name: string = 'newRef', targetClassId: string = ''): MetaReference {
    return {
        id: `ref_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name,
        kind: 'association',
        targetClassId,
        lowerBound: 0,
        upperBound: -1,
        containment: false,
    };
}

export function createOperation(name: string = 'newOperation'): MetaOperation {
    return {
        id: `op_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        name,
        returnType: 'void',
        parameters: [],
    };
}

export function formatCardinality(lower: number, upper: number): string {
    if (lower === 0 && upper === 1) return '0..1';
    if (lower === 0 && upper === -1) return '0..*';
    if (lower === 1 && upper === 1) return '1';
    if (lower === 1 && upper === -1) return '1..*';
    if (upper === -1) return `${lower}..*`;
    return `${lower}..${upper}`;
}

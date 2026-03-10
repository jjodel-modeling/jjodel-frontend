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

export const E_DATA_TYPES: EDataType[] = [
    'EString', 'EInt', 'EFloat', 'EBool', 'EDate', 'EChar', 'ELong', 'EDouble'
];

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

// === Node Data ===
export interface ClassNodeData {
    label: string;
    isAbstract: boolean;
    attributes: MetaAttribute[];
    references?: MetaReference[];
    operations?: MetaOperation[];
    jsxString?: string;
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
    value: string;                    // display value
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

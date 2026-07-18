/**
 * ViewpointIR — TypeScript types for the v1 subset interpreted by EditorV2.
 *
 * Source of truth: spec_2026-06-08_ir_schema_v1_1.md (project KB) restricted to
 * the vertex subset defined in the Fase 1 spike prompt (2026-07-17).
 *
 * The interpreter compiles these declarative structures once per view
 * (see irCompile.ts); nothing here is evaluated at render time directly.
 */

/**
 * Path expression over model element features.
 * Examples: "$name.value", "$tags.values[0]".
 * Forbidden constructs (rejected by the validator in irCompile):
 * optional chaining (?.), nullish coalescing (??), ternaries, function calls.
 */
export type PathExpr = string;

export type Literal =
    | { kind: 'string'; value: string }
    | { kind: 'number'; value: number }
    | { kind: 'boolean'; value: boolean };

export type Predicate =
    | { op: 'and' | 'or'; args: Predicate[] }
    | { op: 'not'; arg: Predicate }
    | { op: 'eq' | 'neq' | 'lt' | 'lte' | 'gt' | 'gte'; left: PathExpr | Literal; right: PathExpr | Literal }
    | { op: 'exists'; path: PathExpr }
    | { op: 'empty'; path: PathExpr }
    | { op: 'isKind'; class: string; path?: PathExpr }
    | { op: 'literal'; value: boolean };

export type Conditional<T> =
    | T
    | { when: Predicate; then: T; else?: T }
    | { rules: { when: Predicate; then: T }[]; default?: T };

export type ShapeForm = 'rect' | 'rounded' | 'ellipse';
export type LabelPosition = 'top' | 'center' | 'inside' | 'bottom';
export type BadgePosition = 'tl' | 'tr' | 'bl' | 'br';

/**
 * Text source of a label. 'intrinsic' reads element-level properties that are
 * not feature slots (spec v1.2: needed by default views — DObject.name is the
 * identity, not necessarily a $name feature):
 *   name          → element display name
 *   metaclassName → name of the instantiated metaclass
 *   qualifiedName → "name : MetaclassName" (UML instance notation)
 */
export type TextSource =
    | { from: 'path'; expr: PathExpr }
    | { from: 'literal'; text: string }
    | { from: 'intrinsic'; prop: 'name' | 'metaclassName' | 'qualifiedName' };

export interface LabelSpec {
    position: LabelPosition;
    source: TextSource;
    visible?: Conditional<boolean>;
}

export interface BadgeSpec {
    icon: Conditional<string>;
    position: BadgePosition;
    visible: Conditional<boolean>;
    tooltip?: string;
}

export type FieldSegment =
    | { kind: 'name' }
    | { kind: 'type' }
    | { kind: 'value' }
    | { kind: 'literal'; text: string };

export interface FieldCompartmentSpec {
    id: string;
    source: { from: 'attributes' } | { from: 'references' };
    rowFormat: { segments: FieldSegment[] };
    visible?: Conditional<boolean>;
    separator?: boolean;
}

export interface ShapeSpec {
    form: Conditional<ShapeForm>;
    fill?: Conditional<string>;
    border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' };
    labels?: LabelSpec[];
    badges?: BadgeSpec[];
}

export interface VertexViewIR {
    irVersion: string;               // "ir-1.0" | "ir-1.2"
    kind: 'vertex';
    /** Metamodel metaclass names, or '*' (default-view wildcard: minimum specificity). */
    metaclasses: string[] | '*';
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;             // spike: only exclusive views are rendered; decorative ones are ignored
    label?: string;
    shape: ShapeSpec;
    fieldCompartments?: FieldCompartmentSpec[];
}

/**
 * graphVertex view (spec v1.2 sez. 8): shape + containment.
 * Fase 2b renders containment as a hull (container drawn as a bounding box
 * around its children, absolute coordinates unchanged); true RF reparenting is
 * deferred because it changes the coordinate semantics of the canvas→JjOM
 * write-back (critical zone). Collapse semantics (lift-to-ancestor) are fixed
 * by the interpreter, not per-view.
 */
export interface GraphVertexViewIR {
    irVersion: string;
    kind: 'graphVertex';
    metaclasses: string[] | '*';
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;
    label?: string;
    shape: ShapeSpec;
    fieldCompartments?: FieldCompartmentSpec[];
    containment: {
        /** Which contained children render inside the hull; absent = all containment-reference children. */
        childFilter?: Predicate;
        collapsible?: boolean;
        collapsed?: {
            /** Shape override when collapsed (partial; merged over `shape`). */
            form?: Conditional<ShapeForm>;
            fill?: Conditional<string>;
            /** Badge shown when collapsed (defaults to a child-count badge). */
            badge?: BadgeSpec;
        };
    };
}

export type EdgeTermination =
    | 'none'
    | 'openArrow'
    | 'closedArrow'
    | 'hollowTriangle'
    | 'filledDiamond'
    | 'hollowDiamond';

/**
 * Edge view (spec v1.2 sez. 7). Two substrates:
 * - reference-as-edge: styles the RF edges derived from M1 references.
 *   `metaclasses` = metaclass of the SOURCE object; `reference` restricts to a
 *   named reference (absent = any reference of that source).
 * - object-as-edge: the metaclass instance IS the edge (Transition pattern).
 *   `metaclasses` = the edge-object metaclass; `edge.source`/`edge.target` are
 *   PathExprs on the object resolving to the endpoint objects; the object's
 *   node is hidden and a synthetic edge is drawn.
 */
export interface EdgeViewIR {
    irVersion: string;
    kind: 'edge';
    metaclasses: string[] | '*';
    reference?: string;
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;
    label?: string;
    edge: {
        source?: PathExpr;           // object-as-edge only
        target?: PathExpr;           // object-as-edge only
        line?: {
            color?: Conditional<string>;
            width?: Conditional<number>;
            style?: Conditional<'solid' | 'dashed' | 'dotted'>;
        };
        terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination };
        /** Routing hint; the flow substrate renders Manhattan (UnifiedEdge) — hint recorded in data. */
        routing?: 'orthogonal' | 'straight' | 'curved';
        labels?: {
            center?: TextSource;
            placement?: 'auto' | 'above' | 'below';
        };
    };
}

export type NodeViewIR = VertexViewIR | GraphVertexViewIR;
export type AnyViewIR = NodeViewIR | EdgeViewIR;

export interface CompiledEdgeView {
    viewId: string;
    ir: EdgeViewIR;
    priority: number;
    predicate: CompiledPredicate;
    dependencySet: string[];
    reference: string | null;
    isObjectAsEdge: boolean;
    sourceExpr: CompiledAccessor | null;   // object-as-edge
    targetExpr: CompiledAccessor | null;   // object-as-edge
    lineColor: CompiledConditional<string> | null;
    lineWidth: CompiledConditional<number> | null;
    lineStyle: CompiledConditional<'solid' | 'dashed' | 'dotted'> | null;
    terminations: { sourceEnd: EdgeTermination; targetEnd: EdgeTermination };
    routing: 'orthogonal' | 'straight' | 'curved' | null;
    labelText: CompiledAccessor | null;
    labelPlacement: 'auto' | 'above' | 'below';
}

/** Result of compiling a VertexViewIR / GraphVertexViewIR (see irCompile.ts). */
export interface CompiledView {
    viewId: string;
    ir: AnyViewIR;
    /** Discriminator copied from ir.kind. */
    kind: 'vertex' | 'graphVertex';
    /** graphVertex only: compiled containment info. */
    containment: CompiledContainment | null;
    /** Explicit priority (0 when absent) — first key of the resolution order. */
    priority: number;
    /** Compiled predicate; always callable (returns true when no predicate declared). */
    predicate: CompiledPredicate;
    /** Feature names read by every PathExpr in this view (self only; cross-object paths are a known v1 limit). */
    dependencySet: string[];
    form: CompiledConditional<ShapeForm>;
    fill: CompiledConditional<string> | null;
    border: { color: string; width: number; style: string } | null;
    labels: CompiledLabel[];
    badges: CompiledBadge[];
    fieldCompartments: CompiledFieldCompartment[];
}

import type { ReadCtx } from './irReadCtx';

export type CompiledAccessor = (ctx: ReadCtx, elementId: string) => unknown;
export type CompiledPredicate = (ctx: ReadCtx, elementId: string) => boolean;
export type CompiledConditional<T> = (ctx: ReadCtx, elementId: string) => T;

export interface CompiledLabel {
    position: LabelPosition;
    text: CompiledAccessor;
    visible: CompiledConditional<boolean>;
}

export interface CompiledBadge {
    icon: CompiledConditional<string>;
    position: BadgePosition;
    visible: CompiledConditional<boolean>;
    tooltip?: string;
}

export interface CompiledFieldCompartment {
    id: string;
    source: 'attributes' | 'references';
    segments: FieldSegment[];
    visible: CompiledConditional<boolean>;
    separator: boolean;
}

export interface CompiledContainment {
    childFilter: CompiledPredicate;      // always callable (true when absent)
    collapsible: boolean;
    collapsedForm: CompiledConditional<ShapeForm> | null;
    collapsedFill: CompiledConditional<string> | null;
    collapsedBadge: CompiledBadge | null;
}

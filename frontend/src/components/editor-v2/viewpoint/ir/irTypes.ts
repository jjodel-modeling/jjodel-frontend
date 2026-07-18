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

export interface VertexViewIR {
    irVersion: string;               // "ir-1.0" | "ir-1.2"
    kind: 'vertex';
    /** Metamodel metaclass names, or '*' (default-view wildcard: minimum specificity). */
    metaclasses: string[] | '*';
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;             // spike: only exclusive views are rendered; decorative ones are ignored
    label?: string;
    shape: {
        form: Conditional<ShapeForm>;
        fill?: Conditional<string>;
        border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' };
        labels?: LabelSpec[];
        badges?: BadgeSpec[];
    };
    fieldCompartments?: FieldCompartmentSpec[];
}

/** Result of compiling a VertexViewIR (see irCompile.ts). */
export interface CompiledView {
    viewId: string;
    ir: VertexViewIR;
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

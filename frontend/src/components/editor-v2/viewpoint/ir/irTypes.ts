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
    /**
     * Marking predicate (R-MK-1): true when the element carries the ephemeral
     * marking of the session — today the simulation run-state singleton, read
     * through ReadCtx.isMarked. Not a value: a marking is boolean by
     * construction, so it composes with and/or/not and slots into every
     * Conditional<T> of the schema, but never interpolates into a label.
     *
     * `path` (optional, R-MK-10) asks the marking of ANOTHER element: a single
     * reference hop from self, resolved with ReadCtx.getRef (draw semantics on
     * both backends). Multi-hop is rejected at compile in v1. A path that
     * dead-ends yields false, never a throw (R-MK-7).
     *
     * Reserved, NOT implemented (R-MK-3): a future `mark?: string` for named
     * markings, defaulting to today's single one. Declared so the shape can grow
     * without a break; saved IR has no VersionFixer (R-B9).
     */
    | { op: 'marked'; path?: PathExpr }
    | { op: 'literal'; value: boolean };

export type Conditional<T> =
    | T
    | { when: Predicate; then: T; else?: T }
    | { rules: { when: Predicate; then: T }[]; default?: T };

export type ShapeForm = 'rect' | 'rounded' | 'ellipse' | 'circle' | 'diamond'
    | 'stadium' | 'hexagon' | 'parallelogram' | 'cylinder';
export type LabelPosition = 'top' | 'center' | 'inside' | 'bottom';
export type BadgePosition = 'tl' | 'tr' | 'bl' | 'br';

/** Spacing preset of the symbol (header, compartments, inside label). Absent = 'normal'. */
export type PaddingToken = 'small' | 'normal' | 'large';

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

/** Font family tokens mapped to design-system CSS vars at render:
 *  'sans' -> var(--font-sans), 'mono' -> var(--font-mono). */
export type FontFamilyToken = 'sans' | 'mono';

/** Named weights mapped to numeric CSS weights at render:
 *  normal 400, medium 500, semibold 600, bold 700. */
export type FontWeightToken = 'normal' | 'medium' | 'semibold' | 'bold';

/**
 * Typographic style for a text surface (spec ir-1.3 addendum sez. 2). Every axis
 * is optional and Conditional; an absent axis inherits the surface's CSS default
 * (no override emitted). TS1 wires it on LabelSpec (vertex label) only.
 */
export interface TextStyle {
    fontFamily?: Conditional<FontFamilyToken>;
    fontSize?: Conditional<number>;              // px
    fontWeight?: Conditional<FontWeightToken>;
    fontStyle?: Conditional<'normal' | 'italic'>;
    color?: Conditional<string>;                 // same shape as ShapeSpec.fill
}

export interface LabelSpec {
    position: LabelPosition;
    source: TextSource;
    visible?: Conditional<boolean>;
    /** spec v1.2 sez. 5 — absent = default: intrinsic name labels are editable. */
    editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' };
    /** spec ir-1.3 addendum sez. 3.1 — typographic style (TS1). Absent = CSS default. */
    style?: TextStyle;
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
    | { kind: 'value'; editable?: boolean | { widget: 'text' | 'textarea' | 'select' | 'checkbox' | 'color' } }
    | { kind: 'literal'; text: string };

export interface FieldCompartmentSpec {
    id: string;
    /**
     * `attributes`/`references` = self's own slots (slot-mode rows).
     * `children` (Fase R2) = containment children of the self, each rendered by the
     * row view resolved for its concrete metaclass (dispatch-mode); `filter` is an
     * optional predicate over the child (absent = all containment children). For a
     * `children` source `rowFormat` is ignored (the row format comes from the child's
     * row view) but stays required by the contract.
     */
    source: { from: 'attributes' } | { from: 'references' } | { from: 'children'; filter?: Predicate };
    rowFormat: { segments: FieldSegment[] };
    visible?: Conditional<boolean>;
    separator?: boolean;
}

export interface ShapeSpec {
    form: Conditional<ShapeForm>;
    fill?: Conditional<string>;
    /** `double` (asse bordo, 2026-08-15): CSS-native sulle forme CSS (due linee da
     *  width >= 3), overdraw a due polygon sulle forme SVG (IRNodeContent). */
    border?: { color: string; width: number; style: 'solid' | 'dashed' | 'dotted' | 'double' };
    /**
     * Notation marker drawn inside the shape (asse marker, 2026-08-15): id from
     * markerRegistry.ts (gateway x/plus, timer clock, history H, ...). Open
     * vocabulary like BadgeSpec.icon — an id outside the registry renders
     * nothing. Conditional so the same view can switch marker per instance
     * (e.g. gateway kind by attribute). Absent = no marker. Additive optional
     * field: no irVersion bump, no VersionFixer migration (same precedent as
     * authoringMetaclassPins).
     */
    marker?: Conditional<string>;
    /**
     * Spacing preset applied to every padded surface of the symbol (top/bottom
     * label, inside label, compartments). Scalar like `border`, never Conditional.
     * Absent = 'normal'. Additive optional field: no irVersion bump, no migration
     * (same precedent as `marker`).
     */
    padding?: PaddingToken;
    /**
     * Typographic style of the whole symbol (ir-1.3, node-level cascade root).
     * Applied inline on `.ir-node-content` and inherited by every text surface
     * (labels, compartment rows, inline editors). A label's own `style` wins over
     * it (inline on the span). Absent = CSS defaults of irStyle.ts. Additive.
     */
    text?: TextStyle;
    labels?: LabelSpec[];
    badges?: BadgeSpec[];
}

/**
 * Which concrete class each name in `metaclasses` stands for: metaclass name ->
 * M2 class pointer (a DClass id).
 *
 * Born as authoring metadata: the authoring layer needs the identity to read the
 * right feature set when two metamodels of the same project declare a class of
 * the same name (discovery 2026-07-23 §9: two `USER_185` metamodels, each with
 * its own `State`). That identity used to come from `view.appliableToClasses`,
 * which the IR resolver ignores and the tab partition retired as a control.
 *
 * SINCE 2026-08-13 IT IS ALSO READ AT RESOLUTION. `metaclasses` stays a list of
 * names and the index stays keyed by name, but a pinned view matches only the
 * instances whose ancestry reaches that name through the pinned class
 * (`irResolveCore.pinAccepts`). Without it a view authored on one `Person`
 * applied to the instances of the other, which is the defect this closes.
 *
 * Optional and additive: an IR without it matches by name exactly as before, and
 * on a project with a single metamodel the pin can only agree with the name. No
 * irVersion bump, no migration, no backfill.
 */
export type AuthoringMetaclassPins = { [metaclassName: string]: string };

export interface VertexViewIR {
    irVersion: string;               // "ir-1.0" | "ir-1.2"
    kind: 'vertex';
    /** Metamodel metaclass names, or '*' (default-view wildcard: minimum specificity). */
    metaclasses: string[] | '*';
    /** Which class each name above stands for — see AuthoringMetaclassPins. */
    authoringMetaclassPins?: AuthoringMetaclassPins;
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;             // spike: only exclusive views are rendered; decorative ones are ignored
    label?: string;
    resizable?: boolean;             // v1: override esplicito del gate resize (undefined = default per forma)
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
    /** Which class each name above stands for — see AuthoringMetaclassPins. */
    authoringMetaclassPins?: AuthoringMetaclassPins;
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
 * Reserved endpoint token of an object-as-edge view (R-B13): resolves to the
 * containment parent of the edge-object instead of navigating a PathExpr.
 *
 * The endpoint type is conceptually `EndpointExpr = PathExpr | 'container'`; the
 * two fields below stay declared `PathExpr` here because the formal spec
 * amendment (v1.2 sez. 7) belongs to a later slice. `PathExpr` itself (spec v1.1
 * sez. 3.1) is NOT widened: the token is illegal in predicates, labels,
 * conditionals, TextSource and childFilter, and `$container.value` remains an
 * ordinary feature path — the two spellings do not collide.
 *
 * Persisted verbatim in the saved IR, which has no VersionFixer: the spelling
 * (lowercase, bare) is definitive (R-B9).
 */
export const CONTAINER_ENDPOINT = 'container' as const;

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
    /** Which class each name above stands for — see AuthoringMetaclassPins. */
    authoringMetaclassPins?: AuthoringMetaclassPins;
    reference?: string;
    predicate?: Predicate;
    priority?: number;
    exclusive?: boolean;
    label?: string;
    edge: {
        /** object-as-edge only. A PathExpr, or the reserved CONTAINER_ENDPOINT
         *  token — see its doc above for the `PathExpr | 'container'` union. */
        source?: PathExpr;
        /** object-as-edge only. Same vocabulary as `source`; both ends may carry
         *  the token (self-loop on the container, legitimate — R-B13). */
        target?: PathExpr;
        line?: {
            color?: Conditional<string>;
            width?: Conditional<number>;
            style?: Conditional<'solid' | 'dashed' | 'dotted'>;
        };
        terminations?: { sourceEnd?: EdgeTermination; targetEnd?: EdgeTermination };
        /** Path shape drawn by UnifiedEdge (E-route). Absent ≡ 'orthogonal' (Manhattan
         *  router); 'straight' and 'curved' reuse the same handles and only change the
         *  curve, which drops waypoints and crossing bridges for that edge. */
        routing?: 'orthogonal' | 'straight' | 'curved';
        labels?: {
            center?: TextSource;
            placement?: 'auto' | 'above' | 'below';
        };
        /** spec v1.2 sez. 7 (extended reading, 2026-07-19): default true; false =
         *  the whole layout override (waypoints AND side pins) stays session-only. */
        persistWaypoints?: boolean;
    };
}

/**
 * Row view (Fase R1, spec delta 2026-07-25): renders a containment child as an
 * inline text row inside a fieldCompartment. A row view NEVER renders on the canvas
 * (no shape/badge/resize) and a node view NEVER renders as a row — the two resolve in
 * separate buckets (rowByMetaclass/rowWildcard). `template` segments are TextSources
 * rooted on the row's own object. R1 lands schema + resolver context only; the
 * compartment dispatch (source `children`) and the renderer arrive in R2.
 */
export interface RowViewIR {
    irVersion: string;               // "ir-1.0" — no bump
    kind: 'row';
    metaclasses: string[] | '*';
    /** Which class each name above stands for — see AuthoringMetaclassPins. */
    authoringMetaclassPins?: AuthoringMetaclassPins;
    predicate?: Predicate;
    priority?: number;
    label?: string;
    template: TextSource[];
    visible?: Conditional<boolean>;
}

export type NodeViewIR = VertexViewIR | GraphVertexViewIR;
export type AnyViewIR = NodeViewIR | EdgeViewIR | RowViewIR;

/**
 * One compiled step of a PathExpr: the feature read and how its value is taken.
 * `take`: 'value' = single slot value, 'values' = the whole array, N = values[N].
 */
export interface CompiledPathStep {
    feature: string;
    take: 'value' | 'values' | number;
}

/**
 * A multi-hop PathExpr decomposed for cross-object dependency tracking
 * (spec v1.2 sez. 9). `hops` are the navigation steps (each resolves a pointer
 * to the next element); `terminal` is the last step (the feature actually read
 * on the final navigated object). Single-hop self paths produce NO
 * CompiledCrossPath — the self subscription already covers them.
 */
export interface CompiledCrossPath {
    hops: CompiledPathStep[];      // length >= 1: the navigation prefix
    terminal: CompiledPathStep;    // the feature read on the last hop's target
}

export interface CompiledEdgeView {
    viewId: string;
    ir: EdgeViewIR;
    priority: number;
    predicate: CompiledPredicate;
    dependencySet: string[];
    /**
     * Non-feature dependencies of this view: the CHANNELS it declares (R-MK-5).
     *
     * A channel is a global version counter the interpreter can subscribe to,
     * named in a closed vocabulary — `mark` (the marking singleton) at birth.
     * Kept SEPARATE from `dependencySet` on purpose: irCrossDeps concretizes
     * feature names into DValue ids, and a prefixed pseudo-feature (`@mark`)
     * would poison that concretization with a spurious `unresolved`.
     *
     * Optional and additive: absent (never []) when the view declares none, so
     * an ir without `marked` compiles exactly as before. The restrictive clause
     * of spec sez. 9 holds on this half too — an element must NOT re-render for a
     * channel it does not declare, which is why the consumers gate on it.
     */
    channels?: string[];
    /** Multi-hop paths read by this edge view (spec v1.2 sez. 9); [] when none. */
    crossPaths: CompiledCrossPath[];
    reference: string | null;
    isObjectAsEdge: boolean;
    sourceExpr: CompiledAccessor | null;   // object-as-edge
    targetExpr: CompiledAccessor | null;   // object-as-edge
    /** Endpoint declared as CONTAINER_ENDPOINT (R-B13): the matching *Expr stays
     *  null (the token never reaches the PathExpr parser) and the endpoint is
     *  resolved at synthesis time against the containment map, not by an accessor. */
    sourceIsContainer?: boolean;
    targetIsContainer?: boolean;
    lineColor: CompiledConditional<string> | null;
    lineWidth: CompiledConditional<number> | null;
    lineStyle: CompiledConditional<'solid' | 'dashed' | 'dotted'> | null;
    terminations: { sourceEnd: EdgeTermination; targetEnd: EdgeTermination };
    routing: 'orthogonal' | 'straight' | 'curved' | null;
    labelText: CompiledAccessor | null;
    labelPlacement: 'auto' | 'above' | 'below';
    /** persistWaypoints ?? true — gates persistence/hydration of layout overrides. */
    persistWaypoints: boolean;
}

/** Result of compiling a RowViewIR (see irCompile.ts). A row view is inline text:
 *  the compiled `template` is the per-segment accessor list; `visible` gates the row. */
export interface CompiledRowView {
    viewId: string;
    ir: RowViewIR;
    /** Discriminator copied from ir.kind. */
    kind: 'row';
    /** Explicit priority (0 when absent) — first key of the resolution order. */
    priority: number;
    /** Compiled predicate; always callable (returns true when no predicate declared). */
    predicate: CompiledPredicate;
    /** Feature names read by every PathExpr in this view (self only). */
    dependencySet: string[];
    /** Channels declared by this view — see CompiledEdgeView.channels (R-MK-5). */
    channels?: string[];
    /** Multi-hop paths read by this view (spec v1.2 sez. 9); [] when self-only. */
    crossPaths: CompiledCrossPath[];
    /** One accessor per template segment, rooted on the row's object. */
    template: CompiledAccessor[];
    visible: CompiledConditional<boolean>;
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
    /** Feature names read by every PathExpr in this view (flat; includes hop and terminal names). */
    dependencySet: string[];
    /** Channels declared by this view — see CompiledEdgeView.channels (R-MK-5). */
    channels?: string[];
    /** Multi-hop paths read by this view (spec v1.2 sez. 9); [] when the view reads only self. */
    crossPaths: CompiledCrossPath[];
    form: CompiledConditional<ShapeForm>;
    fill: CompiledConditional<string> | null;
    border: { color: string; width: number; style: string } | null;
    /** Compiled marker id ('' = none); null when the view declares no marker. */
    marker: CompiledConditional<string> | null;
    /** shape.padding ?? 'normal' */
    padding: PaddingToken;
    /** Compiled node-level text style; undefined when the view declares none. */
    text?: CompiledTextStyle;
    labels: CompiledLabel[];
    badges: CompiledBadge[];
    fieldCompartments: CompiledFieldCompartment[];
}

import type { ReadCtx } from './irReadCtx';

export type CompiledAccessor = (ctx: ReadCtx, elementId: string) => unknown;
export type CompiledPredicate = (ctx: ReadCtx, elementId: string) => boolean;
export type CompiledConditional<T> = (ctx: ReadCtx, elementId: string) => T;

/** Compiled TextStyle (ir-1.3): each authored axis resolved to a value function;
 *  an absent axis stays undefined (no override at render). The '' / 0 value a
 *  conditional returns when no branch matches means "no override" (mirrors the
 *  CompiledView.fill '' convention). */
export interface CompiledTextStyle {
    fontFamily?: CompiledConditional<FontFamilyToken | ''>;
    fontSize?: CompiledConditional<number>;
    fontWeight?: CompiledConditional<FontWeightToken | ''>;
    fontStyle?: CompiledConditional<'normal' | 'italic' | ''>;
    color?: CompiledConditional<string>;
}

export interface CompiledLabel {
    position: LabelPosition;
    text: CompiledAccessor;
    visible: CompiledConditional<boolean>;
    /** True when double-click edits the element name (intrinsic name/qualifiedName, editable !== false). */
    editsName: boolean;
    /** Compiled typographic style (ir-1.3 TS1); undefined when the label has no style. */
    style?: CompiledTextStyle;
}

export interface CompiledBadge {
    icon: CompiledConditional<string>;
    position: BadgePosition;
    visible: CompiledConditional<boolean>;
    tooltip?: string;
}

export interface CompiledFieldCompartment {
    id: string;
    source: 'attributes' | 'references' | 'children';
    segments: FieldSegment[];
    /** children source only: compiled child filter (absent = all containment children). */
    childFilter?: CompiledPredicate;
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

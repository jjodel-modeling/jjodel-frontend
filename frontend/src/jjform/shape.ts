/**
 * jjform/shape — the SHAPE half of the portable form engine's contract.
 *
 * This is the first file of `jjform/`, and the directory is opened for it and for
 * nothing else (slice 2b). The engine itself is not here yet: what is here is the
 * TYPE the engine will be written against, put in its final home now so the
 * adapter that produces it is written against the contract rather than against
 * whatever the manager happened to need.
 *
 * ── The invariant of this directory ────────────────────────────────────────────
 *
 * ZERO imports. Not "no React": no imports at all, the way `ir/irReadCtx.ts` and
 * `nodes/valueRenderer.ts` have none. `jjel/` is the in-repo precedent for a
 * language-sized module with no dependency on the joiner, redux or react
 * (measured: zero matches for any of the three), and this directory is meant to
 * grow into its sibling. A single import from `joiner/` here would drag monaco and
 * window-bound modules behind it and end the portability before it started.
 *
 * ── Relation to `form-engine-contract.md` ──────────────────────────────────────
 *
 * The names follow the contract's `metamodelShape` — `attrs`, `refs`, `children`,
 * `enums`, `lower`, `upper`, `containedIn`, `root` — so the JSON in that document
 * is a literal of these types rather than a paraphrase of them. Three deliberate
 * deviations, each because the contract's v0 shape loses something jjodel has:
 *
 *  1. `enums` maps a name to LITERALS WITH IDS, not to a plain `string[]`. The
 *     D layer stores an enum slot value as the literal's POINTER, while the XMI
 *     importer writes its NAME — the two writers disagree, and `useFormWidgets`
 *     already has to reconcile them on read. A `string[]` cannot express the id,
 *     so a renderer given one would have to guess which convention it is looking
 *     at. The pair costs nothing and removes the guess.
 *  2. Every shape carries the D-layer `id` of the element it describes, as an
 *     OPAQUE handle. The engine never interprets it; the adapter needs it to write
 *     back, and threading it separately would mean a second parallel structure.
 *  3. `derived` and `readOnly` are on every feature. The contract puts derived
 *     attributes outside v0, which is right for EDITING them — but a table has to
 *     know not to offer the cell, and that is a rendering decision, not an editing
 *     one. Carrying the flag costs one boolean; discovering it at write time costs
 *     a write that silently does nothing.
 *
 * ── What this file does NOT contain ────────────────────────────────────────────
 *
 * Values. `ShapeCtx` answers "what can an instance of X hold"; `ReadCtx`
 * (`editor-v2/viewpoint/ir/irReadCtx.ts`) answers "what does instance x hold". The
 * two ports stay separate because the shape is per-metaclass and cacheable while
 * the values change on every keystroke, and merging them would make the whole
 * metamodel a dependency of every value read.
 */

/** Attribute type vocabulary of the contract's v0, plus the honest bottom.
 *  `unknown` is NOT a failure: a metamodel may declare an attribute over a type
 *  the vocabulary does not name, and a renderer that receives `unknown` falls back
 *  to text — which is what the metamodel is asking for by not being more specific. */
export type AttrType = 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'unknown';

/** One literal of an enumeration. The NAME is what a person reads; the ID is what
 *  the D layer stores in a slot. Both are needed — see deviation 1 above. */
export interface EnumLiteralShape {
    id: string;
    name: string;
}

export interface EnumShape {
    /** Opaque handle of the DEnumerator. */
    id: string;
    name: string;
    literals: EnumLiteralShape[];
}

/** What every feature carries, attribute or reference alike. */
interface FeatureShapeBase {
    /** Feature name — the key of `FormSpec.widgets`, and how the rest of the
     *  codebase addresses features (syncUpdateFeatureValue, the conformance
     *  `metamodelElementName`). */
    key: string;
    /** Opaque handle of the DAttribute / DReference. */
    id: string;
    lower: number;
    /** -1 means unbounded. Kept raw rather than normalised so a multiplicity label
     *  can print `*` and the upper-bound gate can test it honestly. */
    upper: number;
    /** `upper !== 1` — the feature holds a list, whatever its bounds. */
    many: boolean;
    /** `lower >= 1` — the required marker. */
    required: boolean;
    derived: boolean;
    /** `derived || changeable === false`. A cell that is read-only shows its value
     *  and offers no editor. */
    readOnly: boolean;
}

export interface AttrShape extends FeatureShapeBase {
    type: AttrType;
    /** Name of the enumeration, when `type === 'enum'`. Keys into `MetamodelShape.enums`. */
    enum?: string;
    /** The type name exactly as the metamodel spells it (`EString`, `Color`,
     *  `StateKind`). `type` is the classification; this is the evidence for it, and
     *  it is what `valueRenderer` matches on. */
    typeName: string;
    /** The metamodel's ID flag — `DAttribute.isID`, the one `Info.tsx`'s advanced
     *  `ATTRIBUTE_ID_FLAG` writes and `ConformanceValidator` CHECK 11 validates
     *  uniqueness over. Carried for the same reason `derived` and `readOnly` are
     *  (deviation 3 of the header): whether a value is TYPED or GENERATED is a
     *  rendering decision, and discovering it at write time costs a control that
     *  lied. Optional so an external `AttrShape` literal need not supply it
     *  (rule 11); `shapeDraw.attrShape` always populates it. */
    isID?: boolean;
}

export interface RefShape extends FeatureShapeBase {
    /** Name of the target metaclass. Keys into `MetamodelShape.classes`. */
    of: string;
    /** Opaque handle of the target DClass. */
    ofId: string;
    /** True for a containment reference. The split between `refs` and `children`
     *  on `ClassShape` already encodes this; the flag is kept so a feature can be
     *  passed around on its own without losing which list it came from. */
    composition: boolean;
}

export interface ClassShape {
    key: string;
    /** Opaque handle of the DClass. */
    id: string;
    /** Instantiable at model level: concrete, not singleton, not the target of any
     *  containment reference. The contract's `root`. */
    root: boolean;
    abstract: boolean;
    singleton: boolean;
    /** Names of the metaclasses that can contain an instance of this one. A LIST:
     *  a metaclass may be contained in more than one context. Empty for a root. */
    containedIn: string[];
    attrs: AttrShape[];
    /** Non-containment references — «reference selects» (Turno 10). */
    refs: RefShape[];
    /** Containment references — «containment creates» (Turno 10). */
    children: RefShape[];
}

/** The serializable whole: what an adapter produces and an engine consumes. */
export interface MetamodelShape {
    /** Keyed by enum NAME, as `AttrShape.enum` refers to it. */
    enums: Record<string, EnumShape>;
    /** Keyed by metaclass NAME, as `RefShape.of` and `containedIn` refer to them.
     *  Homonymous classes in different packages collide here; that is the
     *  contract's own convention (its `refs[].of` is a name) and the ids on each
     *  shape are what tells them apart when it matters. */
    classes: Record<string, ClassShape>;
}

/**
 * One incoming reference to an instance: «instance X, through feature f».
 *
 * This is the answer the delete preflight of 12d is built on — «cfg1 is referenced
 * by 2 Sensors» — and it is why the walk exists at all. Reported per POINTER, not
 * per instance: an instance that points at the same target through two features,
 * or twice through one multivalued feature, produces two entries, because the
 * dialogue that offers a reassignment has to reassign each of them.
 */
export interface IncomingRef {
    /** The DObject doing the pointing. */
    instanceId: string;
    instanceName: string;
    /** Name of the metaclass of the pointing instance — what «2 Sensors» counts. */
    instanceClass: string;
    /** The feature the pointer sits in. */
    featureKey: string;
    featureId: string;
    /** True when the pointer is a containment link, i.e. the source OWNS the
     *  target. Callers that mean "who would dangle if this were deleted" must
     *  filter these out: an owner is not a referrer, and counting it would put a
     *  1 on every contained instance in the model. */
    composition: boolean;
    /** Position within the slot's `values`. Slots have holes (`formWrite`
     *  clearSlotValue leaves one rather than shortening the array), so the index
     *  is not the ordinal of the entry among the filled ones. */
    index: number;
}

/**
 * The shape port.
 *
 * Narrow on purpose, like `ReadCtx`: three questions, no traversal helpers. An
 * engine that needs more asks for more here, where the adapter can answer it once,
 * rather than reaching around the port into the host's data.
 */
export interface ShapeCtx {
    /** The whole metamodel, serializable. Cacheable: it changes only when the M2 does. */
    shape(): MetamodelShape;
    /** Metaclass name of an instance; null when the instance or its type is unresolvable. */
    classOf(instanceId: string): string | null;
    /** Every pointer aimed at this instance, containment links included and
     *  flagged. `[]` for an unknown instance — absence and unreferenced are the
     *  same answer to this question. */
    referencedBy(instanceId: string): IncomingRef[];
}

// ── Derived helpers ─────────────────────────────────────────────────────────
// Pure functions over the types above. They live here rather than in the adapter
// because they are consequences of the SHAPE, identical for every host, and a
// second host that recomputed them could disagree with the first.

/**
 * Whether an attribute's value is GENERATED by the engine rather than typed by a
 * person — the auto-increment gate of AUTO1.
 *
 * Two conditions, and the second is not decoration. `isID` alone would lock an
 * `EString` identifier the engine has no way to generate, leaving it unwritable
 * for ever; the integer type is what makes «the previous maximum plus one» a
 * meaning rather than a guess. So the gate that hides the control, the gate that
 * seeds the value and the gate that renders the field read-only are ONE
 * predicate, read from one place: three copies of a two-clause condition is three
 * chances for them to disagree.
 *
 * Structural, not per-instance: the argument is the shape of a feature, so the
 * D-graph adapter (`shapeDraw`), the create adapter and the form derivation can
 * all ask it of whatever they happen to hold.
 */
export function isAutoIdAttr(a: { isID?: boolean; typeName?: string } | null | undefined): boolean {
    return a?.isID === true && a?.typeName === 'EInt';
}

/** Multiplicity as a label prints it: `1..1`, `0..5`, `0..*`. */
export function multiplicity(f: { lower: number; upper: number }): string {
    return `${f.lower}..${f.upper === -1 ? '*' : f.upper}`;
}

/** Attrs then refs, which is the column order of a collection table: what an
 *  instance IS before what it points at (Turno 11a). Children are excluded —
 *  a containment list is not a column, it is a sub-form. */
export function tableFeatures(cls: ClassShape): Array<AttrShape | RefShape> {
    return [...cls.attrs, ...cls.refs];
}

/** The metaclasses a collection view offers, name-sorted.
 *  `rootOnly` is the Turno 11a reading («Collections = root-instantiable
 *  metaclasses. Port lives inside Sensor, not here») and is NOT the default: the
 *  manager ratified under Q8 catalogues every metaclass, and a contained one with
 *  no collection of its own would simply be unreachable. */
export function collectionClasses(shape: MetamodelShape, rootOnly = false): ClassShape[] {
    return Object.values(shape.classes)
        .filter(c => (rootOnly ? c.root : true))
        .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

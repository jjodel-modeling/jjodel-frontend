/**
 * jjform/create — the CREATE half of the portable form engine (slice 2c).
 *
 * The `create(cls, ownerId|null, childKey|null, draft)` event of
 * `form-engine-contract.md` §5, as far as it can be computed without a host: what
 * a fresh draft holds, which metaclasses offer a New, which child slots offer an
 * Add, what a draft's fields look like, and why a draft is not yet committable.
 *
 * ── The invariant of this directory, restated ─────────────────────────────────
 *
 * ZERO imports beyond the sibling TYPES of `shape.ts`. Same rule as `shape.ts`,
 * same reason: one import from `joiner/` would drag monaco and `window` behind it
 * and end the portability. Everything here is a function of the shape plus plain
 * records; the D-graph lives on the other side of the adapter.
 *
 * ── The two routes are ONE event ──────────────────────────────────────────────
 *
 * Turno 10 («containment crea / reference seleziona») gives create two entrances:
 * the catalogue offers `New <Metaclass>` on the rootable metaclasses, and each
 * child slot of a form offers `Add`. They differ only in what `ownerId` and
 * `childKey` hold — null/null for a root, owner/key for a contained instance —
 * and NOTHING here branches on which gesture produced them. That is deliberate
 * and it is the Q8 warning honoured in code: where the rootable create is offered
 * from is being re-decided in 10b, so the provenance must not be wired into the
 * engine.
 *
 * ── Transactional (12a) ───────────────────────────────────────────────────────
 *
 * A `Draft` is a plain value. Nothing in this module writes, and nothing outside
 * knows the draft exists until a host applies it. `validateDraft` is what gates
 * the commit, and it reports PER FIELD (`error` non-null, `valid: false` in the
 * contract's `formModel`) rather than as one banner: an error that does not say
 * which control it is about makes the user hunt for it.
 *
 * ── Two deliberate readings of the simulation ─────────────────────────────────
 *
 *  1. An enum field opens on its FIRST literal, required or not. That is what
 *     `CRUD Manager Simulation.dc.html` does (`openModal`: `values[a.key] =
 *     a.type === 'enum' ? this.META.enums[a.enum][0] : ''`) and the design is the
 *     authority on states. The alternative — open empty and let a required enum
 *     error until picked — is defensible but is a different design, not this one.
 *  2. `lower >= 1` is validated as «at least one value», not as «at least `lower`
 *     values». A draft offers one control per feature, so a `2..*` could never be
 *     satisfied and the commit would be blocked forever. The multiplicity is
 *     printed in the message so the shortfall is visible rather than silent; the
 *     remaining values are added in the edit form, where the list widgets live.
 */

import type { AttrShape, ClassShape, MetamodelShape, RefShape } from './shape';
import { multiplicity } from './shape';

/** The transactional draft. Serializable, and not yet anywhere. */
export interface Draft {
    /** Metaclass NAME — keys into `MetamodelShape.classes`. */
    cls: string;
    /** The instance that will own this one, or null for a root. */
    ownerId: string | null;
    /** The owner's containment feature this instance goes into, or null for a root. */
    childKey: string | null;
    /** Attribute values, keyed by feature name. Held as strings whatever the type:
     *  a draft is what a control produced, and the conversion to a typed value is
     *  the host's, at the moment it writes. */
    values: Record<string, string>;
    /** Reference targets, keyed by feature name. `''` means «not chosen». */
    refs: Record<string, string>;
}

/** One option of a select — an enum literal or a reference candidate. */
export interface DraftOption {
    id: string;
    label: string;
}

/** How a draft field renders. Mirrors the contract's `formModel.fields[].kind`. */
export type DraftFieldKind = 'text' | 'number' | 'boolean' | 'enum' | 'date' | 'ref';

/** One field of the draft, already validated — the contract's field descriptor. */
export interface DraftField {
    key: string;
    kind: DraftFieldKind;
    /** `EString`, `StateKind`, or the target metaclass name for a reference. */
    typeName: string;
    /** `1..1`, `0..*` — printed beside the label, as the simulation prints it. */
    multiplicity: string;
    required: boolean;
    /** Current draft value. `''` when empty; a reference holds the target id. */
    value: string;
    /** Enum literals or reference candidates; empty for a plain input. */
    options: DraftOption[];
    /** The message the field shows, or null. Non-null is what makes `valid` false. */
    error: string | null;
}

/** The whole draft as a UI renders it. The contract's `formModel`, for a create. */
export interface DraftModel {
    cls: string;
    /** `New State` — the modal's title. */
    title: string;
    fields: DraftField[];
    valid: boolean;
}

/** Everything the host resolves for the engine: the candidates of each reference,
 *  and the names already taken among the siblings the draft will join. */
export interface DraftContext {
    /** Reference candidates per feature key. A key absent means «no candidate», not
     *  «unknown»: an empty select is the honest rendering of a model with nothing
     *  to point at. */
    candidates?: Record<string, DraftOption[]>;
    /** Names of the instances of the same `cls` under the same `owner`. The
     *  uniqueness rule of 12a is scoped exactly there. */
    siblingNames?: string[];
}

// ── What a draft may edit ──────────────────────────────────────────────────────

/** The attributes a draft offers. Derived and read-only ones are EXCLUDED: a
 *  control over a value the write path will refuse is a control that lies. Their
 *  existence is still in the shape, so the table keeps showing the column. */
export function draftableAttrs(cls: ClassShape): AttrShape[] {
    return cls.attrs.filter(a => !a.derived && !a.readOnly);
}

/** The references a draft offers. Same exclusion, same reason. Children are NOT
 *  here: «containment creates» — a child is added from the created instance's own
 *  form, one Add at a time, not picked while its parent is still a draft. */
export function draftableRefs(cls: ClassShape): RefShape[] {
    return cls.refs.filter(r => !r.derived && !r.readOnly);
}

// ── Whether create is offered at all ───────────────────────────────────────────

/**
 * Why `New <Metaclass>` is NOT offered in the catalogue, or null when it is.
 *
 * The button is ABSENT when this returns a string — not present-and-disabled — and
 * the reason goes at the foot of the list. That is the idiom Rule 1 of Livello 2
 * already uses for the same situation, and it is the one the abstract row in this
 * very list uses: a control that cannot work is noise, a sentence saying why is
 * the metamodel speaking.
 *
 * `instanceCount` is only read for a singleton, whose whole rule is «at most one».
 */
export function newInstanceReason(cls: ClassShape, instanceCount = 0): string | null {
    if (!cls) return 'Unknown metaclass';
    if (cls.abstract) return 'Abstract metaclass — it has no direct instances';
    if (cls.singleton && instanceCount > 0) {
        return `Singleton — the one ${cls.key} of this model already exists`;
    }
    if (!cls.root) {
        const where = cls.containedIn.length ? cls.containedIn.join(', ') : 'its container';
        return `Created from its container's form (${where})`;
    }
    return null;
}

/**
 * Why `Add` is NOT offered on a child slot, or null when it is.
 *
 * The upper bound is the whole rule: `upper === -1` is unbounded and never full,
 * anything else is full once the slot holds that many. `count` is the number of
 * values the slot ACTUALLY holds, holes excluded — the caller counts them, because
 * `formWrite.clearSlotValue` leaves holes and a raw `values.length` would report a
 * slot as full that is not.
 */
export function addChildReason(child: RefShape, count: number): string | null {
    if (!child) return 'Unknown feature';
    if (child.readOnly) return `«${child.key}» is read-only`;
    if (child.upper !== -1 && count >= child.upper) {
        return `«${child.key}» is full — cardinality ${multiplicity(child)}`;
    }
    return null;
}

// ── The draft itself ───────────────────────────────────────────────────────────

/**
 * A fresh draft of `cls`, contained by `ownerId`/`childKey` or root when both null.
 *
 * Every draftable feature gets a key, even an empty one: a draft with a missing key
 * and a draft with an empty one would validate the same but render differently, and
 * the host would have to guess which it holds.
 */
export function newDraft(
    shape: MetamodelShape,
    cls: string,
    ownerId: string | null = null,
    childKey: string | null = null,
): Draft {
    const draft: Draft = { cls, ownerId, childKey, values: {}, refs: {} };
    const c = shape?.classes?.[cls];
    if (!c) return draft;

    for (const a of draftableAttrs(c)) {
        // Reading 1 of the header: an enum opens on its first literal.
        const literals = a.type === 'enum' && a.enum ? shape.enums[a.enum]?.literals ?? [] : [];
        draft.values[a.key] = literals.length > 0 ? literals[0].id : '';
    }
    for (const r of draftableRefs(c)) draft.refs[r.key] = '';
    return draft;
}

/** A draft with one attribute changed. Returns a new value; nothing is mutated. */
export function setDraftValue(draft: Draft, key: string, value: string): Draft {
    return { ...draft, values: { ...draft.values, [key]: value } };
}

/** A draft with one reference changed. Returns a new value; nothing is mutated. */
export function setDraftRef(draft: Draft, key: string, targetId: string): Draft {
    return { ...draft, refs: { ...draft.refs, [key]: targetId } };
}

// ── Validation (12a) ───────────────────────────────────────────────────────────

/**
 * Every reason this draft cannot be committed, keyed by feature name.
 *
 * Two rules, both ratified:
 *
 *  - REQUIRED BY CARDINALITY. `lower >= 1` needs a value. The message names the
 *    multiplicity, so a `2..*` that this draft can only half-satisfy says so
 *    instead of failing mutely (reading 2 of the header).
 *  - UNIQUE NAME AMONG SIBLINGS. Same `cls`, same `owner` — the scope the contract
 *    fixes. Only the `name` feature: it is the one the rest of jjodel resolves an
 *    instance by (`findInstanceByName`, the identity slot of §3.12), and making
 *    every attribute unique would be a constraint the metamodel never asked for.
 *
 * An empty name is NOT a duplicate however many unnamed siblings there are: the
 * absence of a name is not a name that collides.
 */
export function validateDraft(
    shape: MetamodelShape,
    draft: Draft,
    ctx: DraftContext = {},
): Record<string, string> {
    const errors: Record<string, string> = {};
    const cls = shape?.classes?.[draft?.cls];
    if (!cls) return errors;

    const siblings = (ctx.siblingNames ?? []).map(n => (n ?? '').trim()).filter(Boolean);

    for (const a of draftableAttrs(cls)) {
        const v = (draft.values[a.key] ?? '').trim();
        if (a.required && !v) {
            errors[a.key] = `Required by cardinality ${multiplicity(a)}`;
            continue;
        }
        if (a.key === 'name' && v && siblings.includes(v)) {
            errors[a.key] = `A ${cls.key} named «${v}» already exists here`;
        }
    }

    for (const r of draftableRefs(cls)) {
        if (r.required && !(draft.refs[r.key] ?? '').trim()) {
            errors[r.key] = `Required by cardinality ${multiplicity(r)}`;
        }
    }

    return errors;
}

// ── The renderable model ───────────────────────────────────────────────────────

/** The field kind of an attribute. `unknown` falls back to text, on purpose:
 *  a metamodel that declares a type this vocabulary does not name is asking for
 *  the honest default, not for a guess. */
function kindOf(a: AttrShape): DraftFieldKind {
    switch (a.type) {
        case 'number':
        case 'boolean':
        case 'enum':
        case 'date':
            return a.type;
        default:
            return 'text';
    }
}

/**
 * The draft as a UI renders it: attributes then references, the same order the
 * collection table uses (Turno 11a — what an instance IS before what it points at).
 */
export function draftModel(
    shape: MetamodelShape,
    draft: Draft,
    ctx: DraftContext = {},
): DraftModel {
    const cls = shape?.classes?.[draft?.cls];
    const title = `New ${draft?.cls ?? ''}`;
    if (!cls) return { cls: draft?.cls ?? '', title, fields: [], valid: false };

    const errors = validateDraft(shape, draft, ctx);
    const fields: DraftField[] = [];

    for (const a of draftableAttrs(cls)) {
        const literals = a.type === 'enum' && a.enum ? shape.enums[a.enum]?.literals ?? [] : [];
        fields.push({
            key: a.key,
            kind: kindOf(a),
            typeName: a.typeName,
            multiplicity: multiplicity(a),
            required: a.required,
            value: draft.values[a.key] ?? '',
            options: literals.map(l => ({ id: l.id, label: l.name })),
            error: errors[a.key] ?? null,
        });
    }

    for (const r of draftableRefs(cls)) {
        fields.push({
            key: r.key,
            kind: 'ref',
            typeName: r.of,
            multiplicity: multiplicity(r),
            required: r.required,
            value: draft.refs[r.key] ?? '',
            options: ctx.candidates?.[r.key] ?? [],
            error: errors[r.key] ?? null,
        });
    }

    return { cls: cls.key, title, fields, valid: Object.keys(errors).length === 0 };
}

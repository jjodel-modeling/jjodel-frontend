/**
 * jjform/multi — the MULTI-SELECTION half of the engine (slice 12b).
 *
 * Pure, zero imports, for the reason `shape.ts` states in its header: one import
 * from `joiner/` would drag monaco and window-bound modules behind it and end the
 * portability before it started. Everything here is a function of plain data.
 *
 * ── The specification, and where it actually lives ────────────────────────────
 *
 * `docs/design/design_handoff_instance_node/Instance Node Proposal.dc.html`,
 * Turno 12, panel `12b`. NOT `CRUD Manager Simulation.dc.html`, which the slice
 * prompt cited: measured, that file contains zero occurrences of `mixed`,
 * `multi`, `12b` or `12c`, while the positive control on the same file with the
 * same command found `openModal` six times and `META` nine. The design says, in
 * full:
 *
 *   «3 Sensors selected · Tint: Mixed (Green, Red, Blue) · Threshold: 50, will
 *    apply to 3 · Active: 2 on · 1 off · Name and children are hidden: identity
 *    is never bulk-edited»
 *   «Valori misti dichiarati, mai mediati: il campo mostra "Mixed" finche' non lo
 *    tocchi, e la scrittura vale per tutta la selezione. Il toggle ha uno stato
 *    terzo. Nome e containment spariscono: l'identita' non si edita in blocco.»
 *
 * Four rules come out of that, and each is implemented below rather than
 * paraphrased:
 *
 *  1. MIXED IS DECLARED, NEVER AVERAGED. A field whose instances disagree reports
 *     `state: 'mixed'` and carries the DISTINCT values, so the UI can print them
 *     («Mixed (Green, Red, Blue)») instead of showing the first one and lying
 *     about the rest. `value` is null in that state — there is no single value,
 *     and offering one would be the averaging the design forbids.
 *  2. UNTOUCHED MEANS UNWRITTEN. `bulkPlan` emits events for the keys the user
 *     actually touched, and for nothing else. A field left alone keeps whatever
 *     each instance had, mixed or not. This is why `touched` is an explicit map
 *     and not "every field whose value differs from the model".
 *  3. IDENTITY IS NEVER BULK-EDITED, and neither are children. Both are EXCLUDED
 *     with a stated reason rather than disabled: the design says «hidden», and a
 *     greyed control invites the gesture it then refuses. `bulkPlan` refuses them
 *     a second time, at the event boundary, because a UI is not a guarantee.
 *  4. A BOOLEAN HAS A THIRD STATE. Not «false because they disagree» — `counts`
 *     carries how many are on and how many off, which is what «2 on · 1 off»
 *     prints.
 */

import type { AttrShape, ClassShape, RefShape } from './shape';

/** A feature that can be bulk-edited, as the model reports it. */
export type MultiFieldKind = 'string' | 'number' | 'boolean' | 'enum' | 'date' | 'unknown' | 'ref';

/** Whether the selection agrees on this field. */
export type MultiFieldState = 'uniform' | 'mixed';

/** One bulk-editable field across the whole selection. */
export interface MultiField {
    key: string;
    /** Opaque handle of the DAttribute / DReference, for the adapter to write by. */
    id: string;
    kind: MultiFieldKind;
    /** The type name as the metamodel spells it — the evidence `valueRenderer`
     *  matches on. Empty for a reference, which carries `of` instead. */
    typeName: string;
    /** Target metaclass name, for `kind === 'ref'`. */
    of?: string;
    /** Enumeration name, for `kind === 'enum'`. */
    enum?: string;
    required: boolean;
    readOnly: boolean;
    state: MultiFieldState;
    /** The agreed value when `state === 'uniform'`; null when mixed. Never a
     *  representative of a disagreement — see rule 1. */
    value: unknown;
    /** The distinct values, in first-encounter order. One entry when uniform, two
     *  or more when mixed. Empty only when every instance is empty. */
    distinct: unknown[];
    /** How many instances hold each truth value. Present for `kind === 'boolean'`
     *  only: it is what «2 on · 1 off» prints. */
    counts?: { on: number; off: number; unset: number };
}

/** A feature deliberately kept out of the multi-form, and why. */
export interface MultiExclusion {
    key: string;
    /** Shown next to the form, in the design's own words. */
    reason: string;
}

/** What a multi-selection form renders. */
export interface MultiModel {
    cls: string;
    /** The selected instances, in the order the caller gave them. */
    ids: string[];
    count: number;
    /** «3 Sensors selected» — the design's header. */
    title: string;
    fields: MultiField[];
    excluded: MultiExclusion[];
}

/** The per-instance values the model is computed from. Deliberately the same
 *  shape as `instanceData.instances` in the contract: `values` for attributes,
 *  `refs` for references. */
export interface MultiInstance {
    id: string;
    values: Record<string, unknown>;
    refs: Record<string, unknown>;
}

/** The single event a bulk edit produces, one per (instance, key). It is the
 *  contract's `setValue(id, key, value)` — 12b introduces no new event, which is
 *  the point: a bulk edit is N ordinary edits that were decided together. */
export interface BulkSetValue {
    id: string;
    key: string;
    /** Opaque handle of the feature, so the adapter does not look it up again. */
    featureId: string;
    value: unknown;
    /** True when the value is a pointer (reference target, enum literal) rather
     *  than a primitive. `setValueAtPosition` needs it to reconcile the old
     *  target, and the engine knows it from the shape while the adapter would
     *  have to re-derive it. */
    isPtr: boolean;
}

/** The identity feature. Single-sourced here so the exclusion rule and the write
 *  guard cannot drift apart. `name` is the feature the rest of jjodel resolves an
 *  instance by (contract §5.1, uniqueness), and §3.12 of CLAUDE.md binds it to
 *  `DObject.name` besides. */
export const IDENTITY_KEY = 'name';

const REASON_IDENTITY = 'Name is hidden: identity is never bulk-edited';
const REASON_CHILDREN = 'Children are hidden: containment is never bulk-edited';
const REASON_READONLY = 'Read-only: the write path would refuse it';

/**
 * Why a feature is kept out of the multi-form, or null when it may stay.
 *
 * Exported because the guard is used twice on purpose — once to build the model
 * and once at the event boundary in `bulkPlan`. A UI that hides a control is a
 * convention; a plan that refuses to emit the event is a guarantee.
 */
export function bulkExclusionReason(
    feature: Pick<AttrShape, 'key' | 'readOnly'>,
    opts: { isChild?: boolean } = {},
): string | null {
    if (opts.isChild) return REASON_CHILDREN;
    if (feature.key === IDENTITY_KEY) return REASON_IDENTITY;
    if (feature.readOnly) return REASON_READONLY;
    return null;
}

/** Distinct values in first-encounter order. `null` and `undefined` collapse into
 *  a single "unset", because an instance that never had a value and one whose
 *  value was cleared are the same thing to a form. */
function distinctOf(values: unknown[]): unknown[] {
    const out: unknown[] = [];
    let sawUnset = false;
    for (const v of values) {
        if (v == null || v === '') {
            if (!sawUnset) { sawUnset = true; out.push(null); }
            continue;
        }
        if (!out.some(x => x === v)) out.push(v);
    }
    return out;
}

/** The plural the header prints. Not a general pluraliser: it appends an `s`,
 *  which is what the design's own «3 Sensors selected» does. */
function pluralise(word: string, n: number): string {
    return n === 1 ? word : `${word}s`;
}

/**
 * The multi-selection form of `instances`, all of metaclass `cls`.
 *
 * The caller guarantees the instances share the metaclass — that is the selection
 * rule of the design («3 Sensors selected»), not something this function can
 * check without a shape per instance. What it does check is that a field is
 * bulk-editable at all.
 *
 * Children are read off `cls.children` and excluded WHOLESALE, one exclusion per
 * child slot, so the reason is attached to the thing it removed rather than
 * printed once at the bottom.
 */
export function multiModel(cls: ClassShape, instances: MultiInstance[]): MultiModel {
    const ids = instances.map(i => i.id);
    const fields: MultiField[] = [];
    const excluded: MultiExclusion[] = [];

    for (const a of cls.attrs) {
        const reason = bulkExclusionReason(a);
        if (reason) { excluded.push({ key: a.key, reason }); continue; }
        fields.push(attrField(a, instances));
    }
    for (const r of cls.refs) {
        const reason = bulkExclusionReason(r);
        if (reason) { excluded.push({ key: r.key, reason }); continue; }
        fields.push(refField(r, instances));
    }
    for (const c of cls.children) {
        excluded.push({ key: c.key, reason: REASON_CHILDREN });
    }

    return {
        cls: cls.key,
        ids,
        count: ids.length,
        title: `${ids.length} ${pluralise(cls.key, ids.length)} selected`,
        fields,
        excluded,
    };
}

function attrField(a: AttrShape, instances: MultiInstance[]): MultiField {
    const raw = instances.map(i => i.values?.[a.key]);
    const distinct = distinctOf(raw);
    const state: MultiFieldState = distinct.length > 1 ? 'mixed' : 'uniform';
    const field: MultiField = {
        key: a.key,
        id: a.id,
        kind: a.type,
        typeName: a.typeName,
        enum: a.enum,
        required: a.required,
        readOnly: a.readOnly,
        state,
        value: state === 'uniform' ? (distinct.length === 1 ? distinct[0] : null) : null,
        distinct,
    };
    if (a.type === 'boolean') {
        let on = 0, off = 0, unset = 0;
        for (const v of raw) {
            if (v == null || v === '') unset++;
            else if (v === true || v === 'true') on++;
            else off++;
        }
        field.counts = { on, off, unset };
    }
    return field;
}

function refField(r: RefShape, instances: MultiInstance[]): MultiField {
    const raw = instances.map(i => i.refs?.[r.key]);
    const distinct = distinctOf(raw);
    const state: MultiFieldState = distinct.length > 1 ? 'mixed' : 'uniform';
    return {
        key: r.key,
        id: r.id,
        kind: 'ref',
        typeName: '',
        of: r.of,
        required: r.required,
        readOnly: r.readOnly,
        state,
        value: state === 'uniform' ? (distinct.length === 1 ? distinct[0] : null) : null,
        distinct,
    };
}

/**
 * The events a bulk edit emits: one `setValue` per (selected instance, touched key).
 *
 * `touched` holds ONLY the keys the user actually wrote — rule 2. A key absent
 * from it produces no event at all, which is what leaves an untouched mixed field
 * mixed instead of flattening it to whatever the form happened to display.
 *
 * The exclusion guard runs again here, against the model's own `excluded` list.
 * That is not belt-and-braces: `touched` comes from a UI, and a plan that trusts
 * a UI to have hidden the right controls is a plan that has no rule of its own.
 * A touched key that is not a field of the model is dropped for the same reason.
 *
 * Order: instance-major, in the caller's selection order, then the model's field
 * order. Deterministic so a test can assert on the sequence and so a caller that
 * needs to space the writes out knows what it is spacing.
 */
export function bulkPlan(model: MultiModel, touched: Record<string, unknown>): BulkSetValue[] {
    const excludedKeys = new Set(model.excluded.map(e => e.key));
    const out: BulkSetValue[] = [];

    for (const id of model.ids) {
        for (const field of model.fields) {
            if (!(field.key in touched)) continue;
            if (excludedKeys.has(field.key)) continue;   // never, whatever the UI sent
            if (field.readOnly) continue;
            out.push({
                id,
                key: field.key,
                featureId: field.id,
                value: touched[field.key],
                isPtr: field.kind === 'ref' || field.kind === 'enum',
            });
        }
    }
    // A key the UI sent that the model does not offer never enters the loop above,
    // so it is dropped by construction rather than by a second check.
    return out;
}

/**
 * How many instances a write to `key` will touch — the «will apply to 3» label.
 *
 * A function rather than a field on `MultiField` because it is a property of the
 * SELECTION, not of the field, and duplicating it per field would let the two
 * drift when a selection changes under an open form.
 */
export function willApplyTo(model: MultiModel): number {
    return model.count;
}

// ── Multi-delete (12b) ───────────────────────────────────────────────────────
//
// «Delete multipla: un preflight solo, unione dei referrer, con i verdetti per
// l'insieme.» One dialogue for the set, not N dialogues in a row: the user made
// one decision and must be shown its whole cost once.
//
// The union is not a concatenation, and the two rules that make it not one are
// both 12d's, applied to a wider dying set:
//
//  - a referrer that is ITSELF dying is not a referrer. 12d already discards the
//    pointers held by the target's own descendants («riassegnarli sarebbe
//    modificare un fantasma»); with N targets the same sentence covers pointers
//    held by any other member of the set, and by any of their descendants.
//  - a reassign candidate must be a candidate for EVERY member, and must not be
//    dying itself. The intersection is the honest rule: the dialogue offers one
//    target for the whole set, so a candidate that does not fit one member does
//    not fit the set.

/** The subset of a `DeletePreflight` the union reads. Structural rather than
 *  imported so `multi.ts` keeps no dependency on `delete.ts` — the two are
 *  siblings in the engine, and a type import would be the first edge between
 *  them. */
export interface UnionPreflightInput {
    id: string;
    name: string;
    cls: string;
    blocked: string | null;
    referencedBy: Array<{ instanceId: string; pointsAt: string; [k: string]: unknown }>;
    descendants: Array<{ id: string; [k: string]: unknown }>;
    reassignCandidates: Array<{ id: string; label: string }>;
}

/** One preflight for a set of instances. */
export interface UnionPreflight<R = unknown, D = unknown> {
    ids: string[];
    count: number;
    /** Non-null when at least one member cannot be deleted at all — the whole
     *  gesture is refused rather than half-performed. Names the members. */
    blocked: string | null;
    /** Every incoming pointer from OUTSIDE the dying set, deduplicated. */
    referencedBy: R[];
    /** Everything that hangs below any member. */
    descendants: D[];
    /** Candidates valid for every member, none of them dying. */
    reassignCandidates: Array<{ id: string; label: string }>;
    canReassign: boolean;
    /** Nothing points in and nothing hangs below: the simple confirmation. */
    simple: boolean;
    title: string;
    message: string;
}

export function unionPreflight<P extends UnionPreflightInput>(
    preflights: readonly P[],
): UnionPreflight<P['referencedBy'][number], P['descendants'][number]> {
    const ids = preflights.map(p => p.id);
    // The whole dying set: the targets and everything under them.
    const dying = new Set<string>(ids);
    for (const p of preflights) for (const d of p.descendants) dying.add(d.id);

    const blockedMembers = preflights.filter(p => p.blocked);
    const blocked = blockedMembers.length === 0 ? null
        : `${blockedMembers.map(p => p.name || p.id).join(', ')}: ${blockedMembers[0].blocked}`;

    const referencedBy: P['referencedBy'][number][] = [];
    const seenPointer = new Set<string>();
    for (const p of preflights) {
        for (const r of p.referencedBy) {
            if (dying.has(r.instanceId)) continue;          // it is dying too
            const key = `${r.instanceId}:${String(r.featureKey ?? '')}:${String(r.index ?? '')}:${r.pointsAt}`;
            if (seenPointer.has(key)) continue;             // two targets, one pointer, one row
            seenPointer.add(key);
            referencedBy.push(r);
        }
    }

    const descendants: P['descendants'][number][] = [];
    const seenDesc = new Set<string>();
    for (const p of preflights) for (const d of p.descendants) {
        if (seenDesc.has(d.id)) continue;
        seenDesc.add(d.id);
        descendants.push(d);
    }

    let candidates: Array<{ id: string; label: string }> = preflights.length === 0 ? []
        : preflights[0].reassignCandidates.filter(c => !dying.has(c.id));
    for (const p of preflights.slice(1)) {
        const here = new Set(p.reassignCandidates.map(c => c.id));
        candidates = candidates.filter(c => here.has(c.id));
    }

    const count = ids.length;
    const noun = count === 1 ? (preflights[0]?.cls ?? 'instance') : `${preflights[0]?.cls ?? 'instance'}s`;
    return {
        ids,
        count,
        blocked,
        referencedBy,
        descendants,
        reassignCandidates: candidates,
        canReassign: candidates.length > 0 && referencedBy.length > 0,
        simple: referencedBy.length === 0 && descendants.length === 0,
        title: `Delete ${count} ${noun}?`,
        message: referencedBy.length === 0
            ? 'This cannot be undone.'
            : `${referencedBy.length} reference${referencedBy.length === 1 ? '' : 's'} from outside the selection point into it.`,
    };
}

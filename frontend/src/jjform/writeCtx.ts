/**
 * jjform/writeCtx — the WRITE side of the engine's contract with its host.
 *
 * Slice S4 of the WriteCtx sequence (referto
 * `docs/discovery/discovery_2026-08-30_writectx_migrazione_motore.md` §3). The
 * shape here is not new work: S2 gave the verdict its type (`write.ts`) and S3 gave
 * the form its addressing, so what lands now is the collection of six primitives
 * that were already the whole write surface of this perimeter — the referto's
 * census found EIGHT writing functions, five of them `formWrite`, and every one of
 * them fits below.
 *
 * ── The precedent this file copies ────────────────────────────────────────────
 *
 * `ReadCtx` (`editor-v2/viewpoint/ir/irReadCtx.ts`), exactly: a narrow interface
 * that addresses by `(elementId, featureName)`, never hands out a proxy, and has no
 * import beyond its own siblings. The impure half lives outside and depends inwards
 * (`irReadCtxLproxy.ts` there, `editor-v2/hooks/writeCtxLproxy.ts` here). Same
 * division, same place, and for the same reason: everything under `jjform/` must
 * stay importable without the joiner barrel, which reaches monaco and dereferences
 * `window` at import time.
 *
 * ── Why the verdict stays `WriteResult` and does not grow ─────────────────────
 *
 * S2 annotated a convergence and deliberately did not take it: three verdict shapes
 * carrying `{ok, reason}` were living side by side —
 *
 *   S1a  `UniquenessVerdict {ok, reason?, collidingWith?}`  (`nameUniqueness.ts`)
 *   S1b  `{ok, value?, reason?, candidates?}`               (instance resolution)
 *   S2   `WriteResult {ok, changed, reason?}`               (`write.ts`)
 *
 * S4 was asked to decide it by MEASURING who consumes the extensions. Measured
 * 2026-08-30, `command grep` over `frontend/src`:
 *
 *  - `collidingWith` has two readers, `nameUniqueness.validateNameUniqueness:163`
 *    and `LModelElement.tsx:6302` (the reparent toast). It carries `LObject[]`, i.e.
 *    live L proxies. Putting it on `WriteResult` would give this directory its first
 *    host type and end the portability the type exists to serve.
 *  - `candidates` belongs to a RESOLUTION verdict, not to a write:
 *    `jjscript/executor/commands/instance.ts:146` (`{ok, value?, reason?, candidates?}`)
 *    and the JjEL ambiguity map (`jjel/evaluator/context.ts:209`), whose reader is
 *    the console copy (`ChatMessages`). Neither is on any write path — no writer in
 *    the census produces one, and no consumer of one performs a write.
 *
 * So the decision is: **`WriteResult` stays three fields, and the two extensions stay
 * where they are.** What converges is `{ok, reason}` — the part that crosses the
 * contract — and `reason` is the only channel by which a host refusal reaches the
 * engine, verbatim. Nothing is re-typed, so no consumer changes and no copy changes;
 * the alternative (optional fields for both) would have added two fields that this
 * directory could not type and that no write path would ever populate.
 *
 * ── What the picker reads, and why it is on THIS interface ───────────────────
 *
 * `validTargets(id, key)` — S5. It is a READ, and it sits on the write contract on
 * purpose: what it enumerates is not "the model", it is THE LEGAL ARGUMENTS of
 * `setValue`/`appendValue` on this `(id, key)`. Its correctness criterion is the
 * host's own refusal — an option this method offers and the same ctx then refuses is
 * the contract contradicting itself, and a host that implemented the writes without it
 * would offer exactly those. Splitting it onto a read context would make that
 * divergence expressible; here it is not, because one object answers both halves.
 *
 * The filter it carries is the containment-loop filter of R-FORM-13, and it stays the
 * HOST's: it reads the ancestor chain of THIS instance (`LValue.get_validTargets`,
 * `LModelElement.tsx:7883`), which no `MetamodelShape` can reproduce — a metaclass has
 * no ancestors. The contract does not reimplement it. It NAMES it, so that a non-jjodel
 * adapter has to supply one instead of discovering the obligation by writing a cycle.
 *
 * ── What is NOT here, and why ─────────────────────────────────────────────────
 *
 * Nothing else of the write surface. The `MetamodelShape` answers what a feature IS;
 * `ReadCtx` (`editor-v2/viewpoint/ir/irReadCtx.ts`) answers what an instance HOLDS;
 * this answers what may be written and what happens when it is.
 *
 * The OBLIGATIONS of an implementation — the ones the engine cannot check and a
 * non-jjodel adapter would otherwise discover by losing data — are listed in
 * `docs/design/design_handoff_instance_node/form-engine-contract.md` §5.0, not restated
 * here.
 */

import type { WriteResult } from './write';

/**
 * The outcome of a create. Distinct from `WriteResult` because a create has a
 * third thing to report: the identity of what it made. `changed` would be noise —
 * a create that succeeded changed something by definition.
 */
export interface CreateResult {
    /** The host accepted the create. `false` means it refused, and `reason` says why. */
    ok: boolean;
    /** Opaque id of the new instance, or null. Opaque: the engine never parses it. */
    id: string | null;
    /** The host's own words for the refusal. Verbatim, never composed here. */
    reason?: string;
}

/** A value a slot can hold, as the contract's `instanceData` (§2) allows it.
 *  `null` is the empty position a clear leaves — the HOLE of R-FORM-7 — not a
 *  missing value. */
export type WriteValue = string | number | boolean | null;

/**
 * One candidate a reference or an enum slot may be given.
 *
 * `id` is opaque — the engine never parses it, it hands it back to `setValue` /
 * `appendValue` as the value. `label` is what a human reads.
 */
export interface TargetOption {
    id: string;
    label: string;
    /** Optional heading the host filed this candidate under. Absent = no grouping. */
    group?: string;
}

/**
 * The six primitives, and the whole write surface of the form engine.
 *
 * Addressing is `(instanceId, featureKey, index)` throughout: an id and a name the
 * host resolves AT THE MOMENT OF THE WRITE. That is not a style choice — S3 measured
 * what the alternative costs. With a form open, removing and re-adding the feature on
 * the metaclass REPLACES the instance's slot; a write through a proxy captured
 * earlier then reports `{ok: true, changed: true}` and lands the value in neither the
 * dead slot nor the live one (`scripts/smoke/_tmp_s3_probe.ts`, 2026-08-30). An
 * interface that handed out a slot would be handing out that bug.
 *
 * Every method returns a verdict. None throws: a host that cannot perform a write
 * says so in `reason`, because an exception crossing this boundary would be a host
 * detail the engine has no way to describe to a user.
 */
export interface WriteCtx {
    // ── values ───────────────────────────────────────────────────────────────

    /**
     * Write `value` at position `index` of `key` on `id`.
     *
     * `isPtr` says whether the value points at another element (a reference, an enum
     * literal) rather than being a primitive: the host needs it to reconcile the
     * previous target. Omitted means "the host infers it", which is what the
     * shapeless case does.
     */
    setValue(id: string, key: string, index: number, value: WriteValue, isPtr?: boolean): WriteResult;

    /**
     * Empty position `index` of `key` on `id`.
     *
     * The contract DECLARES that this leaves a HOLE and does not shorten the array
     * (R-FORM-7): an `instanceData` that cannot represent a hole does not round-trip
     * with what this host produces. Measured on a slot holding
     * `["hot","cold","warm"]`: after clearing position 1 the array is
     * `["hot", null, "warm"]`, still length 3.
     */
    clearValue(id: string, key: string, index: number, isPtr?: boolean): WriteResult;

    /** Append an already-known value to the end of `key` on `id`. Distinct from
     *  `setValue` at the next index, which would have to be computed from a read. */
    appendValue(id: string, key: string, value: string | number | boolean, isPtr: boolean): WriteResult;

    // ── the legal arguments ──────────────────────────────────────────────────

    /**
     * The values `setValue`/`appendValue` may legally be given for `key` on `id`.
     *
     * Per INSTANCE, never per metaclass: the answer depends on where `id` sits in the
     * containment hierarchy, and it changes when something else moves — which is why the
     * address is `(id, key)` and not a slot, and why an implementation must answer at the
     * moment it is asked rather than from anything it cached. A form stays open for
     * minutes; the hierarchy under it does not stay still.
     *
     * TOTAL: a feature that offers nothing, a feature that is not there, a host that
     * cannot answer — all return `[]`. There is no verdict here because there is nothing
     * to refuse: an empty offer IS the answer, and the picker renders it as "no
     * candidates" rather than as an error.
     *
     * `group` is a heading the host may file a candidate under ('Free Objects', 'Bound
     * Objects', 'Literals of Tint' in this one). Optional, and flat rather than nested,
     * so a host with no grouping returns a plain list and loses nothing.
     */
    validTargets(id: string, key: string): TargetOption[];

    // ── identity ─────────────────────────────────────────────────────────────

    /**
     * Rename `id`. A PRIMITIVE OF ITS OWN, never `setValue(id, 'name', 0, …)`.
     *
     * In this host the name has a double binding (CLAUDE.md §3.12): the L setter
     * writes `DObject.name` AND the identity slot, while the reverse direction must
     * stay a direct field write or the sync loop forms. `setValue(id,'name',…)` would
     * write the slot alone and let the two halves diverge — which is precisely the
     * simplification the first adapter would attempt if the contract did not forbid
     * it here, in the type. Ratified as R-WCX-2.
     */
    setName(id: string, name: string): WriteResult;

    // ── lifecycle ────────────────────────────────────────────────────────────

    /**
     * Create one instance of `cls`.
     *
     * `ownerId`/`childKey` both null means a root; both set means the instance goes
     * into that containment slot. `seed` are the values that travel WITH the create,
     * not replayed after it: in this host `addObject` seeds the slots on a deferral
     * of its own because the constructor actions have not run yet
     * (`LModelElement.tsx:7188`, the deferral of CLAUDE.md §9.2), so an engine that
     * created first and wrote after would pay that deferral twice and could lose the
     * race in between. Keys are bare feature keys; the `$`-prefixing this host's
     * seeding loop wants is the adapter's translation, not the engine's.
     *
     * The create makes THE metaclass asked for, never one of its subclasses: this
     * host would otherwise pick a subclass by schema match (`:7096`), and the user
     * chose a class.
     */
    create(
        cls: string,
        ownerId: string | null,
        childKey: string | null,
        seed: Readonly<Record<string, string | number | boolean>>,
    ): CreateResult;

    /**
     * Delete ONE instance.
     *
     * The containment cascade is NOT here: it belongs to the plan (R-FORM-9), which
     * lists the descendants deepest-first, because this host's core does not cascade
     * — measured, deleting a container left the child alive with a father that no
     * longer resolved. An implementation that cascades on its own would delete twice
     * what the plan already ordered.
     */
    delete(id: string): WriteResult;
}

/**
 * The engine's own read of `validTargets`: total, defensive, and the single place the
 * candidates of a field are obtained.
 *
 * Why the engine wraps the primitive instead of the caller calling it: the host's
 * implementation is the widest thing in this contract — in jjodel it walks
 * `allSubObjects`, filters by type and by ancestor chain, and it can throw on a
 * half-built model (measured; `useFormWidgets.readOptions` carried the `try` for exactly
 * that). An offer that cannot be computed is an EMPTY offer, never a crashed form, and
 * that rule belongs to the engine, not to each of the three controls that render a
 * picker.
 *
 * Normalization is the other half: an `id` that is not a string is dropped rather than
 * coerced (a candidate the engine cannot hand back to `setValue` is not a candidate),
 * and a missing label falls back to the id, so a row is never blank.
 */
export function targetOptions(ctx: WriteCtx, id: string, key: string): TargetOption[] {
    let raw: unknown;
    try {
        raw = ctx.validTargets(id, key);
    } catch {
        return [];
    }
    if (!Array.isArray(raw)) return [];
    const out: TargetOption[] = [];
    for (const o of raw) {
        const cand = o as Partial<TargetOption> | null | undefined;
        if (!cand || typeof cand.id !== 'string' || !cand.id) continue;
        const opt: TargetOption = { id: cand.id, label: typeof cand.label === 'string' && cand.label ? cand.label : cand.id };
        if (typeof cand.group === 'string' && cand.group) opt.group = cand.group;
        out.push(opt);
    }
    return out;
}

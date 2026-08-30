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
 * ── What is NOT here, and why ─────────────────────────────────────────────────
 *
 * `validTargets(id, key)` — the per-instance containment-loop filter of R-FORM-13,
 * which no shape can reproduce because it reads the ancestor chain of THIS object
 * (`LValue.get_validTargets`, `LModelElement.tsx:7853`). The referto marks it
 * obligatory in the finished contract and gives it its own slice (S5), because it is
 * the one method with a visible rendering: it feeds the picker. Until S5 the picker
 * keeps reading it off the proxy through `useFormWidgets.readOptions`, which is the
 * committed behaviour, and this interface does not pretend to have replaced it.
 *
 * The OBLIGATIONS of an implementation — the ones the engine cannot check and a
 * non-jjodel adapter would otherwise discover by losing data — are listed in
 * `docs/prompts/form-engine-contract.md` §5, not restated here.
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

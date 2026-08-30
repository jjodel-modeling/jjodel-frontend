/**
 * createDraw — the importless half of the D-graph CREATE adapter (slice 2c).
 *
 * Same split, same reason, as `shapeDraw.ts` next door: `createAdapter.ts` imports
 * the joiner barrel, the barrel reaches monaco, monaco dereferences `window` at
 * import time, and a unit test that touched anything in that file would die at
 * import. Everything here is a pure function of a plain `idlookup` dictionary, and
 * the only module it imports — `irReadCtx` — has zero imports of its own, so the
 * chain stays loadable under the node test environment. `instanceTable.ts` already
 * depends on it the same way.
 *
 * ── This is where the containment-loop filter landed, and why ─────────────────
 *
 * Point 6 of `form-engine-contract.md` left it to this slice: the shape says what
 * the METAMODEL permits, and which of those candidates a particular instance may
 * take is a question of the moment of writing. Measured, the core answers it twice
 * and both times per-instance:
 *
 *  - offering, `LValue.get_validTargets` (`LModelElement.tsx:7871`):
 *      `if (isContainment) validObjects = validObjects.filter(obj => !containerObjectsID.includes(obj.id))`
 *    where `containerObjectsID` is `get_fatherList(c).map(lm => lm.id)`;
 *  - writing, `LValue.setValueAtPosition` (`:7654`): the same membership test,
 *    returning `{success: false, reason: "cannot create a containment loop"}`.
 *
 * So the filter is NOT in `jjform/` (it has no instance to read) and NOT in the
 * shape (it has no meaning for a metaclass). It is here, in the adapter, in the
 * half that can be tested, and `candidatesFor` is the single entry that applies it.
 *
 * Two consequences of reading the core rather than guessing at it:
 *
 *  1. It applies to CONTAINMENT features only. A non-containment reference cannot
 *     close a containment cycle, and filtering it would silently forbid a legal
 *     model. `get_validTargets` guards the filter behind `if (isContainment)`, and
 *     so does this module.
 *  2. For a DRAFT the chain does not exist yet — the instance is not in the store.
 *     The chain that will be its own is the OWNER's: the owner, its owner, up to
 *     the model. That is what `containmentChain(ownerId)` returns, and passing it
 *     as the exclusion set is the draft's exact equivalent of `fatherList`.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';

type Idlookup = Record<string, any>;

/** The containment chain above an object: every DObject that owns it, transitively,
 *  and the model the chain ends in.
 *
 *  The walk alternates DObject -> DValue -> DObject, because a contained object's
 *  `father` is the OWNER'S SLOT, not the owner (`LPointerTargetable.getCollection`,
 *  `joiner/classes.ts:2551`, routes a DObject under a DValue into `values`). A root
 *  object's father is the DModel and the walk ends there.
 *
 *  `objectIds` INCLUDES the starting object: it is an ancestor of anything it would
 *  contain, and it is the first candidate a loop filter has to reject. `depthCap` is
 *  a cycle belt, not a semantic limit — a chain that long is already corrupt, and
 *  stopping beats looping. */
export function containmentChain(
    idlookup: Idlookup,
    objectId: string,
    depthCap = 64,
): { objectIds: string[]; modelId: string | null } {
    const objectIds: string[] = [];
    if (!idlookup || !objectId) return { objectIds, modelId: null };

    let current = idlookup[objectId];
    if (current?.className !== 'DObject') return { objectIds, modelId: null };

    for (let i = 0; i < depthCap && current; i++) {
        if (current.className === 'DModel') {
            return { objectIds, modelId: typeof current.id === 'string' ? current.id : null };
        }
        if (current.className === 'DObject') {
            if (typeof current.id === 'string') {
                if (objectIds.includes(current.id)) break;   // cycle: stop, do not loop
                objectIds.push(current.id);
            }
        }
        const father = current.father;
        if (typeof father !== 'string') break;
        current = idlookup[father];
    }
    return { objectIds, modelId: null };
}

/** The model an object belongs to, by the same walk. Null when the chain does not
 *  reach a DModel (an orphan, or a chain longer than the cap). */
export function modelOfObject(idlookup: Idlookup, objectId: string): string | null {
    return containmentChain(idlookup, objectId).modelId;
}

/**
 * The values a slot actually holds, holes excluded.
 *
 * `formWrite.clearSlotValue` leaves a HOLE rather than shortening the array (it is
 * an assignment to a position, not a splice), so `values.length` reports a slot as
 * fuller than it is. An upper-bound gate built on the raw length would refuse an
 * Add on a slot with room — which is why this counts what is there instead.
 * `instanceTable.slotShapeFor` filters the same way, for the same reason.
 */
export function filledSlotValues(idlookup: Idlookup, ownerId: string, featureKey: string): string[] {
    const slot = findFeatureRaw(idlookup, ownerId, featureKey);
    const raw: unknown[] = Array.isArray(slot?.values) ? slot.values : [];
    return raw.filter(v => v != null && String(v).trim() !== '').map(v => String(v));
}

/** How many values a child slot holds. The input of `addChildReason`'s upper-bound gate. */
export function childCount(idlookup: Idlookup, ownerId: string, childKey: string): number {
    return filledSlotValues(idlookup, ownerId, childKey).length;
}

/**
 * Every instance of `classIds` in `modelId` whose owner is `ownerId`.
 *
 * `ownerId === null` means the roots of the model — the instances the model owns
 * directly. The walk is one hop and not the whole chain: two instances with different
 * owners are not siblings however close their ancestors are. This WAS the scope of the
 * uniqueness rule of 12a; since R-S1-3 (2026-08-30) that rule reads the core's
 * namespace instead — see `siblingNames` below.
 *
 * `classIds` is a SET of D-layer class ids, not one: the sibling scope is «same
 * cls», so the caller passes the one id for uniqueness and the conformance closure
 * (a class plus its concrete subclasses) when it wants candidates.
 */
export function instancesUnder(
    idlookup: Idlookup,
    modelId: string,
    classIds: Set<string>,
    ownerId: string | null,
): string[] {
    const out: string[] = [];
    if (!idlookup || !modelId || !classIds || classIds.size === 0) return out;
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject') continue;
        if (typeof d.instanceof !== 'string' || !classIds.has(d.instanceof)) continue;
        if (ownerOf(idlookup, id) !== ownerId) continue;
        if (modelOfObject(idlookup, id) !== modelId) continue;
        out.push(id);
    }
    return out;
}

/** The DObject that owns this one, or null when the model owns it directly.
 *  One hop: `father` is the owner's SLOT, and the slot's father is the owner. */
export function ownerOf(idlookup: Idlookup, objectId: string): string | null {
    const father = idlookup?.[objectId]?.father;
    if (typeof father !== 'string') return null;
    const f = idlookup[father];
    if (f?.className !== 'DValue') return null;
    const owner = idlookup[f.father];
    return owner?.className === 'DObject' && typeof owner.id === 'string' ? owner.id : null;
}

/** Display names of the instances of ONE metaclass under one owner.
 *
 *  NO LONGER THE UNIQUENESS RULE (R-S1-3, 2026-08-30). It used to feed
 *  `draftContext.siblingNames`, on the «same cls, same owner» scope of 12a; that scope
 *  was measured ORTHOGONAL to the core's — each accepts what the other refuses
 *  (`discovery_2026-08-30_s1_uniqueness_consumatori.md` §3) — and 12a was amended to
 *  the core's. `createAdapter.namespaceNames` now reads the namespace from
 *  `nameUniqueness.getNamespaceOf`, and this function must NOT be wired back into a
 *  uniqueness check: two rules that agree today diverge tomorrow.
 *
 *  Kept because it is a meaningful per-class query in its own right, and tested as one.
 *  Named by the same rule the rest of the manager reads names by (`makeDrawReadCtx`:
 *  identity slot first, then `DObject.name`, then `initialName`).
 *  TODO: cleanup — remove if no per-class consumer appears. */
export function siblingNames(
    idlookup: Idlookup,
    modelId: string,
    classId: string,
    ownerId: string | null,
): string[] {
    const ctx = makeDrawReadCtx(idlookup);
    return instancesUnder(idlookup, modelId, new Set([classId]), ownerId)
        .map(id => ctx.getName(id) ?? '')
        .filter(Boolean);
}

/** One reference candidate, as `jjform`'s `DraftOption` wants it. */
export interface CandidateOption {
    id: string;
    label: string;
}

/**
 * The candidates a draft's reference may take.
 *
 * `classIds` is the conformance closure of the reference's target type (the class
 * and its concrete subclasses — `getMetaclassInfo` computes it, and the impure half
 * passes it in). Every instance of those, anywhere in the model, whatever its owner:
 * a reference points across the containment tree, that is what makes it a reference.
 *
 * `isContainment` turns the loop filter on. When it is on, `excludeIds` — the
 * containment chain of the draft's owner — is subtracted, which is the same
 * subtraction `get_validTargets` performs and the one `setValueAtPosition` would
 * otherwise enforce by refusing the write. Offering a candidate the write path will
 * reject is the failure this closes.
 */
export function candidatesFor(
    idlookup: Idlookup,
    modelId: string,
    classIds: Set<string>,
    opts: { isContainment?: boolean; excludeIds?: Iterable<string> } = {},
): CandidateOption[] {
    const ctx = makeDrawReadCtx(idlookup);
    const excluded = opts.isContainment ? new Set(opts.excludeIds ?? []) : new Set<string>();

    const out: CandidateOption[] = [];
    if (!idlookup || !modelId || !classIds || classIds.size === 0) return out;
    for (const id in idlookup) {
        const d = idlookup[id];
        if (!d || d.className !== 'DObject') continue;
        if (typeof d.instanceof !== 'string' || !classIds.has(d.instanceof)) continue;
        if (excluded.has(id)) continue;
        if (modelOfObject(idlookup, id) !== modelId) continue;
        out.push({ id, label: ctx.getName(id) ?? id });
    }
    out.sort((a, b) => (a.label === b.label ? (a.id < b.id ? -1 : 1) : a.label < b.label ? -1 : 1));
    return out;
}

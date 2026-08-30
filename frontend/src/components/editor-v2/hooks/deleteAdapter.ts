/**
 * deleteAdapter - the D-graph backend of `jjform`'s `delete` event (slice 12d).
 *
 * Sibling of `createAdapter.ts` and split the same way: THIS file is the impure
 * half - it touches the store and the L proxies - while `deleteDraw.ts` next door
 * is the pure half the unit tests can reach. The joiner barrel reaches monaco and
 * monaco dereferences `window` at import time, so anything importable under vitest
 * has to stay out of here.
 *
 * -- One event, and the preflight that chooses its options ---------------------
 *
 * `delete(id, { reassignTo? | clearRefs })` (contract section 5). The options are
 * the verdict of the preflight, not three separate routes, and the plan that
 * carries them out is computed by the PURE engine (`jjform/delete.ts`). This file
 * gathers what the engine needs from the live model and then applies the steps in
 * order. It decides nothing the engine could have decided.
 *
 * -- What the primitives are, measured -----------------------------------------
 *
 * Three measurements shaped this file. They are recorded in
 * `docs/discovery/discovery_2026-08-30_slice12d_delete.md` and taken with
 * `scripts/smoke/_tmp_delete_primitive.ts` / `_tmp_delete_multi.ts`:
 *
 *  1. THE CORE DOES NOT CASCADE CONTAINMENT. `Dummy.get_delete` walks
 *     `lDeleted.children`, and a contained DObject is not among a DValue's
 *     children. Deleting the container left the child alive with a `father` that
 *     no longer resolves - an orphan invisible to the manager's lists, which all
 *     walk `father` up to a DModel. So the cascade is issued HERE, one
 *     `.delete()` per descendant, deepest first.
 *  2. THE CORE DOES CLEAR THE INCOMING POINTERS, by value. On a `0..*` slot
 *     holding two targets, deleting the one at position 0 left a length-1 array.
 *     So a plain delete leaves an EMPTY slot, not a dangling pointer, and the
 *     `clear` verdict is a different write from the `dirty` one precisely because
 *     `clearSlotValue` leaves a hole instead.
 *  3. A SINGLETON INSTANCE CANNOT BE DELETED. `LObject.get_delete`
 *     (`LModelElement.tsx:6510`) logs and returns unless a lifecycle token is
 *     present. Measured: the instance survived the call. The preflight declares
 *     that as `blocked` rather than letting the user press a button that does
 *     nothing.
 *
 * -- No outer TRANSACTION ------------------------------------------------------
 *
 * `LPointerTargetable.get_delete` opens its own (`joiner/classes.ts:2529`), and so
 * does every `formWrite` helper used here. Nothing in this file opens one:
 * wrapping the calls would nest the writes of a cascade inside a single
 * transaction, which is the hazard of CLAUDE.md rule 12 / section 3.3. The cost is
 * that an undo undoes one step at a time, which is the granularity the core
 * already offers everywhere else (12d leaves undo alone by scope).
 */

import { LPointerTargetable, store, U } from '../../../joiner';
import type {
    ClassShape,
    DeleteOption,
    DeletePlan,
    DeletePreflight,
    MetamodelShape,
} from '../../../jjform';
import { deletePreflight } from '../../../jjform';
import { clearSlotValue, setSlotValue } from '../viewpoint/ir/formWrite';
import { candidatesFor } from './createDraw';
import { conformanceClassIds } from './createAdapter';
import { descendantsOf, referrerInputs } from './deleteDraw';
import { makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';

type Idlookup = Record<string, any>;

const lookup = (): Idlookup => (store.getState() as any)?.idlookup ?? {};

/**
 * The reassign candidates of ratified rule 4: same type or concrete subtype of the
 * reference's target, minus the instance being deleted and minus its descendants.
 *
 * The closure is taken over the DELETED INSTANCE'S OWN metaclass, not over each
 * referring reference's declared type, and that is a decision with a reason. The
 * design offers ONE select - "Reassign all to" - so one list has to satisfy every
 * referrer at once. The instance currently sits in each of those slots, so its
 * metaclass conforms to each of their declared types; anything conformant to IT is
 * therefore conformant to all of them. Taking each reference's own type instead
 * would produce a wider list whose extra entries some referrer would reject, and
 * `setValueAtPosition` would refuse the write after the instance was already gone.
 *
 * The exclusion set is the dying set: an instance cannot be reassigned to itself,
 * and a descendant is about to disappear with it.
 */
export function reassignCandidates(
    modelId: string,
    className: string,
    excludeIds: Iterable<string>,
): DeleteOption[] {
    const idlookup = lookup();
    const excluded = new Set(excludeIds ?? []);
    return candidatesFor(idlookup, modelId, conformanceClassIds(modelId, className), {})
        .filter(c => !excluded.has(c.id));
}

/**
 * The preflight of contract section 4 for one instance - always computed, whether
 * or not anything points at it (ratified rule 1 of 12d).
 *
 * `blocked` is filled from the metamodel, not from a try/catch around the delete:
 * a singleton instance is refused by `LObject.get_delete`, and finding that out by
 * pressing the button would mean a dialogue that lies about what it can do.
 */
export function preflightFor(
    modelId: string,
    shape: MetamodelShape,
    instanceId: string,
): DeletePreflight {
    const idlookup = lookup();
    const ctx = makeDrawReadCtx(idlookup);
    const d = idlookup[instanceId];
    const cls: string = idlookup[d?.instanceof]?.name ?? '';
    const clsShape: ClassShape | undefined = shape?.classes?.[cls];

    const descendants = descendantsOf(idlookup, instanceId);
    const dying = [instanceId, ...descendants.map(x => x.id)];

    return deletePreflight(shape, {
        id: instanceId,
        name: ctx.getName(instanceId) ?? instanceId,
        cls,
        referrers: referrerInputs(idlookup, dying),
        descendants,
        candidates: clsShape
            ? reassignCandidates(modelId, cls, dying)
            : [],
        blocked: clsShape?.singleton
            ? `${cls} is a singleton - remove the singleton flag in the metamodel first`
            : null,
    });
}

/** The plan for a preflight plus the option the user chose. Re-exported from the
 *  engine so a caller needs one import for the adapter. */
export { deletePlan } from '../../../jjform';

/** The cascade itself: one `.delete()` per id, in the order the plan fixed.
 *  Split out because it is what the deferral below schedules. */
function runDeletes(ids: string[]): number {
    let deleted = 0;
    for (const id of ids) {
        if (!(store.getState() as any)?.idlookup?.[id]) continue;
        try {
            const proxy: any = LPointerTargetable.fromPointer(id);
            if (!proxy) continue;
            // No outer TRANSACTION: `get_delete` opens its own.
            proxy.delete();
            deleted++;
        } catch (err) {
            console.warn('[deleteAdapter] applyDelete failed', { id, err });
        }
    }
    return deleted;
}

/**
 * Apply a plan to the D graph. Returns how many instances it deleted, or how many
 * it scheduled when the deletes are deferred (see below).
 *
 * The order is the plan's and is load-bearing: the writes on the REFERRERS come
 * first, while the pointers still resolve, and the deletes come after, deepest
 * first. A reassign performed after the delete would be repointing a slot the
 * core's own cascade had already emptied.
 *
 * THE DEFERRAL IS NOT A PRECAUTION, IT IS A MEASURED FIX. Issued in one tick, the
 * slot writes and the delete land in the WRONG ORDER: measured on the running app
 * (`scripts/smoke/_tmp_instance_manager_12d.ts`, 2026-08-30), a `clear` of
 * `allNine_broken.cfg[0]` followed immediately by the delete of the target left the
 * slot at `[null]` instead of `[null, Config_two]` — the delete's own `'-='` had
 * removed the pointer from the ORIGINAL array first, and the positional write then
 * landed on what was left, taking a value with it. The same two operations with a
 * wait between them leave `[null, Config_two]`, which is the state R-FORM-7
 * describes. So the deletes are scheduled one `U.UpdatingTimer * 2` later, the same
 * deferral `LValue.addObject` uses for its own seeding (`LModelElement.tsx:7153`)
 * and the one CLAUDE.md section 9.2 prescribes to anyone who writes and then
 * writes again through the L layer.
 *
 * A `dirty` plan writes nothing first and is therefore NOT deferred: there is no
 * earlier write for the delete to overtake, and deleting synchronously keeps the
 * common case immediate.
 *
 * Nothing is re-decided here. In particular the plan is NOT recomputed from a
 * second reading of the model: a second verdict could disagree with the one the
 * user is looking at, and the confirm button is exactly where the two must be the
 * same. That is the same rule `createAdapter.applyCreate` follows.
 */
export function applyDelete(plan: DeletePlan): number {
    if (!plan || plan.blocked) return 0;

    for (const step of plan.reassign) {
        const lOwner: any = LPointerTargetable.fromPointer(step.instanceId);
        const slot: any = lOwner?.['$' + step.featureKey];
        if (!slot) {
            console.warn('[deleteAdapter] applyDelete: reassign slot not found', step);
            continue;
        }
        setSlotValue(slot, step.index, step.to, true);
    }

    for (const step of plan.clear) {
        const lOwner: any = LPointerTargetable.fromPointer(step.instanceId);
        const slot: any = lOwner?.['$' + step.featureKey];
        if (!slot) {
            console.warn('[deleteAdapter] applyDelete: clear slot not found', step);
            continue;
        }
        clearSlotValue(slot, step.index, true);
    }

    if (plan.reassign.length === 0 && plan.clear.length === 0) return runDeletes(plan.deletes);

    setTimeout(() => runDeletes(plan.deletes), U.UpdatingTimer * 2);
    return plan.deletes.length;
}

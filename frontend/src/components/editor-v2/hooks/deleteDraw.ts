/**
 * deleteDraw - the importless half of the D-graph DELETE adapter (slice 12d).
 *
 * Same split, same reason, as `createDraw.ts` and `shapeDraw.ts` next door:
 * `deleteAdapter.ts` imports the joiner barrel, the barrel reaches monaco, monaco
 * dereferences `window` at import time, and a unit test that touched anything in
 * that file would die at import. Everything here is a pure function of a plain
 * `idlookup` dictionary, so the whole chain stays loadable under the node test
 * environment.
 *
 * -- Why the containment cascade lives in the ADAPTER --------------------------
 *
 * Because the core does not do it, measured rather than assumed (the check the
 * prompt of 12d asked for, and the same discipline slice 2c applied to
 * `addObject`). `Dummy.get_delete` cascades over `lDeleted.children`;
 * `DObject.children` is its DValue slots (`LModelElement.tsx:6439`), and `LValue`
 * declares no `get_children_idlist` of its own, so it inherits the base one -
 * annotations only (`:727`). A contained DObject sits in the slot's `values`, not
 * in any `children` list, and is therefore never reached.
 *
 * Measured on the RowViewSmoke fixture with `cfg` switched to containment
 * (`scripts/smoke/_tmp_delete_primitive.ts`, 2026-08-30): deleting the container
 * took the DObject count from 7 to 6, the child SURVIVED, and its `father` no
 * longer resolved. That orphan is invisible to every list in the manager - they
 * all walk `father` up to a DModel (`instanceManagerModel.modelIdOfObject`) - so
 * the failure is silent leakage, not a visible mess.
 *
 * So the cascade is the adapter's, never the UI's, and `descendantsOf` is the one
 * entry that computes it.
 *
 * -- What the core DOES do to incoming pointers, also measured -----------------
 *
 * It removes them, by value. `Dummy.get_delete`'s `pointedBy` loop reaches
 * `case 'values'` and issues `SetFieldAction(dObj.id, 'values', deletedID, '-=')`.
 * Measured on a `0..*` slot holding two targets: deleting the one at position 0
 * left a length-1 array, so the array is SHORTENED and the survivors renumbered -
 * it does not leave the hole `formWrite.clearSlotValue` leaves. That is the whole
 * difference between the `clear` and `dirty` verdicts of `jjform/delete.ts`, and
 * it is why the plain delete cannot be described as "leaves a dangling pointer":
 * it leaves an EMPTY SLOT, which is the other half of what contract section 2
 * calls a broken ref (missing id or "").
 */

import { findFeatureRaw, makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';
import { referencedBy } from './shapeDraw';
import { filledSlotValues } from './createDraw';
import type { DescendantInput, ReferrerInput } from '../../../jjform';

type Idlookup = Record<string, any>;

/**
 * Every instance that hangs below `objectId` through containment, transitively.
 *
 * The walk is DObject -> DValue slot -> values, and it descends only through slots
 * whose DReference carries `composition`: a non-containment reference points at an
 * instance it does not own, and following it would delete the whole model one
 * pointer at a time.
 *
 * Depth-first, so a parent is always listed before its own children; `depth` says
 * how far down each one sits and is what the plan sorts on to delete deepest
 * first. `depthCap` is a cycle belt, not a semantic limit - a containment chain
 * that long is already corrupt, and stopping beats looping.
 */
export function descendantsOf(
    idlookup: Idlookup,
    objectId: string,
    depthCap = 64,
): DescendantInput[] {
    const out: DescendantInput[] = [];
    if (!idlookup || !objectId) return out;
    const ctx = makeDrawReadCtx(idlookup);
    const seen = new Set<string>([objectId]);

    const walk = (ownerId: string, depth: number): void => {
        if (depth > depthCap) return;
        const owner = idlookup[ownerId];
        if (owner?.className !== 'DObject') return;
        for (const slotId of Array.isArray(owner.features) ? owner.features : []) {
            const slot = idlookup[slotId];
            if (slot?.className !== 'DValue') continue;
            const feature = idlookup[slot.instanceof];
            if (!feature || feature.composition !== true) continue;
            const childKey = feature.name ?? '';
            for (const raw of Array.isArray(slot.values) ? slot.values : []) {
                const childId = typeof raw === 'string' ? raw : '';
                if (!childId || seen.has(childId)) continue;
                const child = idlookup[childId];
                if (child?.className !== 'DObject') continue;
                seen.add(childId);
                out.push({
                    id: childId,
                    name: ctx.getName(childId) ?? childId,
                    cls: idlookup[child.instanceof]?.name ?? '',
                    childKey,
                    depth,
                });
                walk(childId, depth + 1);
            }
        }
    };

    walk(objectId, 1);
    return out;
}

/**
 * Every incoming pointer the delete of `dyingIds` has to deal with.
 *
 * Three filters, each of them a decision:
 *
 *  - CONTAINMENT LINKS ARE DROPPED. An owner is not a referrer (R-FORM-8): its
 *    slot is where the instance lives, and it is being deleted with it.
 *  - POINTERS HELD BY THE DYING SET ARE DROPPED. A descendant that points at its
 *    own parent is about to be deleted; offering to repoint it would be offering
 *    to edit something that will not exist.
 *  - POINTERS AIMED AT A DESCENDANT ARE KEPT, and flagged. Ratified rule 3 of 12d:
 *    the cascade takes the descendants with it, so whoever pointed at one is left
 *    dangling exactly as if the target itself had been pointed at.
 *
 * `slotCount` is the number of values that slot actually holds, holes excluded -
 * the same count `createDraw.filledSlotValues` takes, and for the same reason: a
 * raw `values.length` would make a slot with a hole look fuller than it is and the
 * cardinality verdict would be wrong.
 */
export function referrerInputs(idlookup: Idlookup, dyingIds: string[]): ReferrerInput[] {
    const dying = new Set(dyingIds ?? []);
    const out: ReferrerInput[] = [];
    if (!idlookup) return out;

    for (const targetId of dying) {
        for (const inc of referencedBy(idlookup, targetId)) {
            if (inc.composition) continue;
            if (dying.has(inc.instanceId)) continue;
            const feature = idlookup[inc.featureId];
            out.push({
                instanceId: inc.instanceId,
                instanceName: inc.instanceName,
                instanceClass: inc.instanceClass,
                featureKey: inc.featureKey,
                featureId: inc.featureId,
                pointsAt: targetId,
                index: inc.index,
                lower: typeof feature?.lowerBound === 'number' ? feature.lowerBound : 0,
                upper: typeof feature?.upperBound === 'number' ? feature.upperBound : 1,
                slotCount: filledSlotValues(idlookup, inc.instanceId, inc.featureKey).length,
            });
        }
    }

    // Stable order: referring instance, then feature, then position. The dialogue
    // lists them in this order and a re-render must not shuffle it.
    out.sort((a, b) =>
        a.instanceName !== b.instanceName ? (a.instanceName < b.instanceName ? -1 : 1)
        : a.featureKey !== b.featureKey ? (a.featureKey < b.featureKey ? -1 : 1)
        : a.index - b.index);
    return out;
}

/** The DValue slot of one (instance, feature), or null. The write steps of a plan
 *  address a slot this way, by NAME, because that is what the engine carries -
 *  the engine has no D-layer ids for slots and must not grow any. */
export function slotOf(idlookup: Idlookup, instanceId: string, featureKey: string): any | null {
    return findFeatureRaw(idlookup, instanceId, featureKey) ?? null;
}

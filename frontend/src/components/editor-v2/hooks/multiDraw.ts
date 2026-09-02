/**
 * multiDraw — the importless half of the D-graph adapter for 12b/12c.
 *
 * Same split, same reason, as `shapeDraw.ts`, `createDraw.ts` and `deleteDraw.ts`
 * next door (R-FORM-5): `multiAdapter.ts` imports the joiner barrel, the barrel
 * reaches monaco, monaco dereferences `window` at import time, and a unit test
 * that touched anything in that file would die at import. Everything here is a
 * pure function of a plain `idlookup`, and the only module it imports —
 * `irReadCtx` — has zero imports of its own.
 *
 * Two jobs, one per half of the slice:
 *
 *  - 12b: turn N instance ids into the `MultiInstance[]` the engine's
 *    `multiModel` consumes. The engine decides what is mixed; this decides only
 *    what each instance HOLDS, and it must read values the same way the rest of
 *    the manager does or the two would disagree about the same slot.
 *  - 12c: turn a containment position into the `NavStep`s the breadcrumb prints,
 *    and list a slot's contained children so the form can render them.
 *
 * ── Holes are not values, here as everywhere ──────────────────────────────────
 *
 * `formWrite.clearSlotValue` leaves a HOLE rather than shortening the array, so
 * `values.length` reports a slot as fuller than it is. `instanceTable.slotShapeFor`
 * and `createDraw.filledSlotValues` both filter the same way; a third reading that
 * did not would make a cleared slot look mixed against an empty one.
 */

import { findFeatureRaw, makeDrawReadCtx } from '../viewpoint/ir/irReadCtx';
import type { ClassShape, MultiInstance, NavStep } from '../../../jjform';

type Idlookup = Record<string, any>;

/** The values a slot actually holds, holes excluded. The same filter as
 *  `createDraw.filledSlotValues`, kept local so this module keeps its single
 *  zero-import dependency instead of gaining a second. */
function filled(idlookup: Idlookup, instanceId: string, key: string): unknown[] {
    const slot = findFeatureRaw(idlookup, instanceId, key);
    const raw: unknown[] = Array.isArray(slot?.values) ? slot.values : [];
    return raw.filter(v => v != null && String(v).trim() !== '');
}

/**
 * What one instance holds, in the engine's `MultiInstance` shape.
 *
 * MONOVALUE POSITION 0, and the reason is the design's: 12b bulk-edits a FIELD,
 * and a field is one control. A `0..*` slot has no single value to be mixed
 * about — «Mixed (Green, Red, Blue)» describes three instances disagreeing on one
 * value, not one instance holding three. So a many-valued feature reports its
 * first filled value and the engine treats it like any other; bulk-editing a list
 * as a list is not in this slice, and `multiAdapter` refuses to write one.
 */
export function multiInstanceOf(idlookup: Idlookup, cls: ClassShape, instanceId: string): MultiInstance {
    const values: Record<string, unknown> = {};
    const refs: Record<string, unknown> = {};
    for (const a of cls.attrs) values[a.key] = filled(idlookup, instanceId, a.key)[0] ?? null;
    for (const r of cls.refs) refs[r.key] = filled(idlookup, instanceId, r.key)[0] ?? null;
    return { id: instanceId, values, refs };
}

/** The selection, in the order the caller gave it. Ids that do not resolve to a
 *  `DObject` are dropped rather than yielding an empty instance: a stale
 *  selection (the row was deleted under the form) must not make every field mixed
 *  against a phantom. */
export function multiInstancesOf(
    idlookup: Idlookup,
    cls: ClassShape,
    instanceIds: readonly string[],
): MultiInstance[] {
    const out: MultiInstance[] = [];
    for (const id of instanceIds) {
        if (idlookup?.[id]?.className !== 'DObject') continue;
        out.push(multiInstanceOf(idlookup, cls, id));
    }
    return out;
}

/** True when every selected id is an instance of the same metaclass — the
 *  precondition `multiModel` documents but cannot check. The caller enforces the
 *  selection rule; this is how it enforces it. */
export function sameMetaclass(idlookup: Idlookup, instanceIds: readonly string[]): string | null {
    let cls: string | null = null;
    for (const id of instanceIds) {
        const d = idlookup?.[id];
        if (d?.className !== 'DObject' || typeof d.instanceof !== 'string') return null;
        if (cls === null) cls = d.instanceof;
        else if (cls !== d.instanceof) return null;
    }
    return cls;
}

/**
 * One breadcrumb step for an instance.
 *
 * The name follows `makeDrawReadCtx` — identity slot first, then `DObject.name`,
 * then `initialName` — because a segment the user cannot recognise is a segment
 * they cannot navigate by, and the rest of the manager labels rows by that same
 * rule.
 */
export function navStepOf(
    idlookup: Idlookup,
    instanceId: string,
    childKey: string | null = null,
): NavStep | null {
    if (idlookup?.[instanceId]?.className !== 'DObject') return null;
    const ctx = makeDrawReadCtx(idlookup);
    return {
        id: instanceId,
        name: ctx.getName(instanceId) ?? '',
        cls: ctx.getMetaclassName(instanceId) ?? '',
        childKey,
    };
}

/**
 * The contained children of `instanceId` held in the `childKey` slot.
 *
 * Ids only, filtered to the ones that resolve: a slot may hold a pointer to a
 * deleted object during the window between a delete and the next render, and an
 * inline sub-form mounted on a phantom would render an empty shell instead of
 * nothing.
 */
export function childrenIn(idlookup: Idlookup, instanceId: string, childKey: string): string[] {
    return filled(idlookup, instanceId, childKey)
        .map(v => String(v))
        .filter(id => idlookup?.[id]?.className === 'DObject');
}

/**
 * The containment road from the model down to `instanceId`, root first.
 *
 * The walk alternates DObject -> DValue -> DObject: a contained object's `father`
 * is the OWNER'S SLOT, not the owner (`createDraw.containmentChain` documents the
 * same hop, and `LPointerTargetable.getCollection` is why). Each step remembers
 * the slot it came through, which is what lets a breadcrumb distinguish two slots
 * of the same metaclass on the same owner.
 *
 * `depthCap` is a cycle belt, not a semantic limit: the core refuses to write a
 * containment cycle (measured — `LValue.setValueAtPosition` returns
 * `{success:false}`), so a chain this long is already corrupt and stopping beats
 * looping.
 */
export function pathTo(idlookup: Idlookup, instanceId: string, depthCap = 64): NavStep[] {
    const steps: NavStep[] = [];
    if (idlookup?.[instanceId]?.className !== 'DObject') return steps;
    const ctx = makeDrawReadCtx(idlookup);

    let currentId: string | null = instanceId;
    const seen = new Set<string>();

    for (let i = 0; i < depthCap && currentId; i++) {
        if (seen.has(currentId)) break;
        seen.add(currentId);
        steps.push({
            id: currentId,
            name: ctx.getName(currentId) ?? '',
            cls: ctx.getMetaclassName(currentId) ?? '',
            childKey: null,
        });
        const slotId: unknown = idlookup[currentId]?.father;
        const slot: any = typeof slotId === 'string' ? idlookup[slotId] : null;
        if (slot?.className !== 'DValue') break;             // the model owns it: road ends
        const owner: any = idlookup[slot.father];
        if (owner?.className !== 'DObject') break;
        // The slot belongs to the step JUST PUSHED — it is how THAT object is held
        // by its owner, not how the owner is held by its own. Attaching it to the
        // next step instead shifts the whole road by one, which is what the first
        // stesura did and what `multiDraw.test.ts` caught.
        //
        // A DValue does NOT carry the feature name: it carries `instanceof`, the
        // DReference it is a slot of, and the name is on that. Same indirection
        // `findFeatureRaw` walks.
        const feature = typeof slot.instanceof === 'string' ? idlookup[slot.instanceof] : null;
        steps[steps.length - 1].childKey = typeof feature?.name === 'string' ? feature.name : null;
        currentId = typeof owner.id === 'string' ? owner.id : null;
    }
    return steps.reverse();
}

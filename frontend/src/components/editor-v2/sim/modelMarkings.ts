/**
 * modelMarkings — the initial markings on the M1 models of a metamodel, the
 * input of the Bound proposal of Apply (R-SIM-81, G2 of the demo readiness
 * report 2026-09-27).
 *
 * As `metamodelSketch.ts` reads the metamodel, this reads its models: the slot
 * of the Initial marking attribute on every instance of the Place class, on
 * every M1 model whose `instanceof` is the metamodel. The objects of a model,
 * the kind test and the slot are the engine's own readers
 * (`collectModelObjectIds`, `isKindOf`, `objectSlotValues`), so this sees the
 * places and the values the compiler of the net sees.
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/modelMarkings.test.ts).
 */

import { collectModelObjectIds } from './simBridge';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectSlotValues } from '../../../model/simulation/objectSlots';

/**
 * The largest initial marking over the places of the metamodel's M1 models.
 * Only a whole number >= 0 counts: any other value is a defect whatever the
 * bound is (`compileNet`, `initial-over-bound`). `null` when no model, place or
 * value is found.
 */
export function largestInitialMarking(
    lookup: Record<string, any>, metamodelId: string, placeClassId: string, markingAttributeId: string,
): number | null {
    let largest: number | null = null;
    for (const modelId in lookup) {
        const model = lookup[modelId];
        if (model?.className !== 'DModel' || model.instanceof !== metamodelId) continue;
        for (const id of collectModelObjectIds(lookup, modelId)) {
            if (!isKindOf(lookup, id, placeClassId)) continue;
            const raw = objectSlotValues(lookup, id, markingAttributeId)[0];
            if (typeof raw !== 'number' || !Number.isInteger(raw) || raw < 0) continue;
            if (largest === null || raw > largest) largest = raw;
        }
    }
    return largest;
}

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
 * Since G12(b) (R-SIM-81(1) as amended by Alfonso on 2026-09-27) the proposal
 * is read from the reachable markings too: `boundEstimate` compiles every model
 * with the engine's `compileNet` and explores it (`exploreBound`), and
 * `boundEstimateSignature` is what the panel's selector reads in its place, so
 * the exploration runs in a memo, never on every store change (report §5.1
 * risk 5, docs/discovery/discovery_2026-09-27_sim_post_models_engine.md).
 *
 * Pure: no React, no store, no import from the joiner, so it runs under the
 * node test bench (sim/__tests__/modelMarkings.test.ts).
 */

import { collectModelObjectIds, makeNetModelView, runSignature } from './simBridge';
import { isKindOf } from '../../../model/simulation/isKindOf';
import { objectSlotValues } from '../../../model/simulation/objectSlots';
import { compileNet, netStcFromRoles } from '../../../model/simulation/netCompile';
import { BOUND_EXPLORATION_CAP, exploreBound } from '../../../model/simulation/boundExploration';
import type { BoundExploration } from '../../../model/simulation/boundExploration';

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

/** The M1 models of the metamodel, in lookup order. */
function modelsOf(lookup: Record<string, any>, metamodelId: string): string[] {
    const out: string[] = [];
    for (const id in lookup) {
        const model = lookup[id];
        if (model?.className === 'DModel' && model.instanceof === metamodelId) out.push(id);
    }
    return out;
}

/** What the Bound proposal reads on the models (R-SIM-81(1) as amended, G12(b)). */
export interface BoundEstimate {
    /** `largestInitialMarking` over the bag's Place class and Initial marking attribute; `null` when either is unset or nothing is read. */
    readonly largestInitial: number | null;
    /**
     * The reachable markings of every model, the cap shared by them all: `closed` only when every model
     * closed, else the end of the first that did not. `null` when the bag makes no net (`netStcFromRoles`).
     */
    readonly exploration: BoundExploration | null;
}

/**
 * The Bound estimate of the models of `metamodelId` under `bag`, the bag as
 * Apply leaves it with the Bound aside (`boundProposalBag`, simRoleStatus.ts).
 * Each model is compiled by the engine's `compileNet` with the bound lifted, so
 * an unset Bound (k = 1) drops no initial marking, and explored with what is
 * left of `cap`.
 */
export function boundEstimate(
    lookup: Record<string, any>, metamodelId: string, bag: Readonly<Record<string, unknown>>, cap: number = BOUND_EXPLORATION_CAP,
): BoundEstimate {
    const node = typeof bag.simNode === 'string' && bag.simNode ? bag.simNode : undefined;
    const marking = typeof bag.simInitialMarking === 'string' && bag.simInitialMarking ? bag.simInitialMarking : undefined;
    const largestInitial = node && marking ? largestInitialMarking(lookup, metamodelId, node, marking) : null;
    const stc = netStcFromRoles({ ...bag });
    if (!stc) return { largestInitial, exploration: null };
    const lifted = { ...stc, bound: Number.MAX_SAFE_INTEGER };
    const view = makeNetModelView(lookup);
    let max = 0;
    let markings = 0;
    for (const modelId of modelsOf(lookup, metamodelId)) {
        if (markings >= cap) return { largestInitial, exploration: { max, end: 'cap', markings } };
        const e = exploreBound(compileNet(lifted, view, modelId, collectModelObjectIds(lookup, modelId)), cap - markings);
        markings += e.markings;
        if (e.max > max) max = e.max;
        if (e.end !== 'closed') return { largestInitial, exploration: { max, end: e.end, markings } };
    }
    return { largestInitial, exploration: { max, end: 'closed', markings } };
}

/**
 * What `boundEstimate` reads from the store, as one string for the panel's
 * selector: the run signature of every model of the metamodel (its objects and
 * slots, the classes, the bag's `sim*` keys; R-SIM-34). A scan of the lookup
 * per model, as `largestInitialMarking` costs; the exploration runs only when
 * this or the bag changes. '' with no model.
 */
export function boundEstimateSignature(lookup: Record<string, any>, metamodelId: string): string {
    return modelsOf(lookup, metamodelId).map(id => runSignature(lookup, id, metamodelId)).join('\n');
}

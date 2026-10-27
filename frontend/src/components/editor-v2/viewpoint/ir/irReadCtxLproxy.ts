/**
 * irReadCtxLproxy — the L-proxy ReadCtx backend and the backend switch.
 *
 * Separated from irReadCtx.ts so the pure draw backend stays importable in
 * node unit tests (importing the joiner drags monaco/window-bound modules).
 */

import { LPointerTargetable } from '../../../../joiner';
import { IR_READ_BACKEND, makeDrawReadCtx, type ReadCtx } from './irReadCtx';
import { getSimPresentation, getSimRun, isSimActive } from '../../sim/simRunState';

type Idlookup = Record<string, any>;

/** Whether a model has a run, Reset to Stop (P-2026-10-19-0930): what `simActive` asks the run-state, by DModel id. */
const hasSimRun = (modelId: string): boolean => getSimRun(modelId) !== undefined;

/**
 * L-proxy backend ('lproxy'): reads through LObject/LValue proxies.
 * Semantic note (spike Fase A finding): the proxy coerces and truncates to
 * upperBound, so single-value reads may differ from raw D-layer reads.
 * Falls back to the draw backend when the proxy throws on stale data.
 */
export function makeLproxyReadCtx(idlookup: Idlookup): ReadCtx {
    const draw = makeDrawReadCtx(idlookup, isSimActive, getSimPresentation, hasSimRun);
    return {
        getValue(elementId, featureName) {
            try {
                const lObj = LPointerTargetable.fromPointer(elementId as any) as any;
                const slot = lObj?.['$' + featureName];
                if (slot === undefined) return undefined;
                return slot.value;
            } catch {
                return draw.getValue(elementId, featureName);
            }
        },
        getValues(elementId, featureName) {
            try {
                const lObj = LPointerTargetable.fromPointer(elementId as any) as any;
                const slot = lObj?.['$' + featureName];
                const vals = slot?.values;
                return Array.isArray(vals) ? vals : draw.getValues(elementId, featureName);
            } catch {
                return draw.getValues(elementId, featureName);
            }
        },
        // Identity, metaclass and reference navigation are structural, not
        // value-coerced: the draw path is canonical (lproxy .value on a reference
        // yields a name/proxy, not the pointer id needed to navigate).
        getName: draw.getName,
        getMetaclassName: draw.getMetaclassName,
        isKindOf: draw.isKindOf,
        getRef: draw.getRef,
        // The marking is not a slot value either: it is the run-state singleton,
        // read identically whichever backend is active (R-MK-4).
        isMarked: draw.isMarked,
        // Presentation too (R-SIM-108): the run's σ, never a slot.
        getPresentation: draw.getPresentation,
        // And whether a run shows the element's model (P-2026-10-19-0930): the walk is structural.
        isRunActive: draw.isRunActive,
    };
}

/**
 * The single injection point of the marking source (R-MK-4) and of the
 * presentation reader (R-SIM-108), and of the run check of `simActive`. This module already imports the joiner, so
 * importing the run-state singleton costs nothing here, while irReadCtx.ts keeps
 * its zero-import contract. The 6 call sites of makeReadCtx are untouched: the
 * dependency is resolved inside, not threaded.
 */
export function makeReadCtx(idlookup: Idlookup): ReadCtx {
    return IR_READ_BACKEND === 'lproxy' ? makeLproxyReadCtx(idlookup) : makeDrawReadCtx(idlookup, isSimActive, getSimPresentation, hasSimRun);
}

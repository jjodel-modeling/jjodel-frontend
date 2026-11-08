/**
 * simDcnRuns — the registry of the DCN runs, by their net (DCN slice 5, lane 2,
 * P-2026-11-08-1905; R-DCN-29).
 *
 * Set by `startDcnRun` (simBridge.ts) and read by the bridge's text readers and
 * by the canvas reader `getSimDcnNode` (simRunState.ts). A module of its own
 * because simBridge imports simRunState: the run-state reads the registry here,
 * with no cycle. Module singleton, weak on the net: a run dropped takes its entry.
 */

import type { DcnNameOf } from '../../../model/simulation/dcn/dcnPanelText';
import type { DcnNucleus, DcnStepModel } from '../../../model/simulation/dcn/dcnStep';

/** What the readers of a DCN run need beyond its net: the step model, the nucleus and the names of the model at Reset. */
export interface DcnRunText {
    readonly model: DcnStepModel;
    readonly nucleus: DcnNucleus;
    readonly nameOf: DcnNameOf;
}

/** The DCN runs by their net, set by `startDcnRun`: the readers taking a net dispatch to the DCN twins through it. */
const dcnRuns = new WeakMap<object, DcnRunText>();

/** Records the DCN part of the run of `net`. */
export function registerDcnRun(net: object, run: DcnRunText): void {
    dcnRuns.set(net, run);
}

/** The DCN part of the run of `net`, `undefined` for a Petri run. */
export function dcnRunOf(net: object): DcnRunText | undefined {
    return dcnRuns.get(net);
}

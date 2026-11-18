/**
 * simDcnRuns — the registry of the DCN runs, by their net (DCN slice 5, lane 2,
 * P-2026-11-08-1905; R-DCN-29).
 *
 * Set by `startDcnRun` (simBridge.ts) and read by the bridge's text readers and
 * by the canvas reader `getSimDcnNode` (simRunState.ts). A module of its own
 * because simBridge imports simRunState: the run-state reads the registry here,
 * with no cycle. Module singleton, weak on the net: a run dropped takes its entry.
 */

import type { DcnCoherenceFailure, DcnCoherenceHit, DcnCompiledCoherence } from '../../../model/simulation/dcn/dcnCoherence';
import type { DcnNameOf } from '../../../model/simulation/dcn/dcnPanelText';
import type { DcnNucleus, DcnStepModel } from '../../../model/simulation/dcn/dcnStep';
import type { NetConfiguration } from '../../../model/simulation/netTypes';
import type { CompiledWatch } from '../../../model/simulation/watchEvaluator';

/** What the fold of the coherence constraints reports at one step. */
export interface DcnCoherenceAt {
    readonly hits: readonly DcnCoherenceHit[];
    readonly failures: readonly DcnCoherenceFailure[];
}

/** The coherence constraints of a run, compiled at Reset (R-DCN-28): the fold's input and one watch row per constraint and instance. */
export interface DcnRunCoherence {
    readonly compiled: DcnCompiledCoherence;
    readonly rows: readonly { readonly instance: string; readonly constraint: string; readonly watch: CompiledWatch }[];
    /** The largest k of the patterns, 0 without one: a step's verdict reads the k + 1 configurations ending at it. */
    readonly reach: number;
    /** σ0, one object, so what the expressions answered on it is remembered. */
    readonly initial: NetConfiguration;
    /** The report of a step, per kept configuration: a configuration has one history. */
    readonly atConfig: WeakMap<NetConfiguration, DcnCoherenceAt>;
}

/** What the readers of a DCN run need beyond its net: the step model, the nucleus and the names of the model at Reset. */
export interface DcnRunText {
    readonly model: DcnStepModel;
    readonly nucleus: DcnNucleus;
    readonly nameOf: DcnNameOf;
    readonly coherence?: DcnRunCoherence;
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

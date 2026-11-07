/**
 * simNucleus — the engine nucleus a run steps with (DCN L4.1, P-2026-11-07-0701; R-DCN-8, R-DCN-11).
 *
 * A run record carries its nucleus beside its net: the initial σ, one step, the
 * structural inputs that grey the buttons (R-SIM-16) and termination. The replay
 * of step back and the slider (`configAt`), the single step and Play's press
 * (`simBridge.ts`) and the Clock's enabling test (`simBoardClock.ts`) call the
 * field; the Petri text readers keep reading `run.net`. The Petri nucleus is the
 * only one and delegates to `netStep.ts`, so a run steps exactly as before; the
 * field keeps the choice of R-DCN-11 reversible (discovery 2026-11-06 §3.2).
 */

import { step, structuralInputs, terminated } from '../../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, DerivedOracle, GuardOracle, NetConfiguration, SimState, StepOutcome,
} from '../../../model/simulation/netTypes';

/** What a run steps with: the signature and result of `netStep.ts`'s functions, the net closed over. */
export interface SimNucleus {
    /** σ at step 0. */
    readonly initial: SimState;
    /** One step (spec §4), as `step(net, ...)`. */
    step(cfg: NetConfiguration, selector: string | null, guards: GuardOracle, actions: ActionOracle, derived?: DerivedOracle): StepOutcome;
    /** The inputs whose button is enabled (R-SIM-16), as `structuralInputs(net, state)`. */
    structuralInputs(state: SimState): { epsilon: boolean; events: ReadonlySet<string> };
    /** As `terminated(net, state)`. */
    terminated(state: SimState): boolean;
}

/** The Petri nucleus over a compiled net: every method delegates to `netStep.ts`. */
export function petriNucleus(net: CompiledNet): SimNucleus {
    return {
        initial: net.initial,
        step: (cfg, selector, guards, actions, derived) => step(net, cfg, selector, guards, actions, derived),
        structuralInputs: state => structuralInputs(net, state),
        terminated: state => terminated(net, state),
    };
}

/** The Petri nucleus of a net without one, built once per net. */
const fallbacks = new WeakMap<CompiledNet, SimNucleus>();

/**
 * The nucleus of a run: its own, the Petri nucleus of its net otherwise, so a
 * record built without the bridge (the tests' literals) steps as before.
 */
export function nucleusOf(run: { readonly net: CompiledNet; readonly nucleus?: SimNucleus }): SimNucleus {
    if (run.nucleus) return run.nucleus;
    let n = fallbacks.get(run.net);
    if (!n) {
        n = petriNucleus(run.net);
        fallbacks.set(run.net, n);
    }
    return n;
}

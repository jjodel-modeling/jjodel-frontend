/**
 * simScenarios — a scenario recorded from the trace of a run and replayed from
 * Reset (R-SIM-139; P-2026-10-05-2315,
 * docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §4, C1, C2).
 *
 * Recording projects the trace to its inputs (`recordScenario`): per committed
 * step the event, the transition taken, the kind and the inputs given, by id; the
 * origin is left out, since a replay presses the transition recorded. A trace of
 * more than `SCENARIO_MAX_STEPS` steps is refused with its reason.
 *
 * The replay (`replayScenario`) is synchronous, not at Play's pace: Reset, then
 * per step the checks of §4 (`checkScenarioStep`) and the press through
 * `pressInput`, the function the panel's buttons call, so a replay commits as a
 * hand does and counts as a run. The checks, in order: the run is Running; the
 * event is still in the model; the input is enabled (`panelInputs` over
 * `structuralInputs`); every input the step reads is given (`inputAsks`, by
 * element id and attribute name, so a renamed declaration diverges there); the
 * recorded transition is a candidate, read with the inputs given, or there is
 * none where none was. After the press, the kind committed is the recorded one.
 * A divergence stops the replay at that step, the run left where it stopped, and
 * says why. The input check comes before the candidates': a guard that reads an
 * input not given has no value to read, and the reason would name the choice.
 *
 * The final condition, `expect`, is read like an invariant on the configuration
 * the replay ends on (watchEvaluator.ts): false fails, a text that does not
 * compile or a value that is not a boolean fails as not readable. Invariants and
 * breakpoints are not read here, so they never stop a replay; the policy is not
 * read either, choices come from the selectors. The caller's `reset` is the
 * panel's Reset, which also keeps the clocks from arming (C2).
 */

import { candidates, structuralInputs } from '../../../model/simulation/netStep';
import { compileWatch, evaluateWatch } from '../../../model/simulation/watchEvaluator';
import type { WatchReading } from '../../../model/simulation/watchEvaluator';
import { encodeScenarios, SCENARIO_MAX_STEPS } from '../../../model/simulation/scenarioCodec';
import type { ScenarioRecord, ScenarioStep, ScenarioStepKind } from '../../../model/simulation/scenarioCodec';
import { candidateLabel, inputAsks, inputLabel, panelInputs, pressInput, runStatus } from './simBridge';
import type { InputLabel, InputPress } from './simBridge';
import { getSimRun, withInputs } from './simRunState';
import type { SimRun } from './simRunState';

type Lookup = Record<string, any>;

/** A recording: the steps of the trace, or why there is none to save. */
export type ScenarioRecording =
    | { readonly kind: 'ok'; readonly steps: ScenarioStep[] }
    | { readonly kind: 'refused'; readonly why: string };

/** The trace of a run projected to its inputs (C1); refused without a run, on an empty trace and past the cap. */
export function recordScenario(run: SimRun | undefined): ScenarioRecording {
    if (!run) return { kind: 'refused', why: 'No run: Reset, then step, then save.' };
    const trace = run.trace ?? [];
    if (trace.length === 0) return { kind: 'refused', why: 'The trace is empty: nothing to save.' };
    if (trace.length > SCENARIO_MAX_STEPS) {
        return { kind: 'refused', why: `The trace has ${trace.length} steps; a scenario keeps ${SCENARIO_MAX_STEPS} at most.` };
    }
    return {
        kind: 'ok',
        steps: trace.map(t => ({
            event: t.event, selector: t.selector, kind: t.kind,
            ...(t.inputs ? { inputs: t.inputs.map(i => ({ element: i.element, attr: i.attr, value: i.value })) } : {}),
        })),
    };
}

/** The name of a new scenario: the first `Scenario n` the model does not hold. */
export function newScenarioName(taken: readonly string[]): string {
    const used = new Set(taken);
    let n = 1;
    while (used.has(`Scenario ${n}`)) n++;
    return `Scenario ${n}`;
}

/** Why the run cannot take the step as the scenario recorded it, `null` when it can: the five checks of §4. */
export function checkScenarioStep(run: SimRun, step: ScenarioStep, lookup: Lookup, label: InputLabel): string | null {
    const status = runStatus(run);
    if (status !== 'Running') return `the run is ${status}`;
    if (step.event !== null && !run.alphabet.includes(step.event)) return `the event ${label(step.event)} is not in the model`;
    const on = panelInputs(status, structuralInputs(run.net, run.config.state));
    if (step.event === null ? !on.epsilon : !on.events.has(step.event)) return `${label(step.event)} is not enabled`;
    const given = step.inputs ?? [];
    const missing = inputAsks(run, step.event).find(a => !given.some(g => g.element === a.element && g.attr === a.attr));
    if (missing) return `the input ${inputLabel(missing, run.net, lookup)} is not given`;
    const reads = step.inputs ? withInputs(run, step.inputs) : run;
    const offered = candidates(run.net, { state: run.config.state, event: step.event }, reads.guards).candidates.map(c => c.transition);
    if (step.selector === null) return offered.length > 0 ? 'a candidate where the scenario had none' : null;
    return offered.includes(step.selector) ? null : `the choice ${candidateLabel(run.net, step.selector, lookup)} is not offered`;
}

/** The result of a replay: passed, failed (the final condition), or diverged at a step, 0 for a Reset that refused. */
export type ScenarioOutcome =
    | { readonly kind: 'passed'; readonly steps: number }
    | { readonly kind: 'failed'; readonly steps: number; readonly why: string }
    | { readonly kind: 'diverged'; readonly at: number; readonly why: string };

export interface ScenarioReplay {
    readonly outcome: ScenarioOutcome;
    /** The last press that committed a step, for the panel's «Last step» line; `null` when none did. */
    readonly last: InputPress | null;
}

/** What a committed step did, in the words of «Last step». */
const DID: Record<ScenarioStepKind, string> = {
    fired: 'fired', halted: 'halted the run', discard: 'was discarded', quiescence: 'had nothing to fire',
};

/** The final condition read like an invariant on the run's configuration, with the M frozen at Reset. */
function finalReading(run: SimRun, text: string, lookup: Lookup): WatchReading {
    const snapshot = run.snapshot;
    if (!snapshot) return { kind: 'defect', short: 'no model frozen at Reset', detail: 'no model frozen at Reset' };
    const nameOf = (id: string): string => (typeof lookup[id]?.name === 'string' && lookup[id].name ? lookup[id].name : id);
    const watch = compileWatch({ name: 'expect', kind: 'invariant', text }, { net: run.net, snapshot, nameOf });
    return evaluateWatch(watch, snapshot, run.net, run.config.state);
}

/**
 * Replays a scenario on a model (C2): `reset` first (the panel's Reset; `null` when the run started, the reason
 * otherwise), then each step checked and pressed through `pressInput`, synchronously; the first divergence stops
 * it there. Then the final condition, when the scenario has one.
 */
export function replayScenario(
    modelId: string, scenario: ScenarioRecord, lookup: Lookup, label: InputLabel, reset: () => string | null,
): ScenarioReplay {
    const refused = reset();
    if (refused !== null) return { outcome: { kind: 'diverged', at: 0, why: refused }, last: null };
    let last: InputPress | null = null;
    for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const run = getSimRun(modelId);
        const why = run ? checkScenarioStep(run, step, lookup, label) : 'no run';
        if (why !== null) return { outcome: { kind: 'diverged', at: i + 1, why }, last };
        const pressed = pressInput(modelId, step.event, step.selector ?? undefined, lookup, label(step.event), step.inputs);
        if (pressed.lastStep !== null) last = pressed;
        const got = pressed.outcome && pressed.outcome.kind !== 'inadmissible' ? pressed.outcome.kind : null;
        if (got !== step.kind) {
            return { outcome: { kind: 'diverged', at: i + 1, why: `the step ${got === null ? 'was not committed' : DID[got]}, not ${step.kind}` }, last };
        }
    }
    const steps = scenario.steps.length;
    if (scenario.expect === undefined) return { outcome: { kind: 'passed', steps }, last };
    const run = getSimRun(modelId);
    const reading: WatchReading = run ? finalReading(run, scenario.expect, lookup) : { kind: 'defect', short: 'no run', detail: 'no run' };
    if (reading.kind === 'defect') return { outcome: { kind: 'failed', steps, why: `the final condition is not readable: ${reading.short}` }, last };
    if (!reading.value) return { outcome: { kind: 'failed', steps, why: `the final condition is false: ${scenario.expect}` }, last };
    return { outcome: { kind: 'passed', steps }, last };
}

/** The last result as the Scenarios section says it. */
export function scenarioResultText(outcome: ScenarioOutcome): string {
    switch (outcome.kind) {
        case 'passed': return `Passed · ${outcome.steps} step${outcome.steps === 1 ? '' : 's'}`;
        case 'failed': return `Failed at step ${outcome.steps}: ${outcome.why}`;
        case 'diverged': return `Diverged at step ${outcome.at}: ${outcome.why}`;
    }
}

/** A scenario's identity for its last result: its stored string, so another scenario under the same name has another. */
export function scenarioKey(scenario: ScenarioRecord): string {
    return encodeScenarios([scenario]);
}

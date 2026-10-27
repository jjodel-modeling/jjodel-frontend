/**
 * scenarioCodec — the scenarios of a model, as its bag stores them (R-SIM-139;
 * P-2026-10-05-2315, docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §4, C1).
 *
 * A scenario is a named sequence of inputs from Reset, the trace of a run
 * projected to what the environment chose: per step the event fired (`null` for
 * ε), the transition taken (`selector`, `null` when none was: a discard or a
 * quiescence), the kind of step committed and the values given to the inputs it
 * read; with an optional final condition, `expect`, a boolean JjEL text read like
 * an invariant on the last configuration, kept inline so that a scenario handed
 * in is self-contained. Elements are named by id, as the trace records them, so a
 * rename keeps the scenario (measured, discovery §4); an input is named by
 * (element id, attribute name), as the I/O board's bindings are (R-SIM-117).
 *
 * The scenarios of a model live in one key of its M1 bag, `runScenarios`, whose
 * value is a JSON string, as `runWatches` is (watchCodec.ts):
 * `{"v":1,"scenarios":[scenario...]}`, a scenario being `name`, `steps`, `expect`
 * when it has one, a step `event`, `selector`, `kind`, `inputs` when it has them,
 * an input `element`, `attr`, `value`, written in that order, so the same
 * scenarios give the same string. The key is not a `sim*` key on purpose:
 * `runSignature` folds every `sim*` key of the model bag (simBridge.ts
 * `modelRunBag`), so a save would interrupt the run it is recorded from.
 *
 * A model with no scenarios has no key, and nothing writes one until a scenario
 * is saved (`scenariosPatch`); a stored list emptied is written `[]`, never
 * removed: the undo of a removed bag key does not restore it (R-SIM-99).
 *
 * At most `SCENARIO_MAX_STEPS` steps a scenario, the bound of the kept
 * configurations and of Play: every save is a project write and an undo entry.
 *
 * Decoding is tolerant, scenario by scenario: a string that is not JSON, or has
 * no `v` 1 and `scenarios` list, is one defect on the key and the list is not
 * readable; a scenario that is not a record, has no name, a name an earlier one
 * holds, steps that are not a list, a step that is not one, more steps than the
 * cap, or an `expect` that is not a text, is a defect of its own and the others
 * decode. Unknown fields are ignored. No VersionFixer step: a project saved before
 * the key has none.
 *
 * Pure: no import.
 */

/** The bag key of the scenarios (C1). */
export const RUN_SCENARIOS_KEY = 'runScenarios';

/** The steps of one scenario at most: `SIM_KEEP_CONFIGS` and `MAX_PLAY_STEPS` of the run (simRunState.ts). */
export const SCENARIO_MAX_STEPS = 1000;

/** The kinds of a committed step, the trace's (simRunState.ts `SimTraceStep`). */
export type ScenarioStepKind = 'fired' | 'halted' | 'discard' | 'quiescence';

export const SCENARIO_STEP_KINDS: readonly ScenarioStepKind[] = ['fired', 'halted', 'discard', 'quiescence'];

/** The value given to one input at one step: the bridge's `InputValue`. */
export interface ScenarioInput {
    readonly element: string;
    readonly attr: string;
    readonly value: boolean | number | string;
}

/** One step of a scenario, by id: what the trace records of it, its origin left out. */
export interface ScenarioStep {
    readonly event: string | null;
    readonly selector: string | null;
    readonly kind: ScenarioStepKind;
    readonly inputs?: readonly ScenarioInput[];
}

/** One scenario as stored: its name, unique in the model; its steps from Reset; its final condition, when it has one. */
export interface ScenarioRecord {
    readonly name: string;
    readonly steps: readonly ScenarioStep[];
    readonly expect?: string;
}

/** Why a stored scenario, or the key, was not read: `index` is the scenario's, `null` for the key. */
export interface ScenarioDefect {
    readonly index: number | null;
    /** The scenario's name when it is readable; `null` otherwise. */
    readonly name: string | null;
    readonly message: string;
}

export interface DecodedScenarios {
    readonly scenarios: ScenarioRecord[];
    readonly defects: ScenarioDefect[];
    /** False when the key itself is not: then there is no scenario and one defect. */
    readonly readable: boolean;
}

const inputOut = (i: ScenarioInput): ScenarioInput => ({ element: i.element, attr: i.attr, value: i.value });

const stepOut = (s: ScenarioStep): ScenarioStep => ({
    event: s.event, selector: s.selector, kind: s.kind, ...(s.inputs !== undefined ? { inputs: s.inputs.map(inputOut) } : {}),
});

/** The one string of the key: `v`, then the list, every record's fields in their fixed order. */
export function encodeScenarios(scenarios: readonly ScenarioRecord[]): string {
    return JSON.stringify({
        v: 1,
        scenarios: scenarios.map(s => ({ name: s.name, steps: s.steps.map(stepOut), ...(s.expect !== undefined ? { expect: s.expect } : {}) })),
    });
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isKind = (v: unknown): v is ScenarioStepKind => v === 'fired' || v === 'halted' || v === 'discard' || v === 'quiescence';
const isIdOrNull = (v: unknown): v is string | null => v === null || typeof v === 'string';
const isValue = (v: unknown): v is boolean | number | string => typeof v === 'boolean' || typeof v === 'string' || (typeof v === 'number' && Number.isFinite(v));

/** One stored step, or why it is not one. */
function decodeStep(item: unknown): ScenarioStep | string {
    if (!isRecord(item)) return 'not a step';
    if (!isIdOrNull(item.event)) return 'the event is neither an id nor null';
    if (!isIdOrNull(item.selector)) return 'the transition is neither an id nor null';
    if (!isKind(item.kind)) return `the kind '${String(item.kind)}' is not a step's`;
    if (item.inputs === undefined) return { event: item.event, selector: item.selector, kind: item.kind };
    if (!Array.isArray(item.inputs)) return 'the inputs are not a list';
    const inputs: ScenarioInput[] = [];
    for (const i of item.inputs) {
        if (!isRecord(i) || typeof i.element !== 'string' || typeof i.attr !== 'string' || !isValue(i.value)) return 'an input is not an element, a name and a value';
        inputs.push({ element: i.element, attr: i.attr, value: i.value });
    }
    return { event: item.event, selector: item.selector, kind: item.kind, inputs };
}

/** The scenarios of the key, in order, and what could not be read. `undefined` and `null` are no key: no scenario, no defect. */
export function decodeScenarios(raw: string | null | undefined): DecodedScenarios {
    if (raw === undefined || raw === null) return { scenarios: [], defects: [], readable: true };
    const unreadable = (message: string): DecodedScenarios => ({ scenarios: [], defects: [{ index: null, name: null, message }], readable: false });
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return unreadable('The scenarios are not JSON.');
    }
    const root = isRecord(parsed) ? parsed : null;
    if (!root || root.v !== 1 || !Array.isArray(root.scenarios)) return unreadable('The scenarios have no version 1 and no list.');
    const scenarios: ScenarioRecord[] = [];
    const defects: ScenarioDefect[] = [];
    const names = new Set<string>();
    root.scenarios.forEach((item, index) => {
        const r = isRecord(item) ? item : null;
        const name = typeof r?.name === 'string' && r.name !== '' ? r.name : null;
        const defect = (message: string) => defects.push({ index, name, message });
        if (!r) return defect('Not a scenario.');
        if (name === null) return defect('No name.');
        if (names.has(name)) return defect(`${name}: the name is taken by an earlier one.`);
        if (!Array.isArray(r.steps)) return defect(`${name}: the steps are not a list.`);
        if (r.steps.length > SCENARIO_MAX_STEPS) return defect(`${name}: ${r.steps.length} steps, more than ${SCENARIO_MAX_STEPS}.`);
        if (r.expect !== undefined && typeof r.expect !== 'string') return defect(`${name}: the final condition is not a text.`);
        const steps: ScenarioStep[] = [];
        for (let i = 0; i < r.steps.length; i++) {
            const step = decodeStep(r.steps[i]);
            if (typeof step === 'string') return defect(`${name}: step ${i + 1}: ${step}.`);
            steps.push(step);
        }
        names.add(name);
        scenarios.push({ name, steps, ...(typeof r.expect === 'string' ? { expect: r.expect } : {}) });
    });
    return { scenarios, defects, readable: true };
}

/**
 * What a save or a delete writes (C1, C3): one `state` assignment holding the key alone, so one `set_state`, one
 * TRANSACTION and one undo step; `null` when there is nothing to write, the list being the stored one, or empty on a
 * model that has no key, which keeps its bytes. `raw` is the key as stored, `null` or `undefined` when absent.
 */
export function scenariosPatch(raw: string | null | undefined, scenarios: readonly ScenarioRecord[]): Record<string, string> | null {
    const absent = raw === undefined || raw === null;
    if (absent && scenarios.length === 0) return null;
    const encoded = encodeScenarios(scenarios);
    return encoded === raw ? null : { [RUN_SCENARIOS_KEY]: encoded };
}

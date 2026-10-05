/**
 * simScenarios — a scenario recorded from the trace and replayed from Reset (R-SIM-139; P-2026-10-05-2315,
 * docs/discovery/discovery_2026-10-05_sim_watches_scenarios_coverage.md §4, C1, C2).
 *
 * Executes the replay (P11) through the bridge's own `startRun` and `pressInput` on raw lookups shaped as the store
 * keeps them, as simBridge.test.ts does, with the JjEL context builder injected. The store is reset before every
 * test. Each test name says which break of the rule kills it; the mutation bench is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import { checkScenarioStep, newScenarioName, recordScenario, replayScenario, scenarioKey, scenarioResultText } from '../simScenarios';
import type { ScenarioOutcome } from '../simScenarios';
import { pressInput, startRun } from '../simBridge';
import type { InputLabel } from '../simBridge';
import { __resetSimRunsForTests, getSimRun, simReset } from '../simRunState';
import { encodeWatches } from '../../../../model/simulation/watchCodec';
import { encodeScenarios, SCENARIO_MAX_STEPS } from '../../../../model/simulation/scenarioCodec';
import type { ScenarioRecord, ScenarioStep } from '../../../../model/simulation/scenarioCodec';

type Lookup = Record<string, any>;

interface Obj { cls: string; slots?: Record<string, unknown[]> }

const CLASSES: Lookup = {
    C_State: { className: 'DClass', name: 'State', extends: [] },
    C_Init: { className: 'DClass', name: 'Init', extends: ['C_State'] },
    C_Final: { className: 'DClass', name: 'Final', extends: ['C_State'] },
    C_Event: { className: 'DClass', name: 'Event', extends: [] },
    C_Trans: { className: 'DClass', name: 'Trans', extends: [] },
    R_out: { className: 'DReference', name: 'out' },
    R_next: { className: 'DReference', name: 'next' },
    R_trigger: { className: 'DReference', name: 'trigger', type: 'C_Event' },
    A_label: { className: 'DAttribute', name: 'label' },
    A_guard: { className: 'DAttribute', name: 'guard' },
};

const ROLES = { simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trigger', simEventIdentifier: 'A_label' };

/** The metamodel MM with the role bag, the model M of it, and the objects, as simBridge.test.ts builds them. */
function buildLookup(bag: Record<string, unknown>, objects: Record<string, Obj>): Lookup {
    const lookup: Lookup = {};
    for (const [id, d] of Object.entries(CLASSES)) lookup[id] = { ...d, id };
    lookup.MM = { className: 'DModel', id: 'MM', name: 'Turn', _state: { ...bag } };
    lookup.M = { className: 'DModel', id: 'M', name: 'turnstile', instanceof: 'MM' };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', id: vid, instanceof: f, values: [...values], father: id };
        }
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: 'M', name: id, features };
    }
    return lookup;
}

/** The turnstile: Locked -coin-> Unlocked -push-> Locked; Locked -push [false]-> Locked, so push at Locked is a discard. */
const TURNSTILE: Record<string, Obj> = {
    Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } },
    Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU'] } },
    coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
    push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
    tCoin: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['coin'], A_guard: ['self.trigger == event'] } },
    tPushU: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'], A_guard: ['true'] } },
    tPushL: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'], A_guard: ['false'] } },
};

/** An ε choice at A every other step: A -t1-> B, A -t2-> C, then B -t3-> A and C -t4-> A. */
const CYCLE: Record<string, Obj> = {
    A: { cls: 'C_Init', slots: { R_out: ['t1', 't2'] } },
    B: { cls: 'C_State', slots: { R_out: ['t3'] } },
    C: { cls: 'C_State', slots: { R_out: ['t4'] } },
    t1: { cls: 'C_Trans', slots: { R_next: ['B'] } },
    t2: { cls: 'C_Trans', slots: { R_next: ['C'] } },
    t3: { cls: 'C_Trans', slots: { R_next: ['A'] } },
    t4: { cls: 'C_Trans', slots: { R_next: ['A'] } },
};

/** S -e1-> D; D -e2 [D.[decision]]-> A, D -e3 [else]-> B; `decision` an input of every State (R-SIM-88), A and B terminal. */
const DECISION = { name: 'decision', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true };
const decisionLookup = (): Lookup => buildLookup({
    ...ROLES, simGuard: 'A_guard', simTerminal: 'C_Final', simStateAttributes: JSON.stringify({ v: 1, attrs: [DECISION] }),
}, {
    S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
    D: { cls: 'C_State', slots: { R_out: ['e2', 'e3'] } },
    A: { cls: 'C_Final' },
    B: { cls: 'C_Final' },
    e1: { cls: 'C_Trans', slots: { R_next: ['D'] } },
    e2: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: ['D.[decision]'] } },
    e3: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: ['else'] } },
});

/** buildEvalContext's record: one handle per object, the reference slots resolved to the handles, every name bound. */
function recordOf(lookup: Lookup) {
    return () => {
        const h: Record<string, any> = {};
        for (const id of Object.keys(lookup)) if (lookup[id].className === 'DObject') h[id] = { id, __type: 'Object', name: id };
        for (const id of Object.keys(h)) {
            for (const vid of lookup[id].features) {
                const v = lookup[vid];
                const name = CLASSES[v.instanceof]?.name;
                if (name) h[id][name] = v.values.length === 1 && typeof v.values[0] === 'string' && h[v.values[0]] ? h[v.values[0]] : v.values[0];
            }
        }
        return { instances: Object.values(h), classes: [], ...h };
    };
}

/** The panel's Reset as the replay calls it: `null` when the run started, the reason otherwise. */
const resetOf = (lookup: Lookup) => (): string | null => {
    const r = startRun(lookup, 'M', 'MM', 'P', () => recordOf(lookup)());
    if (r.kind !== 'started') return r.reason;
    simReset('M', r.run);
    return null;
};

const LABELS: Record<string, string> = { coin: 'Coin', push: 'Push' };
const label: InputLabel = e => (e === null ? 'ε' : LABELS[e] ?? e);
const press = (lookup: Lookup, event: string | null, selector?: string, values?: Array<{ element: string; attr: string; value: boolean }>) =>
    pressInput('M', event, selector, lookup, label(event), values);
const replay = (lookup: Lookup, steps: ScenarioStep[], expectText?: string) =>
    replayScenario('M', { name: 's', steps, ...(expectText !== undefined ? { expect: expectText } : {}) }, lookup, label, resetOf(lookup));
const projected = () => (getSimRun('M')!.trace ?? []).map(t => ({ event: t.event, selector: t.selector, kind: t.kind, ...(t.inputs ? { inputs: t.inputs } : {}) }));
const diverged = (outcome: ScenarioOutcome) => (outcome.kind === 'diverged' ? [outcome.at, outcome.why] : [outcome.kind]);

const COIN: ScenarioStep = { event: 'coin', selector: 'tCoin', kind: 'fired' };
const PUSH_U: ScenarioStep = { event: 'push', selector: 'tPushU', kind: 'fired' };
const PUSH_L: ScenarioStep = { event: 'push', selector: null, kind: 'discard' };

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('recordScenario: the trace projected to its inputs, by id (C1)', () => {
    it('each committed step as event, selector, kind and the inputs given, never the origin; a discard kept (mutants: the origin copied; the discard dropped)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        resetOf(lookup)();
        expect(press(lookup, null).pending).toHaveLength(2);
        press(lookup, null, 't2');
        press(lookup, null);
        expect(getSimRun('M')!.trace![0].origin).toBe('user');
        expect(recordScenario(getSimRun('M'))).toEqual({ kind: 'ok', steps: [{ event: null, selector: 't2', kind: 'fired' }, { event: null, selector: 't4', kind: 'fired' }] });
        const sm = buildLookup(ROLES, TURNSTILE);
        resetOf(sm)();
        press(sm, 'coin');
        press(sm, 'push');
        press(sm, 'push');
        expect(recordScenario(getSimRun('M'))).toEqual({ kind: 'ok', steps: [COIN, PUSH_U, PUSH_L] });
    });

    it('the inputs given are recorded, a copy (mutant: the inputs left out)', () => {
        const lookup = decisionLookup();
        resetOf(lookup)();
        press(lookup, null);
        press(lookup, null, undefined, [{ element: 'D', attr: 'decision', value: false }]);
        const rec = recordScenario(getSimRun('M'));
        expect(rec).toEqual({ kind: 'ok', steps: [{ event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired', inputs: [{ element: 'D', attr: 'decision', value: false }] }] });
        if (rec.kind === 'ok') expect(rec.steps[1].inputs).not.toBe(getSimRun('M')!.trace![1].inputs);
    });

    it('refused with its reason without a run, on an empty trace, and past the cap; at the cap it records (mutants: no cap; the cap off by one)', () => {
        expect(recordScenario(undefined).kind).toBe('refused');
        const lookup = buildLookup(ROLES, TURNSTILE);
        resetOf(lookup)();
        const empty = recordScenario(getSimRun('M'));
        expect(empty.kind === 'refused' && empty.why).toContain('empty');
        const run = getSimRun('M')!;
        const at = recordScenario({ ...run, trace: Array.from({ length: SCENARIO_MAX_STEPS }, () => COIN) });
        expect(at.kind === 'ok' && at.steps.length).toBe(SCENARIO_MAX_STEPS);
        const past = recordScenario({ ...run, trace: Array.from({ length: SCENARIO_MAX_STEPS + 1 }, () => COIN) });
        expect(past.kind === 'refused' && past.why).toContain('1001');
    });
});

describe('replayScenario: synchronous from Reset through pressInput (C2)', () => {
    it('the replay of a recorded trace equals it, step by step and in σ, a discard included (mutant: the steps pressed without their selector)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        resetOf(lookup)();
        for (const e of ['coin', 'push', 'push', 'coin']) press(lookup, e);
        const rec = recordScenario(getSimRun('M'));
        const marking = getSimRun('M')!.config.state.marking;
        if (rec.kind !== 'ok') throw new Error('not recorded');
        const r = replay(lookup, rec.steps);
        expect(r.outcome).toEqual({ kind: 'passed', steps: 4 });
        expect(projected()).toEqual(rec.steps);
        expect(getSimRun('M')!.config.state.marking).toEqual(marking);
        expect(r.last?.lastStep).toBe('Coin: tCoin (Locked → Unlocked) fired');
    });

    it('an ε choice replays the transition recorded, not the first candidate (mutant: the selector dropped, the list taken)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        const steps: ScenarioStep[] = [{ event: null, selector: 't2', kind: 'fired' }, { event: null, selector: 't4', kind: 'fired' }, { event: null, selector: 't1', kind: 'fired' }];
        expect(replay(lookup, steps).outcome).toEqual({ kind: 'passed', steps: 3 });
        expect(projected()).toEqual(steps);
    });

    it('the inputs recorded are given again, and the replay equals the trace (mutant: the inputs not passed to the press)', () => {
        const lookup = decisionLookup();
        const steps: ScenarioStep[] = [{ event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired', inputs: [{ element: 'D', attr: 'decision', value: false }] }];
        expect(replay(lookup, steps).outcome).toEqual({ kind: 'passed', steps: 2 });
        expect(projected()).toEqual(steps);
    });

    it('starts from Reset whatever step the run was at, and Reset is called once (mutant: the replay continues the live run)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        resetOf(lookup)();
        press(lookup, 'coin');
        press(lookup, 'push');
        let resets = 0;
        const reset = () => { resets++; return resetOf(lookup)(); };
        const r = replayScenario('M', { name: 's', steps: [COIN] }, lookup, label, reset);
        expect([r.outcome, resets, getSimRun('M')!.trace]).toEqual([{ kind: 'passed', steps: 1 }, 1, [{ event: 'coin', selector: 'tCoin', kind: 'fired' }]]);
    });

    it('a Reset that refuses diverges at step 0 with its reason, nothing pressed (mutant: the steps pressed on no run)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        const r = replayScenario('M', { name: 's', steps: [COIN] }, lookup, label, () => 'Run not started. nope');
        expect(diverged(r.outcome)).toEqual([0, 'Run not started. nope']);
        expect(r.last).toBeNull();
    });

    it('invariants and breakpoints never stop a replay (C2; mutant: the replay stops at a hit)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        lookup.M._state = { runWatches: encodeWatches([{ name: 'open', kind: 'breakpoint', text: 'Unlocked.[marked]' }, { name: 'never', kind: 'invariant', text: 'false' }]) };
        expect(replay(lookup, [COIN, PUSH_U, COIN, PUSH_U]).outcome).toEqual({ kind: 'passed', steps: 4 });
        expect(getSimRun('M')!.trace).toHaveLength(4);
    });
});

describe('divergence: the replay stops at the step and says why (§4)', () => {
    it('a selector never offered diverges at step 1, and the run stays at Reset (mutant: check 4 dropped)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        const r = replay(lookup, [{ event: null, selector: 't3', kind: 'fired' }]);
        expect(diverged(r.outcome)).toEqual([1, 'the choice t3 is not offered']);
        expect(getSimRun('M')!.trace ?? []).toEqual([]);
    });

    it('a step dropped diverges where the next one is no longer offered (mutant: the steps not checked after the first)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        const r = replay(lookup, [{ event: null, selector: 't2', kind: 'fired' }, { event: null, selector: 't1', kind: 'fired' }]);
        expect(r.outcome.kind === 'diverged' && r.outcome.at).toBe(2);
        expect(getSimRun('M')!.trace).toHaveLength(1);
    });

    it('an event no longer in the model (mutant: check 2 dropped)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        expect(diverged(replay(lookup, [{ event: 'ghost', selector: null, kind: 'discard' }]).outcome)).toEqual([1, 'the event ghost is not in the model']);
    });

    it('an input not enabled (mutant: check 3 dropped)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        expect(diverged(replay(lookup, [COIN, COIN]).outcome)).toEqual([2, 'Coin is not enabled']);
    });

    it('a run that is no longer Running (mutant: check 1 dropped)', () => {
        const lookup = decisionLookup();
        const steps: ScenarioStep[] = [
            { event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired', inputs: [{ element: 'D', attr: 'decision', value: false }] },
            { event: null, selector: null, kind: 'quiescence' },
        ];
        expect(diverged(replay(lookup, steps).outcome)).toEqual([3, 'the run is Terminated']);
    });

    it('a candidate where the scenario had none (mutant: the null selector pressed as a free choice)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        expect(diverged(replay(lookup, [COIN, { event: 'push', selector: null, kind: 'discard' }]).outcome)).toEqual([2, 'a candidate where the scenario had none']);
    });

    it('the input a step reads and the scenario does not give, by (element, name) (mutant: check 5 dropped, the press asks and commits nothing)', () => {
        const lookup = decisionLookup();
        const r = replay(lookup, [{ event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired' }]);
        expect(diverged(r.outcome)).toEqual([2, 'the input D.decision is not given']);
        const renamed = replay(lookup, [{ event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired', inputs: [{ element: 'D', attr: 'choice', value: false }] }]);
        expect(diverged(renamed.outcome)).toEqual([2, 'the input D.decision is not given']);
    });

    it('another value for an input makes the recorded choice not offered: candidates read the inputs given (mutant: candidates read without them)', () => {
        const lookup = decisionLookup();
        const r = replay(lookup, [{ event: null, selector: 'e1', kind: 'fired' }, { event: null, selector: 'e3', kind: 'fired', inputs: [{ element: 'D', attr: 'decision', value: true }] }]);
        expect(diverged(r.outcome)).toEqual([2, 'the choice e3 (D → B) is not offered']);
    });

    it('a committed kind other than the recorded one (mutant: the kind not compared)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        const r = replay(lookup, [{ ...COIN, kind: 'halted' }]);
        expect(diverged(r.outcome)).toEqual([1, 'the step fired, not halted']);
        expect(getSimRun('M')!.trace).toHaveLength(1);
    });

    it('checkScenarioStep answers null for a step the run accepts, the reason otherwise (mutant: the check inverted)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        resetOf(lookup)();
        const run = getSimRun('M')!;
        expect(checkScenarioStep(run, COIN, lookup, label)).toBeNull();
        expect(checkScenarioStep(run, PUSH_L, lookup, label)).toBeNull();
        expect(checkScenarioStep(run, PUSH_U, lookup, label)).toBe('the choice tPushU (Unlocked → Locked) is not offered');
    });
});

describe('the final condition (expect): read like an invariant on the last configuration', () => {
    it('true passes, false fails and says so, a text that does not compile fails as not readable (mutants: expect not read; read on Reset\'s configuration; a defect passing)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        expect(replay(lookup, [COIN], 'Unlocked.[marked]').outcome).toEqual({ kind: 'passed', steps: 1 });
        expect(replay(lookup, [COIN], 'Locked.[marked]').outcome).toEqual({ kind: 'failed', steps: 1, why: 'the final condition is false: Locked.[marked]' });
        const bad = replay(lookup, [COIN], 'model.[nope] > 1').outcome;
        expect(bad.kind === 'failed' && bad.why).toMatch(/^the final condition is not readable: /);
        const notBool = replay(lookup, [COIN], '1 + 1').outcome;
        expect(notBool.kind === 'failed' && notBool.why).toBe('the final condition is not readable: non-boolean: number');
    });

    it('not read when the replay diverged (mutant: a diverged replay reported failed)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        expect(replay(lookup, [COIN, COIN], 'Unlocked.[marked]').outcome.kind).toBe('diverged');
    });
});

describe('the words and the names of the Scenarios section', () => {
    it('the last result as the section says it (mutant: the step or the reason left out)', () => {
        expect(scenarioResultText({ kind: 'passed', steps: 3 })).toBe('Passed · 3 steps');
        expect(scenarioResultText({ kind: 'passed', steps: 1 })).toBe('Passed · 1 step');
        expect(scenarioResultText({ kind: 'failed', steps: 4, why: 'the final condition is false: x' })).toBe('Failed at step 4: the final condition is false: x');
        expect(scenarioResultText({ kind: 'diverged', at: 2, why: 'Coin is not enabled' })).toBe('Diverged at step 2: Coin is not enabled');
    });

    it('a new scenario takes the first free «Scenario n» (mutant: the count of the list, which repeats a name after a delete)', () => {
        expect(newScenarioName([])).toBe('Scenario 1');
        expect(newScenarioName(['Scenario 1', 'Scenario 3'])).toBe('Scenario 2');
        expect(newScenarioName(['Scenario 2'])).toBe('Scenario 1');
    });

    it('a result belongs to the scenario as stored: another scenario under the same name has another key (mutant: the name as the key)', () => {
        const one: ScenarioRecord = { name: 'Scenario 1', steps: [COIN] };
        expect(scenarioKey(one)).toBe(encodeScenarios([one]));
        expect(scenarioKey({ ...one, steps: [COIN, PUSH_U] })).not.toBe(scenarioKey(one));
        expect(scenarioKey({ ...one, expect: 'true' })).not.toBe(scenarioKey(one));
    });
});

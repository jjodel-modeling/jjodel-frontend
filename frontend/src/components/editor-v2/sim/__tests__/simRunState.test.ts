/**
 * simRunState — the run store of step 3b (P-2026-09-25-1103, R-SIM-36).
 *
 * Executes the store (P11) with runs of hand-built nets and outcomes of the real
 * `step` of the core; the store is module-level, so it is reset before every
 * test. Each test name says which break of the rule kills it; the mutation
 * bench is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    __resetSimRunsForTests, configAt, DEFAULT_SIM_POLICY, getSimActiveIds, getSimChoiceVersion, getSimNodeState, getSimPolicy, getSimPresentation,
    getSimRun, getSimVersion, getSimView, isSimActive, isSimPending, MAX_PLAY_STEPS, setSimPolicy, SIM_KEEP_CONFIGS, simClear, simCommit, simReset,
    simSetPending, simSetView, simStepBack, withInputs,
} from '../simRunState';
import type { SimOrigin, SimPolicy, SimRun, SimTraceStep } from '../simRunState';
import { netRunStatus, step } from '../../../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, GuardOracle, HaltReason, NetTransition, SimState, SimValue,
} from '../../../../model/simulation/netTypes';

const TRUE: GuardOracle = () => ({ kind: 'true' });
const NONE: ActionOracle = () => ({ kind: 'ok', assignments: [] });

function tr(id: string, pre: Record<string, number>, post: Record<string, number>, triggers: string[] = []): NetTransition {
    return {
        id, origin: [id],
        preset: Object.entries(pre).map(([place, weight]) => ({ place, weight })),
        postset: Object.entries(post).map(([place, weight]) => ({ place, weight })),
        inhibitors: [], triggers, guardSites: [], elseOf: null, actionSites: [],
    };
}

function mkNet(transitions: NetTransition[], bound = 1): CompiledNet {
    const places = new Set<string>();
    for (const t of transitions) for (const a of [...t.preset, ...t.postset]) places.add(a.place);
    return {
        modelId: 'M', places, transitions, bound, final: null, hasEventRole: transitions.some(t => t.triggers.length > 0),
        attributes: [], declared: new Map(), initial: { marking: new Map(), attrs: new Map(), presentation: new Map() }, defects: [],
    };
}

function st(marking: Record<string, number>): SimState {
    return { marking: new Map(Object.entries(marking)), attrs: new Map(), presentation: new Map() };
}

function mkRun(net: CompiledNet, marking: Record<string, number>, halt: HaltReason | null = null): SimRun {
    return { net, config: { state: st(marking), event: null }, halt, guards: TRUE, actions: NONE, alphabet: [], signature: 'sig' };
}

/** a -t-> b, b -u-> a, a -sink-> (nothing), c -merge-> b; `coin` triggers only tc. */
const NET = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('sink', { s: 1 }, {}), tr('merge', { c: 1 }, { b: 1 }), tr('tc', { e: 1 }, { f: 1 }, ['coin'])]);
const out = (marking: Record<string, number>, selector: string | null, event: string | null = null) =>
    step(NET, { state: st(marking), event }, selector, TRUE, NONE);

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('isSimActive: the derived boolean view, tokens > 0 (R-SIM-11, R-MK-4)', () => {
    it('two tokens are marked, an explicit zero is not, an absent place is not, over every model', () => {
        simReset('M1', mkRun(NET, { p: 2, z: 0 }));
        simReset('M2', mkRun(NET, { q: 1 }));
        expect(isSimActive('p')).toBe(true);
        expect(isSimActive('q')).toBe(true);
        expect(isSimActive('z')).toBe(false);
        expect(isSimActive('r')).toBe(false);
    });

    it('getSimActiveIds: the places with a token, per model, and the union without a model', () => {
        simReset('M1', mkRun(NET, { p: 2, z: 0 }));
        simReset('M2', mkRun(NET, { q: 1 }));
        expect(getSimActiveIds('M1')).toEqual(['p']);
        expect(getSimActiveIds('M3')).toEqual([]);
        expect(getSimActiveIds().sort()).toEqual(['p', 'q']);
    });
});

describe('a run is a record, kept with an empty marking (R-SIM-29, R-SIM-36)', () => {
    it('Not started is no record; a run whose marking empties stays in the store', () => {
        expect(getSimRun('M')).toBeUndefined();
        simReset('M', mkRun(NET, { s: 1 }));
        const fired = out({ s: 1 }, 'sink');
        expect(fired.kind).toBe('fired');
        simCommit('M', fired);
        expect(getSimRun('M')).toBeDefined();
        expect([...getSimRun('M')!.config.state.marking]).toEqual([]);
        expect(isSimActive('s')).toBe(false);
        // control: Stop removes it
        simClear('M');
        expect(getSimRun('M')).toBeUndefined();
    });

    it('a Reset with an empty marking installs a run too', () => {
        simReset('M', mkRun(NET, {}));
        expect(getSimRun('M')).toBeDefined();
    });

    it('fired stores the next configuration; a commit on a model without a run does nothing', () => {
        simReset('M', mkRun(NET, { a: 1 }));
        simCommit('M', out({ a: 1 }, 't'));
        expect(getSimActiveIds('M')).toEqual(['b']);
        const v = getSimVersion();
        simCommit('X', out({ a: 1 }, 't'));
        expect(getSimRun('X')).toBeUndefined();
        expect(getSimVersion()).toBe(v);
    });
});

describe('the version: one bump per committed step (R-MK-6, R-SIM-36)', () => {
    it('Reset +1, fired +1, halted +1; discard, quiescence and a refused selector +0; Stop +1 with a run, +0 without', () => {
        const v0 = getSimVersion();
        simReset('M', mkRun(NET, { a: 1, c: 1 }));
        expect(getSimVersion()).toBe(v0 + 1);

        simCommit('M', out({ a: 1, c: 1 }, 't'));                   // fired: a -> b
        expect(getSimVersion()).toBe(v0 + 2);

        const halted = out({ b: 1, c: 1 }, 'merge');                // a second token on b at k = 1
        expect(halted.kind).toBe('halted');
        simCommit('M', halted);
        expect(getSimVersion()).toBe(v0 + 3);

        const discard = out({ b: 1, c: 1 }, null, 'coin');
        expect(discard.kind).toBe('discard');
        simCommit('M', discard);
        const quiet = out({ b: 1 }, null);
        expect(quiet.kind).toBe('quiescence');
        simCommit('M', quiet);
        const refused = out({ b: 1, c: 1 }, 't');
        expect(refused.kind).toBe('inadmissible');
        simCommit('M', refused);
        expect(getSimVersion()).toBe(v0 + 3);

        simClear('M');
        expect(getSimVersion()).toBe(v0 + 4);
        simClear('M');
        expect(getSimVersion()).toBe(v0 + 4);
    });

    it('a Reset at the same marking still bumps: a new net, maybe a cleared halt', () => {
        simReset('M', mkRun(NET, { a: 1 }));
        const v = getSimVersion();
        simReset('M', mkRun(NET, { a: 1 }));
        expect(getSimVersion()).toBe(v + 1);
    });
});

describe('the halt reason (R-SIM-29): set by a halted step, cleared by Reset, gone with Stop', () => {
    it('halted keeps the marking and records the reason; Reset clears it; Stop removes the run', () => {
        simReset('M', mkRun(NET, { b: 1, c: 1 }));
        simCommit('M', out({ b: 1, c: 1 }, 'merge'));
        const halted = getSimRun('M')!;
        expect(halted.halt).toEqual({ kind: 'unsafe', place: 'b', value: 2, bound: 1 });
        expect(getSimActiveIds('M').sort()).toEqual(['b', 'c']);
        simReset('M', mkRun(NET, { b: 1, c: 1 }));
        expect(getSimRun('M')!.halt).toBeNull();
        simCommit('M', out({ b: 1, c: 1 }, 'merge'));
        expect(getSimRun('M')!.halt).not.toBeNull();
        simClear('M');
        expect(getSimRun('M')).toBeUndefined();
    });
});

describe('the choice channel: the open choice list on the canvas, a second counter (S15 slice A2, R-SIM-33 3c)', () => {
    /** t and u both take the token of a (a conflict, the panel's list); w is not enabled. */
    const CHOICE = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { a: 1 }, { c: 1 }), tr('w', { d: 1 }, { e: 1 })]);

    it('a publish and a clear bump the choice version, never the mark version (killed by bumping the mark counter)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        const v = getSimVersion();
        const c = getSimChoiceVersion();
        simSetPending('M', ['t', 'u']);
        expect(getSimChoiceVersion()).toBe(c + 1);
        simSetPending('M', null);
        expect(getSimChoiceVersion()).toBe(c + 2);
        expect(getSimVersion()).toBe(v);
    });

    it('a clear with no open list does not bump (killed by bumping on every clear)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        const c = getSimChoiceVersion();
        simSetPending('M', null);
        expect(getSimChoiceVersion()).toBe(c);
    });

    it('marks exactly the listed transitions, not every enabled one (killed by marking the enabled set)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t']);
        expect(isSimPending('t')).toBe(true);
        expect(isSimPending('u')).toBe(false);
        expect(isSimPending('w')).toBe(false);
        expect(isSimPending('a')).toBe(false);
    });

    it('a clear removes the mark (killed by a publish that ignores null)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t', 'u']);
        simSetPending('M', null);
        expect(isSimPending('t')).toBe(false);
        expect(isSimPending('u')).toBe(false);
    });

    it('a new list replaces the old one (killed by a publish that adds to the old list)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t']);
        simSetPending('M', ['u']);
        expect(isSimPending('t')).toBe(false);
        expect(isSimPending('u')).toBe(true);
    });

    it('per model: a clear of one model leaves the list of another (killed by one list for every model)', () => {
        simReset('M1', mkRun(CHOICE, { a: 1 }));
        simReset('M2', mkRun(mkNet([tr('x', { p: 1 }, { q: 1 }), tr('y', { p: 1 }, { r: 1 })]), { p: 1 }));
        simSetPending('M1', ['t', 'u']);
        simSetPending('M2', ['x', 'y']);
        simSetPending('M2', null);
        expect(isSimPending('t')).toBe(true);
        expect(isSimPending('x')).toBe(false);
    });

    it('shows only while the model has a run, as the panel list does (killed by dropping the run gate)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t']);
        simClear('M');
        expect(isSimPending('t')).toBe(false);
        // A publish with no run marks nothing, before or after a later Reset.
        simSetPending('M', ['t']);
        expect(isSimPending('t')).toBe(false);
        simReset('M', mkRun(CHOICE, { a: 1 }));
        expect(isSimPending('t')).toBe(false);
    });

    it('Reset, a commit and Stop leave the choice channel to the panel (killed by clearing it inside the mark primitives)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t', 'u']);
        const c = getSimChoiceVersion();
        simCommit('M', step(CHOICE, { state: st({ a: 1 }), event: null }, 't', TRUE, NONE));
        simReset('M', mkRun(CHOICE, { a: 1 }));
        expect(getSimChoiceVersion()).toBe(c);
        expect(isSimPending('t')).toBe(true);
        simClear('M');
        expect(getSimChoiceVersion()).toBe(c);
    });

    it('the test reset clears the lists and the counter (killed by a list that outlives __resetSimRunsForTests)', () => {
        simReset('M', mkRun(CHOICE, { a: 1 }));
        simSetPending('M', ['t']);
        __resetSimRunsForTests();
        simReset('M', mkRun(CHOICE, { a: 1 }));
        expect(isSimPending('t')).toBe(false);
        expect(getSimChoiceVersion()).toBe(0);
    });
});

describe('the trace and the draws of a run (R-SIM-100)', () => {
    /** t and u both take the token of a: a choice; with a on its own place and nothing else, t alone is forced in NET. */
    const CHOICE = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { a: 1 }, { c: 1 }), tr('back', { b: 1 }, { a: 1 }), tr('back2', { c: 1 }, { a: 1 })]);
    const seeded = (net: CompiledNet, marking: Record<string, number>): SimRun => ({ ...mkRun(net, marking), seed: 7, draws: 0, trace: [] });
    const fire = (marking: Record<string, number>, selector: string | null) => step(CHOICE, { state: st(marking), event: null }, selector, TRUE, NONE);

    it('a chosen step records its origin; a forced step none, whatever the caller passed (mutants: origin kept on a forced step; origin dropped)', () => {
        simReset('M', seeded(CHOICE, { a: 1 }));
        simCommit('M', fire({ a: 1 }, 'u'), 'user');                // two candidates: chosen
        simCommit('M', fire({ c: 1 }, 'back2'), 'user');            // one candidate: forced
        simCommit('M', fire({ a: 1 }, 't'), 'random');              // two candidates: drawn
        simCommit('M', fire({ b: 1 }, 'back'));                     // one candidate, no origin given
        const trace = getSimRun('M')!.trace!;
        expect(trace).toEqual<SimTraceStep[]>([
            { event: null, selector: 'u', kind: 'fired', origin: 'user' },
            { event: null, selector: 'back2', kind: 'fired' },
            { event: null, selector: 't', kind: 'fired', origin: 'random' },
            { event: null, selector: 'back', kind: 'fired' },
        ]);
        expect('origin' in trace[1]).toBe(false);
        expect('origin' in trace[3]).toBe(false);
    });

    it('a random choice counts one draw; a user choice, a forced step, a discard count none (mutants: the counter not advanced; advanced on every step)', () => {
        simReset('M', seeded(CHOICE, { a: 1 }));
        simCommit('M', fire({ a: 1 }, 't'), 'random');
        expect(getSimRun('M')!.draws).toBe(1);
        simCommit('M', fire({ b: 1 }, 'back'), 'random');           // forced: nothing was drawn among one
        expect(getSimRun('M')!.draws).toBe(1);
        simCommit('M', fire({ a: 1 }, 'u'), 'user');
        expect(getSimRun('M')!.draws).toBe(1);
        simCommit('M', fire({ c: 1 }, 'back2'));
        simCommit('M', fire({ a: 1 }, 'u'), 'random');
        expect(getSimRun('M')!.draws).toBe(2);
        // the seed is the run's, kept by every commit
        expect(getSimRun('M')!.seed).toBe(7);
    });

    it('a discard and a quiescence are traced, a refused selector is not (mutant: inadmissible appended)', () => {
        simReset('M', seeded(NET, { b: 1 }));
        simCommit('M', out({ b: 1 }, null, 'coin'));                // discard
        simCommit('M', out({ b: 1 }, null));                        // quiescence
        const refused = out({ b: 1 }, 't');
        expect(refused.kind).toBe('inadmissible');
        simCommit('M', refused, 'user');
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([
            { event: 'coin', selector: null, kind: 'discard' },
            { event: null, selector: null, kind: 'quiescence' },
        ]);
    });

    it('a halted step is traced with its origin, and a drawn one counts its draw (mutant: halted left out of the trace)', () => {
        simReset('M', seeded(NET, { b: 1, c: 1 }));
        simCommit('M', out({ b: 1, c: 1 }, 'merge'), 'random');    // forced: merge is the only candidate at {b, c}
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 'merge', kind: 'halted' }]);
        const TWO = mkNet([tr('x', { p: 1 }, { q: 1 }), tr('y', { p: 1 }, { q: 1 })]);
        simReset('M', seeded(TWO, { p: 1, q: 1 }));
        simCommit('M', step(TWO, { state: st({ p: 1, q: 1 }), event: null }, 'y', TRUE, NONE), 'random');
        expect(getSimRun('M')!.halt).not.toBeNull();
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 'y', kind: 'halted', origin: 'random' }]);
        expect(getSimRun('M')!.draws).toBe(1);
    });

    it('a run without the fields gets them at its first commit: a trace of one, zero draws', () => {
        simReset('M', mkRun(NET, { a: 1 }));
        simCommit('M', out({ a: 1 }, 't'));
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 't', kind: 'fired' }]);
        expect(getSimRun('M')!.draws).toBe(0);
        expect(getSimRun('M')!.seed).toBeUndefined();
    });
});

describe('the run policy of a model (R-SIM-101)', () => {
    it('a model without a policy reads the default: Ask, k = 100, at most 1000 (mutant: another default)', () => {
        expect(getSimPolicy('M')).toEqual<SimPolicy>({ choices: 'ask', k: 100 });
        expect(DEFAULT_SIM_POLICY).toEqual<SimPolicy>({ choices: 'ask', k: 100 });
        expect(MAX_PLAY_STEPS).toBe(1000);
    });

    it('per model: a change of one model leaves another at the default (mutant: one policy for every model)', () => {
        setSimPolicy('M1', { choices: 'random', k: 7 });
        expect(getSimPolicy('M1')).toEqual<SimPolicy>({ choices: 'random', k: 7 });
        expect(getSimPolicy('M2')).toEqual<SimPolicy>({ choices: 'ask', k: 100 });
    });

    it('a change keeps what it does not name, and returns the policy stored (mutant: a change replaces the whole policy)', () => {
        setSimPolicy('M', { k: 12 });
        expect(setSimPolicy('M', { choices: 'random' })).toEqual<SimPolicy>({ choices: 'random', k: 12 });
        expect(setSimPolicy('M', { k: 30 })).toEqual<SimPolicy>({ choices: 'random', k: 30 });
        expect(getSimPolicy('M')).toEqual<SimPolicy>({ choices: 'random', k: 30 });
    });

    it('kept across Reset, a commit, Stop and a clear: the run primitives never touch it (mutant: simReset or simClear drop the policy)', () => {
        setSimPolicy('M', { choices: 'random', k: 5 });
        simReset('M', mkRun(NET, { a: 1 }));
        simCommit('M', out({ a: 1 }, 't'));
        simClear('M');
        expect(getSimRun('M')).toBeUndefined();
        expect(getSimPolicy('M')).toEqual<SimPolicy>({ choices: 'random', k: 5 });
        simReset('M', mkRun(NET, { a: 1 }));
        expect(getSimPolicy('M')).toEqual<SimPolicy>({ choices: 'random', k: 5 });
    });

    it('the test reset drops every policy (mutant: the policies outlive __resetSimRunsForTests)', () => {
        setSimPolicy('M', { choices: 'random', k: 5 });
        __resetSimRunsForTests();
        expect(getSimPolicy('M')).toEqual<SimPolicy>({ choices: 'ask', k: 100 });
    });

    it('k is an integer in 1..1000: below clamps to 1, above to 1000, a fraction rounds, not a number keeps the old (mutants: no clamp; NaN stored)', () => {
        expect(setSimPolicy('M', { k: 0 }).k).toBe(1);
        expect(setSimPolicy('M', { k: -40 }).k).toBe(1);
        expect(setSimPolicy('M', { k: 5000 }).k).toBe(1000);
        expect(setSimPolicy('M', { k: 7.6 }).k).toBe(8);
        expect(setSimPolicy('M', { k: Number.NaN }).k).toBe(8);
        expect(setSimPolicy('M', { k: Number.POSITIVE_INFINITY }).k).toBe(8);
        expect(getSimPolicy('M').k).toBe(8);
    });
});

describe('kept configurations and the inputs of a step (R-SIM-106, P-2026-10-03-0040)', () => {
    /** a -t-> b -u-> a: one forced step at a time, for ever. */
    const LOOP = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { a: 1 })]);
    const loop = (n: number): Array<ReturnType<typeof step>> => {
        const outs: Array<ReturnType<typeof step>> = [];
        for (let i = 0; i < n; i++) {
            const run = getSimRun('M')!;
            const o = step(LOOP, run.config, i % 2 === 0 ? 't' : 'u', TRUE, NONE);
            simCommit('M', o);
            outs.push(o);
        }
        return outs;
    };

    it('every stored step keeps its configuration beside the trace; a refused selector keeps none (mutant: a kind left out)', () => {
        simReset('M', mkRun(NET, { b: 1, c: 1 }));
        const discard = out({ b: 1, c: 1 }, null, 'coin');
        const quiet = out({ b: 1 }, null);
        const halted = out({ b: 1, c: 1 }, 'merge');
        expect([discard.kind, quiet.kind, halted.kind]).toEqual(['discard', 'quiescence', 'halted']);
        for (const o of [discard, quiet, out({ b: 1 }, 't'), halted]) simCommit('M', o);
        const run = getSimRun('M')!;
        expect(run.trace).toHaveLength(3);
        expect(run.keptConfigs).toHaveLength(3);
        const nexts = [discard, quiet, halted].map(o => (o.kind === 'inadmissible' ? null : o.next));
        run.keptConfigs!.forEach((c, i) => expect(c).toBe(nexts[i]));
        expect(run.keptConfigs![2]).toBe(run.config);
    });

    it('capped at the last 1000: after 1003 steps the oldest kept is step 4 (mutants: the cap off by one either way)', () => {
        expect(SIM_KEEP_CONFIGS).toBe(1000);
        simReset('M', mkRun(LOOP, { a: 1 }));
        const outs = loop(1003);
        const run = getSimRun('M')!;
        expect(run.trace).toHaveLength(1003);
        expect(run.keptConfigs).toHaveLength(1000);
        const next = (i: number) => { const o = outs[i]; return o.kind === 'inadmissible' ? null : o.next; };
        expect(run.keptConfigs![0]).toBe(next(3));
        expect(run.keptConfigs![999]).toBe(run.config);
    });

    it('the inputs given at a press are recorded on its step, as a copy; a step given none has no field (mutants: dropped; recorded empty)', () => {
        simReset('M', mkRun(LOOP, { a: 1 }));
        const values = [{ element: 'M', attr: 'ask', value: true }];
        simCommit('M', step(LOOP, getSimRun('M')!.config, 't', TRUE, NONE), 'user', values);
        simCommit('M', step(LOOP, getSimRun('M')!.config, 'u', TRUE, NONE), 'user', []);
        simCommit('M', step(LOOP, getSimRun('M')!.config, 't', TRUE, NONE));
        const trace = getSimRun('M')!.trace!;
        expect(trace[0]).toEqual<SimTraceStep>({ event: null, selector: 't', kind: 'fired', inputs: values });
        expect(trace[0].inputs).not.toBe(values);
        expect('inputs' in trace[1]).toBe(false);
        expect('inputs' in trace[2]).toBe(false);
    });

    describe('configAt: a kept configuration, or a replay from net.initial over the trace', () => {
        it('step m is the live configuration, a kept step its kept configuration, step 0 the net\'s initial σ; out of range is null', () => {
            const net = { ...LOOP, initial: st({ a: 1 }) };
            simReset('M', mkRun(net, { a: 1 }));
            loop(3);
            const run = getSimRun('M')!;
            expect(configAt(run, 3)).toBe(run.config);
            expect(configAt(run, 1)).toBe(run.keptConfigs![0]);
            expect(configAt(run, 0)?.state).toBe(net.initial);
            for (const n of [-1, 4, 1.5, Number.NaN]) expect(configAt(run, n)).toBeNull();
        });

        it('a step older than the kept ones is replayed, equal to what was committed (mutant: the replay starts from the live σ)', () => {
            const net = { ...LOOP, initial: st({ a: 1 }) };
            simReset('M', mkRun(net, { a: 1 }));
            const outs = loop(5);
            const run = { ...getSimRun('M')!, keptConfigs: getSimRun('M')!.keptConfigs!.slice(-1) };
            for (const n of [1, 2, 3, 4]) {
                const o = outs[n - 1];
                const replayed = configAt(run, n);
                expect(replayed).not.toBeNull();
                expect([...replayed!.state.marking]).toEqual([...(o.kind === 'inadmissible' ? new Map() : o.next.state.marking)]);
            }
        });

        it('the replay reads the inputs recorded on each step (mutant: the replay ignores the inputs)', () => {
            const ASK = { name: 'ask', metaclass: null, space: 'semantic' as const, domain: { kind: 'boolean' as const }, input: true as const };
            const gated: NetTransition = { ...tr('t', { a: 1 }, { b: 1 }), guardSites: ['g'] };
            const net: CompiledNet = { ...mkNet([gated, tr('u', { b: 1 }, { a: 1 })]), declared: new Map([['M', new Map([['ask', ASK]])]]), initial: st({ a: 1 }) };
            // The guard of t reads the input: true only when the press gave ask = true.
            const guards: GuardOracle = (_site, _event, s) => ({ kind: s.read('M', 'ask') === true ? 'true' : 'false' });
            simReset('M', { ...mkRun(net, { a: 1 }), guards });
            const values = [{ element: 'M', attr: 'ask', value: true }];
            const given = withInputs(getSimRun('M')!, values);
            const fired = step(net, getSimRun('M')!.config, 't', given.guards, given.actions);
            expect(fired.kind).toBe('fired');
            simCommit('M', fired, 'user', values);
            simCommit('M', step(net, getSimRun('M')!.config, 'u', guards, NONE));
            const run = { ...getSimRun('M')!, keptConfigs: [] };
            expect([...configAt(run, 1)!.state.marking]).toEqual([['b', 1]]);
            expect([...configAt(run, 2)!.state.marking]).toEqual([['a', 1]]);
        });

        it('a trace the replay refuses rebuilds nothing: null, never a wrong configuration (mutant: the refused step skipped)', () => {
            const net = { ...LOOP, initial: st({ a: 1 }) };
            simReset('M', mkRun(net, { a: 1 }));
            loop(2);
            const live = getSimRun('M')!;
            const bad = { ...live, keptConfigs: [], trace: [{ event: null, selector: 'u', kind: 'fired' as const }, ...live.trace!.slice(1)] };
            expect(configAt(bad, 1)).toBeNull();
            // a replay that fires where the trace says halted is refused too
            const lied = { ...live, keptConfigs: [], trace: [{ event: null, selector: 't', kind: 'halted' as const }, ...live.trace!.slice(1)] };
            expect(configAt(lied, 1)).toBeNull();
        });
    });
});

describe('the viewed step (R-SIM-106, P-2026-10-03-0040): the canvas reads the shown configuration', () => {
    /** a -t-> b -u-> c -v-> a, each forced. */
    const RING = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { c: 1 }), tr('v', { c: 1 }, { a: 1 })]);
    const go = (selector: string) => simCommit('M', step(RING, getSimRun('M')!.config, selector, TRUE, NONE));
    const twoSteps = () => {
        simReset('M', mkRun({ ...RING, initial: st({ a: 1 }) }, { a: 1 }));
        go('t');
        go('u');
    };

    it('a past step shows its marking to isSimActive, getSimActiveIds and getSimNodeState; getSimRun stays live (mutant: the viewed read falls back to live)', () => {
        twoSteps();
        expect(getSimActiveIds('M')).toEqual(['c']);
        simSetView('M', 1);
        expect(getSimView('M')).toBe(1);
        expect([isSimActive('b'), isSimActive('c')]).toEqual([true, false]);
        expect(getSimActiveIds('M')).toEqual(['b']);
        expect(getSimActiveIds()).toEqual(['b']);
        expect(getSimNodeState('b')?.tokens).toBe(1);
        expect(getSimNodeState('u')?.enabled).toBe(true);
        expect(getSimNodeState('v')).toBeNull();
        expect([...getSimRun('M')!.config.state.marking]).toEqual([['c', 1]]);
        simSetView('M', 0);
        expect(getSimActiveIds('M')).toEqual(['a']);
    });

    it('the setter bumps \'mark\' once per change, never when nothing changes (mutants: no bump; a bump on every call)', () => {
        twoSteps();
        const v = getSimVersion();
        simSetView('M', null);                      // already live
        simSetView('M', 2);                         // the live step is live
        expect(getSimVersion()).toBe(v);
        expect(getSimView('M')).toBeNull();
        simSetView('M', 1);
        expect(getSimVersion()).toBe(v + 1);
        simSetView('M', 1);
        expect(getSimVersion()).toBe(v + 1);
        simSetView('M', 0);
        expect(getSimVersion()).toBe(v + 2);
        simSetView('M', null);                      // Back to live
        expect(getSimVersion()).toBe(v + 3);
        expect(getSimView('M')).toBeNull();
    });

    it('a step out of range, or no run, moves nothing (mutant: an invalid step shown as live or as 0)', () => {
        twoSteps();
        simSetView('M', 1);
        const v = getSimVersion();
        for (const n of [-1, 3, 0.5]) simSetView('M', n);
        expect(getSimView('M')).toBe(1);
        expect(getSimVersion()).toBe(v);
        simSetView('X', 0);
        expect(getSimView('X')).toBeNull();
        expect(getSimVersion()).toBe(v);
    });

    it('one viewed record per (run, step): the enabled set of the viewed configuration is computed once (mutant: a fresh record per read)', () => {
        let asked = 0;
        const counting: GuardOracle = () => { asked++; return { kind: 'true' }; };
        const guarded = mkNet(RING.transitions.map(t => ({ ...t, guardSites: [t.id] })));
        simReset('M', { ...mkRun({ ...guarded, initial: st({ a: 1 }) }, { a: 1 }), guards: counting });
        simCommit('M', step(guarded, getSimRun('M')!.config, 't', counting, NONE));
        simSetView('M', 0);
        asked = 0;
        getSimNodeState('t');
        const once = asked;
        expect(once).toBeGreaterThan(0);
        getSimNodeState('a');
        getSimNodeState('u');
        expect(asked).toBe(once);
    });

    it('a past step of a halted run reads no halt: its candidates are ringed (mutant: the live halt carried into the past)', () => {
        simReset('M', mkRun(NET, { b: 1, c: 1 }));
        simCommit('M', out({ b: 1, c: 1 }, null, 'coin'));       // step 1: a discard, nothing moves
        simCommit('M', out({ b: 1, c: 1 }, 'merge'));            // step 2: halted, unsafe on b
        expect(getSimRun('M')!.halt).not.toBeNull();
        expect(getSimNodeState('merge')).toBeNull();
        simSetView('M', 1);
        expect(getSimNodeState('merge')?.enabled).toBe(true);
    });

    it('any stored commit, Reset and Stop return to live; a refused selector does not (mutant: the view outlives the live step)', () => {
        twoSteps();
        simSetView('M', 1);
        const refused = step(RING, getSimRun('M')!.config, 't', TRUE, NONE);
        expect(refused.kind).toBe('inadmissible');
        simCommit('M', refused);
        expect(getSimView('M')).toBe(1);
        let v = getSimVersion();
        simCommit('M', step(RING, { state: getSimRun('M')!.config.state, event: 'coin' }, null, TRUE, NONE));   // a discard
        expect(getSimView('M')).toBeNull();
        expect(getSimVersion()).toBe(v + 1);
        expect(getSimActiveIds('M')).toEqual(['c']);
        simSetView('M', 1);
        simReset('M', mkRun({ ...RING, initial: st({ a: 1 }) }, { a: 1 }));
        expect(getSimView('M')).toBeNull();
        go('t');
        simSetView('M', 0);
        v = getSimVersion();
        simClear('M');
        expect(getSimView('M')).toBeNull();
        expect(getSimVersion()).toBe(v + 1);
        expect(isSimActive('a')).toBe(false);
    });

    it('per model: viewing one model leaves another live (mutant: one view for every model)', () => {
        twoSteps();
        simReset('M2', mkRun(mkNet([tr('x', { p: 1 }, { q: 1 })]), { q: 1 }));
        simSetView('M', 0);
        expect(getSimView('M2')).toBeNull();
        expect(getSimActiveIds('M2')).toEqual(['q']);
        expect(getSimActiveIds('M')).toEqual(['a']);
    });

    it('after the test reset the new run reads live (declared intent: a stale view is inert, `viewedOf` checks the run record)', () => {
        twoSteps();
        simSetView('M', 0);
        __resetSimRunsForTests();
        twoSteps();
        expect(getSimView('M')).toBeNull();
        expect(getSimActiveIds('M')).toEqual(['c']);
    });
});

describe('getSimPresentation (R-SIM-108): an element\'s presentation on the shown configuration', () => {
    const glow = (marking: Record<string, number>, stored: Record<string, SimValue>, derived: Record<string, SimValue> = {}): SimState => ({
        ...st(marking),
        presentation: new Map([['b', new Map(Object.entries(stored))]]),
        derived: { attrs: new Map(), presentation: new Map([['b', new Map(Object.entries(derived))]]) },
    });

    it('undefined without a run, after Stop, for an element no run knows (mutant: a stale value kept)', () => {
        expect(getSimPresentation('b', 'heat')).toBeUndefined();
        simReset('M', { ...mkRun(NET, {}), config: { state: glow({ a: 1 }, { heat: 1 }), event: null } });
        expect(getSimPresentation('b', 'heat')).toBe(1);
        expect(getSimPresentation('zz', 'heat')).toBeUndefined();
        expect(getSimPresentation('b', 'cold')).toBeUndefined();
        simClear('M');
        expect(getSimPresentation('b', 'heat')).toBeUndefined();
    });

    it('stored then derived, as the engine reads it (mutant: the derived part first)', () => {
        simReset('M', { ...mkRun(NET, {}), config: { state: glow({ a: 1 }, { heat: 0 }, { heat: 9, shade: 'dark' }), event: null } });
        expect(getSimPresentation('b', 'heat')).toBe(0);
        expect(getSimPresentation('b', 'shade')).toBe('dark');
    });

    it('reads the viewed step while one is shown, the live one after (mutant: the reader reads live)', () => {
        const first = glow({ a: 1 }, { heat: 1 });
        const net: CompiledNet = { ...mkNet([tr('t', { a: 1 }, { b: 1 })]), initial: first };
        simReset('M', { ...mkRun(net, {}), config: { state: first, event: null } });
        const actions: ActionOracle = () => ({ kind: 'ok', assignments: [{ element: 'b', attr: 'heat', value: 2 }] });
        const declared = new Map([['b', new Map([['heat', { name: 'heat', metaclass: null, space: 'presentation' as const, domain: null }]])]]);
        const withDecl: CompiledNet = { ...net, declared, transitions: [{ ...net.transitions[0], actionSites: [{ element: 't', role: 'transition' }] }] };
        simCommit('M', step(withDecl, getSimRun('M')!.config, 't', TRUE, actions));
        expect(getSimPresentation('b', 'heat')).toBe(2);
        simSetView('M', 0);
        expect(getSimPresentation('b', 'heat')).toBe(1);
        simSetView('M', null);
        expect(getSimPresentation('b', 'heat')).toBe(2);
    });

    it('reading bumps nothing (R-SIM-108: a reader, never a writer)', () => {
        simReset('M', { ...mkRun(NET, {}), config: { state: glow({ a: 1 }, { heat: 1 }), event: null } });
        const v = getSimVersion();
        getSimPresentation('b', 'heat');
        expect(getSimVersion()).toBe(v);
    });
});

describe('step back (R-SIM-138, P-2026-10-05-2315, S1, S2): a pop over the kept configurations and configAt', () => {
    const RING = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { c: 1 }), tr('v', { c: 1 }, { a: 1 })]);
    const ringRun = () => mkRun({ ...RING, initial: st({ a: 1 }) }, { a: 1 });
    const go = (net: CompiledNet, selector: string | null, event: string | null = null, origin?: SimOrigin) =>
        simCommit('M', step(net, { state: getSimRun('M')!.config.state, event }, selector, TRUE, NONE), origin);
    /** What the panel and the canvas read of a record: configuration, halt, trace, draws, every step's configuration, status; the kept list too unless told. */
    const reading = (run: SimRun, withKept = true) => ({
        config: run.config, halt: run.halt, trace: run.trace ?? [], draws: run.draws ?? 0,
        configs: Array.from({ length: (run.trace?.length ?? 0) + 1 }, (_, n) => configAt(run, n)),
        status: netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt),
        ...(withKept ? { kept: run.keptConfigs ?? [] } : {}),
    });

    it('at every step the pop equals the record one step earlier, a discard included, back to step 0 (mutants: configAt(m) for m - 1; the trace or the kept list not shortened)', () => {
        simReset('M', ringRun());
        const snaps = [getSimRun('M')!];
        for (const [s, e] of [['t', null], [null, 'coin'], ['u', null], ['v', null], ['t', null]] as Array<[string | null, string | null]>) {
            go(RING, s, e);
            snaps.push(getSimRun('M')!);
        }
        expect(snaps[2].trace![1].kind).toBe('discard');
        for (let m = snaps.length - 1; m > 0; m--) {
            expect(simStepBack('M')).toBe(true);
            expect(reading(getSimRun('M')!)).toEqual(reading(snaps[m - 1]));
        }
        expect(simStepBack('M')).toBe(false);
    });

    it('from Terminated, Deadlock and Halted one pop returns to Running (mutants: the halt kept; the status of the popped step kept)', () => {
        const fin: CompiledNet = { ...mkNet([tr('t', { a: 1 }, { b: 1 })]), final: new Set(['b']), initial: st({ a: 1 }) };
        const sink: CompiledNet = { ...mkNet([tr('sink', { s: 1 }, {})]), initial: st({ s: 1 }) };
        const unsafe: CompiledNet = { ...mkNet([tr('t', { a: 1 }, { b: 1 })]), initial: st({ a: 1, b: 1 }) };
        const cases: Array<[CompiledNet, string, Record<string, number>, string]> = [
            [fin, 't', { a: 1 }, 'Terminated'], [sink, 'sink', { s: 1 }, 'Deadlock'], [unsafe, 't', { a: 1, b: 1 }, 'Halted'],
        ];
        for (const [net, selector, marking, after] of cases) {
            simReset('M', mkRun(net, marking));
            go(net, selector);
            const run = getSimRun('M')!;
            expect(netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt)).toBe(after);
            simStepBack('M');
            const back = getSimRun('M')!;
            expect([after, netRunStatus(back.net, back.config, back.alphabet, back.guards, back.halt), back.halt, back.trace]).toEqual([after, 'Running', null, []]);
            expect(back.config.state.marking).toEqual(st(marking).marking);
        }
    });

    it('past the cap every reading equals the record one step earlier; the kept list is one shorter and configAt refills it by replay (S1: no bound; mutant: the pop refused past the cap)', () => {
        simReset('M', ringRun());
        const cycle = ['t', 'u', 'v'];
        let before: SimRun = getSimRun('M')!;
        for (let i = 0; i < SIM_KEEP_CONFIGS + 4; i++) {
            before = getSimRun('M')!;
            go(RING, cycle[i % 3]);
        }
        expect(getSimRun('M')!.keptConfigs).toHaveLength(SIM_KEEP_CONFIGS);
        expect(simStepBack('M')).toBe(true);
        const popped = getSimRun('M')!;
        expect(reading(popped, false)).toEqual(reading(before, false));
        expect(popped.keptConfigs).toHaveLength(SIM_KEEP_CONFIGS - 1);
    });

    it('with nothing kept the pop rebuilds the configuration by replay from net.initial (mutant: the last kept configuration read without configAt)', () => {
        simReset('M', ringRun());
        for (const s of ['t', 'u', 'v', 't']) go(RING, s);
        const four = getSimRun('M')!;
        go(RING, 'u');
        simReset('M', { ...getSimRun('M')!, keptConfigs: [] });
        expect(simStepBack('M')).toBe(true);
        expect(reading(getSimRun('M')!, false)).toEqual(reading(four, false));
        // step 4 is not the initial configuration, so a fallback to net.initial would show
        expect(getSimActiveIds('M')).toEqual(['b']);
    });

    it('draws are not rewound, so a retaken Random choice may differ (S2; mutant: draws minus one for a drawn step)', () => {
        const choice: CompiledNet = { ...mkNet([tr('x', { a: 1 }, { b: 1 }), tr('y', { a: 1 }, { c: 1 })]), initial: st({ a: 1 }) };
        simReset('M', { ...mkRun(choice, { a: 1 }), seed: 7, draws: 0 });
        go(choice, 'y', null, 'random');
        expect([getSimRun('M')!.draws, getSimRun('M')!.trace![0].origin]).toEqual([1, 'random']);
        simStepBack('M');
        expect([getSimRun('M')!.draws, getSimRun('M')!.trace, getSimRun('M')!.seed]).toEqual([1, [], 7]);
    });

    it('a step shown returns to live, and the pop is one bump of the mark version (mutants: the view kept; no bump; two bumps)', () => {
        simReset('M', ringRun());
        go(RING, 't');
        go(RING, 'u');
        simSetView('M', 0);
        const v = getSimVersion();
        simStepBack('M');
        expect(getSimView('M')).toBeNull();
        expect(getSimVersion()).toBe(v + 1);
        expect(getSimActiveIds('M')).toEqual(['b']);
    });

    it('a no-op at step 0 and without a run: the same record, no bump (mutant: the guard at step 0 dropped)', () => {
        expect(simStepBack('M')).toBe(false);
        simReset('M', ringRun());
        const run = getSimRun('M');
        const v = getSimVersion();
        expect(simStepBack('M')).toBe(false);
        expect(getSimRun('M')).toBe(run);
        expect(getSimVersion()).toBe(v);
    });

    it('the same input pressed again after a pop gives the popped record back (R-SIM-138; mutant: the kept list one longer after the pop)', () => {
        simReset('M', ringRun());
        go(RING, 't');
        go(RING, 'u');
        const two = reading(getSimRun('M')!);
        simStepBack('M');
        go(RING, 'u');
        expect(reading(getSimRun('M')!)).toEqual(two);
    });
});

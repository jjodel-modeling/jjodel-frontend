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
    __resetSimRunsForTests, getSimActiveIds, getSimChoiceVersion, getSimRun, getSimVersion, isSimActive, isSimPending, simClear, simCommit,
    simReset, simSetPending,
} from '../simRunState';
import type { SimRun, SimTraceStep } from '../simRunState';
import { step } from '../../../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, GuardOracle, HaltReason, NetTransition, SimState,
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

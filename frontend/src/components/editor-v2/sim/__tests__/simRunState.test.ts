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
    __resetSimRunsForTests, getSimActiveIds, getSimRun, getSimVersion, isSimActive, simClear, simCommit, simReset,
} from '../simRunState';
import type { SimRun } from '../simRunState';
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

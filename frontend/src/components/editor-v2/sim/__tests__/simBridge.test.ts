/**
 * simBridge — Reset, inputs, interruption signature and texts of the panel
 * (step 3b, P-2026-09-25-1103, R-SIM-34..37).
 *
 * Executes the bridge (P11) on raw lookups shaped as the store keeps them
 * (DModel, DObject.features -> DValue { instanceof: feature, values }), with
 * the JjEL context builder injected: a spy that records how it was called and
 * returns a synthetic record, so the guard oracle runs the real `compileGuard`
 * and `evaluateGuard` of step 2 over it. The store is reset before every test.
 * Each test name says which break of the rule kills it; the mutation bench is in
 * the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    candidateLabel, collectModelObjectIds, defectsLine, evalContextFor, haltMessage, panelInputs, pressInput, runSignature, startRun,
} from '../simBridge';
import type { ContextBuilder, PanelInputs } from '../simBridge';
import { __resetSimRunsForTests, getSimActiveIds, getSimRun, getSimVersion, simReset } from '../simRunState';
import { netRunStatus } from '../../../../model/simulation/netStep';
import type { CompiledNet, NetRunStatus, NetTransition } from '../../../../model/simulation/netTypes';

type Lookup = Record<string, any>;

interface Obj {
    cls: string;
    slots?: Record<string, unknown[]>;
    model?: string;
}

const CLASSES: Lookup = {
    C_State: { className: 'DClass', name: 'State', extends: [] },
    C_Init: { className: 'DClass', name: 'Init', extends: ['C_State'] },
    C_Final: { className: 'DClass', name: 'Final', extends: ['C_State'] },
    C_Event: { className: 'DClass', name: 'Event', extends: [] },
    C_Trans: { className: 'DClass', name: 'Trans', extends: [] },
    R_out: { className: 'DReference', name: 'out' },
    R_next: { className: 'DReference', name: 'next' },
    R_trigger: { className: 'DReference', name: 'trigger' },
    A_label: { className: 'DAttribute', name: 'label' },
    A_guard: { className: 'DAttribute', name: 'guard' },
};

const ROLES = {
    simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next',
    simEvent: 'C_Event', simTrigger: 'R_trigger', simEventIdentifier: 'A_label',
};

/** The metamodel MM with the role bag, the model M of it, and the objects (father M unless given). */
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
        lookup[id] = { className: 'DObject', id, instanceof: o.cls, father: o.model ?? 'M', name: id, features };
    }
    return lookup;
}

/** The turnstile of step 1: Locked -coin-> Unlocked -push-> Locked, Locked -push-> Locked. */
const TURNSTILE: Record<string, Obj> = {
    Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } },
    Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU'] } },
    coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
    push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
    tCoin: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['coin'], A_guard: ['self.trigger == event'] } },
    tPushU: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'], A_guard: ['true'] } },
    tPushL: { cls: 'C_Trans', slots: { R_next: ['Locked'], R_trigger: ['push'], A_guard: ['false'] } },
};

/**
 * A synthetic record of `buildEvalContext` for the turnstile: one plain handle
 * per object, the reference slots resolved to the handles themselves (identity,
 * as the real builder does). Built anew per call: the snapshot freezes it.
 */
function turnstileRecord(): Record<string, any> {
    const h: Record<string, any> = {};
    for (const id of Object.keys(TURNSTILE)) h[id] = { id, __type: 'Object', name: id };
    h.coin.label = 'Coin';
    h.push.label = 'Push';
    h.tCoin.trigger = h.coin; h.tCoin.next = h.Unlocked;
    h.tPushU.trigger = h.push; h.tPushU.next = h.Locked;
    h.tPushL.trigger = h.push; h.tPushL.next = h.Locked;
    return { instances: Object.values(h), classes: [] };
}

function spyBuilder(record: () => Record<string, any> = turnstileRecord) {
    const calls: Array<{ context: any; opts: any }> = [];
    const build: ContextBuilder = (context, opts) => {
        calls.push({ context, opts });
        return record();
    };
    return { build, calls };
}

function started(lookup: Lookup, build: ContextBuilder = spyBuilder().build) {
    const r = startRun(lookup, 'M', 'MM', 'P', build);
    if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
    return r.run;
}

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('startRun (R-SIM-37): the context of the model\'s own metamodel, frozen once', () => {
    it('the builder is called once with targetMetamodelId = the model\'s metamodel, scopeBound, and the model as extent', () => {
        const spy = spyBuilder();
        started(buildLookup(ROLES, TURNSTILE), spy.build);
        expect(spy.calls).toHaveLength(1);
        expect(spy.calls[0].context).toMatchObject({ projectId: 'P', modelId: 'M', level: 'M1', targetMetamodelId: 'MM', scopeBound: true });
        expect(spy.calls[0].opts).toEqual({ extentModelId: 'M' });
    });

    it('a model without a metamodel gets no target but stays scope-bound: no fallback to another metamodel', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        delete lookup.M.instanceof;
        expect(evalContextFor(lookup, 'M', '')).toMatchObject({ targetMetamodelId: undefined, scopeBound: true });
        // control: with it, the target is set
        expect(evalContextFor(buildLookup(ROLES, TURNSTILE), 'M', '').targetMetamodelId).toBe('MM');
    });

    it('the turnstile compiles: Locked marked, the alphabet sorted by label, Running without simTerminal (R-SIM-28)', () => {
        const run = started(buildLookup(ROLES, TURNSTILE));
        expect([...run.net.places].sort()).toEqual(['Locked', 'Unlocked']);
        expect([...run.config.state.marking]).toEqual([['Locked', 1]]);
        expect(run.alphabet).toEqual(['coin', 'push']);
        expect(run.halt).toBeNull();
        expect(netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt)).toBe('Running');
    });

    it('refused on incomplete roles and on a record holding an L proxy; the builder is not called for incomplete roles', () => {
        const spy = spyBuilder();
        const { simNextState, ...noNext } = ROLES;
        expect(startRun(buildLookup(noNext, TURNSTILE), 'M', 'MM', 'P', spy.build).kind).toBe('refused');
        expect(spy.calls).toHaveLength(0);
        const proxied = startRun(buildLookup(ROLES, TURNSTILE), 'M', 'MM', 'P', () => ({ instances: [{ id: 'x', __isProxy: true }] } as any));
        expect(proxied.kind === 'refused' && proxied.reason).toMatch(/cannot be frozen/);
        // control: the same roles and a plain record start
        expect(startRun(buildLookup(ROLES, TURNSTILE), 'M', 'MM', 'P', spy.build).kind).toBe('started');
    });

    it('collectModelObjectIds walks father up to the model: objects of another model are not in', () => {
        const lookup = buildLookup(ROLES, { ...TURNSTILE, Other: { cls: 'C_State', model: 'M2' } });
        lookup.M2 = { className: 'DModel', id: 'M2', name: 'other', instanceof: 'MM' };
        expect(collectModelObjectIds(lookup, 'M').sort()).toEqual(Object.keys(TURNSTILE).sort());
        expect(collectModelObjectIds(lookup, 'M2')).toEqual(['Other']);
    });
});

describe('pressInput (R-SIM-35, R-SIM-36): one input, the choice, the commit, the «Last step» line', () => {
    it('one candidate fires at once, and the line names it', () => {
        simReset('M', started(buildLookup(ROLES, TURNSTILE)));
        const lookup = buildLookup(ROLES, TURNSTILE);
        const r = pressInput('M', 'coin', undefined, lookup, 'Coin');
        expect(r.pending).toBeNull();
        expect(getSimActiveIds('M')).toEqual(['Unlocked']);
        expect(r.lastStep).toBe('Coin: tCoin (Locked → Unlocked) fired');
    });

    it('a discard leaves the version unchanged and still changes the «Last step» line (precision A)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        simReset('M', started(lookup));
        const first = pressInput('M', 'coin', undefined, lookup, 'Coin');
        const v = getSimVersion();
        const second = pressInput('M', 'coin', undefined, lookup, 'Coin');   // coin on Unlocked: no transition
        expect(second.outcome?.kind).toBe('discard');
        expect(getSimVersion()).toBe(v);
        expect(second.lastStep).toBe('Coin: discarded, no transition accepted it');
        expect(second.lastStep).not.toBe(first.lastStep);
    });

    it('ε with nothing to fire is a quiescence, reported', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        simReset('M', started(lookup));
        const r = pressInput('M', null, undefined, lookup, 'ε');
        expect(r.outcome?.kind).toBe('quiescence');
        expect(r.lastStep).toBe('ε: nothing to fire');
    });

    it('the guards of the real evaluator decide: tPushL\'s guard is false, so push on Locked is discarded; coin passes its guard', () => {
        const lookup = buildLookup({ ...ROLES, simGuard: 'A_guard' }, TURNSTILE);
        simReset('M', started(lookup));
        expect(pressInput('M', 'push', undefined, lookup, 'Push').outcome?.kind).toBe('discard');
        expect(getSimActiveIds('M')).toEqual(['Locked']);
        expect(pressInput('M', 'coin', undefined, lookup, 'Coin').outcome?.kind).toBe('fired');
        expect(getSimActiveIds('M')).toEqual(['Unlocked']);
        // control: without the guard role push fires tPushL on Locked
        const plain = buildLookup(ROLES, TURNSTILE);
        simReset('M', started(plain));
        expect(pressInput('M', 'push', undefined, plain, 'Push').outcome?.kind).toBe('fired');
    });

    const TWO_WAYS: Record<string, Obj> = {
        A: { cls: 'C_Init', slots: { R_out: ['t1', 't2'] } },
        B: { cls: 'C_State' },
        C: { cls: 'C_State' },
        t1: { cls: 'C_Trans', slots: { R_next: ['B'] } },
        t2: { cls: 'C_Trans', slots: { R_next: ['C'] } },
    };

    it('two candidates come back as a choice with nothing committed; the chosen one fires', () => {
        const lookup = buildLookup(ROLES, TWO_WAYS);
        simReset('M', started(lookup, spyBuilder(() => ({ instances: [] })).build));
        const v = getSimVersion();
        const asked = pressInput('M', null, undefined, lookup, 'ε');
        expect(asked.pending?.map(c => c.transition)).toEqual(['t1', 't2']);
        expect(asked.lastStep).toBeNull();
        expect(getSimVersion()).toBe(v);
        expect(getSimActiveIds('M')).toEqual(['A']);
        const chosen = pressInput('M', null, 't2', lookup, 'ε');
        expect(chosen.pending).toBeNull();
        expect(getSimActiveIds('M')).toEqual(['C']);
        expect(chosen.lastStep).toBe('ε: t2 (A → C) fired');
    });

    it('an unsafe firing halts the run: the reason is stored and the marking kept', () => {
        const MERGE: Record<string, Obj> = {
            A: { cls: 'C_Init', slots: { R_out: ['ta'] } },
            B: { cls: 'C_Init', slots: { R_out: ['tb'] } },
            C: { cls: 'C_State' },
            ta: { cls: 'C_Trans', slots: { R_next: ['C'] } },
            tb: { cls: 'C_Trans', slots: { R_next: ['C'] } },
        };
        const lookup = buildLookup(ROLES, MERGE);
        simReset('M', started(lookup, spyBuilder(() => ({ instances: [] })).build));
        pressInput('M', null, 'ta', lookup, 'ε');
        const r = pressInput('M', null, undefined, lookup, 'ε');   // only tb is left, and C already holds a token
        expect(r.outcome?.kind).toBe('halted');
        expect(r.lastStep).toBe('ε: tb (B → C) halted the run');
        expect(getSimRun('M')!.halt).toEqual({ kind: 'unsafe', place: 'C', value: 2, bound: 1 });
        expect(getSimActiveIds('M').sort()).toEqual(['B', 'C']);
    });

    it('no run, nothing happens', () => {
        expect(pressInput('M', null, undefined, {}, 'ε')).toEqual({ pending: null, lastStep: null, outcome: null });
    });
});

describe('runSignature (R-SIM-34): what a run reads, and only that', () => {
    const base = () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        lookup.V_Locked = { className: 'DVertex', id: 'V_Locked', model: 'Locked', x: 890, y: 100 };
        lookup.M2 = { className: 'DModel', id: 'M2', name: 'other', instanceof: 'MM' };
        lookup.Elsewhere = { className: 'DObject', id: 'Elsewhere', instanceof: 'C_State', father: 'M2', name: 'Elsewhere', features: [] };
        return lookup;
    };
    const sig = (l: Lookup) => runSignature(l, 'M', 'MM');
    const after = (edit: (l: Lookup) => void) => { const l = base(); edit(l); return sig(l); };

    it('an object of the run renamed, a reference retargeted, a role written, a metaclass renamed, the model renamed: changed', () => {
        const s0 = sig(base());
        expect(after(l => { l.Unlocked.name = 'UnlockedX'; })).not.toBe(s0);
        expect(after(l => { l.v_tCoin_R_next.values = ['Locked']; })).not.toBe(s0);
        expect(after(l => { l.MM._state.simBound = '2'; })).not.toBe(s0);
        expect(after(l => { l.C_State.name = 'StateX'; })).not.toBe(s0);
        expect(after(l => { l.M.name = 'fast'; })).not.toBe(s0);
    });

    it('a vertex moved, an object of another model renamed, a non-sim bag key written: unchanged', () => {
        const s0 = sig(base());
        // P12: each edit really changes the lookup it is made on
        const moved = base(); moved.V_Locked.x = 927;
        expect(moved.V_Locked.x).not.toBe(base().V_Locked.x);
        expect(sig(moved)).toBe(s0);
        const other = base(); other.Elsewhere.name = 'Renamed';
        expect(sig(other)).toBe(s0);
        expect(after(l => { l.MM._state.layoutHint = 'x'; })).toBe(s0);
    });

    it('a new object in the run\'s model changes it', () => {
        const s0 = sig(base());
        expect(after(l => { l.Extra = { className: 'DObject', id: 'Extra', instanceof: 'C_State', father: 'M', name: 'Extra', features: [] }; })).not.toBe(s0);
    });
});

describe('the panel\'s texts and gates', () => {
    const lookup = buildLookup(ROLES, TURNSTILE);

    it('haltMessage: one line per reason kind (R-SIM-29)', () => {
        expect(haltMessage({ kind: 'unsafe', place: 'Unlocked', value: 2, bound: 1 }, lookup))
            .toBe('Halted: unsafe. Unlocked would hold 2 tokens; the bound is 1.');
        expect(haltMessage({ kind: 'domain', element: 'Locked', attr: 'visits', value: 9 }, lookup))
            .toBe('Halted: visits of Locked would be 9, outside its domain.');
        expect(haltMessage({ kind: 'double-assignment', element: 'M', attr: 'count' }, lookup))
            .toBe('Halted: count of turnstile is assigned twice in one step.');
        expect(haltMessage({ kind: 'action-defect', site: { element: 'tCoin', role: 'transition' }, detail: 'no such attribute' }, lookup))
            .toBe('Halted: the transition action of tCoin failed: no such attribute.');
    });

    it('panelInputs: the structural inputs while Running; none without a run, Terminated, Deadlock or Halted (R-SIM-29)', () => {
        const structural: PanelInputs = { epsilon: true, events: new Set(['coin']) };
        expect(panelInputs('Running', structural)).toBe(structural);
        for (const s of ['Not started', 'Terminated', 'Deadlock', 'Halted'] as NetRunStatus[]) {
            const got = panelInputs(s, structural);
            expect([s, got.epsilon, got.events.size]).toEqual([s, false, 0]);
        }
        expect(panelInputs('Running', null).epsilon).toBe(false);
    });

    it('candidateLabel: own element then preset → postset; a fused node by its name; weights shown', () => {
        const run = started(lookup);
        expect(candidateLabel(run.net, 'tCoin', lookup)).toBe('tCoin (Locked → Unlocked)');
        const t = (id: string, pre: Record<string, number>, post: Record<string, number>): NetTransition => ({
            id, origin: [id], preset: Object.entries(pre).map(([place, weight]) => ({ place, weight })),
            postset: Object.entries(post).map(([place, weight]) => ({ place, weight })),
            inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [],
        });
        const names: Lookup = { F: { name: 'F' }, p0: { name: 'p0' }, a1: { name: 'a1' }, b1: { name: 'b1' } };
        const net = { ...run.net, transitions: [t('F#e0', { p0: 2 }, { a1: 1, b1: 1 })] } as CompiledNet;
        expect(candidateLabel(net, 'F#e0', names)).toBe('F (p0 ×2 → a1, b1)');
    });

    it('defectsLine: null without defects; the first three and a count', () => {
        const run = started(lookup);
        expect(defectsLine(run.net, lookup)).toBeNull();
        const defects = ['a', 'b', 'c', 'd'].map(e => ({ element: e, code: 'no-target' as const, message: 'the edge has no target' }));
        expect(defectsLine({ ...run.net, defects } as CompiledNet, {}))
            .toBe('4 elements not compiled: a (the edge has no target); b (the edge has no target); c (the edge has no target), and 1 more.');
    });
});

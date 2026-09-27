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
    candidateLabel, collectModelObjectIds, defectsLine, defectsTitle, evalContextFor, haltMessage, haltTitle, inputReason, markingLine, NO_SIM_ACTIONS,
    panelInputs, pressInput, runSignature, startRun, stopReason,
} from '../simBridge';
import type { ContextBuilder, PanelInputs } from '../simBridge';
import { __resetSimRunsForTests, getSimActiveIds, getSimRun, getSimVersion, simReset } from '../simRunState';
import { netRunStatus } from '../../../../model/simulation/netStep';
import type { CompiledNet, NetRunStatus, NetTransition, SimState, SimValue } from '../../../../model/simulation/netTypes';

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
    // Typed to the event class: the event role is derived from it (R-SIM-38).
    R_trigger: { className: 'DReference', name: 'trigger', type: 'C_Event' },
    A_label: { className: 'DAttribute', name: 'label' },
    A_guard: { className: 'DAttribute', name: 'guard' },
};

/** No `simEvent`: the panel no longer writes it, the bridge derives it from the Trigger (R-SIM-38). */
const ROLES = {
    simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next',
    simTrigger: 'R_trigger', simEventIdentifier: 'A_label',
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

    it('the event class is the Trigger\'s type (R-SIM-38): a stale simEvent of another class yields the Trigger\'s events, not its instances', () => {
        const run = started(buildLookup({ ...ROLES, simEvent: 'C_State' }, TURNSTILE));
        expect(run.alphabet).toEqual(['coin', 'push']);
        expect(run.net.hasEventRole).toBe(true);
        expect([...run.net.places].sort()).toEqual(['Locked', 'Unlocked']);
        // the Trigger retyped in the metamodel: the event class follows, with no role rewritten
        const retyped = buildLookup(ROLES, TURNSTILE);
        retyped.R_trigger.type = 'C_State';
        expect(started(retyped).alphabet).toEqual(['Locked', 'Unlocked']);
    });

    it('no Trigger, or a Trigger with no class type: no event role, ε only, whatever simEvent the bag still holds', () => {
        const { simTrigger, ...noTrigger } = ROLES;
        const cleared = started(buildLookup({ ...noTrigger, simEvent: 'C_Event' }, TURNSTILE));
        expect([cleared.alphabet, cleared.net.hasEventRole]).toEqual([[], false]);
        const untyped = buildLookup({ ...ROLES, simEvent: 'C_Event' }, TURNSTILE);
        delete untyped.R_trigger.type;
        const run = started(untyped);
        expect([run.alphabet, run.net.hasEventRole]).toEqual([[], false]);
        // control: the same bag with the typed Trigger has events
        expect(started(buildLookup({ ...ROLES, simEvent: 'C_Event' }, TURNSTILE)).alphabet).toEqual(['coin', 'push']);
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
        expect(after(l => { l.R_trigger.type = 'C_State'; })).not.toBe(s0);
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
        // a stale simEvent is not read by the run (R-SIM-38): writing one changes nothing
        const stale = base(); stale.MM._state.simEvent = 'C_State';
        expect(stale.MM._state.simEvent).toBe('C_State');
        expect(sig(stale)).toBe(s0);
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

    it('candidateLabel: an empty side reads ∅, one or both (R-SIM-82, G11; mutant 6: an empty side printed blank)', () => {
        const run = started(lookup);
        const t = (id: string, pre: string[], post: string[]): NetTransition => ({
            id, origin: [id], preset: pre.map(place => ({ place, weight: 1 })), postset: post.map(place => ({ place, weight: 1 })),
            inhibitors: [], triggers: [], guardSites: [], elseOf: null, actionSites: [],
        });
        const names: Lookup = { t3: { name: 't3' }, t4: { name: 't4' }, t: { name: 't' }, L: { name: 'lock' } };
        const net = { ...run.net, transitions: [t('t3', ['L'], []), t('t4', [], ['L']), t('t', [], [])] } as CompiledNet;
        expect(candidateLabel(net, 't3', names)).toBe('t3 (lock → ∅)');
        expect(candidateLabel(net, 't4', names)).toBe('t4 (∅ → lock)');
        expect(candidateLabel(net, 't', names)).toBe('t (∅ → ∅)');
    });

    describe('markingLine (R-SIM-82, G3): the marking, then the stored σ, then the derived σ', () => {
        type Values = Record<string, Record<string, SimValue>>;
        const byElement = (v: Values) => new Map(Object.entries(v).map(([e, a]) => [e, new Map(Object.entries(a))]));
        const sigma = (marking: Record<string, number>, attrs: Values = {}, presentation: Values = {}, derived?: { attrs?: Values; presentation?: Values }): SimState => ({
            marking: new Map(Object.entries(marking)), attrs: byElement(attrs), presentation: byElement(presentation),
            ...(derived ? { derived: { attrs: byElement(derived.attrs ?? {}), presentation: byElement(derived.presentation ?? {}) } } : {}),
        });
        const names: Lookup = { M: { name: 'demo' }, P1x: { name: 'p1' }, P2x: { name: 'p2' }, P3x: { name: 'p3' }, T1x: { name: 't1' } };
        const net = { modelId: 'M' };

        it('places by name, ×n above one only; a global stored then a global derived (mutant 2: ×1 printed)', () => {
            const got = markingLine(sigma({ P3x: 1, P2x: 2 }, { M: { coins: 2 } }, {}, { attrs: { M: { paid: true } } }), net, names);
            expect(got.line).toBe('Marking: p2 ×2, p3 · coins = 2, paid = true');
            expect(got.title).toBe(got.line);
        });

        it('a place with 0 tokens is not listed (mutant 1)', () => {
            expect(markingLine(sigma({ P1x: 0, P2x: 1 }), net, names).line).toBe('Marking: p2');
        });

        it('an empty marking reads ∅; no attribute, no « · » (mutant 3)', () => {
            expect(markingLine(sigma({}), net, names).line).toBe('Marking: ∅');
            expect(markingLine(sigma({}, { P2x: {} }, {}, { attrs: {} }), net, names).line).toBe('Marking: ∅');
        });

        it('an element attribute by element.attr, globals first, each group by element then attribute; derived after stored', () => {
            const got = markingLine(
                sigma({}, { P2x: { seen: true }, M: { coins: 0 }, P1x: { z: 1, a: 2 } }, {}, { attrs: { M: { alarm: false } } }), net, names);
            expect(got.line).toBe('Marking: ∅ · coins = 0, p1.a = 2, p1.z = 1, p2.seen = true, alarm = false');
        });

        it('presentation values stay out, stored and derived alike (mutant 4)', () => {
            const got = markingLine(
                sigma({ P2x: 1 }, {}, { T1x: { color: 'red' } }, { presentation: { T1x: { shade: 'dark' } } }), net, names);
            expect(got.line).toBe('Marking: p2');
        });
    });

    it('defectsLine: null without defects; the first three and a count', () => {
        const run = started(lookup);
        expect(defectsLine(run.net, lookup)).toBeNull();
        const defects = ['a', 'b', 'c', 'd'].map(e => ({ element: e, code: 'no-target' as const, message: 'the edge has no target' }));
        expect(defectsLine({ ...run.net, defects } as CompiledNet, {}))
            .toBe('4 defects: a (the edge has no target); b (the edge has no target); c (the edge has no target), and 1 more.');
    });
});

describe('guards read σ in the run (wave B2, P-2026-09-26-1105, R-SIM-30, R-SIM-43)', () => {
    /** Petri roles: places, transitions, arcs, the initial marking as an integer feature, k = 3. */
    const PETRI_ROLES = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
        simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard',
    };

    /** p1 (3 tokens) -a1-> t1 -a2-> p2, the guard of t1 given. */
    function petriLookup(guard: string): Lookup {
        const lookup = buildLookup(PETRI_ROLES, {
            p1: { cls: 'C_Place', slots: { A_tokens: [3] } },
            p2: { cls: 'C_Place' },
            t1: { cls: 'C_PTr', slots: { A_guard: [guard] } },
            a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'] } },
            a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
        });
        for (const id of ['C_Place', 'C_PTr', 'C_Arc']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        return lookup;
    }

    /** The record of `buildEvalContext` for the net: pool handles, instance names bound at the top. */
    function petriRecord(): Record<string, any> {
        const h: Record<string, any> = {};
        for (const id of ['p1', 'p2', 't1', 'a1', 'a2']) h[id] = { id, __type: 'Object', name: id };
        return { instances: Object.values(h), classes: [], ...h };
    }

    const press = (lookup: Lookup) => pressInput('M', null, undefined, lookup, 'ε');
    const tokensOf = () => Object.fromEntries([...getSimRun('M')!.config.state.marking].sort());

    it('`p2.[tokens] < 2` on t1: after two firings t1 leaves the candidates, the label says false, the run is in Deadlock', () => {
        const lookup = petriLookup('p2.[tokens] < 2');
        const run = started(lookup, spyBuilder(petriRecord).build);
        simReset('M', run);
        const first = press(lookup);
        expect(first.outcome?.kind).toBe('fired');
        expect(first.outcome?.label.evaluated).toEqual([{ transition: 't1', outcome: { kind: 'true' } }]);
        expect(press(lookup).outcome?.kind).toBe('fired');
        expect(tokensOf()).toEqual({ p1: 1, p2: 2 });
        const third = press(lookup);
        expect(third.outcome?.kind).toBe('quiescence');
        expect(third.outcome?.label.candidates).toEqual([]);
        expect(third.outcome?.label.evaluated).toEqual([{ transition: 't1', outcome: { kind: 'false' } }]);
        const now = getSimRun('M')!;
        expect(netRunStatus(now.net, now.config, now.alphabet, now.guards, now.halt)).toBe('Deadlock');
    });

    it('`p2.[marked]` on t1: t1 waits for a token on p2, so the run is in Deadlock at once', () => {
        const lookup = petriLookup('p2.[marked]');
        const run = started(lookup, spyBuilder(petriRecord).build);
        expect(netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt)).toBe('Deadlock');
        simReset('M', run);
        expect(press(lookup).outcome?.label.evaluated).toEqual([{ transition: 't1', outcome: { kind: 'false' } }]);
        expect(tokensOf()).toEqual({ p1: 3 });
    });

    it('an undeclared attribute and node are defects in the label, never a candidate', () => {
        for (const guard of ['p2.[visits] > 0', 'node.[x] > 0', 't1.[tokens] == 0']) {
            const lookup = petriLookup(guard);
            simReset('M', started(lookup, spyBuilder(petriRecord).build));
            const r = press(lookup);
            expect([guard, r.outcome?.kind, r.outcome?.label.evaluated[0]?.outcome.kind]).toEqual([guard, 'quiescence', 'defect']);
        }
    });

    it('the action oracle of the run is NO_SIM_ACTIONS when no action role is bound (R-SIM-69, mutant 10)', () => {
        expect(started(petriLookup('true'), spyBuilder(petriRecord).build).actions).toBe(NO_SIM_ACTIONS);
        // control: with an action role bound the run has an oracle of its own
        const bound = petriLookup('true');
        bound.MM._state.simAction = 'A_guard';
        expect(started(bound, spyBuilder(petriRecord).build).actions).not.toBe(NO_SIM_ACTIONS);
    });
});

describe('why an input has no candidate (P-2026-09-26-1315, R-SIM-57..63)', () => {
    /** Petri roles with an inhibitor class, k = 3. */
    const PETRI = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simInhibitorArc: 'C_Inh', simArcSource: 'R_src',
        simArcTarget: 'R_tgt', simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard',
    };

    function petri(objects: Record<string, Obj>): Lookup {
        const lookup = buildLookup(PETRI, objects);
        for (const id of ['C_Place', 'C_PTr', 'C_Arc', 'C_Inh']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        return lookup;
    }

    /** b2net: p1 (3 tokens) -a1-> t1 -a2-> p2, the guard of t1 given. */
    const b2net = (guard: string) => petri({
        p1: { cls: 'C_Place', slots: { A_tokens: [3] } },
        p2: { cls: 'C_Place' },
        t1: { cls: 'C_PTr', slots: { A_guard: [guard] } },
        a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'] } },
        a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
    });

    /** The record of `buildEvalContext`: one handle per object of the model, instance names bound at the top. */
    const recordOf = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: id };
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup, record: () => Record<string, any> = recordOf(lookup)) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(record).build);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    const LABELS: Record<string, string> = { coin: 'Coin', push: 'Push' };
    const label = (e: string | null) => (e === null ? 'ε' : LABELS[e] ?? e);
    const eps = (lookup: Lookup) => pressInput('M', null, undefined, lookup, 'ε');
    const why = (lookup: Lookup) => stopReason(getSimRun('M'), lookup, label, 'A_guard');

    /** R-SIM-59: a reason for every input exactly when `netRunStatus` says Deadlock. */
    function agrees(lookup: Lookup): void {
        const run = getSimRun('M')!;
        const status = netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);
        const r = why(lookup);
        expect([status, r !== null]).toEqual([status, status === 'Deadlock']);
        if (r) expect(r.inputs.map(i => i.event)).toEqual([null, ...run.alphabet]);
    }

    it('b2net `p2.[tokens] < 2`: no reason while t1 fires; after two firings the reason is t1 false on the current marking (mutant: the configuration of the last label)', () => {
        const lookup = b2net('p2.[tokens] < 2');
        reset(lookup);
        agrees(lookup);
        expect(why(lookup)).toBeNull();
        eps(lookup);
        agrees(lookup);
        eps(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: t1 false');
        expect(r.inputs.map(i => i.short)).toEqual(['ε: t1 false']);
        expect(r.title).toBe('ε: t1 (p1 → p2) false [p2.[tokens] < 2]');
        expect(r.inputs[0].detail).toBe('ε: t1 (p1 → p2) false');
    });

    it('b2net after Reset, the three defects of the ticket: parse error, E-NODE, an undeclared attribute, each named by its short form', () => {
        const cases: Array<[string, string, string]> = [
            ['a b', "ε: t1 defect, parse error 1:3 Unexpected 'b' after the end of the expression", "[a b]"],
            ['node.[x] > 0', 'ε: t1 defect, E-NODE', 'E-NODE: `node` is presentation state'],
            ['p2.[visits] > 0', "ε: t1 defect, 'visits' is not a state attribute of p2", "'visits' is not a state attribute of p2 [p2.[visits] > 0]"],
        ];
        for (const [guard, line, inTitle] of cases) {
            const lookup = b2net(guard);
            reset(lookup);
            agrees(lookup);
            const r = why(lookup)!;
            expect([guard, r.line]).toEqual([guard, line]);
            expect([guard, r.title.includes(inTitle), r.title.includes('JjelEvaluationError')]).toEqual([guard, true, false]);
        }
    });

    it('a fused fork whose second outgoing edge has a false guard names that edge, not the fork (mutant: the transition outcome, not the sites)', () => {
        const lookup = buildLookup({ ...ROLES, simFork: 'C_Fork', simGuard: 'A_guard' }, {
            S: { cls: 'C_Init', slots: { R_out: ['e0'] } },
            F: { cls: 'C_Fork', slots: { R_out: ['e1', 'e2'] } },
            A: { cls: 'C_State' },
            B: { cls: 'C_State' },
            e0: { cls: 'C_Trans', slots: { R_next: ['F'], A_guard: ['true'] } },
            e1: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: ['true'] } },
            e2: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: ['false'] } },
        });
        lookup.C_Fork = { className: 'DClass', id: 'C_Fork', name: 'Fork', extends: [] };
        reset(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: e2 false');
        expect(r.title).toBe('ε: F (S → A, B): e2 false [false]');
    });

    it('else: a true sibling leaves no reason; a defective sibling is named by the else, its detail said once (mutant: the else repeats it)', () => {
        const flow = (g: string) => buildLookup({ ...ROLES, simGuard: 'A_guard', simTerminal: 'C_Final' }, {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
            D: { cls: 'C_State', slots: { R_out: ['e2', 'e3'] } },
            A: { cls: 'C_Final' },
            B: { cls: 'C_Final' },
            e1: { cls: 'C_Trans', slots: { R_next: ['D'] } },
            e2: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: [g] } },
            e3: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: ['else'] } },
        });
        const good = flow('true');
        reset(good);
        eps(good);
        agrees(good);
        expect(why(good)).toBeNull();
        expect(inputReason(getSimRun('M'), null, good, label)).toBeNull();

        const bad = flow('model.nope > 0');
        reset(bad);
        eps(bad);
        agrees(bad);
        const r = why(bad)!;
        expect(r.line).toBe("ε: e2 defect, 'nope' does not exist; e3 else, e2 is defective");
        expect(r.title.split("'nope' does not exist").length - 1).toBe(1);
    });

    it('an inhibitor names its place by name, never by id (mutant: the id printed)', () => {
        const lookup = petri({
            pa: { cls: 'C_Place', slots: { A_tokens: [1] } },
            pb: { cls: 'C_Place', slots: { A_tokens: [1] } },
            pc: { cls: 'C_Place' },
            tq: { cls: 'C_PTr' },
            x1: { cls: 'C_Arc', slots: { R_src: ['pb'], R_tgt: ['tq'] } },
            x2: { cls: 'C_Arc', slots: { R_src: ['tq'], R_tgt: ['pc'] } },
            h1: { cls: 'C_Inh', slots: { R_src: ['pa'], R_tgt: ['tq'] } },
        });
        lookup.pa.name = 'Alpha';
        reset(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: tq inhibited by Alpha');
        expect(r.title).toBe('ε: tq (pb → pc) inhibited by Alpha');
    });

    it('turnstile in Running: Push has no candidate and says why; Coin has one and says nothing; pressing Push names the false guard (mutants: a reason for an input with a candidate; the old discard wording)', () => {
        const lookup = buildLookup({ ...ROLES, simGuard: 'A_guard' }, TURNSTILE);
        reset(lookup, turnstileRecord);
        agrees(lookup);
        const run = getSimRun('M');
        expect(inputReason(run, 'coin', lookup, label)).toBeNull();
        expect(inputReason(run, 'push', lookup, label, 'A_guard')).toEqual({
            event: 'push', short: 'Push: tPushL false', detail: 'Push: tPushL (Locked → Locked) false',
            full: 'Push: tPushL (Locked → Locked) false [false]',
        });
        expect(why(lookup)).toBeNull();
        const pressed = pressInput('M', 'push', undefined, lookup, 'Push');
        expect(pressed.outcome?.kind).toBe('discard');
        expect(pressed.lastStep).toBe('Push: discarded, tPushL false');
    });

    it('turnstile in Deadlock: an input with nothing enabled says so, never a defect; the defective one comes first in the line (mutant: an empty list reported as a defect)', () => {
        const objects = { ...TURNSTILE, tPushU: { ...TURNSTILE.tPushU, slots: { ...TURNSTILE.tPushU.slots, A_guard: ['self.[visits] > 0'] } } };
        const lookup = buildLookup({ ...ROLES, simGuard: 'A_guard' }, objects);
        reset(lookup, turnstileRecord);
        pressInput('M', 'coin', undefined, lookup, 'Coin');
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.inputs.map(i => i.short)).toEqual([
            'ε: nothing enabled', 'Coin: nothing enabled', "Push: tPushU defect, 'visits' is not a state attribute of tPushU",
        ]);
        expect(r.line).toBe("Push: tPushU defect, 'visits' is not a state attribute of tPushU");
    });

    it('no reason in Terminated, Halted and Not started (mutant: a reason in Terminated)', () => {
        expect(stopReason(undefined, {}, label)).toBeNull();

        const flow = buildLookup({ ...ROLES, simTerminal: 'C_Final' }, {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
            F: { cls: 'C_Final' },
            e1: { cls: 'C_Trans', slots: { R_next: ['F'] } },
        });
        reset(flow);
        eps(flow);
        const done = getSimRun('M')!;
        expect(netRunStatus(done.net, done.config, done.alphabet, done.guards, done.halt)).toBe('Terminated');
        agrees(flow);
        expect(why(flow)).toBeNull();

        const MERGE: Record<string, Obj> = {
            A: { cls: 'C_Init', slots: { R_out: ['ta'] } },
            B: { cls: 'C_Init', slots: { R_out: ['tb'] } },
            C: { cls: 'C_State' },
            ta: { cls: 'C_Trans', slots: { R_next: ['C'] } },
            tb: { cls: 'C_Trans', slots: { R_next: ['C'] } },
        };
        const merge = buildLookup(ROLES, MERGE);
        reset(merge);
        pressInput('M', null, 'ta', merge, 'ε');
        eps(merge);
        expect(getSimRun('M')!.halt?.kind).toBe('unsafe');
        agrees(merge);
        expect(why(merge)).toBeNull();
    });

    it('compileDefects: parse-error and E-NODE, never false, an exception or a non-boolean (mutants: run-time defects listed; always empty)', () => {
        const defectsOf = (guard: string) => {
            const lookup = b2net(guard);
            const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(recordOf(lookup)).build);
            if (r.kind !== 'started') throw new Error(r.reason);
            return (r.compileDefects ?? []).map(d => [d.element, d.role, d.reason, d.source]);
        };
        expect(defectsOf('a b')).toEqual([['t1', 'guard', 'parse-error', 'a b']]);
        expect(defectsOf('node.[x] > 0')).toEqual([['t1', 'guard', 'subset', 'node.[x] > 0']]);
        for (const guard of ['false', 'p2.[visits] > 0', '1 + 1', 'p2.[tokens] < 2']) expect([guard, defectsOf(guard)]).toEqual([guard, []]);
    });

    it('the defects line says «defect» for net and guard defects alike, never «not compiled» (mutant: the old wording for a guard)', () => {
        const lookup = b2net('node.[x] > 0');
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(recordOf(lookup)).build);
        if (r.kind !== 'started') throw new Error(r.reason);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: t1 guard (E-NODE).');
        const net = { ...r.run.net, defects: [{ element: 'f1', code: 'no-target' as const, message: 'the edge has no target' }] } as CompiledNet;
        expect(defectsLine(net, lookup, r.compileDefects)).toBe('2 defects: f1 (the edge has no target); t1 guard (E-NODE).');
        expect(defectsTitle(net, lookup, r.compileDefects)).toBe(
            'f1: the edge has no target\nt1 guard: E-NODE: `node` is presentation state: a guard cannot depend on it (R-SIM-18). [node.[x] > 0]');
        expect(defectsLine(r.run.net, lookup, [])).toBeNull();
    });
});

describe('lane C1: declared state attributes and the action keys in the run (P-2026-09-26-2340, R-SIM-67..71)', () => {
    /** Petri roles of cnet with the three action roles: `Action [0..*]` features of PTrans and of Place. */
    const C_ROLES = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
        simInitialMarking: 'A_tokens', simBound: '3', simAction: 'A_actions', simEntry: 'A_entry', simExit: 'A_exit',
    };
    const VISITS = { name: 'visits', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' };
    const COLOR = { name: 'color', metaclass: 'C_PTr', space: 'presentation', domain: null, initial: "'grey'" };
    const F = { name: 'f', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' };

    interface Cnet {
        t1?: unknown[];
        p1Exit?: unknown[];
        p2Entry?: unknown[];
        /** The records of `simStateAttributes`, or the raw value of the key. */
        decls?: unknown[] | string;
        roles?: Record<string, unknown>;
    }

    /**
     * cnet: p1 (3 tokens) -a1-> t1 -a2-> p2, the ids unlike the names (`P1x`,
     * `T1x`, `P2x`), so a pointer printed in a line shows.
     */
    function cnet(c: Cnet = {}): Lookup {
        const bag: Record<string, unknown> = { ...C_ROLES, ...(c.roles ?? {}) };
        if (c.decls !== undefined) bag.simStateAttributes = typeof c.decls === 'string' ? c.decls : JSON.stringify({ v: 1, attrs: c.decls });
        const lookup = buildLookup(bag, {
            P1x: { cls: 'C_Place', slots: { A_tokens: [3], ...(c.p1Exit ? { A_exit: c.p1Exit } : {}) } },
            P2x: { cls: 'C_Place', slots: c.p2Entry ? { A_entry: c.p2Entry } : {} },
            T1x: { cls: 'C_PTr', slots: c.t1 ? { A_actions: c.t1 } : {} },
            a1: { cls: 'C_Arc', slots: { R_src: ['P1x'], R_tgt: ['T1x'] } },
            a2: { cls: 'C_Arc', slots: { R_src: ['T1x'], R_tgt: ['P2x'] } },
        });
        for (const id of ['C_Place', 'C_PTr', 'C_Arc']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        lookup.P1x.name = 'p1';
        lookup.P2x.name = 'p2';
        lookup.T1x.name = 't1';
        lookup.M.name = 'cnet';
        return lookup;
    }

    /** The record of `buildEvalContext`: one handle per object, instance names bound at the top. */
    const record = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        const byName = Object.fromEntries(Object.values(h).map(x => [x.name, x]));
        return { instances: Object.values(h), classes: [], ...byName };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(record(lookup)).build);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    const eps = (lookup: Lookup) => pressInput('M', null, undefined, lookup, 'ε');
    const status = () => {
        const run = getSimRun('M')!;
        return netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);
    };
    const FEATURES = { action: 'A_actions', entry: 'A_entry', exit: 'A_exit' };

    it('the Petri sites are exit of the preset, the transition, entry of the postset; never an arc (mutant 9)', () => {
        const lookup = cnet({ decls: [VISITS, F] });
        // an arc carrying a value of the action feature is not a site: it never runs
        lookup.a1.features.push('v_a1_A_actions');
        lookup.v_a1_A_actions = { className: 'DValue', id: 'v_a1_A_actions', instanceof: 'A_actions', values: ['model.[f] := true'], father: 'a1' };
        const r = reset(lookup);
        expect(r.run.net.transitions.map(t => t.actionSites)).toEqual([[
            { element: 'P1x', role: 'exit' }, { element: 'T1x', role: 'transition' }, { element: 'P2x', role: 'entry' },
        ]]);
        const out = eps(lookup).outcome;
        expect(out?.kind).toBe('fired');
        expect(out?.label.assignments).toEqual([]);
    });

    it('the table reads every value of the slot by role, in order, blanks skipped (mutant 8: the first value only)', () => {
        const lookup = cnet({
            decls: [VISITS, F], t1: ['p2.[visits] := 1', '', '  ', 'model.[f] := true'], p1Exit: ['p1.[visits] := 2'],
        });
        reset(lookup);
        const out = eps(lookup);
        expect(out.outcome?.kind).toBe('fired');
        expect(out.outcome?.label.assignments).toEqual([
            { element: 'P1x', attr: 'visits', value: 2 }, { element: 'P2x', attr: 'visits', value: 1 }, { element: 'M', attr: 'f', value: true },
        ]);
    });

    it('declared only: fired, the line unchanged, its title lists the assignments by name', () => {
        const lookup = cnet({ decls: [VISITS, F], t1: ['p2.[visits] := p2.[visits] + 1', 'model.[f] := true'] });
        const r = reset(lookup);
        expect(r.compileDefects).toEqual([]);
        const out = eps(lookup);
        expect(out.lastStep).toBe('ε: t1 (p1 → p2) fired');
        expect(out.lastStepTitle).toBe('ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1, cnet.f = true');
        expect(getSimRun('M')!.config.state.attrs.get('P2x')?.get('visits')).toBe(1);
        // control: a step that assigns nothing has no assignments in its title
        const plain = cnet({ decls: [VISITS] });
        reset(plain);
        expect(eps(plain).lastStepTitle).toBe('ε: t1 (p1 → p2) fired');
    });

    it('an undeclared target: a defect at Reset naming the element, the transition stays a candidate, Step halts with the name, never the pointer (mutants 4, 5)', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] := p2.[visits] + 1', 'p1.[count] := 1'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'undeclared']]);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe("1 defect: t1 action (undeclared 'count' on p1).");
        expect(defectsTitle(r.run.net, lookup, r.compileDefects)).toBe("t1 action: 'count' is not declared on p1 [p1.[count] := 1]");
        expect(status()).toBe('Running');
        const out = eps(lookup);
        expect(out.outcome?.kind).toBe('halted');
        const halt = getSimRun('M')!.halt!;
        expect(halt).toEqual({ kind: 'undeclared', site: { element: 'T1x', role: 'transition' }, element: 'P1x', attr: 'count' });
        const line = haltMessage(halt, lookup, FEATURES);
        expect(line).toBe("Halted: the transition action of t1 failed: 'count' is not declared on p1.");
        expect(line).not.toMatch(/P1x|T1x/);
        expect(haltTitle(halt, lookup, FEATURES)).toBe(`${line} [p1.[count] := 1]`);
        expect(out.lastStep).toBe('ε: t1 (p1 → p2) halted the run');
    });

    it('a compile-time action defect keeps the transition a candidate: a parse error at Reset, then the halt when it fires (mutant 4)', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] :='] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason, d.source])).toEqual([['T1x', 'action', 'parse-error', 'p2.[visits] :=']]);
        expect(r.run.net.transitions.map(t => t.id)).toEqual(['T1x']);
        expect(status()).toBe('Running');
        expect(eps(lookup).outcome?.kind).toBe('halted');
        expect(getSimRun('M')!.halt?.kind).toBe('action-defect');
    });

    it('E-NODE on a semantic right-hand side is a defect at Reset, and halts when it fires (mutant 11)', () => {
        const lookup = cnet({ decls: [VISITS, COLOR], t1: ['p2.[visits] := node.[color]'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'subset']]);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: t1 action (E-NODE).');
        expect(eps(lookup).outcome?.kind).toBe('halted');
        // control: the presentation assignment reads its own presentation, no defect
        const ok = cnet({ decls: [VISITS, COLOR], t1: ["node.[color] := 'red'"] });
        expect(reset(ok).compileDefects).toEqual([]);
        expect(eps(ok).outcome?.kind).toBe('fired');
    });

    it('a double target across sites: a defect at Reset for the transition, then the halt «assigned twice»', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] := p2.[visits] + 1'], p2Entry: ['p2.[visits] := 1'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'double-assignment']]);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: t1 action (visits of p2 assigned twice).');
        eps(lookup);
        expect(haltMessage(getSimRun('M')!.halt!, lookup, FEATURES)).toBe('Halted: visits of p2 is assigned twice in one step.');
        // control: distinct targets on the same sites fire
        const distinct = cnet({ decls: [VISITS], t1: ['p2.[visits] := 2'], p2Entry: ['p1.[visits] := 1'] });
        expect(reset(distinct).compileDefects).toEqual([]);
        expect(eps(distinct).outcome?.kind).toBe('fired');
    });

    it('locality: a defect at Reset; the halt line carries no action source, the title does (R-SIM-62, R-SIM-70)', () => {
        const lookup = cnet({ decls: [VISITS, COLOR], t1: ["t1.[color] := 'red'"] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'locality']]);
        eps(lookup);
        const halt = getSimRun('M')!.halt!;
        expect(halt.kind).toBe('action-defect');
        const line = haltMessage(halt, lookup, FEATURES);
        expect(line).toBe("Halted: the transition action of t1 failed: 'color' is a presentation attribute: only node.[color] assigns it.");
        expect(haltTitle(halt, lookup, FEATURES)).toBe(`${line} [t1.[color] := 'red']`);
    });

    it('an action that fails to evaluate: the halt line without the error class, the source in the title (R-SIM-82, G10; mutant 5)', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] := p2.[nosuch]'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        eps(lookup);
        const halt = getSimRun('M')!.halt!;
        expect(halt.kind).toBe('action-defect');
        const line = haltMessage(halt, lookup, FEATURES);
        expect(line).toBe("Halted: the transition action of t1 failed: 'nosuch' is not a state attribute of p2.");
        expect(haltTitle(halt, lookup, FEATURES)).toBe(`${line} [p2.[visits] := p2.[nosuch]]`);
        // without the features the source is not found: the detail as given, the class still out of it
        expect(haltMessage({ kind: 'action-defect', site: { element: 'T1x', role: 'transition' }, detail: "JjelEvaluationError: 'x' is not a state attribute of p2" }, lookup))
            .toBe("Halted: the transition action of t1 failed: 'x' is not a state attribute of p2.");
    });

    it('a value outside its domain is a run-time halt only: no defect at Reset', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] := 9'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        eps(lookup);
        expect(haltMessage(getSimRun('M')!.halt!, lookup, FEATURES)).toBe('Halted: visits of p2 would be 9, outside its domain.');
    });

    it('a target that reads σ is not judged at Reset; the run halts on it (report H4)', () => {
        const lookup = cnet({ decls: [VISITS, F], t1: ['(if model.[f] then p1 else p2).[count] := 1'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        eps(lookup);
        expect(getSimRun('M')!.halt).toMatchObject({ kind: 'undeclared', element: 'P2x', attr: 'count' });
    });

    it('declaration defects at Reset, in the one line: a record, the key, the compiler\'s (mutant 6 through the bridge)', () => {
        const over = cnet({ decls: [{ ...VISITS, initial: '7' }], t1: ['p2.[visits] := 1'] });
        const r = reset(over);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['visits', 'declaration', 'declaration']]);
        expect(defectsLine(r.run.net, over, r.compileDefects)).toBe('1 defect: visits (initial 7 outside 0..3).');
        expect(defectsTitle(r.run.net, over, r.compileDefects)).toBe('visits: initial 7 outside 0..3');

        const key = cnet({ decls: '{"v":1,"attrs":[' });
        const k = reset(key);
        expect(defectsLine(k.run.net, key, k.compileDefects)).toBe('1 defect: state attributes (not JSON).');

        const rec = cnet({ decls: [VISITS, { ...F, space: 'visual' }, { name: 3 }] });
        const d = reset(rec);
        expect(defectsLine(d.run.net, rec, d.compileDefects)).toBe('2 defects: f (bad space); record 3 (no name).');

        const noDomain = cnet({ decls: [VISITS, { ...VISITS, metaclass: null, name: 'x', domain: null }] });
        const n = reset(noDomain);
        expect(defectsLine(n.run.net, noDomain, n.compileDefects)).toBe('1 defect: x (semantic without a domain).');
    });

    it('the three sources in the one line, in the order guard, action, declaration', () => {
        const lookup = cnet({ decls: [{ ...VISITS, initial: '7' }], t1: ['p1.[count] := 1'], roles: { simGuard: 'A_guard' } });
        lookup.T1x.features.push('v_T1x_A_guard');
        lookup.v_T1x_A_guard = { className: 'DValue', id: 'v_T1x_A_guard', instanceof: 'A_guard', values: ['a b'], father: 'T1x' };
        const r = reset(lookup);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe(
            "3 defects: t1 guard (parse error 1:3 Unexpected 'b' after the end of the expression); t1 action (undeclared 'count' on p1); visits (initial 7 outside 0..3).");
    });

    it('the entry of a place is named as its site in the line', () => {
        const lookup = cnet({ decls: [VISITS], p2Entry: ['p2.[count] := 1'] });
        const r = reset(lookup);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe("1 defect: p2 entry (undeclared 'count' on p2).");
    });

    it('runSignature reads simStateAttributes: a declaration edited interrupts the run (mutant 12)', () => {
        const a = cnet({ decls: [VISITS] });
        const b = cnet({ decls: [{ ...VISITS, initial: '1' }] });
        expect(runSignature(a, 'M', 'MM')).not.toBe(runSignature(b, 'M', 'MM'));
        // control: the same declarations, the same signature
        expect(runSignature(a, 'M', 'MM')).toBe(runSignature(cnet({ decls: [VISITS] }), 'M', 'MM'));
    });

    describe('lane C2: derived attributes in the run (P-2026-09-27-0200, R-SIM-73..76)', () => {
        const TOTAL = { name: 'total', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 6 }, equation: 'p1.[visits] + p2.[visits]' };
        const derived = (name: string, equation: string, domain: unknown = { kind: 'range', min: 0, max: 9 }) =>
            ({ name, metaclass: null, space: 'semantic', domain, equation });
        const BUMP = 'p2.[visits] := p2.[visits] + 1';

        it('Reset evaluates the derived values on the initial σ; Step recomputes them, and the title of «Last step» lists them after the assignments', () => {
            const lookup = cnet({ decls: [VISITS, TOTAL], t1: [BUMP] });
            const r = reset(lookup);
            expect(r.compileDefects).toEqual([]);
            expect(r.run.config.state.derived?.attrs.get('M')?.get('total')).toBe(0);
            const out = eps(lookup);
            expect(out.lastStep).toBe('ε: t1 (p1 → p2) fired');
            expect(out.lastStepTitle).toBe('ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1\nderived: cnet.total = 1');
            expect(getSimRun('M')!.config.state.derived?.attrs.get('M')?.get('total')).toBe(1);
        });

        it('no derived declared: no oracle and no derived part, the title as in C1 (mutant 8)', () => {
            const lookup = cnet({ decls: [VISITS], t1: [BUMP] });
            const r = reset(lookup);
            expect(r.run.derived).toBeUndefined();
            expect(r.run.config.state).not.toHaveProperty('derived');
            const out = eps(lookup);
            expect(out.lastStepTitle).toBe('ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1');
            expect(getSimRun('M')!.config.state).not.toHaveProperty('derived');
            // control: one derived declaration installs it
            expect(reset(cnet({ decls: [VISITS, TOTAL] })).run.derived).toBeTypeOf('function');
        });

        it('a guard reads a derived value through the unchanged accessor: t1 stops when total reaches 2', () => {
            const lookup = cnet({ decls: [VISITS, TOTAL], t1: [BUMP], roles: { simGuard: 'A_guard' } });
            lookup.T1x.features.push('v_T1x_A_guard');
            lookup.v_T1x_A_guard = { className: 'DValue', id: 'v_T1x_A_guard', instanceof: 'A_guard', values: ['model.[total] < 2'], father: 'T1x' };
            expect(reset(lookup).compileDefects).toEqual([]);
            expect(eps(lookup).outcome?.kind).toBe('fired');
            expect(eps(lookup).outcome?.kind).toBe('fired');
            expect(status()).toBe('Deadlock');
        });

        it('the equation defects at Reset, by the declaration\'s name; the source only in the title (R-SIM-62)', () => {
            const cycle = cnet({ decls: [VISITS, derived('a', 'model.[b] + 1'), derived('b', 'model.[a]')] });
            const c = reset(cycle);
            expect(defectsLine(c.run.net, cycle, c.compileDefects)).toBe('2 defects: a (equation cycle: a → b → a); b (equation cycle: b → a → b).');
            expect(defectsTitle(c.run.net, cycle, c.compileDefects)).toBe(
                'a: equation cycle: a → b → a [model.[b] + 1]\nb: equation cycle: b → a → b [model.[a]]');

            const roots = cnet({ decls: [VISITS, COLOR, derived('e', 'event == null', { kind: 'boolean' }), { ...derived('s', 'node.[color] == 1'), metaclass: 'C_PTr' }, derived('p', '1 +')] });
            const d = reset(roots);
            expect(defectsLine(d.run.net, roots, d.compileDefects)).toBe('3 defects: e (the equation reads event); s (E-NODE); p (parse error 1:4 Expected expression).');
            expect(defectsTitle(d.run.net, roots, d.compileDefects)?.split('\n')[1]).toMatch(/^s: E-NODE: .* \[node\.\[color\] == 1\]$/);
        });

        it('an action on a derived target: read-only at Reset, then the halt names it; the source in the title only (mutant 7 through the bridge)', () => {
            const lookup = cnet({ decls: [VISITS, TOTAL], t1: ['model.[total] := 5'] });
            const r = reset(lookup);
            expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'read-only']]);
            expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe("1 defect: t1 action (assigns derived 'total').");
            expect(status()).toBe('Running');
            expect(eps(lookup).outcome?.kind).toBe('halted');
            const halt = getSimRun('M')!.halt!;
            expect(halt).toEqual({ kind: 'read-only', site: { element: 'T1x', role: 'transition' }, element: 'M', attr: 'total' });
            const line = haltMessage(halt, lookup, FEATURES);
            expect(line).toBe("Halted: the transition action of t1 failed: 'total' is derived and cannot be assigned.");
            expect(haltTitle(halt, lookup, FEATURES, r.run.net)).toBe(`${line} [model.[total] := 5]`);
            expect(getSimRun('M')!.config.state.derived?.attrs.get('M')?.get('total')).toBe(0);
        });

        it('a failing equation nobody reads: a defect at Reset with the value absent, the run starts, and the first step halts (strict)', () => {
            const lookup = cnet({ decls: [VISITS, derived('q', 'p1.[visits] / 0')], t1: [BUMP] });
            const r = reset(lookup);
            expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: q (cnet.q failed: the value is null, not a boolean, a number or a string).');
            expect(r.run.config.state.derived).toBeDefined();
            expect(r.run.config.state.derived?.attrs.get('M')?.get('q')).toBeUndefined();
            expect(status()).toBe('Running');
            eps(lookup);
            const halt = getSimRun('M')!.halt!;
            expect(halt).toEqual({ kind: 'derived', element: 'M', attr: 'q', detail: 'the value is null, not a boolean, a number or a string' });
            const line = haltMessage(halt, lookup, FEATURES);
            expect(line).toBe("Halted: derived 'q' of cnet failed: the value is null, not a boolean, a number or a string.");
            expect(haltTitle(halt, lookup, FEATURES, r.run.net)).toBe(`${line} [p1.[visits] / 0]`);
        });

        it('an evaluation error: the error class out of the line, the element by name, never by id', () => {
            const lookup = cnet({ decls: [VISITS, { ...derived('bad', 'self.[nosuch]'), metaclass: 'C_Place' }] });
            const r = reset(lookup);
            expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe("1 defect: bad (p1.bad failed: 'nosuch' is not a state attribute of p1).");
            expect(defectsLine(r.run.net, lookup, r.compileDefects)).not.toMatch(/P1x|JjelEvaluationError/);
        });

        it('out of domain: at Reset a defect with the value kept; after a step the halt domain, its equation in the title', () => {
            const low = cnet({ decls: [VISITS, { ...TOTAL, domain: { kind: 'range', min: 1, max: 6 } }] });
            const l = reset(low);
            expect(defectsLine(l.run.net, low, l.compileDefects)).toBe('1 defect: total (cnet.total = 0 outside 1..6).');
            expect(l.run.config.state.derived?.attrs.get('M')?.get('total')).toBe(0);

            const tight = cnet({ decls: [VISITS, { ...TOTAL, domain: { kind: 'range', min: 0, max: 0 } }], t1: [BUMP] });
            const t = reset(tight);
            expect(t.compileDefects).toEqual([]);
            eps(tight);
            const halt = getSimRun('M')!.halt!;
            expect(halt).toEqual({ kind: 'domain', element: 'M', attr: 'total', value: 1 });
            const line = haltMessage(halt, tight, FEATURES);
            expect(line).toBe('Halted: total of cnet would be 1, outside its domain.');
            expect(haltTitle(halt, tight, FEATURES, t.run.net)).toBe(`${line} [p1.[visits] + p2.[visits]]`);
            expect(getSimRun('M')!.config.state.attrs.get('P2x')?.get('visits')).toBe(0);
        });

        it('markingLine on the run: Reset, a fired step, and a halt that keeps the σ it halted on (R-SIM-82, G3)', () => {
            const lookup = cnet({ decls: [VISITS, F, TOTAL], t1: [BUMP] });
            const r = reset(lookup);
            const line = () => markingLine(getSimRun('M')!.config.state, r.run.net, lookup).line;
            expect(line()).toBe('Marking: p1 ×3 · f = false, p1.visits = 0, p2.visits = 0, total = 0');
            expect(eps(lookup).outcome?.kind).toBe('fired');
            expect(line()).toBe('Marking: p1 ×2, p2 · f = false, p1.visits = 0, p2.visits = 1, total = 1');

            const tight = cnet({ decls: [VISITS, { ...TOTAL, domain: { kind: 'range', min: 0, max: 0 } }], t1: [BUMP] });
            const t = reset(tight);
            expect(eps(tight).outcome?.kind).toBe('halted');
            expect(markingLine(getSimRun('M')!.config.state, t.run.net, tight).line).toBe('Marking: p1 ×3 · p1.visits = 0, p2.visits = 0, total = 0');
        });
    });
});

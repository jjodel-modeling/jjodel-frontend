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

import { beforeEach, describe, it, expect, vi } from 'vitest';
import {
    acceptingMark, candidateLabel, choiceHead, collectModelObjectIds, defectsLine, defectsTitle, evalContextFor, haltMessage, haltTitle, inputAsks, inputLabel, inputReason,
    markingChips, markingLine, modelDataPatch, modelDataRows, newGlobalRow, NO_SIM_ACTIONS, outputLine, panelInputs, playPress, playStopLine, playTick, pressInput,
    pressRandom, pressStep, runSignature, runStatus, startRun, statusLine, stopReason, undeclaredGlobals, watchRows,
} from '../simBridge';
import type { ContextBuilder, PanelInputs, PlayStop, RunStart } from '../simBridge';
import {
    __resetSimRunsForTests, configAt, getSimActiveIds, getSimRun, getSimVersion, getSimView, setSimPolicy, simClear, simReset, simSetView,
} from '../simRunState';
import type { SimTraceStep } from '../simRunState';
import { uniform } from '../../../../model/simulation/simRandom';
import { candidates, netRunStatus, step } from '../../../../model/simulation/netStep';
import * as netStepModule from '../../../../model/simulation/netStep';
import { encodeProfile } from '../../../../model/simulation/profileCodec';
import { ROLE_IDS, roleDescriptor } from '../../../../model/simulation/roleCatalog';
import type { RoleId } from '../../../../model/simulation/roleCatalog';
import { EVENT_FROM_TRIGGER } from '../../../../model/simulation/simProfiles';
import type { ProfileShape, RoleMode } from '../../../../model/simulation/simProfiles';
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

    describe('choiceHead (R-SIM-98): the choice list is a nondeterministic choice on the input pressed', () => {
        it('an ε list reads «Nondeterministic choice (ε)» (mutant 1: the old «Choose a transition» heading kept)', () => {
            const h = choiceHead('ε');
            expect(`${h.heading} (${h.input})`).toBe('Nondeterministic choice (ε)');
        });

        it('an input-event list names the event pressed (mutant 2: the input fixed to ε)', () => {
            const h = choiceHead('push');
            expect(`${h.heading} (${h.input})`).toBe('Nondeterministic choice (push)');
        });

        it('the subline says what to do, and the head holds nothing else (mutant 3: the subline dropped or reworded)', () => {
            expect(choiceHead('ε')).toEqual({ heading: 'Nondeterministic choice', input: 'ε', subline: 'Choose a transition' });
            expect(choiceHead('push').subline).toBe('Choose a transition');
        });
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
        // control: with an action role bound the run has an oracle of its own; with the declarations key set,
        // since «Custom» turns Action off without State attributes and the run reads it as unbound (R-SIM-78)
        const bound = petriLookup('true');
        bound.MM._state.simAction = 'A_guard';
        bound.MM._state.simStateAttributes = JSON.stringify({ v: 1, attrs: [] });
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

    it('b2net `p2.[tokens] < 2`: no reason while t1 fires; after two firings the reason is t1 guard false on the current marking (mutant: the configuration of the last label)', () => {
        const lookup = b2net('p2.[tokens] < 2');
        reset(lookup);
        agrees(lookup);
        expect(why(lookup)).toBeNull();
        eps(lookup);
        agrees(lookup);
        eps(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: t1 guard false');
        expect(r.inputs.map(i => i.short)).toEqual(['ε: t1 guard false']);
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
        expect(r.line).toBe('ε: e2 guard false');
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

    it('G7: an else into a fork whose out-edge guard is false names that edge, not the else (mutant: the entry always else)', () => {
        // S -e1-> D ; D -e2 [false]-> A ; D -e3 [else]-> F ; F -e4 [false]-> B, -e5-> C
        const lookup = buildLookup({ ...ROLES, simFork: 'C_Fork', simGuard: 'A_guard' }, {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
            D: { cls: 'C_State', slots: { R_out: ['e2', 'e3'] } },
            F: { cls: 'C_Fork', slots: { R_out: ['e4', 'e5'] } },
            A: { cls: 'C_State' },
            B: { cls: 'C_State' },
            C: { cls: 'C_State' },
            e1: { cls: 'C_Trans', slots: { R_next: ['D'] } },
            e2: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: ['false'] } },
            e3: { cls: 'C_Trans', slots: { R_next: ['F'], A_guard: ['else'] } },
            e4: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: ['false'] } },
            e5: { cls: 'C_Trans', slots: { R_next: ['C'] } },
        });
        lookup.C_Fork = { className: 'DClass', id: 'C_Fork', name: 'Fork', extends: [] };
        const r0 = reset(lookup);
        // no defect at Reset: the else is no guard of the fork (on the tree: e3 guard, parse error)
        expect(defectsLine(r0.run.net, lookup, r0.compileDefects)).toBeNull();
        eps(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: e2 guard false; e4 guard false');
        expect(r.title).toBe('ε: e2 (D → A) false [false]; F (D → B, C): e4 false [false]');
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

    /** t2 of DemoPetri (demo script §2.2) at a marking of p2, p3 and lock, k = 4: p2 -a3 ×2-> t2 -a4-> p3, lock -i1-o t2. */
    const demoT2 = (p2: number, p3: number, lock: number) => {
        const lookup = petri({
            p2: { cls: 'C_Place', slots: { A_tokens: [p2] } },
            p3: { cls: 'C_Place', slots: { A_tokens: [p3] } },
            lock: { cls: 'C_Place', slots: { A_tokens: [lock] } },
            t2: { cls: 'C_PTr', slots: { A_guard: ['p3.[tokens] < 1'] } },
            a3: { cls: 'C_Arc', slots: { R_src: ['p2'], R_tgt: ['t2'], A_w: [2] } },
            a4: { cls: 'C_Arc', slots: { R_src: ['t2'], R_tgt: ['p3'] } },
            i1: { cls: 'C_Inh', slots: { R_src: ['lock'], R_tgt: ['t2'] } },
        });
        lookup.MM._state.simArcWeight = 'A_w';
        lookup.MM._state.simBound = '4';
        lookup.A_w = { className: 'DAttribute', id: 'A_w', name: 'w' };
        return lookup;
    };

    it('DemoPetri t2 at (p2, p3, lock) = (2, 1, 0): the line says guard false, the title and the detail keep their text (mutants: the old `t2 false`; guard in the title)', () => {
        const lookup = demoT2(2, 1, 0);
        reset(lookup);
        agrees(lookup);
        const r = why(lookup)!;
        expect(r.line).toBe('ε: t2 guard false');
        expect(r.title).toBe('ε: t2 (p2 ×2 → p3) false [p3.[tokens] < 1]');
        expect(r.inputs[0].detail).toBe('ε: t2 (p2 ×2 → p3) false');
    });

    it('DemoPetri t2 blocked by its guard and by something else: the inhibitor is checked first and names lock, a short preset leaves nothing enabled (mutant: the inhibitor reason reads guard false)', () => {
        const inhibited = demoT2(2, 1, 1);
        reset(inhibited);
        agrees(inhibited);
        const r = why(inhibited)!;
        expect(r.line).toBe('ε: t2 inhibited by lock');
        expect(r.title).toBe('ε: t2 (p2 ×2 → p3) inhibited by lock');

        const short = demoT2(1, 1, 0);
        reset(short);
        agrees(short);
        const s = why(short)!;
        expect(s.line).toBe('nothing enabled');
        expect(s.title).toBe('ε: nothing enabled');
    });

    it('turnstile in Running: Push has no candidate and says why; Coin has one and says nothing; pressing Push names the false guard (mutants: a reason for an input with a candidate; the old discard wording)', () => {
        const lookup = buildLookup({ ...ROLES, simGuard: 'A_guard' }, TURNSTILE);
        reset(lookup, turnstileRecord);
        agrees(lookup);
        const run = getSimRun('M');
        expect(inputReason(run, 'coin', lookup, label)).toBeNull();
        expect(inputReason(run, 'push', lookup, label, 'A_guard')).toEqual({
            event: 'push', short: 'Push: tPushL guard false', detail: 'Push: tPushL (Locked → Locked) false',
            full: 'Push: tPushL (Locked → Locked) false [false]',
        });
        expect(why(lookup)).toBeNull();
        const pressed = pressInput('M', 'push', undefined, lookup, 'Push');
        expect(pressed.outcome?.kind).toBe('discard');
        expect(pressed.lastStep).toBe('Push: discarded, tPushL guard false');
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
        // P2b (R1): an undeclared name is known at Reset; an exception that depends on σ is still the run's
        expect(defectsOf('p2.[visits] > 0')).toEqual([['t1', 'guard', 'undeclared', 'p2.[visits] > 0']]);
        expect(defectsOf('t1.[tokens] == 0')).toEqual([['t1', 'guard', 'undeclared', 't1.[tokens] == 0']]);
        for (const guard of ['false', '(if p2.[marked] then p2 else null).[tokens] > 0', '1 + 1', 'p2.[tokens] < 2']) expect([guard, defectsOf(guard)]).toEqual([guard, []]);
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
        // P2b (R1): the undeclared read is a defect at Reset too, and the transition stays a candidate
        expect(reset(lookup).compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['T1x', 'action', 'undeclared']]);
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

    it('a value outside its domain that reads σ is a run-time halt only: no defect at Reset; a folded one is a defect too (P2b, R5)', () => {
        const lookup = cnet({ decls: [VISITS], t1: ['p2.[visits] := p2.[visits] + 9'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        eps(lookup);
        expect(haltMessage(getSimRun('M')!.halt!, lookup, FEATURES)).toBe('Halted: visits of p2 would be 9, outside its domain.');
        const folded = cnet({ decls: [VISITS], t1: ['p2.[visits] := 9'] });
        const f = reset(folded);
        expect(defectsLine(f.run.net, folded, f.compileDefects)).toBe('1 defect: t1 action (visits = 9, outside its domain).');
        eps(folded);
        expect(haltMessage(getSimRun('M')!.halt!, folded, FEATURES)).toBe('Halted: visits of p2 would be 9, outside its domain.');
    });

    it('a target that reads σ is not judged at Reset; the run halts on it (report H4)', () => {
        const lookup = cnet({ decls: [VISITS, F], t1: ['(if model.[f] then p1 else t1).[visits] := 1'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        eps(lookup);
        expect(getSimRun('M')!.halt).toMatchObject({ kind: 'undeclared', element: 'T1x', attr: 'visits' });
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

        it('a recursion along a reference of the frozen M runs per element, at Reset and after a step; a loop names its elements (R-SIM-74 as amended; mutant: the bridge without the frozen M)', () => {
            const LEN = { name: 'len', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 9 }, equation: 'if self.next == null then 1 else self.next.[len] + 1' };
            const lookup = cnet({ decls: [VISITS, LEN], t1: [BUMP] });
            // `next` is a reference of the snapshot only: p1 -> p2 -> null, p1 first among the ids
            const chain = (loop: boolean) => () => {
                const r = record(lookup)();
                r.p1.next = r.p2;
                r.p2.next = loop ? r.p1 : null;
                return r;
            };
            const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(chain(false)).build);
            if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
            expect(r.compileDefects).toEqual([]);
            expect([r.run.config.state.derived?.attrs.get('P1x')?.get('len'), r.run.config.state.derived?.attrs.get('P2x')?.get('len')]).toEqual([2, 1]);
            simReset('M', r.run);
            expect(eps(lookup).outcome?.kind).toBe('fired');
            expect(getSimRun('M')!.config.state.derived?.attrs.get('P1x')?.get('len')).toBe(2);
            const loop = startRun(lookup, 'M', 'MM', 'P', spyBuilder(chain(true)).build);
            if (loop.kind !== 'started') throw new Error(`refused: ${loop.reason}`);
            expect(defectsLine(loop.run.net, lookup, loop.compileDefects)).toBe('1 defect: len (equation cycle: p1.len → p2.len → p1.len).');
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

    describe('the face\'s builders: Watch rows, Marking chips, the status line (P-2026-10-03-0040, R-SIM-102, R-SIM-104)', () => {
        const SUM = { name: 'sum', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 6 }, equation: 'p1.[visits] + p2.[visits]' };
        const GLOW = { name: 'glow', metaclass: null, space: 'presentation', domain: null, initial: '1' };
        const BUMP2 = 'p2.[visits] := p2.[visits] + 1';
        const at = (n: number) => configAt(getSimRun('M')!, n)!.state;
        const rows = (lookup: Lookup, n: number, pins: Parameters<typeof watchRows>[3] = null) =>
            watchRows(getSimRun('M')!.net, at(n), n === 0 ? null : at(n - 1), pins, lookup);

        it('default pins: σ globals first, then the metaclass ones per owner by name; kind, domain and value on the shown σ (mutants: the derived value unread; owners unsorted)', () => {
            const lookup = cnet({ decls: [VISITS, F, SUM, GLOW], t1: [BUMP2] });
            expect(reset(lookup).compileDefects).toEqual([]);
            expect(rows(lookup, 0)).toEqual([
                { element: 'M', attr: 'f', name: 'f', space: 'semantic', kind: 'VAR', domain: { kind: 'boolean' }, value: false, before: null, changed: false },
                { element: 'M', attr: 'sum', name: 'sum', space: 'semantic', kind: 'DEFINE', domain: { kind: 'range', min: 0, max: 6 }, value: 0, before: null, changed: false },
                { element: 'P1x', attr: 'visits', name: 'p1.visits', space: 'semantic', kind: 'VAR', domain: { kind: 'range', min: 0, max: 3 }, value: 0, before: null, changed: false },
                { element: 'P2x', attr: 'visits', name: 'p2.visits', space: 'semantic', kind: 'VAR', domain: { kind: 'range', min: 0, max: 3 }, value: 0, before: null, changed: false },
            ]);
        });

        it('a step\'s changes: before → after on the values it changed, nothing on the others (mutants: before read on the shown σ; changed on every row)', () => {
            const lookup = cnet({ decls: [VISITS, F, SUM], t1: [BUMP2] });
            reset(lookup);
            expect(eps(lookup).outcome?.kind).toBe('fired');
            const changed = rows(lookup, 1).filter(r => r.changed).map(r => [r.name, r.before, r.value]);
            expect(changed).toEqual([['sum', 0, 1], ['p2.visits', 0, 1]]);
            expect(rows(lookup, 1).find(r => r.name === 'f')).toMatchObject({ before: null, changed: false });
        });

        it('explicit pins in their order, the presentation included when pinned; a pin no longer declared is skipped (mutant: the default pins over explicit ones)', () => {
            const lookup = cnet({ decls: [VISITS, F, SUM, GLOW], t1: [BUMP2] });
            reset(lookup);
            const pins = [
                { metaclass: null, name: 'glow', space: 'presentation' as const },
                { metaclass: null, name: 'gone', space: 'semantic' as const },
                { metaclass: null, name: 'sum', space: 'semantic' as const },
            ];
            expect(rows(lookup, 0, pins).map(r => [r.name, r.space, r.value])).toEqual([['glow', 'presentation', 1], ['sum', 'semantic', 0]]);
            expect(rows(lookup, 0, []).length).toBe(0);
        });

        it('Marking chips: one per marked place by name, ×n from two tokens, as the marking line lists them (mutants: ×1 written; a 0-token place)', () => {
            const lookup = cnet({ decls: [VISITS], t1: [BUMP2] });
            const r = reset(lookup);
            eps(lookup);
            const state = getSimRun('M')!.config.state;
            expect(markingChips(state, lookup)).toEqual([
                { place: 'P1x', name: 'p1', tokens: 2, text: 'p1 ×2' }, { place: 'P2x', name: 'p2', tokens: 1, text: 'p2' },
            ]);
            expect(`Marking: ${markingChips(state, lookup).map(c => c.text).join(', ')}`).toBe(markingLine(state, r.run.net, lookup).line.split(' · ')[0]);
            expect(markingChips({ ...state, marking: new Map([['P1x', 0]]) }, lookup)).toEqual([]);
        });

        it('the status line: step n, the seed, the last step; its title the «Last step» text of today (R-SIM-104; mutant: the title of the line itself)', () => {
            const last = { text: 'ε: t1 (p1 → p2) fired', title: 'ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1' };
            expect(statusLine(3, 12345, last)).toEqual({
                line: 'step 3 · seed 12345 · ε: t1 (p1 → p2) fired', title: 'Last step: ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1',
            });
            expect(statusLine(0, 7, null)).toEqual({ line: 'step 0 · seed 7', title: 'step 0 · seed 7' });
            expect(statusLine(1, undefined, last).line).toBe('step 1 · ε: t1 (p1 → p2) fired');
        });
    });
});

describe('P2b: the checker rules at Reset, on the rows of the checker gap report §5.2 (P-2026-09-27-2235)', () => {
    const DECLS = [
        { name: 'coins', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'paid', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, equation: 'model.[coins] >= 2' },
    ];

    /**
     * The ESM demo preset (docs/demo/models_2026_simulator_demo.md §2.3) with its declarations: tc (locked → locked,
     * coin) carries `effect`, tp (locked → unlocked, push) `guard`; the ids unlike the names, so a pointer shows.
     */
    function esm(tpGuard: string, tcEffect: string): Lookup {
        const lookup = buildLookup({ ...ROLES, simGuard: 'A_guard', simAction: 'A_effect', simStateAttributes: JSON.stringify({ v: 1, attrs: DECLS }) }, {
            Lx: { cls: 'C_Init', slots: { R_out: ['TCx', 'TPx'] } },
            Ux: { cls: 'C_State' },
            coin: { cls: 'C_Event', slots: { A_label: ['Coin'] } },
            push: { cls: 'C_Event', slots: { A_label: ['Push'] } },
            TCx: { cls: 'C_Trans', slots: { R_next: ['Lx'], R_trigger: ['coin'], A_effect: [tcEffect] } },
            TPx: { cls: 'C_Trans', slots: { R_next: ['Ux'], R_trigger: ['push'], A_guard: [tpGuard], A_effect: ['model.[coins] := 0'] } },
        });
        lookup.A_effect = { className: 'DAttribute', id: 'A_effect', name: 'effect' };
        Object.assign(lookup.Lx, { name: 'locked' });
        Object.assign(lookup.Ux, { name: 'unlocked' });
        Object.assign(lookup.TCx, { name: 'tc' });
        Object.assign(lookup.TPx, { name: 'tp' });
        lookup.M.name = 'demoESM';
        return lookup;
    }

    /** buildEvalContext's record: handles by id, `next` and `trigger` resolved to handles, names bound. */
    const record = () => {
        const h: Record<string, any> = {};
        for (const [id, name] of [['Lx', 'locked'], ['Ux', 'unlocked'], ['coin', 'coin'], ['push', 'push'], ['TCx', 'tc'], ['TPx', 'tp']]) {
            h[id] = { id, __type: 'Object', name };
        }
        h.coin.label = 'Coin'; h.push.label = 'Push';
        h.TCx.next = h.Lx; h.TCx.trigger = h.coin;
        h.TPx.next = h.Ux; h.TPx.trigger = h.push;
        return { instances: Object.values(h), classes: [], ...Object.fromEntries(Object.values(h).map(x => [x.name, x])) };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(record).build);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    const A0 = 'model.[coins] := model.[coins] + 1';
    const G0 = 'model.[paid]';

    it('each rule on its rows, in the one line: R1 G3 A10, R2 G4 G10, R3 A4 A14, R4 A12, R5 A9 A13, R6 G5 (mutants: one per rule)', () => {
        const rows: Array<[string, string, string, string]> = [
            ['G3', 'self.[visits] > 0', A0, "1 defect: tp guard (undeclared 'visits')."],
            ['G4', 'demoESM.[paid]', A0, '1 defect: tp guard (unresolved .[paid]).'],
            ['G5', 'model.[coins]', A0, '1 defect: tp guard (returns number).'],
            ['G10', 'self.next.[coins] > 0', A0, "1 defect: tp guard (undeclared 'coins' on unlocked)."],
            ['A4', G0, 'demoESM.[coins] := 1', '1 defect: tc action (unresolved .[coins]).'],
            ['A9', G0, "model.[coins] := 'a'", '1 defect: tc action (coins = a, outside its domain).'],
            ['A10', G0, 'model.[coins] := self.[visits]', "1 defect: tc action (undeclared 'visits')."],
            ['A12', G0, 'model.[coins] := now()', '1 defect: tc action (E-CALL).'],
            ['A13', G0, 'model.[coins] := self', '1 defect: tc action (value is object).'],
            ['A14', G0, 'self.name.[coins] := 1', '1 defect: tc action (unresolved .[coins]).'],
        ];
        for (const [row, guard, effect, line] of rows) {
            const lookup = esm(guard, effect);
            const r = reset(lookup);
            const got = defectsLine(r.run.net, lookup, r.compileDefects);
            expect([row, got]).toEqual([row, line]);
            expect([row, /Lx|Ux|TCx|TPx/.test(defectsTitle(r.run.net, lookup, r.compileDefects) ?? '')]).toEqual([row, false]);
        }
    });

    it('the reasons widen by two literals only: unresolved (R3, R2) and value (R5, R6)', () => {
        const reasons = (guard: string, effect: string) => {
            const lookup = esm(guard, effect);
            return reset(lookup).compileDefects?.map(d => [d.role, d.reason]);
        };
        expect(reasons(G0, 'demoESM.[coins] := 1')).toEqual([['action', 'unresolved']]);
        expect(reasons('demoESM.[paid]', A0)).toEqual([['guard', 'unresolved']]);
        expect(reasons(G0, 'model.[coins] := self')).toEqual([['action', 'value']]);
        expect(reasons('model.[coins]', A0)).toEqual([['guard', 'value']]);
    });

    it('A4, C2 probe (4): the Reset detail is the halt\'s, and the transition stays a candidate until it fires', () => {
        const lookup = esm(G0, 'demoESM.[coins] := 1');
        const r = reset(lookup);
        expect(defectsTitle(r.run.net, lookup, r.compileDefects)).toBe("tc action: the target: 'demoESM' does not exist [demoESM.[coins] := 1]");
        expect(pressInput('M', 'coin', undefined, lookup, 'Coin').outcome?.kind).toBe('halted');
        expect(haltMessage(getSimRun('M')!.halt!, lookup, { action: 'A_effect' })).toBe("Halted: the transition action of tc failed: the target: 'demoESM' does not exist.");
    });

    it('A11 stays silent at Reset, the run halts on it; A0 and G0 are clean and the run fires (negative controls)', () => {
        const a11 = esm(G0, 'event.[coins] := 1');
        expect(reset(a11).compileDefects).toEqual([]);
        expect(pressInput('M', 'coin', undefined, a11, 'Coin').outcome?.kind).toBe('halted');
        expect(getSimRun('M')!.halt).toMatchObject({ kind: 'undeclared', element: 'coin', attr: 'coins' });

        const clean = esm(G0, A0);
        expect(reset(clean).compileDefects).toEqual([]);
        expect(pressInput('M', 'coin', undefined, clean, 'Coin').outcome?.kind).toBe('fired');
        expect(pressInput('M', 'push', undefined, clean, 'Push').outcome?.kind).toBe('discard');
    });
});

describe('roles that are off are read as unbound (P-2026-09-28-0100, R-SIM-78)', () => {
    const EDIT: RoleMode = { mode: 'edit' };
    const OFF: RoleMode = { mode: 'off', reason: 'Turned off' };

    /** A user profile of `shape`: the other shape's group off, Event from Trigger, every other role edit; `modes` over them. */
    function userProfile(shape: ProfileShape, modes: Partial<Record<RoleId, RoleMode>> = {}): string {
        const other = shape === 'petri' ? 'controlFlow' : 'petri';
        const base = Object.fromEntries(ROLE_IDS.map(r => [r, roleDescriptor(r).group === other ? OFF : r === 'event' ? EVENT_FROM_TRIGGER : EDIT]));
        return encodeProfile({
            id: 'u-test', name: 'Test', system: false, shape, modes: { ...base, ...modes } as Record<RoleId, RoleMode>,
            params: { bound: 1, selector: 'list' }, constraints: [], addedRequired: [],
        });
    }

    const without = (bag: Record<string, unknown>, keys: readonly string[]) =>
        Object.fromEntries(Object.entries(bag).filter(([k]) => !keys.includes(k)));

    /** The record of `buildEvalContext`: one handle per object, instance names bound at the top. */
    const record = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        return { instances: Object.values(h), classes: [], ...h };
    };
    const run = (lookup: Lookup): RunStart => startRun(lookup, 'M', 'MM', 'P', spyBuilder(record(lookup)).build);

    /**
     * What a run is, as a string: refused with its reason, or the net, the configuration, the alphabet, the defects
     * at Reset, which oracles it has, one step per input from the initial configuration (the guard and action
     * oracles executed), and the signature unless left out.
     */
    function face(r: RunStart, signature = true): string {
        if (r.kind === 'refused') return JSON.stringify({ refused: r.reason });
        const x = r.run;
        const steps = [null, ...x.alphabet].map(event => {
            const cfg = { state: x.config.state, event };
            return step(x.net, cfg, candidates(x.net, cfg, x.guards).candidates[0]?.transition ?? null, x.guards, x.actions, x.derived);
        });
        return JSON.stringify({
            net: x.net, config: x.config, alphabet: x.alphabet, halt: x.halt, compileDefects: r.compileDefects,
            noActions: x.actions === NO_SIM_ACTIONS, derived: x.derived !== undefined, steps, ...(signature ? { signature: x.signature } : {}),
        }, (_k, v) => (v instanceof Map ? { map: [...v] } : v instanceof Set ? { set: [...v] } : v));
    }

    const DECLS = JSON.stringify({ v: 1, attrs: ['a', 'b', 'c'].map(name => ({ name, metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' })) });

    /** Every key of both shapes set; the Petri keys point at control-flow features, which only a Petri run would read. */
    const CF_BAG: Record<string, unknown> = {
        simNode: 'C_State', simTransition: 'C_Trans', simInitial: 'C_Init', simInitialMarking: 'A_tokens',
        simTerminal: 'C_Final', simAccepting: 'C_Final', simActivityFinal: 'C_AFinal', simBound: '2',
        simOwnedTransitions: 'R_out', simSource: 'R_src', simNextState: 'R_next', simFork: 'C_Fork', simJoin: 'C_Join',
        simArc: 'C_Trans', simArcSource: 'R_src', simArcTarget: 'R_next', simArcWeight: 'A_tokens', simInhibitorArc: 'C_Trans',
        simTrigger: 'R_trigger', simEventIdentifier: 'A_label', simGuard: 'A_guard',
        simAction: 'A_act', simEntry: 'A_entry', simExit: 'A_exit', simStateAttributes: DECLS,
        simStateOutput: 'A_label', simTransitionOutput: 'A_label',
    };

    /**
     * A control-flow model where each role changes the run when it is read: s0 (2 tokens by Initial marking, 1 by
     * Initial) leaves by tB (trigger ev1, guard, action) to s1 and by the join jn to sA (activity final); tA is owned
     * by s0 but has s1 as Source; s1 forks through fk to sA and sF (terminal); exit of s0 and entry of s1 assign.
     * The event identifier sorts ev2 (Alpha) before ev1 (Zed).
     */
    function cfLookup(bag: Record<string, unknown>): Lookup {
        const lookup = buildLookup(bag, {
            s0: { cls: 'C_Init', slots: { A_tokens: [2], R_out: ['tA', 'tB', 'tJ1'], A_exit: ['model.[c] := 1'] } },
            s1: { cls: 'C_State', slots: { R_out: ['tF1'], A_entry: ['model.[b] := 1'] } },
            sF: { cls: 'C_Final' },
            sA: { cls: 'C_AFinal' },
            fk: { cls: 'C_Fork', slots: { R_out: ['tF2', 'tF3'] } },
            jn: { cls: 'C_Join', slots: { R_out: ['tJ2'] } },
            ev1: { cls: 'C_Event', slots: { A_label: ['Zed'] } },
            ev2: { cls: 'C_Event', slots: { A_label: ['Alpha'] } },
            tA: { cls: 'C_Trans', slots: { R_src: ['s1'], R_next: ['sF'] } },
            tB: { cls: 'C_Trans', slots: { R_next: ['s1'], R_trigger: ['ev1'], A_guard: ['true'], A_act: ['model.[a] := 1'] } },
            tF1: { cls: 'C_Trans', slots: { R_next: ['fk'] } },
            tF2: { cls: 'C_Trans', slots: { R_next: ['sA'] } },
            tF3: { cls: 'C_Trans', slots: { R_next: ['sF'] } },
            tJ1: { cls: 'C_Trans', slots: { R_next: ['jn'] } },
            tJ2: { cls: 'C_Trans', slots: { R_next: ['sA'] } },
        });
        lookup.C_AFinal = { className: 'DClass', id: 'C_AFinal', name: 'AFinal', extends: ['C_State'] };
        for (const id of ['C_Fork', 'C_Join']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        lookup.R_src = { className: 'DReference', id: 'R_src', name: 'src' };
        for (const id of ['A_act', 'A_entry', 'A_exit', 'A_tokens']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
        return lookup;
    }

    /** Each role a control-flow profile can turn off; `read` when the run (not only the signature) reads its key. */
    const CF_ROWS: ReadonlyArray<{ role: RoleId; read: boolean; omit?: readonly string[] }> = [
        { role: 'initial', read: true, omit: ['simInitialMarking'] }, { role: 'initialMarking', read: true },
        { role: 'terminal', read: true }, { role: 'accepting', read: false }, { role: 'activityFinal', read: true },
        { role: 'bound', read: true }, { role: 'ownedTransitions', read: true }, { role: 'source', read: true },
        { role: 'fork', read: true }, { role: 'join', read: true },
        { role: 'arc', read: true }, { role: 'arcSource', read: false }, { role: 'arcTarget', read: false },
        { role: 'arcWeight', read: false }, { role: 'inhibitorArc', read: false },
        { role: 'trigger', read: true }, { role: 'eventIdentifier', read: true },
        { role: 'guard', read: true }, { role: 'action', read: true }, { role: 'entry', read: true }, { role: 'exit', read: true },
        { role: 'stateAttributes', read: true }, { role: 'stateOutput', read: false }, { role: 'transitionOutput', read: false },
    ];

    /** The off row and its control: with the role on, the key changes the run, or the signature for a key nothing reads. */
    function checkRow(shape: ProfileShape, bag: Record<string, unknown>, lookupOf: (b: Record<string, unknown>) => Lookup,
        row: { role: RoleId; read: boolean; omit?: readonly string[] }) {
        const key = roleDescriptor(row.role).key as string;
        const base = without(bag, row.omit ?? []);
        const off = userProfile(shape, { [row.role]: OFF });
        const on = userProfile(shape, { [row.role]: EDIT });
        const set = (profile: string) => lookupOf({ ...base, simProfile: profile });
        const unset = (profile: string) => lookupOf({ ...without(base, [key]), simProfile: profile });
        expect([row.role, face(run(set(off)))]).toEqual([row.role, face(run(unset(off)))]);
        expect([row.role, face(run(set(on)), !row.read) === face(run(unset(on)), !row.read)]).toEqual([row.role, false]);
    }

    it('control flow: each role off with its key set runs as the same profile with the key unset, signature included (mutants: the key read; the signature reads it)', () => {
        expect(run(cfLookup({ ...CF_BAG, simProfile: userProfile('controlFlow') })).kind).toBe('started');
        for (const row of CF_ROWS) checkRow('controlFlow', CF_BAG, cfLookup, row);
    });

    const PN_BAG: Record<string, unknown> = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
        simInitialMarking: 'A_tokens', simArcWeight: 'A_w', simInhibitorArc: 'C_Inh', simBound: '2', simTerminal: 'C_PFinal',
        simGuard: 'A_guard', simInitial: 'C_Place', simNextState: 'R_tgt', simFork: 'C_Place',
    };

    /** p1 (2 tokens) -a1 ×2-> t1 -a2-> p2 (terminal), p3 -i1-o t1: weight, inhibitor, bound, terminal and guard each change the net. */
    function pnLookup(bag: Record<string, unknown>): Lookup {
        const lookup = buildLookup(bag, {
            p1: { cls: 'C_Place', slots: { A_tokens: [2] } },
            p2: { cls: 'C_PFinal' },
            p3: { cls: 'C_Place', slots: { A_tokens: [0] } },
            t1: { cls: 'C_PTr', slots: { A_guard: ['true'] } },
            a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'], A_w: [2] } },
            a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
            i1: { cls: 'C_Inh', slots: { R_src: ['p3'], R_tgt: ['t1'] } },
        });
        for (const id of ['C_Place', 'C_PTr', 'C_Arc', 'C_Inh']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        lookup.C_PFinal = { className: 'DClass', id: 'C_PFinal', name: 'PFinal', extends: ['C_Place'] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        for (const id of ['A_tokens', 'A_w']) lookup[id] = { className: 'DAttribute', id, name: id.slice(2) };
        return lookup;
    }

    it('Petri: arc weight, inhibitor arc, bound, terminal and guard off read as unbound; Initial and the control-flow keys by the signature only', () => {
        expect(run(pnLookup({ ...PN_BAG, simProfile: userProfile('petri') })).kind).toBe('started');
        for (const row of [
            { role: 'arcWeight', read: true }, { role: 'inhibitorArc', read: true }, { role: 'bound', read: true },
            { role: 'terminal', read: true }, { role: 'guard', read: true },
            { role: 'initial', read: false }, { role: 'nextState', read: false }, { role: 'fork', read: false },
        ] as const) checkRow('petri', PN_BAG, pnLookup, row);
    });

    it('Event off: no event role with the Trigger bound, as a Trigger with no class type (mutant: the event still derived)', () => {
        const typed = (profile: string) => cfLookup({ ...CF_BAG, simProfile: profile });
        const untyped = (profile: string) => { const l = typed(profile); delete l.R_trigger.type; return l; };
        const off = userProfile('controlFlow', { event: OFF });
        const r = run(typed(off));
        expect(r.kind === 'started' && [r.run.net.hasEventRole, r.run.alphabet]).toEqual([false, []]);
        expect(face(r, false)).toBe(face(run(untyped(off)), false));
        // control: Event from Trigger, the events are there
        const on = run(typed(userProfile('controlFlow')));
        expect(on.kind === 'started' && on.run.alphabet).toEqual(['ev2', 'ev1']);
    });

    it('«Custom» (no simProfile): Action, Entry and Exit left off for want of State attributes read as unbound; declared, they run (inferCustomProfile)', () => {
        const petri = ['simArc', 'simArcSource', 'simArcTarget', 'simArcWeight', 'simInhibitorArc'];
        const actionKeys = ['simAction', 'simEntry', 'simExit'];
        const bare = without(CF_BAG, [...petri, 'simStateAttributes']);
        expect(face(run(cfLookup(bare)))).toBe(face(run(cfLookup(without(bare, actionKeys)))));
        // control: with the declarations the Custom profile has them on, and the run reads them
        const declared = { ...bare, simStateAttributes: DECLS };
        expect(face(run(cfLookup(declared)), false)).not.toBe(face(run(cfLookup(without(declared, actionKeys))), false));
    });

    it('only off is skipped: a derived role with its key set is read as before (Bound k = 1 in State machine, the key 2 read; mutant: derived skipped too)', () => {
        const r = run(buildLookup({ ...ROLES, simBound: '2', simProfile: 'stateMachine' }, TURNSTILE));
        expect(r.kind === 'started' && r.run.net.bound).toBe(2);
    });

    it('the four demo profiles skip the keys they turn off: State machine drops Action and State attributes, Petri net the control-flow keys (system profiles)', () => {
        const sm = run(cfLookup({ ...without(CF_BAG, ['simArc']), simProfile: 'stateMachine' }));
        expect(sm.kind === 'started' && [sm.run.actions === NO_SIM_ACTIONS, sm.run.net.attributes, sm.run.net.activityFinal ?? null]).toEqual([true, [], null]);
        const pn = run(pnLookup({ ...PN_BAG, simProfile: 'petri' }));
        expect(face(pn)).toBe(face(run(pnLookup({ ...without(PN_BAG, ['simInitial', 'simNextState', 'simFork']), simProfile: 'petri' }))));
    });
});

describe('R7: an else with no sibling is a defect at Reset, the run unchanged (P-2026-09-28-0100, R-SIM-87)', () => {
    const COUNT = JSON.stringify({ v: 1, attrs: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }] });
    const FLOW_ROLES = {
        simNode: 'C_AN', simTransition: 'C_CF', simSource: 'R_source', simNextState: 'R_target', simInitial: 'C_IN', simFork: 'C_Fork',
        simJoin: 'C_Join', simTerminal: 'C_Fin', simGuard: 'A_guard', simAction: 'A_effect', simStateAttributes: COUNT, simProfile: 'flowchart',
    };

    /**
     * Flow B variant A of the demo (docs/demo/models_2026_simulator_demo.md §2.4): i0 -f1-> work -f2-> d1, d1 -f3-> work
     * `count < 2`, d1 -f4-> fk `else`, the fork to left and right, the join jn to fin. `f3` false leaves f4 without its sibling.
     */
    function flow(f3: boolean, f4Guard = 'else'): Lookup {
        const wires: Array<[string, string, string]> = [['f1', 'i0', 'work'], ['f2', 'work', 'd1'], ['f3', 'd1', 'work'], ['f4', 'd1', 'fk'],
            ['f5', 'fk', 'left'], ['f6', 'fk', 'right'], ['f7', 'left', 'jn'], ['f8', 'right', 'jn'], ['f9', 'jn', 'fin']];
        const guards: Record<string, string> = { f3: 'model.[count] < 2', f4: f4Guard };
        const objects: Record<string, Obj> = {
            i0: { cls: 'C_IN' }, work: { cls: 'C_Act' }, d1: { cls: 'C_Dec' }, fk: { cls: 'C_Fork' }, left: { cls: 'C_Act' },
            right: { cls: 'C_Act' }, jn: { cls: 'C_Join' }, fin: { cls: 'C_Fin' },
        };
        for (const [e, s, t] of wires) {
            if (e === 'f3' && !f3) continue;
            objects[e] = { cls: 'C_CF', slots: {
                R_source: [s], R_target: [t], ...(guards[e] ? { A_guard: [guards[e]] } : {}),
                ...(e === 'f2' ? { A_effect: ['model.[count] := model.[count] + 1'] } : {}),
            } };
        }
        const lookup = buildLookup(FLOW_ROLES, objects);
        lookup.C_AN = { className: 'DClass', id: 'C_AN', name: 'ActivityNode', extends: [], abstract: true };
        for (const [id, name] of [['C_IN', 'InitialNode'], ['C_Act', 'Activity'], ['C_Dec', 'Decision'], ['C_Fork', 'Fork'], ['C_Join', 'Join'], ['C_Fin', 'FinalNode']]) {
            lookup[id] = { className: 'DClass', id, name, extends: ['C_AN'] };
        }
        lookup.C_CF = { className: 'DClass', id: 'C_CF', name: 'ControlFlow', extends: [] };
        for (const id of ['R_source', 'R_target']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_effect = { className: 'DAttribute', id: 'A_effect', name: 'effect' };
        lookup.M.name = 'demoFlowA';
        return lookup;
    }

    const recordOf = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(recordOf(lookup)).build);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    /** ε until the run stops, at most 12 presses: the «Last step» lines and the status. */
    const walk = (lookup: Lookup) => {
        const lines: string[] = [];
        for (let i = 0; i < 12; i++) {
            const run = getSimRun('M')!;
            const status = netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);
            if (status !== 'Running') return { lines, status };
            lines.push(pressInput('M', null, undefined, lookup, 'ε').lastStep ?? '');
        }
        return { lines, status: 'Running' };
    };

    it('Flow B variant A: f4 else has the sibling f3, no defect at Reset, 6 steps to Terminated (control: the demo preset unchanged)', () => {
        const lookup = flow(true);
        const r = reset(lookup);
        expect(r.compileDefects).toEqual([]);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBeNull();
        const w = walk(lookup);
        expect([w.lines.length, w.status]).toEqual([6, 'Terminated']);
    });

    it('f4 else into the fork with no sibling: one guard defect named by f4, not by the fork; the run is the one of f4 unguarded (mutants: no R7; the fork named)', () => {
        const lookup = flow(false);
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason, d.source])).toEqual([['f4', 'guard', 'else-alone', 'else']]);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: f4 guard (else, no sibling).');
        expect(defectsTitle(r.run.net, lookup, r.compileDefects)).toBe('f4 guard: else with no sibling: no other transition has its preset and its triggers, so it is always true [else]');
        const lone = walk(lookup);
        // the run unchanged: the else is always true, as the same edge with no guard
        const bare = flow(false, '');
        expect(reset(bare).compileDefects).toEqual([]);
        expect(lone).toEqual(walk(bare));
        expect(lone.status).toBe('Terminated');
    });

    it('a plain edge: tPushL else leaves Locked on push, tCoin shares Locked but not the trigger, so no sibling; a second push edge from Locked is one (same preset, same triggers)', () => {
        const alone = buildLookup({ ...ROLES, simGuard: 'A_guard' }, { ...TURNSTILE, tPushL: { ...TURNSTILE.tPushL, slots: { ...TURNSTILE.tPushL.slots, A_guard: ['else'] } } });
        const r = startRun(alone, 'M', 'MM', 'P', spyBuilder().build);
        expect(r.kind === 'started' && defectsLine(r.run.net, alone, r.compileDefects)).toBe('1 defect: tPushL guard (else, no sibling).');
        // the run unchanged: push on Locked fires tPushL, the else always true
        simReset('M', started(alone));
        expect(pressInput('M', 'push', undefined, alone, 'Push').lastStep).toBe('Push: tPushL (Locked → Locked) fired');
        const paired = buildLookup({ ...ROLES, simGuard: 'A_guard' }, {
            ...TURNSTILE,
            Locked: { ...TURNSTILE.Locked, slots: { R_out: ['tCoin', 'tPushL', 'tPush2'] } },
            tPushL: { ...TURNSTILE.tPushL, slots: { ...TURNSTILE.tPushL.slots, A_guard: ['else'] } },
            tPush2: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['push'], A_guard: ['false'] } },
        });
        const p = startRun(paired, 'M', 'MM', 'P', spyBuilder().build);
        expect(p.kind === 'started' && p.compileDefects).toEqual([]);
    });

    it('Petri (R-SIM-64): t1 else with no other transition on its preset is the same defect, and t1 still fires', () => {
        const PN = {
            simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
            simInitialMarking: 'A_tokens', simBound: '3', simGuard: 'A_guard',
        };
        const lookup = buildLookup(PN, {
            p1: { cls: 'C_Place', slots: { A_tokens: [1] } }, p2: { cls: 'C_Place' }, t1: { cls: 'C_PTr', slots: { A_guard: ['else'] } },
            a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'] } }, a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'] } },
        });
        for (const id of ['C_Place', 'C_PTr', 'C_Arc']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        const r = reset(lookup);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe('1 defect: t1 guard (else, no sibling).');
        expect(pressInput('M', null, undefined, lookup, 'ε').lastStep).toBe('ε: t1 (p1 → p2) fired');
    });
});

describe('R-SIM-88: inputs asked at the press that reads them (P-2026-09-28-0034)', () => {
    /** S -e1-> D; D -e2 [g2]-> A, D -e3 [g3]-> B; `decision` an input of every State, A and B terminal. */
    const DECISION = { name: 'decision', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true };
    function decision(g2: string, g3 = 'else', e1Effect?: string, extra: object[] = []): Lookup {
        const lookup = buildLookup({
            ...ROLES, simGuard: 'A_guard', simTerminal: 'C_Final', ...(e1Effect ? { simAction: 'A_effect' } : {}),
            simStateAttributes: JSON.stringify({ v: 1, attrs: [DECISION, ...extra] }),
        }, {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
            D: { cls: 'C_State', slots: { R_out: ['e2', 'e3'] } },
            A: { cls: 'C_Final' },
            B: { cls: 'C_Final' },
            e1: { cls: 'C_Trans', slots: { R_next: ['D'], ...(e1Effect ? { A_effect: [e1Effect] } : {}) } },
            e2: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: [g2] } },
            e3: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: [g3] } },
        });
        lookup.A_effect = { className: 'DAttribute', id: 'A_effect', name: 'effect' };
        return lookup;
    }
    /** buildEvalContext's record: handles by id, `next` resolved, every name bound. */
    const record = () => {
        const h: Record<string, any> = {};
        for (const id of ['S', 'D', 'A', 'B', 'e1', 'e2', 'e3']) h[id] = { id, __type: 'Object', name: id };
        h.e1.next = h.D; h.e2.next = h.A; h.e3.next = h.B;
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', () => record());
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    const eps = (lookup: Lookup, values?: Array<{ element: string; attr: string; value: boolean }>, selector?: string) =>
        pressInput('M', null, selector, lookup, 'ε', values);
    const answer = (value: boolean) => [{ element: 'D', attr: 'decision', value }];
    const label = (e: string | null) => (e === null ? 'ε' : e);

    it('the press that reads an input returns the asks and commits nothing (mutant: the ask skipped)', () => {
        const lookup = decision('D.[decision]');
        reset(lookup);
        expect(eps(lookup).lastStep).toBe('ε: e1 (S → D) fired');
        const before = getSimRun('M')!.config;
        const version = getSimVersion();
        const out = eps(lookup);
        expect(out.asks).toEqual([{ element: 'D', attr: 'decision', domain: { kind: 'boolean' } }]);
        expect([out.pending, out.lastStep, out.outcome]).toEqual([null, null, null]);
        expect(getSimRun('M')!.config).toBe(before);
        expect(getSimVersion()).toBe(version);
    });

    it('the values reach the guards: true fires e2, false the else e3; σ′ never holds the input (mutants: the overlay unread, the input written into σ)', () => {
        for (const [value, fired] of [[true, 'ε: e2 (D → A) fired'], [false, 'ε: e3 (D → B) fired']] as const) {
            const lookup = decision('D.[decision]');
            reset(lookup);
            eps(lookup);
            expect(eps(lookup, answer(value)).lastStep).toBe(fired);
            const run = getSimRun('M')!;
            expect(run.config.state.attrs.get('D')).toBeUndefined();
            expect(markingLine(run.config.state, run.net, lookup).line).toBe(`Marking: ${value ? 'A' : 'B'}`);
        }
    });

    it('the title of Last step lists the inputs of the step (mutant: the inputs left out of the title)', () => {
        const lookup = decision('D.[decision]');
        reset(lookup);
        eps(lookup);
        expect(eps(lookup, answer(false)).lastStepTitle).toBe('ε: e3 (D → B) fired\ninputs: D.decision = false');
        expect(inputLabel({ element: 'M', attr: 'answer' }, getSimRun('M')!.net, lookup)).toBe('answer');
    });

    it('an answer never shadows σ: a value given for a stored name is ignored (mutant: every value overlaid)', () => {
        const SEEN = { name: 'seen', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' };
        const lookup = decision('D.[decision] and not model.[seen]', 'else', undefined, [SEEN]);
        reset(lookup);
        eps(lookup);
        expect(eps(lookup, [...answer(true), { element: 'M', attr: 'seen', value: true }]).lastStep).toBe('ε: e2 (D → A) fired');
    });

    it('several candidates after the answer: the list, then the choice with the same values (mutant: the values dropped on the choice)', () => {
        const lookup = decision('D.[decision]', 'D.[decision]');
        reset(lookup);
        eps(lookup);
        expect(eps(lookup, answer(true)).pending?.map(c => c.transition)).toEqual(['e2', 'e3']);
        expect(eps(lookup, answer(true), 'e3').lastStep).toBe('ε: e3 (D → B) fired');
    });

    it('runStatus: Running while an enabled transition waits for an input, where the core alone says Deadlock; Terminated after (mutant: the waiting rule dropped)', () => {
        const lookup = decision('D.[decision]');
        reset(lookup);
        eps(lookup);
        const run = getSimRun('M')!;
        expect(netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt)).toBe('Deadlock');
        expect(runStatus(run)).toBe('Running');
        eps(lookup, answer(true));
        expect(runStatus(getSimRun('M')!)).toBe('Terminated');
    });

    it('the reasons: an input that asks is no «no candidate» and no Deadlock reason (mutant: explained as a defect)', () => {
        const lookup = decision('D.[decision]');
        reset(lookup);
        eps(lookup);
        const run = getSimRun('M')!;
        expect(inputReason(run, null, lookup, label)).toBeNull();
        expect(stopReason(run, lookup, label)).toBeNull();
    });

    it('nothing is asked where no enabled transition that accepts the input reads one: today\'s press (mutants: not filtered by the preset, nor by the input)', () => {
        const lookup = decision('D.[decision]');
        const r = reset(lookup);
        expect(r.run.inputs?.get('e2')).toEqual([{ element: 'D', attr: 'decision', domain: { kind: 'boolean' } }]);
        // the else reads what its siblings read: the core evaluates them for the complement
        expect(r.run.inputs?.get('e3')).toEqual(r.run.inputs?.get('e2'));
        expect(inputAsks(getSimRun('M')!, null)).toEqual([]);
        eps(lookup);
        expect(inputAsks(getSimRun('M')!, 'coin')).toEqual([]);
        expect(inputAsks(getSimRun('M')!, null)).toHaveLength(1);
        // control: no input declared, no table
        expect(started(buildLookup(ROLES, TURNSTILE)).inputs).toBeUndefined();
    });

    it('an action that assigns an input: a read-only defect at Reset and a read-only halt that says input (mutant: the checks for derived only)', () => {
        const lookup = decision('D.[decision]', 'else', 'D.[decision] := true');
        const r = reset(lookup);
        expect(r.compileDefects?.filter(d => d.role === 'action').map(d => [d.element, d.reason, d.detail])).toEqual([
            ['e1', 'read-only', "'decision' is an input and cannot be assigned"],
        ]);
        const out = eps(lookup);
        expect(out.outcome?.kind).toBe('halted');
        const halt = getSimRun('M')!.halt!;
        expect(haltMessage(halt, lookup, { action: 'A_effect' })).toBe("Halted: the transition action of e1 failed: 'decision' is an input and cannot be assigned.");
    });

    it('a target the run resolves whose name only an input has: the same read-only defect at Reset (mutant: left to the run)', () => {
        const SEEN = { name: 'seen', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' };
        const lookup = decision('D.[decision]', 'else', '(if model.[seen] then D else S).[decision] := true', [SEEN]);
        expect(reset(lookup).compileDefects?.filter(d => d.role === 'action').map(d => [d.element, d.reason, d.detail])).toEqual([
            ['e1', 'read-only', "'decision' is an input and cannot be assigned"],
        ]);
    });
});

describe('R-SIM-90: Guard, Action, Entry and Exit hold a list of attributes (P-2026-09-29-0010)', () => {
    /** visits on every place, 0..3; f a global boolean, initially `f`. */
    const decls = (f = false) => JSON.stringify({ v: 1, attrs: [
        { name: 'visits', metaclass: 'C_Place', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' },
        { name: 'f', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: String(f) },
    ] });
    const PETRI = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simArcSource: 'R_src', simArcTarget: 'R_tgt',
        simInitialMarking: 'A_tokens', simBound: '3',
    };
    type Slots = Record<string, unknown[]>;
    const arc = (s: string, t: string): Obj => ({ cls: 'C_Arc', slots: { R_src: [s], R_tgt: [t] } });

    function petri(roles: Record<string, unknown>, objects: Record<string, Obj>, f = false): Lookup {
        const lookup = buildLookup({ ...PETRI, simStateAttributes: decls(f), ...roles }, objects);
        for (const id of ['C_Place', 'C_PTr', 'C_Arc']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        lookup.M.name = 'multi';
        return lookup;
    }
    /** p1 (1 token) -a1-> t1 -a2-> p2, t1 and p2 with the slots given. */
    const line = (roles: Record<string, unknown>, t1: Slots = {}, p2: Slots = {}) => petri(roles, {
        p1: { cls: 'C_Place', slots: { A_tokens: [1] } }, p2: { cls: 'C_Place', slots: p2 }, t1: { cls: 'C_PTr', slots: t1 },
        a1: arc('p1', 't1'), a2: arc('t1', 'p2'),
    });
    /** p1 (1 token) feeds tA -> pA and tE -> pE: one preset, so an `else` on tE is the complement of tA. */
    const pair = (roles: Record<string, unknown>, tA: Slots, tE: Slots, f = false) => petri(roles, {
        p1: { cls: 'C_Place', slots: { A_tokens: [1] } }, pA: { cls: 'C_Place' }, pE: { cls: 'C_Place' },
        tA: { cls: 'C_PTr', slots: tA }, tE: { cls: 'C_PTr', slots: tE },
        a1: arc('p1', 'tA'), a2: arc('tA', 'pA'), a3: arc('p1', 'tE'), a4: arc('tE', 'pE'),
    }, f);

    const record = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        return { instances: Object.values(h), classes: [], ...h };
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
    const label = (e: string | null) => (e === null ? 'ε' : e);
    const GUARDS = '["A_guard","A_cond"]';

    it('the silent failure of the discovery (§4.3): a list is never read as one pointer, so its guards never degrade to true', () => {
        const lookup = line({ simGuard: GUARDS }, { A_guard: ['false'], A_cond: ['false'] });
        const r = reset(lookup);
        expect(r.compileDefects).toEqual([]);
        expect(status()).toBe('Deadlock');
    });

    it('the guard is the conjunction of every Guard attribute: one false blocks the transition, the reason names both texts (mutants: any-of; the first attribute only)', () => {
        for (const [a, b] of [['true', 'false'], ['false', 'true']]) {
            const lookup = line({ simGuard: GUARDS }, { A_guard: [a], A_cond: [b] });
            reset(lookup);
            expect(status(), `${a} and ${b}`).toBe('Deadlock');
            expect(stopReason(getSimRun('M'), lookup, label, ['A_guard', 'A_cond'])?.title).toBe(`ε: t1 (p1 → p2) false [${a}] [${b}]`);
            expect(inputReason(getSimRun('M'), null, lookup, label, ['A_guard', 'A_cond'])?.full).toBe(`ε: t1 (p1 → p2) false [${a}] [${b}]`);
        }
        // control: both true, it fires
        const both = line({ simGuard: GUARDS }, { A_guard: ['true'], A_cond: ['true'] });
        reset(both);
        expect(eps(both).outcome?.kind).toBe('fired');
    });

    it('the raw key, as a caller held it before R-SIM-90, gives the same reason as the decoded list (mutant: a string read as one pointer)', () => {
        const lookup = line({ simGuard: GUARDS }, { A_guard: ['true'], A_cond: ['false'] });
        reset(lookup);
        expect(stopReason(getSimRun('M'), lookup, label, GUARDS)?.title).toBe('ε: t1 (p1 → p2) false [true] [false]');
        // control: a plain id reads its one text, as before
        expect(stopReason(getSimRun('M'), lookup, label, 'A_cond')?.title).toBe('ε: t1 (p1 → p2) false [false]');
    });

    it('a Guard attribute the transition does not carry contributes true (R-SIM-17) (mutant: an attribute not carried read as false)', () => {
        const lookup = line({ simGuard: '["A_guard","A_other"]' }, { A_guard: ['true'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        expect(eps(lookup).outcome?.kind).toBe('fired');
        // control: the attribute it carries still counts
        const off = line({ simGuard: '["A_guard","A_other"]' }, { A_guard: ['false'] });
        reset(off);
        expect(status()).toBe('Deadlock');
    });

    it('a defect in the second Guard attribute is a Reset defect of the site, with its own text, and wins over a false one (mutants: the first attribute only; false before a defect)', () => {
        const lookup = line({ simGuard: GUARDS }, { A_guard: ['true'], A_cond: ['a b'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason, d.source])).toEqual([['t1', 'guard', 'parse-error', 'a b']]);
        expect(status()).toBe('Deadlock');
        // the site's conjunction as the core's over sites: a defect first, then false
        const both = line({ simGuard: GUARDS }, { A_guard: ['false'], A_cond: ['a b'] });
        reset(both);
        expect(eps(both).outcome?.label.evaluated.map(e => [e.transition, e.outcome.kind])).toEqual([['t1', 'defect']]);
    });

    it('the actions of a site are the union of its Action attributes, in attribute order; one not carried assigns nothing (mutant: the first attribute only)', () => {
        const lookup = line({ simAction: '["A_actions","A_more","A_none"]' }, { A_actions: ['p2.[visits] := 1'], A_more: ['model.[f] := true'] });
        expect(reset(lookup).compileDefects).toEqual([]);
        const out = eps(lookup);
        expect(out.outcome?.label.assignments).toEqual([{ element: 'p2', attr: 'visits', value: 1 }, { element: 'M', attr: 'f', value: true }]);
        expect(out.lastStepTitle).toBe('ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1, multi.f = true');
    });

    it('two Entry attributes of one place writing one target: the Reset defect double-assignment, then the halt (answer 4)', () => {
        const lookup = line({ simEntry: '["A_entry","A_entry2"]' }, {}, { A_entry: ['p2.[visits] := 1'], A_entry2: ['p2.[visits] := 2'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason])).toEqual([['t1', 'action', 'double-assignment']]);
        eps(lookup);
        expect(haltMessage(getSimRun('M')!.halt!, lookup, { entries: ['A_entry', 'A_entry2'] })).toBe('Halted: visits of p2 is assigned twice in one step.');
        // control: distinct targets fire
        const distinct = line({ simEntry: '["A_entry","A_entry2"]' }, {}, { A_entry: ['p2.[visits] := 1'], A_entry2: ['p1.[visits] := 2'] });
        expect(reset(distinct).compileDefects).toEqual([]);
        expect(eps(distinct).outcome?.kind).toBe('fired');
    });

    it('the halt title quotes the text of the second Action attribute that stopped the run (mutant: the halt reads the first attribute only)', () => {
        const lookup = line({ simAction: '["A_actions","A_more"]' }, { A_actions: ['p2.[visits] := 1'], A_more: ['p1.[count] := 1'] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason, d.source])).toEqual([['t1', 'action', 'undeclared', 'p1.[count] := 1']]);
        eps(lookup);
        const halt = getSimRun('M')!.halt!;
        const text = haltMessage(halt, lookup, { actions: ['A_actions', 'A_more'] });
        expect(text).toBe("Halted: the transition action of t1 failed: 'count' is not declared on p1.");
        expect(haltTitle(halt, lookup, { actions: ['A_actions', 'A_more'] })).toBe(`${text} [p1.[count] := 1]`);
        // the raw key as the panel passed it before R-SIM-90 reads the same
        expect(haltTitle(halt, lookup, { action: '["A_actions","A_more"]' })).toBe(`${text} [p1.[count] := 1]`);
    });

    it('else in the second Guard attribute alone: the complement of its sibling, never compiled as a guard (answer 3; mutant: else read in the first attribute only)', () => {
        const lookup = pair({ simGuard: GUARDS }, { A_guard: ['false'] }, { A_cond: ['else'] });
        const r = reset(lookup);
        expect(r.compileDefects).toEqual([]);
        expect(r.run.net.transitions.find(t => t.id === 'tE')).toMatchObject({ elseOf: ['tA'], guardSites: [] });
        expect(eps(lookup).lastStep).toBe('ε: tE (p1 → pE) fired');
    });

    it('else beside another Guard attribute: the complement first, then that guard, conjoined (answer 3, G7; mutant: an else that drops the other conjuncts)', () => {
        const tE = { A_guard: ['model.[f]'], A_cond: ['else'] };
        const shut = pair({ simGuard: GUARDS }, { A_guard: ['false'] }, tE, false);
        const r = reset(shut);
        expect(r.compileDefects).toEqual([]);
        expect(r.run.net.transitions.find(t => t.id === 'tE')).toMatchObject({ elseOf: ['tA'], guardSites: ['tE'] });
        expect(status()).toBe('Deadlock');
        expect(stopReason(getSimRun('M'), shut, label, ['A_guard', 'A_cond'])?.title).toBe('ε: tA (p1 → pA) false [false]; tE (p1 → pE) false [model.[f]]');
        // control: the other guard true, the else fires
        const open = pair({ simGuard: GUARDS }, { A_guard: ['false'] }, tE, true);
        reset(open);
        expect(eps(open).lastStep).toBe('ε: tE (p1 → pE) fired');
        // control: the sibling true, the else is false whatever its other guard
        const sibling = pair({ simGuard: GUARDS }, { A_guard: ['true'] }, tE, true);
        reset(sibling);
        expect(eps(sibling).lastStep).toBe('ε: tA (p1 → pA) fired');
    });

    it('an else with no sibling is named by the edge whose second attribute says it (R7 over every Guard attribute)', () => {
        const lookup = line({ simGuard: GUARDS }, { A_cond: [' else '] });
        const r = reset(lookup);
        expect(r.compileDefects?.map(d => [d.element, d.role, d.reason, d.source])).toEqual([['t1', 'guard', 'else-alone', ' else ']]);
    });
});

describe('R-SIM-94: the globals of a model are declared in its bag (P-2026-09-29-0110)', () => {
    const COUNT_REC = { name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' };
    const COUNT = JSON.stringify({ v: 1, attrs: [COUNT_REC] });
    const COUNT5 = JSON.stringify({ v: 1, attrs: [{ ...COUNT_REC, domain: { kind: 'range', min: 0, max: 5 } }] });
    const FLOW_B = {
        simNode: 'C_AN', simTransition: 'C_CF', simSource: 'R_source', simNextState: 'R_target', simInitial: 'C_IN', simFork: 'C_Fork',
        simJoin: 'C_Join', simTerminal: 'C_Fin', simGuard: 'A_guard', simAction: 'A_effect', simProfile: 'flowchart',
    };

    /**
     * Flow B of the demo (docs/demo/models_2026_simulator_demo.md §2.4), the fixture of the discovery's probe
     * (P-2026-09-29-0011 §4): `count` declared in the metamodel's bag (`m2`), in the model's (`m1`), in both or in neither.
     */
    function flowB(m2: string | undefined, m1: string | undefined, bag: Record<string, unknown> = FLOW_B): Lookup {
        const objects: Record<string, Obj> = {
            i0: { cls: 'C_IN' }, work: { cls: 'C_Act' }, d1: { cls: 'C_Dec' }, fk: { cls: 'C_Fork' }, left: { cls: 'C_Act' },
            right: { cls: 'C_Act' }, jn: { cls: 'C_Join' }, fin: { cls: 'C_Fin' },
        };
        const wires: Array<[string, string, string]> = [['f1', 'i0', 'work'], ['f2', 'work', 'd1'], ['f3', 'd1', 'work'], ['f4', 'd1', 'fk'],
            ['f5', 'fk', 'left'], ['f6', 'fk', 'right'], ['f7', 'left', 'jn'], ['f8', 'right', 'jn'], ['f9', 'jn', 'fin']];
        const guards: Record<string, string> = { f3: 'model.[count] < 2', f4: 'model.[count] >= 2' };
        for (const [e, src, tgt] of wires) {
            objects[e] = { cls: 'C_CF', slots: {
                R_source: [src], R_target: [tgt], ...(guards[e] ? { A_guard: [guards[e]] } : {}),
                ...(e === 'f2' ? { A_effect: ['model.[count] := model.[count] + 1'] } : {}),
            } };
        }
        const lookup = buildLookup({ ...bag, ...(m2 !== undefined ? { simStateAttributes: m2 } : {}) }, objects);
        lookup.C_AN = { className: 'DClass', id: 'C_AN', name: 'ActivityNode', extends: [], abstract: true };
        for (const [id, name] of [['C_IN', 'InitialNode'], ['C_Act', 'Activity'], ['C_Dec', 'Decision'], ['C_Fork', 'Fork'], ['C_Join', 'Join'], ['C_Fin', 'FinalNode']]) {
            lookup[id] = { className: 'DClass', id, name, extends: ['C_AN'] };
        }
        lookup.C_CF = { className: 'DClass', id: 'C_CF', name: 'ControlFlow', extends: [] };
        for (const id of ['R_source', 'R_target']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_effect = { className: 'DAttribute', id: 'A_effect', name: 'effect' };
        lookup.MM.name = 'DemoFlowB';
        lookup.M.name = 'demoFlowB';
        lookup.M._state = m1 !== undefined ? { simStateAttributes: m1 } : {};
        return lookup;
    }

    const recordOf = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(recordOf(lookup)).build);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r;
    };
    /** Reset, then ε until the run stops (at most 12): the readings of the demo script. */
    const scene = (lookup: Lookup) => {
        const r = reset(lookup);
        const first = markingLine(r.run.net.initial, r.run.net, lookup).line;
        const lines: string[] = [];
        let status = 'Running';
        for (let i = 0; i < 12; i++) {
            const run = getSimRun('M')!;
            status = netRunStatus(run.net, run.config, run.alphabet, run.guards, run.halt);
            if (status !== 'Running') break;
            lines.push(pressInput('M', null, undefined, lookup, 'ε').lastStep ?? '');
        }
        const run = getSimRun('M')!;
        return {
            defects: defectsLine(r.run.net, lookup, r.compileDefects), first, steps: lines.length, status,
            final: markingLine(run.config.state, run.net, lookup).line,
        };
    };
    const S1 = { defects: null, first: 'Marking: i0 · count = 0', steps: 6, status: 'Terminated', final: 'Marking: fin · count = 2' };

    it("S1, the metamodel's key (the demo today): unchanged, 6 steps to Terminated with count = 2 (control)", () => {
        expect(scene(flowB(COUNT, undefined))).toEqual(S1);
    });

    it("S2, the model's key only: the same readings as S1, no undeclared count (mutant: the model's key not read)", () => {
        expect(scene(flowB(undefined, COUNT))).toEqual(S1);
    });

    it("both keys: the model's record shadows the metamodel's, no twice, the model's domain held (mutant: no shadow)", () => {
        const lookup = flowB(COUNT5, COUNT);
        const r = reset(lookup);
        expect(r.compileDefects).toEqual([]);
        expect(r.run.net.declared.get('M')?.get('count')?.domain).toEqual({ kind: 'range', min: 0, max: 3 });
        expect(scene(flowB(COUNT5, COUNT))).toEqual(S1);
    });

    it("a model record naming a metaclass is a record defect, named and said to be the model's; the rest runs", () => {
        const bound = JSON.stringify({ v: 1, attrs: [COUNT_REC, { ...COUNT_REC, name: 'visits', metaclass: 'C_Act' }] });
        const r = reset(flowB(undefined, bound));
        expect(r.compileDefects?.map(d => [d.element, d.role, d.detail])).toEqual([['visits', 'declaration', 'a model declares globals only']]);
        expect(r.run.net.attributes.map(d => d.name)).toEqual(['count']);
    });

    it("the model's key defects say which bag: model state attributes, model record N (mutant: labelled as the metamodel's)", () => {
        const unreadable = reset(flowB(COUNT, 'not json'));
        expect(unreadable.compileDefects?.map(d => [d.element, d.detail])).toEqual([['model state attributes', 'not JSON']]);
        const nameless = reset(flowB(COUNT, JSON.stringify({ v: 1, attrs: [{ space: 'semantic' }] })));
        expect(nameless.compileDefects?.map(d => [d.element, d.detail])).toEqual([['model record 1', 'no name']]);
        // control: the metamodel's own keep their words
        const m2 = reset(flowB('not json', COUNT));
        expect(m2.compileDefects?.map(d => d.element)).toEqual(['state attributes']);
    });

    it("a profile with the declarations off drops the model's key too, as the metamodel's (R-SIM-78) (mutant: the model's key read when off)", () => {
        const sm = buildLookup({ ...ROLES, simProfile: 'stateMachine', simStateAttributes: COUNT }, TURNSTILE);
        sm.M._state = { simStateAttributes: COUNT };
        const r = startRun(sm, 'M', 'MM', 'P', spyBuilder().build);
        expect(r.kind === 'started' && r.run.net.attributes).toEqual([]);
    });

    it("S5, runSignature moves on an edit of the model's sim key, not on its other keys (mutant: the model's term dropped)", () => {
        const base = runSignature(flowB(COUNT, COUNT), 'M', 'MM');
        expect(runSignature(flowB(COUNT, COUNT5), 'M', 'MM')).not.toBe(base);
        // control: an edit of the metamodel's key moves it, as before
        expect(runSignature(flowB(COUNT5, COUNT), 'M', 'MM')).not.toBe(base);
        const other = flowB(COUNT, COUNT);
        other.M._state.generatedBy = 'jjtl';
        expect(runSignature(other, 'M', 'MM')).toBe(base);
    });

    it("with the declarations off an edit of the model's key leaves the signature, as an off key of the metamodel does", () => {
        const sm = (m1: string) => {
            const l = buildLookup({ ...ROLES, simProfile: 'stateMachine' }, TURNSTILE);
            l.M._state = { simStateAttributes: m1 };
            return runSignature(l, 'M', 'MM');
        };
        expect(sm(COUNT5)).toBe(sm(COUNT));
    });

    it("the Reset line's undeclared globals: count, named once, from guards and actions; a name undeclared on an element is not the model's (mutant: every undeclared name)", () => {
        const lookup = flowB(undefined, undefined);
        const r = reset(lookup);
        expect(defectsLine(r.run.net, lookup, r.compileDefects)).toBe(
            "3 defects: f3 guard (undeclared 'count'); f4 guard (undeclared 'count'); f2 action (undeclared 'count' on demoFlowB).");
        expect(undeclaredGlobals(r.compileDefects ?? [], lookup, 'M')).toEqual(['count']);
        expect(undeclaredGlobals([
            { element: 'f2', role: 'action', reason: 'undeclared', detail: "'x' is not declared on work", source: '', short: "undeclared 'x' on work" },
        ], lookup, 'M')).toEqual([]);
        // declared in the model, nothing left to declare
        expect(undeclaredGlobals(reset(flowB(undefined, COUNT)).compileDefects ?? [], lookup, 'M')).toEqual([]);
    });

    it("the Data dialog is globals only: its new rows, typed or taken from the Reset line, have no metaclass (mutant: a new row bound)", () => {
        expect(newGlobalRow([])).toEqual({ name: 'x1', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: 'false' });
        expect(newGlobalRow([newGlobalRow([])]).name).toBe('x2');
        const stored = [{ ...COUNT_REC } as any];
        const rows = modelDataRows(stored, ['count', 'paid']);
        expect(rows.map(r => [r.name, r.metaclass])).toEqual([['count', null], ['paid', null]]);
        expect(rows[0]).toBe(stored[0]);
        expect(modelDataRows(stored, [])).toEqual(stored);
    });

    it("the Data dialog's Apply is one state assignment of the model's key alone: one set_state, one undo step (mutant: the key and the profile written)", () => {
        const rows = modelDataRows([], ['count']);
        const patch = modelDataPatch(rows);
        expect(Object.keys(patch)).toEqual(['simStateAttributes']);
        expect(patch.simStateAttributes).toBe('{"v":1,"attrs":[{"name":"count","metaclass":null,"space":"semantic","domain":{"kind":"boolean"},"initial":"false"}]}');
    });

    it("the Data dialog's Apply interrupts a run of the model: the patch, merged into the model's bag as set_state merges it, moves the signature (mutant: the signature term dropped)", () => {
        const lookup = flowB(undefined, COUNT);
        const r = reset(lookup);
        expect(runSignature(lookup, 'M', 'MM')).toBe(r.run.signature);
        lookup.M._state = { ...lookup.M._state, ...modelDataPatch([{ ...COUNT_REC, domain: { kind: 'range', min: 0, max: 5 } } as any]) };
        expect(runSignature(lookup, 'M', 'MM')).not.toBe(r.run.signature);
    });
});

describe('the faces of Accepting and the outputs (P-2026-09-29-0300, R-SIM-91, R-SIM-92)', () => {
    const EMPTY_RECORD = () => spyBuilder(() => ({ instances: [], classes: [] })).build;
    const reset = (lookup: Lookup) => simReset('M', started(lookup, EMPTY_RECORD()));
    const current = () => getSimRun('M')!;
    const mark = () => acceptingMark(current().net, current().config.state);
    const output = (lookup: Lookup) => outputLine(current().config.state, current().net, lookup);

    /** DemoDFA of the discovery §3.8 on the test metamodel: strings over {a, b} ending in b. */
    function dfaLookup(bag: Record<string, unknown>): Lookup {
        const lookup = buildLookup(bag, {
            q0: { cls: 'C_Init', slots: { R_out: ['t00', 't01'] } },
            q1: { cls: 'C_Acc', slots: { R_out: ['t10', 't11'] } },
            a: { cls: 'C_Event', slots: { A_label: ['a'] } },
            b: { cls: 'C_Event', slots: { A_label: ['b'] } },
            t00: { cls: 'C_Trans', slots: { R_next: ['q0'], R_trigger: ['a'] } },
            t01: { cls: 'C_Trans', slots: { R_next: ['q1'], R_trigger: ['b'] } },
            t10: { cls: 'C_Trans', slots: { R_next: ['q0'], R_trigger: ['a'] } },
            t11: { cls: 'C_Trans', slots: { R_next: ['q1'], R_trigger: ['b'] } },
        });
        lookup.C_Acc = { className: 'DClass', id: 'C_Acc', name: 'Accepting', extends: ['C_State'] };
        return lookup;
    }
    const DFA_BAG = { ...ROLES, simAccepting: 'C_Acc', simProfile: 'dfa' };

    /** The turnstile of step 1 with an `out` slot on its states (Moore) or on its transitions (Mealy). */
    function outLookup(bag: Record<string, unknown>, outs: Record<string, unknown[]>, extra: Record<string, Obj> = {}): Lookup {
        const objects: Record<string, Obj> = { ...TURNSTILE, ...extra };
        for (const [id, values] of Object.entries(outs)) objects[id] = { ...objects[id], slots: { ...objects[id].slots, A_out: values } };
        const lookup = buildLookup(bag, objects);
        lookup.A_out = { className: 'DAttribute', id: 'A_out', name: 'out' };
        return lookup;
    }
    const MOORE_BAG = { ...ROLES, simStateOutput: 'A_out', simProfile: 'moore' };
    const MEALY_BAG = { ...ROLES, simTransitionOutput: 'A_out', simProfile: 'mealy' };

    it('the status mark reads `accepting` on the accepting state only, the run going on (killed by a mark that ignores σ, or none)', () => {
        const lookup = dfaLookup(DFA_BAG);
        reset(lookup);
        expect(mark()).toBeNull();
        pressInput('M', 'b', undefined, lookup, 'b');
        expect(getSimActiveIds('M')).toEqual(['q1']);
        expect(runStatus(current())).toBe('Running');
        expect(mark()).toBe('accepting');
        pressInput('M', 'b', undefined, lookup, 'b');
        expect(mark()).toBe('accepting');
        pressInput('M', 'a', undefined, lookup, 'a');
        expect(mark()).toBeNull();
    });

    it('no mark without the role, or with the role off; SM then DFA reads Running · accepting, not Terminated (S5, R-SIM-86)', () => {
        const pressB = (lookup: Lookup) => { reset(lookup); pressInput('M', 'b', undefined, lookup, 'b'); };
        pressB(dfaLookup(ROLES));
        expect(getSimActiveIds('M')).toEqual(['q1']);
        expect(mark()).toBeNull();
        // State machine turns Accepting off: the key is set and never reaches the net
        pressB(dfaLookup({ ...ROLES, simAccepting: 'C_Acc', simTerminal: 'C_Acc', simProfile: 'stateMachine' }));
        expect([runStatus(current()), mark()]).toEqual(['Terminated', null]);
        // DFA after State machine: Terminal left in the bag, off under DFA
        pressB(dfaLookup({ ...DFA_BAG, simTerminal: 'C_Acc' }));
        expect([runStatus(current()), mark()]).toEqual(['Running', 'accepting']);
    });

    it('Moore: the Output line from Reset, the marked state\'s value, then the next one (killed by listing every place)', () => {
        const lookup = outLookup(MOORE_BAG, { Locked: ['red'], Unlocked: ['green'] });
        reset(lookup);
        expect(output(lookup)).toEqual({ line: 'Output: red', title: 'Output: red' });
        pressInput('M', 'coin', undefined, lookup, 'Coin');
        expect(output(lookup)).toEqual({ line: 'Output: green', title: 'Output: green' });
    });

    it('Moore: `Output: none` on a marked state with no value; two values joined; several marked states named (killed by dropping the none)', () => {
        const none = outLookup(MOORE_BAG, { Locked: ['red'] });
        reset(none);
        pressInput('M', 'coin', undefined, none, 'Coin');
        expect(output(none)?.line).toBe('Output: none');
        const two = outLookup(MOORE_BAG, { Locked: ['red', 'buzz'] });
        reset(two);
        expect(output(two)?.line).toBe('Output: red, buzz');
        // Two Init states hold a token each: each output is named after its state
        const both = outLookup(MOORE_BAG, { Locked: ['red'], Locked2: ['amber'] }, { Locked2: { cls: 'C_Init' } });
        reset(both);
        expect(output(both)?.line).toBe('Output: Locked red; Locked2 amber');
    });

    it('Moore: no Output line without the role, or with the role off (killed by a line on every run)', () => {
        const plain = outLookup(ROLES, { Locked: ['red'] });
        reset(plain);
        expect(output(plain)).toBeNull();
        const off = outLookup({ ...MOORE_BAG, simProfile: 'stateMachine' }, { Locked: ['red'] });
        reset(off);
        expect(output(off)).toBeNull();
    });

    it('Mealy: «Last step» reads input / output first, so the clamp never hides it; its title has an output line (killed by dropping the output)', () => {
        const lookup = outLookup(MEALY_BAG, { tCoin: ['unlock'], tPushU: ['lock', 'beep'] });
        reset(lookup);
        const coin = pressInput('M', 'coin', undefined, lookup, 'Coin');
        expect(coin.lastStep).toBe('Coin / unlock: tCoin (Locked → Unlocked) fired');
        expect(coin.lastStepTitle).toBe('Coin / unlock: tCoin (Locked → Unlocked) fired\noutput: unlock');
        const push = pressInput('M', 'push', undefined, lookup, 'Push');
        expect(push.lastStep).toBe('Push / lock, beep: tPushU (Unlocked → Locked) fired');
        expect(push.lastStepTitle).toBe('Push / lock, beep: tPushU (Unlocked → Locked) fired\noutput: lock, beep');
        // tPushL has no value: no suffix, no line
        const bare = pressInput('M', 'push', undefined, lookup, 'Push');
        expect([bare.lastStep, bare.lastStepTitle]).toEqual(['Push: tPushL (Locked → Locked) fired', 'Push: tPushL (Locked → Locked) fired']);
    });

    it('Mealy: no output on a halted step (killed by the output on halted), nor without the role or with it off', () => {
        const MERGE: Record<string, Obj> = {
            A: { cls: 'C_Init', slots: { R_out: ['ta'] } },
            B: { cls: 'C_Init', slots: { R_out: ['tb'] } },
            C: { cls: 'C_State' },
            ta: { cls: 'C_Trans', slots: { R_next: ['C'], A_out: ['unlock'] } },
            tb: { cls: 'C_Trans', slots: { R_next: ['C'], A_out: ['lock'] } },
        };
        const lookup = buildLookup({ ...ROLES, simTransitionOutput: 'A_out' }, MERGE);
        reset(lookup);
        expect(pressInput('M', null, 'ta', lookup, 'ε').lastStep).toBe('ε / unlock: ta (A → C) fired');
        const halted = pressInput('M', null, undefined, lookup, 'ε');
        expect(halted.outcome?.kind).toBe('halted');
        expect([halted.lastStep, halted.lastStepTitle]).toEqual(['ε: tb (B → C) halted the run', 'ε: tb (B → C) halted the run']);
        for (const bag of [ROLES, { ...MEALY_BAG, simProfile: 'stateMachine' }]) {
            const l = outLookup(bag, { tCoin: ['unlock'] });
            reset(l);
            expect(pressInput('M', 'coin', undefined, l, 'Coin').lastStep).toBe('Coin: tCoin (Locked → Unlocked) fired');
        }
    });

    it('the demo presets: every key of the three set, no face on the M1 lines (State machine reads none of them)', () => {
        const lookup = outLookup(
            { ...ROLES, simAccepting: 'C_Init', simStateOutput: 'A_out', simTransitionOutput: 'A_out', simProfile: 'stateMachine' },
            { Locked: ['red'], Unlocked: ['green'], tCoin: ['unlock'] },
        );
        reset(lookup);
        expect([mark(), output(lookup)]).toEqual([null, null]);
        const coin = pressInput('M', 'coin', undefined, lookup, 'Coin');
        expect([coin.lastStep, mark(), output(lookup)]).toEqual(['Coin: tCoin (Locked → Unlocked) fired', null, null]);
        expect(markingLine(current().config.state, current().net, lookup).line).toBe('Marking: Unlocked');
    });
});

describe('R-SIM-100: Random on an ε list, the seed of the run, the trace (P-2026-09-29-1840)', () => {
    /** A choice at A every other step: A -t1-> B, A -t2-> C, then B -t3-> A and C -t4-> A, forced. */
    const CYCLE: Record<string, Obj> = {
        A: { cls: 'C_Init', slots: { R_out: ['t1', 't2'] } },
        B: { cls: 'C_State', slots: { R_out: ['t3'] } },
        C: { cls: 'C_State', slots: { R_out: ['t4'] } },
        t1: { cls: 'C_Trans', slots: { R_next: ['B'] } },
        t2: { cls: 'C_Trans', slots: { R_next: ['C'] } },
        t3: { cls: 'C_Trans', slots: { R_next: ['A'] } },
        t4: { cls: 'C_Trans', slots: { R_next: ['A'] } },
    };
    const empty = () => spyBuilder(() => ({ instances: [] })).build;
    const reset = (lookup: Lookup, seed?: number) => {
        const r = startRun(lookup, 'M', 'MM', 'P', empty(), seed);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r.run;
    };
    /** k ε presses, every list answered by Random: the run's trace. */
    const playRandom = (lookup: Lookup, k: number) => {
        for (let i = 0; i < k; i++) {
            const p = pressInput('M', null, undefined, lookup, 'ε');
            if (p.pending) pressRandom('M', p.pending, lookup);
        }
        return getSimRun('M')!.trace!;
    };

    it('Reset draws the seed once with crypto.getRandomValues, never Math.random; a seed given is kept; draws 0, trace empty (mutant: a constant seed)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        const fromCrypto = vi.spyOn(globalThis.crypto, 'getRandomValues');
        const fromMath = vi.spyOn(Math, 'random');
        try {
            const drawn = reset(lookup);
            expect(fromCrypto).toHaveBeenCalledTimes(1);
            const seed = drawn.seed!;
            expect(Number.isInteger(seed) && seed >= 0 && seed < 2 ** 32).toBe(true);
            expect((fromCrypto.mock.results[0].value as Uint32Array)[0]).toBe(seed);
            const given = reset(lookup, 3141592653);
            expect(fromCrypto).toHaveBeenCalledTimes(1);
            expect([given.seed, given.draws, given.trace]).toEqual([3141592653, 0, []]);
            playRandom(lookup, 10);
            expect(fromMath).not.toHaveBeenCalled();
        } finally {
            fromCrypto.mockRestore();
            fromMath.mockRestore();
        }
    });

    it('Random fires the drawn candidate: «ε (random)» in Last step, the seed in its title, origin random, one draw (mutants: the marker dropped; the seed line dropped)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 42);
        const asked = pressInput('M', null, undefined, lookup, 'ε');
        expect(asked.pending?.map(c => c.transition)).toEqual(['t1', 't2']);
        const r = pressRandom('M', asked.pending!, lookup, undefined, () => 0.99);
        expect(r.pending).toBeNull();
        expect(r.lastStep).toBe('ε (random): t2 (A → C) fired');
        expect(r.lastStepTitle).toBe('ε (random): t2 (A → C) fired\nseed 42');
        expect(getSimActiveIds('M')).toEqual(['C']);
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 't2', kind: 'fired', origin: 'random' }]);
        expect(getSimRun('M')!.draws).toBe(1);
        // a hand choice keeps its line and its title: no marker, no seed
        pressInput('M', null, undefined, lookup, 'ε');                 // C -t4-> A, forced
        pressInput('M', null, undefined, lookup, 'ε');
        const click = pressInput('M', null, 't1', lookup, 'ε');
        expect([click.lastStep, click.lastStepTitle]).toEqual(['ε: t1 (A → B) fired', 'ε: t1 (A → B) fired']);
    });

    it('the list click records user, a forced press no origin, a quiescence none (mutants: a click recorded random; the origin not passed to the store)', () => {
        const lookup = buildLookup(ROLES, { ...CYCLE, B: { cls: 'C_State' } });
        reset(lookup, 1);
        pressInput('M', null, undefined, lookup, 'ε');
        pressInput('M', null, 't2', lookup, 'ε');
        pressInput('M', null, undefined, lookup, 'ε');                 // C -t4-> A
        pressInput('M', null, 't1', lookup, 'ε');
        pressInput('M', null, undefined, lookup, 'ε');                 // B has no way out
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([
            { event: null, selector: 't2', kind: 'fired', origin: 'user' },
            { event: null, selector: 't4', kind: 'fired' },
            { event: null, selector: 't1', kind: 'fired', origin: 'user' },
            { event: null, selector: null, kind: 'quiescence' },
        ]);
        expect(getSimRun('M')!.draws).toBe(0);
    });

    it('without a stub the run\'s seed decides: draw k picks floor(uniform(seed, k) · 2); forced steps draw nothing (mutants: the stream restarted at every press; the pick of another seed)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 2026);
        const trace = playRandom(lookup, 20);
        const drawn = trace.filter(t => t.origin === 'random').map(t => t.selector);
        expect(drawn).toEqual(Array.from({ length: 10 }, (_, k) => ['t1', 't2'][Math.floor(uniform(2026, k) * 2)]));
        expect(trace.filter(t => t.origin === undefined)).toHaveLength(10);
        expect(getSimRun('M')!.draws).toBe(10);
        // control: the stream has both picks, so a pick that ignores the draw cannot pass
        expect(new Set(drawn).size).toBe(2);
    });

    it('two runs with one seed give one trace; seed + 1 another (mutant: the seed ignored)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 2026);
        const first = playRandom(lookup, 20);
        reset(lookup, 2026);
        const again = playRandom(lookup, 20);
        expect(again).toEqual(first);
        reset(lookup, 2027);
        expect(playRandom(lookup, 20)).not.toEqual(first);
    });

    it('an event press is never random: Random fed an event\'s list commits nothing, the click on that list is the user\'s (mutants: a click recorded random; the origin not passed to the store)', () => {
        const TWO_PUSH: Record<string, Obj> = {
            ...TURNSTILE,
            Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL', 'tPushX'] } },
            tPushX: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['push'] } },
        };
        const lookup = buildLookup(ROLES, TWO_PUSH);
        reset(lookup, 7);
        const asked = pressInput('M', 'push', undefined, lookup, 'Push');
        expect(asked.pending?.map(c => c.transition).sort()).toEqual(['tPushL', 'tPushX']);
        const drawn = pressRandom('M', asked.pending!, lookup);
        expect(drawn.outcome?.kind).toBe('inadmissible');
        expect([getSimRun('M')!.trace, getSimRun('M')!.draws]).toEqual([[], 0]);
        pressInput('M', 'push', 'tPushX', lookup, 'Push');
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: 'push', selector: 'tPushX', kind: 'fired', origin: 'user' }]);
    });

    it('fewer than two candidates is not a list: Random draws nothing and commits nothing; no run, nothing', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 5);
        const one = pressRandom('M', [{ transition: 't1', unsafe: null }], lookup, undefined, () => 0);
        expect(one).toEqual({ pending: null, lastStep: null, outcome: null });
        expect([getSimRun('M')!.trace, getSimRun('M')!.draws, getSimActiveIds('M')]).toEqual([[], 0, ['A']]);
        __resetSimRunsForTests();
        expect(pressRandom('M', [{ transition: 't1', unsafe: null }, { transition: 't2', unsafe: null }], lookup)).toEqual({ pending: null, lastStep: null, outcome: null });
    });
});

describe('R-SIM-101: the run policy, Step under Random and Play (P-2026-09-29-1943)', () => {
    /** A choice at A every other step: A -t1-> B, A -t2-> C, then B -t3-> A and C -t4-> A, forced. */
    const CYCLE: Record<string, Obj> = {
        A: { cls: 'C_Init', slots: { R_out: ['t1', 't2'] } },
        B: { cls: 'C_State', slots: { R_out: ['t3'] } },
        C: { cls: 'C_State', slots: { R_out: ['t4'] } },
        t1: { cls: 'C_Trans', slots: { R_next: ['B'] } },
        t2: { cls: 'C_Trans', slots: { R_next: ['C'] } },
        t3: { cls: 'C_Trans', slots: { R_next: ['A'] } },
        t4: { cls: 'C_Trans', slots: { R_next: ['A'] } },
    };

    /** Petri roles with inhibitor, weight and guard, k = 4, as DemoPetri is configured (demo script §2.2). */
    const PETRI = {
        simNode: 'C_Place', simTransition: 'C_PTr', simArc: 'C_Arc', simInhibitorArc: 'C_Inh', simArcSource: 'R_src',
        simArcTarget: 'R_tgt', simInitialMarking: 'A_tokens', simArcWeight: 'A_w', simBound: '4', simGuard: 'A_guard',
    };
    function petri(objects: Record<string, Obj>, bound = '4'): Lookup {
        const lookup = buildLookup({ ...PETRI, simBound: bound }, objects);
        for (const id of ['C_Place', 'C_PTr', 'C_Arc', 'C_Inh']) lookup[id] = { className: 'DClass', id, name: id.slice(2), extends: [] };
        for (const id of ['R_src', 'R_tgt']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_tokens = { className: 'DAttribute', id: 'A_tokens', name: 'tokens' };
        lookup.A_w = { className: 'DAttribute', id: 'A_w', name: 'w' };
        return lookup;
    }
    /** DemoPetri: p1 (2) -a1-> t1 -a2 ×2-> p2 -a3 ×2-> t2 -a4-> p3; lock (1) -a5-> t3; lock -i1-o t2; t2 `p3.[tokens] < 1`. */
    const demoPetri = () => petri({
        p1: { cls: 'C_Place', slots: { A_tokens: [2] } },
        p2: { cls: 'C_Place' },
        p3: { cls: 'C_Place' },
        lock: { cls: 'C_Place', slots: { A_tokens: [1] } },
        t1: { cls: 'C_PTr' },
        t2: { cls: 'C_PTr', slots: { A_guard: ['p3.[tokens] < 1'] } },
        t3: { cls: 'C_PTr' },
        a1: { cls: 'C_Arc', slots: { R_src: ['p1'], R_tgt: ['t1'] } },
        a2: { cls: 'C_Arc', slots: { R_src: ['t1'], R_tgt: ['p2'], A_w: [2] } },
        a3: { cls: 'C_Arc', slots: { R_src: ['p2'], R_tgt: ['t2'], A_w: [2] } },
        a4: { cls: 'C_Arc', slots: { R_src: ['t2'], R_tgt: ['p3'] } },
        a5: { cls: 'C_Arc', slots: { R_src: ['lock'], R_tgt: ['t3'] } },
        i1: { cls: 'C_Inh', slots: { R_src: ['lock'], R_tgt: ['t2'] } },
    });

    /** Flow B of the demo (§2.4): i0 -f1-> work -f2 {count += 1}-> d1, d1 -f3 [count < 2]-> work, d1 -f4 [count >= 2]-> fk, the fork, the join, fin. */
    function flowB(): Lookup {
        const COUNT = JSON.stringify({ v: 1, attrs: [{ name: 'count', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: '0' }] });
        const wires: Array<[string, string, string]> = [['f1', 'i0', 'work'], ['f2', 'work', 'd1'], ['f3', 'd1', 'work'], ['f4', 'd1', 'fk'],
            ['f5', 'fk', 'left'], ['f6', 'fk', 'right'], ['f7', 'left', 'jn'], ['f8', 'right', 'jn'], ['f9', 'jn', 'fin']];
        const guards: Record<string, string> = { f3: 'model.[count] < 2', f4: 'model.[count] >= 2' };
        const objects: Record<string, Obj> = {
            i0: { cls: 'C_IN' }, work: { cls: 'C_Act' }, d1: { cls: 'C_Dec' }, fk: { cls: 'C_Fork' }, left: { cls: 'C_Act' },
            right: { cls: 'C_Act' }, jn: { cls: 'C_Join' }, fin: { cls: 'C_Fin' },
        };
        for (const [e, src, tgt] of wires) {
            objects[e] = { cls: 'C_CF', slots: {
                R_source: [src], R_target: [tgt], ...(guards[e] ? { A_guard: [guards[e]] } : {}),
                ...(e === 'f2' ? { A_effect: ['model.[count] := model.[count] + 1'] } : {}),
            } };
        }
        const lookup = buildLookup({
            simNode: 'C_AN', simTransition: 'C_CF', simSource: 'R_source', simNextState: 'R_target', simInitial: 'C_IN', simFork: 'C_Fork',
            simJoin: 'C_Join', simTerminal: 'C_Fin', simGuard: 'A_guard', simAction: 'A_effect', simStateAttributes: COUNT, simProfile: 'flowchart',
        }, objects);
        lookup.C_AN = { className: 'DClass', id: 'C_AN', name: 'ActivityNode', extends: [] };
        for (const [id, name] of [['C_IN', 'InitialNode'], ['C_Act', 'Activity'], ['C_Dec', 'Decision'], ['C_Fork', 'Fork'], ['C_Join', 'Join'], ['C_Fin', 'FinalNode']]) {
            lookup[id] = { className: 'DClass', id, name, extends: ['C_AN'] };
        }
        lookup.C_CF = { className: 'DClass', id: 'C_CF', name: 'ControlFlow', extends: [] };
        for (const id of ['R_source', 'R_target']) lookup[id] = { className: 'DReference', id, name: id.slice(2) };
        lookup.A_effect = { className: 'DAttribute', id: 'A_effect', name: 'effect' };
        return lookup;
    }

    /** S -e1-> D; D -e2 [D.[decision]]-> A, D -e3 [else]-> B; `decision` an input of every State (R-SIM-88). */
    function decision(): Lookup {
        const DECISION = { name: 'decision', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true };
        return buildLookup({ ...ROLES, simGuard: 'A_guard', simTerminal: 'C_Final', simStateAttributes: JSON.stringify({ v: 1, attrs: [DECISION] }) }, {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } },
            D: { cls: 'C_State', slots: { R_out: ['e2', 'e3'] } },
            A: { cls: 'C_Final' },
            B: { cls: 'C_Final' },
            e1: { cls: 'C_Trans', slots: { R_next: ['D'] } },
            e2: { cls: 'C_Trans', slots: { R_next: ['A'], A_guard: ['D.[decision]'] } },
            e3: { cls: 'C_Trans', slots: { R_next: ['B'], A_guard: ['else'] } },
        });
    }

    /** The record of `buildEvalContext`: one handle per object of the model, instance names bound at the top. */
    const recordOf = (lookup: Lookup) => () => {
        const h: Record<string, any> = {};
        for (const id of collectModelObjectIds(lookup, 'M')) h[id] = { id, __type: 'Object', name: lookup[id].name };
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup, seed?: number, record: () => Record<string, any> = recordOf(lookup)) => {
        const r = startRun(lookup, 'M', 'MM', 'P', spyBuilder(record).build, seed);
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r.run;
    };
    const marking = (lookup: Lookup) => markingLine(getSimRun('M')!.config.state, getSimRun('M')!.net, lookup).line;
    const status = () => runStatus(getSimRun('M')!);

    /** One Play press as the panel runs it: a tick at a time, the steps carried to the next, until it stops (at most `cap` ticks). */
    function play(lookup: Lookup, cap = 5000) {
        let steps = 0;
        for (let tick = 0; tick < cap; tick++) {
            const r = playPress('M', lookup, steps);
            steps = r.steps;
            if (r.stop !== null) return { stop: r.stop, steps, press: r.press, ticks: tick + 1 };
        }
        throw new Error(`Play did not stop in ${cap} ticks`);
    }

    it('Step under Random opens no list: the drawn candidate fires, origin random, one draw; under Ask the list opens and nothing is committed (mutants: the policy not read; the draw applied under Ask)', () => {
        const lookup = demoPetri();
        reset(lookup, 2026);
        const asked = pressStep('M', lookup);
        expect(asked.pending?.map(c => c.transition)).toEqual(['t1', 't3']);
        expect([asked.lastStep, getSimRun('M')!.trace]).toEqual([null, []]);
        setSimPolicy('M', { choices: 'random' });
        const drawn = pressStep('M', lookup, undefined, () => 0.99);
        expect(drawn.pending).toBeNull();
        expect(drawn.lastStep).toBe('ε (random): t3 (lock → ∅) fired');
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 't3', kind: 'fired', origin: 'random' }]);
        expect(getSimRun('M')!.draws).toBe(1);
        // a forced ε press under Random is today's: no marker, no draw
        const flow = flowB();
        reset(flow, 5);
        setSimPolicy('M', { choices: 'random' });
        expect(pressStep('M', flow).lastStep).toBe('ε: f1 (i0 → work) fired');
        expect(getSimRun('M')!.draws).toBe(0);
    });

    it('the policy applies to ε only: under Random an event\'s list still opens (A3; mutant: the draw applied to every press)', () => {
        const TWO_PUSH: Record<string, Obj> = {
            ...TURNSTILE,
            Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL', 'tPushX'] } },
            tPushX: { cls: 'C_Trans', slots: { R_next: ['Unlocked'], R_trigger: ['push'] } },
        };
        const lookup = buildLookup(ROLES, TWO_PUSH);
        reset(lookup, 7, turnstileRecord);
        setSimPolicy('M', { choices: 'random' });
        const asked = pressInput('M', 'push', undefined, lookup, 'Push');
        expect(asked.pending?.map(c => c.transition).sort()).toEqual(['tPushL', 'tPushX']);
        expect(getSimRun('M')!.trace).toEqual([]);
    });

    it('playTick is pure and orders its stops: no run, the stopped statuses, k, an input, no ε candidate, a list under Ask, else press (mutants: k by >, each stop dropped)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        const run = reset(lookup, 1);
        expect(playTick(undefined, { choices: 'random', k: 5 }, 0)).toEqual({ kind: 'stop', reason: 'cleared' });
        expect(playTick(run, { choices: 'random', k: 3 }, 2)).toEqual({ kind: 'press' });
        expect(playTick(run, { choices: 'random', k: 3 }, 3)).toEqual({ kind: 'stop', reason: 'limit' });
        expect(playTick(run, { choices: 'ask', k: 3 }, 0)).toEqual({ kind: 'stop', reason: 'choice' });
        // pure: the store is untouched
        expect([getSimRun('M'), getSimRun('M')!.trace]).toEqual([run, []]);
    });

    it('at k Play stops, exactly k steps, the run still Running, «Play stopped at 100 steps»; a second press goes on (cyclic net; mutants: the counter not advanced; k by >)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 2026);
        setSimPolicy('M', { choices: 'random' });
        const first = play(lookup);
        expect([first.stop, first.steps, first.press]).toEqual<[PlayStop, number, null]>(['limit', 100, null]);
        expect(getSimRun('M')!.trace).toHaveLength(100);
        expect(getSimRun('M')!.draws).toBe(50);
        expect(status()).toBe('Running');
        expect(playStopLine(first.stop, first.steps)).toBe('Play stopped at 100 steps');
        const again = play(lookup);
        expect([again.stop, again.steps]).toEqual(['limit', 100]);
        expect(getSimRun('M')!.trace).toHaveLength(200);
        // k is read from the policy: 7 stops at 7
        reset(lookup, 2026);
        setSimPolicy('M', { k: 7 });
        expect(play(lookup)).toMatchObject({ stop: 'limit', steps: 7 });
        expect(getSimRun('M')!.trace).toHaveLength(7);
        expect(playStopLine('limit', 1)).toBe('Play stopped at 1 step');
    });

    it('Petri under Random ends in Deadlock at p2 ×2, p3 in 4 steps, three seeds (mutant: the stopped statuses not checked)', () => {
        const lookup = demoPetri();
        const traces: string[][] = [];
        for (const seed of [1, 99, 2026]) {
            reset(lookup, seed);
            setSimPolicy('M', { choices: 'random' });
            const r = play(lookup);
            expect([r.stop, r.steps, r.press]).toEqual<[PlayStop, number, null]>(['Deadlock', 4, null]);
            expect([status(), marking(lookup)]).toEqual(['Deadlock', 'Marking: p2 ×2, p3']);
            expect(getSimRun('M')!.trace!.some(t => t.origin === 'random')).toBe(true);
            expect(playStopLine(r.stop, r.steps)).toBeNull();
            traces.push(getSimRun('M')!.trace!.map(t => t.selector ?? ''));
        }
        // control: the seeds draw different paths, so the four steps are not one fixed path
        expect(new Set(traces.map(t => t.join())).size).toBeGreaterThan(1);
    });

    it('Flow B ends Terminated in 6 steps, under Ask as under Random, with no draw (mutant: the stopped statuses not checked)', () => {
        for (const choices of ['ask', 'random'] as const) {
            const lookup = flowB();
            reset(lookup, 3);
            setSimPolicy('M', { choices });
            const r = play(lookup);
            expect([r.stop, r.steps]).toEqual(['Terminated', 6]);
            expect([status(), getSimRun('M')!.draws]).toEqual(['Terminated', 0]);
        }
    });

    it('a halted run stops Play at the next tick: a drawn or forced step over the bound halts (mutant: Halted left out of the stops)', () => {
        const lookup = petri({
            p: { cls: 'C_Place', slots: { A_tokens: [1] } },
            q: { cls: 'C_Place', slots: { A_tokens: [1] } },
            tx: { cls: 'C_PTr' },
            a1: { cls: 'C_Arc', slots: { R_src: ['p'], R_tgt: ['tx'] } },
            a2: { cls: 'C_Arc', slots: { R_src: ['tx'], R_tgt: ['q'] } },
            ty: { cls: 'C_PTr' },
            a3: { cls: 'C_Arc', slots: { R_src: ['q'], R_tgt: ['ty'] } },
            a4: { cls: 'C_Arc', slots: { R_src: ['ty'], R_tgt: ['q'] } },
        }, '1');
        reset(lookup, 4);
        setSimPolicy('M', { choices: 'random' });
        const r = play(lookup);
        expect(getSimRun('M')!.halt).not.toBeNull();
        expect([r.stop, status()]).toEqual(['Halted', 'Halted']);
        expect(r.steps).toBe(getSimRun('M')!.trace!.length);
    });

    it('SM: no ε candidate while an event has one, Play waits for an event at 0 steps and commits nothing (mutant: the no-candidate stop dropped)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        reset(lookup, 8, turnstileRecord);
        setSimPolicy('M', { choices: 'random' });
        const r = play(lookup);
        expect([r.stop, r.steps, r.press, r.ticks]).toEqual<[PlayStop, number, null, number]>(['event', 0, null, 1]);
        expect([status(), getSimRun('M')!.trace]).toEqual(['Running', []]);
        expect(playStopLine(r.stop, r.steps)).toBe('Play waits for an event');
    });

    it('an ε press that asks an input stops Play with the asks, nothing committed; Play never answers it (mutant: the input stop dropped)', () => {
        const lookup = decision();
        reset(lookup, 9);
        setSimPolicy('M', { choices: 'random' });
        const r = play(lookup);
        expect([r.stop, r.steps]).toEqual(['input', 1]);
        expect(r.press?.asks).toEqual([{ element: 'D', attr: 'decision', domain: { kind: 'boolean' } }]);
        expect([r.press?.pending, r.press?.outcome]).toEqual([null, null]);
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([{ event: null, selector: 'e1', kind: 'fired' }]);
        expect(playStopLine(r.stop, r.steps)).toBe('Play waits for an input');
    });

    it('under Ask Play stops at the first list and opens it, nothing committed (mutant: the list drawn under Ask)', () => {
        const lookup = demoPetri();
        reset(lookup, 10);
        const r = play(lookup);
        expect([r.stop, r.steps]).toEqual(['choice', 0]);
        expect(r.press?.pending?.map(c => c.transition)).toEqual(['t1', 't3']);
        expect([getSimRun('M')!.trace, marking(lookup)]).toEqual([[], 'Marking: lock, p1 ×2']);
        expect(playStopLine(r.stop, r.steps)).toBeNull();
    });

    it('a cleared run stops Play at the next tick, nothing pressed (Stop, the R-SIM-34 interruption; mutant: the no-run stop dropped)', () => {
        const lookup = buildLookup(ROLES, CYCLE);
        reset(lookup, 11);
        setSimPolicy('M', { choices: 'random' });
        let steps = 0;
        for (let i = 0; i < 3; i++) steps = playPress('M', lookup, steps).steps;
        expect(steps).toBe(3);
        simClear('M');
        expect(playPress('M', lookup, steps)).toEqual({ stop: 'cleared', press: null, steps: 3 });
        expect(getSimRun('M')).toBeUndefined();
    });

    it('every press of Play is ε: a spy on step sees event null on every call, and no call where only an event has a candidate (mutant: an event pressed)', () => {
        const spy = vi.spyOn(netStepModule, 'step');
        try {
            // Locked -ε-> Unlocked -ε-> Locked beside the turnstile's coin and push: both kinds of input have candidates
            const MIX: Record<string, Obj> = {
                ...TURNSTILE,
                Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL', 'tGo'] } },
                Unlocked: { cls: 'C_State', slots: { R_out: ['tPushU', 'tBack'] } },
                tGo: { cls: 'C_Trans', slots: { R_next: ['Unlocked'] } },
                tBack: { cls: 'C_Trans', slots: { R_next: ['Locked'] } },
            };
            const mix = buildLookup(ROLES, MIX);
            reset(mix, 12, turnstileRecord);
            setSimPolicy('M', { choices: 'random', k: 6 });
            expect(play(mix)).toMatchObject({ stop: 'limit', steps: 6 });
            // control: the spy sees the bridge's calls, one per step
            expect(spy).toHaveBeenCalledTimes(6);
            expect(spy.mock.calls.map(c => c[1].event)).toEqual([null, null, null, null, null, null]);
            spy.mockClear();
            const sm = buildLookup(ROLES, TURNSTILE);
            reset(sm, 13, turnstileRecord);
            expect(play(sm).stop).toBe('event');
            expect(spy).not.toHaveBeenCalled();
        } finally {
            spy.mockRestore();
        }
    });
});

describe('R-SIM-106: the inputs of a step on the trace, the replay, and a press while a past step is shown (P-2026-10-03-0040)', () => {
    /** S -e1-> D; D -e2 [D.[decision]]-> A, D -e3 [else]-> B; `decision` an input of every State. */
    const DECISION = { name: 'decision', metaclass: 'C_State', space: 'semantic', domain: { kind: 'boolean' }, input: true };
    const lookupOf = (): Lookup => buildLookup({
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
    const record = () => {
        const h: Record<string, any> = {};
        for (const id of ['S', 'D', 'A', 'B', 'e1', 'e2', 'e3']) h[id] = { id, __type: 'Object', name: id };
        h.e1.next = h.D; h.e2.next = h.A; h.e3.next = h.B;
        return { instances: Object.values(h), classes: [], ...h };
    };
    const reset = (lookup: Lookup) => {
        const r = startRun(lookup, 'M', 'MM', 'P', () => record());
        if (r.kind !== 'started') throw new Error(`refused: ${r.reason}`);
        simReset('M', r.run);
        return r.run;
    };
    const eps = (lookup: Lookup, values?: Array<{ element: string; attr: string; value: boolean }>) => pressInput('M', null, undefined, lookup, 'ε', values);
    const answer = (value: boolean) => [{ element: 'D', attr: 'decision', value }];

    it('press records the values it was given on the step it commits; a step given none has no field (mutant: the values not passed to the store)', () => {
        const lookup = lookupOf();
        reset(lookup);
        eps(lookup);
        expect(eps(lookup).asks).toHaveLength(1);
        eps(lookup, answer(false));
        expect(getSimRun('M')!.trace).toEqual<SimTraceStep[]>([
            { event: null, selector: 'e1', kind: 'fired' },
            { event: null, selector: 'e3', kind: 'fired', inputs: answer(false) },
        ]);
    });

    it('a step that read an input replays with the value it was given: e2, not the else (mutant: the replay ignores the inputs)', () => {
        const lookup = lookupOf();
        reset(lookup);
        eps(lookup);
        eps(lookup, answer(true));
        expect(getSimActiveIds('M')).toEqual(['A']);
        const run = { ...getSimRun('M')!, keptConfigs: [] };
        expect([...configAt(run, 1)!.state.marking]).toEqual([['D', 1]]);
        expect([...configAt(run, 2)!.state.marking]).toEqual([['A', 1]]);
        expect(configAt(run, 0)!.state).toBe(run.net.initial);
    });

    it('a press while a past step is shown acts on the live configuration and returns the view to live (mutant: the press reads the viewed record)', () => {
        const lookup = buildLookup(ROLES, TURNSTILE);
        simReset('M', started(lookup));
        pressInput('M', 'coin', undefined, lookup, 'Coin');
        pressInput('M', 'push', undefined, lookup, 'Push');
        simSetView('M', 1);
        expect(getSimActiveIds('M')).toEqual(['Unlocked']);
        const r = pressInput('M', 'coin', undefined, lookup, 'Coin');
        expect(r.lastStep).toBe('Coin: tCoin (Locked → Unlocked) fired');
        expect(getSimView('M')).toBeNull();
        expect(getSimActiveIds('M')).toEqual(['Unlocked']);
        expect(getSimRun('M')!.trace).toHaveLength(3);
    });

    it('a press that commits nothing returns to live too: the list or the dialog are the live step\'s (mutant: only a commit returns)', () => {
        const lookup = lookupOf();
        reset(lookup);
        eps(lookup);
        simSetView('M', 0);
        expect(getSimActiveIds('M')).toEqual(['S']);
        expect(eps(lookup).asks).toHaveLength(1);
        expect(getSimView('M')).toBeNull();
        expect(getSimActiveIds('M')).toEqual(['D']);
    });

    it('watchRows: an input is IVAR, its value the one its step was given, never a change (R-SIM-102)', () => {
        const lookup = lookupOf();
        reset(lookup);
        eps(lookup);
        eps(lookup, answer(true));
        const run = getSimRun('M')!;
        const pins = [{ metaclass: 'C_State', name: 'decision', space: 'semantic' as const }];
        const out = watchRows(run.net, configAt(run, 2)!.state, configAt(run, 1)!.state, pins, lookup, run.trace![1].inputs);
        expect(out.map(r => [r.name, r.kind, r.value, r.changed])).toEqual([
            ['A.decision', 'IVAR', null, false], ['B.decision', 'IVAR', null, false], ['D.decision', 'IVAR', true, false], ['S.decision', 'IVAR', null, false],
        ]);
        expect(watchRows(run.net, configAt(run, 1)!.state, configAt(run, 0)!.state, pins, lookup).every(r => r.value === null)).toBe(true);
    });
});

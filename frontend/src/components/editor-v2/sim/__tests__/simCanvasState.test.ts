/**
 * simCanvasState: what the canvas reads of a run, per node (S15, slice A1,
 * P-2026-09-27-1647). Executes the pure module and the store selector (P11)
 * on hand-built nets; the store is module-level, so it is reset before every
 * test. Each test name says which break of the rule kills it; the mutation
 * bench is in the commit message.
 */

import { beforeEach, describe, it, expect } from 'vitest';
import {
    choiceElements, enabledElements, initialMarkingFeature, isInitialMarkingRow, nodeStateOf,
} from '../simCanvasState';
import { __resetSimRunsForTests, getSimNodeState, simCommit, simReset } from '../simRunState';
import type { SimRun } from '../simRunState';
import { step } from '../../../../model/simulation/netStep';
import type {
    ActionOracle, CompiledNet, DerivedValues, GuardOracle, HaltReason, InputRead, NetTransition, SimState, SimValue,
} from '../../../../model/simulation/netTypes';

const TRUE: GuardOracle = () => ({ kind: 'true' });
const NONE: ActionOracle = () => ({ kind: 'ok', assignments: [] });

function tr(
    id: string, pre: Record<string, number>, post: Record<string, number>,
    opts: { triggers?: string[]; origin?: string[]; guardSites?: string[] } = {},
): NetTransition {
    return {
        id, origin: opts.origin ?? [id],
        preset: Object.entries(pre).map(([place, weight]) => ({ place, weight })),
        postset: Object.entries(post).map(([place, weight]) => ({ place, weight })),
        inhibitors: [], triggers: opts.triggers ?? [], guardSites: opts.guardSites ?? [], elseOf: null, actionSites: [],
    };
}

function mkNet(transitions: NetTransition[], modelId = 'M'): CompiledNet {
    const places = new Set<string>();
    for (const t of transitions) for (const a of [...t.preset, ...t.postset]) places.add(a.place);
    return {
        modelId, places, transitions, bound: 1, final: null, hasEventRole: transitions.some(t => t.triggers.length > 0),
        attributes: [], declared: new Map(), initial: { marking: new Map(), attrs: new Map(), presentation: new Map() }, defects: [],
    };
}

type Space = Record<string, Record<string, SimValue>>;
const space = (s: Space = {}) => new Map(Object.entries(s).map(([e, v]) => [e, new Map(Object.entries(v))]));

function st(marking: Record<string, number>, attrs: Space = {}, presentation: Space = {}, derived?: Space): SimState {
    const d: DerivedValues | undefined = derived ? { attrs: space(derived), presentation: space() } : undefined;
    return { marking: new Map(Object.entries(marking)), attrs: space(attrs), presentation: space(presentation), ...(d ? { derived: d } : {}) };
}

function mkRun(
    net: CompiledNet, state: SimState, opts: { halt?: HaltReason | null; guards?: GuardOracle; alphabet?: string[] } = {},
): SimRun {
    return {
        net, config: { state, event: null }, halt: opts.halt ?? null, guards: opts.guards ?? TRUE, actions: NONE,
        alphabet: opts.alphabet ?? [], signature: 'sig',
    };
}

const UNSAFE: HaltReason = { kind: 'unsafe', place: 'b', value: 2, bound: 1 };

beforeEach(() => {
    __resetSimRunsForTests();
});

describe('nodeStateOf: tokens on every place of the net, 0 included', () => {
    const net = mkNet([tr('t', { a: 1 }, { b: 1 })]);

    it('a marked place reads its count', () => {
        expect(nodeStateOf(mkRun(net, st({ a: 2 })), 'a')?.tokens).toBe(2);
    });

    it('an empty place of the net reads 0, not null (killed by dropping the 0-count places)', () => {
        const s = nodeStateOf(mkRun(net, st({ a: 1 })), 'b');
        expect(s).not.toBeNull();
        expect(s?.tokens).toBe(0);
    });

    it('an object the run does not know is null (killed by answering every object)', () => {
        expect(nodeStateOf(mkRun(net, st({ a: 1 })), 'elsewhere')).toBeNull();
    });

    it('carries the model of the run it came from', () => {
        expect(nodeStateOf(mkRun(net, st({ a: 1 })), 'a')?.modelId).toBe('M');
    });
});

describe('enabledElements: the origins of the candidates of some input, while the run can move', () => {
    it('a candidate marks the elements it was compiled from, not its transition id (killed by mapping the id)', () => {
        const net = mkNet([tr('fk#e1', { a: 1 }, { b: 1, c: 1 }, { origin: ['fk', 'e1', 'e2'] })]);
        const run = mkRun(net, st({ a: 1 }));
        expect([...enabledElements(run)].sort()).toEqual(['e1', 'e2', 'fk']);
        expect(nodeStateOf(run, 'e2')?.enabled).toBe(true);
        expect(nodeStateOf(run, 'fk#e1')).toBeNull();
    });

    it('a transition accepted only by an event of the alphabet is enabled (killed by asking ε alone)', () => {
        const net = mkNet([tr('tc', { a: 1 }, { b: 1 }, { triggers: ['coin'] })]);
        expect(nodeStateOf(mkRun(net, st({ a: 1 }), { alphabet: ['coin'] }), 'tc')?.enabled).toBe(true);
    });

    it('a transition whose guard is false is not enabled (killed by a structural-only reading)', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 }, { guardSites: ['t'] })]);
        const guards: GuardOracle = () => ({ kind: 'false' });
        expect(enabledElements(mkRun(net, st({ a: 1 }), { guards })).size).toBe(0);
        expect(nodeStateOf(mkRun(net, st({ a: 1 }), { guards }), 't')).toBeNull();
    });

    it('a halted run has no enabled element, and its places keep their counts (killed by dropping the halt gate)', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 })]);
        const run = mkRun(net, st({ a: 1 }), { halt: UNSAFE });
        expect(enabledElements(run).size).toBe(0);
        expect(nodeStateOf(run, 't')).toBeNull();
        expect(nodeStateOf(run, 'a')?.tokens).toBe(1);
    });

    it('a disabled transition is not enabled', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { a: 1 })]);
        const run = mkRun(net, st({ a: 1 }));
        expect(nodeStateOf(run, 't')?.enabled).toBe(true);
        expect(nodeStateOf(run, 'u')).toBeNull();
    });
});

describe('enabledElements: a transition waiting for an input is ringed, as runStatus keeps its run Running (R-SIM-88)', () => {
    const DECISION: InputRead = { element: 'D', attr: 'decision', domain: { kind: 'boolean' } };
    // The DecisionNode of Flow B: both edges read the input, so no guard is true before it is answered.
    const unanswered: GuardOracle = () => ({ kind: 'false' });
    const waiting = (run: SimRun, reads: Record<string, InputRead[]>): SimRun => ({ ...run, inputs: new Map(Object.entries(reads)) });

    it('the edges of a decision that wait for an input are ringed (killed by reading the candidates alone)', () => {
        const net = mkNet([
            tr('f1', { d: 1 }, { a: 1 }, { origin: ['Flow_1'], guardSites: ['Flow_1'] }),
            tr('f2', { d: 1 }, { b: 1 }, { origin: ['Flow_2'], guardSites: ['Flow_2'] }),
        ]);
        const run = waiting(mkRun(net, st({ d: 1 }), { guards: unanswered }), { f1: [DECISION], f2: [DECISION] });
        expect([...enabledElements(run)].sort()).toEqual(['Flow_1', 'Flow_2']);
        expect(nodeStateOf(run, 'Flow_1')?.enabled).toBe(true);
    });

    it('a transition that reads no input keeps the guard\'s reading (killed by ringing every structurally enabled transition)', () => {
        const net = mkNet([
            tr('f1', { d: 1 }, { a: 1 }, { origin: ['Flow_1'], guardSites: ['Flow_1'] }),
            tr('f3', { d: 1 }, { c: 1 }, { origin: ['Flow_3'], guardSites: ['Flow_3'] }),
        ]);
        const run = waiting(mkRun(net, st({ d: 1 }), { guards: unanswered }), { f1: [DECISION], f3: [] });
        expect([...enabledElements(run)]).toEqual(['Flow_1']);
    });

    it('its preset unmarked, or an inhibitor marked, it does not wait (killed by skipping either structural check)', () => {
        const unmarked = mkNet([tr('f1', { d: 1 }, { a: 1 }, { origin: ['Flow_1'] })]);
        expect(enabledElements(waiting(mkRun(unmarked, st({ a: 1 }), { guards: unanswered }), { f1: [DECISION] })).size).toBe(0);
        const inhibited = mkNet([{ ...tr('f1', { d: 1 }, { a: 1 }, { origin: ['Flow_1'] }), inhibitors: [{ place: 'x', weight: 1 }] }]);
        expect(enabledElements(waiting(mkRun(inhibited, st({ d: 1, x: 1 }), { guards: unanswered }), { f1: [DECISION] })).size).toBe(0);
    });

    it('it waits only for an input the run can give: ε, or an event of the alphabet (killed by skipping the trigger check)', () => {
        const net = mkNet([tr('tc', { d: 1 }, { a: 1 }, { origin: ['Tc'], triggers: ['coin'] })]);
        expect(enabledElements(waiting(mkRun(net, st({ d: 1 }), { guards: unanswered }), { tc: [DECISION] })).size).toBe(0);
        expect([...enabledElements(waiting(mkRun(net, st({ d: 1 }), { guards: unanswered, alphabet: ['coin'] }), { tc: [DECISION] }))]).toEqual(['Tc']);
    });

    it('a halted or terminated run waits for nothing (killed by dropping either gate)', () => {
        const net = mkNet([tr('f1', { d: 1 }, { a: 1 }, { origin: ['Flow_1'] })]);
        expect(enabledElements(waiting(mkRun(net, st({ d: 1 }), { guards: unanswered, halt: UNSAFE }), { f1: [DECISION] })).size).toBe(0);
        const ended: CompiledNet = { ...net, final: new Set(['d']) };
        expect(enabledElements(waiting(mkRun(ended, st({ d: 1 }), { guards: unanswered }), { f1: [DECISION] })).size).toBe(0);
    });
});

describe('choiceElements: the elements the transitions of an open choice list were compiled from (slice A2)', () => {
    it('maps a listed transition to its origins, not its id (killed by mapping the id)', () => {
        const net = mkNet([
            tr('fk#e1', { a: 1 }, { b: 1 }, { origin: ['fk', 'e1'] }),
            tr('fk#e2', { a: 1 }, { c: 1 }, { origin: ['fk', 'e2'] }),
        ]);
        expect([...choiceElements(net, ['fk#e1', 'fk#e2'])].sort()).toEqual(['e1', 'e2', 'fk']);
    });

    it('only the listed transitions, not every candidate (killed by answering the enabled set)', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { a: 1 }, { c: 1 })]);
        expect(enabledElements(mkRun(net, st({ a: 1 }))).size).toBe(2);
        expect([...choiceElements(net, ['u'])]).toEqual(['u']);
    });

    it('an id the net does not know, or an empty list, marks nothing', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 })]);
        expect(choiceElements(net, ['nope']).size).toBe(0);
        expect(choiceElements(net, []).size).toBe(0);
    });
});

describe('nodeStateOf: σ of the element, semantic only, stored then derived, by attribute', () => {
    const net = mkNet([tr('t', { a: 1 }, { b: 1 })]);

    it('lists the stored and the derived semantic attributes, sorted, as text (killed by dropping the derived space)', () => {
        const run = mkRun(net, st({ a: 1 }, { a: { visits: 2, paid: true } }, {}, { a: { total: 5 } }));
        expect(nodeStateOf(run, 'a')?.sigma).toEqual([
            { attr: 'paid', value: 'true' }, { attr: 'total', value: '5' }, { attr: 'visits', value: '2' },
        ]);
    });

    it('leaves the presentation out (killed by reading the presentation space)', () => {
        const run = mkRun(net, st({ a: 1 }, {}, { a: { colour: 'red' } }));
        expect(nodeStateOf(run, 'a')?.sigma).toEqual([]);
    });

    it('an element with σ only is not null, and reads no count', () => {
        const run = mkRun(net, st({ a: 1 }, { tx: { n: 3 } }));
        const s = nodeStateOf(run, 'tx');
        expect(s?.tokens).toBeNull();
        expect(s?.sigma).toEqual([{ attr: 'n', value: '3' }]);
    });

    it('the model globals are not a node\'s σ', () => {
        const run = mkRun(net, st({ a: 1 }, { M: { coins: 2 } }));
        expect(nodeStateOf(run, 'a')?.sigma).toEqual([]);
    });
});

describe('getSimNodeState: the store, per model, per committed configuration', () => {
    it('finds the run that knows the object among several models (killed by reading only the first run)', () => {
        simReset('M1', mkRun(mkNet([tr('t', { a: 1 }, { b: 1 })], 'M1'), st({ a: 1 })));
        simReset('M2', mkRun(mkNet([tr('u', { x: 1 }, { y: 1 })], 'M2'), st({ x: 1 })));
        expect(getSimNodeState('y')).toEqual({ modelId: 'M2', tokens: 0, sigma: [], enabled: false });
        expect(getSimNodeState('a')?.modelId).toBe('M1');
    });

    it('is null without a run', () => {
        expect(getSimNodeState('a')).toBeNull();
    });

    it('follows a fired step: the enabled set is the new configuration\'s (killed by a cache that outlives the run record)', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 }), tr('u', { b: 1 }, { a: 1 })]);
        simReset('M', mkRun(net, st({ a: 1 })));
        expect(getSimNodeState('t')?.enabled).toBe(true);
        expect(getSimNodeState('u')).toBeNull();
        simCommit('M', step(net, { state: st({ a: 1 }), event: null }, 't', TRUE, NONE));
        expect(getSimNodeState('t')).toBeNull();
        expect(getSimNodeState('u')?.enabled).toBe(true);
        expect(getSimNodeState('b')?.tokens).toBe(1);
    });
});

describe('the initial-marking row', () => {
    const petriBag = {
        simNode: 'cNode', simTransition: 'cTr', simArc: 'cArc', simArcSource: 'fSrc', simArcTarget: 'fTgt',
        simInitialMarking: 'fTokens',
    };
    const lookup: Record<string, any> = {
        m1: { instanceof: 'mm' },
        mm: { _state: petriBag },
        dvTokens: { instanceof: 'fTokens' },
        dvOther: { instanceof: 'fName' },
    };

    it('reads the Initial marking feature of the model\'s metamodel', () => {
        expect(initialMarkingFeature(lookup, 'm1')).toBe('fTokens');
    });

    it('is null for a model whose metamodel has no complete roles', () => {
        expect(initialMarkingFeature({ m1: { instanceof: 'mm' }, mm: { _state: { simInitialMarking: 'fTokens' } } }, 'm1')).toBeNull();
        expect(initialMarkingFeature({}, 'm1')).toBeNull();
    });

    it('matches a slot by the feature it instantiates, and a placeholder by the feature id itself (killed by comparing the slot id)', () => {
        expect(isInitialMarkingRow(lookup, 'dvTokens', 'fTokens')).toBe(true);
        expect(isInitialMarkingRow(lookup, 'fTokens', 'fTokens')).toBe(true);
        expect(isInitialMarkingRow(lookup, 'dvOther', 'fTokens')).toBe(false);
        expect(isInitialMarkingRow(lookup, 'dvTokens', null)).toBe(false);
    });
});

/**
 * netStep — step 3a (P-2026-09-25-0935): candidates, admissibility, effect,
 * label and status of the Petri core (spec §4, R-SIM-21, R-SIM-23..31).
 *
 * Executes the public functions (P11) on nets built by hand, where one rule is
 * isolated, and on nets compiled from raw lookups, for the three worked
 * examples of report §5.4 (docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md).
 * Every "nothing happens" has its control (P12). Guards and actions arrive
 * through oracles; one block wires the real `compileGuard`/`evaluateGuard` of
 * step 2 over a synthetic snapshot, as guardEvaluator.test.ts does.
 */

import { describe, it, expect } from 'vitest';
import { admissible, candidates, isMarked, netRunStatus, stateAccess, step, structuralInputs, terminated, tokens } from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import { buildGuardContext, freezeSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { GuardOutcome } from '../guardEvaluator';
import type {
    ActionOracle, ActionSite, CompiledNet, GuardOracle, NetConfiguration, NetModelView, NetStc, NetTransition, SimAssignment,
    SimState, SimStateAccess, SimValue, StateAttributeDecl,
} from '../netTypes';

// ── hand-built nets ─────────────────────────────────────────────────────────

function tr(id: string, pre: Record<string, number>, post: Record<string, number>, x: Partial<NetTransition> = {}): NetTransition {
    const preset = Object.entries(pre).map(([place, weight]) => ({ place, weight }));
    const postset = Object.entries(post).map(([place, weight]) => ({ place, weight }));
    return {
        id, origin: [id], preset, postset, inhibitors: [], triggers: [], guardSites: [], elseOf: null,
        actionSites: [
            ...preset.map((a): ActionSite => ({ element: a.place, role: 'exit' })),
            { element: id, role: 'transition' },
            ...postset.map((a): ActionSite => ({ element: a.place, role: 'entry' })),
        ],
        ...x,
    };
}

interface NetOpts {
    bound?: number;
    final?: string[] | null;
    /** element -> declarations it carries */
    declared?: Record<string, StateAttributeDecl[]>;
}

function mkNet(transitions: NetTransition[], o: NetOpts = {}): CompiledNet {
    const places = new Set<string>();
    for (const t of transitions) for (const a of [...t.preset, ...t.postset, ...t.inhibitors]) places.add(a.place);
    const declared = new Map<string, Map<string, StateAttributeDecl>>();
    for (const [e, ds] of Object.entries(o.declared ?? {})) declared.set(e, new Map(ds.map(d => [d.name, d])));
    return {
        modelId: 'M', places, transitions, bound: o.bound ?? 1, final: o.final ? new Set(o.final) : null,
        hasEventRole: transitions.some(t => t.triggers.length > 0), attributes: [], declared,
        initial: { marking: new Map(), attrs: new Map(), presentation: new Map() }, defects: [],
    };
}

function st(marking: Record<string, number>, attrs: Record<string, Record<string, SimValue>> = {}): SimState {
    return {
        marking: new Map(Object.entries(marking)),
        attrs: new Map(Object.entries(attrs).map(([e, m]) => [e, new Map(Object.entries(m))])),
        presentation: new Map(),
    };
}

function cfg(marking: Record<string, number>, event: string | null = null, attrs: Record<string, Record<string, SimValue>> = {}): NetConfiguration {
    return { state: st(marking, attrs), event };
}

const m = (s: SimState) => Object.fromEntries([...s.marking].sort());
const ids = (net: CompiledNet, c: NetConfiguration, g: GuardOracle = NO_GUARDS) => candidates(net, c, g).candidates.map(x => x.transition);

const NO_GUARDS: GuardOracle = () => ({ kind: 'true' });
const NO_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });
const guardsBy = (table: Record<string, GuardOutcome['kind'] | GuardOutcome>): GuardOracle => site => {
    const v = table[site] ?? 'true';
    if (typeof v !== 'string') return v;
    return v === 'defect' ? { kind: 'defect', reason: 'exception', detail: 'x' } : { kind: v };
};
/** Actions keyed by `role:element`; each builds its assignments from the state it is given. */
const actionsBy = (table: Record<string, (s: SimStateAccess) => SimAssignment[] | string>): ActionOracle => (site, _e, s) => {
    const f = table[`${site.role}:${site.element}`];
    if (!f) return { kind: 'ok', assignments: [] };
    const out = f(s);
    return typeof out === 'string' ? { kind: 'defect', detail: out } : { kind: 'ok', assignments: out };
};

const range = (name: string, max: number, metaclass: string | null = null): StateAttributeDecl =>
    ({ name, metaclass, space: 'semantic', domain: { kind: 'range', min: 0, max }, initial: 0 });

// ── raw lookups, read as the 3b adapter will read them ──────────────────────

interface Spec {
    classes: Record<string, string[]>;
    objects: Record<string, { cls: string; slots?: Record<string, unknown[]> }>;
}

function compileSpec(stc: NetStc, spec: Spec, decls: StateAttributeDecl[] = []): CompiledNet {
    const lookup: Record<string, any> = {};
    for (const [c, ext] of Object.entries(spec.classes)) lookup[c] = { className: 'DClass', extends: ext };
    for (const [id, o] of Object.entries(spec.objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            features.push(`v_${id}_${f}`);
            lookup[`v_${id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
    }
    const view: NetModelView = {
        exists: id => !!lookup[id], isInstanceOf: (id, c) => isKindOf(lookup, id, c),
        outgoingTransitions: () => [], transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f), values: (o, f) => objectSlotValues(lookup, o, f),
    };
    return compileNet(stc, view, 'M', Object.keys(spec.objects), decls);
}

// ── the rules of report §10.3 ───────────────────────────────────────────────

describe('enabling (R-SIM-21): the preset holds at least the weight of each arc', () => {
    const net = mkNet([tr('t', { p: 2 }, { q: 1 })], { bound: 2 });

    it('M(p) = 1 below weight 2: no candidate; M(p) = 2: t', () => {
        expect(ids(net, cfg({ p: 1 }))).toEqual([]);
        expect(ids(net, cfg({ p: 2 }))).toEqual(['t']);
    });

    it('the firing takes the weight away', () => {
        const out = step(net, cfg({ p: 2 }), 't', NO_GUARDS, NO_ACTIONS);
        expect(out.kind).toBe('fired');
        expect(out.kind === 'fired' && m(out.next.state)).toEqual({ q: 1 });
    });
});

describe('AND-join and parallel fork (R-SIM-22)', () => {
    it('AND-join: one input marked is not enough; both are, and both empty', () => {
        const net = mkNet([tr('j', { a: 1, b: 1 }, { c: 1 })]);
        expect(ids(net, cfg({ a: 1 }))).toEqual([]);
        expect(ids(net, cfg({ a: 1, b: 1 }))).toEqual(['j']);
        const out = step(net, cfg({ a: 1, b: 1 }), 'j', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && m(out.next.state)).toEqual({ c: 1 });
    });

    it('parallel fork: one firing marks every output', () => {
        const net = mkNet([tr('f', { p: 1 }, { a: 1, b: 1 })]);
        const out = step(net, cfg({ p: 1 }), 'f', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && m(out.next.state)).toEqual({ a: 1, b: 1 });
    });
});

describe('admissibility and progress (spec §4.3)', () => {
    const net = mkNet([tr('t1', { p: 1 }, { a: 1 }), tr('t2', { p: 1 }, { b: 1 })]);

    it('null is admissible only without candidates; a selector only when it names one', () => {
        const some = candidates(net, cfg({ p: 1 }), NO_GUARDS);
        const none = candidates(net, cfg({ a: 1 }), NO_GUARDS);
        expect(admissible(some, null)).toBe(false);
        expect(admissible(none, null)).toBe(true);
        expect(admissible(some, 't2')).toBe(true);
        expect(admissible(some, 'zz')).toBe(false);
        expect(admissible(none, 't1')).toBe(false);
    });

    it('the step refuses an inadmissible selector and consumes nothing', () => {
        const c = cfg({ p: 1 }, null);
        expect(step(net, c, null, NO_GUARDS, NO_ACTIONS).kind).toBe('inadmissible');
        expect(step(net, cfg({ a: 1 }), 't1', NO_GUARDS, NO_ACTIONS).kind).toBe('inadmissible');
        // control: the same input with a candidate fires
        expect(step(net, c, 't1', NO_GUARDS, NO_ACTIONS).kind).toBe('fired');
    });

    it('interleaving (R-SIM-7): two candidates, one firing per step, the selector decides', () => {
        expect(ids(net, cfg({ p: 1 }))).toEqual(['t1', 't2']);
        const a = step(net, cfg({ p: 1 }), 't1', NO_GUARDS, NO_ACTIONS);
        const b = step(net, cfg({ p: 1 }), 't2', NO_GUARDS, NO_ACTIONS);
        expect(a.kind === 'fired' && m(a.next.state)).toEqual({ a: 1 });
        expect(b.kind === 'fired' && m(b.next.state)).toEqual({ b: 1 });
    });
});

describe('«unsafe» (R-SIM-23): checked on M against k, nothing applied, no saturation', () => {
    it('k = 1: a second token on b is flagged on the candidate and halts the run', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 })], { bound: 1 });
        const input = cfg({ a: 1, b: 1 }, 'ev');
        expect(candidates(net, { ...input, event: null }, NO_GUARDS).candidates).toEqual([{ transition: 't', unsafe: { place: 'b', value: 2 } }]);
        const out = step(net, { ...input, event: null }, 't', NO_GUARDS, NO_ACTIONS);
        expect(out.kind).toBe('halted');
        if (out.kind !== 'halted') return;
        expect(out.reason).toEqual({ kind: 'unsafe', place: 'b', value: 2, bound: 1 });
        expect(out.next.state).toBe(input.state);
        expect(out.next.event).toBeNull();
    });

    it('M(p) equal to k fires (k = 2)', () => {
        const net = mkNet([tr('t', { a: 1 }, { b: 1 })], { bound: 2 });
        expect(candidates(net, cfg({ a: 1, b: 1 }), NO_GUARDS).candidates).toEqual([{ transition: 't', unsafe: null }]);
        const out = step(net, cfg({ a: 1, b: 1 }), 't', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && m(out.next.state)).toEqual({ b: 2 });
    });

    it('a self-loop at k = 1 is safe: the check is on M after consuming', () => {
        const net = mkNet([tr('loop', { a: 1 }, { a: 1 })], { bound: 1 });
        const out = step(net, cfg({ a: 1 }), 'loop', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'fired' && m(out.next.state)).toEqual({ a: 1 });
    });
});

describe('actions: one parallel assignment read on σ (spec §4.4, R-SIM-17)', () => {
    const decls = { M: [range('x', 9), range('y', 9)] };

    it('a swap across two sites swaps: every right-hand side reads the state before the step', () => {
        const net = mkNet([tr('t', { p: 1 }, { q: 1 })], { declared: decls });
        const actions = actionsBy({
            'exit:p': s => [{ element: 'M', attr: 'x', value: s.read('M', 'y') as number }],
            'transition:t': s => [{ element: 'M', attr: 'y', value: s.read('M', 'x') as number }],
        });
        const out = step(net, cfg({ p: 1 }, null, { M: { x: 1, y: 2 } }), 't', NO_GUARDS, actions);
        expect(out.kind).toBe('fired');
        if (out.kind !== 'fired') return;
        expect([out.next.state.attrs.get('M')?.get('x'), out.next.state.attrs.get('M')?.get('y')]).toEqual([2, 1]);
        expect(out.label.assignments).toEqual([{ element: 'M', attr: 'x', value: 2 }, { element: 'M', attr: 'y', value: 1 }]);
    });

    it('two writes to one target in a step halt the run (double assignment)', () => {
        const net = mkNet([tr('t', { p: 1 }, { q: 1 })], { declared: decls });
        const actions = actionsBy({
            'exit:p': () => [{ element: 'M', attr: 'x', value: 1 }],
            'entry:q': () => [{ element: 'M', attr: 'x', value: 2 }],
        });
        const c = cfg({ p: 1 }, null, { M: { x: 0, y: 0 } });
        const out = step(net, c, 't', NO_GUARDS, actions);
        expect(out.kind === 'halted' && out.reason).toEqual({ kind: 'double-assignment', element: 'M', attr: 'x' });
        expect(out.kind === 'halted' && out.next.state).toBe(c.state);
        // control: one write goes through
        const one = step(net, c, 't', NO_GUARDS, actionsBy({ 'exit:p': () => [{ element: 'M', attr: 'x', value: 1 }] }));
        expect(one.kind).toBe('fired');
    });

    it('a value outside its domain halts; inside, it lands; presentation is not checked', () => {
        const ok = { name: 'ok', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, initial: false } as StateAttributeDecl;
        const col = { name: 'col', metaclass: null, space: 'semantic', domain: { kind: 'enum', literals: ['red', 'green'] }, initial: 'red' } as StateAttributeDecl;
        const glow = { name: 'glow', metaclass: null, space: 'presentation', domain: null, initial: 0 } as StateAttributeDecl;
        const net = mkNet([tr('t', { p: 1 }, { q: 1 })], { declared: { M: [range('x', 3), ok, col, glow] } });
        const run = (a: SimAssignment) => step(net, cfg({ p: 1 }), 't', NO_GUARDS, actionsBy({ 'transition:t': () => [a] }));
        expect(run({ element: 'M', attr: 'x', value: 4 }).kind).toBe('halted');
        expect(run({ element: 'M', attr: 'x', value: 1.5 }).kind).toBe('halted');
        expect(run({ element: 'M', attr: 'ok', value: 1 }).kind).toBe('halted');
        expect(run({ element: 'M', attr: 'col', value: 'blue' }).kind).toBe('halted');
        expect(run({ element: 'M', attr: 'x', value: 4 })).toMatchObject({ reason: { kind: 'domain', element: 'M', attr: 'x', value: 4 } });
        expect(run({ element: 'M', attr: 'x', value: 3 }).kind).toBe('fired');
        expect(run({ element: 'M', attr: 'col', value: 'green' }).kind).toBe('fired');
        const lit = run({ element: 'M', attr: 'glow', value: 99 });
        expect(lit.kind === 'fired' && lit.next.state.presentation.get('M')?.get('glow')).toBe(99);
    });

    it('an undeclared target and an action defect halt as action defects', () => {
        const net = mkNet([tr('t', { p: 1 }, { q: 1 })], { declared: decls });
        const undeclared = step(net, cfg({ p: 1 }), 't', NO_GUARDS, actionsBy({ 'transition:t': () => [{ element: 'M', attr: 'zz', value: 1 }] }));
        expect(undeclared.kind === 'halted' && undeclared.reason.kind).toBe('action-defect');
        const broken = step(net, cfg({ p: 1 }), 't', NO_GUARDS, actionsBy({ 'entry:q': () => 'boom' }));
        expect(broken.kind === 'halted' && broken.reason).toEqual({ kind: 'action-defect', site: { element: 'q', role: 'entry' }, detail: 'boom' });
    });
});

describe('else (R-SIM-25, R-SIM-31): the complement of its siblings\' guards', () => {
    const net = mkNet([
        tr('g1', { d: 1 }, { a: 1 }, { guardSites: ['g1'] }),
        tr('g2', { d: 1 }, { b: 1 }, { guardSites: ['g2'] }),
        tr('el', { d: 1 }, { e: 1 }, { elseOf: ['g1', 'g2'] }),
    ]);

    it('a sibling true: else false; every sibling false: else true', () => {
        expect(ids(net, cfg({ d: 1 }), guardsBy({ g1: 'false', g2: 'true' }))).toEqual(['g2']);
        expect(ids(net, cfg({ d: 1 }), guardsBy({ g1: 'false', g2: 'false' }))).toEqual(['el']);
        expect(candidates(net, cfg({ d: 1 }), guardsBy({ g1: 'false', g2: 'false' })).evaluated).toContainEqual(
            { transition: 'el', outcome: { kind: 'else', outcome: { kind: 'true' } } });
    });

    it('a defective sibling makes the else defective: no candidate at all', () => {
        const cs = candidates(net, cfg({ d: 1 }), guardsBy({ g1: 'defect', g2: 'false' }));
        expect(cs.candidates).toEqual([]);
        expect(cs.evaluated.find(e => e.transition === 'el')?.outcome).toMatchObject({ kind: 'else', outcome: { kind: 'defect' } });
    });
});

describe('inhibitors (R-SIM-24, R-SIM-30): tokens(p) < w, as a guard', () => {
    const net = mkNet([tr('t', { p: 1 }, { q: 1 }, { inhibitors: [{ place: 'h', weight: 2 }] })], { bound: 2 });

    it('h below the weight does not block; at the weight it does, and the label says why', () => {
        expect(ids(net, cfg({ p: 1, h: 1 }))).toEqual(['t']);
        const cs = candidates(net, cfg({ p: 1, h: 2 }), NO_GUARDS);
        expect(cs.candidates).toEqual([]);
        expect(cs.evaluated).toEqual([{ transition: 't', outcome: { kind: 'inhibited', place: 'h' } }]);
    });
});

describe('guards (spec §5.2, R-SIM-17) and the label (spec §4.5)', () => {
    it('a defective guard is never true: no candidate, the defect is in the label', () => {
        const net = mkNet([tr('t', { p: 1 }, { q: 1 }, { guardSites: ['t'] })]);
        const cs = candidates(net, cfg({ p: 1 }), guardsBy({ t: 'defect' }));
        expect(cs.candidates).toEqual([]);
        expect(cs.evaluated[0].outcome.kind).toBe('defect');
        expect(ids(net, cfg({ p: 1 }), guardsBy({ t: 'true' }))).toEqual(['t']);
    });

    it('the guard of a fused transition is the conjunction of its sites', () => {
        const net = mkNet([tr('F', { p: 1 }, { a: 1, b: 1 }, { guardSites: ['e0', 'e1'] })]);
        expect(ids(net, cfg({ p: 1 }), guardsBy({ e0: 'true', e1: 'false' }))).toEqual([]);
        expect(ids(net, cfg({ p: 1 }), guardsBy({ e0: 'true', e1: 'true' }))).toEqual(['F']);
    });

    it('the label holds every guard evaluated, the chosen one and the others', () => {
        const net = mkNet([tr('t1', { p: 1 }, { a: 1 }, { guardSites: ['t1'] }), tr('t2', { p: 1 }, { b: 1 }, { guardSites: ['t2'] })]);
        const out = step(net, cfg({ p: 1 }), 't1', NO_GUARDS, NO_ACTIONS);
        expect(out.label.candidates).toEqual(['t1', 't2']);
        expect(out.label.evaluated.map(e => e.transition)).toEqual(['t1', 't2']);
        expect(out.kind === 'fired' && [out.label.consumed, out.label.produced]).toEqual([[{ place: 'p', weight: 1 }], [{ place: 'a', weight: 1 }]]);
    });

    it('the real step 2 evaluator as the oracle: true, false and a throwing guard', () => {
        const shell = (name: string): any => ({ __type: 'Class', className: 'DClass', name, superTypes: [], subTypes: [], instances: [], allInstances: [], instanceCount: 0 });
        const T = shell('Transition');
        const t1: any = { id: 'o_t1', __type: 'Object', name: 'T1', instanceOf: T, instanceof: T, count: 2, requires: null, parent: null };
        const t2: any = { id: 'o_t2', __type: 'Object', name: 'T2', instanceOf: T, instanceof: T, count: 5, requires: null, parent: null };
        T.instances = [t1, t2];
        const snap = freezeSnapshot({ classes: [T], instances: [t1, t2], Transition: T }, { id: 'M', name: 'm' });
        const texts: Record<string, string> = { o_t1: 'self.count > 3', o_t2: 'self.count > 3' };
        const real: GuardOracle = (site, event) => evaluateGuard(compileGuard(texts[site]), buildGuardContext(snap, { transitionId: site }, { event }));
        const net = mkNet([tr('o_t1', { p: 1 }, { a: 1 }, { guardSites: ['o_t1'] }), tr('o_t2', { p: 1 }, { b: 1 }, { guardSites: ['o_t2'] })]);
        expect(ids(net, cfg({ p: 1 }), real)).toEqual(['o_t2']);
        texts.o_t2 = 'self.requires.locked';
        const cs = candidates(net, cfg({ p: 1 }), real);
        expect(cs.candidates).toEqual([]);
        expect(cs.evaluated[1].outcome).toMatchObject({ kind: 'defect', reason: 'exception' });
    });
});

describe('inputs (R-SIM-16): ε, events by identity, and the event consumed', () => {
    const net = mkNet([tr('te', { p: 1 }, { a: 1 }), tr('tc', { p: 1 }, { b: 1 }, { triggers: ['coin'] })]);

    it('ε accepts the untriggered, an event the transitions it triggers', () => {
        expect(ids(net, cfg({ p: 1 }))).toEqual(['te']);
        expect(ids(net, cfg({ p: 1 }, 'coin'))).toEqual(['tc']);
        expect(ids(net, cfg({ p: 1 }, 'push'))).toEqual([]);
    });

    it('quiescence returns the input itself; a discard consumes the event', () => {
        const quiet = cfg({ q: 1 });
        const q = step(net, quiet, null, NO_GUARDS, NO_ACTIONS);
        expect(q.kind).toBe('quiescence');
        expect(q.kind === 'quiescence' && q.next).toBe(quiet);
        const d = step(net, cfg({ p: 1 }, 'push'), null, NO_GUARDS, NO_ACTIONS);
        expect(d.kind).toBe('discard');
        expect(d.kind === 'discard' && d.next.event).toBeNull();
        const f = step(net, cfg({ p: 1 }, 'coin'), 'tc', NO_GUARDS, NO_ACTIONS);
        expect(f.kind === 'fired' && f.next.event).toBeNull();
    });
});

describe('termination (R-SIM-27) and status (R-SIM-29)', () => {
    const net = mkNet([tr('t', { a: 1 }, { f: 1 }), tr('w', { l: 1 }, { l: 1 }, { triggers: ['coin'] })], { final: ['f'] });

    it('terminated: non-empty, every marked place final; then no candidates', () => {
        expect(terminated(net, st({ f: 1 }))).toBe(true);
        expect(terminated(net, st({ f: 1, a: 1 }))).toBe(false);
        expect(terminated(net, st({}))).toBe(false);
        expect(candidates(net, cfg({ f: 1 }), NO_GUARDS)).toMatchObject({ terminated: true, candidates: [] });
        expect(terminated(mkNet([tr('t', { a: 1 }, { f: 1 })]), st({ f: 1 }))).toBe(false);
    });

    it('five statuses', () => {
        expect(netRunStatus(net, null, ['coin'], NO_GUARDS, null)).toBe('Not started');
        expect(netRunStatus(net, cfg({ a: 1 }), ['coin'], NO_GUARDS, { kind: 'unsafe', place: 'f', value: 2, bound: 1 })).toBe('Halted');
        expect(netRunStatus(net, cfg({ f: 1 }), ['coin'], NO_GUARDS, null)).toBe('Terminated');
        expect(netRunStatus(net, cfg({ a: 1, s: 1 }), ['coin'], NO_GUARDS, null)).toBe('Running');
        expect(netRunStatus(net, cfg({ l: 1 }), ['coin'], NO_GUARDS, null)).toBe('Running');
        expect(netRunStatus(net, cfg({ s: 1 }), ['coin'], NO_GUARDS, null)).toBe('Deadlock');
        expect(netRunStatus(net, cfg({}), ['coin'], NO_GUARDS, null)).toBe('Deadlock');
    });

    it('a run blocked by false guards is Deadlock, while its button stays structurally enabled', () => {
        const g = mkNet([tr('t', { a: 1 }, { b: 1 }, { guardSites: ['t'] })]);
        expect(netRunStatus(g, cfg({ a: 1 }), [], guardsBy({ t: 'false' }), null)).toBe('Deadlock');
        expect(structuralInputs(g, st({ a: 1 })).epsilon).toBe(true);
    });

    it('structuralInputs: preset and trigger only; empty when terminated', () => {
        const blocked = mkNet([tr('t', { p: 1 }, { q: 1 }, { triggers: ['coin'], inhibitors: [{ place: 'p', weight: 1 }], guardSites: ['t'] })]);
        expect([...structuralInputs(blocked, st({ p: 1 })).events]).toEqual(['coin']);
        expect(structuralInputs(net, st({ f: 1 }))).toEqual({ epsilon: false, events: new Set() });
        expect(structuralInputs(net, st({ a: 1, l: 1 }))).toEqual({ epsilon: true, events: new Set(['coin']) });
    });
});

describe('σ access and the derived boolean view (R-SIM-11, R-SIM-30)', () => {
    it('tokens and isMarked: 0 when absent, marked for any value other than 0', () => {
        const s = st({ a: 2, b: 1 });
        expect([tokens(s, 'a'), tokens(s, 'b'), tokens(s, 'c')]).toEqual([2, 1, 0]);
        expect([isMarked(s, 'a'), isMarked(s, 'b'), isMarked(s, 'c')]).toEqual([true, true, false]);
    });

    it('the accessor reads attributes, the marking, and only its own site\'s presentation', () => {
        const s: SimState = { ...st({ a: 2 }, { M: { x: 3 } }), presentation: new Map([['n', new Map<string, SimValue>([['glow', true]])]]) };
        const at = stateAccess(s, 'n');
        expect([at.read('M', 'x'), at.read('M', 'zz'), at.tokens('a'), at.isMarked('a'), at.isMarked('z')]).toEqual([3, undefined, 2, true, false]);
        expect(at.readPresentation('glow')).toBe(true);
        expect(stateAccess(s, 'other').readPresentation('glow')).toBeUndefined();
        expect(stateAccess(s).readPresentation('glow')).toBeUndefined();
    });
});

// ── the worked examples of report §5.4 ──────────────────────────────────────

const CLASSES = { C_Node: [], C_Init: ['C_Node'], C_End: ['C_Node'], C_Tr: [], C_Ev: [], C_Fork: ['C_Node'], C_Join: ['C_Node'] };

describe('Ex1: flowchart with a decision block and an explicit else', () => {
    // S -e1-> Inc -e2 / x := x + 1 -> D ; D -e3 [x < 2]-> Inc ; D -e4 [else]-> E
    const stc = netStcFromRoles({ simInitial: 'C_Init', simTerminal: 'C_End', simOwnedTransitions: 'R_out', simNextState: 'R_next', simGuard: 'A_g' })!;
    const net = compileSpec(stc, {
        classes: CLASSES,
        objects: {
            S: { cls: 'C_Init', slots: { R_out: ['e1'] } }, Inc: { cls: 'C_Node', slots: { R_out: ['e2'] } },
            D: { cls: 'C_Node', slots: { R_out: ['e3', 'e4'] } }, E: { cls: 'C_End' },
            e1: { cls: 'C_Tr', slots: { R_next: ['Inc'] } }, e2: { cls: 'C_Tr', slots: { R_next: ['D'] } },
            e3: { cls: 'C_Tr', slots: { R_next: ['Inc'], A_g: ['model.[x] < 2'] } }, e4: { cls: 'C_Tr', slots: { R_next: ['E'], A_g: ['else'] } },
        },
    }, [range('x', 3)]);
    const guards: GuardOracle = (site, _e, s) => (site === 'e3' ? { kind: (s.read('M', 'x') as number) < 2 ? 'true' : 'false' } : { kind: 'true' });
    const actions = actionsBy({ 'transition:e2': s => [{ element: 'M', attr: 'x', value: (s.read('M', 'x') as number) + 1 }] });

    it('the whole run, with the candidate sets at D computed in the report', () => {
        let c: NetConfiguration = { state: net.initial, event: null };
        const fire = (sel: string) => {
            const out = step(net, c, sel, guards, actions);
            expect(out.kind).toBe('fired');
            if (out.kind === 'fired') c = out.next;
        };
        expect(m(c.state)).toEqual({ S: 1 });
        fire('e1'); fire('e2');
        expect([m(c.state), c.state.attrs.get('M')?.get('x')]).toEqual([{ D: 1 }, 1]);
        const at1 = candidates(net, c, guards);
        expect(at1.candidates.map(x => x.transition)).toEqual(['e3']);
        expect(at1.evaluated).toEqual([
            { transition: 'e3', outcome: { kind: 'true' } },
            { transition: 'e4', outcome: { kind: 'else', outcome: { kind: 'false' } } },
        ]);
        fire('e3'); fire('e2');
        expect([m(c.state), c.state.attrs.get('M')?.get('x')]).toEqual([{ D: 1 }, 2]);
        expect(ids(net, c, guards)).toEqual(['e4']);
        fire('e4');
        expect(m(c.state)).toEqual({ E: 1 });
        expect(netRunStatus(net, c, [], guards, null)).toBe('Terminated');
        expect(candidates(net, c, guards).candidates).toEqual([]);
    });
});

describe('Ex2: statechart with an event trigger (the turnstile)', () => {
    const stc = netStcFromRoles({
        simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simEvent: 'C_Ev', simTrigger: 'R_trig',
    })!;
    const net = compileSpec(stc, {
        classes: CLASSES,
        objects: {
            Locked: { cls: 'C_Init', slots: { R_out: ['tCoin', 'tPushL'] } }, Unlocked: { cls: 'C_Node', slots: { R_out: ['tPushU'] } },
            coin: { cls: 'C_Ev' }, push: { cls: 'C_Ev' },
            tCoin: { cls: 'C_Tr', slots: { R_next: ['Unlocked'], R_trig: ['coin'] } },
            tPushU: { cls: 'C_Tr', slots: { R_next: ['Locked'], R_trig: ['push'] } },
            tPushL: { cls: 'C_Tr', slots: { R_next: ['Locked'], R_trig: ['push'] } },
        },
    }, [range('coins', 9), range('last', 9)]);
    const actions = actionsBy({
        'transition:tCoin': s => [{ element: 'M', attr: 'coins', value: (s.read('M', 'coins') as number) + 1 }],
        'entry:Unlocked': s => [{ element: 'M', attr: 'last', value: s.read('M', 'coins') as number }],
    });
    const locked: NetConfiguration = { state: net.initial, event: null };

    it('candidate sets at Locked and at Unlocked', () => {
        expect(m(net.initial)).toEqual({ Locked: 1 });
        expect(ids(net, locked)).toEqual([]);
        expect(ids(net, { ...locked, event: 'coin' })).toEqual(['tCoin']);
        expect(ids(net, { ...locked, event: 'push' })).toEqual(['tPushL']);
        const unlocked: NetConfiguration = { state: st({ Unlocked: 1 }), event: 'coin' };
        expect(step(net, unlocked, null, NO_GUARDS, NO_ACTIONS).kind).toBe('discard');
        expect(step(net, unlocked, 'tCoin', NO_GUARDS, NO_ACTIONS).kind).toBe('inadmissible');
        expect(netRunStatus(net, locked, ['coin', 'push'], NO_GUARDS, null)).toBe('Running');
    });

    it('the step on coin: last reads coins on σ, so it stays 0 while coins becomes 1', () => {
        const out = step(net, { ...locked, event: 'coin' }, 'tCoin', NO_GUARDS, actions);
        expect(out.kind).toBe('fired');
        if (out.kind !== 'fired') return;
        expect(m(out.next.state)).toEqual({ Unlocked: 1 });
        expect([out.next.state.attrs.get('M')?.get('coins'), out.next.state.attrs.get('M')?.get('last')]).toEqual([1, 0]);
        expect(out.next.event).toBeNull();
    });

    it('the self-loop tPushL keeps its token; exit and entry writing one attribute halt it (accepted consequence)', () => {
        const loop = step(net, { ...locked, event: 'push' }, 'tPushL', NO_GUARDS, NO_ACTIONS);
        expect(loop.kind === 'fired' && m(loop.next.state)).toEqual({ Locked: 1 });
        const both = actionsBy({
            'exit:Locked': () => [{ element: 'M', attr: 'last', value: 1 }],
            'entry:Locked': () => [{ element: 'M', attr: 'last', value: 2 }],
        });
        const out = step(net, { ...locked, event: 'push' }, 'tPushL', NO_GUARDS, both);
        expect(out.kind === 'halted' && out.reason.kind).toBe('double-assignment');
    });
});

describe('Ex3: parallel fork, AND-join and inhibitor', () => {
    const petri = (bound: number) => compileSpec(
        netStcFromRoles({
            simNode: 'C_P', simTransition: 'C_T', simArc: 'C_A', simArcSource: 'R_s', simArcTarget: 'R_t', simArcWeight: 'A_w',
            simInhibitorArc: 'C_I', simInitialMarking: 'A_m', simBound: bound,
        })!,
        {
            classes: { C_P: [], C_T: [], C_A: [], C_I: [] },
            objects: {
                p0: { cls: 'C_P', slots: { A_m: [1] } }, a1: { cls: 'C_P' }, b1: { cls: 'C_P' }, a2: { cls: 'C_P' }, b2: { cls: 'C_P' }, done: { cls: 'C_P' },
                tf: { cls: 'C_T' }, ta: { cls: 'C_T' }, tb: { cls: 'C_T' }, tj: { cls: 'C_T' },
                x1: { cls: 'C_A', slots: { R_s: ['p0'], R_t: ['tf'] } }, x2: { cls: 'C_A', slots: { R_s: ['tf'], R_t: ['a1'] } },
                x3: { cls: 'C_A', slots: { R_s: ['tf'], R_t: ['b1'] } }, x4: { cls: 'C_A', slots: { R_s: ['a1'], R_t: ['ta'] } },
                x5: { cls: 'C_A', slots: { R_s: ['ta'], R_t: ['a2'] } }, x6: { cls: 'C_A', slots: { R_s: ['b1'], R_t: ['tb'] } },
                x7: { cls: 'C_A', slots: { R_s: ['tb'], R_t: ['b2'], A_w: [2] } }, x8: { cls: 'C_I', slots: { R_s: ['a1'], R_t: ['tb'] } },
                x9: { cls: 'C_A', slots: { R_s: ['a2'], R_t: ['tj'] } }, x10: { cls: 'C_A', slots: { R_s: ['b2'], R_t: ['tj'], A_w: [2] } },
                x11: { cls: 'C_A', slots: { R_s: ['tj'], R_t: ['done'] } },
            },
        },
    );

    it('k = 2: M0 {tf}; M1 tb inhibited by a1, {ta}; M2 {tb}; M3 {tj}; M4 dead: Deadlock', () => {
        const net = petri(2);
        let c: NetConfiguration = { state: net.initial, event: null };
        const fire = (sel: string) => {
            const out = step(net, c, sel, NO_GUARDS, NO_ACTIONS);
            expect(out.kind).toBe('fired');
            if (out.kind === 'fired') c = out.next;
        };
        expect(ids(net, c)).toEqual(['tf']);
        fire('tf');
        expect(m(c.state)).toEqual({ a1: 1, b1: 1 });
        const m1 = candidates(net, c, NO_GUARDS);
        expect(m1.candidates.map(x => x.transition)).toEqual(['ta']);
        expect(m1.evaluated).toEqual([{ transition: 'tb', outcome: { kind: 'inhibited', place: 'a1' } }]);
        fire('ta');
        expect(m(c.state)).toEqual({ a2: 1, b1: 1 });
        expect(ids(net, c)).toEqual(['tb']);
        fire('tb');
        expect(m(c.state)).toEqual({ a2: 1, b2: 2 });
        expect(ids(net, c)).toEqual(['tj']);
        fire('tj');
        expect(m(c.state)).toEqual({ done: 1 });
        expect(netRunStatus(net, c, [], NO_GUARDS, null)).toBe('Deadlock');
    });

    it('k = 1: at M2, tb is a candidate flagged unsafe; firing it halts with M2 unchanged', () => {
        const net = petri(1);
        const m2: NetConfiguration = { state: st({ a2: 1, b1: 1 }), event: null };
        expect(candidates(net, m2, NO_GUARDS).candidates).toEqual([{ transition: 'tb', unsafe: { place: 'b2', value: 2 } }]);
        const out = step(net, m2, 'tb', NO_GUARDS, NO_ACTIONS);
        expect(out.kind === 'halted' && out.reason).toEqual({ kind: 'unsafe', place: 'b2', value: 2, bound: 1 });
        expect(out.kind === 'halted' && out.next.state).toBe(m2.state);
    });

    it('the flowchart form with fork and join nodes runs the same fork and join', () => {
        const stc = netStcFromRoles({ simInitial: 'C_Init', simTerminal: 'C_End', simOwnedTransitions: 'R_out', simNextState: 'R_next', simFork: 'C_Fork', simJoin: 'C_Join' })!;
        const net = compileSpec(stc, {
            classes: CLASSES,
            objects: {
                p0: { cls: 'C_Init', slots: { R_out: ['e0'] } }, F: { cls: 'C_Fork', slots: { R_out: ['e1', 'e2'] } },
                a1: { cls: 'C_Node', slots: { R_out: ['ea'] } }, b1: { cls: 'C_Node', slots: { R_out: ['eb'] } },
                a2: { cls: 'C_Node', slots: { R_out: ['e3'] } }, b2: { cls: 'C_Node', slots: { R_out: ['e4'] } },
                J: { cls: 'C_Join', slots: { R_out: ['e5'] } }, done: { cls: 'C_End' },
                e0: { cls: 'C_Tr', slots: { R_next: ['F'] } }, e1: { cls: 'C_Tr', slots: { R_next: ['a1'] } }, e2: { cls: 'C_Tr', slots: { R_next: ['b1'] } },
                ea: { cls: 'C_Tr', slots: { R_next: ['a2'] } }, eb: { cls: 'C_Tr', slots: { R_next: ['b2'] } },
                e3: { cls: 'C_Tr', slots: { R_next: ['J'] } }, e4: { cls: 'C_Tr', slots: { R_next: ['J'] } }, e5: { cls: 'C_Tr', slots: { R_next: ['done'] } },
            },
        });
        let c: NetConfiguration = { state: net.initial, event: null };
        const trace: string[] = [];
        for (const sel of ['F', 'ea', 'eb', 'J']) {
            const out = step(net, c, sel, NO_GUARDS, NO_ACTIONS);
            expect(out.kind).toBe('fired');
            if (out.kind === 'fired') c = out.next;
            trace.push(Object.keys(m(c.state)).join(','));
        }
        expect(trace).toEqual(['a1,b1', 'a2,b1', 'a2,b2', 'done']);
        expect(netRunStatus(net, c, [], NO_GUARDS, null)).toBe('Terminated');
        // before the join both branches must be done: with only a2 marked, J is no candidate
        expect(ids(net, { state: st({ a2: 1, b1: 1 }), event: null })).toEqual(['eb']);
    });
});

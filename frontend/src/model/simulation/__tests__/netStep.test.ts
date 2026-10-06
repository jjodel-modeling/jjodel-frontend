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
import {
    admissible, candidates, isAccepting, isMarked, netRunStatus, presentationOf, stateAccess, stateOutputOf, step, structuralInputs, terminated, tokens,
    transitionOutputOf,
} from '../netStep';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import { buildGuardContext, freezeSnapshot } from '../guardContext';
import { compileGuard, evaluateGuard } from '../guardEvaluator';
import type { GuardOutcome } from '../guardEvaluator';
import type {
    ActionOracle, ActionSite, CompiledNet, DerivedFailure, DerivedOracle, GuardOracle, NetConfiguration, NetModelView, NetStc, NetTransition,
    SimAssignment, SimState, SimStateAccess, SimValue, StateAttributeDecl,
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
    /** The activity final places (R-SIM-53); absent from the net when not given. */
    activityFinal?: string[];
    /** The accepting places (R-SIM-50) and the role-bound outputs (R-SIM-51); absent from the net when not given. */
    accepting?: string[];
    stateOutputs?: Record<string, SimValue[]>;
    transitionOutputs?: Record<string, SimValue[]>;
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
        ...(o.activityFinal ? { activityFinal: new Set(o.activityFinal) } : {}),
        ...(o.accepting ? { accepting: new Set(o.accepting) } : {}),
        ...(o.stateOutputs ? { stateOutputs: new Map(Object.entries(o.stateOutputs)) } : {}),
        ...(o.transitionOutputs ? { transitionOutputs: new Map(Object.entries(o.transitionOutputs)) } : {}),
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

    it('an undeclared target halts with its own kind, naming the element and the attribute (R-SIM-70); an action defect halts as one', () => {
        const net = mkNet([tr('t', { p: 1 }, { q: 1 })], { declared: decls });
        const c = cfg({ p: 1 });
        const undeclared = step(net, c, 't', NO_GUARDS, actionsBy({ 'transition:t': () => [{ element: 'M', attr: 'zz', value: 1 }] }));
        expect(undeclared.kind === 'halted' && undeclared.reason).toEqual({ kind: 'undeclared', site: { element: 't', role: 'transition' }, element: 'M', attr: 'zz' });
        expect(undeclared.kind === 'halted' && undeclared.next.state).toBe(c.state);
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

    it('G7: a fused else keeps its other edges\' guards, conjoined after the complement; the entry is their outcome when they fail (mutants: no conjunction; the entry always else; guardSites [] restored)', () => {
        // d -f3 [f3]-> w ; d -f4 [else]-> fk ; fk -f5 [f5]-> l, -f6-> r
        const stc = netStcFromRoles({ simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simFork: 'C_Fork', simGuard: 'A_g' })!;
        const net = compileSpec(stc, {
            classes: CLASSES,
            objects: {
                d: { cls: 'C_Init', slots: { R_out: ['f3', 'f4'] } }, w: { cls: 'C_Node' },
                fk: { cls: 'C_Fork', slots: { R_out: ['f5', 'f6'] } }, l: { cls: 'C_Node' }, r: { cls: 'C_Node' },
                f3: { cls: 'C_Tr', slots: { R_next: ['w'], A_g: ['x'] } }, f4: { cls: 'C_Tr', slots: { R_next: ['fk'], A_g: ['else'] } },
                f5: { cls: 'C_Tr', slots: { R_next: ['l'], A_g: ['y'] } }, f6: { cls: 'C_Tr', slots: { R_next: ['r'] } },
            },
        });
        const at = (g: Record<string, GuardOutcome['kind']>) => candidates(net, cfg({ d: 1 }), guardsBy(g));
        // the complement holds and f5 fails: no candidate, and the entry of fk is f5's outcome
        const blocked = at({ f3: 'false', f5: 'false' });
        expect(blocked.candidates).toEqual([]);
        expect(blocked.evaluated).toEqual([
            { transition: 'f3', outcome: { kind: 'false' } },
            { transition: 'fk', outcome: { kind: 'false' } },
        ]);
        // control: f5 true, fk is the candidate and its entry is the else
        const open = at({ f3: 'false', f5: 'true' });
        expect(open.candidates.map(c => c.transition)).toEqual(['fk']);
        expect(open.evaluated[1]).toEqual({ transition: 'fk', outcome: { kind: 'else', outcome: { kind: 'true' } } });
        // the sibling true: the else is false whatever f5 says, and the entry says so as an else
        expect(at({ f3: 'true', f5: 'false' }).evaluated[1]).toEqual({ transition: 'fk', outcome: { kind: 'else', outcome: { kind: 'false' } } });
        // a defective f5 after the complement is the fork's defect
        expect(at({ f3: 'false', f5: 'defect' }).evaluated[1]).toMatchObject({ transition: 'fk', outcome: { kind: 'defect' } });
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

    it('R-SIM-53: a marked activity final terminates with other tokens alive, F keeps its own rule (mutant: the check in terminated removed)', () => {
        const af = mkNet([tr('t', { a: 1 }, { f: 1 }), tr('u', { n: 1 }, { x: 1 })], { final: ['f'], activityFinal: ['x'] });
        expect(terminated(af, st({ x: 1, n: 1 }))).toBe(true);
        expect(terminated(af, st({ n: 1 }))).toBe(false);
        expect(terminated(af, st({ f: 1, n: 1 }))).toBe(false);
        expect(terminated(af, st({ f: 1 }))).toBe(true);
        expect(terminated(af, st({}))).toBe(false);
        expect(candidates(af, cfg({ x: 1, n: 1 }), NO_GUARDS)).toMatchObject({ terminated: true, candidates: [] });
        expect(netRunStatus(af, cfg({ x: 1, n: 1 }), [], NO_GUARDS, null)).toBe('Terminated');
        // the activity final needs no F: the two roles are optional apart
        expect(terminated(mkNet([tr('u', { n: 1 }, { x: 1 })], { activityFinal: ['x'] }), st({ x: 1, n: 1 }))).toBe(true);
        // control: the same net and marking without the role
        expect(terminated(mkNet([tr('u', { n: 1 }, { x: 1 })]), st({ x: 1, n: 1 }))).toBe(false);
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

describe('R-SIM-53: Flow C of the readiness probes, the activity final ends the run', () => {
    // i0 -f1-> work -f2 / count := count + 1 -> d1 ; d1 -f3 [count < 2]-> work ; d1 -f4 [count >= 2]-> fk
    // fk -f5-> left, -f6-> right ; left -f7-> jn ; right -f8-> jn ; jn -f9-> fin, an ActivityFinal
    const classes = { ...CLASSES, C_AF: ['C_Node'] };
    const bag = { simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simFork: 'C_Fork', simJoin: 'C_Join', simGuard: 'A_g' };
    const edge = (next: string) => ({ cls: 'C_Tr', slots: { R_next: [next] } });
    const objects = {
        i0: { cls: 'C_Init', slots: { R_out: ['f1'] } }, work: { cls: 'C_Node', slots: { R_out: ['f2'] } },
        d1: { cls: 'C_Node', slots: { R_out: ['f3', 'f4'] } }, fk: { cls: 'C_Fork', slots: { R_out: ['f5', 'f6'] } },
        left: { cls: 'C_Node', slots: { R_out: ['f7'] } }, right: { cls: 'C_Node', slots: { R_out: ['f8'] } },
        jn: { cls: 'C_Join', slots: { R_out: ['f9'] } }, fin: { cls: 'C_AF' },
        f1: edge('work'), f2: edge('d1'), f3: edge('work'), f4: edge('fk'), f5: edge('left'), f6: edge('right'),
        f7: edge('jn'), f8: edge('jn'), f9: edge('fin'),
    };
    const guards: GuardOracle = (site, _e, s) => {
        const count = s.read('M', 'count') as number;
        if (site === 'f3') return { kind: count < 2 ? 'true' : 'false' };
        if (site === 'f4') return { kind: count >= 2 ? 'true' : 'false' };
        return { kind: 'true' };
    };
    const actions = actionsBy({ 'transition:f2': s => [{ element: 'M', attr: 'count', value: (s.read('M', 'count') as number) + 1 }] });
    /** Six steps, each on the only candidate, as the probe presses Step. */
    const run = (roles: Record<string, string>) => {
        const net = compileSpec(netStcFromRoles(roles)!, { classes, objects }, [range('count', 3)]);
        let c: NetConfiguration = { state: net.initial, event: null };
        const fired: string[] = [];
        for (let k = 0; k < 6; k++) {
            const next = candidates(net, c, guards).candidates.map(x => x.transition);
            if (next.length !== 1) break;
            const out = step(net, c, next[0], guards, actions);
            if (out.kind !== 'fired') break;
            fired.push(next[0]);
            c = out.next;
        }
        return { fired, marking: m(c.state), status: netRunStatus(net, c, [], guards, null) };
    };

    it('six steps end Terminated with simActivityFinal; control: without the role, Deadlock on the same marking (mutants: the ROLE_KEYS pair dropped, activityFinal null, the check in terminated removed)', () => {
        const trace = ['f1', 'f2', 'f3', 'f2', 'fk', 'jn'];
        expect(run({ ...bag, simActivityFinal: 'C_AF' })).toEqual({ fired: trace, marking: { fin: 1 }, status: 'Terminated' });
        expect(run(bag)).toEqual({ fired: trace, marking: { fin: 1 }, status: 'Deadlock' });
    });
});

describe('lane C2: derived attributes in the step (P-2026-09-27-0200, R-SIM-73)', () => {
    const TOTAL: StateAttributeDecl = { name: 'total', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 2 }, equation: 'model.[n]' };
    const net = mkNet([tr('t', { a: 1 }, { b: 1 })], { declared: { M: [range('n', 9), TOTAL] } });
    const bump = actionsBy({ 'transition:t': s => [{ element: 'M', attr: 'n', value: (s.read('M', 'n') as number) + 1 }] });
    const derivedMap = (values: Record<string, Record<string, SimValue>>) => new Map(Object.entries(values).map(([e, v]) => [e, new Map(Object.entries(v))]));
    /** total := n, read from the σ it is given; the failures given are added. */
    const echo = (failures: DerivedFailure[] = []): DerivedOracle => s => ({
        derived: { attrs: derivedMap({ M: { total: s.attrs.get('M')?.get('n') as number } }), presentation: new Map() },
        failures,
    });
    const at = (n: number, derived?: Record<string, Record<string, SimValue>>): NetConfiguration => ({
        state: { ...st({ a: 1 }, { M: { n } }), ...(derived ? { derived: { attrs: derivedMap(derived), presentation: new Map() } } : {}) },
        event: null,
    });
    const plain = (m: ReadonlyMap<string, ReadonlyMap<string, SimValue>> | undefined) =>
        Object.fromEntries([...(m ?? new Map())].map(([e, v]) => [e, Object.fromEntries(v)]));

    it('the oracle runs on σ′, after the parallel write: total follows the n the action wrote (mutant 1: the oracle on σ)', () => {
        const out = step(net, at(0, { M: { total: 0 } }), 't', NO_GUARDS, bump, echo());
        expect(out.kind).toBe('fired');
        if (out.kind !== 'fired') return;
        expect(out.next.state.attrs.get('M')?.get('n')).toBe(1);
        expect(plain(out.next.state.derived?.attrs)).toEqual({ M: { total: 1 } });
    });

    it('the derived part is never copied forward: only the oracle\'s fresh values on σ′, none without an oracle (mutant 2)', () => {
        const out = step(net, at(0, { M: { total: 0, stale: 5 } }), 't', NO_GUARDS, bump, echo());
        expect(out.kind === 'fired' && plain(out.next.state.derived?.attrs)).toEqual({ M: { total: 1 } });
        const bare = step(net, at(0, { M: { total: 0 } }), 't', NO_GUARDS, bump);
        expect(bare.kind === 'fired' && bare.next.state).not.toHaveProperty('derived');
    });

    it('a guard reads a derived value as it reads a stored one', () => {
        const guard: GuardOracle = (_site, _e, s) => ({ kind: s.read('M', 'total') === 1 ? 'true' : 'false' });
        const guarded = mkNet([tr('t', { a: 1 }, { b: 1 }, { guardSites: ['t'] })], { declared: { M: [range('n', 9), TOTAL] } });
        expect(ids(guarded, at(1, { M: { total: 1 } }), guard)).toEqual(['t']);
        expect(ids(guarded, at(1, { M: { total: 0 } }), guard)).toEqual([]);
    });

    it('an action on a derived target halts read-only before any write, σ unchanged (mutant 7)', () => {
        const c = at(0, { M: { total: 0 } });
        const out = step(net, c, 't', NO_GUARDS, actionsBy({ 'transition:t': () => [{ element: 'M', attr: 'total', value: 1 }] }), echo());
        expect(out.kind === 'halted' && out.reason).toEqual({ kind: 'read-only', site: { element: 't', role: 'transition' }, element: 'M', attr: 'total' });
        expect(out.kind === 'halted' && out.next.state).toBe(c.state);
    });

    it('a derived value outside its domain halts domain, σ unchanged; inside, it lands', () => {
        const c = at(2, { M: { total: 2 } });
        const out = step(net, c, 't', NO_GUARDS, bump, echo());
        expect(out.kind === 'halted' && out.reason).toEqual({ kind: 'domain', element: 'M', attr: 'total', value: 3 });
        expect(out.kind === 'halted' && out.next.state).toBe(c.state);
        expect(step(net, at(1, { M: { total: 1 } }), 't', NO_GUARDS, bump, echo()).kind).toBe('fired');
    });

    it('a semantic failure halts derived with the element, the attribute and the detail; a presentation failure does not halt', () => {
        const c = at(0, { M: { total: 0 } });
        const semantic = step(net, c, 't', NO_GUARDS, bump, echo([{ element: 'M', attr: 'q', space: 'semantic', detail: 'boom' }]));
        expect(semantic.kind === 'halted' && semantic.reason).toEqual({ kind: 'derived', element: 'M', attr: 'q', detail: 'boom' });
        expect(semantic.kind === 'halted' && semantic.next.state).toBe(c.state);
        const shade = step(net, c, 't', NO_GUARDS, bump, echo([{ element: 't', attr: 'shade', space: 'presentation', detail: 'boom' }]));
        expect(shade.kind).toBe('fired');
        expect(shade.kind === 'fired' && shade.next.state.derived?.presentation.get('t')).toBeUndefined();
    });

    it('the accessor: a stored value before a derived one of the same name (mutant 10); the presentation falls back to the site\'s derived part only', () => {
        const state: SimState = {
            ...st({}, { e: { x: 1 } }),
            derived: { attrs: derivedMap({ e: { x: 2, y: 3 } }), presentation: derivedMap({ e: { glow: true }, f: { glow: false } }) },
        };
        expect([stateAccess(state).read('e', 'x'), stateAccess(state).read('e', 'y')]).toEqual([1, 3]);
        expect(stateAccess(state, 'e').readPresentation('glow')).toBe(true);
        expect(stateAccess(state).readPresentation('glow')).toBeUndefined();
        // the presentation part is never a semantic read
        expect(stateAccess(state).read('e', 'glow')).toBeUndefined();
    });
});

describe('acceptance and role-bound outputs (lane S4, P-2026-09-27-1725, R-SIM-50, R-SIM-51)', () => {
    const transitions = [tr('t', { a: 1 }, { x: 1 }), tr('u', { x: 1 }, { a: 1 })];
    const net = mkNet(transitions, { accepting: ['x'], stateOutputs: { a: ['A'], x: ['X1', 'X2'] }, transitionOutputs: { t: ['go'] } });

    it('isAccepting: some marked place is accepting, a zero entry does not count, never without the role (mutants: every for some, the zero check dropped)', () => {
        expect(isAccepting(net, st({ x: 1 }))).toBe(true);
        expect(isAccepting(net, st({ x: 1, a: 1 }))).toBe(true);
        expect(isAccepting(net, st({ a: 1 }))).toBe(false);
        expect(isAccepting(net, st({ a: 1, x: 0 }))).toBe(false);
        expect(isAccepting(net, st({}))).toBe(false);
        // control: the same net and marking without the role
        expect(isAccepting(mkNet(transitions), st({ x: 1 }))).toBe(false);
    });

    it('accepting does not stop the run: a marked accepting place keeps its candidates and the status (mutant: the check fused into terminated)', () => {
        expect(terminated(net, st({ x: 1 }))).toBe(false);
        expect(ids(net, cfg({ x: 1 }))).toEqual(['u']);
        expect(netRunStatus(net, cfg({ x: 1 }), [], NO_GUARDS, null)).toBe('Running');
        // control: the same place in F terminates
        expect(netRunStatus(mkNet(transitions, { final: ['x'], accepting: ['x'] }), cfg({ x: 1 }), [], NO_GUARDS, null)).toBe('Terminated');
    });

    it('stateOutputOf: the outputs of the marked places in the net order, a place with no output left out (mutants: every place read, the marking order)', () => {
        expect(stateOutputOf(net, st({ x: 1 }))).toEqual([{ place: 'x', values: ['X1', 'X2'] }]);
        expect(stateOutputOf(net, st({ x: 1, a: 2 }))).toEqual([{ place: 'a', values: ['A'] }, { place: 'x', values: ['X1', 'X2'] }]);
        expect(stateOutputOf(net, st({ b: 1 }))).toEqual([]);
        expect(stateOutputOf(net, st({ x: 0 }))).toEqual([]);
        // control: without the role nothing is read
        expect(stateOutputOf(mkNet(transitions), st({ x: 1 }))).toEqual([]);
    });

    it('transitionOutputOf: the output of a firing by the transition id, [] without a value or the role', () => {
        expect(transitionOutputOf(net, 't')).toEqual(['go']);
        expect(transitionOutputOf(net, 'u')).toEqual([]);
        expect(transitionOutputOf(mkNet(transitions), 't')).toEqual([]);
    });

    it('a DFA-shaped machine compiled from its roles: the word a b a with acceptance and outputs per step; control: without the three keys the same firings and nothing else (mutants: a ROLE_KEYS pair dropped, a map not built)', () => {
        // s0 -a-> s1 -b-> s2 (accepting) -a-> s1
        const classes = { ...CLASSES, C_Acc: ['C_Node'] };
        const bag = { simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next', simTrigger: 'R_trg', simEvent: 'C_Ev' };
        const objects = {
            s0: { cls: 'C_Init', slots: { R_out: ['t01'], A_so: ['x0'] } },
            s1: { cls: 'C_Node', slots: { R_out: ['t12'], A_so: ['x1'] } },
            s2: { cls: 'C_Acc', slots: { R_out: ['t21'], A_so: ['x2'] } },
            a: { cls: 'C_Ev' }, b: { cls: 'C_Ev' },
            t01: { cls: 'C_Tr', slots: { R_next: ['s1'], R_trg: ['a'], A_to: ['o01'] } },
            t12: { cls: 'C_Tr', slots: { R_next: ['s2'], R_trg: ['b'], A_to: ['o12'] } },
            t21: { cls: 'C_Tr', slots: { R_next: ['s1'], R_trg: ['a'], A_to: ['o21'] } },
        };
        const run = (roles: Record<string, string>) => {
            const compiled = compileSpec(netStcFromRoles(roles)!, { classes, objects });
            let c: NetConfiguration = { state: compiled.initial, event: null };
            const trace: string[] = [];
            for (const e of ['a', 'b', 'a']) {
                const input: NetConfiguration = { state: c.state, event: e };
                const out = step(compiled, input, ids(compiled, input)[0] ?? null, NO_GUARDS, NO_ACTIONS);
                if (out.kind !== 'fired') { trace.push(out.kind); continue; }
                c = out.next;
                const sel = out.label.selector as string;
                const moore = stateOutputOf(compiled, c.state).map(o => o.values.join('+')).join(',');
                trace.push(`${sel} ${transitionOutputOf(compiled, sel).join('+')} | ${moore} ${isAccepting(compiled, c.state) ? 'accepting' : '-'}`);
            }
            return { initial: stateOutputOf(compiled, compiled.initial), trace, status: netRunStatus(compiled, c, ['a', 'b'], NO_GUARDS, null) };
        };
        expect(run({ ...bag, simAccepting: 'C_Acc', simStateOutput: 'A_so', simTransitionOutput: 'A_to' })).toEqual({
            initial: [{ place: 's0', values: ['x0'] }],
            trace: ['t01 o01 | x1 -', 't12 o12 | x2 accepting', 't21 o21 | x1 -'],
            status: 'Running',
        });
        expect(run(bag)).toEqual({ initial: [], trace: ['t01  |  -', 't12  |  -', 't21  |  -'], status: 'Running' });
    });
});

describe('R-SIM-88: an input is read-only in the step (P-2026-09-28-0034)', () => {
    const ASK: StateAttributeDecl = { name: 'ask', metaclass: null, space: 'semantic', domain: { kind: 'boolean' }, input: true };
    const net = mkNet([tr('t', { a: 1 }, { b: 1 })], { declared: { M: [ASK] } });

    it('an action on an input halts read-only, marked input, before any write, σ unchanged (mutant: only a derived target is read-only)', () => {
        const c = cfg({ a: 1 });
        const out = step(net, c, 't', NO_GUARDS, actionsBy({ 'transition:t': () => [{ element: 'M', attr: 'ask', value: true }] }));
        expect(out.kind === 'halted' && out.reason).toEqual({ kind: 'read-only', site: { element: 't', role: 'transition' }, element: 'M', attr: 'ask', input: true });
        expect(out.kind === 'halted' && out.next.state).toBe(c.state);
    });
});

describe('presentationOf (R-SIM-108, P-2026-10-03-0040): an element\'s presentation, stored then derived', () => {
    const space = (values: Record<string, Record<string, SimValue>>) => new Map(Object.entries(values).map(([e, v]) => [e, new Map(Object.entries(v))]));
    const state = (stored: Record<string, Record<string, SimValue>>, derived?: Record<string, Record<string, SimValue>>): SimState => ({
        ...st({}, { e: { visits: 2 } }),
        presentation: space(stored),
        ...(derived ? { derived: { attrs: new Map(), presentation: space(derived) } } : {}),
    });

    it('a stored value before a derived one of the same name (mutant: the derived part read first)', () => {
        expect(presentationOf(state({ e: { heat: 3 } }, { e: { heat: 9 } }), 'e', 'heat')).toBe(3);
    });

    it('a stored 0, false or empty text is a value, not a miss (mutant: `||` for `??`)', () => {
        for (const v of [0, false, ''] as const) expect(presentationOf(state({ e: { heat: v } }, { e: { heat: 9 } }), 'e', 'heat')).toBe(v);
    });

    it('the derived value when none is stored; undefined for another element, another name, a semantic attribute, no derived part', () => {
        const s = state({}, { e: { heat: 'hot' } });
        expect(presentationOf(s, 'e', 'heat')).toBe('hot');
        expect([presentationOf(s, 'f', 'heat'), presentationOf(s, 'e', 'cold'), presentationOf(s, 'e', 'visits')]).toEqual([undefined, undefined, undefined]);
        expect(presentationOf(state({}), 'e', 'heat')).toBeUndefined();
    });

    it('the accessor answers as presentationOf on its own site, and nothing elsewhere or without one (locality kept, R-SIM-18)', () => {
        const s = state({ e: { heat: 0 } }, { e: { heat: 9, glow: true }, f: { glow: false } });
        for (const attr of ['heat', 'glow', 'none']) expect(stateAccess(s, 'e').readPresentation(attr)).toBe(presentationOf(s, 'e', attr));
        expect(stateAccess(s, 'e').readPresentation('heat')).toBe(0);
        expect(stateAccess(s).readPresentation('glow')).toBeUndefined();
        expect(stateAccess(s, 'g').readPresentation('glow')).toBeUndefined();
    });
});

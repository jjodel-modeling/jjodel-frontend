/**
 * boundExploration — the Bound from the reachable markings (G12(b), R-SIM-81(1)
 * as amended by Alfonso on 2026-09-27, P-2026-09-27-1611).
 *
 * Executes `exploreBound` (P11) on nets compiled by the engine's own
 * `compileNet` over raw lookups, the way the panel's helper compiles them
 * (`boundEstimate`, modelMarkings.ts): the bound lifted, so no initial marking
 * is dropped. The five nets of the report's §4.2 and the tests of its §4.3
 * (docs/discovery/discovery_2026-09-27_sim_post_models_engine.md). Each test
 * name says which break of the rule kills it; the mutation bench is in the
 * commit message.
 */

import { describe, it, expect } from 'vitest';
import { BOUND_EXPLORATION_CAP, exploreBound } from '../boundExploration';
import { compileNet } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import type { CompiledNet, NetModelView, NetStc } from '../netTypes';

type Obj = { cls: string; slots?: Record<string, unknown[]> };

const CLASSES: Record<string, string[]> = {
    PNode: [], Place: ['PNode'], Final: ['Place'], Transition: ['PNode'], Arc: [], InhibitorArc: ['Arc'], Event: [],
};

/** The Petri roles of the demo metamodel (script §2.2), the bound lifted as `boundEstimate` lifts it. */
const PETRI: NetStc = {
    shape: 'petri', bound: Number.MAX_SAFE_INTEGER, node: 'Place', transition: 'Transition', arc: 'Arc', arcSource: 'src',
    arcTarget: 'tgt', arcWeight: 'weight', inhibitorArc: 'InhibitorArc', initialMarking: 'tokens', guard: 'guard',
};

/** The raw D-layer shape objectSlots reads, and the net compiled from it. */
function net(objects: Record<string, Obj>, stc: Partial<NetStc> = {}): CompiledNet {
    const lookup: Record<string, any> = {};
    for (const [c, ext] of Object.entries(CLASSES)) lookup[c] = { className: 'DClass', extends: ext };
    for (const [id, o] of Object.entries(objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            features.push(`v_${id}_${f}`);
            lookup[`v_${id}_${f}`] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
    }
    const view: NetModelView = {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: () => [],
        transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f),
        values: (o, f) => objectSlotValues(lookup, o, f),
    };
    return compileNet({ ...PETRI, ...stc }, view, 'M', Object.keys(objects));
}

const place = (tokens?: number, cls = 'Place'): Obj => ({ cls, slots: tokens !== undefined ? { tokens: [tokens] } : {} });
const trans = (slots: Record<string, unknown[]> = {}): Obj => ({ cls: 'Transition', slots });
const arc = (src: string, tgt: string, weight?: number, cls = 'Arc'): Obj => ({
    cls, slots: { src: [src], tgt: [tgt], ...(weight !== undefined ? { weight: [weight] } : {}) },
});

/** The demo net of the script §2.2: `p1` 2, `lock` 1, `t1` → `p2` ×2, `p2` ×2 → `t2` → `p3`, `lock` inhibits `t2`, `t3` drains `lock`. */
const DEMO: Record<string, Obj> = {
    p1: place(2), p2: place(), p3: place(), lock: place(1),
    t1: trans(), t2: trans({ guard: ['p3.[tokens] < 1'] }), t3: trans(),
    a1: arc('p1', 't1'), a2: arc('t1', 'p2', 2), a3: arc('p2', 't2', 2), a4: arc('t2', 'p3'), a5: arc('lock', 't3'),
    i1: arc('lock', 't2', undefined, 'InhibitorArc'),
};

describe('exploreBound: the five nets of report §4.2', () => {
    it('the demo net gives 4, closed, over 9 markings (killed by the largest initial marking, 2)', () => {
        const n = net(DEMO);
        expect(n.defects).toEqual([]);
        expect(exploreBound(n)).toEqual({ max: 4, end: 'closed', markings: 9 });
    });

    it('a merge of two places of 2 into one gives 4 (killed by the largest initial marking, 2)', () => {
        const n = net({
            p1: place(2), p2: place(2), p3: place(), t1: trans(), t2: trans(),
            a1: arc('p1', 't1'), a2: arc('t1', 'p3'), a3: arc('p2', 't2'), a4: arc('t2', 'p3'),
        });
        expect(exploreBound(n)).toEqual({ max: 4, end: 'closed', markings: 9 });
    });

    it('a chain ×3 then ×3 gives 9 (killed by one step of multiplication, option (a): 3)', () => {
        const n = net({
            p1: place(1), p2: place(), p3: place(), t1: trans(), t2: trans(),
            a1: arc('p1', 't1'), a2: arc('t1', 'p2', 3), a3: arc('p2', 't2'), a4: arc('t2', 'p3', 3),
        });
        expect(exploreBound(n)).toEqual({ max: 9, end: 'closed', markings: 5 });
    });

    it('a heavy input, 5 tokens through an in-weight of 5 to ×2, gives 5 (killed by option (a): 10)', () => {
        const n = net({ p1: place(5), p2: place(), t1: trans(), a1: arc('p1', 't1', 5), a2: arc('t1', 'p2', 2) });
        expect(exploreBound(n)).toEqual({ max: 5, end: 'closed', markings: 2 });
    });

    it('a self-feeding loop is unbounded at its first new marking (killed by dropping the covering check: the cap instead)', () => {
        const n = net({ p1: place(1), t1: trans(), a1: arc('p1', 't1'), a2: arc('t1', 'p1', 2) });
        expect(exploreBound(n)).toEqual({ max: 1, end: 'unbounded', markings: 1 });
        // control: the same loop without the gain closes on its one marking
        const flat = net({ p1: place(1), t1: trans(), a1: arc('p1', 't1'), a2: arc('t1', 'p1') });
        expect(exploreBound(flat)).toEqual({ max: 1, end: 'closed', markings: 1 });
    });
});

describe('exploreBound: what the search keeps and what it ignores (report §4.3, test 4)', () => {
    /** `p1` 1 → `t1` → `p2` ×3: the producer the tests block or free. */
    const PRODUCER: Record<string, Obj> = { p1: place(1), p2: place(), t1: trans(), a1: arc('p1', 't1'), a2: arc('t1', 'p2', 3) };

    it('an inhibitor that never empties blocks its producer, which adds nothing (killed by ignoring inhibitors)', () => {
        const blocked = net({ ...PRODUCER, lock: place(1), i1: arc('lock', 't1', undefined, 'InhibitorArc') });
        expect(exploreBound(blocked)).toEqual({ max: 1, end: 'closed', markings: 1 });
        // control: an inhibitor on an empty place blocks nothing
        const free = net({ ...PRODUCER, lock: place(), i1: arc('lock', 't1', undefined, 'InhibitorArc') });
        expect(exploreBound(free).max).toBe(3);
    });

    it('a terminated marking has no successor: a marked final stops the producer after it (killed by dropping the termination check)', () => {
        const objects: Record<string, Obj> = {
            p1: place(1), f: place(undefined, 'Final'), p2: place(), t1: trans(), t2: trans(),
            a1: arc('p1', 't1'), a2: arc('t1', 'f'), a3: arc('f', 't2'), a4: arc('t2', 'p2', 5),
        };
        expect(exploreBound(net(objects, { terminal: 'Final' }))).toEqual({ max: 1, end: 'closed', markings: 2 });
        // control: without the terminal role the run goes on through t2
        expect(exploreBound(net(objects)).max).toBe(5);
    });

    it('guards, else and triggers are ignored: a false guard, an else and an event-only producer still count (killed by evaluating any of them)', () => {
        const guarded = net({ ...PRODUCER, t1: trans({ guard: ['false'] }) });
        expect(guarded.transitions[0].guardSites).toEqual(['t1']);
        expect(exploreBound(guarded).max).toBe(3);
        const elseNet = net({ ...PRODUCER, t1: trans({ guard: ['else'] }) });
        expect(elseNet.transitions[0].elseOf).toEqual([]);
        expect(exploreBound(elseNet).max).toBe(3);
        const triggered = net({ ...PRODUCER, e: { cls: 'Event' }, t1: trans({ trigger: ['e'] }) }, { event: 'Event', trigger: 'trigger' });
        expect(triggered.transitions[0].triggers).toEqual(['e']);
        expect(exploreBound(triggered).max).toBe(3);
    });

    it('the net\'s own bound is not read: a net compiled at k = 1 is explored past 1 (killed by stopping at an unsafe firing)', () => {
        const atOne = net(PRODUCER, { bound: 1 });
        expect(atOne.bound).toBe(1);
        expect(exploreBound(atOne)).toEqual({ max: 3, end: 'closed', markings: 2 });
    });
});

describe('exploreBound: the cap (report §4.3, test 6)', () => {
    it('stops when a new marking would exceed the cap, and says so (killed by an off-by-one either way)', () => {
        const n = net(DEMO);
        expect(exploreBound(n, 3)).toMatchObject({ end: 'cap', markings: 3 });
        expect(exploreBound(n, 8)).toMatchObject({ end: 'cap', markings: 8 });
        // control: a cap equal to the reachable markings closes
        expect(exploreBound(n, 9)).toEqual({ max: 4, end: 'closed', markings: 9 });
    });

    it('the default cap is the report\'s 2000 markings: a bounded counter of 2001 markings stops there', () => {
        expect(BOUND_EXPLORATION_CAP).toBe(2000);
        const counter = net({ p: place(2000), q: place(), t: trans(), a1: arc('p', 't'), a2: arc('t', 'q') });
        expect(exploreBound(counter)).toMatchObject({ end: 'cap', markings: 2000 });
        // control: one token fewer, 2000 markings, closes
        const smaller = net({ p: place(1999), q: place(), t: trans(), a1: arc('p', 't'), a2: arc('t', 'q') });
        expect(exploreBound(smaller)).toEqual({ max: 1999, end: 'closed', markings: 2000 });
    });

    it('an empty net closes on its one marking with 0', () => {
        expect(exploreBound(net({ p: place() }))).toEqual({ max: 0, end: 'closed', markings: 1 });
    });
});

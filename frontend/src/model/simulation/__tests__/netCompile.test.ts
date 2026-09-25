/**
 * netCompile — step 3a (P-2026-09-25-0935): the STC roles to a Petri net.
 *
 * Executes `netStcFromRoles` and `compileNet` (P11) over raw lookups read the
 * way the 3b adapter will read them: `objectSlots.ts` by feature pointer and
 * `isKindOf` with ancestry (R-SIM-8). Every "nothing is compiled" has its
 * control on the same fixture (P12). Rules: R-SIM-10, R-SIM-21..23, R-SIM-27,
 * R-SIM-28, R-SIM-30..32; table of report §5.3
 * (docs/discovery/discovery_2026-09-25_sim_step3_petri_core.md).
 */

import { describe, it, expect } from 'vitest';
import { compileNet, netStcFromRoles } from '../netCompile';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import type { NetModelView, NetStc, NetTransition, StateAttributeDecl } from '../netTypes';

interface Spec {
    classes: Record<string, string[]>;
    objects: Record<string, { cls: string; slots?: Record<string, unknown[]> }>;
}

/** The raw D-layer shape objectSlots reads: DObject.features -> DValue { instanceof: feature, values }. */
function buildLookup(spec: Spec): Record<string, any> {
    const lookup: Record<string, any> = {};
    for (const [c, ext] of Object.entries(spec.classes)) lookup[c] = { className: 'DClass', extends: ext };
    for (const [id, o] of Object.entries(spec.objects)) {
        const features: string[] = [];
        for (const [f, values] of Object.entries(o.slots ?? {})) {
            const vid = `v_${id}_${f}`;
            features.push(vid);
            lookup[vid] = { className: 'DValue', instanceof: f, values };
        }
        lookup[id] = { className: 'DObject', instanceof: o.cls, features };
    }
    return lookup;
}

function rawView(lookup: Record<string, any>): NetModelView {
    return {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: () => [],
        transitionTarget: () => null,
        references: (o, f) => objectReferences(lookup, o, f),
        values: (o, f) => objectSlotValues(lookup, o, f),
    };
}

function compile(stc: NetStc, spec: Spec, decls: StateAttributeDecl[] = [], modelId = 'M') {
    const lookup = buildLookup(spec);
    return compileNet(stc, rawView(lookup), modelId, Object.keys(spec.objects), decls);
}

function byId(ts: readonly NetTransition[]): Record<string, NetTransition> {
    return Object.fromEntries(ts.map(t => [t.id, t]));
}

const arcs = (xs: ReadonlyArray<{ place: string; weight: number }>) =>
    [...xs].sort((a, b) => (a.place < b.place ? -1 : 1)).map(a => `${a.place}*${a.weight}`);

const CF: NetStc = { shape: 'control-flow', bound: 1, initial: 'C_Init', ownedTransitions: 'R_out', nextState: 'R_next' };
const CLASSES = { C_Node: [], C_Init: ['C_Node'], C_SubInit: ['C_Init'], C_End: ['C_Node'], C_Tr: [], C_Fork: ['C_Node'], C_Join: ['C_Node'], C_Ev: [] };

describe('netStcFromRoles (R-SIM-28, R-SIM-31, R-SIM-32)', () => {
    const cf = { simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
    const petri = { simNode: 'C_P', simTransition: 'C_T', simArc: 'C_A', simArcSource: 'R_s', simArcTarget: 'R_t', simInitialMarking: 'A_m' };

    it('control-flow runs without simTerminal: the role is optional', () => {
        expect(netStcFromRoles(cf)).toEqual({ shape: 'control-flow', bound: 1, initial: 'C_Init', ownedTransitions: 'R_out', nextState: 'R_next' });
        expect(netStcFromRoles({ ...cf, simTerminal: 'C_End' })?.terminal).toBe('C_End');
    });

    it('control-flow needs simNextState, a source rule and an initial rule; empty strings count as unset', () => {
        expect(netStcFromRoles({ ...cf, simNextState: undefined })).toBeNull();
        expect(netStcFromRoles({ ...cf, simNextState: '' })).toBeNull();
        expect(netStcFromRoles({ ...cf, simOwnedTransitions: undefined })).toBeNull();
        expect(netStcFromRoles({ ...cf, simOwnedTransitions: undefined, simSource: 'R_src' })?.source).toBe('R_src');
        expect(netStcFromRoles({ ...cf, simInitial: undefined })).toBeNull();
        expect(netStcFromRoles({ ...cf, simInitial: undefined, simInitialMarking: 'A_m' })?.initialMarking).toBe('A_m');
        expect(netStcFromRoles(undefined)).toBeNull();
    });

    it('the Petri shape is recognised by simArc, and needs its six keys', () => {
        expect(netStcFromRoles(petri)?.shape).toBe('petri');
        expect(netStcFromRoles(cf)?.shape).toBe('control-flow');
        for (const key of Object.keys(petri)) {
            if (key === 'simArc') continue;
            expect(netStcFromRoles({ ...petri, [key]: undefined })).toBeNull();
        }
        // without simArc the same bag is a control-flow bag missing its keys
        expect(netStcFromRoles({ ...petri, simArc: undefined })).toBeNull();
    });

    it('simBound: default 1, an integer >= 1 as number or digits, anything else refuses the STC', () => {
        expect(netStcFromRoles(cf)?.bound).toBe(1);
        expect(netStcFromRoles({ ...cf, simBound: 3 })?.bound).toBe(3);
        expect(netStcFromRoles({ ...cf, simBound: '2' })?.bound).toBe(2);
        for (const bad of [0, -1, 1.5, 'x', '2.5']) expect(netStcFromRoles({ ...cf, simBound: bad })).toBeNull();
    });

    it('the event role is all or nothing', () => {
        expect(netStcFromRoles({ ...cf, simEvent: 'C_Ev', simTrigger: 'R_trig', simEventIdentifier: 'A_id' }))
            .toMatchObject({ event: 'C_Ev', trigger: 'R_trig', eventIdentifier: 'A_id' });
        const half = netStcFromRoles({ ...cf, simEvent: 'C_Ev', simEventIdentifier: 'A_id' })!;
        expect([half.event, half.trigger, half.eventIdentifier]).toEqual([undefined, undefined, undefined]);
    });

    it('reads every key of R-SIM-32 into its field', () => {
        const all = {
            ...cf, simSource: 'R_src', simFork: 'C_Fork', simJoin: 'C_Join', simGuard: 'A_g', simNode: 'C_Node',
            simTransition: 'C_Tr', simTerminal: 'C_End', simArcWeight: 'A_w', simInhibitorArc: 'C_I',
        };
        expect(netStcFromRoles(all)).toMatchObject({
            source: 'R_src', fork: 'C_Fork', join: 'C_Join', guard: 'A_g', node: 'C_Node', transition: 'C_Tr',
            terminal: 'C_End', arcWeight: 'A_w', inhibitorArc: 'C_I',
        });
    });
});

describe('compileNet, control-flow shape', () => {
    it('an owned edge is a transition from its owner to its target (R-SIM-10, R-SIM-21)', () => {
        const net = compile(CF, {
            classes: CLASSES,
            objects: { A: { cls: 'C_Init', slots: { R_out: ['t1'] } }, B: { cls: 'C_Node' }, t1: { cls: 'C_Tr', slots: { R_next: ['B'] } } },
        });
        expect(net.transitions).toHaveLength(1);
        const t = net.transitions[0];
        expect([t.id, t.origin, arcs(t.preset), arcs(t.postset)]).toEqual(['t1', ['t1'], ['A*1'], ['B*1']]);
        expect(t.actionSites).toEqual([{ element: 'A', role: 'exit' }, { element: 't1', role: 'transition' }, { element: 'B', role: 'entry' }]);
        expect([...net.places].sort()).toEqual(['A', 'B']);
        expect(net.defects).toEqual([]);
    });

    it('simSource overrides the owner; several sources and targets are an AND-join and a parallel fork', () => {
        const net = compile({ ...CF, source: 'R_src' }, {
            classes: CLASSES,
            objects: {
                A: { cls: 'C_Init', slots: { R_out: ['t'] } }, B: { cls: 'C_Node' }, C: { cls: 'C_Node' }, D: { cls: 'C_Node' },
                t: { cls: 'C_Tr', slots: { R_src: ['B', 'C'], R_next: ['C', 'D'] } },
                u: { cls: 'C_Tr', slots: { R_next: ['A'] } },
            },
        });
        const t = byId(net.transitions).t;
        expect([arcs(t.preset), arcs(t.postset)]).toEqual([['B*1', 'C*1'], ['C*1', 'D*1']]);
        // u is neither owned nor sourced: it is not found as an edge at all without the transition role
        expect(byId(net.transitions).u).toBeUndefined();
    });

    it('a transition with no source is a defect when the transition role finds it', () => {
        const net = compile({ ...CF, transition: 'C_Tr' }, {
            classes: CLASSES,
            objects: { A: { cls: 'C_Init', slots: { R_out: ['t'] } }, B: { cls: 'C_Node' }, t: { cls: 'C_Tr', slots: { R_next: ['B'] } }, u: { cls: 'C_Tr', slots: { R_next: ['A'] } } },
        });
        expect(net.defects).toEqual([{ element: 'u', code: 'no-source', message: 'the edge has no source' }]);
        expect(net.transitions.map(t => t.id)).toEqual(['t']);
    });

    it('R-SIM-31: an edge without target, with a deleted target, or with a non-place target is a defect, never a transition', () => {
        const net = compile({ ...CF, node: 'C_Node' }, {
            classes: CLASSES,
            objects: {
                A: { cls: 'C_Init', slots: { R_out: ['tOk', 'tUnset', 'tGone', 'tStray'] } }, B: { cls: 'C_Node' }, X: { cls: 'C_Tr' },
                tOk: { cls: 'C_Tr', slots: { R_next: ['B'] } }, tUnset: { cls: 'C_Tr', slots: { R_next: [null] } },
                tGone: { cls: 'C_Tr', slots: { R_next: ['DELETED'] } }, tStray: { cls: 'C_Tr', slots: { R_next: ['X'] } },
            },
        });
        expect(net.transitions.map(t => t.id)).toEqual(['tOk']);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([
            ['tUnset', 'no-target'], ['tGone', 'no-target'], ['tStray', 'not-a-place'],
        ]);
    });

    it('triggers are read only with the event role (R-SIM-16); event instances are not places', () => {
        const objects = {
            A: { cls: 'C_Init', slots: { R_out: ['t'] } }, B: { cls: 'C_Node' }, coin: { cls: 'C_Ev' },
            t: { cls: 'C_Tr', slots: { R_next: ['B'], R_trig: ['coin'] } },
        };
        const withRole = compile({ ...CF, event: 'C_Ev', trigger: 'R_trig' }, { classes: CLASSES, objects });
        expect(withRole.transitions[0].triggers).toEqual(['coin']);
        expect(withRole.hasEventRole).toBe(true);
        expect(withRole.places.has('coin')).toBe(false);
        const without = compile(CF, { classes: CLASSES, objects });
        expect(without.transitions[0].triggers).toEqual([]);
        expect(without.hasEventRole).toBe(false);
    });

    it('guard sites exist only with simGuard (R-SIM-17: no role, no guard)', () => {
        const objects = { A: { cls: 'C_Init', slots: { R_out: ['t'] } }, B: { cls: 'C_Node' }, t: { cls: 'C_Tr', slots: { R_next: ['B'], A_g: ['x > 1'] } } };
        expect(compile(CF, { classes: CLASSES, objects }).transitions[0].guardSites).toEqual([]);
        expect(compile({ ...CF, guard: 'A_g' }, { classes: CLASSES, objects }).transitions[0].guardSites).toEqual(['t']);
    });

    it('R-SIM-31 else: the literal text, siblings by preset and triggers, two else are else-twice', () => {
        const net = compile({ ...CF, guard: 'A_g' }, {
            classes: CLASSES,
            objects: {
                D: { cls: 'C_Init', slots: { R_out: ['e3', 'e4', 'e5'] } }, I: { cls: 'C_Node' }, E: { cls: 'C_End' }, F: { cls: 'C_Node' },
                e3: { cls: 'C_Tr', slots: { R_next: ['I'], A_g: ['x < 2'] } },
                e4: { cls: 'C_Tr', slots: { R_next: ['E'], A_g: [' else '] } },
                e5: { cls: 'C_Tr', slots: { R_next: ['F'], A_g: ['x > 5'] } },
            },
        });
        const t = byId(net.transitions);
        expect(t.e4.elseOf).toEqual(['e3', 'e5']);
        expect(t.e4.guardSites).toEqual([]);
        expect(t.e3.elseOf).toBeNull();
        expect(t.e3.guardSites).toEqual(['e3']);

        const twice = compile({ ...CF, guard: 'A_g' }, {
            classes: CLASSES,
            objects: {
                D: { cls: 'C_Init', slots: { R_out: ['g', 'x1', 'x2'] } }, I: { cls: 'C_Node' }, E: { cls: 'C_End' },
                g: { cls: 'C_Tr', slots: { R_next: ['I'], A_g: ['x < 2'] } },
                x1: { cls: 'C_Tr', slots: { R_next: ['E'], A_g: ['else'] } }, x2: { cls: 'C_Tr', slots: { R_next: ['I'], A_g: ['else'] } },
            },
        });
        expect(twice.transitions.map(x => x.id)).toEqual(['g']);
        expect(twice.defects.map(d => [d.element, d.code])).toEqual([['x1', 'else-twice'], ['x2', 'else-twice']]);
    });

    it('an else with a different trigger is not a sibling', () => {
        const net = compile({ ...CF, guard: 'A_g', event: 'C_Ev', trigger: 'R_trig' }, {
            classes: CLASSES,
            objects: {
                D: { cls: 'C_Init', slots: { R_out: ['a', 'b', 'c'] } }, I: { cls: 'C_Node' }, coin: { cls: 'C_Ev' }, push: { cls: 'C_Ev' },
                a: { cls: 'C_Tr', slots: { R_next: ['I'], R_trig: ['coin'], A_g: ['x < 2'] } },
                b: { cls: 'C_Tr', slots: { R_next: ['I'], R_trig: ['push'], A_g: ['x < 2'] } },
                c: { cls: 'C_Tr', slots: { R_next: ['I'], R_trig: ['coin'], A_g: ['else'] } },
            },
        });
        expect(byId(net.transitions).c.elseOf).toEqual(['a']);
    });

    it('R-SIM-22, R-SIM-31: fork and join nodes are not places, their edges fuse with origins recorded', () => {
        const net = compile({ ...CF, fork: 'C_Fork', join: 'C_Join', guard: 'A_g' }, {
            classes: CLASSES,
            objects: {
                p0: { cls: 'C_Init', slots: { R_out: ['e0'] } }, F: { cls: 'C_Fork', slots: { R_out: ['e1', 'e2'] } },
                a: { cls: 'C_Node', slots: { R_out: ['e3'] } }, b: { cls: 'C_Node', slots: { R_out: ['e4'] } },
                J: { cls: 'C_Join', slots: { R_out: ['e5'] } }, done: { cls: 'C_End' },
                e0: { cls: 'C_Tr', slots: { R_next: ['F'] } }, e1: { cls: 'C_Tr', slots: { R_next: ['a'] } }, e2: { cls: 'C_Tr', slots: { R_next: ['b'] } },
                e3: { cls: 'C_Tr', slots: { R_next: ['J'] } }, e4: { cls: 'C_Tr', slots: { R_next: ['J'] } }, e5: { cls: 'C_Tr', slots: { R_next: ['done'] } },
            },
        });
        const t = byId(net.transitions);
        expect(Object.keys(t).sort()).toEqual(['F', 'J']);
        expect([arcs(t.F.preset), arcs(t.F.postset), t.F.origin]).toEqual([['p0*1'], ['a*1', 'b*1'], ['e0', 'F', 'e1', 'e2']]);
        expect([arcs(t.J.preset), arcs(t.J.postset), t.J.origin]).toEqual([['a*1', 'b*1'], ['done*1'], ['e3', 'e4', 'J', 'e5']]);
        expect(t.F.guardSites).toEqual(['e0', 'e1', 'e2']);
        expect(t.F.actionSites.filter(s => s.role === 'transition').map(s => s.element)).toEqual(['e0', 'e1', 'e2']);
        expect(net.places.has('F') || net.places.has('J')).toBe(false);
        expect(net.places.has('a')).toBe(true);
        expect(net.defects).toEqual([]);
    });

    it('a fork with two incoming edges gives one transition per edge; a node that is both fork and join gives one', () => {
        const classes = { ...CLASSES, C_Bar: ['C_Fork', 'C_Join'] };
        const net = compile({ ...CF, fork: 'C_Fork', join: 'C_Join' }, {
            classes,
            objects: {
                x: { cls: 'C_Init', slots: { R_out: ['i1'] } }, y: { cls: 'C_Init', slots: { R_out: ['i2'] } },
                F: { cls: 'C_Fork', slots: { R_out: ['o1', 'o2'] } }, a: { cls: 'C_Node' }, b: { cls: 'C_Node' },
                i1: { cls: 'C_Tr', slots: { R_next: ['F'] } }, i2: { cls: 'C_Tr', slots: { R_next: ['F'] } },
                o1: { cls: 'C_Tr', slots: { R_next: ['a'] } }, o2: { cls: 'C_Tr', slots: { R_next: ['b'] } },
            },
        });
        expect(net.transitions.map(t => [t.id, arcs(t.preset), arcs(t.postset)])).toEqual([
            ['F#i1', ['x*1'], ['a*1', 'b*1']], ['F#i2', ['y*1'], ['a*1', 'b*1']],
        ]);
        const bar = compile({ ...CF, fork: 'C_Fork', join: 'C_Join' }, {
            classes,
            objects: {
                x: { cls: 'C_Init', slots: { R_out: ['i1'] } }, y: { cls: 'C_Init', slots: { R_out: ['i2'] } },
                B: { cls: 'C_Bar', slots: { R_out: ['o1', 'o2'] } }, a: { cls: 'C_Node' }, b: { cls: 'C_Node' },
                i1: { cls: 'C_Tr', slots: { R_next: ['B'] } }, i2: { cls: 'C_Tr', slots: { R_next: ['B'] } },
                o1: { cls: 'C_Tr', slots: { R_next: ['a'] } }, o2: { cls: 'C_Tr', slots: { R_next: ['b'] } },
            },
        });
        expect(bar.transitions.map(t => [t.id, arcs(t.preset), arcs(t.postset)])).toEqual([['B', ['x*1', 'y*1'], ['a*1', 'b*1']]]);
    });

    it('a join with two outgoing edges gives one transition per edge', () => {
        const net = compile({ ...CF, join: 'C_Join' }, {
            classes: CLASSES,
            objects: {
                a: { cls: 'C_Init', slots: { R_out: ['i1'] } }, b: { cls: 'C_Init', slots: { R_out: ['i2'] } },
                J: { cls: 'C_Join', slots: { R_out: ['o1', 'o2'] } }, c: { cls: 'C_Node' }, d: { cls: 'C_Node' },
                i1: { cls: 'C_Tr', slots: { R_next: ['J'] } }, i2: { cls: 'C_Tr', slots: { R_next: ['J'] } },
                o1: { cls: 'C_Tr', slots: { R_next: ['c'] } }, o2: { cls: 'C_Tr', slots: { R_next: ['d'] } },
            },
        });
        expect(net.transitions.map(t => [t.id, arcs(t.preset), arcs(t.postset)])).toEqual([
            ['J#o1', ['a*1', 'b*1'], ['c*1']], ['J#o2', ['a*1', 'b*1'], ['d*1']],
        ]);
    });

    it('pseudo-chain and pseudo-open are defects (the fusion test above is their control)', () => {
        const net = compile({ ...CF, fork: 'C_Fork', join: 'C_Join' }, {
            classes: CLASSES,
            objects: {
                p: { cls: 'C_Init', slots: { R_out: ['e0'] } }, F: { cls: 'C_Fork', slots: { R_out: ['fj'] } },
                J: { cls: 'C_Join' }, e0: { cls: 'C_Tr', slots: { R_next: ['F'] } }, fj: { cls: 'C_Tr', slots: { R_next: ['J'] } },
            },
        });
        expect(net.transitions).toEqual([]);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([['fj', 'pseudo-chain'], ['F', 'pseudo-open']]);
    });

    it('an edge from a fork to it and to a place is a defect (the fork is the only endpoint of its side)', () => {
        const net = compile({ ...CF, fork: 'C_Fork' }, {
            classes: CLASSES,
            objects: {
                p: { cls: 'C_Init', slots: { R_out: ['e0'] } }, F: { cls: 'C_Fork', slots: { R_out: ['e1'] } }, a: { cls: 'C_Node' },
                e0: { cls: 'C_Tr', slots: { R_next: ['F', 'a'] } }, e1: { cls: 'C_Tr', slots: { R_next: ['a'] } },
            },
        });
        expect(net.defects.map(d => [d.element, d.code])).toContainEqual(['e0', 'pseudo-chain']);
    });
});

describe('compileNet, Petri shape (R-SIM-21, R-SIM-23, R-SIM-30)', () => {
    const PN: NetStc = {
        shape: 'petri', bound: 2, node: 'C_P', transition: 'C_T', arc: 'C_A', arcSource: 'R_s', arcTarget: 'R_t',
        arcWeight: 'A_w', inhibitorArc: 'C_I', initialMarking: 'A_m',
    };
    const classes = { C_P: [], C_T: [], C_A: [], C_I: [] };
    const arc = (s: string, t: string, w?: unknown, cls = 'C_A') => ({ cls, slots: { R_s: [s], R_t: [t], ...(w === undefined ? {} : { A_w: [w] }) } });

    it('Ex3 of the report: weights, a parallel fork, an AND-join and an inhibitor', () => {
        const net = compile(PN, {
            classes,
            objects: {
                p0: { cls: 'C_P', slots: { A_m: [1] } }, a1: { cls: 'C_P' }, b1: { cls: 'C_P' }, a2: { cls: 'C_P' }, b2: { cls: 'C_P' }, done: { cls: 'C_P' },
                tf: { cls: 'C_T' }, ta: { cls: 'C_T' }, tb: { cls: 'C_T' }, tj: { cls: 'C_T' },
                x1: arc('p0', 'tf'), x2: arc('tf', 'a1'), x3: arc('tf', 'b1'), x4: arc('a1', 'ta'), x5: arc('ta', 'a2'),
                x6: arc('b1', 'tb'), x7: arc('tb', 'b2', 2), x8: arc('a1', 'tb', undefined, 'C_I'),
                x9: arc('a2', 'tj'), x10: arc('b2', 'tj', 2), x11: arc('tj', 'done'),
            },
        });
        const t = byId(net.transitions);
        expect([arcs(t.tf.preset), arcs(t.tf.postset)]).toEqual([['p0*1'], ['a1*1', 'b1*1']]);
        expect([arcs(t.tb.preset), arcs(t.tb.postset), arcs(t.tb.inhibitors)]).toEqual([['b1*1'], ['b2*2'], ['a1*1']]);
        expect([arcs(t.tj.preset), arcs(t.tj.postset)]).toEqual([['a2*1', 'b2*2'], ['done*1']]);
        expect(net.initial.marking).toEqual(new Map([['p0', 1]]));
        expect(net.defects).toEqual([]);
        expect([...net.places].sort()).toEqual(['a1', 'a2', 'b1', 'b2', 'done', 'p0']);
        expect(net.final).toBeNull();
    });

    it('two arcs on the same place sum their weights; an arc without a weight weighs 1', () => {
        const net = compile(PN, {
            classes,
            objects: { p: { cls: 'C_P' }, q: { cls: 'C_P' }, t: { cls: 'C_T' }, a: arc('p', 't'), b: arc('p', 't', 2), c: arc('t', 'q') },
        });
        expect([arcs(net.transitions[0].preset), arcs(net.transitions[0].postset)]).toEqual([['p*3'], ['q*1']]);
    });

    it('bad arcs and bad weights are defects; control: the good arc compiles', () => {
        const net = compile(PN, {
            classes,
            objects: {
                p: { cls: 'C_P' }, q: { cls: 'C_P' }, t: { cls: 'C_T' },
                good: arc('p', 't'), pp: arc('p', 'q'), ti: arc('t', 'p', undefined, 'C_I'), w0: arc('p', 't', 0), w15: arc('p', 't', 1.5), ws: arc('p', 't', '2'),
            },
        });
        expect(arcs(net.transitions[0].preset)).toEqual(['p*1']);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([
            ['pp', 'bad-arc'], ['ti', 'bad-arc'], ['w0', 'bad-weight'], ['w15', 'bad-weight'], ['ws', 'bad-weight'],
        ]);
    });
});

describe('the initial state, F and the attributes (R-SIM-19, R-SIM-27, R-SIM-28)', () => {
    it('one token on each place that is a kind of simInitial, ancestry included', () => {
        const net = compile(CF, {
            classes: CLASSES,
            objects: { A: { cls: 'C_Init' }, S: { cls: 'C_SubInit' }, N: { cls: 'C_Node' } },
        });
        expect(net.initial.marking).toEqual(new Map([['A', 1], ['S', 1]]));
    });

    it('simInitialMarking: its value on each place; outside 0..k a defect and the place starts empty', () => {
        const stc: NetStc = { ...CF, initial: undefined, initialMarking: 'A_m', bound: 2 };
        const net = compile(stc, {
            classes: CLASSES,
            objects: { A: { cls: 'C_Node', slots: { A_m: [2] } }, B: { cls: 'C_Node', slots: { A_m: [3] } }, C: { cls: 'C_Node', slots: { A_m: [-1] } }, D: { cls: 'C_Node', slots: { A_m: [0] } }, E: { cls: 'C_Node' } },
        });
        expect(net.initial.marking).toEqual(new Map([['A', 2]]));
        expect(net.defects.map(d => [d.element, d.code])).toEqual([['B', 'initial-over-bound'], ['C', 'initial-over-bound']]);
    });

    it('F is null without simTerminal, the kind-of places with it', () => {
        const spec: Spec = { classes: { ...CLASSES, C_SubEnd: ['C_End'] }, objects: { A: { cls: 'C_Init' }, E: { cls: 'C_End' }, S: { cls: 'C_SubEnd' } } };
        expect(compile(CF, spec).final).toBeNull();
        expect([...compile({ ...CF, terminal: 'C_End' }, spec).final!].sort()).toEqual(['E', 'S']);
    });

    it('attributes: per kind-of instance, global on the model id, presentation apart; the first declaration holds', () => {
        const decls: StateAttributeDecl[] = [
            { name: 'visits', metaclass: 'C_Node', space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 0 },
            { name: 'x', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, initial: 1 },
            { name: 'glow', metaclass: 'C_Node', space: 'presentation', domain: null, initial: false },
            { name: 'visits', metaclass: 'C_Init', space: 'semantic', domain: { kind: 'range', min: 0, max: 9 }, initial: 5 },
        ];
        const net = compile(CF, { classes: CLASSES, objects: { A: { cls: 'C_Init' }, N: { cls: 'C_Node' }, T: { cls: 'C_Tr' } } }, decls, 'M1');
        expect(net.initial.attrs.get('A')?.get('visits')).toBe(0);
        expect(net.initial.attrs.get('N')?.get('visits')).toBe(0);
        expect(net.initial.attrs.get('T')).toBeUndefined();
        expect(net.initial.attrs.get('M1')?.get('x')).toBe(1);
        expect(net.initial.presentation.get('N')?.get('glow')).toBe(false);
        expect(net.initial.attrs.get('N')?.has('glow')).toBe(false);
        expect(net.declared.get('A')?.get('visits')).toBe(decls[0]);
    });
});

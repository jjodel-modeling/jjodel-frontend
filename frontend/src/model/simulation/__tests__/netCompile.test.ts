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
import { compileNet, eventAlphabet, netStcFromRoles, withDerivedEventRole, withDerivedInitial } from '../netCompile';
import { candidates } from '../netStep';
import { isKindOf } from '../isKindOf';
import { objectReferences, objectSlotValues } from '../objectSlots';
import type { GuardOutcome } from '../guardEvaluator';
import type { DeclarationDefect, DerivedOracle, GuardOracle, NetModelView, NetStc, NetTransition, SimValue, StateAttributeDecl } from '../netTypes';

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

    it('R-SIM-53: simActivityFinal reaches the STC as activityFinal, optional like simTerminal (mutant: the ROLE_KEYS pair dropped)', () => {
        expect(netStcFromRoles({ ...cf, simActivityFinal: 'C_AF' })?.activityFinal).toBe('C_AF');
        // control: without the key the field is absent, and the STC still runs
        expect(netStcFromRoles(cf)).not.toHaveProperty('activityFinal');
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

    it('the action keys reach the STC (R-SIM-69): simAction, simEntry, simExit, and the run needs none of them', () => {
        const stc = netStcFromRoles({ ...petri, simAction: 'A_act', simEntry: 'A_in', simExit: 'A_out' });
        expect([stc?.action, stc?.entry, stc?.exit]).toEqual(['A_act', 'A_in', 'A_out']);
        expect(netStcFromRoles({ ...cf, simEntry: 'A_in' })).toEqual({
            shape: 'control-flow', bound: 1, initial: 'C_Init', ownedTransitions: 'R_out', nextState: 'R_next', entry: 'A_in',
        });
        // control: without them the STC has no action field, and it still runs
        expect(netStcFromRoles(petri)).not.toHaveProperty('action');
        expect(netStcFromRoles({ ...cf, simAction: '' })).not.toHaveProperty('action');
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

describe('R-SIM-31 else over fused transitions (lane E1, P-2026-09-27-1610, G7)', () => {
    const STC: NetStc = { ...CF, fork: 'C_Fork', join: 'C_Join', guard: 'A_g' };
    type Objects = Spec['objects'];
    const edge = (next: string, guard?: string) => ({ cls: 'C_Tr', slots: { R_next: [next], ...(guard === undefined ? {} : { A_g: [guard] }) } });
    /** i0 -f1-> w -f2-> d ; d -f3 [g3]-> w ; d -f4 [g4]-> fk ; fk -f5 [g5]-> l, -f6-> r */
    const decision = (g3: string, g4: string, g5?: string): Objects => ({
        i0: { cls: 'C_Init', slots: { R_out: ['f1'] } }, w: { cls: 'C_Node', slots: { R_out: ['f2'] } },
        d: { cls: 'C_Node', slots: { R_out: ['f3', 'f4'] } }, fk: { cls: 'C_Fork', slots: { R_out: ['f5', 'f6'] } },
        l: { cls: 'C_Node' }, r: { cls: 'C_Node' },
        f1: edge('w'), f2: edge('d'), f3: edge('w', g3), f4: edge('fk', g4), f5: edge('l', g5), f6: edge('r'),
    });
    /** Guards by text on a count: `lo` true below 2, `hi` from 2, `no` false, `else` read as a guard a defect; any other, true. */
    const byText = (objects: Objects, count: number): GuardOracle => site => {
        const text = objects[site]?.slots?.A_g?.[0];
        if (text === 'lo') return { kind: count < 2 ? 'true' : 'false' };
        if (text === 'hi') return { kind: count >= 2 ? 'true' : 'false' };
        if (text === 'no') return { kind: 'false' };
        if (text === 'else') return { kind: 'defect', reason: 'parse-error', detail: 'else read as a guard' };
        return { kind: 'true' };
    };
    /** The candidates of ε on `marking`, the guards read at `count`. */
    const at = (objects: Objects, marking: Record<string, number>, count: number) => {
        const net = compile(STC, { classes: CLASSES, objects });
        const state = { marking: new Map(Object.entries(marking)), attrs: new Map(), presentation: new Map() };
        return candidates(net, { state, event: null }, byText(objects, count)).candidates.map(c => c.transition);
    };

    it('else on the edge into a fork is the complement of the decision\'s other edge, the fork keeping its out-edges\' guards (mutants: the fork\'s in-edge not marked; guardSites [] restored; else resolved among plain edges only)', () => {
        const objects = decision('lo', 'else');
        const net = compile(STC, { classes: CLASSES, objects });
        const fk = byId(net.transitions).fk;
        expect([fk.elseOf, fk.guardSites, net.defects]).toEqual([['f3'], ['f5', 'f6'], []]);
        expect(at(objects, { d: 1 }, 1)).toEqual(['f3']);
        expect(at(objects, { d: 1 }, 2)).toEqual(['fk']);
    });

    it('mirror: else on the plain edge has the fork\'s fused transition as its sibling (mutant: else resolved among plain edges only)', () => {
        const objects = decision('else', 'hi');
        expect(byId(compile(STC, { classes: CLASSES, objects }).transitions).f3.elseOf).toEqual(['fk']);
        expect(at(objects, { d: 1 }, 2)).toEqual(['fk']);
        expect(at(objects, { d: 1 }, 1)).toEqual(['f3']);
    });

    it('else on an edge out of a join is the complement of the join\'s other out-edge, the inputs\' guards kept (mutants: the join\'s out-edge not marked; guardSites [] restored)', () => {
        const objects: Objects = {
            a: { cls: 'C_Init', slots: { R_out: ['e1'] } }, b: { cls: 'C_Init', slots: { R_out: ['e2'] } },
            jn: { cls: 'C_Join', slots: { R_out: ['o1', 'o2'] } }, x: { cls: 'C_End' }, y: { cls: 'C_End' },
            e1: edge('jn'), e2: edge('jn', 'yes'), o1: edge('x', 'hi'), o2: edge('y', 'else'),
        };
        const net = compile(STC, { classes: CLASSES, objects });
        const o2 = byId(net.transitions)['jn#o2'];
        expect([o2.elseOf, o2.guardSites, net.defects]).toEqual([['jn#o1'], ['e1', 'e2'], []]);
        expect(at(objects, { a: 1, b: 1 }, 0)).toEqual(['jn#o2']);
        expect(at(objects, { a: 1, b: 1 }, 2)).toEqual(['jn#o1']);
    });

    it('else into a join or out of a fork is else-position and nothing of that node compiles; control: an explicit guard there compiles (mutant: the position check removed)', () => {
        const intoJoin: Objects = {
            i0: { cls: 'C_Init', slots: { R_out: ['e0'] } }, d: { cls: 'C_Node', slots: { R_out: ['e1', 'e2'] } },
            r: { cls: 'C_Init', slots: { R_out: ['e3'] } }, jn: { cls: 'C_Join', slots: { R_out: ['e4'] } },
            w: { cls: 'C_Node' }, fin: { cls: 'C_End' },
            e0: edge('d'), e1: edge('w', 'lo'), e2: edge('jn', 'else'), e3: edge('jn'), e4: edge('fin'),
        };
        const net = compile(STC, { classes: CLASSES, objects: intoJoin });
        expect(net.defects.map(x => [x.element, x.code, x.message])).toEqual([['e2', 'else-position', 'else on an edge into a join: it has no siblings']]);
        expect(net.transitions.map(t => t.id)).toEqual(['e0', 'e1']);
        const control = compile(STC, { classes: CLASSES, objects: { ...intoJoin, e2: edge('jn', 'hi') } });
        expect([control.defects, control.transitions.map(t => t.id)]).toEqual([[], ['e0', 'e1', 'jn']]);
        const outOfFork = compile(STC, { classes: CLASSES, objects: decision('lo', 'hi', 'else') });
        expect(outOfFork.defects.map(x => [x.element, x.code, x.message])).toEqual([['f5', 'else-position', 'else on an edge out of a fork: it has no siblings']]);
        expect(outOfFork.transitions.map(t => t.id)).toEqual(['f1', 'f2', 'f3']);
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

    // R-SIM-64 (P-2026-09-26-1535): `else` on a Petri transition, as on a control-flow edge.
    const PG: NetStc = { ...PN, guard: 'A_g' };
    const tr = (guard: string, trig?: string) => ({ cls: 'C_T', slots: { A_g: [guard], ...(trig ? { R_trig: [trig] } : {}) } });
    /** The guard oracle of the probe: an outcome per site, `true` for any other. */
    const oracle = (by: Record<string, GuardOutcome>): GuardOracle => site => by[site] ?? { kind: 'true' };
    /** The probe of the 1315 closure: p (1 token) feeds tf [false] and te [else]. */
    const probe = () => compile(PG, {
        classes,
        objects: {
            p: { cls: 'C_P', slots: { A_m: [1] } }, a: { cls: 'C_P' }, b: { cls: 'C_P' },
            tf: tr('false'), te: tr('else'),
            x1: arc('p', 'tf'), x2: arc('tf', 'a'), x3: arc('p', 'te'), x4: arc('te', 'b'),
        },
    });

    it('R-SIM-64: a Petri transition whose guard is else is the complement of its siblings, with no guard site of its own (mutants: parsed as a guard; the else keeps its site)', () => {
        const net = probe();
        const t = byId(net.transitions);
        expect([t.te.elseOf, t.te.guardSites]).toEqual([['tf'], []]);
        expect([t.tf.elseOf, t.tf.guardSites]).toEqual([null, ['tf']]);
        expect(net.defects).toEqual([]);
    });

    it('R-SIM-64 end to end: tf false gives te; tf true makes te else(false); a defective tf makes te a defect (R-SIM-31)', () => {
        const net = probe();
        const cfg = { state: net.initial, event: null };
        const run = (g: GuardOutcome) => candidates(net, cfg, oracle({ tf: g }));
        const off = run({ kind: 'false' });
        expect(off.candidates.map(c => c.transition)).toEqual(['te']);
        expect(off.evaluated).toEqual([
            { transition: 'tf', outcome: { kind: 'false' } },
            { transition: 'te', outcome: { kind: 'else', outcome: { kind: 'true' } } },
        ]);
        const on = run({ kind: 'true' });
        expect(on.candidates.map(c => c.transition)).toEqual(['tf']);
        expect(on.evaluated[1]).toEqual({ transition: 'te', outcome: { kind: 'else', outcome: { kind: 'false' } } });
        const bad: GuardOutcome = { kind: 'defect', reason: 'exception', detail: 'boom' };
        const broken = run(bad);
        expect(broken.candidates).toEqual([]);
        expect(broken.evaluated[1]).toEqual({ transition: 'te', outcome: { kind: 'else', outcome: bad } });
    });

    it('R-SIM-64: two else on the same preset are else-twice and neither compiles; control: the guarded sibling does (mutant: else-twice not reported in Petri)', () => {
        const net = compile(PG, {
            classes,
            objects: {
                p: { cls: 'C_P', slots: { A_m: [1] } }, a: { cls: 'C_P' },
                tg: tr('true'), e1: tr('else'), e2: tr(' else '),
                x1: arc('p', 'tg'), x2: arc('p', 'e1'), x3: arc('p', 'e2'), x4: arc('tg', 'a'), x5: arc('e1', 'a'), x6: arc('e2', 'a'),
            },
        });
        expect(net.transitions.map(t => t.id)).toEqual(['tg']);
        expect(net.defects.map(d => [d.element, d.code])).toEqual([['e1', 'else-twice'], ['e2', 'else-twice']]);
    });

    it('R-SIM-64: siblings share preset places, weights and triggers; another place, another weight or another trigger is not a sibling (mutants: weights ignored; triggers ignored)', () => {
        const net = compile({ ...PG, event: 'C_Ev', trigger: 'R_trig' }, {
            classes: { ...classes, C_Ev: [] },
            objects: {
                p: { cls: 'C_P', slots: { A_m: [2] } }, q: { cls: 'C_P' }, a: { cls: 'C_P' }, coin: { cls: 'C_Ev' }, push: { cls: 'C_Ev' },
                same: tr('true', 'coin'), place: tr('true', 'coin'), weight: tr('true', 'coin'), trigger: tr('true', 'push'), te: tr('else', 'coin'),
                x1: arc('p', 'same'), x2: arc('q', 'place'), x3: arc('p', 'weight', 2), x4: arc('p', 'trigger'), x5: arc('p', 'te'),
                y1: arc('same', 'a'), y2: arc('place', 'a'), y3: arc('weight', 'a'), y4: arc('trigger', 'a'), y5: arc('te', 'a'),
            },
        });
        expect(net.defects).toEqual([]);
        expect(byId(net.transitions).te.elseOf).toEqual(['same']);
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

    it('R-SIM-53: the activity final set is the kind-of places of simActivityFinal, apart from F, null without the role (mutant: activityFinal null)', () => {
        const spec: Spec = {
            classes: { ...CLASSES, C_AF: ['C_Node'], C_SubAF: ['C_AF'] },
            objects: { A: { cls: 'C_Init' }, F: { cls: 'C_AF' }, S: { cls: 'C_SubAF' }, E: { cls: 'C_End' } },
        };
        const net = compile({ ...CF, terminal: 'C_End', activityFinal: 'C_AF' }, spec);
        expect([...net.activityFinal!].sort()).toEqual(['F', 'S']);
        // not merged into F: F keeps the terminal role's places only
        expect([...net.final!]).toEqual(['E']);
        // control: without the role the set is null
        expect(compile({ ...CF, terminal: 'C_End' }, spec).activityFinal).toBeNull();
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

describe('declaration defects at compile (lane C1, P-2026-09-26-2340, R-SIM-71)', () => {
    const range = (min: number, max: number) => ({ kind: 'range' as const, min, max });
    const sem = (name: string, metaclass: string | null, domain: StateAttributeDecl['domain'], initial: StateAttributeDecl['initial']): StateAttributeDecl =>
        ({ name, metaclass, space: 'semantic', domain, initial });
    const pres = (name: string, metaclass: string | null, initial: StateAttributeDecl['initial']): StateAttributeDecl =>
        ({ name, metaclass, space: 'presentation', domain: null, initial });
    /** Places A (C_Init, a kind of C_Node) and N (C_Node), and the transition T. */
    const SPEC: Spec = { classes: CLASSES, objects: { A: { cls: 'C_Init' }, N: { cls: 'C_Node' }, T: { cls: 'C_Tr' } } };
    const defectsOf = (decls: StateAttributeDecl[]) => (compile(CF, SPEC, decls).declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.message]);

    it('well-formed declarations compile with no defect (the control of every case below)', () => {
        const net = compile(CF, SPEC, [
            sem('visits', 'C_Node', range(0, 3), 0), sem('f', null, { kind: 'boolean' }, false),
            sem('mode', null, { kind: 'enum', literals: ['A', 'B'] }, 'B'), pres('color', 'C_Tr', 'grey'), sem('neg', null, range(-2, 2), -1),
        ]);
        expect(net.declarationDefects).toEqual([]);
    });

    it('an initial value outside its domain or of the wrong type (mutant 6: 7 in 0..3 accepted)', () => {
        expect(defectsOf([sem('visits', 'C_Node', range(0, 3), 7)])).toEqual([[0, 'visits', 'initial', 'initial 7 outside 0..3']]);
        expect(defectsOf([sem('f', null, { kind: 'boolean' }, 'x')])).toEqual([[0, 'f', 'initial', 'initial x outside {true, false}']]);
        expect(defectsOf([sem('mode', null, { kind: 'enum', literals: ['A', 'B'] }, 'C')])).toEqual([[0, 'mode', 'initial', 'initial C outside {A, B}']]);
        expect(defectsOf([sem('visits', 'C_Node', range(0, 3), 1.5)])).toEqual([[0, 'visits', 'initial', 'initial 1.5 outside 0..3']]);
        // presentation has no domain: any value is its initial
        expect(defectsOf([pres('glow', 'C_Node', 99)])).toEqual([]);
    });

    it('a semantic attribute without a domain', () => {
        expect(defectsOf([sem('visits', 'C_Node', null, 0)])).toEqual([[0, 'visits', 'no-domain', 'semantic without a domain']]);
    });

    it('min above max, and bounds that are not integers', () => {
        expect(defectsOf([sem('inv', null, range(5, 1), 5)])).toEqual([[0, 'inv', 'bounds', 'min 5 > max 1']]);
        expect(defectsOf([sem('half', null, range(0, 2.5), 0)])).toEqual([[0, 'half', 'bounds', 'bounds 0..2.5 are not integers']]);
    });

    it('a reserved name: marked and tokens are the marking\'s (R-SIM-30)', () => {
        expect(defectsOf([sem('tokens', 'C_Node', range(0, 3), 0), pres('marked', 'C_Node', true)]).map(d => d.slice(0, 3)))
            .toEqual([[0, 'tokens', 'reserved'], [1, 'marked', 'reserved']]);
    });

    it('a metaclass that is not in the model any more: the declaration reaches nothing, and says so', () => {
        const net = compile(CF, SPEC, [sem('ghost', 'NoSuchClass', range(0, 3), 0)]);
        expect((net.declarationDefects ?? []).map(d => [d.name, d.code, d.message])).toEqual([['ghost', 'metaclass', 'unknown metaclass']]);
        expect(net.declared.size).toBe(0);
    });

    it('the same name in two spaces on one element (mutant 7): semantic on the places, presentation on their superclass', () => {
        const net = compile(CF, SPEC, [sem('visits', 'C_Init', range(0, 3), 0), pres('visits', 'C_Node', 'x')]);
        expect((net.declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.element])).toEqual([[1, 'visits', 'two-spaces', 'A']]);
        // first wins stays the effect: A semantic, N presentation
        expect(net.declared.get('A')?.get('visits')?.space).toBe('semantic');
        expect(net.declared.get('N')?.get('visits')?.space).toBe('presentation');
        // control: the same pair on disjoint metaclasses meets on no element
        expect(defectsOf([sem('visits', 'C_Init', range(0, 3), 0), pres('visits', 'C_Tr', 'x')])).toEqual([]);
    });

    it('the same name twice on one element through a subclass, in one space: one defect, first wins', () => {
        const decls = [sem('visits', 'C_Node', range(0, 3), 0), sem('visits', 'C_Init', range(0, 9), 5)];
        const net = compile(CF, SPEC, decls);
        expect((net.declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.element])).toEqual([[1, 'visits', 'twice', 'A']]);
        expect(net.declared.get('A')?.get('visits')).toBe(decls[0]);
        expect(net.initial.attrs.get('A')?.get('visits')).toBe(0);
        // two globals of one name meet on the model
        expect(defectsOf([sem('x', null, range(0, 1), 0), sem('x', null, range(0, 1), 1)]).map(d => d.slice(0, 3))).toEqual([[1, 'x', 'twice']]);
    });
});

describe('withDerivedEventRole: the event class is the Trigger\'s declared type (R-SIM-38)', () => {
    /** The metamodel side: the classes, the Trigger candidates and the types they point at. */
    const META: Record<string, any> = {
        C_Ev: { className: 'DClass', name: 'Event', abstract: false, extends: [] },
        C_AbsEv: { className: 'DClass', name: 'AbstractEvent', abstract: true, extends: [] },
        C_Coin: { className: 'DClass', name: 'Coin', abstract: false, extends: ['C_AbsEv'] },
        C_Other: { className: 'DClass', name: 'Other', abstract: false, extends: [] },
        Pointer_ESTRING: { className: 'DClass', name: 'EString', isPrimitive: true, extends: [] },
        E_Kind: { className: 'DEnumerator', name: 'Kind' },
        R_trig: { className: 'DReference', name: 'trigger', type: 'C_Ev' },
        R_abs: { className: 'DReference', name: 'trigger', type: 'C_AbsEv' },
        R_prim: { className: 'DReference', name: 'trigger', type: 'Pointer_ESTRING' },
        R_enum: { className: 'DReference', name: 'trigger', type: 'E_Kind' },
        R_gone: { className: 'DReference', name: 'trigger', type: 'C_Deleted' },
        R_name: { className: 'DReference', name: 'trigger', type: 'Event' },
        R_none: { className: 'DReference', name: 'trigger' },
        A_cls: { className: 'DAttribute', name: 'trigger', type: 'C_Ev' },
    };
    const cf = { simInitial: 'C_Init', simOwnedTransitions: 'R_out', simNextState: 'R_next' };

    it('Trigger unset: no simEvent, and a stale one in the bag is removed (not kept)', () => {
        expect(withDerivedEventRole({ ...cf }, META)).toEqual(cf);
        expect(withDerivedEventRole({ ...cf, simEvent: 'C_Other' }, META)).toEqual(cf);
        expect(withDerivedEventRole({ ...cf, simEvent: 'C_Other', simTrigger: '' }, META)).not.toHaveProperty('simEvent');
        // control: with a Trigger the key is there
        expect(withDerivedEventRole({ ...cf, simTrigger: 'R_trig' }, META)).toHaveProperty('simEvent', 'C_Ev');
    });

    it('Trigger typed to a concrete class: simEvent is that class, over a stale value, the other keys untouched', () => {
        const bag = { ...cf, simTrigger: 'R_trig', simEventIdentifier: 'A_id', simEvent: 'C_Other', layoutHint: 'x' };
        expect(withDerivedEventRole(bag, META)).toEqual({ ...cf, simTrigger: 'R_trig', simEventIdentifier: 'A_id', simEvent: 'C_Ev', layoutHint: 'x' });
        expect(netStcFromRoles(withDerivedEventRole(bag, META))).toMatchObject({ event: 'C_Ev', trigger: 'R_trig', eventIdentifier: 'A_id' });
    });

    it('Trigger typed to an abstract class: the abstract id is returned, and isKindOf reaches the concrete subclass instances', () => {
        const derived = withDerivedEventRole({ ...cf, simTrigger: 'R_abs' }, META);
        expect(derived.simEvent).toBe('C_AbsEv');
        const lookup = { ...META, ...buildLookup({ classes: {}, objects: { coin: { cls: 'C_Coin' }, other: { cls: 'C_Other' } } }) };
        const stc = netStcFromRoles(derived)!;
        expect(eventAlphabet(stc, rawView(lookup), ['coin', 'other']).map(e => e.id)).toEqual(['coin']);
    });

    it('no event role when the Trigger does not resolve: id not in the lookup, not a reference, no type, or a type that is no class', () => {
        for (const trigger of ['R_missing', 'A_cls', 'R_none', 'R_gone', 'R_name', 'R_prim', 'R_enum']) {
            const derived = withDerivedEventRole({ ...cf, simTrigger: trigger, simEvent: 'C_Ev' }, META);
            expect([trigger, derived.simEvent]).toEqual([trigger, undefined]);
            expect([trigger, derived.simTrigger]).toEqual([trigger, trigger]);
            expect(netStcFromRoles(derived)?.event).toBeUndefined();
        }
    });

    it('the input bag is not mutated, with or without a derived class', () => {
        const stale = { ...cf, simEvent: 'C_Other' };
        const typed = { ...cf, simTrigger: 'R_trig', simEvent: 'C_Other' };
        const staleCopy = { ...stale };
        const typedCopy = { ...typed };
        const outStale = withDerivedEventRole(stale, META);
        const outTyped = withDerivedEventRole(typed, META);
        expect(stale).toEqual(staleCopy);
        expect(typed).toEqual(typedCopy);
        // control: the outputs did change, so an unmutated input is not a no-op
        expect(outStale).not.toEqual(stale);
        expect(outTyped).not.toEqual(typed);
    });
});

describe('lane C2: derived declarations at compile and the initial σ (P-2026-09-27-0200, R-SIM-72, R-SIM-73, R-SIM-75)', () => {
    const range = (min: number, max: number) => ({ kind: 'range' as const, min, max });
    const SPEC: Spec = { classes: CLASSES, objects: { A: { cls: 'C_Init' }, N: { cls: 'C_Node' }, T: { cls: 'C_Tr' } } };
    const VISITS: StateAttributeDecl = { name: 'visits', metaclass: 'C_Node', space: 'semantic', domain: range(0, 3), initial: 0 };
    const TOTAL: StateAttributeDecl = { name: 'total', metaclass: null, space: 'semantic', domain: range(0, 6), equation: 'A.[visits] + N.[visits]' };
    const BUSY: StateAttributeDecl = { name: 'busy', metaclass: 'C_Node', space: 'semantic', domain: { kind: 'boolean' }, equation: 'self.[visits] > 0' };
    const GLOW: StateAttributeDecl = { name: 'glow', metaclass: 'C_Node', space: 'presentation', domain: null, equation: 'self.[visits] > 1' };
    const values = (m: ReadonlyMap<string, ReadonlyMap<string, SimValue>> | undefined) =>
        Object.fromEntries([...(m ?? new Map())].map(([e, v]) => [e, Object.fromEntries(v)]));
    /** An oracle answering fixed values and failures, whatever σ. */
    const fixed = (attrs: Record<string, Record<string, SimValue>>, failures: ReturnType<DerivedOracle>['failures'] = []): DerivedOracle => () => ({
        derived: {
            attrs: new Map(Object.entries(attrs).map(([e, v]) => [e, new Map(Object.entries(v))])),
            presentation: new Map(),
        },
        failures,
    });

    it('a derived declaration is declared, with its equation, and puts no stored value in σ; its domain is not checked against an initial', () => {
        const net = compile(CF, SPEC, [VISITS, TOTAL, BUSY, GLOW]);
        expect(net.declarationDefects).toEqual([]);
        expect(net.declared.get('M')?.get('total')).toBe(TOTAL);
        expect(net.declared.get('N')?.get('busy')).toBe(BUSY);
        expect(net.declared.get('A')?.get('glow')).toBe(GLOW);
        expect(values(net.initial.attrs)).toEqual({ A: { visits: 0 }, N: { visits: 0 } });
        expect(net.initial.presentation.size).toBe(0);
        expect(net.initial).not.toHaveProperty('derived');
    });

    it('exclusivity at compile: initial and equation, or neither, is a defect of the declaration, and no stored value', () => {
        const both: StateAttributeDecl = { ...TOTAL, name: 'both', initial: 0 };
        const none: StateAttributeDecl = { name: 'none', metaclass: null, space: 'semantic', domain: range(0, 1) };
        const net = compile(CF, SPEC, [both, none]);
        expect((net.declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.message])).toEqual([
            [0, 'both', 'exclusive', 'initial and equation'], [1, 'none', 'exclusive', 'no initial or equation'],
        ]);
        expect(net.initial.attrs.get('M')).toBeUndefined();
    });

    it('withDerivedInitial: the initial σ carries the oracle\'s values; the equation defects go before the values\' own; the input net is left as it was', () => {
        const net = compile(CF, SPEC, [VISITS, { ...VISITS, name: 'tokens' }, TOTAL]);
        const equation: DeclarationDefect = { index: 2, name: 'total', code: 'parse', message: 'parse error 1:1 x' };
        const out = withDerivedInitial(net, fixed({ M: { total: 2 } }), [equation]);
        expect(values(out.initial.derived?.attrs)).toEqual({ M: { total: 2 } });
        expect(out.initial.attrs).toBe(net.initial.attrs);
        expect(out.initial.marking).toBe(net.initial.marking);
        expect((out.declarationDefects ?? []).map(d => [d.name, d.code])).toEqual([['tokens', 'reserved'], ['total', 'parse']]);
        expect(net.initial).not.toHaveProperty('derived');
        expect((net.declarationDefects ?? []).map(d => d.code)).toEqual(['reserved']);
    });

    it('at Reset a failure is a defect once per declaration, its value absent; a value outside its domain is a defect with the value kept', () => {
        const net = compile(CF, SPEC, [VISITS, TOTAL, BUSY, GLOW]);
        const out = withDerivedInitial(net, fixed({ M: { total: 7 } }, [
            { element: 'A', attr: 'busy', space: 'semantic', detail: 'JjelEvaluationError: boom' },
            { element: 'N', attr: 'busy', space: 'semantic', detail: 'JjelEvaluationError: boom' },
            { element: 'A', attr: 'glow', space: 'presentation', detail: 'the value is null, not a boolean, a number or a string' },
        ]));
        expect((out.declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.message, d.element])).toEqual([
            [2, 'busy', 'derived', 'failed: JjelEvaluationError: boom', 'A'],
            [3, 'glow', 'derived', 'failed: the value is null, not a boolean, a number or a string', 'A'],
            [1, 'total', 'derived', '= 7 outside 0..6', 'M'],
        ]);
        expect(values(out.initial.derived?.attrs)).toEqual({ M: { total: 7 } });
        // control: a value inside the domain is no defect
        expect(withDerivedInitial(net, fixed({ M: { total: 6 } })).declarationDefects).toEqual([]);
    });
});

describe('R-SIM-88: input declarations at compile (P-2026-09-28-0034)', () => {
    const SPEC: Spec = { classes: CLASSES, objects: { A: { cls: 'C_Init' }, N: { cls: 'C_Node' }, T: { cls: 'C_Tr' } } };
    const ASK: StateAttributeDecl = { name: 'ask', metaclass: 'C_Node', space: 'semantic', domain: { kind: 'boolean' }, input: true };
    const ANSWER: StateAttributeDecl = { name: 'answer', metaclass: null, space: 'semantic', domain: { kind: 'range', min: 0, max: 3 }, input: true };

    it('an input is declared on every owner and puts no value in σ, with no defect (mutant: exclusivity of two)', () => {
        const net = compile(CF, SPEC, [ASK, ANSWER]);
        expect(net.declarationDefects).toEqual([]);
        expect(net.declared.get('A')?.get('ask')).toBe(ASK);
        expect(net.declared.get('N')?.get('ask')).toBe(ASK);
        expect(net.declared.get('M')?.get('answer')).toBe(ANSWER);
        expect(net.initial.attrs.size).toBe(0);
    });

    it('an input with an initial or an equation is exclusive and still never in σ; on presentation it is the defect input (mutants: the input stored, presentation accepted)', () => {
        const net = compile(CF, SPEC, [
            { ...ASK, name: 'a1', initial: true }, { ...ASK, name: 'a2', equation: 'true' }, { ...ASK, name: 'a3', space: 'presentation', domain: null },
        ]);
        expect((net.declarationDefects ?? []).map(d => [d.index, d.name, d.code, d.message])).toEqual([
            [0, 'a1', 'exclusive', 'input and initial'], [1, 'a2', 'exclusive', 'input and equation'], [2, 'a3', 'input', 'an input is semantic'],
        ]);
        expect(net.initial.attrs.size).toBe(0);
        expect(net.initial.presentation.size).toBe(0);
    });
});

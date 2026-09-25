/**
 * events — the event role and the M2 roles around the Petri core: step 1 of the
 * plan (R-SIM-16, P-2026-09-23-1850), rewritten when step 3b deleted the boolean
 * step (P-2026-09-25-1103).
 *
 * Executes the core (P11): `eventAlphabet`, `compileNet`, `structuralInputs`,
 * `step`, `roleOverlaps`, `isKindOf`, `classIsKindOf` and the raw slot readers,
 * against fake views and raw lookups. The tests of the boolean step went with it:
 * its deterministic traces are the golden traces of netParity.test.ts, its
 * quirks the decisions pinned there. The `isKindOf` tests moved here from the
 * deleted step.test.ts, with its parity against the IR walk (R-SIM-8).
 *
 * Every "nothing happens" is paired with the same call where something does (P12).
 */

import { describe, it, expect } from 'vitest';
import { overlapVerdict, roleOverlaps, roleWriteVerdict } from '../stcFromRoles';
import { classIsKindOf, isKindOf } from '../isKindOf';
import { objectLabel, objectReferences, objectSlotValues } from '../objectSlots';
import { compileNet, eventAlphabet, netStcFromRoles } from '../netCompile';
import { step, structuralInputs, terminated } from '../netStep';
import type { SimModelView } from '../types';
import type { NetModelView, NetStc, SimState } from '../netTypes';
// Test-only import from the IR (import-free module): the parity check of R-SIM-8.
import { classAncestry } from '../../../components/editor-v2/viewpoint/ir/irReadCtx';

const BAG = { simInitial: 'C_Initial', simTerminal: 'C_Final', simOwnedTransitions: 'R_out', simNextState: 'R_next' };
/** No event role: the alphabet is {ε}. */
const STC: NetStc = netStcFromRoles(BAG)!;
/** The event role declared. */
const STC_EV: NetStc = netStcFromRoles({ ...BAG, simEvent: 'C_Event', simTrigger: 'R_trigger' })!;

interface Fixture {
    /** instance id -> metaclass id and owned transition ids */
    instances: Record<string, { cls: string; out?: string[] }>;
    /** transition id -> target id (null: unset) and trigger event id(s) (absent: none) */
    transitions: Record<string, { to: string | null; on?: string | string[] }>;
    labels?: Record<string, string>;
}

function makeView(f: Fixture): SimModelView {
    return {
        exists: id => id in f.instances || id in f.transitions,
        isInstanceOf: (id, classId) => f.instances[id]?.cls === classId,
        outgoingTransitions: id => [...(f.instances[id]?.out ?? [])],
        transitionTarget: t => f.transitions[t]?.to ?? null,
        label: id => f.labels?.[id] ?? id,
    };
}

/** The same fixture read by pointer, as the compiler reads it. */
function netView(f: Fixture): NetModelView {
    return {
        ...makeView(f),
        references: (o, feature) => {
            if (feature === 'R_out') return [...(f.instances[o]?.out ?? [])];
            if (feature === 'R_next') { const to = f.transitions[o]?.to; return to ? [to] : []; }
            if (feature === 'R_trigger') { const on = f.transitions[o]?.on; return on === undefined ? [] : Array.isArray(on) ? [...on] : [on]; }
            return [];
        },
        values: () => [],
    };
}

function marking(...ids: string[]): SimState {
    return { marking: new Map(ids.map(id => [id, 1])), attrs: new Map(), presentation: new Map() };
}

/**
 * The turnstile of the visual check: Locked -coin-> Unlocked, Unlocked -push-> Locked,
 * Locked -push-> Locked. Final is the terminal metaclass, with one instance used only
 * where a test marks it.
 */
const TURNSTILE: Fixture = {
    instances: {
        Locked: { cls: 'C_Initial', out: ['tCoin', 'tPushL'] },
        Unlocked: { cls: 'C_State', out: ['tPushU'] },
        F: { cls: 'C_Final' },
        coin: { cls: 'C_Event' },
        push: { cls: 'C_Event' },
    },
    transitions: {
        tCoin: { to: 'Unlocked', on: 'coin' },
        tPushU: { to: 'Locked', on: 'push' },
        tPushL: { to: 'Locked', on: 'push' },
    },
    labels: { coin: 'coin', push: 'push' },
};
const TURNSTILE_IDS = [...Object.keys(TURNSTILE.instances), ...Object.keys(TURNSTILE.transitions)];

describe('the event role: all or nothing, and the alphabet (R-SIM-16)', () => {
    it('no event buttons and an empty alphabet without the role, nor with half of it', () => {
        const view = netView(TURNSTILE);
        expect([...structuralInputs(compileNet(STC, view, 'M', TURNSTILE_IDS), marking('Locked')).events]).toEqual([]);
        expect(eventAlphabet(STC, view, ['Locked', 'coin', 'push'])).toEqual([]);
        expect(eventAlphabet({ ...STC_EV, trigger: undefined }, view, ['Locked', 'coin', 'push'])).toEqual([]);
        // control
        expect([...structuralInputs(compileNet(STC_EV, view, 'M', TURNSTILE_IDS), marking('Locked')).events].sort()).toEqual(['coin', 'push']);
        expect(eventAlphabet(STC_EV, view, ['Locked', 'coin', 'push']).map(e => e.id)).toEqual(['coin', 'push']);
    });
});

describe('eventAlphabet', () => {
    it('lists the event instances among the ids, sorted by label, then by id', () => {
        const view = makeView({
            instances: {
                e3: { cls: 'C_Event' }, e1: { cls: 'C_Event' }, e2: { cls: 'C_Event' }, S: { cls: 'C_State' },
            },
            transitions: {},
            labels: { e1: 'push', e2: 'coin', e3: 'coin' },
        });
        expect(eventAlphabet(STC_EV, view, ['S', 'e3', 'e1', 'e2'])).toEqual([
            { id: 'e2', label: 'coin' }, { id: 'e3', label: 'coin' }, { id: 'e1', label: 'push' },
        ]);
        // only the ids given count
        expect(eventAlphabet(STC_EV, view, ['S', 'e1']).map(e => e.id)).toEqual(['e1']);
    });

    it('uses the view label, and the id when the view has none', () => {
        const base = makeView({ instances: { e1: { cls: 'C_Event' } }, transitions: {}, labels: { e1: 'coin' } });
        expect(eventAlphabet(STC_EV, base, ['e1'])).toEqual([{ id: 'e1', label: 'coin' }]);
        const { label: _unused, ...noLabel } = base;
        expect(eventAlphabet(STC_EV, noLabel, ['e1'])).toEqual([{ id: 'e1', label: 'e1' }]);
    });
});

describe('roleOverlaps: the STC roles are disjoint under "is a" (R-SIM-16)', () => {
    const lookup: Record<string, any> = {
        C_Node: { className: 'DClass', extends: [] },
        C_Initial: { className: 'DClass', extends: ['C_Node'] },
        C_Final: { className: 'DClass', extends: ['C_Node'] },
        C_NodeSub: { className: 'DClass', extends: ['C_Node'] },
        C_Deep: { className: 'DClass', extends: ['C_NodeSub'] },
        C_Trans: { className: 'DClass', extends: [] },
        C_Event: { className: 'DClass', extends: [] },
        C_SubEvent: { className: 'DClass', extends: ['C_Event'] },
        C_Both: { className: 'DClass', extends: ['C_Event', 'C_Node'] },
    };
    const disjoint = { simNode: 'C_Node', simInitial: 'C_Initial', simTerminal: 'C_Final', simTransition: 'C_Trans', simEvent: 'C_Event' };
    const concrete = ['C_Initial', 'C_Final', 'C_NodeSub', 'C_Trans', 'C_Event', 'C_SubEvent'];

    it('disjoint roles: no overlap; initial and terminal are nodes, not a sort of their own', () => {
        expect(roleOverlaps(lookup, disjoint, concrete)).toBeNull();
    });

    it('the same class in two sorts, even when it is not among the classes given', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Trans' }, [])).toEqual({ classId: 'C_Trans', sorts: ['transition', 'event'] });
    });

    it('the event class a subclass of the node class, directly or transitively', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_NodeSub' }, concrete)?.sorts).toEqual(['node', 'event']);
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Deep' }, concrete)).toEqual({ classId: 'C_Deep', sorts: ['node', 'event'] });
    });

    it('the overlap names the role class the user picked before any subclass of it', () => {
        // C_Final (terminal, a node) is also a kind of C_Node: both overlap once the event role is C_Node.
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: 'C_Node' }, ['C_Final', ...concrete])?.classId).toBe('C_Node');
    });

    it('the node class a subclass of the event class (the reverse direction)', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simNode: 'C_SubEvent' }, concrete)?.sorts).toEqual(['node', 'event']);
    });

    it('a class inheriting from two sorts through several extends', () => {
        expect(roleOverlaps(lookup, disjoint, [...concrete, 'C_Both'])).toEqual({ classId: 'C_Both', sorts: ['node', 'event'] });
        // control: the same roles without that class among the classes given
        expect(roleOverlaps(lookup, disjoint, concrete)).toBeNull();
    });

    it('run start: without the event role a node/transition overlap is a warning, the run starts', () => {
        const { simEvent, ...noEvent } = disjoint;
        const v = overlapVerdict(lookup, { ...noEvent, simTransition: 'C_NodeSub' }, concrete);
        expect(v).toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: false });
        // simEvent alone is no event role (the trigger is missing): still a warning
        expect(overlapVerdict(lookup, { ...noEvent, simEvent: 'C_Event', simTransition: 'C_NodeSub' }, concrete)?.refuse).toBe(false);
        expect(overlapVerdict(lookup, disjoint, concrete)).toBeNull();
    });

    it('run start: with the event role declared every overlap refuses the run', () => {
        const withRole = { ...disjoint, simTrigger: 'R_trigger' };
        expect(overlapVerdict(lookup, { ...withRole, simTransition: 'C_NodeSub' }, concrete))
            .toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: true });
        expect(overlapVerdict(lookup, { ...withRole, simEvent: 'C_NodeSub' }, concrete)?.refuse).toBe(true);
        expect(overlapVerdict(lookup, withRole, concrete)).toBeNull();
    });

    it('save: judged after the save; without the event role a node/transition overlap is a warning, the save goes through', () => {
        const { simEvent, ...noEvent } = disjoint;
        expect(roleWriteVerdict(lookup, noEvent, 'simTransition', 'C_NodeSub', concrete))
            .toEqual({ overlap: { classId: 'C_NodeSub', sorts: ['node', 'transition'] }, refuse: false });
        // clearing simTrigger on an overlapping metamodel turns the refusal into a warning
        const overlapping = { ...disjoint, simTrigger: 'R_trigger', simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapping, concrete)?.refuse).toBe(true);
        expect(roleWriteVerdict(lookup, overlapping, 'simTrigger', '', concrete)?.refuse).toBe(false);
        // control: a disjoint save has no verdict
        expect(roleWriteVerdict(lookup, noEvent, 'simTransition', 'C_Trans', concrete)).toBeNull();
    });

    it('save: with the event role any overlap refuses, including adding the event role to an overlapping metamodel', () => {
        const withRole = { ...disjoint, simTrigger: 'R_trigger' };
        expect(roleWriteVerdict(lookup, withRole, 'simTransition', 'C_NodeSub', concrete)?.refuse).toBe(true);
        // node and transition already overlap, simEvent set: saving simTrigger adds the event role
        const overlapNoTrigger = { ...disjoint, simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapNoTrigger, concrete)?.refuse).toBe(false);
        expect(roleWriteVerdict(lookup, overlapNoTrigger, 'simTrigger', 'R_trigger', concrete)?.refuse).toBe(true);
    });

    it('unset or empty keys count for nothing', () => {
        expect(roleOverlaps(lookup, { ...disjoint, simEvent: '', simTransition: undefined }, [...concrete, 'C_Both'])).toBeNull();
    });

    it('fork and join are nodes: fork and join classes extending the node class are no overlap (step 3b)', () => {
        const withFork = { ...lookup, C_Fork: { className: 'DClass', extends: ['C_Node'] }, C_Join: { className: 'DClass', extends: ['C_Node'] } };
        expect(roleOverlaps(withFork, { ...disjoint, simFork: 'C_Fork', simJoin: 'C_Join' }, [...concrete, 'C_Fork', 'C_Join'])).toBeNull();
        // control: a fork class that is the transition class overlaps
        expect(roleOverlaps(withFork, { ...disjoint, simFork: 'C_Trans' }, concrete)).toEqual({ classId: 'C_Trans', sorts: ['node', 'transition'] });
    });

    it('arcs are a sort of their own; an inhibitor arc class extending the arc class is no overlap (step 3b)', () => {
        const withArcs = { ...lookup, C_Arc: { className: 'DClass', extends: [] }, C_Inh: { className: 'DClass', extends: ['C_Arc'] } };
        expect(roleOverlaps(withArcs, { ...disjoint, simArc: 'C_Arc', simInhibitorArc: 'C_Inh' }, [...concrete, 'C_Arc', 'C_Inh'])).toBeNull();
        // control: an arc class that is the transition class overlaps
        expect(roleOverlaps(withArcs, { ...disjoint, simArc: 'C_Trans' }, concrete)).toEqual({ classId: 'C_Trans', sorts: ['transition', 'arc'] });
    });

    it('the Petri shape refuses any overlap, as the event role does; control flow without events still warns (R-SIM-37)', () => {
        const { simEvent, ...noEvent } = disjoint;
        const overlapping = { ...noEvent, simTransition: 'C_NodeSub' };
        expect(overlapVerdict(lookup, overlapping, concrete)?.refuse).toBe(false);
        expect(overlapVerdict(lookup, { ...overlapping, simArc: 'C_Arc' }, concrete)?.refuse).toBe(true);
        expect(roleWriteVerdict(lookup, overlapping, 'simArc', 'C_Arc', concrete)?.refuse).toBe(true);
        // control: clearing the arc role turns the refusal back into a warning
        expect(roleWriteVerdict(lookup, { ...overlapping, simArc: 'C_Arc' }, 'simArc', '', concrete)?.refuse).toBe(false);
    });

    it('classIsKindOf walks from a class, transitively, never downwards; isKindOf agrees through the instance', () => {
        expect(classIsKindOf(lookup, 'C_Deep', 'C_Node')).toBe(true);
        expect(classIsKindOf(lookup, 'C_Node', 'C_Deep')).toBe(false);
        expect(classIsKindOf(lookup, 'C_Both', 'C_Event')).toBe(true);
        const withObject = { ...lookup, o: { className: 'DObject', instanceof: 'C_Deep' } };
        expect(isKindOf(withObject, 'o', 'C_Node')).toBe(classIsKindOf(withObject, 'C_Deep', 'C_Node'));
    });
});

describe('raw slot readers, by the feature pointer', () => {
    // Shape measured on the live editor (P-2026-09-23-1850, _tmp_sim1_verify.ts): a DObject lists
    // its DValue ids in `features`; each DValue's `instanceof` is the DECLARING feature, which for
    // an inherited attribute is the superclass's DAttribute. A never-set reference holds [null].
    const lookup: Record<string, any> = {
        A_label: { className: 'DAttribute', name: 'label' },
        A_name: { className: 'DAttribute', name: 'name' },
        A_count: { className: 'DAttribute', name: 'count' },
        R_trigger: { className: 'DReference', name: 'trigger' },
        coin: { className: 'DObject', features: ['v_coin_label', 'v_coin_name'] },
        v_coin_label: { className: 'DValue', instanceof: 'A_label', values: ['Coin'] },
        v_coin_name: { className: 'DValue', instanceof: 'A_name', values: ['coinName'] },
        push: { className: 'DObject', features: ['v_push_label', 'v_push_name'] },
        v_push_label: { className: 'DValue', instanceof: 'A_label', values: ['  '] },
        // DValue.name kept stale on purpose: the `name` feature is found by the declaring feature's name
        v_push_name: { className: 'DValue', name: 'oldName', instanceof: 'A_name', values: ['push'] },
        Pointer1790195771751_USER_128: { className: 'DObject', features: ['v_bare_label', 'v_bare_count'] },
        v_bare_label: { className: 'DValue', instanceof: 'A_label', values: [] },
        v_bare_count: { className: 'DValue', instanceof: 'A_count', values: [0] },
        t1: { className: 'DObject', features: ['v_t1_trigger'] },
        v_t1_trigger: { className: 'DValue', instanceof: 'R_trigger', values: ['coin', 'push'] },
        t2: { className: 'DObject', features: ['v_t2_trigger'] },
        v_t2_trigger: { className: 'DValue', instanceof: 'R_trigger', values: [null] },
    };

    it('objectSlotValues drops null and undefined, keeps 0, answers [] for a missing slot or object', () => {
        expect(objectSlotValues(lookup, 't1', 'R_trigger')).toEqual(['coin', 'push']);
        expect(objectSlotValues(lookup, 't2', 'R_trigger')).toEqual([]);
        expect(objectSlotValues(lookup, 'Pointer1790195771751_USER_128', 'A_count')).toEqual([0]);
        expect(objectSlotValues(lookup, 't1', 'A_label')).toEqual([]);
        expect(objectSlotValues(lookup, 'nobody', 'R_trigger')).toEqual([]);
    });

    it('objectReferences: every id in slot order, [] for a never-set reference', () => {
        expect(objectReferences(lookup, 't1', 'R_trigger')).toEqual(['coin', 'push']);
        expect(objectReferences(lookup, 't2', 'R_trigger')).toEqual([]);
    });

    it('objectLabel: identifier, else the name feature, else a shortened id', () => {
        expect(objectLabel(lookup, 'coin', 'A_label')).toBe('Coin');
        expect(objectLabel(lookup, 'coin')).toBe('coinName');
        expect(objectLabel(lookup, 'push', 'A_label')).toBe('push');
        expect(objectLabel(lookup, 'Pointer1790195771751_USER_128', 'A_label')).toBe('…_128');
        expect(objectLabel(lookup, 'Pointer1790195771751_USER_128', 'A_count')).toBe('0');
    });

    it('end to end over the raw lookup, with a view built as the panel adapter builds it', () => {
        const raw: Record<string, any> = {
            ...lookup,
            C_Event: { className: 'DClass', extends: [] },
            C_SubEvent: { className: 'DClass', extends: ['C_Event'] },
            C_State: { className: 'DClass', extends: [] },
            ev1: { className: 'DObject', instanceof: 'C_SubEvent', features: ['v_ev1_label'] },
            v_ev1_label: { className: 'DValue', instanceof: 'A_label', values: ['go'] },
            S: { className: 'DObject', instanceof: 'C_State', features: ['v_S_out'] },
            v_S_out: { className: 'DValue', instanceof: 'R_out', values: ['tr'] },
            T: { className: 'DObject', instanceof: 'C_State', features: [] },
            tr: { className: 'DObject', instanceof: 'C_Trans', features: ['v_tr_next', 'v_tr_trigger'] },
            v_tr_next: { className: 'DValue', instanceof: 'R_next', values: ['T'] },
            v_tr_trigger: { className: 'DValue', instanceof: 'R_trigger', values: ['ev1'] },
        };
        const stc = netStcFromRoles({ simInitial: 'C_State', simOwnedTransitions: 'R_out', simNextState: 'R_next', simEvent: 'C_Event', simTrigger: 'R_trigger', simEventIdentifier: 'A_label' })!;
        const view: NetModelView = {
            exists: id => !!raw[id],
            isInstanceOf: (id, classId) => isKindOf(raw, id, classId),
            outgoingTransitions: () => [],
            transitionTarget: () => null,
            references: (o, f) => objectReferences(raw, o, f),
            values: (o, f) => objectSlotValues(raw, o, f),
            label: id => objectLabel(raw, id, stc.eventIdentifier),
        };
        const ids = ['S', 'T', 'ev1', 'tr'];
        expect(eventAlphabet(stc, view, ids)).toEqual([{ id: 'ev1', label: 'go' }]);
        const net = compileNet(stc, view, 'M', ids);
        expect([...structuralInputs(net, marking('S')).events]).toEqual(['ev1']);
        const out = step(net, { state: marking('S'), event: 'ev1' }, 'tr', () => ({ kind: 'true' }), () => ({ kind: 'ok', assignments: [] }));
        expect(out.kind === 'fired' && [...out.next.state.marking.keys()]).toEqual(['T']);
    });
});

describe('isKindOf — one notion of "is a" (R-SIM-8)', () => {
    // Raw D-layer shape: DObject.instanceof -> DClass id, DClass.extends -> DClass ids.
    const lookup: Record<string, any> = {
        C_Node: { className: 'DClass', name: 'Node', extends: [] },
        C_Initial: { className: 'DClass', name: 'Initial', extends: ['C_Node'] },
        C_SubInitial: { className: 'DClass', name: 'SubInitial', extends: ['C_Initial'] },
        C_Final: { className: 'DClass', name: 'Final', extends: ['C_Node'] },
        C_SubFinal: { className: 'DClass', name: 'SubFinal', extends: ['C_Final'] },
        C_LoopA: { className: 'DClass', name: 'LoopA', extends: ['C_LoopB'] },
        C_LoopB: { className: 'DClass', name: 'LoopB', extends: ['C_LoopA'] },
        I: { className: 'DObject', instanceof: 'C_Initial', out: [] },
        SubI: { className: 'DObject', instanceof: 'C_SubInitial', out: ['t1'] },
        N: { className: 'DObject', instanceof: 'C_Node', out: [] },
        SubF: { className: 'DObject', instanceof: 'C_SubFinal', out: [] },
        A: { className: 'DObject', instanceof: 'C_Node', out: ['t2'] },
        Loop: { className: 'DObject', instanceof: 'C_LoopA' },
        Orphan: { className: 'DObject', instanceof: 'C_Deleted' },
        t1: { className: 'DObject', instanceof: 'C_T', next: 'A' },
        t2: { className: 'DObject', instanceof: 'C_T', next: 'SubF' },
    };
    // Built exactly as the panel's adapter builds `isInstanceOf`.
    const view: SimModelView = {
        exists: id => !!lookup[id],
        isInstanceOf: (id, classId) => isKindOf(lookup, id, classId),
        outgoingTransitions: id => [...(lookup[id]?.out ?? [])],
        transitionTarget: t => lookup[t]?.next ?? null,
    };
    /** The same lookup read by pointer, as the compiler reads it: `out` is R_out, `next` is R_next. */
    const netOver = (v: SimModelView): NetModelView => ({
        ...v,
        references: (o, f) => (f === 'R_out' ? [...(lookup[o]?.out ?? [])] : f === 'R_next' && lookup[o]?.next ? [lookup[o].next] : []),
        values: () => [],
    });

    it('a subclass of the initial metaclass is initial: one token on it at Reset (compileNet)', () => {
        expect([...compileNet(STC, netOver(view), 'M', ['N', 'SubI', 'A']).initial.marking.keys()]).toEqual(['SubI']);
        // control: the superclass is not initial
        expect([...compileNet(STC, netOver(view), 'M', ['N', 'A']).initial.marking.keys()]).toEqual([]);
    });

    it('a subclass of the terminal metaclass is final, and a marking of it alone is terminated (R-SIM-27)', () => {
        const net = compileNet(STC, netOver(view), 'M', ['SubF', 'A']);
        expect([...(net.final ?? [])]).toEqual(['SubF']);
        expect(terminated(net, marking('SubF'))).toBe(true);
        // controls: another token besides, or no terminal role
        expect(terminated(net, marking('SubF', 'A'))).toBe(false);
        expect(terminated(compileNet({ ...STC, terminal: undefined }, netOver(view), 'M', ['SubF', 'A']), marking('SubF'))).toBe(false);
    });

    it('matches the class itself, walks transitively, never downwards', () => {
        expect(isKindOf(lookup, 'I', 'C_Initial')).toBe(true);
        expect(isKindOf(lookup, 'SubI', 'C_Node')).toBe(true);
        expect(isKindOf(lookup, 'I', 'C_SubInitial')).toBe(false);
        expect(isKindOf(lookup, 'N', 'C_Initial')).toBe(false);
    });

    it('terminates on a cycle in extends, and answers false for unknown objects', () => {
        expect(isKindOf(lookup, 'Loop', 'C_LoopB')).toBe(true);
        expect(isKindOf(lookup, 'Loop', 'C_Node')).toBe(false);
        expect(isKindOf(lookup, 'Nobody', 'C_Node')).toBe(false);
    });

    it('keeps the exact-id match of a metaclass no longer in the lookup', () => {
        expect(isKindOf(lookup, 'Orphan', 'C_Deleted')).toBe(true);
        expect(isKindOf(lookup, 'Orphan', 'C_Node')).toBe(false);
    });

    it('agrees with the IR ancestry walk (classAncestry) on every existing class', () => {
        const classes = Object.keys(lookup).filter(id => lookup[id].className === 'DClass');
        const objects = Object.keys(lookup).filter(id => lookup[id].className === 'DObject' && lookup[lookup[id].instanceof]);
        let compared = 0;
        for (const o of objects) {
            const ancestors = classAncestry(lookup, lookup[o].instanceof).map(a => a.id);
            for (const c of classes) {
                expect(isKindOf(lookup, o, c)).toBe(ancestors.includes(c));
                compared++;
            }
        }
        expect(compared).toBeGreaterThan(20);
    });
});

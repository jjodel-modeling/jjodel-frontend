/**
 * irMembership (R-GV-8, spec addendum 2026-10-10 §6, P-2026-10-10-0105 S3): the drop target, the plan of a drop from the
 * two containers' membership modes, and the slots it writes, read off a literal D-layer. Pure.
 */
import { describe, it, expect } from 'vitest';
import {
    compositionSlotFor, compositionSlotHolding, containedInSlot, createOwnerSlotOf, isRootFathered, nextValues, ownerSlotForNewObject,
    planDrop, resolveDropTarget, slotAccepts, slotRefOf, terminalSlotOf, type DropCandidate, type DropInput, type MembershipEnd, type SlotRef,
} from '../irMembership';

const box = (x: number, y: number, w: number, h: number) => ({ x, y, w, h });

describe('resolveDropTarget', () => {
    const pool: DropCandidate = { containerId: 'pool', box: box(100, 100, 900, 360), depth: 0, order: 0 };
    const sales: DropCandidate = { containerId: 'sales', box: box(130, 100, 870, 180), depth: 1, order: 1 };
    const wh: DropCandidate = { containerId: 'wh', box: box(130, 280, 870, 180), depth: 1, order: 2 };
    const all = [pool, sales, wh];
    const yes = () => true;
    it('takes the deepest container under the point', () => {
        expect(resolveDropTarget({ x: 500, y: 150 }, all, yes, new Set())).toBe('sales');
        expect(resolveDropTarget({ x: 500, y: 300 }, all, yes, new Set())).toBe('wh');
    });
    it('falls back to an outer container when the inner ones do not accept, and to none outside', () => {
        expect(resolveDropTarget({ x: 500, y: 150 }, all, id => id === 'pool', new Set())).toBe('pool');
        expect(resolveDropTarget({ x: 115, y: 150 }, all, yes, new Set())).toBe('pool');
        expect(resolveDropTarget({ x: 50, y: 50 }, all, yes, new Set())).toBeNull();
        expect(resolveDropTarget({ x: 500, y: 150 }, all, () => false, new Set())).toBeNull();
    });
    it('holds the edges of a box, and skips the excluded object and its descendants', () => {
        expect(resolveDropTarget({ x: 130, y: 280 }, all, yes, new Set())).toBe('sales');
        expect(resolveDropTarget({ x: 1000, y: 460 }, all, yes, new Set())).toBe('wh');
        expect(resolveDropTarget({ x: 500, y: 150 }, all, yes, new Set(['sales']))).toBe('pool');
    });
    it('on a depth tie takes the smaller box, then the first in canvas order', () => {
        const big: DropCandidate = { containerId: 'big', box: box(0, 0, 1000, 1000), depth: 1, order: 0 };
        const small: DropCandidate = { containerId: 'small', box: box(10, 10, 100, 100), depth: 1, order: 5 };
        expect(resolveDropTarget({ x: 50, y: 50 }, [big, small], yes, new Set())).toBe('small');
        const twinA: DropCandidate = { containerId: 'a', box: box(0, 0, 100, 100), depth: 1, order: 3 };
        const twinB: DropCandidate = { containerId: 'b', box: box(0, 0, 100, 100), depth: 1, order: 1 };
        expect(resolveDropTarget({ x: 50, y: 50 }, [twinA, twinB], yes, new Set())).toBe('b');
        expect(resolveDropTarget({ x: 50, y: 50 }, [twinB, twinA], yes, new Set())).toBe('b');
    });
});

const slot = (ownerId: string, feature: string, slotId: string, containment = false): SlotRef => ({ ownerId, feature, slotId, containment });
const lane = (id: string, over: Partial<MembershipEnd> = {}): MembershipEnd => ({
    containerId: id, mode: 'reference', terminal: slot(id, 'flowNodeRefs', `s_${id}`), createOwner: slot('proc', 'flowElements', 's_fe', true), ...over,
});
const input = (over: Partial<DropInput>): DropInput => ({
    objectId: 't', source: null, target: null, containedIn: slot('proc', 'flowElements', 's_fe', true), rootFather: false, ...over,
});

describe('planDrop', () => {
    it('moves when source and target are the same container, or both none', () => {
        expect(planDrop(input({ source: lane('A'), target: lane('A') }))).toEqual({ kind: 'move' });
        expect(planDrop(input({}))).toEqual({ kind: 'move' });
    });
    it('reference to reference in the same process: out of one list, into the other, containment untouched', () => {
        expect(planDrop(input({ source: lane('A'), target: lane('B') }))).toEqual({ kind: 'edit', ops: [
            { op: 'remove', slot: slot('A', 'flowNodeRefs', 's_A'), value: 't' },
            { op: 'append', slot: slot('B', 'flowNodeRefs', 's_B'), value: 't' },
        ] });
    });
    it('into a lane of another process: the containment moves to the lane\'s creation owner too', () => {
        const target = lane('B', { createOwner: slot('proc2', 'flowElements', 's_fe2', true) });
        expect(planDrop(input({ source: lane('A'), target }))).toEqual({ kind: 'edit', ops: [
            { op: 'remove', slot: slot('A', 'flowNodeRefs', 's_A'), value: 't' },
            { op: 'append', slot: slot('B', 'flowNodeRefs', 's_B'), value: 't' },
            { op: 'append', slot: slot('proc2', 'flowElements', 's_fe2', true), value: 't' },
        ] });
    });
    it('a pure root is removed from its old composition slot explicitly; a DValue father is not (auto-detach)', () => {
        const target = lane('B', { createOwner: slot('proc2', 'flowElements', 's_fe2', true) });
        const ops = (planDrop(input({ source: lane('A'), target, rootFather: true })) as any).ops;
        expect(ops).toContainEqual({ op: 'remove', slot: slot('proc', 'flowElements', 's_fe', true), value: 't' });
        const opsD = (planDrop(input({ source: lane('A'), target, rootFather: false })) as any).ops;
        expect(opsD).not.toContainEqual({ op: 'remove', slot: slot('proc', 'flowElements', 's_fe', true), value: 't' });
    });
    it('forbid on either side snaps back', () => {
        expect(planDrop(input({ source: lane('A', { mode: 'forbid' }), target: lane('B') }))).toEqual({ kind: 'snapBack', reason: 'forbid' });
        expect(planDrop(input({ source: lane('A'), target: lane('B', { mode: 'forbid' }) }))).toEqual({ kind: 'snapBack', reason: 'forbid' });
        expect(planDrop(input({ source: null, target: lane('B', { mode: 'forbid' }) }))).toEqual({ kind: 'snapBack', reason: 'forbid' });
    });
    it('outside every accepting container: snaps back unless the source mode is none', () => {
        expect(planDrop(input({ source: lane('A') }))).toEqual({ kind: 'snapBack', reason: 'outside' });
        expect(planDrop(input({ source: lane('A', { mode: 'reparent' }) }))).toEqual({ kind: 'snapBack', reason: 'outside' });
        expect(planDrop(input({ source: lane('A', { mode: 'none' }) }))).toEqual({ kind: 'move' });
    });
    it('into a container whose mode is none: snaps back from a membership source, moves from a none one', () => {
        expect(planDrop(input({ source: lane('A'), target: lane('B', { mode: 'none' }) }))).toEqual({ kind: 'snapBack', reason: 'not-membership' });
        expect(planDrop(input({ source: lane('A', { mode: 'none' }), target: lane('B', { mode: 'none' }) }))).toEqual({ kind: 'move' });
        expect(planDrop(input({ source: null, target: lane('B', { mode: 'none' }) }))).toEqual({ kind: 'move' });
    });
    it('from no container into a reference lane: only the append, and the containment when it is elsewhere', () => {
        expect(planDrop(input({ source: null, target: lane('B') }))).toEqual({ kind: 'edit', ops: [
            { op: 'append', slot: slot('B', 'flowNodeRefs', 's_B'), value: 't' },
        ] });
    });
    it('a none source does not remove anything', () => {
        expect(planDrop(input({ source: lane('A', { mode: 'none' }), target: lane('B') }))).toEqual({ kind: 'edit', ops: [
            { op: 'append', slot: slot('B', 'flowNodeRefs', 's_B'), value: 't' },
        ] });
    });
    it('reparent target: the containment moves into its terminal slot; a non-containment terminal snaps back', () => {
        const pool = (id: string, s: string): MembershipEnd => ({ containerId: id, mode: 'reparent', terminal: slot(`p_${id}`, 'flowElements', s, true), createOwner: null });
        expect(planDrop(input({ source: pool('X', 's_fe'), target: pool('Y', 's_y') }))).toEqual({ kind: 'edit', ops: [
            { op: 'append', slot: slot('p_Y', 'flowElements', 's_y', true), value: 't' },
        ] });
        expect(planDrop(input({ source: pool('X', 's_fe'), target: { ...pool('Y', 's_y'), terminal: slot('Y', 'refs', 's_r') } })))
            .toEqual({ kind: 'snapBack', reason: 'no-slot' });
    });
    it('a reparent source dropped where the containment would not move snaps back', () => {
        const source: MembershipEnd = { containerId: 'X', mode: 'reparent', terminal: slot('p', 'flowElements', 's_fe', true), createOwner: null };
        expect(planDrop(input({ source, target: lane('B', { createOwner: null }) }))).toEqual({ kind: 'snapBack', reason: 'uncontained' });
        // Already contained by the lane's owner: the containment stays, which is enough.
        expect(planDrop(input({ source, target: lane('B') })).kind).toBe('edit');
    });
    it('a missing terminal slot snaps back', () => {
        expect(planDrop(input({ source: lane('A', { terminal: null }), target: lane('B') }))).toEqual({ kind: 'snapBack', reason: 'no-slot' });
        expect(planDrop(input({ source: lane('A'), target: lane('B', { terminal: null }) }))).toEqual({ kind: 'snapBack', reason: 'no-slot' });
    });
});

/** A small BPMN D-layer: two processes, a LaneSet with two lanes, tasks; one task a pure root. */
function world() {
    const idlookup: Record<string, any> = {
        M: { id: 'M', className: 'DModel' },
        C_Process: { id: 'C_Process', name: 'Process', extends: ['C_Callable'] }, C_Callable: { id: 'C_Callable', name: 'CallableElement', extends: [] },
        C_LaneSet: { id: 'C_LaneSet', name: 'LaneSet', extends: [] },
        C_Lane: { id: 'C_Lane', name: 'Lane', extends: [] }, C_Pool: { id: 'C_Pool', name: 'Participant', extends: [] },
        C_FE: { id: 'C_FE', name: 'FlowElement', extends: [] }, C_FN: { id: 'C_FN', name: 'FlowNode', extends: ['C_FE'] },
        C_Task: { id: 'C_Task', name: 'Task', extends: ['C_FN'] }, C_Other: { id: 'C_Other', name: 'Other', extends: [] },
        R_fe: { id: 'R_fe', name: 'flowElements', className: 'DReference', composition: true, type: 'C_FE' },
        R_ls: { id: 'R_ls', name: 'laneSets', className: 'DReference', composition: true, type: 'C_LaneSet' },
        R_lanes: { id: 'R_lanes', name: 'lanes', className: 'DReference', composition: true, type: 'C_Lane' },
        R_refs: { id: 'R_refs', name: 'flowNodeRefs', className: 'DReference', composition: false, type: 'C_FN' },
        R_pref: { id: 'R_pref', name: 'processRef', className: 'DReference', composition: false, type: 'C_Process' },
        R_free: { id: 'R_free', name: 'anything', className: 'DReference', composition: false },
        proc: { id: 'proc', instanceof: 'C_Process', father: 'M', features: ['s_fe', 's_ls'] },
        s_fe: { id: 's_fe', instanceof: 'R_fe', values: ['t1', 't2'] }, s_ls: { id: 's_ls', instanceof: 'R_ls', values: ['ls'] },
        ls: { id: 'ls', instanceof: 'C_LaneSet', father: 's_ls', features: ['s_lanes'] },
        s_lanes: { id: 's_lanes', instanceof: 'R_lanes', values: ['L1', 'L2'] },
        L1: { id: 'L1', instanceof: 'C_Lane', father: 's_lanes', features: ['s_L1', 's_any'] }, s_L1: { id: 's_L1', instanceof: 'R_refs', values: ['t1'] },
        s_any: { id: 's_any', instanceof: 'R_free', values: [] },
        L2: { id: 'L2', instanceof: 'C_Lane', father: 's_lanes', features: ['s_L2'] }, s_L2: { id: 's_L2', instanceof: 'R_refs', values: ['t2'] },
        pool: { id: 'pool', instanceof: 'C_Pool', father: 'M', features: ['s_pref'] }, s_pref: { id: 's_pref', instanceof: 'R_pref', values: ['proc'] },
        t1: { id: 't1', instanceof: 'C_Task', father: 's_fe', features: [] }, t2: { id: 't2', instanceof: 'C_Task', father: 'M', features: [] },
        o1: { id: 'o1', instanceof: 'C_Other', father: 'M', features: [] },
    };
    const containerOf = new Map([['ls', 'proc'], ['L1', 'ls'], ['L2', 'ls'], ['t1', 'proc'], ['t2', 'proc']]);
    return { idlookup, containerOf };
}

describe('the slots of a drop, read off the D-layer', () => {
    it('slotRefOf reads the slot and its containment flag', () => {
        const { idlookup } = world();
        expect(slotRefOf(idlookup, 'proc', 'flowElements')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(slotRefOf(idlookup, 'L1', 'flowNodeRefs')).toEqual(slot('L1', 'flowNodeRefs', 's_L1', false));
        expect(slotRefOf(idlookup, 'L1', 'nope')).toBeNull();
    });
    it('terminalSlotOf follows the hops of a declared channel to its last slot', () => {
        const { idlookup } = world();
        const steps = [{ feature: 'processRef', take: 'value' as const }, { feature: 'flowElements', take: 'values' as const }];
        expect(terminalSlotOf(idlookup, 'pool', steps)).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(terminalSlotOf(idlookup, 'L1', [{ feature: 'flowNodeRefs', take: 'values' }])).toEqual(slot('L1', 'flowNodeRefs', 's_L1'));
        expect(terminalSlotOf(idlookup, 'L1', [{ feature: 'processRef', take: 'value' }, { feature: 'flowElements', take: 'values' }])).toBeNull();
        expect(terminalSlotOf(idlookup, 'pool', [])).toBeNull();
    });
    it('compositionSlotHolding and containedInSlot find the composition slot that lists an object', () => {
        const { idlookup, containerOf } = world();
        expect(compositionSlotHolding(idlookup, 'proc', 't2')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(compositionSlotHolding(idlookup, 'proc', 'L1')).toBeNull();
        expect(compositionSlotHolding(idlookup, 'L1', 't1')).toBeNull();
        expect(containedInSlot(idlookup, containerOf, 't1')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(containedInSlot(idlookup, containerOf, 'pool')).toBeNull();
    });
    it('createOwnerSlotOf climbs the composition chain to the nearest ancestor of the owner kind', () => {
        const { idlookup, containerOf } = world();
        expect(createOwnerSlotOf(idlookup, containerOf, 'L1', { ownerKind: 'Process', feature: 'flowElements' })).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(createOwnerSlotOf(idlookup, containerOf, 'L1', { ownerKind: 'LaneSet', feature: 'lanes' })).toEqual(slot('ls', 'lanes', 's_lanes', true));
        // The kind matches by ancestry: a Process is a CallableElement.
        expect(createOwnerSlotOf(idlookup, containerOf, 'L1', { ownerKind: 'CallableElement', feature: 'flowElements' })).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(createOwnerSlotOf(idlookup, containerOf, 'L1', { ownerKind: 'Pool', feature: 'x' })).toBeNull();
        expect(createOwnerSlotOf(idlookup, containerOf, 'L1', { ownerKind: 'Process', feature: 'nope' })).toBeNull();
        // The container itself is not its own owner, even when it has the kind.
        expect(createOwnerSlotOf(idlookup, containerOf, 'proc', { ownerKind: 'Process', feature: 'flowElements' })).toBeNull();
    });
    it('slotAccepts checks the class against the feature type, by ancestry; an untyped feature takes anything', () => {
        const { idlookup } = world();
        const fe = slot('proc', 'flowElements', 's_fe', true);
        expect(slotAccepts(idlookup, fe, 'C_Task')).toBe(true);
        expect(slotAccepts(idlookup, fe, 'C_Other')).toBe(false);
        expect(slotAccepts(idlookup, slot('L1', 'flowNodeRefs', 's_L1'), 'C_FE')).toBe(false);
        expect(slotAccepts(idlookup, slot('L1', 'anything', 's_any'), 'C_Other')).toBe(true);
        expect(slotAccepts(idlookup, { ownerId: 'proc', feature: 'flowElements', slotId: null, containment: true }, 'C_Task')).toBe(true);
    });
    it('isRootFathered tells a pure root from an object fathered by a slot', () => {
        const { idlookup } = world();
        expect(isRootFathered(idlookup, 't2')).toBe(true);
        expect(isRootFathered(idlookup, 't1')).toBe(false);
        expect(isRootFathered(idlookup, 'ghost')).toBe(false);
    });
    it('nextValues appends once, removes what is there, and reports a no-op as null', () => {
        const s = slot('L1', 'flowNodeRefs', 's_L1');
        expect(nextValues(['t1', undefined, ''], { op: 'append', slot: s, value: 't2' })).toEqual(['t1', 't2']);
        expect(nextValues(['t1'], { op: 'append', slot: s, value: 't1' })).toBeNull();
        expect(nextValues(['t1', 't2'], { op: 'remove', slot: s, value: 't1' })).toEqual(['t2']);
        expect(nextValues(['t2'], { op: 'remove', slot: s, value: 't1' })).toBeNull();
    });
});

describe('owner slots for a reparent or a creation', () => {
    it('compositionSlotFor takes the first composition slot whose type accepts the class', () => {
        const { idlookup } = world();
        expect(compositionSlotFor(idlookup, 'proc', 'C_Task')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(compositionSlotFor(idlookup, 'proc', 'C_LaneSet')).toEqual(slot('proc', 'laneSets', 's_ls', true));
        expect(compositionSlotFor(idlookup, 'proc', 'C_Other')).toBeNull();
        expect(compositionSlotFor(idlookup, 'L1', 'C_Task')).toBeNull();
    });
    it('ownerSlotForNewObject climbs the visual parents to a creation owner, or a reparent channel terminal', () => {
        const { idlookup, containerOf } = world();
        const create = { mode: 'reference' as const, create: { ownerKind: 'Process', feature: 'flowElements' } };
        const model = {
            containers: new Map<string, any>([['L1', { membership: create }], ['pool', { membership: { mode: 'reparent' },
                channelSteps: [{ feature: 'processRef', take: 'value' }, { feature: 'flowElements', take: 'values' }] }]]),
            parentOf: new Map([['t1', 'L1'], ['t2', 'pool'], ['o1', 'nowhere']]),
            containerOf,
        };
        expect(ownerSlotForNewObject(idlookup, model, 't1')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(ownerSlotForNewObject(idlookup, model, 't2')).toEqual(slot('proc', 'flowElements', 's_fe', true));
        expect(ownerSlotForNewObject(idlookup, model, 'o1')).toBeNull();
        expect(ownerSlotForNewObject(idlookup, model, 'proc')).toBeNull();
        // A container in the chain with neither keeps climbing: L1 under a plain container.
        const plain = { ...model, containers: new Map<string, any>([['L1', {}], ['ls', { membership: create }]]), parentOf: new Map([['t1', 'L1'], ['L1', 'ls']]) };
        expect(ownerSlotForNewObject(idlookup, plain, 't1')).toEqual(slot('proc', 'flowElements', 's_fe', true));
    });
});

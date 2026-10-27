/**
 * containmentToProblems (R-GV-2, P-2026-10-10-0105 S2): the multiply-claimed and unclaimed objects of a containment
 * model as NodeProblems, and the reconcile that writes only a changed set.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { containmentProblemsOf, reconcileContainmentProblems, resetContainmentProblemSignatures } from '../containmentToProblems';
import { getNodeProblemsSnapshot, getProblemIdsOwnedBy, subscribe } from '../registry';

const model = (over: Partial<{ multiClaimed: Map<string, string[]>; unclaimed: Set<string>; parentOf: Map<string, string> }> = {}) => ({
    multiClaimed: new Map([['t1', ['L1', 'L2']]]),
    unclaimed: new Set(['t3']),
    parentOf: new Map([['t1', 'L1']]),
    vertexByObj: new Map([['t1', 'Vt1'], ['t3', 'Vt3'], ['L1', 'VL1'], ['L2', 'VL2']]),
    ...over,
});
const names: Record<string, string> = { t1: 'Check order', t3: 'Pack', L1: 'Sales', L2: 'Warehouse' };
const nameOf = (id: string) => names[id] ?? '';

describe('containmentProblemsOf', () => {
    it('one warning per multiply-claimed node, naming every claimant and the one that draws it', () => {
        const [multi] = containmentProblemsOf(model(), nameOf, 'G1', 7);
        expect(multi).toEqual({
            id: 'containment:multi:Vt1', nodeId: 'Vt1', kind: 'containment', severity: 'warning',
            title: 'Claimed by 2 containers',
            description: '«Check order» is listed by «Sales», «Warehouse»; it is drawn inside «Sales», the innermost (R-GV-2).',
            relatedNodeIds: ['VL1', 'VL2'], ownerModelId: 'G1', createdAt: 7,
        });
    });
    it('says so when no claimant draws the node (a broken cycle), and names an object by its id when it has no name', () => {
        const [multi] = containmentProblemsOf(model({ parentOf: new Map() }), () => '', 'G1', 7);
        expect(multi.description).toBe('«t1» is listed by «L1», «L2»; it is drawn inside none of them.');
    });
    it('one warning per unclaimed node, with no related node', () => {
        const ps = containmentProblemsOf(model(), nameOf, 'G1', 7);
        expect(ps.map(p => p.id)).toEqual(['containment:multi:Vt1', 'containment:unclaimed:Vt3']);
        expect(ps[1]).toMatchObject({ nodeId: 'Vt3', title: 'In no container', relatedNodeIds: [],
            description: '«Pack» sits beside objects a container lists, and no container lists it.' });
    });
    it('skips objects with no node on the canvas', () => {
        const ps = containmentProblemsOf(model({ multiClaimed: new Map([['ghost', ['L1', 'L2']]]), unclaimed: new Set(['ghost2']) }), nameOf, 'G1');
        expect(ps).toEqual([]);
    });
    it('nothing when the model exposes no set (a default composition model)', () => {
        expect(containmentProblemsOf({ parentOf: new Map(), vertexByObj: new Map() }, nameOf, 'G1')).toEqual([]);
    });
});

describe('reconcileContainmentProblems', () => {
    beforeEach(() => {
        resetContainmentProblemSignatures();
        reconcileContainmentProblems([], 'G1');
        reconcileContainmentProblems([], 'G2');
        resetContainmentProblemSignatures();
    });
    it('registers the set, clears what left it, and keeps another owner apart', () => {
        reconcileContainmentProblems(containmentProblemsOf(model(), nameOf, 'G1'), 'G1');
        // Another canvas, another graph: other vertex ids (the owner is the graph, so ids never collide across owners).
        const other = { ...model({ unclaimed: new Set() }), vertexByObj: new Map([['t1', 'Wt1'], ['L1', 'WL1'], ['L2', 'WL2']]) };
        reconcileContainmentProblems(containmentProblemsOf(other, nameOf, 'G2'), 'G2');
        expect(getProblemIdsOwnedBy('containment', 'G1').sort()).toEqual(['containment:multi:Vt1', 'containment:unclaimed:Vt3']);
        expect(getNodeProblemsSnapshot('Vt3').map(p => p.kind)).toEqual(['containment']);
        reconcileContainmentProblems(containmentProblemsOf(model({ unclaimed: new Set() }), nameOf, 'G1'), 'G1');
        expect(getProblemIdsOwnedBy('containment', 'G1')).toEqual(['containment:multi:Vt1']);
        expect(getNodeProblemsSnapshot('Vt3')).toEqual([]);
        expect(getProblemIdsOwnedBy('containment', 'G2')).toEqual(['containment:multi:Wt1']);
    });
    it('writes nothing when the set did not change', () => {
        const ps = containmentProblemsOf(model(), nameOf, 'G1');
        reconcileContainmentProblems(ps, 'G1');
        let notified = 0;
        const off = subscribe(() => { notified++; });
        reconcileContainmentProblems(containmentProblemsOf(model(), nameOf, 'G1'), 'G1');
        off();
        expect(notified).toBe(0);
    });
});

/**
 * Unit tests for cross-object dependency tracking (spec v1.2 sez. 9):
 * - crossPaths extraction from the compile (labels, predicates, single vs multi-hop)
 * - resolveCrossDeps concretization (terminal + intermediate fids, missing feature,
 *   empty reference, cycle termination) with draw semantics mirroring the accessor
 * - the passive registry signature (value change, gone-fid marker, epoch reset)
 *
 * Pure D-layer fixtures (idlookup records); no store, no React.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { compileView, compileEdgeView, clearCompileCache } from '../irCompile';
import {
    resolveCrossDeps,
    publishCrossDeps,
    getPublishedCrossDeps,
    crossDepsSignature,
    clearCrossDeps,
    clearAllCrossDeps,
    resetCrossDepsEpoch,
    publishEdgeObjectKeys,
    getEdgeObjectKeys,
} from '../irCrossDeps';
import type { CompiledCrossPath, EdgeViewIR, VertexViewIR } from '../irTypes';

/** Task --assignee--> Person; Person --backup--> Person. Names on both. */
function crossWorld() {
    const idlookup: Record<string, any> = {
        C_Task: { id: 'C_Task', name: 'Task', extends: [] },
        C_Person: { id: 'C_Person', name: 'Person', extends: [] },
        A_name: { id: 'A_name', name: 'name' },
        R_assignee: { id: 'R_assignee', name: 'assignee' },
        R_backup: { id: 'R_backup', name: 'backup' },
        // t1.name='Fix', t1.assignee->p1
        t1: { id: 't1', name: 'obj_t1', instanceof: 'C_Task', features: ['t1_name', 't1_asg'] },
        t1_name: { id: 't1_name', instanceof: 'A_name', values: ['Fix'] },
        t1_asg: { id: 't1_asg', instanceof: 'R_assignee', values: ['p1'] },
        // p1.name='Bob', p1.backup->p2
        p1: { id: 'p1', name: 'obj_p1', instanceof: 'C_Person', features: ['p1_name', 'p1_bak'] },
        p1_name: { id: 'p1_name', instanceof: 'A_name', values: ['Bob'] },
        p1_bak: { id: 'p1_bak', instanceof: 'R_backup', values: ['p2'] },
        // p2.name='Carol'
        p2: { id: 'p2', name: 'obj_p2', instanceof: 'C_Person', features: ['p2_name'] },
        p2_name: { id: 'p2_name', instanceof: 'A_name', values: ['Carol'] },
    };
    return { idlookup };
}

function taskVertexIR(over: Partial<VertexViewIR>): VertexViewIR {
    return { irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['Task'], shape: { form: 'rect' }, ...over } as VertexViewIR;
}

const label = (expr: string): Partial<VertexViewIR> => ({
    shape: { form: 'rect', labels: [{ position: 'center', source: { from: 'path', expr } }] },
});

describe('irCompile — crossPaths extraction', () => {
    beforeEach(() => clearCompileCache());

    it('emits a cross path for a two-hop label and keeps the flat dependency set', () => {
        const cv = compileView('v_two', taskVertexIR(label('$assignee.value.$name.value')));
        expect(cv.crossPaths).toEqual([
            { hops: [{ feature: 'assignee', take: 'value' }], terminal: { feature: 'name', take: 'value' } },
        ]);
        expect(cv.dependencySet).toContain('assignee');
        expect(cv.dependencySet).toContain('name');
    });

    it('emits nothing for a single-hop (self) label', () => {
        const cv = compileView('v_one', taskVertexIR(label('$name.value')));
        expect(cv.crossPaths).toEqual([]);
    });

    it('decomposes a three-hop path into two hops + terminal', () => {
        const cv = compileView('v_three', taskVertexIR(label('$assignee.value.$backup.value.$name.value')));
        expect(cv.crossPaths).toEqual([
            {
                hops: [{ feature: 'assignee', take: 'value' }, { feature: 'backup', take: 'value' }],
                terminal: { feature: 'name', take: 'value' },
            },
        ]);
    });

    it('records the indexed take on a values[N] hop', () => {
        const cv = compileView('v_idx', taskVertexIR(label('$assignee.values[0].$name.value')));
        expect(cv.crossPaths).toEqual([
            { hops: [{ feature: 'assignee', take: 0 }], terminal: { feature: 'name', take: 'value' } },
        ]);
    });

    it('dedupes the same cross path used in two labels', () => {
        const cv = compileView('v_dup', taskVertexIR({
            shape: {
                form: 'rect',
                labels: [
                    { position: 'top', source: { from: 'path', expr: '$assignee.value.$name.value' } },
                    { position: 'bottom', source: { from: 'path', expr: '$assignee.value.$name.value' } },
                ],
            },
        }));
        expect(cv.crossPaths).toHaveLength(1);
    });

    it('extracts cross paths from a predicate, not only labels', () => {
        const cv = compileView('v_pred', taskVertexIR({ predicate: { op: 'exists', path: '$assignee.value.$name.value' } }));
        expect(cv.crossPaths).toHaveLength(1);
        expect(cv.crossPaths[0].terminal.feature).toBe('name');
    });

    it('extracts cross paths from an edge-view label (endpoints stay self)', () => {
        const ev = compileEdgeView('e_lab', {
            irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Task'],
            edge: {
                source: '$assignee.value',
                target: '$backup.value',
                labels: { center: { from: 'path', expr: '$assignee.value.$name.value' } },
            },
        } as EdgeViewIR);
        expect(ev.crossPaths).toEqual([
            { hops: [{ feature: 'assignee', take: 'value' }], terminal: { feature: 'name', take: 'value' } },
        ]);
    });
});

describe('resolveCrossDeps — concretization (draw semantics)', () => {
    const twoHop: CompiledCrossPath[] = [
        { hops: [{ feature: 'assignee', take: 'value' }], terminal: { feature: 'name', take: 'value' } },
    ];
    const threeHop: CompiledCrossPath[] = [
        {
            hops: [{ feature: 'assignee', take: 'value' }, { feature: 'backup', take: 'value' }],
            terminal: { feature: 'name', take: 'value' },
        },
    ];

    it('observes the terminal slot of the navigated object, skipping the self hop', () => {
        const { idlookup } = crossWorld();
        const r = resolveCrossDeps(idlookup, 't1', twoHop);
        expect(r.fids).toEqual(['p1_name']); // (t1,assignee) is self level 0 → not observed
        expect(r.unresolved).toEqual([]);
        expect(r.capped).toBe(false);
    });

    it('observes the intermediate reference slot and the terminal on a three-hop path', () => {
        const { idlookup } = crossWorld();
        const r = resolveCrossDeps(idlookup, 't1', threeHop);
        expect(r.fids.sort()).toEqual(['p1_bak', 'p2_name'].sort());
    });

    it('reports an unresolved pair when the terminal feature is absent (renamed M2)', () => {
        const { idlookup } = crossWorld();
        const bad: CompiledCrossPath[] = [
            { hops: [{ feature: 'assignee', take: 'value' }], terminal: { feature: 'nope', take: 'value' } },
        ];
        const r = resolveCrossDeps(idlookup, 't1', bad);
        expect(r.fids).toEqual([]);
        expect(r.unresolved).toEqual([{ objectId: 'p1', feature: 'nope' }]);
    });

    it('observes nothing when the navigated reference is empty', () => {
        const { idlookup } = crossWorld();
        idlookup.t1_asg.values = [];
        const r = resolveCrossDeps(idlookup, 't1', twoHop);
        expect(r.fids).toEqual([]);
        expect(r.unresolved).toEqual([]);
    });

    it('terminates on a reference cycle (linear walk, no transitive closure)', () => {
        const { idlookup } = crossWorld();
        idlookup.p1_bak.values = ['t1']; // p1.backup -> t1 (cycle back)
        const r = resolveCrossDeps(idlookup, 't1', threeHop);
        // level1 (p1,backup) -> p1_bak ; level2 (t1,name) -> t1_name
        expect(r.fids.sort()).toEqual(['p1_bak', 't1_name'].sort());
    });

    it('is a no-op for empty / undefined cross paths', () => {
        const { idlookup } = crossWorld();
        expect(resolveCrossDeps(idlookup, 't1', [])).toEqual({ fids: [], unresolved: [], capped: false });
        expect(resolveCrossDeps(idlookup, 't1', undefined)).toEqual({ fids: [], unresolved: [], capped: false });
    });
});

describe('irCrossDeps — passive registry signature', () => {
    beforeEach(() => clearAllCrossDeps());

    it('changes the signature when an observed slot value changes', () => {
        const { idlookup } = crossWorld();
        publishCrossDeps('vX', ['p1_name']);
        const before = crossDepsSignature(idlookup, 'vX');
        expect(before).toContain('p1_name');
        idlookup.p1_name = { id: 'p1_name', instanceof: 'A_name', values: ['Bobby'] }; // Redux-style replace
        expect(crossDepsSignature(idlookup, 'vX')).not.toBe(before);
    });

    it('marks a gone fid distinctly so deletion still invalidates', () => {
        const { idlookup } = crossWorld();
        publishCrossDeps('vY', ['p1_name']);
        const before = crossDepsSignature(idlookup, 'vY');
        delete idlookup.p1_name;
        const after = crossDepsSignature(idlookup, 'vY');
        expect(after).toContain('∅');
        expect(after).not.toBe(before);
    });

    it('returns empty for an observer with no published deps', () => {
        const { idlookup } = crossWorld();
        clearCrossDeps('vZ');
        expect(crossDepsSignature(idlookup, 'vZ')).toBe('');
    });

    it('resets the whole registry only when the epoch (irSig) changes', () => {
        publishCrossDeps('vE', ['p1_name']);
        publishEdgeObjectKeys(['t1']);
        expect(resetCrossDepsEpoch('sigA')).toBe(true);   // null -> sigA
        expect(getPublishedCrossDeps('vE')).toBeUndefined();
        expect(getEdgeObjectKeys()).toEqual([]);

        publishCrossDeps('vE', ['p1_name']);
        expect(resetCrossDepsEpoch('sigA')).toBe(false);  // same epoch: kept
        expect(getPublishedCrossDeps('vE')).toEqual(['p1_name']);

        expect(resetCrossDepsEpoch('sigB')).toBe(true);   // changed: cleared
        expect(getPublishedCrossDeps('vE')).toBeUndefined();
    });
});

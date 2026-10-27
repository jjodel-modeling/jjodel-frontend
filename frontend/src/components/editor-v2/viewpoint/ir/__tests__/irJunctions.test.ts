/**
 * Activity (UML) junctions, P-2026-09-30-1935 (docs/discovery/discovery_2026-09-30_activity_decision_merge.md §3): the
 * view-only decision and merge of a plain action, as a pure pass over the synthetic control flows and a geometry.
 *
 * The engine fires one transition per step and a plain edge is a transition of its own (netCompile.ts, R-SIM-7), so
 * two exits of an action are a choice and two entries a merge: the diamond says so without a node in the model or in
 * React Flow. The DemoFlowB block runs the whole synthesis on the derived documents, as the canvas does.
 */

import { describe, it, expect } from 'vitest';
import type { Edge, Node } from '@xyflow/react';
import {
    JUNCTION_HALF, JUNCTION_TRUNK, assignActivityJunctions, isActivityActionView, isActivityFlowView, junctionGeometry,
    junctionTrunkPath, junctionVertex,
} from '../irJunctions';
import { synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { makeDrawReadCtx } from '../irReadCtx';
import { defaultChoice, derivedDocuments } from '../../derive/notations';
import type { ClassRoles, DerivedNotationId } from '../../derive/notations';
import { sketchOfMetamodel } from '../../../sim/metamodelSketch';
import { bindProfile } from '../../../../../model/simulation/profileBinder';
import { systemProfile } from '../../../../../model/simulation/simProfiles';
import { ROLE_CATALOG } from '../../../../../model/simulation/roleCatalog';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

describe('the diamond: 28 px across, 40 px of trunk from the handle', () => {
    it('the constants of the target drawing', () => {
        expect([JUNCTION_HALF, JUNCTION_TRUNK]).toEqual([14, 40]);
    });

    it('on a left side: near, centre and far on the normal, the two sides above and below', () => {
        const g = junctionGeometry({ x: 100, y: 50 }, 'left');
        expect([g.anchor, g.near, g.centre, g.far]).toEqual([{ x: 100, y: 50 }, { x: 60, y: 50 }, { x: 46, y: 50 }, { x: 32, y: 50 }]);
        expect(g.vertices).toEqual([
            { point: { x: 32, y: 50 }, side: 'left' }, { point: { x: 46, y: 36 }, side: 'top' }, { point: { x: 46, y: 64 }, side: 'bottom' },
        ]);
        expect(g.polygon).toBe('60,50 46,36 32,50 46,64');
    });

    it('on the other three sides', () => {
        expect(junctionGeometry({ x: 100, y: 50 }, 'right').vertices).toEqual([
            { point: { x: 168, y: 50 }, side: 'right' }, { point: { x: 154, y: 36 }, side: 'top' }, { point: { x: 154, y: 64 }, side: 'bottom' },
        ]);
        expect(junctionGeometry({ x: 100, y: 50 }, 'top').vertices).toEqual([
            { point: { x: 100, y: -18 }, side: 'top' }, { point: { x: 86, y: -4 }, side: 'left' }, { point: { x: 114, y: -4 }, side: 'right' },
        ]);
        const bottom = junctionGeometry({ x: 100, y: 50 }, 'bottom');
        expect([bottom.near, bottom.centre, bottom.far]).toEqual([{ x: 100, y: 90 }, { x: 100, y: 104 }, { x: 100, y: 118 }]);
        expect(bottom.polygon).toBe('100,90 86,104 100,118 114,104');
    });

    it('a branch takes the vertex that faces its other end; a tie goes to the far vertex, then to the first side', () => {
        const g = junctionGeometry({ x: 100, y: 50 }, 'left');
        expect(junctionVertex(g, { x: -100, y: 50 }).side).toBe('left');
        expect(junctionVertex(g, { x: 300, y: 40 }).side).toBe('top');
        expect(junctionVertex(g, { x: 300, y: 80 }).side).toBe('bottom');
        expect(junctionVertex(g, { x: 300, y: 50 }).side).toBe('top');
        expect(junctionVertex(g, { x: 46, y: 50 }).side).toBe('left');
        expect(junctionVertex(g, { x: -60, y: 200 })).toEqual({ point: { x: 46, y: 64 }, side: 'bottom' });
    });

    it('the trunk: into the node for a merge, into the diamond for a decision', () => {
        const g = junctionGeometry({ x: 100, y: 50 }, 'left');
        expect(junctionTrunkPath(g, 'merge')).toBe('M 60 50 L 100 50');
        expect(junctionTrunkPath(g, 'decision')).toBe('M 100 50 L 60 50');
    });
});

// ---------------------------------------------------------------------------
// The grouping pass
// ---------------------------------------------------------------------------

const flow = (id: string, source: string, target: string, sourceHandle: string, targetHandle: string, activity = true): Edge =>
    ({ id, source, target, sourceHandle, targetHandle, type: 'instanceRef', data: { irObjectAsEdge: true, ...(activity ? { irActivityFlow: true } : {}) } });
const W = (id: string) => id === 'W';
const ends = (es: Edge[]) => es.map(e => [e.id, e.sourceHandle, e.targetHandle, (e.data as any).irJunctionSource ?? null, (e.data as any).irJunctionTarget ?? null]);

describe('assignActivityJunctions', () => {
    it('two entries of an action: a merge on one shared handle, on the side of the first member at a tie; the lowest id draws', () => {
        const es = [flow('f3', 'D', 'W', 'left-0', 'right-0'), flow('f1', 'I', 'W', 'right-0', 'left-0'), flow('f2', 'W', 'D', 'right-1', 'left-1')];
        expect(ends(assignActivityJunctions(es, [], W))).toEqual([
            ['f3', 'left-0', 'right-0', null, { kind: 'merge', side: 'right', primary: false }],
            ['f1', 'right-0', 'right-0', null, { kind: 'merge', side: 'right', primary: true }],
            ['f2', 'right-1', 'left-1', null, null],
        ]);
    });

    it('the side of the majority of the members', () => {
        const es = [flow('a', 'X', 'W', 'left-0', 'right-0'), flow('b', 'Y', 'W', 'right-0', 'left-0'), flow('c', 'Z', 'W', 'right-0', 'left-1')];
        const out = assignActivityJunctions(es, [], W);
        expect(out.map(e => e.targetHandle)).toEqual(['left-0', 'left-0', 'left-0']);
        expect(out.map(e => (e.data as any).irJunctionTarget.side)).toEqual(['left', 'left', 'left']);
    });

    it('the shared handle takes the first index no other edge of the node uses on that side, either role', () => {
        const es = [flow('a', 'X', 'W', 'right-0', 'left-0'), flow('b', 'Y', 'W', 'right-0', 'left-1')];
        const other: Edge = { id: 'r', source: 'W', target: 'Q', sourceHandle: 'left-0', targetHandle: 'right-0', type: 'instanceRef', data: {} };
        expect(assignActivityJunctions(es, [other], W).map(e => e.targetHandle)).toEqual(['left-1', 'left-1']);
        const busy = [other, { ...other, id: 's', sourceHandle: undefined, target: 'W', source: 'Q', targetHandle: 'left-1' } as Edge];
        expect(assignActivityJunctions(es, busy, W).map(e => e.targetHandle)).toEqual(['left-2', 'left-2']);
    });

    it('two exits of an action: a decision on its source end', () => {
        const es = [flow('g2', 'W', 'B', 'bottom-0', 'top-0'), flow('g1', 'W', 'A', 'bottom-1', 'top-0')];
        expect(ends(assignActivityJunctions(es, [], W))).toEqual([
            ['g2', 'bottom-0', 'top-0', { kind: 'decision', side: 'bottom', primary: false }, null],
            ['g1', 'bottom-0', 'top-0', { kind: 'decision', side: 'bottom', primary: true }, null],
        ]);
    });

    it('a node with both: the decision leaves from another side than the merge enters', () => {
        const mergeLeft = [flow('i1', 'X', 'W', 'right-0', 'left-0'), flow('i2', 'Y', 'W', 'right-0', 'left-1')];
        const exitsLeft = [flow('o1', 'W', 'P', 'left-2', 'right-0'), flow('o2', 'W', 'Q', 'left-3', 'right-0')];
        const out = assignActivityJunctions([...mergeLeft, ...exitsLeft], [], W);
        expect(out.slice(0, 2).map(e => [e.targetHandle, (e.data as any).irJunctionTarget.side])).toEqual([['left-0', 'left'], ['left-0', 'left']]);
        expect(out.slice(2).map(e => [e.sourceHandle, (e.data as any).irJunctionSource.side])).toEqual([['right-0', 'right'], ['right-0', 'right']]);
        const exitsMixed = [flow('o1', 'W', 'P', 'left-2', 'right-0'), flow('o2', 'W', 'Q', 'bottom-0', 'top-0')];
        const mixed = assignActivityJunctions([...mergeLeft, ...exitsMixed], [], W);
        expect(mixed.slice(2).map(e => (e.data as any).irJunctionSource.side)).toEqual(['bottom', 'bottom']);
    });

    it('no group: one entry, a node that is no action, a flow of no Activity view, a self-loop; the input array comes back', () => {
        const one = [flow('a', 'X', 'W', 'right-0', 'left-0'), flow('b', 'W', 'Y', 'right-0', 'left-0')];
        expect(assignActivityJunctions(one, [], W)).toBe(one);
        const notAction = [flow('a', 'X', 'J', 'right-0', 'left-0'), flow('b', 'Y', 'J', 'right-0', 'left-1')];
        expect(assignActivityJunctions(notAction, [], W)).toBe(notAction);
        const plain = [flow('a', 'X', 'W', 'right-0', 'left-0', false), flow('b', 'Y', 'W', 'right-0', 'left-1', false)];
        expect(assignActivityJunctions(plain, [], W)).toBe(plain);
        const loop = [flow('a', 'X', 'W', 'right-0', 'left-0'), flow('l', 'W', 'W', 'top-0', 'top-1')];
        expect(assignActivityJunctions(loop, [], W)).toBe(loop);
    });

    it('a member keeps its other end, every non-member is the same object', () => {
        const es = [flow('a', 'X', 'W', 'right-0', 'left-0'), flow('b', 'Y', 'W', 'bottom-2', 'left-1'), flow('c', 'W', 'Z', 'right-0', 'left-0')];
        const out = assignActivityJunctions(es, [], W);
        expect(out[2]).toBe(es[2]);
        expect(out.map(e => e.sourceHandle)).toEqual(['right-0', 'bottom-2', 'right-0']);
        expect(es[0].targetHandle).toBe('left-0');
        expect((es[0].data as any).irJunctionTarget).toBeUndefined();
    });
});

describe('the provenance the pass reads', () => {
    it('an Activity (UML) control flow and action; any other notation or role is neither', () => {
        const gen = (notation: string, role?: string) => ({ generated: { by: 'derive-2', notation, ...(role ? { role } : {}), hash: 'h' } });
        expect([isActivityFlowView(gen('activityUml', 'transition')), isActivityActionView(gen('activityUml', 'node'))]).toEqual([true, true]);
        expect([
            isActivityFlowView(gen('flowchart', 'transition')), isActivityFlowView(gen('activityUml', 'node')), isActivityFlowView({}),
            isActivityActionView(gen('activityUml', 'decision')), isActivityActionView(gen('activityUml')), isActivityActionView(gen('flowchartIso', 'node')),
            isActivityActionView(undefined), isActivityFlowView(null),
        ]).toEqual([false, false, false, false, false, false, false, false]);
    });
});

// ---------------------------------------------------------------------------
// DemoFlowB, through the synthesis
// ---------------------------------------------------------------------------

type Lookup = Record<string, any>;
const EXPRESSION = 'Pointer_EXPRESSION';
const ACTION = 'Pointer_ACTION';

/** DemoFlowB as the demo builds it (docs/demo/models_2026_simulator_demo.md §2.4), the binding Apply writes, and demoFlowB. */
function demoFlowB(): { lookup: Lookup; mm: string } {
    const L: Lookup = {};
    const cls = (n: string) => `FLOWB.${n}`;
    const names = ['ActivityNode', 'InitialNode', 'Activity', 'Decision', 'Fork', 'Join', 'FinalNode', 'ControlFlow'];
    L.FLOWB = { id: 'FLOWB', className: 'DModel', name: 'DemoFlowB', isMetamodel: true, packages: ['FLOWB.pkg'], classes: [] };
    L['FLOWB.pkg'] = { className: 'DPackage', name: 'default', classes: names.map(cls), subpackages: [] };
    for (const n of names) {
        L[cls(n)] = { id: cls(n), className: 'DClass', name: n, abstract: false, extends: n === 'ActivityNode' || n === 'ControlFlow' ? [] : [cls('ActivityNode')], attributes: [], references: [] };
    }
    const cf = L[cls('ControlFlow')];
    cf.attributes = [`${cf.id}.guard`, `${cf.id}.effect`];
    cf.references = [`${cf.id}.source`, `${cf.id}.target`];
    L[`${cf.id}.guard`] = { className: 'DAttribute', name: 'guard', type: EXPRESSION, upperBound: 1 };
    L[`${cf.id}.effect`] = { className: 'DAttribute', name: 'effect', type: ACTION, upperBound: -1 };
    for (const r of ['source', 'target']) L[`${cf.id}.${r}`] = { className: 'DReference', name: r, type: cls('ActivityNode'), composition: false, aggregation: false, upperBound: 1 };
    const bindings = bindProfile(systemProfile('flowchart')!, sketchOfMetamodel(L, 'FLOWB'));
    const bag: Record<string, unknown> = { simProfile: 'flowchart' };
    for (const d of ROLE_CATALOG) { const b = bindings[d.id]; if (d.key && b?.status === 'bound') bag[d.key] = b.value; }
    L.FLOWB._state = bag;

    const nodes: [string, string][] = [['i0', 'InitialNode'], ['work', 'Activity'], ['d1', 'Decision'], ['fk', 'Fork'], ['left', 'Activity'],
        ['right', 'Activity'], ['jn', 'Join'], ['fin', 'FinalNode']];
    const wires: [string, string, string, string][] = [['f1', 'i0', 'work', ''], ['f2', 'work', 'd1', ''], ['f3', 'd1', 'work', 'model.[count] < 2'],
        ['f4', 'd1', 'fk', 'model.[count] >= 2'], ['f5', 'fk', 'left', ''], ['f6', 'fk', 'right', ''], ['f7', 'left', 'jn', ''], ['f8', 'right', 'jn', ''], ['f9', 'jn', 'fin', '']];
    L.m1 = { id: 'm1', className: 'DModel', name: 'demoFlowB', isMetamodel: false, instanceof: 'FLOWB' };
    for (const [id, c] of nodes) L[id] = { id, className: 'DObject', name: id, instanceof: cls(c), features: [] };
    for (const [id, s, t, g] of wires) {
        L[id] = { id, className: 'DObject', name: id, instanceof: cf.id, features: [`${id}.source`, `${id}.target`, `${id}.guard`] };
        L[`${id}.source`] = { id: `${id}.source`, className: 'DValue', instanceof: `${cf.id}.source`, values: [s] };
        L[`${id}.target`] = { id: `${id}.target`, className: 'DValue', instanceof: `${cf.id}.target`, values: [t] };
        L[`${id}.guard`] = { id: `${id}.guard`, className: 'DValue', instanceof: `${cf.id}.guard`, values: g ? [g] : [] };
    }
    return { lookup: L, mm: 'FLOWB' };
}

/** The stored positions of the demo export (`scene_4_DemoFlowB`), top-left, one vertex per object; the flows' too. */
const POS: Record<string, [number, number, number, number]> = {
    i0: [50, 50, 20, 20], work: [470, 50, 142, 44], d1: [890, 50, 36, 36], fk: [50, 350, 5, 120], left: [470, 350, 142, 44],
    right: [890, 350, 142, 44], jn: [50, 650, 5, 120], fin: [470, 650, 24, 24],
};

let indexRuns = 0;
function synthesize(notation: DerivedNotationId, classRoles?: ClassRoles, edges: Edge[] = []) {
    const { lookup, mm } = demoFlowB();
    const choice = { notation, classRoles: classRoles ?? defaultChoice(lookup, mm, []).classRoles };
    const views = derivedDocuments(lookup, mm, choice);
    const ids = views.map((_, i) => `V${i}`);
    views.forEach((v, i) => { lookup[ids[i]] = { id: ids[i], viewpoint: 'VP', ir: v.ir }; });
    const index = getIRIndex({ viewpoint: 'VP', viewelements: ids, idlookup: lookup }, `junctions_${notation}_${++indexRuns}`)!;
    const objects = Object.values(lookup).filter((o: any) => o?.className === 'DObject').map((o: any) => o.id as string);
    const nodes: Node[] = objects.map((o, k) => {
        const [x, y, w, h] = POS[o] ?? [2000, 100 * k, 100, 40];
        return { id: `v_${o}`, position: { x, y }, measured: { width: w, height: h }, data: {} } as Node;
    });
    const objByVertex = new Map(objects.map(o => [`v_${o}`, o] as const));
    const vertexByObj = new Map(objects.map(o => [o, `v_${o}`] as const));
    const before = JSON.stringify(lookup);
    const out = synthesizeObjectAsEdges(nodes, edges, objByVertex, vertexByObj, index, makeDrawReadCtx(lookup), lookup);
    return { out, nodes, lookup, before };
}
const junctionsOf = (edges: Edge[]) => Object.fromEntries(edges
    .filter(e => (e.data as any)?.irJunctionTarget || (e.data as any)?.irJunctionSource)
    .map(e => [e.id.replace('irobj_', ''), { s: (e.data as any).irJunctionSource ?? null, t: (e.data as any).irJunctionTarget ?? null, sh: e.sourceHandle, th: e.targetHandle }]));

describe('DemoFlowB derived as Activity (UML), through synthesizeObjectAsEdges', () => {
    it('one diamond: the merge before work (f1, f3); none on i0, d1, the bars, fin, left, right', () => {
        const { out } = synthesize('activityUml');
        expect(out.edges.length).toBe(9);
        expect(out.edges.every(e => (e.data as any).irActivityFlow === true)).toBe(true);
        expect(junctionsOf(out.edges)).toEqual({
            f1: { s: null, t: { kind: 'merge', side: 'left', primary: true }, sh: 'right-0', th: 'left-0' },
            f3: { s: null, t: { kind: 'merge', side: 'left', primary: false }, sh: 'left-0', th: 'left-0' },
        });
    });

    it('another edge on work\'s left moves the shared handle to the next free index', () => {
        const ref: Edge = { id: 'ref', source: 'v_work', target: 'v_right', sourceHandle: 'left-0', targetHandle: 'right-0', type: 'instanceRef', data: {} };
        const { out } = synthesize('activityUml', undefined, [ref]);
        const j = junctionsOf(out.edges);
        expect([j.f1.th, j.f3.th]).toEqual(['left-1', 'left-1']);
        expect(out.edges.find(e => e.id === 'ref')).toBe(ref);
    });

    it('the model is not touched: the lookup serialises identically, no node is added, the flows alone are hidden', () => {
        const { out, nodes, lookup, before } = synthesize('activityUml');
        expect(JSON.stringify(lookup)).toBe(before);
        expect(out.nodes.map(n => n.id)).toEqual(nodes.map(n => n.id));
        expect(out.nodes.filter(n => n.hidden).map(n => n.id).sort()).toEqual(['f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9'].map(f => `v_${f}`));
    });

    it('Decision read as an Action in the table: d1 is an action with two guarded exits, a decision after it', () => {
        const { lookup, mm } = demoFlowB();
        const table = { ...defaultChoice(lookup, mm, []).classRoles };
        for (const [id, role] of Object.entries(table)) if (role === 'decision') delete table[id];
        const { out } = synthesize('activityUml', table);
        const j = junctionsOf(out.edges);
        expect(Object.keys(j).sort()).toEqual(['f1', 'f3', 'f4']);
        expect(j.f3.s).toEqual({ kind: 'decision', side: 'left', primary: true });
        expect(j.f4.s).toEqual({ kind: 'decision', side: 'left', primary: false });
        expect(j.f3.sh).toBe(j.f4.sh);
        expect(j.f3.t).toEqual({ kind: 'merge', side: 'left', primary: false });
        // The guards still label the two exits.
        const label = (f: string) => (out.edges.find(e => e.id === `irobj_${f}`)!.data as any).irLabelText;
        expect([label('f3'), label('f4')]).toEqual(['[model.[count] < 2]', '[model.[count] >= 2]']);
    });

    it('the Flowchart and Flowchart (ISO 5807) of the same model: no flag, no diamond, the handles of before', () => {
        for (const n of ['flowchart', 'flowchartIso'] as DerivedNotationId[]) {
            const { lookup, mm } = demoFlowB();
            const own = { notation: n, classRoles: defaultChoice(lookup, mm, []).classRoles };
            const { out } = synthesize(n, own.classRoles);
            expect(out.edges.some(e => 'irActivityFlow' in ((e.data as any) ?? {})), n).toBe(false);
            expect(junctionsOf(out.edges), n).toEqual({});
            expect(out.edges.find(e => e.id === 'irobj_f3')!.targetHandle, n).toBe('right-0');
        }
    });
});

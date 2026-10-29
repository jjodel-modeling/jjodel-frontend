/**
 * D-B: after a toolbar Auto layout, the React Flow handles of a routed edge sit on its ELK ends (P-2026-10-03-1920,
 * item 3, A3 amending R-VP-49; docs/discovery/discovery_2026-10-03_petri_ink_ports.md §3.3,
 * docs/lir/lir_2026-10-03_petri_ink_ports.md).
 *
 * - The synthesis gives a synthetic edge whose ELK route is valid the route's sides, and writes on its data, per end,
 *   where the route meets the side (`irSourcePin` / `irTargetPin`, a fraction along it). A diamond end keeps its own
 *   side rule and no pin; a user anchor override wins and drops the pins; an invalid route changes nothing.
 * - computeSideEndpoints reads the pin of its role; computeSidePositions puts a pinned endpoint there and every other
 *   one on the slot it had.
 * - DynamicHandles' edge equality sees a pin change, so the handles are drawn and measured again.
 */
import { describe, expect, it } from 'vitest';
import { clearCompileCache } from '../irCompile';
import { synthesizeObjectAsEdges } from '../irEdgeViews';
import { getIRIndex } from '../irResolveCore';
import { resetBarOrientations } from '../barOrientation';
import { makeDrawReadCtx } from '../irReadCtx';
import type { EdgeViewIR, VertexViewIR } from '../irTypes';
import type { ElkRoute } from '../../../utils/elkLayout';
import { computeSideEndpoints, computeSidePositions } from '../../../utils/handlePosition';
import { ownEdgesEqual } from '../../../components/DynamicHandles';

type Rect = { x: number; y: number; width: number; height: number };
const P1: Rect = { x: 0, y: 0, width: 44, height: 44 };
const P2: Rect = { x: 400, y: 300, width: 44, height: 44 };

function world(p2At: Rect = P2, form2 = 'circle') {
    const idlookup: Record<string, any> = {
        C_Place: { id: 'C_Place', name: 'Place', extends: [] },
        C_Dec: { id: 'C_Dec', name: 'Decision', extends: [] },
        C_Arc: { id: 'C_Arc', name: 'Arc', extends: [] },
        R_src: { id: 'R_src', name: 'src', className: 'DReference', composition: false },
        R_tgt: { id: 'R_tgt', name: 'tgt', className: 'DReference', composition: false },
        p1: { id: 'p1', name: 'p1', instanceof: 'C_Place', features: [] },
        p2: { id: 'p2', name: 'p2', instanceof: form2 === 'diamond' ? 'C_Dec' : 'C_Place', features: [] },
        a1: { id: 'a1', name: 'a1', instanceof: 'C_Arc', features: ['a1_src', 'a1_tgt'] },
        a1_src: { id: 'a1_src', instanceof: 'R_src', values: ['p1'] },
        a1_tgt: { id: 'a1_tgt', instanceof: 'R_tgt', values: ['p2'] },
    };
    const view = (cls: string, form: string): VertexViewIR => ({ irVersion: 'ir-1.2', kind: 'vertex', metaclasses: [cls], shape: { form: form as never, labels: [] } });
    const arcView: EdgeViewIR = { irVersion: 'ir-1.2', kind: 'edge', metaclasses: ['Arc'], edge: { source: '$src.value', target: '$tgt.value' } };
    const state = {
        viewpoint: 'VP', viewelements: ['V_arc', 'V_place', 'V_dec'],
        idlookup: { ...idlookup, V_arc: { id: 'V_arc', viewpoint: 'VP', ir: arcView }, V_place: { id: 'V_place', viewpoint: 'VP', ir: view('Place', 'circle') }, V_dec: { id: 'V_dec', viewpoint: 'VP', ir: view('Decision', 'diamond') } },
    };
    const node = (id: string, r: Rect) => ({ id, type: 'objectNode', position: { x: r.x, y: r.y }, measured: { width: r.width, height: r.height }, data: {} });
    return { state, nodes: [node('V1', P1), node('V2', p2At)] as any[], objByVertex: new Map([['V1', 'p1'], ['V2', 'p2']]), vertexByObj: new Map([['p1', 'V1'], ['p2', 'V2']]) };
}

/** A route leaving P1's bottom at x 30 and entering P2's top at x 410: the sides the geometry would not pick (right/left). */
const DOWN_ROUTE: ElkRoute = {
    points: [{ x: 30, y: 44 }, { x: 30, y: 150 }, { x: 410, y: 150 }, { x: 410, y: 300 }],
    sourceSide: 'bottom', targetSide: 'top', sourceRect: P1, targetRect: P2, orthogonal: true,
};

function run(sig: string, routeOf: ((id: string) => ElkRoute | undefined) | undefined, opts: { p2At?: Rect; form2?: string; overrides?: Map<string, any> } = {}) {
    resetBarOrientations(sig);
    clearCompileCache();
    const { state, nodes, objByVertex, vertexByObj } = world(opts.p2At, opts.form2);
    const index = getIRIndex(state, sig)!;
    const res = synthesizeObjectAsEdges(nodes, [], objByVertex, vertexByObj, index, makeDrawReadCtx(state.idlookup), state.idlookup, opts.overrides, new Map(), new Set(['a1']), routeOf);
    return res.edges.find(e => e.id === 'irobj_a1')!;
}

describe('the synthesis puts a routed edge\'s handles on its ELK ends', () => {
    it('without a route: the geometric sides, no pin (byte for byte as before)', () => {
        const e = run('dB_none', () => undefined);
        expect([e.sourceHandle, e.targetHandle]).toEqual(['right-0', 'left-0']);
        expect(['irSourcePin', 'irTargetPin'].some(k => k in (e.data as any))).toBe(false);
    });

    it('a valid route: its sides, and where it meets each side as a fraction along it (mutation: the geometric sides kept)', () => {
        const e = run('dB_valid', id => (id === 'irobj_a1' ? DOWN_ROUTE : undefined));
        expect([e.sourceHandle, e.targetHandle]).toEqual(['bottom-0', 'top-0']);
        expect((e.data as any).irSourcePin).toBeCloseTo(30 / 44, 6);
        expect((e.data as any).irTargetPin).toBeCloseTo(10 / 44, 6);
    });

    it('a route computed for other rects (a node moved): ignored, the geometry and no pin (mutation: validity not checked)', () => {
        const e = run('dB_moved', () => DOWN_ROUTE, { p2At: { ...P2, x: 420 } });
        expect([e.sourceHandle, e.targetHandle]).toEqual(['right-0', 'left-0']);
        expect(['irSourcePin', 'irTargetPin'].some(k => k in (e.data as any))).toBe(false);
    });

    it('a diamond end keeps its own side rule and takes no pin; the other end follows the route (mutation: the diamond pinned)', () => {
        const e = run('dB_diamond', () => DOWN_ROUTE, { form2: 'diamond' });
        expect(e.sourceHandle).toBe('bottom-0');
        expect((e.data as any).irSourcePin).toBeCloseTo(30 / 44, 6);
        expect(e.targetHandle).toBe('left-0');
        expect('irTargetPin' in (e.data as any)).toBe(false);
    });

    it('an end the route does not bring to the node\'s border (a junction branch ends on ELK\'s junction node) keeps the geometry and no pin (mutation: every route end taken)', () => {
        const toJunction: ElkRoute = { ...DOWN_ROUTE, points: [{ x: 30, y: 44 }, { x: 30, y: 150 }, { x: 410, y: 150 }, { x: 410, y: 270 }] };
        const e = run('dB_junction', () => toJunction);
        expect(e.sourceHandle).toBe('bottom-0');
        expect((e.data as any).irSourcePin).toBeCloseTo(30 / 44, 6);
        expect(e.targetHandle).toBe('left-0');
        expect('irTargetPin' in (e.data as any)).toBe(false);
    });

    it('a user anchor override wins and drops the pins (mutation: the pins kept under an override)', () => {
        const e = run('dB_override', () => DOWN_ROUTE, { overrides: new Map([['a1', { sourceHandle: 'top-0', targetHandle: 'right-0' }]]) });
        expect([e.sourceHandle, e.targetHandle]).toEqual(['top-0', 'right-0']);
        expect(['irSourcePin', 'irTargetPin'].some(k => k in (e.data as any))).toBe(false);
    });
});

describe('handlePosition: a pinned endpoint sits at its pin, the others keep their slots', () => {
    const edges: any[] = [
        { id: 'e1', source: 'N', target: 'A', sourceHandle: 'bottom-0', targetHandle: 'top-0', data: { irSourcePin: 0.2 } },
        { id: 'e2', source: 'N', target: 'B', sourceHandle: 'bottom-1', targetHandle: 'top-0', data: {} },
        { id: 'e3', source: 'C', target: 'N', sourceHandle: 'top-0', targetHandle: 'bottom-2', data: { irSourcePin: 0.9 } },
    ];

    it('computeSideEndpoints reads the pin of the endpoint\'s own role only (mutation: the other role\'s pin read)', () => {
        const ep = computeSideEndpoints(edges, 'N', 'bottom');
        expect(ep.find(e => e.edgeId === 'e1')?.pin).toBe(0.2);
        expect(ep.find(e => e.edgeId === 'e2')?.pin).toBeUndefined();
        // e3 ends on N as its target; the pin it carries is its source's, on C.
        expect(ep.find(e => e.edgeId === 'e3')?.pin).toBeUndefined();
    });

    it('computeSidePositions: the pin wins, the unpinned keep the slot they had (mutation: the pin ignored; the slots redistributed)', () => {
        const ep = computeSideEndpoints(edges, 'N', 'bottom');
        const pos = computeSidePositions(ep);
        const unpinned = computeSidePositions(ep.map(({ pin, ...rest }) => rest));
        expect(pos.get('bottom-0:source')).toBe(0.2);
        expect(pos.get('bottom-1:source')).toBe(unpinned.get('bottom-1:source'));
        expect(pos.get('bottom-2:target')).toBe(unpinned.get('bottom-2:target'));
    });

    it('a pin out of 0..1 or not a number is no pin (mutation: any value taken)', () => {
        const bad: any[] = [{ id: 'x', source: 'N', target: 'A', sourceHandle: 'left-0', targetHandle: 'right-0', data: { irSourcePin: 1.5 } }, { id: 'y', source: 'N', target: 'A', sourceHandle: 'left-1', targetHandle: 'right-0', data: { irSourcePin: '0.3' } }];
        for (const e of computeSideEndpoints(bad, 'N', 'left')) expect(e.pin, e.edgeId).toBeUndefined();
    });
});

describe('DynamicHandles: a pin change is a handle change', () => {
    it('ownEdgesEqual says different when only a pin moved (mutation: the pins out of the edge key)', () => {
        const a: any = { id: 'e1', source: 'N', target: 'A', sourceHandle: 'bottom-0', targetHandle: 'top-0', type: 'instanceRef', data: { irSourcePin: 0.2 } };
        const b: any = { ...a, data: { irSourcePin: 0.4 } };
        const c: any = { ...a, data: { irSourcePin: 0.2, irStroke: 'red' } };
        expect(ownEdgesEqual([a], [b])).toBe(false);
        // A field the handles do not read still says equal.
        expect(ownEdgesEqual([a], [c])).toBe(true);
    });
});

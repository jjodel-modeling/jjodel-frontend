/**
 * Activity (UML), P-2026-09-30-1935 (docs/discovery/discovery_2026-09-30_activity_decision_merge.md): the view-only
 * decision and merge diamonds, the guard's white patch and the run token inside the node, rendered.
 *
 * ── The subject is UnifiedEdge and SimNodeRunState, rendered ──────────────────
 * The bench of irA2Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas write-back mocked,
 * React Flow's node and edge hooks answering from `rf`); the run-state singleton answering from `sim`.
 *
 * «Absent» is measured against `17a70f2ad` (code of `30f3d8a81`): the markup digests below were taken there before
 * any edit of this lane, so an edge without the new data keys and the overlay in its corner placement render the bytes
 * they rendered.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactFlowProvider } from '@xyflow/react';

const rf: { nodes: Record<string, any>; edges: any[] } = { nodes: {}, edges: [] };
const sim: { states: Record<string, any>; pending: Set<string> } = { states: {}, pending: new Set() };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => ({ idlookup: {} }), subscribe: () => () => {}, dispatch: (a: unknown) => a },
    U: {},
    LPointerTargetable: { from: () => null, fromPointer: () => null, fromD: () => null, wrap: () => null },
}));
vi.mock('../../../sync/canvasToJjom', () => ({
    syncNodeLabel: () => {},
    syncUpdateFeatureValue: () => {},
    syncSetReferenceValue: () => {},
    syncEdgeRefProperty: () => {},
}));
vi.mock('../irResolve', () => ({ useIRRowView: () => null }));
vi.mock('../../../sim/simRunState', () => ({
    getSimNodeState: (id: string) => sim.states[id] ?? null,
    isSimPending: (id: string) => sim.pending.has(id),
    useSimVersion: () => 0,
    useSimChoiceVersion: () => 0,
}));
vi.mock('@xyflow/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@xyflow/react')>();
    return {
        ...actual,
        EdgeLabelRenderer: ({ children }: { children?: unknown }) => createElement(Fragment, null, children as never),
        useReactFlow: () => ({ setEdges: () => {}, getNodes: () => Object.values(rf.nodes) }),
        useInternalNode: (id: string) => rf.nodes[id],
        useEdges: () => rf.edges,
    };
});

import UnifiedEdge from '../../../edges/UnifiedEdge';
import SimNodeRunState from '../../../sim/SimNodeRunState';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const INK = 'var(--color-inode-name)';

type Side = 'left' | 'right' | 'top' | 'bottom';
type HandleSpec = [id: string, type: 'source' | 'target', side: Side, fraction: number];
const H = 8;

/** A node as React Flow's store holds it, with its handles as DynamicHandles places them. */
function node(id: string, x: number, y: number, w: number, h: number, handles: HandleSpec[]) {
    const bounds: { source: any[]; target: any[] } = { source: [], target: [] };
    for (const [hid, type, side, f] of handles) {
        const c = side === 'left' ? { x: 0, y: f * h } : side === 'right' ? { x: w, y: f * h } : side === 'top' ? { x: f * w, y: 0 } : { x: f * w, y: h };
        bounds[type].push({ id: hid, type, nodeId: id, position: side, x: c.x - H / 2, y: c.y - H / 2, width: H, height: H });
    }
    return { id, position: { x, y }, measured: { width: w, height: h }, internals: { positionAbsolute: { x, y }, handleBounds: bounds }, data: {} };
}
/** The point xyflow passes for a handle: its outer edge on the side's normal. */
function rfPoint(n: any, hid: string, type: 'source' | 'target') {
    const b = n.internals.handleBounds[type].find((h: any) => h.id === hid);
    const p = n.internals.positionAbsolute;
    const cx = p.x + b.x + b.width / 2, cy = p.y + b.y + b.height / 2;
    switch (b.position as Side) {
        case 'left': return { x: cx - H / 2, y: cy };
        case 'right': return { x: cx + H / 2, y: cy };
        case 'top': return { x: cx, y: cy - H / 2 };
        default: return { x: cx, y: cy + H / 2 };
    }
}

interface EdgeSpec { id: string; source: string; target: string; sourceHandle: string; targetHandle: string }
function renderEdge(e: EdgeSpec, data: Record<string, unknown>, label = 'src', selected = false): string {
    const s = rfPoint(rf.nodes[e.source], e.sourceHandle, 'source');
    const t = rfPoint(rf.nodes[e.target], e.targetHandle, 'target');
    const props = {
        id: e.id, source: e.source, target: e.target, sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
        sourceHandleId: e.sourceHandle, targetHandleId: e.targetHandle, selected, label, type: 'instanceRef', data,
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}

/** A control flow as irEdgeViews decorates an Activity (UML) one: 1 px in the ink, the open arrowhead. */
const FLOW = (extra: Record<string, unknown> = {}) => ({
    irEdgeViewId: 'V_flow', irStroke: INK, irStrokeWidth: 1, irSourceTermination: 'none', irTargetTermination: 'openArrow',
    irLabelPlacement: 'auto', irLabelAlwaysVisible: false, referenceName: 'src', ...extra,
});
/** The guard label as the R-VP-26 document styles it (12 px 500 quiet, the halo). */
const GUARD = { irLabelText: '[count < 2]', irLabelAlwaysVisible: true, irLabelStyle: { fontSize: '12px', fontWeight: 500, color: 'var(--color-inode-quiet)' } };

/**
 * The merge scene: an initial I on the left, the action W, a decision D on the right, one row. f1 I → W, f3 D → W, both
 * on W's shared left handle, as the junction pass leaves them; f2 W → D on W's right.
 */
function mergeScene() {
    rf.nodes = {
        I: node('I', 0, 12, 20, 20, [['right-0', 'source', 'right', 1 / 2]]),
        W: node('W', 300, 0, 140, 44, [['left-0', 'target', 'left', 1 / 2], ['right-0', 'source', 'right', 1 / 2]]),
        D: node('D', 700, 4, 36, 36, [['left-0', 'source', 'left', 1 / 2], ['left-1', 'target', 'left', 1 / 2]]),
    };
    const f1: EdgeSpec = { id: 'f1', source: 'I', target: 'W', sourceHandle: 'right-0', targetHandle: 'left-0' };
    const f3: EdgeSpec = { id: 'f3', source: 'D', target: 'W', sourceHandle: 'left-0', targetHandle: 'left-0' };
    const f2: EdgeSpec = { id: 'f2', source: 'W', target: 'D', sourceHandle: 'right-0', targetHandle: 'left-1' };
    rf.edges = [f1, f2, f3];
    return { f1, f2, f3 };
}

/** The decision scene: the action W with two exits on its shared right handle, to A above and B below. */
function decisionScene() {
    rf.nodes = {
        W: node('W', 0, 200, 140, 44, [['right-0', 'source', 'right', 1 / 2]]),
        A: node('A', 400, 0, 140, 44, [['left-0', 'target', 'left', 1 / 2]]),
        B: node('B', 400, 400, 140, 44, [['left-0', 'target', 'left', 1 / 2]]),
    };
    const g1: EdgeSpec = { id: 'g1', source: 'W', target: 'A', sourceHandle: 'right-0', targetHandle: 'left-0' };
    const g2: EdgeSpec = { id: 'g2', source: 'W', target: 'B', sourceHandle: 'right-0', targetHandle: 'left-0' };
    rf.edges = [g1, g2];
    return { g1, g2 };
}

const visiblePath = (html: string) => /<path[^>]*class="reference-edge[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
const dOf = (tag: string) => /\sd="([^"]*)"/.exec(tag)?.[1] ?? '';
const points = (d: string) => [...d.matchAll(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g)].map(m => [Number(m[1]), Number(m[2])]);
const lastPoint = (d: string) => points(d).at(-1);
const firstPoint = (d: string) => points(d)[0];
/** The end point of every command of a path (`M`, `L`, `A`): its last two numbers. */
const commandEnds = (d: string) => (d.match(/[MLA][^MLA]*/g) ?? []).map(c => c.trim().split(/[\s,]+/).slice(-2).map(Number));
const grips = (html: string) => [...html.matchAll(/translate\(-50%, -50%\) translate\((-?[\d.]+)px, (-?[\d.]+)px\)/g)].map(m => [Number(m[1]), Number(m[2])]);
const polygons = (html: string) => [...html.matchAll(/<polygon[^>]*class="ir-junction"[^>]*>/g)].map(m => m[0]);
const trunks = (html: string) => [...html.matchAll(/<path[^>]*class="reference-edge[^"]*ir-junction-trunk[^"]*"[^>]*>/g)].map(m => m[0]);

/** Markup digests on `17a70f2ad`, before any edit of this lane. */
const PIN = {
    flow: 'caf5def28c3734f9', guarded: '2e1e2309013c58be', mergeF3Plain: '2bd355a08d918527',
    corner1: 'f11e8975fcf90659', corner0: '97cbca8e2b710577', cornerRing: 'ae2ef15e27c8d200', cornerSigma: '7dc5e97a97fe6183',
    cornerPending: 'a8c140b875a5f5e4',
};

describe('the bytes of before: an edge without the new keys, the overlay in its corner', () => {
    it('a flow, a guarded flow with the halo label, the merge scene\'s f3 without junction data', () => {
        const { f1, f3 } = mergeScene();
        expect({
            flow: digest(renderEdge(f1, FLOW())),
            guarded: digest(renderEdge(f1, FLOW(GUARD), '[count < 2]')),
            mergeF3Plain: digest(renderEdge(f3, FLOW())),
        }).toEqual({ flow: PIN.flow, guarded: PIN.guarded, mergeF3Plain: PIN.mergeF3Plain });
    });

    it('the overlay with no placement: the pill at the corner, the grey 0, the ring, the σ card, the pending ring', () => {
        const draw = (s: any, pending = false) => {
            sim.states = { O: s };
            sim.pending = new Set(pending ? ['O'] : []);
            return digest(renderToStaticMarkup(createElement(SimNodeRunState, { objectId: 'O' })));
        };
        expect({
            corner1: draw({ modelId: 'M', tokens: 1, sigma: [], enabled: false }),
            corner0: draw({ modelId: 'M', tokens: 0, sigma: [], enabled: false }),
            cornerRing: draw({ modelId: 'M', tokens: null, sigma: [], enabled: true }),
            cornerSigma: draw({ modelId: 'M', tokens: 2, sigma: [{ attr: 'visits', value: '3' }], enabled: true }),
            cornerPending: draw({ modelId: 'M', tokens: null, sigma: [], enabled: true }, true),
        }).toEqual({
            corner1: PIN.corner1, corner0: PIN.corner0, cornerRing: PIN.cornerRing, cornerSigma: PIN.cornerSigma, cornerPending: PIN.cornerPending,
        });
    });
});

describe('UnifiedEdge — a merge: the branches end on the diamond, the first member draws the trunk and the diamond', () => {
    const JT = (primary: boolean) => ({ irActivityFlow: true, irJunctionTarget: { kind: 'merge', side: 'left', primary } });

    it('f1, the primary, from the initial on the left: its branch ends at the far vertex; the diamond and the trunk into W', () => {
        const { f1 } = mergeScene();
        const html = renderEdge(f1, FLOW(JT(true)));
        // W's shared left handle: xyflow's point (296, 22); the diamond centred 54 px out, 28 px across.
        expect(lastPoint(dOf(visiblePath(html)))).toEqual([228, 22]);
        const [poly] = polygons(html);
        expect(polygons(html).length).toBe(1);
        expect(/points="([^"]*)"/.exec(poly)?.[1]).toBe('256,22 242,8 228,22 242,36');
        expect(poly).toContain('fill:var(--color-inode-surface)');
        expect(poly).toContain(`stroke:${INK}`);
        expect(poly).toContain('stroke-width:1');
        const [trunk] = trunks(html);
        expect(trunks(html).length).toBe(1);
        expect(dOf(trunk)).toBe('M 256 22 L 296 22');
        expect(trunk).toContain('marker-end="url(#ir-arrow-open-f1)"');
    });

    it('f3, a member from the decision on the right: its branch ends at the top vertex, no diamond, no trunk of its own', () => {
        const { f3 } = mergeScene();
        const html = renderEdge(f3, FLOW(JT(false)));
        expect(lastPoint(dOf(visiblePath(html)))).toEqual([242, 8]);
        expect(polygons(html)).toEqual([]);
        expect(trunks(html)).toEqual([]);
        // The branch keeps its own arrowhead, at the diamond, and enters the top vertex from above.
        expect(visiblePath(html)).toContain('marker-end="url(#ir-arrow-open-f3)"');
        const e = commandEnds(dOf(visiblePath(html)));
        expect(e.at(-1)).toEqual([242, 8]);
        expect(e.at(-2)?.[0]).toBe(242);
        expect(e.at(-2)![1]).toBeLessThan(8);
    });

    it('selected, the target grip of a member sits on its vertex, where the line ends', () => {
        const { f3 } = mergeScene();
        expect(grips(renderEdge(f3, FLOW(JT(false)), 'src', true))).toContainEqual([242, 8]);
    });

    it('an edge that is a member at both ends draws only the diamond it is the primary of', () => {
        rf.nodes = {
            W: node('W', 0, 0, 140, 44, [['right-0', 'source', 'right', 1 / 2]]),
            V: node('V', 400, 0, 140, 44, [['left-0', 'target', 'left', 1 / 2]]),
        };
        const h: EdgeSpec = { id: 'h', source: 'W', target: 'V', sourceHandle: 'right-0', targetHandle: 'left-0' };
        rf.edges = [h];
        const html = renderEdge(h, FLOW({
            irActivityFlow: true, irJunctionSource: { kind: 'decision', side: 'right', primary: true }, irJunctionTarget: { kind: 'merge', side: 'left', primary: false },
        }));
        expect(polygons(html).length).toBe(1);
        expect(dOf(trunks(html)[0])).toBe('M 144 22 L 184 22');
        // Between the two diamonds: from the decision's far vertex to the merge's far vertex.
        const e = commandEnds(dOf(visiblePath(html)));
        expect([e[0], e.at(-1)]).toEqual([[212, 22], [328, 22]]);
    });

    it('an arc keeps its own geometry: junction data on it draws no diamond and no trunk', () => {
        const { f1 } = mergeScene();
        const html = renderEdge(f1, FLOW({ ...JT(true), irCurve: 'arc' }));
        expect(polygons(html)).toEqual([]);
        expect(trunks(html)).toEqual([]);
    });
});

describe('UnifiedEdge — a decision: the trunk from the action into the diamond, each branch from the vertex facing its target', () => {
    const JS = (primary: boolean) => ({ irActivityFlow: true, irJunctionSource: { kind: 'decision', side: 'right', primary } });
    const scene = () => {
        const s = decisionScene();
        rf.nodes.A = node('A', 160, -300, 140, 44, [['bottom-0', 'target', 'bottom', 1 / 2]]);
        rf.nodes.B = node('B', 160, 700, 140, 44, [['top-0', 'target', 'top', 1 / 2]]);
        s.g1.targetHandle = 'bottom-0';
        s.g2.targetHandle = 'top-0';
        return s;
    };

    it('g1 to A above: from the top vertex; the primary draws the diamond and the trunk, arrowhead at the diamond', () => {
        const { g1 } = scene();
        const html = renderEdge(g1, FLOW(JS(true)));
        expect(firstPoint(dOf(visiblePath(html)))).toEqual([198, 208]);
        // Today's router, unfanned: the corridor at the middle of the branch, 208 to A's handle at -252.
        expect(commandEnds(dOf(visiblePath(html))).slice(0, 3)).toEqual([[198, 208], [198, -18], [202, -22]]);
        expect(grips(renderEdge(g1, FLOW(JS(true)), 'src', true))).toContainEqual([198, 208]);
        expect(/points="([^"]*)"/.exec(polygons(html)[0])?.[1]).toBe('184,222 198,208 212,222 198,236');
        const [trunk] = trunks(html);
        expect(dOf(trunk)).toBe('M 144 222 L 184 222');
        expect(trunk).toContain('marker-end="url(#ir-arrow-open-g1)"');
    });

    it('g2 to B below: from the bottom vertex, nothing else', () => {
        const { g2 } = scene();
        const html = renderEdge(g2, FLOW(JS(false)));
        expect(firstPoint(dOf(visiblePath(html)))).toEqual([198, 236]);
        expect(polygons(html)).toEqual([]);
        expect(trunks(html)).toEqual([]);
    });
});

describe('UnifiedEdge — the guard of an Activity flow on a white patch', () => {
    it('the halo label of a flow with the flag takes the label background, padding, no text shadow', () => {
        const { f1 } = mergeScene();
        const html = renderEdge(f1, FLOW({ irActivityFlow: true, ...GUARD }), '[count < 2]');
        const span = /<span class="edge-label__text edge-label__text--halo"[^>]*>/.exec(html)?.[0] ?? '';
        expect(span).toContain('background:var(--color-edge-label-bg)');
        expect(span).toContain('padding:1px 4px');
        expect(span).toContain('text-shadow:none');
        expect(html).toContain('>[count &lt; 2]</span>');
    });

    it('the flag alone paints nothing: a flow with it and no label, no junction, renders the bytes of before', () => {
        const { f1 } = mergeScene();
        expect(digest(renderEdge(f1, FLOW({ irActivityFlow: true })))).toBe(PIN.flow);
    });
});

describe('SimNodeRunState inside the node (a derived view)', () => {
    const draw = (s: any, pending = false) => {
        sim.states = { O: s };
        sim.pending = new Set(pending ? ['O'] : []);
        return renderToStaticMarkup(createElement(SimNodeRunState, { objectId: 'O', placement: 'inside' }));
    };

    it('one token: the dot, no pill, no number', () => {
        const html = draw({ modelId: 'M', tokens: 1, sigma: [], enabled: false });
        expect(html).toContain('class="sim-node-run sim-node-run--inside"');
        expect(html).toContain('class="sim-node-run__dot"');
        expect(html).toContain('title="1 token in the run"');
        expect(html).not.toContain('sim-node-run__tokens');
        expect(html).not.toContain('sim-node-run__count');
    });

    it('no token: nothing painted; from two, the dot and the count', () => {
        const empty = draw({ modelId: 'M', tokens: 0, sigma: [], enabled: false });
        expect(empty).not.toContain('sim-node-run__dot');
        expect(empty).not.toContain('sim-node-run__tokens');
        const three = draw({ modelId: 'M', tokens: 3, sigma: [], enabled: false });
        expect(three).toContain('class="sim-node-run__dot"');
        expect(three).toContain('<span class="sim-node-run__count">3</span>');
        expect(three).toContain('title="3 tokens in the run"');
    });

    it('the enabled ring, the pending ring and the σ card stay as they are', () => {
        expect(draw({ modelId: 'M', tokens: null, sigma: [], enabled: true })).toContain('class="sim-node-run__ring"');
        expect(draw({ modelId: 'M', tokens: null, sigma: [], enabled: true }, true)).toContain('class="sim-node-run__pending"');
        expect(draw({ modelId: 'M', tokens: 1, sigma: [{ attr: 'visits', value: '3' }], enabled: false })).toContain('class="sim-node-run__sigma"');
    });
});

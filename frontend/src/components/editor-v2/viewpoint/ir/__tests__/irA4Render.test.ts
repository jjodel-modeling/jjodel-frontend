/**
 * Slice A4 (P-2026-09-30-0440, R-VP-23): the two end labels of an edge view, rendered.
 *
 * ── The subject is UnifiedEdge, rendered ──────────────────────────────────────
 * The bench of irA1Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas
 * write-back mocked, React Flow's node and edge hooks answering from `rf`): nodes measured, handles
 * where DynamicHandles places them (8×8, centred on the border at (k+1)/(N+1) of the side).
 *
 * «Absent» is measured against the A1+A3 tip: the markup digests below were taken on `47a7cceb1`
 * before any A4 edit, so an edge without the keys renders the bytes it rendered.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReactFlowProvider } from '@xyflow/react';

const rf: { nodes: Record<string, any>; edges: any[] } = { nodes: {}, edges: [] };

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
import { CARD_BOX_GAP, computeCardinalityAnchor } from '../../../utils/edgeUtils';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const INK = 'var(--color-inode-name)';
const HALO = { fontSize: '12px', fontWeight: 500, color: 'var(--color-inode-quiet)' };

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
/** The centre of a handle, on the outline. */
function centre(n: any, hid: string, type: 'source' | 'target') {
    const b = n.internals.handleBounds[type].find((h: any) => h.id === hid);
    const p = n.internals.positionAbsolute;
    return { x: p.x + b.x + b.width / 2, y: p.y + b.y + b.height / 2 };
}

interface EdgeSpec { id: string; source: string; target: string; sourceHandle: string; targetHandle: string }
function renderEdge(e: EdgeSpec, data: Record<string, unknown>, type = 'instanceRef', label = 'left'): string {
    const s = rfPoint(rf.nodes[e.source], e.sourceHandle, 'source');
    const t = rfPoint(rf.nodes[e.target], e.targetHandle, 'target');
    const props = {
        id: e.id, source: e.source, target: e.target, sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
        sourceHandleId: e.sourceHandle, targetHandleId: e.targetHandle, selected: false, label, type, data,
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}

/**
 * Chen: an entity A on the left, the relationship R (a diamond's box) in the middle, an entity B on the
 * right, one row; r1 R → A (R's left vertex to A's right side), r2 R → B. A diagonal r3 R → C, C below.
 */
function scene() {
    rf.nodes = {
        A: node('A', 0, 8, 120, 48, [['right-0', 'target', 'right', 1 / 2]]),
        R: node('R', 200, 0, 120, 64, [['left-0', 'source', 'left', 1 / 2], ['right-0', 'source', 'right', 1 / 2], ['bottom-0', 'source', 'bottom', 1 / 2]]),
        B: node('B', 400, 8, 120, 48, [['left-0', 'target', 'left', 1 / 2]]),
        C: node('C', 330, 200, 120, 48, [['top-0', 'target', 'top', 1 / 2]]),
    };
    const r1: EdgeSpec = { id: 'r1', source: 'R', target: 'A', sourceHandle: 'left-0', targetHandle: 'right-0' };
    const r2: EdgeSpec = { id: 'r2', source: 'R', target: 'B', sourceHandle: 'right-0', targetHandle: 'left-0' };
    const r3: EdgeSpec = { id: 'r3', source: 'R', target: 'C', sourceHandle: 'bottom-0', targetHandle: 'top-0' };
    rf.edges = [r1, r2, r3];
    return { r1, r2, r3 };
}
/** A Chen line as irEdgeViews decorates it: an arc, 1 px in the ink, no terminations, the reference name as its RF label. */
const LINE = {
    irEdgeViewId: 'V_rel_left', irCurve: 'arc', irSourceTermination: 'none', irTargetTermination: 'none',
    irStroke: INK, irStrokeWidth: 1, irLabelPlacement: 'auto', irLabelAlwaysVisible: false, referenceName: 'left',
};

/** Every end label: its class, its text, and the anchor its transform names. */
const endLabels = (html: string) => [...html.matchAll(/<div class="(edge-end-label[^"]*)" style="position:absolute;transform:(translate\([^)]*\) translate\([^)]*\));pointer-events:none"[^>]*>(.*?)<\/div>/g)]
    .map(m => ({ cls: m[1], transform: m[2], inner: m[3] }));
const px = (transform: string) => {
    const m = transform.match(/translate\((-?[\d.]+)px, (-?[\d.]+)px\)$/);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
};
const strip = (html: string) => html.replace(/<div class="edge-end-label[^"]*"[^>]*>.*?<\/div>/g, '');

describe('UnifiedEdge — without end labels: the A1+A3 tip\'s bytes', () => {
    it('a Chen line, an orthogonal IR edge with a centre label, and an M2 reference with its cardinality badge', () => {
        const { r1, r3 } = scene();
        const m2 = (() => {
            const s = rfPoint(rf.nodes.R, 'right-0', 'source'), t = rfPoint(rf.nodes.B, 'left-0', 'target');
            const props = {
                id: 'm2', source: 'R', target: 'B', sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
                sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label: 'items', type: 'reference',
                data: { reference: { id: 'm2', name: 'items', kind: 'association', lowerBound: 0, upperBound: -1 } },
            } as any;
            return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
        })();
        const got = {
            chenLine: digest(renderEdge(r1, LINE)),
            chenDiagonal: digest(renderEdge(r3, LINE)),
            irOrthogonal: digest(renderEdge(r3, { ...LINE, irCurve: undefined, irLabelText: 'x', irLabelAlwaysVisible: true, irLabelStyle: HALO }, 'instanceRef', 'x')),
            m2Reference: digest(m2),
        };
        expect(got).toEqual(PIN);
    });
});

describe('UnifiedEdge — edge.labels.targetEnd / sourceEnd (R-VP-23)', () => {
    it('the target end label is anchored by computeCardinalityAnchor at the arc\'s end, beside the entity', () => {
        const { r1 } = scene();
        const html = renderEdge(r1, { ...LINE, irTargetEndText: 'N', irLabelStyle: HALO });
        const labels = endLabels(html);
        expect(labels.length).toBe(1);
        const start = centre(rf.nodes.R, 'left-0', 'source'), end = centre(rf.nodes.A, 'right-0', 'target');
        expect(labels[0].transform).toBe(computeCardinalityAnchor(end.x, end.y, 'right', CARD_BOX_GAP, 0, [start, end]));
        // Outside A (its right side at x 120), within 12 px of the line's end.
        const at = px(labels[0].transform)!;
        expect(at.x).toBeGreaterThan(120);
        expect(Math.hypot(at.x - end.x, at.y - end.y)).toBeLessThanOrEqual(12);
    });

    it('declared with a style: the halo span of the centre label (R-VP-20 (5)), in the text\'s colour', () => {
        const { r1 } = scene();
        const [label] = endLabels(renderEdge(r1, { ...LINE, irTargetEndText: 'N', irLabelStyle: HALO }));
        expect(label.inner).toBe('<span class="edge-label__text edge-label__text--halo" style="color:var(--color-inode-quiet);font-size:12px;font-weight:500">N</span>');
    });

    it('without a style: the classic cardinality badge', () => {
        const { r1 } = scene();
        const [label] = endLabels(renderEdge(r1, { ...LINE, irTargetEndText: '1' }));
        expect(label.cls).toContain('edge-cardinality');
        expect(label.inner).toBe('1');
    });

    it('the source end label sits at the source end, outside the relationship, reading the path backwards', () => {
        const { r1 } = scene();
        const labels = endLabels(renderEdge(r1, { ...LINE, irSourceEndText: 'M', irLabelStyle: HALO }));
        expect(labels.length).toBe(1);
        const start = centre(rf.nodes.R, 'left-0', 'source'), end = centre(rf.nodes.A, 'right-0', 'target');
        expect(labels[0].transform).toBe(computeCardinalityAnchor(start.x, start.y, 'left', CARD_BOX_GAP, 0, [end, start]));
        const at = px(labels[0].transform)!;
        expect(at.x).toBeLessThan(200);
        expect(Math.hypot(at.x - start.x, at.y - start.y)).toBeLessThanOrEqual(12);
    });

    it('both ends at once: two labels, one at each end', () => {
        const { r2 } = scene();
        const labels = endLabels(renderEdge(r2, { ...LINE, irSourceEndText: 'a', irTargetEndText: 'b', irLabelStyle: HALO }));
        expect(labels.map(l => l.inner.replace(/<[^>]+>/g, ''))).toEqual(['a', 'b']);
        const [a, b] = labels.map(l => px(l.transform)!);
        expect(a.x).toBeGreaterThan(320);   // past R's right side
        expect(b.x).toBeLessThan(400);      // before B's left side
    });

    it('on a diagonal line the label takes the side the line does not come from', () => {
        const { r3 } = scene();
        const [label] = endLabels(renderEdge(r3, { ...LINE, irTargetEndText: 'N', irLabelStyle: HALO }));
        const start = centre(rf.nodes.R, 'bottom-0', 'source'), end = centre(rf.nodes.C, 'top-0', 'target');
        expect(label.transform).toBe(computeCardinalityAnchor(end.x, end.y, 'top', CARD_BOX_GAP, 0, [start, end]));
        // The line comes from the left (R's centre x 260 < C's 390): the label goes right of it, above C.
        const at = px(label.transform)!;
        expect(at.x).toBeGreaterThan(end.x);
        expect(at.y).toBeLessThan(200);
    });

    it('the source end reads the path backwards: its label takes the side the line does not leave towards', () => {
        const { r3 } = scene();
        const [label] = endLabels(renderEdge(r3, { ...LINE, irSourceEndText: '1', irLabelStyle: HALO }));
        const start = centre(rf.nodes.R, 'bottom-0', 'source'), end = centre(rf.nodes.C, 'top-0', 'target');
        expect(label.transform).toBe(computeCardinalityAnchor(start.x, start.y, 'bottom', CARD_BOX_GAP, 0, [end, start]));
        // The line leaves R's bottom towards the right (C's centre x 390 > 260): the label goes left of it, below R.
        const at = px(label.transform)!;
        expect(at.x).toBeLessThan(start.x);
        expect(at.y).toBeGreaterThan(64);
    });

    it('an orthogonal IR edge: anchored at the target handle, as the cardinality badge', () => {
        const { r3 } = scene();
        const html = renderEdge(r3, { ...LINE, irCurve: undefined, irTargetEndText: 'N', irLabelStyle: HALO });
        const [label] = endLabels(html);
        const t = rfPoint(rf.nodes.C, 'top-0', 'target');
        const at = px(label.transform)!;
        expect(Math.abs(at.y - (t.y - CARD_BOX_GAP))).toBeLessThanOrEqual(0.001);
        expect(Math.abs(at.x - t.x)).toBeLessThanOrEqual(4);
    });

    it('an empty text draws nothing; the rest of the edge is the edge without the keys, the portal\'s hidden M1 label aside', () => {
        const { r1 } = scene();
        expect(endLabels(renderEdge(r1, { ...LINE, irTargetEndText: '', irSourceEndText: '' }))).toEqual([]);
        expect(renderEdge(r1, { ...LINE, irTargetEndText: '', irSourceEndText: '' })).toBe(renderEdge(r1, LINE));
        // An end label mounts the label portal, which also holds the M1 reference label, hidden until
        // hover (`edge-label--m1-hover` without `--m1-visible`), as whenever the portal is mounted.
        const withKey = strip(renderEdge(r1, { ...LINE, irTargetEndText: 'N', irLabelStyle: HALO }));
        const m1Label = /<div class="edge-label  edge-label--m1-hover [^"]*"[^>]*>.*?<\/div>/;
        expect(withKey.match(m1Label)?.[0]).not.toContain('m1-visible');
        expect(withKey.replace(m1Label, '')).toBe(renderEdge(r1, { ...LINE, irLabelStyle: HALO }));
    });

    it('a classic edge ignores the keys: they are read on an IR-decorated edge only', () => {
        const { r1 } = scene();
        const classic = { referenceName: 'left', irTargetEndText: 'N' };
        expect(endLabels(renderEdge(r1, classic))).toEqual([]);
    });
});

/** Markup digests of the A1+A3 tip (`47a7cceb1`), before any A4 edit. */
const PIN = { chenLine: 'dd74aa35ed4c82b5', chenDiagonal: '976256cd76a69d41', irOrthogonal: '247b8c99275387f5', m2Reference: '48bb31a6dd4bebda' };

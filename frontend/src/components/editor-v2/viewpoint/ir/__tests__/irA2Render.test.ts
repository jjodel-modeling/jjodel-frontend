/**
 * Slice A2 (P-2026-09-30-1521, R-VP-24): the `hollowCircle` edge termination, rendered.
 *
 * ── The subject is UnifiedEdge, rendered ──────────────────────────────────────
 * The bench of irA4Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas
 * write-back mocked, React Flow's node and edge hooks answering from `rf`).
 *
 * «Absent» is measured against the A4 tip: the markup digests below were taken on `2cde09984` before
 * any A2 edit, so an edge with no hollowCircle end renders the bytes it rendered.
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
function renderEdge(e: EdgeSpec, data: Record<string, unknown>, type = 'instanceRef', label = 'src'): string {
    const s = rfPoint(rf.nodes[e.source], e.sourceHandle, 'source');
    const t = rfPoint(rf.nodes[e.target], e.targetHandle, 'target');
    const props = {
        id: e.id, source: e.source, target: e.target, sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
        sourceHandleId: e.sourceHandle, targetHandleId: e.targetHandle, selected: false, label, type, data,
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}

/** A place P on the left, a transition bar T on the right, one row: the arc P → T. */
function scene(): EdgeSpec {
    rf.nodes = {
        P: node('P', 0, 0, 44, 44, [['right-0', 'source', 'right', 1 / 2]]),
        T: node('T', 200, 0, 24, 44, [['left-0', 'target', 'left', 1 / 2]]),
    };
    const a: EdgeSpec = { id: 'a1', source: 'P', target: 'T', sourceHandle: 'right-0', targetHandle: 'left-0' };
    rf.edges = [a];
    return a;
}
/** An arc as irEdgeViews decorates a classic Petri arc: an arc, 1 px in the ink, the given ends. */
const ARC = (sourceEnd: string, targetEnd: string) => ({
    irEdgeViewId: 'V_arc', irCurve: 'arc', irSourceTermination: sourceEnd, irTargetTermination: targetEnd,
    irStroke: INK, irStrokeWidth: 1, irLabelPlacement: 'auto', irLabelAlwaysVisible: false, referenceName: 'src',
});
const markerIds = (html: string) => [...html.matchAll(/<marker id="([^"]+)"/g)].map(m => m[1]);
const pathEnds = (html: string) => {
    const m = /<path[^>]*class="reference-edge[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
    return { start: /marker-start="([^"]*)"/.exec(m)?.[1] ?? null, end: /marker-end="([^"]*)"/.exec(m)?.[1] ?? null };
};

/** Markup digests of the A4 tip (`2cde09984`), before any A2 edit. */
const PIN = { openArc: '84ef3dd354f35b4a', closedArc: 'ef06a15da8a2b7fd', plainArc: 'b4a45af6859b83fe', orthogonal: 'db6cf3ba93473584', m2Reference: '9f1a252e1ea7e1f9' };

describe('UnifiedEdge — an edge with no hollowCircle end renders the A4 tip\'s bytes', () => {
    it('an arc with the open arrowhead, one with the filled one, one with no end, an orthogonal IR edge, an M2 reference', () => {
        const a = scene();
        const m2 = (() => {
            const s = rfPoint(rf.nodes.P, 'right-0', 'source'), t = rfPoint(rf.nodes.T, 'left-0', 'target');
            const props = {
                id: 'm2', source: 'P', target: 'T', sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
                sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label: 'items', type: 'reference',
                data: { reference: { id: 'm2', name: 'items', kind: 'association', lowerBound: 0, upperBound: -1 } },
            } as any;
            return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
        })();
        expect({
            openArc: digest(renderEdge(a, ARC('none', 'openArrow'))),
            closedArc: digest(renderEdge(a, ARC('none', 'closedArrow'))),
            plainArc: digest(renderEdge(a, ARC('none', 'none'))),
            orthogonal: digest(renderEdge(a, { ...ARC('none', 'openArrow'), irCurve: undefined })),
            m2Reference: digest(m2),
        }).toEqual(PIN);
    });

    it('the five IR markers of before, and no circle, on an edge that does not use it', () => {
        const ids = markerIds(renderEdge(scene(), ARC('none', 'openArrow')));
        expect(ids.filter(i => i.startsWith('ir-'))).toEqual([
            'ir-arrow-open-a1', 'ir-arrow-closed-a1', 'ir-triangle-hollow-a1', 'ir-diamond-filled-a1', 'ir-diamond-hollow-a1',
        ]);
        // Positive control of the helper the circle tests read the ends with.
        expect(pathEnds(renderEdge(scene(), ARC('none', 'openArrow')))).toEqual({ start: null, end: 'url(#ir-arrow-open-a1)' });
        expect(pathEnds(renderEdge(scene(), ARC('hollowDiamond', 'none')))).toEqual({ start: 'url(#ir-diamond-hollow-a1)', end: null });
    });
});

describe('UnifiedEdge — the hollow circle end (R-VP-24, the inhibitor arc of Petri net (classic))', () => {
    it('at the target: the path ends on its own per-edge marker, a hollow circle in the line colour', () => {
        const html = renderEdge(scene(), ARC('none', 'hollowCircle'));
        expect(pathEnds(html)).toEqual({ start: null, end: 'url(#ir-circle-hollow-a1)' });
        const marker = /<marker id="ir-circle-hollow-a1"[^>]*>(.*?)<\/marker>/.exec(html);
        expect(marker).not.toBeNull();
        const [open] = marker![0].match(/<marker[^>]*>/)!;
        // The far side of the circle on the end point, oriented along the path, reversed at a start.
        expect(open).toMatch(/viewBox="0 0 10 10"/);
        expect(open).toMatch(/refX="9"/);
        expect(open).toMatch(/refY="5"/);
        expect(open).toMatch(/orient="auto-start-reverse"/);
        const circle = /<circle[^>]*>/.exec(marker![1])?.[0] ?? '';
        expect(circle).toMatch(/cx="5"/);
        expect(circle).toMatch(/cy="5"/);
        expect(circle).toMatch(/r="4"/);
        // Hollow: the class that fills with the marker fill token, the stroke tinted by line.color.
        expect(circle).toMatch(/class="reference-marker hollow"/);
        expect(circle).toMatch(new RegExp(`style="stroke:${INK.replace(/[()]/g, '\\$&')}"`));
    });

    it('at the source: the path starts on it, and the marker it names is mounted', () => {
        const html = renderEdge(scene(), ARC('hollowCircle', 'none'));
        expect(pathEnds(html)).toEqual({ start: 'url(#ir-circle-hollow-a1)', end: null });
        expect(markerIds(html)).toContain('ir-circle-hollow-a1');
    });

    it('mounted once when both ends use it, and only on the edge that uses it', () => {
        expect(markerIds(renderEdge(scene(), ARC('hollowCircle', 'hollowCircle'))).filter(i => i === 'ir-circle-hollow-a1')).toHaveLength(1);
        expect(markerIds(renderEdge(scene(), ARC('none', 'openArrow')))).not.toContain('ir-circle-hollow-a1');
    });

    it('an unknown end still draws nothing (the permissive render, R-B9-bis)', () => {
        expect(pathEnds(renderEdge(scene(), ARC('none', 'hollowcircle'))).end).toBeNull();
    });

    it('a classic edge ignores it: the termination is read on an IR-decorated edge only', () => {
        const html = renderEdge(scene(), { referenceName: 'src', irTargetTermination: 'hollowCircle' });
        expect(markerIds(html)).not.toContain('ir-circle-hollow-a1');
    });
});

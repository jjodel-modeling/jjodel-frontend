/**
 * Slice A1 (P-2026-09-30-0355, R-VP-22): the entry mark and the arc edge, rendered.
 *
 * ── The subjects are IRNodeContent and UnifiedEdge, rendered ─────────────────
 * The bench of irC2Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the
 * canvas write-back mocked), with one difference: React Flow's node and edge hooks answer from
 * `rf` below, so an edge sees its two nodes measured, with the handles DynamicHandles places
 * (8×8, centred on the border at (k+1)/(N+1) of the side), and the other edges of the canvas.
 * `sourceX`/`targetX` are what xyflow passes: the handle's outer edge, 4 px past the border.
 *
 * «Absent» is measured against the D tip: the markup digests below were taken on `c676fc6f6`
 * before any A1 edit, so an edge or a node without the keys renders the bytes it rendered.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { createElement, Fragment } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Provider } from 'react-redux';
import { ReactFlowProvider } from '@xyflow/react';

const state: { idlookup: Record<string, any> } = { idlookup: {} };
const rf: { nodes: Record<string, any>; edges: any[] } = { nodes: {}, edges: [] };

vi.mock('../../../../../joiner', () => ({
    store: { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a },
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

import IRNodeContent from '../IRNodeContent';
import UnifiedEdge from '../../../edges/UnifiedEdge';
import { clearCompileCache, compileView } from '../irCompile';
import { makeDrawReadCtx } from '../irReadCtx';
import type { VertexViewIR } from '../irTypes';

const digest = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16);
const INK = 'var(--color-inode-name)';

// ---------------------------------------------------------------------------
// IRNodeContent: the entry mark
// ---------------------------------------------------------------------------

function renderState(over: Partial<VertexViewIR['shape']> = {}): string {
    clearCompileCache();
    state.idlookup = {
        cls_S: { id: 'cls_S', className: 'DClass', name: 'State', extends: [] },
        s1: { id: 's1', className: 'DObject', instanceof: 'cls_S', name: 'locked', features: [] },
    };
    const ir: VertexViewIR = {
        irVersion: 'ir-1.2', kind: 'vertex', metaclasses: ['State'],
        shape: {
            form: 'rounded', fill: 'var(--color-inode-surface)', border: { color: INK, width: 1, style: 'solid' },
            labels: [{ position: 'center', source: { from: 'intrinsic', prop: 'name' }, style: { fontSize: 14, fontWeight: 'semibold', color: INK } }],
            ...over,
        },
    };
    const reduxStore = { getState: () => state, subscribe: () => () => {}, dispatch: (a: unknown) => a } as any;
    return renderToStaticMarkup(createElement(Provider, {
        store: reduxStore,
        children: createElement(IRNodeContent, { compiled: compileView('a1_state', ir), objectId: 's1', vertexId: 'v_s1', readCtx: makeDrawReadCtx(state.idlookup) }),
    }));
}
const entrySvg = (html: string) => html.match(/<svg class="ir-entry-svg[^"]*"[^>]*>.*?<\/svg>/)?.[0] ?? null;
const num = (s: string | undefined) => Number(s);

describe('IRNodeContent — the entry mark (ShapeSpec.entry)', () => {
    it('absent: the D tip\'s bytes, and no entry layer', () => {
        const html = renderState();
        expect(entrySvg(html)).toBeNull();
        expect(digest(html)).toBe(PIN.stateBox);
    });

    it('dot: a filled dot, then a line and a filled arrowhead whose tip is the layer\'s right edge', () => {
        const svg = entrySvg(renderState({ entry: 'dot' }))!;
        expect(svg).not.toBeNull();
        const width = num(svg.match(/ width="([\d.]+)"/)?.[1]);
        const height = num(svg.match(/ height="([\d.]+)"/)?.[1]);
        const circle = svg.match(/<circle cx="([\d.]+)" cy="([\d.]+)" r="([\d.]+)" fill="([^"]+)"/);
        expect(circle).not.toBeNull();
        const [cx, cy, r] = [num(circle![1]), num(circle![2]), num(circle![3])];
        // The dot sits at the far left, on the middle line, and is small (at most 14 px across).
        expect(cx - r).toBeGreaterThanOrEqual(0);
        expect(cy).toBe(height / 2);
        expect(2 * r).toBeLessThanOrEqual(14);
        // The arrowhead's tip is the rightmost point, on the right edge, at mid height: placed at
        // `right: 100%` of the box (irStyle.ts), it touches the box's left border and nothing more.
        const head = svg.match(/<path d="M ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) L ([\d.]+) ([\d.]+) Z"/);
        expect(head).not.toBeNull();
        expect([num(head![3]), num(head![4])]).toEqual([width, height / 2]);
        // Drawn in the border colour, as the marker is.
        expect(circle![4]).toBe(INK);
        expect(svg).toContain(`fill="${INK}"`);
        expect(svg).toContain(`stroke="${INK}"`);
        // A short arrow: the layer is at most 48 px wide.
        expect(width).toBeLessThanOrEqual(48);
    });

    it('arrow: the same arrow without the dot', () => {
        const svg = entrySvg(renderState({ entry: 'arrow' }))!;
        expect(svg).not.toBeNull();
        expect(svg).not.toContain('<circle');
        expect(svg).toMatch(/<path d="M [\d.]+ [\d.]+ L [\d.]+ [\d.]+ L [\d.]+ [\d.]+ Z"/);
    });

    it('the rest of the node is the node without the mark', () => {
        const withMark = renderState({ entry: 'dot' });
        expect(withMark.replace(entrySvg(withMark)!, '')).toBe(renderState());
    });
});

// ---------------------------------------------------------------------------
// UnifiedEdge: the arc
// ---------------------------------------------------------------------------

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
function renderEdge(e: EdgeSpec, data: Record<string, unknown>, label = 'coin'): string {
    const s = rfPoint(rf.nodes[e.source], e.sourceHandle, 'source');
    const t = rfPoint(rf.nodes[e.target], e.targetHandle, 'target');
    const props = {
        id: e.id, source: e.source, target: e.target, sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
        sourceHandleId: e.sourceHandle, targetHandleId: e.targetHandle, selected: false, label, type: 'instanceRef',
        data: { irEdgeViewId: 'V_t', irLabelAlwaysVisible: true, irLabelText: label, irTargetTermination: 'closedArrow', irStroke: INK, irStrokeWidth: 1, ...data },
    } as any;
    return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
}
/** The `d` of the drawn path (the hit path comes first with the same `d`). */
const pathD = (html: string) => html.match(/<path d="([^"]+)" fill="none" class="reference-edge/)?.[1] ?? '';
const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
/** The label's anchor, from its translate. */
const labelAt = (html: string) => {
    const m = html.match(/translate\(-50%, -50%\) translate\((-?[\d.]+)px, (-?[\d.]+)px\)/);
    return m ? { x: Number(m[1]), y: Number(m[2]) } : null;
};

/** locked (A) and unlocked (B) on one row, as the turnstile; t1 A → B, t2 B → A, t3 A → A. */
function scene(t1Upper: boolean) {
    const [f1, f2] = t1Upper ? [1 / 3, 2 / 3] : [2 / 3, 1 / 3];
    rf.nodes = {
        A: node('A', 0, 0, 120, 48, [['right-0', 'source', 'right', f1], ['right-0', 'target', 'right', f2], ['top-0', 'source', 'top', 1 / 3], ['top-0', 'target', 'top', 2 / 3]]),
        B: node('B', 400, 0, 120, 48, [['left-0', 'target', 'left', f1], ['left-0', 'source', 'left', f2]]),
    };
    const t1: EdgeSpec = { id: 't1', source: 'A', target: 'B', sourceHandle: 'right-0', targetHandle: 'left-0' };
    const t2: EdgeSpec = { id: 't2', source: 'B', target: 'A', sourceHandle: 'left-0', targetHandle: 'right-0' };
    const t3: EdgeSpec = { id: 't3', source: 'A', target: 'A', sourceHandle: 'top-0', targetHandle: 'top-0' };
    rf.edges = [t1, t2, t3];
    return { t1, t2, t3, f1, f2 };
}
const ARC = { irCurve: 'arc', irLabelStyle: { fontSize: '12px', fontWeight: 500, color: 'var(--color-inode-quiet)' } };

describe('UnifiedEdge — without curve: the D tip\'s bytes', () => {
    it('an IR edge, a self-loop and a reference edge, with their nodes measured (digests measured on the D tip)', () => {
        const { t1, t3 } = scene(true);
        const ref = { ...t1, id: 'r1' };
        const refHtml = (() => {
            const s = rfPoint(rf.nodes.A, 'right-0', 'source'), t = rfPoint(rf.nodes.B, 'left-0', 'target');
            const props = {
                id: ref.id, source: 'A', target: 'B', sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
                sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label: 'next', type: 'reference',
                data: { reference: { id: 'r1', name: 'next', kind: 'association' } },
            } as any;
            return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
        })();
        const got = {
            irEdge: digest(renderEdge(t1, { irLabelStyle: ARC.irLabelStyle })),
            irSelfLoop: digest(renderEdge(t3, {})),
            irStraight: digest(renderEdge(t1, { irRoutingHint: 'straight' })),
            reference: digest(refHtml),
        };
        expect(got).toEqual(PIN.edges);
    });
});

describe('UnifiedEdge — curve arc (R-VP-22)', () => {
    it('an opposite pair bows apart: each a quadratic whose control lies on its own side, away from the other', () => {
        for (const upper of [true, false]) {
            const { t1, t2 } = scene(upper);
            const d1 = pathD(renderEdge(t1, ARC)), d2 = pathD(renderEdge(t2, ARC, 'push'));
            expect(d1, `t1 upper=${upper}`).toMatch(/^M [-\d.]+ [-\d.]+ Q [-\d.]+ [-\d.]+ [-\d.]+ [-\d.]+$/);
            expect(d2).toMatch(/^M [-\d.]+ [-\d.]+ Q /);
            const [, y1s, , c1y, , y1t] = nums(d1);
            const [, y2s, , c2y, , y2t] = nums(d2);
            const chord1 = (y1s + y1t) / 2, chord2 = (y2s + y2t) / 2;
            // The upper chord bows up, the lower one down: the two arcs never meet.
            const s1 = Math.sign(c1y - chord1), s2 = Math.sign(c2y - chord2);
            expect(s1).toBe(chord1 < chord2 ? -1 : 1);
            expect(s2).toBe(-s1);
            // Apart by more than the chords: the apices are farther than the slots.
            const apex1 = (y1s + 2 * c1y + y1t) / 4, apex2 = (y2s + 2 * c2y + y2t) / 4;
            expect(Math.abs(apex1 - apex2)).toBeGreaterThan(Math.abs(chord1 - chord2) + 20);
        }
    });

    it('each label sits at its apex, on the outer side, within 12 px', () => {
        const { t1, t2 } = scene(true);
        for (const [e, name] of [[t1, 'coin'], [t2, 'push']] as const) {
            const html = renderEdge(e, ARC, name);
            const [x0, y0, cx, cy, x1, y1] = nums(pathD(html));
            const apex = { x: (x0 + 2 * cx + x1) / 4, y: (y0 + 2 * cy + y1) / 4 };
            const at = labelAt(html)!;
            expect(Math.hypot(at.x - apex.x, at.y - apex.y), name).toBeLessThanOrEqual(12);
            expect(Math.sign(at.y - apex.y), name).toBe(Math.sign(cy - (y0 + y1) / 2));
        }
    });

    it('the arrow tip is on the target\'s outline, not on the handle\'s outer edge (C3 cause 3)', () => {
        const { t1, t2 } = scene(true);
        const [x0, , , , x1] = nums(pathD(renderEdge(t1, ARC)));
        expect(Math.abs(x0 - 120)).toBeLessThanOrEqual(1);   // A's right side
        expect(Math.abs(x1 - 400)).toBeLessThanOrEqual(1);   // B's left side
        const [x2, , , , x3] = nums(pathD(renderEdge(t2, ARC, 'push')));
        expect(Math.abs(x2 - 400)).toBeLessThanOrEqual(1);
        expect(Math.abs(x3 - 120)).toBeLessThanOrEqual(1);
    });

    it('a single edge stays straight, from handle centre to handle centre, whatever the snap would do', () => {
        const { t1 } = scene(true);
        // The two ends 7 px apart in y: the router's 8 px snap would draw it level, off both anchors.
        rf.nodes.B = node('B', 400, 7, 120, 48, [['left-0', 'target', 'left', 1 / 3]]);
        rf.edges = [t1];
        const d = pathD(renderEdge(t1, ARC));
        expect(d).toMatch(/^M [-\d.]+ [-\d.]+ L [-\d.]+ [-\d.]+$/);
        expect(nums(d)).toEqual([120, 16, 400, 23]);
    });

    it('a self-loop is a cubic over the top edge: both ends on it, the loop above, the label above the loop', () => {
        const { t3 } = scene(true);
        const html = renderEdge(t3, ARC, 'push');
        const d = pathD(html);
        expect(d).toMatch(/^M [-\d.]+ [-\d.]+ C [-\d.]+ [-\d.]+,? [-\d.]+ [-\d.]+,? [-\d.]+ [-\d.]+$/);
        const [x0, y0, , c1y, , c2y, x1, y1] = nums(d);
        expect([x0, y0, x1, y1]).toEqual([40, 0, 80, 0]);   // the two top handles, on A's top edge
        expect(c1y).toBeLessThan(-32);
        expect(c2y).toBeLessThan(-32);
        const top = (y0 + 3 * c1y + 3 * c2y + y1) / 8;
        expect(labelAt(html)!.y).toBeLessThan(top);
    });

    it('a self-loop whose handles are not on top is still drawn over the top edge, at its centre', () => {
        scene(true);
        const loop: EdgeSpec = { id: 't4', source: 'A', target: 'A', sourceHandle: 'right-0', targetHandle: 'right-0' };
        rf.edges = [loop];
        const [x0, y0, , , , , x1, y1] = nums(pathD(renderEdge(loop, ARC)));
        expect([y0, y1]).toEqual([0, 0]);
        expect((x0 + x1) / 2).toBe(60);
    });
});

/** Markup digests of the D tip (`c676fc6f6`), before any A1 edit. */
const PIN = {
    stateBox: 'ff9502eeadfde0a1',
    edges: { irEdge: 'f9e649a65eec1012', irSelfLoop: '010be3f59473befc', irStraight: 'd2ba7fd8d6331a51', reference: '7152fdaa37b894f5' },
};

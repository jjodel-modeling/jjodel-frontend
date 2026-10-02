/**
 * Slice E (P-2026-09-30-1810): the edge ends, rendered by UnifiedEdge.
 *
 * ── The subject is UnifiedEdge, rendered ──────────────────────────────────────
 * The bench of irA2Render.test.ts (`renderToStaticMarkup` in node, the joiner barrel and the canvas
 * write-back mocked, React Flow's node and edge hooks answering from `rf`).
 *
 * «Absent» is measured against the tree before slice E: the markup digests in PIN were taken on
 * `77c2f946b` before any Phase 2 edit, so an edge that uses none of the additions renders the bytes it
 * rendered (the seven existing ends, an R-VP-23 end label, a classic M2 reference, an unknown end).
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

/** A on the left, B on the right, one row (a straight Manhattan run); C below B, for a two-segment route. */
function scene(): { ab: EdgeSpec; ac: EdgeSpec } {
    rf.nodes = {
        A: node('A', 0, 0, 100, 60, [['right-0', 'source', 'right', 1 / 2]]),
        B: node('B', 300, 0, 100, 60, [['left-0', 'target', 'left', 1 / 2]]),
        C: node('C', 300, 200, 100, 60, [['top-0', 'target', 'top', 1 / 2]]),
    };
    const ab: EdgeSpec = { id: 'e1', source: 'A', target: 'B', sourceHandle: 'right-0', targetHandle: 'left-0' };
    const ac: EdgeSpec = { id: 'e2', source: 'A', target: 'C', sourceHandle: 'right-0', targetHandle: 'top-0' };
    rf.edges = [ab, ac];
    return { ab, ac };
}
/** An edge as irEdgeViews decorates it: the given ends, 1 px in the ink unless `width` says otherwise. */
const IR = (sourceEnd: string, targetEnd: string, extra: Record<string, unknown> = {}) => ({
    irEdgeViewId: 'V_e', irSourceTermination: sourceEnd, irTargetTermination: targetEnd,
    irStroke: INK, irStrokeWidth: 1, irLabelPlacement: 'auto', irLabelAlwaysVisible: false, referenceName: 'src', ...extra,
});
const markerIds = (html: string) => [...html.matchAll(/<marker id="([^"]+)"/g)].map(m => m[1]);
const visiblePath = (html: string) => /<path[^>]*class="reference-edge[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
const hitPath = (html: string) => /<path d="([^"]*)" fill="none" stroke="transparent"/.exec(html)?.[1] ?? '';
const attr = (tag: string, name: string) => new RegExp(`${name}="([^"]*)"`).exec(tag)?.[1] ?? null;
const pts = (d: string) => (d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? []).map(Number);
const lastPoint = (d: string) => { const n = pts(d); return { x: n[n.length - 2], y: n[n.length - 1] }; };
const firstPoint = (d: string) => { const n = pts(d); return { x: n[0], y: n[1] }; };
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const markerTag = (html: string, id: string) => new RegExp(`<marker id="${id}"[^>]*>`).exec(html)?.[0] ?? '';

/** The scenarios whose markup must not move. */
function pinScenarios(): Record<string, string> {
    const { ab, ac } = scene();
    const m2 = (() => {
        const s = rfPoint(rf.nodes.A, 'right-0', 'source'), t = rfPoint(rf.nodes.B, 'left-0', 'target');
        const props = {
            id: 'm2', source: 'A', target: 'B', sourceX: s.x, sourceY: s.y, targetX: t.x, targetY: t.y,
            sourceHandleId: 'right-0', targetHandleId: 'left-0', selected: false, label: 'items', type: 'reference',
            data: { reference: { id: 'm2', name: 'items', kind: 'association', lowerBound: 0, upperBound: -1 } },
        } as any;
        return renderToStaticMarkup(createElement(ReactFlowProvider, { children: createElement(UnifiedEdge, props) }));
    })();
    return {
        orthoOpen: renderEdge(ab, IR('none', 'openArrow')),
        orthoTwoSegDiamonds: renderEdge(ac, IR('filledDiamond', 'hollowDiamond', { irStrokeWidth: 2 })),
        straightTriangle: renderEdge(ab, IR('hollowTriangle', 'closedArrow', { irRoutingHint: 'straight' })),
        curvedClosed: renderEdge(ac, IR('none', 'closedArrow', { irRoutingHint: 'curved' })),
        arcHollowCircle: renderEdge(ab, IR('none', 'hollowCircle', { irCurve: 'arc' })),
        arcEndLabelsHalo: renderEdge(ab, IR('none', 'none', { irCurve: 'arc', irSourceEndText: '1', irTargetEndText: 'N', irLabelStyle: { fontSize: '12px' } })),
        orthoEndLabelsBadge: renderEdge(ac, IR('none', 'openArrow', { irTargetEndText: '0..*' })),
        unknownEnd: renderEdge(ab, IR('bogus', 'crowsFoot')),
        m2Reference: m2,
    };
}

/** Markup digests of `77c2f946b` (the Phase 1 report commit, no Phase 2 edit). */
const PIN: Record<string, string> = {
    orthoOpen: '7d03cd18c38ccc7a', orthoTwoSegDiamonds: 'd0037ddeb20658d6', straightTriangle: '3fd267522353436a',
    curvedClosed: '62fff8ec605d1462', arcHollowCircle: '5cd5182af7e51ce1', arcEndLabelsHalo: 'ea5c1d8421356061',
    orthoEndLabelsBadge: '2018a2b695026de7', unknownEnd: '61061a95346495cb', m2Reference: 'e1b7585bb9c50d5f',
};

describe('UnifiedEdge — an edge using none of the additions renders the pre-slice bytes', () => {
    it('the seven existing ends on the four routes, the R-VP-23 end labels, an unknown end, an M2 reference', () => {
        const got = Object.fromEntries(Object.entries(pinScenarios()).map(([k, v]) => [k, digest(v)]));
        if (process.env.EE_PRINT_PINS) console.log('PINS', JSON.stringify(got));
        expect(got).toEqual(PIN);
    });
});

describe('UnifiedEdge — the seven new ends', () => {
    it('an orthogonal edge: one marker per new end, the line stops at each glyph\'s back, the hit path does not', () => {
        const { ab } = scene();
        const html = renderEdge(ab, IR('bar', 'erZeroOrMany'));
        expect(markerIds(html)).toEqual(expect.arrayContaining(['ir-end-source-e1', 'ir-end-target-e1']));
        const vis = visiblePath(html);
        expect([attr(vis, 'marker-start'), attr(vis, 'marker-end')]).toEqual(['url(#ir-end-source-e1)', 'url(#ir-end-target-e1)']);
        const d = attr(vis, 'd')!;
        const hit = hitPath(html);
        expect(dist(lastPoint(d), lastPoint(hit))).toBeCloseTo(20, 1);
        expect(dist(firstPoint(d), firstPoint(hit))).toBeCloseTo(8, 1);
        expect(lastPoint(d).y).toBeCloseTo(lastPoint(hit).y, 5);
        const mt = markerTag(html, 'ir-end-target-e1');
        expect([attr(mt, 'refX'), attr(mt, 'markerUnits'), Number(attr(mt, 'orient'))]).toEqual(['-20', 'userSpaceOnUse', 0]);
        const ms = markerTag(html, 'ir-end-source-e1');
        expect([attr(ms, 'refX'), Math.abs(Number(attr(ms, 'orient')))]).toEqual(['-8', 180]);
    });

    it('the circle of a zero end takes the canvas background, the disc of filledCircle the ink', () => {
        const { ab } = scene();
        const html = renderEdge(ab, IR('filledCircle', 'erZeroOrOne'));
        const target = /<marker id="ir-end-target-e1"[\s\S]*?<\/marker>/.exec(html)![0];
        const source = /<marker id="ir-end-source-e1"[\s\S]*?<\/marker>/.exec(html)![0];
        expect(target).toContain('class="ir-end-glyph ir-end-glyph--hollow"');
        expect(target).not.toContain('ir-end-glyph--filled');
        expect(source).toContain('class="ir-end-glyph ir-end-glyph--filled"');
        expect(source).not.toContain('ir-end-glyph--hollow');
    });

    it('the glyph stroke follows the resolved width and colour; the geometry and the trim do not', () => {
        const { ab } = scene();
        for (const w of [1, 2]) {
            const html = renderEdge(ab, IR('none', 'erOneOrMany', { irStrokeWidth: w }));
            const target = /<marker id="ir-end-target-e1"[\s\S]*?<\/marker>/.exec(html)![0];
            const glyph = /<path[^>]*class="ir-end-glyph"[^>]*>/.exec(target)![0];
            expect(attr(glyph, 'stroke-width'), `w=${w}`).toBe(String(w));
            expect(attr(glyph, 'style'), `w=${w}`).toContain(`stroke:${INK}`);
            expect(dist(lastPoint(attr(visiblePath(html), 'd')!), lastPoint(hitPath(html))), `w=${w}`).toBeCloseTo(14, 1);
        }
    });

    it('a two-segment Manhattan route: the end glyph enters C from above, on the last segment\'s axis', () => {
        const { ac } = scene();
        const html = renderEdge(ac, IR('none', 'erOneOrMany'));
        const d = attr(visiblePath(html), 'd')!;
        const tip = lastPoint(hitPath(html));
        expect(lastPoint(d).x).toBeCloseTo(tip.x, 5);
        expect(tip.y - lastPoint(d).y).toBeCloseTo(14, 1);
        expect(Number(attr(markerTag(html, 'ir-end-target-e2'), 'orient'))).toBeCloseTo(90, 5);
    });

    it('straight, curved and arc: the line stops at the back, the glyph lies on the chord to the tip', () => {
        const { ab, ac } = scene();
        for (const [name, e, extra] of [
            ['straight', ac, { irRoutingHint: 'straight' }], ['curved', ac, { irRoutingHint: 'curved' }], ['arc', ac, { irCurve: 'arc' }],
        ] as const) {
            const html = renderEdge(e, IR('cross', 'erZeroOrMany', extra));
            const d = attr(visiblePath(html), 'd')!;
            const hit = hitPath(html);
            const tip = lastPoint(hit), at = lastPoint(d);
            expect(dist(at, tip), name).toBeCloseTo(20, 0);
            const angle = Math.atan2(tip.y - at.y, tip.x - at.x) * 180 / Math.PI;
            expect(Number(attr(markerTag(html, `ir-end-target-${e.id}`), 'orient')), name).toBeCloseTo(angle, 1);
            expect(dist(firstPoint(d), firstPoint(hit)), name).toBeCloseTo(14, 0);
        }
        void ab;
    });

    it('an end label pair: the multiplicity where R-VP-23 puts it, the role on the other side of the line', () => {
        const { ab } = scene();
        const html = renderEdge(ab, IR('none', 'none', { irTargetEndText: 'N', irTargetEndRole: 'owner' }));
        const mult = /<div class="edge-end-label edge-cardinality[^"]*"[^>]*>N<\/div>/.exec(html)?.[0] ?? '';
        const role = /<div class="edge-end-label edge-end-label--role edge-cardinality[^"]*"[^>]*>owner<\/div>/.exec(html)?.[0] ?? '';
        expect(mult).not.toBe('');
        expect(role).not.toBe('');
        const t = rfPoint(rf.nodes.B, 'left-0', 'target');
        expect(attr(mult, 'style')).toContain(`translate(-100%, 0%) translate(${t.x - 8}px, ${t.y + 4}px)`);
        expect(attr(role, 'style')).toContain(`translate(-100%, -100%) translate(${t.x - 8}px, ${t.y - 4}px)`);
        // Beside a new glyph both labels clear it along the axis by its back.
        const g = renderEdge(ab, IR('none', 'erZeroOrMany', { irTargetEndText: 'N', irTargetEndRole: 'owner' }));
        expect(g).toContain(`translate(${t.x - 8 - 20}px, ${t.y + 4}px)`);
        expect(g).toContain(`translate(${t.x - 8 - 20}px, ${t.y - 4}px)`);
        // A role alone mounts the label portal.
        expect(renderEdge(ab, IR('none', 'none', { irSourceEndRole: 'items' }))).toContain('>items</div>');
    });
});

/**
 * P-2026-10-02-1505: the trunk of an Activity (UML) junction (P-2026-09-30-1935) carries the edge's own target end.
 * A new end's marker is cut and oriented per line, so the trunk takes its own. W's decision trunk runs right while
 * the branch enters A from below; the merge trunk of f1 runs right into W.
 */
function junctionScene(): { w1: EdgeSpec; f1: EdgeSpec } {
    rf.nodes = {
        W: node('W', 0, 100, 140, 44, [['right-0', 'source', 'right', 1 / 2], ['left-0', 'target', 'left', 1 / 2]]),
        A: node('A', 400, 0, 100, 40, [['bottom-0', 'target', 'bottom', 1 / 2]]),
        I: node('I', -400, 300, 20, 20, [['top-0', 'source', 'top', 1 / 2]]),
    };
    const w1: EdgeSpec = { id: 'w1', source: 'W', target: 'A', sourceHandle: 'right-0', targetHandle: 'bottom-0' };
    const f1: EdgeSpec = { id: 'f1', source: 'I', target: 'W', sourceHandle: 'top-0', targetHandle: 'left-0' };
    rf.edges = [w1, f1];
    return { w1, f1 };
}
const trunkPath = (html: string) => /<path[^>]*class="[^"]*ir-junction-trunk[^"]*"[^>]*>/.exec(html)?.[0] ?? '';
const DECISION = { irJunctionSource: { kind: 'decision', side: 'right', primary: true } };
const MERGE = { irJunctionTarget: { kind: 'merge', side: 'left', primary: true } };

describe('UnifiedEdge — a junction trunk with a new end (P-2026-10-02-1505)', () => {
    it('a decision trunk: its own marker, cut at the glyph\'s back and oriented on the trunk, not on the branch', () => {
        const { w1 } = junctionScene();
        const html = renderEdge(w1, IR('none', 'bar', DECISION));
        const trunk = trunkPath(html);
        expect(attr(trunk, 'marker-end')).toBe('url(#ir-end-trunk-out-w1)');
        // The trunk runs right from the handle point to the diamond's near vertex, 40 px; the bar's back is 8.
        const s = rfPoint(rf.nodes.W, 'right-0', 'source');
        expect(pts(attr(trunk, 'd')!)).toEqual([s.x, s.y, s.x + 32, s.y]);
        const mt = markerTag(html, 'ir-end-trunk-out-w1');
        expect([attr(mt, 'refX'), Number(attr(mt, 'orient'))]).toEqual(['-8', 0]);
        // The branch keeps its own marker: it enters A from below.
        expect(Number(attr(markerTag(html, 'ir-end-target-w1'), 'orient'))).toBeCloseTo(-90, 5);
    });

    it('a merge trunk: the same, into the action', () => {
        const { f1 } = junctionScene();
        const html = renderEdge(f1, IR('none', 'erExactlyOne', MERGE));
        const trunk = trunkPath(html);
        expect(attr(trunk, 'marker-end')).toBe('url(#ir-end-trunk-in-f1)');
        const t = rfPoint(rf.nodes.W, 'left-0', 'target');
        expect(pts(attr(trunk, 'd')!)).toEqual([t.x - 40, t.y, t.x - 12, t.y]);
        const mt = markerTag(html, 'ir-end-trunk-in-f1');
        expect([attr(mt, 'refX'), Number(attr(mt, 'orient'))]).toEqual(['-12', 0]);
    });

    it('an old end keeps the edge\'s own marker on the trunk: no trunk marker, the trunk uncut', () => {
        const { w1 } = junctionScene();
        const html = renderEdge(w1, IR('none', 'openArrow', DECISION));
        const trunk = trunkPath(html);
        expect(attr(trunk, 'marker-end')).toBe('url(#ir-arrow-open-w1)');
        expect(markerIds(html).some(m => m.startsWith('ir-end-trunk'))).toBe(false);
        const s = rfPoint(rf.nodes.W, 'right-0', 'source');
        expect(pts(attr(trunk, 'd')!)).toEqual([s.x, s.y, s.x + 40, s.y]);
    });
});

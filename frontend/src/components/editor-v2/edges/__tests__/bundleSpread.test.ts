/**
 * Regression test for applyBundleSpread (defect S1).
 *
 * Baseline captured in docs/discovery/2026-07-06-family-member-capture.md: the old
 * index-based spread produced 6 crossings on the Family<->Member bundle (4 containment
 * + 4 eOpposite) because the trunk offsets followed the handle index / edge direction
 * instead of the physical anchor order (byGeometry + byPairStable).
 *
 * These tests drive the REAL pipeline (computePortDistribution -> computeSideEndpoints /
 * computeSidePositions -> computeManhattanPath) and the REAL applyBundleSpread on both a
 * side-by-side (opposite-H) and a stacked (opposite-V) bundle, plus pure unit checks.
 * Acceptance criteria (capture doc §5): AC1 zero crossings, AC2 trunk offsets monotonic
 * in the physical position (nested corridors), AC3 invariants preserved.
 */
import { describe, it, expect } from 'vitest';
import { applyBundleSpread, BUNDLE_SPREAD_GAIN, type Point } from '../bundleSpread';
import { computePortDistribution, type EdgeMinimal, type NodePosition } from '../../utils/portDistribution';
import { computeSideEndpoints, computeSidePositions } from '../../utils/handlePosition';
import { computeManhattanPath, parsePathPoints, getSideFromHandle } from '../../utils/edgeUtils';

type Rect = { x: number; y: number; w: number; h: number };
type BaseSide = 'left' | 'right' | 'top' | 'bottom';

// Proper interior intersection of an axis-aligned H segment and a V segment.
function segCross(p: Point, q: Point, r: Point, s: Point): boolean {
    const horiz = (a: Point, b: Point) => Math.abs(a.y - b.y) < 0.01;
    const vert = (a: Point, b: Point) => Math.abs(a.x - b.x) < 0.01;
    let H: [Point, Point] | null = null, V: [Point, Point] | null = null;
    if (horiz(p, q) && vert(r, s)) { H = [p, q]; V = [r, s]; }
    else if (vert(p, q) && horiz(r, s)) { H = [r, s]; V = [p, q]; }
    else return false;
    const [h1, h2] = H, [v1, v2] = V;
    const hxmin = Math.min(h1.x, h2.x), hxmax = Math.max(h1.x, h2.x);
    const vymin = Math.min(v1.y, v2.y), vymax = Math.max(v1.y, v2.y);
    return v1.x > hxmin + 0.01 && v1.x < hxmax - 0.01 && h1.y > vymin + 0.01 && h1.y < vymax - 0.01;
}
function countCrossingPairs(paths: Point[][]): number {
    let pairs = 0;
    for (let i = 0; i < paths.length; i++) for (let j = i + 1; j < paths.length; j++) {
        const A = paths[i], B = paths[j];
        let crossed = false;
        for (let a = 0; a < A.length - 1 && !crossed; a++) for (let b = 0; b < B.length - 1 && !crossed; b++) {
            if (segCross(A[a], A[a + 1], B[b], B[b + 1])) crossed = true;
        }
        if (crossed) pairs++;
    }
    return pairs;
}

function anchorCoord(n: Rect, side: BaseSide, frac: number): Point {
    switch (side) {
        case 'left': return { x: n.x, y: n.y + frac * n.h };
        case 'right': return { x: n.x + n.w, y: n.y + frac * n.h };
        case 'top': return { x: n.x + frac * n.w, y: n.y };
        case 'bottom': return { x: n.x + frac * n.w, y: n.y + n.h };
    }
}

// Drive the real pipeline for a bundle and return each edge's spread path + geometry.
function buildBundle(nodes: Record<string, Rect>, baseEdges: EdgeMinimal[]) {
    const positions = new Map<string, NodePosition>(
        Object.entries(nodes).map(([id, n]) => [id, { centerX: n.x + n.w / 2, centerY: n.y + n.h / 2 }]),
    );
    const { edgeHandles } = computePortDistribution(baseEdges, Object.keys(nodes), positions);
    const indexed: EdgeMinimal[] = baseEdges.map(e => ({
        ...e,
        sourceHandle: edgeHandles.get(e.id)!.sourceHandle,
        targetHandle: edgeHandles.get(e.id)!.targetHandle,
    }));

    const fracCache = new Map<string, Map<string, number>>();
    const fracFor = (nodeId: string, side: BaseSide) => {
        const key = `${nodeId}:${side}`;
        if (!fracCache.has(key)) fracCache.set(key, computeSidePositions(computeSideEndpoints(indexed as any, nodeId, side), positions));
        return fracCache.get(key)!;
    };

    const bundleCenter: Point = (() => {
        const ids = Object.keys(nodes);
        const cx = ids.reduce((s, id) => s + nodes[id].x + nodes[id].w / 2, 0) / ids.length;
        const cy = ids.reduce((s, id) => s + nodes[id].y + nodes[id].h / 2, 0) / ids.length;
        return { x: cx, y: cy };
    })();

    return indexed.map(e => {
        const srcSide = getSideFromHandle(e.sourceHandle) as BaseSide;
        const tgtSide = getSideFromHandle(e.targetHandle) as BaseSide;
        const srcFrac = fracFor(e.source, srcSide).get(`${e.sourceHandle}:source`) ?? 0.5;
        const tgtFrac = fracFor(e.target, tgtSide).get(`${e.targetHandle}:target`) ?? 0.5;
        const src = anchorCoord(nodes[e.source], srcSide, srcFrac);
        const tgt = anchorCoord(nodes[e.target], tgtSide, tgtFrac);
        const pts = parsePathPoints(computeManhattanPath(src.x, src.y, srcSide, tgt.x, tgt.y, tgtSide));
        const spread = applyBundleSpread(pts, bundleCenter);
        return { id: e.id, src, tgt, meanX: (src.x + tgt.x) / 2, meanY: (src.y + tgt.y) / 2, spread };
    });
}

// 4 containment A->B + 4 eOpposite B->A, interleaved ids (physical order alternates directions).
function biDirEdges(A: string, B: string, sA: BaseSide, tB: BaseSide, sB: BaseSide, tA: BaseSide): EdgeMinimal[] {
    return [
        { id: 'a', source: A, target: B, sourceHandle: `${sA}-0`, targetHandle: `${tB}-0`, type: 'reference' },
        { id: 'b', source: B, target: A, sourceHandle: `${sB}-0`, targetHandle: `${tA}-0`, type: 'reference' },
        { id: 'c', source: A, target: B, sourceHandle: `${sA}-0`, targetHandle: `${tB}-0`, type: 'reference' },
        { id: 'd', source: B, target: A, sourceHandle: `${sB}-0`, targetHandle: `${tA}-0`, type: 'reference' },
        { id: 'e', source: A, target: B, sourceHandle: `${sA}-0`, targetHandle: `${tB}-0`, type: 'reference' },
        { id: 'f', source: B, target: A, sourceHandle: `${sB}-0`, targetHandle: `${tA}-0`, type: 'reference' },
        { id: 'g', source: A, target: B, sourceHandle: `${sA}-0`, targetHandle: `${tB}-0`, type: 'reference' },
        { id: 'h', source: B, target: A, sourceHandle: `${sB}-0`, targetHandle: `${tA}-0`, type: 'reference' },
    ];
}

function assertStrictlyMonotonic(vals: number[], label: string) {
    const dir = Math.sign(vals[1] - vals[0]);
    expect(dir, `${label}: first step degenerate`).not.toBe(0);
    for (let i = 1; i < vals.length; i++) {
        expect(Math.sign(vals[i] - vals[i - 1]), `${label}: inversion at index ${i}`).toBe(dir);
    }
}

describe('applyBundleSpread — opposite-H bundle (side by side, Family<->Member)', () => {
    // Member right of Family and slightly BELOW → routes are Z-shapes, downward shear.
    const bundle = buildBundle(
        { Family: { x: 0, y: 0, w: 180, h: 120 }, Member: { x: 400, y: 40, w: 180, h: 120 } },
        biDirEdges('Family', 'Member', 'right', 'left', 'left', 'right'),
    );

    it('AC3: every edge is a 4-point Z (point count invariant)', () => {
        for (const e of bundle) expect(e.spread.length, `edge ${e.id}`).toBe(4);
    });
    it('AC1: zero crossings (baseline was 6)', () => {
        expect(countCrossingPairs(bundle.map(e => e.spread))).toBe(0);
    });
    it('AC2: trunk X strictly monotonic in physical order (meanY) — nested corridors', () => {
        const sorted = [...bundle].sort((a, b) => a.meanY - b.meanY);
        assertStrictlyMonotonic(sorted.map(e => e.spread[1].x), 'trunkX');
    });
});

describe('applyBundleSpread — opposite-V bundle (stacked)', () => {
    // Member below Family and slightly to the RIGHT → Z-shapes with horizontal trunk.
    const bundle = buildBundle(
        { Family: { x: 0, y: 0, w: 180, h: 120 }, Member: { x: 40, y: 400, w: 180, h: 120 } },
        biDirEdges('Family', 'Member', 'bottom', 'top', 'top', 'bottom'),
    );

    it('AC3: every edge is a 4-point Z (point count invariant)', () => {
        for (const e of bundle) expect(e.spread.length, `edge ${e.id}`).toBe(4);
    });
    it('AC1: zero crossings', () => {
        expect(countCrossingPairs(bundle.map(e => e.spread))).toBe(0);
    });
    it('AC2: trunk Y strictly monotonic in physical order (meanX) — nested corridors', () => {
        const sorted = [...bundle].sort((a, b) => a.meanX - b.meanX);
        assertStrictlyMonotonic(sorted.map(e => e.spread[1].y), 'trunkY');
    });
});

describe('applyBundleSpread — pure unit behavior', () => {
    // Vertical-middle (opposite-H) Z with downward shear (tgtY > srcY): [src,(midX,srcY),(midX,tgtY),tgt].
    const zV = (srcY: number, tgtY: number): Point[] => [
        { x: 180, y: srcY }, { x: 290, y: srcY }, { x: 290, y: tgtY }, { x: 400, y: tgtY },
    ];
    const center: Point = { x: 290, y: 80 };

    it('offset = -shear*(meanY-center)*gain, centered on the bundle center', () => {
        // meanY == center.y → no offset (trunk at midX).
        expect(applyBundleSpread(zV(60, 100), center)[1].x).toBeCloseTo(290); // meanY 80
        // Downward shear (+1), meanY 90 → offset -1*(90-80)*gain.
        expect(applyBundleSpread(zV(60, 120), center)[1].x).toBeCloseTo(290 - 10 * BUNDLE_SPREAD_GAIN);
        // meanY 50 → offset -1*(50-80)*gain = +30*gain.
        expect(applyBundleSpread(zV(40, 60), center)[1].x).toBeCloseTo(290 + 30 * BUNDLE_SPREAD_GAIN);
    });

    it('fan direction flips with the shear (upward-sheared bundle mirrors)', () => {
        // Upward shear: target ABOVE source (tgtY < srcY) → shear -1.
        const up = (srcY: number, tgtY: number): Point[] => [
            { x: 180, y: srcY }, { x: 290, y: srcY }, { x: 290, y: tgtY }, { x: 400, y: tgtY },
        ];
        // meanY 90, shear -1 → offset -(-1)*(90-80)*gain = +10*gain (opposite sign vs downward).
        expect(applyBundleSpread(up(120, 60), center)[1].x).toBeCloseTo(290 + 10 * BUNDLE_SPREAD_GAIN);
    });

    it('monotonic offsets for a fixed-shear set (index never consulted)', () => {
        const trunkXs = [20, 50, 90, 140].map(m => applyBundleSpread(zV(m, m + 40), center)[1].x);
        // downward shear → trunk X decreasing as meanY increases.
        assertStrictlyMonotonic(trunkXs, 'unit trunkX');
        expect(Math.sign(trunkXs[1] - trunkXs[0])).toBe(-1);
    });

    it('AC3 guards: non-4-point path and null center return input unchanged', () => {
        const threePt: Point[] = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }];
        expect(applyBundleSpread(threePt, { x: 5, y: 5 })).toEqual(threePt);
        const z = zV(60, 120);
        expect(applyBundleSpread(z, null)).toEqual(z); // no center → no offset
    });
});

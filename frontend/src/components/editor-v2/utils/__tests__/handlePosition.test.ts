import { describe, it, expect } from 'vitest';
import { computeSidePositions, computeSideEndpoints, type SideEndpoint } from '../handlePosition';

// Centroid helper: NodePosition is { centerX, centerY }.
const pos = (centerX: number, centerY: number) => ({ centerX, centerY });

describe('computeSidePositions — geometry-aware ordering (Option A)', () => {
    // Case 1 — cross-role mixed (has / labs on Department.left).
    // has  = target endpoint, opposite Università (higher on screen, smaller Y)
    // labs = source endpoint, opposite Laboratory (lower on screen, larger Y)
    // Expected: has above labs (smaller top%), inverting the pre-fix role-primary order.
    it('cross-role: the endpoint whose opposite node is higher sits higher', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Universita' },
            { handleId: 'left-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'Laboratory' },
        ];
        const positions = new Map([
            ['Universita', pos(0, 100)],
            ['Laboratory', pos(0, 800)],
        ]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('left-0:target')).toBeCloseTo(1 / 3); // has → top
        expect(r.get('left-0:source')).toBeCloseTo(2 / 3); // labs → bottom
        expect(r.get('left-0:target')!).toBeLessThan(r.get('left-0:source')!);
    });

    // REQUIRED safety net for the computeHandlePositionForNode -> useTreeLayout path:
    // with no nodePositions, the output must be byte-identical to the previous
    // role-primary behavior (source before target). If this regresses, the fix
    // must NOT be committed.
    it('fallback (no nodePositions): role-primary order, source above target', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Universita' },
            { handleId: 'left-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'Laboratory' },
        ];
        const r = computeSidePositions(endpoints); // no geometry
        expect(r.get('left-0:source')).toBeCloseTo(1 / 3); // source first (role-primary)
        expect(r.get('left-0:target')).toBeCloseTo(2 / 3);
    });

    // Case 2 — same-role same-side (D6): geometry is authoritative even when the
    // handle index order disagrees with it.
    it('same-role (sources): orders by opposite Y, overriding index order', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'right-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'Low' },  // opp lower (Y=800)
            { handleId: 'right-1', role: 'source', edgeType: 'reference', oppositeNodeId: 'High' }, // opp higher (Y=100)
        ];
        const positions = new Map([['Low', pos(0, 800)], ['High', pos(0, 100)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('right-1:source')!).toBeLessThan(r.get('right-0:source')!); // High above Low
        expect(r.get('right-1:source')).toBeCloseTo(1 / 3);
        expect(r.get('right-0:source')).toBeCloseTo(2 / 3);
    });

    it('same-role (targets, dual): orders by opposite Y', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'right-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Low' },
            { handleId: 'right-1', role: 'target', edgeType: 'reference', oppositeNodeId: 'High' },
        ];
        const positions = new Map([['Low', pos(0, 800)], ['High', pos(0, 100)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('right-1:target')!).toBeLessThan(r.get('right-0:target')!);
    });

    // D6 regression-free: in production portDistribution assigns the lower index to
    // the lower-Y opposite, so index and geometry agree → identical to the old order.
    it('same-role regression-free: aligned index == geometry == fallback', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'right-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'A' }, // Y=100
            { handleId: 'right-1', role: 'source', edgeType: 'reference', oppositeNodeId: 'B' }, // Y=800
        ];
        const positions = new Map([['A', pos(0, 100)], ['B', pos(0, 800)]]);
        const geom = computeSidePositions(endpoints, positions);
        const fallback = computeSidePositions(endpoints);
        expect(geom.get('right-0:source')).toEqual(fallback.get('right-0:source'));
        expect(geom.get('right-1:source')).toEqual(fallback.get('right-1:source'));
        expect(geom.get('right-0:source')).toBeCloseTo(1 / 3);
    });

    // Case 3 — inheritance pinned to center, geometry-independent.
    it('inheritance is centered (0.5) and identical with/without positions', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'top-0', role: 'target', edgeType: 'inheritance', oppositeNodeId: 'Parent' },
            { handleId: 'top-1', role: 'target', edgeType: 'reference', oppositeNodeId: 'Ref' },
        ];
        const positions = new Map([['Parent', pos(100, 0)], ['Ref', pos(800, 0)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('top-0:target')).toBeCloseTo(0.5); // M=1 → centered
        const f = computeSidePositions(endpoints);
        expect(r.get('top-0:target')).toEqual(f.get('top-0:target')); // geometry-independent
    });

    // Case 4 — tie on opposite centroid and NO edge id present → degenerate role
    // tiebreaker (source before target). The production tie path (edge ids present)
    // is the pair-stable ordering proven in the pair-alignment block below.
    it('centroid tie, no edge id: degenerate role fallback (source before target)', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'A' },
            { handleId: 'left-1', role: 'source', edgeType: 'reference', oppositeNodeId: 'B' },
        ];
        const positions = new Map([['A', pos(0, 500)], ['B', pos(0, 500)]]); // equal Y
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('left-1:source')).toBeCloseTo(1 / 3); // source first
        expect(r.get('left-0:target')).toBeCloseTo(2 / 3);
    });

    // Case 5 — singleton.
    it('singleton: 0.5, unchanged with/without positions', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'A' },
        ];
        const positions = new Map([['A', pos(0, 100)]]);
        expect(computeSidePositions(endpoints, positions).get('left-0:source')).toBeCloseTo(0.5);
        expect(computeSidePositions(endpoints).get('left-0:source')).toBeCloseTo(0.5);
    });

    // Case 6 — empty side.
    it('empty side: empty map', () => {
        expect(computeSidePositions([]).size).toBe(0);
        expect(computeSidePositions([], new Map()).size).toBe(0);
    });

    // Missing centroid degrades gracefully to the role/index fallback per endpoint.
    it('missing opposite centroid degrades to role-primary fallback', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Ghost' },
            { handleId: 'left-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'AlsoGhost' },
        ];
        const positions = new Map(); // neither node present
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('left-0:source')).toBeCloseTo(1 / 3); // role-primary
        expect(r.get('left-0:target')).toBeCloseTo(2 / 3);
    });
});

describe('computeSideEndpoints — oppositeNodeId + edgeId wiring', () => {
    it('records the opposite node and the edge id at each end', () => {
        const edges = [
            { id: 'e1', source: 'Dep', target: 'Lab', sourceHandle: 'left-0', targetHandle: 'right-0', type: 'reference' },
        ];
        const fromDep = computeSideEndpoints(edges, 'Dep', 'left');
        expect(fromDep).toHaveLength(1);
        expect(fromDep[0]).toMatchObject({ handleId: 'left-0', role: 'source', oppositeNodeId: 'Lab', edgeId: 'e1' });

        const fromLab = computeSideEndpoints(edges, 'Lab', 'right');
        expect(fromLab).toHaveLength(1);
        expect(fromLab[0]).toMatchObject({ handleId: 'right-0', role: 'target', oppositeNodeId: 'Dep', edgeId: 'e1' });
    });
});

describe('computeSidePositions — pair-stable alignment (edge id tiebreak)', () => {
    // Bidirectional pair Loan <-> BookCopy on facing sides Loan-bottom / BookCopy-top.
    // portDistribution gives both edges index 0 on each side (one edge per role
    // bucket), so the two endpoints on a side share the same opposite node => the
    // opposite centroid ties. The edge-id tiebreak must rank the SAME edge
    // identically on both sides, so each edge's source fraction equals its target
    // fraction => aligned anchors => the router's straight/parallel branch fires.
    it('same edge ranks identically on both facing sides (aligned + distinct)', () => {
        const loanBottom: SideEndpoint[] = [
            { handleId: 'bottom-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'BookCopy', edgeId: 'e-copy' },
            { handleId: 'bottom-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'BookCopy', edgeId: 'e-loans' },
        ];
        const bookCopyTop: SideEndpoint[] = [
            { handleId: 'top-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'Loan', edgeId: 'e-loans' },
            { handleId: 'top-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Loan', edgeId: 'e-copy' },
        ];
        const positions = new Map([['Loan', pos(100, 100)], ['BookCopy', pos(100, 800)]]);
        const onLoan = computeSidePositions(loanBottom, positions);
        const onBook = computeSidePositions(bookCopyTop, positions);

        // e-copy: source on Loan-bottom == target on BookCopy-top (aligned).
        expect(onLoan.get('bottom-0:source')).toBeCloseTo(onBook.get('top-0:target')!);
        // e-loans: target on Loan-bottom == source on BookCopy-top (aligned).
        expect(onLoan.get('bottom-0:target')).toBeCloseTo(onBook.get('top-0:source')!);
        // R3: distinct fractions on each side (never coincident).
        expect(Math.abs(onLoan.get('bottom-0:source')! - onLoan.get('bottom-0:target')!)).toBeGreaterThan(0.1);
        // 'e-copy' < 'e-loans' by id → e-copy at 1/3, e-loans at 2/3 on both sides.
        expect(onLoan.get('bottom-0:source')).toBeCloseTo(1 / 3);
        expect(onBook.get('top-0:target')).toBeCloseTo(1 / 3);
    });

    // The id tiebreak only fires on a centroid tie: distinct opposite nodes keep
    // geometry primary even when edge ids would order the other way.
    it('distinct opposite centroids: geometry wins over edge id', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'left-0', role: 'source', edgeType: 'reference', oppositeNodeId: 'Low', edgeId: 'zzz' },  // Y=800
            { handleId: 'left-1', role: 'source', edgeType: 'reference', oppositeNodeId: 'High', edgeId: 'aaa' }, // Y=100
        ];
        const positions = new Map([['Low', pos(0, 800)], ['High', pos(0, 100)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('left-1:source')!).toBeLessThan(r.get('left-0:source')!); // High above Low
        expect(r.get('left-1:source')).toBeCloseTo(1 / 3);
    });
});

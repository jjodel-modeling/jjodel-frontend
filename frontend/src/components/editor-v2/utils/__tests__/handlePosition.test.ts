import { describe, it, expect } from 'vitest';
import { computeSidePositions, computeSideEndpoints, computeHandlePositionForNode, type SideEndpoint } from '../handlePosition';

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

    // Case 3 — S7: inheritance participates in the geometric order. When a reference
    // shares the side, inheritance is NOT centered — it takes its slot by the parent's
    // centroid (previously it was pinned to 0.5; that invariant is intentionally gone).
    it('inheritance sorts geometrically by parent centroid when a reference shares the side', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'top-0', role: 'target', edgeType: 'inheritance', oppositeNodeId: 'Parent' }, // x=100 (left)
            { handleId: 'top-1', role: 'target', edgeType: 'reference', oppositeNodeId: 'Ref' },      // x=800 (right)
        ];
        const positions = new Map([['Parent', pos(100, 0)], ['Ref', pos(800, 0)]]);
        const r = computeSidePositions(endpoints, positions);
        // Parent (100) left of Ref (800) → inheritance leftmost, reference to its right.
        expect(r.get('top-0:target')).toBeCloseTo(1 / 3);
        expect(r.get('top-1:target')).toBeCloseTo(2 / 3);
        expect(r.get('top-0:target')!).toBeLessThan(r.get('top-1:target')!);
    });

    // Case 3b — S7: a side carrying ONLY inheritance still lands at the center
    // (N=1 → 0.5), with or without positions. The lone-generalization look is preserved.
    it('lone inheritance is centered (0.5), with and without positions', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'top-0', role: 'target', edgeType: 'inheritance', oppositeNodeId: 'Parent' },
        ];
        const positions = new Map([['Parent', pos(100, 0)]]);
        expect(computeSidePositions(endpoints, positions).get('top-0:target')).toBeCloseTo(0.5);
        expect(computeSidePositions(endpoints).get('top-0:target')).toBeCloseTo(0.5);
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

describe('computeSidePositions — S7 inheritance geometry (hospital P/D)', () => {
    // Case P — Patient.top: inheritance→Person (far left) + containment→Container (mid-left).
    // Ascending centroid X Person(230) < Container(510) → inheritance leftmost, containment
    // to its right → the leftward tree bus no longer crosses the containment vertical.
    it('Case P: inheritance takes the leftmost slot, containment to its right (0 crossings)', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'top-0', role: 'source', edgeType: 'inheritance', oppositeNodeId: 'Person', edgeId: 'inh-p' },
            { handleId: 'top-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Container', edgeId: 'contain' },
        ];
        const positions = new Map([['Person', pos(230, 0)], ['Container', pos(510, 0)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('top-0:source')).toBeCloseTo(1 / 3); // inheritance leftmost
        expect(r.get('top-0:target')).toBeCloseTo(2 / 3); // containment right of it
        expect(r.get('top-0:source')!).toBeLessThan(r.get('top-0:target')!);
    });

    // Case D — Doctor.top: doctor→Visit, inheritance→Person, prescribedBy→Prescription.
    // Ascending centroid X Person(230) < Visit(700) < Prescription(1300) →
    // order inheritance, doctor, prescribedBy; inheritance leftmost → 0 crossings.
    it('Case D: order is inheritance, doctor, prescribedBy (inheritance leftmost)', () => {
        const endpoints: SideEndpoint[] = [
            { handleId: 'top-0', role: 'target', edgeType: 'reference', oppositeNodeId: 'Visit', edgeId: 'doctor' },
            { handleId: 'top-0', role: 'source', edgeType: 'inheritance', oppositeNodeId: 'Person', edgeId: 'inh-d' },
            { handleId: 'top-1', role: 'target', edgeType: 'reference', oppositeNodeId: 'Prescription', edgeId: 'presc' },
        ];
        const positions = new Map([['Person', pos(230, 0)], ['Visit', pos(700, 0)], ['Prescription', pos(1300, 0)]]);
        const r = computeSidePositions(endpoints, positions);
        expect(r.get('top-0:source')).toBeCloseTo(1 / 4); // inheritance leftmost
        expect(r.get('top-0:target')).toBeCloseTo(2 / 4); // doctor->Visit
        expect(r.get('top-1:target')).toBeCloseTo(3 / 4); // prescribedBy->Prescription
    });
});

describe('computeHandlePositionForNode — S7 nodePositions threading (R4: branch == handle)', () => {
    // Child "C" top side: inheritance→Parent (opposite on the RIGHT) + reference→Other
    // (opposite on the LEFT). Geometry ⇒ inheritance to the right (2/3); the no-position
    // fallback (edge-id order 'a-inh' < 'b-ref') ⇒ inheritance to the left (1/3). The two
    // disagree, so this fixture proves threading is load-bearing.
    const edges = [
        { id: 'a-inh', source: 'C', target: 'Parent', type: 'inheritance', sourceHandle: 'top-0', targetHandle: 'bottom-0' },
        { id: 'b-ref', source: 'Other', target: 'C', type: 'reference', sourceHandle: 'bottom-0', targetHandle: 'top-0' },
    ];
    const nodePositions = new Map([
        ['C', pos(500, 500)],
        ['Parent', pos(900, 100)], // inheritance opposite on the RIGHT
        ['Other', pos(100, 100)],  // reference opposite on the LEFT
    ]);
    const nodeX = 410, nodeW = 180, nodeY = 500, nodeH = 80;

    it('with nodePositions the branch lands on the geometric slot the handle is drawn at', () => {
        const handleFrac = computeSidePositions(
            computeSideEndpoints(edges as any, 'C', 'top'), nodePositions,
        ).get('top-0:source')!;
        expect(handleFrac).toBeCloseTo(2 / 3); // geometry: inheritance to the right

        const withPos = computeHandlePositionForNode({
            edges: edges as any, nodeId: 'C', nodeX, nodeY, nodeWidth: nodeW, nodeHeight: nodeH,
            handleId: 'top-0', role: 'source', nodePositions,
        });
        expect(withPos.x).toBeCloseTo(nodeX + handleFrac * nodeW); // branch == handle
    });

    it('without nodePositions the branch diverges to the fallback slot (why threading matters)', () => {
        const noPos = computeHandlePositionForNode({
            edges: edges as any, nodeId: 'C', nodeX, nodeY, nodeWidth: nodeW, nodeHeight: nodeH,
            handleId: 'top-0', role: 'source',
        });
        expect(noPos.x).toBeCloseTo(nodeX + (1 / 3) * nodeW); // edge-id fallback slot, not geometric
    });
});

import { describe, it, expect } from 'vitest';
import {
    computeGeometricAnchorsForAllEdges,
    computeAnchorsWithHysteresis,
    type NodeRect,
    type MinimalEdgeWithData,
} from '../useAutoAnchor';

/** Build a NodeRect from top-left position and size. */
function rect(x: number, y: number, width = 180, height = 80): NodeRect {
    return { x, y, width, height, centerX: x + width / 2, centerY: y + height / 2 };
}

const side = (h: string | undefined) => (h ?? '').split('-')[0];

describe('computeGeometricAnchorsForAllEdges — geometry-only side recalc (Step B)', () => {
    it('Case A layout: Family left-of-center, both Members to the right → father/mother = right/left', () => {
        // Discovery Q5 Case A/C final layout: Family(100,300), Member_0(600,100), Member_1(600,500).
        // On these post-layout positions the source side must be `right` (targets are to the right),
        // not the frozen grid-time `left` that produced the observed U-turn.
        const rects = new Map<string, NodeRect>([
            ['Family', rect(100, 300)],
            ['M0', rect(600, 100)],
            ['M1', rect(600, 500)],
        ]);
        const edges = [
            { id: 'father', source: 'Family', target: 'M0', type: 'reference' },
            { id: 'mother', source: 'Family', target: 'M1', type: 'reference' },
        ];

        const result = computeGeometricAnchorsForAllEdges(edges, rects);

        expect(side(result.get('father')!.sourceHandle)).toBe('right');
        expect(side(result.get('father')!.targetHandle)).toBe('left');
        expect(side(result.get('mother')!.sourceHandle)).toBe('right');
        expect(side(result.get('mother')!.targetHandle)).toBe('left');
    });

    it('vertical arrangement → bottom/top by dominant axis (no lateral U)', () => {
        // Target directly below the source: dominant axis is vertical.
        const rects = new Map<string, NodeRect>([
            ['A', rect(0, 0)],
            ['B', rect(0, 400)],
        ]);
        const result = computeGeometricAnchorsForAllEdges(
            [{ id: 'e', source: 'A', target: 'B', type: 'reference' }],
            rects,
        );
        expect(side(result.get('e')!.sourceHandle)).toBe('bottom');
        expect(side(result.get('e')!.targetHandle)).toBe('top');
    });

    it('bidirectional pair shares the facing channel (deconfliction)', () => {
        // A left, B right. A→B and B→A must both land on the A-right / B-left facing pair.
        const rects = new Map<string, NodeRect>([
            ['A', rect(0, 0)],
            ['B', rect(600, 0)],
        ]);
        const result = computeGeometricAnchorsForAllEdges(
            [
                { id: 'fwd', source: 'A', target: 'B', type: 'reference' },
                { id: 'bwd', source: 'B', target: 'A', type: 'reference' },
            ],
            rects,
        );
        // fwd: source A → right, target B → left
        expect(side(result.get('fwd')!.sourceHandle)).toBe('right');
        expect(side(result.get('fwd')!.targetHandle)).toBe('left');
        // bwd: source B → left, target A → right (same shared channel)
        expect(side(result.get('bwd')!.sourceHandle)).toBe('left');
        expect(side(result.get('bwd')!.targetHandle)).toBe('right');
    });

    it('inheritance keeps the top/bottom convention regardless of geometry', () => {
        // Child to the right of parent, yet inheritance must stay child-top / parent-bottom.
        const rects = new Map<string, NodeRect>([
            ['child', rect(600, 0)],
            ['parent', rect(0, 0)],
        ]);
        const result = computeGeometricAnchorsForAllEdges(
            [{ id: 'inh', source: 'child', target: 'parent', type: 'inheritance' }],
            rects,
        );
        expect(side(result.get('inh')!.sourceHandle)).toBe('top');
        expect(side(result.get('inh')!.targetHandle)).toBe('bottom');
    });

    it('missing node rect falls back to right/left without throwing', () => {
        const rects = new Map<string, NodeRect>([['A', rect(0, 0)]]);
        const result = computeGeometricAnchorsForAllEdges(
            [{ id: 'e', source: 'A', target: 'ghost', type: 'reference' }],
            rects,
        );
        expect(side(result.get('e')!.sourceHandle)).toBe('right');
        expect(side(result.get('e')!.targetHandle)).toBe('left');
    });
});

describe('computeBestAnchorsWithContext — same-side U gate on frontal saturation (Step C)', () => {
    const isU = (r: { sourceHandle: string; targetHandle: string }) =>
        side(r.sourceHandle) === side(r.targetHandle);

    it('(a) 4 references out of one node onto right, none saturated → no same-side U', () => {
        // Family with 4 references, all currently on right-0, all targets to the right.
        // Frontal (right) occupancy = 4, under the 80px side's physical capacity of 7
        // (sideCapacity: floor(80/10) - 1) → NOT over capacity, so the U candidate must
        // not be admitted: no edge may end up same-side.
        const rects = new Map<string, NodeRect>([
            ['Family', rect(0, 200)],
            ['M0', rect(600, 0)],
            ['M1', rect(600, 150)],
            ['M2', rect(600, 300)],
            ['M3', rect(600, 450)],
        ]);
        const edges: MinimalEdgeWithData[] = ['M0', 'M1', 'M2', 'M3'].map((t, i) => ({
            id: `e${i}`, source: 'Family', target: t, type: 'reference',
            sourceHandle: 'right-0', targetHandle: 'left-0',
        }));

        const res = computeAnchorsWithHysteresis(edges, rects, edges);

        for (const e of edges) {
            expect(isU(res.get(e.id)!)).toBe(false);
        }
    });

    // A dense hub: `rightCount` references leave on the right, and top+bottom are each
    // filled to capacity, so a horizontal target's only uncrowded escape is the U.
    // Whether the U is *offered* depends solely on the right side being over capacity.
    function denseHub(rightCount: number) {
        const rects = new Map<string, NodeRect>([
            ['H', rect(500, 300)],
            ['T', rect(1000, 320)],
        ]);
        const edges: MinimalEdgeWithData[] = [
            { id: 'HT', source: 'H', target: 'T', type: 'reference', sourceHandle: 'right-0', targetHandle: 'left-0' },
        ];
        for (let i = 0; i < rightCount; i++) {
            rects.set(`R${i}`, rect(1000, 200 + i * 40));
            edges.push({ id: `hr${i}`, source: 'H', target: `R${i}`, type: 'reference', sourceHandle: 'right-0', targetHandle: 'left-0' });
        }
        for (let i = 0; i < 4; i++) {
            rects.set(`B${i}`, rect(400 + i * 40, 900));
            edges.push({ id: `hb${i}`, source: 'H', target: `B${i}`, type: 'reference', sourceHandle: 'bottom-0', targetHandle: 'top-0' });
            rects.set(`U${i}`, rect(400 + i * 40, -400));
            edges.push({ id: `hu${i}`, source: 'H', target: `U${i}`, type: 'reference', sourceHandle: 'top-0', targetHandle: 'bottom-0' });
        }
        return { rects, edges };
    }

    it('(b) frontal side over capacity → same-side U is admitted and chosen', () => {
        // 7 refs already on H-right + the HT edge itself = 8 > 7: right is over its
        // PHYSICAL capacity. The gate migrated from the fixed pool constant to
        // sideCapacity, so on these 180x80 rects the threshold is 7 anchors
        // (floor(80/10) - 1), not 4 — a taller node legitimately holds more before
        // the U becomes a legitimate escape.
        // With top/bottom also full, the least-penalised option is the same-side U.
        const { rects, edges } = denseHub(7);
        const res = computeAnchorsWithHysteresis(edges, rects, edges);
        expect(isU(res.get('HT')!)).toBe(true);
    });

    it('(b-boundary) same hub with frontal exactly at capacity → U withheld', () => {
        // 6 refs on H-right + HT = 7 = the physical capacity of the side: exactly full
        // still fits (strict >), so the U stays out of the running.
        const { rects, edges } = denseHub(6);
        const res = computeAnchorsWithHysteresis(edges, rects, edges);
        expect(isU(res.get('HT')!)).toBe(false);
    });
});

describe('computeBestAnchorsWithContext — :498 self-match fix (S4b Step B)', () => {
    const isU = (r: { sourceHandle: string; targetHandle: string }) =>
        side(r.sourceHandle) === side(r.targetHandle);

    it('a lone M1 instanceRef edge does NOT self-match the different-type rule', () => {
        // Real type 'instanceRef' differs from the caller-passed 'reference'; before the
        // fix the edge matched itself as a "different-type pair" and took the same-side
        // early-return. With self excluded by id, it reaches the normal scoring → Z-shape.
        const rects = new Map<string, NodeRect>([
            ['A', rect(0, 0)],
            ['B', rect(600, 0)],
        ]);
        const edges: MinimalEdgeWithData[] = [
            { id: 'e', source: 'A', target: 'B', type: 'instanceRef', sourceHandle: 'right-0', targetHandle: 'left-0' },
        ];
        const res = computeAnchorsWithHysteresis(edges, rects, edges);
        expect(isU(res.get('e')!)).toBe(false);
    });

    it('a genuine inheritance+reference pair still routes the reference same-side (invariant)', () => {
        // With a real different-type edge (inheritance) on the same pair, the reference
        // edge must keep the same-side U convention.
        const rects = new Map<string, NodeRect>([
            ['A', rect(0, 0)],
            ['B', rect(600, 0)],
        ]);
        const edges: MinimalEdgeWithData[] = [
            { id: 'inh', source: 'A', target: 'B', type: 'inheritance', sourceHandle: 'top-0', targetHandle: 'bottom-0' },
            { id: 'ref', source: 'A', target: 'B', type: 'instanceRef', sourceHandle: 'right-0', targetHandle: 'right-0' },
        ];
        const res = computeAnchorsWithHysteresis(edges, rects, edges);
        expect(isU(res.get('ref')!)).toBe(true);
    });
});

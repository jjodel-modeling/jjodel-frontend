import { describe, it, expect } from 'vitest';
import { computeGeometricAnchorsForAllEdges, type NodeRect } from '../useAutoAnchor';

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
            { id: 'father', source: 'Family', target: 'M0', type: 'instanceRef' },
            { id: 'mother', source: 'Family', target: 'M1', type: 'instanceRef' },
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
            [{ id: 'e', source: 'A', target: 'B', type: 'instanceRef' }],
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
                { id: 'fwd', source: 'A', target: 'B', type: 'instanceRef' },
                { id: 'bwd', source: 'B', target: 'A', type: 'instanceRef' },
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
            [{ id: 'e', source: 'A', target: 'ghost', type: 'instanceRef' }],
            rects,
        );
        expect(side(result.get('e')!.sourceHandle)).toBe('right');
        expect(side(result.get('e')!.targetHandle)).toBe('left');
    });
});

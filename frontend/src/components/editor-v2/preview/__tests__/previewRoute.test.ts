import { describe, expect, it } from 'vitest';
import { facingSides, routeGhostEdge, routeHitsBox, routePath, type RouteSide } from '../previewRoute';
import type { PlacementBox } from '../previewPlacement';

const box = (x: number, y: number, width = 180, height = 48): PlacementBox => ({ x, y, width, height });

/** True when `p` lies on `side` of `b`, within its extent. */
function onSide(p: { x: number; y: number }, b: PlacementBox, side: RouteSide): boolean {
    if (side === 'left' || side === 'right') {
        const x = side === 'left' ? b.x : b.x + b.width;
        return p.x === x && p.y >= b.y && p.y <= b.y + b.height;
    }
    const y = side === 'top' ? b.y : b.y + b.height;
    return p.y === y && p.x >= b.x && p.x <= b.x + b.width;
}

/** True when the segment from `p` to `q` goes outwards from `side`. */
function leaves(p: { x: number; y: number }, q: { x: number; y: number }, side: RouteSide): boolean {
    return side === 'right' ? q.x > p.x && q.y === p.y : side === 'left' ? q.x < p.x && q.y === p.y
        : side === 'bottom' ? q.y > p.y && q.x === p.x : q.y < p.y && q.x === p.x;
}

describe('previewRoute (P-2026-10-25-1005)', () => {
    it('the facing sides: one when the boxes share a band, two when diagonal, none when they overlap', () => {
        expect(facingSides(box(0, 0), box(300, 0))).toEqual(['right']);
        expect(facingSides(box(0, 300), box(0, 0))).toEqual(['top']);
        expect(facingSides(box(0, 0), box(300, 200))).toEqual(['right', 'bottom']);
        expect(facingSides(box(0, 0), box(100, 20))).toEqual([]);
    });

    it('a straight route between boxes side by side, from the right side to the left side', () => {
        const r = routeGhostEdge(box(0, 0), box(300, 0, 200, 100))!;
        expect([r.sourceSide, r.targetSide, r.bends]).toEqual(['right', 'left', 0]);
        expect(r.points[0].x).toBe(180);
        expect(r.points[1].x).toBe(300);
    });

    it('a straight vertical route from a ghost below its parent, top side to bottom side', () => {
        const r = routeGhostEdge(box(0, 300), box(0, 0, 200, 100))!;
        expect([r.sourceSide, r.targetSide, r.bends]).toEqual(['top', 'bottom', 0]);
    });

    it('one bend for diagonal boxes, never through the area of either box', () => {
        const s = box(0, 0), t = box(300, 200, 200, 100);
        const r = routeGhostEdge(s, t)!;
        expect(r.bends).toBe(1);
        expect(routeHitsBox(r.points, s) || routeHitsBox(r.points, t)).toBe(false);
        expect(onSide(r.points[0], s, r.sourceSide)).toBe(true);
        expect(onSide(r.points[r.points.length - 1], t, r.targetSide)).toBe(true);
    });

    it('around another node when a free route with at most two bends exists', () => {
        const s = box(0, 0), t = box(400, 300);
        // Blocks the L out of the right side, the cheapest route without it.
        const blocker = box(300, 0, 100, 60);
        const free = routeGhostEdge(s, t)!;
        expect(routeHitsBox(free.points, blocker, 4)).toBe(true);
        const r = routeGhostEdge(s, t, [blocker])!;
        expect(r.crossings).toBe(0);
        expect(routeHitsBox(r.points, blocker, 4)).toBe(false);
        expect(r.bends).toBeLessThanOrEqual(2);
    });

    it('a Z through the gap when the straight band is taken by another node', () => {
        const s = box(0, 0, 180, 100), t = box(500, 60, 180, 100);
        const blocker = box(300, 60, 60, 40);
        expect(routeGhostEdge(s, t)!.bends).toBe(0);
        const r = routeGhostEdge(s, t, [blocker])!;
        expect(r.crossings).toBe(0);
        expect(r.bends).toBe(2);
        expect([r.sourceSide, r.targetSide]).toEqual(['right', 'left']);
    });

    it('null when the boxes overlap: no side faces the other', () => {
        expect(routeGhostEdge(box(0, 0), box(100, 20))).toBeNull();
    });

    it('over a grid of placements: ends on facing sides, no crossing of the two boxes, at most two bends', () => {
        const t = box(400, 400, 200, 120);
        for (let x = -400; x <= 1200; x += 70) {
            for (let y = -300; y <= 1100; y += 55) {
                const s = box(x, y);
                const r = routeGhostEdge(s, t);
                if (facingSides(s, t).length === 0) { expect(r).toBeNull(); continue; }
                expect(r).not.toBeNull();
                expect(facingSides(s, t)).toContain(r!.sourceSide);
                expect(facingSides(t, s)).toContain(r!.targetSide);
                expect(onSide(r!.points[0], s, r!.sourceSide)).toBe(true);
                expect(onSide(r!.points[r!.points.length - 1], t, r!.targetSide)).toBe(true);
                expect(routeHitsBox(r!.points, s) || routeHitsBox(r!.points, t)).toBe(false);
                expect(r!.bends).toBeLessThanOrEqual(2);
                // The first segment leaves the source away from its side, the last enters the target into its side.
                expect(leaves(r!.points[0], r!.points[1], r!.sourceSide)).toBe(true);
                expect(leaves(r!.points[r!.points.length - 1], r!.points[r!.points.length - 2], r!.targetSide)).toBe(true);
                for (let i = 1; i < r!.points.length; i++) {
                    const [a, b] = [r!.points[i - 1], r!.points[i]];
                    expect(a.x === b.x || a.y === b.y).toBe(true);
                }
            }
        }
    });

    it('the SVG path is a polyline, its label on the longest segment', () => {
        expect(routePath([{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 100, y: 20 }])).toEqual({ d: 'M 0 0 L 100 0 L 100 20', labelX: 50, labelY: 0 });
    });
});

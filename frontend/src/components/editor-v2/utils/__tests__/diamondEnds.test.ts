/**
 * The ends of ELK routes on a diamond (P-2026-10-03-1304, Q4 (b), docs/lir/lir_2026-10-03_end_side_rule.md).
 *
 * ELK knows a diamond as its box, so two routes can end side by side at the tip, off the outline (DemoFlowB's d1
 * after Auto layout: (252,312) and (264,312) around the tip (258,312), 4.2 px off). `spreadDiamondEnds` gives each end
 * a vertex, the free adjacent one its route turns towards when its side is held; `refitRouteEnd` moves the route's end
 * there, along the last leg on the same side, through a stub out of the vertex on another.
 */
import { describe, expect, it } from 'vitest';
import { refitRouteEnd, spreadDiamondEnds } from '../edgeUtils';

type P = { x: number; y: number };
const d1 = { x: 240, y: 312, width: 36, height: 36 };
const f2 = [{ x: 264, y: 312 }, { x: 264, y: 282 }, { x: 319, y: 282 }, { x: 319, y: 252 }];
const f3 = [{ x: 252, y: 312 }, { x: 252, y: 276 }, { x: 203, y: 276 }, { x: 203, y: 176 }, { x: 305.7, y: 176 }, { x: 305.7, y: 152 }];
const f4 = [{ x: 258, y: 348 }, { x: 258, y: 480 }];

const axisAligned = (pts: P[]) => pts.every((p, i) => i === 0 || Math.abs(p.x - pts[i - 1].x) < 0.01 || Math.abs(p.y - pts[i - 1].y) < 0.01);
const inside = (p: P, r: typeof d1) => p.x > r.x + 0.5 && p.x < r.x + r.width - 0.5 && p.y > r.y + 0.5 && p.y < r.y + r.height - 0.5;

describe('spreadDiamondEnds: one end per vertex', () => {
    it('DemoFlowB d1 after Auto layout: work->d1 keeps the top vertex, the loop-back takes the left one it turns to, the fork the bottom', () => {
        const out = spreadDiamondEnds(d1, [
            { key: 'f2:target', side: 'top', point: f2[0], route: f2 },
            { key: 'f3:source', side: 'top', point: f3[0], route: f3 },
            { key: 'f4:source', side: 'bottom', point: f4[0], route: f4 },
        ]);
        expect(out.get('f2:target')).toEqual({ point: { x: 258, y: 312 }, side: 'top' });
        expect(out.get('f3:source')).toEqual({ point: { x: 240, y: 330 }, side: 'left' });
        expect(out.get('f4:source')).toEqual({ point: { x: 258, y: 348 }, side: 'bottom' });
    });

    it('the end nearest the vertex keeps it, whatever the order the ends come in', () => {
        const a = { key: 'a', side: 'top' as const, point: { x: 257, y: 312 }, route: [{ x: 257, y: 312 }, { x: 257, y: 300 }, { x: 400, y: 300 }] };
        const b = { key: 'b', side: 'top' as const, point: { x: 262, y: 312 }, route: [{ x: 262, y: 312 }, { x: 262, y: 290 }, { x: 100, y: 290 }] };
        for (const ends of [[a, b], [b, a]]) {
            const out = spreadDiamondEnds(d1, ends);
            expect(out.get('a')!.side).toBe('top');
            expect(out.get('b')!.side).toBe('left');
        }
    });

    it('no free vertex left: the end stays on its side, on the outline, at its own point', () => {
        const ends = (['top', 'right', 'bottom', 'left'] as const).map((side, i) => ({ key: `k${i}`, side, point: { x: 258, y: 312 }, route: [] as P[] }));
        ends[0].point = { x: 258, y: 312 };
        const extra = { key: 'z', side: 'top' as const, point: { x: 264, y: 312 }, route: [{ x: 264, y: 312 }, { x: 264, y: 300 }] };
        const out = spreadDiamondEnds(d1, [...ends, extra]);
        expect(out.get('z')!.side).toBe('top');
        // On the top-right edge of the diamond: 6 px right of the tip is 6 px down.
        expect(out.get('z')!.point).toEqual({ x: 264, y: 318 });
    });
});

describe('refitRouteEnd', () => {
    it('same side: the last leg slides across onto the vertex, the route stays orthogonal', () => {
        const out = refitRouteEnd([...f2].reverse(), 'end', { x: 258, y: 312 }, 'top');
        expect(out[out.length - 1]).toEqual({ x: 258, y: 312 });
        expect(out[out.length - 2]).toEqual({ x: 258, y: 282 });
        expect(axisAligned(out)).toBe(true);
    });

    it('another side: out of the left vertex to the channel the route already runs in, then on as before (the loop-back)', () => {
        const out = refitRouteEnd(f3, 'start', { x: 240, y: 330 }, 'left');
        expect(out).toEqual([{ x: 240, y: 330 }, { x: 203, y: 330 }, { x: 203, y: 176 }, { x: 305.7, y: 176 }, { x: 305.7, y: 152 }]);
    });

    it('another side with no channel beyond the stub: a stub out of the vertex, then an L to the route; orthogonal, clear of the diamond', () => {
        const route = [{ x: 400, y: 200 }, { x: 264, y: 200 }, { x: 264, y: 312 }];
        const out = refitRouteEnd(route, 'end', { x: 276, y: 330 }, 'right');
        expect(out[0]).toEqual({ x: 400, y: 200 });
        expect(out[out.length - 1]).toEqual({ x: 276, y: 330 });
        // The last leg arrives along the right side's normal, from outside.
        expect(out[out.length - 2].y).toBe(330);
        expect(out[out.length - 2].x).toBeGreaterThan(276);
        expect(axisAligned(out)).toBe(true);
        expect(out.slice(0, -1).some((p) => inside(p, d1))).toBe(false);
    });

    it('a straight leg whose other end can slide too stays straight (DemoFlowB work->d1 after Auto layout: 312 to the tip 306)', () => {
        // work's bottom side runs from 248 to 390: x 306 is on it.
        const out = refitRouteEnd([{ x: 312, y: 252 }, { x: 312, y: 312 }], 'end', { x: 306, y: 312 }, 'top', [252, 386]);
        expect(out).toEqual([{ x: 306, y: 252 }, { x: 306, y: 312 }]);
        // Off the other side's span: the jog.
        expect(refitRouteEnd([{ x: 312, y: 252 }, { x: 312, y: 312 }], 'end', { x: 306, y: 312 }, 'top', [310, 320]).length).toBe(4);
    });

    it('a straight leg slid on the same side gets a jog, still orthogonal', () => {
        const out = refitRouteEnd([{ x: 252, y: 200 }, { x: 252, y: 312 }], 'end', { x: 258, y: 312 }, 'top');
        expect(out[0]).toEqual({ x: 252, y: 200 });
        expect(out[out.length - 1]).toEqual({ x: 258, y: 312 });
        expect(axisAligned(out)).toBe(true);
    });
});

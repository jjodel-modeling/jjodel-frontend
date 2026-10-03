/**
 * arcGeometry: the arc edges of R-VP-22 (`edge.curve: 'arc'`), `computeArcEdgeGeometry` (edgeUtils.ts).
 *
 * P-2026-10-03-1304 (docs/discovery/discovery_2026-10-03_derived_notations_edges.md §3.5, §3.8):
 * - the pair of R-VP-22 is drawn as before, byte for byte (pinned on the output of `ce52e6b46`);
 * - n arcs between one pair of nodes fan out, the k-th bowed by (k - (n-1)/2) on the pair's normal, so three never cross;
 * - a single arc whose chord crosses another node's box bows clear of it, on the shallower side;
 * - a single arc within 12 px of level (or of upright) over at least 8 times that run is drawn level (upright).
 */
import { describe, it, expect } from 'vitest';
import { ARC_BOW_MAX, computeArcEdgeGeometry, computeArcSelfLoopGeometry, sampleArcPath } from '../edgeUtils';

type P = { x: number; y: number };
type R = { x: number; y: number; width: number; height: number };

/** The quadratic or the line of an arc's `d`, sampled. */
function sample(d: string, n = 64): P[] {
    const q = d.match(/^M ([-\d.]+) ([-\d.]+) Q ([-\d.]+) ([-\d.]+) ([-\d.]+) ([-\d.]+)$/);
    const l = d.match(/^M ([-\d.]+) ([-\d.]+) L ([-\d.]+) ([-\d.]+)$/);
    const v = (q ?? l)!.slice(1).map(Number);
    const [s, c, e] = q ? [{ x: v[0], y: v[1] }, { x: v[2], y: v[3] }, { x: v[4], y: v[5] }] : [{ x: v[0], y: v[1] }, null, { x: v[2], y: v[3] }];
    const out: P[] = [];
    for (let i = 0; i <= n; i++) {
        const t = i / n;
        out.push(c
            ? { x: (1 - t) ** 2 * s.x + 2 * t * (1 - t) * c.x + t ** 2 * e.x, y: (1 - t) ** 2 * s.y + 2 * t * (1 - t) * c.y + t ** 2 * e.y }
            : { x: s.x + t * (e.x - s.x), y: s.y + t * (e.y - s.y) });
    }
    return out;
}
const inside = (p: P, r: R) => p.x > r.x && p.x < r.x + r.width && p.y > r.y && p.y < r.y + r.height;
function segCross(a: P, b: P, c: P, d: P): boolean {
    const o = (p: P, q: P, r: P) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
}
/** Proper crossings of two sampled curves, away from their ends. */
function crossCount(p: P[], q: P[]): number {
    let n = 0;
    for (let i = 2; i < p.length - 2; i++) for (let j = 2; j < q.length - 2; j++) if (segCross(p[i - 1], p[i], q[j - 1], q[j])) n++;
    return n;
}

describe('the pair of R-VP-22 is drawn as before', () => {
    it('two opposite arcs on distinct slots bow apart, byte for byte the output of ce52e6b46', () => {
        const a = computeArcEdgeGeometry({ x: 254, y: 64 }, { x: 466, y: 69 }, [{ start: { x: 466, y: 88 }, end: { x: 254, y: 93 } }]);
        const b = computeArcEdgeGeometry({ x: 466, y: 88 }, { x: 254, y: 93 }, [{ start: { x: 254, y: 64 }, end: { x: 466, y: 69 } }]);
        expect(a.d).toBe('M 254 64 Q 361.15 17.74 466 69');
        expect(b.d).toBe('M 466 88 Q 361.15 139.26 254 93');
        expect([a.nudge, b.nudge]).toEqual([false, false]);
    });

    it('on coincident chords each bows to the left of its own travel, with or without ids', () => {
        const t = computeArcEdgeGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, [{ start: { x: 200, y: 0 }, end: { x: 0, y: 0 } }]);
        expect(t.d).toBe('M 0 0 Q 100 -46 200 0');
        const a = computeArcEdgeGeometry({ x: 0, y: 0 }, { x: 200, y: 0 }, [{ start: { x: 200, y: 0 }, end: { x: 0, y: 0 }, id: 'b' }], { id: 'a' });
        const b = computeArcEdgeGeometry({ x: 200, y: 0 }, { x: 0, y: 0 }, [{ start: { x: 0, y: 0 }, end: { x: 200, y: 0 }, id: 'a' }], { id: 'b' });
        expect(a.d).toBe('M 0 0 Q 100 -46 200 0');
        expect(b.d).toBe('M 200 0 Q 100 46 0 0');
    });
});

describe('n arcs between one pair fan out (Q5 (i))', () => {
    // Three slots on each side, ordered by edge id as computeSidePositions orders them: a above, b middle, c below.
    const ab = { start: { x: 0, y: 10 }, end: { x: 300, y: 10 }, id: 'a' };
    const bb = { start: { x: 0, y: 20 }, end: { x: 300, y: 20 }, id: 'b' };
    const cb = { start: { x: 300, y: 30 }, end: { x: 0, y: 30 }, id: 'c' };

    it('three arcs, two one way and one back: the outer two bow out by the same height, the middle one is straight, none crosses', () => {
        const ga = computeArcEdgeGeometry(ab.start, ab.end, [cb], { id: 'a', same: [bb] });
        const gb = computeArcEdgeGeometry(bb.start, bb.end, [cb], { id: 'b', same: [ab] });
        const gc = computeArcEdgeGeometry(cb.start, cb.end, [ab, bb], { id: 'c' });
        expect(gb.d).toBe('M 0 20 L 300 20');
        const apex = (g: { d: string }) => sample(g.d)[32].y;
        expect(apex(ga)).toBeLessThan(10);
        expect(apex(gc)).toBeGreaterThan(30);
        expect(Math.round(10 - apex(ga))).toBe(Math.round(apex(gc) - 30));
        const [sa, sb, sc] = [ga, gb, gc].map((g) => sample(g.d));
        expect([crossCount(sa, sb), crossCount(sa, sc), crossCount(sb, sc)]).toEqual([0, 0, 0]);
    });

    it('two arcs the same way bow apart (before: both straight, one on the other)', () => {
        const ga = computeArcEdgeGeometry(ab.start, ab.end, [], { id: 'a', same: [bb] });
        const gb = computeArcEdgeGeometry(bb.start, bb.end, [], { id: 'b', same: [ab] });
        expect(sample(ga.d)[32].y).toBeLessThan(10);
        expect(sample(gb.d)[32].y).toBeGreaterThan(20);
    });

    it('the fan follows where the chords lie, not their ids: slots against id order still never cross', () => {
        // c above, b middle, a below: the reverse of id order.
        const lo = { start: { x: 0, y: 30 }, end: { x: 300, y: 30 }, id: 'a' };
        const md = { start: { x: 0, y: 20 }, end: { x: 300, y: 20 }, id: 'b' };
        const hi = { start: { x: 300, y: 10 }, end: { x: 0, y: 10 }, id: 'c' };
        const g = [
            computeArcEdgeGeometry(lo.start, lo.end, [hi], { id: 'a', same: [md] }),
            computeArcEdgeGeometry(md.start, md.end, [hi], { id: 'b', same: [lo] }),
            computeArcEdgeGeometry(hi.start, hi.end, [lo, md], { id: 'c' }),
        ].map((x) => sample(x.d));
        expect([crossCount(g[0], g[1]), crossCount(g[0], g[2]), crossCount(g[1], g[2])]).toEqual([0, 0, 0]);
        expect(g[0][32].y).toBeGreaterThan(30);
        expect(g[2][32].y).toBeLessThan(10);
    });

    it('each member of a fan computes the same order: the same three from any of them', () => {
        const fromA = computeArcEdgeGeometry(cb.start, cb.end, [ab, bb], { id: 'c' }).d;
        const again = computeArcEdgeGeometry(cb.start, cb.end, [bb, ab], { id: 'c' }).d;
        expect(again).toBe(fromA);
    });
});

describe('a single arc bows clear of a node its chord crosses (Q5 (ii))', () => {
    // DemoESM at rest: locked (50,50,200,57), unlocked (470,50,200,57), off (890,50,200,42); locked->off on the top slot.
    const unlocked: R = { x: 470, y: 50, width: 200, height: 57 };
    const start = { x: 254, y: 64.25 }, end = { x: 886, y: 81 };

    it('the curve leaves the box, by the shallower side (here above), and its label is outside the box', () => {
        const g = computeArcEdgeGeometry(start, end, [], { obstacles: [unlocked] });
        const pts = sample(g.d, 200);
        expect(pts.filter((p) => inside(p, unlocked)).length).toBe(0);
        expect(Math.min(...pts.map((p) => p.y))).toBeLessThan(unlocked.y);
        expect(inside(g.label, unlocked)).toBe(false);
        expect(g.nudge).toBe(false);
    });

    it('DemoPEST at rest: round unlocked without crossing the pair from locked nor unlocked\'s self-loop, and not levelled', () => {
        // The drawn curves of the other arcs, as computeArcEdgeGeometry and computeArcSelfLoopGeometry draw them on the probe.
        const box: R = { x: 470, y: 50, width: 200, height: 42 };
        const coin = computeArcEdgeGeometry({ x: 250, y: 71 }, { x: 470, y: 64 }, [{ start: { x: 470, y: 78 }, end: { x: 250, y: 81.5 } }]);
        const push = computeArcEdgeGeometry({ x: 470, y: 78 }, { x: 250, y: 81.5 }, [{ start: { x: 250, y: 71 }, end: { x: 470, y: 64 } }]);
        const loop = computeArcSelfLoopGeometry({ x: 536.66, y: 50 }, { x: 603.33, y: 50 });
        const avoid = [coin, push, loop].map((g) => sampleArcPath(g.d));
        const g = computeArcEdgeGeometry({ x: 250, y: 60.5 }, { x: 890, y: 71 }, [], { obstacles: [box], avoid });
        const pts = sample(g.d, 200);
        expect(pts.filter((p) => inside(p, box)).length).toBe(0);
        expect(avoid.map((c) => crossCount(pts, c))).toEqual([0, 0, 0]);
        expect([g.start.y, g.end.y]).toEqual([60.5, 71]);
    });

    it('DemoPEST at rest: its label and its curve keep off the self-loop\'s label above unlocked', () => {
        const box: R = { x: 470, y: 50, width: 200, height: 42 };
        const coin = computeArcEdgeGeometry({ x: 250, y: 71 }, { x: 470, y: 64 }, [{ start: { x: 470, y: 78 }, end: { x: 250, y: 81.5 } }]);
        const push = computeArcEdgeGeometry({ x: 470, y: 78 }, { x: 250, y: 81.5 }, [{ start: { x: 250, y: 71 }, end: { x: 470, y: 64 } }]);
        const loop = computeArcSelfLoopGeometry({ x: 536.66, y: 50 }, { x: 603.33, y: 50 });
        // The loop's label, `coin`, as the probe measured it: 24.4 x 15 at (557.8, -15.5).
        const loopLabel: R = { x: 557.8, y: -15.5, width: 24.4, height: 15 };
        const g = computeArcEdgeGeometry({ x: 250, y: 60.5 }, { x: 890, y: 71 }, [], {
            obstacles: [box], avoid: [coin, push, loop].map((x) => sampleArcPath(x.d)), avoidBoxes: [loopLabel], labelSize: { width: 22, height: 15 },
        });
        expect(sample(g.d, 200).filter((p) => inside(p, loopLabel)).length).toBe(0);
        const own: R = { x: g.label.x - 11, y: g.label.y - 7.5, width: 22, height: 15 };
        const overlap = !(own.x + own.width < loopLabel.x || loopLabel.x + loopLabel.width < own.x || own.y + own.height < loopLabel.y || loopLabel.y + loopLabel.height < own.y);
        expect(overlap).toBe(false);
    });

    it('sampleArcPath reads the three forms the arc helpers write', () => {
        expect(sampleArcPath('M 0 0 L 10 0', 2)).toEqual([{ x: 0, y: 0 }, { x: 5, y: 0 }, { x: 10, y: 0 }]);
        expect(sampleArcPath('M 0 0 Q 5 10 10 0', 2)[1]).toEqual({ x: 5, y: 5 });
        expect(sampleArcPath('M 0 0 C 0 -8, 8 -8, 8 0', 2)[1]).toEqual({ x: 4, y: -6 });
    });

    it('a chord clear of every box stays straight', () => {
        const g = computeArcEdgeGeometry(start, end, [], { obstacles: [{ x: 470, y: 200, width: 200, height: 57 }] });
        expect(g.d.includes(' L ')).toBe(true);
    });

    it('a box too deep to clear within the cap leaves the chord straight', () => {
        const tall: R = { x: 400, y: -2000, width: 100, height: 4000 };
        const g = computeArcEdgeGeometry({ x: 0, y: 0 }, { x: 900, y: 0 }, [], { obstacles: [tall] });
        expect(g.d).toBe('M 0 0 L 900 0');
        expect(ARC_BOW_MAX).toBeGreaterThan(0);
    });
});

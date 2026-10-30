/**
 * Route of an M2 ghost edge (P-2026-10-25-1005). Pure: boxes in flow coordinates in, an orthogonal
 * polyline out, as real generalization edges are drawn in the default theme.
 *
 * - The ends sit on the facing sides: the side of the source that faces the target and the side of
 *   the target that faces the source (one or two per box, two when the boxes are diagonal).
 * - Candidates: straight (0 bends) when the boxes overlap across the gap, an L (1 bend) from one
 *   facing side to a perpendicular one, a Z (2 bends) through the gap. No segment enters the
 *   source or the target box.
 * - Among the candidates the fewest crossings of the other boxes win, then the fewest bends, then
 *   the shortest. Null when the boxes overlap or touch: no side faces the other.
 */
import type { PlacementBox } from './previewPlacement';

export type RouteSide = 'left' | 'right' | 'top' | 'bottom';

export interface RoutePoint {
    x: number;
    y: number;
}

export interface PreviewRoute {
    points: RoutePoint[];
    sourceSide: RouteSide;
    targetSide: RouteSide;
    bends: number;
    /** The other boxes the route crosses (0 when a free route was found). */
    crossings: number;
}

/** How far a straight route keeps from the corners of the shorter overlap. */
const STRAIGHT_INSET = 8;
/** Positions tried across a gap for the middle segment of a Z, and along an overlap for a straight route. */
const SAMPLES = 9;
/** The margin around the other boxes that a route keeps clear of. */
const OBSTACLE_MARGIN = 4;

/** The sides of `a` that face `b`: right when `b` is wholly right of `a`, and so on. */
export function facingSides(a: PlacementBox, b: PlacementBox): RouteSide[] {
    const sides: RouteSide[] = [];
    if (b.x >= a.x + a.width) sides.push('right');
    if (b.x + b.width <= a.x) sides.push('left');
    if (b.y >= a.y + a.height) sides.push('bottom');
    if (b.y + b.height <= a.y) sides.push('top');
    return sides;
}

const OPPOSITE: Record<RouteSide, RouteSide> = { left: 'right', right: 'left', top: 'bottom', bottom: 'top' };
const horizontal = (s: RouteSide) => s === 'left' || s === 'right';

/** True when the axis-aligned segment p-q passes through the interior of `r` grown by `margin`. */
export function segmentHitsBox(p: RoutePoint, q: RoutePoint, r: PlacementBox, margin: number = 0): boolean {
    const x0 = r.x - margin, x1 = r.x + r.width + margin, y0 = r.y - margin, y1 = r.y + r.height + margin;
    if (p.y === q.y) return p.y > y0 && p.y < y1 && Math.max(p.x, q.x) > x0 && Math.min(p.x, q.x) < x1;
    return p.x > x0 && p.x < x1 && Math.max(p.y, q.y) > y0 && Math.min(p.y, q.y) < y1;
}

/** True when some segment of `points` passes through the interior of `r`. */
export function routeHitsBox(points: readonly RoutePoint[], r: PlacementBox, margin: number = 0): boolean {
    for (let i = 1; i < points.length; i++) if (segmentHitsBox(points[i - 1], points[i], r, margin)) return true;
    return false;
}

const length = (points: readonly RoutePoint[]) => {
    let sum = 0;
    for (let i = 1; i < points.length; i++) sum += Math.abs(points[i].x - points[i - 1].x) + Math.abs(points[i].y - points[i - 1].y);
    return sum;
};

const samples = (from: number, to: number): number[] => {
    // Middle first, then outwards: on a tie the most central position wins. The ends stay out: a
    // bend on a box's side would run the route along that side.
    const mid = (from + to) / 2;
    const out = [mid];
    for (let k = 1; k <= (SAMPLES - 1) / 2; k++) {
        const d = ((to - from) / (SAMPLES + 1)) * k;
        out.push(mid - d, mid + d);
    }
    return out.map((v) => Math.round(v));
};

interface Candidate {
    points: RoutePoint[];
    sourceSide: RouteSide;
    targetSide: RouteSide;
}

function candidates(s: PlacementBox, t: PlacementBox, sSide: RouteSide, tSide: RouteSide): Candidate[] {
    const out: Candidate[] = [];
    const scx = s.x + s.width / 2, scy = s.y + s.height / 2, tcx = t.x + t.width / 2, tcy = t.y + t.height / 2;
    const edgeOf = (b: PlacementBox, side: RouteSide) =>
        side === 'right' ? b.x + b.width : side === 'left' ? b.x : side === 'bottom' ? b.y + b.height : b.y;
    if (tSide === OPPOSITE[sSide]) {
        const sx = edgeOf(s, sSide), tx = edgeOf(t, tSide);
        if (horizontal(sSide)) {
            const lo = Math.max(s.y, t.y) + STRAIGHT_INSET, hi = Math.min(s.y + s.height, t.y + t.height) - STRAIGHT_INSET;
            if (lo <= hi) for (const y of samples(lo, hi)) out.push({ points: [{ x: sx, y }, { x: tx, y }], sourceSide: sSide, targetSide: tSide });
            for (const mx of samples(Math.min(sx, tx), Math.max(sx, tx))) {
                out.push({ points: [{ x: sx, y: scy }, { x: mx, y: scy }, { x: mx, y: tcy }, { x: tx, y: tcy }], sourceSide: sSide, targetSide: tSide });
            }
        } else {
            const lo = Math.max(s.x, t.x) + STRAIGHT_INSET, hi = Math.min(s.x + s.width, t.x + t.width) - STRAIGHT_INSET;
            if (lo <= hi) for (const x of samples(lo, hi)) out.push({ points: [{ x, y: sx }, { x, y: tx }], sourceSide: sSide, targetSide: tSide });
            for (const my of samples(Math.min(sx, tx), Math.max(sx, tx))) {
                out.push({ points: [{ x: scx, y: sx }, { x: scx, y: my }, { x: tcx, y: my }, { x: tcx, y: tx }], sourceSide: sSide, targetSide: tSide });
            }
        }
    } else if (horizontal(sSide) !== horizontal(tSide)) {
        // An L: out of the source's side, into the target's perpendicular side, bending at the corner.
        const start = horizontal(sSide) ? { x: edgeOf(s, sSide), y: scy } : { x: scx, y: edgeOf(s, sSide) };
        const end = horizontal(tSide) ? { x: edgeOf(t, tSide), y: tcy } : { x: tcx, y: edgeOf(t, tSide) };
        const corner = horizontal(sSide) ? { x: end.x, y: start.y } : { x: start.x, y: end.y };
        out.push({ points: [start, corner, end], sourceSide: sSide, targetSide: tSide });
    }
    return out;
}

const dedupe = (points: RoutePoint[]): RoutePoint[] =>
    points.filter((p, i) => i === 0 || p.x !== points[i - 1].x || p.y !== points[i - 1].y);

/** True when the segment from `p` to `q` goes outwards from `side`, at a right angle to it. */
function leaves(p: RoutePoint, q: RoutePoint, side: RouteSide): boolean {
    return side === 'right' ? q.x > p.x && q.y === p.y : side === 'left' ? q.x < p.x && q.y === p.y
        : side === 'bottom' ? q.y > p.y && q.x === p.x : q.y < p.y && q.x === p.x;
}

/** The orthogonal route from `source` to `target` keeping clear of `others` where it can (see the header). */
export function routeGhostEdge(source: PlacementBox, target: PlacementBox, others: readonly PlacementBox[] = []): PreviewRoute | null {
    const sSides = facingSides(source, target);
    const tSides = facingSides(target, source);
    let best: PreviewRoute | null = null;
    for (const sSide of sSides) {
        for (const tSide of tSides) {
            for (const c of candidates(source, target, sSide, tSide)) {
                const points = dedupe(c.points);
                // A route that runs along a side (a bend that fell on it) does not leave or enter it.
                if (points.length < 2 || !leaves(points[0], points[1], c.sourceSide)
                    || !leaves(points[points.length - 1], points[points.length - 2], c.targetSide)) continue;
                if (routeHitsBox(points, source) || routeHitsBox(points, target)) continue;
                const crossings = others.filter((o) => routeHitsBox(points, o, OBSTACLE_MARGIN)).length;
                const route: PreviewRoute = { points, sourceSide: c.sourceSide, targetSide: c.targetSide, bends: points.length - 2, crossings };
                if (!best || crossings < best.crossings || (crossings === best.crossings
                    && (route.bends < best.bends || (route.bends === best.bends && length(points) < length(best.points))))) best = route;
            }
        }
    }
    return best;
}

/** The SVG path of a route, and the point its label sits on (the middle of its longest segment). */
export function routePath(points: readonly RoutePoint[]): { d: string; labelX: number; labelY: number } {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    let longest = 1;
    for (let i = 2; i < points.length; i++) {
        const len = (k: number) => Math.abs(points[k].x - points[k - 1].x) + Math.abs(points[k].y - points[k - 1].y);
        if (len(i) > len(longest)) longest = i;
    }
    const a = points[longest - 1] ?? points[0], b = points[longest] ?? points[0];
    return { d, labelX: (a.x + b.x) / 2, labelY: (a.y + b.y) / 2 };
}

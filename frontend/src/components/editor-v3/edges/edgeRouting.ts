/**
 * Editor V3 — Edge Routing: Manhattan routing with rounded corners.
 *
 * Fork from V2 edgeUtils.ts — side-aware minimum-segment router.
 * Produces clean orthogonal paths without U-turns.
 */

export type Side = 'top' | 'right' | 'bottom' | 'left';

export interface Point {
    x: number;
    y: number;
}

export interface EdgeWaypoint {
    segmentIndex: number;
    offset: number;
}

export interface SegmentInfo {
    index: number;
    midX: number;
    midY: number;
    isHorizontal: boolean;
}

// ── Constants ──

const DETOUR_PADDING = 30;
const STUB_LENGTH = 20;
const SNAP = 8;
const CORNER_RADIUS = 4;

// ── Side extraction ──

export function getSideFromHandle(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (['top', 'right', 'bottom', 'left'].includes(base)) return base as Side;
    return 'right';
}

// ── Point cleaning ──

function cleanPoints(points: Point[]): Point[] {
    if (points.length < 2) return points;

    const first = points[0];
    const last = points[points.length - 1];

    const deduped: Point[] = [first];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = deduped[deduped.length - 1];
        if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
            deduped.push(points[i]);
        }
    }
    deduped.push(last);

    if (deduped.length < 3) return deduped;

    const result: Point[] = [deduped[0]];
    for (let i = 1; i < deduped.length - 1; i++) {
        const prev = result[result.length - 1];
        const curr = deduped[i];
        const next = deduped[i + 1];

        const collinearX = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;
        const collinearY = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;

        if (!collinearX && !collinearY) {
            result.push(curr);
        }
    }
    result.push(deduped[deduped.length - 1]);

    return result;
}

// ── Path conversion ──

export function pointsToPath(points: Point[]): string {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
}

export function parsePathPoints(path: string): Point[] {
    const points: Point[] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return points;

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (nums && nums.length >= 2) {
            points.push({ x: parseFloat(nums[0]), y: parseFloat(nums[1]) });
        }
    }
    return points;
}

// ── Side pair classification ──

function categorizeSidePair(s: Side, t: Side): 'opposite-horizontal' | 'opposite-vertical' | 'same' | 'adjacent' {
    if (s === t) return 'same';
    if ((s === 'right' && t === 'left') || (s === 'left' && t === 'right')) return 'opposite-horizontal';
    if ((s === 'bottom' && t === 'top') || (s === 'top' && t === 'bottom')) return 'opposite-vertical';
    return 'adjacent';
}

// ── Routing strategies ──

function routeOppositeH(sx: number, sy: number, sSide: Side, tx: number, ty: number): Point[] {
    const goingRight = sSide === 'right';
    const targetInFront = goingRight ? (tx > sx) : (tx < sx);

    if (targetInFront) {
        if (Math.abs(ty - sy) < SNAP) {
            const avgY = (sy + ty) / 2;
            return [{ x: sx, y: avgY }, { x: tx, y: avgY }];
        }
        const midX = (sx + tx) / 2;
        return [{ x: sx, y: sy }, { x: midX, y: sy }, { x: midX, y: ty }, { x: tx, y: ty }];
    } else {
        const detourX = goingRight ? Math.max(sx, tx) + DETOUR_PADDING : Math.min(sx, tx) - DETOUR_PADDING;
        const midY = (sy + ty) / 2;
        const entryDetourX = goingRight ? Math.min(sx, tx) - DETOUR_PADDING : Math.max(sx, tx) + DETOUR_PADDING;
        return [
            { x: sx, y: sy }, { x: detourX, y: sy }, { x: detourX, y: midY },
            { x: entryDetourX, y: midY }, { x: entryDetourX, y: ty }, { x: tx, y: ty },
        ];
    }
}

function routeOppositeV(sx: number, sy: number, sSide: Side, tx: number, ty: number): Point[] {
    const goingDown = sSide === 'bottom';
    const targetInFront = goingDown ? (ty > sy) : (ty < sy);

    if (targetInFront) {
        if (Math.abs(tx - sx) < SNAP) {
            const avgX = (sx + tx) / 2;
            return [{ x: avgX, y: sy }, { x: avgX, y: ty }];
        }
        const midY = (sy + ty) / 2;
        return [{ x: sx, y: sy }, { x: sx, y: midY }, { x: tx, y: midY }, { x: tx, y: ty }];
    } else {
        const detourY = goingDown ? Math.max(sy, ty) + DETOUR_PADDING : Math.min(sy, ty) - DETOUR_PADDING;
        const midX = (sx + tx) / 2;
        const entryDetourY = goingDown ? Math.min(sy, ty) - DETOUR_PADDING : Math.max(sy, ty) + DETOUR_PADDING;
        return [
            { x: sx, y: sy }, { x: sx, y: detourY }, { x: midX, y: detourY },
            { x: midX, y: entryDetourY }, { x: tx, y: entryDetourY }, { x: tx, y: ty },
        ];
    }
}

function routeSameSide(sx: number, sy: number, side: Side, tx: number, ty: number): Point[] {
    switch (side) {
        case 'right': {
            const dx = Math.max(sx, tx) + DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: dx, y: sy }, { x: dx, y: ty }, { x: tx, y: ty }];
        }
        case 'left': {
            const dx = Math.min(sx, tx) - DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: dx, y: sy }, { x: dx, y: ty }, { x: tx, y: ty }];
        }
        case 'bottom': {
            const dy = Math.max(sy, ty) + DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: sx, y: dy }, { x: tx, y: dy }, { x: tx, y: ty }];
        }
        case 'top': {
            const dy = Math.min(sy, ty) - DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: sx, y: dy }, { x: tx, y: dy }, { x: tx, y: ty }];
        }
    }
}

function routeAdjacent(sx: number, sy: number, sSide: Side, tx: number, ty: number, tSide: Side): Point[] {
    const sourceHorizontal = (sSide === 'right' || sSide === 'left');

    if (sourceHorizontal) {
        const goingRight = sSide === 'right';
        const targetInDirection = goingRight ? (tx >= sx) : (tx <= sx);
        const tGoingDown = tSide === 'bottom';
        const sourceInTargetDirection = tGoingDown ? (sy >= ty) : (sy <= ty);

        if (targetInDirection && sourceInTargetDirection) {
            if (Math.abs(sy - ty) < SNAP) return [{ x: sx, y: (sy + ty) / 2 }, { x: tx, y: (sy + ty) / 2 }];
            if (Math.abs(sx - tx) < SNAP) return [{ x: (sx + tx) / 2, y: sy }, { x: (sx + tx) / 2, y: ty }];
            return [{ x: sx, y: sy }, { x: tx, y: sy }, { x: tx, y: ty }];
        } else {
            const midX = (sx + tx) / 2;
            return [{ x: sx, y: sy }, { x: midX, y: sy }, { x: midX, y: ty }, { x: tx, y: ty }];
        }
    } else {
        const goingDown = sSide === 'bottom';
        const targetInDirection = goingDown ? (ty >= sy) : (ty <= sy);
        const tGoingRight = tSide === 'right';
        const sourceInTargetDirection = tGoingRight ? (sx >= tx) : (sx <= tx);

        if (targetInDirection && sourceInTargetDirection) {
            if (Math.abs(sx - tx) < SNAP) return [{ x: (sx + tx) / 2, y: sy }, { x: (sx + tx) / 2, y: ty }];
            if (Math.abs(sy - ty) < SNAP) return [{ x: sx, y: (sy + ty) / 2 }, { x: tx, y: (sy + ty) / 2 }];
            return [{ x: sx, y: sy }, { x: sx, y: ty }, { x: tx, y: ty }];
        } else {
            const midY = (sy + ty) / 2;
            return [{ x: sx, y: sy }, { x: sx, y: midY }, { x: tx, y: midY }, { x: tx, y: ty }];
        }
    }
}

// ── Orthogonal endpoint enforcement ──

function stubPoint(handle: Point, side: Side): Point {
    switch (side) {
        case 'right':  return { x: handle.x + STUB_LENGTH, y: handle.y };
        case 'left':   return { x: handle.x - STUB_LENGTH, y: handle.y };
        case 'bottom': return { x: handle.x, y: handle.y + STUB_LENGTH };
        case 'top':    return { x: handle.x, y: handle.y - STUB_LENGTH };
    }
}

function buildOrthogonalPath(first: Point, last: Point, sourceSide: Side, targetSide: Side, sourceH: boolean): Point[] {
    const stubS = stubPoint(first, sourceSide);
    const stubT = stubPoint(last, targetSide);
    const result: Point[] = [first, stubS];

    if (Math.abs(stubS.x - stubT.x) > 0.5 && Math.abs(stubS.y - stubT.y) > 0.5) {
        if (sourceH) {
            result.push({ x: stubS.x, y: stubT.y });
        } else {
            result.push({ x: stubT.x, y: stubS.y });
        }
    }

    result.push(stubT, last);
    return result;
}

function ensureOrthogonalEndpoints(points: Point[], sourceSide: Side, targetSide: Side): Point[] {
    if (points.length < 2) return points;

    const first = points[0];
    const last = points[points.length - 1];
    const sourceH = sourceSide === 'left' || sourceSide === 'right';
    const targetH = targetSide === 'left' || targetSide === 'right';

    const second = points[1];
    const startOK = sourceH
        ? Math.abs(first.y - second.y) <= 0.5
        : Math.abs(first.x - second.x) <= 0.5;

    const prev = points[points.length - 2];
    const endOK = targetH
        ? Math.abs(last.y - prev.y) <= 0.5
        : Math.abs(last.x - prev.x) <= 0.5;

    if (startOK && endOK) return points;

    if (points.length === 2) {
        return buildOrthogonalPath(first, last, sourceSide, targetSide, sourceH);
    }

    const result = points.map(p => ({ ...p }));

    if (!endOK) {
        const n = result.length;
        const stub = stubPoint(last, targetSide);
        const connector = targetH
            ? { x: stub.x, y: result[n - 2].y }
            : { x: result[n - 2].x, y: stub.y };
        result.splice(n - 1, 0, connector, stub);
    }

    if (!startOK) {
        const stub = stubPoint(first, sourceSide);
        const connector = sourceH
            ? { x: stub.x, y: result[1].y }
            : { x: result[1].x, y: stub.y };
        result.splice(1, 0, stub, connector);
    }

    return result;
}

// ── Self-loop ──

export function computeSelfLoopPath(sx: number, sy: number, tx: number, ty: number): string {
    const size = 30;
    const cp1X = sx + size;
    const cp1Y = sy - size * 0.5;
    const cp2X = tx + size * 0.5;
    const cp2Y = ty - size;
    return `M ${sx} ${sy} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${tx} ${ty}`;
}

// ══════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════

/**
 * Side-aware minimum-segment Manhattan router.
 */
export function computeManhattanPath(
    sourceX: number, sourceY: number, sourceSide: Side,
    targetX: number, targetY: number, targetSide: Side,
): string {
    if (Math.abs(sourceX - targetX) < 1 && Math.abs(sourceY - targetY) < 1) {
        return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
    }

    const pair = categorizeSidePair(sourceSide, targetSide);
    let points: Point[];

    switch (pair) {
        case 'opposite-horizontal':
            points = routeOppositeH(sourceX, sourceY, sourceSide, targetX, targetY);
            break;
        case 'opposite-vertical':
            points = routeOppositeV(sourceX, sourceY, sourceSide, targetX, targetY);
            break;
        case 'same':
            points = routeSameSide(sourceX, sourceY, sourceSide, targetX, targetY);
            break;
        case 'adjacent':
            points = routeAdjacent(sourceX, sourceY, sourceSide, targetX, targetY, targetSide);
            break;
    }

    const orthogonal = ensureOrthogonalEndpoints(points, sourceSide, targetSide);
    return pointsToPath(cleanPoints(orthogonal));
}

/**
 * Add rounded arcs at every 90-degree corner.
 */
export function roundManhattanPath(path: string, radius: number = CORNER_RADIUS): string {
    let points: Point[] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return path;

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (nums && nums.length >= 2) {
            points.push({ x: parseFloat(nums[0]), y: parseFloat(nums[1]) });
        }
    }

    if (points.length < 3) return path;

    // Remove degenerate segments
    const cleaned: Point[] = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = cleaned[cleaned.length - 1];
        const dist = Math.abs(points[i].x - prev.x) + Math.abs(points[i].y - prev.y);
        if (dist >= 1) cleaned.push(points[i]);
    }
    cleaned.push(points[points.length - 1]);
    points = cleaned;

    if (points.length < 3) return pointsToPath(points);

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        const len1 = Math.abs(dx1) + Math.abs(dy1);
        const len2 = Math.abs(dx2) + Math.abs(dy2);

        const maxR1 = (i === 1) ? len1 : len1 / 2;
        const maxR2 = (i === points.length - 2) ? len2 : len2 / 2;
        const r = Math.min(radius, maxR1, maxR2);

        if (r < 0.5) {
            d += ` L ${curr.x} ${curr.y}`;
            continue;
        }

        const beforeX = curr.x - Math.sign(dx1) * (dx1 !== 0 ? r : 0);
        const beforeY = curr.y - Math.sign(dy1) * (dy1 !== 0 ? r : 0);
        const afterX = curr.x + Math.sign(dx2) * (dx2 !== 0 ? r : 0);
        const afterY = curr.y + Math.sign(dy2) * (dy2 !== 0 ? r : 0);

        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross > 0 ? 1 : 0;

        d += ` L ${beforeX} ${beforeY}`;
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${afterY}`;
    }

    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return d;
}

/**
 * Apply user waypoint offsets to path points.
 */
export function applyWaypoints(points: Point[], waypoints: EdgeWaypoint[]): Point[] {
    if (!waypoints || waypoints.length === 0) return points;

    const adjusted = points.map(p => ({ ...p }));
    const lastSeg = adjusted.length - 2;

    for (const wp of waypoints) {
        const i = wp.segmentIndex;
        if (i < 0 || i >= adjusted.length - 1) continue;
        if (i === 0 || i === lastSeg) continue;

        const p1 = adjusted[i];
        const p2 = adjusted[i + 1];
        const isHorizontal = Math.abs(p2.y - p1.y) < 1;

        if (isHorizontal) {
            p1.y += wp.offset;
            p2.y += wp.offset;
        } else {
            p1.x += wp.offset;
            p2.x += wp.offset;
        }
    }

    return adjusted;
}

/**
 * Get segment info for waypoint handle rendering.
 */
export function getPathSegments(path: string): SegmentInfo[] {
    const points = parsePathPoints(path);
    const segments: SegmentInfo[] = [];

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const isH = Math.abs(p2.y - p1.y) < 1;

        segments.push({
            index: i,
            midX: (p1.x + p2.x) / 2,
            midY: (p1.y + p2.y) / 2,
            isHorizontal: isH,
        });
    }

    return segments;
}

/**
 * Label position: center of the longest segment.
 */
export function computeLabelPosition(path: string): Point {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0 };

    let longestLength = 0;
    let longestMidpoint: Point = { x: 0, y: 0 };

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const length = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);

        if (length > longestLength) {
            longestLength = length;
            longestMidpoint = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
        }
    }

    return longestMidpoint;
}

/**
 * Cardinality position: near the target endpoint.
 */
export function computeCardinalityPosition(path: string, offset: number = 35): Point {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0 };

    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return last;

    return { x: last.x - (dx / len) * offset, y: last.y - (dy / len) * offset };
}

/**
 * Infer anchor side from node center and segment midpoint.
 */
export function inferAnchorSideFromSegment(
    nodeCenterX: number, nodeCenterY: number,
    segmentMidX: number, segmentMidY: number,
): Side {
    const dx = segmentMidX - nodeCenterX;
    const dy = segmentMidY - nodeCenterY;
    return Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
}

/**
 * Project a point onto the nearest position on a rectangle's perimeter.
 */
export function projectToPerimeter(
    mouseX: number, mouseY: number,
    rect: { x: number; y: number; width: number; height: number },
): { x: number; y: number; side: Side } {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    const candidates: { x: number; y: number; side: Side; dist: number }[] = [
        { x: clamp(mouseX, left, right), y: top, side: 'top',
          dist: Math.hypot(clamp(mouseX, left, right) - mouseX, top - mouseY) },
        { x: clamp(mouseX, left, right), y: bottom, side: 'bottom',
          dist: Math.hypot(clamp(mouseX, left, right) - mouseX, bottom - mouseY) },
        { x: left, y: clamp(mouseY, top, bottom), side: 'left',
          dist: Math.hypot(left - mouseX, clamp(mouseY, top, bottom) - mouseY) },
        { x: right, y: clamp(mouseY, top, bottom), side: 'right',
          dist: Math.hypot(right - mouseX, clamp(mouseY, top, bottom) - mouseY) },
    ];

    candidates.sort((a, b) => a.dist - b.dist);
    const best = candidates[0];
    return { x: best.x, y: best.y, side: best.side };
}

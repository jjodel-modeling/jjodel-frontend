/**
 * Edge utility functions for Manhattan routing with rounded corners
 *
 * Phase 6: Side-aware routing - the router now knows which side the edge
 * exits from and enters to, producing clean paths without U-turns.
 */

/** Pre-computed bounding rect for a node, used by tree bar clearance and crossing detection. */
export interface NodeRect {
    id: string;
    type: string;
    rect: Rect;
    parentId?: string;
}

const DETOUR_PADDING = 30; // used only for same-side and backward U-shape routing

/** Minimum perpendicular stub length (px) for orthogonal endpoint enforcement. */
const STUB_LENGTH = 20;

export type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * Extracts the side from a handle ID (e.g., "right-0" → "right").
 */
export function getSideFromHandle(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (['top', 'right', 'bottom', 'left'].includes(base)) return base as Side;
    return 'right';
}

/**
 * Removes duplicate and collinear points from a point array.
 * IMPORTANT: Always preserves the first and last points exactly as-is,
 * since they represent the source and target anchor positions on the node border.
 */
function cleanPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 2) return points;

    // Always keep the first and last points exactly as-is
    const first = points[0];
    const last = points[points.length - 1];

    // Remove consecutive duplicates from middle points only
    const deduped: { x: number; y: number }[] = [first];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = deduped[deduped.length - 1];
        if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
            deduped.push(points[i]);
        }
    }
    // Always add the last point even if close to previous
    deduped.push(last);

    // Remove collinear middle points only
    if (deduped.length < 3) return deduped;

    const result: { x: number; y: number }[] = [deduped[0]];
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

/**
 * Minimum-segment Manhattan router.
 *
 * Produces the minimum number of segments (1-4) based on the
 * sourceSide/targetSide pair and relative node positions.
 * No forced padding — segments go directly from border to border.
 *
 * Segment counts by case:
 * - Opposite sides, aligned:   1 segment (straight line)
 * - Opposite sides, offset:    3 segments (Z-shape)
 * - Opposite sides, backward:  5 segments (U-detour)
 * - Adjacent sides, clean:     2 segments (L-shape)
 * - Adjacent sides, backward:  3 segments (Z-fallback)
 * - Same side:                 3 segments (U-shape with detour)
 */
export function computeManhattanPath(
    _sourceX: number,
    _sourceY: number,
    sourceSide: Side,
    _targetX: number,
    _targetY: number,
    targetSide: Side,
): string {
    // Mutable copies for snap adjustments
    let sourceX = _sourceX;
    let sourceY = _sourceY;
    let targetX = _targetX;
    let targetY = _targetY;

    const SNAP = 8;

    // Self-loop: identical endpoints
    if (Math.abs(sourceX - targetX) < 1 && Math.abs(sourceY - targetY) < 1) {
        return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
    }

    // Classify side pair
    const pair = categorizeSidePair(sourceSide, targetSide);

    let points: { x: number; y: number }[];

    switch (pair) {
        case 'opposite-horizontal':
            points = routeOppositeH(sourceX, sourceY, sourceSide, targetX, targetY, SNAP);
            break;
        case 'opposite-vertical':
            points = routeOppositeV(sourceX, sourceY, sourceSide, targetX, targetY, SNAP);
            break;
        case 'same':
            points = routeSameSide(sourceX, sourceY, sourceSide, targetX, targetY);
            break;
        case 'adjacent':
            points = routeAdjacent(sourceX, sourceY, sourceSide, targetX, targetY, targetSide, SNAP);
            break;
    }

    const orthogonal = ensureOrthogonalEndpoints(points, sourceSide, targetSide);
    return pointsToPath(cleanPoints(orthogonal));
}

function categorizeSidePair(s: Side, t: Side): 'opposite-horizontal' | 'opposite-vertical' | 'same' | 'adjacent' {
    if (s === t) return 'same';
    if ((s === 'right' && t === 'left') || (s === 'left' && t === 'right')) return 'opposite-horizontal';
    if ((s === 'bottom' && t === 'top') || (s === 'top' && t === 'bottom')) return 'opposite-vertical';
    return 'adjacent';
}

/** Opposite horizontal: right→left or left→right */
function routeOppositeH(
    sx: number, sy: number, sSide: Side,
    tx: number, ty: number, snap: number,
): { x: number; y: number }[] {
    const goingRight = sSide === 'right';
    const targetInFront = goingRight ? (tx > sx) : (tx < sx);

    if (targetInFront) {
        // Snap: nearly aligned vertically → straight line
        if (Math.abs(ty - sy) < snap) {
            const avgY = (sy + ty) / 2;
            return [{ x: sx, y: avgY }, { x: tx, y: avgY }];
        }
        // Z-shape: 3 segments, bend at midpoint X
        const midX = (sx + tx) / 2;
        return [
            { x: sx, y: sy },
            { x: midX, y: sy },
            { x: midX, y: ty },
            { x: tx, y: ty },
        ];
    } else {
        // Target behind: U-detour (5 segments)
        const detourX = goingRight
            ? Math.max(sx, tx) + DETOUR_PADDING
            : Math.min(sx, tx) - DETOUR_PADDING;
        const midY = (sy + ty) / 2;
        const entryDetourX = goingRight
            ? Math.min(sx, tx) - DETOUR_PADDING
            : Math.max(sx, tx) + DETOUR_PADDING;
        return [
            { x: sx, y: sy },
            { x: detourX, y: sy },
            { x: detourX, y: midY },
            { x: entryDetourX, y: midY },
            { x: entryDetourX, y: ty },
            { x: tx, y: ty },
        ];
    }
}

/** Opposite vertical: bottom→top or top→bottom */
function routeOppositeV(
    sx: number, sy: number, sSide: Side,
    tx: number, ty: number, snap: number,
): { x: number; y: number }[] {
    const goingDown = sSide === 'bottom';
    const targetInFront = goingDown ? (ty > sy) : (ty < sy);

    if (targetInFront) {
        // Snap: nearly aligned horizontally → straight line
        if (Math.abs(tx - sx) < snap) {
            const avgX = (sx + tx) / 2;
            return [{ x: avgX, y: sy }, { x: avgX, y: ty }];
        }
        // Z-shape: 3 segments, bend at midpoint Y
        const midY = (sy + ty) / 2;
        return [
            { x: sx, y: sy },
            { x: sx, y: midY },
            { x: tx, y: midY },
            { x: tx, y: ty },
        ];
    } else {
        // Target behind: U-detour (5 segments)
        const detourY = goingDown
            ? Math.max(sy, ty) + DETOUR_PADDING
            : Math.min(sy, ty) - DETOUR_PADDING;
        const midX = (sx + tx) / 2;
        const entryDetourY = goingDown
            ? Math.min(sy, ty) - DETOUR_PADDING
            : Math.max(sy, ty) + DETOUR_PADDING;
        return [
            { x: sx, y: sy },
            { x: sx, y: detourY },
            { x: midX, y: detourY },
            { x: midX, y: entryDetourY },
            { x: tx, y: entryDetourY },
            { x: tx, y: ty },
        ];
    }
}

/** Same side: right→right, left→left, top→top, bottom→bottom (U-shape with detour) */
function routeSameSide(
    sx: number, sy: number, side: Side,
    tx: number, ty: number,
): { x: number; y: number }[] {
    switch (side) {
        case 'right': {
            const detourX = Math.max(sx, tx) + DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: detourX, y: sy }, { x: detourX, y: ty }, { x: tx, y: ty }];
        }
        case 'left': {
            const detourX = Math.min(sx, tx) - DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: detourX, y: sy }, { x: detourX, y: ty }, { x: tx, y: ty }];
        }
        case 'bottom': {
            const detourY = Math.max(sy, ty) + DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: sx, y: detourY }, { x: tx, y: detourY }, { x: tx, y: ty }];
        }
        case 'top': {
            const detourY = Math.min(sy, ty) - DETOUR_PADDING;
            return [{ x: sx, y: sy }, { x: sx, y: detourY }, { x: tx, y: detourY }, { x: tx, y: ty }];
        }
    }
}

/** Adjacent sides: L-shape (2 segments) or Z-fallback (3 segments) */
function routeAdjacent(
    sx: number, sy: number, sSide: Side,
    tx: number, ty: number, tSide: Side,
    snap: number,
): { x: number; y: number }[] {
    const sourceHorizontal = (sSide === 'right' || sSide === 'left');

    if (sourceHorizontal) {
        // Source exits horizontally → first segment horizontal, second vertical
        const goingRight = sSide === 'right';
        const targetInDirection = goingRight ? (tx >= sx) : (tx <= sx);

        // Also check target entry direction
        const tGoingDown = tSide === 'bottom';
        const sourceInTargetDirection = tGoingDown ? (sy >= ty) : (sy <= ty);

        if (targetInDirection && sourceInTargetDirection) {
            // Clean L-shape: bend at (tx, sy)
            // Snap if nearly aligned
            if (Math.abs(sy - ty) < snap) {
                const avgY = (sy + ty) / 2;
                return [{ x: sx, y: avgY }, { x: tx, y: avgY }];
            }
            if (Math.abs(sx - tx) < snap) {
                const avgX = (sx + tx) / 2;
                return [{ x: avgX, y: sy }, { x: avgX, y: ty }];
            }
            return [{ x: sx, y: sy }, { x: tx, y: sy }, { x: tx, y: ty }];
        } else {
            // Z-fallback: 3 segments with direction-aware midpoint.
            // Ensure first segment always goes in the correct outward direction
            // of the source side (right → increasing X, left → decreasing X).
            const midX = goingRight
                ? Math.max((sx + tx) / 2, sx + DETOUR_PADDING)
                : Math.min((sx + tx) / 2, sx - DETOUR_PADDING);
            return [
                { x: sx, y: sy },
                { x: midX, y: sy },
                { x: midX, y: ty },
                { x: tx, y: ty },
            ];
        }
    } else {
        // Source exits vertically → first segment vertical, second horizontal
        const goingDown = sSide === 'bottom';
        const targetInDirection = goingDown ? (ty >= sy) : (ty <= sy);

        // Check target entry direction
        const tGoingRight = tSide === 'right';
        const sourceInTargetDirection = tGoingRight ? (sx >= tx) : (sx <= tx);

        if (targetInDirection && sourceInTargetDirection) {
            // Clean L-shape: bend at (sx, ty)
            if (Math.abs(sx - tx) < snap) {
                const avgX = (sx + tx) / 2;
                return [{ x: avgX, y: sy }, { x: avgX, y: ty }];
            }
            if (Math.abs(sy - ty) < snap) {
                const avgY = (sy + ty) / 2;
                return [{ x: sx, y: avgY }, { x: tx, y: avgY }];
            }
            return [{ x: sx, y: sy }, { x: sx, y: ty }, { x: tx, y: ty }];
        } else {
            // Z-fallback: 3 segments with direction-aware midpoint.
            // Ensure first segment always goes in the correct outward direction
            // of the source side (bottom → increasing Y, top → decreasing Y).
            const midY = goingDown
                ? Math.max((sy + ty) / 2, sy + DETOUR_PADDING)
                : Math.min((sy + ty) / 2, sy - DETOUR_PADDING);
            return [
                { x: sx, y: sy },
                { x: sx, y: midY },
                { x: tx, y: midY },
                { x: tx, y: ty },
            ];
        }
    }
}

// ============================================
// Orthogonal endpoint enforcement
// ============================================

/** Computes a stub point offset from a handle position in the handle's exit/entry direction. */
function stubPoint(handle: { x: number; y: number }, side: Side): { x: number; y: number } {
    switch (side) {
        case 'right':  return { x: handle.x + STUB_LENGTH, y: handle.y };
        case 'left':   return { x: handle.x - STUB_LENGTH, y: handle.y };
        case 'bottom': return { x: handle.x, y: handle.y + STUB_LENGTH };
        case 'top':    return { x: handle.x, y: handle.y - STUB_LENGTH };
    }
}

/**
 * Builds a full orthogonal path between two points with mandatory stubs at both ends.
 * Used for 2-point paths where fixing one end would invalidate the other.
 */
function buildOrthogonalPath(
    first: { x: number; y: number },
    last: { x: number; y: number },
    sourceSide: Side,
    targetSide: Side,
    sourceH: boolean,
): { x: number; y: number }[] {
    const stubS = stubPoint(first, sourceSide);
    const stubT = stubPoint(last, targetSide);

    const result: { x: number; y: number }[] = [first, stubS];

    // Connect stubs with a Manhattan L-turn if they're not on the same axis
    if (Math.abs(stubS.x - stubT.x) > 0.5 && Math.abs(stubS.y - stubT.y) > 0.5) {
        // Choose corner that avoids creating spikes at endpoints:
        // After horizontal stub → go vertical; after vertical stub → go horizontal.
        if (sourceH) {
            result.push({ x: stubS.x, y: stubT.y });
        } else {
            result.push({ x: stubT.x, y: stubS.y });
        }
    }

    result.push(stubT, last);
    return result;
}

/**
 * Ensures the first and last segments of a Manhattan path are perpendicular
 * to the source/target node sides they connect to.
 *
 * - Top/bottom handles → first/last segment must be vertical
 * - Left/right handles → first/last segment must be horizontal
 *
 * For paths that already have correct alignment, returns the original points unchanged.
 * For paths that need fixing, inserts stub + connector points to enforce orthogonality.
 * The collinear point removal in cleanPoints() naturally merges redundant segments.
 */
function ensureOrthogonalEndpoints(
    points: { x: number; y: number }[],
    sourceSide: Side,
    targetSide: Side,
): { x: number; y: number }[] {
    if (points.length < 2) return points;

    const first = points[0];
    const last = points[points.length - 1];
    const sourceH = sourceSide === 'left' || sourceSide === 'right';
    const targetH = targetSide === 'left' || targetSide === 'right';

    // Check if first segment is already perpendicular to source side
    const second = points[1];
    const startOK = sourceH
        ? Math.abs(first.y - second.y) <= 0.5
        : Math.abs(first.x - second.x) <= 0.5;

    // Check if last segment is already perpendicular to target side
    const prev = points[points.length - 2];
    const endOK = targetH
        ? Math.abs(last.y - prev.y) <= 0.5
        : Math.abs(last.x - prev.x) <= 0.5;

    if (startOK && endOK) return points;

    // For 2-point paths, rebuild entirely with stubs to avoid order-dependency issues
    // (fixing one end of a 2-point path changes the other end's segment)
    if (points.length === 2) {
        return buildOrthogonalPath(first, last, sourceSide, targetSide, sourceH);
    }

    // For 3+ point paths, fix each end independently.
    // Fix end FIRST (inserts near the end), then fix start (inserts near the start).
    // Since they operate on opposite ends of the array, they don't interfere.
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

// ============================================
// OBSTACLE AVOIDANCE (disabled — Phase 7 will replace with A* grid router)
// Functions kept for future reference.
// ============================================

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * Gets the bounding rectangle for a node, using absolute position if available.
 */
export function getNodeRect(node: any): Rect {
    // Prefer absolute position (handles nested nodes in groups/packages)
    const pos = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
    return {
        x: pos.x,
        y: pos.y,
        width: node.measured?.width ?? node.width ?? 180,
        height: node.measured?.height ?? node.height ?? 80,
    };
}

/**
 * Checks if a horizontal or vertical segment intersects a rectangle.
 * Only checks axis-aligned segments (Manhattan routing).
 */
function segmentHitsRect(
    x1: number, y1: number,
    x2: number, y2: number,
    rect: Rect,
    margin: number
): boolean {
    const rLeft = rect.x - margin;
    const rRight = rect.x + rect.width + margin;
    const rTop = rect.y - margin;
    const rBottom = rect.y + rect.height + margin;

    if (Math.abs(y1 - y2) < 1) {
        // Horizontal segment
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return y1 >= rTop && y1 <= rBottom && maxX > rLeft && minX < rRight;
    }

    if (Math.abs(x1 - x2) < 1) {
        // Vertical segment
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return x1 >= rLeft && x1 <= rRight && maxY > rTop && minY < rBottom;
    }

    return false;
}

/**
 * Takes a Manhattan path with straight L segments and adds rounded
 * arcs at every 90-degree corner.
 *
 * @param path - SVG path like "M x y L x y L x y ..."
 * @param radius - Arc radius (default 8px)
 * @returns SVG path with rounded arcs
 */
export function roundManhattanPath(path: string, radius: number = 4): string {
    // Parse points from path
    let points: { x: number; y: number }[] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return path;

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (nums && nums.length >= 2) {
            points.push({ x: parseFloat(nums[0]), y: parseFloat(nums[1]) });
        }
    }

    if (points.length < 3) return path;

    // Pre-processing: remove degenerate (near-zero-length) segments that cause
    // the radius to collapse to 0. Always keep first and last points.
    const cleaned: { x: number; y: number }[] = [points[0]];
    for (let i = 1; i < points.length - 1; i++) {
        const prev = cleaned[cleaned.length - 1];
        const dist = Math.abs(points[i].x - prev.x) + Math.abs(points[i].y - prev.y);
        if (dist >= 1) {
            cleaned.push(points[i]);
        }
    }
    cleaned.push(points[points.length - 1]);
    points = cleaned;

    if (points.length < 3) return pointsToPath(points);

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 1; i < points.length - 1; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const next = points[i + 1];

        // Segment directions
        const dx1 = curr.x - prev.x;
        const dy1 = curr.y - prev.y;
        const dx2 = next.x - curr.x;
        const dy2 = next.y - curr.y;

        // Segment lengths
        const len1 = Math.abs(dx1) + Math.abs(dy1);
        const len2 = Math.abs(dx2) + Math.abs(dy2);

        // Radius cannot exceed half of interior segments, but for the first/last
        // corner we allow the full length of the endpoint segment so the arc
        // doesn't shorten the segment toward the marker.
        const maxR1 = (i === 1) ? len1 : len1 / 2;
        const maxR2 = (i === points.length - 2) ? len2 : len2 / 2;
        const r = Math.min(radius, maxR1, maxR2);

        if (r < 0.5) {
            // Segment too short for any visible arc
            d += ` L ${curr.x} ${curr.y}`;
            continue;
        }

        // Point before corner (on incoming line)
        const beforeX = curr.x - Math.sign(dx1) * (dx1 !== 0 ? r : 0);
        const beforeY = curr.y - Math.sign(dy1) * (dy1 !== 0 ? r : 0);

        // Point after corner (on outgoing line)
        const afterX = curr.x + Math.sign(dx2) * (dx2 !== 0 ? r : 0);
        const afterY = curr.y + Math.sign(dy2) * (dy2 !== 0 ? r : 0);

        // Determine sweep direction
        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross > 0 ? 1 : 0;

        d += ` L ${beforeX} ${beforeY}`;
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${afterY}`;
    }

    // Last point
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;

    return d;
}

/**
 * Computes a compact self-loop path (Bezier curve) for edges where source === target.
 * The loop exits from the right side and curves back to the top.
 *
 * @param sourceX - Source handle X position
 * @param sourceY - Source handle Y position
 * @param targetX - Target handle X position
 * @param targetY - Target handle Y position
 * @returns SVG path with cubic Bezier curve
 */
export function computeSelfLoopPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
): string {
    // Compact loop size
    const size = 30;

    // Control point 1: out to the right from source
    const cp1X = sourceX + size;
    const cp1Y = sourceY - size * 0.5;

    // Control point 2: above the target, coming from the right
    const cp2X = targetX + size * 0.5;
    const cp2Y = targetY - size;

    return `M ${sourceX} ${sourceY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${targetX} ${targetY}`;
}

// Corner-loop geometry for self-references (source === target).
const SELF_LOOP_INSET = 16;        // endpoint distance from the corner, along each side
const SELF_LOOP_SIZE = 24;         // loop protrusion beyond the node border
const SELF_LOOP_RING_STEP = 14;    // inset/size increment for concentric (nested) loops
const SELF_LOOP_LABEL_OFFSET = 10; // diagonal offset of the label from the outer corner
const SELF_LOOP_CARD_OFFSET = 14;  // perpendicular offset of cardinality from the entry segment
const SELF_LOOP_CARD_T = 0.28;     // fraction along the entry segment (p4→p3), near the arrow tip

type SelfLoopCorner = 'TR' | 'BR' | 'BL' | 'TL';

// Corner assignment order, driven by the self-loop ordinal among its siblings.
const SELF_LOOP_CORNER_ORDER: SelfLoopCorner[] = ['TR', 'BR', 'BL', 'TL'];

/**
 * Builds an orthogonal self-loop ("corner loop") that hugs a node corner,
 * rounded with the same rounding as the Manhattan routing.
 *
 * @param rect    node bounding box (from getNodeRect)
 * @param ordinal index of this self-loop among the siblings of the same source
 *                node (deterministic, ordered by edge id)
 * @returns rounded SVG path, a label point at the loop's outer corner, and a
 *          cardinality point near the arrow tip on the inner side of the entry
 */
export function computeSelfLoopCornerPath(
    rect: Rect,
    ordinal: number,
): { path: string; labelPoint: { x: number; y: number }; cardinalityPoint: { x: number; y: number } } {
    const corner = SELF_LOOP_CORNER_ORDER[ordinal % 4];
    const ring = Math.floor(ordinal / 4);

    let inset = SELF_LOOP_INSET + ring * SELF_LOOP_RING_STEP;
    const size = SELF_LOOP_SIZE + ring * SELF_LOOP_RING_STEP;

    // Defensive guard (high rings / small nodes): the endpoint must stay on the side.
    const maxInset = Math.min(rect.width, rect.height) / 2 - 4;
    if (inset > maxInset) inset = Math.max(4, maxInset);

    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    // 5 points: P0 = exit (on the first side), P4 = entry with arrow (on the second
    // side). P2 = outer corner of the loop (used for the label).
    let p0: { x: number; y: number };
    let p1: { x: number; y: number };
    let p2: { x: number; y: number };
    let p3: { x: number; y: number };
    let p4: { x: number; y: number };
    let sign: { x: number; y: number };
    switch (corner) {
        case 'TR': // top + right sides
            p0 = { x: right - inset, y: top };
            p1 = { x: right - inset, y: top - size };
            p2 = { x: right + size,  y: top - size };
            p3 = { x: right + size,  y: top + inset };
            p4 = { x: right,         y: top + inset };
            sign = { x: 1, y: -1 };
            break;
        case 'BR': // bottom + right sides
            p0 = { x: right - inset, y: bottom };
            p1 = { x: right - inset, y: bottom + size };
            p2 = { x: right + size,  y: bottom + size };
            p3 = { x: right + size,  y: bottom - inset };
            p4 = { x: right,         y: bottom - inset };
            sign = { x: 1, y: 1 };
            break;
        case 'BL': // bottom + left sides
            p0 = { x: left + inset, y: bottom };
            p1 = { x: left + inset, y: bottom + size };
            p2 = { x: left - size,  y: bottom + size };
            p3 = { x: left - size,  y: bottom - inset };
            p4 = { x: left,         y: bottom - inset };
            sign = { x: -1, y: 1 };
            break;
        case 'TL': // top + left sides
        default:
            p0 = { x: left + inset, y: top };
            p1 = { x: left + inset, y: top - size };
            p2 = { x: left - size,  y: top - size };
            p3 = { x: left - size,  y: top + inset };
            p4 = { x: left,         y: top + inset };
            sign = { x: -1, y: -1 };
            break;
    }

    // Raw orthogonal polyline, then the same rounding as the other edges.
    const raw = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y}`;
    const path = roundManhattanPath(raw, 4);

    const labelPoint = {
        x: p2.x + sign.x * SELF_LOOP_LABEL_OFFSET,
        y: p2.y + sign.y * SELF_LOOP_LABEL_OFFSET,
    };

    // Cardinality sits near the arrow tip (p4), on the INNER side of the entry
    // segment — opposite the label, which lives at the outer corner. Top corners
    // push it down, bottom corners push it up, always away from the label.
    const isTopCorner = corner === 'TR' || corner === 'TL';
    const cardinalityPoint = {
        x: p4.x + (p3.x - p4.x) * SELF_LOOP_CARD_T,
        y: p4.y + (isTopCorner ? SELF_LOOP_CARD_OFFSET : -SELF_LOOP_CARD_OFFSET),
    };

    return { path, labelPoint, cardinalityPoint };
}

/**
 * Parses points from an SVG path string.
 */
export function parsePathPoints(path: string): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];
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

/**
 * Splits a multi-move SVG path into separate continuous point arrays.
 * Each M command starts a new sub-path. Only sub-paths with 2+ points are returned.
 */
export function parsePathSubPaths(path: string): { x: number; y: number }[][] {
    if (!path) return [];

    const subPaths: { x: number; y: number }[][] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return [];

    let current: { x: number; y: number }[] = [];

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (!nums || nums.length < 2) continue;

        const point = { x: parseFloat(nums[0]), y: parseFloat(nums[1]) };

        if (cmd.trimStart().startsWith('M')) {
            if (current.length >= 2) {
                subPaths.push(current);
            }
            current = [point];
        } else {
            current.push(point);
        }
    }

    if (current.length >= 2) {
        subPaths.push(current);
    }

    return subPaths;
}

/**
 * Finds the position for an edge label: the arc-length midpoint of the path
 * (the point at 50% of the total path length). Stable for any polyline,
 * independent of how the orthogonal routing splits it into segments.
 *
 * Also reports the orientation of the segment the midpoint lands on, so callers
 * can nudge the label perpendicular to the line.
 *
 * @param path - SVG path ("M x y L x y L x y ...")
 * @param arcOffset - Signed shift (px) of the anchor along the path: positive
 *   slides toward the target, negative toward the source. Used to de-overlap
 *   bundled parallel edges. Default 0 = exact arc-length midpoint.
 * @returns { x, y, isHorizontal } - Coordinates + orientation of the host segment
 */
export function computeLabelPosition(
    path: string,
    arcOffset: number = 0,
): { x: number; y: number; isHorizontal: boolean } {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0, isHorizontal: true };

    const segLen: number[] = [];
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        const dx = points[i + 1].x - points[i].x;
        const dy = points[i + 1].y - points[i].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        segLen.push(len);
        total += len;
    }
    if (total === 0) return { x: points[0].x, y: points[0].y, isHorizontal: true };

    // Slide the anchor along the path; clamp inside [margin, total - margin] so
    // the role never rides onto an endpoint.
    const margin = Math.min(12, total / 2);
    let remaining = Math.max(margin, Math.min(total - margin, total / 2 + arcOffset));
    for (let i = 0; i < segLen.length; i++) {
        if (remaining <= segLen[i] || i === segLen.length - 1) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const t = segLen[i] === 0 ? 0 : Math.min(1, remaining / segLen[i]);
            const isHorizontal = Math.abs(p2.y - p1.y) < Math.abs(p2.x - p1.x);
            return { x: p1.x + (p2.x - p1.x) * t, y: p1.y + (p2.y - p1.y) * t, isHorizontal };
        }
        remaining -= segLen[i];
    }
    const mid = points[Math.floor(points.length / 2)];
    return { x: mid.x, y: mid.y, isHorizontal: true };
}

/**
 * Finds the position for cardinality (near the target).
 * Uses the last segment of the path, offset from the target.
 *
 * @param path - SVG path
 * @param offset - Distance from target (default 25px)
 * @returns { x, y } - Coordinates for cardinality
 */
export function computeCardinalityPosition(
    path: string,
    offset: number = 20
): { x: number; y: number } {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0 };

    const last = points[points.length - 1];
    const prev = points[points.length - 2];

    const dx = last.x - prev.x;
    const dy = last.y - prev.y;
    const len = Math.sqrt(dx * dx + dy * dy);

    if (len === 0) return last;

    return {
        x: last.x - (dx / len) * offset,
        y: last.y - (dy / len) * offset,
    };
}

// Distance from the target node border to the cardinality, just outside the box.
export const CARD_BOX_GAP = 8;
// Lateral offset placing the cardinality beside the entry edge (not on top of it).
export const CARD_LINE_GAP = 4;

/**
 * CSS transform anchoring the cardinality just outside the target box at the entry
 * handle. `depthShift` pushes it further out along the entry axis (0 here; 2c uses
 * it for the de-overlap stagger).
 *
 * The cardinality is also shifted laterally so it sits *beside* the entry edge,
 * never on top of it: top → right, bottom → left (vertical edges); right → up,
 * left → down (horizontal edges).
 */
export function computeCardinalityAnchor(
    targetX: number,
    targetY: number,
    targetSide: Side,
    boxGap: number,
    depthShift: number = 0,
): string {
    const gap = boxGap + depthShift;
    switch (targetSide) {
        // Vertical entry edge → shift sideways (top → right, bottom → left).
        case 'top':    return `translate(0%, -100%) translate(${targetX + CARD_LINE_GAP}px, ${targetY - gap}px)`;
        case 'bottom': return `translate(-100%, 0%) translate(${targetX - CARD_LINE_GAP}px, ${targetY + gap}px)`;
        // Horizontal entry edge → shift vertically (right → up, left → down).
        case 'left':   return `translate(-100%, 0%) translate(${targetX - gap}px, ${targetY + CARD_LINE_GAP}px)`;
        case 'right':
        default:       return `translate(0%, -100%) translate(${targetX + gap}px, ${targetY - CARD_LINE_GAP}px)`;
    }
}

// === Waypoint Types ===
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

/**
 * Extracts segment information from a path for waypoint rendering.
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
 * Applies waypoint offsets to path points.
 *
 * @param points - Array of path points
 * @param waypoints - Array of waypoint offsets
 * @returns Adjusted points with waypoint offsets applied
 */
export function applyWaypoints(
    points: { x: number; y: number }[],
    waypoints: EdgeWaypoint[]
): { x: number; y: number }[] {
    if (!waypoints || waypoints.length === 0) return points;

    const adjusted = points.map((p) => ({ ...p }));
    const lastSeg = adjusted.length - 2; // index of the last segment

    for (const wp of waypoints) {
        const i = wp.segmentIndex;
        if (i < 0 || i >= adjusted.length - 1) continue;

        // Skip first/last segments — anchor endpoints must stay fixed
        if (i === 0 || i === lastSeg) continue;

        const p1 = adjusted[i];
        const p2 = adjusted[i + 1];
        const isHorizontal = Math.abs(p2.y - p1.y) < 1;

        if (isHorizontal) {
            // Move horizontal segment vertically
            p1.y += wp.offset;
            p2.y += wp.offset;
        } else {
            // Move vertical segment horizontally
            p1.x += wp.offset;
            p2.x += wp.offset;
        }
    }

    return adjusted;
}

/**
 * Given a node center and the midpoint of a dragged first/last segment,
 * infers which anchor side the edge should use.
 *
 * The direction from node center to segment midpoint determines the side:
 * predominant horizontal → right/left, predominant vertical → bottom/top.
 */
export function inferAnchorSideFromSegment(
    nodeCenterX: number,
    nodeCenterY: number,
    segmentMidX: number,
    segmentMidY: number,
): Side {
    const dx = segmentMidX - nodeCenterX;
    const dy = segmentMidY - nodeCenterY;

    if (Math.abs(dx) >= Math.abs(dy)) {
        return dx >= 0 ? 'right' : 'left';
    } else {
        return dy >= 0 ? 'bottom' : 'top';
    }
}

/**
 * Projects a point onto the closest point on the perimeter of a rectangle.
 * Used by EndpointHandles to constrain drag to the node boundary.
 *
 * Uses closest-point-on-boundary (not ray-from-center) so the handle follows the
 * perimeter freely as the user drags around the node — all 4 sides are reachable.
 */
export function projectToPerimeter(
    mouseX: number,
    mouseY: number,
    rect: { x: number; y: number; width: number; height: number },
): { x: number; y: number; side: Side } {
    const left = rect.x;
    const right = rect.x + rect.width;
    const top = rect.y;
    const bottom = rect.y + rect.height;

    const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

    // Candidate closest point on each side (clamped to side extent)
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
    return { x: candidates[0].x, y: candidates[0].y, side: candidates[0].side };
}

/**
 * Converts an array of points to an SVG path string.
 */
export function pointsToPath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i].x} ${points[i].y}`;
    }
    return d;
}

// ============================================
// Port Distribution — delegates to shared portDistribution.ts
// ============================================

import { computePortDistribution, type NodePosition } from './portDistribution';

/**
 * Wrapper: computes distributed (indexed) handle IDs for edges.
 * Delegates to the shared computePortDistribution which is also used by DynamicHandles.
 */
export function computeDistributedHandles(
    edges: { id: string; source: string; target: string; type?: string; sourceHandle?: string | null; targetHandle?: string | null }[],
    nodePositions?: Map<string, NodePosition>,
): Map<string, { sourceHandle: string; targetHandle: string }> {
    const nodeIdSet = new Set<string>();
    for (const e of edges) {
        nodeIdSet.add(e.source);
        nodeIdSet.add(e.target);
    }
    const { edgeHandles } = computePortDistribution(edges, Array.from(nodeIdSet), nodePositions);
    return edgeHandles;
}

// ============================================
// Tree Connector — shared rendering for inheritance fan-in
// ============================================

export interface TreeBranch {
    /** Center X of child node's top (or bottom) handle */
    childX: number;
    /** Y coordinate of child node's source handle */
    childY: number;
    /** Edge ID for this branch */
    edgeId: string;
}

export interface TreeChildBox {
    /** Absolute X of the child's left edge (positionAbsolute, not the parent-relative position). */
    x: number;
    /** Absolute Y of the child's top edge. */
    y: number;
    /** Measured width — the rendered one, never a placeholder. */
    width: number;
    /** Measured height. */
    height: number;
}

/**
 * Where a child's branch leaves its box: the centre of the side that faces the
 * parent. Centre of the SIDE, so the branch reads as the axis of the node, and it
 * has to come from the measured width — a fixed default puts the line off-centre
 * on every node that is not exactly that wide.
 */
export function treeBranchAnchor(box: TreeChildBox, side: string): { x: number; y: number } {
    return {
        x: box.x + box.width / 2,
        y: side === 'top' ? box.y : box.y + box.height,
    };
}

export interface TreeConnectorGeometry {
    /** Path from bar up to parent — gets markerEnd triangle */
    trunkPath: string;
    /** Horizontal bar + vertical branches to children — no marker */
    barAndBranchesPath: string;
    /** Per-edge hit-test paths (edgeId → L-shaped route from trunk junction to child) */
    branchPaths: Map<string, string>;
    /** Where the trunk meets the bar — null when there is no bar (single child) */
    junction?: { x: number; y: number } | null;
}

/** Corner radius of the two outer elbows, where the bus turns toward the trunk. */
export const TREE_BUS_CORNER_RADIUS = 4;

/**
 * Radius to round one bus sub-path with: the nominal one, clamped to half of its
 * shortest segment.
 *
 * The clamp is the point. `roundManhattanPath` lets the first and last corner of a
 * path consume its whole end segment, which turns a branch shorter than the radius
 * into one arc; half the segment always leaves a straight piece on both sides of
 * the elbow. Two-point sub-paths — every interior child — have no corner and get 0,
 * which keeps their T-junction square.
 */
export function treeBusCornerRadius(points: { x: number; y: number }[]): number {
    if (points.length < 3) return 0;
    let shortest = Infinity;
    for (let i = 0; i < points.length - 1; i++) {
        const len = Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
        if (len < shortest) shortest = len;
    }
    return Math.min(TREE_BUS_CORNER_RADIUS, shortest / 2);
}

/** Under this distance a child counts as collinear with the trunk (sharp T-junction). */
const TRUNK_COLLINEAR_EPS = 0.5;

/**
 * Computes the geometry of a tree connector for inheritance edges.
 *
 * Layout (parent above children — standard UML):
 *   parentX, parentY (bottom center of parent)
 *        │  trunk
 *    ╭───┴───╮  bar (horizontal, at barY) — rounded at its two ends only
 *    │   │   │  branches (vertical, to child tops)
 *   C1  C2  C3
 *
 * Three invariants the emitted paths carry:
 *   1. The trunk is ONE straight segment from the bar to the parent handle, at
 *      the same X as the branch of a child sitting on it — no gap and no elbow
 *      at the junction, so the two verticals read as a single line.
 *   2. The bar spans the children, from the first landing point to the last. It
 *      grows past them only to reach the trunk when the parent sits outside that
 *      span, the one case where stopping at the children would leave the trunk
 *      disconnected.
 *   3. Only the two ends of the bar are elbows, and each is emitted as an L
 *      sub-path (child vertical → bar toward the trunk), so the corner rounding
 *      applied downstream rounds those two and nothing else: an interior child
 *      is a bare vertical, two points, no corner to round.
 *
 * @param parentX - X of the parent's target handle (bottom center)
 * @param parentY - Y of the parent's target handle (bottom edge)
 * @param branches - Array of child positions and edge IDs
 */
export function computeTreeConnectorPath(
    parentX: number,
    parentY: number,
    branches: TreeBranch[],
    obstacleRects?: NodeRect[],
    excludeIds?: Set<string>,
): TreeConnectorGeometry {
    const empty: TreeConnectorGeometry = {
        trunkPath: '',
        barAndBranchesPath: '',
        branchPaths: new Map(),
        junction: null,
    };

    if (branches.length === 0) return empty;

    const sorted = [...branches].sort((a, b) => a.childX - b.childX);

    // barY = midpoint between parent handle and closest child handle
    const closestChildY = Math.min(...sorted.map(b => b.childY));
    const defaultBarY = parentY + (closestChildY - parentY) / 2;

    // Single child: straight line (no bar needed)
    if (sorted.length === 1) {
        const child = sorted[0];
        // Path from child to parent (markerEnd at parent)
        const trunkPath = `M ${child.childX} ${child.childY} L ${parentX} ${parentY}`;
        const branchPaths = new Map<string, string>();
        branchPaths.set(child.edgeId, trunkPath);
        return { trunkPath, barAndBranchesPath: '', branchPaths, junction: null };
    }

    // Multi-child: trunk + bar + branches
    const leftX = sorted[0].childX;
    const rightX = sorted[sorted.length - 1].childX;

    // Extend bar to include parentX if it falls outside the child range
    const barLeftX = Math.min(leftX, parentX);
    const barRightX = Math.max(rightX, parentX);

    // ── Obstacle-aware barY search ──────────────────────────────
    const barY = findClearBarY(
        defaultBarY, parentX, parentY, sorted,
        barLeftX, barRightX, closestChildY,
        obstacleRects, excludeIds,
    );

    // Trunk: bar → parent, full length (markerEnd lands on the parent end).
    // It reaches the bar: the junction is a T, so nothing is shortened here to
    // leave room for an arc.
    const trunkPath = `M ${parentX} ${barY} L ${parentX} ${parentY}`;

    // Branches. The bar is not a segment of its own: the child at each end of
    // the bus draws its own half, from its landing point to the trunk. The two
    // halves meet at the junction, so the horizontal is stroked exactly once
    // and a translucent stroke never builds up.
    const lastIdx = sorted.length - 1;
    const subPaths: string[] = [];
    const branchPaths = new Map<string, string>();

    for (let i = 0; i < sorted.length; i++) {
        const child = sorted[i];
        // A child terminates the bus only if it is the outermost one AND the
        // trunk lies on its inner side. When the parent sits outside the child
        // span, that end of the bar is the trunk itself and the child there is
        // an ordinary T-junction.
        const endsBusOnLeft = i === 0 && child.childX < parentX - TRUNK_COLLINEAR_EPS;
        const endsBusOnRight = i === lastIdx && child.childX > parentX + TRUNK_COLLINEAR_EPS;

        subPaths.push(
            endsBusOnLeft || endsBusOnRight
                // Outer child: vertical, then elbow toward the trunk (3 points, 1 corner)
                ? `M ${child.childX} ${child.childY} L ${child.childX} ${barY} L ${parentX} ${barY}`
                // Interior child, the trunk-collinear one included: sharp T (2 points)
                : `M ${child.childX} ${child.childY} L ${child.childX} ${barY}`
        );

        // Hit-test path: full route from parent for better click area
        const hitPath = `M ${parentX} ${parentY} L ${parentX} ${barY} L ${child.childX} ${barY} L ${child.childX} ${child.childY}`;
        branchPaths.set(child.edgeId, hitPath);
    }

    return {
        trunkPath,
        barAndBranchesPath: subPaths.join(' '),
        branchPaths,
        junction: { x: parentX, y: barY },
    };
}

// ── Helper: find a barY that avoids obstacle nodes ────────────────

const BAR_OBSTACLE_MARGIN = 8; // px margin around obstacles when checking bar clearance
const BAR_Y_SEARCH_STEP = 10;  // px step when searching for clear barY

/**
 * Check if a candidate barY produces a tree layout (bar + trunk + branches)
 * that doesn't intersect any obstacle node rects (excluding tree members).
 */
function isBarYClear(
    barY: number,
    parentX: number,
    parentY: number,
    sorted: TreeBranch[],
    barLeftX: number,
    barRightX: number,
    obstacles: NodeRect[],
    excludeIds: Set<string>,
): boolean {
    for (const obs of obstacles) {
        if (excludeIds.has(obs.id)) continue;
        // Skip package containers — they're not real obstacles
        if (obs.type === 'packageNode') continue;

        const r = obs.rect;

        // Check horizontal bar segment
        if (segmentHitsRect(barLeftX, barY, barRightX, barY, r, BAR_OBSTACLE_MARGIN)) {
            return false;
        }

        // Check trunk segment (bar up to parent)
        if (segmentHitsRect(parentX, barY, parentX, parentY, r, BAR_OBSTACLE_MARGIN)) {
            return false;
        }

        // Check each vertical branch (bar down to child)
        for (const child of sorted) {
            if (segmentHitsRect(child.childX, barY, child.childX, child.childY, r, BAR_OBSTACLE_MARGIN)) {
                return false;
            }
        }
    }
    return true;
}

/**
 * Find a clear barY position for the inheritance tree bar.
 * Starts from the default midpoint and searches outward (alternating above/below)
 * within the parent-to-children range. Falls back to default if no clear position found.
 */
function findClearBarY(
    defaultBarY: number,
    parentX: number,
    parentY: number,
    sorted: TreeBranch[],
    barLeftX: number,
    barRightX: number,
    closestChildY: number,
    obstacleRects?: NodeRect[],
    excludeIds?: Set<string>,
): number {
    // No obstacles to check — use default
    if (!obstacleRects || obstacleRects.length === 0 || !excludeIds) {
        return defaultBarY;
    }

    // Check if default is already clear
    if (isBarYClear(defaultBarY, parentX, parentY, sorted, barLeftX, barRightX, obstacleRects, excludeIds)) {
        return defaultBarY;
    }

    // Search outward from default barY, alternating above and below
    // Stay within the parent-to-children vertical range (with some margin)
    const minY = parentY + 15;  // don't place bar too close to parent
    const maxY = closestChildY - 15; // don't place bar too close to children
    const maxOffset = Math.abs(closestChildY - parentY);

    for (let offset = BAR_Y_SEARCH_STEP; offset <= maxOffset; offset += BAR_Y_SEARCH_STEP) {
        // Try above default
        const above = defaultBarY - offset;
        if (above >= minY && isBarYClear(above, parentX, parentY, sorted, barLeftX, barRightX, obstacleRects, excludeIds)) {
            return above;
        }

        // Try below default
        const below = defaultBarY + offset;
        if (below <= maxY && isBarYClear(below, parentX, parentY, sorted, barLeftX, barRightX, obstacleRects, excludeIds)) {
            return below;
        }
    }

    // No clear position found — fall back to default
    return defaultBarY;
}

// ============================================
// Edge Crossing Detection — Bridge/Jump Arc Support
// ============================================

export interface CrossingPoint {
    x: number;
    y: number;
    segmentIndex: number;
}

interface EdgePathEntry {
    points: { x: number; y: number }[];
    sourceNode: string;
    targetNode: string;
    /** Optional group ID for tree exclusion. All entries sharing the same
     *  treeGroupId are considered part of the same visual structure —
     *  crossings between them are suppressed (no bridge arcs). */
    treeGroupId?: string;
}

/** Module-level registry of computed edge paths for crossing detection. */
const edgePathRegistry = new Map<string, EdgePathEntry>();

/** Register an edge's computed path segments for crossing detection by other edges.
 *  @param treeGroupId - Optional group ID; entries with the same group skip crossing detection. */
export function registerEdgePath(
    edgeId: string,
    points: { x: number; y: number }[],
    sourceNode: string,
    targetNode: string,
    treeGroupId?: string,
): void {
    edgePathRegistry.set(edgeId, { points, sourceNode, targetNode, treeGroupId });
}

/** Unregister an edge's path (call on unmount). */
export function unregisterEdgePath(edgeId: string): void {
    edgePathRegistry.delete(edgeId);
}

/**
 * Finds crossing points where horizontal segments of this edge
 * intersect vertical segments of other registered edges.
 *
 * Only H×V crossings: the horizontal edge draws the bridge arc to hop
 * over the vertical edge. The vertical edge passes underneath unchanged.
 *
 * @param activeNodeIds - Optional Set of node IDs belonging to the currently
 * rendered React Flow canvas. When provided, registry entries whose source OR
 * target is NOT in this set are ignored — this scopes detection to the active
 * metamodel/model tab so phantom jumps from edges of other canvases (they share
 * the module-level `edgePathRegistry`) never appear. Pass the result of
 * `new Set(useNodes().map(n => n.id))` from inside a React Flow edge/hook.
 * Omitted → no filter (legacy behaviour, all registered edges considered).
 */
export function getEdgeCrossings(
    edgeId: string,
    myPoints: { x: number; y: number }[],
    activeNodeIds?: Set<string>,
    nodeRects?: NodeRect[],
): CrossingPoint[] {
    if (myPoints.length < 2) return [];

    const crossings: CrossingPoint[] = [];
    const ENDPOINT_THRESHOLD = 12;
    /** Minimum distance from individual segment endpoints to accept a crossing. */
    const SEG_INTERIOR_MARGIN = 6;
    /** Margin around node rects where crossings are suppressed. */
    const NODE_CROSSING_MARGIN = 15;

    const myStart = myPoints[0];
    const myEnd = myPoints[myPoints.length - 1];

    // Look up my own registry entry to get treeGroupId
    const myEntry = edgePathRegistry.get(edgeId);
    const myGroupId = myEntry?.treeGroupId;

    for (const [otherId, entry] of edgePathRegistry) {
        if (otherId === edgeId) continue;

        // Canvas-scope filter: the registry is module-level and shared across every
        // React Flow instance mounted in the app (e.g. metamodel_1 and metamodel_2 tabs).
        // Without this, an edge on the hidden tab would still contribute crossings to
        // the visible tab. Both endpoints must belong to the active canvas.
        // Tree-segment entries (registered by useTreeLayout with the same source/target
        // as the parent tree's inheritance edge) pass through this test for free since
        // they reuse those node IDs.
        if (activeNodeIds && (!activeNodeIds.has(entry.sourceNode) || !activeNodeIds.has(entry.targetNode))) continue;

        // Skip entries in the same tree group (inheritance edges + their
        // tree segments all share the same treeGroupId = parent node ID).
        if (myGroupId && entry.treeGroupId && myGroupId === entry.treeGroupId) continue;

        const otherPoints = entry.points;
        if (otherPoints.length < 2) continue;

        const otherStart = otherPoints[0];
        const otherEnd = otherPoints[otherPoints.length - 1];

        for (let i = 0; i < myPoints.length - 1; i++) {
            const myP1 = myPoints[i];
            const myP2 = myPoints[i + 1];

            // Only process horizontal segments of this edge
            if (Math.abs(myP2.y - myP1.y) >= 1) continue;

            const myY = (myP1.y + myP2.y) / 2;
            const myMinX = Math.min(myP1.x, myP2.x);
            const myMaxX = Math.max(myP1.x, myP2.x);

            for (let j = 0; j < otherPoints.length - 1; j++) {
                const oP1 = otherPoints[j];
                const oP2 = otherPoints[j + 1];

                // Only crosses with vertical segments of the other edge
                if (Math.abs(oP2.x - oP1.x) >= 1) continue;

                const oX = (oP1.x + oP2.x) / 2;
                const oMinY = Math.min(oP1.y, oP2.y);
                const oMaxY = Math.max(oP1.y, oP2.y);

                // Strict interior crossing — increased margin to avoid
                // false positives on short connector segments
                if (oX > myMinX + SEG_INTERIOR_MARGIN && oX < myMaxX - SEG_INTERIOR_MARGIN &&
                    myY > oMinY + SEG_INTERIOR_MARGIN && myY < oMaxY - SEG_INTERIOR_MARGIN) {

                    const cx = oX;
                    const cy = myY;

                    // Skip crossings near any edge endpoint
                    if (Math.hypot(cx - myStart.x, cy - myStart.y) < ENDPOINT_THRESHOLD ||
                        Math.hypot(cx - myEnd.x, cy - myEnd.y) < ENDPOINT_THRESHOLD ||
                        Math.hypot(cx - otherStart.x, cy - otherStart.y) < ENDPOINT_THRESHOLD ||
                        Math.hypot(cx - otherEnd.x, cy - otherEnd.y) < ENDPOINT_THRESHOLD) {
                        continue;
                    }

                    // FIX 3a: Skip crossings inside or very near any node
                    // (edges naturally converge near nodes — bridges there are spurious)
                    // Package nodes are excluded — they are containers, not real obstacles.
                    if (nodeRects) {
                        let nearNode = false;
                        for (const nr of nodeRects) {
                            // Skip package containers — they wrap the whole diagram
                            if (nr.type === 'packageNode') continue;
                            const r = nr.rect;
                            if (cx >= r.x - NODE_CROSSING_MARGIN &&
                                cx <= r.x + r.width + NODE_CROSSING_MARGIN &&
                                cy >= r.y - NODE_CROSSING_MARGIN &&
                                cy <= r.y + r.height + NODE_CROSSING_MARGIN) {
                                nearNode = true;
                                break;
                            }
                        }
                        if (nearNode) continue;
                    }

                    crossings.push({ x: cx, y: cy, segmentIndex: i });
                }
            }
        }
    }

    return crossings;
}

/**
 * Builds the final SVG path with rounded corners AND bridge arcs at crossings.
 * When no crossings are provided, produces the same output as roundManhattanPath.
 */
export function buildFinalPath(
    inputPoints: { x: number; y: number }[],
    crossings: CrossingPoint[],
    cornerRadius: number = 4,
    bridgeRadius: number = 6,
): string {
    if (inputPoints.length < 2) return '';

    // Clean degenerate segments (same as roundManhattanPath)
    let points: { x: number; y: number }[] = [inputPoints[0]];
    for (let i = 1; i < inputPoints.length - 1; i++) {
        const prev = points[points.length - 1];
        const dist = Math.abs(inputPoints[i].x - prev.x) + Math.abs(inputPoints[i].y - prev.y);
        if (dist >= 1) points.push(inputPoints[i]);
    }
    points.push(inputPoints[inputPoints.length - 1]);

    if (points.length < 2) return `M ${inputPoints[0].x} ${inputPoints[0].y}`;

    // Single segment (no corners to round)
    if (points.length === 2) {
        let d = `M ${points[0].x} ${points[0].y}`;
        const segCrossings = filterCrossingsForSegment(
            crossings.filter(c => c.segmentIndex === 0),
            points[0], points[1], bridgeRadius,
        );
        d += emitLineWithBridges(points[0].x, points[0].y, points[1].x, points[1].y, segCrossings, bridgeRadius);
        return d;
    }

    // Group crossings by segment index
    const crossingMap = new Map<number, CrossingPoint[]>();
    for (const c of crossings) {
        if (!crossingMap.has(c.segmentIndex)) crossingMap.set(c.segmentIndex, []);
        crossingMap.get(c.segmentIndex)!.push(c);
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    let prevX = points[0].x;
    let prevY = points[0].y;

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
        const r = Math.min(cornerRadius, maxR1, maxR2);

        if (r < 0.5) {
            const segIdx = i - 1;
            const segCrossings = filterCrossingsForSegment(
                crossingMap.get(segIdx) || [],
                { x: prevX, y: prevY }, curr, bridgeRadius,
            );
            d += emitLineWithBridges(prevX, prevY, curr.x, curr.y, segCrossings, bridgeRadius);
            prevX = curr.x;
            prevY = curr.y;
            continue;
        }

        const beforeX = curr.x - Math.sign(dx1) * (dx1 !== 0 ? r : 0);
        const beforeY = curr.y - Math.sign(dy1) * (dy1 !== 0 ? r : 0);
        const afterX = curr.x + Math.sign(dx2) * (dx2 !== 0 ? r : 0);
        const afterY = curr.y + Math.sign(dy2) * (dy2 !== 0 ? r : 0);

        const cross = dx1 * dy2 - dy1 * dx2;
        const sweep = cross > 0 ? 1 : 0;

        // Emit segment from prev to before-corner, with bridges
        const segIdx = i - 1;
        const segCrossings = filterCrossingsForSegment(
            crossingMap.get(segIdx) || [],
            { x: prevX, y: prevY }, { x: beforeX, y: beforeY }, bridgeRadius,
        );
        d += emitLineWithBridges(prevX, prevY, beforeX, beforeY, segCrossings, bridgeRadius);

        // Corner arc
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${afterY}`;

        prevX = afterX;
        prevY = afterY;
    }

    // Last segment
    const lastSegIdx = points.length - 2;
    const last = points[points.length - 1];
    const lastCrossings = filterCrossingsForSegment(
        crossingMap.get(lastSegIdx) || [],
        { x: prevX, y: prevY }, last, bridgeRadius,
    );
    d += emitLineWithBridges(prevX, prevY, last.x, last.y, lastCrossings, bridgeRadius);

    return d;
}

/**
 * Filters crossings to those that fit within the visible portion of a horizontal segment,
 * ensuring enough space for the bridge arc (bridgeRadius on each side).
 */
function filterCrossingsForSegment(
    crossings: CrossingPoint[],
    start: { x: number; y: number },
    end: { x: number; y: number },
    bridgeRadius: number,
): CrossingPoint[] {
    if (crossings.length === 0) return crossings;

    // Only horizontal segments get bridges
    if (Math.abs(end.y - start.y) >= 1) return [];

    const minX = Math.min(start.x, end.x) + bridgeRadius + 1;
    const maxX = Math.max(start.x, end.x) - bridgeRadius - 1;

    return crossings.filter(c => c.x >= minX && c.x <= maxX);
}

/**
 * Emits an SVG line segment (L command) with optional bridge arcs at crossing points.
 * Bridges are semicircular arcs that bulge upward (negative Y in SVG coords).
 * Only horizontal segments get bridges.
 */
function emitLineWithBridges(
    startX: number, startY: number,
    endX: number, endY: number,
    crossings: CrossingPoint[],
    bridgeRadius: number,
): string {
    if (crossings.length === 0) {
        return ` L ${endX} ${endY}`;
    }

    // Only horizontal segments get bridges
    if (Math.abs(endY - startY) >= 1) {
        return ` L ${endX} ${endY}`;
    }

    const goingRight = endX > startX;
    const y = startY;
    const r = bridgeRadius;

    // Sort crossings in order of travel
    const sorted = [...crossings].sort((a, b) => goingRight ? a.x - b.x : b.x - a.x);

    // Filter out crossings too close to each other
    const filtered: CrossingPoint[] = [];
    for (const c of sorted) {
        if (filtered.length === 0 || Math.abs(c.x - filtered[filtered.length - 1].x) >= 2 * r + 2) {
            filtered.push(c);
        }
    }

    let d = '';
    for (const c of filtered) {
        const beforeX = goingRight ? c.x - r : c.x + r;
        const afterX = goingRight ? c.x + r : c.x - r;
        // sweep=1 for left-to-right (clockwise = upward), sweep=0 for right-to-left
        const sweep = goingRight ? 1 : 0;

        d += ` L ${beforeX} ${y}`;
        d += ` A ${r} ${r} 0 0 ${sweep} ${afterX} ${y}`;
    }
    d += ` L ${endX} ${endY}`;

    return d;
}

// ═══════════════════════════════════════════════════════════════
// Anti-collisione dei nodi — passaggio A VALLE del router
// ═══════════════════════════════════════════════════════════════
//
// Fase B del punto 1 canvas (2026-08-25). Il router resta intatto: la polilinea
// viene prodotta come sempre, poi si verifica il criterio contro i rettangoli dei
// nodi e si ri-instrada SOLO se violato. Un caso sano non attraversa nemmeno
// questo codice e resta byte-identico — e' la ragione della forma a valle.
//
// Misura che l'ha motivata (discovery_2026-08-25_routing_faseA.md): tre modi di
// attraversare un corpo, in tre rami diversi del router. La U verticale col
// padding fisso da 30px; la stessa U orizzontale che, quando sy === ty, ha tutti i
// punti collineari e collassa in una retta; lo Z sano, cieco a un terzo nodo nel
// corridoio. Correggere ramo per ramo voleva dire toccare tre volte anche i casi
// che funzionano.
//
// Politica del corridoio occupato (decisa il 2026-08-25): si aggira dal lato con
// piu' spazio libero, con 8px di clearance; se dopo UN solo ri-instradamento il
// criterio e' ancora violato (corridoio saturo, nodi impilati) si tiene il path
// originale. Degradare al comportamento di oggi e' accettabile, un path peggiore o
// un ciclo di tentativi no.

/** Clearance minima richiesta dal criterio F2. */
export const AVOID_CLEARANCE = 8;
/** Finestra esente alle due estremita': lo stub perpendicolare esce dal proprio nodo. */
const AVOID_STUB = 8;
/** Lunghezza dello stub costruito dal ri-instradamento (> AVOID_STUB). */
const AVOID_STUB_OUT = 12;
/** Le corsie si posano a clearance + 1: il criterio chiede >= 8, non > 8. */
const AVOID_LANE = AVOID_CLEARANCE + 1;
/** Margine di rilevazione: mezzo pixel sotto la clearance, cosi' una corsia posata
 *  esattamente a distanza di sicurezza non si auto-denuncia al ricontrollo. */
const AVOID_DETECT = AVOID_CLEARANCE - 0.5;
/** Costo di una svolta, in pixel equivalenti: preferisce percorsi con meno spigoli. */
const AVOID_BEND_COST = 40;
/** Sotto questa distanza da un ostacolo una corsia e' "stretta" e costa di piu'. */
const AVOID_TIGHT_LANE = 24;
const AVOID_TIGHT_PENALTY = 0.6;
/** Oltre questo numero di ostacoli si rinuncia: non e' piu' un corridoio. */
const AVOID_MAX_RECTS = 10;

type Pt = { x: number; y: number };

/** Taglia `cut` pixel di lunghezza da ciascuna estremita' della polilinea. */
function trimPolyline(points: Pt[], cut: number): Pt[] {
    if (points.length < 2) return points;
    const total = points.reduce((acc, p, i) => i === 0 ? 0 : acc + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y), 0);
    if (total <= cut * 2) return [];
    const walk = (pts: Pt[], from: number): Pt[] => {
        // consuma `from` px dall'inizio di pts
        const out: Pt[] = [];
        let left = from;
        for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i];
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            if (left <= 0) { out.push(a); continue; }
            if (len <= left) { left -= len; continue; }
            const t = left / len;
            out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
            left = 0;
        }
        out.push(pts[pts.length - 1]);
        return out;
    };
    const head = walk(points, cut);
    const tail = walk([...head].reverse(), cut);
    return tail.reverse();
}

/**
 * I rettangoli attraversati dalla polilinea, esclusa la finestra di stub alle due
 * estremita'. Lista vuota = il criterio e' rispettato.
 */
export function pathBlockingRects(points: Pt[], rects: Rect[]): Rect[] {
    const body = trimPolyline(points, AVOID_STUB);
    if (body.length < 2) return [];
    const hit: Rect[] = [];
    for (const r of rects) {
        for (let i = 1; i < body.length; i++) {
            if (segmentHitsRect(body[i - 1].x, body[i - 1].y, body[i].x, body[i].y, r, AVOID_DETECT)) {
                hit.push(r);
                break;
            }
        }
    }
    return hit;
}

/** Direzione unitaria assiale del primo segmento non degenere a partire da `from`. */
function axisDirection(points: Pt[], from: 'start' | 'end'): Pt | null {
    const pts = from === 'start' ? points : [...points].reverse();
    for (let i = 1; i < pts.length; i++) {
        const dx = pts[i].x - pts[0].x;
        const dy = pts[i].y - pts[0].y;
        if (Math.abs(dx) > 1) return { x: Math.sign(dx), y: 0 };
        if (Math.abs(dy) > 1) return { x: 0, y: Math.sign(dy) };
    }
    return null;
}

function insideRects(p: Pt, rects: Rect[], margin: number): boolean {
    return rects.some((r) =>
        p.x > r.x - margin && p.x < r.x + r.width + margin &&
        p.y > r.y - margin && p.y < r.y + r.height + margin);
}

/** Distanza minima di un segmento assiale dai rettangoli (0 se lo tocca). */
function segmentClearance(a: Pt, b: Pt, rects: Rect[]): number {
    let best = Infinity;
    for (const r of rects) {
        const dxs = [r.x - Math.max(a.x, b.x), Math.min(a.x, b.x) - (r.x + r.width), 0];
        const dys = [r.y - Math.max(a.y, b.y), Math.min(a.y, b.y) - (r.y + r.height), 0];
        const dx = Math.max(...dxs);
        const dy = Math.max(...dys);
        best = Math.min(best, Math.hypot(dx, dy));
    }
    return best;
}

/**
 * Ri-instradamento ortogonale attorno agli ostacoli, su una griglia di corsie.
 *
 * Le ascisse e le ordinate candidate sono quelle degli stub e dei bordi degli
 * ostacoli scostati di una clearance: e' la griglia minima che contiene un
 * percorso ottimo ortogonale attorno a rettangoli assiali. Su quella griglia gira
 * un Dijkstra il cui costo somma lunghezza, una penale per ogni svolta e una
 * penale per le corsie strette — quest'ultima e' la forma generale della politica
 * «si aggira dal lato con piu' spazio libero», valida anche quando gli ostacoli
 * sono piu' di uno.
 *
 * Ritorna null quando non c'e' percorso, o quando lo stub stesso nasce dentro un
 * corpo (ancoraggio sepolto: nessun tracciato potrebbe rispettare il criterio).
 */
function routeAroundRects(points: Pt[], rects: Rect[]): Pt[] | null {
    const S = points[0];
    const T = points[points.length - 1];
    const dS = axisDirection(points, 'start');
    const dT = axisDirection(points, 'end');
    if (!dS || !dT) return null;

    const S1 = { x: S.x + dS.x * AVOID_STUB_OUT, y: S.y + dS.y * AVOID_STUB_OUT };
    const T1 = { x: T.x + dT.x * AVOID_STUB_OUT, y: T.y + dT.y * AVOID_STUB_OUT };
    if (insideRects(S1, rects, AVOID_DETECT) || insideRects(T1, rects, AVOID_DETECT)) return null;

    const uniq = (v: number[]) => Array.from(new Set(v.map((n) => Math.round(n * 2) / 2))).sort((a, b) => a - b);
    const xs = uniq([S1.x, T1.x, ...rects.flatMap((r) => [r.x - AVOID_LANE, r.x + r.width + AVOID_LANE])]);
    const ys = uniq([S1.y, T1.y, ...rects.flatMap((r) => [r.y - AVOID_LANE, r.y + r.height + AVOID_LANE])]);
    const nx = xs.length, ny = ys.length;
    const idx = (i: number, j: number) => i * ny + j;
    const at = (i: number, j: number): Pt => ({ x: xs[i], y: ys[j] });

    const si = xs.indexOf(Math.round(S1.x * 2) / 2), sj = ys.indexOf(Math.round(S1.y * 2) / 2);
    const ti = xs.indexOf(Math.round(T1.x * 2) / 2), tj = ys.indexOf(Math.round(T1.y * 2) / 2);
    if (si < 0 || sj < 0 || ti < 0 || tj < 0) return null;

    // Stato = (nodo, direzione d'arrivo): serve a far pagare le svolte.
    const DIRS = 3; // 0 = nessuna, 1 = orizzontale, 2 = verticale
    const dist = new Float64Array(nx * ny * DIRS).fill(Infinity);
    const prev = new Int32Array(nx * ny * DIRS).fill(-1);
    const state = (n: number, d: number) => n * DIRS + d;
    const startState = state(idx(si, sj), 0);
    dist[startState] = 0;

    // Coda a estrazione lineare: la griglia e' minuscola (poche decine di nodi).
    const visited = new Uint8Array(nx * ny * DIRS);
    const total = nx * ny * DIRS;
    let goal = -1;
    for (;;) {
        let best = -1, bestD = Infinity;
        for (let s = 0; s < total; s++) if (!visited[s] && dist[s] < bestD) { bestD = dist[s]; best = s; }
        if (best < 0) break;
        visited[best] = 1;
        const node = Math.floor(best / DIRS);
        const dir = best % DIRS;
        if (node === idx(ti, tj)) { goal = best; break; }
        const i = Math.floor(node / ny), j = node % ny;
        const from = at(i, j);
        const neighbours: Array<[number, number, number]> = [
            [i - 1, j, 1], [i + 1, j, 1], [i, j - 1, 2], [i, j + 1, 2],
        ];
        for (const [ni2, nj2, ndir] of neighbours) {
            if (ni2 < 0 || ni2 >= nx || nj2 < 0 || nj2 >= ny) continue;
            const to = at(ni2, nj2);
            if (rects.some((r) => segmentHitsRect(from.x, from.y, to.x, to.y, r, AVOID_DETECT))) continue;
            const len = Math.hypot(to.x - from.x, to.y - from.y);
            const tight = segmentClearance(from, to, rects) < AVOID_TIGHT_LANE ? AVOID_TIGHT_PENALTY : 0;
            const bend = dir !== 0 && dir !== ndir ? AVOID_BEND_COST : 0;
            const cost = len * (1 + tight) + bend;
            const ns = state(idx(ni2, nj2), ndir);
            if (dist[best] + cost < dist[ns]) { dist[ns] = dist[best] + cost; prev[ns] = best; }
        }
    }
    if (goal < 0) return null;

    const back: Pt[] = [];
    for (let s = goal; s >= 0; s = prev[s]) {
        const node = Math.floor(s / DIRS);
        back.push(at(Math.floor(node / ny), node % ny));
        if (s === startState) break;
    }
    back.reverse();
    return cleanPoints([S, ...back, T]);
}

/**
 * Il passaggio a valle: polilinea invariata se il criterio e' rispettato, altrimenti
 * un solo tentativo di ri-instradamento. Se anche quello viola, torna l'originale.
 *
 * Ritorna **lo stesso riferimento** quando non c'e' nulla da fare: e' cosi' che i
 * casi sani restano byte-identici e le memo a valle non si invalidano.
 */
export function avoidNodeRects(points: Pt[], rects: Rect[]): Pt[] {
    if (points.length < 2 || rects.length === 0 || rects.length > AVOID_MAX_RECTS) return points;
    if (pathBlockingRects(points, rects).length === 0) return points;
    const rerouted = routeAroundRects(points, rects);
    if (!rerouted || rerouted.length < 2) return points;
    if (pathBlockingRects(rerouted, rects).length > 0) return points;
    return rerouted;
}

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
 * Finds the best position for an edge label.
 * Chooses the longest segment of the path and positions the label at its center.
 *
 * @param path - SVG path ("M x y L x y L x y ...")
 * @returns { x, y } - Coordinates for the label
 */
export function computeLabelPosition(path: string): { x: number; y: number } {
    const points = parsePathPoints(path);
    if (points.length < 2) return { x: 0, y: 0 };

    let longestLength = 0;
    let longestMidpoint = { x: 0, y: 0 };

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const length = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);

        if (length > longestLength) {
            longestLength = length;
            longestMidpoint = {
                x: (p1.x + p2.x) / 2,
                y: (p1.y + p2.y) / 2,
            };
        }
    }

    return longestMidpoint;
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

export interface TreeConnectorGeometry {
    /** Path from bar up to parent — gets markerEnd triangle */
    trunkPath: string;
    /** Horizontal bar + vertical branches to children — no marker */
    barAndBranchesPath: string;
    /** Per-edge hit-test paths (edgeId → L-shaped route from trunk junction to child) */
    branchPaths: Map<string, string>;
}

/**
 * Computes the geometry of a tree connector for inheritance edges.
 *
 * Layout (parent above children — standard UML):
 *   parentX, parentY (bottom center of parent)
 *       │  trunk
 *   ────┼────  bar (horizontal, at barY)
 *   │       │  branches (vertical, to child tops)
 *   C1      C2
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
        return { trunkPath, barAndBranchesPath: '', branchPaths };
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

    // Trunk: from near-bar up to parent (markerEnd will be placed at the parent end).
    // Shortened by CORNER_RADIUS so the trunk's straight line doesn't overlap the
    // rounded corner arcs that branch paths draw at the (parentX, barY) junction.
    const CORNER_RADIUS = 4;
    const trunkLen = Math.abs(barY - parentY);
    const trunkGap = Math.min(CORNER_RADIUS, trunkLen * 0.5);
    const trunkDir = parentY < barY ? -1 : 1; // from barY toward parentY
    const trunkStartY = barY + trunkDir * trunkGap;
    const trunkPath = `M ${parentX} ${trunkStartY} L ${parentX} ${parentY}`;

    // Branches: each branch starts near the bar (at trunkStartY) so that the
    // trunk segment is drawn only ONCE (by trunkPath), avoiding opacity build-up
    // when the stroke color has transparency (e.g. rgba).
    // Each branch is a 4-point path with TWO corners:
    //   1. At (parentX, barY): trunk → bar turn (provides rounded junction arc)
    //   2. At (childX, barY): bar → child turn
    let barAndBranches = '';

    const branchPaths = new Map<string, string>();
    for (const child of sorted) {
        // Route: trunkStart → bar → child (4 points, 2 corners)
        const branchPath = `M ${parentX} ${trunkStartY} L ${parentX} ${barY} L ${child.childX} ${barY} L ${child.childX} ${child.childY}`;
        if (barAndBranches) barAndBranches += ' ';
        barAndBranches += branchPath;

        // Hit-test path: full route from parent for better click area
        const hitPath = `M ${parentX} ${parentY} L ${parentX} ${barY} L ${child.childX} ${barY} L ${child.childX} ${child.childY}`;
        branchPaths.set(child.edgeId, hitPath);
    }

    return { trunkPath, barAndBranchesPath: barAndBranches, branchPaths };
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

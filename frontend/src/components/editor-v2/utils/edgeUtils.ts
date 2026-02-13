/**
 * Edge utility functions for Manhattan routing with rounded corners
 *
 * Phase 6: Side-aware routing - the router now knows which side the edge
 * exits from and enters to, producing clean paths without U-turns.
 */

export const EDGE_PADDING = 25;

export type Side = 'top' | 'right' | 'bottom' | 'left';

/**
 * Returns a unit direction vector for a given side.
 * This is the direction the edge EXITS from that side.
 */
function sideDirection(side: Side): { dx: number; dy: number } {
    switch (side) {
        case 'top':    return { dx: 0, dy: -1 };
        case 'right':  return { dx: 1, dy: 0 };
        case 'bottom': return { dx: 0, dy: 1 };
        case 'left':   return { dx: -1, dy: 0 };
    }
}

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
 */
function cleanPoints(points: { x: number; y: number }[]): { x: number; y: number }[] {
    if (points.length < 2) return points;

    // Remove consecutive duplicates
    const deduped: { x: number; y: number }[] = [points[0]];
    for (let i = 1; i < points.length; i++) {
        const prev = deduped[deduped.length - 1];
        if (Math.abs(points[i].x - prev.x) > 0.5 || Math.abs(points[i].y - prev.y) > 0.5) {
            deduped.push(points[i]);
        }
    }

    // Remove collinear points
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
 * Side-aware Manhattan router.
 *
 * Strategy:
 * 1. Extend source point in sourceSide direction by EDGE_PADDING → "exitPoint"
 * 2. Extend target point in targetSide direction by EDGE_PADDING → "entryPoint"
 * 3. Connect exitPoint to entryPoint with 1 or 2 segments (always Manhattan)
 *
 * This produces paths with 3-5 segments total, always respecting exit/entry directions.
 */
export function computeManhattanPath(
    sourceX: number,
    sourceY: number,
    sourceSide: Side,
    targetX: number,
    targetY: number,
    targetSide: Side,
): string {
    const PAD = EDGE_PADDING;

    const srcDir = sideDirection(sourceSide);
    const tgtDir = sideDirection(targetSide);

    // Exit and entry points with padding
    let exitX = sourceX + srcDir.dx * PAD;
    let exitY = sourceY + srcDir.dy * PAD;
    let entryX = targetX + tgtDir.dx * PAD;
    let entryY = targetY + tgtDir.dy * PAD;

    // Check if we need extra padding (backtracking scenario)
    const exitH = srcDir.dx !== 0;
    const entryH = tgtDir.dx !== 0;

    // Does the exit→entry direction conflict with exit direction?
    const dxToEntry = entryX - exitX;
    const dyToEntry = entryY - exitY;

    const exitConflict = (srcDir.dx > 0 && dxToEntry < -PAD) || (srcDir.dx < 0 && dxToEntry > PAD)
        || (srcDir.dy > 0 && dyToEntry < -PAD) || (srcDir.dy < 0 && dyToEntry > PAD);

    if (exitConflict) {
        // Extend padding further to avoid backtracking
        exitX = sourceX + srcDir.dx * PAD * 2;
        exitY = sourceY + srcDir.dy * PAD * 2;
        entryX = targetX + tgtDir.dx * PAD * 2;
        entryY = targetY + tgtDir.dy * PAD * 2;
    }

    // Build point array
    const points: { x: number; y: number }[] = [
        { x: sourceX, y: sourceY },
        { x: exitX, y: exitY },
    ];

    // Connect exit → entry
    if (exitH && entryH) {
        // Both horizontal exits: use midY
        if (Math.abs(exitY - entryY) < 1) {
            points.push({ x: entryX, y: entryY });
        } else {
            const midY = (exitY + entryY) / 2;
            points.push({ x: exitX, y: midY });
            points.push({ x: entryX, y: midY });
            points.push({ x: entryX, y: entryY });
        }
    } else if (exitH && !entryH) {
        // Exit horizontal, entry vertical: L-shape
        points.push({ x: entryX, y: exitY });
        points.push({ x: entryX, y: entryY });
    } else if (!exitH && entryH) {
        // Exit vertical, entry horizontal: L-shape
        points.push({ x: exitX, y: entryY });
        points.push({ x: entryX, y: entryY });
    } else {
        // Both vertical: use midX
        if (Math.abs(exitX - entryX) < 1) {
            points.push({ x: entryX, y: entryY });
        } else {
            const midX = (exitX + entryX) / 2;
            points.push({ x: midX, y: exitY });
            points.push({ x: midX, y: entryY });
            points.push({ x: entryX, y: entryY });
        }
    }

    // Final target point
    points.push({ x: targetX, y: targetY });

    // Clean up: remove duplicates and collinear points
    return pointsToPath(cleanPoints(points));
}

// ============================================
// OBSTACLE AVOIDANCE
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
    margin: number = 5
): boolean {
    const rLeft = rect.x - margin;
    const rRight = rect.x + rect.width + margin;
    const rTop = rect.y - margin;
    const rBottom = rect.y + rect.height + margin;

    if (Math.abs(y1 - y2) < 1) {
        // Horizontal segment
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return y1 > rTop && y1 < rBottom && maxX > rLeft && minX < rRight;
    }

    if (Math.abs(x1 - x2) < 1) {
        // Vertical segment
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return x1 > rLeft && x1 < rRight && maxY > rTop && minY < rBottom;
    }

    return false;
}

/**
 * Post-processes a Manhattan path to avoid obstacles (other nodes).
 *
 * Strategy:
 * For each segment that crosses a node, shift it to go around the node.
 * - Horizontal segment crossing a node → split into segments that go above or below
 * - Vertical segment crossing a node → split into segments that go left or right
 *
 * @param points - Array of path points from computeManhattanPath
 * @param obstacles - Array of node rectangles to avoid (exclude source and target nodes)
 * @param pad - Minimum distance from obstacles (default EDGE_PADDING)
 * @returns Adjusted points array that avoids all obstacles
 */
export function avoidObstacles(
    points: { x: number; y: number }[],
    obstacles: Rect[],
    pad: number = EDGE_PADDING
): { x: number; y: number }[] {
    if (obstacles.length === 0 || points.length < 2) return points;

    // We may need multiple passes since fixing one collision could create another
    let current = [...points.map(p => ({ ...p }))];
    const MAX_ITERATIONS = 3;

    for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
        let changed = false;
        const newPoints: { x: number; y: number }[] = [current[0]];

        for (let i = 0; i < current.length - 1; i++) {
            const p1 = current[i];
            const p2 = current[i + 1];

            // Find the first obstacle this segment hits
            let hitRect: Rect | null = null;
            for (const obs of obstacles) {
                if (segmentHitsRect(p1.x, p1.y, p2.x, p2.y, obs)) {
                    hitRect = obs;
                    break;
                }
            }

            if (!hitRect) {
                // No collision, keep the endpoint
                newPoints.push(p2);
                continue;
            }

            changed = true;

            if (Math.abs(p1.y - p2.y) < 1) {
                // HORIZONTAL segment hitting a node
                // Decide: go above or below the obstacle?
                const segY = p1.y;
                const obstacleTopY = hitRect.y - pad;
                const obstacleBottomY = hitRect.y + hitRect.height + pad;

                // Choose the closer detour
                const goAbove = Math.abs(segY - obstacleTopY) <= Math.abs(segY - obstacleBottomY);
                const detourY = goAbove ? obstacleTopY : obstacleBottomY;

                // Calculate detour points
                const beforeX = hitRect.x - pad;
                const afterX = hitRect.x + hitRect.width + pad;

                // Clamp to stay within the segment's X range
                const minX = Math.min(p1.x, p2.x);
                const maxX = Math.max(p1.x, p2.x);
                const clampedBeforeX = Math.max(beforeX, minX);
                const clampedAfterX = Math.min(afterX, maxX);

                newPoints.push({ x: clampedBeforeX, y: segY });
                newPoints.push({ x: clampedBeforeX, y: detourY });
                newPoints.push({ x: clampedAfterX, y: detourY });
                newPoints.push({ x: clampedAfterX, y: segY });
                newPoints.push(p2);
            } else if (Math.abs(p1.x - p2.x) < 1) {
                // VERTICAL segment hitting a node
                // Decide: go left or right?
                const segX = p1.x;
                const obstacleLeftX = hitRect.x - pad;
                const obstacleRightX = hitRect.x + hitRect.width + pad;

                const goLeft = Math.abs(segX - obstacleLeftX) <= Math.abs(segX - obstacleRightX);
                const detourX = goLeft ? obstacleLeftX : obstacleRightX;

                const beforeY = hitRect.y - pad;
                const afterY = hitRect.y + hitRect.height + pad;

                const minY = Math.min(p1.y, p2.y);
                const maxY = Math.max(p1.y, p2.y);
                const clampedBeforeY = Math.max(beforeY, minY);
                const clampedAfterY = Math.min(afterY, maxY);

                newPoints.push({ x: segX, y: clampedBeforeY });
                newPoints.push({ x: detourX, y: clampedBeforeY });
                newPoints.push({ x: detourX, y: clampedAfterY });
                newPoints.push({ x: segX, y: clampedAfterY });
                newPoints.push(p2);
            } else {
                // Diagonal segment (shouldn't happen in Manhattan routing)
                newPoints.push(p2);
            }
        }

        current = cleanPoints(newPoints);

        if (!changed) break;
    }

    return current;
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
    const points: { x: number; y: number }[] = [];
    const commands = path.match(/[ML]\s*[-\d.]+\s+[-\d.]+/g);
    if (!commands) return path;

    for (const cmd of commands) {
        const nums = cmd.match(/[-\d.]+/g);
        if (nums && nums.length >= 2) {
            points.push({ x: parseFloat(nums[0]), y: parseFloat(nums[1]) });
        }
    }

    if (points.length < 3) return path;

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

        // Radius cannot exceed half of shortest segment
        const r = Math.min(radius, len1 / 2, len2 / 2);

        if (r < 1) {
            // Segment too short, no arc
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
    offset: number = 25
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

    for (const wp of waypoints) {
        const i = wp.segmentIndex;
        if (i < 0 || i >= adjusted.length - 1) continue;

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

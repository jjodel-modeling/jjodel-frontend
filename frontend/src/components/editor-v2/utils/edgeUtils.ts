/**
 * Edge utility functions for Manhattan routing with rounded corners
 *
 * Phase 6: Side-aware routing - the router now knows which side the edge
 * exits from and enters to, producing clean paths without U-turns.
 *
 * Phase 7: A* grid-based obstacle avoidance (opt-in via OBSTACLE_AVOIDANCE_ENABLED).
 */

import { ObstacleGrid, type Rect as GridRect } from './ObstacleGrid';
import { astarManhattan } from './astarPathfinder';

export const EDGE_PADDING = 25;

/** Toggle for Phase 7 A* obstacle avoidance. Default OFF for incremental testing. */
export const OBSTACLE_AVOIDANCE_ENABLED = false;

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
    _sourceX: number,
    _sourceY: number,
    sourceSide: Side,
    _targetX: number,
    _targetY: number,
    targetSide: Side,
): string {
    const PAD = EDGE_PADDING;

    // Mutable copies (needed for snap adjustments)
    let sourceX = _sourceX;
    let sourceY = _sourceY;
    let targetX = _targetX;
    let targetY = _targetY;

    const srcDir = sideDirection(sourceSide);
    const tgtDir = sideDirection(targetSide);

    // Exit and entry points with padding
    let exitX = sourceX + srcDir.dx * PAD;
    let exitY = sourceY + srcDir.dy * PAD;
    let entryX = targetX + tgtDir.dx * PAD;
    let entryY = targetY + tgtDir.dy * PAD;

    // === SNAP: eliminate micro-offsets that cause wiggles ===
    const SNAP_THRESHOLD = 8;
    const exitH = srcDir.dx !== 0;
    const entryH = tgtDir.dx !== 0;

    // Snap vertical paths (both exits vertical): align X coordinates
    if (!exitH && !entryH && Math.abs(sourceX - targetX) < SNAP_THRESHOLD) {
        const avgX = (sourceX + targetX) / 2;
        sourceX = avgX;
        targetX = avgX;
        exitX = avgX;
        entryX = avgX;
    }

    // Snap horizontal paths (both exits horizontal): align Y coordinates
    if (exitH && entryH && Math.abs(sourceY - targetY) < SNAP_THRESHOLD) {
        const avgY = (sourceY + targetY) / 2;
        sourceY = avgY;
        targetY = avgY;
        exitY = avgY;
        entryY = avgY;
    }

    // For L-shaped paths: snap the shared axis
    if (exitH && !entryH && Math.abs(exitY - entryY) < SNAP_THRESHOLD) {
        entryY = exitY;
    }
    if (!exitH && entryH && Math.abs(exitX - entryX) < SNAP_THRESHOLD) {
        entryX = exitX;
    }

    // Check if we need extra padding (backtracking scenario)
    // (exitH and entryH already defined above)

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

    // === MARKER COMPENSATION ===
    // Edges are rendered BELOW nodes in React Flow (SVG layer under HTML layer).
    // Pushing endpoints INTO the node would hide markers under the node background.
    // Keep endpoints exactly at the border; refX on each marker already aligns
    // the visual tip/base with the path endpoint.
    // Set to 0. Kept as a named constant for easy tuning if needed.
    const MARKER_COMPENSATION = 4;

    // Extend first point (source) into the source node
    points[0].x -= srcDir.dx * MARKER_COMPENSATION;
    points[0].y -= srcDir.dy * MARKER_COMPENSATION;

    // Extend last point (target) into the target node
    const lastIdx = points.length - 1;
    points[lastIdx].x -= tgtDir.dx * MARKER_COMPENSATION;
    points[lastIdx].y -= tgtDir.dy * MARKER_COMPENSATION;

    // Clean up: remove duplicates and collinear points
    return pointsToPath(cleanPoints(points));
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
 * Calculates total Manhattan length of a point sequence.
 */
function totalPathLength(points: { x: number; y: number }[]): number {
    let total = 0;
    for (let i = 0; i < points.length - 1; i++) {
        total += Math.abs(points[i + 1].x - points[i].x) + Math.abs(points[i + 1].y - points[i].y);
    }
    return total;
}

/**
 * Computes the shortest detour around an obstacle for a single segment.
 * Calculates BOTH possible detour directions and picks the shorter one.
 */
function computeSmartDetour(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    rect: Rect,
    pad: number
): { x: number; y: number }[] {
    const isHorizontal = Math.abs(p1.y - p2.y) < 1;

    if (isHorizontal) {
        // Horizontal segment → detour goes above or below
        const segY = p1.y;
        const beforeX = rect.x - pad;
        const afterX = rect.x + rect.width + pad;
        const aboveY = rect.y - pad;
        const belowY = rect.y + rect.height + pad;

        const optionA = [
            p1,
            { x: beforeX, y: segY },
            { x: beforeX, y: aboveY },
            { x: afterX, y: aboveY },
            { x: afterX, y: segY },
            p2,
        ];

        const optionB = [
            p1,
            { x: beforeX, y: segY },
            { x: beforeX, y: belowY },
            { x: afterX, y: belowY },
            { x: afterX, y: segY },
            p2,
        ];

        return totalPathLength(optionA) <= totalPathLength(optionB) ? optionA : optionB;
    } else {
        // Vertical segment → detour goes left or right
        const segX = p1.x;
        const beforeY = rect.y - pad;
        const afterY = rect.y + rect.height + pad;
        const leftX = rect.x - pad;
        const rightX = rect.x + rect.width + pad;

        const optionA = [
            p1,
            { x: segX, y: beforeY },
            { x: leftX, y: beforeY },
            { x: leftX, y: afterY },
            { x: segX, y: afterY },
            p2,
        ];

        const optionB = [
            p1,
            { x: segX, y: beforeY },
            { x: rightX, y: beforeY },
            { x: rightX, y: afterY },
            { x: segX, y: afterY },
            p2,
        ];

        return totalPathLength(optionA) <= totalPathLength(optionB) ? optionA : optionB;
    }
}

/**
 * Post-processes a Manhattan path to avoid obstacles (other nodes).
 *
 * Strategy: for each segment that hits a node, compute both possible detours
 * (left/right or above/below) and pick the shortest one.
 *
 * @param points - Array of path points from computeManhattanPath
 * @param obstacles - Array of node rectangles to avoid (exclude source and target nodes)
 * @param pad - Minimum distance from obstacles (default 15px — compact but visible)
 * @returns Adjusted points array that avoids all obstacles
 */
export function avoidObstacles(
    points: { x: number; y: number }[],
    obstacles: Rect[],
    pad: number = 15
): { x: number; y: number }[] {
    if (obstacles.length === 0 || points.length < 2) return points;

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
                if (segmentHitsRect(p1.x, p1.y, p2.x, p2.y, obs, pad)) {
                    hitRect = obs;
                    break;
                }
            }

            if (!hitRect) {
                newPoints.push(p2);
                continue;
            }

            changed = true;
            const detourPoints = computeSmartDetour(p1, p2, hitRect, pad);
            // Push all detour points except the first (which is p1, already in newPoints)
            for (let d = 1; d < detourPoints.length; d++) {
                newPoints.push(detourPoints[d]);
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

// ============================================
// Port Distribution — indexed handle assignment
// ============================================

/**
 * Extracts the base side from a handle ID.
 * "right" -> "right", "right-0" -> "right", "bottom-1" -> "bottom"
 */
function getBaseSide(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (['top', 'right', 'bottom', 'left'].includes(base)) return base as Side;
    return 'right';
}

interface MinimalEdge {
    id: string;
    source: string;
    target: string;
    type?: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
}

/**
 * Assigns indexed handle IDs to edges based on port sharing rules.
 *
 * Mirrors the grouping logic of DynamicHandles.tsx exactly so that the
 * handle IDs on edges match the Handle elements rendered in the DOM.
 *
 * Rules:
 * - Inheritance targets on the same (node, side) share ONE port (fan-in)
 * - Everything else (sources, reference targets) gets its own port
 * - When multiple ports share a side, they get indexed IDs: "right-0", "right-1", etc.
 * - Single ports keep the plain side name: "right"
 */
export function computeDistributedHandles(
    edges: MinimalEdge[],
): Map<string, { sourceHandle: string; targetHandle: string }> {
    // Collect all unique node IDs
    const nodeIds = new Set<string>();
    for (const e of edges) {
        nodeIds.add(e.source);
        nodeIds.add(e.target);
    }

    // Per-edge handle assignments
    const sourceHandleMap = new Map<string, string>();
    const targetHandleMap = new Map<string, string>();

    // For each node, replicate DynamicHandles' computeNodeHandles logic
    for (const nodeId of nodeIds) {
        const sideGroups: Record<Side, Map<string, { edgeIds: string[]; role: 'source' | 'target' }>> = {
            top: new Map(), right: new Map(), bottom: new Map(), left: new Map(),
        };

        // Iterate edges in array order (same order as DynamicHandles sees via useEdges)
        for (const edge of edges) {
            const edgeType = edge.type || 'reference';

            // As source
            if (edge.source === nodeId) {
                const side = getBaseSide(edge.sourceHandle);
                sideGroups[side].set(`source:${edge.id}`, {
                    edgeIds: [edge.id],
                    role: 'source',
                });
            }

            // As target
            if (edge.target === nodeId) {
                const side = getBaseSide(edge.targetHandle);

                if (edgeType === 'inheritance') {
                    // Inheritance fan-in: merge into single group
                    const existing = sideGroups[side].get('target:inheritance');
                    if (existing) {
                        existing.edgeIds.push(edge.id);
                    } else {
                        sideGroups[side].set('target:inheritance', {
                            edgeIds: [edge.id],
                            role: 'target',
                        });
                    }
                } else {
                    // Reference: each edge gets its own port
                    sideGroups[side].set(`target:${edge.id}`, {
                        edgeIds: [edge.id],
                        role: 'target',
                    });
                }
            }
        }

        // Assign indexed handle IDs per side
        for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
            const groups = Array.from(sideGroups[side].values());
            if (groups.length === 0) continue;

            const totalPorts = groups.length;
            groups.forEach((group, index) => {
                const handleId = totalPorts > 1 ? `${side}-${index}` : side;
                for (const edgeId of group.edgeIds) {
                    if (group.role === 'source') {
                        sourceHandleMap.set(edgeId, handleId);
                    } else {
                        targetHandleMap.set(edgeId, handleId);
                    }
                }
            });
        }
    }

    // Build result
    const result = new Map<string, { sourceHandle: string; targetHandle: string }>();
    for (const edge of edges) {
        result.set(edge.id, {
            sourceHandle: sourceHandleMap.get(edge.id) || getBaseSide(edge.sourceHandle),
            targetHandle: targetHandleMap.get(edge.id) || getBaseSide(edge.targetHandle),
        });
    }
    return result;
}

// ============================================
// Phase 7 — A* routing integration
// ============================================

/**
 * Compute a Manhattan path using the A* grid router.
 *
 * If A* succeeds the returned SVG path string already includes
 * marker compensation (same 1px rule as computeManhattanPath).
 * If A* fails, falls back to the classic computeManhattanPath.
 *
 * @param grid - Shared obstacle grid from ObstacleGridContext
 * @param sourceX - Source handle X
 * @param sourceY - Source handle Y
 * @param sourceSide - Exit side
 * @param targetX - Target handle X
 * @param targetY - Target handle Y
 * @param targetSide - Entry side
 * @param sourceNodeId - ID of source node (to exclude from obstacles)
 * @param targetNodeId - ID of target node (to exclude from obstacles)
 * @param allNodes - All React Flow nodes (for building per-edge grid exclusions)
 */
export function computeAStarPath(
    grid: ObstacleGrid,
    sourceX: number,
    sourceY: number,
    sourceSide: Side,
    targetX: number,
    targetY: number,
    targetSide: Side,
    sourceNodeId: string,
    targetNodeId: string,
    allNodes: Array<{ id: string; type?: string; parentId?: string; parentNode?: string;
        position: { x: number; y: number };
        internals?: { positionAbsolute?: { x: number; y: number } };
        positionAbsolute?: { x: number; y: number };
        measured?: { width?: number; height?: number };
        width?: number; height?: number;
    }>,
): string {
    // Clone the shared grid so per-edge exclusions don't leak
    // (cheap — we just re-create and re-mark, skipping src/tgt/packages/ancestors)

    const nodeRects: Array<{ id: string; type: string | undefined; parentId: string | undefined; rect: GridRect }> = [];
    for (const n of allNodes) {
        const pos = (n.internals?.positionAbsolute ?? n.positionAbsolute ?? n.position) as { x: number; y: number };
        nodeRects.push({
            id: n.id,
            type: n.type,
            parentId: (n as any).parentId ?? (n as any).parentNode,
            rect: {
                x: pos.x,
                y: pos.y,
                width: n.measured?.width ?? n.width ?? 180,
                height: n.measured?.height ?? n.height ?? 80,
            },
        });
    }

    // Collect IDs of ancestors of source/target (packages that contain them)
    const ancestorIds = new Set<string>();
    const collectAncestors = (nodeId: string) => {
        const entry = nodeRects.find(n => n.id === nodeId);
        if (entry?.parentId) {
            ancestorIds.add(entry.parentId);
            collectAncestors(entry.parentId);
        }
    };
    collectAncestors(sourceNodeId);
    collectAncestors(targetNodeId);

    // Build a per-edge grid that excludes source, target, packages, and ancestors
    const bounds = { ...grid['config'].bounds };  // reuse the shared grid bounds
    const perEdgeGrid = new ObstacleGrid({
        cellSize: 10,
        padding: 20,
        bounds,
    });

    for (const entry of nodeRects) {
        // Skip source and target nodes
        if (entry.id === sourceNodeId || entry.id === targetNodeId) continue;
        // Skip package nodes (containers)
        if (entry.type === 'packageNode') continue;
        // Skip ancestor containers
        if (ancestorIds.has(entry.id)) continue;

        perEdgeGrid.markObstacle(entry.rect);
    }

    // Clear corridors for source and target so the path can reach them
    const sourceEntry = nodeRects.find(n => n.id === sourceNodeId);
    const targetEntry = nodeRects.find(n => n.id === targetNodeId);
    if (sourceEntry) perEdgeGrid.clearCorridor(sourceEntry.rect, sourceSide, 4);
    if (targetEntry) perEdgeGrid.clearCorridor(targetEntry.rect, targetSide, 4);

    // Run A*
    const result = astarManhattan(
        perEdgeGrid,
        { x: sourceX, y: sourceY },
        { x: targetX, y: targetY },
        sourceSide,
        targetSide,
    );

    if (!result.success || result.path.length < 2) {
        // Fallback to classic routing
        return computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide);
    }

    // No marker compensation needed — endpoints at exact border position.
    // (Edges render below nodes; pushing inside would hide markers.)
    return pointsToPath(cleanPoints(result.path.map(p => ({ ...p }))));
}

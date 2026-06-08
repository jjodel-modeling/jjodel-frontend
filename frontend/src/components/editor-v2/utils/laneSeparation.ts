/**
 * Lane separation (Lever 2) — global segment lane separation for orthogonal edges.
 *
 * PHASE A (this file, current state): geometry reconstruction only.
 *
 * Reconstructs, synchronously and with the FULL edge list, the post-applyWaypoints point
 * array each edge will render — using the SAME pure functions the render uses
 * (computeManhattanPath, computeSideEndpoints/computeSidePositions, applyWaypoints). No
 * bundle spread, no lane offset is produced yet. The reconstruction exists so the relative
 * geometry (edge-to-edge) can be sanity-checked against the RF-measured truth captured in
 * UnifiedEdge before the lane logic is built in Phase B.
 *
 * Lane separation is a *relative* decision, so any absolute drift between this reconstruction
 * and ReactFlow's measured handle positions is irrelevant as long as the reconstruction uses
 * the same pure functions as the render — which is exactly what Phase A measures.
 *
 * Critical-zone pure functions (handlePosition.ts, portDistribution.ts, edgeUtils.ts'
 * computeManhattanPath) are IMPORTED, never modified.
 */
import {
    computeManhattanPath,
    parsePathPoints,
    applyWaypoints,
    getSideFromHandle,
    type Side,
} from './edgeUtils';
import { computeSideEndpoints, computeSidePositions } from './handlePosition';
import type { NodePosition } from './portDistribution';
import type { EdgeWaypoint } from '../types';

/**
 * Debug gate for Phase A instrumentation. When true, the producer (applyDistribution) logs
 * the reconstructed point array per edge and the consumer (UnifiedEdge) logs the RF-measured
 * spreadPoints per edge, both keyed by edgeId so a console capture can be diffed offline.
 * Removed in Phase B.
 */
export const LANE_DEBUG = true;

export interface LaneRect {
    x: number;
    y: number;
    width: number;
    height: number;
}

/** Minimal edge shape consumed by the reconstruction. Mirrors what computeSideEndpoints needs. */
export interface ReconstructEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string | null;
    data?: { waypoints?: EdgeWaypoint[] } & Record<string, unknown>;
}

export interface Point {
    x: number;
    y: number;
}

/**
 * Absolute canvas coordinate of one endpoint, reconstructed from (node rect + side + the
 * along-side percent computed by computeSidePositions). Mirrors DynamicHandles' percent →
 * CSS top/left mapping exactly, so the reconstruction tracks what is rendered.
 */
function anchorCoord(
    nodeId: string,
    handleId: string,
    role: 'source' | 'target',
    side: Side,
    rect: LaneRect,
    allEdges: ReconstructEdge[],
    nodePositions: Map<string, NodePosition>,
): Point {
    const positions = computeSidePositions(
        computeSideEndpoints(allEdges, nodeId, side),
        nodePositions,
    );
    const percent = positions.get(`${handleId}:${role}`) ?? 0.5;

    // top/bottom: percent maps to X; left/right: percent maps to Y (mirrors DynamicHandles).
    const x = side === 'right' ? rect.x + rect.width
        : side === 'left' ? rect.x
        : rect.x + percent * rect.width;
    const y = side === 'bottom' ? rect.y + rect.height
        : side === 'top' ? rect.y
        : rect.y + percent * rect.height;
    return { x, y };
}

/**
 * Reconstructs the post-applyWaypoints point array for one edge.
 *
 * NOTE on signature: the discovery report's illustrative signature was
 * `reconstructEdgePoints(edge, nodeRects)`. The reconstruction structurally also needs (a) the
 * full edge list — `computeSideEndpoints` requires every edge on a node's side to derive the
 * along-side percent — and (b) the node-center positions map, so `computeSidePositions`'
 * geometry-aware ordering matches the render. Both are flagged in the Phase A log.
 *
 * @returns the point array, or [] when the edge geometry is not resolvable (missing rect or
 *          unassigned handle). No bundle spread, no lane offset applied.
 */
export function reconstructEdgePoints(
    edge: ReconstructEdge,
    allEdges: ReconstructEdge[],
    nodeRects: Map<string, LaneRect>,
    nodePositions: Map<string, NodePosition>,
): Point[] {
    const srcRect = nodeRects.get(edge.source);
    const tgtRect = nodeRects.get(edge.target);
    if (!srcRect || !tgtRect) return [];
    if (!edge.sourceHandle || !edge.targetHandle) return [];

    const srcSide = getSideFromHandle(edge.sourceHandle);
    const tgtSide = getSideFromHandle(edge.targetHandle);

    const src = anchorCoord(edge.source, edge.sourceHandle, 'source', srcSide, srcRect, allEdges, nodePositions);
    const tgt = anchorCoord(edge.target, edge.targetHandle, 'target', tgtSide, tgtRect, allEdges, nodePositions);

    const path = computeManhattanPath(src.x, src.y, srcSide, tgt.x, tgt.y, tgtSide);
    const points = parsePathPoints(path);
    const waypoints = edge.data?.waypoints ?? [];
    return waypoints.length > 0 ? applyWaypoints(points, waypoints) : points;
}

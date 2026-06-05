import { useCallback } from 'react';
import { useNodes } from '@xyflow/react';
import type { AnchorConfig, AnchorSide } from '../types';

const SIDES = ['top', 'right', 'bottom', 'left'] as const;
type Side = (typeof SIDES)[number];

interface NodeRect {
    x: number;
    y: number;
    width: number;
    height: number;
    centerX: number;
    centerY: number;
}

/**
 * Gets the bounding rect for a node including center coordinates.
 */
function getNodeRect(node: any): NodeRect {
    const x = node.position.x;
    const y = node.position.y;
    const width = node.measured?.width ?? node.width ?? node.style?.width ?? 180;
    const height = node.measured?.height ?? node.height ?? node.style?.height ?? 80;

    return {
        x,
        y,
        width,
        height,
        centerX: x + width / 2,
        centerY: y + height / 2,
    };
}

/**
 * Bundles every co-located edge group onto a shared facing channel.
 *
 * Any group of edges sharing the same unordered node pair {A,B} with two or more
 * routable edges (references; inheritance and self-references are excluded) is forced
 * onto the facing (opposing) side-pair, chosen by the dominant axis between the two
 * nodes — the same rule as jjomTransformers.computeOptimalHandles (vertical-dominant on
 * ties) so load-time and post-drag side selection agree. Each edge's source endpoint
 * lands on the source box's facing side and its target endpoint on the target box's
 * facing side, so covariant ({A→B, A→B}) and contravariant ({A→B, B→A}) groups share the
 * same two facing sides; the directions are separated downstream on that shared channel
 * by computeSidePositions' pair-stable ordering.
 *
 * Name retained for historical continuity even though the scope is no longer limited to
 * bidirectional pairs.
 *
 * @param edges - Array of edges with their computed anchors
 * @param nodeRects - Map of node IDs to their rectangles
 * @returns Map of edge IDs to adjusted anchor handles
 */
function deconflictBidirectionalEdges(
    edges: { id: string; source: string; target: string; sourceHandle: string; targetHandle: string; type?: string }[],
    nodeRects: Map<string, NodeRect>
): Map<string, { sourceHandle: string; targetHandle: string }> {
    const result = new Map<string, { sourceHandle: string; targetHandle: string }>();

    // Group edges by node pair (sorted to group A→B with B→A)
    const pairMap = new Map<string, typeof edges>();
    for (const edge of edges) {
        const pairKey = [edge.source, edge.target].sort().join('::');
        const group = pairMap.get(pairKey) || [];
        group.push(edge);
        pairMap.set(pairKey, group);
    }

    // Process each pair group
    for (const [, group] of pairMap) {
        // Only references participate: inheritance keeps its sacred top/bottom convention
        // and self-references have a dedicated routing, so both are left untouched here.
        const routable = group.filter(e => e.type !== 'inheritance' && e.source !== e.target);

        // A facing channel is only meaningful when two or more edges share the pair.
        // Single edges keep the per-edge side selection computed upstream.
        if (routable.length < 2) continue;

        // The two distinct endpoint nodes of this group (every routable edge connects them).
        const nodeA = routable[0].source;
        const nodeB = routable[0].target;
        const rectA = nodeRects.get(nodeA);
        const rectB = nodeRects.get(nodeB);
        if (!rectA || !rectB) continue;

        // Facing side-pair by dominant axis (vertical-dominant on ties), mirroring
        // jjomTransformers.computeOptimalHandles so load-time and post-drag agree.
        // sideA faces from A toward B; sideB is its opposite, on B.
        const dx = rectB.centerX - rectA.centerX;
        const dy = rectB.centerY - rectA.centerY;
        const isVerticalDominant = Math.abs(dy) >= Math.abs(dx);
        let sideA: Side;
        let sideB: Side;
        if (isVerticalDominant) {
            if (dy >= 0) { sideA = 'bottom'; sideB = 'top'; } // B below A
            else { sideA = 'top'; sideB = 'bottom'; }         // B above A
        } else {
            if (dx > 0) { sideA = 'right'; sideB = 'left'; }  // B right of A
            else { sideA = 'left'; sideB = 'right'; }         // B left of A
        }

        // Per-edge, direction-aware assignment: each endpoint lands on its own box's
        // facing side. Covariant and contravariant groups thus share the same two facing
        // sides; computeSidePositions' pair-stable ordering then separates the edges into
        // parallel paths on that shared channel.
        for (const edge of routable) {
            const sourceHandle = edge.source === nodeA ? sideA : sideB;
            const targetHandle = edge.target === nodeA ? sideA : sideB;
            result.set(edge.id, { sourceHandle, targetHandle });
        }
    }

    return result;
}

// Angular dead-zone thresholds (radians)
const DEG_30 = Math.PI / 6;
const DEG_60 = Math.PI / 3;

/**
 * Computes the best anchor pair using angular dead-zone logic.
 *
 * - Overlap on X axis → force vertical routing
 * - Overlap on Y axis → force horizontal routing
 * - angle < 30° → strongly horizontal
 * - angle > 60° → strongly vertical
 * - 30°–60° (dead zone) → keep current sides if available, else nearest-side
 *
 * @param sourceRect - The source node rectangle
 * @param targetRect - The target node rectangle
 * @param isSelfReference - Whether this is a self-referencing edge
 * @param edgeType - Optional edge type for semantic preferences
 * @param currentSourceSide - Current source side (for dead-zone retention)
 * @param currentTargetSide - Current target side (for dead-zone retention)
 */
function computeBestAnchors(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    isSelfReference: boolean,
    edgeType?: 'inheritance' | 'reference',
    currentSourceSide?: Side,
    currentTargetSide?: Side,
): { sourceHandle: string; targetHandle: string } {
    // Self-reference: fixed handles for compact loop
    if (isSelfReference) {
        return { sourceHandle: 'right', targetHandle: 'top' };
    }

    // Inheritance: always child=top, parent=bottom (UML convention)
    if (edgeType === 'inheritance') {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
    }

    // Reference: angular dead-zone approach
    const dx = targetRect.centerX - sourceRect.centerX;
    const dy = targetRect.centerY - sourceRect.centerY;

    // Overlap detection: do the node projections overlap on each axis?
    const overlapX = !(sourceRect.x + sourceRect.width < targetRect.x ||
                       targetRect.x + targetRect.width < sourceRect.x);
    const overlapY = !(sourceRect.y + sourceRect.height < targetRect.y ||
                       targetRect.y + targetRect.height < sourceRect.y);

    // Nodes overlap on X → force vertical
    if (overlapX && !overlapY) {
        if (dy > 0) return { sourceHandle: 'bottom', targetHandle: 'top' };
        return { sourceHandle: 'top', targetHandle: 'bottom' };
    }

    // Nodes overlap on Y → force horizontal
    if (overlapY && !overlapX) {
        if (dx > 0) return { sourceHandle: 'right', targetHandle: 'left' };
        return { sourceHandle: 'left', targetHandle: 'right' };
    }

    // Angular classification
    const angle = Math.atan2(Math.abs(dy), Math.abs(dx));

    let sourceSide: Side;
    let targetSide: Side;

    if (angle < DEG_30) {
        // Strongly horizontal
        sourceSide = dx > 0 ? 'right' : 'left';
        targetSide = dx > 0 ? 'left' : 'right';
    } else if (angle > DEG_60) {
        // Strongly vertical
        sourceSide = dy > 0 ? 'bottom' : 'top';
        targetSide = dy > 0 ? 'top' : 'bottom';
    } else {
        // Dead zone (30°–60°): keep current if available
        if (currentSourceSide && currentTargetSide) {
            sourceSide = currentSourceSide;
            targetSide = currentTargetSide;
        } else {
            // No prior state — use nearest-side
            if (Math.abs(dx) >= Math.abs(dy)) {
                sourceSide = dx > 0 ? 'right' : 'left';
                targetSide = dx > 0 ? 'left' : 'right';
            } else {
                sourceSide = dy > 0 ? 'bottom' : 'top';
                targetSide = dy > 0 ? 'top' : 'bottom';
            }
        }
    }

    return { sourceHandle: sourceSide, targetHandle: targetSide };
}

/** Edge shape consumed by computeAnchorsWithHysteresis */
interface MinimalEdgeWithData {
    id: string;
    source: string;
    target: string;
    type?: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    data?: {
        sourceAnchor?: AnchorConfig;
        targetAnchor?: AnchorConfig;
        [key: string]: unknown;
    };
}

/** Result shape returned per edge */
interface AnchorResult {
    sourceHandle: string;
    targetHandle: string;
    sourceAnchor: AnchorConfig;
    targetAnchor: AnchorConfig;
}

/**
 * Extracts the base side from a handle ID string.
 * "right" → "right", "right-0" → "right", "bottom-1" → "bottom"
 */
function getBaseSide(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (SIDES.includes(base as Side)) return base as Side;
    return 'right';
}

/**
 * Reads anchor config from edge data with fallback for legacy edges.
 */
function getAnchorConfig(
    edgeData: MinimalEdgeWithData['data'],
    endpoint: 'source' | 'target',
    handleId: string | null | undefined
): AnchorConfig {
    const config = endpoint === 'source' ? edgeData?.sourceAnchor : edgeData?.targetAnchor;
    if (config) return config;
    // Default: treat as auto — a pin must be EXPLICIT (the edge carries a
    // data.sourceAnchor/targetAnchor with mode === 'pinned', written only by a manual
    // endpoint drag). Edges without any anchor config (e.g. from load/import) stay
    // re-routable by the hysteresis when nodes are dragged, instead of being frozen at
    // their initial placement.
    return { mode: 'auto', side: getBaseSide(handleId) as AnchorSide };
}

/**
 * Computes anchors for all edges with hysteresis — only switches sides when
 * the new side is significantly better (30% improvement threshold).
 *
 * Respects pinned anchors and applies bidirectional deconfliction.
 */
function computeAnchorsWithHysteresis(
    edges: MinimalEdgeWithData[],
    nodeRects: Map<string, NodeRect>,
    contextEdges?: EdgeContext[],
): Map<string, AnchorResult> {
    const result = new Map<string, AnchorResult>();

    // First pass: compute anchors per edge with hysteresis
    const edgesWithAnchors: Array<MinimalEdgeWithData & { sourceHandle: string; targetHandle: string }> = [];

    for (const edge of edges) {
        const sourceRect = nodeRects.get(edge.source);
        const targetRect = nodeRects.get(edge.target);

        if (!sourceRect || !targetRect) {
            const fallback: AnchorResult = {
                sourceHandle: 'right', targetHandle: 'left',
                sourceAnchor: { mode: 'auto', side: 'right' },
                targetAnchor: { mode: 'auto', side: 'left' },
            };
            result.set(edge.id, fallback);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'right', targetHandle: 'left' });
            continue;
        }

        const isSelfReference = edge.source === edge.target;
        const currentSource = getAnchorConfig(edge.data, 'source', edge.sourceHandle);
        const currentTarget = getAnchorConfig(edge.data, 'target', edge.targetHandle);

        // Self-reference: fixed handles
        if (isSelfReference) {
            const r: AnchorResult = {
                sourceHandle: 'right', targetHandle: 'top',
                sourceAnchor: { mode: 'auto', side: 'right' },
                targetAnchor: { mode: 'auto', side: 'top' },
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'right', targetHandle: 'top' });
            continue;
        }

        // Any pinned anchor: freeze the entire edge — don't reroute either endpoint.
        // Once the user manually places an anchor, automatic rerouting must not
        // override their intent (even for the other, non-pinned endpoint).
        if (currentSource.mode === 'pinned' || currentTarget.mode === 'pinned') {
            const r: AnchorResult = {
                sourceHandle: currentSource.side, targetHandle: currentTarget.side,
                sourceAnchor: currentSource, targetAnchor: currentTarget,
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: currentSource.side, targetHandle: currentTarget.side });
            continue;
        }

        // After the pinned-anchor early return above, both endpoints are 'auto' here.

        // Inheritance: enforce top→bottom convention (source=child→top, target=parent→bottom).
        // The edge creation pipeline (handleEdgeTypeSelected) establishes this convention;
        // hysteresis must never invert it regardless of relative node positions.
        const edgeType = edge.type === 'inheritance' ? 'inheritance' : 'reference';
        if (edgeType === 'inheritance') {
            const r: AnchorResult = {
                sourceHandle: 'top', targetHandle: 'bottom',
                sourceAnchor: { mode: 'auto', side: 'top' },
                targetAnchor: { mode: 'auto', side: 'bottom' },
            };
            result.set(edge.id, r);
            edgesWithAnchors.push({ ...edge, sourceHandle: 'top', targetHandle: 'bottom' });
            continue;
        }

        // Different-type same-pair rule: if an edge of a different type (e.g. inheritance)
        // exists between the same two nodes, force same-side routing (right→right or left→left)
        const hasDifferentTypeOnPair = edges.some(
            e => e.id !== edge.id &&
                 ((e.source === edge.source && e.target === edge.target) ||
                  (e.source === edge.target && e.target === edge.source)) &&
                 (e.type || 'reference') !== edgeType
        );

        let finalSourceSide: AnchorSide;
        let finalTargetSide: AnchorSide;

        if (hasDifferentTypeOnPair) {
            // Count lateral occupancy for both nodes (excluding self-refs and edges between this pair)
            const sideOcc: Record<'right' | 'left', number> = { right: 0, left: 0 };
            for (const e of edges) {
                if (e.source === e.target || e.id === edge.id) continue;
                if ((e.source === edge.source && e.target === edge.target) ||
                    (e.source === edge.target && e.target === edge.source)) continue;
                for (const s of ['right', 'left'] as const) {
                    if (e.source === edge.source && getBaseSide(e.sourceHandle) === s) sideOcc[s]++;
                    if (e.target === edge.source && getBaseSide(e.targetHandle) === s) sideOcc[s]++;
                    if (e.source === edge.target && getBaseSide(e.sourceHandle) === s) sideOcc[s]++;
                    if (e.target === edge.target && getBaseSide(e.targetHandle) === s) sideOcc[s]++;
                }
            }
            const bestSide: AnchorSide = sideOcc.left < sideOcc.right ? 'left' : 'right';
            finalSourceSide = bestSide;
            finalTargetSide = bestSide;
        } else {
            // Reference with both auto sides: compute best with occupancy scoring
            // so edges from the same node prefer different sides.
            const edgeContext = contextEdges || edges as unknown as EdgeContext[];
            const best = computeBestAnchorsWithContext(
                sourceRect, targetRect, edge.source, edge.target,
                'reference', edgeContext,
            );

            // Dead-zone hysteresis: in the ambiguous 30°–60° angle range,
            // keep the current sides to avoid constant flipping.
            const dx = targetRect.centerX - sourceRect.centerX;
            const dy = targetRect.centerY - sourceRect.centerY;
            const angle = Math.atan2(Math.abs(dy), Math.abs(dx));

            if (angle >= DEG_30 && angle <= DEG_60) {
                finalSourceSide = currentSource.side;
                finalTargetSide = currentTarget.side;
            } else {
                finalSourceSide = best.sourceHandle as AnchorSide;
                finalTargetSide = best.targetHandle as AnchorSide;
            }
        }

        const r: AnchorResult = {
            sourceHandle: finalSourceSide,
            targetHandle: finalTargetSide,
            sourceAnchor: { mode: 'auto', side: finalSourceSide },
            targetAnchor: { mode: 'auto', side: finalTargetSide },
        };
        result.set(edge.id, r);
        edgesWithAnchors.push({ ...edge, sourceHandle: finalSourceSide, targetHandle: finalTargetSide });
    }

    // Second pass: bidirectional deconfliction
    const deconflicted = deconflictBidirectionalEdges(edgesWithAnchors, nodeRects);

    // Merge deconfliction results — update handle IDs and anchor sides.
    // IMPORTANT: never overwrite a pinned endpoint's side or an inheritance edge's convention.
    for (const [edgeId, adjusted] of deconflicted) {
        const existing = result.get(edgeId);
        if (existing) {
            // Find the original edge to check its type
            const originalEdge = edges.find(e => e.id === edgeId);
            const isInheritance = originalEdge?.type === 'inheritance';

            // Inheritance edges: never override — top→bottom convention is sacred
            if (isInheritance) continue;

            // Any pinned anchor: freeze entire edge — don't let deconfliction
            // override user's manual placement
            const srcPinned = existing.sourceAnchor.mode === 'pinned';
            const tgtPinned = existing.targetAnchor.mode === 'pinned';
            if (srcPinned || tgtPinned) continue;

            result.set(edgeId, {
                sourceHandle: adjusted.sourceHandle,
                targetHandle: adjusted.targetHandle,
                sourceAnchor: { mode: 'auto', side: adjusted.sourceHandle as AnchorSide },
                targetAnchor: { mode: 'auto', side: adjusted.targetHandle as AnchorSide },
            });
        }
    }

    return result;
}

// Side direction vectors for geometric scoring
const SIDE_VECTORS: Record<Side, [number, number]> = {
    top: [0, -1],
    right: [1, 0],
    bottom: [0, 1],
    left: [-1, 0],
};

// Tie-breaking: leave top free for inheritance convention
const SIDE_PREFERENCE: Record<Side, number> = {
    bottom: 3,
    right: 2,
    left: 1,
    top: 0,
};

/** Minimal edge shape for occupancy context */
interface EdgeContext {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
}

/**
 * Computes the best anchor pair considering existing edges on each side.
 * Used during edge creation to avoid crowding occupied sides.
 *
 * Algorithm:
 * 1. Self-reference / Inheritance: same rules as computeBestAnchors
 * 2. Scoring: geometric fitness - occupancy penalty - mixed-type penalty - U-shape penalty + tie-break
 *    Candidates include both opposing pairs (Z-shape) and same-side pairs (U-shape)
 */
function computeBestAnchorsWithContext(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    sourceId: string,
    targetId: string,
    edgeType: 'inheritance' | 'reference' | undefined,
    existingEdges: EdgeContext[],
): { sourceHandle: string; targetHandle: string } {
    // Self-reference: fixed handles
    if (sourceId === targetId) {
        return { sourceHandle: 'right', targetHandle: 'top' };
    }

    // Inheritance: always child=top, parent=bottom (UML convention)
    if (edgeType === 'inheritance') {
        return { sourceHandle: 'top', targetHandle: 'bottom' };
    }

    // Different-type same-pair rule: when an inheritance already exists between
    // these two nodes, the association must use same-side routing (right→right or left→left)
    // to create a clean U-shape instead of wrapping around both nodes.
    const hasDifferentTypeBetweenPair = existingEdges.some(
        e => ((e.source === sourceId && e.target === targetId) ||
              (e.source === targetId && e.target === sourceId)) &&
             (e.type || 'reference') !== (edgeType || 'reference')
    );

    if (hasDifferentTypeBetweenPair) {
        // Count occupancy on right/left for both nodes (excluding self-refs)
        const sideOccupancy: Record<'right' | 'left', number> = { right: 0, left: 0 };
        for (const e of existingEdges) {
            if (e.source === e.target) continue;
            for (const side of ['right', 'left'] as const) {
                if (e.source === sourceId && getBaseSide(e.sourceHandle) === side) sideOccupancy[side]++;
                if (e.target === sourceId && getBaseSide(e.targetHandle) === side) sideOccupancy[side]++;
                if (e.source === targetId && getBaseSide(e.sourceHandle) === side) sideOccupancy[side]++;
                if (e.target === targetId && getBaseSide(e.targetHandle) === side) sideOccupancy[side]++;
            }
        }
        // Pick the side with less occupancy, prefer right on tie
        const bestSide = sideOccupancy.left < sideOccupancy.right ? 'left' : 'right';
        return { sourceHandle: bestSide, targetHandle: bestSide };
    }

    const dx = targetRect.centerX - sourceRect.centerX;
    const dy = targetRect.centerY - sourceRect.centerY;

    // Build occupancy info for source and target nodes
    const sourceSideInfo: Record<Side, { count: number; hasInheritance: boolean }> = {
        top: { count: 0, hasInheritance: false },
        right: { count: 0, hasInheritance: false },
        bottom: { count: 0, hasInheritance: false },
        left: { count: 0, hasInheritance: false },
    };
    const targetSideInfo: Record<Side, { count: number; hasInheritance: boolean }> = {
        top: { count: 0, hasInheritance: false },
        right: { count: 0, hasInheritance: false },
        bottom: { count: 0, hasInheritance: false },
        left: { count: 0, hasInheritance: false },
    };

    for (const e of existingEdges) {
        // Skip self-references — they loop on the same node and don't block sides
        if (e.source === e.target) continue;
        const isInh = e.type === 'inheritance';
        if (e.source === sourceId) {
            const side = getBaseSide(e.sourceHandle);
            sourceSideInfo[side].count++;
            if (isInh) sourceSideInfo[side].hasInheritance = true;
        }
        if (e.target === sourceId) {
            const side = getBaseSide(e.targetHandle);
            sourceSideInfo[side].count++;
            if (isInh) sourceSideInfo[side].hasInheritance = true;
        }
        if (e.source === targetId) {
            const side = getBaseSide(e.sourceHandle);
            targetSideInfo[side].count++;
            if (isInh) targetSideInfo[side].hasInheritance = true;
        }
        if (e.target === targetId) {
            const side = getBaseSide(e.targetHandle);
            targetSideInfo[side].count++;
            if (isInh) targetSideInfo[side].hasInheritance = true;
        }
    }

    // Score each candidate pair — geometric fitness vs occupancy
    const candidates: Array<{ sourceSide: Side; targetSide: Side }> = [
        // Opposing pairs (Z-shape routing)
        { sourceSide: 'right', targetSide: 'left' },
        { sourceSide: 'left', targetSide: 'right' },
        { sourceSide: 'bottom', targetSide: 'top' },
        { sourceSide: 'top', targetSide: 'bottom' },
        // Same-side pairs (U-shape routing — used when opposing axis is occupied)
        { sourceSide: 'right', targetSide: 'right' },
        { sourceSide: 'left', targetSide: 'left' },
    ];

    const dist = Math.sqrt(dx * dx + dy * dy);
    const nx = dist > 0 ? dx / dist : 0;
    const ny = dist > 0 ? dy / dist : 0;

    let bestScore = -Infinity;
    let bestCandidate = candidates[0];

    for (const candidate of candidates) {
        // Geometric score: alignment of side directions with node-to-node vector (0-100)
        const [sx, sy] = SIDE_VECTORS[candidate.sourceSide];
        const srcDot = sx * nx + sy * ny;
        const [tx, ty] = SIDE_VECTORS[candidate.targetSide];
        const tgtDot = -(tx * nx + ty * ny);
        const geoScore = ((srcDot + tgtDot) / 2 + 1) * 50;

        // Occupancy penalty: prefer less crowded sides (30 per edge to overcome geometric gap)
        const srcCount = sourceSideInfo[candidate.sourceSide].count;
        const tgtCount = targetSideInfo[candidate.targetSide].count;
        const occPenalty = (srcCount + tgtCount) * 30;

        // Mixed-type penalty: avoid putting reference on side with inheritance
        const mixedPenalty =
            (sourceSideInfo[candidate.sourceSide].hasInheritance ? 25 : 0) +
            (targetSideInfo[candidate.targetSide].hasInheritance ? 25 : 0);

        // Same-side penalty: U-shape paths are longer, prefer Z-shape when possible
        const sameSidePenalty = candidate.sourceSide === candidate.targetSide ? 5 : 0;

        // Tie-breaking: prefer bottom > right > left > top (source-weighted for Z-shape routing)
        const tieBreak = SIDE_PREFERENCE[candidate.sourceSide] * 0.15 + SIDE_PREFERENCE[candidate.targetSide] * 0.05;

        const totalScore = geoScore - occPenalty - mixedPenalty - sameSidePenalty + tieBreak;

        if (totalScore > bestScore) {
            bestScore = totalScore;
            bestCandidate = candidate;
        }
    }

    return { sourceHandle: bestCandidate.sourceSide, targetHandle: bestCandidate.targetSide };
}

/**
 * Hook that provides a function to compute optimal anchor positions for edges.
 *
 * @returns A function that takes source and target node IDs and returns optimal handles
 */
export function useAutoAnchor() {
    const nodes = useNodes();

    const getOptimalAnchors = useCallback(
        (
            sourceId: string,
            targetId: string,
            edgeType?: 'inheritance' | 'reference',
            existingEdges?: EdgeContext[],
        ): { sourceHandle: string; targetHandle: string } => {
            const sourceNode = nodes.find((n) => n.id === sourceId);
            const targetNode = nodes.find((n) => n.id === targetId);

            if (!sourceNode || !targetNode) {
                return { sourceHandle: 'right', targetHandle: 'left' };
            }

            const sourceRect = getNodeRect(sourceNode);
            const targetRect = getNodeRect(targetNode);

            // Use context-aware scoring when existing edges are provided
            if (existingEdges && existingEdges.length > 0) {
                return computeBestAnchorsWithContext(
                    sourceRect, targetRect, sourceId, targetId, edgeType, existingEdges,
                );
            }

            // Fallback: geometry-only (no context)
            return computeBestAnchors(sourceRect, targetRect, sourceId === targetId, edgeType);
        },
        [nodes]
    );

    /**
     * Computes optimal anchors for all edges at once, with bidirectional deconfliction.
     * Use this when you have multiple edges and want to prevent overlap between
     * bidirectional pairs (A→B and B→A).
     */
    const getOptimalAnchorsForAllEdges = useCallback(
        (
            edges: { id: string; source: string; target: string; type?: string }[]
        ): Map<string, { sourceHandle: string; targetHandle: string }> => {
            // Build node rects map
            const nodeRects = new Map<string, NodeRect>();
            for (const node of nodes) {
                nodeRects.set(node.id, getNodeRect(node));
            }

            // First pass: compute best anchors for each edge individually
            const edgesWithAnchors = edges.map(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);

                if (!sourceNode || !targetNode) {
                    return { ...edge, sourceHandle: 'right', targetHandle: 'left' };
                }

                const sourceRect = getNodeRect(sourceNode);
                const targetRect = getNodeRect(targetNode);
                const isSelfReference = edge.source === edge.target;
                const edgeType = edge.type === 'inheritance' ? 'inheritance' : 'reference';
                const anchors = computeBestAnchors(sourceRect, targetRect, isSelfReference, edgeType);

                return { ...edge, ...anchors };
            });

            // Second pass: apply bidirectional deconfliction
            const deconflicted = deconflictBidirectionalEdges(edgesWithAnchors, nodeRects);

            // Build result map
            const result = new Map<string, { sourceHandle: string; targetHandle: string }>();
            for (const edge of edgesWithAnchors) {
                const adjusted = deconflicted.get(edge.id);
                if (adjusted) {
                    result.set(edge.id, adjusted);
                } else {
                    result.set(edge.id, { sourceHandle: edge.sourceHandle, targetHandle: edge.targetHandle });
                }
            }

            return result;
        },
        [nodes]
    );

    return { getOptimalAnchors, getOptimalAnchorsForAllEdges };
}

export { computeBestAnchors, getNodeRect, computeAnchorsWithHysteresis, getAnchorConfig };
export type { NodeRect, Side, MinimalEdgeWithData, AnchorResult };

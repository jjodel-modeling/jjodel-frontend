import { useCallback } from 'react';
import { useNodes } from '@xyflow/react';

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

interface AnchorPoint {
    x: number;
    y: number;
    side: Side;
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
 * Calculates the anchor points (exit/entry) for each side of a node.
 */
function getAnchorPoints(rect: NodeRect): AnchorPoint[] {
    return [
        { x: rect.centerX, y: rect.y, side: 'top' },
        { x: rect.x + rect.width, y: rect.centerY, side: 'right' },
        { x: rect.centerX, y: rect.y + rect.height, side: 'bottom' },
        { x: rect.x, y: rect.centerY, side: 'left' },
    ];
}

/**
 * Checks if a line segment (approximated by midpoint) passes through a rectangle.
 */
function segmentIntersectsRect(
    p1: { x: number; y: number },
    p2: { x: number; y: number },
    rect: NodeRect
): boolean {
    // Check if the midpoint of the segment is inside the rectangle
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const margin = 5;
    return (
        midX > rect.x - margin &&
        midX < rect.x + rect.width + margin &&
        midY > rect.y - margin &&
        midY < rect.y + rect.height + margin
    );
}

/**
 * Estimates the length of a Manhattan path between two anchor points.
 * Uses heuristics (penalties/bonuses) instead of computing the actual path.
 *
 * @param sourcePoint - The source anchor point
 * @param targetPoint - The target anchor point
 * @param sourceRect - The source node rectangle
 * @param targetRect - The target node rectangle
 * @returns Estimated path length (lower is better)
 */
function estimatePathLength(
    sourcePoint: AnchorPoint,
    targetPoint: AnchorPoint,
    sourceRect: NodeRect,
    targetRect: NodeRect
): number {
    const dx = targetPoint.x - sourcePoint.x;
    const dy = targetPoint.y - sourcePoint.y;

    // Base Manhattan distance
    let length = Math.abs(dx) + Math.abs(dy);

    const PENALTY = 200;

    // Source penalties - penalize exiting in a direction opposite to target
    if (sourcePoint.side === 'right' && dx < 0) length += PENALTY; // exit right but target is left
    if (sourcePoint.side === 'left' && dx > 0) length += PENALTY; // exit left but target is right
    if (sourcePoint.side === 'bottom' && dy < 0) length += PENALTY; // exit bottom but target is above
    if (sourcePoint.side === 'top' && dy > 0) length += PENALTY; // exit top but target is below

    // Target penalties - penalize arriving from wrong direction
    if (targetPoint.side === 'left' && dx < 0) length += PENALTY; // arrive from left but source is left
    if (targetPoint.side === 'right' && dx > 0) length += PENALTY; // arrive from right but source is right
    if (targetPoint.side === 'top' && dy < 0) length += PENALTY; // arrive from top but source is above
    if (targetPoint.side === 'bottom' && dy > 0) length += PENALTY; // arrive from bottom but source is below

    // Penalize if path would pass through either node
    if (segmentIntersectsRect(sourcePoint, targetPoint, sourceRect)) length += PENALTY;
    if (segmentIntersectsRect(sourcePoint, targetPoint, targetRect)) length += PENALTY;

    // Light penalty for same-side combinations (produces U-shaped paths)
    if (sourcePoint.side === targetPoint.side) length += 50;

    // Bonus for opposite sides (produces direct paths)
    if (
        (sourcePoint.side === 'right' && targetPoint.side === 'left') ||
        (sourcePoint.side === 'left' && targetPoint.side === 'right') ||
        (sourcePoint.side === 'top' && targetPoint.side === 'bottom') ||
        (sourcePoint.side === 'bottom' && targetPoint.side === 'top')
    ) {
        length -= 30;
    }

    return length;
}

/**
 * Deconflicts bidirectional edges (A→B and B→A) by assigning them different anchor combinations.
 *
 * When two edges connect the same pair of nodes in opposite directions, they would normally
 * choose the same anchor sides and overlap completely. This function detects such pairs and
 * assigns alternating anchor combinations based on the dominant axis between nodes.
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
        // Find bidirectional pairs (same nodes, opposite directions)
        const bidirectionalPairs: Array<{ forward: typeof edges[0]; reverse: typeof edges[0] }> = [];
        const processed = new Set<string>();

        for (const edge of group) {
            if (processed.has(edge.id)) continue;

            const opposite = group.find(e => e.source === edge.target && e.target === edge.source);
            if (opposite && !processed.has(opposite.id)) {
                bidirectionalPairs.push({ forward: edge, reverse: opposite });
                processed.add(edge.id);
                processed.add(opposite.id);
            }
        }

        // Assign alternating anchors to bidirectional pairs
        for (const pair of bidirectionalPairs) {
            const sourceRect = nodeRects.get(pair.forward.source);
            const targetRect = nodeRects.get(pair.forward.target);

            if (!sourceRect || !targetRect) continue;

            // Determine dominant axis between nodes
            const dx = targetRect.centerX - sourceRect.centerX;
            const dy = targetRect.centerY - sourceRect.centerY;
            const isHorizontalDominant = Math.abs(dx) > Math.abs(dy);

            if (isHorizontalDominant) {
                // Nodes are horizontally separated → use vertical anchors for separation
                // Forward edge: top-to-top, Reverse edge: bottom-to-bottom
                if (dx > 0) {
                    // Target is to the right
                    result.set(pair.forward.id, { sourceHandle: 'top', targetHandle: 'top' });
                    result.set(pair.reverse.id, { sourceHandle: 'bottom', targetHandle: 'bottom' });
                } else {
                    // Target is to the left
                    result.set(pair.forward.id, { sourceHandle: 'bottom', targetHandle: 'bottom' });
                    result.set(pair.reverse.id, { sourceHandle: 'top', targetHandle: 'top' });
                }
            } else {
                // Nodes are vertically separated → use horizontal anchors for separation
                // Forward edge: left-to-left, Reverse edge: right-to-right
                if (dy > 0) {
                    // Target is below
                    result.set(pair.forward.id, { sourceHandle: 'left', targetHandle: 'left' });
                    result.set(pair.reverse.id, { sourceHandle: 'right', targetHandle: 'right' });
                } else {
                    // Target is above
                    result.set(pair.forward.id, { sourceHandle: 'right', targetHandle: 'right' });
                    result.set(pair.reverse.id, { sourceHandle: 'left', targetHandle: 'left' });
                }
            }
        }
    }

    return result;
}

/**
 * Computes the best anchor pair by testing all 16 combinations.
 *
 * @param sourceRect - The source node rectangle
 * @param targetRect - The target node rectangle
 * @param isSelfReference - Whether this is a self-referencing edge
 * @param edgeType - Optional edge type for semantic preferences ('inheritance' | 'reference')
 * @returns The optimal source and target handle IDs
 */
function computeBestAnchors(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    isSelfReference: boolean,
    edgeType?: 'inheritance' | 'reference'
): { sourceHandle: string; targetHandle: string } {
    // Self-reference: use fixed handles for compact loop
    if (isSelfReference) {
        return { sourceHandle: 'right', targetHandle: 'top' };
    }

    const sourceAnchors = getAnchorPoints(sourceRect);
    const targetAnchors = getAnchorPoints(targetRect);

    let bestScore = Infinity;
    let bestSource: Side = 'right';
    let bestTarget: Side = 'left';

    // Inheritance preference bonus - strongly prefer top→bottom for subclass→superclass
    const INHERITANCE_BONUS = 150;

    // Test all 16 combinations
    for (const sa of sourceAnchors) {
        for (const ta of targetAnchors) {
            let score = estimatePathLength(sa, ta, sourceRect, targetRect);

            // For inheritance edges, prefer source=top, target=bottom
            if (edgeType === 'inheritance') {
                if (sa.side === 'top') score -= INHERITANCE_BONUS;
                if (ta.side === 'bottom') score -= INHERITANCE_BONUS;
            }

            if (score < bestScore) {
                bestScore = score;
                bestSource = sa.side;
                bestTarget = ta.side;
            }
        }
    }

    return { sourceHandle: bestSource, targetHandle: bestTarget };
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
            edgeType?: 'inheritance' | 'reference'
        ): { sourceHandle: string; targetHandle: string } => {
            const sourceNode = nodes.find((n) => n.id === sourceId);
            const targetNode = nodes.find((n) => n.id === targetId);

            if (!sourceNode || !targetNode) {
                return { sourceHandle: 'right', targetHandle: 'left' };
            }

            const sourceRect = getNodeRect(sourceNode);
            const targetRect = getNodeRect(targetNode);
            const isSelfReference = sourceId === targetId;

            return computeBestAnchors(sourceRect, targetRect, isSelfReference, edgeType);
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

export { computeBestAnchors, getNodeRect };
export type { NodeRect, Side };

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
 * Computes the best anchor pair by testing all 16 combinations.
 *
 * @param sourceRect - The source node rectangle
 * @param targetRect - The target node rectangle
 * @param isSelfReference - Whether this is a self-referencing edge
 * @returns The optimal source and target handle IDs
 */
function computeBestAnchors(
    sourceRect: NodeRect,
    targetRect: NodeRect,
    isSelfReference: boolean
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

    // Test all 16 combinations
    for (const sa of sourceAnchors) {
        for (const ta of targetAnchors) {
            const score = estimatePathLength(sa, ta, sourceRect, targetRect);
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
        (sourceId: string, targetId: string): { sourceHandle: string; targetHandle: string } => {
            const sourceNode = nodes.find((n) => n.id === sourceId);
            const targetNode = nodes.find((n) => n.id === targetId);

            if (!sourceNode || !targetNode) {
                return { sourceHandle: 'right', targetHandle: 'left' };
            }

            const sourceRect = getNodeRect(sourceNode);
            const targetRect = getNodeRect(targetNode);
            const isSelfReference = sourceId === targetId;

            return computeBestAnchors(sourceRect, targetRect, isSelfReference);
        },
        [nodes]
    );

    return { getOptimalAnchors };
}

export { computeBestAnchors, getNodeRect };
export type { NodeRect, Side };

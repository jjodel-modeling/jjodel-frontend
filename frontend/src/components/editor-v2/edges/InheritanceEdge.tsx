import { useMemo } from 'react';
import { useNodes, type EdgeProps } from '@xyflow/react';

const EDGE_PADDING = 20;

interface Rect {
    x: number;
    y: number;
    width: number;
    height: number;
}

function getNodeRect(node: any): Rect {
    return {
        x: node.position.x,
        y: node.position.y,
        width: node.measured?.width ?? node.width ?? 180,
        height: node.measured?.height ?? node.height ?? 80,
    };
}

function rectsOverlap(
    rect: Rect,
    x1: number,
    y1: number,
    x2: number,
    y2: number
): boolean {
    const padded = {
        x: rect.x - EDGE_PADDING,
        y: rect.y - EDGE_PADDING,
        width: rect.width + EDGE_PADDING * 2,
        height: rect.height + EDGE_PADDING * 2,
    };

    if (Math.abs(y1 - y2) < 1) {
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        return (
            y1 > padded.y &&
            y1 < padded.y + padded.height &&
            maxX > padded.x &&
            minX < padded.x + padded.width
        );
    }

    if (Math.abs(x1 - x2) < 1) {
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return (
            x1 > padded.x &&
            x1 < padded.x + padded.width &&
            maxY > padded.y &&
            minY < padded.y + padded.height
        );
    }

    return false;
}

function computeManhattanPath(
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourceNodeId: string,
    targetNodeId: string,
    allNodes: any[]
): string {
    const dy = Math.abs(targetY - sourceY);

    if (dy < 5) {
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    const obstacles = allNodes
        .filter((n) => n.id !== sourceNodeId && n.id !== targetNodeId)
        .map(getNodeRect);

    const midX = (sourceX + targetX) / 2;
    const standardPath = [
        { x: sourceX, y: sourceY },
        { x: midX, y: sourceY },
        { x: midX, y: targetY },
        { x: targetX, y: targetY },
    ];

    let hasCollision = false;
    for (let i = 0; i < standardPath.length - 1; i++) {
        const p1 = standardPath[i];
        const p2 = standardPath[i + 1];
        for (const obs of obstacles) {
            if (rectsOverlap(obs, p1.x, p1.y, p2.x, p2.y)) {
                hasCollision = true;
                break;
            }
        }
        if (hasCollision) break;
    }

    if (!hasCollision) {
        return `M ${sourceX} ${sourceY} L ${midX} ${sourceY} L ${midX} ${targetY} L ${targetX} ${targetY}`;
    }

    let topY = Infinity;
    let bottomY = -Infinity;
    for (const obs of obstacles) {
        topY = Math.min(topY, obs.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, obs.y + obs.height + EDGE_PADDING);
    }

    const sourceRect = allNodes.find((n) => n.id === sourceNodeId);
    const targetRect = allNodes.find((n) => n.id === targetNodeId);
    if (sourceRect) {
        const sr = getNodeRect(sourceRect);
        topY = Math.min(topY, sr.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, sr.y + sr.height + EDGE_PADDING);
    }
    if (targetRect) {
        const tr = getNodeRect(targetRect);
        topY = Math.min(topY, tr.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, tr.y + tr.height + EDGE_PADDING);
    }

    const useTop =
        Math.abs(sourceY - topY) + Math.abs(targetY - topY) <
        Math.abs(sourceY - bottomY) + Math.abs(targetY - bottomY);
    const detourY = useTop ? topY : bottomY;

    const offsetX1 = sourceX + EDGE_PADDING;
    const offsetX2 = targetX - EDGE_PADDING;

    return `M ${sourceX} ${sourceY} L ${offsetX1} ${sourceY} L ${offsetX1} ${detourY} L ${offsetX2} ${detourY} L ${offsetX2} ${targetY} L ${targetX} ${targetY}`;
}

function InheritanceEdge(props: EdgeProps) {
    const { id, sourceX, sourceY, targetX, targetY, source, target, selected } = props;
    const nodes = useNodes();

    const path = useMemo(
        () => computeManhattanPath(sourceX, sourceY, targetX, targetY, source, target, nodes),
        [sourceX, sourceY, targetX, targetY, source, target, nodes]
    );

    // Marker ID unique per edge
    const markerTriangleId = `inheritance-triangle-${id}`;

    return (
        <>
            <defs>
                {/* Hollow triangle (UML generalization marker) */}
                <marker
                    id={markerTriangleId}
                    viewBox="0 0 14 14"
                    refX="14"
                    refY="7"
                    markerWidth="14"
                    markerHeight="14"
                    orient="auto"
                >
                    <path
                        d="M 0 0 L 14 7 L 0 14 Z"
                        fill="#1e293b"
                        stroke={selected ? '#0ea5e9' : 'rgba(255, 255, 255, 0.5)'}
                        strokeWidth="1.5"
                    />
                </marker>
            </defs>

            <path
                d={path}
                fill="none"
                className={`inheritance-edge ${selected ? 'selected' : ''}`}
                markerEnd={`url(#${markerTriangleId})`}
            />
        </>
    );
}

export default InheritanceEdge;

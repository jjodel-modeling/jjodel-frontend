import React, { useState, useCallback, useMemo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';

// Margin around nodes for routing
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
    // Check if a segment (horizontal or vertical) crosses a rectangle
    const padded = {
        x: rect.x - EDGE_PADDING,
        y: rect.y - EDGE_PADDING,
        width: rect.width + EDGE_PADDING * 2,
        height: rect.height + EDGE_PADDING * 2,
    };

    // Horizontal segment
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

    // Vertical segment
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

    // Simple case: nearly horizontally aligned
    if (dy < 5) {
        return `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`;
    }

    // Nodes to avoid (exclude source and target)
    const obstacles = allNodes
        .filter((n) => n.id !== sourceNodeId && n.id !== targetNodeId)
        .map(getNodeRect);

    // Try standard routing: midX
    const midX = (sourceX + targetX) / 2;
    const standardPath = [
        { x: sourceX, y: sourceY },
        { x: midX, y: sourceY },
        { x: midX, y: targetY },
        { x: targetX, y: targetY },
    ];

    // Check if standard path crosses obstacles
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

    // Alternative routing: go above or below obstacles
    // Find free space above/below all obstacles
    let topY = Infinity;
    let bottomY = -Infinity;
    for (const obs of obstacles) {
        topY = Math.min(topY, obs.y - EDGE_PADDING);
        bottomY = Math.max(bottomY, obs.y + obs.height + EDGE_PADDING);
    }

    // Also consider source and target positions
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

    // Choose above or below based on minimum distance
    const useTop =
        Math.abs(sourceY - topY) + Math.abs(targetY - topY) <
        Math.abs(sourceY - bottomY) + Math.abs(targetY - bottomY);
    const detourY = useTop ? topY : bottomY;

    // Path with detour: source → right → detour_y → left → target
    const offsetX1 = sourceX + EDGE_PADDING;
    const offsetX2 = targetX - EDGE_PADDING;

    return `M ${sourceX} ${sourceY} L ${offsetX1} ${sourceY} L ${offsetX1} ${detourY} L ${offsetX2} ${detourY} L ${offsetX2} ${targetY} L ${targetX} ${targetY}`;
}

/**
 * Manhattan-style edge routing with obstacle avoidance:
 * - If source and target are nearly horizontal (|dy| < 5), draw a straight line
 * - Otherwise, draw a Manhattan path with right angles
 * - Attempts to route around intermediate nodes
 * - Double-click label to edit inline
 */
function ManhattanEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        label,
        selected,
        markerEnd,
        markerStart,
        style,
    } = props;

    const { setEdges } = useReactFlow();
    const nodes = useNodes();
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || ''));

    const path = useMemo(
        () =>
            computeManhattanPath(
                sourceX,
                sourceY,
                targetX,
                targetY,
                source,
                target,
                nodes
            ),
        [sourceX, sourceY, targetX, targetY, source, target, nodes]
    );

    // Calculate label position (center of the edge)
    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

    const onLabelDoubleClick = useCallback((e: React.MouseEvent) => {
        e.stopPropagation();
        setEditing(true);
    }, []);

    const commitLabel = useCallback(() => {
        setEditing(false);
        setEdges((edges) =>
            edges.map((e) => (e.id === id ? { ...e, label: labelText } : e))
        );
    }, [id, labelText, setEdges]);

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitLabel();
            } else if (e.key === 'Escape') {
                setLabelText(String(label || ''));
                setEditing(false);
            }
        },
        [commitLabel, label]
    );

    return (
        <>
            <BaseEdge
                id={id}
                path={path}
                markerEnd={markerEnd}
                markerStart={markerStart}
                style={style}
            />
            <EdgeLabelRenderer>
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
                        pointerEvents: 'all',
                    }}
                    onDoubleClick={onLabelDoubleClick}
                >
                    {editing ? (
                        <input
                            autoFocus
                            className="edge-label__input"
                            value={labelText}
                            onChange={(e) => setLabelText(e.target.value)}
                            onBlur={commitLabel}
                            onKeyDown={onKeyDown}
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        labelText && (
                            <span className="edge-label__text">{labelText}</span>
                        )
                    )}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default ManhattanEdge;

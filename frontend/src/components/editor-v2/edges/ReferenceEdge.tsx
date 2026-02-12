import { useState, useCallback, useMemo } from 'react';
import {
    BaseEdge,
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';

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

function ReferenceEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        data,
        selected,
        label,
    } = props;

    const edgeData = data as ReferenceEdgeData | undefined;
    const { setEdges } = useReactFlow();
    const nodes = useNodes();
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || edgeData?.reference?.name || ''));

    const ref = edgeData?.reference;
    const kind: ReferenceKind = ref?.kind || 'association';

    const path = useMemo(
        () => computeManhattanPath(sourceX, sourceY, targetX, targetY, source, target, nodes),
        [sourceX, sourceY, targetX, targetY, source, target, nodes]
    );

    const labelX = (sourceX + targetX) / 2;
    const labelY = (sourceY + targetY) / 2;

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

    const cardinality = ref ? formatCardinality(ref.lowerBound, ref.upperBound) : '';

    // Marker IDs unique per edge
    const markerFilledId = `diamond-filled-${id}`;
    const markerEmptyId = `diamond-empty-${id}`;
    const markerArrowId = `arrow-${id}`;

    return (
        <>
            <defs>
                {/* Diamante pieno - Composition */}
                <marker
                    id={markerFilledId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="12"
                    markerHeight="8"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" fill="rgba(255,255,255,0.8)" stroke="none" />
                </marker>

                {/* Diamante vuoto - Aggregation */}
                <marker
                    id={markerEmptyId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="12"
                    markerHeight="8"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                </marker>

                {/* Freccia - target */}
                <marker
                    id={markerArrowId}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" />
                </marker>
            </defs>

            <path
                d={path}
                fill="none"
                className={`reference-edge ${kind} ${selected ? 'selected' : ''}`}
                markerStart={
                    kind === 'composition' ? `url(#${markerFilledId})` :
                    kind === 'aggregation' ? `url(#${markerEmptyId})` :
                    undefined
                }
                markerEnd={`url(#${markerArrowId})`}
            />

            <EdgeLabelRenderer>
                {/* Label */}
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 12}px)`,
                        pointerEvents: 'all',
                    }}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
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
                        labelText && <span className="edge-label__text">{labelText}</span>
                    )}
                </div>

                {/* Cardinality badge */}
                {cardinality && (
                    <div
                        className="edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${targetX - 30}px, ${targetY - 14}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}

                {/* Kind badge */}
                <div
                    className={`edge-kind-badge ${kind}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY + 10}px)`,
                        pointerEvents: 'none',
                    }}
                >
                    {kind === 'composition' ? '◆' : kind === 'aggregation' ? '◇' : '→'}
                </div>
            </EdgeLabelRenderer>
        </>
    );
}

export default ReferenceEdge;

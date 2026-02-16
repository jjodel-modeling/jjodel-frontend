import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import {
    computeManhattanPath,
    computeAStarPath,
    OBSTACLE_AVOIDANCE_ENABLED,
    roundManhattanPath,
    computeSelfLoopPath,
    computeLabelPosition,
    computeCardinalityPosition,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
} from '../utils/edgeUtils';
import { useObstacleGrid } from '../contexts/ObstacleGridContext';
import { useEditorContextSafe } from '../contexts/EditorContext';

function ReferenceEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        sourceHandleId,
        targetHandleId,
        data,
        selected,
        label,
    } = props;

    const edgeData = data as ReferenceEdgeData | undefined;
    const { setEdges } = useReactFlow();
    const notation = useEditorContextSafe()?.notation ?? 'uml';
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || edgeData?.reference?.name || ''));

    // Sync label text when props change (e.g., from properties panel)
    useEffect(() => {
        if (!editing) {
            setLabelText(String(label || edgeData?.reference?.name || ''));
        }
    }, [label, edgeData?.reference?.name, editing]);

    const ref = edgeData?.reference;
    const kind: ReferenceKind = ref?.kind || 'association';
    const waypoints = edgeData?.waypoints || [];

    const isSelfLoop = source === target;

    // Phase 7: obstacle grid context
    const { grid, version } = useObstacleGrid();
    const allNodes = useNodes();

    // Get sides from handle IDs
    const sourceSide = getSideFromHandle(sourceHandleId);
    const targetSide = getSideFromHandle(targetHandleId);

    // Compute base path — A* when enabled, classic otherwise
    const rawPath = useMemo(
        () => {
            if (OBSTACLE_AVOIDANCE_ENABLED && grid) {
                return computeAStarPath(
                    grid, sourceX, sourceY, sourceSide,
                    targetX, targetY, targetSide,
                    source, target, allNodes as any,
                );
            }
            return computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide, grid, version, source, target]
    );

    // Pipeline: parse → apply waypoints → round corners
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    // Final path with rounding
    const path = useMemo(() => {
        if (isSelfLoop) {
            return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        return roundManhattanPath(adjustedPath, 4);
    }, [adjustedPath, isSelfLoop, sourceX, sourceY, targetX, targetY]);

    // Position label on the longest segment of the path
    const labelPos = useMemo(() => computeLabelPosition(adjustedPath), [adjustedPath]);

    // Calculate label offset based on segment orientation (perpendicular to segment)
    // For parallel edges, alternate offset direction based on handle index so labels don't overlap
    const labelOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: -16 };

        const points = parsePathPoints(adjustedPath);
        let longestLen = 0;
        let longestIsHorizontal = true;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const len = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
            if (len > longestLen) {
                longestLen = len;
                longestIsHorizontal = Math.abs(p2.y - p1.y) < 1;
            }
        }

        // Use handle index to alternate offset direction for parallel edges
        const handleIndex = sourceHandleId ? parseInt(sourceHandleId.split('-')[1] || '0', 10) : 0;
        const sign = handleIndex % 2 === 0 ? -1 : 1;

        // Offset perpendicular to the segment (16px clearance = label height + gap)
        return longestIsHorizontal
            ? { x: 0, y: sign * 16 }   // even: above, odd: below
            : { x: sign * 16, y: 0 };  // even: left, odd: right
    }, [adjustedPath, isSelfLoop, sourceHandleId]);

    // Position cardinality near the target, with perpendicular offset
    // Uses same handle-index alternation as label offset for consistency
    const cardinalityPos = useMemo(() => computeCardinalityPosition(adjustedPath), [adjustedPath]);
    const cardinalityOffset = useMemo(() => {
        const points = parsePathPoints(adjustedPath);
        if (points.length < 2) return { x: 0, y: -16 };
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const isLastHorizontal = Math.abs(last.y - prev.y) < Math.abs(last.x - prev.x);

        const handleIndex = targetHandleId ? parseInt(targetHandleId.split('-')[1] || '0', 10) : 0;
        const sign = handleIndex % 2 === 0 ? -1 : 1;

        return isLastHorizontal
            ? { x: 0, y: sign * 16 }   // even: above, odd: below
            : { x: sign * 16, y: 0 };  // even: left, odd: right
    }, [adjustedPath, targetHandleId]);

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

    const showDiamonds = notation === 'uml';
    const showCardinality = notation === 'uml' || notation === 'wireframe';
    const cardinality = ref ? formatCardinality(ref.lowerBound, ref.upperBound) : '';

    // Marker IDs unique per edge
    const markerFilledId = `diamond-filled-${id}`;
    const markerEmptyId = `diamond-empty-${id}`;
    const markerArrowId = `arrow-${id}`;

    return (
        <>
            <defs>
                {/* Diamante pieno - Composition (source side) */}
                <marker
                    id={markerFilledId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="12"
                    markerHeight="8"
                    orient="auto"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker filled" />
                </marker>

                {/* Diamante vuoto - Aggregation (source side) */}
                <marker
                    id={markerEmptyId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="12"
                    markerHeight="8"
                    orient="auto"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker hollow" />
                </marker>

                {/* Freccia - target (1.3x size) */}
                <marker
                    id={markerArrowId}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="8"
                    markerHeight="8"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10" className="reference-marker arrow" />
                </marker>
            </defs>

            {/* Invisible hit-test path for easier selection */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke' }}
            />
            <path
                d={path}
                fill="none"
                className={`reference-edge ${kind} ${selected ? 'selected' : ''}`}
                markerStart={
                    showDiamonds && kind === 'composition' ? `url(#${markerFilledId})` :
                    showDiamonds && kind === 'aggregation' ? `url(#${markerEmptyId})` :
                    undefined
                }
                markerEnd={`url(#${markerArrowId})`}
            />

            <EdgeLabelRenderer>
                {/* Label - positioned on longest segment with smart offset */}
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
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

                {/* Cardinality badge - positioned near target, perpendicular to last segment */}
                {showCardinality && cardinality && (
                    <div
                        className="edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${cardinalityPos.x + cardinalityOffset.x}px, ${cardinalityPos.y + cardinalityOffset.y}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}

            </EdgeLabelRenderer>
        </>
    );
}

export default ReferenceEdge;

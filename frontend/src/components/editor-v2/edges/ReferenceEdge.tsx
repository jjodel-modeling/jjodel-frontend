import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import {
    computeManhattanPath,
    roundManhattanPath,
    computeSelfLoopPath,
    computeLabelPosition,
    computeCardinalityPosition,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getPathSegments,
    getSideFromHandle,
} from '../utils/edgeUtils';

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
    const { setEdges, getViewport } = useReactFlow();
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || edgeData?.reference?.name || ''));
    const dragRef = useRef<{ segmentIndex: number; startPos: number; startOffset: number; isHorizontal: boolean } | null>(null);

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

    // Get sides from handle IDs
    const sourceSide = getSideFromHandle(sourceHandleId);
    const targetSide = getSideFromHandle(targetHandleId);

    // Compute base path (now side-aware, no nodes dependency!)
    const rawPath = useMemo(
        () => computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide]
    );

    // Parse points and apply waypoints
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

    // Segments for waypoint handles (based on adjusted points)
    const segments = useMemo(() => getPathSegments(adjustedPath), [adjustedPath]);

    // Position label on the longest segment of the path
    const labelPos = useMemo(() => computeLabelPosition(adjustedPath), [adjustedPath]);

    // Calculate label offset based on segment orientation (perpendicular to segment)
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

        // Offset perpendicular to the segment
        return longestIsHorizontal
            ? { x: 0, y: -14 }   // label above horizontal segment
            : { x: -14, y: 0 };  // label to the left of vertical segment
    }, [adjustedPath, isSelfLoop]);

    // Position cardinality near the target
    const cardinalityPos = useMemo(() => computeCardinalityPosition(adjustedPath), [adjustedPath]);

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

    // Waypoint drag handlers
    const handleWaypointDragStart = useCallback(
        (e: React.MouseEvent, segmentIndex: number, isHorizontal: boolean) => {
            e.stopPropagation();
            e.preventDefault();

            const startPos = isHorizontal ? e.clientY : e.clientX;
            const existing = waypoints.find((w) => w.segmentIndex === segmentIndex);
            const startOffset = existing?.offset || 0;

            dragRef.current = { segmentIndex, startPos, startOffset, isHorizontal };

            const onMouseMove = (moveEvent: MouseEvent) => {
                if (!dragRef.current) return;

                const currentPos = dragRef.current.isHorizontal
                    ? moveEvent.clientY
                    : moveEvent.clientX;

                const viewport = getViewport();
                const zoom = viewport.zoom || 1;
                const delta = (currentPos - dragRef.current.startPos) / zoom;
                const newOffset = dragRef.current.startOffset + delta;

                // Update waypoints
                setEdges((eds) =>
                    eds.map((ed) => {
                        if (ed.id !== id) return ed;
                        const edData = ed.data as ReferenceEdgeData;
                        const currentWaypoints = edData?.waypoints || [];
                        const updatedWaypoints = currentWaypoints
                            .filter((w) => w.segmentIndex !== dragRef.current!.segmentIndex)
                            .concat({ segmentIndex: dragRef.current!.segmentIndex, offset: newOffset });

                        return {
                            ...ed,
                            data: { ...edData, waypoints: updatedWaypoints },
                        };
                    })
                );
            };

            const onMouseUp = () => {
                dragRef.current = null;
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };

            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        },
        [id, waypoints, setEdges, getViewport]
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
                    markerWidth="8"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker filled" />
                </marker>

                {/* Diamante vuoto - Aggregation */}
                <marker
                    id={markerEmptyId}
                    viewBox="0 0 12 8"
                    refX="0"
                    refY="4"
                    markerWidth="8"
                    markerHeight="6"
                    orient="auto-start-reverse"
                >
                    <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker hollow" />
                </marker>

                {/* Freccia - target */}
                <marker
                    id={markerArrowId}
                    viewBox="0 0 10 10"
                    refX="10"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto"
                >
                    <path d="M 0 0 L 10 5 L 0 10" className="reference-marker arrow" />
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

                {/* Cardinality badge - positioned near target */}
                {cardinality && (
                    <div
                        className="edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${cardinalityPos.x}px, ${cardinalityPos.y - 16}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}

                {/* Waypoint handles - shown when selected */}
                {selected && !isSelfLoop && segments.map((seg) => (
                    <div
                        key={seg.index}
                        className="edge-waypoint"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${seg.midX}px, ${seg.midY}px)`,
                            cursor: seg.isHorizontal ? 'ns-resize' : 'ew-resize',
                            pointerEvents: 'all',
                        }}
                        onMouseDown={(e) => handleWaypointDragStart(e, seg.index, seg.isHorizontal)}
                    />
                ))}
            </EdgeLabelRenderer>
        </>
    );
}

export default ReferenceEdge;

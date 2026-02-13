import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, ReferenceKind, EdgeWaypoint } from '../types';
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
        data,
        selected,
        label,
    } = props;

    const edgeData = data as ReferenceEdgeData | undefined;
    const { setEdges, getViewport } = useReactFlow();
    const nodes = useNodes();
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

    // Compute base path
    const rawPath = useMemo(
        () => computeManhattanPath(sourceX, sourceY, targetX, targetY, source, target, nodes),
        [sourceX, sourceY, targetX, targetY, source, target, nodes]
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
                {/* Label - positioned on longest segment */}
                <div
                    className={`edge-label ${selected ? 'selected' : ''}`}
                    style={{
                        position: 'absolute',
                        transform: `translate(-50%, -50%) translate(${labelPos.x}px, ${labelPos.y - 16}px)`,
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

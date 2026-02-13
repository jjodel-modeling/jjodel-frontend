import { useMemo, useCallback, useRef } from 'react';
import { useNodes, useReactFlow, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { InheritanceEdgeData } from '../types';
import {
    computeManhattanPath,
    roundManhattanPath,
    computeSelfLoopPath,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getPathSegments,
} from '../utils/edgeUtils';

function InheritanceEdge(props: EdgeProps) {
    const { id, sourceX, sourceY, targetX, targetY, source, target, selected, data } = props;
    const nodes = useNodes();
    const { setEdges, getViewport } = useReactFlow();
    const dragRef = useRef<{ segmentIndex: number; startPos: number; startOffset: number; isHorizontal: boolean } | null>(null);

    const edgeData = data as InheritanceEdgeData | undefined;
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

    // Segments for waypoint handles
    const segments = useMemo(() => getPathSegments(adjustedPath), [adjustedPath]);

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
                        const edData = ed.data as InheritanceEdgeData;
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

    // Marker ID unique per edge
    const markerTriangleId = `inheritance-triangle-${id}`;

    return (
        <>
            <defs>
                {/* Hollow triangle (UML generalization marker) - base at target, tip pointing back */}
                <marker
                    id={markerTriangleId}
                    viewBox="0 0 14 14"
                    refX="14"
                    refY="7"
                    markerWidth="12"
                    markerHeight="12"
                    orient="auto"
                >
                    <path
                        d="M 14 0 L 0 7 L 14 14 Z"
                        className={`inheritance-marker ${selected ? 'selected' : ''}`}
                    />
                </marker>
            </defs>

            <path
                d={path}
                fill="none"
                className={`inheritance-edge ${selected ? 'selected' : ''}`}
                markerEnd={`url(#${markerTriangleId})`}
            />

            {/* Waypoint handles - shown when selected */}
            {selected && !isSelfLoop && (
                <EdgeLabelRenderer>
                    {segments.map((seg) => (
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
            )}
        </>
    );
}

export default InheritanceEdge;

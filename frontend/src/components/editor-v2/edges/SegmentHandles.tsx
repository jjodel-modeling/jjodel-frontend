import { useCallback, useRef, useMemo } from 'react';
import { EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { getPathSegments, type SegmentInfo, type EdgeWaypoint } from '../utils/edgeUtils';

interface SegmentHandlesProps {
    edgeId: string;
    /** Path after waypoints applied, before rounding (used to compute segment positions) */
    adjustedPath: string;
    waypoints: EdgeWaypoint[];
    selected: boolean;
}

/**
 * Renders draggable handles on internal segments of Manhattan-routed edges.
 *
 * Rules:
 * - 1 segment (straight line): no handles
 * - 2 segments: no handles (both adjacent to anchors)
 * - 3+ segments: handles on internal segments only (not first/last)
 *
 * Drag is constrained:
 * - Horizontal segment -> vertical drag only (Y axis)
 * - Vertical segment -> horizontal drag only (X axis)
 */
export function SegmentHandles({ edgeId, adjustedPath, waypoints, selected }: SegmentHandlesProps) {
    const segments = useMemo(() => getPathSegments(adjustedPath), [adjustedPath]);

    // Only internal segments of edges with 3+ segments
    const internalSegments = useMemo(() => {
        if (segments.length < 3) return [];
        return segments.slice(1, -1);
    }, [segments]);

    if (!selected || internalSegments.length === 0) return null;

    return (
        <EdgeLabelRenderer>
            {internalSegments.map((seg) => (
                <DraggableHandle
                    key={seg.index}
                    edgeId={edgeId}
                    segment={seg}
                    waypoints={waypoints}
                />
            ))}
        </EdgeLabelRenderer>
    );
}

function DraggableHandle({ edgeId, segment, waypoints }: {
    edgeId: string;
    segment: SegmentInfo;
    waypoints: EdgeWaypoint[];
}) {
    const { setEdges, screenToFlowPosition } = useReactFlow();
    const handleRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        startFlowPos: { x: number; y: number };
        initialOffset: number;
    } | null>(null);

    const existingWaypoint = waypoints.find(wp => wp.segmentIndex === segment.index);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const flowPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
        dragState.current = {
            startFlowPos: flowPos,
            initialOffset: existingWaypoint?.offset ?? 0,
        };

        const el = handleRef.current;
        if (el) el.classList.add('dragging');

        const onMouseMove = (me: MouseEvent) => {
            if (!dragState.current || !handleRef.current) return;
            const fp = screenToFlowPosition({ x: me.clientX, y: me.clientY });
            const dx = fp.x - dragState.current.startFlowPos.x;
            const dy = fp.y - dragState.current.startFlowPos.y;

            // Constrain: horizontal segment -> vertical drag, vertical -> horizontal
            if (segment.isHorizontal) {
                handleRef.current.style.transform =
                    `translate(-50%, -50%) translate(${segment.midX}px, ${segment.midY + dy}px)`;
            } else {
                handleRef.current.style.transform =
                    `translate(-50%, -50%) translate(${segment.midX + dx}px, ${segment.midY}px)`;
            }
        };

        const onMouseUp = (me: MouseEvent) => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (!dragState.current) return;
            const fp = screenToFlowPosition({ x: me.clientX, y: me.clientY });
            const dx = fp.x - dragState.current.startFlowPos.x;
            const dy = fp.y - dragState.current.startFlowPos.y;
            const delta = segment.isHorizontal ? dy : dx;
            const newOffset = dragState.current.initialOffset + delta;

            dragState.current = null;
            if (el) el.classList.remove('dragging');

            // Persist waypoint to edge data
            setEdges((edges) => edges.map((e) => {
                if (e.id !== edgeId) return e;
                const currentWaypoints: EdgeWaypoint[] = (e.data as any)?.waypoints || [];
                const idx = currentWaypoints.findIndex(wp => wp.segmentIndex === segment.index);
                let newWaypoints: EdgeWaypoint[];

                if (idx >= 0) {
                    newWaypoints = currentWaypoints.map((wp, i) =>
                        i === idx ? { ...wp, offset: newOffset } : wp
                    );
                } else {
                    newWaypoints = [...currentWaypoints, { segmentIndex: segment.index, offset: newOffset }];
                }

                // Remove near-zero offsets (user dragged back to original position)
                newWaypoints = newWaypoints.filter(wp => Math.abs(wp.offset) > 1);

                return { ...e, data: { ...e.data, waypoints: newWaypoints } };
            }));
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [edgeId, segment, existingWaypoint, screenToFlowPosition, setEdges]);

    return (
        <div
            ref={handleRef}
            className={`segment-handle ${segment.isHorizontal ? 'horizontal' : 'vertical'}`}
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${segment.midX}px, ${segment.midY}px)`,
                cursor: segment.isHorizontal ? 'ns-resize' : 'ew-resize',
                pointerEvents: 'all',
            }}
            onMouseDown={handleMouseDown}
        />
    );
}

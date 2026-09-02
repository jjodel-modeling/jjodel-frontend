import { useCallback, useRef, useMemo } from 'react';
import { EdgeLabelRenderer, useReactFlow } from '@xyflow/react';
import { getPathSegments, type SegmentInfo, type EdgeWaypoint } from '../utils/edgeUtils';
import { useEditorContextSafe } from '../contexts/EditorContext';

interface SegmentHandlesProps {
    edgeId: string;
    /** Polilinea a cui gli **indici** dei waypoint si riferiscono: quella che il
     *  router ha prodotto, prima che i waypoint la trasformino. */
    basePath: string;
    /** Polilinea **disegnata**, dopo i waypoint: e' li' che le maniglie si posano. */
    drawnPath: string;
    /** Il segmento `i` di `basePath` e' il segmento `segmentMap[i]` di `drawnPath`. */
    segmentMap: number[];
    waypoints: EdgeWaypoint[];
    selected: boolean;
}

/**
 * Renders draggable handles on the segments of a Manhattan-routed edge.
 *
 * Una maniglia per **ogni** segmento, terminali compresi: trascinare un terminale
 * non sposta l'ancora ma spezza il tracciato con una gomitata (decisione B del
 * 2026-08-27), cosi' anche un arco a una sola svolta si puo' correggere a mano.
 *
 * Le maniglie si contano sulla polilinea del router — quella a cui gli indici dei
 * waypoint si riferiscono — e si **disegnano** su quella resa. Prima si contavano e
 * si disegnavano entrambe su `adjustedPath`, che e' la polilinea **prima**
 * dell'evitamento degli ostacoli: su un arco ri-instradato quella ha meno segmenti di
 * quella a schermo, e sotto i tre non compariva nessuna maniglia. Misurato il
 * 2026-08-27 sul canvas: archi con sei e sette segmenti resi, zero maniglie
 * (`discovery_2026-08-27_2_dense_diagram_routing.md` §5).
 *
 * Drag is constrained:
 * - Horizontal segment -> vertical drag only (Y axis)
 * - Vertical segment -> horizontal drag only (X axis)
 */
export function SegmentHandles({ edgeId, basePath, drawnPath, segmentMap, waypoints, selected }: SegmentHandlesProps) {
    const baseSegments = useMemo(() => getPathSegments(basePath), [basePath]);
    const drawnSegments = useMemo(() => getPathSegments(drawnPath), [drawnPath]);

    // Una maniglia per segmento del router, posata sul segmento corrispondente del
    // tracciato reso. Un segmento senza corrispondenza (mappa corta o degenere) non
    // produce maniglia invece di produrne una fuori posto.
    const handles = useMemo(() => {
        const out: Array<{ key: number; base: SegmentInfo; drawn: SegmentInfo }> = [];
        for (const base of baseSegments) {
            const at = segmentMap[base.index] ?? base.index;
            const drawn = drawnSegments[at];
            if (!drawn) continue;
            out.push({ key: base.index, base, drawn });
        }
        return out;
    }, [baseSegments, drawnSegments, segmentMap]);

    if (!selected || handles.length === 0) return null;

    return (
        <EdgeLabelRenderer>
            {handles.map(({ key, base, drawn }) => (
                <DraggableHandle
                    key={key}
                    edgeId={edgeId}
                    segment={{ ...drawn, index: base.index }}
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
    const { setEdges, getEdges, screenToFlowPosition } = useReactFlow();
    const editorCtx = useEditorContextSafe();
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

            // Compute new waypoints
            const currentEdge = getEdges().find(e => e.id === edgeId);
            const currentWaypoints: EdgeWaypoint[] = (currentEdge?.data as any)?.waypoints || [];
            const wpIdx = currentWaypoints.findIndex(wp => wp.segmentIndex === segment.index);
            let newWaypoints: EdgeWaypoint[];

            if (wpIdx >= 0) {
                newWaypoints = currentWaypoints.map((wp, i) =>
                    i === wpIdx ? { ...wp, offset: newOffset } : wp
                );
            } else {
                newWaypoints = [...currentWaypoints, { segmentIndex: segment.index, offset: newOffset }];
            }

            // Remove near-zero offsets (user dragged back to original position)
            newWaypoints = newWaypoints.filter(wp => Math.abs(wp.offset) > 1);

            // Persist via EditorContext (triggers snapshot + applyDistribution)
            if (editorCtx?.onEdgeDataChange) {
                editorCtx.onEdgeDataChange(edgeId, {
                    data: { ...currentEdge?.data, waypoints: newWaypoints },
                });
                // Note: recalculateAnchors is NOT called here. Segment drag only changes
                // internal waypoints, not the connection side/anchor. Calling recalculateAnchors
                // would unnecessarily recalculate anchors and clear waypoints.
            } else {
                // Fallback: direct setEdges (no snapshot, no distribution)
                setEdges((edges) => edges.map((e) => {
                    if (e.id !== edgeId) return e;
                    return { ...e, data: { ...e.data, waypoints: newWaypoints } };
                }));
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [edgeId, segment, existingWaypoint, screenToFlowPosition, setEdges, getEdges, editorCtx]);

    return (
        <div
            ref={handleRef}
            className={`segment-handle ${segment.isHorizontal ? 'horizontal' : 'vertical'}`}
            style={{
                position: 'absolute',
                transform: `translate(-50%, -50%) translate(${segment.midX}px, ${segment.midY}px)`,
                cursor: segment.isHorizontal ? 'ns-resize' : 'ew-resize',
                pointerEvents: 'all',
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#0ea5e9',
                border: '2px solid #ffffff',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                transition: 'background-color 0.15s',
            }}
            onMouseDown={handleMouseDown}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#06b6d4')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0ea5e9')}
        />
    );
}

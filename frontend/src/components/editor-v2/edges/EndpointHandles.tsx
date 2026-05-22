import { useCallback, useRef } from 'react';
import { EdgeLabelRenderer, useReactFlow, useNodes } from '@xyflow/react';
import { projectToPerimeter, getNodeRect, type Side } from '../utils/edgeUtils';
import type { AnchorConfig, AnchorSide } from '../types';
import { useEditorContextSafe } from '../contexts/EditorContext';

interface EndpointHandlesProps {
    edgeId: string;
    sourceX: number;
    sourceY: number;
    targetX: number;
    targetY: number;
    sourceNodeId: string;
    targetNodeId: string;
    selected: boolean;
    /** Hide the source endpoint (e.g., secondary tree edges where trunk handles the parent side) */
    hideSource?: boolean;
    /** Hide the target endpoint (e.g., secondary tree edges where primary renders the trunk) */
    hideTarget?: boolean;
}

/**
 * Renders draggable endpoint handles at source and target connection points.
 *
 * When dragged, the handle follows the closest point on the node's rectangular
 * perimeter. On release, the anchor is pinned to the closest side.
 */
export function EndpointHandles({
    edgeId, sourceX, sourceY, targetX, targetY,
    sourceNodeId, targetNodeId, selected,
    hideSource, hideTarget,
}: EndpointHandlesProps) {
    if (!selected) return null;

    return (
        <EdgeLabelRenderer>
            {!hideSource && (
                <DraggableEndpoint
                    edgeId={edgeId}
                    endpoint="source"
                    x={sourceX}
                    y={sourceY}
                    nodeId={sourceNodeId}
                />
            )}
            {!hideTarget && (
                <DraggableEndpoint
                    edgeId={edgeId}
                    endpoint="target"
                    x={targetX}
                    y={targetY}
                    nodeId={targetNodeId}
                />
            )}
        </EdgeLabelRenderer>
    );
}

function DraggableEndpoint({ edgeId, endpoint, x, y, nodeId }: {
    edgeId: string;
    endpoint: 'source' | 'target';
    x: number;
    y: number;
    nodeId: string;
}) {
    const { getEdges, screenToFlowPosition } = useReactFlow();
    const allNodes = useNodes();
    const editorCtx = useEditorContextSafe();

    const handleRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        nodeRect: { x: number; y: number; width: number; height: number };
        currentSide: Side;
    } | null>(null);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Look up the node and compute its rect once at drag start
        const node = allNodes.find(n => n.id === nodeId);
        if (!node) return;
        const rect = getNodeRect(node);

        dragState.current = { nodeRect: rect, currentSide: 'right' };

        const el = handleRef.current;
        const indicator = indicatorRef.current;
        if (el) el.classList.add('dragging');

        const onMouseMove = (me: MouseEvent) => {
            if (!dragState.current || !handleRef.current) return;
            const fp = screenToFlowPosition({ x: me.clientX, y: me.clientY });
            const projected = projectToPerimeter(fp.x, fp.y, dragState.current.nodeRect);

            // Move handle to closest point on node perimeter
            handleRef.current.style.transform =
                `translate(-50%, -50%) translate(${projected.x}px, ${projected.y}px)`;

            dragState.current.currentSide = projected.side;

            // Update side indicator position
            if (indicator) {
                const r = dragState.current.nodeRect;
                indicator.style.display = 'block';
                indicator.className = `endpoint-side-indicator side-${projected.side}`;
                switch (projected.side) {
                    case 'top':
                        indicator.style.transform = `translate(0, 0) translate(${r.x}px, ${r.y - 1.5}px)`;
                        indicator.style.width = `${r.width}px`;
                        indicator.style.height = '3px';
                        break;
                    case 'bottom':
                        indicator.style.transform = `translate(0, 0) translate(${r.x}px, ${r.y + r.height - 1.5}px)`;
                        indicator.style.width = `${r.width}px`;
                        indicator.style.height = '3px';
                        break;
                    case 'left':
                        indicator.style.transform = `translate(0, 0) translate(${r.x - 1.5}px, ${r.y}px)`;
                        indicator.style.width = '3px';
                        indicator.style.height = `${r.height}px`;
                        break;
                    case 'right':
                        indicator.style.transform = `translate(0, 0) translate(${r.x + r.width - 1.5}px, ${r.y}px)`;
                        indicator.style.width = '3px';
                        indicator.style.height = `${r.height}px`;
                        break;
                }
            }
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);

            if (!dragState.current) return;
            const finalSide = dragState.current.currentSide as AnchorSide;
            dragState.current = null;

            if (el) el.classList.remove('dragging');
            if (indicator) indicator.style.display = 'none';

            // Persist via EditorContext (triggers applyDistribution + snapshot)
            if (editorCtx?.onEdgeDataChange) {
                const currentEdge = getEdges().find(e => e.id === edgeId);
                const currentData = currentEdge?.data || {};
                const anchorKey = endpoint === 'source' ? 'sourceAnchor' : 'targetAnchor';
                const handleKey = endpoint === 'source' ? 'sourceHandle' : 'targetHandle';

                editorCtx.onEdgeDataChange(edgeId, {
                    [handleKey]: finalSide,
                    data: {
                        ...currentData,
                        [anchorKey]: { mode: 'pinned', side: finalSide } as AnchorConfig,
                    },
                });
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, [edgeId, endpoint, nodeId, allNodes, screenToFlowPosition, getEdges, editorCtx]);

    return (
        <>
            <div
                ref={handleRef}
                className="endpoint-handle"
                style={{
                    position: 'absolute',
                    transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                    pointerEvents: 'all',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: '#0ea5e9',
                    border: '2px solid #ffffff',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                    cursor: 'grab',
                    transition: 'background-color 0.15s, box-shadow 0.15s',
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#06b6d4';
                    e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#0ea5e9';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.2)';
                }}
            />
            {/* Side indicator — hidden by default, shown during drag */}
            <div
                ref={indicatorRef}
                className="endpoint-side-indicator"
                style={{
                    position: 'absolute',
                    display: 'none',
                    pointerEvents: 'none',
                    backgroundColor: 'rgba(6, 182, 212, 0.3)',
                    border: '2px solid #06b6d4',
                }}
            />
        </>
    );
}

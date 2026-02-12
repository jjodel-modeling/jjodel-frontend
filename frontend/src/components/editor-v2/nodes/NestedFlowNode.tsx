import React, { useState, useCallback, useRef } from 'react';
import { Handle, Position, NodeResizer, type NodeProps, type Node } from '@xyflow/react';

interface ChildVertex {
    id: string;
    label: string;
    position: { x: number; y: number };
}

export interface NestedFlowNodeData {
    label: string;
    children: ChildVertex[];
    [key: string]: unknown;
}

export type NestedFlowNodeType = Node<NestedFlowNodeData, 'nestedFlowNode'>;

/**
 * A node that contains nested child vertices.
 * Phase 2: Children are now draggable within the container.
 */
function NestedFlowNode({ data, selected }: NodeProps<NestedFlowNodeType>) {
    const [children, setChildren] = useState<ChildVertex[]>(data.children || []);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const canvasRef = useRef<HTMLDivElement>(null);

    const onVertexPointerDown = useCallback((e: React.PointerEvent, vertexId: string) => {
        // CRITICAL: stopPropagation prevents react-flow from starting parent node drag
        e.stopPropagation();
        const vertex = children.find(c => c.id === vertexId);
        if (!vertex) return;

        setDragging(vertexId);
        setDragOffset({
            x: e.clientX - vertex.position.x,
            y: e.clientY - vertex.position.y,
        });
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    }, [children]);

    const onPointerMove = useCallback((e: React.PointerEvent) => {
        if (!dragging || !canvasRef.current) return;

        const canvasRect = canvasRef.current.getBoundingClientRect();
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;

        // Clamp within canvas boundaries
        const clampedX = Math.max(0, Math.min(newX, canvasRect.width - 80));
        const clampedY = Math.max(0, Math.min(newY, canvasRect.height - 30));

        setChildren(prev => prev.map(c =>
            c.id === dragging ? { ...c, position: { x: clampedX, y: clampedY } } : c
        ));
    }, [dragging, dragOffset]);

    const onPointerUp = useCallback(() => {
        setDragging(null);
    }, []);

    return (
        <div className="nested-flow-node">
            <NodeResizer
                isVisible={selected}
                minWidth={250}
                minHeight={150}
                lineClassName="nested-flow-node__resizer-line"
                handleClassName="nested-flow-node__resizer-handle"
            />
            <Handle type="target" position={Position.Left} />

            <div className="nested-flow-node__header">{data.label}</div>

            <div
                ref={canvasRef}
                className="nested-flow-node__canvas nodrag"
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerLeave={onPointerUp}
            >
                {children.map((child) => (
                    <div
                        key={child.id}
                        className={`nested-vertex ${dragging === child.id ? 'dragging' : ''}`}
                        style={{
                            position: 'absolute',
                            left: child.position.x,
                            top: child.position.y,
                        }}
                        onPointerDown={(e) => onVertexPointerDown(e, child.id)}
                    >
                        {child.label}
                    </div>
                ))}
            </div>

            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default NestedFlowNode;

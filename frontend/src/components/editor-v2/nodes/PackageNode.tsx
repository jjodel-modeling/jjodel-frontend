import { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { PackageNodeData } from '../types';
import { useEditorContextSafe } from '../contexts/EditorContext';

export type PackageNodeType = Node<PackageNodeData, 'packageNode'>;

function PackageNode({ id, data, selected }: NodeProps<PackageNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);

    useEffect(() => {
        setName(data.label);
    }, [data.label]);

    const commitName = useCallback(() => {
        setEditing(false);
        if (name !== data.label) {
            editorContext?.takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, label: name } } : n
                )
            );
        }
    }, [id, name, data.label, setNodes, editorContext]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitName();
            } else if (e.key === 'Escape') {
                setName(data.label);
                setEditing(false);
            }
        },
        [commitName, data.label]
    );

    return (
        <div className={`mm-node mm-package ${selected ? 'selected' : ''}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={120}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <Handle type="source" position={Position.Top} id="top" className="mm-anchor" />
            <Handle type="source" position={Position.Right} id="right" className="mm-anchor" />
            <Handle type="source" position={Position.Bottom} id="bottom" className="mm-anchor" />
            <Handle type="source" position={Position.Left} id="left" className="mm-anchor" />

            {/* Package tab header */}
            <div className="mm-node__tab" onDoubleClick={() => setEditing(true)}>
                <span className="mm-node__badge">P</span>
                {editing ? (
                    <input
                        className="mm-node__input"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span className="mm-node__name">{name}</span>
                )}
            </div>

            {/* Package body (container for nested elements) */}
            <div className="mm-node__container" />
        </div>
    );
}

export default PackageNode;

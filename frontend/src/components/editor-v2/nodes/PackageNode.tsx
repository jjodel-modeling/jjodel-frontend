import { useState, useCallback, useEffect } from 'react';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
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
        <div className={`package-node ${selected ? 'selected' : ''}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={300}
                minHeight={200}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <div className="package-node__tab" onDoubleClick={() => setEditing(true)}>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span>{name}</span>
                )}
            </div>

            <div className="package-node__body" />
        </div>
    );
}

export default PackageNode;

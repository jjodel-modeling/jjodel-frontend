import { useState, useCallback, useEffect, useRef } from 'react';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import DynamicHandles from '../components/DynamicHandles';
import { syncNodeLabel } from '../sync/canvasToJjom';
import type { PackageNodeData } from '../types';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useNodeHighlightClass } from '../contexts/HighlightContext';

export type PackageNodeType = Node<PackageNodeData, 'packageNode'>;

function PackageNode({ id, data, selected }: NodeProps<PackageNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const hlClass = useNodeHighlightClass(id);
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const lastCommittedName = useRef(data.label);

    useEffect(() => {
        if (data.label !== lastCommittedName.current) {
            setName(data.label);
            lastCommittedName.current = data.label;
        }
    }, [data.label]);

    // Auto-edit mode for newly created nodes
    useEffect(() => {
        if (data.autoEdit) {
            setEditing(true);
            setNodes(nds => nds.map(n =>
                n.id === id ? { ...n, data: { ...n.data, autoEdit: undefined } } : n
            ));
        }
    }, [data.autoEdit, id, setNodes]);

    const commitName = useCallback(() => {
        setEditing(false);
        if (name !== lastCommittedName.current) {
            lastCommittedName.current = name;
            editorContext?.takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === id ? { ...n, data: { ...n.data, label: name } } : n
                )
            );
            syncNodeLabel(id, name);
        }
    }, [id, name, setNodes, editorContext]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitName();
            } else if (e.key === 'Escape') {
                setName(lastCommittedName.current);
                setEditing(false);
            }
        },
        [commitName]
    );

    return (
        <div className={`mm-node mm-package ${selected ? 'selected' : ''} ${hlClass}`}>
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={120}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <DynamicHandles nodeId={id} />

            {/* Package tab header */}
            <div className="mm-node__tab" onDoubleClick={() => setEditing(true)}>
                <span className="mm-node__badge">P</span>
                {editing ? (
                    <input
                        className="mm-node__input"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => e.target.select()}
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

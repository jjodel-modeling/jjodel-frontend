import { useState, useCallback, useEffect } from 'react';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import type { EnumNodeData } from '../types';
import { createLiteral } from '../types';
import { useEditorContextSafe } from '../contexts/EditorContext';

export type EnumNodeType = Node<EnumNodeData, 'enumNode'>;

function EnumNode({ id, data, selected }: NodeProps<EnumNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const [dragOver, setDragOver] = useState(false);

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

    // Drop handler - accept literal from palette
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/reactflow')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent canvas drop
        const itemType = e.dataTransfer.getData('application/reactflow');

        if (itemType === 'literal') {
            editorContext?.takeSnapshot();
            const nextValue = data.literals.length > 0
                ? Math.max(...data.literals.map(l => l.value)) + 1
                : 0;
            const newLit = createLiteral('NEW_VALUE', nextValue);

            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, literals: [...(n.data as EnumNodeData).literals, newLit] } }
                    : n
            ));
        }

        setDragOver(false);
    }, [id, data.literals, setNodes, editorContext]);

    return (
        <div
            className={`enum-node ${selected ? 'selected' : ''} ${dragOver ? 'drop-target' : ''}`}
            onDragOver={(e) => { handleDragOver(e); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={150}
                minHeight={50}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <div className="enum-node__stereotype">«enumeration»</div>

            <div className="enum-node__header" onDoubleClick={() => setEditing(true)}>
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

            {data.literals.length > 0 && <div className="enum-node__separator" />}

            <div className="enum-node__literals">
                {data.literals.map((lit) => (
                    <div key={lit.id} className="enum-node__literal">
                        {lit.name}
                    </div>
                ))}
            </div>

            {/* Empty hint */}
            {data.literals.length === 0 && (
                <div className="enum-node__empty-hint">
                    Drop literals here
                </div>
            )}
        </div>
    );
}

export default EnumNode;

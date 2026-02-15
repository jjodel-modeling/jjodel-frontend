import { useState, useCallback, useEffect } from 'react';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import DynamicHandles from '../components/DynamicHandles';
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

    // Inline editing for literals
    const [editingLit, setEditingLit] = useState<string | null>(null);
    const [editValue, setEditValue] = useState('');

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

    // Start editing a literal
    const startEditLit = useCallback((litId: string, currentValue: string) => {
        setEditingLit(litId);
        setEditValue(currentValue);
    }, []);

    // Commit literal edit
    const commitLitEdit = useCallback(() => {
        if (!editingLit) return;

        const lit = data.literals.find(l => l.id === editingLit);
        if (lit && editValue !== lit.name) {
            editorContext?.takeSnapshot();
            setNodes(nds => nds.map(n => {
                if (n.id !== id) return n;
                const nodeData = n.data as EnumNodeData;
                return {
                    ...n,
                    data: {
                        ...nodeData,
                        literals: nodeData.literals.map(l =>
                            l.id === editingLit ? { ...l, name: editValue } : l
                        ),
                    },
                };
            }));
        }
        setEditingLit(null);
    }, [editingLit, editValue, data.literals, id, setNodes, editorContext]);

    const handleLitKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitLitEdit();
        } else if (e.key === 'Escape') {
            setEditingLit(null);
        }
    }, [commitLitEdit]);

    // Drop handler - accept literal from palette
    const handleDragOver = useCallback((e: React.DragEvent) => {
        if (e.dataTransfer.types.includes('application/reactflow')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
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

    const notation = editorContext?.notation ?? 'uml';
    const hasLiterals = data.literals.length > 0;
    const showBody = notation !== 'compact';

    return (
        <div
            className={`mm-node mm-enum ${selected ? 'selected' : ''} ${dragOver ? 'drop-target' : ''}`}
            onDragOver={(e) => { handleDragOver(e); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={120}
                minHeight={40}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <DynamicHandles nodeId={id} />

            {/* Header with stereotype */}
            <div className="mm-node__header" onDoubleClick={() => setEditing(true)}>
                <span className="mm-node__stereotype">{'\u00ABenumeration\u00BB'}</span>
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

            {/* Body with literals — ER mode: comma-separated */}
            {showBody && hasLiterals && notation === 'er' && (
                <div className="mm-node__body mm-node__body--er">
                    <span className="mm-node__er-attrs">
                        {data.literals.map(l => l.name).join(', ')}
                    </span>
                </div>
            )}

            {showBody && hasLiterals && notation !== 'er' && (
                <div className="mm-node__body">
                    <div className="mm-node__fields">
                        {data.literals.map((lit) => (
                            <div key={lit.id} className="mm-literal">
                                {editingLit === lit.id ? (
                                    <input
                                        className="mm-literal__input"
                                        autoFocus
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={commitLitEdit}
                                        onKeyDown={handleLitKeyDown}
                                    />
                                ) : (
                                    <span
                                        className="mm-literal__name"
                                        onDoubleClick={() => startEditLit(lit.id, lit.name)}
                                    >
                                        {lit.name}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty state */}
            {showBody && !hasLiterals && (
                <div className="mm-node__empty">
                    Drop literals
                </div>
            )}
        </div>
    );
}

export default EnumNode;

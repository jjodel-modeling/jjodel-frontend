import { useState, useCallback, useEffect } from 'react';
import { Handle, Position, NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import ViewpointRenderer from '../viewpoint/ViewpointRenderer';
import { useEditorContextSafe } from '../contexts/EditorContext';
import type { ClassNodeData } from '../types';
import { createAttribute, createOperation, E_DATA_TYPES } from '../types';

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

// Re-export for backwards compatibility
export type { ClassNodeData } from '../types';

function ClassNode({ id, data, selected }: NodeProps<ClassNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const [dragOver, setDragOver] = useState(false);

    // Inline editing for attributes
    const [editingAttr, setEditingAttr] = useState<{ id: string; field: 'name' | 'type' } | null>(null);
    const [editValue, setEditValue] = useState('');

    useEffect(() => {
        setName(data.label);
    }, [data.label]);

    // Start editing an attribute field
    const startEditAttr = useCallback((attrId: string, field: 'name' | 'type', currentValue: string) => {
        setEditingAttr({ id: attrId, field });
        setEditValue(currentValue);
    }, []);

    // Commit attribute edit
    const commitAttrEdit = useCallback(() => {
        if (!editingAttr) return;

        const attr = data.attributes?.find(a => a.id === editingAttr.id);
        if (attr && editValue !== attr[editingAttr.field]) {
            editorContext?.takeSnapshot();
            setNodes(nds => nds.map(n => {
                if (n.id !== id) return n;
                const nodeData = n.data as ClassNodeData;
                return {
                    ...n,
                    data: {
                        ...nodeData,
                        attributes: nodeData.attributes.map(a =>
                            a.id === editingAttr.id
                                ? { ...a, [editingAttr.field]: editValue }
                                : a
                        ),
                    },
                };
            }));
        }
        setEditingAttr(null);
    }, [editingAttr, editValue, data.attributes, id, setNodes, editorContext]);

    const handleAttrKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitAttrEdit();
        } else if (e.key === 'Escape') {
            setEditingAttr(null);
        }
    }, [commitAttrEdit]);

    const handleDoubleClick = useCallback(() => {
        setEditing(true);
    }, []);

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

    const handleBlur = useCallback(() => {
        commitName();
    }, [commitName]);

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

    // Drop handler - accept attribute/operation from palette
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

        if (itemType === 'attribute') {
            editorContext?.takeSnapshot();
            const newAttr = createAttribute();
            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, attributes: [...(n.data as ClassNodeData).attributes, newAttr] } }
                    : n
            ));
        }

        if (itemType === 'operation') {
            editorContext?.takeSnapshot();
            const newOp = createOperation();
            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, operations: [...((n.data as ClassNodeData).operations || []), newOp] } }
                    : n
            ));
        }

        setDragOver(false);
    }, [id, setNodes, editorContext]);

    // If there's a jsxString, use ViewpointRenderer
    if (data.jsxString) {
        return (
            <div className={`class-node viewpoint-wrapper ${selected ? 'selected' : ''}`}>
                <NodeResizer
                    isVisible={selected}
                    minWidth={120}
                    minHeight={60}
                    lineClassName="node-resize-line"
                    handleClassName="node-resize-handle"
                />
                <Handle type="target" position={Position.Top} id="top" className="anchor-handle" />
                <Handle type="source" position={Position.Right} id="right" className="anchor-handle" />
                <Handle type="target" position={Position.Bottom} id="bottom" className="anchor-handle" />
                <Handle type="source" position={Position.Left} id="left" className="anchor-handle" />
                <ViewpointRenderer jsxString={data.jsxString} context={data} />
            </div>
        );
    }

    const isAbstract = data.isAbstract ?? false;
    const hasContent = (data.attributes?.length || 0) > 0 || (data.operations?.length || 0) > 0;

    return (
        <div
            className={`class-node ${selected ? 'selected' : ''} ${isAbstract ? 'abstract' : ''} ${dragOver ? 'drop-target' : ''}`}
            onDragOver={(e) => { handleDragOver(e); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={180}
                minHeight={50}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <Handle type="target" position={Position.Top} id="top" className="anchor-handle" />
            <Handle type="source" position={Position.Right} id="right" className="anchor-handle" />
            <Handle type="target" position={Position.Bottom} id="bottom" className="anchor-handle" />
            <Handle type="source" position={Position.Left} id="left" className="anchor-handle" />

            {/* Stereotype for abstract classes */}
            {isAbstract && (
                <div className="class-node__stereotype">«abstract»</div>
            )}

            <div className="class-node__header" onDoubleClick={handleDoubleClick}>
                {editing ? (
                    <input
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span className={isAbstract ? 'italic' : ''}>{name}</span>
                )}
            </div>

            {/* Separator before attributes */}
            {data.attributes && data.attributes.length > 0 && (
                <div className="class-node__separator" />
            )}

            {/* Attributes */}
            {data.attributes && data.attributes.length > 0 && (
                <div className="class-node__section">
                    {data.attributes.map((attr) => (
                        <div key={attr.id} className="class-node__field">
                            {editingAttr?.id === attr.id && editingAttr.field === 'name' ? (
                                <input
                                    className="field-input"
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={commitAttrEdit}
                                    onKeyDown={handleAttrKeyDown}
                                />
                            ) : (
                                <span
                                    className="field-name"
                                    onDoubleClick={() => startEditAttr(attr.id, 'name', attr.name)}
                                >
                                    {attr.name}
                                </span>
                            )}
                            {editingAttr?.id === attr.id && editingAttr.field === 'type' ? (
                                <select
                                    className="field-select"
                                    autoFocus
                                    value={editValue}
                                    onChange={(e) => {
                                        setEditValue(e.target.value);
                                        // Auto-commit on select change
                                        const newType = e.target.value;
                                        editorContext?.takeSnapshot();
                                        setNodes(nds => nds.map(n => {
                                            if (n.id !== id) return n;
                                            const nodeData = n.data as ClassNodeData;
                                            return {
                                                ...n,
                                                data: {
                                                    ...nodeData,
                                                    attributes: nodeData.attributes.map(a =>
                                                        a.id === attr.id ? { ...a, type: newType } : a
                                                    ),
                                                },
                                            };
                                        }));
                                        setEditingAttr(null);
                                    }}
                                    onBlur={() => setEditingAttr(null)}
                                >
                                    {E_DATA_TYPES.map(t => (
                                        <option key={t} value={t}>{t}</option>
                                    ))}
                                </select>
                            ) : (
                                <span
                                    className="field-type"
                                    onDoubleClick={() => startEditAttr(attr.id, 'type', attr.type)}
                                >
                                    {attr.type}
                                    {(attr.upperBound === -1 || attr.upperBound > 1) && '[]'}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Separator before operations */}
            {data.operations && data.operations.length > 0 && (
                <div className="class-node__separator" />
            )}

            {/* Operations */}
            {data.operations && data.operations.length > 0 && (
                <div className="class-node__section">
                    {data.operations.map((op) => (
                        <div key={op.id} className="class-node__field operation">
                            <span className="field-name">{op.name}()</span>
                            <span className="field-type">{op.returnType}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty hint */}
            {!hasContent && (
                <div className="class-node__empty-hint">
                    Drop attributes here
                </div>
            )}
        </div>
    );
}

export default ClassNode;

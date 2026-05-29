import { useState, useCallback, useEffect, useRef } from 'react';
import { NodeResizer, useReactFlow, type NodeProps, type Node } from '@xyflow/react';
import ViewpointRenderer from '../viewpoint/ViewpointRenderer';
import DynamicHandles from '../components/DynamicHandles';
import InlineTypeSelect from '../components/InlineTypeSelect';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useNodeHighlightClass } from '../contexts/HighlightContext';
import {
    syncNodeLabel,
    syncAddAttribute,
    syncUpdateAttribute,
    syncAddOperation,
    syncUpdateOperation,
} from '../sync/canvasToJjom';
import type { ClassNodeData } from '../types';
import { createAttribute, createOperation } from '../types';
import { JjodelEvents } from '../../../events/registry';

export type ClassNodeType = Node<ClassNodeData, 'classNode'>;

// Re-export for backwards compatibility
export type { ClassNodeData } from '../types';

function ClassNode({ id, data, selected }: NodeProps<ClassNodeType>) {
    const { setNodes } = useReactFlow();
    const editorContext = useEditorContextSafe();
    const hlClass = useNodeHighlightClass(id);

    const attributes = data.attributes ?? [];
    const operations = data.operations ?? [];

    const [editing, setEditing] = useState(false);
    const [name, setName] = useState(data.label);
    const [dragOver, setDragOver] = useState(false);
    // Track the last name WE committed so we can distinguish our own writes
    // from external changes (e.g. Info panel rename) and avoid a sync loop.
    const lastCommittedName = useRef(data.label);

    // Inline editing for attributes and operations
    const [editingField, setEditingField] = useState<{
        id: string;
        field: 'name' | 'type' | 'returnType';
        kind: 'attr' | 'op';
    } | null>(null);
    const [editValue, setEditValue] = useState('');

    // Sync name from model only when changed externally (not by our own commit).
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

    // Start editing an attribute or operation field
    const startEditField = useCallback((
        itemId: string,
        field: 'name' | 'type' | 'returnType',
        currentValue: string,
        kind: 'attr' | 'op',
    ) => {
        setEditingField({ id: itemId, field, kind });
        setEditValue(currentValue);
    }, []);

    // Commit attribute or operation edit
    const commitFieldEdit = useCallback(() => {
        if (!editingField) return;

        if (editingField.kind === 'attr') {
            const attr = data.attributes?.find(a => a.id === editingField.id);
            if (attr && editValue !== attr[editingField.field as 'name' | 'type']) {
                editorContext?.takeSnapshot();
                setNodes(nds => nds.map(n => {
                    if (n.id !== id) return n;
                    const nodeData = n.data as ClassNodeData;
                    return {
                        ...n,
                        data: {
                            ...nodeData,
                            attributes: nodeData.attributes.map(a =>
                                a.id === editingField.id
                                    ? { ...a, [editingField.field]: editValue }
                                    : a
                            ),
                        },
                    };
                }));
                syncUpdateAttribute(editingField.id, editingField.field, editValue, id);
            }
        } else {
            const op = data.operations?.find(o => o.id === editingField.id);
            if (op && editValue !== op[editingField.field as 'name' | 'returnType']) {
                editorContext?.takeSnapshot();
                setNodes(nds => nds.map(n => {
                    if (n.id !== id) return n;
                    const nodeData = n.data as ClassNodeData;
                    return {
                        ...n,
                        data: {
                            ...nodeData,
                            operations: (nodeData.operations || []).map(o =>
                                o.id === editingField.id
                                    ? { ...o, [editingField.field]: editValue }
                                    : o
                            ),
                        },
                    };
                }));
                syncUpdateOperation(editingField.id, editingField.field, editValue, id);
            }
        }
        setEditingField(null);
    }, [editingField, editValue, data.attributes, data.operations, id, setNodes, editorContext]);

    const handleFieldKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            commitFieldEdit();
        } else if (e.key === 'Escape') {
            setEditingField(null);
        }
    }, [commitFieldEdit]);

    // Select a child element (attribute/operation) in the Properties panel
    const handleChildClick = useCallback((childId: string) => {
        editorContext?.selectChildElement?.(childId);
    }, [editorContext]);

    const handleDoubleClick = useCallback(() => {
        setEditing(true);
    }, []);

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
            syncAddAttribute(id);
            // Auto-focus the new attribute name
            setEditingField({ id: newAttr.id, field: 'name', kind: 'attr' });
            setEditValue(newAttr.name);
        }

        if (itemType === 'operation') {
            editorContext?.takeSnapshot();
            const newOp = createOperation();
            setNodes(nds => nds.map(n =>
                n.id === id
                    ? { ...n, data: { ...n.data, operations: [...((n.data as ClassNodeData).operations || []), newOp] } }
                    : n
            ));
            syncAddOperation(id);
        }

        setDragOver(false);
    }, [id, setNodes, editorContext]);

    // Viewpoint rendering
    if (data.jsxString) {
        return (
            <div className={`mm-node mm-class viewpoint-wrapper ${selected ? 'selected' : ''} ${hlClass}`}>
                <NodeResizer
                    isVisible={selected}
                    minWidth={120}
                    minHeight={60}
                    lineClassName="node-resize-line"
                    handleClassName="node-resize-handle"
                />
                <DynamicHandles nodeId={id} />
                <ViewpointRenderer jsxString={data.jsxString} context={data} />
            </div>
        );
    }

    const notation = editorContext?.notation ?? 'uml';
    const isAbstract = data.isAbstract ?? false;
    const isSingleton = data.isSingleton ?? false;
    const hasContent = attributes.length > 0 || operations.length > 0;
    const showBody = notation !== 'compact';

    // Format bounds for display
    const formatBounds = (lower: number, upper: number): string | null => {
        if (lower === 0 && upper === 1) return null; // Default, no display
        if (lower === 1 && upper === 1) return null; // Required single, no display
        if (upper === -1) return `[${lower}..*]`;
        if (lower === upper) return `[${lower}]`;
        return `[${lower}..${upper}]`;
    };

    return (
        <div
            className={`mm-node mm-class ${selected ? 'selected' : ''} ${isAbstract ? 'abstract' : ''} ${isSingleton ? 'singleton' : ''} ${dragOver ? 'drop-target' : ''} ${hlClass}`}
            onDragOver={(e) => { handleDragOver(e); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
        >
            <NodeResizer
                isVisible={selected}
                minWidth={140}
                minHeight={40}
                lineClassName="node-resize-line"
                handleClassName="node-resize-handle"
            />

            <DynamicHandles nodeId={id} />

            {/* Header — abstract classes get italic name via CSS (.abstract .mm-node__name) */}
            <div
                className="mm-node__header"
                onDoubleClick={handleDoubleClick}
                onClick={() => { if (selected && !editing) setEditing(true); }}
            >
                {editing ? (
                    <input
                        className="mm-node__input"
                        autoFocus
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onFocus={(e) => e.target.select()}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                    />
                ) : (
                    <span className="mm-node__name">{name}</span>
                )}
            </div>

            {/* Body with attributes and operations */}
            {showBody && hasContent && notation === 'er' && (
                <div className="mm-node__body mm-node__body--er">
                    <span className="mm-node__er-attrs">
                        {attributes.map(a => a.name).join(', ')}
                    </span>
                </div>
            )}

            {showBody && hasContent && notation !== 'er' && (
                <div className="mm-node__body">
                    {/* Attributes */}
                    {attributes.length > 0 && (
                        <div className="mm-node__fields">
                            {attributes.map((attr) => {
                                const bounds = formatBounds(attr.lowerBound ?? 0, attr.upperBound ?? 1);
                                return (
                                    <div key={attr.id} className="mm-field" onClick={() => handleChildClick(attr.id)}
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
                                                detail: { childId: attr.id, childKind: 'attr', nodeId: id, x: e.clientX, y: e.clientY }
                                            }));
                                        }}>
                                        {editingField?.id === attr.id && editingField.field === 'name' ? (
                                            <input
                                                className="mm-field__input"
                                                autoFocus
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onFocus={(e) => e.target.select()}
                                                onBlur={commitFieldEdit}
                                                onKeyDown={handleFieldKeyDown}
                                            />
                                        ) : (
                                            <span
                                                className="mm-field__name"
                                                onDoubleClick={() => startEditField(attr.id, 'name', attr.name, 'attr')}
                                                onClick={() => { if (selected) startEditField(attr.id, 'name', attr.name, 'attr'); }}
                                            >
                                                {attr.name}
                                            </span>
                                        )}
                                        <span className="mm-field__separator">:</span>
                                        {editingField?.id === attr.id && editingField.field === 'type' ? (
                                            <InlineTypeSelect
                                                value={editValue}
                                                onChange={(newType) => {
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
                                                    syncUpdateAttribute(attr.id, 'type', newType, id);
                                                    setEditingField(null);
                                                }}
                                                onClose={() => setEditingField(null)}
                                            />
                                        ) : (
                                            <span
                                                className="mm-field__type"
                                                onDoubleClick={() => startEditField(attr.id, 'type', attr.type, 'attr')}
                                                onClick={() => { if (selected) startEditField(attr.id, 'type', attr.type, 'attr'); }}
                                            >
                                                {attr.type}
                                                <i className="bi bi-chevron-down mm-field__type-chevron" />
                                            </span>
                                        )}
                                        {bounds ? <span className="mm-field__bound">{bounds}</span> : <span />}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Operations separator */}
                    {attributes.length > 0 && operations.length > 0 && (
                        <div className="mm-node__separator" />
                    )}

                    {/* Operations */}
                    {operations.length > 0 && (
                        <div className="mm-node__fields">
                            {operations.map((op) => (
                                <div key={op.id} className="mm-field mm-operation" onClick={() => handleChildClick(op.id)}
                                    onContextMenu={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        window.dispatchEvent(new CustomEvent(JjodelEvents.CHILD_CONTEXT_MENU, {
                                            detail: { childId: op.id, childKind: 'op', nodeId: id, x: e.clientX, y: e.clientY }
                                        }));
                                    }}>
                                    {editingField?.id === op.id && editingField.field === 'name' ? (
                                        <input
                                            className="mm-field__input"
                                            autoFocus
                                            value={editValue}
                                            onChange={(e) => setEditValue(e.target.value)}
                                            onFocus={(e) => e.target.select()}
                                            onBlur={commitFieldEdit}
                                            onKeyDown={handleFieldKeyDown}
                                        />
                                    ) : (
                                        <span
                                            className="mm-field__name"
                                            onDoubleClick={() => startEditField(op.id, 'name', op.name, 'op')}
                                            onClick={() => { if (selected) startEditField(op.id, 'name', op.name, 'op'); }}
                                        >
                                            {op.name}()
                                        </span>
                                    )}
                                    <span className="mm-field__separator">:</span>
                                    {editingField?.id === op.id && editingField.field === 'returnType' ? (
                                        <InlineTypeSelect
                                            value={editValue}
                                            onChange={(newType) => {
                                                editorContext?.takeSnapshot();
                                                setNodes(nds => nds.map(n => {
                                                    if (n.id !== id) return n;
                                                    const nodeData = n.data as ClassNodeData;
                                                    return {
                                                        ...n,
                                                        data: {
                                                            ...nodeData,
                                                            operations: (nodeData.operations || []).map(o =>
                                                                o.id === op.id ? { ...o, returnType: newType } : o
                                                            ),
                                                        },
                                                    };
                                                }));
                                                syncUpdateOperation(op.id, 'returnType', newType, id);
                                                setEditingField(null);
                                            }}
                                            onClose={() => setEditingField(null)}
                                        />
                                    ) : (
                                        <span
                                            className="mm-field__type"
                                            onDoubleClick={() => startEditField(op.id, 'returnType', op.returnType, 'op')}
                                            onClick={() => { if (selected) startEditField(op.id, 'returnType', op.returnType, 'op'); }}
                                        >
                                            {op.returnType}
                                            <i className="bi bi-chevron-down mm-field__type-chevron" />
                                        </span>
                                    )}
                                    <span />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Empty drop zone */}
            {showBody && !hasContent && (
                <div className="mm-node__empty">
                </div>
            )}
        </div>
    );
}

export default ClassNode;

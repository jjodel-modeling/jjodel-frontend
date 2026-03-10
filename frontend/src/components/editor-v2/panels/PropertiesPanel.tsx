import { useCallback, useState, useEffect, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useNodes } from '@xyflow/react';
import type {
    ClassNodeData,
    EnumNodeData,
    PackageNodeData,
    ObjectNodeData,
    ReferenceEdgeData,
    InheritanceEdgeData,
    MetaAttribute,
    MetaLiteral,
    MetaReference,
    MetaOperation,
    ReferenceKind,
    AnchorSide,
    AnchorMode,
    AnchorConfig,
} from '../types';
import M1PropertiesPanel from './M1PropertiesPanel';
import { createAttribute, createLiteral, createReference, createOperation, formatCardinality, E_DATA_TYPES } from '../types';
import {
    syncClassAbstract,
    syncAddAttribute,
    syncUpdateAttribute,
    syncRemoveAttribute,
    syncAddOperation,
    syncUpdateOperation,
    syncRemoveOperation,
    syncAddEnumLiteral,
    syncUpdateEnumLiteral,
    syncRemoveEnumLiteral,
    syncUpdateReference,
    syncEdgeRefKind,
    syncNodeLabel,
} from '../sync/canvasToJjom';
import { getEdgeRefId } from '../sync/syncState';

interface PropertiesPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onNodeChange: (nodeId: string, data: any) => void;
    onEdgeChange: (edgeId: string, data: Partial<Edge>) => void;
    onConvertToInheritance?: (edgeId: string) => void;
    onConvertToReference?: (edgeId: string) => void;
    isJjomMode?: boolean;
    modelInfo?: ModelInfo | null;
    onModelNameChange?: (name: string) => void;
    onModelUriChange?: (uri: string) => void;
}

// Collapsible section component
function Section({
    title,
    count,
    children,
    defaultOpen = true,
    action,
}: {
    title: string;
    count?: number;
    children: React.ReactNode;
    defaultOpen?: boolean;
    action?: React.ReactNode;
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="prop-section">
            <div
                className={`prop-section__header ${!open ? 'collapsed' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <i className="bi bi-chevron-down chevron" />
                <span className="prop-section__title">{title}</span>
                {count !== undefined && <span className="prop-section__count">{count}</span>}
                {action && (
                    <div className="prop-section__actions" onClick={(e) => e.stopPropagation()}>
                        {action}
                    </div>
                )}
            </div>
            {open && <div className="prop-section__body">{children}</div>}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Model / Metamodel properties (shown when nothing is selected on canvas)
// ---------------------------------------------------------------------------

interface ModelInfo {
    name: string;
    uri: string;
    className: string;
    classCount: number;
    abstractCount: number;
    enumCount: number;
    packageCount: number;
    referenceCount: number;
    totalClassifiers: number;
}

function ModelProperties({
    modelInfo,
    onNameChange,
    onUriChange,
}: {
    modelInfo: ModelInfo;
    onNameChange: (name: string) => void;
    onUriChange: (uri: string) => void;
}) {
    const [name, setName] = useState(modelInfo.name);
    const [uri, setUri] = useState(modelInfo.uri);

    useEffect(() => {
        setName(modelInfo.name);
        setUri(modelInfo.uri);
    }, [modelInfo.name, modelInfo.uri]);

    const commitName = useCallback(() => {
        if (name !== modelInfo.name) onNameChange(name);
    }, [name, modelInfo.name, onNameChange]);

    const commitUri = useCallback(() => {
        if (uri !== modelInfo.uri) onUriChange(uri);
    }, [uri, modelInfo.uri, onUriChange]);

    const isModel = modelInfo.className === 'DModel';
    const isPackage = modelInfo.className === 'DPackage';
    const typeLabel = isModel ? 'Model' : isPackage ? 'Package' : 'Metamodel';
    const typeIcon = isModel ? 'bi-box' : isPackage ? 'bi-folder' : 'bi-diagram-3';

    return (
        <aside className="properties-panel">
            <div className="properties-panel__header">
                <i className={`bi ${typeIcon}`} />
                <span className="properties-panel__title">{typeLabel}</span>
            </div>

            <div className="properties-panel__body">
                <Section title="GENERAL">
                    <div className="prop-field">
                        <label className="prop-label">Name</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); }}
                        />
                    </div>
                    <div className="prop-field">
                        <label className="prop-label">URI</label>
                        <input
                            className="prop-input"
                            value={uri}
                            onChange={(e) => setUri(e.target.value)}
                            onBlur={commitUri}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitUri(); }}
                            placeholder="e.g. http://example.org/mymodel"
                        />
                    </div>
                </Section>

                <Section title="OVERVIEW" defaultOpen={true}>
                    <div className="prop-stats">
                        {modelInfo.classCount > 0 && (
                            <div className="prop-stats__row">
                                <i className="bi bi-circle" />
                                <span>Classes</span>
                                <span className="prop-stats__count">{modelInfo.classCount}</span>
                            </div>
                        )}
                        {modelInfo.abstractCount > 0 && (
                            <div className="prop-stats__row">
                                <i className="bi bi-circle-half" />
                                <span>Abstract Classes</span>
                                <span className="prop-stats__count">{modelInfo.abstractCount}</span>
                            </div>
                        )}
                        {modelInfo.enumCount > 0 && (
                            <div className="prop-stats__row">
                                <i className="bi bi-list-ul" />
                                <span>Enumerations</span>
                                <span className="prop-stats__count">{modelInfo.enumCount}</span>
                            </div>
                        )}
                        {modelInfo.packageCount > 0 && (
                            <div className="prop-stats__row">
                                <i className="bi bi-folder" />
                                <span>Packages</span>
                                <span className="prop-stats__count">{modelInfo.packageCount}</span>
                            </div>
                        )}
                        {modelInfo.referenceCount > 0 && (
                            <div className="prop-stats__row">
                                <i className="bi bi-arrow-right" />
                                <span>References</span>
                                <span className="prop-stats__count">{modelInfo.referenceCount}</span>
                            </div>
                        )}
                        {modelInfo.totalClassifiers === 0 && (
                            <div className="prop-stats__empty">
                                No classifiers yet. Drag elements from the palette.
                            </div>
                        )}
                    </div>
                </Section>
            </div>
        </aside>
    );
}

function PropertiesPanel({
    selectedNodes,
    selectedEdges,
    onNodeChange,
    onEdgeChange,
    onConvertToInheritance,
    onConvertToReference,
    isJjomMode,
    modelInfo,
    onModelNameChange,
    onModelUriChange,
}: PropertiesPanelProps) {
    const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    const selectedEdge = selectedEdges.length === 1 && selectedNodes.length === 0 ? selectedEdges[0] : null;

    // Nothing selected — show model/metamodel properties if available
    if (!selectedNode && !selectedEdge && selectedNodes.length === 0 && selectedEdges.length === 0) {
        if (modelInfo && isJjomMode && onModelNameChange && onModelUriChange) {
            return <ModelProperties modelInfo={modelInfo} onNameChange={onModelNameChange} onUriChange={onModelUriChange} />;
        }
        return (
            <aside className="properties-panel">
                <div className="properties-panel__header">
                    <i className="bi bi-sliders" />
                    <span className="properties-panel__title">Properties</span>
                </div>
                <div className="properties-panel__empty">
                    <i className="bi bi-cursor" />
                    <span>Select a node or edge to view its properties</span>
                </div>
            </aside>
        );
    }

    // Multiple selection
    if (selectedNodes.length > 1 || selectedEdges.length > 1 || (selectedNodes.length > 0 && selectedEdges.length > 0)) {
        const count = selectedNodes.length + selectedEdges.length;
        return (
            <aside className="properties-panel">
                <div className="properties-panel__header">
                    <i className="bi bi-collection" />
                    <span className="properties-panel__title">Selection</span>
                </div>
                <div className="properties-panel__empty">
                    <i className="bi bi-collection" />
                    <span>{count} items selected</span>
                </div>
            </aside>
        );
    }

    // Single node selected - route by type
    if (selectedNode) {
        switch (selectedNode.type) {
            case 'classNode':
                return (
                    <aside className="properties-panel">
                        <ClassNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} />
                    </aside>
                );
            case 'enumNode':
                return (
                    <aside className="properties-panel">
                        <EnumNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} />
                    </aside>
                );
            case 'packageNode':
                return (
                    <aside className="properties-panel">
                        <PackageNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} />
                    </aside>
                );
            case 'objectNode':
                return (
                    <aside className="properties-panel">
                        <M1PropertiesPanel selectedNode={selectedNode as any} onNodeChange={onNodeChange} />
                    </aside>
                );
            default:
                return (
                    <aside className="properties-panel">
                        <GenericNodeProperties node={selectedNode} onUpdate={onNodeChange} />
                    </aside>
                );
        }
    }

    // Single edge selected
    if (selectedEdge) {
        if (selectedEdge.type === 'inheritance') {
            return (
                <aside className="properties-panel">
                    <InheritanceEdgeProperties
                        edge={selectedEdge}
                        onEdgeChange={onEdgeChange}
                        onConvertToReference={onConvertToReference}
                    />
                </aside>
            );
        }
        return (
            <aside className="properties-panel">
                <ReferenceEdgeProperties
                    edge={selectedEdge}
                    onUpdate={onEdgeChange}
                    onConvertToInheritance={onConvertToInheritance}
                    isJjomMode={isJjomMode}
                />
            </aside>
        );
    }

    return null;
}

// === Class Node Properties ===
function ClassNodeProperties({ node, onUpdate, isJjomMode }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean }) {
    const nodeData = node.data as ClassNodeData;
    const [name, setName] = useState(nodeData.label);

    // In JjOM mode, read directly from nodeData (JjOM is source of truth via useJjomSync).
    // In standalone mode, use local state as before.
    const attributes = nodeData.attributes || [];
    const references = nodeData.references || [];
    const operations = nodeData.operations || [];
    const isAbstract = nodeData.isAbstract ?? false;

    // Local edit buffers for inline text editing (attr names, op names).
    // Key: `${elementId}:${field}`, Value: current editing value.
    const [editBuffers, setEditBuffers] = useState<Record<string, string>>({});

    // All class nodes for the reference target dropdown
    const allNodes = useNodes();
    const availableClasses = useMemo(() =>
        allNodes
            .filter(n => n.type === 'classNode' && n.id !== node.id)
            .map(n => ({ id: n.id, name: (n.data as ClassNodeData).label }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [allNodes, node.id]
    );

    useEffect(() => {
        setName(nodeData.label);
        setEditBuffers({});
    }, [node.id, nodeData.label]);

    const commit = useCallback((updates: Partial<ClassNodeData>) => {
        onUpdate(node.id, { ...nodeData, ...updates });
    }, [node.id, nodeData, onUpdate]);

    // --- Name ---
    const commitName = () => {
        commit({ label: name });
        syncNodeLabel(node.id, name);
    };

    // --- Abstract ---
    const toggleAbstract = (checked: boolean) => {
        commit({ isAbstract: checked });
        syncClassAbstract(node.id, checked);
    };

    // --- Edit buffer helpers ---
    const getEditValue = (id: string, field: string, original: string): string => {
        const key = `${id}:${field}`;
        return key in editBuffers ? editBuffers[key] : original;
    };

    const setEditValue = (id: string, field: string, value: string) => {
        setEditBuffers(prev => ({ ...prev, [`${id}:${field}`]: value }));
    };

    const clearEditBuffer = (id: string, field: string) => {
        setEditBuffers(prev => {
            const next = { ...prev };
            delete next[`${id}:${field}`];
            return next;
        });
    };

    // --- Attributes ---
    const addAttribute = () => {
        const updated = [...attributes, createAttribute()];
        commit({ attributes: updated });
        syncAddAttribute(node.id);
    };

    const commitAttrField = (attrId: string, field: string, value: string) => {
        const updated = attributes.map(a => a.id === attrId ? { ...a, [field]: value } : a);
        commit({ attributes: updated });
        syncUpdateAttribute(attrId, field, value, node.id);
        clearEditBuffer(attrId, field);
    };

    const handleAttrTypeChange = (attrId: string, value: string) => {
        const updated = attributes.map(a => a.id === attrId ? { ...a, type: value } : a);
        commit({ attributes: updated });
        syncUpdateAttribute(attrId, 'type', value, node.id);
    };

    const removeAttribute = (attrId: string) => {
        const updated = attributes.filter(a => a.id !== attrId);
        commit({ attributes: updated });
        syncRemoveAttribute(attrId, node.id);
    };

    // --- References (inline) ---
    const addReference = () => {
        const updated = [...references, createReference()];
        commit({ references: updated });
    };

    const updateReference = (index: number, field: keyof MetaReference, val: string | number | boolean) => {
        const updated = references.map((ref, i) =>
            i === index ? { ...ref, [field]: val } : ref
        );
        commit({ references: updated });
    };

    const removeReference = (index: number) => {
        const updated = references.filter((_, i) => i !== index);
        commit({ references: updated });
    };

    // --- Operations ---
    const addOperation = () => {
        const updated = [...operations, createOperation()];
        commit({ operations: updated });
        syncAddOperation(node.id);
    };

    const commitOpField = (opId: string, field: string, value: string) => {
        const updated = operations.map(o => o.id === opId ? { ...o, [field]: value } : o);
        commit({ operations: updated });
        syncUpdateOperation(opId, field, value, node.id);
        clearEditBuffer(opId, field);
    };

    const handleOpReturnTypeChange = (opId: string, value: string) => {
        const updated = operations.map(o => o.id === opId ? { ...o, returnType: value } : o);
        commit({ operations: updated });
        syncUpdateOperation(opId, 'type', value, node.id);
    };

    const removeOperation = (opId: string) => {
        const updated = operations.filter(o => o.id !== opId);
        commit({ operations: updated });
        syncRemoveOperation(opId, node.id);
    };

    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-diagram-3" />
                <span className="properties-panel__title">Class</span>
                <span className="properties-panel__subtitle">{node.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="General">
                    <div className="prop-field">
                        <label className="prop-label">Name</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                    <label className="prop-checkbox">
                        <input
                            type="checkbox"
                            checked={isAbstract}
                            onChange={(e) => toggleAbstract(e.target.checked)}
                        />
                        Abstract
                    </label>
                </Section>

                <Section
                    title="Attributes"
                    count={attributes.length}
                    action={
                        <button
                            className="prop-section-add-btn"
                            onClick={addAttribute}
                            title="Add attribute"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {attributes.length === 0 && (
                        <div className="prop-empty">Drop attributes from palette or click +</div>
                    )}
                    {attributes.map((attr) => (
                        <div key={attr.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm"
                                value={getEditValue(attr.id, 'name', attr.name)}
                                onChange={(e) => setEditValue(attr.id, 'name', e.target.value)}
                                onBlur={(e) => commitAttrField(attr.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitAttrField(attr.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="name"
                            />
                            <select
                                className="prop-select"
                                value={attr.type}
                                onChange={(e) => handleAttrTypeChange(attr.id, e.target.value)}
                            >
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="prop-remove-btn" onClick={() => removeAttribute(attr.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>

                <Section
                    title="References"
                    count={references.length}
                    action={
                        !isJjomMode ? (
                            <button
                                className="prop-section-add-btn"
                                onClick={addReference}
                                title="Add reference"
                            >
                                <i className="bi bi-plus" />
                            </button>
                        ) : undefined
                    }
                >
                    {isJjomMode ? (
                        <>
                            {references.length === 0 && (
                                <div className="prop-empty">Draw reference edges between classes</div>
                            )}
                            {references.map((ref) => (
                                <div key={ref.id} className="prop-list-item prop-list-item--readonly">
                                    <span className="prop-info">{ref.name}</span>
                                    <span className="prop-info prop-info--type">{'\u2192'} {ref.type?.name ?? '?'}</span>
                            
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {references.length === 0 && (
                                <div className="prop-empty">Click + to add a reference</div>
                            )}
                            {references.map((ref, i) => (
                                <div key={ref.id} className="prop-list-item">
                                    <input
                                        className="prop-input prop-input--sm"
                                        value={ref.name}
                                        onChange={(e) => updateReference(i, 'name', e.target.value)}
                                        placeholder="refName"
                                    />
                                    <select
                                        className="prop-select"
                                        value={ref.targetClassId}
                                        onChange={(e) => updateReference(i, 'targetClassId', e.target.value)}
                                    >
                                        <option value="">-- target --</option>
                                        {availableClasses.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                    <button className="prop-remove-btn" onClick={() => removeReference(i)} title="Remove">
                                        <i className="bi bi-x" />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </Section>

                <Section
                    title="Operations"
                    count={operations.length}
                    action={
                        <button
                            className="prop-section-add-btn"
                            onClick={addOperation}
                            title="Add operation"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {operations.length === 0 && (
                        <div className="prop-empty">Drop operations from palette or click +</div>
                    )}
                    {operations.map((op) => (
                        <div key={op.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm"
                                value={getEditValue(op.id, 'name', op.name)}
                                onChange={(e) => setEditValue(op.id, 'name', e.target.value)}
                                onBlur={(e) => commitOpField(op.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitOpField(op.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="name"
                            />
                            <select
                                className="prop-select"
                                value={op.returnType}
                                onChange={(e) => handleOpReturnTypeChange(op.id, e.target.value)}
                            >
                                <option value="void">void</option>
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="prop-remove-btn" onClick={() => removeOperation(op.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>

                <Section title="Layout" defaultOpen={false}>
                    <div className="prop-row">
                        <span className="prop-badge">x: {Math.round(node.position.x)}</span>
                        <span className="prop-badge">y: {Math.round(node.position.y)}</span>
                    </div>
                </Section>
            </div>
        </>
    );
}

// === Enum Node Properties ===
function EnumNodeProperties({ node, onUpdate, isJjomMode }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean }) {
    const nodeData = node.data as EnumNodeData;
    const [name, setName] = useState(nodeData.label);
    const literals = nodeData.literals || [];

    const [editBuffers, setEditBuffers] = useState<Record<string, string>>({});

    useEffect(() => {
        setName(nodeData.label);
        setEditBuffers({});
    }, [node.id, nodeData.label]);

    const commit = useCallback((updates: Partial<EnumNodeData>) => {
        onUpdate(node.id, { ...nodeData, ...updates });
    }, [node.id, nodeData, onUpdate]);

    const commitName = () => {
        commit({ label: name });
        syncNodeLabel(node.id, name);
    };
    const getEditValue = (id: string, field: string, original: string): string => {
        const key = `${id}:${field}`;
        return key in editBuffers ? editBuffers[key] : original;
    };

    const setEditValue = (id: string, field: string, value: string) => {
        setEditBuffers(prev => ({ ...prev, [`${id}:${field}`]: value }));
    };

    const clearEditBuffer = (id: string, field: string) => {
        setEditBuffers(prev => {
            const next = { ...prev };
            delete next[`${id}:${field}`];
            return next;
        });
    };

    // --- Literals ---
    const addLiteral = () => {
        const nextValue = literals.length > 0 ? Math.max(...literals.map(l => l.value)) + 1 : 0;
        const updated = [...literals, createLiteral('NEW_VALUE', nextValue)];
        commit({ literals: updated });
        syncAddEnumLiteral(node.id);
    };

    const commitLitField = (litId: string, field: string, value: string) => {
        const finalValue = field === 'value' ? (parseInt(value) || 0) : value;
        const updated = literals.map(l =>
            l.id === litId
                ? { ...l, [field]: finalValue }
                : l
        );
        commit({ literals: updated });
        syncUpdateEnumLiteral(litId, field, finalValue, node.id);
        clearEditBuffer(litId, field);
    };

    const removeLiteral = (litId: string) => {
        const updated = literals.filter(l => l.id !== litId);
        commit({ literals: updated });
        syncRemoveEnumLiteral(litId, node.id);
    };

    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-list-ol" />
                <span className="properties-panel__title">Enumeration</span>
                <span className="properties-panel__subtitle">{node.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="General">
                    <div className="prop-field">
                        <label className="prop-label">Name</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section
                    title="Literals"
                    count={literals.length}
                    action={
                        <button
                            className="prop-section-add-btn"
                            onClick={addLiteral}
                            title="Add literal"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {literals.length === 0 && (
                        <div className="prop-empty">Drop literals from palette or click +</div>
                    )}
                    {literals.map((lit) => (
                        <div key={lit.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm prop-input--mono"
                                value={getEditValue(lit.id, 'name', lit.name)}
                                onChange={(e) => setEditValue(lit.id, 'name', e.target.value)}
                                onBlur={(e) => commitLitField(lit.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitLitField(lit.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="NAME"
                            />
                            <button className="prop-remove-btn" onClick={() => removeLiteral(lit.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>

                <Section title="Layout" defaultOpen={false}>
                    <div className="prop-row">
                        <span className="prop-badge">x: {Math.round(node.position.x)}</span>
                        <span className="prop-badge">y: {Math.round(node.position.y)}</span>
                    </div>
                </Section>
            </div>
        </>
    );
}

// === Package Node Properties ===
function PackageNodeProperties({ node, onUpdate, isJjomMode }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean }) {
    const nodeData = node.data as PackageNodeData;
    const [name, setName] = useState(nodeData.label);

    useEffect(() => {
        setName(nodeData.label);
    }, [node.id, nodeData.label]);

    const commitName = () => {
        onUpdate(node.id, { ...nodeData, label: name });
        syncNodeLabel(node.id, name);
    };

    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-folder" />
                <span className="properties-panel__title">Package</span>
                <span className="properties-panel__subtitle">{node.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="General">
                    <div className="prop-field">
                        <label className="prop-label">Name</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section title="Layout" defaultOpen={false}>
                    <div className="prop-row">
                        <span className="prop-badge">x: {Math.round(node.position.x)}</span>
                        <span className="prop-badge">y: {Math.round(node.position.y)}</span>
                    </div>
                    {node.measured && (
                        <div className="prop-row">
                            <span className="prop-badge">w: {Math.round(node.measured.width || 0)}</span>
                            <span className="prop-badge">h: {Math.round(node.measured.height || 0)}</span>
                        </div>
                    )}
                </Section>
            </div>
        </>
    );
}

// === Generic Node Properties (fallback) ===
function GenericNodeProperties({ node, onUpdate }: { node: Node; onUpdate: (id: string, data: any) => void }) {
    const nodeData = node.data as { label?: string };
    const [name, setName] = useState(nodeData.label || '');

    useEffect(() => {
        setName(nodeData.label || '');
    }, [node.id, nodeData.label]);

    const commitName = () => {
        onUpdate(node.id, { ...nodeData, label: name });
    };

    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-box" />
                <span className="properties-panel__title">Node</span>
                <span className="properties-panel__subtitle">{node.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="General">
                    <div className="prop-field">
                        <label className="prop-label">Type</label>
                        <div className="prop-info">{node.type}</div>
                    </div>
                    <div className="prop-field">
                        <label className="prop-label">Label</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>
            </div>
        </>
    );
}

// === Anchor Selector ===
function AnchorSelector({
    label,
    currentSide,
    mode,
    onChange,
}: {
    label: string;
    currentSide: AnchorSide;
    mode: AnchorMode;
    onChange: (side: AnchorSide, mode: AnchorMode) => void;
}) {
    return (
        <div className="anchor-selector">
            <span className="anchor-selector__label">{label}</span>
            <div className="anchor-selector__grid">
                {/* Top */}
                <div className="anchor-selector__cell anchor-selector__cell--top">
                    <button
                        className={`anchor-btn ${currentSide === 'top' ? 'active' : ''}`}
                        onClick={() => onChange('top', 'pinned')}
                        title="Top"
                    >
                        <i className="bi bi-arrow-up" />
                    </button>
                </div>
                {/* Middle row: left, center, right */}
                <div className="anchor-selector__cell anchor-selector__cell--left">
                    <button
                        className={`anchor-btn ${currentSide === 'left' ? 'active' : ''}`}
                        onClick={() => onChange('left', 'pinned')}
                        title="Left"
                    >
                        <i className="bi bi-arrow-left" />
                    </button>
                </div>
                <div className="anchor-selector__cell anchor-selector__cell--center">
                    <span className={`anchor-center ${mode === 'pinned' ? 'pinned' : ''}`}>
                        {mode === 'pinned' ? <i className="bi bi-pin-fill" /> : 'A'}
                    </span>
                </div>
                <div className="anchor-selector__cell anchor-selector__cell--right">
                    <button
                        className={`anchor-btn ${currentSide === 'right' ? 'active' : ''}`}
                        onClick={() => onChange('right', 'pinned')}
                        title="Right"
                    >
                        <i className="bi bi-arrow-right" />
                    </button>
                </div>
                {/* Bottom */}
                <div className="anchor-selector__cell anchor-selector__cell--bottom">
                    <button
                        className={`anchor-btn ${currentSide === 'bottom' ? 'active' : ''}`}
                        onClick={() => onChange('bottom', 'pinned')}
                        title="Bottom"
                    >
                        <i className="bi bi-arrow-down" />
                    </button>
                </div>
            </div>
            <button
                className={`anchor-auto-btn ${mode === 'auto' ? 'active' : ''}`}
                onClick={() => onChange(currentSide, 'auto')}
            >
                Auto
            </button>
        </div>
    );
}

// === Inheritance Edge Properties ===
function InheritanceEdgeProperties({
    edge,
    onEdgeChange,
    onConvertToReference,
}: {
    edge: Edge;
    onEdgeChange: (edgeId: string, data: Partial<Edge>) => void;
    onConvertToReference?: (edgeId: string) => void;
}) {
    const edgeData = edge.data as InheritanceEdgeData | undefined;
    const sourceAnchor: AnchorConfig = edgeData?.sourceAnchor || { mode: 'auto', side: (edge.sourceHandle || 'top') as AnchorSide };
    const targetAnchor: AnchorConfig = edgeData?.targetAnchor || { mode: 'auto', side: (edge.targetHandle || 'bottom') as AnchorSide };

    const handleAnchorChange = useCallback((endpoint: 'source' | 'target', side: AnchorSide, mode: AnchorMode) => {
        const anchorKey = endpoint === 'source' ? 'sourceAnchor' : 'targetAnchor';
        const handleKey = endpoint === 'source' ? 'sourceHandle' : 'targetHandle';
        onEdgeChange(edge.id, {
            [handleKey]: side,
            data: {
                ...edgeData,
                [anchorKey]: { mode, side } as AnchorConfig,
            },
        });
    }, [edge.id, edgeData, onEdgeChange]);
    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-triangle" />
                <span className="properties-panel__title">Inheritance</span>
                <span className="properties-panel__subtitle">{edge.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="Type">
                    <div className="prop-edge-type-selector">
                        <button className="prop-edge-type active" disabled>
                            <i className="bi bi-triangle" />
                            <span>Inheritance</span>
                        </button>
                        <button
                            className="prop-edge-type"
                            onClick={() => onConvertToReference?.(edge.id)}
                        >
                            <i className="bi bi-arrow-right" />
                            <span>Reference</span>
                        </button>
                    </div>
                </Section>

                <Section title="Connection">
                    <div className="prop-field">
                        <label className="prop-label">Child (subclass)</label>
                        <span className="prop-badge" style={{ width: '100%' }}>{edge.source}</span>
                    </div>
                    <div className="prop-field">
                        <label className="prop-label">Parent (superclass)</label>
                        <span className="prop-badge" style={{ width: '100%' }}>{edge.target}</span>
                    </div>
                </Section>

                <Section title="Semantics" defaultOpen={false}>
                    <div className="prop-info">
                        The child class inherits all attributes, operations, and references from the parent class.
                    </div>
                </Section>

                <Section title="Anchors" defaultOpen={false}>
                    <div className="prop-anchors-row">
                        <AnchorSelector
                            label="Source"
                            currentSide={sourceAnchor.side}
                            mode={sourceAnchor.mode}
                            onChange={(side, mode) => handleAnchorChange('source', side, mode)}
                        />
                        <AnchorSelector
                            label="Target"
                            currentSide={targetAnchor.side}
                            mode={targetAnchor.mode}
                            onChange={(side, mode) => handleAnchorChange('target', side, mode)}
                        />
                    </div>
                </Section>
            </div>
        </>
    );
}

// === Reference Edge Properties ===
function ReferenceEdgeProperties({
    edge,
    onUpdate,
    onConvertToInheritance,
    isJjomMode,
}: {
    edge: Edge;
    onUpdate: (id: string, data: Partial<Edge>) => void;
    onConvertToInheritance?: (edgeId: string) => void;
    isJjomMode?: boolean;
}) {
    const edgeData = edge.data as ReferenceEdgeData | undefined;
    const ref = edgeData?.reference;

    const [name, setName] = useState(ref?.name || String(edge.label || ''));
    const [kind, setKind] = useState<ReferenceKind>(ref?.kind || 'association');
    const [lowerBound, setLowerBound] = useState(ref?.lowerBound ?? 0);
    const [upperBound, setUpperBound] = useState(ref?.upperBound ?? -1);

    useEffect(() => {
        setName(ref?.name || String(edge.label || ''));
        setKind(ref?.kind || 'association');
        setLowerBound(ref?.lowerBound ?? 0);
        setUpperBound(ref?.upperBound ?? -1);
    }, [edge.id, ref]);

    const commitRF = useCallback(() => {
        const updatedRef: MetaReference = {
            id: ref?.id || edge.id,
            name,
            kind,
            targetClassId: edge.target,
            lowerBound,
            upperBound,
            containment: kind === 'composition',
        };
        onUpdate(edge.id, {
            label: name,
            data: { ...edgeData, reference: updatedRef } as ReferenceEdgeData,
        });
    }, [name, kind, lowerBound, upperBound, edge.id, edge.target, ref, edgeData, onUpdate]);

    const commitName = () => {
        commitRF();
        const refId = getEdgeRefId(edge.id) ?? ref?.id;
        if (refId && refId !== edge.id) syncUpdateReference(refId, 'name', name);
    };

    const handleKindChange = (newKind: ReferenceKind) => {
        setKind(newKind);
        const updatedRef: MetaReference = {
            id: ref?.id || edge.id,
            name,
            kind: newKind,
            targetClassId: edge.target,
            lowerBound,
            upperBound,
            containment: newKind === 'composition',
        };
        onUpdate(edge.id, {
            label: name,
            data: { ...edgeData, reference: updatedRef } as ReferenceEdgeData,
        });
        syncEdgeRefKind(edge.id, newKind);
    };

    const commitLowerBound = () => {
        commitRF();
        const refId = getEdgeRefId(edge.id) ?? ref?.id;
        if (refId && refId !== edge.id) syncUpdateReference(refId, 'lowerBound', lowerBound);
    };

    const commitUpperBound = () => {
        commitRF();
        const refId = getEdgeRefId(edge.id) ?? ref?.id;
        if (refId && refId !== edge.id) syncUpdateReference(refId, 'upperBound', upperBound);
    };

    const sourceAnchor: AnchorConfig = edgeData?.sourceAnchor || { mode: 'auto', side: (edge.sourceHandle || 'right') as AnchorSide };
    const targetAnchor: AnchorConfig = edgeData?.targetAnchor || { mode: 'auto', side: (edge.targetHandle || 'left') as AnchorSide };

    const handleAnchorChange = useCallback((endpoint: 'source' | 'target', side: AnchorSide, mode: AnchorMode) => {
        const anchorKey = endpoint === 'source' ? 'sourceAnchor' : 'targetAnchor';
        const handleKey = endpoint === 'source' ? 'sourceHandle' : 'targetHandle';
        onUpdate(edge.id, {
            [handleKey]: side,
            data: {
                ...edgeData,
                [anchorKey]: { mode, side } as AnchorConfig,
            },
        });
    }, [edge.id, edgeData, onUpdate]);

    return (
        <>
            <div className="properties-panel__header">
                <i className="bi bi-arrow-right" />
                <span className="properties-panel__title">Reference</span>
                <span className="properties-panel__subtitle">{edge.id}</span>
            </div>

            <div className="properties-panel__scroll">
                <Section title="Type">
                    <div className="prop-edge-type-selector">
                        <button
                            className="prop-edge-type"
                            onClick={() => onConvertToInheritance?.(edge.id)}
                        >
                            <i className="bi bi-triangle" />
                            <span>Inheritance</span>
                        </button>
                        <button className="prop-edge-type active" disabled>
                            <i className="bi bi-arrow-right" />
                            <span>Reference</span>
                        </button>
                    </div>
                </Section>

                <Section title="General">
                    <div className="prop-field">
                        <label className="prop-label">Name</label>
                        <input
                            className="prop-input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section title="Kind">
                    <div className="prop-kind-selector">
                        {(['association', 'composition', 'aggregation'] as ReferenceKind[]).map(k => (
                            <button
                                key={k}
                                className={`prop-kind-option ${kind === k ? 'active' : ''}`}
                                onClick={() => handleKindChange(k)}
                            >
                                <span className="prop-kind-option__icon">
                                    {k === 'composition' ? '\u25C6' : k === 'aggregation' ? '\u25C7' : '\u2192'}
                                </span>
                                <span className="prop-kind-option__label">{k.slice(0, 5)}</span>
                            </button>
                        ))}
                    </div>
                </Section>

                <Section title="Cardinality">
                    <div className="prop-cardinality">
                        <div className="prop-cardinality__inputs">
                            <input
                                className="prop-input prop-input--xs"
                                type="number"
                                min="0"
                                value={lowerBound}
                                onChange={(e) => setLowerBound(parseInt(e.target.value) || 0)}
                                onBlur={commitLowerBound}
                            />
                            <span className="prop-cardinality__dot">..</span>
                            <input
                                className="prop-input prop-input--xs"
                                type="number"
                                min="-1"
                                value={upperBound}
                                onChange={(e) => setUpperBound(parseInt(e.target.value) || -1)}
                                onBlur={commitUpperBound}
                            />
                        </div>
                        <span className="prop-cardinality__preview">
                            {formatCardinality(lowerBound, upperBound)}
                        </span>
                    </div>
                    <div className="prop-hint">Use -1 for unbounded (*)</div>
                </Section>

                <Section title="Connection" defaultOpen={false}>
                    <div className="prop-row">
                        <span className="prop-badge">source: {edge.source}</span>
                    </div>
                    <div className="prop-row">
                        <span className="prop-badge">target: {edge.target}</span>
                    </div>
                </Section>

                <Section title="Anchors" defaultOpen={false}>
                    <div className="prop-anchors-row">
                        <AnchorSelector
                            label="Source"
                            currentSide={sourceAnchor.side}
                            mode={sourceAnchor.mode}
                            onChange={(side, mode) => handleAnchorChange('source', side, mode)}
                        />
                        <AnchorSelector
                            label="Target"
                            currentSide={targetAnchor.side}
                            mode={targetAnchor.mode}
                            onChange={(side, mode) => handleAnchorChange('target', side, mode)}
                        />
                    </div>
                </Section>
            </div>
        </>
    );
}

export type { ModelInfo };
export default PropertiesPanel;

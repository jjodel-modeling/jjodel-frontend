import { useCallback, useState, useEffect, useMemo } from 'react';
import { Badge } from '../../common/Badge';
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
    onDeleteNode?: (nodeId: string) => void;
    onDuplicateNode?: (nodeId: string) => void;
    onDeleteEdge?: (edgeId: string) => void;
    isJjomMode?: boolean;
    modelInfo?: ModelInfo | null;
    onModelNameChange?: (name: string) => void;
    onModelUriChange?: (uri: string) => void;
}

// Icon mapping for element types
const ELEMENT_ICONS: Record<string, string> = {
    metamodel: 'bi-diagram-3',
    class: 'bi-box',
    attribute: 'bi-list-ul',
    reference: 'bi-link-45deg',
    operation: 'bi-gear',
    enum: 'bi-list-ol',
    literal: 'bi-hash',
    package: 'bi-folder',
    inheritance: 'bi-triangle',
    node: 'bi-box',
    model: 'bi-box',
};

// Styled header for the properties panel
function PanelHeader({ icon, name, badgeLabel }: { icon: string; name: string; badgeLabel: string }) {
    return (
        <div className="jj-properties__header">
            <div className="jj-properties__icon-box">
                <i className={`bi ${icon}`} />
            </div>
            <span className="jj-properties__name">{name}</span>
            <Badge category="type">{badgeLabel}</Badge>
        </div>
    );
}

// Action buttons at bottom of panel
function PanelActions({ onDuplicate, onDelete }: { onDuplicate?: () => void; onDelete?: () => void }) {
    if (!onDuplicate && !onDelete) return null;
    return (
        <div className="jj-properties__actions">
            <div className="jj-properties__action-buttons">
                {onDuplicate && (
                    <button className="jj-btn jj-btn--secondary jj-btn--sm" onClick={onDuplicate}>
                        <i className="bi bi-copy" /> Duplicate
                    </button>
                )}
                {onDelete && (
                    <button className="jj-btn jj-btn--danger jj-btn--sm" onClick={onDelete}>
                        <i className="bi bi-trash" /> Delete
                    </button>
                )}
            </div>
            <span className="jj-properties__hint">Right-click for more actions</span>
        </div>
    );
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
        <div className="jj-properties__section">
            <div
                className={`jj-properties__section-header ${!open ? 'jj-properties__section-header--collapsed' : ''}`}
                onClick={() => setOpen(!open)}
            >
                <span className="jj-properties__section-title">{title}</span>
                {count !== undefined && <span className="jj-properties__section-count">{count}</span>}
                {action && (
                    <div className="jj-properties__section-actions" onClick={(e) => e.stopPropagation()}>
                        {action}
                    </div>
                )}
                <i className={`bi bi-chevron-right jj-properties__section-chevron ${open ? 'jj-properties__section-chevron--open' : ''}`} />
            </div>
            {open && <div className="jj-properties__section-body">{children}</div>}
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
        <aside className="jj-properties">
            <PanelHeader icon={typeIcon} name={modelInfo.name || typeLabel} badgeLabel={typeLabel.toUpperCase()} />

            <div className="jj-properties__body">
                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Name</label>
                        <input
                            className="jj-properties__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => { if (e.key === 'Enter') commitName(); }}
                        />
                    </div>
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">URI</label>
                        <input
                            className="jj-properties__input"
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
    onDeleteNode,
    onDuplicateNode,
    onDeleteEdge,
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
            <aside className="jj-properties">
                <div className="jj-properties__header">
                    <div className="jj-properties__icon-box">
                        <i className="bi bi-sliders" />
                    </div>
                    <span className="jj-properties__name">Properties</span>
                </div>
                <div className="jj-properties__empty">
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
            <aside className="jj-properties">
                <div className="jj-properties__header">
                    <div className="jj-properties__icon-box">
                        <i className="bi bi-collection" />
                    </div>
                    <span className="jj-properties__name">Selection</span>
                </div>
                <div className="jj-properties__empty">
                    <i className="bi bi-collection" />
                    <span>{count} items selected</span>
                </div>
            </aside>
        );
    }

    // Single node selected - route by type
    if (selectedNode) {
        const nodeActions = {
            onDelete: onDeleteNode ? () => onDeleteNode(selectedNode.id) : undefined,
            onDuplicate: onDuplicateNode ? () => onDuplicateNode(selectedNode.id) : undefined,
        };

        switch (selectedNode.type) {
            case 'classNode':
                return (
                    <aside className="jj-properties">
                        <ClassNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} {...nodeActions} />
                    </aside>
                );
            case 'enumNode':
                return (
                    <aside className="jj-properties">
                        <EnumNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} {...nodeActions} />
                    </aside>
                );
            case 'packageNode':
                return (
                    <aside className="jj-properties">
                        <PackageNodeProperties node={selectedNode} onUpdate={onNodeChange} isJjomMode={isJjomMode} {...nodeActions} />
                    </aside>
                );
            case 'objectNode':
                return (
                    <aside className="jj-properties">
                        <M1PropertiesPanel selectedNode={selectedNode as any} onNodeChange={onNodeChange} />
                    </aside>
                );
            default:
                return (
                    <aside className="jj-properties">
                        <GenericNodeProperties node={selectedNode} onUpdate={onNodeChange} />
                    </aside>
                );
        }
    }

    // Single edge selected
    if (selectedEdge) {
        const edgeActions = {
            onDelete: onDeleteEdge ? () => onDeleteEdge(selectedEdge.id) : undefined,
        };

        if (selectedEdge.type === 'inheritance') {
            return (
                <aside className="jj-properties">
                    <InheritanceEdgeProperties
                        edge={selectedEdge}
                        onEdgeChange={onEdgeChange}
                        onConvertToReference={onConvertToReference}
                        {...edgeActions}
                    />
                </aside>
            );
        }
        return (
            <aside className="jj-properties">
                <ReferenceEdgeProperties
                    edge={selectedEdge}
                    onUpdate={onEdgeChange}
                    onConvertToInheritance={onConvertToInheritance}
                    isJjomMode={isJjomMode}
                    {...edgeActions}
                />
            </aside>
        );
    }

    return null;
}

// === Class Node Properties ===
function ClassNodeProperties({ node, onUpdate, isJjomMode, onDelete, onDuplicate }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean; onDelete?: () => void; onDuplicate?: () => void }) {
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
            <PanelHeader icon={ELEMENT_ICONS.class} name={name} badgeLabel="CLASS" />

            <div className="jj-properties__scroll">
                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Name</label>
                        <input
                            className="jj-properties__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section title="INHERITANCE">
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={isAbstract}
                            onChange={(e) => toggleAbstract(e.target.checked)}
                        />
                        <span className="jj-properties__label">Abstract</span>
                    </label>
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).isInterface}
                            onChange={(e) => commit({ isInterface: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Interface</span>
                    </label>
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).allowCrossExtend}
                            onChange={(e) => commit({ allowCrossExtend: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Allow cross-extend</span>
                    </label>
                </Section>

                <Section title="FLAGS">
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).isFinal}
                            onChange={(e) => commit({ isFinal: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Final</span>
                    </label>
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).isSingleton}
                            onChange={(e) => commit({ isSingleton: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Singleton</span>
                    </label>
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).isRootable}
                            onChange={(e) => commit({ isRootable: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Rootable</span>
                    </label>
                    <label className="jj-properties__field jj-properties__field--row">
                        <input
                            type="checkbox"
                            className="jj-checkbox"
                            checked={!!(nodeData as any).isPartial}
                            onChange={(e) => commit({ isPartial: e.target.checked } as any)}
                        />
                        <span className="jj-properties__label">Partial</span>
                    </label>
                </Section>

                <Section
                    title="ATTRIBUTES"
                    count={attributes.length}
                    action={
                        <button
                            className="jj-properties__add-btn"
                            onClick={addAttribute}
                            title="Add attribute"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {attributes.length === 0 && (
                        <div className="jj-properties__empty">Drop attributes from palette or click +</div>
                    )}
                    {attributes.map((attr) => (
                        <div key={attr.id} className="jj-properties__list-item">
                            <input
                                className="jj-properties__input jj-properties__input--sm"
                                value={getEditValue(attr.id, 'name', attr.name)}
                                onChange={(e) => setEditValue(attr.id, 'name', e.target.value)}
                                onBlur={(e) => commitAttrField(attr.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitAttrField(attr.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="name"
                            />
                            <select
                                className="jj-properties__select"
                                value={attr.type}
                                onChange={(e) => handleAttrTypeChange(attr.id, e.target.value)}
                            >
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="jj-properties__remove-btn" onClick={() => removeAttribute(attr.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>

                <Section
                    title="REFERENCES"
                    count={references.length}
                    action={
                        !isJjomMode ? (
                            <button
                                className="jj-properties__add-btn"
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
                                <div className="jj-properties__empty">Draw reference edges between classes</div>
                            )}
                            {references.map((ref) => (
                                <div key={ref.id} className="jj-properties__list-item jj-properties__list-item--readonly">
                                    <span className="jj-properties__info">{ref.name}</span>
                                    <span className="jj-properties__info jj-properties__info--type">{'\u2192'} {ref.type?.name ?? '?'}</span>
                                </div>
                            ))}
                        </>
                    ) : (
                        <>
                            {references.length === 0 && (
                                <div className="jj-properties__empty">Click + to add a reference</div>
                            )}
                            {references.map((ref, i) => (
                                <div key={ref.id} className="jj-properties__list-item">
                                    <input
                                        className="jj-properties__input jj-properties__input--sm"
                                        value={ref.name}
                                        onChange={(e) => updateReference(i, 'name', e.target.value)}
                                        placeholder="refName"
                                    />
                                    <select
                                        className="jj-properties__select"
                                        value={ref.targetClassId}
                                        onChange={(e) => updateReference(i, 'targetClassId', e.target.value)}
                                    >
                                        <option value="">-- target --</option>
                                        {availableClasses.map(cls => (
                                            <option key={cls.id} value={cls.id}>{cls.name}</option>
                                        ))}
                                    </select>
                                    <button className="jj-properties__remove-btn" onClick={() => removeReference(i)} title="Remove">
                                        <i className="bi bi-x" />
                                    </button>
                                </div>
                            ))}
                        </>
                    )}
                </Section>

                <Section
                    title="OPERATIONS"
                    count={operations.length}
                    action={
                        <button
                            className="jj-properties__add-btn"
                            onClick={addOperation}
                            title="Add operation"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {operations.length === 0 && (
                        <div className="jj-properties__empty">Drop operations from palette or click +</div>
                    )}
                    {operations.map((op) => (
                        <div key={op.id} className="jj-properties__list-item">
                            <input
                                className="jj-properties__input jj-properties__input--sm"
                                value={getEditValue(op.id, 'name', op.name)}
                                onChange={(e) => setEditValue(op.id, 'name', e.target.value)}
                                onBlur={(e) => commitOpField(op.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitOpField(op.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="name"
                            />
                            <select
                                className="jj-properties__select"
                                value={op.returnType}
                                onChange={(e) => handleOpReturnTypeChange(op.id, e.target.value)}
                            >
                                <option value="void">void</option>
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="jj-properties__remove-btn" onClick={() => removeOperation(op.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>
            </div>

            <PanelActions onDuplicate={onDuplicate} onDelete={onDelete} />
        </>
    );
}

// === Enum Node Properties ===
function EnumNodeProperties({ node, onUpdate, isJjomMode, onDelete, onDuplicate }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean; onDelete?: () => void; onDuplicate?: () => void }) {
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
            <PanelHeader icon={ELEMENT_ICONS.enum} name={name} badgeLabel="ENUM" />

            <div className="jj-properties__scroll">
                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Name</label>
                        <input
                            className="jj-properties__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section
                    title="LITERALS"
                    count={literals.length}
                    action={
                        <button
                            className="jj-properties__add-btn"
                            onClick={addLiteral}
                            title="Add literal"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
                    {literals.length === 0 && (
                        <div className="jj-properties__empty">Drop literals from palette or click +</div>
                    )}
                    {literals.map((lit) => (
                        <div key={lit.id} className="jj-properties__list-item">
                            <input
                                className="jj-properties__input jj-properties__input--sm jj-properties__input--mono"
                                value={getEditValue(lit.id, 'name', lit.name)}
                                onChange={(e) => setEditValue(lit.id, 'name', e.target.value)}
                                onBlur={(e) => commitLitField(lit.id, 'name', e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && commitLitField(lit.id, 'name', (e.target as HTMLInputElement).value)}
                                placeholder="NAME"
                            />
                            <button className="jj-properties__remove-btn" onClick={() => removeLiteral(lit.id)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>
            </div>

            <PanelActions onDuplicate={onDuplicate} onDelete={onDelete} />
        </>
    );
}

// === Package Node Properties ===
function PackageNodeProperties({ node, onUpdate, isJjomMode, onDelete, onDuplicate }: { node: Node; onUpdate: (id: string, data: any) => void; isJjomMode?: boolean; onDelete?: () => void; onDuplicate?: () => void }) {
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
            <PanelHeader icon={ELEMENT_ICONS.package} name={name} badgeLabel="PACKAGE" />

            <div className="jj-properties__scroll">
                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Name</label>
                        <input
                            className="jj-properties__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>
            </div>

            <PanelActions onDuplicate={onDuplicate} onDelete={onDelete} />
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
            <PanelHeader icon={ELEMENT_ICONS.node} name={name || 'Node'} badgeLabel="NODE" />

            <div className="jj-properties__scroll">
                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Type</label>
                        <div className="jj-properties__info">{node.type}</div>
                    </div>
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Label</label>
                        <input
                            className="jj-properties__input"
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
    onDelete,
}: {
    edge: Edge;
    onEdgeChange: (edgeId: string, data: Partial<Edge>) => void;
    onConvertToReference?: (edgeId: string) => void;
    onDelete?: () => void;
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
            <PanelHeader icon={ELEMENT_ICONS.inheritance} name="Inheritance" badgeLabel="INHERITANCE" />

            <div className="jj-properties__scroll">
                <Section title="TYPE">
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

                <Section title="CONNECTION">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Child (subclass)</label>
                        <span className="prop-badge" style={{ width: '100%' }}>{edge.source}</span>
                    </div>
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Parent (superclass)</label>
                        <span className="prop-badge" style={{ width: '100%' }}>{edge.target}</span>
                    </div>
                </Section>

                <Section title="ANCHORS" defaultOpen={false}>
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

            <PanelActions onDelete={onDelete} />
        </>
    );
}

// === Reference Edge Properties ===
function ReferenceEdgeProperties({
    edge,
    onUpdate,
    onConvertToInheritance,
    isJjomMode,
    onDelete,
}: {
    edge: Edge;
    onUpdate: (id: string, data: Partial<Edge>) => void;
    onConvertToInheritance?: (edgeId: string) => void;
    isJjomMode?: boolean;
    onDelete?: () => void;
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
            <PanelHeader icon={ELEMENT_ICONS.reference} name={name || 'Reference'} badgeLabel="REFERENCE" />

            <div className="jj-properties__scroll">
                <Section title="TYPE">
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

                <Section title="GENERAL">
                    <div className="jj-properties__field">
                        <label className="jj-properties__label">Name</label>
                        <input
                            className="jj-properties__input"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={commitName}
                            onKeyDown={(e) => e.key === 'Enter' && commitName()}
                        />
                    </div>
                </Section>

                <Section title="KIND">
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

                <Section title="CARDINALITY">
                    <div className="prop-cardinality">
                        <div className="prop-cardinality__inputs">
                            <input
                                className="jj-properties__input jj-properties__input--xs"
                                type="number"
                                min="0"
                                value={lowerBound}
                                onChange={(e) => setLowerBound(parseInt(e.target.value) || 0)}
                                onBlur={commitLowerBound}
                            />
                            <span className="prop-cardinality__dot">..</span>
                            <input
                                className="jj-properties__input jj-properties__input--xs"
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
                    <div className="jj-properties__hint">Use -1 for unbounded (*)</div>
                </Section>

                <Section title="CONNECTION" defaultOpen={false}>
                    <div className="prop-row">
                        <span className="prop-badge">source: {edge.source}</span>
                    </div>
                    <div className="prop-row">
                        <span className="prop-badge">target: {edge.target}</span>
                    </div>
                </Section>

                <Section title="ANCHORS" defaultOpen={false}>
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

            <PanelActions onDelete={onDelete} />
        </>
    );
}

export type { ModelInfo };
export default PropertiesPanel;

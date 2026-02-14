import { useCallback, useState, useEffect, useMemo } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { useNodes } from '@xyflow/react';
import type {
    ClassNodeData,
    EnumNodeData,
    PackageNodeData,
    ReferenceEdgeData,
    MetaAttribute,
    MetaLiteral,
    MetaReference,
    MetaOperation,
    ReferenceKind,
} from '../types';
import { createAttribute, createLiteral, createReference, createOperation, formatCardinality, E_DATA_TYPES } from '../types';

interface PropertiesPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onNodeChange: (nodeId: string, data: any) => void;
    onEdgeChange: (edgeId: string, data: Partial<Edge>) => void;
    onConvertToInheritance?: (edgeId: string) => void;
    onConvertToReference?: (edgeId: string) => void;
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

function PropertiesPanel({
    selectedNodes,
    selectedEdges,
    onNodeChange,
    onEdgeChange,
    onConvertToInheritance,
    onConvertToReference,
}: PropertiesPanelProps) {
    const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;
    const selectedEdge = selectedEdges.length === 1 && selectedNodes.length === 0 ? selectedEdges[0] : null;

    // Nothing selected
    if (!selectedNode && !selectedEdge && selectedNodes.length === 0 && selectedEdges.length === 0) {
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
                        <ClassNodeProperties node={selectedNode} onUpdate={onNodeChange} />
                    </aside>
                );
            case 'enumNode':
                return (
                    <aside className="properties-panel">
                        <EnumNodeProperties node={selectedNode} onUpdate={onNodeChange} />
                    </aside>
                );
            case 'packageNode':
                return (
                    <aside className="properties-panel">
                        <PackageNodeProperties node={selectedNode} onUpdate={onNodeChange} />
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
                />
            </aside>
        );
    }

    return null;
}

// === Class Node Properties ===
function ClassNodeProperties({ node, onUpdate }: { node: Node; onUpdate: (id: string, data: any) => void }) {
    const nodeData = node.data as ClassNodeData;
    const [name, setName] = useState(nodeData.label);
    const [isAbstract, setIsAbstract] = useState(nodeData.isAbstract ?? false);
    const [attributes, setAttributes] = useState<MetaAttribute[]>(nodeData.attributes || []);
    const [references, setReferences] = useState<MetaReference[]>(nodeData.references || []);
    const [operations, setOperations] = useState<MetaOperation[]>(nodeData.operations || []);

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
        setIsAbstract(nodeData.isAbstract ?? false);
        setAttributes(nodeData.attributes || []);
        setReferences(nodeData.references || []);
        setOperations(nodeData.operations || []);
    }, [node.id, nodeData.label, nodeData.isAbstract, nodeData.attributes, nodeData.references, nodeData.operations]);

    const commit = useCallback((updates: Partial<ClassNodeData>) => {
        onUpdate(node.id, { ...nodeData, ...updates });
    }, [node.id, nodeData, onUpdate]);

    const commitName = () => commit({ label: name });

    const toggleAbstract = (checked: boolean) => {
        setIsAbstract(checked);
        commit({ isAbstract: checked });
    };

    // Attribute handlers
    const addAttribute = () => {
        const updated = [...attributes, createAttribute()];
        setAttributes(updated);
        commit({ attributes: updated });
    };

    const updateAttribute = (index: number, field: keyof MetaAttribute, val: string | number) => {
        const updated = attributes.map((attr, i) =>
            i === index ? { ...attr, [field]: val } : attr
        );
        setAttributes(updated);
        commit({ attributes: updated });
    };

    const removeAttribute = (index: number) => {
        const updated = attributes.filter((_, i) => i !== index);
        setAttributes(updated);
        commit({ attributes: updated });
    };

    // Reference handlers
    const addReference = () => {
        const updated = [...references, createReference()];
        setReferences(updated);
        commit({ references: updated });
    };

    const updateReference = (index: number, field: keyof MetaReference, val: string | number | boolean) => {
        const updated = references.map((ref, i) =>
            i === index ? { ...ref, [field]: val } : ref
        );
        setReferences(updated);
        commit({ references: updated });
    };

    const removeReference = (index: number) => {
        const updated = references.filter((_, i) => i !== index);
        setReferences(updated);
        commit({ references: updated });
    };

    // Operation handlers
    const addOperation = () => {
        const updated = [...operations, createOperation()];
        setOperations(updated);
        commit({ operations: updated });
    };

    const updateOperation = (index: number, field: keyof MetaOperation, val: string) => {
        const updated = operations.map((op, i) =>
            i === index ? { ...op, [field]: val } : op
        );
        setOperations(updated);
        commit({ operations: updated });
    };

    const removeOperation = (index: number) => {
        const updated = operations.filter((_, i) => i !== index);
        setOperations(updated);
        commit({ operations: updated });
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
                    {attributes.map((attr, i) => (
                        <div key={attr.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm"
                                value={attr.name}
                                onChange={(e) => updateAttribute(i, 'name', e.target.value)}
                                placeholder="name"
                            />
                            <select
                                className="prop-select"
                                value={attr.type}
                                onChange={(e) => updateAttribute(i, 'type', e.target.value)}
                            >
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="prop-remove-btn" onClick={() => removeAttribute(i)} title="Remove">
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))}
                </Section>

                <Section
                    title="References"
                    count={references.length}
                    action={
                        <button
                            className="prop-section-add-btn"
                            onClick={addReference}
                            title="Add reference"
                        >
                            <i className="bi bi-plus" />
                        </button>
                    }
                >
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
                    {operations.map((op, i) => (
                        <div key={op.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm"
                                value={op.name}
                                onChange={(e) => updateOperation(i, 'name', e.target.value)}
                                placeholder="name"
                            />
                            <select
                                className="prop-select"
                                value={op.returnType}
                                onChange={(e) => updateOperation(i, 'returnType', e.target.value)}
                            >
                                <option value="void">void</option>
                                {E_DATA_TYPES.map(t => (
                                    <option key={t} value={t}>{t}</option>
                                ))}
                            </select>
                            <button className="prop-remove-btn" onClick={() => removeOperation(i)} title="Remove">
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
function EnumNodeProperties({ node, onUpdate }: { node: Node; onUpdate: (id: string, data: any) => void }) {
    const nodeData = node.data as EnumNodeData;
    const [name, setName] = useState(nodeData.label);
    const [literals, setLiterals] = useState<MetaLiteral[]>(nodeData.literals || []);

    useEffect(() => {
        setName(nodeData.label);
        setLiterals(nodeData.literals || []);
    }, [node.id, nodeData.label, nodeData.literals]);

    const commit = useCallback((updates: Partial<EnumNodeData>) => {
        onUpdate(node.id, { ...nodeData, ...updates });
    }, [node.id, nodeData, onUpdate]);

    const commitName = () => commit({ label: name });

    const addLiteral = () => {
        const nextValue = literals.length > 0 ? Math.max(...literals.map(l => l.value)) + 1 : 0;
        const updated = [...literals, createLiteral('NEW_VALUE', nextValue)];
        setLiterals(updated);
        commit({ literals: updated });
    };

    const updateLiteral = (index: number, field: 'name' | 'value', val: string) => {
        const updated = literals.map((lit, i) =>
            i === index
                ? { ...lit, [field]: field === 'value' ? parseInt(val) || 0 : val }
                : lit
        );
        setLiterals(updated);
        commit({ literals: updated });
    };

    const removeLiteral = (index: number) => {
        const updated = literals.filter((_, i) => i !== index);
        setLiterals(updated);
        commit({ literals: updated });
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
                    {literals.map((lit, i) => (
                        <div key={lit.id} className="prop-list-item">
                            <input
                                className="prop-input prop-input--sm prop-input--mono"
                                value={lit.name}
                                onChange={(e) => updateLiteral(i, 'name', e.target.value)}
                                placeholder="NAME"
                            />
                            <button className="prop-remove-btn" onClick={() => removeLiteral(i)} title="Remove">
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
function PackageNodeProperties({ node, onUpdate }: { node: Node; onUpdate: (id: string, data: any) => void }) {
    const nodeData = node.data as PackageNodeData;
    const [name, setName] = useState(nodeData.label);

    useEffect(() => {
        setName(nodeData.label);
    }, [node.id, nodeData.label]);

    const commitName = () => {
        onUpdate(node.id, { ...nodeData, label: name });
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

// === Inheritance Edge Properties ===
function InheritanceEdgeProperties({
    edge,
    onConvertToReference,
}: {
    edge: Edge;
    onConvertToReference?: (edgeId: string) => void;
}) {
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
            </div>
        </>
    );
}

// === Reference Edge Properties ===
function ReferenceEdgeProperties({
    edge,
    onUpdate,
    onConvertToInheritance,
}: {
    edge: Edge;
    onUpdate: (id: string, data: Partial<Edge>) => void;
    onConvertToInheritance?: (edgeId: string) => void;
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

    const commit = useCallback(() => {
        const updatedRef: MetaReference = {
            id: ref?.id || edge.id,
            name,
            kind,
            targetClassId: edge.target,
            lowerBound,
            upperBound,
            containment: kind === 'composition',
        };

        // Preserve existing data (like waypoints) while updating reference
        onUpdate(edge.id, {
            label: name,
            data: { ...edgeData, reference: updatedRef } as ReferenceEdgeData,
        });
    }, [name, kind, lowerBound, upperBound, edge.id, edge.target, ref, edgeData, onUpdate]);

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
        // Preserve existing data (like waypoints) while updating reference
        onUpdate(edge.id, {
            label: name,
            data: { ...edgeData, reference: updatedRef } as ReferenceEdgeData,
        });
    };

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
                            onBlur={commit}
                            onKeyDown={(e) => e.key === 'Enter' && commit()}
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
                                    {k === 'composition' ? '◆' : k === 'aggregation' ? '◇' : '→'}
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
                                onBlur={commit}
                            />
                            <span className="prop-cardinality__dot">..</span>
                            <input
                                className="prop-input prop-input--xs"
                                type="number"
                                min="-1"
                                value={upperBound}
                                onChange={(e) => setUpperBound(parseInt(e.target.value) || -1)}
                                onBlur={commit}
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
            </div>
        </>
    );
}

export default PropertiesPanel;

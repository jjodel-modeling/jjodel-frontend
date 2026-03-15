/**
 * Editor V3 — PropertiesPanel: property editing for selected nodes and edges.
 *
 * Routes by selection type:
 * - No selection → model info
 * - Single class → name, abstract, attributes, operations
 * - Single enum → name, literals
 * - Single package → name
 * - Single edge → label, cardinality, reference properties
 * - Multi-selection → count summary
 */

import React, { useCallback, useState, useEffect, memo } from 'react';
import { EmptyState as JjEmptyState } from '../../ui/EmptyState';
import type { Node, Edge } from '@xyflow/react';
import type {
    ModelNodeData,
    UnifiedEdgeData,
    ClassSnapshot,
    EnumSnapshot,
    PackageSnapshot,
    ObjectSnapshot,
    FeatureValueInfo,
    AttributeInfo,
    OperationInfo,
    LiteralInfo,
    E_DATA_TYPES,
} from '../types';
import { formatCardinality } from '../types';
import {
    syncNodeLabel,
    syncClassAbstract,
    syncAddAttribute,
    syncUpdateAttribute,
    syncRemoveAttribute,
    syncAddOperation,
    syncUpdateOperation,
    syncRemoveOperation,
    syncAddLiteral,
    syncUpdateLiteral,
    syncRemoveLiteral,
    syncUpdateReference,
    syncDeleteVertex,
    syncDeleteEdge,
    syncFeatureValue,
} from '../sync/canvasToJjomV3';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PropertiesPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
}

// ---------------------------------------------------------------------------
// Collapsible Section
// ---------------------------------------------------------------------------

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
        <div className={`v3-props-section ${open ? '' : 'v3-props-section--collapsed'}`}>
            <div className="v3-props-section__header" onClick={() => setOpen(o => !o)}>
                <i className={`bi ${open ? 'bi-chevron-down' : 'bi-chevron-right'} v3-props-section__chevron`} />
                <span className="v3-props-section__title">{title}</span>
                {count !== undefined && (
                    <span className="v3-props-section__count">{count}</span>
                )}
                {action && (
                    <span
                        className="v3-props-section__action"
                        onClick={e => e.stopPropagation()}
                    >
                        {action}
                    </span>
                )}
            </div>
            {open && (
                <div className="v3-props-section__body">
                    {children}
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Editable Field
// ---------------------------------------------------------------------------

function EditableField({
    label,
    value,
    onChange,
    type = 'text',
    placeholder,
    options,
}: {
    label: string;
    value: string | number | boolean;
    onChange: (val: string) => void;
    type?: 'text' | 'checkbox' | 'select' | 'number';
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
}) {
    if (type === 'checkbox') {
        return (
            <label className="v3-props-field v3-props-field--checkbox">
                <input
                    type="checkbox"
                    checked={!!value}
                    onChange={e => onChange(String(e.target.checked))}
                />
                <span>{label}</span>
            </label>
        );
    }

    if (type === 'select' && options) {
        return (
            <div className="v3-props-field">
                <span className="v3-props-field__label">{label}</span>
                <select
                    className="v3-props-field__input"
                    value={String(value)}
                    onChange={e => onChange(e.target.value)}
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>
        );
    }

    return (
        <div className="v3-props-field">
            <span className="v3-props-field__label">{label}</span>
            <input
                className="v3-props-field__input"
                type={type}
                value={String(value)}
                placeholder={placeholder}
                onChange={e => onChange(e.target.value)}
                onMouseDown={e => e.stopPropagation()}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Class Properties
// ---------------------------------------------------------------------------

function ClassProperties({ node }: { node: Node }) {
    const data = node.data as unknown as ModelNodeData;
    const snapshot = data.modelSnapshot as ClassSnapshot;

    const handleNameChange = useCallback((val: string) => {
        syncNodeLabel(node.id, val);
    }, [node.id]);

    const handleAbstractChange = useCallback((val: string) => {
        syncClassAbstract(node.id, val === 'true');
    }, [node.id]);

    const handleAddAttribute = useCallback(() => {
        syncAddAttribute(node.id);
    }, [node.id]);

    const handleAddOperation = useCallback(() => {
        syncAddOperation(node.id);
    }, [node.id]);

    return (
        <>
            <Section title="Class">
                <EditableField label="Name" value={data.label} onChange={handleNameChange} />
                <EditableField
                    label="Abstract"
                    value={snapshot.isAbstract}
                    onChange={handleAbstractChange}
                    type="checkbox"
                />
                {snapshot.superclassNames.length > 0 && (
                    <div className="v3-props-field">
                        <span className="v3-props-field__label">Extends</span>
                        <span className="v3-props-field__value">
                            {snapshot.superclassNames.join(', ')}
                        </span>
                    </div>
                )}
            </Section>

            <Section
                title="Attributes"
                count={snapshot.attributes.length}
                action={
                    <button
                        className="v3-props-btn v3-props-btn--add"
                        onClick={handleAddAttribute}
                        title="Add attribute"
                    >
                        <i className="bi bi-plus" />
                    </button>
                }
            >
                {snapshot.attributes.length === 0 ? (
                    <div className="v3-props-empty">No attributes</div>
                ) : (
                    snapshot.attributes.map(attr => (
                        <AttributeRow key={attr.id} attr={attr} />
                    ))
                )}
            </Section>

            <Section
                title="Operations"
                count={snapshot.operations.length}
                action={
                    <button
                        className="v3-props-btn v3-props-btn--add"
                        onClick={handleAddOperation}
                        title="Add operation"
                    >
                        <i className="bi bi-plus" />
                    </button>
                }
            >
                {snapshot.operations.length === 0 ? (
                    <div className="v3-props-empty">No operations</div>
                ) : (
                    snapshot.operations.map(op => (
                        <OperationRow key={op.id} op={op} />
                    ))
                )}
            </Section>
        </>
    );
}

// ---------------------------------------------------------------------------
// Attribute Row
// ---------------------------------------------------------------------------

function AttributeRow({ attr }: { attr: AttributeInfo }) {
    const [expanded, setExpanded] = useState(false);

    const handleNameChange = useCallback((val: string) => {
        syncUpdateAttribute(attr.id, { name: val });
    }, [attr.id]);

    const handleTypeChange = useCallback((val: string) => {
        syncUpdateAttribute(attr.id, { type: val });
    }, [attr.id]);

    const handleRemove = useCallback(() => {
        syncRemoveAttribute(attr.id);
    }, [attr.id]);

    return (
        <div className="v3-props-row">
            <div className="v3-props-row__summary" onClick={() => setExpanded(e => !e)}>
                <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                <span className="v3-props-row__name">{attr.name}</span>
                <span className="v3-props-row__type">{attr.type}</span>
                <button
                    className="v3-props-btn v3-props-btn--remove"
                    onClick={e => { e.stopPropagation(); handleRemove(); }}
                    title="Remove attribute"
                >
                    <i className="bi bi-x" />
                </button>
            </div>
            {expanded && (
                <div className="v3-props-row__detail">
                    <EditableField label="Name" value={attr.name} onChange={handleNameChange} />
                    <EditableField label="Type" value={attr.type} onChange={handleTypeChange} />
                    <div className="v3-props-field">
                        <span className="v3-props-field__label">Cardinality</span>
                        <span className="v3-props-field__value">
                            {formatCardinality(attr.lowerBound, attr.upperBound)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Operation Row
// ---------------------------------------------------------------------------

function OperationRow({ op }: { op: OperationInfo }) {
    const [expanded, setExpanded] = useState(false);

    const handleNameChange = useCallback((val: string) => {
        syncUpdateOperation(op.id, { name: val });
    }, [op.id]);

    const handleReturnTypeChange = useCallback((val: string) => {
        syncUpdateOperation(op.id, { returnType: val });
    }, [op.id]);

    const handleRemove = useCallback(() => {
        syncRemoveOperation(op.id);
    }, [op.id]);

    const sig = `${op.name}(${op.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}): ${op.returnType}`;

    return (
        <div className="v3-props-row">
            <div className="v3-props-row__summary" onClick={() => setExpanded(e => !e)}>
                <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} />
                <span className="v3-props-row__name">{sig}</span>
                <button
                    className="v3-props-btn v3-props-btn--remove"
                    onClick={e => { e.stopPropagation(); handleRemove(); }}
                    title="Remove operation"
                >
                    <i className="bi bi-x" />
                </button>
            </div>
            {expanded && (
                <div className="v3-props-row__detail">
                    <EditableField label="Name" value={op.name} onChange={handleNameChange} />
                    <EditableField label="Return" value={op.returnType} onChange={handleReturnTypeChange} />
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Enum Properties
// ---------------------------------------------------------------------------

function EnumProperties({ node }: { node: Node }) {
    const data = node.data as unknown as ModelNodeData;
    const snapshot = data.modelSnapshot as EnumSnapshot;

    const handleNameChange = useCallback((val: string) => {
        syncNodeLabel(node.id, val);
    }, [node.id]);

    const handleAddLiteral = useCallback(() => {
        syncAddLiteral(node.id);
    }, [node.id]);

    return (
        <>
            <Section title="Enumeration">
                <EditableField label="Name" value={data.label} onChange={handleNameChange} />
            </Section>

            <Section
                title="Literals"
                count={snapshot.literals.length}
                action={
                    <button
                        className="v3-props-btn v3-props-btn--add"
                        onClick={handleAddLiteral}
                        title="Add literal"
                    >
                        <i className="bi bi-plus" />
                    </button>
                }
            >
                {snapshot.literals.length === 0 ? (
                    <div className="v3-props-empty">No literals</div>
                ) : (
                    snapshot.literals.map(lit => (
                        <LiteralRow key={lit.id} literal={lit} />
                    ))
                )}
            </Section>
        </>
    );
}

// ---------------------------------------------------------------------------
// Literal Row
// ---------------------------------------------------------------------------

function LiteralRow({ literal }: { literal: LiteralInfo }) {
    const handleNameChange = useCallback((val: string) => {
        syncUpdateLiteral(literal.id, { name: val });
    }, [literal.id]);

    const handleRemove = useCallback(() => {
        syncRemoveLiteral(literal.id);
    }, [literal.id]);

    return (
        <div className="v3-props-row">
            <div className="v3-props-row__summary">
                <i className="bi bi-hash" />
                <input
                    className="v3-props-row__inline-input"
                    value={literal.name}
                    onChange={e => handleNameChange(e.target.value)}
                    onMouseDown={e => e.stopPropagation()}
                />
                <button
                    className="v3-props-btn v3-props-btn--remove"
                    onClick={handleRemove}
                    title="Remove literal"
                >
                    <i className="bi bi-x" />
                </button>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Object Properties (M1 instance)
// ---------------------------------------------------------------------------

function ObjectProperties({ node }: { node: Node }) {
    const data = node.data as unknown as ModelNodeData;
    const snapshot = data.modelSnapshot as ObjectSnapshot;

    return (
        <>
            <Section title="Object Instance">
                <div className="v3-props-field">
                    <span className="v3-props-field__label">Instance of</span>
                    <span className="v3-props-field__value">{snapshot.instanceOfClassName}</span>
                </div>
            </Section>

            <Section title="Feature Values" count={snapshot.features.length}>
                {snapshot.features.length === 0 ? (
                    <div className="v3-props-empty">No feature values</div>
                ) : (
                    snapshot.features.map(fv => (
                        <FeatureValueRow key={fv.id} feature={fv} objectVertexId={node.id} />
                    ))
                )}
            </Section>
        </>
    );
}

// ---------------------------------------------------------------------------
// Feature Value Row (M1)
// ---------------------------------------------------------------------------

function FeatureValueRow({ feature, objectVertexId }: { feature: FeatureValueInfo; objectVertexId: string }) {
    const isRef = feature.featureKind === 'reference';
    const currentValue = isRef
        ? (feature.resolvedNames?.join(', ') ?? '—')
        : (feature.values.length > 0 ? String(feature.values[0] ?? '') : '');

    const handleValueChange = useCallback((val: string) => {
        if (!isRef) {
            syncFeatureValue(objectVertexId, feature.featureName, val);
        }
    }, [objectVertexId, feature.featureName, isRef]);

    return (
        <div className="v3-props-row">
            <div className="v3-props-row__summary">
                <i className={`bi ${isRef ? 'bi-link-45deg' : 'bi-card-text'}`} />
                <span className="v3-props-row__name">{feature.featureName}</span>
                <span className="v3-props-row__type">{isRef ? 'ref' : 'attr'}</span>
            </div>
            <div className="v3-props-row__detail">
                {isRef ? (
                    <div className="v3-props-field">
                        <span className="v3-props-field__label">Links to</span>
                        <span className="v3-props-field__value">{currentValue != null ? String(currentValue) : '—'}</span>
                    </div>
                ) : (
                    <EditableField
                        label="Value"
                        value={currentValue}
                        onChange={handleValueChange}
                    />
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Package Properties
// ---------------------------------------------------------------------------

function PackageProperties({ node }: { node: Node }) {
    const data = node.data as unknown as ModelNodeData;
    const snapshot = data.modelSnapshot as PackageSnapshot;

    const handleNameChange = useCallback((val: string) => {
        syncNodeLabel(node.id, val);
    }, [node.id]);

    return (
        <Section title="Package">
            <EditableField label="Name" value={data.label} onChange={handleNameChange} />
            <div className="v3-props-field">
                <span className="v3-props-field__label">Children</span>
                <span className="v3-props-field__value">{snapshot.childCount}</span>
            </div>
        </Section>
    );
}

// ---------------------------------------------------------------------------
// Edge Properties
// ---------------------------------------------------------------------------

function EdgeProperties({ edge }: { edge: Edge }) {
    const edgeData = edge.data as unknown as UnifiedEdgeData | undefined;
    if (!edgeData) return null;

    const isInheritance = edgeData.edgeKind === 'inheritance';

    return (
        <Section title={`Edge: ${edgeData.edgeKind}`}>
            <div className="v3-props-field">
                <span className="v3-props-field__label">Type</span>
                <span className="v3-props-field__value">{edgeData.edgeKind}</span>
            </div>
            {!isInheritance && edgeData.label && (
                <div className="v3-props-field">
                    <span className="v3-props-field__label">Label</span>
                    <span className="v3-props-field__value">{edgeData.label}</span>
                </div>
            )}
            {edgeData.sourceCardinality && (
                <div className="v3-props-field">
                    <span className="v3-props-field__label">Source Card.</span>
                    <span className="v3-props-field__value">{edgeData.sourceCardinality}</span>
                </div>
            )}
            {edgeData.targetCardinality && (
                <div className="v3-props-field">
                    <span className="v3-props-field__label">Target Card.</span>
                    <span className="v3-props-field__value">{edgeData.targetCardinality}</span>
                </div>
            )}
        </Section>
    );
}

// ---------------------------------------------------------------------------
// Empty State
// ---------------------------------------------------------------------------

function EmptyStatePanel() {
    return (
        <div className="v3-props-empty-state">
            <JjEmptyState
                icon="bi-cursor"
                title="No element selected"
                description="Select a node or edge to view its properties."
                hints={[
                    { icon: 'bi-mouse', text: 'Click an element to select it' },
                ]}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// Multi-selection state
// ---------------------------------------------------------------------------

function MultiSelection({ nodeCount, edgeCount }: { nodeCount: number; edgeCount: number }) {
    return (
        <div className="v3-props-multi">
            <i className="bi bi-collection" />
            <p>{nodeCount} node{nodeCount !== 1 ? 's' : ''}, {edgeCount} edge{edgeCount !== 1 ? 's' : ''} selected</p>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Panel
// ---------------------------------------------------------------------------

function PropertiesPanelInner({ selectedNodes, selectedEdges }: PropertiesPanelProps) {
    const totalSelected = selectedNodes.length + selectedEdges.length;

    // Render content based on selection
    let content: React.ReactNode;

    if (totalSelected === 0) {
        content = <EmptyStatePanel />;
    } else if (totalSelected > 1) {
        content = <MultiSelection nodeCount={selectedNodes.length} edgeCount={selectedEdges.length} />;
    } else if (selectedNodes.length === 1) {
        const node = selectedNodes[0];
        const data = node.data as unknown as ModelNodeData;
        const kind = data.modelSnapshot?.kind;

        switch (kind) {
            case 'class':
                content = <ClassProperties node={node} />;
                break;
            case 'enum':
                content = <EnumProperties node={node} />;
                break;
            case 'package':
                content = <PackageProperties node={node} />;
                break;
            case 'object':
                content = <ObjectProperties node={node} />;
                break;
            default:
                content = (
                    <Section title="Element">
                        <EditableField
                            label="Name"
                            value={data.label}
                            onChange={val => syncNodeLabel(node.id, val)}
                        />
                    </Section>
                );
        }
    } else if (selectedEdges.length === 1) {
        content = <EdgeProperties edge={selectedEdges[0]} />;
    }

    return (
        <aside className="v3-properties">
            <div className="v3-properties__header">Properties</div>
            <div className="v3-properties__body">
                {content}
            </div>
        </aside>
    );
}

export const PropertiesPanel = memo(PropertiesPanelInner);

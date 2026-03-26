/**
 * Editor V2 — M1 Properties Panel.
 *
 * Shows properties of a selected ObjectNode:
 * - Instance name (editable)
 * - Metaclass (read-only)
 * - Attribute values (editable)
 * - Reference targets (read-only links)
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Node } from '@xyflow/react';
import type { ObjectNodeData, FeatureValueRow } from '../types';
import { syncNodeLabel, syncUpdateFeatureValue } from '../sync/canvasToJjom';
import InlineEnumSelect from '../components/InlineEnumSelect';

interface M1PropertiesPanelProps {
    selectedNode: Node<ObjectNodeData>;
    onNodeChange: (nodeId: string, data: any) => void;
}

function M1PropertiesPanel({ selectedNode, onNodeChange }: M1PropertiesPanelProps) {
    const nodeData = selectedNode.data as ObjectNodeData;
    const [name, setName] = useState(nodeData.label);
    const [openEnumId, setOpenEnumId] = useState<string | null>(null);

    useEffect(() => {
        setName(nodeData.label);
    }, [nodeData.label]);

    const commitName = useCallback(() => {
        if (name !== nodeData.label) {
            onNodeChange(selectedNode.id, { label: name });
            syncNodeLabel(selectedNode.id, name);
        }
    }, [name, nodeData.label, selectedNode.id, onNodeChange]);

    const nodeDataRef = useRef(nodeData);
    nodeDataRef.current = nodeData;

    const handleFeatureChange = useCallback((feature: FeatureValueRow, newValue: string) => {
        const updatedFeatures = nodeDataRef.current.features.map(f =>
            f.id === feature.id ? { ...f, value: newValue } : f
        );
        onNodeChange(selectedNode.id, { features: updatedFeatures });
        syncUpdateFeatureValue(selectedNode.id, feature.featureName, newValue);
    }, [selectedNode.id, onNodeChange]);

    const attributes = nodeData.features?.filter(f => f.featureKind === 'attribute') ?? [];
    const references = nodeData.features?.filter(f => f.featureKind === 'reference') ?? [];

    return (
        <div className="properties-panel__content">
            {/* Header */}
            <div className="properties-section">
                <div className="properties-section__title">Instance</div>
                <div className="properties-field">
                    <label className="properties-field__label">Name</label>
                    <input
                        className="properties-field__input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={commitName}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitName(); }}
                    />
                </div>
                <div className="properties-field">
                    <label className="properties-field__label">Class</label>
                    <span className="properties-field__value">{nodeData.instanceOfClassName}</span>
                </div>
            </div>

            {/* Attributes */}
            {attributes.length > 0 && (
                <div className="properties-section">
                    <div className="properties-section__title">Attributes</div>
                    {attributes.map((attr) => {
                        const isStaleEnum = attr.enumLiterals && attr.enumLiterals.length > 0
                            && attr.value != null && attr.value !== ''
                            && !attr.enumLiterals.some(l => l.name === attr.value);
                        return (
                        <div key={attr.id} className="properties-field">
                            <label className="properties-field__label">
                                {attr.featureName}
                                {isStaleEnum && (
                                    <i className="bi bi-exclamation-triangle-fill properties-field__stale-icon"
                                       title={`"${attr.value}" is no longer a valid enum literal`} />
                                )}
                            </label>
                            {attr.enumLiterals && attr.enumLiterals.length > 0 ? (
                                <div className="properties-field__enum-trigger-wrap">
                                    <button
                                        type="button"
                                        className={`properties-field__input properties-field__enum-trigger${isStaleEnum ? ' properties-field__enum-trigger--stale' : ''}`}
                                        onClick={() => setOpenEnumId(openEnumId === attr.id ? null : attr.id)}
                                    >
                                        <span>{attr.value || '(none)'}</span>
                                        <i className="bi bi-chevron-down properties-field__enum-chevron" />
                                    </button>
                                    {openEnumId === attr.id && (
                                        <InlineEnumSelect
                                            value={attr.value}
                                            enumName={attr.typeName ?? 'Enum'}
                                            literals={attr.enumLiterals}
                                            isStale={isStaleEnum || false}
                                            onChange={(val) => {
                                                handleFeatureChange(attr, val);
                                                setOpenEnumId(null);
                                            }}
                                            onClose={() => setOpenEnumId(null)}
                                        />
                                    )}
                                </div>
                            ) : (
                                <input
                                    className="properties-field__input"
                                    value={attr.value}
                                    onChange={(e) => handleFeatureChange(attr, e.target.value)}
                                />
                            )}
                        </div>
                    );})}
                </div>
            )}

            {/* References */}
            {references.length > 0 && (
                <div className="properties-section">
                    <div className="properties-section__title">References</div>
                    {references.map((ref) => (
                        <div key={ref.id} className="properties-field">
                            <label className="properties-field__label">{ref.featureName}</label>
                            <span className="properties-field__value">{ref.value != null ? String(ref.value) : '—'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default M1PropertiesPanel;

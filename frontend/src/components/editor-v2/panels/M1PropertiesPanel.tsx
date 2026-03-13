/**
 * Editor V2 — M1 Properties Panel.
 *
 * Shows properties of a selected ObjectNode:
 * - Instance name (editable)
 * - Metaclass (read-only)
 * - Attribute values (editable)
 * - Reference targets (read-only links)
 */

import { useState, useCallback, useEffect } from 'react';
import type { Node } from '@xyflow/react';
import type { ObjectNodeData, FeatureValueRow } from '../types';
import { syncNodeLabel, syncUpdateFeatureValue } from '../sync/canvasToJjom';

interface M1PropertiesPanelProps {
    selectedNode: Node<ObjectNodeData>;
    onNodeChange: (nodeId: string, data: any) => void;
}

function M1PropertiesPanel({ selectedNode, onNodeChange }: M1PropertiesPanelProps) {
    const nodeData = selectedNode.data as ObjectNodeData;
    const [name, setName] = useState(nodeData.label);

    useEffect(() => {
        setName(nodeData.label);
    }, [nodeData.label]);

    const commitName = useCallback(() => {
        if (name !== nodeData.label) {
            onNodeChange(selectedNode.id, { label: name });
            syncNodeLabel(selectedNode.id, name);
        }
    }, [name, nodeData.label, selectedNode.id, onNodeChange]);

    const handleFeatureChange = useCallback((feature: FeatureValueRow, newValue: string) => {
        const updatedFeatures = nodeData.features.map(f =>
            f.id === feature.id ? { ...f, value: newValue } : f
        );
        onNodeChange(selectedNode.id, { features: updatedFeatures });
        syncUpdateFeatureValue(selectedNode.id, feature.featureName, newValue);
    }, [nodeData.features, selectedNode.id, onNodeChange]);

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
                    {attributes.map((attr) => (
                        <div key={attr.id} className="properties-field">
                            <label className="properties-field__label">{attr.featureName}</label>
                            <input
                                className="properties-field__input"
                                value={attr.value}
                                onChange={(e) => handleFeatureChange(attr, e.target.value)}
                            />
                        </div>
                    ))}
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

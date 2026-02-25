import React from 'react';
import type { EnvGenFeatures } from '../types';

interface FeaturesStepProps {
    features: EnvGenFeatures;
    setFeatures: (patch: Partial<EnvGenFeatures>) => void;
}

interface FeatureToggle {
    key: keyof EnvGenFeatures;
    label: string;
}

const FEATURE_GROUPS: Array<{ label: string; features: FeatureToggle[] }> = [
    {
        label: 'CORE',
        features: [
            { key: 'undoRedo', label: 'Undo / Redo' },
            { key: 'modelVersioning', label: 'Model Versioning' },
            { key: 'autoSave', label: 'Auto-save' },
            { key: 'validationEngine', label: 'Validation Engine' },
            { key: 'exportFormats', label: 'Export (JSON / PNG / SVG)' },
        ],
    },
    {
        label: 'CANVAS',
        features: [
            { key: 'infiniteCanvas', label: 'Infinite Canvas with Inertial Scrolling' },
            { key: 'minimap', label: 'Minimap' },
            { key: 'snapToGrid', label: 'Snap-to-Grid' },
            { key: 'multipleSelection', label: 'Multiple Selection & Alignment' },
            { key: 'inlineEditing', label: 'Inline Canvas Editing' },
        ],
    },
    {
        label: 'EDGE ROUTING',
        features: [
            { key: 'directEdges', label: 'Direct (straight lines)' },
            { key: 'bezierCurves', label: 'Bezier Curves' },
            { key: 'manhattanRouting', label: 'Manhattan Routing' },
        ],
    },
    {
        label: 'PRODUCTIVITY',
        features: [
            { key: 'commandPalette', label: 'Command Palette (Ctrl+Shift+P)' },
            { key: 'quickSearch', label: 'Quick Search (Ctrl+F)' },
            { key: 'scriptingConsole', label: 'Scripting Console' },
            { key: 'aiAssistant', label: 'AI Assistant' },
        ],
    },
];

export const FeaturesStep: React.FC<FeaturesStepProps> = ({
    features,
    setFeatures,
}) => {
    return (
        <div>
            <div className="envgen-section-header">
                <h3 className="envgen-section-title">Features</h3>
                <p className="envgen-section-description">
                    Toggle the features to include in the generated environment
                </p>
            </div>

            {FEATURE_GROUPS.map((group) => (
                <div className="envgen-feature-group" key={group.label}>
                    <div className="envgen-feature-group-label">{group.label}</div>
                    {group.features.map((feature) => (
                        <div className="envgen-feature-item" key={feature.key}>
                            <span className="envgen-feature-label">{feature.label}</span>
                            <button
                                type="button"
                                className={`envgen-toggle ${features[feature.key] ? 'active' : ''}`}
                                onClick={() => setFeatures({ [feature.key]: !features[feature.key] })}
                                aria-label={`Toggle ${feature.label}`}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

import React, { useState, useCallback } from 'react';
import { featureDefinitions, FeatureDefinition, getSubFeatures, hasSubFeatures } from './featureDefinitions';
import './features-palette.scss';

interface FeaturesPaletteProps {
    className?: string;
}

/**
 * FeaturesPalette - Fixed sidebar with draggable metamodel elements
 *
 * Features:
 * - Displays Package, Class, Enumerator items
 * - Shows sub-features (Attribute, Reference, Operation, Literal) when parent is expanded
 * - Supports HTML5 drag & drop to canvas
 * - Always visible (fixed 200px sidebar)
 * - Follows CLAUDE.md design guidelines
 */
export const FeaturesPalette: React.FC<FeaturesPaletteProps> = ({ className = '' }) => {
    // Track which feature is expanded to show sub-features
    const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

    // Toggle expanded state for features with sub-features
    const handleFeatureClick = useCallback((feature: FeatureDefinition) => {
        if (hasSubFeatures(feature.id)) {
            setExpandedFeatureId(prev => prev === feature.id ? null : feature.id);
        }
    }, []);

    // Handle drag start - set drag data for canvas drop handling
    const handleDragStart = useCallback((e: React.DragEvent, feature: FeatureDefinition) => {
        e.dataTransfer.setData('application/json', JSON.stringify({
            type: feature.dragType,
            featureId: feature.id,
            defaultData: feature.defaultData
        }));
        e.dataTransfer.effectAllowed = 'copy';

        // Add visual feedback class
        const target = e.currentTarget as HTMLElement;
        target.classList.add('dragging');
    }, []);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        const target = e.currentTarget as HTMLElement;
        target.classList.remove('dragging');
    }, []);

    // Render a single feature item
    const renderFeatureItem = (feature: FeatureDefinition, isSubFeature: boolean = false) => {
        const isExpandable = hasSubFeatures(feature.id);
        const isExpanded = expandedFeatureId === feature.id;

        return (
            <div
                key={feature.id}
                className={`features-palette__item ${isSubFeature ? 'features-palette__item--sub' : ''} ${isExpanded ? 'features-palette__item--expanded' : ''}`}
                draggable
                onDragStart={(e) => handleDragStart(e, feature)}
                onDragEnd={handleDragEnd}
                onClick={() => handleFeatureClick(feature)}
                title={feature.description}
            >
                <i className={`bi bi-${feature.icon} features-palette__item-icon`} />
                <span className="features-palette__item-name">{feature.name}</span>
                {isExpandable && (
                    <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} features-palette__item-chevron`} />
                )}
            </div>
        );
    };

    return (
        <div className={`features-palette ${className}`}>
            {/* Header with icon and title */}
            <div className="features-palette__header">
                <i className="bi bi-grid-3x3 features-palette__header-icon" />
                <span className="features-palette__title">FEATURES</span>
            </div>

            {/* Palette content - always visible */}
            <div className="features-palette__content">
                <div className="features-palette__items">
                    {featureDefinitions.map(feature => (
                        <React.Fragment key={feature.id}>
                            {renderFeatureItem(feature)}

                            {/* Show sub-features when parent is expanded */}
                            {expandedFeatureId === feature.id && (
                                <div className="features-palette__sub-items">
                                    {getSubFeatures(feature.id).map(subFeature =>
                                        renderFeatureItem(subFeature, true)
                                    )}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesPalette;

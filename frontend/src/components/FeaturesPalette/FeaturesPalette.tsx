import React, { useState, useEffect, useCallback } from 'react';
import { featureDefinitions, FeatureDefinition, getSubFeatures, hasSubFeatures } from './featureDefinitions';
import './features-palette.scss';

const STORAGE_KEY = 'jjodel_features_palette_collapsed';

interface FeaturesPaletteProps {
    className?: string;
}

/**
 * FeaturesPalette - Collapsible sidebar with draggable metamodel elements
 *
 * Features:
 * - Displays Package, Class, Enumerator items
 * - Shows sub-features (Attribute, Reference, Operation, Literal) when parent is selected
 * - Supports HTML5 drag & drop to canvas
 * - Collapsible with localStorage persistence
 * - Follows CLAUDE.md design guidelines
 */
export const FeaturesPalette: React.FC<FeaturesPaletteProps> = ({ className = '' }) => {
    // Initialize collapsed state from localStorage
    const [isCollapsed, setIsCollapsed] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved === 'true';
    });

    // Track which feature is expanded to show sub-features
    const [expandedFeatureId, setExpandedFeatureId] = useState<string | null>(null);

    // Persist collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(prev => !prev);
    }, []);

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
        <div className={`features-palette ${isCollapsed ? 'features-palette--collapsed' : ''} ${className}`}>
            {/* Toggle button - always visible */}
            <button
                className="features-palette__toggle"
                onClick={toggleCollapsed}
                title={isCollapsed ? 'Expand palette' : 'Collapse palette'}
                aria-expanded={!isCollapsed}
                aria-label="Toggle features palette"
            >
                <i className={`bi ${isCollapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`} />
            </button>

            {/* Palette content - hidden when collapsed */}
            <div className="features-palette__content">
                <div className="features-palette__header">
                    <span className="features-palette__title">Features</span>
                </div>

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

import React, { useState, useEffect, useCallback } from 'react';
import { featureDefinitions, FeatureDefinition } from './featureDefinitions';
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

    // Persist collapsed state to localStorage
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, String(isCollapsed));
    }, [isCollapsed]);

    const toggleCollapsed = useCallback(() => {
        setIsCollapsed(prev => !prev);
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
                        <div
                            key={feature.id}
                            className="features-palette__item"
                            draggable
                            onDragStart={(e) => handleDragStart(e, feature)}
                            onDragEnd={handleDragEnd}
                            title={feature.description}
                        >
                            <i className={`bi bi-${feature.icon} features-palette__item-icon`} />
                            <span className="features-palette__item-name">{feature.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturesPalette;

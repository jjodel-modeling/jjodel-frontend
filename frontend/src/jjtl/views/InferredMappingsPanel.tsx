/**
 * InferredMappingsPanel Component
 * Shows AI-suggested mappings based on naming patterns and structure
 */

import React, { useState, useCallback } from 'react';
import { AIDisclaimer } from '../../components/common/AIDisclaimer';

export interface InferredMapping {
    id: string;
    sourceClass: string;
    sourceAttribute?: string;
    targetClass: string;
    targetAttribute?: string;
    confidence: number; // 0-1
    reason: string;
    mappingType: 'class' | 'attribute' | 'reference';
}

export interface InferredMappingsPanelProps {
    mappings: InferredMapping[];
    onAccept?: (mapping: InferredMapping) => void;
    onAcceptAll?: (mappings: InferredMapping[]) => void;
    onReject?: (mapping: InferredMapping) => void;
    onPreview?: (mapping: InferredMapping) => void;
    isAnalyzing?: boolean;
    onRefreshAnalysis?: () => void;
}

// Confidence level colors
const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return '#10b981'; // green
    if (confidence >= 0.5) return '#f59e0b'; // amber
    return '#ef4444'; // red
};

const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.5) return 'Medium';
    return 'Low';
};

export const InferredMappingsPanel: React.FC<InferredMappingsPanelProps> = ({
    mappings,
    onAccept,
    onAcceptAll,
    onReject,
    onPreview,
    isAnalyzing = false,
    onRefreshAnalysis,
}) => {
    const [selectedMappings, setSelectedMappings] = useState<Set<string>>(new Set());
    const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
    const [hoveredMapping, setHoveredMapping] = useState<string | null>(null);

    // Toggle selection
    const toggleSelection = useCallback((mappingId: string) => {
        setSelectedMappings(prev => {
            const next = new Set(prev);
            if (next.has(mappingId)) {
                next.delete(mappingId);
            } else {
                next.add(mappingId);
            }
            return next;
        });
    }, []);

    // Select all
    const selectAll = useCallback(() => {
        setSelectedMappings(new Set(filteredMappings.map(m => m.id)));
    }, []);

    // Clear selection
    const clearSelection = useCallback(() => {
        setSelectedMappings(new Set());
    }, []);

    // Accept selected
    const acceptSelected = useCallback(() => {
        const selected = mappings.filter(m => selectedMappings.has(m.id));
        onAcceptAll?.(selected);
        setSelectedMappings(new Set());
    }, [mappings, selectedMappings, onAcceptAll]);

    // Filter mappings
    const filteredMappings = mappings.filter(m => {
        if (filterConfidence === 'all') return true;
        if (filterConfidence === 'high') return m.confidence >= 0.8;
        if (filterConfidence === 'medium') return m.confidence >= 0.5 && m.confidence < 0.8;
        return m.confidence < 0.5;
    });

    // Group by type
    const classMappings = filteredMappings.filter(m => m.mappingType === 'class');
    const attributeMappings = filteredMappings.filter(m => m.mappingType === 'attribute');

    return (
        <div className="jjtl-inferred-panel">
            {/* Header */}
            <div className="jjtl-inferred-header">
                <div className="jjtl-inferred-title">
                    <i className="bi bi-lightbulb" />
                    <span>Suggested Mappings</span>
                    <span className="jjtl-inferred-badge">{mappings.length}</span>
                </div>
                <button
                    className="jjtl-inferred-refresh"
                    onClick={onRefreshAnalysis}
                    disabled={isAnalyzing}
                >
                    <i className={`bi ${isAnalyzing ? 'bi-arrow-repeat spinning' : 'bi-arrow-clockwise'}`} />
                </button>
            </div>

            {/* Analyzing state */}
            {isAnalyzing && (
                <div className="jjtl-inferred-analyzing">
                    <div className="jjtl-inferred-spinner" />
                    <span>Analyzing metamodels...</span>
                </div>
            )}

            {/* Controls */}
            {!isAnalyzing && mappings.length > 0 && (
                <div className="jjtl-inferred-controls">
                    <div className="jjtl-inferred-filter">
                        <label>Confidence:</label>
                        <select
                            value={filterConfidence}
                            onChange={(e) => setFilterConfidence(e.target.value as any)}
                        >
                            <option value="all">All</option>
                            <option value="high">High (80%+)</option>
                            <option value="medium">Medium (50-80%)</option>
                            <option value="low">Low (&lt;50%)</option>
                        </select>
                    </div>

                    <div className="jjtl-inferred-actions">
                        {selectedMappings.size > 0 ? (
                            <>
                                <button onClick={clearSelection}>
                                    Clear ({selectedMappings.size})
                                </button>
                                <button
                                    className="jjtl-inferred-accept-btn"
                                    onClick={acceptSelected}
                                >
                                    <i className="bi bi-check-lg" />
                                    Accept Selected
                                </button>
                            </>
                        ) : (
                            <>
                                <button onClick={selectAll}>
                                    Select All
                                </button>
                                <button
                                    className="jjtl-inferred-accept-btn"
                                    onClick={() => onAcceptAll?.(filteredMappings)}
                                >
                                    <i className="bi bi-check-all" />
                                    Accept All
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Mappings list */}
            <div className="jjtl-inferred-list">
                {filteredMappings.length === 0 && !isAnalyzing ? (
                    <div className="jjtl-inferred-empty">
                        <i className="bi bi-search" />
                        <span>No mappings inferred</span>
                        <p>Load metamodels and click refresh to analyze</p>
                    </div>
                ) : (
                    <>
                        {/* Class mappings */}
                        {classMappings.length > 0 && (
                            <div className="jjtl-inferred-section">
                                <div className="jjtl-inferred-section-title">
                                    Class Mappings
                                </div>
                                {classMappings.map(mapping => (
                                    <MappingItem
                                        key={mapping.id}
                                        mapping={mapping}
                                        isSelected={selectedMappings.has(mapping.id)}
                                        isHovered={hoveredMapping === mapping.id}
                                        onToggleSelect={() => toggleSelection(mapping.id)}
                                        onAccept={() => onAccept?.(mapping)}
                                        onReject={() => onReject?.(mapping)}
                                        onMouseEnter={() => { setHoveredMapping(mapping.id); onPreview?.(mapping); }}
                                        onMouseLeave={() => setHoveredMapping(null)}
                                    />
                                ))}
                            </div>
                        )}

                        {/* Attribute mappings */}
                        {attributeMappings.length > 0 && (
                            <div className="jjtl-inferred-section">
                                <div className="jjtl-inferred-section-title">
                                    Attribute Mappings
                                </div>
                                {attributeMappings.map(mapping => (
                                    <MappingItem
                                        key={mapping.id}
                                        mapping={mapping}
                                        isSelected={selectedMappings.has(mapping.id)}
                                        isHovered={hoveredMapping === mapping.id}
                                        onToggleSelect={() => toggleSelection(mapping.id)}
                                        onAccept={() => onAccept?.(mapping)}
                                        onReject={() => onReject?.(mapping)}
                                        onMouseEnter={() => { setHoveredMapping(mapping.id); onPreview?.(mapping); }}
                                        onMouseLeave={() => setHoveredMapping(null)}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* AI Disclaimer */}
            {mappings.length > 0 && <AIDisclaimer feature="mappings" />}
        </div>
    );
};

// Individual mapping item component
interface MappingItemProps {
    mapping: InferredMapping;
    isSelected: boolean;
    isHovered: boolean;
    onToggleSelect: () => void;
    onAccept: () => void;
    onReject: () => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

const MappingItem: React.FC<MappingItemProps> = ({
    mapping,
    isSelected,
    isHovered,
    onToggleSelect,
    onAccept,
    onReject,
    onMouseEnter,
    onMouseLeave,
}) => {
    const confidenceColor = getConfidenceColor(mapping.confidence);
    const confidenceLabel = getConfidenceLabel(mapping.confidence);

    return (
        <div
            className={`jjtl-inferred-item ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            {/* Checkbox */}
            <div
                className={`jjtl-inferred-checkbox ${isSelected ? 'checked' : ''}`}
                onClick={onToggleSelect}
            >
                {isSelected && <i className="bi bi-check" />}
            </div>

            {/* Mapping info */}
            <div className="jjtl-inferred-info">
                <div className="jjtl-inferred-mapping">
                    <span className="jjtl-inferred-source">
                        {mapping.sourceClass}
                        {mapping.sourceAttribute && `.${mapping.sourceAttribute}`}
                    </span>
                    <i className="bi bi-arrow-right" />
                    <span className="jjtl-inferred-target">
                        {mapping.targetClass}
                        {mapping.targetAttribute && `.${mapping.targetAttribute}`}
                    </span>
                </div>
                <div className="jjtl-inferred-reason">
                    {mapping.reason}
                </div>
            </div>

            {/* Confidence */}
            <div
                className="jjtl-inferred-confidence"
                style={{ color: confidenceColor }}
            >
                <div
                    className="jjtl-inferred-confidence-bar"
                    style={{
                        width: `${mapping.confidence * 100}%`,
                        backgroundColor: confidenceColor,
                    }}
                />
                <span>{confidenceLabel}</span>
            </div>

            {/* Actions */}
            <div className="jjtl-inferred-item-actions">
                <button
                    className="jjtl-inferred-accept"
                    onClick={(e) => { e.stopPropagation(); onAccept(); }}
                    title="Accept mapping"
                >
                    <i className="bi bi-check-lg" />
                </button>
                <button
                    className="jjtl-inferred-reject"
                    onClick={(e) => { e.stopPropagation(); onReject(); }}
                    title="Reject mapping"
                >
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>
    );
};

export default InferredMappingsPanel;

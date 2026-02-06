/**
 * SuggestedMappingsPanel - UI for displaying and managing mapping suggestions
 * Supports Simple mode (name/type matching) and AI mode (LLM-assisted)
 *
 * Workflow:
 * - Checkbox checked (☑) = toInsert - mapping will be inserted into editor
 * - Checkbox unchecked (☐) = pending - candidate mapping
 * - X button = rejected - removed from list
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { MetamodelElement } from './MetamodelTreeView';
import {
    MappingSuggestion,
    SuggestionMode,
    SuggestionResult
} from '../types/suggestions';
import { mappingSuggestionService } from '../services';
import { MappingCard } from './MappingCard';
import GrammarTab from './GrammarTab';
import type { GrammarRule } from '../components/GrammarDiagram/types';

export interface SuggestedMappingsPanelProps {
    /** Static source metamodel data (use getSourceMetamodel for fresh data) */
    sourceMetamodel?: MetamodelElement[];
    /** Static target metamodel data (use getTargetMetamodel for fresh data) */
    targetMetamodel?: MetamodelElement[];
    /** Getter function to fetch fresh source metamodel data on analyze */
    getSourceMetamodel?: () => MetamodelElement[];
    /** Getter function to fetch fresh target metamodel data on analyze */
    getTargetMetamodel?: () => MetamodelElement[];
    sourceMetamodelName?: string;
    targetMetamodelName?: string;
    /** Callback when a mapping is hovered (for arrow highlighting) */
    onMappingHover?: (mappingId: string | null) => void;
    /** Currently hovered mapping ID (from external source like arrow hover) */
    hoveredMapping?: string | null;
    /** Callback when suggestions list changes (for arrow visualization) */
    onSuggestionsChange?: (suggestions: MappingSuggestion[]) => void;
    /** Callback to insert generated JjTL code into the editor */
    onInsertCode?: (code: string) => void;
    /** Highlighted grammar rule (from editor cursor position) */
    highlightedGrammarRule?: GrammarRule | null;
}

/**
 * Generate JjTL code from toInsert mapping suggestions
 */
function generateJjtlCode(mappings: MappingSuggestion[]): string {
    if (mappings.length === 0) return '';

    // Separate class mappings from attribute mappings
    const classMappings = mappings.filter(m => !m.sourceAttribute);
    const attrMappings = mappings.filter(m => m.sourceAttribute);

    // Group attribute mappings by source-target class pair
    const attrByClassPair = new Map<string, MappingSuggestion[]>();

    for (const attr of attrMappings) {
        const key = `${attr.sourceClass}|${attr.targetClass}`;
        if (!attrByClassPair.has(key)) {
            attrByClassPair.set(key, []);
        }
        attrByClassPair.get(key)!.push(attr);
    }

    let code = '';
    const processedPairs = new Set<string>();

    // First: Generate code for class mappings with their matching attributes
    for (const classMapping of classMappings) {
        const pairKey = `${classMapping.sourceClass}|${classMapping.targetClass}`;
        const matchingAttrs = attrByClassPair.get(pairKey) || [];

        code += `${classMapping.sourceClass} -> ${classMapping.targetClass}`;

        if (matchingAttrs.length > 0) {
            code += ' {\n';
            for (const attr of matchingAttrs) {
                code += `    ${attr.sourceAttribute} -> ${attr.targetAttribute}`;
                if (attr.conversionHint) {
                    code += ` : ${attr.conversionHint}`;
                }
                code += '\n';
            }
            code += '}';
        }

        code += '\n\n';
        processedPairs.add(pairKey);
    }

    // Second: Handle attribute mappings with different target classes
    for (const [pairKey, attrs] of attrByClassPair) {
        if (processedPairs.has(pairKey)) continue;

        const [sourceClass, targetClass] = pairKey.split('|');

        code += `${sourceClass} -> ${targetClass} {\n`;
        for (const attr of attrs) {
            code += `    ${attr.sourceAttribute} -> ${attr.targetAttribute}`;
            if (attr.conversionHint) {
                code += ` : ${attr.conversionHint}`;
            }
            code += '\n';
        }
        code += '}\n\n';
    }

    return code.trim();
}

export const SuggestedMappingsPanel: React.FC<SuggestedMappingsPanelProps> = ({
    sourceMetamodel: staticSourceMetamodel,
    targetMetamodel: staticTargetMetamodel,
    getSourceMetamodel,
    getTargetMetamodel,
    sourceMetamodelName = 'Source',
    targetMetamodelName = 'Target',
    onMappingHover,
    hoveredMapping,
    onSuggestionsChange,
    onInsertCode,
    highlightedGrammarRule,
}) => {
    // State
    const [mode, setMode] = useState<SuggestionMode>('simple');
    const [result, setResult] = useState<SuggestionResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);

    // Combine internal hover state with external prop
    const hoveredId = hoveredMapping ?? internalHoveredId;

    // Check AI availability
    const isAIAvailable = useMemo(() => mappingSuggestionService.isAIAvailable(), []);
    const aiProviderName = useMemo(() => mappingSuggestionService.getAIProviderName(), []);

    // Filter suggestions by status
    const toInsertSuggestions = useMemo(() => {
        if (!result) return [];
        return result.suggestions.filter(s => s.status === 'toInsert');
    }, [result]);

    const pendingSuggestions = useMemo(() => {
        if (!result) return [];
        return result.suggestions.filter(s => s.status === 'pending');
    }, [result]);

    const visibleSuggestions = useMemo(() => {
        if (!result) return [];
        return result.suggestions.filter(s => s.status !== 'rejected');
    }, [result]);

    // Notify parent of suggestions changes (for arrow visualization)
    // Create a deep copy to ensure React detects the change
    useEffect(() => {
        if (result && onSuggestionsChange) {
            // Deep copy suggestions to ensure React detects the change
            const suggestionsCopy = result.suggestions.map(s => ({ ...s }));
            console.log('[SuggestedMappingsPanel] Notifying parent of suggestions change:',
                suggestionsCopy.length,
                suggestionsCopy.map(s => ({ id: s.id, status: s.status })));
            onSuggestionsChange(suggestionsCopy);
        }
    }, [result, onSuggestionsChange]);

    // Analyze metamodels
    const handleAnalyze = useCallback(async () => {
        const sourceMetamodel = getSourceMetamodel ? getSourceMetamodel() : (staticSourceMetamodel || []);
        const targetMetamodel = getTargetMetamodel ? getTargetMetamodel() : (staticTargetMetamodel || []);

        if (sourceMetamodel.length === 0 || targetMetamodel.length === 0) {
            setResult({
                mode,
                suggestions: [],
                analyzedAt: Date.now(),
                error: 'Please ensure both metamodels have content to analyze.',
            });
            return;
        }

        setIsAnalyzing(true);
        setResult(null);

        try {
            const analysisResult = await mappingSuggestionService.analyze(
                sourceMetamodel,
                targetMetamodel,
                {
                    mode,
                    sourceMetamodelName,
                    targetMetamodelName,
                }
            );
            setResult(analysisResult);
        } catch (error) {
            console.error('[SuggestedMappingsPanel] Analysis error:', error);
        } finally {
            setIsAnalyzing(false);
        }
    }, [getSourceMetamodel, getTargetMetamodel, staticSourceMetamodel, staticTargetMetamodel, mode, sourceMetamodelName, targetMetamodelName]);

    // Toggle suggestion between pending and toInsert
    const handleToggle = useCallback((suggestion: MappingSuggestion) => {
        mappingSuggestionService.toggleSuggestion(suggestion.id);
        setResult({ ...mappingSuggestionService.getLastResult()! });
    }, []);

    // Reject suggestion
    const handleReject = useCallback((suggestion: MappingSuggestion) => {
        mappingSuggestionService.rejectSuggestion(suggestion.id);
        setResult({ ...mappingSuggestionService.getLastResult()! });
    }, []);

    // Mark all pending for insert
    const handleMarkAllForInsert = useCallback(() => {
        mappingSuggestionService.markAllForInsert();
        setResult({ ...mappingSuggestionService.getLastResult()! });
    }, []);

    // Insert toInsert mappings as JjTL code
    const handleInsertMappings = useCallback(() => {
        if (toInsertSuggestions.length === 0) return;

        const code = generateJjtlCode(toInsertSuggestions);
        console.log('[SuggestedMappingsPanel] Generated JjTL code:', code);

        onInsertCode?.(code);
    }, [toInsertSuggestions, onInsertCode]);

    // Handle hover
    const handleHover = useCallback((id: string | null) => {
        setInternalHoveredId(id);
        onMappingHover?.(id);
    }, [onMappingHover]);

    // Handle select - toggle: click on selected card to deselect
    const handleSelect = useCallback((id: string | null) => {
        setSelectedId(prev => prev === id ? null : id);
    }, []);

    // Check if we can analyze
    const hasGetters = !!(getSourceMetamodel && getTargetMetamodel);
    const hasStaticData = (staticSourceMetamodel?.length ?? 0) > 0 && (staticTargetMetamodel?.length ?? 0) > 0;
    const canAnalyze = hasGetters || hasStaticData;

    return (
        <div className="suggested-mappings-panel">
            {/* Header */}
            <div className="panel-header">
                <h3 className="panel-title">
                    <i className="bi bi-lightbulb" />
                    Suggested Mappings
                </h3>
            </div>

            {/* Mode Selector */}
            <div className="mode-selector">
                <button
                    className={`mode-btn ${mode === 'simple' ? 'active' : ''}`}
                    onClick={() => setMode('simple')}
                >
                    <i className="bi bi-list-check" />
                    Simple
                </button>
                <button
                    className={`mode-btn ${mode === 'ai' ? 'active' : ''} ${!isAIAvailable ? 'disabled' : ''}`}
                    onClick={() => isAIAvailable && setMode('ai')}
                    disabled={!isAIAvailable}
                    title={!isAIAvailable ? 'Configure AI provider in Settings' : `Using ${aiProviderName}`}
                >
                    <i className="bi bi-stars" />
                    AI
                    {isAIAvailable && aiProviderName && (
                        <span className="provider-badge">{aiProviderName}</span>
                    )}
                </button>
                <button
                    className={`mode-btn ${mode === 'grammar' ? 'active' : ''}`}
                    onClick={() => setMode('grammar')}
                    title="JjTL Grammar Reference"
                >
                    <i className="bi bi-signpost-split" />
                    Grammar
                </button>
            </div>

            {/* Grammar Tab Content */}
            {mode === 'grammar' ? (
                <GrammarTab compact highlightedRule={highlightedGrammarRule} />
            ) : (
                <>
                    {/* Mode Description */}
                    <div className="mode-description">
                        {mode === 'simple' ? (
                            <p>Matches elements by name similarity and type compatibility.</p>
                        ) : (
                            <p>Uses AI to find semantic relationships between metamodels.</p>
                        )}
                    </div>

                    {/* Analyze Button */}
                    <div className="analyze-section">
                        <button
                            className="btn-analyze"
                            onClick={handleAnalyze}
                            disabled={!canAnalyze || isAnalyzing}
                        >
                            {isAnalyzing ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Analyzing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-search" />
                                    Analyze Metamodels
                                </>
                            )}
                        </button>
                        {!canAnalyze && (
                            <p className="analyze-hint">Load both metamodels to analyze</p>
                        )}
                    </div>

                    {/* Error Message */}
                    {result?.error && (
                        <div className="error-message">
                            <i className="bi bi-exclamation-triangle" />
                            {result.error}
                        </div>
                    )}

                    {/* Results */}
                    {result && !result.error && (
                        <div className="suggestions-container">
                            {/* Stats */}
                            <div className="suggestions-stats">
                                <span className="stat">
                                    <strong>{visibleSuggestions.length}</strong> found
                                </span>
                                <span className="stat pending">
                                    <strong>{pendingSuggestions.length}</strong> pending
                                </span>
                                <span className="stat to-insert">
                                    <strong>{toInsertSuggestions.length}</strong> to insert
                                </span>
                            </div>

                            {/* TO INSERT Section */}
                            {toInsertSuggestions.length > 0 && (
                                <div className="suggestions-section to-insert-section">
                                    <h4 className="section-title">
                                        <i className="bi bi-check-square-fill" />
                                        TO INSERT ({toInsertSuggestions.length})
                                    </h4>
                                    <div className="suggestions-list">
                                        {toInsertSuggestions.map(suggestion => (
                                            <MappingCard
                                                key={suggestion.id}
                                                mapping={suggestion}
                                                isHovered={hoveredId === suggestion.id}
                                                isSelected={selectedId === suggestion.id}
                                                onToggle={() => handleToggle(suggestion)}
                                                onReject={() => handleReject(suggestion)}
                                                onHover={handleHover}
                                                onSelect={handleSelect}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* PENDING Section */}
                            {pendingSuggestions.length > 0 && (
                                <div className="suggestions-section pending-section">
                                    <div className="section-header-row">
                                        <h4 className="section-title">
                                            <i className="bi bi-square" />
                                            PENDING ({pendingSuggestions.length})
                                        </h4>
                                        {pendingSuggestions.length > 1 && (
                                            <button className="select-all-link" onClick={handleMarkAllForInsert}>
                                                Select all
                                            </button>
                                        )}
                                    </div>
                                    <div className="suggestions-list">
                                        {pendingSuggestions.map(suggestion => (
                                            <MappingCard
                                                key={suggestion.id}
                                                mapping={suggestion}
                                                isHovered={hoveredId === suggestion.id}
                                                isSelected={selectedId === suggestion.id}
                                                onToggle={() => handleToggle(suggestion)}
                                                onReject={() => handleReject(suggestion)}
                                                onHover={handleHover}
                                                onSelect={handleSelect}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Insert Button */}
                            {toInsertSuggestions.length > 0 && onInsertCode && (
                                <button
                                    className="btn-insert-mappings"
                                    onClick={handleInsertMappings}
                                >
                                    <i className="bi bi-code-slash" />
                                    Insert {toInsertSuggestions.length} mapping{toInsertSuggestions.length > 1 ? 's' : ''} into editor
                                </button>
                            )}

                            {/* Empty State */}
                            {visibleSuggestions.length === 0 && (
                                <div className="empty-state">
                                    <i className="bi bi-inbox" />
                                    <p>No mappings suggested</p>
                                    <span>Try using AI mode for semantic analysis</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Initial State */}
                    {!result && !isAnalyzing && (
                        <div className="initial-state">
                            <i className="bi bi-diagram-3" />
                            <p>Analyze metamodels to get mapping suggestions</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SuggestedMappingsPanel;

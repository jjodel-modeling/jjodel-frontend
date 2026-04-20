/**
 * SuggestedMappingsPanel - UI for displaying and managing mapping suggestions
 * Supports Simple mode (name/type matching) and AI mode (LLM-assisted)
 *
 * Workflow:
 * - Checkbox checked (☑) = toInsert - mapping will be inserted into editor
 * - Checkbox unchecked (☐) = pending - candidate mapping
 * - X button = rejected - removed from list
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { EmptyState as JjEmptyState } from '../../components/ui/EmptyState';
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
import { ProviderSelector, LocalOption } from '../../components/common/ProviderSelector';
import {AIConfig, JodieConfig} from "../../types/jodie";
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';

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
 * Check if a conversionHint looks like a valid JjEL expression.
 * Plain English text (prose) should be emitted as a -- comment instead of : expr.
 */
function isJjelExpression(hint: string): boolean {
    // Must contain at least one code-like character: operator, paren, dot, digit, bracket, or =
    return /[().=\[\]><!+\-*/%&|0-9]/.test(hint);
}

/**
 * Format a single attribute mapping line in JjTL syntax.
 * conversionHint is either a JjEL expression (: expr) or falls back to a -- comment.
 */
function formatAttrMapping(attr: MappingSuggestion): string {
    let line = `    ${attr.targetAttribute} := ${attr.sourceAttribute}`;
    if (attr.conversionHint) {
        if (isJjelExpression(attr.conversionHint)) {
            line += ` : ${attr.conversionHint}`;
        } else {
            line += `  -- ${attr.conversionHint}`;
        }
    }
    return line;
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

        if (classMapping.guardHint) {
            code += ` where ${classMapping.guardHint}`;
        }

        if (matchingAttrs.length > 0) {
            code += ' {\n';
            for (const attr of matchingAttrs) {
                code += formatAttrMapping(attr) + '\n';
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
            code += formatAttrMapping(attr) + '\n';
        }
        code += '}\n\n';
    }

    return code.trim();
}

// Local options for the ProviderSelector
const MAPPINGS_LOCAL_OPTIONS: LocalOption[] = [
    { id: 'simple', label: 'Simple (Local)', icon: 'lightning-charge' }
];

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
    const [showGrammar, setShowGrammar] = useState(false);
    const [selectedLocalOption, setSelectedLocalOption] = useState<string | null>('simple');
    const [result, setResult] = useState<SuggestionResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Settings navigation: mirrors the pattern in ProviderSelector, Jodie, and StatusBarRightZone —
    // `useSettingsModalSafe` from `contexts/SettingsModalContext` + `openSettings('providers')`.
    const settingsModal = useSettingsModalSafe();

    // AI provider preference for mappings feature
    const resolvedProvider= AIConfig.getPreferred('mappings');

    // Determine current mode based on selection
    const mode: SuggestionMode = useMemo(() => {
        if (showGrammar) return 'grammar';
        if (selectedLocalOption === 'simple') return 'simple';
        return 'ai';
    }, [showGrammar, selectedLocalOption]);

    // Combine internal hover state with external prop
    const hoveredId = hoveredMapping ?? internalHoveredId;

    // Check AI availability
    const isAIAvailable = useMemo(() => JodieConfig.hasEnabledProviders(), []);
    const aiProviderName = useMemo(() => {
        if (selectedLocalOption === 'simple') return null;
        return resolvedProvider;
    }, [selectedLocalOption, resolvedProvider]);

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
            // console.log('[SuggestedMappingsPanel] Notifying parent of suggestions change:',
            //     suggestionsCopy.length,
            //     suggestionsCopy.map(s => ({ id: s.id, status: s.status })));
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

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

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
                    aiProvider: resolvedProvider,
                    signal: controller.signal,
                }
            );
            if (controller.signal.aborted) return;
            setResult(analysisResult);
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                return;
            }
            console.error('[SuggestedMappingsPanel] Analysis error:', error);
        } finally {
            if (abortRef.current === controller) {
                setIsAnalyzing(false);
                abortRef.current = null;
            }
        }
    }, [getSourceMetamodel, getTargetMetamodel, staticSourceMetamodel, staticTargetMetamodel, mode, sourceMetamodelName, targetMetamodelName, resolvedProvider]);

    // Cancel an in-flight analysis
    const handleCancel = useCallback(() => {
        abortRef.current?.abort();
        abortRef.current = null;
        setIsAnalyzing(false);
    }, []);

    // Explicit user-driven fallback: re-run analysis in simple mode without changing dropdown state
    const handleFallbackToSimple = useCallback(async () => {
        const sourceMetamodel = getSourceMetamodel ? getSourceMetamodel() : (staticSourceMetamodel || []);
        const targetMetamodel = getTargetMetamodel ? getTargetMetamodel() : (staticTargetMetamodel || []);

        if (sourceMetamodel.length === 0 || targetMetamodel.length === 0) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        setIsAnalyzing(true);
        setResult(null);

        try {
            const analysisResult = await mappingSuggestionService.analyze(
                sourceMetamodel,
                targetMetamodel,
                {
                    mode: 'simple',
                    sourceMetamodelName,
                    targetMetamodelName,
                    signal: controller.signal,
                }
            );
            if (controller.signal.aborted) return;
            setResult(analysisResult);
        } catch (error: any) {
            if (error?.name === 'AbortError') return;
            console.error('[SuggestedMappingsPanel] Fallback error:', error);
        } finally {
            if (abortRef.current === controller) {
                setIsAnalyzing(false);
                abortRef.current = null;
            }
        }
    }, [getSourceMetamodel, getTargetMetamodel, staticSourceMetamodel, staticTargetMetamodel, sourceMetamodelName, targetMetamodelName]);

    // Open Settings → Providers
    const handleOpenSettings = useCallback(() => {
        settingsModal?.openSettings('providers');
    }, [settingsModal]);

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
        // console.log('[SuggestedMappingsPanel] Generated JjTL code:', code);

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

            {/* Mode Selector - Provider dropdown + Grammar button */}
            <div className="mode-selector">
                <ProviderSelector
                    feature="mappings"
                    localOptions={MAPPINGS_LOCAL_OPTIONS}
                    selectedLocalOption={selectedLocalOption}
                    onLocalOptionSelect={(optionId) => {
                        setSelectedLocalOption(optionId);
                        setShowGrammar(false);
                    }}
                    compact
                />
                <button
                    className={`mode-btn grammar-btn ${showGrammar ? 'active' : ''}`}
                    onClick={() => setShowGrammar(!showGrammar)}
                    title="JjTL Grammar Reference"
                >
                    <i className="bi bi-signpost-split" />
                    Grammar
                </button>
            </div>

            {/* Grammar Tab Content */}
            {showGrammar ? (
                <GrammarTab compact highlightedRule={highlightedGrammarRule} />
            ) : (
                <>
                    {/* Mode Description */}
                    <div className="mode-description">
                        {selectedLocalOption === 'simple' ? (
                            <p>Matches elements by name similarity and type compatibility.</p>
                        ) : (
                            <p>
                                Uses AI to find semantic relationships between metamodels.
                                {aiProviderName && <span className="provider-indicator"> ({aiProviderName})</span>}
                            </p>
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
                        {isAnalyzing && (
                            <button
                                className="btn-analyze btn-secondary"
                                onClick={handleCancel}
                                title="Cancel analysis"
                            >
                                <i className="bi bi-x-circle" />
                                Cancel
                            </button>
                        )}
                        {!canAnalyze && (
                            <p className="analyze-hint">Load both metamodels to analyze</p>
                        )}
                    </div>

                    {/* Error Message */}
                    {result?.error && (() => {
                        const isNoProviderError = result.error.toLowerCase().includes('not configured');
                        if (isNoProviderError) {
                            return (
                                <div className="error-message">
                                    <i className="bi bi-exclamation-triangle" />
                                    <div>
                                        <div>No AI provider is configured.</div>
                                        <button
                                            className="btn-analyze btn-secondary"
                                            onClick={handleOpenSettings}
                                            style={{ marginTop: 8 }}
                                        >
                                            <i className="bi bi-gear" />
                                            Open Settings → Providers
                                        </button>
                                    </div>
                                </div>
                            );
                        }
                        return (
                            <div className="error-message">
                                <i className="bi bi-exclamation-triangle" />
                                <div>
                                    <div>{result.error}</div>
                                    {result.canFallbackToSimple && (
                                        <button
                                            className="btn-analyze btn-secondary"
                                            onClick={handleFallbackToSimple}
                                            disabled={isAnalyzing}
                                            style={{ marginTop: 8 }}
                                        >
                                            <i className="bi bi-cpu" />
                                            Try simple matching instead
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })()}

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
                                <JjEmptyState
                                    icon="bi-inbox"
                                    title="No mappings suggested"
                                    description="Try using AI mode for semantic analysis."
                                />
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

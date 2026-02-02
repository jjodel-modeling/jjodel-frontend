/**
 * SuggestedMappingsPanel - UI for displaying and managing mapping suggestions
 * Supports Simple mode (name/type matching) and AI mode (LLM-assisted)
 */

import React, { useState, useCallback, useMemo } from 'react';
import { MetamodelElement } from './MetamodelTreeView';
import {
    MappingSuggestion,
    SuggestionMode,
    SuggestionResult
} from '../types/suggestions';
import { mappingSuggestionService } from '../services';
import { MappingCard } from './MappingCard';

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
    onAccept?: (suggestion: MappingSuggestion) => void;
    onAcceptAll?: (suggestions: MappingSuggestion[]) => void;
    onReject?: (suggestion: MappingSuggestion) => void;
    /** Callback to insert generated JjTL code into the editor */
    onInsertCode?: (code: string) => void;
}

/**
 * Generate JjTL code from accepted mapping suggestions
 * Groups attribute mappings by source-target class pair to handle
 * attribute mappings with different target classes correctly.
 *
 * Example: If we have:
 *   - Transition -> Transition (class)
 *   - Transition.name -> Transition.name (attr - same target)
 *   - Transition.condition -> Arc.weight (attr - DIFFERENT target)
 *
 * This generates:
 *   Transition -> Transition { name -> name }
 *   Transition -> Arc { condition -> weight }
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
    // (not covered by any class mapping)
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
    onAccept,
    onAcceptAll,
    onReject,
    onInsertCode,
}) => {
    // State
    const [mode, setMode] = useState<SuggestionMode>('simple');
    const [result, setResult] = useState<SuggestionResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Check AI availability
    const isAIAvailable = useMemo(() => mappingSuggestionService.isAIAvailable(), []);
    const aiProviderName = useMemo(() => mappingSuggestionService.getAIProviderName(), []);

    // Filter suggestions by status
    const pendingSuggestions = useMemo(() => {
        if (!result) return [];
        return result.suggestions.filter(s => !s.accepted && !s.rejected);
    }, [result]);

    const acceptedSuggestions = useMemo(() => {
        if (!result) return [];
        return result.suggestions.filter(s => s.accepted);
    }, [result]);

    // Analyze metamodels - fetches FRESH data if getter functions are provided
    const handleAnalyze = useCallback(async () => {
        // Get fresh metamodel data - prefer getters over static props
        const sourceMetamodel = getSourceMetamodel ? getSourceMetamodel() : (staticSourceMetamodel || []);
        const targetMetamodel = getTargetMetamodel ? getTargetMetamodel() : (staticTargetMetamodel || []);

        console.log('[SuggestedMappingsPanel] Analyzing fresh metamodels:', {
            sourceClasses: sourceMetamodel.filter(e => e.type === 'class').length,
            targetClasses: targetMetamodel.filter(e => e.type === 'class').length,
            usingGetters: !!(getSourceMetamodel || getTargetMetamodel)
        });

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

    // Accept suggestion
    const handleAccept = useCallback((suggestion: MappingSuggestion) => {
        mappingSuggestionService.acceptSuggestion(suggestion.id);
        setResult({ ...mappingSuggestionService.getLastResult()! });
        onAccept?.(suggestion);
    }, [onAccept]);

    // Reject suggestion
    const handleReject = useCallback((suggestion: MappingSuggestion) => {
        mappingSuggestionService.rejectSuggestion(suggestion.id);
        setResult({ ...mappingSuggestionService.getLastResult()! });
        onReject?.(suggestion);
    }, [onReject]);

    // Accept all pending
    const handleAcceptAll = useCallback(() => {
        const accepted = mappingSuggestionService.acceptAllPending();
        setResult({ ...mappingSuggestionService.getLastResult()! });
        onAcceptAll?.(accepted);
    }, [onAcceptAll]);

    // Insert accepted mappings as JjTL code
    const handleInsertMappings = useCallback(() => {
        if (acceptedSuggestions.length === 0) return;

        const code = generateJjtlCode(acceptedSuggestions);
        console.log('[SuggestedMappingsPanel] Generated JjTL code:', code);

        onInsertCode?.(code);
    }, [acceptedSuggestions, onInsertCode]);

    // Check if we can analyze - if getters are provided, always allow (they return fresh data)
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
            </div>

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
                            <strong>{result.suggestions.length}</strong> found
                        </span>
                        <span className="stat">
                            <strong>{pendingSuggestions.length}</strong> pending
                        </span>
                        <span className="stat">
                            <strong>{acceptedSuggestions.length}</strong> accepted
                        </span>
                    </div>

                    {/* Accept All Button */}
                    {pendingSuggestions.length > 1 && (
                        <button className="btn-accept-all" onClick={handleAcceptAll}>
                            <i className="bi bi-check-all" />
                            Accept All ({pendingSuggestions.length})
                        </button>
                    )}

                    {/* Pending Suggestions */}
                    {pendingSuggestions.length > 0 && (
                        <div className="suggestions-section">
                            <h4 className="section-title">Pending</h4>
                            <div className="suggestions-list">
                                {pendingSuggestions.map(suggestion => (
                                    <MappingCard
                                        key={suggestion.id}
                                        mapping={suggestion}
                                        onAccept={() => handleAccept(suggestion)}
                                        onReject={() => handleReject(suggestion)}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Accepted Suggestions */}
                    {acceptedSuggestions.length > 0 && (
                        <div className="suggestions-section accepted-section">
                            <h4 className="section-title">
                                <i className="bi bi-check-circle" />
                                Accepted
                            </h4>
                            <div className="suggestions-list">
                                {acceptedSuggestions.map(suggestion => (
                                    <MappingCard
                                        key={suggestion.id}
                                        mapping={suggestion}
                                        onAccept={() => handleAccept(suggestion)}
                                        onReject={() => handleReject(suggestion)}
                                    />
                                ))}
                            </div>

                            {/* Insert Mappings Button */}
                            {onInsertCode && (
                                <button
                                    className="btn-insert-mappings"
                                    onClick={handleInsertMappings}
                                >
                                    <i className="bi bi-code-slash" />
                                    Insert {acceptedSuggestions.length} mapping{acceptedSuggestions.length > 1 ? 's' : ''} into editor
                                </button>
                            )}
                        </div>
                    )}

                    {/* Empty State */}
                    {result.suggestions.length === 0 && (
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
        </div>
    );
};

export default SuggestedMappingsPanel;

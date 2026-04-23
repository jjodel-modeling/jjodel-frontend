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
import { ProviderModelSelector } from '../../components/common/ProviderModelSelector';
import { MappingAnalysisProgressModal } from '../components/MappingAnalysisProgressModal';
import {
    MappingAnalysisStep,
    MappingAnalysisStepEntry,
} from '../types/suggestions';
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
 * Infer the helper's return type by probing the body for literal shapes.
 * Order per spec: digits → EInt; true/false → EBoolean; quoted strings → EString; fallback EString.
 */
function inferHelperReturnType(body: string): string {
    if (/\b\d+\b/.test(body)) return 'EInt';
    if (/\b(true|false)\b/.test(body)) return 'EBoolean';
    if (/"[^"]*"/.test(body)) return 'EString';
    return 'EString';
}

/**
 * Derive a helper function name from the target attribute name.
 * Rule: if targetAttr ends with 's' AND length > 4, strip the trailing 's' and append 'Count'.
 * Otherwise use targetAttr as-is.
 * Examples: tokens → tokenCount, users → userCount, weight → weight, bus → bus.
 */
function deriveHelperName(targetAttr: string): string {
    if (targetAttr.length > 4 && targetAttr.endsWith('s')) {
        return targetAttr.slice(0, -1) + 'Count';
    }
    return targetAttr;
}

/**
 * Walk the source metamodel tree to determine whether `className` is marked abstract.
 * Returns false if the class is not found or no metamodel is provided — callers should
 * treat an unknown class as concrete to avoid spurious warnings.
 */
function isAbstractSourceClass(
    className: string,
    metamodel: MetamodelElement[] | undefined
): boolean {
    if (!metamodel) return false;
    for (const el of metamodel) {
        if (el.type === 'class' && el.name === className) {
            return !!el.isAbstract;
        }
        if (el.children && isAbstractSourceClass(className, el.children)) return true;
    }
    return false;
}

/**
 * Format a single attribute mapping line in JjTL syntax.
 *
 * Rules:
 *  - LHS empty/missing        → `''` (defensive skip: the LLM can produce mapping entries
 *                               whose target attribute does not exist on the target class;
 *                               emitting them would yield ` := source`, which is unparseable.
 *                               The caller filters empty strings out of the rule body.)
 *  - no hint                  → `target := source`
 *  - hint is `resolve(...)`   → `target := source` (cross-type resolution is implicit in
 *                               JjTL when N=1 rule per source type; the executor handles
 *                               ambiguity when N>1 — the generator never emits resolve())
 *  - hint starts with `if `   → extracted into a helper (always, no length threshold);
 *                               the binding becomes `target := helperName(self)`
 *  - looks like JjEL          → `target := source : <hint>`
 *  - looks like prose         → `target := source -- <hint>` (inline comment)
 */
function formatAttrMapping(attr: MappingSuggestion, helperAccumulator: string[]): string {
    const targetAttr = attr.targetAttribute ?? '';
    const sourceAttr = attr.sourceAttribute ?? '';
    const hint = attr.conversionHint?.trim();

    if (!targetAttr.trim()) return '';

    if (!hint) return `    ${targetAttr} := ${sourceAttr}`;

    if (/^resolve\s*\(/.test(hint)) {
        return `    ${targetAttr} := ${sourceAttr}`;
    }

    if (hint.startsWith('if ')) {
        // Qualify bare references to the source attribute with the helper parameter `s.`
        const body = sourceAttr
            ? hint.replace(new RegExp(`\\b${sourceAttr}\\b`, 'g'), `s.${sourceAttr}`)
            : hint;
        const returnType = inferHelperReturnType(body);
        const helperName = deriveHelperName(targetAttr);
        helperAccumulator.push(
            `helper ${helperName}(s: ${attr.sourceClass}) -> ${returnType} { ${body} }`
        );
        return `    ${targetAttr} := ${helperName}(self)`;
    }

    if (isJjelExpression(hint)) {
        return `    ${targetAttr} := ${sourceAttr} : ${hint}`;
    }
    return `    ${targetAttr} := ${sourceAttr}  -- ${hint}`;
}

/**
 * Generate JjTL code from toInsert mapping suggestions.
 *
 * Grouping: all mappings sharing the same (sourceClass, targetClass) pair collapse into a
 * SINGLE rule block — no duplicate `X -> Y { }` emissions.
 *
 * Abstract source classes: when `sourceMetamodel` is provided, rules whose source class is
 * marked `isAbstract` are suppressed (bindings should live on concrete subclass rules).
 * A `-- <Source> is abstract` marker comment is emitted in their place. When no metamodel
 * is provided, the class is treated as concrete (no false positives).
 *
 * TODO(parent-binding): detect target references with no explicit binding and emit
 * `ref := parent` when the reference's target class matches the class produced by a rule
 * that maps the CONTAINER of the current source class; otherwise emit a TODO comment.
 * NOT IMPLEMENTED: would additionally need the target metamodel tree and the source
 * containment graph. Enriching `MappingSuggestion` upstream is an alternative.
 */
function generateJjtlCode(
    mappings: MappingSuggestion[],
    sourceMetamodel?: MetamodelElement[]
): string {
    if (mappings.length === 0) return '';

    // Group ALL mappings (class-level + attribute-level) by (sourceClass, targetClass).
    const grouped = new Map<string, MappingSuggestion[]>();
    for (const m of mappings) {
        const key = `${m.sourceClass}::${m.targetClass}`;
        if (!grouped.has(key)) grouped.set(key, []);
        grouped.get(key)!.push(m);
    }

    const helpers: string[] = [];
    const rules: string[] = [];

    for (const [key, group] of grouped) {
        const [sourceClass, targetClass] = key.split('::');

        if (isAbstractSourceClass(sourceClass, sourceMetamodel)) {
            rules.push(
                `-- ${sourceClass} is abstract; bindings should be inherited by concrete subclass rules`
            );
            continue;
        }

        const classMapping = group.find(m => !m.sourceAttribute);
        const attrMappings = group.filter(m => m.sourceAttribute);

        let rule = `${sourceClass} -> ${targetClass}`;
        if (classMapping?.guardHint) rule += ` where ${classMapping.guardHint}`;

        if (attrMappings.length > 0) {
            rule += ' {\n';
            for (const attr of attrMappings) {
                const line = formatAttrMapping(attr, helpers);
                if (line) rule += line + '\n';
            }
            rule += '}';
        }

        rules.push(rule);
    }

    let code = rules.join('\n\n');
    if (helpers.length > 0) code += '\n\n' + helpers.join('\n');
    return code;
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
    const [showGrammar, setShowGrammar] = useState(false);
    const [result, setResult] = useState<SuggestionResult | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [internalHoveredId, setInternalHoveredId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Multi-step progress modal state. Populated only in AI mode; the simple-matching
    // fallback path (handleFallbackToSimple) intentionally does NOT open this modal
    // — SimpleMatcher is synchronous and finishes too fast to warrant dialog chrome.
    const [analysisSteps, setAnalysisSteps] = useState<MappingAnalysisStepEntry[]>([]);
    const [showAnalysisModal, setShowAnalysisModal] = useState(false);
    // Wall-clock timestamp used to enforce a 200ms minimum display for each step's
    // "running" state. Avoids flashing of sub-100ms phases (building-prompt, parsing).
    const lastProgressAppliedAtRef = useRef<number>(0);

    // Settings navigation: mirrors the pattern in ProviderSelector, Jodie, and StatusBarRightZone —
    // `useSettingsModalSafe` from `contexts/SettingsModalContext` + `openSettings('providers')`.
    const settingsModal = useSettingsModalSafe();

    // AI provider preference for mappings feature
    const resolvedProvider= AIConfig.getPreferred('mappings');

    // Determine current mode. LocalOption was removed 2026-04-21: Mappings is AI-first.
    // The Grammar tab remains an orthogonal option; AI is the default matcher.
    // Simple matching is still reachable as an error-recovery button (see handleFallbackToSimple).
    const mode: SuggestionMode = useMemo(() => {
        if (showGrammar) return 'grammar';
        return 'ai';
    }, [showGrammar]);

    // Combine internal hover state with external prop
    const hoveredId = hoveredMapping ?? internalHoveredId;

    // Check AI availability
    const isAIAvailable = useMemo(() => JodieConfig.hasEnabledProviders(), []);
    const aiProviderName = useMemo(() => resolvedProvider, [resolvedProvider]);

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

        // Build initial step list. Only AI mode gets the modal; simple mode runs
        // inline (no modal) because SimpleMatcher is sub-second synchronous.
        const providerLabel = resolvedProvider || 'AI';
        const initialSteps: MappingAnalysisStepEntry[] = mode === 'ai' ? [
            { id: 'building-prompt', label: 'Building prompt', status: 'pending' },
            { id: 'calling-ai', label: `Generating with ${providerLabel}`, status: 'pending' },
            { id: 'parsing', label: 'Parsing response', status: 'pending' },
        ] : [];

        if (mode === 'ai') {
            setAnalysisSteps(initialSteps);
            setShowAnalysisModal(true);
            lastProgressAppliedAtRef.current = 0;
        }

        // Applies a progress transition with a 200ms minimum since the last applied
        // transition. This keeps fast phases (building-prompt, parsing) perceivable
        // without lying about the underlying timeline.
        const applyTransition = (mutate: (steps: MappingAnalysisStepEntry[]) => MappingAnalysisStepEntry[]) => {
            const now = Date.now();
            const last = lastProgressAppliedAtRef.current;
            const elapsed = last === 0 ? Infinity : now - last;
            const delay = Math.max(0, 200 - elapsed);
            const scheduledAt = now + delay;
            lastProgressAppliedAtRef.current = scheduledAt;
            if (delay === 0) {
                setAnalysisSteps(mutate);
            } else {
                setTimeout(() => setAnalysisSteps(mutate), delay);
            }
        };

        // onProgress contract: "step X is now starting; any previously running step
        // becomes completed (with `detail` attached to it, if provided)." The final
        // step's completion is applied in the success branch below, when analyze()
        // resolves.
        const onProgress = (step: MappingAnalysisStep, detail?: string) => {
            applyTransition(prev => prev.map(s => {
                if (s.status === 'running') return { ...s, status: 'completed', detail: detail ?? s.detail };
                if (s.id === step) return { ...s, status: 'running' };
                return s;
            }));
        };

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
                    onProgress: mode === 'ai' ? onProgress : undefined,
                }
            );
            if (controller.signal.aborted) return;

            if (mode === 'ai') {
                // Terminal transition: mark the last 'running' step (parsing) as completed
                // with the suggestion count, then auto-close the modal after the 200ms min
                // has elapsed. If analysisResult has an `error`, surface it on the currently
                // running step instead.
                const suggestionCount = analysisResult.suggestions?.length ?? 0;
                if (analysisResult.error) {
                    applyTransition(prev => prev.map(s =>
                        s.status === 'running'
                            ? { ...s, status: 'error', detail: analysisResult.error }
                            : s
                    ));
                } else {
                    applyTransition(prev => prev.map(s =>
                        s.status === 'running'
                            ? { ...s, status: 'completed', detail: `${suggestionCount} suggestions parsed` }
                            : s
                    ));
                    // Give the user a brief moment to see the all-green state before the
                    // modal dismisses (matches the 200ms min transition cadence).
                    setTimeout(() => setShowAnalysisModal(false), 400);
                }
            }
            setResult(analysisResult);
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                if (mode === 'ai') setShowAnalysisModal(false);
                return;
            }
            console.error('[SuggestedMappingsPanel] Analysis error:', error);
            if (mode === 'ai') {
                const message = error?.message ?? 'Unknown error';
                applyTransition(prev => prev.map(s =>
                    s.status === 'running' ? { ...s, status: 'error', detail: message } : s
                ));
            }
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

        // Pass the source metamodel so the generator can suppress rules for abstract classes.
        const sourceMetamodel = getSourceMetamodel ? getSourceMetamodel() : staticSourceMetamodel;
        const code = generateJjtlCode(toInsertSuggestions, sourceMetamodel);
        // console.log('[SuggestedMappingsPanel] Generated JjTL code:', code);

        onInsertCode?.(code);
    }, [toInsertSuggestions, onInsertCode, getSourceMetamodel, staticSourceMetamodel]);

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

            {/* Mode Selector - Provider+Model picker + Grammar button */}
            <div className="mode-selector">
                <ProviderModelSelector
                    feature="mappings"
                    compact
                    onNavigateToSettings={() => settingsModal?.openSettings('providers')}
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
                        <p>
                            Uses AI to find semantic relationships between metamodels.
                            {aiProviderName && <span className="provider-indicator"> ({aiProviderName})</span>}
                        </p>
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

            {/* Multi-step progress modal — rendered only during AI analysis.
                Mounted at panel root (after the main content) so its fixed
                overlay layers above the panel without CSS stacking tricks. */}
            <MappingAnalysisProgressModal
                isOpen={showAnalysisModal}
                steps={analysisSteps}
                onClose={() => setShowAnalysisModal(false)}
                isComplete={analysisSteps.length > 0 && analysisSteps.every(s => s.status === 'completed' || s.status === 'error')}
            />
        </div>
    );
};

export default SuggestedMappingsPanel;

/**
 * MappingSuggestionService - Orchestrates Simple and AI matching
 * Provides a unified interface for getting mapping suggestions
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import {
    MappingSuggestion,
    SuggestionMode,
    SuggestionResult,
    AnalysisProgressCallback
} from '../types/suggestions';
import { SimpleMatcher } from './SimpleMatcher';
import { AIMatcher } from './AIMatcher';
import {JodieConfig, TAIProvider} from "../../types/jodie";

export interface AnalyzeOptions {
    mode: SuggestionMode;
    sourceMetamodelName?: string;
    targetMetamodelName?: string;
    /** Optional: provider selected by the user in the UI. Falls back to the global active provider if omitted. */
    aiProvider?: TAIProvider;
    /** Optional: allows the caller to cancel an in-flight analysis. */
    signal?: AbortSignal;
    /** Optional: progress callback fired at each AI-pipeline phase boundary.
     *  Only invoked in 'ai' mode — SimpleMatcher runs synchronously with no exposed
     *  internal phases. Omitting this preserves legacy behavior fully. */
    onProgress?: AnalysisProgressCallback;
}

export class MappingSuggestionService {
    private simpleMatcher: SimpleMatcher;
    private aiMatcher: AIMatcher;
    private lastResult: SuggestionResult | null = null;

    constructor() {
        this.simpleMatcher = new SimpleMatcher();
        this.aiMatcher = new AIMatcher();
    }

    /**
     * Analyze metamodels and generate suggestions
     */
    async analyze(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        options: AnalyzeOptions
    ): Promise<SuggestionResult> {
        const { mode, sourceMetamodelName, targetMetamodelName, aiProvider, signal, onProgress } = options;

        try {
            let suggestions: MappingSuggestion[];

            if (mode === 'simple') {
                suggestions = this.simpleMatcher.analyze(sourceElements, targetElements);
            } else {
                // AI mode
                if (!JodieConfig.hasEnabledProviders()) {
                    return {
                        mode,
                        suggestions: [],
                        analyzedAt: Date.now(),
                        error: 'AI provider not configured. Please configure an AI provider in Settings.',
                    };
                }

                suggestions = await this.aiMatcher.analyze(
                    sourceElements,
                    targetElements,
                    sourceMetamodelName,
                    targetMetamodelName,
                    aiProvider,
                    signal,
                    onProgress
                );
            }

            this.lastResult = {
                mode,
                suggestions,
                analyzedAt: Date.now(),
            };

            return this.lastResult;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[MappingSuggestionService] Error:', errorMessage);

            return {
                mode,
                suggestions: [],
                analyzedAt: Date.now(),
                error: errorMessage,
                canFallbackToSimple: mode === 'ai' ? true : undefined,
            };
        }
    }

    /**
     * Get the last analysis result
     */
    getLastResult(): SuggestionResult | null {
        return this.lastResult;
    }

    /**
     * Toggle a suggestion between pending and toInsert
     */
    toggleSuggestion(suggestionId: string): void {
        if (!this.lastResult) return;

        const suggestion = this.lastResult.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.status = suggestion.status === 'toInsert' ? 'pending' : 'toInsert';
        }
    }

    /**
     * Mark a suggestion for insertion
     */
    markForInsert(suggestionId: string): void {
        if (!this.lastResult) return;

        const suggestion = this.lastResult.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.status = 'toInsert';
        }
    }

    /**
     * Reject a suggestion (remove from list)
     */
    rejectSuggestion(suggestionId: string): void {
        if (!this.lastResult) return;

        const suggestion = this.lastResult.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.status = 'rejected';
        }
    }

    /**
     * Mark all pending suggestions for insertion
     */
    markAllForInsert(): MappingSuggestion[] {
        if (!this.lastResult) return [];

        const pending = this.lastResult.suggestions.filter(s => s.status === 'pending');

        for (const suggestion of pending) {
            suggestion.status = 'toInsert';
        }

        return pending;
    }

    /**
     * Get pending suggestions
     */
    getPendingSuggestions(): MappingSuggestion[] {
        if (!this.lastResult) return [];
        return this.lastResult.suggestions.filter(s => s.status === 'pending');
    }

    /**
     * Get suggestions marked for insertion
     */
    getToInsertSuggestions(): MappingSuggestion[] {
        if (!this.lastResult) return [];
        return this.lastResult.suggestions.filter(s => s.status === 'toInsert');
    }

    /**
     * Get visible suggestions (not rejected)
     */
    getVisibleSuggestions(): MappingSuggestion[] {
        if (!this.lastResult) return [];
        return this.lastResult.suggestions.filter(s => s.status !== 'rejected');
    }

    /**
     * Clear all results
     */
    clear(): void {
        this.lastResult = null;
    }
}

// Singleton instance
export const mappingSuggestionService = new MappingSuggestionService();

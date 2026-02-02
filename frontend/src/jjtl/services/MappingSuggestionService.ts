/**
 * MappingSuggestionService - Orchestrates Simple and AI matching
 * Provides a unified interface for getting mapping suggestions
 */

import { MetamodelElement } from '../views/MetamodelTreeView';
import {
    MappingSuggestion,
    SuggestionMode,
    SuggestionResult
} from '../types/suggestions';
import { SimpleMatcher } from './SimpleMatcher';
import { AIMatcher } from './AIMatcher';

export interface AnalyzeOptions {
    mode: SuggestionMode;
    sourceMetamodelName?: string;
    targetMetamodelName?: string;
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
     * Check if AI mode is available
     */
    isAIAvailable(): boolean {
        return this.aiMatcher.isAvailable();
    }

    /**
     * Get the active AI provider name
     */
    getAIProviderName(): string | null {
        return this.aiMatcher.getActiveProviderName();
    }

    /**
     * Analyze metamodels and generate suggestions
     */
    async analyze(
        sourceElements: MetamodelElement[],
        targetElements: MetamodelElement[],
        options: AnalyzeOptions
    ): Promise<SuggestionResult> {
        const { mode, sourceMetamodelName, targetMetamodelName } = options;

        try {
            let suggestions: MappingSuggestion[];

            if (mode === 'simple') {
                suggestions = this.simpleMatcher.analyze(sourceElements, targetElements);
            } else {
                // AI mode
                if (!this.isAIAvailable()) {
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
                    targetMetamodelName
                );
            }

            this.lastResult = {
                mode,
                suggestions,
                analyzedAt: Date.now(),
            };

            return this.lastResult;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error('[MappingSuggestionService] Error:', errorMessage);

            return {
                mode,
                suggestions: [],
                analyzedAt: Date.now(),
                error: errorMessage,
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
     * Accept a suggestion (mark as accepted)
     */
    acceptSuggestion(suggestionId: string): void {
        if (!this.lastResult) return;

        const suggestion = this.lastResult.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.accepted = true;
            suggestion.rejected = false;
        }
    }

    /**
     * Reject a suggestion (mark as rejected)
     */
    rejectSuggestion(suggestionId: string): void {
        if (!this.lastResult) return;

        const suggestion = this.lastResult.suggestions.find(s => s.id === suggestionId);
        if (suggestion) {
            suggestion.rejected = true;
            suggestion.accepted = false;
        }
    }

    /**
     * Accept all pending suggestions
     */
    acceptAllPending(): MappingSuggestion[] {
        if (!this.lastResult) return [];

        const pending = this.lastResult.suggestions.filter(
            s => !s.accepted && !s.rejected
        );

        for (const suggestion of pending) {
            suggestion.accepted = true;
        }

        return pending;
    }

    /**
     * Get pending suggestions (not accepted or rejected)
     */
    getPendingSuggestions(): MappingSuggestion[] {
        if (!this.lastResult) return [];
        return this.lastResult.suggestions.filter(s => !s.accepted && !s.rejected);
    }

    /**
     * Get accepted suggestions
     */
    getAcceptedSuggestions(): MappingSuggestion[] {
        if (!this.lastResult) return [];
        return this.lastResult.suggestions.filter(s => s.accepted);
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

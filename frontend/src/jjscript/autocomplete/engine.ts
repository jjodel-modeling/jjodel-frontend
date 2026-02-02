/**
 * JjScript Autocomplete Engine
 * Main entry point for autocomplete functionality
 */

import {
    Suggestion,
    SuggestionProvider,
    AutocompleteContext,
    MetamodelContext,
    AutocompleteOptions,
    DEFAULT_OPTIONS,
} from './types';
import { detectContext } from './context';
import { rankSuggestions, expandSnippet } from './ranking';
import { keywordProvider, metamodelProvider, typeProvider } from './providers';

// ============================================
// AUTOCOMPLETE ENGINE
// ============================================

export class AutocompleteEngine {
    private providers: SuggestionProvider[] = [];
    private options: AutocompleteOptions;
    private recentCommands: string[] = [];
    private metamodelContext: MetamodelContext | null = null;

    constructor(options: AutocompleteOptions = {}) {
        this.options = { ...DEFAULT_OPTIONS, ...options };

        // Register default providers (sorted by priority)
        this.providers = [
            keywordProvider,
            metamodelProvider,
            typeProvider,
        ].sort((a, b) => b.priority - a.priority);
    }

    // ========================================
    // MAIN API
    // ========================================

    /**
     * Get suggestions for the given input at cursor position
     */
    getSuggestions(input: string, cursorPosition?: number): Suggestion[] {
        // Check minimum characters
        const minChars = this.options.minChars ?? 0;
        if (input.length < minChars) {
            return [];
        }

        // Detect context
        const context = detectContext(input, cursorPosition);

        // Collect suggestions from all providers
        const allSuggestions: Suggestion[] = [];

        for (const provider of this.providers) {
            try {
                const suggestions = provider.getSuggestions(context, this.metamodelContext ?? undefined);
                allSuggestions.push(...suggestions);
            } catch (error) {
                console.warn(`[Autocomplete] Provider ${provider.name} failed:`, error);
            }
        }

        // Rank and filter suggestions
        return rankSuggestions(
            allSuggestions,
            context,
            this.options,
            this.recentCommands
        );
    }

    /**
     * Get the current parse context for debugging/UI
     */
    getContext(input: string, cursorPosition?: number): AutocompleteContext {
        return detectContext(input, cursorPosition);
    }

    /**
     * Apply a suggestion to the input
     */
    applySuggestion(
        input: string,
        suggestion: Suggestion,
        cursorPosition?: number
    ): { text: string; cursorPosition: number } {
        const context = detectContext(input, cursorPosition);
        const { wordStart, currentWord } = context;
        const pos = cursorPosition ?? input.length;

        // Handle snippet expansion
        if (suggestion.snippet) {
            const { text: expanded, cursorOffset } = expandSnippet(
                suggestion.snippet,
                context
            );
            const before = input.substring(0, wordStart);
            const after = input.substring(pos);
            return {
                text: before + expanded + after,
                cursorPosition: wordStart + cursorOffset,
            };
        }

        // Regular text replacement
        const insertText = suggestion.text;
        const before = input.substring(0, wordStart);
        const after = input.substring(pos);

        // Add space after if needed
        const needsSpace = !after.startsWith(' ') && !after.startsWith('.') && after.length > 0;
        const finalText = before + insertText + (needsSpace ? ' ' : '') + after;

        return {
            text: finalText,
            cursorPosition: wordStart + insertText.length + (needsSpace ? 1 : 0),
        };
    }

    // ========================================
    // CONFIGURATION
    // ========================================

    /**
     * Update metamodel context for element suggestions
     */
    setMetamodelContext(context: MetamodelContext | null): void {
        this.metamodelContext = context;
    }

    /**
     * Get current metamodel context
     */
    getMetamodelContext(): MetamodelContext | null {
        return this.metamodelContext;
    }

    /**
     * Add a recently used command for recency boosting
     */
    addRecentCommand(command: string): void {
        // Remove if already exists
        const index = this.recentCommands.indexOf(command);
        if (index !== -1) {
            this.recentCommands.splice(index, 1);
        }

        // Add to end (most recent)
        this.recentCommands.push(command);

        // Keep only last 20
        if (this.recentCommands.length > 20) {
            this.recentCommands.shift();
        }
    }

    /**
     * Clear recent commands
     */
    clearRecentCommands(): void {
        this.recentCommands = [];
    }

    /**
     * Register a custom provider
     */
    registerProvider(provider: SuggestionProvider): void {
        this.providers.push(provider);
        this.providers.sort((a, b) => b.priority - a.priority);
    }

    /**
     * Unregister a provider by name
     */
    unregisterProvider(name: string): void {
        this.providers = this.providers.filter(p => p.name !== name);
    }

    /**
     * Update options
     */
    setOptions(options: Partial<AutocompleteOptions>): void {
        this.options = { ...this.options, ...options };
    }

    /**
     * Get current options
     */
    getOptions(): AutocompleteOptions {
        return { ...this.options };
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

let engineInstance: AutocompleteEngine | null = null;

/**
 * Get the singleton autocomplete engine
 */
export function getAutocompleteEngine(): AutocompleteEngine {
    if (!engineInstance) {
        engineInstance = new AutocompleteEngine();
    }
    return engineInstance;
}

/**
 * Reset the singleton (for testing)
 */
export function resetAutocompleteEngine(): void {
    engineInstance = null;
}

// ============================================
// CONVENIENCE FUNCTIONS
// ============================================

/**
 * Get suggestions for input (uses singleton engine)
 */
export function getSuggestions(input: string, cursorPosition?: number): Suggestion[] {
    return getAutocompleteEngine().getSuggestions(input, cursorPosition);
}

/**
 * Apply suggestion to input (uses singleton engine)
 */
export function applySuggestion(
    input: string,
    suggestion: Suggestion,
    cursorPosition?: number
): { text: string; cursorPosition: number } {
    return getAutocompleteEngine().applySuggestion(input, suggestion, cursorPosition);
}

/**
 * Set metamodel context (uses singleton engine)
 */
export function setMetamodelContext(context: MetamodelContext | null): void {
    getAutocompleteEngine().setMetamodelContext(context);
}

/**
 * Add recent command (uses singleton engine)
 */
export function addRecentCommand(command: string): void {
    getAutocompleteEngine().addRecentCommand(command);
}

// ============================================
// EXPORTS
// ============================================

export { detectContext } from './context';
export { rankSuggestions, expandSnippet } from './ranking';

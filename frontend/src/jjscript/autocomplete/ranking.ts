/**
 * Suggestion Ranking System
 * Ranks and filters suggestions based on relevance, recency, and context
 */

import { Suggestion, AutocompleteContext, AutocompleteOptions, DEFAULT_OPTIONS } from './types';

// ============================================
// RANKING SYSTEM
// ============================================

/**
 * Rank and filter suggestions
 */
export function rankSuggestions(
    suggestions: Suggestion[],
    context: AutocompleteContext,
    options: AutocompleteOptions = DEFAULT_OPTIONS,
    recentCommands: string[] = []
): Suggestion[] {
    if (suggestions.length === 0) return [];

    // Apply additional scoring
    const scoredSuggestions = suggestions.map(s => ({
        ...s,
        priority: computeFinalScore(s, context, recentCommands),
    }));

    // Sort by priority (descending)
    scoredSuggestions.sort((a, b) => b.priority - a.priority);

    // Remove duplicates (keep highest priority)
    const seen = new Set<string>();
    const deduplicated = scoredSuggestions.filter(s => {
        const key = `${s.type}:${s.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    // Apply max limit
    const maxSuggestions = options.maxSuggestions ?? DEFAULT_OPTIONS.maxSuggestions ?? 10;
    return deduplicated.slice(0, maxSuggestions);
}

/**
 * Compute final score for a suggestion
 */
function computeFinalScore(
    suggestion: Suggestion,
    context: AutocompleteContext,
    recentCommands: string[]
): number {
    let score = suggestion.priority;

    // Match quality bonus
    score += getMatchQualityBonus(suggestion.text, context.currentWord);

    // Recency bonus for commands
    if (suggestion.type === 'command') {
        score += getRecencyBonus(suggestion.text, recentCommands);
    }

    // Context relevance bonus
    score += getContextRelevanceBonus(suggestion, context);

    // Type-specific bonuses
    score += getTypeBonus(suggestion, context);

    return score;
}

// ============================================
// MATCH QUALITY
// ============================================

/**
 * Bonus based on how well the suggestion matches the filter
 */
function getMatchQualityBonus(text: string, filter: string): number {
    if (!filter) return 0;

    const textLower = text.toLowerCase();
    const filterLower = filter.toLowerCase().replace(/^\//, '');

    // Exact match
    if (textLower === filterLower) return 30;

    // Exact prefix match
    if (textLower.startsWith(filterLower)) {
        // Longer matches get less bonus (more specific = better)
        const ratio = filterLower.length / textLower.length;
        return Math.round(20 * ratio);
    }

    // Word boundary match (e.g., "attr" matches "attribute" better than "abstract")
    const words = textLower.split(/(?=[A-Z])|[-_\s]/);
    for (const word of words) {
        if (word.startsWith(filterLower)) {
            return 15;
        }
    }

    // Contains match
    if (textLower.includes(filterLower)) {
        return 5;
    }

    // Fuzzy match score
    return getFuzzyMatchScore(textLower, filterLower);
}

/**
 * Simple fuzzy match score
 */
function getFuzzyMatchScore(text: string, filter: string): number {
    let filterIdx = 0;
    let matchCount = 0;
    let consecutiveMatches = 0;
    let maxConsecutive = 0;

    for (const char of text) {
        if (filterIdx < filter.length && char === filter[filterIdx]) {
            filterIdx++;
            matchCount++;
            consecutiveMatches++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveMatches);
        } else {
            consecutiveMatches = 0;
        }
    }

    if (filterIdx < filter.length) {
        return 0; // Didn't match all filter characters
    }

    // Score based on consecutive matches and total matches
    return Math.round((maxConsecutive / filter.length) * 10);
}

// ============================================
// RECENCY BONUS
// ============================================

/**
 * Bonus for recently used commands
 */
function getRecencyBonus(text: string, recentCommands: string[]): number {
    const index = recentCommands.indexOf(text);
    if (index === -1) return 0;

    // Most recent gets highest bonus
    const recency = recentCommands.length - index;
    return Math.min(recency * 3, 15);
}

// ============================================
// CONTEXT RELEVANCE
// ============================================

/**
 * Bonus based on context relevance
 */
function getContextRelevanceBonus(suggestion: Suggestion, context: AutocompleteContext): number {
    let bonus = 0;

    // Type matches expected context
    switch (context.parseContext) {
        case 'start':
            if (suggestion.type === 'command') bonus += 10;
            break;
        case 'element_type':
            if (suggestion.type === 'keyword') bonus += 10;
            break;
        case 'target':
            if (['class', 'enum', 'package', 'attribute', 'reference'].includes(suggestion.type)) {
                bonus += 10;
            }
            break;
        case 'type':
            if (suggestion.type === 'type' || suggestion.type === 'class' || suggestion.type === 'enum') {
                bonus += 10;
            }
            break;
        case 'value':
            if (suggestion.type === 'value' || suggestion.type === 'literal') {
                bonus += 10;
            }
            break;
        case 'property':
            if (suggestion.type === 'attribute' || suggestion.type === 'reference') {
                bonus += 10;
            }
            break;
    }

    return bonus;
}

// ============================================
// TYPE-SPECIFIC BONUSES
// ============================================

/**
 * Bonus based on suggestion type and command context
 */
function getTypeBonus(suggestion: Suggestion, context: AutocompleteContext): number {
    const { command, elementType } = context;

    // For create/add commands
    if (command === 'create' || command === 'add') {
        // Boost commonly created elements
        if (suggestion.type === 'keyword' && elementType === undefined) {
            if (suggestion.text === 'class') return 5;
            if (suggestion.text === 'attribute') return 4;
            if (suggestion.text === 'reference') return 3;
        }

        // Boost String type for attributes
        if (elementType === 'attribute' && suggestion.type === 'type') {
            if (suggestion.text === 'String') return 5;
            if (suggestion.text === 'Integer') return 3;
            if (suggestion.text === 'Boolean') return 2;
        }
    }

    // For show/list commands
    if (command === 'show' || command === 'list') {
        if (suggestion.type === 'class') return 5;
        if (suggestion.type === 'package') return 3;
    }

    return 0;
}

// ============================================
// SNIPPET EXPANSION
// ============================================

/**
 * Expand snippet template with placeholder values
 */
export function expandSnippet(snippet: string, context: AutocompleteContext): {
    text: string;
    cursorOffset: number;
} {
    let result = snippet;
    let cursorOffset = snippet.length;

    // Replace placeholders with default values
    const placeholderRegex = /<(\w+)>/g;
    let match;
    let firstPlaceholderPos = -1;

    while ((match = placeholderRegex.exec(snippet)) !== null) {
        const placeholder = match[0];
        const name = match[1];
        const defaultValue = getPlaceholderDefault(name, context);

        if (firstPlaceholderPos === -1) {
            firstPlaceholderPos = match.index;
        }

        result = result.replace(placeholder, defaultValue);
    }

    // Set cursor to first placeholder position
    if (firstPlaceholderPos !== -1) {
        cursorOffset = firstPlaceholderPos;
    }

    return { text: result, cursorOffset };
}

/**
 * Get default value for a placeholder
 */
function getPlaceholderDefault(name: string, context: AutocompleteContext): string {
    switch (name.toLowerCase()) {
        case 'name':
            return context.targetName || 'NewElement';
        case 'type':
            return 'String';
        case 'class':
            return context.parentName || 'ClassName';
        case 'target':
            return context.targetName || 'element';
        default:
            return name;
    }
}

// ============================================
// EXPORTS
// ============================================

export {
    getMatchQualityBonus,
    getFuzzyMatchScore,
    getRecencyBonus,
    getContextRelevanceBonus,
    getTypeBonus,
};

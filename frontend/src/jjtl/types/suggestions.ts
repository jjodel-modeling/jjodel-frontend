/**
 * Types for mapping suggestions
 * Supports both simple (name/type matching) and AI-assisted modes
 */

export type SuggestionMode = 'simple' | 'ai';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export type SuggestionReason =
    | 'same-name-same-type'       // Identical name and type
    | 'same-name-compatible-type' // Same name, compatible type
    | 'similar-name'              // Fuzzy name match
    | 'semantic-match'            // Semantic match (AI)
    | 'structural-match'          // Structural similarity (AI)
    | 'ai-inferred';              // AI inferred

export interface MappingSuggestion {
    id: string;

    // Source
    sourceClass: string;
    sourceAttribute?: string;    // undefined = class-level mapping
    sourceType?: string;

    // Target
    targetClass: string;
    targetAttribute?: string;
    targetType?: string;

    // Metadata
    confidence: SuggestionConfidence;
    reason: SuggestionReason;
    reasonText: string;          // Human readable explanation

    // For conversions
    conversionHint?: string;     // e.g., "true=1, false=0"

    // State
    accepted: boolean;
    rejected: boolean;
}

export interface SuggestionResult {
    mode: SuggestionMode;
    suggestions: MappingSuggestion[];
    analyzedAt: number;
    error?: string;
}

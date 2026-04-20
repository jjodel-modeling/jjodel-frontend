/**
 * Types for mapping suggestions
 * Supports both simple (name/type matching) and AI-assisted modes
 */

export type SuggestionMode = 'simple' | 'ai' | 'grammar';

export type SuggestionConfidence = 'high' | 'medium' | 'low';

export type SuggestionReason =
    | 'same-name-same-type'       // Identical name and type
    | 'same-name-compatible-type' // Same name, compatible type
    | 'similar-name'              // Fuzzy name match
    | 'semantic-match'            // Semantic match (AI)
    | 'structural-match'          // Structural similarity (AI)
    | 'ai-inferred';              // AI inferred

export type MappingStatus = 'pending' | 'toInsert' | 'rejected';

export interface MappingSuggestion {
    id: string;

    // Source (names for display)
    sourceClass: string;
    sourceAttribute?: string;    // undefined = class-level mapping
    sourceType?: string;

    // Source element IDs (for tree node lookup)
    sourceClassId: string;
    sourceAttributeId?: string;

    // Target (names for display)
    targetClass: string;
    targetAttribute?: string;
    targetType?: string;

    // Target element IDs (for tree node lookup)
    targetClassId: string;
    targetAttributeId?: string;

    // Metadata
    confidence: SuggestionConfidence;
    reason: SuggestionReason;
    reasonText: string;          // Human readable explanation

    // For conversions
    conversionHint?: string;     // e.g., "true=1, false=0"
    guardHint?: string;          // e.g., "gender == \"Male\"" — condition for choosing this target subclass

    // State - new checkbox-based workflow
    status: MappingStatus;
}

export interface SuggestionResult {
    mode: SuggestionMode;
    suggestions: MappingSuggestion[];
    analyzedAt: number;
    error?: string;
    /** True when the AI mode errored and the UI can offer to retry with SimpleMatcher. */
    canFallbackToSimple?: boolean;
}

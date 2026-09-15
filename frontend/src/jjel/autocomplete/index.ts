/**
 * JjEL Autocomplete — entry point
 *
 * Sibling engine to JjScript autocomplete. Reuses Suggestion / SuggestionProvider
 * types from `jjscript/autocomplete/types` (intentional explicit dependency:
 * if JjScript types change, breakage is visible here).
 *
 * Public API:
 *   getJjelSuggestions(input, cursor)         -> Suggestion[]
 *   applyJjelSuggestion(input, sug, cursor)   -> { text, cursorPosition }
 */

import type { Suggestion, AutocompleteOptions } from '../../jjscript/autocomplete/types';
import { detectJjelContext, JjelAutocompleteContext, JjelParseContext } from './context';
import { getJjelKeywordSuggestions } from './providers/keyword';
import { getJjelIdentifierSuggestions } from './providers/identifier';
import { getJjelMethodSuggestions } from './providers/method';

const DEFAULT_MAX = 8;

export type { JjelAutocompleteContext, JjelParseContext };

/** Run all providers and rank/dedupe the result. */
export function getJjelSuggestions(
    input: string,
    cursorPosition?: number,
    options?: AutocompleteOptions,
): Suggestion[] {
    const ctx = detectJjelContext(input, cursorPosition);

    const all: Suggestion[] = [
        ...getJjelKeywordSuggestions(ctx),
        ...getJjelIdentifierSuggestions(ctx),
        ...getJjelMethodSuggestions(ctx),
    ];

    // Dedupe by (type, text); keep highest priority on collision.
    const dedup = new Map<string, Suggestion>();
    for (const s of all) {
        const key = `${s.type}:${s.text}`;
        const prev = dedup.get(key);
        if (!prev || s.priority > prev.priority) dedup.set(key, s);
    }

    const ranked = Array.from(dedup.values()).sort((a, b) => b.priority - a.priority);
    const max = options?.maxSuggestions ?? DEFAULT_MAX;
    return ranked.slice(0, max);
}

/**
 * Replace the partial token under the cursor with the suggestion's text.
 * Mirrors the semantics of `jjscript/autocomplete/engine.applySuggestion` but
 * keeps no shared mutable state.
 */
export function applyJjelSuggestion(
    input: string,
    suggestion: Suggestion,
    cursorPosition?: number,
): { text: string; cursorPosition: number } {
    const ctx = detectJjelContext(input, cursorPosition);
    const pos = cursorPosition ?? input.length;

    const before = input.substring(0, ctx.wordStart);
    const after = input.substring(pos);
    const insert = suggestion.text;

    // Don't append a trailing space if the next char is `.` (chained access),
    // a closing bracket, or already a space.
    const nextChar = after.charAt(0);
    const noTrailingSpace = nextChar === '' || nextChar === ' ' || nextChar === '.' || nextChar === ')' || nextChar === ']';
    const trailing = noTrailingSpace ? '' : ' ';

    const text = before + insert + trailing + after;
    return {
        text,
        cursorPosition: ctx.wordStart + insert.length + trailing.length,
    };
}

/** Re-export for consumer convenience. */
export { detectJjelContext };

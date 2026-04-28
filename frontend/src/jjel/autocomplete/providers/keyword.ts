/**
 * JjEL Keyword Provider
 *
 * Suggests JjEL keywords. Set is closed and small; the source of truth is
 * Appendix A (Grammar) of the JjTL & JjEL spec. Multi-token clauses
 * (`such that`, `:`) are presented as single dropdown entries.
 */

import type { Suggestion } from '../../../jjscript/autocomplete/types';
import type { JjelAutocompleteContext } from '../context';

interface JjelKeywordDef {
    /** Text inserted into the input. */
    text: string;
    /** Display label in the dropdown (may differ for multi-token clauses). */
    displayText: string;
    /** Short hint shown to the right. */
    description: string;
}

// Source: Appendix A (Grammar). Multi-token clauses are presented as compact
// dropdown entries with the full token text in `text`.
const JJEL_KEYWORDS: JjelKeywordDef[] = [
    { text: 'forall',    displayText: 'forall',    description: 'Set comprehension' },
    { text: 'exists',    displayText: 'exists',    description: 'Existential quantifier' },
    { text: 'in',        displayText: 'in',        description: 'Iteration source' },
    { text: 'such that', displayText: 'such that', description: 'Filter condition' },
    { text: ':',         displayText: ':',         description: 'Projection' },
    { text: 'do',        displayText: 'do',        description: 'with...do body' },
    { text: 'with',      displayText: 'with',      description: 'Scoped block' },
    { text: 'if',        displayText: 'if',        description: 'Conditional (if/then/else)' },
    { text: 'then',      displayText: 'then',      description: 'Conditional consequent' },
    { text: 'else',      displayText: 'else',      description: 'Conditional alternative' },
    { text: 'implies',   displayText: 'implies',   description: 'Logical implication (right-assoc)' },
    { text: 'and',       displayText: 'and',       description: 'Logical AND' },
    { text: 'or',        displayText: 'or',        description: 'Logical OR' },
    { text: 'not',       displayText: 'not',       description: 'Logical negation' },
    { text: 'is',        displayText: 'is',        description: 'Type check' },
    { text: 'null',      displayText: 'null',      description: 'Null literal' },
    { text: 'true',      displayText: 'true',      description: 'Boolean literal' },
    { text: 'false',     displayText: 'false',     description: 'Boolean literal' },
];

/** Substring/fuzzy-friendly matcher; case-insensitive. */
function keywordMatches(name: string, filter: string): boolean {
    if (!filter) return true;
    return name.toLowerCase().startsWith(filter.toLowerCase());
}

export function getJjelKeywordSuggestions(context: JjelAutocompleteContext): Suggestion[] {
    const { parseContext, currentWord } = context;

    // Keywords are useless after a dot-access — `.then` would be a method, not a keyword.
    if (parseContext === 'after-dot') return [];

    // Inside `forall x in <prefix>` we want collections, not keywords (the keyword would be `such that`,
    // which only makes sense after the source identifier).
    if (parseContext === 'after-forall-in') return [];

    const filter = currentWord.toLowerCase();

    return JJEL_KEYWORDS.filter(kw => keywordMatches(kw.text, filter)).map(kw => ({
        text: kw.text,
        displayText: kw.displayText,
        type: 'keyword',
        description: kw.description,
        // Prefix-match boost so 'fo' lifts 'forall' over fuzzy contains-only hits.
        priority: kw.text.toLowerCase().startsWith(filter) ? 95 : 70,
        icon: 'bi-key',
    }));
}

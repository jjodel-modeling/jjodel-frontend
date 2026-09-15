/**
 * Receiver Kind Inference
 *
 * Pure, conservative classifier for the receiver expression that precedes a
 * `.` in the user's input. The autocomplete method provider uses the result
 * to filter the catalog of built-in methods and reduce visual noise (e.g.
 * `instances.up` should not propose `upperCase`).
 *
 * Static lookups only: no metamodel context, no Redux state. Cases the parser
 * cannot classify confidently fall back to `'unknown'`, which preserves the
 * pre-existing "show everything" behavior of the provider.
 */

/** Top-level Level 1 collection bindings exposed by buildEvalContext. */
const KNOWN_COLLECTION_IDENTIFIERS: ReadonlySet<string> = new Set([
    'instances', 'classes', 'attributes', 'references',
    'enumerations', 'packages',
]);

/** Built-in methods that pluck a single element out of a collection. */
const SINGLE_ITEM_METHODS: ReadonlySet<string> = new Set([
    'first', 'last', 'at',
]);

/** Built-in methods that return a (possibly transformed) collection. */
const COLLECTION_RETURNING_METHODS: ReadonlySet<string> = new Set([
    'filter', 'where', 'select', 'reject', 'sortBy', 'distinct',
]);

const IDENT_CHAR = /[a-zA-Z0-9_$]/;
const IDENT_START = /[a-zA-Z_$]/;

export type ReceiverKind = 'collection' | 'item' | 'unknown';

/** Read backwards an identifier ending at `endExclusive` (exclusive index). */
function readIdentBack(input: string, endExclusive: number): { ident: string; start: number } | null {
    if (endExclusive <= 0) return null;
    let start = endExclusive;
    while (start > 0 && IDENT_CHAR.test(input[start - 1])) start--;
    if (start === endExclusive) return null;
    if (!IDENT_START.test(input[start])) return null;
    return { ident: input.substring(start, endExclusive), start };
}

/**
 * Infer the kind of value that precedes the `.` at `dotPos` in `input`.
 *
 * Rules (in order):
 *   1. Identifier ending at `.` matches KNOWN_COLLECTION_IDENTIFIERS -> 'collection'.
 *   2. Method-call (or zero-arg identifier form) named in SINGLE_ITEM_METHODS -> 'item'.
 *   3. Method-call (or zero-arg identifier form) named in COLLECTION_RETURNING_METHODS -> 'collection'.
 *   4. Generic identifier not in any lookup -> 'item' (conservative: most metamodel
 *      class names and selected elements are single items, not collections).
 *   5. Anything else (e.g. trailing `]`, complex expression we cannot parse) -> 'unknown'.
 */
export function inferReceiverKind(input: string, dotPos: number): ReceiverKind {
    if (dotPos < 0 || dotPos >= input.length || input[dotPos] !== '.') return 'unknown';

    // Step over `?` of a null-safe `?.` so the receiver parsing starts before it.
    let i = dotPos - 1;
    if (i >= 0 && input[i] === '?') i--;

    if (i < 0) return 'unknown';

    // Method-call form: receiver ends with `)`. Walk back to the matching `(`,
    // then read the identifier immediately before it.
    if (input[i] === ')') {
        let depth = 1;
        i--;
        while (i >= 0 && depth > 0) {
            const ch = input[i];
            if (ch === ')') depth++;
            else if (ch === '(') depth--;
            i--;
        }
        if (depth !== 0) return 'unknown';
        // i now points at the char before the matching `(`.
        const ident = readIdentBack(input, i + 1);
        if (!ident) return 'unknown';
        if (SINGLE_ITEM_METHODS.has(ident.ident)) return 'item';
        if (COLLECTION_RETURNING_METHODS.has(ident.ident)) return 'collection';
        return 'item';
    }

    // Identifier form (also covers the dual zero-arg form, e.g. `instances.first.`).
    const ident = readIdentBack(input, i + 1);
    if (!ident) return 'unknown';
    if (KNOWN_COLLECTION_IDENTIFIERS.has(ident.ident)) return 'collection';
    if (SINGLE_ITEM_METHODS.has(ident.ident)) return 'item';
    if (COLLECTION_RETURNING_METHODS.has(ident.ident)) return 'collection';

    // Rule 4: generic identifier (top-level binding or chained property access)
    // assumes a single-item value. Treats unknown identifiers as items, which is
    // the more common case in MDE expressions.
    return 'item';
}

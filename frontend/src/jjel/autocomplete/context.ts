/**
 * JjEL Autocomplete Context Detection
 *
 * Minimal, intentionally small parser for the four states that cover the
 * common autocomplete cases. More states (after `such that`, after `:`,
 * after `with`) will be added when concrete needs emerge.
 *
 * States:
 *   - 'after-dot':       cursor right after `.` or `?.`             → method provider
 *   - 'after-forall-in': cursor inside `forall <id> in <prefix>`    → identifier (collection)
 *   - 'partial-word':    cursor mid-identifier                       → keyword + identifier (filtered by prefix)
 *   - 'top-level':       anything else                               → keyword + identifier (no prefix filter)
 */

export type JjelParseContext =
    | 'top-level'
    | 'after-dot'
    | 'after-forall-in'
    | 'partial-word';

export interface JjelAutocompleteContext {
    /** Full input string. */
    input: string;
    /** Cursor position. */
    cursorPosition: number;
    /** Current word fragment under the cursor (lowercased filter applied). */
    currentWord: string;
    /** Start position of the current word (used for replacement). */
    wordStart: number;
    /** Whether the dot-access is null-safe (`?.`). Only meaningful in 'after-dot'. */
    nullSafeDot: boolean;
    /** Detected state. */
    parseContext: JjelParseContext;
}

const IDENT_CHAR = /[a-zA-Z0-9_$]/;
const IDENT_START = /[a-zA-Z_$]/;

/** Walk back from position to find the start of the current identifier (if any). */
function findCurrentWord(text: string, cursorPos: number): { currentWord: string; wordStart: number } {
    let start = cursorPos;
    while (start > 0 && IDENT_CHAR.test(text[start - 1])) start--;
    return {
        currentWord: text.substring(start, cursorPos),
        wordStart: start,
    };
}

/** Read backwards across whitespace from `pos`; returns the index of the first non-space char (-1 if none). */
function skipWhitespaceBack(text: string, pos: number): number {
    let i = pos - 1;
    while (i >= 0 && /\s/.test(text[i])) i--;
    return i;
}

/** Read backwards an identifier ending at `endExclusive`; returns the identifier and its start (or null if no identifier ends there). */
function readIdentBack(text: string, endExclusive: number): { ident: string; start: number } | null {
    if (endExclusive <= 0) return null;
    let start = endExclusive;
    while (start > 0 && IDENT_CHAR.test(text[start - 1])) start--;
    if (start === endExclusive) return null;
    if (!IDENT_START.test(text[start])) return null;
    return { ident: text.substring(start, endExclusive), start };
}

export function detectJjelContext(input: string, cursorPosition?: number): JjelAutocompleteContext {
    const pos = cursorPosition ?? input.length;
    const before = input.substring(0, pos);

    const { currentWord, wordStart } = findCurrentWord(before, pos);

    // (1) after-dot: char immediately before the current word (skipping no whitespace —
    // a space between `.` and an identifier would make this no longer a member access)
    // is `.` or `?.`.
    if (wordStart > 0 && before[wordStart - 1] === '.') {
        const nullSafe = wordStart >= 2 && before[wordStart - 2] === '?';
        return {
            input,
            cursorPosition: pos,
            currentWord,
            wordStart,
            nullSafeDot: nullSafe,
            parseContext: 'after-dot',
        };
    }

    // (2) after-forall-in: pattern `forall <ident> in <prefix?>` ending at cursor.
    // Walk back: skip the partial word (already in currentWord), then check structure.
    // We require: <whitespace>+ in <whitespace>+ <ident> <whitespace>+ forall, ending at wordStart.
    const beforeWord = before.substring(0, wordStart);
    if (/\s$/.test(beforeWord) || wordStart === 0 ? false : true) {
        // Continue to check structure regardless; no need for the regex above.
    }
    {
        // Skip whitespace before the partial word.
        let i = skipWhitespaceBack(beforeWord, beforeWord.length);
        if (i >= 0) {
            // Expect 'in' keyword ending at i+1.
            const inTok = readIdentBack(beforeWord, i + 1);
            if (inTok && inTok.ident.toLowerCase() === 'in') {
                // Skip whitespace before 'in'.
                let j = skipWhitespaceBack(beforeWord, inTok.start);
                if (j >= 0) {
                    // Expect the iterator identifier.
                    const iter = readIdentBack(beforeWord, j + 1);
                    if (iter && iter.ident.toLowerCase() !== 'in' && iter.ident.toLowerCase() !== 'forall') {
                        // Skip whitespace before the iterator.
                        let k = skipWhitespaceBack(beforeWord, iter.start);
                        if (k >= 0) {
                            const head = readIdentBack(beforeWord, k + 1);
                            if (head && head.ident.toLowerCase() === 'forall') {
                                return {
                                    input,
                                    cursorPosition: pos,
                                    currentWord,
                                    wordStart,
                                    nullSafeDot: false,
                                    parseContext: 'after-forall-in',
                                };
                            }
                        }
                    }
                }
            }
        }
    }

    // (3) partial-word: cursor strictly inside an identifier (currentWord non-empty).
    if (currentWord.length > 0) {
        return {
            input,
            cursorPosition: pos,
            currentWord,
            wordStart,
            nullSafeDot: false,
            parseContext: 'partial-word',
        };
    }

    // (4) top-level: anything else (start of input or right after whitespace/operator).
    return {
        input,
        cursorPosition: pos,
        currentWord,
        wordStart,
        nullSafeDot: false,
        parseContext: 'top-level',
    };
}

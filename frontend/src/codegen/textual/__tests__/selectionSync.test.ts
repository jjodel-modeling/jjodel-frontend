/**
 * Lane E2a (P-2026-11-07-0746; R-TXT-54 E4, E5, E6): the pure half of text to canvas selection. The object at the caret
 * is the innermost carried span; the same id is not sent twice; only a click or an arrow key selects, not typing, not a
 * programmatic move.
 */

import { describe, expect, it } from 'vitest';
import { CARET_EXPLICIT, innermostSpanAt, isUserCaretMove, nextSelected } from '../selectionSync';
import type { ObjectSpan } from '../printer';

// `Family f { members: [ Member a { name = "x" } Member b ] }` as spans: a root, two children, a reference inside a.
//            0         1         2         3         4         5
//            0123456789012345678901234567890123456789012345678901234567
const TEXT = 'Family f { members: [ Member a { name = "x" } Member b ] }';
const ROOT: ObjectSpan = { id: 'f', start: 0, end: TEXT.length };
const A: ObjectSpan = { id: 'a', start: TEXT.indexOf('Member a'), end: TEXT.indexOf('}') + 1 };
const B: ObjectSpan = { id: 'b', start: TEXT.indexOf('Member b'), end: TEXT.indexOf('Member b') + 'Member b'.length };
const SPANS = [ROOT, A, B];

describe('innermostSpanAt', () => {
    it('gives the innermost span holding the offset, the parent first in the list', () => {
        expect(innermostSpanAt(SPANS, TEXT.indexOf('name'))?.id).toBe('a');
        expect(innermostSpanAt(SPANS, TEXT.indexOf('b ]') )?.id).toBe('b');
    });

    it('does not depend on the order of the spans', () => {
        expect(innermostSpanAt([B, A, ROOT], TEXT.indexOf('name'))?.id).toBe('a');
        expect(innermostSpanAt([A, ROOT, B], TEXT.indexOf('members'))?.id).toBe('f');
    });

    it('gives the container when the caret is between its children (E4, a new object not yet applied)', () => {
        expect(innermostSpanAt(SPANS, TEXT.indexOf('members'))?.id).toBe('f');
        expect(innermostSpanAt(SPANS, TEXT.indexOf('] }'))?.id).toBe('f');
    });

    it('gives the owner of a reference token, never its target (E5)', () => {
        const ref = TEXT.indexOf('"x"');
        expect(innermostSpanAt(SPANS, ref)?.id).toBe('a');
    });

    it('counts a caret right after an object as in it, the span that starts there first', () => {
        expect(innermostSpanAt(SPANS, A.end)?.id).toBe('a');
        const left: ObjectSpan = { id: 'l', start: 0, end: 4 };
        const right: ObjectSpan = { id: 'r', start: 4, end: 8 };
        expect(innermostSpanAt([left, right], 4)?.id).toBe('r');
        expect(innermostSpanAt([right, left], 4)?.id).toBe('r');
    });

    it('gives the shorter of two spans that start at the same offset', () => {
        const outer: ObjectSpan = { id: 'o', start: 0, end: 10 };
        const inner: ObjectSpan = { id: 'i', start: 0, end: 4 };
        expect(innermostSpanAt([outer, inner], 2)?.id).toBe('i');
        expect(innermostSpanAt([inner, outer], 2)?.id).toBe('i');
    });

    it('gives null outside every span, and with no spans (E4, objects without a span)', () => {
        expect(innermostSpanAt([A, B], 2)).toBeNull();
        expect(innermostSpanAt([], 0)).toBeNull();
        expect(innermostSpanAt([A], TEXT.length)).toBeNull();
    });

    it('skips a collapsed span, a decoration the edit deleted', () => {
        const gone: ObjectSpan = { id: 'gone', start: 30, end: 30 };
        expect(innermostSpanAt([ROOT, gone], 30)?.id).toBe('f');
    });
});

describe('nextSelected', () => {
    it('sends a new id', () => {
        expect(nextSelected(null, 'a')).toBe('a');
        expect(nextSelected('a', 'b')).toBe('b');
    });

    it('does not send the same id twice', () => {
        expect(nextSelected('a', 'a')).toBeNull();
    });

    it('sends nothing for no object', () => {
        expect(nextSelected('a', null)).toBeNull();
        expect(nextSelected(null, null)).toBeNull();
    });
});

describe('isUserCaretMove', () => {
    it('lets a click and an arrow key through', () => {
        expect(isUserCaretMove({ source: 'mouse', reason: CARET_EXPLICIT })).toBe(true);
        expect(isUserCaretMove({ source: 'keyboard', reason: CARET_EXPLICIT })).toBe(true);
    });

    it('drops typing: a keyboard move with no explicit reason', () => {
        expect(isUserCaretMove({ source: 'keyboard', reason: 0 })).toBe(false);
    });

    it('drops a paste, an undo and a redo', () => {
        expect(isUserCaretMove({ source: 'keyboard', reason: 4 })).toBe(false);
        expect(isUserCaretMove({ source: 'keyboard', reason: 5 })).toBe(false);
        expect(isUserCaretMove({ source: 'keyboard', reason: 6 })).toBe(false);
    });

    it('drops a programmatic setPosition, a setValue and a reprint', () => {
        expect(isUserCaretMove({ source: 'api', reason: 0 })).toBe(false);
        expect(isUserCaretMove({ source: 'api', reason: CARET_EXPLICIT })).toBe(false);
        expect(isUserCaretMove({ source: 'model', reason: 1 })).toBe(false);
        expect(isUserCaretMove({ source: 'restoreState', reason: 0 })).toBe(false);
        expect(isUserCaretMove({ source: 'textual-paths', reason: 0 })).toBe(false);
    });
});

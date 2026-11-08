/**
 * Lane D6 (P-2026-11-08-2330, R-TXT-42): the pure part of the pinned hover card. The links' strings are the hover's as they
 * were before the card (R-TXT-39 (3)), byte for byte; the rest is what the widget asks of the editor's layout and of Tab.
 */

import { describe, it, expect } from 'vitest';
import { cardLimits, cardLineInView, cardTabTarget, hoverCard, hoverLinks, hoverLinksMarkdown, pointerClearOfHover } from '../hoverCard';
import type { HoverCardAnalysis, HoverCardLines } from '../hoverCard';
import type { TextRange } from '../languageService';

/** A line every hundred offsets, 1-based. */
const linesOf = (texts: Record<number, string> = {}): HoverCardLines => ({
    lineOf: offset => Math.floor(offset / 100) + 1,
    textOf: line => texts[line] ?? `use ${line}`,
});
const analysis = (definition: TextRange | null, references: readonly TextRange[]): HoverCardAnalysis => ({
    definitionAt: () => definition,
    referencesAt: () => [...references],
    hoverAt: () => null,
});
const refsOnLines = (first: number, n: number): TextRange[] =>
    Array.from({ length: n }, (_, i) => ({ start: (first + i - 1) * 100 + 5, end: (first + i - 1) * 100 + 9 }));
const md = (a: HoverCardAnalysis, lines: HoverCardLines = linesOf()): string[] =>
    hoverLinksMarkdown(hoverLinks(a, 0, lines), (label, offset) => `[${label}](c:${offset})`);

describe('hoverLinksMarkdown: the strings the hover has always shown', () => {
    it('writes the definition and one link per line that uses the reference', () => {
        expect(md(analysis({ start: 205, end: 209 }, refsOnLines(5, 2)))).toEqual([
            '[Go to definition](c:205) · line 3',
            'Used on 2 lines:  \n[line 5](c:405) `use 5`  \n[line 6](c:505) `use 6`',
        ]);
    });

    it('says "1 line" in the singular', () => {
        expect(md(analysis(null, refsOnLines(5, 1)))).toEqual(['Used on 1 line:  \n[line 5](c:405) `use 5`']);
    });

    it('stops at twelve lines and counts the rest', () => {
        const [only] = md(analysis(null, refsOnLines(1, 14)));
        const rows = only.split('  \n');
        expect(rows[0]).toBe('Used on 14 lines:');
        expect(rows).toHaveLength(14);
        expect(rows[12]).toBe('[line 12](c:1105) `use 12`');
        expect(rows[13]).toBe('and 2 more lines');
    });

    it('takes one reference per line, the first', () => {
        const refs = [{ start: 105, end: 109 }, { start: 150, end: 154 }];
        expect(md(analysis(null, refs))).toEqual(['Used on 1 line:  \n[line 2](c:105) `use 2`']);
    });

    it('cuts a line over 40 characters to 39 and an ellipsis, trims, and keeps its backticks out', () => {
        const long = 'x'.repeat(41);
        const exact = 'y'.repeat(40);
        const [only] = md(analysis(null, refsOnLines(1, 3)), linesOf({ 1: `  ${long}  `, 2: exact, 3: 'a`b' }));
        expect(only.split('  \n').slice(1)).toEqual([
            `[line 1](c:5) \`${'x'.repeat(39)}…\``,
            `[line 2](c:105) \`${exact}\``,
            "[line 3](c:205) `a'b`",
        ]);
    });

    it('writes nothing where there is neither a definition nor a use', () => {
        expect(md(analysis(null, []))).toEqual([]);
    });
});

describe('hoverLinks: the data the card shows', () => {
    it('carries the definition with its line, and the uses', () => {
        const l = hoverLinks(analysis({ start: 205, end: 209 }, refsOnLines(5, 1)), 0, linesOf());
        expect(l).toEqual({ definition: { at: 205, line: 3 }, uses: [{ line: 5, at: 405, text: 'use 5' }], usedOn: 1 });
    });

    it('caps the uses at twelve and keeps the total', () => {
        const l = hoverLinks(analysis(null, refsOnLines(1, 14)), 0, linesOf());
        expect(l.uses).toHaveLength(12);
        expect(l.usedOn).toBe(14);
    });
});

describe('hoverCard', () => {
    it('is the hover anchored at its start, with its links', () => {
        const a: HoverCardAnalysis = { ...analysis({ start: 205, end: 209 }, []), hoverAt: () => ({ start: 7, end: 11, contents: ['a', 'b'] }) };
        expect(hoverCard(a, 9, linesOf())).toEqual({ start: 7, contents: ['a', 'b'], links: { definition: { at: 205, line: 3 }, uses: [], usedOn: 0 } });
    });

    it('is nothing where the hover is nothing', () => {
        expect(hoverCard(analysis(null, []), 9, linesOf())).toBeNull();
    });
});

describe('cardLineInView', () => {
    const ranges = [{ startLineNumber: 1, endLineNumber: 10 }, { startLineNumber: 20, endLineNumber: 30 }];

    it('is true on the lines of any range, their ends included', () => {
        for (const line of [1, 10, 20, 25, 30]) expect(cardLineInView(line, ranges, 400)).toBe(true);
    });

    it('is false before, between and after the ranges', () => {
        for (const line of [0, 11, 15, 31]) expect(cardLineInView(line, ranges, 400)).toBe(false);
    });

    it('gives no verdict on an editor of no height: a hidden dock panel does not close the card', () => {
        expect(cardLineInView(99, [], 0)).toBe(true);
    });
});

describe('cardLimits', () => {
    it('caps a card in a large editor', () => {
        expect(cardLimits({ contentWidth: 1200, height: 800, lineHeight: 19 })).toEqual({ maxWidth: 480, maxHeight: 320 });
    });

    it('never exceeds the width of the text', () => {
        expect(cardLimits({ contentWidth: 300, height: 800, lineHeight: 19 }).maxWidth).toBe(300);
    });

    it('takes half the height left by the line, so above or below always fits', () => {
        expect(cardLimits({ contentWidth: 800, height: 301, lineHeight: 20 }).maxHeight).toBe(140);
    });

    it('keeps a readable floor on a very short editor', () => {
        expect(cardLimits({ contentWidth: 800, height: 100, lineHeight: 20 }).maxHeight).toBe(96);
    });
});

describe('cardTabTarget', () => {
    it('goes forward and wraps to the first', () => {
        expect(cardTabTarget(0, 3, false)).toBe(1);
        expect(cardTabTarget(2, 3, false)).toBe(0);
    });

    it('goes back and wraps to the last', () => {
        expect(cardTabTarget(2, 3, true)).toBe(1);
        expect(cardTabTarget(0, 3, true)).toBe(2);
    });

    it('enters from the card itself at either end', () => {
        expect(cardTabTarget(-1, 3, false)).toBe(0);
        expect(cardTabTarget(-1, 3, true)).toBe(2);
    });
});

describe('pointerClearOfHover: when the pointer has left the hover the pin came from', () => {
    const from = { x: 100, y: 100 };

    it('is not clear at the place the pointer started from, nor at the distance itself', () => {
        expect(pointerClearOfHover(from, from)).toBe(false);
        expect(pointerClearOfHover(from, { x: 500, y: 100 })).toBe(false);
    });

    it('is clear past the distance, on either axis or on both', () => {
        expect(pointerClearOfHover(from, { x: 501, y: 100 })).toBe(true);
        expect(pointerClearOfHover(from, { x: 100, y: 501 })).toBe(true);
        expect(pointerClearOfHover(from, { x: 400, y: 400 })).toBe(true);
    });
});

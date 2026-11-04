/**
 * Step C3a of the textual notation (P-2026-11-04-0345; R-TXT-16 (2), report docs/discovery/discovery_2026-11-04_textual_step_c.md
 * §4): the Pascal/Ada style of the catalog beside C-like. D4: a line break in a string under a doubling style prints as a
 * joined character code, `'line1'#10'line2'`, which the lexer reads back. Then the whole corpus, per style: print, parse,
 * print byte for byte, and a switch of style leaves the model as it is, measured by an empty diff.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { parseText, tokenizeText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE, PASCAL_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { GARAGE, grammarOf } from './corpus';
import { objectsOf } from './spec';
import type { Spec } from './spec';

const PASCAL_LOWER: NotationStyle = { ...PASCAL_STYLE, id: 'pascal-lower', classCase: 'lower', literalCase: 'lower' };

/** One engine with a `note`, printed under `style`: the note's token as printed. */
const NOTE: Spec = { classes: [{ name: 'Engine', attributes: [{ name: 'note', type: 'EString' }] }], enums: {}, objects: [] };
const noteToken = (note: string, style: NotationStyle = PASCAL_STYLE): string => {
    const g = grammarOf(NOTE, style);
    const text = printTextModel(g, [{ id: 'e', cls: 'Engine', slots: { note } }]).text;
    const m = /note (?::= )?(.*?);?\n/.exec(text);
    return m ? m[1] : text;
};
const strings = (text: string, style: NotationStyle = PASCAL_STYLE) => {
    const { tokens, errors } = tokenizeText(text, grammarOf(NOTE, style));
    return { values: tokens.filter(t => t.k === 'STR').map(t => t.v), errors: errors.map(e => e.message) };
};

describe('D4: a line break in a doubling-style string', () => {
    it('prints as a joined character code, the first piece always quoted (mutants: the newline left raw; a leading code with no quote)', () => {
        expect(noteToken('line1\nline2 "q"')).toBe(`'line1'#10'line2 "q"'`);
        expect(noteToken('\nb')).toBe(`''#10'b'`);
        expect(noteToken('a\n')).toBe(`'a'#10`);
        expect(noteToken('a\n\nb')).toBe(`'a'#10#10'b'`);
        expect(noteToken('a\r\nb')).toBe(`'a'#13#10'b'`);
        expect(noteToken('it\'s\n')).toBe(`'it''s'#10`);
        expect(noteToken('')).toBe(`''`);
    });

    it('the C-like print is unchanged: backslash escapes (mutant: the join applied to every style)', () => {
        expect(noteToken('line1\nline2 "q"', CLIKE_STYLE)).toBe('"line1\\nline2 \\"q\\""');
    });

    it('the lexer reads the pieces and codes back as one string (mutants: the lexer stops at the closing quote; the code read as text)', () => {
        for (const v of ['line1\nline2 "q"', '\nb', 'a\n', 'a\n\nb', 'a\r\nb', 'it\'s\n', '', 'tab\there']) {
            const tok = noteToken(v);
            expect(strings(`Engine begin note := ${tok}; end;`)).toEqual({ values: [v], errors: [] });
        }
        expect(strings(`Engine begin note := 'a'#9'b'#65; end;`).values).toEqual(['a\tbA']);
    });

    it('nothing may stand between the pieces; a code joins only after a string; a code out of range is an error (mutants: whitespace skipped inside the join; "#" with no digit taken)', () => {
        expect(strings(`Engine begin note := 'a' #10; end;`)).toEqual({ values: ['a'], errors: ['unexpected character "#"'] });
        expect(strings(`Engine begin note := 'a'#; end;`)).toEqual({ values: ['a'], errors: ['unexpected character "#"'] });
        expect(strings(`Engine begin note := #10; end;`).errors).toEqual(['unexpected character "#"']);
        expect(strings(`Engine begin note := 'a'#1114112'b'; end;`)).toEqual({ values: ['ab'], errors: ['character code #1114112 is out of range'] });
        expect(strings(`Engine begin note := 'a'#10'b; end;`).errors).toEqual(['unterminated string']);
    });

    it('the C-like lexer joins nothing (mutant: the join applied to every style)', () => {
        expect(strings('Engine { note "a"#10 }', CLIKE_STYLE)).toEqual({ values: ['a'], errors: ['unexpected character "#"'] });
    });

    it('the garage round-trips byte for byte in Pascal/Ada, in both cases (mutant: the newline left raw, F16)', () => {
        for (const style of [PASCAL_STYLE, PASCAL_LOWER]) {
            const g = grammarOf(GARAGE, style);
            const text = printTextModel(g, objectsOf(GARAGE)).text;
            expect(text).toContain(`'line1'#10'line2 "q"'`);
            const r = parseText(text, g);
            expect(r.errors).toEqual([]);
            expect(printTextModel(g, r.objects).text).toBe(text);
        }
    });
});

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
import { CLIKE_STYLE, PASCAL_STYLE, styleOf } from '../style';
import type { StyleBase } from '../style';
import { diffText, planTextEdit } from '../textDiff';
import type { SyntaxAnnotations } from '../annotations';
import { textualNotation } from '../syntaxRecord';
import type { NotationStyle } from '../style';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, NON_DIAMOND } from './corpus';
import { nearleyGrammarOf, parseCount } from './oracle';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';
import { LIBRARY_IDS, LIBRARY_MM, libraryObjects, mutantsOf, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

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

describe('a keyword-less feature under Pascal/Ada', () => {
    const SUBSETS = { E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] } };
    const print = (record: SyntaxAnnotations): string => printTextModel(textualNotation(LIBRARY_MM, { record, issues: [] }, LIBRARY_IDS).grammar, libraryObjects(4, 2)).text;

    it('prints its value with no assign token, plain and in a grouping (mutants: the assign kept on the plain path; kept on the grouping path)', () => {
        const plain = print({ v: 1, features: { A_Book_genre: { keyword: '' } }, style: { base: 'pascal' } });
        expect(plain).toContain('\n      FICTION;\n');
        expect(plain).not.toMatch(/^\s*:=/m);
        const grouped = print({ v: 1, features: { A_Book_genre: { keyword: '' }, R_Lib_books: { groupBy: 'A_Book_genre' } }, enums: SUBSETS, style: { base: 'pascal' } });
        expect(grouped).toMatch(/^\s*FICTION;$/m);
        expect(grouped).not.toMatch(/^\s*:=/m);
    });

    it('the C-like print of a keyword-less feature is unchanged (mutant: a terminator dropped with the assign)', () => {
        expect(print({ v: 1, features: { A_Book_genre: { keyword: '' } } })).toMatch(/^\s*FICTION$/m);
    });
});

// Item 4: the whole corpus per style, the style check's cases and the tolerant parser's seven.
const BASES: readonly StyleBase[] = ['clike', 'pascal', 'indent'];
const lowerOf = (style: NotationStyle): NotationStyle => ({ ...style, id: `${style.id}-lower`, classCase: 'lower', literalCase: 'lower' });
const corpusOf = (base: StyleBase): TolerantCase[] => {
    const style = styleOf(base);
    const spec = (name: string, sp: Spec, st: NotationStyle): TolerantCase => ({ name, mm: metamodelOf(sp), g: grammarOf(sp, st), objects: objectsOf(sp) });
    return [
        spec('the 1709 fixture', FIXTURE, style), spec('a diamond', DIAMOND, style), spec('a multiple inheritance without a diamond', NON_DIAMOND, style),
        spec('the garage', GARAGE, style), spec('a nameless recursive class', BOX, style), spec('a single containment', INNER, style),
        spec('two class keywords one case apart', CASES, style), spec('the garage, lower case', GARAGE, lowerOf(style)),
        spec('the fixture, lower case', FIXTURE, lowerOf(style)), spec('two class keywords, lower case', CASES, lowerOf(style)),
        ...tolerantCases(base).map(c => ({ ...c, name: `tolerant: ${c.name}` })),
    ];
};
const PER_STYLE = BASES.flatMap(b => corpusOf(b).map(c => [b, c.name, c] as const));

describe('the whole corpus, per style', () => {
    it('each case is derived in the style it names (mutant: the base dropped from the tolerant records)', () => {
        for (const b of BASES) for (const c of corpusOf(b)) expect(c.g.style.string.escape, `${b} ${c.name}`).toBe(styleOf(b).string.escape);
    });

    it.each(PER_STYLE)('%s, %s: print, parse with no error, print byte for byte (mutant: the newline left raw)', (_, __, c) => {
        const text = printTextModel(c.g, c.objects).text;
        const r = parseText(text, c.g);
        expect(r.errors).toEqual([]);
        expect(printTextModel(c.g, r.objects).text).toBe(text);
    });

    it.each(PER_STYLE)('%s, %s: a switch to this style leaves the model unchanged, its diff is empty (mutant: a reserved word read as a name, both guards dropped)', (_, __, c) => {
        const print = printTextModel(c.g, c.objects);
        const parsed = parseText(print.text, c.g);
        const d = diffText({ mm: c.mm, grammar: c.g, model: c.objects, parsed, previous: print.spans });
        expect(d.ops).toEqual([]);
        expect(d.unsupported).toEqual([]);
    });
});

describe('the tolerant corpus under Pascal/Ada and under indentation', () => {
    it.each([...tolerantCases('pascal'), ...tolerantCases('indent')].map(c => [c.name, c] as const))('%s: every mutant outside the language has a syntax error, and its diff is null (oracle)', (_, c) => {
        const { mutants } = mutantsOf(c);
        const ng = nearleyGrammarOf(c.g);
        const print = printTextModel(c.g, c.objects);
        let outside = 0;
        for (const mu of mutants) {
            let n = 0;
            try { n = parseCount(c.g, mu.text, ng); } catch { n = 0; }
            if (n > 0) continue;
            outside++;
            const parsed = parseText(mu.text, c.g);
            expect(parsed.errors.some(e => !(e as { secondary?: boolean }).secondary), mu.text).toBe(true);
            const plan = planTextEdit({ mm: c.mm, grammar: c.g, model: c.objects, parsed, unprinted: [], previous: print.spans });
            expect(plan.diff).toBeNull();
        }
        // Indentation has no delimiter to lose: more of its cuts are texts of the language (F18), so a third, not a half.
        expect(outside).toBeGreaterThan(mutants.length / (c.g.style.layout === 'indent' ? 3 : 2));
    });

    it('a Pascal string and ":=" are one mutant token each (mutant: the C-like cut on a Pascal print)', () => {
        const c = tolerantCases('pascal').find(x => x.name === 'garage, pascal')!;
        const { text, mutants } = mutantsOf(c);
        const at = text.indexOf(`'line1'#10'line2 "q"'`);
        expect(mutants.some(m => m.kind === 'delete' && m.at === at && m.removed === `'line1'#10'line2 "q"'`.length)).toBe(true);
        const assign = text.indexOf(':=');
        expect(mutants.some(m => m.kind === 'delete' && m.at === assign && m.removed === 2)).toBe(true);
    });
});

describe('a reserved word is no name under Pascal/Ada', () => {
    const g = grammarOf(INNER, PASCAL_STYLE);
    const names = (text: string) => { const r = parseText(text, g); return { errors: r.errors.map(e => e.message), names: r.objects.map(o => o.slots.name ?? null) }; };

    it('an unnamed object with an empty body reads "begin" as its body (mutants: "begin" taken as a name on entering the optional name; taken by the name terminal)', () => {
        expect(names('Room begin end;\n')).toEqual({ errors: [], names: [null] });
        expect(names('Room begin\n  inner begin\n    Room begin end;\n  end;\nend;\n').errors).toEqual([]);
    });

    it('a bare reserved word in a required name is an error (mutant: taken by the name terminal)', () => {
        const lines = textualNotation(LIBRARY_MM, { record: { v: 1, classes: { C_Mem: { layout: 'line' } }, style: { base: 'pascal' } }, issues: [] }, LIBRARY_IDS).grammar;
        const text = printTextModel(lines, [{ id: 'l', cls: 'Library', slots: { name: 'city', members: ['m'] } }, { id: 'm', cls: 'Member', slots: { name: 'begin' } }]).text;
        expect(text).toContain(`    Member 'begin'\n`);
        expect(parseText(text, lines).errors).toEqual([]);
        expect(parseText(text.replace(`'begin'`, 'begin'), lines).errors[0].message).toBe('expected a name; found name "begin"');
    });

    it('a name equal to a reserved word is quoted and reads back (a guard: the printer quotes it)', () => {
        const text = printTextModel(g, [{ id: 'r', cls: 'Room', slots: { name: 'begin' } }]).text;
        expect(text).toBe(`Room 'begin' begin end;`);
        expect(names(text)).toEqual({ errors: [], names: ['begin'] });
    });
});

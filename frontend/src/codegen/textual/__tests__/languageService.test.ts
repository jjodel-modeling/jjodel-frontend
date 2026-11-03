/**
 * Step B1 of the textual IDE (P-2026-11-03-2350, P-2026-11-04-0020; R-TXT-34 step B, R-TXT-38): the language service of
 * the Text tab, one query at a time on the non-hardware corpus of step A, a broken text among them.
 */

import { describe, it, expect } from 'vitest';
import { analyzeText, SEMANTIC_MODIFIERS, SEMANTIC_ROLES, UNKNOWN_CONTAINER } from '../languageService';
import type { SemanticToken, TextAnalysis, TextSymbol } from '../languageService';
import type { TextMetamodel } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import { GARAGE, grammarOf } from './corpus';
import { metamodelOf, objectsOf } from './spec';
import { libraryObjects, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

const CASES = tolerantCases();
const [LIB, LIB_ANNOTATED, LIB_LINES, TS_PLAIN] = CASES;

const analyse = (c: TolerantCase, text: string, mm: TextMetamodel = c.mm): TextAnalysis => analyzeText(text, parseText(text, c.g), c.g, mm);
const printOf = (c: TolerantCase): string => printTextModel(c.g, c.objects).text;
/** The offset of the `nth` occurrence of `needle`. */
const at = (text: string, needle: string, nth = 0): number => {
    let i = -1;
    for (let k = 0; k <= nth; k++) {
        i = text.indexOf(needle, i + 1);
        if (i < 0) throw new Error(`no ${nth}th ${needle}`);
    }
    return i;
};
/** `word:role[+modifier...]`, as the text reads. */
const show = (text: string, ts: readonly SemanticToken[]): string[] => ts.map(t => `${text.slice(t.start, t.end)}:${t.role}${t.modifiers.map(m => '+' + m).join('')}`);
const tokenAt = (a: TextAnalysis, offset: number): SemanticToken | undefined => a.tokens.find(t => t.start === offset);
const flat = (ss: readonly TextSymbol[]): TextSymbol[] => ss.flatMap(s => [s, ...flat(s.children)]);
const tree = (ss: readonly TextSymbol[]): unknown[] => ss.map(s => [s.name, s.feature ?? null, ...(s.children.length ? [tree(s.children)] : [])]);

describe('semantic tokens', () => {
    it.each(CASES.map(c => [c.name, c] as const))('%s: in text order, disjoint, inside the text, every reference resolved', (_, c) => {
        const text = printOf(c);
        const a = analyse(c, text);
        expect(a.tokens.length).toBeGreaterThan(0);
        for (let i = 0; i < a.tokens.length; i++) {
            const t = a.tokens[i];
            expect(t.start).toBeLessThan(t.end);
            expect(t.end).toBeLessThanOrEqual(text.length);
            if (i) expect(a.tokens[i - 1].end).toBeLessThanOrEqual(t.start);
            expect(t.modifiers).not.toContain('unresolved');
        }
    });

    it('library, plain: class keywords are types, names declarations, feature keywords features, values by kind', () => {
        const text = printOf(LIB);
        expect(show(text, analyse(LIB, text).tokens).slice(0, 15)).toEqual([
            'Library:type', 'city:name+declaration', 'books:feature', 'Book:type', 'book0:name+declaration', 'genre:feature', 'FICTION:literal',
            'Book:type', 'book1:name+declaration', 'genre:feature', 'SCIENCE:literal', 'year:feature', '1901:number', 'borrowedBy:feature', 'reader1:reference',
        ]);
    });

    it('library, lines: a renamed keyword, the name\'s included, is a feature', () => {
        const text = printOf(LIB_LINES);
        const a = analyse(LIB_LINES, text);
        expect(show(text, a.tokens).slice(0, 7)).toEqual(['shelf:type', 'city:name+declaration', 'books:feature', 'Book:type', 'FICTION:literal', 'titled:feature', 'book0:name+declaration']);
        expect(tokenAt(a, at(text, 'by reader1'))?.role).toBe('feature');
    });

    it('a word the style uses as punctuation is a keyword', () => {
        const g = grammarOf(GARAGE, { ...CLIKE_STYLE, id: 'begin-end', blockOpen: ['begin'], blockClose: ['end'], emptyBlock: ['begin', 'end'] });
        const c: TolerantCase = { name: 'garage, begin-end', mm: metamodelOf(GARAGE), g, objects: objectsOf(GARAGE) };
        const text = printOf(c);
        const a = analyse(c, text);
        expect(show(text, a.tokens).slice(0, 3)).toEqual(['Car:type', 'alpha:name+declaration', 'begin:keyword']);
        expect(a.tokens.filter(t => t.role === 'keyword').map(t => text.slice(t.start, t.end))).toEqual(expect.arrayContaining(['begin', 'end']));
    });

    it('turnstile: strings, positional references and unnamed objects', () => {
        const text = printOf(TS_PLAIN);
        const a = analyse(TS_PLAIN, text);
        expect(tokenAt(a, at(text, '"model.[paid]"'))?.role).toBe('string');
        expect(tokenAt(a, at(text, '"model.[coins] := 0"'))?.role).toBe('string');
        expect(tokenAt(a, at(text, 'State[0]'))).toMatchObject({ role: 'reference', modifiers: [] });
        expect(tokenAt(a, at(text, 'Transition'))?.role).toBe('type');
    });

    it('a reference that names nothing is unresolved; an outer one is outer', () => {
        const text = printOf(LIB);
        const broken = text.replace('borrowedBy reader1', 'borrowedBy nobody');
        expect(tokenAt(analyse(LIB, broken), at(broken, 'nobody'))).toMatchObject({ role: 'reference', modifiers: ['unresolved'] });
        const outer = text.replace('borrowedBy reader1', 'borrowedBy @"m9"');
        expect(tokenAt(analyse(LIB, outer), at(outer, '"m9"'))).toMatchObject({ role: 'reference', modifiers: ['outer'] });
    });

    it('comments are tokens of their own, merged in text order', () => {
        const text = '// a\n// b\n' + printOf(LIB).replace('genre FICTION', 'genre FICTION /* x\n y */');
        const a = analyse(LIB, text);
        expect(show(text, a.tokens).slice(0, 9)).toEqual([
            '// a:comment', '// b:comment', 'Library:type', 'city:name+declaration', 'books:feature', 'Book:type', 'book0:name+declaration', 'genre:feature', 'FICTION:literal',
        ]);
        expect(show(text, a.tokens)[9]).toBe('/* x\n y */:comment');
    });

    it('the encoding is the tokens, five numbers each, a block comment cut at each line end', () => {
        const text = '// a\n' + printOf(LIB).replace('genre FICTION', 'genre FICTION /* x\n y */');
        const a = analyse(LIB, text);
        const lines = text.split('\n');
        const data = a.encodedTokens();
        expect(data.length % 5).toBe(0);
        const decoded: string[] = [];
        let line = 0;
        let col = 0;
        for (let i = 0; i < data.length; i += 5) {
            col = data[i] ? data[i + 1] : col + data[i + 1];
            line += data[i];
            const mods = SEMANTIC_MODIFIERS.filter((_, b) => data[i + 4] & (1 << b));
            decoded.push(`${lines[line].slice(col, col + data[i + 2])}:${SEMANTIC_ROLES[data[i + 3]]}${mods.map(m => '+' + m).join('')}`);
        }
        const expected = show(text, a.tokens).flatMap(s => (s.startsWith('/* x') ? ['/* x:comment', ' y */:comment'] : [s]));
        expect(decoded).toEqual(expected);
        expect(a.encodedTokens()).toBe(data);
    });
});

describe('document symbols', () => {
    it('library, plain: nesting, features and name ranges', () => {
        const text = printOf(LIB);
        const a = analyse(LIB, text);
        expect(tree(a.symbols)).toEqual([['city', null, [
            ['book0', 'books'], ['book1', 'books'], ['book2', 'books'], ['book3', 'books'], ['book4', 'books'], ['book5', 'books'],
            ['reader0', 'members'], ['reader1', 'members'], ['reader2', 'members'],
        ]]]);
        const book1 = flat(a.symbols).find(s => s.name === 'book1')!;
        expect(text.slice(book1.nameStart, book1.nameEnd)).toBe('book1');
        expect(text.slice(book1.start, book1.end)).toMatch(/^Book book1 \{[^}]*\}$/);
        expect(book1).toMatchObject({ kind: 'object', cls: 'Book', named: true, recovered: false, unclosed: false });
        expect(book1.id).toBe(parseText(text, LIB.g).objects.find(o => o.slots.name === 'book1')?.id);
    });

    it('library, annotated: objects inside group blocks still nest under their feature', () => {
        const a = analyse(LIB_ANNOTATED, printOf(LIB_ANNOTATED));
        expect(flat(a.symbols).filter(s => s.cls === 'Book').map(s => s.feature)).toEqual(Array(6).fill('books'));
        expect(flat(a.symbols).filter(s => s.cls === 'Member').map(s => s.feature)).toEqual(Array(3).fill('members'));
    });

    it('turnstile: an unnamed object is shown by its class and selects its class keyword', () => {
        const text = printOf(TS_PLAIN);
        const a = analyse(TS_PLAIN, text);
        expect(a.symbols.map(s => s.name)).toEqual(['Initial', 'State', 'Terminal', 'coin', 'push', 'stop']);
        const t = a.symbols[0].children[0];
        expect(t).toMatchObject({ name: 'Transition', named: false, feature: 'transitions' });
        expect(text.slice(t.nameStart, t.nameEnd)).toBe('Transition');
    });

    it('a broken root: its objects sit in the `unknown container` group, recovered', () => {
        const text = printOf(LIB).replace(/^Library /, '');
        const a = analyse(LIB, text);
        expect(a.symbols).toHaveLength(1);
        const g = a.symbols[0];
        expect(g).toMatchObject({ kind: 'unknown', name: UNKNOWN_CONTAINER, named: false, recovered: true });
        expect(g.id).toBeUndefined();
        expect(g.children.map(s => s.name)).toEqual(['book0', 'book1', 'book2', 'book3', 'book4', 'book5', 'reader0', 'reader1', 'reader2']);
        expect(g.children.every(s => s.recovered)).toBe(true);
    });

    it('a block left open: the enclosing objects are unclosed, an object read in part is recovered only', () => {
        const text = printOf(LIB);
        const truncated = text.slice(0, at(text, 'year 1903'));
        const a = analyse(LIB, truncated);
        const by = Object.fromEntries(flat(a.symbols).map(s => [s.name, [s.recovered, s.unclosed]]));
        expect(by).toEqual({ city: [true, true], book0: [true, true], book1: [true, false], book2: [true, true], book3: [true, true] });
        const missing = text.replace('Book book1 {', 'Book book1');
        expect(flat(analyse(LIB, missing).symbols).filter(s => s.recovered).map(s => s.name)).toEqual(['book1']);
    });
});

describe('folding ranges', () => {
    it('library, plain: every block folds and keeps its close visible', () => {
        expect(analyse(LIB, printOf(LIB)).folds).toEqual([
            { startLine: 1, endLine: 31 }, { startLine: 2, endLine: 25 }, { startLine: 3, endLine: 4 }, { startLine: 6, endLine: 9 },
            { startLine: 11, endLine: 12 }, { startLine: 14, endLine: 16 }, { startLine: 18, endLine: 20 }, { startLine: 22, endLine: 24 },
            { startLine: 27, endLine: 30 },
        ]);
    });

    it('library, lines: one-line objects do not fold, their blocks do', () => {
        expect(analyse(LIB_LINES, printOf(LIB_LINES)).folds).toEqual([{ startLine: 1, endLine: 14 }, { startLine: 2, endLine: 8 }, { startLine: 10, endLine: 13 }]);
    });

    it('an open block folds to its last line; a run of own-line comments folds as a comment', () => {
        const text = printOf(LIB);
        const truncated = text.slice(0, at(text, 'year 1903'));
        expect(analyse(LIB, truncated).folds.slice(0, 2)).toEqual([{ startLine: 1, endLine: 15 }, { startLine: 2, endLine: 15 }]);
        const commented = '// a\n// b\n' + text.replace('genre FICTION', 'genre FICTION // trailing');
        const folds = analyse(LIB, commented).folds;
        expect(folds[0]).toEqual({ startLine: 1, endLine: 2, kind: 'comment' });
        expect(folds.filter(f => f.kind === 'comment')).toHaveLength(1);
    });
});

describe('definition and references', () => {
    const text = printOf(LIB);
    const a = analyse(LIB, text);
    const declared = at(text, 'Member reader1') + 'Member '.length;

    it('a reference goes to the name of the object it names', () => {
        const d = a.definitionAt(at(text, 'reader1') + 3);
        expect(d).toEqual({ start: declared, end: declared + 'reader1'.length });
        expect(a.definitionAt(at(text, 'borrowedBy'))).toBeNull();
        expect(a.definitionAt(at(text, 'book1'))).toBeNull();
    });

    it('an unnamed target: the definition is its class keyword', () => {
        const ts = printOf(TS_PLAIN);
        const d = analyse(TS_PLAIN, ts).definitionAt(at(ts, 'State[0]'));
        expect(d).toEqual({ start: at(ts, '\nState {') + 1, end: at(ts, '\nState {') + 1 + 'State'.length });
    });

    it('references from the declaration or from a reference, the name first when asked', () => {
        const refs = [at(text, 'reader1', 0), at(text, 'reader1', 1)].map(s => ({ start: s, end: s + 7 }));
        expect(a.referencesAt(declared, false)).toEqual(refs);
        expect(a.referencesAt(refs[1].start, true)).toEqual([{ start: declared, end: declared + 7 }, ...refs]);
        expect(a.referencesAt(at(text, 'reader0'), true)).toEqual([{ start: at(text, 'reader0'), end: at(text, 'reader0') + 7 }]);
        expect(a.referencesAt(at(text, 'genre'), true)).toEqual([]);
    });

    it('a reference that names nothing, or names an object outside the text, has no definition', () => {
        const broken = text.replace('borrowedBy reader1', 'borrowedBy nobody');
        expect(analyse(LIB, broken).definitionAt(at(broken, 'nobody'))).toBeNull();
        const outer = text.replace('borrowedBy reader1', 'borrowedBy @"m9"');
        expect(analyse(LIB, outer).definitionAt(at(outer, '"m9"'))).toBeNull();
    });
});

describe('hover', () => {
    const text = printOf(LIB);
    const DOCUMENTED: TextMetamodel = {
        ...LIB.mm,
        classes: LIB.mm.classes.map(c => (c.name !== 'Book' ? c : {
            ...c, doc: 'A book of the library.',
            attributes: c.attributes?.map(f => (f.name === 'year' ? { ...f, lower: 0, upper: 1, doc: 'The year of print.' } : f)),
            references: c.references?.map(f => ({ ...f, lower: 0, upper: -1 })),
        })),
        enumerations: [{ ...LIB.mm.enumerations[0], doc: 'What a book is about.', literalDocs: { POETRY: 'Verse.' } }],
    };

    it('on a class keyword or a name: the object, its class and where it sits', () => {
        const h = analyse(LIB, text).hoverAt(at(text, 'book1'))!;
        expect(h).toMatchObject({ start: at(text, 'book1'), end: at(text, 'book1') + 5 });
        expect(h.contents).toEqual(['**book1** : `Book`', 'class `Book`', 'in `books` of `city`']);
        expect(analyse(LIB, text, DOCUMENTED).hoverAt(at(text, 'Book book1'))!.contents).toEqual(['**book1** : `Book`', 'class `Book`', 'A book of the library.', 'in `books` of `city`']);
    });

    it('on a feature keyword or a value: the feature, its type and its bounds where the metamodel declares them', () => {
        expect(analyse(LIB, text).hoverAt(at(text, 'year'))!.contents).toEqual(['`year` : `EInt` single-valued', 'attribute of `Book`']);
        expect(analyse(LIB, text, DOCUMENTED).hoverAt(at(text, '1901'))!.contents).toEqual(['`year` : `EInt` `[0..1]`', 'attribute of `Book`', 'The year of print.']);
        expect(analyse(LIB, text).hoverAt(at(text, 'books'))!.contents).toEqual(['`books` : `Book` many-valued', 'containment of `Library`']);
    });

    it('on a reference: what it names, then the feature', () => {
        const r = at(text, 'reader1');
        const line = text.slice(0, at(text, 'Member reader1')).split('\n').length;
        expect(analyse(LIB, text, DOCUMENTED).hoverAt(r)!).toEqual({
            start: r, end: r + 7, contents: [`names **reader1** : \`Member\`, line ${line}`, '`borrowedBy` : `Member` `[0..*]`', 'reference of `Book`'],
        });
        const broken = text.replace('borrowedBy reader1', 'borrowedBy nobody');
        expect(analyse(LIB, broken).hoverAt(at(broken, 'nobody'))!.contents[0]).toMatch(/^names nothing in the text/);
        const outer = text.replace('borrowedBy reader1', 'borrowedBy @"m9"');
        expect(analyse(LIB, outer).hoverAt(at(outer, '"m9"'))!.contents[0]).toBe('names `m9`, an object outside the text');
    });

    it('on a literal: its enumeration, the literals and the documentation', () => {
        expect(analyse(LIB, text, DOCUMENTED).hoverAt(at(text, 'POETRY'))!.contents).toEqual([
            '`POETRY` : enumeration `Genre`', 'literals `FICTION`, `POETRY`, `SCIENCE`, `HISTORY`', 'Verse.', 'What a book is about.',
        ]);
    });

    it('on a recovered object: it says so; between tokens: nothing', () => {
        const missing = text.replace('Book book1 {', 'Book book1');
        expect(analyse(LIB, missing).hoverAt(at(missing, 'book1'))!.contents).toContain('recovered from a broken text: shown, never applied');
        expect(analyse(LIB, text).hoverAt(at(text, '\n  books') + 1)).toBeNull();
    });
});

describe('measured', () => {
    /** The least of seven runs: the noise of a shared machine only adds time. */
    const best = (f: () => void): number => {
        let least = Infinity;
        for (let i = 0; i < 7; i++) { const s = performance.now(); f(); least = Math.min(least, performance.now() - s); }
        return least;
    };

    it('1,000 objects: a parse and the analysis within the 50 ms budget per keystroke (measured)', () => {
        const text = printTextModel(LIB.g, libraryObjects(833, 166)).text;
        const p = parseText(text, LIB.g);
        expect(p.objects).toHaveLength(1000);
        const a = analyzeText(text, p, LIB.g, LIB.mm);
        expect(flat(a.symbols)).toHaveLength(1000);
        const parse = best(() => parseText(text, LIB.g));
        const analysis = best(() => analyzeText(text, p, LIB.g, LIB.mm).encodedTokens());
        expect(parse + analysis, `parse ${parse.toFixed(1)} ms, analysis ${analysis.toFixed(1)} ms`).toBeLessThan(50);
    });

    it('6,000 objects: figures, and every object a symbol (measured)', () => {
        const text = printTextModel(LIB.g, libraryObjects(5000, 999)).text;
        const p = parseText(text, LIB.g);
        const a = analyzeText(text, p, LIB.g, LIB.mm);
        expect(flat(a.symbols)).toHaveLength(6000);
        const parse = best(() => parseText(text, LIB.g));
        const analysis = best(() => analyzeText(text, p, LIB.g, LIB.mm).encodedTokens());
        // A guard against a blow-up, not a budget: the figures are the result (#205: no time ratio).
        expect(analysis, `6,000 objects: parse ${parse.toFixed(1)} ms, analysis ${analysis.toFixed(1)} ms`).toBeLessThan(1000);
    }, 60_000);
});

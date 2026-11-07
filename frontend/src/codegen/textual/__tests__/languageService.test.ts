/**
 * Step B1 of the textual IDE (P-2026-11-03-2350, P-2026-11-04-0020; R-TXT-34 step B, R-TXT-38): the language service of
 * the Text tab, one query at a time on the non-hardware corpus of step A, a broken text among them.
 */

import { describe, it, expect, vi } from 'vitest';
import type * as Monaco from 'monaco-editor';
import type { ConcreteGrammar } from '../concreteGrammar';
import { analyzeText, completionsAt, renameEdits, renameLocation, SEMANTIC_MODIFIERS, SEMANTIC_ROLES, UNKNOWN_CONTAINER } from '../languageService';
import type { SemanticToken, TextAnalysis, TextRenameEdit, TextSymbol } from '../languageService';
import type { TextMetamodel } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE, STYLE_CATALOG } from '../style';
import { openTextualSession, registerTextualMonaco, TEXTUAL_LANGUAGE_ID } from '../ui/textualMonaco';
import { GARAGE, grammarOf } from './corpus';
import { portGrammar, PORT_MM } from './portCorpus';
import { metamodelOf, objectsOf } from './spec';
import { libraryObjects, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

// The Monaco adapter's theme imports `joiner` (textualMonaco.ts header): the bench gives it empty rules.
vi.mock('../../../jjscript/editor/jjscriptLanguage', () => ({ jjscriptThemeRules: () => [] }));
vi.mock('../../../jjtl/editor/jjtlTheme', () => ({ jjtlTheme: { rules: [] } }));

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
        expect(show(text, a.tokens).slice(0, 5)).toEqual(['Car:type', 'alpha:name+declaration', 'begin:keyword', 'speed:feature', '1.5:number']);
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
        // No token runs past its line's end.
        line = 0;
        col = 0;
        for (let i = 0; i < data.length; i += 5) {
            col = data[i] ? data[i + 1] : col + data[i + 1];
            line += data[i];
            expect(col + data[i + 2]).toBeLessThanOrEqual(lines[line].length);
        }
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
        // A trailing comment on the next line ends the run: one own-line comment does not fold.
        const trailing = '// a\n' + text.replace('Library city {', 'Library city { // t');
        expect(analyse(LIB, trailing).folds.filter(f => f.kind === 'comment')).toEqual([]);
    });
});

describe('definition and references', () => {
    const text = printOf(LIB);
    const a = analyse(LIB, text);
    const declared = at(text, 'Member reader1') + 'Member '.length;

    it('a reference goes to the name of the object it names', () => {
        const d = a.definitionAt(at(text, 'reader1') + 3);
        expect(d).toEqual({ start: declared, end: declared + 'reader1'.length });
        // The caret just after the word still names it.
        expect(a.definitionAt(at(text, 'reader1') + 'reader1'.length)).toEqual(d);
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

describe('D2c: the completion provider of the Text tab (report §3.3 C4)', () => {
    const KIND = { Keyword: 17, EnumMember: 16, Reference: 21 };
    const providers = new Map<string, any>();
    const fakeMonaco = {
        Emitter: class { event = () => ({ dispose: () => {} }); fire(): void {} },
        Range: class { constructor(readonly startLineNumber: number, readonly startColumn: number, readonly endLineNumber: number, readonly endColumn: number) {} },
        languages: new Proxy({ CompletionItemKind: KIND, CompletionTriggerKind: { Invoke: 0, TriggerCharacter: 1 }, SymbolKind: {}, FoldingRangeKind: {} } as Record<string, unknown>, {
            get: (t, k: string) => k in t ? t[k] : (id: string, p: unknown) => { if (/^register.*Provider$/.test(k) && id === TEXTUAL_LANGUAGE_ID) providers.set(k, p); },
        }),
        editor: { registerCommand: () => {}, defineTheme: () => {}, getEditors: () => [] },
    };
    registerTextualMonaco(fakeMonaco as unknown as typeof Monaco);
    const provider = providers.get('registerCompletionItemProvider');

    /** A model over `text`: offsets and 1-based positions as Monaco's. */
    const modelOf = (text: string): Monaco.editor.ITextModel => {
        const starts = [0, ...[...text].flatMap((ch, i) => (ch === '\n' ? [i + 1] : []))];
        return {
            uri: { toString: () => `inmemory://${text.length}` },
            getVersionId: () => 1,
            getValue: () => text,
            getOffsetAt: (p: Monaco.IPosition) => starts[p.lineNumber - 1] + p.column - 1,
            getPositionAt: (o: number) => {
                let l = 0;
                while (l + 1 < starts.length && starts[l + 1] <= o) l++;
                return { lineNumber: l + 1, column: o - starts[l] + 1 };
            },
        } as unknown as Monaco.editor.ITextModel;
    };
    const INVOKE = { triggerKind: 0 };
    /** The provider's suggestions at the `⎸` of `marked`, on a model with a session over `g` and `mm`, and the model. */
    const suggestAt = (g: ConcreteGrammar | null, mm: TextMetamodel, marked: string, context: object = INVOKE) => {
        const at = marked.indexOf('⎸');
        const text = marked.replace('⎸', '');
        const model = modelOf(text);
        const session = g === undefined ? null : openTextualSession(model, { base: () => (g ? { grammar: g, mm } : null), keep: () => undefined });
        const out = provider.provideCompletionItems(model, model.getPositionAt(at), context);
        session?.dispose();
        return { suggestions: out.suggestions as Monaco.languages.CompletionItem[], model, text, at };
    };
    /** What the provider must give for `completionsAt`: kind, label, range, in the parser's order. */
    const expected = (g: ConcreteGrammar, mm: TextMetamodel, model: Monaco.editor.ITextModel, text: string, at: number) =>
        completionsAt(text, at, g, mm).map(c => {
            const a = model.getPositionAt(c.start);
            const b = model.getPositionAt(c.end);
            return {
                label: c.label,
                kind: { keyword: KIND.Keyword, literal: KIND.EnumMember, reference: KIND.Reference }[c.kind],
                range: [a.lineNumber, a.column, b.lineNumber, b.column],
                doc: c.doc ? c.doc.join('\n\n') : undefined,
            };
        });
    const shownOf = (s: readonly Monaco.languages.CompletionItem[]) => s.map(x => {
        const r = x.range as Monaco.IRange;
        return {
            label: x.label, kind: x.kind, range: [r.startLineNumber, r.startColumn, r.endLineNumber, r.endColumn],
            doc: (x.documentation as Monaco.IMarkdownString | undefined)?.value,
        };
    });

    it('is registered with the style punctuation as trigger characters, no letter among them', () => {
        expect(provider).toBeDefined();
        const triggers: string[] = provider.triggerCharacters;
        expect(triggers.length).toBeGreaterThan(0);
        expect(triggers.every(t => t.length === 1 && !/\w|\s/.test(t))).toBe(true);
        for (const s of Object.values(STYLE_CATALOG)) for (const p of [...s.blockOpen, s.list.open, s.list.separator]) if (!/^\w/.test(p)) expect(triggers).toContain(p.slice(-1));
    });

    it('inside a block: the keywords of completionsAt, in its order, on the cursor', () => {
        const g = portGrammar();
        const { suggestions, model, text, at } = suggestAt(g, PORT_MM, 'Module cpu {\n  input instr : Word(32)\n  ⎸\n}');
        expect(suggestions.map(s => s.label).sort()).toEqual(['=', 'input', 'output', '}']);
        expect(suggestions.every(s => s.kind === KIND.Keyword)).toBe(true);
        expect(shownOf(suggestions)).toEqual(expected(g, PORT_MM, model, text, at));
        // Monaco sorts by `sortText`: the parser's order stays.
        const sorts = suggestions.map(s => s.sortText ?? '');
        expect(sorts.every((t, i) => t !== '' && (i === 0 || sorts[i - 1] < t))).toBe(true);
    });

    it("after ':' on a word begun: the types, replacing the word", () => {
        const g = portGrammar();
        const { suggestions, model, text, at } = suggestAt(g, PORT_MM, 'Module cpu {\n  input instr : Wo⎸\n}');
        expect(suggestions.map(s => s.label).sort()).toEqual(['Bool', 'Word']);
        expect(shownOf(suggestions).every(s => s.range[1] === 17 && s.range[3] === 19)).toBe(true);
        expect(shownOf(suggestions)).toEqual(expected(g, PORT_MM, model, text, at));
    });

    it('references and literals: their kinds, the literal with its hover as documentation', () => {
        const g = grammarOf(GARAGE);
        const mm = metamodelOf(GARAGE);
        const printed = printTextModel(g, objectsOf(GARAGE)).text;
        const cut = (head: string, value: string): string => {
            const k = printed.indexOf(head + value);
            return printed.slice(0, k + head.length) + '⎸' + printed.slice(k + head.length + value.length);
        };
        const refs = suggestAt(g, mm, cut('best ', 'Car[0].wheels[0]'));
        expect(refs.suggestions.length).toBeGreaterThan(0);
        expect(refs.suggestions.every(s => s.kind === KIND.Reference)).toBe(true);
        expect(shownOf(refs.suggestions)).toEqual(expected(g, mm, refs.model, refs.text, refs.at));
        const lits = suggestAt(g, mm, cut('colors [', 'Red'));
        const lit = shownOf(lits.suggestions).filter(s => s.kind === KIND.EnumMember);
        expect(lit.map(s => s.label)).toEqual(['Red', 'GREEN', 'blue']);
        expect(lit[0].doc).toBeTruthy();
        expect(shownOf(lits.suggestions)).toEqual(expected(g, mm, lits.model, lits.text, lits.at));
    });

    it('nothing without a session, or with a session that has no reading', () => {
        expect(suggestAt(undefined as never, PORT_MM, 'Module cpu {\n  ⎸\n}').suggestions).toEqual([]);
        expect(suggestAt(null, PORT_MM, 'Module cpu {\n  ⎸\n}').suggestions).toEqual([]);
    });

    it("a trigger character that is not the reading's style punctuation offers nothing", () => {
        const g = portGrammar();
        const marked = 'Module cpu {\n  input instr : Word(32)\n  ⎸\n}';
        expect(suggestAt(g, PORT_MM, marked, { triggerKind: 1, triggerCharacter: ';' }).suggestions).toEqual([]);
        expect(suggestAt(g, PORT_MM, marked, { triggerKind: 1, triggerCharacter: '{' }).suggestions.length).toBeGreaterThan(0);
    });

});

describe('D4: safe rename (report §5, decision D4)', () => {
    const text = printOf(LIB);
    const declared = at(text, 'Member reader1') + 'Member '.length;
    const uses = [at(text, 'reader1', 0), at(text, 'reader1', 1)];
    const apply = (t: string, edits: readonly TextRenameEdit[]): string => [...edits].sort((a, b) => b.start - a.start).reduce((s, e) => s.slice(0, e.start) + e.text + s.slice(e.end), t);
    const editsOf = (r: ReturnType<typeof renameEdits>): readonly TextRenameEdit[] => {
        if ('refused' in r) throw new Error(`refused: ${r.refused}`);
        return r.edits;
    };
    const refusalOf = (r: ReturnType<typeof renameEdits> | ReturnType<typeof renameLocation>): string => ('refused' in r ? r.refused : '');
    /** The name each reference of `t` names, in text order. */
    const named = (t: string, g: ConcreteGrammar = LIB.g): unknown[] => {
        const p = parseText(t, g);
        const byId = new Map(p.objects.map(o => [o.id, o]));
        return (p.refs ?? []).map(r => (typeof r.to === 'string' ? byId.get(r.to)?.slots.name : r.to));
    };

    it('a plain rename: the name and every reference by name, the declaration first, then in text order', () => {
        const edits = editsOf(renameEdits(text, declared, 'patron', LIB.g, LIB.mm));
        expect(edits).toEqual([declared, ...uses].map(start => ({ start, end: start + 7, text: 'patron' })));
        // From a reference, the same edits in the same order: the declaration still first.
        expect(editsOf(renameEdits(text, uses[1] + 2, 'patron', LIB.g, LIB.mm))).toEqual(edits);
        const after = apply(text, edits);
        expect(after).not.toContain('reader1');
        expect(named(after)).toEqual(['patron', 'patron']);
    });

    it('a name that is not an identifier, or is a reserved word, is written quoted, as the printer writes it', () => {
        const spaced = editsOf(renameEdits(text, declared, 'reader one', LIB.g, LIB.mm));
        expect(spaced.map(e => e.text)).toEqual(['"reader one"', '"reader one"', '"reader one"']);
        expect(named(apply(text, spaced))).toEqual(['reader one', 'reader one']);
        // Pascal reserves `begin` and `end` (style.ts), and quotes with `'`.
        const pascal = tolerantCases('pascal')[0];
        const ptext = printOf(pascal);
        const p = editsOf(renameEdits(ptext, at(ptext, 'reader1', 2), 'end', pascal.g, pascal.mm));
        expect(p.map(e => e.text)).toEqual(["'end'", "'end'", "'end'"]);
        expect(named(apply(ptext, p), pascal.g)).toEqual(['end', 'end']);
        // A call word of an expression is no name either (parser.ts `expressionWords`).
        const g = portGrammar();
        const port = printTextModel(g, parseText('Module cpu {\n  input instr : Word(32)\n}', g).objects).text;
        expect(editsOf(renameEdits(port, at(port, 'cpu'), 'and', g, PORT_MM))).toEqual([{ start: at(port, 'cpu'), end: at(port, 'cpu') + 3, text: '"and"' }]);
    });

    it('a nameless object is refused, from its class keyword and from a path to it', () => {
        const ts = printOf(TS_PLAIN);
        const message = 'this object has no name: type one in the text';
        expect(refusalOf(renameEdits(ts, at(ts, '\nState {') + 1, 'Waiting', TS_PLAIN.g, TS_PLAIN.mm))).toBe(message);
        expect(refusalOf(renameEdits(ts, at(ts, 'State[0]'), 'Waiting', TS_PLAIN.g, TS_PLAIN.mm))).toBe(message);
        expect(refusalOf(renameLocation(ts, at(ts, 'State[0]'), TS_PLAIN.g, TS_PLAIN.mm))).toBe(message);
    });

    it('a name that makes a reference ambiguous is refused; one carried by an object no reference may name is not', () => {
        const r = renameEdits(text, at(text, 'reader0'), 'reader1', LIB.g, LIB.mm);
        expect(refusalOf(r)).toMatch(/^renaming to "reader1" gives the text an error at \d+:\d+: "reader1" is ambiguous/);
        // `borrowedBy` names Members only: a Book called `reader1` leaves every reference where it was.
        expect(named(apply(text, editsOf(renameEdits(text, at(text, 'book0'), 'reader1', LIB.g, LIB.mm))))).toEqual(['reader1', 'reader1']);
    });

    it('a name that retargets a carried reference is refused; the carried tokens shift with the edits (R-TXT-35)', () => {
        const k = at(text, 'reader1', 1);
        const kept = text.slice(0, k) + 'reader9' + text.slice(k + 7);
        const keep = [{ start: k, end: k + 7, text: 'reader9' }];
        expect(parseText(kept, LIB.g, { keep }).errors).toEqual([]);
        expect(refusalOf(renameEdits(kept, at(kept, 'reader0'), 'reader9', LIB.g, LIB.mm, keep)))
            .toMatch(/^renaming to "reader9" changes what the reference at \d+:\d+ names/);
        // An edit before the carried token moves it: without the shift it would read as a new error.
        const town = editsOf(renameEdits(kept, at(kept, 'city'), 'metropolis', LIB.g, LIB.mm, keep));
        expect(town).toEqual([{ start: at(kept, 'city'), end: at(kept, 'city') + 4, text: 'metropolis' }]);
        // Without its carried token the text has an error, and a rename is refused.
        expect(refusalOf(renameEdits(kept, at(kept, 'city'), 'metropolis', LIB.g, LIB.mm))).toMatch(/^the text has errors/);
    });

    it('a broken text is refused', () => {
        const broken = text.replace('Book book1 {', 'Book book1');
        expect(refusalOf(renameEdits(broken, at(broken, 'Member reader1') + 7, 'patron', LIB.g, LIB.mm))).toMatch(/^the text has errors/);
        expect(refusalOf(renameLocation(broken, at(broken, 'Member reader1') + 7, LIB.g, LIB.mm))).toMatch(/^the text has errors/);
    });

    it('paths and `@"id"` are never rewritten; an outer reference, an empty name and a keyword are refused', () => {
        const pathed = text.replace('borrowedBy reader1', 'borrowedBy Library[0].members[1]');
        expect(named(pathed)).toEqual(['reader1', 'reader1']);
        const edits = editsOf(renameEdits(pathed, at(pathed, 'Member reader1') + 7, 'patron', LIB.g, LIB.mm));
        expect(edits.map(e => pathed.slice(e.start, e.end))).toEqual(['reader1', 'reader1']);
        expect(named(apply(pathed, edits))).toEqual(['patron', 'patron']);
        expect(apply(pathed, edits)).toContain('borrowedBy Library[0].members[1]');
        const outer = text.replace('borrowedBy reader1', 'borrowedBy @"m9"');
        expect(refusalOf(renameEdits(outer, at(outer, '"m9"'), 'patron', LIB.g, LIB.mm))).toMatch(/outside the text/);
        // The object the outer reference once named keeps its other reference; `@"m9"` stays as written.
        const fromOuter = editsOf(renameEdits(outer, at(outer, 'Member reader1') + 7, 'patron', LIB.g, LIB.mm));
        expect(fromOuter).toHaveLength(2);
        expect(apply(outer, fromOuter)).toContain('borrowedBy @"m9"');
        expect(refusalOf(renameEdits(text, declared, '', LIB.g, LIB.mm))).toMatch(/^a name cannot be empty/);
        expect(refusalOf(renameLocation(text, at(text, 'genre'), LIB.g, LIB.mm))).toMatch(/^nothing to rename here/);
    });

    it('the location: the token at the cursor and the name as typed, a quoted name without its quotes', () => {
        expect(renameLocation(text, uses[0] + 3, LIB.g, LIB.mm)).toEqual({ start: uses[0], end: uses[0] + 7, name: 'reader1' });
        expect(renameLocation(text, declared, LIB.g, LIB.mm)).toEqual({ start: declared, end: declared + 7, name: 'reader1' });
        const quoted = apply(text, editsOf(renameEdits(text, declared, 'reader one', LIB.g, LIB.mm)));
        const q = at(quoted, '"reader one" {}');
        expect(renameLocation(quoted, q + 2, LIB.g, LIB.mm)).toEqual({ start: q, end: q + '"reader one"'.length, name: 'reader one' });
    });
});

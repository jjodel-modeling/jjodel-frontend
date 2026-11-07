/**
 * Step D lane D5 (P-2026-11-07-0747; R-TXT-53 decision D5; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md
 * §6.2): Format Document and Format Selection. A format is the print of the parsed objects with every comment put back
 * by its owner; a range format splices only the top-level objects the range meets. Every case asserts that a format
 * never changes meaning (print-parse equality of the objects) and keeps each comment with its owner.
 *
 * Each test name says which mutant kills it; the bench is in the commit body.
 *
 * The two Monaco providers of ui/textualMonaco.ts are driven through a fake `monaco`, as languageService.test.ts drives
 * the others, with the same two theme imports mocked (they reach `joiner`).
 */

import type * as Monaco from 'monaco-editor';
import { describe, expect, it, vi } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import { formatText, formatTextRange, minimalEdit } from '../format';
import { commentsOf, isApplicableParse, parseText } from '../parser';
import { printTextModel } from '../printer';
import { PORT_CLIKE, PORT_MM, PORT_PASCAL, PORT_TEXT_CLIKE, PORT_TEXT_PASCAL, portGrammar } from './portCorpus';
import { GARAGE, grammarOf } from './corpus';
import { objectsOf } from './spec';
import { PASCAL_STYLE } from '../style';
import { openTextualSession, registerTextualMonaco, TEXTUAL_LANGUAGE_ID } from '../ui/textualMonaco';

vi.mock('../../../jjscript/editor/jjscriptLanguage', () => ({ jjscriptThemeRules: () => [] }));
vi.mock('../../../jjtl/editor/jjtlTheme', () => ({ jjtlTheme: { rules: [] } }));

const CLIKE = portGrammar();
const PASCAL = portGrammar(PORT_PASCAL);
const INDENT = portGrammar({ ...PORT_CLIKE, style: { base: 'indent' } });

/** What a text means: the print of its parsed objects. */
function meaning(text: string, g: ConcreteGrammar): string {
    const p = parseText(text, g);
    expect(isApplicableParse(p)).toBe(true);
    return printTextModel(g, p.objects).text;
}

/**
 * Each comment with the object that owns it, as the index of that object in text order (the parse ids are `t1..` in
 * text order, the same objects in a text and its format) or -1 for the text itself; sorted, so the order of comments on
 * one line does not count.
 */
function owners(text: string, g: ConcreteGrammar): string[] {
    const p = parseText(text, g);
    const ids = p.spans.map(s => s.id);
    return commentsOf(p.tree!, g).map(c => {
        const o = c.owner;
        const inner = o.kind === 'object' ? o.id
            : [...p.spans].filter(s => s.start <= o.start && o.start < s.end).sort((a, b) => (b.start - a.start) || (a.end - b.end))[0]?.id;
        return `${inner ? ids.indexOf(inner) : -1} ${c.text}`;
    }).sort();
}

/**
 * The three properties of a format: idempotent, meaning kept, every comment kept with its owner. The last one holds
 * whenever the owner's token stays first (leading) or last (trailing) on its printed line; `moved` is the other case.
 */
function expectSound(text: string, g: ConcreteGrammar, moved = false): string {
    const f = formatText(text, g);
    expect(f).not.toBeNull();
    expect(formatText(f!, g)).toBe(f);
    expect(meaning(f!, g)).toBe(meaning(text, g));
    if (!moved) expect(owners(f!, g)).toEqual(owners(text, g));
    return f!;
}

const BAD_CLIKE = [
    '// the cpu',
    'Module cpu {',
    '      input instr :   Word(32)   // 32 bits',
    '   // the flag',
    ' input : Bool',
    '  output result : Word(8) =   instr & {}',
    '      & and(ready)',
    '}',
].join('\n');

const FORMATTED_CLIKE = [
    '// the cpu',
    'Module cpu {',
    '  input instr : Word(32) // 32 bits',
    '  // the flag',
    '  input : Bool',
    '  output result : Word(8) = instr & {} & and(ready)',
    '}',
].join('\n');

describe('formatText', () => {
    it('prints a badly indented text with its leading and trailing comments in place (dies without the comment put-back)', () => {
        expect(formatText(BAD_CLIKE, CLIKE)).toBe(FORMATTED_CLIKE);
        expectSound(BAD_CLIKE, CLIKE);
    });

    it('is the print itself on a text without comments (dies if the format adds layout of its own)', () => {
        const bad = PORT_TEXT_CLIKE.replace(/\n {2}/g, '\n\t ').replace(' : ', '   :  ');
        expect(formatText(bad, CLIKE)).toBe(PORT_TEXT_CLIKE);
        expect(formatText(PORT_TEXT_CLIKE, CLIKE)).toBe(PORT_TEXT_CLIKE);
    });

    it('returns nothing on a text that is not applicable (dies if the applicability check goes)', () => {
        expect(formatText('Module cpu {\n  input instr : Word(\n}', CLIKE)).toBeNull();
        expect(formatText('Module cpu {\n  input instr : Bogus\n}', CLIKE)).toBeNull();
        expect(formatText('Module cpu {\n  input instr : Word(32)\n', CLIKE)).toBeNull();
    });

    it('moves an own-line comment above the printed line its owner token lands on, never inside the line (dies if it splits the line)', () => {
        const text = 'Module cpu {\n  input instr :\n    // the width\n    Word(32)\n}';
        const f = expectSound(text, CLIKE, true);
        expect(f).toBe('Module cpu {\n  // the width\n  input instr : Word(32)\n}');
    });

    it('keeps a trailing comment on the line of the token it follows, when two lines join (dies if trailing comments go to the head line)', () => {
        const text = 'Module cpu { // head\n  input instr : Word(32)\n  output result : Word(8) = instr &   // first operand\n    ready\n} // end of cpu';
        const f = expectSound(text, CLIKE, true);
        expect(f).toBe('Module cpu { // head\n  input instr : Word(32)\n  output result : Word(8) = instr & ready // first operand\n} // end of cpu');
    });

    it('keeps the comments at the start and at the end of the text, and a block comment (dies if text-owned comments are dropped)', () => {
        const text = '/* header */\n\n\nModule cpu {\n  input instr : Word(32)\n}\n// the end\n/* really */';
        const f = expectSound(text, CLIKE);
        expect(f).toBe('/* header */\nModule cpu {\n  input instr : Word(32)\n}\n// the end\n/* really */');
    });

    it('keeps a comment before a block close with its block (dies if the close token is not an anchor)', () => {
        const text = 'Module cpu {\n  input instr : Word(32)\n      // last port above\n}';
        expect(expectSound(text, CLIKE)).toBe('Module cpu {\n  input instr : Word(32)\n  // last port above\n}');
    });

    it('drops redundant parentheses, keeping the meaning (decision D5; dies without the comment put-back; the bracket exclusion is declared intent, no output tells it)', () => {
        const text = 'Module cpu {\n  output result : Word(8) = (instr) & ready // two operands\n}';
        const f = expectSound(text, CLIKE);
        expect(f).toBe('Module cpu {\n  output result : Word(8) = instr & ready // two operands\n}');
    });

    it('formats under the Pascal/Ada style, its comments included', () => {
        const bad = `-- the cpu\n${PORT_TEXT_PASCAL.replace(/\n {2}/g, '\n      ').replace('input : Bool', 'input : Bool  -- the flag')}`;
        const f = expectSound(bad, PASCAL);
        expect(f).toBe(`-- the cpu\n${PORT_TEXT_PASCAL.replace('input : Bool', 'input : Bool -- the flag')}`);
    });

    it('formats under the Indentation style, comments across INDENT and DEDENT (report §9 R7)', () => {
        // Not PORT's own model: its empty `Conj` prints as nothing under this style, and that print does not read back.
        const typed = [
            '# the cpu',
            'Module cpu',
            '      # first port',
            '    input instr :   Word(32)   # trailing',
            '    input : Bool',
            '        # before the dedent',
            '# the next',
            'Module next',
            '  input : Bool',
            '# the end',
        ].join('\n');
        expect(expectSound(typed, INDENT)).toBe([
            '# the cpu',
            'Module cpu',
            '  # first port',
            '  input instr : Word(32) # trailing',
            '  input : Bool',
            '# before the dedent',
            '# the next',
            'Module next',
            '  input : Bool',
            '# the end',
        ].join('\n'));
    });

    it('formats a text with references, paths and nested blocks (GARAGE, C-like and Pascal/Ada)', () => {
        for (const g of [grammarOf(GARAGE), grammarOf(GARAGE, PASCAL_STYLE)]) {
            const line = g.style.comments.line!;
            const printed = printTextModel(g, objectsOf(GARAGE)).text;
            // Every line indented four more, a comment above each third line and after each fifth.
            const typed = printed.split('\n').map((l, i) => `${i % 3 === 1 ? `${line} above ${i}\n` : ''}    ${l}${i % 5 === 2 ? `   ${line} after ${i}` : ''}`).join('\n');
            const f = expectSound(typed, g);
            // Without its comments, the format is the print: the layout of the typed text is gone.
            expect(f.replace(new RegExp(`^[ \\t]*${line} above \\d+\\n`, 'gm'), '').replace(new RegExp(` ${line} after \\d+`, 'g'), '')).toBe(printed);
            expect(meaning(f, g)).toBe(printed);
        }
    });
});

const TWO = [
    'Module a {',
    '      input x :   Bool // of a',
    '}',
    '',
    '// the second',
    'Module b {',
    '         input y :   Bool   // of b',
    '}',
].join('\n');

describe('formatTextRange', () => {
    it('reformats only the top-level object the range meets, the others byte-identical (dies if it returns the full format)', () => {
        const at = TWO.indexOf('input y');
        const f = formatTextRange(TWO, CLIKE, at, at + 3);
        expect(f).toBe([
            'Module a {',
            '      input x :   Bool // of a',
            '}',
            '',
            '// the second',
            'Module b {',
            '  input y : Bool // of b',
            '}',
        ].join('\n'));
        expect(meaning(f!, CLIKE)).toBe(meaning(TWO, CLIKE));
        expect(owners(f!, CLIKE)).toEqual(owners(TWO, CLIKE));
    });

    it('takes an object whose leading comment the range meets (dies if the region drops its comments)', () => {
        const at = TWO.indexOf('the second');
        const f = formatTextRange(TWO, CLIKE, at, at);
        expect(f!.startsWith('Module a {\n      input x :   Bool // of a\n}')).toBe(true);
        expect(f!.endsWith('// the second\nModule b {\n  input y : Bool // of b\n}')).toBe(true);
    });

    it('reformats every object a wide range meets, the blank lines between them as typed', () => {
        const f = formatTextRange(TWO, CLIKE, 0, TWO.length);
        expect(f).toBe(formatTextRange(TWO, CLIKE, TWO.indexOf('x :'), TWO.indexOf('y :')));
        expect(f).toBe('Module a {\n  input x : Bool // of a\n}\n\n// the second\nModule b {\n  input y : Bool // of b\n}');
        expect(formatTextRange(f!, CLIKE, 0, f!.length)).toBe(f);
        expect(formatText(f!, CLIKE)).toBe(formatText(TWO, CLIKE));
    });

    it('returns nothing on a broken text (dies if the range path skips the applicability check)', () => {
        const broken = TWO.replace('input y :   Bool', 'input y :');
        expect(formatTextRange(broken, CLIKE, 0, 5)).toBeNull();
    });
});

describe('minimalEdit', () => {
    it('trims the common prefix and suffix (dies if it replaces the whole text)', () => {
        expect(minimalEdit('abcXYdef', 'abcZdef')).toEqual({ start: 3, end: 5, text: 'Z' });
        expect(minimalEdit('aaa', 'aaaa')).toEqual({ start: 3, end: 3, text: 'a' });
        expect(minimalEdit('same', 'same')).toBeNull();
    });

    it('an edit of a formatted text touches only the reformatted object (the decorations of the others stay)', () => {
        const at = TWO.indexOf('input y');
        const e = minimalEdit(TWO, formatTextRange(TWO, CLIKE, at, at)!)!;
        expect(e.start).toBeGreaterThan(TWO.indexOf('Module b'));
        expect(TWO.slice(0, e.start) + e.text + TWO.slice(e.end)).toBe(formatTextRange(TWO, CLIKE, at, at));
    });
});

describe('the Monaco providers of Format Document and Format Selection', () => {
    const providers = new Map<string, any>();
    const fakeMonaco = {
        Emitter: class { event = () => ({ dispose: () => {} }); fire(): void {} },
        Range: class { constructor(readonly startLineNumber: number, readonly startColumn: number, readonly endLineNumber: number, readonly endColumn: number) {} },
        languages: new Proxy({ CompletionItemKind: {}, CompletionTriggerKind: {}, SymbolKind: {}, FoldingRangeKind: {} } as Record<string, unknown>, {
            get: (t, k: string) => k in t ? t[k] : (id: string, p: unknown) => { if (/^register.*Provider$/.test(k) && id === TEXTUAL_LANGUAGE_ID) providers.set(k, p); },
        }),
        editor: { registerCommand: () => {}, defineTheme: () => {}, getEditors: () => [] },
    };
    registerTextualMonaco(fakeMonaco as unknown as typeof Monaco);

    /** A model over `text`, with a session over C-like PORT: offsets and 1-based positions as Monaco's. */
    const modelOf = (text: string): Monaco.editor.ITextModel => {
        const starts = [0, ...[...text].flatMap((ch, i) => (ch === '\n' ? [i + 1] : []))];
        const model = {
            uri: { toString: () => `inmemory://format/${text.length}` },
            getVersionId: () => 1,
            getValue: () => text,
            getOffsetAt: (p: Monaco.IPosition) => starts[p.lineNumber - 1] + p.column - 1,
            getPositionAt: (o: number) => {
                let l = 0;
                while (l + 1 < starts.length && starts[l + 1] <= o) l++;
                return { lineNumber: l + 1, column: o - starts[l] + 1 };
            },
        } as unknown as Monaco.editor.ITextModel;
        openTextualSession(model, { base: () => ({ grammar: CLIKE, mm: PORT_MM }), keep: () => undefined });
        return model;
    };
    /** A provider's edits applied to the model's text. */
    const applied = (model: Monaco.editor.ITextModel, edits: readonly Monaco.languages.TextEdit[]): string => {
        let text = model.getValue();
        for (const e of [...edits].reverse()) {
            const a = model.getOffsetAt({ lineNumber: e.range.startLineNumber, column: e.range.startColumn });
            const b = model.getOffsetAt({ lineNumber: e.range.endLineNumber, column: e.range.endColumn });
            text = text.slice(0, a) + e.text + text.slice(b);
        }
        return text;
    };

    it('formats the document with one minimal edit (dies if the provider replaces the whole text)', () => {
        const model = modelOf(BAD_CLIKE);
        const edits = providers.get('registerDocumentFormattingEditProvider').provideDocumentFormattingEdits(model, {}, {});
        expect(edits).toHaveLength(1);
        expect(applied(model, edits)).toBe(FORMATTED_CLIKE);
        // The first line, `// the cpu` and `Module cpu {`, is the same in both: the edit starts after it.
        expect(edits[0].range.startLineNumber).toBeGreaterThan(2);
    });

    it('formats the selection, only the object it meets (dies if the range provider formats the document)', () => {
        const model = modelOf(TWO);
        const at = model.getPositionAt(TWO.indexOf('input y'));
        const range = new fakeMonaco.Range(at.lineNumber, at.column, at.lineNumber, at.column + 3);
        const edits = providers.get('registerDocumentRangeFormattingEditProvider').provideDocumentRangeFormattingEdits(model, range, {}, {});
        expect(edits).toHaveLength(1);
        expect(applied(model, edits)).toBe(formatTextRange(TWO, CLIKE, TWO.indexOf('input y'), TWO.indexOf('input y') + 3));
        expect(edits[0].range.startLineNumber).toBe(at.lineNumber);
    });

    it('gives no edit on a broken text, nor on a formatted one (dies if a null format becomes an edit)', () => {
        const broken = modelOf('Module cpu {\n      input instr : Word(\n}');
        expect(providers.get('registerDocumentFormattingEditProvider').provideDocumentFormattingEdits(broken, {}, {})).toEqual([]);
        const whole = new fakeMonaco.Range(1, 1, 3, 2);
        expect(providers.get('registerDocumentRangeFormattingEditProvider').provideDocumentRangeFormattingEdits(broken, whole, {}, {})).toEqual([]);
        expect(providers.get('registerDocumentFormattingEditProvider').provideDocumentFormattingEdits(modelOf(FORMATTED_CLIKE), {}, {})).toEqual([]);
    });
});

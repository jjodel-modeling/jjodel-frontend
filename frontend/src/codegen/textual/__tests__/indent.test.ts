/**
 * Step C lane C3b (P-2026-11-05-0748, P-2026-11-05-0816; R-TXT-16 (2), R-TXT-41 D2): the indentation style. Blocks are
 * delimited by INDENT and DEDENT, zero-width tokens the tokenizer derives from the layout; an inconsistent dedent is an
 * error and the text is not applied; an optional part of a head does not start on a new line; `#` comments.
 * Mutations each test kills are in its name; the bench is in the commit body.
 */

import { describe, it, expect } from 'vitest';
import { DEDENT_MARK, INDENT_MARK } from '../concreteGrammar';
import { isApplicableParse, parseText, tokenizeText } from '../parser';
import { printTextModel } from '../printer';
import { checkStyle } from '../styleCheck';
import { INDENT_STYLE, STYLE_CATALOG, styleOf } from '../style';
import { textualNotation } from '../syntaxRecord';
import type { ElementIds } from '../annotations';
import { grammarOf, INNER } from './corpus';
import { LIBRARY_IDS, LIBRARY_MM } from './tolerantCorpus';
import { metamodelOf, objectsOf } from './spec';

const g = grammarOf(INNER, INDENT_STYLE);
const PRINT = 'Room hall\n  inner\n    Room\n  rooms\n    Room inner\n  see [Room[0].inner[0], inner, hall]';
const marks = (text: string): string[] => tokenizeText(text, g).tokens.map(t => (t.v === INDENT_MARK ? '>' : t.v === DEDENT_MARK ? '<' : t.k === 'EOF' ? '$' : t.raw));
const read = (text: string) => {
    const r = parseText(text, g);
    return { errors: r.errors.map(e => e.message), names: r.objects.map(o => (o.slots.name as string | undefined) ?? null), applicable: isApplicableParse(r) };
};

describe('the indentation style in the catalog', () => {
    it('is listed after C-like and Pascal/Ada, with no block tokens and "#" comments (mutant: the record left out of the catalog)', () => {
        expect(Object.keys(STYLE_CATALOG)).toEqual(['clike', 'pascal', 'indent']);
        expect(styleOf('indent')).toBe(INDENT_STYLE);
        expect(INDENT_STYLE).toMatchObject({ name: 'Indentation', layout: 'indent', blockOpen: [], blockClose: [], emptyBlock: [], comments: { line: '#', block: null } });
    });

    it('passes the style check on the corpus, its empty block tokens included (mutant: the free-layout delimiter rule applied to it)', () => {
        expect(checkStyle(g).filter(f => f.level === 'error')).toEqual([]);
    });
});

describe('the print under indentation', () => {
    it('nests by indentation alone, an empty body printing nothing (mutants: the depth not increased; not decreased)', () => {
        expect(printTextModel(g, objectsOf(INNER)).text).toBe(PRINT);
    });

    it('the tokenizer reads one INDENT per deeper line and one DEDENT per level left, the last ones at the end (mutants: no INDENT emitted; no DEDENT at the end)', () => {
        expect(marks(PRINT)).toEqual([
            'Room', 'hall', '>', 'inner', '>', 'Room', '<', 'rooms', '>', 'Room', 'inner', '<',
            'see', '[', 'Room', '[', '0', ']', '.', 'inner', '[', '0', ']', ',', 'inner', ',', 'hall', ']', '<', '$',
        ]);
    });

    it('the marks are zero-width and hold no trivia: the tokens still concatenate to the text (mutant: a mark advancing the trivia cursor)', () => {
        const { tokens } = tokenizeText(PRINT, g);
        expect(tokens.map(t => t.leading + t.raw + t.trailing).join('')).toBe(PRINT);
        for (const t of tokens.filter(x => x.v === INDENT_MARK || x.v === DEDENT_MARK)) expect([t.raw, t.leading, t.trailing, t.end - t.start]).toEqual(['', '', '', 0]);
    });

    it('reads back with no error into the same print, the tree of the print equal to the parser\'s (mutant: the printer\'s marks left out of its tree)', () => {
        const r = parseText(PRINT, g);
        expect(r.errors).toEqual([]);
        const again = printTextModel(g, r.objects);
        expect(again.text).toBe(PRINT);
        const shape = (n: unknown): unknown => {
            const x = n as { kind: string; children?: unknown[]; start: number; end: number; v?: string };
            return x.kind === 'token' ? `${x.start}:${x.v}` : [x.kind, x.start, x.end, (x.children ?? []).map(shape)];
        };
        expect(again.tree && shape(again.tree)).toEqual(shape(r.tree));
    });
});

describe('the layout rules', () => {
    it('an inconsistent dedent is an error and the text is not applied, never a silent reparent (mutant: the inconsistency error dropped)', () => {
        const r = read('Room hall\n    inner\n      Room\n  rooms\n    Room inner');
        expect(r.applicable).toBe(false);
        expect(r.errors[0]).toMatch(/^inconsistent indentation/);
    });

    it('an optional name does not start on a new line: a nameless object followed by a named one (mutant: the line rule dropped)', () => {
        expect(read('Room\nRoom x')).toEqual({ errors: [], names: [null, 'x'], applicable: true });
    });

    it('"#" starts a comment, and a comment line takes no part in the layout (mutant: a comment opener other than "#")', () => {
        expect(read('# head\nRoom hall # trailing\n      # deep comment\n  rooms\n# flush comment\n    Room k\n')).toEqual({ errors: [], names: ['hall', 'k'], applicable: true });
    });

    it('no layout inside brackets: a list may continue on a line of any indentation (mutant: layout tokens inside brackets)', () => {
        expect(marks('Room hall\n  see [hall,\nhall]')).toEqual(['Room', 'hall', '>', 'see', '[', 'hall', ',', 'hall', ']', '<', '$']);
        expect(read('Room hall\n  see [hall,\nhall]').errors).toEqual([]);
    });

    it('a mark is described in words in a message (mutant: the mark shown as a character)', () => {
        const r = read('Room hall\n  rooms');
        expect(r.errors).toEqual([]);
        for (const text of ['Room hall\n  see', 'Room hall\n  42']) {
            const bad = read(text);
            expect(bad.errors.join('\n'), text).toContain('the end of an indented block');
            expect(bad.errors.join('\n'), text).not.toMatch(/[\u21e4\u21e5]/);
        }
    });

    const library = textualNotation(LIBRARY_MM, { record: { v: 1, style: { base: 'indent' } }, issues: [] }, LIBRARY_IDS).grammar;

    it('a body written on the head line is no body: it is an error and is not read into the object (mutant: the empty indented body not nullable)', () => {
        const r = parseText('Library city\n  books\n    Book b0 genre FICTION\n    Book b1\n      genre POETRY', library);
        expect(r.errors[0].message).toBe('expected "Book" or the end of an indented block; found name "genre"');
        expect(r.objects.filter(o => o.cls === 'Book').map(o => [o.slots.name, o.slots.genre ?? null])).toEqual([['b0', null], ['b1', 'POETRY']]);
    });

    it('after an error in a head, the indented lines under it are skipped as a block, their objects orphans (mutant: the skip blind to INDENT and DEDENT)', () => {
        const r = parseText('Room hall 42\n  rooms\n    Room k\nRoom z', g);
        expect(r.errors.map(e => e.message)).toEqual(['expected "Room"; found number 42']);
        expect(r.objects.map(o => o.slots.name)).toEqual(['hall', 'k', 'z']);
        const orphans = (r.tree!.children.filter(c => c.kind === 'error') as unknown as { children: { kind: string; orphan?: boolean }[] }[])
            .flatMap(e => e.children.filter(c => c.kind === 'object' && c.orphan));
        expect(orphans).toHaveLength(1);
    });
});

describe('a nameless positional object under indentation (chat decision, P-2026-11-05-0816)', () => {
    const IDS: ElementIds = {
        classes: { C_Room: 'Room' },
        features: {
            A_Room_name: { owner: 'Room', name: 'name', lower: 0 }, R_Room_inner: { owner: 'Room', name: 'inner', lower: 0 },
            R_Room_rooms: { owner: 'Room', name: 'rooms', lower: 0 }, R_Room_see: { owner: 'Room', name: 'see', lower: 0 },
        },
        enums: {},
    };
    const grammarFor = (base: 'clike' | 'indent') => textualNotation(metamodelOf(INNER), { record: { v: 1, classes: { C_Room: { keyword: '' } }, ...(base === 'indent' ? { style: { base } } : {}) }, issues: [] }, IDS).grammar;

    it('is refused by the style check with a reason naming the class: a print of nothing cannot read back (mutants: the check dropped; the head not closed at an indented body)', () => {
        const errors = checkStyle(grammarFor('indent')).filter(f => f.level === 'error');
        expect(errors.map(f => f.where)).toContain('class Room');
        expect(errors.find(f => f.where === 'class Room')!.message).toMatch(/a Room with no keyword, no name and nothing set prints nothing/);
    });

    it('the same class under C-like is not refused for it (mutant: the check applied to every style)', () => {
        expect(checkStyle(grammarFor('clike')).filter(f => f.level === 'error' && f.where === 'class Room')).toEqual([]);
    });
});

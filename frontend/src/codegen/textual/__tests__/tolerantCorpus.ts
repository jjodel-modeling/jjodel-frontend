/**
 * The corpus of the tolerant parser (step A, P-2026-11-03-2120), as the probe of P-2026-11-03-1415 built it
 * (docs/discovery/harness/probe_2026-11-03_textual_tolerant_parser.test.ts): non-hardware metamodels in their annotated
 * forms, and every mutant of their prints, truncated after every token and with every single token deleted.
 */

import { readFileSync } from 'node:fs';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { printTextModel } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { GARAGE, grammarOf, LOWER } from './corpus';
import { metamodelOf, objectsOf } from './spec';

export const LIBRARY_MM: TextMetamodel = {
    classes: [
        { name: 'Library', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'books', type: 'Book', containment: true, many: true }, { name: 'members', type: 'Member', containment: true, many: true }] },
        { name: 'Book', attributes: [{ name: 'name', type: 'EString' }, { name: 'genre', type: 'Genre' }, { name: 'year', type: 'EInt' }], references: [{ name: 'borrowedBy', type: 'Member' }] },
        { name: 'Member', attributes: [{ name: 'name', type: 'EString' }] },
    ],
    enumerations: [{ name: 'Genre', literals: ['FICTION', 'POETRY', 'SCIENCE', 'HISTORY'] }],
};
export const LIBRARY_IDS: ElementIds = {
    classes: { C_Lib: 'Library', C_Book: 'Book', C_Mem: 'Member' },
    features: {
        A_Lib_name: { owner: 'Library', name: 'name', lower: 1 }, A_Book_name: { owner: 'Book', name: 'name', lower: 1 },
        A_Book_genre: { owner: 'Book', name: 'genre', lower: 1 }, A_Book_year: { owner: 'Book', name: 'year', lower: 0 },
        A_Mem_name: { owner: 'Member', name: 'name', lower: 1 }, R_Lib_books: { owner: 'Library', name: 'books', lower: 0 },
        R_Lib_members: { owner: 'Library', name: 'members', lower: 0 }, R_Book_borrowedBy: { owner: 'Book', name: 'borrowedBy', lower: 0 },
    },
    enums: { E_Genre: 'Genre' },
};
const SUBSETS = { E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] } };
const LIBRARY_RECORD: SyntaxAnnotations = { v: 1, language: 'Shelf', features: { R_Lib_members: { keyword: 'patrons' }, A_Book_genre: { keyword: '' }, R_Lib_books: { groupBy: 'A_Book_genre' } }, enums: SUBSETS };
const LIBRARY_LINES: SyntaxAnnotations = {
    v: 1,
    classes: { C_Lib: { keyword: 'shelf' }, C_Book: { layout: 'line', name: { keyword: 'titled' } }, C_Mem: { layout: 'line' } },
    features: { A_Book_genre: { keyword: '' }, R_Book_borrowedBy: { keyword: 'by' } },
};

/** A library of `books` and `members`; a third of the books are borrowed. */
export function libraryObjects(books = 4, members = 2): TextObject[] {
    const genres = ['FICTION', 'SCIENCE', 'POETRY', 'HISTORY'];
    const ms = Array.from({ length: members }, (_, i) => ({ id: `m${i}`, cls: 'Member', slots: { name: `reader${i}` } }));
    const bs = Array.from({ length: books }, (_, i) => ({
        id: `b${i}`, cls: 'Book',
        slots: { name: `book${i}`, genre: genres[i % 4], year: i % 2 ? 1900 + (i % 120) : null, borrowedBy: i % 3 === 1 && members ? `m${i % members}` : null },
    }));
    return [{ id: 'lib', cls: 'Library', slots: { name: 'city', books: bs.map(b => b.id), members: ms.map(m => m.id) } }, ...ms, ...bs];
}

const TURNSTILE = JSON.parse(readFileSync(new URL('../../examples/turnstile/turnstile.json', import.meta.url), 'utf8'));
function fromLookup(L: Record<string, any>): { mm: TextMetamodel; objects: TextObject[]; ids: ElementIds } {
    const all = Object.values(L);
    const features = all.filter(o => o.className === 'DAttribute' || o.className === 'DReference');
    const values = all.filter(o => o.className === 'DValue');
    const contains = (fid: string): boolean => values.some(v => v.instanceof === fid && v.values.some((t: string) => L[t]?.father === v.id));
    const typeOf = (t: string): string => (t === 'Pointer_EINT' ? 'EInt' : 'EString');
    const classes = all.filter(o => o.className === 'DClass');
    const mm: TextMetamodel = {
        classes: classes.map(c => ({
            name: c.name, isAbstract: !!c.abstract, supers: (c.extends ?? []).map((s: string) => L[s].name),
            attributes: features.filter(f => f.father === c.id && f.className === 'DAttribute').map(f => ({ name: f.name, type: typeOf(f.type), many: f.upperBound === -1 })),
            references: features.filter(f => f.father === c.id && f.className === 'DReference').map(f => ({ name: f.name, type: L[f.type].name, containment: contains(f.id), many: f.upperBound === -1 })),
        })),
        enumerations: [],
    };
    const objects: TextObject[] = all.filter(o => o.className === 'DObject').map(o => {
        const slots: Record<string, unknown> = {};
        for (const vid of o.features) { const v = L[vid]; const f = L[v.instanceof]; slots[f.name] = f.upperBound === -1 ? [...v.values] : v.values[0] ?? null; }
        return { id: o.id, cls: L[o.instanceof].name, slots };
    });
    const ids: ElementIds = {
        classes: Object.fromEntries(classes.map(c => [c.id, c.name])),
        features: Object.fromEntries(features.map(f => [f.id, { owner: L[f.father].name, name: f.name, lower: f.lowerBound ?? 0 }])),
        enums: {},
    };
    return { mm, objects, ids };
}
export const TS = fromLookup(TURNSTILE.lookup);
const TURNSTILE_RECORD: SyntaxAnnotations = { v: 1, features: { F_State_transitions: { inline: true }, F_Transition_nextState: { keyword: 'to' }, F_Transition_event: { keyword: '' } } };

const notation = (mm: TextMetamodel, record: SyntaxAnnotations | null, ids: ElementIds): ConcreteGrammar => textualNotation(mm, { record, issues: [] }, ids).grammar;

export interface TolerantCase {
    readonly name: string;
    readonly mm: TextMetamodel;
    readonly g: ConcreteGrammar;
    readonly objects: readonly TextObject[];
}

/** The seven cases of the probe: library in three forms, turnstile in two, garage in two styles. */
export function tolerantCases(): TolerantCase[] {
    const lib = (name: string, r: SyntaxAnnotations | null): TolerantCase => ({ name, mm: LIBRARY_MM, g: notation(LIBRARY_MM, r, LIBRARY_IDS), objects: libraryObjects(6, 3) });
    return [
        lib('library, plain', null),
        lib('library, annotated', LIBRARY_RECORD),
        lib('library, lines', LIBRARY_LINES),
        { name: 'turnstile, plain', mm: TS.mm, g: notation(TS.mm, null, TS.ids), objects: TS.objects },
        { name: 'turnstile, annotated', mm: TS.mm, g: notation(TS.mm, TURNSTILE_RECORD, TS.ids), objects: TS.objects },
        { name: 'garage, c-like', mm: metamodelOf(GARAGE), g: grammarOf(GARAGE), objects: objectsOf(GARAGE) },
        { name: 'garage, lower', mm: metamodelOf(GARAGE), g: grammarOf(GARAGE, LOWER), objects: objectsOf(GARAGE) },
    ];
}

/** The tokens of a C-like print, as the probe cut them: words, numbers, strings, `{}`, single characters. */
export function probeTokens(text: string): { readonly start: number; readonly end: number }[] {
    const out: { start: number; end: number }[] = [];
    const re = /[A-Za-z_][A-Za-z0-9_]*|-?\d+(\.\d+)?([eE][+-]?\d+)?|"(?:[^"\\\n]|\\.)*"|\{\}|[^\s]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) out.push({ start: m.index, end: m.index + m[0].length });
    return out;
}

export interface Mutant {
    readonly kind: 'trunc' | 'delete';
    /** The fault: the end of the prefix, or the offset of the deleted token. */
    readonly at: number;
    /** The length removed (deletions). */
    readonly removed: number;
    readonly text: string;
}

/** The print of a case, and every mutant of it. */
export function mutantsOf(c: TolerantCase): { readonly text: string; readonly mutants: readonly Mutant[] } {
    const text = printTextModel(c.g, c.objects).text;
    const toks = probeTokens(text);
    return {
        text,
        mutants: [
            ...toks.map(t => ({ kind: 'trunc' as const, at: t.end, removed: 0, text: text.slice(0, t.end) })),
            ...toks.map(t => ({ kind: 'delete' as const, at: t.start, removed: t.end - t.start, text: text.slice(0, t.start) + text.slice(t.end) })),
        ],
    };
}

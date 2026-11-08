/**
 * Lane T8e (P-2026-11-08-1625; R-TXT-18, R-TXT-21 (7)): the rename thresholds of `matchObjects` as a parameter.
 */

import { describe, it, expect } from 'vitest';
import type { TextObject } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { RENAME_MARGIN, RENAME_THRESHOLD, matchObjects } from '../textMatch';
import type { MatchInput, TextMatch } from '../textMatch';
import { grammarOf } from './corpus';
import { metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';

type Book = { readonly id: string; readonly name: string; readonly year: number; readonly pages: number; readonly lang: string; readonly note: string };

const shelf = (books: readonly Book[]): Spec => ({
    classes: [
        { name: 'Shelf', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'books', type: 'Book', containment: true, many: true }] },
        { name: 'Book', attributes: [{ name: 'name', type: 'EString' }, { name: 'year', type: 'EInt' }, { name: 'pages', type: 'EInt' }, { name: 'lang', type: 'EString' }, { name: 'note', type: 'EString' }] },
    ],
    enums: {},
    objects: [
        { id: 'main', cls: 'Shelf', slots: { name: 'main', books: books.map(b => b.id) } },
        ...books.map(({ id, ...slots }) => ({ id, cls: 'Book', slots })),
    ],
});

const A: Book = { id: 'a', name: 'alpha', year: 1, pages: 10, lang: 'it', note: 'n' };
const B: Book = { id: 'b', name: 'beta', year: 2, pages: 20, lang: 'en', note: 'm' };
const C: Book = { id: 'c', name: 'gamma', year: 1, pages: 10, lang: 'xx', note: 'yy' };

/** The model's books against the print of `edited`, no spans and no ids, as a re-import. */
function reimport(model: readonly Book[], edited: readonly Book[], extra: Partial<MatchInput> = {}): TextMatch {
    const spec = shelf(model);
    const g = grammarOf(spec);
    const text = printTextModel(g, objectsOf(shelf(edited))).text;
    const parsed = parseText(text, g);
    expect(parsed.errors).toEqual([]);
    return matchObjects({ mm: metamodelOf(spec), grammar: g, model: objectsOf(spec) as readonly TextObject[], parsed, ...extra });
}
const renamed = (m: TextMatch): string[] => m.matches.filter(x => x.by === 'rename').map(x => x.model);

describe('T8e: the rename thresholds are a parameter of matchObjects', () => {
    it('renameThreshold above the score refuses the rename the default accepts (dies when the field is ignored)', () => {
        const edited = [{ ...A, name: 'delta', note: 'changed' }, B];
        expect(renamed(reimport([A, B], edited))).toEqual(['a']);
        expect(renamed(reimport([A, B], edited, { renameThreshold: 0.8 }))).toEqual([]);
    });

    it('renameThreshold at the score accepts the rename the default refuses (dies on a threshold that can only tighten)', () => {
        const edited = [{ ...A, name: 'delta', lang: 'fr', note: 'changed' }, B];
        expect(renamed(reimport([A, B], edited))).toEqual([]);
        expect(renamed(reimport([A, B], edited, { renameThreshold: 0.5 }))).toEqual(['a']);
    });

    it('renameMargin above the lead refuses the rename the default accepts (dies when the field is ignored)', () => {
        const edited = [{ ...A, name: 'delta' }, B];
        expect(renamed(reimport([A, B, C], edited))).toEqual(['a']);
        expect(renamed(reimport([A, B, C], edited, { renameMargin: 0.6 }))).toEqual([]);
    });

    it('absent, the two fields read as the constants (dies on a margin default above the lead of 0.25)', () => {
        const D: Book = { id: 'd', name: 'kappa', year: 1, pages: 10, lang: 'it', note: 'yy' };
        const cases: readonly (readonly [readonly Book[], readonly Book[]])[] = [
            [[A, B, C], [{ ...A, name: 'delta', note: 'changed' }, B]],
            [[A, B, C], [{ ...A, name: 'delta', lang: 'fr', note: 'changed' }, B]],
            [[A, B, C], [{ ...A, name: 'delta' }, B]],
            [[A, B, D], [{ ...A, name: 'delta' }, B]],
        ];
        for (const [model, edited] of cases) {
            expect(reimport(model, edited)).toEqual(reimport(model, edited, { renameThreshold: RENAME_THRESHOLD, renameMargin: RENAME_MARGIN }));
        }
        expect(renamed(reimport([A, B, D], [{ ...A, name: 'delta' }, B]))).toEqual(['a']);
    });
});

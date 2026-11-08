/**
 * Lane T8e (P-2026-11-08-1625; R-TXT-18, R-TXT-21 (7)): the rename thresholds of `matchObjects` as a parameter, and homonyms
 * paired by content, their order the tie-break.
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

type Item = { readonly id: string; readonly size?: number; readonly tag?: string; readonly name?: string };

/** Two tag folders, then `docs` with its items: the tags are matched before the items are. */
const folder = (items: readonly Item[]): Spec => ({
    classes: [
        { name: 'Folder', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'items', type: 'Item', containment: true, many: true }] },
        { name: 'Item', attributes: [{ name: 'size', type: 'EInt' }], references: [{ name: 'tag', type: 'Folder' }] },
    ],
    enums: {},
    objects: [
        { id: 'red', cls: 'Folder', slots: { name: 'red', items: [] } },
        { id: 'blue', cls: 'Folder', slots: { name: 'blue', items: [] } },
        { id: 'docs', cls: 'Folder', slots: { name: 'docs', items: items.map(i => i.id) } },
        ...items.map(i => ({ id: i.id, cls: 'Item', slots: { size: i.size ?? null, tag: i.tag ?? null } })),
    ],
});

/** Each parsed item, in text order, as the model item it paired with, or `new`. */
function itemPairs(model: readonly Item[], edited: readonly Item[]): { readonly pairs: readonly string[]; readonly m: TextMatch } {
    const spec = folder(model);
    const g = grammarOf(spec);
    const text = printTextModel(g, objectsOf(folder(edited))).text;
    const parsed = parseText(text, g);
    expect(parsed.errors).toEqual([]);
    const m = matchObjects({ mm: metamodelOf(spec), grammar: g, model: objectsOf(spec) as readonly TextObject[], parsed });
    const byText = new Map(m.matches.map(x => [x.text, x.model]));
    return { pairs: parsed.objects.filter(o => o.cls === 'Item').map(o => byText.get(o.id) ?? 'new'), m };
}

describe('T8e: homonyms pair by content, order the tie-break', () => {
    const I0: Item = { id: 'i0', size: 10 };
    const I1: Item = { id: 'i1', size: 11 };
    const I2: Item = { id: 'i2', size: 12 };

    it('swapped homonyms pair with their own (dies on pairing by order)', () => {
        const { pairs, m } = itemPairs([I0, I1, I2], [I2, I1, I0]);
        expect(pairs).toEqual(['i2', 'i1', 'i0']);
        expect(m.matches.filter(x => x.model.startsWith('i')).map(x => [x.by, x.uncertain])).toEqual([['homonym', true], ['homonym', true], ['homonym', true]]);
        expect(m.deleted).toEqual([]);
    });

    it('the delete of the first homonym does not shift the others (dies on pairing by order)', () => {
        const { pairs, m } = itemPairs([I0, I1, I2], [I1, I2]);
        expect(pairs).toEqual(['i1', 'i2']);
        expect(m.deleted).toEqual(['i0']);
    });

    it('identical homonyms keep the order (dies on a tie-break by the model position alone)', () => {
        const same = (id: string): Item => ({ id, size: 7 });
        expect(itemPairs([same('i0'), same('i1'), same('i2')], [same('x0'), same('x1'), same('x2')]).pairs).toEqual(['i0', 'i1', 'i2']);
    });

    it('order breaks the ties among the equal ones only (dies on order deciding before the score)', () => {
        const ten = (id: string): Item => ({ id, size: 10 });
        expect(itemPairs([ten('i0'), ten('i1'), { id: 'i2', size: 11 }], [{ id: 'x', size: 11 }, ten('y'), ten('z')]).pairs).toEqual(['i2', 'i0', 'i1']);
    });

    it('a new object between homonyms takes no one\'s match, and is the one created (dies on pairing by order)', () => {
        const { pairs, m } = itemPairs([I1, I2], [I1, { id: 'n', size: 99 }, I2]);
        expect(pairs).toEqual(['i1', 'new', 'i2']);
        expect(m.created).toHaveLength(1);
        expect(m.deleted).toEqual([]);
    });

    it('no pairing is dropped: a homonym no model object resembles still takes the one left (dies on a score floor)', () => {
        const { pairs, m } = itemPairs([I0, I1, I2], [I1, I2, { id: 'n', size: 99 }]);
        expect(pairs).toEqual(['i1', 'i2', 'i0']);
        expect(m.created).toEqual([]);
        expect(m.deleted).toEqual([]);
    });

    it('a reference counts as content, through the matches made so far (dies on scoring the attributes alone)', () => {
        const r: Item = { id: 'i0', tag: 'red' };
        const b: Item = { id: 'i1', tag: 'blue' };
        expect(itemPairs([r, b], [b, r]).pairs).toEqual(['i1', 'i0']);
    });

    it('one text homonym against several model ones stays by order: content decides from two on each side (dies on widening the condition)', () => {
        expect(itemPairs([I0, I1, I2], [I2]).pairs).toEqual(['i0']);
    });

    it('a feature the rule does not print is not content (dies on dropping the shown filter)', () => {
        const items: readonly Item[] = [{ id: 'i0', size: 10 }, { id: 'i1', size: 10 }];
        const spec = folder(items);
        const g = grammarOf(spec);
        const parsed = parseText(printTextModel(g, objectsOf(spec)).text, g);
        const base = metamodelOf(spec);
        const mm = { ...base, classes: base.classes.map(c => (c.name === 'Item' ? { ...c, attributes: [...(c.attributes ?? []), { name: 'hidden', type: 'EInt', many: false }] } : c)) };
        const model = objectsOf(spec).map(o => (o.id === 'i0' ? { ...o, slots: { ...o.slots, hidden: 1 } } : o));
        const m = matchObjects({ mm, grammar: g, model, parsed });
        const byText = new Map(m.matches.map(x => [x.text, x.model]));
        expect(parsed.objects.filter(o => o.cls === 'Item').map(o => byText.get(o.id))).toEqual(['i0', 'i1']);
    });

    it('several text homonyms against one model one stay by order (dies on widening the condition)', () => {
        expect(itemPairs([I1], [I0, I1]).pairs).toEqual(['i1', 'new']);
    });
});

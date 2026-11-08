/**
 * Lane T8a (P-2026-11-08-0121; R-TXT-18, R-TXT-55 F9): object ids in the text as a structured comment at the end of each
 * object's head line, the reader over `commentsOf`, and the id as the first evidence of `matchObjects`.
 */

import { createHash } from 'node:crypto';
import { describe, it, expect } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextObject } from '../metamodel';
import { parseText } from '../parser';
import type { SyntaxNode } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import { textIdsOf } from '../textMatch';
import { BOOL_CLIKE, BOOL_PASCAL, boolGrammar, boolObjects } from './boolCorpus';
import { BOX, CASES, DIAMOND, INNER, LOWER, NON_DIAMOND, grammarOf } from './corpus';
import { PORT_PASCAL, portGrammar, portObjects } from './portCorpus';
import { FIXTURE, objectsOf } from './spec';
import { libraryObjects, tolerantCases } from './tolerantCorpus';

const withIds = (g: ConcreteGrammar): ConcreteGrammar => ({ ...g, style: { ...g.style, printIds: true } });

/** Every print the textual tests already hold, under every style they use: the Text tab's output. */
function fixtures(): { readonly name: string; readonly g: ConcreteGrammar; readonly objects: readonly TextObject[] }[] {
    return [
        ...(['clike', 'pascal', 'indent'] as const).flatMap(base => tolerantCases(base).map(c => ({ name: `${base}: ${c.name}`, g: c.g, objects: c.objects }))),
        { name: 'port, clike', g: portGrammar(), objects: portObjects() },
        { name: 'port, pascal', g: portGrammar(PORT_PASCAL), objects: portObjects() },
        { name: 'bool, clike', g: boolGrammar(BOOL_CLIKE), objects: boolObjects() },
        { name: 'bool, pascal', g: boolGrammar(BOOL_PASCAL), objects: boolObjects() },
        ...[DIAMOND, NON_DIAMOND, BOX, CASES, INNER, FIXTURE].flatMap((s, i) => [CLIKE_STYLE, LOWER].map(st => ({ name: `spec ${i}, ${st.id}`, g: grammarOf(s, st), objects: objectsOf(s) }))),
    ];
}

const objectIds = (n: SyntaxNode): string[] => [...(n.kind === 'object' ? [n.id] : []), ...n.children.flatMap(c => (c.kind === 'token' ? [] : objectIds(c)))];

const printOf = (g: ConcreteGrammar, objects: readonly TextObject[]): string => {
    try { return printTextModel(g, objects).text; } catch (e) { return `throws: ${(e as Error).message}`; }
};

describe('T8a printer: ids off', () => {
    it('prints every fixture byte for byte as before the option', () => {
        const all = fixtures().map(f => `${f.name}\n${printOf(f.g, f.objects)}`).join('\n\u0000\n');
        expect(fixtures().length).toBe(37);
        expect(fixtures().filter(f => printOf(f.g, f.objects).startsWith('throws')).map(f => f.name)).toEqual([]);
        expect(createHash('sha256').update(all).digest('hex')).toBe('08e53685643d59172c5f7354100c107fdfe6b631044e7503d69063daf69bb717');
    });

    it('printIds false prints as the option unset', () => {
        for (const f of fixtures()) expect(printOf({ ...f.g, style: { ...f.g.style, printIds: false } }, f.objects), f.name).toBe(printOf(f.g, f.objects));
    });

    it('no fixture print holds an id comment', () => {
        for (const f of fixtures()) expect(printOf(f.g, f.objects), f.name).not.toMatch(/@id/);
    });
});

describe('T8a printer: ids on', () => {
    const lib = tolerantCases('clike')[0];
    it('ends each head line with the id of the first object on it, in C-like', () => {
        const text = printTextModel(withIds(lib.g), lib.objects).text;
        const lines = text.split('\n');
        expect(lines[0]).toBe('Library city { // @id lib');
        expect(lines.filter(l => /\/\/ @id /.test(l)).length).toBe(lib.objects.length);
        for (const o of lib.objects) expect(text.match(new RegExp(`// @id ${o.id}$`, 'gm'))?.length, o.id).toBe(1);
    });

    it('uses the comment syntax of the style', () => {
        expect(printTextModel(withIds(tolerantCases('pascal')[0].g), lib.objects).text.split('\n')[0]).toBe('Library city begin -- @id lib');
        expect(printTextModel(withIds(tolerantCases('indent')[0].g), lib.objects).text.split('\n')[0]).toBe('Library city # @id lib');
    });

    it('reads back to the same objects, spans and references as the print without ids', () => {
        for (const f of fixtures()) {
            if (printOf(f.g, f.objects).startsWith('throws')) continue;
            const off = parseText(printTextModel(f.g, f.objects).text, f.g);
            const on = parseText(printTextModel(withIds(f.g), f.objects).text, withIds(f.g));
            expect(on.errors, f.name).toEqual([]);
            expect(on.objects, f.name).toEqual(off.objects);
        }
    });

    it('keeps the tree of the print equal to the parse of it', () => {
        for (const f of fixtures()) {
            if (printOf(f.g, f.objects).startsWith('throws')) continue;
            const p = printTextModel(withIds(f.g), f.objects);
            expect(p.tree, f.name).toBeDefined();
        }
    });

    it('leaves out an id it cannot write in a comment, and the line with it', () => {
        const objs = libraryObjects(2, 1).map(o => (o.id === 'b0' ? { ...o, id: 'b 0' } : o)).map(o => (o.id === 'lib' ? { ...o, slots: { ...o.slots, books: ['b 0', 'b1'] } } : o));
        const text = printTextModel(withIds(lib.g), objs).text;
        expect(text).not.toMatch(/@id b 0/);
        expect(text).toMatch(/@id b1/);
    });
});

describe('T8a reader', () => {
    const ids = (text: string, g: ConcreteGrammar): Record<string, string> => {
        const r = parseText(text, g);
        return Object.fromEntries(textIdsOf(r.tree!, g));
    };

    it('gives each printed object its id back, under every style', () => {
        for (const f of fixtures()) {
            if (printOf(f.g, f.objects).startsWith('throws')) continue;
            const g = withIds(f.g);
            const p = printTextModel(g, f.objects);
            const r = parseText(p.text, g);
            const read = textIdsOf(r.tree!, g);
            // The print's tree and the parse's have the same objects in the same order, model ids and parsed ids.
            const asModel = new Map(objectIds(r.tree!).map((t, i) => [t, objectIds(p.tree!)[i]]));
            expect(read.size, f.name).toBeGreaterThan(0);
            for (const [t, id] of read) expect(id, f.name).toBe(asModel.get(t));
        }
    });

    it('reads nothing from a text with no ids', () => {
        for (const f of fixtures()) {
            if (printOf(f.g, f.objects).startsWith('throws')) continue;
            expect(textIdsOf(parseText(printOf(f.g, f.objects), f.g).tree!, f.g).size, f.name).toBe(0);
        }
    });

    it('is not fooled by an ordinary comment, a comment of another shape, or one off the head line', () => {
        const g = tolerantCases('clike')[0].g;
        const base = 'Library city { // a note\n  books {\n    Book book0 { /* @id */\n      genre FICTION // @id b9\n    }\n    Book book1 { // @idb1\n      genre SCIENCE\n    }\n  }\n}';
        expect(parseText(base, g).errors).toEqual([]);
        expect(ids(base, g)).toEqual({});
    });

    it('reads the block form and the Pascal form', () => {
        const g = tolerantCases('clike')[0].g;
        const r = parseText('Library city { /* @id lib */\n  books {\n    Book book0 { genre FICTION } // @id b0\n  }\n}', g);
        expect(r.errors).toEqual([]);
        expect([...textIdsOf(r.tree!, g).values()]).toEqual(['lib', 'b0']);
        const pg = tolerantCases('pascal')[0].g;
        const pt = printTextModel(withIds(pg), libraryObjects(1, 0)).text;
        expect(Object.values(ids(pt, pg))).toEqual(['lib', 'b0']);
    });
});

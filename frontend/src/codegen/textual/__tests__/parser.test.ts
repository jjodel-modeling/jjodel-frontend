/**
 * Step T2a of the textual notation (P-2026-11-02-0024; R-TXT-21 (1), (8); R-TXT-4, R-TXT-11, R-TXT-24): the parser.
 * Print, parse, print gives the same text on T1's corpus; errors carry the position where the parser noticed them; one
 * bad line costs that line only; a body left open is reported and its objects are recovered, never applicable.
 */

import { describe, it, expect } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextObject } from '../metamodel';
import { isApplicableParse, parseText } from '../parser';
import { printTextModel } from '../printer';
import { CLIKE_STYLE } from '../style';
import type { NotationStyle } from '../style';
import { BOX, CASES, DIAMOND, GARAGE, grammarOf, INNER, LOWER, NON_DIAMOND } from './corpus';
import { FIXTURE, objectsOf } from './spec';
import type { Spec } from './spec';

const print = (g: ConcreteGrammar, objects: readonly TextObject[]): string => printTextModel(g, objects).text;

/** The parsed objects with the ids of the printed ones, matched by text order (both lists are in text order). */
function renamed(g: ConcreteGrammar, original: readonly TextObject[], parsed: readonly TextObject[]): TextObject[] {
    const order = printTextModel(g, original).spans.map(s => s.id);
    const to = new Map(parsed.map((o, i) => [o.id, order[i]]));
    const id = (v: unknown): unknown => (typeof v === 'string' && to.has(v) ? to.get(v) : v);
    return parsed.map(o => ({
        id: to.get(o.id)!, cls: o.cls,
        slots: Object.fromEntries(Object.entries(o.slots).map(([k, v]) => {
            const f = g.objects[o.cls].features.find(x => x.name === k);
            const linked = f !== undefined && f.kind !== 'attribute';
            return [k, linked ? (Array.isArray(v) ? v.map(id) : id(v)) : v];
        })),
    }));
}

describe('round trip: print, parse, print (R-TXT-21 (1))', () => {
    const corpus: [string, Spec, NotationStyle][] = [
        ['the 1709 fixture', FIXTURE, CLIKE_STYLE],
        ['a diamond', DIAMOND, CLIKE_STYLE],
        ['a multiple inheritance without a diamond', NON_DIAMOND, CLIKE_STYLE],
        ['names, homonyms, paths, several roots', GARAGE, CLIKE_STYLE],
        ['a single nameless root referenced as Box[0]', BOX, CLIKE_STYLE],
        ['a single containment and a name that printed alike before R-TXT-25 (5, 6)', INNER, CLIKE_STYLE],
        ['class keywords and literals in lower case', GARAGE, LOWER],
        ['mixed-case literals after the fallback', FIXTURE, LOWER],
        ['two class keywords after the fallback', CASES, LOWER],
    ];
    it.each(corpus)('%s', (_, spec, style) => {
        const g = grammarOf(spec, style);
        const text = print(g, objectsOf(spec));
        const r = parseText(text, g);
        expect(r.errors).toEqual([]);
        expect(r.recovered).toEqual([]);
        expect(isApplicableParse(r)).toBe(true);
        expect(print(g, r.objects)).toBe(text);
    });

    it.each([['FIXTURE', FIXTURE], ['GARAGE', GARAGE], ['BOX', BOX], ['INNER', INNER]] as const)('%s: the parsed objects are the model, up to ids', (_, spec) => {
        const g = grammarOf(spec);
        const original = objectsOf(spec);
        const r = parseText(print(g, original), g);
        const byId = new Map(original.map(o => [o.id, o]));
        for (const o of renamed(g, original, r.objects)) expect(o).toEqual(byId.get(o.id));
        expect(r.objects).toHaveLength(original.length);
    });

    it('ids are t1, t2, ... in text order, spans run from the keyword to the last token', () => {
        const g = grammarOf(BOX);
        const text = print(g, objectsOf(BOX));
        const r = parseText(text, g);
        expect(r.objects.map(o => `${o.id}:${o.cls}`)).toEqual(['t1:Box', 't2:Box', 't3:Box', 't4:Tag']);
        const s = r.spans.find(x => x.id === 't3')!;
        expect(text.slice(s.start, s.end)).toBe('Box {}');
        expect(r.spans[0]).toEqual({ id: 't1', start: 0, end: text.length });
    });

    it('layout and comments are free: one line, extra spaces, // and /* */', () => {
        const g = grammarOf(FIXTURE);
        const r = parseText('// a part\nPart a{size 1 /* one */ kind FAST peers[b,b]}  Part   b {}', g);
        expect(r.errors).toEqual([]);
        expect(r.objects.map(o => o.slots)).toEqual([{ name: 'a', size: 1, kind: 'FAST', peers: ['t2', 't2'] }, { name: 'b' }]);
    });
});

const parse = (text: string) => parseText(text, grammarOf(FIXTURE));
const brief = (text: string) => parse(text).errors.map(e => `${e.line}:${e.col} ${e.message}`);

describe('errors carry line, column and a readable message', () => {
    it('a value of the wrong type', () => {
        expect(brief('Part a {\n  size four\n}')).toEqual(['2:8 expected an integer; found name "four"']);
    });

    it('a missing brace, noticed where a line starts an item of an enclosing body', () => {
        expect(brief('Part a {\n  size 1\nPart b {\n  size 2\n}')).toEqual(['3:1 expected "}" to close the "{" at 1:8; found name "Part"']);
    });

    it('an unknown keyword', () => {
        expect(brief('Part a {\n  colour 3\n}')).toEqual(['2:3 expected "doc", "size", "kind", "peers" or "}"; found name "colour"']);
    });

    it('an unresolved reference', () => {
        expect(brief('Sys s {\n  main nobody\n}')).toEqual(['2:8 no object of type Part is named "nobody"']);
    });

    it('R-TXT-32: "@" takes a string; the id is read as written, never resolved against the text (mutants: "@" read as a name; the id resolved by name)', () => {
        expect(brief('Sys s {\n  main @nobody\n}')).toEqual(['2:9 expected a string, the id of an object outside the text; found name "nobody"']);
        const r = parse('Part a {}\nSys s {\n  main @"a"\n}');
        expect(r.errors).toEqual([]);
        expect(r.objects.find(o => o.cls === 'Sys')!.slots.main).toEqual({ outer: 'a' });
    });

    it('a duplicate name where a reference needs it unique (R-TXT-4)', () => {
        expect(brief('Sys s {\n  parts {\n    Part dup {}\n    Part dup {}\n  }\n  main dup\n}'))
            .toEqual(['6:8 "dup" is ambiguous: 2 objects of type Part carry that name (3:5, 4:5); write a path']);
    });

    it('a reference to an object of another type, a path into nothing, a feature given twice or out of order', () => {
        expect(brief('Sys s {\n  links {\n    Link {}\n  }\n  main Sys[0].links[0]\n}')).toEqual(['5:8 "main" expects Part; the reference names a Link']);
        expect(brief('Sys s {\n  main Sys[0].parts[3]\n}')).toEqual(['2:8 parts[3] names no object']);
        expect(brief('Part a {\n  size 1\n  size 2\n}')).toEqual(['3:3 "size" is given twice']);
        expect(brief('Part a {\n  kind FAST\n  size 2\n}')).toEqual(['3:3 "size" must come before "kind"']);
        expect(brief('Lorry x {}\nPart a {}')).toEqual(['1:1 expected "Sys", "Part" or "Link"; found name "Lorry"']);
    });

    it('lexical errors: an unterminated string, a stray character', () => {
        expect(brief('Part "a {\n}')).toEqual(['1:6 unterminated string', '2:1 expected "{"; found "}"']);
        expect(brief('Part a { size 1 § }')).toEqual(['1:17 unexpected character "§"']);
    });
});

describe('paths (R-TXT-25 (5, 6))', () => {
    const g = grammarOf(INNER);
    const see = (ref: string) => parseText(`Room hall {\n  inner {\n    Room {}\n  }\n  rooms {\n    Room inner {}\n  }\n  see [${ref}]\n}`, g);
    const brief2 = (ref: string) => see(ref).errors.map(e => e.message);

    it('a path and a name never read alike: Room[0].inner[0] is the containment, inner the named room', () => {
        expect(see('Room[0].inner[0], inner, Room[0]').objects[0].slots.see).toEqual(['t2', 't3', 't1']);
    });

    it('a root is counted among the top-level objects of its class', () => {
        const r = parseText('Part a {}\nSys s {\n  main Part[1]\n}\nPart b {}', grammarOf(FIXTURE));
        expect(r.errors).toEqual([]);
        expect(r.objects[1].slots.main).toBe('t3');
    });

    it('the forms R-TXT-25 retires, and paths that name nothing, are errors', () => {
        expect(brief2('Room[0].inner')).toEqual(['expected "["; found "]"']);
        expect(brief2('[0]')).toEqual(['expected a reference (a name, a path, or @ and an id); found "["']);
        expect(brief2('Room[0].inner[1]')).toEqual(['"inner" holds one object: write inner[0]']);
        expect(brief2('Room[1]')).toEqual(['there is no top-level Room[1]: the text has 1']);
        expect(brief2('Hall[0]')).toEqual(['a path starts with a class: there is no class "Hall"']);
        expect(brief2('Room[0].see[0]')).toEqual(['Room has no containment "see"']);
    });
});

describe('recovery (R-TXT-21 (1), (8))', () => {
    it('one bad line costs only that line, in a body and at the top level', () => {
        const r = parse('Part a {\n  doc "d"\n  size four five\n  kind slow\n  peers [b]\n}\n} junk\nPart b {}');
        expect(r.errors.map(e => e.line)).toEqual([3, 7]);
        expect(r.objects.map(o => o.slots)).toEqual([{ name: 'a', doc: 'd', kind: 'slow', peers: ['t2'] }, { name: 'b' }]);
        expect(r.recovered).toEqual(['t1']);
    });

    it('a bad line inside a nested object resumes inside that object', () => {
        const r = parse('Sys s {\n  width 3\n  parts {\n    Part a {\n      size x\n      kind slow\n    }\n    Part b {}\n  }\n}');
        expect(r.errors.map(e => `${e.line}:${e.col}`)).toEqual(['5:12']);
        expect(r.objects.map(o => o.slots)).toEqual([{ name: 's', width: 3, parts: ['t2', 't3'] }, { name: 'a', kind: 'slow' }, { name: 'b' }]);
        expect(r.recovered).toEqual(['t2']);
    });

    it('a missing } at the end is reported; its objects are recovered and the text is not applicable', () => {
        const r = parse('Sys s {\n  parts {\n    Part a {}\n    Part b {\n      size 2\n    }\n');
        expect(r.errors.map(e => `${e.line}:${e.col} ${e.message}`)).toEqual([
            '7:1 expected "}" to close the "{" at 2:9; found end of text',
            '7:1 expected "}" to close the "{" at 1:7; found end of text',
        ]);
        expect(r.objects).toHaveLength(3);
        expect(r.recovered).toEqual(['t1', 't2', 't3']);
        expect(isApplicableParse(r)).toBe(false);
    });

    it('a missing } in the middle keeps the objects after it, which are applicable as parsed', () => {
        const r = parse('Part a {\n  size 1\nPart b {\n  size 2\n}');
        expect(r.objects.map(o => o.slots)).toEqual([{ name: 'a', size: 1 }, { name: 'b', size: 2 }]);
        expect(r.recovered).toEqual(['t1']);
        expect(isApplicableParse(r)).toBe(false);
    });

    it('an unresolved reference marks its object recovered and drops only that value', () => {
        const r = parse('Part a {\n  peers [b, nobody, b]\n}\nPart b {}');
        expect(r.objects[0].slots.peers).toEqual(['t2', 't2']);
        expect(r.recovered).toEqual(['t1']);
    });

    it('never throws and always ends, on every prefix of a printed text', () => {
        const g = grammarOf(GARAGE);
        const text = print(g, objectsOf(GARAGE));
        for (let n = 0; n <= text.length; n += 3) {
            const r = parseText(text.slice(0, n), g);
            if (r.errors.length === 0) expect(r.recovered).toEqual([]);
        }
        expect(parseText(text.slice(0, text.length - 1), g).errors.length).toBeGreaterThan(0);
    });
});

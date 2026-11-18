/**
 * Step B2 of the textual IDE (P-2026-11-04-0125; R-TXT-39 (1), (2)): the outline of the Text tab, its group nodes and
 * the labels of unnamed objects (rule C4'), on the non-hardware corpus of step A. The turnstile is demoESM's model.
 */

import { describe, it, expect, vi } from 'vitest';

// The tab's module imports the app at load, as in textualTab.test.ts: only its pure functions are read here.
vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { textOutline, UNKNOWN_CONTAINER } from '../languageService';
import type { OutlineNode, TextOutline } from '../languageService';
import type { TextObject } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { OUTLINE_ROW_HEIGHT, outlineRows, outlineWindow } from '../ui/TextualTab';
import { PORT_CLIKE, PORT_PASCAL, portGrammar, portObjects } from './portCorpus';
import { LIBRARY_IDS, LIBRARY_MM, libraryObjects, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

const CASES = tolerantCases();
const byName = (n: string): TolerantCase => CASES.find(c => c.name === n)!;
const LIB = byName('library, plain');
const LIB_ANNOTATED = byName('library, annotated');
const TS_PLAIN = byName('turnstile, plain');
const TS_ANNOTATED = byName('turnstile, annotated');
const GARAGE = byName('garage, c-like');
const GARAGE_LOWER = byName('garage, lower');

const outlineOf = (c: TolerantCase, text: string): TextOutline => textOutline(text, parseText(text, c.g), c.g);
const printOf = (c: TolerantCase, objects: readonly TextObject[] = c.objects): string => printTextModel(c.g, objects).text;
const flat = (ss: readonly OutlineNode[]): OutlineNode[] => ss.flatMap(s => [s, ...flat(s.children)]);
/** `label` for an object, `label/` for a group, `label (detail)` when the detail is a feature. */
const shape = (ss: readonly OutlineNode[]): unknown[] => ss.map(s => {
    const head = s.kind === 'object' ? `${s.label}${s.named || !s.detail ? '' : ` (${s.detail})`}` : `${s.label}/`;
    return s.children.length ? [head, shape(s.children)] : head;
});
const labelsById = (o: TextOutline): Map<string, string> => new Map(flat(o.nodes).filter(s => s.id).map(s => [s.id!, s.label]));
/** The printer's ids, joined to the parsed ids by text order: the parser numbers its own objects. */
const labelsByModelId = (c: TolerantCase, objects: readonly TextObject[]): Map<string, string> => {
    const printed = printTextModel(c.g, objects);
    const o = outlineOf(c, printed.text);
    const parsed = flat(o.nodes).filter(s => s.kind === 'object').sort((a, b) => a.start - b.start);
    const spans = [...printed.spans].sort((a, b) => a.start - b.start);
    expect(parsed).toHaveLength(spans.length);
    return new Map(spans.map((sp, i) => [sp.id, parsed[i].label]));
};
/** The model with every containment list and the top level in reverse order (the probe's reprint). */
const reversed = (c: TolerantCase): TextObject[] => {
    const containments = new Set(c.mm.classes.flatMap(k => (k.references ?? []).filter(r => r.containment && r.many).map(r => r.name)));
    return [...c.objects].reverse().map(o => ({ ...o, slots: Object.fromEntries(Object.entries(o.slots).map(([f, v]) => [f, containments.has(f) && Array.isArray(v) ? [...v].reverse() : v])) }));
};
const cleared = (objects: readonly TextObject[]): TextObject[] => objects.map(o => ('name' in o.slots ? { ...o, slots: { ...o.slots, name: null } } : o));

describe('outline groups (R-TXT-39 (1))', () => {
    it('turnstile, plain (demoESM): the containment keyword is a group node, unnamed transitions labelled by their event', () => {
        const text = printOf(TS_PLAIN);
        expect(shape(outlineOf(TS_PLAIN, text).nodes)).toEqual([
            ['Initial[0]', [['transitions/', ['Transition coin (event)', 'Transition push (event)', 'Transition stop (event)']]]],
            ['State[0]', [['transitions/', ['Transition push (event)']]]],
            'Terminal[0]', 'coin', 'push', 'stop',
        ]);
    });

    it('turnstile, annotated: an inline containment prints no keyword and has no group node', () => {
        const text = printOf(TS_ANNOTATED);
        const o = outlineOf(TS_ANNOTATED, text);
        expect(flat(o.nodes).filter(s => s.kind === 'group')).toEqual([]);
        expect(shape(o.nodes)[0]).toEqual(['Initial[0]', ['Transition coin (event)', 'Transition push (event)', 'Transition stop (event)']]);
        expect(o.nodes[0].children[0].feature).toBe('transitions');
    });

    it('library, annotated: a grouped containment gives two levels, the subset under the containment keyword', () => {
        const text = printOf(LIB_ANNOTATED);
        const lib = outlineOf(LIB_ANNOTATED, text).nodes[0];
        const groups = lib.children.map(g => [g.label, g.detail, g.children.map(s => s.kind === 'group' ? `${s.label}/${s.children.length}` : s.label)]);
        expect(groups[0][0]).toBe('books');
        expect(groups[0][1]).toBe('6');
        expect((groups[0][2] as string[]).every(x => x.includes('/'))).toBe(true);
        expect(lib.children.find(g => g.label === 'patrons')?.children.map(s => s.label)).toEqual(['reader0', 'reader1', 'reader2']);
        const subset = lib.children[0].children[0];
        expect(text.slice(subset.selectStart, subset.selectEnd)).toBe(subset.label);
        expect(subset.feature).toBe('books');
    });

    it('library, annotated: the subsets of one grouped feature stay a group each (R-TXT-44 (3); mutant: merge by feature alone)', () => {
        const subsets = outlineOf(LIB_ANNOTATED, printOf(LIB_ANNOTATED)).nodes[0].children[0].children;
        expect(subsets.length).toBeGreaterThan(1);
        expect(new Set(subsets.map(s => s.label)).size).toBe(subsets.length);
    });

    it('library, plain: named objects take their name, the class as secondary text', () => {
        const text = printOf(LIB);
        const lib = outlineOf(LIB, text).nodes[0];
        expect([lib.label, lib.detail]).toEqual(['city', 'Library']);
        expect(lib.children.map(g => `${g.label}/${g.detail}`)).toEqual(['books/6', 'members/3']);
        expect(lib.children[0].children.map(s => s.label)).toEqual(['book0', 'book1', 'book2', 'book3', 'book4', 'book5']);
        const b = lib.children[0].children[1];
        expect(text.slice(b.selectStart, b.selectEnd)).toBe('book1');
    });

    it('garage: a single-valued containment is a group of one, the engine labelled by its power', () => {
        const car = outlineOf(GARAGE, printOf(GARAGE)).nodes.flatMap(s => s.children).find(g => g.label === 'engine')!;
        expect(car.kind).toBe('group');
        expect(car.children.map(s => [s.label, s.detail])).toEqual([['Engine 90', 'power']]);
        const lower = flat(outlineOf(GARAGE_LOWER, printOf(GARAGE_LOWER)).nodes).filter(s => s.cls === 'Engine').map(s => s.label);
        expect(lower).toEqual(['engine 90', 'engine 0']);
    });

    it('a broken root: its objects sit in the `unknown container` group, recovered', () => {
        const text = printOf(LIB).replace(/^Library /, '');
        const o = outlineOf(LIB, text);
        expect(o.nodes).toHaveLength(1);
        expect(o.nodes[0]).toMatchObject({ kind: 'unknown', label: UNKNOWN_CONTAINER, recovered: true });
        expect(o.nodes[0].children.length).toBeGreaterThan(0);
        expect(flat(o.nodes[0].children).filter(s => s.kind === 'object').every(s => s.recovered)).toBe(true);
    });

    it('a text cut inside a transition: its container unclosed, the transitions recovered (their events lie past the cut)', () => {
        const full = printOf(TS_PLAIN);
        const text = full.slice(0, full.indexOf('push') + 4);
        const initial = outlineOf(TS_PLAIN, text).nodes[0];
        const ts = initial.children[0].children;
        expect(initial).toMatchObject({ unclosed: true, recovered: true });
        expect(ts.map(s => [s.label, s.recovered, s.unclosed])).toEqual([['Transition coin', true, false], ['Transition push', true, false]]);
    });

    it.each([['C-like', PORT_CLIKE], ['Pascal/Ada', PORT_PASCAL]] as const)('%s ports: one group per per-item feature, its keyword and item count (R-TXT-44 (3); mutant: a group per item)', (_s, record) => {
        const g = portGrammar(record);
        const text = printTextModel(g, portObjects()).text;
        const o = textOutline(text, parseText(text, g), g);
        const groups = o.nodes[0].children;
        expect(groups.map(s => [s.kind, s.label, s.detail, s.feature])).toEqual([['group', 'input', '2', 'inputs'], ['group', 'output', '1', 'outputs']]);
        expect(groups[0].children.map(s => s.label)).toEqual(['instr', 'Port[1]']);
        expect(groups[0].children.map(s => s.feature)).toEqual(['inputs', 'inputs']);
        expect(new Set(flat(o.nodes).map(s => s.key)).size).toBe(flat(o.nodes).length);
        // The breadcrumb reads the merged group: the second input sits under the same `input` node as the first.
        expect(o.pathAt(text.indexOf('Bool')).map(s => s.label)).toEqual(['cpu', 'input', 'Port[1]', 'Bool[0]']);
        expect(o.pathAt(text.indexOf('Bool'))[1]).toBe(o.pathAt(text.indexOf('32'))[1]);
    });
});

describe('unnamed labels (R-TXT-39 (2), rule C4\')', () => {
    it.each(CASES.map(c => [c.name, c] as const))('%s: labels unchanged by model id after a reversed reprint', (_, c) => {
        const before = labelsByModelId(c, c.objects);
        const after = labelsByModelId(c, reversed(c));
        expect([...before].filter(([id, l]) => after.get(id) !== l)).toEqual([]);
    });

    it('library, names cleared: an enum literal labels a book, colliding siblings suffixed with their index only', () => {
        const objects = cleared(LIB.objects);
        const books = outlineOf(LIB, printOf(LIB, objects)).nodes[0].children[0].children;
        expect(books.map(s => s.label)).toEqual(['Book FICTION [0]', 'Book SCIENCE [1]', 'Book POETRY', 'Book HISTORY', 'Book FICTION [4]', 'Book SCIENCE [5]']);
        expect(new Set(books.map(s => s.detail))).toEqual(new Set(['genre']));
    });

    it('an enum literal printed after an attribute value still labels the object: names come first', () => {
        // Not corpus: the library with `year` declared before `genre`, so a value prints before the literal.
        const mm = { ...LIBRARY_MM, classes: LIBRARY_MM.classes.map(k => (k.name === 'Book' ? { ...k, attributes: [k.attributes![0], k.attributes![2], k.attributes![1]] } : k)) };
        const c: TolerantCase = { name: 'library, year first', mm, g: textualNotation(mm, { record: null, issues: [] }, LIBRARY_IDS).grammar, objects: cleared(LIB.objects) };
        const text = printOf(c);
        const b1 = outlineOf(c, text).nodes[0].children[0].children[1];
        expect(text.indexOf('year', b1.start)).toBeLessThan(text.indexOf('SCIENCE', b1.start));
        expect([b1.label, b1.detail]).toEqual(['Book SCIENCE [1]', 'genre']);
    });

    it('library, names cleared: an object with no single value falls to Class[k], k within its feature', () => {
        const members = outlineOf(LIB, printOf(LIB, cleared(LIB.objects))).nodes[0].children[1].children;
        expect(members.map(s => [s.label, s.detail])).toEqual([['Member[0]', ''], ['Member[1]', ''], ['Member[2]', '']]);
    });

    it('an attribute value is quoted as printed and cut at 24 characters', () => {
        const objects = cleared(LIB.objects).map(o => (o.cls === 'Book' ? { ...o, slots: { ...o.slots, genre: null, year: 1999 } } : o));
        const books = outlineOf(LIB, printOf(LIB, objects)).nodes[0].children[0].children;
        expect(books[0]).toMatchObject({ label: 'Book 1999 [0]', detail: 'year' });
        const long = [{ id: 'lib', cls: 'Library', slots: { name: 'a'.repeat(40), books: [], members: [] } }];
        const keys = outlineOf(LIB, printOf(LIB, long)).nodes.map(s => s.label);
        expect(keys).toEqual(['a'.repeat(40)]);
    });

    it('keys are unique and follow the labels, so expansion survives an insertion before a node', () => {
        const a = outlineOf(TS_PLAIN, printOf(TS_PLAIN));
        const keys = flat(a.nodes).map(s => s.key);
        expect(new Set(keys).size).toBe(keys.length);
        expect(a.nodes[0].children[0].key).toBe('/Initial[0]/transitions:transitions');
        expect(labelsById(a).size).toBe(10);
    });
});

describe('breadcrumb path', () => {
    it('turnstile: the caret on an event reference reads Initial › transitions › Transition coin', () => {
        const text = printOf(TS_PLAIN);
        const o = outlineOf(TS_PLAIN, text);
        const at = text.indexOf('coin', text.indexOf('Transition'));
        expect(o.pathAt(at).map(s => s.label)).toEqual(['Initial[0]', 'transitions', 'Transition coin']);
        expect(o.pathAt(text.length + 5)).toEqual([]);
    });

    it('library, annotated: the path of a book holds both group levels', () => {
        const text = printOf(LIB_ANNOTATED);
        const o = outlineOf(LIB_ANNOTATED, text);
        const path = o.pathAt(text.indexOf('book3'));
        expect(path.map(s => s.kind)).toEqual(['object', 'group', 'group', 'object']);
        expect(path[3].label).toBe('book3');
    });
});

describe('outline rows and window (the Text tab\'s outline)', () => {
    const o = outlineOf(TS_PLAIN, printOf(TS_PLAIN));
    const show = (rows: ReturnType<typeof outlineRows>): string[] => rows.map(r => `${'  '.repeat(r.depth)}${r.node.label}`);

    it('every node open by default; a collapsed node hides its children only', () => {
        expect(outlineRows(o.nodes, new Set(), '')).toHaveLength(flat(o.nodes).length);
        const rows = outlineRows(o.nodes, new Set([o.nodes[0].children[0].key]), '');
        expect(show(rows).slice(0, 4)).toEqual(['Initial[0]', '  transitions', 'State[0]', '  transitions']);
        expect(rows[1].open).toBe(false);
    });

    it('a filter keeps the matches under their ancestors, matching the secondary text too, case aside', () => {
        expect(show(outlineRows(o.nodes, new Set(), 'STOP'))).toEqual(['Initial[0]', '  transitions', '    Transition stop', 'stop']);
        expect(outlineRows(o.nodes, new Set(), 'event').filter(r => r.node.cls === 'Transition')).toHaveLength(4);
        expect(outlineRows(o.nodes, new Set([o.nodes[0].key]), 'coin').map(r => r.node.label)).toContain('Transition coin');
    });

    it('the window covers the viewport and eight rows either side, within the rows', () => {
        expect(outlineWindow(1000, 100 * OUTLINE_ROW_HEIGHT, 20 * OUTLINE_ROW_HEIGHT)).toEqual({ first: 92, last: 128 });
        expect(outlineWindow(10, 0, 480)).toEqual({ first: 0, last: 10 });
        expect(outlineWindow(0, 0, 0)).toEqual({ first: 0, last: 0 });
    });
});

describe('measured', () => {
    it('1,000 objects: the outline within 10 ms (measured)', () => {
        const text = printTextModel(LIB.g, libraryObjects(833, 166)).text;
        const p = parseText(text, LIB.g);
        expect(flat(textOutline(text, p, LIB.g).nodes).filter(s => s.kind === 'object')).toHaveLength(1000);
        let least = Infinity;
        for (let i = 0; i < 7; i++) { const s = performance.now(); textOutline(text, p, LIB.g); least = Math.min(least, performance.now() - s); }
        expect(least, `outline ${least.toFixed(1)} ms`).toBeLessThan(10);
        const nodes = textOutline(text, p, LIB.g).nodes;
        let rows = Infinity;
        for (let i = 0; i < 7; i++) { const s = performance.now(); outlineRows(nodes, new Set(), 'book7'); rows = Math.min(rows, performance.now() - s); }
        expect(rows, `rows with a filter ${rows.toFixed(1)} ms`).toBeLessThan(4);
    });
});

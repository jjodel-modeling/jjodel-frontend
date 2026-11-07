/**
 * Step E lane E1a (P-2026-11-07-0048; R-TXT-20, R-TXT-54 E10; docs/discovery/discovery_2026-11-06_textual_e_sync.md
 * §3.3): T10's splice. A diagram edit changes the model; `reprintChanged` keeps the typed text of every object whose own
 * print did not change, recursing into the children, and takes the changed ones from the new print, their comments put
 * back by owner. The typed text here is the print with comments and layout written into it, and its spans are the
 * ones the editor would carry: the parse's, under the print's ids (`carried`).
 *
 * Every case asserts print-parse equality: the spliced text reads back as the new print. Each test name says which
 * mutant kills it; the bench is in the commit body.
 *
 * Lane E1b (P-2026-11-07-0346): the Text tab's reprint branch, `modelReprint`, splices from the agreement it keeps (the
 * typed text, the old print and the old print's spans) and falls back to the whole print. The tab's imports that reach
 * the store are mocked, as textualTab.test.ts does.
 */

import { readFileSync } from 'node:fs';
import lz from 'async-lz-string';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextObject } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import type { RefSpan } from '../printer';
import { CLIKE_STYLE, PASCAL_STYLE } from '../style';
import { reprintChanged } from '../textReprint';
import type { PrintedText } from '../textReprint';
import { agreedPrint, modelReprint, unchangedAgreement } from '../ui/TextualTab';
import type { TextSync } from '../ui/TextualTab';
import { GARAGE, grammarOf } from './corpus';
import { objectsOf } from './spec';
import type { ClassSpec, ObjSpec, Spec } from './spec';

/** The print of a model, as the tab reads it (`readModel`): text, spans and reference tokens. */
const printed = (g: ConcreteGrammar, objects: readonly TextObject[]): PrintedText => {
    const p = printTextModel(g, objects);
    return { text: p.text, spans: p.spans, refs: p.refs ?? [] };
};

/**
 * The typed text with the spans and tokens the editor carries over the edits that wrote it: the parse's, named by the
 * print's ids. The typed text has the print's objects in the print's order, so the two lists zip.
 */
function carried(g: ConcreteGrammar, old: PrintedText, text: string): PrintedText {
    const p = parseText(text, g);
    expect(p.errors).toEqual([]);
    expect(p.spans.length).toBe(old.spans.length);
    const owner = new Map(p.spans.map((s, i) => [s.id, old.spans[i].id]));
    // The parse lists its tokens by owner, the print in text order: zipped in text order.
    const byStart = <R extends { readonly start: number }>(rs: readonly R[]): R[] => [...rs].sort((x, y) => x.start - y.start);
    const printedRefs = byStart(old.refs ?? []);
    const refs: RefSpan[] = byStart(p.refs ?? []).map((r, i) => ({ ...printedRefs[i], owner: owner.get(r.owner)!, text: r.text, start: r.start, end: r.end }));
    expect(refs.map(r => r.owner)).toEqual(printedRefs.map(r => r.owner));
    return { text, spans: p.spans.map((s, i) => ({ ...s, id: old.spans[i].id })), refs };
}

/** The objects with `edit` applied to the object `id`'s slots. */
const editing = (objects: readonly TextObject[], id: string, slots: Record<string, unknown>): TextObject[] =>
    objects.map(o => (o.id === id ? { ...o, slots: { ...o.slots, ...slots } } : o));

/** The spliced text reads back as the new print (print-parse equality), and its spans are the parse's, under the print's ids. */
function readsAsPrint(g: ConcreteGrammar, text: string, next: PrintedText, spans: readonly { id: string; start: number; end: number }[]): void {
    const p = parseText(text, g);
    expect(p.errors).toEqual([]);
    expect(printTextModel(g, p.objects).text).toBe(next.text);
    expect(spans.map(s => [s.start, s.end])).toEqual(p.spans.map(s => [s.start, s.end]));
    expect(spans.map(s => s.id)).toEqual(next.spans.map(s => s.id));
}

const span = (t: PrintedText, id: string): string => {
    const s = t.spans.find(x => x.id === id)!;
    return t.text.slice(s.start, s.end);
};

// ---- GARAGE, typed with comments and a layout of its own -----------------------------------------------------------

const G = grammarOf(GARAGE);
const OBJECTS = objectsOf(GARAGE);
const OLD = printed(G, OBJECTS);

/** The edits the user typed on the print: comments own-line and trailing, a blank line, an indentation of their own. */
const TYPED_TEXT = [
    ['Car alpha {\n  speed 1.5\n', 'Car alpha {\n  speed 1.5  // km/h\n'],
    ['      power 90\n', '      power 90 // hp\n'],
    ['    Wheel w {\n      size 17', '    // second wheel\n    Wheel w {\n      size 17'],
    ['    Wheel "it\'s', '    // odd one\n    Wheel "it\'s'],
    ['Car beta {\n', 'Car beta { /* second */\n'],
    ['Gear w {\n  wheel v\n}', '\n// a gear\nGear w {\n      wheel v\n}'],
].reduce((t, [from, to]) => {
    expect(t).toContain(from);
    return t.replace(from, to);
}, OLD.text) + '\n// end';
const TYPED = carried(G, OLD, TYPED_TEXT);
const COMMENTS = ['// km/h', '// hp', '// second wheel', '// odd one', '/* second */', '// a gear', '// end'];

/** The splice of a diagram edit on GARAGE as typed. */
const splice = (objects: readonly TextObject[]) => {
    const next = printed(G, objects);
    const r = reprintChanged({ grammar: G, typed: TYPED, old: OLD, next });
    expect(r).not.toBeNull();
    readsAsPrint(G, r!.text, next, r!.spans);
    return { r: r!, next };
};

/** `text` with each `[from, to]` replaced once, every `from` present. */
const replaced = (text: string, ...pairs: readonly (readonly [string, string])[]): string =>
    pairs.reduce((t, [from, to]) => {
        expect(t).toContain(from);
        return t.replace(from, to);
    }, text);

describe('reprintChanged on GARAGE as typed', () => {
    it('reprints nothing when the model prints as before: the typed text is the result (mutant: rule 1 off)', () => {
        const { r } = splice(OBJECTS);
        expect(r.text).toBe(TYPED_TEXT);
    });

    it('an attribute changed: only its object is reprinted, its trailing comment put back at the end of its head line (mutants: rule 1 off, rule 2 without comments)', () => {
        const { r } = splice(editing(OBJECTS, 'e1', { power: 120 }));
        expect(r.text).toBe(replaced(TYPED_TEXT, ['Engine {\n      power 90 // hp\n', 'Engine { // hp\n      power 120\n']));
    });

    it('an own-line comment of a changed object goes before its first token, at its indentation (mutant: rule 2 without comments)', () => {
        const old = printed(G, OBJECTS);
        const typed = carried(G, old, replaced(old.text, ['      power 90\n', '      // the power\n      power 90\n']));
        const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));
        const r = reprintChanged({ grammar: G, typed, old, next });
        expect(r).not.toBeNull();
        readsAsPrint(G, r!.text, next, r!.spans);
        expect(r!.text).toBe(replaced(next.text, ['    Engine {\n', '    // the power\n    Engine {\n']));
    });

    it('a rename with a referrer: the renamed object and the referrer are reprinted, their children keep their typed text and comments (mutants: rule 2 without recursion, rule 2 without comments)', () => {
        const { r } = splice(editing(OBJECTS, 'c2', { name: 'gamma' }));
        expect(r.text).toBe(replaced(TYPED_TEXT,
            ['Car alpha {\n  speed 1.5  // km/h\n', 'Car alpha { // km/h\n  speed 1.5\n'],
            ['  tow beta\n', '  tow gamma\n'],
            ['Car beta { /* second */\n', 'Car gamma { /* second */\n'],
        ));
        for (const c of COMMENTS) expect(r.text).toContain(c);
    });

    it('a create: the new object is inserted after its previous sibling\'s typed text, a new root before the closing comment (mutant: rule 1 off)', () => {
        const objects = [
            ...editing(OBJECTS, 'c2', { wheels: ['w4', 'w5'] }),
            { id: 'w5', cls: 'Wheel', slots: { name: 'x' } },
            { id: 'g2', cls: 'Gear', slots: { name: 'z' } },
        ];
        const { r } = splice(objects);
        expect(r.text).toBe(replaced(TYPED_TEXT,
            ['      pair Car[0].wheels[0].bolts[0]\n    }\n', '      pair Car[0].wheels[0].bolts[0]\n    }\n    Wheel x {}\n'],
            ['}\n// end', '}\nGear z {}\n// end'],
        ));
    });

    it('a delete: the object is cut with its leading comment, the neighbours keep theirs (mutants: rule 4 keeps the leading trivia, rule 4 keeps the trailing trivia)', () => {
        const { r } = splice(editing(OBJECTS, 'c1', { spare: ['c3'] }).filter(o => o.id !== 'w3'));
        expect(r.text).toBe(replaced(TYPED_TEXT, ['    // odd one\n    Wheel "it\'s \\"odd\\"" {\n      size 1\n    }\n', '']));
        for (const c of COMMENTS.filter(c => c !== '// odd one')) expect(r.text).toContain(c);
    });

    it('a move: the object carries its typed text and its comment to the new container (mutant: rule 1 off)', () => {
        const moved = '    // odd one\n    Wheel "it\'s \\"odd\\"" {\n      size 1\n    }\n';
        const objects = editing(editing(OBJECTS, 'c1', { spare: ['c3'] }), 'c2', { wheels: ['w4', 'w3'] });
        const { r } = splice(objects);
        expect(r.text).toBe(replaced(TYPED_TEXT,
            [moved, ''],
            ['      pair Car[0].wheels[0].bolts[0]\n    }\n', `      pair Car[0].wheels[0].bolts[0]\n    }\n${moved}`],
        ));
    });

    it('keeps the typed layout of an object whose print did not change (mutant: rule 1 off)', () => {
        const { r } = splice(editing(OBJECTS, 'e0', { power: 7 }));
        expect(r.text).toContain('Gear w {\n      wheel v\n}');
        expect(span(r, 'g1')).toBe(span(TYPED, 'g1'));
        expect(r.text).toContain('Engine {\n  power 7\n}');
    });

    it('carries the reference tokens: a kept token at its typed place, a reprinted one at its new place, each with the new print\'s target', () => {
        const { r, next } = splice(editing(OBJECTS, 'c2', { name: 'gamma' }));
        expect(r.refs.map(x => [x.owner, x.feature, x.target, x.text, r.text.slice(x.start, x.end)])).toEqual(
            next.refs!.map(x => [x.owner, x.feature, x.target, x.text, x.text]));
    });
});

// ---- One root that contains everything (the recursion matters) -----------------------------------------------------

export const PLANT: Spec = {
    classes: [
        { name: 'System', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'parts', type: 'Part', containment: true, many: true }] },
        {
            name: 'Part', attributes: [{ name: 'name', type: 'EString' }, { name: 'size', type: 'EInt' }],
            references: [{ name: 'ports', type: 'Port', containment: true, many: true }, { name: 'peer', type: 'Part' }],
        },
        { name: 'Port', attributes: [{ name: 'name', type: 'EString' }, { name: 'rate', type: 'EInt' }] },
    ],
    enums: {},
    objects: [
        { id: 's', cls: 'System', slots: { name: 'plant', parts: ['p1', 'p2'] } },
        { id: 'p1', cls: 'Part', slots: { name: 'pump', size: 3, ports: ['q1', 'q2'], peer: 'p2' } },
        { id: 'p2', cls: 'Part', slots: { name: 'tank', size: 9 } },
        { id: 'q1', cls: 'Port', slots: { name: 'in', rate: 1 } },
        { id: 'q2', cls: 'Port', slots: { name: 'out', rate: 2 } },
    ],
};

describe('reprintChanged on a model with one root', () => {
    const g = grammarOf(PLANT);
    const objects = objectsOf(PLANT);
    const old = printed(g, objects);
    const typedText = replaced(old.text,
        ['System plant {\n', '// the plant\nSystem plant { // one root\n'],
        ['Part pump {\n', '// the pump\n    Part pump {\n'],
        ['Port in {\n', 'Port in { // inlet\n'],
        ['size 9\n', 'size 9 // litres\n'],
        ['  parts {\n', '  parts   {\n'],
    );

    it('a change deep in the root reprints only the changed object: every other line is as typed (mutants: rule 1 off, rule 1 on the whole span)', () => {
        const typed = carried(g, old, typedText);
        const next = printed(g, editing(objects, 'q2', { rate: 5 }));
        const r = reprintChanged({ grammar: g, typed, old, next });
        expect(r).not.toBeNull();
        readsAsPrint(g, r!.text, next, r!.spans);
        expect(r!.text).toBe(replaced(typedText, ['rate 2', 'rate 5']));
    });

    it('a delete deep in the root cuts the object and its comment only (mutant: rule 4 keeps the trailing trivia)', () => {
        const typed = carried(g, old, typedText);
        const next = printed(g, editing(objects, 'p1', { ports: ['q2'] }).filter(o => o.id !== 'q1'));
        const r = reprintChanged({ grammar: g, typed, old, next });
        expect(r).not.toBeNull();
        readsAsPrint(g, r!.text, next, r!.spans);
        expect(r!.text).toBe(typedText.replace(/ *Port in \{ \/\/ inlet\n[^}]*\}\n/, ''));
        expect(r!.text).not.toContain('// inlet');
        for (const c of ['// the plant', '// one root', '// the pump', '// litres']) expect(r!.text).toContain(c);
    });
});

// ---- DemoESM (scripts/probe/fixtures/scene_3_DemoESM.jjodel) -------------------------------------------------------

/**
 * DemoESM's metamodel and model as the printer reads them, from the project file's store. `Action` and `Expression`
 * are the attribute types of the JjScript slots, read here as strings, as the text prints them.
 */
export async function demoEsm(): Promise<Spec> {
    const json = JSON.parse(readFileSync(new URL('../../../../scripts/probe/fixtures/scene_3_DemoESM.jjodel', import.meta.url), 'utf8'));
    const lookup = JSON.parse(await lz.decompressFromUTF16(json.state)).idlookup as Record<string, any>;
    const all = (cls: string) => Object.values(lookup).filter((d: any) => d?.className === cls) as any[];
    const typeName = (id: string): string => (['Action', 'Expression'].includes(lookup[id]?.name) ? 'EString' : lookup[id]?.name);
    const classes: ClassSpec[] = all('DClass').filter(c => !/^E[A-Z]/.test(c.name) && !['Action', 'Expression'].includes(c.name)).map(c => ({
        name: c.name,
        supers: (c.extends ?? []).map((i: string) => lookup[i].name),
        attributes: (c.attributes ?? []).map((i: string) => ({ name: lookup[i].name, type: typeName(lookup[i].type), many: lookup[i].upperBound === -1 })),
        references: (c.references ?? []).map((i: string) => ({ name: lookup[i].name, type: lookup[lookup[i].type].name, containment: !!lookup[i].containment, many: lookup[i].upperBound === -1 })),
    }));
    const model = all('DModel').find(m => !m.isMetamodel);
    const objects: ObjSpec[] = (model.objects as string[]).map(id => {
        const o = lookup[id];
        const slots: Record<string, unknown> = {};
        for (const f of o.features as string[]) {
            const v = lookup[f];
            const feat = lookup[v.instanceof];
            slots[feat.name] = feat.upperBound === -1 ? [...v.values] : (v.values[0] ?? null);
        }
        return { id, cls: lookup[o.instanceof].name, slots };
    });
    return { classes, enums: {}, objects };
}

describe('reprintChanged on DemoESM', () => {
    it('a rename of an event reprints its referrers only; every comment and every other object keeps its typed text (mutants: rule 1 off, rule 2 without recursion)', async () => {
        const spec = await demoEsm();
        const g = grammarOf(spec);
        const objects = objectsOf(spec);
        const old = printed(g, objects);
        // A comment before every root, and one at the end of every root's head line.
        const roots = old.spans.filter(s => !old.spans.some(p => p !== s && p.start <= s.start && s.end <= p.end));
        let typedText = old.text;
        for (const s of [...roots].reverse()) {
            const head = typedText.indexOf('\n', s.start);
            const n = roots.indexOf(s);
            if (head > 0 && head < s.end) typedText = `${typedText.slice(0, head)} // head ${n}${typedText.slice(head)}`;
            typedText = `${typedText.slice(0, s.start)}// root ${n}\n${typedText.slice(s.start)}`;
        }
        const typed = carried(g, old, typedText);
        const push = objects.find(o => o.cls === 'Event' && o.slots.name === 'push')!;
        const next = printed(g, editing(objects, push.id, { name: 'press' }));
        const r = reprintChanged({ grammar: g, typed, old, next });
        expect(r).not.toBeNull();
        readsAsPrint(g, r!.text, next, r!.spans);
        roots.forEach((_s, n) => expect(r!.text).toContain(`// root ${n}\n`));
        expect((r!.text.match(/\/\/ head \d+/g) ?? []).length).toBe((typedText.match(/\/\/ head \d+/g) ?? []).length);
        const referrers = new Set(objects.filter(o => o.slots.event === push.id).map(o => o.id));
        expect(referrers.size).toBe(2);
        for (const s of roots) {
            if (s.id === push.id || referrers.has(s.id)) expect(span(r!, s.id)).toBe(span(next, s.id).replace(/\n/, ` // head ${roots.indexOf(s)}\n`));
            else expect(span(r!, s.id)).toBe(span(typed, s.id));
        }
    });

    it('a delete of a transition reprints the state that lists it, and cuts the transition with its comment', async () => {
        const spec = await demoEsm();
        const g = grammarOf(spec);
        const objects = objectsOf(spec);
        const old = printed(g, objects);
        const stop = objects.find(o => o.cls === 'Event' && o.slots.name === 'stop')!;
        const t = objects.find(o => o.cls === 'Transition' && o.slots.event === stop.id)!;
        const ts = old.spans.find(s => s.id === t.id)!;
        const typedText = `${old.text.slice(0, ts.start)}// to the end\n${old.text.slice(ts.start)}`;
        const typed = carried(g, old, typedText);
        const next = printed(g, objects.filter(o => o.id !== t.id).map(o => (Array.isArray(o.slots.transitions) ? { ...o, slots: { ...o.slots, transitions: (o.slots.transitions as string[]).filter(x => x !== t.id) } } : o)));
        const r = reprintChanged({ grammar: g, typed, old, next });
        expect(r).not.toBeNull();
        readsAsPrint(g, r!.text, next, r!.spans);
        expect(r!.text).not.toContain('// to the end');
    });
});

// ---- The fallbacks ---------------------------------------------------------------------------------------------------

describe('reprintChanged falls back to the full reprint (null)', () => {
    const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));

    it('when an object of the old print has no carried span (decorations collapsed)', () => {
        const typed = { ...TYPED, spans: TYPED.spans.filter(s => s.id !== 'w2') };
        expect(reprintChanged({ grammar: G, typed, old: OLD, next })).toBeNull();
    });

    it('when a carried span does not start and end on a token', () => {
        const typed = { ...TYPED, spans: TYPED.spans.map(s => (s.id === 'w2' ? { ...s, start: s.start + 1 } : s)) };
        expect(reprintChanged({ grammar: G, typed, old: OLD, next })).toBeNull();
    });

    it('when two carried spans cross', () => {
        const w1 = TYPED.spans.find(s => s.id === 'w1')!;
        const typed = { ...TYPED, spans: TYPED.spans.map(s => (s.id === 'w2' ? { ...s, start: w1.start + 'Wheel '.length } : s)) };
        expect(reprintChanged({ grammar: G, typed, old: OLD, next })).toBeNull();
    });

    it('when the spliced text does not read back as the new print (print-parse equality): a kept text that disagrees with the model', () => {
        // Not an agreement (the typed power of e0 is not the model's): the splice keeps e0's typed text, and its parse
        // differs from the new print. The caller then reprints the whole text.
        const typed = carried(G, OLD, replaced(TYPED_TEXT, ['  power 0\n', '  power 91\n']));
        expect(reprintChanged({ grammar: G, typed, old: OLD, next })).toBeNull();
    });

    it('when the text was typed in a style whose comments the new style does not read', () => {
        const pascal = grammarOf(GARAGE, PASCAL_STYLE);
        expect(reprintChanged({ grammar: pascal, previous: G, typed: TYPED, old: OLD, next: printed(pascal, OBJECTS) })).toBeNull();
    });

    it('not when the typed text is the bare print: the result is the new print', () => {
        const r = reprintChanged({ grammar: G, typed: carried(G, OLD, OLD.text), old: OLD, next });
        expect(r).toEqual({ text: next.text, spans: next.spans, refs: next.refs });
    });
});

// ---- E1b: the Text tab's reprint branch (P-2026-11-07-0346) --------------------------------------------------------

/** The agreement the tab keeps after a print or an application: the typed text and its spans, the old print and its own. */
const agreement = (typed: PrintedText, old: PrintedText, g: ConcreteGrammar = G): TextSync =>
    ({ text: typed.text, model: old.text, spans: typed.spans, refs: typed.refs, printed: agreedPrint({ grammar: g, spans: old.spans, refs: old.refs }) });

/** The reading of the changed model, as the tab passes it. */
const baseOf = (g: ConcreteGrammar, p: PrintedText) => ({ grammar: g, spans: p.spans, refs: p.refs });

describe('modelReprint, the Text tab\'s reprint branch (E1b)', () => {
    it('a diagram-side attribute change keeps the comments typed elsewhere: the splice, its spans and tokens (mutant: the branch always reprints the whole print)', () => {
        const next = printed(G, editing(OBJECTS, 'e0', { power: 7 }));
        const r = modelReprint(agreement(TYPED, OLD), TYPED, next.text, baseOf(G, next));
        expect(r.spliced).toBe(true);
        expect(r.text).toBe(replaced(TYPED_TEXT, ['Engine {\n  power 0\n}', 'Engine {\n  power 7\n}']));
        readsAsPrint(G, r.text, next, r.spans);
        expect(r.refs).toEqual(reprintChanged({ grammar: G, typed: TYPED, old: OLD, next })!.refs);
    });

    it('a rename keeps every comment (mutant: the old print read from the new reading)', () => {
        const next = printed(G, editing(OBJECTS, 'c2', { name: 'gamma' }));
        const r = modelReprint(agreement(TYPED, OLD), TYPED, next.text, baseOf(G, next));
        expect(r.spliced).toBe(true);
        readsAsPrint(G, r.text, next, r.spans);
        for (const c of COMMENTS) expect(r.text).toContain(c);
        expect(r.text).toContain('Car gamma { /* second */\n');
    });

    it('R4, pinned: a comment between two attributes of a changed object moves to the object\'s head', () => {
        const typed = carried(G, OLD, replaced(OLD.text, ['      power 90\n      note', '      power 90\n      // between\n      note']));
        const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));
        const r = modelReprint(agreement(typed, OLD), typed, next.text, baseOf(G, next));
        expect(r.spliced).toBe(true);
        expect(r.text).toBe(replaced(next.text, ['    Engine {\n', '    // between\n    Engine {\n']));
    });

    it('the bare print agreed: the whole new print, as today (mutant: a splice of the bare print)', () => {
        const typed = carried(G, OLD, OLD.text);
        const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));
        expect(modelReprint(agreement(typed, OLD), typed, next.text, baseOf(G, next))).toEqual({ text: next.text, spans: next.spans, refs: next.refs, spliced: false });
    });

    it('an agreement without its old print: the whole new print (mutant: a splice without the old spans)', () => {
        const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));
        const { printed: _gone, ...sync } = agreement(TYPED, OLD);
        expect(modelReprint(sync, TYPED, next.text, baseOf(G, next))).toEqual({ text: next.text, spans: next.spans, refs: next.refs, spliced: false });
    });

    it('a splice that cannot be made (a carried span lost): the whole new print, as today (mutant: the null result kept)', () => {
        const typed = { ...TYPED, spans: TYPED.spans.filter(s => s.id !== 'w2') };
        const next = printed(G, editing(OBJECTS, 'e1', { power: 120 }));
        expect(modelReprint(agreement(typed, OLD), typed, next.text, baseOf(G, next))).toEqual({ text: next.text, spans: next.spans, refs: next.refs, spliced: false });
    });

    it('a style change with the same comments: the old print read in its own grammar, a comment kept (mutant: the previous grammar dropped)', () => {
        const eq = grammarOf(GARAGE, { ...CLIKE_STYLE, assign: ['='] });
        const old = printed(eq, OBJECTS);
        const typed = carried(eq, old, replaced(old.text, ['Gear w {\n', '// a gear\nGear w {\n']));
        const next = printed(G, OBJECTS);
        const r = modelReprint(agreement(typed, old, eq), typed, next.text, baseOf(G, next));
        expect(r.spliced).toBe(true);
        readsAsPrint(G, r.text, next, r.spans);
        expect(r.text).toContain('// a gear\nGear w {\n');
    });
});

describe('unchangedAgreement: a text that asks for no change of the model is the agreement (E1b)', () => {
    const base = { grammar: G, spans: OLD.spans, refs: OLD.refs };

    it('a comment typed and read: the text as typed agrees with the print, and a diagram edit then splices into it (mutant: no agreement on unchanged)', () => {
        const sync = unchangedAgreement({ kind: 'unchanged' }, TYPED_TEXT, OLD.text, base);
        expect(sync).toEqual({ text: TYPED_TEXT, model: OLD.text, printed: agreedPrint(base) });
        const next = printed(G, editing(OBJECTS, 'c2', { name: 'gamma' }));
        const r = modelReprint(sync!, TYPED, next.text, baseOf(G, next));
        expect(r.spliced).toBe(true);
        for (const c of COMMENTS) expect(r.text).toContain(c);
    });

    it('any other decision leaves the agreement as it is (mutant: every decision agrees)', () => {
        for (const d of [{ kind: 'stale' }, { kind: 'errors', count: 1 }, { kind: 'confirm' }, { kind: 'apply' }, { kind: 'refused', reasons: [] }] as const) {
            expect(unchangedAgreement(d, TYPED_TEXT, OLD.text, base)).toBeNull();
        }
    });
});

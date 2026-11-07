/**
 * Step T6a of the textual notation (P-2026-11-02-2327; R-TXT-18, R-TXT-19, R-TXT-21 (5, 6), R-TXT-22, R-TXT-26,
 * R-TXT-30): an edited text against the model it was printed from: the match, the minimal diff, the refusals, the
 * lines. The acceptance is the library metamodel of syntaxRecord.test.ts, with and without its annotations (a renamed
 * keyword, a dropped one, a group), and the saved turnstile example of codegen/examples (another domain), with and
 * without annotations (a renamed keyword, a dropped one, an inline containment); the round trip runs over the shared
 * corpus as well. Mutations each test kills are in its name; the bench is in the commit body.
 */

import { readFileSync } from 'node:fs';
import { describe, it, expect, vi } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import { classFeatures } from '../metamodel';
import type { TextMetamodel, TextObject } from '../metamodel';
import { parseText } from '../parser';
import { printTextModel } from '../printer';
import type { ObjectSpan, RefSpan } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { diffText, planTextEdit } from '../textDiff';
import type { DiffOp, ObjectRef, PlanInput } from '../textDiff';
import { defaultedSlots, referencedElsewhere } from '../textApply';
import { BOX, CASES, DIAMOND, GARAGE, INNER, LOWER, NON_DIAMOND, grammarOf } from './corpus';
import { PORT_MM, PORT_TEXT_CLIKE, portGrammar } from './portCorpus';
import { FIXTURE, metamodelOf, objectsOf } from './spec';
import type { Spec } from './spec';

// ---- The library metamodel (syntaxRecord.test.ts), as the notation's plain data ----------------------------------

const LIBRARY_MM: TextMetamodel = {
    classes: [
        {
            name: 'Library', attributes: [{ name: 'name', type: 'EString' }],
            references: [{ name: 'books', type: 'Book', containment: true, many: true }, { name: 'members', type: 'Member', containment: true, many: true }],
        },
        { name: 'Book', attributes: [{ name: 'name', type: 'EString' }, { name: 'genre', type: 'Genre' }, { name: 'year', type: 'EInt' }], references: [{ name: 'borrowedBy', type: 'Member' }] },
        { name: 'Member', attributes: [{ name: 'name', type: 'EString' }] },
    ],
    enumerations: [{ name: 'Genre', literals: ['FICTION', 'POETRY', 'SCIENCE', 'HISTORY'] }],
};

const LIBRARY_IDS: ElementIds = {
    classes: { C_Lib: 'Library', C_Book: 'Book', C_Mem: 'Member' },
    features: {
        A_Lib_name: { owner: 'Library', name: 'name', lower: 1 }, A_Book_name: { owner: 'Book', name: 'name', lower: 1 },
        A_Book_genre: { owner: 'Book', name: 'genre', lower: 1 }, A_Book_year: { owner: 'Book', name: 'year', lower: 0 },
        A_Mem_name: { owner: 'Member', name: 'name', lower: 1 }, R_Lib_books: { owner: 'Library', name: 'books', lower: 0 },
        R_Lib_members: { owner: 'Library', name: 'members', lower: 0 }, R_Book_borrowedBy: { owner: 'Book', name: 'borrowedBy', lower: 0 },
    },
    enums: { E_Genre: 'Genre' },
};

const LIBRARY_RECORD: SyntaxAnnotations = {
    v: 1,
    language: 'Shelf',
    features: { R_Lib_members: { keyword: 'patrons' }, A_Book_genre: { keyword: '' }, R_Lib_books: { groupBy: 'A_Book_genre' } },
    enums: {
        E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] },
    },
};

function libraryObjects(over: Record<string, Record<string, unknown>> = {}): TextObject[] {
    const base: Record<string, { cls: string; slots: Record<string, unknown> }> = {
        lib: { cls: 'Library', slots: { name: 'city', books: ['b1', 'b2', 'b3', 'b4'], members: ['m1', 'm2'] } },
        m1: { cls: 'Member', slots: { name: 'ann' } },
        m2: { cls: 'Member', slots: { name: 'bob' } },
        b1: { cls: 'Book', slots: { name: 'dune', genre: 'FICTION', year: null, borrowedBy: null } },
        b2: { cls: 'Book', slots: { name: 'cosmos', genre: 'SCIENCE', year: 1980, borrowedBy: 'm1' } },
        b3: { cls: 'Book', slots: { name: 'odes', genre: 'POETRY', year: null, borrowedBy: null } },
        b4: { cls: 'Book', slots: { name: 'spqr', genre: 'HISTORY', year: 2015, borrowedBy: 'm2' } },
    };
    return Object.entries(base).map(([id, o]) => ({ id, cls: o.cls, slots: { ...o.slots, ...(over[id] ?? {}) } }));
}

const notation = (mm: TextMetamodel, record: SyntaxAnnotations | null, ids: ElementIds): ConcreteGrammar => {
    const n = textualNotation(mm, { record, issues: [] }, ids);
    expect(n.issues.filter(i => i.level === 'error')).toEqual([]);
    return n.grammar;
};
const LIBRARY = notation(LIBRARY_MM, LIBRARY_RECORD, LIBRARY_IDS);
const LIBRARY_PLAIN = notation(LIBRARY_MM, null, LIBRARY_IDS);

// ---- The turnstile example (codegen/examples/turnstile), read from its saved lookup ----------------------------

const TURNSTILE = JSON.parse(readFileSync(new URL('../../examples/turnstile/turnstile.json', import.meta.url), 'utf8'));

/** The saved lookup as the notation's input: a primitive as its E-type (an expression or an action as a string); a
 *  reference is a containment when its values' objects have its value as father. */
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
            references: features.filter(f => f.father === c.id && f.className === 'DReference')
                .map(f => ({ name: f.name, type: L[f.type].name, containment: contains(f.id), many: f.upperBound === -1 })),
        })),
        enumerations: [],
    };
    const objects: TextObject[] = all.filter(o => o.className === 'DObject').map(o => {
        const slots: Record<string, unknown> = {};
        for (const vid of o.features) {
            const v = L[vid];
            const f = L[v.instanceof];
            slots[f.name] = f.upperBound === -1 ? [...v.values] : v.values[0] ?? null;
        }
        return { id: o.id, cls: L[o.instanceof].name, slots };
    });
    const ids: ElementIds = {
        classes: Object.fromEntries(classes.map(c => [c.id, c.name])),
        features: Object.fromEntries(features.map(f => [f.id, { owner: L[f.father].name, name: f.name, lower: f.lowerBound ?? 0 }])),
        enums: {},
    };
    return { mm, objects, ids };
}

const TS = fromLookup(TURNSTILE.lookup);
const TURNSTILE_RECORD: SyntaxAnnotations = {
    v: 1,
    features: { F_State_transitions: { inline: true }, F_Transition_nextState: { keyword: 'to' }, F_Transition_event: { keyword: '' } },
};
const TS_PLAIN = notation(TS.mm, null, TS.ids);
const TS_ANNOTATED = notation(TS.mm, TURNSTILE_RECORD, TS.ids);

// ---- Helpers ---------------------------------------------------------------------------------------------------

interface Case { readonly mm: TextMetamodel; readonly g: ConcreteGrammar; readonly objects: readonly TextObject[] }

const specCase = (spec: Spec, g: ConcreteGrammar = grammarOf(spec)): Case => ({ mm: metamodelOf(spec), g, objects: objectsOf(spec) });

/** Monaco's decorations over one edit (`NeverGrowsWhenTypingAtEdges`): a span after it shifts, one around it stretches. */
function carry<S extends { readonly start: number; readonly end: number }>(spans: readonly S[], at: number, removed: number, inserted: number): S[] {
    const delta = inserted - removed;
    return spans.map(s => {
        if (s.end <= at) return s;
        if (s.start >= at + removed) return { ...s, start: s.start + delta, end: s.end + delta };
        const start = s.start <= at ? s.start : at;
        return { ...s, start, end: Math.max(start, s.end + delta) };
    });
}

interface EditOptions {
    /** Carry the previous print's spans over the edit (the editor), or give none (a re-import). */
    readonly spans?: boolean;
    readonly defaults?: ReadonlyMap<string, ReadonlySet<string>>;
    readonly referencedElsewhere?: ReadonlySet<string>;
    readonly ordered?: PlanInput['ordered'];
    readonly confirmed?: PlanInput['confirmed'];
    /** A cut pasted whole (D-5 of T7): the model object's span is carried to the parsed object of that name, as the Text tab does. */
    readonly pasted?: readonly (readonly [id: string, name: string])[];
}

/** Prints the case, applies the replacements to the text in order, and plans the edit. */
function edit(c: Case, replacements: readonly (readonly [string, string])[], o: EditOptions = {}) {
    const printed = printTextModel(c.g, c.objects);
    let text = printed.text;
    let spans: ObjectSpan[] = [...printed.spans];
    let refs: RefSpan[] = [...(printed.refs ?? [])];
    for (const [from, to] of replacements) {
        const at = text.indexOf(from);
        expect(at, `"${from}" in the text`).toBeGreaterThanOrEqual(0);
        text = text.slice(0, at) + to + text.slice(at + from.length);
        spans = carry(spans, at, from.length, to.length);
        refs = carry(refs, at, from.length, to.length);
    }
    // R-TXT-35: the reference tokens are carried as the objects are, in the editor only.
    const carried = o.spans || o.pasted;
    const parsed = parseText(text, c.g, carried ? { keep: refs } : undefined);
    for (const [id, name] of o.pasted ?? []) {
        const t = parsed.objects.find(x => x.slots.name === name)!;
        const s = parsed.spans.find(x => x.id === t.id)!;
        spans = [...spans.filter(x => x.id !== id), { id, start: s.start, end: s.end }];
    }
    const plan = planTextEdit({
        mm: c.mm, grammar: c.g, model: c.objects, parsed, unprinted: printed.unprinted,
        ...(carried ? { previous: spans, previousRefs: refs } : {}),
        ...(o.defaults ? { defaults: o.defaults } : {}),
        ...(o.referencedElsewhere ? { referencedElsewhere: o.referencedElsewhere } : {}),
        ...(o.ordered ? { ordered: o.ordered } : {}),
        ...(o.confirmed ? { confirmed: o.confirmed } : {}),
    });
    return { printed, text, parsed, plan };
}

const codes = (p: ReturnType<typeof edit>['plan']): string[] => p.refusals.map(r => r.code);

const LIBRARY_CASE: Case = { mm: LIBRARY_MM, g: LIBRARY, objects: libraryObjects() };
const LIBRARY_PLAIN_CASE: Case = { mm: LIBRARY_MM, g: LIBRARY_PLAIN, objects: libraryObjects() };

// ---- The round trip ----------------------------------------------------------------------------------------------

const CORPUS: readonly (readonly [string, Case])[] = [
    ['library, annotated', LIBRARY_CASE],
    ['library, plain', LIBRARY_PLAIN_CASE],
    ['turnstile, plain', { mm: TS.mm, g: TS_PLAIN, objects: TS.objects }],
    ['turnstile, annotated', { mm: TS.mm, g: TS_ANNOTATED, objects: TS.objects }],
    ...([['FIXTURE', FIXTURE], ['GARAGE', GARAGE], ['BOX', BOX], ['INNER', INNER], ['DIAMOND', DIAMOND], ['NON_DIAMOND', NON_DIAMOND], ['CASES', CASES]] as const)
        .flatMap(([name, spec]) => [[name, specCase(spec)] as const, [`${name}, lower`, specCase(spec, grammarOf(spec, LOWER))] as const]),
];

describe('print, parse, diff is empty', () => {
    it.each(CORPUS)('%s: no operation, with and without the spans; applicable with the spans (mutant: span evidence dropped)', (_, c) => {
        for (const spans of [false, true]) {
            const { parsed, plan } = edit(c, [], { spans });
            expect(parsed.errors).toEqual([]);
            expect(plan.diff!.ops).toEqual([]);
            expect(plan.diff!.match.created).toEqual([]);
            expect(plan.diff!.match.deleted).toEqual([]);
            if (spans) {
                expect(plan.refusals).toEqual([]);
                expect(plan.lines).toEqual([]);
            }
        }
    });

    it('the annotated texts carry their annotations: the library groups and renames, the turnstile inlines and drops', () => {
        const lib = printTextModel(LIBRARY, LIBRARY_CASE.objects).text;
        expect(lib).toContain('patrons {');
        expect(lib).toContain('prose {');
        const ts = printTextModel(TS_ANNOTATED, TS.objects).text;
        expect(ts).toContain(' to ');
        expect(ts).not.toContain('transitions');
        expect(ts).not.toContain('event ');
    });

    it.each(CORPUS)('%s: every unordered many-valued slot read in reverse order is no change (R-TXT-21 (5); mutant: order-insensitive compare removed)', (_, c) => {
        const classOf = (cls: string) => c.mm.classes.find(k => k.name === cls)!;
        let reversed = 0;
        for (const o of c.objects) {
            for (const [f, v] of Object.entries(o.slots)) {
                if (!Array.isArray(v) || v.length < 2) continue;
                const containment = classFeatures(c.mm, classOf(o.cls)).some(x => x.name === f && x.kind === 'containment');
                if (containment) continue;
                const objects = c.objects.map(x => (x.id === o.id ? { ...x, slots: { ...x.slots, [f]: [...v].reverse() } } : x));
                const text = printTextModel(c.g, objects).text;
                const parsed = parseText(text, c.g);
                const diff = diffText({ mm: c.mm, grammar: c.g, model: c.objects, parsed, previous: printTextModel(c.g, c.objects).spans });
                expect(diff.ops, `${o.id}.${f}`).toEqual([]);
                reversed++;
            }
        }
        if (c === LIBRARY_CASE) expect(reversed).toBe(0);
    });

    it('a slot declared ordered and reversed is a change: a list attribute is rewritten, a reference reordered (T7)', () => {
        const c = specCase(FIXTURE);
        const reversed = c.objects.map(x => (x.id === 's1' ? { ...x, slots: { ...x.slots, tags: ['b-c', 'a'] } } : x.id === 'p1' ? { ...x, slots: { ...x.slots, peers: ['p2', 'p3'] } } : x));
        const parsed = parseText(printTextModel(c.g, reversed).text, c.g);
        const ordered = (_: string, f: string) => f === 'tags' || f === 'peers';
        const diff = diffText({ mm: c.mm, grammar: c.g, model: c.objects, parsed, previous: printTextModel(c.g, c.objects).spans, ordered });
        expect(diff.ops).toEqual([{ op: 'attribute', target: { model: 's1' }, feature: 'tags', value: ['b-c', 'a'] },
            { op: 'reorder', target: { model: 'p1' }, feature: 'peers', to: { model: 'p3' } }]);
        expect(diff.unsupported).toEqual([]);
    });
});

// ---- Edits -------------------------------------------------------------------------------------------------------

describe('an edit is the minimal diff, and its lines address the objects by registered handles', () => {
    it('an attribute: one update, one line', () => {
        for (const spans of [false, true]) {
            const { plan } = edit(LIBRARY_CASE, [['year 2015', 'year 2016']], { spans });
            expect(plan.diff!.ops).toEqual([{ op: 'attribute', target: { model: 'b4' }, feature: 'year', value: 2016 }]);
            expect(plan.refusals).toEqual([]);
            expect(plan.lines).toEqual(['set spqr.year = 2016']);
            expect([...plan.handles]).toEqual([['spqr', 'b4']]);
        }
    });

    it('an attribute removed from the text is cleared (R-TXT-19: an omitted attribute reads back as unset)', () => {
        const { plan } = edit(LIBRARY_CASE, [['\n        year 2015', '']], { spans: true });
        expect(plan.lines).toEqual(['set spqr.year = null']);
    });

    it('a reference: one update, one line', () => {
        const { plan } = edit(LIBRARY_CASE, [['borrowedBy bob', 'borrowedBy ann']], { spans: true });
        expect(plan.diff!.ops).toEqual([{ op: 'reference', target: { model: 'b4' }, feature: 'borrowedBy', to: { model: 'm1' } }]);
        expect(plan.lines).toEqual(['set spqr.borrowedBy = ann']);
        expect(new Map(plan.handles)).toEqual(new Map([['spqr', 'b4'], ['ann', 'm1']]));
    });

    it('an object added, and one deleted with the reference to it', () => {
        const added = edit(LIBRARY_CASE, [['    Member bob {}', '    Member bob {}\n    Member cid {}']]);
        expect(added.plan.diff!.ops).toEqual([{ op: 'create', text: added.parsed.objects.find(o => o.slots.name === 'cid')!.id, cls: 'Member', into: { owner: { model: 'lib' }, feature: 'members' } },
            { op: 'attribute', target: { text: added.parsed.objects.find(o => o.slots.name === 'cid')!.id }, feature: 'name', value: 'cid' }]);
        expect(added.plan.lines).toEqual(['create instance of Member "cid" in city.members', 'set cid.name = "cid"']);

        const gone = edit(LIBRARY_CASE, [['\n        borrowedBy bob', ''], ['\n    Member bob {}', '']]);
        expect(gone.plan.diff!.ops).toEqual([{ op: 'delete', model: 'm2' }]);
        expect(gone.plan.lines).toEqual(['delete bob']);
    });

    it('nested: a container added with its contents, and one deleted with its contents in one line', () => {
        const c = specCase(GARAGE);
        const added = edit(c, [['    }\n  }\n  best Car[0].wheels[1]', '    }\n    Wheel z {\n      bolts {\n        Bolt q {}\n      }\n    }\n  }\n  best Car[0].wheels[1]']], { spans: true });
        expect(added.parsed.errors).toEqual([]);
        expect(added.plan.refusals).toEqual([]);
        expect(added.plan.lines).toEqual(['create instance of Wheel "z" in beta.wheels', 'set z.name = "z"', 'create instance of Bolt "q" in z.bolts', 'set q.name = "q"']);

        const tree = specCase({
            classes: [{ name: 'Folder', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'folders', type: 'Folder', containment: true, many: true }, { name: 'files', type: 'File', containment: true, many: true }] },
                { name: 'File', attributes: [{ name: 'name', type: 'EString' }, { name: 'size', type: 'EInt' }] }],
            enums: {},
            objects: [
                { id: 'root', cls: 'Folder', slots: { name: 'root', folders: ['docs'], files: ['f0'] } },
                { id: 'docs', cls: 'Folder', slots: { name: 'docs', files: ['f1', 'f2'] } },
                { id: 'f0', cls: 'File', slots: { name: 'readme', size: 1 } },
                { id: 'f1', cls: 'File', slots: { name: 'a', size: 2 } },
                { id: 'f2', cls: 'File', slots: { name: 'b', size: 3 } },
            ],
        });
        const printed = printTextModel(tree.g, tree.objects).text;
        const from = printed.indexOf('  folders {');
        const docs = printed.slice(from, printed.indexOf('\n  }', from) + 4);
        const deleted = edit(tree, [[docs, '']], { spans: true });
        expect(deleted.parsed.errors).toEqual([]);
        expect(deleted.plan.diff!.ops).toEqual([{ op: 'delete', model: 'docs' }]);
        expect(deleted.plan.lines).toEqual(['delete docs']);
    });

    it('an object created under its own name gets its name slot written: the handle names data.name only (P-2026-11-07-0344; mutant: the name !== h guard)', () => {
        const { plan } = edit({ mm: PORT_MM, g: portGrammar(), objects: [] }, [['', PORT_TEXT_CLIKE]]);
        expect(plan.refusals).toEqual([]);
        const lines = plan.lines!;
        for (const name of ['cpu', 'result', 'ready']) {
            const at = lines.findIndex(l => l.startsWith(`create instance of `) && l.includes(` "${name}"`));
            expect(at, name).toBeGreaterThanOrEqual(0);
            expect(lines[at + 1]).toBe(`set ${name}.name = "${name}"`);
        }
        expect(lines.filter(l => l.includes('.name ='))).toEqual([
            'set cpu.name = "cpu"', 'set Port_1.name = "instr"', 'set Port_2.name = ""', 'set result.name = "result"', 'set Ref_1.name = "instr"', 'set Ref_2.name = ""', 'set ready.name = "ready"',
        ]);
    });

    it('a rename with an unchanged body: matched by its span in the editor; uncertain by similarity outside it (mutant: refusal on uncertain removed)', () => {
        const inEditor = edit(LIBRARY_CASE, [['Book spqr', 'Book rome']], { spans: true });
        expect(inEditor.plan.diff!.match.matches.find(m => m.model === 'b4')).toMatchObject({ by: 'span', uncertain: false });
        expect(inEditor.plan.lines).toEqual(['set spqr.name = "rome"']);

        const reimport = edit(LIBRARY_CASE, [['Book spqr', 'Book rome']]);
        expect(reimport.plan.diff!.match.matches.find(m => m.model === 'b4')).toMatchObject({ by: 'rename', uncertain: true, score: 1 });
        expect(reimport.plan.diff!.ops).toEqual([{ op: 'attribute', target: { model: 'b4' }, feature: 'name', value: 'rome' }]);
        expect(codes(reimport.plan)).toEqual(['uncertain']);
        expect(reimport.plan.lines).toBeNull();
    });

    it('a rename that changes the body too is a creation and a deletion outside the editor', () => {
        const { plan } = edit(LIBRARY_CASE, [['Book spqr {\n        HISTORY\n        year 2015\n        borrowedBy bob', 'Book rome {\n        FICTION\n        year 1']]);
        expect(plan.diff!.match.deleted).toEqual(['b4']);
        expect(plan.diff!.match.created).toHaveLength(1);
        expect(plan.refusals).toEqual([]);
    });

    it('homonyms pair by order and are uncertain; in the editor, the spans decide (R-TXT-18, R-TXT-22)', () => {
        const c = specCase(FIXTURE);
        const reimport = edit(c, [['size 2', 'size 5']]);
        expect(reimport.plan.diff!.match.matches.filter(m => m.by === 'homonym').map(m => m.model)).toEqual(['p1', 'p2', 'l1', 'l2']);
        expect(reimport.plan.diff!.ops).toEqual([{ op: 'attribute', target: { model: 'p2' }, feature: 'size', value: 5 }]);
        expect(codes(reimport.plan)).toEqual(['uncertain']);

        const inEditor = edit(c, [['size 2', 'size 5']], { spans: true });
        expect(inEditor.plan.refusals).toEqual([]);
        expect(inEditor.plan.lines).toEqual(['set Part_1.size = 5']);
        expect(inEditor.plan.handles.get('Part_1')).toBe('p2');
    });

    it('the turnstile, annotated: an inline transition retargeted, nameless homonyms decided by their spans', () => {
        const c = { mm: TS.mm, g: TS_ANNOTATED, objects: TS.objects };
        // The transition of State: `to Initial[0]` then its event `push`, on the next line (keyword dropped).
        const from = '  Transition {\n    to Initial[0]\n    push';
        const to = '  Transition {\n    to Initial[0]\n    coin';
        const { plan } = edit(c, [[from, to]], { spans: true });
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.ops).toHaveLength(1);
        expect(plan.diff!.ops[0]).toMatchObject({ op: 'reference', feature: 'event', to: { model: 'coin' } });
        expect(edit(c, [[from, to]]).plan.refusals.map(r => r.code)).toEqual(['uncertain']);
    });
});

// ---- Preservation, point 4 ----------------------------------------------------------------------------------------

describe('what the text does not show is preserved; a default read is no change', () => {
    it('R-TXT-32: a many-valued target outside the text prints as @"id" among the others and is kept (mutants: outer dropped from the list; outer kept in the print but unlinked)', () => {
        const f = specCase(FIXTURE);
        const peers: Case = { ...f, objects: f.objects.map(o => (o.id === 'p1' ? { ...o, slots: { ...o.slots, peers: ['p3', 'zz', 'p2'] } } : o)) };
        const same = edit(peers, [], { spans: true });
        expect(same.text).toContain('@"zz"');
        expect(same.parsed.errors).toEqual([]);
        expect(same.plan.diff!.ops).toEqual([]);
        expect(same.plan.lines).toEqual([]);
    });

    it('R-TXT-32: a many-valued target outside the text taken out of the list is unlinked by a handle registered against its id (mutants: outer never unlinked; outer handle not registered)', () => {
        const f = specCase(FIXTURE);
        const peers: Case = { ...f, objects: f.objects.map(o => (o.id === 'p1' ? { ...o, slots: { ...o.slots, peers: ['p3', 'zz', 'p2'] } } : o)) };
        const { plan } = edit(peers, [[', @"zz"', '']], { spans: true });
        expect(codes(plan)).toEqual([]);
        expect(plan.diff!.ops).toEqual([{ op: 'unlink', target: { model: 'p1' }, feature: 'peers', to: { outer: 'zz' } }]);
        expect(plan.lines).toHaveLength(1);
        const h = /-= (\w+)$/.exec(plan.lines![0])![1];
        expect(plan.handles.get(h)).toBe('zz');
    });

    it('R-TXT-32: an outer target repeated in a list, or copied into another list, is refused with outer (mutant: an unmatched outer token linked)', () => {
        const f = specCase(FIXTURE);
        const peers: Case = { ...f, objects: f.objects.map(o => (o.id === 'p1' ? { ...o, slots: { ...o.slots, peers: ['p3', 'zz', 'p2'] } } : o)) };
        const twice = edit(peers, [['@"zz"', '@"zz", @"zz"']], { spans: true });
        expect(codes(twice.plan)).toEqual(['outer']);
        expect(twice.plan.lines).toBeNull();
    });

    it('R-TXT-32: a single-valued target outside the text prints as @"id" and reads back as the same value, in both notations (mutants: outer value skipped by the printer; outer read as a name)', () => {
        for (const g of [LIBRARY, LIBRARY_PLAIN]) {
            const c: Case = { mm: LIBRARY_MM, g, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
            const { text, parsed } = edit(c, []);
            expect(text).toContain('borrowedBy @"elsewhere"');
            expect(parsed.errors).toEqual([]);
            const b1 = parsed.objects.find(o => o.slots.name === 'dune')!;
            expect(b1.slots.borrowedBy).toEqual({ outer: 'elsewhere' });
            expect(printTextModel(g, parsed.objects).text).toBe(text);
        }
    });

    it('a single-valued target outside the text: the text parses, an edit elsewhere applies, the reference is not written (P-2026-11-03-1045; mutant: an unchanged outer value written)', () => {
        for (const g of [LIBRARY, LIBRARY_PLAIN]) {
            const c: Case = { mm: LIBRARY_MM, g, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
            const same = edit(c, [], { spans: true });
            expect(same.parsed.errors).toEqual([]);
            expect(same.plan.lines).toEqual([]);
            const { parsed, plan } = edit(c, [['year 2015', 'year 2016']], { spans: true });
            expect(parsed.errors).toEqual([]);
            expect(codes(plan)).toEqual([]);
            expect(plan.lines).toEqual(['set spqr.year = 2016']);
        }
    });

    it('R-TXT-32: deleting a printed outer value clears the reference; retyping it to a name of the text retargets it (mutants: a deleted outer value preserved; a retarget refused)', () => {
        const c: Case = { mm: LIBRARY_MM, g: LIBRARY_PLAIN, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
        const cleared = edit(c, [[' borrowedBy @"elsewhere"', '']], { spans: true });
        expect(cleared.parsed.errors).toEqual([]);
        expect(codes(cleared.plan)).toEqual([]);
        expect(cleared.plan.lines).toEqual(['set dune.borrowedBy = null']);
        const retargeted = edit(c, [['borrowedBy @"elsewhere"', 'borrowedBy bob']], { spans: true });
        expect(codes(retargeted.plan)).toEqual([]);
        expect(retargeted.plan.lines).toEqual(['set dune.borrowedBy = bob']);
    });

    it('R-TXT-32: an edited id, or an outer token at another owner or on a new object, is refused with outer and writes nothing (mutants: refusal removed; an outer token written as a retarget)', () => {
        const c: Case = { mm: LIBRARY_MM, g: LIBRARY_PLAIN, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
        for (const replacements of [
            [['@"elsewhere"', '@"other"']],
            [['borrowedBy bob', 'borrowedBy @"elsewhere"']],
            [['Book spqr {', 'Book neu {\n      genre POETRY\n      borrowedBy @"elsewhere"\n    }\n    Book spqr {']],
        ] as const) {
            const { parsed, plan } = edit(c, replacements, { spans: true });
            expect(parsed.errors).toEqual([]);
            expect(codes(plan)).toEqual(['outer']);
            expect(plan.lines).toBeNull();
        }
    });

    it('R-TXT-32: a rename outside the editor scores an unchanged outer reference as equal (textMatch similarity; mutant: outer marker unmapped)', () => {
        const c: Case = { mm: LIBRARY_MM, g: LIBRARY_PLAIN, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
        const { plan } = edit(c, [['Book dune', 'Book dunes']]);
        const m = plan.diff!.match.matches.find(x => x.model === 'b1')!;
        expect(m).toMatchObject({ by: 'rename', uncertain: true, score: 1 });
    });

    it('a mandatory enumeration left empty reads as its first literal: the text printing it asks no change, and never writes it (mutant: default counted as a change)', () => {
        const defaults = new Map([['b1', new Set(['genre'])]]);
        for (const c of [LIBRARY_CASE, LIBRARY_PLAIN_CASE]) {
            const same = edit(c, [], { spans: true, defaults });
            expect(same.plan.diff!.ops).toEqual([]);
            expect(same.plan.lines).toEqual([]);
        }
        const changed = edit(LIBRARY_PLAIN_CASE, [['genre FICTION', 'genre POETRY']], { spans: true, defaults });
        expect(changed.plan.lines).toEqual(['set dune.genre = POETRY']);
    });

    it('a declared default printed and then left out of the text asks no change; a stored value left out is cleared', () => {
        const objects = libraryObjects({ b3: { year: 1900 } });
        const c: Case = { ...LIBRARY_PLAIN_CASE, objects };
        const drop: [string, string] = ['\n      year 1900', ''];
        expect(edit(c, [drop], { spans: true, defaults: new Map([['b3', new Set(['year'])]]) }).plan.lines).toEqual([]);
        expect(edit(c, [drop], { spans: true }).plan.lines).toEqual(['set odes.year = null']);
    });
});

// ---- Refusals (R-TXT-26, R-TXT-30) --------------------------------------------------------------------------------

describe('the refusals', () => {
    it('a parse error refuses, and no diff is computed (R-TXT-21 (8))', () => {
        const { plan } = edit(LIBRARY_CASE, [['year 2015', 'year twenty']], { spans: true });
        expect(codes(plan)).toEqual(['parse']);
        expect(plan.diff).toBeNull();
        expect(plan.lines).toBeNull();
    });

    it('a deletion of an object another model references refuses, also when it goes with its container', () => {
        const gone = edit(LIBRARY_CASE, [['\n        borrowedBy bob', ''], ['\n    Member bob {}', '']], { spans: true, referencedElsewhere: new Set(['m2']) });
        expect(codes(gone.plan)).toEqual(['referenced']);
        expect(gone.plan.lines).toBeNull();
        const kept = edit(LIBRARY_CASE, [['year 2015', 'year 2016']], { spans: true, referencedElsewhere: new Set(['m2']) });
        expect(kept.plan.refusals).toEqual([]);

        const c = specCase(GARAGE);
        const text = printTextModel(c.g, c.objects).text;
        const at = text.indexOf('  engine {');
        const engine = text.slice(at, text.indexOf('\n  }', at) + 4);
        const inside = edit(c, [[engine, ''], ['eng Car[0].engine[0]', '']], { spans: true, referencedElsewhere: new Set(['e1']) });
        expect(inside.parsed.errors).toEqual([]);
        expect(codes(inside.plan)).toContain('referenced');
    });

    it('objects the text does not print refuse (R-TXT-30), whatever the edit', () => {
        const c: Case = { ...LIBRARY_CASE, objects: libraryObjects({ b3: { genre: null } }) };
        const { printed, plan } = edit(c, [], { spans: true });
        expect(printed.unprinted).toHaveLength(1);
        expect(codes(plan)).toEqual(['unprinted']);
        expect(plan.lines).toBeNull();
    });

    it('an uncertain match refuses, in each of its three kinds', () => {
        expect(codes(edit(specCase(FIXTURE), []).plan)).toEqual(['uncertain']);
        expect(edit(LIBRARY_CASE, [['Book spqr', 'Book rome']]).plan.refusals[0].message).toContain('rename');
        // A move: Member ann taken out of patrons and put at the top.
        const moved = edit(LIBRARY_PLAIN_CASE, [['\n    Member ann {}', ''], ['Library city {', 'Member ann {}\nLibrary city {']]);
        expect(moved.parsed.errors).toEqual([]);
        expect(moved.plan.diff!.match.matches.find(m => m.model === 'm1')).toMatchObject({ by: 'move', uncertain: true });
        expect(codes(moved.plan)).toEqual(['uncertain']);
    });
});

// ---- Moves and reorders (step T7) --------------------------------------------------------------------------------

const TREE: Spec = {
    classes: [{ name: 'Folder', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'folders', type: 'Folder', containment: true, many: true },
        { name: 'files', type: 'File', containment: true, many: true }, { name: 'pinned', type: 'File', many: true }] },
    { name: 'File', attributes: [{ name: 'name', type: 'EString' }, { name: 'size', type: 'EInt' }], references: [{ name: 'link', type: 'File' }] }],
    enums: {},
    objects: [
        { id: 'root', cls: 'Folder', slots: { name: 'root', folders: ['docs', 'pics'], files: ['f0'], pinned: [] } },
        { id: 'docs', cls: 'Folder', slots: { name: 'docs', folders: [], files: ['f1', 'f2', 'f3'], pinned: ['f1', 'f2'] } },
        { id: 'pics', cls: 'Folder', slots: { name: 'pics', folders: [], files: [], pinned: [] } },
        { id: 'f0', cls: 'File', slots: { name: 'readme', size: 1, link: 'f2' } },
        { id: 'f1', cls: 'File', slots: { name: 'a', size: 2, link: null } },
        { id: 'f2', cls: 'File', slots: { name: 'b', size: 3, link: null } },
        { id: 'f3', cls: 'File', slots: { name: 'c', size: 4, link: null } },
    ],
};
/** The tree with every many-valued reference declared `ordered` as given (TextReference.ordered, read by the default predicate). */
const treeCase = (ordered?: boolean): Case => {
    const c = specCase(TREE);
    if (ordered === undefined) return c;
    return { ...c, mm: { ...c.mm, classes: c.mm.classes.map(k => ({ ...k, references: k.references?.map(r => (r.many ? { ...r, ordered } : r)) })) } };
};
const FILE_B = '\n        File b {\n          size 3\n        }';
const PICS_WITH_B = 'Folder pics {\n      files {\n        File b {\n          size 3\n        }\n      }\n    }';

describe('a move keeps the object, and a reorder of an ordered feature is minimal (T7)', () => {
    it('cut and pasted whole into another container: certain by the carried span, out of the old slot then into the new, id and incoming references kept (mutants: move left unsupported; the old slot left to the core)', () => {
        const { plan } = edit(treeCase(), [[FILE_B, ''], ['Folder pics {}', PICS_WITH_B]], { pasted: [['f2', 'b']] });
        expect(plan.diff!.match.matches.find(m => m.model === 'f2')).toMatchObject({ by: 'span', uncertain: false });
        expect(plan.diff!.ops).toEqual([{ op: 'move', model: 'f2', into: { owner: { model: 'pics' }, feature: 'files' }, from: { owner: 'docs', feature: 'files' } }]);
        expect(plan.refusals).toEqual([]);
        // Out of the old slot first: a `+=` alone leaves a hole the core does not close (R1, measured in the app).
        expect(plan.lines).toEqual(['set docs.files -= b', 'set pics.files += b']);
        expect(new Map(plan.handles)).toEqual(new Map([['docs', 'docs'], ['b', 'f2'], ['pics', 'pics']]));
    });

    it('without the carried span the same move is uncertain and asks; confirmed, it is the same line (R-TXT-18: never a silent guess)', () => {
        const asked = edit(treeCase(), [[FILE_B, ''], ['Folder pics {}', PICS_WITH_B]]);
        expect(asked.plan.diff!.match.matches.find(m => m.model === 'f2')).toMatchObject({ by: 'move', uncertain: true });
        expect(codes(asked.plan)).toEqual(['uncertain']);
        const confirmed = edit(treeCase(), [[FILE_B, ''], ['Folder pics {}', PICS_WITH_B]], { confirmed: ['uncertain'] });
        expect(confirmed.plan.lines).toEqual(['set docs.files -= b', 'set pics.files += b']);
    });

    it('a pasted copy with the original still in the text is a new object (R-TXT-22)', () => {
        const { plan } = edit(treeCase(), [['Folder pics {}', PICS_WITH_B.replace('File b', 'File c').replace('size 3', 'size 4')]], { spans: true });
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.match.matches.find(m => m.model === 'f3')).toMatchObject({ by: 'span' });
        expect(plan.lines).toEqual(['create instance of File "File_1" in pics.files', 'set File_1.name = "c"', 'set File_1.size = 4']);
    });

    it('to the top level: taken out of its slot (mutant: the line of a move to the top dropped)', () => {
        const { plan } = edit(treeCase(), [[FILE_B, ''], ['Folder root {', 'File b {\n  size 3\n}\nFolder root {']], { pasted: [['f2', 'b']] });
        expect(plan.diff!.ops).toEqual([{ op: 'move', model: 'f2', into: null, from: { owner: 'docs', feature: 'files' } }]);
        expect(plan.lines).toEqual(['set docs.files -= b']);
    });

    it('out of a deleted container: moved before the deletion, and not counted as deleted (mutant: moves after the deletions)', () => {
        const printed = printTextModel(treeCase().g, treeCase().objects).text;
        const from = printed.indexOf('\n    Folder docs {');
        const docs = printed.slice(from, printed.indexOf('\n    Folder pics', from));
        const c = treeCase();
        const { plan } = edit(c, [[docs, ''], ['Folder pics {}', 'Folder pics {\n      files {\n        File a {\n          size 2\n        }\n      }\n    }'], ['\n      link b', '']],
            { pasted: [['f1', 'a']], referencedElsewhere: new Set(['f1']) });
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set docs.files -= a', 'set pics.files += a', 'delete docs']);
        const withB = edit(c, [[docs, ''], ['Folder pics {}', 'Folder pics {\n      files {\n        File a {\n          size 2\n        }\n      }\n    }'], ['\n      link b', '']],
            { pasted: [['f1', 'a']], referencedElsewhere: new Set(['f2']) });
        expect(codes(withB.plan)).toEqual(['referenced']);
    });

    it('into a created container while the old one is deleted: taken out first, put in after the creation (mutant: no detach)', () => {
        const printed = printTextModel(treeCase().g, treeCase().objects).text;
        const from = printed.indexOf('\n    Folder docs {');
        const docs = printed.slice(from, printed.indexOf('\n    Folder pics', from));
        const { plan } = edit(treeCase(), [[docs, ''], ['  folders {', '  folders {\n    Folder fresh {\n      files {\n        File a {\n          size 2\n        }\n      }\n    }'], ['\n      link b', '']],
            { pasted: [['f1', 'a']] });
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set docs.files -= a', 'delete docs', 'create instance of Folder "fresh" in root.folders', 'set fresh.name = "fresh"', 'set fresh.files += a']);
    });

    it('a swap of nesting moves in text order, the container first: no containment loop on the way (discovery R4)', () => {
        const c: Case = { ...treeCase(), objects: treeCase().objects.map(o => (o.id === 'docs' ? { ...o, slots: { ...o.slots, folders: ['pics'] } } : o.id === 'root' ? { ...o, slots: { ...o.slots, folders: ['docs'] } } : o)) };
        const docsAt = (t: string): string => t.slice(t.indexOf('    Folder docs {'), t.indexOf('\n  }\n  files {'));
        const printed = printTextModel(c.g, c.objects).text;
        const swapped = c.objects.map(o => (o.id === 'root' ? { ...o, slots: { ...o.slots, folders: ['pics'] } } : o.id === 'pics' ? { ...o, slots: { ...o.slots, folders: ['docs'] } } : o.id === 'docs' ? { ...o, slots: { ...o.slots, folders: [] } } : o));
        const target = printTextModel(c.g, swapped).text;
        const { plan } = edit(c, [[docsAt(printed), target.slice(target.indexOf('    Folder pics {'), target.indexOf('\n  }\n  files {'))]], { confirmed: ['uncertain'] });
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set docs.folders -= pics', 'set root.folders += pics', 'set root.folders -= docs', 'set pics.folders += docs']);
    });

    it('an ordered containment reversed: the longest kept prefix stays, the rest is re-appended in text order (mutant: reorder dropped)', () => {
        const reversed = '        File c {\n          size 4\n        }\n        File b {\n          size 3\n        }\n        File a {\n          size 2\n        }';
        const original = '        File a {\n          size 2\n        }\n        File b {\n          size 3\n        }\n        File c {\n          size 4\n        }';
        const { plan } = edit(treeCase(true), [[original, reversed]]);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set docs.files -= b', 'set docs.files += b', 'set docs.files -= a', 'set docs.files += a']);
        // Not declared ordered, or declared `ordered: false`: the model order stays (R-TXT-21 (5)).
        for (const c of [treeCase(), treeCase(false)]) expect(edit(c, [[original, reversed]]).plan.lines).toEqual([]);
    });

    it('an ordered reference reordered, and a move into an ordered slot lands where the text puts it (mutant: prefix kept by set, not by order)', () => {
        expect(edit(treeCase(true), [['pinned [a, b]', 'pinned [b, a]']], { spans: true }).plan.lines).toEqual(['set docs.pinned -= a', 'set docs.pinned += a']);
        expect(edit(treeCase(false), [['pinned [a, b]', 'pinned [b, a]']], { spans: true }).plan.lines).toEqual([]);
        const readme = '\n  files {\n    File readme {\n      size 1\n      link b\n    }\n  }';
        const { plan } = edit(treeCase(true), [[readme, ''], ['          size 2\n        }', '          size 2\n        }\n        File readme {\n          size 1\n          link b\n        }']],
            { spans: true, pasted: [['f0', 'readme']] });
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set root.files -= readme', 'set docs.files += readme', 'set docs.files -= b', 'set docs.files += b', 'set docs.files -= c', 'set docs.files += c']);
    });

    it('into a single-valued slot whose object is deleted: the deletion first, then the move (mutants: the move before the deletion; no detach)', () => {
        const box: Spec = {
            classes: [{ name: 'Folder', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'folders', type: 'Folder', containment: true, many: true },
                { name: 'files', type: 'File', containment: true, many: true }, { name: 'main', type: 'File', containment: true }] },
            { name: 'File', attributes: [{ name: 'name', type: 'EString' }, { name: 'size', type: 'EInt' }] }],
            enums: {},
            objects: [
                { id: 'root', cls: 'Folder', slots: { name: 'root', folders: ['box'], files: ['f1'], main: null } },
                { id: 'box', cls: 'Folder', slots: { name: 'box', folders: [], files: [], main: 'f0' } },
                { id: 'f0', cls: 'File', slots: { name: 'old', size: 1 } },
                { id: 'f1', cls: 'File', slots: { name: 'a', size: 2 } },
            ],
        };
        const { plan } = edit(specCase(box), [['\n  files {\n    File a {\n      size 2\n    }\n  }', ''], ['File old {\n          size 1\n        }', ''],
            ['main {\n        ', 'main {\n        File a {\n          size 2\n        }']],
            { pasted: [['f1', 'a']] });
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.ops.filter(op => op.op === 'move' || op.op === 'delete').map(op => op.op)).toEqual(['delete', 'move']);
        expect(plan.lines).toEqual(['delete old', 'set root.files -= a', 'set box.main = a']);
        // Out of a container deleted too: taken out first, put in after the deletions (mutant: no detach).
        const away: Spec = { ...box, objects: box.objects.map(o => (o.id === 'root' ? { ...o, slots: { ...o.slots, folders: ['box', 'gone'], files: [] } } : o))
            .concat([{ id: 'gone', cls: 'Folder', slots: { name: 'gone', folders: [], files: ['f1'], main: null } }]) };
        const both = edit(specCase(away), [['\n    Folder gone {\n      files {\n        File a {\n          size 2\n        }\n      }\n    }', ''], ['File old {\n          size 1\n        }', ''],
            ['main {\n        ', 'main {\n        File a {\n          size 2\n        }']], { pasted: [['f1', 'a']] });
        expect(both.plan.refusals).toEqual([]);
        expect(both.plan.lines).toEqual(['set gone.files -= a', 'delete old', 'delete gone', 'set box.main = a']);
    });
});

// ---- A reference the user did not retype keeps its target (R-TXT-35; P-2026-11-03-1356, P-2026-11-03-1425) -------

/**
 * Items have no name, so a reference to one prints as a path (R-TXT-4): `pin Folder[0].items[1]` names i1. Measured by
 * P-2026-11-03-1356 (docs/discovery/discovery_2026-11-03_textual_positional_paths.md): the parser resolved a path
 * against the edited text, so an edit that shifts the list retargeted a reference whose text the user did not retype.
 * R-TXT-35: a token whose text, owner and feature are the previous print's keeps the target the print wrote it for; a
 * retyped one is resolved against the edited text as before. `tag` is there for the feature guard only.
 */
const ANON: Spec = {
    classes: [{ name: 'Folder', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'items', type: 'Item', containment: true, many: true }, { name: 'pin', type: 'Item' }, { name: 'tag', type: 'Item' }] },
        { name: 'Item', attributes: [{ name: 'size', type: 'EInt' }] }],
    enums: {},
    objects: [
        { id: 'docs', cls: 'Folder', slots: { name: 'docs', items: ['i0', 'i1', 'i2'], pin: null, tag: null } },
        { id: 'pics', cls: 'Folder', slots: { name: 'pics', items: [], pin: null, tag: null } },
        { id: 'watch', cls: 'Folder', slots: { name: 'watch', items: [], pin: 'i1', tag: null } },
        { id: 'i0', cls: 'Item', slots: { size: 10 } },
        { id: 'i1', cls: 'Item', slots: { size: 11 } },
        { id: 'i2', cls: 'Item', slots: { size: 12 } },
    ],
};
const ITEM = (size: number, indent = '    '): string => `\n${indent}Item {\n${indent}  size ${size}\n${indent}}`;
const PICS_WITH = (...sizes: number[]): string => `Folder pics {\n  items {${sizes.map(n => ITEM(n)).join('')}\n  }\n}`;
const PIN = 'pin Folder[0].items[1]';

interface AnonOptions {
    /** A cut pasted whole: its model object's span carried to the parsed item of that size (D-5 of T7). */
    readonly pasted?: readonly (readonly [id: string, size: number])[];
    /** Object spans the edit lost (a decoration gone). */
    readonly lost?: readonly string[];
}

/** `edit` for nameless objects, in the editor: the object and reference spans are carried over the edit. An empty `from` appends. */
function editAnon(replacements: readonly (readonly [string, string])[], o: AnonOptions = {}) {
    const c = specCase(ANON);
    const printed = printTextModel(c.g, c.objects);
    expect(printed.text).toContain(PIN);
    let text = printed.text;
    let spans: ObjectSpan[] = printed.spans.filter(s => !(o.lost ?? []).includes(s.id));
    let refs: RefSpan[] = [...(printed.refs ?? [])];
    for (const [from, to] of replacements) {
        const at = from === '' ? text.length : text.indexOf(from);
        expect(at, `"${from}" in the text`).toBeGreaterThanOrEqual(0);
        text = text.slice(0, at) + to + text.slice(at + from.length);
        spans = carry(spans, at, from.length, to.length);
        refs = carry(refs, at, from.length, to.length);
    }
    const parsed = parseText(text, c.g, { keep: refs });
    for (const [id, size] of o.pasted ?? []) {
        const s = parsed.spans.find(x => x.id === parsed.objects.find(t => t.slots.size === size)!.id)!;
        spans = [...spans.filter(x => x.id !== id), { id, start: s.start, end: s.end }];
    }
    const plan = planTextEdit({ mm: c.mm, grammar: c.g, model: c.objects, parsed, unprinted: printed.unprinted, previous: spans, previousRefs: refs });
    return { c, text, parsed, plan };
}

/** The ops of a plan on plain objects, as the run writes them: deletions (with the pointers to the deleted), moves and references. */
function applyOps(objects: readonly TextObject[], ops: readonly DiffOp[]): TextObject[] {
    const out = new Map(objects.map(o => [o.id, { ...o, slots: { ...o.slots } }]));
    const id = (r: ObjectRef): string => { if ('model' in r) return r.model; throw new Error('a text object: not in this helper'); };
    for (const op of ops) {
        if (op.op === 'delete') {
            out.delete(op.model);
            for (const x of out.values()) for (const [k, v] of Object.entries(x.slots)) x.slots[k] = Array.isArray(v) ? v.filter(y => y !== op.model) : v === op.model ? null : v;
        } else if (op.op === 'move') {
            if (op.from) { const f = out.get(op.from.owner)!; f.slots[op.from.feature] = (f.slots[op.from.feature] as string[]).filter(y => y !== op.model); }
            if (op.into) { const t = out.get(id(op.into.owner))!; t.slots[op.into.feature] = [...(t.slots[op.into.feature] as string[]), op.model]; }
        } else if (op.op === 'reference') out.get(id(op.target))!.slots[op.feature] = op.to ? id(op.to) : null;
        else throw new Error(`${op.op}: not in this helper`);
    }
    return [...out.values()];
}

/** The path untouched and read without error: the plan applies, and writes nothing to `watch.pin`. */
const keeps = (r: ReturnType<typeof editAnon>): void => {
    expect(r.text).toContain(PIN);
    expect(r.parsed.errors).toEqual([]);
    expect(r.plan.refusals).toEqual([]);
    expect(r.plan.diff!.ops.filter(op => op.op === 'reference')).toEqual([]);
};
const pinOf = (objects: readonly TextObject[]): unknown => objects.find(o => o.id === 'watch')!.slots.pin;
const textIdOf = (r: ReturnType<typeof editAnon>, name: string): string => r.parsed.objects.find(o => o.slots.name === name)!.id;

describe('a reference the user did not retype keeps its target (R-TXT-35)', () => {
    it('(a) after a reorder of docs.items (i0 pasted after i1): kept on i1, no write (mutant: the keep rule dropped)', () => {
        keeps(editAnon([[ITEM(10), ''], [ITEM(11), ITEM(11) + ITEM(10)]], { pasted: [['i0', 10]] }));
    });

    it('(b) after i0 is cut and pasted into pics: kept on i1, only the move is written', () => {
        const r = editAnon([[ITEM(10), ''], ['Folder pics {}', PICS_WITH(10)]], { pasted: [['i0', 10]] });
        keeps(r);
        expect(r.plan.diff!.ops.map(op => op.op)).toEqual(['move']);
    });

    it('(c) after i0 is deleted: kept on i1, only the deletion is written', () => {
        const r = editAnon([[ITEM(10), '']]);
        keeps(r);
        expect(r.plan.diff!.ops).toEqual([{ op: 'delete', model: 'i0' }]);
    });

    it('(d) after a new item is inserted before i0: kept on i1', () => {
        const r = editAnon([['  items {', `  items {${ITEM(9)}`]]);
        keeps(r);
        expect(r.plan.diff!.ops.map(op => op.op)).toEqual(['create', 'attribute']);
    });

    it('(e) after its target i1 is moved into pics and i2 shifts into [1]: kept on i1, which moved', () => {
        const r = editAnon([[ITEM(11), ''], ['Folder pics {}', PICS_WITH(11)]], { pasted: [['i1', 11]] });
        keeps(r);
        expect(r.plan.diff!.ops).toEqual([{ op: 'move', model: 'i1', into: { owner: { model: 'pics' }, feature: 'items' }, from: { owner: 'docs', feature: 'items' } }]);
    });

    it('(e2) after i1 and i2 both move to pics the old index names nothing: kept, not a parse error (mutant: the parser refuses a kept token)', () => {
        const r = editAnon([[ITEM(11), ''], [ITEM(12), ''], ['Folder pics {}', PICS_WITH(11, 12)]], { pasted: [['i1', 11], ['i2', 12]] });
        keeps(r);
        expect(r.plan.diff!.ops.map(op => op.op)).toEqual(['move', 'move']);
    });

    it('a retyped path resolves against the edited text, as before (mutant: the token text not compared)', () => {
        const r = editAnon([['items[1]', 'items[2]']]);
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops).toEqual([{ op: 'reference', target: { model: 'watch' }, feature: 'pin', to: { model: 'i2' } }]);
    });

    it('a path retyped identically, its decoration lost, resolves against the edited text (mutant: the token place not compared)', () => {
        const r = editAnon([[ITEM(10), ''], [PIN, PIN]]);
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops).toEqual([{ op: 'delete', model: 'i0' }, { op: 'reference', target: { model: 'watch' }, feature: 'pin', to: { model: 'i2' } }]);
    });

    it('a retyped path that names nothing is still a parse error', () => {
        const r = editAnon([['items[1]', 'items[7]']]);
        expect(r.parsed.errors.map(e => e.message)).toEqual(['items[7] names no object']);
        expect(codes(r.plan)).toEqual(['parse']);
    });

    it('a kept target deleted in the same edit: the deletion clears the reference, nothing else is written', () => {
        const r = editAnon([[ITEM(11), '']]);
        expect(r.parsed.errors).toEqual([]);
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops).toEqual([{ op: 'delete', model: 'i1' }]);
        expect(pinOf(applyOps(r.c.objects, r.plan.diff!.ops))).toBeNull();
    });

    it('a name reference whose target is renamed while a new object takes the old name: kept on the renamed one', () => {
        const { parsed, plan, text } = edit(LIBRARY_CASE, [['Member bob', 'Member rob'], ['patrons {', 'patrons {\n    Member bob {}']], { spans: true });
        expect(text).toContain('borrowedBy bob');
        expect(parsed.errors).toEqual([]);
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.ops.filter(op => op.op === 'reference' || op.op === 'link')).toEqual([]);
        expect(plan.diff!.ops).toContainEqual({ op: 'attribute', target: { model: 'm2' }, feature: 'name', value: 'rob' });
    });

    it('applied, the reprint shows the new path of the same object: (c) Folder[0].items[0], (e) Folder[1].items[0]', () => {
        const c = editAnon([[ITEM(10), '']]);
        const afterC = applyOps(c.c.objects, c.plan.diff!.ops);
        expect(pinOf(afterC)).toBe('i1');
        expect(printTextModel(c.c.g, afterC).text).toContain('pin Folder[0].items[0]');
        const e = editAnon([[ITEM(11), ''], ['Folder pics {}', PICS_WITH(11)]], { pasted: [['i1', 11]] });
        const afterE = applyOps(e.c.objects, e.plan.diff!.ops);
        expect(pinOf(afterE)).toBe('i1');
        expect(printTextModel(e.c.g, afterE).text).toContain('pin Folder[1].items[0]');
    });

    it('after the deletion of its kept target is applied, the next edit writes no reference to it (mutant: a gone target read as a model object)', () => {
        const r = editAnon([[ITEM(11), '']]);
        const model = applyOps(r.c.objects, r.plan.diff!.ops);
        expect(pinOf(model)).toBeNull();
        const modelOf = new Map(r.plan.diff!.match.matches.map(m => [m.text, m.model]));
        const spans = r.parsed.spans.flatMap(s => (modelOf.has(s.id) ? [{ id: modelOf.get(s.id)!, start: s.start, end: s.end }] : []));
        const refs: RefSpan[] = r.plan.diff!.refs!.map(t => ({ owner: modelOf.get(t.owner)!, feature: t.feature, target: (t.to as { model: string }).model, text: r.text.slice(t.start, t.end), start: t.start, end: t.end }));
        expect(refs).toEqual([expect.objectContaining({ owner: 'watch', feature: 'pin', target: 'i1' })]);
        // The text stays as typed: the untouched path now names i2 in it; the size edit keeps the offsets.
        const text = r.text.replace('size 12', 'size 13');
        const parsed = parseText(text, r.c.g, { keep: refs });
        const plan = planTextEdit({ mm: r.c.mm, grammar: r.c.g, model, parsed, unprinted: printTextModel(r.c.g, model).unprinted, previous: spans, previousRefs: refs });
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.ops).toEqual([{ op: 'attribute', target: { model: 'i2' }, feature: 'size', value: 13 }]);
    });

    it('a reference inside a pasted copy is a new owner: it resolves in the edited text, the original keeps its target', () => {
        const r = editAnon([[ITEM(10), ''], ['', `\nFolder copy {\n  ${PIN}\n}`]]);
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops.filter(op => op.op === 'reference')).toEqual([{ op: 'reference', target: { text: textIdOf(r, 'copy') }, feature: 'pin', to: { model: 'i2' } }]);
    });

    it('the token in a new owner, its place and text untouched, resolves in the edited text (a new owner matches no model object)', () => {
        const r = editAnon([[ITEM(10), ''], ['Folder watch {', 'Folder watch {}\nFolder other {']], { lost: ['watch'] });
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops.filter(op => op.op === 'reference')).toEqual([
            { op: 'reference', target: { model: 'watch' }, feature: 'pin', to: null },
            { op: 'reference', target: { text: textIdOf(r, 'other') }, feature: 'pin', to: { model: 'i2' } },
        ]);
    });

    it('the token under another feature, its place and text untouched, resolves in the edited text (mutant: the feature not compared)', () => {
        const r = editAnon([[ITEM(10), ''], ['  pin ', '  tag ']]);
        expect(r.plan.refusals).toEqual([]);
        expect(r.plan.diff!.ops.filter(op => op.op === 'reference')).toEqual([
            { op: 'reference', target: { model: 'watch' }, feature: 'pin', to: null },
            { op: 'reference', target: { model: 'watch' }, feature: 'tag', to: { model: 'i2' } },
        ]);
    });
});

// ---- The readers of the lookup ----------------------------------------------------------------------------------

describe('what the lookup gives the diff', () => {
    it('defaultedSlots: an empty D-layer value read as a value; referencedElsewhere: a pointer from another model', () => {
        const L: Record<string, any> = {
            M: { id: 'M', className: 'DModel' }, N: { id: 'N', className: 'DModel' },
            F_genre: { id: 'F_genre', className: 'DAttribute', name: 'genre' }, F_year: { id: 'F_year', className: 'DAttribute', name: 'year' },
            F_ref: { id: 'F_ref', className: 'DReference', name: 'borrowedBy' },
            b1: { id: 'b1', className: 'DObject', father: 'M', features: ['V1', 'V2', 'V3'] },
            V1: { id: 'V1', className: 'DValue', father: 'b1', instanceof: 'F_genre', values: [] },
            V2: { id: 'V2', className: 'DValue', father: 'b1', instanceof: 'F_year', values: [1990] },
            V3: { id: 'V3', className: 'DValue', father: 'b1', instanceof: 'F_ref', values: [] },
            m1: { id: 'm1', className: 'DObject', father: 'M', features: [] },
            x: { id: 'x', className: 'DObject', father: 'N', features: ['VX'] },
            VX: { id: 'VX', className: 'DValue', father: 'x', instanceof: 'F_ref', values: ['m1'] },
            VY: { id: 'VY', className: 'DValue', father: 'b1', instanceof: 'F_ref', values: ['m1'] },
        };
        const objects: TextObject[] = [{ id: 'b1', cls: 'Book', slots: { genre: 'FICTION', year: 1990, borrowedBy: null } }];
        expect(defaultedSlots(L, objects)).toEqual(new Map([['b1', new Set(['genre'])]]));
        expect(referencedElsewhere(L, 'M')).toEqual(new Set(['m1']));
        expect(referencedElsewhere(L, 'N')).toEqual(new Set());
    });
});

// ---- The run (no app: the runner is mocked) ---------------------------------------------------------------------

const run = vi.hoisted(() => ({ calls: [] as any[], registered: [] as [string, string][], events: [] as string[] }));
vi.mock('../../../components/editor-v2/preview/PreviewBar', () => ({
    applyAsOneStep: async (p: any) => { run.calls.push({ ...p, registered: [...run.registered] }); return { applied: p.script.split('\n').length, failed: 0 }; },
}));
vi.mock('../../../jjscript/executor/planWorld', () => ({ buildPlanWorld: () => ({ level: 'M1' }) }));
vi.mock('../../../joiner', () => ({ U: {}, store: { getState: () => ({ idlookup: {} }) } }));
vi.mock('../../../jjscript/executor/handleRegistry', () => ({ registerHandle: (h: string, id: string) => { run.registered.push([h, id]); } }));

describe('applyTextEdit', () => {
    it('runs the lines as one undo step, after registering the handles, and nothing when refused (mutant: no undo group)', async () => {
        const events: string[] = [];
        (globalThis as any).window = { dispatchEvent: (e: any) => { events.push(e.type); return true; } };
        (globalThis as any).CustomEvent ??= class { constructor(public type: string, public init?: any) {} };
        const { applyTextEdit } = await import('../textApply');
        const { plan } = edit(LIBRARY_CASE, [['year 2015', 'year 2016'], ['borrowedBy bob', 'borrowedBy ann']], { spans: true });
        expect(await applyTextEdit('M', plan)).toEqual({ applied: 2, failed: 0 });
        expect(run.calls).toHaveLength(1);
        expect(run.calls[0]).toMatchObject({ script: 'set spqr.year = 2016\nset spqr.borrowedBy = ann', modelId: 'M' });
        expect(new Map(run.calls[0].registered)).toEqual(new Map([['spqr', 'b4'], ['ann', 'm1']]));
        expect(events).toHaveLength(2);

        const refused = edit(LIBRARY_CASE, [['year 2015', 'year twenty']], { spans: true });
        expect((await applyTextEdit('M', refused.plan)).refused?.map(r => r.code)).toEqual(['parse']);
        expect(await applyTextEdit('M', edit(LIBRARY_CASE, [], { spans: true }).plan)).toEqual({ applied: 0, failed: 0 });
        // R-TXT-32: a target outside the text prints as @"id"; kept as printed it asks no change and runs nothing.
        const outer: Case = { ...LIBRARY_CASE, objects: libraryObjects({ b1: { borrowedBy: 'elsewhere' } }) };
        expect(await applyTextEdit('M', edit(outer, [], { spans: true }).plan)).toEqual({ applied: 0, failed: 0 });
        expect(run.calls).toHaveLength(1);
    });

    it('a move with a reorder is one run, one undo step (T7 (4); dies when the move or the reorder is refused or run apart)', async () => {
        (globalThis as any).window = { dispatchEvent: () => true };
        const { applyTextEdit } = await import('../textApply');
        const before = run.calls.length;
        const readme = '\n  files {\n    File readme {\n      size 1\n      link b\n    }\n  }';
        const { plan } = edit(treeCase(true), [[readme, ''], ['          size 2\n        }', '          size 2\n        }\n        File readme {\n          size 1\n          link b\n        }']],
            { spans: true, pasted: [['f0', 'readme']] });
        expect(await applyTextEdit('M', plan)).toEqual({ applied: 6, failed: 0 });
        expect(run.calls).toHaveLength(before + 1);
        expect(run.calls[before].script.split('\n')).toEqual(['set root.files -= readme', 'set docs.files += readme', 'set docs.files -= b', 'set docs.files += b', 'set docs.files -= c', 'set docs.files += c']);
    });
});

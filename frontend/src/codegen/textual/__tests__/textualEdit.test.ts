/**
 * Step T6b of the textual notation (P-2026-11-03-0021; R-TXT-22, R-TXT-26, R-TXT-30): the pure half of editing a
 * model in its Text tab. The pause in typing, the rule that keeps a pending edit over a model change or reprints a
 * text with none, the decision on a read text (apply, markers, refusal, panel), the plan made with the spans the
 * editor carried, and the panel's rows. On the library fixture of textDiff.test.ts, plain and annotated. The imports
 * that reach the store are mocked, as textualTab.test.ts does. Mutations each test kills are in its name; the bench is
 * in the commit body.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@monaco-editor/react', () => ({ default: () => null }));
vi.mock('../../../jjscript', () => ({ buildEvalContext: () => ({}) }));
vi.mock('../../../components/editor-v2/sim/simBridge', () => ({ evalContextFor: () => ({}) }));
vi.mock('../../../components/abstract/DockManager', () => ({ default: { closeTab: () => true } }));

import { agreedEvidence, APPLY_DELAY_MS, appliedRefs, appliedSpans, certainSpans, cutClip, editDecision, editStatusText, heldByCut, namedReprint, onModelPrint, outerMarks, pastedRefs, pastedSpans, pathRewrites, pauseOf, planEdit, shiftOffset } from '../ui/TextualTab';
import type { EditBase, TextSync } from '../ui/TextualTab';
import { confirmRows, needsConfirmation } from '../ui/TextConfirmPanel';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import { printTextModel } from '../printer';
import type { ObjectSpan, RefSpan } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { planTextEdit } from '../textDiff';
import { matchObjects } from '../textMatch';
import { parseText } from '../parser';
import { PORT_CLIKE, PORT_MM, PORT_PASCAL, PORT_TEXT_CLIKE, portGrammar, portObjects } from './portCorpus';

// ---- The library fixture (textDiff.test.ts) -----------------------------------------------------------------------

const MM: TextMetamodel = {
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

const IDS: ElementIds = {
    classes: { C_Lib: 'Library', C_Book: 'Book', C_Mem: 'Member' },
    features: {
        A_Lib_name: { owner: 'Library', name: 'name', lower: 1 }, A_Book_name: { owner: 'Book', name: 'name', lower: 1 },
        A_Book_genre: { owner: 'Book', name: 'genre', lower: 1 }, A_Book_year: { owner: 'Book', name: 'year', lower: 0 },
        A_Mem_name: { owner: 'Member', name: 'name', lower: 1 }, R_Lib_books: { owner: 'Library', name: 'books', lower: 0 },
        R_Lib_members: { owner: 'Library', name: 'members', lower: 0 }, R_Book_borrowedBy: { owner: 'Book', name: 'borrowedBy', lower: 0 },
    },
    enums: { E_Genre: 'Genre' },
};

const RECORD: SyntaxAnnotations = {
    v: 1,
    features: { A_Book_genre: { keyword: '' }, R_Lib_books: { groupBy: 'A_Book_genre' } },
    enums: { E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] } },
};

function objects(over: Record<string, Record<string, unknown>> = {}): TextObject[] {
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

function baseOf(record: SyntaxAnnotations | null, objs: TextObject[] = objects()): EditBase & { readonly text: string } {
    const { grammar, issues } = textualNotation(MM, { record, issues: [] }, IDS);
    expect(issues.filter(i => i.level === 'error')).toEqual([]);
    const printed = printTextModel(grammar, objs);
    return { mm: MM, grammar, objects: objs, spans: printed.spans, unprinted: printed.unprinted, refs: printed.refs, text: printed.text };
}

/** Monaco's decorations over one edit (`NeverGrowsWhenTypingAtEdges`), as textDiff.test.ts carries them. */
function carry<S extends { readonly start: number; readonly end: number }>(spans: readonly S[], at: number, removed: number, inserted: number): S[] {
    const delta = inserted - removed;
    return spans.map(s => {
        if (s.end <= at) return s;
        if (s.start >= at + removed) return { ...s, start: s.start + delta, end: s.end + delta };
        const start = s.start <= at ? s.start : at;
        return { ...s, start, end: Math.max(start, s.end + delta) };
    });
}

/** Applies the replacements to the base's text, carrying its spans. */
function edited(base: { readonly text: string; readonly spans: readonly ObjectSpan[]; readonly refs?: readonly RefSpan[] }, replacements: readonly (readonly [string, string])[]) {
    let text = base.text;
    let spans: ObjectSpan[] = [...base.spans];
    let refs: RefSpan[] = [...(base.refs ?? [])];
    for (const [from, to] of replacements) {
        const at = text.indexOf(from);
        expect(at, `"${from}" in the text`).toBeGreaterThanOrEqual(0);
        text = text.slice(0, at) + to + text.slice(at + from.length);
        spans = carry(spans, at, from.length, to.length);
        refs = carry(refs, at, from.length, to.length);
    }
    return { text, spans, refs };
}

const syncOf = (text: string): TextSync => ({ text, model: text });

// ---- The pause --------------------------------------------------------------------------------------------------

describe('the pause in typing', () => {
    afterEach(() => { vi.useRealTimers(); });

    it('runs once, a full delay after the last keystroke (mutant: a poke that does not restart the wait)', () => {
        vi.useFakeTimers();
        const run = vi.fn();
        const pause = pauseOf(APPLY_DELAY_MS, run);
        pause.poke();
        vi.advanceTimersByTime(APPLY_DELAY_MS - 100);
        pause.poke();
        vi.advanceTimersByTime(APPLY_DELAY_MS - 1);
        expect(run).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(run).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(APPLY_DELAY_MS * 3);
        expect(run).toHaveBeenCalledTimes(1);
    });

    it('a cancelled pause never runs (mutant: cancel that keeps the timer)', () => {
        vi.useFakeTimers();
        const run = vi.fn();
        const pause = pauseOf(APPLY_DELAY_MS, run);
        pause.poke();
        pause.cancel();
        vi.advanceTimersByTime(APPLY_DELAY_MS * 2);
        expect(run).not.toHaveBeenCalled();
    });

    it('is about 800 ms (R-TXT-26 «on a pause in typing»)', () => {
        expect(APPLY_DELAY_MS).toBe(800);
    });
});

// ---- Keep or reprint (point 4) ------------------------------------------------------------------------------------

describe('a change of the model from elsewhere', () => {
    const sync: TextSync = { text: 'agreed text', model: 'model print' };

    it('reprints a text with no pending edit (mutant: never reprint)', () => {
        expect(onModelPrint(sync, 'model print, changed', 'agreed text', false)).toBe('reprint');
    });

    it('keeps a pending edit, and a broken one (mutant: reprint over a pending edit)', () => {
        expect(onModelPrint(sync, 'model print, changed', 'agreed text, edited', false)).toBe('keep');
        expect(onModelPrint(sync, 'model print, changed', 'agreed {{ broken', false)).toBe('keep');
    });

    it('does nothing while the tab applies, nor when the print is the agreed one (mutant: the own application reprints)', () => {
        expect(onModelPrint(sync, 'model print, changed', 'agreed text', true)).toBe('none');
        expect(onModelPrint(sync, 'model print', 'agreed text, edited', false)).toBe('none');
    });
});

// ---- The decision on a read text ------------------------------------------------------------------------------------

describe('what a read text does', () => {
    const plain = baseOf(null);

    it('an attribute edit is applied (mutant: never apply)', () => {
        const { text, spans } = edited(plain, [['1980', '1981']]);
        const { parsed, plan } = planEdit(plain, text, spans);
        expect(editDecision(text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'apply' });
        expect(plan.lines).toEqual(['set cosmos.year = 1981']);
    });

    it('a parse handed in is the one planned on, with the same plan (step B1; mutant: parse again regardless)', () => {
        const { text, spans } = edited(plain, [['1980', '1981']]);
        const given = parseText(text, plain.grammar, { keep: [] });
        const shared = planEdit(plain, text, spans, {}, undefined, [], given);
        expect(shared.parsed).toBe(given);
        expect(shared.plan).toEqual(planEdit(plain, text, spans).plan);
    });

    it('the agreed text asks for nothing, even unparsed (mutant: a reprint read as an edit)', () => {
        const { parsed, plan } = planEdit(plain, plain.text, plain.spans);
        expect(editDecision(plain.text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'synced' });
    });

    it('a broken text shows its errors and leaves the model untouched (mutant: apply despite a refusal)', () => {
        const { text, spans } = edited(plain, [['1980', '1980 {']]);
        const { parsed, plan } = planEdit(plain, text, spans);
        const d = editDecision(text, syncOf(plain.text), parsed, plan, false);
        expect(d.kind).toBe('errors');
        expect(parsed.errors.length).toBeGreaterThan(0);
        expect(plan.lines).toBeNull();
    });

    it('the model changed under the edit: not applied, even a clean text (mutant: apply over a stale edit)', () => {
        const { text, spans } = edited(plain, [['1980', '1981']]);
        const { parsed, plan } = planEdit(plain, text, spans);
        expect(editDecision(text, syncOf(plain.text), parsed, plan, true)).toEqual({ kind: 'stale' });
    });

    it('objects the text does not print refuse it, with the reason (R-TXT-30; mutant: apply despite a refusal)', () => {
        const base = baseOf(RECORD, objects({ b3: { genre: null } }));
        expect(base.unprinted.map(u => u.id)).toEqual(['b3']);
        const { text, spans } = edited(base, [['1980', '1981']]);
        const { parsed, plan } = planEdit(base, text, spans);
        const d = editDecision(text, syncOf(base.text), parsed, plan, false);
        expect(d).toEqual({ kind: 'refused', reasons: ['1 object is not in the text'] });
        expect(editStatusText(d).text).toBe('Not applied: 1 object is not in the text');
        expect(plan.lines).toBeNull();
    });

    it('a deleted object another model references opens the panel, flagged (mutant: referenced not confirmable)', () => {
        const dune = plain.spans.find(s => s.id === 'b1')!;
        const text = plain.text.slice(0, dune.start) + plain.text.slice(dune.end);
        const { parsed, plan } = planEdit(plain, text, carry(plain.spans, dune.start, dune.end - dune.start, 0), { referencedElsewhere: new Set(['b1']) });
        expect(editDecision(text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'confirm' });
        expect(confirmRows({ plan, parsed, mm: MM, grammar: plain.grammar, model: plain.objects, referencedElsewhere: new Set(['b1']) }))
            .toEqual([{ old: 'Book dune', new: null, reason: 'deleted, referenced from another model', flagged: true }]);
    });
});

// ---- Identity: the carried spans (R-TXT-22) ----------------------------------------------------------------------

describe('the spans the editor carried', () => {
    const plain = baseOf(null);

    it('a rename with the same body keeps the object, and applies (mutant: spans not passed)', () => {
        const { text, spans } = edited(plain, [['cosmos', 'kosmos']]);
        const { parsed, plan } = planEdit(plain, text, spans);
        const b2 = plan.diff!.match.matches.find(m => m.model === 'b2');
        expect(b2).toMatchObject({ by: 'span', uncertain: false });
        expect(plan.diff!.match.created).toEqual([]);
        expect(plan.lines).toEqual(['set cosmos.name = "kosmos"']);
        expect(editDecision(text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'apply' });
    });

    it('without them the same rename is uncertain and asks (the evidence the spans carry)', () => {
        const { text } = edited(plain, [['cosmos', 'kosmos']]);
        const { parsed, plan } = planEdit(plain, text, []);
        expect(plan.diff!.match.matches.find(m => m.model === 'b2')).toMatchObject({ by: 'rename', uncertain: true });
        expect(editDecision(text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'confirm' });
    });

    it('only certain matches are carried to the next parse (mutant: an uncertain match carried as a span)', () => {
        const { text } = edited(plain, [['cosmos', 'kosmos']]);
        const { parsed, plan } = planEdit(plain, text, []);
        const carried = certainSpans(parsed, plan.diff!.match);
        expect(carried.map(s => s.id)).not.toContain('b2');
        expect(carried.map(s => s.id)).toContain('b1');
        const t = parsed.spans.find(s => parsed.objects.find(o => o.id === s.id)?.slots.name === 'dune')!;
        expect(carried.find(s => s.id === 'b1')).toEqual({ id: 'b1', start: t.start, end: t.end });
    });
});

// ---- After an application ----------------------------------------------------------------------------------------

describe('the spans of an applied text', () => {
    /** The model after the run: the text's new objects as model objects `n1`, `n2`, ... appended in text order. */
    function applied(base: EditBase & { readonly text: string }, text: string, carried: readonly ObjectSpan[], confirmed?: Parameters<typeof planEdit>[4]) {
        const { parsed, plan } = planEdit(base, text, carried, {}, confirmed);
        expect(plan.lines).not.toBeNull();
        const created = plan.diff!.match.created;
        const fresh = created.map((t, i) => ({ ...parsed.objects.find(o => o.id === t)!, id: `n${i + 1}` }));
        const matched = new Map(plan.diff!.match.matches.map(m => [m.text, m.model]));
        const lib = base.objects.find(o => o.id === 'lib')!;
        const books = parsed.objects.find(o => o.cls === 'Library')!.slots.books as string[];
        const model = [
            { ...lib, slots: { ...lib.slots, books: books.map(t => matched.get(t) ?? fresh[created.indexOf(t)].id) } },
            ...base.objects.filter(o => o.id !== 'lib' && [...matched.values()].includes(o.id)), ...fresh,
        ];
        const rematch = matchObjects({ mm: MM, grammar: base.grammar, model, parsed, previous: carried });
        return { parsed, plan, spans: appliedSpans(parsed, plan.diff!.match, rematch) };
    }

    it('two homonyms created together get a span each, by order (mutant: created homonyms left without spans)', () => {
        const plain = baseOf(null);
        const odes = plain.text.indexOf('odes');
        const end = plain.text.indexOf('}', odes) + 1;
        const add = '\n    Book twin {\n    }\n    Book twin {\n    }';
        const { text, spans } = { text: plain.text.slice(0, end) + add + plain.text.slice(end), spans: carry(plain.spans, end, 0, add.length) };
        const { spans: out } = applied(plain, text, spans);
        expect(out.filter(s => s.id.startsWith('n')).map(s => s.id)).toEqual(['n1', 'n2']);
        expect(new Set(out.map(s => s.id)).size).toBe(out.length);
    });

    it('a confirmed homonym keeps the match it was applied with (mutant: confirmed matches not carried)', () => {
        const homonyms = baseOf(null, objects({ b3: { name: 'dune' } }));
        const { text } = edited(homonyms, [['1980', '1981']]);
        const { plan, spans: out } = applied(homonyms, text, [], ['uncertain']);
        const pairs = plan.diff!.match.matches.filter(m => m.uncertain).map(m => m.model).sort();
        expect(pairs).toEqual(['b1', 'b3']);
        expect(out.map(s => s.id)).toEqual(expect.arrayContaining(['b1', 'b3']));
    });
});

// ---- The panel ----------------------------------------------------------------------------------------------------

describe('the panel of the matches to confirm', () => {
    const homonyms = baseOf(null, objects({ b3: { name: 'dune' } }));

    it('homonyms matched by order open it, one row each, and nothing applies (mutant: homonyms applied unasked)', () => {
        const { text } = edited(homonyms, [['1980', '1981']]);
        const { parsed, plan } = planEdit(homonyms, text, []);
        expect(needsConfirmation(plan)).toBe(true);
        expect(plan.lines).toBeNull();
        const rows = confirmRows({ plan, parsed, mm: MM, grammar: homonyms.grammar, model: homonyms.objects });
        expect(rows).toEqual([
            { old: 'Book dune', new: 'Book dune', reason: 'same name, paired by order', flagged: false },
            { old: 'Book dune', new: 'Book dune', reason: 'same name, paired by order', flagged: false },
        ]);
    });

    it('confirming applies the same text (mutant: confirmed refusals kept)', () => {
        const { text } = edited(homonyms, [['1980', '1981']]);
        const { plan } = planEdit(homonyms, text, [], {}, ['uncertain', 'referenced']);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set cosmos.year = 1981']);
    });

    it('the carried spans leave no homonym to confirm (R-TXT-22)', () => {
        const { text, spans } = edited(homonyms, [['1980', '1981']]);
        const { parsed, plan } = planEdit(homonyms, text, spans);
        expect(needsConfirmation(plan)).toBe(false);
        expect(editDecision(text, syncOf(homonyms.text), parsed, plan, false)).toEqual({ kind: 'apply' });
    });

    it('a confirmation drops no other refusal (mutant: every refusal confirmable)', () => {
        const base = baseOf(RECORD, objects({ b3: { genre: null } }));
        const { text, spans } = edited(base, [['1980', '1981']]);
        const parsed = parseText(text, base.grammar);
        const plan = planTextEdit({
            mm: MM, grammar: base.grammar, model: base.objects, parsed, unprinted: base.unprinted, previous: spans,
            confirmed: ['uncertain', 'referenced', 'unprinted'],
        });
        expect(plan.refusals.map(r => r.code)).toEqual(['unprinted']);
        expect(needsConfirmation(plan)).toBe(false);
    });

    it('no panel when nothing is uncertain', () => {
        const { text, spans } = edited(baseOf(null), [['1980', '1981']]);
        const { plan } = planEdit(baseOf(null), text, spans);
        expect(needsConfirmation(plan)).toBe(false);
    });
});

// ---- Step T7: a cut pasted whole, and the marker of a misplaced outer reference ------------------------------------

describe('a cut pasted whole carries its spans (T7 D-5)', () => {
    const plain = baseOf(null);
    const line = '    Member ann {}\n';
    const at = plain.text.indexOf(line);
    const afterCut = plain.text.slice(0, at) + plain.text.slice(at + line.length);
    const clip = cutClip(plain.text, plain.spans, at, line.length)!;

    it('the cut holds the spans wholly inside it; one with no whole object holds nothing (mutant: partial spans kept)', () => {
        expect(at).toBeGreaterThan(0);
        expect(clip).toEqual({ text: line, spans: [{ id: 'm1', start: 4, end: 4 + 'Member ann {}'.length }] });
        expect(cutClip(plain.text, plain.spans, at, 6)).toBeNull();
    });

    it('pasted identical elsewhere, the object is certain and moves, no panel (mutant: spans not re-attached)', () => {
        const text = line + afterCut;
        const carried = carry(carry(plain.spans, at, line.length, 0), 0, 0, line.length).filter(x => x.end > x.start);
        const spans = [...carried, ...pastedSpans(clip, 0, line, text)];
        const { parsed, plan } = planEdit(plain, text, spans);
        expect(plan.diff!.match.matches.find(m => m.model === 'm1')).toMatchObject({ by: 'span', uncertain: false });
        expect(plan.lines).toEqual(['set city.members -= ann']);
        expect(editDecision(text, syncOf(plain.text), parsed, plan, false)).toEqual({ kind: 'apply' });
        // Without the carried span the same text asks (R-TXT-18).
        expect(editDecision(text, syncOf(plain.text), parsed, planEdit(plain, text, carried).plan, false)).toEqual({ kind: 'confirm' });
    });

    it('a paste with the original still in the text, or of another text, carries nothing: a copy is new (R-TXT-22; mutant: no count of the copies)', () => {
        expect(pastedSpans(clip, 0, line, line + plain.text)).toEqual([]);
        expect(pastedSpans(clip, 0, 'Member ann {}', 'Member ann {}' + afterCut)).toEqual([]);
    });

    it('until pasted, the deletion of a cut object is held (mutant: the cut deletes on the pause)', () => {
        const free = baseOf(null, objects({ b2: { borrowedBy: null } }));
        const where = free.text.indexOf(line);
        const freeClip = cutClip(free.text, free.spans, where, line.length)!;
        const { plan } = planEdit(free, free.text.slice(0, where) + free.text.slice(where + line.length), carry(free.spans, where, line.length, 0));
        expect(plan.lines).toEqual(['delete ann']);
        expect(heldByCut(freeClip, free, plan)).toBe(1);
        const other = planEdit(free, free.text.replace('1980', '1981'), free.spans).plan;
        expect(other.lines).toEqual(['set cosmos.year = 1981']);
        expect(heldByCut(freeClip, free, other)).toBe(0);
        expect(heldByCut(null, free, plan)).toBe(0);
        expect(editStatusText({ kind: 'cut', count: 1 })).toEqual({ text: 'Cut · paste to move it', error: false });
    });
});

describe('a misplaced outer reference is marked on its line (T7 (5), R-TXT-32 code outer)', () => {
    it('the @"id" token inside its owner, not one of an object it contains (mutant: no marker; first token of the text)', () => {
        const base = baseOf(null, objects({ b1: { borrowedBy: 'elsewhere' }, b4: { borrowedBy: 'elsewhere' } }));
        expect(base.text.split('@"elsewhere"')).toHaveLength(3);
        const second = base.text.indexOf('@"elsewhere"', base.text.indexOf('@"elsewhere"') + 1);
        const text = base.text.slice(0, second) + '@"other"' + base.text.slice(second + '@"elsewhere"'.length);
        const { parsed, plan } = planEdit(base, text, carry(base.spans, second, '@"elsewhere"'.length, '@"other"'.length));
        expect(plan.refusals.map(r => r.code)).toEqual(['outer']);
        const marks = outerMarks(text, parsed, plan.diff!);
        expect(marks).toHaveLength(1);
        expect(text.slice(marks[0].start, marks[0].end)).toBe('@"other"');
        expect(marks[0].start).toBe(second);
        expect(marks[0].message).toContain('outside the text');
    });

    it('the same @"id" in a contained object, earlier in the owner\'s span, is not the owner\'s token (mutant: token of a contained object)', () => {
        const text = 'Library lib {\n  Book b1 { borrowedBy @"x" }\n  owner @"x"\n}';
        const child = text.indexOf('Book b1');
        const spans = [{ id: 'lib', start: 0, end: text.length }, { id: 'b1', start: child, end: text.indexOf('}', child) + 1 }];
        const diff = { match: { matches: [{ model: 'lib', text: 'lib' }, { model: 'b1', text: 'b1' }] }, outer: [{ target: { model: 'lib' }, feature: 'owner', id: 'x' }] };
        const marks = outerMarks(text, { objects: [], spans }, diff as unknown as Parameters<typeof outerMarks>[2]);
        expect(marks).toHaveLength(1);
        expect(marks[0].start).toBe(text.lastIndexOf('@"x"'));
    });
});

// ---- Step T7: the reference tokens the editor carried (R-TXT-35) ---------------------------------------------------

describe('the reference tokens the editor carried (R-TXT-35)', () => {
    const plain = baseOf(null);
    /** bob renamed rob while a new Member takes the name bob; `borrowedBy bob` in spqr is left alone. */
    const SWAP: readonly (readonly [string, string])[] = [['Member bob', 'Member rob'], ['members {', 'members {\n    Member bob {}']];
    const refOps = (plan: ReturnType<typeof planEdit>['plan']) => plan.diff!.ops.filter(op => op.op === 'reference' || op.op === 'link');

    /** The model after the run of SWAP: m2 renamed rob, the new Member as `n1`, first of the members. */
    function afterSwap() {
        const { text, spans, refs } = edited(plain, SWAP);
        const { parsed, plan } = planEdit(plain, text, spans, {}, undefined, refs);
        expect(plan.lines).not.toBeNull();
        const created = plan.diff!.match.created;
        expect(created).toHaveLength(1);
        const fresh = { ...parsed.objects.find(o => o.id === created[0])!, id: 'n1' };
        const model = plain.objects.map(o => (o.id === 'm2' ? { ...o, slots: { ...o.slots, name: 'rob' } } : o.id === 'lib' ? { ...o, slots: { ...o.slots, members: ['n1', 'm1', 'm2'] } } : o));
        const next = baseOf(null, [...model, fresh]);
        const rematch = matchObjects({ mm: MM, grammar: plain.grammar, model: next.objects, parsed, previous: spans });
        return { text, next, spans: appliedSpans(parsed, plan.diff!.match, rematch), refs: appliedRefs(text, plan.diff!.refs ?? [], plan.diff!.match, rematch) };
    }

    it('planEdit passes them: the untouched token keeps the renamed target, the new homonym takes nothing (mutant: refs not passed)', () => {
        const { text, spans, refs } = edited(plain, SWAP);
        expect(text).toContain('borrowedBy bob');
        const kept = planEdit(plain, text, spans, {}, undefined, refs);
        expect(kept.parsed.errors).toEqual([]);
        expect(kept.plan.refusals).toEqual([]);
        expect(refOps(kept.plan)).toEqual([]);
        expect(kept.plan.diff!.ops).toContainEqual({ op: 'attribute', target: { model: 'm2' }, feature: 'name', value: 'rob' });
        // Without the tokens the same text reads `bob` as the new Member (the evidence the tokens carry).
        const read = planEdit(plain, text, spans);
        expect(refOps(read.plan)).toHaveLength(1);
        expect(refOps(read.plan)[0]).toMatchObject({ target: { model: 'b4' }, feature: 'borrowedBy' });
    });

    it('after an application the next edit still keeps it, the text unchanged (mutant: appliedRefs not set after apply)', () => {
        const { text, next, spans, refs } = afterSwap();
        expect(refs).toContainEqual({ owner: 'b4', feature: 'borrowedBy', target: 'm2', text: 'bob', start: text.indexOf('borrowedBy bob') + 'borrowedBy '.length, end: text.indexOf('borrowedBy bob') + 'borrowedBy bob'.length });
        const again = edited({ text, spans, refs }, [['1980', '1981']]);
        const { plan } = planEdit(next, again.text, again.spans, {}, undefined, again.refs);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toEqual(['set cosmos.year = 1981']);
        const read = planEdit(next, again.text, again.spans).plan;
        expect(read.lines).toEqual(['set cosmos.year = 1981', 'set spqr.borrowedBy = bob']);
    });

    it('a token whose owner the edit changed is read in the text (mutant: the owner not compared)', () => {
        // spqr's header and odes' last line deleted: odes now holds `borrowedBy bob`, at the place and with the text carried for spqr.
        // The deletion cuts the decorations of both books (this `carry` keeps spqr's whole): the match reads names.
        const { text, spans: all, refs } = edited(plain, [...SWAP, ['genre POETRY\n    }\n    Book spqr {\n      ', '']]);
        const spans = all.filter(s => s.id !== 'b3' && s.id !== 'b4');
        expect(text).toContain('Book odes {\n      genre HISTORY\n      year 2015\n      borrowedBy bob\n    }');
        expect(refs).toContainEqual(expect.objectContaining({ owner: 'b4', text: 'bob', target: 'm2' }));
        const { parsed, plan } = planEdit(plain, text, spans, {}, undefined, refs);
        expect(plan.diff!.match.matches.find(m => m.model === 'b3')).toMatchObject({ uncertain: false });
        expect(plan.diff!.match.deleted).toEqual(['b4']);
        const fresh = parsed.objects.find(o => o.cls === 'Member' && o.slots.name === 'bob')!.id;
        expect(refOps(plan)).toEqual([{ op: 'reference', target: { model: 'b3' }, feature: 'borrowedBy', to: { text: fresh } }]);
    });

    it('a cut pasted whole carries its tokens; a copy carries none (mutant: pastedRefs re-attaches nothing)', () => {
        const swapped = edited(plain, SWAP);
        const start = swapped.text.indexOf('    Book spqr {');
        const end = swapped.text.indexOf('}', swapped.text.indexOf('borrowedBy bob')) + 2;
        const cut = swapped.text.slice(start, end);
        const clip = cutClip(swapped.text, swapped.spans, start, cut.length, swapped.refs)!;
        expect(clip.refs).toEqual([{ owner: 'b4', feature: 'borrowedBy', target: 'm2', text: 'bob', start: cut.indexOf('bob'), end: cut.indexOf('bob') + 3 }]);
        const at = swapped.text.indexOf('    Book dune {');
        const afterCut = { text: swapped.text.slice(0, start) + swapped.text.slice(end), spans: carry(swapped.spans, start, cut.length, 0), refs: carry(swapped.refs, start, cut.length, 0) };
        const text = afterCut.text.slice(0, at) + cut + afterCut.text.slice(at);
        const spans = [...carry(afterCut.spans, at, 0, cut.length).filter(x => x.end > x.start), ...pastedSpans(clip, at, cut, text)];
        const refs = [...carry(afterCut.refs, at, 0, cut.length).filter(x => x.end > x.start), ...pastedRefs(clip, at, cut, text)];
        expect(refs.map(r => r.owner)).toContain('b4');
        const { plan } = planEdit(plain, text, spans, {}, undefined, refs);
        expect(plan.refusals).toEqual([]);
        expect(refOps(plan)).toEqual([]);
        expect(refOps(planEdit(plain, text, spans, {}, undefined, refs.filter(r => r.owner !== 'b4')).plan)).toHaveLength(1);
        expect(pastedRefs(clip, at, cut, cut + swapped.text)).toEqual([]);
    });
});

// ---- After an application the text shows the current paths (R-TXT-35, P-2026-11-03-1535) ---------------------------

describe('after an application the text shows the current paths (R-TXT-35)', () => {
    /** Three Members named ann: a reference to one prints as its path. spqr borrows the third, cosmos nobody. */
    const ANNS = (): TextObject[] => [
        ...objects({ lib: { members: ['m1', 'm2', 'm3'] }, m2: { name: 'ann' }, b2: { borrowedBy: null }, b4: { borrowedBy: 'm3' } }),
        { id: 'm3', cls: 'Member', slots: { name: 'ann' } },
    ];
    const tokenOf = (refs: readonly RefSpan[] | undefined, owner: string) => refs!.find(r => r.owner === owner)!;
    const shiftSpan = <S extends { readonly start: number; readonly end: number }>(s: S, edits: Parameters<typeof shiftOffset>[1]): S =>
        ({ ...s, start: shiftOffset(s.start, edits), end: shiftOffset(s.end, edits) });

    /** The text edit applied: the edited text, the model after the run (`model`), and what the tab carries then. */
    function applied(base: ReturnType<typeof baseOf>, replacements: readonly (readonly [string, string])[], model: TextObject[]) {
        const { text, spans, refs } = edited(base, replacements);
        const { parsed, plan } = planEdit(base, text, spans, {}, undefined, refs);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines?.length).toBeGreaterThan(0);
        const next = baseOf(null, model);
        const rematch = matchObjects({ mm: MM, grammar: base.grammar, model: next.objects, parsed, previous: spans });
        return { text, next, spans: appliedSpans(parsed, plan.diff!.match, rematch), refs: appliedRefs(text, plan.diff!.refs ?? [], plan.diff!.match, rematch) };
    }

    /** The first ann deleted, a comment typed on the library's line: spqr's kept path names a slot that is gone. */
    function deletedFirst() {
        const base = baseOf(null, ANNS());
        const m1 = base.spans.find(s => s.id === 'm1')!;
        const line = base.text.slice(base.text.lastIndexOf('\n', m1.start) + 1, m1.end + 1);
        const model = ANNS().filter(o => o.id !== 'm1').map(o => (o.id === 'lib' ? { ...o, slots: { ...o.slots, members: ['m2', 'm3'] } } : o));
        return { base, ...applied(base, [[line, ''], ['city {', 'city { // kept as typed']], model) };
    }

    it('rewrites the kept path to the new one, and nothing else (mutant: no rewrite; the whole text reprinted)', () => {
        const { base, text, next, refs } = deletedFirst();
        const was = tokenOf(base.refs, 'b4').text, now = tokenOf(next.refs, 'b4').text;
        expect(was).not.toBe(now);
        const at = text.indexOf(was);
        expect(text.lastIndexOf(was)).toBe(at);
        const r = pathRewrites(text, refs, next.refs!);
        expect(r.edits).toEqual([{ start: at, end: at + was.length, text: now }]);
        expect(r.text).toBe(text.slice(0, at) + now + text.slice(at + was.length));
        expect(r.text).toContain('city { // kept as typed');
        expect(r.text).not.toBe(next.text);
        expect(r.held).toBe(0);
    });

    it('rewrites a kept name too, and leaves an unchanged token alone (mutant: every token rewritten; the text compared)', () => {
        const plain = baseOf(null);
        const SWAP: readonly (readonly [string, string])[] = [['Member bob', 'Member rob'], ['members {', 'members {\n    Member bob {}']];
        const fresh = (n: TextObject): TextObject => ({ ...n, id: 'n1' });
        const { text: typed, spans, refs: carried } = edited(plain, SWAP);
        const { parsed } = planEdit(plain, typed, spans, {}, undefined, carried);
        const made = parsed.objects.find(o => o.cls === 'Member' && o.slots.name === 'bob')!;
        const model = plain.objects.map(o => (o.id === 'm2' ? { ...o, slots: { ...o.slots, name: 'rob' } } : o.id === 'lib' ? { ...o, slots: { ...o.slots, members: ['n1', 'm1', 'm2'] } } : o));
        const { text, next, refs } = applied(plain, SWAP, [...model, fresh(made)]);
        const r = pathRewrites(text, refs, next.refs!);
        const at = text.indexOf('borrowedBy bob') + 'borrowedBy '.length;
        expect(r.edits).toEqual([{ start: at, end: at + 3, text: 'rob' }]);
        expect(r.refs.filter(t => t.text !== text.slice(t.start, t.end))).toEqual([{ owner: 'b4', feature: 'borrowedBy', target: 'm2', text: 'rob', start: at, end: at + 3 }]);
        expect(r.refs).toContainEqual(expect.objectContaining({ owner: 'b2', target: 'm1', text: 'ann' }));
        expect(r.text).toBe(next.text);
    });

    it('pairs by owner, feature and target, and writes every edit in text order (mutant: target not in the key; no sort; applied front to back)', () => {
        const tok = (target: string, text: string, start: number): RefSpan => ({ owner: 'o', feature: 'f', target, text, start, end: start + text.length });
        const text = 'a X b Y c';
        const r = pathRewrites(text, [tok('t2', 'Y', 6), tok('t1', 'X', 2)], [tok('t2', 'YYY', 0), tok('t1', 'XX', 0)]);
        expect(r.text).toBe('a XX b YYY c');
        expect(r.refs).toEqual([tok('t2', 'YYY', 7), tok('t1', 'XX', 2)]);
    });

    it('the next edit keeps the rewritten token, and the rewrite alone asks for no change (mutant: the refs keep the old text)', () => {
        const { text, next, spans, refs } = deletedFirst();
        const r = pathRewrites(text, refs, next.refs!);
        const moved = spans.map(s => shiftSpan(s, r.edits));
        expect(planEdit(next, r.text, moved, {}, undefined, r.refs).plan.lines).toEqual([]);
        // A new ann ahead of the others: the rewritten path now names m2 in the text, and is kept on m3.
        const again = edited({ text: r.text, spans: moved, refs: [...r.refs] }, [['members {', 'members {\n    Member ann {}']]);
        const { plan } = planEdit(next, again.text, again.spans, {}, undefined, again.refs);
        expect(plan.refusals).toEqual([]);
        expect(plan.diff!.ops.filter(op => op.op === 'reference' || op.op === 'link')).toEqual([]);
        expect(plan.diff!.match.created).toHaveLength(1);
    });

    it('a token under the caret or a selection waits, edges included (mutant: the caret ignored; the edges exclusive)', () => {
        const { text, next, refs } = deletedFirst();
        const t = tokenOf(refs, 'b4');
        for (const sel of [{ start: t.start, end: t.start }, { start: t.end, end: t.end }, { start: t.start + 2, end: t.start + 2 }, { start: t.start - 5, end: t.start + 1 }]) {
            const r = pathRewrites(text, refs, next.refs!, [sel]);
            expect(r.edits, JSON.stringify(sel)).toEqual([]);
            expect(r.text).toBe(text);
            expect(r.held).toBe(1);
            expect(r.refs).toContainEqual(t);
        }
        // The caret leaves it: the same call rewrites.
        expect(pathRewrites(text, refs, next.refs!, [{ start: t.end + 1, end: t.end + 1 }]).edits).toHaveLength(1);
    });

    it('the caret keeps its place in the text (mutant: offsets not shifted; shifted before the edit too; one edit counted)', () => {
        const { text, next, refs } = deletedFirst();
        const t = tokenOf(refs, 'b4');
        const r = pathRewrites(text, refs, next.refs!);
        const after = text.indexOf('}', t.end);
        expect(r.text.slice(shiftOffset(after, r.edits))).toBe(text.slice(after));
        expect(r.text.slice(0, shiftOffset(t.start - 1, r.edits))).toBe(text.slice(0, t.start - 1));
        // Edits that change the length: `ab|cd|ef|gh` with `cd` to `xyz` and `gh` to `g`.
        const edits = [{ start: 2, end: 4, text: 'xyz' }, { start: 6, end: 8, text: 'g' }];
        expect([0, 2, 4, 5, 6, 8].map(o => shiftOffset(o, edits))).toEqual([0, 2, 5, 6, 7, 8]);
    });

    it('one Undo reprints the text before the application: the rewritten text is the agreement (mutant: the agreement kept as typed)', () => {
        const { base, text, next, refs } = deletedFirst();
        const r = pathRewrites(text, refs, next.refs!);
        // The app's undo restores the model: its print is the base's again.
        expect(onModelPrint({ text: r.text, model: next.text }, base.text, r.text, false)).toBe('reprint');
        expect(onModelPrint({ text, model: next.text }, base.text, r.text, false)).toBe('keep');
    });
});

// ---- A text equal to the agreed one again gets its spans back (P-2026-11-03-2326) -----------------------------------

describe('a text equal to the agreed one again gets its spans and tokens back (P-2026-11-03-2326)', () => {
    /** Two Members named ann: with no span a comment-only edit pairs them by order, and the panel asks. */
    const anns = baseOf(null, objects({ m2: { name: 'ann' }, b2: { borrowedBy: null }, b4: { borrowedBy: null } }));
    const agreed = (base: ReturnType<typeof baseOf>): TextSync => ({ text: base.text, model: base.text, spans: base.spans, refs: base.refs });
    type Edit = readonly [at: number, removed: number, inserted: string];

    /** The tab over the edits: Monaco carries the decorations, an empty one is dropped, and with `restore` a text equal to the agreed one takes its evidence back. */
    function typed(sync: TextSync, edits: readonly Edit[], restore = true) {
        let text = sync.text;
        let spans: ObjectSpan[] = [...sync.spans!];
        let refs: RefSpan[] = [...(sync.refs ?? [])];
        for (const [at, removed, inserted] of edits) {
            text = text.slice(0, at) + inserted + text.slice(at + removed);
            spans = carry(spans, at, removed, inserted.length).filter(s => s.end > s.start);
            refs = carry(refs, at, removed, inserted.length).filter(s => s.end > s.start);
            const back = restore ? agreedEvidence(sync, text) : null;
            if (back) { spans = [...back.spans]; refs = [...back.refs]; }
        }
        return { text, spans, refs };
    }

    const decide = (base: ReturnType<typeof baseOf>, sync: TextSync, t: ReturnType<typeof typed>) => {
        const { parsed, plan } = planEdit(base, t.text, t.spans, {}, undefined, t.refs);
        return editDecision(t.text, sync, parsed, plan, false);
    };

    it('the whole text deleted and pasted back, then a comment: no change (mutant: no restore)', () => {
        const sync = agreed(anns);
        const comment = anns.text.indexOf('city {') + 'city {'.length;
        const edits: Edit[] = [[0, anns.text.length, ''], [0, 0, anns.text], [comment, 0, ' // a comment']];
        expect(decide(anns, sync, typed(sync, edits))).toEqual({ kind: 'unchanged' });
        expect(editStatusText({ kind: 'unchanged' }).text).toBe('No change');
        // Without the restore the paste back carries no span: the two anns are paired by order and the panel asks.
        const lost = typed(sync, edits, false);
        expect(lost.spans).toEqual([]);
        expect(decide(anns, sync, lost)).toEqual({ kind: 'confirm' });
    });

    it('a block deleted and pasted back, then a comment: no change (mutant: no restore)', () => {
        const sync = agreed(anns);
        const block = '    Member ann {}\n    Member ann {}\n';
        const at = anns.text.indexOf(block);
        expect(at).toBeGreaterThan(0);
        const comment = anns.text.indexOf('city {') + 'city {'.length;
        const edits: Edit[] = [[at, block.length, ''], [at, 0, block], [comment, 0, ' // a comment']];
        expect(decide(anns, sync, typed(sync, edits))).toEqual({ kind: 'unchanged' });
        const lost = typed(sync, edits, false);
        expect(lost.spans.map(s => s.id)).not.toContain('m1');
        expect(decide(anns, sync, lost)).toEqual({ kind: 'confirm' });
    });

    it('the tokens come back too: a token kept on a renamed target keeps it after a paste back (mutant: the spans restored, the tokens not)', () => {
        // R-TXT-35's swap applied, its path rewrite held under the caret: the agreed `borrowedBy bob` names m2, now rob.
        const plain = baseOf(null);
        const SWAP: readonly (readonly [string, string])[] = [['Member bob', 'Member rob'], ['members {', 'members {\n    Member bob {}']];
        const swapped = edited(plain, SWAP);
        const { parsed, plan } = planEdit(plain, swapped.text, swapped.spans, {}, undefined, swapped.refs);
        const fresh = { ...parsed.objects.find(o => o.id === plan.diff!.match.created[0])!, id: 'n1' };
        const model = plain.objects.map(o => (o.id === 'm2' ? { ...o, slots: { ...o.slots, name: 'rob' } } : o.id === 'lib' ? { ...o, slots: { ...o.slots, members: ['n1', 'm1', 'm2'] } } : o));
        const next = baseOf(null, [...model, fresh]);
        const rematch = matchObjects({ mm: MM, grammar: plain.grammar, model: next.objects, parsed, previous: swapped.spans });
        const sync: TextSync = {
            text: swapped.text, model: next.text,
            spans: appliedSpans(parsed, plan.diff!.match, rematch), refs: appliedRefs(swapped.text, plan.diff!.refs ?? [], plan.diff!.match, rematch),
        };
        const edits: Edit[] = [[0, swapped.text.length, ''], [0, 0, swapped.text], [swapped.text.indexOf('1980'), 4, '1981']];
        const back = typed(sync, edits);
        expect(planEdit(next, back.text, back.spans, {}, undefined, back.refs).plan.lines).toEqual(['set cosmos.year = 1981']);
        const lost = typed(sync, edits, false);
        expect(planEdit(next, lost.text, lost.spans, {}, undefined, lost.refs).plan.lines).toEqual(['set cosmos.year = 1981', 'set spqr.borrowedBy = bob']);
    });

    it('another text takes nothing back, nor does an agreement that kept none (mutant: the text not compared)', () => {
        const sync = agreed(anns);
        expect(agreedEvidence(sync, anns.text)).toEqual({ spans: anns.spans, refs: anns.refs });
        expect(agreedEvidence(sync, anns.text + ' ')).toBeNull();
        expect(agreedEvidence({ text: anns.text, model: anns.text }, anns.text)).toBeNull();
    });
});

// ---- R-TXT-44 (1), (2): the names the app gives (P-2026-11-04-1605) --------------------------------------------------

describe('the names the app gives (R-TXT-44 (1), (2))', () => {
    const portBase = (objs: TextObject[], record: SyntaxAnnotations = PORT_CLIKE): EditBase & { readonly text: string } => {
        const grammar = portGrammar(record);
        const p = printTextModel(grammar, objs);
        return { mm: PORT_MM, grammar, objects: objs, spans: p.spans, unprinted: p.unprinted, refs: p.refs, text: p.text };
    };
    // The model after the first application, as measured (names-measure.md): the app named the nameless Port and Ref by
    // their handles, and an empty name slot reads the instance's initial name, so the lookup marks those slots defaulted.
    const named = (): TextObject[] => portObjects().map(o => (o.id === 'p2' ? { ...o, slots: { ...o.slots, name: 'Port_2' } }
        : o.id === 'r2' ? { ...o, slots: { ...o.slots, name: 'Ref_2' } } : o));
    const DEFAULTS = new Map([['p2', new Set(['name'])], ['r2', new Set(['name'])], ['p3', new Set(['name'])]]);

    it('R-TXT-45: a nameless object created from the text is created by its handle, and the same application clears that name (mutant: no clearing line)', () => {
        const { plan } = planEdit(portBase([]), PORT_TEXT_CLIKE, []);
        expect(plan.refusals).toEqual([]);
        const cleared = plan.lines!.flatMap(l => /^set ([A-Za-z_][A-Za-z0-9_]*)\.name = ""$/.exec(l)?.[1] ?? []);
        expect(cleared).toHaveLength(2);
        for (const h of cleared) {
            const at = plan.lines!.findIndex(l => l.startsWith(`create instance of ${h.split('_')[0]} "${h}"`));
            expect(at).toBeGreaterThanOrEqual(0);
            expect(plan.lines![at + 1]).toBe(`set ${h}.name = ""`);
        }
        expect(cleared.some(h => h.startsWith('Port_'))).toBe(true);
        expect(cleared.some(h => h.startsWith('Ref_'))).toBe(true);
        // A named one, and a class whose rule prints no name, are not cleared.
        expect(cleared).not.toContain('instr');
        expect(cleared.some(h => h.startsWith('Bool') || h.startsWith('Word'))).toBe(false);
    });

    it('R-TXT-45: a cleared create is not one the app names, so a typed text differing from the print only in layout is kept (mutant: creates still listed)', () => {
        const { plan } = planEdit(portBase([]), PORT_TEXT_CLIKE + '\n', []);
        // The model after it holds the two objects nameless: its print is the typed text, no reprint, no status sentence.
        const print = portBase(portObjects()).text;
        expect(print).toContain('  input : Bool\n');
        expect(plan.named).toBeUndefined();
        expect(namedReprint(plan, print, PORT_TEXT_CLIKE + '\n')).toBeNull();
    });

    it('after such an application the tab reprints the model\'s print, else it keeps the typed text (mutant: never reprint; always reprint)', () => {
        const print = portBase(named()).text;
        expect(namedReprint({ named: ['Port_2'] }, print, PORT_TEXT_CLIKE)).toBe(print);
        expect(namedReprint({ named: [] }, print, PORT_TEXT_CLIKE)).toBeNull();
        expect(namedReprint({}, print, PORT_TEXT_CLIKE)).toBeNull();
        expect(namedReprint({ named: ['Port_2'] }, print, print)).toBeNull();
    });

    it('the status line says why, in one sentence (mutant: the plain Applied)', () => {
        expect(editStatusText({ kind: 'applied', failed: 0, named: 2 })).toEqual({ text: 'Applied · the app named 2 objects the text leaves nameless', error: false });
        expect(editStatusText({ kind: 'applied', failed: 0, named: 1 }).text).toBe('Applied · the app named 1 object the text leaves nameless');
        expect(editStatusText({ kind: 'applied', failed: 0 }).text).toBe('Applied');
    });

    it('the stuck sequence of P-2026-11-04-1447: on the reprinted text the second edit applies (a width)', () => {
        const base = portBase(named());
        const e = edited(base, [['Word(32)', 'Word(16)']]);
        const { plan } = planEdit(base, e.text, e.spans, { defaults: DEFAULTS }, undefined, e.refs);
        expect(plan.refusals).toEqual([]);
        expect(plan.lines).toHaveLength(1);
        expect(plan.lines![0]).toMatch(/^set Word_\d+\.width = 16$/);
        expect(plan.named ?? []).toEqual([]);
    });

    it.each([['C-like', PORT_CLIKE], ['Pascal/Ada', PORT_PASCAL]] as const)('%s: removing a name applies, a clearing line (mutants: the default skip kept for the name; null written)', (_s, record) => {
        const base = portBase(named(), record);
        const e = edited(base, [['output result ', 'output ']]);
        const { parsed, plan } = planEdit(base, e.text, e.spans, { defaults: DEFAULTS }, undefined, e.refs);
        expect(editDecision(e.text, syncOf(base.text), parsed, plan, false).kind).toBe('apply');
        expect(plan.lines).toEqual(['set result.name = ""']);
        expect(plan.named).toEqual(['result']);
        // A name the slot holds (not read through the initial name) clears the same way; `instr` is also the Ref's name,
        // so the Port's handle is its class's.
        const i = edited(base, [['input instr ', 'input ']]);
        const p2 = planEdit(base, i.text, i.spans, { defaults: DEFAULTS }, undefined, i.refs).plan;
        expect(p2.lines).toHaveLength(1);
        expect(p2.lines![0]).toMatch(/^set Port_\d+\.name = ""$/);
        expect(p2.named).toEqual([p2.lines![0].split(/[ .]/)[1]]);
    });
});

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

import { APPLY_DELAY_MS, appliedSpans, certainSpans, editDecision, editStatusText, onModelPrint, pauseOf, planEdit } from '../ui/TextualTab';
import type { EditBase, TextSync } from '../ui/TextualTab';
import { confirmRows, needsConfirmation } from '../ui/TextConfirmPanel';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { TextMetamodel, TextObject } from '../metamodel';
import { printTextModel } from '../printer';
import type { ObjectSpan } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { planTextEdit } from '../textDiff';
import { matchObjects } from '../textMatch';
import { parseText } from '../parser';

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
    return { mm: MM, grammar, objects: objs, spans: printed.spans, unprinted: printed.unprinted, text: printed.text };
}

/** Monaco's decorations over one edit (`NeverGrowsWhenTypingAtEdges`), as textDiff.test.ts carries them. */
function carry(spans: readonly ObjectSpan[], at: number, removed: number, inserted: number): ObjectSpan[] {
    const delta = inserted - removed;
    return spans.map(s => {
        if (s.end <= at) return s;
        if (s.start >= at + removed) return { ...s, start: s.start + delta, end: s.end + delta };
        const start = s.start <= at ? s.start : at;
        return { ...s, start, end: Math.max(start, s.end + delta) };
    });
}

/** Applies the replacements to the base's text, carrying its spans. */
function edited(base: { readonly text: string; readonly spans: readonly ObjectSpan[] }, replacements: readonly (readonly [string, string])[]) {
    let text = base.text;
    let spans: ObjectSpan[] = [...base.spans];
    for (const [from, to] of replacements) {
        const at = text.indexOf(from);
        expect(at, `"${from}" in the text`).toBeGreaterThanOrEqual(0);
        text = text.slice(0, at) + to + text.slice(at + from.length);
        spans = carry(spans, at, from.length, to.length);
    }
    return { text, spans };
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

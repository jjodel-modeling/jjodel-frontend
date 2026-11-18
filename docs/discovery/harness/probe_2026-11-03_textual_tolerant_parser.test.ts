/**
 * probe_2026-11-03_textual_tolerant_parser (P-2026-11-03-1415, phase 1 of step A): how parser.ts holds up on incomplete
 * text. Corpus: every valid print of the non-hardware cases below, truncated after every token and with every single
 * token deleted. Figures written to .agent-logs/tolerant_probe.json. Not a test: it asserts nothing but that it ran.
 *
 * To run: copy into frontend/src/codegen/textual/__tests__/ as _tmp_tolerant_probe.test.ts, then from frontend/
 *   node scripts/run-quiet.mjs probe -- npx vitest run src/codegen/textual/__tests__/_tmp_tolerant_probe.test.ts
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type { ElementIds, SyntaxAnnotations } from '../annotations';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextMetamodel, TextObject } from '../metamodel';
import { parseText } from '../parser';
import type { TextParseResult } from '../parser';
import { printTextModel } from '../printer';
import { textualNotation } from '../syntaxRecord';
import { GARAGE, grammarOf, LOWER } from './corpus';
import { objectsOf } from './spec';

// ---- Library (textDiff.test.ts), three annotated forms and plain -------------------------------------------------

const LIBRARY_MM: TextMetamodel = {
    classes: [
        { name: 'Library', attributes: [{ name: 'name', type: 'EString' }], references: [{ name: 'books', type: 'Book', containment: true, many: true }, { name: 'members', type: 'Member', containment: true, many: true }] },
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
const SUBSETS = { E_Genre: { subsets: [{ name: 'prose', literals: ['FICTION', 'HISTORY'] }, { name: 'verse', literals: ['POETRY'] }, { name: 'nonfiction', literals: ['SCIENCE'] }] } };
const LIBRARY_RECORD: SyntaxAnnotations = { v: 1, language: 'Shelf', features: { R_Lib_members: { keyword: 'patrons' }, A_Book_genre: { keyword: '' }, R_Lib_books: { groupBy: 'A_Book_genre' } }, enums: SUBSETS };
// The forms annotations.test.ts uses on Core/Arbiter (line layout, a name keyword, a renamed class keyword), here on the library.
const LIBRARY_LINES: SyntaxAnnotations = {
    v: 1,
    classes: { C_Lib: { keyword: 'shelf' }, C_Book: { layout: 'line', name: { keyword: 'titled' } }, C_Mem: { layout: 'line' } },
    features: { A_Book_genre: { keyword: '' }, R_Book_borrowedBy: { keyword: 'by' } },
};

function libraryObjects(books = 4, members = 2): TextObject[] {
    const genres = ['FICTION', 'SCIENCE', 'POETRY', 'HISTORY'];
    const ms = Array.from({ length: members }, (_, i) => ({ id: `m${i}`, cls: 'Member', slots: { name: `reader${i}` } }));
    const bs = Array.from({ length: books }, (_, i) => ({
        id: `b${i}`, cls: 'Book',
        slots: { name: `book${i}`, genre: genres[i % 4], year: i % 2 ? 1900 + (i % 120) : null, borrowedBy: i % 3 === 1 && members ? `m${i % members}` : null },
    }));
    return [{ id: 'lib', cls: 'Library', slots: { name: 'city', books: bs.map(b => b.id), members: ms.map(m => m.id) } }, ...ms, ...bs];
}

// ---- Turnstile (codegen/examples/turnstile), as textDiff.test.ts reads it --------------------------------------

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
const TS = fromLookup(TURNSTILE.lookup);
const TURNSTILE_RECORD: SyntaxAnnotations = { v: 1, features: { F_State_transitions: { inline: true }, F_Transition_nextState: { keyword: 'to' }, F_Transition_event: { keyword: '' } } };

const notation = (mm: TextMetamodel, record: SyntaxAnnotations | null, ids: ElementIds): { g: ConcreteGrammar; issues: string[] } => {
    const n = textualNotation(mm, { record, issues: [] }, ids);
    return { g: n.grammar, issues: n.issues.map(i => `${i.level} ${i.where}: ${i.message}`) };
};

// ---- The tokens of a C-like print, as parser.ts tokenizes them -------------------------------------------------

interface Tok { readonly start: number; readonly end: number; readonly line: number }
function tokens(text: string): Tok[] {
    const out: Tok[] = [];
    const re = /[A-Za-z_][A-Za-z0-9_]*|-?\d+(\.\d+)?([eE][+-]?\d+)?|"(?:[^"\\\n]|\\.)*"|\{\}|[^\s]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
        let line = 1;
        for (let j = 0; j < m.index; j++) if (text[j] === '\n') line++;
        out.push({ start: m.index, end: m.index + m[0].length, line });
    }
    return out;
}
const lineOf = (text: string, at: number): number => { let l = 1; for (let j = 0; j < at && j < text.length; j++) if (text[j] === '\n') l++; return l; };

// ---- Measures ---------------------------------------------------------------------------------------------------

interface Span { id: string; cls: string; start: number; end: number; attrs: string }
const attrsOf = (g: ConcreteGrammar, o: TextObject): string =>
    JSON.stringify((g.objects[o.cls]?.features ?? []).filter(f => f.kind === 'attribute').map(f => [f.name, o.slots[f.name] ?? null]));
const spansOf = (g: ConcreteGrammar, objs: readonly TextObject[], spans: readonly { id: string; start: number; end: number }[]): Span[] => {
    const byId = new Map(objs.map(o => [o.id, o]));
    return spans.map(s => ({ ...s, cls: byId.get(s.id)!.cls, attrs: attrsOf(g, byId.get(s.id)!) }));
};

interface Mutant {
    kind: 'trunc' | 'delete';
    at: number; // the fault: the end of the prefix, or the offset of the deleted token
    errors: number;
    threw: boolean;
    ms: number;
    // objects wholly outside the fault: count, span exact, span exact and not recovered, attributes equal
    outside: number; spanKept: number; intact: number; attrsKept: number;
    // objects that start after the fault (deletions): count, of them kept with their span
    after: number; afterKept: number;
    // the object around the fault: present with its class and start
    around: number; aroundKept: number;
    firstErrTok?: number; firstErrLines?: number; nearestErrTok?: number;
    objects: number; recovered: number;
    tok?: string; firstMsg?: string;
}

function measure(name: string, g: ConcreteGrammar, objs: readonly TextObject[]) {
    const printed = printTextModel(g, objs);
    const text = printed.text;
    const base = parseText(text, g);
    const orig = spansOf(g, base.objects, base.spans);
    const toks = tokens(text);
    const mutants: Mutant[] = [];

    const run = (kind: Mutant['kind'], at: number, removed: number, mtext: string): void => {
        const t0 = performance.now();
        let r: TextParseResult | undefined;
        let threw = false;
        try { r = parseText(mtext, g); } catch { threw = true; }
        const ms = performance.now() - t0;
        const m: Mutant = { kind, at, errors: r?.errors.length ?? -1, threw, ms, outside: 0, spanKept: 0, intact: 0, attrsKept: 0, after: 0, afterKept: 0, around: 0, aroundKept: 0, objects: r?.objects.length ?? 0, recovered: r?.recovered.length ?? 0, tok: kind === 'delete' ? text.slice(at, at + removed) : text.slice(Math.max(0, at - 12), at), firstMsg: r?.errors[0]?.message };
        if (r) {
            const got = spansOf(g, r.objects, r.spans);
            const rec = new Set(r.recovered);
            const key = (cls: string, s: number, e: number): string => `${cls}:${s}:${e}`;
            const byKey = new Map(got.map(s => [key(s.cls, s.start, s.end), s]));
            const byStart = new Map(got.map(s => [`${s.cls}:${s.start}`, s]));
            for (const o of orig) {
                const end = kind === 'trunc' ? at : at + removed;
                const before = o.end <= at;
                const beyond = o.start >= end;
                if (kind === 'trunc' && beyond) continue;
                if (before || beyond) {
                    const d = beyond ? -removed : 0;
                    m.outside++;
                    const hitSpan = byKey.get(key(o.cls, o.start + d, o.end + d));
                    if (hitSpan) { m.spanKept++; if (!rec.has(hitSpan.id)) m.intact++; if (hitSpan.attrs === o.attrs) m.attrsKept++; }
                    if (beyond) { m.after++; if (hitSpan) m.afterKept++; }
                } else {
                    m.around++;
                    if (byStart.has(`${o.cls}:${o.start}`)) m.aroundKept++;
                }
            }
            if (r.errors.length) {
                const mt = tokens(mtext);
                const idx = (off: number): number => { const i = mt.findIndex(t => t.start >= off); return i < 0 ? mt.length : i; };
                const f = r.errors[0];
                m.firstErrTok = idx(f.start) - idx(at);
                m.firstErrLines = f.line - lineOf(mtext, at);
                const nearest = r.errors.find(e => e.start >= at) ?? r.errors[r.errors.length - 1];
                m.nearestErrTok = idx(nearest.start) - idx(at);
            }
        }
        mutants.push(m);
    };

    for (const t of toks) run('trunc', t.end, 0, text.slice(0, t.end));
    for (const t of toks) run('delete', t.start, t.end - t.start, text.slice(0, t.start) + text.slice(t.end));
    return { name, tokens: toks.length, objects: orig.length, baseErrors: base.errors.length, chars: text.length, mutants };
}

// ---- Summary ----------------------------------------------------------------------------------------------------

const pct = (a: number, b: number): string => (b ? `${((100 * a) / b).toFixed(1)}%` : 'n/a');
const hist = (xs: number[]): Record<string, number> => {
    const h: Record<string, number> = { '<0': 0, '0': 0, '1': 0, '2-5': 0, '6-20': 0, '>20': 0 };
    for (const x of xs) h[x < 0 ? '<0' : x === 0 ? '0' : x === 1 ? '1' : x <= 5 ? '2-5' : x <= 20 ? '6-20' : '>20']++;
    return h;
};
function summary(c: ReturnType<typeof measure>) {
    const out: Record<string, unknown> = { name: c.name, tokens: c.tokens, objects: c.objects, chars: c.chars, baseErrors: c.baseErrors };
    for (const kind of ['trunc', 'delete'] as const) {
        const ms = c.mutants.filter(m => m.kind === kind);
        const broken = ms.filter(m => m.errors > 0);
        const sum = (f: (m: Mutant) => number): number => ms.reduce((a, m) => a + f(m), 0);
        const withAfter = broken.filter(m => m.after > 0);
        out[kind] = {
            mutants: ms.length,
            threw: ms.filter(m => m.threw).length,
            accepted: ms.filter(m => m.errors === 0).length,
            errorsPerBroken: { one: broken.filter(m => m.errors === 1).length, two: broken.filter(m => m.errors === 2).length, more: broken.filter(m => m.errors > 2).length, max: Math.max(0, ...broken.map(m => m.errors)) },
            outsideSpanKept: pct(sum(m => m.spanKept), sum(m => m.outside)),
            outsideIntact: pct(sum(m => m.intact), sum(m => m.outside)),
            outsideAttrsKept: pct(sum(m => m.attrsKept), sum(m => m.outside)),
            afterKept: pct(sum(m => m.afterKept), sum(m => m.after)),
            stoppedAtFirstError: `${withAfter.filter(m => m.afterKept === 0).length}/${withAfter.length}`,
            lostSomeAfter: `${withAfter.filter(m => m.afterKept < m.after).length}/${withAfter.length}`,
            aroundKept: pct(sum(m => m.aroundKept), sum(m => m.around)),
            firstErrTok: hist(broken.map(m => m.firstErrTok!)),
            nearestErrTok: hist(broken.map(m => m.nearestErrTok!)),
            firstErrLines: hist(broken.map(m => Math.abs(m.firstErrLines!))),
            maxMs: Math.max(...ms.map(m => m.ms)).toFixed(2),
        };
    }
    // The worst deletions, for the report.
    out.worstDeletes = c.mutants.filter(m => m.kind === 'delete' && m.after > 0).sort((a, b) => a.afterKept / a.after - b.afterKept / b.after).slice(0, 3)
        .map(m => ({ at: m.at, tok: m.tok, errors: m.errors, after: m.after, afterKept: m.afterKept, msg: m.firstMsg }));
    out.accepted = c.mutants.filter(m => m.kind === 'delete' && m.errors === 0).map(m => m.tok);
    out.stopped = c.mutants.filter(m => m.kind === 'delete' && m.after > 0 && m.afterKept === 0).map(m => `${m.at}:${m.tok}`);
    out.lostSome = c.mutants.filter(m => m.kind === 'delete' && m.after > 0 && m.afterKept < m.after).map(m => `${m.tok}(${m.after - m.afterKept})`);
    out.farErrors = c.mutants.filter(m => m.errors > 0 && (m.firstErrTok! < 0 || m.firstErrTok! > 5)).filter(m => m.kind === 'delete').slice(0, 12).map(m => ({ at: m.at, tok: m.tok, firstErrTok: m.firstErrTok, nearestErrTok: m.nearestErrTok, msg: m.firstMsg }));
    out.truncFirstMsgs = [...new Set(c.mutants.filter(m => m.kind === 'trunc' && (m.firstErrTok ?? 0) < 0).map(m => (m.firstMsg ?? '').replace(/"[^"]*"/g, 'X')))].slice(0, 5);
    return out;
}

describe('tolerant parser probe', () => {
    it('measures', () => {
        const report: Record<string, unknown> = {};
        const lib = (r: SyntaxAnnotations | null) => notation(LIBRARY_MM, r, LIBRARY_IDS);
        const forms = {
            'library, plain': lib(null),
            'library, annotated (patrons, genre positional, groupBy)': lib(LIBRARY_RECORD),
            'library, lines (class keyword, line layout, name keyword, by)': lib(LIBRARY_LINES),
            'turnstile, plain': notation(TS.mm, null, TS.ids),
            'turnstile, annotated (inline, to, event positional)': notation(TS.mm, TURNSTILE_RECORD, TS.ids),
        };
        report.issues = Object.fromEntries(Object.entries(forms).map(([k, v]) => [k, v.issues]));
        const cases: [string, ConcreteGrammar, readonly TextObject[]][] = [
            ...Object.entries(forms).map(([k, v]) => [k, v.g, k.startsWith('library') ? libraryObjects(6, 3) : TS.objects] as [string, ConcreteGrammar, readonly TextObject[]]),
            ['garage, c-like', grammarOf(GARAGE), objectsOf(GARAGE)],
            ['garage, lower', grammarOf(GARAGE, LOWER), objectsOf(GARAGE)],
        ];
        report.samples = Object.fromEntries(cases.map(([k, g, o]) => [k, printTextModel(g, o).text.split('\n').slice(0, 14).join('\n')]));
        report.cases = cases.map(([k, g, o]) => summary(measure(k, g, o)));

        // Time on a large text, valid and broken, per form of the library.
        const timing: Record<string, unknown>[] = [];
        for (const [k, f] of Object.entries(forms).filter(([k]) => k.startsWith('library'))) {
            for (const [n, norefs] of [[1000, false], [5000, false], [20000, false], [5000, true], [20000, true]] as const) {
                const objs = libraryObjects(n, Math.max(1, n / 5)).map(o => (norefs && o.cls === 'Book' ? { ...o, slots: { ...o.slots, borrowedBy: null } } : o));
                const text = printTextModel(f.g, objs).text;
                const mid = text.indexOf('\n', text.length >> 1) + 1;
                const toks = tokens(text.slice(mid, mid + 200));
                const del = mid + toks[0].start;
                const variants: Record<string, string> = {
                    valid: text,
                    deleteOne: text.slice(0, del) + text.slice(del + (toks[0].end - toks[0].start)),
                    truncHalf: text.slice(0, mid + toks[1].end),
                };
                const row: Record<string, unknown> = { form: k.slice(0, 18), norefs, objects: objs.length, chars: text.length, lines: text.split('\n').length };
                for (const [v, t] of Object.entries(variants)) {
                    const times: number[] = [];
                    let errs = 0;
                    for (let i = 0; i < 5; i++) { const t0 = performance.now(); const r = parseText(t, f.g); times.push(performance.now() - t0); errs = r.errors.length; }
                    times.sort((a, b) => a - b);
                    row[v] = `${times[2].toFixed(1)} ms (${errs} err)`;
                }
                const t0 = performance.now();
                printTextModel(f.g, objs);
                row.print = `${(performance.now() - t0).toFixed(1)} ms`;
                timing.push(row);
            }
        }
        report.timing = timing;

        // Comments: what the result keeps of them.
        const g = forms['library, plain'].g;
        const plain = printTextModel(g, libraryObjects(2, 1)).text;
        const commented = `// header\n${plain.replace('\n', ' // trailing\n')}`.replace(/\n\}\s*$/, '\n  /* before close */\n}\n');
        const rc = parseText(commented, g);
        report.comments = { text: commented, errors: rc.errors.length, resultKeys: Object.keys(rc), anyCommentInResult: JSON.stringify(rc).includes('header') };

        writeFileSync(new URL('../../../../../.agent-logs/tolerant_probe.json', import.meta.url), JSON.stringify(report, null, 1));
        expect(report.cases).toBeDefined();
    }, 600_000);
});

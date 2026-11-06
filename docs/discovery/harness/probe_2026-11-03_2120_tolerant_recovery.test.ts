/**
 * probe_2026-11-03_2120_tolerant_recovery (P-2026-11-03-2120, step A parser half): the tables F2, F3 and F4 of
 * docs/discovery/discovery_2026-11-03_textual_tolerant_parser.md, measured the same way as
 * probe_2026-11-03_textual_tolerant_parser.test.ts, on the corpus of __tests__/tolerantCorpus.ts, plus the share of
 * objects that are not partial (state of their tree node; without a tree, not recovered) and the parse time of the
 * plain library at 1,000 and 6,000 objects. Figures written to .agent-logs/tolerant_probe_2120_<LABEL>.json.
 * Not a test: it asserts nothing but that it ran. It runs on a parser without a tree too (the "before" run).
 *
 * To run: copy into frontend/src/codegen/textual/__tests__/ as _tmp_tolerant_recovery.test.ts, then from frontend/
 *   PROBE_LABEL=after node scripts/run-quiet.mjs probe -- npx vitest run src/codegen/textual/__tests__/_tmp_tolerant_recovery.test.ts
 */

import { writeFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import type { ConcreteGrammar } from '../concreteGrammar';
import type { TextObject } from '../metamodel';
import { parseText } from '../parser';
import type { TextParseResult } from '../parser';
import { printTextModel } from '../printer';
import { libraryObjects, mutantsOf, probeTokens, tolerantCases } from './tolerantCorpus';
import type { TolerantCase } from './tolerantCorpus';

const lineOf = (text: string, at: number): number => { let l = 1; for (let j = 0; j < at && j < text.length; j++) if (text[j] === '\n') l++; return l; };

/** The ids of the partial objects: from the tree when there is one, else every recovered id. */
function partialOf(r: TextParseResult): Set<string> {
    const tree = (r as { tree?: { children: unknown[] } }).tree;
    if (!tree) return new Set(r.recovered);
    const out = new Set<string>();
    const walk = (n: any): void => {
        if (n.kind === 'object' && n.state === 'partial') out.add(n.id);
        for (const c of n.children ?? []) if (c.kind !== 'token') walk(c);
    };
    walk(tree);
    return out;
}

interface M {
    kind: 'trunc' | 'delete'; errors: number; syntax: number; threw: boolean;
    outside: number; spanKept: number; intact: number; notPartial: number; after: number; afterKept: number;
    firstErrTok?: number; nearestErrTok?: number;
}

function measure(c: TolerantCase) {
    const { text, mutants } = mutantsOf(c);
    const base = parseText(text, c.g);
    const cls = new Map(base.objects.map(o => [o.id, o.cls]));
    const orig = base.spans.map(s => ({ ...s, cls: cls.get(s.id)! }));
    const out: M[] = [];
    for (const mu of mutants) {
        let r: TextParseResult | undefined;
        let threw = false;
        try { r = parseText(mu.text, c.g); } catch { threw = true; }
        const m: M = { kind: mu.kind, errors: r?.errors.length ?? -1, syntax: r ? r.errors.filter(e => !(e as { secondary?: boolean }).secondary).length : -1, threw, outside: 0, spanKept: 0, intact: 0, notPartial: 0, after: 0, afterKept: 0 };
        if (r) {
            const rcls = new Map(r.objects.map(o => [o.id, o.cls]));
            const byKey = new Map(r.spans.map(s => [`${rcls.get(s.id)}:${s.start}:${s.end}`, s.id]));
            const rec = new Set(r.recovered);
            const partial = partialOf(r);
            const end = mu.kind === 'trunc' ? mu.at : mu.at + mu.removed;
            for (const o of orig) {
                const before = o.end <= mu.at;
                const beyond = o.start >= end;
                if (mu.kind === 'trunc' && beyond) continue;
                if (!before && !beyond) continue;
                const d = beyond ? -mu.removed : 0;
                m.outside++;
                const id = byKey.get(`${o.cls}:${o.start + d}:${o.end + d}`);
                if (id) { m.spanKept++; if (!rec.has(id)) m.intact++; if (!partial.has(id)) m.notPartial++; }
                if (beyond) { m.after++; if (id) m.afterKept++; }
            }
            if (r.errors.length) {
                const mt = probeTokens(mu.text);
                const idx = (off: number): number => { const i = mt.findIndex(t => t.start >= off); return i < 0 ? mt.length : i; };
                m.firstErrTok = idx(r.errors[0].start) - idx(mu.at);
                const nearest = r.errors.find(e => e.start >= mu.at) ?? r.errors[r.errors.length - 1];
                m.nearestErrTok = idx(nearest.start) - idx(mu.at);
            }
        }
        out.push(m);
    }
    return { name: c.name, tokens: mutants.length / 2, objects: orig.length, mutants: out };
}

const pct = (a: number, b: number): string => (b ? `${((100 * a) / b).toFixed(1)}%` : 'n/a');
function summary(c: ReturnType<typeof measure>) {
    const res: Record<string, unknown> = { name: c.name, tokens: c.tokens, objects: c.objects };
    for (const kind of ['trunc', 'delete'] as const) {
        const ms = c.mutants.filter(m => m.kind === kind);
        const broken = ms.filter(m => m.errors > 0);
        const sum = (f: (m: M) => number): number => ms.reduce((a, m) => a + f(m), 0);
        const withAfter = broken.filter(m => m.after > 0);
        const near = broken.map(m => m.nearestErrTok!);
        res[kind] = {
            broken: `${broken.length}/${ms.length}`, threw: ms.filter(m => m.threw).length,
            outsideSpanKept: pct(sum(m => m.spanKept), sum(m => m.outside)),
            outsideIntact: pct(sum(m => m.intact), sum(m => m.outside)),
            outsideNotPartial: pct(sum(m => m.notPartial), sum(m => m.outside)),
            afterKept: pct(sum(m => m.afterKept), sum(m => m.after)),
            stopped: `${withAfter.filter(m => m.afterKept === 0).length}/${withAfter.length}`,
            lostSomeAfter: `${withAfter.filter(m => m.afterKept < m.after).length}/${withAfter.length}`,
            errorsPerBroken: `${broken.filter(m => m.errors === 1).length} / ${broken.filter(m => m.errors === 2).length} / ${broken.filter(m => m.errors > 2).length}, max ${Math.max(0, ...broken.map(m => m.errors))}`,
            syntaxPerBroken: `${broken.filter(m => m.syntax === 1).length} / ${broken.filter(m => m.syntax === 2).length} / ${broken.filter(m => m.syntax > 2).length}, max ${Math.max(0, ...broken.map(m => m.syntax))}`,
            nearest: `${near.filter(x => x === 0).length} / ${near.filter(x => x === 1).length} / ${near.filter(x => x >= 2 && x <= 5).length} / ${near.filter(x => x > 5).length} / ${near.filter(x => x < 0).length}`,
            firstBefore: `${broken.filter(m => m.firstErrTok! < 0).length} of ${broken.length}`,
        };
    }
    return res;
}

describe('tolerant recovery probe', () => {
    it('measures', () => {
        const report: Record<string, unknown> = { label: process.env.PROBE_LABEL ?? 'run' };
        report.cases = tolerantCases().map(c => summary(measure(c)));
        const g: ConcreteGrammar = tolerantCases()[0].g;
        const timing: Record<string, string>[] = [];
        for (const n of [1000, 5000]) {
            const objs: TextObject[] = libraryObjects(n, n / 5);
            const text = printTextModel(g, objs).text;
            const mid = text.indexOf('\n', text.length >> 1) + 1;
            const t0 = probeTokens(text.slice(mid, mid + 200));
            const variants: Record<string, string> = { valid: text, deleteOne: text.slice(0, mid + t0[0].start) + text.slice(mid + t0[0].end), truncHalf: text.slice(0, mid + t0[1].end) };
            const row: Record<string, string> = { objects: String(objs.length), chars: String(text.length), lines: String(lineOf(text, text.length)) };
            for (const [v, t] of Object.entries(variants)) {
                const times: number[] = [];
                let errs = 0;
                for (let i = 0; i < 5; i++) { const s = performance.now(); errs = parseText(t, g).errors.length; times.push(performance.now() - s); }
                times.sort((a, b) => a - b);
                row[v] = `${times[2].toFixed(1)} ms (${errs} err)`;
            }
            timing.push(row);
        }
        report.timing = timing;
        writeFileSync(new URL(`../../../../../.agent-logs/tolerant_probe_2120_${report.label}.json`, import.meta.url), JSON.stringify(report, null, 1));
        expect(report.cases).toBeDefined();
    }, 600_000);
});

/**
 * Probe of P-2026-11-03-2300 phase 1 (step B discovery): what a language service derived from the tree costs per parse,
 * on the library corpus (books : members = 5 : 1), at 1,201 and 6,001 objects. A prototype of the derivations, not the
 * service: token classification encoded as Monaco semantic tokens, the symbol tree, folding ranges, the reference index,
 * the offset index; and displayMatch (R-TXT-36 (5)) on a valid and a broken text. Median of 5, after one warm-up.
 */
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { parseText } from '../parser';
import type { SyntaxElement, SyntaxNode, SyntaxToken, TextNode } from '../parser';
import { printTextModel } from '../printer';
import { displayMatch } from '../textMatch';
import { textualNotation } from '../syntaxRecord';
import { LIBRARY_IDS, LIBRARY_MM, libraryObjects } from './tolerantCorpus';

const g = textualNotation(LIBRARY_MM, { record: null, issues: [] }, LIBRARY_IDS).grammar;
const median = (xs: number[]): number => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const time = (fn: () => unknown): number => { fn(); const xs: number[] = []; for (let i = 0; i < 5; i++) { const t = performance.now(); fn(); xs.push(performance.now() - t); } return +median(xs).toFixed(2); };

function derive(text: string, tree: TextNode) {
    // Line starts once, for the encoding (Monaco wants line and column deltas).
    const lineStarts = [0];
    for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lineStarts.push(i + 1);
    const lineOf = (off: number): number => { let lo = 0, hi = lineStarts.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (lineStarts[m] <= off) lo = m; else hi = m - 1; } return lo; };
    const ROLE: Record<string, number> = { class: 0, keyword: 1, name: 2, value: 3, literal: 4, reference: 5, punctuation: 6 };
    const data: number[] = [];
    let pl = 0, pc = 0;
    const symbols: { id: string; start: number; end: number; children: unknown[] }[] = [];
    const folds: [number, number][] = [];
    const refsTo = new Map<string, number[]>();
    const objects: SyntaxNode[] = [];
    const walk = (n: SyntaxNode, into: unknown[]): void => {
        let here = into;
        if (n.kind === 'object') { const s = { id: n.id, start: n.start, end: n.end, children: [] as unknown[] }; into.push(s); here = s.children; objects.push(n); }
        if (n.kind === 'block' && n.end > n.start) { const a = lineOf(n.start), b = lineOf(n.end); if (b > a) folds.push([a, b]); }
        if (n.kind === 'ref' && n.ref && typeof n.ref.to === 'string') { const l = refsTo.get(n.ref.to); if (l) l.push(n.start); else refsTo.set(n.ref.to, [n.start]); }
        for (const c of n.children as readonly SyntaxElement[]) {
            if (c.kind !== 'token') { walk(c, here); continue; }
            const t = c as SyntaxToken;
            if (!t.role || t.role === 'punctuation') continue;
            const l = lineOf(t.start), col = t.start - lineStarts[l];
            data.push(l - pl, l === pl ? col - pc : col, t.end - t.start, ROLE[t.role], 0);
            pl = l; pc = col;
        }
    };
    walk(tree, symbols);
    return { tokens: new Uint32Array(data), symbols, folds, refsTo, objects };
}

describe('probe: language service cost (P-2026-11-03-2300)', () => {
    it('measures', () => {
        const rows: unknown[] = [];
        for (const [books, members] of [[1000, 200], [5000, 1000]]) {
            const objects = libraryObjects(books, members);
            const printed = printTextModel(g, objects);
            const text = printed.text;
            const parsed = parseText(text, g);
            const d = derive(text, parsed.tree!);
            const mid = text.indexOf('{', Math.floor(text.length / 2));
            const broken = text.slice(0, mid) + text.slice(mid + 1);
            const parsedBroken = parseText(broken, g);
            const at = Math.floor(text.length * 0.7);
            const byOffset = d.objects; // text order: the innermost at an offset by a scan from the end of the candidates
            rows.push({
                objects: objects.length, chars: text.length, tokens: parsed.tree!.tokens.length,
                semanticTokens: d.tokens.length / 5, symbols: d.objects.length, folds: d.folds.length, refTargets: d.refsTo.size,
                parseMs: time(() => parseText(text, g)),
                deriveMs: time(() => derive(text, parsed.tree!)),
                pathAtOffsetMs: time(() => byOffset.filter(n => n.start <= at && at <= n.end)),
                displayMatchValidMs: time(() => displayMatch({ mm: LIBRARY_MM, grammar: g, model: objects, parsed, previous: printed.spans })),
                parseBrokenMs: time(() => parseText(broken, g)),
                displayMatchBrokenMs: time(() => displayMatch({ mm: LIBRARY_MM, grammar: g, model: objects, parsed: parsedBroken, previous: printed.spans })),
                displayMatchBrokenNoSpansMs: time(() => displayMatch({ mm: LIBRARY_MM, grammar: g, model: objects, parsed: parsedBroken })),
                brokenErrors: parsedBroken.errors.length, brokenOrphans: displayMatch({ mm: LIBRARY_MM, grammar: g, model: objects, parsed: parsedBroken, previous: printed.spans }).orphans.length,
            });
        }
        writeFileSync(process.env.PROBE_OUT ?? '/tmp/probe_langservice.json', JSON.stringify(rows, null, 1));
    }, 600_000);
});

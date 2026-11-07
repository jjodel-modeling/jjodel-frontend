/**
 * Step T10 of the textual notation (P-2026-11-07-0048; R-TXT-20, R-TXT-54 E10;
 * docs/discovery/discovery_2026-11-06_textual_e_sync.md §3.3): a diagram edit changes the model, and the text the user
 * typed is reprinted only where the objects changed. Pure: no editor and no store; the Text tab wires it (lane E1b).
 *
 * The unit is the object's own text: its span with its children cut out. Each child is cut as its slot, the child's
 * span with the trivia of its first token (whitespace and comments up to the previous line end) and of its last token
 * (up to the end of its line), so that the comments of a child travel with it. Per object, top down from the roots of
 * the new print:
 *
 * 1. Its own text prints the same in the old and the new print: its typed own text is kept, comments and layout
 *    included, and its children are recursed into in the new print's order.
 * 2. Its own text prints differently (an attribute, a name, a reference token): it is taken from the new print, its
 *    children still recursed into, and the comments the typed text holds in its own text are put back by owner:
 *    own-line ones before its first token, trailing ones at the end of its head line (D5, report §6.2).
 * 3. An object new to the print is taken from it, in its place among its typed siblings.
 * 4. An object gone from the print is cut with its slot: its leading comments and its trailing comment go with it.
 * 5. A rename changes the referrers' own text (rule 2); a move carries the typed text to the new container.
 *
 * Whenever it cannot splice safely it returns null, and the caller reprints the whole text as before: an object of the
 * old print without a carried span, spans that do not nest on tokens, a text in another comment syntax, or a result
 * that does not read back as the new print (print-parse equality).
 */

import type { ConcreteGrammar } from './concreteGrammar';
import { commentsOf, isApplicableParse, parseText, tokenizeText } from './parser';
import type { SyntaxToken, TreeComment } from './parser';
import { printTextModel } from './printer';
import type { ObjectSpan, RefSpan, TextPrintResult } from './printer';

/** A text with the spans of its objects and its reference tokens, by model id: a print, or the typed text as carried. */
export type PrintedText = TextPrintResult;

export interface ReprintInput {
    /** The grammar of the new print. */
    readonly grammar: ConcreteGrammar;
    /** The grammar the typed text and the old print were written in, when the style changed; else `grammar`. */
    readonly previous?: ConcreteGrammar;
    /** The agreed text as typed, with the spans and reference tokens the editor carried, by model id. */
    readonly typed: PrintedText;
    /** The print the typed text was agreed against. */
    readonly old: PrintedText;
    /** The print of the changed model. */
    readonly next: PrintedText;
}

export interface ReprintResult {
    readonly text: string;
    /** In text order, as the printer sorts them: the new print's objects. */
    readonly spans: readonly ObjectSpan[];
    /** The reference tokens of the result, each with the new print's target. */
    readonly refs: readonly RefSpan[];
}

interface Node {
    readonly id: string;
    readonly start: number;
    readonly end: number;
    readonly parent: string | null;
    readonly children: string[];
}

/** A text read for the splice: its tokens, and its objects as the tree their spans nest into. */
interface Layout {
    readonly text: string;
    readonly tokens: readonly SyntaxToken[];
    readonly startAt: ReadonlyMap<number, SyntaxToken>;
    readonly endAt: ReadonlyMap<number, SyntaxToken>;
    readonly nodes: ReadonlyMap<string, Node>;
    readonly roots: readonly string[];
}

/** An object's text between its children: `segs` around `runs`, a run being children with no own token between them. */
interface Shape {
    readonly segs: readonly (readonly [number, number])[];
    readonly runs: readonly (readonly string[])[];
}

/** The layout of a text, or null when its spans do not nest, or do not start and end on its tokens. */
function layoutOf(p: PrintedText, g: ConcreteGrammar): Layout | null {
    const { tokens } = tokenizeText(p.text, g);
    const startAt = new Map(tokens.map(t => [t.start, t]));
    const endAt = new Map(tokens.map(t => [t.end, t]));
    // An object that prints no token has no text to keep; the result's parse settles it.
    const spans = p.spans.filter(s => s.end > s.start).sort((a, b) => a.start - b.start || b.end - a.end);
    const nodes = new Map<string, Node>();
    const roots: string[] = [];
    const stack: Node[] = [];
    for (const s of spans) {
        if (nodes.has(s.id) || !startAt.has(s.start) || !endAt.has(s.end)) return null;
        while (stack.length && stack[stack.length - 1].end <= s.start) stack.pop();
        const top = stack[stack.length - 1];
        // Crossing spans, or two objects on one range: which one contains the other is not in the spans.
        if (top && (s.end > top.end || (s.start === top.start && s.end === top.end))) return null;
        const n: Node = { id: s.id, start: s.start, end: s.end, parent: top?.id ?? null, children: [] };
        if (top) top.children.push(s.id); else roots.push(s.id);
        nodes.set(s.id, n);
        stack.push(n);
    }
    return { text: p.text, tokens, startAt, endAt, nodes, roots };
}

/** The slot of `id`: its span with its leading and trailing trivia, unless it shares that token with its container. */
function slotOf(l: Layout, id: string): readonly [number, number] {
    const n = l.nodes.get(id)!;
    const parent = n.parent === null ? null : l.nodes.get(n.parent)!;
    const start = !parent || n.start > parent.start ? n.start - l.startAt.get(n.start)!.leading.length : n.start;
    const end = !parent || n.end < parent.end ? n.end + l.endAt.get(n.end)!.trailing.length : n.end;
    return [start, end];
}

/** The shape of `[lo, hi)` around `children`: an object's span, or the whole text around its roots. */
function shapeOver(l: Layout, lo: number, hi: number, children: readonly string[]): Shape {
    const segs: [number, number][] = [];
    const runs: string[][] = [];
    let at = lo;
    let run: string[] = [];
    for (const c of children) {
        const [s, e] = slotOf(l, c);
        if (run.length && s === at) run.push(c);
        else {
            if (run.length) runs.push(run);
            segs.push([at, s]);
            run = [c];
        }
        at = e;
    }
    if (run.length) runs.push(run);
    segs.push([at, hi]);
    return { segs, runs };
}

function shapeOf(l: Layout, id: string): Shape {
    const n = l.nodes.get(id)!;
    return shapeOver(l, n.start, n.end, n.children);
}

/** The tokens of `[from, to)`. */
function tokensIn(l: Layout, from: number, to: number): SyntaxToken[] {
    let lo = 0;
    let hi = l.tokens.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (l.tokens[mid].start < from) lo = mid + 1; else hi = mid;
    }
    const out: SyntaxToken[] = [];
    for (let i = lo; i < l.tokens.length && l.tokens[i].end <= to; i++) if (l.tokens[i].k !== 'EOF') out.push(l.tokens[i]);
    return out;
}

/** The own text of `id`, as its tokens, a run of children standing as one mark: what rule 1 compares. */
function ownKey(l: Layout, shape: Shape): string {
    return shape.segs.map(([a, b]) => tokensIn(l, a, b).map(t => t.raw).join(' ')).join('\u0000');
}

/** The splice, or null when it cannot be made safely (the caller then reprints the whole text). */
export function reprintChanged(input: ReprintInput): ReprintResult | null {
    const { grammar: g, typed, old, next } = input;
    const before = input.previous ?? g;
    if (typed.text === old.text) return { text: next.text, spans: next.spans, refs: next.refs ?? [] };
    if (JSON.stringify(before.style.comments) !== JSON.stringify(g.style.comments)) return null;
    const T = layoutOf(typed, before);
    const O = layoutOf(old, before);
    const N = layoutOf(next, g);
    if (!T || !O || !N) return null;
    // The typed text is the old print as typed: the same objects, each with its carried span.
    if (T.nodes.size !== O.nodes.size || [...O.nodes.keys()].some(id => !T.nodes.has(id))) return null;
    // The roots stand in one run: nothing but trivia between them.
    const outer = shapeOver(T, 0, T.text.length, T.roots);
    if (outer.runs.length > 1) return null;

    // The comments of the typed text, read once, when an object of it is reprinted (rule 2).
    let comments: TreeComment[] | null = null;
    const typedComments = (): TreeComment[] | null => {
        if (comments) return comments;
        const tree = parseText(typed.text, before).tree;
        return (comments = tree ? commentsOf(tree, before) : null);
    };

    let text = '';
    let last: { readonly l: Layout; readonly at: number } | null = null;
    const chunks: { readonly l: Layout; readonly from: number; readonly to: number; readonly at: number }[] = [];
    const spans: ObjectSpan[] = [];
    const open: { start: number }[] = [];
    let failed = false;

    const raw = (s: string): void => { text += s; last = null; };
    /** `[from, to)` of `l`; two pieces that were not adjacent in their texts never glue into one token. */
    const put = (l: Layout, from: number, to: number): void => {
        if (to <= from) return;
        const contiguous = last !== null && last.l === l && last.at === from;
        if (!contiguous && text && /\S/.test(text[text.length - 1]) && /\S/.test(l.text[from])) raw(/\s+$/.exec(l.text.slice(Math.max(0, from - 80), from))?.[0] ?? ' ');
        chunks.push({ l, from, to, at: text.length });
        text += l.text.slice(from, to);
        last = { l, at: to };
    };
    const indentHere = (): string => /^[ \t]*/.exec(text.slice(text.lastIndexOf('\n') + 1))![0];

    /** Rule 2: the comments in the typed own text of `id`, outside its children's slots. */
    const ownComments = (id: string): { readonly lead: string[]; readonly trail: string[] } => {
        const lead: string[] = [];
        const trail: string[] = [];
        const n = T.nodes.get(id)!;
        const all = typedComments();
        if (!all) { failed = true; return { lead, trail }; }
        const slots = n.children.map(c => slotOf(T, c));
        for (const c of all) {
            if (c.start < n.start || c.end > n.end || slots.some(([a, b]) => a <= c.start && c.end <= b)) continue;
            (c.trailing ? trail : lead).push(c.text);
        }
        return { lead, trail };
    };

    /** A child in its result place: its slot's trivia from the text it is taken from, its core by `emit`. */
    const slot = (id: string, first: boolean, lastOne: boolean): void => {
        const l = T.nodes.has(id) ? T : N;
        const n = l.nodes.get(id)!;
        const [s, e] = slotOf(l, id);
        if (!first) put(l, s, n.start);
        emit(id);
        if (!lastOne) put(l, n.end, e);
    };

    const emit = (id: string): void => {
        const nShape = shapeOf(N, id);
        const tShape = T.nodes.has(id) ? shapeOf(T, id) : null;
        // Rule 1: the own text prints as before, and the typed text has its runs of children where the print has them.
        const keep = tShape !== null && tShape.runs.length === nShape.runs.length && ownKey(O, shapeOf(O, id)) === ownKey(N, nShape);
        const l = keep ? T : N;
        const shape = keep ? tShape! : nShape;
        const { lead, trail } = !keep && tShape ? ownComments(id) : { lead: [], trail: [] };
        const [h0, h1] = shape.segs[0];
        const head = l.text.slice(h0, h1).indexOf('\n');
        if (head < 0) lead.push(...trail.splice(0));
        if (lead.length) {
            // Own-line comments before the first token; a container starting at the same token starts after them too.
            const at = text.length;
            const indent = indentHere();
            for (const c of lead) raw(`${c}\n${indent}`);
            for (const o of open) if (o.start === at) o.start = text.length;
        }
        const mine = { start: text.length };
        open.push(mine);
        shape.segs.forEach(([a, b], i) => {
            if (i === 0 && trail.length) {
                put(l, a, a + head);
                raw(` ${trail.join(' ')}`);
                put(l, a + head, b);
            } else put(l, a, b);
            const run = nShape.runs[i];
            if (!run) return;
            run.forEach((c, k) => slot(c, k === 0 && i === 0 && a === b, k === run.length - 1 && i === nShape.runs.length - 1 && shape.segs[i + 1][0] === shape.segs[i + 1][1]));
        });
        open.pop();
        spans.push({ id, start: mine.start, end: text.length });
    };

    // The text itself: what the typed text holds before its first root and after its last stays where it is.
    const [p0, p1] = T.roots.length ? outer.segs[0] : [0, 0];
    put(T, p0, p1);
    for (const r of N.roots) {
        const l = T.nodes.has(r) ? T : N;
        const [s, e] = slotOf(l, r);
        put(l, s, l.nodes.get(r)!.start);
        emit(r);
        put(l, l.nodes.get(r)!.end, e);
    }
    const [q0, q1] = outer.segs[outer.segs.length - 1];
    put(T, q0, q1);
    if (failed) return null;

    // Print-parse equality: the result reads back as the new print, else the caller reprints.
    try {
        const parsed = parseText(text, g);
        const want = parseText(next.text, g);
        if (!isApplicableParse(parsed) || !isApplicableParse(want)) return null;
        if (printTextModel(g, parsed.objects).text !== printTextModel(g, want.objects).text) return null;
    } catch {
        return null;
    }
    return { text, spans: spans.sort((a, b) => a.start - b.start), refs: refsOf(chunks, typed, next, T, N) };
}

/**
 * The reference tokens of the result: the new print's where its text was taken, the typed text's where it was kept,
 * each with the target the new print gives the same token of its owner and feature.
 */
function refsOf(chunks: readonly { readonly l: Layout; readonly from: number; readonly to: number; readonly at: number }[], typed: PrintedText, next: PrintedText, T: Layout, N: Layout): RefSpan[] {
    const key = (r: RefSpan): string => `${r.owner}\u0000${r.feature}`;
    const printedOf = new Map<string, RefSpan[]>();
    for (const r of next.refs ?? []) printedOf.set(key(r), [...(printedOf.get(key(r)) ?? []), r]);
    const nth = new Map<RefSpan, number>();
    const count = new Map<string, number>();
    for (const r of [...(typed.refs ?? [])].sort((a, b) => a.start - b.start)) {
        const k = key(r);
        nth.set(r, count.get(k) ?? 0);
        count.set(k, (count.get(k) ?? 0) + 1);
    }
    const out: RefSpan[] = [];
    const place = (l: Layout, r: RefSpan): RefSpan | null => {
        const c = chunks.find(x => x.l === l && x.from <= r.start && r.end <= x.to);
        return c ? { ...r, start: c.at + r.start - c.from, end: c.at + r.end - c.from } : null;
    };
    for (const r of next.refs ?? []) {
        const p = place(N, r);
        if (p) out.push(p);
    }
    for (const r of typed.refs ?? []) {
        const match = printedOf.get(key(r))?.[nth.get(r)!];
        const p = match && place(T, r);
        if (p) out.push({ ...p, target: match!.target });
    }
    return out.sort((a, b) => a.start - b.start);
}

/**
 * Step D lane D5 (P-2026-11-07-0747; R-TXT-53 decision D5; docs/discovery/discovery_2026-11-06_textual_d_writing_aids.md
 * §6.2): Format Document and Format Selection of the Text tab. Pure: no editor and no store; ui/textualMonaco.ts wires it.
 *
 * A format is the print of the parsed objects of an applicable text, with every comment of the text put back by its
 * owner (`commentsOf`), as T10's splice puts back the comments of an object it reprints (textReprint.ts rule 2): a leading
 * comment on its own line before its owner's token, a trailing one at the end of the line of the token it follows. The
 * token is found in the print by its place among the tokens its object owns, so a comment stays with its token wherever
 * the print breaks the lines. Two consequences, both stable under a second format:
 *
 * - an own-line comment whose token the print puts in the middle of a line goes above that line;
 * - a trailing comment whose token the print joins to the line below goes to the end of the joined line.
 *
 * Redundant parentheses are dropped (decision D5): a parenthesis has no trace in the model, the print writes only the ones
 * the precedence needs. The editor's undo brings them back.
 *
 * A range format is the full format, then only the top-level objects whose region (their text with their leading and
 * trailing comments) meets the range are spliced in, the rest of the text byte for byte as typed. Printing a subset alone
 * would be wrong: a reference is written by the uniqueness of its name over the whole text.
 *
 * A text that is not applicable is never formatted, and neither is one whose format does not read back as the same
 * objects (print-parse equality): both return null, and the editor does nothing.
 */

import type { ConcreteGrammar } from './concreteGrammar';
import { commentsOf, isApplicableParse, parseText } from './parser';
import type { SyntaxNode, SyntaxToken, TextNode, TextParseResult } from './parser';
import { hasUnprinted, printTextModel } from './printer';

/** One edit of a text: `[start, end)` replaced by `text`. */
export interface TextFormatEdit {
    readonly start: number;
    readonly end: number;
    readonly text: string;
}

/** Where a token stands: the object that owns it (`''`, the text itself) and its index among that object's tokens. */
interface Place {
    readonly id: string;
    readonly i: number;
}

/** The tokens of a tree by the object that owns them, in text order, without layout marks and parenthesis brackets. */
interface Owned {
    readonly own: ReadonlyMap<string, readonly SyntaxToken[]>;
    readonly place: ReadonlyMap<SyntaxToken, Place>;
    /** The owned tokens in text order. */
    readonly tokens: readonly SyntaxToken[];
}

function ownedOf(tree: TextNode, rename: (id: string) => string = id => id): Owned {
    const own = new Map<string, SyntaxToken[]>([['', []]]);
    const place = new Map<SyntaxToken, Place>();
    const tokens: SyntaxToken[] = [];
    const walk = (n: SyntaxNode, owner: string): void => {
        const here = n.kind === 'object' ? rename(n.id) : owner;
        if (!own.has(here)) own.set(here, []);
        // A parenthesis is not printed back when it is redundant: its brackets belong to no object.
        const brackets = n.kind === 'paren' ? [n.children[0], n.children[n.children.length - 1]] : [];
        for (const c of n.children) {
            if (c.kind !== 'token') { walk(c, here); continue; }
            if (brackets.includes(c) || (c.raw === '' && c.k !== 'EOF')) continue;
            const list = own.get(here)!;
            place.set(c, { id: here, i: list.length });
            list.push(c);
            tokens.push(c);
        }
    };
    walk(tree, '');
    return { own, place, tokens };
}

/** The first token at or after `at` (`after`), or the last one ending at or before it. */
function tokenNear(tokens: readonly SyntaxToken[], at: number, after: boolean): SyntaxToken | undefined {
    let lo = 0;
    let hi = tokens.length;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (after ? tokens[mid].start < at : tokens[mid].end <= at) lo = mid + 1; else hi = mid;
    }
    return after ? tokens[lo] : tokens[lo - 1];
}

/** The parse of an applicable text with its tree, or null. */
function applicable(text: string, g: ConcreteGrammar): (TextParseResult & { readonly tree: TextNode }) | null {
    const p = parseText(text, g);
    return isApplicableParse(p) && p.tree ? p as TextParseResult & { readonly tree: TextNode } : null;
}

/** `text` reads as the objects whose print is `printed`. */
function means(text: string, g: ConcreteGrammar, printed: string): boolean {
    const p = applicable(text, g);
    return p !== null && printTextModel(g, p.objects).text === printed;
}

/** The full format of `text`, or null when it is not applicable or its format would not read back the same. */
export function formatText(text: string, g: ConcreteGrammar): string | null {
    const parsed = applicable(text, g);
    if (!parsed) return null;
    const print = printTextModel(g, parsed.objects);
    if (hasUnprinted(print)) return null;
    // The print's ids are the parse's; a print without its tree is read back, its ids zipped in text order.
    let tree = print.tree;
    let rename: ((id: string) => string) | undefined;
    if (!tree) {
        const again = applicable(print.text, g);
        if (!again || again.spans.length !== print.spans.length) return null;
        const ids = new Map(again.spans.map((s, i) => [s.id, print.spans[i].id]));
        tree = again.tree;
        rename = id => ids.get(id) ?? id;
    }
    const typed = ownedOf(parsed.tree);
    const printed = ownedOf(tree, rename);
    const out = print.text;

    const inserts: { readonly at: number; readonly key: number; readonly from: number; readonly text: string }[] = [];
    const atEnd: string[] = [];
    for (const c of commentsOf(parsed.tree, g)) {
        const anchor = c.trailing ? tokenNear(typed.tokens, c.start, false) : tokenNear(typed.tokens, c.end, true);
        const where = anchor && typed.place.get(anchor);
        if (!where) return null;
        const mine = printed.own.get(where.id);
        if (!mine) return null;
        // The same tokens: the same place; else (a token the print writes otherwise) the object's first token.
        const t = mine.length === typed.own.get(where.id)!.length ? mine[where.i] : mine[0];
        if (!t) return null;
        if (t.k === 'EOF') { atEnd.push(c.text); continue; }
        if (c.trailing) {
            const eol = out.indexOf('\n', t.end);
            inserts.push({ at: eol < 0 ? out.length : eol, key: t.start, from: c.start, text: ` ${c.text}` });
        } else {
            const bol = out.lastIndexOf('\n', t.start - 1) + 1;
            let indent = /^[ \t]*/.exec(out.slice(bol))![0];
            // A comment before a block's close is the block's: at the depth of the line above, when that is deeper.
            if (c.owner.kind === 'block' && bol > 0) {
                const above = /^[ \t]*/.exec(out.slice(out.lastIndexOf('\n', bol - 2) + 1))![0];
                if (above.length > indent.length) indent = above;
            }
            inserts.push({ at: bol, key: t.start, from: c.start, text: `${indent}${c.text}\n` });
        }
    }
    inserts.sort((a, b) => a.at - b.at || a.key - b.key || a.from - b.from);
    let result = '';
    let at = 0;
    for (const x of inserts) {
        result += out.slice(at, x.at) + x.text;
        at = x.at;
    }
    result += out.slice(at);
    if (atEnd.length) result += (result && !result.endsWith('\n') ? '\n' : '') + atEnd.join('\n');
    return means(result, g, print.text) ? result : null;
}

/**
 * The regions of the top-level objects of an applicable text, in text order: from the line of their first leading
 * comment (or of their first token) to the end of the line of their last token, its trailing comment included; a region
 * starts at its line's start only when nothing but blanks stands before it on that line.
 */
function regionsOf(text: string, g: ConcreteGrammar): (readonly [number, number])[] | null {
    const p = applicable(text, g);
    if (!p) return null;
    const out: [number, number][] = [];
    const visit = (n: SyntaxNode): void => {
        if (n.kind !== 'object') {
            for (const c of n.children) if (c.kind !== 'token') visit(c);
            return;
        }
        const tokens: SyntaxToken[] = [];
        const collect = (m: SyntaxNode): void => {
            for (const c of m.children) if (c.kind !== 'token') collect(c); else if (c.raw !== '') tokens.push(c);
        };
        collect(n);
        if (!tokens.length) return;
        const first = tokens[0];
        const last = tokens[tokens.length - 1];
        const lead = first.leading.search(/\S/);
        let start = lead < 0 ? first.start : first.start - first.leading.length + lead;
        const bol = text.lastIndexOf('\n', start - 1) + 1;
        if (/^[ \t]*$/.test(text.slice(bol, start))) start = bol;
        out.push([start, last.end + last.trailing.replace(/\r?\n$/, '').length]);
    };
    visit(p.tree);
    return out;
}

/**
 * The format of the top-level objects of `text` that `[start, end)` meets (a caret, when `start === end`), the rest of the
 * text unchanged; null when the text is not applicable, or the result would not read back as the same objects.
 */
export function formatTextRange(text: string, g: ConcreteGrammar, start: number, end: number): string | null {
    const full = formatText(text, g);
    if (full === null) return null;
    const typed = regionsOf(text, g);
    const formatted = regionsOf(full, g);
    if (!typed || !formatted || typed.length !== formatted.length) return null;
    let result = text;
    for (let i = typed.length - 1; i >= 0; i--) {
        const [s, e] = typed[i];
        const meets = start === end ? s <= start && start <= e : s < end && start < e;
        if (meets) result = result.slice(0, s) + full.slice(formatted[i][0], formatted[i][1]) + result.slice(e);
    }
    return means(result, g, printTextModel(g, parseText(text, g).objects).text) ? result : null;
}

/** The one edit from `before` to `after`, their common prefix and suffix left out; null when they are equal. */
export function minimalEdit(before: string, after: string): TextFormatEdit | null {
    if (before === after) return null;
    const max = Math.min(before.length, after.length);
    let p = 0;
    while (p < max && before[p] === after[p]) p++;
    let s = 0;
    while (s < max - p && before[before.length - 1 - s] === after[after.length - 1 - s]) s++;
    return { start: p, end: before.length - s, text: after.slice(p, after.length - s) };
}

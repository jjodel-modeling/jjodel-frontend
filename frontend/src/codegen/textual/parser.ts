/**
 * The parser: a hand-written interpreter of the concrete grammar, with recovery (R-TXT-21 (1); step T2 of
 * docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.7). It walks the same data the printer walks
 * (concreteGrammar.ts), predicting each choice from the FIRST sets of the nodes, and gives back the objects in the shape
 * the printer takes (`{id, cls, slots}`), so that print, parse, print gives the same text.
 *
 * References are read as a name or a path (R-TXT-4, R-TXT-25 (5, 6)) and resolved after the parse, against the whole
 * text: a name must be unique among the instances of the reference's type; a path is `keyword[k].f[i]...`, every segment
 * with its index, so a path never reads as a name; its first word is a class keyword as printed, the class name for a
 * positional class (R-TXT-28), each later f a feature keyword as printed, the feature name when it prints none (R-TXT-29).
 * A reference to an object the text does not print is `@` and the target's id as a string (R-TXT-32): it is read as an
 * `OuterRef`, never resolved against the text. Every reference token is listed with its place and text (R-TXT-35): in
 * the editor, a token the user did not retype keeps the target the previous print wrote it for, and one of them that
 * names nothing in the edited text is not an error (`ParseOptions.keep`); the diff decides (textDiff.ts).
 * The top level
 * admits every concrete class (R-TXT-24 (a)); a single containment is a block of one object (R-TXT-24 (b)).
 *
 * Recovery: an error inside a body costs the rest of its line, the parse resumes at the next line that starts an item
 * of the same body or closes it; a body left open is closed where a line starts an item of an enclosing body. Objects
 * whose text was not read in full are listed in `recovered` and are never applied (R-TXT-21 (8)).
 */

import type { NamePattern } from './annotations';
import type { ConcreteGrammar, ConcreteRule, GrammarNode, ObjectRule } from './concreteGrammar';
import { applyCase, derivedName } from './concreteGrammar';
import type { OuterRef, TextFeature, TextObject } from './metamodel';
import type { ObjectSpan } from './printer';
import { featureKeyword, pathKeyword } from './printer';

/** An error at `[start, end)` of the text; `line` and `col` are 1-based, of `start`. */
export interface TextParseError {
    readonly line: number;
    readonly col: number;
    readonly start: number;
    readonly end: number;
    readonly message: string;
    /** A reference error in a text with a syntax error: it may follow from that error (step A); listed after the syntax errors. */
    readonly secondary?: true;
    readonly severity?: 'warning';
}

export interface TextParseResult {
    /** In text order (an object before the objects it contains); ids `t1`, `t2`, ... */
    readonly objects: readonly TextObject[];
    /** The syntax errors in text order, then the reference errors in text order, secondary when there is a syntax error. */
    readonly errors: readonly TextParseError[];
    /** The ids of the objects whose text was not read in full, or whose references did not resolve (R-TXT-21 (8)). */
    readonly recovered: readonly string[];
    /** One per object, from its keyword to its last token read, in text order. */
    readonly spans: readonly ObjectSpan[];
    /** R-TXT-35: one per reference token, by owner in text order, then in the order of its slot. */
    readonly refs?: readonly ParsedRef[];
    /**
     * The recovered objects read in full, whose only fault is a block left open, their own or an enclosing one: an outline
     * shows them as they are, and greys the other recovered ones (step A). In text order.
     */
    readonly unclosed?: readonly string[];
    /** The lossless tree the lists above are derived from (step A). */
    readonly tree?: TextNode;
}

interface NodeBase {
    /** From its first token to its last; a node with no token is empty, where it was opened. */
    readonly start: number;
    readonly end: number;
    readonly children: readonly SyntaxElement[];
}
/** The whole text: its children hold every token once, in text order, the last one `EOF`. */
export interface TextNode extends NodeBase {
    readonly kind: 'text';
    readonly tokens: readonly SyntaxToken[];
}
export interface ObjectNode extends NodeBase {
    readonly kind: 'object';
    /** The parsed object's id (`TextParseResult.objects`). */
    readonly id: string;
    readonly cls: string;
    readonly rule: string;
    /**
     * `complete`: read in full. `partial`: some of its own text was not read, or a reference of it names nothing; it is
     * in `recovered`. `unclosed`: read in full, but its block or an enclosing one is left open; it is in `recovered`.
     */
    readonly state: 'complete' | 'partial' | 'unclosed';
    /** Read inside a block the parser skipped after an error: its container is unknown. It is in `recovered`. */
    readonly orphan?: true;
}
/** One item of a feature: its keyword and value, one value of a list, one contained object. */
export interface ItemNode extends NodeBase {
    readonly kind: 'item';
    readonly feature: string;
}
export interface BlockNode extends NodeBase {
    readonly kind: 'block';
    /** Its close was read. */
    readonly closed: boolean;
}
export interface ListNode extends NodeBase {
    readonly kind: 'list';
    readonly feature: string;
}
export interface RefNode extends NodeBase {
    readonly kind: 'ref';
    readonly feature: string;
    /** The token as `TextParseResult.refs` lists it; absent when the reference could not be read. */
    readonly ref?: ParsedRef;
}
/** Tokens the parser skipped, where it skipped them, with the error that made it skip. */
export interface ErrorNode extends NodeBase {
    readonly kind: 'error';
    readonly message: string;
}
export type SyntaxNode = TextNode | ObjectNode | ItemNode | BlockNode | ListNode | RefNode | ErrorNode;
export type SyntaxElement = SyntaxNode | SyntaxToken;

/** A comment of the text and the node it belongs to (§A.6), derived from the tree. */
export interface TreeComment {
    readonly start: number;
    readonly end: number;
    readonly text: string;
    readonly owner: SyntaxNode;
    /** On the line of the token before it (trailing trivia), not on a line of its own. */
    readonly trailing: boolean;
}

/**
 * The comments of a parsed text and their owners (§A.6): a comment in the leading trivia of a token belongs to the
 * innermost node that token starts, to the block when the token is its close, else to the token's node; a comment in the
 * trailing trivia of a token belongs to the innermost item or object around the token.
 */
export function commentsOf(tree: TextNode, g: ConcreteGrammar): TreeComment[] {
    const { line, block } = g.style.comments;
    const out: TreeComment[] = [];
    const scan = (trivia: string, at: number, owner: SyntaxNode, trailing: boolean): void => {
        let j = 0;
        while (j < trivia.length) {
            let e = -1;
            if (line && trivia.startsWith(line, j)) { e = trivia.indexOf('\n', j); if (e < 0) e = trivia.length; }
            else if (block && trivia.startsWith(block[0], j)) { e = trivia.indexOf(block[1], j + block[0].length); e = e < 0 ? trivia.length : e + block[1].length; }
            if (e < 0) { j++; continue; }
            out.push({ start: at + j, end: at + e, text: trivia.slice(j, e), owner, trailing });
            j = e;
        }
    };
    const walk = (n: SyntaxNode, chain: readonly SyntaxNode[]): void => {
        n.children.forEach((c, i) => {
            if (c.kind !== 'token') { walk(c, [...chain, c]); return; }
            if (c.leading) {
                const starts = [...chain].reverse().find(x => x.start === c.start && x.end > x.start);
                const closes = n.kind === 'block' && i === n.children.length - 1 && n.closed && c.role === 'punctuation';
                scan(c.leading, c.start - c.leading.length, closes ? n : starts ?? n, false);
            }
            if (c.trailing) scan(c.trailing, c.end, [...chain].reverse().find(x => x.kind === 'item' || x.kind === 'object') ?? n, true);
        });
    };
    walk(tree, [tree]);
    return out;
}

/** R-TXT-35: a reference token as read: the parsed object and feature it is written for, its place and text, what it names. */
export interface ParsedRef {
    readonly owner: string;
    readonly feature: string;
    readonly start: number;
    readonly end: number;
    readonly text: string;
    /** `@"id"` (R-TXT-32): kept or refused by its own rule, never by R-TXT-35. */
    readonly outer: boolean;
    /** The parsed object it names, or the outer reference; absent when it names nothing in the text. */
    readonly to?: string | OuterRef;
    /** Why it names nothing: an error of the parse, unless the token is one of `ParseOptions.keep`. */
    readonly error?: TextParseError;
}

export interface ParseOptions {
    /**
     * R-TXT-35: the previous print's reference tokens, where the editor carried them. A name or path read at one of them
     * with its text that names nothing in the edited text is not an error: the diff keeps its target, or refuses it
     * when its owner or feature is not the print's. Outside the editor there are none (T8).
     */
    readonly keep?: readonly { readonly start: number; readonly end: number; readonly text: string }[];
}

/** R-TXT-21 (8): only a text read without any error may be applied. */
export const isApplicableParse = (r: TextParseResult): boolean => r.errors.length === 0 && r.recovered.length === 0;

export type TokenKind = 'ID' | 'INT' | 'FLOAT' | 'STR' | 'P' | 'EOF';

/** What a token is in the concrete grammar, set by the parser on the tokens it read; a skipped token has none. */
export type TokenRole = 'class' | 'keyword' | 'name' | 'value' | 'literal' | 'reference' | 'punctuation';

interface Token {
    readonly kind: 'token';
    readonly k: TokenKind;
    /** The identifier, the punctuation, the number as written, or the string unescaped. */
    readonly v: string;
    /** The token as written. */
    readonly raw: string;
    readonly line: number;
    readonly col: number;
    readonly start: number;
    readonly end: number;
    /** No other token before it on its line. */
    readonly first: boolean;
    /** The whitespace and comments before it, after the trailing trivia of the token before. */
    leading: string;
    /** What follows it up to and including the end of its line, when the line ends before the next token; else empty. */
    trailing: string;
    role?: TokenRole;
}

/** A token with its trivia: the concatenation of `leading`, `raw` and `trailing` over the tokens is the text, byte for byte. */
export type SyntaxToken = Readonly<Token>;

const IDENT = /[A-Za-z_][A-Za-z0-9_]*/y;
const NUMBER = /-?\d+(\.\d+)?([eE][+-]?\d+)?/y;
/** The digits of a character code after `#`, in a doubling-style string (D4). */
const CODE = /[0-9]+/y;

/** The tokens of a text, the last one `EOF`, with their trivia, and the lexical errors. */
export function tokenizeText(text: string, g: ConcreteGrammar): { readonly tokens: readonly SyntaxToken[]; readonly errors: readonly TextParseError[] } {
    const errors: TextParseError[] = [];
    return { tokens: tokenize(g, text, errors), errors };
}

function tokenize(g: ConcreteGrammar, text: string, errors: TextParseError[]): Token[] {
    const style = g.style;
    const puncts = [...new Set([
        ...style.blockOpen, ...style.blockClose, ...style.emptyBlock, ...style.assign, ...style.terminator,
        style.list.open, style.list.separator, style.list.close, '[', ']', '.', '@',
    ].filter(s => !/^\w/.test(s)))].sort((a, b) => b.length - a.length);
    const { line: lineComment, block: blockComment } = style.comments;
    const quote = style.string.quote;

    const toks: Token[] = [];
    let i = 0;
    let line = 1;
    let lineStart = 0;
    let lastLine = 0;
    const pos = (at: number): { line: number; col: number } => {
        let l = 1;
        let s = 0;
        for (let j = 0; j < at; j++) if (text[j] === '\n') { l++; s = j + 1; }
        return { line: l, col: at - s + 1 };
    };
    const push = (k: TokenKind, v: string, start: number, end: number): void => {
        toks.push({ kind: 'token', k, v, raw: text.slice(start, end), line, col: start - lineStart + 1, start, end, first: line !== lastLine, leading: '', trailing: '' });
        lastLine = line;
    };
    const skipTo = (end: number): void => {
        for (; i < end; i++) if (text[i] === '\n') { line++; lineStart = i + 1; }
    };

    while (i < text.length) {
        const ch = text[i];
        if (ch === '\n') { skipTo(i + 1); continue; }
        if (ch === ' ' || ch === '\t' || ch === '\r') { i++; continue; }
        if (lineComment && text.startsWith(lineComment, i)) {
            const e = text.indexOf('\n', i);
            skipTo(e < 0 ? text.length : e);
            continue;
        }
        if (blockComment && text.startsWith(blockComment[0], i)) {
            const e = text.indexOf(blockComment[1], i + blockComment[0].length);
            if (e < 0) errors.push({ ...pos(i), start: i, end: text.length, message: `unterminated comment: "${blockComment[1]}" is missing` });
            skipTo(e < 0 ? text.length : e + blockComment[1].length);
            continue;
        }
        IDENT.lastIndex = i;
        let m = IDENT.exec(text);
        if (m) { push('ID', m[0], i, i + m[0].length); i += m[0].length; continue; }
        NUMBER.lastIndex = i;
        m = NUMBER.exec(text);
        if (m) { push(m[1] || m[2] ? 'FLOAT' : 'INT', m[0], i, i + m[0].length); i += m[0].length; continue; }
        if (ch === quote) {
            let j = i;
            let v = '';
            let closed = false;
            // D4 (P-2026-11-04-0345): under a doubling style a string is quoted pieces and character codes joined with
            // nothing between them, `'line1'#10'line2'`; it starts with a quoted piece.
            for (let piece = true; ; ) {
                if (piece) {
                    j++;
                    closed = false;
                    while (j < text.length && text[j] !== '\n') {
                        const c = text[j];
                        if (style.string.escape === 'backslash' && c === '\\' && j + 1 < text.length && text[j + 1] !== '\n') {
                            const e = text[j + 1];
                            v += e === 'n' ? '\n' : e === 't' ? '\t' : e === 'r' ? '\r' : e;
                            j += 2;
                            continue;
                        }
                        if (c === quote) {
                            if (style.string.escape === 'double' && text[j + 1] === quote) { v += quote; j += 2; continue; }
                            closed = true;
                            j++;
                            break;
                        }
                        v += c;
                        j++;
                    }
                    if (!closed) break;
                } else {
                    CODE.lastIndex = j + 1;
                    const digits = CODE.exec(text)![0];
                    const n = Number(digits);
                    if (n <= 0x10ffff) v += String.fromCodePoint(n);
                    else errors.push({ line, col: j - lineStart + 1, start: j, end: j + 1 + digits.length, message: `character code #${digits} is out of range` });
                    j += 1 + digits.length;
                }
                if (style.string.escape !== 'double') break;
                if (text[j] === '#' && /[0-9]/.test(text[j + 1] ?? '')) piece = false;
                else if (text[j] === quote) piece = true;
                else break;
            }
            if (!closed) errors.push({ line, col: i - lineStart + 1, start: i, end: j, message: 'unterminated string' });
            push('STR', v, i, j);
            i = j;
            continue;
        }
        const p = puncts.find(s => text.startsWith(s, i));
        if (p) { push('P', p, i, i + p.length); i += p.length; continue; }
        errors.push({ line, col: i - lineStart + 1, start: i, end: i + 1, message: `unexpected character ${JSON.stringify(ch)}` });
        i++;
    }
    toks.push({ kind: 'token', k: 'EOF', v: '', raw: '', line, col: i - lineStart + 1, start: i, end: i, first: line !== lastLine, leading: '', trailing: '' });

    // Trivia (§A.6): what lies between two tokens goes, up to and including the first line end outside a comment, to the
    // token before as trailing trivia; the rest to the token after as leading. A gap with no line end is leading trivia,
    // unless it ends the text. A stray character or an unterminated comment stays in the trivia, with its error.
    const trailEnd = (from: number, to: number): number => {
        let j = from;
        while (j < to) {
            if (lineComment && text.startsWith(lineComment, j)) { const e = text.indexOf('\n', j); j = e < 0 || e > to ? to : e; continue; }
            if (blockComment && text.startsWith(blockComment[0], j)) {
                const e = text.indexOf(blockComment[1], j + blockComment[0].length);
                j = e < 0 ? to : Math.min(to, e + blockComment[1].length);
                continue;
            }
            if (text[j] === '\n') return j + 1;
            j++;
        }
        return to === text.length ? to : from;
    };
    let at = 0;
    for (let k = 0; k < toks.length; k++) {
        const t = toks[k];
        t.leading = text.slice(at, t.start);
        const next = k + 1 < toks.length ? toks[k + 1].start : t.end;
        at = trailEnd(t.end, next);
        t.trailing = text.slice(t.end, at);
    }
    return toks;
}

/** A token class: `ID`, `ID:x` (the identifier x), `P:x`, `STR`, `INT`, `FLOAT`. */
export type Matcher = string;

export interface First {
    readonly set: ReadonlySet<Matcher>;
    readonly nullable: boolean;
}

const hit = (t: Token, m: Matcher): boolean => {
    const c = m.indexOf(':');
    if (c < 0) return t.k === m;
    return t.k === m.slice(0, c) && t.v === m.slice(c + 1);
};
export const word = (s: string): Matcher => (/^\w/.test(s) ? `ID:${s}` : `P:${s}`);

const describeToken = (t: Token): string => {
    switch (t.k) {
        case 'EOF': return 'end of text';
        case 'ID': return `name "${t.v}"`;
        case 'STR': return `string ${JSON.stringify(t.v)}`;
        case 'INT': case 'FLOAT': return `number ${t.v}`;
        case 'P': return `"${t.v}"`;
    }
};
const describeMatchers = (ms: Iterable<Matcher>): string[] => {
    const set = new Set(ms);
    const out: string[] = [];
    if (set.has('ID')) out.push('a name');
    else if (set.has('STR')) out.push('a string');
    if (set.has('FLOAT')) out.push('a number');
    else if (set.has('INT')) out.push('an integer');
    for (const m of set) if (m.includes(':')) out.push(`"${m.slice(m.indexOf(':') + 1)}"`);
    return out;
};
const either = (xs: readonly string[]): string => {
    const ys = [...new Set(xs)];
    const shown = ys.length > 10 ? [...ys.slice(0, 10), '...'] : ys;
    return shown.length <= 1 ? shown.join('') : `${shown.slice(0, -1).join(', ')} or ${shown[shown.length - 1]}`;
};

/** The FIRST set and nullability of each node of `g`, memoised per node; a rule reached again while computing is taken as empty. */
export function firstSetsOf(g: ConcreteGrammar): (n: GrammarNode) => First {
    const rules = new Map<string, ConcreteRule>(g.rules.map(r => [r.name, r]));
    const memo = new Map<GrammarNode, First>();
    const EMPTY: First = { set: new Set(), nullable: true };
    const first = (n: GrammarNode): First => {
        const known = memo.get(n);
        if (known) return known;
        memo.set(n, EMPTY);
        let r: First;
        switch (n.t) {
            case 'seq': {
                const set = new Set<Matcher>();
                let nullable = true;
                for (const x of n.items) {
                    const f = first(x);
                    f.set.forEach(s => set.add(s));
                    if (!f.nullable) { nullable = false; break; }
                }
                r = { set, nullable };
                break;
            }
            case 'opt': case 'star': r = { set: first(n.item).set, nullable: true }; break;
            case 'alt': {
                const fs = n.alts.map(first);
                r = { set: new Set(fs.flatMap(f => [...f.set])), nullable: fs.some(f => f.nullable) };
                break;
            }
            case 'kw': case 'p': r = { set: new Set([word(n.text)]), nullable: false }; break;
            case 'tok': r = {
                set: new Set({ NAME: ['ID', 'STR'], INT: ['INT'], FLOAT: ['INT', 'FLOAT'], BOOL: ['ID:true', 'ID:false'], STRING: ['STR'] }[n.terminal]),
                nullable: false,
            }; break;
            case 'xref': r = { set: new Set(['ID', 'STR', 'P:@']), nullable: false }; break;
            case 'lit': r = { set: new Set(literalsOf(n.rule).map(l => `ID:${applyCase(l, g.literalCase)}`)), nullable: false }; break;
            case 'rule': { const k = rules.get(n.name); r = k ? first(k.body) : EMPTY; break; }
            case 'assign': r = first(n.item); break;
            case 'list': r = { set: new Set([word(n.open)]), nullable: false }; break;
            case 'block': r = { set: new Set([word(n.open[0]), ...(n.empty.length ? [word(n.empty[0])] : [])]), nullable: false }; break;
            case 'nl': r = EMPTY; break;
        }
        memo.set(n, r);
        return r;
    };
    function literalsOf(rule: string): readonly string[] {
        const r = rules.get(rule);
        return r && r.t === 'enum' ? r.literals : [];
    }
    return first;
}

class ParseFailure extends Error {
    constructor(readonly error: TextParseError) { super(error.message); }
}

/** A reference as written, resolved after the parse: a name, or a path whose first segment is a class keyword; or the id of an object outside the text (R-TXT-32), kept as written. */
interface RefSyntax {
    readonly outer?: string;
    readonly name?: string;
    readonly segments?: readonly { readonly f: string; readonly index: number }[];
}

class PendingRef {
    constructor(readonly node: Extract<GrammarNode, { t: 'xref' }>, readonly owner: MutableObject, readonly feat: string, readonly syntax: RefSyntax, readonly at: Token, readonly endAt: number,
                readonly tree?: Building) {}
}

/** A node of the tree while the parse builds it. */
interface Building {
    kind: SyntaxNode['kind'];
    start: number;
    end: number;
    children: (Building | Token)[];
    empty?: boolean;
    id?: string;
    cls?: string;
    rule?: string;
    state?: ObjectNode['state'];
    orphan?: true;
    feature?: string;
    closed?: boolean;
    ref?: ParsedRef;
    message?: string;
    tokens?: readonly Token[];
}

interface MutableObject {
    readonly id: string;
    readonly cls: string;
    readonly slots: Record<string, unknown>;
}

/** A body being read: what may start one of its items, and how it closes (none at the top level). */
interface Frame {
    readonly can: (t: Token) => boolean;
    readonly close?: readonly string[];
    readonly open?: readonly string[];
}

/** Parses a text of the concrete grammar `g`. Never throws on a broken text: every problem is an error of the result. */
export function parseText(text: string, g: ConcreteGrammar, options: ParseOptions = {}): TextParseResult {
    const errors: TextParseError[] = [];
    const toks = tokenize(g, text, errors);
    const rules = new Map<string, ConcreteRule>(g.rules.map(r => [r.name, r]));
    const model = g.rules.find(r => r.t === 'model');
    if (!model) throw new Error('the grammar has no Model rule');

    const first = firstSetsOf(g);
    const literalsOf = (rule: string): readonly string[] => {
        const r = rules.get(rule);
        return r && r.t === 'enum' ? r.literals : [];
    };
    const canAt = (n: GrammarNode, t: Token): boolean => [...first(n).set].some(m => hit(t, m));

    let p = 0;
    const peek = (k = 0): Token => toks[Math.min(p + k, toks.length - 1)];
    const can = (n: GrammarNode): boolean => canAt(n, peek());
    const errorAt = (t: Token, message: string, end = t.end): TextParseError => ({ line: t.line, col: t.col, start: t.start, end, message });
    const fail = (expected: readonly string[], t: Token = peek()): never => {
        throw new ParseFailure(errorAt(t, `expected ${either(expected)}; found ${describeToken(t)}`));
    };

    // The tree (step A): every token read or skipped goes, once and in order, into the node being built.
    const root: Building = { kind: 'text', start: 0, end: 0, children: [] };
    const stack: Building[] = [root];
    const cur = (): Building => stack[stack.length - 1];
    /** Reads the current token into the current node, with its role; a skipped token has none. EOF is never read. */
    const take = (role?: TokenRole): Token => {
        const t = toks[Math.min(p, toks.length - 1)];
        if (t.k !== 'EOF') {
            if (role) t.role = role;
            cur().children.push(t);
        }
        p++;
        return t;
    };
    const seal = (n: Building): void => {
        let lo = -1;
        let hi = -1;
        for (const c of n.children) {
            if (c.kind !== 'token' && c.empty) continue;
            if (lo < 0) lo = c.start;
            hi = c.end;
        }
        if (lo < 0) { n.end = n.start; n.empty = true; } else { n.start = lo; n.end = hi; }
    };
    const enter = (kind: Building['kind'], extra: Partial<Building> = {}): Building => {
        const n: Building = { kind, start: peek().start, end: 0, children: [], ...extra };
        cur().children.push(n);
        stack.push(n);
        return n;
    };
    const leave = (n: Building): void => {
        while (stack.length > 1 && stack.pop() !== n) { /* the nodes above n were left by their own finally */ }
        seal(n);
    };
    const within = <T>(kind: Building['kind'], extra: Partial<Building>, fn: (n: Building) => T): T => {
        const n = enter(kind, extra);
        try { return fn(n); } finally { leave(n); }
    };

    const expect = (m: Matcher, role: TokenRole): Token => {
        if (hit(peek(), m)) return take(role);
        return fail(describeMatchers([m]));
    };
    /**
     * Recovery at an expected keyword or punctuation `m` (step A (a)): the current token can follow it, so `m` is missing
     * and is taken as read; or the next token is `m`, so the current one is extra and is skipped. Either is an error, and
     * the object being read is recovered (R-TXT-21 (8)). Otherwise the parse fails here.
     */
    const repair = (m: Matcher, role: TokenRole, follows: (t: Token) => boolean): void => {
        const t = peek();
        const message = `expected ${either(describeMatchers([m]))}; found ${describeToken(t)}`;
        const o = owner();
        if (t.k !== 'EOF' && hit(peek(1), m) && peek(1).line === t.line && !follows(t)) {
            record(errorAt(t, message));
            if (o) recovered.add(o.id);
            within('error', { message }, () => take());
            take(role);
            return;
        }
        if (!follows(t)) fail(describeMatchers([m]), t);
        record(errorAt(t, message));
        if (o) recovered.add(o.id);
        within('error', { message }, () => undefined);
    };
    /** What may follow in the rest of a sequence; when all of it may be absent, a token that starts a line or closes a body. */
    const followsIn = (rest: readonly GrammarNode[], t: Token): boolean => {
        for (const y of rest) {
            if (y.t === 'nl') continue;
            if (canAt(y, t)) return true;
            if (!first(y).nullable) return false;
        }
        return t.k === 'EOF' || t.first || closesBody(t);
    };
    const closesBody = (t: Token): boolean => {
        const f = [...frames].reverse().find(x => x.close);
        return !!f?.close && hit(t, word(f.close[0]));
    };
    const lastEnd = (): number => (p > 0 ? toks[Math.min(p, toks.length) - 1].end : 0);

    const objects: MutableObject[] = [];
    const recovered = new Set<string>();
    /** Recovered only because a block around them was left open (`TextParseResult.unclosed`), and read inside a skipped block. */
    const unclosed = new Set<string>();
    const orphans = new Set<string>();
    const nodeOf = new Map<string, Building>();
    const open: MutableObject[] = [];
    const frames: Frame[] = [];
    const contained = new Set<string>();
    let counter = 0;
    const derives = new Map<MutableObject, NamePattern>();
    /** The first keyword of an object rule's body: its class keyword. */
    const classKeywords = new Set<GrammarNode>(g.rules.flatMap(r => (r.t === 'object' && r.body.t === 'seq' && r.body.items[0]?.t === 'kw' ? [r.body.items[0]] : [])));

    const record = (e: TextParseError): void => { errors.push(e); };
    const owner = (): MutableObject | undefined => open[open.length - 1];

    const store = (o: MutableObject, feat: string, op: string, v: unknown): void => {
        if (op === '+=') {
            const cur = o.slots[feat];
            if (Array.isArray(cur)) cur.push(v);
            else o.slots[feat] = [v];
        } else if (op === '?=') o.slots[feat] = true;
        else o.slots[feat] = v;
    };

    const objectRule = (name: string): ObjectRule => {
        const r = rules.get(name);
        if (r?.t === 'object') return r;
        if (r?.t === 'choice') {
            const alts = r.body.t === 'alt' ? r.body.alts : [r.body];
            const a = alts.find(can);
            if (!a) fail(describeMatchers(first(r.body).set));
            if (a?.t === 'rule') return objectRule(a.name);
        }
        throw new Error(`rule ${name} is not an object rule or a choice of object rules`);
    };

    const object = (ruleName: string, attach?: (id: string) => void): string => {
        const rule = objectRule(ruleName);
        const o: MutableObject = { id: `t${++counter}`, cls: rule.cls, slots: {} };
        objects.push(o);
        const node = enter('object', { id: o.id, cls: rule.cls, rule: rule.name });
        nodeOf.set(o.id, node);
        attach?.(o.id);
        open.push(o);
        try {
            run(rule.body, o);
            // A name left out where it equals its pattern's expansion is that expansion.
            const pattern = derives.get(o);
            if (pattern && o.slots.name === undefined) {
                const nm = derivedName(g, rule, o.slots, pattern);
                if (nm !== undefined) o.slots.name = nm;
            }
        } catch (e) {
            recovered.add(o.id);
            throw e;
        } finally {
            open.pop();
            leave(node);
        }
        return o.id;
    };

    const reference = (): RefSyntax => {
        const t = peek();
        if (hit(t, 'P:@')) {
            take('reference');
            const id = peek();
            if (id.k !== 'STR') fail(['a string, the id of an object outside the text']);
            take('reference');
            return { outer: id.v };
        }
        if (t.k === 'STR') { take('reference'); return { name: t.v }; }
        if (t.k !== 'ID') fail(['a reference (a name, a path, or @ and an id)']);
        if (!hit(peek(1), 'P:[')) { take('reference'); return { name: t.v }; }
        const segments: { f: string; index: number }[] = [];
        for (;;) {
            const f = expect('ID', 'reference').v;
            expect('P:[', 'punctuation');
            const index = Number(expect('INT', 'reference').v);
            expect('P:]', 'punctuation');
            segments.push({ f, index });
            if (!hit(peek(), 'P:.')) break;
            take('punctuation');
        }
        return { segments };
    };

    const value = (n: GrammarNode, o: MutableObject, feat: string): unknown => {
        const t = peek();
        switch (n.t) {
            case 'tok':
                switch (n.terminal) {
                    case 'INT': if (t.k === 'INT') { take('value'); return Number(t.v); } return fail(['an integer']);
                    case 'FLOAT': if (t.k === 'INT' || t.k === 'FLOAT') { take('value'); return Number(t.v); } return fail(['a number']);
                    case 'BOOL': if (t.k === 'ID' && (t.v === 'true' || t.v === 'false')) { take('value'); return t.v === 'true'; } return fail(['"true"', '"false"']);
                    case 'STRING': if (t.k === 'STR') { take('value'); return t.v; } return fail(['a string']);
                    case 'NAME': if (t.k === 'ID' || t.k === 'STR') { take(feat === 'name' ? 'name' : 'value'); return t.v; } return fail(['a name']);
                }
                return fail(['a value']);
            case 'lit': {
                const ls = literalsOf(n.rule);
                const l = t.k === 'ID' ? ls.find(x => applyCase(x, g.literalCase) === t.v) : undefined;
                if (l === undefined) return fail(ls.map(x => `"${applyCase(x, g.literalCase)}"`));
                take('literal');
                return l;
            }
            case 'xref':
                return within('ref', { feature: feat }, node => {
                    const syntax = reference();
                    return new PendingRef(n, o, feat, syntax, t, lastEnd(), node);
                });
            default: break;
        }
        throw new Error(`a ${n.t} node is not a value`);
    };

    /** A star, or an inline containment (an opt over a star): the item may start again. */
    const repeats = (n: GrammarNode): boolean => {
        if (n.t === 'star') return true;
        if (n.t !== 'opt' || n.item.t !== 'seq') return false;
        const inner = n.item.items.filter(x => x.t !== 'nl');
        return inner.length === 1 && inner[0].t === 'star';
    };
    const featureOf = (n: GrammarNode): string | undefined => (n.t === 'opt' || n.t === 'star' || n.t === 'assign' || n.t === 'list' ? n.feat : undefined);

    /**
     * Skips to the first token that can go on after an error at line `errLine`: it closes the frame, or it starts an item
     * of this frame or of an enclosing one on a later line. The skipped tokens are an error node with `message`.
     */
    const sync = (frame: Frame, errLine: number, message: string): void => {
        const opens = new Set((frame.open ?? g.style.blockOpen).map(word));
        const closes = new Set((frame.close ?? g.style.blockClose).map(word));
        const err = enter('error', { message });
        try {
            let depth = 0;
            while (peek().k !== 'EOF') {
                const t = peek();
                const closing = [...closes].some(m => hit(t, m));
                if (depth === 0) {
                    if (closing && frame.close) return;
                    if (t.line > errLine && (frame.can(t) || (t.first && frames.some(f => f !== frame && f.can(t))))) return;
                }
                // Step A (b): inside a block being skipped, a line that starts an object is read, as an orphan.
                const rule = depth > 0 && t.first ? descentRule(t) : undefined;
                if (rule) {
                    const from = p;
                    const id = `t${counter + 1}`;
                    try {
                        object(rule);
                    } catch (e) {
                        if (!(e instanceof ParseFailure)) throw e;
                        record(e.error);
                    }
                    orphans.add(id);
                    for (let k = from; k < p && k < toks.length; k++) {
                        if ([...opens].some(m => hit(toks[k], m))) depth++;
                        else if ([...closes].some(m => hit(toks[k], m))) depth--;
                    }
                    if (depth < 0) depth = 0;
                    if (p === from) take();
                    continue;
                }
                if ([...opens].some(m => hit(t, m))) depth++;
                else if (closing && depth > 0) depth--;
                take();
            }
        } finally {
            leave(err);
            if (!err.children.length) cur().children.pop();
        }
    };
    /** The object rule a token starts by its keyword, for the descent into a skipped block; none for a positional class. */
    const descentRules = g.rules.filter((r): r is ObjectRule => r.t === 'object');
    const descentRule = (t: Token): string | undefined =>
        descentRules.find(r => [...first(r.body).set].some(m => m.includes(':') && hit(t, m)))?.name;
    /** Skips the current token, where a turn of a loop read nothing. */
    const skipOne = (message: string): void => {
        if (peek().k === 'EOF') { p++; return; }
        within('error', { message }, () => take());
    };

    const guarded = (frame: Frame, n: GrammarNode, o: MutableObject | undefined): void => {
        try {
            run(n, o);
        } catch (e) {
            if (!(e instanceof ParseFailure)) throw e;
            record(e.error);
            const cur = owner();
            if (cur) recovered.add(cur.id);
            sync(frame, e.error.line, e.error.message);
        }
    };

    const block = (n: Extract<GrammarNode, { t: 'block' }>, o: MutableObject): void => within('block', { closed: false }, b => {
        const items = n.items;
        const nullableAll = items.every(x => first(x).nullable);
        if (n.empty.length && n.empty.every((s, k) => hit(peek(k), word(s)))) {
            if (nullableAll) { for (const _ of n.empty) take('punctuation'); b.closed = true; return; }
            fail(describeMatchers(first({ t: 'seq', items }).set));
        }
        const opener = peek();
        if (!n.open.every((s, k) => hit(peek(k), word(s)))) {
            // Step A (a): a missing open before an item of the block, a missing empty block before what follows the object.
            const t = peek();
            const message = `expected ${either(describeMatchers([word(n.open[0])]))}; found ${describeToken(t)}`;
            if (t.k !== 'EOF' && items.some(x => canAt(x, t))) {
                record(errorAt(t, message));
                recovered.add(o.id);
                within('error', { message }, () => undefined);
            } else if (n.empty.length && nullableAll && (t.k === 'EOF' || (t.first && frames.some(f => f.can(t))) || closesBody(t))) {
                record(errorAt(t, message));
                recovered.add(o.id);
                within('error', { message }, () => undefined);
                return;
            } else if (n.open.length === 1 && t.k !== 'EOF' && hit(peek(1), word(n.open[0])) && peek(1).line === t.line) {
                record(errorAt(t, message));
                recovered.add(o.id);
                within('error', { message }, () => take());
                take('punctuation');
            } else for (const s of n.open) expect(word(s), 'punctuation');
        } else for (const s of n.open) expect(word(s), 'punctuation');
        const isClose = (): boolean => n.close.every((s, k) => hit(peek(k), word(s)));
        const frame: Frame = { can: t => items.some(x => canAt(x, t)), close: n.close, open: n.open };
        const enclosing = frames.slice();
        const since = objects.length;
        frames.push(frame);
        try {
            let i = 0;
            let stuck = -1;
            for (;;) {
                if (isClose()) break;
                // Every turn reads a token or ends the body; a turn that did neither skips one, so the loop always ends.
                if (p === stuck) { skipOne(errors[errors.length - 1]?.message ?? ''); continue; }
                stuck = p;
                const t = peek();
                let j = i;
                while (j < items.length && !can(items[j]) && first(items[j]).nullable) j++;
                if (j < items.length && can(items[j])) {
                    guarded(frame, items[j], o);
                    i = repeats(items[j]) ? j : j + 1;
                    continue;
                }
                const k = items.findIndex(x => can(x));
                if (k >= 0) {
                    const f = featureOf(items[k]);
                    const twice = f !== undefined && o.slots[f] !== undefined;
                    const after = featureOf(items[i - 1] ?? items[0]);
                    const e = errorAt(t, twice
                        ? (items[k].t === 'assign' ? `"${f}" holds one object only` : `"${f}" is given twice`)
                        : `"${f}" must come before "${after}"`);
                    record(e);
                    recovered.add(o.id);
                    if (twice) sync(frame, t.line, e.message);
                    else guarded(frame, items[k], o);
                    continue;
                }
                if (t.k === 'EOF' || (t.first && enclosing.some(f => f.can(t)))) {
                    record(errorAt(t, `expected "${n.close.join(' ')}" to close the "${n.open.join(' ')}" at ${opener.line}:${opener.col}; found ${describeToken(t)}`));
                    unclosed.add(o.id);
                    for (const x of objects.slice(since)) unclosed.add(x.id);
                    return;
                }
                const expected = describeMatchers(items.slice(i, j + 1).flatMap(x => [...first(x).set]));
                const e = errorAt(t, `expected ${either([...expected, ...(j === items.length ? [`"${n.close.join(' ')}"`] : [])])}; found ${describeToken(t)}`);
                record(e);
                recovered.add(o.id);
                sync(frame, t.line, e.message);
            }
            const missing = items.slice(i).find(x => !first(x).nullable);
            if (missing) {
                record(errorAt(peek(), `expected ${either(describeMatchers(first(missing).set))}; found ${describeToken(peek())}`));
                recovered.add(o.id);
            }
            for (const _ of n.close) take('punctuation');
            b.closed = true;
        } finally {
            frames.pop();
        }
    });

    /** An item node for a value of `feat`, unless the current node is one already, or a list of it. */
    const itemFor = <T>(feat: string, fn: () => T): T => {
        const c = cur();
        if ((c.kind === 'item' || c.kind === 'list') && c.feature === feat) return fn();
        return within('item', { feature: feat }, fn);
    };

    const run = (n: GrammarNode, o: MutableObject | undefined): void => {
        switch (n.t) {
            case 'seq':
                n.items.forEach((x, i) => {
                    // A class keyword is never inferred (step A, decision 2): its object is predicted by it.
                    if ((x.t === 'kw' || x.t === 'p') && !classKeywords.has(x) && !hit(peek(), word(x.text))) {
                        repair(word(x.text), x.t === 'kw' ? 'keyword' : 'punctuation', t => followsIn(n.items.slice(i + 1), t));
                    } else run(x, o);
                });
                return;
            case 'opt':
                if (can(n.item)) within('item', { feature: n.feat }, () => run(n.item, o));
                else if (n.derive && o) derives.set(o, n.derive);
                return;
            case 'star':
                while (can(n.item)) {
                    const before = p;
                    if (n.feat !== undefined) within('item', { feature: n.feat }, () => run(n.item, o));
                    else run(n.item, o);
                    if (p === before) return;
                }
                return;
            case 'alt': {
                const a = n.alts.find(can);
                if (!a) fail(describeMatchers(first(n).set));
                else run(a, o);
                return;
            }
            case 'kw': expect(word(n.text), classKeywords.has(n) ? 'class' : 'keyword'); return;
            case 'p': expect(word(n.text), 'punctuation'); return;
            case 'nl': return;
            case 'rule': object(n.name); return;
            case 'assign': {
                if (!o) throw new Error('an assignment outside an object');
                if (n.item.t === 'rule') {
                    const container = o;
                    const name = n.item.name;
                    itemFor(n.feat, () => object(name, id => { store(container, n.feat, n.op, id); contained.add(id); }));
                } else {
                    const item = n.item;
                    itemFor(n.feat, () => store(o, n.feat, n.op, value(item, o, n.feat)));
                }
                return;
            }
            case 'list': {
                if (!o) throw new Error('a list outside an object');
                within('list', { feature: n.feat }, () => {
                    if (!hit(peek(), word(n.open))) repair(word(n.open), 'punctuation', t => canAt(n.item, t) || hit(t, word(n.close)));
                    else take('punctuation');
                    if (!Array.isArray(o.slots[n.feat])) o.slots[n.feat] = [];
                    if (hit(peek(), word(n.close))) { take('punctuation'); return; }
                    run(n.item, o);
                    while (hit(peek(), word(n.separator))) { take('punctuation'); run(n.item, o); }
                    // A list left open at the end of its line is closed there.
                    if (!hit(peek(), word(n.close))) repair(word(n.close), 'punctuation', t => t.k === 'EOF' || t.first || closesBody(t));
                    else take('punctuation');
                });
                return;
            }
            case 'block': if (!o) throw new Error('a block outside an object'); block(n, o); return;
            case 'tok': case 'xref': case 'lit': throw new Error(`a ${n.t} node outside an assignment`);
        }
    };

    // The top level: any number of objects of the concrete classes (R-TXT-24 (a)).
    const top = model.body.t === 'star' ? model.body.item : model.body;
    const topFrame: Frame = { can: t => canAt(top, t) };
    frames.push(topFrame);
    while (peek().k !== 'EOF') {
        const t = peek();
        if (can(top)) { guarded(topFrame, top, undefined); continue; }
        const e = errorAt(t, `expected ${either(describeMatchers(first(top).set))}; found ${describeToken(t)}`);
        record(e);
        sync(topFrame, t.line, e.message);
        if (peek() === t) skipOne(e.message);
    }
    root.children.push(toks[toks.length - 1]);
    seal(root);

    const where = (id: string): string => {
        const n = nodeOf.get(id);
        const at = n ? toks.find(t => t.start === n.start) : undefined;
        return at ? `${at.line}:${at.col}` : id;
    };
    const refs: ParsedRef[] = [];
    const keep = new Set((options.keep ?? []).map(k => `${k.start}:${k.end}:${k.text}`));
    const syntaxCount = errors.length;
    // An orphan's container is unknown: it is no top-level object, and a path never starts at it.
    resolve(g, objects, new Set([...contained, ...orphans]), errors, recovered, where, r => {
        const tokenText = text.slice(r.at.start, r.endAt);
        return { start: r.at.start, end: r.endAt, text: tokenText, kept: keep.has(`${r.at.start}:${r.endAt}:${tokenText}`) };
    }, refs);

    // The lists of the result, derived from the tree: the object nodes in text order, their spans, their states.
    const byId = new Map(objects.map(o => [o.id, o]));
    const objectNodes: Building[] = [];
    const finish = (n: Building): void => {
        delete n.empty;
        if (n.kind === 'object') {
            objectNodes.push(n);
            n.state = recovered.has(n.id!) ? 'partial' : unclosed.has(n.id!) ? 'unclosed' : 'complete';
            if (orphans.has(n.id!)) n.orphan = true;
        }
        for (const c of n.children) if (c.kind !== 'token') finish(c);
    };
    finish(root);
    root.tokens = toks;
    const spans = objectNodes.map(n => ({ id: n.id!, start: n.start, end: n.end }));
    const isRecovered = (n: Building): boolean => n.state !== 'complete' || !!n.orphan;
    // Two tiers (step A): the syntax errors first; after one, a reference error may follow from it, and is a warning.
    const byStart = (a: TextParseError, b: TextParseError): number => a.start - b.start;
    const syntax = errors.slice(0, syntaxCount).sort(byStart);
    const linked = errors.slice(syntaxCount).sort(byStart);
    const cause = syntax[0];
    const tiers = [...syntax, ...(cause ? linked.map(e => ({ ...e, message: `${e.message} (may follow from the error at ${cause.line}:${cause.col})`, secondary: true as const, severity: 'warning' as const })) : linked)];
    return {
        objects: objectNodes.map(n => byId.get(n.id!)!), errors: tiers, recovered: objectNodes.filter(isRecovered).map(n => n.id!), spans, refs,
        unclosed: objectNodes.filter(n => n.state === 'unclosed').map(n => n.id!),
        tree: root as unknown as TextNode,
    };
}

/** Resolves every reference left as a `PendingRef` in the slots: by name (R-TXT-4), else by path (R-TXT-11); an outer one (R-TXT-32) is kept as its id. */
function resolve(g: ConcreteGrammar, objects: readonly MutableObject[], contained: ReadonlySet<string>, errors: TextParseError[], recovered: Set<string>, where: (id: string) => string,
                 tokenOf: (r: PendingRef) => { readonly start: number; readonly end: number; readonly text: string; readonly kept: boolean }, refs: ParsedRef[]): void {
    const byId = new Map(objects.map(o => [o.id, o]));
    const roots = objects.filter(o => !contained.has(o.id));
    const nameOf = (o: MutableObject): unknown => (g.objects[o.cls]?.named ? o.slots.name : undefined);
    // Linear resolution (step A): the objects by name and the roots by class, each list in text order, built once.
    const byName = new Map<unknown, MutableObject[]>();
    for (const o of objects) {
        const nm = nameOf(o);
        if (nm === undefined) continue;
        const list = byName.get(nm);
        if (list) list.push(o); else byName.set(nm, [o]);
    }
    const rootsOf = new Map<string, MutableObject[]>();
    for (const o of roots) {
        const list = rootsOf.get(o.cls);
        if (list) list.push(o); else rootsOf.set(o.cls, [o]);
    }

    const walk = (r: PendingRef): MutableObject | string => {
        const s = r.syntax;
        const targets = r.node.targets;
        if (s.name !== undefined) {
            const found = (byName.get(s.name) ?? []).filter(x => targets.includes(x.cls));
            if (found.length === 1) return found[0];
            if (found.length > 1) {
                const at = found.map(x => where(x.id)).join(', ');
                return `"${s.name}" is ambiguous: ${found.length} objects of type ${r.node.type} carry that name (${at}); write a path`;
            }
            return `no object of type ${r.node.type} is named "${s.name}"`;
        }
        return follow(s.segments ?? []);
    };
    // R-TXT-28: a path's first word is the printed keyword of a class the top level admits (printer.ts `pathKeyword`).
    const rulesByName = new Map(g.rules.map(r => [r.name, r]));
    const classesOf = (n: GrammarNode, seen: Set<string>): string[] => {
        switch (n.t) {
            case 'seq': return n.items.flatMap(x => classesOf(x, seen));
            case 'star': return classesOf(n.item, seen);
            case 'alt': return n.alts.flatMap(x => classesOf(x, seen));
            case 'rule': {
                if (seen.has(n.name)) return [];
                seen.add(n.name);
                const r = rulesByName.get(n.name);
                return r?.t === 'object' ? [r.cls] : r?.t === 'choice' ? classesOf(r.body, seen) : [];
            }
            default: return [];
        }
    };
    const model = g.rules.find(r => r.t === 'model');
    const topClasses = model ? [...new Set(classesOf(model.body, new Set()))] : [];
    const follow = (segments: readonly { readonly f: string; readonly index: number }[]): MutableObject | string => {
        const [head, ...rest] = segments;
        const named = topClasses.filter(c => pathKeyword(g, c) === head.f);
        // Two classes with one keyword at the top level are refused by the style check (distinct-classes); never pick one.
        if (named.length > 1) return `the path keyword "${head.f}" names ${named.length} classes: ${named.join(', ')}`;
        const cls = named[0];
        if (cls === undefined) {
            const renamed = topClasses.find(c => applyCase(c, g.classCase) === head.f || c === head.f);
            if (renamed !== undefined) return `a path starts with a class keyword: ${renamed} is written "${pathKeyword(g, renamed)}"`;
            return `a path starts with a class: there is no class "${head.f}"`;
        }
        const tops = rootsOf.get(cls) ?? [];
        if (!tops[head.index]) return `there is no top-level ${head.f}[${head.index}]: the text has ${tops.length}`;
        let cur: MutableObject = tops[head.index];
        for (const seg of rest) {
            // R-TXT-29: a later segment is a containment's printed keyword (printer.ts `featureKeyword`); two containments
            // with one keyword are refused by the style check (distinct-features), and never resolved to one of them.
            const cls = cur.cls;
            const containments = (g.objects[cls]?.features ?? []).filter(x => x.kind === 'containment');
            const keyed = containments.filter(x => featureKeyword(g, cls, x.name) === seg.f);
            if (keyed.length > 1) return `the path keyword "${seg.f}" names ${keyed.length} containments of ${cls}: ${keyed.map(x => x.name).join(', ')}`;
            const f: TextFeature | undefined = keyed[0];
            if (!f) {
                const renamed = containments.find(x => x.name === seg.f);
                if (renamed) return `a path segment is a feature keyword: ${renamed.owner}.${renamed.name} is written "${featureKeyword(g, cls, renamed.name)}"`;
                return `${cls} has no containment "${seg.f}"`;
            }
            const v: unknown = cur.slots[f.name];
            const id: unknown = f.many ? (Array.isArray(v) ? v[seg.index] : undefined) : seg.index === 0 ? v : undefined;
            if (!f.many && seg.index !== 0) return `"${seg.f}" holds one object: write ${seg.f}[0]`;
            const next: MutableObject | undefined = typeof id === 'string' ? byId.get(id) : undefined;
            if (!next) return `${seg.f}[${seg.index}] names no object`;
            cur = next;
        }
        return cur;
    };
    const pushRef = (r: PendingRef, x: ParsedRef): void => {
        refs.push(x);
        if (r.tree) r.tree.ref = x;
    };
    const fix = (r: PendingRef): string | OuterRef | undefined => {
        const tok = tokenOf(r);
        const token = { owner: r.owner.id, feature: r.feat, start: tok.start, end: tok.end, text: tok.text };
        if (r.syntax.outer !== undefined) {
            const outer: OuterRef = { outer: r.syntax.outer };
            pushRef(r, { ...token, outer: true, to: outer });
            return outer;
        }
        const t = walk(r);
        let message: string | undefined;
        if (typeof t === 'string') message = t;
        else if (!r.node.targets.includes(t.cls)) message = `"${r.feat}" expects ${r.node.type}; the reference names a ${t.cls}`;
        if (message === undefined && typeof t !== 'string') {
            pushRef(r, { ...token, outer: false, to: t.id });
            return t.id;
        }
        const error: TextParseError = { line: r.at.line, col: r.at.col, start: r.at.start, end: r.endAt, message: message ?? '' };
        pushRef(r, { ...token, outer: false, error });
        // R-TXT-35: a token the user did not retype is the diff's to keep or refuse; out of the slot, it is no error here.
        if (tok.kept) return undefined;
        errors.push(error);
        recovered.add(r.owner.id);
        return undefined;
    };
    for (const o of objects) {
        for (const [k, v] of Object.entries(o.slots)) {
            if (v instanceof PendingRef) {
                const id = fix(v);
                if (id === undefined) delete o.slots[k];
                else o.slots[k] = id;
            } else if (Array.isArray(v) && v.some(x => x instanceof PendingRef)) {
                o.slots[k] = v.map(x => (x instanceof PendingRef ? fix(x) : x)).filter(x => x !== undefined);
            }
        }
    }
}

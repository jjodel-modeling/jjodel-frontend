/**
 * The parser: a hand-written interpreter of the concrete grammar, with recovery (R-TXT-21 (1); step T2 of
 * docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.7). It walks the same data the printer walks
 * (concreteGrammar.ts), predicting each choice from the FIRST sets of the nodes, and gives back the objects in the shape
 * the printer takes (`{id, cls, slots}`), so that print, parse, print gives the same text.
 *
 * References are read as a name or a path (R-TXT-4, R-TXT-25 (5, 6)) and resolved after the parse, against the whole
 * text: a name must be unique among the instances of the reference's type; a path is `Class[k].f[i]...`, every segment
 * with its index, so a path never reads as a name. The top level
 * admits every concrete class (R-TXT-24 (a)); a single containment is a block of one object (R-TXT-24 (b)).
 *
 * Recovery: an error inside a body costs the rest of its line, the parse resumes at the next line that starts an item
 * of the same body or closes it; a body left open is closed where a line starts an item of an enclosing body. Objects
 * whose text was not read in full are listed in `recovered` and are never applied (R-TXT-21 (8)).
 */

import type { ConcreteGrammar, ConcreteRule, GrammarNode, ObjectRule } from './concreteGrammar';
import { applyCase } from './concreteGrammar';
import type { TextFeature, TextObject } from './metamodel';
import type { ObjectSpan } from './printer';

/** An error at `[start, end)` of the text; `line` and `col` are 1-based, of `start`. */
export interface TextParseError {
    readonly line: number;
    readonly col: number;
    readonly start: number;
    readonly end: number;
    readonly message: string;
}

export interface TextParseResult {
    /** In text order (an object before the objects it contains); ids `t1`, `t2`, ... */
    readonly objects: readonly TextObject[];
    /** In text order. */
    readonly errors: readonly TextParseError[];
    /** The ids of the objects whose text was not read in full, or whose references did not resolve (R-TXT-21 (8)). */
    readonly recovered: readonly string[];
    /** One per object, from its keyword to its last token read, in text order. */
    readonly spans: readonly ObjectSpan[];
}

/** R-TXT-21 (8): only a text read without any error may be applied. */
export const isApplicableParse = (r: TextParseResult): boolean => r.errors.length === 0 && r.recovered.length === 0;

type TokenKind = 'ID' | 'INT' | 'FLOAT' | 'STR' | 'P' | 'EOF';

interface Token {
    readonly k: TokenKind;
    /** The identifier, the punctuation, the number as written, or the string unescaped. */
    readonly v: string;
    readonly line: number;
    readonly col: number;
    readonly start: number;
    readonly end: number;
    /** No other token before it on its line. */
    readonly first: boolean;
}

const IDENT = /[A-Za-z_][A-Za-z0-9_]*/y;
const NUMBER = /-?\d+(\.\d+)?([eE][+-]?\d+)?/y;

function tokenize(g: ConcreteGrammar, text: string, errors: TextParseError[]): Token[] {
    const style = g.style;
    const puncts = [...new Set([
        ...style.blockOpen, ...style.blockClose, ...style.emptyBlock, ...style.assign, ...style.terminator,
        style.list.open, style.list.separator, style.list.close, '[', ']', '.',
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
        toks.push({ k, v, line, col: start - lineStart + 1, start, end, first: line !== lastLine });
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
            let j = i + 1;
            let v = '';
            let closed = false;
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
    toks.push({ k: 'EOF', v: '', line, col: i - lineStart + 1, start: i, end: i, first: line !== lastLine });
    return toks;
}

/** A token class: `ID`, `ID:x` (the identifier x), `P:x`, `STR`, `INT`, `FLOAT`. */
type Matcher = string;

interface First {
    readonly set: ReadonlySet<Matcher>;
    readonly nullable: boolean;
}

const hit = (t: Token, m: Matcher): boolean => {
    const c = m.indexOf(':');
    if (c < 0) return t.k === m;
    return t.k === m.slice(0, c) && t.v === m.slice(c + 1);
};
const word = (s: string): Matcher => (/^\w/.test(s) ? `ID:${s}` : `P:${s}`);

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

class ParseFailure extends Error {
    constructor(readonly error: TextParseError) { super(error.message); }
}

/** A reference as written, resolved after the parse: a name, or a path whose first segment is a class keyword. */
interface RefSyntax {
    readonly name?: string;
    readonly segments?: readonly { readonly f: string; readonly index: number }[];
}

class PendingRef {
    constructor(readonly node: Extract<GrammarNode, { t: 'xref' }>, readonly owner: MutableObject, readonly feat: string, readonly syntax: RefSyntax, readonly at: Token, readonly endAt: number) {}
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
export function parseText(text: string, g: ConcreteGrammar): TextParseResult {
    const errors: TextParseError[] = [];
    const toks = tokenize(g, text, errors);
    const rules = new Map<string, ConcreteRule>(g.rules.map(r => [r.name, r]));
    const model = g.rules.find(r => r.t === 'model');
    if (!model) throw new Error('the grammar has no Model rule');

    // FIRST sets and nullability, memoised per node; a rule reached again while computing is taken as empty.
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
            case 'xref': r = { set: new Set(['ID', 'STR']), nullable: false }; break;
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
    const canAt = (n: GrammarNode, t: Token): boolean => [...first(n).set].some(m => hit(t, m));

    let p = 0;
    const peek = (k = 0): Token => toks[Math.min(p + k, toks.length - 1)];
    const can = (n: GrammarNode): boolean => canAt(n, peek());
    const errorAt = (t: Token, message: string, end = t.end): TextParseError => ({ line: t.line, col: t.col, start: t.start, end, message });
    const fail = (expected: readonly string[], t: Token = peek()): never => {
        throw new ParseFailure(errorAt(t, `expected ${either(expected)}; found ${describeToken(t)}`));
    };
    const expect = (m: Matcher): Token => {
        if (hit(peek(), m)) return toks[p++];
        return fail(describeMatchers([m]));
    };
    const lastEnd = (): number => (p > 0 ? toks[p - 1].end : 0);

    const objects: MutableObject[] = [];
    const recovered = new Set<string>();
    const starts = new Map<string, number>();
    const ends = new Map<string, number>();
    const open: MutableObject[] = [];
    const frames: Frame[] = [];
    const contained = new Set<string>();
    let counter = 0;

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
        starts.set(o.id, peek().start);
        attach?.(o.id);
        open.push(o);
        try {
            run(rule.body, o);
        } catch (e) {
            recovered.add(o.id);
            throw e;
        } finally {
            open.pop();
            ends.set(o.id, Math.max(lastEnd(), starts.get(o.id) ?? 0));
        }
        return o.id;
    };

    const reference = (): RefSyntax => {
        const t = peek();
        if (t.k === 'STR') { p++; return { name: t.v }; }
        if (t.k !== 'ID') fail(['a reference (a name or a path)']);
        if (!hit(peek(1), 'P:[')) { p++; return { name: t.v }; }
        const segments: { f: string; index: number }[] = [];
        for (;;) {
            const f = expect('ID').v;
            expect('P:[');
            const index = Number(expect('INT').v);
            expect('P:]');
            segments.push({ f, index });
            if (!hit(peek(), 'P:.')) break;
            p++;
        }
        return { segments };
    };

    const value = (n: GrammarNode, o: MutableObject, feat: string): unknown => {
        const t = peek();
        switch (n.t) {
            case 'tok':
                switch (n.terminal) {
                    case 'INT': if (t.k === 'INT') { p++; return Number(t.v); } return fail(['an integer']);
                    case 'FLOAT': if (t.k === 'INT' || t.k === 'FLOAT') { p++; return Number(t.v); } return fail(['a number']);
                    case 'BOOL': if (t.k === 'ID' && (t.v === 'true' || t.v === 'false')) { p++; return t.v === 'true'; } return fail(['"true"', '"false"']);
                    case 'STRING': if (t.k === 'STR') { p++; return t.v; } return fail(['a string']);
                    case 'NAME': if (t.k === 'ID' || t.k === 'STR') { p++; return t.v; } return fail(['a name']);
                }
                return fail(['a value']);
            case 'lit': {
                const ls = literalsOf(n.rule);
                const l = t.k === 'ID' ? ls.find(x => applyCase(x, g.literalCase) === t.v) : undefined;
                if (l === undefined) return fail(ls.map(x => `"${applyCase(x, g.literalCase)}"`));
                p++;
                return l;
            }
            case 'xref': {
                const syntax = reference();
                return new PendingRef(n, o, feat, syntax, t, lastEnd());
            }
            default: break;
        }
        throw new Error(`a ${n.t} node is not a value`);
    };

    const featureOf = (n: GrammarNode): string | undefined => (n.t === 'opt' || n.t === 'star' || n.t === 'assign' || n.t === 'list' ? n.feat : undefined);

    /** Skips to the first token that can go on after an error at line `errLine`: it closes the frame, or it starts an item of this frame or of an enclosing one on a later line. */
    const sync = (frame: Frame, errLine: number): void => {
        const opens = new Set((frame.open ?? g.style.blockOpen).map(word));
        const closes = new Set((frame.close ?? g.style.blockClose).map(word));
        let depth = 0;
        while (peek().k !== 'EOF') {
            const t = peek();
            const closing = [...closes].some(m => hit(t, m));
            if (depth === 0) {
                if (closing && frame.close) return;
                if (t.line > errLine && (frame.can(t) || (t.first && frames.some(f => f !== frame && f.can(t))))) return;
            }
            if ([...opens].some(m => hit(t, m))) depth++;
            else if (closing && depth > 0) depth--;
            p++;
        }
    };

    const guarded = (frame: Frame, n: GrammarNode, o: MutableObject | undefined): void => {
        try {
            run(n, o);
        } catch (e) {
            if (!(e instanceof ParseFailure)) throw e;
            record(e.error);
            const cur = owner();
            if (cur) recovered.add(cur.id);
            sync(frame, e.error.line);
        }
    };

    const block = (n: Extract<GrammarNode, { t: 'block' }>, o: MutableObject): void => {
        const items = n.items;
        const nullableAll = items.every(x => first(x).nullable);
        if (n.empty.length && n.empty.every((s, k) => hit(peek(k), word(s)))) {
            if (nullableAll) { p += n.empty.length; return; }
            fail(describeMatchers(first({ t: 'seq', items }).set));
        }
        const opener = peek();
        for (const s of n.open) expect(word(s));
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
                if (p === stuck) { p++; continue; }
                stuck = p;
                const t = peek();
                let j = i;
                while (j < items.length && !can(items[j]) && first(items[j]).nullable) j++;
                if (j < items.length && can(items[j])) {
                    guarded(frame, items[j], o);
                    i = items[j].t === 'star' ? j : j + 1;
                    continue;
                }
                const k = items.findIndex(x => can(x));
                if (k >= 0) {
                    const f = featureOf(items[k]);
                    const twice = f !== undefined && o.slots[f] !== undefined;
                    const after = featureOf(items[i - 1] ?? items[0]);
                    record(errorAt(t, twice
                        ? (items[k].t === 'assign' ? `"${f}" holds one object only` : `"${f}" is given twice`)
                        : `"${f}" must come before "${after}"`));
                    recovered.add(o.id);
                    if (twice) sync(frame, t.line);
                    else guarded(frame, items[k], o);
                    continue;
                }
                if (t.k === 'EOF' || (t.first && enclosing.some(f => f.can(t)))) {
                    record(errorAt(t, `expected "${n.close.join(' ')}" to close the "${n.open.join(' ')}" at ${opener.line}:${opener.col}; found ${describeToken(t)}`));
                    recovered.add(o.id);
                    for (const x of objects.slice(since)) recovered.add(x.id);
                    return;
                }
                const expected = describeMatchers(items.slice(i, j + 1).flatMap(x => [...first(x).set]));
                record(errorAt(t, `expected ${either([...expected, ...(j === items.length ? [`"${n.close.join(' ')}"`] : [])])}; found ${describeToken(t)}`));
                recovered.add(o.id);
                sync(frame, t.line);
            }
            const missing = items.slice(i).find(x => !first(x).nullable);
            if (missing) {
                record(errorAt(peek(), `expected ${either(describeMatchers(first(missing).set))}; found ${describeToken(peek())}`));
                recovered.add(o.id);
            }
            p += n.close.length;
        } finally {
            frames.pop();
        }
    };

    const run = (n: GrammarNode, o: MutableObject | undefined): void => {
        switch (n.t) {
            case 'seq': for (const x of n.items) run(x, o); return;
            case 'opt': if (can(n.item)) run(n.item, o); return;
            case 'star':
                while (can(n.item)) {
                    const before = p;
                    run(n.item, o);
                    if (p === before) return;
                }
                return;
            case 'alt': {
                const a = n.alts.find(can);
                if (!a) fail(describeMatchers(first(n).set));
                else run(a, o);
                return;
            }
            case 'kw': case 'p': expect(word(n.text)); return;
            case 'nl': return;
            case 'rule': object(n.name); return;
            case 'assign': {
                if (!o) throw new Error('an assignment outside an object');
                if (n.item.t === 'rule') {
                    const container = o;
                    object(n.item.name, id => { store(container, n.feat, n.op, id); contained.add(id); });
                } else {
                    store(o, n.feat, n.op, value(n.item, o, n.feat));
                }
                return;
            }
            case 'list': {
                if (!o) throw new Error('a list outside an object');
                expect(word(n.open));
                if (!Array.isArray(o.slots[n.feat])) o.slots[n.feat] = [];
                if (hit(peek(), word(n.close))) { p++; return; }
                run(n.item, o);
                while (hit(peek(), word(n.separator))) { p++; run(n.item, o); }
                expect(word(n.close));
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
        record(errorAt(t, `expected ${either(describeMatchers(first(top).set))}; found ${describeToken(t)}`));
        sync(topFrame, t.line);
        if (peek() === t) p++;
    }

    const where = (id: string): string => {
        const at = toks.find(t => t.start === starts.get(id));
        return at ? `${at.line}:${at.col}` : id;
    };
    resolve(g, objects, contained, errors, recovered, where);

    const spans = objects.map(o => ({ id: o.id, start: starts.get(o.id) ?? 0, end: ends.get(o.id) ?? 0 }));
    errors.sort((a, b) => a.start - b.start);
    return { objects, errors, recovered: objects.filter(o => recovered.has(o.id)).map(o => o.id), spans };
}

/** Resolves every reference left as a `PendingRef` in the slots: by name (R-TXT-4), else by path (R-TXT-11). */
function resolve(g: ConcreteGrammar, objects: readonly MutableObject[], contained: ReadonlySet<string>, errors: TextParseError[], recovered: Set<string>, where: (id: string) => string): void {
    const byId = new Map(objects.map(o => [o.id, o]));
    const roots = objects.filter(o => !contained.has(o.id));
    const nameOf = (o: MutableObject): unknown => (g.objects[o.cls]?.named ? o.slots.name : undefined);

    const walk = (r: PendingRef): MutableObject | string => {
        const s = r.syntax;
        const targets = r.node.targets;
        if (s.name !== undefined) {
            const found = objects.filter(x => targets.includes(x.cls) && nameOf(x) === s.name);
            if (found.length === 1) return found[0];
            if (found.length > 1) {
                const at = found.map(x => where(x.id)).join(', ');
                return `"${s.name}" is ambiguous: ${found.length} objects of type ${r.node.type} carry that name (${at}); write a path`;
            }
            return `no object of type ${r.node.type} is named "${s.name}"`;
        }
        return follow(s.segments ?? []);
    };
    const follow = (segments: readonly { readonly f: string; readonly index: number }[]): MutableObject | string => {
        const [head, ...rest] = segments;
        const cls = Object.values(g.objects).find(k => applyCase(k.cls, g.classCase) === head.f)?.cls;
        if (cls === undefined) return `a path starts with a class: there is no class "${head.f}"`;
        const tops = roots.filter(o => o.cls === cls);
        if (!tops[head.index]) return `there is no top-level ${head.f}[${head.index}]: the text has ${tops.length}`;
        let cur: MutableObject = tops[head.index];
        for (const seg of rest) {
            const f: TextFeature | undefined = g.objects[cur.cls]?.features.find(x => x.name === seg.f);
            if (!f || f.kind !== 'containment') return `${cur.cls} has no containment "${seg.f}"`;
            const v: unknown = cur.slots[seg.f];
            const id: unknown = f.many ? (Array.isArray(v) ? v[seg.index] : undefined) : seg.index === 0 ? v : undefined;
            if (!f.many && seg.index !== 0) return `"${seg.f}" holds one object: write ${seg.f}[0]`;
            const next: MutableObject | undefined = typeof id === 'string' ? byId.get(id) : undefined;
            if (!next) return `${seg.f}[${seg.index}] names no object`;
            cur = next;
        }
        return cur;
    };
    const fix = (r: PendingRef): string | undefined => {
        const t = walk(r);
        let message: string | undefined;
        if (typeof t === 'string') message = t;
        else if (!r.node.targets.includes(t.cls)) message = `"${r.feat}" expects ${r.node.type}; the reference names a ${t.cls}`;
        if (message === undefined && typeof t !== 'string') return t.id;
        errors.push({ line: r.at.line, col: r.at.col, start: r.at.start, end: r.endAt, message: message ?? '' });
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

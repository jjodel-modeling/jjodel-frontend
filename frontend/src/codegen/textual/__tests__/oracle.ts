/**
 * The unambiguity oracle of the style check (R-TXT-21 (1), docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.4, §A.7 step T3): the concrete grammar as a nearley grammar, which returns every parse, and a generator of
 * sentences of the concrete grammar. A sample with exactly one parse is unambiguous; nearley stays in test code.
 */

import nearley from 'nearley';
import type { ConcreteGrammar, ConcreteRule, GrammarNode } from '../concreteGrammar';

interface Tok { readonly kind: 'word' | 'int' | 'float' | 'string' | 'punct'; readonly value: string }

const isWord = (s: string): boolean => /^\w/.test(s);
const WORD = /^[A-Za-z_][A-Za-z0-9_]*/;
const NUMBER = /^-?\d+(\.\d+([eE][-+]?\d+)?)?/;

/** The tokens of a text in the grammar's style: words, numbers, quoted strings, the style's punctuation; comments skipped. */
export function tokenize(g: ConcreteGrammar, text: string): Tok[] {
    const s = g.style;
    const puncts = [...new Set([...s.blockOpen, ...s.blockClose, ...s.emptyBlock, ...s.assign, ...s.terminator, s.list.open, s.list.separator, s.list.close, '.', '[', ']'])]
        .filter(p => p && !isWord(p)).sort((a, b) => b.length - a.length);
    const out: Tok[] = [];
    let i = 0;
    while (i < text.length) {
        const rest = text.slice(i);
        const ws = /^\s+/.exec(rest);
        if (ws) { i += ws[0].length; continue; }
        if (s.comments.line && rest.startsWith(s.comments.line)) { const nl = rest.indexOf('\n'); i += nl < 0 ? rest.length : nl; continue; }
        if (s.comments.block && rest.startsWith(s.comments.block[0])) {
            const end = rest.indexOf(s.comments.block[1], s.comments.block[0].length);
            if (end < 0) throw new Error(`unterminated comment at ${i}`);
            i += end + s.comments.block[1].length;
            continue;
        }
        const q = s.string.quote;
        if (rest.startsWith(q)) {
            let j = q.length;
            let body = '';
            for (;;) {
                if (j >= rest.length) throw new Error(`unterminated string at ${i}`);
                if (s.string.escape === 'backslash' && rest[j] === '\\') { body += rest.slice(j, j + 2); j += 2; continue; }
                if (rest.startsWith(q, j)) {
                    if (s.string.escape === 'double' && rest.startsWith(q, j + q.length)) { body += q; j += 2 * q.length; continue; }
                    break;
                }
                body += rest[j++];
            }
            out.push({ kind: 'string', value: body });
            i += j + q.length;
            continue;
        }
        const num = NUMBER.exec(rest);
        if (num && !(rest[0] === '-' && puncts.some(p => rest.startsWith(p)))) {
            out.push({ kind: num[0].includes('.') ? 'float' : 'int', value: num[0] });
            i += num[0].length;
            continue;
        }
        const w = WORD.exec(rest);
        if (w) { out.push({ kind: 'word', value: w[0] }); i += w[0].length; continue; }
        const p = puncts.find(x => rest.startsWith(x));
        if (!p) throw new Error(`no token at ${i}: ${JSON.stringify(rest.slice(0, 10))}`);
        out.push({ kind: 'punct', value: p });
        i += p.length;
    }
    return out;
}

type Sym = string | { readonly test: (t: Tok) => boolean };

const word = (text: string): Sym => ({ test: t => t.kind === 'word' && t.value === text });
const punct = (text: string): Sym => ({ test: t => t.kind === 'punct' && t.value === text });
const styleToken = (text: string): Sym => (isWord(text) ? word(text) : punct(text));
const kind = (k: Tok['kind']): Sym => ({ test: t => t.kind === k });

/** The concrete grammar as nearley rules; rule names are the concrete ones, terminals and helpers start with `$`. */
export function nearleyGrammarOf(g: ConcreteGrammar): nearley.Grammar {
    const rules: nearley.ParserRule[] = [];
    const add = (name: string, symbols: readonly Sym[]): void => { rules.push({ name, symbols: [...symbols] }); };
    let fresh = 0;
    const helper = (): string => `$${fresh++}`;
    const reserved = new Set(g.style.reservedNames);

    add('$NAME', [{ test: t => t.kind === 'word' && !reserved.has(t.value) }]);
    add('$NAME', [kind('string')]);
    add('$INT', [kind('int')]);
    add('$FLOAT', [kind('float')]);
    add('$FLOAT', [kind('int')]);
    add('$BOOL', [word('true')]);
    add('$BOOL', [word('false')]);
    add('$STRING', [kind('string')]);
    // R-TXT-4, R-TXT-25 (5, 6): a name, or a path of segments `C[k]`, `f[i]` joined by dots.
    add('$REF', ['$NAME']);
    add('$REF', ['$refPath']);
    add('$refPath', ['$refSeg']);
    add('$refPath', ['$refPath', punct('.'), '$refSeg']);
    add('$refSeg', [kind('word'), punct('['), kind('int'), punct(']')]);

    const symbols = (n: GrammarNode): Sym[] => {
        switch (n.t) {
            case 'seq': return n.items.flatMap(symbols);
            case 'opt': { const h = helper(); add(h, []); add(h, symbols(n.item)); return [h]; }
            case 'star': { const h = helper(); add(h, []); add(h, [h, ...symbols(n.item)]); return [h]; }
            case 'alt': { const h = helper(); for (const a of n.alts) add(h, symbols(a)); return [h]; }
            case 'kw': return [word(n.text)];
            case 'p': return [punct(n.text)];
            case 'tok': return [`$${n.terminal}`];
            case 'xref': return ['$REF'];
            case 'lit': return [n.rule];
            case 'rule': return [n.name];
            case 'assign': return symbols(n.item);
            case 'list': {
                const h = helper();
                const items = helper();
                add(h, [styleToken(n.open), styleToken(n.close)]);
                add(h, [styleToken(n.open), items, styleToken(n.close)]);
                add(items, symbols(n.item));
                add(items, [items, styleToken(n.separator), ...symbols(n.item)]);
                return [h];
            }
            case 'block': {
                const h = helper();
                add(h, [...n.open.map(styleToken), ...n.items.flatMap(symbols), ...n.close.map(styleToken)]);
                if (n.empty.join(' ') !== [...n.open, ...n.close].join(' ')) add(h, n.empty.map(styleToken));
                return [h];
            }
            case 'nl': return [];
        }
    };
    for (const r of g.rules) add(r.name, symbols(r.body));
    return nearley.Grammar.fromCompiled({ ParserRules: rules, ParserStart: 'Model' });
}

/** The number of parses nearley finds for a text, through a lexer over `tokenize`. */
export function parseCount(g: ConcreteGrammar, text: string, grammar: nearley.Grammar = nearleyGrammarOf(g)): number {
    const toks = tokenize(g, text);
    let at = 0;
    const lexer: nearley.Lexer = {
        reset: () => { at = 0; },
        next: () => toks[at++] as unknown as nearley.Token | undefined,
        save: () => ({}),
        formatError: (_t, message) => `${message} at token ${at}`,
    };
    const parser = new nearley.Parser(nearley.Grammar.fromCompiled({ ParserRules: grammar.rules, ParserStart: grammar.start, Lexer: lexer }));
    try {
        parser.feed(text);
    } catch {
        return 0;
    }
    return parser.results.length;
}

export interface Sample {
    readonly text: string;
    /**
     * What the sample went through: rule names, `C.f` per feature present, `C.f*` per containment repeated, `C.f,` per
     * list separator, `E=lit` per literal, `Ch>C` per alternative of a choice.
     */
    readonly covered: ReadonlySet<string>;
}

const MAX_DEPTH = 2;

/**
 * Sentences of the concrete grammar, from its own rules: for each class, its body with every feature, with each single
 * feature, and with none; and every alternative of every choice and enumeration, by cycling through them over as many
 * rounds of full bodies as the longest alternation has alternatives. Containments nest to depth two. Names, references,
 * strings and numbers rotate through values that stress the style (keywords as names, paths, quotes, escapes).
 */
export function generateSamples(g: ConcreteGrammar): Sample[] {
    const s = g.style;
    const named = (name: string): ConcreteRule[] => g.rules.filter(r => r.name === name);
    const keywords = [...new Set(g.rules.flatMap(r => (r.t === 'object' ? [r.cls, ...r.features.map(f => f.name)] : [])))];
    const quote = (v: string): string => {
        const q = s.string.quote;
        return q + (s.string.escape === 'double' ? v.split(q).join(q + q) : v.replace(/\\/g, '\\\\').split(q).join(`\\${q}`).replace(/\n/g, '\\n')) + q;
    };
    const asName = (v: string): string => (WORD.exec(v)?.[0] === v && !s.reservedNames.includes(v) ? v : quote(v));
    const pools: Record<string, readonly string[]> = {
        NAME: ['n1', ...keywords, 'has space', 'true'].map(asName),
        INT: ['0', '7', '-3'],
        FLOAT: ['1.5', '2', '-0.25'],
        BOOL: ['true', 'false'],
        STRING: ['top', 'say "hi" \\ bye', 'line1\nline2', ''].map(quote),
        REF: ['x', 'size', 'Sys[0].parts[1]', 'Car[0].wheels[0].bolts[0]', 'Box[0].inner[0].label[0]', 'has space', 'Part[2]'].map(v => (/[.[]/.test(v) ? v : asName(v))),
    };
    const counters = new Map<object, number>();
    const next = (key: object, mod: number): number => {
        const k = counters.get(key) ?? 0;
        counters.set(key, k + 1);
        return k % mod;
    };
    const pick = (pool: string): string => pools[pool][next(pools[pool], pools[pool].length)];
    const containsRule = (n: GrammarNode): boolean => {
        switch (n.t) {
            case 'rule': return true;
            case 'seq': return n.items.some(containsRule);
            case 'opt': case 'star': case 'assign': case 'list': return containsRule(n.item);
            case 'alt': return n.alts.some(containsRule);
            case 'block': return n.items.some(containsRule);
            default: return false;
        }
    };

    /** `only`: at the top object, the index of the one optional part present, the name first (`null`: none; `undefined`: all). */
    const sample = (root: ConcreteRule, only?: number | null): Sample => {
        const covered = new Set<string>(['Model']);
        const toks: string[] = [];
        let topOpt = 0;
        const walk = (n: GrammarNode, depth: number, cls: string | undefined, top: boolean): void => {
            switch (n.t) {
                case 'seq': for (const x of n.items) walk(x, depth, cls, top); return;
                case 'opt': {
                    const wanted = top && only !== undefined ? topOpt++ === only : !(depth >= MAX_DEPTH && containsRule(n.item));
                    if (!wanted) return;
                    covered.add(`${cls}.${n.feat}`);
                    walk(n.item, depth, cls, top);
                    return;
                }
                case 'star': {
                    const k = depth < MAX_DEPTH ? 2 : 0;
                    for (let i = 0; i < k; i++) walk(n.item, depth, cls, top);
                    if (k > 1) covered.add(`${cls}.${n.feat}*`);
                    return;
                }
                case 'alt': walk(n.alts[next(n, n.alts.length)], depth, cls, top); return;
                case 'kw': case 'p': toks.push(n.text); return;
                case 'tok': toks.push(pick(n.terminal)); return;
                case 'xref': toks.push(pick('REF')); return;
                case 'lit': case 'rule': for (const r of named(n.t === 'lit' ? n.rule : n.name)) rule(r, depth + (r.t === 'object' ? 1 : 0)); return;
                case 'assign': walk(n.item, depth, cls, top); return;
                case 'list': {
                    const k = next(n, 3);
                    toks.push(n.open);
                    for (let i = 0; i < 2 - k; i++) { if (i) { toks.push(n.separator); covered.add(`${cls}.${n.feat},`); } walk(n.item, depth, cls, top); }
                    toks.push(n.close);
                    return;
                }
                case 'block': {
                    const at = toks.length;
                    for (const x of n.items) walk(x, depth, cls, top);
                    const body = toks.splice(at);
                    if (body.length) toks.push(...n.open, ...body, ...n.close);
                    else toks.push(...(next(n, 2) ? [...n.open, ...n.close] : n.empty));
                    return;
                }
                case 'nl': toks.push('\n'); return;
            }
        };
        const rule = (r: ConcreteRule, depth: number): void => {
            covered.add(r.name);
            if (r.t === 'object') { walk(r.body, depth, r.cls, depth === 0); return; }
            if (r.body.t !== 'alt') { walk(r.body, depth, undefined, false); return; }
            const i = next(r.body, r.body.alts.length);
            const a = r.body.alts[i];
            covered.add(r.t === 'enum' ? `${r.name}=${r.literals[i]}` : `${r.name}>${a.t === 'rule' ? a.name : i}`);
            walk(a, depth, undefined, false);
        };
        rule(root, 0);
        return { text: toks.join(' ').replace(/ ?\n ?/g, '\n'), covered };
    };

    const roots = g.rules.flatMap(r => (r.t === 'object' ? [r] : []));
    const rounds = Math.max(1, ...g.rules.map(r => (r.body.t === 'alt' ? r.body.alts.length : 1)));
    const out: Sample[] = [];
    for (let i = 0; i < rounds; i++) for (const r of roots) out.push(sample(r));
    for (const r of roots) {
        out.push(sample(r, null));
        for (let i = 0; i < r.features.length + (r.named ? 1 : 0); i++) out.push(sample(r, i));
    }
    if (roots.length > 1) out.push({ text: out.slice(0, roots.length).map(x => x.text).join('\n'), covered: new Set(out.slice(0, roots.length).flatMap(x => [...x.covered])) });
    return out;
}

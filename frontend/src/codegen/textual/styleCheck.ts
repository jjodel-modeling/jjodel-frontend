/**
 * The style check (R-TXT-16, step T3 of docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.7): a style is
 * shown unambiguous once, and this is its mechanical guard per metamodel, read off the concrete grammar the style gives
 * that metamodel's base grammar. It checks the two conditions of §A.2, (i) and (ii), case injectivity (R-TXT-21 (10)),
 * and the token conditions §A.2's C-like argument rests on: a close cannot start an item, a name cannot be read as a
 * style word, a list token cannot continue a reference path. The oracle that counts parses (R-TXT-21 (1)) is nearley,
 * in the tests only. On a grammar derived with syntax annotations (step T4) it also reports what the annotations' resolution
 * and the derivation refused, and checks the grammar is LL(1): an annotation can make a style's argument fail locally.
 */

import type { ConcreteGrammar, ExprOperator, GrammarNode, ObjectRule } from './concreteGrammar';
import type { Matcher } from './parser';
import { firstSetsOf, word } from './parser';
import { featureKeyword } from './printer';

export type StyleRule =
    /** §A.2 (i): the feature keywords of a class are distinct, inherited ones included. */
    | 'distinct-features'
    /** §A.2 (ii): the classes that can stand at one position (the top level, a choice) have distinct keywords. */
    | 'distinct-classes'
    /** R-TXT-21 (10): the printed literals of an enumeration are distinct, and the style's case folds no class keyword onto a style word. */
    | 'case-injective'
    /** A style token that is a word is reserved in name positions, so that a name never reads as it (§A.2, Pascal/Ada). */
    | 'reserved-words'
    /** A free-layout block has an opening and a closing token, and neither equals a keyword: a close never starts an item. */
    | 'block-delimiters'
    /** The list tokens are distinct, and neither the separator nor the close continues a reference path (R-TXT-11). */
    | 'list-tokens'
    /** The item terminator occurs inside no item: it is where the parser's recovery resynchronises (§A.2, R-TXT-21 (1)). */
    | 'terminator'
    /** No style token, comment opener or string quote starts with `@`: it starts a reference outside the text (R-TXT-32). */
    | 'outer-reference'
    /** The syntax annotations resolve and apply, and the grammar they give is LL(1) (step T4). */
    | 'annotations'
    /** Step C lane C1a: a symbol has one fixity in an expression. */
    | 'operator-fixity'
    /** Two operator classes of an expression do not share a symbol. */
    | 'operator-symbols'
    /** A symbol is no style token, no token of the expression or of a reference, no prefix of a comment opener or a punctuation token, and starts no comment. */
    | 'operator-tokens'
    /** An infix symbol cannot follow an expression: after an operand it always continues the expression. */
    | 'operator-follow'
    /** A call word is not the keyword of another class, not a symbol, not a style word, and the call word of one class only. */
    | 'call-words';

/** Every rule the check evaluates, in the order of its findings. */
export const STYLE_RULES: readonly StyleRule[] = ['distinct-features', 'distinct-classes', 'case-injective', 'reserved-words', 'block-delimiters', 'list-tokens', 'terminator', 'outer-reference', 'annotations',
    'operator-fixity', 'operator-symbols', 'operator-tokens', 'operator-follow', 'call-words'];

export interface StyleFinding {
    /** `ok`: the rule holds. `notice`: it holds after a fallback the author did not ask for. `error`: it fails. */
    readonly level: 'ok' | 'notice' | 'error';
    readonly rule: StyleRule;
    /** The class (`class C`), feature (`C.f`), rule or style parameter (`style.blockOpen`) at fault; empty for an `ok`. */
    readonly where: string;
    readonly message: string;
}

const isWord = (s: string): boolean => /^\w/.test(s);

/** The class keyword of an object rule, as the style's case printed it. */
function headKeyword(r: ObjectRule): string {
    const first = r.body.t === 'seq' ? r.body.items[0] : r.body;
    return first?.t === 'kw' ? first.text : '';
}

/** The items of an object rule's body: one `opt` per feature, in R-TXT-1 order; a one-line class has them after its head. */
function bodyItems(r: ObjectRule): readonly GrammarNode[] {
    const last = r.body.t === 'seq' ? r.body.items[r.body.items.length - 1] : undefined;
    if (last?.t === 'block') return last.items;
    // C1d: a required inline child of a one-line head with an optional name is a sequence, not an opt.
    return r.body.t === 'seq' ? r.body.items.filter(x => x.t === 'opt' || x.t === 'seq') : [];
}

/** The keyword a body item starts with, and the feature it sets: a punctuation keyword too, and the per-item keyword of a star (C1d). */
function itemKeyword(n: GrammarNode): { readonly kw: string; readonly feat: string } | undefined {
    const body = n.t === 'opt' ? n.item : n.t === 'seq' ? n : undefined;
    if (!body) return undefined;
    const first = body.t === 'seq' ? body.items.find(x => x.t !== 'nl') : body;
    if (first?.t === 'star' && first.feat !== undefined) {
        const inner = first.item.t === 'seq' ? first.item.items[0] : first.item;
        return inner?.t === 'kw' ? { kw: inner.text, feat: first.feat } : undefined;
    }
    const feat = n.t === 'opt' ? n.feat : body.t === 'seq' ? body.items.flatMap(x => (x.t === 'assign' ? [x.feat] : []))[0] : undefined;
    return feat !== undefined && (first?.t === 'kw' || first?.t === 'p') ? { kw: first.text, feat } : undefined;
}

/** Checks a concrete grammar; one `ok` for each rule without a notice or an error. */
export function checkStyle(g: ConcreteGrammar): StyleFinding[] {
    const s = g.style;
    const out: StyleFinding[] = [];
    const error = (rule: StyleRule, where: string, message: string): void => { out.push({ level: 'error', rule, where, message }); };
    const objectRules = g.rules.flatMap(r => (r.t === 'object' ? [r] : []));

    // §A.2 (i).
    for (const r of objectRules) {
        const items = new Map<string, string[]>();
        for (const it of bodyItems(r).map(itemKeyword)) if (it) items.set(it.kw, [...(items.get(it.kw) ?? []), it.feat]);
        for (const [kw, feats] of items) {
            const n = feats.length;
            if (n < 2) continue;
            // C1d: the features the keyword starts, which an item keyword or a punctuation keyword does not name.
            const owners = r.features.filter(f => feats.includes(f.name)).map(f => `${f.owner}.${f.name}`);
            error('distinct-features', `class ${r.cls}`, `the keyword "${kw}" starts ${n} features: ${owners.join(', ')}`);
        }
    }
    // R-TXT-29: a path segment names a containment by its printed keyword, the feature name when it prints none; so a
    // dropped or inline containment can share its segment with another one's keyword, which no item keyword shows.
    for (const r of Object.values(g.objects)) {
        const byKw = new Map<string, string[]>();
        for (const f of r.features) {
            if (f.kind !== 'containment') continue;
            const kw = featureKeyword(g, r.cls, f.name);
            byKw.set(kw, [...(byKw.get(kw) ?? []), `${f.owner}.${f.name}`]);
        }
        for (const [kw, fs] of byKw) {
            if (fs.length > 1) error('distinct-features', `class ${r.cls}`, `the path keyword "${kw}" names ${fs.length} containments: ${fs.join(', ')}`);
        }
    }

    // §A.2 (ii): the object rules a rule name stands for, through choices; a homonymous class is one more rule of that name.
    const objectsNamed = (name: string, seen: Set<string> = new Set()): ObjectRule[] => {
        if (seen.has(name)) return [];
        seen.add(name);
        return g.rules.filter(r => r.name === name).flatMap(r => {
            if (r.t === 'object') return [r];
            if (r.t === 'choice' && r.body.t === 'alt') return r.body.alts.flatMap(a => (a.t === 'rule' ? objectsNamed(a.name, seen) : []));
            return [];
        });
    };
    const positions: [string, readonly GrammarNode[]][] = [];
    for (const r of g.rules) {
        if (r.t === 'model' && r.body.t === 'star' && r.body.item.t === 'seq' && r.body.item.items[0]?.t === 'alt') positions.push(['Model', r.body.item.items[0].alts]);
        if (r.t === 'choice' && r.body.t === 'alt') positions.push([r.name, r.body.alts]);
    }
    for (const [where, alts] of positions) {
        const byKw = new Map<string, Set<ObjectRule>>();
        for (const a of alts) {
            if (a.t !== 'rule') continue;
            for (const o of objectsNamed(a.name)) byKw.set(headKeyword(o), (byKw.get(headKeyword(o)) ?? new Set()).add(o));
        }
        for (const [kw, os] of byKw) {
            if (os.size > 1) error('distinct-classes', where, `the keyword "${kw}" starts ${os.size} classes: ${[...os].map(o => o.cls).join(', ')}`);
        }
    }

    // Case injectivity. The fallback of R-TXT-21 (10), applied by the derivation, is a notice; what it leaves merged is an error.
    for (const n of g.notices) out.push({ level: 'notice', rule: 'case-injective', where: `style ${s.id}`, message: n.message });
    for (const r of g.rules) {
        if (r.t !== 'enum' || r.body.t !== 'alt') continue;
        const printed = r.body.alts.flatMap(a => (a.t === 'kw' ? [a.text] : []));
        const merged = printed.filter((p, i) => printed.indexOf(p) !== i);
        if (merged.length) error('case-injective', `enumeration ${r.name}`, `the literals print the same: ${[...new Set(merged)].join(', ')}`);
    }
    const styleTokens: [string, readonly string[]][] = [
        ['blockOpen', s.blockOpen], ['blockClose', s.blockClose], ['emptyBlock', s.emptyBlock], ['assign', s.assign], ['terminator', s.terminator],
        ['list.open', [s.list.open]], ['list.separator', [s.list.separator]], ['list.close', [s.list.close]],
    ];
    const words = new Set(styleTokens.flatMap(([, ts]) => ts.filter(isWord)));
    /** A class keyword that equals a style word only because the case folded it: reported here, not under block-delimiters. */
    const foldedOntoWord = (r: ObjectRule): boolean => headKeyword(r) !== r.cls && words.has(headKeyword(r)) && !words.has(r.cls);
    for (const r of objectRules) {
        if (foldedOntoWord(r)) error('case-injective', `class ${r.cls}`, `case ${g.classCase} folds the keyword of ${r.cls} onto the style word "${headKeyword(r)}"`);
    }

    for (const [param, ts] of styleTokens) {
        for (const t of ts) {
            if (isWord(t) && !s.reservedNames.includes(t)) error('reserved-words', `style.${param}`, `"${t}" is a word and not reserved: a name "${t}" would read as this token`);
        }
    }

    // Block delimiters: a keyword equal to a block token makes the close (or the open) start an item.
    if (s.blockOpen.length === 0) error('block-delimiters', 'style.blockOpen', 'a free-layout block needs an opening token');
    if (s.blockClose.length === 0) error('block-delimiters', 'style.blockClose', 'a free-layout block needs a closing token');
    const blockTokens = new Set([...s.blockOpen, ...s.blockClose, ...s.emptyBlock]);
    for (const r of objectRules) {
        if (blockTokens.has(headKeyword(r)) && !foldedOntoWord(r)) error('block-delimiters', `class ${r.cls}`, `the class keyword "${headKeyword(r)}" is a block token`);
        for (const it of bodyItems(r).map(itemKeyword)) {
            if (it && blockTokens.has(it.kw)) error('block-delimiters', `${r.cls}.${it.feat}`, `the feature keyword "${it.kw}" is a block token`);
        }
    }

    // Lists: after an item comes the separator or the close; a reference item may continue with `.` or `[` (R-TXT-11).
    const { open, separator, close } = s.list;
    if (!open || !separator || !close) error('list-tokens', 'style.list', 'a list needs an opening, a separating and a closing token');
    if (open === separator || open === close || separator === close) error('list-tokens', 'style.list', `the list tokens are not distinct: "${open}" "${separator}" "${close}"`);
    for (const [param, t] of [['separator', separator], ['close', close]] as const) {
        if (t === '.' || t === '[') error('list-tokens', `style.list.${param}`, `"${t}" continues a reference path`);
    }

    // The terminator, the recovery's synchronisation point, must not occur inside an item.
    const inside = new Set([...s.assign, open, separator, close]);
    for (const t of s.terminator) {
        if (inside.has(t)) error('terminator', 'style.terminator', `"${t}" also occurs inside an item (assignment or list)`);
    }

    // R-TXT-32: `@` followed by a string is a reference outside the text; a style token, comment or quote starting with it would read as one.
    const outerTokens: [string, readonly string[]][] = [
        ...styleTokens,
        ['comments.line', s.comments.line ? [s.comments.line] : []], ['comments.block', s.comments.block ? [s.comments.block[0]] : []],
        ['string.quote', [s.string.quote]],
    ];
    for (const [param, ts] of outerTokens) {
        if (ts.some(t => t.startsWith('@'))) error('outer-reference', `style.${param}`, `"${ts.find(t => t.startsWith('@'))}" starts with "@", which starts a reference outside the text`);
    }

    // Step T4: the annotations' issues, and the LL(1) conditions an annotated grammar must keep.
    let follow: ReadonlyMap<string, ReadonlySet<Matcher>> = new Map();
    if (g.annotationIssues) {
        for (const i of g.annotationIssues) out.push({ level: i.level, rule: 'annotations', where: i.where, message: i.message });
        const seen = new Set<string>();
        const ll1 = ll1Conflicts(g);
        follow = ll1.follow;
        for (const c of ll1.conflicts) {
            const k = `${c.where}|${c.message}`;
            if (seen.has(k)) continue;
            seen.add(k);
            error('annotations', c.where, `not LL(1): ${c.message}`);
        }
    }

    // Step C lane C1a: the operators of each expression.
    const reserved = reservedWords(g);
    const comments = [s.comments.line, s.comments.block?.[0]].filter((c): c is string => !!c);
    const puncts = styleTokens.flatMap(([, ts]) => ts.filter(t => !isWord(t)));
    for (const r of g.rules) {
        if (r.body.t !== 'expr') continue;
        const e = r.body;
        const bySymbol = new Map<string, ExprOperator[]>();
        const byCall = new Map<string, ExprOperator>();
        for (const o of e.operators) {
            const at = `class ${o.cls}`;
            const sym = o.symbol;
            // One symbol is prefix on one class and infix on another at most, as the unary and the binary minus (C1b).
            const priors = bySymbol.get(sym) ?? [];
            const same = priors.find(x => x.fixity === o.fixity);
            const infix = priors.find(x => x.fixity !== 'prefix');
            if (same) error('operator-symbols', at, `the symbol "${sym}" is the symbol of ${same.cls} too`);
            else if (o.fixity !== 'prefix' && infix) error('operator-fixity', at, `the symbol "${sym}" is ${FIXITY[o.fixity]} here and ${FIXITY[infix.fixity]} for ${infix.cls}: one fixity per symbol`);
            else bySymbol.set(sym, [...priors, o]);

            const styled = styleTokens.find(([, ts]) => ts.includes(sym));
            const opener = comments.find(c => sym.startsWith(c));
            const longer = [...comments, ...puncts].find(t => t !== sym && t.startsWith(sym));
            if (styled) error('operator-tokens', at, `the symbol "${sym}" is the style token style.${styled[0]}`);
            else if ([e.open, e.close, e.separator].includes(sym)) error('operator-tokens', at, `the symbol "${sym}" is a token of the expression itself`);
            else if (['.', '[', ']'].includes(sym) || sym.startsWith('@')) error('operator-tokens', at, `the symbol "${sym}" is a token of a reference`);
            else if (opener) error('operator-tokens', at, `the symbol "${sym}" starts with the comment opener "${opener}"`);
            else if (!isWord(sym) && longer) error('operator-tokens', at, `the symbol "${sym}" is a prefix of "${longer}": the longer token would be read`);

            if (o.fixity !== 'prefix') {
                const after = new Set([...(follow.get(r.name) ?? []), word(e.close), word(e.separator)]);
                if (common(after, new Set([word(sym)]), reserved).length) error('operator-follow', at, `the infix symbol "${sym}" can also follow an expression of ${r.name}`);
            }

            if (o.call === undefined) continue;
            const other = Object.values(g.objects).find(x => x.cls !== o.cls && headKeyword(x) === o.call);
            const twice = byCall.get(o.call);
            if (other) error('call-words', at, `the call word "${o.call}" is the keyword of ${other.cls}`);
            else if (e.operators.some(x => x.symbol === o.call)) error('call-words', at, `the call word "${o.call}" is an operator symbol`);
            else if (words.has(o.call)) error('call-words', at, `the call word "${o.call}" is a style word`);
            else if (twice) error('call-words', at, `the call word "${o.call}" is the call word of ${twice.cls} too`);
            byCall.set(o.call, o);
        }
    }

    for (const rule of STYLE_RULES) {
        if (!out.some(f => f.rule === rule)) out.push({ level: 'ok', rule, where: '', message: 'holds' });
    }
    return STYLE_RULES.flatMap(rule => out.filter(f => f.rule === rule));
}

const FIXITY: Readonly<Record<ExprOperator['fixity'], string>> = { nary: 'n-ary', binary: 'binary', prefix: 'prefix' };

/** The words no name can be (as the parser's `canAt`): the style's reserved names, an expression's word symbols and call
 *  words (C1a), and the head words of an optional head name (R-TXT-41, D3; C1d). */
function reservedWords(g: ConcreteGrammar): ReadonlySet<string> {
    const exprWords = g.rules.flatMap(r => (r.body.t === 'expr' ? r.body.operators.flatMap(o => [o.symbol, ...(o.call !== undefined ? [o.call] : [])]) : []));
    return new Set([...g.style.reservedNames, ...exprWords.filter(isWord), ...(g.headWords ?? [])]);
}

/** Two token classes overlap when one token can match both: equal, or `ID` and an `ID:x` whose word is not reserved. */
const overlap = (a: Matcher, b: Matcher, reserved: ReadonlySet<string>): boolean =>
    a === b || (a === 'ID' && b.startsWith('ID:') && !reserved.has(b.slice(3))) || (b === 'ID' && a.startsWith('ID:') && !reserved.has(a.slice(3)));
const common = (xs: ReadonlySet<Matcher>, ys: ReadonlySet<Matcher>, reserved: ReadonlySet<string>): Matcher[] => [...xs].filter(x => [...ys].some(y => overlap(x, y, reserved)));
const shownMatchers = (ms: readonly Matcher[]): string => [...new Set(ms)].map(m => (m.includes(':') ? `"${m.slice(m.indexOf(':') + 1)}"` : m)).join(', ');

/**
 * The LL(1) conditions of an annotated grammar, over the parser's own FIRST sets (parser.ts) and FOLLOW sets computed
 * here to a fixpoint (`EOF` after `Model`): at an optional part or a repetition, no token both starts it and follows it;
 * a repeated part is never empty; the alternatives of a choice start with distinct tokens, and at most one is empty.
 * The parser predicts with one token, so a conflict here is a text it reads differently from the printer.
 */
function ll1Conflicts(g: ConcreteGrammar): { readonly conflicts: { readonly where: string; readonly message: string }[]; readonly follow: ReadonlyMap<string, ReadonlySet<Matcher>> } {
    const first = firstSetsOf(g);
    const reserved = reservedWords(g);
    const follow = new Map<string, Set<Matcher>>(g.rules.map(r => [r.name, new Set<Matcher>()]));
    follow.get('Model')?.add('EOF');
    const out: { where: string; message: string }[] = [];
    let report = false;
    let changed = true;
    let rule = '';

    const conflict = (n: GrammarNode, message: string): void => {
        if (!report) return;
        const feat = n.t === 'opt' || n.t === 'star' ? n.feat : undefined;
        out.push({ where: feat ? `${rule}.${feat}` : `rule ${rule}`, message });
    };
    /** Walks `n` with the tokens that may follow it; adds to the FOLLOW of the rules it reaches. */
    const walk = (n: GrammarNode, after: ReadonlySet<Matcher>): void => {
        switch (n.t) {
            case 'seq': walkSeq(n.items, after); return;
            case 'opt': {
                const both = common(first(n.item).set, after, reserved);
                if (both.length) conflict(n, `${shownMatchers(both)} can both start the optional part and follow it`);
                walk(n.item, after);
                return;
            }
            case 'star': {
                const f = first(n.item);
                if (f.nullable) conflict(n, 'the repeated part can be empty');
                const both = common(f.set, after, reserved);
                if (both.length) conflict(n, `${shownMatchers(both)} can both start the repeated part and follow it`);
                walk(n.item, new Set([...f.set, ...after]));
                return;
            }
            case 'alt': {
                const fs = n.alts.map(first);
                for (let i = 0; i < fs.length; i++) {
                    for (let j = i + 1; j < fs.length; j++) {
                        const both = common(fs[i].set, fs[j].set, reserved);
                        if (both.length) conflict(n, `${shownMatchers(both)} can start two alternatives`);
                    }
                }
                const empties = fs.filter(f => f.nullable).length;
                if (empties > 1) conflict(n, `${empties} alternatives can be empty`);
                if (empties) {
                    const both = common(new Set(fs.flatMap(f => [...f.set])), after, reserved);
                    if (both.length) conflict(n, `${shownMatchers(both)} can both start an alternative and follow the empty one`);
                }
                for (const a of n.alts) walk(a, after);
                return;
            }
            case 'rule': {
                const set = follow.get(n.name);
                if (!set) return;
                for (const m of after) if (!set.has(m)) { set.add(m); changed = true; }
                return;
            }
            case 'assign': walk(n.item, after); return;
            case 'list': walk(n.item, new Set([word(n.separator), word(n.close)])); return;
            case 'block': walkSeq(n.items, new Set(n.close.length ? [word(n.close[0])] : [])); return;
            case 'expr': {
                // C1a: no primary is empty, and the starts of an expression are pairwise disjoint.
                const name = (p: GrammarNode): string => (p.t === 'rule' ? p.name : 'a primary');
                const starts: [string, ReadonlySet<Matcher>][] = n.primaries.map(p => [name(p), first(p).set]);
                for (const p of n.primaries) if (first(p).nullable) conflict(n, `the primary ${name(p)} can be empty`);
                for (const o of n.operators) {
                    if (o.fixity === 'prefix') starts.push([`the prefix operator ${o.cls}`, new Set([word(o.symbol)])]);
                    if (o.call !== undefined) starts.push([`the call form of ${o.cls}`, new Set([word(o.call)])]);
                }
                starts.push(['the parentheses', new Set([word(n.open)])]);
                for (let i = 0; i < starts.length; i++) {
                    for (let j = i + 1; j < starts.length; j++) {
                        const both = common(starts[i][1], starts[j][1], reserved);
                        if (both.length) conflict(n, `${shownMatchers(both)} can start ${starts[i][0]} and ${starts[j][0]}`);
                    }
                }
                const infix = n.operators.filter(o => o.fixity !== 'prefix').map(o => word(o.symbol));
                const inner = new Set([...after, ...infix, word(n.close), word(n.separator)]);
                for (const p of n.primaries) walk(p, inner);
                return;
            }
            default: return;
        }
    };
    const walkSeq = (items: readonly GrammarNode[], after: ReadonlySet<Matcher>): void => {
        let rest = new Set(after);
        const afters: Set<Matcher>[] = [];
        for (let i = items.length - 1; i >= 0; i--) {
            afters[i] = rest;
            const f = first(items[i]);
            rest = new Set(f.nullable ? [...f.set, ...rest] : f.set);
        }
        items.forEach((x, i) => walk(x, afters[i]));
    };

    while (changed) {
        changed = false;
        for (const r of g.rules) { rule = r.name; walk(r.body, follow.get(r.name) ?? new Set()); }
    }
    report = true;
    for (const r of g.rules) { rule = r.name; walk(r.body, follow.get(r.name) ?? new Set()); }
    return { conflicts: out, follow };
}

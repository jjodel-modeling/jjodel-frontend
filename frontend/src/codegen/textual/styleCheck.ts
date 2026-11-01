/**
 * The style check (R-TXT-16, step T3 of docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.7): a style is
 * shown unambiguous once, and this is its mechanical guard per metamodel, read off the concrete grammar the style gives
 * that metamodel's base grammar. It checks the two conditions of §A.2, (i) and (ii), case injectivity (R-TXT-21 (10)),
 * and the token conditions §A.2's C-like argument rests on: a close cannot start an item, a name cannot be read as a
 * style word, a list token cannot continue a reference path. The oracle that counts parses (R-TXT-21 (1)) is nearley,
 * in the tests only.
 */

import type { ConcreteGrammar, GrammarNode, ObjectRule } from './concreteGrammar';

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
    | 'terminator';

/** Every rule the check evaluates, in the order of its findings. */
export const STYLE_RULES: readonly StyleRule[] = ['distinct-features', 'distinct-classes', 'case-injective', 'reserved-words', 'block-delimiters', 'list-tokens', 'terminator'];

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

/** The items of an object rule's body: one `opt` per feature, in R-TXT-1 order. */
function bodyItems(r: ObjectRule): readonly GrammarNode[] {
    const last = r.body.t === 'seq' ? r.body.items[r.body.items.length - 1] : undefined;
    return last?.t === 'block' ? last.items : [];
}

/** The keyword a body item starts with, and the feature it sets. */
function itemKeyword(n: GrammarNode): { readonly kw: string; readonly feat: string } | undefined {
    if (n.t !== 'opt') return undefined;
    const first = n.item.t === 'seq' ? n.item.items[0] : n.item;
    return first?.t === 'kw' ? { kw: first.text, feat: n.feat } : undefined;
}

/** Checks a concrete grammar; one `ok` for each rule without a notice or an error. */
export function checkStyle(g: ConcreteGrammar): StyleFinding[] {
    const s = g.style;
    const out: StyleFinding[] = [];
    const error = (rule: StyleRule, where: string, message: string): void => { out.push({ level: 'error', rule, where, message }); };
    const objectRules = g.rules.flatMap(r => (r.t === 'object' ? [r] : []));

    // §A.2 (i).
    for (const r of objectRules) {
        const items = new Map<string, number>();
        for (const it of bodyItems(r).map(itemKeyword)) if (it) items.set(it.kw, (items.get(it.kw) ?? 0) + 1);
        for (const [kw, n] of items) {
            if (n < 2) continue;
            const owners = r.features.filter(f => f.name === kw).map(f => `${f.owner}.${f.name}`);
            error('distinct-features', `class ${r.cls}`, `the keyword "${kw}" starts ${n} features: ${owners.join(', ')}`);
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

    for (const rule of STYLE_RULES) {
        if (!out.some(f => f.rule === rule)) out.push({ level: 'ok', rule, where: '', message: 'holds' });
    }
    return STYLE_RULES.flatMap(rule => out.filter(f => f.rule === rule));
}

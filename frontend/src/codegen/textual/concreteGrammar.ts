/**
 * The concrete grammar: the base grammar with a style's tokens (R-TXT-16 levels 1 and 2; level 3, the annotations, is
 * step T4), and its EBNF text annotated with the features (docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.1, §A.2). The grammar is data over a closed vocabulary of nodes; the printer (printer.ts) walks it with the
 * object, and the parser of step T2 is to interpret the same data.
 */

import type { BaseGrammar, BaseValue } from './baseGrammar';
import type { TextFeature } from './metamodel';
import type { LetterCase, NotationStyle } from './style';

/** `NAME`: an object's name, an identifier or a quoted string (R-TXT-3, R-TXT-9). */
export type ConcreteTerminal = 'NAME' | 'INT' | 'FLOAT' | 'BOOL' | 'STRING';

/** Xtext's feature assignments: `f=` a value, `f+=` one more value of a many-valued feature, `f?=` a flag set by its keyword (no derivation emits it before the annotations of step T4). */
export type AssignOp = '=' | '+=' | '?=';

export type GrammarNode =
    | { readonly t: 'seq'; readonly items: readonly GrammarNode[] }
    /** Present iff the feature is set (R-TXT-5). */
    | { readonly t: 'opt'; readonly feat: string; readonly item: GrammarNode }
    /** Once per value of the feature; without a feature only in the `Model` rule. */
    | { readonly t: 'star'; readonly feat?: string; readonly item: GrammarNode }
    | { readonly t: 'alt'; readonly alts: readonly GrammarNode[] }
    /** A contextual keyword: an identifier matched by its text where an item starts (R-TXT-9). */
    | { readonly t: 'kw'; readonly text: string }
    | { readonly t: 'p'; readonly text: string }
    | { readonly t: 'tok'; readonly terminal: ConcreteTerminal }
    /** A cross-reference (`REF`): the target's name when unique among `targets`' instances, else its path (R-TXT-4, R-TXT-11). */
    | { readonly t: 'xref'; readonly type: string; readonly targets: readonly string[] }
    /** A literal of the enumeration rule `rule`. */
    | { readonly t: 'lit'; readonly rule: string }
    | { readonly t: 'rule'; readonly name: string }
    | { readonly t: 'assign'; readonly feat: string; readonly op: AssignOp; readonly item: GrammarNode }
    /** The values of a many-valued attribute or reference: `open [item {separator item}] close`. */
    | { readonly t: 'list'; readonly feat: string; readonly open: string; readonly separator: string; readonly close: string; readonly item: GrammarNode }
    /** A delimited body; `empty` is printed instead when none of its items is present. */
    | { readonly t: 'block'; readonly open: readonly string[]; readonly close: readonly string[]; readonly empty: readonly string[]; readonly items: readonly GrammarNode[] }
    /** A line break in the printed text; no token. */
    | { readonly t: 'nl' };

export type ConcreteRule =
    | { readonly t: 'model'; readonly name: 'Model'; readonly body: GrammarNode }
    | { readonly t: 'object'; readonly name: string; readonly cls: string; readonly named: boolean; readonly features: readonly TextFeature[]; readonly body: GrammarNode }
    | { readonly t: 'choice'; readonly name: string; readonly body: GrammarNode }
    | { readonly t: 'enum'; readonly name: string; readonly literals: readonly string[]; readonly body: GrammarNode };

export type ObjectRule = Extract<ConcreteRule, { t: 'object' }>;

/** A remark on the derivation that changes nothing the author asked for silently, e.g. a case fallback (R-TXT-21 (10)). */
export interface GrammarNotice {
    readonly code: 'case-fallback';
    readonly message: string;
}

export interface ConcreteGrammar {
    readonly style: NotationStyle;
    /** In EBNF order: `Model`, the object rules in metamodel order, the choices in order of first use, the enumerations. */
    readonly rules: readonly ConcreteRule[];
    /** The object rule of each concrete class. */
    readonly objects: Readonly<Record<string, ObjectRule>>;
    /** The cases in effect, after the fallback of R-TXT-21 (10). */
    readonly classCase: LetterCase;
    readonly literalCase: LetterCase;
    readonly notices: readonly GrammarNotice[];
}

export const applyCase = (s: string, c: LetterCase): string => (c === 'lower' ? s.toLowerCase() : s);

/** The words of a group of names that one case folding would merge, e.g. `FAST` and `Fast` under `lower`. */
function clashes(words: readonly string[], c: LetterCase): string[] {
    if (c === 'declared') return [];
    const seen = new Map<string, string[]>();
    for (const w of words) seen.set(applyCase(w, c), [...(seen.get(applyCase(w, c)) ?? []), w]);
    return [...seen.values()].filter(ws => ws.length > 1).map(ws => ws.join(', '));
}

const tokens = (ts: readonly string[]): GrammarNode[] => ts.map(text => (/^\w/.test(text) ? { t: 'kw', text } : { t: 'p', text }));

/** Applies a style to a base grammar. */
export function deriveConcreteGrammar(base: BaseGrammar, style: NotationStyle): ConcreteGrammar {
    if (style.layout !== 'free') throw new Error(`style ${style.id}: layout ${style.layout} is not implemented (step T5)`);

    const notices: GrammarNotice[] = [];
    const enumRules = base.rules.flatMap(r => (r.t === 'enum' ? [r] : []));
    const objectRules = base.rules.flatMap(r => (r.t === 'object' ? [r] : []));
    const choiceRules = base.rules.flatMap(r => (r.t === 'choice' ? [r] : []));

    let literalCase = style.literalCase;
    const literalClash = enumRules.flatMap(e => clashes(e.literals, literalCase).map(w => `${e.name}: ${w}`));
    if (literalClash.length) {
        notices.push({ code: 'case-fallback', message: `literals kept as declared: case ${literalCase} would merge ${literalClash.join('; ')}` });
        literalCase = 'declared';
    }
    let classCase = style.classCase;
    const classClash = clashes(objectRules.map(r => r.cls), classCase);
    if (classClash.length) {
        notices.push({ code: 'case-fallback', message: `class keywords kept as declared: case ${classCase} would merge ${classClash.join('; ')}` });
        classCase = 'declared';
    }

    // Base rule names to concrete ones: `Obj_C` is `C`; a choice with a single class is that class.
    const clsOfObjectRule = new Map(objectRules.map(r => [r.name, r.cls]));
    const usedChoices: string[] = [];
    const ruleRef = (baseName: string): GrammarNode => {
        const cls = clsOfObjectRule.get(baseName);
        if (cls !== undefined) return { t: 'rule', name: cls };
        const choice = choiceRules.find(c => c.name === baseName);
        if (choice && choice.alts.length === 1) return { t: 'rule', name: clsOfObjectRule.get(choice.alts[0]) ?? choice.alts[0] };
        if (!usedChoices.includes(baseName)) usedChoices.push(baseName);
        return { t: 'rule', name: baseName };
    };

    const block = (items: readonly GrammarNode[]): GrammarNode => ({ t: 'block', open: style.blockOpen, close: style.blockClose, empty: style.emptyBlock, items });
    const single = (v: BaseValue): GrammarNode => {
        switch (v.t) {
            case 'terminal': return { t: 'tok', terminal: v.terminal };
            case 'enum': return { t: 'lit', rule: v.rule };
            case 'ref': return { t: 'xref', type: v.type, targets: v.targets };
            default: throw new Error(`a ${v.t} value is not a single value`);
        }
    };
    const feature = (f: TextFeature, v: BaseValue): GrammarNode => {
        const kw: GrammarNode = { t: 'kw', text: f.name };
        if (v.t === 'block') {
            const el: GrammarNode = { t: 'assign', feat: f.name, op: v.many ? '+=' : '=', item: ruleRef(v.rule) };
            const items: GrammarNode[] = v.many ? [{ t: 'star', feat: f.name, item: { t: 'seq', items: [el, { t: 'nl' }] } }] : [el, { t: 'nl' }];
            return { t: 'opt', feat: f.name, item: { t: 'seq', items: [kw, block(items), { t: 'nl' }] } };
        }
        const value: GrammarNode = v.t === 'list'
            ? { t: 'list', feat: f.name, open: style.list.open, separator: style.list.separator, close: style.list.close, item: { t: 'assign', feat: f.name, op: '+=', item: single(v.item) } }
            : { t: 'assign', feat: f.name, op: '=', item: single(v) };
        return { t: 'opt', feat: f.name, item: { t: 'seq', items: [kw, ...tokens(style.assign), value, ...tokens(style.terminator), { t: 'nl' }] } };
    };

    const objects: Record<string, ObjectRule> = {};
    const rules: ConcreteRule[] = [];
    for (const r of base.rules) {
        if (r.t === 'model') {
            const alts = r.alts.map(a => ruleRef(a));
            rules.push({ t: 'model', name: 'Model', body: { t: 'star', item: { t: 'seq', items: [{ t: 'alt', alts }, { t: 'nl' }] } } });
        } else if (r.t === 'object') {
            const head: GrammarNode[] = [{ t: 'kw', text: applyCase(r.cls, classCase) }];
            if (r.named) head.push({ t: 'opt', feat: 'name', item: { t: 'assign', feat: 'name', op: '=', item: { t: 'tok', terminal: 'NAME' } } });
            const rule: ObjectRule = {
                t: 'object', name: r.cls, cls: r.cls, named: r.named, features: r.features.map(f => f.feature),
                body: { t: 'seq', items: [...head, block(r.features.map(f => feature(f.feature, f.value)))] },
            };
            objects[r.cls] = rule;
            rules.push(rule);
        }
    }
    for (const name of usedChoices) {
        const c = choiceRules.find(k => k.name === name);
        if (c) rules.push({ t: 'choice', name, body: { t: 'alt', alts: c.alts.map(a => ruleRef(a)) } });
    }
    for (const e of enumRules) {
        rules.push({ t: 'enum', name: e.name, literals: e.literals, body: { t: 'alt', alts: e.literals.map(l => ({ t: 'kw', text: applyCase(l, literalCase) })) } });
    }
    return { style, rules, objects, classCase, literalCase, notices };
}

const quoted = (s: string): string => `"${s}"`;

function nodeText(n: GrammarNode, top = false): string {
    switch (n.t) {
        case 'seq': {
            const parts = n.items.filter(x => nodeText(x) !== '');
            if (parts.length === 1) return nodeText(parts[0], top);
            const s = parts.map(x => nodeText(x)).join(' ');
            return top ? s : `(${s})`;
        }
        case 'opt': return `[${nodeText(n.item, true)}]`;
        case 'star': return `{${nodeText(n.item, true)}}`;
        case 'alt': {
            const s = n.alts.map(x => nodeText(x)).join(' | ');
            return top ? s : `(${s})`;
        }
        case 'kw': case 'p': return quoted(n.text);
        case 'tok': return n.terminal;
        case 'xref': return 'REF';
        case 'lit': return n.rule;
        case 'rule': return n.name;
        case 'assign': return `${n.feat}${n.op}${nodeText(n.item)}`;
        case 'list': {
            const item = nodeText(n.item);
            const s = `${quoted(n.open)} [${item} {${quoted(n.separator)} ${item}}] ${quoted(n.close)}`;
            return top ? s : `(${s})`;
        }
        case 'block': return [...n.open.map(quoted), ...n.items.map(x => nodeText(x)).filter(Boolean), ...n.close.map(quoted)].join(' ');
        case 'nl': return '';
    }
}

/** The concrete grammar as EBNF, one rule per line, the `::=` aligned; feature assignments name the features. */
export function concreteGrammarEbnf(g: ConcreteGrammar): string {
    const width = Math.max(...g.rules.map(r => r.name.length));
    return g.rules.map(r => `${r.name.padEnd(width)} ::= ${nodeText(r.body, true)} ;`).join('\n');
}

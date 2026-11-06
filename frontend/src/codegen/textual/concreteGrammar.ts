/**
 * The concrete grammar: the base grammar with a style's tokens and the syntax annotations (R-TXT-16 levels 1, 2 and 3;
 * annotations.ts), and its EBNF text annotated with the features (docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.1, §A.2). The grammar is data over a closed vocabulary of nodes; the printer (printer.ts) walks it with the
 * object, and the parser of step T2 is to interpret the same data.
 */

import type { AnnotationIssue, NamePattern, OperatorFixity, ResolvedAnnotations, ResolvedFeature } from './annotations';
import { expandNamePattern, operatorFixity, patternHoles } from './annotations';
import type { BaseGrammar, BaseRule, BaseValue } from './baseGrammar';
import type { TextFeature } from './metamodel';
import { firstSetsOf } from './parser';
import type { LetterCase, NotationStyle } from './style';

/** `NAME`: an object's name, an identifier or a quoted string (R-TXT-3, R-TXT-9). */
export type ConcreteTerminal = 'NAME' | 'INT' | 'FLOAT' | 'BOOL' | 'STRING';

/** Xtext's feature assignments: `f=` a value, `f+=` one more value of a many-valued feature, `f?=` a flag set by its keyword (no derivation emits it before the annotations of step T4). */
export type AssignOp = '=' | '+=' | '?=';

/** The values of a grouped containment that a group holds: those whose attribute `attr` is one of `literals` (declared names),
 *  listed in the subset's order, the order the group prints its values in. */
export interface GroupFilter {
    readonly attr: string;
    readonly literals: readonly string[];
}

/** An operator of an expression (step C lane C1a): its class, its symbol and the features its operands go to. */
export interface ExprOperator {
    readonly cls: string;
    readonly symbol: string;
    readonly precedence: number;
    readonly assoc: 'left' | 'right';
    readonly fixity: OperatorFixity;
    readonly operands: readonly string[];
    /** The word of the call form, n-ary operators only. */
    readonly call?: string;
}

/** A style parameter a token comes from, as the record's `style` will name it (R-TXT-48 step 2). */
export type StyleParam = 'assign' | 'terminator' | 'blockOpen' | 'blockClose' | 'list.open' | 'list.separator' | 'list.close';

/**
 * Where a quoted literal of the EBNF comes from (R-TXT-48, R-TXT-49 D1): the element of the metamodel and its record
 * field by name (`feature` is `Owner.f`, the declaring class), a style token by parameter and index, a literal of an
 * enumeration, or a fixed token of the grammar. A role, not the presence of an annotation: the default keyword of a
 * class has the same origin as an annotated one.
 */
export type LiteralSrc =
    | { readonly k: 'class'; readonly cls: string }
    | { readonly k: 'nameKeyword'; readonly cls: string }
    | { readonly k: 'operatorSymbol'; readonly cls: string }
    | { readonly k: 'operatorCall'; readonly cls: string }
    | { readonly k: 'feature'; readonly feature: string }
    | { readonly k: 'itemKeyword'; readonly feature: string }
    | { readonly k: 'subset'; readonly enumName: string; readonly index: number }
    | { readonly k: 'literal'; readonly enumName: string; readonly literal: string }
    | { readonly k: 'style'; readonly param: StyleParam; readonly index: number }
    /** R-TXT-51 (D10): a token of a block's own side, a class's or a containment's, by side and index. */
    | { readonly k: 'classBlock'; readonly cls: string; readonly side: 'open' | 'close'; readonly index: number }
    | { readonly k: 'featureBlock'; readonly feature: string; readonly side: 'open' | 'close'; readonly index: number }
    /** R-TXT-51 (3), lane B3a: a token of a class's head prefix, before its keyword, by index. */
    | { readonly k: 'classPrefix'; readonly cls: string; readonly index: number }
    | { readonly k: 'fixed' };

/**
 * Whose tokens a side of a block is when they are not the style's (R-TXT-51, D10): a class's or a containment's own, or
 * the indentation marks, which no field edits (report §5.2 R4). A side without an origin is the style's.
 */
export type BlockOrigin = { readonly k: 'class'; readonly cls: string } | { readonly k: 'feature'; readonly feature: string } | { readonly k: 'fixed' };

export type GrammarNode =
    | { readonly t: 'seq'; readonly items: readonly GrammarNode[] }
    /** Present iff the feature is set (R-TXT-5); with `where`, iff one of its values passes the filter; with `derive` (the name), absent when the name equals the pattern's expansion, which the parser fills in. */
    | { readonly t: 'opt'; readonly feat: string; readonly item: GrammarNode; readonly where?: GroupFilter; readonly derive?: NamePattern }
    /** Once per value of the feature (with `where`, per value that passes the filter); without a feature only in the `Model` rule. */
    | { readonly t: 'star'; readonly feat?: string; readonly item: GrammarNode; readonly where?: GroupFilter }
    | { readonly t: 'alt'; readonly alts: readonly GrammarNode[] }
    /** A contextual keyword: an identifier matched by its text where an item starts (R-TXT-9). */
    | { readonly t: 'kw'; readonly text: string; readonly src?: LiteralSrc }
    /** `tight`: no space before the token (`before`), nor after it (`around`); the call layout's parentheses and commas (C1d). */
    | { readonly t: 'p'; readonly text: string; readonly tight?: 'before' | 'around'; readonly src?: LiteralSrc }
    | { readonly t: 'tok'; readonly terminal: ConcreteTerminal }
    /** A cross-reference (`REF`): the target's name when unique among `targets`' instances, else its path (R-TXT-4, R-TXT-11). */
    | { readonly t: 'xref'; readonly type: string; readonly targets: readonly string[] }
    /** A literal of the enumeration rule `rule`. */
    | { readonly t: 'lit'; readonly rule: string }
    | { readonly t: 'rule'; readonly name: string }
    | { readonly t: 'assign'; readonly feat: string; readonly op: AssignOp; readonly item: GrammarNode }
    /** The values of a many-valued attribute or reference: `open [item {separator item}] close`. */
    | { readonly t: 'list'; readonly feat: string; readonly open: string; readonly separator: string; readonly close: string; readonly item: GrammarNode }
    /** A delimited body; `empty` is printed instead when none of its items is present. `origin`: per side, whose tokens they are (D10). */
    | { readonly t: 'block'; readonly open: readonly string[]; readonly close: readonly string[]; readonly empty: readonly string[]; readonly items: readonly GrammarNode[]; readonly origin?: { readonly open?: BlockOrigin; readonly close?: BlockOrigin } }
    /** A line break in the printed text; no token. `blank`: an empty line before what follows, unless a body starts there. */
    | { readonly t: 'nl'; readonly blank?: true }
    /**
     * An expression over the classes of `type` (step C lane C1a), the body of the choice rule `rule`: the operators loosest
     * first (ties in metamodel order), each with its operands of `rule`; the call forms `w(a, b)` of the n-ary ones; the
     * rules of the other classes (the primaries); and `open rule close`.
     */
    | { readonly t: 'expr'; readonly type: string; readonly rule: string; readonly operators: readonly ExprOperator[]; readonly primaries: readonly GrammarNode[]; readonly open: string; readonly close: string; readonly separator: string };

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
    /** Present iff the grammar was derived with annotations: their resolution issues and what the derivation refused. */
    readonly annotationIssues?: readonly AnnotationIssue[];
    /**
     * R-TXT-41 (D3): the words that can stand where an optional head name can, after it or in place of it (a feature
     * keyword, the keyword of another class of the same position). No name is one of them: the printer quotes it, and
     * the parser reads the word (C1d). Absent when no head name is optional.
     */
    readonly headWords?: readonly string[];
}

export const applyCase = (s: string, c: LetterCase): string => (c === 'lower' ? s.toLowerCase() : s);

/**
 * The layout tokens of the indentation style (step C3b): zero-width punctuation the tokenizer derives from the
 * indentation of a line, never read from the text (no style token is one of them). A block under `layout: 'indent'`
 * opens with INDENT and closes with DEDENT.
 */
export const INDENT_MARK = '\u21e5';
export const DEDENT_MARK = '\u21e4';

/** The words of a group of names that one case folding would merge, e.g. `FAST` and `Fast` under `lower`. */
function clashes(words: readonly string[], c: LetterCase): string[] {
    if (c === 'declared') return [];
    const seen = new Map<string, string[]>();
    for (const w of words) seen.set(applyCase(w, c), [...(seen.get(applyCase(w, c)) ?? []), w]);
    return [...seen.values()].filter(ws => ws.length > 1).map(ws => ws.join(', '));
}

const FIXED: LiteralSrc = { k: 'fixed' };
const FIXED_BLOCK: BlockOrigin = { k: 'fixed' };

const tokens = (param: StyleParam, ts: readonly string[]): GrammarNode[] => ts.map((text, index) => {
    const src: LiteralSrc = { k: 'style', param, index };
    return /^\w/.test(text) ? { t: 'kw', text, src } : { t: 'p', text, src };
});

/** A class whose head name is optional in a one-line, positional or call head (R-TXT-41, D3), and how its head is laid out. */
interface OptionalHead {
    readonly line: boolean;
    readonly positional: boolean;
}

/** The shape an object rule takes after its class's annotations, refusals applied. */
interface ClassShape {
    /** `''`: positional. */
    readonly keyword: string;
    readonly line: boolean;
    /** The call layout (C1d): the class word and its arguments in parentheses. */
    readonly call: boolean;
    /** R-TXT-41 (D3): the head's name is optional in a one-line, positional or call head; its mandatory single values are not. */
    readonly optionalHead: boolean;
    /** The name's keyword when it moves after the features. */
    readonly nameKeyword?: string;
    readonly derive?: NamePattern;
    /** A one-line or positional class with a mandatory name: the head's name is not optional (R-TXT-27). */
    readonly nameRequired: boolean;
}

/**
 * Applies a style to a base grammar, and the resolved annotations when given. Without annotations the grammar is the
 * one of R-TXT-16 levels 1 and 2 exactly; with them, what an annotation would break is refused, reported in
 * `annotationIssues`, and not applied.
 */
export function deriveConcreteGrammar(base: BaseGrammar, style: NotationStyle, annotations?: ResolvedAnnotations): ConcreteGrammar {
    // R-TXT-41 (D3): an optional head name stays when what can follow it in the head cannot be read as a name; a class
    // whose head fails is derived again with the name refused, as R-TXT-27 (2) refused it.
    let refused = new Map<string, string>();
    for (;;) {
        const { grammar, heads } = derive(base, style, annotations, refused);
        const more = headConflicts(grammar, heads, refused);
        if (!more.size) return withHeadWords(grammar, heads);
        refused = new Map([...refused, ...more]);
    }
}

/** The name position of an object rule's head: the items after the name's opt (or the name alternative's siblings). */
function afterName(rule: ObjectRule): { readonly rest: readonly GrammarNode[]; readonly alt?: readonly GrammarNode[] } | undefined {
    const items = rule.body.t === 'seq' ? rule.body.items : [rule.body];
    const at = items.findIndex(x => (x.t === 'opt' && x.feat === 'name') || (x.t === 'alt' && x.alts.some(a => a.t === 'assign' && a.feat === 'name')));
    if (at < 0) return undefined;
    const n = items[at];
    return { rest: items.slice(at + 1), ...(n.t === 'alt' ? { alt: n.alts.filter(a => !(a.t === 'assign' && a.feat === 'name')) } : {}) };
}

/** The feature a part of a head is about: its own, or that of the first item of a sequence that has one. */
function featOf(x: GrammarNode): string | undefined {
    if (x.t === 'opt' || x.t === 'assign' || x.t === 'star' || x.t === 'list') return x.feat;
    if (x.t === 'seq') for (const i of x.items) { const f = featOf(i); if (f !== undefined) return f; }
    return undefined;
}

/** The classes whose optional head name a following part could be read as: the part that starts with a name, by class. */
function headConflicts(g: ConcreteGrammar, heads: ReadonlyMap<string, OptionalHead>, refused: ReadonlyMap<string, string>): Map<string, string> {
    const first = firstSetsOf(g);
    const out = new Map<string, string>();
    for (const cls of heads.keys()) {
        const rule = g.objects[cls];
        const at = rule && !refused.has(cls) ? afterName(rule) : undefined;
        if (!at) continue;
        let closed = at.alt !== undefined;
        for (const x of [...at.rest, ...(at.alt ?? [])]) {
            const f = first(x);
            if (f.set.has('ID') || f.set.has('STR')) {
                const named = featOf(x);
                const feat = named !== undefined ? `${cls}.${named}` : `a part of ${cls}`;
                out.set(cls, `${feat} can start with a name too (an identifier or a string)`);
                break;
            }
            // C3b: an indented body starts on a line of its own, so the head ends at its line end even when the body is empty.
            if (!f.nullable || (x.t === 'block' && g.style.layout === 'indent')) { closed = true; break; }
        }
        // With every part after an optional name optional, the name is followed by what follows the object, which its
        // own rule does not know (the next item's keyword, a positional sibling): refused too.
        if (!closed && !out.has(cls)) out.set(cls, `every part after ${cls}.name is optional, and what follows a ${cls} could be read as its name`);
    }
    return out;
}

/** The grammar with its head words (R-TXT-41): the words that start what follows an optional head name, or stands in its place. */
function withHeadWords(g: ConcreteGrammar, heads: ReadonlyMap<string, OptionalHead>): ConcreteGrammar {
    if (!heads.size) return g;
    const first = firstSetsOf(g);
    const words = new Set<string>();
    const add = (n: GrammarNode): void => { for (const m of first(n).set) if (m.startsWith('ID:')) words.add(m.slice(3)); };
    for (const cls of heads.keys()) {
        const at = g.objects[cls] ? afterName(g.objects[cls]) : undefined;
        if (!at) continue;
        for (const x of at.rest) { add(x); if (!first(x).nullable) break; }
        at.alt?.forEach(add);
    }
    // The other classes of each position an optional head stands at: the alternatives of a choice, the primaries of an expression.
    const visit = (n: GrammarNode): void => {
        const alts = n.t === 'alt' ? n.alts : n.t === 'expr' ? n.primaries : undefined;
        if (alts?.some(a => a.t === 'rule' && heads.has(a.name))) alts.forEach(a => { if (!(a.t === 'rule' && heads.has(a.name))) add(a); });
        switch (n.t) {
            case 'seq': case 'block': n.items.forEach(visit); return;
            case 'opt': case 'star': case 'assign': case 'list': visit(n.item); return;
            case 'alt': n.alts.forEach(visit); return;
            case 'expr': n.primaries.forEach(visit); return;
            default: return;
        }
    };
    g.rules.forEach(r => visit(r.body));
    return words.size ? { ...g, headWords: [...words].sort() } : g;
}

function derive(base: BaseGrammar, style: NotationStyle, annotations: ResolvedAnnotations | undefined, refusedHeads: ReadonlyMap<string, string>): { readonly grammar: ConcreteGrammar; readonly heads: ReadonlyMap<string, OptionalHead> } {
    const A = annotations;
    const notices: GrammarNotice[] = [];
    const issues: AnnotationIssue[] = A ? [...A.issues] : [];
    const refuse = (where: string, message: string): void => { issues.push({ level: 'error', where, message }); };
    const remark = (where: string, message: string): void => { issues.push({ level: 'notice', where, message }); };
    const enumRules = base.rules.flatMap(r => (r.t === 'enum' ? [r] : []));
    const objectRules = base.rules.flatMap(r => (r.t === 'object' ? [r] : []));
    const choiceRules = base.rules.flatMap(r => (r.t === 'choice' ? [r] : []));
    const featureKey = (f: TextFeature): string => `${f.owner}.${f.name}`;
    const featAnn = (f: TextFeature): ResolvedFeature => A?.features[featureKey(f)] ?? {};
    // A class with its own keyword takes no part in the case fallbacks: its keyword is printed as written.
    const unannotated = objectRules.filter(r => A?.classes[r.cls]?.keyword === undefined);

    let literalCase = style.literalCase;
    const literalClash = enumRules.flatMap(e => clashes(e.literals, literalCase).map(w => `${e.name}: ${w}`));
    if (literalClash.length) {
        notices.push({ code: 'case-fallback', message: `literals kept as declared: case ${literalCase} would merge ${literalClash.join('; ')}` });
        literalCase = 'declared';
    }
    let classCase = style.classCase;
    const classClash = clashes(unannotated.map(r => r.cls), classCase);
    if (classClash.length) {
        notices.push({ code: 'case-fallback', message: `class keywords kept as declared: case ${classCase} would merge ${classClash.join('; ')}` });
        classCase = 'declared';
    }
    // R-TXT-25 (7): a folding that lands a class keyword on a style word (`End` on `end`) falls back as well.
    // R-TXT-51 (report §5.2 R3): the per-block words of the record too, which a free layout prints.
    const ownWords = style.layout === 'indent' ? [] : [...Object.values(A?.classes ?? {}), ...Object.values(A?.features ?? {})].flatMap(a => [...(a.blockOpen ?? []), ...(a.blockClose ?? [])]);
    // B3a: and the words of the head prefixes, which every layout prints.
    const prefixWords = Object.values(A?.classes ?? {}).flatMap(a => a.prefix ?? []);
    const styleWords = new Set([
        ...style.blockOpen, ...style.blockClose, ...style.emptyBlock, ...style.assign, ...style.terminator,
        style.list.open, style.list.separator, style.list.close, ...ownWords, ...prefixWords,
    ].filter(w => /^\w/.test(w)));
    const ontoWords = unannotated.map(r => r.cls).filter(c => !styleWords.has(c) && styleWords.has(applyCase(c, classCase)));
    if (ontoWords.length) {
        const folds = ontoWords.map(c => `${c} onto "${applyCase(c, classCase)}"`).join(', ');
        notices.push({ code: 'case-fallback', message: `class keywords kept as declared: case ${classCase} would fold ${folds}, a style word` });
        classCase = 'declared';
    }

    // Annotations that name no concrete class or feature of the grammar.
    if (A) {
        for (const [cls, a] of Object.entries(A.classes)) {
            if (objectRules.some(r => r.cls === cls)) continue;
            if (a.keyword !== undefined || a.layout !== undefined || a.name !== undefined) {
                refuse(`class ${cls}`, `${cls} is abstract: a keyword, layout or name annotation goes on its concrete classes; not applied`);
            }
        }
        const keys = new Set(objectRules.flatMap(r => r.features.map(f => featureKey(f.feature))));
        for (const key of Object.keys(A.features)) {
            if (keys.has(key)) continue;
            refuse(key, key.endsWith('.name') ? 'the name is annotated on its class (name.keyword, name.default); not applied' : 'not a feature of a concrete class; not applied');
        }
    }

    const shapes = new Map<string, ClassShape>();
    const heads = new Map<string, OptionalHead>();
    for (const r of objectRules) {
        const a = A?.classes[r.cls] ?? {};
        const where = `class ${r.cls}`;
        let line = a.layout === 'line';
        let call = a.layout === 'call';
        // C1d: a one-line class may hold single-valued inline containments, printed in its line.
        if (line && r.features.some(f => f.feature.kind === 'containment' && !(featAnn(f.feature).inline && !f.feature.many))) {
            refuse(where, `${r.cls} has a containment: layout line not applied`);
            line = false;
        }
        if (call) {
            const contained = r.features.find(f => f.feature.kind === 'containment');
            const many = r.features.find(f => f.feature.many);
            const optional = r.features.find(f => !A?.mandatory?.has(featureKey(f.feature)));
            if (contained) refuse(where, `${r.cls} has a containment: layout call not applied`);
            else if (many) refuse(where, `${featureKey(many.feature)} is many-valued: layout call not applied, a call takes one value per argument`);
            else if (optional) refuse(where, `${featureKey(optional.feature)} is optional: layout call not applied, a call takes every argument`);
            if (contained || many || optional) call = false;
        }
        let keyword = a.keyword ?? applyCase(r.cls, classCase);
        if (call && keyword === '') {
            remark(where, 'layout call: the keyword "" is not applied, the call word is the class name');
            keyword = applyCase(r.cls, classCase);
        }
        let nameKeyword = a.name?.keyword;
        let derive = a.name?.default;
        if (!r.named && (nameKeyword !== undefined || derive !== undefined)) {
            refuse(where, `${r.cls} has no name attribute: the name annotation is not applied`);
            nameKeyword = undefined;
            derive = undefined;
        }
        if (derive) {
            const bad = patternHoles(derive).filter(h => {
                const f = r.features.find(x => x.feature.name === h)?.feature;
                return !f || f.kind !== 'attribute' || f.many;
            });
            if (bad.length) {
                refuse(where, `the name pattern "${derive.source}" holds ${bad.join(', ')}, not a single-valued attribute of ${r.cls}; not applied`);
                derive = undefined;
            }
        }
        // R-TXT-27 (2) as amended by R-TXT-41 (D3): in the head of a one-line, positional or call class an optional name
        // stays when nothing that follows it there can be read as a name (headConflicts); otherwise it is refused here.
        const headName = r.named && nameKeyword === undefined;
        const mandatory = !!A?.mandatoryName.has(r.cls);
        const conflict = refusedHeads.get(r.cls);
        if (headName && !mandatory && conflict !== undefined) {
            if (line) {
                refuse(where, `${r.cls}.name is optional: a one-line class needs a mandatory name in its head, since ${conflict}; layout line not applied`);
                line = false;
            }
            if (call) {
                refuse(where, `${r.cls}.name is optional: a call class needs a mandatory name in its head, since ${conflict}; layout call not applied`);
                call = false;
            }
            if (keyword === '') {
                refuse(where, `${r.cls}.name is optional: a positional class needs a mandatory name in its head, since ${conflict}; the keyword "" not applied`);
                keyword = applyCase(r.cls, classCase);
            }
        }
        const optionalHead = headName && !mandatory && (line || call || keyword === '');
        if (optionalHead) heads.set(r.cls, { line, positional: keyword === '' });
        shapes.set(r.cls, { keyword, line, call, optionalHead, nameKeyword, derive, nameRequired: headName && mandatory && (line || call || keyword === '') });
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
    const classesOfRule = (baseName: string): string[] => {
        const cls = clsOfObjectRule.get(baseName);
        if (cls !== undefined) return [cls];
        return (choiceRules.find(c => c.name === baseName)?.alts ?? []).flatMap(a => clsOfObjectRule.get(a) ?? []);
    };

    // Step C lane C1a: the operator classes, their fixity read off their features; one that cannot stand in an expression is refused.
    const operators = new Map<string, ExprOperator>();
    for (const [cls, a] of Object.entries(A?.classes ?? {})) {
        const op = a.operator;
        if (!op) continue;
        const where = `class ${cls}`;
        const r = objectRules.find(o => o.cls === cls);
        if (!r) { refuse(where, `${cls} is abstract: an operator goes on its concrete classes; not applied`); continue; }
        const fx = operatorFixity(r.features.map(f => f.feature));
        if (!fx) {
            refuse(where, `the operator "${op.symbol}" is not applied: ${cls} has not the shape of an operator (its only features one many-valued containment, two single-valued ones, or one single-valued one)`);
            continue;
        }
        const bad = r.features.find(f => f.value.t === 'block' && !classesOfRule(f.value.rule).includes(cls));
        if (bad) {
            refuse(where, `the operator "${op.symbol}" is not applied: its operand ${featureKey(bad.feature)} holds a ${bad.feature.type}, not a ${cls}`);
            continue;
        }
        let call: string | undefined;
        if (fx.fixity === 'nary') call = op.call ?? (shapes.get(cls)?.keyword || applyCase(cls, classCase));
        else if (op.call !== undefined) refuse(where, `the call word "${op.call}" is not applied: a call form is for n-ary operators, and ${cls} is ${fx.fixity}`);
        operators.set(cls, { cls, symbol: op.symbol, precedence: op.precedence, assoc: op.assoc ?? 'left', fixity: fx.fixity, operands: fx.operands, ...(call !== undefined ? { call } : {}) });
    }

    // The classes that stand as primaries of an expression: a positional one has its mandatory single values required.
    const primaryClasses = new Set(choiceRules.flatMap(c => {
        const classes = c.alts.flatMap(a => clsOfObjectRule.get(a) ?? []);
        return classes.some(k => operators.has(k)) ? classes.filter(k => !operators.has(k)) : [];
    }));

    // R-TXT-51: the per-block tokens of each class and containment, by `class C` or `Owner.f`, after the refusals that
    // need no context: under Indentation they are ignored (a notice); a token inside an item (D5) or an empty side (D8)
    // is refused, that side the style's. A class with no block is refused here, a containment with none where it is built (D9).
    type OwnBlock = { blockOpen?: readonly string[]; blockClose?: readonly string[] };
    const ownBlocks = new Map<string, OwnBlock>();
    const insideItem = new Map<string, string>();
    for (const [what, ts] of [['the terminator', style.terminator], ['the assignment', style.assign], ['a list token', [style.list.open, style.list.separator, style.list.close]]] as const) {
        for (const t of ts) if (!insideItem.has(t)) insideItem.set(t, what);
    }
    // A token the style's own blocks hold (Pascal's `end ;`) is not refused for being the terminator too.
    const styleBlockTokens = new Set([...style.blockOpen, ...style.blockClose, ...style.emptyBlock]);
    const hasOwn = (a: OwnBlock): boolean => a.blockOpen !== undefined || a.blockClose !== undefined;
    const noBlock = (where: string, name: string, why: string): void => refuse(where, `blockOpen and blockClose apply to a block, and ${name} has none (${why}); not applied`);
    // B3a (D8 reconsidered): an empty open of a class with a prefix, kept until the prefix is known to apply.
    const emptyOpens = new Set<string>();
    const ownOf = (where: string, a: OwnBlock, prefixed = false): void => {
        if (style.layout === 'indent') { remark(where, `blockOpen and blockClose are ignored under the style ${style.id}: a block is its indentation`); return; }
        const out: OwnBlock = {};
        for (const side of ['blockOpen', 'blockClose'] as const) {
            const ts = a[side];
            if (ts === undefined) continue;
            if (!ts.length && side === 'blockOpen' && prefixed) emptyOpens.add(where);
            else if (!ts.length) { refuse(where, `${side} is empty: a block needs a token on each side; not applied`); continue; }
            const bad = ts.find(t => insideItem.has(t) && !styleBlockTokens.has(t));
            if (bad !== undefined) { refuse(where, `the ${side} token "${bad}" is ${insideItem.get(bad)} of the style ${style.id}; not applied`); continue; }
            out[side] = ts;
        }
        if (hasOwn(out)) ownBlocks.set(where, out);
    };
    for (const [cls, a] of Object.entries(A?.classes ?? {})) {
        if (!hasOwn(a)) continue;
        const where = `class ${cls}`;
        const sh = shapes.get(cls);
        if (!sh) refuse(where, `${cls} is abstract: blockOpen and blockClose go on its concrete classes; not applied`);
        else if (sh.line || sh.call) noBlock(where, cls, sh.line ? 'layout line' : 'layout call');
        else ownOf(where, a, !!a.prefix?.length);
    }
    const concreteKeys = new Set(objectRules.flatMap(r => r.features.map(f => featureKey(f.feature))));
    for (const [key, a] of Object.entries(A?.features ?? {})) if (hasOwn(a) && concreteKeys.has(key)) ownOf(key, a);
    // D2: the words of the blocks built with tokens of their own, reserved in the grammar's style.
    const blockWords = new Set<string>();
    // C3b: under indentation a block is INDENT, its items, DEDENT; an empty one is nothing. R-TXT-51: a free-layout block
    // takes its owner's tokens, a side not given the style's, and its empty form is open then close when one is its own.
    const block = (items: readonly GrammarNode[], owner?: Exclude<BlockOrigin, { k: 'fixed' }>): GrammarNode => {
        if (style.layout === 'indent') return { t: 'block', open: [INDENT_MARK], close: [DEDENT_MARK], empty: [], items, origin: { open: FIXED_BLOCK, close: FIXED_BLOCK } };
        const own = owner ? ownBlocks.get(owner.k === 'class' ? `class ${owner.cls}` : owner.feature) : undefined;
        if (!owner || !own) return { t: 'block', open: style.blockOpen, close: style.blockClose, empty: style.emptyBlock, items };
        const open = own.blockOpen ?? style.blockOpen;
        const close = own.blockClose ?? style.blockClose;
        for (const w of [...(own.blockOpen ?? []), ...(own.blockClose ?? [])]) if (/^\w/.test(w)) blockWords.add(w);
        return { t: 'block', open, close, empty: [...open, ...close], items, origin: { ...(own.blockOpen ? { open: owner } : {}), ...(own.blockClose ? { close: owner } : {}) } };
    };
    // C1d: the tokens a punctuation keyword may not be, by what they are in the style in force.
    const taken = new Map<string, string>();
    const take = (what: string, ts: readonly string[]): void => { for (const t of ts) if (!/^\w/.test(t) && !taken.has(t)) taken.set(t, what); };
    take('a block token', [...style.blockOpen, ...style.blockClose, ...style.emptyBlock]);
    // R-TXT-51: and the per-block punctuation, by the element whose block it is.
    const ownTaken = new Map<string, string>();
    for (const [where, o] of ownBlocks) for (const t of [...(o.blockOpen ?? []), ...(o.blockClose ?? [])]) if (!/^\w/.test(t) && !ownTaken.has(t)) ownTaken.set(t, where);
    take('a list token', [style.list.open, style.list.separator, style.list.close]);
    take('the terminator', style.terminator);
    take('the assignment', style.assign);
    take('a token of a reference', ['.', '[', ']', '@']);
    take('a token of an expression or a call', ['(', ')']);
    take('an operator symbol', [...operators.values()].map(o => o.symbol));
    // B3a (R-TXT-51 (3)): the head prefix of each class, before its keyword. A token inside an item (D5), or of a
    // reference, an expression or an operator, refuses the whole prefix; a block token does not (`begin program`). Its
    // words are reserved as the per-block words are (D2), its punctuation taken by the class.
    const prefixes = new Map<string, readonly string[]>();
    const prefixTaken = new Map<string, string>();
    const prefixFault = (t: string): string | undefined => insideItem.get(t) ?? (/^\w/.test(t) || taken.get(t) === 'a block token' ? undefined : taken.get(t));
    for (const [cls, a] of Object.entries(A?.classes ?? {})) {
        if (!a.prefix?.length) continue;
        const where = `class ${cls}`;
        if (!shapes.has(cls)) { refuse(where, `${cls} is abstract: a prefix goes on its concrete classes; not applied`); continue; }
        if (operators.has(cls)) { refuse(where, `${cls} is an operator, printed by its symbol in an expression: the prefix is not applied`); continue; }
        const bad = a.prefix.find(t => prefixFault(t) !== undefined);
        if (bad !== undefined) { refuse(where, `the prefix token "${bad}" is ${prefixFault(bad)} of the style ${style.id}; not applied`); continue; }
        prefixes.set(cls, a.prefix);
        for (const t of a.prefix) if (/^\w/.test(t)) blockWords.add(t); else if (!prefixTaken.has(t)) prefixTaken.set(t, cls);
    }
    // D8 reconsidered: under free layout a class's block may have no open when its prefix applies, so that its FIRST is
    // the prefix's and never the block's, and no optional name stands right before the body: a mandatory one becomes
    // required in the head. Otherwise the empty open is refused as today, and the block opens with the style's.
    for (const r of objectRules) {
        const where = `class ${r.cls}`;
        const own = ownBlocks.get(where);
        const sh = shapes.get(r.cls);
        if (!emptyOpens.has(where) || !own || !sh) continue;
        const headName = r.named && sh.nameKeyword === undefined;
        const why = !prefixes.has(r.cls) ? 'a block needs a token on each side'
            : headName && !A?.mandatoryName.has(r.cls) ? `the optional name of ${r.cls} would stand right before its body` : undefined;
        if (why === undefined) { if (headName) shapes.set(r.cls, { ...sh, nameRequired: true }); continue; }
        refuse(where, `blockOpen is empty: ${why}; not applied`);
        const { blockOpen: _open, ...rest } = own;
        if (hasOwn(rest)) ownBlocks.set(where, rest);
        else ownBlocks.delete(where);
    }
    /** The keyword a feature prints, a punctuation one refused when it is a token of the style or an operator. */
    const keywordOf = (f: TextFeature): string => {
        const k = featAnn(f).keyword ?? f.name;
        if (k === '' || /^\w/.test(k) || (!taken.has(k) && !ownTaken.has(k) && !prefixTaken.has(k))) return k;
        if (taken.has(k)) refuse(featureKey(f), `the keyword "${k}" is ${taken.get(k)} of the style ${style.id}; not applied`);
        else if (ownTaken.has(k)) refuse(featureKey(f), `the keyword "${k}" is a block token of ${(ownTaken.get(k) ?? '').replace(/^class /, '')}; not applied`);
        else refuse(featureKey(f), `the keyword "${k}" is a prefix token of ${prefixTaken.get(k)}; not applied`);
        return f.name;
    };
    const single = (v: BaseValue, f: TextFeature): GrammarNode => {
        switch (v.t) {
            case 'terminal':
                if (featAnn(f).value === 'name') {
                    if (v.terminal === 'STRING') return { t: 'tok', terminal: 'NAME' };
                    refuse(featureKey(f), `value "name" applies to a string attribute, not to ${v.terminal}; not applied`);
                }
                return { t: 'tok', terminal: v.terminal };
            case 'enum': return { t: 'lit', rule: v.rule };
            case 'ref': return { t: 'xref', type: v.type, targets: v.targets };
            default: throw new Error(`a ${v.t} value is not a single value`);
        }
    };

    const derivedObjects: ObjectRule[] = [];
    const derivedEnums: ConcreteRule[] = [];
    const takenNames = new Set<string>([
        'Model', ...base.rules.map(r => r.name), ...objectRules.map(r => r.cls), ...enumRules.map(e => e.name),
    ]);
    const groupsMemo = new Map<string, GrammarNode[] | undefined>();

    /** The items of a containment grouped by an enumeration attribute of its class (R-TXT-21 (4)); undefined when refused. */
    const groups = (f: TextFeature, v: Extract<BaseValue, { t: 'block' }>, gb: NonNullable<ResolvedFeature['groupBy']>): GrammarNode[] | undefined => {
        const key = featureKey(f);
        if (groupsMemo.has(key)) return groupsMemo.get(key);
        groupsMemo.set(key, undefined);
        const no = (m: string): undefined => { refuse(key, `groupBy not applied: ${m}`); return undefined; };
        if (!v.many) return no('the containment is single-valued');
        const classes = classesOfRule(v.rule);
        if (classes.length !== 1) return no(`the contained type ${f.type} stands for ${classes.length} concrete classes, not one`);
        const T = objectRules.find(r => r.cls === classes[0]);
        if (!T) return no(`no rule for ${classes[0]}`);
        const attr = T.features.find(x => x.feature.name === gb.attr && x.feature.owner === gb.owner)?.feature;
        if (!attr) return no(`${gb.owner}.${gb.attr} is not a feature of ${T.cls}`);
        const en = enumRules.find(e => e.name === attr.type);
        if (attr.kind !== 'attribute' || attr.many || !en) return no(`${gb.owner}.${gb.attr} is not a single-valued enumeration attribute`);
        if (!gb.mandatory) return no(`${gb.owner}.${gb.attr} is optional, and a grouping needs a mandatory attribute (R-TXT-21 (4))`);
        const subsets = A?.enums[en.name]?.subsets ?? [];
        if (!subsets.length) return no(`the enumeration ${en.name} has no subsets`);
        const all = subsets.flatMap(s => s.literals);
        const unknown = all.filter(l => !en.literals.includes(l));
        if (unknown.length) return no(`${[...new Set(unknown)].join(', ')}: not literals of ${en.name}`);
        const twice = all.filter((l, i) => all.indexOf(l) !== i);
        if (twice.length) return no(`${[...new Set(twice)].join(', ')} in more than one subset of ${en.name}`);
        const missing = en.literals.filter(l => !all.includes(l));
        if (missing.length) return no(`${missing.join(', ')} in no subset of ${en.name}: the subsets are not a partition`);
        const printed = new Set(en.literals.map(l => applyCase(l, literalCase)));
        const names = subsets.map(s => s.name);
        const sameName = names.filter((n, i) => names.indexOf(n) !== i);
        if (sameName.length) return no(`the subset name ${sameName[0]} is used twice`);
        const asLiteral = names.filter(n => printed.has(n));
        if (asLiteral.length) return no(`the subset name ${asLiteral.join(', ')} prints as a literal of ${en.name}`);
        const ruleNames = subsets.flatMap(s => [`${en.name}_${s.name}`, `${T.cls}_${s.name}`]);
        const taken = ruleNames.filter((n, i) => takenNames.has(n) || ruleNames.indexOf(n) !== i);
        if (taken.length) return no(`the rule name ${taken[0]} is taken`);

        const out: GrammarNode[] = [];
        for (const s of subsets) {
            const enumName = `${en.name}_${s.name}`;
            const objName = `${T.cls}_${s.name}`;
            takenNames.add(enumName);
            takenNames.add(objName);
            const literals = s.literals;
            derivedEnums.push({ t: 'enum', name: enumName, literals, body: { t: 'alt', alts: literals.map(l => ({ t: 'kw', text: applyCase(l, literalCase), src: { k: 'literal', enumName: en.name, literal: l } })) } });
            derivedObjects.push({ t: 'object', name: objName, cls: T.cls, named: T.named, features: T.features.map(x => x.feature), body: objectBody(T, { attr, rule: enumName }) });
            const where: GroupFilter = { attr: attr.name, literals };
            const el: GrammarNode = { t: 'assign', feat: f.name, op: '+=', item: { t: 'rule', name: objName } };
            // One-line objects follow the subset's keyword on its line; objects with a block of their own go one per
            // line in a block, as an ungrouped containment's do (T4a-2: chained on one line they read `} Book b {`).
            const members: GrammarNode = shapes.get(T.cls)?.line
                ? { t: 'star', feat: f.name, where, item: el }
                : block([{ t: 'star', feat: f.name, where, item: { t: 'seq', items: [el, { t: 'nl' }] } }], { k: 'feature', feature: key });
            out.push({
                t: 'opt', feat: f.name, where, item: {
                    t: 'seq', items: [
                        { t: 'kw', text: s.name, src: { k: 'subset', enumName: en.name, index: subsets.indexOf(s) } },
                        members,
                        { t: 'nl' },
                    ],
                },
            });
        }
        groupsMemo.set(key, out);
        return out;
    };

    /** `override`: in a derived rule of a grouping, the grouping attribute is not optional and takes the subset's literals.
     *  `primary`: the class is a positional primary of an expression, where a mandatory single value is not optional (C1a). */
    const feature = (f: TextFeature, v: BaseValue, line: boolean, override?: { readonly attr: TextFeature; readonly rule: string }, primary = false, strict = false): GrammarNode => {
        const a = featAnn(f);
        const key = featureKey(f);
        const kwText = keywordOf(f);
        const kwSrc: LiteralSrc = { k: 'feature', feature: key };
        const kw: GrammarNode[] = kwText === '' ? [] : [/^\w/.test(kwText) ? { t: 'kw', text: kwText, src: kwSrc } : { t: 'p', text: kwText, src: kwSrc }];
        const nl: GrammarNode[] = line ? [] : [{ t: 'nl' }];
        // `strict`: a one-line head with an optional name (D3), where a mandatory single value is not optional.
        const required = strict && !f.many && !!A?.mandatory?.has(key);
        let itemKw = a.itemKeyword;
        if (itemKw !== undefined && (v.t !== 'block' || !v.many)) {
            refuse(key, `itemKeyword applies to a multi-valued containment, and ${key} is ${v.t !== 'block' ? 'not a containment' : 'single-valued'}; not applied`);
            itemKw = undefined;
        }
        if (itemKw !== undefined && a.groupBy) {
            refuse(key, 'itemKeyword is not applied with groupBy: a group prints its own keyword');
            itemKw = undefined;
        }
        // R-TXT-51 (D9): a containment printed without a block of its own has no block to take tokens.
        if (ownBlocks.has(key)) {
            const why = v.t !== 'block' ? 'not a containment' : line ? 'in a one-line class' : a.inline ? 'inline' : itemKw !== undefined ? 'an item keyword' : undefined;
            if (why) noBlock(key, key, why);
        }
        if (v.t === 'block') {
            if (a.value === 'name') refuse(key, 'value "name" applies to a string attribute; not applied');
            if (a.inline && a.keyword !== undefined && !line) remark(key, 'inline: the keyword is not printed');
            const blank: GrammarNode[] = style.blankBeforeContainment ? [{ t: 'nl', blank: true }] : [];
            const el: GrammarNode = { t: 'assign', feat: f.name, op: v.many ? '+=' : '=', item: ruleRef(v.rule) };
            // C1d: an expression, or a positional primary, prints no terminator inside: the terminator closes its line.
            const closed: GrammarNode[] = classesOfRule(v.rule).some(k => operators.has(k) || (primaryClasses.has(k) && shapes.get(k)?.keyword === ''))
                ? [el, ...tokens('terminator', style.terminator)] : [el];
            // C1d: the child of a single-valued inline containment in a one-line class, in the line after the keyword.
            if (line) {
                const item: GrammarNode = { t: 'seq', items: [...kw, el] };
                return required ? item : { t: 'opt', feat: f.name, item };
            }
            if (itemKw !== undefined) {
                if (a.inline) remark(key, 'itemKeyword: inline is not applied');
                if (a.keyword !== undefined) remark(key, 'itemKeyword: the keyword is not printed');
                return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, { t: 'star', feat: f.name, item: { t: 'seq', items: [{ t: 'kw', text: itemKw, src: { k: 'itemKeyword', feature: key } }, el, { t: 'nl' }] } }] } };
            }
            const content: GrammarNode[] = (a.groupBy ? groups(f, v, a.groupBy) : undefined)
                ?? (v.many ? [{ t: 'star', feat: f.name, item: { t: 'seq', items: [...closed, { t: 'nl' }] } }] : [...closed, { t: 'nl' }]);
            if (a.inline) return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...content] } };
            return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...kw, block(content, { k: 'feature', feature: key }), { t: 'nl' }] } };
        }
        if (a.inline) refuse(key, 'inline applies to a containment; not applied');
        if (a.groupBy) refuse(key, 'groupBy applies to a containment; not applied');
        if (override && f.name === override.attr.name && f.owner === override.attr.owner) {
            const value: GrammarNode = { t: 'assign', feat: f.name, op: '=', item: { t: 'lit', rule: override.rule } };
            return { t: 'seq', items: [...kw, ...(kw.length ? tokens('assign', style.assign) : []), value, ...tokens('terminator', style.terminator), ...nl] };
        }
        const value: GrammarNode = v.t === 'list'
            ? { t: 'list', feat: f.name, open: style.list.open, separator: style.list.separator, close: style.list.close, item: { t: 'assign', feat: f.name, op: '+=', item: single(v.item, f) } }
            : { t: 'assign', feat: f.name, op: '=', item: single(v, f) };
        // C1d: a positional primary's value takes no terminator; the expression's line does (`closed`).
        const item: GrammarNode = { t: 'seq', items: [...kw, ...(kw.length ? tokens('assign', style.assign) : []), value, ...(primary ? [] : tokens('terminator', style.terminator)), ...nl] };
        if (((primary && v.t !== 'list') || required) && A?.mandatory?.has(key)) return item;
        return { t: 'opt', feat: f.name, item };
    };

    function objectBody(r: Extract<BaseRule, { t: 'object' }>, override?: { readonly attr: TextFeature; readonly rule: string }): GrammarNode {
        const sh = shapes.get(r.cls) ?? { keyword: applyCase(r.cls, classCase), line: false, call: false, optionalHead: false, nameRequired: false };
        const nameAssign: GrammarNode = { t: 'assign', feat: 'name', op: '=', item: { t: 'tok', terminal: 'NAME' } };
        const derive = sh.derive ? { derive: sh.derive } : {};
        // B3a: the head prefix, before the class keyword and the name of a positional class.
        const prefix = (prefixes.get(r.cls) ?? []).map((text, index): GrammarNode => {
            const src: LiteralSrc = { k: 'classPrefix', cls: r.cls, index };
            return /^\w/.test(text) ? { t: 'kw', text, src } : { t: 'p', text, src };
        });
        const head: GrammarNode[] = sh.keyword === '' ? [...prefix] : [...prefix, { t: 'kw', text: sh.keyword, src: { k: 'class', cls: r.cls } }];
        // C1d: a positional one-line object with nothing but an optional name prints its empty block when the name is unset.
        if (r.named && sh.optionalHead && sh.line && sh.keyword === '' && !r.features.length && !sh.derive) {
            return { t: 'seq', items: [...prefix, { t: 'alt', alts: [nameAssign, block([])] }] };
        }
        if (r.named && sh.nameKeyword === undefined) head.push(sh.nameRequired ? nameAssign : { t: 'opt', feat: 'name', ...derive, item: nameAssign });
        if (sh.call) {
            // C1d: `Word(32)`, the arguments in declaration order, every one mandatory and single-valued (shapes).
            const args = r.features.flatMap((f, i): GrammarNode[] => [
                ...(i ? [{ t: 'p', text: style.list.separator, tight: 'before', src: { k: 'style', param: 'list.separator', index: 0 } } as const] : []),
                { t: 'assign', feat: f.feature.name, op: '=', item: single(f.value, f.feature) },
            ]);
            return { t: 'seq', items: [...head, { t: 'p', text: '(', tight: 'around', src: FIXED }, ...args, { t: 'p', text: ')', tight: 'before', src: FIXED }] };
        }
        const primary = sh.keyword === '' && primaryClasses.has(r.cls);
        const items = r.features.map(f => feature(f.feature, f.value, sh.line, override, primary, sh.optionalHead && sh.line));
        if (r.named && sh.nameKeyword !== undefined) {
            const tail: GrammarNode[] = sh.line ? [] : [{ t: 'nl' }];
            items.push({ t: 'opt', feat: 'name', ...derive, item: { t: 'seq', items: [{ t: 'kw', text: sh.nameKeyword, src: { k: 'nameKeyword', cls: r.cls } }, nameAssign, ...tail] } });
        }
        return { t: 'seq', items: sh.line ? [...head, ...items] : [...head, block(items, { k: 'class', cls: r.cls })] };
    }

    const objects: Record<string, ObjectRule> = {};
    const rules: ConcreteRule[] = [];
    const exprClasses = new Set<string>();
    for (const r of base.rules) {
        if (r.t === 'model') {
            let alts = r.alts;
            if (A?.roots) {
                const concrete = objectRules.map(o => o.cls);
                let keep: readonly string[];
                if (A.roots === 'uncontained') {
                    const contained = new Set(objectRules.flatMap(o => o.features.flatMap(f => (f.value.t === 'block' ? classesOfRule(f.value.rule) : []))));
                    keep = concrete.filter(c => !contained.has(c));
                } else {
                    const bad = A.roots.filter(c => !concrete.includes(c));
                    if (bad.length) refuse('roots', `${bad.join(', ')}: not a concrete class; roots not applied`);
                    keep = bad.length ? concrete : A.roots;
                }
                if (!keep.length) {
                    refuse('roots', 'no class is left at the top level; roots not applied');
                    keep = concrete;
                }
                alts = r.alts.filter(a => keep.includes(clsOfObjectRule.get(a) ?? ''));
            }
            rules.push({ t: 'model', name: 'Model', body: { t: 'star', item: { t: 'seq', items: [{ t: 'alt', alts: alts.map(a => ruleRef(a)) }, { t: 'nl' }] } } });
        } else if (r.t === 'object') {
            const rule: ObjectRule = { t: 'object', name: r.cls, cls: r.cls, named: r.named, features: r.features.map(f => f.feature), body: objectBody(r) };
            objects[r.cls] = rule;
            rules.push(rule);
        }
    }
    rules.push(...derivedObjects);
    for (const name of usedChoices) {
        const c = choiceRules.find(k => k.name === name);
        if (!c) continue;
        const ops = c.alts.flatMap(a => operators.get(clsOfObjectRule.get(a) ?? '') ?? []).sort((x, y) => x.precedence - y.precedence);
        if (!ops.length) { rules.push({ t: 'choice', name, body: { t: 'alt', alts: c.alts.map(a => ruleRef(a)) } }); continue; }
        const primaries = c.alts.filter(a => !operators.has(clsOfObjectRule.get(a) ?? '')).map(a => ruleRef(a));
        ops.forEach(o => exprClasses.add(o.cls));
        rules.push({ t: 'choice', name, body: { t: 'expr', type: c.cls, rule: name, operators: ops, primaries, open: '(', close: ')', separator: style.list.separator } });
    }
    // An operator's rule goes when nothing but an expression names it; it stays in `objects`, the printer's (until C1b).
    const named = new Set<string>();
    const collect = (n: GrammarNode): void => {
        switch (n.t) {
            case 'seq': n.items.forEach(collect); return;
            case 'opt': case 'star': case 'assign': case 'list': collect(n.item); return;
            case 'alt': n.alts.forEach(collect); return;
            case 'block': n.items.forEach(collect); return;
            case 'rule': named.add(n.name); return;
            case 'expr': n.primaries.forEach(collect); return;
            default: return;
        }
    };
    for (const r of rules) if (!(r.t === 'object' && exprClasses.has(r.cls))) collect(r.body);
    for (let i = rules.length - 1; i >= 0; i--) {
        const r = rules[i];
        if (r.t === 'object' && exprClasses.has(r.cls) && !named.has(r.name)) rules.splice(i, 1);
    }
    for (const e of enumRules) {
        rules.push({ t: 'enum', name: e.name, literals: e.literals, body: { t: 'alt', alts: e.literals.map(l => ({ t: 'kw', text: applyCase(l, literalCase), src: { k: 'literal', enumName: e.name, literal: l } })) } });
    }
    rules.push(...derivedEnums);
    if (!A) return { grammar: { style, rules, objects, classCase, literalCase, notices }, heads };
    // D2: the per-block words join the reserved names, which the printer, the parser and the check read.
    const own = [...blockWords].filter(w => !style.reservedNames.includes(w)).sort();
    const gStyle: NotationStyle = own.length ? { ...style, reservedNames: [...style.reservedNames, ...own] } : style;
    const seen = new Set<string>();
    const annotationIssues = issues.filter(i => {
        const k = `${i.level}|${i.where}|${i.message}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    return { grammar: { style: gStyle, rules, objects, classCase, literalCase, notices, annotationIssues }, heads };
}

/** The name a pattern gives an object: each hole is the attribute as printed (a literal in the literal case in effect), unquoted. */
export function derivedName(g: ConcreteGrammar, rule: ObjectRule, slots: Readonly<Record<string, unknown>>, pattern: NamePattern): string | undefined {
    const enums = new Set(g.rules.flatMap(r => (r.t === 'enum' ? [r.name] : [])));
    return expandNamePattern(pattern, h => {
        const v = slots[h];
        if (v == null || Array.isArray(v)) return undefined;
        const f = rule.features.find(x => x.name === h);
        return f && enums.has(f.type) ? applyCase(String(v), g.literalCase) : String(v);
    });
}

/** A piece of the EBNF text: plain text, or a quoted literal with its origin (printed between quotes). */
type Chunk = string | { readonly lit: string; readonly src?: LiteralSrc };

const quoted = (s: string, src?: LiteralSrc): Chunk => ({ lit: s, ...(src ? { src } : {}) });
const styleSrc = (param: StyleParam, index = 0): LiteralSrc => ({ k: 'style', param, index });
/** The origin of a block token of a side whose tokens are not the style's (D10); undefined for a style side. */
const blockSrc = (o: BlockOrigin | undefined, side: 'open' | 'close', index: number): LiteralSrc | undefined =>
    (o?.k === 'class' ? { k: 'classBlock', cls: o.cls, side, index } : o?.k === 'feature' ? { k: 'featureBlock', feature: o.feature, side, index } : o ? FIXED : undefined);
const isBlank = (cs: readonly Chunk[]): boolean => cs.every(c => c === '');
const joined = (parts: readonly (readonly Chunk[])[], sep: string): Chunk[] => parts.flatMap((p, i) => (i ? [sep, ...p] : [...p]));
const paren = (cs: readonly Chunk[], top: boolean): Chunk[] => (top ? [...cs] : ['(', ...cs, ')']);

function nodeText(n: GrammarNode, top = false): Chunk[] {
    switch (n.t) {
        case 'seq': {
            const parts = n.items.filter(x => !isBlank(nodeText(x)));
            if (parts.length === 1) return nodeText(parts[0], top);
            // A sequence inside a sequence needs no parentheses (C1d: a required inline child, `":" type=Type_`).
            return paren(joined(parts.map(x => nodeText(x, x.t === 'seq')), ' '), top);
        }
        case 'opt': {
            // An inline containment: the optional star prints as the star.
            const inner = n.item.t === 'seq' ? n.item.items.filter(x => x.t !== 'nl') : [n.item];
            if (inner.length === 1 && inner[0].t === 'star') return nodeText(inner[0]);
            return ['[', ...nodeText(n.item, true), `]${n.derive ? ` (* else name = ${n.derive.source} *)` : ''}`];
        }
        case 'star': return ['{', ...nodeText(n.item, true), '}'];
        case 'alt': return paren(joined(n.alts.map(x => nodeText(x)), ' | '), top);
        case 'kw': case 'p': return [quoted(n.text, n.src)];
        case 'tok': return [n.terminal];
        case 'xref': return ['REF'];
        case 'lit': return [n.rule];
        case 'rule': return [n.name];
        case 'assign': return [`${n.feat}${n.op}`, ...nodeText(n.item)];
        case 'list': {
            const item = nodeText(n.item);
            const s: Chunk[] = [quoted(n.open, styleSrc('list.open')), ' [', ...item, ' {', quoted(n.separator, styleSrc('list.separator')), ' ', ...item, '}] ', quoted(n.close, styleSrc('list.close'))];
            return paren(s, top);
        }
        case 'block': return joined([
            ...n.open.map((t, i) => [quoted(t, blockSrc(n.origin?.open, 'open', i) ?? styleSrc('blockOpen', i))]),
            ...n.items.map(x => nodeText(x)).filter(cs => !isBlank(cs)),
            ...n.close.map((t, i) => [quoted(t, blockSrc(n.origin?.close, 'close', i) ?? styleSrc('blockClose', i))]),
        ], ' ');
        case 'nl': return [''];
        case 'expr': return paren(joined(exprAlternatives(n), ' | '), top);
    }
}

const FIXITY_TEXT: Readonly<Record<OperatorFixity, string>> = { nary: 'n-ary', binary: 'binary', prefix: 'prefix' };

/** The alternatives of an expression as EBNF, each operator's with a comment on its class, fixity and precedence. */
function exprAlternatives(n: Extract<GrammarNode, { t: 'expr' }>): Chunk[][] {
    const R = n.rule;
    const open = quoted(n.open, FIXED);
    const close = quoted(n.close, FIXED);
    const out: Chunk[][] = [];
    for (const o of n.operators) {
        const s = quoted(o.symbol, { k: 'operatorSymbol', cls: o.cls });
        const [a, b] = o.operands;
        const text: Chunk[] = o.fixity === 'binary' ? [`${a}=${R} `, s, ` ${b}=${R}`]
            : o.fixity === 'nary' ? [`${a}+=${R} `, s, ` ${a}+=${R} {`, s, ` ${a}+=${R}}`]
                : [s, ` ${a}=${R}`];
        out.push([...text, ` (* ${o.cls}, ${FIXITY_TEXT[o.fixity]}${o.fixity === 'binary' ? `, ${o.assoc}` : ''}, precedence ${o.precedence} *)`]);
    }
    for (const o of n.operators) {
        if (o.call === undefined) continue;
        const a = o.operands[0];
        out.push([quoted(o.call, { k: 'operatorCall', cls: o.cls }), ' ', open, ` [${a}+=${R} {`, quoted(n.separator, styleSrc('list.separator')), ` ${a}+=${R}}] `, close, ` (* ${o.cls}, call form *)`]);
    }
    out.push(...n.primaries.map(p => nodeText(p)), [open, ` ${R} `, close]);
    return out;
}

/** A quoted literal of the EBNF text: `text` is `ebnf.slice(start, end)`, between its quotes, and `src` its origin. */
export interface EbnfLiteral {
    readonly start: number;
    readonly end: number;
    readonly text: string;
    readonly src?: LiteralSrc;
}

/**
 * The concrete grammar as EBNF with the span and the origin of every quoted literal, in text order (R-TXT-49 D1); the
 * comments hold none. `text` is what `concreteGrammarEbnf` prints.
 */
export function concreteGrammarEbnfSpans(g: ConcreteGrammar): { readonly text: string; readonly literals: readonly EbnfLiteral[] } {
    const width = Math.max(...g.rules.map(r => r.name.length));
    const lines = g.rules.map((r): Chunk[] => {
        const head = `${r.name.padEnd(width)} ::= `;
        if (r.body.t !== 'expr') return [head, ...nodeText(r.body, true), ' ;'];
        // An expression over several lines, one alternative per line, the bars under the `=` of `::=`.
        return [head, ...joined(exprAlternatives(r.body), `\n${' '.repeat(width + 3)}| `), ' ;'];
    });
    let text = '';
    const literals: EbnfLiteral[] = [];
    for (const c of joined(lines, '\n')) {
        if (typeof c === 'string') { text += c; continue; }
        const start = text.length + 1;
        text += `"${c.lit}"`;
        literals.push({ start, end: start + c.lit.length, text: c.lit, ...(c.src ? { src: c.src } : {}) });
    }
    return { text, literals };
}

/** The concrete grammar as EBNF, one rule per line, the `::=` aligned; feature assignments name the features. */
export function concreteGrammarEbnf(g: ConcreteGrammar): string {
    return concreteGrammarEbnfSpans(g).text;
}

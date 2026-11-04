/**
 * The concrete grammar: the base grammar with a style's tokens and the syntax annotations (R-TXT-16 levels 1, 2 and 3;
 * annotations.ts), and its EBNF text annotated with the features (docs/discovery/discovery_2026-11-01_textual_viewpoint.md
 * §A.1, §A.2). The grammar is data over a closed vocabulary of nodes; the printer (printer.ts) walks it with the
 * object, and the parser of step T2 is to interpret the same data.
 */

import type { AnnotationIssue, NamePattern, ResolvedAnnotations, ResolvedFeature } from './annotations';
import { expandNamePattern, patternHoles } from './annotations';
import type { BaseGrammar, BaseRule, BaseValue } from './baseGrammar';
import type { TextFeature } from './metamodel';
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

export type GrammarNode =
    | { readonly t: 'seq'; readonly items: readonly GrammarNode[] }
    /** Present iff the feature is set (R-TXT-5); with `where`, iff one of its values passes the filter; with `derive` (the name), absent when the name equals the pattern's expansion, which the parser fills in. */
    | { readonly t: 'opt'; readonly feat: string; readonly item: GrammarNode; readonly where?: GroupFilter; readonly derive?: NamePattern }
    /** Once per value of the feature (with `where`, per value that passes the filter); without a feature only in the `Model` rule. */
    | { readonly t: 'star'; readonly feat?: string; readonly item: GrammarNode; readonly where?: GroupFilter }
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
    /** A line break in the printed text; no token. `blank`: an empty line before what follows, unless a body starts there. */
    | { readonly t: 'nl'; readonly blank?: true };

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

/** The shape an object rule takes after its class's annotations, refusals applied. */
interface ClassShape {
    /** `''`: positional. */
    readonly keyword: string;
    readonly line: boolean;
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
    if (style.layout !== 'free') throw new Error(`style ${style.id}: layout ${style.layout} is not implemented (step T5)`);

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
    const styleWords = new Set([
        ...style.blockOpen, ...style.blockClose, ...style.emptyBlock, ...style.assign, ...style.terminator,
        style.list.open, style.list.separator, style.list.close,
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
    for (const r of objectRules) {
        const a = A?.classes[r.cls] ?? {};
        const where = `class ${r.cls}`;
        let line = a.layout === 'line';
        if (line && r.features.some(f => f.feature.kind === 'containment')) {
            refuse(where, `${r.cls} has a containment: layout line not applied`);
            line = false;
        }
        let keyword = a.keyword ?? applyCase(r.cls, classCase);
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
        // R-TXT-27: in the head of a one-line or positional class an optional name would read a following word as the name.
        const headName = r.named && nameKeyword === undefined;
        const mandatory = !!A?.mandatoryName.has(r.cls);
        if (headName && !mandatory) {
            if (line) {
                refuse(where, `${r.cls}.name is optional: a one-line class needs a mandatory name in its head; layout line not applied`);
                line = false;
            }
            if (keyword === '') {
                refuse(where, `${r.cls}.name is optional: a positional class needs a mandatory name in its head; the keyword "" not applied`);
                keyword = applyCase(r.cls, classCase);
            }
        }
        shapes.set(r.cls, { keyword, line, nameKeyword, derive, nameRequired: headName && mandatory && (line || keyword === '') });
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

    const block = (items: readonly GrammarNode[]): GrammarNode => ({ t: 'block', open: style.blockOpen, close: style.blockClose, empty: style.emptyBlock, items });
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
            derivedEnums.push({ t: 'enum', name: enumName, literals, body: { t: 'alt', alts: literals.map(l => ({ t: 'kw', text: applyCase(l, literalCase) })) } });
            derivedObjects.push({ t: 'object', name: objName, cls: T.cls, named: T.named, features: T.features.map(x => x.feature), body: objectBody(T, { attr, rule: enumName }) });
            const where: GroupFilter = { attr: attr.name, literals };
            const el: GrammarNode = { t: 'assign', feat: f.name, op: '+=', item: { t: 'rule', name: objName } };
            // One-line objects follow the subset's keyword on its line; objects with a block of their own go one per
            // line in a block, as an ungrouped containment's do (T4a-2: chained on one line they read `} Book b {`).
            const members: GrammarNode = shapes.get(T.cls)?.line
                ? { t: 'star', feat: f.name, where, item: el }
                : block([{ t: 'star', feat: f.name, where, item: { t: 'seq', items: [el, { t: 'nl' }] } }]);
            out.push({
                t: 'opt', feat: f.name, where, item: {
                    t: 'seq', items: [
                        { t: 'kw', text: s.name },
                        members,
                        { t: 'nl' },
                    ],
                },
            });
        }
        groupsMemo.set(key, out);
        return out;
    };

    /** `override`: in a derived rule of a grouping, the grouping attribute is not optional and takes the subset's literals. */
    const feature = (f: TextFeature, v: BaseValue, line: boolean, override?: { readonly attr: TextFeature; readonly rule: string }): GrammarNode => {
        const a = featAnn(f);
        const key = featureKey(f);
        const kwText = a.keyword ?? f.name;
        const kw: GrammarNode[] = kwText === '' ? [] : [{ t: 'kw', text: kwText }];
        const nl: GrammarNode[] = line ? [] : [{ t: 'nl' }];
        if (v.t === 'block') {
            if (a.value === 'name') refuse(key, 'value "name" applies to a string attribute; not applied');
            if (a.inline && a.keyword !== undefined) remark(key, 'inline: the keyword is not printed');
            const blank: GrammarNode[] = style.blankBeforeContainment ? [{ t: 'nl', blank: true }] : [];
            const el: GrammarNode = { t: 'assign', feat: f.name, op: v.many ? '+=' : '=', item: ruleRef(v.rule) };
            const content: GrammarNode[] = (a.groupBy ? groups(f, v, a.groupBy) : undefined)
                ?? (v.many ? [{ t: 'star', feat: f.name, item: { t: 'seq', items: [el, { t: 'nl' }] } }] : [el, { t: 'nl' }]);
            if (a.inline) return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...content] } };
            return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...blank, ...kw, block(content), { t: 'nl' }] } };
        }
        if (a.inline) refuse(key, 'inline applies to a containment; not applied');
        if (a.groupBy) refuse(key, 'groupBy applies to a containment; not applied');
        if (override && f.name === override.attr.name && f.owner === override.attr.owner) {
            const value: GrammarNode = { t: 'assign', feat: f.name, op: '=', item: { t: 'lit', rule: override.rule } };
            return { t: 'seq', items: [...kw, ...(kw.length ? tokens(style.assign) : []), value, ...tokens(style.terminator), ...nl] };
        }
        const value: GrammarNode = v.t === 'list'
            ? { t: 'list', feat: f.name, open: style.list.open, separator: style.list.separator, close: style.list.close, item: { t: 'assign', feat: f.name, op: '+=', item: single(v.item, f) } }
            : { t: 'assign', feat: f.name, op: '=', item: single(v, f) };
        return { t: 'opt', feat: f.name, item: { t: 'seq', items: [...kw, ...(kw.length ? tokens(style.assign) : []), value, ...tokens(style.terminator), ...nl] } };
    };

    function objectBody(r: Extract<BaseRule, { t: 'object' }>, override?: { readonly attr: TextFeature; readonly rule: string }): GrammarNode {
        const sh = shapes.get(r.cls) ?? { keyword: applyCase(r.cls, classCase), line: false, nameRequired: false };
        const nameAssign: GrammarNode = { t: 'assign', feat: 'name', op: '=', item: { t: 'tok', terminal: 'NAME' } };
        const derive = sh.derive ? { derive: sh.derive } : {};
        const head: GrammarNode[] = sh.keyword === '' ? [] : [{ t: 'kw', text: sh.keyword }];
        if (r.named && sh.nameKeyword === undefined) head.push(sh.nameRequired ? nameAssign : { t: 'opt', feat: 'name', ...derive, item: nameAssign });
        const items = r.features.map(f => feature(f.feature, f.value, sh.line, override));
        if (r.named && sh.nameKeyword !== undefined) {
            const tail: GrammarNode[] = sh.line ? [] : [{ t: 'nl' }];
            items.push({ t: 'opt', feat: 'name', ...derive, item: { t: 'seq', items: [{ t: 'kw', text: sh.nameKeyword }, nameAssign, ...tail] } });
        }
        return { t: 'seq', items: sh.line ? [...head, ...items] : [...head, block(items)] };
    }

    const objects: Record<string, ObjectRule> = {};
    const rules: ConcreteRule[] = [];
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
        if (c) rules.push({ t: 'choice', name, body: { t: 'alt', alts: c.alts.map(a => ruleRef(a)) } });
    }
    for (const e of enumRules) {
        rules.push({ t: 'enum', name: e.name, literals: e.literals, body: { t: 'alt', alts: e.literals.map(l => ({ t: 'kw', text: applyCase(l, literalCase) })) } });
    }
    rules.push(...derivedEnums);
    if (!A) return { style, rules, objects, classCase, literalCase, notices };
    const seen = new Set<string>();
    const annotationIssues = issues.filter(i => {
        const k = `${i.level}|${i.where}|${i.message}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    return { style, rules, objects, classCase, literalCase, notices, annotationIssues };
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

const quoted = (s: string): string => `"${s}"`;

function nodeText(n: GrammarNode, top = false): string {
    switch (n.t) {
        case 'seq': {
            const parts = n.items.filter(x => nodeText(x) !== '');
            if (parts.length === 1) return nodeText(parts[0], top);
            const s = parts.map(x => nodeText(x)).join(' ');
            return top ? s : `(${s})`;
        }
        case 'opt': {
            // An inline containment: the optional star prints as the star.
            const inner = n.item.t === 'seq' ? n.item.items.filter(x => x.t !== 'nl') : [n.item];
            if (inner.length === 1 && inner[0].t === 'star') return nodeText(inner[0]);
            return `[${nodeText(n.item, true)}]${n.derive ? ` (* else name = ${n.derive.source} *)` : ''}`;
        }
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

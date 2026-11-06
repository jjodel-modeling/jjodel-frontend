/**
 * Level 1 of R-TXT-16: the base grammar, derived from a metamodel by R-TXT-1..12 and never edited by hand
 * (docs/discovery/discovery_2026-11-01_textual_viewpoint.md §A.1). It is data over abstract shapes only (a head, an
 * optional name, a body of optional features; lists, blocks, references, terminals, enumerations); a style gives the
 * shapes their tokens (concreteGrammar.ts).
 */

import type { TextFeature, TextMetamodel } from './metamodel';
import { classFeatures, concreteClassesOf, isNameFeature } from './metamodel';

/** The terminals of a value; `NAME` (an object's name) and `REF` (a cross-reference) are added by the concrete level. */
export type ValueTerminal = 'INT' | 'FLOAT' | 'BOOL' | 'STRING';

export type BaseValue =
    | { readonly t: 'terminal'; readonly terminal: ValueTerminal }
    | { readonly t: 'enum'; readonly rule: string }
    /** A cross-reference to an object of `type`; `targets` are the concrete classes it may point to (R-TXT-4, R-TXT-11). */
    | { readonly t: 'ref'; readonly type: string; readonly targets: readonly string[] }
    /** A many-valued attribute or reference. */
    | { readonly t: 'list'; readonly item: BaseValue }
    /** A containment: the contained objects in a block, one rule (an object rule or a choice). */
    | { readonly t: 'block'; readonly rule: string; readonly many: boolean };

export interface BaseFeature {
    readonly feature: TextFeature;
    readonly value: BaseValue;
}

export type BaseRule =
    /** The text: any number of objects of the concrete classes. */
    | { readonly t: 'model'; readonly name: 'Model'; readonly alts: readonly string[] }
    /** An abstract class, or a concrete class with concrete heirs, as the alternatives of its concrete classes. */
    | { readonly t: 'choice'; readonly name: string; readonly cls: string; readonly alts: readonly string[] }
    /** A concrete class: its keyword, the optional name (R-TXT-3), then every other feature, optional (R-TXT-5). */
    | { readonly t: 'object'; readonly name: string; readonly cls: string; readonly named: boolean; readonly features: readonly BaseFeature[] }
    | { readonly t: 'enum'; readonly name: string; readonly literals: readonly string[] };

export interface BaseGrammar {
    readonly rules: readonly BaseRule[];
}

const INT_TYPES = ['EInt', 'EShort', 'ELong', 'EByte', 'EBigInteger'];
const FLOAT_TYPES = ['EFloat', 'EDouble', 'EBigDecimal'];

function terminalOf(type: string): ValueTerminal {
    if (INT_TYPES.includes(type)) return 'INT';
    if (FLOAT_TYPES.includes(type)) return 'FLOAT';
    if (type === 'EBoolean') return 'BOOL';
    return 'STRING';
}

export const objectRuleName = (cls: string): string => `Obj_${cls}`;
export const choiceRuleName = (cls: string): string => `${cls}_`;

/** Derives the base grammar of a metamodel. Rules follow the metamodel's class order, enumerations last. */
export function deriveBaseGrammar(mm: TextMetamodel): BaseGrammar {
    const enums = new Set(mm.enumerations.map(e => e.name));
    const hasChoice = (cls: string): boolean => {
        const c = mm.classes.find(k => k.name === cls);
        return !!c && (!!c.isAbstract || concreteClassesOf(mm, cls).length > 1);
    };
    const ruleFor = (cls: string): string => (hasChoice(cls) ? choiceRuleName(cls) : objectRuleName(cls));
    const valueOf = (f: TextFeature): BaseValue => {
        if (f.kind === 'containment') return { t: 'block', rule: ruleFor(f.type), many: f.many };
        const single: BaseValue = f.kind === 'reference'
            ? { t: 'ref', type: f.type, targets: concreteClassesOf(mm, f.type).map(c => c.name) }
            : enums.has(f.type) ? { t: 'enum', rule: f.type } : { t: 'terminal', terminal: terminalOf(f.type) };
        return f.many ? { t: 'list', item: single } : single;
    };

    const rules: BaseRule[] = [{ t: 'model', name: 'Model', alts: mm.classes.filter(c => !c.isAbstract).map(c => objectRuleName(c.name)) }];
    for (const c of mm.classes) {
        if (hasChoice(c.name)) {
            rules.push({ t: 'choice', name: choiceRuleName(c.name), cls: c.name, alts: concreteClassesOf(mm, c.name).map(k => objectRuleName(k.name)) });
        }
        if (c.isAbstract) continue;
        const fs = classFeatures(mm, c);
        rules.push({
            t: 'object', name: objectRuleName(c.name), cls: c.name, named: fs.some(isNameFeature),
            features: fs.filter(f => !isNameFeature(f)).map(f => ({ feature: f, value: valueOf(f) })),
        });
    }
    for (const e of mm.enumerations) rules.push({ t: 'enum', name: e.name, literals: e.literals });
    return { rules };
}

function valueText(v: BaseValue): string {
    switch (v.t) {
        case 'terminal': return v.terminal;
        case 'enum': return v.rule;
        case 'ref': return 'REF';
        case 'list': return `LIST(${valueText(v.item)})`;
        case 'block': return `BLOCK(${v.rule}${v.many ? '*' : ''})`;
    }
}

/** The base grammar as text, in the abstract shapes of §A.1 (`HEAD`, `NAME?`, `BODY`, `FEAT`, `LIST`, `BLOCK`). */
export function baseGrammarText(g: BaseGrammar): string {
    return g.rules.map(r => {
        switch (r.t) {
            case 'model': return `Model ::= (${r.alts.join(' | ')})*`;
            case 'choice': return `${r.name} ::= ${r.alts.join(' | ')}`;
            case 'enum': return `${r.name} ::= ${r.literals.map(l => `"${l}"`).join(' | ')}`;
            case 'object': {
                const feats = r.features.map(f => `FEAT("${f.feature.name}", ${valueText(f.value)})?`).join(' ');
                return `${r.name} ::= HEAD("${r.cls}")${r.named ? ' NAME?' : ''} BODY(${feats})`;
            }
        }
    }).join('\n');
}

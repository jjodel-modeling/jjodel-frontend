/**
 * syntaxForm — the pure half of the Text tab's Syntax mode (step C lane C2a, P-2026-11-05-0010; report
 * docs/discovery/discovery_2026-11-05_textual_c2_syntax_form.md §2.2, D1, D2, D3, D7, D9).
 *
 * The form edits a draft of the syntax record (annotations.ts `SyntaxAnnotations`) and saves it through the one writer
 * (openTextualTab.tsx `writeTextualSyntax`). This module holds what the form computes and the component does not:
 * the elements and their fields by kind, with the Basic and Advanced split of D2 and only where a field can apply (F1);
 * the value of a field in a record and a change applied to a draft, dropping an emptied entry so that clearing a field
 * leaves no `{}`; the findings of `checkStyle` on the draft's grammar, de-duplicated and mapped to the fields they are
 * about (F4, F5, D9); the annotations of deleted elements, dropped from what Save writes with one notice (D7); the three
 * Save gates of D1; and the preview, the EBNF and the open model's print, from a draft.
 *
 * Pure: no React, no store; the bench imports it.
 */

import { operatorFixity, styleTokenFault } from './annotations';
import type { AnnotationIssue, ClassAnnotation, ElementIds, EnumSubset, FeatureAnnotation, SyntaxAnnotations } from './annotations';
import { concreteGrammarEbnf, concreteGrammarEbnfSpans } from './concreteGrammar';
import type { ConcreteGrammar, LiteralSrc, ObjectRule, StyleParam } from './concreteGrammar';
import { classFeatures, isNameFeature } from './metamodel';
import type { TextClass, TextFeature, TextMetamodel, TextObject } from './metamodel';
import { printTextModel } from './printer';
import { isStyleBase, STYLE_CATALOG, styleOf } from './style';
import { checkStyle } from './styleCheck';
import type { StyleFinding } from './styleCheck';
import { SYNTAX_RECORD_VERSION, syntaxPatch, textualNotation, withStyleBase } from './syntaxRecord';

/** `language`, `class:<id>`, `feature:<id>`, `enum:<id>`: the element ids are the record's keys. */
export type ElementKey = string;

export type FieldId =
    | 'language.name' | 'language.style' | 'language.classCase' | 'language.literalCase' | 'language.blankBeforeContainment' | 'language.roots'
    | 'language.blockOpen' | 'language.blockClose' | 'language.assign' | 'language.terminator' | 'language.list.open' | 'language.list.separator' | 'language.list.close'
    | 'class.keyword' | 'class.positional' | 'class.layout' | 'class.nameKeyword' | 'class.namePattern'
    | 'class.operatorSymbol' | 'class.operatorPrecedence' | 'class.operatorAssoc' | 'class.operatorCall' | 'class.blockOpen' | 'class.blockClose'
    | 'feature.keyword' | 'feature.itemKeyword' | 'feature.positional' | 'feature.inline' | 'feature.groupBy' | 'feature.value' | 'feature.blockOpen' | 'feature.blockClose'
    | 'enum.subsets';

/** A field of an element; without `field`, the element itself (a fault no field of it can fix). */
export interface FieldRef {
    readonly element: ElementKey;
    readonly field?: FieldId;
}

export const fieldKey = (r: FieldRef): string => `${r.element}#${r.field ?? ''}`;

export type InterfaceMode = 'basic' | 'advanced';

export interface FormField {
    readonly id: FieldId;
    readonly label: string;
    readonly tier: InterfaceMode;
    /** `text`, `choice` (one of `options`), `toggle`, `number`, `roots` (`uncontained` or class ids), `subsets`, `tokens` (a list of style tokens as one line). */
    readonly input: 'text' | 'choice' | 'toggle' | 'number' | 'roots' | 'subsets' | 'tokens';
    readonly options?: readonly string[];
    /** The default the text prints when the field is absent: shown as the placeholder, never stored (F1). */
    readonly placeholder?: string;
    /** A token override: the row has a Reset that clears it, back to the base or the inherited tokens (L2b, P-2026-11-05-2350). */
    readonly reset?: true;
}

export interface FormElement {
    readonly key: ElementKey;
    readonly kind: 'language' | 'class' | 'feature' | 'enum';
    readonly name: string;
    readonly abstract?: boolean;
    /** A class's own features, as element keys, in declaration order (attributes, then references). */
    readonly features?: readonly ElementKey[];
}

/** A fault of the draft: one per fault, at every field it is about (D9); `at` empty for a fault of the record. */
export interface FormFault {
    readonly level: 'error' | 'notice';
    readonly rule: string;
    readonly message: string;
    readonly at: readonly FieldRef[];
}

type Spec = Omit<FormField, 'options' | 'placeholder'>;

const LANGUAGE: readonly Spec[] = [
    { id: 'language.name', label: 'Language name', tier: 'basic', input: 'text' },
    { id: 'language.style', label: 'Style', tier: 'basic', input: 'choice' },
    { id: 'language.classCase', label: 'Class case', tier: 'advanced', input: 'choice' },
    { id: 'language.literalCase', label: 'Literal case', tier: 'advanced', input: 'choice' },
    { id: 'language.blankBeforeContainment', label: 'Blank line before a containment', tier: 'advanced', input: 'toggle' },
    { id: 'language.roots', label: 'Top level', tier: 'advanced', input: 'roots' },
];
const CLASS: readonly Spec[] = [
    { id: 'class.keyword', label: 'Keyword', tier: 'basic', input: 'text' },
    { id: 'class.positional', label: 'Positional (no keyword)', tier: 'advanced', input: 'toggle' },
    { id: 'class.layout', label: 'Layout', tier: 'basic', input: 'choice' },
    { id: 'class.nameKeyword', label: 'Name keyword', tier: 'advanced', input: 'text' },
    { id: 'class.namePattern', label: 'Name pattern', tier: 'advanced', input: 'text' },
    { id: 'class.operatorSymbol', label: 'Operator symbol', tier: 'advanced', input: 'text' },
    { id: 'class.operatorPrecedence', label: 'Precedence', tier: 'advanced', input: 'number' },
    { id: 'class.operatorAssoc', label: 'Associativity', tier: 'advanced', input: 'choice' },
    { id: 'class.operatorCall', label: 'Call word', tier: 'advanced', input: 'text' },
];
const FEATURE: readonly Spec[] = [
    { id: 'feature.keyword', label: 'Keyword', tier: 'basic', input: 'text' },
    { id: 'feature.itemKeyword', label: 'Per-item keyword', tier: 'basic', input: 'text' },
    { id: 'feature.positional', label: 'Positional (no keyword)', tier: 'advanced', input: 'toggle' },
    { id: 'feature.inline', label: 'Inline', tier: 'advanced', input: 'toggle' },
    { id: 'feature.groupBy', label: 'Grouped by', tier: 'advanced', input: 'choice' },
    { id: 'feature.value', label: 'Printed as a name', tier: 'advanced', input: 'toggle' },
];
/** The per-block tokens of R-TXT-51 (B2, P-2026-11-05-2350), rows of their own as the style's are (`blockTokenFields`). */
const CLASS_BLOCK: readonly Spec[] = [
    { id: 'class.blockOpen', label: 'Block open', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'class.blockClose', label: 'Block close', tier: 'advanced', input: 'tokens', reset: true },
];
const FEATURE_BLOCK: readonly Spec[] = [
    { id: 'feature.blockOpen', label: 'Block open', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'feature.blockClose', label: 'Block close', tier: 'advanced', input: 'tokens', reset: true },
];
const ENUM: readonly Spec[] = [{ id: 'enum.subsets', label: 'Groups of literals', tier: 'advanced', input: 'subsets' }];
/**
 * The style token overrides (L2a, P-2026-11-05-1430): named in sentences, edited from the EBNF and, in Advanced, in the
 * rows `styleTokenFields` gives (B0, P-2026-11-05-2220); an array parameter takes the `tokens` input, a list token a text.
 */
const STYLE_TOKENS: readonly Spec[] = [
    { id: 'language.blockOpen', label: 'Block open', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'language.blockClose', label: 'Block close', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'language.assign', label: 'Assignment', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'language.terminator', label: 'Terminator', tier: 'advanced', input: 'tokens', reset: true },
    { id: 'language.list.open', label: 'List open', tier: 'advanced', input: 'text', reset: true },
    { id: 'language.list.separator', label: 'List separator', tier: 'advanced', input: 'text', reset: true },
    { id: 'language.list.close', label: 'List close', tier: 'advanced', input: 'text', reset: true },
];

const LABELS: ReadonlyMap<FieldId, string> = new Map([...LANGUAGE, ...STYLE_TOKENS, ...CLASS, ...CLASS_BLOCK, ...FEATURE, ...FEATURE_BLOCK, ...ENUM].map(s => [s.id, s.label]));

/** A style parameter's field, and back. */
const tokenField = (param: StyleParam): FieldId => `language.${param}` as FieldId;
const tokenParam = (field: FieldId | undefined): StyleParam | undefined => (STYLE_TOKENS.some(s => s.id === field) ? field!.slice(9) as StyleParam : undefined);

/**
 * The language's style token rows in a mode (B0, F5): none in Basic; in Advanced one per parameter, the draft base's
 * tokens as the placeholder, joined by a space, none where the base prints none.
 */
export function styleTokenFields(draft: SyntaxAnnotations | null, mode: InterfaceMode): FormField[] {
    if (mode !== 'advanced') return [];
    const base = styleOf(draft?.style?.base);
    return STYLE_TOKENS.map(s => {
        const param = tokenParam(s.id)!;
        const shown = param.startsWith('list.') ? base.list[param.slice(5) as 'open'] : base[param as 'assign'].join(' ');
        return { ...s, ...(shown ? { placeholder: shown } : {}) };
    });
}

/** A `tokens` field's value as its line: the tokens joined by one space; empty without an override. */
export const tokensText = (value: unknown): string => (Array.isArray(value) ? value.join(' ') : '');

/** A `tokens` field's line as its value: the tokens split on blanks; undefined, which clears the override, when it has none. */
export function parseTokens(text: string): string[] | undefined {
    const tokens = text.split(/\s+/).filter(Boolean);
    return tokens.length ? tokens : undefined;
}

/** R-TXT-51: the sides of a per-block token entry, and what a side inherits in a draft: the language-wide override, else the base's (Q1). */
const BLOCK_SIDES = ['blockOpen', 'blockClose'] as const;
type BlockSide = typeof BLOCK_SIDES[number];
const inheritedSide = (draft: SyntaxAnnotations | null | undefined, side: BlockSide): readonly string[] => {
    const own = draft?.style?.[side];
    return Array.isArray(own) ? own : styleOf(draft?.style?.base)[side];
};
const setsBlock = (entry: { readonly blockOpen?: unknown; readonly blockClose?: unknown }): boolean => BLOCK_SIDES.some(side => entry[side] !== undefined);

const kindOf = (key: ElementKey): FormElement['kind'] => (key === 'language' ? 'language' : (key.slice(0, key.indexOf(':')) as FormElement['kind']));
const idOf = (key: ElementKey): string => key.slice(key.indexOf(':') + 1);

interface Context {
    readonly classById: (id: string) => TextClass | undefined;
    /** The feature an id names, as its declaring class sees it. */
    readonly featureById: (id: string) => TextFeature | undefined;
    /** `Owner.f` to the feature id. */
    readonly featureId: (owner: string, name: string) => string | undefined;
    readonly classId: (name: string) => string | undefined;
    readonly enumId: (name: string) => string | undefined;
}

function contextOf(mm: TextMetamodel, ids: ElementIds): Context {
    const classNamed = (name: string): TextClass | undefined => mm.classes.find(c => c.name === name);
    const byOwner = new Map(Object.entries(ids.features).map(([id, f]) => [`${f.owner}.${f.name}`, id]));
    const byClass = new Map(Object.entries(ids.classes).map(([id, name]) => [name, id]));
    const byEnum = new Map(Object.entries(ids.enums).map(([id, name]) => [name, id]));
    return {
        classById: id => (ids.classes[id] === undefined ? undefined : classNamed(ids.classes[id])),
        featureById: id => {
            const f = ids.features[id];
            const c = f && classNamed(f.owner);
            return c ? classFeatures(mm, c).find(x => x.owner === f.owner && x.name === f.name) : undefined;
        },
        featureId: (owner, name) => byOwner.get(`${owner}.${name}`),
        classId: name => byClass.get(name),
        enumId: name => byEnum.get(name),
    };
}

/** The language, every class with its own features, every enumeration: the form's element list. */
export function formElements(mm: TextMetamodel, ids: ElementIds): FormElement[] {
    const cx = contextOf(mm, ids);
    const out: FormElement[] = [{ key: 'language', kind: 'language', name: 'Language' }];
    for (const c of mm.classes) {
        const id = cx.classId(c.name);
        if (id === undefined) continue;
        const own = [...(c.attributes ?? []), ...(c.references ?? [])].flatMap(f => {
            const fid = cx.featureId(c.name, f.name);
            return fid === undefined ? [] : [`feature:${fid}`];
        });
        out.push({ key: `class:${id}`, kind: 'class', name: c.name, ...(c.isAbstract ? { abstract: true } : {}), features: own });
    }
    for (const [id, name] of Object.entries(ids.enums)) out.push({ key: `enum:${id}`, kind: 'enum', name });
    return out;
}

/** The fields of an element in a mode, each where it can apply (F1's last column); the derivation refuses the rest. */
export function fieldsOf(mm: TextMetamodel, ids: ElementIds, element: ElementKey, mode: InterfaceMode, metamodelName?: string): FormField[] {
    const cx = contextOf(mm, ids);
    const shown = (s: Spec): boolean => mode === 'advanced' || s.tier === 'basic';
    const out: FormField[] = [];
    const add = (s: Spec, extra: Partial<FormField> = {}): void => { if (shown(s)) out.push({ ...s, ...extra }); };
    const spec = (specs: readonly Spec[], id: FieldId): Spec => specs.find(s => s.id === id)!;
    const kind = kindOf(element);

    if (kind === 'language') {
        add(spec(LANGUAGE, 'language.name'), metamodelName ? { placeholder: metamodelName } : {});
        add(spec(LANGUAGE, 'language.style'), { options: Object.keys(STYLE_CATALOG), placeholder: 'clike' });
        add(spec(LANGUAGE, 'language.classCase'), { options: ['declared', 'lower'], placeholder: 'declared' });
        add(spec(LANGUAGE, 'language.literalCase'), { options: ['declared', 'lower'], placeholder: 'declared' });
        add(spec(LANGUAGE, 'language.blankBeforeContainment'));
        add(spec(LANGUAGE, 'language.roots'), { options: ['uncontained', ...Object.keys(ids.classes).filter(id => !cx.classById(id)?.isAbstract)] });
        return out;
    }
    if (kind === 'enum') {
        if (ids.enums[idOf(element)] !== undefined) add(ENUM[0]);
        return out;
    }
    if (kind === 'class') {
        const c = cx.classById(idOf(element));
        if (!c || c.isAbstract) return out;
        const fs = classFeatures(mm, c);
        const containments = fs.filter(f => f.kind === 'containment');
        const layouts = ['block', ...(containments.every(f => !f.many) ? ['line'] : []), ...(mode === 'advanced' && !containments.length && fs.every(f => !f.many) ? ['call'] : [])];
        add(spec(CLASS, 'class.keyword'), { placeholder: c.name });
        add(spec(CLASS, 'class.positional'));
        if (layouts.length > 1) add(spec(CLASS, 'class.layout'), { options: layouts, placeholder: 'block' });
        if (fs.some(isNameFeature)) {
            add(spec(CLASS, 'class.nameKeyword'));
            add(spec(CLASS, 'class.namePattern'));
        }
        const fx = operatorFixity(fs);
        if (fx) {
            add(spec(CLASS, 'class.operatorSymbol'));
            add(spec(CLASS, 'class.operatorPrecedence'));
            if (fx.fixity !== 'prefix') add(spec(CLASS, 'class.operatorAssoc'), { options: ['left', 'right'], placeholder: 'left' });
            if (fx.fixity === 'nary') add(spec(CLASS, 'class.operatorCall'), { placeholder: c.name });
        }
        return out;
    }
    const f = cx.featureById(idOf(element));
    if (!f || isNameFeature(f)) return out;
    const manyContainment = f.kind === 'containment' && f.many;
    add(spec(FEATURE, 'feature.keyword'), { placeholder: f.name });
    if (manyContainment) add(spec(FEATURE, 'feature.itemKeyword'));
    add(spec(FEATURE, 'feature.positional'));
    if (f.kind === 'containment') add(spec(FEATURE, 'feature.inline'));
    if (manyContainment) {
        const target = mm.classes.find(c => c.name === f.type);
        const enumNames = new Set(mm.enumerations.map(e => e.name));
        const groups = target ? classFeatures(mm, target).filter(a => a.kind === 'attribute' && !a.many && enumNames.has(a.type)).flatMap(a => cx.featureId(a.owner, a.name) ?? []) : [];
        if (groups.length) add(spec(FEATURE, 'feature.groupBy'), { options: groups });
    }
    if (f.kind === 'attribute' && !f.many && f.type === 'EString') add(spec(FEATURE, 'feature.value'));
    return out;
}

/**
 * The per-block token rows of a class or a feature (B2, R-TXT-51), Advanced only: on a concrete class and a containment,
 * each side with the tokens it inherits as the placeholder (Q1); elsewhere only while the draft sets them, so that their
 * refusal (D9, an abstract class) has a field and a Reset.
 */
export function blockTokenFields(mm: TextMetamodel, ids: ElementIds, element: ElementKey, mode: InterfaceMode, draft: SyntaxAnnotations | null): FormField[] {
    const kind = kindOf(element);
    if (mode !== 'advanced' || (kind !== 'class' && kind !== 'feature')) return [];
    const cx = contextOf(mm, ids);
    const id = idOf(element);
    const rows = (specs: readonly Spec[]): FormField[] => specs.map((s, k) => {
        const shown = inheritedSide(draft, BLOCK_SIDES[k]).join(' ');
        return { ...s, ...(shown ? { placeholder: shown } : {}) };
    });
    if (kind === 'class') {
        const c = cx.classById(id);
        return c && (!c.isAbstract || setsBlock(classEntry(draft, id))) ? rows(CLASS_BLOCK) : [];
    }
    const f = cx.featureById(id);
    return f && (f.kind === 'containment' || setsBlock(featureEntry(draft, id))) ? rows(FEATURE_BLOCK) : [];
}

const classEntry = (r: SyntaxAnnotations | null, id: string): ClassAnnotation => r?.classes?.[id] ?? {};
const featureEntry = (r: SyntaxAnnotations | null, id: string): FeatureAnnotation => r?.features?.[id] ?? {};

/** The form value of a field in a record: `undefined` when absent; a keyword `""` reads as positional, not as a keyword. */
export function fieldValue(record: SyntaxAnnotations | null, ref: FieldRef): unknown {
    const id = idOf(ref.element);
    const c = classEntry(record, id);
    const f = featureEntry(record, id);
    switch (ref.field) {
        case 'language.name': return record?.language;
        case 'language.style': return record?.style?.base;
        case 'language.classCase': return record?.style?.classCase;
        case 'language.literalCase': return record?.style?.literalCase;
        case 'language.blankBeforeContainment': return record?.style?.blankBeforeContainment;
        case 'language.roots': return record?.roots;
        case 'class.keyword': return c.keyword === '' ? undefined : c.keyword;
        case 'class.positional': return c.keyword === '' ? true : undefined;
        case 'class.layout': return c.layout;
        case 'class.nameKeyword': return c.name?.keyword;
        case 'class.namePattern': return c.name?.default;
        case 'class.operatorSymbol': return c.operator?.symbol;
        case 'class.operatorPrecedence': return c.operator?.precedence;
        case 'class.operatorAssoc': return c.operator?.assoc;
        case 'class.operatorCall': return c.operator?.call;
        case 'class.blockOpen': return c.blockOpen;
        case 'class.blockClose': return c.blockClose;
        case 'feature.keyword': return f.keyword === '' ? undefined : f.keyword;
        case 'feature.itemKeyword': return f.itemKeyword;
        case 'feature.positional': return f.keyword === '' ? true : undefined;
        case 'feature.inline': return f.inline;
        case 'feature.groupBy': return f.groupBy;
        case 'feature.value': return f.value === 'name' ? true : undefined;
        case 'feature.blockOpen': return f.blockOpen;
        case 'feature.blockClose': return f.blockClose;
        case 'enum.subsets': return record?.enums?.[id]?.subsets;
        default: {
            const param = tokenParam(ref.field);
            if (!param) return undefined;
            return param.startsWith('list.') ? record?.style?.list?.[param.slice(5) as 'open'] : record?.style?.[param as 'assign'];
        }
    }
}

/** A value that clears its field: absent, an empty text, a toggle off, an empty list, not a number. */
const isCleared = (v: unknown): boolean => v === undefined || v === null || v === '' || v === false || (Array.isArray(v) && !v.length) || (typeof v === 'number' && !Number.isFinite(v));

/** The object with `key` set to `value`, or without it when cleared. */
function put<T extends object>(o: T | undefined, key: string, value: unknown): T {
    const { [key]: _old, ...rest } = (o ?? {}) as Record<string, unknown>;
    return (isCleared(value) || (typeof value === 'object' && value !== null && !Array.isArray(value) && !Object.keys(value).length) ? rest : { ...rest, [key]: value }) as T;
}

/**
 * The draft with a style token set: a whole array per parameter, a list token in its key (D9), stored only when it differs
 * from the base's, removed otherwise; an emptied list, and an emptied style, go.
 */
function withToken(draft: SyntaxAnnotations, param: StyleParam, value: unknown): SyntaxAnnotations {
    const base = styleOf(draft.style?.base);
    if (param.startsWith('list.')) {
        const key = param.slice(5) as keyof typeof base.list;
        const v = value === base.list[key] ? undefined : value;
        return put(draft, 'style', put(draft.style, 'list', put(draft.style?.list, key, v)));
    }
    const was = base[param as 'assign'];
    const same = Array.isArray(value) && value.length === was.length && value.every((t, i) => t === was[i]);
    return put(draft, 'style', put(draft.style, param, same ? undefined : value));
}

/** The record with one section's entry replaced; an emptied entry, and an emptied section, go. */
function withEntry(r: SyntaxAnnotations, section: 'classes' | 'features' | 'enums', id: string, entry: object): SyntaxAnnotations {
    return put(r, section, put(r[section] as object | undefined, id, entry));
}

/**
 * The draft with a field set to a form value, or cleared with `undefined` (an empty text, a toggle off, an empty list
 * clear too). An emptied entry, section or style goes, so clearing every field gives `{ v: 1 }`, the empty record.
 */
export function setField(draft: SyntaxAnnotations, ref: FieldRef, value: unknown): SyntaxAnnotations {
    const id = idOf(ref.element);
    const style = (key: string): SyntaxAnnotations => put(draft, 'style', put(draft.style, key, value));
    const cls = (next: (c: ClassAnnotation) => object): SyntaxAnnotations => withEntry(draft, 'classes', id, next(classEntry(draft, id)));
    const feat = (next: (f: FeatureAnnotation) => object): SyntaxAnnotations => withEntry(draft, 'features', id, next(featureEntry(draft, id)));
    const name = (key: string) => (c: ClassAnnotation) => put(c, 'name', put(c.name, key, value));
    const operator = (key: string) => (c: ClassAnnotation) => put(c, 'operator', put(c.operator, key, value));
    /** A per-block side, stored only when it differs from what the side inherits (R-TXT-49 D5's rule, as `withToken`). */
    const side = (key: BlockSide) => <T extends object>(x: T): T => {
        const was = inheritedSide(draft, key);
        const same = Array.isArray(value) && value.length === was.length && value.every((t, i) => t === was[i]);
        return put(x, key, same ? undefined : value);
    };
    const positional = <T extends { keyword?: string }>(x: T): T => (value === true ? { ...x, keyword: '' } : x.keyword === '' ? put(x, 'keyword', undefined) : x);
    switch (ref.field) {
        case 'language.name': return put(draft, 'language', value);
        case 'language.style': return withStyleBase(draft, isStyleBase(value) ? value : 'clike');
        case 'language.classCase': return style('classCase');
        case 'language.literalCase': return style('literalCase');
        case 'language.blankBeforeContainment': return style('blankBeforeContainment');
        case 'language.roots': return put(draft, 'roots', value);
        case 'class.keyword': return cls(c => put(c, 'keyword', value));
        case 'class.positional': return cls(positional);
        case 'class.layout': return cls(c => put(c, 'layout', value));
        case 'class.nameKeyword': return cls(name('keyword'));
        case 'class.namePattern': return cls(name('default'));
        case 'class.operatorSymbol': return cls(operator('symbol'));
        case 'class.operatorPrecedence': return cls(operator('precedence'));
        case 'class.operatorAssoc': return cls(operator('assoc'));
        case 'class.operatorCall': return cls(operator('call'));
        case 'class.blockOpen': return cls(side('blockOpen'));
        case 'class.blockClose': return cls(side('blockClose'));
        case 'feature.keyword': return feat(f => put(f, 'keyword', value));
        case 'feature.itemKeyword': return feat(f => put(f, 'itemKeyword', value));
        case 'feature.positional': return feat(positional);
        case 'feature.inline': return feat(f => put(f, 'inline', value));
        case 'feature.groupBy': return feat(f => put(f, 'groupBy', value));
        case 'feature.value': return feat(f => put(f, 'value', value === true ? 'name' : undefined));
        case 'feature.blockOpen': return feat(side('blockOpen'));
        case 'feature.blockClose': return feat(side('blockClose'));
        case 'enum.subsets': return withEntry(draft, 'enums', id, put(draft.enums?.[id], 'subsets', value));
        default: {
            const param = tokenParam(ref.field);
            return param ? withToken(draft, param, value) : draft;
        }
    }
}

/** How many Advanced fields of an element the record sets, applicable or not: Basic announces them, nothing in effect hides (D2). */
export function advancedInEffect(record: SyntaxAnnotations | null, element: ElementKey): number {
    const kind = kindOf(element);
    const specs = kind === 'language' ? [...LANGUAGE, ...STYLE_TOKENS] : kind === 'class' ? [...CLASS, ...CLASS_BLOCK] : kind === 'feature' ? [...FEATURE, ...FEATURE_BLOCK] : ENUM;
    const set = (s: Spec): boolean => !isCleared(fieldValue(record, { element, field: s.id }));
    const advanced = specs.filter(s => s.tier === 'advanced' && set(s)).length;
    return advanced + (kind === 'class' && fieldValue(record, { element, field: 'class.layout' }) === 'call' ? 1 : 0);
}

/** The entries of a record whose element is gone, as `section:id`, roots first (D7). */
export function staleEntries(record: SyntaxAnnotations, ids: ElementIds): string[] {
    const roots = Array.isArray(record.roots) ? record.roots.filter(id => ids.classes[id] === undefined).map(id => `roots:${id}`) : [];
    const gone = (section: 'classes' | 'features' | 'enums') => Object.keys(record[section] ?? {}).filter(id => ids[section][id] === undefined).map(id => `${section}:${id}`);
    return [...roots, ...gone('classes'), ...gone('features'), ...gone('enums')];
}

/** The record without the entries of deleted elements, every other entry kept: what Save writes (D7). */
export function withoutStale(record: SyntaxAnnotations, ids: ElementIds): SyntaxAnnotations {
    let r: SyntaxAnnotations = record;
    if (Array.isArray(record.roots)) r = put(r, 'roots', record.roots.filter(id => ids.classes[id] !== undefined));
    for (const section of ['classes', 'features', 'enums'] as const) {
        const entries = record[section];
        if (!entries) continue;
        r = put(r, section, Object.fromEntries(Object.entries(entries).filter(([id]) => ids[section][id] !== undefined)));
    }
    return r;
}

// ---- The findings at their fields (F4, F5, D9) --------------------------------------------------------------------

const quoted = (message: string): string[] => [...message.matchAll(/"([^"]*)"/g)].map(m => m[1]);
const listAfterColon = (message: string): string[] => message.slice(message.lastIndexOf(': ') + 2).split(', ').map(s => s.trim()).filter(Boolean);
const joinNames = (xs: readonly string[]): string => (xs.length < 2 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

const objectRuleNamed = (g: ConcreteGrammar, name: string): ObjectRule | undefined => g.rules.find((r): r is ObjectRule => r.t === 'object' && r.name === name);

/** The class keyword of an object rule as printed (styleCheck.ts `headKeyword`). */
function headKeyword(r: ObjectRule): string {
    const first = r.body.t === 'seq' ? r.body.items[0] : r.body;
    return first?.t === 'kw' ? first.text : '';
}

function classField(message: string): FieldId | undefined {
    if (/layout/.test(message)) return 'class.layout';
    if (/name pattern/.test(message)) return 'class.namePattern';
    if (/name keyword|name annotation/.test(message)) return 'class.nameKeyword';
    if (/call word/.test(message)) return 'class.operatorCall';
    if (/precedence/.test(message)) return 'class.operatorPrecedence';
    if (/associativity/.test(message)) return 'class.operatorAssoc';
    if (/operator|symbol/.test(message)) return 'class.operatorSymbol';
    if (/keyword ""/.test(message)) return 'class.positional';
    if (/keyword/.test(message)) return 'class.keyword';
    return undefined;
}

function featureField(message: string): FieldId | undefined {
    if (/itemKeyword|item keyword/.test(message)) return 'feature.itemKeyword';
    if (/groupBy/.test(message)) return 'feature.groupBy';
    if (/inline/.test(message)) return 'feature.inline';
    if (/value "name"|value form/.test(message)) return 'feature.value';
    if (/keyword/.test(message)) return 'feature.keyword';
    return undefined;
}

function styleField(message: string): FieldId {
    if (/classCase/.test(message)) return 'language.classCase';
    if (/literalCase/.test(message)) return 'language.literalCase';
    if (/blankBeforeContainment/.test(message)) return 'language.blankBeforeContainment';
    return 'language.style';
}

/** The messages about an element's own block tokens (concreteGrammar.ts, annotations.ts, styleCheck.ts, B1). */
const OWN_BLOCK_MESSAGE = /(^|: )blockOpen and blockClose |^(blockOpen|blockClose) is |^the (blockOpen|blockClose) token |^the block open .* is the block close too/;

interface Located { readonly at: FieldRef[]; readonly message: string }

/** Where a finding belongs, and its message as the form shows it (F5's table). */
function locate(f: StyleFinding, g: ConcreteGrammar, mm: TextMetamodel, cx: Context, draft: SyntaxAnnotations): Located {
    const { rule, where, message } = f;
    const one = (element: ElementKey | undefined, field: FieldId | undefined): FieldRef[] => (element === undefined ? [] : [{ element, ...(field ? { field } : {}) }]);
    const classKey = (name: string): ElementKey | undefined => { const id = cx.classId(name); return id === undefined ? undefined : `class:${id}`; };
    /** `R.f`, R a rule or a class, to the feature's element: the declaring class's id. */
    const featureKey = (path: string): ElementKey | undefined => {
        const dot = path.lastIndexOf('.');
        const owner = path.slice(0, dot);
        const name = path.slice(dot + 1);
        const cls = objectRuleNamed(g, owner)?.cls ?? owner;
        const c = mm.classes.find(x => x.name === cls);
        const declared = c ? classFeatures(mm, c).find(x => x.name === name)?.owner ?? owner : owner;
        const id = cx.featureId(declared, name);
        return id === undefined ? undefined : `feature:${id}`;
    };
    const keywordOf = (element: ElementKey): FieldId => {
        const kind = kindOf(element);
        const entry = kind === 'class' ? classEntry(draft, idOf(element)) : featureEntry(draft, idOf(element));
        if (entry.keyword === '') return kind === 'class' ? 'class.positional' : 'feature.positional';
        if (kind === 'feature' && (entry as FeatureAnnotation).itemKeyword !== undefined && entry.keyword === undefined) return 'feature.itemKeyword';
        return kind === 'class' ? 'class.keyword' : 'feature.keyword';
    };
    const keywords = (keys: (ElementKey | undefined)[]): FieldRef[] => keys.flatMap(k => (k === undefined ? [] : [{ element: k, field: keywordOf(k) }]));
    /** A class's name keyword when it is a token the message names: the side a list of real features leaves out. */
    const nameKeywordAt = (cls: string | undefined): FieldRef[] => {
        const k = cls === undefined ? undefined : classKey(cls);
        const kw = k === undefined ? undefined : classEntry(draft, idOf(k)).name?.keyword;
        return k !== undefined && kw !== undefined && quoted(message).includes(kw) ? [{ element: k, field: 'class.nameKeyword' }] : [];
    };
    /**
     * R-TXT-51: a finding about an element's own block, at its sides: the one the message names, else the ones the entry
     * sets; undefined when the message is not about them.
     */
    const blockAt = (element: ElementKey | undefined): FieldRef[] | undefined => {
        if (element === undefined || !OWN_BLOCK_MESSAGE.test(message)) return undefined;
        const open = /\bblockOpen\b/.test(message);
        const close = /\bblockClose\b/.test(message);
        const prefix = kindOf(element) === 'class' ? 'class' : 'feature';
        const entry = prefix === 'class' ? classEntry(draft, idOf(element)) : featureEntry(draft, idOf(element));
        const set = BLOCK_SIDES.filter(s => entry[s] !== undefined);
        const sides = open !== close ? [open ? 'blockOpen' : 'blockClose'] : set.length ? set : BLOCK_SIDES;
        return sides.map(s => ({ element, field: `${prefix}.${s}` as FieldId }));
    };
    /** «is a block token of X»: the sides of X's own block that hold the token the message quotes. */
    const tokenOwnerAt = (): FieldRef[] => {
        const owner = /is a block token of ([\w.]+)/.exec(message)?.[1];
        const token = quoted(message)[0];
        const element = owner === undefined ? undefined : owner.includes('.') ? featureKey(owner) : classKey(owner);
        if (element === undefined || token === undefined) return [];
        const prefix = kindOf(element) === 'class' ? 'class' : 'feature';
        const entry = prefix === 'class' ? classEntry(draft, idOf(element)) : featureEntry(draft, idOf(element));
        return BLOCK_SIDES.filter(s => entry[s]?.includes(token)).map(s => ({ element, field: `${prefix}.${s}` as FieldId }));
    };
    const isFeaturePath = (w: string): boolean => !w.includes(' ') && w.includes('.') && !w.startsWith('style.');
    /** A `style.<param>` finding: the parameter's fields first, then the Style row, until L2b gives the parameter a row. */
    const styleAt = (w: string): FieldRef[] => {
        const param = w.slice(6);
        const params: string[] = param === 'list' ? ['list.open', 'list.separator', 'list.close']
            : rule === 'style-tokens' && param === 'blockOpen' && /is the block close too/.test(message) ? ['blockOpen', 'blockClose'] : [param];
        const fields = params.map(p => tokenField(p as StyleParam)).filter(x => tokenParam(x) !== undefined);
        return [...fields, 'language.style' as const].map(field => ({ element: 'language', field }));
    };

    // A finding at a class or a feature about its own block tokens (B1's refusals, the per-block style check).
    if (where.startsWith('class ') || isFeaturePath(where)) {
        const own = blockAt(where.startsWith('class ') ? classKey(where.slice(6)) : featureKey(where));
        if (own) return { at: own, message };
    }
    switch (rule) {
        case 'distinct-features':
            return { at: [...nameKeywordAt(where.startsWith('class ') ? where.slice(6) : undefined), ...keywords(listAfterColon(message).map(featureKey))], message };
        case 'distinct-classes': return { at: keywords(listAfterColon(message).map(classKey)), message };
        case 'case-injective': return { at: [{ element: 'language', field: where.startsWith('enumeration ') ? 'language.literalCase' : 'language.classCase' }], message };
        case 'reserved-words': case 'list-tokens': case 'terminator': case 'outer-reference': case 'style-tokens':
            return { at: where.startsWith('style.') ? styleAt(where) : [{ element: 'language', field: 'language.style' }], message };
        case 'block-delimiters':
            if (where.startsWith('style.')) return { at: styleAt(where), message };
            if (where.startsWith('class ')) return { at: [...keywords([classKey(where.slice(6))]), ...tokenOwnerAt()], message };
            return { at: [...keywords([featureKey(where)]), ...tokenOwnerAt()], message };
        case 'operator-fixity': case 'operator-symbols': case 'operator-tokens': case 'operator-follow': {
            const others = [...message.matchAll(/(?:symbol of|for) ([A-Za-z_]\w*)/g)].map(m => classKey(m[1]));
            return { at: [classKey(where.slice(6)), ...others].flatMap(k => one(k, 'class.operatorSymbol')), message };
        }
        case 'call-words': {
            const twice = /call word of ([A-Za-z_]\w*) too/.exec(message)?.[1];
            return { at: [classKey(where.slice(6)), ...(twice ? [classKey(twice)] : [])].flatMap(k => one(k, 'class.operatorCall')), message };
        }
        default: break;
    }
    // `annotations`: the resolution, the derivation and the LL(1) conditions.
    const ll1 = message.startsWith('not LL(1): ');
    if (where === 'language') return { at: [{ element: 'language', field: 'language.name' }], message };
    if (where === 'style' || where.startsWith('style ')) return { at: [{ element: 'language', field: styleField(message) }], message };
    if (where.startsWith('style.')) return { at: styleAt(where), message };
    if (where === 'roots') return { at: [{ element: 'language', field: 'language.roots' }], message };
    if (where.startsWith('enumeration ')) {
        const id = cx.enumId(where.slice(12));
        return { at: one(id === undefined ? undefined : `enum:${id}`, 'enum.subsets'), message };
    }
    if (where.startsWith('class ')) {
        const k = classKey(where.slice(6));
        return { at: one(k, classField(message)), message };
    }
    if (where.startsWith('rule ')) {
        // A position: the classes whose printed keyword is a token the conflict names.
        const tokens = new Set(quoted(message));
        const classes = Object.values(g.objects).filter(r => tokens.has(headKeyword(r))).map(r => classKey(r.cls));
        return { at: keywords(classes), message };
    }
    if (isFeaturePath(where)) {
        const k = featureKey(where);
        if (!ll1) return { at: [...one(k, featureField(message)), ...tokenOwnerAt()], message };
        if (k === undefined) return { at: [], message };
        // LL(1) at a feature: two positional features cannot be told apart; else the keyword and its inline forms.
        const owner = where.slice(0, where.lastIndexOf('.'));
        const cls = g.objects[objectRuleNamed(g, owner)?.cls ?? owner];
        const positional = (cls?.features ?? []).map(x => featureKey(`${owner}.${x.name}`)).filter((x): x is ElementKey => x !== undefined && featureEntry(draft, idOf(x)).keyword === '');
        if (positional.length > 1 && positional.includes(k)) {
            const names = positional.map(x => cx.featureById(idOf(x))?.name ?? idOf(x));
            return { at: positional.map(x => ({ element: x, field: 'feature.positional' as const })), message: `the features ${joinNames(names)} have no keyword, so the parser cannot tell which one a value is for` };
        }
        const e = featureEntry(draft, idOf(k));
        return { at: [...nameKeywordAt(objectRuleNamed(g, owner)?.cls ?? owner), { element: k, field: keywordOf(k) }, ...(e.inline ? [{ element: k, field: 'feature.inline' as const }] : []), ...(e.itemKeyword !== undefined && e.keyword !== undefined ? [{ element: k, field: 'feature.itemKeyword' as const }] : [])], message };
    }
    return { at: [], message };
}

/** The identity of a fault: the fields it is about and the tokens it names, its message when it names none (R5). */
const faultKey = (f: FormFault): string => {
    const tokens = quoted(f.message).sort();
    return `${f.level}|${f.at.map(fieldKey).sort().join(',')}|${tokens.length ? tokens.join(',') : f.message}`;
};

export interface DraftReading {
    readonly grammar: ConcreteGrammar;
    /** The draft's faults, de-duplicated, errors first; the deleted elements' notice last. */
    readonly faults: readonly FormFault[];
    /** The entries of deleted elements (D7). */
    readonly stale: number;
}

/**
 * The draft as the form reads it: its grammar, derived without the entries of deleted elements; `checkStyle`'s findings
 * on it and the stored record's decoding issues, one fault each, at their fields; one notice for the deleted elements.
 */
export function readDraft(mm: TextMetamodel, ids: ElementIds, draft: SyntaxAnnotations, decodingIssues: readonly AnnotationIssue[] = []): DraftReading {
    const cx = contextOf(mm, ids);
    const clean = withoutStale(draft, ids);
    const { grammar } = textualNotation(mm, { record: clean, issues: [] }, ids);
    const all: FormFault[] = decodingIssues.map(i => ({ level: i.level, rule: 'annotations', message: i.message, at: [] }));
    for (const f of checkStyle(grammar)) {
        if (f.level === 'ok') continue;
        const { at, message } = locate(f, grammar, mm, cx, clean);
        all.push({ level: f.level, rule: f.rule, message, at });
    }
    const seen = new Set<string>();
    const faults = all.filter(f => {
        const k = faultKey(f);
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
    });
    faults.sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1));
    const stale = staleEntries(draft, ids).length;
    if (stale) {
        faults.push({ level: 'notice', rule: 'stale', at: [],
            message: stale === 1 ? '1 annotation of a deleted element: Save writes the record without it' : `${stale} annotations of deleted elements: Save writes the record without them` });
    }
    return { grammar, faults, stale };
}

/** Each field's faults, one message per fault, with the other fields the same fault is about (D9). */
export function byField(faults: readonly FormFault[]): Map<string, { readonly level: FormFault['level']; readonly message: string; readonly also: readonly FieldRef[] }[]> {
    const out = new Map<string, { level: FormFault['level']; message: string; also: FieldRef[] }[]>();
    for (const f of faults) {
        for (const r of f.at) {
            const k = fieldKey(r);
            const also = f.at.filter(x => fieldKey(x) !== k);
            out.set(k, [...(out.get(k) ?? []), { level: f.level, message: f.message, also }]);
        }
    }
    return out;
}

/** «the keyword of Or»: a field as a sentence names it, for `also`. */
export function fieldPhrase(ids: ElementIds, r: FieldRef): string {
    const kind = kindOf(r.element);
    const id = idOf(r.element);
    const f = kind === 'feature' ? ids.features[id] : undefined;
    const name = kind === 'language' ? 'the language' : kind === 'class' ? ids.classes[id] : kind === 'enum' ? ids.enums[id] : f ? `${f.owner}.${f.name}` : id;
    const label = r.field ? LABELS.get(r.field)?.toLowerCase() : undefined;
    return label ? `the ${label} of ${name}` : name ?? id;
}

// ---- Save (D1, D3) ---------------------------------------------------------------------------------------------------

/** Whether the draft differs from the stored key; the empty record over no key does not (D3). */
export function isDirty(storedRaw: string | null | undefined, draft: SyntaxAnnotations): boolean {
    return syntaxPatch(storedRaw, draft) !== null;
}

export type SaveBlock = 'errors' | 'unchanged' | 'pending';

export interface SaveGateInput {
    readonly faults: readonly FormFault[];
    readonly storedRaw: string | null | undefined;
    readonly draft: SyntaxAnnotations;
    /** The Text layer holds an edit not yet applied (TextualTab.tsx `canSwitchStyle`). */
    readonly pendingEdit: boolean;
}

/**
 * The three gates of Save (D1): (a) an error fault, (b) the draft is the stored record, (c) a pending Text edit. A
 * notice never blocks, the deleted elements' one included (D7). The title is the first block's reason.
 */
export function saveGate(input: SaveGateInput): { readonly enabled: boolean; readonly blocks: readonly SaveBlock[]; readonly title: string } {
    const errs = input.faults.filter(f => f.level === 'error');
    const blocks: SaveBlock[] = [];
    if (errs.length) blocks.push('errors');
    if (!isDirty(input.storedRaw, input.draft)) blocks.push('unchanged');
    if (input.pendingEdit) blocks.push('pending');
    const title = !blocks.length ? 'Save the syntax'
        : blocks[0] === 'errors' ? `${errs.length} error${errs.length === 1 ? '' : 's'}: ${errs[0].message}`
            : blocks[0] === 'unchanged' ? 'No unsaved changes' : 'Apply or discard the edit in Text first';
    return { enabled: !blocks.length, blocks, title };
}

/**
 * The Text tab's style picker (P-2026-11-05-0910): a record the style check refuses is not written, as Save is not (D1);
 * the reason in Save's words, the count and the first error. Null when nothing refuses it; a notice never does.
 */
export function styleRefusal(mm: TextMetamodel, ids: ElementIds, record: SyntaxAnnotations, decodingIssues: readonly AnnotationIssue[] = []): string | null {
    const errs = readDraft(mm, ids, record, decodingIssues).faults.filter(f => f.level === 'error');
    return errs.length ? `${errs.length} error${errs.length === 1 ? '' : 's'}: ${errs[0].message}` : null;
}

/** What Save writes: the draft without the entries of deleted elements (D7). */
export const recordToSave = (draft: SyntaxAnnotations, ids: ElementIds): SyntaxAnnotations => withoutStale(draft, ids);

// ---- Preview ----------------------------------------------------------------------------------------------------------

/** The EBNF and the open model's print under a draft, as Save would leave them; a failure is reported, never thrown. */
export function draftPreview(mm: TextMetamodel, ids: ElementIds, draft: SyntaxAnnotations, objects: readonly TextObject[]): { readonly ebnf: string; readonly text: string; readonly error: string | null } {
    try {
        const { grammar } = textualNotation(mm, { record: withoutStale(draft, ids), issues: [] }, ids);
        const ebnf = concreteGrammarEbnf(grammar);
        try {
            return { ebnf, text: printTextModel(grammar, objects).text, error: null };
        } catch (e) {
            return { ebnf, text: '', error: e instanceof Error ? e.message : String(e) };
        }
    } catch (e) {
        return { ebnf: '', text: '', error: e instanceof Error ? e.message : String(e) };
    }
}

// ---- The literals of the EBNF mode (R-TXT-48, R-TXT-49 D4, D5, D8, D11; lane L1a, P-2026-11-05-0841) ---------------

/**
 * The record field an EBNF literal edits, by its origin (report docs/discovery/discovery_2026-11-05_textual_ebnf_literals.md
 * §3.1): names to ids through `contextOf`; a style token to its parameter's field (L2a). None for an enumeration literal
 * (D8), a fixed token (D11), or an element the ids do not hold.
 */
export function literalField(mm: TextMetamodel, ids: ElementIds, src: LiteralSrc | undefined): FieldRef | undefined {
    if (!src) return undefined;
    const cx = contextOf(mm, ids);
    const ofClass = (cls: string, field: FieldId): FieldRef | undefined => {
        const id = cx.classId(cls);
        return id === undefined ? undefined : { element: `class:${id}`, field };
    };
    const ofFeature = (key: string, field: FieldId): FieldRef | undefined => {
        const dot = key.indexOf('.');
        const id = cx.featureId(key.slice(0, dot), key.slice(dot + 1));
        return id === undefined ? undefined : { element: `feature:${id}`, field };
    };
    switch (src.k) {
        case 'class': return ofClass(src.cls, 'class.keyword');
        case 'nameKeyword': return ofClass(src.cls, 'class.nameKeyword');
        case 'operatorSymbol': return ofClass(src.cls, 'class.operatorSymbol');
        case 'operatorCall': return ofClass(src.cls, 'class.operatorCall');
        case 'feature': return ofFeature(src.feature, 'feature.keyword');
        case 'itemKeyword': return ofFeature(src.feature, 'feature.itemKeyword');
        case 'subset': {
            const id = cx.enumId(src.enumName);
            return id === undefined ? undefined : { element: `enum:${id}`, field: 'enum.subsets' };
        }
        case 'style': return { element: 'language', field: tokenField(src.param) };
        // B2: an own per-block token edits its element's side; an inherited one has the style origin (R-TXT-52 D10).
        case 'classBlock': return ofClass(src.cls, src.side === 'open' ? 'class.blockOpen' : 'class.blockClose');
        case 'featureBlock': return ofFeature(src.feature, src.side === 'open' ? 'feature.blockOpen' : 'feature.blockClose');
        default: return undefined;
    }
}

const sameSrc = (a: LiteralSrc | undefined, b: LiteralSrc): boolean => a !== undefined && JSON.stringify(a) === JSON.stringify(b);

/**
 * The text an origin prints with its field cleared: the grammar derived a second time from the draft without the field
 * (D5). Not the form's placeholder, which ignores the class case and the call word's class keyword. Undefined where
 * clearing the field removes the literal (a per-item keyword, a name keyword, an operator symbol, a group name).
 */
export function literalDefault(mm: TextMetamodel, ids: ElementIds, draft: SyntaxAnnotations, src: LiteralSrc): string | undefined {
    const ref = literalField(mm, ids, src);
    if (!ref || src.k === 'subset') return undefined;
    const { grammar } = textualNotation(mm, { record: withoutStale(setField(draft, ref, undefined), ids), issues: [] }, ids);
    // A per-block token cleared is the inherited side's at its index, none past it (report §4.2).
    if (src.k === 'classBlock' || src.k === 'featureBlock') return grammar.style[src.side === 'open' ? 'blockOpen' : 'blockClose'][src.index];
    return concreteGrammarEbnfSpans(grammar).literals.find(l => sameSrc(l.src, src))?.text;
}

export type LiteralEdit =
    | { readonly ok: true; readonly draft: SyntaxAnnotations; readonly at: FieldRef }
    | { readonly ok: false; readonly reason: string };

// The resolution's rules (annotations.ts `IDENTIFIER`, `isFeatureKeyword`, `isSymbol`), checked before the draft so
// that a value the resolution would drop is never written.
const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const PUNCTUATION_KEYWORD = /^[^\w\s"'@]+$/;
const SYMBOL_RUN = /^[^\w\s]+$/;

/** What an EBNF literal of each origin is called in a refusal. */
const LITERAL_NAME: Readonly<Record<LiteralSrc['k'], string>> = {
    class: 'a class keyword', nameKeyword: 'a name keyword', operatorSymbol: 'an operator symbol', operatorCall: 'a call word',
    feature: 'a feature keyword', itemKeyword: 'a per-item keyword', subset: 'a group name',
    literal: 'an enumeration literal', style: 'a style token', fixed: 'a fixed token',
    classBlock: 'a block token of a class', featureBlock: 'a block token of a containment',
};

/** D4: the origins whose empty value is their default; for the others clearing would remove a structure. */
const EMPTY_IS_DEFAULT: ReadonlySet<LiteralSrc['k']> = new Set(['class', 'feature', 'operatorCall']);

/** Why a value is not well formed for an origin's field, or undefined. */
function malformed(k: LiteralSrc['k'], value: string): string | undefined {
    if (k === 'style' || k === 'classBlock' || k === 'featureBlock') { const why = styleTokenFault(value); return why ? `"${value}" ${why}` : undefined; }
    if (k === 'feature') return IDENTIFIER.test(value) || PUNCTUATION_KEYWORD.test(value) ? undefined : `"${value}" is not an identifier or a run of punctuation`;
    if (k === 'operatorSymbol') return IDENTIFIER.test(value) || SYMBOL_RUN.test(value) ? undefined : `"${value}" is neither an identifier nor a run of symbol characters`;
    return IDENTIFIER.test(value) ? undefined : `"${value}" is not an identifier`;
}

/**
 * The draft with an EBNF literal set to a value, or the reason it is refused (R-TXT-48). A value equal to the printed
 * default is stored as cleared (D5); an empty one is the default where D4 says so and refused elsewhere; a quote, a
 * blank, or a value the field's resolution would drop is refused; an enumeration literal and a fixed token are read only
 * (D8, D11). A group name renames its own group in the enumeration's list; a style token replaces its element of the
 * parameter's effective array, the whole array stored, cleared when equal to the base's (D9); an own per-block token its
 * element of the element's side, cleared when equal to the side it inherits (B2).
 */
export function setLiteral(mm: TextMetamodel, ids: ElementIds, draft: SyntaxAnnotations, src: LiteralSrc | undefined, value: string): LiteralEdit {
    const at = literalField(mm, ids, src);
    if (!src || !at) return { ok: false, reason: `${src ? LITERAL_NAME[src.k] : 'this literal'} is read only` };
    const what = LITERAL_NAME[src.k];
    if (value.includes('"')) return { ok: false, reason: `${what} cannot hold a quote` };
    if (/\s/.test(value)) return { ok: false, reason: `${what} cannot hold a blank` };
    if (value === '') {
        if (!EMPTY_IS_DEFAULT.has(src.k)) return { ok: false, reason: `${what} cannot be empty: clearing it removes it from the notation` };
        return { ok: true, draft: setField(draft, at, undefined), at };
    }
    const bad = malformed(src.k, value);
    if (bad) return { ok: false, reason: `${what}: ${bad}` };
    if (src.k === 'subset') {
        const subsets = draft.enums?.[idOf(at.element)]?.subsets;
        if (!subsets?.[src.index]) return { ok: false, reason: `${what}: the group is not in the draft` };
        return { ok: true, draft: setField(draft, at, subsets.map((s, i) => (i === src.index ? { ...s, name: value } : s))), at };
    }
    if (src.k === 'style') {
        if (src.param.startsWith('list.')) return { ok: true, draft: setField(draft, at, value), at };
        const effective = textualNotation(mm, { record: withoutStale(draft, ids), issues: [] }, ids).grammar.style[src.param as 'assign'];
        if (effective[src.index] === undefined) return { ok: false, reason: `${what}: the token is not in the style` };
        return { ok: true, draft: setField(draft, at, effective.map((t, i) => (i === src.index ? value : t))), at };
    }
    if (src.k === 'classBlock' || src.k === 'featureBlock') {
        // B2: the element's own side with its token replaced; equal to the inherited side, setField clears it.
        const own = fieldValue(draft, at);
        if (!Array.isArray(own) || own[src.index] === undefined) return { ok: false, reason: `${what}: the token is not in the block` };
        return { ok: true, draft: setField(draft, at, own.map((t, i) => (i === src.index ? value : t))), at };
    }
    const cleared = value === literalDefault(mm, ids, draft, src);
    return { ok: true, draft: setField(draft, at, cleared ? undefined : value), at };
}

/** The empty record, the draft of a metamodel with none. */
export const EMPTY_DRAFT: SyntaxAnnotations = { v: SYNTAX_RECORD_VERSION };

// ---- The form's list, the stored record under the draft, the bar (C2b, P-2026-11-05-0118) ----------------------------

export interface ElementMark {
    /** The draft annotates the element (a class: itself or one of its own features). */
    readonly annotated: boolean;
    /** The worst fault at the element or, for a class, at one of its own features. */
    readonly finding: FormFault['level'] | null;
}

/** Each listed element's marks: the accent dot of an annotated element, the mark of a fault that maps there. */
export function elementMarks(elements: readonly FormElement[], draft: SyntaxAnnotations, faults: readonly FormFault[]): Map<ElementKey, ElementMark> {
    const has = (o: object | undefined): boolean => o !== undefined && Object.keys(o).length > 0;
    const worst = new Map<ElementKey, FormFault['level']>();
    for (const f of faults) for (const r of f.at) if (worst.get(r.element) !== 'error') worst.set(r.element, f.level);
    const out = new Map<ElementKey, ElementMark>();
    for (const e of elements) {
        const keys = [e.key, ...(e.features ?? [])];
        const annotated = e.kind === 'language' ? draft.language !== undefined || has(draft.style) || draft.roots !== undefined
            : e.kind === 'class' ? has(draft.classes?.[idOf(e.key)]) || (e.features ?? []).some(k => has(draft.features?.[idOf(k)]))
                : e.kind === 'enum' ? has(draft.enums?.[idOf(e.key)]) : has(draft.features?.[idOf(e.key)]);
        const levels = keys.map(k => worst.get(k));
        out.set(e.key, { annotated, finding: levels.includes('error') ? 'error' : levels.includes('notice') ? 'notice' : null });
    }
    return out;
}

/**
 * What a change of the stored record means for the draft: `same`, nothing changed; `adopt`, the store now holds the
 * draft (a Save landed); `reset`, the draft was clean and follows the store (an undo, another tab); `kept`, a dirty draft
 * stays and the bar offers Reload (the Text tab's stale pattern).
 */
export function storedChange(base: string | null | undefined, storedRaw: string | null | undefined, draft: SyntaxAnnotations): 'same' | 'adopt' | 'reset' | 'kept' {
    if ((base ?? null) === (storedRaw ?? null)) return 'same';
    if (!isDirty(storedRaw, draft)) return 'adopt';
    return isDirty(base, draft) ? 'kept' : 'reset';
}

/**
 * D9: the de-duplicated `checkStyle` errors of the stored record, as the bar lists them, named by their first field;
 * none the notation's own issues already show.
 */
export function storedErrors(mm: TextMetamodel, ids: ElementIds, record: SyntaxAnnotations | null, shown: readonly AnnotationIssue[]): AnnotationIssue[] {
    const messages = new Set(shown.map(i => i.message));
    return readDraft(mm, ids, record ?? EMPTY_DRAFT).faults
        .filter(f => f.level === 'error' && !messages.has(f.message))
        .map(f => ({ level: 'error' as const, where: f.at.length ? fieldPhrase(ids, f.at[0]) : 'syntax', message: f.message }));
}

/** An enumeration's groups as one line: `prose: FICTION, HISTORY; verse: POETRY`. */
export const subsetsText = (subsets: readonly EnumSubset[] | undefined): string => (subsets ?? []).map(s => `${s.name}: ${s.literals.join(', ')}`).join('; ');

/** The groups a line of `subsetsText` names; a group without a name or a literal is dropped. */
export function parseSubsets(text: string): EnumSubset[] {
    return text.split(';').flatMap(part => {
        const colon = part.indexOf(':');
        if (colon < 0) return [];
        const name = part.slice(0, colon).trim();
        const literals = part.slice(colon + 1).split(',').map(l => l.trim()).filter(Boolean);
        return name && literals.length ? [{ name, literals }] : [];
    });
}

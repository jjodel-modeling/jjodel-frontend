/**
 * Level 3 of R-TXT-16: optional syntax annotations on metamodel elements, which adjust the concrete grammar locally (a
 * feature's keyword, a class on one line or positional, an enumeration's literals grouped by subsets, a class as a
 * binary operator). This module holds them as plain data keyed by element id (R-TXT-21 (2)), and resolves them to the
 * names the derivation works with (concreteGrammar.ts). Storage in the metamodel's `_state` is step T4a-2.
 *
 * Resolution is tolerant: an unknown id or a malformed entry is an error issue and is dropped, never a throw. What the
 * derivation refuses (an annotation that would make the grammar ambiguous, R-TXT-21 (4), R-TXT-27) is reported there.
 */

import type { TextMetamodel } from './metamodel';
import { classFeatures, isNameFeature } from './metamodel';
import { isStyleBase } from './style';
import type { LetterCase, NotationStyle, StyleBase } from './style';

export interface OperatorAnnotation {
    readonly symbol: string;
    readonly precedence: number;
    readonly assoc?: 'left' | 'right';
}

export interface ClassAnnotation {
    /** The class keyword; `''` makes the class positional (no keyword). */
    readonly keyword?: string;
    /** `line`: the features on the head's line, with no block (refused when the class has a containment). */
    readonly layout?: 'block' | 'line';
    /** `keyword`: the name moves after the features, behind this keyword. `default`: a pattern over the attributes (`{kind}(_{requester})?`), the name omitted when it equals it. */
    readonly name?: { readonly keyword?: string; readonly default?: string };
    /** Stored and validated, not applied yet. */
    readonly operator?: OperatorAnnotation;
}

export interface FeatureAnnotation {
    /** The feature keyword; `''` makes the feature positional. */
    readonly keyword?: string;
    /** A containment whose objects stand directly in the owner's body, with no keyword and no block. */
    readonly inline?: boolean;
    /** A many-valued containment grouped by an enumeration attribute (its id) of the contained class, by the enumeration's subsets. */
    readonly groupBy?: string;
    /** `name`: a string attribute printed as a name (unquoted when it is an identifier). */
    readonly value?: 'name';
}

export interface EnumSubset {
    readonly name: string;
    /** Declared literal names. */
    readonly literals: readonly string[];
}

export interface EnumAnnotation {
    readonly subsets?: readonly EnumSubset[];
}

/** The annotations of one metamodel, keyed by element id. */
export interface SyntaxAnnotations {
    readonly v: 1;
    /** The language's name (by default the metamodel's, R-TXT-25 (12)). */
    readonly language?: string;
    /** `base`: the style of the catalog (style.ts `STYLE_CATALOG`), C-like when absent (step C3a); the options apply over it. */
    readonly style?: { readonly base?: StyleBase; readonly classCase?: LetterCase; readonly literalCase?: LetterCase; readonly blankBeforeContainment?: boolean };
    /** The classes the top level admits: `uncontained` (the concrete classes no containment can hold) or a list of class ids (R-TXT-24 (a)). */
    readonly roots?: 'uncontained' | readonly string[];
    readonly classes?: Readonly<Record<string, ClassAnnotation>>;
    readonly features?: Readonly<Record<string, FeatureAnnotation>>;
    readonly enums?: Readonly<Record<string, EnumAnnotation>>;
}

/** The metamodel's element ids; `lower` carries a feature's lower bound, which the notation's metamodel does not hold (R-TXT-21 (4)). */
export interface ElementIds {
    readonly classes: Readonly<Record<string, string>>;
    readonly features: Readonly<Record<string, { readonly owner: string; readonly name: string; readonly lower?: number }>>;
    readonly enums: Readonly<Record<string, string>>;
}

export interface AnnotationIssue {
    readonly level: 'error' | 'notice';
    /** `class C`, `C.f`, `enumeration E`, `roots`, `style`. */
    readonly where: string;
    readonly message: string;
}

/** A name pattern: text, `{attr}` holes, and `( ... )?` segments that print iff all their holes are set. */
export type PatternPiece = { readonly text: string } | { readonly hole: string };
export type PatternPart = PatternPiece | { readonly segment: readonly PatternPiece[] };

export interface NamePattern {
    readonly source: string;
    readonly parts: readonly PatternPart[];
}

export interface ResolvedClass {
    readonly keyword?: string;
    readonly layout?: 'block' | 'line';
    readonly name?: { readonly keyword?: string; readonly default?: NamePattern };
    readonly operator?: OperatorAnnotation;
}

export interface ResolvedFeature {
    readonly keyword?: string;
    readonly inline?: boolean;
    readonly groupBy?: { readonly attr: string; readonly owner: string; readonly mandatory: boolean };
    readonly value?: 'name';
}

/** The annotations keyed by names: classes by name, features by `Owner.f`, enumerations by name. */
export interface ResolvedAnnotations {
    readonly language?: string;
    readonly style: { readonly base?: StyleBase; readonly classCase?: LetterCase; readonly literalCase?: LetterCase; readonly blankBeforeContainment?: boolean };
    readonly roots?: 'uncontained' | readonly string[];
    readonly classes: Readonly<Record<string, ResolvedClass>>;
    readonly features: Readonly<Record<string, ResolvedFeature>>;
    readonly enums: Readonly<Record<string, { readonly subsets: readonly EnumSubset[] }>>;
    /** The classes whose name attribute (own or inherited) is mandatory (R-TXT-27). */
    readonly mandatoryName: ReadonlySet<string>;
    readonly issues: readonly AnnotationIssue[];
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const isKeyword = (v: unknown): v is string => typeof v === 'string' && (v === '' || IDENTIFIER.test(v));
const isCase = (v: unknown): v is LetterCase => v === 'declared' || v === 'lower';

/** Parses a name pattern; a string is the reason it is malformed. Segments do not nest. */
export function parseNamePattern(text: string): NamePattern | string {
    const parts: PatternPart[] = [];
    let segment: PatternPiece[] | null = null;
    let buf = '';
    const flush = (): void => {
        if (!buf) return;
        (segment ?? parts).push({ text: buf });
        buf = '';
    };
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '{') {
            const e = text.indexOf('}', i);
            const hole = e < 0 ? '' : text.slice(i + 1, e);
            if (!IDENTIFIER.test(hole)) return `a hole at ${i} is not {attribute}`;
            flush();
            (segment ?? parts).push({ hole });
            i = e;
        } else if (c === '(') {
            if (segment) return `segments do not nest (at ${i})`;
            flush();
            segment = [];
        } else if (c === ')') {
            if (!segment || text[i + 1] !== '?') return `a ")" at ${i} does not close a "( ... )?" segment`;
            flush();
            if (!segment.some(p => 'hole' in p)) return `the segment closed at ${i} has no hole`;
            parts.push({ segment });
            segment = null;
            i++;
        } else if (c === '}') {
            return `a "}" at ${i} closes no hole`;
        } else {
            buf += c;
        }
    }
    if (segment) return 'a "(" is not closed';
    flush();
    if (!parts.length) return 'the pattern is empty';
    return { source: text, parts };
}

/** The holes of a pattern, in order. */
export const patternHoles = (p: NamePattern): string[] =>
    p.parts.flatMap(x => ('segment' in x ? x.segment : [x])).flatMap(x => ('hole' in x ? [x.hole] : []));

/** Expands a pattern: undefined when a hole outside a segment is unset; a segment prints iff all its holes are set. */
export function expandNamePattern(p: NamePattern, hole: (name: string) => string | undefined): string | undefined {
    let out = '';
    const piece = (x: PatternPiece): string | undefined => ('hole' in x ? hole(x.hole) : x.text);
    for (const x of p.parts) {
        if ('segment' in x) {
            const vs = x.segment.map(piece);
            if (vs.every(v => v !== undefined)) out += vs.join('');
        } else {
            const v = piece(x);
            if (v === undefined) return undefined;
            out += v;
        }
    }
    return out;
}

/** Resolves a record of annotations against the element ids of its metamodel. */
export function resolveAnnotations(record: SyntaxAnnotations, ids: ElementIds, mm: TextMetamodel): ResolvedAnnotations {
    const issues: AnnotationIssue[] = [];
    const error = (where: string, message: string): void => { issues.push({ level: 'error', where, message }); };
    const classes: Record<string, ResolvedClass> = {};
    const features: Record<string, ResolvedFeature> = {};
    const enums: Record<string, { subsets: EnumSubset[] }> = {};
    const style: { base?: StyleBase; classCase?: LetterCase; literalCase?: LetterCase; blankBeforeContainment?: boolean } = {};

    const mandatory = new Set(Object.values(ids.features).filter(f => (f.lower ?? 0) >= 1).map(f => `${f.owner}.${f.name}`));
    const mandatoryName = new Set(mm.classes.flatMap(c => {
        const n = classFeatures(mm, c).find(isNameFeature);
        return n && mandatory.has(`${n.owner}.${n.name}`) ? [c.name] : [];
    }));
    const empty: ResolvedAnnotations = { style, classes, features, enums, mandatoryName, issues };

    if (!record || record.v !== 1) {
        error('annotations', `unknown version ${JSON.stringify(record?.v)}: nothing applied`);
        return empty;
    }

    let language: string | undefined;
    if (record.language !== undefined) {
        if (typeof record.language === 'string' && record.language.trim()) language = record.language;
        else error('language', 'the language name is not a non-empty string');
    }

    const s = record.style ?? {};
    if (s.base !== undefined) {
        if (isStyleBase(s.base)) style.base = s.base;
        else error('style', `base ${JSON.stringify(s.base)} is not a style of the catalog (clike, pascal): C-like applied`);
    }
    if (s.classCase !== undefined) { if (isCase(s.classCase)) style.classCase = s.classCase; else error('style', `classCase ${JSON.stringify(s.classCase)} is not declared or lower`); }
    if (s.literalCase !== undefined) { if (isCase(s.literalCase)) style.literalCase = s.literalCase; else error('style', `literalCase ${JSON.stringify(s.literalCase)} is not declared or lower`); }
    if (s.blankBeforeContainment !== undefined) {
        if (typeof s.blankBeforeContainment === 'boolean') style.blankBeforeContainment = s.blankBeforeContainment;
        else error('style', 'blankBeforeContainment is not a boolean');
    }

    let roots: 'uncontained' | string[] | undefined;
    if (record.roots === 'uncontained') roots = 'uncontained';
    else if (Array.isArray(record.roots)) {
        roots = [];
        for (const id of record.roots) {
            const cls = ids.classes[id];
            if (cls === undefined) error('roots', `no class has the id ${JSON.stringify(id)}`);
            else roots.push(cls);
        }
    } else if (record.roots !== undefined) error('roots', 'roots is neither "uncontained" nor a list of class ids');

    for (const [id, a] of Object.entries(record.classes ?? {})) {
        const cls = ids.classes[id];
        if (cls === undefined) { error('classes', `no class has the id ${JSON.stringify(id)}`); continue; }
        const where = `class ${cls}`;
        const out: { keyword?: string; layout?: 'block' | 'line'; name?: { keyword?: string; default?: NamePattern }; operator?: OperatorAnnotation } = {};
        if (a.keyword !== undefined) { if (isKeyword(a.keyword)) out.keyword = a.keyword; else error(where, `the keyword ${JSON.stringify(a.keyword)} is not an identifier or ""`); }
        if (a.layout !== undefined) { if (a.layout === 'block' || a.layout === 'line') out.layout = a.layout; else error(where, `the layout ${JSON.stringify(a.layout)} is not block or line`); }
        if (a.name !== undefined) {
            const name: { keyword?: string; default?: NamePattern } = {};
            if (a.name.keyword !== undefined) {
                if (typeof a.name.keyword === 'string' && IDENTIFIER.test(a.name.keyword)) name.keyword = a.name.keyword;
                else error(where, `the name keyword ${JSON.stringify(a.name.keyword)} is not an identifier`);
            }
            if (a.name.default !== undefined) {
                const p = typeof a.name.default === 'string' ? parseNamePattern(a.name.default) : 'not a string';
                if (typeof p === 'string') error(where, `the name pattern ${JSON.stringify(a.name.default)} is malformed: ${p}`);
                else name.default = p;
            }
            if (name.keyword !== undefined || name.default !== undefined) out.name = name;
        }
        if (a.operator !== undefined) {
            const o = a.operator;
            if (typeof o?.symbol !== 'string' || !o.symbol.trim()) error(where, 'the operator has no symbol');
            else if (!Number.isInteger(o.precedence)) error(where, `the operator's precedence ${JSON.stringify(o.precedence)} is not an integer`);
            else if (o.assoc !== undefined && o.assoc !== 'left' && o.assoc !== 'right') error(where, `the operator's associativity ${JSON.stringify(o.assoc)} is not left or right`);
            else {
                out.operator = { symbol: o.symbol, precedence: o.precedence, ...(o.assoc ? { assoc: o.assoc } : {}) };
                issues.push({ level: 'notice', where, message: `the operator "${o.symbol}" is stored, not applied yet` });
            }
        }
        classes[cls] = out;
    }

    for (const [id, a] of Object.entries(record.features ?? {})) {
        const f = ids.features[id];
        if (f === undefined) { error('features', `no feature has the id ${JSON.stringify(id)}`); continue; }
        const where = `${f.owner}.${f.name}`;
        const out: { keyword?: string; inline?: boolean; groupBy?: { attr: string; owner: string; mandatory: boolean }; value?: 'name' } = {};
        if (a.keyword !== undefined) { if (isKeyword(a.keyword)) out.keyword = a.keyword; else error(where, `the keyword ${JSON.stringify(a.keyword)} is not an identifier or ""`); }
        if (a.inline !== undefined) { if (typeof a.inline === 'boolean') out.inline = a.inline; else error(where, 'inline is not a boolean'); }
        if (a.value !== undefined) { if (a.value === 'name') out.value = 'name'; else error(where, `the value form ${JSON.stringify(a.value)} is not "name"`); }
        if (a.groupBy !== undefined) {
            const g = ids.features[a.groupBy];
            if (g === undefined) error(where, `groupBy: no feature has the id ${JSON.stringify(a.groupBy)}`);
            else out.groupBy = { attr: g.name, owner: g.owner, mandatory: (g.lower ?? 0) >= 1 };
        }
        features[where] = out;
    }

    for (const [id, a] of Object.entries(record.enums ?? {})) {
        const e = ids.enums[id];
        if (e === undefined) { error('enums', `no enumeration has the id ${JSON.stringify(id)}`); continue; }
        if (!Array.isArray(a.subsets)) continue;
        const ok = a.subsets.every(x => typeof x?.name === 'string' && IDENTIFIER.test(x.name) && Array.isArray(x.literals) && x.literals.every((l: unknown) => typeof l === 'string'));
        if (!ok) error(`enumeration ${e}`, 'a subset is not {name: identifier, literals: string[]}');
        else enums[e] = { subsets: a.subsets.map(x => ({ name: x.name, literals: [...x.literals] })) };
    }

    return { ...(language !== undefined ? { language } : {}), style, ...(roots !== undefined ? { roots } : {}), classes, features, enums, mandatoryName, issues };
}

/** The style with the record's style options applied; the base is not an option, it chose `style` (syntaxRecord.ts). */
export function withStyleOptions(style: NotationStyle, a: ResolvedAnnotations): NotationStyle {
    const { base: _base, ...options } = a.style;
    return { ...style, ...options };
}

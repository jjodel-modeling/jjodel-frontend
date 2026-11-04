/**
 * syntaxRecord — the syntax annotations of a metamodel as its bag stores them, and the one path every textual surface
 * derives its grammar through (step T4a-2, P-2026-11-02-1830; R-TXT-21 (2), R-TXT-25 (12)).
 *
 * The annotations (annotations.ts `SyntaxAnnotations`) live in one key of the metamodel's `_state`, `textSyntax`, next
 * to the generators' `genTemplates` and `genGenerators`, as a JSON string `{"v":1,...}` written in a fixed field order,
 * so the same record gives the same string. The key is not a `sim*` key, for the reason templateCodec.ts gives. A
 * metamodel with no annotations has no key, and nothing writes one until a record is saved (`syntaxPatch`); a record
 * emptied is written `{"v":1}`, never removed, since the undo of a removed bag key does not restore it (R-SIM-99). The
 * writer is the existing `state` setter, one `set_state`, one undo step (openTextualTab.tsx `writeTextualSyntax`).
 * No VersionFixer step: a project saved before the key has none, and unknown keys survive save and load.
 *
 * Decoding is tolerant: a string that is not JSON, a record with no version, or a newer one reads as no annotations
 * with one issue; an entry that is not a record is an issue of its own and the others decode. What survives goes to
 * `resolveAnnotations`, whose own refusals are issues too. Never a throw.
 *
 * The element ids are read from the metamodel's D-layer records (packages, classifiers, a class's attributes and
 * references), which hold the ids and the lower bounds the eval-context shells do not: a renamed class or feature
 * keeps its id, so its annotation follows it.
 *
 * Pure: the bag and the lookup are plain data, and the module dispatches nothing.
 */

import { TEXTUAL_SYNTAX_KEY } from '../../components/editor-v2/dataManagerOption';
import { resolveAnnotations, withStyleOptions } from './annotations';
import type { AnnotationIssue, ElementIds, SyntaxAnnotations } from './annotations';
import { deriveBaseGrammar } from './baseGrammar';
import { deriveConcreteGrammar } from './concreteGrammar';
import type { ConcreteGrammar } from './concreteGrammar';
import type { TextMetamodel } from './metamodel';
import { CLIKE_STYLE, isStyleBase, styleOf } from './style';
import type { StyleBase } from './style';

export { TEXTUAL_SYNTAX_KEY };

type Lookup = Readonly<Record<string, any>>;

/** The record version this build writes and reads. */
export const SYNTAX_RECORD_VERSION = 1;

export interface DecodedSyntax {
    /** `null` when there is no key, or the key cannot be read. */
    readonly record: SyntaxAnnotations | null;
    readonly issues: readonly AnnotationIssue[];
}

const isRecord = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

const WHERE = 'annotations record';

/** The one string of the key: `v`, then the fields present, in a fixed order. */
export function encodeSyntax(record: SyntaxAnnotations): string {
    return JSON.stringify({
        v: SYNTAX_RECORD_VERSION,
        ...(record.language !== undefined ? { language: record.language } : {}),
        ...(record.style !== undefined ? { style: record.style } : {}),
        ...(record.roots !== undefined ? { roots: record.roots } : {}),
        ...(record.classes !== undefined ? { classes: record.classes } : {}),
        ...(record.features !== undefined ? { features: record.features } : {}),
        ...(record.enums !== undefined ? { enums: record.enums } : {}),
    });
}

/** The entries of a section that are records; any other is an issue and is dropped. */
function section(root: Record<string, unknown>, key: 'classes' | 'features' | 'enums', issues: AnnotationIssue[]): Record<string, any> | undefined {
    const v = root[key];
    if (v === undefined) return undefined;
    if (!isRecord(v)) {
        issues.push({ level: 'error', where: WHERE, message: `${key} is not a record keyed by element id: dropped` });
        return undefined;
    }
    const out: Record<string, any> = {};
    for (const [id, entry] of Object.entries(v)) {
        if (!isRecord(entry)) {
            issues.push({ level: 'error', where: WHERE, message: `${key} ${JSON.stringify(id)} is not a record: dropped` });
            continue;
        }
        if (key === 'classes' && entry.name !== undefined && !isRecord(entry.name)) {
            issues.push({ level: 'error', where: WHERE, message: `classes ${JSON.stringify(id)}: the name is not a record: dropped` });
            const { name: _dropped, ...rest } = entry;
            out[id] = rest;
            continue;
        }
        out[id] = entry;
    }
    return out;
}

/** The record of the key, and why it, or part of it, was not read. `undefined` and `null` are no key: no record, no issue. */
export function decodeSyntax(raw: string | null | undefined): DecodedSyntax {
    if (raw === undefined || raw === null) return { record: null, issues: [] };
    const unreadable = (message: string): DecodedSyntax => ({ record: null, issues: [{ level: 'error', where: WHERE, message }] });
    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return unreadable('the stored annotations are not JSON: none applied');
    }
    if (!isRecord(parsed)) return unreadable('the stored annotations are not a record: none applied');
    const v = parsed.v;
    if (typeof v !== 'number') return unreadable('the stored annotations have no version: none applied');
    if (v > SYNTAX_RECORD_VERSION) return unreadable(`the stored annotations are version ${v}, newer than this Jjodel reads (${SYNTAX_RECORD_VERSION}): none applied`);
    if (v !== SYNTAX_RECORD_VERSION) return unreadable(`the stored annotations have the unknown version ${JSON.stringify(v)}: none applied`);
    const issues: AnnotationIssue[] = [];
    const classes = section(parsed, 'classes', issues);
    const features = section(parsed, 'features', issues);
    const enums = section(parsed, 'enums', issues);
    let style = parsed.style;
    if (style !== undefined && !isRecord(style)) {
        issues.push({ level: 'error', where: WHERE, message: 'style is not a record: dropped' });
        style = undefined;
    }
    const record = { ...parsed, v: SYNTAX_RECORD_VERSION, style, classes, features, enums } as SyntaxAnnotations;
    return { record, issues };
}

/**
 * What a save writes: one `state` assignment holding the key alone, so one `set_state` and one undo step; `null` when
 * the record is the stored one. `raw` is the key as stored, `null` or `undefined` when absent.
 */
export function syntaxPatch(raw: string | null | undefined, record: SyntaxAnnotations): Record<string, string> | null {
    const encoded = encodeSyntax(record);
    return encoded === raw ? null : { [TEXTUAL_SYNTAX_KEY]: encoded };
}

/** The key as stored on the metamodel `metamodelId`: a string, or `undefined` when absent. */
export function storedSyntax(lookup: Lookup, metamodelId: string): string | undefined {
    const raw = lookup[metamodelId]?._state?.[TEXTUAL_SYNTAX_KEY];
    return raw === undefined || raw === null ? undefined : typeof raw === 'string' ? raw : String(raw);
}

/** The annotations stored on the metamodel `metamodelId`. */
export function readSyntax(lookup: Lookup, metamodelId: string): DecodedSyntax {
    return decodeSyntax(storedSyntax(lookup, metamodelId));
}

const pointers = (v: unknown): string[] => (Array.isArray(v) ? v.filter((p): p is string => typeof p === 'string') : []);
const nameOf = (o: any): string => (typeof o?.name === 'string' ? o.name : '');

/**
 * The element ids of the metamodel `metamodelId`, from its D-layer records: every class, its own attributes and
 * references with their lower bounds (R-TXT-21 (4)), every enumeration, in every package and subpackage.
 */
export function elementIdsOf(lookup: Lookup, metamodelId: string): ElementIds {
    const classes: Record<string, string> = {};
    const features: Record<string, { owner: string; name: string; lower?: number }> = {};
    const enums: Record<string, string> = {};
    const seen = new Set<string>();
    const visit = (pkgId: string): void => {
        if (seen.has(pkgId)) return;
        seen.add(pkgId);
        const pkg = lookup[pkgId];
        if (!pkg) return;
        // A package lists its classifiers as `classes` and `enumerators`; a state saved before them, as `classifiers`.
        const classifiers = [...new Set([...pointers(pkg.classes), ...pointers(pkg.enumerators), ...pointers(pkg.classifiers)])];
        for (const eid of classifiers) if (lookup[eid]?.className === 'DEnumerator') enums[eid] = nameOf(lookup[eid]);
        for (const cid of classifiers) {
            const c = lookup[cid];
            if (c?.className !== 'DClass') continue;
            const owner = nameOf(c);
            classes[cid] = owner;
            for (const fid of [...pointers(c.attributes), ...pointers(c.references)]) {
                const f = lookup[fid];
                if (!f) continue;
                const lower = Number(f.lowerBound);
                features[fid] = { owner, name: nameOf(f), ...(Number.isFinite(lower) ? { lower } : {}) };
            }
        }
        for (const sub of pointers(pkg.subpackages)) visit(sub);
    };
    for (const p of pointers(lookup[metamodelId]?.packages)) visit(p);
    return { classes, features, enums };
}

/** The grammar every textual surface uses, the language's name when the record sets one, and every issue to show. */
export interface TextualNotation {
    readonly grammar: ConcreteGrammar;
    readonly language?: string;
    /** The record's decoding issues, the grammar's case notices, and the annotations' issues, in that order. */
    readonly issues: readonly AnnotationIssue[];
}

/**
 * The shared path of the Text tab, the EBNF view and «New model from text»: read the record, resolve it, take the style
 * its base names from the catalog, apply its style options, derive. With no record (or one that cannot be read) the grammar is the unannotated one, byte for byte.
 */
export function textualNotation(mm: TextMetamodel, decoded: DecodedSyntax, ids: ElementIds): TextualNotation {
    const base = deriveBaseGrammar(mm);
    if (!decoded.record) {
        const grammar = deriveConcreteGrammar(base, CLIKE_STYLE);
        return { grammar, issues: [...decoded.issues, ...noticesOf(grammar)] };
    }
    const resolved = resolveAnnotations(decoded.record, ids, mm);
    const grammar = deriveConcreteGrammar(base, withStyleOptions(styleOf(resolved.style.base), resolved), resolved);
    return {
        grammar,
        ...(resolved.language !== undefined ? { language: resolved.language } : {}),
        issues: [...decoded.issues, ...noticesOf(grammar), ...(grammar.annotationIssues ?? [])],
    };
}

/** The style a picker shows for the decoded record: its base, C-like when it has none or one the catalog does not hold. */
export function styleBaseOf(decoded: DecodedSyntax): StyleBase {
    const b = decoded.record?.style?.base;
    return isStyleBase(b) ? b : 'clike';
}

/**
 * The record with the style `base` chosen (step C3a), every other field kept: C-like, the default, is written as no base,
 * and a style left empty goes, so a switch back gives the record's string before the switch. `null` is no record.
 */
export function withStyleBase(record: SyntaxAnnotations | null, base: StyleBase): SyntaxAnnotations {
    const r: SyntaxAnnotations = record ?? { v: SYNTAX_RECORD_VERSION };
    const { base: _old, ...options } = r.style ?? {};
    const style = base === 'clike' ? options : { base, ...options };
    const { style: _style, ...rest } = r;
    return Object.keys(style).length ? { ...rest, style } : rest;
}

const noticesOf = (g: ConcreteGrammar): AnnotationIssue[] => g.notices.map(n => ({ level: 'notice', where: 'style', message: n.message }));

/**
 * The JjScript lines that build a model from the objects of a parsed text (R-TXT-23, slice T2c, P-2026-11-02-0045):
 * what «New model from text» runs, through `applyAsOneStep`, on a new and empty model of the metamodel.
 *
 * Three groups, in this order: one `create instance of C "h"` per object in text order, ` in p.f` for a contained one
 * (text order puts a container before what it contains); then the attributes; then the references, `=` for a single
 * one and `+=` per value, in order, for a many-valued one. An object's handle is its name when the name is an
 * identifier, unique in the text, not a word the JjScript lexer reserves or reads as a literal, and not the name of a
 * class or enumeration; otherwise a generated `<Class>_<n>` free of every name in the text, followed by
 * `set h.name = "…"` when the object has a name. A nameless object of a class with a name takes its handle as name,
 * as any instance created without one. A many-valued attribute is written as a list, `set h.f = [v1, v2]`, which
 * replaces its values; an enumeration value as the bare literal, which `set` checks against the attribute's
 * enumeration and stores by name (R-TXT-25 (2), P-2026-11-02-0651). A literal JjScript would not read back as a name
 * (reserved, a literal word, not an identifier, or not a literal of the enumeration) is written as a string, which
 * `set` stores as given: the same name.
 *
 * What JjScript cannot write today is a problem, and any problem blocks the creation: a class name the lexer reads as
 * a word of its own, a feature name that is not an identifier.
 */

import { isReservedIdentifier } from '../../jjscript/reservedIdentifiers';
import type { ConcreteGrammar } from './concreteGrammar';
import { classFeatures, isNameFeature } from './metamodel';
import type { TextFeature, TextMetamodel, TextObject } from './metamodel';
import { isApplicableParse, parseText } from './parser';
import type { ObjectSpan } from './printer';

/** A value of `feature` (empty: the object itself) that JjScript cannot write. */
export interface LineProblem {
    readonly id: string;
    readonly feature: string;
    readonly message: string;
}

export interface ModelLines {
    readonly lines: readonly string[];
    /** Any one of them blocks the creation. */
    readonly problems: readonly LineProblem[];
    /** The handle of each object, by id, in text order. */
    readonly handles: ReadonlyMap<string, string>;
}

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** `parseValueOrQualified` reads these as literals in any case (`jjscript/parser/parser.ts`). */
const LITERAL_WORDS = new Set(['null', 'true', 'false']);
const ESCAPES: Readonly<Record<string, string>> = { '\\': '\\\\', '"': '\\"', '\n': '\\n', '\r': '\\r', '\t': '\\t' };

const asArray = (v: unknown): unknown[] => (Array.isArray(v) ? v : v == null ? [] : [v]);
export const isWord = (s: string): boolean => IDENTIFIER.test(s) && !isReservedIdentifier(s) && !LITERAL_WORDS.has(s.toLowerCase());

/** A string literal the JjScript lexer reads back as `s` (`readString`: `\n \t \r \\ \"`). */
export const jjscriptString = (s: string): string => `"${s.replace(/[\\"\n\r\t]/g, c => ESCAPES[c])}"`;

/** A number as the JjScript lexer reads it (`-?\d+(\.\d+)?`): never in exponent form. */
export function jjscriptNumber(n: number): string {
    const s = String(n);
    const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
    if (!m) return s;
    const digits = m[2] + (m[3] ?? '');
    const point = 1 + Number(m[4]);
    if (point <= 0) return `${m[1]}0.${'0'.repeat(-point)}${digits}`;
    if (point >= digits.length) return m[1] + digits + '0'.repeat(point - digits.length);
    return `${m[1]}${digits.slice(0, point)}.${digits.slice(point)}`;
}

/** A value as `set` reads it back: an enumeration literal bare when JjScript reads it as a name, else a string. */
export const valueText = (v: unknown, literals?: readonly string[]): string =>
    typeof v === 'number' ? jjscriptNumber(v) : typeof v === 'boolean' ? String(v)
        : typeof v === 'string' && literals?.includes(v) && isWord(v) ? v : jjscriptString(String(v));

/** The lines that build `objects` (a parse that `isApplicableParse` accepts) in an empty model of `mm`. */
export function modelLines(mm: TextMetamodel, objects: readonly TextObject[]): ModelLines {
    const featureCache = new Map<string, TextFeature[]>();
    const featuresOf = (cls: string): TextFeature[] => {
        let fs = featureCache.get(cls);
        if (!fs) {
            const c = mm.classes.find(k => k.name === cls);
            fs = c ? classFeatures(mm, c) : [];
            featureCache.set(cls, fs);
        }
        return fs;
    };
    const known = new Set(objects.map(o => o.id));
    const nameOf = (o: TextObject): string | null =>
        featuresOf(o.cls).some(isNameFeature) && typeof o.slots.name === 'string' ? o.slots.name : null;

    const container = new Map<string, { readonly owner: string; readonly feature: string }>();
    for (const o of objects) {
        for (const f of featuresOf(o.cls)) {
            if (f.kind !== 'containment') continue;
            for (const id of asArray(o.slots[f.name])) if (typeof id === 'string' && known.has(id)) container.set(id, { owner: o.id, feature: f.name });
        }
    }

    // Handles: the name where JjScript can address it, else `<Class>_<n>` free of every name.
    const count = new Map<string, number>();
    for (const o of objects) {
        const n = nameOf(o);
        if (n !== null) count.set(n, (count.get(n) ?? 0) + 1);
    }
    const metaNames = new Set([...mm.classes.map(c => c.name), ...mm.enumerations.map(e => e.name)]);
    const taken = new Set([...count.keys(), ...metaNames]);
    const handles = new Map<string, string>();
    const next = new Map<string, number>();
    for (const o of objects) {
        const n = nameOf(o);
        if (n !== null && count.get(n) === 1 && isWord(n) && !metaNames.has(n)) {
            handles.set(o.id, n);
            continue;
        }
        const base = isWord(o.cls) ? o.cls : 'Object';
        let i = next.get(base) ?? 0;
        let h: string;
        do h = `${base}_${++i}`; while (taken.has(h));
        next.set(base, i);
        taken.add(h);
        handles.set(o.id, h);
    }

    const lines: string[] = [];
    const problems: LineProblem[] = [];
    const handle = (id: string): string => handles.get(id)!;
    const writable = (o: TextObject, f: TextFeature): boolean => {
        if (IDENTIFIER.test(f.name)) return true;
        problems.push({ id: o.id, feature: f.name, message: `the feature name ${f.name} is not writable by JjScript yet` });
        return false;
    };

    for (const o of objects) {
        if (!isWord(o.cls)) problems.push({ id: o.id, feature: '', message: `the class name ${o.cls} is not writable by JjScript yet` });
        const c = container.get(o.id);
        const f = c && featuresOf(objects.find(x => x.id === c.owner)!.cls).find(x => x.name === c.feature);
        const into = c && f && writable(o, f) ? ` in ${handle(c.owner)}.${c.feature}` : '';
        lines.push(`create instance of ${o.cls} ${jjscriptString(handle(o.id))}${into}`);
    }
    for (const o of objects) {
        const h = handle(o.id);
        for (const f of featuresOf(o.cls)) {
            if (f.kind !== 'attribute') continue;
            if (isNameFeature(f) && typeof o.slots[f.name] === 'string') {
                // Written also when the handle is the name: `create instance of C "h"` names `data.name` and
                // `initialName`, not the identity slot, which conformance and the XMI export read raw (P-2026-11-07-0253).
                lines.push(`set ${h}.name = ${jjscriptString(o.slots[f.name] as string)}`);
                continue;
            }
            const values = asArray(o.slots[f.name]);
            if (values.length === 0 || !writable(o, f)) continue;
            const literals = mm.enumerations.find(e => e.name === f.type)?.literals;
            const text = f.many ? `[${values.map(v => valueText(v, literals)).join(', ')}]` : valueText(values[0], literals);
            lines.push(`set ${h}.${f.name} = ${text}`);
        }
    }
    for (const o of objects) {
        const h = handle(o.id);
        for (const f of featuresOf(o.cls)) {
            if (f.kind !== 'reference') continue;
            const targets = asArray(o.slots[f.name]).filter((t): t is string => typeof t === 'string' && known.has(t));
            if (targets.length === 0 || !writable(o, f)) continue;
            for (const t of targets) lines.push(`set ${h}.${f.name} ${f.many ? '+=' : '='} ${handle(t)}`);
        }
    }
    return { lines, problems, handles };
}

/** A marker of the «new» mode at `[start, end)` of the text: a parse error, or a value JjScript cannot write. */
export interface TextMarker {
    readonly start: number;
    readonly end: number;
    readonly message: string;
}

/** What the «new» mode reads in a text: its markers, and the lines of the model when nothing blocks the creation. */
export interface NewModelReading {
    readonly text: string;
    readonly markers: readonly TextMarker[];
    /** Null when the text has an error or a value JjScript cannot write (R-TXT-21 (8): a recovered object never runs). */
    readonly lines: readonly string[] | null;
    readonly objects: number;
}

const escapeRegExp = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Where a problem shows: the feature's first mention in its object's text, else the object's keyword. */
function problemRange(text: string, span: ObjectSpan | undefined, feature: string): { start: number; end: number } {
    if (!span) return { start: 0, end: 0 };
    const body = text.slice(span.start, span.end);
    const m = feature ? new RegExp(`(^|[^A-Za-z0-9_])(${escapeRegExp(feature)})(?![A-Za-z0-9_])`).exec(body) : null;
    if (m) {
        const start = span.start + m.index + m[1].length;
        return { start, end: start + feature.length };
    }
    const keyword = /^[^\s{]+/.exec(body);
    return { start: span.start, end: span.start + (keyword ? keyword[0].length : 0) };
}

/** Parses the text of a new model and builds its lines; an error or a problem is a marker, and blocks the lines. */
export function readNewModel(text: string, g: ConcreteGrammar, mm: TextMetamodel): NewModelReading {
    const parsed = parseText(text, g);
    const markers: TextMarker[] = parsed.errors.map(e => ({ start: e.start, end: e.end, message: e.message }));
    if (!isApplicableParse(parsed)) return { text, markers, lines: null, objects: parsed.objects.length };
    const built = modelLines(mm, parsed.objects);
    for (const p of built.problems) markers.push({ ...problemRange(text, parsed.spans.find(s => s.id === p.id), p.feature), message: p.message });
    return { text, markers, lines: built.problems.length > 0 ? null : built.lines, objects: parsed.objects.length };
}

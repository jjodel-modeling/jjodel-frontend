/**
 * origin — the Text host of the templates and the origin of every fragment (slice S2, R-GEN-5, R-GEN-10;
 * spec §5, discovery §B.2-§B.4, U9, U10).
 *
 * `OriginHost` is the `JjelTextHost` a template's context carries, and its `observe` is the context's
 * `readObserver`. Each hole is evaluated through `evaluateHole`, which collects the member reads of that hole and
 * turns its value into a Text by four rules (discovery §B.4):
 * 1. model: the hole is a member read, or one named builtin with literal arguments applied to a member read. The
 *    fragment gets the read's owner and feature, and the builtin's name: `identity` for a bare read; the name for
 *    a character-aligned or a lossy whole-value builtin; the name and the arguments for a sub-range one. The name
 *    is recorded without claiming invertibility (U9). The owner is the object the feature was read on, the last
 *    read of the hole, not the object the navigation starts from;
 * 2. Text: a Text value (a template call, a nested interpolation) is spliced in with its own origins;
 * 3. opaque: anything else, with the set of reads the hole performed (its nested holes included);
 * 4. literal: the text between holes carries its template position, recovered from `tokenize`, because the parts
 *    of an interpolated string carry none (S1).
 * A hole that throws is an error fragment at the hole's template position with the exception's message, and
 * generation goes on; `null` renders '' in a hole, in `+` and in a Text join (U10).
 *
 * Each splice into a hole adds an indentation level with the hole line's leading whitespace (indent.ts).
 * Feature ids come from idlookup through a side table keyed by handle (`WeakMap`): a handle's `id` names its
 * DObject, whose DValues name their features. Strings are never tagged.
 *
 * Pure: JjEL and the engine.
 */

import { JjelTokenType, tokenize } from '../../jjel';
import type { JjelExpression, JjelObject, JjelTextHost, JjelTextPart, JjelValue } from '../../jjel';
import { holePrefixes } from './indent';
import { EMPTY_TEXT, concatTexts, fragment, isText, makeText, renderText } from './text';
import type { FeatureRead, IndentLevel, LiteralOrigin, Origin, Text, TextFragment, Transformation } from './text';

type Lookup = Record<string, any>;

// ── the transformations of §B.3 ──────────────────────────────────────────────

const CHARACTER_ALIGNED = new Set(['toUpper', 'toLower', 'capitalize', 'uncapitalize', 'reverse']);
const SUB_RANGE = new Set(['trim', 'trimStart', 'trimEnd', 'substring', 'slice', 'charAt']);
const LOSSY = new Set(['camelCase', 'pascalCase', 'snakeCase', 'kebabCase', 'padStart', 'padEnd', 'quote']);
/** The string builtins JjEL also reads as a property, `s.toUpper` (evaluator.ts `getProperty`), by their method name. */
const PROPERTY_FORMS: Readonly<Record<string, string>> = {
    toUpper: 'toUpper', toUpperCase: 'toUpper', toLower: 'toLower', toLowerCase: 'toLower',
    trim: 'trim', trimStart: 'trimStart', trimLeft: 'trimStart', trimEnd: 'trimEnd', trimRight: 'trimEnd',
};

const IDENTITY: Transformation = { name: 'identity' };

// ── template sources: positions of holes and literal text ────────────────────

/** A literal text part: its value and the source offset of each of its characters. */
interface LiteralSpan {
    readonly value: string;
    readonly offsets: readonly number[];
}

interface SourceInfo {
    readonly template: string;
    readonly lineStarts: readonly number[];
}

/**
 * The template sources a generation evaluates: for every hole expression its template, for every interpolated
 * string (and a body that is a plain string) the positions of its literal parts. Keyed by AST node, so a lambda
 * written in one template and called from another still reports its own template's positions.
 */
export class TemplateSources {
    private readonly holes = new WeakMap<object, SourceInfo>();
    private readonly strings = new WeakMap<object, { info: SourceInfo; spans: readonly LiteralSpan[] }>();

    /** Registers the AST `expr` of `template`, parsed from `source`. */
    register(template: string, source: string, expr: JjelExpression): void {
        const lineStarts = [0];
        for (let i = 0; i < source.length; i++) if (source[i] === '\n') lineStarts.push(i + 1);
        const info: SourceInfo = { template, lineStarts };
        const seen = new Set<object>();
        const walk = (node: unknown): void => {
            if (node === null || typeof node !== 'object' || seen.has(node)) return;
            seen.add(node);
            if (Array.isArray(node)) {
                node.forEach(walk);
                return;
            }
            const n = node as JjelExpression;
            if (n.type === 'InterpolatedString') {
                this.strings.set(n, { info, spans: literalSpans(source, n) });
                for (const part of n.parts) if (part.kind === 'expression') this.holes.set(part.expr, info);
            }
            for (const [key, value] of Object.entries(n)) if (key !== 'location') walk(value);
        };
        walk(expr);
        if (expr.type === 'Literal' && typeof expr.value === 'string') this.strings.set(expr, { info, spans: literalSpans(source, expr) });
    }

    /** The template position of a hole's expression; `null` for a node no template registered. */
    holePosition(expr: JjelExpression): { template: string; offset: number; line: number; column: number } | null {
        const info = this.holes.get(expr);
        const start = expr.location?.start;
        if (!info || !start) return null;
        return { template: info.template, offset: start.offset ?? 0, line: start.line, column: start.column };
    }

    /** The literal fragments of the `index`-th text part of the string `node`, one per output line. */
    literalFragments(node: JjelExpression, index: number, value: string): TextFragment[] {
        const entry = this.strings.get(node);
        const span = entry?.spans[index];
        if (!entry || !span || span.value !== value) return value === '' ? [] : [fragment(value, { kind: 'literal', template: '', offset: -1, line: 0, column: 0 })];
        const out: TextFragment[] = [];
        let from = 0;
        for (let i = 0; i <= value.length; i++) {
            if (i === value.length || value[i] === '\n') {
                const end = i === value.length ? i : i + 1;
                if (end > from) out.push(fragment(value.slice(from, end), literalOrigin(entry.info, span.offsets[from])));
                from = end;
            }
        }
        return out;
    }
}

function literalOrigin(info: SourceInfo, offset: number): LiteralOrigin {
    let line = 0;
    while (line + 1 < info.lineStarts.length && info.lineStarts[line + 1] <= offset) line++;
    return { kind: 'literal', template: info.template, offset, line: line + 1, column: offset - info.lineStarts[line] + 1 };
}

/**
 * The literal parts of the string literal `node` in `source`, in AST order: its own source lexed again with the
 * `interpolation` option, its text tokens up to the closing quote, the empty ones dropped as the parser drops them.
 * The first token starts at the opening quote, the others right after a hole's `}`; an escape is two source
 * characters for one of the value.
 */
function literalSpans(source: string, node: JjelExpression): LiteralSpan[] {
    const start = node.location?.start.offset;
    const end = node.location?.end.offset;
    if (start === undefined || end === undefined) return [];
    const { tokens } = tokenize(source.slice(start, end), { interpolation: true });
    const spans: LiteralSpan[] = [];
    for (let i = 0; i < tokens.length; i++) {
        const tok = tokens[i];
        if (tok.type !== JjelTokenType.STRING_PART && tok.type !== JjelTokenType.STRING) continue;
        if (tok.value !== '') {
            const offsets: number[] = [];
            let at = start + tok.start + (i === 0 ? 1 : 0);
            for (let k = 0; k < tok.value.length; k++) {
                offsets.push(at);
                at += source[at] === '\\' ? 2 : 1;
            }
            spans.push({ value: tok.value, offsets });
        }
        if (tok.type === JjelTokenType.STRING) break;
    }
    return spans;
}

// ── the host ─────────────────────────────────────────────────────────────────

interface Read {
    readonly target: JjelObject;
    readonly property: string;
    readonly value: JjelValue;
}

/** The property a member read names: `o.p`, `o?.p`, or the dual form `o.p()`; `null` for anything else. */
function readName(expr: JjelExpression): string | null {
    if (expr.type === 'MemberAccess' || expr.type === 'NullSafeMemberAccess') return expr.property;
    if ((expr.type === 'MethodCall' || expr.type === 'NullSafeMethodCall') && expr.args.length === 0) return expr.method;
    return null;
}

/** A literal argument's value: a literal, or `-` before a number literal; `undefined` for anything else. */
function literalValue(expr: JjelExpression): string | number | boolean | null | undefined {
    if (expr.type === 'Literal') return expr.value;
    if (expr.type === 'Unary' && expr.operator === '-' && expr.operand.type === 'Literal' && typeof expr.operand.value === 'number') return -expr.operand.value;
    return undefined;
}

/** A named builtin of §B.3 applied with literal arguments: its transformation and its receiver expression. */
function namedBuiltin(expr: JjelExpression): { transformation: Transformation; receiver: JjelExpression } | null {
    if (expr.type === 'MethodCall' || expr.type === 'NullSafeMethodCall') {
        const name = expr.method;
        if (!CHARACTER_ALIGNED.has(name) && !SUB_RANGE.has(name) && !LOSSY.has(name)) return null;
        const args = expr.args.map(literalValue);
        if (args.some(a => a === undefined)) return null;
        return { transformation: SUB_RANGE.has(name) ? { name, args: args as (string | number | boolean | null)[] } : { name }, receiver: expr.object };
    }
    if ((expr.type === 'MemberAccess' || expr.type === 'NullSafeMemberAccess') && Object.prototype.hasOwnProperty.call(PROPERTY_FORMS, expr.property)) {
        const name = PROPERTY_FORMS[expr.property];
        return { transformation: SUB_RANGE.has(name) ? { name, args: [] } : { name }, receiver: expr.object };
    }
    return null;
}

/** JjEL's rendering of a value in a hole (evaluator.ts `stringify`), for what is not a Text. */
function plain(value: JjelValue): string {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(plain).join(', ');
    try {
        return JSON.stringify(value) ?? '';
    } catch {
        return '[Object]';
    }
}

const opaque = (text: string, reads: readonly FeatureRead[] = []): Text =>
    (text === '' ? EMPTY_TEXT : makeText([fragment(text, { kind: 'opaque', reads })]));

export class OriginHost implements JjelTextHost {
    /** The reads of the holes being evaluated, innermost last. */
    private readonly frames: Read[][] = [];
    private readonly features = new WeakMap<object, Map<string, string>>();
    private nextLevel = 1;

    constructor(private readonly lookup: Lookup, private readonly sources: TemplateSources) {}

    /** The `readObserver` of the template context: records the read in the hole being evaluated. */
    readonly observe = (target: JjelObject, property: string, value: JjelValue): void => {
        this.frames[this.frames.length - 1]?.push({ target, property, value });
    };

    isText(value: JjelValue): boolean {
        return isText(value);
    }

    evaluateHole(expr: JjelExpression, evaluate: () => JjelValue): JjelValue {
        const reads: Read[] = [];
        this.frames.push(reads);
        let value: JjelValue = null;
        let failure: { error: unknown } | null = null;
        try {
            value = evaluate();
        } catch (error) {
            failure = { error };
        } finally {
            this.frames.pop();
            this.frames[this.frames.length - 1]?.push(...reads);
        }
        const text = failure ? this.errorText(expr, failure.error) : this.attribute(value, expr, reads);
        return text as unknown as JjelValue;
    }

    interpolate(parts: JjelTextPart[], expr: JjelExpression): JjelValue {
        const prefixes = holePrefixes(parts.map(p => (p.kind === 'text' ? p : { kind: 'hole' as const })));
        const fragments: TextFragment[] = [];
        let textIndex = 0;
        let holeIndex = 0;
        for (const part of parts) {
            if (part.kind === 'text') {
                fragments.push(...this.sources.literalFragments(expr, textIndex++, part.value));
            } else {
                const level: IndentLevel = { id: this.nextLevel++, prefix: prefixes[holeIndex++] };
                for (const f of this.toText(part.value).fragments) fragments.push(fragment(f.text, f.origin, [level, ...f.indent]));
            }
        }
        return makeText(fragments) as unknown as JjelValue;
    }

    concat(left: JjelValue, right: JjelValue): JjelValue {
        return concatTexts([this.toText(left), this.toText(right)]) as unknown as JjelValue;
    }

    join(items: JjelValue[], separator: JjelValue): JjelValue {
        return this.joinTexts(items.map(v => this.toText(v)), this.toText(separator)) as unknown as JjelValue;
    }

    stringify(text: JjelValue): string {
        return isText(text) ? renderText(text).code : plain(text);
    }

    /** A value where a Text is wanted, outside a hole: a Text as is, anything else opaque with no read. */
    toText(value: JjelValue): Text {
        if (isText(value)) return value;
        if (Array.isArray(value)) return value.some(v => isText(v)) ? this.joinTexts(value.map(v => this.toText(v)), opaque(', ')) : opaque(plain(value));
        return opaque(plain(value));
    }

    /** The error fragment of a hole that threw. */
    errorText(expr: JjelExpression, error: unknown): Text {
        const at = this.sources.holePosition(expr) ?? { template: '', offset: -1, line: 0, column: 0 };
        const message = error instanceof Error ? error.message : String(error);
        return makeText([fragment('', { kind: 'error', ...at, message })]);
    }

    private joinTexts(items: readonly Text[], separator: Text): Text {
        const parts: Text[] = [];
        items.forEach((t, i) => {
            if (i > 0) parts.push(separator);
            parts.push(t);
        });
        return concatTexts(parts);
    }

    /** The Text of a hole's value, by the rules of §B.4. */
    private attribute(value: JjelValue, expr: JjelExpression, reads: readonly Read[]): Text {
        if (isText(value)) return value;
        if (value === null || value === undefined) return EMPTY_TEXT;
        if (Array.isArray(value) && value.some(v => isText(v))) return this.toText(value);
        const text = plain(value);
        if (text === '') return EMPTY_TEXT;
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            const model = this.modelOrigin(value, expr, reads);
            if (model) return makeText([fragment(text, model)]);
        }
        return opaque(text, this.featureReads(reads));
    }

    /** Rule 1: a member read, or a named builtin with literal arguments on one; the owner is the last read's target. */
    private modelOrigin(value: JjelValue, expr: JjelExpression, reads: readonly Read[]): Origin | null {
        const last = reads[reads.length - 1];
        if (!last) return null;
        let transformation: Transformation | null = null;
        if (readName(expr) === last.property && last.value === value) {
            transformation = IDENTITY;
        } else {
            const applied = namedBuiltin(expr);
            if (applied && readName(applied.receiver) === last.property && typeof last.value === 'string') transformation = applied.transformation;
        }
        if (!transformation) return null;
        const read = this.featureRead(last);
        return read ? { kind: 'model', ...read, transformation } : null;
    }

    /** The reads of a hole on model elements, once each, in order. */
    private featureReads(reads: readonly Read[]): FeatureRead[] {
        const out: FeatureRead[] = [];
        const seen = new Set<string>();
        for (const r of reads) {
            const read = this.featureRead(r);
            if (!read) continue;
            const key = read.elementId + '\u0000' + read.featureName;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(read);
        }
        return out;
    }

    /** A read on a handle: its id, and the feature id idlookup gives the property on that object (`null` when none). */
    private featureRead(read: Read): FeatureRead | null {
        const id = (read.target as Record<string, unknown>).id;
        if (typeof id !== 'string' || id === '') return null;
        let table = this.features.get(read.target);
        if (!table) {
            table = featureTable(this.lookup, id);
            this.features.set(read.target, table);
        }
        return { elementId: id, feature: table.get(read.property) ?? null, featureName: read.property };
    }
}

/** Feature name to feature id for the DObject `id`: its DValues and the features they are instances of. A later slot wins, as on the handle. */
function featureTable(lookup: Lookup, id: string): Map<string, string> {
    const table = new Map<string, string>();
    const features = lookup[id]?.features;
    if (!Array.isArray(features)) return table;
    for (const vid of features) {
        const featureId = typeof vid === 'string' ? lookup[vid]?.instanceof : undefined;
        const name = typeof featureId === 'string' ? lookup[featureId]?.name : undefined;
        if (typeof name === 'string' && name) table.set(name, featureId);
    }
    return table;
}

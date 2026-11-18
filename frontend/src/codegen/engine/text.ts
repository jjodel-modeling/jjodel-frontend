/**
 * text — the Text value of the code generator (slice S2, R-GEN-4, R-GEN-5; spec §4, §5).
 *
 * A template's result is not a string: it is a sequence of fragments, each with its origin. Four kinds:
 * - `literal`: text of the template itself, with its position (template name, offset, line, column);
 * - `model`: a value copied from a model element, with the triple (element id, feature, transformation);
 * - `opaque`: a value built from the model in a way no transformation names, with the reads it was built from;
 * - `error`: a hole that could not be evaluated; it writes nothing and carries the hole's position and message.
 *
 * A Text is frozen and only this module builds one (`isText` answers for those alone), so a JjEL object that looks
 * like a Text is not one. Rendering forgets the origins in `code` and keeps them in `map`: per output line, the
 * column ranges each fragment wrote. Block indentation is applied here, at render time (indent.ts): each fragment
 * carries the indentation levels of the holes it was interpolated into, outermost first.
 *
 * Each Text carries its length, and a `GenerationBudget` bounds a generation's time and output (S7, R-GEN-28).
 *
 * Pure: no import outside the engine.
 */

import { layoutFragments } from './indent';

/** A literal argument of a named transformation, as the template wrote it. */
export type OriginValue = string | number | boolean | null;

/** What was applied to a model value: `identity`, or a named builtin with its literal arguments (sub-range ones). */
export interface Transformation {
    readonly name: string;
    readonly args?: readonly OriginValue[];
}

/** A position in a template's source: 0-based offset, 1-based line and column. */
export interface TemplatePosition {
    readonly template: string;
    readonly offset: number;
    readonly line: number;
    readonly column: number;
}

/** One feature read: the element that owns it, the feature's id from idlookup (`null` when not a feature), its name. */
export interface FeatureRead {
    readonly elementId: string;
    readonly feature: string | null;
    readonly featureName: string;
}

export interface LiteralOrigin extends TemplatePosition { readonly kind: 'literal' }
/** `template`, on a model and an opaque origin, is the template of the hole that wrote it (R-GEN-41); absent when unknown. */
export interface ModelOrigin extends FeatureRead { readonly kind: 'model'; readonly transformation: Transformation; readonly template?: string }
export interface OpaqueOrigin { readonly kind: 'opaque'; readonly reads: readonly FeatureRead[]; readonly template?: string }
export interface ErrorOrigin extends TemplatePosition { readonly kind: 'error'; readonly message: string }
export type Origin = LiteralOrigin | ModelOrigin | OpaqueOrigin | ErrorOrigin;

/** The indentation one hole adds: `prefix` goes before each later line of the hole's value. `id` tells holes apart. */
export interface IndentLevel {
    readonly id: number;
    readonly prefix: string;
}

export interface TextFragment {
    readonly kind: Origin['kind'];
    readonly text: string;
    readonly origin: Origin;
    /** The levels of the holes this fragment was interpolated into, outermost first. */
    readonly indent: readonly IndentLevel[];
}

export interface Text {
    readonly __type: 'Text';
    readonly fragments: readonly TextFragment[];
}

/** One output range: line 1-based, `start` and `end` 0-based columns, `end` excluded. An error fragment is zero-width. */
export interface TextMapEntry {
    readonly line: number;
    readonly start: number;
    readonly end: number;
    readonly fragment: TextFragment;
    readonly origin: Origin;
}

export interface RenderedText {
    readonly code: string;
    readonly map: readonly TextMapEntry[];
}

/** Every Text this module built, with its length: the characters of its fragments, before indentation. */
const TEXTS = new WeakMap<object, number>();

export function fragment(text: string, origin: Origin, indent: readonly IndentLevel[] = []): TextFragment {
    return Object.freeze({ kind: origin.kind, text, origin: Object.freeze(origin), indent: Object.freeze([...indent]) });
}

export function makeText(fragments: readonly TextFragment[]): Text {
    const text: Text = Object.freeze({ __type: 'Text' as const, fragments: Object.freeze([...fragments]) });
    let length = 0;
    for (const f of fragments) length += f.text.length;
    TEXTS.set(text, length);
    return text;
}

export const EMPTY_TEXT: Text = makeText([]);

export function isText(value: unknown): value is Text {
    return typeof value === 'object' && value !== null && TEXTS.has(value);
}

/** The characters of a Text's fragments, summed when it was built; 0 for anything else. */
export function textLength(text: Text): number {
    return TEXTS.get(text) ?? 0;
}

// ── the budget of a generation (R-GEN-28) ────────────────────────────────────

/** The limits of one generation; each absent field takes its default. `now` is the clock, in milliseconds. */
export interface GenerationLimits {
    readonly timeMs?: number;
    readonly maxChars?: number;
    readonly now?: () => number;
}

export const DEFAULT_GENERATION_TIME_MS = 2000;
export const DEFAULT_GENERATION_MAX_CHARS = 1_000_000;

/** Where a generation stopped and why: the one error `generate` reports. */
export interface GenerationStop extends TemplatePosition {
    readonly message: string;
}

const UNPLACED: TemplatePosition = { template: '', offset: 0, line: 1, column: 1 };

const thousands = (n: number): string => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

/**
 * The time and output budget of one generation, sticky (discovery 2026-10-23 §4.2). Checkpoints: `checkpoint` at
 * each template call and each hole, for the time; `measure` on each Text the host builds and after each call, for
 * the output. The first one over a limit trips the budget and throws; from then on every checkpoint throws the
 * same error at once, so the `catch` of a hole cannot let evaluation go on. Cooperative: a step with no call and
 * no hole runs to its end. `enter` and `leave` keep the innermost call or hole, where an output trip is placed.
 */
export class GenerationBudget {
    readonly timeMs: number;
    readonly maxChars: number;
    private readonly now: () => number;
    private readonly started: number;
    private readonly where: TemplatePosition[] = [];
    private stopped: { stop: GenerationStop; error: Error } | null = null;

    constructor(limits: GenerationLimits = {}) {
        this.timeMs = limits.timeMs ?? DEFAULT_GENERATION_TIME_MS;
        this.maxChars = limits.maxChars ?? DEFAULT_GENERATION_MAX_CHARS;
        this.now = limits.now ?? (() => performance.now());
        this.started = this.now();
    }

    /** The stop, once the budget tripped; `null` before. */
    get stop(): GenerationStop | null {
        return this.stopped?.stop ?? null;
    }

    /** Throws the stop if the budget tripped. */
    rethrow(): void {
        if (this.stopped) throw this.stopped.error;
    }

    /** The time checkpoint of a call or hole at `at`. */
    checkpoint(at: TemplatePosition): void {
        this.rethrow();
        if (this.now() - this.started > this.timeMs) {
            this.trip(at, `Generation stopped after ${this.timeMs} ms: template '${at.template}' was still running`);
        }
    }

    /** The output checkpoint: `text` as is, or a trip when it passes the bound. */
    measure(text: Text): Text {
        this.rethrow();
        if (textLength(text) > this.maxChars) {
            this.trip(this.where[this.where.length - 1] ?? UNPLACED, `Generation stopped: the output passed ${thousands(this.maxChars)} characters`);
        }
        return text;
    }

    enter(at: TemplatePosition): void {
        this.where.push(at);
    }

    leave(): void {
        this.where.pop();
    }

    private trip(at: TemplatePosition, message: string): never {
        const error = new Error(message);
        this.stopped = { stop: { template: at.template, offset: at.offset, line: at.line, column: at.column, message }, error };
        throw error;
    }
}

/** The Texts one after the other. */
export function concatTexts(texts: readonly Text[]): Text {
    return makeText(texts.flatMap(t => t.fragments));
}

/** The error origins of a Text, in order. */
export function textErrors(text: Text): ErrorOrigin[] {
    return text.fragments.flatMap(f => (f.origin.kind === 'error' ? [f.origin] : []));
}

export function renderText(text: Text): RenderedText {
    const pieces = layoutFragments(text.fragments);
    let code = '';
    const map: TextMapEntry[] = [];
    let line = 1;
    let column = 0;
    for (const piece of pieces) {
        code += piece.text;
        if (piece.text === '\n') {
            line++;
            column = 0;
            continue;
        }
        if (piece.fragment !== null) {
            const f = text.fragments[piece.fragment];
            map.push({ line, start: column, end: column + piece.text.length, fragment: f, origin: f.origin });
        }
        column += piece.text.length;
    }
    return { code, map };
}

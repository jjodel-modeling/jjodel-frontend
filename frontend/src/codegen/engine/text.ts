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
export interface ModelOrigin extends FeatureRead { readonly kind: 'model'; readonly transformation: Transformation }
export interface OpaqueOrigin { readonly kind: 'opaque'; readonly reads: readonly FeatureRead[] }
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

const TEXTS = new WeakSet<object>();

export function fragment(text: string, origin: Origin, indent: readonly IndentLevel[] = []): TextFragment {
    return Object.freeze({ kind: origin.kind, text, origin: Object.freeze(origin), indent: Object.freeze([...indent]) });
}

export function makeText(fragments: readonly TextFragment[]): Text {
    const text: Text = Object.freeze({ __type: 'Text' as const, fragments: Object.freeze([...fragments]) });
    TEXTS.add(text);
    return text;
}

export const EMPTY_TEXT: Text = makeText([]);

export function isText(value: unknown): value is Text {
    return typeof value === 'object' && value !== null && TEXTS.has(value);
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

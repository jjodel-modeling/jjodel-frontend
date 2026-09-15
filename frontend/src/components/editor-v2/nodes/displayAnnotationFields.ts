/**
 * displayAnnotationFields — which Display fields an attribute may carry.
 *
 * Its own module, and not a helper inside `DisplayAnnotations.tsx`, for the
 * reason `rowViewAnnotationsWrite.ts` was split off in the first place: the
 * component imports the write path, the write path imports the joiner barrel,
 * and the barrel pulls in Monaco, which dereferences `window` at import time.
 * Anything reachable from there is unloadable under the `node` test
 * environment. The deciding stays pure and testable on this side of the line.
 *
 * The gating is a statement about the METAMODEL type, not about a value:
 *
 *   - a unit and a pair of bounds only mean something on a number. `jjodel/unit`
 *     rides on `numberUnit` and `progress`, and both bounds are what chooses
 *     between them (`valueRenderer.ts`, `decide('progress')`);
 *   - the monospace treatment only means something on text. On a number it
 *     would fight the numeric renderer for the same declaration, and on a
 *     boolean or a date there is nothing to set in monospace;
 *   - the multiline box only means something on text, and for the SAME reason,
 *     which is why it rides the same `textual` reading rather than a second one.
 *     A toggle offered on an `EInt` would promise a width the ladder refuses to
 *     give it: `widthOf` gates rung 2b on the string/unknown floor, and a control
 *     that can be switched on with no effect is worse than one that is absent.
 *
 * Anything that is not a number, a boolean, a date, a declared colour or an
 * enumeration counts as text here. That is deliberately the wide reading: a
 * user-defined datatype with no other rule is a string as far as the Row view
 * library is concerned, and `truncatedText` is the library's floor.
 */

import { RENDERER_WIDTH_KIND } from '../../../jjform/layout';
import { isBooleanType, isColorType, isDateType, isNumericType } from './valueRenderer';

export interface DisplayFieldGating {
    /** `jjodel/unit` — numeric types only. */
    unit: boolean;
    /** `jjodel/min` and `jjodel/max` — numeric types only. */
    bounds: boolean;
    /** `jjodel/renderer=code` — text types only. */
    code: boolean;
    /** `jjodel/multiline=true` — text types only, same reading as `code`. */
    multiline: boolean;
}

export function displayFieldsFor(typeName: string | undefined, hasEnumLiterals: boolean): DisplayFieldGating {
    const numeric = isNumericType(typeName);
    const textual = !numeric
        && !isBooleanType(typeName)
        && !isDateType(typeName)
        && !isColorType(typeName)
        && !hasEnumLiterals;
    return { unit: numeric, bounds: numeric, code: textual, multiline: textual };
}

/**
 * The renderer that takes the width decision away from a `multiline` declaration,
 * or null when none does.
 *
 * The two toggles are NOT mutually exclusive and the UI does not pretend they are:
 * both may be on, both are written, and neither erases the other. What the reader
 * needs is the one fact the panel would otherwise hide — that at rung 2 the
 * renderer is read first, so with `renderer=code` declared the box stays at span 6
 * whatever `multiline` says. Informing, not forbidding.
 *
 * Read off `RENDERER_WIDTH_KIND` rather than spelled `=== 'code'`: that map IS the
 * set of renderers that settle a width, so a sixth entry there cannot leave this
 * hint behind. A renderer the map does not name (`enumChip`, `progress`, or one
 * nobody knows) settles no width, falls through, and overrides nothing.
 */
export function multilineOverriddenBy(renderer: string | undefined): string | null {
    if (!renderer) return null;
    return RENDERER_WIDTH_KIND[renderer] ? renderer : null;
}

/** True when the group would render no editable field at all. */
export function hasNoDisplayFields(gating: DisplayFieldGating): boolean {
    return !gating.unit && !gating.bounds && !gating.code && !gating.multiline;
}

/**
 * What to do with what the user typed into a bound field.
 *
 * Three outcomes and not two, because empty and unparseable are different
 * intentions. An empty field is the absence of a declaration and NOT a
 * declaration of the empty string — `parseRowViewAnnotations` drops a bound that
 * is not finite, so `jjodel/min=` would sit in the model looking exactly like a
 * bound somebody set while parsing to nothing. Half-typed garbage is neither:
 * clearing on it would delete a good declaration the moment the user typed a
 * minus sign, so it is left alone until it parses or empties.
 */
export type FieldCommit =
    | { action: 'clear' }
    | { action: 'write'; value: number | string }
    | { action: 'ignore' };

export function boundToWrite(raw: string): FieldCommit {
    const trimmed = raw.trim();
    if (trimmed === '') return { action: 'clear' };
    const n = Number(trimmed);
    return Number.isFinite(n) ? { action: 'write', value: n } : { action: 'ignore' };
}

/** Same rule for the unit, minus the parse: blank clears, anything else writes. */
export function unitToWrite(raw: string): FieldCommit {
    const trimmed = raw.trim();
    return trimmed === '' ? { action: 'clear' } : { action: 'write', value: trimmed };
}

/**
 * symbolRecognition - where the authored axes sit in the catalog space (D14).
 *
 * The semantic identity of a symbol is DERIVED by comparing the authored axes
 * against the catalog, never stored: a preset stays a value, not a type (D10).
 * The equivalence relation is the exact mirror of `applyPresetToShape`:
 *
 * - counted: `form`; `border.style` and `border.width` (defaults solid and 1,
 *   both for the view and for the preset); `marker`, where a preset that does
 *   not declare one requires its ABSENCE (applying such a preset removes it);
 *   `fill` only when the preset declares it (it is the symbol's semantics).
 * - ignored: the border color, the fill on presets that do not declare one,
 *   labels, badges, text style. These are exactly what a preset preserves.
 *
 * A conditional axis does not force a global "custom": it only fails the
 * comparisons where that axis counts. A view whose fill is conditional still
 * recognizes as Start event, because applying Start event would preserve that
 * fill untouched.
 *
 * The result is a SET, not an element: the catalog is declaredly a
 * many-to-many index over the axis space. A bare diamond is Choice (UML),
 * Decision (Flowchart) and Relationship (ER) at once; a circle with the dot
 * marker is both Final state and Marked place. Callers display the first
 * match in catalog order and the rest as a tail.
 *
 * "Modified from X" is intentionally NOT derivable here: Start event and End
 * event coincide on form and marker and differ only on the border width, so
 * nearest-match is ill-defined. That state exists only as ephemeral picker
 * state after an application, and belongs to the modal slice (D15).
 *
 * Pure module: no React, no Redux, no runtime imports from editor-v2.
 */

import type { Conditional, ShapeSpec } from './irTypes';
import { NOTATION_CATALOG, type SymbolPreset } from './notationCatalog';

/** Sentinel for a conditional axis: never equal to any scalar requirement. */
const CONDITIONAL: unique symbol = Symbol('conditional');

/**
 * Scalar value of a conditional axis, or the sentinel when it is authored as
 * a conditional. Every axis this module compares is a primitive, so "object"
 * can only be the conditional wrapper ({when,then} or {rules}).
 */
function scalarOf<T>(v: Conditional<T> | undefined): T | undefined | typeof CONDITIONAL {
    if (v !== null && typeof v === 'object') return CONDITIONAL;
    return v as T | undefined;
}

/** '' and undefined both mean "no marker" / "no fill" (CompiledView convention). */
function absent(v: unknown): boolean {
    return v === undefined || v === '';
}

/**
 * Every catalog preset whose written axes coincide with the authored ones,
 * in catalog order. Empty array = custom symbol.
 */
export function recognizeSymbol(shape: ShapeSpec): readonly SymbolPreset[] {
    const form = scalarOf(shape.form);
    const style = shape.border?.style ?? 'solid';
    const width = shape.border?.width ?? 1;
    const marker = scalarOf(shape.marker);
    const fill = scalarOf(shape.fill);

    return NOTATION_CATALOG.filter((p) => {
        if (p.values.form !== form) return false;
        if ((p.values.border?.style ?? 'solid') !== style) return false;
        if ((p.values.border?.width ?? 1) !== width) return false;
        if (p.values.marker) {
            if (marker !== p.values.marker) return false;
        } else if (!absent(marker)) return false;
        if (p.values.fill !== undefined && fill !== p.values.fill) return false;
        return true;
    });
}

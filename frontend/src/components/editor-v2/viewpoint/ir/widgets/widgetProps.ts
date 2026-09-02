/**
 * widgetProps — the one call signature every extended widget answers to.
 *
 * A registry is only usable if its entries are interchangeable: FL4 looks a name up
 * and renders what comes back, without a switch that knows which component wants
 * which props. So the six components of FL3 share this bag and destructure what they
 * need, exactly as the shape and marker registries of this directory hold entries of
 * one shape and let the renderer stay ignorant of which one it drew.
 *
 * `widget` is the discriminator, and it is the registry NAME the component was
 * resolved under — which is why three components serve nine names: `date`/`datetime`
 * differ by a control type, `textarea`/`richtext` by nothing at all yet, and the
 * chip input serves one name with two variants. Passing the name back in is what
 * lets a component serve more than one entry without the registry holding partial
 * applications of it.
 *
 * Import-free by design, `react` aside: see `formWidgets.scss`'s companion note and
 * the header of `widgets/index.ts`. Nothing here reaches `ui/` or `joiner/`.
 */

import type { DurationUnit } from '../../../../../jjform';

/** One entry of a chip input: the model's key, and the text the chip shows. */
export interface WidgetChip {
    /** Removal address. A value's index for an attribute, a pointer id for a reference. */
    readonly key: string;
    /** Already resolved by the host — a widget never reads the L layer to find a name. */
    readonly label: string;
    /** The pointer no longer resolves. Drawn as the read side draws it: not navigable. */
    readonly broken?: boolean;
    /**
     * Colour slot of this value among the field's OPTIONS, 1-based, or absent when the
     * value is not one of them (a dangling pointer, an emptied offer).
     *
     * Resolved by the host, like the label and for the same rule: a widget here never
     * reads the L layer, and the option list is the host's. `jjform/optionColor.ts`
     * owns the assignment and the reason it cycles.
     */
    readonly slot?: number;
}

export interface ExtendedWidgetProps {
    /** The registry name this widget was resolved under. See the module comment. */
    widget: string;

    /** Single-valued: the slot's value as a string. `''` when the slot is empty. */
    value?: string;
    /** Multivalued: one chip per entry, labelled by the host. */
    chips?: readonly WidgetChip[];

    /** A scalar write. The string is what the model stores and what the Row view reads. */
    onCommit?: (next: string) => void;
    /** Remove one chip, by its own key and by its position in the raw array — the
     *  same pair `ListWidget` passes, and for its reason: `clearSlotValue` blanks a
     *  position rather than splicing it, so the index is the address. */
    onRemove?: (key: string, index: number) => void;
    /** Append a typed value. The tag variant of the chip input only. */
    onAppend?: (text: string) => void;
    /**
     * The reference variant's Add: the widget does not open the picker, it asks.
     * `ReferencePicker` reaches `joiner/` through `ReferenceWidget.metaclassLetter`,
     * which makes it unloadable in a node test; keeping the popover on the host side
     * is what lets every widget here stay testable. The rect is the anchor.
     */
    onRequestAdd?: (anchor: DOMRect) => void;

    /** Declared unit of a duration, from `jjodel/unit` and from nowhere else — the
     *  rule the read side states three times and this side must not break. */
    unit?: DurationUnit;
    /**
     * The read side's own `toCssColor`, handed in rather than restated.
     *
     * `jjform/` cannot import `components/`, so the colour vocabulary (148 CSS names,
     * four functional notations, the `0x` form) stays where it is and the FORM asks
     * the row how to paint. Absent: the widget falls back to the hex forms it can
     * canonicalise on its own.
     */
    toCss?: (raw: string) => string | null;

    /** The chip input is full: Add stays visible and refuses, with the reason. */
    atUpperBound?: boolean;
    upperBound?: number;

    readOnly?: boolean;
    /** A diagnostic of severity `error` sits on this field. */
    invalid?: boolean;
    id?: string;
    /** Accessible name: the visible label lives in the field's label row, not here. */
    ariaLabel?: string;
}

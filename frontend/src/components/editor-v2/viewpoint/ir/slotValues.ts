/**
 * slotValues — reading the values of a DValue slot, without the L-layer padding.
 *
 * Two functions, in their own module for one reason: they are the only part of the form
 * write/derive pair that must stay reachable WITHOUT the framework barrel. `formWrite`
 * imports `../../../../joiner`, which transitively pulls Monaco, which touches `window`
 * at import time and therefore cannot be loaded by a node-environment unit test (the
 * known "window is not defined" class of import failures in this suite). Keeping these
 * here lets `useFormWidgets` — the module the derivation tests actually exercise — stay
 * barrel-free, the same reason `conformanceToProblems` was split out of its producer.
 */

/** An L-proxy over a DValue. Typed loosely: the L layer is untyped at these call sites. */
type SlotProxy = any;

/**
 * Raw values of a slot, without the L-layer padding.
 *
 * The `.values` getter pads the array with `undefined` up to `lowerBound`, which is why a
 * `[1..1]` reference that has never been set reads as length 1. Counting on it makes an
 * empty required field look full — exactly the "Required empty" state the form has to be
 * able to show. `__raw.values` is the unpadded array. The same padding once made new
 * composition targets land at index 1 instead of 0; see the comment in
 * canvasToJjom.syncCreateCompositionLink.
 */
export function rawValues(slot: SlotProxy): unknown[] {
    const v = slot?.__raw?.values;
    return Array.isArray(v) ? v : [];
}

/** Values that actually carry something — the count the multiplicity marker reports and
 *  the upper-bound gate of the Add control tests. */
export function meaningfulValues(slot: SlotProxy): unknown[] {
    return rawValues(slot).filter(v => v != null && v !== '');
}

/** One option group of a select-like widget. Structurally identical to
 *  `useFormWidgets.FormFieldOptionGroup`, restated here so this module stays free of any
 *  import that could drag the framework barrel in. */
interface OptionGroup { label: string; options: { value: string; label: string }[] }

/**
 * Candidates still assignable to a multivalued reference: the declared options minus the ids
 * the slot already holds.
 *
 * A multivalued reference is a SET, not a bag - `unique` is EMF's default - so offering an
 * element that is already in the list puts a duplicate one click away, and nothing downstream
 * would object to it. Measured on the fixture: the Add popover of `outgoing` listed `stop` and
 * `fault` while both were already assigned.
 *
 * Lives here, and not next to the widget that uses it, for the reason this module exists at
 * all: `ListWidget` reaches the joiner barrel through `ReferenceWidget`, so a node test that
 * imported it would die on `window is not defined` before running an assertion. Verified, not
 * assumed.
 *
 * Holes in `taken` are ignored: `undefined` is not a taken id.
 */
export function assignableOptions(options: OptionGroup[], taken: readonly unknown[]): OptionGroup[] {
    const used = new Set(taken.filter(v => typeof v === 'string') as string[]);
    if (used.size === 0) return options;
    const out: OptionGroup[] = [];
    for (const g of options) {
        const left = g.options.filter(o => !used.has(o.value));
        // A group with nothing left is dropped whole: an empty heading would suggest the group
        // is there but empty, which is not the same as "all of them are already assigned".
        if (left.length) out.push({ label: g.label, options: left });
    }
    return out;
}

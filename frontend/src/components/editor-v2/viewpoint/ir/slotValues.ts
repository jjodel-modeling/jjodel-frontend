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

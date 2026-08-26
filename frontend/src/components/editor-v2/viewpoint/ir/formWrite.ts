/**
 * formWrite — the single write path of the form rendering of a view.
 *
 * Every mutation a form field performs goes through here, and here goes through
 * `LValue`: `setValueAtPosition` for a set or a clear, `SetFieldAction` with '+='
 * for an append. That is NOT a second write path next to the canvas one — it is the
 * same path one step lower. `canvasToJjom.syncUpdateFeatureValue`, which the inline
 * row editing of IRNodeContent uses, resolves `lObject['$feature'].value = v`, and
 * that assignment routes through `LValue.set_value` into the very same
 * `setValueAtPosition`. The form needs the lower step for three reasons measured in
 * docs/discovery/discovery_2026-08-26_form_views_slice1.md finding 2:
 *
 *  - `syncUpdateFeatureValue` is keyed by DVertex id, and the rail's subject may have
 *    no vertex at all (selected in the tree, graph closed, object off-canvas);
 *  - it writes `.value`, i.e. position 0 only, so no multivalued feature is reachable;
 *  - it has no append and no clear.
 *
 * The same lower step is what the classic properties panel (Info.tsx) and the JjTL
 * executor (ProjectEditor.tsx) already use, so this module adds no new idiom.
 *
 * `U.isProjectModified` is set here, and only on a real change. Both commit paths of
 * a form field also fire on blur, so leaving a field untouched reaches these functions
 * with an unchanged value; flagging the project dirty for an edit that edited nothing
 * produces an unjustified exit warning. Same rule, same reason, as IRNodeContent's
 * commitRowEdit.
 */

import { LPointerTargetable, SetFieldAction, TRANSACTION, U } from '../../../../joiner';
import { rawValues } from './slotValues';

/** An L-proxy over a DValue. Typed loosely on purpose: the L layer is untyped at the
 *  call sites this module serves, and narrowing here would only move the casts. */
type SlotProxy = any;

/** True when `a` and `b` are the same slot value. Pointers and primitives both land
 *  here, and the D layer stores both as strings, so identity is enough. */
function sameValue(a: unknown, b: unknown): boolean {
    if (a == null && b == null) return true;
    return a === b;
}

/**
 * Write `value` at `index` of the slot.
 *
 * `isPtr` says whether the value is a pointer to another element (reference, enum
 * literal) rather than a primitive: `setValueAtPosition` needs it to decide how to
 * reconcile the old target. Pass `undefined` to let the callee infer it, which is what
 * the shapeless case does.
 *
 * Returns true when something actually changed.
 */
export function setSlotValue(
    slot: SlotProxy,
    index: number,
    value: string | number | boolean | null | undefined,
    isPtr?: boolean,
): boolean {
    if (!slot) return false;
    const before = rawValues(slot)[index];
    if (sameValue(before, value)) return false;
    try {
        TRANSACTION(`form set ${slot.name ?? 'value'}`, () => {
            // Re-wrap against the current state before writing: a proxy captured on a
            // previous render may be stale. Same guard Info.tsx takes before each write.
            const fresh = slot.r ?? slot;
            fresh.setValueAtPosition(index, value, { isPtr });
        });
    } catch (err) {
        console.warn('[formWrite] setSlotValue failed', { index, value, err });
        return false;
    }
    U.isProjectModified = true;
    return true;
}

/**
 * Clear the value at `index` (the `x` of a list row, the empty option of a select).
 * Writing `undefined` is how the D layer spells "no value"; it is not the same as
 * removing the position, which the L layer does not expose per-index.
 */
export function clearSlotValue(slot: SlotProxy, index: number, isPtr?: boolean): boolean {
    if (!slot) return false;
    const before = rawValues(slot)[index];
    if (before == null) return false;
    try {
        TRANSACTION(`form clear ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            fresh.setValueAtPosition(index, undefined, { isPtr });
        });
    } catch (err) {
        console.warn('[formWrite] clearSlotValue failed', { index, err });
        return false;
    }
    U.isProjectModified = true;
    return true;
}

/**
 * Append an empty value to a multivalued slot (the "Add" control).
 *
 * The initial value comes from `U.initializeValue(type)`, the existing canon for a
 * fresh slot value — a typed empty, not a bare '' — so a new number row starts at 0
 * and a new boolean row at false. `'+='` on `values` is the same action Info.tsx's
 * add button issues.
 *
 * Written for Slice 1a but exercised by 1b, where the lists become editable: the whole
 * write surface lives in one module rather than growing a second half later.
 */
export function addSlotValue(slot: SlotProxy): boolean {
    if (!slot) return false;
    try {
        const type = slot.instanceof?.type;
        TRANSACTION(`form add ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            SetFieldAction.new(fresh.id, 'values', U.initializeValue(type), '+=', false);
        });
    } catch (err) {
        console.warn('[formWrite] addSlotValue failed', err);
        return false;
    }
    U.isProjectModified = true;
    return true;
}

/**
 * Rename the object the form is showing.
 *
 * The name is not a slot: it is `DObject.name`, and the L-proxy setter owns both sides
 * of the identity binding (it writes `data.name` AND the `name` slot when the metaclass
 * declares one). Going through the setter is therefore mandatory — writing the field
 * directly would desynchronise the two. See CLAUDE.md 3.12 for why the reverse
 * direction must NOT come back through this setter.
 */
export function setObjectName(objectId: string, name: string): boolean {
    const lObject: any = LPointerTargetable.fromPointer(objectId);
    if (!lObject) return false;
    if ((lObject.name ?? '') === name) return false;
    try {
        lObject.name = name;   // L-proxy setter opens its own TRANSACTION
    } catch (err) {
        console.warn('[formWrite] setObjectName failed', err);
        return false;
    }
    U.isProjectModified = true;
    return true;
}

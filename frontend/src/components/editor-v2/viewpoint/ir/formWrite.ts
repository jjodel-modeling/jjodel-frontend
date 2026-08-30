/**
 * formWrite, the single write path of the form rendering of a view.
 *
 * Every mutation a form field performs goes through here, and here goes through
 * `LValue`: `setValueAtPosition` for a set or a clear, `SetFieldAction` with '+='
 * for an append. That is NOT a second write path next to the canvas one, it is the
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
 *
 * ── S2: what these functions return ───────────────────────────────────────────
 *
 * Every one of them returns `jjform`'s `WriteResult` — `{ok, changed, reason?}` — and
 * not a boolean. The boolean could not tell "nothing to write" from "the host said no",
 * so it reported both as the same thing and, on a refusal, reported the write as done:
 * `setValueAtPosition` returns `{success, reason}` and the verdict was dropped on the
 * floor. Exercised on the running app before the change, not inferred from the source
 * (`scripts/smoke/_tmp_s2_probe.ts`, 2026-08-30): writing a containment loop returned
 * `true`, flipped `U.isProjectModified` to true, and left the slot exactly as it was,
 * while the core — asked directly, one line lower — answered
 * `{success: false, reason: "cannot create a containment loop"}`.
 *
 * Consequence for callers: `changed` decides the dirty mark, `ok` decides whether the
 * field declares a refusal. A field that commits on blur with an unchanged value gets
 * `{ok: true, changed: false}` and must show nothing, which is the pre-S2 behaviour of
 * the boolean and the reason `changed` exists as a separate field.
 */

import { LPointerTargetable, SetFieldAction, TRANSACTION, U } from '../../../../joiner';
import { checkNameUniqueness } from '../../../../model/logicWrapper/nameUniqueness';
import { writeDone, writeRefused, writeUnchanged, type WriteResult } from '../../../../jjform';
import { rawValues } from './slotValues';

export type { WriteResult };

/** An L-proxy over a DValue. Typed loosely on purpose: the L layer is untyped at the
 *  call sites this module serves, and narrowing here would only move the casts. */
type SlotProxy = any;

/** What `LValue.setValueAtPosition` returns (`LModelElement.tsx:7582`). `undefined`
 *  is possible: the proxy is untyped here, and a caller must not read `.success` off
 *  nothing. */
type CoreVerdict = { success: boolean; reason?: string } | undefined;

/**
 * The two reasons with which the core reports a NO-OP, not a refusal.
 *
 * `setValueAtPosition` answers `{success: false, reason: "identical assignment"}` when
 * the value asked for is the value already there (`LModelElement.tsx:7643-7646`).
 * That is `success: false` for "nothing was written", not for "you may not write" —
 * the same case this module already catches with `sameValue` before calling. Mapped
 * to `{ok: true, changed: false}` so a no-op can never be shown to the user as a
 * refusal. Verbatim strings, because they are the core's own and matching them
 * loosely would swallow a real refusal that happened to contain the word.
 */
const CORE_NOOP_REASONS: ReadonlySet<string> = new Set([
    'identical assignment',
    'identical object assignment',
]);

/** Translate the core's verdict into the engine's. An absent verdict is read as a
 *  success: the pre-S2 code did the same, and reading silence as a refusal would
 *  turn every untyped proxy path into a false alarm. */
function fromCore(v: CoreVerdict): WriteResult {
    if (!v || v.success) return writeDone();
    if (v.reason && CORE_NOOP_REASONS.has(v.reason)) return writeUnchanged();
    // The reason travels VERBATIM: this module never rewords the host's refusal and
    // never invents one when the host gave none.
    return writeRefused(v.reason);
}

/** The message of a thrown error, or nothing. A throw is this module's own refusal,
 *  not the host's verdict, and it says so by carrying the exception's text. */
function thrownReason(err: unknown): string | undefined {
    const m = (err as { message?: unknown })?.message;
    return typeof m === 'string' ? m : undefined;
}

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
 * Returns the host's verdict (S2). `{ok: true, changed: true}` when the value landed,
 * `{ok: true, changed: false}` when it was already there, `{ok: false, reason}` when the
 * core refused it — a containment loop being the refusal it actually applies (R-FORM-13).
 */
export function setSlotValue(
    slot: SlotProxy,
    index: number,
    value: string | number | boolean | null | undefined,
    isPtr?: boolean,
): WriteResult {
    if (!slot) return writeRefused('no slot to write to');
    const before = rawValues(slot)[index];
    if (sameValue(before, value)) return writeUnchanged();
    let verdict: CoreVerdict;
    try {
        TRANSACTION(`form set ${slot.name ?? 'value'}`, () => {
            // Re-wrap against the current state before writing: a proxy captured on a
            // previous render may be stale. Same guard Info.tsx takes before each write.
            const fresh = slot.r ?? slot;
            verdict = fresh.setValueAtPosition(index, value, { isPtr });
        });
    } catch (err) {
        console.warn('[formWrite] setSlotValue failed', { index, value, err });
        return writeRefused(thrownReason(err));
    }
    const result = fromCore(verdict);
    // Only a write that HAPPENED dirties the project. Before S2 the flag was set on a
    // comparison taken before the write, so a refused write raised it too (measured,
    // `scripts/smoke/_tmp_s2_probe.ts`: `false -> true` with the slot unchanged).
    if (result.ok && result.changed) U.isProjectModified = true;
    return result;
}

/**
 * Clear the value at `index`, the `x` of a list row or of a chip.
 *
 * This leaves a HOLE, it does not shorten the array. Measured on 2026-08-27, on a
 * `[0..5]` slot holding `["hot","cold","warm"]`: after `clearSlotValue(slot, 1)` the raw
 * array is `["hot", null, "warm"]`, still length 3. That follows from
 * `setValueAtPosition`, which writes `SetFieldAction(data, 'values.<index>', undefined)`
 * an assignment to a position, not a splice.
 *
 * The hole is DELIBERATE, not a limitation worked around. Two reasons:
 *
 *  - it is what the classic panel already produces (Info.tsx clears the same way), so the
 *    form and the panel leave a model in the same shape, and a model edited by one renders
 *    correctly in the other;
 *  - the obvious alternative is broken. `LValue.removeByIndex` filters the array and hands
 *    the shorter one to `set_values`, whose truncation removes the excess BY VALUE
 *    (`SetFieldAction(id, 'values', undefined, '-=')`). On an array with no hole there is no
 *    `undefined` to remove, so the tail survives: measured, `removeByIndex(1)` on
 *    `["hot","cold","warm"]` yields `["hot","warm","warm"]`, the last value duplicated.
 *    On an array that already has a hole it does truncate, which is why the defect is easy
 *    to miss. Recorded in docs/TECH-DEBT.md.
 *
 * Callers therefore render holes rather than assuming a dense array: `meaningfulValues`
 * excludes them from the count (so the upper-bound gate stays honest) and the list widgets
 * skip them. Index stability is a side benefit, removing one value does not renumber the
 * others, so a second removal targets what the user sees.
 */
export function clearSlotValue(slot: SlotProxy, index: number, isPtr?: boolean): WriteResult {
    if (!slot) return writeRefused('no slot to clear');
    const before = rawValues(slot)[index];
    if (before == null) return writeUnchanged();
    let verdict: CoreVerdict;
    try {
        TRANSACTION(`form clear ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            verdict = fresh.setValueAtPosition(index, undefined, { isPtr });
        });
    } catch (err) {
        console.warn('[formWrite] clearSlotValue failed', { index, err });
        return writeRefused(thrownReason(err));
    }
    const result = fromCore(verdict);
    if (result.ok && result.changed) U.isProjectModified = true;
    return result;
}

/**
 * Append an empty value to a multivalued slot (the "Add" control).
 *
 * The initial value comes from `U.initializeValue(type)`, the existing canon for a
 * fresh slot value, a typed empty, not a bare '', so a new number row starts at 0
 * and a new boolean row at false. `'+='` on `values` is the same action Info.tsx's
 * add button issues.
 *
 * Written for Slice 1a but exercised by 1b, where the lists become editable: the whole
 * write surface lives in one module rather than growing a second half later.
 *
 * ── S2: it ALIGNS, it does not die ────────────────────────────────────────────
 *
 * It has no callers — the census that found this is the WriteCtx referto §2.4, and it
 * still holds (`grep` over `src/`, 2026-08-30: three hits, all inside this file, one of
 * them the docstring reference above). S2 was asked to decide, and the decision is to
 * keep it and give it the new type, for the reason Rule 9 and the referto give: this is
 * the only place in the form perimeter that knows how to produce the TYPED EMPTY of
 * `U.initializeValue`, so deleting it deletes knowledge, not code. It comes back the day
 * an "Add row" gesture exists; until then it is dead weight that costs one function.
 * TODO: cleanup — revive from a list "Add row" control or remove with its census line.
 */
export function addSlotValue(slot: SlotProxy): WriteResult {
    if (!slot) return writeRefused('no slot to add to');
    try {
        const type = slot.instanceof?.type;
        TRANSACTION(`form add ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            SetFieldAction.new(fresh.id, 'values', U.initializeValue(type), '+=', false);
        });
    } catch (err) {
        console.warn('[formWrite] addSlotValue failed', err);
        return writeRefused(thrownReason(err));
    }
    // `SetFieldAction` returns no verdict, so `ok` here is "the action was issued", not
    // "the host approved it". The append path has no refusal to report: the only checks
    // the core applies in writing live in `setValueAtPosition`, which this does not call.
    U.isProjectModified = true;
    return writeDone();
}

/**
 * Append a value to a multivalued slot.
 *
 * `'+='` on `values`, the same action the classic panel's add button issues. Distinct from
 * `addSlotValue`, which appends an EMPTY typed value for the user to fill in: this one
 * appends a value that is already known, which is what the reference picker and the chips
 * editor produce.
 */
export function appendSlotValue(
    slot: SlotProxy,
    value: string | number | boolean,
    isPtr: boolean,
): WriteResult {
    if (!slot) return writeRefused('no slot to append to');
    try {
        TRANSACTION(`form append ${slot.name ?? 'value'}`, () => {
            const fresh = slot.r ?? slot;
            SetFieldAction.new(fresh.id, 'values', value, '+=', isPtr);
        });
    } catch (err) {
        console.warn('[formWrite] appendSlotValue failed', { value, err });
        return writeRefused(thrownReason(err));
    }
    // Same note as `addSlotValue`: `SetFieldAction` carries no verdict back.
    U.isProjectModified = true;
    return writeDone();
}

/**
 * Rename the object the form is showing.
 *
 * The name is not a slot: it is `DObject.name`, and the L-proxy setter owns both sides
 * of the identity binding (it writes `data.name` AND the `name` slot when the metaclass
 * declares one). Going through the setter is therefore mandatory, writing the field
 * directly would desynchronise the two. See CLAUDE.md 3.12 for why the reverse
 * direction must NOT come back through this setter.
 */
export function setObjectName(objectId: string, name: string): WriteResult {
    const lObject: any = LPointerTargetable.fromPointer(objectId);
    if (!lObject) return writeRefused('object not found');
    if ((lObject.name ?? '') === name) return writeUnchanged();

    // The rename has a refusal the setter cannot report back. `LObject.set_name`
    // (`LModelElement.tsx:6230`) hard-blocks a colliding name, shows a toast and returns
    // WITHOUT writing — and a proxy assignment has no return value to read anyway. So the
    // verdict is asked of `checkNameUniqueness`, THE one function both the rename and the
    // create consult since S1a (R-S1-2): this is consumption of the single rule, not a
    // second copy of it, and the sentence shown is the one that function composes.
    const verdict = checkNameUniqueness({ father: lObject.father, name, excludeId: objectId });

    try {
        // Called even when the verdict refuses, on purpose: on a collision the setter
        // writes nothing and only raises the toast, which is committed behaviour owned by
        // the core. Skipping the call to "save a no-op" would silently remove that toast.
        lObject.name = name;   // L-proxy setter opens its own TRANSACTION
    } catch (err) {
        console.warn('[formWrite] setObjectName failed', err);
        return writeRefused(thrownReason(err));
    }
    if (!verdict.ok) return writeRefused(verdict.reason);
    U.isProjectModified = true;
    return writeDone();
}

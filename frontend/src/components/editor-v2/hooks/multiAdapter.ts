/**
 * multiAdapter — the impure half of the 12b/12c adapter: it applies to the
 * D-graph what `jjform/multi` planned.
 *
 * The split from `multiDraw.ts` is R-FORM-5's, and the line is the import of the
 * joiner barrel below: everything that can be a pure function of `idlookup` is
 * next door and under test, and what is left here is the write.
 *
 * ── The bulk writes are NOT deferred, and that is measured ────────────────────
 *
 * R-FORM-11 defers the deletes of 12d by `U.UpdatingTimer * 2` because, issued in
 * one tick, a slot write and a delete land in the wrong order and a value is
 * lost. The obvious fear was that a BULK write — N instances, one key, one tick —
 * would lose values the same way. It does not: measured on the running app
 * (`scripts/smoke/_tmp_12bc_measure.ts`, 2026-08-30), three `setValueAtPosition`
 * writes to the same feature of three different instances, issued in a single
 * tick, all three landed — 0 lost of 3 — and the same three spaced by
 * `U.UpdatingTimer` landed identically.
 *
 * The two cases differ in kind, which is why the measurement came out this way:
 * 12d's hazard is TWO OPERATIONS ON ONE SLOT (a positional write, then a cascade
 * that removes by value from the same array), while a bulk edit is N operations
 * on N DISTINCT slots that never touch each other's arrays. So no deferral is
 * added here — a delay nobody needs is a delay nobody can later remove, because
 * removing it would look like a regression risk.
 *
 * What IS kept from R-FORM-11 is its shape: if a bulk edit is ever followed by a
 * delete of any of the same instances, the delete goes through
 * `deleteAdapter.applyDelete`, which defers on its own. The two paths compose
 * without this module having to know about the other.
 */

import { LPointerTargetable } from '../../../joiner';
import { setSlotValue } from '../viewpoint/ir/formWrite';
import type { BulkSetValue } from '../../../jjform';

/** What a bulk write actually did — reported rather than assumed, because a slot
 *  that does not resolve is a real outcome and a silent one would be worse. */
export interface BulkResult {
    /** Events whose write reported a change. */
    written: number;
    /** Events whose value was already what was asked: no write, no failure. */
    unchanged: number;
    /** Events whose slot could not be resolved on the instance. */
    missing: number;
    /** Events the host REFUSED (S2). Optional because the shape predates the verdict,
     *  and reported rather than folded into `unchanged`: a refusal is not a no-op, and
     *  counting it as one is exactly the confusion S2 exists to remove. The caller
     *  (`InstanceManagerTab.applyBulkEdit`) discards this result today; the live
     *  consumption of the refusal is the warning logged with the host's own reason. */
    refused?: number;
}

/**
 * Apply a `bulkPlan` to the D-graph, one `setValue` per event.
 *
 * POSITION 0, matching `multiDraw.multiInstanceOf`, which reads position 0: 12b
 * edits a field, and a field is one control. A many-valued slot is read and
 * written at its first position; bulk-editing a list AS a list is not in this
 * slice, and the engine does not emit an event for one.
 *
 * `isPtr` comes from the plan, not from a second look at the metamodel: the
 * engine knows it from the shape, and re-deriving it here would give two answers
 * to one question. `setValueAtPosition` needs it to reconcile the old target.
 *
 * Nothing is re-decided. In particular the plan is not recomputed from a fresh
 * read of the instances: the user pressed a button against the model they were
 * shown, and a second verdict could disagree with it. Same rule as
 * `createAdapter.applyCreate` and `deleteAdapter.applyDelete`.
 */
export function applyBulk(plan: readonly BulkSetValue[]): BulkResult {
    const out: BulkResult = { written: 0, unchanged: 0, missing: 0, refused: 0 };
    if (!plan || plan.length === 0) return out;

    for (const ev of plan) {
        const lOwner: any = LPointerTargetable.fromPointer(ev.id);
        const slot: any = lOwner?.['$' + ev.key];
        if (!slot) {
            console.warn('[multiAdapter] applyBulk: slot not found', { id: ev.id, key: ev.key });
            out.missing++;
            continue;
        }
        const r = setSlotValue(slot, 0, ev.value as any, ev.isPtr);
        if (!r.ok) {
            console.warn('[multiAdapter] applyBulk: write refused', { id: ev.id, key: ev.key, reason: r.reason });
            out.refused = (out.refused ?? 0) + 1;
        } else if (r.changed) out.written++;
        else out.unchanged++;
    }
    // `U.isProjectModified` is NOT set here: `setSlotValue` already sets it on
    // every write that changed something, and a second setter would be a second
    // place for the rule to live.
    return out;
}

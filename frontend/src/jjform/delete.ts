/**
 * jjform/delete - the DELETE half of the portable form engine (slice 12d).
 *
 * The `delete(id, { reassignTo? | clearRefs })` event of
 * `form-engine-contract.md` section 5, and the `{ referencedBy,
 * reassignCandidates }` preflight its section 4 asks for, as far as either can be
 * computed without a host.
 *
 * -- The invariant of this directory, restated --------------------------------
 *
 * ZERO imports beyond the sibling TYPES of `shape.ts`, and since S4 of `writeCtx.ts`
 * / `write.ts` - the write CONTRACT, which is an interface and a record type, not a
 * host. Same rule as `shape.ts` and `create.ts`, same reason: one import from
 * `joiner/` would drag monaco and `window` behind it and end the portability.
 * Everything here is a function of plain records; the D graph lives on the other
 * side of the adapter, and `applyPlanWrites` reaches it only through the `WriteCtx`
 * its caller hands in.
 *
 * -- ONE event, three verdicts ------------------------------------------------
 *
 * The contract gives delete a single event whose OPTIONS are the verdict of the
 * preflight, not three separate routes. The three are `reassign`, `clear` and
 * `dirty`, and in THIS host they are three genuinely different writes - measured,
 * not assumed (`docs/discovery/discovery_2026-08-30_slice12d_delete.md`):
 *
 *  - `reassign` - each incoming pointer is repointed at another instance before
 *                 the delete. The model stays valid.
 *  - `clear`    - each incoming pointer is cleared IN PLACE, which leaves a HOLE
 *                 in the referrer's slot rather than shortening it
 *                 (`formWrite.clearSlotValue`, R-FORM-7). The referrer's other
 *                 values keep their positions.
 *  - `dirty`    - nothing is written first, and the core's own cascade removes
 *                 each incoming pointer BY VALUE, shortening the array and
 *                 renumbering what follows. Measured on a `0..*` slot holding two
 *                 targets: deleting the one at position 0 left a length-1 array,
 *                 not a hole.
 *
 * So `clear` and `dirty` are not one operation dressed twice: on a single-valued
 * slot they agree, on a multivalued one they do not, and the difference is exactly
 * the one R-FORM-7 already ratified for the rest of the manager.
 *
 * -- The dirty delete is DECLARED, never prevented ----------------------------
 *
 * Contract section 2: a broken ref (missing id or "") is representable, the model
 * may be invalid, and the engine declares it. That is what `DeletePlan.invalidates`
 * is - the referrers whose slot falls below its own `lower` once the pointers are
 * gone. The engine does not refuse the delete on account of it; it names the
 * instances that will need attention, and the table renders their empty required
 * slot AS broken rather than as a dash.
 *
 * -- Containment cascades, and the CORE DOES NOT DO IT ------------------------
 *
 * "Contents die with their container - there is no containment orphan" is the
 * ratified rule; the measurement is that the core's `Dummy.get_delete` does NOT
 * implement it for M1 instances. `DObject.children` is its DValue slots, and
 * `LValue` does not override `get_children`, so a contained DObject - which lives
 * in the slot's `values`, not in any `children` list - is never reached. Measured:
 * deleting a container left the child in `idlookup` with a `father` that no longer
 * resolves, an orphan invisible to every list in the manager (they all walk
 * `father` up to a DModel). The cascade is therefore the ADAPTER's, never the
 * UI's, and this module's job is to say which instances it covers so the dialogue
 * can count them before anything is written.
 */

import type { ClassShape, MetamodelShape } from './shape';
import type { WriteCtx } from './writeCtx';
import type { WriteResult } from './write';
import { multiplicity } from './shape';

/** One option of the reassign select - an instance, by name. */
export interface DeleteOption {
    id: string;
    label: string;
}

/**
 * One incoming pointer, as the host measured it.
 *
 * Per POINTER, not per instance (R-FORM-8): an instance pointing at the target
 * twice produces two entries, because each has to be repointed on its own.
 */
export interface ReferrerInput {
    /** The instance holding the pointer. */
    instanceId: string;
    instanceName: string;
    instanceClass: string;
    featureKey: string;
    featureId: string;
    /** What this pointer aims at - the target, or one of its descendants. */
    pointsAt: string;
    /** Position inside the referrer's slot. Slots have holes, so this is not the
     *  ordinal among the filled values. */
    index: number;
    lower: number;
    upper: number;
    /** How many values that slot holds RIGHT NOW, holes excluded. */
    slotCount: number;
}

/** One instance that dies in the containment cascade. */
export interface DescendantInput {
    id: string;
    name: string;
    cls: string;
    /** The containment feature of its own owner it sits in. */
    childKey: string;
    /** 1 for a direct child, 2 for a grandchild, and so on. */
    depth: number;
}

/** Everything the host measured about the instance being deleted. */
export interface PreflightInput {
    id: string;
    name: string;
    cls: string;
    /** Every incoming pointer aimed at the target OR at one of its descendants,
     *  containment links already excluded - an owner is not a referrer - and
     *  pointers held by the dying instances themselves already dropped. */
    referrers: ReferrerInput[];
    /** The containment closure below the target. */
    descendants: DescendantInput[];
    /** Instances that may take the target's place. */
    candidates: DeleteOption[];
    /** Non-null when the host will REFUSE the delete whatever the dialogue says.
     *  The one measured case is a singleton instance: `LObject.get_delete` logs
     *  and returns without deleting. */
    blocked?: string | null;
}

/** One referrer, as the dialogue lists it. */
export interface DeleteReferrer extends ReferrerInput {
    multiplicity: string;
    /** True when this pointer aims at a DESCENDANT of the target rather than at
     *  the target itself. It still has to be dealt with, because the descendant is
     *  dying too (ratified rule 3 of 12d), and the dialogue says which is which. */
    viaDescendant: boolean;
    /** True when removing every pointer this slot holds towards the dying set
     *  takes the slot below its own `lower`. */
    wouldBreak: boolean;
}

/** The contract's section 4 preflight, plus the copy the design fixes. */
export interface DeletePreflight {
    id: string;
    name: string;
    cls: string;
    blocked: string | null;
    referencedBy: DeleteReferrer[];
    descendants: DescendantInput[];
    reassignCandidates: DeleteOption[];
    /** The reassign row is offered only when there is something to point at. */
    canReassign: boolean;
    /** `Delete Config_main?` */
    title: string;
    message: string;
    /** `Delete anyway - 2 Transitions become invalid` */
    dirtyLabel: string;
    /** `Clear the 2 references, then delete` */
    clearLabel: string;
    /** True when nothing points at the target and nothing hangs below it: the
     *  simple confirmation of ratified rule 1. */
    simple: boolean;
}

/** What the caller chose. `{}` is the dirty delete: nothing is written first. */
export interface DeleteOptions {
    reassignTo?: string;
    clearRefs?: boolean;
}

/** The three verdicts, named. */
export type DeleteVerdict = 'reassign' | 'clear' | 'dirty';

/** One pointer to repoint. */
export interface ReassignStep {
    instanceId: string;
    featureKey: string;
    index: number;
    to: string;
}

/** One pointer to clear in place. */
export interface ClearStep {
    instanceId: string;
    featureKey: string;
    index: number;
}

/**
 * The ordered work the adapter performs. Pure data: the adapter applies it and
 * decides nothing, which is what makes the verdict testable without a store.
 */
export interface DeletePlan {
    verdict: DeleteVerdict;
    /** Non-null when nothing may be applied. The plan is then empty. */
    blocked: string | null;
    reassign: ReassignStep[];
    clear: ClearStep[];
    /** Instance ids to delete, DEEPEST FIRST, the target last: no intermediate
     *  state ever has a live object under a slot that is already gone. */
    deletes: string[];
    /** The referrers left below their own `lower` once this plan is applied - the
     *  declaration of contract section 2, not a reason to refuse. */
    invalidates: DeleteReferrer[];
}

// -- Preflight ----------------------------------------------------------------

/** `2 Sensors` / `1 Transition` - how the design counts referrers. Falls back to
 *  the neutral word when they are not all of one metaclass, rather than picking
 *  the first and mislabelling the rest. */
function countPhrase(n: number, classes: string[]): string {
    const distinct = [...new Set(classes.filter(Boolean))];
    const word = distinct.length === 1 ? distinct[0] : 'instance';
    return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/** Key of the slot a pointer sits in. Grouping is by (referrer, feature), which is
 *  what a cardinality is declared over. */
function slotKey(r: { instanceId: string; featureKey: string }): string {
    return `${r.instanceId} ${r.featureKey}`;
}

/**
 * The delete preflight of contract section 4 - ALWAYS computed, referenced or not
 * (ratified rule 1 of 12d).
 *
 * `wouldBreak` is per SLOT, not per pointer: a `1..*` slot holding three pointers
 * of which one aims at the dying set does not break, and judging each pointer on
 * its own would say it does. The pointers of one slot are therefore counted
 * together and the verdict copied onto each of them.
 */
export function deletePreflight(shape: MetamodelShape, input: PreflightInput): DeletePreflight {
    const cls: ClassShape | undefined = shape?.classes?.[input?.cls];
    const referrers = input?.referrers ?? [];
    const descendants = input?.descendants ?? [];
    const descendantIds = new Set(descendants.map(d => d.id));

    const removedPerSlot: Record<string, number> = {};
    for (const r of referrers) removedPerSlot[slotKey(r)] = (removedPerSlot[slotKey(r)] ?? 0) + 1;

    const referencedBy: DeleteReferrer[] = referrers.map(r => ({
        ...r,
        multiplicity: multiplicity(r),
        viaDescendant: descendantIds.has(r.pointsAt),
        wouldBreak: r.slotCount - (removedPerSlot[slotKey(r)] ?? 1) < r.lower,
    }));

    const label = input?.name || input?.id || '';
    const n = referencedBy.length;
    const childCount = descendants.length;
    const breaking = referencedBy.filter(r => r.wouldBreak);
    const cascade = `Containment cascades: its ${childCount} contained element${childCount > 1 ? 's' : ''} will be deleted too.`;

    let message: string;
    if (n > 0) {
        message = `${label} : ${input.cls} is referenced by `
            + countPhrase(n, referencedBy.map(r => r.instanceClass))
            + (breaking.length ? ` - cardinality ${breaking[0].multiplicity} would break.` : '.');
        if (childCount) message += ` ${cascade}`;
    } else if (childCount) {
        message = cascade;
    } else {
        message = 'This cannot be undone.';
    }

    return {
        id: input?.id ?? '',
        name: input?.name ?? '',
        cls: input?.cls ?? '',
        blocked: input?.blocked ?? null,
        referencedBy,
        descendants,
        reassignCandidates: input?.candidates ?? [],
        canReassign: n > 0 && (input?.candidates ?? []).length > 0,
        title: `Delete ${label}?`,
        message,
        dirtyLabel: n
            ? `Delete anyway - ${countPhrase(n, referencedBy.map(r => r.instanceClass))} become invalid`
            : 'Delete',
        clearLabel: n === 1 ? 'Clear the reference, then delete' : `Clear the ${n} references, then delete`,
        simple: n === 0 && childCount === 0 && !cls?.singleton,
    };
}

/** The verdict the options express. `{}` - and an empty `reassignTo` - is dirty. */
export function deleteVerdict(options: DeleteOptions = {}): DeleteVerdict {
    if (options?.reassignTo) return 'reassign';
    if (options?.clearRefs) return 'clear';
    return 'dirty';
}

/**
 * The plan the adapter applies.
 *
 * A reassign whose target is not among the candidates is REFUSED rather than
 * silently downgraded to a dirty delete: the candidates are the type-conformant
 * set, and writing a pointer outside it is the write `setValueAtPosition` would
 * reject anyway - leaving the instance deleted and the referrer wrong.
 *
 * `invalidates` is computed for the verdicts that leave the pointers gone
 * (`clear`, `dirty`) and is EMPTY for a reassign, which is the whole reason the
 * reassign is offered first.
 */
export function deletePlan(pre: DeletePreflight, options: DeleteOptions = {}): DeletePlan {
    const verdict = deleteVerdict(options);
    const empty: DeletePlan = {
        verdict, blocked: pre?.blocked ?? null, reassign: [], clear: [], deletes: [], invalidates: [],
    };
    if (!pre || pre.blocked) return empty;

    if (verdict === 'reassign') {
        const to = options.reassignTo as string;
        if (!pre.reassignCandidates.some(c => c.id === to)) {
            return { ...empty, blocked: `"${to}" is not a valid target for this reference` };
        }
    }

    const deletes = [...pre.descendants]
        .sort((a, b) => b.depth - a.depth)
        .map(d => d.id);
    deletes.push(pre.id);

    if (verdict === 'reassign') {
        const to = options.reassignTo as string;
        return {
            verdict,
            blocked: null,
            reassign: pre.referencedBy.map(r => ({
                instanceId: r.instanceId, featureKey: r.featureKey, index: r.index, to,
            })),
            clear: [],
            deletes,
            invalidates: [],
        };
    }

    return {
        verdict,
        blocked: null,
        reassign: [],
        // The dirty delete writes NOTHING first: the core's own cascade removes
        // each incoming pointer by value. Only `clear` writes, and it writes a
        // hole so the referrer's other values keep their positions.
        clear: verdict === 'clear'
            ? pre.referencedBy.map(r => ({ instanceId: r.instanceId, featureKey: r.featureKey, index: r.index }))
            : [],
        deletes,
        invalidates: pre.referencedBy.filter(r => r.wouldBreak),
    };
}

// -- Applying the plan's WRITES, through a WriteCtx ----------------------------

/** One step the host refused, with the host's own words. Kept as data rather than
 *  logged here: this module has nothing to log to, and the adapter that does is the
 *  one that knows which console the user is looking at. */
export interface PlanWriteRefusal {
    /** Which half of the plan the step came from. */
    kind: 'reassign' | 'clear';
    instanceId: string;
    featureKey: string;
    index: number;
    /** The host's `reason`, absent when the host gave none. */
    reason?: string;
}

/** What `applyPlanWrites` did. Counted per STEP, because a plan step is a pointer
 *  (R-FORM-8) and two pointers of the same referrer are two independent outcomes. */
export interface PlanWriteOutcome {
    /** Steps whose write reported a change. */
    written: number;
    /** Steps whose value was already the one asked for: no write, no failure. */
    unchanged: number;
    /** Steps the host refused. Empty is the normal case. */
    refused: PlanWriteRefusal[];
}

/**
 * Apply the WRITES of a plan — the reassigns, then the clears — through `ctx`.
 *
 * The deletes are NOT here, and that is the whole reason this function stops where
 * it does. In this host they are deferred by `U.UpdatingTimer * 2` whenever the plan
 * wrote first (R-FORM-11), because issued in the same tick a positional write and a
 * cascade that removes by value from the same array land in the wrong order and a
 * value is lost — measured, `scripts/smoke/_tmp_instance_manager_12d.ts`. That
 * deferral is a number of this host, so it stays in the adapter; what belongs to the
 * contract is the OBLIGATION it satisfies — each step observable by the next — and
 * the ORDER, which is here.
 *
 * The order is load-bearing: the writes on the referrers come first, while the
 * pointers still resolve, and reassigns come before clears so a slot that is both
 * repointed and cleared ends up cleared, as the plan intends. A reassign performed
 * after the delete would repoint a slot the core's own cascade had already emptied.
 *
 * Nothing is re-decided. The plan is applied as given: a second verdict computed
 * here could disagree with the one the user is looking at, and the confirm button is
 * exactly where the two must be the same.
 *
 * `blocked` plans write nothing — the same guard the adapter already applies, kept
 * here too so an adapter that forgets it cannot half-apply a plan the preflight
 * refused.
 */
export function applyPlanWrites(ctx: WriteCtx, plan: DeletePlan): PlanWriteOutcome {
    const out: PlanWriteOutcome = { written: 0, unchanged: 0, refused: [] };
    if (!plan || plan.blocked) return out;

    const tally = (kind: 'reassign' | 'clear', step: { instanceId: string; featureKey: string; index: number }, r: WriteResult): void => {
        // The three addressing fields, named rather than spread: a `ReassignStep` also
        // carries `to`, and a refusal that echoed the target back would be describing the
        // write that did NOT happen.
        if (!r.ok) out.refused.push({ kind, instanceId: step.instanceId, featureKey: step.featureKey, index: step.index, reason: r.reason });
        else if (r.changed) out.written++;
        else out.unchanged++;
    };

    // `isPtr: true` on both: every step of a plan is an incoming POINTER at the
    // instance being deleted, which is what a referrer is.
    for (const step of plan.reassign) {
        tally('reassign', step, ctx.setValue(step.instanceId, step.featureKey, step.index, step.to, true));
    }
    for (const step of plan.clear) {
        tally('clear', step, ctx.clearValue(step.instanceId, step.featureKey, step.index, true));
    }
    return out;
}

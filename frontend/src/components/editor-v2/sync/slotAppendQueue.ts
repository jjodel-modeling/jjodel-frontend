/**
 * Queued appends: the ids a slot was told to append whose write is not in the store yet.
 *
 * A write to a slot sits in the open buffer until the next COMMIT tick, then in a setTimeout(0)
 * (action.ts:336, :357; reducer.ts:1555). Two appends inside that window read the same slot, plan the
 * same index, and the second overwrites the first (discovery_2026-11-09_lost_containment_write.md §6).
 * So an append plans over what the store holds plus what is known to be on its way.
 *
 * Re-emitting a queued id at its own index is idempotent: lir_2026-11-09_queued_appends.md.
 *
 * No import from joiner: the store and the transaction state come in through the env, so this runs in vitest.
 */

export interface SlotAppendEnv {
    /** The raw `values` of a slot in the store, undefined when the slot is not there. */
    storedValues(slotId: string): readonly unknown[] | undefined;
    /** The buffer the next write goes into. FINAL_END replaces it on a flush and on an abort. */
    currentBuffer(): unknown;
    dispatchesInFlight(): number;
    /** The listener must run after every store update. */
    subscribe(listener: () => void): void;
}

export interface SlotAppendQueue {
    /** The array to assign to `slot.values`. Records `id` as queued: call it once per write. */
    plan(slotId: string, storedValues: readonly unknown[], id: string): unknown[];
    /** For a write that replaces the slot: what was queued for it no longer applies. */
    forget(slotId: string): void;
}

interface QueuedAppend {
    id: string;
    /** The buffer that took the write. */
    buffer: unknown;
}

const isMeaningful = (v: unknown): boolean => v != null && v !== '';

export function createSlotAppendQueue(env: SlotAppendEnv): SlotAppendQueue {
    const queues = new Map<string, QueuedAppend[]>();
    let subscribed = false;

    // An entry ends when the store holds it, or when its buffer has left and nothing is in flight: the write has
    // then reached the reducer or been thrown away, so no later state can hold it. No timer: the commit is a timer
    // too, and a long task moves it by its own length.
    const settle = (slotId: string, stored: readonly unknown[] | undefined): QueuedAppend[] => {
        const buffer = env.currentBuffer();
        const inFlight = env.dispatchesInFlight() > 0;
        const kept = (queues.get(slotId) ?? []).filter((e) => !stored?.includes(e.id) && (e.buffer === buffer || inFlight));
        if (kept.length) queues.set(slotId, kept);
        else queues.delete(slotId);
        return kept;
    };

    // At every update, not only at the next plan: a landed entry must not wait on a slot nobody appends to, or a
    // value removed later would come back with the next append.
    const settleAll = (): void => {
        for (const slotId of [...queues.keys()]) settle(slotId, env.storedValues(slotId));
    };

    return {
        plan(slotId, storedValues, id) {
            if (!subscribed) {
                subscribed = true;
                env.subscribe(settleAll);
            }
            const meaningful = storedValues.filter(isMeaningful);
            const queued = settle(slotId, storedValues);
            const queuedIds = queued.map((e) => e.id);
            if (queuedIds.includes(id)) return [...meaningful, ...queuedIds];
            if (!meaningful.includes(id)) queues.set(slotId, [...queued, { id, buffer: env.currentBuffer() }]);
            return [...meaningful, ...queuedIds, id];
        },
        forget(slotId) {
            queues.delete(slotId);
        },
    };
}

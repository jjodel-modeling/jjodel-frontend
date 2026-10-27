/**
 * JjScript M1 Instance Handle Registry
 *
 * A per-script-run map `handle -> DObject.id`, populated by `create instance` and
 * consulted as the FIRST resolution level by every subsequent M1 instance command.
 *
 * WHY: the M1 instance lookup historically keyed on the DObject's `name` attribute
 * (`findInstanceByName` matches `o.name`). Writing `name` (via `set x.name = ...`)
 * therefore re-keyed the instance, and the re-key lands asynchronously (the store
 * commit is deferred to a `setTimeout(0)` macrotask while the executor's commands
 * resolve on the microtask queue), so a later command addressing the original handle
 * failed non-deterministically with "Element not found". See
 * docs/discovery/2026-07-07-identity-name-decoupling.md.
 *
 * The DObject `id` is stable and immutable from creation (Constructors.makeID) and is
 * resolvable immediately via `LPointerTargetable.fromPointer` (it falls back to
 * `pendingCreation` before the store commits). Keying the script handle on the id
 * therefore makes `set x.name` innocuous, makes duplicate domain names expressible and
 * addressable, and removes the race by construction.
 *
 * SCOPE: the registry is per-execution — it is cleared at the start of each script run
 * (the `EXECUTION_START` event fired by ScriptBlock before its command loop). It is not
 * persisted. Single interactive console commands (which do not fire EXECUTION_START)
 * accumulate handles until the next run boundary, which is the desired behaviour.
 */

import { JjScriptEvents } from '../../events/registry';

// handle (creation name) -> DObject id (Pointer, a branded string at runtime)
const handleToId = new Map<string, string>();

/** Register (or overwrite) the id for a creation handle. */
export function registerHandle(handle: string, id: string): void {
    handleToId.set(handle, id);
}

/** Return the id registered for a handle, or undefined. */
export function getHandleId(handle: string): string | undefined {
    return handleToId.get(handle);
}

/** Whether a handle is currently registered. */
export function hasHandle(handle: string): boolean {
    return handleToId.has(handle);
}

/** Remove a handle (e.g. on delete) so it becomes reusable. No-op if absent. */
export function unregisterHandle(handle: string): void {
    handleToId.delete(handle);
}

/**
 * Move a handle to a new name keeping its id (e.g. on rename). No-op if the old
 * handle is not registered (the instance was pre-existing / resolved by fallback).
 */
export function renameHandle(oldHandle: string, newHandle: string): void {
    if (!handleToId.has(oldHandle)) return;
    const id = handleToId.get(oldHandle)!;
    handleToId.delete(oldHandle);
    handleToId.set(newHandle, id);
}

/**
 * The set of handles reserved in the current run. Used by auto-name generation so a
 * generated `<Class><N>` name never collides with a handle already created this run —
 * important because the model's committed `objects` list lags behind (deferred commit),
 * whereas the registry is up to date synchronously.
 */
export function getReservedHandles(): Set<string> {
    return new Set(handleToId.keys());
}

// slot (DValue) id -> ids of the children this run created into it (R-JS-9). The store lists a
// child in its slot's `values` about 300 ms after `DObject.new` (discovery_2026-10-04_jjscript_m1_
// containment.md §4.5), so the upper bound of a slot counts these too, or two creates 20 ms apart
// would both fit a 0..1 slot. Same lifetime as the handles: one run.
const pendingBySlot = new Map<string, Set<string>>();

/** Record a child created into a slot in this run. */
export function registerPendingChild(slotId: string, childId: string): void {
    let ids = pendingBySlot.get(slotId);
    if (!ids) pendingBySlot.set(slotId, ids = new Set());
    ids.add(childId);
}

/** The children this run created into a slot, committed or not. */
export function getPendingChildren(slotId: string): string[] {
    return [...(pendingBySlot.get(slotId) ?? [])];
}

/** Drop a child from every slot it was recorded in (e.g. on delete). No-op if absent. */
export function forgetPendingChild(childId: string): void {
    for (const ids of pendingBySlot.values()) ids.delete(childId);
}

/** Clear the whole registry. Called at each run boundary and by tests. */
export function clearHandles(): void {
    handleToId.clear();
    pendingBySlot.clear();
}

// Reset at the start of every script run. Guarded for non-DOM (test/node) environments.
if (typeof window !== 'undefined') {
    window.addEventListener(JjScriptEvents.EXECUTION_START, clearHandles);
}

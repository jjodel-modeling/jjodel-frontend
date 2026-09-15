/**
 * simRunState — run-state of the state-machine simulation (R-SIM-1).
 *
 * Module singleton (per session, not persisted): Set of ACTIVE DObject ids +
 * version counter with a React subscription hook. Same shape as
 * irCollapseState.ts, and kept outside Redux by construction: the run-state
 * never persists with the project, never enters the undo history and never
 * travels on the collaborative socket. No actions, no reducer, no bag `_state`.
 *
 * The Set is keyed on the DObject id (the M1 instance), NOT on the ReactFlow
 * vertex id: the panel works on objects, and ObjectNode maps vertex -> object
 * through `idlookup[vertexId].model` (irResolve.ts:55).
 */

import { useSyncExternalStore } from 'react';

const active = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();

function bump(): void {
    version++;
    for (const l of listeners) l();
}

export function isSimActive(objectId: string): boolean {
    return active.has(objectId);
}

/** Snapshot copy of the active ids — the internal Set is never handed out. */
export function getSimActiveIds(): string[] {
    return [...active];
}

/**
 * Replaces the whole active set (simulation reset). One bump, and only when the
 * content actually changed: an identical reset is invisible, so re-rendering
 * every subscriber for it would be pure cost (same `changed` guard as
 * irCollapseState.hydrateCollapsed).
 */
export function simReset(activeIds: string[]): void {
    const next = new Set(activeIds);
    if (next.size === active.size) {
        let same = true;
        for (const id of next) if (!active.has(id)) { same = false; break; }
        if (same) return;
    }
    active.clear();
    for (const id of next) active.add(id);
    bump();
}

/**
 * Applies one simulation step as a single transition of the set: the sources
 * given in `deactivate` leave, the targets in `activate` enter. One bump for
 * the whole step, whatever the number of objects involved.
 *
 * Deactivations are applied BEFORE activations, so activation wins on an id
 * present in both lists (self-loop, or a state re-entered by another firing
 * transition): a state that is the target of a transition fired in this step
 * ends the step active. This is the explicit answer to the order-dependence the
 * prototype left open (Control.tsx:288-295, discovery D5).
 */
export function simApplyStep(deactivate: string[], activate: string[]): void {
    let changed = false;
    for (const id of deactivate) if (active.delete(id)) changed = true;
    for (const id of activate) if (!active.has(id)) { active.add(id); changed = true; }
    if (changed) bump();
}

/** Empties the active set (stop, and reset on model change). */
export function simClear(): void {
    if (active.size === 0) return;
    active.clear();
    bump();
}

export function getSimVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer when the active set changes. */
export function useSimVersion(): number {
    return useSyncExternalStore(subscribe, getSimVersion, getSimVersion);
}

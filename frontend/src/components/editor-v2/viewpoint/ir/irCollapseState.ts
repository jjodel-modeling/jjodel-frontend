/**
 * irCollapseState — collapse state of IR graphVertex containers.
 *
 * Module singleton (per session, not persisted): Set of collapsed container
 * objectIds + version counter with a React subscription hook. Kept outside
 * Redux by design: collapse is a per-user ephemeral view state, like zoom.
 */

import { useSyncExternalStore } from 'react';

const collapsed = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();

function bump() {
    version++;
    for (const l of listeners) l();
}

export function isCollapsed(objectId: string): boolean {
    return collapsed.has(objectId);
}

export function toggleCollapsed(objectId: string): void {
    if (collapsed.has(objectId)) collapsed.delete(objectId);
    else collapsed.add(objectId);
    bump();
}

export function getCollapsedSet(): Set<string> {
    return collapsed;
}

export function getCollapseVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer when any collapse toggles. */
export function useCollapseVersion(): number {
    return useSyncExternalStore(subscribe, getCollapseVersion, getCollapseVersion);
}

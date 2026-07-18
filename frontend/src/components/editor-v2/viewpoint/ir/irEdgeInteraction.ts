/**
 * irEdgeInteraction — session state for synthetic object-as-edge interaction.
 *
 * Two concerns, both ephemeral per-session (same philosophy as irCollapseState:
 * view state like zoom, not model state):
 *
 * - anchor overrides: when the user drags a synthetic edge endpoint to a
 *   different handle, the chosen sides override the geometric assignment
 *   (keyed by the edge-object id, so they survive re-synthesis);
 * - selection: RF selection changes for synthetic ids cannot be applied to the
 *   base edge state (the ids only exist in the decorated array), so selection
 *   is tracked here and re-applied by the decoration pass — without this the
 *   edge never highlights and the reconnect anchors never show.
 */

import { useSyncExternalStore } from 'react';

export interface IRAnchorOverride {
    sourceHandle?: string;
    targetHandle?: string;
}

const anchorOverrides = new Map<string, IRAnchorOverride>();
const selectedSynthetic = new Set<string>();
let version = 0;
const listeners = new Set<() => void>();

function bump() {
    version++;
    for (const l of listeners) l();
}

export function setIREdgeAnchorOverride(objectId: string, override: IRAnchorOverride): void {
    const prev = anchorOverrides.get(objectId) ?? {};
    anchorOverrides.set(objectId, { ...prev, ...override });
    bump();
}

export function getIREdgeAnchorOverride(objectId: string): IRAnchorOverride | undefined {
    return anchorOverrides.get(objectId);
}

export function setSyntheticEdgeSelected(edgeId: string, selected: boolean): void {
    const had = selectedSynthetic.has(edgeId);
    if (selected === had) return;
    if (selected) selectedSynthetic.add(edgeId);
    else selectedSynthetic.delete(edgeId);
    bump();
}

export function clearSyntheticEdgeSelection(): void {
    if (selectedSynthetic.size === 0) return;
    selectedSynthetic.clear();
    bump();
}

export function isSyntheticEdgeSelected(edgeId: string): boolean {
    return selectedSynthetic.has(edgeId);
}

export function getEdgeInteractionVersion(): number {
    return version;
}

function subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

/** React hook: re-renders the consumer on any anchor/selection change. */
export function useEdgeInteractionVersion(): number {
    return useSyncExternalStore(subscribe, getEdgeInteractionVersion, getEdgeInteractionVersion);
}

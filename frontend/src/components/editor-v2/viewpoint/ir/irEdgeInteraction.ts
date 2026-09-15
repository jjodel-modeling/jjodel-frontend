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
    /** Explicit handle ids (RF reconnect drop on a specific handle). */
    sourceHandle?: string;
    targetHandle?: string;
    /** Side pins (EndpointHandles anchor drag) — the synthesis pass resolves the free index. */
    sourceSide?: string;
    targetSide?: string;
    /** Manhattan waypoints (SegmentHandles segment drag), re-applied to edge data. */
    waypoints?: unknown[];
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

/** Persistable subset of an override (DVertex.irEdgeLayout shape). */
export interface IRPersistedEdgeLayout {
    sourceSide?: 'top' | 'right' | 'bottom' | 'left';
    targetSide?: 'top' | 'right' | 'bottom' | 'left';
    waypoints?: { segmentIndex: number; offset: number }[];
}

const PERSISTABLE_SIDES = new Set(['top', 'right', 'bottom', 'left']);

/**
 * Derive the persistable layout (sides + waypoints) from a session override.
 * Explicit handle ids ("right-2") reduce to their side — the free index is
 * session-relative and must never be persisted. Handle wins over the side pin,
 * mirroring the synthesis precedence (synthesizeObjectAsEdges). Returns null
 * when nothing persistable remains.
 */
export function irEdgeLayoutFromOverride(o: IRAnchorOverride): IRPersistedEdgeLayout | null {
    const sideOf = (handle?: string, side?: string): IRPersistedEdgeLayout['sourceSide'] => {
        const s = handle ? handle.split('-')[0] : side;
        return s && PERSISTABLE_SIDES.has(s) ? (s as IRPersistedEdgeLayout['sourceSide']) : undefined;
    };
    const layout: IRPersistedEdgeLayout = {};
    const src = sideOf(o.sourceHandle, o.sourceSide);
    const tgt = sideOf(o.targetHandle, o.targetSide);
    if (src) layout.sourceSide = src;
    if (tgt) layout.targetSide = tgt;
    if (Array.isArray(o.waypoints)) {
        const wps = (o.waypoints as any[])
            .filter(wp => wp && typeof wp.segmentIndex === 'number' && typeof wp.offset === 'number')
            .map(wp => ({ segmentIndex: wp.segmentIndex as number, offset: wp.offset as number }));
        if (wps.length) layout.waypoints = wps;
    }
    return layout.sourceSide || layout.targetSide || layout.waypoints ? layout : null;
}

/**
 * One-time hydration seed from persisted DVertex.irEdgeLayout: only objectIds
 * without a session override are seeded (session wins); bumps once when
 * anything changed. The once-per-graph guard is the caller's responsibility.
 */
export function hydrateIREdgeAnchorOverrides(entries: Array<[string, IRAnchorOverride]>): void {
    let changed = false;
    for (const [objectId, override] of entries) {
        if (anchorOverrides.has(objectId)) continue;
        anchorOverrides.set(objectId, { ...override });
        changed = true;
    }
    if (changed) bump();
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

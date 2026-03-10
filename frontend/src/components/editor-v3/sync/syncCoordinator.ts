/**
 * Editor V3 — Module-level sync coordination.
 *
 * Plain TypeScript module (no React) for bidirectional sync state management.
 * Forked from editor-v2/sync/syncState.ts and extended for V3.
 */

import { BOUNCE_WINDOW_MS } from '../constants';

// ---------------------------------------------------------------------------
// SyncMode — per-node drag sync strategy
// ---------------------------------------------------------------------------

export type SyncMode = 'lazy' | 'faithful';

const syncModes = new Map<string, SyncMode>();

export function setSyncMode(nodeId: string, mode: SyncMode): void {
    syncModes.set(nodeId, mode);
}

export function getSyncMode(nodeId: string): SyncMode {
    return syncModes.get(nodeId) ?? 'lazy';
}

export function clearSyncModes(): void {
    syncModes.clear();
}

// ---------------------------------------------------------------------------
// Drop-created IDs — tracks nodes created by the drop handler.
//
// When a node is dropped, EditorV3 creates the RF node instantly and syncs to
// JjOM. When useJjomSyncV3 detects the new DVertex, it consumes the flag and
// populates its cache without triggering a re-render.
// ---------------------------------------------------------------------------

const dropCreatedIds = new Set<string>();

export function markDropCreated(id: string): void {
    dropCreatedIds.add(id);
}

export function consumeDropCreated(id: string): boolean {
    return dropCreatedIds.delete(id);
}

export function clearDropCreated(): void {
    dropCreatedIds.clear();
}

// ---------------------------------------------------------------------------
// Edge → DReference/model ID registry.
//
// Maps DEdge IDs to their associated DModelElement IDs (DReference, etc.).
// Single source of truth for finding the model element from an edge.
// ---------------------------------------------------------------------------

const edgeModelIds = new Map<string, string>();

export function setEdgeModelId(edgeId: string, modelId: string): void {
    edgeModelIds.set(edgeId, modelId);
}

export function getEdgeModelId(edgeId: string): string | undefined {
    return edgeModelIds.get(edgeId);
}

export function clearEdgeModelIds(): void {
    edgeModelIds.clear();
}

// ---------------------------------------------------------------------------
// Anti-bounce — prevents re-transformation of canvas-originated writes.
//
// When the canvas writes to JjOM (e.g., drag position), we mark the element ID.
// The JjOM→RF sync path checks this set and skips re-transformation for those
// IDs during the bounce window.
// ---------------------------------------------------------------------------

/** id → timestamp of last canvas-originated write */
const canvasUpdatedIds = new Map<string, number>();

export function markCanvasUpdated(id: string): void {
    canvasUpdatedIds.set(id, Date.now());
}

export function markCanvasUpdatedBatch(ids: string[]): void {
    const now = Date.now();
    for (const id of ids) canvasUpdatedIds.set(id, now);
}

export function isCanvasUpdated(id: string): boolean {
    const ts = canvasUpdatedIds.get(id);
    if (!ts) return false;
    if (Date.now() - ts > BOUNCE_WINDOW_MS) {
        canvasUpdatedIds.delete(id);
        return false;
    }
    return true;
}

export function clearCanvasUpdated(id: string): void {
    canvasUpdatedIds.delete(id);
}

export function clearAllCanvasUpdated(): void {
    canvasUpdatedIds.clear();
}

/** Remove entries older than BOUNCE_WINDOW_MS. Call on each sync cycle. */
export function purgeExpired(): void {
    const now = Date.now();
    for (const [id, ts] of canvasUpdatedIds) {
        if (now - ts > BOUNCE_WINDOW_MS) canvasUpdatedIds.delete(id);
    }
}

// ---------------------------------------------------------------------------
// Cleanup — call on unmount to reset all coordinator state.
// ---------------------------------------------------------------------------

export function cleanupAll(): void {
    clearAllCanvasUpdated();
    clearSyncModes();
    clearDropCreated();
    clearEdgeModelIds();
}

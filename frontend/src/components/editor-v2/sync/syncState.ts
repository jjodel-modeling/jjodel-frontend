/**
 * Module-level sync coordination for EditorV2 ↔ JjOM bidirectional sync.
 *
 * This is a plain TypeScript module (no React) so it can be imported from
 * both hooks and handler functions without lifecycle coupling.
 */

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
// Drop-created IDs — tracks nodes created by the drop handler in EditorV2.
//
// When a node is dropped, EditorV2 creates the RF node instantly (for
// responsiveness + autoEdit) and also syncs to JjOM. When useJjomSync
// detects the new DVertex, it consumes the drop-created flag and just
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
// Edge → DReference ID registry.
//
// Maps DEdge IDs to their DReference IDs. This is the single source of truth
// for finding the DReference from an edge, bypassing the unreliable
// DEdge.model field. Set during edge creation and loaded from JjOM on init.
// ---------------------------------------------------------------------------

const edgeRefIds = new Map<string, string>();

export function setEdgeRefId(edgeId: string, refId: string): void {
    edgeRefIds.set(edgeId, refId);
}

export function getEdgeRefId(edgeId: string): string | undefined {
    return edgeRefIds.get(edgeId);
}

export function clearEdgeRefIds(): void {
    edgeRefIds.clear();
}
//
// When the Redux change comes back, the JjOM→RF sync path checks this set
// and skips re-transformation for those IDs (the RF state already has the
// correct value from the user's canvas interaction).
// ---------------------------------------------------------------------------

const BOUNCE_WINDOW_MS = 300;

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
// Canvas-created edge pairs — tracks source→target pairs created by the
// canvas (syncInheritanceEdge, syncReferenceEdge).
//
// The auto-populate effect in useJjomSync checks this set to avoid creating
// duplicate DVoidEdges for edges that the canvas already created. This is
// necessary because DVoidEdge.new2's internal TRANSACTION may not always
// add the edge to the graph's subElements in time for the auto-populate
// to see it.
// ---------------------------------------------------------------------------

const canvasEdgePairs = new Set<string>();

export function markCanvasEdgePair(src: string, tgt: string): void {
    canvasEdgePairs.add(`${src}→${tgt}`);
}

export function hasCanvasEdgePair(key: string): boolean {
    return canvasEdgePairs.has(key);
}

export function clearCanvasEdgePairs(): void {
    canvasEdgePairs.clear();
}

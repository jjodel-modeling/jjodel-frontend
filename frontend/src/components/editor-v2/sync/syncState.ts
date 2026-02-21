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
// Anti-bounce — tracks IDs recently written from canvas to JjOM.
//
// When the Redux change comes back, the JjOM→RF sync path checks this set
// and skips re-transformation for those IDs (the RF state already has the
// correct value from the user's canvas interaction).
// ---------------------------------------------------------------------------

const BOUNCE_WINDOW_MS = 150;

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

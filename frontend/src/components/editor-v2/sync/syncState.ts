/**
 * Module-level sync coordination for EditorV2 ↔ JjOM bidirectional sync.
 *
 * This is a plain TypeScript module (no React) so it can be imported from
 * both hooks and handler functions without lifecycle coupling.
 */

// ---------------------------------------------------------------------------
// Registries keyed by model (multi-tab L4c, P-2026-11-19-1530, R-MT-29).
//
// Every entry of the registries below records the model that wrote it, so the
// release of model A (the unmount of its last instance, R-MT-17) clears A's
// entries only and leaves those of a model B still on screen. A writer called
// without a model id files under the shared bucket, which every release clears,
// as all entries were before L4c. Readers keep their signatures and look across
// models. A clear called without a model id clears every model, as before. A key
// written by two models belongs to the last writer.
// See docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md §4.4 and §11.
// ---------------------------------------------------------------------------

const SHARED_BUCKET = Symbol('shared');
type Bucket = string | typeof SHARED_BUCKET;

function bucketOf(modelId?: string): Bucket {
    return modelId ?? SHARED_BUCKET;
}

/** Clears every entry when modelId is undefined, else the entries of modelId and of the shared bucket. */
function clearBuckets<V>(map: Map<string, V>, bucketOfEntry: (v: V) => Bucket, modelId?: string): void {
    if (modelId === undefined) { map.clear(); return; }
    for (const [key, v] of map) {
        const b = bucketOfEntry(v);
        if (b === modelId || b === SHARED_BUCKET) map.delete(key);
    }
}

const ownBucket = (b: Bucket): Bucket => b;

// ---------------------------------------------------------------------------
// SyncMode — per-node drag sync strategy
// ---------------------------------------------------------------------------

export type SyncMode = 'lazy' | 'faithful';

const syncModes = new Map<string, { mode: SyncMode; bucket: Bucket }>();

export function setSyncMode(nodeId: string, mode: SyncMode, modelId?: string): void {
    syncModes.set(nodeId, { mode, bucket: bucketOf(modelId) });
}

export function getSyncMode(nodeId: string): SyncMode {
    return syncModes.get(nodeId)?.mode ?? 'lazy';
}

export function clearSyncModes(modelId?: string): void {
    clearBuckets(syncModes, e => e.bucket, modelId);
}

// ---------------------------------------------------------------------------
// Drop-created IDs — tracks nodes created by the drop handler in EditorV2.
//
// When a node is dropped, EditorV2 creates the RF node instantly (for
// responsiveness + autoEdit) and also syncs to JjOM. When useJjomSync
// detects the new DVertex, it consumes the drop-created flag and just
// populates its cache without triggering a re-render.
// ---------------------------------------------------------------------------

/** id → bucket of the model that marked it */
const dropCreatedIds = new Map<string, Bucket>();

export function markDropCreated(id: string, modelId?: string): void {
    dropCreatedIds.set(id, bucketOf(modelId));
}

export function consumeDropCreated(id: string): boolean {
    return dropCreatedIds.delete(id);
}

export function clearDropCreated(modelId?: string): void {
    clearBuckets(dropCreatedIds, ownBucket, modelId);
}

// ---------------------------------------------------------------------------
// Edge → DReference ID registry.
//
// Maps DEdge IDs to their DReference IDs. This is the single source of truth
// for finding the DReference from an edge, bypassing the unreliable
// DEdge.model field. Set during edge creation and loaded from JjOM on init.
// ---------------------------------------------------------------------------

const edgeRefIds = new Map<string, { refId: string; bucket: Bucket }>();

export function setEdgeRefId(edgeId: string, refId: string, modelId?: string): void {
    edgeRefIds.set(edgeId, { refId, bucket: bucketOf(modelId) });
}

export function getEdgeRefId(edgeId: string): string | undefined {
    return edgeRefIds.get(edgeId)?.refId;
}

export function clearEdgeRefIds(modelId?: string): void {
    clearBuckets(edgeRefIds, e => e.bucket, modelId);
}
//
// When the Redux change comes back, the JjOM→RF sync path checks this set
// and skips re-transformation for those IDs (the RF state already has the
// correct value from the user's canvas interaction).
// ---------------------------------------------------------------------------

const BOUNCE_WINDOW_MS = 300;

/** id → timestamp of last canvas-originated write, and the bucket of the model that wrote it */
const canvasUpdatedIds = new Map<string, { ts: number; bucket: Bucket }>();

export function markCanvasUpdated(id: string, modelId?: string): void {
    canvasUpdatedIds.set(id, { ts: Date.now(), bucket: bucketOf(modelId) });
}

export function markCanvasUpdatedBatch(ids: string[], modelId?: string): void {
    const now = Date.now();
    const bucket = bucketOf(modelId);
    for (const id of ids) canvasUpdatedIds.set(id, { ts: now, bucket });
}

export function isCanvasUpdated(id: string): boolean {
    const ts = canvasUpdatedIds.get(id)?.ts;
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

export function clearAllCanvasUpdated(modelId?: string): void {
    clearBuckets(canvasUpdatedIds, e => e.bucket, modelId);
}

/** Remove entries older than BOUNCE_WINDOW_MS. Call on each sync cycle. */
export function purgeExpired(): void {
    const now = Date.now();
    for (const [id, { ts }] of canvasUpdatedIds) {
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

/** pair key → bucket of the model that marked it */
const canvasEdgePairs = new Map<string, Bucket>();

export function markCanvasEdgePair(src: string, tgt: string, modelId?: string): void {
    canvasEdgePairs.set(`${src}→${tgt}`, bucketOf(modelId));
}

export function hasCanvasEdgePair(key: string): boolean {
    return canvasEdgePairs.has(key);
}

export function clearCanvasEdgePairs(modelId?: string): void {
    clearBuckets(canvasEdgePairs, ownBucket, modelId);
}

// Clear a single (src→tgt) mark — symmetric to markCanvasEdgePair, same pair-key
// format. Used by useM1ReferenceEdges when reconciling away a stale M1 edge so a
// later legitimate re-mint of the same pair is not blocked by a leftover mark.
export function clearCanvasEdgePair(src: string, tgt: string): void {
    canvasEdgePairs.delete(`${src}→${tgt}`);
}

// ---------------------------------------------------------------------------
// Suppressed singleton vertex IDs — tracks DVertex IDs that should NOT be
// rendered as RF nodes because the user toggled "Show singleton instances" off.
//
// When singletons are hidden, their DVertices remain in the Redux store (so
// positions are preserved), but useJjomSync skips them during both init and
// incremental sync.
// ---------------------------------------------------------------------------

const suppressedSingletonIds = new Set<string>();

export function suppressSingleton(id: string): void {
    suppressedSingletonIds.add(id);
}

export function unsuppressSingleton(id: string): void {
    suppressedSingletonIds.delete(id);
}

export function isSingletonSuppressed(id: string): boolean {
    return suppressedSingletonIds.has(id);
}

export function clearSuppressedSingletons(): void {
    suppressedSingletonIds.clear();
}

export function getSuppressedSingletonIds(): ReadonlySet<string> {
    return suppressedSingletonIds;
}

// ---------------------------------------------------------------------------
// Populate owner per model (multi-tab L4, P-2026-11-08-0131, R-MT-17).
//
// Every mounted EditorV2 runs its own useJjomSync. Actions reach the store one
// macrotask after they fire (action.ts:352), so two instances on one model whose
// populate effects run in the same commit both see the same missing element and
// both create it. The instances of a model are kept here in mount order; the
// first owns the populate, the others render only, and releasing the owner hands
// the populate to the next. The release of the last instance is when the
// registries above are cleared. Ref-count precedent: scriptPreviewStore.ts.
// See docs/discovery/lir_2026-11-07_l4_populate_owner.md.
// ---------------------------------------------------------------------------

const populateInstances = new Map<string, object[]>();

export function acquirePopulateOwner(modelId: string, token: object): void {
    const list = populateInstances.get(modelId);
    if (!list) populateInstances.set(modelId, [token]);
    else if (!list.includes(token)) list.push(token);
}

/** True when the model has no instance left. A token not held changes nothing and returns false. */
export function releasePopulateOwner(modelId: string, token: object): boolean {
    const list = populateInstances.get(modelId);
    const at = list ? list.indexOf(token) : -1;
    if (!list || at < 0) return false;
    list.splice(at, 1);
    if (list.length > 0) return false;
    populateInstances.delete(modelId);
    return true;
}

export function isPopulateOwner(modelId: string, token: object): boolean {
    return populateInstances.get(modelId)?.[0] === token;
}

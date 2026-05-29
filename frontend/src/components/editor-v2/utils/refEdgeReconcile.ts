/**
 * refEdgeReconcile — pure helpers for reconciling persisted M2 DReference
 * edges in the v2-flow graph.
 *
 * Background (see discovery doc 2026-05-28_reference_type_change_orphan_edges.md):
 *
 *   In v2-flow, an M2 reference is rendered as a `DVoidEdge` persisted under
 *   `DGraph.subElements`, with:
 *     - `model` → id of the `DReference` it represents (back-reference; set
 *       at creation, never mutated by the existing sync layer);
 *     - `start`/`end` → vertex ids resolved from `DReference.type` *at the
 *       moment of creation* and never re-pointed by `useJjomSync`.
 *
 *   When `DReference.type` changes (e.g. from the Property Panel), the
 *   existing auto-populate effect does not fire on the change (its deps
 *   count M2 references but not their `type`), and even when other code
 *   paths re-trigger the transform, the edge's `end` stays at the *old*
 *   target vertex. On reload, the init transform re-renders the stale edge
 *   *and* the auto-populate creates a fresh one pointing at the new target —
 *   the result is two edges for the same `DReference`, with the stale one
 *   surviving every reload as a permanent orphan.
 *
 * Role of this module:
 *
 *   1. `isM2ReferenceEdge` — collection filter: tells `useJjomSync` Step 3
 *      which `subElements` entries are persisted M2 reference edges that
 *      belong in the reconcile candidate pool. Filters out M1 instance
 *      edges (Step 4 / `useM1ReferenceEdges` territory), inheritance edges
 *      (no `model`), and non-edges.
 *
 *   2. `classifyRefEdgeReconcile` — decision: given the candidates that
 *      share one `refId` and the current `DReference.type`, returns one of
 *        - `create`  → nothing persisted yet, caller goes through the
 *                      existing `DVoidEdge.new2` path;
 *        - `nothing` → the kept edge is already coherent and there are no
 *                      duplicates, caller must not dispatch (idempotence);
 *        - `reconcile` → caller must, *atomically in a TRANSACTION*:
 *            - if `retargetNeeded`: SetFieldAction `keep.end` ← new target
 *              vertex, then `oldEndVertex.edgesIn -= keep`, then
 *              `newTargetVertex.edgesIn += keep` (the reciprocals are not
 *              auto-maintained by the `end` setter — see discovery doc and
 *              `classes.ts:1017-1018`);
 *            - then `DeleteElementAction.new` each `deleteEdgeIds` entry.
 *
 *   The kept edge is preferentially the one whose `endClassId` already
 *   matches the new `targetClassId` (preserves its anchors/waypoints
 *   when a stale duplicate happens to sit at index 0 in `subElements`).
 *   When no candidate is coherent, the first one in iteration order is
 *   kept and retargeted.
 *
 * Both helpers operate on plain raw idlookup snapshots (no L-proxy,
 * no Redux, no React-Flow) and are therefore unit-testable from fixture
 * data — see `__tests__/refEdgeReconcile.test.ts`.
 */

// ---------------------------------------------------------------------------
// Raw shapes (subsets — declared loose to keep the helpers compatible with
// the existing `idlookup[id] as any` usage in useJjomSync without forcing
// downstream type churn).
// ---------------------------------------------------------------------------

export interface RawEdgeLike {
    className?: string;
    model?: unknown;
    start?: unknown;
    end?: unknown;
}

export interface RawVertexLike {
    className?: string;
    model?: unknown;
}

export interface RawClassifierLike {
    className?: string;
}

// ---------------------------------------------------------------------------
// Reconcile snapshot + decision
// ---------------------------------------------------------------------------

/**
 * Captured state of one persisted M2 reference edge sharing some `refId`.
 * Produced by `useJjomSync` during the pre-Step 3 subElements sweep and
 * consumed by `classifyRefEdgeReconcile`.
 */
export interface RefEdgeSnapshot {
    /** Pointer to the DVoidEdge itself (the kept/deleted/retargeted entity). */
    edgeId: string;
    /** Pointer to the vertex currently at `edge.end` (the *vertex*, not its class).
     *  Needed to remove the edge from `oldEndVertex.edgesIn` during retarget. */
    endVertexId: string;
    /** Class id resolved as `idlookup[endVertexId].model` (i.e. the DClass that
     *  the end-vertex represents). Comparing this against `DReference.type`
     *  determines whether the edge is already coherent. Undefined snapshots
     *  are treated as not coherent (defensive). */
    endClassId: string | undefined;
}

export type ReconcileDecision =
    | { action: 'create' }
    | { action: 'nothing' }
    | {
          action: 'reconcile';
          /** Edge to keep (and possibly retarget). Preserves its `edge.id`,
           *  which keeps anchors/waypoints intact (`useJjomSync.ts:1156-1164`). */
          keepEdgeId: string;
          /** True iff `keepEdge.endClassId !== targetClassId`. When true, the
           *  caller dispatches the 3 reciprocal-preserving writes; when false,
           *  the kept edge is already coherent and only the extras are deleted. */
          retargetNeeded: boolean;
          /** Vertex id at `keepEdge.end` *before* the retarget. Caller uses it
           *  to fire `SetFieldAction(oldEndVertexId, 'edgesIn', keepEdgeId, '-=')`. */
          oldEndVertexId: string;
          /** Ids of edges to delete (historical duplicates / orphans). */
          deleteEdgeIds: string[];
      };

// ---------------------------------------------------------------------------
// isM2ReferenceEdge — collection filter
// ---------------------------------------------------------------------------

/**
 * True iff `se` is a persisted M2 reference edge:
 *  - it carries `className` containing 'Edge';
 *  - both `start` and `end` are string pointers;
 *  - `model` is a string pointer to a `DReference` (excludes inheritance
 *    edges, whose `model` is undefined, and any non-reference back-link);
 *  - the start vertex's `model` resolves to a `DClass` (excludes M1 instance
 *    edges, whose endpoints are vertices over `DObject`).
 *
 * Defensive: returns `false` whenever a required field is missing or a
 * lookup yields `undefined`. Never throws.
 */
export function isM2ReferenceEdge(
    se: RawEdgeLike | null | undefined,
    idlookup: Record<string, unknown>,
): boolean {
    if (!se) return false;
    if (typeof se.className !== 'string' || !se.className.includes('Edge')) return false;
    if (typeof se.start !== 'string' || typeof se.end !== 'string') return false;
    if (typeof se.model !== 'string') return false;
    const refModel = idlookup[se.model] as RawClassifierLike | undefined;
    if (!refModel || refModel.className !== 'DReference') return false;
    const startVertex = idlookup[se.start] as RawVertexLike | undefined;
    if (!startVertex || typeof startVertex.model !== 'string') return false;
    const startClass = idlookup[startVertex.model] as RawClassifierLike | undefined;
    if (!startClass || startClass.className !== 'DClass') return false;
    return true;
}

// ---------------------------------------------------------------------------
// classifyRefEdgeReconcile — decision
// ---------------------------------------------------------------------------

/**
 * Decides what `useJjomSync` Step 3 should do for one `DReference` given
 * the existing persisted M2 edges that share its `refId` and the current
 * `DReference.type` (= `targetClassId`).
 *
 * Branch logic:
 *  - `existing.length === 0`             → `'create'`
 *  - `existing.length ≥ 1`:
 *      - `keep` = first entry whose `endClassId === targetClassId` (preserves
 *        the coherent edge's anchors/waypoints); fallback = `existing[0]`.
 *      - `extras` = all other entries.
 *      - if `keep` is coherent AND `extras` is empty → `'nothing'` (T8 idempotence).
 *      - else → `'reconcile'` with `retargetNeeded = keep.endClassId !== targetClassId`
 *        and `deleteEdgeIds = extras.map(e => e.edgeId)`.
 *
 * Pure: the result depends only on the inputs.
 */
export function classifyRefEdgeReconcile(
    existing: ReadonlyArray<RefEdgeSnapshot>,
    targetClassId: string,
): ReconcileDecision {
    if (existing.length === 0) return { action: 'create' };
    // Prefer the already-coherent edge so its anchors/waypoints are preserved
    // when an accumulated stale duplicate happens to sit at subElements[0].
    const keep = existing.find(e => e.endClassId === targetClassId) ?? existing[0];
    const extras = existing.filter(e => e !== keep);
    const retargetNeeded = keep.endClassId !== targetClassId;
    if (!retargetNeeded && extras.length === 0) return { action: 'nothing' };
    return {
        action: 'reconcile',
        keepEdgeId: keep.edgeId,
        retargetNeeded,
        oldEndVertexId: keep.endVertexId,
        deleteEdgeIds: extras.map(e => e.edgeId),
    };
}

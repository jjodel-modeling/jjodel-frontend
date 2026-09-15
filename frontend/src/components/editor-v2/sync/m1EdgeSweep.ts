/**
 * m1EdgeSweep — structural reclamation of stale M1 reference edges.
 *
 * An M1 reference edge (DVoidEdge whose endpoints are vertices over DObjects)
 * is STALE when no live slot tuple backs its (sourceObject → targetObject)
 * pair: the backing DValue was deleted, cleared, retargeted — or the edge was
 * created without a resolvable `model` back-pointer in the first place
 * (canvasToJjom.resolveReferenceIdByName can fail; syncEdgeRefKind even
 * carries a fallback that repairs missing `model` links).
 *
 * Why structure instead of `model`: every previous cleanup keyed on
 * `edge.model === refId` (syncDeleteEdge) or on `lookup[edge.model]` being a
 * DReference (useM1ReferenceEdges.isManagedM1RefEdge). Both are blind to
 * edges whose `model` is missing or already dangling — the "zombie edge"
 * family. Matching on the endpoints' DObject shape instead makes the sweep
 * independent of back-pointer hygiene.
 *
 * Called from:
 *  - canvasToJjom.syncDeleteEdge / syncDeleteVertex (deferred macrotask),
 *    so cleanup happens even when no M1 canvas is mounted;
 *  - useM1ReferenceEdges' reconcile pass covers the reactive (mounted) case;
 *  - the headless co-evolution suite (coevolution-tests/).
 *
 * TRANSACTION safety: the delete batch contains no creator (.new/.new2), so
 * wrapping it in a TRANSACTION does not trigger the §3.3 coordinate-loss
 * hazard (same rationale as useM1ReferenceEdges' stale-edge delete batch).
 */

import { DState, DeleteElementAction, SetFieldAction, TRANSACTION, store } from '../../../joiner';
import { clearCanvasEdgePair } from './syncState';

/**
 * True iff `se` looks like an M1 reference edge by STRUCTURE: an Edge whose
 * start and end resolve to vertices over DObjects. `model` is deliberately
 * NOT required to resolve — that is the whole point of the sweep.
 * Inheritance edges never match (M2 vertices are over DClasses); composition
 * edges DO match and are correctly governed by their backing slot tuple.
 */
function isStructuralM1RefEdge(se: any, lookup: any): boolean {
    if (!se || typeof se.className !== 'string' || !se.className.includes('Edge')) return false;
    if (typeof se.start !== 'string' || typeof se.end !== 'string') return false;
    const sv = lookup[se.start], ev = lookup[se.end];
    if (!sv || typeof sv.model !== 'string' || lookup[sv.model]?.className !== 'DObject') return false;
    if (!ev || typeof ev.model !== 'string' || lookup[ev.model]?.className !== 'DObject') return false;
    return true;
}

/**
 * Sweep one M1 graph: delete every structural M1 reference edge whose
 * (srcVertex → tgtVertex) pair has no live backing slot tuple.
 * Returns the number of deleted edges.
 */
export function sweepStaleM1ReferenceEdges(graphId: string): number {
    const state: DState = store.getState();
    const lookup: any = state.idlookup;
    const rawGraph: any = lookup?.[graphId];
    if (!rawGraph) return 0;
    const modelId: string | undefined = typeof rawGraph.model === 'string' ? rawGraph.model : undefined;
    const rawModel: any = modelId ? lookup[modelId] : undefined;
    if (!rawModel) return 0;

    // Candidates: structural M1 reference edges persisted in this graph.
    const candidates: Array<{ id: string; start: string; end: string }> = [];
    const vertexByModel = new Map<string, string>();
    for (const seId of (rawGraph.subElements ?? [])) {
        const se = lookup[seId];
        if (!se) continue;
        if (typeof se.className === 'string' && se.className.includes('Vertex') && se.model) {
            vertexByModel.set(se.model, seId);
        }
        if (isStructuralM1RefEdge(se, lookup)) {
            candidates.push({ id: seId, start: se.start, end: se.end });
        }
    }
    if (candidates.length === 0) return 0;

    // Live pairs: every (srcVertex → tgtVertex) with at least one slot tuple
    // whose `instanceof` still resolves to a DReference. Mirrors
    // useM1ReferenceEdges' validPairs computation.
    const validPairs = new Set<string>();
    for (const objId of (rawModel.objects ?? [])) {
        if (typeof objId !== 'string') continue;
        const dObj = lookup[objId];
        const srcV = vertexByModel.get(objId);
        if (!dObj || !srcV) continue;
        for (const featId of (dObj.features ?? [])) {
            if (typeof featId !== 'string') continue;
            const dFeat = lookup[featId];
            if (!dFeat) continue;
            const meta = lookup[dFeat.instanceof];
            if (meta?.className !== 'DReference') continue;
            for (const tgtId of (dFeat.values ?? [])) {
                if (typeof tgtId !== 'string') continue;
                const tgtV = vertexByModel.get(tgtId);
                if (tgtV) validPairs.add(`${srcV}→${tgtV}`);
            }
        }
    }

    const toDelete = candidates.filter((e) => !validPairs.has(`${e.start}→${e.end}`));
    if (toDelete.length === 0) return 0;

    // Pure-delete batch (no creator) → safe in its own TRANSACTION (§3.3
    // targets creation coordinate-loss, not deletion). Mirrors
    // useM1ReferenceEdges' stale-edge delete batch.
    TRANSACTION('m1EdgeSweep: remove stale M1 reference edges', () => {
        for (const e of toDelete) {
            const raw = lookup[e.id];
            if (raw) DeleteElementAction.new(raw);
            // Explicit containment cleanup: a raw DeleteElementAction does not
            // reliably scrub the graph's subElements array (the cascade's
            // subcollection case does it for .delete() paths only). '-=' is
            // idempotent, so double cleanup is harmless.
            SetFieldAction.new(graphId as any, 'subElements' as any, e.id, '-=', true);
            clearCanvasEdgePair(e.start, e.end);
        }
    });
    return toDelete.length;
}

/**
 * Sweep every M1 graph in the store (graphs whose model has `instanceof`
 * set, i.e. instance models). Used by the delete paths in canvasToJjom,
 * where the affected M1 canvases may not be mounted.
 */
export function sweepAllM1ReferenceGraphs(): number {
    const state: DState = store.getState();
    const lookup: any = state.idlookup;
    if (!lookup) return 0;
    let removed = 0;
    for (const [id, raw] of Object.entries(lookup) as Array<[string, any]>) {
        if (!raw || typeof raw.className !== 'string') continue;
        if (raw.className !== 'DGraph') continue;
        const model = typeof raw.model === 'string' ? lookup[raw.model] : undefined;
        if (!model || model.className !== 'DModel') continue;
        if (!model.instanceof) continue; // metamodel graph → skip
        removed += sweepStaleM1ReferenceEdges(id);
    }
    return removed;
}

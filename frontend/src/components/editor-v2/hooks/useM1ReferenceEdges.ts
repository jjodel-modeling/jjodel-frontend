/**
 * useM1ReferenceEdges — supplements useJjomSync's Step 4 for M1 reference values
 * populated via SetFieldAction on DValue.values AFTER initial mount.
 *
 * Why this exists: useJjomSync's auto-populate effect depends on
 *   [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]
 * None of these change when a slot is set via the Slots panel
 * (Info.tsx:setValueAtPosition → SetFieldAction on DValue.values),
 * so Step 4 does not re-fire and no DVoidEdge is created for the new tuple.
 *
 * This hook adds a reactive selector keyed on the actual slot values, and on
 * change creates the missing DVoidEdges. The downstream pipeline
 * (useJjomSync's subElements selector → lGraph.edges → jjomEdgeToRFEdge →
 *  setEdges) handles rendering without modification.
 *
 * Add-only by design (mirrors Step 4 of useJjomSync). Orphan cleanup when
 * slot values are replaced or cleared is a separate workstream.
 *
 * Cost: O(n_objects × n_features × n_values) per dispatch (selector body).
 * Acceptable for typical M1 models (hundreds of objects). If profiling
 * surfaces this as hot, consider WeakMap memoization per (objId, featId).
 */

import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { DState, DVoidEdge, DEdge, DeleteElementAction, TRANSACTION } from '../../../joiner';
import { store } from '../../../joiner';
import { hasCanvasEdgePair, markCanvasEdgePair, clearCanvasEdgePair } from '../sync/syncState';

/**
 * True iff `se` is an M1 reference edge managed by this hook: className includes
 * 'Edge' and BOTH endpoints are vertices over DObjects. The
 * both-endpoints-over-DObject check is the M1 discriminator — the inverse of
 * refEdgeReconcile.isM2ReferenceEdge (which requires a DClass start vertex),
 * so M2 reference edges and inheritance edges (no `model`) never match.
 *
 * `model` hygiene is NOT required (2026-07-04): an edge whose `model` is
 * missing (resolveReferenceIdByName failed at creation) or dangling (its
 * DReference was deleted — the zombie-edge family) must still be managed,
 * otherwise it can never be reclaimed by the reconcile pass. Only a `model`
 * that RESOLVES to a non-DReference disqualifies the edge (it belongs to a
 * different mechanism). Mirrors m1EdgeSweep.isStructuralM1RefEdge.
 */
function isManagedM1RefEdge(se: any, lookup: any): boolean {
    if (!se || typeof se.className !== 'string' || !se.className.includes('Edge')) return false;
    if (typeof se.start !== 'string' || typeof se.end !== 'string') return false;
    if (typeof se.model === 'string' && se.model) {
        const m = lookup[se.model];
        if (m && m.className !== 'DReference') return false;
    }
    const sv = lookup[se.start], ev = lookup[se.end];
    if (!sv || typeof sv.model !== 'string' || lookup[sv.model]?.className !== 'DObject') return false;
    if (!ev || typeof ev.model !== 'string' || lookup[ev.model]?.className !== 'DObject') return false;
    return true;
}

export function useM1ReferenceEdges(
    modelid: string | undefined,
    graphId: string | null | undefined,
) {
    // Reactive signature: sorted hash of (srcObjId, refMetaId, tgtObjId) tuples.
    // Re-fires the effect whenever any slot value of an M1 reference changes.
    const m1RefValuesSig = useSelector((state: DState) => {
        if (!modelid) return '';
        const lookup = state.idlookup as any;
        const rawModel = lookup?.[modelid] as any;
        if (!rawModel?.objects) return '';
        const parts: string[] = [];
        for (const objId of rawModel.objects) {
            const dObj = lookup[objId] as any;
            if (!dObj?.features) continue;
            for (const featId of dObj.features) {
                const dFeat = lookup[featId] as any;
                if (!dFeat) continue;
                const meta = lookup[dFeat.instanceof] as any;
                if (meta?.className !== 'DReference') continue;
                for (const tgtId of (dFeat.values ?? [])) {
                    if (typeof tgtId === 'string') {
                        parts.push(`${objId}:${dFeat.instanceof}:${tgtId}`);
                    }
                }
            }
        }
        return parts.sort().join('|');
    });

    useEffect(() => {
        // NB (2026-07-04): do NOT bail out on an empty signature. When the
        // last backing slot disappears (reference deleted at M2) the signature
        // becomes '' — exactly the moment the reconcile pass below must run to
        // reap the now-stale edges. The signature stays in the dependency
        // array for reactivity; emptiness is a valid state, not a no-op.
        if (!modelid || !graphId) return;

        const state = store.getState();
        const lookup = state.idlookup as any;
        const rawModel = lookup[modelid] as any;
        const rawGraph = lookup[graphId] as any;
        if (!rawModel || !rawGraph) return;

        // Build helper indexes from current subElements:
        // - vertexByModel: DObject id → DVertex id (for endpoint resolution)
        // - existingKeys:  set of "srcVertex→tgtVertex" already present (idempotency)
        const vertexByModel = new Map<string, string>();
        const existingKeys = new Set<string>();
        // M1 reference edges currently persisted in the graph — candidates for the
        // reconcile/delete pass below (those whose backing slot tuple is gone).
        const managedM1Edges: Array<{ id: string; start: string; end: string }> = [];
        for (const seId of (rawGraph.subElements ?? [])) {
            const se = lookup[seId] as any;
            if (!se) continue;
            if (typeof se.className === 'string' && se.className.includes('Vertex') && se.model) {
                vertexByModel.set(se.model, seId);
            }
            if ((se.className === 'DVoidEdge' || se.className === 'DEdge') && se.start && se.end) {
                existingKeys.add(`${se.start}→${se.end}`);
                if (isManagedM1RefEdge(se, lookup)) {
                    managedM1Edges.push({ id: seId, start: se.start, end: se.end });
                }
            }
        }

        // Collect missing tuples first, then emit writes in a single pass.
        // No outer TRANSACTION wrap: DVoidEdge.new2 has its own internal
        // TRANSACTION and nesting causes x/y coordinate loss
        // (see useJjomSync.ts:496-498).
        // Every (srcV→tgtV) pair that has at least one live backing slot tuple.
        // Used by the reconcile pass to tell live edges from stale ones.
        const validPairs = new Set<string>();
        const toCreate: Array<{ refMetaId: string; srcV: string; tgtV: string; ek: string }> = [];
        for (const objId of (rawModel.objects ?? [])) {
            if (typeof objId !== 'string') continue;
            const dObj = lookup[objId] as any;
            const srcV = vertexByModel.get(objId);
            if (!dObj || !srcV) continue;
            for (const featId of (dObj.features ?? [])) {
                if (typeof featId !== 'string') continue;
                const dFeat = lookup[featId] as any;
                if (!dFeat) continue;
                const meta = lookup[dFeat.instanceof] as any;
                if (meta?.className !== 'DReference') continue;
                for (const tgtId of (dFeat.values ?? [])) {
                    if (typeof tgtId !== 'string') continue;
                    const tgtV = vertexByModel.get(tgtId);
                    if (!tgtV) continue;
                    const ek = `${srcV}→${tgtV}`;
                    validPairs.add(ek); // this pair has a live backing slot tuple
                    if (existingKeys.has(ek) || hasCanvasEdgePair(ek)) continue;
                    toCreate.push({ refMetaId: dFeat.instanceof, srcV, tgtV, ek });
                    existingKeys.add(ek); // dedup within this batch
                }
            }
        }

        // Reconcile: managed M1 edges whose vertex pair has no live backing tuple
        // are stale (slot deleted by the class-delete cascade or cleared/replaced).
        // Pair-keyed to match the pair-keyed create above (one edge per vertex pair).
        const toDelete = managedM1Edges.filter(e => !validPairs.has(`${e.start}→${e.end}`));

        if (toCreate.length === 0 && toDelete.length === 0) return;

        if ((window as any).__m1RefEdgesDebug) {
            // eslint-disable-next-line no-console
            console.log('[useM1ReferenceEdges] creating', toCreate.length, 'DVoidEdge(s):', toCreate);
        }

        for (const { refMetaId, srcV, tgtV } of toCreate) {
            DVoidEdge.new2(
                refMetaId,
                graphId,
                graphId,
                undefined,
                srcV,
                tgtV,
                (d: DEdge) => { d.isReference = true; },
            );
            markCanvasEdgePair(srcV, tgtV);
        }

        if (toDelete.length > 0) {
            if ((window as any).__m1RefEdgesDebug) {
                // eslint-disable-next-line no-console
                console.log('[useM1ReferenceEdges] removing', toDelete.length, 'stale DVoidEdge(s):', toDelete);
            }
            // Pure-delete batch (no creator) → safe in its own TRANSACTION: §3.3's
            // no-wrap rule targets creation coordinate-loss, not deletion. Mirrors
            // useJjomSync's stale-edge deletes (useJjomSync.ts:779). The DVoidEdge
            // leaving graph.subElements drives the incremental sync to drop the RF
            // edge live (useJjomSync.ts:1193-1198 / 1336-1346).
            TRANSACTION('useM1ReferenceEdges: remove stale M1 reference edges', () => {
                for (const e of toDelete) {
                    const raw = lookup[e.id];
                    if (raw) DeleteElementAction.new(raw);
                    clearCanvasEdgePair(e.start, e.end);
                }
            });
        }
    }, [modelid, graphId, m1RefValuesSig]);
}

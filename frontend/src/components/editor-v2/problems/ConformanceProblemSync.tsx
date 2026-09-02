/**
 * Producer that mirrors model↔metamodel conformance violations into the
 * NodeProblem registry. Mounts once at the EditorV2 root next to
 * UniquenessProblemSync; returns null.
 *
 * Reactivity: consumes useConformance(modelid) (debounced 500ms). On each new
 * result it aggregates violations per object (aggregateConformanceByObject) and
 * diffs the desired problem set against the registry.
 *
 * Dual registration (discovery 2026-07-16 §7 Option A): the two consumer
 * surfaces key the registry on different id spaces — the TreeView row uses the
 * DObject id, the canvas ObjectNode uses the DVertex id (react-flow node id).
 * So each violated object registers up to two entries: one under the DObject id
 * (lights the tree triangle) and one under the resolved DVertex id (lights the
 * canvas badge). Object-level (model-level) violations are excluded by the
 * aggregator and only feed the toolbar pill.
 *
 * UNQ1 C6 (2026-09-02): every entry now carries `ownerModelId` — the `modelid` this
 * producer is mounted with — so the ownership a producer's revoke pass needs is in the
 * data and not only in the module that wrote it. This producer is the second writer into
 * the shared registry Map, and a field only one of the two populated would be worse than
 * no field at all: it would invite a reader to trust it.
 *
 * The `ownedIds` ref below is NOT replaced by that field, unlike the uniqueness producer's
 * `ownedIdsByModel`. It is not ownership bookkeeping here: it is also what the unmount
 * cleanup walks to `clearProblem` this producer's entries outright when the editor closes
 * (second effect), and clearing on unmount has no `desiredIds` to diff against and no
 * `modelid` guaranteed still meaningful. Replacing it is not in this slice's perimeter.
 */

import { useEffect, useRef } from 'react';
import { store } from '../../../joiner';
import { useConformance } from '../../../model/conformance/useConformance';
import { aggregateConformanceByObject, type ConformanceObjectProblem } from './conformanceToProblems';
import {
    registerProblem,
    markResolved,
    clearProblem,
    type NodeProblem,
} from './registry';

interface Props {
    modelid: string | undefined;
    graphId: string | null | undefined;
}

const CONFORMANCE_KIND: NodeProblem['kind'] = 'conformance';

function conformanceProblemId(nodeId: string): string {
    return `${CONFORMANCE_KIND}:${nodeId}`;
}

/**
 * Build a read-only DObject-id -> DVertex-id resolver for the open graph, by
 * scanning graph.subElements for DVertex entries. Mirrors the private
 * findVertexIdForObject in canvasToJjom.ts (not exported), so no critical-zone
 * file is modified. Returns () => null when the graph is unknown.
 */
function buildVertexResolver(graphId: string | null | undefined): (objectId: string) => string | null {
    if (!graphId) return () => null;
    const lookup = store.getState().idlookup ?? {};
    const graph = lookup[graphId] as { subElements?: string[] } | undefined;
    const subEls = graph?.subElements ?? [];
    const map = new Map<string, string>();
    for (const id of subEls) {
        const ge = lookup[id] as { className?: string; model?: string } | undefined;
        if (ge?.className === 'DVertex' && ge.model) map.set(ge.model, id);
    }
    return (objectId: string) => map.get(objectId) ?? null;
}

export function ConformanceProblemSync({ modelid, graphId }: Props) {
    // useConformance returns null for metamodels / models without a metamodel
    // reference, so no problem is ever registered for those (pill stays silent).
    const result = useConformance(modelid ?? '');

    // Ids this producer currently owns in the registry — used to fully clear on
    // unmount (model close), avoiding stale entries surviving a model switch.
    const ownedIds = useRef<Set<string>>(new Set());

    useEffect(() => {
        const aggregates = aggregateConformanceByObject(result);
        const resolveVertex = buildVertexResolver(graphId);
        const desiredIds = new Set<string>();

        const register = (nodeId: string, agg: ConformanceObjectProblem): void => {
            const id = conformanceProblemId(nodeId);
            desiredIds.add(id);
            const n = agg.violations.length;
            const description = n === 1 ? agg.violations[0].message : `${n} conformance violations`;
            registerProblem({
                id,
                nodeId,
                kind: CONFORMANCE_KIND,
                severity: agg.severity,
                title: 'Conformance',
                description,
                relatedNodeIds: [],
                conformance: agg.violations,
                // The model this producer is validating. Written at registration, on BOTH
                // the DObject-keyed entry and the DVertex-keyed one — the vertex lives in
                // the graph rather than in the model, which is the worst case the field's
                // name is chosen for (registry.ts, `ownerModelId`).
                ownerModelId: modelid,
                createdAt: Date.now(),
            });
        };

        for (const agg of aggregates) {
            // TreeView surface: key by the DObject id.
            register(agg.objectId, agg);
            // Canvas surface: key by the resolved DVertex id (distinct from the object id).
            const vertexId = resolveVertex(agg.objectId);
            if (vertexId && vertexId !== agg.objectId) register(vertexId, agg);
        }

        // Mark-resolve the entries THIS producer registered last run that it no
        // longer wants (markResolved shows the green transient, then the registry
        // removes the entry after its TTL). Scoped to ownedIds — not a global
        // scan — so a concurrent editor on another model never clashes.
        for (const id of ownedIds.current) {
            if (!desiredIds.has(id)) markResolved(id);
        }

        ownedIds.current = desiredIds;
        // Deps unchanged by UNQ1 C6: `modelid` is read by the register closure now, but
        // adding it would fire the effect on a model switch with the PREVIOUS model's
        // `result` still in hand — the old model's objects registered under the new
        // owner, until the debounce lands. `result` changing is the signal that both
        // halves are fresh.
    }, [result, graphId]);

    // Full cleanup on unmount (editor / model closed): drop our entries outright
    // so nothing stale bleeds into the next model.
    useEffect(() => {
        return () => {
            for (const id of ownedIds.current) clearProblem(id);
        };
    }, []);

    return null;
}

/**
 * Producer of the `'instantiation'` problems (R-OI-3, R-OI-11; S3a, `docs/discovery/discovery_2026-10-21_onto_s3a_slot_problems.md`):
 * the findings of `instantiationToProblems.ts` mirrored into the registry. Mounts once at the EditorV2 root beside the
 * other producers; returns null. Never blocks a write (R-VAL-4): it reads the store and writes only the registry.
 *
 * Reactivity: a signature of every committed DObject's metaclass and every committed DValue's values, plus the
 * metamodel's bag, the set the detector reads (the conformance signature walks the same, `useConformance.ts`). Pending
 * creates are skipped, as `UniquenessProblemSync` does: `idlookup`'s prototype enumerates them before their commit.
 * A model whose metamodel declares no bindings has an empty signature and registers nothing.
 *
 * Debounced 300 ms. While an instantiation or a «Sync slots» is in flight (`instantiationInFlight`) the run is put
 * off and re-checked on a timer, since the end of a run is not a store change: a run in the middle would flash a
 * missing-slot problem and then a green «Resolved» (decision D5).
 *
 * Dual anchors, as `ConformanceProblemSync`: each finding registers under the DObject id of each of its anchors (tree,
 * form) and under the resolved DVertex id (canvas badge). Revoke by owner (`getProblemIdsOwnedBy`), and a full clear
 * when the model changes or the editor unmounts.
 */

import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { DState, store } from '../../../joiner';
import { instanceObjectRecord, instantiationInFlight, readOntoBindings, syncSlots, type DGet } from '../hooks/instantiate';
import { detectInstantiationProblems, type InstantiationFinding } from './instantiationToProblems';
import { buildVertexResolver } from './vertexResolver';
import { acquireProducerMount, clearProblem, getProblemIdsOwnedBy, markResolved, registerProblem, type NodeProblem } from './registry';

interface Props {
    modelid: string | undefined;
    graphId: string | null | undefined;
}

const INSTANTIATION_KIND: NodeProblem['kind'] = 'instantiation';
const DEBOUNCE_MS = 300;
const IN_FLIGHT_RECHECK_MS = 300;

const own = (lookup: Record<string, any>, id: string): boolean => Object.prototype.hasOwnProperty.call(lookup, id);

/** The committed records only: a pending create reads as absent. */
const committedGet = (lookup: Record<string, any>): DGet => id => (own(lookup, id) ? lookup[id] : undefined);

/** The reactivity signature (see the header); `''` when the model's metamodel has no bindings. */
export function instantiationSignature(lookup: Record<string, any>, modelid: string): string {
    const get = committedGet(lookup);
    if (readOntoBindings(get, modelid).length === 0) return '';
    const parts: string[] = [String(get(get(modelid)?.instanceof)?._state?.ontoBindings ?? '')];
    for (const id in lookup) {
        if (!own(lookup, id)) continue;
        const r = lookup[id];
        if (r?.className === 'DObject') parts.push(`o${id}=${r.instanceof}`);
        else if (r?.className === 'DValue') parts.push(`v${id}=${JSON.stringify(r.values)}`);
    }
    return parts.join('|');
}

/** «Sync slots» on `instance`, from the problem's action: the record read at the click. */
function runSyncSlots(modelid: string, instance: string): void {
    const get = committedGet((store.getState() as any)?.idlookup ?? {});
    const record = instanceObjectRecord(get, modelid, instance);
    if (!record) return;
    void syncSlots(instance, record).then(result => {
        if (!result.ok) console.warn('[EditorV2] syncSlots:', result.problems);
    });
}

/** The body of a run: the findings of `modelid` into the registry, then the revoke of those no longer found. */
export function reconcileInstantiationProblems(modelid: string, graphId: string | null | undefined): void {
    const lookup = (store.getState() as any)?.idlookup ?? {};
    const findings = detectInstantiationProblems(committedGet(lookup), modelid);
    const resolveVertex = buildVertexResolver(lookup, graphId);
    const desiredIds = new Set<string>();
    const register = (nodeId: string, f: InstantiationFinding): void => {
        const id = `${INSTANTIATION_KIND}:${f.kind}:${f.key}@${nodeId}`;
        desiredIds.add(id);
        const instance = f.instance;
        registerProblem({
            id,
            nodeId,
            kind: INSTANTIATION_KIND,
            severity: f.severity,
            title: f.title,
            description: f.description,
            relatedNodeIds: [],
            action: f.kind === 'missing' && instance !== null
                ? { label: 'Sync slots', type: 'custom', run: () => runSyncSlots(modelid, instance) }
                : undefined,
            ownerModelId: modelid,
            createdAt: Date.now(),
        });
    };
    for (const f of findings) {
        for (const anchor of f.anchors) {
            register(anchor, f);
            const vertexId = resolveVertex(anchor);
            if (vertexId && vertexId !== anchor) register(vertexId, f);
        }
    }
    for (const id of getProblemIdsOwnedBy(INSTANTIATION_KIND, modelid)) {
        if (!desiredIds.has(id)) markResolved(id);
    }
}

export function InstantiationProblemSync({ modelid, graphId }: Props) {
    const sig = useSelector((state: DState) => (modelid ? instantiationSignature((state as any)?.idlookup ?? {}, modelid) : ''));
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!modelid) return;
        const run = () => {
            if (instantiationInFlight()) {
                timer.current = setTimeout(run, IN_FLIGHT_RECHECK_MS);
                return;
            }
            timer.current = null;
            reconcileInstantiationProblems(modelid, graphId);
        };
        timer.current = setTimeout(run, DEBOUNCE_MS);
        return () => {
            if (timer.current !== null) clearTimeout(timer.current);
            timer.current = null;
        };
    }, [modelid, graphId, sig]);

    // The model changes or the last editor on it closes (`acquireProducerMount`, multi-tab L4b): this producer's
    // entries for it go outright; another tab on the same model keeps its badges.
    useEffect(() => {
        if (!modelid) return;
        return acquireProducerMount(INSTANTIATION_KIND, modelid, () => {
            for (const id of getProblemIdsOwnedBy(INSTANTIATION_KIND, modelid)) clearProblem(id);
        });
    }, [modelid]);

    return null;
}

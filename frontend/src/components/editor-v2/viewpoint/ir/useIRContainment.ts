/**
 * useIRContainment — React wiring of the containment decoration (Fase 2b).
 *
 * Consumed by EditorV2: takes the canvas nodes/edges and returns the decorated
 * arrays (hidden subtrees, lifted edges) plus the containment model and the
 * container display names for the hull layer. Pure logic in irContainment.ts.
 * When the active viewpoint has no IR graphVertex views this is a pass-through
 * returning the same array references (zero cost for non-IR sessions).
 */

import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Edge, Node } from '@xyflow/react';
import { store } from '../../../../joiner';
import { useSimVersion } from '../../sim/simRunState';
import { computeIRSignature, getIRIndex } from './irResolveCore';
import { makeReadCtx } from './irReadCtxLproxy';
import {
    applyContainerLayout,
    buildContainmentModel,
    computeHidden,
    computeRowHiddenChildren,
    computeViewHidden,
    decorateEdges,
    decorateNodes,
    suppressChannelEdges,
    type ContainmentModel,
} from './irContainment';
import { getLayoutKeyOf } from '../layout/vertexLayoutAdapter';
import { containmentProblemsOf, reconcileContainmentProblems } from '../../problems/containmentToProblems';
import { decorateReferenceEdges, synthesizeObjectAsEdges } from './irEdgeViews';
import { resetBarOrientations } from './barOrientation';
import { deriveIRInteraction, type IRInteractionPlan } from './irInteraction';
import { getCollapsedSet, useCollapseVersion } from './irCollapseState';
import { getIREdgeAnchorOverride, isSyntheticEdgeSelected, useEdgeInteractionVersion } from './irEdgeInteraction';
import {
    crossDepsSignature,
    getEdgeObjectKeys,
    publishCrossDeps,
    publishEdgeObjectKeys,
    resetCrossDepsEpoch,
    resolveCrossDeps,
    warnCappedCrossDeps,
    warnUnresolvedCrossDeps,
} from './irCrossDeps';

const EMPTY_MODEL: ContainmentModel = {
    containers: new Map(),
    childrenOf: new Map(),
    parentOf: new Map(),
    objByVertex: new Map(),
    vertexByObj: new Map(),
};
const EMPTY_NAMES = new Map<string, string>();

/**
 * The DValue ids the declared children channels read, published by the last decoration pass (R-GV-2, spec addendum
 * §4.2) for the next `channelSig` pass: two-phase, as the cross deps of the edge objects below. A membership edit
 * (a lane's `flowNodeRefs`) changes one of these slots and nothing the other invalidation signals watch.
 */
let publishedChannelSlots: string[] = [];

export interface IRContainmentDecoration {
    nodes: Node[];
    edges: Edge[];
    model: ContainmentModel;
    names: Map<string, string>;
}

/**
 * Interaction plan of the active IR viewpoint (Fase 3, spec v1.2 sez. 6).
 * Null when the active viewpoint is not IR — consumers fall back to the
 * unrestricted (model-derived) gestures.
 */
export function useIRInteractionPlan(): IRInteractionPlan | null {
    const irSig = useSelector((state: any) => computeIRSignature(state));
    return useMemo(() => {
        if (!irSig) return null;
        const index = getIRIndex(store.getState(), irSig);
        return index ? deriveIRInteraction(index) : null;
    }, [irSig]);
}

export function useIRContainment(nodes: Node[], edges: Edge[]): IRContainmentDecoration {
    const collapseVersion = useCollapseVersion();
    const edgeInteractionVersion = useEdgeInteractionVersion();
    const irSig = useSelector((state: any) => computeIRSignature(state));

    // Reactivity for synthetic edges (spec v1.2 sez. 9, partial): snapshot of
    // the endpoint slots of every object whose metaclass has an object-as-edge
    // view, so editing src/tgt (Properties panel or reconnect) re-routes the
    // synthetic edge immediately. Exact-name metaclass match (no ancestry walk
    // in the hot selector); empty string when the viewpoint has no such views.
    const oaeSlotsSig = useSelector((state: any) => {
        const sig = computeIRSignature(state);
        if (!sig) return '';
        const index = getIRIndex(state, sig);
        if (!index || index.objectAsEdgeByMetaclass.size === 0) return '';
        const featNames = new Set<string>();
        for (const entries of index.objectAsEdgeByMetaclass.values()) {
            for (const e of entries) e.compiled.dependencySet.forEach(f => featNames.add(f));
        }
        const lookup = state.idlookup;
        const parts: string[] = [];
        for (const oid of state.objects ?? []) {
            const o = lookup?.[oid];
            const mc = o && lookup?.[o.instanceof];
            if (!mc || !index.objectAsEdgeByMetaclass.has(mc.name)) continue;
            for (const fid of o.features ?? []) {
                const dv = lookup?.[fid];
                const f = dv && lookup?.[dv.instanceof];
                if (f && featNames.has(f.name) && Array.isArray(dv.values)) {
                    parts.push(`${fid}=${JSON.stringify(dv.values)}`);
                }
            }
        }
        // Cross-object deps of edge objects published by the last decoration pass
        // (spec v1.2 sez. 9): a change on a navigated endpoint's feature (e.g. an
        // edge label reading the source State's name) invalidates the decoration.
        for (const oid of getEdgeObjectKeys()) {
            const cs = crossDepsSignature(lookup, oid);
            if (cs) parts.push(`X${oid}${cs}`);
        }
        return parts.join('|');
    });

    // Declared-channel gate (R-MK-5/R-MK-6), the decoration counterpart of the one in
    // irResolve.ts. Without it a `marked` in an edge view's line.color never updates:
    // this memo is the only thing that re-decorates the synthetic edges, and a channel
    // bump is invisible to `oaeSlotsSig`, which observes model slots. Unconditional
    // subscription, gated value: when no view of the index declares the channel the
    // dep is a constant 0 and this memo's invalidation is byte-identical to before.
    const markVersion = useSimVersion();
    const markDeclared = useMemo(() => {
        const index = irSig ? getIRIndex(store.getState(), irSig) : null;
        return !!index?.channelsInUse?.has('mark');
    }, [irSig]);
    const markDep = markDeclared ? markVersion : 0;

    // Declared children channels (R-GV-2): the values of the slots they read, so a membership edit re-decorates.
    // '' when no declared channel was resolved, which keeps this memo's invalidation as it was without one.
    const channelSig = useSelector((state: any) => {
        if (publishedChannelSlots.length === 0) return '';
        const lookup = state.idlookup;
        return publishedChannelSlots.map(id => `${id}=${JSON.stringify(lookup?.[id]?.values ?? null)}`).join('|');
    });

    const decoration = useMemo(() => {
        // Drop the cross-dep registry on a viewpoint (irSig) change before any
        // observer re-publishes. This memo (EditorV2's) renders before the
        // ObjectNodes, so clearing here and letting everyone re-publish in the
        // same commit avoids leaking the previous viewpoint's deps.
        resetCrossDepsEpoch(irSig);
        // Q3 (P-2026-10-03-1304): the bars' remembered orientations belong to one viewpoint, dropped on a change as above.
        resetBarOrientations(irSig);
        if (!irSig) { publishedChannelSlots = []; return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES }; }
        const state: any = store.getState();
        const index = getIRIndex(state, irSig);
        if (!index) { publishedChannelSlots = []; return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES }; }
        const readCtx = makeReadCtx(state.idlookup);
        const model = buildContainmentModel(nodes, state.idlookup, index, readCtx);

        let outNodes = nodes;
        let outEdges = edges;
        const names = new Map<string, string>();
        // The objects hidden by a collapse, a row or a view's `visible`, kept for the object-as-edge lift below.
        let hiddenObjects: Set<string> | null = null;

        // Row-dispatch suppression (Fase R2): containment children rendered as inline
        // rows in a vertex view's `children` compartment are hidden as top-level nodes
        // (hidden:true, never removed). rowRenderedChildren is the SSOT shared with
        // IRNodeContent (which renders exactly this set). Fast path: empty when no view
        // declares a children compartment (Machine/State etc. pay nothing).
        const rowHidden = computeRowHiddenChildren(nodes, state.idlookup, index, readCtx);
        // Q7 (P-2026-10-03-1304): an object whose vertex view resolves `visible` false is not drawn either, by the same
        // pass. Empty at once when no view declares the key.
        const viewHidden = computeViewHidden(nodes, model.objByVertex, index, readCtx, state.idlookup);

        // Containment (collapse) + row-suppression pass. Unioning the two hidden sets
        // lets decorateEdges lift/suppress dangling edges to row children with no new
        // logic. A child both inside a collapsed hull and a row of another node is
        // handled by the union — no special precedence.
        if (model.containers.size > 0 || rowHidden.size > 0 || viewHidden.size > 0) {
            for (const objectId of model.containers.keys()) {
                names.set(objectId, readCtx.getName(objectId) ?? '');
            }
            const hidden = computeHidden(model, getCollapsedSet());
            for (const r of rowHidden) hidden.add(r);
            for (const v of viewHidden) hidden.add(v);
            hiddenObjects = hidden;
            outNodes = decorateNodes(outNodes, model, hidden);
            // R-GV-5..7 (S2): the containers that declare a layout go under the edges, and partitions fill theirs,
            // in session only (the boxes are derived, R-LAY-4). Same array when no container declares one.
            outNodes = applyContainerLayout(outNodes, model, state.idlookup, getLayoutKeyOf(state), hidden);
            outEdges = decorateEdges(outEdges, model, hidden, outNodes);
            // R-GV-4: the edges that draw a channel itself, flagged hidden like the rows and the collapsed children.
            outEdges = suppressChannelEdges(outEdges, model);
        }
        publishedChannelSlots = model.channelSlots ? [...model.channelSlots] : [];

        // Edge-view passes (Fase 2c)
        outEdges = decorateReferenceEdges(outEdges, model.objByVertex, index, readCtx, state.idlookup);
        const overrides = new Map<string, { sourceHandle?: string; targetHandle?: string }>();
        for (const [, objectId] of model.objByVertex) {
            const ov = getIREdgeAnchorOverride(objectId);
            if (ov) overrides.set(objectId, ov);
        }
        // containerOf/walkedObjects (R-B14): the complete composition walk resolves the
        // `container` endpoint token and carries the vertex-less nested objects into the
        // synthesis, which no longer iterates the RF nodes.
        const oae = synthesizeObjectAsEdges(
            outNodes, outEdges, model.objByVertex, model.vertexByObj, index, readCtx, state.idlookup, overrides,
            model.containerOf, model.walkedObjects,
        );
        outNodes = oae.nodes;
        // S2b: an object-as-edge (a UML transition) with an end hidden by a collapse is lifted to the nearest drawn
        // container, as every other edge is above; without this it went with its hidden end. The edges lifted above
        // have drawn ends and pass through unchanged.
        const synthesizedEdges = oae.edges;
        const liftedEdges = hiddenObjects && hiddenObjects.size > 0 ? decorateEdges(synthesizedEdges, model, hiddenObjects, outNodes) : synthesizedEdges;
        // Re-apply RF selection to synthetic edges (tracked in irEdgeInteraction:
        // selection changes for irobj_* ids cannot land in the base edge state).
        outEdges = liftedEdges.map(e =>
            (e.data as any)?.irObjectAsEdge && isSyntheticEdgeSelected(e.id) ? { ...e, selected: true } : e);

        // Publish edge-object cross deps for the next oaeSlotsSig pass (two-phase,
        // spec v1.2 sez. 9). Endpoint slots stay observed by the scan above; this
        // adds the NAVIGATED targets (e.g. an edge label's `$source.value.$name.value`).
        const edgeKeys: string[] = [];
        for (const dep of oae.edgeObjectDeps) {
            const cross = resolveCrossDeps(state.idlookup, dep.objectId, dep.crossPaths);
            publishCrossDeps(dep.objectId, cross.fids);
            edgeKeys.push(dep.objectId);
            if (cross.unresolved.length) warnUnresolvedCrossDeps(cross.unresolved, dep.viewId);
            if (cross.capped) warnCappedCrossDeps(dep.viewId);
        }
        publishEdgeObjectKeys(edgeKeys);

        return { nodes: outNodes, edges: outEdges, model, names };
        // collapseVersion / edgeInteractionVersion / oaeSlotsSig are the
        // invalidation signals for collapse state, anchors+selection, and
        // object-as-edge endpoint slots respectively; markDep is the declared
        // channel (0, hence inert, when no view of the index declares it);
        // channelSig the slots of the declared children channels ('' without one).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig, markDep, channelSig]);

    // Problems (R-GV-2): the objects claimed twice and those claimed by no one, on their nodes, owned by this canvas's
    // graph (the father of its vertices). Reconciled only when the set changes (containmentToProblems.ts).
    useEffect(() => {
        const lookup: any = (store.getState() as any).idlookup ?? {};
        const owner = nodes.length > 0 ? lookup[nodes[0].id]?.father : undefined;
        if (typeof owner !== 'string') return;
        const readCtx = makeReadCtx(lookup);
        reconcileContainmentProblems(containmentProblemsOf(decoration.model, id => readCtx.getName(id) ?? '', owner), owner);
    }, [decoration.model, nodes]);

    return decoration;
}

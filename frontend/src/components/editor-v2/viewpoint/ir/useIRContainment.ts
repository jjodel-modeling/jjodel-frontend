/**
 * useIRContainment — React wiring of the containment decoration (Fase 2b).
 *
 * Consumed by EditorV2: takes the canvas nodes/edges and returns the decorated
 * arrays (hidden subtrees, lifted edges) plus the containment model and the
 * container display names for the hull layer. Pure logic in irContainment.ts.
 * When the active viewpoint has no IR graphVertex views this is a pass-through
 * returning the same array references (zero cost for non-IR sessions).
 */

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Edge, Node } from '@xyflow/react';
import { store } from '../../../../joiner';
import { computeIRSignature, getIRIndex } from './irResolveCore';
import { makeReadCtx } from './irReadCtxLproxy';
import {
    buildContainmentModel,
    computeHidden,
    computeRowHiddenChildren,
    decorateEdges,
    decorateNodes,
    type ContainmentModel,
} from './irContainment';
import { decorateReferenceEdges, synthesizeObjectAsEdges } from './irEdgeViews';
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

    return useMemo(() => {
        // Drop the cross-dep registry on a viewpoint (irSig) change before any
        // observer re-publishes. This memo (EditorV2's) renders before the
        // ObjectNodes, so clearing here and letting everyone re-publish in the
        // same commit avoids leaking the previous viewpoint's deps.
        resetCrossDepsEpoch(irSig);
        if (!irSig) return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES };
        const state: any = store.getState();
        const index = getIRIndex(state, irSig);
        if (!index) return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES };
        const readCtx = makeReadCtx(state.idlookup);
        const model = buildContainmentModel(nodes, state.idlookup, index, readCtx);

        let outNodes = nodes;
        let outEdges = edges;
        const names = new Map<string, string>();

        // Row-dispatch suppression (Fase R2): containment children rendered as inline
        // rows in a vertex view's `children` compartment are hidden as top-level nodes
        // (hidden:true, never removed). rowRenderedChildren is the SSOT shared with
        // IRNodeContent (which renders exactly this set). Fast path: empty when no view
        // declares a children compartment (Machine/State etc. pay nothing).
        const rowHidden = computeRowHiddenChildren(nodes, state.idlookup, index, readCtx);

        // Containment (collapse) + row-suppression pass. Unioning the two hidden sets
        // lets decorateEdges lift/suppress dangling edges to row children with no new
        // logic. A child both inside a collapsed hull and a row of another node is
        // handled by the union — no special precedence.
        if (model.containers.size > 0 || rowHidden.size > 0) {
            for (const objectId of model.containers.keys()) {
                names.set(objectId, readCtx.getName(objectId) ?? '');
            }
            const hidden = computeHidden(model, getCollapsedSet());
            for (const r of rowHidden) hidden.add(r);
            outNodes = decorateNodes(outNodes, model, hidden);
            outEdges = decorateEdges(outEdges, model, hidden, outNodes);
        }

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
        // Re-apply RF selection to synthetic edges (tracked in irEdgeInteraction:
        // selection changes for irobj_* ids cannot land in the base edge state).
        outEdges = oae.edges.map(e =>
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
        // object-as-edge endpoint slots respectively.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, irSig, collapseVersion, edgeInteractionVersion, oaeSlotsSig]);
}

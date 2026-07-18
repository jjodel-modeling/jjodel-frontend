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
    decorateEdges,
    decorateNodes,
    type ContainmentModel,
} from './irContainment';
import { decorateReferenceEdges, synthesizeObjectAsEdges } from './irEdgeViews';
import { deriveIRInteraction, type IRInteractionPlan } from './irInteraction';
import { getCollapsedSet, useCollapseVersion } from './irCollapseState';

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
    const irSig = useSelector((state: any) => computeIRSignature(state));

    return useMemo(() => {
        if (!irSig) return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES };
        const state: any = store.getState();
        const index = getIRIndex(state, irSig);
        if (!index) return { nodes, edges, model: EMPTY_MODEL, names: EMPTY_NAMES };
        const readCtx = makeReadCtx(state.idlookup);
        const model = buildContainmentModel(nodes, state.idlookup, index, readCtx);

        let outNodes = nodes;
        let outEdges = edges;
        const names = new Map<string, string>();

        // Containment pass (Fase 2b)
        if (model.containers.size > 0) {
            for (const objectId of model.containers.keys()) {
                names.set(objectId, readCtx.getName(objectId) ?? '');
            }
            const hidden = computeHidden(model, getCollapsedSet());
            outNodes = decorateNodes(outNodes, model, hidden);
            outEdges = decorateEdges(outEdges, model, hidden, outNodes);
        }

        // Edge-view passes (Fase 2c)
        outEdges = decorateReferenceEdges(outEdges, model.objByVertex, index, readCtx, state.idlookup);
        const oae = synthesizeObjectAsEdges(
            outNodes, outEdges, model.objByVertex, model.vertexByObj, index, readCtx, state.idlookup,
        );
        outNodes = oae.nodes;
        outEdges = oae.edges;

        return { nodes: outNodes, edges: outEdges, model, names };
        // collapseVersion is the invalidation signal for getCollapsedSet()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodes, edges, irSig, collapseVersion]);
}

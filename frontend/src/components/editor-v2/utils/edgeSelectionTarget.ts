/**
 * Edge selection target (R-ESEL-1..2, P-2026-09-30-1940).
 *
 * Clicking an edge on the canvas shows, in the Properties panel, the model element the edge
 * represents. The React Flow edge id alone is not that element (measured in
 * docs/discovery/discovery_2026-09-30_edge_click_properties.md §3):
 * - an M2 reference edge is a DEdge whose `model` is the DReference: that is the answer;
 * - an M1 reference or composition edge is a DEdge whose `model` is the M2 DReference its slot
 *   instantiates (useJjomSync Step 4, useM1ReferenceEdges): the answer is the slot, the DValue of the
 *   source object whose `instanceof` is that DReference;
 * - an object-as-edge has the synthetic id `irobj_<objectId>` (irEdgeViews.ts:245), no D-object
 *   behind it: the answer is the object.
 * Every other edge (inheritance, IR-lifted `<id>__irlift`, unknown) resolves to null, and the caller
 * keeps its previous behaviour exactly.
 *
 * The input is the edge id and `idlookup`, never the React Flow edge `data`: the mirrored click path
 * (EditorV2.selectEdge) passes `{ id }` only, and both paths must resolve the same.
 *
 * Pure module: the joiner barrel and EditorV2.tsx do not import under vitest, so the decision lives
 * here and is executed by utils/__tests__/edgeSelectionTarget.test.ts.
 */

/** The raw D-object fields this module reads. Structural on purpose (entries of `idlookup`). */
export interface EdgeSelectionRaw {
    className?: string;
    model?: unknown;
    start?: unknown;
    features?: unknown;
    instanceof?: unknown;
}

export interface EdgeSelectionTarget {
    /** What `_lastSelected.modelElement` names: the element the Properties panel shows. */
    modelElementId: string;
}

// The synthetic id prefix of an object rendered as an edge (irEdgeViews.ts:245).
const OBJECT_AS_EDGE_PREFIX = 'irobj_';

export function resolveEdgeSelectionTarget(
    edgeId: string,
    idlookup: Record<string, EdgeSelectionRaw | undefined>,
): EdgeSelectionTarget | null {
    if (edgeId.startsWith(OBJECT_AS_EDGE_PREFIX)) {
        const objectId = edgeId.slice(OBJECT_AS_EDGE_PREFIX.length);
        return idlookup[objectId]?.className === 'DObject' ? { modelElementId: objectId } : null;
    }

    const edge = idlookup[edgeId];
    const refId = edge?.model;
    if (typeof refId !== 'string' || idlookup[refId]?.className !== 'DReference') return null;

    const startVertex = typeof edge?.start === 'string' ? idlookup[edge.start] : undefined;
    const sourceId = startVertex?.model;
    const source = typeof sourceId === 'string' ? idlookup[sourceId] : undefined;
    if (source?.className !== 'DObject') return { modelElementId: refId };

    // M1: the slot of the source object that instantiates the edge's DReference.
    if (!Array.isArray(source.features)) return null;
    const slotId = source.features.find(
        (f: unknown) => typeof f === 'string' && idlookup[f]?.instanceof === refId,
    );
    return typeof slotId === 'string' ? { modelElementId: slotId } : null;
}

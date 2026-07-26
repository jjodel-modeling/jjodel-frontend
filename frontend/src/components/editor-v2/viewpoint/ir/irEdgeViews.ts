/**
 * irEdgeViews — pure edge-view decoration (Fase 2c, spec v1.2 sez. 7).
 *
 * Two passes over the RF edge/node arrays:
 *
 * 1. Reference-as-edge styling: M1 edges (type 'instanceRef'/'composition')
 *    whose SOURCE object resolves an edge view get stroke/terminations/label
 *    from the compiled view, emitted in DOMAIN vocabulary onto e.data (E0, spec
 *    addendum D1). UnifiedEdge's gated branch (data.irEdgeViewId present) consumes
 *    them; the routing hint is recorded but inert (D3, Manhattan frozen).
 *
 * 2. Object-as-edge synthesis (Transition pattern): objects whose resolved
 *    edge view has source/target PathExprs are hidden as nodes and drawn as a
 *    synthetic edge between the resolved endpoint vertices. The object's own
 *    reference edges toward the two endpoints are suppressed (they would
 *    duplicate the synthetic edge). Read-only visualization: interaction on
 *    synthetic edges is Fase 3 scope.
 *
 * Pure module (no joiner/react): unit-tested in ir.test.ts.
 */

import { type Edge, type Node } from '@xyflow/react';
import type { ReadCtx } from './irReadCtx';
import type { CompiledCrossPath, CompiledEdgeView } from './irTypes';
import { resolveEdgeView, resolveObjectAsEdgeView, type IRViewpointIndex } from './irResolveCore';

type Idlookup = Record<string, any>;

const DASH: Record<string, string | undefined> = {
    solid: undefined,
    dashed: '6 4',
    dotted: '2 3',
};

function applyEdgeStyle(e: Edge, cv: CompiledEdgeView, ctx: ReadCtx, evalId: string): Edge {
    const color = cv.lineColor ? String(cv.lineColor(ctx, evalId) || '') : '';
    const width = cv.lineWidth ? Number(cv.lineWidth(ctx, evalId)) || 1 : undefined;
    const lineStyle = cv.lineStyle ? cv.lineStyle(ctx, evalId) : 'solid';
    const dash = DASH[lineStyle];
    // IR-authored label: undefined when the view declares none (leave the edge's own label).
    const labelText = cv.labelText ? String(cv.labelText(ctx, evalId) ?? '') : undefined;
    return {
        ...e,
        // Keep seeding the RF label (UnifiedEdge's labelText state reads props.label).
        label: labelText !== undefined ? labelText : e.label,
        // E0 (spec addendum D1): the edge style is emitted in DOMAIN vocabulary onto
        // e.data, where UnifiedEdge's gated branch (data.irEdgeViewId present) consumes
        // it. The previous e.style / RF markerStart/markerEnd writes were dead — UnifiedEdge
        // renders its own <path>/<marker>s and never read them. Absent ir* keys leave the
        // classic rendering untouched. Terminations stay in the EdgeTermination vocabulary
        // (mapped to markers by UnifiedEdge, not to RF MarkerType here). routing stays inert
        // (D3, Manhattan frozen): irRoutingHint recorded but not consumed.
        data: {
            ...(e.data ?? {}),
            irEdgeViewId: cv.viewId,
            irRoutingHint: cv.routing ?? undefined,
            irLabelPlacement: cv.labelPlacement,
            irStroke: color || undefined,
            irStrokeWidth: width,
            irStrokeDasharray: dash,
            irSourceTermination: cv.terminations.sourceEnd,
            irTargetTermination: cv.terminations.targetEnd,
            irLabelText: labelText,
            irLabelAlwaysVisible: labelText !== undefined,
        },
    };
}

/**
 * Geometric handle assignment for decoration-created edges (synthetic
 * object-as-edge, lifted collapse edges): without handles the Manhattan router
 * cannot enter the nodes orthogonally. Dominant-axis side pick from node
 * centers + first free index per (node, side, role) among the edges already
 * assigned — the id format `${side}-${index}` is the DynamicHandles contract.
 */
/** First free handle index for (node, side, role) among already-assigned edges. */
export function freeHandleIndex(nodeId: string, side: string, role: 'source' | 'target', assigned: Edge[]): number {
    let count = 0;
    for (const e of assigned) {
        const h = role === 'source'
            ? (e.source === nodeId ? e.sourceHandle : undefined)
            : (e.target === nodeId ? e.targetHandle : undefined);
        if (h && h.startsWith(side + '-')) count++;
    }
    return count;
}

export function assignGeometricHandles(edge: Edge, nodesById: Map<string, Node>, assigned: Edge[]): Edge {
    const s = nodesById.get(edge.source);
    const t = nodesById.get(edge.target);
    if (!s || !t) return edge;
    const center = (n: Node) => ({
        x: n.position.x + ((n.measured?.width ?? (n.width as number) ?? 160) / 2),
        y: n.position.y + ((n.measured?.height ?? (n.height as number) ?? 60) / 2),
    });
    const sc = center(s), tc = center(t);
    const dx = tc.x - sc.x, dy = tc.y - sc.y;
    let sourceSide: string, targetSide: string;
    if (Math.abs(dx) >= Math.abs(dy)) {
        sourceSide = dx >= 0 ? 'right' : 'left';
        targetSide = dx >= 0 ? 'left' : 'right';
    } else {
        sourceSide = dy >= 0 ? 'bottom' : 'top';
        targetSide = dy >= 0 ? 'top' : 'bottom';
    }
    return {
        ...edge,
        sourceHandle: `${sourceSide}-${freeHandleIndex(edge.source, sourceSide, 'source', assigned)}`,
        targetHandle: `${targetSide}-${freeHandleIndex(edge.target, targetSide, 'target', assigned)}`,
    };
}

/** Pass 1: style M1 reference edges from resolved edge views. */
export function decorateReferenceEdges(
    edges: Edge[],
    objByVertex: Map<string, string>,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Idlookup,
): Edge[] {
    if (index.edgeByMetaclass.size === 0 && index.edgeWildcard.length === 0) return edges;
    let changed = false;
    const out = edges.map(e => {
        if (e.type !== 'instanceRef' && e.type !== 'composition') return e;
        // D2 (pre-lift matching): a lifted edge (decorateEdges) remaps source/target to the
        // rendered ancestor; resolve the reference view on the ORIGINAL source object, carried
        // on data.irSourceObjectId, falling back to the current vertex's object when not lifted.
        const srcObj = (e.data as any)?.irSourceObjectId ?? objByVertex.get(e.source);
        if (!srcObj) return e;
        const metaclassId = idlookup[srcObj]?.instanceof;
        if (typeof metaclassId !== 'string') return e;
        const refName = (e.data as any)?.referenceName ?? '';
        const cv = resolveEdgeView(srcObj, metaclassId, refName, index, readCtx, idlookup);
        if (!cv) return e;
        changed = true;
        return applyEdgeStyle(e, cv, readCtx, srcObj);
    });
    return changed ? out : edges;
}

export interface ObjectAsEdgeResult {
    nodes: Node[];
    edges: Edge[];
    /** objectIds rendered as edges (nodes hidden) */
    edgeObjects: Set<string>;
    /** Per edge-object, the resolved view id + its cross-object paths (spec v1.2
     *  sez. 9): the containment memo publishes these so edge labels re-render when
     *  a navigated endpoint's feature changes. */
    edgeObjectDeps: { objectId: string; viewId: string; crossPaths: CompiledCrossPath[] }[];
}

/**
 * Pass 2: synthesize object-as-edge rendering.
 * Endpoint expressions that do not resolve leave the object rendered as a node
 * (explicit fallback per spec sez. 10 — never a silent disappearance).
 */
/** First feature name of an object-as-edge PathExpr ("$src.value" → "src"). */
function firstFeatureOf(expr: string | undefined): string | null {
    if (!expr) return null;
    const m = expr.match(/^\$([A-Za-z_][A-Za-z0-9_]*)/);
    return m ? m[1] : null;
}

export function synthesizeObjectAsEdges(
    nodes: Node[],
    edges: Edge[],
    objByVertex: Map<string, string>,
    vertexByObj: Map<string, string>,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Idlookup,
    /** Session anchor overrides (user-chosen handles, side pins, waypoints), keyed by edge-object id. */
    anchorOverrides?: Map<string, { sourceHandle?: string; targetHandle?: string; sourceSide?: string; targetSide?: string; waypoints?: unknown[] }>,
): ObjectAsEdgeResult {
    if (index.objectAsEdgeByMetaclass.size === 0) return { nodes, edges, edgeObjects: new Set(), edgeObjectDeps: [] };
    const edgeObjects = new Set<string>();
    const edgeObjectDeps: ObjectAsEdgeResult['edgeObjectDeps'] = [];
    const synthetic: Edge[] = [];
    for (const n of nodes) {
        const objectId = objByVertex.get(n.id);
        if (!objectId) continue;
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') continue;
        const cv = resolveObjectAsEdgeView(objectId, metaclassId, index, readCtx, idlookup);
        if (!cv || !cv.sourceExpr || !cv.targetExpr) continue;
        let srcTarget: unknown, tgtTarget: unknown;
        try {
            srcTarget = cv.sourceExpr(readCtx, objectId);
            tgtTarget = cv.targetExpr(readCtx, objectId);
        } catch { continue; }
        // Endpoint normalization: the draw backend yields pointer strings, the
        // L-proxy backend resolves reference slots to proxy objects — accept
        // both (bug found in snippet collaudo 2026-07-18).
        const toId = (x: unknown): string | null =>
            typeof x === 'string' ? x
            : (x && typeof x === 'object' && typeof (x as any).id === 'string' ? (x as any).id : null);
        const srcId = toId(srcTarget);
        const tgtId = toId(tgtTarget);
        const srcVertex = srcId ? vertexByObj.get(srcId) : undefined;
        const tgtVertex = tgtId ? vertexByObj.get(tgtId) : undefined;
        if (!srcVertex || !tgtVertex) continue; // fallback: keep the node rendered
        edgeObjects.add(objectId);
        if (cv.crossPaths.length > 0) edgeObjectDeps.push({ objectId, viewId: cv.viewId, crossPaths: cv.crossPaths });
        const base: Edge = {
            id: `irobj_${objectId}`,
            source: srcVertex,
            target: tgtVertex,
            type: 'instanceRef',
            data: {
                irObjectAsEdge: true,
                irObjectId: objectId,
                // Feature names the reconnect gesture writes (EditorV2.handleReconnect)
                irSourceFeature: firstFeatureOf(cv.ir.edge?.source),
                irTargetFeature: firstFeatureOf(cv.ir.edge?.target),
            },
        };
        synthetic.push(applyEdgeStyle(base, cv, readCtx, objectId));
    }
    if (edgeObjects.size === 0) return { nodes, edges, edgeObjects, edgeObjectDeps };

    const edgeObjectVertices = new Set<string>();
    for (const o of edgeObjects) {
        const v = vertexByObj.get(o);
        if (v) edgeObjectVertices.add(v);
    }
    const outNodes = nodes.map(n => (edgeObjectVertices.has(n.id) && !n.hidden ? { ...n, hidden: true } : n));
    // Suppress the hidden object's own reference edges (they duplicate the synthetic edge).
    const outEdges = edges.filter(e => !edgeObjectVertices.has(e.source) && !edgeObjectVertices.has(e.target));
    // Orthogonal entry: give synthetic edges geometric handles (side + free
    // index); user-chosen anchors (reconnect gesture) override the geometry.
    const nodesById = new Map(outNodes.map(n => [n.id, n] as const));
    const placed: Edge[] = [...outEdges];
    const syntheticWithHandles = synthetic.map(e => {
        let withHandles = assignGeometricHandles(e, nodesById, placed);
        const objectId = (e.data as any)?.irObjectId as string | undefined;
        const override = objectId ? anchorOverrides?.get(objectId) : undefined;
        if (override) {
            const srcHandle = override.sourceHandle
                ?? (override.sourceSide ? `${override.sourceSide}-${freeHandleIndex(e.source, override.sourceSide, 'source', placed)}` : undefined);
            const tgtHandle = override.targetHandle
                ?? (override.targetSide ? `${override.targetSide}-${freeHandleIndex(e.target, override.targetSide, 'target', placed)}` : undefined);
            withHandles = {
                ...withHandles,
                sourceHandle: srcHandle ?? withHandles.sourceHandle,
                targetHandle: tgtHandle ?? withHandles.targetHandle,
                data: override.waypoints
                    ? { ...(withHandles.data ?? {}), waypoints: override.waypoints }
                    : withHandles.data,
            };
        }
        placed.push(withHandles);
        return withHandles;
    });
    return { nodes: outNodes, edges: [...outEdges, ...syntheticWithHandles], edgeObjects, edgeObjectDeps };
}

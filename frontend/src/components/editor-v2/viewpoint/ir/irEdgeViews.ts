/**
 * irEdgeViews — pure edge-view decoration (Fase 2c, spec v1.2 sez. 7).
 *
 * Two passes over the RF edge/node arrays:
 *
 * 1. Reference-as-edge styling: M1 edges (type 'instanceRef'/'composition')
 *    whose SOURCE object resolves an edge view get stroke/markers/label from
 *    the compiled view. Terminations map to RF markers (hollowTriangle and
 *    diamonds approximate to closed/open arrows on this substrate — flow
 *    renders Manhattan via UnifiedEdge; the routing hint is recorded in data).
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

import { MarkerType, type Edge, type EdgeMarker, type Node } from '@xyflow/react';
import type { CSSProperties } from 'react';
import type { ReadCtx } from './irReadCtx';
import type { CompiledEdgeView, EdgeTermination } from './irTypes';
import { resolveEdgeView, resolveObjectAsEdgeView, type IRViewpointIndex } from './irResolveCore';

type Idlookup = Record<string, any>;

const DASH: Record<string, string | undefined> = {
    solid: undefined,
    dashed: '6 4',
    dotted: '2 3',
};

function markerFor(t: EdgeTermination, color?: string): EdgeMarker | undefined {
    switch (t) {
        case 'none': return undefined;
        case 'openArrow': return { type: MarkerType.Arrow, width: 18, height: 18, color };
        case 'closedArrow': return { type: MarkerType.ArrowClosed, width: 18, height: 18, color };
        // Substrate approximations (documented): RF has no triangle/diamond markers.
        case 'hollowTriangle': return { type: MarkerType.ArrowClosed, width: 22, height: 22, color };
        case 'filledDiamond': return { type: MarkerType.ArrowClosed, width: 16, height: 16, color };
        case 'hollowDiamond': return { type: MarkerType.Arrow, width: 16, height: 16, color };
        default: return undefined;
    }
}

function applyEdgeStyle(e: Edge, cv: CompiledEdgeView, ctx: ReadCtx, evalId: string): Edge {
    const color = cv.lineColor ? String(cv.lineColor(ctx, evalId) || '') : '';
    const width = cv.lineWidth ? Number(cv.lineWidth(ctx, evalId)) || 1 : undefined;
    const lineStyle = cv.lineStyle ? cv.lineStyle(ctx, evalId) : 'solid';
    const style: CSSProperties = { ...(e.style ?? {}) };
    if (color) style.stroke = color;
    if (width !== undefined) style.strokeWidth = width;
    const dash = DASH[lineStyle];
    if (dash) style.strokeDasharray = dash;
    const label = cv.labelText ? String(cv.labelText(ctx, evalId) ?? '') : (e.label as string | undefined);
    return {
        ...e,
        style,
        markerStart: markerFor(cv.terminations.sourceEnd, color || undefined) ?? e.markerStart,
        markerEnd: markerFor(cv.terminations.targetEnd, color || undefined) ?? e.markerEnd,
        label,
        data: {
            ...(e.data ?? {}),
            irEdgeViewId: cv.viewId,
            irRoutingHint: cv.routing ?? undefined,
            irLabelPlacement: cv.labelPlacement,
        },
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
        const srcObj = objByVertex.get(e.source);
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
}

/**
 * Pass 2: synthesize object-as-edge rendering.
 * Endpoint expressions that do not resolve leave the object rendered as a node
 * (explicit fallback per spec sez. 10 — never a silent disappearance).
 */
export function synthesizeObjectAsEdges(
    nodes: Node[],
    edges: Edge[],
    objByVertex: Map<string, string>,
    vertexByObj: Map<string, string>,
    index: IRViewpointIndex,
    readCtx: ReadCtx,
    idlookup: Idlookup,
): ObjectAsEdgeResult {
    if (index.objectAsEdgeByMetaclass.size === 0) return { nodes, edges, edgeObjects: new Set() };
    const edgeObjects = new Set<string>();
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
        const base: Edge = {
            id: `irobj_${objectId}`,
            source: srcVertex,
            target: tgtVertex,
            type: 'instanceRef',
            data: { irObjectAsEdge: true, irObjectId: objectId },
        };
        synthetic.push(applyEdgeStyle(base, cv, readCtx, objectId));
    }
    if (edgeObjects.size === 0) return { nodes, edges, edgeObjects };

    const edgeObjectVertices = new Set<string>();
    for (const o of edgeObjects) {
        const v = vertexByObj.get(o);
        if (v) edgeObjectVertices.add(v);
    }
    const outNodes = nodes.map(n => (edgeObjectVertices.has(n.id) && !n.hidden ? { ...n, hidden: true } : n));
    // Suppress the hidden object's own reference edges (they duplicate the synthetic edge).
    const outEdges = edges.filter(e => !edgeObjectVertices.has(e.source) && !edgeObjectVertices.has(e.target));
    return { nodes: outNodes, edges: [...outEdges, ...synthetic], edgeObjects };
}

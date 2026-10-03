/**
 * irEdgeViews — pure edge-view decoration (Fase 2c, spec v1.2 sez. 7).
 *
 * Two passes over the RF edge/node arrays:
 *
 * 1. Reference-as-edge styling: M1 edges (type 'instanceRef'/'composition')
 *    whose SOURCE object resolves an edge view get stroke/terminations/label
 *    from the compiled view, emitted in DOMAIN vocabulary onto e.data (E0, spec
 *    addendum D1). UnifiedEdge's gated branch (data.irEdgeViewId present) consumes
 *    them, the routing hint included (E-route): 'straight' and 'curved' replace the
 *    drawn path, absent / 'orthogonal' keep the Manhattan router.
 *
 * 2. Object-as-edge synthesis (Transition pattern): objects whose resolved
 *    edge view has a complete endpoint pair are drawn as a synthetic edge between
 *    the resolved endpoint vertices. An endpoint is a PathExpr or the reserved
 *    `container` token, resolved against the containment map (R-B13). The pass
 *    iterates OBJECTS, not nodes (R-B14): an object with a vertex is hidden as a
 *    node and its own reference edges toward the endpoints are suppressed (they
 *    would duplicate the synthetic edge); a nested object has no vertex, nothing
 *    to hide and no edge to suppress. The vertex is required only at the two
 *    ENDPOINTS. Read-only visualization: interaction on synthetic edges is Fase 3
 *    scope.
 *
 * Pure module (no joiner/react): unit-tested in ir.test.ts.
 */

import { type Edge, type Node } from '@xyflow/react';
import type { ReadCtx } from './irReadCtx';
import type { CompiledCrossPath, CompiledEdgeView } from './irTypes';
import { resolveEdgeView, resolveIRView, resolveObjectAsEdgeView, type IRViewpointIndex } from './irResolveCore';
import { resolveTextStyle } from './irCompile';
import { assignActivityJunctions, isActivityActionView, isActivityFlowView } from './irJunctions';

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
    // R-VP-20 (TS3): the label style resolved to CSS here, where the read context is; UnifiedEdge
    // only paints it. A declared style with no axis is `{}`, still the halo label. Written only when
    // declared, so an edge view without it decorates the edge as before.
    const labelStyle = cv.labelStyle ? (resolveTextStyle(cv.labelStyle, ctx, evalId) ?? {}) : undefined;
    return {
        ...e,
        // Keep seeding the RF label (UnifiedEdge's labelText state reads props.label).
        label: labelText !== undefined ? labelText : e.label,
        // E0 (spec addendum D1): the edge style is emitted in DOMAIN vocabulary onto
        // e.data, where UnifiedEdge's gated branch (data.irEdgeViewId present) consumes
        // it. The previous e.style / RF markerStart/markerEnd writes were dead — UnifiedEdge
        // renders its own <path>/<marker>s and never read them. Absent ir* keys leave the
        // classic rendering untouched. Terminations stay in the EdgeTermination vocabulary
        // (mapped to markers by UnifiedEdge, not to RF MarkerType here). irRoutingHint is
        // read by the same branch (E-route) to pick the path shape.
        data: {
            ...(e.data ?? {}),
            irEdgeViewId: cv.viewId,
            irRoutingHint: cv.routing ?? undefined,
            irLabelPlacement: cv.labelPlacement,
            irStroke: color || undefined,
            irStrokeWidth: width,
            irStrokeDasharray: dash,
            // Slice E: a Conditional end resolved on this instance; a plain one is the view's, as before.
            irSourceTermination: cv.sourceEndTermination ? cv.sourceEndTermination(ctx, evalId) : cv.terminations.sourceEnd,
            irTargetTermination: cv.targetEndTermination ? cv.targetEndTermination(ctx, evalId) : cv.terminations.targetEnd,
            irLabelText: labelText,
            irLabelAlwaysVisible: labelText !== undefined,
            ...(labelStyle ? { irLabelStyle: labelStyle } : {}),
            // R-VP-22: the arc, read by UnifiedEdge and by assignGeometricHandles below. Written
            // only when declared, like the label style.
            ...(cv.curve ? { irCurve: cv.curve } : {}),
            // R-VP-23: the end labels, resolved here as the centre label is; each written only when
            // declared, so an edge view without them decorates the edge as before.
            ...(cv.sourceEndText ? { irSourceEndText: String(cv.sourceEndText(ctx, evalId) ?? '') } : {}),
            ...(cv.targetEndText ? { irTargetEndText: String(cv.targetEndText(ctx, evalId) ?? '') } : {}),
            // P-2026-09-30-1935: an Activity (UML) control flow, read from its view's provenance (irJunctions.ts): the
            // junction pass groups these, UnifiedEdge puts their label on a patch. Written only then.
            ...(isActivityFlowView(cv.ir) ? { irActivityFlow: true } : {}),
            // Slice E: the role at each end, the same way.
            ...(cv.sourceEndRole ? { irSourceEndRole: String(cv.sourceEndRole(ctx, evalId) ?? '') } : {}),
            ...(cv.targetEndRole ? { irTargetEndRole: String(cv.targetEndRole(ctx, evalId) ?? '') } : {}),
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

export type EndSide = 'left' | 'right' | 'top' | 'bottom';

const END_SIDES: readonly EndSide[] = ['right', 'bottom', 'left', 'top'];
const END_NORMAL: Record<EndSide, { x: number; y: number }> = { right: { x: 1, y: 0 }, left: { x: -1, y: 0 }, bottom: { x: 0, y: 1 }, top: { x: 0, y: -1 } };
/** A diamond's side faces the other end when the angle between them is under about 72 degrees. */
const DIAMOND_FACING = 0.3;

/**
 * The side of a node an edge end takes (P-2026-10-03-1304, Q2 and Q4 (a), docs/lir/lir_2026-10-03_end_side_rule.md):
 * `towards` runs from the node's centre to the other end's, `taken` holds the sides other ends of the node already use.
 * - `bar`: its two long sides only, left/right when upright (height at least width), top/bottom when lying, by the
 *   sign of `towards` across the bar; two ends share a long side rather than take a short one.
 * - `diamond`: the free side that faces the other end the most (a corner of the diamond each), sharing its best side
 *   only when no free side faces it.
 * - any other form: the dominant axis, the tie to the horizontal side (what every end took before).
 */
export function endSideFor(form: string | undefined, size: { width: number; height: number }, towards: { x: number; y: number }, taken: ReadonlySet<EndSide> = new Set()): EndSide {
    const { x: dx, y: dy } = towards;
    if (form === 'bar') {
        return size.height >= size.width ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
    }
    const dominant: EndSide = Math.abs(dx) >= Math.abs(dy) ? (dx >= 0 ? 'right' : 'left') : (dy >= 0 ? 'bottom' : 'top');
    if (form !== 'diamond' || !taken.has(dominant)) return dominant;
    const len = Math.hypot(dx, dy) || 1;
    const facing = END_SIDES
        .map(side => ({ side, cos: (dx * END_NORMAL[side].x + dy * END_NORMAL[side].y) / len }))
        .filter(c => c.cos >= DIAMOND_FACING && !taken.has(c.side))
        .sort((a, b) => b.cos - a.cos);
    return facing.length > 0 ? facing[0].side : dominant;
}

/** The sides of `nodeId` the edges of `assigned` already hold, either role. */
function sidesTaken(nodeId: string, assigned: Edge[]): Set<EndSide> {
    const out = new Set<EndSide>();
    const add = (h: string | null | undefined) => {
        const side = typeof h === 'string' ? h.split('-')[0] : '';
        if (side === 'left' || side === 'right' || side === 'top' || side === 'bottom') out.add(side);
    };
    for (const e of assigned) {
        if (e.source === nodeId) add(e.sourceHandle);
        if (e.target === nodeId) add(e.targetHandle);
    }
    return out;
}

export function assignGeometricHandles(edge: Edge, nodesById: Map<string, Node>, assigned: Edge[], formOf?: (vertexId: string) => string | undefined): Edge {
    const s = nodesById.get(edge.source);
    const t = nodesById.get(edge.target);
    if (!s || !t) return edge;
    const sizeOf = (n: Node) => ({ width: n.measured?.width ?? (n.width as number) ?? 160, height: n.measured?.height ?? (n.height as number) ?? 60 });
    const center = (n: Node) => ({ x: n.position.x + sizeOf(n).width / 2, y: n.position.y + sizeOf(n).height / 2 });
    const sc = center(s), tc = center(t);
    const dx = tc.x - sc.x, dy = tc.y - sc.y;
    let sourceSide: string, targetSide: string;
    // R-VP-22 (C3 causes 1 and 2): an arc self-loop is drawn over the top edge (UnifiedEdge), so it
    // takes two top handles, the ones its line touches, instead of a right and a left one that no
    // line touches and that would still take two slots in the side's split.
    if (edge.source === edge.target && (edge.data as any)?.irCurve === 'arc') {
        sourceSide = 'top';
        targetSide = 'top';
    } else {
        if (Math.abs(dx) >= Math.abs(dy)) {
            sourceSide = dx >= 0 ? 'right' : 'left';
            targetSide = dx >= 0 ? 'left' : 'right';
        } else {
            sourceSide = dy >= 0 ? 'bottom' : 'top';
            targetSide = dy >= 0 ? 'top' : 'bottom';
        }
        // P-2026-10-03-1304 (Q2, Q4 (a)): an end on a bar or a diamond takes the side its form allows (endSideFor);
        // every other end keeps the dominant axis above, byte for byte.
        const sf = formOf?.(edge.source), tf = formOf?.(edge.target);
        if (sf === 'bar' || sf === 'diamond') sourceSide = endSideFor(sf, sizeOf(s), { x: dx, y: dy }, sidesTaken(edge.source, assigned));
        if (tf === 'bar' || tf === 'diamond') targetSide = endSideFor(tf, sizeOf(t), { x: -dx, y: -dy }, sidesTaken(edge.target, assigned));
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
    /** child objectId → container objectId (complete composition walk, irContainment):
     *  resolves the `container` endpoint token (R-B13). */
    containerOf?: Map<string, string>,
    /** Every object of that walk: the vertex-less nested objects reach the synthesis
     *  through this set and through it only (R-B14). */
    walkedObjects?: Set<string>,
): ObjectAsEdgeResult {
    if (index.objectAsEdgeByMetaclass.size === 0) return { nodes, edges, edgeObjects: new Set(), edgeObjectDeps: [] };
    // Candidates (R-B14): the objects on canvas first, in node order (handle indices
    // stay what they were), then the walked objects with no vertex whose metaclass
    // carries an object-as-edge view — the nested form, which has no RF node to
    // iterate. The name pre-filter is exact, the same trade-off oaeSlotsSig already
    // takes: a vertex-less instance of a SUBCLASS of a metaclass carrying the view is
    // not a candidate. Objects WITH a vertex are unfiltered, as before.
    const candidates: string[] = [];
    const candidateSeen = new Set<string>();
    for (const objectId of objByVertex.values()) {
        if (candidateSeen.has(objectId)) continue;
        candidateSeen.add(objectId);
        candidates.push(objectId);
    }
    if (walkedObjects) {
        for (const objectId of walkedObjects) {
            if (candidateSeen.has(objectId) || vertexByObj.has(objectId)) continue;
            const metaclass = idlookup[idlookup[objectId]?.instanceof];
            if (!metaclass || !index.objectAsEdgeByMetaclass.has(metaclass.name)) continue;
            candidateSeen.add(objectId);
            candidates.push(objectId);
        }
    }
    const edgeObjects = new Set<string>();
    const edgeObjectDeps: ObjectAsEdgeResult['edgeObjectDeps'] = [];
    const synthetic: Edge[] = [];
    for (const objectId of candidates) {
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') continue;
        const cv = resolveObjectAsEdgeView(objectId, metaclassId, index, readCtx, idlookup);
        if (!cv) continue;
        // Each end is a compiled accessor or the container token; an incomplete pair
        // is a reference-as-edge view and never lands in this bucket anyway.
        const srcIsContainer = !!cv.sourceIsContainer;
        const tgtIsContainer = !!cv.targetIsContainer;
        if ((!cv.sourceExpr && !srcIsContainer) || (!cv.targetExpr && !tgtIsContainer)) continue;
        let srcTarget: unknown, tgtTarget: unknown;
        try {
            srcTarget = cv.sourceExpr ? cv.sourceExpr(readCtx, objectId) : undefined;
            tgtTarget = cv.targetExpr ? cv.targetExpr(readCtx, objectId) : undefined;
        } catch { continue; }
        // Endpoint normalization: the draw backend yields pointer strings, the
        // L-proxy backend resolves reference slots to proxy objects — accept
        // both (bug found in snippet collaudo 2026-07-18).
        const toId = (x: unknown): string | null =>
            typeof x === 'string' ? x
            : (x && typeof x === 'object' && typeof (x as any).id === 'string' ? (x as any).id : null);
        const container = containerOf?.get(objectId) ?? null;
        const srcId = srcIsContainer ? container : toId(srcTarget);
        const tgtId = tgtIsContainer ? container : toId(tgtTarget);
        const srcVertex = srcId ? vertexByObj.get(srcId) : undefined;
        const tgtVertex = tgtId ? vertexByObj.get(tgtId) : undefined;
        // Fallback: an object WITH a vertex stays rendered as a node (spec sez. 10);
        // a nested one has no node to fall back to and stays invisible, exactly as it
        // is today — deroga to sez. 10 declared in the ratification (R-B14).
        if (!srcVertex || !tgtVertex) continue;
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
    // P-2026-10-03-1304 (Q2, Q4): the form of an endpoint vertex, resolved once per vertex as isAction does below.
    const formMemo = new Map<string, string | undefined>();
    const formOf = (vertexId: string): string | undefined => {
        if (formMemo.has(vertexId)) return formMemo.get(vertexId);
        const objectId = objByVertex.get(vertexId);
        const metaclassId = objectId ? idlookup[objectId]?.instanceof : undefined;
        const view = objectId && typeof metaclassId === 'string' ? resolveIRView(objectId, metaclassId, index, readCtx, idlookup) : null;
        let form: string | undefined;
        try { form = view && objectId ? String(view.form(readCtx, objectId)) : undefined; } catch { form = undefined; }
        formMemo.set(vertexId, form);
        return form;
    };
    const placed: Edge[] = [...outEdges];
    const syntheticWithHandles = synthetic.map(e => {
        let withHandles = assignGeometricHandles(e, nodesById, placed, formOf);
        // The ends on a bar or a diamond say so, for UnifiedEdge's fit of an ELK route (Q4 (b)); no other end writes a key.
        const sf = formOf(e.source), tf = formOf(e.target);
        if (sf === 'bar' || sf === 'diamond' || tf === 'bar' || tf === 'diamond') {
            withHandles = {
                ...withHandles,
                data: {
                    ...(withHandles.data ?? {}),
                    ...(sf === 'bar' || sf === 'diamond' ? { irSourceForm: sf } : {}),
                    ...(tf === 'bar' || tf === 'diamond' ? { irTargetForm: tf } : {}),
                },
            };
        }
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
    // P-2026-09-30-1935: the view-only decision and merge of Activity (UML) (irJunctions.ts). Only when a flow carries
    // the flag, so every other viewpoint returns the edges above as they are. An action is an object whose vertex
    // view is Activity's in the Node role, resolved once per vertex.
    let junctioned = syntheticWithHandles;
    if (syntheticWithHandles.some(e => (e.data as any)?.irActivityFlow)) {
        const actionMemo = new Map<string, boolean>();
        const isAction = (vertexId: string): boolean => {
            const hit = actionMemo.get(vertexId);
            if (hit !== undefined) return hit;
            const objectId = objByVertex.get(vertexId);
            const metaclassId = objectId ? idlookup[objectId]?.instanceof : undefined;
            const view = objectId && typeof metaclassId === 'string' ? resolveIRView(objectId, metaclassId, index, readCtx, idlookup) : null;
            const yes = isActivityActionView(view?.ir);
            actionMemo.set(vertexId, yes);
            return yes;
        };
        junctioned = assignActivityJunctions(syntheticWithHandles, outEdges, isAction);
    }
    return { nodes: outNodes, edges: [...outEdges, ...junctioned], edgeObjects, edgeObjectDeps };
}

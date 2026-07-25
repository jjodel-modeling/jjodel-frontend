/**
 * irContainment — pure containment model + node/edge decoration (Fase 2b).
 *
 * Containment-by-hull decision (spec v1.2 sez. 8, engineering note): children
 * keep absolute canvas coordinates and top-level RF nodes; the container is
 * visualized as a hull drawn around its children (IRContainmentHulls). True RF
 * reparenting (parentId + relative coordinates) is deferred: it changes the
 * coordinate semantics of the canvas→JjOM write-back (critical zone
 * canvasToJjom) and needs a Layer Impact Report + go-ahead.
 *
 * Collapse semantics fixed by the interpreter (lift-to-ancestor):
 * - hidden endpoint lifts the edge to the nearest rendered ancestor;
 * - both endpoints inside the same collapsed subtree → edge suppressed;
 * - the whole subtree of a collapsed container is hidden.
 *
 * Pure module: no joiner/react imports; unit-tested in ir.test.ts.
 */

import type { Edge, Node } from '@xyflow/react';
import type { ReadCtx } from './irReadCtx';
import type { CompiledView } from './irTypes';
import type { IRViewpointIndex } from './irResolveCore';
import { resolveIRView } from './irResolveCore';
import { assignGeometricHandles } from './irEdgeViews';

type Idlookup = Record<string, any>;

export interface ContainerInfo {
    objectId: string;
    vertexId: string;
    collapsible: boolean;
}

export interface ContainmentModel {
    /** container objectId → info */
    containers: Map<string, ContainerInfo>;
    /** container objectId → child objectIds (containment references, childFilter applied) */
    childrenOf: Map<string, string[]>;
    /** child objectId → container objectId */
    parentOf: Map<string, string>;
    /** vertexId → objectId for all object nodes on canvas */
    objByVertex: Map<string, string>;
    /** objectId → vertexId (reverse) */
    vertexByObj: Map<string, string>;
}

/** Child object pointers of `objectId` through composition references (D-layer walk). */
export function containmentChildren(idlookup: Idlookup, objectId: string): string[] {
    const dObject = idlookup[objectId];
    if (!dObject?.features) return [];
    const out: string[] = [];
    for (const fid of dObject.features) {
        const dValue = idlookup[fid];
        if (!dValue) continue;
        const feat = idlookup[dValue.instanceof];
        if (!feat || feat.className !== 'DReference' || !feat.composition) continue;
        const vals = dValue.values;
        if (!Array.isArray(vals)) continue;
        for (const v of vals) {
            if (typeof v === 'string' && idlookup[v]) out.push(v);
        }
    }
    return out;
}

/**
 * Fase R2 SSOT: the containment children of `selfId` rendered as inline rows, given
 * the self's already-resolved CompiledView. Shared verbatim by the renderer
 * (IRNodeContent iterates these) AND the presentation pass (computeRowHiddenChildren
 * hides these) — never computed twice (spec R2 P3).
 *
 * Empty when the view has no `children`-source compartment. Otherwise the
 * containmentChildren of `selfId` (D-layer order), each kept when it passes at least
 * one children compartment's compiled `childFilter` (absent filter = all children).
 * Multiple children compartments union without duplicates, first-occurrence order
 * preserved (iteration is a single pass over containmentChildren).
 */
export function rowRenderedChildren(
    compiled: CompiledView,
    readCtx: ReadCtx,
    selfId: string,
    idlookup: Idlookup,
): string[] {
    const compartments = compiled.fieldCompartments.filter(fc => fc.source === 'children');
    if (compartments.length === 0) return [];
    const children = containmentChildren(idlookup, selfId);
    if (children.length === 0) return [];
    const out: string[] = [];
    for (const childId of children) {
        let included = false;
        for (const fc of compartments) {
            let ok = true;
            if (fc.childFilter) {
                try { ok = fc.childFilter(readCtx, childId); } catch { ok = false; }
            }
            if (ok) { included = true; break; }
        }
        if (included) out.push(childId);
    }
    return out;
}

/** True when any resolved view of the index declares a `children`-source compartment
 *  (Fase R2 fast path: skip the per-node row scan entirely for viewpoints without one). */
function indexHasRowCompartments(index: IRViewpointIndex): boolean {
    const has = (cv: CompiledView) => cv.fieldCompartments.some(fc => fc.source === 'children');
    for (const entries of index.byMetaclass.values()) {
        for (const e of entries) if (has(e.compiled)) return true;
    }
    for (const e of index.wildcard) if (has(e.compiled)) return true;
    return false;
}

/**
 * Objects hidden because they are rendered as inline rows in some vertex view's
 * `children` compartment (Fase R2). SSOT via rowRenderedChildren, shared with the
 * renderer. Fast path: empty set (no per-node work) when no view declares a children
 * compartment. Only vertex views host row compartments (graphVertex uses hulls).
 */
export function computeRowHiddenChildren(
    nodes: Node[],
    idlookup: Idlookup,
    index: IRViewpointIndex | null,
    readCtx: ReadCtx,
): Set<string> {
    const hidden = new Set<string>();
    if (!index || !indexHasRowCompartments(index)) return hidden;
    for (const n of nodes) {
        if (n.type !== 'objectNode') continue;
        const objectId = idlookup[n.id]?.model;
        if (typeof objectId !== 'string') continue;
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') continue;
        const cv = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);
        if (!cv || cv.kind !== 'vertex') continue;
        for (const childId of rowRenderedChildren(cv, readCtx, objectId, idlookup)) hidden.add(childId);
    }
    return hidden;
}

/**
 * Build the containment model for the current canvas. O(nodes + refs).
 * Containers = object nodes whose resolved IR view is kind 'graphVertex'.
 */
export function buildContainmentModel(
    nodes: Node[],
    idlookup: Idlookup,
    index: IRViewpointIndex | null,
    readCtx: ReadCtx,
): ContainmentModel {
    const model: ContainmentModel = {
        containers: new Map(),
        childrenOf: new Map(),
        parentOf: new Map(),
        objByVertex: new Map(),
        vertexByObj: new Map(),
    };
    if (!index) return model;
    for (const n of nodes) {
        if (n.type !== 'objectNode') continue;
        const objectId = idlookup[n.id]?.model;
        if (typeof objectId !== 'string') continue;
        model.objByVertex.set(n.id, objectId);
        model.vertexByObj.set(objectId, n.id);
    }
    for (const [vertexId, objectId] of model.objByVertex) {
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') continue;
        const cv = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);
        if (!cv || cv.kind !== 'graphVertex' || !cv.containment) continue;
        const children = containmentChildren(idlookup, objectId)
            .filter(childId => {
                try { return cv.containment!.childFilter(readCtx, childId); } catch { return false; }
            });
        model.containers.set(objectId, { objectId, vertexId, collapsible: cv.containment.collapsible });
        model.childrenOf.set(objectId, children);
        for (const c of children) {
            // first containment wins (a child has one parent in a well-formed model)
            if (!model.parentOf.has(c)) model.parentOf.set(c, objectId);
        }
    }
    return model;
}

/** objectIds hidden because some ancestor container is collapsed (whole subtrees). */
export function computeHidden(model: ContainmentModel, collapsed: Set<string>): Set<string> {
    const hidden = new Set<string>();
    const visit = (objectId: string, ancestorCollapsed: boolean) => {
        if (ancestorCollapsed) hidden.add(objectId);
        const children = model.childrenOf.get(objectId);
        if (!children) return;
        const nowCollapsed = ancestorCollapsed || collapsed.has(objectId);
        for (const c of children) visit(c, nowCollapsed);
    };
    // roots = containers that are not themselves children
    for (const containerId of model.containers.keys()) {
        if (!model.parentOf.has(containerId)) visit(containerId, false);
    }
    return hidden;
}

/**
 * Lift-to-ancestor: nearest rendered (non-hidden) ancestor of a hidden object.
 * Returns the objectId to attach to, or null when no ancestor is rendered.
 * For a visible object returns the object itself.
 */
export function liftEndpoint(objectId: string, model: ContainmentModel, hidden: Set<string>): string | null {
    if (!hidden.has(objectId)) return objectId;
    let cur: string | undefined = model.parentOf.get(objectId);
    const seen = new Set<string>();
    while (cur && !seen.has(cur)) {
        seen.add(cur);
        if (!hidden.has(cur)) return cur;
        cur = model.parentOf.get(cur);
    }
    return null;
}

/** Apply hidden flags to nodes (pure; returns the same array when nothing changes). */
export function decorateNodes(nodes: Node[], model: ContainmentModel, hidden: Set<string>): Node[] {
    if (hidden.size === 0) return nodes;
    let changed = false;
    const out = nodes.map(n => {
        const objectId = model.objByVertex.get(n.id);
        const shouldHide = objectId !== undefined && hidden.has(objectId);
        if (shouldHide === !!n.hidden) return n;
        changed = true;
        return { ...n, hidden: shouldHide };
    });
    return changed ? out : nodes;
}

/**
 * Apply lift-to-ancestor to edges (pure).
 * - endpoint hidden → remap to nearest rendered ancestor's vertex (handles dropped,
 *   marked data.irLifted for styling); duplicate lifted pairs are deduped;
 * - both endpoints lift to the same vertex (or an endpoint has no rendered
 *   ancestor) → edge suppressed.
 */
export function decorateEdges(edges: Edge[], model: ContainmentModel, hidden: Set<string>, nodes?: Node[]): Edge[] {
    if (hidden.size === 0) return edges;
    const nodesById = nodes ? new Map(nodes.map(n => [n.id, n] as const)) : null;
    const out: Edge[] = [];
    const liftedPairs = new Set<string>();
    let changed = false;
    for (const e of edges) {
        const srcObj = model.objByVertex.get(e.source);
        const tgtObj = model.objByVertex.get(e.target);
        const srcHidden = srcObj !== undefined && hidden.has(srcObj);
        const tgtHidden = tgtObj !== undefined && hidden.has(tgtObj);
        if (!srcHidden && !tgtHidden) { out.push(e); continue; }
        changed = true;
        const liftedSrcObj = srcObj ? liftEndpoint(srcObj, model, hidden) : null;
        const liftedTgtObj = tgtObj ? liftEndpoint(tgtObj, model, hidden) : null;
        if (!liftedSrcObj || !liftedTgtObj) continue;               // no rendered ancestor → suppress
        if (liftedSrcObj === liftedTgtObj) continue;                 // internal to one collapsed subtree → suppress
        const liftedSrcVertex = model.vertexByObj.get(liftedSrcObj);
        const liftedTgtVertex = model.vertexByObj.get(liftedTgtObj);
        if (!liftedSrcVertex || !liftedTgtVertex) continue;
        const pairKey = `${liftedSrcVertex}→${liftedTgtVertex}`;
        if (liftedPairs.has(pairKey)) continue;                      // dedupe lifted bundles
        liftedPairs.add(pairKey);
        let lifted: Edge = {
            ...e,
            id: `${e.id}__irlift`,
            source: liftedSrcVertex,
            target: liftedTgtVertex,
            sourceHandle: undefined,
            targetHandle: undefined,
            data: { ...(e.data ?? {}), irLifted: true },
        };
        // Orthogonal entry on the lifted endpoints (same contract as synthetic edges).
        if (nodesById) lifted = assignGeometricHandles(lifted, nodesById, out);
        out.push(lifted);
    }
    return changed ? out : edges;
}

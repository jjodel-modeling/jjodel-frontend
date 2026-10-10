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
import { findFeatureRaw, navigateRefHop } from './irReadCtx';
import type { CompiledPathStep, CompiledView } from './irTypes';
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
    /** child objectId → container objectId, from the COMPLETE composition walk:
     *  no view filter, so it also covers objects that have no vertex of their own
     *  (R-B14). Distinct from `parentOf`, which stays restricted to the children of
     *  graphVertex containers and is not reused for endpoint resolution. */
    containerOf?: Map<string, string>;
    /** Every object reached by that walk, seeds included — the candidate pool the
     *  object-as-edge synthesis iterates instead of the RF nodes (R-B14). */
    walkedObjects?: Set<string>;
    /** vertexId → objectId for all object nodes on canvas */
    objByVertex: Map<string, string>;
    /** objectId → vertexId (reverse) */
    vertexByObj: Map<string, string>;
    /** R-GV-2: object → every container that claims it, canvas order; only objects with two or more claimants.
     *  `parentOf` holds the winner. Read by the problems overlay (slice S2). */
    multiClaimed?: Map<string, string[]>;
    /** R-GV-2 (spec addendum §4.1): objects with a node that sit in the composition slot of an object claimed through
     *  a declared channel, pass that claimant's childFilter, and are claimed by no container. */
    unclaimed?: Set<string>;
    /** R-GV-2 (spec addendum §4.2): DValue ids read by the declared channels (every hop's slot and the terminal
     *  slot), for the invalidation signature of the presentation pass (slice S2). */
    channelSlots?: Set<string>;
}

/** A slot value as an element id: draw yields strings, defensive on proxy objects (as irReadCtx's pointerToId). */
function idOf(x: unknown): string | null {
    if (typeof x === 'string') return x;
    if (x && typeof x === 'object' && typeof (x as { id?: unknown }).id === 'string') return (x as { id: string }).id;
    return null;
}

/**
 * The objects a declared children channel (R-GV-1) reaches from `objectId`, and the DValue ids it reads, on the
 * D-layer with draw semantics. Hops navigate through `navigateRefHop`, the contract the compiled accessors and the
 * cross-dep concretization share (`value` = first, N = values[N], a whole-array hop dead-ends); the terminal step
 * reads `value` (first), `values[N]` or `values` (all). Values that are not element ids are dropped. A slot read
 * before a dead end is still reported: its change may revive the channel.
 */
export function resolveChildrenChannel(
    idlookup: Idlookup,
    objectId: string,
    steps: CompiledPathStep[],
): { childIds: string[]; slotIds: string[] } {
    const slotIds: string[] = [];
    let current = objectId;
    for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        const dValue = findFeatureRaw(idlookup, current, step.feature);
        if (dValue && typeof dValue.id === 'string') slotIds.push(dValue.id);
        if (i < steps.length - 1) {
            const next = navigateRefHop(idlookup, current, step.feature, step.take);
            if (next === null) return { childIds: [], slotIds };
            current = next;
            continue;
        }
        const vals: unknown[] = Array.isArray(dValue?.values) ? dValue.values : [];
        const picked = step.take === 'values' ? vals
            : step.take === 'value' ? vals.slice(0, 1)
                : vals.slice(step.take, step.take + 1);
        const childIds: string[] = [];
        for (const v of picked) {
            const id = idOf(v);
            if (id !== null && idlookup[id]) childIds.push(id);
        }
        return { childIds, slotIds };
    }
    return { childIds: [], slotIds };
}

/** The composition slot (DValue) of `containerId` that lists `childId`, or null. */
function compositionSlotOf(idlookup: Idlookup, containerId: string, childId: string): any | null {
    const dObject = idlookup[containerId];
    if (!dObject?.features) return null;
    for (const fid of dObject.features) {
        const dValue = idlookup[fid];
        if (!dValue || !Array.isArray(dValue.values)) continue;
        const feat = idlookup[dValue.instanceof];
        if (!feat || feat.className !== 'DReference' || !feat.composition) continue;
        if (dValue.values.includes(childId)) return dValue;
    }
    return null;
}

/** One container's claim: the objects its channel yields after childFilter, in channel order. */
interface Claim {
    containerId: string;
    children: string[];
    view: CompiledView;
    /** Through a declared `containment.children` channel (R-GV-1), not the default composition channel. */
    declared: boolean;
    /** Canvas order of the container. */
    order: number;
}

/**
 * The single visual parent of every claimed object (R-GV-2, spec addendum §4): the deepest claimant wins, then the
 * first in canvas order; a link that would close a claim cycle is not set. Depth is the shortest claim path from a
 * container no one claims (depth 0); a container on a claim cycle unreachable from such a root has depth -1.
 * Returns the parent map and the objects with two or more claimants. Pure.
 */
export function resolveVisualParents(claims: ReadonlyArray<Pick<Claim, 'containerId' | 'children' | 'order'>>): {
    parentOf: Map<string, string>;
    multiClaimed: Map<string, string[]>;
} {
    const claimantsOf = new Map<string, Array<Pick<Claim, 'containerId' | 'order'>>>();
    for (const cl of claims) {
        for (const child of cl.children) {
            const list = claimantsOf.get(child);
            if (list) list.push(cl);
            else claimantsOf.set(child, [cl]);
        }
    }
    const childrenOfContainer = new Map(claims.map(cl => [cl.containerId, cl.children] as const));
    const depth = new Map<string, number>();
    const queue: string[] = [];
    for (const cl of claims) {
        if (!claimantsOf.has(cl.containerId)) { depth.set(cl.containerId, 0); queue.push(cl.containerId); }
    }
    for (let i = 0; i < queue.length; i++) {
        const id = queue[i];
        const d = depth.get(id)!;
        for (const child of childrenOfContainer.get(id) ?? []) {
            if (!childrenOfContainer.has(child) || depth.has(child)) continue;
            depth.set(child, d + 1);
            queue.push(child);
        }
    }
    const rank = (containerId: string) => depth.get(containerId) ?? -1;

    const parentOf = new Map<string, string>();
    const multiClaimed = new Map<string, string[]>();
    // Would `parent` becoming the parent of `child` close a cycle through the links already set?
    const closesCycle = (child: string, parent: string): boolean => {
        const seen = new Set<string>();
        for (let cur: string | undefined = parent; cur !== undefined && !seen.has(cur); cur = parentOf.get(cur)) {
            if (cur === child) return true;
            seen.add(cur);
        }
        return false;
    };
    for (const [child, claimants] of claimantsOf) {
        if (claimants.length > 1) multiClaimed.set(child, claimants.map(c => c.containerId));
        const ranked = [...claimants].sort((a, b) => rank(b.containerId) - rank(a.containerId) || a.order - b.order);
        for (const c of ranked) {
            if (closesCycle(child, c.containerId)) continue;
            parentOf.set(child, c.containerId);
            break;
        }
    }
    return { parentOf, multiClaimed };
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
 * Complete composition walk from the canvas roots (R-B14): the child → container
 * map and the set of every object reached, seeds included.
 *
 * Reads slots only, never `father`: an object created by the canvas keeps
 * `father = DModel` (canvasToJjom, "fatherType — MUST be DModel") so the backward
 * link does not carry the containment, while the pointer in the container's
 * composition slot is there in both forms. The walk therefore also reaches the
 * nested form (`father = DValue`), whose objects are absent from DModel.objects and
 * have no DVertex — the form the endpoint token exists for.
 *
 * First container wins (one parent per child in a well-formed model); a cycle in
 * the slots terminates the walk instead of hanging it.
 */
function walkContainment(
    idlookup: Idlookup,
    roots: Iterable<string>,
): { containerOf: Map<string, string>; walkedObjects: Set<string> } {
    const containerOf = new Map<string, string>();
    const walkedObjects = new Set<string>();
    const queue: string[] = [];
    for (const rootId of roots) {
        if (walkedObjects.has(rootId)) continue;
        walkedObjects.add(rootId);
        queue.push(rootId);
    }
    for (let i = 0; i < queue.length; i++) {
        const objectId = queue[i];
        for (const childId of containmentChildren(idlookup, objectId)) {
            if (!containerOf.has(childId)) containerOf.set(childId, objectId);
            if (walkedObjects.has(childId)) continue;   // seed, or already walked
            walkedObjects.add(childId);
            queue.push(childId);
        }
    }
    return { containerOf, walkedObjects };
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
    // Complete containment walk (R-B14), seeded by the objects on canvas: every
    // DModel.objects entry gets a DVertex, so those are the model roots, and the
    // walk continues through composition slots down to the vertex-less nested
    // objects. Independent of `index`: no view has to resolve for a parent to exist.
    const walk = walkContainment(idlookup, model.objByVertex.values());
    model.containerOf = walk.containerOf;
    model.walkedObjects = walk.walkedObjects;
    // Claims (R-GV-1): the default channel is the composition children, as before; a declared channel is resolved
    // on the D-layer and its slots are recorded for the invalidation signature (R-GV-2, spec addendum §4.2).
    const claims: Claim[] = [];
    const channelSlots = new Set<string>();
    for (const [vertexId, objectId] of model.objByVertex) {
        const metaclassId = idlookup[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') continue;
        const cv = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);
        if (!cv || cv.kind !== 'graphVertex' || !cv.containment) continue;
        const channel = cv.containment.channel;
        let raw: string[];
        if (channel) {
            const resolved = resolveChildrenChannel(idlookup, objectId, channel.steps);
            for (const s of resolved.slotIds) channelSlots.add(s);
            raw = resolved.childIds;
        } else {
            raw = containmentChildren(idlookup, objectId);
        }
        const seen = new Set<string>();
        const children = raw.filter(childId => {
            if (childId === objectId || seen.has(childId)) return false;
            seen.add(childId);
            try { return cv.containment!.childFilter(readCtx, childId); } catch { return false; }
        });
        model.containers.set(objectId, { objectId, vertexId, collapsible: cv.containment.collapsible });
        claims.push({ containerId: objectId, children, view: cv, declared: !!channel, order: claims.length });
    }
    // Single visual parent (R-GV-2): the innermost claimant wins, then canvas order. For composition channels in a
    // well-formed model every object has one claimant, so this is the "first containment wins" of before.
    const { parentOf, multiClaimed } = resolveVisualParents(claims);
    model.parentOf = parentOf;
    for (const cl of claims) {
        model.childrenOf.set(cl.containerId, cl.children.filter(c => parentOf.get(c) === cl.containerId));
    }
    model.multiClaimed = multiClaimed;
    model.channelSlots = channelSlots;
    model.unclaimed = computeUnclaimed(claims, idlookup, model, readCtx);
    return model;
}

/**
 * Unclaimed objects (R-GV-2, spec addendum §4.1): for every object claimed through a declared channel, the other
 * values of its composition slot that have a node, pass that claimant's childFilter, and are claimed by no one.
 * Default (composition) channels contribute nothing. Pure over its inputs.
 */
function computeUnclaimed(claims: Claim[], idlookup: Idlookup, model: ContainmentModel, readCtx: ReadCtx): Set<string> {
    const out = new Set<string>();
    const claimed = new Set<string>();
    for (const cl of claims) for (const c of cl.children) claimed.add(c);
    for (const cl of claims) {
        if (!cl.declared) continue;
        const slotsSeen = new Set<string>();
        for (const child of cl.children) {
            const owner = model.containerOf?.get(child);
            if (owner === undefined) continue;
            const slot = compositionSlotOf(idlookup, owner, child);
            if (!slot || slotsSeen.has(slot.id)) continue;
            slotsSeen.add(slot.id);
            for (const v of slot.values as unknown[]) {
                const sib = idOf(v);
                if (sib === null || claimed.has(sib) || !model.vertexByObj.has(sib)) continue;
                let passes = false;
                try { passes = cl.view.containment!.childFilter(readCtx, sib); } catch { passes = false; }
                if (passes) out.add(sib);
            }
        }
    }
    return out;
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

/**
 * The objects whose resolved vertex view resolves `visible` false (P-2026-10-03-1304, Q7): not drawn, whatever refers
 * to them; the view hides the class. Empty at once when no view of the index declares the key. Pure.
 */
export function computeViewHidden(nodes: Node[], objByVertex: Map<string, string>, index: IRViewpointIndex, readCtx: ReadCtx, idlookup: Record<string, any>): Set<string> {
    const out = new Set<string>();
    const declares = (entries: ReadonlyArray<{ compiled: CompiledView }>) => entries.some(e => !!e.compiled.visible);
    if (![...index.byMetaclass.values()].some(declares) && !declares(index.wildcard)) return out;
    for (const n of nodes) {
        const objectId = objByVertex.get(n.id);
        const metaclassId = objectId ? idlookup[objectId]?.instanceof : undefined;
        if (!objectId || typeof metaclassId !== 'string') continue;
        const view = resolveIRView(objectId, metaclassId, index, readCtx, idlookup);
        if (!view?.visible) continue;
        let shown = true;
        try { shown = view.visible(readCtx, objectId) !== false; } catch { shown = true; }
        if (!shown) out.add(objectId);
    }
    return out;
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
            // D2 (pre-lift matching): preserve the ORIGINAL endpoint object ids so the edge-view
            // resolver (decorateReferenceEdges) matches on the semantic source, not the ancestor.
            data: { ...(e.data ?? {}), irLifted: true, irSourceObjectId: srcObj, irTargetObjectId: tgtObj },
        };
        // Orthogonal entry on the lifted endpoints (same contract as synthetic edges).
        if (nodesById) lifted = assignGeometricHandles(lifted, nodesById, out);
        out.push(lifted);
    }
    return changed ? out : edges;
}

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
import type { ChannelEdges, CompiledContainmentLayout, CompiledPathStep, CompiledView, ContainmentMembership } from './irTypes';
import { layoutPartitions, MIN_PARTITION_EXTENT, partitionExtent, resizePartitionBorder, type PartitionSpec } from './irPartitions';
import { frameBox } from './irFrame';
import { readVertexLayout, type VertexLayoutSource } from '../layout/vertexLayout';
import type { IRViewpointIndex } from './irResolveCore';
import { resolveIRView } from './irResolveCore';
import { assignGeometricHandles } from './irEdgeViews';

type Idlookup = Record<string, any>;

export interface ContainerInfo {
    objectId: string;
    vertexId: string;
    collapsible: boolean;
    /** R-GV keys of the container's view, each present only when declared (so a legacy container keeps its three). */
    /** Declared `containment.layout` (R-GV-5). */
    layout?: CompiledContainmentLayout;
    /** Declared `containment.edges` (R-GV-4). */
    edges?: ChannelEdges;
    /** Declared channel (R-GV-1): its feature when single-hop, null when multi-hop. Absent = the composition channel. */
    channelFeature?: string | null;
    /** Declared channel's steps (R-GV-1), for the terminal slot a membership edit writes (S3). */
    channelSteps?: CompiledPathStep[];
    /** Declared `containment.membership` (R-GV-8, S3). */
    membership?: ContainmentMembership;
    /** Declared single-hop channel: what its slot holds, before any filter (S3), so an edge of the feature to an object
     *  the slot no longer holds reads as stale. */
    channelValues?: ReadonlySet<string>;
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
 * compartment. A graphVertex hosts them too since S2 (D-c, R-GV-3: the row wins over the
 * containment channel, which then leaves the object out, buildContainmentModel).
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
        if (!cv || (cv.kind !== 'vertex' && cv.kind !== 'graphVertex')) continue;
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
        // D-c (R-GV-3): what a `children` row compartment of this same view draws is a row, and leaves the channel.
        const rows = cv.fieldCompartments.some(fc => fc.source === 'children')
            ? new Set(rowRenderedChildren(cv, readCtx, objectId, idlookup)) : null;
        const seen = new Set<string>();
        const children = raw.filter(childId => {
            if (childId === objectId || seen.has(childId) || rows?.has(childId)) return false;
            seen.add(childId);
            try { return cv.containment!.childFilter(readCtx, childId); } catch { return false; }
        });
        const info: ContainerInfo = { objectId, vertexId, collapsible: cv.containment.collapsible };
        if (cv.containment.layout) info.layout = cv.containment.layout;
        if (cv.containment.edges) info.edges = cv.containment.edges;
        if (channel) info.channelFeature = channel.steps.length === 1 ? channel.steps[0].feature : null;
        if (channel) info.channelSteps = channel.steps;
        if (cv.containment.membership) info.membership = cv.containment.membership;
        if (channel && channel.steps.length === 1) info.channelValues = new Set(raw);
        model.containers.set(objectId, info);
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

/** z-index of a container that declares a layout, plus its depth (R-GV-6): under the edges (z 0) and the flow nodes,
 *  even when selected (React Flow lifts a selected node by 1000), deeper containers above shallower ones. */
export const LAYOUT_CONTAINER_Z = -2000;
/** What React Flow adds to the z-index of a selected node (`elevateNodesOnSelect`, @xyflow/system). */
export const SELECTED_NODE_LIFT = 1000;
/** Space kept around the children of a partition that is not sized by hand, px (spec addendum §7.1, content). */
export const PARTITION_CONTENT_MARGIN = 16;
/** Class of every partition after the first, by axis: it drops its leading border, which the previous partition's
 *  trailing border already draws, so two lanes share one line (irStyle.ts). Geometry unchanged. */
export const PARTITION_NEXT_CLASS = { vertical: 'ir-partition-next-v', horizontal: 'ir-partition-next-h' } as const;
/** Class of every partition before the last when the layout declares `separator: 'dashed'` (S2b): its trailing border,
 *  the shared line, is drawn dashed (irStyle.ts). Geometry unchanged. */
export const PARTITION_DASHED_CLASS = { vertical: 'ir-partition-sep-dashed-v', horizontal: 'ir-partition-sep-dashed-h' } as const;
const PARTITION_CLASSES = new Set<string>([...Object.values(PARTITION_NEXT_CLASS), ...Object.values(PARTITION_DASHED_CLASS)]);

/** How far past the box a container had before a drag the pointer may go and the container still follow the dragged
 *  child, px on every side (R-GV-17, P-2026-10-11-1156): within it the frame grows to hold the whole child. */
export const FOLLOW_BAND = 32;

/** The pointer of the node drag in progress, flow coordinates; null when no drag reports one. */
let dragPointer: { x: number; y: number } | null = null;
/** Set by the canvas on every move of a node drag (React Flow `onNodeDrag`), cleared at its end (`onNodeDragStop`):
 *  the follow test of `applyContainerLayout` reads where the cursor is, which no node carries. */
export function setDragPointer(p: { x: number; y: number } | null): void {
    dragPointer = p && Number.isFinite(p.x) && Number.isFinite(p.y) ? { x: p.x, y: p.y } : null;
}

type Box = { x: number; y: number; w: number; h: number };
const sizeOf = (n: Node): { w: number; h: number } => ({
    w: (n.measured?.width ?? n.width ?? 160) as number,
    h: (n.measured?.height ?? n.height ?? 60) as number,
});

/** Every object a container draws, at any depth, through the visual-parent forest (cycle-safe). */
export function descendantsOf(model: ContainmentModel, objectId: string): string[] {
    const out: string[] = [];
    const seen = new Set<string>([objectId]);
    const queue = [...(model.childrenOf.get(objectId) ?? [])];
    for (let i = 0; i < queue.length; i++) {
        const o = queue[i];
        if (seen.has(o)) continue;
        seen.add(o);
        out.push(o);
        for (const k of model.childrenOf.get(o) ?? []) queue.push(k);
    }
    return out;
}

/** Depth of a container in the visual-parent forest (R-GV-2): 0 for one no container draws. */
function depthIn(model: ContainmentModel, objectId: string): number {
    let d = 0;
    const seen = new Set<string>();
    for (let c = model.parentOf.get(objectId); c !== undefined && !seen.has(c); c = model.parentOf.get(c)) {
        seen.add(c);
        d++;
    }
    return d;
}

/**
 * The S2 presentation pass of the containers that declare a `layout` (R-GV-5..7, spec addendum §3 and §7), in session
 * only: nothing here reaches the D-layer (R-LAY-4, a derived box). Pure.
 *
 * - Every such container, and every partition of a `partitions` container, goes under the edges and the flow nodes:
 *   z-index `LAYOUT_CONTAINER_Z` plus its depth.
 * - A `partitions` container stacks its visible children along its axis (`irPartitions.layoutPartitions`), from where
 *   its node is now (a drag moves it, R-GV-6) and its record under `layoutKey` (`isResized` and its size, R-LAY-14).
 *   A partition sized by hand keeps its record's extent; one that is not takes what its own children need (their span
 *   plus `PARTITION_CONTENT_MARGIN` on both sides, its band included, or the stack of its own partitions). Outer
 *   containers first, so a nested one stacks inside the box its parent gave it.
 * - Children of a partition (the flow nodes of a lane) are not moved: the gesture that moves them is slice S3.
 * - A `free` container that declares `frame: 'self'` (S2b, spec addendum §11) is the box of its visible children (an
 *   inner self-framing child counted by its own box), plus its padding and band, never smaller than a size set by hand
 *   (`irFrame.frameBox`). Inner frames first; a partitions container sizes a partition by the frames inside it.
 * - A container being dragged (S3) carries its descendants: each is drawn offset by the container's move from where it
 *   rests (its record, or its frame for a self-framing one), and the boxes above are computed from those positions.
 *
 * Returns `nodes` itself when nothing changes, so the memo downstream sees no new array.
 */
export function applyContainerLayout(
    nodes: Node[],
    model: ContainmentModel,
    idlookup: Idlookup,
    layoutKey: string | null,
    hidden: Set<string>,
): Node[] {
    const layoutContainers = [...model.containers.values()].filter(c => c.layout && !hidden.has(c.objectId));
    if (layoutContainers.length === 0) return nodes;
    const byId = new Map(nodes.map(n => [n.id, n] as const));
    const recOf = (vertexId: string) => readVertexLayout((idlookup[vertexId] ?? {}) as VertexLayoutSource, layoutKey);
    const visibleKids = (objectId: string): string[] =>
        (model.childrenOf.get(objectId) ?? []).filter(c => {
            if (hidden.has(c)) return false;
            const v = model.vertexByObj.get(c);
            const n = v !== undefined ? byId.get(v) : undefined;
            return !!n && !n.hidden;
        });

    // While a node is dragged (R-GV-17), the pass runs twice: once at rest (every dragged node at its record, nothing
    // carried), for the boxes the containers had before the gesture; then live. A dragged node whose pointer (the cursor,
    // `setDragPointer`; its centre when none is known) has left the box its container had at rest, grown by FOLLOW_BAND on
    // every side, is pinned: that container, and the ones around it, count it where it rests, so the frame does not chase
    // a child the pointer has taken out (the drop then follows the membership, S3). Within the band the frame contains
    // the whole child. The test is against the box at rest, never the growing one: no runaway.
    let patch: Map<string, Partial<Box> & { z?: number; cls?: string }>;
    if (!nodes.some(n => n.dragging)) {
        patch = layoutPass(null, new Map()).patch;
    } else {
        const rest = layoutPass(null, new Map());
        const pinned = new Map<string, Box>();
        for (const n of nodes) {
            if (!n.dragging) continue;
            const o = model.objByVertex.get(n.id);
            const parent = o !== undefined ? model.parentOf.get(o) : undefined;
            const pb = parent !== undefined ? rest.boxOf(parent) : null;
            const own = o !== undefined ? rest.boxOf(o) : null;
            if (!pb || !own || !model.containers.get(parent!)?.layout) continue;
            const s = sizeOf(n);
            const at = dragPointer ?? { x: n.position.x + s.w / 2, y: n.position.y + s.h / 2 };
            const b = FOLLOW_BAND;
            if (at.x < pb.x - b || at.x > pb.x + pb.w + b || at.y < pb.y - b || at.y > pb.y + pb.h + b) pinned.set(o!, own);
        }
        patch = layoutPass(rest.boxOf, pinned).patch;
    }

    function layoutPass(restBoxOf: ((objectId: string) => Box | null) | null, pinned: Map<string, Box>) {
    const atRest = restBoxOf === null;
    const patch = new Map<string, Partial<Box> & { z?: number; cls?: string }>();

    // Drag offsets (S3): an object a dragged container carries, by object id. Empty until computed below, from the
    // geometry at rest; every position read after that goes through `posOf`. In the pass at rest a dragged node is read
    // at its record.
    const offset = new Map<string, { x: number; y: number }>();
    const posOf = (n: Node, objectId: string | undefined) => {
        if (atRest && n.dragging) { const r = recOf(n.id); return { x: r.x, y: r.y }; }
        const o = objectId !== undefined ? offset.get(objectId) : undefined;
        return o ? { x: n.position.x + o.x, y: n.position.y + o.y } : n.position;
    };
    // Where a container's own record sits now: its node's position at rest; dragged, its record moved by the drag (the
    // node's move from the box it was drawn in at rest), so the far border of a size set by hand moves with it.
    const anchorOf = (n: Node, objectId: string) => {
        const was = !atRest && n.dragging ? restBoxOf!(objectId) : null;
        if (!was) return posOf(n, objectId);
        const r = recOf(n.id);
        return { x: r.x + n.position.x - was.x, y: r.y + n.position.y - was.y };
    };
    const nodeBox = (objectId: string): Box => {
        const n = byId.get(model.vertexByObj.get(objectId)!)!;
        const p = posOf(n, objectId);
        const s = sizeOf(n);
        return { x: p.x, y: p.y, w: s.w, h: s.h };
    };
    const isSelf = (objectId: string): boolean => {
        const l = model.containers.get(objectId)?.layout;
        return l?.mode === 'free' && l.frame === 'self';
    };
    // The frame of a self-framing container (S2b), from its visible children's boxes. Memoized, cycle-guarded.
    // Collapsed (no visible child, hidden ones), it keeps the place its children's frame gives it at its own size:
    // `anchoredOnly` holds it, and only its position is patched.
    const frameMemo = new Map<string, Box | null>();
    const anchoredOnly = new Set<string>();
    const frameOf = (objectId: string, seen: Set<string> = new Set()): Box | null => {
        if (frameMemo.has(objectId)) return frameMemo.get(objectId)!;
        if (!isSelf(objectId) || seen.has(objectId)) return null;
        seen.add(objectId);
        const info = model.containers.get(objectId)!;
        const node = byId.get(info.vertexId);
        let out: Box | null = null;
        if (node && !node.hidden && !hidden.has(objectId)) {
            const rec = recOf(info.vertexId);
            // Being resized, the live size is the floor; at rest, the record's when sized by hand.
            const stored = node.resizing === true
                ? { w: (node.measured?.width ?? node.width) as number | undefined, h: (node.measured?.height ?? node.height) as number | undefined, isResized: true }
                : { w: rec.w, h: rec.h, isResized: !!rec.isResized };
            const frameOver = (kids: string[]) => frameBox({
                children: kids.map(k => pinned.get(k) ?? frameOf(k, seen) ?? stackOf(k) ?? nodeBox(k)),
                padding: info.layout!.padding, header: info.layout!.header, stored,
            });
            out = frameOver(visibleKids(objectId));
            if (!out) {
                const all = (model.childrenOf.get(objectId) ?? []).filter(k => byId.has(model.vertexByObj.get(k) ?? ''));
                const anchor = frameOver(all);
                if (anchor) {
                    const own = sizeOf(node);
                    out = { x: anchor.x, y: anchor.y, w: own.w, h: own.h };
                    anchoredOnly.add(objectId);
                }
            }
        }
        frameMemo.set(objectId, out);
        return out;
    };

    // What a container's own children need, as a box size (spec addendum §7.1, content), and, when they are not a stack,
    // the box they need in absolute coordinates: from their near edges less the margin and the band, to their far edges
    // plus the margin (R-GV-17). Memoized, cycle-guarded.
    type Need = { w: number; h: number; start?: { x: number; y: number }; end?: { x: number; y: number } };
    const needMemo = new Map<string, Need>();
    const needOf = (objectId: string, seen: Set<string> = new Set()): Need => {
        const memo = needMemo.get(objectId);
        if (memo) return memo;
        if (seen.has(objectId)) return { w: 0, h: 0 };
        seen.add(objectId);
        const info = model.containers.get(objectId);
        const layout = info?.layout;
        const kids = visibleKids(objectId);
        let out: Need = { w: 0, h: 0 };
        if (layout?.mode === 'partitions') {
            const l = layoutPartitions({
                container: { x: 0, y: 0 }, axis: layout.axis, header: layout.header, padding: layout.padding,
                partitions: kids.map(k => specOf(k, layout.axis, seen)),
            });
            out = { w: l.container.w, h: l.container.h };
        } else if (kids.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const k of kids) {
                const r = pinned.get(k) ?? frameOf(k) ?? stackOf(k) ?? nodeBox(k);
                minX = Math.min(minX, r.x); minY = Math.min(minY, r.y);
                maxX = Math.max(maxX, r.x + r.w); maxY = Math.max(maxY, r.y + r.h);
            }
            const band = layout?.header;
            out = {
                w: maxX - minX + 2 * PARTITION_CONTENT_MARGIN + (band?.side === 'w' ? band.size : 0),
                h: maxY - minY + 2 * PARTITION_CONTENT_MARGIN + (band?.side === 'n' ? band.size : 0),
                start: {
                    x: minX - PARTITION_CONTENT_MARGIN - (band?.side === 'w' ? band.size : 0),
                    y: minY - PARTITION_CONTENT_MARGIN - (band?.side === 'n' ? band.size : 0),
                },
                end: { x: maxX + PARTITION_CONTENT_MARGIN, y: maxY + PARTITION_CONTENT_MARGIN },
            };
        }
        needMemo.set(objectId, out);
        return out;
    };
    // `crossFrom`: where the partitions start on the cross axis, when the caller knows it. A partition starts there, not
    // a margin before its children, and its children do not move: it reaches the margin past their far edge from there,
    // never less than their span plus the margins (P-2026-10-11-0040).
    const specOf = (objectId: string, axis: CompiledContainmentLayout['axis'], seen: Set<string>, crossFrom?: number): PartitionSpec => {
        const rec = recOf(model.vertexByObj.get(objectId)!);
        const need = needOf(objectId, seen);
        const vertical = axis !== 'horizontal';
        const reach = need.end && crossFrom !== undefined ? (vertical ? need.end.x : need.end.y) - crossFrom : 0;
        return {
            stored: vertical ? rec.h : rec.w,
            isResized: !!rec.isResized,
            content: vertical ? need.h : need.w,
            contentCross: Math.max(vertical ? need.w : need.h, reach),
            // R-GV-17: the partition is drawn around its children's box on all four sides.
            ...(need.start && need.end ? { cover: { x0: need.start.x, y0: need.start.y, x1: need.end.x, y1: need.end.y } } : {}),
        };
    };
    // Where the partitions of a `partitions` container at `at` start on the cross axis: past its band on that axis and its
    // padding, as `layoutPartitions` places them.
    const crossFromOf = (at: { x: number; y: number }, layout: CompiledContainmentLayout): number => {
        const vertical = layout.axis !== 'horizontal';
        const band = layout.header?.side === (vertical ? 'w' : 'n') && Number.isFinite(layout.header.size) ? Math.max(0, layout.header.size) : 0;
        const pad = Number.isFinite(layout.padding) ? Math.max(0, layout.padding) : 0;
        return (vertical ? at.x : at.y) + band + pad;
    };
    // The laid-out box of a `partitions` container a frame holds (S2b): where its node is, its stack's size; the frame
    // counts that box, not the node's stored size. Null for any other object.
    const stackOf = (objectId: string): Box | null => {
        const info = model.containers.get(objectId);
        const layout = info?.layout;
        const node = info ? byId.get(info.vertexId) : undefined;
        if (!info || !node || layout?.mode !== 'partitions') return null;
        const rec = recOf(info.vertexId);
        const at = anchorOf(node, objectId);
        const from = crossFromOf(at, layout);
        return layoutPartitions({
            container: { x: at.x, y: at.y, w: rec.w, h: rec.h, isResized: !!rec.isResized }, axis: layout.axis, header: layout.header,
            padding: layout.padding, partitions: visibleKids(objectId).map(k => specOf(k, layout.axis, new Set(), from)),
        }).container;
    };

    const ordered = layoutContainers
        .map((c, i) => ({ c, i, d: depthIn(model, c.objectId) }))
        .sort((a, b) => a.d - b.d || a.i - b.i);

    // A container being dragged (S3) carries its descendants along on screen: the offset of its node from where it
    // rests (its record; its frame, for a self-framing one), applied to every visible descendant. Not for a partition,
    // whose place is computed. At drag end EditorV2 writes the same offset to the records, and the offset drops to zero.
    for (const { c } of ordered) {
        const node = byId.get(c.vertexId);
        if (atRest || !node?.dragging) continue;
        const parent = model.parentOf.get(c.objectId);
        if (parent !== undefined && model.containers.get(parent)?.layout?.mode === 'partitions') continue;
        // Where it rests is where the pass at rest drew it (R-GV-17: a frame may be drawn off its record).
        const rest = restBoxOf!(c.objectId) ?? frameOf(c.objectId) ?? recOf(c.vertexId);
        const dx = node.position.x - rest.x;
        const dy = node.position.y - rest.y;
        if (!Number.isFinite(dx) || !Number.isFinite(dy) || (dx === 0 && dy === 0)) continue;
        // Hidden descendants too: a collapsed frame takes its place from them. They are not drawn, nor patched below.
        for (const d of descendantsOf(model, c.objectId)) {
            if (!offset.has(d)) offset.set(d, { x: dx, y: dy });
        }
    }
    if (offset.size > 0) { frameMemo.clear(); anchoredOnly.clear(); needMemo.clear(); }

    // A selected node is lifted by 1000 by React Flow (elevateNodesOnSelect): a layout container that holds layout
    // containers takes it back, so selecting a pool or a composite state never covers its own lanes, regions and inner
    // frames (S2b). One that holds none keeps the lift, which puts its resize line above its neighbour's box (S3).
    const holdsLayout = (objectId: string) => descendantsOf(model, objectId).some(o => !!model.containers.get(o)?.layout);
    const zOf = (n: Node | undefined, objectId: string, z: number) => z - (n?.selected && holdsLayout(objectId) ? SELECTED_NODE_LIFT : 0);
    for (const { c, d } of ordered) {
        const node = byId.get(c.vertexId);
        if (!node || node.hidden) continue;
        const own = patch.get(c.vertexId) ?? {};
        patch.set(c.vertexId, { ...own, z: zOf(node, c.objectId, LAYOUT_CONTAINER_Z + d) });
        const layout = c.layout!;
        if (layout.mode !== 'partitions') continue;
        const kids = visibleKids(c.objectId);
        // A container that is itself a partition was placed by its parent: its box is that, as if sized by hand.
        const placed = own.w !== undefined && own.h !== undefined;
        const rec = recOf(c.vertexId);
        const at = anchorOf(node, c.objectId);
        const box = placed
            ? { x: own.x!, y: own.y!, w: own.w!, h: own.h!, isResized: true }
            : { x: at.x, y: at.y, w: rec.w, h: rec.h, isResized: !!rec.isResized };
        const from = crossFromOf(box, layout);
        let specs = kids.map(k => specOf(k, layout.axis, new Set(), from));
        // A partition being resized (S3): its live size moves its end border, the next partition gives or takes the
        // difference, the sum stays (spec addendum §7.5); the records are written once, at the end of the gesture.
        const live = kids.findIndex(k => byId.get(model.vertexByObj.get(k)!)?.resizing === true);
        if (live !== -1) {
            const ln = byId.get(model.vertexByObj.get(kids[live])!)!;
            const liveExtent = layout.axis === 'horizontal' ? (ln.measured?.width ?? ln.width) : (ln.measured?.height ?? ln.height);
            if (typeof liveExtent === 'number' && Number.isFinite(liveExtent)) {
                // From the stack at rest: the border the gesture moves stays past the partition's own children and short
                // of the next one's (R-GV-17: a resize never cuts a child), and the floor holds as before.
                const l0 = layoutPartitions({ container: box, axis: layout.axis, header: layout.header, padding: layout.padding, partitions: specs });
                const extents = l0.extents;
                const vertical = layout.axis !== 'horizontal';
                const startOf = (i: number) => (vertical ? l0.partitions[i].y : l0.partitions[i].x);
                const near = (i: number) => { const cv = specs[i].cover; return cv ? (vertical ? cv.y0 : cv.x0) : Infinity; };
                const far = (i: number) => { const cv = specs[i].cover; return cv ? (vertical ? cv.y1 : cv.x1) : -Infinity; };
                const border = Math.max(startOf(live) + liveExtent, far(live));
                const next = live < extents.length - 1
                    ? resizePartitionBorder(extents, live, Math.min(border, near(live + 1)) - (startOf(live) + extents[live]))
                    : extents.map((e, i) => (i === live ? Math.max(border - startOf(live), MIN_PARTITION_EXTENT) : e));
                specs = specs.map((sp, i) => ({ ...sp, stored: next[i], isResized: true }));
            }
        }
        const l = layoutPartitions({
            container: box, axis: layout.axis, header: layout.header, padding: layout.padding,
            partitions: specs,
        });
        // Its origin moves up or left when a child needs it (R-GV-17); placed by a parent, it stays where it was put.
        patch.set(c.vertexId, { ...patch.get(c.vertexId), ...(placed ? {} : { x: l.container.x, y: l.container.y }), w: l.container.w, h: l.container.h });
        const axis = layout.axis === 'horizontal' ? 'horizontal' : 'vertical';
        kids.forEach((k, i) => {
            const v = model.vertexByObj.get(k)!;
            const r = l.partitions[i];
            // The line between two partitions: the later drops its leading border, the earlier's trailing border draws
            // it, dashed when the layout says so (S2b).
            const cls = [
                ...(i > 0 ? [PARTITION_NEXT_CLASS[axis]] : []),
                ...(layout.separator === 'dashed' && i < kids.length - 1 ? [PARTITION_DASHED_CLASS[axis]] : []),
            ].join(' ') || undefined;
            patch.set(v, { ...patch.get(v), x: r.x, y: r.y, w: r.w, h: r.h, z: zOf(byId.get(v), k, LAYOUT_CONTAINER_Z + d + 1), cls });
        });
    }

    // Self-framing containers (S2b): their frame, unless a parent's partitions placed them.
    for (const { c } of ordered) {
        const own = patch.get(c.vertexId) ?? {};
        if (own.w !== undefined) continue;
        const f = frameOf(c.objectId);
        if (f) patch.set(c.vertexId, anchoredOnly.has(c.objectId) ? { ...own, x: f.x, y: f.y } : { ...own, x: f.x, y: f.y, w: f.w, h: f.h });
    }

    // The descendants a dragged container carries and no layout placed: drawn at their offset.
    for (const [d, o] of offset) {
        const v = model.vertexByObj.get(d);
        const n = v !== undefined ? byId.get(v) : undefined;
        if (!n || hidden.has(d)) continue;
        const p = patch.get(v!);
        if (p?.x !== undefined) continue;
        patch.set(v!, { ...p, x: n.position.x + o.x, y: n.position.y + o.y });
    }

    // The box each object is drawn in by this pass: its patch over its node.
    const boxOf = (objectId: string): Box | null => {
        const v = model.vertexByObj.get(objectId);
        const n = v !== undefined ? byId.get(v) : undefined;
        if (!n) return null;
        const p = patch.get(v!) ?? {};
        const at = posOf(n, objectId);
        const s = sizeOf(n);
        return { x: p.x ?? at.x, y: p.y ?? at.y, w: p.w ?? s.w, h: p.h ?? s.h };
    };
    return { patch, boxOf };
    }

    let changed = false;
    const out = nodes.map(n => {
        const p = patch.get(n.id);
        if (!p) return n;
        const x = p.x ?? n.position.x;
        const y = p.y ?? n.position.y;
        const w = p.w ?? n.width;
        const h = p.h ?? n.height;
        const z = p.z ?? n.zIndex;
        const own = (n.className ?? '').split(' ').filter(c => c && !PARTITION_CLASSES.has(c));
        const className = [...own, ...(p.cls ? p.cls.split(' ') : [])].join(' ') || undefined;
        if (x === n.position.x && y === n.position.y && w === n.width && h === n.height && z === n.zIndex && className === n.className) return n;
        changed = true;
        const next: Node = { ...n, position: x === n.position.x && y === n.position.y ? n.position : { x, y }, zIndex: z };
        if (className !== n.className) next.className = className;
        if (p.w !== undefined && p.h !== undefined) {
            next.width = w;
            next.height = h;
            // React Flow sizes a node by `measured` before `width` (R-LAY-18): keep a measure that already agrees, drop a stale one.
            const m = n.measured;
            if (m && (Math.abs((m.width ?? -1) - (w as number)) > 0.5 || Math.abs((m.height ?? -1) - (h as number)) > 0.5)) next.measured = undefined;
        }
        return next;
    });
    return changed ? out : nodes;
}

/**
 * Channel-edge suppression (R-GV-4, spec addendum §5): with `containment.edges: 'hide'`, the edge that draws the channel
 * itself, from the container's node to the node of an object its channel claims, is flagged hidden, never removed (row
 * dispatch, row-dispatch addendum §6). Every claim counts, the one the container lost to an inner claimant too (R-GV-2):
 * the double claim is reported by the problems overlay, not by a stray edge. A declared single-hop channel matches a
 * reference edge of its feature; the default channel matches a composition edge; a multi-hop channel has no direct edge
 * and matches nothing. A declared single-hop channel also drops (S3) an edge of its feature to an object its slot no
 * longer holds, and every edge of a pair but the last: after a membership edit the model deletes the old edge while the
 * canvas may keep it, and a move back adds a new edge for the same pair (one edge per pair, Rule 13). Dropped, not
 * hidden: a hidden edge still takes a handle slot on its ends (the object-as-edge synthesis counts it), and these pile
 * up with every move. Pure; returns `edges` itself when nothing changes.
 */
export function suppressChannelEdges(edges: Edge[], model: ContainmentModel): Edge[] {
    const channelOf = (e: Edge): { src: string; tgt: string; info: ContainerInfo } | null => {
        const src = model.objByVertex.get(e.source);
        const tgt = model.objByVertex.get(e.target);
        const info = src !== undefined ? model.containers.get(src) : undefined;
        if (src === undefined || tgt === undefined || !info || info.edges !== 'hide' || info.channelFeature === null) return null;
        const isChannel = info.channelFeature === undefined
            ? e.type === 'composition'
            : (e.type === 'instanceRef' || e.type === 'composition') && (e.data as { referenceName?: unknown } | undefined)?.referenceName === info.channelFeature;
        return isChannel ? { src, tgt, info } : null;
    };
    const lastOfPair = new Map<string, number>();
    edges.forEach((e, i) => { if (channelOf(e)?.info.channelValues !== undefined) lastOfPair.set(`${e.source}→${e.target}`, i); });
    let changed = false;
    const out: Edge[] = [];
    edges.forEach((e, i) => {
        const ch = channelOf(e);
        if (!ch) { out.push(e); return; }
        const { src, tgt, info } = ch;
        if (info.channelValues !== undefined && (!info.channelValues.has(tgt) || lastOfPair.get(`${e.source}→${e.target}`) !== i)) {
            changed = true;
            return;
        }
        if (e.hidden || (model.parentOf.get(tgt) !== src && !model.multiClaimed?.get(tgt)?.includes(src))) { out.push(e); return; }
        changed = true;
        out.push({ ...e, hidden: true });
    });
    return changed ? out : edges;
}

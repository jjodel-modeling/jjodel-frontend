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
import type { ChannelEdges, CompiledContainmentLayout, CompiledPathStep, CompiledView } from './irTypes';
import { layoutPartitions, type PartitionSpec } from './irPartitions';
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
/** Space kept around the children of a partition that is not sized by hand, px (spec addendum §7.1, content). */
export const PARTITION_CONTENT_MARGIN = 16;
/** Class of every partition after the first, by axis: it drops its leading border, which the previous partition's
 *  trailing border already draws, so two lanes share one line (irStyle.ts). Geometry unchanged. */
export const PARTITION_NEXT_CLASS = { vertical: 'ir-partition-next-v', horizontal: 'ir-partition-next-h' } as const;
const PARTITION_CLASSES = new Set<string>(Object.values(PARTITION_NEXT_CLASS));

type Box = { x: number; y: number; w: number; h: number };
const sizeOf = (n: Node): { w: number; h: number } => ({
    w: (n.measured?.width ?? n.width ?? 160) as number,
    h: (n.measured?.height ?? n.height ?? 60) as number,
});

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
    const patch = new Map<string, Partial<Box> & { z?: number; cls?: string }>();

    // What a container's own children need, as a box size (spec addendum §7.1, content). Memoized, cycle-guarded.
    const needMemo = new Map<string, { w: number; h: number }>();
    const needOf = (objectId: string, seen: Set<string> = new Set()): { w: number; h: number } => {
        const memo = needMemo.get(objectId);
        if (memo) return memo;
        if (seen.has(objectId)) return { w: 0, h: 0 };
        seen.add(objectId);
        const info = model.containers.get(objectId);
        const layout = info?.layout;
        const kids = visibleKids(objectId);
        let out = { w: 0, h: 0 };
        if (layout?.mode === 'partitions') {
            const l = layoutPartitions({
                container: { x: 0, y: 0 }, axis: layout.axis, header: layout.header, padding: layout.padding,
                partitions: kids.map(k => specOf(k, layout.axis, seen)),
            });
            out = { w: l.container.w, h: l.container.h };
        } else if (kids.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            for (const k of kids) {
                const n = byId.get(model.vertexByObj.get(k)!)!;
                const s = sizeOf(n);
                minX = Math.min(minX, n.position.x); minY = Math.min(minY, n.position.y);
                maxX = Math.max(maxX, n.position.x + s.w); maxY = Math.max(maxY, n.position.y + s.h);
            }
            const band = layout?.header;
            out = {
                w: maxX - minX + 2 * PARTITION_CONTENT_MARGIN + (band?.side === 'w' ? band.size : 0),
                h: maxY - minY + 2 * PARTITION_CONTENT_MARGIN + (band?.side === 'n' ? band.size : 0),
            };
        }
        needMemo.set(objectId, out);
        return out;
    };
    const specOf = (objectId: string, axis: CompiledContainmentLayout['axis'], seen: Set<string>): PartitionSpec => {
        const rec = recOf(model.vertexByObj.get(objectId)!);
        const need = needOf(objectId, seen);
        const vertical = axis !== 'horizontal';
        return {
            stored: vertical ? rec.h : rec.w,
            isResized: !!rec.isResized,
            content: vertical ? need.h : need.w,
            contentCross: vertical ? need.w : need.h,
        };
    };

    const ordered = layoutContainers
        .map((c, i) => ({ c, i, d: depthIn(model, c.objectId) }))
        .sort((a, b) => a.d - b.d || a.i - b.i);
    for (const { c, d } of ordered) {
        const node = byId.get(c.vertexId);
        if (!node || node.hidden) continue;
        const own = patch.get(c.vertexId) ?? {};
        patch.set(c.vertexId, { ...own, z: LAYOUT_CONTAINER_Z + d });
        const layout = c.layout!;
        if (layout.mode !== 'partitions') continue;
        const kids = visibleKids(c.objectId);
        // A container that is itself a partition was placed by its parent: its box is that, as if sized by hand.
        const placed = own.w !== undefined && own.h !== undefined;
        const rec = recOf(c.vertexId);
        const box = placed
            ? { x: own.x!, y: own.y!, w: own.w!, h: own.h!, isResized: true }
            : { x: node.position.x, y: node.position.y, w: rec.w, h: rec.h, isResized: !!rec.isResized };
        const l = layoutPartitions({
            container: box, axis: layout.axis, header: layout.header, padding: layout.padding,
            partitions: kids.map(k => specOf(k, layout.axis, new Set())),
        });
        patch.set(c.vertexId, { ...patch.get(c.vertexId), w: l.container.w, h: l.container.h });
        kids.forEach((k, i) => {
            const v = model.vertexByObj.get(k)!;
            const r = l.partitions[i];
            const cls = i > 0 ? PARTITION_NEXT_CLASS[layout.axis === 'horizontal' ? 'horizontal' : 'vertical'] : undefined;
            patch.set(v, { ...patch.get(v), x: r.x, y: r.y, w: r.w, h: r.h, z: LAYOUT_CONTAINER_Z + d + 1, cls });
        });
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
        const className = [...own, ...(p.cls ? [p.cls] : [])].join(' ') || undefined;
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
 * and matches nothing. Pure; returns `edges` itself when nothing changes.
 */
export function suppressChannelEdges(edges: Edge[], model: ContainmentModel): Edge[] {
    let changed = false;
    const out = edges.map(e => {
        if (e.hidden) return e;
        const src = model.objByVertex.get(e.source);
        const tgt = model.objByVertex.get(e.target);
        if (src === undefined || tgt === undefined) return e;
        if (model.parentOf.get(tgt) !== src && !model.multiClaimed?.get(tgt)?.includes(src)) return e;
        const info = model.containers.get(src);
        if (!info || info.edges !== 'hide' || info.channelFeature === null) return e;
        const isChannel = info.channelFeature === undefined
            ? e.type === 'composition'
            : (e.type === 'instanceRef' || e.type === 'composition') && (e.data as { referenceName?: unknown } | undefined)?.referenceName === info.channelFeature;
        if (!isChannel) return e;
        changed = true;
        return { ...e, hidden: true };
    });
    return changed ? out : edges;
}

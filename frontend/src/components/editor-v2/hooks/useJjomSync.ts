/**
 * useJjomSync — Incremental bidirectional sync between JjOM/Redux and React Flow.
 *
 * Replaces the Phase 2 `useJjomData` hook with an efficient, cache-based approach:
 *
 * 1. On mount: full transformation from JjOM → rfCache
 * 2. On Redux changes: per-element reference equality check → re-transform only
 *    changed elements (O(1) per change instead of O(n))
 * 3. Anti-bounce: elements recently written from canvas are skipped
 *
 * The hook receives setNodes/setEdges from the parent so it can update RF state
 * directly when JjOM changes externally.
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import type { Node, Edge } from '@xyflow/react';
import {
    DState,
    DGraph,
    LGraph,
    LPointerTargetable,
    SetFieldAction,
    SetRootFieldAction,
    DVertex,
    DEdge,
    GraphSize,
    TRANSACTION,
} from '../../../joiner';
import { jjomVertexToRFNode, jjomEdgeToRFEdge } from '../utils/jjomTransformers';
import {
    isCanvasUpdated,
    purgeExpired,
    clearAllCanvasUpdated,
    clearSyncModes,
    consumeDropCreated,
    clearDropCreated,
    clearEdgeRefIds,
} from '../sync/syncState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseJjomSyncResult {
    /** True when modelid is provided and a matching graph exists in Redux. */
    isJjomMode: boolean;
    /** True when a graph was found for the modelid. */
    hasGraph: boolean;
    /** The JjOM graph ID (DGraph pointer), available when isJjomMode is true. */
    graphId: string | null;
}

type SetNodes = React.Dispatch<React.SetStateAction<Node[]>>;
type SetEdges = React.Dispatch<React.SetStateAction<Edge[]>>;

// Empty array constant to avoid re-creating on every render
const EMPTY_ARRAY: string[] = [];

// ---------------------------------------------------------------------------
// Custom equality for per-element selectors
// ---------------------------------------------------------------------------

/**
 * Compares two Maps by size and per-key reference equality.
 * Only returns true if all keys and values (by reference) are identical.
 */
function mapReferenceEqual(
    a: Map<string, any> | null,
    b: Map<string, any> | null,
): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.size !== b.size) return false;
    for (const [key, val] of a) {
        if (b.get(key) !== val) return false;
    }
    return true;
}

/** Shallow array comparison (for subElements pointer arrays). */
function shallowArrayEqual(a: string[], b: string[]): boolean {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

// ---------------------------------------------------------------------------
// Helper: classify D-object as vertex or edge
// ---------------------------------------------------------------------------

function isVertexClassName(className: string | undefined): boolean {
    if (!className) return false;
    return className.includes('Vertex');
}

function isEdgeClassName(className: string | undefined): boolean {
    if (!className) return false;
    return className.includes('Edge');
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useJjomSync(
    modelid: string | undefined,
    setNodes: SetNodes,
    setEdges: SetEdges,
    onInitialized?: () => void,
): UseJjomSyncResult {
    // ── rfCache: Map<elementId, RF Node | RF Edge> ─────────────────────
    const rfNodeCache = useRef<Map<string, Node>>(new Map());
    const rfEdgeCache = useRef<Map<string, Edge>>(new Map());

    // ── Previous D-object references for diffing ───────────────────────
    const prevElementsRef = useRef<Map<string, any>>(new Map());
    const prevSubElementsRef = useRef<string[]>(EMPTY_ARRAY);

    // ── Initialization flag ────────────────────────────────────────────
    const initializedRef = useRef(false);
    const prevModelidRef = useRef<string | undefined>(undefined);

    // ── Selector 1: Find the v2-flow DGraph for this modelid ────────────
    // Returns the graphId and subElements pointer array.
    // Only triggers when the graph itself or its subElements change.
    const graphInfo = useSelector((state: DState) => {
        if (!modelid) return null;
        try {
            const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
            const matching = dGraphs.find(g => g?.model === modelid && (g as any).graphStyle === 'v2-flow');
            if (!matching) return null;
            // Return the fresh DGraph from idlookup (not the stale one from fromPointer)
            const freshGraph = state.idlookup[matching.id] as any;
            return {
                graphId: matching.id,
                subElements: (freshGraph?.subElements ?? EMPTY_ARRAY) as string[],
            };
        } catch {
            return null;
        }
    }, (a, b) => {
        if (a === b) return true;
        if (!a || !b) return false;
        return a.graphId === b.graphId &&
            shallowArrayEqual(a.subElements, b.subElements);
    });

    const hasGraph = graphInfo !== null;
    const isJjomMode = !!modelid && hasGraph;
    const subElementIds = graphInfo?.subElements ?? EMPTY_ARRAY;

    // ── Auto-create v2-flow graph if none exists ───────────────────────
    const creatingGraphRef = useRef(false);

    useEffect(() => {
        if (!modelid || hasGraph || creatingGraphRef.current) return;

        creatingGraphRef.current = true;
        try {
            TRANSACTION('Create v2-flow graph', () => {
                // 1. Create the graph
                const dGraph = DGraph.new(0, modelid);
                const graphId = dGraph.id;

                // 2. Tag as v2-flow
                SetFieldAction.new(graphId, 'graphStyle', 'v2-flow', '', false);

                // 3. Add to state.graphs so selectors can find it
                SetRootFieldAction.new('graphs', graphId, '+=', true);

                // 3. Populate from model: scan classifiers and create vertices
                const lModel: any = LPointerTargetable.fromPointer(modelid);
                if (!lModel) return;

                const allClassifiers: any[] = lModel.classifiers ?? lModel.children ?? [];
                // Skip packages — in v2 they're created via palette drag only.
                // This avoids the auto-created "default" package appearing.
                const classifiers = allClassifiers.filter((c: any) => {
                    const cn = c?.className ?? c?.__raw?.className ?? '';
                    return cn !== 'DPackage';
                });
                const COLS = 3;
                const COL_W = 300;
                const ROW_H = 220;

                const vertexIdByModelId = new Map<string, string>();

                for (let i = 0; i < classifiers.length; i++) {
                    const cls = classifiers[i];
                    if (!cls?.id) continue;

                    const col = i % COLS;
                    const row = Math.floor(i / COLS);
                    const x = 50 + col * COL_W;
                    const y = 50 + row * ROW_H;

                    const size = new GraphSize(x, y, 200, 120);
                    const dv = DVertex.new(0, cls.id, graphId, graphId, undefined, size);
                    if (dv?.id) vertexIdByModelId.set(cls.id, dv.id);
                }

                // 4. Create edges for extends and references
                for (const cls of classifiers) {
                    if (!cls?.id) continue;
                    const className = cls.className ?? cls.__raw?.className;

                    if (className === 'DClass') {
                        // Extends (inheritance)
                        const supers: any[] = cls.extendedBy ?? cls.superClasses ?? [];
                        for (const sup of supers) {
                            const supId = typeof sup === 'string' ? sup : sup?.id;
                            if (!supId || supId === cls.id) continue; // skip self-loop
                            const srcVertex = vertexIdByModelId.get(cls.id);
                            const tgtVertex = vertexIdByModelId.get(supId);
                            if (srcVertex && tgtVertex && srcVertex !== tgtVertex) {
                                DEdge.new(0, undefined, graphId, graphId, undefined, srcVertex, tgtVertex);
                            }
                        }

                        // References
                        const refs: any[] = cls.references ?? [];
                        for (const ref of refs) {
                            const targetType = ref.type;
                            const targetId = typeof targetType === 'string' ? targetType : targetType?.id;
                            if (!targetId) continue;
                            const srcVertex = vertexIdByModelId.get(cls.id);
                            const tgtVertex = vertexIdByModelId.get(targetId);
                            if (srcVertex && tgtVertex && ref.id) {
                                DEdge.new(0, ref.id, graphId, graphId, undefined, srcVertex, tgtVertex);
                            }
                        }
                    }
                }
            });
        } catch (err) {
            console.warn('[useJjomSync] Failed to create v2-flow graph:', err);
        } finally {
            // Reset after a tick so the selector can pick up the new graph
            setTimeout(() => { creatingGraphRef.current = false; }, 100);
        }
    }, [modelid, hasGraph]);

    // ── Selector 2: Per-element D-object references ────────────────────
    // For each ID in subElements, select state.idlookup[id].
    // Custom comparator ensures we only trigger when an individual
    // D-object reference changes (not when unrelated objects change).
    const elementSnapshots = useSelector((state: DState) => {
        if (subElementIds.length === 0) return null;
        const result = new Map<string, any>();
        for (const id of subElementIds) {
            const elem = state.idlookup[id];
            if (elem) {
                result.set(id, elem);
                const modelId = (elem as any).model;
                if (modelId && typeof modelId === 'string') {
                    const modelElem = state.idlookup[modelId] as any;
                    if (modelElem) {
                        result.set(`model:${id}`, modelElem);
                        // Lightweight hash of children properties (attr names,
                        // types, bounds, etc.). Changes when any child is updated
                        // in Redux. A single number entry per vertex instead of
                        // dozens of child entries — avoids infinite re-render loops.
                        let ch = 0;
                        for (const key of ['attributes', 'references', 'operations', 'literals']) {
                            const arr = modelElem[key];
                            if (!Array.isArray(arr)) continue;
                            for (const childId of arr) {
                                if (typeof childId !== 'string') continue;
                                const child = state.idlookup[childId] as any;
                                if (!child) continue;
                                const n = child.name ?? '';
                                for (let i = 0; i < n.length; i++) {
                                    ch = ((ch << 5) - ch + n.charCodeAt(i)) | 0;
                                }
                                // Include type pointer and bounds
                                const t = (typeof child.type === 'string' ? child.type : child.type?.id ?? '');
                                for (let i = 0; i < t.length; i++) {
                                    ch = ((ch << 5) - ch + t.charCodeAt(i)) | 0;
                                }
                                ch = (ch * 31 + (child.lowerBound ?? 0)) | 0;
                                ch = (ch * 31 + (child.upperBound ?? 0)) | 0;
                                ch = (ch * 31 + (child.abstract ? 1 : 0)) | 0;
                                ch = (ch * 31 + (child.composition ? 1 : 0)) | 0;
                                ch = (ch * 31 + 7) | 0; // separator
                            }
                        }
                        result.set(`ch:${id}`, ch);
                    }
                }
            }
        }
        return result;
    }, mapReferenceEqual);

    // ── Initialization: full transform on mount or modelid change ──────
    useEffect(() => {
        if (!isJjomMode || !modelid) {
            // Clear caches if no longer in JjOM mode
            if (initializedRef.current) {
                rfNodeCache.current.clear();
                rfEdgeCache.current.clear();
                prevElementsRef.current.clear();
                prevSubElementsRef.current = EMPTY_ARRAY;
                initializedRef.current = false;
            }
            return;
        }

        // Reset if modelid changed
        if (modelid !== prevModelidRef.current) {
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            prevSubElementsRef.current = EMPTY_ARRAY;
            initializedRef.current = false;
            prevModelidRef.current = modelid;
        }

        if (initializedRef.current) return;

        try {
            // Full transform using L-proxies
            const lGraph: any = LGraph.fromPointer(graphInfo!.graphId);
            if (!lGraph) return;

            const vertices: any[] = lGraph.nodes ?? [];
            const edges: any[] = lGraph.edges ?? [];

            console.log('[DEBUG useJjomSync edges]', {
                edgeCount: edges.length,
                edgeIds: edges.map((e: any) => e.id),
                cacheSize: rfEdgeCache.current.size,
            });

            const nodeCache = new Map<string, Node>();
            const edgeCache = new Map<string, Edge>();

            for (const v of vertices) {
                const rfNode = jjomVertexToRFNode(v);
                if (rfNode) nodeCache.set(rfNode.id, rfNode);
            }
            for (const e of edges) {
                const rfEdge = jjomEdgeToRFEdge(e);
                // Skip orphan edges (source/target vertex not in graph)
                if (rfEdge && nodeCache.has(rfEdge.source) && nodeCache.has(rfEdge.target)) {
                    edgeCache.set(rfEdge.id, rfEdge);
                }
            }

            rfNodeCache.current = nodeCache;
            rfEdgeCache.current = edgeCache;

            // Snapshot current D-object references
            if (elementSnapshots) {
                prevElementsRef.current = new Map(elementSnapshots);
            }
            prevSubElementsRef.current = subElementIds;

            // Push to React Flow state
            setNodes(Array.from(nodeCache.values()));
            setEdges(Array.from(edgeCache.values()));

            initializedRef.current = true;

            // Notify caller (e.g. to fitView) — delay to let RF measure nodes
            if (onInitialized) {
                requestAnimationFrame(() => onInitialized());
            }
        } catch (err) {
            console.warn('[useJjomSync] Initialization error:', err);
        }
    }, [isJjomMode, modelid, graphInfo, elementSnapshots, setNodes, setEdges, subElementIds]);

    // ── Incremental sync: JjOM → Canvas ────────────────────────────────
    useEffect(() => {
        if (!isJjomMode || !initializedRef.current || !elementSnapshots) return;

        purgeExpired();

        const currentIds = new Set(subElementIds);
        const prevIds = new Set(prevSubElementsRef.current);

        // Track what changed so we can do surgical updates
        const addedNodes: Node[] = [];
        const addedEdges: Edge[] = [];
        const removedNodeIds = new Set<string>();
        const removedEdgeIds = new Set<string>();
        // Map of nodeId → new data for property-changed nodes
        const patchedNodeData = new Map<string, any>();
        const patchedEdges = new Map<string, Edge>();

        // --- Structural changes: additions ---
        for (const id of currentIds) {
            if (!prevIds.has(id)) {
                const isDropCreated = consumeDropCreated(id);

                try {
                    const lProxy: any = LPointerTargetable.fromPointer(id);
                    if (!lProxy) continue;
                    const className = lProxy.className ?? lProxy.__raw?.className;

                    if (isVertexClassName(className)) {
                        // Skip if already in cache (previous cycle's consumeDropCreated)
                        if (!isDropCreated && rfNodeCache.current.has(id)) continue;

                        const rfNode = jjomVertexToRFNode(lProxy);
                        if (rfNode) {
                            if (isDropCreated) {
                                rfNode.data = { ...rfNode.data, autoEdit: true };
                            }
                            rfNodeCache.current.set(rfNode.id, rfNode);
                            if (!isDropCreated) addedNodes.push(rfNode);
                        }
                    } else if (isEdgeClassName(className)) {
                        // Skip if already in cache (from a previous cycle's
                        // consumeDropCreated or ID replacement in setEdges).
                        if (rfEdgeCache.current.has(id)) {
                            console.log('[useJjomSync] EDGE SKIP (in cache):', id);
                            continue;
                        }

                        const rfEdge = jjomEdgeToRFEdge(lProxy);
                        // Guard: skip orphan edges (source/target vertex deleted)
                        if (rfEdge && currentIds.has(rfEdge.source) && currentIds.has(rfEdge.target)) {
                            rfEdgeCache.current.set(rfEdge.id, rfEdge);
                            console.log('[useJjomSync] EDGE ADD:', {
                                id,
                                isDropCreated,
                                added: !isDropCreated,
                                source: rfEdge.source,
                                target: rfEdge.target,
                                type: rfEdge.type,
                            });
                            if (!isDropCreated) addedEdges.push(rfEdge);
                        }
                    }
                } catch { /* skip */ }
            }
        }

        // --- Structural changes: removals ---
        for (const id of prevIds) {
            if (!currentIds.has(id)) {
                if (rfNodeCache.current.delete(id)) removedNodeIds.add(id);
                if (rfEdgeCache.current.delete(id)) removedEdgeIds.add(id);
            }
        }

        // --- Property changes on existing elements ---
        const prevElements = prevElementsRef.current;
        for (const id of subElementIds) {
            if (!prevIds.has(id)) continue;
            if (isCanvasUpdated(id)) continue; // anti-bounce (drag positions only)

            const dElement = elementSnapshots.get(id);
            const prevD = prevElements.get(id);
            const currModel = elementSnapshots.get(`model:${id}`);
            const prevModel = prevElements.get(`model:${id}`);
            const currHash = elementSnapshots.get(`ch:${id}`);
            const prevHash = prevElements.get(`ch:${id}`);

            if (prevD === dElement && prevModel === currModel && currHash === prevHash) continue;

            try {
                const lProxy: any = LPointerTargetable.fromPointer(id);
                if (!lProxy) continue;
                const className = lProxy.className ?? lProxy.__raw?.className;

                if (isVertexClassName(className)) {
                    const rfNode = jjomVertexToRFNode(lProxy);
                    if (rfNode) {
                        const existing = rfNodeCache.current.get(id);
                        if (existing) rfNode.position = existing.position;
                        rfNodeCache.current.set(id, rfNode);
                        // Only patch data — preserves node identity → no RF re-measure
                        patchedNodeData.set(id, rfNode.data);
                    }
                } else if (isEdgeClassName(className)) {
                    const rfEdge = jjomEdgeToRFEdge(lProxy);
                    if (rfEdge) {
                        // Preserve handles from applyDistribution
                        const existing = rfEdgeCache.current.get(id);
                        if (existing) {
                            rfEdge.sourceHandle = existing.sourceHandle;
                            rfEdge.targetHandle = existing.targetHandle;
                        }
                        rfEdgeCache.current.set(id, rfEdge);
                        patchedEdges.set(id, rfEdge);
                    }
                }
            } catch { /* skip */ }
        }

        // Save prev state (preserve anti-bounced entries)
        const nextPrev = new Map(elementSnapshots);
        for (const id of subElementIds) {
            if (isCanvasUpdated(id)) {
                const prev = prevElementsRef.current;
                const oldElem = prev.get(id);
                if (oldElem !== undefined) nextPrev.set(id, oldElem);
                const oldModel = prev.get(`model:${id}`);
                if (oldModel !== undefined) nextPrev.set(`model:${id}`, oldModel);
                const oldHash = prev.get(`ch:${id}`);
                if (oldHash !== undefined) nextPrev.set(`ch:${id}`, oldHash);
            }
        }
        prevElementsRef.current = nextPrev;
        prevSubElementsRef.current = subElementIds;

        // ── Surgical push to React Flow ──────────────────────────────
        // Instead of replacing ALL nodes (which triggers re-measurement
        // of every node → dimension changes → infinite loop), we patch
        // only what actually changed.

        const hasNodeChanges = addedNodes.length > 0 || removedNodeIds.size > 0 || patchedNodeData.size > 0;
        const hasEdgeChanges = addedEdges.length > 0 || removedEdgeIds.size > 0 || patchedEdges.size > 0;

        if (hasNodeChanges) {
            setNodes(prev => {
                let result = prev;

                if (removedNodeIds.size > 0) {
                    result = result.filter(n => !removedNodeIds.has(n.id));
                }

                // Patch data on changed nodes (preserves node object identity
                // for unchanged fields → RF skips re-measurement)
                if (patchedNodeData.size > 0) {
                    result = result.map(n => {
                        const newData = patchedNodeData.get(n.id);
                        if (newData) return { ...n, data: newData };
                        return n;
                    });
                }

                if (addedNodes.length > 0) {
                    result = [...result, ...addedNodes];
                }

                return result;
            });
        }

        if (hasEdgeChanges) {
            setEdges(prev => {
                let result = prev;

                if (removedEdgeIds.size > 0) {
                    result = result.filter(e => !removedEdgeIds.has(e.id));
                }

                if (patchedEdges.size > 0) {
                    result = result.map(e => {
                        const newEdge = patchedEdges.get(e.id);
                        if (!newEdge) return e;
                        // Merge: take JjOM-authoritative fields (label, name,
                        // cardinality) from newEdge, but preserve RF-side
                        // properties (kind, containment, handles) from current.
                        const merged = { ...newEdge };
                        // Preserve handles (already done in patching, but safety)
                        if (!merged.sourceHandle && e.sourceHandle) merged.sourceHandle = e.sourceHandle;
                        if (!merged.targetHandle && e.targetHandle) merged.targetHandle = e.targetHandle;
                        // Preserve jjomRefId (direct DReference ID for property writes)
                        const existingJjomRefId = (e.data as any)?.jjomRefId;
                        if (existingJjomRefId && !(merged.data as any)?.jjomRefId) {
                            (merged.data as any).jjomRefId = existingJjomRefId;
                        }
                        // Preserve reference kind from RF if JjOM lost it
                        const existingRef = (e.data as any)?.reference;
                        const newRef = (merged.data as any)?.reference;
                        if (existingRef && newRef && newRef.kind === 'association' && existingRef.kind !== 'association') {
                            (merged.data as any).reference = {
                                ...newRef,
                                kind: existingRef.kind,
                                containment: existingRef.containment,
                            };
                        }
                        // Update cache so future patches preserve this kind
                        rfEdgeCache.current.set(e.id, merged);
                        return merged;
                    });
                }

                if (addedEdges.length > 0) {
                    console.log('[useJjomSync] PUSHING addedEdges:', addedEdges.map(e => ({
                        id: e.id, type: e.type, source: e.source, target: e.target,
                    })));
                    result = [...result, ...addedEdges];
                }

                return result;
            });
        }
    }, [isJjomMode, elementSnapshots, subElementIds, setNodes, setEdges]);

    // ── Cleanup on unmount ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearAllCanvasUpdated();
            clearSyncModes();
            clearDropCreated();
            clearEdgeRefIds();
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            initializedRef.current = false;
        };
    }, []);

    return { isJjomMode, hasGraph, graphId: graphInfo?.graphId ?? null };
}

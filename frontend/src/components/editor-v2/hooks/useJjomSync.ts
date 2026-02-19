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
} from '../../../joiner';
import { jjomVertexToRFNode, jjomEdgeToRFEdge } from '../utils/jjomTransformers';
import {
    isCanvasUpdated,
    purgeExpired,
    clearAllCanvasUpdated,
    clearSyncModes,
} from '../sync/syncState';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseJjomSyncResult {
    /** True when modelid is provided and a matching graph exists in Redux. */
    isJjomMode: boolean;
    /** True when a graph was found for the modelid. */
    hasGraph: boolean;
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

    // ── Selector 1: Find the DGraph for this modelid ───────────────────
    // Returns the graphId and subElements pointer array.
    // Only triggers when the graph itself or its subElements change.
    const graphInfo = useSelector((state: DState) => {
        if (!modelid) return null;
        try {
            const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
            const matching = dGraphs.find(g => g?.model === modelid);
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

    // ── Selector 2: Per-element D-object references ────────────────────
    // For each ID in subElements, select state.idlookup[id].
    // Custom comparator ensures we only trigger when an individual
    // D-object reference changes (not when unrelated objects change).
    const elementSnapshots = useSelector((state: DState) => {
        if (subElementIds.length === 0) return null;
        const result = new Map<string, any>();
        for (const id of subElementIds) {
            const elem = state.idlookup[id];
            if (elem) result.set(id, elem);
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

            const nodeCache = new Map<string, Node>();
            const edgeCache = new Map<string, Edge>();

            for (const v of vertices) {
                const rfNode = jjomVertexToRFNode(v);
                if (rfNode) nodeCache.set(rfNode.id, rfNode);
            }
            for (const e of edges) {
                const rfEdge = jjomEdgeToRFEdge(e);
                if (rfEdge) edgeCache.set(rfEdge.id, rfEdge);
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
        } catch (err) {
            console.warn('[useJjomSync] Initialization error:', err);
        }
    }, [isJjomMode, modelid, graphInfo, elementSnapshots, setNodes, setEdges, subElementIds]);

    // ── Incremental sync: JjOM → Canvas ────────────────────────────────
    useEffect(() => {
        if (!isJjomMode || !initializedRef.current || !elementSnapshots) return;

        purgeExpired();

        let nodesChanged = false;
        let edgesChanged = false;

        const currentIds = new Set(subElementIds);
        const prevIds = new Set(prevSubElementsRef.current);

        // --- Structural changes: additions ---
        for (const id of currentIds) {
            if (!prevIds.has(id)) {
                // New element added to graph
                if (isCanvasUpdated(id)) continue;
                try {
                    const lProxy: any = LPointerTargetable.fromPointer(id);
                    if (!lProxy) continue;
                    const className = lProxy.className ?? lProxy.__raw?.className;

                    if (isVertexClassName(className)) {
                        const rfNode = jjomVertexToRFNode(lProxy);
                        if (rfNode) {
                            rfNodeCache.current.set(rfNode.id, rfNode);
                            nodesChanged = true;
                        }
                    } else if (isEdgeClassName(className)) {
                        const rfEdge = jjomEdgeToRFEdge(lProxy);
                        if (rfEdge) {
                            rfEdgeCache.current.set(rfEdge.id, rfEdge);
                            edgesChanged = true;
                        }
                    }
                } catch { /* skip invalid elements */ }
            }
        }

        // --- Structural changes: removals ---
        for (const id of prevIds) {
            if (!currentIds.has(id)) {
                if (rfNodeCache.current.delete(id)) nodesChanged = true;
                if (rfEdgeCache.current.delete(id)) edgesChanged = true;
            }
        }

        // --- Property changes on existing elements ---
        const prevElements = prevElementsRef.current;
        for (const [id, dElement] of elementSnapshots) {
            if (!prevIds.has(id)) continue; // already handled above as addition
            if (isCanvasUpdated(id)) continue; // anti-bounce

            const prevD = prevElements.get(id);
            if (prevD === dElement) continue; // reference unchanged — no update needed

            // D-object reference changed → re-transform
            try {
                const lProxy: any = LPointerTargetable.fromPointer(id);
                if (!lProxy) continue;
                const className = lProxy.className ?? lProxy.__raw?.className;

                if (isVertexClassName(className)) {
                    const rfNode = jjomVertexToRFNode(lProxy);
                    if (rfNode) {
                        rfNodeCache.current.set(id, rfNode);
                        nodesChanged = true;
                    }
                } else if (isEdgeClassName(className)) {
                    const rfEdge = jjomEdgeToRFEdge(lProxy);
                    if (rfEdge) {
                        rfEdgeCache.current.set(id, rfEdge);
                        edgesChanged = true;
                    }
                }
            } catch { /* skip */ }
        }

        // Save current state for next diff
        prevElementsRef.current = new Map(elementSnapshots);
        prevSubElementsRef.current = subElementIds;

        // Push to React Flow only if something actually changed
        if (nodesChanged) {
            setNodes(Array.from(rfNodeCache.current.values()));
        }
        if (edgesChanged) {
            setEdges(Array.from(rfEdgeCache.current.values()));
        }
    }, [isJjomMode, elementSnapshots, subElementIds, setNodes, setEdges]);

    // ── Cleanup on unmount ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            clearAllCanvasUpdated();
            clearSyncModes();
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            initializedRef.current = false;
        };
    }, []);

    return { isJjomMode, hasGraph };
}

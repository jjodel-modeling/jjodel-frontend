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
    DVoidEdge,
    GraphSize,
    TRANSACTION,
    store,
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
    hasCanvasEdgePair,
    markCanvasEdgePair,
    clearCanvasEdgePairs,
    isSingletonSuppressed,
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
    /** Ref that is true when the graph was just auto-created (consumed once by EditorV2 for auto-layout). */
    justCreatedGraphRef: React.MutableRefObject<boolean>;
}

/** Layout options for auto-created graph vertices. */
export interface AutoLayoutOptions {
    /** Number of columns in the grid (default: 3). */
    cols?: number;
    /** Horizontal spacing between columns in px (default: 420). */
    colWidth?: number;
    /** Vertical spacing between rows in px (default: 300). */
    rowHeight?: number;
}

const DEFAULT_LAYOUT: Required<AutoLayoutOptions> = {
    cols: 3,
    colWidth: 420,
    rowHeight: 300,
};

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

/**
 * Shallow comparison of React Flow node data objects.
 * Returns true if all top-level primitive values match and arrays have the
 * same length + same element references.  This avoids creating a new node
 * reference (and triggering RF re-measurement) when only the DClass Redux
 * reference changed but the derived RF data is semantically identical.
 */
function shallowDataEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (!a || !b) return false;
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;
    for (const key of keysA) {
        const va = a[key];
        const vb = b[key];
        if (va === vb) continue;
        // For arrays (attributes, references, operations, literals), compare
        // by length and element identity.
        if (Array.isArray(va) && Array.isArray(vb)) {
            if (va.length !== vb.length) return false;
            for (let i = 0; i < va.length; i++) {
                if (va[i] !== vb[i]) return false;
            }
            continue;
        }
        return false;
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

/**
 * Remove duplicate inheritance edges (same source→target).
 * A class can only extend another class once, so duplicate inheritance
 * edges are always erroneous. Keeps the first occurrence.
 */
function deduplicateInheritanceEdges(edges: Edge[]): Edge[] {
    const seen = new Set<string>();
    return edges.filter(e => {
        if (e.type !== 'inheritance') return true;
        const key = `inh:${e.source}→${e.target}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useJjomSync(
    modelid: string | undefined,
    setNodes: SetNodes,
    setEdges: SetEdges,
    onInitialized?: () => void,
    layoutOptions?: AutoLayoutOptions,
): UseJjomSyncResult {
    const layout = layoutOptions
        ? { ...DEFAULT_LAYOUT, ...layoutOptions }
        : DEFAULT_LAYOUT;
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

    // ── Selector: watch model's class count (triggers repopulation when
    //    model data arrives in store after script execution) ──────────
    const modelClassCount = useSelector((state: DState) => {
        if (!modelid) return 0;
        const rawModel = state.idlookup?.[modelid] as any;
        if (!rawModel) return 0;
        let count = 0;
        for (const pkgId of (rawModel.packages ?? [])) {
            const pkg = state.idlookup?.[pkgId] as any;
            if (!pkg) continue;
            count += (pkg.classes ?? []).length + (pkg.enumerators ?? []).length;
        }
        return count;
    });

    // ── Selector: watch total reference count across all classes
    //    (triggers repopulation when JjScript adds a reference) ──────
    const modelRefCount = useSelector((state: DState) => {
        if (!modelid) return 0;
        const rawModel = state.idlookup?.[modelid] as any;
        if (!rawModel) return 0;
        let count = 0;
        for (const pkgId of (rawModel.packages ?? [])) {
            const pkg = state.idlookup?.[pkgId] as any;
            if (!pkg) continue;
            for (const clsId of (pkg.classes ?? [])) {
                const cls = state.idlookup?.[clsId] as any;
                if (!cls) continue;
                count += (cls.references ?? []).length;
            }
        }
        return count;
    });

    // ── Auto-create / populate v2-flow graph ─────────────────────────
    const creatingGraphRef = useRef(false);
    const justCreatedGraphRef = useRef(false);

    useEffect(() => {
        if (!modelid || creatingGraphRef.current) return;

        // If no v2-flow graph exists yet, create one (even for empty metamodels).
        // Previously we waited for modelClassCount > 0, which caused a chicken-
        // and-egg problem: the graph is needed for JjOM mode, but JjOM mode is
        // needed to create classes, which populate classCount. We only wait for
        // classCount when the graph already exists (for incremental population).
        const needsNewGraph = !hasGraph;
        if (!needsNewGraph && modelClassCount === 0) return; // graph exists but model not ready

        // ── Determine what needs to be created ──────────────────────────
        // This effect is IDEMPOTENT: it checks existing graph elements and
        // only creates what's missing. This handles the case where the model
        // is built incrementally (e.g. Jjodie adds classes one at a time)
        // and the effect runs multiple times with growing modelClassCount.

        let graphId: any = graphInfo?.graphId ?? null;

        // Read FRESH store state (raw D-objects, not LProxy)
        const idlookup = store.getState()?.idlookup;
        if (!idlookup) return;

        const rawModel = idlookup[modelid] as any;
        if (!rawModel) return;

        // Recursively collect all classes/enums from model packages.
        // Raw DModel has "packages", raw DPackage has "classes"/"enumerators"/"subpackages".
        const classifierEntries: Array<{ id: string; raw: any }> = [];
        const visited = new Set<string>();

        const visitElement = (elemId: string) => {
            if (!elemId || typeof elemId !== 'string' || visited.has(elemId)) return;
            visited.add(elemId);
            const elem = idlookup[elemId] as any;
            if (!elem) return;

            if (elem.className === 'DPackage') {
                for (const classId of (elem.classes ?? [])) visitElement(classId);
                for (const enumId of (elem.enumerators ?? [])) visitElement(enumId);
                for (const subPkgId of (elem.subpackages ?? [])) visitElement(subPkgId);
            } else if (elem.className === 'DClass' || elem.className === 'DEnumerator') {
                classifierEntries.push({ id: elemId, raw: elem });
            }
        };

        for (const pkgId of (rawModel.packages ?? [])) visitElement(pkgId);

        console.log('[DEBUG populate] modelid:', modelid);
console.log('[DEBUG populate] rawModel.packages:', rawModel.packages);
console.log('[DEBUG populate] classifierEntries:', classifierEntries.length, classifierEntries.map(e => e.raw.name));



        // If no classifiers found AND we don't need a new graph, nothing to do.
        // When needsNewGraph, we must still create the graph (empty metamodel scenario).
        if (classifierEntries.length === 0 && !needsNewGraph) return;

        // ── Check existing graph elements ───────────────────────────────
        // Build maps of what already exists so we only create missing items.
        const vertexIdByModelId = new Map<string, string>();
        const existingEdgeKeys = new Set<string>();

        if (graphId) {
            const rawGraph = idlookup[graphId] as any;
            for (const seId of (rawGraph?.subElements ?? [])) {
                const se = idlookup[seId] as any;
                if (!se) continue;
                if (se.className?.includes('Vertex') && se.model) {
                    vertexIdByModelId.set(se.model, seId);
                }
                if (se.className?.includes('Edge') && se.start && se.end) {
                    existingEdgeKeys.add(`${se.start}→${se.end}`);
                }
            }
        }

        // Also check RF edge cache for existing edges. This handles the case
        // where canvas-created DVoidEdges aren't yet in the graph's subElements
        // (e.g. due to TRANSACTION nesting timing).
        for (const [, rfEdge] of rfEdgeCache.current) {
            if (rfEdge.source && rfEdge.target) {
                existingEdgeKeys.add(`${rfEdge.source}→${rfEdge.target}`);
            }
        }

        // Which classifiers still need vertices?
        const missingClassifiers = classifierEntries.filter(e => !vertexIdByModelId.has(e.id));

        // Which edges are missing? (check BEFORE creating vertices — we need
        // vertex IDs for edges, and some may not exist yet)
        let missingEdgeCount = 0;
        for (const entry of classifierEntries) {
            if (entry.raw.className !== 'DClass') continue;
            for (const supId of (entry.raw.extends ?? [])) {
                if (typeof supId !== 'string' || supId === entry.id) continue;
                const s = vertexIdByModelId.get(entry.id);
                const t = vertexIdByModelId.get(supId);
                const ek = s && t ? `${s}→${t}` : '';
                if (s && t && !existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)) missingEdgeCount++;
            }
            for (const refId of (entry.raw.references ?? [])) {
                const refObj = typeof refId === 'string' ? idlookup[refId] as any : null;
                if (!refObj) continue;
                const targetId = typeof refObj.type === 'string' ? refObj.type : null;
                if (!targetId) continue;
                const s = vertexIdByModelId.get(entry.id);
                const t = vertexIdByModelId.get(targetId);
                const ek = s && t ? `${s}→${t}` : '';
                if (s && t && !existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)) missingEdgeCount++;
            }
        }

        // Nothing to do? Early exit.
        if (!needsNewGraph && missingClassifiers.length === 0 && missingEdgeCount === 0) return;

        // ── Create missing elements ─────────────────────────────────────
        // Each DVertex.new / DVoidEdge.new2 has its own internal TRANSACTION,
        // so they must NOT be wrapped in an outer TRANSACTION (nesting
        // causes x/y coordinates to be lost).
        creatingGraphRef.current = true;
        justCreatedGraphRef.current = true;

        try {
            // Step 1: Create graph if needed
            if (needsNewGraph) {
                const dGraph = DGraph.new(0, modelid);
                graphId = dGraph.id;
                TRANSACTION('Tag v2-flow graph', () => {
                    SetFieldAction.new(graphId, 'graphStyle', 'v2-flow', '', false);
                    SetRootFieldAction.new('graphs', graphId, '+=', true);
                });
            }

            // Step 2: Create missing vertices
            if (missingClassifiers.length > 0) {
                const existingCount = vertexIdByModelId.size;
                const COLS = layout.cols;
                const COL_W = layout.colWidth;
                const ROW_H = layout.rowHeight;

                for (let i = 0; i < missingClassifiers.length; i++) {
                    const entry = missingClassifiers[i];
                    const globalIdx = existingCount + i;
                    const col = globalIdx % COLS;
                    const row = Math.floor(globalIdx / COLS);
                    const x = 50 + col * COL_W;
                    const y = 50 + row * ROW_H;

                    const size = new GraphSize(x, y, 200, 120);
                    const dv = DVertex.new(0, entry.id, graphId, graphId, undefined, size);
                    if (dv?.id) {
                        vertexIdByModelId.set(entry.id, dv.id);
                    }
                }
            }

            // Step 3: Create missing edges (inheritance + references).
            // Re-read store to get vertex IDs that were just created.
            if (missingClassifiers.length > 0) {
                const freshLookup = store.getState()?.idlookup;
                if (freshLookup) {
                    const freshGraph = freshLookup[graphId] as any;
                    for (const seId of (freshGraph?.subElements ?? [])) {
                        const se = freshLookup[seId] as any;
                        if (!se) continue;
                        if (se.className?.includes('Vertex') && se.model && !vertexIdByModelId.has(se.model)) {
                            vertexIdByModelId.set(se.model, seId);
                        }
                        if (se.className?.includes('Edge') && se.start && se.end) {
                            existingEdgeKeys.add(`${se.start}→${se.end}`);
                        }
                    }
                }
            }

            for (const entry of classifierEntries) {
                if (entry.raw.className !== 'DClass') continue;

                // Extends (inheritance)
                for (const supId of (entry.raw.extends ?? [])) {
                    if (typeof supId !== 'string' || supId === entry.id) continue;
                    const srcVertex = vertexIdByModelId.get(entry.id);
                    const tgtVertex = vertexIdByModelId.get(supId);
                    if (srcVertex && tgtVertex && srcVertex !== tgtVertex) {
                        const ek = `${srcVertex}→${tgtVertex}`;
                        if (!existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)) {
                            DVoidEdge.new2(
                                undefined, graphId, graphId, undefined,
                                srcVertex, tgtVertex,
                                (d: DEdge) => { d.isExtend = true; }
                            );
                            existingEdgeKeys.add(ek);
                            // Register pair so subsequent auto-populate runs
                            // won't recreate this edge even if DVoidEdge.new2
                            // didn't add it to the graph's subElements yet.
                            markCanvasEdgePair(srcVertex, tgtVertex);
                        }
                    }
                }

                // References
                for (const refId of (entry.raw.references ?? [])) {
                    const refObj = typeof refId === 'string' ? idlookup[refId] as any : null;
                    if (!refObj) continue;
                    const targetId = typeof refObj.type === 'string' ? refObj.type : null;
                    if (!targetId) continue;
                    const srcVertex = vertexIdByModelId.get(entry.id);
                    const tgtVertex = vertexIdByModelId.get(targetId);
                    if (srcVertex && tgtVertex) {
                        const ek = `${srcVertex}→${tgtVertex}`;
                        if (!existingEdgeKeys.has(ek) && !hasCanvasEdgePair(ek)) {
                            DVoidEdge.new2(
                                refId, graphId, graphId, undefined,
                                srcVertex, tgtVertex,
                                (d: DEdge) => { d.isReference = true; }
                            );
                            existingEdgeKeys.add(ek);
                            markCanvasEdgePair(srcVertex, tgtVertex);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn('[useJjomSync] Failed to create/populate v2-flow graph:', err);
        } finally {
            // Reset after a tick so selectors can pick up the new graph.
            // The 150ms delay ensures React has time to process Redux updates
            // before the effect can run again (avoids stale snapshots).
            setTimeout(() => { creatingGraphRef.current = false; }, 150);
        }
    }, [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount]);

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
                        // types, bounds, feature values, etc.). Changes when any
                        // child is updated in Redux. A single number entry per
                        // vertex — avoids infinite re-render loops.
                        let ch = 0;
                        for (const key of ['attributes', 'references', 'operations', 'literals', 'features']) {
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
                                // Include feature values (DValue.values) for M1 instance nodes
                                const vals = child.values;
                                if (Array.isArray(vals)) {
                                    for (const v of vals) {
                                        const vs = String(v ?? '');
                                        for (let j = 0; j < vs.length; j++) {
                                            ch = ((ch << 5) - ch + vs.charCodeAt(j)) | 0;
                                        }
                                    }
                                }
                                ch = (ch * 31 + 7) | 0; // separator
                            }
                        }
                        // M1 co-evolution: hash enum literals from the metaclass so
                        // that changes to enumerations trigger a re-sync.
                        const instOfPtr = modelElem.instanceof;
                        const metaclassId = typeof instOfPtr === 'string' ? instOfPtr
                            : (Array.isArray(instOfPtr) ? instOfPtr[0] : null);
                        if (metaclassId && typeof metaclassId === 'string') {
                            const mc = state.idlookup[metaclassId] as any;
                            if (mc?.attributes) {
                                for (const mAttrId of mc.attributes) {
                                    if (typeof mAttrId !== 'string') continue;
                                    const mAttr = state.idlookup[mAttrId] as any;
                                    const mTypeId = typeof mAttr?.type === 'string' ? mAttr.type : null;
                                    if (!mTypeId) continue;
                                    const mType = state.idlookup[mTypeId] as any;
                                    if (mType?.className === 'DEnumerator' && Array.isArray(mType.literals)) {
                                        for (const litId of mType.literals) {
                                            if (typeof litId !== 'string') continue;
                                            const lit = state.idlookup[litId] as any;
                                            const ln = lit?.name ?? '';
                                            for (let k = 0; k < ln.length; k++) {
                                                ch = ((ch << 5) - ch + ln.charCodeAt(k)) | 0;
                                            }
                                        }
                                    }
                                }
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
console.log('[DEBUG useJjomSync init] lGraph:', lGraph);
console.log('[DEBUG useJjomSync init] nodes:', lGraph?.nodes?.length, lGraph?.nodes);
console.log('[DEBUG useJjomSync init] edges:', lGraph?.edges?.length, lGraph?.edges);
console.log('[DEBUG useJjomSync init] subElementIds:', subElementIds.length, subElementIds);
if (!lGraph) return;

            const vertices: any[] = lGraph.nodes ?? [];
            const edges: any[] = lGraph.edges ?? [];



            const nodeCache = new Map<string, Node>();
            const edgeCache = new Map<string, Edge>();

            for (const v of vertices) {
                if (isSingletonSuppressed(v.id)) continue;
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
            console.log('[DEBUG setNodes]', nodeCache.size, 'nodes set:', Array.from(nodeCache.values()).map(n => n.id));

            setEdges(deduplicateInheritanceEdges(Array.from(edgeCache.values())));

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
        const patchedNodePositions = new Map<string, { x: number; y: number }>();
        const patchedNodeStyles = new Map<string, Record<string, any>>();
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
                        // Skip suppressed singleton vertices
                        if (isSingletonSuppressed(id)) continue;
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
                        const inCache = rfEdgeCache.current.has(id);
                        if (inCache) continue;

                        const rfEdge = jjomEdgeToRFEdge(lProxy);
                        // Guard: skip orphan edges (source/target vertex deleted)
                        if (rfEdge && currentIds.has(rfEdge.source) && currentIds.has(rfEdge.target)) {
                            // Deduplicate: skip if an RF edge with the same
                            // source→target and type already exists in the cache.
                            // This prevents duplicate edges caused by DVoidEdge.new2
                            // not reliably adding edges to graph subElements.
                            let isDuplicate = false;
                            if (rfEdge.type === 'inheritance') {
                                for (const [, existing] of rfEdgeCache.current) {
                                    if (existing.source === rfEdge.source &&
                                        existing.target === rfEdge.target &&
                                        existing.type === 'inheritance') {
                                        isDuplicate = true;
                                        break;
                                    }
                                }
                            }
                            if (isDuplicate) continue;

                            rfEdgeCache.current.set(rfEdge.id, rfEdge);
                            if (!isDropCreated) {
                                addedEdges.push(rfEdge);
                            }
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
                        if (existing) {
                            // Check if position changed in JjOM (external update)
                            const posChanged = rfNode.position.x !== existing.position.x
                                            || rfNode.position.y !== existing.position.y;
                            // Check if size changed (packageNode uses style.width/height)
                            const newW = (rfNode.style as any)?.width;
                            const newH = (rfNode.style as any)?.height;
                            const oldW = (existing.style as any)?.width;
                            const oldH = (existing.style as any)?.height;
                            const sizeChanged = (newW !== undefined || oldW !== undefined)
                                             && (newW !== oldW || newH !== oldH);

                            if (!posChanged) rfNode.position = existing.position;
                            if (!sizeChanged && existing.style) rfNode.style = existing.style;

                            if (posChanged) patchedNodePositions.set(id, rfNode.position);
                            if (sizeChanged && rfNode.style) patchedNodeStyles.set(id, rfNode.style as Record<string, any>);
                        }
                        rfNodeCache.current.set(id, rfNode);
                        // Only patch data if something actually changed — avoids
                        // creating a new node reference that triggers RF re-measurement
                        // and cascading re-renders (the "rename loop" bug).
                        if (!existing || !shallowDataEqual(existing.data, rfNode.data)) {
                            patchedNodeData.set(id, rfNode.data);
                        }
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

        const hasNodeChanges = addedNodes.length > 0 || removedNodeIds.size > 0
            || patchedNodeData.size > 0 || patchedNodePositions.size > 0 || patchedNodeStyles.size > 0;
        const hasEdgeChanges = addedEdges.length > 0 || removedEdgeIds.size > 0 || patchedEdges.size > 0;

        if (hasNodeChanges) {
            setNodes(prev => {
                let result = prev;

                if (removedNodeIds.size > 0) {
                    result = result.filter(n => !removedNodeIds.has(n.id));
                }

                // Patch data/position/style on changed nodes (preserves node object
                // identity for unchanged fields → RF skips re-measurement)
                if (patchedNodeData.size > 0 || patchedNodePositions.size > 0 || patchedNodeStyles.size > 0) {
                    result = result.map(n => {
                        const newData = patchedNodeData.get(n.id);
                        const newPos = patchedNodePositions.get(n.id);
                        const newStyle = patchedNodeStyles.get(n.id);
                        if (newData || newPos || newStyle) {
                            return {
                                ...n,
                                ...(newData ? { data: newData } : {}),
                                ...(newPos ? { position: newPos } : {}),
                                ...(newStyle ? { style: newStyle } : {}),
                            };
                        }
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
                        // RF-side handles (from getOptimalAnchors + applyDistribution) are
                        // authoritative. Always preserve them over JjOM-computed handles.
                        if (e.sourceHandle) merged.sourceHandle = e.sourceHandle;
                        if (e.targetHandle) merged.targetHandle = e.targetHandle;
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
                    result = [...result, ...addedEdges];
                }

                return deduplicateInheritanceEdges(result);
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
            clearCanvasEdgePairs();
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            initializedRef.current = false;
        };
    }, []);

    return { isJjomMode, hasGraph, graphId: graphInfo?.graphId ?? null, justCreatedGraphRef };
}

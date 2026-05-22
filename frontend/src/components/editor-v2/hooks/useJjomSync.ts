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
/**
 * Two-level shallow comparison for RF node `data` objects.
 * Level 1: compare each top-level key by identity.
 * Level 2: for arrays, compare elements shallowly (keys + primitive values).
 * This handles FeatureValueRow[] and similar arrays whose objects are recreated
 * by jjomVertexToRFNode on every call — without this, every incremental sync
 * cycle considers object-node data "changed" even when values are identical,
 * causing setNodes → StoreUpdater → re-measurement → infinite loop.
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
        if (Array.isArray(va) && Array.isArray(vb)) {
            if (va.length !== vb.length) return false;
            for (let i = 0; i < va.length; i++) {
                if (va[i] === vb[i]) continue;
                // One level deeper: compare object properties shallowly
                if (va[i] && vb[i] && typeof va[i] === 'object' && typeof vb[i] === 'object') {
                    const ka = Object.keys(va[i]);
                    const kb = Object.keys(vb[i]);
                    if (ka.length !== kb.length) return false;
                    let objEqual = true;
                    for (const ok of ka) {
                        const oa = va[i][ok];
                        const ob = vb[i][ok];
                        if (oa !== ob) {
                            // Deepest level: arrays of primitives (e.g. enumLiterals)
                            if (Array.isArray(oa) && Array.isArray(ob)) {
                                if (oa.length !== ob.length) { objEqual = false; break; }
                                for (let j = 0; j < oa.length; j++) {
                                    if (oa[j] !== ob[j]) { objEqual = false; break; }
                                }
                                if (!objEqual) break;
                                continue;
                            }
                            objEqual = false;
                            break;
                        }
                    }
                    if (!objEqual) return false;
                    continue;
                }
                return false;
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

    // ── Debounced push to React Flow ─────────────────────────────────
    // The Jjodel action system dispatches via setTimeout(fn, 0) (action.ts:349),
    // which means every COMMIT exits React's render batch. The periodic
    // setInterval → COMMIT in reducer.ts:1381 can fire multiple rapid
    // dispatches during editing. Without debouncing, each dispatch triggers
    // a separate incremental sync → setNodes → StoreUpdater → re-measure
    // → infinite loop.
    //
    // We accumulate patch operations and flush them in a single
    // requestAnimationFrame callback, coalescing multiple rapid syncs.
    const pendingNodePatchRef = useRef<((prev: Node[]) => Node[])[]>([]);
    const pendingEdgePatchRef = useRef<((prev: Edge[]) => Edge[])[]>([]);
    const rafIdRef = useRef<number>(0);

    const scheduleFlush = useCallback(() => {
        if (rafIdRef.current) return; // already scheduled
        rafIdRef.current = requestAnimationFrame(() => {
            rafIdRef.current = 0;
            const nodeFns = pendingNodePatchRef.current.splice(0);
            const edgeFns = pendingEdgePatchRef.current.splice(0);
            if (nodeFns.length > 0) {
                setNodes(prev => nodeFns.reduce((acc, fn) => fn(acc), prev));
            }
            if (edgeFns.length > 0) {
                setEdges(prev => edgeFns.reduce((acc, fn) => fn(acc), prev));
            }
        });
    }, [setNodes, setEdges]);

    // Cleanup raf on unmount
    useEffect(() => () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); }, []);
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

    // ── Selector: watch M1 object count (triggers edge auto-population
    //    for transformation-generated models) ──────────────────────────
    const modelObjectCount = useSelector((state: DState) => {
        if (!modelid) return 0;
        const rawModel = state.idlookup?.[modelid] as any;
        return (rawModel?.objects ?? []).length;
    });

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
        if (!needsNewGraph && modelClassCount === 0 && modelObjectCount === 0) return;

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

        // If no classifiers AND no M1 objects AND graph exists → nothing to do.
        const hasM1Objects = (rawModel.objects ?? []).length > 0;
        if (classifierEntries.length === 0 && !hasM1Objects && !needsNewGraph) return;

        // ── Check existing graph elements ───────────────────────────────
        // Build maps of what already exists so we only create missing items.
        const vertexIdByModelId = new Map<string, string>();
        const existingEdgeKeys = new Set<string>();

        // Reference edges use a composite key (refId:src→tgt) so multiple
        // refs between the same src/tgt pair (e.g. Family→Member: father,
        // mother, sons, daughters) each get their own edge. Inheritance
        // edges keep the pair-only key (a class extends another at most once).
        const edgeKeyForD = (se: any): string => {
            const refIdPtr = typeof se?.model === 'string' ? se.model : null;
            return refIdPtr
                ? `${refIdPtr}:${se.start}→${se.end}`
                : `${se.start}→${se.end}`;
        };

        if (graphId) {
            const rawGraph = idlookup[graphId] as any;
            for (const seId of (rawGraph?.subElements ?? [])) {
                const se = idlookup[seId] as any;
                if (!se) continue;
                if (se.className?.includes('Vertex') && se.model) {
                    vertexIdByModelId.set(se.model, seId);
                }
                if (se.className?.includes('Edge') && se.start && se.end) {
                    existingEdgeKeys.add(edgeKeyForD(se));
                }
            }
        }

        // Also check RF edge cache for existing edges. This handles the case
        // where canvas-created DVoidEdges aren't yet in the graph's subElements
        // (e.g. due to TRANSACTION nesting timing).
        for (const [, rfEdge] of rfEdgeCache.current) {
            if (!rfEdge.source || !rfEdge.target) continue;
            const refId = (rfEdge.data as any)?.jjomRefId ?? (rfEdge.data as any)?.referenceId;
            existingEdgeKeys.add(refId && rfEdge.type !== 'inheritance'
                ? `${refId}:${rfEdge.source}→${rfEdge.target}`
                : `${rfEdge.source}→${rfEdge.target}`);
        }

        // Race-window safety net: scan idlookup for DEdges whose endpoints are
        // this graph's vertices but that may not yet be linked into subElements
        // (canvasToJjom flows mark pair-based hasCanvasEdgePair, but composite
        // keys make that guard incompatible — the scan replaces it for refs).
        const ourVertexIds = new Set(vertexIdByModelId.values());
        for (const eid in idlookup) {
            const se = idlookup[eid] as any;
            if (!se?.className?.includes('Edge')) continue;
            if (!se.start || !se.end) continue;
            if (!ourVertexIds.has(se.start) || !ourVertexIds.has(se.end)) continue;
            existingEdgeKeys.add(edgeKeyForD(se));
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
                if (!s || !t) continue;
                // Composite key allows sibling references; pair-based
                // hasCanvasEdgePair would block them, so it's omitted here.
                const ek = `${refId}:${s}→${t}`;
                if (!existingEdgeKeys.has(ek)) missingEdgeCount++;
            }
        }

        // Count missing M1 instance reference edges.
        // For each DObject, check if its reference features have values
        // that point to other DObjects with vertices — if the edge doesn't
        // exist yet, it needs to be created.
        let missingM1EdgeCount = 0;
        for (const objId of (rawModel.objects ?? [])) {
            if (typeof objId !== 'string') continue;
            const dObj = idlookup[objId] as any;
            if (!dObj) continue;
            const srcV = vertexIdByModelId.get(objId);
            if (!srcV) continue;
            for (const featId of (dObj.features ?? [])) {
                if (typeof featId !== 'string') continue;
                const dFeat = idlookup[featId] as any;
                if (!dFeat) continue;
                const metaId = dFeat.instanceof;
                if (!metaId) continue;
                const meta = idlookup[metaId] as any;
                if (!meta || meta.className !== 'DReference') continue;
                for (const tgtObjId of (dFeat.values ?? [])) {
                    if (typeof tgtObjId !== 'string') continue;
                    const tgtV = vertexIdByModelId.get(tgtObjId);
                    if (!tgtV) continue;
                    // Composite key (metaId:src→tgt): same metaref can be
                    // instantiated across many object pairs (Family1.father
                    // → Member1, Family2.father → Member3, ...).
                    const ek = `${metaId}:${srcV}→${tgtV}`;
                    if (!existingEdgeKeys.has(ek)) missingM1EdgeCount++;
                }
            }
        }

        // Count missing M1 object vertices.
        // (Mirror of the missingClassifiers calc, but for DObject in rawModel.objects)
        let missingObjectsCount = 0;
        for (const objId of (rawModel.objects ?? [])) {
            if (typeof objId !== 'string') continue;
            if (!idlookup[objId]) continue;
            if (vertexIdByModelId.has(objId)) continue;
            if (isSingletonSuppressed(objId)) continue;
            missingObjectsCount++;
        }

        // Nothing to do? Early exit.
        if (!needsNewGraph && missingClassifiers.length === 0
            && missingObjectsCount === 0
            && missingEdgeCount === 0 && missingM1EdgeCount === 0) return;

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

            // Step 2bis: Create missing M1 object vertices.
            // JjScript and JjTL transformations create DObject instances directly,
            // without creating their corresponding DVertex in the flow graph. This
            // step ensures every DObject in the model is represented in the graph.
            if (missingObjectsCount > 0) {
                const existingCount = vertexIdByModelId.size;
                const COLS = layout.cols;
                const COL_W = layout.colWidth;
                const ROW_H = layout.rowHeight;
                let createdSoFar = 0;

                for (const objId of (rawModel.objects ?? [])) {
                    if (typeof objId !== 'string') continue;
                    const dObj = idlookup[objId] as any;
                    if (!dObj) continue;
                    if (vertexIdByModelId.has(objId)) continue;
                    if (isSingletonSuppressed(objId)) continue;

                    const globalIdx = existingCount + createdSoFar;
                    const col = globalIdx % COLS;
                    const row = Math.floor(globalIdx / COLS);
                    const x = 50 + col * COL_W;
                    const y = 50 + row * ROW_H;

                    const size = new GraphSize(x, y, 200, 120);
                    const dv = DVertex.new(0, objId, graphId, graphId, undefined, size);
                    if (dv?.id) {
                        vertexIdByModelId.set(objId, dv.id);
                        createdSoFar++;
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
                            existingEdgeKeys.add(edgeKeyForD(se));
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
                        // Composite key allows multiple references between the
                        // same pair (Family→Member: father, mother, sons, ...).
                        // hasCanvasEdgePair is pair-based and would block siblings,
                        // so it's not consulted here — race-window protection is
                        // provided by the idlookup scan above.
                        const ek = `${refId}:${srcVertex}→${tgtVertex}`;
                        if (!existingEdgeKeys.has(ek)) {
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

            // Step 4: Create missing M1 instance reference edges.
            // For each DObject in the model, scan its reference features and
            // create DVoidEdge for every (sourceVertex, targetVertex) pair that
            // doesn't have an edge yet. This makes reference values written by
            // JjTL transformations (or by STEP 8b in ProjectEditor) visible as
            // edges in the flow diagram.
            if (missingM1EdgeCount > 0) {
                // Re-read store in case Step 2 just created vertices
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
                            existingEdgeKeys.add(edgeKeyForD(se));
                        }
                    }
                }
                for (const objId of (rawModel.objects ?? [])) {
                    if (typeof objId !== 'string') continue;
                    const dObj = (freshLookup ?? idlookup)[objId] as any;
                    if (!dObj) continue;
                    const srcVertex = vertexIdByModelId.get(objId);
                    if (!srcVertex) continue;
                    for (const featId of (dObj.features ?? [])) {
                        if (typeof featId !== 'string') continue;
                        const dFeat = (freshLookup ?? idlookup)[featId] as any;
                        if (!dFeat) continue;
                        const metaId = dFeat.instanceof;
                        if (!metaId) continue;
                        const meta = (freshLookup ?? idlookup)[metaId] as any;
                        if (!meta || meta.className !== 'DReference') continue;
                        for (const tgtObjId of (dFeat.values ?? [])) {
                            if (typeof tgtObjId !== 'string') continue;
                            const tgtVertex = vertexIdByModelId.get(tgtObjId);
                            if (!tgtVertex) continue;
                            // Composite key (metaId:src→tgt): same metaref can
                            // appear in multiple object pairs; each pair gets
                            // its own edge.
                            const ek = `${metaId}:${srcVertex}→${tgtVertex}`;
                            if (!existingEdgeKeys.has(ek)) {
                                DVoidEdge.new2(
                                    metaId, graphId, graphId, undefined,
                                    srcVertex, tgtVertex,
                                    (d: DEdge) => { d.isReference = true; }
                                );
                                existingEdgeKeys.add(ek);
                                markCanvasEdgePair(srcVertex, tgtVertex);
                            }
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
    }, [modelid, hasGraph, subElementIds.length, modelClassCount, modelRefCount, modelObjectCount]);

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
            const rfNodesToSet = Array.from(nodeCache.values());
            setNodes(rfNodesToSet);

            const rfEdgesToSet = deduplicateInheritanceEdges(Array.from(edgeCache.values()));
            setEdges(rfEdgesToSet);

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
                        if (inCache) {
                            // eslint-disable-next-line no-console
                            console.log('[BUG-DIAG] useJjomSync skip edge already in cache', { edgeId: id });
                            continue;
                        }

                        const rfEdge = jjomEdgeToRFEdge(lProxy);
                        // [BUG-DIAG] trace edge addition decisions.
                        // eslint-disable-next-line no-console
                        console.log('[BUG-DIAG] useJjomSync edge addition candidate', {
                            edgeId: id,
                            isDropCreated,
                            rfEdgeProduced: !!rfEdge,
                            sourceInGraph: rfEdge ? currentIds.has(rfEdge.source) : null,
                            targetInGraph: rfEdge ? currentIds.has(rfEdge.target) : null,
                            type: rfEdge?.type,
                            label: rfEdge?.label,
                        });
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
            // damiano: this is wrong. it is sometimes taking newElement instead. source of isSingleton bug
            let prevModel = prevElements.get(`model:${id}`);
            // forcing to update by giving it a different object, until it gets a better fix.
            prevModel = {} as any;
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
            // Capture patch data in closure for the deferred callback.
            // Spread into local copies since the Maps are reused across effect runs.
            const _addedNodes = [...addedNodes];
            const _removedNodeIds = new Set(removedNodeIds);
            const _patchedNodeData = new Map(patchedNodeData);
            const _patchedNodePositions = new Map(patchedNodePositions);
            const _patchedNodeStyles = new Map(patchedNodeStyles);

            pendingNodePatchRef.current.push(prev => {
                let result = prev;

                if (_removedNodeIds.size > 0) {
                    result = result.filter(n => !_removedNodeIds.has(n.id));
                }

                if (_patchedNodeData.size > 0 || _patchedNodePositions.size > 0 || _patchedNodeStyles.size > 0) {
                    result = result.map(n => {
                        const newData = _patchedNodeData.get(n.id);
                        const newPos = _patchedNodePositions.get(n.id);
                        const newStyle = _patchedNodeStyles.get(n.id);
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

                if (_addedNodes.length > 0) {
                    result = [...result, ..._addedNodes];
                }

                return result;
            });
            scheduleFlush();
        }

        if (hasEdgeChanges) {
            const _addedEdges = [...addedEdges];
            const _removedEdgeIds = new Set(removedEdgeIds);
            const _patchedEdges = new Map(patchedEdges);

            pendingEdgePatchRef.current.push(prev => {
                let result = prev;

                if (_removedEdgeIds.size > 0) {
                    result = result.filter(e => !_removedEdgeIds.has(e.id));
                }

                if (_patchedEdges.size > 0) {
                    result = result.map(e => {
                        const newEdge = _patchedEdges.get(e.id);
                        if (!newEdge) return e;
                        const merged = { ...newEdge };
                        if (e.sourceHandle) merged.sourceHandle = e.sourceHandle;
                        if (e.targetHandle) merged.targetHandle = e.targetHandle;
                        const existingData = (e.data as any) ?? {};
                        const mergedData = (merged.data as any) ?? {};
                        // Preserve local routing customizations that are not
                        // persisted in JjOM and would otherwise be lost after
                        // incremental sync patches.
                        if (existingData.waypoints !== undefined && mergedData.waypoints === undefined) {
                            mergedData.waypoints = existingData.waypoints;
                        }
                        if (existingData.sourceAnchor && !mergedData.sourceAnchor) {
                            mergedData.sourceAnchor = existingData.sourceAnchor;
                        }
                        if (existingData.targetAnchor && !mergedData.targetAnchor) {
                            mergedData.targetAnchor = existingData.targetAnchor;
                        }
                        merged.data = mergedData;
                        const existingJjomRefId = (e.data as any)?.jjomRefId;
                        if (existingJjomRefId && !(merged.data as any)?.jjomRefId) {
                            (merged.data as any).jjomRefId = existingJjomRefId;
                        }
                        const existingRef = (e.data as any)?.reference;
                        const newRef = (merged.data as any)?.reference;
                        if (existingRef && newRef && newRef.kind === 'association' && existingRef.kind !== 'association') {
                            (merged.data as any).reference = {
                                ...newRef,
                                kind: existingRef.kind,
                                containment: existingRef.containment,
                            };
                        }
                        rfEdgeCache.current.set(e.id, merged);
                        return merged;
                    });
                }

                if (_addedEdges.length > 0) {
                    result = [...result, ..._addedEdges];
                }

                return deduplicateInheritanceEdges(result);
            });
            scheduleFlush();
        }
    }, [isJjomMode, elementSnapshots, subElementIds, scheduleFlush, Date.now()]);
    // todo: remove Date.now() from dependencies, it forces update to fix singleton issue but it's sub-optimal

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

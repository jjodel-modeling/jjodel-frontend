/**
 * Editor V3 — useJjomSyncV3: Incremental bidirectional sync JjOM → React Flow.
 *
 * Forked from editor-v2/hooks/useJjomSync.ts and adapted for:
 * - Single node type (ModelNode with ModelNodeData)
 * - V3 graph style tag ('v3-editor')
 * - Extended support for DObject (M1) and DGraphVertex
 *
 * Flow:
 * 1. On mount: full transformation from JjOM → rfCache
 * 2. On Redux changes: per-element reference equality check → re-transform only changed
 * 3. Anti-bounce: elements recently written from canvas are skipped
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
import { jjomVertexToV3Node, jjomEdgeToV3Edge } from './jjomTransformers';
import {
    isCanvasUpdated,
    purgeExpired,
    consumeDropCreated,
    cleanupAll,
} from './syncCoordinator';
import { V3_GRAPH_STYLE } from '../constants';
import type { V3Node, V3Edge, NotationMode, ColorScheme } from '../types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseJjomSyncV3Result {
    /** True when modelid is provided and a matching graph exists in Redux. */
    isJjomMode: boolean;
    /** True when a graph was found for the modelid. */
    hasGraph: boolean;
    /** The JjOM graph ID (DGraph pointer), available when isJjomMode is true. */
    graphId: string | null;
}

type SetNodes = React.Dispatch<React.SetStateAction<Node[]>>;
type SetEdges = React.Dispatch<React.SetStateAction<Edge[]>>;

const EMPTY_ARRAY: string[] = [];

// ---------------------------------------------------------------------------
// Custom equality for per-element selectors
// ---------------------------------------------------------------------------

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

export function useJjomSyncV3(
    modelid: string | undefined,
    setNodes: SetNodes,
    setEdges: SetEdges,
    notation: NotationMode = 'uml',
    colorScheme: ColorScheme = 'default',
    onInitialized?: () => void,
): UseJjomSyncV3Result {
    // ── rfCache: Map<elementId, RF Node | RF Edge> ─────────────────────
    const rfNodeCache = useRef<Map<string, V3Node>>(new Map());
    const rfEdgeCache = useRef<Map<string, V3Edge>>(new Map());

    // ── Previous D-object references for diffing ───────────────────────
    const prevElementsRef = useRef<Map<string, any>>(new Map());
    const prevSubElementsRef = useRef<string[]>(EMPTY_ARRAY);

    // ── Initialization flag ────────────────────────────────────────────
    const initializedRef = useRef(false);
    const prevModelidRef = useRef<string | undefined>(undefined);

    // ── Selector 1: Find the v3-editor DGraph for this modelid ─────────
    const graphInfo = useSelector((state: DState) => {
        if (!modelid) return null;
        try {
            const dGraphs: DGraph[] = DGraph.fromPointer(state.graphs);
            const matching = dGraphs.find(
                g => g?.model === modelid && (g as any).graphStyle === V3_GRAPH_STYLE,
            );
            if (!matching) return null;
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

    // ── Auto-create v3-editor graph if none exists ─────────────────────
    const creatingGraphRef = useRef(false);

    useEffect(() => {
        if (!modelid || hasGraph || creatingGraphRef.current) return;

        creatingGraphRef.current = true;
        try {
            TRANSACTION('Create v3-editor graph', () => {
                // 1. Create the graph
                const dGraph = DGraph.new(0, modelid);
                const graphId = dGraph.id;

                // 2. Tag as v3-editor
                SetFieldAction.new(graphId, 'graphStyle', V3_GRAPH_STYLE, '', false);

                // 3. Add to state.graphs
                SetRootFieldAction.new('graphs', graphId, '+=', true);

                // 4. Populate from model: scan classifiers and create vertices
                const lModel: any = LPointerTargetable.fromPointer(modelid);
                if (!lModel) return;

                const allClassifiers: any[] = lModel.classifiers ?? lModel.children ?? [];
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

                // 5. Create edges for extends and references
                for (const cls of classifiers) {
                    if (!cls?.id) continue;
                    const className = cls.className ?? cls.__raw?.className;

                    if (className === 'DClass') {
                        // Extends (inheritance)
                        const supers: any[] = cls.extendedBy ?? cls.superClasses ?? [];
                        for (const sup of supers) {
                            const supId = typeof sup === 'string' ? sup : sup?.id;
                            if (!supId || supId === cls.id) continue;
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
            console.warn('[useJjomSyncV3] Failed to create v3-editor graph:', err);
        } finally {
            setTimeout(() => { creatingGraphRef.current = false; }, 100);
        }
    }, [modelid, hasGraph]);

    // ── Selector 2: Per-element D-object references ────────────────────
    // Helper: extract the model element ID from a raw D-object's model field.
    // The field can be a string pointer, an array of pointers, or an object with .id.
    const resolveModelId = (rawModelField: any): string | null => {
        if (!rawModelField) return null;
        if (typeof rawModelField === 'string') return rawModelField;
        if (Array.isArray(rawModelField)) return rawModelField[0] ?? null;
        if (typeof rawModelField === 'object' && rawModelField.id) return rawModelField.id;
        return null;
    };

    const elementSnapshots = useSelector((state: DState) => {
        if (subElementIds.length === 0) return null;
        const result = new Map<string, any>();
        for (const id of subElementIds) {
            const elem = state.idlookup[id];
            if (elem) {
                result.set(id, elem);
                const rawModel = (elem as any).model;
                const modelId = resolveModelId(rawModel);
                if (modelId) {
                    const modelElem = state.idlookup[modelId] as any;
                    if (modelElem) {
                        result.set(`model:${id}`, modelElem);
                        // Track scalar model fields — name, abstract, etc.
                        result.set(`name:${id}`, modelElem.name ?? '');
                        result.set(`abs:${id}`, modelElem.abstract ?? false);
                        // Lightweight hash of children properties
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
                                const t = (typeof child.type === 'string' ? child.type : child.type?.id ?? '');
                                for (let i = 0; i < t.length; i++) {
                                    ch = ((ch << 5) - ch + t.charCodeAt(i)) | 0;
                                }
                                ch = (ch * 31 + (child.lowerBound ?? 0)) | 0;
                                ch = (ch * 31 + (child.upperBound ?? 0)) | 0;
                                ch = (ch * 31 + (child.abstract ? 1 : 0)) | 0;
                                ch = (ch * 31 + (child.composition ? 1 : 0)) | 0;
                                ch = (ch * 31 + 7) | 0;
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
            if (initializedRef.current) {
                rfNodeCache.current.clear();
                rfEdgeCache.current.clear();
                prevElementsRef.current.clear();
                prevSubElementsRef.current = EMPTY_ARRAY;
                initializedRef.current = false;
            }
            return;
        }

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
            const lGraph: any = LGraph.fromPointer(graphInfo!.graphId);
            if (!lGraph) return;

            const vertices: any[] = lGraph.nodes ?? [];
            const edges: any[] = lGraph.edges ?? [];

            const nodeCache = new Map<string, V3Node>();
            const edgeCache = new Map<string, V3Edge>();

            for (const v of vertices) {
                const rfNode = jjomVertexToV3Node(v, notation, colorScheme);
                if (rfNode) nodeCache.set(rfNode.id, rfNode);
            }
            for (const e of edges) {
                const rfEdge = jjomEdgeToV3Edge(e, notation, colorScheme);
                if (rfEdge && nodeCache.has(rfEdge.source) && nodeCache.has(rfEdge.target)) {
                    edgeCache.set(rfEdge.id, rfEdge);
                }
            }

            rfNodeCache.current = nodeCache;
            rfEdgeCache.current = edgeCache;

            if (elementSnapshots) {
                prevElementsRef.current = new Map(elementSnapshots);
            }
            prevSubElementsRef.current = subElementIds;

            setNodes(Array.from(nodeCache.values()));
            setEdges(Array.from(edgeCache.values()));

            initializedRef.current = true;

            if (onInitialized) {
                requestAnimationFrame(() => onInitialized());
            }
        } catch (err) {
            console.warn('[useJjomSyncV3] Initialization error:', err);
        }
    }, [isJjomMode, modelid, graphInfo, elementSnapshots, setNodes, setEdges,
        subElementIds, notation, colorScheme]);

    // ── Incremental sync: JjOM → Canvas ────────────────────────────────
    useEffect(() => {
        if (!isJjomMode || !initializedRef.current || !elementSnapshots) return;

        purgeExpired();

        const currentIds = new Set(subElementIds);
        const prevIds = new Set(prevSubElementsRef.current);

        const addedNodes: V3Node[] = [];
        const addedEdges: V3Edge[] = [];
        const removedNodeIds = new Set<string>();
        const removedEdgeIds = new Set<string>();
        const patchedNodeData = new Map<string, any>();
        const patchedEdges = new Map<string, V3Edge>();

        // --- Structural changes: additions ---
        for (const id of currentIds) {
            if (!prevIds.has(id)) {
                const isDropCreated = consumeDropCreated(id);

                try {
                    const lProxy: any = LPointerTargetable.fromPointer(id);
                    if (!lProxy) continue;
                    const className = lProxy.className ?? lProxy.__raw?.className;

                    if (isVertexClassName(className)) {
                        if (!isDropCreated && rfNodeCache.current.has(id)) continue;

                        const rfNode = jjomVertexToV3Node(lProxy, notation, colorScheme);
                        if (rfNode) {
                            if (isDropCreated) {
                                rfNode.data = { ...rfNode.data, autoEdit: true };
                            }
                            rfNodeCache.current.set(rfNode.id, rfNode);
                            addedNodes.push(rfNode);
                        }
                    } else if (isEdgeClassName(className)) {
                        if (rfEdgeCache.current.has(id)) continue;

                        const rfEdge = jjomEdgeToV3Edge(lProxy, notation, colorScheme);
                        if (rfEdge && currentIds.has(rfEdge.source) && currentIds.has(rfEdge.target)) {
                            rfEdgeCache.current.set(rfEdge.id, rfEdge);
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
            if (isCanvasUpdated(id)) continue;

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
                    const rfNode = jjomVertexToV3Node(lProxy, notation, colorScheme);
                    if (rfNode) {
                        const existing = rfNodeCache.current.get(id);
                        if (existing) rfNode.position = existing.position;
                        rfNodeCache.current.set(id, rfNode);
                        patchedNodeData.set(id, rfNode.data);
                    }
                } else if (isEdgeClassName(className)) {
                    const rfEdge = jjomEdgeToV3Edge(lProxy, notation, colorScheme);
                    if (rfEdge) {
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
        const hasNodeChanges = addedNodes.length > 0 || removedNodeIds.size > 0 || patchedNodeData.size > 0;
        const hasEdgeChanges = addedEdges.length > 0 || removedEdgeIds.size > 0 || patchedEdges.size > 0;

        if (hasNodeChanges) {
            setNodes(prev => {
                let result = prev;
                if (removedNodeIds.size > 0) {
                    result = result.filter(n => !removedNodeIds.has(n.id));
                }
                if (patchedNodeData.size > 0) {
                    result = result.map(n => {
                        const newData = patchedNodeData.get(n.id);
                        return newData ? { ...n, data: newData } : n;
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
                        const merged = { ...newEdge };
                        if (!merged.sourceHandle && e.sourceHandle) merged.sourceHandle = e.sourceHandle;
                        if (!merged.targetHandle && e.targetHandle) merged.targetHandle = e.targetHandle;
                        rfEdgeCache.current.set(e.id, merged);
                        return merged;
                    });
                }
                if (addedEdges.length > 0) {
                    result = [...result, ...addedEdges];
                }
                return result;
            });
        }
    }, [isJjomMode, elementSnapshots, subElementIds, setNodes, setEdges,
        notation, colorScheme]);

    // ── Cleanup on unmount ─────────────────────────────────────────────
    useEffect(() => {
        return () => {
            cleanupAll();
            rfNodeCache.current.clear();
            rfEdgeCache.current.clear();
            prevElementsRef.current.clear();
            initializedRef.current = false;
        };
    }, []);

    return { isJjomMode, hasGraph, graphId: graphInfo?.graphId ?? null };
}

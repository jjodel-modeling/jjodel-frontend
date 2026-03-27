import React, { useCallback, useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import {
    ReactFlow,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    useStoreApi,
    useStore,
    SelectionMode,
    ConnectionMode,
    PanOnScrollMode,
    reconnectEdge,
    applyEdgeChanges,
    type Node,
    type Edge,
    type EdgeChange,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ClassNode from './nodes/ClassNode';
import EnumNode from './nodes/EnumNode';
import PackageNode from './nodes/PackageNode';
import ObjectNode from './nodes/ObjectNode';
import UnifiedEdge from './edges/UnifiedEdge';
import PalettePanel from './panels/PalettePanel';
// PropertiesPanel removed — properties editing is handled by the dock-based Info panel
// import PropertiesPanel from './panels/PropertiesPanel';
import Toolbar from './Toolbar';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { useHistory } from './hooks/useHistory';
import { useAlignment } from './hooks/useAlignment';
import { useAutoAnchor, computeAnchorsWithHysteresis, getNodeRect } from './hooks/useAutoAnchor';
import { EditorContext } from './contexts/EditorContext';
import { getNextFreeHandleIndex, computePortDistribution } from './utils/portDistribution';
import type { ClassNodeData, EnumNodeData, PackageNodeData, ObjectNodeData, ReferenceEdgeData, InheritanceEdgeData, CompositionEdgeData, InstanceReferenceEdgeData, AnchorConfig, ReferenceKind, NotationMode, ColorScheme } from './types';
import { EdgeTypePopup, type EdgeTypeChoice } from './components/EdgeTypePopup';
import { M1ReferencePopup } from './components/M1ReferencePopup';
import { useJjomSync } from './hooks/useJjomSync';
import { useJjomSelection } from './hooks/useJjomSelection';
import { useEditorMode, type MetaclassInfo, type MetaclassReference } from './hooks/useEditorMode';
import { useClassRemoval } from './hooks/useClassRemoval';
import { useConformanceGuard } from '../../model/conformance/useConformanceGuard';
import { useOrphanFeatures } from './hooks/useOrphanFeatures';
import { getSyncMode, markDropCreated, suppressSingleton, unsuppressSingleton, clearSuppressedSingletons, getSuppressedSingletonIds } from './sync/syncState';
import {
    syncPositionToJjom,
    syncPositionBatchToJjom,
    syncSizeToJjom,
    syncInheritanceEdge,
    syncReferenceEdge,
    syncDeleteVertex,
    syncDeleteEdge,
    syncCreateClass,
    syncCreateEnum,
    syncCreatePackage,
    syncCreateObject,
    syncCreateCompositionLink,
    syncCreateReferenceLink,
    syncEdgeRefKind,
    syncRemoveAttribute,
    syncRemoveOperation,
    nextUniqueName,
    getModelInfo,
    setModelName,
    setModelUri,
    reconcileJjomAfterUndoRedo,
} from './sync/canvasToJjom';
import { computeElkLayout } from './utils/elkLayout';
import { rafThrottle, cancelThrottle } from '../../utils/DragThrottle';
import { getCompositionChildOptions, getCompatibleReferences, type CompatibleReference } from './utils/compositionCompat';
import { LPointerTargetable, store, DState, SetRootFieldAction, DVertex, GraphSize } from '../../joiner';
import { jjomVertexToRFNode } from './utils/jjomTransformers';
import { useTheme } from '../../services/ThemeService';
import { getDraggedMetaclassId } from './utils/dragState';
import { PolymetricView } from '../polymetric';

import './EditorV2.scss';

// Register custom node types (M2 + M1)
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
    objectNode: ObjectNode,         // M1: instance of a metaclass
};

// Register custom edge types — all map to UnifiedEdge which handles all variants
const edgeTypes: EdgeTypes = {
    reference: UnifiedEdge,
    inheritance: UnifiedEdge,
    composition: UnifiedEdge,       // M1: containment edge
    instanceRef: UnifiedEdge,       // M1: non-containment reference
};

// Initial nodes for metamodel demonstration
const initialNodes: Node[] = [
    // Package — container
    {
        id: 'pkg_1',
        type: 'packageNode',
        position: { x: 20, y: 20 },
        style: { zIndex: -1, width: 520, height: 280 },
        data: { label: 'myMetamodel' } satisfies PackageNodeData,
    },
    // Person — top left
    {
        id: 'class_1',
        type: 'classNode',
        position: { x: 50, y: 60 },
        data: {
            label: 'Person',
            isAbstract: false,
            attributes: [
                { id: 'a1', name: 'name', type: 'EString', lowerBound: 1, upperBound: 1 },
                { id: 'a2', name: 'age', type: 'EInt', lowerBound: 0, upperBound: 1 },
            ],
        } satisfies ClassNodeData,
    },
    // Address — right of Person
    {
        id: 'class_2',
        type: 'classNode',
        position: { x: 330, y: 60 },
        data: {
            label: 'Address',
            isAbstract: false,
            attributes: [
                { id: 'a3', name: 'street', type: 'EString', lowerBound: 1, upperBound: 1 },
                { id: 'a4', name: 'city', type: 'EString', lowerBound: 1, upperBound: 1 },
                { id: 'a5', name: 'zipCode', type: 'EString', lowerBound: 0, upperBound: 1 },
            ],
        } satisfies ClassNodeData,
    },
    // NamedElement — below Person
    {
        id: 'class_3',
        type: 'classNode',
        position: { x: 50, y: 200 },
        data: {
            label: 'NamedElement',
            isAbstract: true,
            attributes: [
                { id: 'a6', name: 'name', type: 'EString', lowerBound: 1, upperBound: 1 },
            ],
        } satisfies ClassNodeData,
    },
    // Gender — below Address
    {
        id: 'enum_1',
        type: 'enumNode',
        position: { x: 350, y: 200 },
        data: {
            label: 'Gender',
            literals: [
                { id: 'l1', name: 'MALE', value: 0 },
                { id: 'l2', name: 'FEMALE', value: 1 },
                { id: 'l3', name: 'OTHER', value: 2 },
            ],
        } satisfies EnumNodeData,
    },
];

// Initial edges for demonstration
const initialEdges: Edge[] = [
    // Person -> Address (association)
    {
        id: 'ref_1',
        source: 'class_1',
        target: 'class_2',
        sourceHandle: 'right-0',
        targetHandle: 'left-0',
        type: 'reference',
        label: 'addresses',
        data: {
            reference: {
                id: 'ref_1',
                name: 'addresses',
                kind: 'association',
                targetClassId: 'class_2',
                lowerBound: 0,
                upperBound: -1,
                containment: false,
            },
        } as ReferenceEdgeData,
    },
    // Person extends NamedElement (inheritance)
    {
        id: 'inh_1',
        source: 'class_1',
        target: 'class_3',
        sourceHandle: 'bottom-0',
        targetHandle: 'top-0',
        type: 'inheritance',
        data: {} as InheritanceEdgeData,
    },
];

// Default edge options
const defaultEdgeOptions = {
    type: 'reference',
};

// Context menu state type
interface ContextMenuState {
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
    childId?: string;
    childKind?: 'attr' | 'op';
    isMultiSelect?: boolean;
    selectedCount?: number;
}

// Clipboard state type
interface ClipboardState {
    nodes: Node[];
    edges: Edge[];
}

// Pending connection waiting for user to pick edge type via popup
interface PendingConnection {
    connection: Connection;
    position: { x: number; y: number };
}

export interface EditorV2Props {
    /** Model ID from JjOM. When provided, the editor will read from Redux (Phase 2). */
    modelid?: string;
    /** Callback to switch back to the classic editor. */
    onSwitchEditor?: () => void;
}

/**
 * Inner editor component that uses React Flow hooks.
 * Must be wrapped in ReactFlowProvider.
 */
function EditorV2Inner({ modelid, onSwitchEditor }: EditorV2Props) {
    // Phase 3: React Flow state — initialised from demo data when standalone,
    // or populated by useJjomSync when modelid is provided.
    const [nodes, setNodes, onNodesChange] = useNodesState(modelid ? [] : initialNodes);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [edges, setEdgesRaw, _onEdgesChangeRaw] = useEdgesState(modelid ? [] : initialEdges);

    useEffect(() => {
    console.log('[DEBUG EditorV2 nodes state]', nodes.length, nodes.map(n => n.id));
}, [nodes]);

    // Deduplicate an edge array, keeping the FIRST occurrence of each ID.
    const deduplicateEdges = useCallback((edgeArray: Edge[]): Edge[] => {
        const seen = new Set<string>();
        const result: Edge[] = [];
        for (const edge of edgeArray) {
            if (seen.has(edge.id)) {
                console.warn('[DEDUP] Caught duplicate edge:', edge.id,
                    'stack:', new Error().stack?.split('\n').slice(1, 4).join('\n'));
                continue;
            }
            seen.add(edge.id);
            result.push(edge);
        }
        return result.length === edgeArray.length ? edgeArray : result;
    }, []);

    // Dedup wrapper: shadows the raw setter so every imperative call automatically deduplicates.
    const setEdges = useCallback(
        (updater: Edge[] | ((eds: Edge[]) => Edge[])) => {
            setEdgesRaw((currentEdges) => {
                const next = typeof updater === 'function' ? updater(currentEdges) : updater;
                return deduplicateEdges(next);
            });
        },
        [setEdgesRaw, deduplicateEdges],
    );

    // Dedup-aware onEdgesChange: applies React Flow's internal edge changes,
    // then deduplicates the result before committing to state.
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            setEdgesRaw((currentEdges) => {
                const updated = applyEdgeChanges(changes, currentEdges);
                return deduplicateEdges(updated);
            });
        },
        [setEdgesRaw, deduplicateEdges],
    );

    // Phase 3: bidirectional incremental sync with JjOM/Redux
    // fitViewRef / applyDistributionRef bridge hook ordering: useJjomSync's
    // onInit callback fires after init, but fitView and applyDistribution
    // are defined later.
    const fitViewRef = useRef<(() => void) | null>(null);
    const applyDistributionRef = useRef<((eds: Edge[]) => Edge[]) | null>(null);
    const setEdgesRef = useRef(setEdges);
    setEdgesRef.current = setEdges;
    const autoLayoutRef = useRef<(() => Promise<void>) | null>(null);
    const { isJjomMode, graphId, justCreatedGraphRef } = useJjomSync(modelid, setNodes, setEdges, () => {
    console.log('[DEBUG EditorV2] modelid:', modelid, 'isJjomMode:', isJjomMode, 'graphId:', graphId);

        // Delay slightly so RF has measured nodes before fitting
        setTimeout(async () => {
            // If the graph was just auto-created, apply ELK layout first
            if (justCreatedGraphRef.current) {
                justCreatedGraphRef.current = false;
                if (autoLayoutRef.current) {
                    await autoLayoutRef.current();
                    return; // autoLayout already does fitView + distribution
                }
            }
            fitViewRef.current?.();
            // Apply port distribution to edges loaded from JjOM.
            // Initial sync assigns all edges handle index 0; distribution
            // assigns correct indices based on spatial ordering.
            if (applyDistributionRef.current) {
                setEdges(eds => applyDistributionRef.current!(eds));
            }
        }, 50);
    });

    // M1/M2 mode detection — resolves metamodel classes, rootable classes, hierarchy
    const modeInfo = useEditorMode(modelid);
    const isModelMode = modeInfo.mode === 'model';

    // Orphan feature co-evolution: soft-delete + restore by attribute name
    useOrphanFeatures(modelid, nodes);

    // ── Live reference name sync ────────────────────────────────────
    // When a reference is renamed in the metamodel, update edge labels automatically.
    // Collect reference IDs from current edges, subscribe to their Redux names,
    // and patch edges when names change.
    const edgeRefIds = useMemo(() => {
        const ids = new Set<string>();
        for (const e of edges) {
            const d = e.data as any;
            // M2 reference edges
            if (d?.reference?.id) ids.add(d.reference.id);
            if (d?.jjomRefId) ids.add(d.jjomRefId);
            // M1 composition/instanceRef edges
            if (d?.referenceId) ids.add(d.referenceId);
        }
        return ids;
    }, [edges]);

    const liveRefNameSig = useSelector((state: any) => {
        const lookup = state.idlookup;
        if (!lookup || edgeRefIds.size === 0) return '';
        const parts: string[] = [];
        for (const refId of edgeRefIds) {
            const raw = lookup[refId];
            if (raw?.name != null) parts.push(`${refId}:${raw.name}`);
        }
        return parts.join('|');
    });

    const liveRefNameMap = useMemo(() => {
        const map = new Map<string, string>();
        if (!liveRefNameSig) return map;
        for (const entry of liveRefNameSig.split('|')) {
            const sep = entry.indexOf(':');
            if (sep > 0) map.set(entry.slice(0, sep), entry.slice(sep + 1));
        }
        return map;
    }, [liveRefNameSig]);

    useEffect(() => {
        if (liveRefNameMap.size === 0) return;
        setEdges(currentEdges => {
            let changed = false;
            const result = currentEdges.map(e => {
                const d = e.data as any;
                // Determine the reference ID for this edge
                const refId = d?.reference?.id || d?.jjomRefId || d?.referenceId;
                if (!refId) return e;
                const liveName = liveRefNameMap.get(refId);
                if (liveName == null) return e;

                // Check if any name field is stale
                const labelStale = e.label != null && String(e.label) !== liveName;
                const m2NameStale = d?.reference?.name != null && d.reference.name !== liveName;
                const m1NameStale = d?.referenceName != null && d.referenceName !== liveName;

                if (!labelStale && !m2NameStale && !m1NameStale) return e;

                changed = true;
                const newData = { ...d };
                if (m2NameStale) {
                    newData.reference = { ...d.reference, name: liveName };
                }
                if (m1NameStale) {
                    newData.referenceName = liveName;
                }
                return { ...e, label: liveName, data: newData };
            });
            return changed ? result : currentEdges;
        });
    }, [liveRefNameMap, setEdges]);

    // Conformance guard — upper-bound checks for M1 link creation
    const { guardLink } = useConformanceGuard(modelid ?? '');

    // Stable ref for modeInfo — used in event handlers to avoid unstable deps
    // (modeInfo is a new object each render; putting it in useCallback deps
    //  causes ReactFlow's StoreUpdater to loop infinitely)
    const modeInfoRef = useRef(modeInfo);
    modeInfoRef.current = modeInfo;

    // Selection sync: standalone hook — updates Properties panel via _lastSelected
    const jjomSelection = useJjomSelection(modelid, isJjomMode);

    const { screenToFlowPosition, getNodes, getEdges, zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
    const storeApi = useStoreApi();
    fitViewRef.current = () => fitView({ padding: 0.2, maxZoom: 1 });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [gridVisible, setGridVisible] = useState(() => {
        try { return localStorage.getItem('jjodel.showGrid') !== 'false'; } catch { return true; }
    });
    const handleToggleGrid = useCallback(() => {
        setGridVisible(prev => {
            const next = !prev;
            try { localStorage.setItem('jjodel.showGrid', String(next)); } catch {}
            return next;
        });
    }, []);

    // ── Singleton instance toggle ──────────────────────────────────────
    // Listens for the View menu toggle and shows/hides singleton instance
    // nodes on the M1 canvas. DVertices persist in Redux (positions preserved);
    // hiding only suppresses RF rendering via syncState.
    useEffect(() => {
        if (!isJjomMode || !graphId || !isModelMode) return;

        const handleToggleSingletons = (e: Event) => {
            const { show, modelId: eventModelId } = (e as CustomEvent).detail;
            if (eventModelId !== modelid) return;

            const state = store.getState() as any;
            const lookup = state.idlookup ?? {};
            const mi = modeInfoRef.current;

            // Find singleton classes from the metamodel
            const singletonClassIds = new Set<string>();
            for (const cls of mi.allClasses) {
                const dClass = lookup[cls.id] as any;
                if (dClass?.isSingleton) singletonClassIds.add(cls.id);
            }
            if (singletonClassIds.size === 0) return;

            if (show) {
                // ── SHOW: reveal or create singleton instances ──
                // 1. Find existing DVertices for singleton instances in this graph
                const graph = lookup[graphId] as any;
                const subElements = graph?.subElements ?? [];
                const existingVertexIds = new Map<string, string>(); // metaclassId → vertexId

                for (const seId of subElements) {
                    const se = lookup[seId] as any;
                    if (!se?.className?.includes('Vertex')) continue;
                    const obj = lookup[se.model] as any;
                    if (!obj) continue;
                    const instOf = typeof obj.instanceof === 'string' ? obj.instanceof
                        : Array.isArray(obj.instanceof) ? obj.instanceof[0] : null;
                    if (instOf && singletonClassIds.has(instOf)) {
                        existingVertexIds.set(instOf, seId);
                    }
                }

                // 2. Clear suppression for existing vertices and add RF nodes
                for (const [metaclassId, vertexId] of existingVertexIds) {
                    unsuppressSingleton(vertexId);
                    // Transform and add RF node if not already present
                    try {
                        const lProxy: any = LPointerTargetable.fromPointer(vertexId);
                        if (lProxy) {
                            const rfNode = jjomVertexToRFNode(lProxy);
                            if (rfNode) {
                                setNodes(nds => {
                                    if (nds.some(n => n.id === rfNode.id)) return nds;
                                    return [...nds, rfNode];
                                });
                            }
                        }
                    } catch { /* skip */ }
                }

                // 3. For singleton classes without a DVertex, create DObject + DVertex
                const existingNodes = getNodes();
                let maxY = 0;
                for (const n of existingNodes) {
                    const bottom = n.position.y + (n.measured?.height ?? 80);
                    if (bottom > maxY) maxY = bottom;
                }
                let nextX = 40;
                const startY = maxY + 60;

                for (const metaclassId of singletonClassIds) {
                    if (existingVertexIds.has(metaclassId)) continue;
                    const dClass = lookup[metaclassId] as any;
                    const className = dClass?.name ?? 'Singleton';
                    const objName = `${className.charAt(0).toLowerCase()}${className.slice(1)}_s`;

                    const vertexId = syncCreateObject(graphId, metaclassId, nextX, startY, objName);
                    if (vertexId) {
                        markDropCreated(vertexId);
                        const newNode: Node = {
                            id: vertexId,
                            type: 'objectNode',
                            position: { x: nextX, y: startY },
                            data: {
                                label: objName,
                                instanceOfClassName: className,
                                instanceOfClassId: metaclassId,
                                features: [],
                            } as ObjectNodeData,
                        };
                        setNodes(nds => [...nds, newNode]);
                        nextX += 220;
                    }
                }
                console.log(`[singleton] shown ${singletonClassIds.size} singleton class(es) for model ${modelid}`);
            } else {
                // ── HIDE: suppress singleton instance vertices ──
                const graph = lookup[graphId] as any;
                const subElements = graph?.subElements ?? [];
                const vertexIdsToHide: string[] = [];

                for (const seId of subElements) {
                    const se = lookup[seId] as any;
                    if (!se?.className?.includes('Vertex')) continue;
                    const obj = lookup[se.model] as any;
                    if (!obj) continue;
                    const instOf = typeof obj.instanceof === 'string' ? obj.instanceof
                        : Array.isArray(obj.instanceof) ? obj.instanceof[0] : null;
                    if (instOf && singletonClassIds.has(instOf)) {
                        vertexIdsToHide.push(seId);
                    }
                }

                for (const vid of vertexIdsToHide) {
                    suppressSingleton(vid);
                }
                setNodes(nds => nds.filter(n => !vertexIdsToHide.includes(n.id)));
                console.log(`[singleton] hidden ${vertexIdsToHide.length} singleton node(s) for model ${modelid}`);
            }
        };

        // Read initial state from localStorage
        const initialShow = localStorage.getItem(`jjodel.showSingletons.${modelid}`) === 'true';
        if (!initialShow) {
            // Suppress any existing singleton vertices on mount when toggle is off
            const state = store.getState() as any;
            const lookup = state.idlookup ?? {};
            const mi = modeInfoRef.current;
            const graph = lookup[graphId] as any;
            const subElements = graph?.subElements ?? [];

            for (const seId of subElements) {
                const se = lookup[seId] as any;
                if (!se?.className?.includes('Vertex')) continue;
                const obj = lookup[se.model] as any;
                if (!obj) continue;
                const instOf = typeof obj.instanceof === 'string' ? obj.instanceof
                    : Array.isArray(obj.instanceof) ? obj.instanceof[0] : null;
                if (!instOf) continue;
                const dClass = lookup[instOf] as any;
                if (dClass?.isSingleton) {
                    suppressSingleton(seId);
                }
            }
        }

        window.addEventListener('jjodel:toggle-singletons', handleToggleSingletons);
        return () => {
            window.removeEventListener('jjodel:toggle-singletons', handleToggleSingletons);
            clearSuppressedSingletons();
        };
    }, [isJjomMode, graphId, isModelMode, modelid, setNodes, getNodes]);

    const clipboard = useRef<ClipboardState>({ nodes: [], edges: [] });

    // Temporal guard: edges created in the last 300ms are protected from
    // hysteresis recalc which fires with stale handleBounds before React Flow
    // has re-measured the new handles.
    const recentlyCreatedEdgesRef = useRef<Map<string, number>>(new Map());

    // Reentrance guard: prevents handleNodesChange from cascading edge recalc
    // when re-entered from updateNodeInternals → dimension changes.
    const isProcessingNodesChangeRef = useRef(false);

    // Tracks last-known measured dimensions per node (by ID).
    // Used to filter out redundant auto-measurement dimension changes that
    // would otherwise cause: React setNodes → StoreUpdater → RF measure →
    // onNodesChange({type:'dimensions'}) → setNodes → infinite loop.
    // First measurement passes through; only duplicates are skipped.
    const lastMeasuredDimsRef = useRef<Map<string, { w: number; h: number }>>(new Map());

    // Edge type popup: pending connection waiting for user to pick edge type
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
    const pendingConnectionRef = useRef<Connection | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // M1 reference popup: pending connection waiting for user to pick reference
    const [pendingM1Connection, setPendingM1Connection] = useState<{
        connection: Connection;
        position: { x: number; y: number };
        compatibleRefs: CompatibleReference[];
    } | null>(null);
    const handleM1ReferenceSelectedRef = useRef<(ref: MetaclassReference, conn?: Connection) => void>(() => {});

    // Theme state — follows global ThemeService (synced with Navbar/Settings)
    const [theme] = useTheme();

    // Notation mode state with localStorage persistence
    const VALID_NOTATIONS: NotationMode[] = ['uml', 'simplified', 'compact', 'wireframe', 'er'];
    const [notation, setNotation] = useState<NotationMode>(() => {
        const saved = localStorage.getItem('editor-v2-notation');
        return VALID_NOTATIONS.includes(saved as NotationMode) ? (saved as NotationMode) : 'uml';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-notation', notation);
    }, [notation]);

    // Color scheme state with localStorage persistence
    const VALID_SCHEMES: ColorScheme[] = ['default', 'monochrome', 'sapphire', 'amethyst', 'jade', 'terracotta', 'crimson', 'high-contrast', 'print'];
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        const saved = localStorage.getItem('editor-v2-color-scheme');
        return VALID_SCHEMES.includes(saved as ColorScheme) ? (saved as ColorScheme) : 'default';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-color-scheme', colorScheme);
    }, [colorScheme]);

    // Listen for jjodel:selectNode events from the TreeView to select nodes on canvas
    useEffect(() => {
        const handleSelectNode = (event: Event) => {
            const { nodeId, modelId } = (event as CustomEvent).detail || {};
            if (!nodeId || modelId !== modelid) return;
            setNodes(nds => nds.map(n => ({ ...n, selected: n.id === nodeId })));
            setEdges(eds => eds.map(e => ({ ...e, selected: false })));
            // Center the view on the selected node
            const targetNode = getNodes().find(n => n.id === nodeId);
            if (targetNode) {
                const x = (targetNode.position?.x ?? 0) + ((targetNode.measured?.width ?? 150) / 2);
                const y = (targetNode.position?.y ?? 0) + ((targetNode.measured?.height ?? 50) / 2);
                const vp = getViewport();
                setViewport({ x: -x * vp.zoom + window.innerWidth / 3, y: -y * vp.zoom + window.innerHeight / 3, zoom: vp.zoom }, { duration: 300 });
            }
        };
        window.addEventListener('jjodel:selectNode', handleSelectNode);
        return () => window.removeEventListener('jjodel:selectNode', handleSelectNode);
    }, [modelid, setNodes, setEdges, getNodes, getViewport, setViewport]);

    // Polymetric view modal (triggered via Tools menu CustomEvent)
    const [polymetricOpen, setPolymetricOpen] = useState(false);

    useEffect(() => {
        const handlePolymetric = () => {
            if (modelid) setPolymetricOpen(true);
        };
        window.addEventListener('jjodel:open-polymetric', handlePolymetric);
        return () => window.removeEventListener('jjodel:open-polymetric', handlePolymetric);
    }, [modelid]);

    // History for undo/redo
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(getNodes, getEdges);
    // Force re-render to update canUndo/canRedo
    const [, forceUpdate] = useState({});

    // Alignment tools
    const {
        alignLeft,
        alignCenterVertical,
        alignRight,
        alignTop,
        alignCenterHorizontal,
        alignBottom,
        distributeHorizontally,
        distributeVertically,
    } = useAlignment();

    // Auto-anchor for optimal edge routing
    const { getOptimalAnchors } = useAutoAnchor();


    // Helper: build node positions map for spatial port ordering
    const buildNodePositions = useCallback((nodeList: Node[]) => {
        const map = new Map<string, { centerX: number; centerY: number }>();
        for (const n of nodeList) {
            const w = ((n.measured?.width ?? (n as any).width ?? 180) as number);
            const h = ((n.measured?.height ?? (n as any).height ?? 80) as number);
            map.set(n.id, {
                centerX: n.position.x + w / 2,
                centerY: n.position.y + h / 2,
            });
        }
        return map;
    }, []);

    // Apply port distribution — assigns indexed handle IDs to edges.
    // All handles are pre-allocated in the DOM (pool pattern), so we can
    // assign the correct indexed handles immediately without waiting.
    const applyDistribution = useCallback((edgeList: Edge[]): Edge[] => {
        const currentNodes = getNodes();
        const nodeIds = currentNodes.map(n => n.id);
        const positions = buildNodePositions(currentNodes);

        const { edgeHandles } = computePortDistribution(edgeList, nodeIds, positions);

        return edgeList.map(edge => {
            const distributed = edgeHandles.get(edge.id);
            if (distributed &&
                (edge.sourceHandle !== distributed.sourceHandle ||
                 edge.targetHandle !== distributed.targetHandle)) {
                return {
                    ...edge,
                    sourceHandle: distributed.sourceHandle,
                    targetHandle: distributed.targetHandle,
                };
            }
            return edge;
        });
    }, [getNodes, buildNodePositions]);
    applyDistributionRef.current = applyDistribution;

    // Co-evolution: class removal with hierarchy collapse + orphan instances
    const { handleClassRemoval } = useClassRemoval(
        modelid, isJjomMode, setNodes, setEdges,
        getNodes, getEdges, takeSnapshot, applyDistribution,
    );

    // ── Reactive distribution guard ─────────────────────────────────────
    // Ensures edges always have correctly distributed handle indices.
    // Safety net for code paths that set edges without applyDistribution
    // (JjOM initial/incremental sync, undo/redo, paste, etc.).
    // Uses useLayoutEffect to apply distribution BEFORE browser paint,
    // eliminating flicker where edges briefly appear at center (index 0).
    // After distribution, explicitly calls updateNodeInternals so React Flow
    // re-measures handle DOM positions and redraws edges at correct anchors.
    //
    // IMPORTANT: uses refs for setEdges and applyDistribution to keep deps
    // minimal ([edges, storeApi]) and avoid re-entrance loops.  Pending
    // rAF/setTimeout handles are tracked and cancelled on re-entry to
    // prevent cascading updateNodeInternals calls that accumulate over time.
    const lastDistributionKeyRef = useRef<string>('');
    const pendingMeasureCleanupRef = useRef<(() => void) | null>(null);

    useLayoutEffect(() => {
        if (edges.length === 0) {
            lastDistributionKeyRef.current = '';
            return;
        }

        // Fingerprint from edge IDs + handles — changes on add/remove/handle reassignment
        const topologyKey = edges
            .map(e => `${e.id}|${e.sourceHandle ?? ''}|${e.targetHandle ?? ''}`)
            .sort()
            .join('||');

        if (topologyKey === lastDistributionKeyRef.current) return;

        // Cancel any pending measurement from a previous distribution cycle
        // to prevent cascading updateNodeInternals calls accumulating over time.
        pendingMeasureCleanupRef.current?.();
        pendingMeasureCleanupRef.current = null;

        const distribute = applyDistributionRef.current;
        if (!distribute) return;

        const distributed = distribute(edges);

        // Check if distribution would actually change any handles
        const affectedNodeIds = new Set<string>();
        let needsUpdate = false;
        for (let i = 0; i < edges.length; i++) {
            if (edges[i].sourceHandle !== distributed[i].sourceHandle) {
                needsUpdate = true;
                affectedNodeIds.add(edges[i].source);
            }
            if (edges[i].targetHandle !== distributed[i].targetHandle) {
                needsUpdate = true;
                affectedNodeIds.add(edges[i].target);
            }
        }

        if (needsUpdate) {
            setEdgesRef.current(distributed);
            lastDistributionKeyRef.current = distributed
                .map(e => `${e.id}|${e.sourceHandle ?? ''}|${e.targetHandle ?? ''}`)
                .sort()
                .join('||');

            // Force React Flow to re-measure handle DOM positions.
            //
            // Timing chain: setEdges (React state) → StoreUpdater useEffect
            // syncs to RF store → DynamicHandles re-renders handles at new
            // CSS positions → DOM committed → browser paints → measure.
            //
            // Double-rAF ensures measurement happens AFTER the browser has
            // painted the new CSS positions. Without this, getBoundingClientRect
            // returns stale values (handles at 50%) because CSS percentage
            // positions haven't been resolved yet.
            const allNodeIds = new Set<string>();
            for (const edge of distributed) {
                allNodeIds.add(edge.source);
                allNodeIds.add(edge.target);
            }
            const nodeIdList = Array.from(allNodeIds);

            // Track whether this measurement cycle has been superseded
            let cancelled = false;

            const measureAndUpdate = () => {
                if (cancelled) return;
                const state = storeApi.getState();
                const domNode = state.domNode;
                if (!domNode) return;
                const updates = new Map();
                for (const nodeId of nodeIdList) {
                    const nodeElement = domNode.querySelector(`.react-flow__node[data-id="${nodeId}"]`);
                    if (nodeElement) {
                        updates.set(nodeId, { id: nodeId, nodeElement, force: true });
                    }
                }
                if (updates.size > 0) {
                    state.updateNodeInternals(updates);
                }
            };

            // Double-rAF: first rAF fires before next paint, second fires
            // after that paint — guaranteeing CSS percentages are resolved.
            const rafId1 = requestAnimationFrame(() => {
                if (cancelled) return;
                requestAnimationFrame(measureAndUpdate);
            });
            // Safety net: in case the render chain needs extra cycles
            // (e.g. StoreUpdater → zustand → DynamicHandles → paint)
            const timerId = setTimeout(() => {
                if (cancelled) return;
                requestAnimationFrame(() => {
                    if (cancelled) return;
                    requestAnimationFrame(measureAndUpdate);
                });
            }, 100);

            pendingMeasureCleanupRef.current = () => {
                cancelled = true;
                cancelAnimationFrame(rafId1);
                clearTimeout(timerId);
            };
        } else {
            lastDistributionKeyRef.current = topologyKey;
        }

        return () => {
            // Cleanup on unmount or before next effect execution
            pendingMeasureCleanupRef.current?.();
            pendingMeasureCleanupRef.current = null;
        };
    }, [edges, storeApi]);

    // Get selected nodes and edges for properties panel
    const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);

    // Handle new connections: save the valid connection, then show edge type popup on drop
    const onConnect = useCallback(
        (connection: Connection) => {
            // Store the valid connection; onConnectEnd will show the popup
            pendingConnectionRef.current = connection;
        },
        []
    );

    const onConnectEnd = useCallback(
        (event: MouseEvent | TouchEvent) => {
            const connection = pendingConnectionRef.current;
            pendingConnectionRef.current = null;

            if (!connection || !connection.source || !connection.target) {
                // Invalid connection (dropped on empty canvas) — ignore
                return;
            }

            const clientX = 'touches' in event ? event.changedTouches[0].clientX : event.clientX;
            const clientY = 'touches' in event ? event.changedTouches[0].clientY : event.clientY;

            // ── M1 mode: ObjectNode → ObjectNode connection ──
            const mi = modeInfoRef.current;
            if (mi.mode === 'model') {
                const currentNodes = getNodes();
                const sourceNode = currentNodes.find(n => n.id === connection.source);
                const targetNode = currentNodes.find(n => n.id === connection.target);

                if (sourceNode?.type === 'objectNode' && targetNode?.type === 'objectNode') {
                    const sourceData = sourceNode.data as ObjectNodeData;
                    const targetData = targetNode.data as ObjectNodeData;
                    const sourceMetaclass = mi.allClasses.find(c => c.id === sourceData.instanceOfClassId);

                    if (sourceMetaclass) {
                        const compatibleRefs = getCompatibleReferences(
                            sourceMetaclass,
                            targetData.instanceOfClassId,
                            mi.allClasses,
                        );

                        if (compatibleRefs.length === 0) return; // no compatible refs — ignore

                        if (compatibleRefs.length === 1) {
                            // Auto-select: skip popup, create edge directly
                            handleM1ReferenceSelectedRef.current(compatibleRefs[0].ref, connection);
                            return;
                        }

                        // Multiple options: show picker popup
                        setPendingM1Connection({
                            connection,
                            position: { x: clientX, y: clientY },
                            compatibleRefs,
                        });
                    }
                    return;
                }
            }

            // ── M2 flow (existing behavior) ──
            setPendingConnection({
                connection,
                position: { x: clientX, y: clientY },
            });
        },
        [getNodes]
    );

    // Called when user picks an edge type from the popup
    const handleEdgeTypeSelected = useCallback(
        (choice: EdgeTypeChoice) => {
            if (!pendingConnection) return;

            const { connection } = pendingConnection;
            takeSnapshot();

            const isInheritance = choice === 'inheritance';
            const edgeType = isInheritance ? 'inheritance' : 'reference';

            // Normalize inheritance direction: UML convention requires
            // source = child, target = parent (△ appears at target).
            // If user dragged from parent to child (source is ABOVE target), swap.
            let edgeSource = connection.source!;
            let edgeTarget = connection.target!;

            if (isInheritance) {
                const sourceNode = getNodes().find(n => n.id === edgeSource);
                const targetNode = getNodes().find(n => n.id === edgeTarget);
                if (sourceNode && targetNode) {
                    const sourceCenter = sourceNode.position.y +
                        ((sourceNode.measured?.height ?? 80) / 2);
                    const targetCenter = targetNode.position.y +
                        ((targetNode.measured?.height ?? 80) / 2);
                    // Source above target means user dragged parent→child; swap.
                    if (sourceCenter < targetCenter) {
                        [edgeSource, edgeTarget] = [edgeTarget, edgeSource];
                    }
                }
            }

            const currentEdges = getEdges();

            // For inheritance, compute sides directly here using getNodes()
            // (always-current store) instead of getOptimalAnchors which uses
            // useNodes() (React state, potentially one render behind).
            // This eliminates stale-closure risk for the vertical constraint.
            let sourceSide: string;
            let targetSide: string;

            if (isInheritance) {
                // Inheritance always anchors child=top, parent=bottom
                sourceSide = 'top';
                targetSide = 'bottom';
            } else {
                const optimal = getOptimalAnchors(
                    edgeSource,
                    edgeTarget,
                    edgeType,
                    currentEdges,
                );
                sourceSide = optimal.sourceHandle;
                targetSide = optimal.targetHandle;
            }

            const sourceAnchor: AnchorConfig = { mode: 'pinned', side: sourceSide as AnchorConfig['side'] };
            const targetAnchor: AnchorConfig = { mode: 'pinned', side: targetSide as AnchorConfig['side'] };
            const sourceIndex = getNextFreeHandleIndex(edgeSource, sourceSide, 'source', currentEdges);
            const targetIndex = getNextFreeHandleIndex(edgeTarget, targetSide, 'target', currentEdges);

            // ── JjOM mode: create in JjOM FIRST, then use the real IDs ──
            // This avoids a race condition where the sync sees the DEdge
            // before markDropCreated is called, causing duplicates.
            let edgeId: string;

            let refLabel = choice === 'composition' ? 'newComposition'
                : choice === 'aggregation' ? 'newAggregation'
                : 'newAssociation';

            if (isJjomMode) {
                if (isInheritance) {
                    const dEdgeId = syncInheritanceEdge(edgeSource, edgeTarget);
                    if (!dEdgeId) {
                        console.warn('[EditorV2] Failed to create JjOM edge');
                        setPendingConnection(null);
                        return;
                    }
                    edgeId = dEdgeId;
                } else {
                    const result = syncReferenceEdge(edgeSource, edgeTarget, refLabel, choice as any);
                    if (!result) {
                        console.warn('[EditorV2] Failed to create JjOM edge');
                        setPendingConnection(null);
                        return;
                    }
                    edgeId = result.edgeId;
                    refLabel = result.refName; // use unique name from JjOM
                }
                // Mark as drop-created so the incremental sync (useJjomSync)
                // adds the DVoidEdge to its cache without creating a duplicate
                // RF edge. Without this, the sync detects the new DVoidEdge in
                // subElementIds and appends a second RF edge to the canvas.
                markDropCreated(edgeId);
            } else {
                edgeId = isInheritance ? `inh_${Date.now()}` : `ref_${Date.now()}`;
            }

            const newEdge: Edge = {
                id: edgeId,
                source: edgeSource,
                target: edgeTarget,
                sourceHandle: `${sourceSide}-${sourceIndex}`,
                targetHandle: `${targetSide}-${targetIndex}`,
                type: edgeType,
                ...(edgeType === 'reference' ? {
                    label: refLabel,
                    data: {
                        reference: {
                            id: edgeId,
                            name: refLabel,
                            kind: choice as ReferenceKind,
                            targetClassId: edgeTarget,
                            lowerBound: 0,
                            upperBound: -1,
                            containment: choice === 'composition',
                        },
                        sourceAnchor,
                        targetAnchor,
                        autoEdit: true,
                    } as ReferenceEdgeData,
                } : {
                    data: {
                        sourceAnchor,
                        targetAnchor,
                    } as InheritanceEdgeData,
                }),
            };

            setEdges((eds) => {
                return applyDistribution([...eds, newEdge]);
            });

            // Temporal guard: protect the new edge from hysteresis recalc
            // which fires before React Flow has re-measured the new handles.
            recentlyCreatedEdgesRef.current.set(edgeId, Date.now());
            setTimeout(() => {
                recentlyCreatedEdgesRef.current.delete(edgeId);
            }, 500);

            // Force React Flow to re-measure handle positions for connected nodes.
            // DynamicHandles will re-render with the new active handle, but RF's
            // internal handleBounds are stale until updateNodeInternals runs.
            // Double-rAF ensures CSS positions are painted before measuring.
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const state = storeApi.getState();
                    const domNode = state.domNode;
                    if (!domNode) return;
                    const updates = new Map();
                    for (const nid of [edgeSource, edgeTarget]) {
                        const el = domNode.querySelector(`.react-flow__node[data-id="${nid}"]`);
                        if (el) updates.set(nid, { id: nid, nodeElement: el, force: true });
                    }
                    if (updates.size > 0) state.updateNodeInternals(updates);
                });
            });

            setPendingConnection(null);
        },
        [pendingConnection, setEdges, getEdges, getNodes, takeSnapshot, getOptimalAnchors, applyDistribution, isJjomMode, storeApi]
    );

    const handleEdgeTypeCancelled = useCallback(() => {
        setPendingConnection(null);
    }, []);

    // ── M1: create reference edge between two ObjectNodes ──
    const handleM1ReferenceSelected = useCallback(
        (metaRef: MetaclassReference, connectionOverride?: Connection) => {
            const conn = connectionOverride ?? pendingM1Connection?.connection;
            if (!conn || !conn.source || !conn.target) {
                setPendingM1Connection(null);
                return;
            }

            // ── Upper-bound guard ──
            // conn.source is a DVertex ID; guardLink needs the DObject ID
            const dVertex = LPointerTargetable.fromPointer(conn.source!) as any;
            const sourceObjectId: string = dVertex?.model?.id ?? dVertex?.__raw?.model ?? conn.source!;
            const guardResult = guardLink(sourceObjectId, metaRef.name);
            if (!guardResult.allowed) {
                console.warn('[EditorV2] Upper bound violated:', guardResult.message);
                setPendingM1Connection(null);
                return;
            }

            takeSnapshot();

            const edgeSource = conn.source;
            const edgeTarget = conn.target;
            const currentEdges = getEdges();

            // Compute optimal anchor sides (use 'reference' for routing — same as M2)
            const rfType = metaRef.containment ? 'composition' : 'instanceRef';
            const optimal = getOptimalAnchors(edgeSource, edgeTarget, 'reference', currentEdges);
            const sourceSide = optimal.sourceHandle;
            const targetSide = optimal.targetHandle;
            const sourceAnchor: AnchorConfig = { mode: 'pinned', side: sourceSide as AnchorConfig['side'] };
            const targetAnchor: AnchorConfig = { mode: 'pinned', side: targetSide as AnchorConfig['side'] };
            const sourceIndex = getNextFreeHandleIndex(edgeSource, sourceSide, 'source', currentEdges);
            const targetIndex = getNextFreeHandleIndex(edgeTarget, targetSide, 'target', currentEdges);

            // Create in JjOM
            const edgeId = metaRef.containment
                ? syncCreateCompositionLink(edgeSource, edgeTarget, metaRef.name)
                : syncCreateReferenceLink(edgeSource, edgeTarget, metaRef.name);

            if (!edgeId) {
                console.warn('[EditorV2] Failed to create M1 reference edge');
                setPendingM1Connection(null);
                return;
            }

            markDropCreated(edgeId);

            const newEdge: Edge = {
                id: edgeId,
                source: edgeSource,
                target: edgeTarget,
                sourceHandle: `${sourceSide}-${sourceIndex}`,
                targetHandle: `${targetSide}-${targetIndex}`,
                type: rfType,
                label: metaRef.name,
                data: {
                    referenceName: metaRef.name,
                    referenceId: metaRef.id,
                    sourceAnchor,
                    targetAnchor,
                } as CompositionEdgeData | InstanceReferenceEdgeData,
            };

            setEdges(eds => applyDistribution([...eds, newEdge]));

            // Temporal guard (same as M2 flow)
            recentlyCreatedEdgesRef.current.set(edgeId, Date.now());
            setTimeout(() => recentlyCreatedEdgesRef.current.delete(edgeId), 500);

            // Force handle measurement (double-rAF pattern)
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    const state = storeApi.getState();
                    const domNode = state.domNode;
                    if (!domNode) return;
                    const updates = new Map();
                    for (const nid of [edgeSource, edgeTarget]) {
                        const el = domNode.querySelector(`.react-flow__node[data-id="${nid}"]`);
                        if (el) updates.set(nid, { id: nid, nodeElement: el, force: true });
                    }
                    if (updates.size > 0) state.updateNodeInternals(updates);
                });
            });

            setPendingM1Connection(null);
        },
        [pendingM1Connection, setEdges, getEdges, takeSnapshot, getOptimalAnchors, applyDistribution, storeApi, guardLink]
    );
    handleM1ReferenceSelectedRef.current = handleM1ReferenceSelected;

    // Handle edge reconnection (drag endpoint to a new target/source)
    const handleReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) => {
            setEdges((eds) => {
                const updated = reconnectEdge(oldEdge, newConnection, eds);
                return applyDistribution(updated);
            });
        },
        [setEdges, applyDistribution]
    );

    const handleReconnectStart = useCallback(() => {
        takeSnapshot();
    }, [takeSnapshot]);

    // Handle drop from palette
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const rawType = event.dataTransfer.getData('application/reactflow');
            if (!rawType) return;

            // Members must be dropped on nodes, not canvas
            if (['attribute', 'operation', 'literal'].includes(rawType)) return;

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            // Center node under cursor instead of placing top-left at cursor
            const defaultNodeWidth = rawType === 'packageNode' ? 200 : 140;
            const defaultNodeHeight = rawType === 'packageNode' ? 120 : 40;
            position.x -= defaultNodeWidth / 2;
            position.y -= defaultNodeHeight / 2;

            // ── JjOM mode: create real model+vertex in JjOM ──────────────
            // We also create the RF node directly for instant feedback (no flicker).
            // markCanvasUpdated prevents useJjomSync from duplicating the node.
            if (isJjomMode && graphId) {
                let vertexId: string | false = false;
                let nodeType: string = 'classNode';
                let defaultLabel = 'NewClass';
                let nodeData: any = {};

                // M1: objectNode from palette
                if (rawType === 'objectNode') {
                    const metaclassId = event.dataTransfer.getData('metaclassId');
                    if (!metaclassId) return;
                    const mi = modeInfoRef.current;
                    const metaclass = mi.allClasses.find(c => c.id === metaclassId);
                    if (!metaclass) return;
                    const className = metaclass.name;

                    // Only rootable classes can be placed on the canvas
                    const isRootable = mi.rootableClasses.some(c => c.id === metaclassId);
                    if (!isRootable) return; // non-rootable → use context menu instead

                    const objName = `${className.charAt(0).toLowerCase()}${className.slice(1)}_${Date.now().toString(36).slice(-3)}`;
                    vertexId = syncCreateObject(graphId, metaclassId, position.x, position.y, objName);
                    nodeType = 'objectNode';
                    defaultLabel = objName;
                    nodeData = {
                        label: objName,
                        instanceOfClassName: className,
                        instanceOfClassId: metaclassId,
                        features: [],
                        autoEdit: true,
                    } as ObjectNodeData;
                } else {
                    // M2: standard metamodel elements
                    switch (rawType) {
                        case 'classNode':
                            defaultLabel = nextUniqueName(graphId, 'NewClass');
                            vertexId = syncCreateClass(graphId, position.x, position.y, false, defaultLabel);
                            nodeType = 'classNode';
                            nodeData = { label: defaultLabel, isAbstract: false, isSingleton: false, attributes: [], autoEdit: true };
                            break;
                        case 'classNode:abstract':
                            defaultLabel = nextUniqueName(graphId, 'NewAbstractClass');
                            vertexId = syncCreateClass(graphId, position.x, position.y, true, defaultLabel);
                            nodeType = 'classNode';
                            nodeData = { label: defaultLabel, isAbstract: true, isSingleton: false, attributes: [], autoEdit: true };
                            break;
                        case 'enumNode':
                            defaultLabel = nextUniqueName(graphId, 'NewEnum');
                            vertexId = syncCreateEnum(graphId, position.x, position.y, defaultLabel);
                            nodeType = 'enumNode';
                            nodeData = { label: defaultLabel, literals: [], autoEdit: true };
                            break;
                        case 'packageNode':
                            defaultLabel = nextUniqueName(graphId, 'NewPackage');
                            vertexId = syncCreatePackage(graphId, position.x, position.y, defaultLabel);
                            nodeType = 'packageNode';
                            nodeData = { label: defaultLabel, autoEdit: true };
                            break;
                        default:
                            return;
                    }
                }

                // Create RF node instantly at drop position
                if (vertexId) {
                    markDropCreated(vertexId);
                    const newNode: Node = {
                        id: vertexId,
                        type: nodeType,
                        position,
                        ...(nodeType === 'packageNode' ? { style: { zIndex: -1 } } : {}),
                        data: nodeData,
                    };
                    setNodes((nds) => [...nds, newNode]);
                }
                return;
            }

            // ── Standalone mode: create RF-only nodes ────────────────────
            takeSnapshot();

            let newNode: Node;

            switch (rawType) {
                case 'classNode':
                    newNode = {
                        id: `class_${Date.now()}`,
                        type: 'classNode',
                        position,
                        data: {
                            label: 'NewClass',
                            isAbstract: false,
                            attributes: [],
                            autoEdit: true,
                        } as ClassNodeData,
                    };
                    break;

                case 'classNode:abstract':
                    newNode = {
                        id: `class_${Date.now()}`,
                        type: 'classNode',
                        position,
                        data: {
                            label: 'NewAbstractClass',
                            isAbstract: true,
                            attributes: [],
                            autoEdit: true,
                        } as ClassNodeData,
                    };
                    break;

                case 'enumNode':
                    newNode = {
                        id: `enum_${Date.now()}`,
                        type: 'enumNode',
                        position,
                        data: {
                            label: 'NewEnum',
                            literals: [],
                            autoEdit: true,
                        } as EnumNodeData,
                    };
                    break;

                case 'packageNode':
                    newNode = {
                        id: `pkg_${Date.now()}`,
                        type: 'packageNode',
                        position,
                        style: { zIndex: -1 },
                        data: {
                            label: 'NewPackage',
                            autoEdit: true,
                        } as PackageNodeData,
                    };
                    break;

                default:
                    return;
            }

            setNodes((nds) => [...nds, newNode]);
        },
        [screenToFlowPosition, setNodes, takeSnapshot, isJjomMode, graphId, getNodes]
    );

    // Allow drop — with M1 cursor feedback for non-rootable classes
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        // M1: show not-allowed cursor for non-rootable classes (they need context menu)
        const mi = modeInfoRef.current;
        const draggedId = getDraggedMetaclassId();
        if (mi.mode === 'model' && draggedId) {
            const isRootable = mi.rootableClasses.some(c => c.id === draggedId);
            event.dataTransfer.dropEffect = isRootable ? 'move' : 'none';
            return;
        }

        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Delete selected nodes and edges
    const deleteSelected = useCallback(() => {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);

        if (selectedNodes.length === 0 && selectedEdges.length === 0) return;

        // In JjOM mode, route classNode deletions through co-evolution
        if (isJjomMode) {
            const classNodes = selectedNodes.filter(n => n.type === 'classNode');
            const otherNodes = selectedNodes.filter(n => n.type !== 'classNode');

            // Handle class removals with co-evolution (each takes its own snapshot)
            for (const cn of classNodes) {
                handleClassRemoval(cn.id);
            }

            // Handle non-class nodes and edges normally
            if (otherNodes.length > 0 || selectedEdges.length > 0) {
                takeSnapshot();
                const otherIds = new Set(otherNodes.map(n => n.id));

                if (otherNodes.length > 0) {
                    setNodes(nds => nds.filter(n => !otherIds.has(n.id)));
                }
                setEdges(eds => applyDistribution(
                    eds.filter(e =>
                        !selectedEdges.some(se => se.id === e.id) &&
                        !otherIds.has(e.source) &&
                        !otherIds.has(e.target)
                    )
                ));

                for (const edge of selectedEdges) {
                    syncDeleteEdge(edge.id, edge.type === 'inheritance');
                }
                for (const node of otherNodes) {
                    syncDeleteVertex(node.id);
                }
            }
        } else {
            // Non-JjOM mode: simple delete
            takeSnapshot();
            const nodeIds = new Set(selectedNodes.map(n => n.id));
            setNodes(nds => nds.filter(n => !nodeIds.has(n.id)));
            setEdges(eds => applyDistribution(
                eds.filter(e =>
                    !selectedEdges.some(se => se.id === e.id) &&
                    !nodeIds.has(e.source) &&
                    !nodeIds.has(e.target)
                )
            ));
        }
    }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot, applyDistribution, isJjomMode, handleClassRemoval]);

    // Delete specific node by ID
    const deleteNode = useCallback(
        (nodeId: string) => {
            // Route classNode deletions through co-evolution in JjOM mode
            if (isJjomMode) {
                const node = getNodes().find(n => n.id === nodeId);
                if (node?.type === 'classNode') {
                    handleClassRemoval(nodeId);
                    return;
                }
            }
            takeSnapshot();
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => applyDistribution(
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            ));
            // Phase 3: sync to JjOM
            if (isJjomMode) syncDeleteVertex(nodeId);
        },
        [setNodes, setEdges, getNodes, takeSnapshot, applyDistribution, isJjomMode, handleClassRemoval]
    );

    // Delete specific edge by ID
    const deleteEdge = useCallback(
        (edgeId: string) => {
            takeSnapshot();
            const edge = getEdges().find(e => e.id === edgeId);
            setEdges((eds) => applyDistribution(
                eds.filter((e) => e.id !== edgeId)
            ));
            // Phase 3: sync to JjOM
            if (isJjomMode && edge) syncDeleteEdge(edgeId, edge.type === 'inheritance');
        },
        [setEdges, getEdges, takeSnapshot, applyDistribution, isJjomMode]
    );

    // Duplicate a node
    const duplicateNode = useCallback(
        (nodeId: string) => {
            const node = getNodes().find((n) => n.id === nodeId);
            if (!node) return;

            takeSnapshot();
            const newNode: Node = {
                ...node,
                id: `${node.type}_${Date.now()}`,
                position: {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                },
                selected: false,
            };

            setNodes((nds) => [...nds, newNode]);
        },
        [getNodes, setNodes, takeSnapshot]
    );

    // Duplicate all selected nodes
    const duplicateSelected = useCallback(() => {
        const selected = getNodes().filter((n) => n.selected);
        if (selected.length === 0) return;
        for (const node of selected) {
            duplicateNode(node.id);
        }
    }, [getNodes, duplicateNode]);

    // Undo handler
    const handleUndo = useCallback(() => {
        const state = undo();
        if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            forceUpdate({});

            // Reconcile JjOM with restored RF state — re-create deleted
            // attributes, remove extra ones, sync renames.
            if (isJjomMode) {
                setTimeout(() => {
                    const idMap = reconcileJjomAfterUndoRedo(state.nodes);
                    if (idMap.size > 0) {
                        // Patch RF nodes with new JjOM attribute IDs
                        setNodes(nds => nds.map(n => {
                            if (n.type !== 'classNode') return n;
                            const data = n.data as ClassNodeData;
                            const attrs = data.attributes;
                            if (!attrs?.some(a => idMap.has(a.id))) return n;
                            return {
                                ...n,
                                data: {
                                    ...data,
                                    attributes: attrs.map(a =>
                                        idMap.has(a.id) ? { ...a, id: idMap.get(a.id)! } : a
                                    ),
                                },
                            };
                        }));
                    }
                }, 50);
            }
        }
    }, [undo, setNodes, setEdges, isJjomMode]);

    // Redo handler
    const handleRedo = useCallback(() => {
        const state = redo();
        if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            forceUpdate({});

            // Same reconciliation for redo
            if (isJjomMode) {
                setTimeout(() => {
                    const idMap = reconcileJjomAfterUndoRedo(state.nodes);
                    if (idMap.size > 0) {
                        setNodes(nds => nds.map(n => {
                            if (n.type !== 'classNode') return n;
                            const data = n.data as ClassNodeData;
                            const attrs = data.attributes;
                            if (!attrs?.some(a => idMap.has(a.id))) return n;
                            return {
                                ...n,
                                data: {
                                    ...data,
                                    attributes: attrs.map(a =>
                                        idMap.has(a.id) ? { ...a, id: idMap.get(a.id)! } : a
                                    ),
                                },
                            };
                        }));
                    }
                }, 50);
            }
        }
    }, [redo, setNodes, setEdges, isJjomMode]);

    // Copy selected nodes and edges
    const copySelected = useCallback(() => {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);

        const nodeIds = new Set(selectedNodes.map((n) => n.id));
        const connectedEdges = getEdges().filter(
            (e) => nodeIds.has(e.source) && nodeIds.has(e.target)
        );

        clipboard.current = {
            nodes: JSON.parse(JSON.stringify(selectedNodes)),
            edges: JSON.parse(JSON.stringify([...selectedEdges, ...connectedEdges])),
        };
    }, [getNodes, getEdges]);

    // Cut selected nodes and edges
    const cutSelected = useCallback(() => {
        copySelected();
        deleteSelected();
    }, [copySelected, deleteSelected]);

    // Paste from clipboard
    const pasteClipboard = useCallback(() => {
        if (clipboard.current.nodes.length === 0) return;

        takeSnapshot();
        const now = Date.now();
        const idMap = new Map<string, string>();

        const newNodes = clipboard.current.nodes.map((node, i) => {
            const newId = `${node.type}_${now}_${i}`;
            idMap.set(node.id, newId);
            return {
                ...node,
                id: newId,
                position: {
                    x: node.position.x + 50,
                    y: node.position.y + 50,
                },
                selected: true,
            };
        });

        const newEdges = clipboard.current.edges
            .filter((e) => idMap.has(e.source) && idMap.has(e.target))
            .map((edge, i) => ({
                ...edge,
                id: `ref_${now}_${i}`,
                source: idMap.get(edge.source)!,
                target: idMap.get(edge.target)!,
                selected: false,
            }));

        setNodes((nds) => [
            ...nds.map((n) => ({ ...n, selected: false })),
            ...newNodes,
        ]);
        setEdges((eds) => [
            ...eds.map((e) => ({ ...e, selected: false })),
            ...newEdges,
        ]);
    }, [setNodes, setEdges, takeSnapshot]);

    // Select all nodes
    const selectAll = useCallback(() => {
        setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
        setEdges((eds) => eds.map((e) => ({ ...e, selected: true })));
    }, [setNodes, setEdges]);

    // Keyboard handler
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if ((event.target as HTMLElement).tagName === 'INPUT') return;
            if ((event.target as HTMLElement).tagName === 'SELECT') return;

            const isMod = event.ctrlKey || event.metaKey;

            if (event.key === 'Delete' || event.key === 'Backspace') {
                deleteSelected();
                return;
            }

            if (isMod && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
                return;
            }

            if (isMod && ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
                event.preventDefault();
                handleRedo();
                return;
            }

            if (isMod && event.key === 'c') {
                event.preventDefault();
                copySelected();
                return;
            }

            if (isMod && event.key === 'x') {
                event.preventDefault();
                cutSelected();
                return;
            }

            if (isMod && event.key === 'v') {
                event.preventDefault();
                pasteClipboard();
                return;
            }

            if (isMod && event.key === 'a') {
                event.preventDefault();
                selectAll();
                return;
            }
        },
        [deleteSelected, handleUndo, handleRedo, copySelected, cutSelected, pasteClipboard, selectAll]
    );

    // Wrap alignment actions with snapshot for undo support
    const withSnapshot = useCallback((action: () => void) => {
        takeSnapshot();
        action();
    }, [takeSnapshot]);

    // Context menu handlers
    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            const rect = editorContainerRef.current?.getBoundingClientRect();
            const selectedCount = getNodes().filter(n => n.selected).length;
            setContextMenu({
                x: event.clientX - (rect?.left ?? 0),
                y: event.clientY - (rect?.top ?? 0),
                nodeId: node.id,
                isMultiSelect: selectedCount > 1,
                selectedCount,
            });
        },
        [getNodes]
    );

    const onEdgeContextMenu = useCallback(
        (event: React.MouseEvent, edge: Edge) => {
            event.preventDefault();
            const rect = editorContainerRef.current?.getBoundingClientRect();
            setContextMenu({
                x: event.clientX - (rect?.left ?? 0),
                y: event.clientY - (rect?.top ?? 0),
                edgeId: edge.id,
            });
        },
        []
    );

    const onPaneClick = useCallback(() => {
        setContextMenu(null);
        jjomSelection.onPaneClick();
    }, [jjomSelection]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Listen for child-element context menu events from ClassNode
    useEffect(() => {
        const handler = (e: Event) => {
            const { childId, childKind, nodeId, x, y } = (e as CustomEvent).detail;
            const rect = editorContainerRef.current?.getBoundingClientRect();
            setContextMenu({
                x: x - (rect?.left ?? 0),
                y: y - (rect?.top ?? 0),
                nodeId,
                childId,
                childKind,
            });
        };
        window.addEventListener('jjodel:child-context-menu', handler);
        return () => window.removeEventListener('jjodel:child-context-menu', handler);
    }, []);

    // Shared helper: create a composition child on a parent node
    const createCompositionChild = (parentNode: Node, childClass: MetaclassInfo, refName: string) => {
        if (!graphId) return;
        const childName = `${childClass.name.charAt(0).toLowerCase()}${childClass.name.slice(1)}_${Date.now().toString(36).slice(-3)}`;

        // Count existing composition children to stack vertically
        const currentEdges = getEdges();
        const existingChildCount = currentEdges.filter(
            e => e.source === parentNode.id && e.type === 'composition'
        ).length;

        const parentW = parentNode.measured?.width ?? 140;
        const childX = parentNode.position.x + parentW + 80;
        const childY = parentNode.position.y + existingChildCount * 80;

        const vertexId = syncCreateObject(graphId, childClass.id, childX, childY, childName);
        if (vertexId) {
            markDropCreated(vertexId);
            const childNode: Node = {
                id: vertexId,
                type: 'objectNode',
                position: { x: childX, y: childY },
                data: {
                    label: childName,
                    instanceOfClassName: childClass.name,
                    instanceOfClassId: childClass.id,
                    features: [],
                    autoEdit: true,
                } as ObjectNodeData,
            };
            setNodes(nds => [...nds, childNode]);
            const edgeId = syncCreateCompositionLink(parentNode.id, vertexId, refName);
            // Immediately create RF edge with proper anchoring (closest sides)
            if (edgeId) {
                markDropCreated(edgeId);
                // Child is to the right → parent-right, child-left
                const srcSide = 'right';
                const tgtSide = 'left';
                const srcIdx = getNextFreeHandleIndex(parentNode.id, srcSide, 'source', currentEdges);
                const tgtIdx = getNextFreeHandleIndex(vertexId, tgtSide, 'target', currentEdges);
                setEdges(eds => [...eds, {
                    id: edgeId,
                    source: parentNode.id,
                    target: vertexId,
                    sourceHandle: `${srcSide}-${srcIdx}`,
                    targetHandle: `${tgtSide}-${tgtIdx}`,
                    type: 'composition',
                    data: {
                        kind: 'composition' as ReferenceKind,
                        referenceName: refName,
                        sourceAnchor: { mode: 'auto', side: srcSide } as AnchorConfig,
                        targetAnchor: { mode: 'auto', side: tgtSide } as AnchorConfig,
                    },
                }]);
            }
        }
    };

    const getContextMenuItems = (): ContextMenuItem[] => {
        // Multi-select context menu with alignment options
        if (contextMenu?.isMultiSelect && contextMenu.selectedCount && contextMenu.selectedCount > 1) {
            const items: ContextMenuItem[] = [
                { label: 'Align left', icon: 'bi-align-start', onClick: () => withSnapshot(alignLeft) },
                { label: 'Align center', icon: 'bi-align-center', onClick: () => withSnapshot(alignCenterVertical) },
                { label: 'Align right', icon: 'bi-align-end', onClick: () => withSnapshot(alignRight) },
                { divider: true },
                { label: 'Align top', icon: 'bi-align-top', onClick: () => withSnapshot(alignTop) },
                { label: 'Align middle', icon: 'bi-align-middle', onClick: () => withSnapshot(alignCenterHorizontal) },
                { label: 'Align bottom', icon: 'bi-align-bottom', onClick: () => withSnapshot(alignBottom) },
            ];

            // Distribution only with 3+ nodes
            if (contextMenu.selectedCount >= 3) {
                items.push(
                    { divider: true },
                    { label: 'Distribute horizontally', icon: 'bi-distribute-horizontal', onClick: () => withSnapshot(distributeHorizontally) },
                    { label: 'Distribute vertically', icon: 'bi-distribute-vertical', onClick: () => withSnapshot(distributeVertically) },
                );
            }

            items.push(
                { divider: true },
                { label: `Delete ${contextMenu.selectedCount} nodes`, icon: 'bi-trash', danger: true, onClick: deleteSelected },
            );

            return items;
        }

        // Child element context menu (attribute/operation)
        if (contextMenu?.nodeId && contextMenu.childId) {
            const childLabel = contextMenu.childKind === 'attr' ? 'Attribute' : 'Operation';
            return [
                {
                    label: `Delete ${childLabel}`,
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => {
                        takeSnapshot();
                        if (contextMenu.childKind === 'attr') {
                            syncRemoveAttribute(contextMenu.childId!, contextMenu.nodeId!);
                        } else {
                            syncRemoveOperation(contextMenu.childId!, contextMenu.nodeId!);
                        }
                        setNodes(nds => nds.map(n => {
                            if (n.id !== contextMenu.nodeId) return n;
                            const data = n.data as ClassNodeData;
                            return {
                                ...n,
                                data: {
                                    ...data,
                                    attributes: contextMenu.childKind === 'attr'
                                        ? data.attributes.filter(a => a.id !== contextMenu.childId)
                                        : data.attributes,
                                    operations: contextMenu.childKind === 'op'
                                        ? (data.operations || []).filter(o => o.id !== contextMenu.childId)
                                        : data.operations,
                                },
                            };
                        }));
                    },
                },
                { divider: true },
                {
                    label: 'Help',
                    icon: 'bi-question-circle',
                    onClick: () => {
                        const helpKey = contextMenu.childKind === 'attr' ? 'element-attribute' : 'element-operation';
                        window.dispatchEvent(new CustomEvent('jjodel:help-open', { detail: { helpKey } }));
                    },
                },
            ];
        }

        // Single node context menu
        if (contextMenu?.nodeId) {
            const node = getNodes().find(n => n.id === contextMenu.nodeId);
            const items: ContextMenuItem[] = [];

            // M1: composition children for object nodes (uses compositionCompat utility)
            if (isModelMode && node?.type === 'objectNode') {
                const objData = node.data as ObjectNodeData;
                const metaclass = modeInfo.allClasses.find(c => c.id === objData.instanceOfClassId);
                if (metaclass) {
                    // Resolve DObject ID for upper-bound guard checks
                    const dVertex = LPointerTargetable.fromPointer(node.id) as any;
                    const sourceObjectId: string = dVertex?.model?.id ?? dVertex?.__raw?.model ?? node.id;

                    const childOptions = getCompositionChildOptions(metaclass, modeInfo.allClasses);
                    for (const { ref, concreteOptions } of childOptions) {
                        const guardResult = guardLink(sourceObjectId, ref.name);
                        const isFull = !guardResult.allowed;

                        if (concreteOptions.length === 1) {
                            // Single concrete option → direct menu item
                            const cls = concreteOptions[0];
                            items.push({
                                label: `Add ${cls.name} (${ref.name})`,
                                icon: isFull ? 'bi-slash-circle' : 'bi-plus-circle',
                                disabled: isFull,
                                onClick: () => createCompositionChild(node, cls, ref.name),
                            });
                        } else {
                            // Multiple options → header + sub-items
                            items.push({ label: `── ${ref.name} ──`, icon: isFull ? 'bi-slash-circle' : 'bi-arrow-down-right', disabled: isFull, onClick: () => {} });
                            for (const cls of concreteOptions) {
                                items.push({
                                    label: `  Add ${cls.name}`,
                                    icon: isFull ? 'bi-slash-circle' : 'bi-plus-circle',
                                    disabled: isFull,
                                    onClick: () => createCompositionChild(node, cls, ref.name),
                                });
                            }
                        }
                    }
                    if (items.length > 0) {
                        items.push({ divider: true });
                    }
                }
            }

            items.push(
                {
                    label: 'Duplicate',
                    icon: 'bi-copy',
                    onClick: () => duplicateNode(contextMenu.nodeId!),
                },
                {
                    label: 'Delete',
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => deleteNode(contextMenu.nodeId!),
                },
                { divider: true },
                {
                    label: 'Help',
                    icon: 'bi-question-circle',
                    onClick: () => {
                        const helpKey =
                            node?.type === 'classNode'   ? 'element-class'
                          : node?.type === 'enumNode'    ? 'element-enum'
                          : node?.type === 'packageNode' ? 'element-package'
                          : node?.type === 'objectNode'  ? 'element-object'
                          : 'properties-panel';
                        window.dispatchEvent(new CustomEvent('jjodel:help-open', { detail: { helpKey } }));
                    },
                },
                {
                    label: 'Explain this',
                    icon: 'bi-stars',
                    onClick: () => {
                        const data = node?.data as any;
                        const elementName = data?.label ?? 'Unknown';
                        const elementType =
                            node?.type === 'classNode'   ? 'Class'
                          : node?.type === 'enumNode'    ? 'Enum'
                          : node?.type === 'packageNode' ? 'Package'
                          : node?.type === 'objectNode'  ? 'Object'
                          : 'Element';
                        const metamodelName = modelid ? (getModelInfo(modelid)?.name ?? 'Unknown') : 'Unknown';
                        const properties: Record<string, any> = {};
                        if (data?.isAbstract) properties.isAbstract = true;
                        if (data?.isSingleton) properties.isSingleton = true;
                        if (data?.attributes?.length) {
                            properties.attributes = data.attributes.map((a: any) => ({
                                name: a.name, type: a.type,
                                ...(a.lowerBound !== undefined && { lowerBound: a.lowerBound }),
                                ...(a.upperBound !== undefined && { upperBound: a.upperBound }),
                            }));
                        }
                        if (data?.references?.length) {
                            properties.references = data.references.map((r: any) => ({
                                name: r.name, kind: r.kind, targetType: r.type?.name,
                                containment: r.containment,
                            }));
                        }
                        if (data?.operations?.length) {
                            properties.operations = data.operations.map((o: any) => ({
                                name: o.name, returnType: o.returnType,
                            }));
                        }
                        if (data?.literals?.length) {
                            properties.literals = data.literals.map((l: any) => l.name);
                        }
                        if (data?.instanceOfClassName) {
                            properties.instanceOf = data.instanceOfClassName;
                        }
                        if (data?.features?.length) {
                            properties.features = data.features.map((f: any) => ({
                                name: f.featureName, value: f.value,
                            }));
                        }
                        window.dispatchEvent(new CustomEvent('jjodel:explain-open', {
                            detail: { elementName, elementType, metamodelName, properties },
                        }));
                    },
                },
            );
            return items;
        }

        // Edge context menu
        if (contextMenu?.edgeId) {
            const edge = getEdges().find((e) => e.id === contextMenu.edgeId);
            const isInheritance = edge?.type === 'inheritance';
            const edgeData = edge?.data as ReferenceEdgeData | InheritanceEdgeData | undefined;
            const hasWaypoints = edgeData?.waypoints && edgeData.waypoints.length > 0;

            return [
                {
                    label: isInheritance ? 'Convert to Reference' : 'Convert to Inheritance',
                    icon: isInheritance ? 'bi-arrow-right' : 'bi-triangle',
                    onClick: () => {
                        if (isInheritance) {
                            convertToReference(contextMenu.edgeId!);
                        } else {
                            convertToInheritance(contextMenu.edgeId!);
                        }
                    },
                },
                ...(hasWaypoints ? [{
                    label: 'Reset routing',
                    icon: 'bi-arrow-counterclockwise',
                    onClick: () => {
                        takeSnapshot();
                        setEdges((eds) =>
                            eds.map((ed) =>
                                ed.id === contextMenu.edgeId
                                    ? { ...ed, data: { ...ed.data, waypoints: [] } }
                                    : ed
                            )
                        );
                    },
                }] : []),
                {
                    label: isInheritance ? 'Delete inheritance' : 'Delete reference',
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => deleteEdge(contextMenu.edgeId!),
                },
            ];
        }
        return [];
    };

    // Zoom level (reactive via useStore, snapped to 10% for display)
    const zoomLevel = useStore((s) => Math.round(s.transform[2] * 100 / 10) * 10);

    // Zoom handlers — step by 10%
    const handleZoomIn = useCallback(() => {
        const current = storeApi.getState().transform[2];
        const next = Math.min(Math.round(current * 10 + 1) / 10, 2); // +10%, max 200%
        setViewport({ ...getViewport(), zoom: next }, { duration: 150 });
    }, [storeApi, setViewport, getViewport]);
    const handleZoomOut = useCallback(() => {
        const current = storeApi.getState().transform[2];
        const next = Math.max(Math.round(current * 10 - 1) / 10, 0.1); // -10%, min 10%
        setViewport({ ...getViewport(), zoom: next }, { duration: 150 });
    }, [storeApi, setViewport, getViewport]);
    const handleResetZoom = useCallback(() => {
        fitView({ padding: 0.2, maxZoom: 1, duration: 200 });
    }, [fitView]);
    const handleFitView = useCallback(() => fitView({ padding: 0.2, maxZoom: 1, duration: 200 }), [fitView]);
    const handleToggleSnap = useCallback(() => setSnapEnabled((prev) => !prev), []);

    // Auto-layout handler: compute ELK layout, apply to RF, sync to JjOM
    const handleAutoLayout = useCallback(async () => {
        const currentNodes = getNodes();
        const currentEdges = getEdges();
        if (currentNodes.length === 0) return;

        const layoutedNodes = await computeElkLayout(currentNodes, currentEdges);
        setNodes(layoutedNodes);

        // Sync all new positions to JjOM
        const updates: Array<{ id: string; x: number; y: number }> = [];
        for (const n of layoutedNodes) {
            updates.push({ id: n.id, x: n.position.x, y: n.position.y });
        }
        if (updates.length > 0) syncPositionBatchToJjom(updates);

        // Re-distribute port handles and fit the view
        setEdges(eds => applyDistribution(eds));
        requestAnimationFrame(() => fitView({ padding: 0.2, maxZoom: 1, duration: 300 }));
    }, [getNodes, getEdges, setNodes, setEdges, fitView, applyDistribution]);
    autoLayoutRef.current = handleAutoLayout;

    // Properties panel handlers
    const handleNodeChange = useCallback(
        (nodeId: string, data: any) => {
            takeSnapshot();
            // In JjOM mode, read fresh data from Redux first so that the
            // snapshot captures up-to-date values — then layer the user's
            // changes on top. Merged into a SINGLE setNodes call to avoid
            // cascading re-renders (the old two-call pattern could trigger
            // useJjomSync between the two updates, causing an infinite loop).
            setNodes((nds) =>
                nds.map((n) => {
                    if (n.id !== nodeId) return n;
                    let base = n.data;
                    if (isJjomMode) {
                        try {
                            const lProxy = LPointerTargetable.fromPointer(nodeId);
                            if (lProxy) {
                                const freshNode = jjomVertexToRFNode(lProxy);
                                if (freshNode) base = freshNode.data;
                            }
                        } catch { /* ignore */ }
                    }
                    return { ...n, data: { ...base, ...data } };
                })
            );
        },
        [setNodes, takeSnapshot, isJjomMode]
    );

    const handleEdgeChange = useCallback(
        (edgeId: string, data: Partial<Edge>) => {
            takeSnapshot();
            setEdges((eds) => {
                const updated = eds.map((e) => (e.id === edgeId ? { ...e, ...data } : e));
                return applyDistribution(updated);
            });
        },
        [setEdges, takeSnapshot, applyDistribution]
    );

    // Convert edge to inheritance
    const convertToInheritance = useCallback(
        (edgeId: string) => {
            takeSnapshot();
            setEdges((eds) =>
                eds.map((e) =>
                    e.id === edgeId
                        ? { ...e, type: 'inheritance', label: undefined, data: {} as InheritanceEdgeData }
                        : e
                )
            );
        },
        [setEdges, takeSnapshot]
    );

    // Convert edge to reference
    const convertToReference = useCallback(
        (edgeId: string) => {
            takeSnapshot();
            setEdges((eds) =>
                eds.map((e) =>
                    e.id === edgeId
                        ? {
                              ...e,
                              type: 'reference',
                              label: 'newAssociation',
                              data: {
                                  reference: {
                                      id: e.id,
                                      name: 'newAssociation',
                                      kind: 'association',
                                      targetClassId: e.target,
                                      lowerBound: 0,
                                      upperBound: -1,
                                      containment: false,
                                  },
                                  autoEdit: true,
                              } as ReferenceEdgeData,
                          }
                        : e
                )
            );
        },
        [setEdges, takeSnapshot]
    );

    // Take snapshot on node changes (drag end, resize end)
    const handleNodesChange = useCallback(
        (changes: any[]) => {
            // Reentrance guard: if we're already processing node changes
            // (e.g. from updateNodeInternals → dimension changes triggered
            // by our own setEdges), just apply the changes without edge recalc.
            if (isProcessingNodesChangeRef.current) {
                onNodesChange(changes);
                return;
            }
            isProcessingNodesChangeRef.current = true;

            try {

            const hasDragEnd = changes.some(
                (c) => c.type === 'position' && c.dragging === false
            );
            // Only trigger on EXPLICIT user resize, not React Flow auto-measurement.
            // Auto-measurement fires {type:'dimensions'} after updateNodeInternals
            // (from DynamicHandles) with resizing === undefined.
            // User resize has resizing === true (during) or false (end).
            const hasResize = changes.some(
                (c) => c.type === 'dimensions' && (c as any).resizing !== undefined
            );

            if (hasDragEnd || hasResize) {
                takeSnapshot();

                const movedNodeIds = new Set(
                    changes
                        .filter((c) => c.type === 'position' || c.type === 'dimensions')
                        .map((c) => c.id)
                );

                // Use getNodes() (always-current store) instead of `nodes`
                // (React state, potentially stale by one render cycle).
                // Then overlay positions from the current changes so we use
                // the ACTUAL final positions, not the pre-batch ones.
                const nodeRects = new Map(
                    getNodes().map((n) => [n.id, getNodeRect(n)])
                );
                for (const c of changes) {
                    if (c.type === 'position' && c.position) {
                        const existing = nodeRects.get(c.id);
                        if (existing) {
                            nodeRects.set(c.id, {
                                ...existing,
                                x: c.position.x,
                                y: c.position.y,
                                centerX: c.position.x + existing.width / 2,
                                centerY: c.position.y + existing.height / 2,
                            });
                        }
                    }
                }

                setEdges((currentEdges) => {
                    const now = Date.now();
                    const edgesToRecalculate = currentEdges.filter(
                        (e) => (movedNodeIds.has(e.source) || movedNodeIds.has(e.target))
                            // Skip edges optimized by OAA — let the hook handle them
                            && !(e.data as any)?.oaaOptimized
                            // Temporal guard: skip edges created in the last 300ms —
                            // handleBounds are stale until React Flow re-measures
                            && !(recentlyCreatedEdgesRef.current.has(e.id)
                                && (now - recentlyCreatedEdgesRef.current.get(e.id)!) < 300)
                    );

                    if (edgesToRecalculate.length === 0) return currentEdges;

                    const anchorResults = computeAnchorsWithHysteresis(edgesToRecalculate, nodeRects, currentEdges);

                    const updated = currentEdges.map((edge) => {
                        const result = anchorResults.get(edge.id);
                        if (result) {
                            let newSrcSide = result.sourceHandle;
                            let newTgtSide = result.targetHandle;

                            const currentSrcSide = edge.sourceHandle?.split('-')[0];
                            const currentTgtSide = edge.targetHandle?.split('-')[0];
                            const sidesChanged = currentSrcSide !== newSrcSide
                                || currentTgtSide !== newTgtSide;

                            return {
                                ...edge,
                                sourceHandle: `${newSrcSide}-0`,
                                targetHandle: `${newTgtSide}-0`,
                                data: {
                                    ...edge.data,
                                    sourceAnchor: result.sourceAnchor,
                                    targetAnchor: result.targetAnchor,
                                    ...(sidesChanged ? { waypoints: [] } : {}),
                                },
                            };
                        }
                        return edge;
                    });

                    // Guard: deduplicate edges by ID — hysteresis recalc can
                    // produce duplicates in edge cases with concurrent state updates
                    const seenIds = new Set<string>();
                    const deduped = updated.filter(edge => {
                        if (seenIds.has(edge.id)) {
                            console.warn('[EditorV2] Removed duplicate edge:', edge.id);
                            return false;
                        }
                        seenIds.add(edge.id);
                        return true;
                    });

                    return applyDistribution(deduped);
                });
            }

            // Phase 3: sync position/size changes to JjOM
            if (isJjomMode) {
                // -- Drag sync --
                if (hasDragEnd) {
                    // Lazy mode: sync final position on drag end
                    const dragEndChanges = changes.filter(
                        (c: any) => c.type === 'position' && c.dragging === false && c.position
                    );
                    const lazyUpdates = dragEndChanges.filter(
                        (c: any) => getSyncMode(c.id) === 'lazy'
                    );
                    if (lazyUpdates.length > 0) {
                        syncPositionBatchToJjom(
                            lazyUpdates.map((c: any) => ({
                                id: c.id, x: c.position.x, y: c.position.y,
                            })),
                        );
                    }
                    // Faithful mode: flush any pending RAF-throttled writes
                    for (const c of dragEndChanges) {
                        if (getSyncMode(c.id) === 'faithful') {
                            cancelThrottle(`jjom_drag_${c.id}`);
                            syncPositionToJjom(c.id, c.position.x, c.position.y);
                        }
                    }
                }

                // -- Faithful drag: during drag, dispatch position via RAF throttle --
                const draggingChanges = changes.filter(
                    (c: any) => c.type === 'position' && c.dragging === true && c.position
                        && getSyncMode(c.id) === 'faithful'
                );
                for (const c of draggingChanges) {
                    rafThrottle(
                        `jjom_drag_${c.id}`,
                        (pos: { x: number; y: number }) => {
                            syncPositionToJjom(c.id, pos.x, pos.y);
                        },
                        32, // ~30fps matching classic editor
                    )({ x: c.position.x, y: c.position.y });
                }

                // -- Resize sync (only on explicit user resize, NOT on RF
                // auto-measurement which fires dimensions for every setNodes) --
                if (hasResize) {
                    for (const c of changes.filter((ch: any) => ch.type === 'dimensions' && ch.resizing)) {
                        const node = getNodes().find((n) => n.id === c.id);
                        const w = c.dimensions?.width ?? node?.measured?.width;
                        const h = c.dimensions?.height ?? node?.measured?.height;
                        if (w !== undefined && h !== undefined) {
                            syncSizeToJjom(c.id, w, h);
                        }
                    }
                }
            }

            // Deduplicate auto-measurement dimension changes to break the
            // StoreUpdater infinite loop:
            //   React setNodes → StoreUpdater → store.setNodes → RF measure
            //   → onNodesChange({type:'dimensions'}) → setNodes → repeat
            //
            // First measurement of each node passes through (so React state
            // gets `measured` values).  Subsequent measurements with the SAME
            // dimensions are filtered out — they'd create a new nodes reference
            // without any actual data change, needlessly re-triggering
            // StoreUpdater.  User-initiated resize (resizing !== undefined)
            // always passes through.
            const changesToApply = changes.filter((c: any) => {
                if (c.type !== 'dimensions') return true;
                if (c.resizing !== undefined) return true; // user resize

                const dims = c.dimensions;
                if (!dims) return false;

                const prev = lastMeasuredDimsRef.current.get(c.id);
                if (prev
                    && Math.abs(prev.w - dims.width) < 0.5
                    && Math.abs(prev.h - dims.height) < 0.5) {
                    return false; // redundant — same dimensions already applied
                }

                lastMeasuredDimsRef.current.set(c.id, { w: dims.width, h: dims.height });
                return true; // first measurement or actual size change
            });
            if (changesToApply.length > 0) {
                onNodesChange(changesToApply);
            }

            } finally {
                isProcessingNodesChangeRef.current = false;
            }
        },
        [onNodesChange, takeSnapshot, setEdges, getNodes, applyDistribution, isJjomMode]
    );

    // Recalculate anchors for a specific edge (called by SegmentHandles after drag).
    // If the optimal anchor side changes, clear waypoints since they'd be invalid.
    const recalculateAnchors = useCallback(
        (edgeId: string) => {
            const nodeRectsMap = new Map(nodes.map((n) => [n.id, getNodeRect(n)]));
            setEdges((currentEdges) => {
                const edge = currentEdges.find(e => e.id === edgeId);
                if (!edge) return currentEdges;

                // Skip edges optimized by OAA — let the hook handle them
                if ((edge.data as any)?.oaaOptimized) return currentEdges;

                const anchorResults = computeAnchorsWithHysteresis([edge], nodeRectsMap, currentEdges);
                const result = anchorResults.get(edgeId);
                if (!result) return currentEdges;

                let newSrcSide = result.sourceHandle;
                let newTgtSide = result.targetHandle;

                // Inheritance edges: enforce top→bottom convention
                if (edge.type === 'inheritance') {
                    newSrcSide = 'top';
                    newTgtSide = 'bottom';
                }

                const currentSrcSide = edge.sourceHandle?.split('-')[0];
                const currentTgtSide = edge.targetHandle?.split('-')[0];
                const sidesChanged = currentSrcSide !== newSrcSide
                    || currentTgtSide !== newTgtSide;

                if (!sidesChanged) return currentEdges;

                const updated = currentEdges.map(e => {
                    if (e.id !== edgeId) return e;
                    return {
                        ...e,
                        sourceHandle: `${newSrcSide}-0`,
                        targetHandle: `${newTgtSide}-0`,
                        data: {
                            ...e.data,
                            sourceAnchor: result.sourceAnchor,
                            targetAnchor: result.targetAnchor,
                            waypoints: [],
                        },
                    };
                });
                return applyDistribution(updated);
            });
        },
        [nodes, setEdges, applyDistribution]
    );

    // Update Properties panel to show a child element (attr/op/literal) without changing graph selection.
    // Uses requestAnimationFrame so it runs AFTER onNodeClick's selectElement sets modelElement to parent.
    const selectChildElement = useCallback((childModelElementId: string) => {
        requestAnimationFrame(() => {
            const st: DState = store.getState() as DState;
            const currentNode = (st as any)._lastSelected?.node ?? '';
            SetRootFieldAction.new('_lastSelected' as any, {
                node: currentNode,
                view: '',
                modelElement: childModelElementId,
            });
        });
    }, []);

    const editorContextValue = useMemo(() => ({ takeSnapshot, notation, onEdgeDataChange: handleEdgeChange, recalculateAnchors, selectChildElement }), [takeSnapshot, notation, handleEdgeChange, recalculateAnchors, selectChildElement]);

    // Model info for PropertiesPanel (when nothing is selected)
    const modelInfoData = useMemo(() => {
        if (!modelid || !isJjomMode) return null;
        return getModelInfo(modelid);
    }, [modelid, isJjomMode, nodes.length]); // re-compute when nodes change

    const handleModelNameChange = useCallback((name: string) => {
        if (modelid) setModelName(modelid, name);
    }, [modelid]);

    const handleModelUriChange = useCallback((uri: string) => {
        if (modelid) setModelUri(modelid, uri);
    }, [modelid]);

    return (
        <EditorContext.Provider value={editorContextValue}>
            <div className={`editor-v2 theme-${theme} notation-${notation}${colorScheme !== 'default' ? ` scheme-${colorScheme}` : ''}`} tabIndex={0} onKeyDown={onKeyDown}>
                <PalettePanel
                    editorMode={modeInfo.mode}
                    rootableClasses={modeInfo.rootableClasses}
                    allConcreteClasses={modeInfo.allClasses.filter(c => !c.isAbstract)}
                />
                <div className="editor-v2__main">
                    <Toolbar
                        snapEnabled={snapEnabled}
                        onToggleSnap={handleToggleSnap}
                        gridVisible={gridVisible}
                        onToggleGrid={handleToggleGrid}
                        onFitView={handleFitView}
                        onAutoLayout={handleAutoLayout}
                        onDuplicateSelected={duplicateSelected}
                        onDeleteSelected={deleteSelected}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        notation={notation}
                        onNotationChange={setNotation}
                        colorScheme={colorScheme}
                        onColorSchemeChange={setColorScheme}
                        zoomLevel={zoomLevel}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                        selectedCount={selectedNodes.length}
                        onAlignLeft={() => withSnapshot(alignLeft)}
                        onAlignCenterV={() => withSnapshot(alignCenterVertical)}
                        onAlignRight={() => withSnapshot(alignRight)}
                        onAlignTop={() => withSnapshot(alignTop)}
                        onAlignCenterH={() => withSnapshot(alignCenterHorizontal)}
                        onAlignBottom={() => withSnapshot(alignBottom)}
                        onDistributeH={() => withSnapshot(distributeHorizontally)}
                        onDistributeV={() => withSnapshot(distributeVertically)}
                    />
                    <div className="editor-v2__canvas" ref={editorContainerRef} style={{ position: 'relative' }}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={handleNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onConnectEnd={onConnectEnd}
                            onReconnect={handleReconnect}
                            onReconnectStart={handleReconnectStart}
                            reconnectRadius={15}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeContextMenu={onNodeContextMenu}
                            onEdgeContextMenu={onEdgeContextMenu}
                            onNodeClick={jjomSelection.onNodeClick}
                            onEdgeClick={jjomSelection.onEdgeClick}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            connectionMode={ConnectionMode.Loose}
                            fitView={!isJjomMode && nodes.length > 0}
                            fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
                            snapToGrid={snapEnabled}
                            snapGrid={[16, 16]}
                            multiSelectionKeyCode="Shift"
                            selectionMode={SelectionMode.Partial}
                            panOnDrag={[0, 1, 2]}
                            zoomOnScroll={false}
                            panOnScroll={false}
                            panOnScrollMode={PanOnScrollMode.Free}
                            zoomActivationKeyCode="Shift"
                            preventScrolling={false}
                            zoomOnPinch={true}
                            deleteKeyCode={null}
                            connectionRadius={40}
                        >
                            <svg className="editor-v2__dot-grid" style={{ opacity: gridVisible ? 1 : 0 }}>
                                <defs>
                                    <pattern id="dot-grid-pattern" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                                        <circle cx="12" cy="12" r="1"
                                            fill={theme === 'dark' ? '#334155' : '#cbd5e1'}
                                            fillOpacity={theme === 'dark' ? 0.6 : 0.55}
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#dot-grid-pattern)" />
                            </svg>
                            {/* Zoom controls moved to toolbar */}
                            <MiniMap
                                    style={{ position: 'absolute', margin: 0, right: '20px', bottom: '100px', borderRadius: '4px', opacity: 0.8 }}
                                    nodeStrokeWidth={3}
                                    nodeColor={(node) => {
                                        if (node.type === 'classNode') return theme === 'dark' ? '#0ea5e9' : '#0284c7';
                                        if (node.type === 'enumNode') return '#7c3aed';
                                        if (node.type === 'packageNode') return theme === 'dark' ? '#64748b' : '#94a3b8';
                                        if (node.type === 'objectNode') return theme === 'dark' ? '#f59e0b' : '#d97706';
                                        return theme === 'dark' ? '#334155' : '#e2e8f0';
                                    }}
                                    maskColor={theme === 'dark' ? 'rgba(30, 41, 59, 0.8)' : 'rgba(241, 245, 249, 0.8)'}
                                />
                        </ReactFlow>

                        
                        {pendingConnection && (
                            <EdgeTypePopup
                                position={pendingConnection.position}
                                containerRef={editorContainerRef}
                                onSelect={handleEdgeTypeSelected}
                                onCancel={handleEdgeTypeCancelled}
                            />
                        )}

                        {pendingM1Connection && (
                            <M1ReferencePopup
                                position={pendingM1Connection.position}
                                containerRef={editorContainerRef}
                                options={pendingM1Connection.compatibleRefs}
                                onSelect={(ref) => handleM1ReferenceSelected(ref)}
                                onCancel={() => setPendingM1Connection(null)}
                            />
                        )}
                    </div>
                </div>

                {/* PropertiesPanel removed — properties editing handled by dock-based Info panel */}

                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={getContextMenuItems()}
                        onClose={closeContextMenu}
                    />
                )}

                {modelid && createPortal(
                    <PolymetricView
                        isOpen={polymetricOpen}
                        onClose={() => setPolymetricOpen(false)}
                        modelId={modelid}
                        modelName={modelInfoData?.name ?? 'Model'}
                        target={isModelMode ? 'model' : 'metamodel'}
                    />,
                    document.body,
                )}

            </div>
        </EditorContext.Provider>
    );
}

/**
 * Editor V2 - Metamodel Editor based on React Flow.
 * Supports Package, Class, Enumeration nodes and Reference edges.
 */
function EditorV2({ modelid, onSwitchEditor }: EditorV2Props) {
    return (
        <ReactFlowProvider>
            <EditorV2Inner modelid={modelid} onSwitchEditor={onSwitchEditor} />
        </ReactFlowProvider>
    );
}

export default EditorV2;
export { EditorV2 };
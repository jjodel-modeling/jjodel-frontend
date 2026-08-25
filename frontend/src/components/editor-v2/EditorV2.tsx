import React, { useCallback, useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { useSelector } from 'react-redux';
import { createPortal } from 'react-dom';
import { isAdvancedMode } from '../../hooks/useInterfaceMode';
import {
    ReactFlow,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    useUpdateNodeInternals,
    ReactFlowProvider,
    useStoreApi,
    useStore,
    SelectionMode,
    ConnectionMode,
    PanOnScrollMode,
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
import Toolbar from './Toolbar';
import { useIRContainment, useIRInteractionPlan } from './viewpoint/ir/useIRContainment';
import { applyIRPaletteFilter, deriveDroppableChildMetaclasses, matchConnectRules, type IRConnectRuleMatch, type IRInteractionPlan } from './viewpoint/ir/irInteraction';
import IRContainmentHulls from './viewpoint/ir/IRContainmentHulls';
import { clearSyntheticEdgeSelection, getIREdgeAnchorOverride, hydrateIREdgeAnchorOverrides, irEdgeLayoutFromOverride, setIREdgeAnchorOverride, setSyntheticEdgeSelected, type IRAnchorOverride } from './viewpoint/ir/irEdgeInteraction';
import { hydrateCollapsed, isCollapsed } from './viewpoint/ir/irCollapseState';
import { computeIRSignature, getIRIndex, resolveObjectAsEdgeView, resolveIRView } from './viewpoint/ir/irResolveCore';
import { makeReadCtx } from './viewpoint/ir/irReadCtxLproxy';
import { useActiveEditor, CLASSIC_ZOOM_MIN, CLASSIC_ZOOM_MAX, type ZoomController } from './ActiveEditorContext';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { useHistory } from './hooks/useHistory';
import { useAlignment } from './hooks/useAlignment';
import { useAutoAnchor, computeAnchorsWithHysteresis, getNodeRect, computeGeometricAnchorsForAllEdges } from './hooks/useAutoAnchor';
import { reduceReLayout, countReferenceEdges, INITIAL_RELAYOUT_STATE, type ReLayoutState, type ReLayoutEvent } from './utils/reLayoutWatcher';
// Viewport-only helper (F3): reserve room for the floating overlay in fit/centering.
import { fitPadding, getCanvasRightInset } from './viewportInset';
import { EditorContext } from './contexts/EditorContext';
import { HighlightProvider, type HighlightState } from './contexts/HighlightContext';
import { getNextFreeHandleIndex, computePortDistribution } from './utils/portDistribution';
import { getSideFromHandle } from './utils/edgeUtils';
import type { ClassNodeData, EnumNodeData, PackageNodeData, ObjectNodeData, ReferenceEdgeData, InheritanceEdgeData, CompositionEdgeData, InstanceReferenceEdgeData, AnchorConfig, ReferenceKind, NotationMode, ColorScheme, CustomColorScheme, ActiveColorScheme } from './types';
import { EdgeTypePopup, type EdgeTypeChoice } from './components/EdgeTypePopup';
import { M1ReferencePopup } from './components/M1ReferencePopup';
import { useJjomSync } from './hooks/useJjomSync';
import { useM1ReferenceEdges } from './hooks/useM1ReferenceEdges';
import { useLayoutAutosave } from './hooks/useLayoutAutosave';
import { useCustomPaletteStyleSheet } from './hooks/useCustomPaletteStyleSheet';
import { useJjomSelection } from './hooks/useJjomSelection';
import { useEditorMode, type MetaclassInfo, type MetaclassReference } from './hooks/useEditorMode';
import { useClassRemoval } from './hooks/useClassRemoval';
import { useConformanceGuard } from '../../model/conformance/useConformanceGuard';
import { useOrphanFeatures } from './hooks/useOrphanFeatures';
import { UniquenessProblemSync } from './problems/UniquenessProblemSync';
import { ConformanceProblemSync } from './problems/ConformanceProblemSync';
import { getSyncMode, markDropCreated, suppressSingleton, unsuppressSingleton, clearSuppressedSingletons, getSuppressedSingletonIds, getEdgeRefId } from './sync/syncState';
import {
    syncPositionToJjom,
    syncPositionBatchToJjom,
    syncSizeToJjom,
    syncSizeBatchToJjom,
    syncSizeResetToJjom,
    syncIREdgeLayoutToJjom,
    syncInheritanceEdge,
    syncReferenceEdge,
    syncDeleteVertex,
    syncDeleteEdge,
    syncDeleteReferenceById,
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
import { getCompositionChildOptions, getCompatibleReferences, getCompatibleContainmentRefs, isDropCompatible, type CompatibleReference } from './utils/compositionCompat';
import { LPointerTargetable, store, DState, SetRootFieldAction, DVertex, GraphSize, GraphPoint, SetFieldAction, TRANSACTION, U, DUser, UndoAction, RedoAction, statehistory } from '../../joiner';
import { jjomVertexToRFNode } from './utils/jjomTransformers';
import { useTheme } from '../../services/ThemeService';
import { getDraggedMetaclassId } from './utils/dragState';
import { PolymetricView } from '../polymetric';
import { createViewInWorkbench, resolveParentViewpoint } from '../../utils/lastViewpoint';
import DockManager from '../abstract/DockManager';
import SimulationPanel from './sim/SimulationPanel';
// BottomDrawer import removed — bottom property drawer disabled (duplicates right Properties panel)
// ElementPropertiesDrawer import removed — bottom drawer disabled (see BottomDrawer removal)

import { JjodelEvents } from '../../events/registry';
import { toast } from '../Toast/toastDispatch';
import './EditorV2.scss';

// Register custom node types (M2 + M1)
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
    objectNode: ObjectNode,         // M1: instance of a metaclass
};

// Register custom edge types — all map to UnifiedEdge which handles all variants
// De-overlap steps for edge labels (assigned in applyDistribution, consumed by UnifiedEdge):
const CARD_STAGGER_STEP = 11; // px extra depth per extra cardinality on the same target side
const ROLE_ARC_STEP = 22;     // px arc-length separation between bundled roles

const edgeTypes: EdgeTypes = {
    reference: UnifiedEdge,
    inheritance: UnifiedEdge,
    composition: UnifiedEdge,       // M1: containment edge
    instanceRef: UnifiedEdge,       // M1: non-containment reference
};

// ---------------------------------------------------------------------------
// IR layout persistence (discovery 2026-07-19)
// ---------------------------------------------------------------------------

// Graphs whose persisted DVertex overrides (irEdgeLayout / irCollapsed) have
// already been seeded into the IR session stores. Once per graph per session:
// re-seeding would override session gestures (e.g. re-collapse a container the
// user expanded). The session stores stay the runtime source of truth.
const irLayoutHydratedGraphs = new Set<string>();

/** vertexId of the graph's DVertex carrying the given M1 object, or null. */
function irVertexIdForObject(graphId: string | null, objectId: string): string | null {
    if (!graphId) return null;
    const lookup: any = (store.getState() as any).idlookup ?? {};
    const subs: string[] = lookup[graphId]?.subElements ?? [];
    for (const vid of subs) {
        const v = lookup[vid];
        if (v?.className === 'DVertex' && v.model === objectId) return vid;
    }
    return null;
}

/**
 * persistWaypoints gate (spec v1.2 sez. 7, extended reading 2026-07-19): false
 * on the resolved object-as-edge view keeps the whole layout override
 * (waypoints AND side pins) session-only. Default true (no IR index / no
 * resolved view / resolution error → persist).
 */
function isIREdgeLayoutPersistable(objectId: string, state?: DState): boolean {
    try {
        const s: any = state ?? store.getState();
        const sig = computeIRSignature(s);
        if (!sig) return true;
        const index = getIRIndex(s, sig);
        if (!index) return true;
        const metaclassId = s.idlookup?.[objectId]?.instanceof;
        if (typeof metaclassId !== 'string') return true;
        const cv = resolveObjectAsEdgeView(objectId, metaclassId, index, makeReadCtx(s.idlookup), s.idlookup);
        return cv?.persistWaypoints !== false;
    } catch {
        return true;
    }
}

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
    childKind?: 'attr' | 'op' | 'ref';
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
    /** Classic editor content rendered in `classic` and `split` modes. */
    classicSlot?: React.ReactNode;
    /** Current editor mode. Falsy/`'flow'` keeps the existing flow-only layout. */
    editorMode?: 'flow' | 'classic' | 'split';
    /** Whether a viewpoint is active — controls visibility of the mode toggle. */
    hasViewpoint?: boolean;
    /** Handler invoked when the user clicks the segmented mode toggle. */
    onEditorModeChange?: (mode: 'flow' | 'classic' | 'split') => void;
}

/**
 * Inner editor component that uses React Flow hooks.
 * Must be wrapped in ReactFlowProvider.
 */
function EditorV2Inner({ modelid, onSwitchEditor, classicSlot, editorMode, hasViewpoint, onEditorModeChange }: EditorV2Props) {
    // Phase 3: React Flow state — initialised from demo data when standalone,
    // or populated by useJjomSync when modelid is provided.
    const [nodes, setNodes, onNodesChange] = useNodesState(modelid ? [] : initialNodes);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [edges, setEdgesRaw, _onEdgesChangeRaw] = useEdgesState(modelid ? [] : initialEdges);

    // Track manually-selected edges to preserve selection through Redux patches.
    // This is a workaround for useJjomSync's edge updates destroying React Flow's selected state.
    const selectedEdgeIdRef = useRef<string | null>(null);

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
    // Also preserves the selected edge ID through patches.
    const setEdges = useCallback(
        (updater: Edge[] | ((eds: Edge[]) => Edge[])) => {
            setEdgesRaw((currentEdges) => {
                const next = typeof updater === 'function' ? updater(currentEdges) : updater;
                const deduped = deduplicateEdges(next);
                
                // Re-apply selection to the preserved edge ID
                // This ensures selection survives Redux patches from useJjomSync
                if (selectedEdgeIdRef.current) {
                    return deduped.map(e => ({
                        ...e,
                        selected: e.id === selectedEdgeIdRef.current,
                    }));
                }
                return deduped;
            });
        },
        [setEdgesRaw, deduplicateEdges],
    );

    // Dedup-aware onEdgesChange: applies React Flow's internal edge changes,
    // then deduplicates the result before committing to state.
    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            // Synthetic IR edges (object-as-edge, ids irobj_*) exist only in the
            // decorated array: their selection changes are tracked in the IR
            // interaction store (re-applied by the decoration pass), everything
            // else about them is ignored here.
            const baseChanges: EdgeChange[] = [];
            for (const ch of changes) {
                const id = (ch as any).id as string | undefined;
                if (id && id.startsWith('irobj_')) {
                    if (ch.type === 'select') setSyntheticEdgeSelected(id, (ch as any).selected);
                    continue;
                }
                baseChanges.push(ch);
            }
            if (baseChanges.length === 0) return;
            setEdgesRaw((currentEdges) => {
                const updated = applyEdgeChanges(baseChanges, currentEdges);
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
    // Re-run auto-layout ONCE when the asynchronously-materialized M1 edges arrive after
    // the first (edge-less) layout. Set below; armed only on the justCreated path. See
    // docs/discovery/2026-07-07-s4b-recalc-bypass.md (H2).
    const armReLayoutRef = useRef<(() => void) | null>(null);
    const { isJjomMode, graphId, justCreatedGraphRef } = useJjomSync(modelid, setNodes, setEdges, () => {
        // Delay slightly so RF has measured nodes before fitting
        setTimeout(async () => {
            // If the graph was just auto-created, apply ELK layout first
            if (justCreatedGraphRef.current) {
                justCreatedGraphRef.current = false;
                if (autoLayoutRef.current) {
                    await autoLayoutRef.current();
                    // The M1 reference edges materialize asynchronously AFTER this first
                    // layout; watch for them and re-run the layout once when they land.
                    armReLayoutRef.current?.();
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
    useM1ReferenceEdges(modelid, graphId);

    // Debounced autosave of node positions on drag-end (gated by autosaveLayout)
    const { scheduleLayoutSave } = useLayoutAutosave();

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

    // ─── Highlight mode (figure authoring) ──────────────────────────
    // Mode on/off: effimero+globale, mirror del toggle in Navbar (View menu).
    // Tagging multi-colore manuale: mappa id->colore (1..5) persistita in
    // localStorage keyed per modello; NON viaggia col file di progetto. Click su
    // nodo o edge assegna il colore attivo (stesso colore = rimuove). La
    // colorazione è render-time via HighlightContext (no patch node.data/edge.data,
    // no modifiche al transform). Il colore attivo si sceglie dalla palette in toolbar.
    const [highlightModeActive, setHighlightModeActive] = useState<boolean>(() => {
        try { return localStorage.getItem('jjodel.highlightMode') === 'true'; } catch { return false; }
    });
    const [highlightColors, setHighlightColors] = useState<Record<string, number>>(() => {
        try { return JSON.parse(localStorage.getItem(`jjodel.highlight.${modelid}`) || '{}'); }
        catch { return {}; }
    });
    const [activeHighlightColor, setActiveHighlightColor] = useState<number>(1);
    const activeColorRef = useRef(activeHighlightColor);
    useEffect(() => { activeColorRef.current = activeHighlightColor; }, [activeHighlightColor]);
    useEffect(() => {
        try { localStorage.setItem(`jjodel.highlight.${modelid}`, JSON.stringify(highlightColors)); } catch {}
    }, [highlightColors, modelid]);
    useEffect(() => {
        const onToggleHL = (e: Event) => setHighlightModeActive(!!(e as CustomEvent).detail?.active);
        window.addEventListener(JjodelEvents.TOGGLE_HIGHLIGHT_MODE, onToggleHL);
        return () => window.removeEventListener(JjodelEvents.TOGGLE_HIGHLIGHT_MODE, onToggleHL);
    }, []);
    const assignHighlight = useCallback((id: string) => {
        setHighlightColors(prev => {
            const next = { ...prev };
            if (next[id] === activeColorRef.current) delete next[id];
            else next[id] = activeColorRef.current;
            return next;
        });
    }, []);
    const clearHighlights = useCallback(() => setHighlightColors({}), []);
    const highlightState = useMemo<HighlightState>(
        () => ({ active: highlightModeActive, colorById: highlightColors }),
        [highlightModeActive, highlightColors],
    );

    // Selection sync: standalone hook — updates Properties panel via _lastSelected
    const jjomSelection = useJjomSelection(modelid, isJjomMode, highlightModeActive, assignHighlight);

    const { screenToFlowPosition, getNodes, getEdges, zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
    const updateNodeInternals = useUpdateNodeInternals();
    const storeApi = useStoreApi();
    fitViewRef.current = () => fitView({ padding: fitPadding(), maxZoom: 1 });

    const {
        activeEditorId,
        setActive,
        registerZoomController,
        unregisterZoomController,
        getActiveZoomController,
    } = useActiveEditor();
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    // ─── View toggles — mirror state ────────────────────────────────
    // Source of truth lives in Navbar.tsx (View menu). EditorV2 mirrors
    // the values for wrapper-class application; Navbar dispatches a
    // CustomEvent on each toggle, EditorV2 listens and updates its mirror.
    const [gridVisible, setGridVisible] = useState(() => {
        try { return localStorage.getItem('jjodel.showGrid') !== 'false'; } catch { return true; }
    });
    const [showEdgeLabels, setShowEdgeLabels] = useState(() => {
        try { return localStorage.getItem('jjodel.showEdgeLabels') === 'true'; } catch { return false; }
    });
    const [showBackground, setShowBackground] = useState(() => {
        try { return localStorage.getItem('jjodel.showBackground') !== 'false'; } catch { return true; }
    });
    useEffect(() => {
        const handleGrid = (e: Event) => setGridVisible(!!(e as CustomEvent).detail?.show);
        const handleEdgeLabels = (e: Event) => setShowEdgeLabels(!!(e as CustomEvent).detail?.show);
        const handleBackground = (e: Event) => setShowBackground(!!(e as CustomEvent).detail?.show);
        window.addEventListener(JjodelEvents.TOGGLE_GRID, handleGrid);
        window.addEventListener(JjodelEvents.TOGGLE_EDGE_LABELS, handleEdgeLabels);
        window.addEventListener(JjodelEvents.TOGGLE_BACKGROUND, handleBackground);
        return () => {
            window.removeEventListener(JjodelEvents.TOGGLE_GRID, handleGrid);
            window.removeEventListener(JjodelEvents.TOGGLE_EDGE_LABELS, handleEdgeLabels);
            window.removeEventListener(JjodelEvents.TOGGLE_BACKGROUND, handleBackground);
        };
    }, []);

    // Bottom drawer removed — properties editing handled by right-side dock Info panel
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
                    // Pass undefined so DObject.new owns the name (defaultname
                    // "<ClassName>_<N>") → data.name === initialName. Read it back for
                    // the node label (see discovery §11/§12).
                    const vertexId = syncCreateObject(graphId, metaclassId, nextX, startY);
                    if (vertexId) {
                        markDropCreated(vertexId);
                        const createdName = (LPointerTargetable.fromPointer(vertexId) as any)?.model?.name ?? className;
                        const newNode: Node = {
                            id: vertexId,
                            type: 'objectNode',
                            position: { x: nextX, y: startY },
                            data: {
                                label: createdName,
                                instanceOfClassName: className,
                                instanceOfClassId: metaclassId,
                                features: [],
                            } as ObjectNodeData,
                        };
                        setNodes(nds => [...nds, newNode]);
                        nextX += 220;
                    }
                }
                // console.log(`[singleton] shown ${singletonClassIds.size} singleton class(es) for model ${modelid}`);
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
                // console.log(`[singleton] hidden ${vertexIdsToHide.length} singleton node(s) for model ${modelid}`);
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

        window.addEventListener(JjodelEvents.TOGGLE_SINGLETONS, handleToggleSingletons);
        return () => {
            window.removeEventListener(JjodelEvents.TOGGLE_SINGLETONS, handleToggleSingletons);
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

    // Rate limiter for dimension changes: breaks infinite loops where
    // dimensions oscillate by >0.5px between cycles (e.g. ErrorDisplay
    // badge, font loading, CSS transitions).  Max 3 dimension changes
    // per node per 500ms; subsequent ones are dropped.
    const dimRateLimitRef = useRef<Map<string, { count: number; start: number }>>(new Map());

    // Edge type popup: pending connection waiting for user to pick edge type
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
    const pendingConnectionRef = useRef<Connection | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // M1 reference popup: pending connection waiting for user to pick reference
    const [pendingM1Connection, setPendingM1Connection] = useState<{
        connection: Connection;
        position: { x: number; y: number };
        compatibleRefs: CompatibleReference[];
        /** IR connect rules applicable to this pair (object-as-edge creation entries). */
        objectEdgeMatches?: IRConnectRuleMatch[];
    } | null>(null);
    const handleM1ReferenceSelectedRef = useRef<(ref: MetaclassReference, conn?: Connection) => void>(() => {});
    const handleObjectEdgeSelectedRef = useRef<(match: IRConnectRuleMatch, conn?: Connection) => void>(() => {});
    // Mirror of the IR interaction plan for stable-dep callbacks (same pattern as modeInfoRef).
    const irPlanRef = useRef<IRInteractionPlan | null>(null);

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

    // User-created (seed-driven) palettes — declared above colorScheme so the
    // colorScheme initializer below can validate a persisted custom id.
    const [customPalettes, setCustomPalettes] = useState<CustomColorScheme[]>(() => {
        try {
            const raw = localStorage.getItem('jjodel.customPalettes');
            const parsed = raw ? JSON.parse(raw) : [];
            return Array.isArray(parsed) ? parsed : [];
        } catch { return []; }
    });

    useEffect(() => {
        try { localStorage.setItem('jjodel.customPalettes', JSON.stringify(customPalettes)); } catch { /* quota / private mode */ }
    }, [customPalettes]);

    // Inject the runtime <style> for the custom palettes (built-ins are static SCSS).
    useCustomPaletteStyleSheet(customPalettes);

    // Color scheme state with localStorage persistence
    const VALID_SCHEMES: ColorScheme[] = ['default', 'monochrome', 'sapphire', 'amethyst', 'jade', 'terracotta', 'crimson', 'high-contrast', 'print'];
    const [colorScheme, setColorScheme] = useState<ActiveColorScheme>(() => {
        const saved = localStorage.getItem('editor-v2-color-scheme');
        if (!saved) return 'default';
        const isBuiltIn = VALID_SCHEMES.includes(saved as ColorScheme);
        const isCustom = customPalettes.some(p => p.id === saved);
        return isBuiltIn || isCustom ? saved : 'default';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-color-scheme', colorScheme);
    }, [colorScheme]);

    // Create a seed-driven palette and immediately activate it.
    const handleCreateCustomPalette = useCallback((name: string, seed: string) => {
        const uuid = (typeof crypto !== 'undefined' && crypto.randomUUID)
            ? crypto.randomUUID()
            : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
        const id = `custom-${uuid}`;
        setCustomPalettes(prev => [...prev, { id, name, seed }]);
        setColorScheme(id);
    }, []);

    // Rename a custom palette (name only — id/seed unchanged, so colors and the
    // active scheme are unaffected). Persistence runs through the existing effect.
    const handleRenameCustomPalette = useCallback((id: string, name: string) => {
        setCustomPalettes(prev => prev.map(p => (p.id === id ? { ...p, name } : p)));
    }, []);

    // Delete a custom palette; if it was the active scheme, fall back to default.
    const handleDeleteCustomPalette = useCallback((id: string) => {
        setCustomPalettes(prev => prev.filter(p => p.id !== id));
        setColorScheme(prev => (prev === id ? 'default' : prev));
    }, []);

    // Block native text selection on the canvas. CSS `user-select: none` is
    // not enough — the browser ignores it once a drag is already in flight,
    // so dragging from a node to draw an edge would still highlight the
    // node's text. Inputs/textareas/contenteditable opt out so inline
    // editing keeps working. Re-runs on mode change because the canvas div
    // (and its ref) is unmounted in `classic` mode.
    useEffect(() => {
        const container = editorContainerRef.current;
        if (!container) return;
        const onSelectStart = (e: Event) => {
            const t = e.target as HTMLElement | null;
            if (!t) return;
            if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
            e.preventDefault();
        };
        container.addEventListener('selectstart', onSelectStart);
        return () => container.removeEventListener('selectstart', onSelectStart);
    }, [editorMode]);

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
                // F3: subtract the overlay's right inset so "one third from the left"
                // is measured against the VISIBLE canvas width, not the full window.
                setViewport({ x: -x * vp.zoom + (window.innerWidth - getCanvasRightInset()) / 3, y: -y * vp.zoom + window.innerHeight / 3, zoom: vp.zoom }, { duration: 300 });
            }
        };
        window.addEventListener(JjodelEvents.SELECT_NODE, handleSelectNode);
        return () => window.removeEventListener(JjodelEvents.SELECT_NODE, handleSelectNode);
    }, [modelid, setNodes, setEdges, getNodes, getViewport, setViewport]);

    // Polymetric view modal (triggered via Tools menu CustomEvent)
    const [polymetricOpen, setPolymetricOpen] = useState(false);

    useEffect(() => {
        const handlePolymetric = () => {
            if (modelid) setPolymetricOpen(true);
        };
        window.addEventListener(JjodelEvents.OPEN_POLYMETRIC, handlePolymetric);
        return () => window.removeEventListener(JjodelEvents.OPEN_POLYMETRIC, handlePolymetric);
    }, [modelid]);

    // History for undo/redo
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(getNodes, getEdges);
    // Force re-render to update canUndo/canRedo
    const [, forceUpdate] = useState({});

    // ── D-layer undo/redo in JjOM mode (R-UNDO-1) ────────────────────────
    // In JjOM mode editor-v2 runs NO history of its own: Cmd+Z is swallowed by
    // Navbar, which listens in the CAPTURE phase on `window` (Navbar.tsx:1278-1279)
    // and calls stopImmediatePropagation for 'Z' (Navbar.tsx:962-964) before any
    // context logic, so the onKeyDown below never fires for it and the keystroke
    // becomes an UndoAction on the D-layer. A session history would therefore be a
    // second, divergent undo that the keyboard never reaches. The toolbar buttons
    // drive the same D-layer stack instead. `useHistory` above stays in force for
    // non-JjOM mode, untouched.

    // `U.userHasInteracted` gates the D-layer undo (isRelevantChangeCheck, reducer.ts:1277).
    // The 2026-08-24 kill-switch was retired after the runtime measurement of addendum §8 in docs/discovery/discovery_2026-08-24_undo_reducer_rename.md.
    // Raising it on the first pointerdown/keydown on the panel keeps the programmatic boot writes (ELK auto-layout, deferred re-layout) out of the undo stack.
    const markUserInteracted = useCallback(() => {
        if (!U.userHasInteracted) U.userHasInteracted = true;
    }, []);

    // `statehistory` is a module singleton, not part of the Redux state, so it cannot
    // be selected in the ordinary sense. It can be SAMPLED: a useSelector body runs on
    // every store notification, and UndoAction/RedoAction go through the store, so this
    // is a read-after-dispatch. Format "undoable:redoable".
    const dHistorySig = useSelector(() => {
        const h = (statehistory as any)[DUser.current];
        return `${h?.undoable?.length ?? 0}:${h?.redoable?.length ?? 0}`;
    });
    const [dUndoLen, dRedoLen] = dHistorySig.split(':').map(Number);

    // Persistence after an undo/redo. The Navbar path does not call scheduleLayoutSave,
    // and doUndoRedo cannot be observed through the state: the branch that would write
    // `action_title = 'undone N steps'` is commented out (reducer.ts:1139-1146). What is
    // observable is the stack itself. An ordinary action only ever GROWS `undoable` and
    // never touches `redoable`; an undo pops `undoable` and pushes `redoable`, a redo the
    // mirror. So "either length decreased" fires on undo/redo and on nothing else.
    const prevHistLenRef = useRef<{ u: number; r: number } | null>(null);
    useEffect(() => {
        const prev = prevHistLenRef.current;
        prevHistLenRef.current = { u: dUndoLen, r: dRedoLen };
        if (!prev) return; // first render: nothing happened yet
        if (dUndoLen < prev.u || dRedoLen < prev.r) scheduleLayoutSave();
    }, [dUndoLen, dRedoLen, scheduleLayoutSave]);

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

    // Propagate the selected instance's size to all instances of an IR view.
    // Fired by the "Propaga dimensione" button in VertexAuthoringPanel (which only
    // knows view.id, not the canvas): source and targets are resolved here.
    // Object nodes do NOT read w/h back from the DVertex (discovery 2026-07-27), so
    // the size is applied to the live RF nodes; syncSizeBatchToJjom persists it in
    // the D-layer for edge geometry and parity with manual resize.
    useEffect(() => {
        const handlePropagateSize = (event: Event) => {
            const { viewId } = (event as CustomEvent).detail || {};
            if (!viewId) return;

            const state: any = store.getState();
            const lookup = state.idlookup;
            const index = getIRIndex(state, computeIRSignature(state));
            if (!index || !lookup) return;
            const readCtx = makeReadCtx(lookup);

            const resolvesToView = (n: Node): boolean => {
                if (n.type !== 'objectNode') return false;
                const objectId = lookup?.[n.id]?.model;
                const classId = (n.data as any)?.instanceOfClassId;
                if (typeof objectId !== 'string' || !classId) return false;
                return resolveIRView(objectId, classId, index, readCtx, lookup)?.viewId === viewId;
            };

            // Targets = every object node resolving to this view. None → the view is
            // not rendered in this editor, stay silent (no spurious cross-editor warn).
            const targets = getNodes().filter(resolvesToView);
            if (targets.length === 0) return;

            // Source = the single SELECTED instance of this view. 0 or >1 → no-op + warn.
            const sources = targets.filter(n => n.selected);
            if (sources.length !== 1) {
                toast.warning('Select exactly one instance of this view as the size source.');
                return;
            }
            const src = sources[0];
            const w = src.measured?.width ?? (src as any).width;
            const h = src.measured?.height ?? (src as any).height;
            if (w == null || h == null) {
                toast.warning('The source size is not available.');
                return;
            }

            const targetIds = new Set(targets.map(n => n.id));
            takeSnapshot();
            // In-session render: size applied top-level on the RF node (measured reset
            // forces re-measure), the same channel the NodeResizer uses.
            setNodes(nds => nds.map(n =>
                targetIds.has(n.id) ? { ...n, width: w, height: h, measured: undefined } : n
            ));
            // D-layer persistence (single TRANSACTION).
            syncSizeBatchToJjom([...targetIds].map(id => ({ vertexId: id, w, h })));
            scheduleLayoutSave();
        };
        window.addEventListener(JjodelEvents.PROPAGATE_VIEW_SIZE, handlePropagateSize);
        return () => window.removeEventListener(JjodelEvents.PROPAGATE_VIEW_SIZE, handlePropagateSize);
    }, [getNodes, setNodes, scheduleLayoutSave, takeSnapshot]);


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

        const handleIdx = (h?: string | null): number => {
            const m = h?.match(/-(\d+)$/);
            return m ? parseInt(m[1], 10) : 0;
        };

        // Only reference edges draw a cardinality and a (non-hover) role. The
        // composition/instanceRef types are M1 (no cardinality); M2 containments are
        // themselves reference edges with kind='composition'. See 2c discovery.
        const CARD_TYPES = new Set(['reference']);
        const ROLE_TYPES = new Set(['reference']);

        // (A) Cardinality depth stagger — grouped by (target node, target side).
        const cardGroups = new Map<string, string[]>();
        for (const edge of edgeList) {
            if (!CARD_TYPES.has(edge.type ?? '')) continue;
            const th = edgeHandles.get(edge.id)?.targetHandle ?? edge.targetHandle ?? null;
            if (!th) continue;
            const key = `${edge.target}:${getSideFromHandle(th)}`;
            if (!cardGroups.has(key)) cardGroups.set(key, []);
            cardGroups.get(key)!.push(edge.id);
        }
        const cardShift = new Map<string, number>();
        for (const ids of cardGroups.values()) {
            if (ids.length < 2) continue; // single cardinality: no stagger
            ids.sort((a, b) =>
                handleIdx(edgeHandles.get(a)?.targetHandle) - handleIdx(edgeHandles.get(b)?.targetHandle));
            ids.forEach((id, i) => cardShift.set(id, i * CARD_STAGGER_STEP));
        }

        // (B) Role arc-slide — grouped by unordered {source, target} pair (bundles).
        const pairKey = (e: { source: string; target: string }): string =>
            e.source < e.target ? `${e.source}|${e.target}` : `${e.target}|${e.source}`;
        const roleGroups = new Map<string, string[]>();
        for (const edge of edgeList) {
            if (!ROLE_TYPES.has(edge.type ?? '')) continue;
            const key = pairKey(edge);
            if (!roleGroups.has(key)) roleGroups.set(key, []);
            roleGroups.get(key)!.push(edge.id);
        }
        const roleShift = new Map<string, number>();
        for (const ids of roleGroups.values()) {
            if (ids.length < 2) continue; // lone edge: midpoint unchanged
            ids.sort(); // deterministic by edge id
            const center = (ids.length - 1) / 2;
            ids.forEach((id, i) => roleShift.set(id, (i - center) * ROLE_ARC_STEP));
        }

        return edgeList.map(edge => {
            const distributed = edgeHandles.get(edge.id);
            const cShift = cardShift.get(edge.id) ?? 0;
            const rShift = roleShift.get(edge.id) ?? 0;
            const handlesChanged = !!distributed &&
                (edge.sourceHandle !== distributed.sourceHandle ||
                 edge.targetHandle !== distributed.targetHandle);
            const data = edge.data as { cardinalityShift?: number; roleArcShift?: number } | undefined;
            const cChanged = (data?.cardinalityShift ?? 0) !== cShift;
            const rChanged = (data?.roleArcShift ?? 0) !== rShift;
            if (!handlesChanged && !cChanged && !rChanged) return edge; // preserve identity → no re-render
            return {
                ...edge,
                ...(distributed
                    ? { sourceHandle: distributed.sourceHandle, targetHandle: distributed.targetHandle }
                    : {}),
                data: { ...edge.data, cardinalityShift: cShift, roleArcShift: rShift },
            };
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
                // One DOM pass for all nodes instead of one full-DOM
                // querySelector per node (leva 4, micro-fix).
                const elementsById = new Map<string, Element>();
                domNode.querySelectorAll('.react-flow__node').forEach((el: Element) => {
                    const did = el.getAttribute('data-id');
                    if (did) elementsById.set(did, el);
                });
                const updates = new Map();
                for (const nodeId of nodeIdList) {
                    const nodeElement = elementsById.get(nodeId);
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

    // Canonical selection channel — `_lastSelected.modelElement` is written by both
    // flow (`useJjomSelection.selectElement`) and classic (`graphElement.select` /
    // `onMouseDown`). Used to drive PalettePanel's context-aware sections so the
    // palette reacts to selection from either editor. React Flow's `n.selected`
    // (above) only tracks flow-initiated selection and is unsuitable for this.
    const lastSelectedModelElement = useSelector((s: DState) =>
        (s as any)._lastSelected?.modelElement as string | undefined
    );

    // ── Reference stabilizer for ReactFlow props ─────────────────────
    // StoreUpdater compares nodes/edges by REFERENCE. If the reference
    // changes (even with identical content), it calls setNodes() → re-render
    // → new reference → infinite loop. The Jjodel action system dispatches
    // via setTimeout (action.ts:349) causing updates outside React's batch,
    // which can create reference-only changes.
    //
    // This guard returns the SAME array reference when the structural
    // content hasn't changed, breaking the StoreUpdater feedback loop.
    const stableNodesRef = useRef<Node[]>([]);
    const stableEdgesRef = useRef<Edge[]>([]);

    const stableNodes = useMemo(() => {
        const prev = stableNodesRef.current;
        if (prev.length !== nodes.length) { stableNodesRef.current = nodes; return nodes; }
        for (let i = 0; i < nodes.length; i++) {
            const p = prev[i], n = nodes[i];
            if (p === n) continue; // same object — fast path
            if (p.id !== n.id
                || p.type !== n.type
                || p.data !== n.data
                || p.selected !== n.selected
                || p.dragging !== n.dragging
                || p.hidden !== n.hidden
                || Math.abs((p.position?.x ?? 0) - (n.position?.x ?? 0)) > 0.1
                || Math.abs((p.position?.y ?? 0) - (n.position?.y ?? 0)) > 0.1
                || (p.measured?.width ?? 0) !== (n.measured?.width ?? 0)
                || (p.measured?.height ?? 0) !== (n.measured?.height ?? 0)
            ) {
                stableNodesRef.current = nodes;
                return nodes;
            }
        }
        return prev; // structurally identical → return SAME reference
    }, [nodes]);

    const stableEdges = useMemo(() => {
        const prev = stableEdgesRef.current;
        if (prev.length !== edges.length) { stableEdgesRef.current = edges; return edges; }
        for (let i = 0; i < edges.length; i++) {
            const p = prev[i], e = edges[i];
            if (p === e) continue;
            if (p.id !== e.id
                || p.source !== e.source
                || p.target !== e.target
                || p.sourceHandle !== e.sourceHandle
                || p.targetHandle !== e.targetHandle
                || p.type !== e.type
                || p.data !== e.data
                || p.selected !== e.selected
                || p.hidden !== e.hidden
            ) {
                stableEdgesRef.current = edges;
                return edges;
            }
        }
        return prev;
    }, [edges]);

    // IR containment decoration (Fase 2b): hidden subtrees + lifted edges when
    // the active viewpoint has IR graphVertex views. Pass-through (same array
    // references) otherwise — zero cost for non-IR sessions.
    const irContainment = useIRContainment(stableNodes, stableEdges);

    // Persist the merged session override of a synthetic edge on the hidden
    // edge-object's DVertex (gesture end; ghostOffsets pattern, discovery
    // 2026-07-19). Skipped when the resolved view opts out via persistWaypoints.
    const persistIREdgeLayout = useCallback((objectId: string) => {
        const merged = getIREdgeAnchorOverride(objectId);
        if (!merged) return;
        const layout = irEdgeLayoutFromOverride(merged);
        if (!layout || !isIREdgeLayoutPersistable(objectId)) return;
        const vertexId = irVertexIdForObject(graphId, objectId);
        if (!vertexId) return;
        syncIREdgeLayoutToJjom(vertexId, layout);
        scheduleLayoutSave();
    }, [graphId, scheduleLayoutSave]);

    // One-time hydration of the IR session stores from the persisted DVertex
    // fields (discovery 2026-07-19 §5). Deferred until an IR viewpoint is
    // active (the persistWaypoints gate needs the resolved index; without an IR
    // viewpoint the overrides are unused anyway). Session wins: only missing
    // keys are seeded, and the per-graph guard prevents any re-seed.
    useEffect(() => {
        if (!graphId || irLayoutHydratedGraphs.has(graphId)) return;
        const state: any = store.getState();
        if (!computeIRSignature(state)) return;
        irLayoutHydratedGraphs.add(graphId);
        const lookup = state.idlookup ?? {};
        const subs: string[] = lookup[graphId]?.subElements ?? [];
        const layoutEntries: Array<[string, IRAnchorOverride]> = [];
        const collapsedIds: string[] = [];
        for (const vid of subs) {
            const v = lookup[vid];
            if (!v || v.className !== 'DVertex' || typeof v.model !== 'string') continue;
            if (v.irEdgeLayout && isIREdgeLayoutPersistable(v.model, state)) {
                layoutEntries.push([v.model, {
                    sourceSide: v.irEdgeLayout.sourceSide,
                    targetSide: v.irEdgeLayout.targetSide,
                    waypoints: v.irEdgeLayout.waypoints,
                }]);
            }
            if (v.irCollapsed === true) collapsedIds.push(v.model);
        }
        if (layoutEntries.length) hydrateIREdgeAnchorOverrides(layoutEntries);
        if (collapsedIds.length) hydrateCollapsed(collapsedIds);
    }, [graphId, irContainment]);

    // IR-derived interaction plan (Fase 3): restricts the M1 palette to the
    // metaclasses the active IR viewpoint declares views for. Null = no IR
    // viewpoint → unrestricted palette (current behavior).
    const irInteractionPlan = useIRInteractionPlan();
    irPlanRef.current = irInteractionPlan;

    // Palette intersection with the rootable classes, with normative fallback
    // (spec v1.2 sez. 6): empty intersection → full palette + notice.
    // With an IR plan declaring drop containers, the candidate list also
    // includes the concrete metaclasses droppable inside them (decision D4,
    // discovery 2026-07-20): contained-only classes get a palette entry whose
    // drop is gated to compatible containers by onDrop/onDragOver.
    const irPalette = useMemo(() => {
        let candidates = modeInfo.rootableClasses;
        if (irInteractionPlan && irInteractionPlan.dropContainers.length > 0 && modeInfo.mode === 'model') {
            const droppable = deriveDroppableChildMetaclasses(irInteractionPlan, modeInfo.allClasses);
            if (droppable.size > 0) {
                const present = new Set(candidates.map(c => c.id));
                const extra = modeInfo.allClasses.filter(
                    c => !present.has(c.id) && !c.isAbstract && droppable.has(c.name),
                );
                if (extra.length > 0) candidates = [...candidates, ...extra];
            }
        }
        return applyIRPaletteFilter(candidates, irInteractionPlan);
    }, [modeInfo.rootableClasses, modeInfo.allClasses, modeInfo.mode, irInteractionPlan]);

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

            // If onConnect never fired, connection will be null here (drop on empty canvas).
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
                    const targetMetaclass = mi.allClasses.find(c => c.id === targetData.instanceOfClassId);

                    if (sourceMetaclass) {
                        const compatibleRefs = getCompatibleReferences(
                            sourceMetaclass,
                            targetData.instanceOfClassId,
                            mi.allClasses,
                        );

                        // IR connect rules applicable to this metaclass pair
                        // (object-as-edge creation; wiring cantiere 2026-07-20).
                        const connectMatches = matchConnectRules(
                            irPlanRef.current,
                            sourceData.instanceOfClassId,
                            targetData.instanceOfClassId,
                            mi.allClasses,
                        );

                        if (compatibleRefs.length === 0 && connectMatches.length === 0) {
                            return; // no compatible refs — ignore
                        }

                        if (compatibleRefs.length === 1 && connectMatches.length === 0) {
                            // Auto-select: skip popup, create edge directly
                            handleM1ReferenceSelectedRef.current(compatibleRefs[0].ref, connection);
                            return;
                        }

                        if (compatibleRefs.length === 0 && connectMatches.length === 1) {
                            // Auto-create: single applicable IR rule, no direct reference
                            handleObjectEdgeSelectedRef.current(connectMatches[0], connection);
                            return;
                        }

                        // Multiple options: show picker popup (references + IR object-as-edge entries)
                        setPendingM1Connection({
                            connection,
                            position: { x: clientX, y: clientY },
                            compatibleRefs,
                            objectEdgeMatches: connectMatches,
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

    // Create an object-as-edge instance from the connect gesture (IR connect
    // rule; wiring cantiere 2026-07-20). Sequence per discovery
    // 2026-07-20_wiring_connect_containment_ir: create the edge-object, write
    // both endpoint slots through the canonical write path, THEN add the RF
    // node — at its first render the IR decoration already resolves the
    // endpoints, hides the vertex and synthesizes the edge (no fallback flash).
    const handleObjectEdgeSelected = useCallback(
        (match: IRConnectRuleMatch, connectionOverride?: Connection) => {
            const conn = connectionOverride ?? pendingM1Connection?.connection;
            setPendingM1Connection(null);
            if (!conn || !conn.source || !conn.target || !graphId) return;

            // Endpoint DObject ids from the vertex ids (same resolution as guardLink prep)
            const srcObjectId: string | undefined = (LPointerTargetable.fromPointer(conn.source) as any)?.model?.id;
            const tgtObjectId: string | undefined = (LPointerTargetable.fromPointer(conn.target) as any)?.model?.id;
            if (!srcObjectId || !tgtObjectId) return;

            takeSnapshot();

            // Hidden vertex position: midpoint between the two endpoint nodes
            const currentNodes = getNodes();
            const sn = currentNodes.find(n => n.id === conn.source);
            const tn = currentNodes.find(n => n.id === conn.target);
            const midX = ((sn?.position.x ?? 0) + (tn?.position.x ?? 0)) / 2;
            const midY = ((sn?.position.y ?? 0) + (tn?.position.y ?? 0)) / 2;

            const vertexId = syncCreateObject(graphId, match.edgeClass.id, midX, midY);
            if (!vertexId) {
                console.warn('[EditorV2] Failed to create object-as-edge instance');
                return;
            }
            markDropCreated(vertexId);

            // The creation TRANSACTION commits in a microtask (CLAUDE.md §9.2):
            // the endpoint slot proxies are not writable synchronously here
            // (verified E2E 2026-07-20). Defer the slot writes until the slots
            // resolve (bounded retry), then add the RF node LAST so its first
            // render already synthesizes the edge (no fallback flash).
            // Write shape: `.values = [...meaningful, id]` like
            // syncCreateReferenceLink — on an EMPTY reference slot `.value =`
            // is a silent no-op (verified with an in-browser probe 2026-07-20).
            const writeSlot = (lObject: any, featName: string, objId: string) => {
                const slot = lObject['$' + featName];
                if (!slot) return;
                const meaningful = (slot.__raw?.values ?? []).filter((v: any) => v != null && v !== '');
                slot.values = [...meaningful, objId];
            };
            const writeSlotsAndMount = (attempt: number) => {
                const lObject = (LPointerTargetable.fromPointer(vertexId) as any)?.model;
                const ready = lObject
                    && (lObject as any)['$' + match.sourceRef.name]
                    && (lObject as any)['$' + match.targetRef.name];
                if (!ready) {
                    if (attempt < 40) setTimeout(() => writeSlotsAndMount(attempt + 1), 25);
                    else console.warn('[EditorV2] object-as-edge: endpoint slots unavailable, node left as fallback');
                    if (attempt < 40) return;
                } else {
                    writeSlot(lObject, match.sourceRef.name, srcObjectId);
                    writeSlot(lObject, match.targetRef.name, tgtObjectId);
                }
                const createdName = (LPointerTargetable.fromPointer(vertexId) as any)?.model?.name ?? match.edgeClass.name;
                const newNode: Node = {
                    id: vertexId,
                    type: 'objectNode',
                    position: { x: midX, y: midY },
                    data: {
                        label: createdName,
                        instanceOfClassName: match.edgeClass.name,
                        instanceOfClassId: match.edgeClass.id,
                        features: [],
                    } as ObjectNodeData,
                };
                setNodes(nds => nds.some(n => n.id === vertexId) ? nds : [...nds, newNode]);
            };
            setTimeout(() => writeSlotsAndMount(0), 0);
        },
        [pendingM1Connection, graphId, getNodes, setNodes, takeSnapshot]
    );
    handleObjectEdgeSelectedRef.current = handleObjectEdgeSelected;

    // IR containment drop (wiring cantiere 2026-07-20): pending drop waiting
    // for the user to pick one of several compatible composition references.
    const [pendingContainmentDrop, setPendingContainmentDrop] = useState<{
        position: { x: number; y: number };
        flowPosition: { x: number; y: number };
        containerNodeId: string;
        childClass: MetaclassInfo;
        compatibleRefs: CompatibleReference[];
    } | null>(null);

    // Hit-test: smallest visible IR drop-container node whose bbox contains the
    // flow position. Hulls are pointer-transparent and drawn only when children
    // exist (discovery 2026-07-20 B1): the reliable target is the container
    // node's bbox. Collapsed containers are not targets in v1 (decision D3).
    const findIRDropContainerAt = useCallback((flowPos: { x: number; y: number }): Node | null => {
        const plan = irPlanRef.current;
        if (!plan || plan.dropContainers.length === 0) return null;
        const lookup = (store.getState() as any).idlookup ?? {};
        let best: Node | null = null;
        let bestArea = Infinity;
        for (const n of getNodes()) {
            if (n.type !== 'objectNode' || n.hidden) continue;
            const data = n.data as ObjectNodeData;
            if (!plan.dropContainers.includes(data.instanceOfClassName)) continue;
            const w = (n.measured?.width ?? n.width ?? 160) as number;
            const h = (n.measured?.height ?? n.height ?? 60) as number;
            if (flowPos.x < n.position.x || flowPos.x > n.position.x + w) continue;
            if (flowPos.y < n.position.y || flowPos.y > n.position.y + h) continue;
            const objectId = lookup[n.id]?.model;
            if (typeof objectId === 'string' && isCollapsed(objectId)) continue;
            const area = w * h;
            if (area < bestArea) { best = n; bestArea = area; }
        }
        return best;
    }, [getNodes]);

    // Handle edge reconnection (drag endpoint to a new target/source)
    const handleReconnect = useCallback(
        (oldEdge: Edge, newConnection: Connection) => {
            // Synthetic IR edge (object-as-edge): the gesture edits the edge-object.
            // - endpoint moved to another node → rewrite the src/tgt reference slot
            //   through the L proxy (canonical write path, same family as the
            //   Properties panel); the slots-snapshot subscription re-routes.
            // - same nodes, different handle → session anchor override.
            if ((oldEdge.data as any)?.irObjectAsEdge) {
                const objectId = (oldEdge.data as any).irObjectId as string;
                try {
                    const sourceMoved = newConnection.source !== oldEdge.source;
                    const targetMoved = newConnection.target !== oldEdge.target;
                    if (sourceMoved || targetMoved) {
                        const movedEnd: 'source' | 'target' = sourceMoved ? 'source' : 'target';
                        const newVertexId = movedEnd === 'source' ? newConnection.source : newConnection.target;
                        if (!newVertexId) return;
                        const featName = movedEnd === 'source'
                            ? (oldEdge.data as any).irSourceFeature
                            : (oldEdge.data as any).irTargetFeature;
                        // No feature on that end = a `container` endpoint (R-B13): there
                        // is no slot to rewrite, and re-parenting is not what this gesture
                        // does (R-B16, connect rule off on that end). The model write is
                        // skipped — the anchor override below is NOT: aborting the whole
                        // callback here dropped the side pin along with the write, which
                        // is the only half of the gesture that end can still carry.
                        if (featName) {
                            const droppedVertex: any = LPointerTargetable.fromPointer(newVertexId);
                            const newObjId: string | undefined = droppedVertex?.model?.id;
                            if (!newObjId) return;
                            const rawObj = (store.getState() as any).idlookup[newObjId];
                            if (!rawObj || rawObj.className !== 'DObject') return;   // only M1 objects
                            const lObj: any = LPointerTargetable.fromPointer(objectId);
                            const slot = lObj?.['$' + featName];
                            if (!slot) return;
                            slot.value = newObjId;
                        }
                    }
                    setIREdgeAnchorOverride(objectId, {
                        sourceHandle: newConnection.sourceHandle ?? undefined,
                        targetHandle: newConnection.targetHandle ?? undefined,
                    });
                    persistIREdgeLayout(objectId);
                } catch (err) {
                    console.warn('[ir object-as-edge] reconnect aborted', err);
                }
                return;
            }

            // Re-target di una reference M2: cambia DReference.type alla nuova classe.
            // Stessa mutazione del property panel (lRef.type = classId); il sync re-instrada.
            // Non muta gli edge ReactFlow.

            if (oldEdge.type !== 'reference') return;            // solo reference M2
            if (!newConnection.target) return;                   // serve un target
            if (newConnection.source !== oldEdge.source) return; // solo il capo target si muove
            if (newConnection.target === oldEdge.target) return; // no-op se invariato

            try {
                // DReference dall'edge: canale primario jjomRefId, fallback registry
                const refId = (oldEdge.data as any)?.jjomRefId ?? getEdgeRefId(oldEdge.id);
                if (!refId) return;
                const lRef: any = LPointerTargetable.fromPointer(refId);
                if (!lRef) return;

                // Nuova classe dal vertice droppato (newConnection.target è un VERTEX id)
                const targetVertex: any = LPointerTargetable.fromPointer(newConnection.target);
                const newClassId: string | undefined = targetVertex?.model?.id;
                if (!newClassId) return;

                // Spec C — solo EClass: rifiuta enum/package/object
                const rawClass = (store.getState() as any).idlookup[newClassId];
                if (!rawClass || rawClass.className !== 'DClass') return;

                // Mutazione: identica a canvasToJjom.ts:212 e al property panel
                lRef.type = newClassId;
            } catch (err) {
                console.warn('[reference re-target] reconnect aborted', err);
            }
        },
        [persistIREdgeLayout]
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

                    // IR containment drop (wiring cantiere 2026-07-20): a drop
                    // landing on a compatible container node creates the child
                    // INSIDE the container (composition), for rootable and
                    // non-rootable classes alike. Falls through to the canvas
                    // semantics when no compatible container is under the cursor.
                    const cursorFlow = { x: position.x + defaultNodeWidth / 2, y: position.y + defaultNodeHeight / 2 };
                    const containerNode = findIRDropContainerAt(cursorFlow);
                    if (containerNode) {
                        const containerData = containerNode.data as ObjectNodeData;
                        const containerMeta = mi.allClasses.find(c => c.id === containerData.instanceOfClassId);
                        const compatRefs = containerMeta
                            ? getCompatibleContainmentRefs(containerMeta, metaclassId, mi.allClasses)
                            : [];
                        if (compatRefs.length === 1) {
                            performContainmentDrop(containerNode, metaclass, compatRefs[0].ref.name, position);
                            return;
                        }
                        if (compatRefs.length > 1) {
                            setPendingContainmentDrop({
                                position: { x: event.clientX, y: event.clientY },
                                flowPosition: position,
                                containerNodeId: containerNode.id,
                                childClass: metaclass,
                                compatibleRefs: compatRefs.map(c => ({ ref: c.ref, isContainment: true })),
                            });
                            return;
                        }
                        // incompatible container under the cursor → canvas semantics below
                    }

                    // Only rootable classes can be placed on the canvas
                    const isRootable = mi.rootableClasses.some(c => c.id === metaclassId);
                    if (!isRootable) return; // non-rootable → use context menu instead

                    // Pass undefined so DObject.new owns the name (defaultname
                    // "<ClassName>_<N>") → data.name === initialName. Read it back for
                    // the node label (see discovery §11/§12).
                    vertexId = syncCreateObject(graphId, metaclassId, position.x, position.y);
                    const createdName = (LPointerTargetable.fromPointer(vertexId as any) as any)?.model?.name ?? className;
                    nodeType = 'objectNode';
                    defaultLabel = createdName;
                    nodeData = {
                        label: createdName,
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
            if (isRootable) {
                event.dataTransfer.dropEffect = 'move';
                return;
            }
            // Non-rootable: droppable only over a compatible IR container
            // (containment drop feedback, decision D5, discovery 2026-07-20).
            const flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const containerNode = findIRDropContainerAt(flowPos);
            const containerMeta = containerNode
                ? mi.allClasses.find(c => c.id === (containerNode.data as ObjectNodeData).instanceOfClassId)
                : undefined;
            const compatible = !!containerMeta && isDropCompatible(containerMeta, draggedId, mi.allClasses);
            event.dataTransfer.dropEffect = compatible ? 'move' : 'none';
            return;
        }

        event.dataTransfer.dropEffect = 'move';
    }, [screenToFlowPosition, findIRDropContainerAt]);

    // Drop handler for the classic editor wrapper (used in 'classic' and 'split' modes).
    // Reads the metaclassId from dataTransfer (set by PalettePanel under
    // 'application/jjodel-classic'), resolves the LModel, and creates a DObject.
    // The classic view engine handles positioning automatically; drop coordinates
    // are intentionally ignored here.
    const onClassicDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const metaclassId = event.dataTransfer.getData('application/jjodel-classic');
        if (!metaclassId || !modelid) return;

        try {
            const lModel: any = LPointerTargetable.fromPointer(modelid);
            const lClass: any = LPointerTargetable.fromPointer(metaclassId);
            if (!lModel || !lClass) {
                console.warn('[EditorV2] Classic drop: cannot resolve LModel/LClass', { modelid, metaclassId });
                return;
            }
            lModel.addObject({}, lClass);
        } catch (err) {
            console.warn('[EditorV2] Classic drop failed:', err);
        }
    }, [modelid]);

    // Allow drop only when the dataTransfer carries the classic payload.
    // dataTransfer.types is readable during dragOver (unlike getData), so we
    // can filter out unrelated drags (e.g. files from the desktop) early.
    const onClassicDragOver = useCallback((event: React.DragEvent) => {
        if (!event.dataTransfer.types.includes('application/jjodel-classic')) return;
        event.preventDefault();
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

    // Reset a manually-resized node back to its content-driven size. A NodeResizer
    // drag writes explicit width/height on the node (top-level, via applyNodeChanges);
    // object/class/enum have no transformer style size, so dropping those keys lets
    // the card hug its content again (the `.mm-node { height:100% }` rule goes inert
    // once the wrapper has no explicit height). After React Flow re-measures the now
    // unsized node, refresh its handle bounds so connected edges follow the new size.
    const resetNodeSize = useCallback(
        (nodeId: string) => {
            takeSnapshot();
            setNodes((nds) => nds.map((n) => {
                if (n.id !== nodeId) return n;
                const { width, height, measured, ...rest } = n as any;
                return rest as Node;
            }));
            // Clear the persisted manual-resize flag and save, so the reset
            // survives a reload (the transformers gate width/height on it).
            if (isJjomMode) {
                syncSizeResetToJjom(nodeId);
                scheduleLayoutSave();
            }
            requestAnimationFrame(() => requestAnimationFrame(() => updateNodeInternals(nodeId)));
        },
        [setNodes, takeSnapshot, updateNodeInternals, isJjomMode, scheduleLayoutSave]
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
        // JjOM mode: a single undo system, the D-layer's (R-UNDO-1) — the very stack the
        // keyboard already drives through Navbar, so button and Cmd+Z can never diverge.
        // doUndoRedo tolerates an empty stack (reducer.ts:1129, `if (!delta) continue`),
        // but `statehistory[forUser]` itself is undefined until the first delta lands,
        // and indexing it would throw: guard on the stack, as undoredocomponent does.
        if (isJjomMode) {
            if (!(statehistory as any)[DUser.current]?.undoable?.length) return;
            UndoAction.new(1, DUser.current, false).commit();
            return;
        }
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
        // Mirror of handleUndo (R-UNDO-1).
        if (isJjomMode) {
            if (!(statehistory as any)[DUser.current]?.redoable?.length) return;
            RedoAction.new(1, DUser.current, false).commit();
            return;
        }
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
            const selectedCount = getNodes().filter(n => n.selected).length;
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
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
            setContextMenu({
                x: event.clientX,
                y: event.clientY,
                edgeId: edge.id,
            });
        },
        []
    );

    const onPaneClick = useCallback(() => {
        selectedEdgeIdRef.current = null;  // Clear edge selection
        clearSyntheticEdgeSelection();     // IR object-as-edge selection lives outside the base state
        setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)));
        setEdges(eds => eds.map(e => (e.selected ? { ...e, selected: false } : e)));
        setContextMenu(null);
        jjomSelection.onPaneClick();
    }, [setNodes, setEdges, jjomSelection]);

    // Keep React Flow edge selection explicit so custom manipulation handles
    // (SegmentHandles/EndpointHandles) are always available after click.
    const onEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        event.stopPropagation();
        // Synthetic IR edge (object-as-edge): selection lives in the IR
        // interaction store (the id does not exist in the base edge state);
        // the decoration pass re-applies the flag so RF shows the selected
        // styling and the reconnect anchors.
        if (edge.id.startsWith('irobj_')) {
            selectedEdgeIdRef.current = edge.id;
            setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)));
            setEdges(eds => eds.map(e => (e.selected ? { ...e, selected: false } : e)));
            clearSyntheticEdgeSelection();
            setSyntheticEdgeSelected(edge.id, true);
            return;
        }
        clearSyntheticEdgeSelection();
        selectedEdgeIdRef.current = edge.id;  // Preserve selection through Redux patches
        setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)));
        setEdges(eds => eds.map(e => ({ ...e, selected: e.id === edge.id })));
        jjomSelection.onEdgeClick(event, edge);
    }, [setNodes, setEdges, jjomSelection]);

    // Select an edge from a non-RF gesture (UnifiedEdge label / hit-path click).
    // Mirrors onEdgeClick so the selection is identical to a native edge click,
    // including the highlight/assign guard living inside jjomSelection.onEdgeClick.
    const selectEdge = useCallback((edgeId: string) => {
        selectedEdgeIdRef.current = edgeId;
        setNodes(nds => nds.map(n => (n.selected ? { ...n, selected: false } : n)));
        // Synthetic IR edge: selection tracked in the IR interaction store
        // (id absent from the base edge state); see onEdgeClick.
        if (edgeId.startsWith('irobj_')) {
            setEdges(eds => eds.map(e => (e.selected ? { ...e, selected: false } : e)));
            clearSyntheticEdgeSelection();
            setSyntheticEdgeSelected(edgeId, true);
            return;
        }
        clearSyntheticEdgeSelection();
        setEdges(eds => eds.map(e => ({ ...e, selected: e.id === edgeId })));
        jjomSelection.onEdgeClick(
            { stopPropagation() {} } as unknown as React.MouseEvent,
            { id: edgeId } as unknown as Edge,
        );
    }, [setNodes, setEdges, jjomSelection]);

    const closeContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    // Listen for child-element context menu events from ClassNode
    useEffect(() => {
        const handler = (e: Event) => {
            const { childId, childKind, nodeId, x, y } = (e as CustomEvent).detail;
            setContextMenu({
                x,
                y,
                nodeId,
                childId,
                childKind,
            });
        };
        window.addEventListener(JjodelEvents.CHILD_CONTEXT_MENU, handler);
        return () => window.removeEventListener(JjodelEvents.CHILD_CONTEXT_MENU, handler);
    }, []);

    // Shared helper: create a composition child on a parent node
    // Containment drop entry point (wiring cantiere 2026-07-20): upper-bound
    // guard (parity with the context menu path), snapshot, then the same
    // creation path as the context menu with the drop position.
    const performContainmentDrop = (parentNode: Node, childClass: MetaclassInfo, refName: string, atPosition: { x: number; y: number }) => {
        const dVertex = LPointerTargetable.fromPointer(parentNode.id) as any;
        const parentObjectId: string = dVertex?.model?.id ?? dVertex?.__raw?.model ?? parentNode.id;
        const guardResult = guardLink(parentObjectId, refName);
        if (!guardResult.allowed) {
            console.warn('[EditorV2] Containment drop refused (upper bound):', guardResult.message);
            return;
        }
        takeSnapshot();
        createCompositionChild(parentNode, childClass, refName, atPosition);
    };

    const createCompositionChild = (parentNode: Node, childClass: MetaclassInfo, refName: string, atPosition?: { x: number; y: number }) => {
        if (!graphId) return;
        // Count existing composition children to stack vertically
        const currentEdges = getEdges();
        const existingChildCount = currentEdges.filter(
            e => e.source === parentNode.id && e.type === 'composition'
        ).length;

        const parentW = parentNode.measured?.width ?? 140;
        const childX = atPosition?.x ?? parentNode.position.x + parentW + 80;
        const childY = atPosition?.y ?? parentNode.position.y + existingChildCount * 80;

        // Pass undefined so DObject.new owns the name → data.name === initialName.
        // Read it back for the node label (see discovery §11/§12).
        const vertexId = syncCreateObject(graphId, childClass.id, childX, childY);
        if (vertexId) {
            markDropCreated(vertexId);
            const createdName = (LPointerTargetable.fromPointer(vertexId) as any)?.model?.name ?? childClass.name;
            const childNode: Node = {
                id: vertexId,
                type: 'objectNode',
                position: { x: childX, y: childY },
                data: {
                    label: createdName,
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
        // Cross-metamodel ghost-target chip: a single "Delete reference" item that
        // reuses the canonical refId-keyed cascade (syncDeleteReferenceById). The chip
        // has no RF edge, so childId is the DReference id directly.
        if (contextMenu?.nodeId && contextMenu.childId && contextMenu.childKind === 'ref') {
            const refId = contextMenu.childId;
            const nodeId = contextMenu.nodeId;
            return [
                {
                    label: 'Delete reference',
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => {
                        takeSnapshot();
                        // Optimistically drop the ghost-target chip + its reference row so the
                        // chip/connector vanish instantly; the model delete re-derives the node
                        // without them on the next sync (mirrors the attribute-delete path).
                        setNodes(nds => nds.map(n => {
                            if (n.id !== nodeId) return n;
                            const data = n.data as ClassNodeData;
                            return {
                                ...n,
                                data: {
                                    ...data,
                                    ghostTargets: (data.ghostTargets || []).filter(g => g.refId !== refId),
                                    references: (data.references || []).filter(r => r.id !== refId),
                                },
                            };
                        }));
                        syncDeleteReferenceById(refId);
                    },
                },
            ];
        }

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
                        window.dispatchEvent(new CustomEvent(JjodelEvents.HELP_OPEN, { detail: { helpKey } }));
                    },
                },
            ];
        }

        // Single node context menu
        if (contextMenu?.nodeId) {
            const node = getNodes().find(n => n.id === contextMenu.nodeId);
            const items: ContextMenuItem[] = [];

            // "Reset size" only for content-hug node types that were actually
            // resized by hand (width/height set only by a NodeResizer drag).
            const canResetSize = !!node
                && (node.type === 'objectNode' || node.type === 'classNode' || node.type === 'enumNode')
                && ((node as any).width != null || (node as any).height != null);

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

            // Add a reference to a class node. Creates the model feature only
            // (no edge): a self-loop, if rendered, is drawn by the sync layer.
            // Mirrors the composition-children block above for gating/structure.
            if (node?.type === 'classNode') {
                items.push({
                    label: 'Add reference',
                    icon: 'bi-link-45deg',
                    onClick: () => {
                        const lClass: any = LPointerTargetable.fromPointer(node.id)?.model;
                        if (!lClass || typeof lClass.addReference !== 'function') return;
                        // Unique name among the class's existing references
                        // (mirror canvasToJjom.ts uniqueName via raw store lookup).
                        const baseName = 'newReference';
                        let uniqueName = baseName;
                        try {
                            const state = store.getState();
                            const rawVertex = state.idlookup?.[node.id] as any;
                            const classId = rawVertex?.model;
                            const dClass = classId ? state.idlookup?.[classId] as any : null;
                            if (dClass) {
                                const refNames = new Set<string>();
                                for (const rid of (dClass.references ?? [])) {
                                    const r = state.idlookup?.[rid] as any;
                                    if (r?.name) refNames.add(r.name);
                                }
                                if (refNames.has(uniqueName)) {
                                    let i = 1;
                                    while (refNames.has(`${baseName}${i}`)) i++;
                                    uniqueName = `${baseName}${i}`;
                                }
                            }
                        } catch { /* fall back to base name */ }
                        const lRef: any = lClass.addReference(uniqueName);
                        const refId = lRef?.id ?? lRef;
                        if (refId) {
                            SetRootFieldAction.new('_lastSelected' as any, { node: '', view: '', modelElement: refId });
                        }
                    },
                });
                items.push({ divider: true });
            }

            const classicTooltip = 'Available in classic editor';
            items.push(
                {
                    label: 'Edit',
                    icon: 'bi-pencil-square',
                    disabled: true,
                    tooltip: classicTooltip,
                },
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
                    label: 'Up',
                    icon: 'bi-arrow-up',
                    disabled: true,
                    tooltip: classicTooltip,
                },
                {
                    label: 'Down',
                    icon: 'bi-arrow-down',
                    disabled: true,
                    tooltip: classicTooltip,
                },
                { divider: true },
                ...(canResetSize ? [{
                    label: 'Reset size',
                    icon: 'bi-aspect-ratio',
                    onClick: () => resetNodeSize(contextMenu.nodeId!),
                }] : []),
                {
                    label: 'Disable auto-sizing',
                    icon: 'bi-arrows-angle-expand',
                    disabled: true,
                    tooltip: classicTooltip,
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
                        window.dispatchEvent(new CustomEvent(JjodelEvents.HELP_OPEN, { detail: { helpKey } }));
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
                        window.dispatchEvent(new CustomEvent(JjodelEvents.EXPLAIN_OPEN, {
                            detail: { elementName, elementType, metamodelName, properties },
                        }));
                    },
                },
            );

            // "Create View" — only for classifiers (classNode, enumNode), not objectNode/packageNode.
            // View authoring is an Advanced-mode feature (hidden in Basic).
            if ((node?.type === 'classNode' || node?.type === 'enumNode') && isAdvancedMode()) {
                const resolved = resolveParentViewpoint();
                const vpName = resolved?.vpName;
                const data = node.data as any;
                items.push(
                    { divider: true },
                    {
                        label: resolved ? `Create View${vpName ? ` in "${vpName}"` : ''}` : 'Create View — no viewpoint available',
                        icon: 'bi-eye',
                        disabled: !resolved,
                        onClick: () => {
                            // console.log('[EditorV2] Create View clicked, node:', node.id, node.type);
                            // node.id is a vertex ID; resolve to the DClass model element ID
                            const vertexProxy: any = LPointerTargetable.fromPointer(node.id);
                            const modelElement = vertexProxy?.model;
                            const classId = modelElement?.id ?? node.id;
                            const className = modelElement?.__raw?.className ?? 'DClass';
                            // console.log('[EditorV2] resolved classId:', classId, 'className:', className);
                            createViewInWorkbench(classId, data?.label ?? 'unnamed', className);
                        },
                    },
                );
            }

            // ── Views editor, canvas entry (Fase 2) ──
            // Object nodes only: the IR resolver answers for M1 instances, and the whole
            // block is gated on `index`, which getIRIndex returns null for whenever no IR
            // viewpoint is active. That single null IS the "no viewpoint / classic
            // viewpoint" gate, and it costs no second read of `state.viewpoint` — the
            // active id is carried by the index itself (R-LAY-19, 2026-08-25).
            // Degradation is by absence: anything that does not resolve adds no item.
            if (node?.type === 'objectNode') {
                const st: any = store.getState();
                const lookup = st?.idlookup;
                const index = lookup ? getIRIndex(st, computeIRSignature(st)) : null;
                const objectId = lookup?.[node.id]?.model;
                const classId = (node.data as any)?.instanceOfClassId;
                if (index && typeof objectId === 'string' && classId) {
                    const viewId = resolveIRView(objectId, classId, index, makeReadCtx(lookup), lookup)?.viewId;
                    if (viewId) {
                        const viewName = lookup?.[viewId]?.name || 'view';
                        items.push(
                            { divider: true },
                            {
                                label: `Edit view · ${viewName}`,
                                icon: 'bi-eye',
                                onClick: () => DockManager.openView(viewId),
                            },
                        );
                    } else if (isAdvancedMode()) {
                        // No declared view for this metaclass. Authoring one is the same
                        // Advanced-mode feature the classifier-side "Create View" above is
                        // gated on, so the same gate applies here rather than a second policy.
                        const metaclassName = (node.data as any)?.instanceOfClassName || 'class';
                        items.push(
                            { divider: true },
                            {
                                label: `Create view for ${metaclassName}`,
                                icon: 'bi-eye',
                                onClick: () => {
                                    // The draft is born in the ACTIVE viewpoint, the one the
                                    // user is looking at — not in the "last edited workbench"
                                    // viewpoint the no-argument resolution would pick.
                                    // The D-layer discriminator comes off the metaclass itself,
                                    // as the "Create View" branch above already reads it, rather
                                    // than being assumed from the node type.
                                    const metaclassKind = lookup?.[classId]?.className ?? 'DClass';
                                    const newViewId = createViewInWorkbench(classId, metaclassName, metaclassKind, index.viewpointId);
                                    if (newViewId) DockManager.openView(newViewId);
                                },
                            },
                        );
                    }
                }
            }

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

    // Flow zoom level (reactive via useStore, snapped to 10% for display)
    const flowZoomFromStore = useStore((s) => Math.round(s.transform[2] * 100 / 10) * 10);

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
        fitView({ padding: fitPadding(), maxZoom: 1, duration: 200 });
    }, [fitView]);
    const handleFitView = useCallback(() => fitView({ padding: fitPadding(), maxZoom: 1, duration: 200 }), [fitView]);

    // Register the flow editor as a ZoomController with the active-editor context.
    useEffect(() => {
        const controller: ZoomController = {
            getZoom: () => getViewport().zoom,
            zoomIn: handleZoomIn,
            zoomOut: handleZoomOut,
            resetZoom: handleResetZoom,
            setZoom: (z) => setViewport({ ...getViewport(), zoom: z }, { duration: 150 }),
        };
        registerZoomController('flow', controller);
        return () => unregisterZoomController('flow');
    }, [getViewport, setViewport, handleZoomIn, handleZoomOut, handleResetZoom, registerZoomController, unregisterZoomController]);

    // Classic editor zoom controller registration via CustomEvent.
    // The bridge in DV.tsx jsxString cannot use hooks, so it dispatches
    // JjodelEvents.CLASSIC_NODE_MOUNTED with the graph node payload, and
    // we register the controller from here (real React tree).
    const classicNodeRef = useRef<any>(null);
    useEffect(() => {
        const handleNodeMounted = (e: Event) => {
            const { node } = (e as CustomEvent).detail || {};
            if (!node) return;
            if (classicNodeRef.current === node) return;
            classicNodeRef.current = node;

            const clamp = (v: number) => Math.max(CLASSIC_ZOOM_MIN, Math.min(CLASSIC_ZOOM_MAX, v));

            const controller: ZoomController = {
                getZoom: () => node?.zoom?.x ?? 1,
                zoomIn: () => {
                    const next = clamp((node?.zoom?.x ?? 1) * 1.1);
                    TRANSACTION('Zoom in', () => {
                        SetFieldAction.new(node, 'zoom.x' as any, next, '');
                        SetFieldAction.new(node, 'zoom.y' as any, next, '');
                    });
                },
                zoomOut: () => {
                    const next = clamp((node?.zoom?.x ?? 1) / 1.1);
                    TRANSACTION('Zoom out', () => {
                        SetFieldAction.new(node, 'zoom.x' as any, next, '');
                        SetFieldAction.new(node, 'zoom.y' as any, next, '');
                    });
                },
                resetZoom: () => {
                    TRANSACTION('Zoom reset', () => {
                        node.zoom = new GraphPoint(1, 1);
                    });
                },
                setZoom: (z) => {
                    const next = clamp(z);
                    TRANSACTION('Zoom set', () => {
                        SetFieldAction.new(node, 'zoom.x' as any, next, '');
                        SetFieldAction.new(node, 'zoom.y' as any, next, '');
                    });
                },
            };
            registerZoomController('classic', controller);
        };

        window.addEventListener(JjodelEvents.CLASSIC_NODE_MOUNTED, handleNodeMounted);
        return () => {
            window.removeEventListener(JjodelEvents.CLASSIC_NODE_MOUNTED, handleNodeMounted);
        };
    }, [registerZoomController]);

    // Unregister classic controller when the classic editor is no longer mounted.
    useEffect(() => {
        const classicMounted = (editorMode === 'classic' || editorMode === 'split') && hasViewpoint;
        if (!classicMounted && classicNodeRef.current) {
            unregisterZoomController('classic');
            classicNodeRef.current = null;
        }
    }, [editorMode, hasViewpoint, unregisterZoomController]);

    // Reset on modelid change (defensive — covers viewpoint switches that
    // don't go through the editorMode/hasViewpoint guard above).
    useEffect(() => {
        return () => {
            if (classicNodeRef.current) {
                unregisterZoomController('classic');
                classicNodeRef.current = null;
            }
        };
    }, [modelid, unregisterZoomController]);

    // Bridge active controller -> Toolbar zoom props. zoomTick forces re-read
    // when the classic editor mutates its zoom (no reactive subscription).
    const [zoomTick, setZoomTick] = useState(0);
    const activeController = getActiveZoomController();
    const activeZoomLevel = useMemo(() => {
        if (!activeController) return 100;
        if (activeEditorId === 'flow') return flowZoomFromStore;
        return Math.round(activeController.getZoom() * 100);
    }, [activeController, activeEditorId, flowZoomFromStore, zoomTick]);
    const handleActiveZoomIn = useCallback(() => {
        activeController?.zoomIn();
        setZoomTick((t) => t + 1);
    }, [activeController]);
    const handleActiveZoomOut = useCallback(() => {
        activeController?.zoomOut();
        setZoomTick((t) => t + 1);
    }, [activeController]);
    const handleActiveResetZoom = useCallback(() => {
        // Reset the active editor to 100% via an absolute setter — no fit-view,
        // no recentering (resetZoom on the flow controller would fit-to-view).
        activeController?.setZoom?.(1);
        setZoomTick((t) => t + 1);
    }, [activeController]);
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

        // Recalc non-pinned edge sides on the FINAL ELK geometry, then re-index.
        // applyDistribution alone only re-indexes handles and inherits the side that
        // was chosen at first build on the stale grid positions (Step 2bis), which ELK
        // then contradicts → U-turns. Reading rects from layoutedNodes (which carry the
        // new positions and preserve measured sizes) sidesteps the async setNodes above.
        // Side choice is geometry-only + deconfliction (no occupancy / same-side U).
        const layoutRects = new Map(layoutedNodes.map(n => [n.id, getNodeRect(n)]));
        setEdges(eds => {
            const recalcable = eds.filter(e => {
                const d = e.data as { sourceAnchor?: AnchorConfig; targetAnchor?: AnchorConfig } | undefined;
                // Leave manually pinned anchors untouched (mirrors hysteresis :314).
                return d?.sourceAnchor?.mode !== 'pinned' && d?.targetAnchor?.mode !== 'pinned';
            });
            const anchorMap = computeGeometricAnchorsForAllEdges(recalcable, layoutRects);
            const recomputed = eds.map(edge => {
                const a = anchorMap.get(edge.id);
                if (!a) return edge; // pinned (filtered out) or unresolved → untouched
                const newSrcSide = a.sourceHandle;
                const newTgtSide = a.targetHandle;
                const curSrcSide = edge.sourceHandle?.split('-')[0];
                const curTgtSide = edge.targetHandle?.split('-')[0];
                const sidesChanged = curSrcSide !== newSrcSide || curTgtSide !== newTgtSide;
                return {
                    ...edge,
                    sourceHandle: `${newSrcSide}-0`,
                    targetHandle: `${newTgtSide}-0`,
                    data: {
                        ...edge.data,
                        sourceAnchor: { mode: 'auto', side: newSrcSide } as AnchorConfig,
                        targetAnchor: { mode: 'auto', side: newTgtSide } as AnchorConfig,
                        // R2: a side flip invalidates manual waypoints (indexed against the
                        // old path shape) — clear them, mirroring the drag path (:3016).
                        ...(sidesChanged ? { waypoints: [] } : {}),
                    },
                };
            });
            return applyDistribution(recomputed);
        });
        requestAnimationFrame(() => fitView({ padding: fitPadding(), maxZoom: 1, duration: 300 }));
    }, [getNodes, getEdges, setNodes, setEdges, fitView, applyDistribution]);
    autoLayoutRef.current = handleAutoLayout;

    // ── Re-run auto-layout once late M1 edges materialize (S4b) ──────────────
    // handleAutoLayout runs ~50ms after mount, before the async M1 reference edges reach
    // RF state, so ELK lays out an edge-less graph. This watcher (armed only on the
    // justCreated path, in the onInit callback above) waits for the reference edges to
    // arrive, debounces to collect the incremental-sync bundle, then re-runs the SAME
    // handleAutoLayout exactly once. A manual drag or the window timeout disarms it.
    // Pure transitions live in utils/reLayoutWatcher (unit-tested); timers live here.
    const RELAYOUT_WINDOW_MS = 3000;
    const RELAYOUT_DEBOUNCE_MS = 150;
    const reLayoutStateRef = useRef<ReLayoutState>(INITIAL_RELAYOUT_STATE);
    const reLayoutWindowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const reLayoutDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const clearReLayoutTimers = useCallback(() => {
        if (reLayoutWindowTimerRef.current) { clearTimeout(reLayoutWindowTimerRef.current); reLayoutWindowTimerRef.current = null; }
        if (reLayoutDebounceTimerRef.current) { clearTimeout(reLayoutDebounceTimerRef.current); reLayoutDebounceTimerRef.current = null; }
    }, []);
    const dispatchReLayout = useCallback((event: ReLayoutEvent) => {
        const { state, effect } = reduceReLayout(reLayoutStateRef.current, event);
        reLayoutStateRef.current = state;
        switch (effect) {
            case 'arm_window':
                if (reLayoutWindowTimerRef.current) clearTimeout(reLayoutWindowTimerRef.current);
                reLayoutWindowTimerRef.current = setTimeout(() => dispatchReLayout({ type: 'WINDOW_TIMEOUT' }), RELAYOUT_WINDOW_MS);
                break;
            case 'start_debounce':
                if (reLayoutDebounceTimerRef.current) clearTimeout(reLayoutDebounceTimerRef.current);
                reLayoutDebounceTimerRef.current = setTimeout(() => dispatchReLayout({ type: 'DEBOUNCE_FIRE' }), RELAYOUT_DEBOUNCE_MS);
                break;
            case 'rerun':
                clearReLayoutTimers();
                autoLayoutRef.current?.();
                break;
            case 'cleanup':
                clearReLayoutTimers();
                break;
            default:
                break;
        }
    }, [clearReLayoutTimers]);
    // Arm entry (called from the onInit justCreated path via armReLayoutRef).
    armReLayoutRef.current = () => dispatchReLayout({ type: 'ARM', refEdgeCount: countReferenceEdges(getEdges()) });
    // Feed edge-count changes to the watcher; a no-op unless armed.
    useEffect(() => {
        dispatchReLayout({ type: 'EDGES', refEdgeCount: countReferenceEdges(edges) });
    }, [edges, dispatchReLayout]);
    // Clear pending timers on unmount.
    useEffect(() => clearReLayoutTimers, [clearReLayoutTimers]);

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
            // Synthetic IR edge (object-as-edge): the id does not exist in the
            // base edge state. The anchor pins coming from EndpointHandles
            // (sourceAnchor/targetAnchor in data.data) become session anchor
            // overrides consumed by the synthesis pass.
            if (edgeId.startsWith('irobj_')) {
                const objectId = edgeId.slice('irobj_'.length);
                const d: any = (data as any).data ?? {};
                const override: { sourceSide?: string; targetSide?: string; waypoints?: unknown[] } = {};
                if (d.sourceAnchor?.side) override.sourceSide = d.sourceAnchor.side;
                if (d.targetAnchor?.side) override.targetSide = d.targetAnchor.side;
                if (Array.isArray(d.waypoints)) override.waypoints = d.waypoints;
                if (override.sourceSide || override.targetSide || override.waypoints) {
                    setIREdgeAnchorOverride(objectId, override);
                    persistIREdgeLayout(objectId);
                }
                return;
            }
            takeSnapshot();
            setEdges((eds) => {
                const updated = eds.map((e) => (e.id === edgeId ? { ...e, ...data } : e));
                return applyDistribution(updated);
            });
        },
        [setEdges, takeSnapshot, applyDistribution, persistIREdgeLayout]
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

            // A manual node drag (active or on release) invalidates the pending auto-layout
            // re-run: the user has taken control of the layout. Programmatic setNodes (ELK)
            // does not emit position changes with a `dragging` flag, so this is user-only.
            if (changes.some((c) => c.type === 'position' && (c as any).dragging !== undefined)) {
                dispatchReLayout({ type: 'DRAG' });
            }

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
                    // Positions are now committed to the D-layer — debounce a
                    // full project save so the new layout survives a reload.
                    scheduleLayoutSave();
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
                    let sizeSynced = false;
                    for (const c of changes.filter((ch: any) => ch.type === 'dimensions' && ch.resizing)) {
                        const node = getNodes().find((n) => n.id === c.id);
                        const w = c.dimensions?.width ?? node?.measured?.width;
                        const h = c.dimensions?.height ?? node?.measured?.height;
                        if (w !== undefined && h !== undefined) {
                            syncSizeToJjom(c.id, w, h);
                            sizeSynced = true;
                        }
                    }
                    // Sizes are now committed to the D-layer — debounce a full
                    // project save so the resize survives a reload (same
                    // pattern as the drag-end path above; without it the new
                    // w/h live only in Redux until the next drag or Ctrl+S).
                    if (sizeSynced) scheduleLayoutSave();
                }
            }

            // Deduplicate auto-measurement dimension changes to break the
            // StoreUpdater infinite loop:
            //   React setNodes → StoreUpdater → store.setNodes → RF measure
            //   → onNodesChange({type:'dimensions'}) → setNodes → repeat
            //
            // Two layers of protection:
            // 1. Dimension dedup: identical measurements (within 0.5px) are
            //    filtered — they'd create a new nodes reference without any
            //    actual data change.
            // 2. Rate limiter: max 3 dimension changes per node per 500ms.
            //    Breaks oscillation loops where dimensions genuinely differ
            //    by >0.5px between cycles (ErrorDisplay badge, font loading,
            //    CSS transitions).
            // User-initiated resize (resizing !== undefined) always passes.
            const now = Date.now();
            const changesToApply = changes.filter((c: any) => {
                if (c.type !== 'dimensions') return true;
                if (c.resizing !== undefined) return true; // user resize

                const dims = c.dimensions;
                if (!dims) return false;

                // Rate limit: max 3 auto-measurement dimension changes per
                // node per 500ms.  Prevents oscillation-driven infinite loops.
                const rl = dimRateLimitRef.current.get(c.id);
                if (rl && now - rl.start < 500) {
                    rl.count++;
                    if (rl.count > 3) return false; // rate-limited
                } else {
                    dimRateLimitRef.current.set(c.id, { count: 1, start: now });
                }

                // Dimension dedup: skip if identical to last measurement
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
        [onNodesChange, takeSnapshot, setEdges, getNodes, applyDistribution, isJjomMode, scheduleLayoutSave, dispatchReLayout]
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
                            // Preserve existing waypoints — only clear if anchor sides changed significantly
                            waypoints: e.data?.waypoints || [],
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

    const editorContextValue = useMemo(() => ({ takeSnapshot, notation, onEdgeDataChange: handleEdgeChange, recalculateAnchors, selectChildElement, selectEdge, showEdgeLabels }), [takeSnapshot, notation, handleEdgeChange, recalculateAnchors, selectChildElement, selectEdge, showEdgeLabels]);

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

    // Split-mode divider drag — resizes the classic/flow ratio between 15–85%.
    // Resets to 40 every time the user re-enters split mode (no persistence).
    const [splitPercent, setSplitPercent] = useState(40);
    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        const container = e.currentTarget.parentElement;
        if (!container) return;
        const containerRect = container.getBoundingClientRect();

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = moveEvent.clientX - containerRect.left;
            const percent = Math.min(Math.max((deltaX / containerRect.width) * 100, 15), 85);
            setSplitPercent(percent);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }, []);

    // Canvas inner JSX — extracted so the same React Flow tree can be embedded
    // either in the standalone `.editor-v2__canvas` (flow / no-viewpoint) or
    // inside the `.editor-split-flow` pane (split mode).

    const flowCanvas = (
        <HighlightProvider value={highlightState}>
            <ReactFlow
                nodes={irContainment.nodes}
                edges={irContainment.edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectEnd={onConnectEnd}
                onReconnect={handleReconnect}
                onReconnectStart={handleReconnectStart}
                edgesReconnectable={true}
                reconnectRadius={20}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeContextMenu={onNodeContextMenu}
                onEdgeContextMenu={onEdgeContextMenu}
                onNodeClick={jjomSelection.onNodeClick}
                onEdgeClick={onEdgeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                connectionMode={ConnectionMode.Loose}
                fitView={!isJjomMode && nodes.length > 0}
                fitViewOptions={{ padding: fitPadding(), maxZoom: 1 }}
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
                {/* IR containment hulls (Fase 2b): visual containment for IR graphVertex views */}
                {irContainment.model.containers.size > 0 && (
                    <IRContainmentHulls
                        nodes={irContainment.nodes}
                        model={irContainment.model}
                        names={irContainment.names}
                    />
                )}
                {/* Zoom controls moved to toolbar */}
                <MiniMap
                    pannable
                    zoomable
                    style={{ position: 'absolute', margin: 0, right: 'calc(var(--jj-canvas-right-inset, 0px) + 20px)', bottom: '100px', borderRadius: '4px', opacity: 0.8 }}
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
                    objectEdgeOptions={(pendingM1Connection.objectEdgeMatches ?? []).map((m, i) => ({
                        key: `${m.edgeClass.id}_${i}`,
                        label: `New ${m.edgeClass.name}`,
                    }))}
                    onSelectObjectEdge={(key) => {
                        const matches = pendingM1Connection.objectEdgeMatches ?? [];
                        const idx = matches.findIndex((m, i) => `${m.edgeClass.id}_${i}` === key);
                        if (idx >= 0) handleObjectEdgeSelected(matches[idx]);
                    }}
                />
            )}

            {pendingContainmentDrop && (
                <M1ReferencePopup
                    position={pendingContainmentDrop.position}
                    containerRef={editorContainerRef}
                    options={pendingContainmentDrop.compatibleRefs}
                    onSelect={(ref) => {
                        const p = pendingContainmentDrop;
                        setPendingContainmentDrop(null);
                        const parentNode = getNodes().find(n => n.id === p.containerNodeId);
                        if (parentNode) performContainmentDrop(parentNode, p.childClass, ref.name, p.flowPosition);
                    }}
                    onCancel={() => setPendingContainmentDrop(null)}
                />
            )}
        </HighlightProvider>
    );

    return (
        <EditorContext.Provider value={editorContextValue}>
            <div className={`editor-v2 theme-${theme} notation-${notation}${colorScheme !== 'default' ? ` scheme-${colorScheme}` : ''}${showEdgeLabels ? ' show-edge-labels' : ''}${showBackground ? '' : ' hide-background'}${highlightModeActive ? ' highlight-mode' : ''}`} tabIndex={0} onKeyDown={onKeyDown} onPointerDownCapture={markUserInteracted} onKeyDownCapture={markUserInteracted}>
                <UniquenessProblemSync modelid={modelid} />
                <ConformanceProblemSync modelid={modelid} graphId={graphId} />
                <PalettePanel
                    editorMode={modeInfo.mode}
                    rootableClasses={irPalette.classes}
                    irPaletteFallback={irPalette.fallback}
                    undeclaredClasses={irPalette.undeclared}
                    allClasses={modeInfo.allClasses}
                    selectedDObjectId={lastSelectedModelElement ?? null}
                />
                <div className="editor-v2__main">
                    <Toolbar
                        snapEnabled={snapEnabled}
                        onToggleSnap={handleToggleSnap}
                        onFitView={handleFitView}
                        onAutoLayout={handleAutoLayout}
                        onDuplicateSelected={duplicateSelected}
                        onDeleteSelected={deleteSelected}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={isJjomMode ? dUndoLen > 0 : canUndo}
                        canRedo={isJjomMode ? dRedoLen > 0 : canRedo}
                        notation={notation}
                        onNotationChange={setNotation}
                        colorScheme={colorScheme}
                        onColorSchemeChange={setColorScheme}
                        customPalettes={customPalettes}
                        onCreateCustomPalette={handleCreateCustomPalette}
                        onRenamePalette={handleRenameCustomPalette}
                        onDeletePalette={handleDeleteCustomPalette}
                        zoomLevel={activeController ? activeZoomLevel : undefined}
                        onZoomIn={activeController ? handleActiveZoomIn : undefined}
                        onZoomOut={activeController ? handleActiveZoomOut : undefined}
                        onResetZoom={activeController ? handleActiveResetZoom : undefined}
                        selectedCount={selectedNodes.length}
                        onAlignLeft={() => withSnapshot(alignLeft)}
                        onAlignCenterV={() => withSnapshot(alignCenterVertical)}
                        onAlignRight={() => withSnapshot(alignRight)}
                        onAlignTop={() => withSnapshot(alignTop)}
                        onAlignCenterH={() => withSnapshot(alignCenterHorizontal)}
                        onAlignBottom={() => withSnapshot(alignBottom)}
                        onDistributeH={() => withSnapshot(distributeHorizontally)}
                        onDistributeV={() => withSnapshot(distributeVertically)}
                        isMetamodel={!isModelMode}
                        modelId={modelid}
                        editorMode={editorMode}
                        hasViewpoint={hasViewpoint}
                        onEditorModeChange={onEditorModeChange}
                        highlightModeActive={highlightModeActive}
                        activeHighlightColor={activeHighlightColor}
                        onSelectHighlightColor={setActiveHighlightColor}
                        onClearHighlights={clearHighlights}
                    />
                    {(editorMode === 'classic' && classicSlot) ? (
                        <div
                            className={`editor-classic-only${activeEditorId === 'classic' ? ' is-active-editor' : ''}`}
                            onMouseDownCapture={() => setActive('classic')}
                            onDrop={onClassicDrop}
                            onDragOver={onClassicDragOver}
                        >
                            {classicSlot}
                        </div>
                    ) : (editorMode === 'split' && classicSlot) ? (
                        <div className="editor-split-container">
                            <div
                                className={`editor-split-classic${activeEditorId === 'classic' ? ' is-active-editor' : ''}`}
                                style={{ flex: `0 0 ${splitPercent}%` }}
                                onMouseDownCapture={() => setActive('classic')}
                                onDrop={onClassicDrop}
                                onDragOver={onClassicDragOver}
                            >
                                {classicSlot}
                            </div>
                            <div
                                className="editor-split-divider"
                                onMouseDown={handleDividerMouseDown}
                                role="separator"
                                aria-orientation="vertical"
                                title="Drag to resize"
                            />
                            <div className="editor-split-flow">
                                <div
                                    className={`editor-v2__canvas${activeEditorId === 'flow' ? ' is-active-editor' : ''}`}
                                    ref={editorContainerRef}
                                    style={{ position: 'relative' }}
                                    onMouseDownCapture={() => setActive('flow')}
                                >
                                    {flowCanvas}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`editor-v2__canvas${activeEditorId === 'flow' ? ' is-active-editor' : ''}`}
                            ref={editorContainerRef}
                            style={{ position: 'relative' }}
                            onMouseDownCapture={() => setActive('flow')}
                        >
                            {flowCanvas}
                        </div>
                    )}

                    {/* Bottom drawer removed — right-side Info panel handles properties */}
                </div>

                {/* PropertiesPanel removed — properties editing handled by dock-based Info panel */}

                {contextMenu && createPortal(
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={getContextMenuItems()}
                        onClose={closeContextMenu}
                    />,
                    document.body,
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

                {modelid && createPortal(
                    <SimulationPanel modelid={modelid} isModelMode={isModelMode} />,
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
function EditorV2({ modelid, onSwitchEditor, classicSlot, editorMode, hasViewpoint, onEditorModeChange }: EditorV2Props) {
    return (
        <ReactFlowProvider>
            <EditorV2Inner
                modelid={modelid}
                onSwitchEditor={onSwitchEditor}
                classicSlot={classicSlot}
                editorMode={editorMode}
                hasViewpoint={hasViewpoint}
                onEditorModeChange={onEditorModeChange}
            />
        </ReactFlowProvider>
    );
}

export default EditorV2;
export { EditorV2 };
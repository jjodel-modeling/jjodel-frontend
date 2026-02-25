import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    SelectionMode,
    ConnectionMode,
    PanOnScrollMode,
    type Node,
    type Edge,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ClassNode from './nodes/ClassNode';
import EnumNode from './nodes/EnumNode';
import PackageNode from './nodes/PackageNode';
import UnifiedEdge from './edges/UnifiedEdge';
import PalettePanel from './panels/PalettePanel';
import PropertiesPanel from './panels/PropertiesPanel';
import Toolbar from './Toolbar';
import AlignmentToolbar from './AlignmentToolbar';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { useHistory } from './hooks/useHistory';
import { useAlignment } from './hooks/useAlignment';
import { useAutoAnchor, computeAnchorsWithHysteresis, getNodeRect } from './hooks/useAutoAnchor';
import { useObstacleAwareAnchors } from './hooks/useObstacleAwareAnchors';
import { EditorContext } from './contexts/EditorContext';
import { ObstacleGridProvider } from './contexts/ObstacleGridContext';
import { getNextFreeHandleIndex, computePortDistribution } from './utils/portDistribution';
import type { ClassNodeData, EnumNodeData, PackageNodeData, ReferenceEdgeData, InheritanceEdgeData, AnchorConfig, ReferenceKind, NotationMode, ColorScheme } from './types';
import { EdgeTypePopup, type EdgeTypeChoice } from './components/EdgeTypePopup';
import { useJjomSync } from './hooks/useJjomSync';
import { useJjomSelection } from './hooks/useJjomSelection';
import { getSyncMode, markDropCreated } from './sync/syncState';
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
    getModelInfo,
    setModelName,
    setModelUri,
} from './sync/canvasToJjom';
import { rafThrottle, cancelThrottle } from '../../utils/DragThrottle';

import './EditorV2.scss';

// Register custom node types
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
};

// Register custom edge types — both map to UnifiedEdge which handles all variants
const edgeTypes: EdgeTypes = {
    reference: UnifiedEdge,
    inheritance: UnifiedEdge,
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
    const [edges, setEdges, onEdgesChange] = useEdgesState(modelid ? [] : initialEdges);

    // Phase 3: bidirectional incremental sync with JjOM/Redux
    // fitViewRef bridges the hook ordering: useJjomSync needs to call fitView
    // after init, but fitView comes from useReactFlow() which is defined later.
    const fitViewRef = useRef<(() => void) | null>(null);
    const { isJjomMode, graphId } = useJjomSync(modelid, setNodes, setEdges, () => {
        // Delay slightly so RF has measured nodes before fitting
        setTimeout(() => fitViewRef.current?.(), 50);
    });

    // Selection sync: standalone hook — updates Properties panel via _lastSelected
    const jjomSelection = useJjomSelection(modelid, isJjomMode);

    const { screenToFlowPosition, getNodes, getEdges, zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
    fitViewRef.current = () => fitView({ padding: 0.2, maxZoom: 1 });
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const clipboard = useRef<ClipboardState>({ nodes: [], edges: [] });

    // Edge type popup: pending connection waiting for user to pick edge type
    const [pendingConnection, setPendingConnection] = useState<PendingConnection | null>(null);
    const pendingConnectionRef = useRef<Connection | null>(null);
    const editorContainerRef = useRef<HTMLDivElement>(null);

    // Theme state with localStorage persistence
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('editor-v2-theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-theme', theme);
    }, [theme]);

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
    const VALID_SCHEMES: ColorScheme[] = ['default', 'monochrome', 'pastel-lavender', 'pastel-rose', 'pastel-ocean', 'pastel-earth', 'pastel-meadow', 'high-contrast', 'print'];
    const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
        const saved = localStorage.getItem('editor-v2-color-scheme');
        return VALID_SCHEMES.includes(saved as ColorScheme) ? (saved as ColorScheme) : 'default';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-color-scheme', colorScheme);
    }, [colorScheme]);

    const handleToggleTheme = useCallback(() => {
        setTheme(prev => prev === 'dark' ? 'light' : 'dark');
    }, []);

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

    // Obstacle-aware post-pass: re-evaluates anchor sides using A* multi-candidate scoring
    useObstacleAwareAnchors();

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

            setPendingConnection({
                connection,
                position: { x: clientX, y: clientY },
            });
        },
        []
    );

    // Called when user picks an edge type from the popup
    const handleEdgeTypeSelected = useCallback(
        (choice: EdgeTypeChoice) => {
            if (!pendingConnection) return;

            const { connection } = pendingConnection;
            takeSnapshot();

            const isInheritance = choice === 'inheritance';
            const edgeType = isInheritance ? 'inheritance' : 'reference';

            const currentEdges = getEdges();

            const optimal = getOptimalAnchors(
                connection.source!,
                connection.target!,
                edgeType,
                currentEdges,
            );
            const sourceSide = optimal.sourceHandle;
            const targetSide = optimal.targetHandle;

            const sourceAnchor: AnchorConfig = { mode: 'auto', side: sourceSide as AnchorConfig['side'] };
            const targetAnchor: AnchorConfig = { mode: 'auto', side: targetSide as AnchorConfig['side'] };
            const sourceIndex = getNextFreeHandleIndex(connection.source!, sourceSide, 'source', currentEdges);
            const targetIndex = getNextFreeHandleIndex(connection.target!, targetSide, 'target', currentEdges);

            // ── JjOM mode: create in JjOM FIRST, then use the real IDs ──
            // This avoids a race condition where the sync sees the DEdge
            // before markDropCreated is called, causing duplicates.
            let edgeId: string;

            if (isJjomMode) {
                let dEdgeId: string | null = null;
                if (isInheritance) {
                    dEdgeId = syncInheritanceEdge(connection.source!, connection.target!);
                } else {
                    dEdgeId = syncReferenceEdge(connection.source!, connection.target!, 'newRef', choice);
                }
                if (!dEdgeId) {
                    console.warn('[EditorV2] Failed to create JjOM edge');
                    setPendingConnection(null);
                    return;
                }
                edgeId = dEdgeId;
            } else {
                edgeId = isInheritance ? `inh_${Date.now()}` : `ref_${Date.now()}`;
            }

            const newEdge: Edge = {
                id: edgeId,
                source: connection.source!,
                target: connection.target!,
                sourceHandle: `${sourceSide}-${sourceIndex}`,
                targetHandle: `${targetSide}-${targetIndex}`,
                type: edgeType,
                ...(edgeType === 'reference' ? {
                    label: 'newRef',
                    data: {
                        reference: {
                            id: edgeId,
                            name: 'newRef',
                            kind: choice as ReferenceKind,
                            targetClassId: connection.target!,
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

            setEdges((eds) => applyDistribution([...eds, newEdge]));
            setPendingConnection(null);
        },
        [pendingConnection, setEdges, getEdges, takeSnapshot, getOptimalAnchors, applyDistribution, isJjomMode]
    );

    const handleEdgeTypeCancelled = useCallback(() => {
        setPendingConnection(null);
    }, []);

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

                switch (rawType) {
                    case 'classNode':
                        vertexId = syncCreateClass(graphId, position.x, position.y, false);
                        nodeType = 'classNode';
                        defaultLabel = 'NewClass';
                        nodeData = { label: defaultLabel, isAbstract: false, attributes: [], autoEdit: true };
                        break;
                    case 'classNode:abstract':
                        vertexId = syncCreateClass(graphId, position.x, position.y, true);
                        nodeType = 'classNode';
                        defaultLabel = 'NewAbstractClass';
                        nodeData = { label: defaultLabel, isAbstract: true, attributes: [], autoEdit: true };
                        break;
                    case 'enumNode':
                        vertexId = syncCreateEnum(graphId, position.x, position.y);
                        nodeType = 'enumNode';
                        defaultLabel = 'NewEnum';
                        nodeData = { label: defaultLabel, literals: [], autoEdit: true };
                        break;
                    case 'packageNode':
                        vertexId = syncCreatePackage(graphId, position.x, position.y);
                        nodeType = 'packageNode';
                        defaultLabel = 'NewPackage';
                        nodeData = { label: defaultLabel, autoEdit: true };
                        break;
                    default:
                        return;
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
        [screenToFlowPosition, setNodes, takeSnapshot, isJjomMode, graphId]
    );

    // Allow drop
    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // Delete selected nodes and edges
    const deleteSelected = useCallback(() => {
        const selectedNodes = getNodes().filter((n) => n.selected);
        const selectedEdges = getEdges().filter((e) => e.selected);

        if (selectedNodes.length > 0 || selectedEdges.length > 0) {
            takeSnapshot();
            const nodeIds = new Set(selectedNodes.map((n) => n.id));

            setNodes((nds) => nds.filter((n) => !nodeIds.has(n.id)));
            setEdges((eds) => applyDistribution(
                eds.filter(
                    (e) =>
                        !selectedEdges.some((se) => se.id === e.id) &&
                        !nodeIds.has(e.source) &&
                        !nodeIds.has(e.target)
                )
            ));

            // Phase 3: sync deletions to JjOM
            if (isJjomMode) {
                for (const edge of selectedEdges) {
                    syncDeleteEdge(edge.id, edge.type === 'inheritance');
                }
                for (const node of selectedNodes) {
                    syncDeleteVertex(node.id);
                }
            }
        }
    }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot, applyDistribution, isJjomMode]);

    // Delete specific node by ID
    const deleteNode = useCallback(
        (nodeId: string) => {
            takeSnapshot();
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) => applyDistribution(
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            ));
            // Phase 3: sync to JjOM
            if (isJjomMode) syncDeleteVertex(nodeId);
        },
        [setNodes, setEdges, takeSnapshot, applyDistribution, isJjomMode]
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

    // Undo handler
    const handleUndo = useCallback(() => {
        const state = undo();
        if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            forceUpdate({});
        }
    }, [undo, setNodes, setEdges]);

    // Redo handler
    const handleRedo = useCallback(() => {
        const state = redo();
        if (state) {
            setNodes(state.nodes);
            setEdges(state.edges);
            forceUpdate({});
        }
    }, [redo, setNodes, setEdges]);

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
            setContextMenu({ x: event.clientX, y: event.clientY, edgeId: edge.id });
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

        // Single node context menu
        if (contextMenu?.nodeId) {
            return [
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
            ];
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

    // Toolbar handlers
    const handleZoomIn = useCallback(() => zoomIn(), [zoomIn]);
    const handleZoomOut = useCallback(() => zoomOut(), [zoomOut]);
    const handleResetZoom = useCallback(() => {
        fitView({ padding: 0.2, maxZoom: 1, duration: 200 });
    }, [fitView]);
    const handleFitView = useCallback(() => fitView({ padding: 0.2, maxZoom: 1, duration: 200 }), [fitView]);
    const handleToggleSnap = useCallback(() => setSnapEnabled((prev) => !prev), []);

    // Properties panel handlers
    const handleNodeChange = useCallback(
        (nodeId: string, data: any) => {
            takeSnapshot();
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
                )
            );
        },
        [setNodes, takeSnapshot]
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
                              label: 'newRef',
                              data: {
                                  reference: {
                                      id: e.id,
                                      name: 'newRef',
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
            const hasDragEnd = changes.some(
                (c) => c.type === 'position' && c.dragging === false
            );
            const hasResize = changes.some((c) => c.type === 'dimensions');

            if (hasDragEnd || hasResize) {
                takeSnapshot();

                const movedNodeIds = new Set(
                    changes
                        .filter((c) => c.type === 'position' || c.type === 'dimensions')
                        .map((c) => c.id)
                );

                const nodeRects = new Map(
                    nodes.map((n) => [n.id, getNodeRect(n)])
                );

                setEdges((currentEdges) => {
                    const edgesToRecalculate = currentEdges.filter(
                        (e) => (movedNodeIds.has(e.source) || movedNodeIds.has(e.target))
                            // Skip edges optimized by OAA — let the hook handle them
                            && !(e.data as any)?.oaaOptimized
                    );

                    if (edgesToRecalculate.length === 0) return currentEdges;

                    const anchorResults = computeAnchorsWithHysteresis(edgesToRecalculate, nodeRects);

                    const updated = currentEdges.map((edge) => {
                        const result = anchorResults.get(edge.id);
                        if (result) {
                            const currentSrcSide = edge.sourceHandle?.split('-')[0];
                            const currentTgtSide = edge.targetHandle?.split('-')[0];
                            const sidesChanged = currentSrcSide !== result.sourceHandle
                                || currentTgtSide !== result.targetHandle;

                            return {
                                ...edge,
                                sourceHandle: `${result.sourceHandle}-0`,
                                targetHandle: `${result.targetHandle}-0`,
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
                    return applyDistribution(updated);
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
                        const node = nodes.find((n) => n.id === c.id);
                        const w = c.dimensions?.width ?? node?.measured?.width;
                        const h = c.dimensions?.height ?? node?.measured?.height;
                        if (w !== undefined && h !== undefined) {
                            syncSizeToJjom(c.id, w, h);
                        }
                    }
                }
            }

            onNodesChange(changes);
        },
        [onNodesChange, takeSnapshot, setEdges, nodes, applyDistribution, isJjomMode]
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

                const anchorResults = computeAnchorsWithHysteresis([edge], nodeRectsMap);
                const result = anchorResults.get(edgeId);
                if (!result) return currentEdges;

                const currentSrcSide = edge.sourceHandle?.split('-')[0];
                const currentTgtSide = edge.targetHandle?.split('-')[0];
                const sidesChanged = currentSrcSide !== result.sourceHandle
                    || currentTgtSide !== result.targetHandle;

                if (!sidesChanged) return currentEdges;

                const updated = currentEdges.map(e => {
                    if (e.id !== edgeId) return e;
                    return {
                        ...e,
                        sourceHandle: `${result.sourceHandle}-0`,
                        targetHandle: `${result.targetHandle}-0`,
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

    const editorContextValue = useMemo(() => ({ takeSnapshot, notation, onEdgeDataChange: handleEdgeChange, recalculateAnchors }), [takeSnapshot, notation, handleEdgeChange, recalculateAnchors]);

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
                <PalettePanel />
                <div className="editor-v2__main">
                    <Toolbar
                        snapEnabled={snapEnabled}
                        onToggleSnap={handleToggleSnap}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onResetZoom={handleResetZoom}
                        onFitView={handleFitView}
                        onDeleteSelected={deleteSelected}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
                        theme={theme}
                        onToggleTheme={handleToggleTheme}
                        notation={notation}
                        onNotationChange={setNotation}
                        colorScheme={colorScheme}
                        onColorSchemeChange={setColorScheme}
                    />
                    <AlignmentToolbar
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
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={16}
                                size={1}
                                color={theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                            />
                            <MiniMap
                                position="bottom-right"
                                nodeStrokeWidth={3}
                                nodeColor={(node) => {
                                    if (node.type === 'classNode') return theme === 'dark' ? '#0ea5e9' : '#0284c7';
                                    if (node.type === 'enumNode') return '#7c3aed';
                                    if (node.type === 'packageNode') return theme === 'dark' ? '#64748b' : '#94a3b8';
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
                    </div>
                </div>

                <PropertiesPanel
                    selectedNodes={selectedNodes}
                    selectedEdges={selectedEdges}
                    onNodeChange={handleNodeChange}
                    onEdgeChange={handleEdgeChange}
                    onConvertToInheritance={convertToInheritance}
                    onConvertToReference={convertToReference}
                    isJjomMode={isJjomMode}
                    modelInfo={modelInfoData}
                    onModelNameChange={handleModelNameChange}
                    onModelUriChange={handleModelUriChange}
                />

                {contextMenu && (
                    <ContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={getContextMenuItems()}
                        onClose={closeContextMenu}
                    />
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
            <ObstacleGridProvider>
                <EditorV2Inner modelid={modelid} onSwitchEditor={onSwitchEditor} />
            </ObstacleGridProvider>
        </ReactFlowProvider>
    );
}

export default EditorV2;
export { EditorV2 };
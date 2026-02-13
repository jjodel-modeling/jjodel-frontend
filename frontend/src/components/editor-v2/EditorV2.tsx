import React, { useCallback, useRef, useState, useMemo, useEffect } from 'react';
import {
    ReactFlow,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    SelectionMode,
    ConnectionMode,
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
import ReferenceEdge from './edges/ReferenceEdge';
import InheritanceEdge from './edges/InheritanceEdge';
import PalettePanel from './panels/PalettePanel';
import PropertiesPanel from './panels/PropertiesPanel';
import Toolbar from './Toolbar';
import AlignmentToolbar from './AlignmentToolbar';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { useHistory } from './hooks/useHistory';
import { useAlignment } from './hooks/useAlignment';
import { useAutoAnchor } from './hooks/useAutoAnchor';
import { EditorContext } from './contexts/EditorContext';
import type { ClassNodeData, EnumNodeData, PackageNodeData, ReferenceEdgeData, InheritanceEdgeData } from './types';

import './EditorV2.scss';

// Register custom node types
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    enumNode: EnumNode,
    packageNode: PackageNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
    reference: ReferenceEdge,
    inheritance: InheritanceEdge,
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
    // Person -> Address (composition)
    {
        id: 'ref_1',
        source: 'class_1',
        target: 'class_2',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'reference',
        label: 'addresses',
        data: {
            reference: {
                id: 'ref_1',
                name: 'addresses',
                kind: 'composition',
                targetClassId: 'class_2',
                lowerBound: 0,
                upperBound: -1,
                containment: true,
            },
        } as ReferenceEdgeData,
    },
    // Person extends NamedElement (inheritance)
    {
        id: 'inh_1',
        source: 'class_1',
        target: 'class_3',
        sourceHandle: 'bottom',
        targetHandle: 'top',
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

/**
 * Inner editor component that uses React Flow hooks.
 * Must be wrapped in ReactFlowProvider.
 */
function EditorV2Inner() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition, getNodes, getEdges, zoomIn, zoomOut, fitView, getViewport, setViewport } = useReactFlow();
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const [connectionMode, setConnectionMode] = useState<'reference' | 'inheritance'>('reference');
    const clipboard = useRef<ClipboardState>({ nodes: [], edges: [] });

    // Theme state with localStorage persistence
    const [theme, setTheme] = useState<'dark' | 'light'>(() => {
        const saved = localStorage.getItem('editor-v2-theme');
        return (saved === 'light' || saved === 'dark') ? saved : 'dark';
    });

    useEffect(() => {
        localStorage.setItem('editor-v2-theme', theme);
    }, [theme]);

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

    // Get selected nodes and edges for properties panel
    const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);

    // Handle new connections between nodes - creates reference or inheritance edge
    const onConnect = useCallback(
        (connection: Connection) => {
            takeSnapshot();

            if (connectionMode === 'inheritance') {
                const newEdge: Edge = {
                    id: `inh_${Date.now()}`,
                    source: connection.source!,
                    target: connection.target!,
                    sourceHandle: connection.sourceHandle,
                    targetHandle: connection.targetHandle,
                    type: 'inheritance',
                    data: {} as InheritanceEdgeData,
                };
                setEdges((eds) => addEdge(newEdge, eds));
            } else {
                const newEdge: Edge = {
                    id: `ref_${Date.now()}`,
                    source: connection.source!,
                    target: connection.target!,
                    sourceHandle: connection.sourceHandle,
                    targetHandle: connection.targetHandle,
                    type: 'reference',
                    label: 'newRef',
                    data: {
                        reference: {
                            id: `ref_${Date.now()}`,
                            name: 'newRef',
                            kind: 'association',
                            targetClassId: connection.target!,
                            lowerBound: 0,
                            upperBound: -1,
                            containment: false,
                        },
                    } as ReferenceEdgeData,
                };
                setEdges((eds) => addEdge(newEdge, eds));
            }
        },
        [connectionMode, setEdges, takeSnapshot]
    );

    // Handle drop from palette
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const rawType = event.dataTransfer.getData('application/reactflow');
            if (!rawType) return;

            // Members must be dropped on nodes, not canvas
            if (['attribute', 'operation', 'literal'].includes(rawType)) return;

            takeSnapshot();

            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

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
                        } as PackageNodeData,
                    };
                    break;

                default:
                    return;
            }

            setNodes((nds) => [...nds, newNode]);
        },
        [screenToFlowPosition, setNodes, takeSnapshot]
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
            setEdges((eds) =>
                eds.filter(
                    (e) =>
                        !selectedEdges.some((se) => se.id === e.id) &&
                        !nodeIds.has(e.source) &&
                        !nodeIds.has(e.target)
                )
            );
        }
    }, [getNodes, getEdges, setNodes, setEdges, takeSnapshot]);

    // Delete specific node by ID
    const deleteNode = useCallback(
        (nodeId: string) => {
            takeSnapshot();
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) =>
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
        },
        [setNodes, setEdges, takeSnapshot]
    );

    // Delete specific edge by ID
    const deleteEdge = useCallback(
        (edgeId: string) => {
            takeSnapshot();
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        },
        [setEdges, takeSnapshot]
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
    }, []);

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
        const { x, y } = getViewport();
        setViewport({ x, y, zoom: 1 });
    }, [getViewport, setViewport]);
    const handleFitView = useCallback(() => fitView({ padding: 0.2 }), [fitView]);
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
            setEdges((eds) =>
                eds.map((e) => (e.id === edgeId ? { ...e, ...data } : e))
            );
        },
        [setEdges, takeSnapshot]
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

                // Get IDs of moved/resized nodes
                const movedNodeIds = new Set(
                    changes
                        .filter((c) => c.type === 'position' || c.type === 'dimensions')
                        .map((c) => c.id)
                );

                // Recalculate optimal anchors for edges connected to moved nodes
                setEdges((currentEdges) =>
                    currentEdges.map((edge) => {
                        if (movedNodeIds.has(edge.source) || movedNodeIds.has(edge.target)) {
                            const { sourceHandle, targetHandle } = getOptimalAnchors(
                                edge.source,
                                edge.target
                            );
                            return { ...edge, sourceHandle, targetHandle };
                        }
                        return edge;
                    })
                );
            }
            onNodesChange(changes);
        },
        [onNodesChange, takeSnapshot, setEdges, getOptimalAnchors]
    );

    const editorContextValue = useMemo(() => ({ takeSnapshot }), [takeSnapshot]);

    return (
        <EditorContext.Provider value={editorContextValue}>
            <div className={`editor-v2 theme-${theme}`} tabIndex={0} onKeyDown={onKeyDown}>
                <PalettePanel
                    connectionMode={connectionMode}
                    onConnectionModeChange={setConnectionMode}
                />
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
                    <div className="editor-v2__canvas" ref={reactFlowWrapper}>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={handleNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onNodeContextMenu={onNodeContextMenu}
                            onEdgeContextMenu={onEdgeContextMenu}
                            onPaneClick={onPaneClick}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            defaultEdgeOptions={defaultEdgeOptions}
                            connectionMode={ConnectionMode.Loose}
                            fitView
                            fitViewOptions={{ padding: 0.2 }}
                            snapToGrid={snapEnabled}
                            snapGrid={[16, 16]}
                            multiSelectionKeyCode="Shift"
                            selectionMode={SelectionMode.Partial}
                            panOnDrag={[0, 1, 2]}
                            deleteKeyCode={null}
                        >
                            <Background
                                variant={BackgroundVariant.Dots}
                                gap={16}
                                size={1}
                                color={theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}
                            />
                            <MiniMap
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
                    </div>
                </div>

                <PropertiesPanel
                    selectedNodes={selectedNodes}
                    selectedEdges={selectedEdges}
                    onNodeChange={handleNodeChange}
                    onEdgeChange={handleEdgeChange}
                    onConvertToInheritance={convertToInheritance}
                    onConvertToReference={convertToReference}
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
function EditorV2() {
    return (
        <ReactFlowProvider>
            <EditorV2Inner />
        </ReactFlowProvider>
    );
}

export default EditorV2;

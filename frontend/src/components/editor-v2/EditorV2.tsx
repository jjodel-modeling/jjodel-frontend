import React, { useCallback, useRef, useState, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    MiniMap,
    useNodesState,
    useEdgesState,
    addEdge,
    useReactFlow,
    ReactFlowProvider,
    MarkerType,
    SelectionMode,
    type Node,
    type Edge,
    type Connection,
    type NodeTypes,
    type EdgeTypes,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ClassNode, { type ClassNodeData } from './nodes/ClassNode';
import NestedFlowNode, { type NestedFlowNodeData } from './nodes/NestedFlowNode';
import ManhattanEdge from './edges/ManhattanEdge';
import PalettePanel from './panels/PalettePanel';
import PropertiesPanel from './panels/PropertiesPanel';
import Toolbar from './Toolbar';
import ContextMenu from './ContextMenu';
import { useHistory } from './hooks/useHistory';
import { EditorContext } from './contexts/EditorContext';

import './EditorV2.scss';

// Register custom node types
const nodeTypes: NodeTypes = {
    classNode: ClassNode,
    nestedFlowNode: NestedFlowNode,
};

// Register custom edge types
const edgeTypes: EdgeTypes = {
    manhattan: ManhattanEdge,
};

// Initial nodes for demonstration (including Obstacle node for testing routing)
const initialNodes: Node[] = [
    {
        id: '1',
        type: 'classNode',
        position: { x: 100, y: 100 },
        data: {
            label: 'Person',
            attributes: [
                { name: 'name', type: 'EString' },
                { name: 'age', type: 'EInt' },
            ],
        } as ClassNodeData,
    },
    {
        id: '2',
        type: 'classNode',
        position: { x: 500, y: 100 },
        data: {
            label: 'Address',
            attributes: [
                { name: 'street', type: 'EString' },
                { name: 'city', type: 'EString' },
            ],
        } as ClassNodeData,
    },
    {
        id: '5',
        type: 'classNode',
        position: { x: 300, y: 100 },
        data: {
            label: 'Obstacle',
            attributes: [{ name: 'test', type: 'EBool' }],
        } as ClassNodeData,
    },
    {
        id: '3',
        type: 'nestedFlowNode',
        position: { x: 100, y: 350 },
        data: {
            label: 'StateMachine',
            children: [
                { id: 'inner-1', label: 'Idle', position: { x: 20, y: 40 } },
                { id: 'inner-2', label: 'Running', position: { x: 150, y: 40 } },
            ],
        } as NestedFlowNodeData,
    },
    {
        id: '4',
        type: 'classNode',
        position: { x: 500, y: 350 },
        data: {
            label: 'CustomRendered',
            jsxString: `React.createElement('div', {
                style: { padding: '12px', background: 'linear-gradient(135deg, #0ea5e9, #334155)', borderRadius: '8px', color: 'white', width: '100%', height: '100%', boxSizing: 'border-box' }
            },
                React.createElement('h4', { style: { margin: 0 } }, data.label),
                React.createElement('p', { style: { margin: '4px 0 0', fontSize: '11px', opacity: 0.8 } }, 'Rendered via viewpoint')
            )`,
        } as ClassNodeData,
    },
];

// Initial edges for demonstration
const initialEdges: Edge[] = [
    {
        id: 'e1-2',
        source: '1',
        target: '2',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'manhattan',
        label: 'livesAt',
    },
];

// Default edge options with arrow marker
const defaultEdgeOptions = {
    type: 'manhattan',
    markerEnd: {
        type: MarkerType.ArrowClosed,
        color: 'rgba(255, 255, 255, 0.5)',
        width: 20,
        height: 20,
    },
    style: {
        strokeWidth: 1.5,
    },
};

// Context menu state type
interface ContextMenuState {
    x: number;
    y: number;
    nodeId?: string;
    edgeId?: string;
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
    const { screenToFlowPosition, getNodes, getEdges, zoomIn, zoomOut, fitView } = useReactFlow();
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const [snapEnabled, setSnapEnabled] = useState(true);
    const clipboard = useRef<ClipboardState>({ nodes: [], edges: [] });

    // History for undo/redo
    const { takeSnapshot, undo, redo, canUndo, canRedo } = useHistory(getNodes, getEdges);
    // Force re-render to update canUndo/canRedo
    const [, forceUpdate] = useState({});

    // Get selected nodes and edges for properties panel
    const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
    const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);

    // Handle new connections between nodes
    const onConnect = useCallback(
        (connection: Connection) => {
            takeSnapshot();
            const newEdge: Edge = {
                ...connection,
                id: `e_${Date.now()}`,
                type: 'manhattan',
            } as Edge;
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [setEdges, takeSnapshot]
    );

    // Handle drop from palette
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

            takeSnapshot();

            // Convert screen coordinates to flow coordinates (accounts for pan/zoom)
            const position = screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let newNode: Node;

            if (type === 'classNode') {
                newNode = {
                    id: `node_${Date.now()}`,
                    type: 'classNode',
                    position,
                    data: {
                        label: 'NewClass',
                        attributes: [],
                    } as ClassNodeData,
                };
            } else if (type === 'nestedFlowNode') {
                newNode = {
                    id: `node_${Date.now()}`,
                    type: 'nestedFlowNode',
                    position,
                    data: {
                        label: 'Container',
                        children: [],
                    } as NestedFlowNodeData,
                };
            } else {
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
            // Remove selected edges + edges connected to deleted nodes
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
                id: `node_${Date.now()}`,
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

        // Also include edges between selected nodes
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

        // Create new nodes with offset and new IDs
        const newNodes = clipboard.current.nodes.map((node, i) => {
            const newId = `node_${now}_${i}`;
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

        // Create new edges with updated source/target IDs
        const newEdges = clipboard.current.edges
            .filter((e) => idMap.has(e.source) && idMap.has(e.target))
            .map((edge, i) => ({
                ...edge,
                id: `e_${now}_${i}`,
                source: idMap.get(edge.source)!,
                target: idMap.get(edge.target)!,
                selected: false,
            }));

        // Deselect existing and add new
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
            // Don't handle if we're in an input field
            if ((event.target as HTMLElement).tagName === 'INPUT') return;

            const isMod = event.ctrlKey || event.metaKey;

            // Delete
            if (event.key === 'Delete' || event.key === 'Backspace') {
                deleteSelected();
                return;
            }

            // Undo: Ctrl+Z
            if (isMod && event.key === 'z' && !event.shiftKey) {
                event.preventDefault();
                handleUndo();
                return;
            }

            // Redo: Ctrl+Shift+Z or Ctrl+Y
            if (isMod && ((event.key === 'z' && event.shiftKey) || event.key === 'y')) {
                event.preventDefault();
                handleRedo();
                return;
            }

            // Copy: Ctrl+C
            if (isMod && event.key === 'c') {
                event.preventDefault();
                copySelected();
                return;
            }

            // Cut: Ctrl+X
            if (isMod && event.key === 'x') {
                event.preventDefault();
                cutSelected();
                return;
            }

            // Paste: Ctrl+V
            if (isMod && event.key === 'v') {
                event.preventDefault();
                pasteClipboard();
                return;
            }

            // Select All: Ctrl+A
            if (isMod && event.key === 'a') {
                event.preventDefault();
                selectAll();
                return;
            }
        },
        [deleteSelected, handleUndo, handleRedo, copySelected, cutSelected, pasteClipboard, selectAll]
    );

    // Context menu handlers
    const onNodeContextMenu = useCallback(
        (event: React.MouseEvent, node: Node) => {
            event.preventDefault();
            setContextMenu({ x: event.clientX, y: event.clientY, nodeId: node.id });
        },
        []
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

    // Build context menu items based on what was clicked
    const getContextMenuItems = () => {
        if (contextMenu?.nodeId) {
            return [
                {
                    label: 'Duplicate',
                    icon: 'bi-copy',
                    onClick: () => duplicateNode(contextMenu.nodeId!),
                },
                {
                    label: 'Delete node',
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => deleteNode(contextMenu.nodeId!),
                },
            ];
        }
        if (contextMenu?.edgeId) {
            return [
                {
                    label: 'Delete edge',
                    icon: 'bi-trash',
                    danger: true,
                    onClick: () => deleteEdge(contextMenu.edgeId!),
                },
            ];
        }
        return [];
    };

    // Toolbar handlers
    const handleZoomIn = useCallback(() => {
        zoomIn();
    }, [zoomIn]);

    const handleZoomOut = useCallback(() => {
        zoomOut();
    }, [zoomOut]);

    const handleFitView = useCallback(() => {
        fitView({ padding: 0.2 });
    }, [fitView]);

    const handleToggleSnap = useCallback(() => {
        setSnapEnabled((prev) => !prev);
    }, []);

    // Properties panel handlers
    const handleNodeChange = useCallback(
        (nodeId: string, data: Partial<ClassNodeData | NestedFlowNodeData>) => {
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

    // Take snapshot on node/edge changes that matter (drag end, resize end)
    const handleNodesChange = useCallback(
        (changes: any[]) => {
            // Check if any change is a position change that just ended (drag end)
            const hasDragEnd = changes.some(
                (c) => c.type === 'position' && c.dragging === false
            );
            // Check if any change is a dimensions change (resize)
            const hasResize = changes.some((c) => c.type === 'dimensions');

            if (hasDragEnd || hasResize) {
                takeSnapshot();
            }
            onNodesChange(changes);
        },
        [onNodesChange, takeSnapshot]
    );

    // Context value for child components (e.g., ClassNode) to take snapshots
    const editorContextValue = useMemo(() => ({ takeSnapshot }), [takeSnapshot]);

    return (
        <EditorContext.Provider value={editorContextValue}>
            <div className="editor-v2" tabIndex={0} onKeyDown={onKeyDown}>
                <PalettePanel />
                <div className="editor-v2__main">
                    <Toolbar
                        snapEnabled={snapEnabled}
                        onToggleSnap={handleToggleSnap}
                        onZoomIn={handleZoomIn}
                        onZoomOut={handleZoomOut}
                        onFitView={handleFitView}
                        onDeleteSelected={deleteSelected}
                        onUndo={handleUndo}
                        onRedo={handleRedo}
                        canUndo={canUndo}
                        canRedo={canRedo}
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
                                color="rgba(255, 255, 255, 0.08)"
                            />
                            <MiniMap
                                nodeStrokeWidth={3}
                                nodeColor={(node) => {
                                    if (node.type === 'classNode') return '#0ea5e9';
                                    if (node.type === 'nestedFlowNode') return '#10b981';
                                    return '#334155';
                                }}
                                maskColor="rgba(30, 41, 59, 0.8)"
                            />
                        </ReactFlow>
                    </div>
                </div>

                <PropertiesPanel
                    selectedNodes={selectedNodes}
                    selectedEdges={selectedEdges}
                    onNodeChange={handleNodeChange}
                    onEdgeChange={handleEdgeChange}
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
 * Editor V2 - React Flow based canvas editor PoC.
 * Wrapped in ReactFlowProvider to enable hooks.
 */
function EditorV2() {
    return (
        <ReactFlowProvider>
            <EditorV2Inner />
        </ReactFlowProvider>
    );
}

export default EditorV2;

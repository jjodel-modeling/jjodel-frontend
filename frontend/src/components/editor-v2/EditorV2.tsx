import React, { useCallback, useRef, useState } from 'react';
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
import Toolbar from './Toolbar';
import ContextMenu from './ContextMenu';

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

    // Handle new connections between nodes
    const onConnect = useCallback(
        (connection: Connection) => {
            const newEdge: Edge = {
                ...connection,
                id: `e_${Date.now()}`,
                type: 'manhattan',
                // sourceHandle and targetHandle come from connection automatically
            } as Edge;
            setEdges((eds) => addEdge(newEdge, eds));
        },
        [setEdges]
    );

    // Handle drop from palette
    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;

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
        [screenToFlowPosition, setNodes]
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
    }, [getNodes, getEdges, setNodes, setEdges]);

    // Delete specific node by ID
    const deleteNode = useCallback(
        (nodeId: string) => {
            setNodes((nds) => nds.filter((n) => n.id !== nodeId));
            setEdges((eds) =>
                eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
            );
        },
        [setNodes, setEdges]
    );

    // Delete specific edge by ID
    const deleteEdge = useCallback(
        (edgeId: string) => {
            setEdges((eds) => eds.filter((e) => e.id !== edgeId));
        },
        [setEdges]
    );

    // Duplicate a node
    const duplicateNode = useCallback(
        (nodeId: string) => {
            const node = getNodes().find((n) => n.id === nodeId);
            if (!node) return;

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
        [getNodes, setNodes]
    );

    // Keyboard handler for delete
    const onKeyDown = useCallback(
        (event: React.KeyboardEvent) => {
            if (event.key === 'Delete' || event.key === 'Backspace') {
                // Don't delete if we're in an input field (inline editing)
                if ((event.target as HTMLElement).tagName === 'INPUT') return;
                deleteSelected();
            }
        },
        [deleteSelected]
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

    return (
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
                />
                <div className="editor-v2__canvas" ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
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

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={getContextMenuItems()}
                    onClose={closeContextMenu}
                />
            )}
        </div>
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

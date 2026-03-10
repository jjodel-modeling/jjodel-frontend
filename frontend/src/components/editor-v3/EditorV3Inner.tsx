/**
 * Editor V3 — Inner component (inside ReactFlowProvider).
 *
 * Handles:
 * - React Flow canvas with single node type (ModelNode) and single edge type (UnifiedEdge)
 * - Bidirectional sync via useJjomSyncV3
 * - Node drag → position sync to JjOM
 * - Connection creation with edge type popup
 * - Drop handler for palette items
 * - Selection state for properties panel
 * - Context menu
 */

import React, { useCallback, useState, useRef, useMemo } from 'react';
import {
    ReactFlow,
    Background,
    BackgroundVariant,
    MiniMap,
    useNodesState,
    useEdgesState,
    useReactFlow,
    type Node,
    type Edge,
    type Connection,
    type OnConnect,
    type NodeMouseHandler,
} from '@xyflow/react';
import { ModelNode } from './nodes/ModelNode';
import { UnifiedEdge } from './edges/UnifiedEdge';
import { EdgeTypePopup, type EdgeTypeChoice } from './components/EdgeTypePopup';
import { ContextMenu, type ContextMenuState, type ContextMenuTarget } from './context-menu/ContextMenu';
import { useJjomSyncV3, type UseJjomSyncV3Result } from './sync/useJjomSyncV3';
import {
    syncPositionToJjom,
    syncPositionBatchToJjom,
    syncInheritanceEdge,
    syncReferenceEdge,
    syncCreateClass,
    syncCreateEnum,
    syncCreatePackage,
    syncCreateDataType,
    syncCreateObject,
    syncAddAttribute,
    syncAddOperation,
    syncAddLiteral,
    syncDeleteVertex,
    syncDeleteEdge,
} from './sync/canvasToJjomV3';
import { markDropCreated } from './sync/syncCoordinator';
import { useConnectionValidation } from './hooks/useConnectionValidation';
import { useEditorV3Context } from './contexts/EditorV3Context';
import type { UnifiedEdgeData, ModelNodeData } from './types';

// Register single node type
const nodeTypes = {
    modelNode: ModelNode,
};

// Register single edge type
const edgeTypes = {
    unifiedEdge: UnifiedEdge,
};

interface EditorV3InnerProps {
    onSyncResult?: (result: UseJjomSyncV3Result) => void;
    onSelectionChange?: (nodes: Node[], edges: Edge[]) => void;
}

export function EditorV3Inner({ onSyncResult, onSelectionChange }: EditorV3InnerProps) {
    const ctx = useEditorV3Context();
    const { fitView, screenToFlowPosition, getNodes, getEdges } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState([] as Node[]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([] as Edge[]);

    // Edge type popup state
    const [popup, setPopup] = useState<{ x: number; y: number; connection: Connection } | null>(null);
    const pendingConnectionRef = useRef<Connection | null>(null);

    // Context menu state
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

    // Connection validation
    const { validateConnection } = useConnectionValidation();

    // Bidirectional sync
    const syncResult = useJjomSyncV3(
        ctx.modelId,
        setNodes,
        setEdges,
        ctx.notation,
        ctx.colorScheme,
        ctx.theme,
        () => {
            // On initialized: fit view after a frame
            setTimeout(() => fitView({ padding: 0.15, duration: 300 }), 50);
        },
    );

    // Pass sync result up if needed
    React.useEffect(() => {
        onSyncResult?.(syncResult);
    }, [syncResult, onSyncResult]);

    // ── Selection tracking ──
    const handleSelectionChange = useCallback(({ nodes: selNodes, edges: selEdges }: { nodes: Node[]; edges: Edge[] }) => {
        onSelectionChange?.(selNodes, selEdges);
    }, [onSelectionChange]);

    // ── Node drag end → sync position to JjOM ──
    const handleNodeDragStop = useCallback(
        (_event: React.MouseEvent, node: Node, draggedNodes: Node[]) => {
            if (draggedNodes && draggedNodes.length > 1) {
                const updates = draggedNodes.map((n: Node) => ({
                    id: n.id,
                    x: n.position.x,
                    y: n.position.y,
                }));
                syncPositionBatchToJjom(updates);
            } else {
                syncPositionToJjom(node.id, node.position.x, node.position.y);
            }
        },
        [],
    );

    // ── Connection handler — show edge type popup ──
    const onConnect: OnConnect = useCallback((connection: Connection) => {
        if (!connection.source || !connection.target) return;

        // Store pending connection and show popup at target position
        pendingConnectionRef.current = connection;
        const targetNode = nodes.find(n => n.id === connection.target);
        if (targetNode) {
            setPopup({
                x: targetNode.position.x + (targetNode.width ?? 100) / 2,
                y: targetNode.position.y,
                connection,
            });
        }
    }, [nodes]);

    // ── Edge type selected from popup ──
    const handleEdgeTypeSelect = useCallback((kind: EdgeTypeChoice) => {
        const connection = pendingConnectionRef.current;
        if (!connection || !connection.source || !connection.target) {
            setPopup(null);
            return;
        }

        // Validate
        const validation = validateConnection(connection, kind);
        if (!validation.valid) {
            console.warn('[V3] Connection rejected:', validation.reason);
            setPopup(null);
            return;
        }

        // Create edge in RF
        const newEdge: Edge = {
            id: `e-${connection.source}-${connection.target}-${Date.now()}`,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle,
            targetHandle: connection.targetHandle,
            type: 'unifiedEdge',
            data: {
                edgeKind: kind,
                jjomEdgeId: '',
                jjomModelId: null,
                label: kind === 'inheritance' ? '' : 'newRef',
                waypoints: [],
                sourceAnchor: { mode: 'auto', side: 'right' },
                targetAnchor: { mode: 'auto', side: 'left' },
                notation: ctx.notation,
                colorScheme: ctx.colorScheme,
                theme: ctx.theme,
                autoEdit: kind !== 'inheritance',
            } as UnifiedEdgeData,
        };

        setEdges(eds => [...eds, newEdge]);

        // Sync to JjOM
        if (kind === 'inheritance') {
            syncInheritanceEdge(connection.source, connection.target);
        } else {
            syncReferenceEdge(connection.source, connection.target, kind);
        }

        setPopup(null);
        pendingConnectionRef.current = null;
    }, [validateConnection, setEdges, ctx.notation, ctx.colorScheme, ctx.theme]);

    // ── Cancel popup ──
    const handlePopupCancel = useCallback(() => {
        setPopup(null);
        pendingConnectionRef.current = null;
    }, []);

    // ── Connection validation ──
    const isValidConnection = useCallback((connection: Edge | Connection) => {
        return !!(connection.source && connection.target);
    }, []);

    // ── Drop handler for palette items ──
    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();

        const paletteType = event.dataTransfer.getData('application/jjodel-palette-type');
        if (!paletteType) return;

        const dataStr = event.dataTransfer.getData('application/jjodel-palette-data');
        const paletteData = dataStr ? JSON.parse(dataStr) : {};

        const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
        const graphId = ctx.graphId;
        if (!graphId) return;

        let vertexId: string | false = false;

        switch (paletteType) {
            case 'createClass':
                vertexId = syncCreateClass(graphId, position.x, position.y, paletteData.isAbstract ?? false);
                break;
            case 'createEnum':
                vertexId = syncCreateEnum(graphId, position.x, position.y);
                break;
            case 'createPackage':
                vertexId = syncCreatePackage(graphId, position.x, position.y);
                break;
            case 'createDataType':
                vertexId = syncCreateDataType(graphId, position.x, position.y);
                break;
            case 'createObject':
                vertexId = syncCreateObject(graphId, paletteData.classId, position.x, position.y);
                break;
            case 'addAttribute': {
                // Drop on a node: find the node under the cursor
                const targetNode = findNodeAtPosition(nodes, position);
                if (targetNode) {
                    syncAddAttribute(targetNode.id);
                }
                break;
            }
            case 'addOperation': {
                const targetNode = findNodeAtPosition(nodes, position);
                if (targetNode) {
                    syncAddOperation(targetNode.id);
                }
                break;
            }
            case 'addLiteral': {
                const targetNode = findNodeAtPosition(nodes, position);
                if (targetNode) {
                    syncAddLiteral(targetNode.id);
                }
                break;
            }
        }

        if (vertexId) {
            markDropCreated(vertexId);
        }
    }, [screenToFlowPosition, ctx.graphId, nodes]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    // ── Context menu ──
    const handleNodeContextMenu: NodeMouseHandler = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            target: { type: 'node', node },
        });
    }, []);

    const handleEdgeContextMenu = useCallback((event: React.MouseEvent, edge: Edge) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            target: { type: 'edge', edge },
        });
    }, []);

    const handlePaneContextMenu = useCallback((event: React.MouseEvent | MouseEvent) => {
        event.preventDefault();
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            target: { type: 'canvas' },
        });
    }, []);

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu(null);
    }, []);

    const handleFitView = useCallback(() => {
        fitView({ padding: 0.15, duration: 300 });
    }, [fitView]);

    // ── Delete key handler ──
    const handleDelete = useCallback((event: React.KeyboardEvent) => {
        // React Flow handles this via deleteKeyCode, but we also need to sync to JjOM
        // This is handled by onEdgesChange/onNodesChange delete events
    }, []);

    // Show empty state message only when a modelId is provided but graph isn't ready yet
    if (ctx.modelId && !syncResult.isJjomMode && !syncResult.hasGraph) {
        return (
            <div className="v3-empty-state">
                Initializing graph for model...
            </div>
        );
    }

    return (
        <>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                defaultEdgeOptions={{ type: 'unifiedEdge' }}
                onNodeDragStop={handleNodeDragStop}
                onConnect={onConnect}
                isValidConnection={isValidConnection}
                onSelectionChange={handleSelectionChange}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeContextMenu={handleNodeContextMenu}
                onEdgeContextMenu={handleEdgeContextMenu}
                onPaneContextMenu={handlePaneContextMenu}
                snapToGrid={ctx.snapToGrid}
                snapGrid={[ctx.gridSize, ctx.gridSize]}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                minZoom={0.1}
                maxZoom={4}
                deleteKeyCode={['Backspace', 'Delete']}
                multiSelectionKeyCode="Shift"
                selectionKeyCode="Shift"
                className={`v3-theme--${ctx.theme}`}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={ctx.gridSize}
                    size={1}
                    color={ctx.theme === 'dark' ? '#334155' : '#e2e8f0'}
                />
                <MiniMap
                    nodeStrokeWidth={3}
                    zoomable
                    pannable
                    style={{
                        background: ctx.theme === 'dark' ? '#1e293b' : '#f1f5f9',
                    }}
                />
            </ReactFlow>

            {/* Edge type popup */}
            {popup && (
                <EdgeTypePopup
                    x={popup.x}
                    y={popup.y}
                    onSelect={handleEdgeTypeSelect}
                    onCancel={handlePopupCancel}
                />
            )}

            {/* Context menu */}
            {contextMenu && (
                <ContextMenu
                    state={contextMenu}
                    onClose={handleCloseContextMenu}
                    onFitView={handleFitView}
                />
            )}
        </>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Find the node at a given flow position (simple hit-test). */
function findNodeAtPosition(nodes: Node[], position: { x: number; y: number }): Node | undefined {
    // Search in reverse order (top-most nodes first)
    for (let i = nodes.length - 1; i >= 0; i--) {
        const node = nodes[i];
        const w = node.width ?? (node.data as any)?.width ?? 200;
        const h = node.height ?? (node.data as any)?.height ?? 120;

        if (
            position.x >= node.position.x &&
            position.x <= node.position.x + w &&
            position.y >= node.position.y &&
            position.y <= node.position.y + h
        ) {
            return node;
        }
    }
    return undefined;
}

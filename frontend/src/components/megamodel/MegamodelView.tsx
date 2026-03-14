/**
 * MegamodelView — Interactive diagram of all project artifacts.
 *
 * Reads from the runtime megamodel (metamodels, models, transformations) plus
 * viewpoints from the project. Uses ELK for initial layout and supports
 * drag-to-reposition, middle-click pan, and scroll zoom.
 *
 * Phase 2: context menu (right-click) on nodes and canvas, inline rename,
 * delete confirmation dialog, keyboard shortcuts.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { Megamodel, MegamodelEdge as MegaEdge, ArtifactType } from '../../model/megamodel';
import MegamodelNode from './MegamodelNode';
import MegamodelContextMenu, { type MenuItem } from './MegamodelContextMenu';
import {
    NODE_W, NODE_H,
    type MmNode, type MmEdge, type MmEdgeType, type MmNodeKind, type MmNodeStats, type MmNodeStatus, type Side, type Point,
    EDGE_STYLES,
    getPort, spreadAnchors, routePoints, buildRoundedPath, labelMidpoint,
} from './MegamodelEdge';
import './MegamodelView.scss';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ArtifactStats {
    id: string;
    stats: MmNodeStats;
    status: MmNodeStatus;
}

export interface MegamodelViewProps {
    megamodel: Megamodel;
    viewpoints?: Array<{ id: string; name: string; isOverlay?: boolean }>;
    artifactStats?: ArtifactStats[];
    onClose: () => void;
    onOpenNode?: (nodeId: string, nodeKind: MmNodeKind) => void;
    // Phase 2: action callbacks
    onDeleteNode?: (nodeId: string, nodeKind: MmNodeKind) => void;
    onRenameNode?: (nodeId: string, nodeKind: MmNodeKind, newName: string) => void;
    onDuplicateNode?: (nodeId: string, nodeKind: MmNodeKind) => void;
    onRunTransformation?: (nodeId: string) => void;
    onCreateMetamodel?: () => void;
    onCreateModel?: () => void;
    onImport?: () => void;
}

// ─── Artifact → MmNode mapping ───────────────────────────────────────────────

const BADGE: Record<MmNodeKind, { label: string; typeLabel: string }> = {
    metamodel:       { label: 'M', typeLabel: 'Metamodel' },
    model:           { label: 'm', typeLabel: 'Model' },
    transformation:  { label: '⇌', typeLabel: 'Transformation' },
    viewpoint:       { label: 'V', typeLabel: 'Viewpoint' },
};

function artifactTypeToKind(type: ArtifactType): MmNodeKind {
    if (type === 'script') return 'transformation';
    return type as MmNodeKind;
}

// ─── Edge side heuristics ─────────────────────────────────────────────────────

function edgeSides(type: MmEdgeType): { fromSide: Side; toSide: Side } {
    switch (type) {
        case 'conformsTo':  return { fromSide: 'top',    toSide: 'bottom' };
        case 'inputOf':     return { fromSide: 'right',  toSide: 'left' };
        case 'outputOf':    return { fromSide: 'right',  toSide: 'left' };
        case 'definedOn':   return { fromSide: 'top',    toSide: 'bottom' };
        case 'renderedBy':  return { fromSide: 'bottom', toSide: 'top' };
        case 'generatedBy': return { fromSide: 'bottom', toSide: 'top' };
        case 'sourceOf':    return { fromSide: 'left',   toSide: 'right' };
    }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTimeAgo(timestamp: number): string {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

// ─── Default stats/status ────────────────────────────────────────────────────

const DEFAULT_STATUS: MmNodeStatus = { type: 'info', label: '' };

// ─── Build nodes & edges from Megamodel ───────────────────────────────────────

function buildGraph(
    megamodel: Megamodel,
    viewpoints: MegamodelViewProps['viewpoints'],
    statsMap: Map<string, ArtifactStats>,
): { nodes: MmNode[]; edges: MmEdge[] } {
    const nodeMap = new Map<string, MmNode>();

    // Collect nodes from megamodel edges
    for (const edge of megamodel.edges) {
        for (const ref of [edge.source, edge.target]) {
            if (!nodeMap.has(ref.id)) {
                const kind = artifactTypeToKind(ref.type);
                const badge = BADGE[kind];
                const artStats = statsMap.get(ref.id);
                nodeMap.set(ref.id, {
                    id: ref.id,
                    kind,
                    name: ref.name || 'Unnamed',
                    badgeLabel: badge.label,
                    typeLabel: badge.typeLabel,
                    x: 0, y: 0,
                    stats: artStats?.stats ?? {},
                    status: artStats?.status ?? DEFAULT_STATUS,
                });
            }
        }
    }

    // Add user-defined viewpoints (exclude Default / Default Validation)
    if (viewpoints) {
        for (const vp of viewpoints) {
            if (vp.name === 'Default' || vp.name === 'Validation default' || vp.name === 'Default Validation') continue;
            if (!nodeMap.has(vp.id)) {
                const badge = BADGE.viewpoint;
                nodeMap.set(vp.id, {
                    id: vp.id,
                    kind: 'viewpoint',
                    name: vp.name || 'Unnamed',
                    badgeLabel: badge.label,
                    typeLabel: badge.typeLabel,
                    x: 0, y: 0,
                    stats: {},
                    status: DEFAULT_STATUS,
                });
            }
        }
    }

    // Build edges + detect generated models
    const edges: MmEdge[] = [];
    const generatedModels = new Map<string, { transformationName: string; timestamp?: number }>();

    for (const edge of megamodel.edges) {
        const mmType = mapEdgeType(edge.type);
        if (!mmType) continue;
        const styleDef = EDGE_STYLES[mmType];
        const sides = edgeSides(mmType);
        edges.push({
            id: edge.id,
            from: edge.source.id,
            to: edge.target.id,
            type: mmType,
            label: styleDef.label,
            style: {
                color: styleDef.color,
                dasharray: styleDef.dasharray,
                strokeWidth: styleDef.strokeWidth,
                opacity: styleDef.opacity,
            },
            fromSide: sides.fromSide,
            toSide: sides.toSide,
        });

        // Track generated models from generatedBy edges
        if (edge.type === 'generatedBy') {
            const timestamp = (edge.metadata?.timestamp as number) ?? undefined;
            generatedModels.set(edge.source.id, {
                transformationName: edge.target.name,
                timestamp,
            });
        }
    }

    // Mark generated model nodes
    for (const [modelId, genInfo] of generatedModels) {
        const node = nodeMap.get(modelId);
        if (node && node.kind === 'model') {
            const timeLabel = genInfo.timestamp ? formatTimeAgo(genInfo.timestamp) : '';
            node.generated = true;
            node.generatedLabel = timeLabel
                ? `Generated ${timeLabel} by ${genInfo.transformationName}`
                : `Generated by ${genInfo.transformationName}`;
        }
    }

    return { nodes: Array.from(nodeMap.values()), edges };
}

function mapEdgeType(type: MegaEdge['type']): MmEdgeType | null {
    switch (type) {
        case 'conformsTo':  return 'conformsTo';
        case 'inputOf':     return 'inputOf';
        case 'outputOf':    return 'outputOf';
        case 'generatedBy': return 'generatedBy';
        case 'sourceOf':    return 'sourceOf';
        default:            return null; // tracedBy, user-defined → skip for now
    }
}

// ─── ELK layout ───────────────────────────────────────────────────────────────

const elk = new ELK();

async function computeElkLayout(nodes: MmNode[], edges: MmEdge[]): Promise<Map<string, { x: number; y: number }>> {
    const graph = {
        id: 'root',
        layoutOptions: {
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '60',
            'elk.layered.spacing.nodeNodeBetweenLayers': '100',
        },
        children: nodes.map(n => ({ id: n.id, width: NODE_W, height: NODE_H })),
        edges: edges.map(e => ({ id: e.id, sources: [e.from], targets: [e.to] })),
    };

    const layout = await elk.layout(graph);
    const positions = new Map<string, { x: number; y: number }>();
    for (const child of layout.children ?? []) {
        positions.set(child.id, { x: child.x ?? 0, y: child.y ?? 0 });
    }
    return positions;
}

// ─── Anchor spread computation ────────────────────────────────────────────────

interface AnchorInfo {
    edgeId: string;
    nodeId: string;
    side: Side;
    role: 'from' | 'to';
}

function computeAnchorTs(edges: MmEdge[]): Map<string, { fromT: number; toT: number }> {
    // Group anchors by (nodeId, side)
    const groups = new Map<string, AnchorInfo[]>();
    for (const edge of edges) {
        const fromKey = `${edge.from}:${edge.fromSide}`;
        const toKey   = `${edge.to}:${edge.toSide}`;
        if (!groups.has(fromKey)) groups.set(fromKey, []);
        if (!groups.has(toKey))   groups.set(toKey, []);
        groups.get(fromKey)!.push({ edgeId: edge.id, nodeId: edge.from, side: edge.fromSide, role: 'from' });
        groups.get(toKey)!.push({ edgeId: edge.id, nodeId: edge.to, side: edge.toSide, role: 'to' });
    }

    // Assign spread t values
    const result = new Map<string, { fromT: number; toT: number }>();
    for (const edge of edges) {
        result.set(edge.id, { fromT: 0.5, toT: 0.5 });
    }

    for (const [, anchors] of groups) {
        const ts = spreadAnchors(anchors.length);
        anchors.forEach((a, i) => {
            const entry = result.get(a.edgeId)!;
            if (a.role === 'from') entry.fromT = ts[i];
            else entry.toT = ts[i];
        });
    }

    return result;
}

// ─── Legend edge entries ─────────────────────────────────────────────────────

const LEGEND_EDGES: Array<{ key: MmEdgeType; label: string }> = [
    { key: 'conformsTo', label: 'conformsTo' },
    { key: 'inputOf', label: 'inputOf' },
    { key: 'outputOf', label: 'outputOf' },
    { key: 'generatedBy', label: 'generatedBy' },
    { key: 'sourceOf', label: 'sourceOf' },
];

// ─── Context menu state type ────────────────────────────────────────────────

interface ContextMenuState {
    x: number;
    y: number;
    type: 'node' | 'canvas';
    nodeId?: string;
    nodeKind?: MmNodeKind;
    nodeName?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

const MegamodelView: React.FC<MegamodelViewProps> = ({
    megamodel, viewpoints, artifactStats, onClose, onOpenNode,
    onDeleteNode, onRenameNode, onDuplicateNode, onRunTransformation,
    onCreateMetamodel, onCreateModel, onImport,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes] = useState<MmNode[]>([]);
    const [edges, setEdges] = useState<MmEdge[]>([]);
    const [layoutReady, setLayoutReady] = useState(false);
    const [showDots, setShowDots] = useState(true);

    // Pan & zoom
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    // Node drag
    const draggingNode = useRef<string | null>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Selection
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    // Inline rename
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; kind: MmNodeKind } | null>(null);

    // ── Stats lookup map ────────────────────────────────────────────────────
    const statsMap = useMemo(() => {
        const map = new Map<string, ArtifactStats>();
        if (artifactStats) {
            for (const s of artifactStats) map.set(s.id, s);
        }
        return map;
    }, [artifactStats]);

    // ── Build graph and run ELK layout ────────────────────────────────────────
    useEffect(() => {
        const { nodes: builtNodes, edges: builtEdges } = buildGraph(megamodel, viewpoints, statsMap);
        if (builtNodes.length === 0) {
            setNodes([]);
            setEdges(builtEdges);
            setLayoutReady(true);
            return;
        }

        computeElkLayout(builtNodes, builtEdges).then(positions => {
            const laid = builtNodes.map(n => {
                const pos = positions.get(n.id);
                return pos ? { ...n, x: pos.x, y: pos.y } : n;
            });
            setNodes(laid);
            setEdges(builtEdges);
            setLayoutReady(true);

            // Auto-fit after layout
            if (containerRef.current && laid.length > 0) {
                const rect = containerRef.current.getBoundingClientRect();
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                for (const n of laid) {
                    if (n.x < minX) minX = n.x;
                    if (n.y < minY) minY = n.y;
                    if (n.x + NODE_W > maxX) maxX = n.x + NODE_W;
                    if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
                }
                const contentW = maxX - minX + 80;
                const contentH = maxY - minY + 80;
                const scaleX = rect.width / contentW;
                const scaleY = rect.height / contentH;
                const newZoom = Math.min(scaleX, scaleY, 1.5);
                setPan({
                    x: (rect.width / newZoom - contentW) / 2 - minX + 40,
                    y: (rect.height / newZoom - contentH) / 2 - minY + 40,
                });
                setZoom(Math.max(newZoom, 0.3));
            }
        });
    }, [megamodel, viewpoints, statsMap]);

    // ── Node map for fast lookup ──────────────────────────────────────────────
    const nodeMap = useMemo(() => {
        const map = new Map<string, MmNode>();
        for (const n of nodes) map.set(n.id, n);
        return map;
    }, [nodes]);

    // ── Computed edge paths ───────────────────────────────────────────────────
    const edgePaths = useMemo(() => {
        if (!layoutReady) return [];

        const anchorTs = computeAnchorTs(edges);

        return edges.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const toNode   = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const ts = anchorTs.get(edge.id) ?? { fromT: 0.5, toT: 0.5 };
            const p1 = getPort(fromNode, edge.fromSide, ts.fromT);
            const p2 = getPort(toNode, edge.toSide, ts.toT);
            const pts = routePoints(p1, edge.fromSide, p2, edge.toSide);
            const path = buildRoundedPath(pts);
            const mid = labelMidpoint(pts);

            return { edge, path, mid, pts };
        }).filter(Boolean) as Array<{ edge: MmEdge; path: string; mid: Point; pts: Point[] }>;
    }, [edges, nodeMap, layoutReady]);

    // ── Pan handlers (middle-click or left-click on background) ───────────────
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        // Close context menu on any canvas click
        if (contextMenu) closeContextMenu();

        // Middle-click or left-click on the canvas (not on a node)
        if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).classList.contains('mm-canvas'))) {
            e.preventDefault();
            isPanning.current = true;
            panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            // Deselect on canvas click
            setSelectedNodeId(null);
        }
    }, [pan, contextMenu, closeContextMenu]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isPanning.current) {
            const dx = (e.clientX - panStart.current.x) / zoom;
            const dy = (e.clientY - panStart.current.y) / zoom;
            setPan({ x: panStart.current.panX + dx, y: panStart.current.panY + dy });
            return;
        }
        if (draggingNode.current) {
            // Calculate position in canvas coords
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const canvasX = (e.clientX - rect.left) / zoom - pan.x;
            const canvasY = (e.clientY - rect.top)  / zoom - pan.y;

            setNodes(prev => prev.map(n =>
                n.id === draggingNode.current
                    ? { ...n, x: canvasX - dragOffset.current.x, y: canvasY - dragOffset.current.y }
                    : n
            ));
        }
    }, [pan, zoom]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        draggingNode.current = null;
    }, []);

    // ── Node drag ─────────────────────────────────────────────────────────────
    const handleNodeMouseDown = useCallback((e: React.MouseEvent, nodeId: string) => {
        if (e.button !== 0) return;
        e.stopPropagation();
        const node = nodeMap.get(nodeId);
        if (!node) return;

        // Select node on click
        setSelectedNodeId(nodeId);
        // Close context menu if open
        if (contextMenu) closeContextMenu();

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        draggingNode.current = nodeId;
        const canvasX = (e.clientX - rect.left) / zoom - pan.x;
        const canvasY = (e.clientY - rect.top)  / zoom - pan.y;
        dragOffset.current = { x: canvasX - node.x, y: canvasY - node.y };
    }, [nodeMap, pan, zoom, contextMenu, closeContextMenu]);

    // ── Node double-click (open in editor) ──────────────────────────────────
    const handleNodeDoubleClick = useCallback((nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (!node || !onOpenNode) return;
        onOpenNode(nodeId, node.kind);
        onClose();
    }, [nodeMap, onOpenNode, onClose]);

    // ── Node context menu ──────────────────────────────────────────────────
    const handleNodeContextMenu = useCallback((e: React.MouseEvent, nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;
        setSelectedNodeId(nodeId);
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'node',
            nodeId: node.id,
            nodeKind: node.kind,
            nodeName: node.name,
        });
    }, [nodeMap]);

    // ── Canvas context menu (right-click on empty space) ──────────────────
    const handleCanvasContextMenu = useCallback((e: React.MouseEvent) => {
        // Only trigger on the canvas itself, not on nodes
        const target = e.target as HTMLElement;
        if (!target.classList.contains('mm-canvas') && !target.classList.contains('mm-view__body')) return;
        e.preventDefault();
        setContextMenu({
            x: e.clientX,
            y: e.clientY,
            type: 'canvas',
        });
    }, []);

    // ── Inline rename ─────────────────────────────────────────────────────────
    const startRenaming = useCallback((nodeId: string) => {
        setRenamingNodeId(nodeId);
    }, []);

    const handleNodeRename = useCallback((nodeId: string, newName: string) => {
        setRenamingNodeId(null);
        const node = nodeMap.get(nodeId);
        if (!node) return;
        if (newName !== node.name && newName.trim()) {
            // Update local node name for immediate feedback
            setNodes(prev => prev.map(n =>
                n.id === nodeId ? { ...n, name: newName.trim() } : n
            ));
            onRenameNode?.(nodeId, node.kind, newName.trim());
        }
    }, [nodeMap, onRenameNode]);

    // ── Delete with confirmation ─────────────────────────────────────────────
    const showDeleteConfirmation = useCallback((nodeId: string) => {
        const node = nodeMap.get(nodeId);
        if (!node) return;
        setDeleteConfirm({ id: node.id, name: node.name, kind: node.kind });
    }, [nodeMap]);

    const handleConfirmDelete = useCallback(() => {
        if (!deleteConfirm) return;
        onDeleteNode?.(deleteConfirm.id, deleteConfirm.kind);
        setDeleteConfirm(null);
        setSelectedNodeId(null);
    }, [deleteConfirm, onDeleteNode]);

    // ── Context menu items ───────────────────────────────────────────────────
    const contextMenuItems = useMemo((): MenuItem[] => {
        if (!contextMenu) return [];

        if (contextMenu.type === 'canvas') {
            return [
                {
                    label: 'New metamodel',
                    icon: 'bi-plus-circle',
                    action: () => onCreateMetamodel?.(),
                    disabled: !onCreateMetamodel,
                },
                {
                    label: 'New model',
                    icon: 'bi-plus-square',
                    action: () => onCreateModel?.(),
                    disabled: !onCreateModel,
                },
                { separator: true, label: '', icon: '', action: () => {} },
                {
                    label: 'Import...',
                    icon: 'bi-download',
                    action: () => onImport?.(),
                    disabled: !onImport,
                },
            ];
        }

        // Node context menu
        const items: MenuItem[] = [
            {
                label: 'Open in editor',
                icon: 'bi-box-arrow-up-right',
                shortcut: 'Enter',
                action: () => {
                    if (contextMenu.nodeId && onOpenNode && contextMenu.nodeKind) {
                        onOpenNode(contextMenu.nodeId, contextMenu.nodeKind);
                        onClose();
                    }
                },
                disabled: !onOpenNode,
            },
            {
                label: 'Rename',
                icon: 'bi-pencil',
                shortcut: 'F2',
                action: () => {
                    if (contextMenu.nodeId) startRenaming(contextMenu.nodeId);
                },
                disabled: !onRenameNode,
            },
            {
                label: 'Duplicate',
                icon: 'bi-copy',
                action: () => {
                    if (contextMenu.nodeId && contextMenu.nodeKind) {
                        onDuplicateNode?.(contextMenu.nodeId, contextMenu.nodeKind);
                    }
                },
                disabled: !onDuplicateNode,
            },
        ];

        // Add "Run transformation" for transformation nodes
        if (contextMenu.nodeKind === 'transformation') {
            items.push({ separator: true, label: '', icon: '', action: () => {} });
            items.push({
                label: 'Run transformation',
                icon: 'bi-play-fill',
                action: () => {
                    if (contextMenu.nodeId) {
                        onRunTransformation?.(contextMenu.nodeId);
                    }
                },
                disabled: !onRunTransformation,
            });
        }

        // Separator + Delete (always last)
        items.push({ separator: true, label: '', icon: '', action: () => {} });
        items.push({
            label: 'Delete',
            icon: 'bi-trash3',
            shortcut: 'Del',
            danger: true,
            action: () => {
                if (contextMenu.nodeId) showDeleteConfirmation(contextMenu.nodeId);
            },
            disabled: !onDeleteNode,
        });

        return items;
    }, [contextMenu, onOpenNode, onClose, onRenameNode, onDuplicateNode, onDeleteNode,
        onRunTransformation, onCreateMetamodel, onCreateModel, onImport,
        startRenaming, showDeleteConfirmation]);

    // ── Zoom ──────────────────────────────────────────────────────────────────
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * factor, 0.15), 4));
    }, []);

    // ── Fit view ──────────────────────────────────────────────────────────────
    const handleFitView = useCallback(() => {
        if (nodes.length === 0 || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of nodes) {
            if (n.x < minX) minX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.x + NODE_W > maxX) maxX = n.x + NODE_W;
            if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
        }
        const contentW = maxX - minX + 80;
        const contentH = maxY - minY + 80;
        const scaleX = rect.width / contentW;
        const scaleY = rect.height / contentH;
        const newZoom = Math.min(scaleX, scaleY, 1.5);
        setPan({
            x: (rect.width / newZoom - contentW) / 2 - minX + 40,
            y: (rect.height / newZoom - contentH) / 2 - minY + 40,
        });
        setZoom(Math.max(newZoom, 0.3));
    }, [nodes]);

    // ── Arrow markers ─────────────────────────────────────────────────────────
    const markerColors = useMemo(() => {
        const colors = new Set<string>();
        for (const e of edges) colors.add(e.style.color);
        return Array.from(colors);
    }, [edges]);

    // ── Keyboard shortcuts (ESC, Enter, F2, Delete) ─────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            // Don't handle keys when rename input is focused
            if (renamingNodeId) return;
            // Don't handle keys when delete dialog is open (except Escape)
            if (deleteConfirm && e.key !== 'Escape') return;

            if (e.key === 'Escape') {
                if (deleteConfirm) {
                    setDeleteConfirm(null);
                } else if (contextMenu) {
                    // Context menu handles its own Escape
                } else {
                    onClose();
                }
                return;
            }

            // Node-specific shortcuts require a selected node
            const selNode = selectedNodeId ? nodeMap.get(selectedNodeId) : null;
            if (!selNode) return;

            if (e.key === 'Enter') {
                e.preventDefault();
                if (onOpenNode) {
                    onOpenNode(selNode.id, selNode.kind);
                    onClose();
                }
            }

            if (e.key === 'F2') {
                e.preventDefault();
                if (onRenameNode) startRenaming(selNode.id);
            }

            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault();
                if (onDeleteNode) showDeleteConfirmation(selNode.id);
            }
        };

        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose, selectedNodeId, nodeMap, onOpenNode, onRenameNode, onDeleteNode,
        renamingNodeId, deleteConfirm, contextMenu, startRenaming, showDeleteConfirmation]);

    // ── Backdrop click ────────────────────────────────────────────────────────
    const handleBackdropClick = useCallback((e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    }, [onClose]);

    // ── Shared header ──────────────────────────────────────────────────────────
    const header = (
        <div className="mm-view__header">
            <div className="mm-view__title">
                <i className="bi bi-diagram-3" />
                Megamodel
            </div>
            <div className="mm-view__controls">
                {layoutReady && nodes.length > 0 && (
                    <>
                        {/* Legend */}
                        <div className="mm-legend">
                            <div className="mm-legend__section">
                                <div className="mm-legend__item">
                                    <span className="mm-legend__swatch mm-legend__swatch--metamodel" />
                                    <span>Metamodel</span>
                                </div>
                                <div className="mm-legend__item">
                                    <span className="mm-legend__swatch mm-legend__swatch--model" />
                                    <span>Model</span>
                                </div>
                                <div className="mm-legend__item">
                                    <span className="mm-legend__swatch mm-legend__swatch--transformation" />
                                    <span>Transformation</span>
                                </div>
                                <div className="mm-legend__item">
                                    <span className="mm-legend__swatch mm-legend__swatch--generated" />
                                    <span>Generated</span>
                                </div>
                            </div>
                            <div className="mm-legend__divider" />
                            <div className="mm-legend__section">
                                {LEGEND_EDGES.map(({ key, label }) => {
                                    const s = EDGE_STYLES[key];
                                    return (
                                        <div key={key} className="mm-legend__item">
                                            <svg width="20" height="8" style={{ flexShrink: 0 }}>
                                                <line
                                                    x1="0" y1="4" x2="20" y2="4"
                                                    stroke={s.color}
                                                    strokeWidth={s.strokeWidth}
                                                    strokeDasharray={s.dasharray}
                                                    opacity={s.opacity}
                                                />
                                            </svg>
                                            <span>{label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button
                            className={`mm-view__btn${showDots ? ' mm-view__btn--active' : ''}`}
                            onClick={() => setShowDots(d => !d)}
                            title="Toggle grid dots"
                        >
                            <i className="bi bi-grid-3x3" />
                        </button>
                        <button className="mm-view__btn" onClick={handleFitView} title="Fit to view">
                            <i className="bi bi-arrows-fullscreen" />
                        </button>
                    </>
                )}
                <button className="mm-view__close" onClick={onClose} title="Close (Esc)">
                    <i className="bi bi-x-lg" />
                </button>
            </div>
        </div>
    );

    // ── Empty state ───────────────────────────────────────────────────────────
    if (layoutReady && nodes.length === 0) {
        return (
            <div className="mm-view" onClick={handleBackdropClick}>
                <div className="mm-view__modal">
                    {header}
                    <div className="mm-view__body" onContextMenu={handleCanvasContextMenu}>
                        <div className="mm-empty-state">
                            <i className="bi bi-diagram-3 mm-empty-state__icon" />
                            <div className="mm-empty-state__title">No artifacts yet</div>
                            <div className="mm-empty-state__subtitle">
                                Add metamodels, models, and transformations to see their relationships here.
                            </div>
                        </div>
                    </div>
                </div>
                {/* Context menu (canvas) */}
                {contextMenu && (
                    <MegamodelContextMenu
                        x={contextMenu.x}
                        y={contextMenu.y}
                        items={contextMenuItems}
                        onClose={closeContextMenu}
                    />
                )}
            </div>
        );
    }

    return (
        <div className="mm-view" onClick={handleBackdropClick}>
            <div className="mm-view__modal">
                {header}

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className={`mm-view__body${showDots ? ' mm-view__body--dots' : ''}`}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={handleCanvasContextMenu}
                >
                    {!layoutReady && (
                        <div className="mm-loading-state">
                            <i className="bi bi-hourglass-split mm-loading-state__icon" />
                            <div className="mm-loading-state__text">Computing layout…</div>
                        </div>
                    )}

                    {layoutReady && (
                        <>
                            {/* SVG layer for edges */}
                            <svg className="mm-canvas mm-canvas--svg" style={{ pointerEvents: 'none' }}>
                                <defs>
                                    {markerColors.map(color => (
                                        <marker
                                            key={color}
                                            id={`mm-arr-${color.replace('#', '')}`}
                                            markerWidth="10"
                                            markerHeight="10"
                                            refX="9"
                                            refY="3.5"
                                            orient="auto"
                                        >
                                            <path
                                                d="M0,0 L9,3.5 L0,7"
                                                fill="none"
                                                stroke={color}
                                                strokeWidth="1.5"
                                                strokeLinejoin="round"
                                            />
                                        </marker>
                                    ))}
                                </defs>
                                <g transform={`translate(${pan.x * zoom},${pan.y * zoom}) scale(${zoom})`}>
                                    {edgePaths.map(({ edge, path, mid }) => (
                                        <g key={edge.id}>
                                            <path
                                                d={path}
                                                fill="none"
                                                stroke={edge.style.color}
                                                strokeWidth={edge.style.strokeWidth}
                                                strokeDasharray={edge.style.dasharray}
                                                opacity={edge.style.opacity ?? 1}
                                                markerEnd={`url(#mm-arr-${edge.style.color.replace('#', '')})`}
                                                style={{ pointerEvents: 'none' }}
                                            />
                                            {/* Label pill */}
                                            <g transform={`translate(${mid.x},${mid.y})`}>
                                                <rect
                                                    x={-(edge.label.length * 3.2 + 8)}
                                                    y={-9}
                                                    width={edge.label.length * 6.4 + 16}
                                                    height={18}
                                                    rx={4}
                                                    fill="#ffffff"
                                                    stroke="#e2e8f0"
                                                    strokeWidth={0.5}
                                                />
                                                <text
                                                    textAnchor="middle"
                                                    dominantBaseline="central"
                                                    fontSize={10}
                                                    fill="#64748b"
                                                    style={{ pointerEvents: 'none' }}
                                                >
                                                    {edge.label}
                                                </text>
                                            </g>
                                        </g>
                                    ))}
                                </g>
                            </svg>

                            {/* HTML layer for nodes */}
                            <div
                                className="mm-canvas mm-canvas--nodes"
                                style={{
                                    transform: `translate(${pan.x * zoom}px,${pan.y * zoom}px) scale(${zoom})`,
                                    transformOrigin: '0 0',
                                }}
                            >
                                {nodes.map(node => (
                                    <MegamodelNode
                                        key={node.id}
                                        id={node.id}
                                        kind={node.kind}
                                        badgeLabel={node.badgeLabel}
                                        name={node.name}
                                        typeLabel={node.typeLabel}
                                        x={node.x}
                                        y={node.y}
                                        stats={node.stats}
                                        status={node.status}
                                        generated={node.generated}
                                        generatedLabel={node.generatedLabel}
                                        selected={selectedNodeId === node.id}
                                        isRenaming={renamingNodeId === node.id}
                                        onMouseDown={handleNodeMouseDown}
                                        onDoubleClick={onOpenNode ? handleNodeDoubleClick : undefined}
                                        onContextMenu={handleNodeContextMenu}
                                        onRename={handleNodeRename}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Context menu */}
            {contextMenu && (
                <MegamodelContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={contextMenuItems}
                    onClose={closeContextMenu}
                />
            )}

            {/* Delete confirmation dialog */}
            {deleteConfirm && (
                <div className="mm-confirm-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="mm-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                        <p>
                            Delete <strong>{deleteConfirm.name}</strong>?
                        </p>
                        <p className="mm-confirm-dialog__subtitle">
                            This action cannot be undone.
                        </p>
                        <div className="mm-confirm-dialog__actions">
                            <button
                                className="mm-confirm-dialog__btn mm-confirm-dialog__btn--cancel"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <button
                                className="mm-confirm-dialog__btn mm-confirm-dialog__btn--delete"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MegamodelView;

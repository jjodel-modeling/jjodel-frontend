/**
 * MegamodelView — Interactive diagram of all project artifacts.
 *
 * Reads from the runtime megamodel (metamodels, models, transformations) plus
 * viewpoints from the project. Uses dagre for layered auto-layout and supports
 * drag-to-reposition, middle-click pan, scroll zoom, and auto-arrange.
 *
 * Phase 2: context menu (right-click) on nodes and canvas, inline rename,
 * delete confirmation dialog, keyboard shortcuts.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { EmptyState as JjEmptyState } from '../ui/EmptyState';
import type { Megamodel, MegamodelEdge as MegaEdge, ArtifactType } from '../../model/megamodel';
import { computeMegamodelLayout } from './megamodelLayout';
import MegamodelNode from './MegamodelNode';
import MegamodelContextMenu, { type MenuItem } from './MegamodelContextMenu';
import {
    NODE_W, NODE_H,
    type MmNode, type MmEdge, type MmEdgeType, type MmNodeKind, type MmNodeStats, type MmNodeStatus, type Side, type Point,
    EDGE_STYLES,
    getPort, spreadAnchors, routePoints, buildRoundedPath, labelMidpoint, computeAdaptiveSides,
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
    projectId?: string;
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
    transformation:  { label: '⇌', typeLabel: 'JjTL Transformation' },
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
        case 'uses':        return { fromSide: 'right',  toSide: 'left' };   // MM → MM (cross-metamodel)
        case 'inputOf':     return { fromSide: 'right',  toSide: 'left' };   // MM → transformation
        case 'outputOf':    return { fromSide: 'right',  toSide: 'left' };   // transformation → MM
        case 'definedOn':   return { fromSide: 'top',    toSide: 'bottom' };
        case 'renderedBy':  return { fromSide: 'bottom', toSide: 'top' };
        case 'generatedBy':    return { fromSide: 'left',   toSide: 'right' };  // generated model ← transformation
        case 'sourceOf':       return { fromSide: 'right',  toSide: 'left' };   // transformation → source model
        case 'instanceInputOf': return { fromSide: 'right',  toSide: 'left' };  // source model → transformation
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
        case 'uses':        return 'uses';
        case 'inputOf':     return 'inputOf';
        case 'outputOf':    return 'outputOf';
        case 'generatedBy':    return 'generatedBy';
        case 'sourceOf':       return 'sourceOf';
        case 'instanceInputOf': return 'instanceInputOf';
        default:            return null; // tracedBy, user-defined → skip for now
    }
}

// ─── Layout helper ───────────────────────────────────────────────────────────

function applyLayout(nodes: MmNode[], edges: MmEdge[]): MmNode[] {
    const positions = computeMegamodelLayout(nodes, edges);
    return nodes.map(n => {
        const pos = positions.get(n.id);
        return pos ? { ...n, x: pos.x, y: pos.y } : n;
    });
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
    { key: 'uses', label: 'uses' },
    { key: 'inputOf', label: 'inputOf' },
    { key: 'outputOf', label: 'outputOf' },
    { key: 'generatedBy', label: 'generatedBy' },
    { key: 'sourceOf', label: 'sourceOf' },
    { key: 'instanceInputOf', label: 'instanceInputOf' },
];

// ─── Position persistence (localStorage) ─────────────────────────────────────

const POSITIONS_KEY_PREFIX = 'megamodel-positions-';

function savePositions(projectId: string, nodes: MmNode[]): void {
    const positions: Record<string, { x: number; y: number }> = {};
    for (const node of nodes) {
        positions[node.id] = { x: node.x, y: node.y };
    }
    try {
        localStorage.setItem(POSITIONS_KEY_PREFIX + projectId, JSON.stringify(positions));
    } catch { /* ignore quota errors */ }
}

function loadPositions(projectId: string): Record<string, { x: number; y: number }> | null {
    try {
        const raw = localStorage.getItem(POSITIONS_KEY_PREFIX + projectId);
        if (!raw) return null;
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

function clearPositions(projectId: string): void {
    localStorage.removeItem(POSITIONS_KEY_PREFIX + projectId);
}

// ─── Hidden edge types persistence (localStorage) ────────────────────────────

const HIDDEN_EDGES_KEY_PREFIX = 'megamodel-hidden-edges-';
const DEFAULT_HIDDEN_EDGES = ['instanceInputOf', 'sourceOf'];

function saveHiddenEdges(projectId: string, hidden: Set<string>): void {
    try {
        localStorage.setItem(HIDDEN_EDGES_KEY_PREFIX + projectId, JSON.stringify([...hidden]));
    } catch { /* ignore quota errors */ }
}

function loadHiddenEdges(projectId: string): Set<string> | null {
    try {
        const raw = localStorage.getItem(HIDDEN_EDGES_KEY_PREFIX + projectId);
        if (!raw) return null;
        return new Set(JSON.parse(raw));
    } catch {
        return null;
    }
}

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
    megamodel, projectId, viewpoints, artifactStats, onClose, onOpenNode,
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
    const nodeDragged = useRef(false);

    // Selection
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Context menu
    const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
    const closeContextMenu = useCallback(() => setContextMenu(null), []);

    // Inline rename
    const [renamingNodeId, setRenamingNodeId] = useState<string | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string; kind: MmNodeKind } | null>(null);

    // Spotlight mode
    const [spotlightNodeId, setSpotlightNodeId] = useState<string | null>(null);
    const spotlightClickTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Edge type visibility (legend toggles)
    const [hiddenEdgeTypes, setHiddenEdgeTypes] = useState<Set<string>>(() => {
        if (projectId) {
            const saved = loadHiddenEdges(projectId);
            if (saved) return saved;
        }
        return new Set(DEFAULT_HIDDEN_EDGES);
    });

    const toggleEdgeType = useCallback((edgeType: string) => {
        setHiddenEdgeTypes(prev => {
            const next = new Set(prev);
            if (next.has(edgeType)) next.delete(edgeType);
            else next.add(edgeType);
            if (projectId) saveHiddenEdges(projectId, next);
            return next;
        });
    }, [projectId]);

    const connectedNodeIds = useMemo(() => {
        if (!spotlightNodeId) return null;
        const connected = new Set<string>();
        connected.add(spotlightNodeId);
        for (const edge of edges) {
            if (edge.from === spotlightNodeId) connected.add(edge.to);
            if (edge.to === spotlightNodeId) connected.add(edge.from);
        }
        return connected;
    }, [spotlightNodeId, edges]);

    // ── Stats lookup map ────────────────────────────────────────────────────
    const statsMap = useMemo(() => {
        const map = new Map<string, ArtifactStats>();
        if (artifactStats) {
            for (const s of artifactStats) map.set(s.id, s);
        }
        return map;
    }, [artifactStats]);

    // ── Fit-to-view helper (used only by explicit "Fit to view" button) ────
    const fitToView = useCallback((laid: MmNode[]) => {
        if (!containerRef.current || laid.length === 0) return;
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
    }, []);

    // ── Center at 1:1 zoom (used for initial open and auto-arrange) ─────────
    const centerAtZoom1 = useCallback((laid: MmNode[]) => {
        if (!containerRef.current || laid.length === 0) return;
        const rect = containerRef.current.getBoundingClientRect();
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of laid) {
            if (n.x < minX) minX = n.x;
            if (n.y < minY) minY = n.y;
            if (n.x + NODE_W > maxX) maxX = n.x + NODE_W;
            if (n.y + NODE_H > maxY) maxY = n.y + NODE_H;
        }
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setPan({
            x: rect.width / 2 - centerX,
            y: rect.height / 2 - centerY,
        });
        setZoom(1);
    }, []);

    // ── Build graph and run dagre layout ──────────────────────────────────────
    useEffect(() => {
        const { nodes: builtNodes, edges: builtEdges } = buildGraph(megamodel, viewpoints, statsMap);
        if (builtNodes.length === 0) {
            setNodes([]);
            setEdges(builtEdges);
            setLayoutReady(true);
            return;
        }

        // Try to restore saved positions
        const savedPositions = projectId ? loadPositions(projectId) : null;
        let laid: MmNode[];

        if (savedPositions) {
            // Apply saved positions for known nodes; auto-layout any new nodes
            let hasNewNodes = false;
            laid = builtNodes.map(n => {
                const saved = savedPositions[n.id];
                if (saved) return { ...n, x: saved.x, y: saved.y };
                hasNewNodes = true;
                return n;
            });
            // If some nodes are new (no saved position), run layout on just those
            // but keep saved positions for existing ones
            if (hasNewNodes) {
                const fullLayout = applyLayout(builtNodes, builtEdges);
                laid = laid.map(n => {
                    if (savedPositions[n.id]) return n; // keep saved position
                    const layoutNode = fullLayout.find(ln => ln.id === n.id);
                    return layoutNode ?? n;
                });
            }
        } else {
            // No saved positions — run auto-layout
            laid = applyLayout(builtNodes, builtEdges);
        }

        setNodes(laid);
        setEdges(builtEdges);
        setLayoutReady(true);

        // Center at 1:1 zoom after layout (need a frame for containerRef to have dimensions)
        requestAnimationFrame(() => centerAtZoom1(laid));
    }, [megamodel, viewpoints, statsMap, centerAtZoom1, projectId]);

    // ── Node map for fast lookup ──────────────────────────────────────────────
    const nodeMap = useMemo(() => {
        const map = new Map<string, MmNode>();
        for (const n of nodes) map.set(n.id, n);
        return map;
    }, [nodes]);

    // ── Visible edges (filtered by legend toggles) ─────────────────────────
    const visibleEdges = useMemo(
        () => edges.filter(e => !hiddenEdgeTypes.has(e.type)),
        [edges, hiddenEdgeTypes],
    );

    // ── Computed edge paths ───────────────────────────────────────────────────
    const edgePaths = useMemo(() => {
        if (!layoutReady) return [];

        // Re-orient each edge to the sides actually facing its counterpart, based
        // on current node positions, instead of the static per-type sides. Edges
        // with a missing endpoint keep their static sides. Spread + routing below
        // both run on these oriented sides so grouping stays consistent.
        const oriented = visibleEdges.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const toNode   = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return edge;
            const sides = computeAdaptiveSides(fromNode, toNode, edge.fromSide, edge.toSide);
            return { ...edge, fromSide: sides.fromSide, toSide: sides.toSide };
        });

        const anchorTs = computeAnchorTs(oriented);

        return oriented.map(edge => {
            const fromNode = nodeMap.get(edge.from);
            const toNode   = nodeMap.get(edge.to);
            if (!fromNode || !toNode) return null;

            const ts = anchorTs.get(edge.id) ?? { fromT: 0.5, toT: 0.5 };
            const p1 = getPort(fromNode, edge.fromSide, ts.fromT);
            const p2 = getPort(toNode, edge.toSide, ts.toT);

            // Guard against NaN / undefined coordinates (layout not ready or missing positions)
            if (!Number.isFinite(p1.x) || !Number.isFinite(p1.y) ||
                !Number.isFinite(p2.x) || !Number.isFinite(p2.y)) return null;

            const pts = routePoints(p1, edge.fromSide, p2, edge.toSide);
            const path = buildRoundedPath(pts);
            const mid = labelMidpoint(pts);

            return { edge, path, mid, pts };
        }).filter(Boolean) as Array<{ edge: MmEdge; path: string; mid: Point; pts: Point[] }>;
    }, [visibleEdges, nodeMap, layoutReady]);

    // ── Pan handlers (middle-click or left-click on background) ───────────────
    const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
        // Close context menu on any canvas click
        if (contextMenu) closeContextMenu();

        // Middle-click or left-click on the canvas (not on a node)
        if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).classList.contains('mm-canvas'))) {
            e.preventDefault();
            isPanning.current = true;
            panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
            // Deselect and clear spotlight on canvas click
            setSelectedNodeId(null);
            setSpotlightNodeId(null);
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
            nodeDragged.current = true;
            // Calculate position in canvas coords, snapped to grid
            const rect = containerRef.current?.getBoundingClientRect();
            if (!rect) return;
            const canvasX = (e.clientX - rect.left) / zoom - pan.x;
            const canvasY = (e.clientY - rect.top)  / zoom - pan.y;
            const SNAP = 20;
            const rawX = canvasX - dragOffset.current.x;
            const rawY = canvasY - dragOffset.current.y;
            const snappedX = Math.round(rawX / SNAP) * SNAP;
            const snappedY = Math.round(rawY / SNAP) * SNAP;

            setNodes(prev => prev.map(n =>
                n.id === draggingNode.current
                    ? { ...n, x: snappedX, y: snappedY }
                    : n
            ));
        }
    }, [pan, zoom]);

    const handleMouseUp = useCallback(() => {
        isPanning.current = false;
        // Save positions after a node drag completes
        if (draggingNode.current && nodeDragged.current && projectId) {
            // Read current nodes from state via a functional update trick
            setNodes(prev => {
                savePositions(projectId, prev);
                return prev;
            });
        }
        draggingNode.current = null;
    }, [projectId]);

    // ── Node drag + spotlight click ─────────────────────────────────────────
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
        nodeDragged.current = false;
        const canvasX = (e.clientX - rect.left) / zoom - pan.x;
        const canvasY = (e.clientY - rect.top)  / zoom - pan.y;
        dragOffset.current = { x: canvasX - node.x, y: canvasY - node.y };

        // Delayed spotlight toggle (cancelled by double-click or drag)
        if (spotlightClickTimeout.current) {
            clearTimeout(spotlightClickTimeout.current);
            spotlightClickTimeout.current = null;
        }
        spotlightClickTimeout.current = setTimeout(() => {
            // Only toggle if we didn't drag
            if (!nodeDragged.current) {
                setSpotlightNodeId(prev => prev === nodeId ? null : nodeId);
            }
            spotlightClickTimeout.current = null;
        }, 250);
    }, [nodeMap, pan, zoom, contextMenu, closeContextMenu]);

    // ── Node double-click (open in editor) ──────────────────────────────────
    const handleNodeDoubleClick = useCallback((nodeId: string) => {
        // Cancel the spotlight timeout — this is a double-click
        if (spotlightClickTimeout.current) {
            clearTimeout(spotlightClickTimeout.current);
            spotlightClickTimeout.current = null;
        }
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

    // ── Zoom (imperative listener for { passive: false }) ──────────────────
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => {
            e.preventDefault();
            const factor = e.deltaY > 0 ? 0.9 : 1.1;
            setZoom(prev => Math.min(Math.max(prev * factor, 0.15), 4));
        };
        el.addEventListener('wheel', handler, { passive: false });
        return () => el.removeEventListener('wheel', handler);
    }, []);

    // ── Fit view ──────────────────────────────────────────────────────────────
    const handleFitView = useCallback(() => fitToView(nodes), [nodes, fitToView]);

    // ── Auto-arrange (re-run dagre layout) ───────────────────────────────────
    const handleAutoArrange = useCallback(() => {
        if (nodes.length === 0) return;
        // Clear saved positions so layout is fresh
        if (projectId) clearPositions(projectId);
        const laid = applyLayout(nodes, edges);
        setNodes(laid);
        // Save the new auto-layout positions
        if (projectId) savePositions(projectId, laid);
        requestAnimationFrame(() => centerAtZoom1(laid));
    }, [nodes, edges, centerAtZoom1, projectId]);

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
                                    const isHidden = hiddenEdgeTypes.has(key);
                                    return (
                                        <div
                                            key={key}
                                            className={`mm-legend__item mm-legend__item--toggle${isHidden ? ' mm-legend__item--hidden' : ''}`}
                                            onClick={() => toggleEdgeType(key)}
                                            title={isHidden ? `Show ${label} edges` : `Hide ${label} edges`}
                                        >
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

                        <button className="mm-view__btn" onClick={handleAutoArrange} title="Auto-arrange">
                            <i className="bi bi-grid-3x3-gap" />
                        </button>
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
                        <JjEmptyState
                            icon="bi-diagram-3"
                            title="No artifacts yet"
                            description="Add metamodels, models, and transformations to see their relationships here."
                        />
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
                                    {edgePaths.map(({ edge, path, mid }) => {
                                        const isEdgeDimmed = connectedNodeIds !== null &&
                                            !(edge.from === spotlightNodeId || edge.to === spotlightNodeId);
                                        const isEdgeHighlighted = spotlightNodeId !== null &&
                                            (edge.from === spotlightNodeId || edge.to === spotlightNodeId);
                                        const edgeOpacity = isEdgeDimmed ? 0.06
                                            : isEdgeHighlighted ? 1
                                            : (edge.style.opacity ?? 1);
                                        const edgeStrokeWidth = isEdgeHighlighted
                                            ? Math.max(edge.style.strokeWidth, 1.6)
                                            : edge.style.strokeWidth;

                                        return (
                                            <g key={edge.id} className="mm-edge" style={{ transition: 'opacity 0.3s' }}>
                                                <path
                                                    d={path}
                                                    fill="none"
                                                    stroke={edge.style.color}
                                                    strokeWidth={edgeStrokeWidth}
                                                    strokeDasharray={edge.style.dasharray}
                                                    opacity={edgeOpacity}
                                                    markerEnd={`url(#mm-arr-${edge.style.color.replace('#', '')})`}
                                                    style={{ pointerEvents: 'none', transition: 'opacity 0.3s, stroke-width 0.3s' }}
                                                />
                                                {/* Label pill — hidden when dimmed */}
                                                <g
                                                    transform={`translate(${mid.x},${mid.y})`}
                                                    opacity={isEdgeDimmed ? 0 : 1}
                                                    style={{ transition: 'opacity 0.3s' }}
                                                >
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
                                        );
                                    })}
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
                                        dimmed={connectedNodeIds !== null && !connectedNodeIds.has(node.id)}
                                        spotlighted={spotlightNodeId === node.id}
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

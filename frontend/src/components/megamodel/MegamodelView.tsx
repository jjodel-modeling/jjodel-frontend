/**
 * MegamodelView — Interactive diagram of all project artifacts.
 *
 * Reads from the runtime megamodel (metamodels, models, transformations) plus
 * viewpoints from the project. Uses ELK for initial layout and supports
 * drag-to-reposition, middle-click pan, and scroll zoom.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import ELK from 'elkjs/lib/elk.bundled.js';
import type { Megamodel, MegamodelEdge as MegaEdge, ArtifactType } from '../../model/megamodel';
import MegamodelNode from './MegamodelNode';
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
    previewBars: number[];
}

export interface MegamodelViewProps {
    megamodel: Megamodel;
    viewpoints?: Array<{ id: string; name: string; isOverlay?: boolean }>;
    artifactStats?: ArtifactStats[];
    onClose: () => void;
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
    }
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
                    previewBars: artStats?.previewBars ?? [],
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
                    previewBars: [],
                });
            }
        }
    }

    // Build edges
    const edges: MmEdge[] = [];
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
    }

    return { nodes: Array.from(nodeMap.values()), edges };
}

function mapEdgeType(type: MegaEdge['type']): MmEdgeType | null {
    switch (type) {
        case 'conformsTo': return 'conformsTo';
        case 'inputOf':    return 'inputOf';
        case 'outputOf':   return 'outputOf';
        default:           return null; // tracedBy, user-defined → skip for now
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
];

// ─── Component ────────────────────────────────────────────────────────────────

const MegamodelView: React.FC<MegamodelViewProps> = ({ megamodel, viewpoints, artifactStats, onClose }) => {
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
        // Middle-click or left-click on the canvas (not on a node)
        if (e.button === 1 || (e.button === 0 && (e.target as HTMLElement).classList.contains('mm-canvas'))) {
            e.preventDefault();
            isPanning.current = true;
            panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
        }
    }, [pan]);

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

        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;

        draggingNode.current = nodeId;
        const canvasX = (e.clientX - rect.left) / zoom - pan.x;
        const canvasY = (e.clientY - rect.top)  / zoom - pan.y;
        dragOffset.current = { x: canvasX - node.x, y: canvasY - node.y };
    }, [nodeMap, pan, zoom]);

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

    // ── ESC to close ──────────────────────────────────────────────────────────
    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onClose]);

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
                    <div className="mm-view__body">
                        <div className="mm-empty-state">
                            <i className="bi bi-diagram-3 mm-empty-state__icon" />
                            <div className="mm-empty-state__title">No artifacts yet</div>
                            <div className="mm-empty-state__subtitle">
                                Add metamodels, models, and transformations to see their relationships here.
                            </div>
                        </div>
                    </div>
                </div>
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
                                        previewBars={node.previewBars}
                                        onMouseDown={handleNodeMouseDown}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MegamodelView;

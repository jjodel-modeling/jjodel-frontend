import React, { useState, useMemo, useCallback } from 'react';
import type { Megamodel, MegamodelEdge, ArtifactType, EdgeType } from '../../model/megamodel';

// ─── Layout constants ────────────────────────────────────────────────────────

const NODE_W    = 140;
const NODE_H    = 50;
const LEVEL_GAP = 100;  // vertical gap between rows
const NODE_GAP  = 24;   // horizontal gap between nodes
const PADDING   = 56;   // outer padding
const MIN_SVG_W = 500;

// ─── Types ───────────────────────────────────────────────────────────────────

interface NodeData {
    id: string;
    type: ArtifactType;
    name: string;
    level: number;
}

interface LayoutResult {
    nodes: NodeData[];
    positions: Map<string, { x: number; y: number }>;
    usedLevels: number[];
    svgWidth: number;
    svgHeight: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function typeToLevel(type: ArtifactType): number {
    switch (type) {
        case 'metamodel':     return 0;
        case 'model':         return 1;
        case 'transformation': return 2;
        case 'script':        return 2;
    }
}

function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max - 1) + '\u2026' : s;
}

function computeLayout(edges: MegamodelEdge[]): LayoutResult {
    const nodeMap = new Map<string, NodeData>();
    for (const edge of edges) {
        if (!nodeMap.has(edge.source.id)) {
            nodeMap.set(edge.source.id, { ...edge.source, level: typeToLevel(edge.source.type) });
        }
        if (!nodeMap.has(edge.target.id)) {
            nodeMap.set(edge.target.id, { ...edge.target, level: typeToLevel(edge.target.type) });
        }
    }
    const nodes = Array.from(nodeMap.values());

    const byLevel = new Map<number, NodeData[]>();
    for (const node of nodes) {
        const arr = byLevel.get(node.level) ?? [];
        arr.push(node);
        byLevel.set(node.level, arr);
    }

    const usedLevels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    const numLevels  = usedLevels.length || 1;
    const maxCount   = Math.max(...Array.from(byLevel.values()).map(a => a.length), 1);
    const svgWidth   = Math.max(maxCount * (NODE_W + NODE_GAP) - NODE_GAP + 2 * PADDING, MIN_SVG_W);
    const svgHeight  = PADDING + numLevels * NODE_H + (numLevels - 1) * LEVEL_GAP + PADDING;

    const positions = new Map<string, { x: number; y: number }>();
    usedLevels.forEach((level, idx) => {
        const levelNodes = byLevel.get(level)!;
        const totalW = levelNodes.length * NODE_W + (levelNodes.length - 1) * NODE_GAP;
        const startX = (svgWidth - totalW) / 2;
        const y = PADDING + idx * (NODE_H + LEVEL_GAP);
        levelNodes.forEach((node, i) => {
            positions.set(node.id, { x: startX + i * (NODE_W + NODE_GAP), y });
        });
    });

    return { nodes, positions, usedLevels, svgWidth, svgHeight };
}

// ─── Edge path helpers ───────────────────────────────────────────────────────

function getEdgePath(
    src: { x: number; y: number },
    tgt: { x: number; y: number },
    srcLevel: number,
    tgtLevel: number,
): string {
    const sx = src.x + NODE_W / 2;
    const tx = tgt.x + NODE_W / 2;

    if (tgtLevel < srcLevel) {
        // Upward: exit source top, enter target bottom
        const sy = src.y;
        const ty = tgt.y + NODE_H;
        const cp = (sy + ty) / 2;
        return `M ${sx} ${sy} C ${sx} ${cp} ${tx} ${cp} ${tx} ${ty}`;
    }
    if (tgtLevel > srcLevel) {
        // Downward: exit source bottom, enter target top
        const sy = src.y + NODE_H;
        const ty = tgt.y;
        const cp = (sy + ty) / 2;
        return `M ${sx} ${sy} C ${sx} ${cp} ${tx} ${cp} ${tx} ${ty}`;
    }
    // Same level: S-curve above the row, horizontal entry at target
    const sy = src.y + NODE_H / 2;
    const ty = tgt.y + NODE_H / 2;
    const arcH = 40;
    const cpOff = 40;
    if (tx >= sx) {
        return `M ${sx} ${sy} C ${sx} ${sy - arcH} ${tx - cpOff} ${ty} ${tx} ${ty}`;
    }
    return `M ${sx} ${sy} C ${sx} ${sy - arcH} ${tx + cpOff} ${ty} ${tx} ${ty}`;
}

function getEdgeLabelPos(
    src: { x: number; y: number },
    tgt: { x: number; y: number },
    srcLevel: number,
    tgtLevel: number,
): { x: number; y: number } {
    const sx = src.x + NODE_W / 2;
    const tx = tgt.x + NODE_W / 2;
    if (tgtLevel !== srcLevel) {
        const sy = tgtLevel < srcLevel ? src.y : src.y + NODE_H;
        const ty = tgtLevel < srcLevel ? tgt.y + NODE_H : tgt.y;
        return { x: (sx + tx) / 2, y: (sy + ty) / 2 };
    }
    // Same level: label above the arc
    const sy = src.y + NODE_H / 2;
    return { x: (sx + tx) / 2, y: sy - 40 };
}

// ─── Style maps ──────────────────────────────────────────────────────────────

interface EdgeStyle {
    color: string;
    strokeDasharray?: string;
    strokeWidth: number;
    markerId: string;
}

const EDGE_STYLES: Record<EdgeType, EdgeStyle> = {
    conformsTo:      { color: '#94a3b8', strokeDasharray: '6 3',  strokeWidth: 1.5, markerId: 'mm-arrow-slate'  },
    inputOf:         { color: '#0ea5e9',                           strokeWidth: 1.5, markerId: 'mm-arrow-cyan'   },
    outputOf:        { color: '#10b981',                           strokeWidth: 1.5, markerId: 'mm-arrow-green'  },
    tracedBy:        { color: '#f59e0b', strokeDasharray: '2 4',  strokeWidth: 1.5, markerId: 'mm-arrow-amber'  },
    'user-defined':  { color: '#a855f7',                           strokeWidth: 2,   markerId: 'mm-arrow-purple' },
    generatedBy:     { color: '#7F77DD', strokeDasharray: '5 3',  strokeWidth: 1.5, markerId: 'mm-arrow-violet' },
    sourceOf:        { color: '#378ADD', strokeDasharray: '5 3',  strokeWidth: 1.5, markerId: 'mm-arrow-blue'   },
};

const EDGE_LABELS: Record<EdgeType, string> = {
    conformsTo:     'conforms to',
    inputOf:        'input of',
    outputOf:       'output of',
    tracedBy:       'traced by',
    'user-defined': 'user defined',
    generatedBy:    'generated by',
    sourceOf:       'source of',
};

interface NodeStyle {
    borderColor: string;
    fillColor: string;
    iconClass: string;
    iconColor: string;
    rx: number;
    strokeDasharray?: string;
}

const NODE_STYLES: Record<ArtifactType, NodeStyle> = {
    metamodel: {
        borderColor: '#0ea5e9',
        fillColor:   'rgba(14,165,233,0.08)',
        iconClass:   'bi bi-layers',
        iconColor:   '#0ea5e9',
        rx: 4,
    },
    model: {
        borderColor: '#475569',
        fillColor:   'rgba(51,65,85,0.35)',
        iconClass:   'bi bi-file-earmark',
        iconColor:   '#94a3b8',
        rx: 4,
    },
    transformation: {
        borderColor: '#64748b',
        fillColor:   'rgba(100,116,139,0.15)',
        iconClass:   'bi bi-arrow-left-right',
        iconColor:   '#94a3b8',
        rx: 6,
    },
    script: {
        borderColor: '#64748b',
        fillColor:   'rgba(100,116,139,0.1)',
        iconClass:   'bi bi-code-slash',
        iconColor:   '#94a3b8',
        rx: 6,
        strokeDasharray: '4 2',
    },
};

const LEVEL_NAMES: Record<number, string> = {
    0: 'METAMODELS',
    1: 'MODELS',
    2: 'TRANSFORMATIONS / SCRIPTS',
};

const ARROW_MARKERS: Array<{ id: string; color: string }> = [
    { id: 'mm-arrow-slate',  color: '#94a3b8' },
    { id: 'mm-arrow-cyan',   color: '#0ea5e9' },
    { id: 'mm-arrow-green',  color: '#10b981' },
    { id: 'mm-arrow-amber',  color: '#f59e0b' },
    { id: 'mm-arrow-purple', color: '#a855f7' },
];

// ─── Component ───────────────────────────────────────────────────────────────

export interface MegamodelGraphProps {
    megamodel: Megamodel;
}

const MegamodelGraph: React.FC<MegamodelGraphProps> = ({ megamodel }) => {
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
    const [tooltip, setTooltip] = useState<{
        x: number;
        y: number;
        edge: MegamodelEdge;
    } | null>(null);

    const layout = useMemo(() => computeLayout(megamodel.edges), [megamodel.edges]);

    // Sets of node/edge IDs connected to the hovered node
    const connected = useMemo(() => {
        if (!hoveredNodeId) return null;
        const nodeIds = new Set<string>([hoveredNodeId]);
        const edgeIds = new Set<string>();
        for (const edge of megamodel.edges) {
            if (edge.source.id === hoveredNodeId || edge.target.id === hoveredNodeId) {
                nodeIds.add(edge.source.id);
                nodeIds.add(edge.target.id);
                edgeIds.add(edge.id);
            }
        }
        return { nodeIds, edgeIds };
    }, [hoveredNodeId, megamodel.edges]);

    const handleNodeClick = useCallback((nodeId: string, nodeType: ArtifactType) => {
        window.dispatchEvent(new CustomEvent('jjodel:megamodel:open-artifact', {
            detail: { artifactId: nodeId, artifactType: nodeType },
        }));
    }, []);

    // ── Empty state ───────────────────────────────────────────────────────────
    if (megamodel.edges.length === 0) {
        return (
            <div className="mm-empty-state">
                <i className="bi bi-diagram-3 mm-empty-state__icon" />
                <div className="mm-empty-state__title">No relationships yet</div>
                <div className="mm-empty-state__subtitle">
                    Add metamodels, models, and transformations to see their relationships here.
                </div>
            </div>
        );
    }

    const { nodes, positions, usedLevels, svgWidth, svgHeight } = layout;

    return (
        <div className="mm-graph-container">
            <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                preserveAspectRatio="xMidYMid meet"
                className="mm-graph-svg"
            >
                {/* Arrow markers */}
                <defs>
                    {ARROW_MARKERS.map(({ id, color }) => (
                        <marker
                            key={id}
                            id={id}
                            markerWidth="10"
                            markerHeight="7"
                            refX="10"
                            refY="3.5"
                            orient="auto"
                        >
                            <polygon points="0 0, 10 3.5, 0 7" fill={color} />
                        </marker>
                    ))}
                </defs>

                {/* Level labels */}
                {usedLevels.map((level, idx) => {
                    const y = PADDING + idx * (NODE_H + LEVEL_GAP) - 10;
                    return (
                        <text
                            key={level}
                            x={PADDING}
                            y={y}
                            fontSize={9}
                            fontWeight={700}
                            fill="#475569"
                            letterSpacing="0.06em"
                            pointerEvents="none"
                        >
                            {LEVEL_NAMES[level] ?? `LEVEL ${level}`}
                        </text>
                    );
                })}

                {/* Edges — rendered below nodes */}
                {megamodel.edges.map(edge => {
                    const srcPos = positions.get(edge.source.id);
                    const tgtPos = positions.get(edge.target.id);
                    if (!srcPos || !tgtPos) return null;

                    const srcLevel = typeToLevel(edge.source.type);
                    const tgtLevel = typeToLevel(edge.target.type);
                    const path     = getEdgePath(srcPos, tgtPos, srcLevel, tgtLevel);
                    const mid      = getEdgeLabelPos(srcPos, tgtPos, srcLevel, tgtLevel);
                    const style    = EDGE_STYLES[edge.type];
                    const label    = EDGE_LABELS[edge.type];

                    const baseOpacity = edge.origin === 'derived' ? 0.7 : 1;
                    const opacity = connected
                        ? (connected.edgeIds.has(edge.id) ? 1 : 0.12)
                        : baseOpacity;

                    return (
                        <g key={edge.id} opacity={opacity}>
                            {/* Invisible wider hit area */}
                            <path
                                d={path}
                                fill="none"
                                stroke="transparent"
                                strokeWidth={10}
                                onMouseEnter={(e) => setTooltip({ x: e.clientX, y: e.clientY, edge })}
                                onMouseMove={(e) => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                                onMouseLeave={() => setTooltip(null)}
                                style={{ cursor: 'crosshair' }}
                            />
                            {/* Visible edge */}
                            <path
                                d={path}
                                fill="none"
                                stroke={style.color}
                                strokeWidth={style.strokeWidth}
                                strokeDasharray={style.strokeDasharray}
                                markerEnd={`url(#${style.markerId})`}
                                pointerEvents="none"
                            />
                            {/* Edge label with background */}
                            <g transform={`translate(${mid.x}, ${mid.y})`} pointerEvents="none">
                                <rect x={-36} y={-7} width={72} height={13} rx={2} fill="rgba(15,23,42,0.88)" />
                                <text
                                    textAnchor="middle"
                                    y={-0.5}
                                    dominantBaseline="middle"
                                    fontSize={9}
                                    fill={style.color}
                                    letterSpacing="0.02em"
                                >
                                    {label}
                                </text>
                            </g>
                        </g>
                    );
                })}

                {/* Nodes — rendered on top of edges */}
                {nodes.map(node => {
                    const pos = positions.get(node.id);
                    if (!pos) return null;

                    const ns = NODE_STYLES[node.type];
                    const isHovered = hoveredNodeId === node.id;
                    const opacity = connected
                        ? (connected.nodeIds.has(node.id) ? 1 : 0.18)
                        : 1;

                    return (
                        <g
                            key={node.id}
                            opacity={opacity}
                            className="mm-node"
                            onClick={() => handleNodeClick(node.id, node.type)}
                            onMouseEnter={() => setHoveredNodeId(node.id)}
                            onMouseLeave={() => setHoveredNodeId(null)}
                            style={{ cursor: 'pointer' }}
                        >
                            <rect
                                x={pos.x}
                                y={pos.y}
                                width={NODE_W}
                                height={NODE_H}
                                rx={ns.rx}
                                fill={ns.fillColor}
                                stroke={ns.borderColor}
                                strokeWidth={isHovered ? 2 : 1}
                                strokeDasharray={ns.strokeDasharray}
                            />
                            <foreignObject
                                x={pos.x}
                                y={pos.y}
                                width={NODE_W}
                                height={NODE_H}
                                style={{ pointerEvents: 'none', overflow: 'hidden' }}
                            >
                                <div
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '3px',
                                        padding: '4px 8px',
                                        boxSizing: 'border-box',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                    }}>
                                        <i
                                            className={ns.iconClass}
                                            style={{ fontSize: '11px', color: ns.iconColor, flexShrink: 0 }}
                                        />
                                        <span style={{
                                            fontSize: '12px',
                                            fontWeight: 600,
                                            color: '#e2e8f0',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                        }}>
                                            {truncate(node.name, 17)}
                                        </span>
                                    </div>
                                    <span style={{
                                        fontSize: '10px',
                                        color: '#64748b',
                                        letterSpacing: '0.03em',
                                    }}>
                                        {node.type}
                                    </span>
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
            </svg>

            {/* Edge tooltip — position: fixed relative to viewport */}
            {tooltip && (
                <div
                    className="mm-tooltip"
                    style={{ left: tooltip.x + 14, top: tooltip.y - 12 }}
                >
                    <div className="mm-tooltip__type">{EDGE_LABELS[tooltip.edge.type]}</div>
                    <div className="mm-tooltip__origin">
                        {tooltip.edge.origin === 'derived' ? 'auto-derived' : 'user-defined'}
                    </div>
                    {tooltip.edge.trigger && (
                        <div className="mm-tooltip__trigger">
                            <i className="bi bi-lightning" />
                            {' '}on {tooltip.edge.trigger.event}
                        </div>
                    )}
                    {tooltip.edge.label && (
                        <div className="mm-tooltip__label">{tooltip.edge.label}</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MegamodelGraph;

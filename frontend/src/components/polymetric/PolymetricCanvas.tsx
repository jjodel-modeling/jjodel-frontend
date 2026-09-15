/**
 * PolymetricCanvas — SVG rendering engine with pan and zoom.
 *
 * Renders polymetric nodes in an SVG viewport with mouse-drag panning
 * and wheel zoom. For tree layouts, also renders parent-child edges.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { PolymetricNodeData, PolymetricViewConfig } from './polymetricViews';
import { METRIC_LABELS } from './polymetricViews';
import { computeTreeEdges, type TreeEdge } from './polymetricLayouts';
import PolymetricNode from './PolymetricNode';

interface PolymetricCanvasProps {
    nodes: PolymetricNodeData[];
    config: PolymetricViewConfig;
    onNodeClick?: (nodeId: string) => void;
}

const PolymetricCanvas: React.FC<PolymetricCanvasProps> = ({ nodes, config, onNodeClick }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [dragging, setDragging] = useState(false);
    const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
    const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

    // Compute tree edges if tree layout with showEdges enabled
    const treeEdges: TreeEdge[] = (config.layout === 'tree' && config.showEdges) ? computeTreeEdges(nodes) : [];

    // Compute scatterplot axes if scatterplot
    const isScatterplot = config.layout === 'scatterplot';

    // Compute bounding box for auto-fit
    useEffect(() => {
        if (nodes.length === 0) return;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of nodes) {
            const nx = n.x ?? 0, ny = n.y ?? 0, nw = n.width ?? 10, nh = n.height ?? 10;
            if (nx < minX) minX = nx;
            if (ny < minY) minY = ny;
            if (nx + nw > maxX) maxX = nx + nw;
            if (ny + nh > maxY) maxY = ny + nh;
        }
        const svg = svgRef.current;
        if (!svg) return;
        const rect = svg.getBoundingClientRect();
        const contentW = maxX - minX + 40;
        const contentH = maxY - minY + 40;
        const scaleX = rect.width / contentW;
        const scaleY = rect.height / contentH;
        const newZoom = Math.min(scaleX, scaleY, 2);
        setPan({ x: -minX + 20, y: -minY + 20 });
        setZoom(Math.max(newZoom, 0.2));
    }, [nodes]);

    // Pan handlers
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (e.button !== 0) return;
        setDragging(true);
        dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }, [pan]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging) return;
        const dx = (e.clientX - dragStart.current.x) / zoom;
        const dy = (e.clientY - dragStart.current.y) / zoom;
        setPan({ x: dragStart.current.panX + dx, y: dragStart.current.panY + dy });
    }, [dragging, zoom]);

    const handleMouseUp = useCallback(() => {
        setDragging(false);
    }, []);

    // Zoom handler
    const handleWheel = useCallback((e: React.WheelEvent) => {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 0.9 : 1.1;
        setZoom(prev => Math.min(Math.max(prev * factor, 0.1), 5));
    }, []);

    const metricMapping = {
        width: config.metrics.width,
        height: config.metrics.height,
        color: config.metrics.color,
    };

    return (
        <svg
            ref={svgRef}
            className="polymetric-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: dragging ? 'grabbing' : 'grab' }}
        >
            <defs>
                <filter id="tooltip-shadow" x="-10%" y="-10%" width="130%" height="130%">
                    <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#000" floodOpacity="0.1" />
                </filter>
            </defs>
            <g transform={`scale(${zoom}) translate(${pan.x}, ${pan.y})`}>
                {/* Scatterplot axes */}
                {isScatterplot && nodes.length > 0 && (
                    <ScatterplotAxes config={config} />
                )}

                {/* Tree edges (rendered before nodes for correct z-order) */}
                {treeEdges.length > 0 && (
                    <g className="pmv-edges">
                        {treeEdges.map(edge => (
                            <line
                                key={`${edge.sourceId}-${edge.targetId}`}
                                x1={edge.x1}
                                y1={edge.y1}
                                x2={edge.x2}
                                y2={edge.y2}
                                stroke="#94a3b8"
                                strokeWidth={0.8}
                                strokeOpacity={0.6}
                            />
                        ))}
                    </g>
                )}

                {/* Nodes — render hovered node last so tooltip is on top */}
                {nodes.filter(n => n.id !== hoveredNodeId).map(node => (
                    <PolymetricNode
                        key={node.id}
                        node={node}
                        metricMapping={metricMapping}
                        onClick={onNodeClick}
                        onHover={setHoveredNodeId}
                    />
                ))}
                {hoveredNodeId && nodes.filter(n => n.id === hoveredNodeId).map(node => (
                    <PolymetricNode
                        key={node.id}
                        node={node}
                        metricMapping={metricMapping}
                        onClick={onNodeClick}
                        onHover={setHoveredNodeId}
                    />
                ))}
            </g>
        </svg>
    );
};

// ---------------------------------------------------------------------------
// Scatterplot axes sub-component
// ---------------------------------------------------------------------------

const ScatterplotAxes: React.FC<{ config: PolymetricViewConfig }> = ({ config }) => {
    const xLabel = METRIC_LABELS[config.metrics.posX!] ?? config.metrics.posX;
    const yLabel = METRIC_LABELS[config.metrics.posY!] ?? config.metrics.posY;

    return (
        <g className="scatterplot-axes" opacity={0.5}>
            {/* X axis */}
            <line x1={50} y1={560} x2={760} y2={560} stroke="#cbd5e1" strokeWidth={1} />
            <text x={400} y={585} textAnchor="middle" fill="#94a3b8" fontSize={11}>
                {xLabel}
            </text>
            {/* Y axis */}
            <line x1={50} y1={50} x2={50} y2={560} stroke="#cbd5e1" strokeWidth={1} />
            <text x={20} y={300} textAnchor="middle" fill="#94a3b8" fontSize={11}
                  transform="rotate(-90, 20, 300)">
                {yLabel}
            </text>
        </g>
    );
};

export default React.memo(PolymetricCanvas);

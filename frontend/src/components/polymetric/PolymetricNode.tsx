/**
 * PolymetricNode — SVG rectangle renderer for a single polymetric node.
 *
 * Visual encoding:
 * - width/height: metric-driven dimensions
 * - fill: interpolated from light (#f1f5f9) to dark (#334155) via colorValue
 * - hover: cyan stroke, tooltip
 */

import React, { useCallback, useState } from 'react';
import type { PolymetricNodeData, MetricKey } from './polymetricViews';
import { METRIC_LABELS } from './polymetricViews';

interface PolymetricNodeProps {
    node: PolymetricNodeData;
    /** Which metrics are mapped to width/height/color for the tooltip */
    metricMapping: {
        width: MetricKey;
        height: MetricKey;
        color: MetricKey;
    };
    onClick?: (nodeId: string) => void;
    onHover?: (nodeId: string | null) => void;
}

// Color interpolation: slate-200 (#e2e8f0) -> slate-600 (#475569)
const COLOR_LOW  = { r: 226, g: 232, b: 240 };
const COLOR_HIGH = { r: 71,  g: 85,  b: 105 };

function interpolateColor(t: number): string {
    const r = Math.round(COLOR_LOW.r + (COLOR_HIGH.r - COLOR_LOW.r) * t);
    const g = Math.round(COLOR_LOW.g + (COLOR_HIGH.g - COLOR_LOW.g) * t);
    const b = Math.round(COLOR_LOW.b + (COLOR_HIGH.b - COLOR_LOW.b) * t);
    return `rgb(${r},${g},${b})`;
}

function textColor(t: number): string {
    return t > 0.5 ? '#f1f5f9' : '#1e293b';
}

const PolymetricNode: React.FC<PolymetricNodeProps> = ({ node, metricMapping, onClick, onHover }) => {
    const [hovered, setHovered] = useState(false);

    const x = node.x ?? 0;
    const y = node.y ?? 0;
    const w = node.width ?? 10;
    const h = node.height ?? 10;
    const cv = node.colorValue ?? 0;

    const fill = interpolateColor(cv);
    const showLabel = w >= 40;

    const handleClick = useCallback(() => {
        onClick?.(node.id);
    }, [onClick, node.id]);

    return (
        <g
            onMouseEnter={() => { setHovered(true); onHover?.(node.id); }}
            onMouseLeave={() => { setHovered(false); onHover?.(null); }}
            onClick={handleClick}
            style={{ cursor: 'pointer' }}
        >
            <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={3}
                ry={3}
                fill={fill}
                stroke={hovered ? '#0ea5e9' : '#94a3b8'}
                strokeWidth={hovered ? 1 : 0.5}
            />
            {showLabel && (
                <text
                    x={x + w / 2}
                    y={y + h / 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={textColor(cv)}
                    fontSize={7}
                    fontFamily="'Inter Variable', 'Inter', -apple-system, sans-serif"
                    pointerEvents="none"
                >
                    {node.label.length > Math.floor(w / 6)
                        ? node.label.slice(0, Math.floor(w / 6) - 1) + '\u2026'
                        : node.label}
                </text>
            )}
            {hovered && (() => {
                const metricEntries = Object.entries(node.metrics);
                const tooltipH = 16 + metricEntries.length * 10 + 8;
                return (
                    <g>
                        <rect
                            x={x + w + 8}
                            y={y - 4}
                            width={140}
                            height={tooltipH}
                            rx={5}
                            fill="#ffffff"
                            fillOpacity={0.97}
                            stroke="#e2e8f0"
                            strokeWidth={1}
                            filter="url(#tooltip-shadow)"
                        />
                        <text
                            x={x + w + 14}
                            y={y + 8}
                            fill="#1e293b"
                            fontSize={8}
                            fontWeight={600}
                            fontFamily="'Inter Variable', 'Inter', -apple-system, sans-serif"
                        >
                            {node.label}
                        </text>
                        {metricEntries.map(([key, value], i) => (
                            <text
                                key={key}
                                x={x + w + 14}
                                y={y + 20 + i * 10}
                                fill="#94a3b8"
                                fontSize={7}
                                fontFamily="'IBM Plex Mono', Monaco, monospace"
                            >
                                {METRIC_LABELS[key as MetricKey] ?? key}:{' '}
                                <tspan fill="#334155">
                                    {key === 'Completeness'
                                        ? `${((value ?? 0) * 100).toFixed(0)}%`
                                        : value ?? 0}
                                </tspan>
                            </text>
                        ))}
                    </g>
                );
            })()}
        </g>
    );
};

export default React.memo(PolymetricNode);

/**
 * MappingLinesOverlay Component
 * SVG overlay that draws connection lines between mapped elements
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

export interface MappingLine {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'class' | 'attribute' | 'reference';
    isInferred?: boolean;
    isSelected?: boolean;
}

interface LineCoordinates {
    id: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    type: 'class' | 'attribute' | 'reference';
    isInferred?: boolean;
    isSelected?: boolean;
}

export interface MappingLinesOverlayProps {
    lines: MappingLine[];
    containerRef: React.RefObject<HTMLDivElement>;
    onLineClick?: (lineId: string) => void;
    onLineDelete?: (lineId: string) => void;
}

// Colors for different mapping types
const LINE_COLORS: Record<string, string> = {
    class: '#0ea5e9',      // cyan
    attribute: '#10b981',   // green
    reference: '#8b5cf6',   // purple
};

export const MappingLinesOverlay: React.FC<MappingLinesOverlayProps> = ({
    lines,
    containerRef,
    onLineClick,
    onLineDelete,
}) => {
    const [coordinates, setCoordinates] = useState<LineCoordinates[]>([]);
    const [hoveredLine, setHoveredLine] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Calculate line coordinates from element positions
    const calculateCoordinates = useCallback(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const containerRect = container.getBoundingClientRect();

        const newCoordinates: LineCoordinates[] = [];

        lines.forEach(line => {
            // Find source and target elements by data attribute
            const sourceEl = container.querySelector(`[data-element-id="${line.sourceId}"]`);
            const targetEl = container.querySelector(`[data-element-id="${line.targetId}"]`);

            if (sourceEl && targetEl) {
                const sourceRect = sourceEl.getBoundingClientRect();
                const targetRect = targetEl.getBoundingClientRect();

                // Calculate positions relative to container
                const x1 = sourceRect.right - containerRect.left;
                const y1 = sourceRect.top + sourceRect.height / 2 - containerRect.top;
                const x2 = targetRect.left - containerRect.left;
                const y2 = targetRect.top + targetRect.height / 2 - containerRect.top;

                newCoordinates.push({
                    id: line.id,
                    x1,
                    y1,
                    x2,
                    y2,
                    type: line.type,
                    isInferred: line.isInferred,
                    isSelected: line.isSelected,
                });
            }
        });

        setCoordinates(newCoordinates);
    }, [lines, containerRef]);

    // Recalculate on lines change or resize
    useEffect(() => {
        calculateCoordinates();

        const observer = new ResizeObserver(() => {
            calculateCoordinates();
        });

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        // Also listen to scroll events
        const handleScroll = () => calculateCoordinates();
        containerRef.current?.addEventListener('scroll', handleScroll, true);

        return () => {
            observer.disconnect();
            containerRef.current?.removeEventListener('scroll', handleScroll, true);
        };
    }, [calculateCoordinates, containerRef]);

    // Generate curved path
    const generatePath = useCallback((coords: LineCoordinates): string => {
        const { x1, y1, x2, y2 } = coords;
        const midX = (x1 + x2) / 2;

        // Bezier curve control points
        const cx1 = midX;
        const cy1 = y1;
        const cx2 = midX;
        const cy2 = y2;

        return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
    }, []);

    // Handle line interactions
    const handleLineMouseEnter = useCallback((lineId: string) => {
        setHoveredLine(lineId);
    }, []);

    const handleLineMouseLeave = useCallback(() => {
        setHoveredLine(null);
    }, []);

    const handleLineClick = useCallback((lineId: string) => {
        onLineClick?.(lineId);
    }, [onLineClick]);

    const handleDeleteClick = useCallback((e: React.MouseEvent, lineId: string) => {
        e.stopPropagation();
        onLineDelete?.(lineId);
    }, [onLineDelete]);

    if (coordinates.length === 0) {
        return <div className="jjtl-mapping-overlay-empty" />;
    }

    return (
        <svg
            ref={svgRef}
            className="jjtl-mapping-overlay"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                overflow: 'visible',
            }}
        >
            <defs>
                {/* Arrow marker */}
                <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="7"
                    refX="9"
                    refY="3.5"
                    orient="auto"
                >
                    <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill="#64748b"
                    />
                </marker>

                {/* Markers for each type */}
                {Object.entries(LINE_COLORS).map(([type, color]) => (
                    <marker
                        key={type}
                        id={`arrowhead-${type}`}
                        markerWidth="10"
                        markerHeight="7"
                        refX="9"
                        refY="3.5"
                        orient="auto"
                    >
                        <polygon
                            points="0 0, 10 3.5, 0 7"
                            fill={color}
                        />
                    </marker>
                ))}
            </defs>

            {/* Render lines */}
            {coordinates.map(coords => {
                const color = LINE_COLORS[coords.type] || LINE_COLORS.class;
                const isHovered = hoveredLine === coords.id;
                const isSelected = coords.isSelected;
                const strokeWidth = isSelected ? 3 : isHovered ? 2.5 : 2;
                const opacity = coords.isInferred ? 0.5 : 1;

                return (
                    <g key={coords.id}>
                        {/* Invisible wider path for easier click */}
                        <path
                            d={generatePath(coords)}
                            fill="none"
                            stroke="transparent"
                            strokeWidth={12}
                            style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                            onMouseEnter={() => handleLineMouseEnter(coords.id)}
                            onMouseLeave={handleLineMouseLeave}
                            onClick={() => handleLineClick(coords.id)}
                        />

                        {/* Visible line */}
                        <path
                            d={generatePath(coords)}
                            fill="none"
                            stroke={color}
                            strokeWidth={strokeWidth}
                            strokeDasharray={coords.isInferred ? '5,5' : undefined}
                            opacity={opacity}
                            markerEnd={`url(#arrowhead-${coords.type})`}
                            style={{
                                transition: 'stroke-width 150ms ease',
                                filter: isSelected ? 'drop-shadow(0 0 3px rgba(14, 165, 233, 0.5))' : undefined,
                            }}
                        />

                        {/* Delete button on hover */}
                        {isHovered && onLineDelete && (
                            <g
                                transform={`translate(${(coords.x1 + coords.x2) / 2 - 10}, ${(coords.y1 + coords.y2) / 2 - 10})`}
                                style={{ pointerEvents: 'all', cursor: 'pointer' }}
                                onClick={(e) => handleDeleteClick(e, coords.id)}
                            >
                                <circle
                                    cx="10"
                                    cy="10"
                                    r="10"
                                    fill="#ef4444"
                                />
                                <text
                                    x="10"
                                    y="14"
                                    textAnchor="middle"
                                    fill="white"
                                    fontSize="12"
                                    fontWeight="bold"
                                >
                                    ×
                                </text>
                            </g>
                        )}
                    </g>
                );
            })}
        </svg>
    );
};

export default MappingLinesOverlay;

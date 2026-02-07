/**
 * MappingLinesOverlay Component
 * SVG overlay that draws connection lines between mapped elements
 *
 * Features:
 * - Non-overlapping lines (offset on vertical segment)
 * - Distinct colors for each mapping
 * - Hover/selection highlighting
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';

export interface MappingLine {
    id: string;
    sourceId: string;
    targetId: string;
    type: 'class' | 'attribute' | 'reference';
    isInferred?: boolean;
    isSelected?: boolean;
    /** Status for visibility logic: pending only shows when hovered, toInsert always shows */
    status?: 'pending' | 'toInsert' | 'rejected';
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
    status?: 'pending' | 'toInsert' | 'rejected';
}

export interface MappingLinesOverlayProps {
    lines: MappingLine[];
    containerRef: React.RefObject<HTMLDivElement>;
    hoveredLineId?: string | null;
    onLineClick?: (lineId: string) => void;
    onLineHover?: (lineId: string | null) => void;
}

// ============================================
// DISTINCT COLORS PALETTE
// ============================================

// 12 distinguishable colors (ColorBrewer-inspired categorical palette)
const DISTINCT_COLORS = [
    '#3cb44b', // Green
    '#4363d8', // Blue
    '#e6194b', // Red
    '#f58231', // Orange
    '#911eb4', // Purple
    '#42d4f4', // Cyan
    '#f032e6', // Magenta
    '#469990', // Teal
    '#9A6324', // Brown
    '#aaffc3', // Mint
    '#dcbeff', // Lavender
    '#ffe119', // Yellow
];

// Highlighted versions (more saturated)
const DISTINCT_COLORS_HIGHLIGHT = [
    '#00cc00', // Green
    '#0000ff', // Blue
    '#ff0000', // Red
    '#ff6600', // Orange
    '#9900cc', // Purple
    '#00ccff', // Cyan
    '#ff00ff', // Magenta
    '#009999', // Teal
    '#996600', // Brown
    '#00ff99', // Mint
    '#cc99ff', // Lavender
    '#ffcc00', // Yellow
];

/**
 * Get color for a line by index
 */
const getLineColor = (index: number, isHighlighted: boolean): string => {
    const colors = isHighlighted ? DISTINCT_COLORS_HIGHLIGHT : DISTINCT_COLORS;
    return colors[index % colors.length];
};

/**
 * Calculate offset to prevent overlapping lines
 * Distributes lines evenly around the center
 */
const calculateLineOffset = (index: number, totalLines: number): number => {
    if (totalLines <= 1) return 0;

    const spacing = 6; // pixels between lines (reduced from 10 for tighter grouping)
    const totalWidth = (totalLines - 1) * spacing;
    const startOffset = -totalWidth / 2;
    return startOffset + (index * spacing);
};

export const MappingLinesOverlay: React.FC<MappingLinesOverlayProps> = ({
    lines,
    containerRef,
    hoveredLineId,
    onLineClick,
    onLineHover,
}) => {
    const [coordinates, setCoordinates] = useState<LineCoordinates[]>([]);
    const [internalHoveredLine, setInternalHoveredLine] = useState<string | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);

    // Combine internal hover and external hover
    const effectiveHoveredLine = hoveredLineId ?? internalHoveredLine;

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

                // Source is in left tree (start from right edge)
                // Target is in right tree (end at left edge)
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
                    status: line.status,
                });
            }
        });

        setCoordinates(newCoordinates);
    }, [lines, containerRef]);

    // Recalculate on lines change, resize, or scroll
    useEffect(() => {
        calculateCoordinates();

        let rafId: number | null = null;
        const debouncedCalculate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(calculateCoordinates);
        };

        const resizeObserver = new ResizeObserver(debouncedCalculate);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        const mutationObserver = new MutationObserver(debouncedCalculate);
        if (containerRef.current) {
            mutationObserver.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        }

        const handleScroll = debouncedCalculate;
        containerRef.current?.addEventListener('scroll', handleScroll, true);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            containerRef.current?.removeEventListener('scroll', handleScroll, true);
        };
    }, [calculateCoordinates, containerRef]);

    /**
     * Generate Manhattan-style path with smooth rounded corners
     * ALWAYS uses Manhattan routing (horizontal → vertical → horizontal)
     * Even when elements are at the same vertical level
     */
    const generatePath = useCallback((
        coords: LineCoordinates,
        index: number,
        total: number
    ): string => {
        const { x1, y1, x2, y2 } = coords;

        // Corner radius for smooth turns
        const baseRadius = 3;

        // Calculate horizontal offset for middle segment to prevent overlapping
        const offset = calculateLineOffset(index, total);
        const midX = ((x1 + x2) / 2) + offset;

        // Calculate small vertical offset for TARGET endpoint only to prevent arrowhead overlap
        const targetVerticalSpacing = 4;
        const targetYOffset = total > 1 ? (index - (total - 1) / 2) * targetVerticalSpacing : 0;
        const adjustedY2 = y2 + targetYOffset;

        // Vertical distance
        const dy = adjustedY2 - y1;
        const absDy = Math.abs(dy);

        // Calculate safe radius that doesn't exceed available space
        const maxRadiusFromDy = absDy > 0 ? absDy / 2 : baseRadius;
        const maxRadiusFromDx = Math.abs(midX - x1) - 5;
        const safeRadius = Math.max(2, Math.min(baseRadius, maxRadiusFromDy, maxRadiusFromDx));

        // ALWAYS Manhattan - even when elements are at same level
        if (absDy < 1) {
            // Elements at same level: create small detour to maintain Manhattan style
            const detourOffset = 8;
            return [
                `M ${x1} ${y1}`,
                `L ${midX - safeRadius} ${y1}`,
                `Q ${midX} ${y1}, ${midX} ${y1 + detourOffset}`,
                `L ${midX} ${adjustedY2 - detourOffset}`,
                `Q ${midX} ${adjustedY2}, ${midX + safeRadius} ${adjustedY2}`,
                `L ${x2} ${adjustedY2}`
            ].join(' ');
        }

        // Normal Manhattan path
        if (dy > 0) {
            // Target is BELOW source: → ↓ →
            return [
                `M ${x1} ${y1}`,
                `L ${midX - safeRadius} ${y1}`,
                `Q ${midX} ${y1}, ${midX} ${y1 + safeRadius}`,
                `L ${midX} ${adjustedY2 - safeRadius}`,
                `Q ${midX} ${adjustedY2}, ${midX + safeRadius} ${adjustedY2}`,
                `L ${x2} ${adjustedY2}`
            ].join(' ');
        } else {
            // Target is ABOVE source: → ↑ →
            return [
                `M ${x1} ${y1}`,
                `L ${midX - safeRadius} ${y1}`,
                `Q ${midX} ${y1}, ${midX} ${y1 - safeRadius}`,
                `L ${midX} ${adjustedY2 + safeRadius}`,
                `Q ${midX} ${adjustedY2}, ${midX + safeRadius} ${adjustedY2}`,
                `L ${x2} ${adjustedY2}`
            ].join(' ');
        }
    }, []);

    // Handle line interactions
    const handleLineMouseEnter = useCallback((lineId: string) => {
        setInternalHoveredLine(lineId);
        onLineHover?.(lineId);
    }, [onLineHover]);

    const handleLineMouseLeave = useCallback(() => {
        setInternalHoveredLine(null);
        onLineHover?.(null);
    }, [onLineHover]);

    const handleLineClick = useCallback((lineId: string) => {
        onLineClick?.(lineId);
    }, [onLineClick]);

    // Filter visible coordinates (for offset calculation)
    const visibleCoordinates = coordinates.filter(coords => {
        if (coords.status === 'rejected') return false;
        if (coords.status === 'pending') {
            const isHighlighted = effectiveHoveredLine === coords.id || coords.isSelected;
            return isHighlighted;
        }
        return true;
    });

    if (coordinates.length === 0) {
        return <div className="jjtl-mapping-overlay-empty" />;
    }

    return (
        <svg
            ref={svgRef}
            className="jjtl-mapping-overlay"
        >
            <defs>
                {/* Dynamic markers for each visible line */}
                {visibleCoordinates.map((coords, index) => {
                    const colorNormal = getLineColor(index, false);
                    const colorHighlight = getLineColor(index, true);

                    return (
                        <React.Fragment key={`markers-${coords.id}`}>
                            <marker
                                id={`arrow-${coords.id}-normal`}
                                markerWidth="6"
                                markerHeight="5"
                                refX="5"
                                refY="2.5"
                                orient="auto"
                            >
                                <polyline
                                    points="0 0, 5 2.5, 0 5"
                                    fill="none"
                                    stroke={colorNormal}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </marker>
                            <marker
                                id={`arrow-${coords.id}-highlighted`}
                                markerWidth="6"
                                markerHeight="5"
                                refX="5"
                                refY="2.5"
                                orient="auto"
                            >
                                <polyline
                                    points="0 0, 5 2.5, 0 5"
                                    fill="none"
                                    stroke={colorHighlight}
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </marker>
                        </React.Fragment>
                    );
                })}
            </defs>

            {/* Render lines */}
            {visibleCoordinates.map((coords, index) => {
                const isHovered = effectiveHoveredLine === coords.id;
                const isSelected = coords.isSelected;
                const isHighlighted = isHovered || isSelected;

                // Get unique color for this line
                const strokeColor = getLineColor(index, isHighlighted);
                const strokeWidth = isHighlighted ? 2 : 1.2;
                const strokeOpacity = isHighlighted ? 1 : 0.7;
                const markerId = isHighlighted
                    ? `arrow-${coords.id}-highlighted`
                    : `arrow-${coords.id}-normal`;

                return (
                    <g key={coords.id}>
                        {/* Invisible wider path for easier click */}
                        <path
                            d={generatePath(coords, index, visibleCoordinates.length)}
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
                            d={generatePath(coords, index, visibleCoordinates.length)}
                            fill="none"
                            stroke={strokeColor}
                            strokeWidth={strokeWidth}
                            strokeOpacity={strokeOpacity}
                            strokeDasharray={coords.isInferred ? '4,3' : undefined}
                            markerEnd={`url(#${markerId})`}
                            style={{
                                transition: 'stroke 150ms ease, stroke-width 150ms ease, stroke-opacity 150ms ease',
                            }}
                        />
                    </g>
                );
            })}
        </svg>
    );
};

export default MappingLinesOverlay;

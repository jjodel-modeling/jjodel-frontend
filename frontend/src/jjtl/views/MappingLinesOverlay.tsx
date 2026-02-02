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

// Type-based colors for mapping arrows (Green/Pink for max contrast)
const MAPPING_COLORS = {
    class: {
        normal: '#6ee7b7',      // Green mint pastel (emerald-300)
        highlighted: '#10b981', // Green emerald (emerald-500)
    },
    attribute: {
        normal: '#fca5a5',      // Pink coral pastel (red-300)
        highlighted: '#ef4444', // Red coral (red-500)
    },
    reference: {
        normal: '#fca5a5',      // Same as attribute
        highlighted: '#ef4444',
    },
} as const;

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

    // Debug: Log incoming lines
    useEffect(() => {
        console.log('[MappingLinesOverlay] Lines received:', lines.length, lines.map(l => ({ id: l.id, status: l.status })));
    }, [lines]);

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
                // Arrow points from source → target (left → right)
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
            } else {
                // Debug: log when elements are not found
                if (process.env.NODE_ENV === 'development') {
                    if (!sourceEl) console.warn(`[MappingLinesOverlay] Source element not found: ${line.sourceId}`);
                    if (!targetEl) console.warn(`[MappingLinesOverlay] Target element not found: ${line.targetId}`);
                }
            }
        });

        console.log('[MappingLinesOverlay] Calculated coordinates:', newCoordinates.length, newCoordinates.map(c => ({ id: c.id, status: c.status })));
        setCoordinates(newCoordinates);
    }, [lines, containerRef]);

    // Recalculate on lines change, resize, or scroll
    useEffect(() => {
        // Initial calculation
        calculateCoordinates();

        // Debounce recalculations with requestAnimationFrame
        let rafId: number | null = null;
        const debouncedCalculate = () => {
            if (rafId) cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(calculateCoordinates);
        };

        // Observe resize
        const resizeObserver = new ResizeObserver(debouncedCalculate);
        if (containerRef.current) {
            resizeObserver.observe(containerRef.current);
        }

        // Observe DOM changes (tree expand/collapse)
        const mutationObserver = new MutationObserver(debouncedCalculate);
        if (containerRef.current) {
            mutationObserver.observe(containerRef.current, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style'],
            });
        }

        // Listen to scroll events (capture phase for child scrolls)
        const handleScroll = debouncedCalculate;
        containerRef.current?.addEventListener('scroll', handleScroll, true);

        return () => {
            if (rafId) cancelAnimationFrame(rafId);
            resizeObserver.disconnect();
            mutationObserver.disconnect();
            containerRef.current?.removeEventListener('scroll', handleScroll, true);
        };
    }, [calculateCoordinates, containerRef]);

    // Generate Manhattan path with rounded corners
    const generatePath = useCallback((coords: LineCoordinates): string => {
        const { x1, y1, x2, y2 } = coords;

        // Corner radius for rounded turns
        const radius = 8;

        // Calculate midpoint for the vertical segment
        const midX = (x1 + x2) / 2;

        // If elements are close vertically, use simple straight line
        if (Math.abs(y1 - y2) < 10) {
            return `M ${x1} ${y1} L ${x2} ${y2}`;
        }

        // Manhattan path: horizontal -> vertical -> horizontal
        // With rounded corners using quadratic bezier curves

        // Build path with rounded corners
        let path = `M ${x1} ${y1}`;

        // Horizontal to first corner (with rounded turn)
        if (y1 < y2) {
            // Source is above target
            path += ` L ${midX - radius} ${y1}`;
            path += ` Q ${midX} ${y1}, ${midX} ${y1 + radius}`;
            path += ` L ${midX} ${y2 - radius}`;
            path += ` Q ${midX} ${y2}, ${midX + radius} ${y2}`;
        } else {
            // Source is below target
            path += ` L ${midX - radius} ${y1}`;
            path += ` Q ${midX} ${y1}, ${midX} ${y1 - radius}`;
            path += ` L ${midX} ${y2 + radius}`;
            path += ` Q ${midX} ${y2}, ${midX + radius} ${y2}`;
        }

        // Final horizontal to target
        path += ` L ${x2} ${y2}`;

        return path;
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

    if (coordinates.length === 0) {
        return <div className="jjtl-mapping-overlay-empty" />;
    }

    return (
        <svg
            ref={svgRef}
            className="jjtl-mapping-overlay"
        >
            <defs>
                {/* Class mapping arrows - Green */}
                <marker id="arrow-class-normal" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                    <polyline points="0 0, 5 2.5, 0 5" fill="none" stroke={MAPPING_COLORS.class.normal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="arrow-class-highlighted" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                    <polyline points="0 0, 5 2.5, 0 5" fill="none" stroke={MAPPING_COLORS.class.highlighted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>

                {/* Attribute mapping arrows - Pink */}
                <marker id="arrow-attr-normal" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                    <polyline points="0 0, 5 2.5, 0 5" fill="none" stroke={MAPPING_COLORS.attribute.normal} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
                <marker id="arrow-attr-highlighted" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
                    <polyline points="0 0, 5 2.5, 0 5" fill="none" stroke={MAPPING_COLORS.attribute.highlighted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
            </defs>

            {/* Render lines */}
            {coordinates.map(coords => {
                const isHovered = effectiveHoveredLine === coords.id;
                const isSelected = coords.isSelected;
                const isHighlighted = isHovered || isSelected;

                // Visibility logic based on status:
                // - pending: only show when hovered or selected
                // - toInsert: always show (gray when not hovered, cyan when hovered)
                // - rejected: never show
                // - undefined (legacy): always show
                if (coords.status === 'rejected') {
                    return null;
                }
                if (coords.status === 'pending' && !isHighlighted) {
                    return null;
                }

                // Get colors based on mapping type (class vs attribute)
                const mappingType = coords.type === 'class' ? 'class' : 'attribute';
                const colors = MAPPING_COLORS[mappingType];

                // Style based on state and type
                const strokeColor = isHighlighted ? colors.highlighted : colors.normal;
                const strokeWidth = isHighlighted ? 1.5 : 1;
                const strokeOpacity = isHighlighted ? 1 : 0.6;
                const markerId = mappingType === 'class'
                    ? (isHighlighted ? 'arrow-class-highlighted' : 'arrow-class-normal')
                    : (isHighlighted ? 'arrow-attr-highlighted' : 'arrow-attr-normal');

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

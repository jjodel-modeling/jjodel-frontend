/**
 * Editor V3 — SegmentHandles: draggable handles on internal Manhattan segments.
 *
 * Rules:
 * - 1 segment (straight): no handles
 * - 2 segments: no handles (both adjacent to anchors)
 * - 3+ segments: handles on internal segments only (not first/last)
 *
 * Drag constraint:
 * - Horizontal segment → vertical drag only
 * - Vertical segment → horizontal drag only
 */

import React, { useCallback, useState, memo } from 'react';
import { getPathSegments, type SegmentInfo } from './edgeRouting';

export interface SegmentHandlesProps {
    path: string;
    edgeId: string;
    selected: boolean;
    onWaypointChange?: (segmentIndex: number, offset: number) => void;
}

function SegmentHandlesInner({ path, edgeId, selected, onWaypointChange }: SegmentHandlesProps) {
    const [dragging, setDragging] = useState<number | null>(null);

    const segments = getPathSegments(path);

    // Only render handles for internal segments (not first/last)
    const internalSegments = segments.filter(
        (_, i) => i > 0 && i < segments.length - 1
    );

    if (!selected || internalSegments.length === 0) return null;

    const handleMouseDown = useCallback((segIndex: number, isHorizontal: boolean, startX: number, startY: number) => {
        setDragging(segIndex);

        const handleMouseMove = (e: MouseEvent) => {
            const offset = isHorizontal
                ? e.clientY - startY
                : e.clientX - startX;
            onWaypointChange?.(segIndex, offset);
        };

        const handleMouseUp = () => {
            setDragging(null);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    }, [onWaypointChange]);

    return (
        <g className="v3-segment-handles">
            {internalSegments.map(seg => (
                <circle
                    key={`seg-${seg.index}`}
                    cx={seg.midX}
                    cy={seg.midY}
                    r={dragging === seg.index ? 5 : 4}
                    className={`v3-segment-handle ${dragging === seg.index ? 'v3-segment-handle--dragging' : ''}`}
                    style={{ cursor: seg.isHorizontal ? 'ns-resize' : 'ew-resize' }}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(seg.index, seg.isHorizontal, e.clientX, e.clientY);
                    }}
                />
            ))}
        </g>
    );
}

export const SegmentHandles = memo(SegmentHandlesInner);

/**
 * Editor V3 — DynamicAnchors: Handle pool for React Flow nodes.
 *
 * Forked from editor-v2/components/DynamicHandles.tsx.
 * Renders MAX_HANDLES_PER_SIDE handles per side, always in DOM from mount.
 * - Active handles (connected to edges): visible, positioned by distribution.
 * - First inactive handle per side: visible on hover (ghost for new connections).
 * - Other inactive handles: invisible but registered in React Flow.
 *
 * V3 addition: supports named anchors from DVertex.anchors dictionary.
 */

import React, { useMemo, useRef, useState } from 'react';
import { Handle, Position, useEdges } from '@xyflow/react';
import { MAX_HANDLES_PER_SIDE, SIDES, HOVER_THRESHOLD } from '../constants';
import type { AnchorSide } from '../types';

const SIDE_TO_POSITION: Record<AnchorSide, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

interface DynamicAnchorsProps {
    nodeId: string;
    /** Named anchors from DVertex.anchors (percentages 0-1) */
    anchors?: Record<string, { x: number; y: number }>;
}

function DynamicAnchorsComponent({ nodeId, anchors }: DynamicAnchorsProps) {
    const edges = useEdges();
    const [hoveredSide, setHoveredSide] = useState<AnchorSide | null>(null);
    const markerRef = useRef<HTMLDivElement>(null);

    // Stable edge topology fingerprint — only changes when connections change
    const edgeTopologyKey = useMemo(() => {
        const relevant = edges
            .filter(e => e.source === nodeId || e.target === nodeId)
            .map(e => `${e.id}:${e.source}:${e.target}:${e.type}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}`)
            .sort()
            .join('|');
        return relevant;
    }, [edges, nodeId]);

    // Derive active handles from edge handle assignments
    const activeHandles = useMemo(() => {
        const active = new Map<string, number>();
        const sidePorts = new Map<string, Set<string>>();

        for (const edge of edges) {
            if (edge.source === nodeId && edge.sourceHandle) {
                const side = edge.sourceHandle.split('-')[0];
                if (!sidePorts.has(side)) sidePorts.set(side, new Set());
                sidePorts.get(side)!.add(edge.sourceHandle);
            }
            if (edge.target === nodeId && edge.targetHandle) {
                const side = edge.targetHandle.split('-')[0];
                if (!sidePorts.has(side)) sidePorts.set(side, new Set());
                sidePorts.get(side)!.add(edge.targetHandle);
            }
        }

        for (const [, handleIds] of sidePorts) {
            const sorted = Array.from(handleIds).sort();
            const count = sorted.length;
            sorted.forEach((handleId, index) => {
                const position = count === 1 ? 0.5 : (index + 1) / (count + 1);
                active.set(handleId, position);
            });
        }

        return active;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeTopologyKey, nodeId]);

    // Handle hover detection for ghost handles
    const handleMouseMove = useMemo(() => {
        return (e: React.MouseEvent) => {
            const rect = markerRef.current?.parentElement?.getBoundingClientRect();
            if (!rect) return;

            const mx = e.clientX - rect.left;
            const my = e.clientY - rect.top;
            const w = rect.width;
            const h = rect.height;

            let nearest: AnchorSide | null = null;
            const dists: [AnchorSide, number][] = [
                ['top', my],
                ['bottom', h - my],
                ['left', mx],
                ['right', w - mx],
            ];

            for (const [side, dist] of dists) {
                if (dist < HOVER_THRESHOLD) {
                    if (!nearest || dist < (dists.find(d => d[0] === nearest)?.[1] ?? Infinity)) {
                        nearest = side;
                    }
                }
            }

            if (nearest !== hoveredSide) {
                setHoveredSide(nearest);
            }
        };
    }, [hoveredSide]);

    const handleMouseLeave = () => setHoveredSide(null);

    const handles: React.ReactNode[] = [];

    // Pre-allocated pool handles (side-based)
    for (const side of SIDES) {
        const position = SIDE_TO_POSITION[side];

        for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++) {
            const handleId = `${side}-${index}`;
            const isActive = activeHandles.has(handleId);
            const activePos = activeHandles.get(handleId);
            const isGhost = !isActive && index === 0 && hoveredSide === side;

            const className = isActive
                ? 'v3-anchor v3-anchor--connected'
                : isGhost
                    ? 'v3-anchor v3-anchor--ghost'
                    : 'v3-anchor v3-anchor--pool';

            const style: React.CSSProperties = isActive && activePos !== undefined
                ? (side === 'top' || side === 'bottom')
                    ? { left: `${activePos * 100}%` }
                    : { top: `${activePos * 100}%` }
                : {};

            // Render both source and target handles with same ID
            handles.push(
                <Handle
                    key={`t-${handleId}`}
                    type="target"
                    id={handleId}
                    position={position}
                    className={className}
                    style={style}
                />,
                <Handle
                    key={`s-${handleId}`}
                    type="source"
                    id={handleId}
                    position={position}
                    className={className}
                    style={style}
                />,
            );
        }
    }

    // Named anchors from DVertex.anchors (rendered as absolute-positioned handles)
    if (anchors) {
        for (const [name, pos] of Object.entries(anchors)) {
            const anchorId = `anchor-${name}`;
            handles.push(
                <Handle
                    key={`t-${anchorId}`}
                    type="target"
                    id={anchorId}
                    position={Position.Left} // Position doesn't matter for absolute handles
                    className="v3-anchor v3-anchor--named"
                    style={{
                        position: 'absolute',
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />,
                <Handle
                    key={`s-${anchorId}`}
                    type="source"
                    id={anchorId}
                    position={Position.Left}
                    className="v3-anchor v3-anchor--named"
                    style={{
                        position: 'absolute',
                        left: `${pos.x * 100}%`,
                        top: `${pos.y * 100}%`,
                        transform: 'translate(-50%, -50%)',
                    }}
                />,
            );
        }
    }

    return (
        <div
            ref={markerRef}
            className="v3-anchors-container"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {handles}
        </div>
    );
}

export const DynamicAnchors = React.memo(DynamicAnchorsComponent);

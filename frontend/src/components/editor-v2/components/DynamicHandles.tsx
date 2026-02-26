import React, { useMemo, useRef, useState, useEffect, useLayoutEffect } from 'react';
import { Handle, Position, useEdges, useNodes, useUpdateNodeInternals } from '@xyflow/react';
import { computePortDistribution, MAX_HANDLES_PER_SIDE, type Side } from '../utils/portDistribution';

const SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];

const SIDE_TO_POSITION: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

interface DynamicHandlesProps {
    nodeId: string;
}

/** Distance in px from node edge within which a side is considered "hovered". */
const HOVER_THRESHOLD = 15;

/**
 * Pre-allocated Handle Pool for React Flow nodes.
 *
 * Renders MAX_HANDLES_PER_SIDE handles per side, always in DOM from mount.
 * - Active handles (connected to edges): visible, positioned by portDistribution.
 * - First inactive handle per side: visible on hover (ghost behavior for new connections).
 * - Other inactive handles: invisible (1×1px, opacity:0) but REGISTERED in React Flow.
 *
 * This eliminates the chicken-and-egg timing issue: when an edge references
 * "bottom-1", that handle already exists in the DOM with a known measured position.
 * React keys are stable (${side}-${index}) so handles never mount/unmount.
 */
function DynamicHandles({ nodeId }: DynamicHandlesProps) {
    const edges = useEdges();
    const nodes = useNodes();
    const updateNodeInternals = useUpdateNodeInternals();

    // --- Hover state for ghost-like behavior on inactive handles ---
    const [hoveredSide, setHoveredSide] = useState<Side | null>(null);
    const hoveredSideRef = useRef<Side | null>(null);
    const markerRef = useRef<HTMLDivElement>(null);

    // --- Stable edge topology fingerprint ---
    const edgeTopologyKey = useMemo(() => {
        const relevant = edges
            .filter(e => e.source === nodeId || e.target === nodeId)
            .map(e => `${e.id}:${e.source}:${e.target}:${e.type}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}`)
            .sort()
            .join('|');
        return relevant;
    }, [edges, nodeId]);

    // --- Stable node positions key ---
    const nodePositionsKey = useMemo(() => {
        const parts: string[] = [];
        for (const n of nodes) {
            const w = (n.measured?.width ?? (n as any).width ?? 180) as number;
            const h = (n.measured?.height ?? (n as any).height ?? 80) as number;
            parts.push(`${n.id}:${Math.round(n.position.x)}:${Math.round(n.position.y)}:${Math.round(w)}:${Math.round(h)}`);
        }
        return parts.join('|');
    }, [nodes]);

    const nodePositions = useMemo(() => {
        const map = new Map<string, { centerX: number; centerY: number }>();
        for (const n of nodes) {
            const w = (n.measured?.width ?? (n as any).width ?? 180) as number;
            const h = (n.measured?.height ?? (n as any).height ?? 80) as number;
            map.set(n.id, {
                centerX: n.position.x + w / 2,
                centerY: n.position.y + h / 2,
            });
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [nodePositionsKey]);

    // --- Compute active handles from port distribution ---
    const activeHandles = useMemo(() => {
        const allNodeIds = nodes.map(n => n.id);
        const { nodeHandles } = computePortDistribution(edges, allNodeIds, nodePositions);
        const config = nodeHandles.get(nodeId);

        // Map: handleId → position (0-1 along side)
        const active = new Map<string, number>();

        if (config) {
            for (const side of SIDES) {
                for (const port of config[side]) {
                    active.set(port.handleId, port.position);
                }
            }
        }

        return active;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeTopologyKey, nodePositionsKey, nodeId]);

    // --- Hover detection on parent .mm-node element ---
    useEffect(() => {
        const marker = markerRef.current;
        if (!marker) return;

        const nodeEl = marker.closest('.mm-node') as HTMLElement | null;
        if (!nodeEl) return;

        const onMouseMove = (e: MouseEvent) => {
            const rect = nodeEl.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const w = rect.width;
            const h = rect.height;

            const distTop = y;
            const distBottom = h - y;
            const distLeft = x;
            const distRight = w - x;
            const minDist = Math.min(distTop, distBottom, distLeft, distRight);

            let side: Side | null = null;
            if (minDist < HOVER_THRESHOLD) {
                if (minDist === distTop) side = 'top';
                else if (minDist === distBottom) side = 'bottom';
                else if (minDist === distLeft) side = 'left';
                else side = 'right';
            }

            if (side !== hoveredSideRef.current) {
                hoveredSideRef.current = side;
                setHoveredSide(side);
            }
        };

        const onMouseLeave = () => {
            hoveredSideRef.current = null;
            setHoveredSide(null);
        };

        nodeEl.addEventListener('mousemove', onMouseMove);
        nodeEl.addEventListener('mouseleave', onMouseLeave);
        return () => {
            nodeEl.removeEventListener('mousemove', onMouseMove);
            nodeEl.removeEventListener('mouseleave', onMouseLeave);
        };
    }, []); // DOM ref-based — stable closures via refs + state setters

    // --- updateNodeInternals when handle positions change ---
    const activeHandlesKey = useMemo(() => {
        const entries = Array.from(activeHandles.entries()).sort(([a], [b]) => a.localeCompare(b));
        return entries.map(([id, pos]) => `${id}:${pos}`).join(',');
    }, [activeHandles]);

    const lastCommittedKeyRef = useRef<string>('');

    // useLayoutEffect: runs after DOM commit but BEFORE browser paint.
    // Handle positions may change (active handles redistribute), so we tell RF
    // to re-measure. Since all handles are always in DOM (pool pattern),
    // RF always finds them — this just updates their measured positions.
    useLayoutEffect(() => {
        if (activeHandlesKey !== lastCommittedKeyRef.current) {
            lastCommittedKeyRef.current = activeHandlesKey;
            updateNodeInternals(nodeId);
        }
    }, [activeHandlesKey, nodeId, updateNodeInternals]);

    // --- Render ALL handles from pool (stable keys, never mount/unmount) ---
    return (
        <>
            {/* Hidden marker for DOM traversal to parent .mm-node */}
            <div ref={markerRef} style={{ display: 'none' }} />

            {SIDES.flatMap(side => {
                const positionProp = side === 'left' || side === 'right' ? 'top' : 'left';
                const handles: React.ReactNode[] = [];

                for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++) {
                    const handleId = `${side}-${index}`;
                    const activePosition = activeHandles.get(handleId);
                    const isActive = activePosition !== undefined;

                    // Ghost behavior: show the first inactive handle on hover
                    // (the next available slot for creating a new connection).
                    // A handle is "first inactive" if all lower indices are active.
                    let isFirstInactive = false;
                    if (!isActive) {
                        isFirstInactive = true;
                        for (let i = 0; i < index; i++) {
                            if (!activeHandles.has(`${side}-${i}`)) {
                                isFirstInactive = false;
                                break;
                            }
                        }
                    }
                    const isGhostVisible = isFirstInactive && hoveredSide === side;

                    // Position: active handles at distribution-computed position,
                    // inactive at 50% (center of side)
                    const position = isActive ? activePosition : 0.5;

                    // CSS class determines visibility + style
                    const className = isActive
                        ? 'mm-anchor mm-anchor--connected'
                        : isGhostVisible
                            ? 'mm-anchor mm-anchor--ghost mm-anchor--ghost-visible'
                            : 'mm-anchor mm-anchor--pool-inactive';

                    // Inline style: active = position only; inactive = force invisible
                    // (inline styles override RF's own inline styles on <Handle>)
                    const style: React.CSSProperties = isActive
                        ? { [positionProp]: `${position * 100}%` }
                        : isGhostVisible
                            ? { [positionProp]: '50%' }
                            : {
                                [positionProp]: '50%',
                                visibility: 'hidden' as const,
                                opacity: 0,
                                pointerEvents: 'none' as const,
                                // NO width:0, NO height:0 — React Flow MUST be able to measure
                                // via getBoundingClientRect(). Dimensions come from CSS .mm-anchor (8x8px).
                                border: 'none',
                                background: 'transparent',
                            };

                    handles.push(
                        <React.Fragment key={handleId}>
                            <Handle
                                type="target"
                                position={SIDE_TO_POSITION[side]}
                                id={handleId}
                                className={className}
                                style={style}
                                isConnectableStart={false}
                            />
                            <Handle
                                type="source"
                                position={SIDE_TO_POSITION[side]}
                                id={handleId}
                                className={className}
                                style={style}
                                isConnectableEnd={false}
                            />
                        </React.Fragment>
                    );
                }

                return handles;
            })}
        </>
    );
}

export default DynamicHandles;

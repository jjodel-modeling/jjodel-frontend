import React from 'react';
import { Handle, Position, useEdges, useNodes, useUpdateNodeInternals } from '@xyflow/react';
import { useMemo, useEffect } from 'react';
import { computePortDistribution, type Side } from '../utils/portDistribution';

const MAX_HANDLES_PER_SIDE = 4;
const SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];

interface DynamicHandlesProps {
    nodeId: string;
    maxHandlesPerSide?: number;
}

const SIDE_TO_POSITION: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

/**
 * Pre-allocated Handle Pool for React Flow nodes.
 *
 * Renders MAX_HANDLES_PER_SIDE handles per side (both source and target types),
 * always present in the DOM. Active handles (connected to edges) are positioned
 * and visible; inactive handles are invisible but registered in React Flow.
 *
 * This eliminates the chicken-and-egg problem where edges referencing indexed
 * handles (e.g. right-1) would fail because the handle didn't exist yet.
 */
function DynamicHandles({ nodeId, maxHandlesPerSide = MAX_HANDLES_PER_SIDE }: DynamicHandlesProps) {
    const edges = useEdges();
    const nodes = useNodes();
    const updateNodeInternals = useUpdateNodeInternals();

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
    }, [nodes]);

    // Compute which handles are active (connected to edges) and their positions (0–1)
    const activeHandles = useMemo(() => {
        const allNodeIds = nodes.map(n => n.id);
        const { nodeHandles } = computePortDistribution(edges, allNodeIds, nodePositions);
        const config = nodeHandles.get(nodeId);

        const active = new Map<string, number>();
        if (config) {
            for (const side of SIDES) {
                for (const port of config[side]) {
                    active.set(port.handleId, port.position);
                }
            }
        }
        return active;
    }, [edges, nodes, nodePositions, nodeId]);

    // Serialize active handle positions to detect changes
    const activeHandlesKey = useMemo(() => {
        const entries = Array.from(activeHandles.entries()).sort(([a], [b]) => a.localeCompare(b));
        return entries.map(([id, pos]) => `${id}:${pos}`).join(',');
    }, [activeHandles]);

    // Force React Flow to re-read handle DOM positions when they change.
    // React Flow caches handle bounds on mount and only updates when
    // position/id/type props change — NOT when style changes.
    useEffect(() => {
        updateNodeInternals(nodeId);
    }, [activeHandlesKey, nodeId, updateNodeInternals]);

    return (
        <>
            {SIDES.flatMap(side =>
                Array.from({ length: maxHandlesPerSide }, (_, index) => {
                    const handleId = `${side}-${index}`;
                    const position = activeHandles.get(handleId);
                    const isActive = position !== undefined;

                    const positionProp = side === 'left' || side === 'right' ? 'top' : 'left';
                    const style: React.CSSProperties = isActive
                        ? { [positionProp]: `${position * 100}%` }
                        : {};

                    const className = isActive ? 'mm-anchor' : 'mm-anchor--pool';

                    return (
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
                })
            )}
        </>
    );
}

export default DynamicHandles;

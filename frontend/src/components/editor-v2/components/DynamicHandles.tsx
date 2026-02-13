import { Handle, Position, useEdges, type Node as RFNode } from '@xyflow/react';
import { useMemo } from 'react';

type Side = 'top' | 'right' | 'bottom' | 'left';
type EdgeType = 'reference' | 'inheritance';

interface PortInfo {
    handleId: string;
    position: number; // 0-1 along the side
}

interface DynamicHandlesProps {
    nodeId: string;
}

const POSITION_MAP: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

/**
 * Extracts the base side from a handle ID.
 */
function getBaseSide(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (['top', 'right', 'bottom', 'left'].includes(base)) {
        return base as Side;
    }
    return 'right';
}

/**
 * Computes required handles for a node based on connected edges.
 */
function computeNodeHandles(nodeId: string, edges: any[]): Record<Side, PortInfo[]> {
    const sideGroups: Record<Side, Map<string, { edgeIds: string[]; edgeType: EdgeType; role: 'source' | 'target' }>> = {
        top: new Map(),
        right: new Map(),
        bottom: new Map(),
        left: new Map(),
    };

    // Collect all edges connected to this node
    for (const edge of edges) {
        const edgeType = (edge.type as EdgeType) || 'reference';

        // As source
        if (edge.source === nodeId) {
            const side = getBaseSide(edge.sourceHandle);
            const key = `source:${edge.id}`;
            sideGroups[side].set(key, {
                edgeIds: [edge.id],
                edgeType,
                role: 'source',
            });
        }

        // As target
        if (edge.target === nodeId) {
            const side = getBaseSide(edge.targetHandle);

            if (edgeType === 'inheritance') {
                // Inheritance fan-in: merge into single group
                const inhKey = 'target:inheritance';
                const existing = sideGroups[side].get(inhKey);
                if (existing) {
                    existing.edgeIds.push(edge.id);
                } else {
                    sideGroups[side].set(inhKey, {
                        edgeIds: [edge.id],
                        edgeType: 'inheritance',
                        role: 'target',
                    });
                }
            } else {
                // Reference: each edge gets its own port
                const key = `target:${edge.id}`;
                sideGroups[side].set(key, {
                    edgeIds: [edge.id],
                    edgeType,
                    role: 'target',
                });
            }
        }
    }

    // Convert to port info
    const result: Record<Side, PortInfo[]> = {
        top: [],
        right: [],
        bottom: [],
        left: [],
    };

    for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
        const groups = Array.from(sideGroups[side].values());
        const totalPorts = Math.max(1, groups.length);

        if (groups.length === 0) {
            // Always have at least the default handle
            result[side].push({ handleId: side, position: 0.5 });
        } else {
            groups.forEach((group, index) => {
                const handleId = totalPorts > 1 ? `${side}-${index}` : side;
                const position = totalPorts === 1
                    ? 0.5
                    : 0.25 + (0.5 * index) / (totalPorts - 1);
                result[side].push({ handleId, position });
            });
        }
    }

    return result;
}

/**
 * Component that renders dynamic handles for a node.
 * Handles are distributed based on connected edges.
 */
function DynamicHandles({ nodeId }: DynamicHandlesProps) {
    const edges = useEdges();

    const handleConfig = useMemo(
        () => computeNodeHandles(nodeId, edges),
        [nodeId, edges]
    );

    return (
        <>
            {/* Top handles */}
            {handleConfig.top.map((port) => (
                <Handle
                    key={port.handleId}
                    type="source"
                    position={Position.Top}
                    id={port.handleId}
                    className="mm-anchor"
                    style={{ left: `${port.position * 100}%` }}
                />
            ))}

            {/* Right handles */}
            {handleConfig.right.map((port) => (
                <Handle
                    key={port.handleId}
                    type="source"
                    position={Position.Right}
                    id={port.handleId}
                    className="mm-anchor"
                    style={{ top: `${port.position * 100}%` }}
                />
            ))}

            {/* Bottom handles */}
            {handleConfig.bottom.map((port) => (
                <Handle
                    key={port.handleId}
                    type="source"
                    position={Position.Bottom}
                    id={port.handleId}
                    className="mm-anchor"
                    style={{ left: `${port.position * 100}%` }}
                />
            ))}

            {/* Left handles */}
            {handleConfig.left.map((port) => (
                <Handle
                    key={port.handleId}
                    type="source"
                    position={Position.Left}
                    id={port.handleId}
                    className="mm-anchor"
                    style={{ top: `${port.position * 100}%` }}
                />
            ))}
        </>
    );
}

export default DynamicHandles;

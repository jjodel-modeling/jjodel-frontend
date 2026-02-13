import { useMemo, useCallback } from 'react';
import { useEdges, useNodes, type Edge, type Node } from '@xyflow/react';

type Side = 'top' | 'right' | 'bottom' | 'left';
type EdgeType = 'reference' | 'inheritance';

interface PortGroup {
    edgeIds: string[];
    edgeType: EdgeType;
    role: 'source' | 'target';
}

interface PortAssignment {
    handleId: string;
    position: number; // 0-1 along the side
}

interface NodePortConfig {
    top: PortAssignment[];
    right: PortAssignment[];
    bottom: PortAssignment[];
    left: PortAssignment[];
}

/**
 * Extracts the base side from a handle ID.
 * "right" -> "right", "right-0" -> "right", "bottom-1" -> "bottom"
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
 * Computes port groups for all edges.
 * Groups edges by nodeId:side, considering edge type for distribution.
 */
function computePortGroups(edges: Edge[]): Map<string, PortGroup[]> {
    const groups = new Map<string, PortGroup[]>();

    for (const edge of edges) {
        const edgeType = (edge.type as EdgeType) || 'reference';
        const sourceSide = getBaseSide(edge.sourceHandle);
        const targetSide = getBaseSide(edge.targetHandle);

        // === SOURCE SIDE ===
        // Each edge source has its own port (we don't group sources)
        const sourceKey = `${edge.source}:${sourceSide}`;
        if (!groups.has(sourceKey)) groups.set(sourceKey, []);
        const sourceGroups = groups.get(sourceKey)!;

        sourceGroups.push({
            edgeIds: [edge.id],
            edgeType,
            role: 'source',
        });

        // === TARGET SIDE ===
        const targetKey = `${edge.target}:${targetSide}`;
        if (!groups.has(targetKey)) groups.set(targetKey, []);
        const targetGroups = groups.get(targetKey)!;

        if (edgeType === 'inheritance') {
            // Inheritance fan-in: all inheritance edges to same node+side share one port
            const existingInhGroup = targetGroups.find(
                (g) => g.edgeType === 'inheritance' && g.role === 'target'
            );
            if (existingInhGroup) {
                existingInhGroup.edgeIds.push(edge.id);
            } else {
                targetGroups.push({
                    edgeIds: [edge.id],
                    edgeType: 'inheritance',
                    role: 'target',
                });
            }
        } else {
            // Reference: each edge has its own port
            targetGroups.push({
                edgeIds: [edge.id],
                edgeType: 'reference',
                role: 'target',
            });
        }
    }

    return groups;
}

/**
 * Assigns handle IDs to edges based on port groups.
 * Returns a map of edgeId -> { sourceHandle, targetHandle }
 */
function assignHandleIds(
    groups: Map<string, PortGroup[]>
): Map<string, { sourceHandle: string; targetHandle: string }> {
    const edgeHandles = new Map<string, { sourceHandle?: string; targetHandle?: string }>();

    for (const [key, portGroups] of groups) {
        const [, side] = key.split(':');
        const totalPorts = portGroups.length;

        portGroups.forEach((group, portIndex) => {
            // Generate handle ID: if multiple ports, add index suffix
            const handleId = totalPorts > 1 ? `${side}-${portIndex}` : side;

            for (const edgeId of group.edgeIds) {
                const existing = edgeHandles.get(edgeId) || {};
                if (group.role === 'source') {
                    existing.sourceHandle = handleId;
                } else {
                    existing.targetHandle = handleId;
                }
                edgeHandles.set(edgeId, existing);
            }
        });
    }

    // Convert to final format
    const result = new Map<string, { sourceHandle: string; targetHandle: string }>();
    for (const [edgeId, handles] of edgeHandles) {
        result.set(edgeId, {
            sourceHandle: handles.sourceHandle || 'right',
            targetHandle: handles.targetHandle || 'left',
        });
    }

    return result;
}

/**
 * Computes port configurations for each node.
 * Returns positions for dynamic handles.
 */
function computeNodePorts(
    groups: Map<string, PortGroup[]>,
    nodes: Node[]
): Map<string, NodePortConfig> {
    const nodeConfigs = new Map<string, NodePortConfig>();

    // Initialize all nodes with empty config
    for (const node of nodes) {
        nodeConfigs.set(node.id, {
            top: [],
            right: [],
            bottom: [],
            left: [],
        });
    }

    // Populate based on groups
    for (const [key, portGroups] of groups) {
        const [nodeId, side] = key.split(':') as [string, Side];
        const config = nodeConfigs.get(nodeId);
        if (!config) continue;

        const totalPorts = portGroups.length;

        portGroups.forEach((group, portIndex) => {
            const handleId = totalPorts > 1 ? `${side}-${portIndex}` : side;
            // Distribute ports evenly: position from 0.2 to 0.8 of the side
            const position = totalPorts === 1
                ? 0.5
                : 0.2 + (0.6 * portIndex) / (totalPorts - 1);

            config[side].push({ handleId, position });
        });
    }

    return nodeConfigs;
}

/**
 * Hook that manages port distribution for edges.
 * Separates reference and inheritance edges on the same node side.
 */
export function usePortDistribution() {
    const edges = useEdges();
    const nodes = useNodes();

    // Compute port groups and assignments
    const { edgeHandleAssignments, nodePortConfigs } = useMemo(() => {
        const groups = computePortGroups(edges);
        const assignments = assignHandleIds(groups);
        const portConfigs = computeNodePorts(groups, nodes);

        return {
            edgeHandleAssignments: assignments,
            nodePortConfigs: portConfigs,
        };
    }, [edges, nodes]);

    // Get handles for a specific edge
    const getEdgeHandles = useCallback(
        (edgeId: string) => {
            return edgeHandleAssignments.get(edgeId) || { sourceHandle: 'right', targetHandle: 'left' };
        },
        [edgeHandleAssignments]
    );

    // Get port config for a specific node
    const getNodePorts = useCallback(
        (nodeId: string): NodePortConfig => {
            return (
                nodePortConfigs.get(nodeId) || {
                    top: [{ handleId: 'top', position: 0.5 }],
                    right: [{ handleId: 'right', position: 0.5 }],
                    bottom: [{ handleId: 'bottom', position: 0.5 }],
                    left: [{ handleId: 'left', position: 0.5 }],
                }
            );
        },
        [nodePortConfigs]
    );

    return {
        edgeHandleAssignments,
        nodePortConfigs,
        getEdgeHandles,
        getNodePorts,
    };
}

export type { PortAssignment, NodePortConfig, Side };

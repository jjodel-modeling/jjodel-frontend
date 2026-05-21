/**
 * Port Distribution — Single Source of Truth
 *
 * Computes indexed handle IDs for both edges (sourceHandle/targetHandle)
 * and nodes (which Handle elements to render on each side).
 *
 * Used by:
 * - EditorV2.tsx (applyDistribution → edge handle assignment)
 * - DynamicHandles.tsx (node handle rendering)
 */

type Side = 'top' | 'right' | 'bottom' | 'left';

interface PortInfo {
    handleId: string;     // e.g. "right-0", "right-1"
    position: number;     // 0-1 along the side
}

interface EdgeMinimal {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string;
}

interface NodePosition {
    centerX: number;
    centerY: number;
}

/**
 * Extracts the base side from a handle ID.
 * "right" → "right", "right-0" → "right", "bottom-1" → "bottom"
 */
function getBaseSide(handleId: string | null | undefined): Side {
    if (!handleId) return 'right';
    const base = handleId.split('-')[0];
    if (['top', 'right', 'bottom', 'left'].includes(base)) {
        return base as Side;
    }
    return 'right';
}

interface PortGroup {
    edgeIds: string[];
    edgeType: string;
    role: 'source' | 'target';
    otherNodeIds: string[];
}

/**
 * Core port distribution algorithm.
 * Single source of truth — used by both edge handle assignment and DynamicHandles rendering.
 *
 * Returns:
 * - edgeHandles: Map<edgeId, { sourceHandle, targetHandle }> — indexed handle IDs per edge
 * - nodeHandles: Map<nodeId, Record<Side, PortInfo[]>> — handle configs per node
 */
function computePortDistribution(
    edges: EdgeMinimal[],
    nodeIds: string[],
    nodePositions?: Map<string, NodePosition>,
): {
    edgeHandles: Map<string, { sourceHandle: string; targetHandle: string }>;
    nodeHandles: Map<string, Record<Side, PortInfo[]>>;
} {
    // === STEP 1: Group edges by node:side ===
    const sideGroups = new Map<string, PortGroup[]>();

    for (const edge of edges) {
        const edgeType = edge.type || 'reference';
        const sourceSide = getBaseSide(edge.sourceHandle);
        const targetSide = getBaseSide(edge.targetHandle);

        // --- Source side ---
        const sourceKey = `${edge.source}:${sourceSide}:source`;
        if (!sideGroups.has(sourceKey)) sideGroups.set(sourceKey, []);

        if (edgeType === 'inheritance') {
            // Inheritance fan-out: all inheritance edges FROM same node+side share ONE port.
            // Mirrors the target-side fan-in. In UML, a child class has a single
            // generalization arrow stub even when extending multiple parents.
            const sourceGroups = sideGroups.get(sourceKey)!;
            const existingInh = sourceGroups.find(
                g => g.edgeType === 'inheritance' && g.role === 'source'
            );
            if (existingInh) {
                existingInh.edgeIds.push(edge.id);
                existingInh.otherNodeIds.push(edge.target);
            } else {
                sourceGroups.push({
                    edgeIds: [edge.id],
                    edgeType: 'inheritance',
                    role: 'source',
                    otherNodeIds: [edge.target],
                });
            }
        } else {
            // Non-inheritance: each edge gets its own port
            sideGroups.get(sourceKey)!.push({
                edgeIds: [edge.id],
                edgeType,
                role: 'source',
                otherNodeIds: [edge.target],
            });
        }

        // --- Target side ---
        const targetKey = `${edge.target}:${targetSide}:target`;
        if (!sideGroups.has(targetKey)) sideGroups.set(targetKey, []);
        const targetGroups = sideGroups.get(targetKey)!;

        if (edgeType === 'inheritance') {
            // Inheritance fan-in: all inheritance edges to same node+side share ONE port
            const existingInh = targetGroups.find(
                g => g.edgeType === 'inheritance' && g.role === 'target'
            );
            if (existingInh) {
                existingInh.edgeIds.push(edge.id);
                existingInh.otherNodeIds.push(edge.source);
            } else {
                targetGroups.push({
                    edgeIds: [edge.id],
                    edgeType: 'inheritance',
                    role: 'target',
                    otherNodeIds: [edge.source],
                });
            }
        } else {
            // Reference: each edge gets its own port
            targetGroups.push({
                edgeIds: [edge.id],
                edgeType: 'reference',
                role: 'target',
                otherNodeIds: [edge.source],
            });
        }
    }

    // === STEP 2: Spatial sorting to prevent crossings ===
    if (nodePositions) {
        for (const [key, groups] of sideGroups) {
            if (groups.length <= 1) continue;
            const side = key.split(':')[1] as Side;
            const isHorizontal = side === 'top' || side === 'bottom';

            groups.sort((a, b) => {
                const centerA = averagePosition(a.otherNodeIds, nodePositions);
                const centerB = averagePosition(b.otherNodeIds, nodePositions);
                return isHorizontal
                    ? centerA.centerX - centerB.centerX
                    : centerA.centerY - centerB.centerY;
            });
        }
    }

    // === STEP 3: Assign indexed handle IDs ===
    const edgeHandleAccum = new Map<string, { sourceHandle?: string; targetHandle?: string }>();

    for (const [key, groups] of sideGroups) {
        const side = key.split(':')[1];

        groups.forEach((group, index) => {
            const handleId = `${side}-${index}`;

            for (const edgeId of group.edgeIds) {
                const existing = edgeHandleAccum.get(edgeId) || {};
                if (group.role === 'source') {
                    existing.sourceHandle = handleId;
                } else {
                    existing.targetHandle = handleId;
                }
                edgeHandleAccum.set(edgeId, existing);
            }
        });
    }

    // Finalize edge handles
    const edgeHandles = new Map<string, { sourceHandle: string; targetHandle: string }>();
    for (const [edgeId, handles] of edgeHandleAccum) {
        edgeHandles.set(edgeId, {
            sourceHandle: handles.sourceHandle || 'right-0',
            targetHandle: handles.targetHandle || 'left-0',
        });
    }

    // === STEP 4: Compute node handle configs ===
    const nodeHandles = new Map<string, Record<Side, PortInfo[]>>();

    // Initialize all nodes with EMPTY handles per side.
    // Sides with no edges get no ports — the ghost handles in DynamicHandles
    // provide connection points. This ensures the ghost handle ID ("side-0")
    // matches what getNextFreeHandleIndex returns for the first edge,
    // eliminating the chicken-and-egg timing issue where an edge would
    // reference a handle ID that has no pre-measured DOM element.
    for (const nodeId of nodeIds) {
        nodeHandles.set(nodeId, {
            top: [],
            right: [],
            bottom: [],
            left: [],
        });
    }

    // Override with actual distribution from groups
    for (const [key, groups] of sideGroups) {
        const [nodeId, sideStr] = key.split(':');
        const side = sideStr as Side;
        const config = nodeHandles.get(nodeId);
        if (!config) continue;

        const ports: PortInfo[] = [];
        groups.forEach((group, index) => {
            const handleId = `${side}-${index}`;
            const position = groups.length === 1
                ? 0.5
                : (index + 1) / (groups.length + 1);
            ports.push({ handleId, position });
        });

        config[side] = ports;
    }

    return { edgeHandles, nodeHandles };
}

function averagePosition(
    nodeIds: string[],
    positions: Map<string, NodePosition>,
): NodePosition {
    let sumX = 0, sumY = 0, count = 0;
    for (const id of nodeIds) {
        const pos = positions.get(id);
        if (pos) {
            sumX += pos.centerX;
            sumY += pos.centerY;
            count++;
        }
    }
    return count > 0
        ? { centerX: sumX / count, centerY: sumY / count }
        : { centerX: 0, centerY: 0 };
}

const MAX_HANDLES_PER_SIDE = 4;

/**
 * Finds the next free handle index for a given node + side + role.
 *
 * Scans existing edges to find which indices are already in use,
 * then returns the first available index (0..MAX_HANDLES_PER_SIDE-1).
 * Falls back to 0 if all slots are occupied.
 */
function getNextFreeHandleIndex(
    nodeId: string,
    side: string,
    role: 'source' | 'target',
    existingEdges: EdgeMinimal[],
): number {
    const usedIndexes = new Set<number>();

    for (const edge of existingEdges) {
        if (role === 'source' && edge.source === nodeId) {
            const handle = edge.sourceHandle;
            if (handle?.startsWith(`${side}-`)) {
                usedIndexes.add(parseInt(handle.split('-')[1], 10));
            }
        }
        if (role === 'target' && edge.target === nodeId) {
            const handle = edge.targetHandle;
            if (handle?.startsWith(`${side}-`)) {
                usedIndexes.add(parseInt(handle.split('-')[1], 10));
            }
        }
    }

    for (let i = 0; i < MAX_HANDLES_PER_SIDE; i++) {
        if (!usedIndexes.has(i)) return i;
    }
    return 0;
}

export { computePortDistribution, getBaseSide, getNextFreeHandleIndex, MAX_HANDLES_PER_SIDE };
export type { Side, PortInfo, EdgeMinimal, NodePosition };

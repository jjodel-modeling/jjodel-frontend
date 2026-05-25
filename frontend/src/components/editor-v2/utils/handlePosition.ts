/**
 * Handle positioning — single source of truth for "where the handle ${side}-${i}
 * physically sits on a node".
 *
 * The percentage formula previously lived only inside DynamicHandles.tsx. The
 * inheritance tree connector (useTreeLayout) anchored its child-side branches at
 * the node center, bypassing the assigned handle and overlapping references that
 * share the same side. Extracting the formula here lets both consumers agree on a
 * single landing point per handle.
 *
 * Pure: no DOM, no React, no ReactFlow internals — testable in isolation.
 */
import { getBaseSide, MAX_HANDLES_PER_SIDE, type Side } from './portDistribution';

/** Parse a handle id ("top-0", "left-2") into its side and numeric index. */
function parseHandleId(handleId: string): { side: Side; index: number } {
    const side = getBaseSide(handleId);
    const m = handleId.match(/-(\d+)$/);
    const index = m ? parseInt(m[1], 10) : 0;
    return { side, index };
}

/**
 * Active same-role handle IDs on one side of a node, in ascending index order.
 *
 * Mirrors how DynamicHandles derives `sourceHandlesOnSide`/`targetHandlesOnSide`:
 * a handle counts for a role when some edge uses it in that role on this side.
 * The returned arrays are the canonical input for the single-role rank used by
 * computeHandlePercent (rank = indexOf within the matching array).
 */
export function computeSideRoleHandles(
    edges: { source: string; target: string; sourceHandle?: string | null; targetHandle?: string | null }[],
    nodeId: string,
    side: Side,
): { sourceHandles: string[]; targetHandles: string[] } {
    const sourceRoles = new Set<string>();
    const targetRoles = new Set<string>();
    for (const e of edges) {
        if (e.source === nodeId && e.sourceHandle) sourceRoles.add(e.sourceHandle);
        if (e.target === nodeId && e.targetHandle) targetRoles.add(e.targetHandle);
    }
    const sourceHandles: string[] = [];
    const targetHandles: string[] = [];
    for (let i = 0; i < MAX_HANDLES_PER_SIDE; i++) {
        const hid = `${side}-${i}`;
        if (sourceRoles.has(hid)) sourceHandles.push(hid);
        if (targetRoles.has(hid)) targetHandles.push(hid);
    }
    return { sourceHandles, targetHandles };
}

/**
 * Fraction (0..1) along a side at which a handle physically sits.
 *
 * Ported 1:1 from DynamicHandles.tsx:228-242:
 * - both roles active on the side → segregated layout: source in the first half,
 *   target in the second half, indexed by the handle's own numeric index;
 * - a single role active → uniform distribution (rank+1)/(count+1), where rank is
 *   the handle's position among same-role active handles (0.5 when absent).
 */
export function computeHandlePercent(params: {
    handleId: string;
    role: 'source' | 'target';
    hasBothRoles: boolean;
    roleRank: number;
    roleCount: number;
}): number {
    const { handleId, role, hasBothRoles, roleRank, roleCount } = params;
    if (hasBothRoles) {
        const { index } = parseHandleId(handleId);
        const base = (index + 0.5) / (2 * MAX_HANDLES_PER_SIDE);
        return role === 'source' ? base : 0.5 + base;
    }
    return roleCount > 0 && roleRank >= 0
        ? (roleRank + 1) / (roleCount + 1)
        : 0.5;
}

/**
 * Physical position (canvas coordinates) of `handleId` on a node.
 *
 * Single source of truth shared by DynamicHandles (rendering) and useTreeLayout
 * (inheritance branch landing point). `hasBothRoles` is derived from the two side
 * counts; the single-role rank must be supplied by the caller (indexOf within the
 * same-role active handles on the side) so the result matches DynamicHandles
 * exactly even when handles are not contiguous from index 0.
 */
export function computeHandlePositionForNode(params: {
    nodeX: number;
    nodeY: number;
    nodeWidth: number;
    nodeHeight: number;
    handleId: string;
    role: 'source' | 'target';
    sourceCountOnSide: number;
    targetCountOnSide: number;
    roleRank: number;
}): { x: number; y: number } {
    const { nodeX, nodeY, nodeWidth, nodeHeight, handleId, role, sourceCountOnSide, targetCountOnSide, roleRank } = params;
    const { side } = parseHandleId(handleId);
    const hasBothRoles = sourceCountOnSide > 0 && targetCountOnSide > 0;
    const roleCount = role === 'source' ? sourceCountOnSide : targetCountOnSide;
    const percent = computeHandlePercent({ handleId, role, hasBothRoles, roleRank, roleCount });

    // top/bottom: percent maps to X; left/right: percent maps to Y
    // (mirrors DynamicHandles' positionProp).
    const x = side === 'right' ? nodeX + nodeWidth
        : side === 'left' ? nodeX
        : nodeX + percent * nodeWidth;
    const y = side === 'bottom' ? nodeY + nodeHeight
        : side === 'top' ? nodeY
        : nodeY + percent * nodeHeight;
    return { x, y };
}

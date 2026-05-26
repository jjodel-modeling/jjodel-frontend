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
 * @deprecated Superseded by computeSideEndpoints + computeSidePositions (cross-role
 * global ordering). No longer referenced; kept to avoid removing verified code —
 * delete in a follow-up cleanup.
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
 * @deprecated Superseded by computeSidePositions (cross-role global ordering with
 * inheritance pinned at center). No longer referenced; kept to avoid removing
 * verified code — delete in a follow-up cleanup.
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

/** Minimal edge shape consumed by the cross-role positioning functions. */
interface EndpointEdge {
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string | null;
}

/**
 * A single active endpoint on one side of a node: the (handleId, role) pair an
 * edge attaches to, tagged with the kind of edge using it. `edgeType` drives the
 * a2-strict layout — inheritance is pinned to the center, references fill the rest.
 */
export interface SideEndpoint {
    handleId: string;            // e.g. 'top-0'
    role: 'source' | 'target';
    edgeType: 'reference' | 'inheritance';
}

/**
 * Collect every active endpoint on one side of a node from the current edge set.
 *
 * Shared builder so DynamicHandles (rendering) and useTreeLayout (inheritance
 * branch landing) feed computeSidePositions with the exact same input — otherwise
 * the tree branch would land at a different point than where the handle is drawn.
 *
 * An endpoint is keyed by `${handleId}:${role}`; its edgeType is read from the
 * edges using it. Per portDistribution bucketing a given (handleId, role) maps to
 * one homogeneous PortGroup, so the type is unambiguous; should a mix ever be seen,
 * inheritance wins (it is the endpoint that must stay centered).
 */
export function computeSideEndpoints(
    edges: EndpointEdge[],
    nodeId: string,
    side: Side,
): SideEndpoint[] {
    const byKey = new Map<string, SideEndpoint>();
    const note = (handleId: string, role: 'source' | 'target', type: string | null | undefined) => {
        const edgeType: SideEndpoint['edgeType'] = type === 'inheritance' ? 'inheritance' : 'reference';
        const key = `${handleId}:${role}`;
        const existing = byKey.get(key);
        if (!existing) byKey.set(key, { handleId, role, edgeType });
        else if (edgeType === 'inheritance') existing.edgeType = 'inheritance';
    };
    for (const e of edges) {
        if (e.source === nodeId && e.sourceHandle && getBaseSide(e.sourceHandle) === side) {
            note(e.sourceHandle, 'source', e.type);
        }
        if (e.target === nodeId && e.targetHandle && getBaseSide(e.targetHandle) === side) {
            note(e.targetHandle, 'target', e.type);
        }
    }
    return Array.from(byKey.values());
}

/**
 * Cross-role global ordering for one side (strategy a2-strict).
 *
 * All endpoints on a side — source and target, reference and inheritance — are
 * placed in a single pass so the side reads as one balanced strip instead of two
 * role-segregated halves:
 *
 * - inheritance is pinned to the center: a single edge sits at 50%; several form a
 *   symmetric cluster around 50% with step 1/(N+1);
 * - references take the remaining space, the outermost grid slots first, symmetric
 *   about the center.
 *
 * With no inheritance the side degrades to a plain uniform distribution
 * (k+1)/(N+1) — the dense bidirectional case (e.g. Families.ecore Member.left,
 * 4 source + 4 target = 8 collision-free endpoints).
 *
 * Collision-freedom holds in every case: when the reference count is even the
 * cluster lands on the central grid slots and references on the outer ones (disjoint);
 * when it is odd the pinned cluster sits at half-step offsets that never coincide
 * with the integer grid the references use.
 *
 * Determinism: within each kind, endpoints are ordered by (role, handle index) —
 * source before target, then ascending index — preserving the anti-crossing spatial
 * sort that portDistribution already encoded in the handle indices.
 *
 * Returns a map keyed by `${handleId}:${role}` (top-0/source and top-0/target are
 * distinct ReactFlow entities and may sit at different positions). Inactive handles
 * are absent from the map; callers fall back to 0.5.
 */
export function computeSidePositions(endpoints: SideEndpoint[]): Map<string, number> {
    const result = new Map<string, number>();
    const N = endpoints.length;
    if (N === 0) return result;

    const bySortKey = (a: SideEndpoint, b: SideEndpoint) => {
        const ra = a.role === 'source' ? 0 : 1;
        const rb = b.role === 'source' ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return parseHandleId(a.handleId).index - parseHandleId(b.handleId).index;
    };
    const inh = endpoints.filter(e => e.edgeType === 'inheritance').sort(bySortKey);
    const ref = endpoints.filter(e => e.edgeType !== 'inheritance').sort(bySortKey);
    const M = inh.length;
    const R = ref.length;
    const step = 1 / (N + 1);
    const key = (e: SideEndpoint) => `${e.handleId}:${e.role}`;

    // References.
    let refPositions: number[];
    if (M === 0) {
        // No inheritance: plain uniform distribution across the whole side.
        refPositions = ref.map((_, k) => (k + 1) / (N + 1));
    } else {
        // Inheritance owns the center: references take the R outermost grid slots
        // (farthest from 0.5 first; lower position wins ties), then read ascending.
        const grid = Array.from({ length: N }, (_, k) => (k + 1) / (N + 1));
        const outerFirst = [...grid].sort((a, b) => {
            const da = Math.abs(a - 0.5);
            const db = Math.abs(b - 0.5);
            return da !== db ? db - da : a - b;
        });
        refPositions = outerFirst.slice(0, R).sort((a, b) => a - b);
    }
    ref.forEach((e, k) => result.set(key(e), refPositions[k]));

    // Inheritance: centered cluster pinned at 50%.
    inh.forEach((e, i) => {
        result.set(key(e), 0.5 + (i - (M - 1) / 2) * step);
    });

    return result;
}

/**
 * Physical position (canvas coordinates) of `handleId` on a node.
 *
 * Single source of truth shared by DynamicHandles (rendering) and useTreeLayout
 * (inheritance branch landing point): both build the side's endpoints with
 * computeSideEndpoints and position them with computeSidePositions, so a branch
 * lands exactly where the handle is drawn.
 */
export function computeHandlePositionForNode(params: {
    edges: EndpointEdge[];
    nodeId: string;
    nodeX: number;
    nodeY: number;
    nodeWidth: number;
    nodeHeight: number;
    handleId: string;
    role: 'source' | 'target';
}): { x: number; y: number } {
    const { edges, nodeId, nodeX, nodeY, nodeWidth, nodeHeight, handleId, role } = params;
    const { side } = parseHandleId(handleId);
    const positions = computeSidePositions(computeSideEndpoints(edges, nodeId, side));
    const percent = positions.get(`${handleId}:${role}`) ?? 0.5;

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

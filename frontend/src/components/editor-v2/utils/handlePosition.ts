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
import { getBaseSide, MAX_HANDLES_PER_SIDE, type Side, type NodePosition } from './portDistribution';

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
    id?: string;
    source: string;
    target: string;
    sourceHandle?: string | null;
    targetHandle?: string | null;
    type?: string | null;
}

/**
 * A single active endpoint on one side of a node: the (handleId, role) pair an
 * edge attaches to, tagged with the kind of edge using it. `edgeType` is retained
 * as informational metadata; since S7 it no longer changes positioning —
 * inheritance and references share one geometry-aware order in computeSidePositions.
 */
export interface SideEndpoint {
    handleId: string;            // e.g. 'top-0'
    role: 'source' | 'target';
    edgeType: 'reference' | 'inheritance';
    /** Node at the other end of the edge using this endpoint; drives the
     *  geometry-aware ordering in computeSidePositions. Optional only for
     *  backward-compat of the exported interface — always set by
     *  computeSideEndpoints in practice. */
    oppositeNodeId?: string;
    /** Id of the edge using this endpoint. Identical viewed from either endpoint,
     *  so it is the pair-stable tiebreak in computeSidePositions: the same edge
     *  ranks identically on both facing sides → matched fractions → aligned paths.
     *  Optional only for backward-compat of the exported interface — always set by
     *  computeSideEndpoints in practice. */
    edgeId?: string;
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
 * inheritance wins (kept deterministic, though edgeType no longer affects position).
 */
export function computeSideEndpoints(
    edges: EndpointEdge[],
    nodeId: string,
    side: Side,
): SideEndpoint[] {
    const byKey = new Map<string, SideEndpoint>();
    const note = (handleId: string, role: 'source' | 'target', type: string | null | undefined, oppositeNodeId: string, edgeId: string | undefined) => {
        const edgeType: SideEndpoint['edgeType'] = type === 'inheritance' ? 'inheritance' : 'reference';
        const key = `${handleId}:${role}`;
        const existing = byKey.get(key);
        if (!existing) byKey.set(key, { handleId, role, edgeType, oppositeNodeId, edgeId });
        else if (edgeType === 'inheritance') existing.edgeType = 'inheritance';
    };
    for (const e of edges) {
        if (e.source === nodeId && e.sourceHandle && getBaseSide(e.sourceHandle) === side) {
            note(e.sourceHandle, 'source', e.type, e.target, e.id);
        }
        if (e.target === nodeId && e.targetHandle && getBaseSide(e.targetHandle) === side) {
            note(e.targetHandle, 'target', e.type, e.source, e.id);
        }
    }
    return Array.from(byKey.values());
}

/**
 * Cross-role global ordering for one side.
 *
 * All endpoints on a side — source and target, reference and inheritance alike —
 * are placed in a single geometry-aware pass, so the side reads as one balanced
 * strip instead of two role-segregated halves:
 *
 * - every endpoint is ordered by byGeometry (the opposite/parent centroid along the
 *   side axis) and distributed uniformly at (k+1)/(N+1);
 * - inheritance no longer owns the center (S7): it takes its geometric slot like any
 *   reference. A side carrying only inheritance still yields 0.5 (N=1), but when
 *   references share the side the generalization sorts by its parent's centroid, so
 *   its lateral tree bus stops crossing references between the center and the parent.
 *
 * The dense bidirectional case (e.g. Families.ecore Member.left, 4 source + 4 target
 * = 8 endpoints) is the same uniform distribution.
 *
 * Collision-freedom is by construction: N endpoints on N distinct uniform slots.
 *
 * Determinism: byGeometry falls back to a pair-stable edge-id tiebreak, then to
 * (role, handle index), so equal or absent centroids stay deterministic — preserving
 * the anti-crossing spatial sort that portDistribution encoded in the handle indices.
 *
 * Returns a map keyed by `${handleId}:${role}` (top-0/source and top-0/target are
 * distinct ReactFlow entities and may sit at different positions). Inactive handles
 * are absent from the map; callers fall back to 0.5.
 */
export function computeSidePositions(
    endpoints: SideEndpoint[],
    nodePositions?: Map<string, NodePosition>,
): Map<string, number> {
    const result = new Map<string, number>();
    const N = endpoints.length;
    if (N === 0) return result;

    // Side axis: left/right order references by the opposite centroid's Y,
    // top/bottom by X. The side is read from the handle ids (every endpoint on
    // one call shares a side).
    const side = parseHandleId(endpoints[0].handleId).side;
    const useY = side === 'left' || side === 'right';
    const oppositeCoord = (e: SideEndpoint): number | undefined => {
        if (!nodePositions || !e.oppositeNodeId) return undefined;
        const p = nodePositions.get(e.oppositeNodeId);
        if (!p) return undefined;
        return useY ? p.centerY : p.centerX;
    };

    // Role-primary order: deterministic fallback for degenerate inputs that carry
    // no geometry (missing centroid) or no edge id.
    const bySortKey = (a: SideEndpoint, b: SideEndpoint) => {
        const ra = a.role === 'source' ? 0 : 1;
        const rb = b.role === 'source' ? 0 : 1;
        if (ra !== rb) return ra - rb;
        return parseHandleId(a.handleId).index - parseHandleId(b.handleId).index;
    };

    // Pair-stable tiebreak for references when the opposite centroid ties — i.e. the
    // two endpoints share the same opposite node (a bidirectional pair, or two edges
    // to the same node). The edge id is identical viewed from either endpoint, so the
    // same edge ranks identically on BOTH facing sides → matched fractions → aligned
    // (straight/parallel) paths. This replaces the old role-primary tiebreak, which
    // ordered source-before-target on each side and therefore inverted the matched
    // edge across the two facing sides, producing the diagonal jog (defects 2 & 3).
    // A non-self-loop edge contributes at most one endpoint per side, so the ids are
    // distinct here; when an id is absent (degenerate input) we fall back to
    // bySortKey (the degenerate no-position fallback).
    const byPairStable = (a: SideEndpoint, b: SideEndpoint) => {
        if (a.edgeId && b.edgeId && a.edgeId !== b.edgeId) return a.edgeId < b.edgeId ? -1 : 1;
        return bySortKey(a, b);
    };

    // Geometry-aware order for every endpoint (references and inheritance):
    // opposite/parent centroid first, then the pair-stable tiebreak. A missing or
    // equal centroid falls to byPairStable.
    const byGeometry = (a: SideEndpoint, b: SideEndpoint) => {
        const ca = oppositeCoord(a);
        const cb = oppositeCoord(b);
        if (ca !== undefined && cb !== undefined && ca !== cb) return ca - cb;
        return byPairStable(a, b);
    };

    const key = (e: SideEndpoint) => `${e.handleId}:${e.role}`;

    // S7: inheritance and references share ONE geometry-aware order (byGeometry:
    // opposite/parent centroid → pair-stable edge id → role/index fallback) with a
    // uniform (k+1)/(N+1) distribution. Inheritance no longer owns the center — a
    // side with only inheritance still lands at 0.5 (N=1), but when references share
    // the side the generalization takes its geometric slot by the parent's centroid,
    // so its lateral tree bus no longer crosses references between the center and the
    // parent. Collision-free by construction (N distinct slots). With no positions the
    // order degrades to byPairStable → bySortKey, unchanged from before.
    const ordered = [...endpoints].sort(byGeometry);
    ordered.forEach((e, k) => result.set(key(e), (k + 1) / (N + 1)));

    return result;
}

/**
 * Physical position (canvas coordinates) of `handleId` on a node.
 *
 * Single source of truth shared by DynamicHandles (rendering) and useTreeLayout
 * (inheritance branch landing point): both build the side's endpoints with
 * computeSideEndpoints and position them with computeSidePositions, so a branch
 * lands exactly where the handle is drawn. Since S7 the ordering is geometry-aware
 * for inheritance too, so callers MUST pass the same `nodePositions` map
 * DynamicHandles uses — otherwise the branch and the handle resolve to different
 * fractions and diverge.
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
    /** Centroid map for the geometry-aware ordering — must be the SAME map
     *  DynamicHandles feeds computeSidePositions, or the tree branch lands at a
     *  different fraction than the drawn handle (S7 threading). */
    nodePositions?: Map<string, NodePosition>;
}): { x: number; y: number } {
    const { edges, nodeId, nodeX, nodeY, nodeWidth, nodeHeight, handleId, role, nodePositions } = params;
    const { side } = parseHandleId(handleId);
    const positions = computeSidePositions(computeSideEndpoints(edges, nodeId, side), nodePositions);
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

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
    /** Endpoint pinned by a manual gesture (data.sourceAnchor.mode === 'pinned').
     *  A pinned endpoint is never spilled onto another side. Optional: a caller
     *  that omits it declares "nothing is pinned", which is the state of every
     *  edge until someone drags an endpoint. */
    sourcePinned?: boolean;
    targetPinned?: boolean;
}

interface NodePosition {
    centerX: number;
    centerY: number;
    /** Measured box size. Optional on purpose: the physical side capacity can
     *  only be computed when it is known, and a caller that omits it gets the
     *  fixed pool capacity — i.e. the behaviour that predates the capacity
     *  notion, bit for bit. */
    width?: number;
    height?: number;
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
    /** True when any endpoint in the group is manually pinned — excluded from spill. */
    pinned: boolean;
}

/**
 * Minimum distance between two adjacent anchors on the same side, in px.
 *
 * 6px is the F3 acceptance criterion (two attach points must not read as one);
 * the anchor dot itself is 8x8px (EditorV2.scss:1107). 10px is the first round
 * value that clears both — below it the dots overlap even when the paths do not.
 *
 * With N endpoints uniformly distributed at (k+1)/(N+1) along a side of length L,
 * the step is L/(N+1); requiring L/(N+1) >= 10 gives the capacity below.
 */
const MIN_ANCHOR_SPACING_PX = 10;

/**
 * How many anchors physically fit on one side of a node.
 *
 * This is THE capacity policy. MAX_HANDLES_PER_SIDE is not a policy — it is how
 * many <Handle> elements DynamicHandles pre-allocates per side and role, a
 * rendering fact, and it stays as the hard ceiling of the fallback (an index past
 * the pool points at a handle React Flow never measured, and the edge vanishes:
 * see the clamp in STEP 3 and commit 2ddedca53).
 *
 * On the neutral 140x53 node this returns 4 for a vertical side — the same number
 * as the old fixed cap. That is why every non-saturated case is preserved by
 * construction: below five incidences nothing moves, and the first new behaviour
 * is a spill where there used to be a clamp.
 *
 * Approximation, declared: L is the side of the bounding box, not of the outline.
 * On a hexagon or a parallelogram the usable run is shorter and this reads
 * optimistic. Not corrected here.
 */
function sideCapacity(side: Side, size?: { width?: number; height?: number }): number {
    const length = side === 'left' || side === 'right' ? size?.height : size?.width;
    if (typeof length !== 'number' || !(length > 0)) return MAX_HANDLES_PER_SIDE;
    return Math.max(1, Math.floor(length / MIN_ANCHOR_SPACING_PX) - 1);
}

/**
 * The two sides a spill can move to. Order is meaningful: [low, high] along the
 * axis the source side is sorted by, so the group at the low end of a right side
 * (smallest opposite-centroid Y) naturally goes to `top`, and the one at the high
 * end to `bottom` — it leaves toward where it was already pointing.
 */
const ADJACENT_SIDES: Record<Side, [Side, Side]> = {
    left: ['top', 'bottom'],
    right: ['top', 'bottom'],
    top: ['left', 'right'],
    bottom: ['left', 'right'],
};

const ALL_SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];
const ROLES: readonly ('source' | 'target')[] = ['source', 'target'];

/**
 * Upper bound on spills attempted per side, so a pathological configuration
 * cannot loop. A side can never need to shed more than its whole population.
 */
const MAX_SPILL_ITERATIONS = 64;

/** Spatial sort of every side bucket. Idempotent — safe to run twice. */
function sortSideGroups(
    sideGroups: Map<string, PortGroup[]>,
    nodePositions: Map<string, NodePosition>,
): void {
    for (const [key, groups] of sideGroups) {
        if (groups.length <= 1) continue;
        const side = key.split(':')[1] as Side;
        const isHorizontal = side === 'top' || side === 'bottom';

        groups.sort((a, b) => {
            const centerA = averagePosition(a.otherNodeIds, nodePositions);
            const centerB = averagePosition(b.otherNodeIds, nodePositions);
            const d = isHorizontal
                ? centerA.centerX - centerB.centerX
                : centerA.centerY - centerB.centerY;
            if (d !== 0) return d;
            // Canonical tiebreak on the first edge id. Without it, groups with the
            // same opposite centroid keep their INSERTION order, which differs
            // between a first pass (order the edges arrived in) and a second pass
            // over the same scene (order the spill appended them in) — and the
            // distribution stops being idempotent, which the reactive guard in
            // EditorV2 (:1221) relies on. Only ties are affected: a side whose
            // partners have distinct coordinates sorts exactly as before.
            return (a.edgeIds[0] ?? '').localeCompare(b.edgeIds[0] ?? '');
        });
    }
}

/** Coordinate of a group along the axis its side is ordered by. */
function groupCoord(group: PortGroup, side: Side, nodePositions: Map<string, NodePosition>): number {
    const c = averagePosition(group.otherNodeIds, nodePositions);
    return side === 'top' || side === 'bottom' ? c.centerX : c.centerY;
}

/**
 * A group may leave its side only if it is neither manually pinned nor an
 * inheritance edge. Inheritance owns the top/bottom convention unconditionally
 * (jjomTransformers.computeOptimalHandles) and collapses its whole fan into a
 * single port per (node, side, role), so it can never saturate a side by itself
 * and must not be moved off the side the convention assigns it.
 */
function isSpillable(group: PortGroup): boolean {
    return !group.pinned && group.edgeType !== 'inheritance';
}

/**
 * Moves overflowing anchors off saturated sides onto an adjacent side with room.
 *
 * Two constraints bound one side:
 *  - geometry: the endpoints of BOTH roles together must fit in sideCapacity();
 *  - pool: each role's bucket must stay within MAX_HANDLES_PER_SIDE, because the
 *    index it produces has to address a pre-allocated <Handle>.
 * The second is why a tall node does not get the full benefit of the first: its
 * geometric capacity can exceed the pool, and past the pool the STEP 3 clamp
 * still takes over. That truncation is measured and declared in the report.
 *
 * Fallback, by construction: when neither adjacent side has room the group stays
 * where it is and STEP 3 clamps it, i.e. today's behaviour. An edge is never
 * hidden — the clamp exists precisely because an index past the pool makes React
 * Flow drop the edge (commit 2ddedca53).
 *
 * Determinism: victims are read off the spatially sorted buckets and ties break
 * on the first edge id, so the same scene always yields the same assignment
 * regardless of the order edges arrived in.
 *
 * Idempotence: a spilled group is re-read on the next run as belonging to its new
 * side, and that side was checked to have room before the move — so a second pass
 * over the result finds nothing to move. `distribute(distribute(x))` equals
 * `distribute(x)`, which the reactive guard in EditorV2 (:1221) depends on: it
 * re-runs the distribution over its own output.
 */
function applyCapacitySpill(
    sideGroups: Map<string, PortGroup[]>,
    nodePositions: Map<string, NodePosition>,
): void {
    const nodeIds = new Set<string>();
    for (const key of sideGroups.keys()) nodeIds.add(key.split(':')[0]);

    for (const nodeId of nodeIds) {
        const size = nodePositions.get(nodeId);
        // Unknown size → no capacity to speak of, so no spill. The side keeps
        // every anchor and STEP 3 clamps the overflow, exactly as it did before
        // the capacity notion existed.
        if (typeof size?.width !== 'number' || typeof size?.height !== 'number') continue;

        const bucket = (side: Side, role: 'source' | 'target'): PortGroup[] =>
            sideGroups.get(`${nodeId}:${side}:${role}`) ?? [];
        const occupancy = (side: Side): number => bucket(side, 'source').length + bucket(side, 'target').length;

        /** Room for one more group of `role` on `side`, under both constraints. */
        const hasRoom = (side: Side, role: 'source' | 'target'): boolean =>
            occupancy(side) < sideCapacity(side, size) &&
            bucket(side, role).length < MAX_HANDLES_PER_SIDE;

        for (const side of ALL_SIDES) {
            const capacity = sideCapacity(side, size);

            for (let i = 0; i < MAX_SPILL_ITERATIONS; i++) {
                const overCapacity = occupancy(side) > capacity;
                const overPool = ROLES.filter(r => bucket(side, r).length > MAX_HANDLES_PER_SIDE);
                if (!overCapacity && overPool.length === 0) break;

                // When the pool is the binding constraint, only the offending role
                // can relieve it; when geometry binds, any role will do.
                const eligibleRoles = overPool.length > 0 ? overPool : ROLES;
                const candidates = eligibleRoles
                    .flatMap(role => bucket(side, role).map(group => ({ group, role })))
                    .filter(c => isSpillable(c.group));
                if (candidates.length === 0) break; // all pinned or inheritance → clamp

                candidates.sort((a, b) => {
                    const d = groupCoord(a.group, side, nodePositions) - groupCoord(b.group, side, nodePositions);
                    return d !== 0 ? d : (a.group.edgeIds[0] ?? '').localeCompare(b.group.edgeIds[0] ?? '');
                });

                // The extremes of the side are the ones already pointing away from
                // it: the low end toward the first adjacent side, the high end
                // toward the second. Between the two, the one whose partner sits
                // FURTHER from the node's own axis is the one that wants this side
                // least — taking it first keeps the shedding symmetric instead of
                // emptying one end of the side into a single adjacent.
                const [lowSide, highSide] = ADJACENT_SIDES[side];
                const nodeCentre = nodePositions.get(nodeId);
                const axisCentre = side === 'top' || side === 'bottom'
                    ? nodeCentre?.centerX ?? 0
                    : nodeCentre?.centerY ?? 0;

                const low = candidates[0];
                const high = candidates[candidates.length - 1];
                const lowFirst = high === low ||
                    Math.abs(groupCoord(low.group, side, nodePositions) - axisCentre) >=
                    Math.abs(groupCoord(high.group, side, nodePositions) - axisCentre);

                const first = lowFirst ? { c: low, target: lowSide } : { c: high, target: highSide };
                const second = lowFirst ? { c: high, target: highSide } : { c: low, target: lowSide };
                const attempts: Array<{ c: typeof candidates[number]; target: Side }> = [first];
                if (high !== low) attempts.push(second);
                // Second choice: the other adjacent side, when the natural one is full.
                attempts.push({ c: first.c, target: first.target === lowSide ? highSide : lowSide });
                if (high !== low) attempts.push({ c: second.c, target: second.target === lowSide ? highSide : lowSide });

                const move = attempts.find(a => hasRoom(a.target, a.c.role));
                if (!move) break; // both adjacent sides full → clamp, as before

                const from = sideGroups.get(`${nodeId}:${side}:${move.c.role}`)!;
                from.splice(from.indexOf(move.c.group), 1);
                const toKey = `${nodeId}:${move.target}:${move.c.role}`;
                if (!sideGroups.has(toKey)) sideGroups.set(toKey, []);
                sideGroups.get(toKey)!.push(move.c.group);
            }
        }
    }
}

// Dev-only overflow diagnostics for the STEP 3 clamp. `import.meta.env` is not
// wired into this repo's tsc types (tsconfig `types: []`, no vite/client ref), so
// DEV is read through an any-cast; Vite still statically resolves it to false in
// production builds, so the warn is stripped there.
const IS_DEV: boolean = (import.meta as any).env?.DEV ?? false;

// Throttle: nodes already warned about handle-pool overflow this session, so the
// STEP 3 clamp emits at most one console.warn per node (see clamp below).
const overflowWarnedNodes = new Set<string>();

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
                if (edge.sourcePinned) existingInh.pinned = true;
            } else {
                sourceGroups.push({
                    edgeIds: [edge.id],
                    edgeType: 'inheritance',
                    role: 'source',
                    otherNodeIds: [edge.target],
                    pinned: !!edge.sourcePinned,
                });
            }
        } else {
            // Non-inheritance: each edge gets its own port
            sideGroups.get(sourceKey)!.push({
                edgeIds: [edge.id],
                edgeType,
                role: 'source',
                otherNodeIds: [edge.target],
                pinned: !!edge.sourcePinned,
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
                if (edge.targetPinned) existingInh.pinned = true;
            } else {
                targetGroups.push({
                    edgeIds: [edge.id],
                    edgeType: 'inheritance',
                    role: 'target',
                    otherNodeIds: [edge.source],
                    pinned: !!edge.targetPinned,
                });
            }
        } else {
            // Reference: each edge gets its own port
            targetGroups.push({
                edgeIds: [edge.id],
                edgeType: 'reference',
                role: 'target',
                otherNodeIds: [edge.source],
                pinned: !!edge.targetPinned,
            });
        }
    }

    // === STEP 2: Spatial sorting to prevent crossings ===
    if (nodePositions) {
        sortSideGroups(sideGroups, nodePositions);
    }

    // === STEP 2bis: Physical-capacity spill ===
    // A side holds as many anchors as its length allows (sideCapacity); the
    // overflow moves to the adjacent side with room instead of piling onto the
    // last handle. Runs only when the caller supplied sizes — without them the
    // capacity is the fixed pool and this step is inert, so every caller that
    // does not pass sizes keeps the previous behaviour exactly.
    // Re-sorted afterwards: a group that landed on a new side must take its
    // spatial rank there, not be appended at the end.
    if (nodePositions) {
        applyCapacitySpill(sideGroups, nodePositions);
        sortSideGroups(sideGroups, nodePositions);
    }

    // === STEP 3: Assign indexed handle IDs ===
    const edgeHandleAccum = new Map<string, { sourceHandle?: string; targetHandle?: string }>();

    for (const [key, groups] of sideGroups) {
        const side = key.split(':')[1];

        groups.forEach((group, index) => {
            // Clamp the handle index to the DOM pool capacity. DynamicHandles renders
            // only side-0 .. side-(MAX_HANDLES_PER_SIDE-1); an index past that points
            // to a handle React Flow never measured, so the edge is dropped silently
            // in production. Excess edges share the last handle (visual overlap on the
            // anchor) instead of vanishing. Identity for index < MAX_HANDLES_PER_SIDE.
            const handleId = `${side}-${Math.min(index, MAX_HANDLES_PER_SIDE - 1)}`;

            if (IS_DEV && index >= MAX_HANDLES_PER_SIDE) {
                const nodeId = key.split(':')[0];
                if (!overflowWarnedNodes.has(nodeId)) {
                    overflowWarnedNodes.add(nodeId);
                    // eslint-disable-next-line no-console
                    console.warn(
                        `[portDistribution] handle overflow: node "${nodeId}" side "${side}" has ` +
                        `${groups.length} edges > pool capacity ${MAX_HANDLES_PER_SIDE}; ` +
                        `excess share ${side}-${MAX_HANDLES_PER_SIDE - 1}.`,
                    );
                }
            }

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

    // Override with actual distribution from groups.
    // Bucket keys now include role (`:source` / `:target`); a single (nodeId, side)
    // can have two buckets — union their indices into a single PortInfo[] without
    // duplicates (DynamicHandles materializes source+target DOM elements per index).
    for (const [key, groups] of sideGroups) {
        const [nodeId, sideStr] = key.split(':');
        const side = sideStr as Side;
        const config = nodeHandles.get(nodeId);
        if (!config) continue;

        const present = new Set(config[side].map(p => p.handleId));
        groups.forEach((_group, index) => {
            const handleId = `${side}-${index}`;
            if (present.has(handleId)) return;
            config[side].push({ handleId, position: 0 });
        });
    }

    // Recompute positions per side uniformly on the merged count.
    // Bucket-local positions (computed from groups.length) would be inconsistent
    // when source and target buckets contribute different numbers of indices.
    for (const config of nodeHandles.values()) {
        for (const side of ['top', 'right', 'bottom', 'left'] as Side[]) {
            const n = config[side].length;
            config[side].forEach((port, i) => {
                port.position = n === 1 ? 0.5 : (i + 1) / (n + 1);
            });
        }
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

export { computePortDistribution, getBaseSide, getNextFreeHandleIndex, sideCapacity, MAX_HANDLES_PER_SIDE, MIN_ANCHOR_SPACING_PX };
export type { Side, PortInfo, EdgeMinimal, NodePosition };

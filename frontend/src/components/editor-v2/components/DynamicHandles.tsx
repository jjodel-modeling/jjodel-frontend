import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Handle, Position, useEdges, useStoreApi } from '@xyflow/react';
import { MAX_HANDLES_PER_SIDE, type Side } from '../utils/portDistribution';
import { computeSideEndpoints, computeSidePositions } from '../utils/handlePosition';

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

// ─── Module-level coalescer for updateNodeInternals (leva 3) ───
// Each DynamicHandles instance used to schedule its own double-rAF and issue its
// own single-node updateNodeInternals call: N handle reassignments landing in one
// commit produced N separate React Flow store notifications, each paying the full
// subscriber fan-out (discovery 2026-07-20_trickle_leve_2_3). The coalescer
// batches every node scheduled in the same pre-paint window into ONE
// updateNodeInternals(Map) call while preserving the double-rAF
// measure-after-paint contract: the batch CLOSES when the first rAF fires
// (pre-paint), so a node scheduled after that point belongs to a later paint and
// opens a new batch with its own double-rAF. Keyed by store instance so multiple
// mounted flows never mix.
type RFStoreApi = ReturnType<typeof useStoreApi>;
const openMeasureBatches = new Map<RFStoreApi, Set<string>>();

function scheduleNodeInternalsUpdate(storeApi: RFStoreApi, nodeId: string): void {
    const open = openMeasureBatches.get(storeApi);
    if (open) {
        open.add(nodeId);
        return;
    }
    const batch = new Set<string>([nodeId]);
    openMeasureBatches.set(storeApi, batch);
    // Double-rAF: first rAF fires before next paint, second fires after that
    // paint completes — guaranteeing CSS is resolved before measuring (same
    // timing contract as the previous per-node implementation).
    requestAnimationFrame(() => {
        // Close the batch pre-paint: later schedules target a later paint.
        if (openMeasureBatches.get(storeApi) === batch) openMeasureBatches.delete(storeApi);
        requestAnimationFrame(() => {
            const state = storeApi.getState();
            const domNode = state.domNode;
            if (!domNode) return;
            // One DOM pass for the whole batch instead of one querySelector per node.
            const elementsById = new Map<string, Element>();
            domNode.querySelectorAll('.react-flow__node').forEach((el) => {
                const id = el.getAttribute('data-id');
                if (id) elementsById.set(id, el);
            });
            const updates = new Map();
            for (const id of batch) {
                const nodeElement = elementsById.get(id);
                if (nodeElement) updates.set(id, { id, nodeElement, force: true });
            }
            if (updates.size > 0) state.updateNodeInternals(updates);
        });
    });
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
    const storeApi = useStoreApi();

    // --- Hover state for ghost-like behavior on inactive handles ---
    const [hoveredSide, setHoveredSide] = useState<Side | null>(null);
    const hoveredSideRef = useRef<Side | null>(null);
    const markerRef = useRef<HTMLDivElement>(null);

    // --- Stable edge topology fingerprint ---
    // Only changes when edge connections or handle assignments change.
    // Does NOT depend on node positions — prevents re-render cascade during drag.
    const edgeTopologyKey = useMemo(() => {
        const relevant = edges
            .filter(e => e.source === nodeId || e.target === nodeId)
            .map(e => `${e.id}:${e.source}:${e.target}:${e.type}:${e.sourceHandle ?? ''}:${e.targetHandle ?? ''}`)
            .sort()
            .join('|');
        return relevant;
    }, [edges, nodeId]);

    // --- Derive active handles directly from edge handle assignments ---
    // Reads sourceHandle/targetHandle from edges (assigned by applyDistribution).
    // The physical position is computed per-role in the render loop below
    // (source handles in first half of the side, target handles in second half).
    const activeHandles = useMemo(() => {
        const active = new Set<string>();
        for (const edge of edges) {
            if (edge.source === nodeId && edge.sourceHandle) {
                active.add(edge.sourceHandle);
            }
            if (edge.target === nodeId && edge.targetHandle) {
                active.add(edge.targetHandle);
            }
        }
        return active;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeTopologyKey, nodeId]);

    // --- Determine which Handle type (source/target) is used per handleId ---
    // A handleId can be source, target, or both (if different edges use it in both roles).
    const handleRoles = useMemo(() => {
        const roles = new Map<string, Set<'source' | 'target'>>();
        for (const edge of edges) {
            if (edge.source === nodeId && edge.sourceHandle) {
                if (!roles.has(edge.sourceHandle)) roles.set(edge.sourceHandle, new Set());
                roles.get(edge.sourceHandle)!.add('source');
            }
            if (edge.target === nodeId && edge.targetHandle) {
                if (!roles.has(edge.targetHandle)) roles.set(edge.targetHandle, new Set());
                roles.get(edge.targetHandle)!.add('target');
            }
        }
        return roles;
    }, [edges, nodeId]);

    // --- Cross-role global ordering of endpoint positions, per side ---
    // One pass over each side's active endpoints (computeSidePositions): inheritance
    // pinned at center, references symmetric in the remaining space. Shared with
    // useTreeLayout via the same handlePosition helpers so the inheritance tree
    // branch lands exactly where the handle is drawn. Memoized on the edge topology
    // so hover re-renders don't recompute.
    const sidePositionsBySide = useMemo(() => {
        // Centroid map for the geometry-aware ordering in computeSidePositions.
        // Read imperatively from the RF store at recompute time — NO live-position
        // subscription, so the no-cascade contract above (line 45) holds. Recompute
        // is gated by edgeTopologyKey, which is sufficient for the static scene; a
        // live drag that swaps cross-role nodes without a handle reassignment is the
        // documented "Known limitation" of this fix.
        const nodePositions = new Map<string, { centerX: number; centerY: number }>();
        for (const [id, n] of storeApi.getState().nodeLookup) {
            const pos = n.internals?.positionAbsolute ?? n.position;
            const w = n.measured?.width ?? 180;
            const h = n.measured?.height ?? 80;
            nodePositions.set(id, { centerX: pos.x + w / 2, centerY: pos.y + h / 2 });
        }
        const map = new Map<Side, Map<string, number>>();
        for (const side of SIDES) {
            map.set(side, computeSidePositions(computeSideEndpoints(edges, nodeId, side), nodePositions));
        }
        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeTopologyKey, nodeId]);

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
        return Array.from(activeHandles).sort().join(',');
    }, [activeHandles]);

    const lastCommittedKeyRef = useRef<string>('');

    // useEffect (NOT useLayoutEffect): update RF handle measurements when
    // active handles change. Using useEffect instead of useLayoutEffect avoids
    // the synchronous cascade where updateNodeInternals → dimension changes →
    // re-render → updateNodeInternals could exceed React's update depth limit.
    //
    // Double-rAF (inside scheduleNodeInternalsUpdate) ensures the browser has
    // PAINTED the new CSS positions before we measure via getBoundingClientRect.
    // The timing chain is:
    //   setEdges → StoreUpdater useEffect → zustand update → useEdges() →
    //   DynamicHandles re-render → CSS committed → paint → rAF → rAF → measure
    // Without this delay, getBoundingClientRect returns stale positions (50%)
    // because the measurement fires before the browser resolves CSS percentages.
    // All nodes scheduled in the same pre-paint window are measured in a single
    // batched updateNodeInternals call (see coalescer above).
    useEffect(() => {
        if (activeHandlesKey !== lastCommittedKeyRef.current) {
            lastCommittedKeyRef.current = activeHandlesKey;
            scheduleNodeInternalsUpdate(storeApi, nodeId);
        }
    }, [activeHandlesKey, nodeId, storeApi]);

    // --- Render ALL handles from pool (stable keys, never mount/unmount) ---
    return (
        <>
            {/* Hidden marker for DOM traversal to parent .mm-node */}
            <div ref={markerRef} style={{ display: 'none' }} />

            {SIDES.flatMap(side => {
                const positionProp = side === 'left' || side === 'right' ? 'top' : 'left';
                const handles: React.ReactNode[] = [];

                // Cross-role global ordering for this side: inheritance pinned at
                // center, references symmetric in the remaining space. Computed once
                // per side (memoized above); inactive handles fall back to 50%.
                const sidePositions = sidePositionsBySide.get(side)!;

                for (let index = 0; index < MAX_HANDLES_PER_SIDE; index++) {
                    const handleId = `${side}-${index}`;
                    const isActive = activeHandles.has(handleId);

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

                    // Physical position from the cross-role ordering. top-0/source
                    // and top-0/target are distinct entities and may differ.
                    const sourcePercent = sidePositions.get(`${handleId}:source`) ?? 0.5;
                    const targetPercent = sidePositions.get(`${handleId}:target`) ?? 0.5;

                    // Determine active role(s) for this handleId.
                    // Only the Handle matching its edge role gets --connected;
                    // the other stays --pool-inactive to avoid double dots.
                    const roles = handleRoles.get(handleId);
                    const isSourceRole = isActive && (roles?.has('source') ?? false);
                    const isTargetRole = isActive && (roles?.has('target') ?? false);

                    // Inactive style shared by both non-active handles
                    const inactiveStyle: React.CSSProperties = {
                        [positionProp]: '50%',
                        visibility: 'hidden' as const,
                        opacity: 0,
                        pointerEvents: 'none' as const,
                        // NO width:0, NO height:0 — React Flow MUST be able to measure
                        // via getBoundingClientRect(). Dimensions come from CSS .mm-anchor (8x8px).
                        border: 'none',
                        background: 'transparent',
                    };

                    const ghostClassName = 'mm-anchor mm-anchor--ghost mm-anchor--ghost-visible';
                    const ghostStyle: React.CSSProperties = { [positionProp]: '50%' };
                    const connectedClassName = 'mm-anchor mm-anchor--connected';
                    const sourceConnectedStyle: React.CSSProperties = { [positionProp]: `${sourcePercent * 100}%` };
                    const targetConnectedStyle: React.CSSProperties = { [positionProp]: `${targetPercent * 100}%` };
                    const poolClassName = 'mm-anchor mm-anchor--pool-inactive';

                    // --- Target Handle ---
                    const targetClassName = isTargetRole
                        ? connectedClassName
                        : isGhostVisible ? ghostClassName : poolClassName;
                    const targetStyle = isTargetRole
                        ? targetConnectedStyle
                        : isGhostVisible ? ghostStyle : inactiveStyle;

                    // --- Source Handle ---
                    const sourceClassName = isSourceRole
                        ? connectedClassName
                        : isGhostVisible ? ghostClassName : poolClassName;
                    const sourceStyle = isSourceRole
                        ? sourceConnectedStyle
                        : isGhostVisible ? ghostStyle : inactiveStyle;

                    handles.push(
                        <React.Fragment key={handleId}>
                            <Handle
                                type="target"
                                position={SIDE_TO_POSITION[side]}
                                id={handleId}
                                className={targetClassName}
                                style={targetStyle}
                                isConnectableStart={false}
                            />
                            <Handle
                                type="source"
                                position={SIDE_TO_POSITION[side]}
                                id={handleId}
                                className={sourceClassName}
                                style={sourceStyle}
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

import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Handle, Position, useEdges, useStoreApi } from '@xyflow/react';
import { MAX_HANDLES_PER_SIDE, type Side } from '../utils/portDistribution';
import { computeSideEndpoints, computeSidePositions } from '../utils/handlePosition';
import { getShapeDescriptor } from '../viewpoint/ir/shapeRegistry';
import type { ShapeForm } from '../viewpoint/ir/irTypes';

const SIDES: readonly Side[] = ['top', 'right', 'bottom', 'left'];

const SIDE_TO_POSITION: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

interface DynamicHandlesProps {
    nodeId: string;
    /**
     * Forma risolta del nodo, quando ne ha una (view IR). Serve solo a rientrare
     * gli handle dal lato del box fino al contorno: senza, l'arco atterra sul
     * rettangolo circoscritto e su un rombo lascia il vuoto. Assente sui tipi di
     * nodo senza forma geometrica, che ricadono su `rect`, cioe' rientro nullo.
     */
    shapeForm?: ShapeForm;
}

/** Distance in px from node edge within which a side is considered "hovered". */
const HOVER_THRESHOLD = 15;

// --- Coalesced handle re-measurement, one store update per frame ---
// Each node used to schedule its own double-rAF and its own single-entry
// updateNodeInternals call, so a change touching N nodes produced N store
// updates and N React commits. Measured 2026-08-25 on the 500-node / 1500-edge
// harness (docs/benchmarks): making the invalidation key position-aware raised
// commits_open_flow from ~2010 to ~2144 and the median single mutation from
// 6.4s to 8.7s. React Flow's updateNodeInternals already takes a Map of
// updates, so the nodes of one flow are collected into a single Map and flushed
// together on one shared double-rAF.
//
// Keyed by the store api object (stable per ReactFlowProvider) so two flows on
// screen never share a batch. Node elements are resolved at flush time, not at
// schedule time: a node that remounted in between would otherwise be measured
// through a detached element.
const pendingInternals = new WeakMap<object, Set<string>>();
const scheduledFlush = new WeakSet<object>();

function scheduleNodeInternalsUpdate(storeApi: { getState: () => any }, nodeId: string): void {
    let pending = pendingInternals.get(storeApi);
    if (!pending) {
        pending = new Set();
        pendingInternals.set(storeApi, pending);
    }
    pending.add(nodeId);

    if (scheduledFlush.has(storeApi)) return;
    scheduledFlush.add(storeApi);

    // Double-rAF: the first fires before the next paint, the second after it
    // completes — guaranteeing the browser has resolved the CSS percentages
    // before getBoundingClientRect reads them. Without it the measurement
    // returns the 50% fallback.
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            scheduledFlush.delete(storeApi);
            const ids = pendingInternals.get(storeApi);
            if (!ids || ids.size === 0) return;
            pendingInternals.set(storeApi, new Set());

            const state = storeApi.getState();
            const domNode = state.domNode;
            if (!domNode) return;

            const updates = new Map();
            for (const id of ids) {
                const nodeElement = domNode.querySelector(`.react-flow__node[data-id="${id}"]`);
                if (nodeElement) updates.set(id, { id, nodeElement, force: true });
            }
            if (updates.size > 0) state.updateNodeInternals(updates);
        });
    });
}

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
function DynamicHandles({ nodeId, shapeForm }: DynamicHandlesProps) {
    const edges = useEdges();
    const storeApi = useStoreApi();
    const shape = getShapeDescriptor(shapeForm);

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
    // The shape is part of the key, not just the active set: the inset that pulls
    // each handle in to the outline depends on it, and `form` is a Conditional in
    // the IR, so it can flip at runtime on the same node with unchanged dimensions.
    // React Flow only re-measures handle bounds on a dimension change or with
    // force:true (@xyflow/system updateNodeInternals), so a form change alone would
    // otherwise leave the measured bounds stale.
    //
    // The key is built from the computed POSITIONS, not from the set of active
    // handle ids. Measured 2026-08-25 (docs/discovery/discovery_2026-08-25_pool_
    // saturation_faseA.md, defect D2): the id set ignores the role, so an incoming
    // edge landing on a `${side}-${index}` already used as a source left the key
    // unchanged — no re-measure — while computeSidePositions had just redistributed
    // every endpoint on that side over N+1 slots. The rendered anchors moved, the
    // measured bounds did not: outgoing paths stayed on the previous grid and every
    // incoming path fell back to the node center (the 50% of a handle React Flow
    // had only ever measured while inactive). It took four edges on one side, with
    // the pool half empty and no overflow warning.
    //
    // sidePositionsBySide is keyed `${handleId}:${role}` and holds exactly the
    // active endpoints, so this key is strictly finer than the id set it replaces
    // and no invalidation is lost. It is recomputed on edgeTopologyKey — never on
    // node positions — so the no-cascade contract at the top of this file holds and
    // the invalidation rate is unchanged; only its discrimination improves.
    const activeHandlesKey = useMemo(() => {
        const parts: string[] = [];
        for (const side of SIDES) {
            const positions = sidePositionsBySide.get(side);
            if (!positions) continue;
            for (const endpoint of Array.from(positions.keys()).sort()) {
                parts.push(`${endpoint}=${positions.get(endpoint)!.toFixed(4)}`);
            }
        }
        return `${shapeForm ?? ''}|${parts.join(',')}`;
    }, [sidePositionsBySide, shapeForm]);

    const lastCommittedKeyRef = useRef<string>('');

    // useEffect (NOT useLayoutEffect): update RF handle measurements when
    // active handles change. Using useEffect instead of useLayoutEffect avoids
    // the synchronous cascade where updateNodeInternals → dimension changes →
    // re-render → updateNodeInternals could exceed React's update depth limit.
    //
    // Double-rAF ensures the browser has PAINTED the new CSS positions before
    // we measure via getBoundingClientRect. The timing chain is:
    //   setEdges → StoreUpdater useEffect → zustand update → useEdges() →
    //   DynamicHandles re-render → CSS committed → paint → rAF → rAF → measure
    // Without this delay, getBoundingClientRect returns stale positions (50%)
    // because the measurement fires before the browser resolves CSS percentages.
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
                    // Second axis: pull the handle in from the box edge to the shape
                    // outline. The property is the side itself (left/right resolve the
                    // percentage against the node width, top/bottom against its height),
                    // so no measured size is needed here. Zero for box-like forms, which
                    // keeps every existing node pixel-identical.
                    // `handleInsetAt` quando la forma lo dichiara (profilo per lato:
                    // esagono, parallelogramma), altrimenti il profilo di mezza
                    // larghezza, che sulle cinque forme storiche vale su ogni lato.
                    const insetPct = (t: number) => {
                        const inset = shape.handleInsetAt
                            ? shape.handleInsetAt(t, side)
                            : shape.insetFractionAt(t);
                        return `${(inset * 100).toFixed(3)}%`;
                    };
                    const sourceConnectedStyle: React.CSSProperties = {
                        [positionProp]: `${sourcePercent * 100}%`,
                        [side]: insetPct(sourcePercent),
                    };
                    const targetConnectedStyle: React.CSSProperties = {
                        [positionProp]: `${targetPercent * 100}%`,
                        [side]: insetPct(targetPercent),
                    };
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

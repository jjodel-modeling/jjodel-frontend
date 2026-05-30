import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    useEdges,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, InheritanceEdgeData, CompositionEdgeData, InstanceReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import { syncEdgeRefProperty } from '../sync/canvasToJjom';
import {
    computeManhattanPath,
    roundManhattanPath,
    computeSelfLoopPath,
    computeSelfLoopCornerPath,
    getNodeRect,
    computeLabelPosition,
    computeCardinalityPosition,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    buildFinalPath,
} from '../utils/edgeUtils';
import { MAX_HANDLES_PER_SIDE } from '../utils/portDistribution';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useEdgeHighlightClass } from '../contexts/HighlightContext';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { SegmentHandles } from './SegmentHandles';
import { EndpointHandles } from './EndpointHandles';

// Bundle spread: when multiple edges connect the same node pair, shift the
// middle corridor of each path perpendicular to its longitudinal direction,
// and stack the labels along the same axis, to avoid path/label collapse.
// Spread offset is derived from the handle index extracted from
// sourceHandleId/targetHandleId (format: "${side}-${index}").
const BUNDLE_SPREAD_PX = 12;
const LABEL_SPREAD_PX = 18;

function getHandleIndex(handleId: string | null | undefined): number {
    if (!handleId) return 0;
    const m = handleId.match(/-(\d+)$/);
    return m ? parseInt(m[1], 10) : 0;
}

/**
 * Shift the middle corridor of a 4-point Manhattan Z-shape path perpendicular
 * to its longitudinal axis, by an amount derived from the bundle handle indices.
 * Returns the points unchanged when the path is not a Z-shape (L-shape with 3
 * points, U-detour with 6 points, self-loop, etc.) — those cases keep the
 * original routing.
 */
function applyBundleSpread(
    points: { x: number; y: number }[],
    sourceHandleId: string | null | undefined,
    targetHandleId: string | null | undefined,
    source: string,
    target: string,
): { x: number; y: number }[] {
    if (points.length !== 4) return points;

    const sourceIndex = getHandleIndex(sourceHandleId);
    const targetIndex = getHandleIndex(targetHandleId);
    const directionSign = source < target ? 1 : -1;
    // Sum of indices is invariant under (source, target) swap; multiplying
    // by directionSign breaks the symmetry so mirrored edges land on
    // opposite sides of the central corridor.
    const bundleSpread = directionSign * (sourceIndex + targetIndex + 1) * BUNDLE_SPREAD_PX / 2;

    const p1 = points[1];
    const p2 = points[2];
    const isMiddleVertical = Math.abs(p1.x - p2.x) < 1;
    const isMiddleHorizontal = Math.abs(p1.y - p2.y) < 1;

    if (isMiddleVertical) {
        return [
            points[0],
            { x: p1.x + bundleSpread, y: p1.y },
            { x: p2.x + bundleSpread, y: p2.y },
            points[3],
        ];
    }
    if (isMiddleHorizontal) {
        return [
            points[0],
            { x: p1.x, y: p1.y + bundleSpread },
            { x: p2.x, y: p2.y + bundleSpread },
            points[3],
        ];
    }
    return points;
}

// ═══════════════════════════════════════════════════════════════
// UnifiedEdge — single component for all edge types
// ═══════════════════════════════════════════════════════════════
//
// Edge type variants:
//   association   — arrow at target
//   composition   — filled diamond at source, arrow at target
//   aggregation   — hollow diamond at source, arrow at target
//   inheritance   — hollow triangle at target, tree mode when grouped
//
// Layout modes:
//   single — one source → one target (all references + single inheritance)
//   tree   — N sources → 1 target with trunk + bar (multi-inheritance)
// ═══════════════════════════════════════════════════════════════

function UnifiedEdge(props: EdgeProps) {
    const {
        id,
        sourceX,
        sourceY,
        targetX,
        targetY,
        source,
        target,
        sourceHandleId,
        targetHandleId,
        data,
        selected,
        label,
        type: edgeType,
    } = props;

    const hlClass = useEdgeHighlightClass(id);

    // ─── Determine edge type ───
    // M1 edges (composition, instanceRef) use different data shapes than M2 edges
    const isM1Edge = edgeType === 'composition' || edgeType === 'instanceRef';
    const edgeData = data as (ReferenceEdgeData & InheritanceEdgeData & CompositionEdgeData & InstanceReferenceEdgeData) | undefined;
    const isInheritance = edgeType === 'inheritance' || (!isM1Edge && !edgeData?.reference);
    const ref = edgeData?.reference;
    const kind: ReferenceKind = isM1Edge
        ? (edgeType === 'composition' ? 'composition' : 'association')
        : (ref?.kind || 'association');
    const waypoints = edgeData?.waypoints || [];
    const autoEdit = edgeData?.autoEdit as boolean | undefined;

    const { setEdges } = useReactFlow();
    const notation = useEditorContextSafe()?.notation ?? 'uml';
    const isERNotation = notation === 'er';
    const isSelfLoop = source === target;

    // ─── Label state (reference edges only) ───
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || ref?.name || edgeData?.referenceName || ''));
    const [hovered, setHovered] = useState(false);

    useEffect(() => {
        if (!editing) {
            setLabelText(String(label || ref?.name || ''));
        }
    }, [label, ref?.name, editing]);

    // ─── Auto-edit for newly created edges ───
    useEffect(() => {
        if (autoEdit) {
            setEditing(true);
            setEdges(edges => edges.map(e =>
                e.id === id ? { ...e, data: { ...e.data, autoEdit: undefined } } : e
            ));
        }
    }, [autoEdit, id, setEdges]);

    const allNodes = useNodes();
    const allEdges = useEdges();

    // ─── Sides from handle IDs ───
    const sourceSide = getSideFromHandle(sourceHandleId);
    const targetSide = getSideFromHandle(targetHandleId);

    // ─── Tree layout (inheritance only) ───
    const {
        isGrouped,
        isPrimary,
        anyInGroupSelected,
        treeGeometry,
        trunkPathFinal,
        barBranchesPathFinal,
        treeGroupId,
    } = useTreeLayout(
        id, source, target,
        sourceX, sourceY, targetX, targetY,
        sourceSide, selected,
        isInheritance,
    );

    // ─── Compute base path — Manhattan routing ───
    const rawPath = useMemo(
        () => computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide]
    );

    // ─── Pipeline: parse → apply waypoints → bundle spread → round corners ───
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    // Bundle spread: only applied when the user hasn't customized the routing
    // (waypoints empty) and the edge is not inheritance (which uses tree layout).
    // For self-loop / L-shape / U-detour, applyBundleSpread returns input unchanged.
    const spreadPoints = useMemo(() => {
        if (isInheritance || isSelfLoop || waypoints.length > 0) return adjustedPoints;
        return applyBundleSpread(adjustedPoints, sourceHandleId, targetHandleId, source, target);
    }, [adjustedPoints, sourceHandleId, targetHandleId, source, target, isInheritance, isSelfLoop, waypoints]);
    const spreadPath = useMemo(() => pointsToPath(spreadPoints), [spreadPoints]);

    // ─── Register path for crossing detection ───
    // Grouped inheritance edges skip individual registration: their Manhattan
    // paths are phantom (not rendered — the tree connector renders instead).
    // The tree geometry (trunk + bar + branches) is registered separately
    // by useTreeLayout, so crossing detection remains accurate.
    useEffect(() => {
        if (isInheritance && isGrouped) return;
        registerEdgePath(id, spreadPoints, source, target, treeGroupId);
        return () => unregisterEdgePath(id);
    }, [id, spreadPoints, source, target, treeGroupId, isInheritance, isGrouped]);

    // ─── Detect crossings with other edges ───
    // Scope detection to the current React Flow canvas by passing the active node IDs.
    // `useNodes()` returns only the nodes of this flow instance, so this Set is
    // implicitly tab-local — no need to inspect global Redux state.
    const activeNodeIds = useMemo(() => new Set(allNodes.map(n => n.id)), [allNodes]);
    const crossings = useMemo(
        () => getEdgeCrossings(id, spreadPoints, activeNodeIds),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, spreadPoints, activeNodeIds, allEdges]
    );

    // ─── Self-loop corner geometry (source === target) ───
    // Computed once and shared by the path and the label/cardinality positioning.
    // Falls back to the legacy curl for the frame before the node is in allNodes.
    const selfLoopGeom = useMemo((): {
        path: string;
        labelPoint: { x: number; y: number } | null;
        cardinalityPoint: { x: number; y: number } | null;
    } | null => {
        if (!isSelfLoop) return null;
        const node = allNodes.find(n => n.id === source);
        if (!node) {
            return {
                path: computeSelfLoopPath(sourceX, sourceY, targetX, targetY),
                labelPoint: null,
                cardinalityPoint: null,
            };
        }
        const rect = getNodeRect(node);
        const siblings = allEdges
            .filter(e => e.source === e.target && e.source === source)
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const ordinal = Math.max(0, siblings.findIndex(e => e.id === id));
        const loop = computeSelfLoopCornerPath(rect, ordinal);
        return {
            path: loop.path,
            labelPoint: loop.labelPoint,
            cardinalityPoint: loop.cardinalityPoint,
        };
    }, [isSelfLoop, allNodes, allEdges, source, id, sourceX, sourceY, targetX, targetY]);

    // ─── Final path with rounding and bridge arcs ───
    const path = useMemo(() => {
        if (isSelfLoop) {
            return selfLoopGeom ? selfLoopGeom.path : computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        if (crossings.length > 0) {
            return buildFinalPath(spreadPoints, crossings, 4, 6);
        }
        return roundManhattanPath(spreadPath, 4);
    }, [spreadPath, spreadPoints, crossings, isSelfLoop, selfLoopGeom, sourceX, sourceY, targetX, targetY]);

    // ─── Label positioning (reference edges) ───
    const labelPos = useMemo(() => {
        if (isSelfLoop && selfLoopGeom?.labelPoint) return selfLoopGeom.labelPoint;
        return computeLabelPosition(spreadPath);
    }, [spreadPath, isSelfLoop, selfLoopGeom]);

    const labelOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: 0 };

        const points = parsePathPoints(spreadPath);
        let longestLen = 0;
        let longestIsHorizontal = true;

        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const len = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
            if (len > longestLen) {
                longestLen = len;
                longestIsHorizontal = Math.abs(p2.y - p1.y) < 1;
            }
        }

        // Stack labels along the longest segment based on combined handle index,
        // so multiple bundled edges have separated label positions.
        const sourceIndex = getHandleIndex(sourceHandleId);
        const targetIndex = getHandleIndex(targetHandleId);
        const directionSign = source < target ? 1 : -1;
        const labelIndex = (sourceIndex + targetIndex) / 2 + directionSign * 0.5;
        const offset = (labelIndex - (MAX_HANDLES_PER_SIDE - 1) / 2) * LABEL_SPREAD_PX;

        return longestIsHorizontal
            ? { x: 0, y: offset }
            : { x: offset, y: 0 };
    }, [spreadPath, isSelfLoop, sourceHandleId, targetHandleId, source, target]);

    // ─── Cardinality positioning (reference edges) ───
    const cardinalityPos = useMemo(() => {
        // Self-loop: cardinality sits near the arrow tip on the inner side of the
        // entry segment, opposite the label (computed in computeSelfLoopCornerPath).
        if (isSelfLoop && selfLoopGeom?.cardinalityPoint) {
            return selfLoopGeom.cardinalityPoint;
        }
        return computeCardinalityPosition(spreadPath);
    }, [spreadPath, isSelfLoop, selfLoopGeom]);
    const cardinalityOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: 0 };
        const points = parsePathPoints(spreadPath);
        if (points.length < 2) return { x: 0, y: -16 };
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const isLastHorizontal = Math.abs(last.y - prev.y) < Math.abs(last.x - prev.x);

        // Use targetHandleId-driven spread, mirroring the label rule.
        const sourceIndex = getHandleIndex(sourceHandleId);
        const targetIndex = getHandleIndex(targetHandleId);
        const directionSign = source < target ? 1 : -1;
        const labelIndex = (sourceIndex + targetIndex) / 2 + directionSign * 0.5;
        const offset = (labelIndex - (MAX_HANDLES_PER_SIDE - 1) / 2) * LABEL_SPREAD_PX;

        return isLastHorizontal
            ? { x: 0, y: offset }
            : { x: offset, y: 0 };
    }, [spreadPath, isSelfLoop, sourceHandleId, targetHandleId, source, target]);

    // ─── ISA label midpoint (inheritance ER notation) ───
    const midPoint = useMemo(() => {
        const pts = parsePathPoints(spreadPath);
        if (pts.length < 2) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        const mid = Math.floor(pts.length / 2);
        const p1 = pts[mid - 1];
        const p2 = pts[mid];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }, [spreadPath, sourceX, sourceY, targetX, targetY]);

    // ─── Label commit (reference edges) ───
    // Same pattern as ClassNode's commitFieldEdit for attributes:
    // 1. Update RF state immediately (optimistic)
    // 2. Write to JjOM via direct pointer access using the DReference ID
    const commitLabel = useCallback(() => {
        setEditing(false);

        // 1. Update RF edge: both label and data.reference.name
        setEdges((edges) =>
            edges.map((e) => {
                if (e.id !== id) return e;
                const edgeData = e.data as ReferenceEdgeData | undefined;
                return {
                    ...e,
                    label: labelText,
                    data: edgeData?.reference
                        ? { ...edgeData, reference: { ...edgeData.reference, name: labelText } }
                        : e.data,
                };
            })
        );

        // 2. Sync to JjOM (safe in standalone mode — logs warning if edge not found)
        syncEdgeRefProperty(id, 'name', labelText);
    }, [id, labelText, setEdges]);

    const onKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            if (e.key === 'Enter') {
                commitLabel();
            } else if (e.key === 'Escape') {
                setLabelText(String(label || ''));
                setEditing(false);
            }
        },
        [commitLabel, label]
    );

    // ─── Notation-dependent visibility ───
    const showDiamonds = notation === 'uml' && !isInheritance && !isM1Edge;
    const showCardinality = (notation === 'uml' || notation === 'wireframe') && !isInheritance && !isM1Edge;
    const cardinality = ref ? formatCardinality(ref.lowerBound, ref.upperBound) : '';

    // ─── Marker IDs (unique per edge) ───
    const markerFilledId = `diamond-filled-${id}`;
    const markerEmptyId = `diamond-empty-${id}`;
    const markerArrowId = `arrow-${id}`;
    const markerTriangleId = `inheritance-triangle-${id}`;

    // ═══════════════════════════════════════════════════════
    // CASE 1: Primary inheritance in tree group → render tree
    // ═══════════════════════════════════════════════════════
    if (isInheritance && isPrimary && isGrouped && treeGeometry) {
        const treeMarkerId = `inheritance-triangle-group-${target}`;
        const selectedClass = anyInGroupSelected ? 'selected' : '';

        const trunkPts = parsePathPoints(treeGeometry.trunkPath);
        const parentEndpoint = trunkPts.length > 0 ? trunkPts[trunkPts.length - 1] : { x: targetX, y: targetY };
        const childEndpoint = { x: sourceX, y: sourceY };

        return (
            <>
                {!isERNotation && (
                    <defs>
                        <marker
                            id={treeMarkerId}
                            viewBox="0 0 12 10"
                            refX="7"
                            refY="5"
                            markerWidth="12"
                            markerHeight="10"
                            orient="auto"
                        >
                            <path
                                d="M 0 0 L 12 5 L 0 10 Z"
                                className={`inheritance-marker ${selectedClass}`}
                            />
                        </marker>
                    </defs>
                )}

                {/* Invisible hit-test paths */}
                <path
                    d={treeGeometry.trunkPath}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ pointerEvents: 'stroke' }}
                />
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={treeGeometry.barAndBranchesPath}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={20}
                        style={{ pointerEvents: 'stroke' }}
                    />
                )}

                {/* Trunk: bar → parent (with bridge arcs) */}
                <path
                    d={trunkPathFinal}
                    fill="none"
                    className={`inheritance-edge ${selectedClass} ${hlClass}`}
                    markerEnd={isERNotation ? undefined : `url(#${treeMarkerId})`}
                />

                {/* Bar + branches (with bridge arcs) */}
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={barBranchesPathFinal}
                        fill="none"
                        className={`inheritance-edge ${selectedClass} ${hlClass}`}
                    />
                )}

                {/* Endpoint handles */}
                {!isSelfLoop && (
                    <EndpointHandles
                        edgeId={id}
                        sourceX={childEndpoint.x}
                        sourceY={childEndpoint.y}
                        targetX={parentEndpoint.x}
                        targetY={parentEndpoint.y}
                        sourceNodeId={source}
                        targetNodeId={target}
                        selected={!!selected}
                    />
                )}

                {/* ISA label for ER notation on trunk */}
                {isERNotation && (
                    <EdgeLabelRenderer>
                        <div
                            className={`edge-label ${selectedClass} ${hlClass}`}
                            style={{
                                position: 'absolute',
                                transform: `translate(-50%, -50%) translate(${targetX}px, ${targetY + 16}px)`,
                                pointerEvents: 'none',
                            }}
                        >
                            <span className="edge-label__text edge-label__isa">ISA</span>
                        </div>
                    </EdgeLabelRenderer>
                )}
            </>
        );
    }

    // ═══════════════════════════════════════════════════════
    // CASE 2: Secondary inheritance in tree group → invisible
    // ═══════════════════════════════════════════════════════
    if (isInheritance && !isPrimary && isGrouped && treeGeometry) {
        const branchPath = treeGeometry.branchPaths.get(id);
        const childEndpoint = { x: sourceX, y: sourceY };

        return (
            <>
                <path
                    d={branchPath || `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
                    fill="none"
                    stroke="transparent"
                    strokeWidth={20}
                    style={{ pointerEvents: 'stroke' }}
                />
                {!isSelfLoop && (
                    <EndpointHandles
                        edgeId={id}
                        sourceX={childEndpoint.x}
                        sourceY={childEndpoint.y}
                        targetX={targetX}
                        targetY={targetY}
                        sourceNodeId={source}
                        targetNodeId={target}
                        selected={!!selected}
                        hideTarget
                    />
                )}
            </>
        );
    }

    // ═══════════════════════════════════════════════════════
    // CASE 3: Standard single edge (all references + single inheritance)
    // ═══════════════════════════════════════════════════════

    // Determine which markers to use
    const markerStart = isInheritance ? undefined
        : showDiamonds && kind === 'composition' ? `url(#${markerFilledId})`
        : showDiamonds && kind === 'aggregation' ? `url(#${markerEmptyId})`
        : undefined;

    const markerEnd = isInheritance
        ? (isERNotation ? undefined : `url(#${markerTriangleId})`)
        : `url(#${markerArrowId})`;

    const edgeClassName = isInheritance
        ? `inheritance-edge ${selected ? 'selected' : ''} ${hlClass}`
        : `reference-edge ${kind} ${selected ? 'selected' : ''} ${hlClass}`;

    return (
        <>
            <defs>
                {/* Reference markers */}
                {!isInheritance && (
                    <>
                        {/* Filled diamond — Composition (source side) */}
                        <marker
                            id={markerFilledId}
                            viewBox="0 0 12 8"
                            refX="0"
                            refY="4"
                            markerWidth="12"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker filled" />
                        </marker>

                        {/* Hollow diamond — Aggregation (source side) */}
                        <marker
                            id={markerEmptyId}
                            viewBox="0 0 12 8"
                            refX="0"
                            refY="4"
                            markerWidth="12"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker hollow" />
                        </marker>

                        {/* Arrow — target */}
                        <marker
                            id={markerArrowId}
                            viewBox="0 0 10 10"
                            refX="10"
                            refY="5"
                            markerWidth="8"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 0 L 10 5 L 0 10" className="reference-marker arrow" />
                        </marker>
                    </>
                )}

                {/* Inheritance marker */}
                {isInheritance && !isERNotation && (
                    <marker
                        id={markerTriangleId}
                        viewBox="0 0 12 10"
                        refX="7"
                        refY="5"
                        markerWidth="12"
                        markerHeight="10"
                        orient="auto"
                    >
                        <path
                            d="M 0 0 L 12 5 L 0 10 Z"
                            className={`inheritance-marker ${selected ? 'selected' : ''}`}
                        />
                    </marker>
                )}
            </defs>

            {/* Invisible hit-test path */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke' }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            />

            {/* Visible edge path */}
            <path
                d={path}
                fill="none"
                className={edgeClassName}
                markerStart={markerStart}
                markerEnd={markerEnd}
            />

            {/* Segment handles for manual edge customization */}
            {!isSelfLoop && (
                <SegmentHandles
                    edgeId={id}
                    adjustedPath={adjustedPath}
                    waypoints={waypoints}
                    selected={!!selected}
                />
            )}

            {/* Endpoint handles for anchor drag */}
            {!isSelfLoop && (
                <EndpointHandles
                    edgeId={id}
                    sourceX={sourceX}
                    sourceY={sourceY}
                    targetX={targetX}
                    targetY={targetY}
                    sourceNodeId={source}
                    targetNodeId={target}
                    selected={!!selected}
                />
            )}

            <EdgeLabelRenderer>
                {/* Reference label — positioned on longest segment with smart offset */}
                {/* M1 edges: label hidden by default, shown on hover via CSS */}
                {!isInheritance && (
                    <div
                        className={`edge-label ${selected ? 'selected' : ''} ${isM1Edge ? `edge-label--m1-hover${hovered || selected ? ' edge-label--m1-visible' : ''}` : ''} ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
                            pointerEvents: 'all',
                        }}
                        onDoubleClick={(e) => { e.stopPropagation(); setEditing(true); }}
                        onClick={(e) => { if (selected) { e.stopPropagation(); setEditing(true); } }}
                    >
                        {editing ? (
                            <input
                                autoFocus
                                className="edge-label__input"
                                value={labelText}
                                onChange={(e) => setLabelText(e.target.value)}
                                onBlur={commitLabel}
                                onKeyDown={onKeyDown}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            labelText && labelText !== 'newRef' && <span className="edge-label__text">{labelText}</span>
                        )}
                    </div>
                )}

                {/* Cardinality badge — positioned near target */}
                {showCardinality && cardinality && (
                    <div
                        className={`edge-cardinality ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${cardinalityPos.x + cardinalityOffset.x}px, ${cardinalityPos.y + cardinalityOffset.y}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}

                {/* ISA label for ER notation (inheritance only) */}
                {isInheritance && isERNotation && (
                    <div
                        className={`edge-label ${selected ? 'selected' : ''} ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${midPoint.x}px, ${midPoint.y}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        <span className="edge-label__text edge-label__isa">ISA</span>
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}

export default UnifiedEdge;

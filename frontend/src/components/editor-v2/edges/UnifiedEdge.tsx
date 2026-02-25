import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useNodes,
    useEdges,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, InheritanceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import { syncEdgeRefProperty } from '../sync/canvasToJjom';
import {
    computeManhattanPath,
    computeAStarPath,
    OBSTACLE_AVOIDANCE_ENABLED,
    roundManhattanPath,
    computeSelfLoopPath,
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
import { useObstacleGrid } from '../contexts/ObstacleGridContext';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { SegmentHandles } from './SegmentHandles';
import { EndpointHandles } from './EndpointHandles';

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
    } = props;

    // ─── Determine edge type ───
    const edgeData = data as (ReferenceEdgeData & InheritanceEdgeData) | undefined;
    const isInheritance = !edgeData?.reference;
    const ref = edgeData?.reference;
    const kind: ReferenceKind = ref?.kind || 'association';
    const waypoints = edgeData?.waypoints || [];
    const autoEdit = edgeData?.autoEdit as boolean | undefined;

    const { setEdges } = useReactFlow();
    const notation = useEditorContextSafe()?.notation ?? 'uml';
    const isERNotation = notation === 'er';
    const isSelfLoop = source === target;

    // ─── Label state (reference edges only) ───
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || ref?.name || ''));

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

    // ─── Obstacle grid context ───
    const { grid, nodeRects, version } = useObstacleGrid();
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

    // ─── Compute base path — A* when enabled, classic otherwise ───
    const rawPath = useMemo(
        () => {
            if (OBSTACLE_AVOIDANCE_ENABLED && grid && nodeRects.length > 0) {
                return computeAStarPath(
                    grid, sourceX, sourceY, sourceSide,
                    targetX, targetY, targetSide,
                    source, target, nodeRects,
                );
            }
            return computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide, grid, version, source, target]
    );

    // ─── Pipeline: parse → apply waypoints → round corners ───
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    // ─── Register path for crossing detection ───
    useEffect(() => {
        registerEdgePath(id, adjustedPoints, source, target, treeGroupId);
        return () => unregisterEdgePath(id);
    }, [id, adjustedPoints, source, target, treeGroupId]);

    // ─── Detect crossings with other edges ───
    const crossings = useMemo(
        () => getEdgeCrossings(id, adjustedPoints, nodeRects),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, adjustedPoints, allNodes, allEdges, nodeRects]
    );

    // ─── Final path with rounding and bridge arcs ───
    const path = useMemo(() => {
        if (isSelfLoop) {
            return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        if (crossings.length > 0) {
            return buildFinalPath(adjustedPoints, crossings, 4, 6);
        }
        return roundManhattanPath(adjustedPath, 4);
    }, [adjustedPath, adjustedPoints, crossings, isSelfLoop, sourceX, sourceY, targetX, targetY]);

    // ─── Label positioning (reference edges) ───
    const labelPos = useMemo(() => computeLabelPosition(adjustedPath), [adjustedPath]);

    const labelOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: -16 };

        const points = parsePathPoints(adjustedPath);
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

        const handleIndex = sourceHandleId ? parseInt(sourceHandleId.split('-')[1] || '0', 10) : 0;
        const sign = handleIndex % 2 === 0 ? -1 : 1;

        return longestIsHorizontal
            ? { x: 0, y: sign * 16 }
            : { x: sign * 16, y: 0 };
    }, [adjustedPath, isSelfLoop, sourceHandleId]);

    // ─── Cardinality positioning (reference edges) ───
    const cardinalityPos = useMemo(() => computeCardinalityPosition(adjustedPath), [adjustedPath]);
    const cardinalityOffset = useMemo(() => {
        const points = parsePathPoints(adjustedPath);
        if (points.length < 2) return { x: 0, y: -16 };
        const last = points[points.length - 1];
        const prev = points[points.length - 2];
        const isLastHorizontal = Math.abs(last.y - prev.y) < Math.abs(last.x - prev.x);

        const handleIndex = targetHandleId ? parseInt(targetHandleId.split('-')[1] || '0', 10) : 0;
        const sign = handleIndex % 2 === 0 ? -1 : 1;

        return isLastHorizontal
            ? { x: 0, y: sign * 16 }
            : { x: sign * 16, y: 0 };
    }, [adjustedPath, targetHandleId]);

    // ─── ISA label midpoint (inheritance ER notation) ───
    const midPoint = useMemo(() => {
        const pts = parsePathPoints(adjustedPath);
        if (pts.length < 2) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        const mid = Math.floor(pts.length / 2);
        const p1 = pts[mid - 1];
        const p2 = pts[mid];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }, [adjustedPath, sourceX, sourceY, targetX, targetY]);

    // ─── Label commit (reference edges) ───
    // Same pattern as ClassNode's commitFieldEdit for attributes:
    // 1. Update RF state immediately (optimistic)
    // 2. Write to JjOM via direct pointer access using the DReference ID
    const commitLabel = useCallback(() => {
        setEditing(false);
        console.log('[DEBUG commitLabel]', { id, labelText, edgeType: data });

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
    const showDiamonds = notation === 'uml' && !isInheritance;
    const showCardinality = (notation === 'uml' || notation === 'wireframe') && !isInheritance;
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
                            refX="12"
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
                    className={`inheritance-edge ${selectedClass}`}
                    markerEnd={isERNotation ? undefined : `url(#${treeMarkerId})`}
                />

                {/* Bar + branches (with bridge arcs) */}
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={barBranchesPathFinal}
                        fill="none"
                        className={`inheritance-edge ${selectedClass}`}
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
                            className={`edge-label ${selectedClass}`}
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
        ? `inheritance-edge ${selected ? 'selected' : ''}`
        : `reference-edge ${kind} ${selected ? 'selected' : ''}`;

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
                        refX="12"
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
                {!isInheritance && (
                    <div
                        className={`edge-label ${selected ? 'selected' : ''}`}
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
                            labelText && <span className="edge-label__text">{labelText}</span>
                        )}
                    </div>
                )}

                {/* Cardinality badge — positioned near target */}
                {showCardinality && cardinality && (
                    <div
                        className="edge-cardinality"
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
                        className={`edge-label ${selected ? 'selected' : ''}`}
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

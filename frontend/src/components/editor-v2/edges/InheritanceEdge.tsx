import { useMemo, useEffect } from 'react';
import { useNodes, useEdges, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { InheritanceEdgeData } from '../types';
import {
    computeManhattanPath,
    computeAStarPath,
    OBSTACLE_AVOIDANCE_ENABLED,
    roundManhattanPath,
    computeSelfLoopPath,
    parsePathPoints,
    parsePathSubPaths,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
    computeTreeConnectorPath,
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    buildFinalPath,
    type TreeBranch,
} from '../utils/edgeUtils';
import { useObstacleGrid } from '../contexts/ObstacleGridContext';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { SegmentHandles } from './SegmentHandles';
import { EndpointHandles } from './EndpointHandles';

function InheritanceEdge(props: EdgeProps) {
    const { id, sourceX, sourceY, targetX, targetY, source, target, sourceHandleId, targetHandleId, selected, data } = props;

    const edgeData = data as InheritanceEdgeData | undefined;
    const waypoints = edgeData?.waypoints || [];
    const notation = useEditorContextSafe()?.notation ?? 'uml';
    const isERNotation = notation === 'er';

    const isSelfLoop = source === target;

    // Phase 7: obstacle grid context
    const { grid, version } = useObstacleGrid();
    const allNodes = useNodes();
    const allEdges = useEdges();

    // Get sides from handle IDs
    const sourceSide = getSideFromHandle(sourceHandleId);
    const targetSide = getSideFromHandle(targetHandleId);

    // ═══ Tree group detection ═══
    // Find all inheritance edges targeting the same parent, sorted by ID for stable primary
    const group = useMemo(() => {
        return allEdges
            .filter(e => e.type === 'inheritance' && e.target === target)
            .sort((a, b) => a.id.localeCompare(b.id));
    }, [allEdges, target]);

    const isPrimary = group.length > 0 && group[0].id === id;
    const isGrouped = group.length > 1;

    // Unified selection: highlight whole tree when any edge in the group is selected
    const anyInGroupSelected = useMemo(() => {
        if (!isGrouped) return !!selected;
        return group.some(e => e.selected);
    }, [isGrouped, group, selected]);

    // ═══ Tree connector geometry (computed by all grouped edges for branch access) ═══
    const treeGeometry = useMemo(() => {
        if (!isGrouped) return null;

        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        const branches: TreeBranch[] = [];

        for (const edge of group) {
            const childNode = nodeMap.get(edge.source);
            if (!childNode) continue;

            const w = (childNode.measured?.width ?? (childNode as any).width ?? 180) as number;
            const h = (childNode.measured?.height ?? (childNode as any).height ?? 80) as number;
            const childCenterX = (childNode.position?.x ?? 0) + w / 2;
            const childY = sourceSide === 'top'
                ? (childNode.position?.y ?? 0)
                : (childNode.position?.y ?? 0) + h;

            branches.push({ childX: childCenterX, childY, edgeId: edge.id });
        }

        return computeTreeConnectorPath(targetX, targetY, branches);
    }, [isGrouped, group, allNodes, targetX, targetY, sourceSide]);

    // Compute base path — A* when enabled, classic otherwise
    const rawPath = useMemo(
        () => {
            if (OBSTACLE_AVOIDANCE_ENABLED && grid) {
                return computeAStarPath(
                    grid, sourceX, sourceY, sourceSide,
                    targetX, targetY, targetSide,
                    source, target, allNodes as any,
                );
            }
            return computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide);
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide, grid, version, source, target]
    );

    // Pipeline: parse → apply waypoints → round corners
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    // Register path for crossing detection by other edges
    useEffect(() => {
        registerEdgePath(id, adjustedPoints, source, target);
        return () => unregisterEdgePath(id);
    }, [id, adjustedPoints, source, target]);

    // Register tree geometry paths (trunk, bar, branches) for crossing detection
    useEffect(() => {
        if (!isPrimary || !isGrouped || !treeGeometry) return;

        const treeIds: string[] = [];

        // Register trunk path (vertical segment from bar to parent)
        const trunkPts = parsePathPoints(treeGeometry.trunkPath);
        if (trunkPts.length >= 2) {
            const tid = `${id}__trunk`;
            registerEdgePath(tid, trunkPts, source, target);
            treeIds.push(tid);
        }

        // Register bar + branch sub-paths (horizontal bar + vertical branches to children)
        if (treeGeometry.barAndBranchesPath) {
            const subPaths = parsePathSubPaths(treeGeometry.barAndBranchesPath);
            subPaths.forEach((pts, idx) => {
                if (pts.length >= 2) {
                    const sid = `${id}__tree_${idx}`;
                    registerEdgePath(sid, pts, source, target);
                    treeIds.push(sid);
                }
            });
        }

        return () => { treeIds.forEach(tid => unregisterEdgePath(tid)); };
    }, [id, isPrimary, isGrouped, treeGeometry, source, target]);

    // Detect crossings with other edges
    const crossings = useMemo(
        () => getEdgeCrossings(id, adjustedPoints),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, adjustedPoints, allNodes, allEdges]
    );

    // Final path with rounding and bridge arcs
    const path = useMemo(() => {
        if (isSelfLoop) {
            return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        if (crossings.length > 0) {
            return buildFinalPath(adjustedPoints, crossings, 4, 6);
        }
        return roundManhattanPath(adjustedPath, 4);
    }, [adjustedPath, adjustedPoints, crossings, isSelfLoop, sourceX, sourceY, targetX, targetY]);

    // Marker ID unique per edge (or per group for tree connector)
    const markerTriangleId = `inheritance-triangle-${id}`;

    // Compute crossings for tree segments so they also get bridge arcs
    const trunkPathFinal = useMemo(() => {
        if (!isPrimary || !isGrouped || !treeGeometry) return '';
        const trunkPts = parsePathPoints(treeGeometry.trunkPath);
        if (trunkPts.length < 2) return treeGeometry.trunkPath;
        const trunkCrossings = getEdgeCrossings(`${id}__trunk`, trunkPts);
        if (trunkCrossings.length > 0) {
            return buildFinalPath(trunkPts, trunkCrossings, 4, 6);
        }
        return treeGeometry.trunkPath;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isPrimary, isGrouped, treeGeometry, allNodes, allEdges]);

    const barBranchesPathFinal = useMemo(() => {
        if (!isPrimary || !isGrouped || !treeGeometry?.barAndBranchesPath) return treeGeometry?.barAndBranchesPath || '';
        const subPaths = parsePathSubPaths(treeGeometry.barAndBranchesPath);
        const finalParts: string[] = [];
        for (let idx = 0; idx < subPaths.length; idx++) {
            const pts = subPaths[idx];
            if (pts.length < 2) {
                finalParts.push(pointsToPath(pts));
                continue;
            }
            const segCrossings = getEdgeCrossings(`${id}__tree_${idx}`, pts);
            if (segCrossings.length > 0) {
                finalParts.push(buildFinalPath(pts, segCrossings, 4, 6));
            } else {
                finalParts.push(pointsToPath(pts));
            }
        }
        return finalParts.join(' ');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isPrimary, isGrouped, treeGeometry, allNodes, allEdges]);

    // Midpoint for ISA label in ER notation (must be before early returns to respect hooks rules)
    const midPoint = useMemo(() => {
        const pts = parsePathPoints(adjustedPath);
        if (pts.length < 2) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        const mid = Math.floor(pts.length / 2);
        const p1 = pts[mid - 1];
        const p2 = pts[mid];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }, [adjustedPath, sourceX, sourceY, targetX, targetY]);

    // ═══ CASE 1: Primary edge in a group → render tree connector ═══
    if (isPrimary && isGrouped && treeGeometry) {
        const treeMarkerId = `inheritance-triangle-group-${target}`;
        const selectedClass = anyInGroupSelected ? 'selected' : '';

        // Connection points: use actual React Flow handle positions for accurate endpoint handles
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

                {/* Invisible hit-test paths for easier selection */}
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

                {/* Trunk: bar → parent (with bridge arcs at crossings) */}
                <path
                    d={trunkPathFinal}
                    fill="none"
                    className={`inheritance-edge ${selectedClass}`}
                    markerEnd={isERNotation ? undefined : `url(#${treeMarkerId})`}
                />

                {/* Bar + branches (with bridge arcs at crossings) */}
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={barBranchesPathFinal}
                        fill="none"
                        className={`inheritance-edge ${selectedClass}`}
                    />
                )}

                {/* Endpoint handle: target at trunk→parent, source at branch→child */}
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

                {/* ISA label for ER notation on trunk midpoint */}
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

    // ═══ CASE 2: Secondary edge in a group → invisible hit-test path + segment handles ═══
    if (!isPrimary && isGrouped && treeGeometry) {
        const branchPath = treeGeometry.branchPaths.get(id);

        // Use actual React Flow handle position for accurate endpoint handle
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
                {/* Endpoint handle: only source (child side); target is on trunk rendered by primary */}
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

    // ═══ CASE 3: Single inheritance edge → standard Manhattan rendering ═══
    return (
        <>
            {!isERNotation && (
                <defs>
                    {/* Hollow triangle (UML generalization marker) */}
                    <marker
                        id={markerTriangleId}
                        viewBox="0 0 12 8"
                        refX="12"
                        refY="4"
                        markerWidth="12"
                        markerHeight="8"
                        orient="auto"
                    >
                        <path
                            d="M 0 0 L 12 5 L 0 10 Z"
                            className={`inheritance-marker ${selected ? 'selected' : ''}`}
                        />
                    </marker>
                </defs>
            )}

            {/* Invisible hit-test path for easier selection */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke' }}
            />
            <path
                d={path}
                fill="none"
                className={`inheritance-edge ${selected ? 'selected' : ''}`}
                markerEnd={isERNotation ? undefined : `url(#${markerTriangleId})`}
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
                {/* ISA label for ER notation */}
                {isERNotation && (
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

export default InheritanceEdge;

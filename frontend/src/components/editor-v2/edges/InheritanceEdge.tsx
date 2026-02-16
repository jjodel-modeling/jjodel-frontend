import { useMemo } from 'react';
import { useNodes, useEdges, EdgeLabelRenderer, type EdgeProps } from '@xyflow/react';
import type { InheritanceEdgeData } from '../types';
import {
    computeManhattanPath,
    computeAStarPath,
    OBSTACLE_AVOIDANCE_ENABLED,
    roundManhattanPath,
    computeSelfLoopPath,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
    computeTreeConnectorPath,
    type TreeBranch,
} from '../utils/edgeUtils';
import { useObstacleGrid } from '../contexts/ObstacleGridContext';
import { useEditorContextSafe } from '../contexts/EditorContext';

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

    // Final path with rounding
    const path = useMemo(() => {
        if (isSelfLoop) {
            return computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        return roundManhattanPath(adjustedPath, 4);
    }, [adjustedPath, isSelfLoop, sourceX, sourceY, targetX, targetY]);

    // Marker ID unique per edge (or per group for tree connector)
    const markerTriangleId = `inheritance-triangle-${id}`;

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
        return (
            <>
                {!isERNotation && (
                    <defs>
                        <marker
                            id={treeMarkerId}
                            viewBox="0 0 12 10"
                            refX="0"
                            refY="5"
                            markerWidth="14"
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

                {/* Trunk: bar → parent */}
                <path
                    d={treeGeometry.trunkPath}
                    fill="none"
                    className={`inheritance-edge ${selectedClass}`}
                    markerEnd={isERNotation ? undefined : `url(#${treeMarkerId})`}
                />

                {/* Bar + branches (no marker) */}
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={treeGeometry.barAndBranchesPath}
                        fill="none"
                        className={`inheritance-edge ${selectedClass}`}
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

    // ═══ CASE 2: Secondary edge in a group → invisible hit-test path ═══
    if (!isPrimary && isGrouped && treeGeometry) {
        const branchPath = treeGeometry.branchPaths.get(id);
        return (
            <path
                d={branchPath || `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke' }}
            />
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
                        viewBox="0 0 12 10"
                        refX="0"
                        refY="5"
                        markerWidth="14"
                        markerHeight="10"
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

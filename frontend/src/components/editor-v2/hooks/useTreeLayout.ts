import { useMemo, useEffect, useCallback } from 'react';
import { useStore, useEdges, useStoreApi, type Node, type ReactFlowState } from '@xyflow/react';
import {
    computeTreeConnectorPath,
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    buildFinalPath,
    roundManhattanPath,
    parsePathPoints,
    parsePathSubPaths,
    pointsToPath,
    TREE_BUS_CORNER_RADIUS,
    type TreeBranch,
} from '../utils/edgeUtils';
import { computeHandlePositionForNode } from '../utils/handlePosition';

// Stable empty array returned by the nodes selector for non-inheritance edges,
// so their subscription never fires (Object.is-equal on every store notification).
const EMPTY_NODES: Node[] = [];

export interface TreeGeometry {
    trunkPath: string;
    barAndBranchesPath: string;
    branchPaths: Map<string, string>;
    /** Where the trunk meets the bar — null when there is no bar (single child) */
    junction?: { x: number; y: number } | null;
}

export interface TreeLayoutResult {
    /** Whether this edge is part of a multi-inheritance group */
    isGrouped: boolean;
    /** Whether this edge is the primary renderer in its group */
    isPrimary: boolean;
    /** Whether any edge in the group is selected */
    anyInGroupSelected: boolean;
    /** Tree geometry (trunk, bar, branches) — null if not grouped */
    treeGeometry: TreeGeometry | null;
    /** Final trunk path with bridge arcs at crossings */
    trunkPathFinal: string;
    /** Final bar+branches path with bridge arcs at crossings */
    barBranchesPathFinal: string;
    /** Group ID for crossing exclusion — shared by all edges and segments in the same tree.
     *  Inheritance edges should pass this when registering their individual paths. */
    treeGroupId: string | undefined;
}

/**
 * Hook that handles inheritance tree grouping, geometry, path registration,
 * and obstacle management for grouped inheritance edges.
 *
 * Extracted from InheritanceEdge to be used by UnifiedEdge.
 */
export function useTreeLayout(
    edgeId: string,
    source: string,
    target: string,
    sourceX: number,
    sourceY: number,
    targetX: number,
    targetY: number,
    sourceSide: string,
    selected: boolean | undefined,
    isInheritance: boolean,
): TreeLayoutResult {
    // Nodes subscription gated on isInheritance: tree geometry consumes allNodes
    // only for grouped inheritance edges. Every other edge gets the stable
    // EMPTY_NODES constant and never re-renders on node changes (leva 2,
    // discovery 2026-07-20_trickle_leve_2_3). All consumers below are gated on
    // isGrouped, which is always false when isInheritance is false.
    const allNodes = useStore(
        useCallback((s: ReactFlowState) => (isInheritance ? (s.nodes as Node[]) : EMPTY_NODES), [isInheritance])
    );
    const allEdges = useEdges();
    const storeApi = useStoreApi();

    // Tree group detection — find all inheritance edges targeting the same parent
    const group = useMemo(() => {
        if (!isInheritance) return [];
        return allEdges
            .filter(e => {
                if (e.type !== 'inheritance' || e.target !== target) return false;
                // Exclude edges with anchors pinned to non-standard sides from tree grouping
                const srcAnchor = (e.data as any)?.sourceAnchor;
                if (srcAnchor?.mode === 'pinned' && srcAnchor.side !== 'top') return false;
                const tgtAnchor = (e.data as any)?.targetAnchor;
                if (tgtAnchor?.mode === 'pinned' && tgtAnchor.side !== 'bottom') return false;
                return true;
            })
            .sort((a, b) => a.id.localeCompare(b.id));
    }, [allEdges, target, isInheritance]);

    const isPrimary = group.length > 0 && group[0].id === edgeId;
    const isGrouped = group.length > 1;

    // Unified selection: highlight whole tree when any edge in the group is selected
    const anyInGroupSelected = useMemo(() => {
        if (!isGrouped) return !!selected;
        return group.some(e => e.selected);
    }, [isGrouped, group, selected]);

    // Build set of node IDs to exclude from obstacle checks (parent + all children in tree)
    const treeExcludeIds = useMemo(() => {
        if (!isGrouped) return new Set<string>();
        const ids = new Set<string>();
        ids.add(target); // parent node
        for (const edge of group) {
            ids.add(edge.source); // child nodes
        }
        return ids;
    }, [isGrouped, group, target]);

    // Tree connector geometry
    const treeGeometry = useMemo((): TreeGeometry | null => {
        if (!isGrouped) return null;

        const nodeMap = new Map(allNodes.map(n => [n.id, n]));
        const branches: TreeBranch[] = [];

        // Centroid map for the geometry-aware inheritance ordering (S7). Built the
        // SAME way DynamicHandles does (nodeLookup + positionAbsolute) so the branch
        // landing and the rendered handle resolve to the identical fraction.
        const nodePositions = new Map<string, { centerX: number; centerY: number }>();
        for (const [id, n] of storeApi.getState().nodeLookup) {
            const p = n.internals?.positionAbsolute ?? n.position;
            const nw = n.measured?.width ?? 180;
            const nh = n.measured?.height ?? 80;
            nodePositions.set(id, { centerX: p.x + nw / 2, centerY: p.y + nh / 2 });
        }

        for (const edge of group) {
            const childNode = nodeMap.get(edge.source);
            if (!childNode) continue;

            const w = (childNode.measured?.width ?? (childNode as any).width ?? 180) as number;
            const h = (childNode.measured?.height ?? (childNode as any).height ?? 80) as number;
            const childY = sourceSide === 'top'
                ? (childNode.position?.y ?? 0)
                : (childNode.position?.y ?? 0) + h;

            // Land the branch on the handle assigned to this inheritance edge
            // (child side = source), not the node center — so it no longer
            // overlaps references sharing the same side. Single source of truth
            // with DynamicHandles: computeHandlePositionForNode rebuilds the side's
            // endpoints from the current edge set (allEdges) and positions them.
            const childHandleId = edge.sourceHandle ?? `${sourceSide}-0`;
            const handlePos = computeHandlePositionForNode({
                edges: allEdges,
                nodeId: edge.source,
                nodeX: childNode.position?.x ?? 0,
                nodeY: childNode.position?.y ?? 0,
                nodeWidth: w,
                nodeHeight: h,
                handleId: childHandleId,
                role: 'source',
                nodePositions,
            });

            branches.push({ childX: handlePos.x, childY, edgeId: edge.id });
        }

        return computeTreeConnectorPath(targetX, targetY, branches, [], treeExcludeIds);
    }, [isGrouped, group, allNodes, allEdges, storeApi, targetX, targetY, sourceSide, treeExcludeIds]);

    // Register tree geometry paths for crossing detection.
    // All segments use treeGroupId = target (parent node ID) so that
    // crossings between the tree and its member inheritance edges are suppressed.
    const treeGroupId = `tree_${target}`;

    useEffect(() => {
        if (!isPrimary || !isGrouped || !treeGeometry) return;

        const treeIds: string[] = [];

        const trunkPts = parsePathPoints(treeGeometry.trunkPath);
        if (trunkPts.length >= 2) {
            const tid = `${edgeId}__trunk`;
            registerEdgePath(tid, trunkPts, source, target, treeGroupId);
            treeIds.push(tid);
        }

        if (treeGeometry.barAndBranchesPath) {
            const subPaths = parsePathSubPaths(treeGeometry.barAndBranchesPath);
            subPaths.forEach((pts, idx) => {
                if (pts.length >= 2) {
                    const sid = `${edgeId}__tree_${idx}`;
                    registerEdgePath(sid, pts, source, target, treeGroupId);
                    treeIds.push(sid);
                }
            });
        }

        return () => { treeIds.forEach(tid => unregisterEdgePath(tid)); };
    }, [edgeId, isPrimary, isGrouped, treeGeometry, source, target, treeGroupId]);

    // Active-canvas filter for crossing detection (see getEdgeCrossings docs).
    const activeNodeIds = useMemo(() => new Set(allNodes.map(n => n.id)), [allNodes]);

    // Compute crossings for tree segments so they also get bridge arcs
    const trunkPathFinal = useMemo(() => {
        if (!isPrimary || !isGrouped || !treeGeometry) return '';
        const trunkPts = parsePathPoints(treeGeometry.trunkPath);
        if (trunkPts.length < 2) return treeGeometry.trunkPath;
        const trunkCrossings = getEdgeCrossings(`${edgeId}__trunk`, trunkPts, activeNodeIds, []);
        if (trunkCrossings.length > 0) {
            return buildFinalPath(trunkPts, trunkCrossings, 4, 6);
        }
        return roundManhattanPath(treeGeometry.trunkPath, 4);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeId, isPrimary, isGrouped, treeGeometry, activeNodeIds, allEdges]);

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
            // TREE_BUS_CORNER_RADIUS applies to the ONE corner an outer child's
            // L sub-path carries. Interior children are two-point verticals: both
            // helpers leave a path without corners alone, so the T-junctions stay
            // square whatever radius is passed here.
            const segCrossings = getEdgeCrossings(`${edgeId}__tree_${idx}`, pts, activeNodeIds, []);
            if (segCrossings.length > 0) {
                finalParts.push(buildFinalPath(pts, segCrossings, TREE_BUS_CORNER_RADIUS, 6));
            } else {
                finalParts.push(roundManhattanPath(pointsToPath(pts), TREE_BUS_CORNER_RADIUS));
            }
        }
        return finalParts.join(' ');
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edgeId, isPrimary, isGrouped, treeGeometry, allNodes, allEdges]);

    return {
        isGrouped,
        isPrimary,
        anyInGroupSelected,
        treeGeometry,
        trunkPathFinal,
        barBranchesPathFinal,
        treeGroupId: isInheritance ? treeGroupId : undefined,
    };
}

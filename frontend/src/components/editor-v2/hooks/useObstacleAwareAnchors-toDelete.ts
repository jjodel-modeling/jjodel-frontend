/**
 * DISABLED — This hook is not currently in use.
 * The obstacle avoidance system was disabled due to performance issues
 * (~120ms setTimeout violations per cycle). The Manhattan base router
 * is sufficient for current needs.
 *
 * To re-enable: import and call this hook in EditorV2.tsx,
 * wrap with ObstacleGridProvider, and set OBSTACLE_AVOIDANCE_ENABLED = true.
 *
 * useObstacleAwareAnchors — post-pass hook that improves anchor side selection
 * by evaluating A* paths for multiple anchor candidates.
 *
 * When obstacles sit between two nodes, the geometric anchor choice can force
 * A* into a long detour. This hook detects those cases and switches to the
 * anchor pair that produces the shortest routed path.
 *
 * Cooperation with other anchor systems:
 * - Sets edge.data.oaaOptimized = true on optimized edges
 * - handleNodesChange and recalculateAnchors skip edges with this flag
 * - Flag is cleared when grid version changes (nodes moved/resized)
 */

import { useEffect, useRef } from 'react';
import { useReactFlow, useNodes, useEdges } from '@xyflow/react';
import { useObstacleGrid } from '../contexts/ObstacleGridContext';
import { computeAStarPath, getSideFromHandle, parsePathPoints } from '../utils/edgeUtils';
import { computePortDistribution, type NodePosition } from '../utils/portDistribution';
import type { NodeRect } from '../utils/ObstacleGrid';
import type { AnchorSide } from '../types';

const ALL_SIDES: AnchorSide[] = ['top', 'right', 'bottom', 'left'];

function getAnchorConfig(
    edgeData: any,
    endpoint: 'source' | 'target',
    handleId: string | null | undefined,
): { mode: 'auto' | 'pinned'; side: AnchorSide } {
    const config = endpoint === 'source' ? edgeData?.sourceAnchor : edgeData?.targetAnchor;
    if (config) return config;
    return { mode: 'auto', side: getSideFromHandle(handleId) as AnchorSide };
}

function getAnchorPoint(
    node: any,
    side: AnchorSide,
): { x: number; y: number } {
    const pos = node.internals?.positionAbsolute ?? node.positionAbsolute ?? node.position;
    const w = node.measured?.width ?? node.width ?? 180;
    const h = node.measured?.height ?? node.height ?? 80;

    switch (side) {
        case 'top':    return { x: pos.x + w / 2, y: pos.y };
        case 'bottom': return { x: pos.x + w / 2, y: pos.y + h };
        case 'left':   return { x: pos.x, y: pos.y + h / 2 };
        case 'right':  return { x: pos.x + w, y: pos.y + h / 2 };
    }
}

function measurePathCost(pathD: string): number {
    const points = parsePathPoints(pathD);
    if (points.length < 2) return Infinity;
    let cost = 0;
    for (let i = 0; i < points.length - 1; i++) {
        cost += Math.abs(points[i + 1].x - points[i].x)
              + Math.abs(points[i + 1].y - points[i].y);
    }
    return cost;
}

function hasObstacleInBoundingBox(
    sourceNode: any,
    targetNode: any,
    edgeSourceId: string,
    edgeTargetId: string,
    nodeRects: NodeRect[],
): boolean {
    const sPos = sourceNode.internals?.positionAbsolute ?? sourceNode.positionAbsolute ?? sourceNode.position;
    const tPos = targetNode.internals?.positionAbsolute ?? targetNode.positionAbsolute ?? targetNode.position;
    const sw = sourceNode.measured?.width ?? 180;
    const sh = sourceNode.measured?.height ?? 80;
    const tw = targetNode.measured?.width ?? 180;
    const th = targetNode.measured?.height ?? 80;

    const bbMinX = Math.min(sPos.x, tPos.x);
    const bbMaxX = Math.max(sPos.x + sw, tPos.x + tw);
    const bbMinY = Math.min(sPos.y, tPos.y);
    const bbMaxY = Math.max(sPos.y + sh, tPos.y + th);

    for (const nr of nodeRects) {
        if (nr.id === edgeSourceId || nr.id === edgeTargetId) continue;
        if (nr.type === 'packageNode') continue;
        const r = nr.rect;
        if (r.x + r.width > bbMinX && r.x < bbMaxX &&
            r.y + r.height > bbMinY && r.y < bbMaxY) {
            return true;
        }
    }
    return false;
}

const DEBOUNCE_MS = 50;
const IMPROVEMENT_THRESHOLD = 0.9;

export function useObstacleAwareAnchors(): void {
    const { setEdges } = useReactFlow();
    const nodes = useNodes();
    const edges = useEdges();
    const { grid, nodeRects, version } = useObstacleGrid();

    const lastAnchorsRef = useRef<Map<string, string>>(new Map());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const optimizedEdgesRef = useRef<Set<string>>(new Set());
    const lastVersionRef = useRef<number>(-1);

    useEffect(() => {
        if (!grid || nodeRects.length === 0) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {

            // When grid version changes (nodes moved/resized), clear oaaOptimized flags
            // from all edges and reset the optimized set so OAA re-evaluates everything
            const versionChanged = lastVersionRef.current !== version;
            if (versionChanged) {
                optimizedEdgesRef.current.clear();
                lastAnchorsRef.current.clear();
                lastVersionRef.current = version;

                // Clear oaaOptimized flag from all edges
                setEdges(currentEdges => {
                    const needsClear = currentEdges.some(e => (e.data as any)?.oaaOptimized);
                    if (!needsClear) return currentEdges;
                    return currentEdges.map(e => {
                        if ((e.data as any)?.oaaOptimized) {
                            return { ...e, data: { ...e.data, oaaOptimized: undefined } };
                        }
                        return e;
                    });
                });
            }

            const updates = new Map<string, { sourceHandle: AnchorSide; targetHandle: AnchorSide }>();

            for (const edge of edges) {
                if (edge.source === edge.target) continue;
                if (edge.type === 'inheritance') continue;

                // Skip edges already optimized in this grid version
                if (optimizedEdgesRef.current.has(edge.id)) continue;

                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                if (!sourceNode || !targetNode) continue;

                const edgeData = edge.data as any;
                const srcAnchor = getAnchorConfig(edgeData, 'source', edge.sourceHandle);
                const tgtAnchor = getAnchorConfig(edgeData, 'target', edge.targetHandle);

                if (srcAnchor.mode === 'pinned' && tgtAnchor.mode === 'pinned') {
                    optimizedEdgesRef.current.add(edge.id);
                    continue;
                }

                if (!hasObstacleInBoundingBox(sourceNode, targetNode, edge.source, edge.target, nodeRects)) {
                    optimizedEdgesRef.current.add(edge.id);
                    continue;
                }

                const srcCandidates = srcAnchor.mode === 'pinned' ? [srcAnchor.side] : ALL_SIDES;
                const tgtCandidates = tgtAnchor.mode === 'pinned' ? [tgtAnchor.side] : ALL_SIDES;

                const currentSrc = getSideFromHandle(edge.sourceHandle) as AnchorSide;
                const currentTgt = getSideFromHandle(edge.targetHandle) as AnchorSide;

                let bestSrcSide: AnchorSide = currentSrc;
                let bestTgtSide: AnchorSide = currentTgt;
                let bestCost = Infinity;
                let currentCost = Infinity;
                let foundOptimal = false;

                for (const srcSide of srcCandidates) {
                    if (foundOptimal) break;
                    for (const tgtSide of tgtCandidates) {
                        const srcPt = getAnchorPoint(sourceNode, srcSide);
                        const tgtPt = getAnchorPoint(targetNode, tgtSide);

                        const pathD = computeAStarPath(
                            grid,
                            srcPt.x, srcPt.y, srcSide,
                            tgtPt.x, tgtPt.y, tgtSide,
                            edge.source, edge.target,
                            nodeRects,
                        );

                        const cost = measurePathCost(pathD);

                        if (srcSide === currentSrc && tgtSide === currentTgt) {
                            currentCost = cost;
                        }

                        if (cost < bestCost) {
                            bestCost = cost;
                            bestSrcSide = srcSide;
                            bestTgtSide = tgtSide;
                        }

                        if (parsePathPoints(pathD).length <= 2) {
                            foundOptimal = true;
                            break;
                        }
                    }
                }

                // Mark as optimized regardless of outcome
                optimizedEdgesRef.current.add(edge.id);

                if (bestSrcSide === currentSrc && bestTgtSide === currentTgt) continue;

                const newKey = `${bestSrcSide}-${bestTgtSide}`;
                if (lastAnchorsRef.current.get(edge.id) === newKey) continue;

                if (bestCost >= currentCost * IMPROVEMENT_THRESHOLD) continue;

                updates.set(edge.id, { sourceHandle: bestSrcSide, targetHandle: bestTgtSide });
                lastAnchorsRef.current.set(edge.id, newKey);
            }

            if (updates.size === 0) return;

            setEdges(currentEdges => {
                const updatedEdges = currentEdges.map(e => {
                    const update = updates.get(e.id);
                    if (!update) return e;

                    const edgeData = e.data as any;
                    const srcAnchor = edgeData?.sourceAnchor;
                    const tgtAnchor = edgeData?.targetAnchor;

                    return {
                        ...e,
                        sourceHandle: `${update.sourceHandle}-0`,
                        targetHandle: `${update.targetHandle}-0`,
                        data: {
                            ...e.data,
                            sourceAnchor: srcAnchor?.mode === 'pinned'
                                ? srcAnchor
                                : { mode: 'auto' as const, side: update.sourceHandle },
                            targetAnchor: tgtAnchor?.mode === 'pinned'
                                ? tgtAnchor
                                : { mode: 'auto' as const, side: update.targetHandle },
                            waypoints: [],
                            oaaOptimized: true,
                        },
                    };
                });

                const nodeIds = new Set<string>();
                for (const e of updatedEdges) { nodeIds.add(e.source); nodeIds.add(e.target); }

                const nodePositions = new Map<string, NodePosition>();
                for (const n of nodes) {
                    const w = (n.measured?.width ?? 180) as number;
                    const h = (n.measured?.height ?? 80) as number;
                    nodePositions.set(n.id, {
                        centerX: n.position.x + w / 2,
                        centerY: n.position.y + h / 2,
                    });
                }

                const { edgeHandles } = computePortDistribution(
                    updatedEdges,
                    Array.from(nodeIds),
                    nodePositions,
                );

                return updatedEdges.map(e => {
                    const handles = edgeHandles.get(e.id);
                    if (handles) {
                        return { ...e, sourceHandle: handles.sourceHandle, targetHandle: handles.targetHandle };
                    }
                    return e;
                });
            });
        }, DEBOUNCE_MS);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [edges.length, nodes, version, grid, nodeRects]);
}

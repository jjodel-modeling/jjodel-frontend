/**
 * Editor V3 — UnifiedEdge: single edge component for all 7 edge kinds.
 *
 * Edge types:
 *   inheritance   → hollow triangle at target
 *   reference     → arrow at target
 *   composition   → filled diamond at source, arrow at target
 *   aggregation   → hollow diamond at source, arrow at target
 *   dependency    → dashed line, open arrow at target
 *   instanceLink  → dashed line, arrow at target
 *   valueLink     → solid line, no markers
 *
 * Manhattan routing with rounded corners and label support.
 */

import React, { useMemo, useCallback, useState, useEffect, memo } from 'react';
import { EdgeLabelRenderer, useReactFlow, type EdgeProps } from '@xyflow/react';
import type { UnifiedEdgeData } from '../types';
import {
    computeManhattanPath,
    roundManhattanPath,
    computeSelfLoopPath,
    computeLabelPosition,
    computeCardinalityPosition,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
} from './edgeRouting';
import { getEdgeMarkerConfig, MARKER_DEFS, markerIdFor, type MarkerShape } from './edgeMarkers';
import { SegmentHandles } from './SegmentHandles';

function UnifiedEdgeComponent(props: EdgeProps) {
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
    } = props;

    const edgeData = data as unknown as UnifiedEdgeData | undefined;
    const edgeKind = edgeData?.edgeKind ?? 'reference';
    const waypoints = edgeData?.waypoints ?? [];
    const edgeLabel = edgeData?.label ?? '';
    const sourceCardinality = edgeData?.sourceCardinality;
    const targetCardinality = edgeData?.targetCardinality;

    const { setEdges } = useReactFlow();
    const isSelfLoop = source === target;

    // Label editing state
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(edgeLabel);

    useEffect(() => {
        if (!editing) setLabelText(edgeLabel);
    }, [edgeLabel, editing]);

    // Sides from handle IDs
    const sourceSide = getSideFromHandle(sourceHandleId);
    const targetSide = getSideFromHandle(targetHandleId);

    // Marker configuration for this edge kind
    const markerConfig = useMemo(() => getEdgeMarkerConfig(edgeKind), [edgeKind]);

    // ── Compute base Manhattan path ──
    const rawPath = useMemo(
        () => isSelfLoop
            ? computeSelfLoopPath(sourceX, sourceY, targetX, targetY)
            : computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide, isSelfLoop]
    );

    // ── Pipeline: parse → apply waypoints → round corners ──
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    const path = useMemo(() => {
        if (isSelfLoop) return rawPath;
        return roundManhattanPath(adjustedPath);
    }, [adjustedPath, isSelfLoop, rawPath]);

    // ── Label positioning ──
    const labelPos = useMemo(() => computeLabelPosition(adjustedPath), [adjustedPath]);
    const labelOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: -16 };
        const points = parsePathPoints(adjustedPath);
        let longestIsHorizontal = true;
        let longestLen = 0;
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const len = Math.abs(p2.x - p1.x) + Math.abs(p2.y - p1.y);
            if (len > longestLen) {
                longestLen = len;
                longestIsHorizontal = Math.abs(p2.y - p1.y) < 1;
            }
        }
        return longestIsHorizontal ? { x: 0, y: -14 } : { x: -14, y: 0 };
    }, [adjustedPath, isSelfLoop]);

    // ── Cardinality positioning ──
    const cardinalityPos = useMemo(
        () => computeCardinalityPosition(adjustedPath),
        [adjustedPath]
    );

    // ── Label commit ──
    const commitLabel = useCallback(() => {
        setEditing(false);
        setEdges(edges => edges.map(e => {
            if (e.id !== id) return e;
            return { ...e, data: { ...e.data, label: labelText } };
        }));
        // TODO: sync to JjOM via syncEdgeRefProperty
    }, [id, labelText, setEdges]);

    const onKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter') commitLabel();
        else if (e.key === 'Escape') {
            setLabelText(edgeLabel);
            setEditing(false);
        }
    }, [commitLabel, edgeLabel]);

    // ── Build marker refs ──
    const startMarkerRef = markerConfig.startMarker
        ? `url(#${markerIdFor(id, markerConfig.startMarker)})`
        : undefined;
    const endMarkerRef = markerConfig.endMarker
        ? `url(#${markerIdFor(id, markerConfig.endMarker)})`
        : undefined;

    // ── Collect unique markers needed ──
    const markersNeeded: MarkerShape[] = [];
    if (markerConfig.startMarker) markersNeeded.push(markerConfig.startMarker);
    if (markerConfig.endMarker) markersNeeded.push(markerConfig.endMarker);

    const selectedClass = selected ? 'selected' : '';

    return (
        <>
            {/* SVG marker definitions */}
            {markersNeeded.length > 0 && (
                <defs>
                    {markersNeeded.map(shape => {
                        const def = MARKER_DEFS[shape];
                        return (
                            <marker
                                key={shape}
                                id={markerIdFor(id, shape)}
                                viewBox={def.viewBox}
                                refX={def.refX}
                                refY={def.refY}
                                markerWidth={def.width}
                                markerHeight={def.height}
                                orient="auto"
                            >
                                <path
                                    d={def.path}
                                    className={`${def.className} ${selectedClass}`}
                                />
                            </marker>
                        );
                    })}
                </defs>
            )}

            {/* Invisible hit-test path (wider) */}
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
                className={`v3-edge ${markerConfig.cssClass} ${selectedClass}`}
                strokeDasharray={markerConfig.dashArray}
                markerStart={startMarkerRef}
                markerEnd={endMarkerRef}
            />

            {/* Segment drag handles (when selected) */}
            {selected && !isSelfLoop && (
                <SegmentHandles
                    path={adjustedPath}
                    edgeId={id}
                    selected={!!selected}
                />
            )}

            {/* Edge labels */}
            <EdgeLabelRenderer>
                {/* Main label */}
                {(edgeLabel || editing) && edgeKind !== 'inheritance' && (
                    <div
                        className={`v3-edge-label ${selectedClass}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
                            pointerEvents: 'all',
                        }}
                    >
                        {editing ? (
                            <input
                                className="v3-edge-label__input"
                                value={labelText}
                                onChange={e => setLabelText(e.target.value)}
                                onBlur={commitLabel}
                                onKeyDown={onKeyDown}
                                autoFocus
                                onMouseDown={e => e.stopPropagation()}
                            />
                        ) : (
                            <span
                                className="v3-edge-label__text"
                                onDoubleClick={() => setEditing(true)}
                            >
                                {edgeLabel}
                            </span>
                        )}
                    </div>
                )}

                {/* Target cardinality */}
                {targetCardinality && (
                    <div
                        className="v3-edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${cardinalityPos.x}px, ${cardinalityPos.y - 14}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {targetCardinality}
                    </div>
                )}

                {/* Source cardinality */}
                {sourceCardinality && (
                    <div
                        className="v3-edge-cardinality"
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${sourceX}px, ${sourceY - 14}px)`,
                            pointerEvents: 'none',
                        }}
                    >
                        {sourceCardinality}
                    </div>
                )}
            </EdgeLabelRenderer>
        </>
    );
}

export const UnifiedEdge = memo(UnifiedEdgeComponent);

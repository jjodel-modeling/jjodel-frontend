/**
 * The ghost edge of the M2 preview (P-2026-10-25-1005): draws the orthogonal route computed by
 * `routeGhostEdge` (`data.points`), dashed, with the hollow triangle of a generalization at the
 * target. The handle coordinates React Flow passes are not used: the route ends on the facing sides.
 */
import React from 'react';
import { BaseEdge, type EdgeProps } from '@xyflow/react';
import { routePath, type RoutePoint } from './previewRoute';

export interface PreviewEdgeData extends Record<string, unknown> {
    points: RoutePoint[];
    generalization?: boolean;
}

export function PreviewEdge({ id, data, label }: EdgeProps): React.ReactElement | null {
    const { points, generalization } = (data ?? {}) as Partial<PreviewEdgeData>;
    if (!points || points.length < 2) return null;
    const { d, labelX, labelY } = routePath(points);
    const markerId = `jj-preview-triangle-${id.replace(/[^A-Za-z0-9_-]/g, '_')}`;
    return (
        <>
            {generalization && (
                <defs>
                    <marker id={markerId} viewBox="0 0 12 10" refX="12" refY="5" markerWidth="12" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto">
                        <path d="M 0 0 L 12 5 L 0 10 Z" className="jj-preview-edge-marker" />
                    </marker>
                </defs>
            )}
            <BaseEdge
                id={id}
                path={d}
                label={label}
                labelX={labelX}
                labelY={labelY}
                markerEnd={generalization ? `url(#${markerId})` : undefined}
            />
        </>
    );
}

export default PreviewEdge;

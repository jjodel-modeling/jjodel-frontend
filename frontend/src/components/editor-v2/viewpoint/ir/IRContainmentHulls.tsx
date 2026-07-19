/**
 * IRContainmentHulls — visual containment layer for IR graphVertex views (Fase 2b).
 *
 * For each expanded container, draws a hull (rounded box) around the container
 * node and its visible children in flow coordinates via ViewportPortal, with a
 * header carrying the container name and the collapse toggle. Children keep
 * absolute coordinates (containment-by-hull; see irContainment.ts).
 * Collapsed containers draw no hull; their node shows the expand chip inline
 * (ObjectNode) and the subtree is hidden by the decoration pass.
 */

import { ViewportPortal, type Node } from '@xyflow/react';
import type { ContainmentModel } from './irContainment';
import { isCollapsed, toggleCollapsed, useCollapseVersion } from './irCollapseState';
import { syncIRCollapsedToJjom } from '../../sync/canvasToJjom';
import { useLayoutAutosave } from '../../hooks/useLayoutAutosave';

const HULL_PADDING = 24;
const HULL_HEADER = 22;

export interface IRContainmentHullsProps {
    nodes: Node[];
    model: ContainmentModel;
    /** container objectId → display name */
    names: Map<string, string>;
}

interface HullRect { objectId: string; vertexId: string; x: number; y: number; w: number; h: number; name: string; collapsible: boolean; }

function IRContainmentHulls({ nodes, model, names }: IRContainmentHullsProps) {
    useCollapseVersion(); // re-render on toggle
    // Debounced project save after a persisted collapse toggle (discovery 2026-07-19)
    const { scheduleLayoutSave } = useLayoutAutosave();

    if (model.containers.size === 0) return null;

    const byId = new Map<string, Node>();
    for (const n of nodes) byId.set(n.id, n);

    const hulls: HullRect[] = [];
    for (const [objectId, info] of model.containers) {
        const containerNode = byId.get(info.vertexId);
        if (!containerNode || containerNode.hidden) continue;
        // Collapsed containers draw no hull
        // (their children are hidden by the decoration pass anyway).
        const children = (model.childrenOf.get(objectId) ?? [])
            .map(c => model.vertexByObj.get(c))
            .filter((v): v is string => !!v)
            .map(v => byId.get(v))
            .filter((n): n is Node => !!n && !n.hidden);
        if (children.length === 0) continue;
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const n of [containerNode, ...children]) {
            const w = n.measured?.width ?? n.width ?? 160;
            const h = n.measured?.height ?? n.height ?? 60;
            minX = Math.min(minX, n.position.x);
            minY = Math.min(minY, n.position.y);
            maxX = Math.max(maxX, n.position.x + (w as number));
            maxY = Math.max(maxY, n.position.y + (h as number));
        }
        hulls.push({
            objectId,
            vertexId: info.vertexId,
            x: minX - HULL_PADDING,
            y: minY - HULL_PADDING - HULL_HEADER,
            w: maxX - minX + 2 * HULL_PADDING,
            h: maxY - minY + 2 * HULL_PADDING + HULL_HEADER,
            name: names.get(objectId) ?? '',
            collapsible: info.collapsible,
        });
    }
    if (hulls.length === 0) return null;

    return (
        <ViewportPortal>
            {hulls.map(hull => (
                <div
                    key={`irhull_${hull.objectId}`}
                    className="ir-hull"
                    style={{
                        position: 'absolute',
                        transform: `translate(${hull.x}px, ${hull.y}px)`,
                        width: hull.w,
                        height: hull.h,
                        pointerEvents: 'none',
                        zIndex: -1,
                    }}
                >
                    <div className="ir-hull__header" style={{ pointerEvents: 'all', height: HULL_HEADER }}>
                        <span className="ir-hull__name">{hull.name}</span>
                        {hull.collapsible && (
                            <button
                                type="button"
                                className="ir-hull__toggle"
                                title="Collapse"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCollapsed(hull.objectId);
                                    // Persist the new collapse state on the container's DVertex
                                    // (session store stays the runtime source; discovery 2026-07-19).
                                    syncIRCollapsedToJjom(hull.vertexId, isCollapsed(hull.objectId));
                                    scheduleLayoutSave();
                                }}
                            >
                                <i className="bi bi-chevron-contract" />
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </ViewportPortal>
    );
}

export default IRContainmentHulls;

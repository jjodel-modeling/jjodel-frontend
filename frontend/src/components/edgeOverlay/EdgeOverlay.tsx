import React from 'react';
import { useSelector } from 'react-redux';

import { roundManhattanPath } from '../editor-v2/utils/edgeUtils';
import './EdgeOverlay.scss';

/**
 * L2 — Static SVG overlay rendering edges in the classic editor.
 *
 * For each DObject whose applicable DViewElement has `isEdge === true`,
 * renders a straight SVG line from the resolved `edgeSource` to
 * `edgeTarget` endpoints. Endpoints are resolved by `evalEdgeExpression`
 * (registered on `windoww.evalEdgeExpression`).
 *
 * SCOPE OF FASE 3a (intentional limitations):
 *   - Lines only. No arrowhead, no bending, no offset, no head/tail size.
 *   - The original DVertex card stays visible above the canvas.
 *   - No drag-aware live update: lines update only on Redux state change.
 *
 * MOUNT POINT (current):
 *   ModelTab.tsx mounts this as a sibling of `<DefaultNode>` inside
 *   `.GraphContainer`. The actual `.panning-content` lives inside the
 *   compiled jsxString of `DefaultView.model()` and is not directly
 *   reachable from React JSX without registering the component in
 *   `windoww.Components`. To fit the 3-file scope, this overlay sits
 *   one level above and replicates pan/zoom via SVG `<g transform>`
 *   reading from `LGraph.offset` + `LGraph.zoom` (Redux).
 */
interface EdgeOverlayProps {
    /** Pointer of the DGraph being rendered in the classic editor. */
    graphid: string;
}

type EdgeRender = {
    id: string;
    d: string;
};

export function EdgeOverlay({ graphid }: EdgeOverlayProps): React.ReactElement | null {
    // Subscribe to the full state. `useSelector` re-runs the body whenever
    // anything relevant changes (with shallow-equal default it would skip
    // re-renders if the returned object is stable, but here we return a
    // plain object built fresh, so re-render fires on every state change).
    // Acceptable for MVP — Fase 3b can scope this down.
    const snapshot = useSelector((state: any) => state);


       if (!snapshot || !snapshot.idlookup) {
        console.log('[EdgeOverlay] EXIT 1: no snapshot.idlookup');
        return null;
    }

    // Resolve the LGraph (for offset + zoom + node lookup).
    const w: any = window;
    const LPointerTargetable = w.LPointerTargetable;
    const LGraphElement = w.LGraphElement;
    const evalFn = w.evalEdgeExpression;
if (!LPointerTargetable || !evalFn) {
        console.log('[EdgeOverlay] EXIT 2: missing globals', { LPointerTargetable: !!LPointerTargetable, evalFn: !!evalFn, LGraphElement: !!LGraphElement });
        return null;
    }

const lGraph: any = safeFromPointer(LPointerTargetable, graphid);
    if (!lGraph) {
        console.log('[EdgeOverlay] EXIT 3: lGraph not resolvable for', graphid);
        return null;
    }

    // Collect DViewElement with isEdge=true. Iterating idlookup once.
    const edgeViews: any[] = [];
    for (const k in snapshot.idlookup) {
        const e = snapshot.idlookup[k];
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DViewElement') continue;
        if (e.isEdge !== true) continue;
        if (typeof e.edgeSource !== 'string' || !e.edgeSource) continue;
        if (typeof e.edgeTarget !== 'string' || !e.edgeTarget) continue;
        edgeViews.push(e);
    }
if (edgeViews.length === 0) {
        // Debug: count DViewElements seen and how many had isEdge truthy
        let total = 0, withIsEdge = 0;
        for (const k in snapshot.idlookup) {
            const e = snapshot.idlookup[k];
            if (!e || typeof e !== 'object' || e.className !== 'DViewElement') continue;
            total++;
            if (e.isEdge === true) withIsEdge++;
        }
        console.log('[EdgeOverlay] EXIT 4: no edgeViews', { totalDV: total, withIsEdge });
        return null;
    }

    // For each DObject in the project, find matching edge view and resolve endpoints.
    const edges: EdgeRender[] = [];
    for (const k in snapshot.idlookup) {
        const obj = snapshot.idlookup[k];
        if (!obj || typeof obj !== 'object') continue;
        if (obj.className !== 'DObject') continue;

        const lObj: any = safeFromPointer(LPointerTargetable, obj.id);
        if (!lObj) continue;

        const view = findApplicableEdgeView(lObj, edgeViews);
        if (!view) continue;

        const sourceL: any = safeEval(evalFn, lObj, view.edgeSource);
        const targetL: any = safeEval(evalFn, lObj, view.edgeTarget);
        if (!sourceL || !targetL) continue;

        const srcRect = getNodeRect(LGraphElement, LPointerTargetable, sourceL, snapshot);
        const tgtRect = getNodeRect(LGraphElement, LPointerTargetable, targetL, snapshot);
        if (!srcRect || !tgtRect) continue;

        const srcCenter = {
            x: srcRect.x + srcRect.w / 2,
            y: srcRect.y + srcRect.h / 2,
        };
        const tgtCenter = {
            x: tgtRect.x + tgtRect.w / 2,
            y: tgtRect.y + tgtRect.h / 2,
        };
        const a = clipToRect(tgtCenter, srcRect);
        const b = clipToRect(srcCenter, tgtRect);

        // Degenerate: clipped endpoints coincide (overlapping / coincident nodes).
        if (a.x === b.x && a.y === b.y) continue;

        let rawPath: string;
        if (a.x === b.x || a.y === b.y) {
            // Already axis-aligned: a single straight segment, no Manhattan elbow needed.
            rawPath = `M ${a.x} ${a.y} L ${b.x} ${b.y}`;
        } else {
            // Z-shape with 2 elbows. Orientation chosen by the dominant axis to
            // minimize zig-zag visual weight.
            const dx = b.x - a.x;
            const dy = b.y - a.y;
            let midX1: number, midY1: number, midX2: number, midY2: number;
            if (Math.abs(dx) >= Math.abs(dy)) {
                const midX = (a.x + b.x) / 2;
                midX1 = midX; midY1 = a.y;
                midX2 = midX; midY2 = b.y;
            } else {
                const midY = (a.y + b.y) / 2;
                midX1 = a.x; midY1 = midY;
                midX2 = b.x; midY2 = midY;
            }
            rawPath = `M ${a.x} ${a.y} L ${midX1} ${midY1} L ${midX2} ${midY2} L ${b.x} ${b.y}`;
        }

        const d = roundManhattanPath(rawPath, 8);
        edges.push({ id: obj.id, d });
    }

if (edges.length === 0) {
        console.log('[EdgeOverlay] EXIT 5: no edges resolved', { edgeViewsCount: edgeViews.length });
        return null;
    }

    // Read pan offset + zoom from the LGraph for the SVG transform.
    const offset = readPoint(lGraph, 'offset');
    const zoom = readPoint(lGraph, 'cumulativeZoom') || readPoint(lGraph, 'zoom') || { x: 1, y: 1 };
    const tx = offset ? offset.x : 0;
    const ty = offset ? offset.y : 0;
    const sx = typeof zoom.x === 'number' && zoom.x > 0 ? zoom.x : 1;
    const sy = typeof zoom.y === 'number' && zoom.y > 0 ? zoom.y : 1;

console.log('[EdgeOverlay] RENDER', { edgesCount: edges.length, tx, ty, sx, sy });
    return (
        <svg className="jjodel-edge-overlay" pointerEvents="none">
            <g transform={`translate(${tx}, ${ty}) scale(${sx}, ${sy})`}>
                {edges.map(e => (
                    <path
                        key={e.id}
                        className="jjodel-edge-overlay__path"
                        d={e.d}
                    />
                ))}
            </g>
        </svg>
    );
}

/**
 * Returns the first DViewElement with isEdge=true that applies to the
 * given LObject. Matches by `appliableTo === <classifier name>` first,
 * then falls back to `appliableToClasses` containing the classifier id
 * or name. First-match-wins.
 */


function findApplicableEdgeView(lObj: any, edgeViews: any[]): any | undefined {
    const cls = lObj && lObj.instanceof;
    const clsId: string | undefined = cls && cls.id;
    const clsName: string | undefined = cls && cls.name;
    if (!clsId && !clsName) return undefined;

    for (const view of edgeViews) {
        if (clsName && view.appliableTo === clsName) return view;
        if (Array.isArray(view.appliableToClasses)) {
            for (const c of view.appliableToClasses) {
                if (typeof c === 'string') {
                    // 'DObject' acts as wildcard (custom DV with literal pseudo-class)
                    if (c === 'DObject') return view;
                    if (c === clsId || c === clsName) return view;
                } else if (c && (c.id === clsId || c.name === clsName)) {
                    return view;
                }
            }
        }
    }
    return undefined;
}

/**
 * Resolves the rectangle (x, y, w, h) of the node visualizing an LObject.
 * Path 1: convert LObject → LGraphElement via `LGraphElement.getNodeId(lObj)`
 * then read `.x .y .width .height` from the L-layer (reactive).
 * Path 2 (fallback): read `--left` / `--top` and `offsetWidth/Height` from
 * the DOM element with `data-nodeid="<nodeid>"`.
 */
function getNodeRect(
    LGraphElement: any,
    LPointerTargetable: any,
    lObj: any,
    snapshot: any
): { x: number; y: number; w: number; h: number } | null {
    if (!LGraphElement || !lObj) return null;

    let nodeId: string | undefined;
    try {
        nodeId = LGraphElement.getNodeId(lObj);
    } catch {
        nodeId = undefined;
    }
    if (!nodeId) return null;

    // Path 1: L-layer access (reactive).
    let lNode: any = null;
    try {
        lNode = LPointerTargetable.fromPointer(nodeId);
    } catch {
        lNode = null;
    }
    if (lNode) {
        const x = numOrNaN(lNode.x);
        const y = numOrNaN(lNode.y);
        const w = numOrNaN(lNode.width);
        const h = numOrNaN(lNode.height);
        if (!isNaN(x) && !isNaN(y)) {
            return {
                x,
                y,
                w: !isNaN(w) && w > 0 ? w : 100,
                h: !isNaN(h) && h > 0 ? h : 50,
            };
        }
    }

    // Path 2: DOM fallback.
    const el = document.querySelector(`[data-nodeid="${cssEscape(nodeId)}"]`) as HTMLElement | null;
    if (!el) return null;
    const cs = getComputedStyle(el);
    const left = parseFloat(cs.getPropertyValue('--left')) || 0;
    const top = parseFloat(cs.getPropertyValue('--top')) || 0;
    return {
        x: left,
        y: top,
        w: el.offsetWidth || 100,
        h: el.offsetHeight || 50,
    };
}

/**
 * Returns the intersection of the segment from `rect`'s center toward `point`
 * with `rect`'s axis-aligned border. Used to anchor the edge path on the node
 * boundary rather than the center.
 *
 * Algorithm: find the smallest positive scalar t such that
 * `center + t * (point - center)` lies on the rect's border. For an
 * axis-aligned rect this reduces to t = min(hw/|dx|, hh/|dy|) where hw, hh
 * are half-extents.
 */
function clipToRect(
    point: { x: number; y: number },
    rect: { x: number; y: number; w: number; h: number },
): { x: number; y: number } {
    const cx = rect.x + rect.w / 2;
    const cy = rect.y + rect.h / 2;
    const dx = point.x - cx;
    const dy = point.y - cy;
    if (dx === 0 && dy === 0) return { x: cx, y: cy };
    const hw = rect.w / 2;
    const hh = rect.h / 2;
    const tx = dx === 0 ? Infinity : hw / Math.abs(dx);
    const ty = dy === 0 ? Infinity : hh / Math.abs(dy);
    const t = Math.min(tx, ty);
    return { x: cx + t * dx, y: cy + t * dy };
}

function safeFromPointer(LPointerTargetable: any, id: string): any | null {
    if (!id || !LPointerTargetable || typeof LPointerTargetable.fromPointer !== 'function') return null;
    try {
        return LPointerTargetable.fromPointer(id);
    } catch {
        return null;
    }
}

function safeEval(fn: any, data: any, expr: string): any | null {
    try {
        return fn(data, expr);
    } catch {
        return null;
    }
}

function readPoint(lObj: any, prop: string): { x: number; y: number } | null {
    try {
        const p = lObj[prop];
        if (p && typeof p.x === 'number' && typeof p.y === 'number') {
            return { x: p.x, y: p.y };
        }
    } catch {
        // ignore
    }
    return null;
}

function numOrNaN(v: any): number {
    return typeof v === 'number' ? v : NaN;
}

function cssEscape(s: string): string {
    // Minimal escape sufficient for Jjodel pointer ids (alphanumerics + "_").
    return s.replace(/(["\\])/g, '\\$1');
}

export default EdgeOverlay;

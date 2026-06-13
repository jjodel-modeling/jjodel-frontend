import React from 'react';
import { useSelector } from 'react-redux';

import { GraphPoint, GraphSize } from '../../joiner';
import { chooseManhattanSidesAndWaypoints } from '../../edges/routing/classic/points';
import { roundManhattanCorners } from '../../edges/routing/classic/round';
import './EdgeOverlay.scss';

/**
 * L2 — Static SVG overlay rendering edges in the classic editor.
 *
 * For each DObject whose applicable DViewElement has `isEdge === true`,
 * renders an SVG path from the resolved `edgeSource` to `edgeTarget`
 * endpoints with side-aware Manhattan routing. Endpoints are resolved
 * by `evalEdgeExpression` (registered on `windoww.evalEdgeExpression`).
 *
 * MEMOIZATION (2026-05-05):
 *   1. The Redux subscription uses a custom equality comparator
 *      (`selectorResultEqual`) so the component skips re-renders when
 *      neither the four transform numbers nor any per-edge rect
 *      changed. Irrelevant dispatches (typing in inputs, focus changes,
 *      etc.) become no-ops at the selector layer.
 *   2. Each edge is rendered through `EdgeRenderItem` — a `React.memo`'d
 *      child whose only props are the two endpoint rects. During canvas
 *      pan, the rects in canvas space don't change (only the parent
 *      `<g transform>` shifts), so every child memo-hits and the
 *      routing pipeline (chooseManhattanSidesAndWaypoints + clipToRect +
 *      roundManhattanCorners) stays cached. During node drag, only edges whose endpoints moved
 *      invalidate; siblings stay cached.
 *
 *   This keeps SVG `<g transform>` as the single point that updates
 *   during pan — a transform handled by the browser compositor — while
 *   the path `d` strings, computed in canvas space, are reused.
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

type NodeRect = { x: number; y: number; w: number; h: number };

type EdgeRouting = 'straight' | 'manhattan-rounded' | 'bezier';

type EdgeStrokeStyle = 'solid' | 'dashed' | 'dotted';

type EdgeData = {
    id: string;
    srcRect: NodeRect;
    tgtRect: NodeRect;
    routing: EdgeRouting;
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: EdgeStrokeStyle;
    labelText: string;
};

// L2 — V1 edge customization. Stored on DViewElement.edgeStrokeColor as a token id (string);
// the selector resolves it to a CSS `var(--...)` reference applied inline on the <path>'s
// `stroke` attribute. Adding/removing entries here is a contract change with the Style tab UI.
const STROKE_COLOR_TOKEN_TO_VAR: Record<string, string> = {
    default: 'var(--color-edge-overlay-default)',
    accent:  'var(--color-canvas-accent)',
    success: 'var(--color-success)',
    warning: 'var(--color-warning)',
    danger:  'var(--color-error)',
    muted:   'var(--color-text-tertiary)',
};

function resolveStrokeColorVar(token: string | undefined): string {
    if (typeof token !== 'string' || !(token in STROKE_COLOR_TOKEN_TO_VAR)) {
        return STROKE_COLOR_TOKEN_TO_VAR.default;
    }
    return STROKE_COLOR_TOKEN_TO_VAR[token];
}

function resolveStrokeDasharray(style: EdgeStrokeStyle): string | undefined {
    if (style === 'dashed') return '6 4';
    if (style === 'dotted') return '2 3';
    return undefined; // solid: omit the attribute entirely
}

function clampStrokeWidth(w: unknown): number {
    if (typeof w !== 'number' || !isFinite(w)) return 1.5;
    return Math.max(0.5, Math.min(10, w));
}

type ExitCode =
    | 'no-snapshot'
    | 'no-globals'
    | 'no-graph'
    | 'no-edge-views'
    | 'no-edges-resolved';

type SelectorResult =
    | { kind: 'render'; tx: number; ty: number; sx: number; sy: number; edges: EdgeData[] }
    | { kind: 'exit'; code: ExitCode; data?: any };

export function EdgeOverlay({ graphid }: EdgeOverlayProps): React.ReactElement | null {
    // L1 — granular selector with custom equality. The selector body runs
    // on every dispatch (cheap iteration), but `selectorResultEqual` decides
    // whether to commit and re-render. Pattern matches `useModelStats` +
    // `statsEqual` in StatusBar.tsx.
    const result = useSelector(
        (state: any) => buildSelectorResult(state, graphid),
        selectorResultEqual,
    );

    if (result.kind === 'exit') {
        if (typeof window !== 'undefined' && (window as any).__edgeOverlayDebug) {
            logExit(result.code, result.data, graphid);
        }
        return null;
    }

    const { tx, ty, sx, sy, edges } = result;

    if (typeof window !== 'undefined' && (window as any).__edgeOverlayDebug) {
        console.log('[EdgeOverlay] RENDER', { edgesCount: edges.length, tx, ty, sx, sy });
    }

    return (
        <svg className="jjodel-edge-overlay" pointerEvents="none">
            <g transform={`scale(${sx}, ${sy}) translate(${tx}, ${ty})`}>
                {edges.map(e => (
                    <EdgeRenderItem
                        key={e.id}
                        id={e.id}
                        srcRect={e.srcRect}
                        tgtRect={e.tgtRect}
                        routing={e.routing}
                        strokeColor={e.strokeColor}
                        strokeWidth={e.strokeWidth}
                        strokeStyle={e.strokeStyle}
                        labelText={e.labelText}
                    />
                ))}
            </g>
        </svg>
    );
}

/**
 * Selector body — runs on every Redux dispatch. Reading via window globals
 * (`LPointerTargetable`, `evalEdgeExpression`) matches the existing pattern
 * used by `useModelStats` in StatusBar.tsx; these resolve through the same
 * store the selector is subscribed to.
 */
function buildSelectorResult(state: any, graphid: string): SelectorResult {
    if (!state || !state.idlookup) {
        return { kind: 'exit', code: 'no-snapshot' };
    }

    const w: any = window;
    const LPointerTargetable = w.LPointerTargetable;
    const LGraphElement = w.LGraphElement;
    const evalFn = w.evalEdgeExpression;
    if (!LPointerTargetable || !evalFn) {
        return {
            kind: 'exit',
            code: 'no-globals',
            data: {
                LPointerTargetable: !!LPointerTargetable,
                evalFn: !!evalFn,
                LGraphElement: !!LGraphElement,
            },
        };
    }

    const lGraph: any = safeFromPointer(LPointerTargetable, graphid);
    if (!lGraph) {
        return { kind: 'exit', code: 'no-graph' };
    }

    // Active viewpoint lookup — singleton via LProject (mirror of the existing
    // `w.LPointerTargetable` pattern). Fallback to undefined keeps the filter
    // inert in the degenerate case of LProject not yet on window.
    const LProject = w.LProject;
    const activeVpId: string | undefined =
        (LProject && typeof LProject.getProject === 'function')
            ? LProject.getProject()?.activeViewpoint?.id
            : undefined;

    const edgeViews: any[] = [];
    for (const k in state.idlookup) {
        const e = state.idlookup[k];
        if (!e || typeof e !== 'object') continue;
        if (e.className !== 'DViewElement') continue;
        if (e.isEdge !== true) continue;
        if (typeof e.edgeSource !== 'string' || !e.edgeSource) continue;
        if (typeof e.edgeTarget !== 'string' || !e.edgeTarget) continue;
        // Viewpoint filter — only views belonging to the model's active viewpoint
        // are eligible. Skipped silently when activeVpId is not resolvable, to avoid
        // turning the overlay completely off in degenerate boot states.
        if (typeof activeVpId === 'string' && activeVpId !== ''
            && e.viewpoint !== activeVpId) continue;
        edgeViews.push(e);
    }
    if (edgeViews.length === 0) {
        let total = 0;
        let withIsEdge = 0;
        for (const k in state.idlookup) {
            const e = state.idlookup[k];
            if (!e || typeof e !== 'object' || e.className !== 'DViewElement') continue;
            total++;
            if (e.isEdge === true) withIsEdge++;
        }
        return { kind: 'exit', code: 'no-edge-views', data: { totalDV: total, withIsEdge, activeVpId } };
    }

    const edges: EdgeData[] = [];
    for (const k in state.idlookup) {
        const obj = state.idlookup[k];
        if (!obj || typeof obj !== 'object') continue;
        if (obj.className !== 'DObject') continue;

        const lObj: any = safeFromPointer(LPointerTargetable, obj.id);
        if (!lObj) continue;

        const view = findApplicableEdgeView(lObj, edgeViews);
        if (!view) continue;

        const sourceL: any = safeEval(evalFn, lObj, view.edgeSource);
        const targetL: any = safeEval(evalFn, lObj, view.edgeTarget);
        if (!sourceL || !targetL) continue;

        const srcRect = getNodeRect(LGraphElement, LPointerTargetable, sourceL, state);
        const tgtRect = getNodeRect(LGraphElement, LPointerTargetable, targetL, state);
        if (!srcRect || !tgtRect) continue;

        // Defensive narrowing — pre-2.215 instances or hand-edited DV may have missing/invalid value.
        const routing: EdgeRouting = (view.edgeRouting === 'straight' || view.edgeRouting === 'bezier')
            ? view.edgeRouting
            : 'manhattan-rounded';

        // V1 edge customization — pull stroke + label fields with narrowing for pre-V1 instances.
        const strokeColor = (typeof view.edgeStrokeColor === 'string' && view.edgeStrokeColor) || 'default';
        const strokeWidth = clampStrokeWidth(view.edgeStrokeWidth);
        const strokeStyle: EdgeStrokeStyle =
            (view.edgeStrokeStyle === 'dashed' || view.edgeStrokeStyle === 'dotted')
                ? view.edgeStrokeStyle
                : 'solid';

        let labelText = '';
        const labelExpr = (typeof view.edgeLabel === 'string' && view.edgeLabel) || '';
        if (labelExpr) {
            const evalResult = safeEval(evalFn, lObj, labelExpr);
            labelText = evalResult == null ? '' : String(evalResult);
        }

        edges.push({ id: obj.id, srcRect, tgtRect, routing, strokeColor, strokeWidth, strokeStyle, labelText });
    }

    if (edges.length === 0) {
        return {
            kind: 'exit',
            code: 'no-edges-resolved',
            data: { edgeViewsCount: edgeViews.length },
        };
    }

    const offset = readPoint(lGraph, 'offset');
    const zoom = readPoint(lGraph, 'cumulativeZoom') || readPoint(lGraph, 'zoom') || { x: 1, y: 1 };
    const tx = offset ? offset.x : 0;
    const ty = offset ? offset.y : 0;
    const sx = typeof zoom.x === 'number' && zoom.x > 0 ? zoom.x : 1;
    const sy = typeof zoom.y === 'number' && zoom.y > 0 ? zoom.y : 1;

    return { kind: 'render', tx, ty, sx, sy, edges };
}

/**
 * Custom equality for the selector result. Skips re-renders when neither
 * the transform nor any per-edge rect changed. Compares positionally —
 * the prep loop emits edges in `idlookup` iteration order, which is stable
 * within a session unless objects are added/removed.
 */
function selectorResultEqual(a: SelectorResult, b: SelectorResult): boolean {
    if (a === b) return true;
    if (a.kind !== b.kind) return false;
    if (a.kind === 'exit' && b.kind === 'exit') {
        return a.code === b.code;
    }
    if (a.kind === 'render' && b.kind === 'render') {
        if (a.tx !== b.tx || a.ty !== b.ty || a.sx !== b.sx || a.sy !== b.sy) return false;
        if (a.edges.length !== b.edges.length) return false;
        for (let i = 0; i < a.edges.length; i++) {
            const e1 = a.edges[i];
            const e2 = b.edges[i];
            if (e1.id !== e2.id) return false;
            if (e1.routing !== e2.routing) return false;
            if (e1.strokeColor !== e2.strokeColor) return false;
            if (e1.strokeWidth !== e2.strokeWidth) return false;
            if (e1.strokeStyle !== e2.strokeStyle) return false;
            if (e1.labelText !== e2.labelText) return false;
            if (!rectEqual(e1.srcRect, e2.srcRect)) return false;
            if (!rectEqual(e1.tgtRect, e2.tgtRect)) return false;
        }
        return true;
    }
    return false;
}

function rectEqual(a: NodeRect, b: NodeRect): boolean {
    return a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h;
}

function logExit(code: ExitCode, data: any, graphid: string): void {
    switch (code) {
        case 'no-snapshot':
            console.log('[EdgeOverlay] EXIT 1: no snapshot.idlookup');
            break;
        case 'no-globals':
            console.log('[EdgeOverlay] EXIT 2: missing globals', data);
            break;
        case 'no-graph':
            console.log('[EdgeOverlay] EXIT 3: lGraph not resolvable for', graphid);
            break;
        case 'no-edge-views':
            console.log('[EdgeOverlay] EXIT 4: no edgeViews', data);
            break;
        case 'no-edges-resolved':
            console.log('[EdgeOverlay] EXIT 5: no edges resolved', data);
            break;
    }
}

interface EdgeRenderItemProps {
    id: string;
    srcRect: NodeRect;
    tgtRect: NodeRect;
    routing: EdgeRouting;
    strokeColor: string;
    strokeWidth: number;
    strokeStyle: EdgeStrokeStyle;
    labelText: string;
}

/**
 * L2 — per-edge memoized renderer. Path is computed inline; React.memo with
 * `edgePropsEqual` skips re-render when the rect+routing+stroke+label inputs
 * are unchanged across renders (e.g., during canvas pan, where positions in
 * canvas space don't change — only the parent `<g transform>`).
 *
 * Routing modes:
 *   - 'manhattan-rounded' (default): chooseManhattanSidesAndWaypoints (shared classic router) +
 *     clipToRect (border clip) + roundManhattanCorners (shared R=5 fillet)
 *   - 'straight': single line between side midpoints
 *   - 'bezier': cubic Bezier with tangents normal to the chosen exit/entry sides
 *
 * V1 stroke / label customization (added 2026-05-09):
 *   - stroke is applied inline (`stroke=`, `stroke-width=`, `stroke-dasharray=`)
 *     so per-view changes don't require a CSS recompile.
 *   - label is a sibling `<text>` at the bbox midpoint with paint-order halo.
 */
const EdgeRenderItem = React.memo(function EdgeRenderItem({
    srcRect,
    tgtRect,
    routing,
    strokeColor,
    strokeWidth,
    strokeStyle,
    labelText,
}: EdgeRenderItemProps): React.ReactElement | null {
    const srcBbox: Bbox = {
        cx: srcRect.x + srcRect.w / 2,
        cy: srcRect.y + srcRect.h / 2,
        hw: srcRect.w / 2,
        hh: srcRect.h / 2,
    };
    const tgtBbox: Bbox = {
        cx: tgtRect.x + tgtRect.w / 2,
        cy: tgtRect.y + tgtRect.h / 2,
        hw: tgtRect.w / 2,
        hh: tgtRect.h / 2,
    };
    const sides = chooseSides(srcBbox, tgtBbox);
    const srcPoint = sideMidpoint(srcBbox, sides.srcSide);
    const tgtPoint = sideMidpoint(tgtBbox, sides.tgtSide);

    if (srcPoint.x === tgtPoint.x && srcPoint.y === tgtPoint.y) return null;

    let d: string;
    if (routing === 'straight') {
        d = `M ${srcPoint.x} ${srcPoint.y} L ${tgtPoint.x} ${tgtPoint.y}`;
    } else if (routing === 'bezier') {
        d = bezierPath(srcPoint, sides.srcSide, tgtPoint, sides.tgtSide);
    } else {
        // Manhattan — share the native classic-edge geometry: perpendicular stub exits + the same
        // corner waypoints (chooseManhattanSidesAndWaypoints, pure) and the same R=5 quadratic fillet
        // (roundManhattanCorners, extracted from GraphDataElements). isEdge views have no anchors, so
        // we attach at the rect centers; the classic router returns stub points OUTSIDE both boxes
        // ([sStub, ...bends, tStub]). The native pipeline cuts the first/last leg to the node borders
        // via snapSegmentsToBorders (needs an LViewElement, unavailable for an overlay arc), so we
        // clip those two legs here with clipToRect (axis-aligned center->stub ray = the border point).
        const aSrc = new GraphPoint(srcBbox.cx, srcBbox.cy);
        const aTgt = new GraphPoint(tgtBbox.cx, tgtBbox.cy);
        const sizeSrc = new GraphSize(srcRect.x, srcRect.y, srcRect.w, srcRect.h);
        const sizeTgt = new GraphSize(tgtRect.x, tgtRect.y, tgtRect.w, tgtRect.h);
        const waypoints = chooseManhattanSidesAndWaypoints(aSrc, sizeSrc, aTgt, sizeTgt);
        if (!waypoints.length) return null;
        const srcBorder = clipToRect(waypoints[0], srcRect);
        const tgtBorder = clipToRect(waypoints[waypoints.length - 1], tgtRect);
        const pts: { x: number; y: number }[] = [srcBorder, ...waypoints, tgtBorder];
        const rawPath = 'M ' + pts.map(p => `${p.x} ${p.y}`).join(' L ');
        d = roundManhattanCorners(rawPath);
    }

    const strokeColorCss = resolveStrokeColorVar(strokeColor);
    const dasharray = resolveStrokeDasharray(strokeStyle);
    const midX = (srcPoint.x + tgtPoint.x) / 2;
    const midY = (srcPoint.y + tgtPoint.y) / 2;

    return (
        <g>
            <path
                className="jjodel-edge-overlay__path"
                d={d}
                stroke={strokeColorCss}
                strokeWidth={strokeWidth}
                {...(dasharray ? { strokeDasharray: dasharray } : {})}
            />
            {labelText && (
                <text
                    className="jjodel-edge-overlay__label"
                    x={midX}
                    y={midY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                >
                    {labelText}
                </text>
            )}
        </g>
    );
}, edgePropsEqual);

function edgePropsEqual(prev: EdgeRenderItemProps, next: EdgeRenderItemProps): boolean {
    return prev.id === next.id
        && prev.routing === next.routing
        && prev.strokeColor === next.strokeColor
        && prev.strokeWidth === next.strokeWidth
        && prev.strokeStyle === next.strokeStyle
        && prev.labelText === next.labelText
        && rectEqual(prev.srcRect, next.srcRect)
        && rectEqual(prev.tgtRect, next.tgtRect);
}

/**
 * Cubic Bezier path with tangents aligned to the chosen exit/entry sides.
 * Tangent length scales with endpoint distance (factor 0.4) — keeps the curve
 * proportionate to the gap regardless of zoom or node size.
 *
 *   srcSide='right' → cp1 sits to the right of src by `len`
 *   tgtSide='top'   → cp2 sits above tgt by `len`
 *
 * Output: `M sx sy C cp1x cp1y, cp2x cp2y, tx ty` — single cubic segment.
 */
function bezierPath(
    src: { x: number; y: number },
    srcSide: Side,
    tgt: { x: number; y: number },
    tgtSide: Side,
): string {
    const dx = tgt.x - src.x;
    const dy = tgt.y - src.y;
    const len = Math.hypot(dx, dy) * 0.4;
    const offset = (s: Side, p: { x: number; y: number }) => {
        switch (s) {
            case 'top':    return { x: p.x,       y: p.y - len };
            case 'bottom': return { x: p.x,       y: p.y + len };
            case 'left':   return { x: p.x - len, y: p.y       };
            case 'right':  return { x: p.x + len, y: p.y       };
        }
    };
    const cp1 = offset(srcSide, src);
    const cp2 = offset(tgtSide, tgt);
    return `M ${src.x} ${src.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${tgt.x} ${tgt.y}`;
}

/**
 * Returns the first DViewElement with isEdge=true that applies to the
 * given LObject, using two-pass priority:
 *
 *   Pass 1 — classifier-specific match wins:
 *     - `view.appliableTo === clsName` (legacy branch, kept intact)
 *     - `appliableToClasses` contains classifier id, classifier name, or an
 *       object-like {id, name} match. `'DObject'` is SKIPPED here.
 *   Pass 2 — wildcard fallback:
 *     - `appliableToClasses` contains the literal `'DObject'`.
 *
 * Rationale: a custom DV bound to a specific classifier (e.g. via the B.1
 * picker UI) must win over an auto-create DV with `['DObject']` (default
 * written by `lastViewpoint.ts`), regardless of iteration order. Single-pass
 * first-match-wins gave priority to whichever was iterated first — a latent
 * bug exposed once B.1 made it possible to bind specific classifiers.
 */
function findApplicableEdgeView(lObj: any, edgeViews: any[]): any | undefined {
    const cls = lObj && lObj.instanceof;
    const clsId: string | undefined = cls && cls.id;
    const clsName: string | undefined = cls && cls.name;
    if (!clsId && !clsName) return undefined;

    // Pass 1 — classifier-specific match (id, name, object-like). Skips wildcard.
    for (const view of edgeViews) {
        if (clsName && view.appliableTo === clsName) return view;
        if (Array.isArray(view.appliableToClasses)) {
            for (const c of view.appliableToClasses) {
                if (typeof c === 'string') {
                    if (c === 'DObject') continue; // wildcard handled in Pass 2
                    if (c === clsId || c === clsName) return view;
                } else if (c && (c.id === clsId || c.name === clsName)) {
                    return view;
                }
            }
        }
    }

    // Pass 2 — wildcard fallback ('DObject' matches any DObject instance).
    for (const view of edgeViews) {
        if (!Array.isArray(view.appliableToClasses)) continue;
        for (const c of view.appliableToClasses) {
            if (c === 'DObject') return view;
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
    snapshot: any,
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

type Side = 'top' | 'right' | 'bottom' | 'left';

interface Bbox {
    cx: number;
    cy: number;
    hw: number;
    hh: number;
}

/**
 * Picks the exit side on `src` and entry side on `tgt` based on the dominant
 * gap axis between the two bboxes. Lateral hysteresis (1.05) on the horizontal
 * comparison damps flip-flopping when |dx| ≈ |dy| during drag/resize.
 *
 * The chosen sides always lie on the **same axis** (both horizontal or both
 * vertical) — never perpendicular. Consumed by the straight/bezier branches and
 * the label midpoint (the Manhattan branch routes via the classic router instead).
 */
function chooseSides(src: Bbox, tgt: Bbox): { srcSide: Side; tgtSide: Side } {
    const dx = tgt.cx - src.cx;
    const dy = tgt.cy - src.cy;
    const gapX = Math.abs(dx) - (src.hw + tgt.hw);
    const gapY = Math.abs(dy) - (src.hh + tgt.hh);

    // Hysteresis 1.05 — avoids axis flip on 1px wiggle.
    const horizontal = gapX * 1.05 >= gapY;

    if (horizontal) {
        return {
            srcSide: dx >= 0 ? 'right' : 'left',
            tgtSide: dx >= 0 ? 'left' : 'right',
        };
    }
    return {
        srcSide: dy >= 0 ? 'bottom' : 'top',
        tgtSide: dy >= 0 ? 'top' : 'bottom',
    };
}

/**
 * Midpoint of the chosen side, in absolute (graph) coordinates. The endpoint
 * lands on the side's center — never near the corner — which removes the
 * "graze near the bbox edge" S-curve the previous center-projected
 * `clipToRect` could produce.
 */
function sideMidpoint(b: Bbox, side: Side): { x: number; y: number } {
    switch (side) {
        case 'top':    return { x: b.cx, y: b.cy - b.hh };
        case 'bottom': return { x: b.cx, y: b.cy + b.hh };
        case 'left':   return { x: b.cx - b.hw, y: b.cy };
        case 'right':  return { x: b.cx + b.hw, y: b.cy };
    }
}

// NOTE: buildPathFromSides (the side-midpoint Z/L Manhattan builder) was removed in Phase 2B — the
// Manhattan branch now shares the classic router's chooseManhattanSidesAndWaypoints + roundManhattanCorners.
// chooseSides/sideMidpoint are kept: they still feed the straight/bezier branches and the label midpoint.

/**
 * Returns the intersection of the segment from `rect`'s center toward `point`
 * with `rect`'s axis-aligned border. Used to anchor the edge path on the node
 * boundary rather than the center.
 *
 * Algorithm: find the smallest positive scalar t such that
 * `center + t * (point - center)` lies on the rect's border. For an
 * axis-aligned rect this reduces to t = min(hw/|dx|, hh/|dy|) where hw, hh
 * are half-extents.
 *
 * Used by the Manhattan branch (Phase 2B) to cut the first/last leg of the
 * classic-router polyline (center → stub) to the node border, since the native
 * pipeline's `snapSegmentsToBorders` needs an `LViewElement` unavailable to the
 * overlay. For a center attachment the ray center→stub is axis-aligned, so the
 * returned intersection is exactly the perpendicular border point.
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

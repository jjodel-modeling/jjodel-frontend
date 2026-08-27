import { useState, useCallback, useMemo, useEffect } from 'react';
import {
    EdgeLabelRenderer,
    useReactFlow,
    useInternalNode,
    useEdges,
    getStraightPath,
    getBezierPath,
    Position,
    type EdgeProps,
} from '@xyflow/react';
import type { ReferenceEdgeData, InheritanceEdgeData, CompositionEdgeData, InstanceReferenceEdgeData, ReferenceKind } from '../types';
import { formatCardinality } from '../types';
import { syncEdgeRefProperty } from '../sync/canvasToJjom';
import {
    computeManhattanPath,
    roundManhattanPath,
    computeSelfLoopPath,
    computeSelfLoopCornerPath,
    getNodeRect,
    computeLabelPosition,
    computeCardinalityPosition,
    computeCardinalityAnchor,
    CARD_BOX_GAP,
    parsePathPoints,
    applyWaypoints,
    pointsToPath,
    getSideFromHandle,
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    buildFinalPath,
    avoidNodeRects,
    type Side,
} from '../utils/edgeUtils';
import { MAX_HANDLES_PER_SIDE } from '../utils/portDistribution';
import { applyBundleSpread } from './bundleSpread';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useEdgeHighlightClass } from '../contexts/HighlightContext';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { SegmentHandles } from './SegmentHandles';
import { EndpointHandles } from './EndpointHandles';

// Bundle spread lives in ./bundleSpread (pure, testable). It fans the middle
// corridor of parallel same-pair edges by physical anchor order (see that module).
const LABEL_SPREAD_PX = 18;
const ROLE_LINE_GAP = 10; // px, perpendicular nudge so the role text is off the line
const ROLE_LINE_GAP_PX = 10; // px, perpendicular nudge so the role text is off the line
const ROLE_LINE_GAP_PY = 10; // px, perpendicular nudge so the role text is off the line

// E-route: React Flow's Position enum carries the same four strings as the
// codebase's Side type; the map keeps the conversion explicit instead of casting.
const SIDE_TO_POSITION: Record<Side, Position> = {
    top: Position.Top,
    right: Position.Right,
    bottom: Position.Bottom,
    left: Position.Left,
};

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
        type: edgeType,
    } = props;

    const hlClass = useEdgeHighlightClass(id);

    // ─── Determine edge type ───
    // M1 edges (composition, instanceRef) use different data shapes than M2 edges
    const isM1Edge = edgeType === 'composition' || edgeType === 'instanceRef';
    const edgeData = data as (ReferenceEdgeData & InheritanceEdgeData & CompositionEdgeData & InstanceReferenceEdgeData) | undefined;
    const isInheritance = edgeType === 'inheritance' || (!isM1Edge && !edgeData?.reference);
    const ref = edgeData?.reference;
    const kind: ReferenceKind = isM1Edge
        ? (edgeType === 'composition' ? 'composition' : 'association')
        : (ref?.kind || 'association');
    const waypoints = edgeData?.waypoints || [];
    const autoEdit = edgeData?.autoEdit as boolean | undefined;

    // E0 (spec addendum D1): gated consumption of IR-authored edge style. When
    // data.irEdgeViewId is present the edge is styled by a resolved IR edge view
    // (irEdgeViews.applyEdgeStyle); absent = classic rendering, byte-identical. All
    // ir* fields live on e.data, read via the untyped data bag (same convention as
    // irObjectAsEdge et al.).
    const irData = (data ?? {}) as Record<string, any>;
    const isIREdge = !!irData.irEdgeViewId;
    const irStroke = irData.irStroke as string | undefined;
    const irStrokeWidth = irData.irStrokeWidth as number | undefined;
    const irStrokeDasharray = irData.irStrokeDasharray as string | undefined;
    const irSourceTermination = irData.irSourceTermination as string | undefined;
    const irTargetTermination = irData.irTargetTermination as string | undefined;
    const irLabelAlwaysVisible = !!irData.irLabelAlwaysVisible;
    // Authored label placement (irCompile defaults it to 'auto'). Written by
    // irEdgeViews.applyEdgeStyle since the E0 slice; this is its first consumer —
    // until now the field was a dead write. Read here, applied in labelOffset.
    const irLabelPlacement = irData.irLabelPlacement as 'auto' | 'above' | 'below' | undefined;
    // E-route: authored routing style. Absent / null / 'orthogonal' all render
    // exactly as before — every existing view is byte-identical on screen.
    const irRouting = irData.irRoutingHint as 'orthogonal' | 'straight' | 'curved' | undefined;
    // The label of an IR-authored edge has no write-back path yet. Its text comes from
    // the compiled view (irEdgeViews.applyEdgeStyle re-seeds e.label on every recompute)
    // and commitLabel's syncEdgeRefProperty cannot reach it: a synthetic object-as-edge
    // id (`irobj_<objectId>`) is not a JjOM pointer at all, and on a decorated reference
    // edge it would rename the M2 DReference instead. Until the authored editability flag
    // lands with E-lab the affordance is removed rather than left as a dead write.
    // Classic non-IR edges (including every M2 `reference`, which is never IR-decorated)
    // keep the current behavior.
    const labelEditable = !isIREdge;

    const { setEdges, getNodes } = useReactFlow();
    const notation = useEditorContextSafe()?.notation ?? 'uml';
    const selectEdge = useEditorContextSafe()?.selectEdge;
    const showEdgeLabels = useEditorContextSafe()?.showEdgeLabels ?? false;
    const isERNotation = notation === 'er';
    const isSelfLoop = source === target;

    // E-route: the non-orthogonal styles replace the drawn path only. Self-loops keep
    // their dedicated corner curl — a segment or a bezier from a node to itself would
    // degenerate to a point. Everything downstream of the Manhattan router (waypoints,
    // bundle spread, crossings, segment handles) is bypassed for these edges.
    const isNonOrthogonalIR = isIREdge && !isSelfLoop && (irRouting === 'straight' || irRouting === 'curved');

    // ─── Label state (reference edges only) ───
    const [editing, setEditing] = useState(false);
    const [labelText, setLabelText] = useState(String(label || ref?.name || edgeData?.referenceName || ''));
    const [hovered, setHovered] = useState(false);

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

    // Targeted node subscriptions: this edge re-renders only when ITS endpoints'
    // internals change, not on every node measure/move on the canvas. A broad
    // useNodes() here re-rendered every rendered edge on every updateNodeInternals
    // notification — the per-commit amplification behind the edge-settle trickle
    // (discovery 2026-07-20_trickle_leve_2_3, leva 2).
    const sourceNode = useInternalNode(source);
    const targetNode = useInternalNode(target);
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

    // ─── Compute base path — Manhattan routing ───
    const rawPath = useMemo(
        () => computeManhattanPath(sourceX, sourceY, sourceSide, targetX, targetY, targetSide),
        [sourceX, sourceY, sourceSide, targetX, targetY, targetSide]
    );

    // ─── E-route: non-orthogonal IR geometry (direct / bezier) ───
    // Same endpoints and same handles as the Manhattan path — only the curve between
    // them changes, which is what keeps this out of the anchoring logic. The bezier
    // takes its tangents from the handle sides, so the line still leaves and enters
    // perpendicular to the node border. Both helpers also return the path centre,
    // which is the label anchor: a bezier `d` has no M/L points for the polyline
    // walker in computeLabelPosition, which would otherwise report the canvas origin.
    const irRoutedGeom = useMemo(() => {
        if (!isNonOrthogonalIR) return null;
        const [d, labelX, labelY] = irRouting === 'straight'
            ? getStraightPath({ sourceX, sourceY, targetX, targetY })
            : getBezierPath({
                sourceX, sourceY, sourcePosition: SIDE_TO_POSITION[sourceSide],
                targetX, targetY, targetPosition: SIDE_TO_POSITION[targetSide],
            });
        return { d, labelX, labelY };
    }, [isNonOrthogonalIR, irRouting, sourceX, sourceY, sourceSide, targetX, targetY, targetSide]);

    // ─── Pipeline: parse → apply waypoints → bundle spread → round corners ───
    const rawPoints = useMemo(() => parsePathPoints(rawPath), [rawPath]);
    const adjustedPoints = useMemo(
        () => (waypoints.length > 0 ? applyWaypoints(rawPoints, waypoints) : rawPoints),
        [rawPoints, waypoints]
    );
    const adjustedPath = useMemo(() => pointsToPath(adjustedPoints), [adjustedPoints]);

    // Bundle center: midpoint between the two node centers. A single reference
    // shared by every edge of the pair, so applyBundleSpread orders each edge's
    // corridor by its physical anchor position (mean endpoint) around a common
    // axis. Null until both nodes are measured → applyBundleSpread leaves the
    // corridor at its midpoint that frame.
    const bundleCenter = useMemo(() => {
        if (!sourceNode || !targetNode) return null;
        const sr = getNodeRect(sourceNode);
        const tr = getNodeRect(targetNode);
        return {
            x: (sr.x + sr.width / 2 + tr.x + tr.width / 2) / 2,
            y: (sr.y + sr.height / 2 + tr.y + tr.height / 2) / 2,
        };
    }, [sourceNode, targetNode]);

    // Bundle spread: only applied when the user hasn't customized the routing
    // (waypoints empty) and the edge is not inheritance (which uses tree layout).
    // For self-loop / L-shape / U-detour, applyBundleSpread returns input unchanged.
    const spreadPoints = useMemo(() => {
        if (isInheritance || isSelfLoop || waypoints.length > 0) return adjustedPoints;
        return applyBundleSpread(adjustedPoints, bundleCenter);
    }, [adjustedPoints, bundleCenter, isInheritance, isSelfLoop, waypoints]);
    // Anti-collisione (Fase B del punto 1, 2026-08-25): il router resta intatto e
    // questo passaggio guarda la polilinea gia' pronta — dopo i waypoint e dopo lo
    // spread, cioe' dove il criterio si misura davvero — e la ri-instrada solo se
    // attraversa un corpo. Se non c'e' niente da fare torna lo stesso riferimento,
    // quindi un caso sano resta byte-identico e le memo a valle non si invalidano.
    //
    // I rect sono gia' in mano al componente: `getNodes()` e' la stessa lettura
    // imperativa (locale al tab, senza sottoscrizione nuova) che serve gli incroci
    // fra archi qui sotto — nessun lettore nuovo del root state (R-LAY-19).
    //
    // Fuori perimetro per costruzione: self-loop, archi IR non ortogonali
    // (R-B9/R-B12) e archi con waypoint dell'utente, che vincono sempre
    // sull'evitamento (R-B10). Limite noto: il ricalcolo scatta sugli stessi
    // trigger degli incroci, quindi un nodo SENZA archi trascinato nel corridoio
    // aggiorna il tracciato al primo ricalcolo utile, non a ogni frame.
    const routedPoints = useMemo(() => {
        if (isSelfLoop || isNonOrthogonalIR || waypoints.length > 0) return spreadPoints;
        if (isInheritance && isGrouped) return spreadPoints;
        const rects = getNodes()
            .filter(n => !n.hidden)
            .map(n => getNodeRect(n))
            .filter(r => r.width > 0 && r.height > 0);
        return avoidNodeRects(spreadPoints, rects);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spreadPoints, allEdges, isSelfLoop, isNonOrthogonalIR, waypoints, isInheritance, isGrouped]);

    const spreadPath = useMemo(() => pointsToPath(routedPoints), [routedPoints]);

    // ─── Register path for crossing detection ───
    // Grouped inheritance edges skip individual registration: their Manhattan
    // paths are phantom (not rendered — the tree connector renders instead).
    // The tree geometry (trunk + bar + branches) is registered separately
    // by useTreeLayout, so crossing detection remains accurate.
    // Non-orthogonal IR edges register nothing: getEdgeCrossings only pairs strictly
    // horizontal segments against strictly vertical ones, so a diagonal or sampled
    // curve is out of the registry's contract — and registering the Manhattan
    // polyline these edges no longer draw would poison the crossing detection of
    // every other edge, classic ones included. Consequence, by design: crossings
    // involving a direct/bezier edge get no bridge arc, on either side.
    useEffect(() => {
        if (isInheritance && isGrouped) return;
        if (isNonOrthogonalIR) return;
        registerEdgePath(id, routedPoints, source, target, treeGroupId);
        return () => unregisterEdgePath(id);
    }, [id, routedPoints, source, target, treeGroupId, isInheritance, isGrouped, isNonOrthogonalIR]);

    // ─── Detect crossings with other edges ───
    // Scope detection to the current React Flow canvas by passing the active node IDs.
    // `getNodes()` reads the flow instance's store imperatively (tab-local, always
    // current) — no subscription, so membership is fresh at every recompute without
    // re-rendering this edge on unrelated node changes. Recompute triggers: own
    // path (spreadPoints) and any edges-array change (allEdges).
    const crossings = useMemo(
        () => (isNonOrthogonalIR ? [] : getEdgeCrossings(id, routedPoints, new Set(getNodes().map(n => n.id)))),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, routedPoints, allEdges, isNonOrthogonalIR]
    );

    // ─── Self-loop corner geometry (source === target) ───
    // Computed once and shared by the path and the label/cardinality positioning.
    // Falls back to the legacy curl for the frame before the node is measured.
    const selfLoopGeom = useMemo((): {
        path: string;
        labelPoint: { x: number; y: number } | null;
        cardinalityPoint: { x: number; y: number } | null;
    } | null => {
        if (!isSelfLoop) return null;
        const node = sourceNode;
        if (!node) {
            return {
                path: computeSelfLoopPath(sourceX, sourceY, targetX, targetY),
                labelPoint: null,
                cardinalityPoint: null,
            };
        }
        const rect = getNodeRect(node);
        const siblings = allEdges
            .filter(e => e.source === e.target && e.source === source)
            .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
        const ordinal = Math.max(0, siblings.findIndex(e => e.id === id));
        const loop = computeSelfLoopCornerPath(rect, ordinal);
        return {
            path: loop.path,
            labelPoint: loop.labelPoint,
            cardinalityPoint: loop.cardinalityPoint,
        };
    }, [isSelfLoop, sourceNode, allEdges, source, id, sourceX, sourceY, targetX, targetY]);

    // ─── Final path with rounding and bridge arcs ───
    const path = useMemo(() => {
        if (isSelfLoop) {
            return selfLoopGeom ? selfLoopGeom.path : computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        // E-route: the authored curve replaces the whole Manhattan pipeline output.
        // Corner rounding and bridge arcs are Manhattan-only concepts.
        if (irRoutedGeom) return irRoutedGeom.d;
        if (crossings.length > 0) {
            return buildFinalPath(routedPoints, crossings, 4, 6);
        }
        return roundManhattanPath(spreadPath, 4);
    }, [spreadPath, routedPoints, crossings, isSelfLoop, selfLoopGeom, irRoutedGeom, sourceX, sourceY, targetX, targetY]);

    // De-overlap shifts precomputed in EditorV2.applyDistribution (0 when no bundle/collision).
    const roleArcShift = edgeData?.roleArcShift ?? 0;
    const cardinalityShift = edgeData?.cardinalityShift ?? 0;

    // ─── Role label positioning (reference / composition edges) ───
    const labelPos = useMemo(() => {
        if (isSelfLoop) {
            const p = selfLoopGeom?.labelPoint ?? computeLabelPosition(spreadPath);
            return { x: p.x, y: p.y, isHorizontal: true };
        }
        // E-route (R-B11): the centre reported by the React Flow helper. The polyline
        // walker cannot serve a curve — on a bezier `d` it finds no points and answers
        // the canvas origin. Orientation for the perpendicular nudge comes from the
        // dominant axis between the two endpoints.
        if (irRoutedGeom) {
            return {
                x: irRoutedGeom.labelX,
                y: irRoutedGeom.labelY,
                isHorizontal: Math.abs(targetX - sourceX) >= Math.abs(targetY - sourceY),
            };
        }
        return computeLabelPosition(spreadPath, roleArcShift); // arc-length midpoint, slid for bundles
    }, [spreadPath, isSelfLoop, selfLoopGeom, irRoutedGeom, roleArcShift, sourceX, sourceY, targetX, targetY]);

    // Small perpendicular nudge off the line. No cross-edge de-overlap here (see 2c).
    // The authored placement sets the SIGN of that nudge: 'above' / 'below' on a
    // horizontal segment move the label in Y, on a vertical one in X (left reads as
    // above, right as below — the only reading of above/below a vertical line that
    // stays perpendicular to it). 'auto', and every classic edge (field absent), keep
    // the historical nudge: above on a horizontal segment, right on a vertical one.
    const labelOffset = useMemo(() => {
        if (isSelfLoop) return { x: 0, y: 0 };
        const sign = irLabelPlacement === 'above' ? -1 : irLabelPlacement === 'below' ? 1 : 0;
        if (labelPos.isHorizontal) {
            return { x: 10, y: (sign === 0 ? -1 : sign) * ROLE_LINE_GAP_PY };
        }
        return { x: (sign === 0 ? 1 : sign) * ROLE_LINE_GAP_PX, y: 0 };
    }, [isSelfLoop, labelPos, irLabelPlacement]);

    // ─── Cardinality positioning ───
    const cardinalityTransform = useMemo(() => {
        if (isSelfLoop) {
            const p = selfLoopGeom?.cardinalityPoint ?? computeCardinalityPosition(spreadPath);
            return `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
        // Just outside the target box at the entry handle, per-side corner clearance.
        return computeCardinalityAnchor(targetX, targetY, targetSide, CARD_BOX_GAP, cardinalityShift);
    }, [isSelfLoop, selfLoopGeom, spreadPath, targetX, targetY, targetSide, cardinalityShift]);

    // ─── ISA label midpoint (inheritance ER notation) ───
    const midPoint = useMemo(() => {
        const pts = parsePathPoints(spreadPath);
        if (pts.length < 2) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 };
        const mid = Math.floor(pts.length / 2);
        const p1 = pts[mid - 1];
        const p2 = pts[mid];
        return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }, [spreadPath, sourceX, sourceY, targetX, targetY]);

    // ─── Label commit (reference edges) ───
    // Same pattern as ClassNode's commitFieldEdit for attributes:
    // 1. Update RF state immediately (optimistic)
    // 2. Write to JjOM via direct pointer access using the DReference ID
    const commitLabel = useCallback(() => {
        setEditing(false);

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
    const showDiamonds = notation === 'uml' && !isInheritance && !isM1Edge;
    const showCardinality = (notation === 'uml' || notation === 'wireframe') && !isInheritance && !isM1Edge;
    const cardinality = ref ? formatCardinality(ref.lowerBound, ref.upperBound) : '';

    // ─── Marker IDs (unique per edge) ───
    const markerFilledId = `diamond-filled-${id}`;
    const markerEmptyId = `diamond-empty-${id}`;
    const markerArrowId = `arrow-${id}`;
    const markerTriangleId = `inheritance-triangle-${id}`;
    // E0/E0b: IR-only markers, one per EdgeTermination. Namespaced ids, verified
    // collision-free. Kept separate from the classic markers so IR edges can inherit
    // line.color (E0b) without ever touching the shared classic <marker> defs — an IR
    // edge never references a classic marker.
    const markerIROpenArrowId = `ir-arrow-open-${id}`;
    const markerIRClosedArrowId = `ir-arrow-closed-${id}`;
    const markerIRHollowTriangleId = `ir-triangle-hollow-${id}`;
    const markerIRFilledDiamondId = `ir-diamond-filled-${id}`;
    const markerIRHollowDiamondId = `ir-diamond-hollow-${id}`;
    // Map an EdgeTermination to its IR-only per-edge marker (all defined below,
    // gated on isIREdge, and colored inline from irStroke).
    const irMarkerUrl = (t: string | undefined): string | undefined => {
        switch (t) {
            case 'openArrow': return `url(#${markerIROpenArrowId})`;
            case 'closedArrow': return `url(#${markerIRClosedArrowId})`;
            case 'hollowTriangle': return `url(#${markerIRHollowTriangleId})`;
            case 'filledDiamond': return `url(#${markerIRFilledDiamondId})`;
            case 'hollowDiamond': return `url(#${markerIRHollowDiamondId})`;
            case 'none':
            default: return undefined;
        }
    };

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
                            refX="7"
                            refY="5"
                            markerWidth="12"
                            markerHeight="10"
                            // Without this, markerUnits is 'strokeWidth' and the SVG
                            // viewport scales by the stroke-width of the path that
                            // references the marker: the 1.5px line would render the
                            // triangle at 18x15 instead of 12x10. The size of the
                            // inheritance triangle is fixed, and does not follow the
                            // line weight or the selection.
                            markerUnits="userSpaceOnUse"
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
                    className={`inheritance-edge ${selectedClass} ${hlClass}`}
                    markerEnd={isERNotation ? undefined : `url(#${treeMarkerId})`}
                />

                {/* Bar + branches (with bridge arcs) */}
                {treeGeometry.barAndBranchesPath && (
                    <path
                        d={barBranchesPathFinal}
                        fill="none"
                        className={`inheritance-edge ${selectedClass} ${hlClass}`}
                    />
                )}

                {/* Junction dot: marks where the trunk joins the bus, so the T there
                    reads as a connection and not as one of the crossings the bridge
                    arcs hop over — those stay bare. */}
                {treeGeometry.junction && (
                    <circle
                        cx={treeGeometry.junction.x}
                        cy={treeGeometry.junction.y}
                        r={2.5}
                        className={`inheritance-junction ${selectedClass} ${hlClass}`}
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
                            className={`edge-label ${selectedClass} ${hlClass}`}
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
    // Only for an edge the tree actually draws. Going silent here is safe exactly
    // as long as the connector carries this edge's branch: if it does not, this
    // branch has no path at all and the child reads as disconnected while the model
    // still holds the generalization. Without a branch the edge falls through to
    // CASE 3 and draws its own line to the parent — not the bus, but visible.
    if (isInheritance && !isPrimary && isGrouped && treeGeometry && treeGeometry.branchPaths.has(id)) {
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

    // Determine which markers to use. IR edges (E0) derive both ends from the
    // authored EdgeTerminations; classic edges keep their kind-driven markers.
    const markerStart = isIREdge ? irMarkerUrl(irSourceTermination)
        : isInheritance ? undefined
        : showDiamonds && kind === 'composition' ? `url(#${markerFilledId})`
        : showDiamonds && kind === 'aggregation' ? `url(#${markerEmptyId})`
        : undefined;

    const markerEnd = isIREdge ? irMarkerUrl(irTargetTermination)
        : isInheritance
        ? (isERNotation ? undefined : `url(#${markerTriangleId})`)
        : `url(#${markerArrowId})`;

    // E0: IR line style applied inline on the visible path (overrides the CSS class
    // stroke; the class stays for structural styling). Absent when not an IR edge.
    const irPathStyle: React.CSSProperties | undefined = isIREdge
        ? {
            ...(irStroke ? { stroke: irStroke } : {}),
            ...(irStrokeWidth !== undefined ? { strokeWidth: irStrokeWidth } : {}),
            ...(irStrokeDasharray ? { strokeDasharray: irStrokeDasharray } : {}),
        }
        : undefined;

    // E0b: IR terminations inherit line.color (irStroke). Inline styles override the
    // marker CSS class color only when a color is authored; when irStroke is absent the
    // class default (grey) shows, matching the classic markers. Filled shapes tint both
    // fill and stroke; hollow shapes tint only the outline, keeping the hollow interior.
    const irMarkerFillStyle: React.CSSProperties | undefined = irStroke ? { fill: irStroke, stroke: irStroke } : undefined;
    const irMarkerStrokeStyle: React.CSSProperties | undefined = irStroke ? { stroke: irStroke } : undefined;

    const edgeClassName = isInheritance
        ? `inheritance-edge ${selected ? 'selected' : ''} ${hlClass}`
        : `reference-edge ${kind} ${selected ? 'selected' : ''} ${hlClass}`;

    // ─── Whether the label portal needs to mount at all ───
    // EdgeLabelRenderer registers a React Flow store subscription that runs a
    // full-DOM querySelector on every store notification — the dominant per-commit
    // cost at scale. Mount it only when at least one of its three children would
    // produce visible/interactive content, so an edge with no visible label pays
    // nothing. `hovered`/`selected`/`editing` and `showEdgeLabels` all re-render
    // this edge, so the portal appears the moment its label becomes visible:
    //   - M1 labels are hidden until edge hover/selection (or the global toggle),
    //     so they mount only then;
    //   - M2 reference labels mount when they carry text (or during rename);
    //   - the cardinality badge and the ER-notation ISA label mount when shown.
    const refLabelVisible = !isInheritance && (
        editing ||
        (isIREdge && irLabelAlwaysVisible) ||   // D6: an IR-authored edge label is always visible
        (isM1Edge
            ? (hovered || selected || showEdgeLabels)
            : (!!labelText && labelText !== 'newRef'))
    );
    const cardinalityVisible = showCardinality && !!cardinality;
    const isaLabelVisible = isInheritance && isERNotation;
    const showLabelPortal = refLabelVisible || cardinalityVisible || isaLabelVisible;

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
                        refX="7"
                        refY="5"
                        markerWidth="12"
                        markerHeight="10"
                        // Fixed size, as for the tree marker above.
                        markerUnits="userSpaceOnUse"
                        orient="auto"
                    >
                        <path
                            d="M 0 0 L 12 5 L 0 10 Z"
                            className={`inheritance-marker ${selected ? 'selected' : ''}`}
                        />
                    </marker>
                )}

                {/* IR terminations (E0/E0b): one per EdgeTermination, drawn only for
                    IR-styled edges. Geometry mirrors the classic markers; the inline style
                    tints them with the authored line.color (irStroke) when present. */}
                {isIREdge && (
                    <>
                        {/* Open arrow — matches the classic target arrow geometry */}
                        <marker
                            id={markerIROpenArrowId}
                            viewBox="0 0 10 10"
                            refX="10"
                            refY="5"
                            markerWidth="8"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 0 L 10 5 L 0 10" className="reference-marker arrow" style={irMarkerStrokeStyle} />
                        </marker>
                        <marker
                            id={markerIRClosedArrowId}
                            viewBox="0 0 10 10"
                            refX="10"
                            refY="5"
                            markerWidth="8"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 0 L 10 5 L 0 10 Z" className="reference-marker filled" style={irMarkerFillStyle} />
                        </marker>
                        <marker
                            id={markerIRHollowTriangleId}
                            viewBox="0 0 12 10"
                            refX="7"
                            refY="5"
                            markerWidth="12"
                            markerHeight="10"
                            orient="auto"
                        >
                            <path d="M 0 0 L 12 5 L 0 10 Z" className="inheritance-marker" style={irMarkerStrokeStyle} />
                        </marker>
                        {/* Filled diamond — matches the classic composition source marker */}
                        <marker
                            id={markerIRFilledDiamondId}
                            viewBox="0 0 12 8"
                            refX="0"
                            refY="4"
                            markerWidth="12"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker filled" style={irMarkerFillStyle} />
                        </marker>
                        {/* Hollow diamond — matches the classic aggregation source marker */}
                        <marker
                            id={markerIRHollowDiamondId}
                            viewBox="0 0 12 8"
                            refX="0"
                            refY="4"
                            markerWidth="12"
                            markerHeight="8"
                            orient="auto"
                        >
                            <path d="M 0 4 L 6 0 L 12 4 L 6 8 Z" className="reference-marker hollow" style={irMarkerStrokeStyle} />
                        </marker>
                    </>
                )}
            </defs>

            {/* Invisible hit-test path */}
            {/* onClick selects this edge directly, so mid-line selection does not
                depend on React Flow's <g> click delegation. For inheritance this
                only selects the edge id (selectEdge never fabricates a DReference). */}
            <path
                d={path}
                fill="none"
                stroke="transparent"
                strokeWidth={20}
                style={{ pointerEvents: 'stroke' }}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                onClick={(e) => { e.stopPropagation(); selectEdge?.(id); }}
            />

            {/* Visible edge path */}
            <path
                d={path}
                fill="none"
                className={edgeClassName}
                style={irPathStyle}
                markerStart={markerStart}
                markerEnd={markerEnd}
            />

            {/* Segment handles for manual edge customization */}
            {/* E-route (R-B10): a direct/bezier edge has no Manhattan segments to grab,
                so the handles are not mounted — which also removes the only gesture that
                creates waypoints, since it lives inside DraggableHandle. Waypoints already
                persisted on DVertex.irEdgeLayout are neither read for drawing nor erased:
                they come back the moment the edge returns to Manhattan. */}
            {!isSelfLoop && !isNonOrthogonalIR && (
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

            {showLabelPortal && (
            <EdgeLabelRenderer>
                {/* Reference label — positioned on longest segment with smart offset */}
                {/* M1 edges: label hidden by default, shown on hover via CSS */}
                {!isInheritance && (
                    <div
                        className={`edge-label ${selected ? 'selected' : ''} ${isM1Edge ? `edge-label--m1-hover${hovered || selected || (isIREdge && irLabelAlwaysVisible) ? ' edge-label--m1-visible' : ''}` : ''} ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${10+ labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
                            pointerEvents: 'all',
                        }}
                        onDoubleClick={(e) => { e.stopPropagation(); if (!labelEditable) return; setEditing(true); }}
                        onClick={(e) => { e.stopPropagation(); if (labelEditable && selected) { setEditing(true); return; } selectEdge?.(id); }}
                    >
                        {editing && labelEditable ? (
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
                            labelText && labelText !== 'newRef' && <span className="edge-label__text" style={isIREdge && irStroke ? { color: irStroke } : undefined}>{labelText}</span>
                        )}
                    </div>
                )}

                {/* Cardinality badge — positioned near target */}
                {showCardinality && cardinality && (
                    <div
                        className={`edge-cardinality ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: cardinalityTransform,
                            pointerEvents: 'none',
                        }}
                    >
                        {cardinality}
                    </div>
                )}

                {/* ISA label for ER notation (inheritance only) */}
                {isInheritance && isERNotation && (
                    <div
                        className={`edge-label ${selected ? 'selected' : ''} ${hlClass}`}
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
            )}
        </>
    );
}

export default UnifiedEdge;

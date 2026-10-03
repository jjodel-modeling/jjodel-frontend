import { useState, useCallback, useMemo, useEffect, useSyncExternalStore } from 'react';
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
    computeLabelAnchor,
    applyWaypointsWithMap,
    computeCardinalityPosition,
    computeCardinalityAnchor,
    CARD_BOX_GAP,
    MARKER_APPROACH_RUN,
    parsePathPoints,
    pointsToPath,
    getSideFromHandle,
    registerEdgePath,
    unregisterEdgePath,
    getEdgeCrossings,
    subscribeEdgePaths,
    getEdgePathsVersion,
    buildFinalPath,
    avoidNodeRects,
    handleCenterOf,
    computeArcEdgeGeometry,
    computeArcSelfLoopGeometry,
    topLoopEnds,
    sampleArcPath,
    trimPathEnds,
    type Side,
} from '../utils/edgeUtils';
import { MAX_HANDLES_PER_SIDE } from '../utils/portDistribution';
import { applyBundleSpread } from './bundleSpread';
import { applyLaneShifts, getLaneShifts, laneShiftsRevision } from '../utils/edgeLanes';
import { useEditorContextSafe } from '../contexts/EditorContext';
import { useEdgeHighlightClass } from '../contexts/HighlightContext';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { SegmentHandles } from './SegmentHandles';
import { EndpointHandles } from './EndpointHandles';
import { junctionGeometry, junctionTrunkPath, junctionVertex, type JunctionEnd } from '../viewpoint/ir/irJunctions';
import { endGlyphOf, endGlyphMarker, glyphPathD, glyphCircles } from './edgeEndGlyphs';
import { getElkRoute, elkRoutesRevision, isElkRouteValid, fitRouteToEnds } from '../utils/elkLayout';

// Bundle spread lives in ./bundleSpread (pure, testable). It fans the middle
// corridor of parallel same-pair edges by physical anchor order (see that module).
const LABEL_SPREAD_PX = 18;
const ROLE_LINE_GAP = 10; // px, perpendicular nudge so the role text is off the line
const ROLE_LINE_GAP_PX = 8; // px, perpendicular nudge so the role text is off the line
const ROLE_LINE_GAP_PY = 8; // px, perpendicular nudge so the role text is off the line

// Politica di arrotondamento dei reference edge: retta riservata accanto ai marker
// (niente uncino sotto la freccia) e meta' di ogni segmento interno tenuta dritta
// (niente S con le due curve a contatto). L'ereditarieta' non la usa: il suo
// connettore resta byte-identico.
const REFERENCE_ROUNDING = { approachRun: MARKER_APPROACH_RUN, interiorStraight: 0.5 } as const;

// P-2026-09-30-1935: the guard of an Activity (UML) flow sits on a patch of the label background, so the line
// never runs through the text; it replaces the halo's shadow. Applied only on an edge with the Activity flag.
const ACTIVITY_LABEL_PATCH: React.CSSProperties = { background: 'var(--color-edge-label-bg)', padding: '1px 4px', borderRadius: 2, textShadow: 'none' };

// P-2026-10-03-1304: the width of a character of an arc's label in the C2 label style (12 px, 500), to size the label
// boxes a single arc keeps off; measured 6.1 px on `coin`, rounded up.
const ARC_LABEL_CHAR = 6.4;

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
    // R-VP-20 (TS3): an authored `edge.labels.style`, resolved to CSS by irEdgeViews.applyEdgeStyle.
    // Present, the label drops its box for the halo (EditorV2.scss `.edge-label__text--halo`) and the
    // authored axes go inline over the line colour: `style.color` wins for the text, the markers keep
    // irStroke (E0b). Absent = the label box, byte-identical.
    const irLabelStyle = isIREdge ? irData.irLabelStyle as React.CSSProperties | undefined : undefined;
    // E-route: authored routing style. Absent / null / 'orthogonal' all render
    // exactly as before — every existing view is byte-identical on screen.
    const irRouting = irData.irRoutingHint as 'orthogonal' | 'straight' | 'curved' | undefined;
    // R-VP-22: an authored `edge.curve: 'arc'` (irEdgeViews writes irCurve only when declared). The
    // arc replaces the whole Manhattan pipeline, self-loops included; every condition below that
    // reads it is `|| isArcIR`, false for every other edge, which therefore renders as before.
    const isArcIR = isIREdge && irData.irCurve === 'arc';
    // R-VP-23: an authored label at each end (irEdgeViews writes each only when declared), read on an
    // IR-decorated edge only. An empty text draws nothing, so an edge without the keys renders as before.
    const irSourceEndText = isIREdge ? (irData.irSourceEndText as string | undefined) || undefined : undefined;
    const irTargetEndText = isIREdge ? (irData.irTargetEndText as string | undefined) || undefined : undefined;
    // P-2026-09-30-1935: an Activity (UML) control flow (irEdgeViews writes the flag only then) and the junction at
    // either end (irJunctions.ts): absent on every other edge, which renders as before.
    const irActivityFlow = isIREdge && !!irData.irActivityFlow;
    // Slice E: the role at each end (irEdgeViews writes each only when declared), on the other side of the line.
    const irSourceEndRole = isIREdge ? (irData.irSourceEndRole as string | undefined) || undefined : undefined;
    const irTargetEndRole = isIREdge ? (irData.irTargetEndRole as string | undefined) || undefined : undefined;
    // Slice E: the glyph of a new end (edgeEndGlyphs), null for the seven ends of before, which keep their
    // markers below byte for byte. Its stroke is the line's resolved width, 1 when none is authored.
    const irSourceGlyph = isIREdge ? endGlyphOf(irSourceTermination) : null;
    const irTargetGlyph = isIREdge ? endGlyphOf(irTargetTermination) : null;
    const irGlyphWidth = irStrokeWidth !== undefined && irStrokeWidth > 0 ? irStrokeWidth : 1;
    // The label of an IR-authored edge has no write-back path yet. Its text comes from
    // the compiled view (irEdgeViews.applyEdgeStyle re-seeds e.label on every recompute)
    // and commitLabel's syncEdgeRefProperty cannot reach it: a synthetic object-as-edge
    // id (`irobj_<objectId>`) is not a JjOM pointer at all, and on a decorated reference
    // edge it would rename the M2 DReference instead. Until the authored editability flag
    // lands with E-lab the affordance is removed rather than left as a dead write.
    // Classic non-IR edges (including every M2 `reference`, which is never IR-decorated)
    // keep the current behavior.
    const labelEditable = !isIREdge;

    const { setEdges, getNodes, getInternalNode } = useReactFlow();
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

    // P-2026-09-30-1935: the view-only decision and merge of Activity (UML). The members of a group share one handle on
    // the action; each draws its branch to (from) the vertex of the diamond that faces its other end, on today's
    // router, and the primary member also draws the trunk and the diamond (the tree's pattern, CASE 1). Orthogonal
    // edges only: an arc, a direct or curved route and a self-loop keep their own geometry.
    const junctionOk = isIREdge && !isSelfLoop && !isNonOrthogonalIR && !isArcIR;
    const junctionIn = junctionOk ? irData.irJunctionTarget as JunctionEnd | undefined : undefined;
    const junctionOut = junctionOk ? irData.irJunctionSource as JunctionEnd | undefined : undefined;

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

    // ─── Junction geometry (Activity (UML), P-2026-09-30-1935) ───
    // The diamond from the point xyflow gives the shared handle; a branch's vertex faces the centre of the node at its
    // other end, or that end's own diamond when it has one. Null on every edge without a junction.
    const junctionInSide = junctionIn?.side;
    const junctionOutSide = junctionOut?.side;
    const junctionInGeom = useMemo(
        () => (junctionInSide ? junctionGeometry({ x: targetX, y: targetY }, junctionInSide) : null),
        [junctionInSide, targetX, targetY],
    );
    const junctionOutGeom = useMemo(
        () => (junctionOutSide ? junctionGeometry({ x: sourceX, y: sourceY }, junctionOutSide) : null),
        [junctionOutSide, sourceX, sourceY],
    );
    const branchEnds = useMemo(() => {
        if (!junctionInGeom && !junctionOutGeom) return null;
        const centreOf = (n: typeof sourceNode, x: number, y: number) => {
            if (!n) return { x, y };
            const r = getNodeRect(n);
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        };
        return {
            start: junctionOutGeom ? junctionVertex(junctionOutGeom, junctionInGeom?.centre ?? centreOf(targetNode, targetX, targetY)) : null,
            end: junctionInGeom ? junctionVertex(junctionInGeom, junctionOutGeom?.centre ?? centreOf(sourceNode, sourceX, sourceY)) : null,
        };
    }, [junctionInGeom, junctionOutGeom, sourceNode, targetNode, sourceX, sourceY, targetX, targetY]);
    const pathSX = branchEnds?.start?.point.x ?? sourceX;
    const pathSY = branchEnds?.start?.point.y ?? sourceY;
    const pathSSide = branchEnds?.start?.side ?? sourceSide;
    const pathTX = branchEnds?.end?.point.x ?? targetX;
    const pathTY = branchEnds?.end?.point.y ?? targetY;
    const pathTSide = branchEnds?.end?.side ?? targetSide;

    // ─── ELK route (P-2026-10-01-2215): the toolbar auto-layout's own geometry ───
    // Session only (elkLayout.ts store, never persisted). Drawn while both end nodes keep the rects it was
    // computed for; a move or a resize of either node drops it and the router below takes over. Its ends are
    // ELK's own ports: the handles keep their uniform slots until the critical-zone lane aligns them (D-B), so the
    // endpoint grips sit on the drawn ends, as an arc's do. A junction branch is fitted to its diamond's vertex.
    // An arc keeps its curve between the route's two ends, but an arc alone between its two nodes takes the route
    // itself (P-2026-10-03-1304, Q8 (iii)); self-loops, non-orthogonal IR edges and grouped inheritance keep their own
    // geometry (the route gave them their sides only).
    const elkRouteRev = elkRoutesRevision();
    const elkRouteAny = useMemo(() => {
        if (isSelfLoop || isNonOrthogonalIR || (isInheritance && isGrouped)) return null;
        const route = getElkRoute(id);
        if (!route || !sourceNode || !targetNode) return null;
        return isElkRouteValid(route, getNodeRect(sourceNode), getNodeRect(targetNode)) ? route : null;
    }, [id, elkRouteRev, isSelfLoop, isNonOrthogonalIR, isInheritance, isGrouped, sourceNode, targetNode]);
    // The other edges between this edge's two nodes, either way: an arc with none is alone (P-2026-10-03-1304).
    const arcAlone = useMemo(
        () => isArcIR && !isSelfLoop && !allEdges.some(e => e.id !== id && !e.hidden
            && ((e.source === source && e.target === target) || (e.source === target && e.target === source))),
        [isArcIR, isSelfLoop, allEdges, id, source, target],
    );
    const arcOnElkRoute = arcAlone && !!elkRouteAny && elkRouteAny.orthogonal;
    const elkRoute = elkRouteAny && elkRouteAny.orthogonal && (!isArcIR || arcOnElkRoute) ? elkRouteAny : null;
    const elkPoints = useMemo(() => {
        if (!elkRoute) return null;
        if (!branchEnds) return elkRoute.points;
        const pts = elkRoute.points;
        return fitRouteToEnds(
            { ...elkRoute, sourceSide: branchEnds.start?.side ?? elkRoute.sourceSide, targetSide: branchEnds.end?.side ?? elkRoute.targetSide },
            branchEnds.start?.point ?? pts[0],
            branchEnds.end?.point ?? pts[pts.length - 1],
        );
    }, [elkRoute, branchEnds]);
    const elkCenterLabel = elkRoute?.centerLabel ?? null;
    // An arc's chord between the route's ends: ELK ordered those ports, the handles' uniform slots did not. A straight
    // (stress) route ends on the box, not on a diamond's or an ellipse's outline: there the handles' ends stay.
    const elkArcEnds = useMemo(
        () => (isArcIR && !isSelfLoop && !arcOnElkRoute && elkRouteAny && !elkRouteAny.straight
            ? { start: elkRouteAny.points[0], end: elkRouteAny.points[elkRouteAny.points.length - 1] }
            : null),
        [isArcIR, isSelfLoop, arcOnElkRoute, elkRouteAny],
    );

    // ─── Compute base path — Manhattan routing ───
    const rawPath = useMemo(
        () => computeManhattanPath(pathSX, pathSY, pathSSide, pathTX, pathTY, pathTSide),
        [pathSX, pathSY, pathSSide, pathTX, pathTY, pathTSide]
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

    // ─── Pipeline: parse → bundle spread → evitamento → waypoint → round corners ───
    //
    // I waypoint dell'utente sono passati **in fondo** (prima stavano subito dopo il
    // router). Cosi' il loro indice di segmento si riferisce alla polilinea che
    // l'utente vede davvero, ed e' quello che permette alle maniglie di comparire su
    // ogni segmento reso invece che su quelli del tracciato pre-evitamento — dove un
    // arco ri-instradato ne aveva meno di tre e non ne mostrava nessuna.
    // `applyBundleSpread` conserva il numero di punti (agisce solo su polilinee a 4),
    // quindi gli indici gia' persistiti restano validi.
    const rawPoints = useMemo(() => elkPoints ?? parsePathPoints(rawPath), [rawPath, elkPoints]);

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
    // Lo scostamento di corsia arriva da `EditorV2.applyDistribution`, che e' l'unico
    // punto che vede tutti gli archi insieme: il ventaglio di `applyBundleSpread`
    // separa i corridoi della stessa coppia di nodi, la corsia quelli di coppie
    // diverse. Fuori dalla Z a quattro punti sono entrambi no-op per riferimento.
    // A junction's branch is not a corridor between the pair of nodes: it ends on the diamond, so it is not fanned.
    // An ELK route already separates its corridors: no fan.
    const spreadPoints = useMemo(() => {
        if (isInheritance || isSelfLoop || branchEnds || elkPoints) return rawPoints;
        return applyBundleSpread(rawPoints, bundleCenter);
    }, [rawPoints, bundleCenter, isInheritance, isSelfLoop, branchEnds, elkPoints]);
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
    // An ELK route already avoids the nodes it was laid out with: no rerouting.
    const routedPoints = useMemo(() => {
        if (isSelfLoop || isNonOrthogonalIR || isArcIR || waypoints.length > 0 || elkPoints) return spreadPoints;
        if (isInheritance && isGrouped) return spreadPoints;
        const rects = getNodes()
            .filter(n => !n.hidden)
            .map(n => getNodeRect(n))
            .filter(r => r.width > 0 && r.height > 0);
        return avoidNodeRects(spreadPoints, rects);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [spreadPoints, allEdges, isSelfLoop, isNonOrthogonalIR, isArcIR, waypoints, isInheritance, isGrouped, elkPoints]);

    // Le corsie: separano i corridoi contesi da archi DIVERSI, e arrivano da
    // `EditorV2.applyDistribution`, l'unico punto che vede tutti gli archi insieme.
    // Si applicano dopo l'evitamento — e' li' che nascono i segmenti interni che si
    // contendono i corridoi — e prima dei waypoint, che restano l'ultima parola.
    // Un arco con waypoint non prende corsie: il suo tracciato e' dell'utente.
    // Il registro si rilegge quando cambia l'array degli archi — la stessa
    // dipendenza con cui questo componente rilegge il registro dei tracciati per gli
    // incroci — oppure quando la polilinea cambia. `laneShiftsRevision()` entra fra
    // le dipendenze perche' una riscrittura del registro a parita' di archi (nodi
    // spostati, handle invariati) si veda comunque.
    // An ELK route keeps its own lanes too.
    const lanedPoints = useMemo(() => {
        if (isSelfLoop || isNonOrthogonalIR || isArcIR || waypoints.length > 0 || elkPoints) return routedPoints;
        return applyLaneShifts(routedPoints, getLaneShifts(id));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, routedPoints, allEdges, laneShiftsRevision(), isSelfLoop, isNonOrthogonalIR, isArcIR, waypoints, elkPoints]);

    // I waypoint chiudono la catena: sono l'ultima parola sul tracciato (R-B10).
    // `segmentMap` dice dove ogni segmento del router e' finito dopo la
    // trasformazione, ed e' quello che tiene allineate maniglia e segmento governato.
    const waypointed = useMemo(
        () => applyWaypointsWithMap(lanedPoints, waypoints),
        [lanedPoints, waypoints],
    );
    const drawnPoints = waypointed.points;
    const spreadPath = useMemo(() => pointsToPath(drawnPoints), [drawnPoints]);
    const basePath = useMemo(() => pointsToPath(lanedPoints), [lanedPoints]);

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
        // An arc is a curve too (R-VP-22): out of the registry's contract, for the same reason.
        if (isNonOrthogonalIR || isArcIR) return;
        registerEdgePath(id, drawnPoints, source, target, treeGroupId);
        return () => unregisterEdgePath(id);
    }, [id, drawnPoints, source, target, treeGroupId, isInheritance, isGrouped, isNonOrthogonalIR, isArcIR]);

    // ─── Detect crossings with other edges ───
    // Scope detection to the current React Flow canvas by passing the active node IDs.
    // `getNodes()` reads the flow instance's store imperatively (tab-local, always
    // current) — no subscription, so membership is fresh at every recompute without
    // re-rendering this edge on unrelated node changes. Recompute triggers: own
    // path (spreadPoints), any edges-array change (allEdges), and any change of the
    // path registry: the other edges register in an effect, after this render, so
    // without the version their new paths reached these crossings only at the next
    // edges-array change (P-2026-10-02-1450, T9).
    const edgePathsVersion = useSyncExternalStore(subscribeEdgePaths, getEdgePathsVersion, getEdgePathsVersion);
    const crossings = useMemo(
        () => (isNonOrthogonalIR || isArcIR ? [] : getEdgeCrossings(id, drawnPoints, new Set(getNodes().map(n => n.id)))),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [id, drawnPoints, allEdges, edgePathsVersion, isNonOrthogonalIR, isArcIR]
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

    // ─── Arc geometry (R-VP-22) ───
    // Between the centres of the two handles (on the outline, where the anchor is drawn), not the
    // points xyflow passes (4 px past the border); the RF points only before the handles are
    // measured. A self-loop over the top edge, at its two top handles (irEdgeViews gives it those),
    // else at the top centre; an edge bowed away from the edges between the same nodes the other
    // way, whose chords are read the same way; otherwise straight.
    const arcGeom = useMemo(() => {
        if (!isArcIR || arcOnElkRoute) return null;
        const start = elkArcEnds?.start ?? handleCenterOf(sourceNode, sourceHandleId, 'source') ?? { x: sourceX, y: sourceY };
        const end = elkArcEnds?.end ?? handleCenterOf(targetNode, targetHandleId, 'target') ?? { x: targetX, y: targetY };
        if (isSelfLoop) {
            if (sourceSide === 'top' && targetSide === 'top') return computeArcSelfLoopGeometry(start, end);
            const ends = sourceNode ? topLoopEnds(getNodeRect(sourceNode)) : { start, end };
            return computeArcSelfLoopGeometry(ends.start, ends.end);
        }
        const opposite = allEdges
            .filter(e => e.id !== id && !e.hidden && e.source === target && e.target === source)
            .map(e => {
                // An opposite edge drawn on its ELK route's ends is read there too, so the pair bows apart.
                const r = elkArcEnds ? getElkRoute(e.id) : undefined;
                if (r && targetNode && sourceNode && isElkRouteValid(r, getNodeRect(targetNode), getNodeRect(sourceNode))) {
                    return { start: r.points[0], end: r.points[r.points.length - 1], id: e.id };
                }
                return {
                    start: handleCenterOf(targetNode, e.sourceHandle, 'source') ?? end,
                    end: handleCenterOf(sourceNode, e.targetHandle, 'target') ?? start,
                    id: e.id,
                };
            });
        // P-2026-10-03-1304 (Q5): the arcs the same way, read as the opposite ones, so a fan orders them all alike.
        const same = allEdges
            .filter(e => e.id !== id && !e.hidden && e.source === source && e.target === target)
            .map(e => {
                const r = elkArcEnds ? getElkRoute(e.id) : undefined;
                if (r && sourceNode && targetNode && isElkRouteValid(r, getNodeRect(sourceNode), getNodeRect(targetNode))) {
                    return { start: r.points[0], end: r.points[r.points.length - 1], id: e.id };
                }
                return {
                    start: handleCenterOf(sourceNode, e.sourceHandle, 'source') ?? start,
                    end: handleCenterOf(targetNode, e.targetHandle, 'target') ?? end,
                    id: e.id,
                };
            });
        if (opposite.length > 0 || same.length > 0) return computeArcEdgeGeometry(start, end, opposite, { id, same });
        // An arc alone bows round the other nodes its chord would cross (Q5), read as routedPoints reads them, and
        // crosses none of the other arcs where it can: their curves as they are drawn at rest, each from its own
        // handles (an arc alone among them as its chord). ELK route ends are not read here: after an Auto layout an
        // arc alone runs on its route (Q8 (iii)).
        const obstacles = getNodes().filter(n => !n.hidden && n.id !== source && n.id !== target).map(n => getNodeRect(n)).filter(r => r.width > 0 && r.height > 0);
        const at = (nid: string, hid: string | null | undefined, type: 'source' | 'target') => handleCenterOf(getInternalNode(nid), hid, type);
        const others = allEdges
            .filter(e => e.id !== id && !e.hidden && (e.data as Record<string, unknown> | undefined)?.irCurve === 'arc')
            .map(e => {
                if (e.source === e.target) {
                    const s0 = at(e.source, e.sourceHandle, 'source'), t0 = at(e.target, e.targetHandle, 'target');
                    if (getSideFromHandle(e.sourceHandle) === 'top' && getSideFromHandle(e.targetHandle) === 'top' && s0 && t0) return { e, g: computeArcSelfLoopGeometry(s0, t0) };
                    const n = getInternalNode(e.source);
                    if (!n) return null;
                    const ends = topLoopEnds(getNodeRect(n));
                    return { e, g: computeArcSelfLoopGeometry(ends.start, ends.end) };
                }
                const s0 = at(e.source, e.sourceHandle, 'source'), t0 = at(e.target, e.targetHandle, 'target');
                if (!s0 || !t0) return null;
                const between = (a: string, b: string) => allEdges
                    .filter(x => x.id !== e.id && !x.hidden && x.source === a && x.target === b)
                    .map(x => ({ start: at(x.source, x.sourceHandle, 'source') ?? (a === e.source ? s0 : t0), end: at(x.target, x.targetHandle, 'target') ?? (a === e.source ? t0 : s0), id: x.id }));
                return { e, g: computeArcEdgeGeometry(s0, t0, between(e.target, e.source), { id: e.id, same: between(e.source, e.target) }) };
            })
            .filter((x): x is { e: (typeof allEdges)[number]; g: ReturnType<typeof computeArcEdgeGeometry> } => !!x);
        const avoid = others.map(x => sampleArcPath(x.g.d));
        // Their labels and this one's, sized from the text (the C2 label style, about 6.4 px a character, 15 high).
        const labelBox = (text: string, at: { x: number; y: number }) => ({ x: at.x - (text.length * ARC_LABEL_CHAR + 4) / 2, y: at.y - 7.5, width: text.length * ARC_LABEL_CHAR + 4, height: 15 });
        const avoidBoxes = others.filter(x => String(x.e.label ?? '').trim()).map(x => labelBox(String(x.e.label).trim(), x.g.label));
        const own = String(label ?? '').trim();
        const labelSize = own ? { width: own.length * ARC_LABEL_CHAR + 4, height: 15 } : undefined;
        return computeArcEdgeGeometry(start, end, opposite, { id, same, obstacles, avoid, avoidBoxes, labelSize });
    }, [isArcIR, arcOnElkRoute, getInternalNode, label, isSelfLoop, sourceNode, targetNode, sourceHandleId, targetHandleId, sourceSide, targetSide, allEdges, id, source, target, sourceX, sourceY, targetX, targetY, elkArcEnds]);

    // ─── Final path with rounding and bridge arcs ───
    const path = useMemo(() => {
        if (arcGeom) return arcGeom.d;
        if (isSelfLoop) {
            return selfLoopGeom ? selfLoopGeom.path : computeSelfLoopPath(sourceX, sourceY, targetX, targetY);
        }
        // E-route: the authored curve replaces the whole Manhattan pipeline output.
        // Corner rounding and bridge arcs are Manhattan-only concepts.
        if (irRoutedGeom) return irRoutedGeom.d;
        // La politica passa solo ai reference: il connettore d'ereditarieta' (bus,
        // tronco, T) e' fuori perimetro e resta byte-identico, qui come in
        // useTreeLayout, che non passa nessuna politica.
        const rounding = isInheritance ? undefined : REFERENCE_ROUNDING;
        if (crossings.length > 0) {
            return buildFinalPath(drawnPoints, crossings, 4, 6, rounding);
        }
        return roundManhattanPath(spreadPath, 4, rounding);
    }, [arcGeom, spreadPath, drawnPoints, crossings, isSelfLoop, selfLoopGeom, irRoutedGeom, isInheritance, sourceX, sourceY, targetX, targetY]);

    // De-overlap shifts precomputed in EditorV2.applyDistribution (0 when no bundle/collision).
    const roleArcShift = edgeData?.roleArcShift ?? 0;
    const cardinalityShift = edgeData?.cardinalityShift ?? 0;

    // ─── Role label positioning (reference / composition edges) ───
    const labelPos = useMemo(() => {
        if (arcGeom) return { x: arcGeom.label.x, y: arcGeom.label.y, isHorizontal: arcGeom.isHorizontal };
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
        // An ELK route: the label where ELK put it, beside the line (P-2026-10-01-2215).
        if (elkCenterLabel) return { x: elkCenterLabel.x, y: elkCenterLabel.y, isHorizontal: true };
        // Punto medio del segmento piu' lungo, scostato per gli archi in fascio.
        return computeLabelAnchor(spreadPath, roleArcShift);
    }, [arcGeom, spreadPath, isSelfLoop, selfLoopGeom, irRoutedGeom, roleArcShift, sourceX, sourceY, targetX, targetY, elkCenterLabel]);

    // Small perpendicular nudge off the line. No cross-edge de-overlap here (see 2c).
    // The authored placement sets the SIGN of that nudge: 'above' / 'below' on a
    // horizontal segment move the label in Y, on a vertical one in X (left reads as
    // above, right as below — the only reading of above/below a vertical line that
    // stays perpendicular to it). 'auto', and every classic edge (field absent), keep
    // the historical nudge: above on a horizontal segment, right on a vertical one.
    const labelOffset = useMemo(() => {
        // An arc's apex and loop labels already stand off the line; a straight arc takes the nudge.
        // ELK placed its label off the line already (P-2026-10-01-2215).
        if (isSelfLoop || (arcGeom && !arcGeom.nudge) || elkCenterLabel) return { x: 0, y: 0 };
        const sign = irLabelPlacement === 'above' ? -1 : irLabelPlacement === 'below' ? 1 : 0;
        if (labelPos.isHorizontal) {
            return { x: 0, y: (sign === 0 ? -1 : sign) * ROLE_LINE_GAP_PY };
        }
        return { x: (sign === 0 ? 1 : sign) * ROLE_LINE_GAP_PX, y: 0 };
    }, [isSelfLoop, arcGeom, labelPos, irLabelPlacement, elkCenterLabel]);

    // ─── Cardinality positioning ───
    const cardinalityTransform = useMemo(() => {
        if (isSelfLoop) {
            const p = selfLoopGeom?.cardinalityPoint ?? computeCardinalityPosition(spreadPath);
            return `translate(-50%, -50%) translate(${p.x}px, ${p.y}px)`;
        }
        // Just outside the target box at the entry handle, per-side corner clearance.
        // `routedPoints` dice da che parte arriva il tracciato: la molteplicita' si
        // posa sul fianco opposto, quello che la linea non occupa.
        return computeCardinalityAnchor(targetX, targetY, targetSide, CARD_BOX_GAP, cardinalityShift, drawnPoints);
    }, [isSelfLoop, selfLoopGeom, spreadPath, drawnPoints, targetX, targetY, targetSide, cardinalityShift]);

    // ─── End labels (R-VP-23) ───
    // Anchored as the cardinality badge is (computeCardinalityAnchor), one at each end: an arc at its
    // two ends (the handle centres) with its chord as the path, any other edge at the handle point with
    // the drawn polyline; the source end reads the path backwards, so its label also takes the side the
    // line does not come from. Slice E: the role on the other side of the line (the anchor's mirror);
    // beside a new glyph both are pushed along the axis by its back, 0 for every other end.
    const endLabelTransforms = useMemo(() => {
        if (!irSourceEndText && !irTargetEndText && !irSourceEndRole && !irTargetEndRole) return null;
        const start = arcGeom ? arcGeom.start : { x: sourceX, y: sourceY };
        const end = arcGeom ? arcGeom.end : { x: targetX, y: targetY };
        const points = arcGeom ? [arcGeom.start, arcGeom.end] : drawnPoints;
        const reversed = [...points].reverse();
        const sourceDepth = irSourceGlyph ? irSourceGlyph.back : 0;
        const targetDepth = irTargetGlyph ? irTargetGlyph.back : 0;
        return {
            source: irSourceEndText ? computeCardinalityAnchor(start.x, start.y, sourceSide, CARD_BOX_GAP, sourceDepth, reversed) : '',
            target: irTargetEndText ? computeCardinalityAnchor(end.x, end.y, targetSide, CARD_BOX_GAP, targetDepth, points) : '',
            sourceRole: irSourceEndRole ? computeCardinalityAnchor(start.x, start.y, sourceSide, CARD_BOX_GAP, sourceDepth, reversed, true) : '',
            targetRole: irTargetEndRole ? computeCardinalityAnchor(end.x, end.y, targetSide, CARD_BOX_GAP, targetDepth, points, true) : '',
        };
    }, [irSourceEndText, irTargetEndText, irSourceEndRole, irTargetEndRole, irSourceGlyph, irTargetGlyph, arcGeom, drawnPoints, sourceX, sourceY, targetX, targetY, sourceSide, targetSide]);

    // ─── Edge ends (slice E) ───
    // The visible line stops at the back of each new end's glyph (edgeUtils trimPathEnds); the hit path keeps
    // the whole route. No new end: no trim, the path as before.
    const trimmedPath = useMemo(
        () => (irSourceGlyph || irTargetGlyph ? trimPathEnds(path, irSourceGlyph?.back ?? 0, irTargetGlyph?.back ?? 0) : null),
        [path, irSourceGlyph, irTargetGlyph],
    );
    // P-2026-10-02-1505: a junction trunk carries the edge's own target end (P-2026-09-30-1935). A new end's marker
    // is cut and oriented per line, so each primary trunk takes its own cut here and its own marker below; an old
    // end keeps the edge's marker, whose orient="auto" already follows the trunk.
    const trunkEnds = useMemo(() => {
        if (!irTargetGlyph) return null;
        return {
            in: junctionIn?.primary && junctionInGeom ? trimPathEnds(junctionTrunkPath(junctionInGeom, 'merge'), 0, irTargetGlyph.back) : null,
            out: junctionOut?.primary && junctionOutGeom ? trimPathEnds(junctionTrunkPath(junctionOutGeom, 'decision'), 0, irTargetGlyph.back) : null,
        };
    }, [irTargetGlyph, junctionIn?.primary, junctionOut?.primary, junctionInGeom, junctionOutGeom]);

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
    // R-VP-24 (P-2026-09-30-1521): the inhibitor arc's end, mounted only where an end uses it.
    const markerIRHollowCircleId = `ir-circle-hollow-${id}`;
    // Slice E: one marker per end whose glyph is new, its reference and orientation that end's own.
    const markerIREndSourceId = `ir-end-source-${id}`;
    const markerIREndTargetId = `ir-end-target-${id}`;
    const markerIREndTrunkInId = `ir-end-trunk-in-${id}`;
    const markerIREndTrunkOutId = `ir-end-trunk-out-${id}`;
    // Map an EdgeTermination to its IR-only per-edge marker (all defined below,
    // gated on isIREdge, and colored inline from irStroke).
    const irMarkerUrl = (t: string | undefined): string | undefined => {
        switch (t) {
            case 'openArrow': return `url(#${markerIROpenArrowId})`;
            case 'closedArrow': return `url(#${markerIRClosedArrowId})`;
            case 'hollowTriangle': return `url(#${markerIRHollowTriangleId})`;
            case 'filledDiamond': return `url(#${markerIRFilledDiamondId})`;
            case 'hollowDiamond': return `url(#${markerIRHollowDiamondId})`;
            case 'hollowCircle': return `url(#${markerIRHollowCircleId})`;
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
    const markerStart = isIREdge ? (irSourceGlyph ? `url(#${markerIREndSourceId})` : irMarkerUrl(irSourceTermination))
        : isInheritance ? undefined
        : showDiamonds && kind === 'composition' ? `url(#${markerFilledId})`
        : showDiamonds && kind === 'aggregation' ? `url(#${markerEmptyId})`
        : undefined;

    const markerEnd = isIREdge ? (irTargetGlyph ? `url(#${markerIREndTargetId})` : irMarkerUrl(irTargetTermination))
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
    // R-VP-23: an authored end label mounts it too; false on every edge without one.
    const endLabelsVisible = endLabelTransforms !== null;
    const showLabelPortal = refLabelVisible || cardinalityVisible || isaLabelVisible || endLabelsVisible;

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
                        {/* Hollow circle (R-VP-24): the inhibitor arc's end. Mounted only on an edge one of whose
                            ends uses it, so every other IR edge keeps its markup byte for byte. The far side of
                            the circle sits on the end point; reversed at a start, so it stays outside the node. */}
                        {(irSourceTermination === 'hollowCircle' || irTargetTermination === 'hollowCircle') && (
                            <marker
                                id={markerIRHollowCircleId}
                                viewBox="0 0 10 10"
                                refX="9"
                                refY="5"
                                markerWidth="8"
                                markerHeight="8"
                                orient="auto-start-reverse"
                            >
                                <circle cx="5" cy="5" r="4" className="reference-marker hollow" style={irMarkerStrokeStyle} />
                            </marker>
                        )}
                        {/* Slice E: the seven new ends (edgeEndGlyphs), a marker per end that uses one, in user space,
                            its reference the cut the line stops at. Line work in the ink, a zero's circle on the canvas
                            background, the filled disc in the ink; the stroke the line's resolved width and colour. */}
                        {([
                            ['source', irSourceGlyph, trimmedPath?.start ?? null, markerIREndSourceId],
                            ['target', irTargetGlyph, trimmedPath?.end ?? null, markerIREndTargetId],
                            // P-2026-10-02-1505: each primary junction trunk's own, cut and oriented on the trunk.
                            ['target', trunkEnds?.in ? irTargetGlyph : null, trunkEnds?.in?.end ?? null, markerIREndTrunkInId],
                            ['target', trunkEnds?.out ? irTargetGlyph : null, trunkEnds?.out?.end ?? null, markerIREndTrunkOutId],
                        ] as const).map(([role, glyph, cut, markerId]) => {
                            if (!glyph) return null;
                            const m = endGlyphMarker(glyph, irGlyphWidth, cut, role);
                            const lineWork = glyphPathD(glyph);
                            return (
                                <marker
                                    key={markerId}
                                    id={markerId}
                                    viewBox={m.viewBox}
                                    refX={m.refX}
                                    refY={m.refY}
                                    markerWidth={m.markerWidth}
                                    markerHeight={m.markerHeight}
                                    markerUnits="userSpaceOnUse"
                                    orient={m.orient}
                                >
                                    {lineWork && <path d={lineWork} className="ir-end-glyph" strokeWidth={irGlyphWidth} style={irMarkerStrokeStyle} />}
                                    {glyphCircles(glyph).map((c, i) => (
                                        <circle
                                            key={i}
                                            cx={c.cx}
                                            cy={c.cy}
                                            r={c.r}
                                            className={`ir-end-glyph ir-end-glyph--${c.fill === 'ink' ? 'filled' : 'hollow'}`}
                                            strokeWidth={irGlyphWidth}
                                            style={c.fill === 'ink' ? irMarkerFillStyle : irMarkerStrokeStyle}
                                        />
                                    ))}
                                </marker>
                            );
                        })}
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

            {/* Visible edge path (slice E: cut at the back of a new end's glyph) */}
            <path
                d={trimmedPath ? trimmedPath.d : path}
                fill="none"
                className={edgeClassName}
                style={irPathStyle}
                markerStart={markerStart}
                markerEnd={markerEnd}
            />

            {/* Junction (Activity (UML), P-2026-09-30-1935): the primary member draws the trunk, with the edge's own
                arrowhead (into the action for a merge, into the diamond for a decision), and the diamond over it,
                white, in the edge's stroke and width. View-only: no node, no model object. */}
            {(junctionIn?.primary || junctionOut?.primary) && [
                junctionIn?.primary && junctionInGeom ? { key: 'in', g: junctionInGeom, kind: 'merge' as const, trimmed: trunkEnds?.in ?? null, markerId: markerIREndTrunkInId } : null,
                junctionOut?.primary && junctionOutGeom ? { key: 'out', g: junctionOutGeom, kind: 'decision' as const, trimmed: trunkEnds?.out ?? null, markerId: markerIREndTrunkOutId } : null,
            ].map(j => j && (
                <g key={`junction-${j.key}`}>
                    <path
                        d={junctionTrunkPath(j.g, j.kind)}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={20}
                        style={{ pointerEvents: 'stroke' }}
                        onClick={(e) => { e.stopPropagation(); selectEdge?.(id); }}
                    />
                    <path
                        d={j.trimmed ? j.trimmed.d : junctionTrunkPath(j.g, j.kind)}
                        fill="none"
                        className={`${edgeClassName} ir-junction-trunk`}
                        style={irPathStyle}
                        markerEnd={j.trimmed ? `url(#${j.markerId})` : markerEnd}
                    />
                    <polygon
                        className="ir-junction"
                        points={j.g.polygon}
                        style={{ fill: 'var(--color-inode-surface)', stroke: irStroke ?? 'var(--color-inode-name)', strokeWidth: irStrokeWidth ?? 1 }}
                        onClick={(e) => { e.stopPropagation(); selectEdge?.(id); }}
                    />
                </g>
            ))}

            {/* Segment handles for manual edge customization */}
            {/* E-route (R-B10): a direct/bezier edge has no Manhattan segments to grab,
                so the handles are not mounted — which also removes the only gesture that
                creates waypoints, since it lives inside DraggableHandle. Waypoints already
                persisted on DVertex.irEdgeLayout are neither read for drawing nor erased:
                they come back the moment the edge returns to Manhattan. */}
            {!isSelfLoop && !isNonOrthogonalIR && !isArcIR && (
                <SegmentHandles
                    edgeId={id}
                    basePath={basePath}
                    drawnPath={spreadPath}
                    segmentMap={waypointed.segmentMap}
                    waypoints={waypoints}
                    selected={!!selected}
                />
            )}

            {/* Endpoint handles for anchor drag */}
            {/* An arc ends on the handle centres (R-VP-22): its grips sit there, on the line's ends. */}
            {!isSelfLoop && (
                <EndpointHandles
                    edgeId={id}
                    sourceX={arcGeom ? arcGeom.start.x : elkPoints ? elkPoints[0].x : pathSX}
                    sourceY={arcGeom ? arcGeom.start.y : elkPoints ? elkPoints[0].y : pathSY}
                    targetX={arcGeom ? arcGeom.end.x : elkPoints ? elkPoints[elkPoints.length - 1].x : pathTX}
                    targetY={arcGeom ? arcGeom.end.y : elkPoints ? elkPoints[elkPoints.length - 1].y : pathTY}
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
                            transform: `translate(-50%, -50%) translate(${labelPos.x + labelOffset.x}px, ${labelPos.y + labelOffset.y}px)`,
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
                            labelText && labelText !== 'newRef' && (irLabelStyle
                                ? <span className="edge-label__text edge-label__text--halo" style={{ ...(irStroke ? { color: irStroke } : {}), ...irLabelStyle, ...(irActivityFlow ? ACTIVITY_LABEL_PATCH : {}) }}>{labelText}</span>
                                : <span className="edge-label__text" style={isIREdge && irStroke ? { color: irStroke } : undefined}>{labelText}</span>)
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

                {/* End labels (R-VP-23): the halo of the centre label when a label style is authored, else the cardinality badge */}
                {endLabelTransforms && ([['source', irSourceEndText], ['target', irTargetEndText]] as const).map(([end, text]) => text && (
                    <div
                        key={end}
                        className={`edge-end-label${irLabelStyle ? '' : ' edge-cardinality'} ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: endLabelTransforms[end],
                            pointerEvents: 'none',
                        }}
                    >
                        {irLabelStyle
                            ? <span className="edge-label__text edge-label__text--halo" style={{ ...(irStroke ? { color: irStroke } : {}), ...irLabelStyle }}>{text}</span>
                            : text}
                    </div>
                ))}

                {/* Slice E: the role at each end, the same label on the other side of the line */}
                {endLabelTransforms && ([['sourceRole', irSourceEndRole], ['targetRole', irTargetEndRole]] as const).map(([end, text]) => (text ? (
                    <div
                        key={end}
                        className={`edge-end-label edge-end-label--role${irLabelStyle ? '' : ' edge-cardinality'} ${hlClass}`}
                        style={{
                            position: 'absolute',
                            transform: endLabelTransforms[end],
                            pointerEvents: 'none',
                        }}
                    >
                        {irLabelStyle
                            ? <span className="edge-label__text edge-label__text--halo" style={{ ...(irStroke ? { color: irStroke } : {}), ...irLabelStyle }}>{text}</span>
                            : text}
                    </div>
                ) : null))}

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

import React from 'react';
import { connect } from 'react-redux';
import {
    DState,
    EdgeBendingMode,
    LGraphElement,
    LViewElement,
    LPointerTargetable,
    Selectors,
    GObject,
} from '../../joiner';
import { computeRouting, roundManhattanCorners } from '../routing/manhattan';
import type { RoutingInput } from '../routing/manhattan/types';
import { EdgeHead } from '../../common/DV';

// DerivedReferenceEdge — Option B, step 1/3.
//
// Renders an M1 reference edge in the classic editor by calling the pure routing engine
// (`computeRouting`, `frontend/src/edges/routing/manhattan/`) directly, WITHOUT minting a DEdge and
// WITHOUT idlookup residency. It replaces the minting `<Edge>` factory for M1 references at the two
// `refEdges.map(...)` sites in `DefaultView.model()` (common/DV.tsx); M2 (metamodel) reference edges
// keep the native `<Edge>` path. Discoveries: docs/discovery/2026-06-15_isedge_B_integration_seam.md
// (+ the two earlier coupling/contract discoveries).
//
// IMPORTANT — why a connected CLASS, not a hooks-based function: the classic-editor jsxString render
// pipeline treats template "components" as factory functions that are sometimes invoked directly
// (e.g. UX.recursiveMap -> `windoww.Components.DefaultNode({...})`), and every native graph component
// (Edge -> EdgeConnected, Vertex, ...) is a class whose store reactivity lives in a `connect()`
// wrapper. Inline React hooks (useSelector/useState) throw "Invalid hook call" in this path. So this
// component mirrors the Edge pattern exactly: a class component + `connect()` for reactivity. The
// mapStateToProps reads the two endpoints' geometry into `geomSig`, so the edge re-routes when either
// vertex is dragged or resized (parity with the connected native edge).
//
// Visual parity is achieved by reproducing the native edge's outer element — same class set PLUS the
// resolved view-id class (e.g. `Pointer_ViewEdgeAssociation`) and `data-nodetype="Edge"` — so the
// globally-injected per-view compiled CSS (Dashboard.tsx `views-css-injector-d`, scoped `.<viewId>`
// in view.tsx get_compiled_css) and the global `[data-nodetype="Edge"] path` rules (styles/diagram.scss)
// style the inner SVG identically. The head shape `d` is set explicitly to `EdgeHead.Head_reference`
// (belt-and-suspenders; the per-view CSS `path.head { d: path(var(--head)) }` resolves to the same).
// Head size comes from `view.edgeHeadSize` baked into `routed.head.{w,h}`.
//
// STEP 1 scope only: render + integration, no mint. NO anchor-drag, NO anchor override store, NO
// follow logic, NO selection state machine (hover/selected styling stay purely CSS-driven). Anchors
// stay at the current default (the call site passes anchorStart/anchorEnd = 0).

export interface DerivedReferenceEdgeOwnProps {
    data?: any;          // se.start — the M1 reference value (LValue) [M2: LReference]
    start?: any;         // se.startVertex (LVoidVertex) or its pointer
    end?: any;           // se.endVertex (LVoidVertex) or its pointer
    id?: string;         // se.id (+ '_with_label'/'_without_label') — stable derived-edge id
    view?: string;       // view-name string, e.g. 'EdgeAssociation'
    label?: any;         // middle / name label (the reference name)
    elabel?: any;        // end label (multiplicity)
    slabel?: any;        // start label
    isReference?: boolean;
    anchorStart?: any;
    anchorEnd?: any;
    [k: string]: any;
}

interface DerivedReferenceEdgeStateProps {
    dviewId?: string;    // resolved view id (Pointer_ViewEdge<modename>)
    geomSig?: string;    // endpoint geometry signature → forces re-route on drag/resize
}

type AllProps = DerivedReferenceEdgeOwnProps & DerivedReferenceEdgeStateProps;

function pointerOf(v: any): string | undefined {
    if (!v) return undefined;
    return typeof v === 'string' ? v : v.id;
}

function resolveProxy(v: any): any {
    if (!v) return undefined;
    return typeof v === 'string' ? LPointerTargetable.from(v) : v;
}

export class DerivedReferenceEdgeComponent extends React.Component<AllProps> {
    public static cname: string = 'DerivedReferenceEdgeComponent';

    render(): React.ReactNode {
        const props = this.props;
        const startVertex: any = resolveProxy(props.start);
        const endVertex: any = resolveProxy(props.end);
        if (!startVertex || !endVertex) return null;

        const lview = (props.dviewId ? LPointerTargetable.fromPointer(props.dviewId) : undefined) as LViewElement | undefined;
        if (!props.dviewId || !lview) return null;

        const innermostGraph: any = startVertex.graph;
        const rootGraph: any = startVertex.root;
        if (!innermostGraph || !rootGraph) return null;

        const input: RoutingInput = {
            allNodes: [startVertex, endVertex] as any as LGraphElement[],
            // edge arg is used by computeRouting only for a debug side-effect and as the label-fn
            // source; with primitive/undefined labels it is never dereferenced (prior discovery §1).
            edge: {} as any,
            edgeId: props.id as any,
            view: lview,
            innermostGraph,
            rootGraph,
            // current default (the call site passes 0); no anchor override store in step 1.
            anchorStart: props.anchorStart as any,
            anchorEnd: props.anchorEnd as any,
            longestLabel: (props.label ?? undefined) as any,
            labels: undefined as any,
            // no anchor-drag / follow in step 1.
            isFollowingCoords: undefined,
            startFollow: undefined,
            endFollow: undefined,
            outer: true, // mirrors get_segments_outer
        };

        let routed;
        try { routed = computeRouting(input); }
        catch (e) { return null; }
        if (!routed || !routed.all || !routed.all.length) return null;

        let d = routed.all.map(s => s.d).join(' ');
        if (lview.bendingMode === EdgeBendingMode.Manhattan) d = roundManhattanCorners(d);

        const viewName: string = props.view || 'EdgeAssociation';
        const modename = viewName.replace(/^Edge/, '') || 'Association';

        const head = routed.head;
        const tail = routed.tail;
        const headTransform: React.CSSProperties | undefined = head ? {
            transform: `translate(${head.x}px, ${head.y}px) rotate(${head.rad}rad)`,
            transformOrigin: `${head.w / 2}px ${head.h / 2}px`,
        } : undefined;
        const tailTransform: React.CSSProperties | undefined = tail ? {
            transform: `translate(${tail.x}px, ${tail.y}px) rotate(${tail.rad}rad)`,
            transformOrigin: `${tail.w / 2}px ${tail.h / 2}px`,
        } : undefined;

        const cz: any = rootGraph.cumulativeZoom || { x: 1, y: 1 };
        const rootStyle: React.CSSProperties = {
            ['--total-zoom-x' as any]: cz.x,
            ['--total-zoom-y' as any]: cz.y,
        };

        const legs = routed.segments && routed.segments.length ? routed.segments : routed.all;
        const startPt: any = legs[0]?.start?.pt;
        const endPt: any = legs[legs.length - 1]?.end?.pt;

        return (
            <div
                id={props.id}
                data-nodeid={props.id}
                data-dataid={props.data?.id}
                data-nodetype="Edge"
                data-viewid={props.dviewId}
                className={`${props.dviewId} mainView edge hoverable hide-ep clickthrough fullscreen ${modename}`}
                style={rootStyle}
            >
                <svg className="clickthrough fullscreen">
                    <path className="preview edge full outline" d={d} />
                    <path className="preview edge full" d={d} />
                    <path className="preview edge full hover-activator" d={d} />

                    {routed.all.flatMap((s, i) => [
                        <path key={'seg' + i} tabIndex={-1} className="clickable content segment" d={s.dpart} />,
                        s.label ? (
                            <foreignObject key={'lbl' + i} className="label"
                                x={(s.start.pt.x + s.end.pt.x) / 2 + 'px'}
                                y={(s.start.pt.y + s.end.pt.y) / 2 + 'px'}>
                                <div className="label-text">{s.label as any}</div>
                            </foreignObject>
                        ) : null,
                    ])}

                    {/* native head: shape from EdgeHead.Head_reference (also supplied by --head via the
                        view-id class), positioned from the routed head; size from view.edgeHeadSize. */}
                    <path className={'head ' + modename + ' preview'} style={headTransform} d={EdgeHead.Head_reference} />
                    <path className={'head ' + modename + ' clickable content'} style={headTransform} d={EdgeHead.Head_reference} tabIndex={-1} />

                    {/* tail: shape (if any for this view) supplied by --tail via the view-id class;
                        empty for Association. */}
                    {tailTransform && <path className={'tail ' + modename + ' preview'} style={tailTransform} />}
                    {tailTransform && <path className={'tail ' + modename + ' clickable content'} style={tailTransform} tabIndex={-1} />}

                    {props.slabel && startPt && (
                        <foreignObject key="label-start" className="label-start" x={startPt.x + 'px'} y={startPt.y + 'px'}>
                            <div className="label-text">{props.slabel as any}</div>
                        </foreignObject>
                    )}
                    {(props.elabel !== undefined && props.elabel !== null && props.elabel !== '') && endPt && (
                        <foreignObject key="label-end" className="label-end" x={endPt.x + 'px'} y={endPt.y + 'px'}>
                            <div className="label-text">{props.elabel as any}</div>
                        </foreignObject>
                    )}
                </svg>
            </div>
        );
    }
}

function mapStateToProps(state: DState, ownProps: DerivedReferenceEdgeOwnProps): DerivedReferenceEdgeStateProps {
    const startId = pointerOf(ownProps.start);
    const endId = pointerOf(ownProps.end);
    const dview = Selectors.getViewByIDOrNameD(ownProps.view || 'EdgeAssociation', state);
    const sig = (id: string | undefined): string => {
        const n: any = id ? (state.idlookup as GObject)[id] : undefined;
        return n ? `${n.x},${n.y},${n.w},${n.h}` : 'x';
    };
    return {
        dviewId: dview?.id,
        geomSig: sig(startId) + '|' + sig(endId),
    };
}

const DerivedReferenceEdgeConnected = connect(mapStateToProps)(DerivedReferenceEdgeComponent as any);
(DerivedReferenceEdgeConnected as any).cname = 'DerivedReferenceEdgeConnected';

// Hoisted function declaration (NOT a `const`): the classic-editor component registry copies the
// joiner/components barrel exports onto `window` during a circular module-init (joiner/ExecuteOnRead.ts).
// A `const` export can still be in its temporal-dead-zone at copy time, leaving window.DerivedReferenceEdge
// undefined -> "DerivedReferenceEdge is not a function" in the jsxString eval. A function declaration is
// hoisted and therefore always present. Mirrors the native `Edge` factory: a thin hookless wrapper that
// renders the connected component (store reactivity lives in the connect() wrapper, never inline hooks).
export function DerivedReferenceEdge(props: DerivedReferenceEdgeOwnProps): React.ReactElement {
    return React.createElement(DerivedReferenceEdgeConnected as any, props);
}
(DerivedReferenceEdge as any).cname = 'DerivedReferenceEdge';

export default DerivedReferenceEdge;

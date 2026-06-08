import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DEdge,
    DGraph,
    DGraphElement,
    DGraphVertex, Dictionary,
    DVoidVertex, EdgeBendingMode, GObject,
    GraphElementComponent,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee, GraphPoint,
    GraphSize,
    DState,
    LClass, LEdge, LGraphElement,
    LModelElement,
    LPointerTargetable,
    LUser,
    LVoidVertex, Overlap,
    RuntimeAccessibleClass,
    U,
    EdgeOwnProps, EdgeStateProps,
    LViewPoint, DModelElement, SetFieldAction, LVertex, Log, Measurable
} from "../../joiner";
import {Tooltip} from "../../components/forEndUser/Tooltip";

let groupingsize: Dictionary<EdgeBendingMode, number> = {} as any;
groupingsize[EdgeBendingMode.Line] = 1;
groupingsize[EdgeBendingMode.Bezier_quadratic] = 2;
groupingsize[EdgeBendingMode.Bezier_cubic] = 3;
// groupingsize[EdgeBendingMode.Bezier_quadratic_mirrored] = 1;
// groupingsize[EdgeBendingMode.Bezier_cubic_mirrored] = 2;
groupingsize[EdgeBendingMode.Elliptical_arc] = 2; // (1_coord), (rotation), (sweep    arc), (1_coord)

const superclassGraphElementComponent: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;
const superclassGraphElementComponentuntyped: any = RuntimeAccessibleClass.classes.GraphElementComponent as any;
class ThisStatee extends GraphElementStatee {}

// Recursively append `extra` children into the first <svg> found in `node`, without editing the
// persisted jsxString. Returns {node, injected}; if no <svg> is found the input is returned untouched
// so the handles are skipped rather than mis-positioned. Used to host the draggable internal-segment
// handles in the edge's own SVG coordinate space. See docs/discovery/discovery_2026-06-08_classic_segment_handles.md.
function appendIntoFirstSvg(node: ReactNode, extra: ReactNode[]): { node: ReactNode, injected: boolean } {
    if (!React.isValidElement(node)) return { node, injected: false };
    const el = node as ReactElement;
    if (el.type === 'svg') {
        const kids = React.Children.toArray((el.props as GObject).children);
        return { node: React.cloneElement(el, {}, [...kids, ...extra]), injected: true };
    }
    const kids = React.Children.toArray((el.props as GObject).children);
    if (!kids.length) return { node: el, injected: false };
    let injected = false;
    const newKids = kids.map((k) => {
        if (injected) return k;
        const r = appendIntoFirstSvg(k as ReactNode, extra);
        if (r.injected) injected = true;
        return r.node;
    });
    if (!injected) return { node: el, injected: false };
    return { node: React.cloneElement(el, {}, newKids), injected: true };
}

export class EdgeComponent<AllProps extends AllPropss = AllPropss, ThisState extends ThisStatee = ThisStatee>
    extends superclassGraphElementComponent<AllProps, ThisState> {
    public static cname: string = "EdgeComponent";
    static defaultProps: Partial<EdgeOwnProps> = EdgeOwnProps.new();

    constructor(props: AllProps, context?: any) {
        super(props, context);
        // console.log('constructor render edge', {props: this.props, node:this.props.node, start:this.props.start});
    }
/*
    path(): string {
        let coords = this.pathCoords();
        let svgletter: EdgeBendingMode = (this.props.view.bendingMode || "L");
        let strings: string[] = coords.map(gp => gp.x+" " + gp.y);
        return "M"+strings.join(" " + svgletter); }

    pathCoords(): GraphPoint[] {
        const ret = this.props;
        let svgletter: EdgeBendingMode = (ret).view.bendingMode;
        if (!ret.node) return []; // "node missing"
        let coords: GraphPoint[] = (ret.node.midnodes as { x:number, y:number }[] as GraphPoint[]) || [];
        let grouping = groupingsize[svgletter];
        // console.log("edgeee", {coords, svgletter, groupingsize, midnodes:ret.node.midnodes, mnraw: ret.node.midnodes.map(mn=>mn.__raw), ret});
        let scoord: GraphPoint = ret.node.startPoint || new GraphPoint(10, 10);
        let ecoord: GraphPoint = ret.node.endPoint || new GraphPoint(100, 100);
        return [scoord, ...coords, ecoord]; }

    pathSegments(): GraphPoint[][]{
        return U.pairArrayElements(this.pathCoords(), true); }
*/

    render(): ReactNode {
        let failure: false | null | typeof React.Fragment = null;
        // console.log('render edge', {props: this.props, node:this.props.node, start:this.props.start});
        let errorMsg = (msg: string)=> {
            return (/*<Measurable draggable={true} resizable={false}><div className="edge-error graph-centered">*/
                <Tooltip tooltip={'Check the logs for more info'}>
                <div className="edge-error graph-centered" onClick={() => { this.forceUpdate(); }}>
                    <i className="bi bi-exclamation-diamond-fill" />
                    <span className={"m-auto"}>{msg}</span>
                </div>
                </Tooltip>
            /*</div></Measurable>*/);
        }


        // if (this.props.__skipRender) return failure;
        // for some reason countRenders is always reset to 0 even if i set it differently here
        // unless it manages to call .super() after which counts correctly.
        if ((false as any) && this.countRenders <= 1 && (!this.props.node || this.props.__skipRender)) {
            // first time does not have node. (but does no create component either and does not count render?)
            // second time does not have start and end
            // third time can render
            return errorMsg('Loading Edge...');
        }
        if (!this.props.start?.html) {
            Log.ee('Missing edge start', {view: (this.props.view||this.props.node?.view||this.props.viewid), node: this.props.node, start: this.props.start, end: this.props.end, data: this.props.data});
            return errorMsg('Missing edge start');
        }
        if (!this.props.end?.html) {
            Log.ee('Missing edge end', {view: (this.props.view||this.props.node?.view||this.props.viewid), node: this.props.node, start: this.props.start, end: this.props.end, data: this.props.data});
            return errorMsg('Missing edge end');
        }

        if (!this.props.node) {
            Log.eDevv('Missing edge node', {view: (this.props.view||(this.props.node as any)?.view||this.props.viewid), node: this.props.node, start: this.props.start, end: this.props.end, data: this.props.data});
            return errorMsg("Missing edge node");
        }
        // set classes
        let nodeType = "Edge";
        let classesoverride = [nodeType];
        // set classes end
        let styleoverride: React.CSSProperties = {};

        const out: ReactNode = super.render(nodeType, styleoverride, classesoverride);
        return this.injectSegmentHandles(out);
    }

    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<ThisState>, nextContext: any, oldProps?: Readonly<AllProps>): boolean {
        // console.log('shouldComponentUpdate render edge', {props: this.props, node:this.props.node, start:this.props.start});
        return super.shouldComponentUpdate(nextProps, nextState, nextContext, oldProps);
    }

    // ---- classic-editor draggable internal-segment handles ----
    // Appended into the edge's own <svg> after super.render(), so they live in the same coordinate
    // space as the existing edge anchors with no edit to the persisted jsxString (no VersionFixer
    // migration). The dragged offset persists on DVoidEdge.segmentOffsets and is applied as a
    // consumer-side post-process in GraphDataElements.get_segments_impl.
    private injectSegmentHandles(out: ReactNode): ReactNode {
        let handles: ReactElement[] | null = null;
        try { handles = this.renderSegmentHandles(); } catch (e) { handles = null; }
        if (!handles || !handles.length) return out;
        const res = appendIntoFirstSvg(out, handles);
        return res.injected ? res.node : out;
    }

    private renderSegmentHandles(): ReactElement[] | null {
        const node: any = this.props.node;
        const view: any = this.props.view;
        if (!node || !view) return null;
        if (view.bendingMode !== EdgeBendingMode.Manhattan) return null;     // only Manhattan-routed legacy edges
        let selected = false;
        try { selected = !!node.isSelected(); } catch (e) { selected = false; }
        if (!selected) return null;                                          // handles only on the selected edge
        const legs: any[] | undefined = node.segments && node.segments.segments;
        if (!legs || legs.length < 3) return null;                           // need >= 3 legs to have an internal one
        const stored: any[] = Array.isArray(node.segmentOffsets) ? node.segmentOffsets : [];
        const edgeId: string = node.id;
        // Only the single CENTRAL internal leg: drop the two legs adjacent to the anchors (first/last),
        // then pick the middle of what's left. `k` is the index into node.segments.segments — the same
        // key applySegmentOffsets indexes with (NOT EdgeSegment.index, which is the doubled-point index).
        const k = 1 + Math.floor((legs.length - 2) / 2);
        const seg = legs[k];
        if (!seg || !seg.start || !seg.end) return null;
        const sx = seg.start.pt.x, sy = seg.start.pt.y, ex = seg.end.pt.x, ey = seg.end.pt.y;
        const midX = (sx + ex) / 2, midY = (sy + ey) / 2;
        const horizontal = Math.abs(ey - sy) <= Math.abs(ex - sx);
        const existing = (stored.find((o) => o && o.segmentIndex === k) || {}).offset || 0;
        return [<circle
            key={'seg-handle-' + k}
            className={'edge-segment-handle clickable content no-drag'}
            r={5}
            style={{
                transform: `translate(${midX}px, ${midY}px)`,
                fill: '#0ea5e9',
                stroke: '#ffffff',
                strokeWidth: 2,
                cursor: horizontal ? 'ns-resize' : 'ew-resize',
                pointerEvents: 'all',
            }}
            onMouseDown={(e) => this.onSegmentHandleDown(e, edgeId, k, horizontal, midX, midY, existing)}
        />];
    }

    private onSegmentHandleDown(e: React.MouseEvent, edgeId: string, segmentIndex: number,
                                horizontal: boolean, baseX: number, baseY: number, existingOffset: number): void {
        e.preventDefault();
        e.stopPropagation();                                                 // don't start an edge drag / change selection
        const graph: any = (this.props.node as any) && (this.props.node as any).graph;
        const zoom: any = (graph && (graph.cumulativeZoom || graph.zoom)) || { x: 1, y: 1 };
        const zx = zoom.x || 1, zy = zoom.y || 1;
        const startX = e.clientX, startY = e.clientY;
        const target = e.currentTarget as unknown as SVGElement;
        const delta = (me: MouseEvent) => horizontal ? (me.clientY - startY) / zy : (me.clientX - startX) / zx;
        const onMove = (me: MouseEvent) => {                                 // live preview: move only the handle
            const d = delta(me);
            const nx = horizontal ? baseX : baseX + d;
            const ny = horizontal ? baseY + d : baseY;
            if (target && target.style) target.style.transform = `translate(${nx}px, ${ny}px)`;
        };
        const onUp = (me: MouseEvent) => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
            const node: any = this.props.node;
            if (!node) return;
            const newOffset = existingOffset + delta(me);
            const cur: any[] = Array.isArray(node.segmentOffsets)
                ? node.segmentOffsets.map((o: any) => ({ segmentIndex: o.segmentIndex, offset: o.offset })) : [];
            const idx = cur.findIndex((o) => o && o.segmentIndex === segmentIndex);
            let next: any[];
            if (idx >= 0) next = cur.map((o, i) => i === idx ? { segmentIndex, offset: newOffset } : o);
            else next = [...cur, { segmentIndex, offset: newOffset }];
            next = next.filter((o) => Math.abs(o.offset) > 1);               // drop near-zero (dragged back to original)
            node.segmentOffsets = next;                                      // L setter → TRANSACTION + SetFieldAction
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }
}



class DispatchProps extends GraphElementDispatchProps {
}

type AllPropss = Overlap<Overlap<EdgeOwnProps, EdgeStateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: EdgeOwnProps): EdgeStateProps {
    let ret: EdgeStateProps = EdgeStateProps.new();

    // console.log('mapstate render edge 1', {ownProps, node:ownProps.nodeid, start:ownProps.start});
    if (!ownProps.data && (!ownProps.start || !ownProps.end)) return {__skipRender: true} as any;
    if (!ownProps.data) {
        let lstart = LPointerTargetable.from(ownProps.start);
        if (RuntimeAccessibleClass.extends(lstart.className, DModelElement.cname)) ret.data = lstart as any;
    }

    ret = GraphElementComponent.mapStateToProps(state, ownProps, DEdge, ret) as EdgeStateProps;

    // superret.lastSelected = state._lastSelected ? LPointerTargetable.from(state._lastSelected.modelElement) : null;
    ret.isEdgePending = {
        user: LPointerTargetable.from(state.isEdgePending.user),
        source: LPointerTargetable.from(state.isEdgePending.source)
    };
    let l: GObject;

    if (ownProps.start){ l = LPointerTargetable.from(ownProps.start); if (l) ret.start = l as LVertex; }
    if (ownProps.end){ l = LPointerTargetable.from(ownProps.end); if (l) ret.end = l as LVertex; }

    U.removeEmptyObjectKeys(ret);
    if (!ret.start || !ret.end) return {__skipRender: true} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const superret: GraphElementDispatchProps = GraphElementComponent.mapDispatchToProps(dispatch);
    const ret: GraphElementDispatchProps = new GraphElementDispatchProps();
    U.objectMergeInPlace(superret, ret);
    U.removeEmptyObjectKeys(superret);
    return superret;
}


export const EdgeConnected = connect<EdgeStateProps, DispatchProps, EdgeOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeComponent as any);

export const Edge = (props: EdgeOwnProps, children: ReactNode = []): ReactElement => {
    // console.log('constructor 00 render edge', {props, node:props.nodeid, start:props.start});
    let props2 = {...props, children};
    delete props2.key;
    return <EdgeConnected {...props2}
                          isGraph={false} isGraphVertex={false} isVertex={false} isEdgePoint={false} isField={false} isEdge={true} isVoid={false} />;
}

EdgeComponent.cname = "EdgeComponent";
EdgeConnected.cname = "EdgeConnected";
Edge.cname = "Edge";

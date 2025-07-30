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
        console.log("edgeee", {coords, svgletter, groupingsize, midnodes:ret.node.midnodes, mnraw: ret.node.midnodes.map(mn=>mn.__raw), ret});
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

        return super.render(nodeType, styleoverride, classesoverride);
    }

    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<ThisState>, nextContext: any, oldProps?: Readonly<AllProps>): boolean {
        // console.log('shouldComponentUpdate render edge', {props: this.props, node:this.props.node, start:this.props.start});
        return super.shouldComponentUpdate(nextProps, nextState, nextContext, oldProps);
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

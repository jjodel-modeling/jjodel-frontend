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
    LViewPoint
} from "../../joiner";

let groupingsize: Dictionary<EdgeBendingMode, number> = {} as any;
groupingsize[EdgeBendingMode.Line] = 1;
groupingsize[EdgeBendingMode.Bezier_quadratic] = 2;
groupingsize[EdgeBendingMode.Bezier_cubic] = 3;
groupingsize[EdgeBendingMode.Bezier_quadratic_mirrored] = 1;
groupingsize[EdgeBendingMode.Bezier_cubic_mirrored] = 2;
groupingsize[EdgeBendingMode.Elliptical_arc] = 2; // (1_coord), (rotation), (sweep    arc), (1_coord)

const superclassGraphElementComponent: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;
const superclassGraphElementComponentuntyped: any = RuntimeAccessibleClass.classes.GraphElementComponent as any;
class ThisStatee extends GraphElementStatee {}

export class EdgeComponent<AllProps extends AllPropss = AllPropss, ThisState extends ThisStatee = ThisStatee>
    extends superclassGraphElementComponent<AllProps, ThisState> {
    public static cname: string = "EdgeComponent";

    constructor(props: AllProps, context: any) {
        super(props, context);
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
        if (!this.props.node) return "loading";
        // set classes
        let nodeType = "Edge";
        let classesoverride = [nodeType];
        // set classes end
        let styleoverride: React.CSSProperties = {}
        return super.render(nodeType, styleoverride, classesoverride);
    }

}



class DispatchProps extends GraphElementDispatchProps {
}

type AllPropss = Overlap<Overlap<EdgeOwnProps, EdgeStateProps>, DispatchProps>;

function mapStateToProps(state: DState, ownProps: EdgeOwnProps): EdgeStateProps {
    const ret: EdgeStateProps = new EdgeStateProps();
    // superret.lastSelected = state._lastSelected ? LPointerTargetable.from(state._lastSelected.modelElement) : null;
    ret.isEdgePending = {
        user: LPointerTargetable.from(state.isEdgePending.user),
        source: LPointerTargetable.from(state.isEdgePending.source)
    };
    ret.viewpoint = LViewPoint.fromPointer(state.viewpoint);
    let startnodeid = LGraphElement.getNodeId(ownProps.start);
    let endnodeid = LGraphElement.getNodeId(ownProps.end);
    ret.start = LPointerTargetable.fromPointer(startnodeid);
    ret.end = LPointerTargetable.fromPointer(endnodeid);
    // ret.key = ownProps.key || (startnodeid || (ownProps.start as any)?.id || ownProps.start) + "~" + (endnodeid || (ownProps.end as any)?.id || ownProps.end);
    // key is already used as key || nodeid on super.render()
    // console.log("edge", {ret, ownProps});

    const superret: EdgeStateProps = GraphElementComponent.mapStateToProps(state, ownProps, DEdge, ret) as EdgeStateProps;
    // U.objectMergeInPlace(superret, ret);
    // U.removeEmptyObjectKeys(superret);
    // console.error(superret, ret); throw Error("aaa");
    return superret;
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

export const DamEdge = (props: EdgeOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EdgeConnected {...{...props, children}} isGraph={false} isVertex={true} />;
}

EdgeComponent.cname = "EdgeComponent";
EdgeConnected.cname = "EdgeConnected";
DamEdge.cname = "DamEdge";

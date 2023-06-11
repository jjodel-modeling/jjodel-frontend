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
    IStore,
    LClass, LEdge, LGraphElement,
    LModelElement,
    LPointerTargetable,
    LUser,
    LVoidVertex, Overlap,
    RuntimeAccessibleClass,
    U,
} from "../../joiner";
import {LViewPoint} from "../../view/viewPoint/viewpoint";
import {EdgeOwnProps} from "../graphElement/sharedTypes/sharedTypes";
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

    constructor(props: AllProps, context: any) {
        super(props, context);
        let tobind = [this.path, this.pathSegments, this.pathCoords];
        for (let tb of tobind) (this as GObject)[tb.name] = tb.bind(this);
    }

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
        let scoord: GraphPoint = ret.node.edgeStart || new GraphPoint(10, 10);
        let ecoord: GraphPoint = ret.node.edgeEnd || new GraphPoint(100, 100);
        return [scoord, ...coords, ecoord]; }

    pathSegments(): GraphPoint[][]{
        return U.pairArrayElements(this.pathCoords(), true); }

    render(): ReactNode {
       return super.render();
    }

}


class StateProps extends GraphElementReduxStateProps {
    node!: LEdge;
    lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint;
    start!: LGraphElement;
    end!: LGraphElement;

}

class DispatchProps extends GraphElementDispatchProps {
}

type AllPropss = Overlap<Overlap<EdgeOwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: IStore, ownProps: EdgeOwnProps): StateProps {
    const ret: StateProps = new StateProps();
    // superret.lastSelected = state._lastSelected ? LPointerTargetable.from(state._lastSelected.modelElement) : null;
    ret.isEdgePending = {
        user: LPointerTargetable.from(state.isEdgePending.user),
        source: LPointerTargetable.from(state.isEdgePending.source)
    };
    ret.viewpoint = LViewPoint.fromPointer(state.viewpoint);
    ret.start = LPointerTargetable.fromPointer(ownProps.start);
    ret.end = LPointerTargetable.fromPointer(ownProps.end);
    console.log("edge", {ret, ownProps});

    const superret: StateProps = GraphElementComponent.mapStateToProps(state, ownProps, DEdge, ret) as StateProps;
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


export const EdgeConnected = connect<StateProps, DispatchProps, EdgeOwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeComponent as any);

export const DamEdge = (props: EdgeOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EdgeConnected {...{...props, children}} isGraph={false} isVertex={true} />;
}

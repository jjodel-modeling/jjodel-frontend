import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DEdge,
    DGraph,
    DGraphElement,
    DGraphVertex, Dictionary,
    DVoidVertex, EdgeBendingMode,
    GraphElementComponent,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee, GraphPoint,
    IStore,
    LClass, LEdge,
    LModelElement,
    LPointerTargetable,
    LUser,
    LVoidVertex, Overlap,
    RuntimeAccessibleClass,
    U,
} from "../../joiner";
import {LViewPoint} from "../../view/viewPoint/viewpoint";
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
    }
    render(): ReactNode {
       return super.render();
    }

}

class OwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isGraph?: boolean = false;
    isVertex?: boolean = true;
}

class StateProps extends GraphElementReduxStateProps {
    node!: LEdge;
    lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint;
    path!: () => string; // svg path builder
}

class DispatchProps extends GraphElementDispatchProps {
}

type AllPropss = Overlap<Overlap<OwnProps, StateProps>, DispatchProps>;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = new StateProps();
    // superret.lastSelected = state._lastSelected ? LPointerTargetable.from(state._lastSelected.modelElement) : null;
    ret.isEdgePending = {
        user: LPointerTargetable.from(state.isEdgePending.user),
        source: LPointerTargetable.from(state.isEdgePending.source)
    };
    ret.viewpoint = LViewPoint.fromPointer(state.viewpoint);
    ret.path = () => {
        let s = '';
        // @ts-ignore
        console.log("path:", this, ret, s);
        let svgletter: EdgeBendingMode = (ret).view.bendingMode;
        if(!ret.node) return "node missing";
        let coords = ret.node.midnodes.map( (mn) => mn.x+" "+mn.y);
        if (!coords) coords = [];
        let grouping = groupingsize[svgletter];
        let scoord: GraphPoint = ret.node.start?.size.tl() || new GraphPoint(50, 50);
        let ecoord: GraphPoint = ret.node.end?.size.tl() || new GraphPoint(500, 150);
        s+= "M " + scoord.x + " " + scoord.y + svgletter + " " + coords.join(", ") + ", " + ecoord.x+" "+ecoord.y;
        /*for (let i = 0; i < coords.length + 1; i++) {
            if (i-1 % grouping === 0) s+= " " + svgletter + " "
            else s+=", ";
            s += (i === coords.length ? ecoord.x + " " + ecoord.y : coords[i]);
        }*/
        // if (U.isNumber(s[0])) s = "M " + s; else s = "M " + s.substring(1);
        return s; }

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


export const EdgeConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(EdgeComponent as any);

export const DamEdge = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EdgeConnected {...{...props, children}} isGraph={false} isVertex={true} />;
}

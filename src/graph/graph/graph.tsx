import React, {PureComponent} from "react";import {connect} from "react-redux";

import {GObject, IStore,
    GraphElementRaw,
    GraphElement, windoww} from "../../joiner";
import {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from  "../graphElement/sharedTypes/sharedTypes";


class GraphStatee extends GraphElementStatee {
    /*graphid!: string
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode, id: string) {
        super(preRenderFunc, evalContext, templatefunc);
        this.graphid = id;
    }*/
}

export class GraphRaw<AllProps extends AllPropss, GraphState extends GraphStatee> extends GraphElementRaw<AllProps, GraphState>{
}
// todo: devo permettere agli elementi di: multi-selezionare, resize, drag, rotate, drop (outside-inside container)
// private
class VertexOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
class VertexReduxStateProps extends GraphElementReduxStateProps{
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
class VertexDispatchProps extends GraphElementDispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllPropss = VertexOwnProps & VertexReduxStateProps & VertexDispatchProps;


const GraphConnected = connect<VertexReduxStateProps, VertexDispatchProps, VertexOwnProps, IStore>(
    GraphRaw.mapStateToProps,
    GraphRaw.mapDispatchToProps
)(GraphRaw);
export const Graph = GraphConnected;



if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Graph = GraphRaw;

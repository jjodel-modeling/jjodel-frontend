import React, {PureComponent, ReactElement} from "react";
import {connect} from "react-redux";

import {
    IStore,
    windoww,
    GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps,
    GraphElementComponent, RuntimeAccessibleClass, DVoidVertex, DGraph, DModelElement, Field, DModel, DPackage
} from "../../joiner";
// import {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from  "../graphElement/sharedTypes/sharedTypes";

console.info('GraphComponent loading');

class GraphStatee extends GraphElementStatee {
    /*graphid!: string
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode, id: string) {
        super(preRenderFunc, evalContext, templatefunc);
        this.graphid = id;
    }*/
}

const superclass = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;
export class GraphComponent<AllProps extends AllPropss, GraphState extends GraphStatee>
    // extends GraphElementRaw<AllProps, GraphState>
    // @ts-ignore
    extends superclass<AllProps, GraphState>{

    static mapStateToProps(state: IStore, ownProps: GraphOwnProps): GraphReduxStateProps {
        // console.log('dragx vertex mapstate', {DVoidVertex});
        return GraphElementComponent.mapStateToProps(state, ownProps, DGraph);
    }
    // obsoleta? usa Vertex con isGraph = true e cambiagli nome

}
// todo: devo permettere agli elementi di: multi-selezionare, resize, drag, rotate, drop (outside-inside container)
// private
class GraphOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
class GraphReduxStateProps extends GraphElementReduxStateProps{
    /*nodeid!: string;
    graphid!: string;*/
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
class GraphDispatchProps extends GraphElementDispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllPropss = GraphOwnProps & GraphReduxStateProps & GraphDispatchProps;


const GraphConnected = connect<GraphReduxStateProps, GraphDispatchProps, GraphOwnProps, IStore>(
    GraphComponent.mapStateToProps,
    GraphComponent.mapDispatchToProps
)(GraphComponent as any);

// nb: necessario per usarlo a runtime
export const Graph = (props: GraphOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <GraphConnected {...{...props, childrens}} />; }

// DModel.defaultComponent = Graph;
// DPackage.defaultComponent = Graph;

/*
if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.Graph = GraphRaw;*/
console.info('GraphComponent loaded');

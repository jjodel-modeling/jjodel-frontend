import React, {ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DClassifier,
    DEnumerator,
    Dictionary,
    DModel,
    DModelElement,
    DPackage, DV,
    GObject,
    GraphElementComponent,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    DState,
    LModelElement,
    Log,
    LViewElement,
    RuntimeAccessibleClass, SetRootFieldAction,
    windoww,
    Field, Graph, GraphVertex, Vertex, VoidVertex, RuntimeAccessible
} from "../../joiner";
// import {Field, Graph, GraphVertex} from "../vertex/Vertex";

const superclass: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;

// private
class DefaultNodeStatee extends GraphElementStatee { }

// from ownstateprops function getVertexID(props: AllPropss): Pointer<DVoidVertex, 0, 1, LVoidVertex> { return props.vertex?.id; }


// Giordano: add ignore for webpack
@RuntimeAccessible
//@ts-ignore
export class DefaultNodeComponent<AllProps extends AllPropss = AllPropss, NodeState = DefaultNodeStatee> extends superclass<AllProps, NodeState>{
    public static cname: string = "DefaultNodeComponent";

    static mapStateToProps(state: DState, ownProps: GraphElementOwnProps): GraphElementReduxStateProps {
        let ret: GraphElementReduxStateProps = {} as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        GraphElementComponent.mapLModelStuff(state, ownProps, ret); // not necessary either?
        // GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass); not necessary, it's demanded to sub-components
        try{
            GraphElementComponent.mapViewStuff(state, ret, ownProps);
            (ret as any).skiparenderforloading = false;
        } catch(e) {
            (ret as any).skiparenderforloading = true; // model id is updated, but he's still trying to load old model which got replaced and is not in state.
            /* crashes on loading because old model and new model have different timestamps? looks by id of old model with same number and diffferent timestamp*/
            Log.eDev(!ret.data, "can't find model data:", {state, ret, ownpropsdata:ownProps.data, ownProps});
            Log.eDevv("cannot map state to props:", {e, state, ret, ownpropsdata:ownProps.data, ownProps});
        }
        return ret; }

    constructor(props: AllProps, context: any) { super(props, context); }

    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<NodeState>, nextContext: any): boolean {
        // i want to avoid double check on this and Vertex or graph.
        // actually should not use this and avoid double mapstatetoprops execution too
        return true;
    }

    render(): ReactNode {
        if ((this.props as any).skiparenderforloading) {
            console.log("realoading render: ", {thiss:this, data:this.props.data});
            windoww.bugged = this;
            console.log("realoading render: ", {thiss:this, data:this.props.data});
            SetRootFieldAction.new("rerenderforloading", new Date().getTime()); return <div>loading...</div>;}
        const view: LViewElement = this.props.view;
        const modelElement: LModelElement | undefined = this.props.data;
        if (!view) { Log.exx({props: this.props, thiss:this}); }
        // if (!view) { SetRootFieldAction.new("uselessrefresh_afterload", new Date().getTime()); return <div>Loading...</div>; }

        let componentMap: Dictionary<string, (props: GObject, children?: (string | React.Component)[]) => ReactElement> = windoww.components;
        let dmodelMap: Dictionary<string, typeof DModelElement> = RuntimeAccessibleClass.classes as any;

        let serializableProps = {...this.props, data: this.props.data?.id, view: this.props.view?.id, views: this.props.views?.map( v => v.id )};
        // console.log('dnode render', {props: {...this.props}, serializableProps});
        let componentfunction: typeof Graph = null as any;
        if (view.forceNodeType) {
            switch (view.forceNodeType) {
                default: Log.exDevv('unrecognized View.forceNodeType:' + view.forceNodeType, {view, modelElement});
                return <div>dev error</div>
                case "Graph": case "GraphComponent": componentfunction = Graph; break;
                // case windoww.GraphElementComponent.cname:
                case windoww.VertexComponent.cname: componentfunction = Vertex; break;
                case windoww.FieldComponent.cname: componentfunction = Field; break;
                case windoww.GraphVertexComponent.cname: componentfunction = GraphVertex; break; }
            // console.log("force node type", {requested:view.forceNodeType, G:  windoww.GraphComponent.name, GE: windoww.GraphElementComponent.name, GV: windoww.GraphVertexComponent.name, V: windoww.VertexComponent.name, F:windoww.FieldComponent.name})
            return componentfunction(serializableProps, this.props.children); }

        if (modelElement?.className) switch(modelElement.className) {
            case "DModel": componentfunction = Graph; break;
            case "DPackage": componentfunction = GraphVertex; break;
            case "DClassifier":
            case "DEnumerator":
            case "DObject":
            case "DClass": componentfunction = Vertex; break;
            case "DAnnotation":
            case "DAttribute":
            case "DOperation":
            case "DParameter":
            case "DReference":
            case "DEnumLiteral":
            case "DValue":
            case "DModelElement": componentfunction = Field; break;
            default:
                Log.exDevv('invalid model class, add a case in the switch', {modelElement, view, dmodelMap, componentMap});
                // const dmodel: typeof DModelElement = dmodelMap[modelElement.className];
                // Log.exDev(!dmodel || !dmodel.defaultComponent, 'invalid model class:', {dmodel, modelElement, view, dmodelMap, componentMap});
                // return dmodel.defaultComponent(serializableProps, this.props.children);
        } else componentfunction = VoidVertex; // model-less, VoidVertex

        if (componentfunction) return componentfunction(serializableProps, this.props.children);
        // errore: questoon passa gli id correttamente al sottoelemento vertex o field
        return DV.errorView("Error: DefaultNode is missing both view and model, please state node type explicitly: Graph, GraphVertex, Vertex or Field");
    }

}

// private
class DefaultNodeOwnProps extends GraphElementOwnProps {}
class DefaultNodeReduxStateProps  extends GraphElementReduxStateProps {}
class DefaultNodeDispatchProps extends GraphElementDispatchProps {}
type AllPropss = DefaultNodeOwnProps & DefaultNodeReduxStateProps & DefaultNodeDispatchProps;


const DefaultNodeConnected = connect<DefaultNodeReduxStateProps, DefaultNodeDispatchProps, DefaultNodeOwnProps, DState>(
    DefaultNodeComponent.mapStateToProps,
    DefaultNodeComponent.mapDispatchToProps
)(DefaultNodeComponent as any);
// export const Vertex = VertexConnected;


export const DefaultNode = (props: DefaultNodeOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <DefaultNodeConnected {...{...props, children}} />; }


DefaultNodeComponent.cname = "DefaultNodeComponent";
DefaultNodeConnected.cname = "DefaultNodeConnected";
DefaultNode.cname = "DefaultNode";

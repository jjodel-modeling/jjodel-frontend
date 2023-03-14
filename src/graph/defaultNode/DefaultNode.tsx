import React, {CSSProperties, Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import {
    U,
    IStore,
    Log,
    windoww,
    LViewElement,
    RuntimeAccessibleClass,
    LModelElement,
    Dictionary,
    GObject,
    DModelElement,
    DEnumerator,
    DClassifier,
    DPackage,
    DModel, Vertex, SetRootFieldAction,
} from "../../joiner";
import {
    GraphElementStatee,
    GraphElementDispatchProps,
    GraphElementReduxStateProps,
    GraphElementOwnProps,
    GraphElementComponent,
} from "../../joiner";
import {Field, Graph, GraphVertex} from "../vertex/Vertex";

const superclass: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;

// private
class DefaultNodeStatee extends GraphElementStatee { }

// from ownstateprops function getVertexID(props: AllPropss): Pointer<DVoidVertex, 0, 1, LVoidVertex> { return props.vertex?.id; }

export class DefaultNodeComponent<AllProps extends AllPropss = AllPropss, NodeState = DefaultNodeStatee>
    extends superclass<AllProps, NodeState>{


    static mapStateToProps(state: IStore, ownProps: GraphElementOwnProps): GraphElementReduxStateProps {
        let ret: GraphElementReduxStateProps = {} as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        GraphElementComponent.mapLModelStuff(state, ownProps, ret); // not necessary either?
        console.log("loading model: " + ret.data?.id);
        // GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass); not necessary, it's demanded to sub-components
        try{
            GraphElementComponent.mapViewStuff(state, ret, ownProps);
            (ret as any).skiparenderforloading = false;
        } catch(e) {
            (ret as any).skiparenderforloading = true; // model id is updated, but he's still trying to load old model which got replaced and is not in state.
            /* crashes on loading because old model and new model have different timestamps? looks by id of old model with same number and diffferent timestamp
        Log.ex(!ret.data, "can't find model data:", {meid, state, ownpropsdata:ownProps.data, ownProps});*/ }
        console.log("realoading mapstate: ", (ret as any).skiparenderforloading, ret.data, ownProps.data);
        return ret; }

    constructor(props: AllProps, context: any) { super(props, context); }

    render(): ReactNode {
        if ((this.props as any).skiparenderforloading) {
            console.log("realoading render: ", {thiss:this, data:this.props.data});
            windoww.bugged = this;
            console.log("realoading render: ", {thiss:this, data:this.props.data});
            SetRootFieldAction.new("rerenderforloading", new Date().getTime()); return <div>loading...</div>;}
        const view: LViewElement = this.props.view;
        const modelElement: LModelElement = this.props.data;
        if (!view) { Log.exx({props: this.props, thiss:this}); }
        // if (!view) { SetRootFieldAction.new("uselessrefresh_afterload", new Date().getTime()); return <div>Loading...</div>; }

        let componentMap: Dictionary<string, (props: GObject, childrens?: (string | React.Component)[]) => ReactElement> = windoww.components;
        let dmodelMap: Dictionary<string, typeof DModelElement> = RuntimeAccessibleClass.classes as any;

        let serializableProps = {...this.props, data: this.props.data?.id, view: this.props.view?.id, views: this.props.views?.map( v => v.id )};
        // console.log('dnode render', {props: {...this.props}, serializableProps});
        if (view.forceNodeType) switch (view.forceNodeType) {
            default: Log.exDevv('unrecognized View.forceNodeType:' + view.forceNodeType, {view, modelElement});
            return <div>dev error</div>
            case windoww.Components.GraphElementComponent.name:
            case windoww.Components.VertexComponent.name:
            case windoww.Components.FieldComponent.name: return componentMap[view.forceNodeType](this.props, this.props.children);
        }

        let componentfunction: typeof Graph = null as any;
        if (modelElement?.className) switch(modelElement.className) {
            case "DModel": componentfunction = Graph; break;
            case "DPackage": componentfunction = GraphVertex; break;
            case "DClassifier":
            case "DEnumerator":
            case "DClass": componentfunction = Vertex; break;
            case "DAnnotation":
            case "DAttribute":
            case "DOperation":
            case "DParameter":
            case "DReference":
            case "DEnumLiteral":
            case "DModelElement": componentfunction = Field; break;
            default:
                Log.exDevv('invalid model class, add a case in the switch', {modelElement, view, dmodelMap, componentMap});
                // const dmodel: typeof DModelElement = dmodelMap[modelElement.className];
                // Log.exDev(!dmodel || !dmodel.defaultComponent, 'invalid model class:', {dmodel, modelElement, view, dmodelMap, componentMap});
                // return dmodel.defaultComponent(serializableProps, this.props.children);
        }
        if (componentfunction) return componentfunction(serializableProps, this.props.children);
        // errore: questoon passa gli id correttamente al sottoelemento vertex o field
        return (<>Error: Node is missing both view and model</>);
    }

}

// private
class DefaultNodeOwnProps extends GraphElementOwnProps {}
class DefaultNodeReduxStateProps  extends GraphElementReduxStateProps {}
class DefaultNodeDispatchProps extends GraphElementDispatchProps {}
type AllPropss = DefaultNodeOwnProps & DefaultNodeReduxStateProps & DefaultNodeDispatchProps;


const DefaultNodeConnected = connect<DefaultNodeReduxStateProps, DefaultNodeDispatchProps, DefaultNodeOwnProps, IStore>(
    DefaultNodeComponent.mapStateToProps,
    DefaultNodeComponent.mapDispatchToProps
)(DefaultNodeComponent as any);
// export const Vertex = VertexConnected;


export const DefaultNode = (props: DefaultNodeOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <DefaultNodeConnected {...{...props, childrens}} />; }

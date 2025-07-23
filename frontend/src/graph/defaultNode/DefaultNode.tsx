import React, {ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DClassifier,
    DEnumerator,
    Dictionary,
    DModel,
    DModelElement,
    DPackage,
    DV,
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
    RuntimeAccessibleClass,
    SetRootFieldAction,
    windoww,
    Field,
    Graph,
    GraphVertex,
    Vertex,
    VoidVertex,
    RuntimeAccessible,
    Polygon,
    Circle,
    Cross,
    Decagon,
    Asterisk,
    Ellipse,
    Enneagon,
    Hexagon,
    Nonagon,
    Octagon,
    Heptagon,
    Pentagon,
    Rectangle,
    Septagon,
    Square,
    Star,
    SimpleStar,
    DecoratedStar,
    Trapezoid,
    Triangle,
    Selectors,
    LPointerTargetable,
    Pointer,
    DGraphElement,
    DPointerTargetable, LGraphElement, transientProperties, DataTransientProperties
} from "../../joiner";
import { GraphElements } from "../../joiner/components";
// import {Field, Graph, GraphVertex} from "../vertex/Vertex";

const superclass: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;

// private
class DefaultNodeStatee extends GraphElementStatee { }

// from ownstateprops function getVertexID(props: AllPropss): Pointer<DVoidVertex, 0, 1, LVoidVertex> { return props.vertex?.id; }

// Giordano: add ignore for webpack
@RuntimeAccessible('DefaultNodeComponent')
//@ts-ignore
export class DefaultNodeComponent<AllProps extends AllPropss = AllPropss, NodeState = DefaultNodeStatee> extends superclass<AllProps, NodeState>{
    static defaultProps: Partial<DefaultNodeOwnProps> = {}; // cannot decide anything on this level, delegated to lower levels.

    static mapStateToProps(state: DState, ownProps: GraphElementOwnProps): GraphElementReduxStateProps {
        let ret: GraphElementReduxStateProps = {} as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        // GraphElementComponent.mapLModelStuff(state, ownProps, ret); // not necessary either?
        // GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass); not necessary, it's demanded to sub-components
/*        ret.data = LPointerTargetable.wrap(ownProps.data);
        ret.node = undefined as any; // because DefaultNode is all about determining the correct node to create, so there is no node yet.
        ret.nodeid = ownProps.nodeid as Pointer<DGraphElement>; // but nodeid exists, passed from the parent along graphid and parentview
*/
        // try{
        ret.data = LPointerTargetable.wrap(ownProps.data) as LModelElement;
        ret.dataid = ownProps.data ? (typeof ownProps.data === "string" ? ownProps.data : ownProps.data.id) : undefined;
        // if node does not exist yet it's fine, don't create it. let Vertex or Graph or Edge make it with appropriate constructor according fo first matching view on model.
        // problem: what kind of node to make / initial view assign on shapeless objects? they have both data and node undefined at first render.
        ret.node = LPointerTargetable.wrap(ownProps.nodeid) as LGraphElement;
        if (ret.dataid) {
            // set up transient model-> node map
            let tm = transientProperties.modelElement[ret.dataid];
            if (!tm) transientProperties.modelElement[ret.dataid] = tm = new DataTransientProperties();
            tm.nodes[ownProps.nodeid as string] = ret.node;
            tm.node = ret.node;
        }

        GraphElementComponent.mapViewStuff(state, ret, ownProps);

            // GraphElementComponent.mapViewStuff(state, ret, ownProps);
            // (ret as any).skiparenderforloading = false;
        //} catch(e) {
            //(ret as any).skiparenderforloading = true; // model id is updated, but he's still trying to load old model which got replaced and is not in state.
            /* crashes on loading because old model and new model have different timestamps? looks by id of old model with same number and diffferent timestamp*/
            // Log.eDev(!ret.data, "can't find model data:", {state, ret, ownpropsdata:ownProps.data, ownProps});
            // Log.eDevv("cannot map state to props:", {e, state, ret, ownpropsdata:ownProps.data, ownProps});
        //}
        return ret; }

    constructor(props: AllProps, context?: any) { super(props, context); }

    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<NodeState>, nextContext: any): boolean {
        // i want to avoid double check on this and Vertex or graph.
        // actually should not use this and avoid double mapstatetoprops execution too
        return true;
    }

    render(): ReactNode {
        if ((this.props as any).skiparenderforloading) {
            windoww.bugged = this;
            console.log("realoading render: ", {thiss:this, data:this.props.data});
            SetRootFieldAction.new("rerenderforloading", new Date().getTime()); return <div>loading...</div>;}
        const view: LViewElement = this.props.view;
        const modelElement: LModelElement | undefined = this.props.data;
        if (!view) { Log.exx("cannot find view in DefaultNode", {props: this.props, thiss:this}); }
        // if (!view) { SetRootFieldAction.new("uselessrefresh_afterload", new Date().getTime()); return <div>Loading...</div>; }

        let componentMap: Dictionary<string, (props: GObject, children?: ReactNode) => ReactElement> = windoww.components;
        let dmodelMap: Dictionary<string, typeof DModelElement> = RuntimeAccessibleClass.classes as any;

        let serializableProps = {...this.props};
        // let serializableProps = {...this.props, data: this.props.data?.id, view: this.props.view?.id, views: this.props.views?.map( v => v.id )};

        // console.log('dnode render', {props: {...this.props}, serializableProps});
        let componentfunction: typeof Graph = null as any;
        let forceNodeType = view.forceNodeType;
        if (forceNodeType && forceNodeType !== "Any") {
            componentfunction = GraphElements[forceNodeType] as any;
            Log.exDev(!componentfunction, 'unrecognized View.forceNodeType:' + view.forceNodeType, {view, modelElement, nt: forceNodeType, GraphElements, });
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
        return DV.errorView("DefaultNode is missing both view and model, please state node type explicitly: Graph, GraphVertex, Vertex or Field",
            '', 'DefaultNode', modelElement?.__raw, this.props.node?.__raw, view);
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


export const DefaultNode = (props: DefaultNodeOwnProps, children: ReactNode = []): ReactElement => {
    let props2 = {...props, children};
    // @ts-ignore
    delete props2.key;
    return <DefaultNodeConnected {...props2} />; }


DefaultNodeComponent.cname = "DefaultNodeComponent";
DefaultNodeConnected.cname = "DefaultNodeConnected";
DefaultNode.cname = "DefaultNode";

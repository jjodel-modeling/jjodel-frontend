import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {
    DGraph,
    DGraphElement,
    DGraphVertex,
    DVoidVertex,
    GraphElementComponent,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    DState,
    LClass,
    LModelElement,
    LPointerTargetable,
    LUser,
    LVoidVertex,
    RuntimeAccessibleClass, LViewPoint,
    U, GraphSize, GraphPoint, GObject, Size, SetRootFieldAction, SetFieldAction, DVertex, DVoidEdge, DEdgePoint,
} from "../../joiner";
import $ from "jquery";
import "jqueryui";
import "jqueryui/jquery-ui.css";
import {DamEdge} from "../damedges/damedge";

const superclassGraphElementComponent: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;
class ThisStatee extends GraphElementStatee { forceupdate?: number }

var dragHelper = document.createElement("div");
dragHelper.style.backgroundColor = "transparent";
dragHelper.style.outline = "4px solid black";

export class VertexComponent<AllProps extends AllPropss = AllPropss, ThisState extends ThisStatee = ThisStatee>
    extends superclassGraphElementComponent<AllProps, ThisState> {

    /*
    shouldComponentUpdate(newProps: Readonly<AllProps>, newState: Readonly<ThisState>, newContext: any): boolean {
        const oldProps = this.props;
        const newData = newProps.data; const oldData = oldProps.data;
        const newNode = newProps.node; const oldNode = oldProps.node;
        const newViewpoint = newProps.viewpoint; const oldViewpoint = oldProps.viewpoint;
        const newEdgePending = newProps.isEdgePending; const oldEdgePending = oldProps.isEdgePending;

        if(newData.__raw !== oldData.__raw) return true;
        if(newNode?.__raw !== oldNode?.__raw) return true;
        if(newViewpoint.__raw !== oldViewpoint.__raw) return true;
        if(newEdgePending !== oldEdgePending) return true;
        return false;
    }
     */

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.getSize = this.getSize.bind(this);
        this.setSize = this.setSize.bind(this);
        // this.state={forceupdate:1};
        setTimeout(()=>{
            this.getSize = this.getSize.bind(this);
            this.setSize = this.setSize.bind(this);
            // this.get_size = console.error as any;
            // this.r = (<RootVertex props={this.props} render={super.render()} super={this} />);
            this.forceUpdate();
            this.setState({forceupdate:2});
        },1)
    }


    setVertexProperties(){
        if(!this.props.node || !this.html.current) return;
        if (this.hasSetVertexProperties) return;
        this.hasSetVertexProperties = true;

        let html = this.html.current;

        const $measurable: GObject<"JQuery + ui plugin"> = $(html); // todo: install typings
        // $element = $(html).find(".measurable").addBack();
        console.log("$$$", $);
        $measurable.draggable({
            cursor: 'grabbing',
            containment: 'parent',
            opacity: 0.0,
            disabled: !(this.props.view.draggable),
            distance: 5,
            helper: () => { // or "clone",
                // dragHelper.style.display="block";
                let size = this.getSize();
                // let actualSize = Size.of(html);
                // if (size.w !== actualSize.w || size.h !== actualSize.h) this.setSize({w:actualSize.w, h:actualSize.h});
                dragHelper.style.width = size.w+"px";
                dragHelper.style.height = size.h+"px";
                dragHelper.style.opacity = this.props.view.constraints.length ? "1" : "0.5";
                if (this.props.view.lazySizeUpdate) dragHelper.classList.add("lazySizeUpdate");
                else dragHelper.classList.remove("lazySizeUpdate");
                return dragHelper;
            },

            // disabled: !(view.draggable),
            start: (event: GObject, obj: GObject) => {
                // this.select();
                SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 }); // todo: should probably be done in a document event
                if (this.props.view.onDragStart) {
                    try{ eval(this.props.view.onDragStart); } // todo: eval in context
                    catch (e) { console.log(e) }
                }
            },
            drag: (event: GObject, obj: GObject) => {
                if (!this.props.view.lazySizeUpdate) this.setSize({x:obj.position.left, y:obj.position.top});
            },
            stop: (event: GObject, obj: GObject) => {
                console.log("drag stop setsize", {x:obj.position.left, y:obj.position.top});
                this.setSize({x:obj.position.left, y:obj.position.top});
                if (this.props.view.onDragEnd) {
                    try{ eval(this.props.view.onDragEnd); } // todo: eval in context
                    catch (e) { console.log(e) }
                }
            }
        });
        let resizeoptions: GObject = {
            disabled: !(this.props.view.resizable),
            start: (event: GObject, obj: GObject) => {
                this.select();
                if (!this.props.node.isResized) this.props.node.isResized = true; // set only on manual resize, so here and not on setSize()
                SetRootFieldAction.new("contextMenu", { display: false, x: 0, y: 0 });
                if (this.props.view.onResizeStart) {
                    try{ eval(this.props.view.onResizeStart); }
                    catch (e) { console.log(e) }
                }
            },
            resize: (event: GObject, obj: GObject) => {
                if (!this.props.view.lazySizeUpdate) this.setSize({w:obj.position.width, h:obj.position.height});
                // SetRootFieldAction.new("resizing", {})
            },
            stop: (event: GObject, obj: GObject) => {
                if (!this.state.classes.includes("resized")) this.setState({classes:[...this.state.classes, "resized"]});
                // if (!withSetSize) { node.width = obj.size.width; node.height = obj.size.height; } else {
                this.setSize({w:obj.size.width, h:obj.size.height});
                // console.log("resize setsize:", obj, {w:obj.size.width, h:obj.size.height});
                if (this.props.view.onResizeEnd) {
                    try{ eval(this.props.view.onResizeEnd); }
                    catch (e) { console.log(e) }
                }
            }
        }

        if (this.props.view.lazySizeUpdate) {
            // this does not accept a func or htmlElem, but only a classname...
            // and makes his own empty proxy element to resize in his place. inchoherent.
            resizeoptions.helper = "resizable-helper-bad";
        }
        else {
            resizeoptions.containment = 'parent';
        }
        $measurable.resizable(resizeoptions);

    }



    getSize(): Readonly<GraphSize> {
        return this.props.node.size;
        /*console.log("get_size("+(this.props?.data as any).name+")", {
            view:this.props.view.getSize(this.props.dataid || this.props.nodeid as string),
            node:this.props.node?.size,
            default: this.props.view.defaultVSize});*/

        let ret = this.props.view.getSize(this.props.dataid || this.props.nodeid as string)
            || this.props.node?.size
            || this.props.view.defaultVSize;
        if (this.props.node.isResized) return ret;
        let actualSize: Partial<Size>&{w:number, h:number} = this.html.current ? Size.of(this.html.current as Element) : {w:0, h:0};
        if (this.props.view.adaptWidth && ret.w !== actualSize.w) {
            this.setSize({w:actualSize.w});
            ret.w = actualSize.w;
        }
        if (this.props.view.adaptHeight && ret.h !== actualSize.h) {
            this.setSize({h:actualSize.h});
            ret.h = actualSize.h;
        }
        return ret;
    }
    // setSize(x_or_size_or_point: number, y?: number, w?:number, h?:number): void;
    setSize(x_or_size_or_point: Partial<GraphPoint>): void;
    setSize(x_or_size_or_point: Partial<GraphSize>): void;
    // setSize(x_or_size_or_point: number | GraphSize | GraphPoint, y?: number, w?:number, h?:number): void;
    setSize(size0: Partial<GraphSize> | Partial<GraphPoint>): void {
        return this.props.node.size = size0 as any;
        // console.log("setSize("+(this.props?.data as any).name+") thisss", this);
        let size: Partial<GraphSize> = size0 as Partial<GraphSize>;
        if (this.props.view.storeSize) {
            let id = (this.props.dataid || this.props.nodeid) as string;
            this.props.view.updateSize(id, size);
            return;
        }
        let olds = this.props.node.size;
        size.x = size.x === undefined ? olds?.x : size.x;
        size.y = size.y === undefined ? olds?.y : size.y;
        size.w = size.w === undefined ? olds?.w : size.w;
        size.h = size.h === undefined ? olds?.h : size.h;
        this.props.node.size = size as GraphSize;
    }

    render(): ReactNode {
        if (!this.props.node) return "loading";

        // if(!windoww.cpts) windoww.cpts = {};
        // windoww.cpts[this.props.nodeid]=this;
        // console.log("updated");
        //return this.r || <div>loading...</div>;

        // set classes
        let nodeType = "NODE_TYPE_ERROR";
        if ( this.props.isEdgePoint) nodeType = "EdgePoint"; else
        if ( this.props.isGraph &&  this.props.isVertex) nodeType = "GraphVertex"; else
        if ( this.props.isGraph && !this.props.isVertex) nodeType = "Graph"; else
        if (!this.props.isGraph &&  this.props.isVertex && (this.props.isVoid || !this.props.data)) nodeType = "VoidVertex"; else
        if (!this.props.isGraph &&  this.props.isVertex) nodeType = "Vertex"; else
        if (!this.props.isGraph && !this.props.isVertex) nodeType = "Field";
        let classesoverride = [nodeType];
        // set classes end
        let size: Readonly<GraphSize> = this.getSize() as any;
        let styleoverride: React.CSSProperties = {}
        switch (nodeType){
            case "GraphVertex":
            case "Vertex":
            case "VoidVertex":
            case "EdgePoint":
                if (false && nodeType === "EdgePoint") {
                    styleoverride.top = (size.y - size.h/2)+ "px";
                    styleoverride.left = (size.x - size.w/2) + "px";
                }
                else {
                    styleoverride.top = size.y + "px";
                    styleoverride.left = size.x + "px";
                }
                let isResized = this.props.node.isResized;
                if (isResized || !this.props.view.adaptWidth) styleoverride.width = size.w+"px";
                else styleoverride.width = undefined;
                if (isResized || !this.props.view.adaptHeight) styleoverride.height = size.h+"px";
                else styleoverride.height = undefined; // todo: the goal is to reset jqui inline style, but not override user-defined inline style
                this.setVertexProperties(); break;
            default: break;
        }


        return super.render(nodeType, styleoverride, classesoverride);
        // return <RootVertex props={this.props} render={super.render()} super={this} key={this.props.nodeid+"."+this.state?.forceupdate} />;
    }
}

class OwnProps extends GraphElementOwnProps {
    // onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    // onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isEdgePoint?: boolean = false;
    isGraph?: boolean = false;
    isVertex?: boolean = true;
    isVoid?: boolean = false;
}

class StateProps extends GraphElementReduxStateProps {
    node!: LVoidVertex;
    lastSelected!: LModelElement | null;
    isEdgePending!: { user: LUser, source: LClass };
    viewpoint!: LViewPoint
}

class DispatchProps extends GraphElementDispatchProps {
}

export type AllPropss = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    let DGraphElementClass: typeof DGraphElement;
    if (ownProps.isEdgePoint) DGraphElementClass = DEdgePoint; else
    if (ownProps.isVertex && ownProps.isGraph) DGraphElementClass = DGraphVertex; else
    if (ownProps.isVertex && !ownProps.isGraph) DGraphElementClass = DVertex; else
    if (!ownProps.isVertex && ownProps.isGraph) DGraphElementClass = DGraph;
    else DGraphElementClass = DGraphElement; // DField;

    if (DGraphElementClass === DVertex && ownProps.isVoid) DGraphElementClass = DVoidVertex;
    const superret: StateProps = GraphElementComponent.mapStateToProps(state, ownProps, DGraphElementClass) as StateProps;
    //superret.lastSelected = state._lastSelected?.modelElement;
    superret.lastSelected = state._lastSelected ? LPointerTargetable.from(state._lastSelected.modelElement) : null;
    superret.isEdgePending = {
        user: LPointerTargetable.from(state.isEdgePending.user),
        source: LPointerTargetable.from(state.isEdgePending.source)
    };
    // superret.viewpoint = LViewPoint.fromPointer(state.viewpoint);
    const ret: StateProps = new StateProps();
    U.objectMergeInPlace(superret, ret);
    U.removeEmptyObjectKeys(superret);
    return superret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const superret: GraphElementDispatchProps = GraphElementComponent.mapDispatchToProps(dispatch);
    const ret: GraphElementDispatchProps = new GraphElementDispatchProps();
    U.objectMergeInPlace(superret, ret);
    U.removeEmptyObjectKeys(superret);
    return superret;
}


export const VertexConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(VertexComponent as any);

export const Vertex = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, children}} isGraph={false} isVertex={true}/>;
}
export const VoidVertex = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, children}} isGraph={false} isVertex={true} isVoid={true}/>;
}
export const EdgePoint = function EdgePoint (props: OwnProps, children: (string | React.Component)[] = []): ReactElement {
    return <VertexConnected {...{...props, children}} isGraph={false} isEdgePoint={true}/>;
}
// todo: name them all or verify the name is still usable.

export const Graph = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => { // doesn't work?
    return <VertexConnected {...{...props, children}} isGraph={true} isVertex={false} />;
}

export const GraphVertex = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, children}} isGraph={true} isVertex={true} />;
}

export const Field = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, children}} isGraph={false} isVertex={false} />;
}
(window as any).componentdebug = {Graph, GraphVertex, Field, Vertex, VoidVertex, EdgePoint, VertexConnected, VertexComponent};
/*
let windoww = window as any;

windoww.VoidVertex = VoidVertex;
windoww.Vertex = Vertex;
// windoww.Graph = Graph;
windoww.GraphVertex = GraphVertex;
windoww.Field = Field;

windoww.VoidVertexComponent = VoidVertex;
windoww.VertexComponent = Vertex;
// windoww.GraphComponent = Graph;
windoww.GraphVertexComponent = GraphVertex;
windoww.FieldComponent = Field;*/


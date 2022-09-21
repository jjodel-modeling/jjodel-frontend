import React, {CSSProperties, Dispatch, MouseEventHandler, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import './vertex.scss';
// import {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from "../graphElement/sharedTypes/sharedTypes";

import {
    U,
    IStore,
    GraphSize,
    Pointer,
    DModelElement,
    DUser,
    Log,
    windoww,
    GraphDragHandler,
    LVoidVertex,
    Point,
    GraphPoint,
    IPoint,
    LViewElement,
    GraphElementStatee,
    GraphElementDispatchProps,
    GraphElementReduxStateProps,
    GraphElementOwnProps,
    GraphElementComponent,
    Overlap,
    RuntimeAccessibleClass,
    SetRootFieldAction,
    LGraph,
    DVoidVertex,
    defaultVSize,
    MyProxyHandler,
    DClass,
    DClassifier,
    GObject,
    DPackage,
    DModel,
    DGraphElement,
    DVertex,
    DGraph,
    DGraphVertex,
    SetFieldAction
} from "../../joiner";
import Draggable from 'react-draggable';
import ToolButton from "../toolButton/ToolButton";
const superclassGraphElementComponent: typeof GraphElementComponent = RuntimeAccessibleClass.classes.GraphElementComponent as any as typeof GraphElementComponent;



// private
class VertexStatee extends GraphElementStatee {
    // displayPosition: GraphSize; // position including graph offset
    draggingTempPosition?: GraphSize; // temp position until redux state is updated at drag end

    /*
    constructor(preRenderFunc: string | undefined, evalContext: GObject, templatefunc: () => React.ReactNode, id: string) {
        super(preRenderFunc, evalContext, templatefunc);
        this.vertexid = id;
    }*/
    constructor (size: GraphSize) {
        super();
        // this.displayPosition = size;
    }
}

// from ownstateprops function getVertexID(props: AllPropss): Pointer<DVoidVertex, 0, 1, LVoidVertex> { return props.vertex?.id; }

export class VertexComponent<AllProps extends AllPropss = AllPropss, VertexState extends VertexStatee = VertexStatee>
    extends superclassGraphElementComponent<AllProps, VertexState>{
    ////// mapper func
    public suspendRender: boolean = false;
    static mapStateToProps(state: IStore, ownProps: VertexOwnProps): VertexReduxStateProps {
        // console.log('dragx vertex mapstate', {DVoidVertex});
        let DGraphElementClass: typeof DGraphElement;
        if (ownProps.isVertex && ownProps.isGraph) DGraphElementClass = DGraphVertex;
        else if (ownProps.isVertex && !ownProps.isGraph) DGraphElementClass = DVoidVertex; // DVertex
        else if (!ownProps.isVertex && ownProps.isGraph) DGraphElementClass = DGraph;
        else DGraphElementClass = DGraphElement;
        const superret: VertexReduxStateProps = GraphElementComponent.mapStateToProps(state, ownProps, DGraphElementClass) as VertexReduxStateProps;
        const ret: VertexReduxStateProps = new VertexReduxStateProps();
        // console.log('Verx mapstate', {ret, superret, state, ownProps});
        Log.exDev(!ownProps.nodeid, 'node id is undefined', {ownProps});
        ////// begin vertex-specific code (currently none)
        /*
        const vid: Pointer<DVoidVertex, 1, 1, LVoidVertex> =
            U.increaseEndingNumber(superret.view.id + '^' + superret.data.id, false, false, increaseokcondition)
        // todo: dove cavolo lo genero sto id? nel clone dei figli del grafo con inject?
        superret.node = PointerTargetable.wrap(state.idlookup[ownProps.nodeid]);*/

        U.objectMergeInPlace(superret, ret);
        U.removeEmptyObjectKeys(superret);
        return superret; }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const superret: GraphElementDispatchProps = GraphElementComponent.mapDispatchToProps(dispatch);
        const ret: GraphElementDispatchProps = new GraphElementDispatchProps();
        U.objectMergeInPlace(superret, ret);
        U.removeEmptyObjectKeys(superret);
        return superret;
    }

    private readonly parentRef: React.RefObject<HTMLDivElement>;

    constructor(props: AllProps, context: any) {
        super(props, context);
        if (!GraphDragHandler.singleton) { GraphDragHandler.init(); }
        this.parentRef = React.createRef();
        let view: LViewElement = this.props.view;
        view.defaultVSize = new GraphSize();
        let initialState: VertexStatee = { draggingTempPosition: undefined };
        // @ts-ignore
        this.state = initialState;

    }


    getVertex(): LVoidVertex { return this.props.node; }
    private onclick_graph = (e: React.MouseEvent<HTMLDivElement>): void => {
        console.log('graph evt click');
    }
    private onclick_vertex = (e: React.MouseEvent<HTMLDivElement>): void => {
        console.log('vertex evt click');
    }

    private onmousedown_graph = (e:React.MouseEvent<HTMLDivElement>): void => {
        console.log('graph evt mousedown'); }

    private onmousedown_vertex = (e:React.MouseEvent<HTMLDivElement>): void => {
        console.log('vertex evt mousedown');
        (e.nativeEvent as any).clickedOnVertex = true;
        windoww.mp = this.props.data;
        windoww.selected = this;
        if (e.shiftKey || e.ctrlKey) {
            console.log('mousedown select() check:', {isSelected:this.isSelected(), 'nodeIsSelectedMapProxy': this.props.node?.isSelected, nodeIsSelectedRaw:this.props.node?.__raw.isSelected});
            if (this.isSelected()) { this.deselect(); return; }
            this.select();
            return; }
        this.select();
        console.log('vertex evt mousedown start drag');
        GraphDragHandler.singleton.startDragging(e, undefined && this.props.node.__raw);
        // this.clearCurrentUserSelection();
    }

    private onclick = (e: React.MouseEvent<HTMLDivElement>): void => {
        if (this.props.isVertex) this.onclick_vertex(e);
        if (this.props.isGraph) this.onclick_graph(e);
        this.props.onclick?.(e);

        // e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopPropagation();
    }

    private onmousedown = (e: React.MouseEvent<HTMLDivElement>): void => {
        if (this.props.isVertex) this.onmousedown_vertex(e);
        if (this.props.isGraph) this.onmousedown_graph(e);
        this.props.onmousedown?.(e);

        // e.preventDefault();
        e.stopPropagation();
        e.nativeEvent.stopPropagation();

        console.log('vertex mousedown stop evt', e);
    }

    private getMpID(): Pointer<DModelElement> {
        return this.props.data.id;
    }

    componentDidUpdate(prevProps: Readonly<AllProps>, prevState: Readonly<VertexState>, snapshot?: any): void {
        if (!this.props.nodeid) return;
        GraphDragHandler.singleton.vertexToComponent[this.props.nodeid as string] = this;
    }
    componentWillUnmount(): void {
        super.componentWillUnmount();
        // send redux action to delete vertex
        delete GraphDragHandler.singleton.vertexToComponent[this.props.nodeid as string];
    }


    render(): ReactNode {
        // const htmlsize: Size | null = this.parentRef.current && Size.of(this.parentRef.current);
        console.log('Verx render', {props: this.props, view: this.props.view});
        const vsize: GraphSize | undefined = this.getCurrentVPosIncludingPanAndZoom();
        // const viewTransient = this.props.view.__transient;

        const sizestyle: CSSProperties = { display: 'flex', flexWrap: "wrap"};
        if (this.props.isVertex) {
            sizestyle.transform = '';
            if (!vsize) {
                // sizestyle.display = 'none';
                sizestyle.backgroundColor = 'black';
            } else {
                if (false && this.props.view.scalezoomy) sizestyle.transform += " scaleY(0.?)";
                //else sizestyle.height = vsize.h + "px"
                else{
                    sizestyle.height = "auto"
                }

                if (false && this.props.view.scalezoomx) sizestyle.transform += " scaleX(0.?)";
                //else sizestyle.width = vsize.w + "px"
                else{
                    sizestyle.height = "auto"
                }
                sizestyle.top = vsize.y + "px";
                sizestyle.left = vsize.x + "px";
            }
        }
        // sizestyle.border = "2px solid gray";
        // sizestyle.borderColor = this.props.node?.isSelected[DUser.current] ? 'blue' : 'black';
        console.log('isSelected ? ', this.props.node && this.props.node.isSelected, this.props.node?.__raw.isSelected);

        let classes: string[] = this.props.class ? (Array.isArray(this.props.class) ? this.props.class : [this.props.class]) : [];
        if (this.props.className) U.arrayMergeInPlace(classes, Array.isArray(this.props.className) ? this.props.className : [this.props.className])
        classes.push("vertex");
        if (this.isSelected()) classes.push("selected");


        let autosizey = true;
        let autosizex = false;

        let overlapChildStyle: any = {};
        if (autosizex) {
            overlapChildStyle.display = 'inline-flex';
            overlapChildStyle.width = 'min-content';
            sizestyle.width = 'min-content';
        }
        else {
            overlapChildStyle.width = '100%';
            overlapChildStyle.display = 'block';
        }
        if (autosizey) {
            overlapChildStyle.height = 'min-content';
            sizestyle.height = 'auto';
        }
        else {
            overlapChildStyle.height = '100%';
        }

        if (this.props.isGraph && !this.props.isVertex) {
            sizestyle.width = '100%';
            sizestyle.height = '100%';
            sizestyle.flexGrow = 1;
            sizestyle.overflow = 'hidden';
        }
        if (sizestyle.width === '0px' || sizestyle.height === '0px') {
            sizestyle.overflow= 'hidden';
        }
        //onMouseDown={this._dragStart} onMouseMove={this._dragging} onMouseUp={this._dragEnd}
        const className = this.props.data.className;
        if(className === "DClass" || className === "DEnumerator")
            return (<Draggable>
                <div
                    id={this.props.nodeid}
                    data-dataid={this.props.data?.id}
                    data-viewid={this.props.view?.id}
                    data-modelname={this.props.data?.className}
                    className={"StaticVertex " + classes.join(' ')}
                    ref={this.parentRef}
                    onClick={this.onclick}
                    data-userselecting={JSON.stringify(this.props.node?.__raw.isSelected || {})}
                    style={{...this.props.style, ...sizestyle}}
                    onMouseDown={this.onmousedown}
                >
                    {
                        this.props.isVertex ?
                            <Overlap autosizex={false} autosizey={true}>
                                    <div className={"OverlapGrandChildren " + this.props.data.className} style={overlapChildStyle}>
                                        {this.props.data.className === "DClass" || this.props.data.className === "DEnumerator" ?
                                            <ToolButton data={this.props.data} /> : <></>
                                        }
                                        {super.render()}
                                    </div>
                            </Overlap>
                            :
                            <div>{super.render()}</div>
                    }
                </div>
            </Draggable>);
        else
            return (<>
                <div
                    id={this.props.nodeid}
                    data-dataid={this.props.data?.id}
                    data-viewid={this.props.view?.id}
                    data-modelname={this.props.data?.className}
                    className={"StaticVertex " + classes.join(' ')}
                    ref={this.parentRef}
                    onClick={this.onclick}
                    data-userselecting={JSON.stringify(this.props.node?.__raw.isSelected || {})}
                    style={{...this.props.style, ...sizestyle}}
                    onMouseDown={this.onmousedown}
                >
                    {
                        this.props.isVertex ?
                            <Overlap autosizex={false} autosizey={true}>

                                <div className={"OverlapGrandChildren"} style={overlapChildStyle}>
                                    {super.render()}
                                </div>

                            </Overlap>
                            :
                            <div>{super.render()}</div>
                    }
                </div>
            </>);
    }


    /*
    private clearCurrentUserSelection(): void {
        GraphDragHandler.clearSelection();
    }*/



    /*
    + problem: quando stoppi di trascinare e sblocca il rendering, non ci sono ulteriori aggiornamenti di stato, quindi se lo perde invece di buffararli.
    + problem: prototype.shouldComponentUpdate returns false all the time?
    */

    //Giordano:: comment this
    /*
    shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<VertexState>, nextContext: any): boolean {
        return !this.suspendRender && superclassGraphElementComponent.defaultShouldComponentUpdate(this, nextProps, nextState, nextContext);
        // return !!(PureComponent.prototype.shouldComponentUpdate?.call(this, nextProps, nextState, nextContext));
    }
    */

    //NB: do not add logic functions like setName here, add them on data (proxy of raw model data). to edit model just do: oninput={(e)=>{this.model.name=e.target.value}, the proxy will trigger a redux action
    public setAbsolutePosition(pos: Point) {
        console.log('dragx setAbsolutePosition: ' + pos + ' zoom:' + this.props.graph.zoom, {zoom: this.props.graph.zoom, graph: this.props.graph});
        if (this.props.view.storeTemporaryPositions) {
            Log.exDevv('todo: se l\'utente vuole spammare redux-action quando muove il vertice');
            // fire redux action to update position
            return;
        }
        // const vertexOffset = new GraphSize(e.offsetX, e.offsetY);
        // const zoom = new GraphSize(1, 1); // todo: take it from graph? or just do it with css zoom-scale?
        // console.log('fff', {thiss:this, getvpos:this.getVertexPosition(), node: this.props.node});
        const currentVPos = new GraphSize().clone(this.getVertexPosition());
        let graphSize: GraphSize = new GraphSize().clone(this.props.graph.graphSize);
        let graphZoom: GraphPoint = new GraphPoint().clone(this.props.graph.zoom);
        let newpos: GraphPoint = (pos as any as GraphPoint).multiply(this.props.graph.zoom);
        console.log("dragx setAbsolutePosition: newpos:" + newpos + ', pos:' + pos + ", zoom:" + this.props.graph.zoom, {Point});

        // newpos.add(graphSize.tl(), false);
        currentVPos.x = newpos.x;
        currentVPos.y = newpos.y;
        this.setVertexPosition(currentVPos);
    }
    public vertexGotMoved_old(offset: IPoint) {
        console.log('dragx vertexGotMoved: ' + offset);
        if (this.props.view.storeTemporaryPositions) {
            Log.exDevv('todo: se l\'utente vuole spammare redux-action quando muove il vertice');
            // fire redux action to update position
            return;
        }
        // const vertexOffset = new GraphSize(e.offsetX, e.offsetY);
        // const zoom = new GraphSize(1, 1); // todo: take it from graph? or just do it with css zoom-scale?
        const currentVPos = new GraphSize().clone(this.getVertexPosition());
        currentVPos.add(offset.multiply(this.props.graph.zoom) as GraphPoint);
        this.setVertexPosition(currentVPos);
    }
/*
    private getZoomLevel(): Point {
        // todo: get it from injected props.graphid ?
        return new Point(1, 1); }*/

    private getVertexPosition(): GraphSize {
        // if (this.isSelected() && GraphDragHandler.isDragging) return this.state.draggingTempPosition as GraphSize;
        return this.props.node.size;
    }

    public setVertexPosition(size: GraphSize): void {
        if (this.isSelected() && GraphDragHandler.isDragging) this.setVertexStatePosition(size);
        this.setVertexReduxPosition(size); }

    public setVertexStatePosition(size: GraphSize): void { this.setState({draggingTempPosition: size}); /* this.updateDisplayPosition(size.duplicate());*/ }
    public setVertexReduxPosition(size: GraphSize): void {
        console.log('dragx vertexGotMoved setvpos: ' + size);
        this.props.node.size = size;

    /* this.updateDisplayPosition(size.duplicate());*/ }
/*
    public updateDisplayPosition(currentSize?: GraphSize): void {
        currentSize = currentSize || this.getVertexPosition().duplicate();
        // this.props.graphID...
        // NO! i vetici non dovrebbero conoscere lo stato del grafo, è troppo oneroso dover ri-wrappare il grafo
        // ogni volta che viene fatto mapstatetoprops, e ogni modifica del grafo causerebbe re-render e re-connect a tutti i sottoelementi
        this.setState({displayPosition: ???currentSize});
    }*/

    private getCurrentVPosIncludingPanAndZoom(): GraphSize | undefined {
        let ret: GraphSize = (this.state.draggingTempPosition || this.props.node?.size || defaultVSize ) as GraphSize;
        if (!ret) return ret;
        console.log('getCurrentVPosIncludingPanAndZoom size ', {ret, tmppos: this.state.draggingTempPosition, reduxsize: this.props.node?.size});
        console.log('getCurrentVPosIncludingPanAndZoom size2', ret, ret.duplicate);
        ret = new GraphSize().clone(MyProxyHandler.isProxy(ret) ? (ret as any).__raw : ret); // necessario workaround perchè ret è un proxy di un VoidVertex invece che una vera size
        console.log('getCurrentVPosIncludingPanAndZoom', ret, {statepos: this.state.draggingTempPosition, propspos: this.props.node, graph: this.props.graph});
        if (!this.props.graph) return undefined;

        const gMinPos: GraphPoint = new GraphPoint();
        gMinPos.clone(this.props.graph.graphSize);
        // ret.subtract(gMinPos); todo: re-enable when there are multiple vertices, with 1 vertex it is basically auto-focus
        console.log('getCurrentVPosIncludingPanAndZoom graphsize', {graph: this.props.graph, gsize: this.props.graph?.graphSize, gMinPos, ret});
        return ret; }

    private isSelected(byUser?: Pointer<DUser> & string): boolean { return this.props.node?.isSelected[byUser || DUser.current] || false; }

    private deselect(forUser:Pointer<DUser, 0, 1> = null): void {
        if (!forUser) forUser = DUser.current;
        if (!this.isSelected(forUser)) return;
        return;
        /*
        delete this.props.node.isSelected[forUser]; // todo: come reagisce il proxyhandler sulla delete? invoca la set? devo registrare un'altra funzione in override di "Proxy" nativo?
        U.arrayRemoveAll<DGraphElement>(GraphDragHandler.singleton.draggingSelection, this.props.node);
        new SetRootFieldAction('_lastSelected', {node: this.props.graphid, view: this.props.parentViewId, modelElement: this.props.graph.model?.id});
        console.log('deselect()');*/
    }

    private select(forUser:Pointer<DUser, 0, 1> = null): void {
        if (!forUser) forUser = DUser.current;
        if (this.isSelected(forUser)) return;
        this.props.node.isSelected[forUser] = true;
        new SetRootFieldAction('_lastSelected', {node: this.props.nodeid, view: this.props.view.id, modelElement: this.props.data?.id});
        GraphDragHandler.singleton.draggingSelection.push(this.props.node);
        console.log('select()');
        // new SetRootFieldAction( (getPath as IStore).idlookup[this.], this.state.vertexid);
    }
}

// private
class VertexOwnProps extends GraphElementOwnProps {
    onclick?: (e: React.MouseEvent<HTMLDivElement>) => void;
    onmousedown?: (e: React.MouseEvent<HTMLDivElement>) => void;
    isGraph?: boolean = false;
    isVertex?: boolean = true;
    // propsRequestedFromHtmlAsAttributes: string;
}
// private
class VertexReduxStateProps extends GraphElementReduxStateProps{
    node!: LVoidVertex;
    // propsFromReduxStateOrOtherKindOfStateManagement: boolean; // flux or custom things too, unrelated to this.state of react.
}

// private
class VertexDispatchProps extends GraphElementDispatchProps {
    // propsFromReduxActions: typeof funzioneTriggeraAzioneDaImportare;
}


// private
type AllPropss = VertexOwnProps & VertexReduxStateProps & VertexDispatchProps;


const VertexConnected = connect<VertexReduxStateProps, VertexDispatchProps, VertexOwnProps, IStore>(
    VertexComponent.mapStateToProps,
    VertexComponent.mapDispatchToProps
)(VertexComponent as any);
// export const Vertex = VertexConnected;


export const Vertex = (props: VertexOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, childrens}} isGraph={false} isVertex={true}/>; }

export const Graph = (props: VertexOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, childrens}} isGraph={true} isVertex={false}/>; }

export const GraphVertex = (props: VertexOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, childrens}} isGraph={true} isVertex={true}/>; }

export const Field = (props: VertexOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <VertexConnected {...{...props, childrens}} isGraph={false} isVertex={false}/>; }
DClassifier.defaultComponent = Vertex;
DPackage.defaultComponent = GraphVertex;
DModel.defaultComponent = Graph;

DModelElement.defaultComponent = Field; // fallback

/*
if (!windoww.mycomponents) windoww.mycomponents = {};
windoww.mycomponents.VertexRaw = VertexComponent;
windoww.mycomponents.Vertex = Vertex; // should be useless (the whole collection mycomponents)*/
// export const VertexRaw = VertexDragResizeRotateSelect;

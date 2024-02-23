import React, {Component, Dispatch, PureComponent, ReactElement, ReactNode,} from "react";
import {createPortal} from "react-dom";
import {connect} from "react-redux";
import './graphElement.scss';
import type {EdgeOwnProps} from "./sharedTypes/sharedTypes";
import {
    GraphSize,
    LGraph, MouseUpEvent, Point,
    Pointers,
    Selectors as Selectors_, Size, TRANSACTION, WGraph,
    GraphDragManager, GraphPoint, Selectors
} from "../../joiner";
import {DefaultUsageDeclarations} from "./sharedTypes/sharedTypes";

import {EdgeStateProps, LGraphElement, store, VertexComponent,
    BEGIN,
    CreateElementAction, DClass, Debug,
    DEdge, DEnumerator,
    DGraph,
    DGraphElement,
    Dictionary, DModel,
    DModelElement, DObject,
    DocString, DPackage,
    DPointerTargetable,
    DState,
    DUser,
    DV,
    DViewElement,
    EMeasurableEvents, END,
    GObject,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    InOutParam,
    JSXT, Keystrokes,
    LClass,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    MyProxyHandler,
    Overlap,
    Pointer,
    RuntimeAccessible,
    RuntimeAccessibleClass,
    SetFieldAction,
    SetRootFieldAction,
    U,
    UX,
    windoww, transientProperties
} from "../../joiner";

// const Selectors: typeof Selectors_ = windoww.Selectors;

export function makeEvalContext(view: LViewElement, state: DState, ownProps: GraphElementOwnProps, stateProps: GraphElementReduxStateProps): GObject {
    let component = GraphElementComponent.map[ownProps.nodeid as Pointer<DGraphElement>];
    let allProps = {...ownProps, ...stateProps};
    let parsedConstants = stateProps.view._parsedConstants;
    let evalContext: GObject = {
        model: stateProps.data,
        ...ownProps,
        ...stateProps,
        edge: (RuntimeAccessibleClass.extends(stateProps.node?.className, "DVoidEdge") ? stateProps.node : undefined),
        state,
        ownProps,
        stateProps,
        props: allProps,
        component,
        constants: parsedConstants,
        // getSize:vcomponent?.getSize, setSize: vcomponent?.setSize,
        ...parsedConstants,
        // ...stateProps.usageDeclarations, NOT because they are not evaluated yet. i need a basic eval context to evaluate them
    };
    evalContext.__proto__ = windoww.defaultContext;
    return evalContext;
}

function setTemplateString(stateProps: InOutParam<GraphElementReduxStateProps>, ownProps: Readonly<GraphElementOwnProps>, state: DState): void {
    //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
    // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
    const view: LViewElement = stateProps.view; //data._transient.currentView;
    // eslint-disable-next-line no-mixed-operators
    const evalContext = makeEvalContext(view, state, ownProps, stateProps);
    // Log.exDev(!evalContext.data, "missing data", {evalContext, ownProps, stateProps});

    // const evalContextOld = U.evalInContext(this, constants);
    // this.setState({evalContext});


    // compute usageDeclarations
    if (!stateProps.view.__raw.usageDeclarations) {
        U.objectMergeInPlace(evalContext, stateProps.usageDeclarations = {data: stateProps.data, view: stateProps.view, node: stateProps.node});
    } else try {
        // let context = { ...ret.evalContext, state, ret, ownProps, props: ret};
        // eval usageDeclarations
        // this is not really evaluated in provided context, as it does not find view, data in scope
        // and if i open console data becomes the window.data of the one selected in console.

        // scrapped function mode, doesn't look like possible to execute a function in a different scope after his definition,
        // unless it becomes a string and is redefined through eval
        /// let usageDeclarations: ((g:DefaultUsageDeclarations)=>DefaultUsageDeclarations) = U.evalInContextAndScope(ret.view.usageDeclarations, ret.evalContext, ret.evalContext);
        // usageDeclarations(ret.usageDeclarations);
        // ret.evalContext.usageDeclarations = ret.usageDeclarations;
        let tempContext: GObject = {__param: stateProps.usageDeclarations};
        tempContext.__proto__ = evalContext;
        U.evalInContextAndScopeNew("("+stateProps.view.usageDeclarations+")(this.__param)", tempContext, true, false);
        U.objectMergeInPlace(evalContext, stateProps.usageDeclarations);
        // ret.evalContext.props = ret; mo more needed since UD doesn't update props anymore // hotfix to update context props after usageDeclaration mapping
        // console.log("view compute usageDeclarations SUCCESS 1",
        //     {UD_obj_result:stateProps.usageDeclarations, UD_view: stateProps.view.usageDeclarations, context:evalContext, stateProps, ownProps});
    } catch (e: any) {
        stateProps.invalidUsageDeclarations = e;
        Log.ee("Invalid usage declarations", {e, str: stateProps.view.usageDeclarations, view:stateProps.view, data: ownProps.data, stateProps});
        U.objectMergeInPlace(evalContext, stateProps.usageDeclarations = {data: stateProps.data, view: stateProps.view, node: stateProps.node, invalidUsageDeclarations:true});
    }
    stateProps.evalContext = evalContext;
}

let debugcount = 0;
let maxRenderCounter = Number.POSITIVE_INFINITY;
export const lightModeAllowedElements = [DModel.cname, DPackage.cname, DClass.cname, DEnumerator.cname, DObject.cname];

const countRenders = true;
@RuntimeAccessible('GraphElementComponent')
export class GraphElementComponent<AllProps extends AllPropss = AllPropss, GraphElementState extends GraphElementStatee = GraphElementStatee>
    extends Component<AllProps, GraphElementState>{
    public static cname: string;
    static all: Dictionary<number, GraphElementComponent> = {};
    public static map: Dictionary<Pointer<DGraphElement>, GraphElementComponent> = {};
    static maxid: number = 0;
    id: number;

    public static defaultShouldComponentUpdate<AllProps extends GObject, State extends GObject, Context extends any>
    (instance: React.Component, nextProps: Readonly<AllProps>, nextState: Readonly<State>, nextContext: Context) {
        return (
            !U.shallowEqual(instance.props, nextProps) ||
            !U.shallowEqual(instance.state, nextState)
        );
    }

    static mapViewStuff(state: DState, ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps) {
        // let dnode: DGraphElement | undefined = ownProps?.nodeid && DPointerTargetable.from(ownProps.nodeid, state) as any;

        if (!ret.view) {
            /*const viewScores = Selectors.getAppliedViews(ret.data,
                (ownProps.view as LViewElement)?.id || (ownProps.view as string) || null,
                ownProps.parentViewId || null);* /
            // transientProperties.node[ownProps.nodeid].viewStack[ownProps.data][ownProps.parentViewId]
            const viewScores = Selectors.getAppliedViewsNew({data:ret.data, node: ret.node, did: ownProps.data, nid: ownProps.node,
                pvid: ownProps.parentViewId,
                vid: (ownProps.view as LViewElement)?.id || (ownProps.view as string) || undefined});
            ret.views = viewScores.map<LViewElement>(e => LViewElement.fromD(e.element)).filter(v => !!v);*/
            ret.views = Selectors.getAppliedViewsNew({data:ret.data, node: ret.node, nid: ownProps.nodeid as string,
                pv: ownProps.parentViewId && DPointerTargetable.from(ownProps.parentViewId)});
            // console.log("debug",  {...this.props, data: this.props.data?.id, view: this.props.view?.id, v0: this.props.views, views: this.props.views?.map( v => v?.id )})
            if (ownProps.view) {
                ret.view = LPointerTargetable.fromD(Selectors.getViewByIDOrNameD(Pointers.from(ownProps.view), state) as DViewElement);
                Log.w(!ret.view, "Requested view "+ownProps.view+" not found. Another view got assigned.", {requested: ownProps.view, props: ownProps, state: ret});
                if (ret.view) ret.views = [ret.view, ...ret.views];
            }
            else ret.view = ret.views[0];
            Log.ex(!ret.view, "Could not find any view appliable to element.", {data:ret.data, props: ownProps, state: ret});
            (ret as any).viewScores = transientProperties.node[ownProps.nodeid as string]; // debug only
        }

        /*        if (ownProps.view) {
                    ret.view = DPointerTargetable.from(ownProps.view, state);
                } else {
                    ret.view = ret.views[0];
                }*/
    }

    static mapLModelStuff(state: DState, ownProps: GraphElementOwnProps, ret: GraphElementReduxStateProps): void {
        // NB: Edge constructor might have set it from props.start, so keep the check before overwriting.
        if (!ret.data?.__isProxy) { ret.data = LPointerTargetable.wrap(ownProps.data); }
        ret.dataid = ret.data?.id as string;
        if (ret.dataid) {
            /* now handled in Store.ClassNameChanged
            if (!transientProperties.modelElement[ret.dataid]) {
                transientProperties.modelElement[ret.dataid] = {nodes: {}};
                RuntimeAccessibleClass.OCL_Constructors[]
            }*/
            transientProperties.modelElement[ret.dataid].nodes[ret.nodeid] = ret.node;
        }
        /*
        const meid: string = (typeof ownProps.data === 'string' ? ownProps.data as string : (ownProps.data as any as DModelElement)?.id) as string;
        // Log.exDev(!meid, "model element id not found in GE.mapstatetoprops", {meid, ret, ownProps, state});
        ret.data = MyProxyHandler.wrap(meid, state);
        // Log.ex(!ret.data, "can't find model data:", {meid, state, ownpropsdata:ownProps.data, ownProps});
        */
    }

    static mapLGraphElementStuff(state: DState,
                                 ownProps: GraphElementOwnProps,
                                 ret: GraphElementReduxStateProps,
                                 dGraphElementDataClass: typeof DGraphElement = DGraphElement,
                                 isDGraph?: DGraph): void {
        let nodeid: string = ownProps.nodeid as string;
        let graphid: string = isDGraph ? isDGraph.id : ownProps.graphid as string;
        let parentnodeid: string = ownProps.parentnodeid as string;
        ret.nodeid = nodeid;
        // let data: Pointer<DModelElement, 0, 1, LModelElement> = ownProps.data || null;
        // Log.exDev(!nodeid || !graphid, 'node id injection failed', {ownProps, data: ret.data, name:(ret.data as any)?.name || (ret.data as any)?.className}); /*
        /*if (!nodeid) {
            nodeid = 'nodeof_' + stateProps.data.id + (stateProps.view.storeSize ? '^' + stateProps.view.id : '') + '^1';
            stateProps.nodeid = U.increaseEndingNumber(nodeid, false, false, id => !DPointerTargetable.from(id, state));
            todo: quando il componente si aggiorna questo viene perso, come posso rendere permanente un settaggio di reduxstate in mapstatetoprops? o devo metterlo nello stato normale?
        }*/

        let graph: DGraph = DPointerTargetable.from(graphid, state) as DGraphElement as any; // se non c'è un grafo lo creo
        if (!graph) {
            // Log.exDev(!dataid, 'attempted to make a Graph element without model', {dataid, ownProps, ret, thiss:this});
            if (ret.data) CreateElementAction.new(DGraph.new(0, ret.data.id, parentnodeid, graphid, graphid)); }
        /*else {
            graph = MyProxyHandler.wrap(graph);
            Log.exDev(graph.__raw.className !== "DGraph", 'graph class is wrong', {graph: ret.graph, ownProps});
        }*/
        let dnode: DGraphElement = DPointerTargetable.from(nodeid, state) as DGraphElement;

        // console.log('dragx GE mapstate addGEStuff', {dGraphElementDataClass, created: new dGraphElementDataClass(false, nodeid, graphid)});
        if (!dnode && !DPointerTargetable.pendingCreation[nodeid]) {/*
            console.log("making node:", {dGraphElementDataClass, nodeid, parentnodeid, graphid, dataid, ownProps, ret,
                pendings: {...DPointerTargetable.pendingCreation}, pending:DPointerTargetable.pendingCreation[nodeid]});*/
            // so this is called once, but createaction is triggered twice only for edgepoints? it works if i create it through console.
            let dge;
            /*
            if (dGraphElementDataClass === DEdgePoint) { // made it same as dvertex
                let initialSize = ownProps.initialSize;
                dge = DEdgePoint.new(ownProps.htmlindex as number, dataid, parentnodeid, graphid, nodeid, initialSize);
                ret.node =  MyProxyHandler.wrap(dge);
            } else*/
            if (dGraphElementDataClass === DEdge) {
                // set start and end from ownprops;
                let edgeOwnProps: EdgeOwnProps = ownProps as EdgeOwnProps;
                let edgeStateProps: EdgeStateProps = ret as EdgeStateProps;
                let startnodeid = LGraphElement.getNodeId(edgeOwnProps.start);
                let endnodeid = LGraphElement.getNodeId(edgeOwnProps.end);
                if (!startnodeid) {
                    startnodeid = LGraphElement.getNodeId(ret.data);
                }
                edgeStateProps.start = LPointerTargetable.fromPointer(startnodeid)
                edgeStateProps.end = LPointerTargetable.fromPointer(endnodeid);
                Log.e(!startnodeid, "Cannot create an edge without start node", {startnodeid, data:ret.data, propsStart:edgeOwnProps.start});
                Log.e(!endnodeid, "Cannot create an edge without end node (yet)", {endnodeid, data:ret.data, propsEnd:edgeOwnProps.end});
                if (!startnodeid || !endnodeid) return;
                let longestLabel = edgeOwnProps.label;
                let labels: DEdge["labels"] = edgeOwnProps.labels || [];
                dge = DEdge.new(ownProps.htmlindex as number, ret.data?.id, parentnodeid, graphid, nodeid, startnodeid, endnodeid, longestLabel, labels);
                edgeStateProps.node = edgeStateProps.edge = MyProxyHandler.wrap(dge);
            }
            else {
                let initialSize = ownProps.initialSize;
                dge = dGraphElementDataClass.new(ownProps.htmlindex as number, ret.data?.id, parentnodeid, graphid, nodeid, initialSize);
                ret.node =  MyProxyHandler.wrap(dge);
            }
            // console.log("map ge2", {nodeid: nodeid+'', dge: {...dge}, dgeid: dge.id});
        }
        else { ret.node = MyProxyHandler.wrap(dnode); }


        // set up transient model-> node map
        if (!transientProperties.modelElement[ret.dataid]) transientProperties.modelElement[ret.dataid] = {nodes: {}} as any;
        transientProperties.modelElement[ret.dataid].nodes[ownProps.nodeid as string] = ret.node;
        transientProperties.modelElement[ret.dataid].node = ret.node;
    }

    ////// mapper func
    static mapStateToProps(state: DState, ownProps: GraphElementOwnProps, dGraphDataClass: (typeof DGraphElement | typeof DEdge) = DGraphElement, startingobj?: GObject): GraphElementReduxStateProps {
        // console.log('dragx GE mapstate', {dGraphDataClass});
        let ret: GraphElementReduxStateProps = (startingobj || {}) as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        GraphElementComponent.mapLModelStuff(state, ownProps, ret);
        if (Debug.lightMode && (!ret.data || !(lightModeAllowedElements.includes(ret.data.className)))){
            return ret;
        }
        // console.log("map ge", {ownProps, ret, state});
        GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass);
        GraphElementComponent.mapViewStuff(state, ret, ownProps);
        Log.exDev(!ret.view, 'failed to assign view:', {state, ownProps, reduxProps: ret});
        ret.usageDeclarations = new DefaultUsageDeclarations(ret, ownProps); //edited in-place through parameter in evalContext
        // @ts-ignore
        ret.key = ret.key || ownProps.key;
        // @ts-ignore
        ret.forceupdate = state.forceupdate;

        // NB: after this function, ret (reduxstate) should not update shallow keys or ownProps, ret, usageDeclarations (because they are spread in ctx root)
        // any further update will not be present in eval context.props unless merged like U.objectMergeInPlace(ret.evalContext.props, ...); (and same with ctx.stateProps)
        setTemplateString(ret, ownProps, state); // todo: this is heavy, should be moved somewhere where it's executed once unless view changes (pre-render with if?)

        // console.log("view compute usageDeclarations", {ret, ownProps, ud:ret.view.usageDeclarations, context:ret.evalContext});
        if (ret.view.usageDeclarations) {

        }

        // Log.l((ret.data as any)?.name === "concept 1", "mapstatetoprops concept 1", {newnode: ret.node});
        return ret;
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const ret: GraphElementDispatchProps = {} as any;
        return ret;
    }


    countRenders: number;
    _isMounted: boolean;
    html: React.RefObject<HTMLElement | undefined>;
    lastViewChanges: {t: number, vid: Pointer<DViewElement>, v: LViewElement, key?: string}[];
    lastOnUpdateChanges: {t: number}[];
    stopUpdateEvents?: number; // undefined or view.clonedCounter;

    // todo: can be improved by import memoize from "memoize-one"; it is high-order function that memorize the result if params are the same without re-executing it (must not have side effects)
    //  i could use memoization to parse the jsx and to execute the user-defined pre-render function
// le istanze obj di m1 non vengono agiornate se cambio nome alla classe m2
    public shouldComponentUpdate(nextProps: Readonly<AllProps>, nextState: Readonly<GraphElementState>, nextContext: any): boolean {
        // return GraphElementComponent.defaultShouldComponentUpdate(this, nextProps, nextState, nextContext);
        if (transientProperties.node[nextProps.nodeid].force1Update) {
            transientProperties.node[nextProps.nodeid].force1Update = false;
            Log.l(true, "ShouldComponentUpdate " + this.props.data?.name + " UPDATED", {ret: true, reason: 'transient properties edited (stackviews?)', oldProps:this.props, nextProps});
            return true;
        }
        let out = {reason:undefined};
        let skipDeepKeys = {pointedBy:true};
        // let skipPropKeys = {...skipDeepKeys, usageDeclarations: true, node:true, data:true, initialSize: true};
        let ret = false; // !U.isShallowEqualWithProxies(this.props, nextProps, 0, 1, skipPropKeys, out);
        // todo: verify if this update work
        // if node and data in props must be ignored and not checked for changes. but they are checked if present in usageDeclarations
        if (!ret) ret = !U.isShallowEqualWithProxies(this.props.usageDeclarations, nextProps.usageDeclarations, 0, 1, skipDeepKeys, out);
        Log.l(ret, "ShouldComponentUpdate " + this.props.data?.name + " UPDATED", {ret, reason: out.reason, oldProps:this.props, nextProps});
        Log.l(this.props.data?.name === "concept 1_1",
            "ShouldComponentUpdate " +this.props.data?.name + (ret ? " UPDATED" : " REJECTED"),
            {ret, reason: out.reason, oldProps:this.props, nextProps}); //  oldnode:this.props.node, newnode: nextProps.node,
        return ret;
        // apparently node changes are not working? also check docklayout shouldupdate
    }

    protected doMeasurableEvent(type: EMeasurableEvents): boolean {
        if (Debug.lightMode) return false;
        let measurableCode: string = null as any;
        let context: GObject = null as any;
        try{
            measurableCode = (this.props.view)[type];
            if (!measurableCode) return false;
            context = this.getContext();
            measurableCode = U.wrapUserFunction(measurableCode);
            console.log("measurable execute", {type, measurableCode});
            // eval measurable
            U.evalInContextAndScope<GObject>(measurableCode, context, context);
        }
        catch (e: any) { Log.ee('Error in "'+type+'" ' + e.message, {e, measurableCode, context}); }
        // it has executed at least partially.
        // i just need to know if he had the chance to do side-effects and the answer is yes regardless of exceptions
        return true;
    }



    select(forUser?: Pointer<DUser>): void {
        // if (forUser === DUser.current && this.html.current) this.html.current.focus();
        BEGIN();
        this.props.node?.select(forUser);
        SetRootFieldAction.new('_lastSelected', {
            node: this.props.nodeid,
            view: this.props.view.id,
            modelElement: this.props.data?.id
        });/*
        // ? why this?
        const id = this.props.data?.id;
        if (id) {
            //selected[forUser] = id;
            SetRootFieldAction.new('selected', id, '', true);
        }*/

        // SetRootFieldAction.new(`selected.${DUser.current}`, nodeid, '', true);
        END();
    }

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.lastViewChanges = [];
        this.lastOnUpdateChanges = []
        this.stopUpdateEvents = undefined;
        this._isMounted = false;
        this.countRenders = 0;
        this.id = GraphElementComponent.maxid++;
        GraphElementComponent.all[this.id] = this;
        GraphElementComponent.map[props.nodeid as Pointer<DGraphElement>] = this;
        this.html = React.createRef();
        let functionsToBind = [this.onClick,
            this.onLeave, this.onEnter,
            this.doContextMenu, this.onContextMenu,
            this.onMouseDown, this.onMouseUp, this.onKeyDown, this.onScroll];/*
        this.onClick = this.onClick.bind(this);
        this.onLeave = this.onLeave.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onEnter = this.onEnter.bind(this);
        this.select = this.select.bind(this);*/
        for (let f of functionsToBind) (this as any)[f.name] = f.bind(this);
        // @ts-ignore
        this.state = {classes: [] as string[]};
    }

    // constants: evalutate solo durante il primo render, può essere una funzione con effetti collaterali sul componente,
    // in tal caso la si esegue e si prende il valore di ritorno.
    // preRenderFunc: funzione evalutata ed eseguita sempre prima del render, ha senso solo per generare effetti collaterali sulle "costanti".
    // jsxString: funzione evalutata una sola volta durante il primo render ed eseguita ad ogni update dei dati.



    componentDidMount(): void {
        // after first render
        this._isMounted = true;
    }

    componentWillUnmount(): void {
        // todo: devo fare in modo che il nodo venga cancellato solo se sto modificando la vista in modo che questo vertice non esista più.
        //  e non venga cancellato se il componente viene smontato perchè ho solo cambiato vista
        //  LOW PRIORITY perchè funziona anche senza, pur sprecando memoria che potrebbe essere liberata.
        // if (view_is_still_active_but_got_modified_and_vertex_is_deleted) new DeleteElementAction(this.getId());
    }
    /*
        componentDidUpdate(oldProps: Readonly<AllProps {/*
            const newProps = this.props
            if (oldProps.view !== newProps.view) { this.setTemplateString(newProps.view); }
    }*/

    protected getContext(): GObject{
        let context: GObject = {component:this, __proto__:this.props.evalContext};
        context._context = context;
        this.context = context;
        return context;
    }

    protected displayError(e: Error, where: string): React.ReactNode {
        const view: LViewElement = this.props.view; //data._transient.currentView;
        let errormsg = (where === "preRenderFunc" ? "Pre-Render " : "") +(e.message||"\n").split("\n")[0];
        if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0) {
            errormsg += '\n\nReminder: nullish operators ".?" and "??" are not supported.'; }
        else if (view.jsxString.indexOf('?.') >= 0) { errormsg += '\n\nReminder: ?. operator and empty tags <></> are not supported.'; }
        else if (e.message.indexOf("Unexpected token '<'") !== -1) { errormsg += '\n\nDid you forgot to close a html </tag>?'; }
        try {
            let ee = e.stack || "";
            let stackerrorlast = ee.split("\n")[1];

            let icol = stackerrorlast.lastIndexOf(":");
            let jsxString = view.jsxString;
            // let col = stackerrorlast.substring(icol+1);
            let irow = stackerrorlast.lastIndexOf(":", icol-1);
            let stackerrorlinenum: GObject = {
                row: Number.parseInt(stackerrorlast.substring(irow+1, icol)),
                col: Number.parseInt(stackerrorlast.substring(icol+1)) };
            let linesPre = 1;
            let linesPost = 1;
            let jsxlines = jsxString.split("\n");
            let culpritlinesPre: string[] = jsxlines.slice(stackerrorlinenum.row-linesPre-1, stackerrorlinenum.row - 1);
            let culpritline: string = jsxlines[stackerrorlinenum.row - 1]; // stack start counting lines from 1
            let culpritlinesPost: string[] = jsxlines.slice(stackerrorlinenum.row, stackerrorlinenum.row + linesPost);
            console.error("errr", {e, jsxlines, culpritlinesPre, culpritline, culpritlinesPost, stackerrorlinenum, icol, irow, stackerrorlast});

            let caretCursor = "▓" // ⵊ ꕯ 𝙸 Ꮖ
            if (culpritline && stackerrorlinenum.col < culpritline.length && stackerrorlast.indexOf("main.chunk.js") === -1) {
                let rowPre = culpritline.substring(0, stackerrorlinenum.col);
                let rowPost = culpritline.substring(stackerrorlinenum.col);
                let jsxcode =
                    <div style={{fontFamily: "monospaced sans-serif", color:"#444"}}>
                        { culpritlinesPre.map(l => <div>{l}</div>) }
                        <div>{rowPre} <b style={{color:"red"}}> {caretCursor} </b> {rowPost}</div>
                        { culpritlinesPost.map(l => <div>{l}</div>) }
                    </div>;
                errormsg += " @line " + stackerrorlinenum.row + ":" + stackerrorlinenum.col;
                return DV.errorView(
                    <div>{errormsg}{jsxcode}</div>, {where:"in "+where+"()", e, template: this.props.view.jsxString, view: this.props.view},
                    where, this.props.data?.__raw, this.props.node?.__raw, view.__raw
                    );
            } else {
                // it means it is likely accessing a minified.js src code, sending generic error without source mapping
            }
        } catch(e2) {
            Log.eDevv("internal error in error view", {e, e2, where} );
        }
        return DV.errorView(<div>{errormsg}</div>, {where:"in "+where+"()", e, template: this.props.view.jsxString, view: this.props.view},
            where, this.props.data?.__raw, this.props.node?.__raw, view.__raw);
    }

    private getTemplate(): ReactNode {
        /*if (!this.state.template) {
            this.setTemplateString('{c1: 118}', '()=>{this.setState({c1: this.state.c1+1})}',
                '<div><input value="{name}" onInput="{setName}"></input><p>c1:{this.state.c1}</p><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" /><ul>{colors.map( color => <li>color: {color}</li>)}</ul></div>');
        }*/
        // console.log('getTemplate:', {props: this.props, template: this.props.template, ctx: this.props.evalContext});

        // Log.exDev(debug && maxRenderCounter-- < 0, "loop involving render");
        if (this.props.invalidUsageDeclarations) {
            return this.displayError(this.props.invalidUsageDeclarations, "Usage Declaration");
        }
        let context: GObject = this.getContext();
        // abababababab
        // todo: invece di fare un mapping ricorsivo dei figli per inserirgli delle prop, forse posso farlo passando una mia factory che wrappa React.createElement

        try {
                let preRenderFuncStr: string | undefined = this.props.view.preRenderFunc;
            if (preRenderFuncStr) {
                // eval prerender
                let obj: GObject = {};
                let tempContext: GObject = {__param: obj};
                tempContext.__proto__ = context;
                U.evalInContextAndScopeNew("("+preRenderFuncStr+")(this.__param)", tempContext, true, false);
                U.objectMergeInPlace(context, obj);
            }
        }
        catch(e: any) { return this.displayError(e, "Pre-Render");  }

        let ret;
        // eval template
        let jsxCodeString: DocString<ReactNode>;

        try { jsxCodeString = JSXT.fromString(this.props.view.jsxString, {factory: 'React.createElement'}); }
        catch (e: any) { return this.displayError(e, "JSX Syntax"); }

        try { ret = U.evalInContextAndScope<() => ReactNode>('(()=>{ return ' + jsxCodeString + '})()', context); }
        catch (e: any) { return this.displayError(e, "JSX Semantic"); }
        return ret;
    }

    onContextMenu(e: React.MouseEvent<Element>) {
        e.preventDefault();
        e.stopPropagation();
        // NOT executed here, but on mousedown because of IOS compatibility
    }

    doContextMenu(e: React.MouseEvent<Element>) {
        BEGIN()
        this.props.node.select();
        if (this.html.current) this.html.current.focus();
        let state: DState = store.getState();
        if (state.contextMenu?.x !== e.clientX) {
            SetRootFieldAction.new("contextMenu", {
                display: true,
                x: e.clientX,
                y: e.clientY,
                nodeid: this.props.node?.id
            });
        }
        END();
    }

    onEnter(e: React.MouseEvent<Element>) { // instead of doing it here, might set this class on render, and trigger it visually operative with :hover selector css
        const isEdgePending = this.props.isEdgePending?.source;
        if (!isEdgePending || this.props.data?.className !== "DClass") return;
        const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
        const canBeExtend = isEdgePending.canExtend(this.props.data as any as LClass, extendError);

        if (canBeExtend) this.setState({classes:[...this.state.classes, "class-can-be-extended"]});
        else this.setState({classes:[...this.state.classes, "class-cannot-be-extended"]});
    }
    onLeave(e: React.MouseEvent<Element>) {
        if (this.props.data?.className !== "DClass") return;
        this.setState({classes: this.state.classes.filter((classname) => {
            return classname !== "class-can-be-extended" && classname !== "class-cannot-be-extended"
        })});
    }

    static mousedownComponent: GraphElementComponent | undefined;
    onMouseDown(e: React.MouseEvent): void {
        e.stopPropagation();
        GraphElementComponent.mousedownComponent = this;
        TRANSACTION(()=>{
            if (e.button === Keystrokes.clickRight) { this.doContextMenu(e); }
            let p: GObject = this.props;
            if (p.isGraph && !p.isvertex || p.isGraph && p.isvertex && e.ctrlKey) GraphDragManager.startPanning(e, this.props.node as LGraph);
        })
    }



    onScroll(e: React.MouseEvent): void {
        console.log("onScroll");
        let scroll: Point = new Point(e.currentTarget.scrollLeft, e.currentTarget.scrollTop);
        let scrollOrigin: Point = new Point(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        let g: LGraph = this.props.node.graph;
        let oldZoom: GraphPoint = g.zoom;
        let newZoom: GraphPoint = new GraphPoint(oldZoom.x+0.1, oldZoom.y+0.1);
        let oldOffset: GraphPoint = g.offset;
        let gscrollOrigin: GraphPoint = oldOffset.add(scrollOrigin.multiply(oldZoom, true), true);
        let newscrollOrigin: GraphPoint = oldOffset.add(scrollOrigin.multiply(newZoom, true), true);
        let newOffset: GraphPoint = oldOffset.add( gscrollOrigin.subtract(newscrollOrigin, true), true);
        TRANSACTION(()=>{
            g.offset = newOffset;
            g.zoom = newZoom;
        })
        e.stopPropagation();
    }
    onMouseUp(e: React.MouseEvent): void {
        e.stopPropagation();
        TRANSACTION(()=>{
            GraphDragManager.stopPanning(e);
            if (GraphElementComponent.mousedownComponent !== this) { return; }
            this.doOnClick(e);
        })
    }
    onKeyDown(e: React.KeyboardEvent){
        if (e.key === Keystrokes.escape) {
            this.props.node.deselect();
            if (this.props.isEdgePending) {
                // this.stopPendingEdge(); todo
                return;
            }
        }
        if (e.ctrlKey || e.altKey) {
            // todo: make them a switch
            if (e.key === "d") this.props.data?.duplicate(); else
            if (e.key === "r") this.props.data?.delete();
        }
        if (e.altKey) {
            // if (e.key === Keystrokes.escape) this.props.node.toggleMinimize();
            if (e.key === "a") this.props.data?.addChild("auto"); else // add class if on package, literal if on enum...
            if (e.key === "r") this.props.data?.addChild("reference"); else
            if (e.key === "o") this.props.data?.addChild("operation") || this.props.data?.addChild("object"); else
            if (e.key === "l") this.props.data?.addChild("literal"); else
            if (e.key === "p") this.props.data?.addChild("package") || this.props.data?.addChild("parameter"); else
            if (e.key === "c") this.props.data?.addChild("class"); else
            if (e.key === "e") this.props.data?.addChild("enumerator"); else
            if (e.key === "q") this.props.data?.addChild("annotation"); else
            ;
        }
    }

    private doOnClick(e: React.MouseEvent): void {
        // (e.target as any).focus();
        e.stopPropagation();
        let state: DState = store.getState();
        if (e.button !== Keystrokes.clickRight && state.contextMenu?.display) SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0}); // todo: need to move it on document or <App>
        const edgePendingSource = this.props.isEdgePending?.source;
        console.log('mousedown select() check PRE:', {name: this.props.data?.name, isSelected: this.props.node.isSelected(), 'nodeIsSelectedMapProxy': this.props.node?.isSelected, nodeIsSelectedRaw:this.props.node?.__raw.isSelected});

        if (edgePendingSource) {
            if (this.props.data?.className !== "DClass") return;
            // const user = this.props.isEdgePending.user;
            const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
            const canBeExtend = this.props.data && edgePendingSource.canExtend(this.props.data as LClass, extendError);
            if (canBeExtend && this.props.data) {
                const lClass: LClass = LPointerTargetable.from(this.props.data.id);
                // SetFieldAction.new(lClass.id, "extendedBy", source.id, "", true); // todo: this should throw a error for wrong type.
                // todo: use source.addExtends(lClass); or something (source is LClass)
                SetFieldAction.new(lClass.id, "extendedBy", edgePendingSource.id, "+=", true);
                SetFieldAction.new(edgePendingSource.id, "extends", lClass.id, "+=", true);
            }
            SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });
            return;
        }
        console.log('mousedown select() check:', {isSelected: this.props.node.isSelected(), 'nodeIsSelectedMapProxy': this.props.node?.isSelected, nodeIsSelectedRaw:this.props.node?.__raw.isSelected});
        BEGIN();
        windoww.node = this.props.node;
        this.props.node.toggleSelected(DUser.current);
        if (state._lastSelected?.node !== this.props.nodeid) {
            SetRootFieldAction.new('_lastSelected', {
                node: this.props.nodeid,
                view: this.props.view.id,
                modelElement: this.props.data?.id
            });
        }

        if (e.shiftKey || e.ctrlKey) { }
        else {
            let allNodes: LGraphElement[] | undefined = this.props.node?.graph.allSubNodes;
            let nid = this.props.node.id;
            if (allNodes) for (let node of allNodes) if (node.id !== nid) node.deselect(DUser.current);
        }
        END();
    }

    onClick(e: React.MouseEvent): void {

    }
    /*
    onViewChangeOld(): void {
        let thischange = {t: Date.now(), vid: this.props.node.__raw.view, newvid:this.props.view.id, v: this.props.node.view, newv: this.props.view, key:this.props.key};
        this.lastViewChanges.push(thischange);
        // nan -> false <200 = true
        if (thischange.t - this.lastViewChanges[this.lastViewChanges.length-20]?.t < 200) { // important! NaN<1  and NaN>1 are both false
            // if N views changed in <= 0.2 sec
            Log.exDevv("loop in updating View assigned to node. The cause might be missing or invalid keys on GraphElement JSX nodes.", {change_log:this.lastViewChanges, component: this});
        }
        this.props.node.view = this.props.view;
    }*/

    public render(nodeType?:string, styleoverride:React.CSSProperties={}, classes: string[]=[]): ReactNode {
        if (Debug.lightMode && (!this.props.data || !(lightModeAllowedElements.includes(this.props.data.className)))){
            return this.props.data ? <div>{" " + ((this.props.data as any).name)}:{this.props.data.className}</div> : undefined;
        }
        if (!this.props.node) return "Loading...";
        /*if (this.props.node.__raw.view !== this.props.view.id) {
            this.onViewChange();
            return "Updating view...";
        }*/

        if (!this.stopUpdateEvents || this.stopUpdateEvents !== this.props.view.clonedCounter) {
            this.stopUpdateEvents = undefined;
            if (this.doMeasurableEvent(EMeasurableEvents.onDataUpdate)) {
                let thischange = {t: Date.now()};
                this.lastOnUpdateChanges.push(thischange);
                if (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 20]?.t < 200) {
                    // if N updates in <= 0.2 sec
                    this.stopUpdateEvents = this.props.view.clonedCounter;
                    Log.eDevv("loop in node.render() likely due to MeasurableEvent onDataUpdate. It has been disabled until the view changes.",{
                        change_log: this.lastOnUpdateChanges,
                        component: this,
                        timediff: (thischange.t - this.lastOnUpdateChanges[this.lastOnUpdateChanges.length - 20]?.t)
                    } as any);
                }
            }
        }

        /// set classes
        if (this.props.node) {
            let isSelected: Dictionary<Pointer<DUser>, boolean> = this.props.node.__raw.isSelected;
            if (isSelected[DUser.current]) { // todo: better to just use css attribute selectors [data-userselecting = "userID"]
                classes.push('selected-by-me');
                if (Object.keys(isSelected).length > 1) classes.push('selected-by-others');
            } else if (Object.keys(isSelected).length) classes.push('selected-by-others');
        }
        classes.push(this.props.data?.className || 'DVoid');
        U.arrayMergeInPlace(classes, this.state.classes);
        if (Array.isArray(this.props.className)) { U.arrayMergeInPlace(classes, this.props.className); }
        else if (this.props.className) { classes.push(this.props.className); }
        if (Array.isArray(this.props.class)) { U.arrayMergeInPlace(classes, this.props.class); }
        else if (this.props.class) { classes.push(this.props.class); }
        /// end set classes

        const rnode: ReactNode = this.getTemplate();
        let rawRElement: ReactElement | null = UX.ReactNodeAsElement(rnode);
        const me: LModelElement | undefined = this.props.data; // this.props.model;

        // \console.log('GE render', {thiss: this, data:me, rnode, rawRElement, props:this.props, name: (me as any)?.name});

        const addprops: boolean = true;
        let fiximport = !!this.props.node;
        if (addprops && rawRElement && fiximport) {
            if (windoww.debugcount && debugcount++>windoww.debugcount) throw new Error("debug triggered stop");
            let fixdoubleroot = true;
            // add view props to GraphElement children (any level down)
            const subElements: Dictionary<DocString<'nodeid'>, boolean> = {}; // this.props.getGVidMap();
            try {
                let viewStyle: GObject = {...(this.props.style || {})};
                /*
                    if (view.adaptWidth) viewStyle.width = view.adaptWidth; // '-webkit-fill-available';
                    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
                    if (view.adaptHeight) viewStyle.height = view.adaptHeight; //'fit-content'; // '-webkit-fill-available'; if needs to actually fill all it's not a vertex but a field.
                    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';
                    viewStyle = {};
                */
                // viewStyle.pointerEvents = "all";
                viewStyle.order = viewStyle.zIndex = this.props.node?.zIndex; // alias? this.props.node.z
                viewStyle.display = this.props.view?.display;
                let injectProps: GObject = {};
                if (countRenders) {
                    classes.push(this.countRenders%2 ? "animate-on-update-even" : "animate-on-update-odd");
                    injectProps["data-countrenders"] = this.countRenders++;
                }
                /// let excludeProps = ['data', 'node', 'view', 'children', ]
                let p: GObject = this.props;
                for (let k in p) {
                    if (typeof p[k] === 'object' || typeof p[k] === 'function') continue;
                    injectProps[k] = p[k];
                }
                // for (let k in this.props.childStyle) { delete viewStyle[k]; }
                rawRElement = React.cloneElement(rawRElement, // i'm cloning a raw html (like div) being root of the rendered view
                    {
                        ...injectProps,
                        ref: this.html,
                        // damiano: ref html viene settato correttamente a tutti tranne ad attribute, ref, operation (è perchè iniziano con <Select/> as root?)
                        id: this.props.nodeid,
                        "data-nodeid": this.props.nodeid,
                        "data-dataid": me?.id,
                        "data-viewid": this.props.view.id,
                        "data-modelname": me?.className || "model-less",
                        "data-userselecting": JSON.stringify(this.props.node?.isSelected || {}),
                        "data-nodetype": nodeType,
                        // "data-order": this.props.node?.zIndex,
                        style: {...viewStyle, ...styleoverride},
                        className: classes.join(' '),
                        onClick: this.onClick,
                        onContextMenu:this.onContextMenu,
                        onMouseDown:this.onMouseDown,
                        onMouseUp:this.onMouseUp,
                        onMouseWheel: this.onScroll,
                        onMouseEnter:this.onEnter,
                        onMouseLeave:this.onLeave,
                        tabIndex: (this.props as any).tabIndex || -1,
                        children: UX.recursiveMap(rawRElement/*.props.children*/,
                            (rn: ReactNode, index: number, depthIndexes: number[]) => {
                                let injectOffset: undefined | LGraph = ((this.props as any).isGraph && !depthIndexes[0] && !index) && (this.props.node as LGraph);
                                injectOffset&&console.log("inject offset props0:", {injectOffset});
                                //console.log("inject offset props00:", {injectOffset, ig:(this.props as any).isGraph, props:this.props, depthIndexes, index});
                                return UX.injectProp(this, rn, subElements, this.props.parentnodeid as string, index, depthIndexes, injectOffset)
                            })});
                fixdoubleroot = false; // need to set the props to new root in that case.
                if (fixdoubleroot) rawRElement = rawRElement.props.children;
                // console.log("probem", {rawRElement, children:(rawRElement as any)?.children, pchildren:(rawRElement as any)?.props?.children});
            } catch (e: any) {
                rawRElement = DV.errorView("error while injecting props to subnodes\n:" + (e.message || '').split('\n')[0],
                        {e, rawRElement, key:this.props.key, newid: this.props.nodeid},
                    'Subelement props', this.props.data?.__raw, this.props.node?.__raw, this.props.view.__raw) as ReactElement;
                /*
                rawRElement = U.eval InContextAndScope<ReactElement>('()=>{ return ' +
                    DV.errorView("error while injecting props to subnodes",
                        {e, rawRElement, key:this.props.key, newid: this.props.nodeid}) + '}',
                    {});*/

                // rawRElement = DV.errorView("error while injecting props to subnodes", {e, rawRElement, key:this.props.key, newid: this.props.nodeid});
            }
            /*console.log('tempdebug', {deepStrictEqual, okeys:Object.keys});
            let isEqual = true;
            try {deepStrictEqual(subElements, this.props.node.subElements)} catch(e) { isEqual = false; }
            if (isEqual) {
                this.props.node.subElements = Object.keys(subElements);
            }*/
        }
        // const injectprops = {a:3, b:4} as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        // rnode = React.cloneElement(rnode as ReactElement, injectprops);

        // console.log("nodeee", {thiss:this, props:this.props, node: this.props.node});
        if (false && (this.props.node?.__raw as DGraphElement).father) {
            let $containedIn = $('#' + this.props.node.father);
            let $containerDropArea = $containedIn.find(".VertexContainer");
            const droparea = $containerDropArea[0] || $containedIn[0];
            Log.exDev(!droparea, 'invalid vertex container target', {$containedIn, $containerDropArea});
            if (droparea) return createPortal(
                rawRElement || rnode,
                droparea
            );
        }/*
        if (countRenders) return <>{[
            rawRElement || rnode,
            <div className={this.countRenders%2 ? "animate-on-update-even" : "animate-on-update-odd"} data-countrenders={this.countRenders++} />
        ]}</>/*/
        return rawRElement || rnode;
    }

}

// private
// type AllPropss = GraphElementOwnProps & GraphElementDispatchProps & GraphElementReduxStateProps;
type AllPropss = Overlap<Overlap<GraphElementOwnProps, GraphElementDispatchProps>, GraphElementReduxStateProps>;

const GraphElementConnected = connect<GraphElementReduxStateProps, GraphElementDispatchProps, GraphElementOwnProps, DState>(
    GraphElementComponent.mapStateToProps,
    GraphElementComponent.mapDispatchToProps
)(GraphElementComponent as any);

export const GraphElement = (props: GraphElementOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <GraphElementConnected {...{...props, children}} />; }
// console.info('graphElement loaded');


GraphElementComponent.cname = "GraphElementComponent";
GraphElementConnected.cname = "GraphElementConnected";
GraphElement.cname = "GraphElement";

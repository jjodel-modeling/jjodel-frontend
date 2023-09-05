import React, {CSSProperties, Dispatch, PureComponent, ReactElement, ReactNode, useRef,} from "react";
import {createPortal} from "react-dom";
import {connect} from "react-redux";
import './graphElement.scss';
import type {VertexComponent, EdgeStateProps} from "../../joiner";
import {
    CreateElementAction,
    DGraph,
    DGraphElement,
    Dictionary,
    DModelElement,
    DocString,
    DViewElement,
    GObject,
    GraphElementDispatchProps,
    GraphElementOwnProps,
    GraphElementReduxStateProps,
    GraphElementStatee,
    InOutParam,
    DState,
    JSXT,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    MyProxyHandler,
    Overlap,
    Pointer,
    RuntimeAccessible,
    Selectors,
    SetRootFieldAction,
    U,
    UX,
    windoww,
    DV,
    GraphSize,
    GraphPoint,
    LVoidVertex,
    DUser,
    Size,
    LClass,
    SetFieldAction,
    DGraphVertex,
    DVoidVertex, DEdge,
    LEdge, LUser, LViewPoint,
    LGraphElement, RuntimeAccessibleClass,
    DEdgePoint, DPointerTargetable,
    BEGIN, END,
} from "../../joiner";


import {end} from "@popperjs/core";
import { EdgeOwnProps } from "./sharedTypes/sharedTypes";


export function makeEvalContext(props: AllPropss, view: LViewElement): GObject {
    let evalContext: GObject = view.constants ? eval('window.tmp = ' + view.constants) : {};
    let component = GraphElementComponent.map[props.nodeid as Pointer<DGraphElement>];
    let vcomponent = component as VertexComponent;
    evalContext = {...windoww.defaultContext, ...evalContext, model: props.data, ...props,
        edge: (RuntimeAccessibleClass.extends(props.node?.className, "DVoidEdge") ? props.node : undefined),
        component, getSize:vcomponent?.getSize, setSize: vcomponent?.setSize};
    // windoww.evalContext = evalContext;
    return evalContext;
}

function setTemplateString(stateProps: InOutParam<GraphElementReduxStateProps>, ownProps: Readonly<GraphElementOwnProps>): void {
    //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
    // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
    const view: LViewElement = stateProps.view; //data._transient.currentView;
    // eslint-disable-next-line no-mixed-operators
    let allProps: AllPropss = {...ownProps, ...stateProps} as AllPropss;
    (allProps as GObject).props = allProps;
    const evalContext = makeEvalContext(allProps, view);
    // const evalContextOld = U.evalInContext(this, constants);
    // this.setState({evalContext});
    //console.error({jsx:view.jsxString, view});

    // todo: invece di fare un mapping ricorsivo dei figli per inserirgli delle prop, forse posso farlo passando una mia factory che wrappa React.createElement
    let jsxCodeString: DocString<ReactNode>;
    let jsxparsedfunc: () => React.ReactNode;
    try { jsxCodeString = JSXT.fromString(view.jsxString, {factory: 'React.createElement'}); }
    catch (e: any) {
        Log.eDevv();
        stateProps.preRenderFunc = view.preRenderFunc;
        stateProps.evalContext = evalContext;
        stateProps.template = DV.errorView_string(e.message.split("\n")[0],
            {msg: 'Syntax Error in custom user-defined template. try to remove typescript typings.', evalContext, e, view, jsx:view.jsxString});
        return;
    }/*
    try {
        jsxparsedfunc = U.evalInContextAndScope<() => ReactNode>('()=>{ return ' + jsxCodeString + '}', evalContext);
        // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?
    }
    catch (e: any) {
        let errormsg = ''; // 'Syntax Error in custom user-defined template.\n';
        let otherargs: any = {e, jsxCodeString, evalContext, where:"setTemplateString()", view};
        if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0)
        { errormsg += 'Reminder: nullish operators ".?" and "??" are not supported.\n\n' +e.toString() + '\n\n' + view.jsxString; }
        else if (view.jsxString.indexOf('?.') >= 0) { errormsg += 'Reminder: ?. operator and empty tags <></> are not supported.\n\n' +e.toString() + '\n\n' + view.jsxString; }
        jsxparsedfunc = ()=> DV.errorView(errormsg, otherargs);
    }*/

    stateProps.preRenderFunc = view.preRenderFunc;
    stateProps.evalContext = evalContext;
    stateProps.template = jsxCodeString;
    // console.log('GE settemplatestring:', {stateProps});
}

let debugcount = 0;
let debug = true;
let maxRenderCounter = Number.POSITIVE_INFINITY;
@RuntimeAccessible
export class GraphElementComponent<AllProps extends AllPropss = AllPropss, GraphElementState extends GraphElementStatee = GraphElementStatee>
    extends PureComponent<AllProps, GraphElementState>{
    static all: Dictionary<number, GraphElementComponent> = {};
    public static map: Dictionary<Pointer<DGraphElement>, GraphElementComponent> = {};
    static maxid: number = 0;
    id: number;
    public static refresh() {
        for (let key in GraphElementComponent.all) {
            GraphElementComponent.all[key].forceUpdate();
        }
        console.log(GraphElementComponent.all);
    }

    public static defaultShouldComponentUpdate<AllProps extends GObject, State extends GObject, Context extends any>
    (instance: React.Component, nextProps: Readonly<AllProps>, nextState: Readonly<State>, nextContext: Context) {
        return (
            !U.shallowEqual(instance.props, nextProps) ||
            !U.shallowEqual(instance.state, nextState)
        );
    }

    static mapViewStuff(state: DState, ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps) {
        let dnode: DGraphElement | undefined = ownProps?.nodeid && state.idlookup[ownProps.nodeid] as any;
        if (ownProps.view) {
            ret.views = [];
            ret.view = LPointerTargetable.wrap(ownProps.view) as LViewElement;
        }
        else {
            const viewScores = Selectors.getAppliedViews(ret.data, dnode, ret.graph, ownProps.view || null, ownProps.parentViewId || null);
            ret.views = viewScores.map(e => MyProxyHandler.wrap(e.element));
            ret.view = ret.views[0];
            (ret as any).viewScores = viewScores; // debug only
        }

        /*        if (ownProps.view) {
                    ret.view = DPointerTargetable.wrap(state.idlookup[ownProps.view]);
                } else {
                    ret.view = ret.views[0];
                }*/
    }

    static mapLModelStuff(state: DState, ownProps: GraphElementOwnProps, ret: GraphElementReduxStateProps): void {
        const meid: string = (typeof ownProps.data === 'string' ? ownProps.data as string : (ownProps.data as any as DModelElement)?.id) as string;
        ret.dataid = meid;
        // Log.exDev(!meid, "model element id not found in GE.mapstatetoprops", {meid, ret, ownProps, state});
        ret.data = MyProxyHandler.wrap(state.idlookup[meid as any]);
        // Log.ex(!ret.data, "can't find model data:", {meid, state, ownpropsdata:ownProps.data, ownProps});

    }

    static mapLGraphElementStuff(state: DState,
                                 ownProps: GraphElementOwnProps,
                                 ret: GraphElementReduxStateProps,
                                 dGraphElementDataClass: typeof DGraphElement = DGraphElement,
                                 isDGraph?: DGraph): void {
        const idlookup = state.idlookup;
        let nodeid: string = ownProps.nodeid as string;
        let graphid: string = isDGraph ? isDGraph.id : ownProps.graphid as string;
        let parentnodeid: string = ownProps.parentnodeid as string;
        let dataid: Pointer<DModelElement, 0, 1, LModelElement> = ownProps.data || null;
        // Log.exDev(!nodeid || !graphid, 'node id injection failed', {ownProps, data: ret.data, name:(ret.data as any)?.name || (ret.data as any)?.className}); /*
        /*if (!nodeid) {
            nodeid = 'nodeof_' + stateProps.data.id + (stateProps.view.bindVertexSizeToView ? '^' + stateProps.view.id : '') + '^1';
            stateProps.nodeid = U.increaseEndingNumber(nodeid, false, false, id => !idlookup[id]);
            todo: quando il componente si aggiorna questo viene perso, come posso rendere permanente un settaggio di reduxstate in mapstatetoprops? o devo metterlo nello stato normale?
        }*/

        ret.graph = idlookup[graphid] as DGraphElement as any; // se non c'è un grafo lo creo
        if (!ret.graph) {
            // Log.exDev(!dataid, 'attempted to make a Graph element without model', {dataid, ownProps, ret, thiss:this});
            if (dataid) CreateElementAction.new(DGraph.new(0, dataid, parentnodeid, graphid, graphid)); }
        else {
            ret.graph = MyProxyHandler.wrap(ret.graph);
            Log.exDev(ret.graph.__raw.className !== "DGraph", 'graph class is wrong', {graph: ret.graph, ownProps});
        }


        let dnode: DGraphElement = idlookup[nodeid] as DGraphElement;


        // console.log('dragx GE mapstate addGEStuff', {dGraphElementDataClass, created: new dGraphElementDataClass(false, nodeid, graphid)});
        if (!dnode && !DPointerTargetable.pendingCreation[nodeid]) {
            console.log("making node:", {dGraphElementDataClass, nodeid, parentnodeid, graphid, dataid, ownProps, ret,
                pendings: {...DPointerTargetable.pendingCreation}, pending:DPointerTargetable.pendingCreation[nodeid]});
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
                let edgeProps: EdgeStateProps = ret as EdgeStateProps;
                let edgeOwnProps: EdgeOwnProps = ownProps as EdgeOwnProps;
                let start = edgeProps.start.id; //typeof edgeProps.start === "string" ? edgeProps.start : (edgeProps.start as any).id; // at runtime i found proxy wrapped instead of id, no idea why
                let end = edgeProps.end.id; // typeof edgeProps.end === "string" ? edgeProps.end : (edgeProps.end as any).id;
                let longestLabel = edgeOwnProps.label;
                let labels = edgeOwnProps.labels || [];
                dge = (DEdge as any).new(ownProps.htmlindex, dataid, parentnodeid, graphid, nodeid, start, end, longestLabel, labels);
                ret.node = (ret as any).edge = MyProxyHandler.wrap(dge);
            }
            else {
                let initialSize = ownProps.initialSize;
                dge = dGraphElementDataClass.new(ownProps.htmlindex as number, dataid, parentnodeid, graphid, nodeid, initialSize);
                ret.node =  MyProxyHandler.wrap(dge);
            }
            // let act = CreateElementAction.new(dge, false);
            // console.log("map ge2", {nodeid: nodeid+'', dge: {...dge}, dgeid: dge.id});
        }
        else { ret.node = MyProxyHandler.wrap(dnode); }
    }

    ////// mapper func
    static mapStateToProps(state: DState, ownProps: GraphElementOwnProps, dGraphDataClass: (typeof DGraphElement | typeof DEdge) = DGraphElement, startingobj?: GObject): GraphElementReduxStateProps {
        // console.log('dragx GE mapstate', {dGraphDataClass});
        let ret: GraphElementReduxStateProps = (startingobj || {}) as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        GraphElementComponent.mapLModelStuff(state, ownProps, ret);
        // console.log("map ge", {ownProps, ret, state});
        GraphElementComponent.mapLGraphElementStuff(state, ownProps, ret, dGraphDataClass);
        GraphElementComponent.mapViewStuff(state, ret, ownProps);
        // ret.view = LViewElement.wrap(state.idlookup[vid]);
        // view non deve essere più injected ma calcolata, però devo fare inject della view dell'elemento parent. learn ocl to make view target
        Log.exDev(!ret.view, 'failed to inject view:', {state, ownProps, reduxProps: ret});
        // console.log(!ret.view, 'failed to inject view:', {state, ownProps, reduxProps: ret});
        if (ret.view.usageDeclarations) U.objectMergeInPlace(ret, U.evalInContextAndScope(ret.view.usageDeclarations));
        // console.log('GE mapstatetoprops:', {state, ownProps, reduxProps: ret});
        // ret.model = state.models.length ? LModelElement.wrap(state.models[0]) as LModel : undefined;
        setTemplateString(ret, ownProps); // todo: this is heavy, should be moved somewhere where it's executed once unless view changes (pre-render with if?)
        // @ts-ignore
        ret.forceupdate = state.forceupdate;
        // @ts-ignore
        ret.key = ret.key || ownProps.key;
        return ret;
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const ret: GraphElementDispatchProps = {} as any;
        return ret;
    }


    _isMounted: boolean;
    hasSetVertexProperties: boolean = false;
    html: React.RefObject<HTMLElement | undefined>;
    lastViewChanges: {t: number, vid: Pointer<DViewElement>, v: LViewElement, key?: string}[];
    // todo: can be improved by import memoize from "memoize-one"; it is high-order function that memorize the result if params are the same without re-executing it (must not have side effects)
    //  i could use memoization to parse the jsx and to execute the user-defined pre-render function

    select(forUser:Pointer<DUser, 0, 1> = null) {
        const id = this.props.data?.id;
        if (!forUser) forUser = DUser.current;
        // this.props.node.isSelected[forUser] = true;

        BEGIN();
        const selected = Selectors.getSelected();
        if(id) {
            selected[forUser] = this.props.data.id;
            SetRootFieldAction.new('selected', selected);
        }
        SetRootFieldAction.new('_lastSelected', {
            node: this.props.nodeid,
            view: this.props.view.id,
            modelElement: this.props.data?.id
        });
        END();
    }

    constructor(props: AllProps, context: any) {
        super(props, context);
        this.lastViewChanges = [];
        this._isMounted = false;
        this.id = GraphElementComponent.maxid++;
        GraphElementComponent.all[this.id] = this;
        GraphElementComponent.map[props.nodeid as Pointer<DGraphElement>] = this;
        this.html = React.createRef();
        let functionsToBind = [this.onClick, this.onLeave, this.onContextMenu, this.onEnter, this.select];
        for (let f of functionsToBind) (this as any)[f.name] = f.bind(this);
        // @ts-ignore
        this.state = {classes:[] as string[]};

/*
        console.log('GE constructor props:', this.props);
        this.setTemplateString(this.props.view, true);
        /*if (false) this.setTemplateString('{colors:["rEd", "gReen", "blye"], key2:[0,2,5]}',
            '() => { colors = colors.map(c=>c.toLowerCase())}',
            '<div><b>GraphElement colors:</b>{colors.map( (c, i) => <li key={c} style={{color: c}}>{c}</li>)}</div>', true);*/
        // this.onMountBindID();
    }
/*
    onMountBindID() {
        /*if (!this.props.view.bindVertexSizeToView) {
            // get position from view itself
            nodeid = 'nodeof_' + this.props.data.id;
            if (!store.getState().idlookup[nodeid]){
                new CreateElementAction(this.createDataNode(nodeid));
            } // view-indipendent fallback, i do not add view.id to node.id
        } else {* /
        if (this.getId()) return;
        let dnode: DGraphElement = this.createDataNode(this.generateId());
        new CreateElementAction(dnode);
        // let nodeid: Pointer<DGraphElement, 1, 1, LGraphElement> = dnode.id;
        // this.setState({nodeid} );
    }

    getId(): string | undefined {
        return this.props.nodeid;
    }

    generateId(): Pointer<DGraphElement, 1, 1, LGraphElement> {
        // if (this.state.nodeid) return this.state.nodeid;
        let ret: string = 'nodeof_' + this.props.data.id + (this.props.view.bindVertexSizeToView ? '^' + this.props.view.id : '') + '^1';
        const idlookup = store.getState().idlookup;
        ret = U.increaseEndingNumber(ret, false, false, id => !idlookup[id]);
        return ret;
    }

    // to override

    createDataNode(id?: string): DGraphElement {
        return new DGraphElement(id || this.generateId(), this);
    }
 */

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

    private getTemplate(): ReactNode {
        /*if (!this.state.template) {
            this.setTemplateString('{c1: 118}', '()=>{this.setState({c1: this.state.c1+1})}',
                '<div><input value="{name}" onInput="{setName}"></input><p>c1:{this.state.c1}</p><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" /><ul>{colors.map( color => <li>color: {color}</li>)}</ul></div>');
        }*/
        // console.log('getTemplate:', {props: this.props, template: this.props.template, ctx: this.props.evalContext});

        // Log.exDev(debug && maxRenderCounter-- < 0, "loop involving render");
        let context: GObject = {component:this, __proto__:this.props.evalContext};
        context._context = context;

        let displayError = (e: Error, where: string) => {
            const view: LViewElement = this.props.view; //data._transient.currentView;
            let errormsg = (where === "preRenderFunc" ? "Pre-Render " : "") +(e.message||"\n").split("\n")[0];
            if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0) {
                errormsg += '\n\nReminder: nullish operators ".?" and "??" are not supported.'; }
            else if (view.jsxString.indexOf('?.') >= 0) { errormsg += '\n\nReminder: ?. operator and empty tags <></> are not supported.'; }
            else if (e.message.indexOf("Unexpected token '<'")) { errormsg += '\n\nDid you forgot to close a html </tag>?'; }
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
                console.error("errr", {jsxlines, culpritlinesPre, culpritline, culpritlinesPost, stackerrorlinenum, icol, irow, stackerrorlast});

                let rowPre = culpritline.substring(0, stackerrorlinenum.col)
                let rowPost = culpritline.substring(stackerrorlinenum.col);
                let caretCursor = "▓" // ⵊ ꕯ 𝙸 Ꮖ
                if (stackerrorlinenum.col < culpritline.length && stackerrorlast.indexOf("main.chunk.js") === -1) {
                    let jsxcode =
                        <div style={{fontFamily: "monospaced sans-serif", color:"#444"}}>
                            { culpritlinesPre.map(l => <div>{l}</div>) }
                            <div>{rowPre} <b style={{color:"red"}}> {caretCursor} </b> {rowPost}</div>
                            { culpritlinesPost.map(l => <div>{l}</div>) }
                        </div>;
                    console.error("errr", {e, ee, jsxlines, jsxcode, rowPre, rowPost, culpritlinesPre, culpritline, culpritlinesPost, stackerrorlinenum, icol, irow, stackerrorlast});
                    errormsg += " @line " + stackerrorlinenum.row + ":" + stackerrorlinenum.col;
                    return DV.errorView(<div>{errormsg}{jsxcode}</div>, {where:"in "+where+"()", e, template: this.props.template, view: this.props.view});
                } else {
                    // it means it is likely accessing a minified.js src code, sending generic error without source mapping
                }
            } catch(e2) {
                Log.eDevv("internal error in error view", {e, e2, where} );
            }
            return DV.errorView(<div>{errormsg}</div>, {where:"in "+where+"()", e, template: this.props.template, view: this.props.view});
        }

        try {
            console.log("prerenderfunc pre execution", "("+this.props.preRenderFunc+")()", context);
            if (this.props.preRenderFunc) {
                let obj = U.evalInContextAndScope<GObject>("("+this.props.preRenderFunc+")()", [], context);
                console.log("prerenderfunc executed", obj);
                for (let key in obj) { context[key] = obj[key]; }
            }
        }
        catch(e: any) { return displayError(e, "preRenderFunc");  }
        let ret;
        try {
            ret = U.evalInContextAndScope<() => ReactNode>('(()=>{ return ' + this.props.template + '})()', context);
            // ret = this.props.template();
            // ret = U.execInContextAndScope<() => ReactNode>(this.props.template, [], {});
        }
        catch(e: any) { return displayError(e, "getTemplate"); }
        return ret;
    }

    onContextMenu(e: React.MouseEvent<HTMLDivElement>) {
        e.preventDefault();
        e.stopPropagation();
        const selected = Selectors.getSelected();
        const id = this.props.dataid;
        const alreadySelected = Object.keys(selected).filter(function(key) {
            return selected[key] === id;
        });
        if(alreadySelected.length > 0) return;
        this.select();
        SetRootFieldAction.new("contextMenu", {
            display: true,
            x: e.clientX,
            y: e.clientY
        });
    }

    onEnter(e: React.MouseEvent<HTMLDivElement>) { // instead of doing it here, might set this class on render, and trigger it visually operative with :hover selector css
        const isEdgePending = this.props.isEdgePending?.source;
        if (!isEdgePending || this.props.data?.className !== "DClass") return;
        const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
        const canBeExtend = isEdgePending.canExtend(this.props.data as any as LClass, extendError);

        if (canBeExtend) this.setState({classes:[...this.state.classes, "class-can-be-extended"]});
        else this.setState({classes:[...this.state.classes, "class-cannot-be-extended"]});
    }
    onLeave(e: React.MouseEvent<HTMLDivElement>) {
        if (this.props.data?.className !== "DClass") return;
        this.setState({classes: this.state.classes.filter((classname) => {
            return classname !== "class-can-be-extended" && classname !== "class-cannot-be-extended"
        })});
    }
    onClick(e: React.MouseEvent): void {
        e.stopPropagation();
        const selected = Selectors.getSelected();
        const id = this.props.dataid;
        const alreadySelected = Object.keys(selected).filter(function(key) {
            return selected[key] === id;
        });
        if(alreadySelected.length > 0) return;

        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        const isEdgePending = (this.props.isEdgePending?.source);
        if (!isEdgePending) { this.select(); e.stopPropagation(); return; }
        if (this.props.data.className !== "DClass") return;
        SetRootFieldAction.new("contextMenu", {display: false, x: 0, y: 0});
        e.stopPropagation();
        // const user = this.props.isEdgePending.user;
        const source = isEdgePending;
        const extendError: {reason: string, allTargetSuperClasses: LClass[]} = {reason: '', allTargetSuperClasses: []}
        const canBeExtend = isEdgePending.canExtend(this.props.data as any as LClass, extendError);
        if (canBeExtend) {
            const lClass: LClass = LPointerTargetable.from(this.props.data.id);
            // SetFieldAction.new(lClass.id, "extendedBy", source.id, "", true); // todo: this should throw a error for wrong type.
            // todo: use source.addExtends(lClass); or something (source is LClass)
            SetFieldAction.new(lClass.id, "extendedBy", source.id, "+=", true);
            SetFieldAction.new(source.id, "extends", lClass.id, "+=", true);
        }
        SetRootFieldAction.new('isEdgePending', { user: '',  source: '' });

    }

    public render(nodeType?:string, styleoverride:React.CSSProperties={}, classes: string[]=[]): ReactNode {
        if (!this.props.node) return "loading";
        if (this.props.node.__raw.view !== this.props.view.id) {

            let thischange = {t: Date.now(), vid: this.props.node.__raw.view, newvid:this.props.view.id, v: this.props.node.view, newv: this.props.view, key:this.props.key};
            this.lastViewChanges.push(thischange);
            // nan -> false <200 = true
            if (this.lastViewChanges[this.lastViewChanges.length-20]?.t - thischange.t < 200) { // important! NaN<1  and NaN>1 are both false
                // if 3 views changed in <= 0.2 sec
                Log.exDevv("loop in updating View assigned to node. The cause might be missing or invalid keys on GraphElement JSX nodes.", {change_log:this.lastViewChanges, component: this});
            }

            /*console.log("UPDATEVIEW ", {lnode:this.props.node, dnode:this.props.node.__raw, dstore: windoww.s().idlookup[this.props.node.__raw.id], view:this.props.view,
                 data:this.props.data, vid:this.props.view.id, nview:this.props.node.__raw.view});*/
            this.props.node.view = this.props.view;
            return "Updating view...";
        }

        /// set classes
        classes.push(this.props.data?.className || 'DVoid');
        U.arrayMergeInPlace(classes, this.state.classes);
        if (Array.isArray(this.props.className)) { U.arrayMergeInPlace(classes, this.props.className); }
        else if (this.props.className) { classes.push(this.props.className); }
        if (Array.isArray(this.props.class)) { U.arrayMergeInPlace(classes, this.props.class); }
        else if (this.props.class) { classes.push(this.props.class); }
        /// end set classes

        const rnode: ReactNode = this.getTemplate();
        console.log("get template " + this.props.node?.className , {t: this.props.template, rnode});
        let rawRElement: ReactElement | null = UX.ReactNodeAsElement(rnode);
        const me: LModelElement | undefined = this.props.data; // this.props.model;

        // \console.log('GE render', {thiss: this, data:me, rnode, rawRElement, props:this.props, name: (me as any)?.name});

        const addprops: boolean = true;
        let fiximport = !!this.props.node;
        if (addprops && rawRElement && fiximport) {
            if (windoww.debugcount && debugcount++>windoww.debugcount) throw new Error("debug triggered stop");
            // console.log("pre-injecting", {thiss:this, data:this.props.data, props:this.props});
            let fixdoubleroot = true;
            const onDragTestInject = () => {}; // might inject event handlers like this with cloneelement
            // add view props to GraphElement children (any level down)
            const subElements: Dictionary<DocString<'nodeid'>, boolean> = {}; // this.props.getGVidMap();
            try {
                let viewStyle: GObject = {};
                /*
                    if (view.adaptWidth) viewStyle.width = view.adaptWidth; // '-webkit-fill-available';
                    else viewStyle.height = (rootProps.view.height) && rootProps.view.height + 'px';
                    if (view.adaptHeight) viewStyle.height = view.adaptHeight; //'fit-content'; // '-webkit-fill-available'; if needs to actually fill all it's not a vertex but a field.
                    else viewStyle.width = (rootProps.view.width) && rootProps.view.width + 'px';
                    viewStyle = {};
                */
                // viewStyle.pointerEvents = "all";
                viewStyle.order = viewStyle.zIndex = this.props.node?.zIndex;
                viewStyle.display = this.props.view?.display;
                rawRElement = React.cloneElement(rawRElement, // i'm cloning a raw html (like div) being root of the rendered view
                    {
                        key: this.props.key, // this key is not safe. because the component has already been made,
                        // this would be the key of the first sub-component, which is always 1 so doesn't need a key (and is not even a component but a html node in 99% of cases)
                        // could remove it safely but i'm keeping it for debug so i can read keys as html attributes.
                        ref: this.html,
                        // damiano: ref html viene settato correttamente a tutti tranne ad attribute, ref, operation (è perchè iniziano con <Select/> as root?)
                        id: this.props.nodeid,
                        "data-nodeid": this.props.nodeid,
                        "data-dataid": me?.id,
                        "data-viewid": this.props.view.id,
                        "data-modelname": me?.className || "model-less",
                        "data-userselecting": JSON.stringify(this.props.node?.__raw.isSelected || {}),
                        "data-nodetype": nodeType,
                        // "data-order": this.props.node?.zIndex,
                        style: {...viewStyle, order:this.props.node.z, ...styleoverride},
                        className: classes.join(' '),
                        onClick: this.onClick,
                        onContextMenu:this.onContextMenu,
                        onMouseEnter:this.onEnter,
                        onMouseLeave:this.onLeave,
                        children: UX.recursiveMap(rawRElement/*.props.children*/,
                            (rn: ReactNode, index: number, depthIndexes: number[]) => UX.injectProp(this, rn, subElements, this.props.parentnodeid as string, index, depthIndexes))});
                fixdoubleroot = false; // need to set the props to new root in that case.
                if (fixdoubleroot) rawRElement = rawRElement.props.children;
                // console.log("probem", {rawRElement, children:(rawRElement as any)?.children, pchildren:(rawRElement as any)?.props?.children});
            } catch (e) {

                rawRElement = U.evalInContextAndScope<ReactElement>('()=>{ return ' +
                    DV.errorView("error while injecting props to subnodes",
                        {e, rawRElement, key:this.props.key, newid: this.props.nodeid}) + '}',
                    {});

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
        }
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
console.info('graphElement loaded');

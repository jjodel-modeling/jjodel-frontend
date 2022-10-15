import React, {
    Dispatch,
    PureComponent,
    ReactElement,
    ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { connect } from "react-redux";
import {deepStrictEqual} from "assert";
import './graphElement.scss';

import {
    JSXT,
    U,
    UX,
    GObject,
    IStore,
    DViewElement,
    DocString,
    LModelElement,
    Log,
    windoww,
    InOutParam,
    LViewElement,
    SetRootFieldAction,
    CreateElementAction,
    DGraphElement,
    DPointerTargetable,
    Dictionary,
    Selectors,
    DGraph,
    GraphElementStatee,
    GraphElementDispatchProps,
    GraphElementReduxStateProps,
    GraphElementOwnProps,
    RuntimeAccessible, LPointerTargetable, MyProxyHandler,
} from "../../joiner";
console.info('graphElement loading');

function makeEvalContext(props: AllPropss, view: DViewElement): GObject {
    let evalContext: GObject = view.constants ? eval('window.tmp = ' + view.constants) : {};
    evalContext = {...windoww.defaultContext, ...evalContext, model: props.data, ...props};
    windoww.evalContext = evalContext;
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
    try { jsxCodeString = JSXT.fromString(view.jsxString, {factory: 'React.createElement'}); }
    catch (e: any) {
        Log.eDevv('Syntax Error in custom user-defined template. try to remove typescript typings:\n\n' +e.toString() + '\n\n' + view.jsxString, {evalContext});
        jsxCodeString = '<div>Syntax error 1</div>';
    }
    let jsxparsedfunc: () => React.ReactNode;
    try {
        jsxparsedfunc = U.evalInContextAndScope<() => ReactNode>('()=>{ return ' + jsxCodeString + '}', evalContext);
        // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?
    }
    catch (e: any) {
        const errormsg = 'Syntax Error in custom user-defined template.';
        if (e.message.indexOf("Unexpected token .") >= 0 || view.jsxString.indexOf('?.') >= 0 || view.jsxString.indexOf('??') >= 0)
            Log.ee( '\nReminder: nullish operators ".?" and "??" are not supported.\n\n' +e.toString() + '\n\n' + view.jsxString, {jsxCodeString, evalContext});
        else if (view.jsxString.indexOf('?.') >= 0)
            Log.ee(errormsg + '\nReminder: ?. operator and empty tags <></> are not supported.\n\n' +e.toString() + '\n\n' + view.jsxString, {jsxCodeString, evalContext});
        else Log.ee(errormsg);
        jsxparsedfunc = () => <div>Syntax Error 2</div>;
    }

    stateProps.preRenderFunc = view.preRenderFunc;
    stateProps.evalContext = evalContext;
    stateProps.template = jsxparsedfunc;
    console.log('GE settemplatestring:', {stateProps});
}

@RuntimeAccessible
export class GraphElementComponent<AllProps extends AllPropss = AllPropss, GraphElementState extends GraphElementStatee = GraphElementStatee>
    extends PureComponent<AllProps, GraphElementState>{




    public static defaultShouldComponentUpdate<AllProps extends GObject, State extends GObject, Context extends any>
    (instance: React.Component, nextProps: Readonly<AllProps>, nextState: Readonly<State>, nextContext: Context) {
        return (
            !U.shallowEqual(instance.props, nextProps) ||
            !U.shallowEqual(instance.state, nextState)
        );
    }

    static mapViewAndModelElement(state: IStore, ret: GraphElementReduxStateProps, ownProps: GraphElementOwnProps) {
        const meid: string = (typeof ownProps.data === 'string' ? ownProps.data as string : ownProps.data?.id) as string;
        Log.exDev(!meid, "model element id not found in GE.mapstatetoprops", {meid, ownProps, state});
        ret.data = MyProxyHandler.wrap(state.idlookup[meid as any]);
        const viewScores = Selectors.getAppliedViews(ret.data, ret.node, ret.graph, ownProps.view, ownProps.parentViewId);
        ret.views = viewScores.map(e => MyProxyHandler.wrap(e.element));
        ret.view = ret.views[0];
        (ret as any).viewScores = viewScores; // debug only
        /*        if (ownProps.view) {
                    ret.view = DPointerTargetable.wrap(state.idlookup[ownProps.view]);
                } else {
                    ret.view = ret.views[0];
                }*/
    }

    ////// mapper func
    static mapStateToProps(state: IStore, ownProps: GraphElementOwnProps, dGraphDataClass: typeof DGraphElement = DGraphElement): GraphElementReduxStateProps {
        // console.log('dragx GE mapstate', {dGraphDataClass});
        let ret: GraphElementReduxStateProps = {} as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        GraphElementComponent.mapViewAndModelElement(state, ret, ownProps);
        GraphElementComponent.addLGraphElementStuff(state, ownProps, ret, dGraphDataClass);
        // ret.view = LViewElement.wrap(state.idlookup[vid]);
        // view non deve essere più injected ma calcolata, però devo fare inject della view dell'elemento parent. learn ocl to make view target
        Log.exDev(!ret.view, 'failed to inject view:', {state, ownProps, reduxProps: ret});
        console.log(!ret.view, 'failed to inject view:', {state, ownProps, reduxProps: ret});
        if (ret.view.usageDeclarations) U.objectMergeInPlace(ret, U.evalInContextAndScope(ret.view.usageDeclarations));
        console.log('GE mapstatetoprops:', {state, ownProps, reduxProps: ret});
        // ret.model = state.models.length ? LModelElement.wrap(state.models[0]) as LModel : undefined;
        setTemplateString(ret, ownProps);
        // @ts-ignore
        ret.forceupdate = state.forceupdate;
        return ret;
    }

    static addLGraphElementStuff(state: IStore,
                                 ownProps: GraphElementOwnProps,
                                 stateProps: GraphElementReduxStateProps,
                                 dGraphElementDataClass: typeof DGraphElement = DGraphElement,
                                 isDGraph?: DGraph): void {
        const idlookup = state.idlookup;
        let nodeid: string = isDGraph ? isDGraph.id : ownProps.nodeid as string;
        let graphid: string = isDGraph ? isDGraph.id : ownProps.graphid as string;
        // if (!nodeid || !graphid) { Log.ee('node id injection failed'); return; }
        Log.exDev(!nodeid || !graphid, 'node id injection failed'); /*
        if (!nodeid) {
            nodeid = 'nodeof_' + stateProps.data.id + (stateProps.view.bindVertexSizeToView ? '^' + stateProps.view.id : '') + '^1';
            stateProps.nodeid = U.increaseEndingNumber(nodeid, false, false, id => !idlookup[id]);
            todo: quando il componente si aggiorna questo viene perso, come posso rendere permanente un settaggio di reduxstate in mapstatetoprops? o devo metterlo nello stato normale?
        }*/

        stateProps.graph = idlookup[graphid] as DGraphElement as any;
        let dGraphDataClass = DGraph;
        if (!stateProps.graph) { new CreateElementAction(new dGraphDataClass(false, graphid, graphid, 'model_id_pointer_todo_hjkl')); }
        else {
            stateProps.graph = MyProxyHandler.wrap(stateProps.graph);
            Log.exDev(stateProps.graph.__raw.className !== "DGraph", 'graph class is wrong', {graph: stateProps.graph, ownProps});
        }


        let dnode: DGraphElement = idlookup[nodeid] as DGraphElement;

        // console.log('dragx GE mapstate addGEStuff', {dGraphElementDataClass, created: new dGraphElementDataClass(false, nodeid, graphid)});
        if (!dnode) { new CreateElementAction(new dGraphElementDataClass(false, nodeid, graphid)); }
        else { stateProps.node = MyProxyHandler.wrap(dnode); }
    }

    static mapDispatchToProps(dispatch: Dispatch<any>): GraphElementDispatchProps {
        const ret: GraphElementDispatchProps = {} as any;
        return ret;
    }


    _isMounted: boolean;
    // todo: can be improved by import memoize from "memoize-one"; it is high-order function that memorize the result if params are the same without re-executing it (must not have side effects)
    //  i could use memoization to parse the jsx and to execute the user-defined pre-render function
    constructor(props: AllProps, context: any) {
        super(props, context);
        this._isMounted = false;
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

    /*getDefaultTemplate(): () => ReactNode{
        // to delete, i will get it from redux props instead of asking them with a func
        return () => null;
    }*/

    static graphVertexID_counter: Dictionary<DocString<'GraphID'>, Dictionary<DocString<'VertexID'>, boolean>> = {}
    private injectProp = function(e: ReactNode, gvidmap: Dictionary<DocString<'VertexID'>, boolean>): ReactNode {
        const re: ReactElement | null = U.ReactNodeAsElement(e);
        if (!re) return e;
        // @ts-ignore this
        const parentComponent = this;
        // const windoww = window as any;
        // console.log('relement ', {type: (re.type as any).WrappedComponent?.name || re.type}, {thiss, mycomponents: windoww.mycomponents, re, props:re.props});
        // add "view" (view id) prop as default to sub-elements of any depth to inherit the view of the parent unless the user forced another view to apply
        switch ((re.type as any).WrappedComponent?.name || re.type) {
            default:
                console.count('relement default: ' + ((re.type as any).WrappedComponent?.name || re.type));
                return re;
            case windoww.Components.Input.name:
            case windoww.Components.Textarea.name:
                const objid =  re.props.obj?.id || re.props.obj || parentComponent.props.data.id;
                const ret = React.cloneElement(re, {key: re.props.key || parentComponent.props.view.id + '_' + parentComponent.props.data.id + '_' + re.props.field, obj: objid, obj2: objid});
                //console.log('relement Input set props',
                //    {'re.props.obj.id': re.props.obj?.id, 're.props.obj': re.props.obj, 'thiss.props.data.id': thiss.props.data.id, thiss, re, objid, ret, 'ret.props': ret.props});
                return ret;
            case windoww.Components.GraphElement.name:
            case windoww.Components.GraphElementComponent.name:
            case windoww.Components.DefaultNode.name:
            case windoww.Components.DefaultNodeComponent.name:
            case windoww.Components.Graph.name:
            case windoww.Components.GraphComponent.name:
            case windoww.Components.Field.name:
            case windoww.Components.FieldComponent.name:
            case windoww.Components.Vertex.name:
            case windoww.Components.VertexComponent.name:
                const injectProps: GraphElementOwnProps = {} as any;
                injectProps.parentViewId = parentComponent.props.view.id || parentComponent.props.view; // re.props.view ||  thiss.props.view
                injectProps.graphid = parentComponent.props.graphid;
                // const vidmap = GraphElementRaw.graphVertexID_counter;
                // if (!vidmap[injectProps.graphid]) vidmap[injectProps.graphid] = {};
                // const gvidmap = vidmap[injectProps.graphid];
                const validVertexIdCondition = (id: string): boolean => gvidmap[id];
                // todo: come butto dei sotto-vertici dentro un vertice contenitore? o dentro un sotto-grafo? senza modificare il jsx ma solo draggando?
                const dataid = typeof re.props.data === "string" ? re.props.data : re.props.data?.id;
                // forse posso salvarlo con i portali: l'utente specifica i parent-children originali e poi i portali scambiano le cose e fanno sotto-vertici
                const idbasename: string = injectProps.graphid + '^' + re.props.data.id;
                Log.exDev(!injectProps.graphid || !dataid, 'vertex is missing mandatory props.', {graphid: injectProps.graphid, dataid, props: re.props});
                injectProps.nodeid = U.increaseEndingNumber(idbasename, false, false, validVertexIdCondition);
                gvidmap[injectProps.nodeid] = true;
                injectProps.key = injectProps.nodeid; // re.props.key || thiss.props.view.id + '_' + thiss.props.data.id;
                return React.cloneElement(re, injectProps);
        }}.bind(this);

    /*
    makeEvalContext_to_move(view: ViewElement): GObject {
        let evalContext: GObject = view.constants ? eval('window.tmp = ' + view.constants) : {};
        evalContext = {...GraphElementRaw.defaultContext, ...evalContext, model: this.props.data, ...this.props};
        (window as any).evalContext = evalContext;
        return evalContext;
    }
    /*
    setTemplateStringToDelete_move_in_map_statetoprops(view: ViewElement, fromConstructor: boolean = false): void {
        // to delete, i will get it from redux props instead of asking them with a func
        //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
        // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
        let colors = ["red", "green", "blallo"];
        let daa = "daa_var";
        sposta tutto lo stato non-redux in stato redux e memoizza
        learn samuro & zeratul
        // eslint-disable-next-line no-mixed-operators
        windoww.Input2 = Input;
        const evalContext = this.makeEvalContext();
        // const evalContextOld = U.evalInContext(this, constants);
        // this.setState({evalContext});
        //console.error({jsx:view.jsxString, view});

        let jsxCodeString: DocString<ReactNode> = JSXT.fromString(view.jsxString, {factory: 'React.createElement'}) as any;
        const jsxparsedfunc = U.evalInContextAndScope<() => ReactNode>('()=>' + jsxCodeString, evalContext); // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?

        let state: GraphElementState = new GraphElementStatee(view.preRenderFunc, evalContext, jsxparsedfunc) as GraphElementState;
        if (!fromConstructor) this.setState(state);
        else (this as any).state = state;
        console.log('parsed:', {state, thisstate: this.state, 'template':jsxparsedfunc, data:this.props.data});
    }
    /*
        setState<K extends keyof MPState>(state: ((prevState: Readonly<MPState>, props: Readonly<AllProps>) => (Pick<MPState, K> | MPState | null)) | Pick<MPState, K> | MPState | null, callback?: () => void): void {
            if (this._isMounted) super.setState(state, callback);
            else this.state = state as MPState;
        }*/

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
        let ret;
        if (false && this.props.evalContext.Vertex) {
            setTimeout( () => new SetRootFieldAction('forceupdate', 4), 1);
            return <div>Loading</div>;}
        try {
            ret = U.execInContextAndScope<() => ReactNode>(this.props.template, [], this.props.evalContext); }
        catch(e: any) {
            Log.exDevv('Error in custom user-defined template:\n' + e.toString() + '\n\n' + this.props.view.jsxString,
                {templateString: this.props.view.jsxString, evalContext: this.props.evalContext, error: e});
        }
        return ret;
    }

    public render(): ReactNode {
        if (this.props.preRenderFunc) U.evalInContextAndScope(this.props.preRenderFunc, this.props.evalContext);
        const rnode: ReactNode = this.getTemplate();
        let rawRElement: ReactElement | null = U.ReactNodeAsElement(rnode);
        // @ts-ignore
        console.log('GE render', {rnode, rawRElement, props:this.props, name: this.props.data.name});
        const me: LModelElement = this.props.data as LModelElement; // this.props.model;

        const addprops: boolean = true;
        if (addprops && me && rawRElement) {
            const onDragTestInject = () => {}; // might inject event handlers like this with cloneelement
            // add view props to GraphElement childrens (any level down)
            const subElements: Dictionary<DocString<'nodeid'>, boolean> = {}; // this.props.getGVidMap(); // todo: per passarla come prop ma mantenerla modificabile
            rawRElement = React.cloneElement(rawRElement, {key: this.props.key || this.props.view.id + '_' + me.id, onDragTestInject, children: UX.recursiveMap(rawRElement/*.props.children*/,
                    (rn: ReactNode) => this.injectProp(rn, subElements))});
            console.log('tempdebug', {deepStrictEqual, okeys:Object.keys});
            let isEqual = true;
            try {deepStrictEqual(subElements, this.props.node.subElements)} catch(e) { isEqual = false; }
            if (isEqual) {
                this.props.node.subElements = Object.keys(subElements);
            }
        }
        // const injectprops = {a:3, b:4} as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        // rnode = React.cloneElement(rnode as ReactElement, injectprops);

        if (this.props.node?.__raw.containedIn) {
            let $containedIn = $('#' + this.props.node.containedIn);
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
type AllPropss = GraphElementOwnProps & GraphElementDispatchProps & GraphElementReduxStateProps

const GraphElementConnected = connect<GraphElementReduxStateProps, GraphElementDispatchProps, GraphElementOwnProps, IStore>(
    GraphElementComponent.mapStateToProps,
    GraphElementComponent.mapDispatchToProps
)(GraphElementComponent as any);

export const GraphElement = (props: GraphElementOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <GraphElementConnected {...{...props, childrens}} />; }
console.info('graphElement loaded');

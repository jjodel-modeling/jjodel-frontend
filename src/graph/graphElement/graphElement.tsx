import React, {
    Component, CSSProperties,
    Dispatch,
    PureComponent,
    ReactElement,
    ReactNode, ReactNodeArray
} from "react";
//import { map } from "react-itertools";
import { connect } from "react-redux";
import './graphElement.scss';
import {
    JSXT,
    U,
    UX,
    GObject,
    IStore,
    LModel,
    ViewElement,
    DocString, LModelElement, DModelElement, Log, Pointer, DModel,
    windoww, InOutParam, LViewElement
} from "../../joiner";
import {Input, Textarea} from "../../components/forEndUser/bidirectionalInput";
import {GraphElementStatee, GraphElementDispatchProps, GraphElementReduxStateProps, GraphElementOwnProps} from "./sharedTypes/sharedTypes";
// import {Input, Textarea} from "../../components/forEndUser/bidirectionalInput";
// NB: tengo jsx parser, ha performance uguali alla compilazione pre-esecuzione... boh
// import JSXParser from 'index'


const defaultContext = {React, U, Input: Input, Textarea: windoww.Textarea}; // todo: cambia DynamicAccessibleClass per dargli un namespace e usa quello
function makeEvalContext(props: AllPropss, view: ViewElement): GObject {
    let evalContext: GObject = view.constants ? eval('window.tmp = ' + view.constants) : {};
    evalContext = {...defaultContext, ...evalContext, model: props.data, ...props};
    windoww.evalContext = evalContext;
    return evalContext;
}

function setTemplateString(stateProps: InOutParam<GraphElementReduxStateProps>, ownProps: Readonly<GraphElementOwnProps>): void {
    // to delete, i will get it from redux props instead of asking them with a func
    //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
    // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
    const view: LViewElement = stateProps.data._transient.currentView;
    // eslint-disable-next-line no-mixed-operators
    let allProps: AllPropss = {...ownProps, ...stateProps} as AllPropss;
    const evalContext = makeEvalContext(allProps, view);
    // const evalContextOld = U.evalInContext(this, constants);
    // this.setState({evalContext});
    //console.error({jsx:view.jsxString, view});

    // todo: invece di fare un mapping ricorsivo dei figli per inserirgli delle prop, forse posso farlo passando una mia factory che wrappa React.createElement
    console.error('tojsx', {view, jsx:view.jsxString});
    let jsxCodeString: DocString<ReactNode> = JSXT.fromString(view.jsxString, {factory: 'React.createElement'});
    const jsxparsedfunc = U.evalInContextAndScope<() => ReactNode>('()=>' + jsxCodeString, evalContext); // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?

    stateProps.preRenderFunc = view.preRenderFunc;
    stateProps.evalContext = evalContext;
    stateProps.template = jsxparsedfunc;
    console.log('GE settemplatestring:', {stateProps});
}

export class GraphElementRaw<AllProps extends AllPropss, GraphElementState extends GraphElementStatee> extends PureComponent<AllProps, GraphElementState>{
    ////// mapper func
    static mapStateToProps(state: IStore, ownProps: GraphElementOwnProps): GraphElementReduxStateProps {
        let ret: GraphElementReduxStateProps = {} as GraphElementReduxStateProps; // NB: cannot use a constructor, must be pojo
        const meid: string = (typeof ownProps.data === 'string' ? ownProps.data as string : ownProps.data?.id) as string;
        Log.exDev(!meid, "model element id not found in GE.mapstatetoprops", {meid, ownProps, state});
        ret.data = LModelElement.wrap(state.idlookup[meid as any]);
        ret.view = ret.data._transient.currentView;
        // ret.view = LViewElement.wrap(state.idlookup[vid]);
        if (ret.view.usageDeclarations) U.objectMergeInPlace(ret, U.evalInContextAndScope(ret.view.usageDeclarations));
        console.log('GE mapstatetoprops:', {state, ownProps, reduxProps: ret});
        // ret.model = state.models.length ? LModelElement.wrap(state.models[0]) as LModel : undefined;
        setTemplateString(ret, ownProps);
        return ret;
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

    }
    // constants: evalutate solo durante il primo render, può essere una funzione con effetti collaterali sul componente,
    // in tal caso la si esegue e si prende il valore di ritorno.
    // preRenderFunc: funzione evalutata ed eseguita sempre prima del render, ha senso solo per generare effetti collaterali sulle "costanti".
    // jsxString: funzione evalutata una sola volta durante il primo render ed eseguita ad ogni update dei dati.

    /*getDefaultTemplate(): () => ReactNode{
        // to delete, i will get it from redux props instead of asking them with a func
        return () => null;
    }*/

    private addViewProp = function(e: ReactNode): ReactNode {
        const re: ReactElement | null = U.ReactNodeAsElement(e);
        if (!re) return e;
        // @ts-ignore this
        const thiss = this;
        // const windoww = window as any;
        console.log('relement ', {type: (re.type as any).WrappedComponent?.name || re.type}, {thiss, mycomponents: windoww.mycomponents, re, props:re.props});
        // add "view" (view id) prop as default to sub-elements of any depth to inherit the view of the parent unless the user forced another view to apply
        switch ((re.type as any).WrappedComponent?.name || re.type) {
            default:
                console.log('relement default');
                return re;
            case windoww.mycomponents.Input.name:
            case windoww.mycomponents.Textarea.name:
                const objid =  re.props.obj?.id || re.props.obj || thiss.props.data.id;
                const ret = React.cloneElement(re, {key: re.props.key || thiss.props.view.id + '_' + thiss.props.data.id + '_' + re.props.field, obj: objid, obj2: objid});
                console.log('relement Input set props',
                    {'re.props.obj.id': re.props.obj?.id, 're.props.obj': re.props.obj, 'thiss.props.data.id': thiss.props.data.id, thiss, re, objid, ret, 'ret.props': ret.props});
                return ret;
            case GraphElement.name:
            case windoww.mycomponents.Graph.name:
            case windoww.mycomponents.Field.name:
            case windoww.mycomponents.VertexRaw.name:
                return React.cloneElement(re, {key: re.props.key || thiss.props.view.id + '_' + thiss.props.data.id, view: re.props.view || thiss.props.view, graphID: thiss.props.graphID});
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
        console.log('getTemplate:', {props: this.props, template: this.props.template, ctx: this.props.evalContext});
        return U.execInContextAndScope<() => ReactNode>(this.props.template, [], this.props.evalContext)
    }

    render(): ReactNode {
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
            rawRElement = React.cloneElement(rawRElement, {key: this.props.key || this.props.view.id + '_' + me.id, onDragTestInject, children: UX.recursiveMap(rawRElement/*.props.children*/, this.addViewProp)});
        }
        // const injectprops = {a:3, b:4} as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        // rnode = React.cloneElement(rnode as ReactElement, injectprops);
        return rawRElement || rnode;
    }


    //NB: do not add logic functions like setName here, add them on data (proxy of raw model data). to edit model just do: oninput={(e)=>{this.model.name=e.target.value}, the proxy will trigger a redux action
}

// private
type AllPropss = GraphElementOwnProps & GraphElementDispatchProps & GraphElementReduxStateProps

export const GraphElement = connect<GraphElementReduxStateProps, GraphElementDispatchProps, GraphElementOwnProps, IStore>(
    GraphElementRaw.mapStateToProps,
    GraphElementRaw.mapDispatchToProps
)(GraphElementRaw);

import React, {
    Component,
    Dispatch,
    PureComponent,
    ReactElement,
    ReactNode
} from "react";
//import { map } from "react-itertools";
import { connect } from "react-redux";
import './graphElement.scss';
import logo from "../../logo.svg";
import JsxParser from 'react-jsx-parser';
// var jsx = require('jsx-recast');
// import * as jsxRecast from 'jsx-recast';
import * as jsxtt from 'jsx-transform/lib/jsx.js';
import {Empty, JSXT, U, GObject, Json, Log, IStore, UserState, LModel, LModelElement, Proxyfied, ViewElement} from "../../joiner";
import Attribute from "../../components/modelling/attribute/attribute";
import {Vertex} from "../vertex/Vertex";
import {Field} from "../field/Field";
import {windoww} from "../../joiner/types";
import {Input} from "../../components/forEndUser/bidirectionalInput";
// import {Input, Textarea} from "../../components/forEndUser/bidirectionalInput";
const jsxt = jsxtt as any;
// NB: tengo jsx parser, ha performance uguali alla compilazione pre-esecuzione... boh
// import JSXParser from 'index'
function map(...aaa: any): any{ return null; }

interface MPState {
    preRenderFunc?: string;
    evalContext: Json;
    template: () => ReactNode;
}

class GraphElement extends PureComponent<AllProps, MPState>{
    _isMounted: boolean;
    // todo: can be improved by import memoize from "memoize-one"; it is high-order function that memorize the result if params are the same without re-executing it (must not have side effects)
    //  i could use memoization to parse the jsx and to execute the user-defined pre-render function
    constructor(props: AllProps, context: any) {
        super(props, context);
        this._isMounted = false;
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
    private test() {
        let a = 0 ?? 1;
    }

    private addViewProp(e: ReactNode) {
        const re: ReactElement | null = U.ReactNodeAsElement(e);
        if (!re) return e;
        console.log('relement type:', re.type, {Vertex, Field});
        switch (re.type) {
            default: return re;
            case Field:
            case Vertex: return React.cloneElement(re, {view: re.props.view || this.props.view, graphID: this.props.graphID});
        }}

    setTemplateString(view: ViewElement, fromConstructor: boolean = false): void {
        // to delete, i will get it from redux props instead of asking them with a func
        //if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
        // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
        let colors = ["red", "green", "blallo"];
        let daa = "daa_var";
        // eslint-disable-next-line no-mixed-operators
        let evalContext: GObject = view.constants && eval('window.tmp = ' + view.constants) || {};
        windoww.Input2 = Input;
        const defaultContext = {React, U, Input: Input, Textarea: windoww.Textarea};
        evalContext = {...defaultContext, ...evalContext, model: this.props.data, ...this.props};
        (window as any).evalContext = evalContext;
        // const evalContextOld = U.evalInContext(this, constants);
        // this.setState({evalContext});
        console.error({jsx:view.jsxString, view});
        let rawRNode: ReactNode = JSXT.fromString(view.jsxString, {factory: 'React.createElement'});
        let rawRElement: ReactElement | null = U.ReactNodeAsElement(rawRNode);
        const model: LModel = this.props.data; // this.props.model;

        if (model && rawRElement) {
            rawRElement = React.cloneElement(rawRElement, {key: this.props.view.id + '_' + model.id, onDrag, children: map(rawRElement.props.children, this.addViewProp)});
        }

        // todo: aggiungi eventi di spostamento sui childrens che lo fanno comportare come vertice o container html-svg
        function onDrag() {
            Log.ee('onDrag todo');
        }


        let res: string = '()=>' + rawRNode;
        const parsedfunc = U.evalInContextAndScope<() => ReactNode>(res, evalContext); // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?
        let state: MPState = {preRenderFunc: view.preRenderFunc, evalContext, template: parsedfunc};
        if (!fromConstructor) this.setState(state);
        else this.state = state;
        console.log('parsed:', {state, thisstate: this.state, 'template':parsedfunc, data:this.props.data});
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

    componentDidUpdate(oldProps: Readonly<AllProps>) {
        const newProps = this.props
        if (oldProps.view !== newProps.view) { this.setTemplateString(newProps.view); }
    }

    private getTemplate(): ReactNode {
        /*if (!this.state.template) {
            this.setTemplateString('{c1: 118}', '()=>{this.setState({c1: this.state.c1+1})}',
                '<div><input value="{name}" onInput="{setName}"></input><p>c1:{this.state.c1}</p><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" /><ul>{colors.map( color => <li>color: {color}</li>)}</ul></div>');
        }*/
        console.log('getTemplate:', {state: this.state, template: this.state.template, ctx: this.state.evalContext});
        return U.execInContextAndScope(this.state.template, [], this.state.evalContext)
    }


    render(): ReactNode {
        if (this.state?.preRenderFunc) U.evalInContextAndScope(this.state.preRenderFunc, this.state.evalContext);
        const rnode: ReactNode = this.getTemplate();
        // const injectprops = {a:3, b:4} as DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
        // rnode = React.cloneElement(rnode as ReactElement, injectprops);
        return rnode;
    }

    renderOld() {
        window[('' + 'React') as any] = React as any;
        window[('' + 'mp') as any] = this as any;
        window[('' + 'mpr') as any] = this.render as any;
        window[('' + 'jsxt') as any] = jsxt as any;
        // window[('' + 'jsxrecast') as any] = jsxRecast as any;
        const dynamic = "@@@@@";
        let daa = "<h1>\n" +
            "<span>static</span><span>{dynamic}</span>\n" +
            "<img src={logo} className=\"App-logo\" alt=\"logo\"/> </h1>\n";
        daa = "_inner_daa_";

        window['' + 'rawjsstr' as any] = window['' + 'rawjsstr' as any] || "<h1>Headeeer, daa:{daa}, upper: {daa.toUpperCase()}</h1>" +
        "<Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" />"
        + " for NON funziona, vedi se funziona IF e apri issue" as any;
        // + "<h1>colors:</h1><ul>{colors.map( (color) => {return (<li>color: {color}</li>)})}</ul>" as any;
        // + "<h1>colors:</h1><ul>{mapp(colors, (<li>color: {color}</li>))})}</ul>" as any;
        // + "<h1>colors:</h1><ul>{ for(let color of colors) {coltmp.push(<li>color: {color}</li>)}} {coltmp}</ul>" as any;
        window['' + 'rawjsstr' as any] = "<div>" + window['' + 'rawjsstr' as any] + "</div>" as any;
        let colors = ["red", "green", "blye", "blallo"];
        let rawjsxstr = window['' + 'rawjsstr' as any] as any;
        let jsxstrtemplate = rawjsxstr; // eval("`" + rawjsxstr + "`");
        const timePre = new Date();
        let ret;
        for (let i = 0; i < 1; i++){
            ret = (
                <div className="GraphElement" onClick={()=>this.forceUpdate()}>

                    {/*<h3>GraphElement</h3>
                <div >{daa}</div>
                <div dangerouslySetInnerHTML={{__html: daa}} />
                <Attribute props1={"prop1"} props2="prop2"><span>contentPassedtoChild</span></Attribute>
                */}
                    <JsxParser
                        bindings={{
                            daa: '_inner_daa_',
                            colors: colors,
                            myEventHandler: () => {  },
                            coltmp: [],
                            mapp: (colors: string[], jsx: any) => {
                                return colors.map( (color) => jsx);
                            },
                            color: "wrongColorBinding",
                            renderCol: (colorr: any) => (<li>{colorr}</li>),
                        }}
                        components={{ Attribute }}
                        // jsx={"<><h1>colors:</h1><ul><li>static</li></ul></>"}
                        // jsx={"<><h1>colors:</h1><ul>{colors.map( color => <li>color: {color}</li>)}</ul></>"}
                        // jsx={"<ul><li items={colors} renderer={renderCol} /></ul>"}
                        jsx={"<ul><List items={colors}><li>{elem}</li></List></ul>"}
                        // jsx={"<ul><List tag='li' items={colors}>{elem}</List></ul>"}
                    />
                    {/*<h1>Header, daa:{daa}, upper: {daa.toUpperCase()}</h1><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa="daa" />*/}
                    <p> post jsx parser (static colors)</p>
                    {
                        <><h1>colors:</h1><ul>{colors.map( color => <li>color: {color}</li>)}</ul></>
                    }
                </div>
            );
        }

        console.error("time spent:", (new Date().getTime() - timePre.getTime()));
        return this.getTemplate();
    }

    //NB: do not add logic functions like setName here, add them on data (proxy of raw model data). to edit model just do: oninput={(e)=>{this.model.name=e.target.value}, the proxy will trigger a redux action
}

// private
interface StateProps {
    userexample?: UserState; // todo: make and repace with proxy wrapper "User"
    view: ViewElement;
    graphID: string;
    // model?: LModel;
    [userMappedFromRedux: string]: any;
}

function funzioneTriggeraAzioneDaImportare(putCorrectRequiredParams?: boolean): void {}

// private
interface DispatchProps {
    toggleOn_TriggerForAction: typeof funzioneTriggeraAzioneDaImportare;
}

// private
interface OwnProps {
    data: LModel;
    view: ViewElement;
}

// private
type AllProps = StateProps & DispatchProps & OwnProps

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = ownProps.view.usageDeclarations ? U.evalInContextAndScope(ownProps.view.usageDeclarations) : {} as any;
    ret.isOn = true;
    ret.userexample = state.user;
    console.log('graphelement mapstatetoprops:', {state});
    // ret.model = state.models.length ? LModelElement.wrap(state.models[0]) as LModel : undefined;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    ret.toggleOn_TriggerForAction = funzioneTriggeraAzioneDaImportare;
    return ret;
}


export default connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(GraphElement);

import React, {Component, Dispatch, PureComponent, ReactElement, ReactNode} from "react";
import { connect } from "react-redux";
import './modelpiece.css';
import logo from "../../logo.svg";
import Attribute from "../attribute/attribute";
import JsxParser from 'react-jsx-parser';
// var jsx = require('jsx-recast');
// import * as jsxRecast from 'jsx-recast';
import * as jsxtt from 'jsx-transform/lib/jsx.js';
import {Empty, JSXT, U, GObject, Json} from "../../../joiner";
import {IStore, UserState} from "../../../redux/store";
const jsxt = jsxtt as any;
// NB: tengo jsx parser, ha performance uguali alla compilazione pre-esecuzione... boh
// import JSXParser from 'index'

interface MPState {
    preRenderFunc: string;
    evalContext: Json;
    template: () => ReactNode;
}

class ModelPiece extends PureComponent<AllProps, MPState>{
    _isMounted: boolean;
    constructor(props: AllProps, context: any) {
        super(props, context);
        this._isMounted = false;
        this.setTemplateString('{colors:["rEd", "gReen", "blye"], key2:[0,2,5]}',
            '() => { colors = colors.map(c=>c.toLowerCase())}',
            '<div><b>ModelPiece colors:</b>{colors.map( (c, i) => <li key={c} style={{color: c}}>{c}</li>)}</div>', true);
    }
    // constants: evalutate solo durante il primo render, può essere una funzione con effetti collaterali sul componente,
    // in tal caso la si esegue e si prende il valore di ritorno.
    // preRenderFunc: funzione evalutata ed eseguita sempre prima del render, ha senso solo per generare effetti collaterali sulle "costanti".
    // jsxString: funzione evalutata una sola volta durante il primo render ed eseguita ad ogni update dei dati.
    getDefaultTemplate(): () => ReactNode{
        return () => null;
    }

    setTemplateString(constants: string, preRenderFunc: string, jsxString: string, fromConstructor: boolean = false): void {
        if (!jsxString) { this.setState({template: this.getDefaultTemplate()}); return; }
        // sintassi: '||' + anything + (opzionale: '|' + anything)*N_Volte + '||' + jsx oppure direttamente: jsx
        let colors = ["red", "green", "blallo"];
        let daa = "daa_var";
        // eslint-disable-next-line no-mixed-operators
        const evalContext: GObject = constants && eval('window.tmp = ' + constants) || {};
        evalContext.React = React;
        evalContext.U = U;
        // const evalContextOld = U.evalInContext(this, constants);
        // this.setState({evalContext});
        let res: string = '()=>' + JSXT.fromString(jsxString, {factory: 'React.createElement'});
        const parsedfunc = U.evalInContextAndScope<() => ReactNode>(res, evalContext); // U.evalInContext({...this, ...evalContext}, res); // todo: remove eval and add new Function() ?
        let state: MPState = {preRenderFunc, evalContext, template: parsedfunc};
        if (!fromConstructor) this.setState(state);
        else this.state = state;
        console.log('parsed:', {state, thisstate: this.state}, 'template:', parsedfunc);
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

    getTemplate(): ReactNode {
        /*if (!this.state.template) {
            this.setTemplateString('{c1: 118}', '()=>{this.setState({c1: this.state.c1+1})}',
                '<div><input value="{name}" onInput="{setName}"></input><p>c1:{this.state.c1}</p><Attribute prop1={daa} prop2={1 + 1.5} stringPropdaa=\"daa\" /><ul>{colors.map( color => <li>color: {color}</li>)}</ul></div>');
        }*/
        console.log('getTemplate:', {state: this.state, template: this.state.template, ctx: this.state.evalContext});
        return U.execInContextAndScope(this.state.template, [], this.state.evalContext)

    }


    render(): ReactNode {
        if (this.state?.preRenderFunc) U.evalInContextAndScope(this.state.preRenderFunc, this.state.evalContext);
        return this.getTemplate();
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
            <div className="modelpiece" onClick={()=>this.forceUpdate()}>

                {/*<h3>modelpiece</h3>
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

    /// logic part begin
    setName(e: Event): void {

    }
}

// private
interface StateProps {
    isOn: boolean
    userexample?: UserState; // todo: make and repace with proxy wrapper "User"
}

function funzioneTriggeraAzioneDaImportare(putCorrectRequiredParams?: boolean): void {}

// private
interface DispatchProps {
    toggleOn_TriggerForAction: typeof funzioneTriggeraAzioneDaImportare;
}

// private
interface OwnProps {
    backgroundColor: string
}

// private
type AllProps = StateProps & DispatchProps & OwnProps

////// mapper func

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.isOn = true;
    ret.userexample = state.user;
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
)(ModelPiece);

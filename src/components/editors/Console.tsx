import {
    DEdge,
    DGraphElement,
    Dictionary,
    DState,
    GObject,
    LGraphElement,
    LModelElement,
    Log,
    LPointerTargetable,
    LViewElement,
    Pointer,
    RuntimeAccessibleClass,
    transientProperties,
    U,
    windoww
} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, PureComponent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';

import './style.scss'; // <-- tenuto per retro-compatibilità ma dovrebbe sparire
import './editors.scss'; // <-- stile comune a tutte le tab editor (idealmente da tenere leggero)
import './console.scss'; // <-- stile di questa tab
import ReactDOM from "react-dom";
import {Empty} from "./Empty";
import {Tooltip} from "../forEndUser/Tooltip";

const Convert = require('ansi-to-html');

let ansiConvert = (window as any).ansiConvert;
if (!ansiConvert) (window as any).ansiconvert = ansiConvert = new Convert();

class ThisState{
    expression: string = '';
    output: any = null;
    expressionIndex: number = 0;
    expressionHistory: string[] = [''];
    initialState: boolean = true;
    time: number = 0;
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto

let hiddenkeys = ["jsxString", "pointedBy", "clonedCounter", "parent", "_subMaps", "inspect", "__random"];
function fixproxy(output: any/*but not array*/, hideDKeys: boolean = true, addLKeys: boolean = true):
    { output: any, shortcuts?: GObject<'L singleton'>, comments?: Dictionary<string, string | {type:string, txt:string}>, hiddenkeys?: GObject} {

    let ret: ReturnType<typeof fixproxy> = {output};
    if (!output) return ret;

    let proxy: LPointerTargetable | undefined;
    if (output?.__isProxy) {
        proxy = output;
        output = output.__raw; //Object.fromEntries(Object.getOwnPropertyNames(p).map(k => [k, p[k]]));
    } else proxy = undefined;

    switch (typeof output) {
        case "function": {
            let fdata =  U.buildFunctionDocumentation(output);
            return {output: fdata};
        }
        default: return ret;
        case "object":
            // if (Array.isArray(output)) { ret.output = output; break; /* no need to go inside, it is already done at render phase */ }
            ret.output = output = {...output};
            // if (ret.output.anchors) ret.output.anchors = JSON.stringify(ret.output.anchors);
            if ((addLKeys && proxy)) {
                let Lsingleton: GObject<'L singleton'> = (RuntimeAccessibleClass.get(output?.className)?.logic?.singleton) || {};
                let comments: Dictionary<string, string | {type:string, txt:string}> = {};
                ret.shortcuts = {...Lsingleton};
                ret.comments = comments;
                for (let key in output) {
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                }
                for (let key in Lsingleton) {
                    if ((key in output) || (key.indexOf("__info_of__") === 0)) {
                        delete ret.shortcuts[key];
                        continue;
                    } else { if (ret.shortcuts[key] === undefined) ret.shortcuts[key] = ''; }
                    if (key.indexOf("info") >=0 && key.indexOf("of") >=0){
                        Log.eDevv('Possible error on __info_of__ misnamed as '+key+', if the name was intentional' +
                            ' and not an Info object add an allowal rule here.');
                        continue;
                    }
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                    if (comments[key]) continue; // if explicitly commented, i will not attempt to generate documentation.
                    let entryvalue = Lsingleton[key];
                    switch (typeof entryvalue) {
                        default:
                        case "object":
                            ret.shortcuts[key] = entryvalue;
                            break;
                        case "function":
                            ret.shortcuts[key] = U.buildFunctionDocumentation(entryvalue);
                            break;
                    }
                }
            }
            if (hiddenkeys) {
                ret.hiddenkeys = {};
                for (let key of hiddenkeys) {
                    ret.hiddenkeys[key] = output[key];
                    delete output[key];
                    // delete output.shortcuts[key];
                }
            }
            break;
    }

    //@ts-ignore
    ret ={...ret, shortcuts: undefined, comments: undefined, hiddenkeys: undefined};
    console.log('kkkk',  ret);

    return ret;
}


class ConsoleComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "ConsoleComponent";
    lastNode?: Pointer<DGraphElement>;
    constructor(props: AllProps) {
        super(props);
        this.state = new ThisState();
        this.change = this.change.bind(this);
        this.change(undefined);
    }
    private _context: GObject = {};
    change(evt?: React.ChangeEvent<HTMLTextAreaElement>) {
        if (!this) return; // component being destroyed and remade after code hot update
        let expression0: string = (evt ? evt.target.value : this.state.expression) || '';
        let expression: string = expression0.trim();
        let output;
        // let context = {...this.props, props: this.props}; // makeEvalContext(this.props as any, {} as any);

        let nid = this.props.node?.id;
        let tn = transientProperties.node[nid as string];
        if (nid && tn) {
            // let component = GraphElementComponent.map[this.props.node.id];
            this._context = {...tn.viewScores[tn.mainView.id].evalContext};
            this._context.fromcomponent = true;
        }
        else {
            this._context = {...this.props, props: this.props};
        }
        try {
            // if (expression === 'this') expression = 'data'; // it does a mess by taking a L-singleton with all his __info_of__ stuff
            if (expression === 'this') output = this._context;
            else output = U.evalInContextAndScope(expression || '<span class="console-msg">undefined</span>', this._context, this._context);
        }
        catch (e: any) {
            console.error("console error", e);
            // output = '<span class="console-error">Invalid Syntax!</span> <span class="console-error-msg">' + e.toString() + '<span>' ; }
            output = '<span class="console-error-msg"><i class="bi bi-exclamation-square-fill"></i><span>' + e.toString() + '</span></span>' ; }
        this.setState({expression:expression0, output });
    }

    // textarea: HTMLTextAreaElement | null = null;
    getClickableEntry(expression: string, k: string, arr?: any): JSX.Element{
        return <li onClick={()=> {
            let isnum = !isNaN(+k);
            let isregular: boolean = isnum ? true : /\w/.test(k);
            let append: string;
            if (isnum) append = '['+k+']';
            else if (isregular) append = '.'+k;
            else append = '['+JSON.stringify(k)+']';
            this.setState({expression: (expression ? expression + append : k)}/*, ()=> { this.change(); }*/);
        }}>{k}{arr && arr[k] ? <>:{arr[k]}</> : undefined}</li>;
    }

    outputhtml: HTMLElement | null = null;
    setState(s: GObject<Partial<ThisState>> | null, callback?: (...a:any) => any): void{
        if (s){
            if (s.initialState) {
                delete s.initialState;
                return super.setState(s as any);
            }
            let s0: GObject<ThisState> = {...s} as any;
            let olds = this.state;
            if (s0.expressionIndex && s0.expressionIndex !== olds.expressionIndex) s.expression = olds.expressionHistory[s0.expressionIndex];
            if (s0.expressionHistory && s0.expressionHistory !== olds.expressionHistory){
                let len = s0.expressionHistory.length;
                if (len > 10) s.expressionHistory = s0.expressionHistory.slice(len - 10, len);
            }
            if (s0.expression && s0.expression !== olds.expression) {
                let time = new Date().getTime();
                let oldtime = olds.time;
                Log.exDev(s0.expressionIndex !== undefined, 'cannot set both index and expression together');
                let i = s.expressionIndex ?? olds.expressionIndex;
                let slice: string[];
                if (time - oldtime < 1000) {
                    slice = olds.expressionHistory.slice(0, i);
                }
                else {
                    slice = olds.expressionHistory.slice(0, i+1);
                    s.expressionIndex = i + 1;
                }
                s.time = time;
                s.expressionHistory = [...slice, s0.expression];
                console.log('setstate', {olds: {...olds}, s, slice, i, s0});
            }
            if (s.expression !== olds.expression && !('output' in s)) {
                let call0 = callback;
                callback = () => { call0?.(); this.change(); }
            }
        }
        super.setState(s as any, callback);
    }
    render(){
        /*const [expression, setExpression] = useStateIfMounted('data');
        const [output, setOutput] = useStateIfMounted('');*/
        if(this.props.node?.className === DEdge.name) return <Empty msg={"Console not available on DEdge."} />;
        if (!this.props.node) return <Empty msg={"Select a node."} />;
        let expression = this.state.expression.trim();
        if (expression === 'this') expression = 'data';
        const data = this.props.data;
        if (this.lastNode !== this.props.node.id) this.change(); // force reevaluation if selected node changed
        this.lastNode = this.props.node.id;

        let outstr;
        // try { outstr = U.circularStringify(this.state.output, (key, value)=> { return value.__isProxy ? value.name : value; }, "\t", 1) }
        // (window as any).inspect = util.inspect;
        // (window as any).tmpp = this.state.output;
        let ashtml: boolean
        let output: any = this.state.output;
        let shortcuts: GObject<'L singleton'> | undefined = undefined;
        let comments: Dictionary<string, string | {type:string, txt:string}> | undefined = undefined;
        let hidden: Dictionary<string, string> | undefined = undefined;
        let jsxComments: Dictionary<string, JSX.Element[]> = {};
        let shortcutsjsx: ReactNode = undefined;
        try {
            if (Array.isArray(output)){
                comments = {"separator": '<span>Similar to <a href={"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join"}>Array.join(separator)</a>' +
                        ', but supports array of JSX nodes and JSX as separator argument.</span>'};
                shortcuts = {"separator": ""};
            }
            if (Array.isArray(output)) {
                output = output.map(o => fixproxy(o).output);
            }
            else {
                let ret = fixproxy(output);
                output = ret.output;
                comments = ret.comments;
                shortcuts = ret.shortcuts;
                hidden = ret.hiddenkeys;
            }
            // todo: as i fix the displaying of a LViewElement without replacing it with __raw,
            //  i will fix window, component and props displaying too i think they crash for props.data, props.view...
            if (output?._reactInternals) {
                output = {"React.Component": {props:"...navigate to expand...", state:"", _isMounted:output._isMounted}}
            }
            outstr = '<h4>Result</h4><section class="group result-container"><div class="output-row" tabindex="984">' + U.objectInspect(output)+"<span>";
            let commentsPopup = "";
            if (shortcuts || comments){
                // if(!shortcuts) shortcuts = {};
                if (!comments) comments = {};
                for (let commentKey in comments){
                    let commentVal: any = comments[commentKey];
                    let txt = commentVal?.txt;
                    if (txt && typeof txt !== "string") {
                        // try to inject jsx
                        jsxComments[commentKey] = txt;
                        txt = "<span id='console_output_comment_" + commentKey + "'  class='console-msg'/>";
                        // fallback read text, that should go deep iteration, but 1 level deep should be enough.
                        // let arr: any[] = (Array.isArray(txt?.props?.children) ? txt.props.children : (txt.props.children ? [txt.props.children] : []));
                        // txt = arr.map(e => typeof e === "string" ? e : e?.props?.children + '' || '').join("");
                    }
                    if (commentVal?.type) commentVal = "\t\t<span class='console-msg'>" + (commentVal?.type?.cname || commentVal.type)+"</span>"; // + " ~ " + txt;
                    // warning: unicode char but should not make a problem. 𐀹
                    commentVal += '<div class="output-comment my-tooltip">' + txt + '</div></div><div class="output-row" tabindex="984">'

                    let commentKeyEscaped = U.multiReplaceAll(commentKey, ["$", "-"], ["\\$", "\\-"]); // _ should be safe, .-,?^ not happening?
                    let regexp = new RegExp("^({?\\s*" +commentKeyEscaped+":.*)$", "gm");
                    let regexpCloseTags = new RegExp("(\\<span style\\=\"color\\:\\#)", "gm");
                    outstr = U.replaceAll( outstr, "$", "£");
                    outstr = outstr.replace(regexp, "$1" + commentVal);
                    outstr = outstr.replace(regexpCloseTags,  "</span>$1");
                    outstr = U.replaceAll(outstr, "£", "$");
                }


                /*if (shortcuts) outstr += "</div></section><br><br>" +
                    "<h4>Shortcuts</h4><section class='group shortcuts-container'><div class=\"output-row\" tabindex=\"984\">" + U.objectInspect(shortcuts)+"</section>";
                */

                if (shortcuts) {
                    shortcutsjsx = <ul>{
                        Object.keys(shortcuts).sort().map(k=>this.getClickableEntry(expression, k, shortcuts))
                    }</ul>
                }
                // if (hidden) outstr +="</div><br><br><h4>Other less useful properties</h4><div class=\"output-row\" tabindex=\"984\">" + format(hidden);
                // warning: unicode char but should not make a problem.
                // outstr = U.replaceAll( outstr, '𐀹,\n', '],</span>\n</div><div class="output-row" tabindex="984"><span style="color:#000">');
                outstr = U.replaceAll( outstr, '<span style="color:#000" class="console-msg">,\n',
                    '</span><span style="color:#000" class="console-msg">,</span>\n</div><div class="output-row" tabindex="984"><span class="console-msg" style="color:#000">');
                outstr = U.replaceAll( outstr, '],\n', '],</span>\n</div><div class="output-row" tabindex="984"><span class="console-msg" style="color:#000">');
                outstr = U.replaceAll( outstr, '},\n', '},</span>\n</div><div class="output-row" tabindex="984"><span class="console-msg" style="color:#000">');
            }
            ashtml = true; }
        catch(e: any) {
            console.error(e);
            throw e;
            outstr = "[circular object]: " + e.toString();
            ashtml = false;
        }
        let contextkeysarr: (string)[];
        let contextkeys: ReactNode = '';
        if (this.state.expression.trim() === "this") contextkeys = "Warning: \"this\" in the console is aliased to data instead of the whole context of a GraphElement component.";

        let objraw = this.state.output?.__raw || (typeof this.state.output === "object" ? this.state.output : "[primitiveValue]") || {};
        if (this.state.expression.trim() === "") contextkeysarr = ["data", "node", "view", "component"];
        else if (typeof objraw === "string") { contextkeysarr = Object.keys(String.prototype); }
        else contextkeysarr = (Array.isArray(objraw) ?
                [...(Object.keys(objraw) as any as number[]).filter(k => (k) <= 10).map(k=>k===10 ? '...' : ''+k), ...Object.keys(Array.prototype)]
                : Object.getOwnPropertyNames(objraw)) || [];

        contextkeys = <ul>{
            contextkeysarr.sort().map(k=>this.getClickableEntry(expression, k))
        }</ul>;


        let injectCommentJSX = () => {
            try{ for (let key in jsxComments) {
                if (hiddenkeys.includes(key)) continue;
                let commentNode: HTMLElement | null = document.getElementById("console_output_comment_"+key);
                Log.eDev(!commentNode, "failed to find comment placeholder", {key, v:jsxComments[key], jsxComments});
                if (commentNode) ReactDOM.render(jsxComments[key], commentNode);
            } }
            catch (e) { console.error("failed to inject console output comment:", e)}
        }
        setTimeout(injectCommentJSX, 1)
        this.setNativeConsoleVariables();
        windoww.output = output;
        windoww.contextkeysarr = contextkeysarr;
        windoww.contextkeys = contextkeys;
        const undo = ()=>{
            let expressionIndex = Math.max(0, this.state.expressionIndex - 1);
            if (expressionIndex === this.state.expressionIndex) return;
            this.setState({ expressionIndex })
        }
        const redo = ()=>{
            const expressionHistory = this.state.expressionHistory;
            let expressionIndex = Math.min(expressionHistory.length-1, this.state.expressionIndex + 1);
            if (expressionIndex === this.state.expressionIndex) return;
            this.setState({ expressionIndex })
        }
        let canredo = this.state.expressionIndex < this.state.expressionHistory.length - 1;
        let canundo = this.state.expressionIndex > 0;

        return(<div className={'w-100 h-100 p-2 console'}>
            <h1>
                On {((data as GObject)?.name || "model-less node (" + this.props.node?.className + ")") + " - " + this.props.node?.className}
            </h1>
            <div className='console-terminal p-0 mb-2 w-100'>
                <div className='commands'>
                    <i onClick={(e) => { this.setState({expression:''})} } title={'Empty console'} className="bi bi-slash-circle" />
                    <i onClick={(e) => {
                        if (!this.state.expression.trim()) { return Tooltip.show('Nothing to copy', undefined, undefined, 2); }
                        let s = this.outputhtml?.innerText || '';
                        s = s.substring('Result'.length).trim();
                        U.clipboardCopy(s, ()=> Tooltip.show('Content copied to clipboard', undefined, undefined, 2));
                    }} title={'Copy in the clipboard'} className="bi bi-clipboard-plus" />
                    {/* @ts-ignore */}
                    <i onClick={redo} title={'redo'} className={"redo bi bi-arrow-right-square" + (canredo ? '':" disabled")} />
                    {/* @ts-ignore */}
                    <i onClick={undo} title={'undo'} className={"undo bi bi-arrow-left-square" + (canundo ? '':" disabled")} />
                </div>
                <textarea id={'console'} spellCheck={false} className={'p-0 input w-100'} onChange={this.change} value={this.state.expression} ></textarea>
            </div>
            {false && <div>Debug history (index = {this.state.expressionIndex})
                {this.state.expressionHistory.map((s, i) => (<>
                        <div style={{
                            border: '1px solid ' + (i === this.state.expressionIndex ? 'red' : 'gray'),
                            marginTop: '5px',
                            height: '30px'
                        }}>{s}</div>
                    </>
                ))}</div>}
            {/*<label>Query {(this.state.expression)}</label>*/}
            <hr className={'mt-1 mb-1'} />
            { this.state.expression &&  ashtml && <div className={"console-output-container console-msg"}
                        ref={(e)=>this.outputhtml = e} dangerouslySetInnerHTML={ashtml ? { __html: outstr as string} : undefined} /> }

            { this.state.expression && !ashtml && <div className={"console-output-container console-msg"}
                        ref={(e)=>this.outputhtml = e} style={{whiteSpace:"pre"}}>{ outstr }</div>}

            {shortcutsjsx && <><h4>Shortcuts</h4><section className='group shortcuts-container'>{shortcutsjsx}</section></>}
            <label className={"context-keys mt-2"}>Context keys</label>
            {
                <section className={'group context-keys-list'} style={{whiteSpace:"pre"}}>{contextkeys} </section>
            }
        </div>)
    }

    private setNativeConsoleVariables(): void { // just fordebugging
        let context = this._context;
        windoww.context = context;
        windoww.data = context.data;
        windoww.node = context.node;
        windoww.edge = context.edge;
        windoww.output = this.state.output;
        if (context.data?.model) windoww.model = context.data?.model;
    }
}

interface OwnProps {}
interface StateProps {
    data: LModelElement|null
    node: LGraphElement|null
    view: LViewElement|null
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const nodeid = state._lastSelected?.node;
    const node: LGraphElement|null = (nodeid) ? LGraphElement.fromPointer(nodeid) : null;
    ret.node = node;
    ret.data = (node?.model) ? node.model : null;
    ret.view = (node?.view) ? node.view : null;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const ConsoleConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ConsoleComponent);

export const Console = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <ConsoleConnected {...{...props, children}} />;
}
export default Console;

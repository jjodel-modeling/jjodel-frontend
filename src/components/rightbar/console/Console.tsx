import "./console.scss";
import React, {Dispatch, PureComponent, ReactElement} from "react";
import {connect} from "react-redux";
import {
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
} from "../../../joiner";
import ReactDOM from "react-dom";
import {FakeStateProps} from "../../../joiner/types";

var Convert = require('ansi-to-html');

let ansiConvert = (window as any).ansiConvert;
if (!ansiConvert) (window as any).ansiconvert = ansiConvert = new Convert();

class ThisState{
    expression!: string;
    output: any;
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto

let hiddenkeys = ["jsxString", "pointedBy", "clonedCounter", "parent", "_subMaps", "inspect", "__random"];
function fixproxy(output: any/*but not array*/, hideDKeys: boolean = true, addLKeys: boolean = true):
    { output: any, shortcuts?: GObject<'L singleton'>, comments?: Dictionary<string, string | {type:string, txt:string}>, hiddenkeys?: GObject} {

    let proxy: LPointerTargetable | undefined;
    if (output?.__isProxy) {
        proxy = output;
        output = output.__raw; //Object.fromEntries(Object.getOwnPropertyNames(p).map(k => [k, p[k]]));
    } else proxy = undefined;

    let ret: ReturnType<typeof fixproxy> = {output};
    switch(typeof output) {
        case "function": return {output: U.buildFunctionDocumentation(output)};
        default: return {output};
        case "object":
            ret.output = output = {...output};
            if ((addLKeys && proxy)) {
                console.log("console output", {output, proxy});
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
    return ret;
}

export class ConsoleComponent extends PureComponent<AllProps, ThisState>{
    public static cname: string = "ConsoleComponent";
    lastNode?: Pointer<DGraphElement>;
    constructor(props: AllProps) {
        super(props);
        this.state = {expression:'', output: null};
        this.change = this.change.bind(this);
        this.change(undefined);
    }
    private _context: GObject = {};
    change(evt?: React.ChangeEvent<HTMLTextAreaElement>) {
        if (!this) return; // component being destroyed and remade after code hot update
        let expression: string | undefined = evt?.target.value.trim() || this.state.expression || '';
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
        try { output = U.evalInContextAndScope(expression || 'undefined', this._context, this._context); }
        catch (e: any) {
            console.error("console error", e);
            output = '<span style="color:red">Invalid Syntax!<br></span>' + e.toString(); }
        this.setState({expression, output});
    }

    render(){
        const data = this.props.data;/*
        const [expression, setExpression] = useStateIfMounted('data');
        const [output, setOutput] = useStateIfMounted('');*/
        if (!this.props.node) return(<></>);
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
            try {
                if (Array.isArray(output)){
                    comments = {"separator": '<span>Similar to <a href={"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join"}>Array.join(separator)</a>' +
                            ', but supports array of JSX nodes and JSX as separator argument.</span>'};
                    shortcuts = {"separator": ""};
                }
                if (Array.isArray(output) && output[0]?.__isProxy) {
                    output = output.map(o => fixproxy(o).output);
                    console.log("console result (array):", {output});
                }
                else {
                    let ret = fixproxy(output);
                    output = ret.output;
                    comments = ret.comments;
                    shortcuts = ret.shortcuts;
                    hidden = ret.hiddenkeys;
                    console.log("console result:", {output, ret});
                }
                // todo: as i fix the displaying of a LViewElement without replacing it with __raw,
                //  i will fix window, component and props displaying too i think they crash for props.data, props.view...
                if (output?._reactInternals) {
                    output = {"React.Component": {props:"...navigate to expand...", state:"", _isMounted:output._isMounted}}
                }
                outstr = '<h4>Result:</h4><div class="output-row" tabindex="984">' + U.objectInspect(output)+"<span>";
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
                            txt = "<span id='console_output_comment_" + commentKey + "' />";
                            // fallback read text, that should go deep iteration, but 1 level deep should be enough.
                            // let arr: any[] = (Array.isArray(txt?.props?.children) ? txt.props.children : (txt.props.children ? [txt.props.children] : []));
                            // txt = arr.map(e => typeof e === "string" ? e : e?.props?.children + '' || '').join("");
                        }
                        if (commentVal?.type) commentVal = "\t\t<span style='color: #999'>" + (commentVal?.type?.cname || commentVal.type)+"</span>"; // + " ~ " + txt;
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
                    if (shortcuts) outstr += "</div><br><br><h4>Shortcuts</h4><div class=\"output-row\" tabindex=\"984\">" + U.objectInspect(shortcuts);
                    // if (hidden) outstr +="</div><br><br><h4>Other less useful properties</h4><div class=\"output-row\" tabindex=\"984\">" + format(hidden);
                    // warning: unicode char but should not make a problem.
                    // outstr = U.replaceAll( outstr, '𐀹,\n', '],</span>\n</div><div class="output-row" tabindex="984"><span style="color:#000">');
                    outstr = U.replaceAll( outstr, '<span style="color:#000">,\n',
                        '</span><span style="color:#000">,</span>\n</div><div class="output-row" tabindex="984"><span style="color:#000">');
                    outstr = U.replaceAll( outstr, '],\n', '],</span>\n</div><div class="output-row" tabindex="984"><span style="color:#000">');
                    outstr = U.replaceAll( outstr, '},\n', '},</span>\n</div><div class="output-row" tabindex="984"><span style="color:#000">');
                }
                ashtml = true; }
            catch(e: any) {
                console.error(e);
                throw e;
                outstr = "[circular object]: " + e.toString();
                ashtml = false;
            }
            console.log("console result (string)", {outstr, jsxComments});
            let contextkeys;
            let objraw = this.state.output?.__raw || (typeof this.state.output === "object" ? this.state.output : "[primitiveValue]") || {};
            if (this.state.expression.trim() === "") contextkeys = ["data", "node", "view", "component"].join(", ");
            else if (this.state.expression.trim() === "this") contextkeys = ["Warning: \"this\" will refer to the Console component instead of a GraphElement component."].join(", ");
            else if (typeof objraw === "string") { contextkeys = "- length\n- all string functions"}
            else contextkeys = Array.isArray(objraw) ? ["array[index]", ...Object.keys(Array.prototype)].join(",\n") : Object.getOwnPropertyNames(objraw).join(",\n");// || []).join(", ")

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

            return(<div className={'p-2 w-100 h-100'}>
                <textarea spellCheck={false} className={'p-0 input mb-2 w-100'} onChange={this.change} />
                {/*<label>Query {(this.state.expression)}</label>*/}
                <label>On {((data as GObject)?.name || "model-less node (" + this.props.node.className + ")") + " - " + this.props.node?.className}</label>
                <hr className={'mt-1 mb-1'} />
                { this.state.expression &&  ashtml && <div className={"console-output-container"} dangerouslySetInnerHTML={ashtml ? { __html: outstr as string} : undefined} /> }
                { this.state.expression && !ashtml && <div style={{whiteSpace:"pre"}}>{ outstr }</div>}
                <label className={"mt-2"}>Context keys:</label>
                {
                    <div style={{whiteSpace:"pre"}}> {contextkeys} </div>
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
interface StateProps { data: LModelElement|null, node: LGraphElement|null, view: LViewElement|null }
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
    const ret: DispatchProps = {};
    return ret;
}


export const ConsoleConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(ConsoleComponent);

export const Console = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ConsoleConnected {...{...props, children}} />;
}

ConsoleComponent.cname = "ConsoleComponent";
ConsoleConnected.cname = "ConsoleConnected";
Console.cname = "Console";
export default Console;

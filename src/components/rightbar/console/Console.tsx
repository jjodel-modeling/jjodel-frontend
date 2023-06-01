import React, {Dispatch, PureComponent, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {
    DGraphElement,
    Dictionary,
    GObject, Json,
    LGraphElement,
    LModelElement,
    LPointerTargetable,
    LViewElement,
    RuntimeAccessibleClass,
    U,
    Pointer,
    windoww
} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import * as util from "util";
import { makeEvalContext } from "../../../graph/graphElement/graphElement";

var Convert = require('ansi-to-html');
var ansiConvert = new Convert();
(window as any).ansiconvert = ansiConvert;

class ThisState{
    expression!: string;
    output: any;
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto

let hiddenkeys = ["pointedBy", "clonedCounter", "parent", "_subMaps", "inspect", "__random"];
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
                let Lsingleton: GObject<'L singleton'> = (RuntimeAccessibleClass.get(output.className)!.logic!.singleton);
                let comments: Dictionary<string, string | {type:string, txt:string}> = {};
                ret.shortcuts = {...Lsingleton};
                ret.comments = comments;
                for (let key in output) {
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                }
                for (let key in Lsingleton) {
                    // todo: might define some func private in L like "private info_of_fieldname" where fuction body is comment documentation extracted,
                    //  or actually directly private info_of_id = <a href="..."><span>Unique identifier, and value used to point this object.</span></a>
                    if ((key in output) || (key.indexOf("__info_of__") === 0)) {
                        delete ret.shortcuts[key];
                        continue;
                    } else { if (ret.shortcuts[key] === undefined) ret.shortcuts[key] = ''; }
                    if (Lsingleton["__info_of__" + key]) comments[key] = Lsingleton["__info_of__" + key];
                    if (comments[key]) continue; // if explicitly commented, i will not attempt to generate documentation.
                    let entryvalue = Lsingleton[key];
                    switch (typeof entryvalue) {
                        case "object":
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
    return ret; }

export class ConsoleComponent extends PureComponent<AllProps, ThisState>{
    lastNode?: Pointer<DGraphElement>;
    constructor(props: AllProps) {
        super(props);
        this.state = {expression:'', output: null};
        this.change(undefined);
    }
    change = (evt?: React.ChangeEvent<HTMLTextAreaElement>) => {
        let expression: string | undefined = evt?.target.value.trim() || this.state.expression || '';
        let output;
        // let context = {...this.props, props: this.props}; // makeEvalContext(this.props as any, {} as any);
        let context;
        if (this.props.node?.id) {
            let component = GraphElementComponent.map[this.props.node.id];
            context = {...component.props.evalContext};
            context.fromcomponent=true;
        }
        else {
            context = {...this.props, props: this.props};
        }
        try { output = U.evalInContextAndScope(expression || 'undefined', context, context); }
        catch (e: any) {
            console.error("console error", e);
            output = '<span style="color:red">Invalid Syntax!<br></span>' + e.toString(); }
        this.setState({expression, output});
    }

    render(){
        const data = this.props.data;/*
        const [expression, setExpression] = useStateIfMounted('data');
        const [output, setOutput] = useStateIfMounted('');*/
        if (!this.props.node) return <div>Select a node to start</div>
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
            try {
                let hiddenkeys: GObject | undefined = {};
                if (Array.isArray(output) && output[0]?.__isProxy) {
                    output = output.map(o => fixproxy(o).output);
                    comments = {"separator": '<span>Similar to <a href={"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join"}>Array.join(separator)</a>' +
                            ', but supports array of JSX nodes and JSX as separator argument.</span>'};
                    shortcuts = {"separator": ""};
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
                let format = (val: GObject) => U.replaceAll(ansiConvert.toHtml(util.inspect(val, true, 2, true)), "style=\"color:#FFF\"", "style=\"color:#000\"");
                outstr = "<h4>Result:</h4>" + format(output);
                if (shortcuts || comments){
                    // if(!shortcuts) shortcuts = {};
                    if(!comments) comments = {};
                    if (shortcuts) outstr += "<br><br><h4>Shortcuts</h4>" + format(shortcuts);
                    if (hidden) outstr +="<br><br><h4>Other less useful properties</h4>" + format(hidden);
                    for (let commentKey in comments){
                        let commentVal: any = comments[commentKey];
                        if (commentVal?.type) commentVal = ":" + commentVal?.type + " ~ " + commentVal?.txt;
                        let commentKeyEscaped = U.multiReplaceAll(commentKey, ["$", "-"], ["\\$", "\\-"]); // _ should be safe, .-,?^ not happening?
                        let regexp = new RegExp("^({?\\s*" +commentKey+":.*)$", "gm");
                        outstr = outstr.replace(regexp, "$1 // " + commentVal);
                    }
                }
                ashtml = true; }
            catch(e: any) {
                console.error(e);
                throw e;
                outstr = "[circular object]: " + e.toString();
                ashtml = false;
            }
            console.log("console result (string)", {outstr});
            let contextkeys;
            let objraw = this.state.output?.__raw || (typeof this.state.output === "object" ? this.state.output : "[primitiveValue]") || {};
            if (this.state.expression.trim() === "") contextkeys = ["data", "node", "view", "getSize()", "setSize({x:?, y:?, w:?, h:?})", "component"].join(", ");
            else if (this.state.expression.trim() === "this") contextkeys = ["Warning: \"this\" will refer to the Console component instead of a GraphElement component."].join(", ");
            else contextkeys = Array.isArray(objraw) ? ["array[number]", ...Object.keys(Array.prototype)].join("</br>") : Object.getOwnPropertyNames(objraw).join(", ");// || []).join(", ")
            return(<div className={'p-2 w-100 h-100'}>
                <textarea spellCheck={false} className={'p-0 input mb-2 w-100'} onChange={this.change} />
                {/*<label>Query {(this.state.expression)}</label>*/}
                <label>On {(data as GObject).name}</label>
                <hr className={'mt-1 mb-1'} />
                { ashtml && <div style={{whiteSpace:"pre"}} dangerouslySetInnerHTML={ashtml ? { __html: outstr as string} : undefined} /> }
                { !ashtml && <div style={{whiteSpace:"pre"}}>{ outstr }</div>}
                <label className={"mt-2"}>Context keys:</label>
                {
                    contextkeys
                }
            </div>)
    }
}
interface OwnProps {}
interface StateProps { data: LModelElement|undefined, node: LGraphElement|undefined, view: LViewElement|undefined }
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    let ptr;
    ptr = state._lastSelected?.modelElement;
    ret.data = (ptr) ? LModelElement.fromPointer(ptr) : undefined;
    ptr = state._lastSelected?.node;
    ret.node = (ptr) ? LModelElement.fromPointer(ptr) : undefined;
    ptr = state._lastSelected?.view;
    ret.view = (ptr) ? LModelElement.fromPointer(ptr) : undefined;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const ConsoleConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(ConsoleComponent);

export const Console = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <ConsoleConnected {...{...props, children}} />;
}
export default Console;

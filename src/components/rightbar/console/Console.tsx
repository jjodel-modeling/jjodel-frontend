import React, {Dispatch, PureComponent, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {GObject, LGraphElement, LModelElement, LViewElement, U} from "../../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import * as util from "util";
import { makeEvalContext } from "../../../graph/graphElement/graphElement";

var Convert = require('ansi-to-html');
var convert = new Convert();
(window as any).ansiconvert = convert;

class ThisState{
    expression!: string;
    output: any;
}

// trasformato in class component così puoi usare il this nella console. e non usa accidentalmente window come contesto
export class ConsoleComponent extends PureComponent<AllProps, ThisState>{
    constructor(props: AllProps) {
        super(props);
        this.state = {expression:'', output: null};
        this.change(undefined);
    }
    change = (evt?: React.ChangeEvent<HTMLTextAreaElement>) => {
        let expression: string | undefined = evt?.target.value.trim() || '';
        let output;
        let context = {...this.props, props: this.props}; // makeEvalContext(this.props as any, {} as any);
        try { output = U.evalInContextAndScope(expression || 'undefined', context, context); }
        catch (e: any) { output = '<span style="color:red">Invalid Syntax!<br></span>' + e.toString(); }
        this.setState({expression, output});
    }

    render(){
        const data = this.props.data;/*
        const [expression, setExpression] = useStateIfMounted('data');
        const [output, setOutput] = useStateIfMounted('');*/


        if (data) {
            let outstr;
            // try { outstr = U.circularStringify(this.state.output, (key, value)=> { return value.__isProxy ? value.name : value; }, "\t", 1) }
            (window as any).inspect = util.inspect;
            (window as any).tmpp = this.state.output;
            let ashtml: boolean
            try {
                let fixproxy = (p: any): any => {
                    if (p?.__isProxy) return p.__raw || Object.fromEntries(Object.getOwnPropertyNames(p).map(k => [k, p[k]]));
                    return p;
                }
                let output = fixproxy(this.state.output);
                if (Array.isArray(output) && output[0]?.__isProxy) output = output.map(o => fixproxy(o));
                outstr = U.replaceAll(convert.toHtml(util.inspect(output, true, 2, true)), "style=\"color:#FFF\"", "style=\"color:#000\"");
                ashtml = true; }
            catch(e: any) {
                outstr = "[circular object]: " + e.toString();
                ashtml = false;
            }
            let contextkeys;
            let objraw = this.state.output?.__raw || (typeof this.state.output === "object" ? this.state.output : "[primitiveValue]") || {};
            if (this.state.expression.trim() === "") contextkeys = ["data", "node", "view"].join(", ");
            else if (this.state.expression.trim() === "this") contextkeys = ["Warning: \"this\" will refer to the Console component instead of a GraphElement component."].join(", ");
            else contextkeys = Array.isArray(objraw) ? ["array[number]", ...Object.getOwnPropertyNames(objraw).filter( (v: any) => v === +v)].join(", ") : Object.getOwnPropertyNames(objraw).join(", ");// || []).join(", ")
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
        } else { return(<div></div>) }
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

export const Console = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <ConsoleConnected {...{...props, childrens}} />;
}
export default Console;

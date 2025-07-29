import React, {Dispatch, JSX, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from "react-redux";
import type {Dictionary, DocString, GObject, DState, LViewElement, Pointer, Info} from "../../joiner";
import {Log, LPointerTargetable, U} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {stringify} from "querystring";
import "./FunctionComponent.scss";
import { CommandBar, Btn, Sep } from '../commandbar/CommandBar';
import { Tooltip } from './Tooltip';

/*
 Rationale behind this:
 To do this properly, one would need a complete js parser to make sure comments, ifs, loops, newlines,
   expressions inside array indexing for objects... are all correctly parsed.


 Instead, to make it faster, i'm forcing the valid "function string" value to hold a much more definite structure
   for which i can do an extremely simpler inline parser.
 The getter and setter properties and the interface, are making sure the user cannot write a "function string"
   not respecting my format, and that it is as much turing-complete as javascript is.

 legenda:
  - ALL_CAPS identifiers, are not literals and the user can change their names.
  - Newlines are included in the format, spaces are not.
  - ... are explaining the format and are not part of it.
  - // **   ** // Styled comments ARE part of the format.
  - Excess spaces in the format are not preserved (might be added/removed by getter/setter), but not mandatory and not relevant.

 my structure is:
 (OBJECT_NAME)=> {\n
   STATEMENT_A1
   STATEMENT_A2
   ...
   STATEMENT_AN
   \n// ** declarations here ** //\n
   OBJECT_NAME.IDENTIFIER_1 = STATEMENT_1;\n
   OBJECT_NAME.IDENTIFIER_2 = STATEMENT_2;\n
   ...
   OBJECT_NAME.IDENTIFIER_N = STATEMENT_N;\n
 }
 */

type StrPos = {value: string, line?: number, startindex?: number, endindex?: number};
type RowData = {index: number; key: number, id: StrPos & { prefix: string }; exp: StrPos, isDirty?: boolean};
type TextAreaState = {v:string, isDirty?: boolean};
type FunctionComponentState = {advancedMode: boolean, collapsed: boolean, ta: TextAreaState, arr: RowData[]};
type SetState = (value: FunctionComponentState)=>void;
const minimalTextareaValue = '(ret)=>{\n';

function parseFunction(props: AllProps): FunctionComponentState {
    Log.exDev(!props.data, "FunctionComponent: missing data props", {props});
    let getter = props.getter || ((a: GObject) => a[props.field]); // ((lobj: GObject<LPointerTargetable>, key: string) => U.wrapUserFunction(lobj[key]));
    let val: string = getter(props.data);
    if (!val || val.length <= 2) val = "(ret)=>{\n    // ** declarations here ** //\n\n}"; // fallback for empty string and {}
    else val = val.trim();
    let txtparts = val.split("// ** declarations here ** //");
    if (txtparts.length !== 2) {
        Log.eDevv("cannot find declaration section", {val, props});
        txtparts = [val.substring(0, val.length-1), val.substring(val.length-1)];
    }
    let declarations: string[] = (txtparts[1] || '').split("\n");
    let stateArrayValues: RowData[] = [];
    let textAreaState: TextAreaState = {v: txtparts[0]};
    let i: number = -1;
    for (let dec of declarations) {
        let splitindex = dec.indexOf("=");
        if (splitindex === -1) continue; // for ending \n} line
        i++; // don't loop by i, the index ending in state must increase only for non-empty rows filtering them out.
        let expression = dec.substring(splitindex+1);
        let identifier = dec.substring(0, splitindex);
        let idsplitindex = identifier.indexOf(".");
        let identifierPrefix = identifier.substring(0, idsplitindex);
        let identifierName = identifier.substring(idsplitindex+1);
        stateArrayValues.push({
            index: i,
            key: i,
            id: {prefix: identifierPrefix, value: identifierName.trim(), line: i, startindex: idsplitindex, endindex: splitindex},
            exp:{                          value: expression.trim(),     line: i, startindex: splitindex,   endindex: -1}
        });
    }
    return {advancedMode: !!props.advancedMode, collapsed: props.collapsed === !!props.collapsed, ta: textAreaState, arr:stateArrayValues};
}

// event listing start
// it's not on purpose, but this function is a candidate for obscure code context XD
function addClick(v: FunctionComponentState, set: SetState): void {
    let lasti: number = (v.arr[v.arr.length-1]?.index ?? -1) +1;
    let lastk: number = (v.arr[v.arr.length-1]?.key ?? -1) +1;
    set({...v, arr: [...v.arr, {index: lasti, key: lastk,
            id: {prefix: v.arr[0]?.id.prefix || "ret", value: ""},
            exp: {value: ""} }]
    });
}

// function fixIndex(i: number, rows: RowData[]): number{ for (let row of rows) if (row.index === ) }
function deleteClick(v0: FunctionComponentState, set: SetState, i: number, props: AllProps, row:RowData): void {
    // do i really need to shallow copy nested objects too? it should not be necessary
    let v = {...v0} //, arr:[...v0.arr]};
    /// problem: deleting an element in the middle invalidetes the row.index values
    /// solution 1: update the row.index values, move the rect key to a different field that is initial = index, but never changes.
    /// implemented
    v.arr.splice(i, 1);
    for (; i < v.arr.length; i++) v.arr[i].index = i;
    /// solution 2: keep original indexes, use a fixIndex function to map the index in html (without holes) to index in row structure (with holes).
    ///  discareded

    set(v);
    onBlur(v, set, props, undefined, true);
}

function expressionChange(e: React.FormEvent<HTMLInputElement>, i: number, v: FunctionComponentState, set: SetState): void {
    v = {...v, arr:[...v.arr]};
    v.arr[i] = {
        ...v.arr[i],
        isDirty: true,
        exp: {...v.arr[i].exp, value: e.currentTarget.value}
    };
    set(v);
}

function identifierChange(e: React.FormEvent<HTMLInputElement>, i: number, v: FunctionComponentState, set: SetState): void {
    let nv = e.currentTarget.value;
    v = {...v, arr:[...v.arr]};
    v.arr[i] = {
        ...v.arr[i],
        isDirty: true,
        // empty string is fine, as long value is empty too the entire row is ignored. but identifiers cannot start with a number are not allowed.
        id: {...v.arr[i].id, value: isNaN(+nv[0]) ? nv : "A" + nv}
    };
    set(v);
}

function textAreaChange(e: React.FormEvent<HTMLTextAreaElement>, v: FunctionComponentState, set: SetState): void {
    set({...v, ta: {v:e.currentTarget.value, isDirty: true} });
}
/*
function ChangeAndBlur(e: React.FormEvent<HTMLTextAreaElement>, v: FunctionComponentState, set: SetState, props: AllProps): void {
    let newState = {...v, ta: {v:e.currentTarget.value, isDirty: true} };
    set(newState);
    onBlur(newState, set, props);
}*/

function onBlur(v: FunctionComponentState, set: SetState, props: AllProps, i?: number, isDelete?: boolean) {
    if (isDelete) {
        // force update without checking dirty (the row is not present anymore)
    }
    // problem: this might be called before the onChange setState() actually edits the state, so it finds isDirty false or even a non-yet existing index
        // for now i will just hope the user is not typing and blurring extra fast, i don't think a simple solution exists
    else if (i !== undefined) {
        if (!v.arr[i]?.isDirty) return;
        v = {...v, arr:[...v.arr]};
        v.arr[i] = {
            ...v.arr[i],
            isDirty: false,
        };
        set(v);
    }
    else {
        if (!v.ta.isDirty) return;
        set({...v, ta: {v: v.ta.v, isDirty: false} });
    }
    updateFunctionValue(props, v.ta.v, v.arr);
}

function updateFunctionValue(props: AllProps, textAreaContent: string, stateArrayValues: RowData[]){
    let declarations: string[] = stateArrayValues.map( o => o.id.value && o.exp.value ? o.id.prefix + "." + o.id.value + " = " + o.exp.value : '');
    let setter = props.setter || ((v: string) => (props.data as GObject)[props.field] = v);
    setter(textAreaContent + "\n// ** declarations here ** //\n" + declarations.filter(d=>!!d).join("\n") + "\n}")
}
// event listing end

function FunctionComponent(props: AllProps) {
    // if (false) return asTextArea(props) // i gave up
    const [state, setState] = useStateIfMounted(parseFunction(props));
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    // if (!props.data) return <></>;
    let advancedMode: boolean = state.advancedMode,
        readOnly = props.readOnly; // (props.readonly !== undefined) ? props.readonly : !props.debugMode && props.data.id.indexOf("Pointer_View") !== -1;

    // NB: could be heavily optimized by cutting the original string with indexes and substring,
    // but it is a function called too rarely and not impactful on overall performances

    let tooltip: string|undefined | ReactNode = (props.tooltip === true) ? (props.data as GObject)['__info_of__' + props.field]?.txt : props.tooltip;


    // JSX building start
    let inputs: JSX.Element[] = [];
    // console.log("funccomp", {stateArrayValues, textAreaState, props});


    for (let row of state.arr) {
        inputs.push(<label className={"d-flex template-item" + (advancedMode ? "" : " my-1")} key={row.index} data-key={row.index}>
            <span className={"my-auto detailedMode"}>{row.id.prefix}.</span>
            <input className={"my-auto input"}
                placeholder={"identifier"} value={row.id.value} disabled={readOnly}
                tabIndex={row.index*2}
                onInput={(e)=>identifierChange(e, row.index, state, setState)}
                onBlur={(e)=> !readOnly && onBlur(state, setState, props, row.index)}
                style={{width: '30%'}}
            />
            <span className={"my-auto mx-1 simpleMode"} style={{paddingRight: '6px', paddingLeft: '6px'}}><i style={{fontSize: '1.2em'}} className="bi bi-arrow-left-square"></i></span>
            <span className={"my-auto mx-1 detailedMode"}>=</span> {/*  */}
            <input className={"my-auto input"}
                placeholder={"expression"}
                value={row.exp.value}
                disabled={readOnly}
                tabIndex={row.index*2+1}
                onInput={(e)=>expressionChange(e, row.index, state, setState)}
                onBlur={(e)=> !readOnly && onBlur(state, setState, props, row.index)}
                style={{marginRight: '6px'}}
            />
            <span className={"my-auto detailedMode"}>;</span>
            <CommandBar style={{paddingTop: '10px'}}>
                <Btn icon={'delete'} tip={'Delete'} action={()=>!readOnly && deleteClick(state, setState, row.index, props, row)} />
            </CommandBar>
            {/* <button className={"bg btn-delete my-auto ms-2"} tabIndex={state.arr.length*2 +1 +row.index} disabled={readOnly} onClick={()=>!readOnly && deleteClick(state, setState, row.index, props, row)}>
                <i className={"p-1 bi bi-dash"} /></button> */}
        </label>);
    }


    return <div className={"function-editor-root"} data-mode={advancedMode ? "detailedMode" : "simpleMode"} style={{fontSize: "0.9rem"}}>
        <div className={"d-flex w-100 function-editor-header"}>
        {/* <div className={"d-flex w-100 function-editor-header"} style={{transition: "all 300ms",  cursor: tooltip ? 'help' : 'auto'}}
             onMouseEnter={e => tooltip && setShowTooltip(true)} onMouseLeave={e =>  tooltip && setShowTooltip(false)}></div>*/}
            <div className={"function-editor-label"}>
                {props.jsxLabel}
                <p style={{fontSize: '0.8em', paddingBottom: '0px'}}>{props.payoff}</p>
                {/* <button className={"btn button-add"} tabIndex={state.arr.length*2}
                        disabled={readOnly} onClick={()=> !readOnly && addClick(state, setState)}>+</button> */}
            </div>

            <CommandBar style={{marginLeft: 'auto'}}>
                {!state.collapsed ?
                    <>
                        <Btn icon={'add'} action={()=> !readOnly && addClick(state, setState)} tip={'Add new constant'}/>
                        <Sep />
                        {showTooltip ?
                            <Btn icon={'info'} action={()=> {setShowTooltip(false)}} tip={'Hide information'} mode={'negative'}/>
                            :
                            <Btn icon={'info'} action={()=> {setShowTooltip(true)}} tip={'Show information'} />
                        }

                        {advancedMode?
                            <Btn icon={'settings'} action={()=>setState( {...state, advancedMode:!state.advancedMode})} tip={'Close advanced mode'} mode={'negative'}/>
                            :
                            <Btn icon={'settings'} action={()=>setState( {...state, advancedMode:!state.advancedMode})} tip={'Open advanced mode'}/>
                        }

                        <Sep />
                        <Btn icon={'open-down'} action={()=>setState( {...state, collapsed:!state.collapsed})} tip={'Hide definitions'}/>
                    </>
                    :
                    <Btn icon={'close-up'} action={()=>setState( {...state, collapsed:!state.collapsed})} tip={'Show definitions'}/>
                }

            </CommandBar>


            {/*
            <span className={"m-auto me-1"} style={{border: '1px solid red', cursor: 'auto'}}>

            {tooltip && <i className={"p1 m-auto me-1 bi bi-info-square"} style={{cursor: 'help'}} />}

                <span className={"m-auto"} style={{cursor: 'auto', height: "100%", display: "inline-block"}}
                      onMouseEnter={e => tooltip && setShowTooltip(false)} onMouseLeave={e =>  tooltip && setShowTooltip(true)}
                >

                <i className={ "p1 m-auto mx-1 bi " + (advancedMode ? "btn-outline-secondary bi-eye-slash" : "btn-outline-secondary bi-eye")}
                   onClick={()=>setState( {...state, advancedMode:!state.advancedMode})} style={{cursor: 'pointer'}} />

                   <i className={ "p1 bi m-auto mx-1 bi bi-chevron-down btn-outline-secondary"}
                   onClick={()=>setState( {...state, collapsed:!state.collapsed})}
                   style={{cursor: 'pointer', transition:transitionTime/2 + "ms all",
                       transform: "scaleY("+(state.collapsed ? 1 : -1 )+")  translateY(" + (state.collapsed ? -0 : 0.1) +"em)",
                   }} />

                </span>
            </span>
            */}



        </div>
        {(tooltip && showTooltip) && <div className={'my-tooltip'} style={{marginBottom: '10px'}}>
            {/*
            <b className={'text-center text-capitalize'}>{props.field}</b>
            <br />
            */}
            <label>{tooltip}</label>
        </div>}
        {<div
            className={"collapsable-section " + (state.collapsed ? "collapsed" : "expanded")}
            data-comment={"collapsable-section"}
            style={{/*
                transition: transitionTime + "ms all", // transformOrigin: "top", transform: "rotateX("+(state.collapsed ? 0 : 90 )+"deg)",
                transform: "scaleY("+(state.collapsed ? 0 : 1 )+") ",
                transformOrigin: "top",
                overflow:"hidden"*/
            }}>

            <textarea className={"detailedMode input w-100"} disabled={readOnly} rows={Math.min(10, state.ta.v.split("\n").length)}
                  onInput={(e)=>textAreaChange(e, state, setState)}
                  onBlur={(e)=> !readOnly && onBlur(state, setState, props)}
                  data-txtcontent={state.ta.v}
                  value={state.ta.v} />
            {inputs}
            {false && <div style={{whiteSpace:"pre"}}>{(props.data as any)[props.field]}</div>}
        </div>}
    </div>;
}

interface OwnProps {
    advancedMode?: boolean; // toggle textbox pre-declarations, initial value to set state. after initialization only state.advancedMode is used
    collapsed?: boolean; // start collapsed or visible, default value is false = visible
    data: LPointerTargetable;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    readOnly?: boolean;
    // not used for now
    label?: string;
    jsxLabel?: ReactNode;
    payoff?: string;
    className?: string;
    style?: GObject;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    key?: React.Key | null;
}

interface StateProps {
}

interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;

/*
function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
  return ownProps;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const FunctionConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(FunctionComponent);
*/
// export const Function = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => (<FunctionConnected {...{...props, children}} />);
export const Function = (props: OwnProps, children:ReactNode = []): ReactElement => {
    // @ts-ignore children
    return (<FunctionComponent {...{...props, children}} tooltip={true} />);
}

Function.cname = "FunctionComponent";
// FunctionConnected.cname = "FunctionComponent_Connected";
FunctionComponent.cname = "FunctionComponent_Disconnected";


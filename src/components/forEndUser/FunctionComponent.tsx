import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from "react-redux";
import {Dictionary, DocString, DPointerTargetable, GObject, Log, LPointerTargetable, TextArea, DState, LViewElement, Pointer, U} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";
import {stringify} from "querystring";
import "./FunctionComponent.scss";


type StrPos = {value: string, line?: number, startindex?: number, endindex?: number};
type RowData = {index: number; id: StrPos & { prefix: string }; exp: StrPos, isDirty?: boolean};
type TextAreaState = {v:string, isDirty?: boolean};
type FunctionComponentState = {advancedMode: boolean, ta: TextAreaState, arr: RowData[]};
type SetState = (value: FunctionComponentState)=>void;

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
function setStateOnce(){
    alert("SetStateOnce");
    return Math.random();
}/*
function FunctionComponent(props: AllProps) {
    const [state, setState] = useStateIfMounted(setStateOnce);
    if (state === undefined) {
        setState(-1);
        return <>Initializing...</>;
    } else {
        return <b style={{color:"green"}} onClick={e=>setState(Math.floor(state)+1)}>SUCCESS! {state}</b>;
    }
}*/

function parseFunction(props: AllProps): FunctionComponentState {
    Log.exDev(props.data, "FunctionComponent: missing data props", {props});
    let getter = props.getter || ((a: GObject) => a[props.field]); // ((lobj: GObject<LPointerTargetable>, key: string) => U.wrapUserFunction(lobj[key]));
    let val: string = getter(props.data);
    if (!val) val = "(ret)=>{\n    // ** declarations here ** //\n\n}";
    let txtparts = val.split("// ** declarations here ** //");
    Log.exDev(txtparts.length !== 2, "cannot find declaration section", {val, props});
    let declarations: string[] = (txtparts[1] || '').split("\n");
    let stateArrayValues: RowData[] = [];
    let textAreaState: TextAreaState = {v: txtparts[0]};
    for (let i = 0; i < declarations.length; i++) {
        let dec = declarations[i];
        let splitindex = dec.indexOf("=");
        if (splitindex === -1) continue; // for ending \n} line
        let expression = dec.substring(splitindex+1);
        let identifier = dec.substring(0, splitindex);
        let idsplitindex = identifier.indexOf(".");
        let identifierPrefix = identifier.substring(0, idsplitindex);
        let identifierName = identifier.substring(idsplitindex+1);
        stateArrayValues.push({
            index: i,
            id: {prefix: identifierPrefix, value: identifierName.trim(), line: i, startindex: idsplitindex, endindex: splitindex},
            exp:{                          value: expression.trim(),     line: i, startindex: splitindex,   endindex: -1}
        });
    }
    return {advancedMode: !!props.advancedMode, ta: textAreaState, arr:stateArrayValues};
}

function FunctionComponent(props: AllProps) {
    // if (false) return asTextArea(props) // i gave up
    const [state, setState] = useStateIfMounted(parseFunction(props));
    // if (!props.data) return <></>;
    let stateArrayValues: RowData[] = state.arr,
        textAreaState: TextAreaState = state.ta,
        advancedMode: boolean = state.advancedMode,
        readOnly = props.readonly; // (props.readonly !== undefined) ? props.readonly : !props.debugMode && props.data.id.indexOf("Pointer_View") !== -1;

    // event listing start

    function addClick(stateArrayValues: RowData[], setinputArrayValues:(a:RowData[])=>void) {
        stateArrayValues = [...stateArrayValues,
            {index: stateArrayValues.length,
                id:{prefix: stateArrayValues[0]?.id.prefix || "ret", value:""},
                exp:{value:""}}];
        setinputArrayValues(stateArrayValues);
    }

    function deleteClickk(v: FunctionComponentState, set: SetState, i: number) {
        v = {...v, arr:[...v.arr]};
        v.arr.splice(i, 1);
        set(v);
        onBlur(v, set, i);
    }

    function expressionChange(e: React.FormEvent<HTMLInputElement>, i: number, stateArrayValues: RowData[], setinputArrayValues:(a:RowData[])=>void) {
        stateArrayValues = [...stateArrayValues];
        stateArrayValues[i] = {...stateArrayValues[i], isDirty: true};
        stateArrayValues[i].exp = {...stateArrayValues[i].exp};
        stateArrayValues[i].exp.value = e.currentTarget.value;
        setinputArrayValues(stateArrayValues);
    }

    function identifierChange(e: React.FormEvent<HTMLInputElement>, i: number, stateArrayValues: RowData[], setinputArrayValues:(a:RowData[])=>void) {
        stateArrayValues = [...stateArrayValues];
        stateArrayValues[i] = {...stateArrayValues[i], isDirty: true};
        stateArrayValues[i].id = {...stateArrayValues[i].id};
        stateArrayValues[i].id.value = e.currentTarget.value;
        setinputArrayValues(stateArrayValues);
    }

    function textAreaChange(e: React.FormEvent<HTMLTextAreaElement>, setTA: React.Dispatch<React.SetStateAction<TextAreaState | undefined>>): void {
        setTA({v: e.currentTarget.value, isDirty: true});
        throw new Error('Function not implemented.');
    }

    function onBlur(stateArrayValues: RowData[], ta: TextAreaState, index?: number, setAV?:(a:RowData[])=>void, setTA?:(e:TextAreaState)=>void) {
        if (index !== undefined) {
            if (!stateArrayValues[index].isDirty) return;
            stateArrayValues = [...stateArrayValues];
            stateArrayValues[index] = {...stateArrayValues[index]};
            stateArrayValues[index].isDirty = false;
            setAV?.(stateArrayValues);
        }
        else {
            if (ta.isDirty) return;
            setTA?.({...ta, isDirty: false});
        }
        updateFunctionValue(ta.v, stateArrayValues);
    }
    // NB: could be heavily optimized by cutting the original string with indexes and substring,
    // but it is a function called too rarely and not impactful on overall performances
    function updateFunctionValue(textAreaContent: string, stateArrayValues: RowData[]){
        let declarations: string[] = stateArrayValues.map( o => o.id.value && o.exp.value ? o.id.prefix + o.id.value + " = " + o.exp.value : '');
        (props.data as GObject)[props.field] = textAreaContent + "\n// ** declarations here ** //\n" + declarations.join("\n") + "\n}";
    }


    // JSX building start
    let inputs: JSX.Element[] = [];
    console.log("funccomp", {stateArrayValues, textAreaState, props});

    function deleteClick(state: FunctionComponentState, setState: (value: ((v:FunctionComponentState)=>void), index: number) {

    }

    for (let row of stateArrayValues) {
        inputs.push(<div className={"d-flex" + (advancedMode ? "" : " my-1")}>
            <span className={"my-auto detailedMode"}>{row.id.prefix}.</span>
            <input className={"my-auto input"} placeholder={"identifier"} value={row.id.value}  disabled={readOnly}
                   onInput={(e)=>identifierChange(e, row.index, stateArrayValues, setAV)}
                   onBlur={(e)=> onBlur(stateArrayValues, textAreaState, row.index, setAV)}
            />
            <span className={"my-auto mx-1 simpleMode"}>⇠</span>
            <span className={"my-auto mx-1 detailedMode"}>=</span>
            <input className={"my-auto input"} placeholder={"expression"} value={row.exp.value} disabled={readOnly}
                   onInput={(e)=>expressionChange(e, row.index, stateArrayValues, setAV)}
                   onBlur={(e)=> onBlur(stateArrayValues, textAreaState, row.index, setAV)}
            />
            <span className={"my-auto detailedMode"}>;</span>
            <button className={"btn btn-danger my-auto ms-2"} disabled={readOnly} onClick={()=>deleteClick(state, setState, row.index)}>
                <i className={"p-1 bi bi-trash3-fill"} /></button>
        </div>);
    }

    return <div className={""} data-mode={advancedMode ? "detailedMode" : "simpleMode"}>
        <i className={ advancedMode ? "p1 bi bi-eye-slash-fill" : "p1 bi bi-eye-fill"} onClick={()=>setAdvancedMode(!advancedMode)} />
        <textarea className={"detailedMode input"}
                  onInput={(e)=>textAreaChange(e, setTA)}
                  onBlur={(e)=> onBlur(stateArrayValues, textAreaState, undefined, undefined, setTA)}
        >{textAreaState.v}</textarea>
        {inputs}
        <button className={"btn btn-secondary w-100"} onClick={()=>addClick(stateArrayValues, setAV)}>+</button>
    </div>;
}

interface OwnProps {
    advancedMode?: boolean; // toggle textbox pre-declarations, initial value to set state. after initialization only state.advancedMode is used
    data: LPointerTargetable;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    label?: string;
    jsxLabel?: ReactNode;
    className?: string;
    style?: GObject;
    readonly?: boolean;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    asLabel?: boolean;
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
export const Function = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => (<FunctionComponent {...{...props, children}} />);

Function.cname = "FunctionComponent";
// FunctionConnected.cname = "FunctionComponent";
FunctionComponent.cname = "FunctionComponent_Disconnected";


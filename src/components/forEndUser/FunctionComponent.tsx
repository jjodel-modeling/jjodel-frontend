import React, {Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from "react-redux";
import {Dictionary, DocString, DPointerTargetable, GObject, Log, LPointerTargetable, TextArea, DState, LViewElement, Pointer, U} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";


function FunctionComponent(props: AllProps) {
    let getter = props.getter || ((lobj: GObject<LPointerTargetable>, key: string) => U.wrapUserFunction(lobj[key]));
    let setter = undefined; // props.setter || ((val: string, lobj: GObject<LPointerTargetable>, key: string) => lobj[key] = val);
    return <TextArea {...props} getter={getter} setter={setter}/>; // i gave up
    /*
        const data = props.data;
        let editable = true;

        /*  Uncomment this when we have user authentication: if a user is on a ME, it cannot be edited.
                    damiano: ok, ma se data non è ModelElement crasha perchè non ha "father"
                    mettici prima un
                    if (RuntimeAccessibleClass.extends(data, DModelElement.cname))

        const fathers = U.fatherChain(data as LModelElement);
        for(let father of fathers) {
            const user = Object.keys(selected).find(key => selected[key]?.id === father);
            if(user && user !== DUser.current) editable = false;
            if(!editable) break;
        }
        * /

        const getter = props.getter;
        const setter = props.setter;
        const field = props.field;
        if (!data) {
            Log.e("invalid data in input", props);
            return <input value={"invalid data"} />;
        }
        // todo: i give up, this is too long to parse correctly.
        const getNameOfLastReturnVariables = (funcbody: string) => {
            // todo: find all return [varname], then exclude null, undefined, numbers, literals, new X(), return funccall(), return [expression+expression]...
            return ["ret"];
        }
        const extractAssigmentList = (v: string): assigmentInstructionParsed[] => {
            let returns = getNameOfLastReturnVariables(v);
            // if the user have multiple returned variables, i parse them all and consider the most important one as the one with more assigments, and map the input arrays to that.
            // other variables are still assigned in mixed TextArea section.
            let assignements: Dictionary<DocString<"returned variable">, assigmentInstructionParsed[]> = {};
            for (let varname of returns) {
                // assignements[varname] = todo: find all strings like  "varname.x=x", "varname.x=x;", "statement1; varname.x=x;", "statement1; varname.x=x",  "statement1; varname.x=x; statement2"...
                // todo2: need to parse also varname["x"] = a;
                // NB: need to even count parenthesis, string literals and comments otherwise "ret.x = ()=>{ let a=1; return a;}; will stop matching at  "ret.x = ()=>{ let a=1;"
            }
            let longestAssigmentLength = 0;
            let longestAssigmentIndex = 0;
            let i = 0;
            for (let assigmentList of Object.values(assignements)) {
                if (longestAssigmentLength < assigmentList.length) longestAssigmentIndex = i;
                i++;
            }
            return assignements[longestAssigmentIndex] || [];
        }
        type assigmentInstructionParsed = {startIndex: number, endIndex: number, assigmentText: string, fullRowText: string, varname: string, leftside: string, rightside: string};
        let __value = getter ? getter(data) : data[field];
        const [value, setValue] = useStateIfMounted(__value);
        const [isTouched, setIsTouched] = useStateIfMounted(false);
        const [list, setList] = useStateIfMounted(extractAssigmentList(value));
        const [showTooltip, setShowTooltip] = useStateIfMounted(false);
        const getInputRow: (assignmentRow: assigmentInstructionParsed) => ReactElement = (assignmentRow: assigmentInstructionParsed) => {
            return <><input value={assignmentRow.leftside} /> = <input value={assignmentRow.rightside} /></>;
            // todo: assigmentRow is the whole statement of the assignement, splt in left and right side
        }
        const getInputRows = () => list.map((row: assigmentInstructionParsed) => getInputRow(row));

        // todo: need to attach events on inputRows to rebuild the full string statement and populate the TextArea
        // option 1: the <Input> values are reported in the textarea
        // option2: the textara only contains non-assigment instructions and the full output is like inputValues.join() + textAreaValue
        // todo problem: how to handle for loops with stataments inside? should they be excluded from being parsed in <input> rows?
        return <>{getInputRows()}<TextArea /></>
















        // I check if the value that I have in my local state is being edited by other <Input />
        const oldValue = (!data) ? 'undefined' : getter ? getter(data) : data[field];
        if (value !== oldValue && !isTouched){
            setValue(oldValue);
            // setIsTouched(false);
            return <></> // doesn't matter, it will re-trigger update after the setValue
        }

        const readOnly = (props.readonly !== undefined) ? props.readonly : data.id.indexOf("Pointer_View") !== -1 // more efficient than U.getDefaultViewsID().includes(data.id);
        const label: string|undefined = props.label;
        const jsxLabel: ReactNode|undefined = props.jsxLabel;
        let tooltip: string|undefined = (props.tooltip === true) ? (data['__info_of__' + field]?.txt) : props.tooltip;
        let css = 'input';
        css += (label && !jsxLabel) ? ' my-auto ms-auto' : '';
        css += (props.hidden) ? ' hidden-input' : '';
        css +=  props.autosize ? ' autosize-input' : '';

        const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
            const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
            if (isBoolean) {
                if (readOnly) return;
                const val = setter ? setter(evt.target.checked) : evt.target.checked;
                if (data[field] !== val) data[field] = val;
            } else {
                setValue(evt.target.value);
                setIsTouched(true);     // I'm editing the element in my local state.
            }
        }

        const onBlur = (evt: React.FocusEvent<HTMLInputElement>) => {
            const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
            if (readOnly || isBoolean) return;
            const val = setter ? setter(evt.target.value) : evt.target.value;
            if (data[field] !== val) data[field] = val;
            // I terminate my editing, so I communicate it to other <Input /> that render the same field.
            setIsTouched(false);
        }

                    const otherprops: GObject = {...props};
                    delete otherprops.data;
                    delete otherprops.field;
                    delete otherprops.getter;
                    delete otherprops.setter;
                    delete otherprops.label;
                    delete otherprops.jsxLabel;
                    delete otherprops.tooltip;
                    delete otherprops.hidden;
                    delete otherprops.inputStyle;
                    delete otherprops.children;
                    delete otherprops.selected;
                    delete otherprops.autosize; // because react complains is bool in dom attribute or unknown attrib name
                    const view = props.data.view;
                    const readOnly = props.readonly;
                    let constants = (view.constants && view.constants !== '{}') ? view.constants?.replaceAll(' ', '').slice(1, -1).split(',') : [];
                    let variables = (view.preRenderFunc && view.preRenderFunc !== '() => {return{}}') ? view.preRenderFunc?.replaceAll(' ', '').slice(12, -2).split(',') : [];


                    const addVar = () => {
                        if(constants.length) view.constants = `${view.constants?.slice(0, -1)}, myConst: 'dummy'}`;
                        else view.constants = `{myConst: 'dummy'}`;
                    }

                    const removeVar = (index: number) => {
                        delete constants[index];
                        view.constants = (`{${constants.filter(c => c).toString()}}`);
                    }

                    const blurNameConst = (index: number, name: string) => {
                        if(readOnly) return;
                        if(!name) name = 'myConst';
                        const value = constants[index].split(':')[1];
                        constants[index] = `${name.replaceAll(' ', '')}: ${value}`;
                        view.constants = (`{${constants.toString()}}`);
                    }

                    const blurValueConst = (index: number, value: string) => {
                        if(readOnly) return;
                        if(!value) value = 'dummy';
                        const name = constants[index].split(':')[0];
                        constants[index] = `${name}: ${value}`;
                        view.constants = (`{${constants.toString()}}`);
                    }

                    const addVar = () => {
                        if(variables.length) view.preRenderFunc = `${view.preRenderFunc?.slice(0, -2)}, myVar: 'dummy'}}`;
                        else view.preRenderFunc = `() => {return{myVar: 'dummy'}}`;
                    }

                    const removeVar = (index: number) => {
                        delete variables[index];
                        view.preRenderFunc = (`() => {return{${variables.filter(c => c).toString()}}}`);
                    }

                    const blurNameVar = (index: number, name: string) => {
                        if(readOnly) return;
                        if(!name) name = 'myVar';
                        const value = variables[index].split(':')[1];
                        variables[index] = `${name.replaceAll(' ', '')}: ${value}`;
                        view.preRenderFunc = (`() => {return{${variables.toString()}}}`);
                    }

                    const blurValueVar = (index: number, value: string) => {
                        if(readOnly) return;
                        if(!value) value = 'dummy';
                        const name = variables[index].split(':')[0];
                        variables[index] = `${name}: ${value}`;
                        view.preRenderFunc = (`() => {return{${variables.toString()}}}`);
                    }


                    return(<section className={'p-3'}>
                        <div className={'d-flex w-100 mb-2'}>
                            <label>Constants (<i>Evaluated Once</i>) </label>
                            <button className={'btn btn-primary ms-auto'} onClick={addConst} disabled={readOnly}>
                                <i className={'p-1 bi bi-plus'}></i>
                            </button>
                        </div>
                        {constants.map((constant, index) => {
                            const c = constant.split(':');
                            const name = c[0].replaceAll(' ', ''); const value = c[1];
                            return(<div className={'d-flex p-1'} key={index}>
                                <input key={index + 'name' + name} className={'input w-25'} tabIndex={-1} onBlur={e => blurNameConst(index, e.target.value)}
                                       defaultValue={name} readOnly={readOnly} />
                                <b className={'mx-1 my-auto'}>=</b>
                                <input key={index + 'value' + value} className={'input w-25'} tabIndex={-1} onBlur={e => blurValueConst(index, e.target.value)}
                                       defaultValue={value} readOnly={readOnly} />
                                <button className={'btn btn-danger ms-2'} disabled={readOnly} onClick={e => removeConst(index)}>
                                    <i className={'p-1 bi bi-trash3-fill'}></i>
                                </button>
                            </div>)
                        })}

                        <div className={'d-flex w-100 mt-4 mb-2'}>
                            <label>Variables (<i>Evaluated Foreach Render</i>)</label>
                            <button className={'btn btn-primary ms-auto'} onClick={addVar} disabled={readOnly}>
                                <i className={'p-1 bi bi-plus'}></i>
                            </button>
                        </div>
                        {variables.map((variable, index) => {
                            const v = variable.split(':');
                            const name = v[0].replaceAll(' ', ''); const value = v[1];
                            return(<div className={'d-flex p-1'} key={index}>
                                <input key={index + 'name' + name} className={'input w-25'} tabIndex={-1} onBlur={e => blurNameVar(index, e.target.value)}
                                       defaultValue={name} readOnly={readOnly}  />
                                <b className={'mx-1 my-auto'}>=</b>
                                <input key={index + 'value' + value} className={'input w-25'} tabIndex={-1} onBlur={e => blurValueVar(index, e.target.value)}
                                       defaultValue={value} readOnly={readOnly} />
                                <button className={'btn btn-danger ms-2'} disabled={readOnly} onClick={e => removeVar(index)}>
                                    <i className={'p-1 bi bi-trash3-fill'}></i>
                                </button>
                            </div>)
                        })}
                    </section>);
                    }
    */
}

interface OwnProps {
    advancedMode?: boolean; // toggle textbox or input array, initial value to set state. after initialization only state.advancedMode is used
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
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
    advancedMode?: boolean;
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

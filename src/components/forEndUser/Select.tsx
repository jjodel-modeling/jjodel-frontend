import type {LClass, DPointerTargetable} from "../../joiner";
import React, {Dispatch, LegacyRef, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import toast, {Toaster} from "react-hot-toast";
import {DState,
    U,
    LPointerTargetable,
    GObject,
    Pointer,
    LEnumerator,
    Selectors,
    LModelElement,
    Overlap} from "../../joiner";

// todo: this is too hardcoded for Pointers and class->attributes etc. need to make it more generic
function SelectComponent(props: AllProps) {
    const data = props.data;
    if(!data) return(<></>);
    const field = props.field;
    const readOnly = props.readonly; // || U.getDefaultViewsID().includes(data.id);
    const value = data[field]?.id || data[field] || 'undefined';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    const tooltip = props.tooltip;
    let css = 'my-auto select ';
    css += (jsxLabel) ? 'ms-1' : 'ms-auto';
    css += (props.hidden) ? ' hidden-input' : '';

    const notify = () => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{tooltip}</label>
        </div>
    ));

    function SelectChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if(readOnly) return;
        const target = evt.target.value;
        console.log("setting:", {data, field, target});
        data[field] = target;
    }

    let hasReturn = false; let hasPrimitive = false; let hasClasses = false; let hasEnumerators = false;
    if(field === 'type') {
        switch (data.className) {
            case 'DAttribute': hasPrimitive = hasEnumerators = true; break;
            case 'DReference': hasClasses = true; break;
            case 'DOperation': hasPrimitive = hasClasses = hasEnumerators = hasReturn = true; break;
            case 'DParameter': hasPrimitive = hasClasses = hasEnumerators = true; break;
        }
    }
    const returns = props.returns;
    const primitives = props.primitives;
    const classes: LClass[] = data.model.classes;
    const enumerators: LEnumerator[] = data.model.enumerators;

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.primitives;
    delete otherprops.returns;
    delete otherprops.hidden;
    return(<label ref={props.ref as any} className={'d-flex p-1'} {...otherprops}>
        {(label || jsxLabel) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {label}
            {jsxLabel}
        </label>}
        <select {...otherprops}
            className={props.inputClassName || css}
            style={props.inputStyle}
            value={value}
            onChange={SelectChange}>

            {(hasReturn && returns.length > 0) && <optgroup label={'Defaults'}>
                {returns.map((returnType, i) => {
                    return <option key={i} value={returnType.id}>{returnType.name}</option>
                })}
            </optgroup>}
            {(hasPrimitive && primitives) && <optgroup label={'Primitives'}>
                {primitives.map((primitive, i) => {
                    return <option key={i} value={primitive.id}>{primitive.name}</option>
                })}
            </optgroup>}
            {(hasEnumerators && enumerators.length > 0) && <optgroup label={'Enumerators'}>
                {enumerators.map((enumerator, i) => {
                    return <option key={i} value={enumerator.id}>{enumerator.name}</option>
                })}
            </optgroup>}
            {(hasClasses && classes.length > 0) && <optgroup label={'Classes'}>
                {classes.map((classifier, i) => {
                    return <option key={i} value={classifier.id}>{classifier.name}</option>
                })}
            </optgroup>}
            {props.options}
        </select>
        {(tooltip) && <Toaster position={'bottom-center'} />}
    </label>);
}
SelectComponent.cname = "SelectComponent";
export interface SelectOwnProps {
    data?: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    tooltip?: string;
    hidden?: boolean;
    options?: JSX.Element;
    key?: React.Key | null;
    className?: string;
    style?: GObject;
    ref?: React.RefObject<HTMLElement> | LegacyRef<HTMLElement>;
    readonly?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
}
interface StateProps {
    data: LPointerTargetable & GObject;
    primitives: LClass[];
    returns: LClass[]; }
interface DispatchProps { }

type AllProps = Overlap<SelectOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: SelectOwnProps): StateProps {
    const ret: StateProps = {} as any;
    if (!ownProps.data) return ret;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    ret.primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    ret.returns = LPointerTargetable.fromPointer(state.returnTypes);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const SelectConnected = connect<StateProps, DispatchProps, SelectOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(SelectComponent);

export const Select = (props: SelectOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <SelectConnected {...{...props, children}} />;
}


SelectComponent.cname = "SelectComponent";
SelectConnected.cname = "SelectConnected";
Select.cname = "Select";
export default Select;

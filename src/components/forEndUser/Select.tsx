import {DPointerTargetable, LClass, LModel, Defaults, U} from '../../joiner';
import {DState, GObject, LEnumerator, LPointerTargetable, Overlap, Pointer} from '../../joiner';
import React, {Dispatch, LegacyRef, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';


function SelectComponent(props: AllProps) {
    const data = props.data;
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);
    if (!data) return(<></>);
    let d: DPointerTargetable = data.__raw || data;
    let l: LPointerTargetable = LPointerTargetable.fromD(data);
    let gdata: GObject<LPointerTargetable> = data;
    const field: (keyof LPointerTargetable & keyof DPointerTargetable) = props.field as any;
    const readOnly = props.readonly !== undefined ? props.readonly : !props.debugmode && Defaults.check(data.id);
    const value: string | Pointer = props.getter ? props.getter(d, field) : d[field] as string;
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: string|undefined = (props.tooltip === true) ? ((gdata['__info_of__' + field]) ? gdata['__info_of__' + field].txt: '') : props.tooltip;
    tooltip = tooltip || '';
    let css = 'my-auto select ';
    css += (jsxLabel) ? 'ms-1' : 'ms-auto';
    css += (props.hidden) ? ' hidden-input' : '';

    function SelectChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if (readOnly) return;
        const newValue = evt.target.value;
        const oldValue = props.getter ? props.getter(d, field) : d[field] as string;
        if (newValue === oldValue) return;
        if (props.setter) props.setter(data, field, newValue);
        else (data as GObject)[field] = newValue;
    }

    let returns: LClass[] | undefined;
    let primitives: LClass[] | undefined;
    let classes: LClass[] | undefined;
    let enumerators: LEnumerator[] | undefined;
    if ((field as string) === 'type') {
        let model: LModel | undefined = (l as GObject).model;
        if (model) switch (data.className) {
            case 'DAttribute': primitives = props.primitives; enumerators = model.enums; break;
            case 'DReference': classes = model.classes; break;
            case 'DOperation': primitives = props.primitives; classes = model.classes; enumerators = model.enums; returns = props.returns; break;
            case 'DParameter': primitives = props.primitives; classes = model.classes; enumerators = model.enums;  break;
        }
    }

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.primitives;
    delete otherprops.returns;
    delete otherprops.hidden;
    return(<label ref={props.ref as any} className={'d-flex p-1'} {...otherprops}>
        {(label || jsxLabel) && <label className={'my-auto'}
                                       onMouseEnter={e => setShowTooltip(true)}
                                       onMouseLeave={e => setShowTooltip(false)}>
            {label}
            {jsxLabel}
        </label>}
        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}

        <select {...otherprops} disabled={readOnly}
            className={props.inputClassName || css}
            style={props.inputStyle}
            value={value}
            onChange={SelectChange}>

            {(returns && returns.length > 0) && <optgroup label={'Defaults'}>
                {returns.map((returnType, i) => {
                    return <option key={i} value={returnType.id}>{returnType.name}</option>
                })}
            </optgroup>}
            {(primitives && primitives.length) && <optgroup label={'Primitives'}>
                {primitives.map((primitive, i) => {
                   return <option key={i} value={primitive.id}>{primitive.name}</option>
                })}
            </optgroup>}
            {(enumerators && enumerators.length > 0) && <optgroup label={'Enumerators'}>
                {enumerators.map((enumerator, i) => {
                    return <option key={i} value={enumerator.id}>{enumerator.name}</option>
                })}
            </optgroup>}
            {(classes && classes.length > 0) && <optgroup label={'Classes'}>
                {classes.map((classifier, i) => {
                    return <option key={i} value={classifier.id}>{classifier.name}</option>
                })}
            </optgroup>}
            {props.options}
        </select>
        {(props.postLabel) &&
            <label className={'my-auto'} onMouseEnter={e => setShowTooltip(true)} onMouseLeave={e => setShowTooltip(false)}>
                {props.postLabel}
            </label>
        }
    </label>);
}
SelectComponent.cname = 'SelectComponent';
export interface SelectOwnProps {
    data?: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    postLabel?: ReactNode;
    jsxLabel?: ReactNode;
    tooltip?: boolean|string;
    hidden?: boolean;
    options?: JSX.Element;
    key?: React.Key | null;
    className?: string;
    style?: GObject;
    ref?: React.RefObject<HTMLElement> | LegacyRef<HTMLElement>;
    readonly?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T) => string;
    // setter?: <T extends DPointerTargetable = any>(data: T | Pointer<T>, field: keyof T, selectedValue: string) => void;
    // setter?: <T extends DPointerTargetable = any>(data: any | T | Pointer<T>, field: (string | number | symbol) | keyof T, selectedValue: string) => void;
    setter?: (data: any, field: string, selectedValue: string) => void;

}
interface StateProps {
    debugmode: boolean,
    data: LPointerTargetable;
    primitives: LClass[];
    returns: LClass[]; }
interface DispatchProps { }

type AllProps = Overlap<SelectOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: SelectOwnProps): StateProps {
    const ret: StateProps = {} as any;
    if (!ownProps.data) return ret;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmode = state.debug;
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


SelectComponent.cname = 'SelectComponent';
SelectConnected.cname = 'SelectConnected';
Select.cname = 'Select';
export default Select;

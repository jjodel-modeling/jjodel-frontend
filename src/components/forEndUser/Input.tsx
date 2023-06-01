import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {DPointerTargetable, GObject, LModelElement, LPointerTargetable, Pointer} from "../../joiner";
import toast, {Toaster} from 'react-hot-toast';


function InputComponent(props: AllProps) {
    // todo: data can be injected with UX, if field is present, can take type from a metainfo like __info_of__
    const data = props.data;
    if(!data) return(<></>);
    const getter = props.getter;
    const setter = props.setter;
    const field = props.field;
    const value = (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined';
    const type = (props.type) ? props.type : 'text';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    const tooltip = props.tooltip;
    let css = 'my-auto input ';
    let inputClassName = (props.inputClassName || '');
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';
    let autosize: boolean = props.autosize === undefined ? false : props.autosize; // props.type==="text"
    css += autosize ? ' autosize-input' : '';

    const notify = () => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{tooltip}</label>
        </div>
    ));

    const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
        if(setter) setter(evt.target.value);
        else {
            const target = (['checkbox', 'radio'].includes(evt.target.type)) ? evt.target.checked : evt.target.value;
            data[field] = target;
        }
    }

    let className = (props as any).className || '';
    let style = (props as any).style || {};
    props = {...props, className:'', style:{}} as any;
    let input = <input spellCheck={false} readOnly={props.readonly} className={css + inputClassName}
                       type={type} value={value} onChange={change}
                       checked={(['checkbox', 'radio'].includes(type)) ? !!value : undefined} />

    return(<div style={{...{display: (jsxLabel || label) ? 'flex' : 'block', cursor: (tooltip) ? 'help' : 'auto'}, ...style}}
                className={'p-1 ' + className} key={props.key}>
        {(label && !jsxLabel) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {jsxLabel}
        </label>}
        { autosize ? <div className={ (autosize ? "autosize-input-container" : "") + (props.asLabel ? " labelstyle" : "")}
                          data-value={value}>{input}</div> : input}
        {tooltip && <Toaster position={'bottom-center'} /> }
    </div>);
}
export interface InputOwnProps {
    obj: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
        'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    readonly?: boolean;
    tooltip?: string;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    asLabel?: boolean;
    key?: React.Key | null;
}
interface StateProps { data: LPointerTargetable & GObject; }
interface DispatchProps { }
type AllProps = InputOwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: InputOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const InputConnected = connect<StateProps, DispatchProps, InputOwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(InputComponent);

export const Input = (props: InputOwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <InputConnected {...{...props, childrens}} />;
}
export default Input;

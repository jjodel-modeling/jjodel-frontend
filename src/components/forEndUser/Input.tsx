import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {DPointerTargetable, GObject, LPointerTargetable, Pointer} from "../../joiner";
import toast, {Toaster} from 'react-hot-toast';


function InputComponent(props: AllProps) {
    const data = props.data;
    const field = props.field;
    const value = (data[field] !== undefined) ? data[field] : 'undefined';
    const type = (props.type) ? props.type : 'text';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    const tooltip = props.tooltip;
    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';

    const notify = () => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{tooltip}</label>
        </div>
    ));

    const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const target: any = (['checkbox', 'radio'].includes(evt.target.type)) ? evt.target.checked : evt.target.value;
        data[field] = target;
    }

    return(<div style={{display: (jsxLabel || label) ? 'flex' : 'block'}} className={'p-1'}>
        {(label && !jsxLabel) && <label style={{cursor: (tooltip) ? 'help' : 'auto'}} className={'my-auto'} onClick={() => { if(tooltip) notify(); }}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'}>
            {jsxLabel}
        </label>}
        <input spellCheck={false} readOnly={props.readonly} className={css}
               type={type} onChange={change} value={value}
               checked={(['checkbox', 'radio'].includes(type)) ? value : false} />
        {(tooltip) && <Toaster position={'bottom-center'} />}
    </div>);
}
interface OwnProps {
    obj: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
        'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    readonly?: boolean;
    tooltip?: string;
    hidden?: boolean;
}
interface StateProps { data: LPointerTargetable & GObject; }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const InputConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(InputComponent);

export const Input = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <InputConnected {...{...props, childrens}} />;
}
export default Input;

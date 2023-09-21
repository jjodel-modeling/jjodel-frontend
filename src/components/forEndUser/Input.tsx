import React, {Dispatch, ReactElement, ReactNode, useEffect} from "react";
import {connect} from "react-redux";
import {DState} from "../../redux/store";
import {
    Dictionary,
    DPointerTargetable, DUser,
    GObject,
    LModelElement,
    LPointerTargetable,
    Overlap,
    Pointer,
    Selectors,
    U
} from "../../joiner";
import toast, {Toaster} from 'react-hot-toast';
import {useStateIfMounted} from "use-state-if-mounted";


function InputComponent(props: AllProps) {
    // todo: data can be injected with UX, if field is present, can take type from a metainfo like __info_of__
    const data = props.data;
    // const selected = props.selected;
    const fathers = U.fatherChain(data as LModelElement);
    let editable = true;

    /*  Uncomment this when we have user authentication: if a user is on a ME, it cannot be edited.
    for(let father of fathers) {
        const user = Object.keys(selected).find(key => selected[key]?.id === father);
        if(user && user !== DUser.current) editable = false;
        if(!editable) break;
    }
    */

    const getter = props.getter;
    const setter = props.setter;
    const field = props.field;
    let __value = (!data) ? 'undefined' : (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined';
    const [value, setValue] = useStateIfMounted(__value);
    const [isTouched, setIsTouched] = useStateIfMounted(false);

    useEffect(() => {
        // I check if the value that I have in my local state is being edited by other <Input />
        const oldValue = (!data) ? 'undefined' : (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined'
        if(value !== oldValue && !isTouched){
            setValue(oldValue);
            setIsTouched(false);
        }
    })


    if(!data) return(<></>);
    const readOnly = props.readonly || U.getDefaultViewsID().includes(data.id);
    const type = (props.type) ? props.type : 'text';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    /*
    let tooltip: string | React.ReactElement | Info = props.tooltip === true ? data["__info_of__" + field] : (props.tooltip || undefined);
    if (typeof tooltip === "object" && (tooltip as Info).txt) {
        tooltip = <div className={"tooltip"}>
            <span className={"type"} style={{color: "orange"}}>{":"+tooltip.type+"\t"}</span>
            <span className={"txt"}>{(tooltip as Info).txt}</span>
        </div>;
    }
    */
    let tooltip: string = (props.tooltip === true) ? (data["__info_of__" + field]) ? data["__info_of__" + field].txt : '' : '';

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
        const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
        if(isBoolean) {
            const target = evt.target.checked;
            if(setter) setter(target);
            else data[field] = target;
        } else {
            setValue(evt.target.value);
            setIsTouched(true);     // I'm editing the element in my local state.
        }
    }

    const blur = (evt: React.FocusEvent<HTMLInputElement>) => {
        const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
        if(readOnly || isBoolean) return;
        const target = evt.target.value;
        const oldValue = (!data) ? 'undefined' : (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined'
        if(target !== oldValue) {
            if(setter) setter(target);
            else data[field] = target;
        }
        // I terminate my editing, so I communicate it to other <Input /> that render the same field.
        setIsTouched(false);
    }

    let className = (props as any).className || '';
    let style = (props as any).style || {};
    props = {...props, className:'', style:{}} as any;
    let input = <input key={`${field}.${data.id}`} spellCheck={false} readOnly={readOnly || (!editable && false)} className={css + inputClassName}
                       type={type} value={value} onChange={change} onBlur={blur}
                       checked={(['checkbox', 'radio'].includes(type)) ? !!value : undefined} />


    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.hidden;



    return(<div {...otherprops} style={{...{display: (jsxLabel || label) ? 'flex' : 'block', cursor: (tooltip) ? 'help' : 'auto'}, ...style}}
                                className={'p-1 ' + className}>
        {(label && !jsxLabel) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {jsxLabel}
        </label>}
        {autosize ? <div className={ (autosize ? "autosize-input-container" : "") + (props.asLabel ? " labelstyle" : "")}
                          data-value={value}>{input}</div> : input}
        {tooltip && <Toaster position={'bottom-center'} /> }
</div>);
}
InputComponent.cname = "InputComponent";
export interface InputOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
    'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    readonly?: boolean;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    asLabel?: boolean;
    key?: React.Key | null;
}
interface StateProps {
    data: LPointerTargetable & GObject;
    // selected: Dictionary<Pointer<DUser>, LModelElement|null>;
}
interface DispatchProps { }
type AllProps = Overlap<InputOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: InputOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    /*
    const selected = state.selected;
    ret.selected = {};
    for(let user of Object.keys(selected)) {
        const pointer = selected[user];
        if(pointer) ret.selected[user] = LModelElement.fromPointer(pointer);
        else ret.selected[user] = null;
    }

    */
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const InputConnected = connect<StateProps, DispatchProps, InputOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(InputComponent);


export function Input(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement {
    return <InputConnected {...{...props, children}} />;
}

InputComponent.cname = "InputComponent";
InputConnected.cname = "InputConnected";
Input.cname = "Input";
// export default Input____a;

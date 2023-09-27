import React, {Dispatch, ReactElement, ReactNode, useEffect} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {DPointerTargetable, GObject, LPointerTargetable, Overlap, Pointer, U} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';


function InputComponent(props: AllProps) {
    // todo: data can be injected with UX, if field is present, can take type from a metainfo like __info_of__
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
    */

    const getter = props.getter;
    const setter = props.setter;
    const field = props.field;
    let __value = (!data) ? 'undefined' : ((getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined');
    const [value, setValue] = useStateIfMounted(__value);
    const [isTouched, setIsTouched] = useStateIfMounted(false);
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);

    useEffect(() => {
        // I check if the value that I have in my local state is being edited by other <Input />
        const oldValue = (!data) ? 'undefined' : (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined'
        if(value !== oldValue && !isTouched){
            setValue(oldValue);
            setIsTouched(false);
        }
    })


    if (!data) return(<></>);
    const readOnly = (props.readonly !== undefined) ? props.readonly : data.id.indexOf("Pointer_View") !== -1 // more efficient than U.getDefaultViewsID().includes(data.id);
    const type = (props.type) ? props.type : 'text';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: string|undefined = (props.tooltip === true) ? ((data['__info_of__' + field]) ? data['__info_of__' + field].txt: '') : props.tooltip;
    tooltip = (tooltip) ? tooltip : '';

    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';
    let autosize: boolean = props.autosize === undefined ? false : props.autosize; // props.type==='text'
    css += autosize ? ' autosize-input' : '';

    const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
        const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
        if (isBoolean) {
            if (readOnly) return;
            const target = evt.target.checked;
            if (setter) setter(target);
            else data[field] = target;
        } else {
            setValue(evt.target.value);
            setIsTouched(true);     // I'm editing the element in my local state.
        }
    }

    const blur = (evt: React.FocusEvent<HTMLInputElement>) => {
        const isBoolean = (['checkbox', 'radio'].includes(evt.target.type));
        if (readOnly || isBoolean) return;
        const target = evt.target.value;
        const oldValue = (!data) ? 'undefined' : (getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined'
        if (target !== oldValue) {
            if (setter) setter(target);
            else data[field] = target;
        }
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
    let input = <input {...otherprops}
                       key={`${field}.${data.id}`}
                       className={props.inputClassName || css}
                       style={props.inputStyle}
                       spellCheck={false}
                       readOnly={readOnly || (!editable && false)}
                       type={type} value={value} onChange={change} onBlur={blur}
                       checked={(['checkbox', 'radio'].includes(type)) ? !!value : undefined} />

    // style={{cursor: (tooltip) ? 'help' : 'auto'}}
    return(<label className={'p-1'} {...otherprops}
                  style={{display: (jsxLabel || label) ? 'flex' : 'block', cursor: tooltip ? 'help' : 'auto', ...((props as any).style || {})}}>

        { label && <label className={'my-auto'}
                          onMouseEnter={e => setShowTooltip(true)} onMouseLeave={e => setShowTooltip(false)}>
            {label}</label>}
        {jsxLabel && <label
            onMouseEnter={e => setShowTooltip(true)} onMouseLeave={e => setShowTooltip(false)}>{jsxLabel}</label> }

        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}

        {autosize ? <div className={ (autosize ? 'autosize-input-container' : '') + (props.asLabel ? ' labelstyle' : '')}
                          data-value={value}>{input}</div> : input}
    </label>);
}

InputComponent.cname = 'InputComponent';
export interface InputOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
    'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
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
    data: LPointerTargetable & GObject;
    // selected: Dictionary<Pointer<DUser>, LModelElement | null>;
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

export const InputConnected =
    connect<StateProps, DispatchProps, InputOwnProps, DState>(mapStateToProps, mapDispatchToProps)(InputComponent);


export function Input(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement {
    return <InputConnected {...{...props, children}} />;
}

InputComponent.cname = 'InputComponent';
InputConnected.cname = 'InputConnected';
Input.cname = 'Input';

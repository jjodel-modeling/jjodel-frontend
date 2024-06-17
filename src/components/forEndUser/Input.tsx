import React, {Dispatch, KeyboardEvent, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {Defaults, DPointerTargetable, GObject, Keystrokes, LPointerTargetable, Overlap, Pointer, U} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';


function InputComponent(props: AllProps) {
    const data = props.data;

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
    const field: string = props.field as string;
    const oldValue = (!data) ? undefined : (getter) ? getter(data) : data[field]; // !== undefined); ? data[field] : 'undefined'
    const [value, setValue] = useStateIfMounted(oldValue);
    const [isTouched, setIsTouched] = useStateIfMounted(false);
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);

    // I check if the value that I have in my local state is being edited by other <Input />
    if (value !== oldValue && !isTouched){
        setValue(oldValue);
        setIsTouched(false);
    }


    if (!(data || (getter && setter))) return(<>Either props.data or both getter & setter are required.</>);
    const readOnly = (props.readonly !== undefined) ? props.readonly : props.debugmodee !== 'true' && Defaults.check(data?.id);
    const type = (props.type) ? props.type : 'text';
    const label: ReactNode|string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: ReactNode|string|undefined = ((props.tooltip === true) ? data?.['__info_of__' + field]?.txt : props.tooltip) || '';

    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';
    let autosize: boolean = props.autosize === undefined ? false : props.autosize; // props.type==='text'
    css += autosize ? ' autosize-input' : '';
    const isBoolean = (['checkbox', 'radio'].includes(type));

    const change = (evt: React.ChangeEvent<HTMLInputElement>) => {
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
    const keyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
        if (evt.key === Keystrokes.enter) blur(evt as any);
        if (evt.key === Keystrokes.escape) {
            const oldValue = getter ? getter(data) : data[field];
            (evt.target as HTMLInputElement).value = oldValue;
            setValue(oldValue);
            setIsTouched(false);
            (evt.target as HTMLInputElement).blur();
            // to optimize: probably can remove a large part of this function because this should trigger blur event as well. or move "change" event contents here
            // optimize 2: memoize the whole component, so it won't update unless the displayed value changed. this would also fix cursor going to input end when pressing enter.
        }
    }

    const blur = (evt: React.FocusEvent<HTMLInputElement>) => {
        if (readOnly || isBoolean) return;
        const newValue = evt.target.value;
        const oldValue = getter ? getter(data) : data[field];
        if (newValue !== oldValue) {
            if (setter) setter(newValue);
            else data[field] = newValue;
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
    delete otherprops.autosize; // because react complains is bool in dom attribute or unknown attrib name

    let checked: boolean | undefined = undefined;
    if (isBoolean) checked = typeof value === "boolean" ? value : (typeof value === "string" ? U.fromBoolString(value) : !!value);

    let cursor: string;
    if (tooltip) cursor = 'help';
    else if (readOnly) cursor = 'not-allowed';
    else if (isBoolean) cursor = 'pointer';
    else cursor = 'auto';
    let inputStyle = props.inputStyle || {};
    if (!inputStyle.cursor && cursor === 'not-allowed') { inputStyle.cursor = cursor; }
    let rootStyle = {display: (jsxLabel || label) ? 'flex' : 'block', cursor, ...((props as any).style || {})};
    if (readOnly && !("color" in rootStyle)) rootStyle.color = "gray";
    let input = <input {...otherprops}
                       key={`${field}.${data?.id}`}
                       className={props.inputClassName || css}
                       style={inputStyle}
                       spellCheck={false}
                       readOnly={readOnly}
                       type={type} value={value} onChange={change} onBlur={blur} onKeyDown={keyDown}
                       checked={checked} />

    return(<label className={'p-1'} {...otherprops}
                  style={rootStyle}>

        {label && <span className={'my-auto'} onMouseEnter={e => setShowTooltip(true)}
                         onMouseLeave={e => setShowTooltip(false)}>{label}
        </span>}

        {jsxLabel && <span onMouseEnter={e => setShowTooltip(true)}
                            onMouseLeave={e => setShowTooltip(false)} style={{width: '100%'}}>{jsxLabel}
        </span>}

        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}

        {autosize ? <div className={(autosize ? 'autosize-input-container' : '') + (props.asLabel ? ' labelstyle' : '')}
                         data-value={value}>{input}
        </div> : input}
    </label>);
}

InputComponent.cname = 'InputComponent';
export interface InputOwnProps {
    data?: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field?: string;
    getter?: (data: any/*LPointerTargetable*/) => string | boolean | undefined;
    setter?: (value: string|boolean) => void;
    label?: string | ReactNode;
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
    placeholder?: string;
}
interface StateProps {
    debugmodee: string;
    data: LPointerTargetable & GObject;
    // selected: Dictionary<Pointer<DUser>, LModelElement | null>;
}
interface DispatchProps { }
type AllProps = Overlap<InputOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: InputOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer | undefined = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data?.id;
    ret.debugmodee = state.debug ? 'true' : 'false';
    if (pointer) ret.data = LPointerTargetable.fromPointer(pointer);
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
export const Edit = Input;

InputComponent.cname = 'InputComponent';
InputConnected.cname = 'InputConnected';
Input.cname = 'Input';
Edit.cname = 'Edit';

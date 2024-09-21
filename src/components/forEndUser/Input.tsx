import React, {Dispatch, KeyboardEvent, LegacyRef, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Defaults,
    DObject,
    DPointerTargetable,
    GObject,
    Keystrokes, LAttribute,
    LClass, LEnumerator, LModel, LObject,
    LPointerTargetable, LReference, LValue,
    Overlap,
    Pointer, PrimitiveType, Selectors,
    store,
    U
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';
import { Tooltip } from './Tooltip';


export function getSelectOptions(data: any, field: string, options: ReactNode, children?: ReactNode) {
    // console.log("select options", {data, field, children, options});
    if (options) return options;
    // children is auto-filled to empty array even if it is not set explicitly in jsx
    if (Array.isArray(children) && children.length > 0) return children;
    let returns: LClass[] | undefined;
    let primitives: LClass[] | undefined;
    let classes: LClass[] | undefined;
    let enumerators: LEnumerator[] | undefined;
    let objects: LObject[] | undefined;
    let m2classname: string | undefined;
    let hasPrimitives: boolean = false;
    let hasReturnTypes: boolean = false;
    if ((field) === 'type') {
        if (data) {
            let model = data.model;
            switch (data.className) {
                case 'DValue':
                    let m2: LReference | LAttribute | undefined = (data as LValue).instanceof;
                    if (!m2) return (data as LValue).model.allSubObjects;
                    let dm2 = m2.__raw;
                    if (dm2.className === "DAttribute") break;
                    m2classname = dm2.name;
                    let m1modelid = model.id;
                    return m2.instances.filter( o => o.model.id === m1modelid);
                case 'DAttribute': enumerators = model.enums; hasPrimitives = true; break;
                case 'DReference': classes = model.classes; break;
                case 'DOperation': classes = model.classes; enumerators = model.enums; hasPrimitives = hasReturnTypes = true; break;
                case 'DParameter': classes = model.classes; enumerators = model.enums; hasPrimitives = true; break;
            }
        }
    }
    let state: DState | undefined;
    // todo: all this stuff might be better moved in mapstatetoprops, or the select list won't update properly.
    if (hasPrimitives) {
        if (!state) state = store.getState();
        primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    }
    if (hasReturnTypes) {
        if (!state) state = store.getState();
        primitives = LPointerTargetable.fromPointer(state.returnTypes);
    }

    // console.log("select options", {data, field, returns, primitives, classes, enumerators});

    return (
        <>
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
            {(objects && objects.length > 0) && <optgroup label={m2classname ? 'Instances of ' + m2classname : "All objects"}>
                {objects.map((classifier, i) => {
                    return <option key={i} value={classifier.id}>{classifier.name}</option>
                })}
            </optgroup>}
            {/*options*/}
        </>);
}
export function InputComponent(props: AllProps) {
    const data = props.data;
    const getter = props.getter;
    const setter = props.setter;
    const field: string = props.field as string;
    const oldValue: PrimitiveType | LPointerTargetable = (getter) ? getter(data, field) : (data ? data[field] : undefined); // !== undefined); ? data[field] : 'undefined'
    let [value, setValue] = useStateIfMounted<PrimitiveType | LPointerTargetable>(oldValue);

    const [isTouched, setIsTouched] = useStateIfMounted(false);
    const inputRef = useRef<Element | null>(null);
    if (props.tag === 'select') value = oldValue; // select does not use state.
    let serializeValue = (val: LPointerTargetable | PrimitiveType): string | PrimitiveType => (val as LPointerTargetable)?.id || (val as any);

    function valueDidChange(v1: any, v2: any): boolean {
        return serializeValue(v1) !== serializeValue(v2);
        /*
        let rawv1 = v1?.__raw || v1;
        let rawv2 = v2?.__raw || v2;
        if (rawv1 !== v1 || rawv2 !== v2) { return v1?.clonedCounter !== v2?.clonedCounter; }
        return v1 !== v2;*/
    }

    // I check if the value that I have in my local state is being edited by other <Input />
    if (props.tag !== 'select' && !isTouched && valueDidChange(value, oldValue)){
        setValue(serializeValue(oldValue));
        setIsTouched(false);
    }


    if (!((data && field) || (getter && setter))) return(<>Either props.data & field or both getter & setter are required.</>);
    let readOnly: boolean;
    if (props.readonly !== undefined) readOnly = props.readonly;
    // else if (props.disabled !== undefined) readOnly = props.disabled;
    else readOnly = props.debugmodee !== 'true' && Defaults.check(data?.id)

    const type = (props.type) ? props.type : 'text';
    let label: ReactNode | undefined = props.jsxLabel || props.label;
    let postlabel: ReactNode | undefined = props.postlabel;
    let tooltip: ReactNode|string|undefined = ((props.tooltip === true) ? data?.['__info_of__' + field]?.txt : props.tooltip) || '';

    let css = '';//'my-auto input ';
    //css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';
    let autosize: boolean = props.autosize === undefined ? false : props.autosize; // props.type==='text'
    css += autosize ? ' autosize-input' : '';
    const isBoolean = (['checkbox', 'radio'].includes(type));


    const onChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
        (props as any).onChange?.(evt);
        if (readOnly) return;
        if (isBoolean) {
            const target = evt.target.checked;
            if (setter) setter(target, data, field);
            else data[field] = target;
            setValue(target);
            return;
        }
        if (props.tag === "select") {
            confirmValue(evt as any);
        } else {
            //console.log("setValue", {value, nv: getValueFromEvent(evt), evt, ev: evt.target.value});
            setValue(getValueFromEvent(evt));
            setIsTouched(true);     // I'm editing the element in my local state.
            // the actual set is done in onBlur
        }
    }
    const onKeyDown = (evt: React.KeyboardEvent<HTMLInputElement>) => {
        (props as any).onKeyDown?.(evt);
        if (props.tag === 'select') return;
        if (evt.key === Keystrokes.enter) confirmValue(evt as any);
        if (evt.key === Keystrokes.escape) {
            const oldValue = getter ? getter(data, field) : data[field];
            writeHtmlValueFromEvent(evt as any, oldValue);
            setValue(serializeValue(oldValue));
            setIsTouched(false);
            (evt.target as HTMLInputElement).blur();
            // to optimize: probably can remove a large part of this function because this should trigger blur event as well. or move "change" event contents here
            // optimize 2: memoize the whole component, so it won't update unless the displayed value changed. this would also fix cursor going to input end when pressing enter.
        }
    }
    const getValueFromEvent = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
        switch (props.tag){
            case "textarea": case "input": case "select": case "": case null: case undefined: return evt.target.value;
            default: return evt.target.innerText;
        }
    }
    const writeHtmlValueFromEvent = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }, value: any) => {
        value = serializeValue(value);
        switch (props.tag){
            case "textarea": case "input": case "select": case "": case null: case undefined: return evt.target.value = value;
            default: return evt.target.innerText = value;
        }
    }

    const onBlur = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
        (props as any).onBlur?.(evt);
        if (props.tag === 'select') return;
        confirmValue(evt);
    }
    const confirmValue = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }) => {
        if (readOnly || isBoolean) return;
        const newValue: string = getValueFromEvent(evt);
        const oldValue = getter ? getter(data, field) : data[field];
        // console.log("onChange confirm", {evt, newValue, oldValue, changed: valueDidChange(newValue, oldValue), readOnly, isBoolean, nnv:serializeValue(newValue)});
        if (valueDidChange(newValue, oldValue)){
            if (setter) setter(newValue, data, field);
            else data[field] = serializeValue(newValue);
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
    delete otherprops.postlabel;
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

    let inputProps: GObject = {...otherprops,
        className: [props.inputClassName, css].join(' '),
        style: (props.inputStyle || {}),
        spellCheck: (props as any).spellCkeck || false, readOnly, disabled: readOnly, type, value: serializeValue(value), checked,
        onChange, onBlur, onKeyDown} // key:`${field}.${data?.id}`
    if (!inputProps.style.cursor && cursor === 'not-allowed') { inputProps.style.cursor = cursor; }

    let input: ReactNode;
    let rootprops: GObject = {className: otherprops.className, style: otherprops.style};
    switch (typeof rootprops.ref) {
        default: rootprops.ref = inputRef; break;
        case "object":
            let oldref = rootprops.ref;
            rootprops.ref = (v: Element | null) => { oldref.current = inputRef.current = v; }
            break;
        case "function":
            let oldreff = rootprops.ref;
            rootprops.ref = (v: Element | null) => { oldreff(v); inputRef.current = v; }
            break;
    }
    if (props.autosize) rootprops['data-value'] = inputProps.value;

    if (tooltip) {
        rootprops.onMouseEnter = () => Tooltip.show(tooltip, 'b', (rootprops.ref?.current) || rootprops.ref);
        rootprops.onMouseLeave = () => Tooltip.hide();
    }
    /*let rootkeys = new Set(...Object.keys(rootprops));
    //  merge events: might want to distinguish which events are merged between root and input and which not.
    //  onChange surely needs merge. onMouseHover might not to let it trigger on label too.
    for (let k of rootkeys) {
        if (!(k[0] === 'o' && k[1] === 'n' && k[2] && k[2].toUpperCase() === k[2])) continue;
        if (inputProps[k]) inputProps[k] = function(...a:any) { inputProps[k](arguments); rootprops[k](arguments); }
        else inputProps[k] = rootprops[k];
        delete rootprops[k];
    }*/

    if (!label && !postlabel && !autosize) {
        if (rootprops.className) inputProps.className = rootprops.className + ' ' + inputProps.className;
        if (rootprops.style) U.objectMergeInPlace(inputProps.style, rootprops.style);
        inputProps = {...rootprops, ...inputProps};
        switch (props.tag){
            case "textarea": return <textarea {...inputProps}>{inputProps.value}</textarea>;
            case "select": return <div><select {...inputProps}>{getSelectOptions(data, field, props.options, props.children)}</select></div>;
            case null: case undefined: case "": case "input": return <input {...inputProps} />;
            default:
                inputProps.contentEditable = inputProps.contentEditable !== false;
                return React.createElement(props.tag, inputProps, props.children);
        }
    }
    if (autosize) rootprops.className = (rootprops.className || '') + ' autosize-input-container';

    switch (props.tag){
        case "textarea": input = <textarea {...inputProps}>{inputProps.value}</textarea>; break;
        case "select": input = <select {...inputProps}>{getSelectOptions(data, field, props.options, props.children)}</select>; break;
        case null: case undefined: case "": case "input": input = <input {...inputProps} />; break;
        default:
            inputProps.contentEditable = inputProps.contentEditable !== false;
            input = React.createElement(props.tag, inputProps, props.children); break;
    }
    if (typeof label === "string") label = <span>{label}</span>;
    if (typeof postlabel === "string") postlabel = <span>{postlabel}</span>;

    const openSelect = (e: any)=>{
        /*
        tried to make label click open the select but does not work easily in js, a solution was here but with css padding.
        https://stackoverflow.com/questions/15249958/once-i-click-on-label-select-button-should-get-open
        */
        if (props.tag !== "select") return;
        let t: HTMLElement = (e.target) as any;
        let select = (t.tagName === 'select') ? t : t.querySelector('select');
        console.log("click select root", {t, select});
        select?.click();
    }
    return <label className={'input-container'} {...rootprops} /*onClick={openSelect}*/>
    {label || undefined}{input}{postlabel || undefined}</label>;
    /*
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
    */
}

InputComponent.cname = 'InputComponent';
export interface InputOwnProps {
    data?: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field?: string;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: (data: any/*LPointerTargetable*/, field: string) => string | boolean | undefined;
    setter?: (value: string|boolean, data: any, field: string) => void;
    label?: string | ReactNode;
    postlabel?: string | ReactNode;
    jsxLabel?: ReactNode; // @deprecated, use label
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    threeStateCheckbox?: boolean;
    className?: string;
    style?: GObject;
    readonly?: boolean;
    tooltip?: boolean | ReactNode;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    key?: React.Key | null;
    placeholder?: string;
    tag?: string;
    children?: ReactNode;
}

export interface SelectOwnProps extends Omit<InputOwnProps, 'setter'> {
    options?: JSX.Element;
    setter?: (value: string, data: any, field: string) => void; // parent select has value: string | boolean
}
interface RealOwnProps extends Omit<SelectOwnProps, 'setter'>{
    setter: InputOwnProps['setter'];
}

interface StateProps {
    debugmodee: string;
    data: LPointerTargetable & GObject;
    // selected: Dictionary<Pointer<DUser>, LModelElement | null>;
}
interface DispatchProps { }
type AllProps = Overlap<RealOwnProps, Overlap<StateProps, DispatchProps>>;


export function InputMapStateToProps(state: DState, ownProps: RealOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer | undefined = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data?.id;
    ret.debugmodee = state.debug ? 'true' : 'false';
    if (pointer) ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}

export const InputConnected =
    connect<StateProps, DispatchProps, RealOwnProps, DState>(InputMapStateToProps, mapDispatchToProps)(InputComponent);


// export function Input(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'input' as any; }
export function Input(props: InputOwnProps): ReactElement {
    return <InputConnected {...props as any}>{props.children}</InputConnected>;
}

// export function TextArea(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'textarea' as any; }
export function TextArea(props: InputOwnProps): ReactElement {
    return <InputConnected {...{...props, tag:"textarea"} as any}>{props.children}</InputConnected>;
}
//export function Select(props: SelectOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'select' as any; }
export function Select(props: SelectOwnProps): ReactElement {
    return <InputConnected {...{...props, tag:"select"} as any}>{props.children}</InputConnected>;
}
export const Edit = Input;

InputComponent.cname = 'InputComponent';
InputConnected.cname = 'InputConnected';
Input.cname = 'Input';
TextArea.cname = 'TextArea';
Select.cname = 'Select';
Edit.cname = 'Edit';

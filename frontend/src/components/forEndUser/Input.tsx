import React, {Dispatch, KeyboardEvent, LegacyRef, ReactElement, ReactNode, useRef} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {
    Any,
    Defaults,
    DObject,
    DPointerTargetable,
    GObject,
    Keystrokes, LAttribute,
    LClass, LEnumerator, LEnumLiteral, LModel, LObject,
    LPointerTargetable, LReference, LStructuralFeature, LValue, MultiSelect, MultiSelectOptGroup,
    MultiSelectOption,
    Overlap,
    Pointer, PrimitiveType, Selectors,
    store,
    U,
    UX
} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './inputselect.scss';
import { Tooltip } from './Tooltip';

export function getSelectOptions_raw(data: LPointerTargetable, field: string): MultiSelectOptGroup[] {
    if (!data) return [];
    switch (field){
        default:
        case 'extends':
        case 'type':
        case 'values': return (data as LValue | LStructuralFeature | LClass).validTargetOptions;
    }
    return [];
}

export function getSelectOptions(data: LPointerTargetable, field: string, options: ReactNode, children?: ReactNode): ReactNode {
    if (options) return options;
    // children is auto-filled to empty array even if it is not set explicitly in jsx
    if (Array.isArray(children) && children.length > 0) return children;
    let ret: ReactNode | undefined;
    switch (field) {
        default:
        case 'extends':
        case 'type':
        case 'values': return (data as LValue | LStructuralFeature | LClass).validTargetsJSX; break;
    }
    console.log('msel ret opt', {ret, data, vt: (data as any).validTargetJSX, field})
    return ret;
}
    /*
    export function getSelectOptions_raw(data: LPointerTargetable, field: string): MultiSelectOptGroup[] {
        if (!data) return [];
        // console.log("select options", {data, field, children, options});
        let returns: LClass[] | undefined;
        let primitives: LClass[] | undefined;
        let classes: LClass[] | undefined;
        let enumerators: LEnumerator[] | undefined;
        let objects: (LObject | LEnumLiteral)[] | undefined;
        let m2classname: string | undefined;
        let hasPrimitives: boolean = false;
        let hasReturnTypes: boolean = false;
        let cname = data.className;
        if (!field) switch(cname) {
            case 'DAttribute':  case 'DReference': case 'DOperation': case 'DParameter': field = 'type'; break;
            case 'DValue': field = 'values'; break;
            case 'DClass': field = 'extends'; break;
        }
    /*
        let newmode = true;
        if (newmode){
            switch(field){
                case 'extends': case 'type': return data.validTargetOptions;
            }
            return [];
        }* /
        switch(field) {
            case 'type':
                let model = (data as LStructuralFeature).model;
                switch (cname) {
                    default: break;
                    case 'DAttribute': enumerators = model.enums; hasPrimitives = true; break;
                    case 'DReference': classes = model.classes; break;
                    case 'DOperation': classes = model.classes; enumerators = model.enums; hasPrimitives = hasReturnTypes = true; break;
                    case 'DParameter': classes = model.classes; enumerators = model.enums; hasPrimitives = true; break;
                }
                break;
            case 'value': case 'values':
                if (cname !== 'DValue') break;
                objects = (data as LValue).validTargets;
                /*
                let m2: LReference | LAttribute | undefined = (data as LValue).instanceof;
                if (!m2) {
                    objects = (data as LValue).model.allSubObjects;
                    break;
                }
                let dm2 = m2.__raw;
                if (dm2.className === "DAttribute") break;
                let type: LClass = m2.type as LClass;
                if (!type) break;
                m2classname = type.name;
                let m1modelid = data.model.id;
                objects = (type.allInstances || []).filter( o => o.model.id === m1modelid);* /
        }
        let state: DState | undefined;
        // todo: all this stuff might be better moved in mapstatetoprops, or the select list won't update properly.
        if (hasPrimitives) {
            if (!state) state = store.getState();
            primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
        }
        if (hasReturnTypes) {
            if (!state) state = store.getState();
            returns = LPointerTargetable.fromPointer(state.returnTypes);
        }

        // console.log("select options", {data, field, returns, primitives, classes, enumerators});

        let ret:MultiSelectOptGroup[] = [];
        if (returns && returns.length) ret.push({label: 'Defaults', options: returns.map((r, i)=>({value: r.id, label:r.name}))});
        if (primitives && primitives.length) ret.push({label: 'Primitives', options: primitives.map((r, i)=>({value: r.id, label:r.name}))});
        if (enumerators && enumerators.length) ret.push({label: 'Enumerators', options: enumerators.map((r, i)=>({value: r.id, label:r.name}))});
        if (classes && classes.length) ret.push({label: 'Classes#', options: classes.map((r, i)=>({value: r.id, label:r.name}))});
        if (objects && objects.length) ret.push({label: m2classname ? 'Instances of ' + m2classname : "All objects", options:
                [{value: undefined as any, label: '_empty_'}, ...objects.map((r, i)=>({value: r.id, label:r.name}))]});
        return ret;
    }
    export function getSelectOptions(data: LPointerTargetable, field: string, options: ReactNode, children?: ReactNode): ReactNode {
        if (options) return options;
        // children is auto-filled to empty array even if it is not set explicitly in jsx
        if (Array.isArray(children) && children.length > 0) return children;
        let ret: ReactNode | undefined;
        let newmode = true;
        if (newmode){
            switch(field){
                case 'extends': case 'type': ret = (data as any).validTargetJSX; break;
            }
            console.log('msel ret opt', {ret, data, vt: (data as any).validTargetJSX, field})
        }
        if (ret) return ret;
        let opts = getSelectOptions_raw(data, field); // old to remove?
        return UX.options(opts); // selectOptionsToJSX(opts);
    }
    function selectOptionsToJSX(ret: MultiSelectOptGroup[]): ReactNode{
        return(
            <>{
                ret.map(optgrp => <optgroup label={optgrp.label}>{
                    optgrp.options.map((e, i) => <option key={i} value={e.value}>{e.label}</option>)
                }</optgroup>).filter(e=>!!e)
            }</>);
    }*/

export function InputComponent(props: AllProps) {
    const data = props.data;
    const getter = props.getter;
    const setter = props.setter;
    const field: string = props.field as string;
    const oldValue: PrimitiveType | PrimitiveType[] | LPointerTargetable = (getter) ? getter(data, field) : (data ? data[field] : undefined); // !== undefined); ? data[field] : 'undefined'
    let [value, setValue] = useStateIfMounted<PrimitiveType | PrimitiveType[] | LPointerTargetable>(oldValue);

    const [isTouched, setIsTouched] = useStateIfMounted(false);
    const inputRef = useRef<Element | null>(null);
    if (props.tag === 'select') value = oldValue; // select does not use state.
    let serializeValue = (val: LPointerTargetable | PrimitiveType | PrimitiveType[], maxDepth=1, currDepth = 0): string | PrimitiveType | PrimitiveType[] => {
        if (Array.isArray(val)) {
            if (props.isMultiSelect && currDepth < maxDepth) {
                // return val.map(e => serializeValue(e, maxDepth, currDepth + 1)) as PrimitiveType[];
                return val.map(e => (e as any)?.id||e) as PrimitiveType[];
            }
            if (currDepth < maxDepth) return serializeValue(val[0], maxDepth, currDepth + 1);
            else return undefined;
        }
        return (val as LPointerTargetable)?.id || (val as any);
    };

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

    let type = (props.type) ? props.type : 'text';
    let subtype: string = type;
    switch (type) {
        case 'toggle': type = 'checkbox'; subtype = 'switch'; break;
        case 'checkbox3': case 'switch': type = 'checkbox'; break;
        case 'slider': type = 'range'; break;
    }
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
            let target = evt.target.checked;
            if (subtype === 'checkbox3' && !value) { target = undefined as any; }
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
    const confirmValue = (evt: { target: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement }|undefined, val?: PrimitiveType|PrimitiveType[]) => {
        if (readOnly || isBoolean) return;
        const newValue = val || (evt && getValueFromEvent(evt));
        const oldValue = getter ? getter(data, field) : data[field];
        console.log("onChange confirm", {evt, newValue, oldValue, data, field, changed: valueDidChange(newValue, oldValue), readOnly, isBoolean, setter, nnv:serializeValue(newValue)});
        if (valueDidChange(newValue, oldValue)){
            if (setter) setter(newValue as any, data, field);
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
        className: [props.inputClassName||'', css].join(' '),
        style: (props.inputStyle || {}),
        spellCheck: (props as any).spellCkeck || false, readOnly, disabled: readOnly, type,
        value: serializeValue(value),
        checked,
        onChange, onBlur, onKeyDown} // key:`${field}.${data?.id}`
    if (!inputProps.style.cursor && cursor === 'not-allowed') { inputProps.style.cursor = cursor; }
    switch(subtype){
        case 'checkbox3': case 'switch': case 'slider': inputProps.className += ' ' + subtype + (oldValue===undefined?'undetermined':''); break;
        default: break;
    }

    let input: ReactNode;
    let rootprops: GObject = {className: otherprops.className||'', style: otherprops.style||{}};
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

    let wrap = true;
    if (autosize) rootprops.className = (rootprops.className || '') + ' autosize-input-container';
    else if (!label && !postlabel && !props.isMultiSelect) {
        if (rootprops.className) inputProps.className = rootprops.className + ' ' + inputProps.className;
        if (rootprops.style) U.objectMergeInPlace(inputProps.style, rootprops.style);
        inputProps = {...rootprops, ...inputProps};
        wrap = false;
    }

    switch (props.tag){
        case "textarea": input = <textarea {...inputProps}>{inputProps.value}</textarea>; break;
        case "select":
            if (props.isMultiSelect){
                let options = props.options as any || getSelectOptions_raw(data, field);
                let multiOptions = options as MultiSelectOptGroup[];
                console.log('setting multiselect pre', {multiOptions, value, ivalue: inputProps.value, options, data, df:data[field], field});
                let valuesMap = U.objectFromArrayValues((inputProps.value||[]));
                delete valuesMap[undefined as any];
                inputProps.value = [];
                for (let optgrp of multiOptions) for (let opt of optgrp.options) if (valuesMap[opt.value]) inputProps.value.push(opt);
                // rootprops.className = (rootprops.className || '') + ' clearfix';
                let old = {...rootprops};
                rootprops.onMouseMove = (e:any) => { UX.stopEvt(e); old.onMouseMove?.(); console.log('multiselect onmove'); };
                /*rootprops.onMouseDown = (e:any) => { UX.stopEvt(e); old.onMouseDown?.(); console.log('multiselect onMouseDown'); };
                rootprops.onMouseUp = (e:any) => { UX.stopEvt(e); old.onMouseUp?.(); console.log('multiselect onMouseUp'); };
                rootprops.onClick = (e:any) => { UX.stopEvt(e); old.onClick?.(); console.log('multiselect onClick'); };
                rootprops.onMouseLeave = (e:any) => { UX.stopEvt(e); old.onMouseLeave?.(); console.log('multiselect onMouseLeave'); };*/
                // @ts-ignore
                input = <MultiSelect {...inputProps} isMulti={true} options={options}
                    onChange={((v0: MultiSelectOption[]) => {
                        let v = v0.map(v => v.value);
                        confirmValue(undefined, v);
                        console.log('setting multiselect onchange', {v, v0, value, ivalue: inputProps.value, options});
                    }) as any}
                />;
            }
            else {
                let options = getSelectOptions(data, field, props.options, props.children);
                input = <select {...inputProps}>{options}</select>;
            }
            break;
        case null: case undefined: case "": case "input": input = <input {...inputProps} />; break;
        default:
            inputProps.contentEditable = inputProps.contentEditable !== false;
            input = React.createElement(props.tag, inputProps, props.children); break;
    }
    if (!wrap) return input;

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

export interface InputOwnProps {
    data?: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field?: string;
    // DANGER: use the data provided in parameters instead of using js closure, as the proxy accessed from using closure won't be updated in rerenders.
    getter?: (data: any/*LPointerTargetable*/, field: string) => string | boolean | undefined;
    setter?: (value: string|boolean, data: any, field: string) => void;
    label?: string | ReactNode;
    postlabel?: string | ReactNode;
    jsxLabel?: ReactNode; // @deprecated, use label
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|'number'|'password'
        |'radio'|'range'|'tel'|'text'|'time'|'url'|'week'
        |'checkbox3'|'toggle'|'switch'|'slider';
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
    setter?: (value: string/*|PrimitiveType[]*/, data: any, field: string) => void; // parent select has value: string | boolean
    isMultiSelect?: boolean;
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
    // @ts-ignore
    connect<StateProps, DispatchProps, RealOwnProps, DState>(InputMapStateToProps, mapDispatchToProps)(InputComponent);


// export function Input(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'input' as any; }
export function Input(props: InputOwnProps): ReactElement {
    // @ts-ignore
    return <InputConnected {...props as any}>{props.children}</InputConnected>;
}

// export function TextArea(props: InputOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'textarea' as any; }
export function TextArea(props: InputOwnProps, c: any): ReactElement {
    // @ts-ignore
    return <InputConnected {...{...props, tag:"textarea"} as any}>{props.children||c}</InputConnected>;
}
//export function Select(props: SelectOwnProps, children: (string | React.Component)[] = []): ReactElement { return 'select' as any; }
export function Select(props: SelectOwnProps, c: any): ReactElement {
    // @ts-ignore
    return <InputConnected {...{...props, tag:"select"} as any}>{props.children||c}</InputConnected>;
}
export const Edit = Input;

// @ts-ignore
InputComponent.cname = 'InputComponent';
// @ts-ignore
InputConnected.cname = 'InputConnected';
Input.cname = 'Input';
TextArea.cname = 'TextArea';
Select.cname = 'Select';
Edit.cname = 'Edit';

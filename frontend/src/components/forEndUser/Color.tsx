import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DState} from '../../redux/store';
import {Defaults, DPointerTargetable, GObject, LPointerTargetable, Overlap, Pointer} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './color.scss';


function ColorComponent(props: AllProps) {
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);

    if (!props.data && (!props.getter || !props.setter)) return(<></>);

    const getter = props.getter || (() => props.data[props.field]);
    const setter = props.setter || ((value:string) => { props.data[props.field] = value; });
    //const field = props.field;
    // const oldValue = (!data) ? undefined : (getter) ? getter(data) : data[field]; // !== undefined); ? data[field] : 'undefined'
    const readOnly = (props.readOnly !== undefined) ? props.readOnly : props.debugmodee !== 'true' && Defaults.check(props.data.id);
    const type = (props.type) ? props.type : 'text';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: ReactNode|string|undefined = ((props.tooltip === true) ? props.data?.['__info_of__' + props.field]?.txt : props.tooltip) || '';

    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';
    let autosize: boolean = props.autosize === undefined ? false : props.autosize; // props.type==='text'
    css += autosize ? ' autosize-input' : '';

    const blur = (evt: React.FocusEvent<HTMLInputElement>) => {
        if (readOnly) return;
        const newValue = evt.target.value;
        const oldValue = getter(props.data, props.field); // !== undefined) ? data[field] : 'undefined'
        if (newValue !== oldValue) setter(newValue);
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
    let input = <input {...otherprops}
                       // key={props.data?.id + props.field}
                       className={props.inputClassName || css}
                       style={props.inputStyle}
                       spellCheck={false}
                       readOnly={readOnly}
                       type={'color'} value={getter(props.data, props.field)} onChange={blur} onBlur={blur}
    />

    // console.log("color component", {label, jsxLabel, tooltip, c:props.children})
    
    return(<label className={(props.className ? props.className : 'color-picker-root') + ' hoverable'} {...otherprops}
                  style={{display: (jsxLabel || label) ? 'flex' : 'block', cursor: tooltip ? 'help' : 'auto', ...((props as any).style || {})}}>

        {label && <label className={'my-auto'} onMouseEnter={e => setShowTooltip(true)}
                         onMouseLeave={e => setShowTooltip(false)}>{label}
        </label>}

        {jsxLabel && <label onMouseEnter={e => setShowTooltip(true)}
                            onMouseLeave={e => setShowTooltip(false)}>{jsxLabel}
        </label>}

        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{props.field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}
        {input}
        {props.canDelete && false && <label className="p-1"><button className={'content delete-color mt-2'} style={{position:'relative'}}/></label>}
        {props.children && Object.keys(props.children).length > 0 ? props.children : undefined}
        {props.childrenn && Object.keys(props.childrenn).length > 0 ? props.childrenn : undefined}
    </label>);
}

export interface InputOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    getter?: (data: LPointerTargetable, field: string) => string;
    setter?: (value: string) => void;
    label?: string;
    jsxLabel?: ReactNode;
    type?: 'checkbox'|'color'|'date'|'datetime-local'|'email'|'file'|'image'|'month'|
        'number'|'password'|'radio'|'range'|'tel'|'text'|'time'|'url'|'week';
    className?: string;
    style?: GObject;
    readOnly?: boolean;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    autosize?: boolean;
    inputClassName?: string;
    inputStyle?: GObject;
    key?: React.Key | null;
    canDelete?: boolean;
    children?: any;
    childrenn?: any;
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
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmodee = state.debug ? 'true' : 'false';
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

export const ColorConnected =
    connect<StateProps, DispatchProps, InputOwnProps, DState>(mapStateToProps, mapDispatchToProps)(ColorComponent);


export function Color(props: InputOwnProps, children: ReactNode = []): ReactElement {
    // @ts-ignore children
    return <ColorConnected {...{...props, children}} />;
}

ColorComponent.cname = 'ColorComponent';
ColorConnected.cname = 'ColorConnected';
Color.cname = 'Color';

import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import {DocString, DPointerTargetable, DState, GObject, LPointerTargetable, Overlap, Pointer, Defaults} from '../../joiner';
import {useStateIfMounted} from 'use-state-if-mounted';
import './style.scss';


function TextAreaComponent(props: AllProps) {
    const data = props.data;
    const readOnly = (props.readonly !== undefined) ? props.readonly : !props.debugmode && Defaults.check(data.id);
    const field = props.field;
    const getter = props.getter;
    const setter = props.setter;
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let tooltip: string|undefined = (props.tooltip === true) ? ((data['__info_of__' + field]) ? data['__info_of__' + field].txt: '') : props.tooltip;
    tooltip = (tooltip) ? tooltip : '';
    let __value = (!data) ? 'undefined' : ((getter) ? getter(data, field) : (data[field] !== undefined) ? data[field] : 'undefined');
    const [value, setValue] = useStateIfMounted(__value);
    const [isTouched, setIsTouched] = useStateIfMounted(false);
    const [showTooltip, setShowTooltip] = useStateIfMounted(false);

    if (!data) return(<></>);
    let css = 'my-auto input ';
    css += (jsxLabel || label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';


    const change = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(evt.target.value);
        setIsTouched(true);     // I'm editing the element in my local state.
    }

    const blur = (evt: React.FocusEvent<HTMLTextAreaElement>) => {
        if (readOnly) return;
        const target = evt.target.value;
        const oldValue = data && (getter ? getter(data, field) : data[field]);
        if (target !== oldValue) {
            if (setter) setter(target, data, field);
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

    return(<div style={{display: (jsxLabel || label) ? 'flex' : 'block'}} className={'p-1 w-fill'} {...otherprops}>
        <label onMouseEnter={e => setShowTooltip(true)} onMouseLeave={e => setShowTooltip(false)}
               className={`h-100 ${(label || jsxLabel) ? 'd-block' : 'd-none'}`}>
            {(label) ? label : (jsxLabel) ? jsxLabel : ''}
        </label>

        {(tooltip && showTooltip) && <div className={'my-tooltip'}>
            <b className={'text-center text-capitalize'}>{field}</b>
            <br />
            <label>{tooltip}</label>
        </div>}

        <textarea spellCheck={false} readOnly={readOnly} className={props.inputClassName || css} style={props.inputStyle}
                  onChange={change} onBlur={blur} value={value} placeholder={props.placeholder}/>
    </div>);
}

export interface TextAreaOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    getter?: <T extends LPointerTargetable>(data: T, field: DocString<"keyof T">) => string;
    setter?: <T extends LPointerTargetable>(value: string|boolean, data: T, field: DocString<"keyof T">) => void;
    jsxLabel?: ReactNode;
    readonly?: boolean;
    tooltip?: string | boolean | ReactElement;
    hidden?: boolean;
    key?: React.Key | null;
    className?: string;
    inputClassName?: string;
    style?: GObject;
    inputStyle?: GObject;
    placeholder?: string;
}

interface StateProps {
    debugmode: boolean;
    data: LPointerTargetable & GObject;
}
interface DispatchProps { }

type AllProps = Overlap<TextAreaOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: TextAreaOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.debugmode = state.debug;
    ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TextAreaConnected = connect<StateProps, DispatchProps, TextAreaOwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TextAreaComponent);

export const TextArea = (props: TextAreaOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TextAreaConnected {...{...props, children}} />;
}

TextAreaComponent.cname = 'TextAreaComponent';
TextAreaConnected.cname = 'TextAreaConnected';
TextArea.cname = 'TextArea';
export default TextArea;

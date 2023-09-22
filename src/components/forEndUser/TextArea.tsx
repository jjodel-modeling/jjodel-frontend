import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {DState,
    DPointerTargetable,
    GObject,
    LPointerTargetable,
    U,
    Overlap, Pointer} from "../../joiner";
import {SelectOwnProps} from "./Select";
import {useStateIfMounted} from "use-state-if-mounted";


function TextAreaComponent(props: AllProps) {
    const data = props.data;
    const readOnly = (props.readonly !== undefined) ? props.readonly : U.getDefaultViewsID().includes(data.id);
    const field = props.field;
    const getter = props.getter;
    const setter = props.setter;
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    let __value = (!data) ? 'undefined' : ((getter) ? getter(data) : (data[field] !== undefined) ? data[field] : 'undefined');
    const [value, setValue] = useStateIfMounted(__value);
    const [isTouched, setIsTouched] = useStateIfMounted(false);
    if (!data) return(<></>);
    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';


    const change = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        setValue(evt.target.value);
        setIsTouched(true);     // I'm editing the element in my local state.
    }

    const blur = (evt: React.FocusEvent<HTMLTextAreaElement>) => {
        if (readOnly) return;
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

    return(<div style={{display: (jsxLabel || label) ? 'flex' : 'block'}} className={'p-1'} {...otherprops}>
        {(label && !jsxLabel) && <label className={'my-auto'}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'}>
            {jsxLabel}
        </label>}
        <textarea spellCheck={false} readOnly={readOnly} className={props.inputClassName || css} style={props.inputStyle}
                  onChange={change} onBlur={blur} value={value} />
    </div>);
}

export interface TextAreaOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    getter?: (data: LPointerTargetable) => string;
    setter?: (value: string|boolean) => void;
    jsxLabel?: ReactNode;
    readonly?: boolean;
    tooltip?: string;
    hidden?: boolean;
    key?: React.Key | null;
    className?: string;
    inputClassName?: string;
    style?: GObject;
    inputStyle?: GObject;
}

interface StateProps { data: LPointerTargetable & GObject; }
interface DispatchProps { }

type AllProps = Overlap<TextAreaOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: DState, ownProps: TextAreaOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
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

TextAreaComponent.cname = "TextAreaComponent";
TextAreaConnected.cname = "TextAreaConnected";
TextArea.cname = "TextArea";
export default TextArea;

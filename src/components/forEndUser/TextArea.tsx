import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {DState,
    DPointerTargetable,
    GObject,
    LPointerTargetable,
    U,
    Overlap, Pointer} from "../../joiner";
import {SelectOwnProps} from "./Select";


function TextAreaComponent(props: AllProps) {
    const data = props.data;
    if(!data) return(<></>);
    const readOnly = props.readonly || U.getDefaultViewsID().includes(data.id);
    const field = props.field;
    const value = (data[field] !== undefined) ? data[field] : 'undefined';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    const tooltip = props.tooltip;
    let css = 'my-auto input ';
    css += (jsxLabel) ? 'ms-1' : (label) ? 'ms-auto' : '';
    css += (props.hidden) ? ' hidden-input' : '';

    const change = (evt: React.ChangeEvent<HTMLTextAreaElement>) => {
        const target: string = evt.target.value;
        data[field] = target;
    }

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.hidden;

    return(<div {...otherprops} style={{display: (jsxLabel || label) ? 'flex' : 'block'}} className={'p-1'}>
        {(label && !jsxLabel) && <label className={'my-auto'}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'}>
            {jsxLabel}
        </label>}
        <textarea spellCheck={false} readOnly={readOnly} className={css}
               onChange={change} value={value} />
    </div>);
}
export interface TextAreaOwnProps {
    data: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    readonly?: boolean;
    tooltip?: string;
    hidden?: boolean;
    key?: React.Key | null;
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

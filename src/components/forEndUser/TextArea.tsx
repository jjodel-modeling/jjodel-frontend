import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {DPointerTargetable, GObject, LPointerTargetable, Pointer} from "../../joiner";


function TextAreaComponent(props: AllProps) {
    const data = props.data;
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

    return(<div style={{display: (jsxLabel || label) ? 'flex' : 'block'}} className={'p-1'} key={props.key}>
        {(label && !jsxLabel) && <label className={'my-auto'}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'}>
            {jsxLabel}
        </label>}
        <textarea spellCheck={false} readOnly={props.readonly} className={css}
               onChange={change} value={value} />
    </div>);
}
export interface TextAreaOwnProps {
    obj: LPointerTargetable | DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
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
type AllProps = TextAreaOwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: TextAreaOwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TextAreaConnected = connect<StateProps, DispatchProps, TextAreaOwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TextAreaComponent);

export const TextArea = (props: TextAreaOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TextAreaConnected {...{...props, children}} />;
}
export default TextArea;

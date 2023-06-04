import React, {Dispatch, LegacyRef, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {
    LPointerTargetable,
    GObject,
    Pointer,
    LEnumerator,
    Selectors,
    LModelElement,
    Overlap,
    U,
    Input
} from "../../joiner";
import type {LClass, DPointerTargetable} from "../../joiner";
import toast, {Toaster} from "react-hot-toast";


function SelectComponent(props: AllProps) {
    const data = props.data;
    if(!data) return(<></>);
    const field = props.field;
    const readOnly = props.readonly || U.getDefaultViewsID().includes(data.id);
    const value = (data[field]?.id) ? data[field].id : 'undefined';
    const label: string|undefined = props.label;
    const jsxLabel: ReactNode|undefined = props.jsxLabel;
    const tooltip = props.tooltip;
    let css = 'my-auto select ';
    css += (jsxLabel) ? 'ms-1' : 'ms-auto';
    css += (props.hidden) ? ' hidden-input' : '';

    const notify = () => toast((t: GObject) => (
        <div onClick={() => toast.dismiss(t.id)}>
            <label className={'ms-1'}>{tooltip}</label>
        </div>
    ));

    function SelectChange(evt: React.ChangeEvent<HTMLSelectElement>) {
        if(readOnly) return;
        const target = evt.target.value;
        console.log("setting:", {data, field, target});
        data[field] = target;
    }

    let hasReturn = false; let hasPrimitive = false; let hasClasses = false; let hasEnumerators = false;
    if(field === 'type') {
        switch (data.className) {
            case 'DAttribute': hasPrimitive = hasEnumerators = true; break;
            case 'DReference': hasClasses = true; break;
            case 'DOperation': hasPrimitive = hasClasses = hasEnumerators = hasReturn = true; break;
            case 'DParameter': hasPrimitive = hasClasses = hasEnumerators = true; break;
        }
    }
    const returns = props.returns;
    const primitives = props.primitives;
    const classes: LClass[] = data.model.classes;
    const enumerators: LEnumerator[] = data.model.enumerators;

    const otherprops: GObject = {...props};
    delete otherprops.data;
    delete otherprops.getter;
    delete otherprops.setter;
    delete otherprops.jsxLabel;
    delete otherprops.primitives;
    delete otherprops.returns;
    delete otherprops.hidden;
    // todo per giordano: questa cosa non mi setta props.ref.current correttamente, puoi aggiustarlo tu? forse conosci meglio refs
    return(<div {...otherprops} ref={props.ref as any} className={'d-flex p-1'} >
        {(label && !jsxLabel) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {jsxLabel}
        </label>}
        <select className={css} value={value} onChange={SelectChange}>
            {(hasReturn && returns.length > 0) && <optgroup label={'Defaults'}>
                {returns.map((returnType, i) => {
                    return <option key={i} value={returnType.id}>{returnType.name}</option>
                })}
            </optgroup>}
            {(hasPrimitive && primitives) && <optgroup label={'Primitives'}>
                {primitives.map((primitive, i) => {
                    return <option key={i} value={primitive.id}>{primitive.name}</option>
                })}
            </optgroup>}
            {(hasEnumerators && enumerators.length > 0) && <optgroup label={'Enumerators'}>
                {enumerators.map((enumerator, i) => {
                    return <option key={i} value={enumerator.id}>{enumerator.name}</option>
                })}
            </optgroup>}
            {(hasClasses && classes.length > 0) && <optgroup label={'Classes'}>
                {classes.map((classifier, i) => {
                    return <option key={i} value={classifier.id}>{classifier.name}</option>
                })}
            </optgroup>}
            {props.options}
        </select>
        {(tooltip) && <Toaster position={'bottom-center'} />}
    </div>);
}
export interface SelectOwnProps {
    data?: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    tooltip?: string;
    hidden?: boolean;
    options?: JSX.Element;
    key?: React.Key | null;
    ref?: React.RefObject<HTMLElement> | LegacyRef<HTMLElement>;
    readonly?: boolean;
}
interface StateProps {
    data: LPointerTargetable & GObject;
    primitives: LClass[];
    returns: LClass[]; }
interface DispatchProps { }

type AllProps = Overlap<SelectOwnProps, Overlap<StateProps, DispatchProps>>;


function mapStateToProps(state: IStore, ownProps: SelectOwnProps): StateProps {
    const ret: StateProps = {} as any;
    if (!ownProps.data) return ret;
    const pointer: Pointer = typeof ownProps.data === 'string' ? ownProps.data : ownProps.data.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    ret.primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    ret.returns = LPointerTargetable.fromPointer(state.returnTypes);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const SelectConnected = connect<StateProps, DispatchProps, SelectOwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(SelectComponent);

export const Select = (props: SelectOwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <SelectConnected {...{...props, children}} />;
}
export default Select;

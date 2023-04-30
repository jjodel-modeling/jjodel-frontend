import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {LPointerTargetable, GObject, Pointer, LEnumerator, Selectors, LModelElement} from "../../joiner";
import type {LClass, DPointerTargetable} from "../../joiner";
import toast, {Toaster} from "react-hot-toast";


function SelectComponent(props: AllProps) {
    const data = props.data;
    if(!data) return(<></>);
    const field = props.field;
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

    const change = (evt: React.ChangeEvent<HTMLSelectElement>) => {
        const target = evt.target.value;
        data[field] = target;
    }

    let hasReturn = false; let hasPrimitive = false; let hasClasses = false; let hasEnumerators = false;
    if(field === 'type') {
        switch (data.className) {
            case 'DAttribute': hasPrimitive = true; hasEnumerators = true; break;
            case 'DReference': hasClasses = true; break;
            case 'DOperation': hasReturn = true; break;
            case 'DParameter': hasPrimitive = true; hasClasses = true; hasEnumerators = true; break;
        }
    }
    const returns = props.returns;
    const primitives = props.primitives;
    const classes: LClass[] = data.model.classes;
    const enumerators: LEnumerator[] = data.model.enumerators;

    return(<div className={'d-flex p-1'}>
        {(label && !jsxLabel) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {label}
        </label>}
        {(jsxLabel && !label) && <label className={'my-auto'} onClick={() => {if(tooltip) notify()}}>
            {jsxLabel}
        </label>}
        <select className={css} value={value} onChange={change}>
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
        </select>
        {(tooltip) && <Toaster position={'bottom-center'} />}
    </div>);
}
interface OwnProps {
    obj: DPointerTargetable | Pointer<DPointerTargetable, 1, 1, LPointerTargetable>;
    field: string;
    label?: string;
    jsxLabel?: ReactNode;
    tooltip?: string;
    hidden?: boolean;
}
interface StateProps { data: LPointerTargetable & GObject; primitives: LClass[]; returns: LClass[]; }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer: Pointer = typeof ownProps.obj === 'string' ? ownProps.obj : ownProps.obj.id;
    ret.data = LPointerTargetable.fromPointer(pointer);
    ret.primitives = LPointerTargetable.fromPointer(state.primitiveTypes);
    ret.returns = LPointerTargetable.fromPointer(state.returnTypes);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const SelectConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(SelectComponent);

export const Select = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <SelectConnected {...{...props, childrens}} />;
}
export default Select;

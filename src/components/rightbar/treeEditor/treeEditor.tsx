import React, {Dispatch, ReactElement, ReactNode} from "react";
import {connect} from "react-redux";
import {IStore} from "../../../redux/store";
import {
    DPointerTargetable,
    DViewElement,
    GObject, Input,
    LModelElement,
    LPointerTargetable,
    LViewElement,
    Pointer, Select, SetRootFieldAction
} from "../../../joiner";
import Editor from "@monaco-editor/react";
import {useStateIfMounted} from "use-state-if-mounted";
import Structure from "../structureEditor/Structure";

interface Props {data: LModelElement}
function Child(props: Props) {
    const data = props.data;
    const classname = data.className.slice(1).toLowerCase();
    const css = 'name-' + classname;

    const click = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const selected = { node: undefined, view: undefined, modelElement: data.id };
        SetRootFieldAction.new('_lastSelected', selected);
    }

    return <div className={'mt-1 ms-3'}>
        <div className={'d-flex'}>
            <button className={'btn-white'} onClick={click}>
                <i className={'bi bi-eye'}></i>
            </button>
            <label className={css + ' ms-1 text-capitalize my-auto'}>{classname}:</label>
            <label className={'ms-1 my-auto'}>{((data as GObject).name) ? (data as GObject).name : 'unnamed'}</label>
        </div>
        {data.childrens.map((child, i) => {
            return <Child key={i} data={child} />
        })}
    </div>
}

function TreeEditorComponent(props: AllProps) {
    const data = props.data;
    if(data) {
        const classname = data.className.slice(1).toLowerCase();
        const css = 'name-' + classname;
        return <div className={'p-2'}>
            <div className={'d-flex'}>
                <button className={'btn-white'}>
                    <i className={'bi bi-eye-slash'}></i>
                </button>
                <label className={css + ' ms-1 text-capitalize my-auto'}>{classname}:</label>
                <label className={'ms-1 my-auto'}>{((data as GObject).name) ? (data as GObject).name : 'unnamed'}</label>
            </div>
            {data.childrens.map((child, i) => {
                return <Child key={i} data={child} />
            })}
        </div>
    } else return <></>
}
interface OwnProps { }
interface StateProps { data: LModelElement|undefined }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state._lastSelected?.modelElement;
    if(pointer) ret.data = LModelElement.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TreeEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(TreeEditorComponent);

export const TreeEditor = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <TreeEditorConnected {...{...props, childrens}} />;
}
export default TreeEditor;

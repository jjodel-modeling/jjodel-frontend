import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {
    DState,
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
    const css = classname + '-name';

    const click = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const selected = { node: undefined, view: undefined, modelElement: data.id };
        SetRootFieldAction.new('_lastSelected', selected);
    }
    // I got problems with operation's exception
    return <div className={'mt-1 ms-3'}>
        <div className={'d-flex'}>
            <button className={'btn'} onClick={click}>
                <i className={'bi bi-eye'}></i>
            </button>
            <label className={css + ' ms-1 text-capitalize my-auto'}>{classname}:</label>
            <label className={'ms-1 my-auto'}>{((data as GObject).name) ? (data as GObject).name : 'unnamed'}</label>
        </div>
        {data.className !== 'DOperation' && data.children.map((child, i) => {
            return <Child key={i} data={child} />
        })}
    </div>
}

function TreeEditorComponent(props: AllProps) {
    const data = props.data;
    if(data) {
        const classname = data.className.slice(1).toLowerCase();
        const css = classname + '-name';
        // I got problems with operation's exception
        return <div className={'p-2'}>
            <div className={'d-flex'}>
                <button className={'btn'}>
                    <i className={'bi bi-eye-slash'}></i>
                </button>
                <label className={css + ' ms-1 text-capitalize my-auto'}>{classname}:</label>
                <label className={'ms-1 my-auto'}>{((data as GObject).name) ? (data as GObject).name : 'unnamed'}</label>
            </div>
            {data.className !== 'DOperation' && data.children.map((child, i) => {
                return <Child key={i} data={child} />
            })}
        </div>
    } else return <></>
}
interface OwnProps { }
interface StateProps { data: LModelElement|undefined }
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const pointer = state._lastSelected?.modelElement;
    if(pointer) ret.data = LModelElement.fromPointer(pointer);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const TreeEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(TreeEditorComponent);

export const TreeEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <TreeEditorConnected {...{...props, children}} />;
}
export default TreeEditor;

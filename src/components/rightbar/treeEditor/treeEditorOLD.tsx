import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {DState, DUser, GObject, LGraphElement, LModelElement, Selectors, SetRootFieldAction} from "../../../joiner";

interface Props {data: LModelElement}
function Child(props: Props) {
    const data = props.data;
    const classname = data.className.slice(1).toLowerCase();
    const css = classname + '-name';

    const click = (evt: React.MouseEvent<HTMLButtonElement>) => {
        const nodeid = data.node?.id;
        if(!nodeid) return;
        SetRootFieldAction.new(`selected.${DUser.current}`, nodeid, '', true);
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
    const node = props.node;
    const data = node?.model;
    if(!data) return(<></>);
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

}
interface OwnProps { }
interface StateProps {
    node: LGraphElement|null;
}
interface DispatchProps { }
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const nodeid = state._lastSelected?.node;
    if(nodeid) ret.node = LGraphElement.fromPointer(nodeid);
    else ret.node = null;
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

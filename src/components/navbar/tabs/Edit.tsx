import React, {Dispatch, ReactElement} from 'react';
import {DState, statehistory} from "../../../redux/store";
import {connect} from "react-redux";
import {DUser, GObject, RedoAction, UndoAction} from "../../../joiner";
import {FakeStateProps} from "../../../joiner/types";

function EditComponent(props: AllProps) {
    const undo = props.undo;
    const redo = props.redo;

    const doUndo = (index: number) => {
        UndoAction.new(index + 1);
    }
    const doRedo = (index: number) => {
        RedoAction.new(index + 1);
    }

    return(<li className={'nav-item dropdown'}>
        <div tabIndex={-1} className={'dropdown-toggle'} data-bs-toggle={'dropdown'}>Edit</div>
        <ul className={'dropdown-menu'}>
            <li tabIndex={-1} onClick={e => doUndo(0)} className={'dropdown-item'}>Undo ({undo.length})</li>
            <li tabIndex={-1} onClick={e => doRedo(0)} className={'dropdown-item'}>Redo ({redo.length})</li>
        </ul>
    </li>);
}

interface OwnProps {}
interface StateProps {undo: GObject<'delta'>[], redo: GObject<'delta'>[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    // ret.undo = statehistory[DUser.current]?.undoable || [];
    // ret.redo = statehistory[DUser.current]?.redoable || [];
    ret.undo = statehistory[DUser.current].undoable;
    ret.redo = statehistory[DUser.current].redoable;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const EditConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(EditComponent);

export const Edit = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <EditConnected {...{...props, children}} />;
}
export default Edit;






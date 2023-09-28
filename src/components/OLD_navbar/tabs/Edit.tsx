import React, {Dispatch, ReactElement} from 'react';
import {DState, statehistory} from "../../../redux/store";
import {connect} from "react-redux";
import {DUser, GObject, RedoAction, UndoAction} from "../../../joiner";

function EditComponent(props: AllProps) {
    const setPath = props.setPath;
    const undo = props.undo;
    const redo = props.redo;

    const doUndo = (index: number) => {
        UndoAction.new(index + 1);
    }
    const doRedo = (index: number) => {
        RedoAction.new(index + 1);
    }

    return(<div className={'tab'} style={{marginLeft: '3%'}}>
        <div tabIndex={-1} onClick={e => doUndo(0)} className={'tab-item'}>Undo ({undo.length})</div>
        <div tabIndex={-1} onClick={e => doRedo(0)} className={'tab-item'}>Redo ({redo.length})</div>
        <div tabIndex={-1} onClick={e => setPath('')}  className={'text-danger tab-item'}>Close</div>
    </div>);
}

interface OwnProps {setPath: (path: string) => void}
interface StateProps {undo: GObject<'delta'>[], redo: GObject<'delta'>[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
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






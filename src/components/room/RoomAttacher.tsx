import type {Dictionary, GObject, Pointer} from "../../joiner";
import {Action, DUser, Selectors, SetRootFieldAction, store} from "../../joiner";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {doc, onSnapshot} from "@firebase/firestore";
import {Firebase} from "../../firebase";
import {useStateIfMounted} from "use-state-if-mounted";

function RoomAttacherComponent(props: AllProps) {
    const room = props.room;
    const [actions, setActions] = useStateIfMounted<Dictionary<Pointer, boolean>>({});
    const [roomSize, setRoomSize] = useStateIfMounted<number>(0);

    if(!room) return(<></>);

    onSnapshot(doc(Firebase.db, 'rooms', room), (doc: GObject) => {
        if(!Selectors.getRoom()) return;
        const data = doc.data(); if(!data) return;
        setRoomSize(data.actions.length);
        for(let action of data.actions.filter((item: GObject) => !actions[item.id])) {
            if(action.token === DUser.token) continue;
            const receivedAction = Action.fromJson(action);
            receivedAction.hasFired = receivedAction.hasFired - 1;
            if(action.token !== DUser.token) receivedAction.fire();
            actions[action.id] = true; setActions(actions);
        }
    }, (doc: GObject) => {
        alert('error');
        SetRootFieldAction.new('room', '', '', false);
    });

    if(roomSize > 50) {
        Firebase.edit(room, 'actions', []).then();
        Firebase.edit(room, 'state', JSON.stringify(store.getState())).then();
    }

    return(<div className={'border bg-white p-3 round m-1'} style={{bottom: 0, right: 0, position: 'absolute', zIndex: 999}}>
        <b>{roomSize}</b> Actions
    </div>);
}
interface OwnProps {}
interface StateProps {room: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.room = state.room;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const RoomAttacherConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RoomAttacherComponent);

export const RoomAttacher = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <RoomAttacherConnected {...{...props, children}} />;
}

export default RoomAttacher;

import type {Dictionary, GObject, Pointer} from "../../joiner";
import {Action, DUser, Selectors, SetRootFieldAction, store, U} from "../../joiner";
import React, {Dispatch, ReactElement, useEffect} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {doc, onSnapshot} from "@firebase/firestore";
import {Firebase} from "../../firebase";
import {useStateIfMounted} from "use-state-if-mounted";

const ROOM_SIZE_LIMIT = 100;
function RoomAttacherComponent(props: AllProps) {
    const room = props.room;
    const [actions, setActions] = useStateIfMounted<Dictionary<Pointer, boolean>>({});
    const [roomSize, setRoomSize] = useStateIfMounted<number>(0);

    const cleaner = async (): Promise<void> => {
        if(roomSize > ROOM_SIZE_LIMIT) {
            SetRootFieldAction.new('isCleaning', true, '');
            await Firebase.edit(room, 'state', JSON.stringify(store.getState()));
            await Firebase.edit(room, 'actions', []);
            SetRootFieldAction.new('isCleaning', false, '');
        }
    }

    useEffect(() => {
        cleaner().then(() => console.log(`Room ${room} cleaned.`));
    }, [roomSize])

    if(!room) return(<></>);

    onSnapshot(doc(Firebase.db, 'rooms', room), (doc: GObject) => {
        if(!Selectors.getRoom()) return;
        const data = doc.data(); if(!data) return;
        setRoomSize(data.actions.length);
        for(let action of data.actions.filter((item: GObject) => !actions[item.id])) {
            const receivedAction = Action.fromJson(action);
            if(action.token === DUser.token) continue;
            receivedAction.hasFired = receivedAction.hasFired - 1;
            receivedAction.fire();
            actions[action.id] = true; setActions(actions);
        }
    }, (doc: GObject) => {
        alert('error');
        SetRootFieldAction.new('room', '', '', false);
    });


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

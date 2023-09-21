import type {Dictionary, GObject, Pointer} from "../../joiner";
import React, {Dispatch, ReactElement} from "react";
import {useStateIfMounted} from "use-state-if-mounted";
import IotEngine from "./IotEngine";
import {connect} from "react-redux";
import {doc, onSnapshot} from "@firebase/firestore";
import {Firebase} from "../../firebase";
import {Action, DUser, Selectors, SetRootFieldAction, DState, U, } from "../../joiner";

const ROOM_SIZE_LIMIT = 200;
function RoomAttacherComponent(props: AllProps) {
    const room = props.room;
    const [actions, setActions] = useStateIfMounted<Dictionary<Pointer, boolean>>({});
    const [roomSize, setRoomSize] = useStateIfMounted<number>(0);
    const [error, setError] = useStateIfMounted<boolean>(false);
    const [iot, setIot] = useStateIfMounted<boolean|null>(null);
    const [iotData, setIotData] = useStateIfMounted<GObject>({});

    if(!room) return(<></>);
    onSnapshot(doc(Firebase.db, 'rooms', room),
        (doc: GObject) => {
            if(!Selectors.getRoom()) return;
            const data = doc.data(); if(!data) return;
            setRoomSize(data.actions.length);
            /*
            if(!U.deepEqual(iotData, data.iotData)) setIotData(data.iotData);
            if(iot === null) {
                setIot(data.iot);
                SetRootFieldAction.new('iot', data.iot, '', false);
            }
            */
            for(let action of data.actions.filter((item: GObject) => !actions[item.id])) {
                const receivedAction = Action.fromJson(action);
                if(action.token === DUser.token) continue;
                console.log('FB: Executing Action', action);
                receivedAction.hasFired = receivedAction.hasFired - 1;
                receivedAction.fire();
                actions[action.id] = true; setActions(actions);
            }
        },
        (doc: GObject) => {setError(true)},
        () => {}
    );
    return(<div style={{bottom: 10, right: 10}} className={'p-1 bg-white border position-absolute'}>
        {roomSize}
    </div>);
}
interface OwnProps {}
interface StateProps {room: string}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    ret.room = state.room;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const RoomAttacherConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(RoomAttacherComponent);

export const RoomAttacher = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <RoomAttacherConnected {...{...props, children}} />;
}

export default RoomAttacher;

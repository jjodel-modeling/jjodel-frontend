import type {Dictionary, GObject, Pointer} from "../../joiner";
import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {doc, onSnapshot} from "@firebase/firestore";
import {Firebase} from "../../firebase";
import {Action, DUser, Selectors, SetRootFieldAction} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";

function RoomAttacherComponent(props: AllProps) {
    const room = props.room;
    const [actions, setActions] = useStateIfMounted<Dictionary<Pointer, boolean>>({});
    if(!room) return(<></>);

    onSnapshot(doc(Firebase.db, 'rooms', room), (doc: GObject) => {
        if(!Selectors.getRoom()) return;
        const data = doc.data();
        if(!data) return;
        for(let action of data.actions.filter((item: GObject) => !actions[item.id])) {
            if(action.token === DUser.token) continue;
            const receivedAction = Action.fromJson(action);
            receivedAction.hasFired = receivedAction.hasFired - 1;
            receivedAction.fire();
            actions[action.id] = true; setActions(actions);
        }
    }, (doc: GObject) => {
        SetRootFieldAction.new('room', '', '', false);
    });

    return(<></>);
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

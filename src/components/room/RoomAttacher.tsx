import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import {doc, onSnapshot} from "@firebase/firestore";
import {Firebase} from "../../firebase";
import {DModel, DModelElement, Selectors} from "../../joiner";

interface ACTION {type: 'CREATE', obj: any|DModelElement}
function RoomAttacherComponent(props: AllProps) {
    const room = props.room;
    if(!room) return(<></>);

    onSnapshot(doc(Firebase.db, 'rooms', room), (result) => {
        const data = result.data();
        if(!data) return;
        const actions = data.actions;
        if(actions.length === 0 || !actions[0]) return;
        const action: ACTION = actions[0];
        const obj = action.obj;
        if(Selectors.getState().idlookup[obj.id]) return;
        switch (obj.className) {
            case 'DModel': DModel.new(obj.name, obj.instanceof, obj.isMetamodel); break;
            default: break;
        }
    });

    return(<>Hello</>);
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

export const RoomAttacher = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <RoomAttacherConnected {...{...props, childrens}} />;
}

export default RoomAttacher;

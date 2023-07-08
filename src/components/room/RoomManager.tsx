import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import '../topbar/style.scss';
import {Firebase} from "../../firebase";
import {DUser, U} from "../../joiner";

function RoomManagerComponent(props: AllProps) {
    const room = (props.room) ? props.room : '';
    const root = 'http://localhost:3000/jodel-react/';

    const create = async() => {
        const code = U.getRandomString(5);
        await Firebase.add('rooms', code, {code: code, actions: [], createdBy: DUser.current, iotData: {'sensors/1': 22}});
        window.open(root + 'room/' + code, '_blank');
    }

    const share = () => {U.alert('info', root + 'room/' + room);}

    const quit = async() => {
        await Firebase.removeRoom(room);
        window.location.replace(root);
    }

    if(!room) {
        return(<div className={'ms-auto'}>
            <label onClick={create} className={'item border round ms-1 bg-primary'}>Collaborative</label>
        </div>);
    } else {
        return(<div className={'ms-auto'}>
            <label onClick={share} className={'item border round ms-1 bg-primary'}>Share</label>
            <label onClick={quit} className={'item border round ms-1 bg-danger'}>Quit</label>
        </div>);
    }

}
interface OwnProps {room?: string}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const RoomManagerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RoomManagerComponent);

export const RoomManager = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <RoomManagerConnected {...{...props, children}} />;
}

export default RoomManager;

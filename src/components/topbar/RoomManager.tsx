import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';
import {Firebase} from "../../firebase";
import {SetRootFieldAction, U} from "../../joiner";
import {useNavigate} from "react-router-dom";

function RoomManagerComponent(props: AllProps) {
    const room = (props.room) ? props.room : '';
    const navigate = useNavigate();

    const create = async() => {
        const code = U.getRandomString(5);
        await Firebase.add('rooms', code, {code: code, actions: []});
        navigate('/jodel-react/room/' + code);
    }

    const share = () => {U.alert('info', 'http://localhost:3000/jodel-react/room/' + room);}

    const quit = () => {
        SetRootFieldAction.new('room', '', '', false);
        navigate('/jodel-react');
    }

    if(!room) {
        return(<div className={'ms-auto'}>
            <label onClick={create} className={'item border round ms-1 bg-primary'}>Create Room</label>
        </div>);
    } else {
        return(<div className={'ms-auto'}>
            <label onClick={share} className={'item border round ms-1 bg-primary'}>Share Room</label>
            <label onClick={quit} className={'item border round ms-1 bg-danger'}>Quit Room</label>
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

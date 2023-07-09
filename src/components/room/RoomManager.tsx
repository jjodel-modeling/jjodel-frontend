import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import '../topbar/style.scss';
import {Firebase} from "../../firebase";
import {DUser, U} from "../../joiner";

function RoomManagerComponent(props: AllProps) {
    const room = (props.room) ? props.room : '';
    const iot = props.iot;
    const root = 'http://localhost:3000/jodel-react/';

    const create = async(iot: boolean) => {
        const code = U.getRandomString(5);
        await Firebase.add('rooms', code, {
            code: code,
            actions: [],
            createdBy: DUser.current,
            iot: iot,
            iotData: {'sensors/1': 22, 'sensors/2': 13}}
        );
        window.open(root + 'room/' + code, '_blank');
    }

    const share = () => {U.alert('info', root + 'room/' + room);}

    const quit = async() => {
        await Firebase.removeRoom(room);
        window.location.replace(root);
    }

    if(!room) {
        return(<div >
            <label onClick={() => create(true)} className={'item border round ms-1 bg-primary px-2'}>IoT</label>
            <label onClick={() => create(false)} className={'item border round ms-1 bg-primary'}>Collaborative</label>
        </div>);
    } else {
        if(iot === null) return(<></>);
        return(<div className={'ms-auto'}>
            {(!iot) && <label onClick={share} className={'item border round ms-1 bg-primary'}>Share</label>}
            <label onClick={quit} className={'item border round ms-1 bg-danger'}>Quit</label>
        </div>);
    }

}
interface OwnProps {room?: string}
interface StateProps {iot: null|boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const iot = state.iot;
    return {iot};
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

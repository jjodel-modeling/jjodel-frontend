import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import '../topbar/style.scss';
import {Firebase} from "../../firebase";
import {DUser, DState, U, SetRootFieldAction} from "../../joiner";
import {SaveManager} from "../topbar/SaveManager";
import {useStateIfMounted} from "use-state-if-mounted";

function RoomManagerComponent(props: AllProps) {
    const debug = props.debug;
    const room = (props.room) ? props.room : '';
    const iot = props.iot;
    const root = process.env['REACT_APP_URL '] || '';
    const [loading, setLoading] = useStateIfMounted(false);

    const create = async(iot: boolean) => {
        const code = U.getRandomString(5);
        await Firebase.add('rooms', code, {
            code: code,
            actions: [],
            createdBy: DUser.current,
            iot: iot
        });
        window.open(root + '/room/' + code, '_blank');
    }

    const share = () => {U.alert('info', root + 'room/' + room);}

    const quit = async() => {
        await Firebase.removeRoom(room);
        window.location.replace(root);
    }

    const deleteAllRoms = async() => {
        setLoading(true);
        console.clear();
        await Firebase.removeAllRooms();
        setLoading(false);
    }

    if(!room) {
        return(<div >
            <label>Loading: {loading + ''}</label>
            {debug && <label onClick={() => create(true)} className={'item border round ms-1 bg-primary px-2'}>IoT</label>}
            {debug && <label onClick={deleteAllRoms} className={'item border round ms-1 bg-danger px-2'}>Delete All Roms</label>}
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
interface StateProps {iot: null|boolean, debug: boolean}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as any;
    const iot = state.iot;
    const debug = state.debug;
    return {iot, debug};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const RoomManagerConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(RoomManagerComponent);

export const RoomManager = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <RoomManagerConnected {...{...props, children}} />;
}

export default RoomManager;

import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import {IStore} from "../../redux/store";
import './style.scss';
import {CONSTRAINT, Firebase} from "../../firebase";
import {SetRootFieldAction, U} from "../../joiner";
import {useStateIfMounted} from "use-state-if-mounted";

function RoomManagerComponent(props: AllProps) {
    const room = props.room;
    const [code, setCode] = useStateIfMounted('');

    const create = async() => {
        const code = U.getRandomString(5);
        await Firebase.add('rooms', code, {code: code, actions: []});
        SetRootFieldAction.new('room', code, '', false);
    }
    const join = async() => {
        const constraint: CONSTRAINT = {field: 'code', operator: '==', value: code};
        const results = await Firebase.select('rooms', constraint);
        if(results.length === 0) return;
        SetRootFieldAction.new('room', code, '', false);
    }
    const quit = () => {
        SetRootFieldAction.new('room', '', '', false);
    }

    if(!room) {
        return(<div className={'ms-auto'}>
            <label onClick={create} className={'item border round ms-1 bg-success'}>Create Room</label>
            <input className={'input ms-3'} value={code} onChange={evt => setCode(evt.target.value)} />
            <label onClick={join} className={'item border round ms-0 bg-success'}>Join Room</label>
        </div>);
    } else {
        return(<div className={'ms-auto'}>
            <input className={'input ms-3'} value={room} disabled={true} />
            <label onClick={quit} className={'item border round ms-1 bg-danger'}>Quit Room</label>
        </div>);
    }

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


export const RoomManagerConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(RoomManagerComponent);

export const RoomManager = (props: OwnProps, childrens: (string | React.Component)[] = []): ReactElement => {
    return <RoomManagerConnected {...{...props, childrens}} />;
}

export default RoomManager;

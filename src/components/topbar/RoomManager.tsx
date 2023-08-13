import React, {Dispatch, ReactElement} from "react";
import {connect} from "react-redux";
import './style.scss';
import {CONSTRAINT, Firebase} from "../../firebase";
import {useStateIfMounted} from "use-state-if-mounted";
import {SetRootFieldAction, U, DState} from "../../joiner";

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
        if(results.length === 0) {
            U.alert('error', 'Invalid code !');
            return;
        }
        SetRootFieldAction.new('room', code, '', false);
    }
    const quit = () => {
        SetRootFieldAction.new('room', '', '', false);
    }

    if(!room) {
        return(<div className={'ms-auto'} style={{whiteSpace: "nowrap"}}>
            <label onClick={create} className={'item border round ms-1 bg-success'}>Create Room</label>
            <input className={'input ms-3'} value={code} onChange={evt => setCode(evt.target.value)} />
            <label onClick={join} className={'item border round ms-0 bg-success'}>Join Room</label>
        </div>);
    } else {
        return(<div className={'ms-auto'} style={{whiteSpace: "nowrap"}}>
            <input className={'input ms-3'} value={room} disabled={true} />
            <label onClick={quit} className={'item border round ms-1 bg-danger'}>Quit Room</label>
        </div>);
    }

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


export const RoomManagerConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(RoomManagerComponent);

export const RoomManager = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <RoomManagerConnected {...{...props, children}} />;
}

export default RoomManager;

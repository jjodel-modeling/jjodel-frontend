import {Action, CompositeAction, DState, DUser, GObject, LUser, SetRootFieldAction, store, U} from '../../joiner';
import {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import {io, Socket} from 'socket.io-client';
import {FakeStateProps} from "../../joiner/types";

function MqttEditorComponent(props: AllProps) {
    const {user} = props;
    const [iot, setIot] = useState<Socket|null>(null);
    const [ip, setIp] = useState('http://localhost');
    const [port, setPort] = useState(5003);

    const connect = async() => {
        SetRootFieldAction.new('isLoading', true);
        const _iot = io(`${ip}:${port}`, {path: '/iot', autoConnect: false, reconnection: false});
        _iot.io.opts.query = {'project': user.project?.id};
        _iot.off('pull-action');
        _iot.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            const action = Action.fromJson(receivedAction);
            if(!(action.field in store.getState()['topics']))
                SetRootFieldAction.new(action.field.replaceAll('+=', ''), [], '', false);
            action.hasFired = 0;
            console.log('Received Action from server.', action);
            action.fire();
        });
        _iot.connect();
        await U.sleep(1);
        setIot(_iot);
        if(!_iot.connected) alert('Error: Invalid parameters');
        SetRootFieldAction.new('isLoading', false);

    }
    const disconnect = async() => {
        if(!iot) return;
        SetRootFieldAction.new('isLoading', true);
        iot.off('pull-action');
        iot.disconnect();
        await U.sleep(1);
        setIot(null);
    }

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>MQTT</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${iot?.connected ? 'bg-success' : 'bg-danger'}`}></div>
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Ip Address:</label>
            <input type={'text'} defaultValue={ip} onChange={e => setIp(e.target.value)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Port:</label>
            <input type={'number'} defaultValue={port} onChange={e => setPort(e.target.valueAsNumber)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        {iot?.connected ?
            <button onClick={disconnect} className={'mt-3 btn btn-primary w-100 p-2'}>Disconnect</button> :
            <button onClick={connect} className={'mt-3 btn btn-primary w-100 p-2'}>Connect</button>
        }
    </section>;
}
interface OwnProps {}
interface StateProps {user: LUser}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    ret.user = LUser.fromPointer(DUser.current);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const MqttEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(MqttEditorComponent);

export const Mqtt = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <MqttEditorConnected {...{...props, children}} />;
}

MqttEditorComponent.cname = 'MqttComponent';
MqttEditorConnected.cname = 'MqttConnected';
Mqtt.cname = 'Mqtt';

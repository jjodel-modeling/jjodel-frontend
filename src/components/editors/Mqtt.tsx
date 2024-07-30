import {Action, CompositeAction, DState, DUser, GObject, LUser, SetRootFieldAction, store, U} from '../../joiner';
import {Component, Dispatch, ReactElement, useState} from 'react';
import {connect} from 'react-redux';
import {FakeStateProps} from "../../joiner/types";
import WebSockets from "../../webSockets/WebSockets";

function MqttEditorComponent(props: AllProps) {
    const {user} = props;
    const [ip, setIp] = useState('mqtt://localhost');
    const [port, setPort] = useState(1883);

    const connect = async() => {
        U.writeLog('create', 'MQTT', 'Connection');
        SetRootFieldAction.new('isLoading', true);
        WebSockets.iot.io.opts.query = {
            'project': user.project?.id,
            'brokerUrl': `${ip}:${port}`
        };
        WebSockets.iot.off('pull-action');
        WebSockets.iot.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            const action = Action.fromJson(receivedAction);
            if(!(action.field in store.getState()['topics']))
                SetRootFieldAction.new(action.field.replaceAll('+=', ''), [], '', false);
            action.hasFired = 0;
            console.log('Received Action from server.', action);
            action.fire();
        });
        WebSockets.iot.connect();
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
    }
    const disconnect = async() => {
        SetRootFieldAction.new('isLoading', true);
        WebSockets.iot.off('pull-action');
        WebSockets.iot.disconnect();
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
    }

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>MQTT</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${WebSockets.iot.connected ? 'bg-success' : 'bg-danger'}`}></div>
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Ip Address:</label>
            <input type={'text'} defaultValue={ip} onChange={e => setIp(e.target.value)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Port:</label>
            <input type={'number'} defaultValue={port} onChange={e => setPort(e.target.valueAsNumber)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        {WebSockets.iot.connected ?
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

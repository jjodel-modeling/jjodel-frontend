import {Action, CompositeAction, DState, DUser, GObject, LUser, SetRootFieldAction, store, U} from '../../joiner';
import {Component, Dispatch, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import {FakeStateProps} from "../../joiner/types";
import IoT from "../../iot/IoT";

function MqttEditorComponent(props: AllProps) {
    const {user} = props;
    const [ip, setIp] = useState('mqtt://localhost');
    const [port, setPort] = useState(1883);
    const client = IoT.init();

    const connect = async() => {
        // U.writeLog('create', 'MQTT', 'Connection');
        //SetRootFieldAction.new('isLoading', true);
        client.io.opts.query = {
            'project': U.getProjectID_URL(),
            'brokerUrl': `${ip}:${port}`
        };
        client.off('pull-action');
        client.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            const action = Action.fromJson(receivedAction); action.hasFired = 0;
            // console.log('Received Action from server.', action);
            action.fire();
        });
        client.connect();
        //await U.sleep(1);
        //SetRootFieldAction.new('isLoading', false);
    }
    const disconnect = async() => {
        //SetRootFieldAction.new('isLoading', true);
        client.off('pull-action');
        client.off('logger');
        client.disconnect();
        //await U.sleep(1);
        //SetRootFieldAction.new('isLoading', false);
    }

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>Middleware</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${client.connected ? 'bg-success' : 'bg-danger'}`}></div>
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Ip Address:</label>
            <input type={'text'} defaultValue={ip} onChange={e => setIp(e.target.value)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Port:</label>
            <input type={'number'} defaultValue={port} onChange={e => setPort(e.target.valueAsNumber)} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        {client.connected ?
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
    ret.user = LUser.getUser();
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

export const Mqtt = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <MqttEditorConnected {...{...props, children}} />;
}

MqttEditorComponent.cname = 'MqttComponent';
MqttEditorConnected.cname = 'MqttConnected';
Mqtt.cname = 'Mqtt';

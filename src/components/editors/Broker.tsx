import {
    Action,
    CompositeAction,
    DState,
    DUser,
    GObject,
    LUser,
    Pointer,
    SetRootFieldAction,
    store,
    U
} from '../../joiner';
import {Dispatch, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';
import IoT from "../../iot/IoT";
import {FakeStateProps} from "../../joiner/types";

function makeInput(label: string, type: 'text'|'number'|'password'): ReactNode {
    return(<div className={'p-1 d-flex'}>
        <label className={'my-auto'}>{label}</label>
        <input type={type} className={'my-auto input ms-auto'} spellCheck={false} />
    </div>);
}

function BrokerEditorComponent(props: AllProps) {
    const {user} = props;
    const [connected, setConnected] = useState(IoT.client.connected);
    const [url, setUrl] = useState('');
    const [port, setPort] = useState(0);
    const [actions, setActions] = useState<Pointer[]>([]);


    const connect = async() => {
        SetRootFieldAction.new('isLoading', true);
        IoT.client.io.opts.query = {'project': user.project?.id, 'brokerUrl': `${url}:${port}`};
        IoT.client.connect();
        IoT.client.off('pull-action');
        IoT.client.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            if(actions.includes(receivedAction.id)) return;
            const action = Action.fromJson(receivedAction);
            console.log('Received Action from server.', action);
            action.fire();
        });
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
        setConnected(IoT.client.connected);
    }
    const disconnect = async() => {
        SetRootFieldAction.new('isLoading', true);
        IoT.client.off('pull-action');
        IoT.client.disconnect();
        await U.sleep(1);
        SetRootFieldAction.new('isLoading', false);
        setConnected(IoT.client.connected);
    }

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>MQTT</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${connected ? 'bg-success' : 'bg-danger'}`}></div>
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Url</label>
            <input onChange={e => setUrl(e.target.value)} type={'text'} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        <div className={'p-1 d-flex'}>
            <label className={'my-auto'}>Port</label>
            <input onChange={e => setPort(e.target.valueAsNumber)} type={'number'} className={'my-auto input ms-auto'} spellCheck={false} />
        </div>
        <hr className={'my-2'} />
        {makeInput('Username', 'text')}
        {makeInput('Password', 'password')}
        {!connected && <button onClick={connect} className={'mt-3 btn btn-primary w-100 p-2'}>Connect</button>}
        {connected && <button onClick={disconnect} className={'mt-3 btn btn-primary w-100 p-2'}>Disconnect</button>}
        <button onClick={e => U.publish('sensors/1', {test: 15, other: true})}>click</button>
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


export const BrokerEditorConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(BrokerEditorComponent);

export const BrokerEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <BrokerEditorConnected {...{...props, children}} />;
}

BrokerEditorComponent.cname = 'BrokerEditorComponent';
BrokerEditorConnected.cname = 'BrokerEditorConnected';
BrokerEditor.cname = 'BrokerEditor';
export default BrokerEditor;

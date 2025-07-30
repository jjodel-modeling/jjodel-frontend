import {
    Action,
    CompositeAction,
    DState,
    DUser,
    GObject, Input,
    LUser,
    Pointer,
    SetRootFieldAction,
    store,
    U
} from '../../joiner';
import React, {Dispatch, ReactElement, ReactNode, useState} from 'react';
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
    const [url, setUrl] = useState('http://localhost');
    const [port, setPort] = useState(1883);
    const [actions, setActions] = useState<Pointer[]>([]);


    const connect = async() => {
        //SetRootFieldAction.new('isLoading', true);
        IoT.client.io.opts.query = {'project': user.project?.id, 'brokerUrl': `${url}:${port}`};
        IoT.client.connect();
        // IoT.client.off('pull-action');
        IoT.client.on('pull-action', (receivedAction: GObject<Action & CompositeAction>) => {
            // if(actions.includes(receivedAction.id)) return;
            const action = Action.fromJson(receivedAction);
            console.log('Received Action from server.', action);
            action.fire();
        });
        await U.sleep(1);
        //SetRootFieldAction.new('isLoading', false);
        setConnected(IoT.client.connected);
    }
    const disconnect = async() => {
        //SetRootFieldAction.new('isLoading', true);
        IoT.client.off('pull-action');
        IoT.client.disconnect();
        await U.sleep(1);
        //SetRootFieldAction.new('isLoading', false);
        setConnected(IoT.client.connected);
    }

    return <section className={'properties-tab'}>
        <div style={{position: 'absolute', bottom: 10, right: 10, width: '20px', height: '20px'}} className={`d-block ms-2 my-auto circle ${connected ? 'bg-success' : 'bg-danger'}`}></div>
        <label className={'input-container'}>
            <b className={'me-2'}>Url:</b>
            <Input getter={() => url} setter={v => setUrl(String(v))} type={'text'} />
        </label>
        <label className={'input-container'}>
            <b className={'me-2'}>Port:</b>
            <Input getter={() => String(port)} setter={v => setPort(Number(v))} type={'number'} />
        </label>
        <label className={'input-container'}>
            <b className={'me-2'}>Username:</b>
            <Input getter={() => ''} setter={v => {}} type={'text'} />
        </label>
        <label className={'input-container'}>
            <b className={'me-2'}>Password:</b>
            <Input getter={() => ''} setter={v => {}} type={'text'} />
        </label>
        {!connected && <button onClick={connect} className={'mt-2 btn btn-primary w-25 p-2'}>Connect</button>}
        {connected && <button onClick={disconnect} className={'mt-2 btn btn-primary w-25 p-2'}>Disconnect</button>}
        {/*<button onClick={e => U.publish('sensors', {test: 15, other: true})}>click</button>*/}
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

export const BrokerEditor = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <BrokerEditorConnected {...{...props, children}} />;
}

BrokerEditorComponent.cname = 'BrokerEditorComponent';
BrokerEditorConnected.cname = 'BrokerEditorConnected';
BrokerEditor.cname = 'BrokerEditor';
export default BrokerEditor;

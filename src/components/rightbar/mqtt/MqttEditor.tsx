import {DState} from '../../../joiner';
import {FakeStateProps} from '../../../joiner/types';
import {Dispatch, ReactElement, ReactNode, useState} from 'react';
import {connect} from 'react-redux';

function makeInput(label: string, type: 'text'|'number'|'password'): ReactNode {
    return(<div className={'p-1 d-flex'}>
        <label className={'my-auto'}>{label}</label>
        <input type={type} className={'my-auto input ms-auto'} spellCheck={false} />
    </div>);
}

function MqttEditorComponent(props: AllProps) {
    const [connected, setConnected] = useState(false);
    const bg = connected ? 'bg-success' : 'bg-danger';

    return <section className={'p-2'}>
        <div className={'d-flex'}>
            <h4 className={'d-block my-auto'}>MQTT</h4>
            <div style={{width: '15px', height: '15px'}} className={`d-block ms-2 my-auto circle ${bg}`}></div>
        </div>
        {makeInput('Host', 'text')}
        {makeInput('Port', 'number')}
        <hr className={'my-2'} />
        {makeInput('Username', 'text')}
        {makeInput('Password', 'password')}
        {!connected && <button onClick={e => setConnected(true)} className={'mt-3 btn btn-success w-100 p-2'}>Connect</button>}
        {connected && <button onClick={e => setConnected(false)} className={'mt-3 btn btn-danger w-100 p-2'}>Disconnect</button>}
    </section>;
}
interface OwnProps {}
interface StateProps {}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
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

export const MqttEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <MqttEditorConnected {...{...props, children}} />;
}

MqttEditorComponent.cname = 'MqttEditorComponent';
MqttEditorConnected.cname = 'MqttEditorConnected';
MqttEditor.cname = 'MqttEditor';
export default MqttEditor;

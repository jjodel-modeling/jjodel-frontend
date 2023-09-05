import React, {Dispatch, ReactElement} from 'react';
import {DValue, Input, IStore, LValue, Pointer} from "../../../../joiner";
import {connect} from "react-redux";


function MqttEditorComponent(props: AllProps) {
    const lValue = props.lValue;
    const room = props.room;
    const topics = props.topics;

    const change = (evt:  React.ChangeEvent<HTMLSelectElement>) => {
        lValue.topic = evt.target.value || '';
    }

    const parsedTopic = (topics.includes(lValue.topic)) ? lValue.topic : '';

    if(!room) return(<></>);
    return(<div className={'d-flex p-1'}>
        <label className={'my-auto'}>Topic</label>
        <select className={'my-auto ms-auto select'} value={parsedTopic} onChange={change}>
            <option value={''}>-----</option>
            <option value={''}>NO TOPIC</option>
            {topics.map((topic, index) => {
                return(<option key={index} value={topic}>{topic}</option>);
            })}
        </select>
    </div>);
}

interface OwnProps {valueId: Pointer<DValue, 1, 1, LValue>}
interface StateProps {lValue: LValue, room: string, topics: string[]}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const lValue = LValue.fromPointer(ownProps.valueId);
    const room = state.room;
    const topics = state.topics;
    return {lValue, room, topics};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const MqttEditorConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(MqttEditorComponent);

export const MqttEditor = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <MqttEditorConnected {...{...props, children}} />;
}
export default MqttEditor;

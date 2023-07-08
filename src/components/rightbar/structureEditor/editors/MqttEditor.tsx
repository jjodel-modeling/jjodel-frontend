import React, {Dispatch, ReactElement} from 'react';
import {DValue, Input, IStore, LValue, Pointer} from "../../../../joiner";
import {connect} from "react-redux";


function MqttEditorComponent(props: AllProps) {
    const lValue = props.lValue;
    const room = props.room;

    if(!room) return(<></>);
    return(<>
        <Input data={lValue} field={'topic'} label={'Topic'} type={'text'} />
    </>);
}

interface OwnProps {valueId: Pointer<DValue, 1, 1, LValue>}
interface StateProps {lValue: LValue, room: string}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const lValue = LValue.fromPointer(ownProps.valueId);
    const room = state.room;
    return {lValue, room};
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

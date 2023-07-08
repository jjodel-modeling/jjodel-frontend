import React, {Dispatch, ReactElement, useEffect} from 'react';
import {GObject, IStore, LValue} from "../../joiner";
import {connect} from "react-redux";

function IotEngineComponent(props: AllProps) {
    const data = props.data;
    const values = props.values;

    useEffect(() => {
        for(let value of values) {
            const topic = value.topic;
            let rawValue = 0;
            if(data[topic]) rawValue = data[topic];
            value.setValueAtPosition(0, rawValue);
        }
    })

    return(<></>);
}
interface OwnProps {data: GObject, room: string}
interface StateProps {values: LValue[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: IStore, ownProps: OwnProps): StateProps {
    const values: LValue[] = LValue.fromArr(state.values);
    values.filter(value => !value.topic);
    return {values: values};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const IotEngineConnected = connect<StateProps, DispatchProps, OwnProps, IStore>(
    mapStateToProps,
    mapDispatchToProps
)(IotEngineComponent);

export const IotEngine = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <IotEngineConnected {...{...props, children}} />;
}

export default IotEngine;


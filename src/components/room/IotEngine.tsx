import React, {Dispatch, ReactElement, useEffect} from 'react';
import {GObject, DState, LValue} from "../../joiner";
import {connect} from "react-redux";

function IotEngineComponent(props: AllProps) {
    const data = props.data;
    const values = props.values;

    useEffect(() => {
        for(let value of values) {
            const topic = value.topic;
            let rawValue = 0;
            if(data[topic]) rawValue = data[topic];
            if(value.values.length === 0 || value.values[0] !== rawValue) value.setValueAtPosition(0, rawValue);
        }
    })

    return(<></>);
}
interface OwnProps {data: GObject, room: string}
interface StateProps {values: LValue[]}
interface DispatchProps {}
type AllProps = OwnProps & StateProps & DispatchProps;


function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const values: LValue[] = LValue.fromArr(state.values);
    return {values: values.filter(value => value.topic !== '')};
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {};
    return ret;
}


export const IotEngineConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(IotEngineComponent);

export const IotEngine = (props: OwnProps, children: (string | React.Component)[] = []): ReactElement => {
    return <IotEngineConnected {...{...props, children}} />;
}

export default IotEngine;


import {DState, SetRootFieldAction} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import './style.scss';

function AlertComponent(props: AllProps) {
    const {type, message} = props;
    let typeLabel = <></>;
    switch (type) {
        case 'w': typeLabel = <b className={'text-warning'}>Warning</b>; break;
        case 'e': typeLabel = <b className={'text-danger'}>Error</b>; break;
        default: typeLabel = <b className={'text-primary'}>Info</b>;
    }
    if(!type || !message) return(<></>);
    return(<div className={'alert-container'}>
        <div className={'alert-card'}>
            {typeLabel}
            <div>{message}</div>
            <button className={'btn btn-danger'} onClick={e => SetRootFieldAction.new('alert', '', '')}>
                close
            </button>
        </div>
    </div>);
}

interface OwnProps {}
interface StateProps {
    type?: string;
    message?: string;
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    const alert = state.alert;
    if(!alert) return ret;
    ret.type = alert.charAt(0).toLowerCase();
    ret.message = alert.slice(2);
    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const AlertConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(AlertComponent);

export const AlertVisualizer = (props: OwnProps, children: (string | Component)[] = []): ReactElement => {
    return <AlertConnected {...{...props, children}} />;
}
export default AlertVisualizer;

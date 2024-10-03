import {DState, SetRootFieldAction} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement} from 'react';
import {connect} from 'react-redux';
import './style.scss';

import { Btn, CommandBar } from '../commandbar/CommandBar';

function AlertComponent(props: AllProps) {
    let {type, message} = props;
    let typeLabel = <></>;


    
    switch (type) {
        case 'warning': type = 'w'; break;
        case 'error': type= 'e'; break;
    }
    switch (type) {
        case 'w': typeLabel = <h1 className={'text-warning'}>Warning</h1>; break;
        case 'e': typeLabel = <h1 className={'text-danger'}>Error</h1>; break;
        default: typeLabel = <h1 className={'text-primary'}>Success</h1>;
    }

    



    if (!type || !message) return(<></>);
    return(<div className={'alert-container'}>
        <div className={`alert-card ${type === 'w' ? 'warning' : (type === 'e' ? 'error' : 'success')}`}>
            <div className={'alert-header'}>
                <div className={'alert-sign-outer'}>
                    <div className={'alert-sign-inner'}>
                    </div>
                </div>
            </div>
            {typeLabel}
            <div className={'alert-message'}>{message}</div>
            <div className={'alert-button-bar'}>
                <button className={'btn alert-btn my-2  px-4'} onClick={e => SetRootFieldAction.new('alert', '', '')}>
                    close
                </button>
            </div>

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

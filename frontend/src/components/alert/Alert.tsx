import {DState, SetRootFieldAction, U, windoww} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';


function AlertComponent(props: AllProps) {
    let {type, title, message} = props;
    let typeLabel = <></>;
    
    switch (type) {
        case 'warning': type = 'w'; break;
        case 'error': type= 'e'; break;
    }
    switch (type) {
        case 'w': typeLabel = <h1 className={'text-warning'}>{title ? title : 'Warning'}</h1>; break;
        case 'e': typeLabel = <h1 className={'text-danger'}>{title ? title : 'Error'}</h1>; break;
        default: typeLabel = <h1 className={'text-primary'}>{title ? title : 'Success'}</h1>;
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
    title?:string;
    message?: string;
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    let alert = state.alert;
    if (!alert) return ret;
    alert = alert + ' ';
    let pieces = alert.split(U.alertSeparator);
    ret.type = pieces[0];
    ret.title = windoww.__jjAlertTitle || pieces[1] || '';
    ret.message = windoww.__jjAlertMessage || pieces[2] || '';

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

export const AlertVisualizer = (props: OwnProps, children: ReactNode[] = []): ReactElement => {
    // @ts-ignore children
    return <AlertConnected {...{...props, children}} />;
}
export default AlertVisualizer;

import {DState, SetRootFieldAction} from '../../joiner';
import {FakeStateProps, windoww} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';

function DialogComponent(props: AllProps) {
    let {message,label} = props;console.log('dialog',props);

    let paused = false;
    

    const cancel_button = document.getElementById('cancel-button');
    const confirm_button = document.getElementById('confirm-button');
    
    function cancel(e: any) {
        SetRootFieldAction.new('dialog', '', '');
    };

    function confirm(e: any) {
        
        if (windoww.dialog_action) {
            windoww.dialog_action(); 
            windoww.dialog_action = null;
        }
        SetRootFieldAction.new('dialog', '', '');
    };



    if (!message || !label) return(<></>);

    return(<div className={'dialog-container'}>
        <div className={'dialog-card'}>
            <div className={'dialog-header'}>
                <div className={'dialog-sign-outer'}>
                    <div className={'dialog-sign-inner'}>
                    </div>
                </div>
            </div>
            <h1>{message}</h1>
            <div className={'dialog-message'}></div>
            <div className={'dialog-button-bar'}>
                <button className={'btn dialog-cancel-btn my-2  px-4'} id={'cancel-button'} onClick={(e) => cancel(e)}>
                    cancel
                </button>
                <button className={'btn dialog-btn my-2  px-4'} id={'confirm-button'} onClick={(e) => confirm(e)}>
                    {label}
                </button> 
            </div>
        </div>

    </div>);
}

interface OwnProps {}
interface StateProps {
    message: string;
    label:string;
    
}
interface DispatchProps {}

type AllProps = OwnProps & StateProps & DispatchProps;

function mapStateToProps(state: DState, ownProps: OwnProps): StateProps {
    const ret: StateProps = {} as FakeStateProps;
    let dialog = state.dialog;
    if(!dialog) return ret;
    dialog = dialog + ' ';
    let pieces = dialog.split(':');
    ret.message = pieces[0];
    ret.label = pieces[1];

    return ret;
}

function mapDispatchToProps(dispatch: Dispatch<any>): DispatchProps {
    const ret: DispatchProps = {} as any;
    return ret;
}


export const DialogConnected = connect<StateProps, DispatchProps, OwnProps, DState>(
    mapStateToProps,
    mapDispatchToProps
)(DialogComponent);

export const DialogVisualizer = (props: OwnProps, children: ReactNode = []): ReactElement => {
    // @ts-ignore children
    return <DialogConnected {...{...props, children}} />;
}
export default DialogVisualizer;

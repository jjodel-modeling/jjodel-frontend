import {DState, SetRootFieldAction, TRANSACTION, U} from '../../joiner';
import {FakeStateProps, windoww} from '../../joiner/types';
import React, {Component, Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {DialogButton, DialogOptions} from "../../common/U";

function DialogComponent(props: AllProps) {
    let {message,label} = props;

    if (U.dialogOptions) return DialogQuestion(props);
    if (!message || !label) return(<></>);

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

function dialogOnClick(msg: DialogOptions, button: DialogButton) {
    TRANSACTION('dialog action', ()=>{
        button.action?.();
        SetRootFieldAction.new('dialog', '', '');
        msg.resolve(button.txt);
    }, '', '', (msg.title || msg.question)+' --> ' + button.txt
    )
    U.dialogOptions = undefined;
}

function DialogQuestion(props: AllProps) {
    let msg = U.dialogOptions;
    if (!msg) return null;
    let buttons = msg.options;
    if (!buttons.length) buttons = [{txt: 'ok'}];


    return(<div className={'dialog-container'}>
        <div className={'dialog-card'}>
            <div className={'dialog-header'}>
                <div className={'dialog-sign-outer'}>
                    <div className={'dialog-sign-inner'} />
                </div>
            </div>
            {msg.title ? <h1>{msg.title}</h1> : null}
            <div className={'dialog-message'}>{
                msg.question
            }</div>
            <div className={'dialog-button-bar'}>
                {buttons.map(o=> (
                    <button className={'btn dialog-btn my-2  px-4'} id={'confirm-button'}
                            onClick={()=> dialogOnClick(msg, o)}>
                        {o.txt}
                    </button>
                ))}
            </div>
        </div>

    </div>);
}

interface OwnProps {
}

interface StateProps {
    message: string;
    label: string;

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

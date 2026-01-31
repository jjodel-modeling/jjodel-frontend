import {DState, SetRootFieldAction, TRANSACTION, U} from '../../joiner';
import {FakeStateProps, windoww} from '../../joiner/types';
import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';
import {DialogButton, DialogOptions} from "../../common/U";

/**
 * Dialog Component - Minimal Redesign
 * Per dialogs-modals-spec.md
 *
 * Features:
 * - Clean layout without large icon
 * - Black title
 * - Gray cancel button, cyan/red for primary actions
 */

function DialogComponent(props: AllProps) {
    let {message, label} = props;

    if (U.dialogOptions) return DialogQuestion(props);
    if (!message || !label) return(<></>);

    function cancel(e: any) {
        SetRootFieldAction.new('dialog', '', '');
    }

    function confirm(e: any) {
        if (windoww.dialog_action) {
            windoww.dialog_action();
            windoww.dialog_action = null;
        }
        SetRootFieldAction.new('dialog', '', '');
    }

    // Determine button style based on action type
    const lower = label.toLowerCase();
    const isDestructive = lower.includes('delete') || lower.includes('remove') || lower.includes('discard');
    // Slate actions: logout, close project (actions that may lose unsaved changes but aren't destructive)
    const isSlateAction = lower.includes('logout') || lower.includes('log out') ||
                          lower.includes('close') || lower.includes('proceed');

    // Get button class: destructive (red), slate (for logout/close), or primary (cyan)
    const getConfirmButtonClass = () => {
        if (isDestructive) return 'btn btn-destructive';
        if (isSlateAction) return 'btn btn-slate';
        return 'btn dialog-btn';
    };

    return(
        <div className={'dialog-container'}>
            <div className={'dialog-card'}>
                {/* Body - no icon for confirm dialogs per spec */}
                <div className={'dialog-body'}>
                    <h1>{message}</h1>
                    <div className={'dialog-message'} style={{paddingLeft: 0}}></div>
                </div>

                {/* Footer with buttons */}
                <div className={'dialog-button-bar'}>
                    <button
                        className={'btn dialog-cancel-btn'}
                        id={'cancel-button'}
                        onClick={(e) => cancel(e)}
                    >
                        Cancel
                    </button>
                    <button
                        className={getConfirmButtonClass()}
                        id={'confirm-button'}
                        onClick={(e) => confirm(e)}
                    >
                        {label}
                    </button>
                </div>
            </div>
        </div>
    );
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
    if (!buttons.length) buttons = [{txt: 'OK'}];

    // Determine button styles based on text
    const getButtonClass = (txt: string, index: number, total: number) => {
        const lower = txt.toLowerCase();
        // Destructive actions (red)
        if (lower.includes('delete') || lower.includes('remove') || lower.includes('discard')) {
            return 'btn btn-destructive';
        }
        // "Don't save" - text-only style (no background, just text)
        if (lower === "don't save" || lower === 'dont save') {
            return 'btn btn-text-only';
        }
        // "Save & Exit" - slate primary action
        if (lower.includes('save') && lower.includes('exit')) {
            return 'btn btn-slate';
        }
        // Slate actions: logout, close project (may lose unsaved changes but not destructive)
        if (lower.includes('logout') || lower.includes('log out') ||
            lower.includes('close') || lower.includes('proceed')) {
            return 'btn btn-slate';
        }
        // Primary CTA (usually last button for confirm actions)
        if (lower.includes('save') || lower.includes('create') || lower.includes('submit') ||
            lower.includes('confirm') || lower.includes('yes')) {
            return 'btn dialog-btn'; // Cyan primary
        }
        // Cancel/neutral actions
        if (lower.includes('cancel') || lower.includes('no') || lower.includes('close')) {
            return 'btn dialog-cancel-btn';
        }
        // Default: secondary for single button, last button is primary
        if (total === 1) {
            return 'btn dialog-cancel-btn'; // Single neutral button
        }
        return index === total - 1 ? 'btn dialog-btn' : 'btn dialog-cancel-btn';
    };

    return(
        <div className={'dialog-container'}>
            <div className={'dialog-card'}>
                {/* Body - no icon for question dialogs */}
                <div className={'dialog-body'}>
                    {msg.title && <h1>{msg.title}</h1>}
                    <div className={'dialog-message'} style={{paddingLeft: 0}}>
                        {msg.question}
                    </div>
                </div>

                {/* Footer with buttons */}
                <div className={'dialog-button-bar'}>
                    {buttons.map((o, index) => (
                        <button
                            key={index}
                            className={getButtonClass(o.txt, index, buttons.length)}
                            onClick={() => dialogOnClick(msg, o)}
                        >
                            {o.txt}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

interface OwnProps {}

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
    let pieces = dialog.split(U.alertSeparator);
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

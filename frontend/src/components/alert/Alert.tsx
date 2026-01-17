import {DState, SetRootFieldAction, U, windoww} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Dispatch, ReactElement, ReactNode} from 'react';
import {connect} from 'react-redux';
import './style.scss';

/**
 * Alert Component - Minimal Redesign
 * Per dialogs-modals-spec.md
 *
 * Features:
 * - Small 24px icon inline with title
 * - Black title (not colored)
 * - Gray secondary button for neutral actions (Done, Close)
 */

function AlertComponent(props: AllProps) {
    let {type, title, message} = props;

    // Normalize type
    let normalizedType: 'success' | 'error' | 'warning' | 'info' = 'success';
    switch (type) {
        case 'warning':
        case 'w':
            normalizedType = 'warning';
            break;
        case 'error':
        case 'e':
            normalizedType = 'error';
            break;
        case 'info':
            normalizedType = 'info';
            break;
        default:
            normalizedType = 'success';
    }

    // Get icon for type
    const getIcon = () => {
        switch (normalizedType) {
            case 'success':
                return <i className="bi bi-check-circle" />;
            case 'error':
                return <i className="bi bi-x-circle" />;
            case 'warning':
                return <i className="bi bi-exclamation-triangle" />;
            case 'info':
                return <i className="bi bi-info-circle" />;
        }
    };

    // Get default title for type
    const getDefaultTitle = () => {
        switch (normalizedType) {
            case 'success': return 'Success';
            case 'error': return 'Something went wrong';
            case 'warning': return 'Warning';
            case 'info': return 'Information';
        }
    };

    // Get button label for type
    const getButtonLabel = () => {
        switch (normalizedType) {
            case 'success': return 'Done';
            case 'error': return 'Close';
            case 'warning': return 'OK';
            case 'info': return 'Got it';
        }
    };

    if (!type || !message) return(<></>);

    return(
        <div className={'alert-container'}>
            <div className={`alert-card ${normalizedType}`}>
                {/* Body with inline icon + title */}
                <div className={'alert-body'}>
                    <div className={'modal-icon-title'}>
                        <div className={`modal-icon ${normalizedType}`}>
                            {getIcon()}
                        </div>
                        <h1>{title || getDefaultTitle()}</h1>
                    </div>
                    <div className={'alert-message'}>{message}</div>
                </div>

                {/* Footer with button */}
                <div className={'alert-button-bar'}>
                    <button
                        className={'btn alert-btn'}
                        onClick={e => SetRootFieldAction.new('alert', '', '')}
                    >
                        {getButtonLabel()}
                    </button>
                </div>
            </div>
        </div>
    );
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

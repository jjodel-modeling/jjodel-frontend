import {DState, SetRootFieldAction, U, windoww} from '../../joiner';
import {FakeStateProps} from '../../joiner/types';
import React, {Dispatch, ReactElement, ReactNode, useEffect, useState} from 'react';
import {connect} from 'react-redux';
import './style.scss';

/**
 * Alert Component - Toast Notification Style
 *
 * Non-blocking toast notifications that auto-dismiss.
 * Replaces the old modal-style alerts.
 *
 * Features:
 * - Auto-dismiss after 4 seconds
 * - Progress bar showing remaining time
 * - Click to dismiss early
 * - Slide-in/out animations
 * - Success, Error, Warning, Info variants
 */

function AlertComponent(props: AllProps) {
    let {type, title, message} = props;
    const [isExiting, setIsExiting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    // Duration in milliseconds
    const DURATION = 4000;

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
                return <i className="bi bi-check-circle-fill" />;
            case 'error':
                return <i className="bi bi-x-circle-fill" />;
            case 'warning':
                return <i className="bi bi-exclamation-triangle-fill" />;
            case 'info':
                return <i className="bi bi-info-circle-fill" />;
        }
    };

    // Get default title for type
    const getDefaultTitle = () => {
        switch (normalizedType) {
            case 'success': return 'Success';
            case 'error': return 'Error';
            case 'warning': return 'Warning';
            case 'info': return 'Info';
        }
    };

    // Close the toast
    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            SetRootFieldAction.new('alert', '', '');
            setIsExiting(false);
            setIsVisible(false);
        }, 300);
    };

    // Auto-dismiss effect
    useEffect(() => {
        if (type && message) {
            setIsVisible(true);
            setIsExiting(false);

            // Start exit animation before closing
            const exitTimer = setTimeout(() => {
                setIsExiting(true);
            }, DURATION - 300);

            // Actually close after animation
            const closeTimer = setTimeout(() => {
                SetRootFieldAction.new('alert', '', '');
                setIsExiting(false);
                setIsVisible(false);
            }, DURATION);

            return () => {
                clearTimeout(exitTimer);
                clearTimeout(closeTimer);
            };
        }
    }, [type, message, title]);

    if (!type || !message || !isVisible) return null;

    return (
        <div className="toast-alert-container">
            <div
                className={`toast-alert toast-alert--${normalizedType} ${isExiting ? 'toast-alert--exiting' : ''}`}
                role="alert"
                aria-live="polite"
                onClick={handleClose}
            >
                <div className="toast-alert__icon">
                    {getIcon()}
                </div>
                <div className="toast-alert__content">
                    <div className="toast-alert__title">
                        {title || getDefaultTitle()}
                    </div>
                    {message && message !== title && (
                        <div className="toast-alert__message">{message}</div>
                    )}
                </div>
                <button
                    className="toast-alert__close"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClose();
                    }}
                    aria-label="Close notification"
                >
                    <i className="bi bi-x" />
                </button>
                <div
                    className="toast-alert__progress"
                    style={{ animationDuration: `${DURATION}ms` }}
                />
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

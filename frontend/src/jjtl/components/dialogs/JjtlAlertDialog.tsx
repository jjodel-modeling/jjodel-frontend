/**
 * JjTL Alert Dialog Component
 * Displays a blocking modal alert with different types
 */

import React from 'react';
import { AlertType } from '../../types';

interface JjtlAlertDialogProps {
    message: string;
    alertType: AlertType;
    onClose: () => void;
}

const ALERT_CONFIG: Record<AlertType, { title: string; icon: string; iconClass: string }> = {
    info: {
        title: 'Information',
        icon: 'bi-info-circle',
        iconClass: 'jjtl-dialog__header-icon--info',
    },
    warning: {
        title: 'Warning',
        icon: 'bi-exclamation-triangle',
        iconClass: 'jjtl-dialog__header-icon--warning',
    },
    error: {
        title: 'Error',
        icon: 'bi-x-circle',
        iconClass: 'jjtl-dialog__header-icon--error',
    },
    success: {
        title: 'Success',
        icon: 'bi-check-circle',
        iconClass: 'jjtl-dialog__header-icon--success',
    },
};

export const JjtlAlertDialog: React.FC<JjtlAlertDialogProps> = ({
    message,
    alertType,
    onClose,
}) => {
    const config = ALERT_CONFIG[alertType];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape' || e.key === 'Enter') {
            onClose();
        }
    };

    return (
        <div
            className="jjtl-dialog-overlay"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="alert-title"
        >
            <div className="jjtl-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="jjtl-dialog__header">
                    <div className={`jjtl-dialog__header-icon ${config.iconClass}`}>
                        <i className={`bi ${config.icon}`} />
                    </div>
                    <h3 id="alert-title" className="jjtl-dialog__header-title">
                        {config.title}
                    </h3>
                </div>
                <div className="jjtl-dialog__body">
                    <p className="jjtl-dialog__body-message">{message}</p>
                </div>
                <div className="jjtl-dialog__footer">
                    <button
                        className="jjtl-dialog__btn jjtl-dialog__btn--primary"
                        onClick={onClose}
                        autoFocus
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JjtlAlertDialog;

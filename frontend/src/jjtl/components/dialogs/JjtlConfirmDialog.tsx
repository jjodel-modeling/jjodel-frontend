/**
 * JjTL Confirm Dialog Component
 * Displays a blocking Yes/No modal dialog returning a boolean
 */

import React from 'react';

interface JjtlConfirmDialogProps {
    message: string;
    executionContext?: string;
    onSubmit: (result: boolean) => void;
}

export const JjtlConfirmDialog: React.FC<JjtlConfirmDialogProps> = ({
    message,
    executionContext,
    onSubmit,
}) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onSubmit(false);
        } else if (e.key === 'Enter') {
            onSubmit(true);
        }
    };

    return (
        <div
            className="jjtl-dialog-overlay"
            onClick={() => onSubmit(false)}
            onKeyDown={handleKeyDown}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
        >
            <div className="jjtl-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="jjtl-dialog__header">
                    <div className="jjtl-dialog__header-icon jjtl-dialog__header-icon--info">
                        <i className="bi bi-question-circle" />
                    </div>
                    <h3 id="confirm-title" className="jjtl-dialog__header-title">
                        Confirm
                    </h3>
                </div>
                <div className="jjtl-dialog__body">
                    <p className="jjtl-dialog__body-message">{message}</p>
                    {executionContext && (
                        <div className="jjtl-dialog-context">{executionContext}</div>
                    )}
                </div>
                <div className="jjtl-dialog__footer">
                    <button
                        className="jjtl-dialog__btn jjtl-dialog__btn--secondary"
                        onClick={() => onSubmit(false)}
                    >
                        No
                    </button>
                    <button
                        className="jjtl-dialog__btn jjtl-dialog__btn--primary"
                        onClick={() => onSubmit(true)}
                        autoFocus
                    >
                        Yes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JjtlConfirmDialog;

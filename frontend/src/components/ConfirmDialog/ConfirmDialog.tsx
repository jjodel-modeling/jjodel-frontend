import React, { useEffect, useCallback } from 'react';
import './confirm-dialog.scss';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

/**
 * ConfirmDialog - Custom modal for confirmation dialogs
 *
 * Replaces native window.confirm() with a styled modal
 * that matches the Jjodel design system.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger',
    onConfirm,
    onCancel
}) => {
    // Handle ESC key to close
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onCancel();
        }
    }, [onCancel]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const getIcon = () => {
        switch (variant) {
            case 'danger':
                return <i className="bi bi-exclamation-triangle" />;
            case 'warning':
                return <i className="bi bi-exclamation-circle" />;
            case 'info':
            default:
                return <i className="bi bi-info-circle" />;
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="confirm-dialog-backdrop"
                onClick={onCancel}
                aria-hidden="true"
            />

            {/* Modal */}
            <div
                className="confirm-dialog"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-dialog-title"
                aria-describedby="confirm-dialog-message"
            >
                <div className="confirm-dialog-content">
                    {/* Icon */}
                    <div className={`confirm-dialog-icon confirm-dialog-icon--${variant}`}>
                        {getIcon()}
                    </div>

                    {/* Title */}
                    <h2 id="confirm-dialog-title" className="confirm-dialog-title">
                        {title}
                    </h2>

                    {/* Message */}
                    <p id="confirm-dialog-message" className="confirm-dialog-message">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="confirm-dialog-actions">
                        <button
                            type="button"
                            className="confirm-dialog-btn confirm-dialog-btn--secondary"
                            onClick={onCancel}
                        >
                            {cancelText}
                        </button>

                        <button
                            type="button"
                            className={`confirm-dialog-btn confirm-dialog-btn--${variant}`}
                            onClick={onConfirm}
                            autoFocus
                        >
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmDialog;

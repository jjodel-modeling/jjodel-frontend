import React, { useEffect, useState } from 'react';
import './toast.scss';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
    onClose: (id: string) => void;
}

/**
 * Toast - Non-blocking notification component
 *
 * Replaces modal notifications with lightweight toasts
 * that auto-dismiss and don't block user interaction.
 */
export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    duration = 4000,
    onClose
}) => {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        // Start exit animation before removal
        const exitTimer = setTimeout(() => {
            setIsExiting(true);
        }, duration - 300);

        // Remove after animation
        const removeTimer = setTimeout(() => {
            onClose(id);
        }, duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [id, duration, onClose]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <i className="bi bi-check-circle-fill" />;
            case 'error':
                return <i className="bi bi-x-circle-fill" />;
            case 'warning':
                return <i className="bi bi-exclamation-triangle-fill" />;
            case 'info':
            default:
                return <i className="bi bi-info-circle-fill" />;
        }
    };

    return (
        <div
            className={`toast toast--${type} ${isExiting ? 'toast--exiting' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon">
                {getIcon()}
            </div>
            <div className="toast-content">
                {title && <div className="toast-title">{title}</div>}
                <div className="toast-message">{message}</div>
            </div>
            <button
                className="toast-close"
                onClick={handleClose}
                aria-label="Close notification"
            >
                <i className="bi bi-x" />
            </button>
            <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
        </div>
    );
};

export default Toast;

import React, { useEffect, useState } from 'react';
import type { ToastDismiss, ToastPriority } from './toastTypes';
import './toast.scss';

export type ToastType = ToastPriority;

interface ToastProps {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    dismiss?: ToastDismiss;
    duration?: number;
    onClose: (id: string) => void;
}

const ICON_MAP: Record<ToastType, string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
};

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    dismiss = 'auto',
    duration = 4000,
    onClose,
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const isManual = dismiss === 'manual';

    useEffect(() => {
        if (isManual) return;

        const exitTimer = setTimeout(() => setIsExiting(true), duration - 300);
        const removeTimer = setTimeout(() => onClose(id), duration);

        return () => {
            clearTimeout(exitTimer);
            clearTimeout(removeTimer);
        };
    }, [id, duration, onClose, isManual]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => onClose(id), 300);
    };

    return (
        <div
            className={`toast toast--${type} ${isExiting ? 'toast--exiting' : ''}`}
            role="alert"
            aria-live="polite"
        >
            <div className="toast-icon">
                <i className={`bi ${ICON_MAP[type]}`} />
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
            {!isManual && (
                <div className="toast-progress" style={{ animationDuration: `${duration}ms` }} />
            )}
        </div>
    );
};

export default Toast;

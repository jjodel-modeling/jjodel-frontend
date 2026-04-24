import React, { useEffect, useRef, useState, type ReactNode } from 'react';
import type { ToastAction, ToastDismiss, ToastPriority } from './toastTypes';
import { useRelativeTime } from './useRelativeTime';
import './toast.scss';

export type ToastType = ToastPriority;

interface ToastProps {
    id: string;
    type: ToastType;
    title?: ReactNode;
    message: ReactNode;
    dismiss?: ToastDismiss;
    duration?: number;
    timestamp: number;
    action?: ToastAction;
    onClose: (id: string) => void;
}

const ICON_MAP: Record<ToastType, string> = {
    success: 'bi-check-circle-fill',
    error: 'bi-x-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    info: 'bi-info-circle-fill',
};

const DEFAULT_TITLE: Record<ToastType, string> = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Notice',
};

const EXIT_ANIMATION_MS = 220;

export const Toast: React.FC<ToastProps> = ({
    id,
    type,
    title,
    message,
    dismiss = 'auto',
    duration = 4000,
    timestamp,
    action,
    onClose,
}) => {
    const [isExiting, setIsExiting] = useState(false);
    const isManual = dismiss === 'manual' || !duration || duration <= 0;
    const remainingRef = useRef(duration);
    const startRef = useRef<number>(Date.now());
    const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const removeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const relativeTime = useRelativeTime(timestamp);
    const headerLabel = title ?? DEFAULT_TITLE[type];

    const clearTimers = () => {
        if (exitTimerRef.current) { clearTimeout(exitTimerRef.current); exitTimerRef.current = null; }
        if (removeTimerRef.current) { clearTimeout(removeTimerRef.current); removeTimerRef.current = null; }
    };

    const scheduleDismiss = (ms: number) => {
        clearTimers();
        if (ms <= 0) return;
        startRef.current = Date.now();
        const exitDelay = Math.max(0, ms - EXIT_ANIMATION_MS);
        exitTimerRef.current = setTimeout(() => setIsExiting(true), exitDelay);
        removeTimerRef.current = setTimeout(() => onClose(id), ms);
    };

    useEffect(() => {
        if (isManual) return;
        remainingRef.current = duration;
        scheduleDismiss(duration);
        return clearTimers;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, duration, isManual]);

    const handleMouseEnter = () => {
        if (isManual) return;
        const elapsed = Date.now() - startRef.current;
        remainingRef.current = Math.max(0, remainingRef.current - elapsed);
        clearTimers();
    };

    const handleMouseLeave = () => {
        if (isManual) return;
        scheduleDismiss(remainingRef.current);
    };

    const handleClose = () => {
        clearTimers();
        setIsExiting(true);
        setTimeout(() => onClose(id), EXIT_ANIMATION_MS);
    };

    const handleAction = () => {
        try { action?.onClick(); } finally { handleClose(); }
    };

    return (
        <div
            className={`toast toast--${type}${isExiting ? ' toast--exiting' : ''}`}
            role="alert"
            aria-live="polite"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <div className="toast__row">
                <i className={`toast__icon bi ${ICON_MAP[type]}`} aria-hidden="true" />
                <span className="toast__title">{headerLabel}</span>
                <span className="toast__time" title={new Date(timestamp).toLocaleString()}>{relativeTime}</span>
                <button
                    type="button"
                    className="toast__close"
                    onClick={handleClose}
                    aria-label="Dismiss"
                >
                    <i className="bi bi-x" aria-hidden="true" />
                </button>
            </div>
            {message != null && message !== '' && (
                <div className="toast__body">{message}</div>
            )}
            {action && (
                <button type="button" className="toast__action" onClick={handleAction}>
                    {action.label}
                </button>
            )}
        </div>
    );
};

export default Toast;

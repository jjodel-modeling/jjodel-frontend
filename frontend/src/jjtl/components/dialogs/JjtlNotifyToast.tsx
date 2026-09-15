/**
 * JjTL Toast Notification Component
 * Displays non-blocking toast notifications that auto-dismiss
 */

import React, { useState, useEffect } from 'react';

interface Toast {
    id: string;
    message: string;
    exiting?: boolean;
}

interface JjtlNotifyToastProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

const ToastItem: React.FC<{
    toast: Toast;
    onRemove: (id: string) => void;
}> = ({ toast, onRemove }) => {
    return (
        <div className={`jjtl-toast ${toast.exiting ? 'jjtl-toast--exiting' : ''}`}>
            <i className="bi bi-bell jjtl-toast__icon" />
            <span className="jjtl-toast__message">{toast.message}</span>
            <button
                className="jjtl-toast__close"
                onClick={() => onRemove(toast.id)}
                aria-label="Dismiss"
            >
                <i className="bi bi-x" />
            </button>
        </div>
    );
};

export const JjtlNotifyToast: React.FC<JjtlNotifyToastProps> = ({
    toasts,
    onRemove,
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className="jjtl-toast-container">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
};

/**
 * Hook for managing toast notifications
 */
export function useToasts() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (message: string, duration: number = 3000) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        setToasts((prev) => [...prev, { id, message }]);

        // Start exit animation before removal
        setTimeout(() => {
            setToasts((prev) =>
                prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
            );
        }, duration - 150);

        // Remove after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
    };

    const removeToast = (id: string) => {
        // Start exit animation
        setToasts((prev) =>
            prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
        );

        // Remove after animation
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 150);
    };

    return { toasts, addToast, removeToast };
}

export default JjtlNotifyToast;

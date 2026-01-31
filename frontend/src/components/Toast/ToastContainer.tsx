import React from 'react';
import { Toast, ToastType } from './Toast';
import './toast.scss';

export interface ToastData {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastContainerProps {
    toasts: ToastData[];
    onRemove: (id: string) => void;
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

/**
 * ToastContainer - Container for toast notifications
 *
 * Renders all active toasts in a fixed position.
 * Toasts stack vertically with newest on top.
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemove,
    position = 'top-right'
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className={`toast-container toast-container--${position}`}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    {...toast}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
};

export default ToastContainer;

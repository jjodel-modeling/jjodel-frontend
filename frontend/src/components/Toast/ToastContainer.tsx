import React from 'react';
import { Toast } from './Toast';
import type { ToastMessage, ToastPosition } from './toastTypes';
import './toast.scss';

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemove: (id: string) => void;
    position?: ToastPosition;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({
    toasts,
    onRemove,
    position = 'bottom-right',
}) => {
    if (toasts.length === 0) return null;

    return (
        <div className={`jj-toast-container jj-toast-container--${position}`}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.priority}
                    title={toast.title}
                    message={toast.message}
                    dismiss={toast.dismiss}
                    duration={toast.duration}
                    timestamp={toast.timestamp}
                    action={toast.action}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
};

export default ToastContainer;

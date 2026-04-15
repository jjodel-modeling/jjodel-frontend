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
    position = 'bottom-left',
}) => {
    if (toasts.length === 0) return null;

    // console.log('[ToastContainer] Rendering', toasts.length, 'toasts, position:', position);

    return (
        <div className={`toast-container toast-container--${position}`}>
            {toasts.map(toast => (
                <Toast
                    key={toast.id}
                    id={toast.id}
                    type={toast.priority}
                    title={toast.title}
                    message={toast.message}
                    dismiss={toast.dismiss}
                    duration={toast.duration}
                    onClose={onRemove}
                />
            ))}
        </div>
    );
};

export default ToastContainer;

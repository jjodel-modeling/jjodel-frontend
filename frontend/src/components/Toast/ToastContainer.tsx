import React from 'react';
import { createPortal } from 'react-dom';
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

    // Portaled to <body>. #root is position:fixed (index.scss), which makes it a
    // stacking context, so --z-toast only ranked the container inside #root: the
    // right rail, a body-level sibling at z-index 900, painted over it. The toast
    // was only ever visible in the strip below the rail, which is the strip that
    // covers the status bar.
    return createPortal(
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
        </div>,
        document.body,
    );
};

export default ToastContainer;

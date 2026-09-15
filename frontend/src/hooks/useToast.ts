import { useState, useCallback } from 'react';
import { ToastType } from '../components/Toast/Toast';

export interface ToastData {
    id: string;
    type: ToastType;
    title?: string;
    message: string;
    duration?: number;
}

interface ToastOptions {
    title?: string;
    duration?: number;
}

/**
 * useToast - Hook for managing toast notifications
 *
 * Usage:
 * const toast = useToast();
 * toast.success('Project saved!');
 * toast.error('Failed to save', { title: 'Error' });
 */
export const useToast = () => {
    const [toasts, setToasts] = useState<ToastData[]>([]);

    const addToast = useCallback((
        message: string,
        type: ToastType = 'info',
        options: ToastOptions = {}
    ) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        setToasts(prev => [...prev, {
            id,
            type,
            message,
            title: options.title,
            duration: options.duration ?? 4000
        }]);

        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    }, []);

    const clearAll = useCallback(() => {
        setToasts([]);
    }, []);

    return {
        toasts,
        addToast,
        removeToast,
        clearAll,
        success: (message: string, options?: ToastOptions) =>
            addToast(message, 'success', options),
        error: (message: string, options?: ToastOptions) =>
            addToast(message, 'error', options),
        info: (message: string, options?: ToastOptions) =>
            addToast(message, 'info', options),
        warning: (message: string, options?: ToastOptions) =>
            addToast(message, 'warning', options),
    };
};

export default useToast;

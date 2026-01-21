import React, { createContext, useContext, ReactNode } from 'react';
import { useToast, ToastData } from '../../hooks/useToast';
import { ToastContainer } from './ToastContainer';
import { ToastType } from './Toast';

interface ToastOptions {
    title?: string;
    duration?: number;
}

interface ToastContextValue {
    toasts: ToastData[];
    addToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * ToastProvider - Provides toast functionality to the entire app
 *
 * Wrap your app with this provider to enable toasts everywhere.
 * Use the useToastContext hook to access toast methods.
 */
export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const toast = useToast();

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer
                toasts={toast.toasts}
                onRemove={toast.removeToast}
                position="top-right"
            />
        </ToastContext.Provider>
    );
};

/**
 * useToastContext - Hook to access toast methods from any component
 *
 * Usage:
 * const toast = useToastContext();
 * toast.success('Saved!');
 */
export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;

import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ToastContainer } from './ToastContainer';
import type { ToastType } from './Toast';
import type { ToastMessage, ToastPreferences, ToastDismiss, JjodelToastDetail } from './toastTypes';
import { loadToastPrefs } from './toastTypes';

interface ToastOptions {
    title?: string;
    duration?: number;
    dismiss?: ToastDismiss;
}

interface ToastContextValue {
    toasts: ToastMessage[];
    addToast: (message: string, type?: ToastType, options?: ToastOptions) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
    success: (message: string, options?: ToastOptions) => string;
    error: (message: string, options?: ToastOptions) => string;
    info: (message: string, options?: ToastOptions) => string;
    warning: (message: string, options?: ToastOptions) => string;
}

const MAX_TOASTS = 5;
const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [prefs, setPrefs] = useState<ToastPreferences>(loadToastPrefs);
    const prefsRef = useRef(prefs);
    prefsRef.current = prefs;

    // Reload prefs when localStorage changes (from settings page)
    useEffect(() => {
        const onPrefsChange = () => setPrefs(loadToastPrefs());
        window.addEventListener('jjodel:toast-prefs-changed', onPrefsChange);
        return () => window.removeEventListener('jjodel:toast-prefs-changed', onPrefsChange);
    }, []);

    const addToast = useCallback((
        message: string,
        type: ToastType = 'info',
        options: ToastOptions = {},
    ) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const p = prefsRef.current;

        // Default dismiss mode: warning/error → manual, info/success → auto
        const dismiss = options.dismiss ?? (type === 'warning' || type === 'error' ? 'manual' : 'auto');

        const toast: ToastMessage = {
            id,
            priority: type,
            message,
            title: options.title,
            dismiss,
            duration: options.duration ?? p.autoDismissDuration,
        };

        setToasts(prev => [...prev.slice(-(MAX_TOASTS - 1)), toast]);
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearAll = useCallback(() => setToasts([]), []);

    const success = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'success', opts), [addToast]);
    const error = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'error', opts), [addToast]);
    const info = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'info', opts), [addToast]);
    const warning = useCallback((msg: string, opts?: ToastOptions) => addToast(msg, 'warning', opts), [addToast]);

    // Stable ref so event listeners always use latest addToast
    const addToastRef = useRef(addToast);
    addToastRef.current = addToast;

    // Listen to jjodel:guard-violation events
    useEffect(() => {
        const handler = (e: Event) => {
            if (!prefsRef.current.enableGuardViolations) return;
            const detail = (e as CustomEvent).detail;
            if (!detail || detail.allowed) return;
            addToastRef.current(
                detail.message || 'Conformance violation',
                'warning',
                { title: 'Guard Violation', dismiss: 'manual' },
            );
        };
        window.addEventListener('jjodel:guard-violation', handler);
        return () => window.removeEventListener('jjodel:guard-violation', handler);
    }, []);

    // Listen to jjodel:toast generic events
    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<JjodelToastDetail>).detail;
            if (!detail) return;

            // Check per-type preference
            const p = prefsRef.current;
            if (detail.priority === 'success' && !p.enableSuccess) return;
            if (detail.priority === 'info' && !p.enableInfo) return;

            addToastRef.current(detail.message, detail.priority, {
                title: detail.title,
                dismiss: detail.dismiss,
                duration: detail.duration,
            });
        };
        window.addEventListener('jjodel:toast', handler);
        return () => window.removeEventListener('jjodel:toast', handler);
    }, []);

    const value: ToastContextValue = {
        toasts, addToast, removeToast, clearAll,
        success, error, info, warning,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <ToastContainer
                toasts={toasts}
                onRemove={removeToast}
                position={prefs.position}
            />
        </ToastContext.Provider>
    );
};

export const useToastContext = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToastContext must be used within a ToastProvider');
    }
    return context;
};

export default ToastProvider;

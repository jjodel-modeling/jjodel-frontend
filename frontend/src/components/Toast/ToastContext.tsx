import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ToastContainer } from './ToastContainer';
import type { ToastType } from './Toast';
import type { ToastAction, ToastMessage, ToastPreferences, ToastDismiss, JjodelToastDetail } from './toastTypes';
import { loadToastPrefs } from './toastTypes';
import { JjodelEvents } from '../../events/registry';

interface ToastOptions {
    title?: ReactNode;
    duration?: number;
    dismiss?: ToastDismiss;
    action?: ToastAction;
}

interface ToastContextValue {
    toasts: ToastMessage[];
    addToast: (message: ReactNode, type?: ToastType, options?: ToastOptions) => string;
    removeToast: (id: string) => void;
    clearAll: () => void;
    success: (message: ReactNode, options?: ToastOptions) => string;
    error: (message: ReactNode, options?: ToastOptions) => string;
    info: (message: ReactNode, options?: ToastOptions) => string;
    warning: (message: ReactNode, options?: ToastOptions) => string;
}

const MAX_TOASTS = 5;
const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const [prefs, setPrefs] = useState<ToastPreferences>(loadToastPrefs);
    const prefsRef = useRef(prefs);
    prefsRef.current = prefs;

    useEffect(() => {
        const onPrefsChange = () => setPrefs(loadToastPrefs());
        window.addEventListener(JjodelEvents.TOAST_PREFS_CHANGED, onPrefsChange);
        return () => window.removeEventListener(JjodelEvents.TOAST_PREFS_CHANGED, onPrefsChange);
    }, []);

    const addToast = useCallback((
        message: ReactNode,
        type: ToastType = 'info',
        options: ToastOptions = {},
    ) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const typePref = prefsRef.current.types[type];
        const defaultDuration = typePref?.duration ?? 0;
        const requestedDuration = options.duration ?? defaultDuration;
        const dismiss: ToastDismiss = options.dismiss ?? (requestedDuration > 0 ? 'auto' : 'manual');

        const toast: ToastMessage = {
            id,
            priority: type,
            message,
            title: options.title,
            dismiss,
            duration: dismiss === 'auto' ? requestedDuration : undefined,
            timestamp: Date.now(),
            action: options.action,
        };

        setToasts(prev => [toast, ...prev].slice(0, MAX_TOASTS));
        return id;
    }, []);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const clearAll = useCallback(() => setToasts([]), []);

    const success = useCallback((msg: ReactNode, opts?: ToastOptions) => addToast(msg, 'success', opts), [addToast]);
    const error = useCallback((msg: ReactNode, opts?: ToastOptions) => addToast(msg, 'error', opts), [addToast]);
    const info = useCallback((msg: ReactNode, opts?: ToastOptions) => addToast(msg, 'info', opts), [addToast]);
    const warning = useCallback((msg: ReactNode, opts?: ToastOptions) => addToast(msg, 'warning', opts), [addToast]);

    const addToastRef = useRef(addToast);
    addToastRef.current = addToast;

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
        window.addEventListener(JjodelEvents.GUARD_VIOLATION, handler);
        return () => window.removeEventListener(JjodelEvents.GUARD_VIOLATION, handler);
    }, []);

    useEffect(() => {
        const handler = (e: Event) => {
            const detail = (e as CustomEvent<JjodelToastDetail>).detail;
            if (!detail) return;

            const typePref = prefsRef.current.types[detail.priority];
            if (typePref && !typePref.enabled) return;

            addToastRef.current(detail.message, detail.priority, {
                title: detail.title,
                dismiss: detail.dismiss,
                duration: detail.duration,
                action: detail.action,
            });
        };
        window.addEventListener(JjodelEvents.TOAST, handler);
        return () => window.removeEventListener(JjodelEvents.TOAST, handler);
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

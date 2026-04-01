import type { ReactNode } from 'react';

export type ToastPriority = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
export type ToastDismiss = 'auto' | 'manual';

export interface ToastMessage {
    id: string;
    priority: ToastPriority;
    title?: ReactNode;
    message: ReactNode;
    dismiss: ToastDismiss;
    duration?: number; // ms, only for auto-dismiss
}

export interface ToastPreferences {
    position: ToastPosition;
    autoDismissDuration: number; // ms
    enableGuardViolations: boolean;
    enableSuccess: boolean;
    enableInfo: boolean;
}

export const DEFAULT_TOAST_PREFS: ToastPreferences = {
    position: 'bottom-left',
    autoDismissDuration: 4000,
    enableGuardViolations: true,
    enableSuccess: true,
    enableInfo: true,
};

export const TOAST_PREFS_KEY = 'jjodel-toast-preferences';

export function loadToastPrefs(): ToastPreferences {
    try {
        const stored = localStorage.getItem(TOAST_PREFS_KEY);
        if (stored) return { ...DEFAULT_TOAST_PREFS, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return { ...DEFAULT_TOAST_PREFS };
}

export function saveToastPrefs(prefs: ToastPreferences): void {
    localStorage.setItem(TOAST_PREFS_KEY, JSON.stringify(prefs));
}

/** Detail payload for `jjodel:toast` CustomEvent */
export interface JjodelToastDetail {
    priority: ToastPriority;
    title?: ReactNode;
    message: ReactNode;
    dismiss?: ToastDismiss;
    duration?: number;
}

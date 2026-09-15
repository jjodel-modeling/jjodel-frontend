import type { ReactNode } from 'react';

export type ToastPriority = 'info' | 'success' | 'warning' | 'error';
export type ToastPosition = 'bottom-left' | 'bottom-right' | 'top-right' | 'top-left';
export type ToastDismiss = 'auto' | 'manual';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastMessage {
    id: string;
    priority: ToastPriority;
    title?: ReactNode;
    message: ReactNode;
    dismiss: ToastDismiss;
    duration?: number;
    timestamp: number;
    action?: ToastAction;
}

export interface ToastTypePref {
    enabled: boolean;
    duration: number;
}

export interface ToastPreferences {
    position: ToastPosition;
    types: Record<ToastPriority, ToastTypePref>;
    enableGuardViolations: boolean;
}

export const DEFAULT_TOAST_PREFS: ToastPreferences = {
    position: 'bottom-right',
    types: {
        info:    { enabled: true, duration: 5000 },
        success: { enabled: true, duration: 3000 },
        warning: { enabled: true, duration: 0 },
        error:   { enabled: true, duration: 0 },
    },
    enableGuardViolations: true,
};

export const TOAST_PREFS_KEY = 'jjodel-toast-preferences';

interface LegacyToastPreferences {
    position?: ToastPosition;
    autoDismissDuration?: number;
    enableGuardViolations?: boolean;
    enableSuccess?: boolean;
    enableInfo?: boolean;
}

function migrateLegacy(raw: unknown): ToastPreferences {
    const r = raw as Partial<ToastPreferences> & LegacyToastPreferences;
    if (r && typeof r === 'object' && r.types && typeof r.types === 'object') {
        return {
            position: r.position ?? DEFAULT_TOAST_PREFS.position,
            types: {
                info:    { ...DEFAULT_TOAST_PREFS.types.info,    ...r.types.info },
                success: { ...DEFAULT_TOAST_PREFS.types.success, ...r.types.success },
                warning: { ...DEFAULT_TOAST_PREFS.types.warning, ...r.types.warning },
                error:   { ...DEFAULT_TOAST_PREFS.types.error,   ...r.types.error },
            },
            enableGuardViolations: r.enableGuardViolations ?? DEFAULT_TOAST_PREFS.enableGuardViolations,
        };
    }
    const legacyDuration = r?.autoDismissDuration;
    return {
        position: r?.position ?? DEFAULT_TOAST_PREFS.position,
        types: {
            info:    { enabled: r?.enableInfo    ?? true, duration: legacyDuration ?? DEFAULT_TOAST_PREFS.types.info.duration },
            success: { enabled: r?.enableSuccess ?? true, duration: legacyDuration ?? DEFAULT_TOAST_PREFS.types.success.duration },
            warning: { enabled: true, duration: DEFAULT_TOAST_PREFS.types.warning.duration },
            error:   { enabled: true, duration: DEFAULT_TOAST_PREFS.types.error.duration },
        },
        enableGuardViolations: r?.enableGuardViolations ?? DEFAULT_TOAST_PREFS.enableGuardViolations,
    };
}

export function loadToastPrefs(): ToastPreferences {
    try {
        const stored = localStorage.getItem(TOAST_PREFS_KEY);
        if (stored) return migrateLegacy(JSON.parse(stored));
    } catch { /* ignore */ }
    return JSON.parse(JSON.stringify(DEFAULT_TOAST_PREFS));
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
    action?: ToastAction;
}

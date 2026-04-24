import type { ToastAction, ToastDismiss, ToastPriority } from './toastTypes';
import { JjodelEvents } from '../../events/registry';

/**
 * Standalone toast function — drop-in replacement for U.alert().
 * Dispatches a CustomEvent consumed by ToastProvider.
 * Usable anywhere (no React context required).
 *
 * String formats (uses £ separator, like U.alert):
 *   toast('message')                → info, auto-dismiss
 *   toast('message£i')              → info
 *   toast('message£s')              → success
 *   toast('message£w')              → warning
 *   toast('message£e')              → error
 *   toast('title£message£i')        → info with title
 *
 * Object format:
 *   toast({ message: 'Done', priority: 'success' })
 *   toast({ message: 'Failed', priority: 'error', title: 'Error', action: { label: 'Retry', onClick: ... } })
 */

const TYPE_MAP: Record<string, ToastPriority> = {
    'i': 'info',
    's': 'success',
    'w': 'warning',
    'e': 'error',
};

interface ToastInputOptions {
    message: string;
    priority?: ToastPriority;
    title?: string;
    duration?: number;
    dismiss?: ToastDismiss;
    action?: ToastAction;
}

interface ToastShortOptions {
    title?: string;
    duration?: number;
    dismiss?: ToastDismiss;
    action?: ToastAction;
}

function dispatch(detail: {
    message: string;
    priority: ToastPriority;
    title?: string;
    duration?: number;
    dismiss?: ToastDismiss;
    action?: ToastAction;
}): void {
    window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, { detail }));
}

interface ToastFn {
    (input: string | ToastInputOptions): void;
    info:    (message: string, opts?: string | ToastShortOptions) => void;
    success: (message: string, opts?: string | ToastShortOptions) => void;
    warning: (message: string, opts?: string | ToastShortOptions) => void;
    error:   (message: string, opts?: string | ToastShortOptions) => void;
}

function normalizeShort(opts?: string | ToastShortOptions): ToastShortOptions {
    if (!opts) return {};
    if (typeof opts === 'string') return { title: opts };
    return opts;
}

export const toast: ToastFn = ((input: string | ToastInputOptions): void => {
    let title: string | undefined;
    let message: string;
    let priority: ToastPriority = 'info';
    let duration: number | undefined;
    let dismiss: ToastDismiss | undefined;
    let action: ToastAction | undefined;

    if (typeof input === 'string') {
        const parts = input.split('£');
        if (parts.length === 1) {
            message = parts[0];
        } else if (parts.length === 2) {
            if (parts[1].length === 1 && TYPE_MAP[parts[1]]) {
                message = parts[0];
                priority = TYPE_MAP[parts[1]];
            } else {
                title = parts[0];
                message = parts[1];
            }
        } else {
            title = parts[0];
            message = parts[1];
            priority = TYPE_MAP[parts[2]] || 'info';
        }
    } else {
        message = input.message;
        priority = input.priority || 'info';
        title = input.title;
        duration = input.duration;
        dismiss = input.dismiss;
        action = input.action;
    }

    dispatch({ message, priority, title, duration, dismiss, action });
}) as ToastFn;

toast.info = (message, opts) => {
    const o = normalizeShort(opts);
    dispatch({ message, priority: 'info', ...o });
};
toast.success = (message, opts) => {
    const o = normalizeShort(opts);
    dispatch({ message, priority: 'success', ...o });
};
toast.warning = (message, opts) => {
    const o = normalizeShort(opts);
    dispatch({ message, priority: 'warning', ...o });
};
toast.error = (message, opts) => {
    const o = normalizeShort(opts);
    dispatch({ message, priority: 'error', ...o });
};

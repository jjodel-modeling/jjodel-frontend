import type { ToastPriority, ToastDismiss } from './toastTypes';
import { JjodelEvents } from '../../events/registry';

/**
 * Standalone toast function — drop-in replacement for U.alert().
 * Dispatches a CustomEvent consumed by ToastProvider.
 * Usable anywhere (no React context required).
 *
 * String formats (uses £ separator, like U.alert):
 *   toast('message')                → info, auto-dismiss
 *   toast('message£i')              → info, auto-dismiss
 *   toast('message£s')              → success, auto-dismiss
 *   toast('message£w')              → warning, manual dismiss
 *   toast('message£e')              → error, manual dismiss
 *   toast('title£message£i')        → info with title
 *   toast('title£message£e')        → error with title
 *
 * Object format:
 *   toast({ message: 'Done', priority: 'success' })
 *   toast({ message: 'Failed', priority: 'error', title: 'Error' })
 */

const TYPE_MAP: Record<string, ToastPriority> = {
    'i': 'info',
    's': 'success',
    'w': 'warning',
    'e': 'error',
};

const AUTO_DISMISS_TYPES: Set<ToastPriority> = new Set(['info', 'success']);

interface ToastOptions {
    message: string;
    priority?: ToastPriority;
    title?: string;
    duration?: number;
    dismiss?: ToastDismiss;
}

export function toast(input: string | ToastOptions): void {
    let title: string | undefined;
    let message: string;
    let priority: ToastPriority = 'info';
    let duration: number | undefined;
    let dismiss: ToastDismiss | undefined;

    if (typeof input === 'string') {
        const parts = input.split('£');

        if (parts.length === 1) {
            // 'message' → info
            message = parts[0];
        } else if (parts.length === 2) {
            if (parts[1].length === 1 && TYPE_MAP[parts[1]]) {
                // 'message£type'
                message = parts[0];
                priority = TYPE_MAP[parts[1]];
            } else {
                // 'title£message' → info
                title = parts[0];
                message = parts[1];
            }
        } else {
            // 'title£message£type' (3+ parts)
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
    }

    if (!dismiss) {
        dismiss = AUTO_DISMISS_TYPES.has(priority) ? 'auto' : 'manual';
    }

    window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST, {
        detail: { message, priority, title, dismiss, duration },
    }));
}

/** Shorthand helpers matching U.alert() type codes */
toast.info = (message: string, title?: string) =>
    toast({ message, priority: 'info', title });

toast.success = (message: string, title?: string) =>
    toast({ message, priority: 'success', title });

toast.warning = (message: string, title?: string) =>
    toast({ message, priority: 'warning', title });

toast.error = (message: string, title?: string) =>
    toast({ message, priority: 'error', title });

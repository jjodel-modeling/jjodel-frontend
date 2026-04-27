/**
 * NotificationCenter Component
 * Popover anchored to the StatusBar bell icon. Renders the persistent toast
 * history (warning + error) backed by `toastHistory` (localStorage-backed).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toastHistory, type HistoryEntry } from './Toast/toastHistory';
import { formatRelativeTime } from './Toast/useRelativeTime';
import { JjodelEvents } from '../events/registry';
import './NotificationCenter.scss';

const ASK_JJODIE_PROMPT = (message: string) =>
    `Can you explain this error and how to fix it?\n\n"${message}"`;

const ICON_MAP: Record<HistoryEntry['type'], string> = {
    warning: 'bi-exclamation-triangle-fill',
    error: 'bi-x-circle-fill',
};

interface NotificationCenterProps {
    open: boolean;
    onClose: () => void;
    anchorRef?: React.RefObject<HTMLElement>;
}

export function useToastHistorySnapshot(): { entries: HistoryEntry[]; unreadCount: number } {
    const [entries, setEntries] = useState<HistoryEntry[]>(() => toastHistory.getAll());

    useEffect(() => {
        const refresh = () => setEntries(toastHistory.getAll());
        window.addEventListener(JjodelEvents.HISTORY_CHANGED, refresh);
        window.addEventListener('storage', refresh);
        return () => {
            window.removeEventListener(JjodelEvents.HISTORY_CHANGED, refresh);
            window.removeEventListener('storage', refresh);
        };
    }, []);

    const unreadCount = entries.reduce((acc, e) => acc + (e.read ? 0 : 1), 0);
    return { entries, unreadCount };
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ open, onClose, anchorRef }) => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const { entries } = useToastHistorySnapshot();

    useEffect(() => {
        if (!open) return;

        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            if (popoverRef.current?.contains(target)) return;
            if (anchorRef?.current?.contains(target)) return;
            onClose();
        };

        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [open, onClose, anchorRef]);

    useEffect(() => {
        if (open) {
            // Mark unread as read shortly after opening so badge clears.
            const t = setTimeout(() => toastHistory.markAllRead(), 250);
            return () => clearTimeout(t);
        }
    }, [open]);

    useEffect(() => {
        window.dispatchEvent(
            new CustomEvent(JjodelEvents.NOTIFICATIONS_POPOVER_TOGGLE, { detail: { open } })
        );
    }, [open]);

    const handleClearAll = useCallback(() => {
        toastHistory.clearAll();
    }, []);

    const handleAskJjodie = useCallback((entry: HistoryEntry) => {
        const messageStr = typeof entry.message === 'string' ? entry.message : String(entry.message);
        const prompt = ASK_JJODIE_PROMPT(messageStr);
        onClose();
        window.dispatchEvent(
            new CustomEvent(JjodelEvents.JODIE_PREFILL_AND_OPEN, { detail: { prompt } })
        );
    }, [onClose]);

    if (!open) return null;

    const handleRemove = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        toastHistory.remove(id);
    };

    return (
        <div className="app-notif-popover" ref={popoverRef} role="dialog" aria-label="Notifications">
            <div className="app-notif-popover__header">
                <span className="app-notif-popover__title">
                    Notifications
                    {entries.length > 0 && (
                        <span className="app-notif-popover__count"> ({entries.length})</span>
                    )}
                </span>
                {entries.length > 0 && (
                    <button
                        type="button"
                        className="app-notif-popover__clear"
                        onClick={handleClearAll}
                    >
                        Clear all
                    </button>
                )}
            </div>

            <div className="app-notif-popover__list">
                {entries.length === 0 ? (
                    <div className="app-notif-popover__empty">No notifications yet</div>
                ) : (
                    entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`app-notif-popover__item app-notif-popover__item--${entry.type}${entry.read ? '' : ' app-notif-popover__item--unread'}`}
                        >
                            <i className={`bi ${ICON_MAP[entry.type]} app-notif-popover__icon app-notif-popover__icon--${entry.type}`} />
                            <div className="app-notif-popover__body">
                                {entry.title && (
                                    <div className="app-notif-popover__item-title">
                                        <span className="app-notif-popover__item-unread-dot" aria-hidden="true" />
                                        {entry.title}
                                    </div>
                                )}
                                <div className="app-notif-popover__item-desc">{entry.message}</div>
                                {entry.type === 'error' && (
                                    <button
                                        type="button"
                                        className="app-notif-popover__item-ask-jjodie"
                                        onClick={() => handleAskJjodie(entry)}
                                    >
                                        Need help? Ask Jjodie
                                    </button>
                                )}
                                <div
                                    className="app-notif-popover__item-time"
                                    title={new Date(entry.timestamp).toLocaleString()}
                                >
                                    {formatRelativeTime(entry.timestamp)}
                                </div>
                            </div>
                            <button
                                type="button"
                                className="app-notif-popover__item-close"
                                onClick={(e) => handleRemove(entry.id, e)}
                                aria-label="Remove notification"
                            >
                                <i className="bi bi-x" />
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;

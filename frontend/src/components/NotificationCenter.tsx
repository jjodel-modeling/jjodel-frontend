/**
 * NotificationCenter Component
 * Popover anchored to the StatusBar bell icon. Renders the persistent toast
 * history (warning + error) backed by `toastHistory` (localStorage-backed).
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import { toastHistory, type HistoryEntry } from './Toast/toastHistory';
import { formatRelativeTime } from './Toast/useRelativeTime';
import { JjodelEvents } from '../events/registry';
import './NotificationCenter.scss';

const ASK_JJODIE_PROMPT = (message: string) =>
    `Can you explain this error and how to fix it?\n\n"${message}"`;

// Kept in sync with NotificationCenter.scss (`width`, `max-height` on .app-notif-popover).
const POPOVER_W = 320;
const POPOVER_MAX_H = 360;

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
    const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
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

    // Anchored from the bell's own rect, since the portal removes it from the bell's
    // layout flow. Opens upward, so the gap is the popover's *own* height plus the 6px
    // that `bottom: calc(100% + 6px)` used to compose. The height is measured after
    // mount, not taken from `max-height`: the list is short when there is little in it,
    // and using the cap would float the box hundreds of pixels above the bell.
    useLayoutEffect(() => {
        if (!open) return;
        const anchor = anchorRef?.current;
        if (!anchor) return;
        const place = () => {
            const r = anchor.getBoundingClientRect();
            const h = popoverRef.current?.offsetHeight || POPOVER_MAX_H;
            setPos({ top: r.top - h - 6, left: r.right - POPOVER_W });
        };
        place();
        window.addEventListener('resize', place);
        return () => window.removeEventListener('resize', place);
    }, [open, anchorRef, entries.length]);

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

    // Portalled onto document.body, like Navbar.tsx's tab-overflow menu. The reason is
    // not the status bar: #root is position:fixed (index.scss:31) and therefore a
    // stacking context, while the rail's overlay is its *sibling* at z-index 900. Any
    // z-index written inside #root loses to it, six digits included. Outside #root the
    // comparison is real and --z-dropdown-menu wins. See
    // docs/discovery/discovery_2026-08-21_z_index_popup_rail.md.
    return ReactDOM.createPortal(
        <div
            className="app-notif-popover"
            ref={popoverRef}
            role="dialog"
            aria-label="Notifications"
            style={{ top: pos.top, left: pos.left }}
        >
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
        </div>,
        document.body
    );
};

export default NotificationCenter;

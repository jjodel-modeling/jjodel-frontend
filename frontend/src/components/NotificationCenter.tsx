/**
 * NotificationCenter Component
 * Popover that displays notifications, anchored to the bell icon in the StatusBar.
 * Minimal initial implementation — real notifications will be wired later.
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import './NotificationCenter.scss';

// --- Types ---

export interface Notification {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    description?: string;
    timestamp: Date;
    read: boolean;
}

interface NotificationsState {
    notifications: Notification[];
    unreadCount: number;
    markAsRead: (id: string) => void;
    markAllRead: () => void;
    clearAll: () => void;
    addNotification: (n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
}

// --- Hook ---

const SAMPLE_NOTIFICATIONS: Notification[] = [
    {
        id: 'sample-1',
        type: 'info',
        title: 'Welcome to Jjodel',
        description: 'Start by creating a metamodel.',
        timestamp: new Date(Date.now() - 60_000 * 5),
        read: false,
    },
];

export function useNotifications(): NotificationsState {
    const [notifications, setNotifications] = useState<Notification[]>(SAMPLE_NOTIFICATIONS);

    const unreadCount = notifications.filter(n => !n.read).length;

    const markAsRead = useCallback((id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const addNotification = useCallback((n: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotif: Notification = {
            ...n,
            id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date(),
            read: false,
        };
        setNotifications(prev => [newNotif, ...prev]);
    }, []);

    return { notifications, unreadCount, markAsRead, markAllRead, clearAll, addNotification };
}

// --- Helpers ---

const ICON_MAP: Record<Notification['type'], string> = {
    success: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    error: 'bi-x-circle-fill',
    info: 'bi-info-circle-fill',
};

function relativeTime(date: Date): string {
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

// --- Component ---

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
    onClose: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
    notifications,
    onMarkAsRead,
    onClearAll,
    onClose,
}) => {
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    return (
        <div className="app-notif-popover" ref={ref}>
            <div className="app-notif-popover__header">
                <span className="app-notif-popover__title">Notifications</span>
                {notifications.length > 0 && (
                    <button className="app-notif-popover__clear" onClick={onClearAll}>
                        Clear all
                    </button>
                )}
            </div>

            <div className="app-notif-popover__list">
                {notifications.length === 0 ? (
                    <div className="app-notif-popover__empty">No notifications</div>
                ) : (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            className={`app-notif-popover__item ${n.read ? '' : 'app-notif-popover__item--unread'}`}
                            onClick={() => onMarkAsRead(n.id)}
                        >
                            <i className={`bi ${ICON_MAP[n.type]} app-notif-popover__icon app-notif-popover__icon--${n.type}`} />
                            <div className="app-notif-popover__body">
                                <div className="app-notif-popover__item-title">{n.title}</div>
                                {n.description && (
                                    <div className="app-notif-popover__item-desc">{n.description}</div>
                                )}
                                <div className="app-notif-popover__item-time">{relativeTime(n.timestamp)}</div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationCenter;

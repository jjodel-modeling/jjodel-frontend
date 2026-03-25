/**
 * StatusBarRightZone — shared right-zone items used by both the app StatusBar
 * and the JjTL editor status bar.
 *
 * Renders: Basic/Advanced toggle, Jjodie AI status, Notification bell, Version.
 *
 * @param variant 'light' (default, app StatusBar) | 'dark' (JjTL status bar)
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { DState } from '../joiner';
import { useInterfaceMode } from '../hooks/useInterfaceMode';
import { JodieConfigService } from '../services/JodieConfig';
import { useSettingsModalSafe } from '../contexts/SettingsModalContext';
import NotificationCenter, { useNotifications } from './NotificationCenter';
import './StatusBarRightZone.scss';

interface StatusBarRightZoneProps {
    variant?: 'light' | 'dark';
}

const StatusBarRightZone: React.FC<StatusBarRightZoneProps> = ({ variant = 'light' }) => {
    const { mode, toggleMode } = useInterfaceMode();
    const settingsModal = useSettingsModalSafe();
    const { notifications, unreadCount, markAsRead, clearAll } = useNotifications();
    const [showNotifications, setShowNotifications] = useState(false);
    const [aiConnected, setAiConnected] = useState(() => JodieConfigService.hasValidConfiguration());

    const engineVersion = useSelector((state: DState) => {
        const v = (state as any).version;
        return v?.n ? `v${v.n}` : 'v2.0';
    });

    // Listen for AI provider config changes
    useEffect(() => {
        const handler = () => setAiConnected(JodieConfigService.hasValidConfiguration());
        window.addEventListener('ai-provider-changed', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('ai-provider-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const handleToggleNotifications = useCallback(() => {
        setShowNotifications(prev => !prev);
    }, []);

    const handleCloseNotifications = useCallback(() => {
        setShowNotifications(false);
    }, []);

    const handleJjodieClick = useCallback(() => {
        settingsModal?.openSettings('providers');
    }, [settingsModal]);

    const isDark = variant === 'dark';

    return (
        <div className={`sb-rz${isDark ? ' sb-rz--dark' : ''}`}>
            {/* Basic / Advanced toggle */}
            <button
                className={`sb-rz__mode ${mode === 'advanced' ? 'sb-rz__mode--adv' : ''}`}
                onClick={toggleMode}
                title={`Switch to ${mode === 'basic' ? 'Advanced' : 'Basic'} mode`}
            >
                {mode === 'basic' ? 'Basic' : 'Advanced'}
            </button>

            <span className="sb-rz__sep" />

            {/* Jjodie AI status */}
            <button
                className="sb-rz__jjodie"
                onClick={handleJjodieClick}
                title={aiConnected ? 'AI connected \u2014 Open settings' : 'AI not configured \u2014 Open settings'}
            >
                <span className={`sb-rz__jjodie-icon ${aiConnected ? '' : 'sb-rz__jjodie-icon--off'}`}>
                    <i className="bi bi-robot" />
                    <span className={`sb-rz__dot ${aiConnected ? 'sb-rz__dot--green' : 'sb-rz__dot--gray'}`} />
                </span>
            </button>

            <span className="sb-rz__sep" />

            {/* Notifications bell */}
            <div className="sb-rz__bell-wrapper">
                <button
                    className="sb-rz__bell"
                    onClick={handleToggleNotifications}
                    title="Notifications"
                >
                    <i className="bi bi-bell-fill" />
                    {unreadCount > 0 && <span className="sb-rz__bell-dot" />}
                </button>

                {showNotifications && (
                    <NotificationCenter
                        notifications={notifications}
                        onMarkAsRead={markAsRead}
                        onClearAll={clearAll}
                        onClose={handleCloseNotifications}
                    />
                )}
            </div>

            <span className="sb-rz__sep" />

            {/* Version */}
            <span className="sb-rz__version">{engineVersion}</span>
        </div>
    );
};

export default StatusBarRightZone;

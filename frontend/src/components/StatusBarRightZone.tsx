/**
 * StatusBarRightZone — shared right-zone items used by both the app StatusBar
 * and the JjTL editor status bar.
 *
 * Renders: Basic/Advanced toggle, Jjodie AI status, Notification bell, Version.
 *
 * @param variant 'light' (default, app StatusBar) | 'dark' (JjTL status bar)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { DState } from '../joiner';
import { useInterfaceMode } from '../hooks/useInterfaceMode';
import { useSettingsModalSafe } from '../contexts/SettingsModalContext';
import NotificationCenter, { useToastHistorySnapshot } from './NotificationCenter';
import './StatusBarRightZone.scss';
import { AIConfig, JodieConfig } from "../types/jodie";
import { AIEvents } from '../events/registry';
import { VERSION_LABEL, VERSION_FULL_BASE } from '../version';

interface StatusBarRightZoneProps {
    variant?: 'light' | 'dark';
}

const StatusBarRightZone: React.FC<StatusBarRightZoneProps> = ({ variant = 'light' }) => {
    const { mode, toggleMode } = useInterfaceMode();
    const settingsModal = useSettingsModalSafe();
    const { unreadCount } = useToastHistorySnapshot();
    const [showNotifications, setShowNotifications] = useState(false);
    const [aiConnected, setAiConnected] = useState(() => JodieConfig.hasEnabledProviders());
    const bellRef = useRef<HTMLButtonElement>(null);

    const schemaVersion = useSelector((state: DState) => (state as any).version?.n);

    useEffect(() => {
        const handler = () => setAiConnected(JodieConfig.hasEnabledProviders());
        window.addEventListener(AIEvents.PROVIDER_CHANGED, handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener(AIEvents.PROVIDER_CHANGED, handler);
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
    const badgeLabel = unreadCount > 99 ? '99+' : String(unreadCount);
    const versionTitle = schemaVersion
        ? `${VERSION_FULL_BASE} · schema ${schemaVersion}`
        : VERSION_FULL_BASE;

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
                title={aiConnected ? 'AI connected — Open settings' : 'AI not configured — Open settings'}
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
                    ref={bellRef}
                    className="sb-rz__bell"
                    onClick={handleToggleNotifications}
                    aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
                    title="Notifications"
                >
                    <i className="bi bi-bell-fill" />
                    {unreadCount > 0 && (
                        <span className="sb-rz__bell-badge">{badgeLabel}</span>
                    )}
                </button>

                <NotificationCenter
                    open={showNotifications}
                    onClose={handleCloseNotifications}
                    anchorRef={bellRef}
                />
            </div>

            <span className="sb-rz__sep" />

            {/* Version */}
            <span className="sb-rz__version" title={versionTitle}>{VERSION_LABEL}</span>
        </div>
    );
};

export default StatusBarRightZone;

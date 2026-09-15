/**
 * NotificationsSection Component
 * Toast notification preferences (per-type enabled + duration, position, guard violations).
 * Persists to localStorage 'jjodel-toast-preferences' and dispatches JjodelEvents.TOAST_PREFS_CHANGED.
 */

import React, { useCallback, useState } from 'react';
import {
    DEFAULT_TOAST_PREFS,
    loadToastPrefs,
    saveToastPrefs,
    toast,
    type ToastPosition,
    type ToastPreferences,
    type ToastPriority,
} from '../../../Toast';
import { JjodelEvents } from '../../../../events/registry';

const DURATION_OPTIONS: Array<{ value: number; label: string }> = [
    { value: 1000,  label: '1 second' },
    { value: 3000,  label: '3 seconds' },
    { value: 5000,  label: '5 seconds' },
    { value: 10000, label: '10 seconds' },
    { value: 30000, label: '30 seconds' },
    { value: 0,     label: 'Persistent' },
];

const POSITION_OPTIONS: Array<{ value: ToastPosition; label: string }> = [
    { value: 'bottom-right', label: 'Bottom right' },
    { value: 'bottom-left',  label: 'Bottom left' },
    { value: 'top-right',    label: 'Top right' },
    { value: 'top-left',     label: 'Top left' },
];

const TYPE_META: Array<{ id: ToastPriority; label: string; icon: string; description: string }> = [
    { id: 'info',    label: 'Info',    icon: 'bi-info-circle-fill',          description: 'General announcements and tips.' },
    { id: 'success', label: 'Success', icon: 'bi-check-circle-fill',         description: 'Confirmations of completed actions.' },
    { id: 'warning', label: 'Warning', icon: 'bi-exclamation-triangle-fill', description: 'Issues that need attention but allow continuing.' },
    { id: 'error',   label: 'Error',   icon: 'bi-x-circle-fill',             description: 'Failures that block the current action.' },
];

function clonePrefs(p: ToastPreferences): ToastPreferences {
    return JSON.parse(JSON.stringify(p));
}

export function NotificationsSection(): JSX.Element {
    const [prefs, setPrefs] = useState<ToastPreferences>(() => loadToastPrefs());
    const [isDirty, setIsDirty] = useState(false);

    const persist = useCallback((next: ToastPreferences) => {
        setPrefs(next);
        setIsDirty(true);
        saveToastPrefs(next);
        window.dispatchEvent(new CustomEvent(JjodelEvents.TOAST_PREFS_CHANGED));
    }, []);

    const updateType = useCallback((id: ToastPriority, patch: Partial<ToastPreferences['types'][ToastPriority]>) => {
        const next = clonePrefs(prefs);
        next.types[id] = { ...next.types[id], ...patch };
        persist(next);
    }, [prefs, persist]);

    const updatePosition = useCallback((position: ToastPosition) => {
        persist({ ...clonePrefs(prefs), position });
    }, [prefs, persist]);

    const updateGuardViolations = useCallback((enabled: boolean) => {
        persist({ ...clonePrefs(prefs), enableGuardViolations: enabled });
    }, [prefs, persist]);

    const handleReset = useCallback(() => {
        const fresh = clonePrefs(DEFAULT_TOAST_PREFS);
        persist(fresh);
        toast.info('Notification preferences reset to defaults.');
    }, [persist]);

    const handleTestToast = useCallback((id: ToastPriority) => {
        switch (id) {
            case 'info':    toast.info('This is a sample info notification.', { title: 'Sample info' }); break;
            case 'success': toast.success('This is a sample success notification.', { title: 'Sample success' }); break;
            case 'warning': toast.warning('This is a sample warning notification.', { title: 'Sample warning' }); break;
            case 'error':   toast.error('This is a sample error notification.', { title: 'Sample error' }); break;
        }
    }, []);

    return (
        <div className="notifications-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Notifications</h3>
                    <p className="settings-section-description">
                        Customize toast notifications: per-type behavior, position, and conformance feedback.
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Saved
                    </span>
                )}
            </div>

            <div className="settings-card">
                <div className="settings-card-header">
                    <h4 className="settings-card-title">Position</h4>
                </div>
                <div className="settings-form-row">
                    <label className="settings-field">
                        <span className="settings-field-label">Toast position</span>
                        <select
                            className="settings-field-select"
                            value={prefs.position}
                            onChange={(e) => updatePosition(e.target.value as ToastPosition)}
                        >
                            {POSITION_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </label>
                </div>
            </div>

            {TYPE_META.map(meta => {
                const pref = prefs.types[meta.id];
                return (
                    <div key={meta.id} className="settings-card">
                        <div className="settings-card-header">
                            <h4 className="settings-card-title">
                                <i className={`bi ${meta.icon}`} style={{ marginRight: 8 }} />
                                {meta.label}
                            </h4>
                            <button
                                type="button"
                                className="settings-btn-secondary"
                                onClick={() => handleTestToast(meta.id)}
                            >
                                Test
                            </button>
                        </div>
                        <p className="settings-section-description">{meta.description}</p>

                        <label className="settings-toggle">
                            <span>Enabled</span>
                            <input
                                type="checkbox"
                                checked={pref.enabled}
                                onChange={(e) => updateType(meta.id, { enabled: e.target.checked })}
                            />
                        </label>

                        <div className="settings-form-row">
                            <label className="settings-field">
                                <span className="settings-field-label">Auto-dismiss after</span>
                                <select
                                    className="settings-field-select"
                                    value={pref.duration}
                                    disabled={!pref.enabled}
                                    onChange={(e) => updateType(meta.id, { duration: Number(e.target.value) })}
                                >
                                    {DURATION_OPTIONS.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            </label>
                        </div>
                    </div>
                );
            })}

            <div className="settings-card">
                <div className="settings-card-header">
                    <h4 className="settings-card-title">Conformance</h4>
                </div>
                <label className="settings-toggle">
                    <span>Show guard violation warnings</span>
                    <input
                        type="checkbox"
                        checked={prefs.enableGuardViolations}
                        onChange={(e) => updateGuardViolations(e.target.checked)}
                    />
                </label>
                <p className="settings-section-description">
                    Display a warning toast when an action would violate the active conformance rules.
                </p>
            </div>

            <div className="settings-divider" />

            <button type="button" className="settings-btn-secondary" onClick={handleReset}>
                <i className="bi bi-arrow-counterclockwise" style={{ marginRight: 6 }} />
                Reset to defaults
            </button>
        </div>
    );
}

export default NotificationsSection;

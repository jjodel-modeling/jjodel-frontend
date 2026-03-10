import { useState, useCallback } from 'react';
import type { ToastPosition, ToastPreferences } from '../../components/Toast/toastTypes';
import { loadToastPrefs, saveToastPrefs } from '../../components/Toast/toastTypes';
import { useTheme } from '../../services/ThemeService';

export function AppearanceSettings() {
    const [theme, setTheme] = useTheme();

    // ── Toast preferences ──
    const [toastPrefs, setToastPrefs] = useState<ToastPreferences>(loadToastPrefs);

    const updateToastPref = useCallback(<K extends keyof ToastPreferences>(key: K, value: ToastPreferences[K]) => {
        setToastPrefs(prev => {
            const next = { ...prev, [key]: value };
            saveToastPrefs(next);
            window.dispatchEvent(new CustomEvent('jjodel:toast-prefs-changed'));
            return next;
        });
    }, []);

    const POSITION_OPTIONS: { value: ToastPosition; label: string }[] = [
        { value: 'bottom-left', label: 'Bottom Left' },
        { value: 'bottom-right', label: 'Bottom Right' },
        { value: 'top-right', label: 'Top Right' },
        { value: 'top-left', label: 'Top Left' },
    ];

    const DURATION_OPTIONS = [
        { value: 2000, label: '2 seconds' },
        { value: 4000, label: '4 seconds' },
        { value: 8000, label: '8 seconds' },
    ];

    return (
        <div className="settings-section-content">
            {/* Theme Selection */}
            <div className="settings-group">
                <label className="settings-label">Theme</label>
                <div className="theme-options">
                    <label className={`theme-option ${theme === 'light' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="theme"
                            value="light"
                            checked={theme === 'light'}
                            onChange={() => setTheme('light')}
                        />
                        <div className="theme-preview theme-preview-light">
                            <div className="preview-header" />
                            <div className="preview-sidebar" />
                            <div className="preview-content" />
                        </div>
                        <span className="theme-label">
                            <i className="bi bi-sun" />
                            Light
                        </span>
                    </label>

                    <label className={`theme-option ${theme === 'dark' ? 'active' : ''}`}>
                        <input
                            type="radio"
                            name="theme"
                            value="dark"
                            checked={theme === 'dark'}
                            onChange={() => setTheme('dark')}
                        />
                        <div className="theme-preview theme-preview-dark">
                            <div className="preview-header" />
                            <div className="preview-sidebar" />
                            <div className="preview-content" />
                        </div>
                        <span className="theme-label">
                            <i className="bi bi-moon" />
                            Dark
                        </span>
                    </label>
                </div>
            </div>

            <div className="settings-divider" />

            {/* Notifications */}
            <div className="settings-group">
                <label className="settings-label">Notifications</label>

                {/* Position */}
                <div className="settings-row" style={{ marginBottom: 12 }}>
                    <span className="settings-row-label">Position</span>
                    <select
                        className="settings-select"
                        value={toastPrefs.position}
                        onChange={e => updateToastPref('position', e.target.value as ToastPosition)}
                    >
                        {POSITION_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Auto-dismiss duration */}
                <div className="settings-row" style={{ marginBottom: 16 }}>
                    <span className="settings-row-label">Auto-dismiss after</span>
                    <select
                        className="settings-select"
                        value={toastPrefs.autoDismissDuration}
                        onChange={e => updateToastPref('autoDismissDuration', Number(e.target.value))}
                    >
                        {DURATION_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                    </select>
                </div>

                {/* Toggle: Guard violations */}
                <div
                    className="settings-toggle"
                    onClick={() => updateToastPref('enableGuardViolations', !toastPrefs.enableGuardViolations)}
                >
                    <div className="settings-toggle-content">
                        <div className="settings-toggle-title">Guard violations</div>
                        <div className="settings-toggle-description">
                            Show warnings when conformance bounds are exceeded
                        </div>
                    </div>
                    <div className={`settings-toggle-switch ${toastPrefs.enableGuardViolations ? 'active' : ''}`}>
                        <div className="settings-toggle-thumb" />
                    </div>
                </div>

                {/* Toggle: Success messages */}
                <div
                    className="settings-toggle"
                    onClick={() => updateToastPref('enableSuccess', !toastPrefs.enableSuccess)}
                >
                    <div className="settings-toggle-content">
                        <div className="settings-toggle-title">Success messages</div>
                        <div className="settings-toggle-description">
                            Show confirmation when operations complete successfully
                        </div>
                    </div>
                    <div className={`settings-toggle-switch ${toastPrefs.enableSuccess ? 'active' : ''}`}>
                        <div className="settings-toggle-thumb" />
                    </div>
                </div>

                {/* Toggle: Info messages */}
                <div
                    className="settings-toggle"
                    onClick={() => updateToastPref('enableInfo', !toastPrefs.enableInfo)}
                >
                    <div className="settings-toggle-content">
                        <div className="settings-toggle-title">Info messages</div>
                        <div className="settings-toggle-description">
                            Show informational notifications and tips
                        </div>
                    </div>
                    <div className={`settings-toggle-switch ${toastPrefs.enableInfo ? 'active' : ''}`}>
                        <div className="settings-toggle-thumb" />
                    </div>
                </div>
            </div>

            <div className="settings-divider" />

            {/* Future options placeholder */}
            <div className="settings-group">
                <label className="settings-label">Coming Soon</label>
                <div className="coming-soon-notice">
                    <i className="bi bi-clock-history" />
                    <div>
                        <p>More appearance options are on the way:</p>
                        <ul>
                            <li>Custom accent colors</li>
                            <li>Font size preferences</li>
                            <li>Canvas grid settings</li>
                            <li>Compact mode</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AppearanceSettings;

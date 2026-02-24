import React, { useState, useEffect } from 'react';

export function AppearanceSettings({onDirtyChange}: {onDirtyChange?:((b:boolean)=>any)}) {
    const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
        const stored = localStorage.getItem('theme');
        if (stored === 'dark' || stored === 'light') return stored;
        return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
    });

    const setTheme = (newTheme: 'light' | 'dark') => {
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        setThemeState(newTheme);
    };

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

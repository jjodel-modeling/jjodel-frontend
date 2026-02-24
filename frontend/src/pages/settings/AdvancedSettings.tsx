import React, { useState } from 'react';
import { ConfirmDialog } from '../../components/ConfirmDialog/ConfirmDialog';

type SettingProps = {
    onDirtyChange?: (...a:any)=>any
}

export function AdvancedSettings(props: SettingProps) {
    const [debugMode, setDebugMode] = useState(() => {
        return localStorage.getItem('debug-mode') === 'true';
    });

    const [showClearConfirm, setShowClearConfirm] = useState(false);

    const toggleDebugMode = (enabled: boolean) => {
        setDebugMode(enabled);
        localStorage.setItem('debug-mode', String(enabled));
    };

    const handleClearData = () => {
        // Preserve some essential items
        const theme = localStorage.getItem('theme');
        localStorage.clear();
        if (theme) localStorage.setItem('theme', theme);
        window.location.reload();
    };

    const exportSettings = () => {
        const settings = {
            theme: localStorage.getItem('theme'),
            'jjodie-settings': localStorage.getItem('jjodie-settings'),
            'debug-mode': localStorage.getItem('debug-mode'),
        };
        const blob = new Blob([JSON.stringify(settings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jjodel-settings.json';
        a.click();
        URL.revokeObjectURL(url);
    };

    const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target?.result as string);
                Object.entries(settings).forEach(([key, value]) => {
                    if (value) localStorage.setItem(key, value as string);
                });
                window.location.reload();
            } catch (error) {
                alert('Invalid settings file');
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="settings-section-content">
            {/* Debug Mode */}
            <div className="settings-group">
                <label className="settings-label">Developer Options</label>

                <label className="settings-checkbox">
                    <input
                        type="checkbox"
                        checked={debugMode}
                        onChange={(e) => toggleDebugMode(e.target.checked)}
                    />
                    <div className="checkbox-content">
                        <span className="checkbox-label">Enable debug mode</span>
                        <span className="checkbox-description">Show additional debugging information in the console</span>
                    </div>
                </label>
            </div>

            <div className="settings-divider" />

            {/* Data Management */}
            <div className="settings-group">
                <label className="settings-label">Data Management</label>

                <div className="settings-actions">
                    <button className="settings-action-btn" onClick={exportSettings}>
                        <i className="bi bi-download" />
                        <div>
                            <span className="action-title">Export Settings</span>
                            <span className="action-description">Download your settings as a JSON file</span>
                        </div>
                    </button>

                    <label className="settings-action-btn">
                        <i className="bi bi-upload" />
                        <div>
                            <span className="action-title">Import Settings</span>
                            <span className="action-description">Restore settings from a JSON file</span>
                        </div>
                        <input
                            type="file"
                            accept=".json"
                            onChange={importSettings}
                            style={{ display: 'none' }}
                        />
                    </label>
                </div>
            </div>

            <div className="settings-divider" />

            {/* Danger Zone */}
            <div className="settings-group">
                <label className="settings-label danger">Danger Zone</label>

                <button className="settings-action-btn danger" onClick={() => setShowClearConfirm(true)}>
                    <i className="bi bi-trash" />
                    <div>
                        <span className="action-title">Clear Local Data</span>
                        <span className="action-description">Reset all local settings and cached data</span>
                    </div>
                </button>
            </div>

            {/* Clear Data Confirmation Modal */}
            <ConfirmDialog
                isOpen={showClearConfirm}
                title="Clear Local Data"
                message="This will clear all local settings and cached data. This action cannot be undone."
                confirmText="Clear Data"
                cancelText="Cancel"
                variant="danger"
                onConfirm={() => {
                    handleClearData();
                    setShowClearConfirm(false);
                }}
                onCancel={() => setShowClearConfirm(false)}
            />
        </div>
    );
}

export default AdvancedSettings;

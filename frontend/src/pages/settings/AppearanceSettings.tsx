export function AppearanceSettings({onDirtyChange}: {onDirtyChange?:((b:boolean)=>any)}) {
    return (
        <div className="settings-section-content">
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

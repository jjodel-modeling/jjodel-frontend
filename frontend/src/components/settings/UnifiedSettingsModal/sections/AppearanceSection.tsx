/**
 * AppearanceSection Component
 * Display and theme settings (wraps existing AppearanceSettings)
 */

import React, { useState } from 'react';
import { AppearanceSettings } from '../../../../pages/settings/AppearanceSettings';

export function AppearanceSection(): JSX.Element {
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="appearance-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Appearance</h3>
                    <p className="settings-section-description">
                        Customize the look and feel of your workspace
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>
            <AppearanceSettings onDirtyChange={setIsDirty} />
        </div>
    );
}

export default AppearanceSection;

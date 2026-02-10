/**
 * AdvancedSection Component
 * Developer and advanced settings (wraps existing AdvancedSettings)
 */

import React, { useState } from 'react';
import { AdvancedSettings } from '../../../../pages/settings/AdvancedSettings';

export function AdvancedSection(): JSX.Element {
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="advanced-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Advanced</h3>
                    <p className="settings-section-description">
                        Developer options and data management
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>
            <AdvancedSettings onDirtyChange={setIsDirty} />
        </div>
    );
}

export default AdvancedSection;

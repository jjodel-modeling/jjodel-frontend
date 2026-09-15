/**
 * ProvidersSection Component
 * AI Providers settings (wraps existing AISettingsContent)
 */

import React, { useState } from 'react';
import { AISettingsContent } from '../../AISettingsContent';

export function ProvidersSection(): JSX.Element {
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="providers-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">AI Providers</h3>
                    <p className="settings-section-description">
                        Configure AI providers for Jjodie assistant
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>
            <AISettingsContent showHeader={false} onDirtyChange={setIsDirty} />
        </div>
    );
}

export default ProvidersSection;

/**
 * PromptsSection Component
 * AI Prompts settings (wraps existing PromptsSettingsSection)
 */

import React, { useState } from 'react';
import { PromptsSettingsSection } from '../../PromptsSettingsSection';

export function PromptsSection(): JSX.Element {
    const [isDirty, setIsDirty] = useState(false);

    return (
        <div className="prompts-section">
            <div className="settings-section-header">
                <div className="settings-section-header-content">
                    <h3 className="settings-section-title">Prompts</h3>
                    <p className="settings-section-description">
                        Customize AI prompts and templates
                    </p>
                </div>
                {isDirty && (
                    <span className="settings-unsaved-badge">
                        <span className="settings-unsaved-badge__dot" />
                        Unsaved changes
                    </span>
                )}
            </div>
            <PromptsSettingsSection onDirtyChange={setIsDirty} />
        </div>
    );
}

export default PromptsSection;

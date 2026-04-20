/**
 * Provider Selector Component
 * Dropdown to select the active AI provider
 */

import React from 'react';
import {TAIProvider, AI, JodieConfig, AIConfig} from '../../types/jodie';

// Jodie-specific dropdown (distinct from common/ProviderSelector). Writes per-feature
// preference for 'chat'; the parent (Jodie.tsx) mirrors the write in its own callback.

interface ProviderSelectorProps {
    activeProvider: TAIProvider;
    onProviderChange: (provider: TAIProvider) => void;
    onOpenSettings?: () => void;
    disabled?: boolean;
}

export function ProviderSelector({ activeProvider, onProviderChange, onOpenSettings, disabled }: ProviderSelectorProps): JSX.Element {
    const enabledProviders = JodieConfig.getEnabledProviders();
    const providerInfo = AI[activeProvider];
    const config = AIConfig.get(activeProvider);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as TAIProvider;
        // Persist as per-feature preference for 'chat'
        AIConfig.setPreferred('chat', newProvider);
        // Then notify parent component
        onProviderChange(newProvider);
    };

    // If no providers are configured, show a warning with link to settings
    if (enabledProviders.length === 0) {
        return (
            <div className="jodie-provider-selector jodie-provider-unconfigured">
                <i className="bi bi-exclamation-triangle" />
                {onOpenSettings ? (
                    <button onClick={onOpenSettings} className="configure-link">
                        Configure providers
                    </button>
                ) : (
                    <span>No providers configured</span>
                )}
            </div>
        );
    }

    return (
        <div className="jodie-provider-selector">
            <select
                value={activeProvider}
                onChange={handleChange}
                disabled={disabled}
                className="jodie-provider-dropdown"
                style={{ borderColor: providerInfo.color }}
            >
                {enabledProviders.map(provider => {
                    const llm = AI[provider];
                    const config = AIConfig.get(provider);
                    const version = llm.versions[config.model];

                    return (
                        <option key={provider} value={provider}>{provider} ({version?.label || 'Unknown model'})</option>
                    );
                })}
            </select>
            <div
                className="jodie-provider-indicator"
                style={{ backgroundColor: providerInfo.color }}
                title={`${providerInfo.name} by ${providerInfo.company}`}
            />
        </div>
    );
}

export default ProviderSelector;

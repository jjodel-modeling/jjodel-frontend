/**
 * Provider Selector Component
 * Dropdown to select the active AI provider
 */

import React from 'react';
import { AIProvider, PROVIDER_INFO, PROVIDER_MODELS } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';

interface ProviderSelectorProps {
    activeProvider: AIProvider;
    onProviderChange: (provider: AIProvider) => void;
    disabled?: boolean;
}

export function ProviderSelector({ activeProvider, onProviderChange, disabled }: ProviderSelectorProps): JSX.Element {
    const enabledProviders = JodieConfigService.getEnabledProviders();
    const providerInfo = PROVIDER_INFO[activeProvider];

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newProvider = e.target.value as AIProvider;
        onProviderChange(newProvider);
    };

    // If no providers are configured, show a warning
    if (enabledProviders.length === 0) {
        return (
            <div className="jodie-provider-selector jodie-provider-unconfigured">
                <i className="bi bi-exclamation-triangle" />
                <span>No providers configured</span>
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
                    const info = PROVIDER_INFO[provider];
                    const config = JodieConfigService.getProvider(provider);
                    const modelLabel = PROVIDER_MODELS[provider].find(m => m.value === config?.model)?.label || config?.model;

                    return (
                        <option key={provider} value={provider}>
                            {info.name} ({modelLabel})
                        </option>
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

/**
 * AI Assistant Settings
 * Slate minimal design with proper test connection status
 */
import React, { useState, useEffect, useCallback } from 'react';
import type {Dictionary} from "../../joiner";
import {TAIProvider, AI, ALL_AI_PROVIDERS, AIConfig} from '../../types/jodie';
import { ProviderConfigModal } from './ProviderConfigModal';

export function AIAssistantSettings() {
    const [refresh, setRefresh] = useState(0);
    // Modal state
    const [selectedProvider, setSelectedProvider] = useState<TAIProvider | null>(null);

    // State for all providers
    /*const [providers, setProviders] = useState<ProvidersState>(() => {
        const initial: Partial<ProvidersState> = {};
        for (const provider of ALL_AI_PROVIDERS) {
            const config = JodieConfigService.getProviderConfig(provider);
            initial[provider] = {
                apiKey: config?.apiKey || '',
                model: config?.model || Object.keys(AI[provider].versions)[0] || '';
                enabled: config?.enabled || false,
                lastTested: config?.lastTested,
                baseUrl: config?.baseUrl,
            };
        }
        return initial as ProvidersState;
    });*/

    // Load saved settings on mount
    useEffect(() => {
        // Listen for external changes
        const handleChange = () => setRefresh(refresh +1);
        window.addEventListener('ai-provider-changed', handleChange);
        return () => window.removeEventListener('ai-provider-changed', handleChange);
    }, []);

    // Get status for display - "Connected" only after successful test
    const getProviderStatus = (providerName: TAIProvider) => {
        const llm = AI[providerName];
        const state = AIConfig.get(providerName);
        // Ollama doesn't require API key - check if it's been tested
        if (!llm.requiresKey) {
            if (state.enabled && state.lastTested) return { text: 'Connected', class: 'connected' };
            return { text: 'Ready', class: 'ready' };
        }
        // Other providers: No API key = not configured
        else if (!state.apiKey) return { text: 'Not configured', class: 'not-configured' };

        // Has API key + enabled + has been tested = Connected
        if (state.enabled && state.lastTested) return { text: 'Connected', class: 'connected' };

        // Has API key but not tested = Ready to test
        return { text: 'Ready', class: 'ready' };
    };

    // Get model label for display
    const getModelLabel = (provider: TAIProvider) => {
        const config = AIConfig.get(provider);
        return AI[provider].versions[config.model]?.label || config.model;
    };

    return (
        <div className="settings-section-content ai-providers-section">
            <p className="settings-description">
                Configure your AI providers below. Click on a provider to set up your API key and model.
                Only enabled providers will appear in the Jjodie chat selector.
            </p>

            <div className="providers-list">
                {ALL_AI_PROVIDERS.map(provider => {
                    const config = AIConfig.get(provider);
                    const llm = AI[provider];
                    const status = config.getStatus();
                    const modelLabel = getModelLabel(provider);

                    return (
                        <div
                            key={provider}
                            className={`provider-card-slate ${status.class}`}
                            onClick={() => setSelectedProvider(provider)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setSelectedProvider(provider)}
                        >
                            {/* Slate minimal icon with initial letter */}
                            <div className="provider-initial">
                                {llm.initial}
                            </div>

                            {/* Provider info */}
                            <div className="provider-info">
                                <span className="provider-name">{llm.name}</span>
                                <span className="provider-model">{modelLabel}</span>
                            </div>

                            {/* Status */}
                            <div className={`provider-status ${status.class}`}>
                                <span className="status-dot" />
                                <span className="status-text">{status.text}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            {selectedProvider && (
                <ProviderConfigModal
                    provider={selectedProvider}
                    isOpen={true}
                    onClose={() => setSelectedProvider(null)}
                    //onSave={handleSaveProvider}
                />
            )}
        </div>
    );
}

export default AIAssistantSettings;

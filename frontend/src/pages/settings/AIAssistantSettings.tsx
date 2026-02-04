/**
 * AI Assistant Settings
 * Slate minimal design with proper test connection status
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
    AIProvider,
    PROVIDER_MODELS,
} from '../../types/jodie';
import { JodieConfigService, ALL_PROVIDERS } from '../../services/JodieConfig';
import { ProviderConfigModal } from './ProviderConfigModal';

// Provider display names and initials for slate minimal icons
const PROVIDER_INFO_MINIMAL: Record<AIProvider, { name: string; initial: string }> = {
    openai: { name: 'OpenAI', initial: 'O' },
    claude: { name: 'Anthropic', initial: 'C' },
    gemini: { name: 'Google Gemini', initial: 'G' },
    deepseek: { name: 'DeepSeek', initial: 'D' },
    mistral: { name: 'Mistral AI', initial: 'M' },
    groq: { name: 'Groq', initial: 'G' },
    kimi: { name: 'Kimi', initial: 'K' },
    ollama: { name: 'Ollama', initial: 'O' },
};

// Re-export for backward compatibility
export interface AISettings {
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral' | 'groq' | 'ollama' | 'custom';
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors: boolean;
    baseUrl?: string;
}

interface ProviderState {
    apiKey: string;
    model: string;
    enabled: boolean;
    lastTested?: number;
    baseUrl?: string;
}

type ProvidersState = Record<AIProvider, ProviderState>;

export const AIAssistantSettings: React.FC = () => {
    // State for all providers
    const [providers, setProviders] = useState<ProvidersState>(() => {
        const initial: Partial<ProvidersState> = {};
        for (const provider of ALL_PROVIDERS) {
            const config = JodieConfigService.getProviderConfig(provider);
            initial[provider] = {
                apiKey: config?.apiKey || '',
                model: config?.model || PROVIDER_MODELS[provider][0].value,
                enabled: config?.enabled || false,
                lastTested: config?.lastTested,
                baseUrl: config?.baseUrl,
            };
        }
        return initial as ProvidersState;
    });

    // Modal state
    const [selectedProvider, setSelectedProvider] = useState<AIProvider | null>(null);

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = () => {
            const updated: Partial<ProvidersState> = {};
            for (const provider of ALL_PROVIDERS) {
                const config = JodieConfigService.getProviderConfig(provider);
                updated[provider] = {
                    apiKey: config?.apiKey || '',
                    model: config?.model || PROVIDER_MODELS[provider][0].value,
                    enabled: config?.enabled || false,
                    lastTested: config?.lastTested,
                    baseUrl: config?.baseUrl,
                };
            }
            setProviders(updated as ProvidersState);
        };

        loadSettings();

        // Listen for external changes
        const handleChange = () => loadSettings();
        window.addEventListener('ai-provider-changed', handleChange);
        return () => window.removeEventListener('ai-provider-changed', handleChange);
    }, []);

    // Open modal for a provider
    const openModal = useCallback((provider: AIProvider) => {
        setSelectedProvider(provider);
    }, []);

    // Close modal
    const closeModal = useCallback(() => {
        setSelectedProvider(null);
    }, []);

    // Save provider config from modal
    const handleSaveProvider = useCallback((
        provider: AIProvider,
        config: { apiKey: string; model: string; enabled: boolean; baseUrl?: string }
    ) => {
        // Update local state - preserve lastTested
        setProviders(prev => ({
            ...prev,
            [provider]: {
                ...config,
                lastTested: prev[provider]?.lastTested,
            },
        }));

        // Persist to storage
        JodieConfigService.saveProviderConfig(provider, config);
    }, []);

    // Get status for display - "Connected" only after successful test
    const getProviderStatus = (providerName: AIProvider) => {
        const state = providers[providerName];

        // Ollama doesn't require API key - check if it's been tested
        if (providerName === 'ollama') {
            if (state.enabled && state.lastTested) {
                return { text: 'Connected', class: 'connected' };
            }
            return { text: 'Ready', class: 'ready' };
        }

        // Other providers: No API key = not configured
        if (!state.apiKey) {
            return { text: 'Not configured', class: 'not-configured' };
        }

        // Has API key + enabled + has been tested = Connected
        if (state.enabled && state.lastTested) {
            return { text: 'Connected', class: 'connected' };
        }

        // Has API key but not tested = Ready to test
        return { text: 'Ready', class: 'ready' };
    };

    // Get model label for display
    const getModelLabel = (provider: AIProvider) => {
        const state = providers[provider];
        const models = PROVIDER_MODELS[provider];
        const found = models.find(m => m.value === state.model);
        return found?.label || state.model;
    };

    return (
        <div className="settings-section-content ai-providers-section">
            <p className="settings-description">
                Configure your AI providers below. Click on a provider to set up your API key and model.
                Only enabled providers will appear in the Jjodie chat selector.
            </p>

            <div className="providers-list">
                {ALL_PROVIDERS.map(provider => {
                    const info = PROVIDER_INFO_MINIMAL[provider];
                    const status = getProviderStatus(provider);
                    const modelLabel = getModelLabel(provider);

                    return (
                        <div
                            key={provider}
                            className={`provider-card-slate ${status.class}`}
                            onClick={() => openModal(provider)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && openModal(provider)}
                        >
                            {/* Slate minimal icon with initial letter */}
                            <div className="provider-initial">
                                {info.initial}
                            </div>

                            {/* Provider info */}
                            <div className="provider-info">
                                <span className="provider-name">{info.name}</span>
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
                    onClose={closeModal}
                    onSave={handleSaveProvider}
                    initialConfig={providers[selectedProvider]}
                />
            )}
        </div>
    );
};

export default AIAssistantSettings;

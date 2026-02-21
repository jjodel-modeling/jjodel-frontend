/**
 * AI Assistant Settings
 * Slate minimal design with proper test connection status
 */
import React, { useState, useEffect } from 'react';
import { TAIProvider, AIProvider, PROVIDER_MODELS, PROVIDER_INFO, ALL_AI_PROVIDERS } from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';
import type {Dictionary} from "../../joiner";
import { ProviderConfigModal } from './ProviderConfigModal';

// Provider metadata for settings UI
const PROVIDER_METADATA: Dictionary<TAIProvider, {
    name: string;
    keyUrl: string;
    keyPlaceholder: string;
    initial?: string;
}> = {
    [AIProvider.GPT]: {
        name: 'OpenAI',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyPlaceholder: 'sk-...',
        initial: 'GPT'
    },
    [AIProvider.Claude]: {
        name: 'Anthropic',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyPlaceholder: 'sk-ant-...',
        initial: 'C'
    },
    [AIProvider.Gemini]: {
        name: 'Google (Gemini)',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyPlaceholder: 'AIza...',
        initial: 'Gm'
    },
    [AIProvider.DeepSeek]: {
        name: 'DeepSeek',
        keyUrl: 'https://platform.deepseek.com/api_keys',
        keyPlaceholder: 'sk-...',
        initial: 'D'
    },
    [AIProvider.Mistral]: {
        name: 'Mistral AI',
        keyUrl: 'https://console.mistral.ai/api-keys',
        keyPlaceholder: 'Enter API key...',
        initial: 'M'
    },
    [AIProvider.Groq]: {
        name: 'Groq',
        keyUrl: 'https://console.groq.com/keys',
        keyPlaceholder: 'gsk_...',
        initial: 'Gq'
    },
    [AIProvider.Kimi]: {
        name: 'Kimi',
        initial: 'K'
    },
    [AIProvider.Ollama]: {
        name: 'Ollama',
        initial: 'O'
    },
    [AIProvider.Llama]: {
        name: 'Llama',
        initial: 'L'
    },
    [AIProvider.Copilot]: {
        name: 'Copilot',
        initial: 'Cp'
    },
};

interface ProviderState {
    apiKey: string;
    model: string;
    enabled: boolean;
    showKey: boolean;
    testStatus: 'idle' | 'testing' | 'success' | 'error';
    testMessage: string;
}

type ProvidersState = Record<TAIProvider, ProviderState>;

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
type ProvidersState = Dictionary<TAIProvider, ProviderState>;

export function AIAssistantSettings() {
    // State for all providers
    const [providers, setProviders] = useState<ProvidersState>(() => {
        const initial: Partial<ProvidersState> = {};
        for (const provider of ALL_AI_PROVIDERS) {
            const config = JodieConfigService.getProviderConfig(provider);
            initial[provider] = {
                apiKey: config?.apiKey || '',
                model: config?.model || PROVIDER_MODELS[provider]?.[0]?.value || '',
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
            for (const provider of ALL_AI_PROVIDERS) {
                const config = JodieConfigService.getProviderConfig(provider);
                updated[provider] = {
                    apiKey: config?.apiKey || '',
                    model: config?.model || PROVIDER_MODELS[provider]?.[0]?.value || '',
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
        provider: TAIProvider,
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
    const getProviderStatus = (providerName: TAIProvider) => {
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
                {ALL_AI_PROVIDERS.map(provider => {
                    const state = providers[provider];
                    const meta = PROVIDER_METADATA[provider];
                    // const info = PROVIDER_INFO[provider];
                    const models = PROVIDER_MODELS[provider];
                    const info = state; // PROVIDER_INFO_MINIMAL[provider]
                    const status = getProviderStatus(provider);
                    const modelLabel = getModelLabel(provider);

                    // Determine status badge state
                    const getBadgeStatus = () => {
                        if (!state.apiKey) return 'not-configured';
                        if (state.testStatus === 'error') return 'error';
                        if (state.enabled) return 'enabled';
                        return 'disabled';
                    };
                    const badgeStatus = getBadgeStatus();

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
}

export default AIAssistantSettings;

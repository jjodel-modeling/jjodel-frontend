import React, { useState, useEffect } from 'react';
import { AIProvider, PROVIDER_MODELS, PROVIDER_INFO } from '../../types/jodie';
import { JodieConfigService, ALL_PROVIDERS } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';

// Provider metadata for settings UI
const PROVIDER_METADATA: Record<AIProvider, {
    name: string;
    keyUrl: string;
    keyPlaceholder: string;
}> = {
    openai: {
        name: 'OpenAI',
        keyUrl: 'https://platform.openai.com/api-keys',
        keyPlaceholder: 'sk-...',
    },
    claude: {
        name: 'Anthropic',
        keyUrl: 'https://console.anthropic.com/settings/keys',
        keyPlaceholder: 'sk-ant-...',
    },
    gemini: {
        name: 'Google (Gemini)',
        keyUrl: 'https://aistudio.google.com/apikey',
        keyPlaceholder: 'AIza...',
    },
    deepseek: {
        name: 'DeepSeek',
        keyUrl: 'https://platform.deepseek.com/api_keys',
        keyPlaceholder: 'sk-...',
    },
    mistral: {
        name: 'Mistral AI',
        keyUrl: 'https://console.mistral.ai/api-keys',
        keyPlaceholder: 'Enter API key...',
    },
    groq: {
        name: 'Groq',
        keyUrl: 'https://console.groq.com/keys',
        keyPlaceholder: 'gsk_...',
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

type ProvidersState = Record<AIProvider, ProviderState>;

// Re-export for backward compatibility
export interface AISettings {
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral' | 'groq' | 'ollama' | 'custom';
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors: boolean;
    baseUrl?: string;
}

export function AIAssistantSettings() {
    const [providers, setProviders] = useState<ProvidersState>(() => {
        const initial: Partial<ProvidersState> = {};
        for (const provider of ALL_PROVIDERS) {
            const config = JodieConfigService.getProviderConfig(provider);
            initial[provider] = {
                apiKey: config?.apiKey || '',
                model: config?.model || PROVIDER_MODELS[provider][0].value,
                enabled: config?.enabled || false,
                showKey: false,
                testStatus: 'idle',
                testMessage: '',
            };
        }
        return initial as ProvidersState;
    });

    // Load saved settings on mount
    useEffect(() => {
        const loadSettings = () => {
            const updated: Partial<ProvidersState> = {};
            for (const provider of ALL_PROVIDERS) {
                const config = JodieConfigService.getProviderConfig(provider);
                updated[provider] = {
                    ...providers[provider],
                    apiKey: config?.apiKey || '',
                    model: config?.model || PROVIDER_MODELS[provider][0].value,
                    enabled: config?.enabled || false,
                };
            }
            setProviders(prev => ({ ...prev, ...updated } as ProvidersState));
        };

        loadSettings();

        // Listen for external changes
        const handleChange = () => loadSettings();
        window.addEventListener('ai-provider-changed', handleChange);
        return () => window.removeEventListener('ai-provider-changed', handleChange);
    }, []);

    const updateProvider = (provider: AIProvider, updates: Partial<ProviderState>) => {
        setProviders(prev => ({
            ...prev,
            [provider]: { ...prev[provider], ...updates },
        }));

        // Save to storage if it's a config field (not UI state)
        if ('apiKey' in updates || 'model' in updates || 'enabled' in updates) {
            const current = providers[provider];
            JodieConfigService.saveProviderConfig(provider, {
                apiKey: updates.apiKey ?? current.apiKey,
                model: updates.model ?? current.model,
                enabled: updates.enabled ?? current.enabled,
            });
        }
    };

    const testConnection = async (provider: AIProvider) => {
        const state = providers[provider];

        if (!state.apiKey) {
            updateProvider(provider, {
                testStatus: 'error',
                testMessage: 'API key required',
            });
            return;
        }

        updateProvider(provider, {
            testStatus: 'testing',
            testMessage: 'Testing...',
        });

        try {
            // Temporarily save to test
            JodieConfigService.saveProviderConfig(provider, {
                apiKey: state.apiKey,
                model: state.model,
                enabled: true, // Temporarily enable for test
            });

            const result = await AIProviderService.testConnection(provider);

            if (result.success) {
                JodieConfigService.markProviderTested(provider);
                updateProvider(provider, {
                    testStatus: 'success',
                    testMessage: 'Connected!',
                    enabled: true, // Keep enabled after successful test
                });
            } else {
                // Revert enabled state on failure
                JodieConfigService.saveProviderConfig(provider, {
                    apiKey: state.apiKey,
                    model: state.model,
                    enabled: state.enabled,
                });
                updateProvider(provider, {
                    testStatus: 'error',
                    testMessage: result.error || 'Connection failed',
                });
            }
        } catch (error: any) {
            updateProvider(provider, {
                testStatus: 'error',
                testMessage: error.message || 'Connection failed',
            });
        }

        // Reset status after 5 seconds
        setTimeout(() => {
            updateProvider(provider, {
                testStatus: 'idle',
                testMessage: '',
            });
        }, 5000);
    };

    return (
        <div className="settings-section-content ai-providers-section">
            <p className="settings-description">
                Configure your AI providers below. Each provider requires its own API key.
                Only enabled providers will appear in the Jjodie chat selector.
            </p>

            <div className="providers-list">
                {ALL_PROVIDERS.map(provider => {
                    const state = providers[provider];
                    const meta = PROVIDER_METADATA[provider];
                    const info = PROVIDER_INFO[provider];
                    const models = PROVIDER_MODELS[provider];

                    // Determine status badge state
                    const getBadgeStatus = () => {
                        if (!state.apiKey) return 'not-configured';
                        if (state.testStatus === 'error') return 'error';
                        if (state.enabled) return 'enabled';
                        return 'disabled';
                    };
                    const badgeStatus = getBadgeStatus();

                    return (
                        <div key={provider} className={`provider-row ${state.enabled ? 'enabled' : ''}`}>
                            {/* Row 1: Icon + Name | Status Badge + Test */}
                            <div className="provider-header-row">
                                <div className="provider-identity">
                                    <div
                                        className="provider-icon"
                                        style={{ backgroundColor: info.bgColor, color: info.color }}
                                    >
                                        {info.textIcon}
                                    </div>
                                    <span className="provider-name">{meta.name}</span>
                                </div>
                                <div className="provider-actions">
                                    {/* Status Badge - clickable to toggle enable/disable */}
                                    <button
                                        className={`status-badge-btn ${badgeStatus}`}
                                        onClick={() => {
                                            if (state.apiKey) {
                                                updateProvider(provider, { enabled: !state.enabled });
                                            }
                                        }}
                                        disabled={!state.apiKey}
                                        title={
                                            !state.apiKey ? 'Add API key first' :
                                            state.enabled ? 'Click to disable' : 'Click to enable'
                                        }
                                    >
                                        {badgeStatus === 'enabled' && <i className="bi bi-check-lg" />}
                                        {badgeStatus === 'disabled' && <i className="bi bi-circle" />}
                                        {badgeStatus === 'error' && <i className="bi bi-exclamation-triangle" />}
                                        {badgeStatus === 'not-configured' && <i className="bi bi-dash" />}
                                    </button>
                                    <button
                                        className={`test-btn ${state.testStatus}`}
                                        onClick={() => testConnection(provider)}
                                        disabled={!state.apiKey || state.testStatus === 'testing'}
                                        title="Test connection"
                                    >
                                        {state.testStatus === 'testing' && (
                                            <i className="bi bi-arrow-repeat spinning" />
                                        )}
                                        Test
                                    </button>
                                </div>
                            </div>

                            {/* Row 2: API Key + Model Dropdown */}
                            <div className="provider-inputs-row">
                                <div className="api-key-field">
                                    <input
                                        type={state.showKey ? 'text' : 'password'}
                                        className="settings-input"
                                        value={state.apiKey}
                                        onChange={(e) => updateProvider(provider, { apiKey: e.target.value })}
                                        placeholder={meta.keyPlaceholder}
                                    />
                                    <button
                                        className="toggle-visibility"
                                        onClick={() => updateProvider(provider, { showKey: !state.showKey })}
                                        title={state.showKey ? 'Hide' : 'Show'}
                                        type="button"
                                    >
                                        <i className={`bi ${state.showKey ? 'bi-eye-slash' : 'bi-eye'}`} />
                                    </button>
                                </div>
                                <select
                                    className="settings-select model-select"
                                    value={state.model}
                                    onChange={(e) => updateProvider(provider, { model: e.target.value })}
                                >
                                    {models.map(model => (
                                        <option key={model.value} value={model.value}>
                                            {model.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Row 3: Get API key link + Status message */}
                            <div className="provider-footer-row">
                                <a
                                    href={meta.keyUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="key-link"
                                >
                                    <i className="bi bi-box-arrow-up-right" />
                                    Get API key
                                </a>
                                {state.testStatus !== 'idle' && state.testMessage && (
                                    <span className={`test-message ${state.testStatus}`}>
                                        {state.testMessage}
                                    </span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default AIAssistantSettings;

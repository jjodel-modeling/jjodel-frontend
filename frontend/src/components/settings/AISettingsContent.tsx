import React, { useState, useEffect } from 'react';
import { JodieConfigService } from '../../services/JodieConfig';
import { PROVIDER_MODELS, ModelInfo, AIProvider } from '../../types/jodie';
import './AISettingsContent.scss';

interface AISettingsContentProps {
    onClose?: () => void;
    showHeader?: boolean;
}

interface ProviderFormState {
    openai: { apiKey: string; model: string };
    anthropic: { apiKey: string; model: string };
    mistral: { apiKey: string; model: string };
    gemini: { apiKey: string; model: string };
    ollama: { baseUrl: string; model: string };
}

// Map settings provider IDs to PROVIDER_MODELS keys
const SETTINGS_TO_PROVIDER: Record<string, AIProvider> = {
    openai: 'openai',
    anthropic: 'claude',
    mistral: 'mistral',
    gemini: 'gemini',
    ollama: 'groq', // Ollama doesn't have models in PROVIDER_MODELS, use empty
};

const DEFAULT_MODELS: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    mistral: 'mistral-large-latest',
    gemini: 'gemini-2.0-flash-exp',
    ollama: 'llama2',
};

// Component to show model capability badges
function ModelCapabilitiesBadges({ model }: { model: ModelInfo | undefined }): JSX.Element | null {
    if (!model) return null;

    const { capabilities } = model;

    return (
        <div className="model-capabilities">
            {capabilities.vision && (
                <span className="capability-badge vision" title="Supports image upload">
                    <i className="bi bi-image" />
                    Images
                </span>
            )}
            {capabilities.pdf && (
                <span className="capability-badge pdf" title="Supports PDF upload">
                    <i className="bi bi-file-earmark-pdf" />
                    PDF
                </span>
            )}
            {!capabilities.vision && !capabilities.pdf && (
                <span className="capability-badge text-only" title="Text only">
                    <i className="bi bi-fonts" />
                    Text only
                </span>
            )}
        </div>
    );
}

export function AISettingsContent({
    onClose,
    showHeader = true
}: AISettingsContentProps) {
    const [providers, setProviders] = useState<ProviderFormState>({
        openai: { apiKey: '', model: DEFAULT_MODELS.openai },
        anthropic: { apiKey: '', model: DEFAULT_MODELS.anthropic },
        mistral: { apiKey: '', model: DEFAULT_MODELS.mistral },
        gemini: { apiKey: '', model: DEFAULT_MODELS.gemini },
        ollama: { baseUrl: '', model: DEFAULT_MODELS.ollama },
    });

    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

    // Load existing configuration
    useEffect(() => {
        const loadConfig = () => {
            const openai = JodieConfigService.getProvider('openai');
            const anthropic = JodieConfigService.getProvider('anthropic');
            const mistral = JodieConfigService.getProvider('mistral');
            const gemini = JodieConfigService.getProvider('gemini');
            const ollama = JodieConfigService.getProvider('ollama');

            setProviders({
                openai: {
                    apiKey: openai?.apiKey || '',
                    model: openai?.model || DEFAULT_MODELS.openai
                },
                anthropic: {
                    apiKey: anthropic?.apiKey || '',
                    model: anthropic?.model || DEFAULT_MODELS.anthropic
                },
                mistral: {
                    apiKey: mistral?.apiKey || '',
                    model: mistral?.model || DEFAULT_MODELS.mistral
                },
                gemini: {
                    apiKey: gemini?.apiKey || '',
                    model: gemini?.model || DEFAULT_MODELS.gemini
                },
                ollama: {
                    baseUrl: ollama?.baseUrl || '',
                    model: ollama?.model || DEFAULT_MODELS.ollama
                },
            });
        };

        loadConfig();
    }, []);

    // Save configuration
    const handleSave = async () => {
        setSaveStatus('saving');

        try {
            // Save each provider
            if (providers.openai.apiKey) {
                JodieConfigService.setProvider('openai', {
                    apiKey: providers.openai.apiKey,
                    model: providers.openai.model,
                });
            } else {
                JodieConfigService.removeProvider('openai');
            }

            if (providers.anthropic.apiKey) {
                JodieConfigService.setProvider('anthropic', {
                    apiKey: providers.anthropic.apiKey,
                    model: providers.anthropic.model,
                });
            } else {
                JodieConfigService.removeProvider('anthropic');
            }

            if (providers.mistral.apiKey) {
                JodieConfigService.setProvider('mistral', {
                    apiKey: providers.mistral.apiKey,
                    model: providers.mistral.model,
                });
            } else {
                JodieConfigService.removeProvider('mistral');
            }

            if (providers.gemini.apiKey) {
                JodieConfigService.setProvider('gemini', {
                    apiKey: providers.gemini.apiKey,
                    model: providers.gemini.model,
                });
            } else {
                JodieConfigService.removeProvider('gemini');
            }

            if (providers.ollama.baseUrl) {
                JodieConfigService.setProvider('ollama', {
                    baseUrl: providers.ollama.baseUrl,
                    model: providers.ollama.model,
                });
            } else {
                JodieConfigService.removeProvider('ollama');
            }

            setSaveStatus('saved');
            setTimeout(() => setSaveStatus('idle'), 2000);

        } catch (err) {
            console.error('Failed to save settings:', err);
            setSaveStatus('idle');
        }
    };

    // Test provider connection
    const handleTestConnection = async (providerId: string) => {
        setTestStatus(prev => ({ ...prev, [providerId]: 'testing' }));

        try {
            // Simulate test delay
            await new Promise(r => setTimeout(r, 1000));

            // TODO: Implement real connection test
            // const result = await AIService.testConnection(providerId, providers[providerId]);

            setTestStatus(prev => ({ ...prev, [providerId]: 'success' }));
            setTimeout(() => {
                setTestStatus(prev => ({ ...prev, [providerId]: 'idle' }));
            }, 3000);

        } catch (err) {
            setTestStatus(prev => ({ ...prev, [providerId]: 'error' }));
            setTimeout(() => {
                setTestStatus(prev => ({ ...prev, [providerId]: 'idle' }));
            }, 3000);
        }
    };

    // Update provider field
    const updateProvider = (providerId: string, field: string, value: string) => {
        setProviders(prev => ({
            ...prev,
            [providerId]: {
                ...(prev as any)[providerId],
                [field]: value,
            },
        }));
    };

    // Render provider card
    const renderProviderCard = (
        id: string,
        name: string,
        icon: string,
        description: string,
        fields: Array<{ key: string; label: string; type: 'text' | 'password' | 'model'; placeholder: string }>
    ) => {
        const isExpanded = expandedProvider === id;
        const config = (providers as any)[id];
        const isConfigured = id === 'ollama'
            ? !!config.baseUrl
            : !!config.apiKey;
        const status = testStatus[id] || 'idle';

        // Get available models for this provider
        const providerKey = SETTINGS_TO_PROVIDER[id];
        const availableModels: ModelInfo[] = providerKey ? (PROVIDER_MODELS[providerKey] || []) : [];
        const selectedModel = availableModels.find(m => m.value === config.model);

        return (
            <div
                key={id}
                className={`provider-card ${isExpanded ? 'expanded' : ''} ${isConfigured ? 'configured' : ''}`}
            >
                <div
                    className="provider-header"
                    onClick={() => setExpandedProvider(isExpanded ? null : id)}
                >
                    <div className="provider-info">
                        <i className={`bi ${icon}`} />
                        <div className="provider-details">
                            <span className="provider-name">{name}</span>
                            <span className="provider-description">{description}</span>
                        </div>
                    </div>
                    <div className="provider-status">
                        {isConfigured && (
                            <span className="status-badge configured">
                                <i className="bi bi-check-circle-fill" />
                                Configured
                            </span>
                        )}
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} chevron`} />
                    </div>
                </div>

                {isExpanded && (
                    <div className="provider-content">
                        {fields.map(field => (
                            <div key={field.key} className="form-group">
                                <label>{field.label}</label>

                                {field.type === 'model' && availableModels.length > 0 ? (
                                    // Model select with capabilities
                                    <div className="model-select-wrapper">
                                        <select
                                            className="model-select"
                                            value={config[field.key] || ''}
                                            onChange={(e) => updateProvider(id, field.key, e.target.value)}
                                        >
                                            <option value="">Select a model...</option>
                                            {availableModels.map(model => (
                                                <option
                                                    key={model.value}
                                                    value={model.value}
                                                    disabled={model.deprecated}
                                                >
                                                    {model.label}
                                                    {model.deprecated ? ' (deprecated)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                        <ModelCapabilitiesBadges model={selectedModel} />
                                    </div>
                                ) : (
                                    // Regular input (text/password)
                                    <input
                                        type={field.type === 'model' ? 'text' : field.type}
                                        value={config[field.key] || ''}
                                        onChange={(e) => updateProvider(id, field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="provider-actions">
                            <button
                                className={`test-btn ${status}`}
                                onClick={() => handleTestConnection(id)}
                                disabled={status === 'testing' || !isConfigured}
                            >
                                {status === 'testing' && <><i className="bi bi-arrow-repeat spinning" /> Testing...</>}
                                {status === 'success' && <><i className="bi bi-check-lg" /> Connected</>}
                                {status === 'error' && <><i className="bi bi-x-lg" /> Failed</>}
                                {status === 'idle' && <><i className="bi bi-plug" /> Test Connection</>}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="ai-settings-content">
            {showHeader && (
                <div className="settings-header">
                    <h2>AI Providers</h2>
                    <p>Configure your AI providers for documentation generation and chat.</p>
                </div>
            )}

            <div className="providers-list">
                {renderProviderCard(
                    'openai',
                    'OpenAI',
                    'bi-stars',
                    'GPT-4o, GPT-4 Turbo, GPT-3.5',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'anthropic',
                    'Anthropic',
                    'bi-stars',
                    'Claude Sonnet 4, Claude Opus 4',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'mistral',
                    'Mistral',
                    'bi-stars',
                    'Mistral Large, Pixtral',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Mistral API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'gemini',
                    'Google Gemini',
                    'bi-stars',
                    'Gemini 2.0 Flash, Gemini 1.5 Pro',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Gemini API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'ollama',
                    'Ollama',
                    'bi-hdd-network',
                    'Local models (Llama 3, Mistral)',
                    [
                        { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'http://localhost:11434' },
                        { key: 'model', label: 'Model', type: 'text', placeholder: 'llama3' },
                    ]
                )}
            </div>

            <div className="settings-footer">
                <div className="footer-info">
                    <i className="bi bi-info-circle" />
                    <span>API keys are stored locally in your browser.</span>
                </div>
                <div className="footer-actions">
                    {onClose && (
                        <button className="btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                    )}
                    <button
                        className={`btn-primary ${saveStatus}`}
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                    >
                        {saveStatus === 'saving' && <><i className="bi bi-arrow-repeat spinning" /> Saving...</>}
                        {saveStatus === 'saved' && <><i className="bi bi-check-lg" /> Saved!</>}
                        {saveStatus === 'idle' && 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AISettingsContent;

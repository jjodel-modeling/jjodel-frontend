import React, { useState, useEffect, useMemo } from 'react';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderPreferences } from '../../services/AIProviderPreferences';
import { PROVIDER_MODELS, ModelInfo, AIProvider, TAIProvider } from '../../types/jodie';
import './AISettingsContent.scss';
import type {Dictionary} from "../../joiner";

// Provider logo imports
import openaiLogo from '../../assets/icons/providers/openai.svg';
import anthropicLogo from '../../assets/icons/providers/anthropic.svg';
import deepseekLogo from '../../assets/icons/providers/deepseek.svg';
import mistralLogo from '../../assets/icons/providers/mistral.svg';
import geminiLogo from '../../assets/icons/providers/gemini.svg';
import groqLogo from '../../assets/icons/providers/groq.svg';
import kimiLogo from '../../assets/icons/providers/kimi.svg';
import ollamaLogo from '../../assets/icons/providers/ollama.svg';

interface AISettingsContentProps {
    onClose?: () => void;
    showHeader?: boolean;
    onDirtyChange?: (isDirty: boolean) => void;
}
type ProviderInfo = {name: string; baseUrl: string; apiKey: string; model: string };
interface ProviderFormState {
    openai: { apiKey: string; model: string };
    anthropic: { apiKey: string; model: string };
    mistral: { apiKey: string; model: string };
    gemini: { apiKey: string; model: string };
    deepseek: { apiKey: string; model: string };
    groq: { apiKey: string; model: string };
    kimi: { apiKey: string; model: string };
    ollama: { baseUrl: string; model: string };
    custom: ProviderInfo;
}

// Map settings provider IDs to PROVIDER_MODELS keys
const SETTINGS_TO_PROVIDER: Record<string, AIProvider> = {
    openai: 'openai',
    anthropic: 'claude',
    mistral: 'mistral',
    gemini: 'gemini',
    deepseek: 'deepseek',
    groq: 'groq',
    kimi: 'kimi',
    ollama: 'ollama',
};

const DEFAULT_MODELS: Record<string, string> = {
    openai: 'gpt-4o',
    anthropic: 'claude-sonnet-4-20250514',
    mistral: 'mistral-large-latest',
    gemini: 'gemini-2.0-flash-exp',
    deepseek: 'deepseek-chat',
    groq: 'llama-3.3-70b-versatile',
    kimi: 'moonshot-v1-8k',
    ollama: 'llama3.2',
};

// Provider logos and fallback colors
const PROVIDER_LOGOS: Record<string, { logo?: string; letter: string; color: string }> = {
    openai: { logo: openaiLogo, letter: 'O', color: '#10a37f' },
    anthropic: { logo: anthropicLogo, letter: 'A', color: '#d97706' },
    mistral: { logo: mistralLogo, letter: 'M', color: '#ff7000' },
    gemini: { logo: geminiLogo, letter: 'G', color: '#4285f4' },
    deepseek: { logo: deepseekLogo, letter: 'D', color: '#4d6bfe' },
    groq: { logo: groqLogo, letter: 'G', color: '#f55036' },
    kimi: { logo: kimiLogo, letter: 'K', color: '#6366f1' },
    ollama: { logo: ollamaLogo, letter: 'O', color: '#1d1d1f' },
    custom: { letter: '+', color: '#64748b' }, // Custom uses icon, no logo
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
    showHeader = true,
    onDirtyChange
}: AISettingsContentProps) {
    const [providers, setProviders] = useState<ProviderFormState>({
        openai: { apiKey: '', model: DEFAULT_MODELS.openai },
        anthropic: { apiKey: '', model: DEFAULT_MODELS.anthropic },
        mistral: { apiKey: '', model: DEFAULT_MODELS.mistral },
        gemini: { apiKey: '', model: DEFAULT_MODELS.gemini },
        deepseek: { apiKey: '', model: DEFAULT_MODELS.deepseek },
        groq: { apiKey: '', model: DEFAULT_MODELS.groq },
        kimi: { apiKey: '', model: DEFAULT_MODELS.kimi },
        ollama: { baseUrl: '', model: DEFAULT_MODELS.ollama },
        custom: { name: '', baseUrl: '', apiKey: '', model: '' },
    });
    const [initialProviders, setInitialProviders] = useState<ProviderFormState | null>(null);

    const [testStatus, setTestStatus] = useState<Record<string, 'idle' | 'testing' | 'success' | 'error'>>({});
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);
    const [defaultProvider, setDefaultProvider] = useState<string | null>(
        () => AIProviderPreferences.getGlobalDefault()
    );

    // List of configured providers for the default selector
    const configuredProvidersList = useMemo(() => {
        const list: Array<{ id: string; name: string }> = [];
        if (providers.openai.apiKey) list.push({ id: 'openai', name: 'OpenAI' });
        if (providers.anthropic.apiKey) list.push({ id: 'anthropic', name: 'Anthropic' });
        if (providers.deepseek.apiKey) list.push({ id: 'deepseek', name: 'DeepSeek' });
        if (providers.mistral.apiKey) list.push({ id: 'mistral', name: 'Mistral' });
        if (providers.gemini.apiKey) list.push({ id: 'gemini', name: 'Google Gemini' });
        if (providers.groq.apiKey) list.push({ id: 'groq', name: 'Groq' });
        if (providers.kimi.apiKey) list.push({ id: 'kimi', name: 'Kimi' });
        if (providers.ollama.baseUrl) list.push({ id: 'ollama', name: 'Ollama' });
        return list;
    }, [providers]);

    // Load existing configuration
    useEffect(() => {
        const loadConfig = () => {
            const openai = JodieConfigService.getProvider(AIProvider.GPT);
            const anthropic = JodieConfigService.getProvider(AIProvider.Claude);
            const mistral = JodieConfigService.getProvider(AIProvider.Mistral);
            const gemini = JodieConfigService.getProvider(AIProvider.Gemini);
            const deepseek = JodieConfigService.getProvider(AIProvider.Deepseek);
            const groq = JodieConfigService.getProvider(AIProvider.Groq);
            const kimi = JodieConfigService.getProvider(AIProvider.Kimi);
            const ollama = JodieConfigService.getProvider(AIProvider.Ollama);
            const custom = JodieConfigService.getProvider(AIProvider.Custom);

            const loadedProviders: ProviderFormState = {
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
                deepseek: {
                    apiKey: deepseek?.apiKey || '',
                    model: deepseek?.model || DEFAULT_MODELS.deepseek
                },
                groq: {
                    apiKey: groq?.apiKey || '',
                    model: groq?.model || DEFAULT_MODELS.groq
                },
                kimi: {
                    apiKey: kimi?.apiKey || '',
                    model: kimi?.model || DEFAULT_MODELS.kimi
                },
                ollama: {
                    apiKey: ollama?.apiKey || '',
                    baseUrl: ollama?.baseUrl || '',
                    model: ollama?.model || DEFAULT_MODELS.ollama
                },
                custom: {
                    name: (custom as any)?.name || '',
                    baseUrl: custom?.baseUrl || '',
                    apiKey: custom?.apiKey || '',
                    model: custom?.model || ''
                },
            };
            setProviders(loadedProviders);
            setInitialProviders(loadedProviders);
        };

        loadConfig();
    }, []);

    // Track dirty state
    useEffect(() => {
        if (initialProviders && onDirtyChange) {
            const isDirty = JSON.stringify(providers) !== JSON.stringify(initialProviders);
            onDirtyChange(isDirty);
        }
    }, [providers, initialProviders, onDirtyChange]);

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

            if (providers.deepseek.apiKey) {
                JodieConfigService.setProvider('deepseek', {
                    apiKey: providers.deepseek.apiKey,
                    model: providers.deepseek.model,
                });
            } else {
                JodieConfigService.removeProvider('deepseek');
            }

            if (providers.groq.apiKey) {
                JodieConfigService.setProvider('groq', {
                    apiKey: providers.groq.apiKey,
                    model: providers.groq.model,
                });
            } else {
                JodieConfigService.removeProvider('groq');
            }

            if (providers.kimi.apiKey) {
                JodieConfigService.setProvider('kimi', {
                    apiKey: providers.kimi.apiKey,
                    model: providers.kimi.model,
                });
            } else {
                JodieConfigService.removeProvider('kimi');
            }

            if (providers.ollama.baseUrl) {
                JodieConfigService.setProvider('ollama', {
                    apiKey: '',
                    baseUrl: providers.ollama.baseUrl,
                    model: providers.ollama.model,
                });
            } else {
                JodieConfigService.removeProvider('ollama');
            }

            if (providers.custom.baseUrl && providers.custom.apiKey) {
                JodieConfigService.setProvider('custom' as any, {
                    name: providers.custom.name,
                    baseUrl: providers.custom.baseUrl,
                    apiKey: providers.custom.apiKey,
                    model: providers.custom.model,
                });
            } else {
                JodieConfigService.removeProvider('custom' as any);
            }

            // Update initial state to match saved state
            setInitialProviders({ ...providers });

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
        description: string,
        fields: Array<{ key: string; label: string; type: 'text' | 'password' | 'model'; placeholder: string }>
    ) => {
        const isExpanded = expandedProvider === id;
        const config = (providers as any)[id];
        const isConfigured = id === 'ollama'
            ? !!config.baseUrl
            : id === 'custom'
            ? !!(config.baseUrl && config.apiKey)
            : !!config.apiKey;
        const status = testStatus[id] || 'idle';

        // Get available models for this provider
        const providerKey = SETTINGS_TO_PROVIDER[id];
        const availableModels: ModelInfo[] = PROVIDER_MODELS[providerKey as TAIProvider] || [];
        const selectedModel = availableModels.find(m => m.value === config.model);

        // Get logo and fallback info
        const logoInfo = PROVIDER_LOGOS[id] || { letter: '?', color: '#64748b' };

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
                        {logoInfo.logo ? (
                            <img
                                src={logoInfo.logo}
                                alt={`${name} logo`}
                                className="provider-icon-logo"
                            />
                        ) : (
                            <div
                                className="provider-icon-letter"
                                style={{ backgroundColor: logoInfo.color }}
                            >
                                {id === 'custom' ? (
                                    <i className="bi bi-puzzle" />
                                ) : (
                                    logoInfo.letter
                                )}
                            </div>
                        )}
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

            {/* Default Provider Selector */}
            <div className="default-provider-section">
                <div className="default-provider-header">
                    <label className="default-provider-label">Default Provider</label>
                    <p className="default-provider-hint">
                        Used when no specific provider is selected for a feature.
                    </p>
                </div>
                <select
                    className="default-provider-select"
                    value={defaultProvider || ''}
                    onChange={(e) => {
                        const newDefault = e.target.value || null;
                        setDefaultProvider(newDefault);
                        AIProviderPreferences.setGlobalDefault(newDefault);
                    }}
                >
                    <option value="">Auto (first available)</option>
                    {configuredProvidersList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {configuredProvidersList.length === 0 && (
                    <p className="default-provider-empty">
                        Configure at least one provider below to set a default.
                    </p>
                )}
            </div>

            <div className="providers-list">
                {renderProviderCard(
                    'openai',
                    'OpenAI',
                    'GPT-4o, GPT-4 Turbo, GPT-3.5',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-...' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'anthropic',
                    'Anthropic',
                    'Claude Sonnet 4, Claude Opus 4',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'sk-ant-...' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'deepseek',
                    'DeepSeek',
                    'DeepSeek Coder, DeepSeek Chat',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your DeepSeek API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'mistral',
                    'Mistral',
                    'Mistral Large, Pixtral',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Mistral API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'gemini',
                    'Google Gemini',
                    'Gemini 2.0 Flash, Gemini 1.5 Pro',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Gemini API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'groq',
                    'Groq',
                    'Llama 3.3 70B, Mixtral 8x7B',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Groq API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'kimi',
                    'Kimi (Moonshot)',
                    'Moonshot V1 8K, Moonshot V1 32K',
                    [
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your Moonshot API key' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {renderProviderCard(
                    'ollama',
                    'Ollama',
                    'Local models (Llama 3.2, Mistral)',
                    [
                        { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'http://localhost:11434' },
                        { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                    ]
                )}

                {/* Custom Provider */}
                <div className="providers-divider">
                    <span>Custom Provider</span>
                </div>

                {renderProviderCard(
                    'custom',
                    'Custom Provider',
                    'OpenAI-compatible endpoint',
                    [
                        { key: 'name', label: 'Provider Name', type: 'text', placeholder: 'My Custom Provider' },
                        { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://api.example.com/v1/chat/completions' },
                        { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your API key' },
                        { key: 'model', label: 'Model Name', type: 'text', placeholder: 'model-name' },
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

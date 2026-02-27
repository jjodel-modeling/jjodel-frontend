import React, { useState, useEffect, useMemo } from 'react';
import {AI, AIConfig, AIProvider, AIVersion, ALL_AI_PROVIDERS, JodieConfig, TAIProvider} from '../../types/jodie';
import './AISettingsContent.scss';
import type {Dictionary, GObject} from "../../joiner";
import {U} from "../../joiner";


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


// Component to show model capability badges
function ModelCapabilitiesBadges({ model }: { model: AIVersion | undefined }): JSX.Element | null {
    if (!model) return null;

    const { capabilities } = model;

    return (
        <div className="model-capabilities">
            {capabilities.vision && (
                <span className="capability-badge vision d-flex" title="Supports image upload">
                    <i className="bi bi-image my-auto" />
                    <span className="my-auto">Images</span>
                </span>
            )}
            {capabilities.pdf && (
                <span className="capability-badge pdf d-flex" title="Supports PDF upload">
                    <i className="bi bi-file-earmark-pdf my-auto" />
                    <span className="my-auto">PDF</span>
                </span>
            )}
            {!capabilities.vision && !capabilities.pdf && (
                <span className="capability-badge text-only d-flex" title="Text only">
                    <i className="bi bi-fonts my-auto" />
                    <span className="my-auto">Text only</span>
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
    const [testStatus, setTestStatus] = useState<Dictionary<string, 'idle' | 'testing' | 'success' | 'error'>>({});
    const [expandedProvider, setExpandedProvider] = useState<TAIProvider | null>(null);
    const [defaultProvider, setDefaultProvider] = useState<TAIProvider | null>(JodieConfig.current.activeProvider);

    // List of configured providers for the default selector
    const configuredProvidersList =
        Object.values(JodieConfig.current.providers).filter(e=>e.apiKey || !AI[e.name].requiresKey)

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

    // Render provider card
    const renderProviderCard = (
        name: TAIProvider,
        fields: {key: 'apiKey' | 'model' | 'baseUrl' /*| 'name'*/; label: string; type: 'text' | 'password' | 'model'; placeholder: string }[]
    ) => {
        const isExpanded = expandedProvider === name;
        const config = AIConfig.get(name);
        let llm = AI[name];
        let versions = Object.values(llm.versions);
        let description: string = versions.slice(0, 3).map(e=>e.label).join() + (versions.length>3 ? "..." : "");
        if (!description) description = 'OpenAI-compatible endpoint';
        const isConfigured = llm.requiresKey ? !!config.baseUrl
            : (llm.name === AIProvider.Custom ? !!(config.baseUrl && config.apiKey) : !!config.apiKey);
        const status = testStatus[name] || 'idle';

        // Get available models for this provider
        const availableModels: AIVersion[] = Object.values(llm.versions);
        const selectedModel = llm.versions[config.model];

        return (
            <div
                key={name}
                className={`provider-card ${isExpanded ? 'expanded' : ''} ${isConfigured ? 'configured' : ''}`}
            >
                <div
                    className="provider-header"
                    onClick={() => setExpandedProvider(isExpanded ? null : name)}
                >
                    <div className="provider-info">
                        {llm.logo ? (
                            <img src={llm.logo} alt={`${name} logo`} className="provider-icon-logo" />
                        ) : (
                            <div className="provider-icon-letter" style={{ backgroundColor: llm.bgColor }}>
                                {name === AIProvider.Custom ? <i className="bi bi-puzzle" /> : llm.initial}
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

                                {field.key === 'model' && Object.keys(llm.versions).length > 0 ? (
                                    // Model select with capabilities
                                    <div className="model-select-wrapper">
                                        <select
                                            className="model-select"
                                            value={config[field.key] || ''}
                                            onChange={(e) => {
                                                let val = e.target.value;
                                                config.model = val;
                                                config.save();
                                            }}
                                        ><optgroup label="Select a model">
                                            {Object.keys(llm.versions).map(name => {
                                                let version = llm.versions[name];
                                                let attachments: string[] = [
                                                    version.capabilities.pdf ? "📄" : "&nbsp;",
                                                    version.capabilities.vision ? "🖼️" : "&nbsp;"
                                                ];
                                                return (
                                                    <option key={name} value={name} disabled={version.deprecated}>
                                                        {version.label + "&bbsp;" + attachments.join("") + (version.deprecated ? ' (deprecated)' : '')}
                                                    </option>);
                                            })}
                                        </optgroup></select>
                                        <ModelCapabilitiesBadges model={selectedModel} />
                                    </div>
                                ) : (
                                    // Regular input (text/password)
                                    <input
                                        type={field.type}
                                        value={config[field.key] || ''}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            switch (field.key) {
                                                case "apiKey": config.apiKey = val; break;
                                                case "model": config.model = val; break;
                                                case "baseUrl": config.baseUrl = val; break;
                                                /*case "name":
                                                    rename disabled for now: need to modify all collections like those?
                                                    delete JodieConfig.current.providers[oldName];
                                                    delete AIConfig.get(oldName);
                                                    delete AI[oldName]
                                                    // ?? ALL_AI_PROVIDER
                                                    // ?? AI[name].versions[val] = config;
                                                    config.name = val;
                                                break;*/
                                            }
                                            config.save();
                                        }}
                                        placeholder={field.placeholder}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="provider-actions">
                            <button
                                className={`test-btn ${status}`}
                                onClick={() => handleTestConnection(name)}
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
                        const newDefault = (e.target.value as TAIProvider) || null;
                        setDefaultProvider(newDefault);
                        JodieConfig.setGlobalDefault(newDefault);
                    }}
                >
                    <option value="">Auto (first available)</option>
                    {configuredProvidersList.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </select>
                {configuredProvidersList.length === 0 && (
                    <p className="default-provider-empty">Configure at least one provider below to set a default.</p>
                )}
            </div>

            <div className="providers-list">
                {ALL_AI_PROVIDERS.map(provider=> AI[provider]).map(llm=>(
                    llm.name === AIProvider.Custom ? null :
                        renderProviderCard(llm.name, [
                            { key: 'apiKey', label: 'API Key', type: 'password', placeholder: llm.keyPlaceholder || "Your " + llm.name + " API key" },
                            { key: 'model', label: 'Model', type: 'model', placeholder: '' },
                        ]
                    )
                ))}


                {/* Custom Provider */}
                <div className="providers-divider">
                    <span>Custom Provider</span>
                </div>

                {renderProviderCard(
                    AIProvider.Custom,
                    [
                        // { key: 'name', label: 'Provider Name', type: 'text', placeholder: 'My Custom Provider' },
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
                    {onClose && <button className="btn-secondary" onClick={onClose}>Close</button>}
                </div>
            </div>
        </div>
    );
}

export default AISettingsContent;

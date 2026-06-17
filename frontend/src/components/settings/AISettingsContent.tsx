import React, { useState, useEffect, useMemo } from 'react';
import {AI, AIConfig, AIProvider, AIVersion, ALL_AI_PROVIDERS, JodieConfig, TAIProvider} from '../../types/jodie';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import './AISettingsContent.scss';
import type {Dictionary, GObject} from "../../joiner";
import {U} from "../../joiner";
import { OpenAIIcon } from '../icons/ProviderIcons';
import { AIProviderService } from '../../services/AIProviderService';

import groqLogo from '../../static/img/groq.webp';
import kimiLogo from '../../static/img/kimi.svg';
import ollamaLogo from '../../static/img/ollama.png';
import claudeLogo from '../../static/img/claude.webp';
import mistralLogo from '../../static/img/mistral-color.webp';
import geminiLogo from '../../static/img/gemini.webp';
import deepseekLogo from '../../static/img/deepseek.webp';
import copilotLogo from '../../static/img/copilot.webp';





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

const nbsp = String.fromCharCode(160); // "&nbsp;"
// Component to show model capability badges
function ModelCapabilitiesBadges({ model }: { model: AIVersion | undefined }): JSX.Element | null {
    if (!model) return null;

    const { capabilities } = model;

    return (
        <div className="model-capabilities">
            {capabilities.vision && (
                <Badge category="type">
                    <i className="bi bi-image" />
                    Images
                </Badge>
            )}
            {capabilities.pdf && (
                <Badge category="type">
                    <i className="bi bi-file-earmark-pdf" />
                    PDF
                </Badge>
            )}
            {!capabilities.vision && !capabilities.pdf && (
                <Badge category="state">
                    <i className="bi bi-fonts" />
                    Text only
                </Badge>
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
    const [testError, setTestError] = useState<Dictionary<string, string>>({});
    const [expandedProvider, setExpandedProvider] = useState<TAIProvider | null>(null);
    // const [update, setUpdate] = useState(0);

    // Test provider connection against the real provider endpoint (shared AIProviderService).
    // On success persist lastTested + enabled (mirrors ProviderConfigModal) so the provider's
    // status is consistent across both settings UIs; on failure clear enabled and keep the error.
    const handleTestConnection = async (provider: TAIProvider) => {
        setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
        setTestError(prev => ({ ...prev, [provider]: '' }));

        try {
            const result = await AIProviderService.testConnection(provider);
            const config = AIConfig.get(provider);

            if (result.success) {
                config.lastTested = Date.now();
                config.enabled = true;
                config.save();
                setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
                setTimeout(() => {
                    setTestStatus(prev => ({ ...prev, [provider]: 'idle' }));
                }, 3000);
            } else {
                config.enabled = false;
                config.save();
                setTestError(prev => ({ ...prev, [provider]: result.error || 'Connection failed' }));
                setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            }
        } catch (err) {
            const config = AIConfig.get(provider);
            config.enabled = false;
            config.save();
            setTestError(prev => ({ ...prev, [provider]: (err as Error).message || 'Connection failed' }));
            setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
        }
    };

    // Render provider card
    const renderProviderCard = (
        name: TAIProvider,
        fields: {key: 'apiKey' | 'model' | 'baseUrl' /*| 'name'*/; label: string; type: 'text' | 'password' | 'model'; placeholder: string }[]
    ) => {
        const [update, setUpdate] = useState(0);
        const isExpanded = expandedProvider === name;
        const config = AIConfig.get(name);
        let llm = AI[name];
        // Dynamic subtitle: first 3 non-deprecated models from the registry, truncated with "…".
        // Source of truth for models is this registry — the Settings panel no longer selects
        // per-provider model; the app-level picker chooses per-feature.
        let nonLegacyVersions = Object.values(llm.versions).filter(v => !v.deprecated);
        let description: string = nonLegacyVersions.slice(0, 3).map(e=>e.label).join(', ') + (nonLegacyVersions.length>3 ? "…" : "");
        if (!description) description = 'OpenAI-compatible endpoint';
        const isConfigured: boolean = config.isConfigured();

        const status = testStatus[name] || 'idle';

        // Get available models for this provider
        const availableModels: AIVersion[] = Object.values(llm.versions);
        const selectedModel = llm.versions[config.model];

        const AIicon = (name: string) => {

            switch (name) {
                case 'GPT': 
                    return <i className="bi bi-openai"></i>;
                case 'Claude': 
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={claudeLogo} />;
                case 'Groq':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={groqLogo} />;
                case 'DeepSeek':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={deepseekLogo} />;
                case 'Gemini':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={geminiLogo} />;
                case 'Mistral':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={mistralLogo} />;
                case 'Ollama':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={ollamaLogo} />;
                case 'Llama':
                    return 'Llama';
                case 'Copilot':
                    return <img style={{width: '24px', height: '24px', borderRadius: '3px'}} src={copilotLogo} />;
                case 'Kimi':
                    return <img style={{width: '24px', height: '24px', backgroundColor: '#ccc', padding: '2px', borderRadius: '3px'}} src={kimiLogo} />;
                case 'Custom':
                    return 'Custom';
                default:
                    return null;
            }
            
        }

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
                            AIicon(name)
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
                            <Badge category="version">
                                <i className="bi bi-check-circle-fill" />
                                Configured
                            </Badge>
                        )}
                        <i className={`bi bi-chevron-${isExpanded ? 'up' : 'down'} chevron`} />
                    </div>
                </div>

                {isExpanded && (
                    <div className="provider-content">
                        {fields.map(field => (
                            <div key={field.key} className="form-group">
                                <label>{field.label} {llm.keyUrl && field.key === 'apiKey' ?
                                    <a href={llm.keyUrl} target={"_blank"} title={"Get your key"}><i className="bi bi-link-45deg"/></a>
                                    : null}</label>

                                {/* Model selection moved to app-level picker (common/ProviderModelSelector)
                                    per 2026-04-20 single-source-of-truth refactor. Settings panel only
                                    validates credentials and provider-specific config (endpoint, etc.). */}
                                {(
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
                                            setUpdate(update + 1);
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
                                title={status === 'error' && testError[name] ? testError[name] : undefined}
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
                    <p>Configure AI providers used by Jjodel features</p>
                </div>
            )}

            <div className="providers-list">
                {ALL_AI_PROVIDERS.map(provider => {
                    const llm = AI[provider];
                    return llm.name === AIProvider.Custom ? null :
                        renderProviderCard(llm.name, [
                            { key: 'apiKey', label: 'API Key', type: 'password', placeholder: llm.keyPlaceholder || "Your " + llm.name + " API key" },
                        ]);
                })}


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
                    {onClose && (
                        <Button variant="secondary" onClick={onClose}>
                            Cancel
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AISettingsContent;

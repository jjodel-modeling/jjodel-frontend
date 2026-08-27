import React, { useState, useEffect, useMemo, useRef } from 'react';
import {AI, AIConfig, AIProvider, AIVersion, ALL_AI_PROVIDERS, JodieConfig, TAIProvider} from '../../types/jodie';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import './AISettingsContent.scss';
import type {Dictionary, GObject} from "../../joiner";
import {U} from "../../joiner";
import { OpenAIIcon } from '../icons/ProviderIcons';
import { AIProviderService } from '../../services/AIProviderService';
import { AIEvents } from '../../events/registry';

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
    // Section the expanded row belonged to when it was opened. A row is grouped by its
    // configured state, which flips on the first character typed in the API key field: without
    // this freeze the open row would move to the other list, React would unmount its subtree
    // and the input would lose focus mid-typing.
    const [expandedGroup, setExpandedGroup] = useState<'configured' | 'available' | null>(null);
    // Forces a re-render on non-key field edits (baseUrl/model) so the card reflects them live.
    const [, forceRefresh] = useState(0);
    // SINGLE SOURCE OF TRUTH for each provider's API key: seeded from persisted config on mount,
    // mirrored back to config on every change, and re-synced from config on PROVIDER_CHANGED. The
    // field value, the status pill, and the test-button enablement all derive from this map — so an
    // empty field can never coexist with a "Configured" pill. Keyed by provider id (independent).
    const [apiKeyByProvider, setApiKeyByProvider] = useState<Dictionary<string, string>>(() => {
        const init: Dictionary<string, string> = {};
        for (const p of ALL_AI_PROVIDERS) init[p] = AIConfig.get(p).apiKey || '';
        return init;
    });
    // const [update, setUpdate] = useState(0);

    // After a test resolves, the button holds its result for REVERT_DELAY_MS then returns to the
    // idle "Test Connection" label. Timers are held per-provider in a ref so a new test cancels the
    // pending revert, and all are cleared on unmount (no setState-after-unmount).
    const REVERT_DELAY_MS = 3000;
    const revertTimers = useRef<Dictionary<string, ReturnType<typeof setTimeout>>>({});

    // Keep the key state in lockstep with persisted config whenever any provider is saved
    // (covers changes made elsewhere, e.g. ProviderConfigModal) — preserves the single source of truth.
    useEffect(() => {
        const onProviderChanged = () => {
            const next: Dictionary<string, string> = {};
            for (const p of ALL_AI_PROVIDERS) next[p] = AIConfig.get(p).apiKey || '';
            setApiKeyByProvider(next);
        };
        window.addEventListener(AIEvents.PROVIDER_CHANGED, onProviderChanged);
        return () => window.removeEventListener(AIEvents.PROVIDER_CHANGED, onProviderChanged);
    }, []);

    // Clear any pending revert timers when the component unmounts.
    useEffect(() => () => {
        Object.values(revertTimers.current).forEach(id => clearTimeout(id));
    }, []);

    const clearRevertTimer = (provider: TAIProvider) => {
        const id = revertTimers.current[provider];
        if (id) {
            clearTimeout(id);
            delete revertTimers.current[provider];
        }
    };

    // Hold the test result (success/error) for REVERT_DELAY_MS, then revert the button to idle.
    const scheduleRevert = (provider: TAIProvider) => {
        clearRevertTimer(provider);
        revertTimers.current[provider] = setTimeout(() => {
            setTestStatus(prev => ({ ...prev, [provider]: 'idle' }));
            delete revertTimers.current[provider];
        }, REVERT_DELAY_MS);
    };

    // Test provider connection against the real provider endpoint (shared AIProviderService).
    // Persist the outcome on config (lastTested + lastTestOk, plus enabled) so the status pill can
    // show Connected / Invalid key across both settings UIs; on failure keep the error message.
    // The transient button result auto-reverts to idle via scheduleRevert (success and failure alike).
    const handleTestConnection = async (provider: TAIProvider) => {
        clearRevertTimer(provider); // cancel a pending revert from a previous test before starting a new one
        setTestStatus(prev => ({ ...prev, [provider]: 'testing' }));
        setTestError(prev => ({ ...prev, [provider]: '' }));

        try {
            const result = await AIProviderService.testConnection(provider);
            const config = AIConfig.get(provider);

            if (result.success) {
                config.lastTested = Date.now();
                config.lastTestOk = true;
                config.enabled = true;
                config.save();
                setTestStatus(prev => ({ ...prev, [provider]: 'success' }));
            } else {
                config.lastTested = Date.now();
                config.lastTestOk = false;
                config.enabled = false;
                config.save();
                setTestError(prev => ({ ...prev, [provider]: result.error || 'Connection failed' }));
                setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
            }
        } catch (err) {
            const config = AIConfig.get(provider);
            config.lastTested = Date.now();
            config.lastTestOk = false;
            config.enabled = false;
            config.save();
            setTestError(prev => ({ ...prev, [provider]: (err as Error).message || 'Connection failed' }));
            setTestStatus(prev => ({ ...prev, [provider]: 'error' }));
        } finally {
            scheduleRevert(provider); // hold result ~3s then revert button to idle (both success and failure)
        }
    };

    // Derive configured-state from the single source of truth (key map), mirroring isConfigured()
    // semantics: requiresKey providers → non-empty key; Ollama → baseUrl; Custom → key OR baseUrl.
    const isProviderConfigured = (name: TAIProvider): boolean => {
        const config = AIConfig.get(name);
        const llm = AI[name];
        const liveKey = (apiKeyByProvider[name] ?? '').trim();
        const baseUrlConfigured = !!(config.baseUrl && String(config.baseUrl).trim());
        return name === AIProvider.Custom ? (liveKey !== '' || baseUrlConfigured)
            : llm.requiresKey ? liveKey !== ''
            : baseUrlConfigured;
    };

    // Inline model list shown next to the provider name: first 3 non-deprecated models from the
    // registry, truncated with "…". Source of truth for models is this registry — the Settings
    // panel no longer selects per-provider model; the app-level picker chooses per-feature.
    // Custom has a single placeholder version ('Custom'), which says nothing: name the shape of
    // the endpoint instead.
    const modelsSummary = (name: TAIProvider): string => {
        if (name === AIProvider.Custom) return 'OpenAI-compatible endpoint';
        const nonLegacyVersions = Object.values(AI[name].versions).filter(v => !v.deprecated);
        const summary = nonLegacyVersions.slice(0, 3).map(e => e.label).join(', ') + (nonLegacyVersions.length > 3 ? "…" : "");
        return summary || 'OpenAI-compatible endpoint';
    };

    // Label of the model this provider currently points at, shown only on configured rows.
    // Falls back to the raw id for models outside the registry (custom / user-pulled tags).
    const activeModelLabel = (name: TAIProvider): string => {
        const config = AIConfig.get(name);
        return AI[name].versions[config.model]?.label || config.model || '';
    };

    const toggleProvider = (name: TAIProvider) => {
        if (expandedProvider === name) { setExpandedProvider(null); setExpandedGroup(null); }
        else { setExpandedProvider(name); setExpandedGroup(isProviderConfigured(name) ? 'configured' : 'available'); }
    };

    // Render provider card
    const renderProviderCard = (
        name: TAIProvider,
        fields: {key: 'apiKey' | 'model' | 'baseUrl' /*| 'name'*/; label: string; type: 'text' | 'password' | 'model'; placeholder: string }[],
        inConfiguredGroup: boolean
    ) => {
        const isExpanded = expandedProvider === name;
        const config = AIConfig.get(name);
        let llm = AI[name];
        let description: string = modelsSummary(name);
        const isConfigured: boolean = isProviderConfigured(name);

        // Row state — the persistent at-a-glance status (the transient test button complements it):
        //   no key → "Set up" (muted) · last test failed → red dot + "Invalid key" ·
        //   otherwise → green dot + the active model. The "Not configured" chip is gone: eleven
        //   identical chips carried no information (mockup 5a).
        // Reactive: recomputes on key changes (apiKeyByProvider) and on test completion
        // (config.lastTested/Ok).
        const keyInvalid = isConfigured && config.lastTested != null && config.lastTestOk === false;

        const status = testStatus[name] || 'idle';

        // Get available models for this provider
        const availableModels: AIVersion[] = Object.values(llm.versions);
        const selectedModel = llm.versions[config.model];

        // Logos are normalized by the 28x28 tile around them (.ai-provider-row__logo): the image
        // fills the tile, the glyph and the letter sit centered on the provider's pastel.
        const AIicon = (name: string) => {

            switch (name) {
                case 'GPT':
                    return <i className="bi bi-openai"></i>;
                case 'Claude':
                    return <img src={claudeLogo} alt="" />;
                case 'Groq':
                    return <img src={groqLogo} alt="" />;
                case 'DeepSeek':
                    return <img src={deepseekLogo} alt="" />;
                case 'Gemini':
                    return <img src={geminiLogo} alt="" />;
                case 'Mistral':
                    return <img src={mistralLogo} alt="" />;
                case 'Ollama':
                    return <img src={ollamaLogo} alt="" />;
                case 'Llama':
                    return 'Llama';
                case 'Copilot':
                    return <img src={copilotLogo} alt="" />;
                case 'Kimi':
                    return <img src={kimiLogo} alt="" />;
                case 'Custom':
                    return 'Custom';
                default:
                    return null;
            }

        }

        return (
            <div
                key={name}
                className={`ai-provider-row ${isExpanded ? 'expanded' : ''} ${inConfiguredGroup ? 'ai-provider-row--configured' : ''}`}
            >
                <button
                    type="button"
                    className="ai-provider-row__head"
                    onClick={() => toggleProvider(name)}
                    aria-expanded={isExpanded}
                >
                    {/* Custom has no pastel of its own (registry pair is #000 on #fff): let the
                        tile keep its neutral default instead of painting it white on white. */}
                    <span
                        className="ai-provider-row__logo"
                        style={name === AIProvider.Custom ? undefined : { background: llm.bgColor, color: llm.color }}
                    >
                        {llm.logo ? AIicon(name) : (
                            name === AIProvider.Custom ? <i className="bi bi-puzzle" /> : llm.initial
                        )}
                    </span>

                    <span className="ai-provider-row__name">{name}</span>
                    <span className="ai-provider-row__models">{description}</span>

                    {isConfigured ? (
                        <span className={`ai-provider-row__state ai-provider-row__state--active ${keyInvalid ? 'ai-provider-row__state--error' : ''}`}>
                            <span className="ai-provider-row__dot" />
                            {keyInvalid ? 'Invalid key' : activeModelLabel(name)}
                        </span>
                    ) : (
                        <span className="ai-provider-row__state">Set up</span>
                    )}

                    <i className="bi bi-chevron-down ai-provider-row__chevron" />
                </button>

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
                                        value={field.key === 'apiKey' ? (apiKeyByProvider[name] ?? '') : (config[field.key] || '')}
                                        onChange={(e) => {
                                            let val = e.target.value;
                                            switch (field.key) {
                                                case "apiKey":
                                                    config.apiKey = val;
                                                    // mirror to the single source of truth (drives field + pill)
                                                    setApiKeyByProvider(prev => ({ ...prev, [name]: val }));
                                                    break;
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
                                            // Any credential edit invalidates a prior test result → untested.
                                            config.lastTested = undefined;
                                            config.lastTestOk = undefined;
                                            config.save();
                                            // Re-render for non-key edits (baseUrl/model); the apiKey
                                            // case already re-renders via setApiKeyByProvider above.
                                            forceRefresh(v => v + 1);
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

    // Fields of the expanded form, unchanged: credentials only (the model is chosen by the
    // app-level picker), plus endpoint and model name for Custom.
    const fieldsFor = (
        name: TAIProvider
    ): {key: 'apiKey' | 'model' | 'baseUrl'; label: string; type: 'text' | 'password' | 'model'; placeholder: string }[] =>
        name === AIProvider.Custom
            ? [
                // { key: 'name', label: 'Provider Name', type: 'text', placeholder: 'My Custom Provider' },
                { key: 'baseUrl', label: 'Base URL', type: 'text', placeholder: 'https://api.example.com/v1/chat/completions' },
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: 'Your API key' },
                { key: 'model', label: 'Model Name', type: 'text', placeholder: 'model-name' },
            ]
            : [
                { key: 'apiKey', label: 'API Key', type: 'password', placeholder: AI[name].keyPlaceholder || "Your " + name + " API key" },
            ];

    // Two sections by state. The open row keeps the section it was opened in (see expandedGroup).
    const configuredProviders: TAIProvider[] = [];
    const availableProviders: TAIProvider[] = [];
    for (const provider of ALL_AI_PROVIDERS) {
        const configured = (provider === expandedProvider && expandedGroup)
            ? expandedGroup === 'configured'
            : isProviderConfigured(provider);
        (configured ? configuredProviders : availableProviders).push(provider);
    }

    return (
        <div className="ai-settings-content">
            {showHeader && (
                <div className="settings-header">
                    <h2>AI Providers</h2>
                    <p>Configure AI providers used by Jjodel features</p>
                </div>
            )}

            <div className="providers-list">
                {configuredProviders.length > 0 && (
                    <div className="ai-provider-group">
                        <div className="ai-provider-group__label">Configured · {configuredProviders.length}</div>
                        {configuredProviders.map(provider => renderProviderCard(provider, fieldsFor(provider), true))}
                    </div>
                )}

                {availableProviders.length > 0 && (
                    <div className="ai-provider-group">
                        <div className="ai-provider-group__label">Available · {availableProviders.length}</div>
                        {/* Custom closes the list: it is last in ALL_AI_PROVIDERS and needs no divider
                            of its own — the inline subtitle says what it is. */}
                        {availableProviders.map(provider => renderProviderCard(provider, fieldsFor(provider), false))}
                    </div>
                )}
            </div>

            <div className="settings-footer">
                <div className="footer-info">
                    <i className="bi bi-shield-lock" />
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

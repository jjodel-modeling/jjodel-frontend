/**
 * Provider Configuration Modal
 * Modal for configuring AI provider settings (API key, model, test connection)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { AIProvider, PROVIDER_INFO, PROVIDER_MODELS, OLLAMA_DEFAULT_BASE_URL } from '../../types/jodie';
import { AIProviderService } from '../../services/AIProviderService';
import { JodieConfigService } from '../../services/JodieConfig';
import './ProviderConfigModal.scss';

// Provider metadata (URLs for API key pages)
const PROVIDER_KEY_URLS: Record<AIProvider, string | null> = {
    openai: 'https://platform.openai.com/api-keys',
    claude: 'https://console.anthropic.com/settings/keys',
    gemini: 'https://aistudio.google.com/app/apikey',
    deepseek: 'https://platform.deepseek.com/api_keys',
    mistral: 'https://console.mistral.ai/api-keys/',
    groq: 'https://console.groq.com/keys',
    kimi: 'https://platform.moonshot.cn/console/api-keys',
    ollama: null,  // Ollama is local, no API key page
};

const PROVIDER_COMPANIES: Record<AIProvider, string> = {
    openai: 'OpenAI',
    claude: 'Anthropic',
    gemini: 'Google',
    deepseek: 'DeepSeek AI',
    mistral: 'Mistral AI',
    groq: 'Groq Inc.',
    kimi: 'Moonshot AI',
    ollama: 'Local',
};

// Provider initials for slate icons (same as cards)
const PROVIDER_INITIALS: Record<AIProvider, string> = {
    openai: 'O',
    claude: 'C',
    gemini: 'G',
    deepseek: 'D',
    mistral: 'M',
    groq: 'G',
    kimi: 'K',
    ollama: 'O',
};

interface ProviderConfigModalProps {
    provider: AIProvider;
    isOpen: boolean;
    onClose: () => void;
    onSave: (provider: AIProvider, config: { apiKey: string; model: string; enabled: boolean; baseUrl?: string }) => void;
    initialConfig: {
        apiKey: string;
        model: string;
        enabled: boolean;
        lastTested?: number;
        baseUrl?: string;
    };
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
    provider,
    isOpen,
    onClose,
    onSave,
    initialConfig,
}) => {
    const [apiKey, setApiKey] = useState(initialConfig.apiKey);
    const [model, setModel] = useState(initialConfig.model);
    const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl || (provider === 'ollama' ? OLLAMA_DEFAULT_BASE_URL : ''));
    const [showKey, setShowKey] = useState(false);
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState('');

    // Check if this provider requires an API key
    const requiresApiKey = provider !== 'ollama';

    const info = PROVIDER_INFO[provider];
    const models = PROVIDER_MODELS[provider];
    const keyUrl = PROVIDER_KEY_URLS[provider];
    const company = PROVIDER_COMPANIES[provider];

    // Reset state when modal opens with new provider
    useEffect(() => {
        if (isOpen) {
            setApiKey(initialConfig.apiKey);
            setModel(initialConfig.model);
            setBaseUrl(initialConfig.baseUrl || (provider === 'ollama' ? OLLAMA_DEFAULT_BASE_URL : ''));
            setShowKey(false);
            // For Ollama: show success if enabled + lastTested (no API key required)
            // For others: show success if apiKey + enabled + lastTested
            const wasSuccessfullyTested = provider === 'ollama'
                ? initialConfig.enabled && initialConfig.lastTested
                : initialConfig.apiKey && initialConfig.enabled && initialConfig.lastTested;
            setTestStatus(wasSuccessfullyTested ? 'success' : 'idle');
            setTestMessage('');
        }
    }, [isOpen, provider, initialConfig]);

    // Reset test status when config changes
    useEffect(() => {
        const changed = apiKey !== initialConfig.apiKey || model !== initialConfig.model || baseUrl !== (initialConfig.baseUrl || '');
        if (changed) {
            setTestStatus('idle');
        }
    }, [apiKey, model, baseUrl, initialConfig]);

    // Test connection
    const handleTest = useCallback(async () => {
        // Ollama doesn't require API key, other providers do
        if (requiresApiKey && !apiKey) {
            setTestStatus('error');
            setTestMessage('Please enter an API key');
            return;
        }

        setTestStatus('testing');
        setTestMessage('Testing connection...');

        try {
            // Temporarily save config for testing
            const configToSave: { apiKey: string; model: string; enabled: boolean; baseUrl?: string } = {
                apiKey,
                model,
                enabled: true,
            };
            if (provider === 'ollama') {
                configToSave.baseUrl = baseUrl;
            }
            JodieConfigService.saveProviderConfig(provider, configToSave);

            const result = await AIProviderService.testConnection(provider);

            if (result.success) {
                setTestStatus('success');
                setTestMessage('Connected successfully!');
                JodieConfigService.markProviderTested(provider);
            } else {
                setTestStatus('error');
                setTestMessage(result.error || 'Connection failed');
                // Revert enabled state on failure
                JodieConfigService.saveProviderConfig(provider, {
                    ...configToSave,
                    enabled: false,
                });
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error.message || 'Connection failed');
        }
    }, [apiKey, model, baseUrl, provider, requiresApiKey]);

    // Save and close
    const handleSave = useCallback(() => {
        const enabled = testStatus === 'success';
        const config: { apiKey: string; model: string; enabled: boolean; baseUrl?: string } = {
            apiKey,
            model,
            enabled,
        };
        if (provider === 'ollama') {
            config.baseUrl = baseUrl;
        }
        onSave(provider, config);
        onClose();
    }, [apiKey, model, baseUrl, testStatus, provider, onSave, onClose]);

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    // Determine current status for display
    const getStatusDisplay = () => {
        if (testStatus === 'testing') {
            return { text: 'Testing...', class: 'testing', dot: true };
        }
        if (testStatus === 'success') {
            return { text: 'Connected', class: 'connected', dot: true };
        }
        if (testStatus === 'error') {
            return { text: testMessage || 'Error', class: 'error', dot: true };
        }
        // Ollama doesn't require API key
        if (requiresApiKey && !apiKey) {
            return { text: 'Not configured', class: 'not-configured', dot: false };
        }
        return { text: 'Ready to test', class: 'ready', dot: true };
    };

    const status = getStatusDisplay();

    return (
        <div className="provider-modal-overlay" onClick={onClose}>
            <div className="provider-modal" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="provider-modal-header">
                    <div className="provider-modal-identity">
                        <div className="provider-modal-icon">
                            {PROVIDER_INITIALS[provider]}
                        </div>
                        <div className="provider-modal-title">
                            <h3>{info.name}</h3>
                            <span className="provider-company">Configure API access</span>
                        </div>
                    </div>
                    <button className="provider-modal-close" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                {/* Body */}
                <div className="provider-modal-body">
                    {/* Base URL Field (Ollama only) */}
                    {provider === 'ollama' && (
                        <div className="modal-field">
                            <label>Base URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => setBaseUrl(e.target.value)}
                                placeholder="http://localhost:11434"
                                className="modal-input"
                            />
                        </div>
                    )}

                    {/* API Key Field */}
                    <div className="modal-field">
                        <label>API Key{!requiresApiKey && ' (Optional)'}</label>
                        <div className="api-key-input-wrapper">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={requiresApiKey ? `Enter your ${info.name} API key` : 'Optional - leave empty for local'}
                                className="modal-input"
                                autoComplete="off"
                            />
                            <button
                                type="button"
                                className="toggle-visibility-btn"
                                onClick={() => setShowKey(!showKey)}
                                title={showKey ? 'Hide' : 'Show'}
                            >
                                <i className={`bi ${showKey ? 'bi-eye-slash' : 'bi-eye'}`} />
                            </button>
                        </div>
                    </div>

                    {/* Model Field */}
                    <div className="modal-field">
                        <label>Model</label>
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="modal-select"
                        >
                            {models.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Status + Test Row */}
                    <div className="modal-status-row">
                        <div className={`modal-status ${status.class}`}>
                            {status.dot && <span className="status-dot" />}
                            <span className="status-text">{status.text}</span>
                        </div>
                        <button
                            className={`test-connection-btn ${testStatus}`}
                            onClick={handleTest}
                            disabled={(requiresApiKey && !apiKey) || testStatus === 'testing'}
                        >
                            {testStatus === 'testing' ? (
                                <>
                                    <i className="bi bi-arrow-repeat spinning" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-plug" />
                                    Test Connection
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="provider-modal-footer">
                    {keyUrl && (
                        <a
                            href={keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="get-api-key-link"
                        >
                            <i className="bi bi-box-arrow-up-right" />
                            How to get your {info.name} API key
                        </a>
                    )}
                    {!keyUrl && (
                        <span className="ollama-hint">
                            Make sure Ollama is running locally
                        </span>
                    )}

                    <div className="modal-actions">
                        <button className="modal-btn-secondary" onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            className="modal-btn-primary"
                            onClick={handleSave}
                            disabled={requiresApiKey && !apiKey}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderConfigModal;

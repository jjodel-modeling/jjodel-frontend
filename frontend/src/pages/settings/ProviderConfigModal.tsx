/**
 * Provider Configuration Modal
 * Modal for configuring AI provider settings (API key, model, test connection)
 */

import React, { useState, useEffect, useCallback } from 'react';
import {AI} from '../../types/jodie';
import { FeaturePreferenceStore, PROVIDER_SPECS, ProviderConfigStore, registry } from '../../services/ai';
import type { ProviderId, StoredProviderConfig } from '../../services/ai';
import { isDeprecatedModel } from '../../components/common/ProviderModelSelector';
import './ProviderConfigModal.scss';


interface ProviderConfigModalProps {
    provider: ProviderId;
    isOpen: boolean;
    onClose: () => void;
    onSave?: (provider: ProviderId, config: StoredProviderConfig) => void;
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error';

export const ProviderConfigModal: React.FC<ProviderConfigModalProps> = ({
    provider,
    isOpen,
    onClose,
    onSave,
}) => {
    // The stored record, re-read at every render as AIConfig.get did; the model falls back to the
    // provider's own (the first static entry when none was saved).
    const stored = ProviderConfigStore.load(provider) ?? {};
    const llmProvider = registry.get(provider);
    const config = {
        apiKey: stored.apiKey ?? '',
        model: stored.model ?? llmProvider.spec.seedModels[0]?.apiName ?? '',
        baseUrl: stored.baseUrl ?? '',
    };
    const [apiKey, setApiKey] = useState(config.apiKey);
    const [model, setModel] = useState(config.model);
    const [baseUrl, setBaseUrl] = useState(config.baseUrl);
    const [showKey, setShowKey] = useState(false);
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [testMessage, setTestMessage] = useState('');

    // Check if this provider requires an API key
    const requiresApiKey = PROVIDER_SPECS[provider].requiresKey;
    let llm = AI[provider];

    // Reset state when modal opens with new provider
    useEffect(() => {
        if (isOpen) {
            setApiKey(config.apiKey);
            setModel(config.model);
            setBaseUrl(config.baseUrl);
            setShowKey(false);
            setTestStatus(llmProvider.enabled() && stored.enabled && stored.lastTested ? 'success' : 'idle');
            setTestMessage('');
        }
    }, [isOpen, provider, config]);

    // Reset test status when config changes
    useEffect(() => {
        const changed = apiKey !== config.apiKey || model !== config.model || baseUrl !== (config.baseUrl || '');
        if (changed) {
            setTestStatus('idle');
            ProviderConfigStore.save(provider, { lastTested: undefined });
        }
    }, [apiKey, model, baseUrl, config]);

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
            // The test reads the stored settings: the fields below save on every edit. It tests the
            // model the chat calls this provider with, as the settings row labels it (#179).
            const pref = FeaturePreferenceStore.get('chat');
            const result = await registry.get(provider).test(pref?.providerId === provider ? pref.modelId : undefined);

            if (result.success) {
                setTestStatus('success');
                setTestMessage('Connected successfully!');
                ProviderConfigStore.save(provider, { lastTested: Date.now(), enabled: true });
            } else {
                setTestStatus('error');
                setTestMessage(result.error || 'Connection failed');
                // Revert enabled state on failure
                ProviderConfigStore.save(provider, { enabled: false });
            }
        } catch (error: any) {
            ProviderConfigStore.save(provider, { enabled: false });
            setTestStatus('error');
            setTestMessage(error.message || 'Connection failed');
        }
    }, [apiKey, model, baseUrl, provider, requiresApiKey]);

    /*/ Save and close
    const handleSave = useCallback(() => {
        const enabled = testStatus === 'success';
        const config: AIConfig = {...config,
            apiKey,
            model,
            enabled,
        };
        if (!requiresApiKey) { config.baseUrl = baseUrl; }
        onSave(provider, config);
        onClose();
    }, [apiKey, model, baseUrl, testStatus, provider, onSave, onClose]);*/

    // Handle escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isOpen) { onClose(); }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

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
                            {llm.initial}
                        </div>
                        <div className="provider-modal-title">
                            <h3>{llm.name}</h3>
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
                    {!requiresApiKey && (
                        <div className="modal-field">
                            <label>Base URL</label>
                            <input
                                type="text"
                                value={baseUrl}
                                onChange={(e) => {
                                    setBaseUrl(e.target.value);
                                    ProviderConfigStore.save(provider, { baseUrl: e.target.value });
                                }}
                                placeholder="http://localhost:11434"
                                className="modal-input"
                            />
                        </div>
                    )}

                    {/* API Key Field */}
                    <div className="modal-field">
                        <label>API Key{requiresApiKey ? '' : ' (Optional)'}</label>
                        <div className="api-key-input-wrapper">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => {
                                    setApiKey(e.target.value);
                                    ProviderConfigStore.save(provider, { apiKey: e.target.value });
                                }}
                                placeholder={requiresApiKey ? `Enter your ${llm.name} API key` : 'Optional - leave empty for local'}
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
                            onChange={(e) => {
                                setModel(e.target.value);
                                ProviderConfigStore.save(provider, { model: e.target.value });
                            }}
                            className="modal-select"
                        >
                            {llmProvider.models().map(m => (
                                <option key={m.apiName} value={m.apiName} disabled={isDeprecatedModel(provider, m.apiName)}>{m.displayName}</option>
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
                                <><i className="bi bi-arrow-repeat spinning" />Testing...</>
                            ) : (
                                <><i className="bi bi-plug" />Test Connection</>
                            )}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="provider-modal-footer">
                    {llm.keyUrl && (
                        <a
                            href={llm.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="get-api-key-link"
                        >
                            <i className="bi bi-box-arrow-up-right" />
                            How to get your {llm.name} API key
                        </a>
                    )}
                    {!llm.keyUrl && <span className="ollama-hint">Make sure {llm.name} is running locally</span>}

                    <div className="modal-actions">
                        <button className="modal-btn-secondary" onClick={onClose}>Close</button>
                        {/*<button
                            className="modal-btn-primary"
                            onClick={handleSave}
                            disabled={requiresApiKey && !apiKey}
                        >Save</button>*/}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProviderConfigModal;

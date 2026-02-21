/**
 * Settings Modal Component
 * Configure AI providers and API keys
 */

import React, {useState, useEffect, ReactNode} from 'react';
import {
    AIProvider,
    TAIProvider,
    JodieConfig,
    PROVIDER_INFO,
    PROVIDER_MODELS,
} from '../../types/jodie';
import { JodieConfigService } from '../../services/JodieConfig';
import { AIProviderService } from '../../services/AIProviderService';
import { ProviderIcon } from '../icons';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface ProviderSettingProps {
    provider: TAIProvider;
    config: JodieConfig;
    onUpdate: (provider: TAIProvider, updates: Partial<JodieConfig['providers'][TAIProvider]>) => void;
}

function API_Key_JSX(provider: TAIProvider) {// todo: should really make a class containing all info of a service instead of scattered data.
    let info: {
        url: string,
        displayName: ReactNode;
        tip?: ReactNode;
    }
    switch (provider) {
        case AIProvider.Claude: info = {url: 'https://console.anthropic.com/settings/keys', displayName: 'console.anthropic.com'}; break;
        case AIProvider.GPT: info = {url: 'https://platform.openai.com/api-keys', displayName: 'platform.openai'}; break;
        case AIProvider.DeepSeek: info = {url: 'https://platform.deepseek.com/api_keys', displayName: 'platform.deepseek.com'}; break;
        case AIProvider.Gemini: info = {url: 'https://aistudio.google.com/app/apikey', displayName: 'Google AI Studio'}; break;
        default: info = {url: '#', displayName: 'Unsupported service 🚫'}; break;
        // case 'template: info = {url: '', displayName: ''}; break;
    }
    if (!info.tip) info.tip = <>{" "}Keys start with <code>sk-ant-</code></>;
    return (
        <div className="jodie-settings-help">
            <i className="bi bi-info-circle" /> Get your API key from{' '}
            <a href={info.url} target="_blank" rel="noopener noreferrer">{info.displayName}</a>.{info.tip}
        </div>);
}

function ProviderSetting({ provider, config, onUpdate }: ProviderSettingProps): JSX.Element {
    const [showApiKey, setShowApiKey] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);

    const providerConfig = config.providers[provider];
    const info = PROVIDER_INFO[provider];
    const models = PROVIDER_MODELS[provider];

    const handleApiKeyChange = (apiKey: string) => {
        onUpdate(provider, { apiKey });
        setTestResult(null);
    };

    const handleModelChange = (model: string) => {
        onUpdate(provider, { model });
    };

    const handleEnabledChange = (enabled: boolean) => {
        onUpdate(provider, { enabled });
    };

    const handleTestConnection = async () => {
        if (!providerConfig.apiKey) return;

        setTesting(true);
        setTestResult(null);

        try {
            const result = await AIProviderService.testConnection(provider);
            setTestResult(result);
        } catch (error) {
            setTestResult({ success: false, error: (error as Error).message });
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="jodie-settings-provider">
            <div className="jodie-settings-provider-header">
                <div className="jodie-settings-provider-info">
                    <div
                        className="jodie-settings-provider-icon"
                        style={{
                            backgroundColor: info.bgColor,
                            border: `2px solid ${info.color}`,
                            color: info.color,
                        }}
                    >
                        <ProviderIcon provider={provider} size={16} />
                    </div>
                    <div className="jodie-settings-provider-name">
                        <strong>{info.name}</strong>
                        <span>{info.company}</span>
                    </div>
                </div>
                <label className="jodie-settings-toggle">
                    <input
                        type="checkbox"
                        checked={providerConfig.enabled}
                        onChange={(e) => handleEnabledChange(e.target.checked)}
                    />
                    <span className="jodie-toggle-slider"></span>
                </label>
            </div>

            {providerConfig.enabled && (
                <div className="jodie-settings-provider-body">
                    <div className="jodie-settings-field">
                        <label>API Key</label>
                        <div className="jodie-settings-apikey-input">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={providerConfig.apiKey}
                                onChange={(e) => handleApiKeyChange(e.target.value)}
                                placeholder={`Enter your ${info.name} API key`}
                            />
                            <button
                                className="jodie-settings-toggle-visibility"
                                onClick={() => setShowApiKey(!showApiKey)}
                                title={showApiKey ? 'Hide' : 'Show'}
                            >
                                <i className={`bi ${showApiKey ? 'bi-eye-slash' : 'bi-eye'}`} />
                            </button>
                        </div>
                        {/* Help text for API key */}
                        {API_Key_JSX(provider)}
                    </div>

                    <div className="jodie-settings-field">
                        <label>Model</label>
                        <select
                            value={providerConfig.model}
                            onChange={(e) => handleModelChange(e.target.value)}
                        >
                            {models.map(model => (
                                <option key={model.value} value={model.value}>
                                    {model.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="jodie-settings-actions">
                        <button
                            className="jodie-settings-test-btn"
                            onClick={handleTestConnection}
                            disabled={!providerConfig.apiKey || testing}
                        >
                            {testing ? (
                                <>
                                    <i className="bi bi-arrow-clockwise jodie-spin" />
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-plug" />
                                    Test Connection
                                </>
                            )}
                        </button>

                        {testResult && (
                            <div className={`jodie-settings-test-result ${testResult.success ? 'success' : 'error'}`}>
                                <i className={`bi ${testResult.success ? 'bi-check-circle' : 'bi-x-circle'}`} />
                                {testResult.success ? 'Connection successful!' : testResult.error}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps): JSX.Element | null {
    const [config, setConfig] = useState<JodieConfig>(() => JodieConfigService.load());
    const [showResetConfirm, setShowResetConfirm] = useState(false);

    // Reload config when modal opens
    useEffect(() => {
        if (isOpen) {
            setConfig(JodieConfigService.load());
        }
    }, [isOpen]);

    const handleProviderUpdate = (provider: TAIProvider, updates: Partial<JodieConfig['providers'][TAIProvider]>) => {
        const newConfig = {
            ...config,
            providers: {
                ...config.providers,
                [provider]: {
                    ...config.providers[provider],
                    ...updates,
                },
            },
        };
        setConfig(newConfig);
        JodieConfigService.save(newConfig);
    };

    const handleReset = () => {
        setShowResetConfirm(true);
    };

    const confirmReset = () => {
        JodieConfigService.reset();
        setConfig(JodieConfigService.load());
        setShowResetConfirm(false);
    };

    if (!isOpen) return null;

    const providers: TAIProvider[] = [AIProvider.Claude, AIProvider.GPT, AIProvider.DeepSeek, AIProvider.Gemini];

    return (
        <div className="jodie-settings-overlay" onClick={onClose}>
            <div className="jodie-settings-modal" onClick={(e) => e.stopPropagation()}>
                <div className="jodie-settings-header">
                    <h2>
                        <i className="bi bi-gear" />
                        Jjodie Settings
                    </h2>
                    <button className="jodie-settings-close" onClick={onClose}>
                        <i className="bi bi-x-lg" />
                    </button>
                </div>

                <div className="jodie-settings-body">
                    <p className="jodie-settings-intro">
                        Configure your AI providers below. You'll need an API key for each provider you want to use.
                        API keys are stored locally in your browser.
                    </p>

                    <div className="jodie-settings-providers">
                        {providers.map(provider => (
                            <ProviderSetting
                                key={provider}
                                provider={provider}
                                config={config}
                                onUpdate={handleProviderUpdate}
                            />
                        ))}
                    </div>
                </div>

                <div className="jodie-settings-footer">
                    <button className="jodie-settings-reset" onClick={handleReset}>
                        <i className="bi bi-arrow-counterclockwise" />
                        Reset All
                    </button>
                    <button className="jodie-settings-done" onClick={onClose}>
                        Done
                    </button>
                </div>

                {/* Custom confirm dialog */}
                {showResetConfirm && (
                    <div className="jodie-confirm-overlay" onClick={() => setShowResetConfirm(false)}>
                        <div className="jodie-confirm-dialog" onClick={(e) => e.stopPropagation()}>
                            <div className="jodie-confirm-header">
                                <i className="bi bi-exclamation-triangle" />
                                <h3>Reset Settings?</h3>
                            </div>
                            <p>
                                Are you sure you want to reset all Jjodie settings?
                                This will remove all API keys and reset to defaults.
                            </p>
                            <div className="jodie-confirm-actions">
                                <button 
                                    className="jodie-confirm-cancel" 
                                    onClick={() => setShowResetConfirm(false)}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className="jodie-confirm-reset" 
                                    onClick={confirmReset}
                                >
                                    Reset All
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default SettingsModal;
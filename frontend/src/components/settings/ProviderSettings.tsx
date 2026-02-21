/**
 * ProviderSettings - AI Provider Configuration UI
 * Allows users to configure API keys for OpenAI, Anthropic, Google
 */

import React, { useState, useEffect } from 'react';
import { credentialsService, ProviderCredentials, ProviderType } from '../../services/CredentialsService';
import './ProviderSettings.css';

interface ProviderInfo {
    id: ProviderType;
    name: string;
    icon: string;
    color: string;
    models: string[];
    docsUrl: string;
    placeholder: string;
}

const AVAILABLE_PROVIDERS: ProviderInfo[] = [
    {
        id: 'openai',
        name: 'OpenAI',
        icon: 'chat-dots',
        color: '#10A37F',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        docsUrl: 'https://platform.openai.com/api-keys',
        placeholder: 'sk-...',
    },
    {
        id: 'anthropic',
        name: 'Anthropic Claude',
        icon: 'robot',
        color: '#D97757',
        models: ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-opus-20240229', 'claude-3-haiku-20240307'],
        docsUrl: 'https://console.anthropic.com/account/keys',
        placeholder: 'sk-ant-...',
    },
    {
        id: 'google',
        name: 'Google AI',
        icon: 'google',
        color: '#4285F4',
        models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
        docsUrl: 'https://makersuite.google.com/app/apikey',
        placeholder: 'AIza...',
    },
];

export const ProviderSettings: React.FC = () => {
    const [providers, setProviders] = useState<ProviderCredentials[]>([]);
    const [editingProvider, setEditingProvider] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        apiKey: '',
        model: '',
        baseUrl: '',
        enabled: true,
    });
    const [showApiKey, setShowApiKey] = useState(false);

    useEffect(() => {
        loadProviders();
    }, []);

    const loadProviders = () => {
        const configured = credentialsService.getProviders();
        setProviders(configured);
        console.log('[ProviderSettings] Loaded providers:', configured.length);
    };

    const handleEdit = (providerId: string) => {
        setEditingProvider(providerId);
        const existing = credentialsService.getProvider(providerId);

        if (existing) {
            setFormData({
                apiKey: existing.apiKey,
                model: existing.model || '',
                baseUrl: existing.baseUrl || '',
                enabled: existing.enabled,
            });
        } else {
            setFormData({
                apiKey: '',
                model: '',
                baseUrl: '',
                enabled: true,
            });
        }
        setShowApiKey(false);
    };

    const handleSave = (providerId: string) => {
        if (!formData.apiKey.trim()) {
            alert('Please enter an API key');
            return;
        }

        console.log(`[ProviderSettings] Saving ${providerId}...`);

        credentialsService.saveProvider({
            provider: providerId as ProviderType,
            apiKey: formData.apiKey.trim(),
            model: formData.model || undefined,
            baseUrl: formData.baseUrl || undefined,
            enabled: formData.enabled,
        });

        setEditingProvider(null);
        setFormData({ apiKey: '', model: '', baseUrl: '', enabled: true });
        loadProviders();

        console.log(`[ProviderSettings] Saved ${providerId} successfully`);
    };

    const handleCancel = () => {
        setEditingProvider(null);
        setFormData({ apiKey: '', model: '', baseUrl: '', enabled: true });
        setShowApiKey(false);
    };

    const handleRemove = (providerId: string, providerName: string) => {
        if (window.confirm(`Remove ${providerName} credentials? This cannot be undone.`)) {
            credentialsService.removeProvider(providerId);
            loadProviders();
            console.log(`[ProviderSettings] Removed ${providerId}`);
        }
    };

    const isConfigured = (providerId: string): boolean => {
        return providers.some(p => p.provider === providerId);
    };

    const getProviderData = (providerId: string): ProviderCredentials | undefined => {
        return providers.find(p => p.provider === providerId);
    };

    const maskApiKey = (apiKey: string): string => {
        if (apiKey.length <= 8) return '••••••••';
        return apiKey.substring(0, 4) + '•'.repeat(Math.min(apiKey.length - 8, 12)) + apiKey.substring(apiKey.length - 4);
    };

    const handleExport = () => {
        const data = credentialsService.exportCredentials();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'jjodie-credentials-backup.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log('[ProviderSettings] Credentials exported');
    };

    const handleClearAll = () => {
        if (window.confirm('Clear ALL credentials? This cannot be undone!')) {
            credentialsService.clearAll();
            loadProviders();
        }
    };

    return (
        <div className="provider-settings">
            {/* Header */}
            <div className="settings-header">
                <h2>
                    <i className="bi bi-gear"></i>
                    AI Provider Configuration
                </h2>
                <p>Configure AI providers for Jjodie. Your API keys are stored locally in your browser.</p>
                <div className="security-notice">
                    <i className="bi bi-shield-exclamation"></i>
                    <span>
                        <strong>Security Note:</strong> API keys are stored in browser localStorage.
                        Do not share your browser profile or backup files.
                    </span>
                </div>
            </div>

            {/* Providers List */}
            <div className="providers-list">
                {AVAILABLE_PROVIDERS.map(provider => {
                    const configured = isConfigured(provider.id);
                    const providerData = getProviderData(provider.id);
                    const isEditing = editingProvider === provider.id;

                    return (
                        <div key={provider.id} className={`provider-card ${configured ? 'configured' : ''} ${isEditing ? 'editing' : ''}`}>
                            {/* Header */}
                            <div className="provider-header">
                                <div className="provider-info">
                                    <div
                                        className="provider-icon"
                                        style={{ backgroundColor: `${provider.color}20`, color: provider.color }}
                                    >
                                        <i className={`bi bi-${provider.icon}`}></i>
                                    </div>
                                    <div className="provider-details">
                                        <h3>{provider.name}</h3>
                                        {configured && providerData && (
                                            <p className="provider-model">{providerData.model || 'Default model'}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="provider-status">
                                    {configured ? (
                                        <span className="badge success">
                                            <i className="bi bi-check-circle-fill"></i>
                                            Configured
                                        </span>
                                    ) : (
                                        <span className="badge warning">
                                            <i className="bi bi-exclamation-circle-fill"></i>
                                            Not configured
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Edit Form */}
                            {isEditing && (
                                <div className="provider-form">
                                    <div className="form-group">
                                        <label htmlFor={`${provider.id}-apikey`}>
                                            API Key
                                            <a
                                                href={provider.docsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="docs-link"
                                            >
                                                <i className="bi bi-box-arrow-up-right"></i>
                                                Get API key
                                            </a>
                                        </label>
                                        <div className="input-with-toggle">
                                            <input
                                                id={`${provider.id}-apikey`}
                                                type={showApiKey ? 'text' : 'password'}
                                                value={formData.apiKey}
                                                onChange={e => setFormData({ ...formData, apiKey: e.target.value })}
                                                placeholder={provider.placeholder}
                                                className="form-input"
                                                autoComplete="off"
                                            />
                                            <button
                                                type="button"
                                                className="toggle-visibility"
                                                onClick={() => setShowApiKey(!showApiKey)}
                                                title={showApiKey ? 'Hide API key' : 'Show API key'}
                                            >
                                                <i className={`bi bi-eye${showApiKey ? '-slash' : ''}`}></i>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label htmlFor={`${provider.id}-model`}>Model (optional)</label>
                                        <select
                                            id={`${provider.id}-model`}
                                            value={formData.model}
                                            onChange={e => setFormData({ ...formData, model: e.target.value })}
                                            className="form-select"
                                        >
                                            <option value="">Default model</option>
                                            {provider.models.map(model => (
                                                <option key={model} value={model}>{model}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-actions">
                                        <button className="btn btn-primary" onClick={() => handleSave(provider.id)}>
                                            <i className="bi bi-check-lg"></i>
                                            Save
                                        </button>
                                        <button className="btn btn-secondary" onClick={handleCancel}>
                                            <i className="bi bi-x-lg"></i>
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* View Mode */}
                            {!isEditing && configured && providerData && (
                                <div className="provider-info-view">
                                    <div className="info-row">
                                        <span className="info-label">API Key:</span>
                                        <code className="info-value">{maskApiKey(providerData.apiKey)}</code>
                                    </div>
                                    {providerData.model && (
                                        <div className="info-row">
                                            <span className="info-label">Model:</span>
                                            <span className="info-value">{providerData.model}</span>
                                        </div>
                                    )}
                                    {providerData.lastUsed && (
                                        <div className="info-row">
                                            <span className="info-label">Last saved:</span>
                                            <span className="info-value">
                                                {new Date(providerData.lastUsed).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            {!isEditing && (
                                <div className="provider-actions">
                                    <button className="btn btn-outline" onClick={() => handleEdit(provider.id)}>
                                        <i className="bi bi-pencil"></i>
                                        {configured ? 'Edit' : 'Configure'}
                                    </button>

                                    {configured && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleRemove(provider.id, provider.name)}
                                        >
                                            <i className="bi bi-trash"></i>
                                            Remove
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="settings-footer">
                <button className="btn btn-outline-small" onClick={handleExport}>
                    <i className="bi bi-download"></i>
                    Export Backup
                </button>

                <button className="btn btn-danger-small" onClick={handleClearAll}>
                    <i className="bi bi-trash"></i>
                    Clear All
                </button>
            </div>
        </div>
    );
};

export default ProviderSettings;

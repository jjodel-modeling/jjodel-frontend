/**
 * ProviderSettings - AI Provider Configuration UI
 * Allows users to configure API keys for OpenAI, Anthropic, Google
 */

import React, { useState, useEffect } from 'react';
import './ProviderSettings.css';
import {AI, AIConfig, ALL_AI_PROVIDERS, JodieConfig, TAIProvider} from "../../types/jodie";
import {GObject, U} from "../../joiner";
import JodieConfigService from "../../services/JodieConfig";


export const ProviderSettings: React.FC = () => {
    const configs = Object.values(JodieConfig.current.providers); //.filter(e=>e.enabled);
    const [providers, setProviders] = useState<AIConfig[]>(configs);
    const [editingProvider, setEditingProvider] = useState<TAIProvider | null>(null);
    const [formData, setFormData] = useState({
        apiKey: '',
        model: '',
        baseUrl: '',
        enabled: true,
    });
    const [showApiKey, setShowApiKey] = useState(false);

    const handleEdit = (providerId: TAIProvider) => {
        const existing = AIConfig.get(providerId) || {} as GObject;
        setFormData({
            apiKey: existing.apiKey || '',
            model: existing.model || '',
            baseUrl: existing.baseUrl || '',
            enabled: existing.enabled !== false,
        });
        setEditingProvider(providerId);
        setShowApiKey(false);
    };

    const handleCancel = () => {
        setEditingProvider(null);
        setFormData({ apiKey: '', model: '', baseUrl: '', enabled: true });
        setShowApiKey(false);
    };


    const maskApiKey = (apiKey: string): string => {
        if (apiKey.length <= 8) return '••••••••';
        return apiKey.substring(0, 4) + '•'.repeat(Math.min(apiKey.length - 8, 12)) + apiKey.substring(apiKey.length - 4);
    };

    const handleExport = () => {
        U.download(JodieConfig.current.export(),
            'jjodie-credentials-backup.json',
            'application/json');
    };

    const handleClearAll = () => {
        JodieConfigService.clearAllProviders();
        setProviders(configs);
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
                {ALL_AI_PROVIDERS.map(name => {
                    const config = AIConfig.get(name);
                    const provider = AI[name];
                    const configured = true;
                    const providerData = config;
                    const isEditing = editingProvider === name;

                    return (
                        <div key={provider.name} className={`provider-card ${configured ? 'configured' : ''} ${isEditing ? 'editing' : ''}`}>
                            {/* Header */}
                            <div className="provider-header">
                                <div className="provider-info">
                                    <div
                                        className="provider-icon"
                                        style={{ backgroundColor: provider.bgColor, color: provider.color }}
                                    >
                                        {provider.bi_icon ? <i className={`bi bi-${provider.bi_icon}`} /> : provider.initial}
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
                                        <label htmlFor={`${provider.name}-apikey`}>
                                            API Key
                                            <a
                                                href={provider.keyUrl}
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
                                                id={`${provider.name}-apikey`}
                                                type={showApiKey ? 'text' : 'password'}
                                                value={formData.apiKey}
                                                onChange={e => {
                                                    setFormData({...formData, apiKey: e.target.value});
                                                    config.apiKey = e.target.value;
                                                }}
                                                placeholder={provider.keyPlaceholder}
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
                                        <label htmlFor={`${provider.name}-model`}>Model (optional)</label>
                                        <select
                                            id={`${provider.name}-model`}
                                            value={formData.model}
                                            onChange={e => {
                                                setFormData({ ...formData, model: e.target.value });
                                                config.model = e.target.value;
                                            }}
                                            className="form-select"
                                        >
                                            <option value="">Default model</option>
                                            {Object.keys(provider.versions).map(name => (
                                                <option key={name} value={name}>{provider.versions[name].label}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="form-actions">
                                        <button className="btn btn-secondary" onClick={handleCancel}>
                                            <i className="bi bi-x-lg"></i>
                                            Close
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
                                            <span className="info-label">Last used:</span>
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
                                    <button className="btn btn-outline" onClick={() => handleEdit(provider.name)}>
                                        <i className="bi bi-pencil"></i>
                                        {configured ? 'Edit' : 'Configure'}
                                    </button>

                                    {/*configured && (
                                        <button
                                            className="btn btn-danger"
                                            onClick={() => handleRemove(provider.id, provider.name)}
                                        >
                                            <i className="bi bi-trash"></i>
                                            Remove
                                        </button>
                                    )*/}
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

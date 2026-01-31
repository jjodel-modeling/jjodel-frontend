import React, { useState, useEffect } from 'react';

export interface AISettings {
    provider: 'openai' | 'anthropic' | 'google' | 'deepseek' | 'mistral' | 'groq' | 'ollama' | 'custom';
    model: string;
    apiKey: string;
    enabled: boolean;
    autoSuggestOnErrors: boolean;
    baseUrl?: string;
}

const PROVIDERS = [
    {
        id: 'openai' as const,
        name: 'OpenAI (ChatGPT)',
        models: [
            { id: 'gpt-4o', label: 'GPT-4o' },
            { id: 'gpt-4o-mini', label: 'GPT-4o Mini' },
            { id: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        ],
        keyUrl: 'https://platform.openai.com/api-keys',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'anthropic' as const,
        name: 'Anthropic (Claude)',
        models: [
            { id: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
            { id: 'claude-3-5-haiku-20241022', label: 'Claude 3.5 Haiku' },
        ],
        keyUrl: 'https://console.anthropic.com/settings/keys',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'google' as const,
        name: 'Google (Gemini)',
        models: [
            { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
            { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
            { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
            { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        ],
        keyUrl: 'https://aistudio.google.com/apikey',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'deepseek' as const,
        name: 'DeepSeek',
        models: [
            { id: 'deepseek-chat', label: 'DeepSeek Chat (V3)' },
            { id: 'deepseek-reasoner', label: 'DeepSeek Reasoner (R1)' },
        ],
        keyUrl: 'https://platform.deepseek.com/api_keys',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'mistral' as const,
        name: 'Mistral AI',
        models: [
            { id: 'mistral-large-latest', label: 'Mistral Large' },
            { id: 'mistral-small-latest', label: 'Mistral Small' },
            { id: 'codestral-latest', label: 'Codestral' },
            { id: 'ministral-8b-latest', label: 'Ministral 8B' },
        ],
        keyUrl: 'https://console.mistral.ai/api-keys',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'groq' as const,
        name: 'Groq',
        models: [
            { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B' },
            { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
            { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B' },
            { id: 'gemma2-9b-it', label: 'Gemma 2 9B' },
        ],
        keyUrl: 'https://console.groq.com/keys',
        needsApiKey: true,
        needsBaseUrl: false,
    },
    {
        id: 'ollama' as const,
        name: 'Ollama (Local)',
        models: [
            { id: 'llama3.2', label: 'Llama 3.2' },
            { id: 'llama3.1', label: 'Llama 3.1' },
            { id: 'mistral', label: 'Mistral' },
            { id: 'codellama', label: 'Code Llama' },
            { id: 'phi3', label: 'Phi-3' },
        ],
        keyUrl: 'https://ollama.ai',
        needsApiKey: false,
        needsBaseUrl: true,
    },
    {
        id: 'custom' as const,
        name: 'Custom Endpoint',
        models: [
            { id: 'custom', label: 'Custom Model' },
        ],
        keyUrl: null,
        needsApiKey: true,
        needsBaseUrl: true,
    },
];

const DEFAULT_SETTINGS: AISettings = {
    provider: 'openai',
    model: 'gpt-4o',
    apiKey: '',
    enabled: true,
    autoSuggestOnErrors: false,
};

export function AIAssistantSettings() {
    const [settings, setSettings] = useState<AISettings>(DEFAULT_SETTINGS);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
    const [testMessage, setTestMessage] = useState('');

    // Load saved settings
    useEffect(() => {
        const saved = localStorage.getItem('jjodie-settings');
        if (saved) {
            try {
                setSettings(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load AI settings', e);
            }
        }
    }, []);

    // Save settings when changed
    const updateSettings = (updates: Partial<AISettings>) => {
        const newSettings = { ...settings, ...updates };
        setSettings(newSettings);
        localStorage.setItem('jjodie-settings', JSON.stringify(newSettings));

        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent('ai-settings-changed', { detail: newSettings }));
    };

    const currentProvider = PROVIDERS.find(p => p.id === settings.provider);

    // Test connection
    const testConnection = async () => {
        setTestStatus('testing');
        setTestMessage('Testing connection...');

        try {
            const response = await testAIConnection(settings);

            if (response.success) {
                setTestStatus('success');
                setTestMessage('Connected successfully!');
            } else {
                setTestStatus('error');
                setTestMessage(response.error || 'Connection failed');
            }
        } catch (error: any) {
            setTestStatus('error');
            setTestMessage(error.message || 'Connection failed');
        }

        // Reset status after 5 seconds
        setTimeout(() => {
            setTestStatus('idle');
            setTestMessage('');
        }, 5000);
    };

    return (
        <div className="settings-section-content">
            {/* Provider & Model - 2 columns */}
            <div className="form-row">
                <div className="settings-group">
                    <label className="settings-label">Provider</label>
                    <select
                        className="settings-select"
                        value={settings.provider}
                        onChange={(e) => {
                            const provider = e.target.value as AISettings['provider'];
                            const providerConfig = PROVIDERS.find(p => p.id === provider);
                            const defaultModel = providerConfig?.models[0]?.id || '';
                            updateSettings({ provider, model: defaultModel });
                        }}
                    >
                        {PROVIDERS.map(provider => (
                            <option key={provider.id} value={provider.id}>
                                {provider.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="settings-group">
                    <label className="settings-label">Model</label>
                    <select
                        className="settings-select"
                        value={settings.model}
                        onChange={(e) => updateSettings({ model: e.target.value })}
                    >
                        {currentProvider?.models.map(model => (
                            <option key={model.id} value={model.id}>{model.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* API Key (when provider needs it) */}
            {currentProvider?.needsApiKey && (
                <div className="settings-group">
                    <label className="settings-label">API Key</label>
                    <div className="api-key-input">
                        <input
                            type={showApiKey ? 'text' : 'password'}
                            className="settings-input"
                            value={settings.apiKey}
                            onChange={(e) => updateSettings({ apiKey: e.target.value })}
                            placeholder="Enter your API key..."
                        />
                        <button
                            className="toggle-visibility"
                            onClick={() => setShowApiKey(!showApiKey)}
                            title={showApiKey ? 'Hide API key' : 'Show API key'}
                        >
                            <i className={`bi ${showApiKey ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                    </div>
                    {currentProvider?.keyUrl && (
                        <a
                            href={currentProvider.keyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="settings-help-link"
                        >
                            <i className="bi bi-box-arrow-up-right" />
                            Get your API key from {currentProvider.name.split(' ')[0]}
                        </a>
                    )}
                </div>
            )}

            {/* Base URL for providers that need it */}
            {currentProvider?.needsBaseUrl && (
                <div className="settings-group">
                    <label className="settings-label">
                        {settings.provider === 'ollama' ? 'Ollama Server URL' : 'API Endpoint'}
                    </label>
                    <input
                        type="text"
                        className="settings-input"
                        value={settings.baseUrl || ''}
                        onChange={(e) => updateSettings({ baseUrl: e.target.value })}
                        placeholder={settings.provider === 'ollama' ? 'http://localhost:11434' : 'https://api.example.com/v1'}
                    />
                </div>
            )}

            {/* Divider */}
            <div className="settings-divider" />

            {/* Options */}
            <div className="settings-group">
                <label className="settings-label">Options</label>

                <label className="settings-checkbox">
                    <input
                        type="checkbox"
                        checked={settings.enabled}
                        onChange={(e) => updateSettings({ enabled: e.target.checked })}
                    />
                    <div className="checkbox-content">
                        <span className="checkbox-label">Enable Jjodie assistant</span>
                        <span className="checkbox-description">Show AI assistant in the interface</span>
                    </div>
                </label>

                <label className="settings-checkbox">
                    <input
                        type="checkbox"
                        checked={settings.autoSuggestOnErrors}
                        onChange={(e) => updateSettings({ autoSuggestOnErrors: e.target.checked })}
                    />
                    <div className="checkbox-content">
                        <span className="checkbox-label">Auto-suggest fixes on errors</span>
                        <span className="checkbox-description">Automatically ask Jjodie for help when errors occur</span>
                    </div>
                </label>
            </div>

            {/* Divider */}
            <div className="settings-divider" />

            {/* Test Connection */}
            <div className="settings-group">
                <div className="test-connection">
                    <button
                        className={`test-btn ${testStatus}`}
                        onClick={testConnection}
                        disabled={testStatus === 'testing' || (currentProvider?.needsApiKey && !settings.apiKey)}
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

                    {testStatus !== 'idle' && testStatus !== 'testing' && (
                        <span className={`test-result ${testStatus}`}>
                            <i className={`bi ${testStatus === 'success' ? 'bi-check-circle' : 'bi-x-circle'}`} />
                            {testMessage}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper function to test the connection
async function testAIConnection(settings: AISettings): Promise<{ success: boolean; error?: string }> {
    try {
        switch (settings.provider) {
            case 'openai':
                const openaiResponse = await fetch('https://api.openai.com/v1/models', {
                    headers: { 'Authorization': `Bearer ${settings.apiKey}` }
                });
                if (!openaiResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'anthropic':
                // Anthropic doesn't have a public models endpoint, we test with minimal message
                const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
                    method: 'POST',
                    headers: {
                        'x-api-key': settings.apiKey,
                        'Content-Type': 'application/json',
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify({
                        model: settings.model,
                        max_tokens: 10,
                        messages: [{ role: 'user', content: 'Hi' }]
                    })
                });
                if (!anthropicResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'google':
                const googleResponse = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${settings.apiKey}`
                );
                if (!googleResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'deepseek':
                const deepseekResponse = await fetch('https://api.deepseek.com/models', {
                    headers: { 'Authorization': `Bearer ${settings.apiKey}` }
                });
                if (!deepseekResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'mistral':
                const mistralResponse = await fetch('https://api.mistral.ai/v1/models', {
                    headers: { 'Authorization': `Bearer ${settings.apiKey}` }
                });
                if (!mistralResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'groq':
                const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
                    headers: { 'Authorization': `Bearer ${settings.apiKey}` }
                });
                if (!groqResponse.ok) throw new Error('Invalid API key');
                return { success: true };

            case 'ollama':
                const ollamaUrl = settings.baseUrl || 'http://localhost:11434';
                const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`);
                if (!ollamaResponse.ok) throw new Error('Cannot connect to Ollama server');
                return { success: true };

            case 'custom':
                if (!settings.baseUrl) throw new Error('Base URL is required');
                const customResponse = await fetch(`${settings.baseUrl}/models`, {
                    headers: settings.apiKey ? { 'Authorization': `Bearer ${settings.apiKey}` } : {}
                });
                if (!customResponse.ok) throw new Error('Cannot connect to custom endpoint');
                return { success: true };

            default:
                return { success: false, error: 'Unknown provider' };
        }
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export default AIAssistantSettings;

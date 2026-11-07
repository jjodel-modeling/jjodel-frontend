/**
 * AI Assistant Settings
 * Slate minimal design with proper test connection status
 */
import React, { useState, useEffect, useCallback } from 'react';
import type {Dictionary} from "../../joiner";
import { PROVIDER_VISUALS } from '../../components/common/providerVisuals';
import { PROVIDER_IDS, ProviderConfigStore, registry } from '../../services/ai';
import type { ProviderId, StoredProviderConfig } from '../../services/ai';
import { ProviderConfigModal } from './ProviderConfigModal';
import { AIEvents } from '../../events/registry';

/**
 * The status of a provider card (was AIConfig.getStatus, types/jodie.ts). A tested provider reads
 * by its last outcome; an untested one is «Ready» when configured and «Not configured» otherwise.
 * The old method had the last two the other way round (R-AI-11, measured by
 * services/ai/__tests__/providerStatus.test.ts): fixed here.
 */
export function providerStatus(stored: StoredProviderConfig | null, configured: boolean): { text: string; class: string } {
    // NB: when config is changed, lastTested is erased too in ProviderConfigModal
    if (stored?.lastTested) {
        if (stored.enabled) return { text: 'Connected', class: 'connected' };
        else return { text: 'Error', class: 'error' };
    }

    if (!configured) return { text: 'Not configured', class: 'not-configured' };

    // Has API key but not tested = Ready to test
    return { text: 'Ready', class: 'ready' };
}

export function AIAssistantSettings() {
    const [refresh, setRefresh] = useState(0);
    // Modal state
    const [selectedProvider, setSelectedProvider] = useState<ProviderId | null>(null);

    // State for all providers
    /*const [providers, setProviders] = useState<ProvidersState>(() => {
        const initial: Partial<ProvidersState> = {};
        for (const provider of ALL_AI_PROVIDERS) {
            const config = JodieConfigService.getProviderConfig(provider);
            initial[provider] = {
                apiKey: config?.apiKey || '',
                model: config?.model || Object.keys(AI[provider].versions)[0] || '';
                enabled: config?.enabled || false,
                lastTested: config?.lastTested,
                baseUrl: config?.baseUrl,
            };
        }
        return initial as ProvidersState;
    });*/

    // Load saved settings on mount
    useEffect(() => {
        // Listen for external changes
        const handleChange = () => setRefresh(refresh +1);
        window.addEventListener(AIEvents.PROVIDER_CHANGED, handleChange);
        return () => window.removeEventListener(AIEvents.PROVIDER_CHANGED, handleChange);
    }, []);

    // Get model label for display
    const getModelLabel = (provider: ProviderId) => {
        const llmProvider = registry.get(provider);
        const model = llmProvider.resolveModel();
        return llmProvider.model(model)?.displayName || model;
    };

    return (
        <div className="settings-section-content ai-providers-section">
            <p className="settings-description">
                Configure your AI providers below. Click on a provider to set up your API key and model.
                Only enabled providers will appear in the Jjodie chat selector.
            </p>

            <div className="providers-list">
                {PROVIDER_IDS.map(provider => {
                    const llm = PROVIDER_VISUALS[provider];
                    const status = providerStatus(ProviderConfigStore.load(provider), registry.get(provider).enabled());
                    const modelLabel = getModelLabel(provider);

                    return (
                        <div
                            key={provider}
                            className={`provider-card-slate ${status.class}`}
                            onClick={() => setSelectedProvider(provider)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === 'Enter' && setSelectedProvider(provider)}
                        >
                            {/* Slate minimal icon with initial letter */}
                            <div className="provider-initial">
                                {llm.initial}
                            </div>

                            {/* Provider info */}
                            <div className="provider-info">
                                <span className="provider-name">{provider}</span>
                                <span className="provider-model">{modelLabel}</span>
                            </div>

                            {/* Status */}
                            <div className={`provider-status ${status.class}`}>
                                <span className="status-dot" />
                                <span className="status-text">{status.text}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Configuration Modal */}
            {selectedProvider && (
                <ProviderConfigModal
                    provider={selectedProvider}
                    isOpen={true}
                    onClose={() => setSelectedProvider(null)}
                    //onSave={handleSaveProvider}
                />
            )}
        </div>
    );
}

export default AIAssistantSettings;

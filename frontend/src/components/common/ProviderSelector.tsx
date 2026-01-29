import React, { useState, useMemo, useEffect } from 'react';
import { AIFeature } from '../../services/AIProviderPreferences';
import { useAIProviderPreference } from '../../hooks/useAIProviderPreference';
import { JodieConfigService } from '../../services/JodieConfig';
import { useAISettingsSafe } from '../../contexts/AISettingsContext';
import './ProviderSelector.scss';

interface ProviderSelectorProps {
    feature: AIFeature;
    showLocalOption?: boolean;  // default true per documentation, false per chat
    className?: string;
    onNavigateToSettings?: () => void;
}

interface ProviderOption {
    id: string;
    name: string;
    icon: string;
    available: boolean;
}

export function ProviderSelector({
    feature,
    showLocalOption = feature === 'documentation',
    className = '',
    onNavigateToSettings
}: ProviderSelectorProps) {
    const { selectedProvider, setSelectedProvider } = useAIProviderPreference(feature);
    const [showMenu, setShowMenu] = useState(false);

    // Use context for opening settings modal (if available)
    const aiSettingsContext = useAISettingsSafe();

    // Lista provider disponibili
    const providers = useMemo<ProviderOption[]>(() => {
        const list: ProviderOption[] = [];

        // Local (solo per documentation)
        if (showLocalOption) {
            list.push({
                id: 'local',
                name: 'Local (Instant)',
                icon: 'bi-lightning',
                available: true
            });
        }

        // OpenAI
        const openai = JodieConfigService.getProvider('openai');
        if (openai?.apiKey) {
            list.push({ id: 'openai', name: 'OpenAI', icon: 'bi-stars', available: true });
        }

        // Anthropic
        const anthropic = JodieConfigService.getProvider('anthropic');
        if (anthropic?.apiKey) {
            list.push({ id: 'anthropic', name: 'Anthropic', icon: 'bi-stars', available: true });
        }

        // Mistral
        const mistral = JodieConfigService.getProvider('mistral');
        if (mistral?.apiKey) {
            list.push({ id: 'mistral', name: 'Mistral', icon: 'bi-stars', available: true });
        }

        // Gemini
        const gemini = JodieConfigService.getProvider('gemini');
        if (gemini?.apiKey) {
            list.push({ id: 'gemini', name: 'Gemini', icon: 'bi-stars', available: true });
        }

        // Ollama
        const ollama = JodieConfigService.getProvider('ollama');
        if (ollama?.baseUrl) {
            list.push({ id: 'ollama', name: 'Ollama', icon: 'bi-hdd-network', available: true });
        }

        return list;
    }, [showLocalOption]);

    // Nome del provider selezionato
    const selectedName = useMemo(() => {
        const found = providers.find(p => p.id === selectedProvider);
        return found?.name || selectedProvider;
    }, [selectedProvider, providers]);

    // Chiudi menu quando si clicca fuori
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showMenu]);

    return (
        <div className={`provider-selector ${className}`}>
            <button
                className="provider-btn"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                title="Select AI provider"
            >
                <i className="bi bi-cpu" />
                <span>{selectedName}</span>
                <i className={`bi bi-chevron-${showMenu ? 'up' : 'down'} chevron`} />
            </button>

            {showMenu && (
                <div className="provider-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="provider-menu-header">AI PROVIDER</div>

                    {providers.map(provider => (
                        <button
                            key={provider.id}
                            className={`provider-option ${selectedProvider === provider.id ? 'active' : ''}`}
                            onClick={() => {
                                setSelectedProvider(provider.id);
                                setShowMenu(false);
                            }}
                            disabled={!provider.available}
                        >
                            <i className={`bi ${provider.icon}`} />
                            <span>{provider.name}</span>
                            {selectedProvider === provider.id && (
                                <i className="bi bi-check-lg check-icon" />
                            )}
                        </button>
                    ))}

                    {providers.length === 0 && (
                        <div className="provider-empty">
                            No providers configured
                        </div>
                    )}

                    <div className="provider-menu-footer">
                        <button
                            className="configure-link"
                            onClick={() => {
                                setShowMenu(false);
                                if (onNavigateToSettings) {
                                    onNavigateToSettings();
                                } else if (aiSettingsContext?.openAISettings) {
                                    aiSettingsContext.openAISettings();
                                }
                            }}
                        >
                            <i className="bi bi-gear" /> Configure in Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProviderSelector;

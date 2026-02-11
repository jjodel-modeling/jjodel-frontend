import React, { useState, useMemo, useEffect } from 'react';
import { AIFeature } from '../../services/AIProviderPreferences';
import { useAIProviderPreference } from '../../hooks/useAIProviderPreference';
import { JodieConfigService } from '../../services/JodieConfig';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import './ProviderSelector.scss';

/**
 * Local (non-AI) option configuration
 */
export interface LocalOption {
    id: string;
    label: string;
    icon: string;  // Bootstrap icon name without 'bi-' prefix
}

interface ProviderSelectorProps {
    feature: AIFeature;
    /**
     * @deprecated Use localOptions instead
     */
    showLocalOption?: boolean;
    /**
     * Custom local (non-AI) options to show at the top of the dropdown.
     * If not provided and showLocalOption is true, defaults to 'Local (Instant)'.
     */
    localOptions?: LocalOption[];
    /**
     * Currently selected local option ID (if any).
     * When set, this takes precedence over the AI provider selection.
     */
    selectedLocalOption?: string | null;
    /**
     * Callback when a local option is selected
     */
    onLocalOptionSelect?: (optionId: string | null) => void;
    className?: string;
    onNavigateToSettings?: () => void;
    /**
     * Compact mode - smaller trigger button
     */
    compact?: boolean;
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
    localOptions,
    selectedLocalOption,
    onLocalOptionSelect,
    className = '',
    onNavigateToSettings,
    compact = false,
}: ProviderSelectorProps) {
    const { selectedProvider, setSelectedProvider } = useAIProviderPreference(feature);
    const [showMenu, setShowMenu] = useState(false);

    // Use unified settings modal context (opens Settings page → Providers section)
    const settingsModal = useSettingsModalSafe();

    // Resolve local options - use provided localOptions or fallback to legacy behavior
    const resolvedLocalOptions = useMemo<LocalOption[]>(() => {
        if (localOptions) {
            return localOptions;
        }
        // Legacy behavior: if showLocalOption is true, show default local option
        if (showLocalOption) {
            return [{ id: 'local', label: 'Local (Instant)', icon: 'lightning' }];
        }
        return [];
    }, [localOptions, showLocalOption]);

    // Lista provider disponibili (AI providers only)
    // Icons chosen to be distinctive and evocative of each provider
    const providers = useMemo<ProviderOption[]>(() => {
        const list: ProviderOption[] = [];

        // OpenAI - circle pattern (evokes their logo)
        const openai = JodieConfigService.getProvider('openai');
        if (openai?.apiKey) {
            list.push({ id: 'openai', name: 'OpenAI', icon: 'bi-circle', available: true });
        }

        // Anthropic (Claude) - chat bubble (conversational focus)
        const anthropic = JodieConfigService.getProvider('claude');
        if (anthropic?.apiKey) {
            list.push({ id: 'claude', name: 'Anthropic', icon: 'bi-chat-square-text', available: true });
        }

        // DeepSeek - search/compass (for "Seek")
        const deepseek = JodieConfigService.getProvider('deepseek');
        if (deepseek?.apiKey) {
            list.push({ id: 'deepseek', name: 'DeepSeek', icon: 'bi-search', available: true });
        }

        // Mistral - wind (Mistral is a famous French wind)
        const mistral = JodieConfigService.getProvider('mistral');
        if (mistral?.apiKey) {
            list.push({ id: 'mistral', name: 'Mistral', icon: 'bi-wind', available: true });
        }

        // Gemini - gem (for "Gemini")
        const gemini = JodieConfigService.getProvider('gemini');
        if (gemini?.apiKey) {
            list.push({ id: 'gemini', name: 'Gemini', icon: 'bi-gem', available: true });
        }

        // Groq - speedometer (known for speed/performance)
        const groq = JodieConfigService.getProvider('groq');
        if (groq?.apiKey) {
            list.push({ id: 'groq', name: 'Groq', icon: 'bi-speedometer2', available: true });
        }

        // Kimi - moon (Moonshot AI)
        const kimi = JodieConfigService.getProvider('kimi');
        if (kimi?.apiKey) {
            list.push({ id: 'kimi', name: 'Kimi', icon: 'bi-moon', available: true });
        }

        // Ollama - server/network (local deployment)
        const ollama = JodieConfigService.getProvider('ollama');
        if (ollama?.baseUrl) {
            list.push({ id: 'ollama', name: 'Ollama', icon: 'bi-hdd-network', available: true });
        }

        return list;
    }, []);

    // Determine what's currently selected (local option or AI provider)
    const isLocalSelected = selectedLocalOption != null && resolvedLocalOptions.some(o => o.id === selectedLocalOption);

    // Nome del provider/option selezionato
    const selectedName = useMemo(() => {
        // If a local option is selected, show its label
        if (isLocalSelected) {
            const localOpt = resolvedLocalOptions.find(o => o.id === selectedLocalOption);
            return localOpt?.label || selectedLocalOption;
        }
        // Otherwise show the AI provider name
        const found = providers.find(p => p.id === selectedProvider);
        // Also check local options for backward compatibility (when 'local' was stored as provider)
        if (!found) {
            const localFound = resolvedLocalOptions.find(o => o.id === selectedProvider);
            if (localFound) return localFound.label;
        }
        return found?.name || selectedProvider;
    }, [selectedProvider, providers, isLocalSelected, selectedLocalOption, resolvedLocalOptions]);

    // Icon for the trigger button
    const selectedIcon = useMemo(() => {
        if (isLocalSelected) {
            const localOpt = resolvedLocalOptions.find(o => o.id === selectedLocalOption);
            return localOpt?.icon || 'lightning';
        }
        // Check if selected provider is actually a local option (backward compat)
        const localFound = resolvedLocalOptions.find(o => o.id === selectedProvider);
        if (localFound) return localFound.icon;
        return 'cpu';
    }, [selectedProvider, isLocalSelected, selectedLocalOption, resolvedLocalOptions]);

    // Chiudi menu quando si clicca fuori
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showMenu]);

    // Handle selecting a local option
    const handleLocalSelect = (optionId: string) => {
        if (onLocalOptionSelect) {
            onLocalOptionSelect(optionId);
        } else {
            // Backward compatibility: store as provider preference
            setSelectedProvider(optionId);
        }
        setShowMenu(false);
    };

    // Handle selecting an AI provider
    const handleProviderSelect = (providerId: string) => {
        // Clear local option selection if callback provided
        if (onLocalOptionSelect) {
            onLocalOptionSelect(null);
        }
        setSelectedProvider(providerId);
        setShowMenu(false);
    };

    return (
        <div className={`provider-selector ${compact ? 'compact' : ''} ${className}`}>
            <button
                className="provider-btn"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                title="Select AI provider"
            >
                <i className={`bi bi-${selectedIcon}`} />
                <span>{selectedName}</span>
                <i className={`bi bi-chevron-${showMenu ? 'up' : 'down'} chevron`} />
            </button>

            {showMenu && (
                <div className="provider-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="provider-menu-header">AI PROVIDER</div>

                    {/* Local options (non-AI) */}
                    {resolvedLocalOptions.map(option => {
                        const isActive = isLocalSelected
                            ? selectedLocalOption === option.id
                            : selectedProvider === option.id;
                        return (
                            <button
                                key={option.id}
                                className={`provider-option ${isActive ? 'active' : ''}`}
                                onClick={() => handleLocalSelect(option.id)}
                            >
                                <i className={`bi bi-${option.icon}`} />
                                <span>{option.label}</span>
                                {isActive && <i className="bi bi-check-lg check-icon" />}
                            </button>
                        );
                    })}

                    {/* Divider between local and AI options */}
                    {resolvedLocalOptions.length > 0 && providers.length > 0 && (
                        <div className="provider-divider" />
                    )}

                    {/* AI providers */}
                    {providers.map(provider => {
                        const isActive = !isLocalSelected && selectedProvider === provider.id;
                        return (
                            <button
                                key={provider.id}
                                className={`provider-option ${isActive ? 'active' : ''}`}
                                onClick={() => handleProviderSelect(provider.id)}
                                disabled={!provider.available}
                            >
                                <i className={`bi ${provider.icon}`} />
                                <span>{provider.name}</span>
                                {isActive && <i className="bi bi-check-lg check-icon" />}
                            </button>
                        );
                    })}

                    {resolvedLocalOptions.length === 0 && providers.length === 0 && (
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
                                } else if (settingsModal?.openSettings) {
                                    // Open unified settings modal at Providers section
                                    settingsModal.openSettings('providers');
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

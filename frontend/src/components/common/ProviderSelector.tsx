import React, { useState, useMemo, useEffect } from 'react';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import './ProviderSelector.scss';
import {AI, AIConfig, AIProvider, ALL_AI_PROVIDERS, JodieConfig, TAIProvider, AIFeature} from "../../types/jodie";

/**
 * Local (non-AI) option configuration
 */
export interface LocalOption {
    id: TAIProvider | "local" | "simple";
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
    const selectedProvider = AIConfig.getPreferred(feature);
    let llm = AI[selectedProvider];
    const [showMenu, setShowMenu] = useState(false);

    // Use unified settings modal context (opens Settings page → Providers section)
    const settingsModal = useSettingsModalSafe();

    // Lista provider disponibili (AI providers only)
    // Icons chosen to be distinctive and evocative of each provider
    const providers = JodieConfig.getEnabledProviders();

    // Chiudi menu quando si clicca fuori
    useEffect(() => {
        const handleClickOutside = () => setShowMenu(false);
        if (showMenu) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [showMenu]);

    // Handle selecting a local option
    const handleLocalSelect = (optionId: TAIProvider) => {
        if (onLocalOptionSelect) onLocalOptionSelect(optionId);
        // Backward compatibility: store as per-feature provider preference
        else AIConfig.setPreferred(feature, optionId);
        setShowMenu(false);
    };

    // Handle selecting an AI provider
    const handleProviderSelect = (providerId: TAIProvider) => {
        // Clear local option selection if callback provided
        if (onLocalOptionSelect) onLocalOptionSelect(null);
        AIConfig.setPreferred(feature, providerId);
        setShowMenu(false);
    };

    return (
        <div className={`provider-selector ${compact ? 'compact' : ''} ${className}`}>
            <button
                className="provider-btn"
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                title="Select AI provider"
            >
                <i className={`bi bi-${llm.bi_icon}`} />
                <span>{selectedProvider}</span>
                <i className={`bi bi-chevron-${showMenu ? 'up' : 'down'} chevron`} />
            </button>

            {showMenu && (
                <div className="provider-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="provider-menu-header">AI PROVIDER</div>

                    {/* AI providers */}
                    {providers.map(provider => {
                        const isActive = selectedProvider === provider;
                        return (
                            <button
                                key={provider}
                                className={`provider-option ${isActive ? 'active' : ''}`}
                                onClick={() => handleProviderSelect(provider)}
                                disabled={!AIConfig.get(provider).isConfigured()}
                            >
                                <i className={`bi ${AI[provider].bi_icon}`} />
                                <span>{provider}</span>
                                {isActive && <i className="bi bi-check-lg check-icon" />}
                            </button>
                        );
                    })}

                    {providers.length === 0 && <div className="provider-empty">No providers configured</div>}

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

import React, { useState, useEffect, useMemo } from 'react';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import './ProviderSelector.scss';
import './ProviderModelSelector.scss';
import {
    AI,
    AIConfig,
    AIFeature,
    AIVersion,
    JodieConfig,
    TAIProvider,
} from '../../types/jodie';

// NOTE(future — Pattern C): dynamic model discovery would merge provider-endpoint
// responses with this static registry. The trigger/popover layout below stays valid:
// only the model list feeding the popover becomes dynamic. Keep the ModelEntry shape
// narrow (id/label/capabilities/legacy) so dynamic entries slot in without UI churn.

interface ProviderModelSelectorProps {
    feature: AIFeature;
    className?: string;
    compact?: boolean;
    onNavigateToSettings?: () => void;
}

interface ModelEntry {
    id: string;
    version: AIVersion;
}

export function ProviderModelSelector({
    feature,
    className = '',
    compact = false,
    onNavigateToSettings,
}: ProviderModelSelectorProps) {
    const settingsModal = useSettingsModalSafe();

    const [isOpen, setIsOpen] = useState(false);
    const [showLegacy, setShowLegacy] = useState(false); // per-session only
    const [tick, setTick] = useState(0); // force re-read of localStorage when user picks

    // Read current selection from per-feature preference. `getPreferred` returns the provider
    // (with first-enabled fallback); `getPreferredModel` returns the explicit modelId or undefined.
    const selectedProvider = useMemo(() => AIConfig.getPreferred(feature), [feature, tick]);
    const selectedModelId = useMemo(() => AIConfig.getPreferredModel(feature), [feature, tick]);

    // Only providers with valid API keys appear in the sub-select
    const enabledProviders = useMemo(() => JodieConfig.getEnabledProviders(), [tick]);

    // Provider used for the popover's model list. Starts from selectedProvider but may diverge
    // when the user switches providers inside the popover (before picking a model).
    const [popoverProvider, setPopoverProvider] = useState<TAIProvider>(selectedProvider);
    useEffect(() => { setPopoverProvider(selectedProvider); }, [selectedProvider]);

    useEffect(() => {
        const close = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener('click', close);
            return () => document.removeEventListener('click', close);
        }
    }, [isOpen]);

    const popoverModels: ModelEntry[] = useMemo(() => {
        const llm = AI[popoverProvider];
        if (!llm) return [];
        return Object.keys(llm.versions).map(id => ({ id, version: llm.versions[id] }));
    }, [popoverProvider]);

    const nonLegacy = popoverModels.filter(m => !m.version.deprecated);
    const legacy = popoverModels.filter(m => m.version.deprecated);

    const selectedVersion: AIVersion | undefined =
        selectedProvider && selectedModelId
            ? AI[selectedProvider]?.versions[selectedModelId]
            : undefined;

    // Compose the trigger label. Option B (defensive dedup): prepend the provider name only
    // when the model label does NOT already start with it. This handles the registry's mix:
    // Claude/GPT/Gemini/DeepSeek labels self-identify (e.g. "Claude Opus 4.7") so we avoid
    // "Claude Claude Opus 4.7"; Groq/Ollama/Kimi/Mistral-Pixtral labels don't (e.g.
    // "Whisper Large V3 Turbo") so the provider prefix is still added to keep context.
    const triggerLabel = (() => {
        if (enabledProviders.length === 0) return 'Configure a provider';
        if (!selectedModelId || !selectedVersion) return 'Select a model';
        const modelLabel = selectedVersion.label;
        const startsWithProvider = modelLabel.toLowerCase().startsWith(selectedProvider.toLowerCase());
        return startsWithProvider ? modelLabel : `${selectedProvider} ${modelLabel}`;
    })();

    const disabled = enabledProviders.length === 0;

    const handleProviderSubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPopoverProvider(e.target.value as TAIProvider);
    };

    const handleModelPick = (modelId: string) => {
        AIConfig.setPreferred(feature, popoverProvider, modelId);
        setTick(t => t + 1);
        setIsOpen(false);
    };

    const handleOpenSettings = () => {
        setIsOpen(false);
        if (onNavigateToSettings) onNavigateToSettings();
        else settingsModal?.openSettings('providers');
    };

    const renderCapabilities = (version: AIVersion) => (
        <span className="pm-caps">
            {version.capabilities.pdf && <i className="bi bi-file-earmark-pdf" title="Documents" />}
            {version.capabilities.vision && <i className="bi bi-image" title="Images" />}
        </span>
    );

    return (
        <div className={`provider-selector provider-model-selector ${compact ? 'compact' : ''} ${className}`}>
            <button
                className="provider-btn"
                onClick={(e) => { e.stopPropagation(); if (!disabled) setIsOpen(!isOpen); }}
                disabled={disabled}
                title={disabled ? 'Configure a provider in Settings' : 'Select provider and model'}
            >
                <span className="pm-trigger-label">{triggerLabel}</span>
                <i className={`bi bi-chevron-${isOpen ? 'up' : 'down'} chevron`} />
            </button>

            {isOpen && !disabled && (
                <div className="provider-menu pm-popover" onClick={(e) => e.stopPropagation()}>
                    <div className="pm-provider-row">
                        <label className="pm-provider-label">Provider</label>
                        {enabledProviders.length > 1 ? (
                            <select
                                className="pm-provider-select"
                                value={popoverProvider}
                                onChange={handleProviderSubSelect}
                            >
                                {enabledProviders.map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="pm-provider-static">{popoverProvider}</span>
                        )}
                    </div>

                    <div className="pm-model-list">
                        {nonLegacy.length === 0 && (
                            <div className="pm-empty">No models in registry for this provider.</div>
                        )}
                        {nonLegacy.map(m => {
                            const isActive = selectedProvider === popoverProvider && selectedModelId === m.id;
                            return (
                                <button
                                    key={m.id}
                                    className={`provider-option pm-model-option ${isActive ? 'active' : ''}`}
                                    onClick={() => handleModelPick(m.id)}
                                    title={m.version.label}
                                >
                                    <span className="pm-model-label">{m.version.label}</span>
                                    {renderCapabilities(m.version)}
                                    {isActive && <i className="bi bi-check-lg check-icon" />}
                                </button>
                            );
                        })}

                        {legacy.length > 0 && showLegacy && (
                            <>
                                <div className="pm-legacy-heading">Legacy</div>
                                {legacy.map(m => {
                                    const isActive = selectedProvider === popoverProvider && selectedModelId === m.id;
                                    return (
                                        <button
                                            key={m.id}
                                            className={`provider-option pm-model-option pm-legacy ${isActive ? 'active' : ''}`}
                                            onClick={() => handleModelPick(m.id)}
                                            title={m.version.label}
                                        >
                                            <span className="pm-model-label">{m.version.label}</span>
                                            {renderCapabilities(m.version)}
                                            {isActive && <i className="bi bi-check-lg check-icon" />}
                                        </button>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {legacy.length > 0 && (
                        <label className="pm-legacy-toggle">
                            <input
                                type="checkbox"
                                checked={showLegacy}
                                onChange={(e) => setShowLegacy(e.target.checked)}
                            />
                            Show legacy models
                        </label>
                    )}

                    <div className="provider-menu-footer">
                        <button className="configure-link" onClick={handleOpenSettings}>
                            <i className="bi bi-gear" /> Configure in Settings
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProviderModelSelector;

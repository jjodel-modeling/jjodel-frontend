import React, { useState, useEffect, useMemo } from 'react';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import { AIEvents } from '../../events/registry';
import './ProviderSelector.scss';
import './ProviderModelSelector.scss';
import {
    AI,
    AIConfig,
    AIFeature,
    AIVersion,
    JodieConfig,
    TAIProvider,
    hasLiveCatalog,
} from '../../types/jodie';
import { AIProviderService } from '../../services/AIProviderService';
import { CATALOG_PROVIDERS, splitModelList } from '../../services/aiModelCatalog';

// Model lists: a provider with a live catalog (services/aiModelCatalog.ts) shows the newest model
// of each family, the rest behind «Show older models»; a static entry the catalog no longer lists
// appears only when it is the selection, flagged «unavailable». A catalog provider still on its
// static list (no key, no network) is marked as such. Other providers keep the static split:
// current entries first, deprecated ones behind the same control.

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
    const [showLegacy, setShowLegacy] = useState(false); // «Show older models», per-session only
    const [tick, setTick] = useState(0); // force re-read of localStorage when user picks

    // Read current selection from per-feature preference. `getPreferred` returns the provider
    // (with first-enabled fallback); `getPreferredModel` returns the explicit modelId or undefined.
    const selectedProvider = useMemo(() => AIConfig.getPreferred(feature), [feature, tick]);
    const selectedModelId = useMemo(() => AIConfig.getPreferredModel(feature), [feature, tick]);

    // Only providers with valid API keys appear in the sub-select
    const enabledProviders = useMemo(() => JodieConfig.getEnabledProviders(), [tick]);

    // Re-read when providers or preferences change outside this menu. A key saved in Settings fires
    // PROVIDER_CHANGED only (AIConfig.save); a preference set elsewhere fires SETTINGS_CHANGED
    // (AIConfig.setPreferred). Without them the menu kept «Configure a provider» until it remounted
    // (#168, measured 2026-10-03).
    useEffect(() => {
        const reread = () => setTick(t => t + 1);
        window.addEventListener(AIEvents.SETTINGS_CHANGED, reread);
        window.addEventListener(AIEvents.PROVIDER_CHANGED, reread);
        window.addEventListener(AIEvents.MODELS_UPDATED, reread);
        return () => {
            window.removeEventListener(AIEvents.SETTINGS_CHANGED, reread);
            window.removeEventListener(AIEvents.PROVIDER_CHANGED, reread);
            window.removeEventListener(AIEvents.MODELS_UPDATED, reread);
        };
    }, []);

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

    // Refresh the live catalog when the menu opens on a catalog provider (no-op on a fresh cache).
    // The result arrives through AIEvents.MODELS_UPDATED.
    useEffect(() => {
        if (isOpen) void AIProviderService.refreshModels(popoverProvider).catch(() => undefined);
    }, [isOpen, popoverProvider]);

    const popoverModels: ModelEntry[] = useMemo(() => {
        const llm = AI[popoverProvider];
        if (!llm) return [];
        return Object.keys(llm.versions).map(id => ({ id, version: llm.versions[id] }));
    }, [popoverProvider, tick]);

    const isLive = useMemo(() => hasLiveCatalog(popoverProvider), [popoverProvider, tick]);
    const isStaticFallback = !isLive && (CATALOG_PROVIDERS as string[]).includes(popoverProvider);
    const isSelected = (id: string) => selectedProvider === popoverProvider && selectedModelId === id;

    const { main: nonLegacy, older: legacy } = useMemo(
        () => splitModelList(popoverModels, isLive, selectedProvider === popoverProvider ? selectedModelId : undefined),
        [popoverModels, isLive, selectedProvider, popoverProvider, selectedModelId]);

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
            {version.unavailable && (
                <span className="pm-badge-unavailable" title="The provider no longer offers this model to your key. Pick another one.">
                    <i className="bi bi-exclamation-triangle" /> unavailable
                </span>
            )}
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
                {selectedVersion?.unavailable && (
                    <i className="bi bi-exclamation-triangle pm-trigger-warning" title="The selected model is no longer offered to your key" />
                )}
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

                    {isStaticFallback && (
                        <div className="pm-static-marker" title="Add a key and test the connection to load the models your key can use">
                            <i className="bi bi-cloud-slash" /> Built-in list: live model list not loaded
                        </div>
                    )}

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
                    </div>

                    {/* The control sits between the two lists and always keeps its row, so showing the
                        older models adds rows below it and moves nothing already on screen. */}
                    <label className={`pm-legacy-toggle ${legacy.length === 0 ? 'pm-legacy-toggle-empty' : ''}`} aria-hidden={legacy.length === 0}>
                        <input
                            type="checkbox"
                            checked={showLegacy}
                            disabled={legacy.length === 0}
                            onChange={(e) => setShowLegacy(e.target.checked)}
                        />
                        Show older models{legacy.length > 0 ? ` (${legacy.length})` : ''}
                    </label>

                    {legacy.length > 0 && showLegacy && (
                        <div className="pm-model-list pm-older-list">
                            {legacy.map(m => {
                                const isActive = isSelected(m.id);
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
                        </div>
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

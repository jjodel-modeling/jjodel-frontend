import React, { useState, useEffect, useMemo } from 'react';
import { useSettingsModalSafe } from '../../contexts/SettingsModalContext';
import { AIEvents } from '../../events/registry';
import './ProviderSelector.scss';
import './ProviderModelSelector.scss';
import { applyModelCatalog } from '../../types/jodie';
import type { TAIProvider } from '../../types/jodie';
import { cachedModelsFor } from '../../services/aiModelCatalog';
import type { CatalogProvider } from '../../services/aiModelCatalog';
import {
    CATALOG_PROVIDERS,
    FeaturePreferenceStore,
    PROVIDER_IDS,
    SEEDS,
    cachedModels,
    claudeFamily,
    geminiFamilyRank,
    modelDirectory,
    openaiFamily,
    refreshIfStale,
    registry,
} from '../../services/ai';
import type { AIFeature, AIModel, ProviderId } from '../../services/ai';
import { ECapabilities } from '../../services/ai';

// Model lists: a provider with a live catalog (services/ai/catalog/catalogCache.ts) shows the newest
// model of each family, the rest behind «Show older models»; a static entry the catalog no longer
// lists appears only when it is the selection, flagged «unavailable». A catalog provider still on
// its static list (no key, no network) is marked as such. Other providers keep the static split:
// current entries first, deprecated ones behind the same control.

// ── Shared reads of the AI settings (#196 L2) ────────────────────────────────
// The settings, Jodie and feature surfaces read the preferences and the live catalog through these
// helpers. They sit here until L6 consolidates them into src/services/ai.

export function isProviderId(id: string | undefined | null): id is ProviderId {
    return !!id && (PROVIDER_IDS as readonly string[]).includes(id);
}

/**
 * The provider of `feature`: the stored preference, else the first enabled provider, else the
 * first of the registry (was AIConfig.getPreferred). A stored name the registry does not serve
 * (the parked Llama, Copilot) falls back the same way.
 */
export function preferredProviderId(feature: AIFeature): ProviderId {
    const stored = FeaturePreferenceStore.get(feature)?.providerId;
    if (isProviderId(stored)) return stored;
    return registry.enabled()[0]?.name ?? PROVIDER_IDS[0];
}

/**
 * The model of `feature`, through the legacy map and the retired-model rule, or undefined when none
 * is stored or the stored one belongs to another provider (was AIConfig.getPreferredModel).
 */
export function preferredModelId(feature: AIFeature): string | undefined {
    const pref = FeaturePreferenceStore.get(feature);
    if (!pref?.modelId) return undefined;
    const resolved = modelDirectory.current(pref.providerId, pref.modelId);
    if (resolved && modelDirectory.isForeign(pref.providerId, resolved)) return undefined;
    return resolved;
}

/** True for the providers with a live model catalog (Claude, GPT, Gemini). */
export function hasCatalog(id: ProviderId): boolean {
    return CATALOG_PROVIDERS.includes(id);
}

/**
 * Refreshes `id`'s live catalog when it is missing, for another key, or older than 24 h (`force`
 * skips the check). The result arrives through AIEvents.MODELS_UPDATED.
 *
 * Bridge until L3 (it deletes it): the chat, documentation and mapping calls still resolve their
 * model against AI[id].versions of types/jodie.ts, so the list the new cache stored is applied there
 * too, as AIProviderService.refreshModels did. Without it a Gemini model picked from the live list
 * would be swapped by the old chat path for the first static entry.
 */
export async function refreshLiveCatalog(id: ProviderId, force: boolean = false): Promise<void> {
    const provider = registry.get(id);
    const models = await refreshIfStale(provider, force);
    if (!models?.length) return;
    const stored = cachedModelsFor(id as CatalogProvider, provider.apiKey);
    if (stored?.models.length) applyModelCatalog(id as TAIProvider, stored.models);
}

/** The static seed rows of `id` that are deprecated (kept for persisted selections). */
function deprecatedSeeds(id: ProviderId): Set<string> {
    return new Set(SEEDS[id].filter(row => row[4]).map(row => row[0]));
}

/** True when `modelId` is a deprecated static entry of `id`. */
export function isDeprecatedModel(id: ProviderId, modelId: string): boolean {
    return deprecatedSeeds(id).has(modelId);
}

/** The family a catalog model is grouped by, for the «newest of each family» split. */
function familyOf(id: ProviderId, modelId: string): string {
    switch (id) {
        case 'Claude': return claudeFamily(modelId);
        case 'GPT':    return openaiFamily(modelId);
        case 'Gemini': return geminiFamilyRank(modelId).family;
        default:       return modelId;
    }
}

interface ProviderModelSelectorProps {
    feature: AIFeature;
    className?: string;
    compact?: boolean;
    onNavigateToSettings?: () => void;
}

interface ModelEntry {
    id: string;
    model: AIModel;
    /** A static entry the live catalog does not list. */
    unavailable: boolean;
}

/**
 * The picker's two lists. With a live catalog: the newest model of each family (the first of its
 * family in the stored display order), plus the selection wherever it is; every other live model is
 * «older»; a static entry the catalog does not list is shown only when selected, flagged. Without
 * one: current static entries, and deprecated ones as «older».
 */
function pickerLists(id: ProviderId, selectedId: string | undefined): { main: ModelEntry[]; older: ModelEntry[]; isLive: boolean } {
    const provider = registry.get(id);
    const live = hasCatalog(id) ? cachedModels(id, provider.apiKey) ?? [] : [];
    // The static entry wins for an id in both lists, as its capability flags did.
    const entry = (m: AIModel, unavailable: boolean): ModelEntry => ({ id: m.apiName, model: provider.model(m.apiName) ?? m, unavailable });
    if (!live.length) {
        const deprecated = deprecatedSeeds(id);
        const seeds = provider.spec.seedModels.map(m => entry(m, false));
        return { main: seeds.filter(e => !deprecated.has(e.id)), older: seeds.filter(e => deprecated.has(e.id)), isLive: false };
    }
    const main: ModelEntry[] = [];
    const older: ModelEntry[] = [];
    const families = new Set<string>();
    for (const m of live) {
        const family = familyOf(id, m.apiName);
        const e = entry(m, false);
        if (!families.has(family)) { families.add(family); main.push(e); }
        else if (e.id === selectedId) main.push(e);
        else older.push(e);
    }
    const liveIds = new Set(live.map(m => m.apiName));
    const selectedStatic = provider.spec.seedModels.find(m => m.apiName === selectedId && !liveIds.has(m.apiName));
    if (selectedStatic) main.push(entry(selectedStatic, true));
    return { main, older, isLive: true };
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

    // Read current selection from per-feature preference. `preferredProviderId` returns the provider
    // (with first-enabled fallback); `preferredModelId` returns the explicit modelId or undefined.
    const selectedProvider = useMemo(() => preferredProviderId(feature), [feature, tick]);
    const selectedModelId = useMemo(() => preferredModelId(feature), [feature, tick]);

    // Only providers with valid API keys appear in the sub-select
    const enabledProviders = useMemo(() => registry.enabled().map(p => p.name), [tick]);

    // Re-read when providers or preferences change outside this menu. A key saved in Settings fires
    // PROVIDER_CHANGED only (ProviderConfigStore.save); a preference set elsewhere fires
    // SETTINGS_CHANGED (FeaturePreferenceStore.set). Without them the menu kept «Configure a provider» until it remounted
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
    const [popoverProvider, setPopoverProvider] = useState<ProviderId>(selectedProvider);
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
        if (isOpen) void refreshLiveCatalog(popoverProvider).catch(() => undefined);
    }, [isOpen, popoverProvider]);

    const { main: nonLegacy, older: legacy, isLive } = useMemo(
        () => pickerLists(popoverProvider, selectedProvider === popoverProvider ? selectedModelId : undefined),
        [popoverProvider, selectedProvider, selectedModelId, tick]);
    const isStaticFallback = !isLive && hasCatalog(popoverProvider);
    const isSelected = (id: string) => selectedProvider === popoverProvider && selectedModelId === id;

    // The selected model, flagged when a live catalog no longer lists it.
    const selectedVersion: ModelEntry | undefined = useMemo(() => {
        if (!selectedProvider || !selectedModelId) return undefined;
        const provider = registry.get(selectedProvider);
        const model = provider.model(selectedModelId);
        if (!model) return undefined;
        const live = hasCatalog(selectedProvider) ? cachedModels(selectedProvider, provider.apiKey) ?? [] : [];
        return { id: selectedModelId, model, unavailable: live.length > 0 && !live.some(m => m.apiName === selectedModelId) };
    }, [selectedProvider, selectedModelId, tick]);

    // Compose the trigger label. Option B (defensive dedup): prepend the provider name only
    // when the model label does NOT already start with it. This handles the registry's mix:
    // Claude/GPT/Gemini/DeepSeek labels self-identify (e.g. "Claude Opus 4.7") so we avoid
    // "Claude Claude Opus 4.7"; Groq/Ollama/Kimi/Mistral-Pixtral labels don't (e.g.
    // "Whisper Large V3 Turbo") so the provider prefix is still added to keep context.
    const triggerLabel = (() => {
        if (enabledProviders.length === 0) return 'Configure a provider';
        if (!selectedModelId || !selectedVersion) return 'Select a model';
        const modelLabel = selectedVersion.model.displayName;
        const startsWithProvider = modelLabel.toLowerCase().startsWith(selectedProvider.toLowerCase());
        return startsWithProvider ? modelLabel : `${selectedProvider} ${modelLabel}`;
    })();

    const disabled = enabledProviders.length === 0;

    const handleProviderSubSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setPopoverProvider(e.target.value as ProviderId);
    };

    const handleModelPick = (modelId: string) => {
        FeaturePreferenceStore.set(feature, popoverProvider, modelId);
        setTick(t => t + 1);
        setIsOpen(false);
    };

    const handleOpenSettings = () => {
        setIsOpen(false);
        if (onNavigateToSettings) onNavigateToSettings();
        else settingsModal?.openSettings('providers');
    };

    const renderCapabilities = (version: ModelEntry) => (
        <span className="pm-caps">
            {version.unavailable && (
                <span className="pm-badge-unavailable" title="The provider no longer offers this model to your key. Pick another one.">
                    <i className="bi bi-exclamation-triangle" /> unavailable
                </span>
            )}
            {version.model.has(ECapabilities.DOCUMENTS) && <i className="bi bi-file-earmark-pdf" title="Documents" />}
            {version.model.has(ECapabilities.IMAGES) && <i className="bi bi-image" title="Images" />}
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
                                    title={m.model.displayName}
                                >
                                    <span className="pm-model-label">{m.model.displayName}</span>
                                    {renderCapabilities(m)}
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
                                        title={m.model.displayName}
                                    >
                                        <span className="pm-model-label">{m.model.displayName}</span>
                                        {renderCapabilities(m)}
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

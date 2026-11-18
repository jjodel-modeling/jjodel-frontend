/**
 * Feature → provider/model preferences on the keys of today (#196, spec §5 and §6; zero data
 * migration): `jjodel_provider_<feature>` holds `{ providerId, modelId?, updatedAt }`.
 *
 * The four load-time migrations are copied from `AIConfig` in types/jodie.ts, with the same
 * sentinels and in the order `JodieConfig.load` runs them. What they need to know about models
 * (legacy ids, the foreign-model guard, retired models) comes from a `ModelDirectory`, which the
 * registry supplies, so this file does not import the registry.
 */
import { AIEvents } from '../../../events/registry';
import type { AIFeature, ProviderId } from '../types';
import { ProviderConfigStore } from './ProviderConfigStore';

export const FEATURE_STORAGE_PREFIX = 'jjodel_provider_';
/** The legacy global default, read once by `migrateGlobalDefaultToPerFeature` and never deleted. */
export const GLOBAL_DEFAULT_KEY = 'jjodel_default_provider';
export const LEGACY_MODEL_IDS_SENTINEL = 'jjodel_migration:legacy_model_ids_v1';
export const GLOBAL_TO_PER_FEATURE_SENTINEL = 'jjodel_migration:global_to_per_feature';

export const AI_FEATURES: readonly AIFeature[] = ['documentation', 'chat', 'scriptblock', 'mappings', 'explain'];

export interface FeaturePreference {
    /** A provider name; read as stored, so a provider the module does not serve stays as it is. */
    providerId: string;
    /** When absent, callers fall back to the provider's configured model. */
    modelId?: string;
    updatedAt: number;
}

/** What the migrations ask about models. Provider names are strings: a stored preference may name any. */
export interface ModelDirectory {
    /** The providers whose `jjodie_provider_<name>` record the migrations visit. */
    providers(): readonly ProviderId[];
    /** The id through the provider's legacy map, else unchanged (`resolveLegacyModelId`). */
    legacy(provider: string, modelId: string | undefined): string | undefined;
    /** The legacy map, then a retired model moved onto a current one (`resolveCurrentModelId`). */
    current(provider: string, modelId: string | undefined): string | undefined;
    /** True when another provider lists the model and this one does not (`isForeignModel`). */
    isForeign(provider: string, modelId: string | undefined): boolean;
}

function readJson<T>(key: string): T | null {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : null;
}

export class FeaturePreferenceStore {
    static storageKey(feature: AIFeature): string {
        return FEATURE_STORAGE_PREFIX + feature;
    }

    static get(feature: AIFeature): FeaturePreference | null {
        try {
            return readJson<FeaturePreference>(FeaturePreferenceStore.storageKey(feature));
        } catch {
            return null;
        }
    }

    /**
     * Stores the preference and fires SETTINGS_CHANGED, as `AIConfig.setPreferred`. With no
     * `modelId`, the stored one is kept when the provider is unchanged.
     */
    static set(feature: AIFeature, providerId: string, modelId?: string): FeaturePreference {
        let preservedModelId = modelId;
        if (preservedModelId === undefined) {
            const prev = FeaturePreferenceStore.get(feature);
            if (prev && prev.providerId === providerId && prev.modelId) preservedModelId = prev.modelId;
        }
        const pref: FeaturePreference = { providerId, modelId: preservedModelId, updatedAt: Date.now() };
        localStorage.setItem(FeaturePreferenceStore.storageKey(feature), JSON.stringify(pref));
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(AIEvents.SETTINGS_CHANGED, {
                detail: { type: 'feature-preference', feature, providerId, modelId: preservedModelId },
            }));
        }
        return pref;
    }

    static reset(feature: AIFeature): void {
        localStorage.removeItem(FeaturePreferenceStore.storageKey(feature));
    }

    /** The four migrations, in the order of `JodieConfig.load`. */
    static load(directory: ModelDirectory): void {
        FeaturePreferenceStore.migrateGlobalDefaultToPerFeature();
        FeaturePreferenceStore.migrateLegacyModelIds(directory);
        FeaturePreferenceStore.sanitizeForeignFeatureModels(directory);
        FeaturePreferenceStore.retireModels(directory);
    }

    /**
     * One-shot: the legacy global default becomes the preference of every feature that has none.
     * The legacy key is left in place, so a rollback keeps the user's choice.
     */
    static migrateGlobalDefaultToPerFeature(): void {
        try {
            if (localStorage.getItem(GLOBAL_TO_PER_FEATURE_SENTINEL) === '1') return;
            const globalDefault = localStorage.getItem(GLOBAL_DEFAULT_KEY);
            if (globalDefault) {
                for (const feature of AI_FEATURES) {
                    const key = FeaturePreferenceStore.storageKey(feature);
                    if (localStorage.getItem(key) === null) {
                        const pref: FeaturePreference = { providerId: globalDefault, updatedAt: Date.now() };
                        localStorage.setItem(key, JSON.stringify(pref));
                    }
                }
            }
            localStorage.setItem(GLOBAL_TO_PER_FEATURE_SENTINEL, '1');
        } catch (e) {
            console.warn('[ai] migrateGlobalDefaultToPerFeature failed:', e);
        }
    }

    /** One-shot: legacy model ids, in the per-feature preferences and each provider's model, become current ones. */
    static migrateLegacyModelIds(directory: ModelDirectory): void {
        try {
            if (localStorage.getItem(LEGACY_MODEL_IDS_SENTINEL) === '1') return;

            for (const feature of AI_FEATURES) {
                const key = FeaturePreferenceStore.storageKey(feature);
                try {
                    const pref = readJson<FeaturePreference>(key);
                    if (!pref?.modelId) continue;
                    const resolved = directory.legacy(pref.providerId, pref.modelId);
                    if (resolved && resolved !== pref.modelId) {
                        pref.modelId = resolved;
                        pref.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(pref));
                    }
                } catch { /* skip malformed entries */ }
            }

            // The provider records are rewritten in place, as today: the blob copy is not touched.
            for (const provider of directory.providers()) {
                const key = ProviderConfigStore.storageKey(provider);
                try {
                    const cfg = readJson<Record<string, unknown>>(key);
                    if (!cfg) continue;
                    const currentModel = cfg.model as string | undefined;
                    const resolved = directory.legacy(provider, currentModel);
                    if (resolved && resolved !== currentModel) {
                        cfg.model = resolved;
                        localStorage.setItem(key, JSON.stringify(cfg));
                    }
                } catch { /* skip malformed entries */ }
            }

            localStorage.setItem(LEGACY_MODEL_IDS_SENTINEL, '1');
        } catch (e) {
            console.warn('[ai] migrateLegacyModelIds failed:', e);
        }
    }

    /**
     * Drops a per-feature model that belongs to another provider, keeping the provider choice.
     * No sentinel: it writes only when it repairs something, and never touches a provider record.
     */
    static sanitizeForeignFeatureModels(directory: ModelDirectory): void {
        try {
            let repaired = 0;
            for (const feature of AI_FEATURES) {
                const key = FeaturePreferenceStore.storageKey(feature);
                try {
                    const pref = readJson<FeaturePreference>(key);
                    if (!pref?.modelId) continue;
                    const resolved = directory.legacy(pref.providerId, pref.modelId) ?? pref.modelId;
                    if (directory.isForeign(pref.providerId, resolved)) {
                        delete pref.modelId;
                        pref.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(pref));
                        repaired++;
                    }
                } catch { /* skip malformed entries */ }
            }
            if (repaired > 0) console.info(`[ai] sanitizeForeignFeatureModels: repaired ${repaired} mismatched per-feature model preference(s).`);
        } catch (e) {
            console.warn('[ai] sanitizeForeignFeatureModels failed:', e);
        }
    }

    /**
     * Moves models the registry no longer serves onto current ones (#179), in the per-feature
     * preferences and each provider's model. No sentinel: it runs on every load and writes only
     * when it moves something. The provider record keeps the id it left in `replacedModel`.
     */
    static retireModels(directory: ModelDirectory): void {
        try {
            const replaced: Record<string, string> = {};

            for (const feature of AI_FEATURES) {
                const key = FeaturePreferenceStore.storageKey(feature);
                try {
                    const pref = readJson<FeaturePreference>(key);
                    if (!pref?.modelId) continue;
                    const current = directory.current(pref.providerId, pref.modelId);
                    if (current && current !== pref.modelId) {
                        replaced[pref.providerId] = pref.modelId;
                        pref.modelId = current;
                        pref.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(pref));
                    }
                } catch { /* skip malformed entries */ }
            }

            for (const provider of directory.providers()) {
                const key = ProviderConfigStore.storageKey(provider);
                try {
                    const cfg = readJson<Record<string, unknown>>(key);
                    if (!cfg) continue;
                    const current = directory.current(provider, cfg.model as string | undefined);
                    if (current && current !== cfg.model) {
                        replaced[provider] = cfg.model as string;
                        cfg.model = current;
                    }
                    else if (!replaced[provider]) continue;
                    cfg.replacedModel = replaced[provider];
                    localStorage.setItem(key, JSON.stringify(cfg));
                } catch { /* skip malformed entries */ }
            }
        } catch (e) {
            console.warn('[ai] retireModels failed:', e);
        }
    }
}

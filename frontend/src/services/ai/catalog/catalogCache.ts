/**
 * The live model catalog cache (#196, spec §5 and §6): `jjodel_models_<provider>`, 24 h TTL, tied
 * to an FNV-1a hash of the API key so a key change invalidates it without storing the key again.
 *
 * Same entry format as services/aiModelCatalog.ts, which L3 deletes: `{ fetchedAt, keyHash,
 * models: [{ id, label, family, rank, contextWindow? }] }`. A refresh calls the provider's
 * `retrieveAvailableModels()`, a direct call: the Worker route of the old module is dropped.
 */
import { AIEvents } from '../../../events/registry';
import type { BaseProvider } from '../BaseProvider';
import { capabilitiesFor } from '../BaseProvider';
import type { ProviderId } from '../types';
import { AIModel } from '../types';

/** The providers with a live catalog, as today. */
export const CATALOG_PROVIDERS: readonly ProviderId[] = ['Claude', 'GPT', 'Gemini'];

export const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
export const CATALOG_STORAGE_PREFIX = 'jjodel_models_';

/** One model of a stored entry, in the format of aiModelCatalog.ts. */
interface StoredCatalogModel {
    id: string;
    label: string;
    family: string;
    rank: number;
    contextWindow?: number;
}

interface CatalogCacheEntry {
    fetchedAt: number;
    keyHash: string;
    models: StoredCatalogModel[];
}

/**
 * Short non-reversible fingerprint of an API key (FNV-1a, 32 bit). Synchronous on purpose, so a
 * cached list can be read before any await.
 */
export function hashKey(apiKey: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < apiKey.length; i++) {
        h ^= apiKey.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

export function isCatalogProvider(provider: ProviderId): boolean {
    return CATALOG_PROVIDERS.includes(provider);
}

export function catalogStorageKey(provider: ProviderId): string {
    return CATALOG_STORAGE_PREFIX + provider.toLowerCase();
}

function readEntry(provider: ProviderId): CatalogCacheEntry | null {
    try {
        const raw = localStorage.getItem(catalogStorageKey(provider));
        if (!raw) return null;
        const entry = JSON.parse(raw) as CatalogCacheEntry;
        if (!entry || !Array.isArray(entry.models) || typeof entry.keyHash !== 'string') return null;
        return entry;
    } catch {
        return null;
    }
}

/** The entry usable for `apiKey`: same key, any age (a stale list beats the static one until a refresh lands). */
function entryFor(provider: ProviderId, apiKey: string | undefined): CatalogCacheEntry | null {
    if (!apiKey) return null;
    const entry = readEntry(provider);
    if (!entry || entry.keyHash !== hashKey(apiKey)) return null;
    return entry;
}

/** The cached models for `apiKey`, in stored order, or null when there is no usable entry. */
export function cachedModels(provider: ProviderId, apiKey: string | undefined): AIModel[] | null {
    const entry = entryFor(provider, apiKey);
    if (!entry) return null;
    return entry.models.map(m => {
        const caps = capabilitiesFor(m.id);
        return new AIModel(m.id, m.label || m.id, caps.capabilities, m.contextWindow ?? caps.contextWindow);
    });
}

/** True when the cache must be refetched: missing, for another key, or older than the TTL. */
export function needsRefresh(provider: ProviderId, apiKey: string | undefined, now: number = Date.now()): boolean {
    if (!apiKey) return false;
    const entry = entryFor(provider, apiKey);
    return !entry || now - entry.fetchedAt >= CATALOG_TTL_MS;
}

/**
 * Stores `models` for `apiKey`. The list is already in display order, so `rank` keeps that order
 * and `family` is the model id: the reader of the old format sees one family per model.
 */
export function writeCatalog(provider: ProviderId, apiKey: string, models: readonly AIModel[], now: number = Date.now()): void {
    const entry: CatalogCacheEntry = {
        fetchedAt: now,
        keyHash: hashKey(apiKey),
        models: models.map((m, i) => ({ id: m.apiName, label: m.displayName, family: m.apiName, rank: models.length - i, contextWindow: m.contextWindow })),
    };
    try { localStorage.setItem(catalogStorageKey(provider), JSON.stringify(entry)); } catch { /* quota: the list lives in memory only */ }
}

const inFlight = new Map<ProviderId, Promise<AIModel[]>>();

/**
 * Fetches `provider`'s models now, caches a non-empty list and fires MODELS_UPDATED with
 * `{ provider }`. Concurrent calls for the same provider share one request. Rejects with the
 * provider's error.
 */
export function refreshCatalog(provider: BaseProvider, now: number = Date.now()): Promise<AIModel[]> {
    const pending = inFlight.get(provider.name);
    if (pending) return pending;
    const run = (async () => {
        const models = await provider.retrieveAvailableModels();
        if (models.length) {
            writeCatalog(provider.name, provider.apiKey, models, now);
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent(AIEvents.MODELS_UPDATED, { detail: { provider: provider.name } }));
            }
        }
        return models;
    })();
    inFlight.set(provider.name, run);
    return run.finally(() => inFlight.delete(provider.name));
}

/**
 * Refreshes when the cache is missing, for another key, or older than 24 h (`force` skips the
 * check). Resolves to null when there is nothing to do: not a catalog provider, no key, or a
 * fresh cache.
 */
export async function refreshIfStale(provider: BaseProvider, force: boolean = false, now: number = Date.now()): Promise<AIModel[] | null> {
    if (!isCatalogProvider(provider.name) || !provider.apiKey) return null;
    if (!force && !needsRefresh(provider.name, provider.apiKey, now)) return null;
    return refreshCatalog(provider, now);
}

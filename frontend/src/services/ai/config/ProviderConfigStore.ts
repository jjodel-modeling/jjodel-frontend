/**
 * Per-provider settings on the keys of today (#196, spec §5; zero data migration).
 *
 * Two copies of every record are stored: `jjodie_provider_<name lowercase>` and the `providers` of
 * the `jjodie-credentials` blob. Measured on today's code (`__tests__/legacyKeyPrecedence.test.ts`,
 * R-AI-6): the provider key is the only copy ever read, the blob copy is written by a save and
 * never loaded. This store reads the same way and writes both copies on save.
 *
 * The blob carries fields this store does not own (`dockWidth`, the legacy `position`/`size`,
 * `appVersion`, the other providers): a save round-trips them unchanged (R-AI-9).
 */
import { AIEvents } from '../../../events/registry';
import type { ProviderConfig, ProviderId } from '../types';

export const PROVIDER_STORAGE_PREFIX = 'jjodie_provider_';
export const CREDENTIALS_BLOB_KEY = 'jjodie-credentials';

/**
 * A stored provider record. The four fields below are the ones the module reads; the record also
 * holds fields of today's `AIConfig` (`name`, `lastTested`, `lastTestOk`, `replacedModel`, ...),
 * which every write keeps.
 */
export interface StoredProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    enabled?: boolean;
    [field: string]: unknown;
}

function parse(raw: string | null): Record<string, unknown> | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw);
        return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
    } catch {
        return null;
    }
}

function dispatch(type: string, detail: unknown): void {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(type, { detail }));
}

export class ProviderConfigStore {
    static storageKey(provider: ProviderId): string {
        return PROVIDER_STORAGE_PREFIX + provider.toLowerCase();
    }

    /** The stored record, or null when the provider was never saved or the record is malformed. */
    static load(provider: ProviderId): StoredProviderConfig | null {
        try {
            return parse(localStorage.getItem(ProviderConfigStore.storageKey(provider))) as StoredProviderConfig | null;
        } catch {
            return null;
        }
    }

    /** The settings a provider is built with; empty when nothing is stored. */
    static get(provider: ProviderId): ProviderConfig {
        const stored = ProviderConfigStore.load(provider);
        if (!stored) return {};
        const config: ProviderConfig = {};
        if (typeof stored.apiKey === 'string') config.apiKey = stored.apiKey;
        if (typeof stored.baseUrl === 'string') config.baseUrl = stored.baseUrl;
        if (typeof stored.model === 'string') config.model = stored.model;
        return config;
    }

    /**
     * Merges `patch` into the stored record and writes it to both copies, then fires
     * PROVIDER_CHANGED with `{ provider, config }` as `AIConfig.save` does. Returns the record.
     */
    static save(provider: ProviderId, patch: Partial<StoredProviderConfig>): StoredProviderConfig {
        const record: StoredProviderConfig = { ...(ProviderConfigStore.load(provider) ?? { name: provider }), ...patch };
        localStorage.setItem(ProviderConfigStore.storageKey(provider), JSON.stringify(record));
        ProviderConfigStore.writeBlobCopy(provider, record);
        dispatch(AIEvents.PROVIDER_CHANGED, { provider, config: record });
        return record;
    }

    /** Replaces `providers[provider]` in the blob; every other field of the blob is kept as read. */
    private static writeBlobCopy(provider: ProviderId, record: StoredProviderConfig): void {
        const blob = parse(localStorage.getItem(CREDENTIALS_BLOB_KEY)) ?? {};
        const own = blob.providers;
        const providers: Record<string, unknown> = own && typeof own === 'object' && !Array.isArray(own) ? { ...own } : {};
        providers[provider] = record;
        localStorage.setItem(CREDENTIALS_BLOB_KEY, JSON.stringify({ ...blob, providers }));
    }
}

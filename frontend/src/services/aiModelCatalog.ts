/**
 * AI model catalog: the cached list of the models a provider's key can use, and the capabilities
 * the provider's `models` endpoint does not report
 * (docs/discovery/discovery_2026-10-18_ai_proxy_dynamic_models.md).
 *
 * This module is pure: it does not import types/jodie.ts, so jodie can call it at module load
 * (the sync merge of the cached list) without an import cycle. The fetch, the family rule and the
 * ordering live in src/services/ai (#196 L4 deleted this module's copies, R-AI-21); this file
 * keeps what types/jodie.ts and the settings UI still read, until L6.
 *
 * - Cache: localStorage `jjodel_models_<provider>`, tied to a hash of the key (read only).
 * - Capabilities the endpoints do not report (pdf, vision) come from a prefix table with a
 *   conservative default.
 */

/** Providers with a live catalog. */
export type CatalogProvider = 'Claude' | 'GPT' | 'Gemini';
export const CATALOG_PROVIDERS: CatalogProvider[] = ['Claude', 'GPT', 'Gemini'];

export interface CatalogModel {
    id: string;
    label: string;
    /** Grouping key within the provider, e.g. 'opus', 'sonnet', 'haiku'; 'gpt:mini'; 'flash-lite'. */
    family: string;
    /**
     * Ordering within a family, higher is newer. Anthropic: created_at in ms. OpenAI: created in ms,
     * a dated snapshot pushed below every alias. Gemini (no date in the API): version and stability.
     */
    rank: number;
    contextWindow?: number;
}

export interface CatalogCacheEntry {
    fetchedAt: number;
    keyHash: string;
    models: CatalogModel[];
}

export type CatalogFailure = 'auth' | 'rate' | 'network' | 'server' | 'other';

export const CATALOG_STORAGE_PREFIX = 'jjodel_models_';

// ── Key hash ────────────────────────────────────────────────────────────────

/**
 * Short non-reversible fingerprint of an API key (FNV-1a, 32 bit), so the cache can tell a key
 * change without storing the key a second time. Synchronous on purpose: the merge at module load
 * compares it before any await.
 */
export function hashKey(apiKey: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < apiKey.length; i++) {
        h ^= apiKey.charCodeAt(i);
        h = Math.imul(h, 0x01000193) >>> 0;
    }
    return h.toString(16).padStart(8, '0');
}

// ── Cache ───────────────────────────────────────────────────────────────────

export function catalogStorageKey(provider: CatalogProvider): string {
    return CATALOG_STORAGE_PREFIX + provider.toLowerCase();
}

export function readCatalogCache(provider: CatalogProvider): CatalogCacheEntry | null {
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

/** The cached list usable for `apiKey`: same key, any age (a stale list beats the static one until a refresh lands). */
export function cachedModelsFor(provider: CatalogProvider, apiKey: string | undefined): CatalogCacheEntry | null {
    if (!apiKey) return null;
    const entry = readCatalogCache(provider);
    if (!entry || entry.keyHash !== hashKey(apiKey)) return null;
    return entry;
}

// ── Capabilities ────────────────────────────────────────────────────────────

/** What the `models` endpoints do not report. Longest matching prefix wins. */
const CAPABILITY_TABLE: { prefix: string; pdf: boolean; vision: boolean; contextWindow?: number }[] = [
    { prefix: 'claude-',          pdf: true,  vision: true,  contextWindow: 200_000 },
    { prefix: 'claude-3-haiku',   pdf: false, vision: true,  contextWindow: 200_000 },
    { prefix: 'gpt-4o',           pdf: true,  vision: true  },
    { prefix: 'gpt-4.1',          pdf: true,  vision: true  },
    { prefix: 'gpt-5',            pdf: true,  vision: true  },
    { prefix: 'gemini-',          pdf: true,  vision: true  },
];

/** Conservative default: an unknown model loses attachments, it is never sent a PDF it rejects. */
export function capabilitiesFor(id: string): { pdf: boolean; vision: boolean; contextWindow?: number } {
    let match: (typeof CAPABILITY_TABLE)[number] | undefined;
    for (const row of CAPABILITY_TABLE) {
        if (id.startsWith(row.prefix) && (!match || row.prefix.length > match.prefix.length)) match = row;
    }
    return match ? { pdf: match.pdf, vision: match.vision, contextWindow: match.contextWindow } : { pdf: false, vision: false };
}

/**
 * AI model catalog: the models a provider's key can use, read from the provider's `models`
 * endpoint instead of the static `.add(...)` chains in types/jodie.ts
 * (docs/discovery/discovery_2026-10-18_ai_proxy_dynamic_models.md).
 *
 * This module is pure: it does not import types/jodie.ts, so jodie can call it at module load
 * (the sync merge of the cached list) without an import cycle. The orchestration (which key,
 * merge, event) lives in AIProviderService.
 *
 * - Fetch: direct browser call first; the Jjodel Worker route only on a network or CORS failure.
 * - Cache: localStorage `jjodel_models_<provider>`, 24 h expiry, tied to a hash of the key.
 * - Family rule: data-driven, so a new generation needs no code change.
 * - Capabilities the endpoints do not report (pdf, vision) come from a prefix table with a
 *   conservative default.
 */

/** Providers with a live catalog. */
export type CatalogProvider = 'Claude';
export const CATALOG_PROVIDERS: CatalogProvider[] = ['Claude'];

export interface CatalogModel {
    id: string;
    label: string;
    /** Grouping key within the provider, e.g. 'opus', 'sonnet', 'haiku'. */
    family: string;
    /** Ordering within a family, higher is newer (Anthropic: created_at in ms). */
    rank: number;
    contextWindow?: number;
}

export interface CatalogCacheEntry {
    fetchedAt: number;
    keyHash: string;
    models: CatalogModel[];
}

export type CatalogFailure = 'auth' | 'rate' | 'network' | 'server' | 'other';

export type CatalogFetchResult =
    | { ok: true; models: CatalogModel[]; via: 'direct' | 'proxy' }
    | { ok: false; failure: CatalogFailure; status?: number; message: string };

export const CATALOG_TTL_MS = 24 * 60 * 60 * 1000;
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

export function writeCatalogCache(provider: CatalogProvider, apiKey: string, models: CatalogModel[], now: number = Date.now()): CatalogCacheEntry {
    const entry: CatalogCacheEntry = { fetchedAt: now, keyHash: hashKey(apiKey), models };
    try { localStorage.setItem(catalogStorageKey(provider), JSON.stringify(entry)); } catch { /* quota: keep the list in memory only */ }
    return entry;
}

/** The cached list usable for `apiKey`: same key, any age (a stale list beats the static one until a refresh lands). */
export function cachedModelsFor(provider: CatalogProvider, apiKey: string | undefined): CatalogCacheEntry | null {
    if (!apiKey) return null;
    const entry = readCatalogCache(provider);
    if (!entry || entry.keyHash !== hashKey(apiKey)) return null;
    return entry;
}

/** True when the cache must be refetched: missing, for another key, or older than the TTL. */
export function needsRefresh(provider: CatalogProvider, apiKey: string | undefined, now: number = Date.now()): boolean {
    if (!apiKey) return false;
    const entry = cachedModelsFor(provider, apiKey);
    return !entry || now - entry.fetchedAt >= CATALOG_TTL_MS;
}

// ── Family rule ─────────────────────────────────────────────────────────────

/**
 * Anthropic family: the first all-letter token after `claude-`.
 * `claude-opus-4-7` → opus, `claude-3-5-sonnet-20241022` → sonnet, `claude-haiku-4-5-20251001` → haiku.
 */
export function claudeFamily(id: string): string {
    const tokens = id.split('-');
    if (tokens[0] !== 'claude') return 'other';
    return tokens.slice(1).find(t => /^[a-z]+$/.test(t)) ?? 'other';
}

/**
 * The newest model of each family (highest rank; ties keep the first seen). Works on any entries
 * carrying `family` and `rank`; entries without a family are left out.
 */
export function newestPerFamily(entries: { id: string; family?: string; rank?: number }[]): Set<string> {
    const best = new Map<string, { id: string; rank: number }>();
    for (const e of entries) {
        if (!e.family) continue;
        const rank = e.rank ?? 0;
        const cur = best.get(e.family);
        if (!cur || rank > cur.rank) best.set(e.family, { id: e.id, rank });
    }
    return new Set([...best.values()].map(b => b.id));
}

/**
 * Display order: the newest of each family first (families ordered by their newest, newest first),
 * then every other model by rank, newest first. The first entry is the default model of a fresh
 * configuration (types/jodie.ts, JodieConfig constructor).
 */
export function orderCatalog(models: CatalogModel[]): CatalogModel[] {
    const heads = newestPerFamily(models);
    const byRank = (a: CatalogModel, b: CatalogModel) => b.rank - a.rank;
    return [
        ...models.filter(m => heads.has(m.id)).sort(byRank),
        ...models.filter(m => !heads.has(m.id)).sort(byRank),
    ];
}

// ── Response parsing ────────────────────────────────────────────────────────

/** Anthropic `GET /v1/models` page: `{data:[{type, id, display_name, created_at}], has_more, last_id}`. */
export function parseAnthropicModels(json: any): CatalogModel[] {
    const data: any[] = Array.isArray(json?.data) ? json.data : [];
    return data
        .filter(m => typeof m?.id === 'string' && m.id.startsWith('claude-'))
        .map(m => ({
            id: m.id,
            label: typeof m.display_name === 'string' && m.display_name ? m.display_name : m.id,
            family: claudeFamily(m.id),
            rank: Date.parse(m.created_at) || 0,
        }));
}

// ── Capabilities ────────────────────────────────────────────────────────────

/** What the `models` endpoints do not report. Longest matching prefix wins. */
const CAPABILITY_TABLE: { prefix: string; pdf: boolean; vision: boolean; contextWindow?: number }[] = [
    { prefix: 'claude-',          pdf: true,  vision: true,  contextWindow: 200_000 },
    { prefix: 'claude-3-haiku',   pdf: false, vision: true,  contextWindow: 200_000 },
];

/** Conservative default: an unknown model loses attachments, it is never sent a PDF it rejects. */
export function capabilitiesFor(id: string): { pdf: boolean; vision: boolean; contextWindow?: number } {
    let match: (typeof CAPABILITY_TABLE)[number] | undefined;
    for (const row of CAPABILITY_TABLE) {
        if (id.startsWith(row.prefix) && (!match || row.prefix.length > match.prefix.length)) match = row;
    }
    return match ? { pdf: match.pdf, vision: match.vision, contextWindow: match.contextWindow } : { pdf: false, vision: false };
}

// ── Fetch ───────────────────────────────────────────────────────────────────

function failureFromStatus(status: number): CatalogFailure {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate';
    if (status >= 500) return 'server';
    return 'other';
}

async function errorMessage(response: Response): Promise<string> {
    try {
        const text = await response.text();
        try {
            const json = JSON.parse(text);
            const m = json?.error?.message ?? json?.message ?? json?.error;
            if (typeof m === 'string' && m) return m;
        } catch { /* not JSON */ }
        return text.substring(0, 150);
    } catch {
        return '';
    }
}

const ANTHROPIC_MODELS_URL = 'https://api.anthropic.com/v1/models';
const MAX_PAGES = 10;

/**
 * All Anthropic models the key can use. Direct call with the browser-access header (as the chat
 * does); on a network or CORS failure (fetch rejects) the same request goes through the Worker
 * route `<proxyBase>/v1/anthropic/models`, without that header (the Worker does not allow it).
 */
export async function fetchAnthropicCatalog(apiKey: string, proxyBase: string, fetchImpl: typeof fetch = fetch): Promise<CatalogFetchResult> {
    const attempt = async (base: string, direct: boolean): Promise<CatalogFetchResult> => {
        const models: CatalogModel[] = [];
        let afterId: string | undefined;
        for (let page = 0; page < MAX_PAGES; page++) {
            const url = new URL(base);
            url.searchParams.set('limit', '1000');
            if (afterId) url.searchParams.set('after_id', afterId);
            const headers: Record<string, string> = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
            if (direct) headers['anthropic-dangerous-direct-browser-access'] = 'true';
            const response = await fetchImpl(url.toString(), { method: 'GET', headers });
            if (!response.ok) {
                return { ok: false, failure: failureFromStatus(response.status), status: response.status, message: await errorMessage(response) };
            }
            const json = await response.json();
            models.push(...parseAnthropicModels(json));
            if (!json?.has_more || !json?.last_id) break;
            afterId = json.last_id;
        }
        return { ok: true, models: orderCatalog(models), via: direct ? 'direct' : 'proxy' };
    };

    try {
        return await attempt(ANTHROPIC_MODELS_URL, true);
    } catch {
        try {
            return await attempt(`${proxyBase.replace(/\/+$/, '')}/v1/anthropic/models`, false);
        } catch (error) {
            return { ok: false, failure: 'network', message: (error as Error)?.message || 'Failed to fetch' };
        }
    }
}

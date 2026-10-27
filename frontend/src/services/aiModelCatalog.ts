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

/** The fields of a registry entry (AIVersion) the picker split reads. */
export interface PickerEntry {
    id: string;
    version: { deprecated: boolean; source?: 'live' | 'static'; family?: string; rank?: number; unavailable?: boolean };
}

/**
 * The picker's two lists. With a live catalog: the newest model of each family, plus the selection
 * wherever it is (an older or an unavailable model stays in view, flagged by the caller); every
 * other live model is «older»; an unavailable entry that is not selected is not shown. Without
 * one: current entries, and deprecated ones as «older». Registry order is kept in both lists.
 */
export function splitModelList<T extends PickerEntry>(entries: T[], isLive: boolean, selectedId?: string): { main: T[]; older: T[] } {
    if (!isLive) {
        return { main: entries.filter(e => !e.version.deprecated), older: entries.filter(e => e.version.deprecated) };
    }
    const live = entries.filter(e => e.version.source === 'live');
    const heads = newestPerFamily(live.map(e => ({ id: e.id, family: e.version.family, rank: e.version.rank })));
    const main = entries.filter(e => heads.has(e.id) || e.id === selectedId);
    return { main, older: live.filter(e => !main.includes(e)) };
}

/**
 * OpenAI family: `line:tier`. line = gpt | chatgpt | o (o1, o3, o4...); tier = the trailing
 * mini | nano token, else base. A dated snapshot (`-YYYY-MM-DD`) is grouped with its alias.
 * `gpt-5` and `gpt-4.1` are both gpt:base; `gpt-5-mini` is gpt:mini; `o4-mini` is o:mini.
 */
export function openaiFamily(id: string): string {
    const base = id.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const line = base.startsWith('chatgpt-') ? 'chatgpt' : /^o\d/.test(base) ? 'o' : 'gpt';
    const last = base.split('-').pop() ?? '';
    const tier = last === 'mini' || last === 'nano' ? last : 'base';
    return `${line}:${tier}`;
}

const OPENAI_SNAPSHOT = /-\d{4}-\d{2}-\d{2}$/;
/** Models the chat-completions path cannot use (audio, image, search, Responses-only...): data, not code. */
const OPENAI_DENY = /audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct|whisper|dall-e|codex|deep-research|-pro(-|$)/;

/**
 * Gemini family and rank from the id, since the API gives no date:
 * `gemini-<ver>-<tier>[-preview…|-exp…|-NNN|-latest]` → family = tier ('pro', 'flash', 'flash-lite').
 * Rank = version, then stable (3) over preview/exp (2) over a -NNN pin (1) over an alias (0).
 * An id with no version (`gemini-flash-latest`) ranks below every versioned one.
 */
export function geminiFamilyRank(id: string): { family: string; rank: number } {
    const m = /^gemini-(\d+(?:\.\d+)?)-(.+)$/.exec(id);
    const ver = m ? parseFloat(m[1]) : 0;
    let rest = m ? m[2] : id.replace(/^gemini-/, '');
    let stability = 3;
    if (/-latest$/.test(rest)) { rest = rest.replace(/-latest$/, ''); stability = 0; }
    else if (/-(preview|exp)(-.*)?$/.test(rest)) { rest = rest.replace(/-(preview|exp)(-.*)?$/, ''); stability = 2; }
    else if (/-\d{3}$/.test(rest)) { rest = rest.replace(/-\d{3}$/, ''); stability = 1; }
    return { family: rest || 'other', rank: ver * 100 + stability };
}

const GEMINI_DENY = /embedding|aqa|imagen|veo|tts|image|live|audio|robotics|computer-use/;

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

/** OpenAI `GET /v1/models`: `{object:'list', data:[{id, object, created, owned_by}]}`, unpaginated. */
export function parseOpenAIModels(json: any): CatalogModel[] {
    const data: any[] = Array.isArray(json?.data) ? json.data : [];
    return data
        .filter(m => typeof m?.id === 'string' && /^(gpt-|chatgpt-|o\d)/.test(m.id) && !OPENAI_DENY.test(m.id))
        .map(m => {
            const created = (typeof m.created === 'number' ? m.created : 0) * 1000;
            return { id: m.id, label: m.id, family: openaiFamily(m.id), rank: OPENAI_SNAPSHOT.test(m.id) ? created - 1e13 : created };
        });
}

/**
 * Gemini `GET /v1beta/models`: `{models:[{name:'models/<id>', displayName, inputTokenLimit,
 * supportedGenerationMethods}], nextPageToken}`. Only `gemini-` models that generate content.
 */
export function parseGeminiModels(json: any): CatalogModel[] {
    const models: any[] = Array.isArray(json?.models) ? json.models : [];
    return models
        .filter(m => typeof m?.name === 'string' && Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'))
        .map(m => ({ ...m, id: m.name.replace(/^models\//, '') }))
        .filter(m => m.id.startsWith('gemini-') && !GEMINI_DENY.test(m.id))
        .map(m => ({
            id: m.id,
            label: typeof m.displayName === 'string' && m.displayName ? m.displayName : m.id,
            ...geminiFamilyRank(m.id),
            ...(typeof m.inputTokenLimit === 'number' ? { contextWindow: m.inputTokenLimit } : {}),
        }));
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

// ── Fetch ───────────────────────────────────────────────────────────────────

export function failureFromStatus(status: number, message: string = ''): CatalogFailure {
    if (status === 401 || status === 403) return 'auth';
    // Gemini answers a bad key with 400 API_KEY_INVALID («API key not valid»).
    if (status === 400 && /api[ _]?key/i.test(message)) return 'auth';
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

interface CatalogSource {
    /** Direct endpoint, and the Worker route under the proxy base (none for OpenAI). */
    directUrl: string;
    proxyPath?: string;
    headers: (apiKey: string, direct: boolean) => Record<string, string>;
    /** Query params of the first page, and of the page after `json` (null when it is the last). */
    firstPage: Record<string, string>;
    nextPage: (json: any) => Record<string, string> | null;
    parse: (json: any) => CatalogModel[];
}

const SOURCES: Record<CatalogProvider, CatalogSource> = {
    Claude: {
        directUrl: 'https://api.anthropic.com/v1/models',
        proxyPath: '/v1/anthropic/models',
        // The browser-access header only on the direct call: the Worker does not allow it.
        headers: (apiKey, direct) => ({ 'x-api-key': apiKey, 'anthropic-version': '2023-06-01',
            ...(direct ? { 'anthropic-dangerous-direct-browser-access': 'true' } : {}) }),
        firstPage: { limit: '1000' },
        nextPage: json => (json?.has_more && json?.last_id ? { limit: '1000', after_id: json.last_id } : null),
        parse: parseAnthropicModels,
    },
    GPT: {
        directUrl: 'https://api.openai.com/v1/models',
        headers: apiKey => ({ Authorization: `Bearer ${apiKey}` }),
        firstPage: {},
        nextPage: () => null,
        parse: parseOpenAIModels,
    },
    Gemini: {
        directUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        proxyPath: '/v1/gemini/models',
        headers: apiKey => ({ 'x-goog-api-key': apiKey }),
        firstPage: { pageSize: '1000' },
        nextPage: json => (json?.nextPageToken ? { pageSize: '1000', pageToken: json.nextPageToken } : null),
        parse: parseGeminiModels,
    },
};

const MAX_PAGES = 10;

/**
 * All the models `apiKey` can use on `provider`. Direct call first; on a network or CORS failure
 * (fetch rejects) the same request goes through the Worker route `<proxyBase><proxyPath>` when the
 * provider has one. An HTTP error is an answer, not a reason to fall back.
 */
export async function fetchCatalog(provider: CatalogProvider, apiKey: string, proxyBase: string, fetchImpl: typeof fetch = fetch): Promise<CatalogFetchResult> {
    const source = SOURCES[provider];
    const attempt = async (base: string, direct: boolean): Promise<CatalogFetchResult> => {
        const models: CatalogModel[] = [];
        let params: Record<string, string> | null = source.firstPage;
        for (let page = 0; page < MAX_PAGES && params; page++) {
            const url = new URL(base);
            for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
            const response = await fetchImpl(url.toString(), { method: 'GET', headers: source.headers(apiKey, direct) });
            if (!response.ok) {
                const message = await errorMessage(response);
                return { ok: false, failure: failureFromStatus(response.status, message), status: response.status, message };
            }
            const json = await response.json();
            models.push(...source.parse(json));
            params = source.nextPage(json);
        }
        return { ok: true, models: orderCatalog(models), via: direct ? 'direct' : 'proxy' };
    };

    try {
        return await attempt(source.directUrl, true);
    } catch (error) {
        if (!source.proxyPath) return { ok: false, failure: 'network', message: (error as Error)?.message || 'Failed to fetch' };
        try {
            return await attempt(`${proxyBase.replace(/\/+$/, '')}${source.proxyPath}`, false);
        } catch (error2) {
            return { ok: false, failure: 'network', message: (error2 as Error)?.message || 'Failed to fetch' };
        }
    }
}

/** Anthropic's catalog: `fetchCatalog('Claude', ...)`. */
export function fetchAnthropicCatalog(apiKey: string, proxyBase: string, fetchImpl: typeof fetch = fetch): Promise<CatalogFetchResult> {
    return fetchCatalog('Claude', apiKey, proxyBase, fetchImpl);
}

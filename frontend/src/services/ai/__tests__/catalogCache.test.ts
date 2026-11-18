/**
 * #196 L1: the live catalog cache (spec §5, §6): `jjodel_models_<provider>`, 24 h TTL, keyed to
 * the FNV-1a hash of the API key, refreshed by a direct call to the provider's models endpoint.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIEvents } from '../../../events/registry';
import {
    CATALOG_TTL_MS, cachedModels, catalogStorageKey, hashKey, needsRefresh, refreshCatalog, refreshIfStale, writeCatalog,
} from '../catalog/catalogCache';
import { ProviderConfigStore } from '../config/ProviderConfigStore';
import { registry } from '../registry';
import { AIModel, ECapabilities } from '../types';

/** Shape of Anthropic `GET /v1/models` (documented; not a recorded response). */
const ANTHROPIC_PAGE = {
    data: [
        { type: 'model', id: 'claude-opus-4-7',           display_name: 'Claude Opus 4.7',   created_at: '2026-04-16T00:00:00Z' },
        { type: 'model', id: 'claude-sonnet-4-6',         display_name: 'Claude Sonnet 4.6', created_at: '2026-02-17T00:00:00Z' },
        { type: 'model', id: 'claude-haiku-4-5-20251001', display_name: 'Claude Haiku 4.5',  created_at: '2025-10-01T00:00:00Z' },
    ],
    has_more: false, first_id: 'claude-opus-4-7', last_id: 'claude-haiku-4-5-20251001',
};

function mockFetch(body: unknown) {
    const calls: string[] = [];
    const fn = (async (input: any) => {
        calls.push(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
        return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    return { fn, calls };
}

let storage: Map<string, string>;
let dispatched: CustomEvent[];
let globalFetch: ReturnType<typeof vi.fn>;
beforeEach(() => {
    storage = new Map<string, string>();
    dispatched = [];
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: (e: CustomEvent) => { dispatched.push(e); return true; } });
    globalFetch = vi.fn(() => Promise.reject(new Error('global fetch must not be used')));
    vi.stubGlobal('fetch', globalFetch);
});
afterEach(() => vi.unstubAllGlobals());

const T0 = 1_800_000_000_000;
const MODELS = [new AIModel('claude-opus-4-7', 'Claude Opus 4.7'), new AIModel('claude-x-1', 'Claude X')];

describe('cache key and hash', () => {
    it('stores under jjodel_models_<provider lowercase> with the FNV-1a hash of today', () => {
        expect(catalogStorageKey('Claude')).toBe('jjodel_models_claude');
        expect(catalogStorageKey('GPT')).toBe('jjodel_models_gpt');
        // Same values as services/aiModelCatalog.ts hashKey: FNV-1a 32 bit, 8 hex digits.
        expect(hashKey('')).toBe('811c9dc5');
        expect(hashKey('a')).toBe('e40c292c');
    });

    it('reads an entry written in the format of aiModelCatalog.ts, in stored order, with table capabilities', () => {
        storage.set('jjodel_models_claude', JSON.stringify({
            fetchedAt: T0, keyHash: hashKey('sk-ant-1'),
            models: [{ id: 'claude-opus-4-7', label: 'Claude Opus 4.7', family: 'opus', rank: 2, contextWindow: 1_000_000 }, { id: 'claude-x-1', label: 'Claude X', family: 'x', rank: 1 }],
        }));
        const models = cachedModels('Claude', 'sk-ant-1')!;
        expect(models.map(m => m.apiName)).toEqual(['claude-opus-4-7', 'claude-x-1']);
        expect(models[0].contextWindow).toBe(1_000_000);
        expect(models[1].capabilities).toEqual([ECapabilities.IMAGES, ECapabilities.DOCUMENTS]);
    });
});

describe('TTL and key hash', () => {
    it('a fresh entry for the same key is a hit and needs no refresh', () => {
        writeCatalog('Claude', 'sk-ant-1', MODELS, T0);
        expect(cachedModels('Claude', 'sk-ant-1')?.map(m => m.apiName)).toEqual(['claude-opus-4-7', 'claude-x-1']);
        expect(needsRefresh('Claude', 'sk-ant-1', T0 + CATALOG_TTL_MS - 1)).toBe(false);
    });

    it('expires after 24 h: refresh needed, the stale list still served', () => {
        writeCatalog('Claude', 'sk-ant-1', MODELS, T0);
        expect(CATALOG_TTL_MS).toBe(24 * 60 * 60 * 1000);
        expect(needsRefresh('Claude', 'sk-ant-1', T0 + CATALOG_TTL_MS)).toBe(true);
        expect(cachedModels('Claude', 'sk-ant-1')).not.toBeNull();
    });

    it('a key change invalidates the entry', () => {
        writeCatalog('Claude', 'sk-ant-1', MODELS, T0);
        expect(cachedModels('Claude', 'sk-ant-2')).toBeNull();
        expect(needsRefresh('Claude', 'sk-ant-2', T0)).toBe(true);
    });

    it('no key: nothing cached, nothing to refresh', () => {
        writeCatalog('Claude', 'sk-ant-1', MODELS, T0);
        expect(cachedModels('Claude', '')).toBeNull();
        expect(needsRefresh('Claude', undefined, T0)).toBe(false);
    });

    it('a cached list reaches the provider built by the registry, only for its key', () => {
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-1' });
        writeCatalog('Claude', 'sk-ant-1', MODELS, T0);
        expect(registry.get('Claude').models().map(m => m.apiName)).toContain('claude-x-1');
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-2' });
        expect(registry.get('Claude').models().map(m => m.apiName)).not.toContain('claude-x-1');
    });
});

describe('refresh', () => {
    it('calls the provider models endpoint directly, caches the list, fires MODELS_UPDATED { provider }, never a proxy', async () => {
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-1' });
        dispatched = [];
        const mock = mockFetch(ANTHROPIC_PAGE);
        const models = await refreshCatalog(registry.get('Claude', { fetch: mock.fn }), T0);
        expect(models.map(m => m.apiName)).toEqual(['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
        expect(mock.calls.length).toBeGreaterThan(0);
        for (const url of mock.calls) expect(new URL(url).host).toBe('api.anthropic.com');
        expect(mock.calls.some(u => /workers\.dev|proxy/i.test(u))).toBe(false);
        expect(globalFetch).not.toHaveBeenCalled();
        const entry = JSON.parse(storage.get('jjodel_models_claude')!);
        expect(entry.fetchedAt).toBe(T0);
        expect(entry.keyHash).toBe(hashKey('sk-ant-1'));
        expect(entry.models.map((m: { id: string }) => m.id)).toEqual(['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].type).toBe(AIEvents.MODELS_UPDATED);
        expect(dispatched[0].detail).toEqual({ provider: 'Claude' });
    });

    it('an empty list is neither cached nor announced', async () => {
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-1' });
        dispatched = [];
        await refreshCatalog(registry.get('Claude', { fetch: mockFetch({ data: [], has_more: false }).fn }), T0);
        expect(storage.has('jjodel_models_claude')).toBe(false);
        expect(dispatched).toHaveLength(0);
    });

    it('refreshIfStale fetches only when needed, and never for a provider without a catalog', async () => {
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-1' });
        ProviderConfigStore.save('Mistral', { apiKey: 'm-1' });
        const mock = mockFetch(ANTHROPIC_PAGE);
        expect(await refreshIfStale(registry.get('Claude', { fetch: mock.fn }), false, T0)).not.toBeNull();
        const calls = mock.calls.length;
        expect(await refreshIfStale(registry.get('Claude', { fetch: mock.fn }), false, T0 + 1000)).toBeNull();
        expect(mock.calls.length).toBe(calls);
        expect(await refreshIfStale(registry.get('Mistral', { fetch: mock.fn }), true, T0)).toBeNull();
        expect(mock.calls.length).toBe(calls);
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    CATALOG_TTL_MS, capabilitiesFor, catalogStorageKey, claudeFamily, fetchAnthropicCatalog, hashKey,
    needsRefresh, newestPerFamily, orderCatalog, parseAnthropicModels, splitModelList, writeCatalogCache,
} from '../aiModelCatalog';

vi.mock('../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));
vi.mock('../PromptService', () => ({
    PromptService: { getRendered: () => 'Test system prompt' },
}));

/** Shape of Anthropic `GET /v1/models` (documented; not a recorded response). */
const ANTHROPIC_PAGE = {
    data: [
        { type: 'model', id: 'claude-opus-4-7',            display_name: 'Claude Opus 4.7',   created_at: '2026-04-16T00:00:00Z' },
        { type: 'model', id: 'claude-sonnet-4-6',          display_name: 'Claude Sonnet 4.6', created_at: '2026-02-17T00:00:00Z' },
        { type: 'model', id: 'claude-opus-4-6',            display_name: 'Claude Opus 4.6',   created_at: '2026-02-05T00:00:00Z' },
        { type: 'model', id: 'claude-haiku-4-5-20251001',  display_name: 'Claude Haiku 4.5',  created_at: '2025-10-01T00:00:00Z' },
        { type: 'model', id: 'claude-sonnet-4-5-20250929', display_name: 'Claude Sonnet 4.5', created_at: '2025-09-29T00:00:00Z' },
        { type: 'model', id: 'claude-3-5-sonnet-20241022', display_name: 'Claude Sonnet 3.5', created_at: '2024-10-22T00:00:00Z' },
        { type: 'model', id: 'claude-3-haiku-20240307',    display_name: 'Claude Haiku 3',    created_at: '2024-03-07T00:00:00Z' },
    ],
    has_more: false, first_id: 'claude-opus-4-7', last_id: 'claude-3-haiku-20240307',
};

const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) }) as unknown as Response;
const fail = (status: number, message = 'nope') =>
    ({ ok: false, status, json: async () => ({}), text: async () => JSON.stringify({ type: 'error', error: { message } }) }) as unknown as Response;

let storage: Map<string, string>;
beforeEach(() => {
    vi.resetModules();
    storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
    });
});
afterEach(() => vi.unstubAllGlobals());

describe('family and newest rule', () => {
    it('takes the first all-letter token after claude- as the family, in both id styles', () => {
        expect(claudeFamily('claude-opus-4-7')).toBe('opus');
        expect(claudeFamily('claude-3-5-sonnet-20241022')).toBe('sonnet');
        expect(claudeFamily('claude-haiku-4-5-20251001')).toBe('haiku');
        expect(claudeFamily('claude-mythos-1')).toBe('mythos');
        expect(claudeFamily('gpt-4o')).toBe('other');
    });

    it('keeps the newest per family by created_at, and puts the newest overall first', () => {
        const models = orderCatalog(parseAnthropicModels(ANTHROPIC_PAGE));
        expect([...newestPerFamily(models)].sort()).toEqual(['claude-haiku-4-5-20251001', 'claude-opus-4-7', 'claude-sonnet-4-6']);
        expect(models.map(m => m.id).slice(0, 3)).toEqual(['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
        expect(models[0].label).toBe('Claude Opus 4.7');
        expect(models).toHaveLength(7);
    });

    it('a new generation heads its family with no code change', () => {
        const page = { data: [...ANTHROPIC_PAGE.data, { id: 'claude-opus-5', display_name: 'Claude Opus 5', created_at: '2026-10-01T00:00:00Z' }] };
        expect(newestPerFamily(parseAnthropicModels(page)).has('claude-opus-5')).toBe(true);
    });
});

describe('capabilities and cache', () => {
    it('reads pdf/vision from the longest prefix, conservative when unknown', () => {
        expect(capabilitiesFor('claude-opus-9')).toEqual({ pdf: true, vision: true, contextWindow: 200_000 });
        expect(capabilitiesFor('claude-3-haiku-20240307').pdf).toBe(false);
        expect(capabilitiesFor('mystery-model')).toEqual({ pdf: false, vision: false });
    });

    it('refreshes when missing, for another key or past 24 h; never without a key', () => {
        const now = 1_000_000_000_000;
        expect(needsRefresh('Claude', 'sk-ant-a', now)).toBe(true);
        writeCatalogCache('Claude', 'sk-ant-a', parseAnthropicModels(ANTHROPIC_PAGE), now);
        expect(storage.has(catalogStorageKey('Claude'))).toBe(true);
        expect(storage.get(catalogStorageKey('Claude'))).not.toContain('sk-ant-a');
        expect(needsRefresh('Claude', 'sk-ant-a', now + CATALOG_TTL_MS - 1)).toBe(false);
        expect(needsRefresh('Claude', 'sk-ant-a', now + CATALOG_TTL_MS)).toBe(true);
        expect(needsRefresh('Claude', 'sk-ant-b', now)).toBe(true);
        expect(needsRefresh('Claude', undefined, now)).toBe(false);
        expect(hashKey('sk-ant-a')).not.toBe(hashKey('sk-ant-b'));
    });
});

describe('fetchAnthropicCatalog: direct first, the Worker only on a network or CORS failure', () => {
    it('calls Anthropic directly with the browser-access header and follows pages', async () => {
        const f = vi.fn()
            .mockResolvedValueOnce(ok({ data: ANTHROPIC_PAGE.data.slice(0, 3), has_more: true, last_id: 'claude-opus-4-6' }))
            .mockResolvedValueOnce(ok({ data: ANTHROPIC_PAGE.data.slice(3), has_more: false, last_id: 'x' }));
        const r = await fetchAnthropicCatalog('sk-ant-k', 'https://proxy.example', f);
        expect(r).toMatchObject({ ok: true, via: 'direct' });
        expect(r.ok && r.models).toHaveLength(7);
        expect(f.mock.calls[0][0]).toBe('https://api.anthropic.com/v1/models?limit=1000');
        expect(f.mock.calls[1][0]).toBe('https://api.anthropic.com/v1/models?limit=1000&after_id=claude-opus-4-6');
        expect(f.mock.calls[0][1].headers).toMatchObject({ 'x-api-key': 'sk-ant-k', 'anthropic-dangerous-direct-browser-access': 'true' });
    });

    it('falls back to the Worker route, without the browser-access header, when the direct call rejects', async () => {
        const f = vi.fn().mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce(ok(ANTHROPIC_PAGE));
        const r = await fetchAnthropicCatalog('sk-ant-k', 'https://proxy.example/', f);
        expect(r).toMatchObject({ ok: true, via: 'proxy' });
        expect(f.mock.calls[1][0]).toBe('https://proxy.example/v1/anthropic/models?limit=1000');
        expect(f.mock.calls[1][1].headers).not.toHaveProperty('anthropic-dangerous-direct-browser-access');
    });

    it('does not fall back on an HTTP error, and classifies it', async () => {
        for (const [status, failure] of [[401, 'auth'], [403, 'auth'], [429, 'rate'], [500, 'server'], [404, 'other']] as const) {
            const f = vi.fn().mockResolvedValueOnce(fail(status));
            const r = await fetchAnthropicCatalog('sk-ant-k', 'https://proxy.example', f);
            expect(r).toMatchObject({ ok: false, failure, status });
            expect(f).toHaveBeenCalledTimes(1);
        }
    });

    it('reports network when both the direct call and the Worker reject', async () => {
        const f = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
        expect(await fetchAnthropicCatalog('sk-ant-k', 'https://proxy.example', f)).toMatchObject({ ok: false, failure: 'network' });
        expect(f).toHaveBeenCalledTimes(2);
    });
});

describe('the registry with a live catalog (types/jodie.ts)', () => {
    const CLAUDE_KEY = 'jjodie_provider_claude';

    function seedConfig(apiKey: string, model: string) {
        storage.set(CLAUDE_KEY, JSON.stringify({ name: 'Claude', apiKey, model, enabled: true }));
    }

    it('merges the cached catalog at module load: live models first, a missing static model kept and flagged', async () => {
        seedConfig('sk-ant-a', 'claude-3-opus-latest');
        writeCatalogCache('Claude', 'sk-ant-a', orderCatalog(parseAnthropicModels(ANTHROPIC_PAGE)));
        const { AI, hasLiveCatalog } = await import('../../types/jodie');
        expect(AI.Claude.storageKey).toBe(CLAUDE_KEY); // positive control: the key seeded is the key read
        expect(hasLiveCatalog('Claude')).toBe(true);
        expect(Object.keys(AI.Claude.versions)[0]).toBe('claude-opus-4-7');
        expect(AI.Claude.versions['claude-opus-4-7']).toMatchObject({ source: 'live', family: 'opus', deprecated: false });
        expect(AI.Claude.versions['claude-opus-4-7'].unavailable).toBeUndefined();
        expect(AI.Claude.versions['claude-sonnet-4-5-20250929'].capabilities).toEqual({ pdf: true, vision: true });
        expect(AI.Claude.versions['claude-3-opus-latest']).toMatchObject({ source: 'static', unavailable: true });
    });

    it('keeps the static list when the cache belongs to another key', async () => {
        seedConfig('sk-ant-b', 'claude-opus-4-7');
        writeCatalogCache('Claude', 'sk-ant-a', parseAnthropicModels(ANTHROPIC_PAGE));
        const { AI, hasLiveCatalog } = await import('../../types/jodie');
        expect(hasLiveCatalog('Claude')).toBe(false);
        expect(AI.Claude.versions['claude-3-opus-latest'].unavailable).toBeUndefined();
    });

    it('calls a saved model the catalog no longer lists unchanged: flagged, never swapped', async () => {
        seedConfig('sk-ant-a', 'claude-3-opus-latest');
        writeCatalogCache('Claude', 'sk-ant-a', parseAnthropicModels(ANTHROPIC_PAGE));
        await import('../../types/jodie');
        const { AIProviderService } = await import('../AIProviderService');
        expect(AIProviderService.effectiveModel('Claude')).toBe('claude-3-opus-latest');
        expect(JSON.parse(storage.get(CLAUDE_KEY)!).model).toBe('claude-3-opus-latest');
    });
});

describe('testConnection for Claude lists the models, with no fixed model id', () => {
    async function load(model: string) {
        storage.set('jjodie_provider_claude', JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-a', model, enabled: true }));
        const jodie = await import('../../types/jodie');
        const { AIProviderService } = await import('../AIProviderService');
        return { ...jodie, AIProviderService };
    }

    it('passes on a model list, caches it and merges it', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(ANTHROPIC_PAGE)));
        const { AI, AIProviderService, hasLiveCatalog } = await load('claude-opus-4-7');
        expect(hasLiveCatalog('Claude')).toBe(false);
        expect(await AIProviderService.testConnection('Claude')).toEqual({ success: true });
        const [url, init] = vi.mocked(fetch).mock.calls[0];
        expect(url).toBe('https://api.anthropic.com/v1/models?limit=1000');
        expect((init as RequestInit).method).toBe('GET');
        expect(hasLiveCatalog('Claude')).toBe(true);
        expect(Object.keys(AI.Claude.versions)[0]).toBe('claude-opus-4-7');
        expect(storage.has('jjodel_models_claude')).toBe(true);
    });

    it('passes with a warning when the selected model is not offered to the key', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(ANTHROPIC_PAGE)));
        const { AIProviderService } = await load('claude-3-opus-latest');
        const r = await AIProviderService.testConnection('Claude');
        expect(r.success).toBe(true);
        expect(r.warning).toContain('"claude-3-opus-latest"');
    });

    it('fails as auth on 401, as rate on 429, as network when nothing answers', async () => {
        const { AIProviderService, hasLiveCatalog } = await load('claude-opus-4-7');
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(401)));
        expect(await AIProviderService.testConnection('Claude')).toMatchObject({ success: false, failure: 'auth', error: expect.stringContaining('Invalid API key') });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fail(429)));
        expect(await AIProviderService.testConnection('Claude')).toMatchObject({ success: false, failure: 'rate' });
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
        expect(await AIProviderService.testConnection('Claude')).toMatchObject({ success: false, failure: 'network', error: expect.stringContaining('api.anthropic.com') });
        expect(hasLiveCatalog('Claude')).toBe(false);
    });

    it('refreshModels skips a fresh cache for the same key and refetches for a new one', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok(ANTHROPIC_PAGE)));
        const { AIProviderService } = await load('claude-opus-4-7');
        expect(await AIProviderService.refreshModels('Claude')).toMatchObject({ ok: true });
        expect(await AIProviderService.refreshModels('Claude')).toBeNull();
        storage.set('jjodie_provider_claude', JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-new', model: 'claude-opus-4-7' }));
        expect(await AIProviderService.refreshModels('Claude')).toMatchObject({ ok: true });
        expect(fetch).toHaveBeenCalledTimes(2);
        expect(await AIProviderService.refreshModels('GPT')).toBeNull();
    });
});

describe('splitModelList: what the model picker shows (ProviderModelSelector)', () => {
    async function liveEntries() {
        storage.set('jjodie_provider_claude', JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-a', model: 'claude-opus-4-7' }));
        writeCatalogCache('Claude', 'sk-ant-a', orderCatalog(parseAnthropicModels(ANTHROPIC_PAGE)));
        const { AI } = await import('../../types/jodie');
        return Object.keys(AI.Claude.versions).map(id => ({ id, version: AI.Claude.versions[id] }));
    }

    it('shows the newest of each family by default, every other live model as older, no unavailable entry', async () => {
        const { main, older } = splitModelList(await liveEntries(), true, 'claude-opus-4-7');
        expect(main.map(e => e.id)).toEqual(['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001']);
        expect(older.map(e => e.id)).toEqual(['claude-opus-4-6', 'claude-sonnet-4-5-20250929', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307']);
        expect([...main, ...older].some(e => e.version.unavailable)).toBe(false);
    });

    it('keeps the selection in view: an older model leaves the older list, an unavailable one shows flagged', async () => {
        const entries = await liveEntries();
        const a = splitModelList(entries, true, 'claude-opus-4-6');
        expect(a.main.map(e => e.id)).toContain('claude-opus-4-6');
        expect(a.older.map(e => e.id)).not.toContain('claude-opus-4-6');
        const b = splitModelList(entries, true, 'claude-3-opus-latest');
        expect(b.main.find(e => e.id === 'claude-3-opus-latest')?.version.unavailable).toBe(true);
    });

    it('without a live catalog splits on deprecated, as before', async () => {
        const { AI } = await import('../../types/jodie');
        const entries = Object.keys(AI.Claude.versions).map(id => ({ id, version: AI.Claude.versions[id] }));
        const { main, older } = splitModelList(entries, false);
        expect(main.every(e => !e.version.deprecated)).toBe(true);
        expect(older.map(e => e.id)).toEqual(Object.keys(AI.Claude.versions).filter(id => AI.Claude.versions[id].deprecated));
        expect(older.length).toBeGreaterThan(0);
    });
});

describe('Settings: which failed test disables the provider', () => {
    it('disables on a rejected key or an unclassified failure, never on rate, network or server', async () => {
        const { AIProviderService } = await import('../AIProviderService');
        const d = (r: Parameters<typeof AIProviderService.failureDisablesProvider>[0]) => AIProviderService.failureDisablesProvider(r);
        expect(d({ success: false, failure: 'auth' })).toBe(true);
        expect(d({ success: false })).toBe(true);
        expect(d({ success: false, failure: 'rate' })).toBe(false);
        expect(d({ success: false, failure: 'network' })).toBe(false);
        expect(d({ success: false, failure: 'server' })).toBe(false);
        expect(d({ success: true, warning: 'x' })).toBe(false);
    });
});

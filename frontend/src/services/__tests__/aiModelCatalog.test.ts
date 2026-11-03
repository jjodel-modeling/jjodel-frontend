import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { capabilitiesFor, catalogStorageKey, hashKey } from '../aiModelCatalog';
import type { CatalogModel } from '../aiModelCatalog';

vi.mock('../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));
vi.mock('../PromptService', () => ({
    PromptService: { getRendered: () => 'Test system prompt' },
}));

/** A Claude catalog as the cache stores it: the newest of each family first, then the rest by created_at. */
const CLAUDE_MODELS: CatalogModel[] = [
    { id: 'claude-opus-4-7',            label: 'Claude Opus 4.7',   family: 'opus',   rank: Date.parse('2026-04-16T00:00:00Z') },
    { id: 'claude-sonnet-4-6',          label: 'Claude Sonnet 4.6', family: 'sonnet', rank: Date.parse('2026-02-17T00:00:00Z') },
    { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5',  family: 'haiku',  rank: Date.parse('2025-10-01T00:00:00Z') },
    { id: 'claude-opus-4-6',            label: 'Claude Opus 4.6',   family: 'opus',   rank: Date.parse('2026-02-05T00:00:00Z') },
    { id: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', family: 'sonnet', rank: Date.parse('2025-09-29T00:00:00Z') },
    { id: 'claude-3-5-sonnet-20241022', label: 'Claude Sonnet 3.5', family: 'sonnet', rank: Date.parse('2024-10-22T00:00:00Z') },
    { id: 'claude-3-haiku-20240307',    label: 'Claude Haiku 3',    family: 'haiku',  rank: Date.parse('2024-03-07T00:00:00Z') },
];

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

/** Store `models` as the Claude cache entry for `apiKey`. */
function seedCatalog(apiKey: string, models: CatalogModel[] = CLAUDE_MODELS) {
    storage.set(catalogStorageKey('Claude'), JSON.stringify({ fetchedAt: Date.now(), keyHash: hashKey(apiKey), models }));
}

describe('capabilities', () => {
    it('reads pdf/vision from the longest prefix, conservative when unknown', () => {
        expect(capabilitiesFor('claude-opus-9')).toEqual({ pdf: true, vision: true, contextWindow: 200_000 });
        expect(capabilitiesFor('claude-3-haiku-20240307').pdf).toBe(false);
        expect(capabilitiesFor('mystery-model')).toEqual({ pdf: false, vision: false });
    });
});

describe('the registry with a live catalog (types/jodie.ts)', () => {
    const CLAUDE_KEY = 'jjodie_provider_claude';

    function seedConfig(apiKey: string, model: string) {
        storage.set(CLAUDE_KEY, JSON.stringify({ name: 'Claude', apiKey, model, enabled: true }));
    }

    it('merges the cached catalog at module load: live models first, a missing static model kept and flagged', async () => {
        seedConfig('sk-ant-a', 'claude-3-opus-latest');
        seedCatalog('sk-ant-a');
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
        seedCatalog('sk-ant-a');
        const { AI, hasLiveCatalog } = await import('../../types/jodie');
        expect(hasLiveCatalog('Claude')).toBe(false);
        expect(AI.Claude.versions['claude-3-opus-latest'].unavailable).toBeUndefined();
    });

    it('calls a saved model the catalog no longer lists unchanged: flagged, never swapped', async () => {
        seedConfig('sk-ant-a', 'claude-3-opus-latest');
        seedCatalog('sk-ant-a');
        await import('../../types/jodie');
        const { registry } = await import('../ai');
        expect(registry.get('Claude').resolveModel()).toBe('claude-3-opus-latest');
        expect(JSON.parse(storage.get(CLAUDE_KEY)!).model).toBe('claude-3-opus-latest');
    });
});

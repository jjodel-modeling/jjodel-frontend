/**
 * #196 L1: the registry against today's registry in types/jodie.ts, compared by value: providers
 * and families, seed lists, legacy map, endpoints, and the answers the migrations rely on
 * (`resolveLegacyModelId`, `resolveCurrentModelId`, `isForeignModel`). Then `enabled()` following
 * the stores.
 *
 * It imports `types/jodie.ts`, which no file of `src/services/ai/` outside `__tests__/` may do: the
 * comparison is deleted with that file at L6 (spec §7).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProviderConfigStore } from '../config/ProviderConfigStore';
import { PROVIDER_IDS, PROVIDER_SPECS, claudeLegacyIdMap, modelDirectory, registry } from '../registry';
import { EAuthScheme, ECapabilities } from '../types';

vi.mock('../../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));

let storage: Map<string, string>;
beforeEach(() => {
    vi.resetModules();
    storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: () => true });
});
afterEach(() => vi.unstubAllGlobals());

const today = () => import('../../../types/jodie');

const FAMILIES = {
    Claude: 'anthropic', GPT: 'openai', DeepSeek: 'openai', Gemini: 'google', Mistral: 'openai',
    Groq: 'openai', Ollama: 'openai', Kimi: 'openai', Custom: 'openai',
} as const;

describe('providers', () => {
    it('lists every routed provider of today, in today\'s order, each with its family', async () => {
        const { ALL_AI_PROVIDERS } = await today();
        expect(PROVIDER_IDS).toEqual(ALL_AI_PROVIDERS.filter(p => p !== 'Llama' && p !== 'Copilot'));
        expect(registry.all().map(p => [p.name, p.family])).toEqual(PROVIDER_IDS.map(id => [id, FAMILIES[id]]));
    });

    it('keeps today\'s company, endpoint, auth scheme and key requirement', async () => {
        const { AI } = await today();
        const scheme = { 'bearer': EAuthScheme.BEARER, 'x-api-key': EAuthScheme.X_API_KEY, 'query-key': EAuthScheme.QUERY_KEY, 'none': EAuthScheme.NONE };
        for (const id of PROVIDER_IDS) {
            const spec = PROVIDER_SPECS[id];
            expect([id, spec.company]).toEqual([id, AI[id].company]);
            expect([id, spec.baseUrl]).toEqual([id, AI[id].endpoint ?? '']);
            expect([id, spec.authScheme]).toEqual([id, scheme[AI[id].authScheme]]);
            expect([id, spec.requiresKey]).toEqual([id, AI[id].requiresKey]);
        }
        expect(PROVIDER_IDS.filter(id => PROVIDER_SPECS[id].userBaseUrl)).toEqual(['Ollama', 'Custom']);
    });
});

describe('seeds and legacy ids', () => {
    it('every seed list matches today\'s .add(...) list by value: id, label, pdf, vision, context window, order', async () => {
        const { AI } = await today();
        for (const id of PROVIDER_IDS) {
            const versions = AI[id].staticVersions ?? AI[id].versions;
            const expected = Object.entries(versions).map(([k, v]) => [k, v.label, v.capabilities.pdf, v.capabilities.vision, v.contextWindow]);
            const actual = PROVIDER_SPECS[id].seedModels.map(m =>
                [m.apiName, m.displayName, m.has(ECapabilities.DOCUMENTS), m.has(ECapabilities.IMAGES), m.contextWindow]);
            expect([id, actual]).toEqual([id, expected]);
        }
    });

    it('the Claude legacy map matches today\'s, and only Claude has one', async () => {
        const jodie = await today();
        expect(claudeLegacyIdMap).toEqual(jodie.claudeLegacyIdMap);
        expect(PROVIDER_IDS.filter(id => PROVIDER_SPECS[id].legacyIds)).toEqual(['Claude']);
    });

    it('legacy, current and foreign answers match today\'s functions for every provider and every known id', async () => {
        const { ALL_AI_PROVIDERS, AI, resolveLegacyModelId, resolveCurrentModelId, isForeignModel } = await today();
        const ids = new Set<string | undefined>([undefined, '', 'not-a-model', ...Object.keys(claudeLegacyIdMap)]);
        for (const p of ALL_AI_PROVIDERS) for (const id of Object.keys(AI[p].versions)) ids.add(id);
        const providers: string[] = [...ALL_AI_PROVIDERS, 'NotAProvider'];
        let compared = 0;
        for (const p of providers) {
            for (const id of ids) {
                const where = `${p} / ${id}`;
                expect([where, modelDirectory.legacy(p, id)]).toEqual([where, resolveLegacyModelId(p as never, id)]);
                expect([where, modelDirectory.current(p, id)]).toEqual([where, resolveCurrentModelId(p as never, id)]);
                expect([where, modelDirectory.isForeign(p, id)]).toEqual([where, isForeignModel(p as never, id)]);
                compared++;
            }
        }
        // Positive control: the comparison ran over the full grid, and both answers occur.
        expect(compared).toBe(providers.length * ids.size);
        expect(modelDirectory.isForeign('Claude', 'gpt-4o')).toBe(true);
        expect(modelDirectory.current('Gemini', 'gemini-pro')).toBe('gemini-3.7-flash');
    });
});

describe('configured instances', () => {
    it('builds a provider from its stored settings; with none, the first seed is its model', () => {
        ProviderConfigStore.save('GPT', { apiKey: 'sk-1', model: 'gpt-4' });
        const gpt = registry.get('GPT');
        expect(gpt.apiKey).toBe('sk-1');
        expect(gpt.resolveModel()).toBe('gpt-4');
        expect(registry.get('Claude').resolveModel()).toBe('claude-opus-4-7');
    });

    it('enabled() follows the stores: keyed by a key, Ollama by a Base URL, Custom by either', () => {
        expect(registry.enabled()).toEqual([]);
        ProviderConfigStore.save('Gemini', { apiKey: 'AIza1' });
        ProviderConfigStore.save('Ollama', { apiKey: 'ignored' });
        ProviderConfigStore.save('Mistral', { baseUrl: 'http://ignored' });
        expect(registry.enabled().map(p => p.name)).toEqual(['Gemini']);
        ProviderConfigStore.save('Ollama', { baseUrl: 'http://localhost:11434' });
        ProviderConfigStore.save('Custom', { baseUrl: 'https://openrouter.ai/api/v1' });
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-1' });
        expect(registry.enabled().map(p => p.name)).toEqual(['Claude', 'Gemini', 'Ollama', 'Custom']);
        ProviderConfigStore.save('Claude', { apiKey: '' });
        expect(registry.enabled().map(p => p.name)).toEqual(['Gemini', 'Ollama', 'Custom']);
    });

    it('enabled() agrees with today\'s JodieConfig.getEnabledProviders on the same storage', async () => {
        storage.set('jjodie_provider_groq', JSON.stringify({ name: 'Groq', apiKey: 'gsk_1', model: 'groq/compound' }));
        storage.set('jjodie_provider_ollama', JSON.stringify({ name: 'Ollama', baseUrl: 'http://localhost:11434', model: 'llama3.2' }));
        storage.set('jjodie_provider_custom', JSON.stringify({ name: 'Custom', apiKey: 'k' }));
        const { JodieConfig } = await today();
        expect(registry.enabled().map(p => p.name)).toEqual(JodieConfig.getEnabledProviders());
        expect(JodieConfig.getEnabledProviders()).toEqual(['Groq', 'Ollama', 'Custom']);
    });
});

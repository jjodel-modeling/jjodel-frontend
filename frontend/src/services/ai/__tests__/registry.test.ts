/**
 * #196 L1: the registry against the registry of types/jodie.ts, compared by value: providers and
 * families, seed lists, legacy map, endpoints, and the answers the migrations rely on
 * (`resolveLegacyModelId`, `resolveCurrentModelId`, `isForeignModel`). Then `enabled()` following
 * the stores.
 *
 * #196 L6 lane 2 deleted types/jodie.ts. Its values are kept below as literals, copied from that file
 * on `f2beb5798` (`ALL_AI_PROVIDERS`, the `new AI(...)` rows, the `.add(...)` lists, `claudeLegacyIdMap`,
 * the endpoints and auth schemes). The grid of the three functions is checked against the rule
 * they implemented, restated over those literals; the rule was run on that commit against the old
 * functions over the same 768 cells, 0 mismatches, 614 foreign answers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { catalogStorageKey, hashKey } from '../catalog/catalogCache';
import { ProviderConfigStore } from '../config/ProviderConfigStore';
import { PROVIDER_IDS, PROVIDER_SPECS, claudeLegacyIdMap, modelDirectory, registry } from '../registry';
import { EAuthScheme, ECapabilities } from '../types';

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

/** `ALL_AI_PROVIDERS` of types/jodie.ts, in its order; Llama and Copilot are parked (no route). */
const TODAY_PROVIDERS = ['Claude', 'GPT', 'DeepSeek', 'Gemini', 'Mistral', 'Groq', 'Ollama', 'Llama', 'Copilot', 'Kimi', 'Custom'] as const;

/** `AI[p]` of types/jodie.ts: company, endpoint, auth scheme, key requirement. */
const TODAY_AI: Record<string, [string, string, string, boolean]> = {
    Claude:   ['Anthropic', 'https://api.anthropic.com/v1/messages', 'x-api-key', true],
    GPT:      ['OpenAI', 'https://api.openai.com/v1/chat/completions', 'bearer', true],
    DeepSeek: ['DeepSeek', 'https://api.deepseek.com/v1/chat/completions', 'bearer', true],
    Gemini:   ['Google', 'https://generativelanguage.googleapis.com/v1beta/models', 'query-key', true],
    Mistral:  ['Mistral', 'https://api.mistral.ai/v1/chat/completions', 'bearer', true],
    Groq:     ['Groq', 'https://api.groq.com/openai/v1/chat/completions', 'bearer', true],
    Ollama:   ['Ollama', 'http://localhost:11434/v1/chat/completions', 'none', false],
    Kimi:     ['Moonshot', 'https://api.moonshot.cn/v1/chat/completions', 'bearer', true],
    Custom:   ['Custom', '', 'bearer', true],
};

type Row = [id: string, label: string, pdf: boolean, vision: boolean, contextWindow?: number];
const C = 200_000;
/** The `.add(...)` lists of types/jodie.ts, in order: id, label, pdf, vision, context window. */
const TODAY_SEEDS: Record<(typeof TODAY_PROVIDERS)[number], Row[]> = {
    Claude: [
        ['claude-opus-4-7', 'Claude Opus 4.7', true, true, C], ['claude-opus-4-6', 'Claude Opus 4.6', true, true, C],
        ['claude-sonnet-4-6', 'Claude Sonnet 4.6', true, true, C], ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5', true, true, C],
        ['claude-3-5-sonnet-latest', 'Claude 3.5 Sonnet', true, true, C], ['claude-3-opus-latest', 'Claude 3 Opus', true, true, C],
        ['claude-3-haiku-20240307', 'Claude 3 Haiku', true, true, C],
    ],
    GPT: [
        ['gpt-4o', 'GPT-4o', true, false], ['gpt-4o-mini', 'GPT-4o Mini', true, false], ['gpt-4-turbo', 'GPT-4 Turbo', true, false],
        ['gpt-4', 'GPT-4', false, false], ['gpt-3.5-turbo', 'GPT-3.5 Turbo', false, false],
    ],
    DeepSeek: [['deepseek-chat', 'DeepSeek Chat', false, false], ['deepseek-coder', 'DeepSeek Coder', false, false]],
    Gemini: [
        ['gemini-3.7-flash', 'Gemini 3.7 Flash', true, true], ['gemini-3.6-flash', 'Gemini 3.6 Flash', true, true],
        ['gemini-3.5-flash-lite', 'Gemini 3.5 Flash Lite', true, true], ['gemini-2.0-flash-exp', 'Gemini 2.0 Flash', false, false],
        ['gemini-1.5-pro', 'Gemini 1.5 Pro', true, true], ['gemini-1.5-flash', 'Gemini 1.5 Flash', true, true],
        ['gemini-pro', 'Gemini Pro', false, false],
    ],
    Mistral: [
        ['mistral-large-latest', 'Mistral Large', false, false], ['mistral-small-latest', 'Mistral Small', false, false],
        ['pixtral-large-latest', 'Pixtral Large', true, false], ['pixtral-12b-2409', 'Pixtral 12B', true, false],
        ['codestral-latest', 'Codestral', false, false], ['ministral-8b-latest', 'Ministral 8B', false, false],
    ],
    Groq: [
        ['groq/compound', 'Compound', false, false], ['groq/compound-mini', 'Compound Mini', false, false],
        ['llama-3.1-8b-instant', 'Llama 3.1 8B', false, false], ['llama-3.3-70b-versatile', 'Llama 3.3 70B', false, false],
        ['meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 scout 17B 16E', false, false],
        ['meta-llama/llama-prompt-guard-2-22m', 'Llama Prompt Guard 2 22M', false, false],
        ['meta-llama/llama-prompt-guard-2-86m', 'Prompt Guard 2 86M', false, false],
        ['openai/gpt-oss-120b', 'GPT OSS 120B', false, false], ['openai/gpt-oss-20b', 'GPT OSS 20B', false, false],
        ['openai/gpt-oss-safeguard-20b', 'Safety GPT OSS 20B', false, false], ['whisper-large-v3', 'Whisper', false, false],
        ['whisper-large-v3-turbo', 'Whisper Large V3 Turbo', false, false],
        ['moonshotai/kimi-k2-instruct-0905', 'Kimi K2 0905', false, false], ['qwen/qwen3-32b', 'Qwen3-32B', false, false],
        ['canopylabs/orpheus-v1-english', 'Canopy Labs Orpheus V1 English', false, false],
    ],
    Ollama: [
        ['llama3.2', 'Llama 3.2', false, false], ['llama3.2:1b', 'Llama 3.2 1B', false, false], ['llama3.1', 'Llama 3.1', false, false],
        ['mistral', 'Mistral', false, false], ['codellama', 'Code Llama', false, false], ['llava', 'LLaVA', true, false],
        ['qwen2.5', 'Qwen 2.5', false, false],
    ],
    Llama: [
        ['llama-3.3-70b-versatile', 'Llama 3.3 70B', false, false], ['llama-3.1-8b-instant', 'Llama 3.1 8B', false, false],
        ['mixtral-8x7b-32768', 'Mixtral 8x7B', false, false], ['llava-v1.5-7b-4096-preview', 'LLaVA 1.5 7B', true, false],
        ['gemma2-9b-it', 'Gemma 2 9B', false, false],
    ],
    Copilot: [],
    Kimi: [['moonshot-v1-8k', 'Moonshot V1 8K', false, false], ['moonshot-v1-32k', 'Moonshot V1 32K', false, false], ['moonshot-v1-128k', 'Moonshot V1 128K', false, false]],
    Custom: [['custom', 'Custom', false, false]],
};

/** `claudeLegacyIdMap` of types/jodie.ts. */
const TODAY_CLAUDE_LEGACY: Record<string, string> = {
    'claude-sonnet-4-20250514': 'claude-sonnet-4-6',
    'claude-opus-4-20250514': 'claude-opus-4-6',
    'claude-haiku-4-20250514': 'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-latest',
    'claude-3-opus-20240229': 'claude-3-opus-latest',
};

/** Gemini is the retiring provider: a model off this list moved to its first entry. */
const TODAY_GEMINI_CURRENT = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-3.5-flash-lite'];

const idsOf = (p: string): string[] => (TODAY_SEEDS as Record<string, Row[]>)[p]?.map(r => r[0]) ?? [];

/** The three functions of types/jodie.ts, restated over the literals above (no live catalog). */
const today = {
    legacy: (p: string, id: string | undefined) => (p === 'Claude' && id && TODAY_CLAUDE_LEGACY[id]) || id,
    current: (p: string, id: string | undefined) =>
        p === 'Gemini' && id && !TODAY_GEMINI_CURRENT.includes(id) ? TODAY_GEMINI_CURRENT[0] : today.legacy(p, id),
    isForeign: (p: string, id: string | undefined) =>
        !!id && !idsOf(p).includes(id) && TODAY_PROVIDERS.some(q => q !== p && idsOf(q).includes(id)),
};

const FAMILIES = {
    Claude: 'anthropic', GPT: 'openai', DeepSeek: 'openai', Gemini: 'google', Mistral: 'openai',
    Groq: 'openai', Ollama: 'openai', Kimi: 'openai', Custom: 'openai',
} as const;

describe('providers', () => {
    it('lists every routed provider of today, in today\'s order, each with its family', () => {
        expect(PROVIDER_IDS).toEqual(TODAY_PROVIDERS.filter(p => p !== 'Llama' && p !== 'Copilot'));
        expect(registry.all().map(p => [p.name, p.family])).toEqual(PROVIDER_IDS.map(id => [id, FAMILIES[id]]));
    });

    it('keeps today\'s company, endpoint, auth scheme and key requirement', () => {
        const scheme: Record<string, EAuthScheme> = { 'bearer': EAuthScheme.BEARER, 'x-api-key': EAuthScheme.X_API_KEY, 'query-key': EAuthScheme.QUERY_KEY, 'none': EAuthScheme.NONE };
        for (const id of PROVIDER_IDS) {
            const spec = PROVIDER_SPECS[id];
            const [company, endpoint, authScheme, requiresKey] = TODAY_AI[id];
            expect([id, spec.company]).toEqual([id, company]);
            expect([id, spec.baseUrl]).toEqual([id, endpoint]);
            expect([id, spec.authScheme]).toEqual([id, scheme[authScheme]]);
            expect([id, spec.requiresKey]).toEqual([id, requiresKey]);
        }
        expect(PROVIDER_IDS.filter(id => PROVIDER_SPECS[id].userBaseUrl)).toEqual(['Ollama', 'Custom']);
    });
});

describe('seeds and legacy ids', () => {
    it('every seed list matches today\'s .add(...) list by value: id, label, pdf, vision, context window, order', () => {
        for (const id of PROVIDER_IDS) {
            const expected = TODAY_SEEDS[id].map(([k, label, pdf, vision, contextWindow]) => [k, label, pdf, vision, contextWindow]);
            const actual = PROVIDER_SPECS[id].seedModels.map(m =>
                [m.apiName, m.displayName, m.has(ECapabilities.DOCUMENTS), m.has(ECapabilities.IMAGES), m.contextWindow]);
            expect([id, actual]).toEqual([id, expected]);
        }
    });

    it('the Claude legacy map matches today\'s, and only Claude has one', () => {
        expect(claudeLegacyIdMap).toEqual(TODAY_CLAUDE_LEGACY);
        expect(PROVIDER_IDS.filter(id => PROVIDER_SPECS[id].legacyIds)).toEqual(['Claude']);
    });

    it('legacy, current and foreign answers match today\'s functions for every provider and every known id', () => {
        const ids = new Set<string | undefined>([undefined, '', 'not-a-model', ...Object.keys(TODAY_CLAUDE_LEGACY)]);
        for (const p of TODAY_PROVIDERS) for (const id of idsOf(p)) ids.add(id);
        const providers: string[] = [...TODAY_PROVIDERS, 'NotAProvider'];
        let compared = 0, foreign = 0;
        for (const p of providers) {
            for (const id of ids) {
                const where = `${p} / ${id}`;
                expect([where, modelDirectory.legacy(p, id)]).toEqual([where, today.legacy(p, id)]);
                expect([where, modelDirectory.current(p, id)]).toEqual([where, today.current(p, id)]);
                expect([where, modelDirectory.isForeign(p, id)]).toEqual([where, today.isForeign(p, id)]);
                if (today.isForeign(p, id)) foreign++;
                compared++;
            }
        }
        // Positive control: the grid is the one measured against the old functions, and both answers occur.
        expect(compared).toBe(768);
        expect(foreign).toBe(614);
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

    it('enabled() agrees with today\'s JodieConfig.getEnabledProviders on the same storage', () => {
        storage.set('jjodie_provider_groq', JSON.stringify({ name: 'Groq', apiKey: 'gsk_1', model: 'groq/compound' }));
        storage.set('jjodie_provider_ollama', JSON.stringify({ name: 'Ollama', baseUrl: 'http://localhost:11434', model: 'llama3.2' }));
        storage.set('jjodie_provider_custom', JSON.stringify({ name: 'Custom', apiKey: 'k' }));
        // What `JodieConfig.getEnabledProviders()` answered on this storage, measured before L6.
        expect(registry.enabled().map(p => p.name)).toEqual(['Groq', 'Ollama', 'Custom']);
    });

    // Moved from services/__tests__/aiModelCatalog.test.ts, deleted at #196 L6 with that file.
    it('calls a saved model the live catalog no longer lists unchanged: flagged, never swapped', () => {
        const key = 'jjodie_provider_claude';
        storage.set(key, JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-a', model: 'claude-3-opus-latest', enabled: true }));
        storage.set(catalogStorageKey('Claude'), JSON.stringify({ fetchedAt: Date.now(), keyHash: hashKey('sk-ant-a'), models: [
            { id: 'claude-opus-4-7', label: 'Claude Opus 4.7', family: 'opus', rank: Date.parse('2026-04-16T00:00:00Z') },
            { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', family: 'sonnet', rank: Date.parse('2026-02-17T00:00:00Z') },
        ] }));
        expect(registry.get('Claude').resolveModel()).toBe('claude-3-opus-latest');
        expect(JSON.parse(storage.get(key)!).model).toBe('claude-3-opus-latest');
    });
});

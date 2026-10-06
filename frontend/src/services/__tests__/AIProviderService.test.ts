import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));
vi.mock('../PromptService', () => ({
    PromptService: { getRendered: () => 'Test system prompt' },
}));

describe('AIProviderService Custom model selection', () => {
    beforeEach(() => {
        vi.resetModules();
        const storage = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ choices: [{ message: { content: 'Hello' } }] }),
        }));
    });

    afterEach(() => vi.unstubAllGlobals());

    async function setup(model = 'anthropic/claude-sonnet-4') {
        const { AI, AIConfig, AIProvider } = await import('../../types/jodie');
        const { AIProviderService } = await import('../AIProviderService');
        localStorage.setItem(AI.Custom.storageKey, JSON.stringify({
            name: AIProvider.Custom, apiKey: 'test-key', model,
            baseUrl: 'https://openrouter.ai/api/v1', enabled: true,
        }));
        return { AI, AIConfig, AIProvider, AIProviderService };
    }

    it('sends the configured model after selecting the Custom registry entry', async () => {
        const { AI, AIConfig, AIProvider, AIProviderService } = await setup();
        localStorage.setItem(`${AI.STORAGE_PREFIX}chat`, JSON.stringify({
            providerId: AIProvider.Custom, modelId: Object.keys(AI.Custom.versions)[0],
        }));
        expect(await AIProviderService.testConnection(AIProvider.Custom)).toEqual({ success: true });
        expect(await AIProviderService.chat('Hello', AIProvider.Custom, [], undefined,
            undefined, undefined, AIConfig.getPreferredModel('chat'))).toBe('Hello');
        expect(fetch).toHaveBeenCalledTimes(2);
        for (const [url, request] of vi.mocked(fetch).mock.calls) {
            expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
            expect(JSON.parse(request!.body as string).model).toBe('anthropic/claude-sonnet-4');
        }
    });

    it.each([undefined, 'custom'])('uses current configuration for selection %s', async selection => {
        const { AIProvider, AIProviderService } = await setup('new/model');
        await AIProviderService.chat('Hello', AIProvider.Custom, [], undefined, undefined, undefined, selection);
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).model).toBe('new/model');
    });

    it.each(['other/model', 'gpt-4o'])('preserves explicit Custom model %s', async selection => {
        const { AIProvider, AIProviderService } = await setup();
        await AIProviderService.chat('Hello', AIProvider.Custom, [], undefined, undefined, undefined, selection);
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).model).toBe(selection);
    });

    it('rejects an empty configured model before making a request', async () => {
        const { AIProvider, AIProviderService } = await setup('');
        await expect(AIProviderService.chat('Hello', AIProvider.Custom, [], undefined,
            undefined, undefined, 'custom')).rejects.toThrow('No model selected for Custom');
        expect(fetch).not.toHaveBeenCalled();
    });

    it('keeps explicit model selection for other providers', async () => {
        const { AI, AIProvider, AIProviderService } = await setup();
        localStorage.setItem(AI.DeepSeek.storageKey, JSON.stringify({
            name: AIProvider.DeepSeek, apiKey: 'sk-test', model: 'deepseek-chat',
        }));
        await AIProviderService.chat('Hello', AIProvider.DeepSeek, [], undefined,
            undefined, undefined, 'deepseek-reasoner');
        expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).model).toBe('deepseek-reasoner');
    });
});

// #179: a Gemini configuration saved before 2026-08-05 carries `gemini-2.0-flash-exp`, which
// Google answers with 404. Storage is seeded either before the import, when JodieConfig.load runs
// the load-time migration, or after it, to exercise the read-time resolution on its own.
describe('#179 retired models: the test and the chat call the same current model', () => {
    const GEMINI_KEY = 'jjodie_provider_gemini';
    const CHAT_KEY = 'jjodel_provider_chat';
    let storage: Map<string, string>;

    beforeEach(() => {
        vi.resetModules();
        storage = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ candidates: [{ content: { parts: [{ text: 'Hi' }] } }] }),
        }));
    });

    afterEach(() => vi.unstubAllGlobals());

    function seed(geminiModel: string, chat?: { providerId: string; modelId?: string }) {
        storage.set(GEMINI_KEY, JSON.stringify({ name: 'Gemini', apiKey: 'AIza-test', model: geminiModel, enabled: true }));
        if (chat) storage.set(CHAT_KEY, JSON.stringify({ ...chat, updatedAt: 0 }));
    }

    async function load() {
        const jodie = await import('../../types/jodie');
        const { AIProviderService } = await import('../AIProviderService');
        // Positive control: the keys seeded above are the ones the code reads.
        expect(jodie.AI.Gemini.storageKey).toBe(GEMINI_KEY);
        expect(`${jodie.AI.STORAGE_PREFIX}chat`).toBe(CHAT_KEY);
        const current = Object.keys(jodie.AI.Gemini.versions).filter(k => !jodie.AI.Gemini.versions[k].deprecated);
        return { ...jodie, AIProviderService, first: current[0], last: current[current.length - 1] };
    }

    const calledModel = (call: number): string =>
        /\/models\/([^:]+):generateContent/.exec(vi.mocked(fetch).mock.calls[call][0] as string)![1];

    it('moves a deprecated or unlisted Gemini id to the first current entry', async () => {
        const { AI, resolveCurrentModelId, first, last } = await load();
        expect(AI.Gemini.versions['gemini-2.0-flash-exp'].deprecated).toBe(true);
        expect(Object.keys(AI.Gemini.versions)[0]).toBe(first);
        expect(resolveCurrentModelId('Gemini', 'gemini-2.0-flash-exp')).toBe(first);
        expect(resolveCurrentModelId('Gemini', 'gemini-3.5-flash')).toBe(first); // dropped by 790a146c7
        expect(resolveCurrentModelId('Gemini', last)).toBe(last);
    });

    it('leaves other providers alone: deprecated and unlisted ids stay, the legacy map applies', async () => {
        const { resolveCurrentModelId } = await load();
        expect(resolveCurrentModelId('Claude', 'claude-3-opus-latest')).toBe('claude-3-opus-latest');
        expect(resolveCurrentModelId('DeepSeek', 'deepseek-reasoner')).toBe('deepseek-reasoner');
        expect(resolveCurrentModelId('Claude', 'claude-sonnet-4-20250514')).toBe('claude-sonnet-4-6');
    });

    it('tests the key with a current model when the saved one is retired', async () => {
        const { AIProviderService, first } = await load();
        seed('gemini-2.0-flash-exp');
        expect(await AIProviderService.testConnection('Gemini')).toEqual({ success: true });
        expect(calledModel(0)).toBe(first);
    });

    it('tests the model the chat calls, not the saved one', async () => {
        const { AIConfig, AIProviderService, first, last } = await load();
        expect(last).not.toBe(first);
        seed('gemini-2.0-flash-exp', { providerId: 'Gemini', modelId: last });
        await AIProviderService.testConnection('Gemini');
        await AIProviderService.chat('Hello', 'Gemini', [], undefined, undefined, undefined, AIConfig.getPreferredModel('chat'));
        expect(calledModel(0)).toBe(last);
        expect(calledModel(1)).toBe(last);
    });

    it('shows a retired chat pick as the model the call uses', async () => {
        const { AIConfig, first } = await load();
        seed('gemini-2.0-flash-exp', { providerId: 'Gemini', modelId: 'gemini-3.5-flash' });
        expect(AIConfig.getPreferredModel('chat')).toBe(first);
    });

    it('migrates saved models at load and records the one it replaced', async () => {
        seed('gemini-2.0-flash-exp', { providerId: 'Gemini', modelId: 'gemini-3.5-flash' });
        const { first } = await load();
        const cfg = JSON.parse(storage.get(GEMINI_KEY)!);
        expect(cfg.model).toBe(first);
        expect(cfg.replacedModel).toBe('gemini-2.0-flash-exp');
        expect(cfg.apiKey).toBe('AIza-test');
        expect(JSON.parse(storage.get(CHAT_KEY)!).modelId).toBe(first);
    });

    it('writes nothing on a load that finds nothing to move', async () => {
        seed('gemini-2.0-flash-exp');
        const { AIConfig } = await load();
        vi.mocked(localStorage.setItem).mockClear();
        AIConfig.retireModels();
        expect(localStorage.setItem).not.toHaveBeenCalled();
        expect(JSON.parse(storage.get(GEMINI_KEY)!).replacedModel).toBe('gemini-2.0-flash-exp');
    });

    it('keeps the saved models of the other providers at load', async () => {
        storage.set('jjodie_provider_deepseek', JSON.stringify({ name: 'DeepSeek', apiKey: 'sk-x', model: 'deepseek-reasoner' }));
        storage.set('jjodie_provider_claude', JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-x', model: 'claude-3-opus-latest' }));
        await load();
        expect(JSON.parse(storage.get('jjodie_provider_deepseek')!)).toEqual({ name: 'DeepSeek', apiKey: 'sk-x', model: 'deepseek-reasoner' });
        expect(JSON.parse(storage.get('jjodie_provider_claude')!)).toEqual({ name: 'Claude', apiKey: 'sk-ant-x', model: 'claude-3-opus-latest' });
    });

    it('names the model, not the API JSON, when Gemini answers 404', async () => {
        const { AIProviderService, last } = await load();
        seed(last);
        vi.mocked(fetch).mockResolvedValueOnce({
            ok: false, status: 404,
            text: async () => JSON.stringify({ error: { code: 404, message: `models/${last} is not found`, status: 'NOT_FOUND' } }),
        } as unknown as Response);
        const result = await AIProviderService.testConnection('Gemini');
        expect(result.success).toBe(false);
        expect(result.error).toContain(`"${last}"`);
        expect(result.error).not.toContain('{');
    });
});

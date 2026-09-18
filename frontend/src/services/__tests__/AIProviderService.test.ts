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

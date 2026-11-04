/**
 * #196 L1: what BaseProvider decides before any call: the key-prefix check (chat path and
 * `test()`), the model resolution, `enabled()`, and the attachment gating.
 */
import { describe, expect, it, vi } from 'vitest';
import { OpenAICompatibleProvider } from '../OpenAICompatibleProvider';
import { AnthropicCompatibleProvider } from '../AnthropicCompatibleProvider';
import { GoogleCompatibleProvider } from '../GoogleCompatibleProvider';
import { AIModel, EAuthScheme, ECapabilities, FailureCatalog } from '../types';
import type { BaseProvider } from '../BaseProvider';
import type { ProviderConfig, ProviderId, ProviderOptions, ProviderSpec } from '../types';

const BOTH = [ECapabilities.IMAGES, ECapabilities.DOCUMENTS];

const openai = (name: ProviderId, company: string, baseUrl: string, extra: Partial<ProviderSpec> = {}): ProviderSpec => ({
    name, company, family: 'openai', baseUrl, authScheme: EAuthScheme.BEARER, requiresKey: true,
    seedModels: [new AIModel(`${name.toLowerCase()}-model`)], ...extra,
});

const SPECS: Record<ProviderId, ProviderSpec> = {
    GPT: openai('GPT', 'OpenAI', 'https://api.openai.com/v1/chat/completions', {
        seedModels: [new AIModel('gpt-4o', 'GPT-4o', BOTH), new AIModel('gpt-3.5-turbo')],
    }),
    DeepSeek: openai('DeepSeek', 'DeepSeek', 'https://api.deepseek.com/v1/chat/completions'),
    Mistral: openai('Mistral', 'Mistral', 'https://api.mistral.ai/v1/chat/completions'),
    Groq: openai('Groq', 'Groq', 'https://api.groq.com/openai/v1/chat/completions'),
    Kimi: openai('Kimi', 'Moonshot', 'https://api.moonshot.cn/v1/chat/completions'),
    Ollama: openai('Ollama', 'Ollama', 'http://localhost:11434/v1/chat/completions', {
        authScheme: EAuthScheme.NONE, requiresKey: false, userBaseUrl: true, seedModels: [new AIModel('llama3')],
    }),
    Custom: openai('Custom', 'Custom', '', { userBaseUrl: true, seedModels: [new AIModel('custom', 'Custom model')] }),
    Claude: {
        name: 'Claude', company: 'Anthropic', family: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages',
        authScheme: EAuthScheme.X_API_KEY, requiresKey: true,
        seedModels: [new AIModel('claude-sonnet-4-6', 'Claude Sonnet 4.6', BOTH), new AIModel('claude-3-haiku', 'Claude 3 Haiku', [ECapabilities.IMAGES])],
        legacyIds: { 'claude-sonnet-4-20250514': 'claude-sonnet-4-6' },
    },
    Gemini: {
        name: 'Gemini', company: 'Google', family: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        authScheme: EAuthScheme.QUERY_KEY, requiresKey: true, seedModels: [new AIModel('gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', BOTH)],
    },
};

/** A fetch that answers every family with a success, and counts the calls. */
function countingFetch() {
    const calls: string[] = [];
    const fn = (async (input: any) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        calls.push(url);
        const body = url.includes('anthropic')
            ? { id: 'm', type: 'message', role: 'assistant', model: 'm', content: [{ type: 'text', text: 'ok' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } }
            : url.includes('googleapis')
                ? { candidates: [{ content: { role: 'model', parts: [{ text: 'ok' }] }, finishReason: 'STOP', index: 0 }] }
                : { id: 'c', object: 'chat.completion', created: 0, model: 'm', choices: [{ index: 0, message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }] };
        return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
    }) as typeof fetch;
    return { fn, calls };
}

function make(name: ProviderId, config: ProviderConfig, options: ProviderOptions = {}): BaseProvider {
    const spec = SPECS[name];
    if (spec.family === 'anthropic') return new AnthropicCompatibleProvider(spec, config, options);
    if (spec.family === 'google') return new GoogleCompatibleProvider(spec, config, options);
    return new OpenAICompatibleProvider(spec, config, options);
}

const HI = { history: [{ role: 'user' as const, content: 'Hi' }] };
const IMAGE = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
const PDF = { mimeType: 'application/pdf', data: 'JVBERi0xLjQ=' };

describe('validateKey', () => {
    it.each<[ProviderId, string]>([
        ['Claude', 'sk-ant-abc'],
        ['GPT', 'sk-abc'],
        ['DeepSeek', 'sk-abc'],
        ['Groq', 'gsk_abc'],
        ['Gemini', 'AIzaSyAbc'],
        ['Gemini', 'not-a-google-shape'],
        ['Mistral', 'AIzaSyAbc'],
        ['Custom', 'sk-ant-abc'],
    ])('%s accepts %s', (name, apiKey) => {
        expect(make(name, { apiKey }).validateKey()).toBeNull();
    });

    it.each<[ProviderId, string, RegExp]>([
        ['Claude', 'sk-abc', /should start with "sk-ant-"/],
        ['GPT', 'gsk_abc', /looks like a Groq API key/],
        ['GPT', 'sk-ant-abc', /looks like a Anthropic \(Claude\) API key/],
        ['DeepSeek', 'abc', /should start with "sk-"/],
        ['Groq', 'sk-abc', /should start with "gsk_"/],
        ['Mistral', 'gsk_abc', /looks like a Groq API key/],
    ])('%s refuses %s', (name, apiKey, message) => {
        expect(make(name, { apiKey }).validateKey()).toMatch(message);
    });

    it('does not judge a keyless Ollama', () => {
        expect(make('Ollama', { apiKey: 'sk-ant-abc', baseUrl: 'http://localhost:11434' }).validateKey()).toBeNull();
    });

    it('refuses on the chat path before any call', async () => {
        const { fn, calls } = countingFetch();
        await expect(make('Claude', { apiKey: 'sk-abc', model: 'claude-sonnet-4-6' }, { fetch: fn }).chat(HI))
            .rejects.toThrow(/should start with "sk-ant-"/);
        await expect(make('GPT', { apiKey: 'gsk_abc', model: 'gpt-4o' }, { fetch: fn }).chat(HI))
            .rejects.toThrow(/looks like a Groq API key/);
        expect(calls).toEqual([]);
    });

    it('refuses in test() as AUTH before any call', async () => {
        const { fn, calls } = countingFetch();
        const result = await make('Groq', { apiKey: 'sk-abc', model: 'groq-model' }, { fetch: fn }).test();
        expect(result).toMatchObject({ success: false, failure: FailureCatalog.AUTH });
        expect(result.error).toMatch(/should start with "gsk_"/);
        expect(calls).toEqual([]);
    });

    it('lets a Gemini key without AIza reach the call, in chat and in test()', async () => {
        const { fn, calls } = countingFetch();
        const gemini = make('Gemini', { apiKey: 'not-a-google-shape', model: 'gemini-3.5-flash-lite' }, { fetch: fn });
        expect(await gemini.chat(HI)).toBe('ok');
        expect(await gemini.test()).toEqual({ success: true });
        expect(calls).toHaveLength(2);
    });
});

describe('resolveModel', () => {
    it('keeps the configured model, and a requested one over it', () => {
        const claude = make('Claude', { apiKey: 'sk-ant-x', model: 'claude-sonnet-4-6' });
        expect(claude.resolveModel()).toBe('claude-sonnet-4-6');
        expect(claude.resolveModel('claude-3-haiku')).toBe('claude-3-haiku');
    });

    it('maps a legacy id onto the current one', () => {
        expect(make('Claude', { apiKey: 'sk-ant-x', model: 'claude-sonnet-4-20250514' }).resolveModel()).toBe('claude-sonnet-4-6');
        expect(make('Claude', { apiKey: 'sk-ant-x' }).resolveModel('claude-sonnet-4-20250514')).toBe('claude-sonnet-4-6');
    });

    it('discards a model of another provider with a warning, for the configured model', () => {
        const onWarning = vi.fn();
        const claude = make('Claude', { apiKey: 'sk-ant-x', model: 'claude-3-haiku' }, { onWarning, isModelOfOtherProvider: id => id === 'gpt-4o' });
        expect(claude.resolveModel('gpt-4o')).toBe('claude-3-haiku');
        expect(onWarning).toHaveBeenCalledTimes(1);
        expect(onWarning.mock.calls[0][0]).toMatch(/Discarding model "gpt-4o" — not a Claude model; using "claude-3-haiku" instead/);
    });

    it('falls back to the first seed when the configured model is foreign too', () => {
        const onWarning = vi.fn();
        const claude = make('Claude', { apiKey: 'sk-ant-x', model: 'gpt-4o' }, { onWarning, isModelOfOtherProvider: id => id === 'gpt-4o' });
        expect(claude.resolveModel()).toBe('claude-sonnet-4-6');
        expect(onWarning).toHaveBeenCalledTimes(1);
    });

    it('keeps a model no provider lists (a user-pulled Ollama tag)', () => {
        const onWarning = vi.fn();
        const ollama = make('Ollama', { baseUrl: 'http://localhost:11434', model: 'qwen3:8b' }, { onWarning, isModelOfOtherProvider: () => false });
        expect(ollama.resolveModel()).toBe('qwen3:8b');
        expect(onWarning).not.toHaveBeenCalled();
    });

    it('counts the live catalog as the provider\'s own models', () => {
        const onWarning = vi.fn();
        const gpt = make('GPT', { apiKey: 'sk-x', model: 'gpt-4o' }, {
            onWarning, isModelOfOtherProvider: id => id === 'gpt-5', liveModels: () => [new AIModel('gpt-5')],
        });
        expect(gpt.resolveModel('gpt-5')).toBe('gpt-5');
        expect(onWarning).not.toHaveBeenCalled();
    });

    it('exempts Custom from the guard and resolves its placeholder to the configured model', () => {
        const onWarning = vi.fn();
        const custom = make('Custom', { apiKey: 'k', baseUrl: 'https://openrouter.ai/api/v1', model: 'new/model' }, { onWarning, isModelOfOtherProvider: () => true });
        expect(custom.resolveModel('gpt-4o')).toBe('gpt-4o');
        expect(custom.resolveModel('custom')).toBe('new/model');
        expect(custom.resolveModel()).toBe('new/model');
        expect(onWarning).not.toHaveBeenCalled();
    });
});

describe('enabled', () => {
    it('Ollama is enabled by a Base URL, not by the absence of a key', () => {
        expect(make('Ollama', {}).enabled()).toBe(false);
        expect(make('Ollama', { apiKey: 'sk-x' }).enabled()).toBe(false);
        expect(make('Ollama', { baseUrl: 'http://localhost:11434' }).enabled()).toBe(true);
    });

    it('Custom is enabled by a key only or by a Base URL only', () => {
        expect(make('Custom', { apiKey: 'k' }).enabled()).toBe(true);
        expect(make('Custom', { baseUrl: 'https://openrouter.ai/api/v1' }).enabled()).toBe(true);
        expect(make('Custom', {}).enabled()).toBe(false);
    });

    it('a keyed provider is enabled by its key, not by a Base URL', () => {
        expect(make('GPT', { apiKey: 'sk-x' }).enabled()).toBe(true);
        expect(make('GPT', { baseUrl: 'https://api.openai.com/v1' }).enabled()).toBe(false);
    });

    it('a disabled provider makes no call, in chat and in test()', async () => {
        const { fn, calls } = countingFetch();
        const ollama = make('Ollama', { model: 'llama3' }, { fetch: fn });
        await expect(ollama.chat(HI)).rejects.toThrow(/not configured/);
        expect(await ollama.test()).toEqual({ success: false, error: 'Ollama requires a Base URL.' });
        expect(await make('GPT', {}, { fetch: fn }).test()).toEqual({ success: false, error: 'API key not configured' });
        expect(calls).toEqual([]);
    });
});

describe('capability gating', () => {
    it('refuses a PDF to a model without DOCUMENTS and an image to a model without IMAGES, before any call', async () => {
        const { fn, calls } = countingFetch();
        const haiku = make('Claude', { apiKey: 'sk-ant-x', model: 'claude-3-haiku' }, { fetch: fn });
        await expect(haiku.chat({ ...HI, documents: [PDF] })).rejects.toThrow('The model "claude-3-haiku" does not accept PDF documents.');
        const turbo = make('GPT', { apiKey: 'sk-x', model: 'gpt-3.5-turbo' }, { fetch: fn });
        await expect(turbo.chat({ ...HI, images: [IMAGE] })).rejects.toThrow('The model "gpt-3.5-turbo" does not accept images.');
        expect(calls).toEqual([]);
    });

    it('refuses an attachment to a model no list declares', async () => {
        const { fn, calls } = countingFetch();
        const custom = make('Custom', { apiKey: 'k', baseUrl: 'https://openrouter.ai/api/v1', model: 'some/model' }, { fetch: fn });
        await expect(custom.chat({ ...HI, images: [IMAGE] })).rejects.toThrow(/does not accept images/);
        expect(calls).toEqual([]);
    });

    it('accepts what the model declares', async () => {
        const { fn, calls } = countingFetch();
        expect(await make('Claude', { apiKey: 'sk-ant-x', model: 'claude-3-haiku' }, { fetch: fn }).chat({ ...HI, images: [IMAGE] })).toBe('ok');
        expect(await make('Claude', { apiKey: 'sk-ant-x', model: 'claude-sonnet-4-6' }, { fetch: fn }).chat({ ...HI, images: [IMAGE], documents: [PDF] })).toBe('ok');
        expect(await make('Gemini', { apiKey: 'AIzaX', model: 'gemini-3.5-flash-lite' }, { fetch: fn }).chat({ ...HI, documents: [PDF] })).toBe('ok');
        expect(await make('GPT', { apiKey: 'sk-x', model: 'gpt-4o' }, { fetch: fn }).chat({ ...HI, images: [IMAGE] })).toBe('ok');
        expect(calls).toHaveLength(4);
    });
});

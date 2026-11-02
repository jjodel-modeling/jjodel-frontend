/**
 * #196 L1: the request each SDK family builds, read on a fetch mock handed to the SDK client.
 * vitest runs in `node`, so `@google/genai` resolves its node export here, not the `browser` one;
 * the browser wire is the L3 smoke.
 */
import { describe, expect, it } from 'vitest';
import { OpenAICompatibleProvider, openAIBaseUrl } from '../OpenAICompatibleProvider';
import { AnthropicCompatibleProvider } from '../AnthropicCompatibleProvider';
import { GoogleCompatibleProvider } from '../GoogleCompatibleProvider';
import { AIModel, DEFAULT_MAX_OUTPUT_TOKENS, EAuthScheme, ECapabilities } from '../types';
import type { ChatRequest, ProviderSpec } from '../types';

interface Call { url: string; method: string; headers: Headers; body: any }

function mockFetch(respond: (call: Call) => Response | Promise<Response>) {
    const calls: Call[] = [];
    const fn = (async (input: any, init: any = {}) => {
        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
        const raw = init.body;
        const call: Call = {
            url,
            method: String(init.method ?? 'GET').toUpperCase(),
            headers: new Headers(init.headers),
            body: typeof raw === 'string' && raw ? JSON.parse(raw) : raw,
        };
        calls.push(call);
        return respond(call);
    }) as typeof fetch;
    return { fn, calls };
}

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const sse = (events: string[]) =>
    new Response(events.join(''), { status: 200, headers: { 'content-type': 'text/event-stream' } });

const BOTH = [ECapabilities.IMAGES, ECapabilities.DOCUMENTS];

const GPT: ProviderSpec = {
    name: 'GPT', company: 'OpenAI', family: 'openai', baseUrl: 'https://api.openai.com/v1/chat/completions',
    authScheme: EAuthScheme.BEARER, requiresKey: true, seedModels: [new AIModel('gpt-4o', 'GPT-4o', BOTH)],
};
const GROQ: ProviderSpec = {
    name: 'Groq', company: 'Groq', family: 'openai', baseUrl: 'https://api.groq.com/openai/v1/chat/completions',
    authScheme: EAuthScheme.BEARER, requiresKey: true, seedModels: [new AIModel('llama-3.3-70b-versatile')],
};
const OLLAMA: ProviderSpec = {
    name: 'Ollama', company: 'Ollama', family: 'openai', baseUrl: 'http://localhost:11434/v1/chat/completions',
    authScheme: EAuthScheme.NONE, requiresKey: false, userBaseUrl: true, seedModels: [new AIModel('llama3')],
};
const CUSTOM: ProviderSpec = {
    name: 'Custom', company: 'Custom', family: 'openai', baseUrl: '',
    authScheme: EAuthScheme.BEARER, requiresKey: true, userBaseUrl: true, seedModels: [new AIModel('custom', 'Custom model')],
};
const CLAUDE: ProviderSpec = {
    name: 'Claude', company: 'Anthropic', family: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages',
    authScheme: EAuthScheme.X_API_KEY, requiresKey: true, seedModels: [new AIModel('claude-sonnet-4-6', 'Claude Sonnet 4.6', BOTH)],
};
const GEMINI: ProviderSpec = {
    name: 'Gemini', company: 'Google', family: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    authScheme: EAuthScheme.QUERY_KEY, requiresKey: true, seedModels: [new AIModel('gemini-3.5-flash-lite', 'Gemini 3.5 Flash-Lite', BOTH)],
};

const openAIReply = () => json(200, {
    id: 'c1', object: 'chat.completion', created: 0, model: 'm',
    choices: [{ index: 0, message: { role: 'assistant', content: 'Hello' }, finish_reason: 'stop' }],
});
const anthropicReply = () => json(200, {
    id: 'm1', type: 'message', role: 'assistant', model: 'm', content: [{ type: 'text', text: 'Hello' }],
    stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
});
const geminiReply = () => json(200, {
    candidates: [{ content: { role: 'model', parts: [{ text: 'Hello' }] }, finishReason: 'STOP', index: 0 }],
});

const CONVERSATION: ChatRequest = {
    system: 'You are Jjodie.',
    history: [
        { role: 'user', content: 'first' },
        { role: 'assistant', content: 'answer' },
        { role: 'user', content: 'second' },
    ],
};
const IMAGE = { mimeType: 'image/png', data: 'iVBORw0KGgo=' };
const PDF = { mimeType: 'application/pdf', data: 'JVBERi0xLjQ=', name: 'spec.pdf' };

async function collect(stream: AsyncIterable<string>): Promise<string> {
    let out = '';
    for await (const piece of stream) out += piece;
    return out;
}

describe('OpenAI-compatible request', () => {
    it('posts to /v1/chat/completions with Bearer, system, history and max_tokens 8192 by default', async () => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test', model: 'gpt-4o' }, { fetch: fn });
        expect(await provider.chat(CONVERSATION)).toBe('Hello');
        expect(calls).toHaveLength(1);
        const [call] = calls;
        expect(call.url).toBe('https://api.openai.com/v1/chat/completions');
        expect(call.method).toBe('POST');
        expect(call.headers.get('authorization')).toBe('Bearer sk-test');
        expect(call.body.model).toBe('gpt-4o');
        expect(call.body.max_tokens).toBe(DEFAULT_MAX_OUTPUT_TOKENS);
        expect(DEFAULT_MAX_OUTPUT_TOKENS).toBe(8192);
        expect(call.body.messages).toEqual([
            { role: 'system', content: 'You are Jjodie.' },
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'answer' },
            { role: 'user', content: 'second' },
        ]);
    });

    it('sends the maxOutputTokens override', async () => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test', model: 'gpt-4o' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, maxOutputTokens: 300 });
        expect(calls[0].body.max_tokens).toBe(300);
    });

    it('puts image and PDF parts on the current user turn only', async () => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test', model: 'gpt-4o' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, images: [IMAGE], documents: [PDF] });
        const messages = calls[0].body.messages;
        expect(messages[1]).toEqual({ role: 'user', content: 'first' });
        expect(messages[3]).toEqual({
            role: 'user',
            content: [
                { type: 'text', text: 'second' },
                { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgo=' } },
                { type: 'file', file: { filename: 'spec.pdf', file_data: 'data:application/pdf;base64,JVBERi0xLjQ=' } },
            ],
        });
    });

    it('derives the endpoint from the provider default (Groq)', async () => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(GROQ, { apiKey: 'gsk_test', model: 'llama-3.3-70b-versatile' }, { fetch: fn });
        await provider.chat(CONVERSATION);
        expect(calls[0].url).toBe('https://api.groq.com/openai/v1/chat/completions');
    });

    it.each([
        ['https://openrouter.ai/api/v1/chat/completions', 'https://openrouter.ai/api/v1/chat/completions'],
        ['https://openrouter.ai/api/v1/', 'https://openrouter.ai/api/v1/chat/completions'],
        ['http://localhost:11434', 'http://localhost:11434/v1/chat/completions'],
    ])('normalises the Custom Base URL %s', async (baseUrl, expected) => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(CUSTOM, { apiKey: 'test-key', baseUrl, model: 'anthropic/claude-sonnet-4' }, { fetch: fn });
        await provider.chat(CONVERSATION);
        expect(calls[0].url).toBe(expected);
        expect(calls[0].body.model).toBe('anthropic/claude-sonnet-4');
    });

    it.each([
        ['https://host/v1/chat/completions', 'https://host/v1'],
        ['https://host/v2//', 'https://host/v2'],
        ['  http://localhost:11434/ ', 'http://localhost:11434/v1'],
    ])('openAIBaseUrl(%s) is %s', (endpoint, expected) => {
        expect(openAIBaseUrl(endpoint)).toBe(expected);
    });

    it('sends no Authorization header to a keyless Ollama', async () => {
        const { fn, calls } = mockFetch(openAIReply);
        const provider = new OpenAICompatibleProvider(OLLAMA, { baseUrl: 'http://192.168.1.5:11434', model: 'llama3' }, { fetch: fn });
        await provider.chat(CONVERSATION);
        expect(calls[0].url).toBe('http://192.168.1.5:11434/v1/chat/completions');
        expect(calls[0].headers.has('authorization')).toBe(false);
    });

    it('streams the deltas', async () => {
        const chunk = (content: string) => `data: ${JSON.stringify({ id: 'c', object: 'chat.completion.chunk', created: 0, model: 'm', choices: [{ index: 0, delta: { content }, finish_reason: null }] })}\n\n`;
        const { fn, calls } = mockFetch(() => sse([chunk('Hel'), chunk('lo'), 'data: [DONE]\n\n']));
        const provider = new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test', model: 'gpt-4o' }, { fetch: fn });
        expect(await collect(provider.chatStream(CONVERSATION))).toBe('Hello');
        expect(calls[0].body.stream).toBe(true);
        expect(calls[0].body.max_tokens).toBe(8192);
    });

    it('lists GPT chat models newest of each family first, without the denied ones', async () => {
        const { fn, calls } = mockFetch(() => json(200, { object: 'list', data: [
            { id: 'gpt-4o', object: 'model', created: 100, owned_by: 'openai' },
            { id: 'gpt-5', object: 'model', created: 300, owned_by: 'openai' },
            { id: 'gpt-5-mini', object: 'model', created: 200, owned_by: 'openai' },
            { id: 'whisper-1', object: 'model', created: 400, owned_by: 'openai' },
        ] }));
        const provider = new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test' }, { fetch: fn });
        const models = await provider.retrieveAvailableModels();
        expect(calls[0].url).toBe('https://api.openai.com/v1/models');
        expect(models.map(m => m.apiName)).toEqual(['gpt-5', 'gpt-5-mini', 'gpt-4o']);
        expect(models[0].capabilities).toEqual([ECapabilities.IMAGES, ECapabilities.DOCUMENTS]);
    });
});

describe('Anthropic request', () => {
    it('posts to /v1/messages with Bearer, the direct-browser header, system and max_tokens 8192 by default', async () => {
        const { fn, calls } = mockFetch(anthropicReply);
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-sonnet-4-6' }, { fetch: fn });
        expect(await provider.chat(CONVERSATION)).toBe('Hello');
        expect(calls).toHaveLength(1);
        const [call] = calls;
        expect(call.url).toBe('https://api.anthropic.com/v1/messages');
        expect(call.method).toBe('POST');
        expect(call.headers.get('anthropic-dangerous-direct-browser-access')).toBe('true');
        // The SDK sends the key as Bearer (spec §4): the old x-api-key assertion does not carry over.
        expect(call.headers.get('authorization')).toBe('Bearer sk-ant-test');
        expect(call.body.model).toBe('claude-sonnet-4-6');
        expect(call.body.max_tokens).toBe(8192);
        expect(call.body.system).toBe('You are Jjodie.');
        expect(call.body.messages).toEqual([
            { role: 'user', content: 'first' },
            { role: 'assistant', content: 'answer' },
            { role: 'user', content: 'second' },
        ]);
    });

    it('sends the maxOutputTokens override', async () => {
        const { fn, calls } = mockFetch(anthropicReply);
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-sonnet-4-6' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, maxOutputTokens: 300 });
        expect(calls[0].body.max_tokens).toBe(300);
    });

    it('puts the document, then the image, then the text on the current user turn', async () => {
        const { fn, calls } = mockFetch(anthropicReply);
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-sonnet-4-6' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, images: [IMAGE], documents: [PDF] });
        expect(calls[0].body.messages[2]).toEqual({
            role: 'user',
            content: [
                { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0xLjQ=' } },
                { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'iVBORw0KGgo=' } },
                { type: 'text', text: 'second' },
            ],
        });
    });

    it('test() is one POST to /v1/messages with max_tokens 1 on the configured model', async () => {
        const { fn, calls } = mockFetch(anthropicReply);
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-sonnet-4-6' }, { fetch: fn });
        expect(await provider.test()).toEqual({ success: true });
        expect(calls).toHaveLength(1);
        expect(calls[0].method).toBe('POST');
        expect(calls[0].url).toBe('https://api.anthropic.com/v1/messages');
        expect(calls[0].body.max_tokens).toBe(1);
        expect(calls[0].body.model).toBe('claude-sonnet-4-6');
    });

    it('streams the text deltas', async () => {
        const event = (type: string, data: object) => `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;
        const { fn, calls } = mockFetch(() => sse([
            event('message_start', { message: { id: 'm', type: 'message', role: 'assistant', model: 'm', content: [], stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 0 } } }),
            event('content_block_start', { index: 0, content_block: { type: 'text', text: '' } }),
            event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'Hel' } }),
            event('content_block_delta', { index: 0, delta: { type: 'text_delta', text: 'lo' } }),
            event('content_block_stop', { index: 0 }),
            event('message_delta', { delta: { stop_reason: 'end_turn', stop_sequence: null }, usage: { output_tokens: 2 } }),
            event('message_stop', {}),
        ]));
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-sonnet-4-6' }, { fetch: fn });
        expect(await collect(provider.chatStream(CONVERSATION))).toBe('Hello');
        expect(calls[0].body.stream).toBe(true);
    });

    it('lists the Claude models newest of each family first', async () => {
        const { fn, calls } = mockFetch(() => json(200, { data: [
            { type: 'model', id: 'claude-sonnet-4-5', display_name: 'Claude Sonnet 4.5', created_at: '2025-09-01T00:00:00Z' },
            { type: 'model', id: 'claude-haiku-5-5', display_name: 'Claude Haiku 5.5', created_at: '2026-06-01T00:00:00Z' },
            { type: 'model', id: 'claude-sonnet-5', display_name: 'Claude Sonnet 5', created_at: '2026-05-01T00:00:00Z' },
        ], has_more: false, first_id: null, last_id: null }));
        const provider = new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test' }, { fetch: fn });
        const models = await provider.retrieveAvailableModels();
        expect(calls[0].method).toBe('GET');
        expect(new URL(calls[0].url).pathname).toBe('/v1/models');
        expect(models.map(m => m.apiName)).toEqual(['claude-haiku-5-5', 'claude-sonnet-5', 'claude-sonnet-4-5']);
        expect(models[1].displayName).toBe('Claude Sonnet 5');
    });
});

describe('Google request', () => {
    it('posts generateContent with x-goog-api-key, systemInstruction, user/model turns and maxOutputTokens 8192 by default', async () => {
        const { fn, calls } = mockFetch(geminiReply);
        const provider = new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest', model: 'gemini-3.5-flash-lite' }, { fetch: fn });
        expect(await provider.chat(CONVERSATION)).toBe('Hello');
        expect(calls).toHaveLength(1);
        const [call] = calls;
        const url = new URL(call.url);
        expect(url.origin + url.pathname).toBe('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent');
        expect(url.searchParams.has('key')).toBe(false);
        expect(call.method).toBe('POST');
        expect(call.headers.get('x-goog-api-key')).toBe('AIzaTest');
        expect(call.body.generationConfig.maxOutputTokens).toBe(8192);
        expect(call.body.systemInstruction.parts).toEqual([{ text: 'You are Jjodie.' }]);
        expect(call.body.contents).toEqual([
            { role: 'user', parts: [{ text: 'first' }] },
            { role: 'model', parts: [{ text: 'answer' }] },
            { role: 'user', parts: [{ text: 'second' }] },
        ]);
    });

    it('sends the maxOutputTokens override', async () => {
        const { fn, calls } = mockFetch(geminiReply);
        const provider = new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest', model: 'gemini-3.5-flash-lite' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, maxOutputTokens: 300 });
        expect(calls[0].body.generationConfig.maxOutputTokens).toBe(300);
    });

    it('sends the PDF and the image as inlineData parts of the current turn', async () => {
        const { fn, calls } = mockFetch(geminiReply);
        const provider = new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest', model: 'gemini-3.5-flash-lite' }, { fetch: fn });
        await provider.chat({ ...CONVERSATION, images: [IMAGE], documents: [PDF] });
        expect(calls[0].body.contents[2]).toEqual({
            role: 'user',
            parts: [
                { inlineData: { mimeType: 'application/pdf', data: 'JVBERi0xLjQ=' } },
                { inlineData: { mimeType: 'image/png', data: 'iVBORw0KGgo=' } },
                { text: 'second' },
            ],
        });
    });

    it('streams the chunks', async () => {
        const chunk = (text: string) => `data: ${JSON.stringify({ candidates: [{ content: { role: 'model', parts: [{ text }] }, index: 0 }] })}\n\n`;
        const { fn, calls } = mockFetch(() => sse([chunk('Hel'), chunk('lo')]));
        const provider = new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest', model: 'gemini-3.5-flash-lite' }, { fetch: fn });
        expect(await collect(provider.chatStream(CONVERSATION))).toBe('Hello');
        expect(new URL(calls[0].url).pathname).toBe('/v1beta/models/gemini-3.5-flash-lite:streamGenerateContent');
    });

    it('lists the Gemini models that generate content, newest of each family first', async () => {
        const { fn, calls } = mockFetch(() => json(200, { models: [
            { name: 'models/gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', inputTokenLimit: 1048576, supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', inputTokenLimit: 1048576, supportedGenerationMethods: ['generateContent'] },
            { name: 'models/gemini-embedding-001', displayName: 'Embedding', supportedGenerationMethods: ['embedContent'] },
            { name: 'models/gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite', supportedGenerationMethods: ['generateContent'] },
        ] }));
        const provider = new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest' }, { fetch: fn });
        const models = await provider.retrieveAvailableModels();
        expect(calls[0].method).toBe('GET');
        expect(new URL(calls[0].url).pathname).toBe('/v1beta/models');
        expect(calls[0].headers.get('x-goog-api-key')).toBe('AIzaTest');
        expect(models.map(m => m.apiName)).toEqual(['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash']);
        expect(models[0].contextWindow).toBe(1048576);
    });
});

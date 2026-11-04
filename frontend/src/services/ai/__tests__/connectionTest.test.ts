/**
 * #196 L1: how `test()` classifies a failure into FailureCatalog, from responses shaped like the
 * ones measured by the L0 spike (spec §9) and read through each SDK's own error classes.
 */
import { describe, expect, it } from 'vitest';
import { OpenAICompatibleProvider } from '../OpenAICompatibleProvider';
import { AnthropicCompatibleProvider } from '../AnthropicCompatibleProvider';
import { GoogleCompatibleProvider } from '../GoogleCompatibleProvider';
import { AIModel, EAuthScheme, FailureCatalog } from '../types';
import type { ProviderSpec } from '../types';

function mockFetch(respond: () => Response | Promise<Response>) {
    const calls: string[] = [];
    const fn = (async (input: any) => {
        calls.push(typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url);
        return respond();
    }) as typeof fetch;
    return { fn, calls };
}

const json = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

/** What a browser fetch does on a CORS block or an unreachable host. */
const rejected = () => Promise.reject(new TypeError('Failed to fetch'));

const GPT: ProviderSpec = {
    name: 'GPT', company: 'OpenAI', family: 'openai', baseUrl: 'https://api.openai.com/v1/chat/completions',
    authScheme: EAuthScheme.BEARER, requiresKey: true, seedModels: [new AIModel('gpt-4o-mini')],
};
const OLLAMA: ProviderSpec = {
    name: 'Ollama', company: 'Ollama', family: 'openai', baseUrl: 'http://localhost:11434/v1/chat/completions',
    authScheme: EAuthScheme.NONE, requiresKey: false, userBaseUrl: true, seedModels: [new AIModel('llama3')],
};
const CLAUDE: ProviderSpec = {
    name: 'Claude', company: 'Anthropic', family: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages',
    authScheme: EAuthScheme.X_API_KEY, requiresKey: true, seedModels: [new AIModel('claude-haiku-5-5')],
};
const GEMINI: ProviderSpec = {
    name: 'Gemini', company: 'Google', family: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
    authScheme: EAuthScheme.QUERY_KEY, requiresKey: true, seedModels: [new AIModel('gemini-3.5-flash-lite')],
};

const gpt = (respond: () => Response | Promise<Response>) => {
    const mock = mockFetch(respond);
    return { ...mock, provider: new OpenAICompatibleProvider(GPT, { apiKey: 'sk-test', model: 'gpt-4o-mini' }, { fetch: mock.fn }) };
};
const claude = (respond: () => Response | Promise<Response>) => {
    const mock = mockFetch(respond);
    return { ...mock, provider: new AnthropicCompatibleProvider(CLAUDE, { apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' }, { fetch: mock.fn }) };
};
const gemini = (respond: () => Response | Promise<Response>) => {
    const mock = mockFetch(respond);
    return { ...mock, provider: new GoogleCompatibleProvider(GEMINI, { apiKey: 'AIzaTest', model: 'gemini-3.5-flash-lite' }, { fetch: mock.fn }) };
};

describe('OpenAI test() classification', () => {
    it('401 AuthenticationError is AUTH', async () => {
        const { provider } = gpt(() => json(401, { error: { message: 'Incorrect API key provided: sk-test.', type: 'invalid_request_error', param: null, code: 'invalid_api_key' } }));
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.AUTH, error: 'Invalid API key. Please check your key in the OpenAI Console.',
        });
    });

    it('429 RateLimitError is RATE with the retry message', async () => {
        const { provider } = gpt(() => json(429, { error: { message: 'Rate limit reached for gpt-4o-mini.', type: 'requests', param: null, code: 'rate_limit_exceeded' } }));
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.RATE, error: 'Rate limit exceeded. Please try again in a moment.',
        });
    });

    it('429 insufficient_quota is RATE with the no-credit message (R-AI-8)', async () => {
        const { provider } = gpt(() => json(429, { error: { message: 'You exceeded your current quota, please check your plan and billing details.', type: 'insufficient_quota', param: null, code: 'insufficient_quota' } }));
        const result = await provider.test();
        expect(result.failure).toBe(FailureCatalog.RATE);
        expect(result.error).toMatch(/no credit left on the account/i);
        expect(result.error).not.toMatch(/try again in a moment/);
    });

    it('404 NotFoundError is SERVER and names the model: the key passed, the model does not answer', async () => {
        const { provider } = gpt(() => json(404, { error: { message: 'The model `gpt-4o-mini` has been deprecated.', type: 'invalid_request_error', param: null, code: 'model_not_found' } }));
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.SERVER,
            error: 'Model "gpt-4o-mini" not found or not available to this key. Pick another GPT model.',
        });
    });

    it('5xx is SERVER', async () => {
        const { provider } = gpt(() => json(503, { error: { message: 'The server is overloaded.', type: 'server_error' } }));
        expect(await provider.test()).toMatchObject({ success: false, failure: FailureCatalog.SERVER });
    });

    it('a rejected fetch (CORS, DNS) is NETWORK', async () => {
        const { provider } = gpt(rejected);
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.NETWORK, error: 'Cannot reach api.openai.com (network or CORS).',
        });
    });

    it('a 400 that is not about the key has no category', async () => {
        const { provider } = gpt(() => json(400, { error: { message: "Unsupported parameter: 'max_tokens'.", type: 'invalid_request_error', param: 'max_tokens', code: 'unsupported_parameter' } }));
        const result = await provider.test();
        expect(result.success).toBe(false);
        expect(result.failure).toBeUndefined();
        expect(result.error).toMatch(/^API Error \(400\)/);
    });

    it('success is one call and no failure', async () => {
        const { provider, calls } = gpt(() => json(200, { id: 'c', object: 'chat.completion', created: 0, model: 'm', choices: [{ index: 0, message: { role: 'assistant', content: 'Hi' }, finish_reason: 'stop' }] }));
        expect(await provider.test()).toEqual({ success: true });
        expect(calls).toEqual(['https://api.openai.com/v1/chat/completions']);
    });

    it('Ollama: a 404 says the model is not pulled, a refused connection names the Base URL', async () => {
        const notFound = mockFetch(() => json(404, { error: { message: 'model "llama3" not found, try pulling it first', type: 'api_error' } }));
        const ollama = new OpenAICompatibleProvider(OLLAMA, { baseUrl: 'http://localhost:11434', model: 'llama3' }, { fetch: notFound.fn });
        expect(await ollama.test()).toEqual({
            success: false, failure: FailureCatalog.SERVER, error: 'Model "llama3" not found. Make sure it\'s pulled in Ollama.',
        });
        const down = mockFetch(rejected);
        const offline = new OpenAICompatibleProvider(OLLAMA, { baseUrl: 'http://localhost:11434', model: 'llama3' }, { fetch: down.fn });
        expect(await offline.test()).toEqual({
            success: false, failure: FailureCatalog.NETWORK, error: 'Cannot connect to Ollama at http://localhost:11434/v1. Make sure Ollama is running.',
        });
    });
});

describe('Anthropic test() classification', () => {
    it('401 authentication_error is AUTH', async () => {
        const { provider } = claude(() => json(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }));
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.AUTH, error: 'Invalid API key. Please check your key in the Anthropic Console.',
        });
    });

    it('APIConnectionError («Connection error.», a CORS block) is NETWORK', async () => {
        const { provider } = claude(rejected);
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.NETWORK, error: 'Cannot reach api.anthropic.com (network or CORS).',
        });
        // The SDK reports the rejected fetch as its APIConnectionError, with no status.
        const { provider: chat } = claude(rejected);
        const error = await chat.chat({ history: [{ role: 'user', content: 'Hi' }] }).catch(e => e);
        expect(error.constructor.name).toBe('APIConnectionError');
        expect(error.message).toBe('Connection error.');
        expect(error.status).toBeUndefined();
    });

    it('529 overloaded_error is SERVER', async () => {
        const { provider } = claude(() => json(529, { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }));
        expect(await provider.test()).toMatchObject({ success: false, failure: FailureCatalog.SERVER, error: 'Anthropic error (529). Please try again later.' });
    });
});

describe('test(modelId) calls the model the chat calls (#179)', () => {
    /** A Claude provider whose fetch records the `model` of every request body. */
    const recording = () => {
        const models: string[] = [];
        const fn = (async (_input: any, init?: RequestInit) => {
            models.push(JSON.parse(String(init?.body)).model);
            return json(200, { id: 'm', type: 'message', role: 'assistant', model: 'x', content: [{ type: 'text', text: 'Hi' }], stop_reason: 'end_turn', stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 } });
        }) as typeof fetch;
        const spec: ProviderSpec = { ...CLAUDE, seedModels: [new AIModel('claude-haiku-5-5'), new AIModel('claude-sonnet-5')] };
        return { models, provider: new AnthropicCompatibleProvider(spec, { apiKey: 'sk-ant-test', model: 'claude-haiku-5-5' }, { fetch: fn }) };
    };

    it('sends the chat-preference model, not the configured one', async () => {
        const { models, provider } = recording();
        expect(await provider.test('claude-sonnet-5')).toEqual({ success: true });
        await provider.chat({ model: 'claude-sonnet-5', history: [{ role: 'user', content: 'Hi' }] });
        expect(models).toEqual(['claude-sonnet-5', 'claude-sonnet-5']);
    });

    it('without a model it tests the configured one', async () => {
        const { models, provider } = recording();
        expect(await provider.test()).toEqual({ success: true });
        expect(models).toEqual(['claude-haiku-5-5']);
    });
});

describe('Gemini test() classification', () => {
    it('ApiError 400 API_KEY_INVALID is AUTH, not the API JSON', async () => {
        const { provider } = gemini(() => json(400, { error: {
            code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT',
            details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID', domain: 'googleapis.com' }],
        } }));
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.AUTH, error: 'Invalid API key or key not allowed. Check your key in Google AI Studio.',
        });
    });

    it('5xx is SERVER', async () => {
        const { provider } = gemini(() => json(503, { error: { code: 503, message: 'The model is overloaded.', status: 'UNAVAILABLE' } }));
        expect(await provider.test()).toMatchObject({ success: false, failure: FailureCatalog.SERVER, error: 'Google error (503). Please try again later.' });
    });

    it('429 RESOURCE_EXHAUSTED is RATE', async () => {
        const { provider } = gemini(() => json(429, { error: { code: 429, message: 'Resource has been exhausted.', status: 'RESOURCE_EXHAUSTED' } }));
        expect(await provider.test()).toMatchObject({ success: false, failure: FailureCatalog.RATE });
    });

    it('a rejected fetch is NETWORK', async () => {
        const { provider } = gemini(rejected);
        expect(await provider.test()).toEqual({
            success: false, failure: FailureCatalog.NETWORK, error: 'Cannot reach generativelanguage.googleapis.com (network or CORS).',
        });
    });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));

const PROD = 'https://jjodel-ai-proxy.alfonso99.workers.dev';

describe('AI.getEndpoint: the proxy URL comes from VITE_AI_PROXY_URL, default the production Worker', () => {
    beforeEach(() => {
        vi.resetModules();
        const storage = new Map<string, string>();
        vi.stubGlobal('localStorage', {
            getItem: (key: string) => storage.get(key) ?? null,
            setItem: (key: string, value: string) => storage.set(key, value),
        });
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.unstubAllGlobals();
    });

    it('uses the production Worker when the variable is unset', async () => {
        vi.stubEnv('VITE_AI_PROXY_URL', '');
        const { AI } = await import('../jodie');
        expect(AI.Claude.getEndpoint()).toBe(`${PROD}/v1/anthropic/messages`);
    });

    it('uses the production Worker on localhost too: no local Worker unless opted in', async () => {
        vi.stubEnv('VITE_AI_PROXY_URL', '');
        vi.stubGlobal('window', { location: { hostname: 'localhost' } });
        const { AI } = await import('../jodie');
        expect(AI.Claude.getEndpoint()).toBe(`${PROD}/v1/anthropic/messages`);
    });

    it('uses the variable when set, without a trailing slash', async () => {
        vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:8787/');
        const { AI } = await import('../jodie');
        expect(AI.Claude.getEndpoint()).toBe('http://localhost:8787/v1/anthropic/messages');
    });

    it('leaves a provider without a proxy on its own endpoint', async () => {
        vi.stubEnv('VITE_AI_PROXY_URL', 'http://localhost:8787');
        const { AI } = await import('../jodie');
        expect(AI.GPT.getEndpoint()).toBe(AI.GPT.endpoint);
    });
});

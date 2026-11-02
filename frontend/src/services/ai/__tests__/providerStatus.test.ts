/**
 * R-AI-11, measured on today's code: what `AIConfig.getStatus` (types/jodie.ts) returns for a
 * provider row of the AI Assistant settings, before L2 moves it.
 *
 * It imports `types/jodie.ts`, which no file of `src/services/ai/` outside `__tests__/` may do: it
 * is deleted together with that file at L6 (spec §7).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../../joiner', () => ({
    RuntimeAccessible: () => (target: unknown) => target,
    Log: { eDevv: vi.fn() },
    U: { toInstanceOf: (value: object | null, ctor: { prototype: object }) =>
        value ? Object.assign(Object.create(ctor.prototype), value) : null },
}));
// The settings page imports the modal, whose chain reaches the redux store (window): the label does not use it.
vi.mock('../../../pages/settings/ProviderConfigModal', () => ({ ProviderConfigModal: () => null }));

let storage: Map<string, string>;
beforeEach(() => {
    vi.resetModules();
    storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: vi.fn() });
});
afterEach(() => vi.unstubAllGlobals());

function seed(provider: string, record: Record<string, unknown>): void {
    storage.set(`jjodie_provider_${provider.toLowerCase()}`, JSON.stringify({ name: provider, model: '', baseUrl: '', ...record }));
}

async function statusOf(provider: 'Claude' | 'Ollama'): Promise<{ text: string; class: string }> {
    const { AIConfig } = await import('../../../types/jodie');
    return AIConfig.get(provider).getStatus();
}

describe('R-AI-11: AIConfig.getStatus on today\'s code', () => {
    it('labels a configured, never tested provider «Not configured»: the condition is inverted', async () => {
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: false });
        expect(await statusOf('Claude')).toEqual({ text: 'Not configured', class: 'not-configured' });
    });

    it('labels an unconfigured provider «Ready»: the other half of the inversion', async () => {
        seed('Claude', { apiKey: '', enabled: false });
        expect(await statusOf('Claude')).toEqual({ text: 'Ready', class: 'ready' });
    });

    it('labels a keyless provider by its Base URL the same inverted way (Ollama)', async () => {
        seed('Ollama', { apiKey: '', baseUrl: 'http://localhost:11434', enabled: false });
        expect(await statusOf('Ollama')).toEqual({ text: 'Not configured', class: 'not-configured' });
    });

    it('labels a tested and enabled provider «Connected», a tested and disabled one «Error»', async () => {
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: true, lastTested: 1 });
        expect(await statusOf('Claude')).toEqual({ text: 'Connected', class: 'connected' });
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: false, lastTested: 1 });
        expect(await statusOf('Claude')).toEqual({ text: 'Error', class: 'error' });
    });
});

describe('R-AI-11: providerStatus, the new home of the label (pages/settings/AIAssistantSettings.tsx)', () => {
    async function newStatus(provider: 'Claude' | 'Ollama'): Promise<{ text: string; class: string }> {
        const { providerStatus } = await import('../../../pages/settings/AIAssistantSettings');
        const { ProviderConfigStore, registry } = await import('../index');
        return providerStatus(ProviderConfigStore.load(provider), registry.get(provider).enabled());
    }

    it('labels a configured, never tested provider «Ready»: the inversion is fixed', async () => {
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: false });
        expect(await newStatus('Claude')).toEqual({ text: 'Ready', class: 'ready' });
        seed('Ollama', { apiKey: '', baseUrl: 'http://localhost:11434', enabled: false });
        expect(await newStatus('Ollama')).toEqual({ text: 'Ready', class: 'ready' });
    });

    it('labels an unconfigured provider «Not configured»', async () => {
        seed('Claude', { apiKey: '', enabled: false });
        expect(await newStatus('Claude')).toEqual({ text: 'Not configured', class: 'not-configured' });
        expect(await newStatus('Ollama')).toEqual({ text: 'Not configured', class: 'not-configured' });
    });

    it('keeps «Connected» and «Error» for a tested provider, as today', async () => {
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: true, lastTested: 1 });
        expect(await newStatus('Claude')).toEqual({ text: 'Connected', class: 'connected' });
        seed('Claude', { apiKey: 'sk-ant-KEY', enabled: false, lastTested: 1 });
        expect(await newStatus('Claude')).toEqual({ text: 'Error', class: 'error' });
    });
});

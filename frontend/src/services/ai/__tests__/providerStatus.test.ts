/**
 * R-AI-11: the status label of a provider row of the AI Assistant settings. Before L2 it was
 * `AIConfig.getStatus` of types/jodie.ts, which inverted the configured/unconfigured condition:
 * measured on that code, a configured never-tested provider read «Not configured» and an
 * unconfigured one «Ready»; a tested one read «Connected» when enabled, «Error» when not.
 * #196 L6 lane 2 deleted types/jodie.ts and the half of this file that exercised it; the new home
 * of the label keeps the tested cases and fixes the inversion.
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

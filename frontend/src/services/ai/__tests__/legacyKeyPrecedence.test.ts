/**
 * R-AI-6, measured on today's code: an API key is stored twice, under `jjodie_provider_<name>` and
 * in the `providers` of the `jjodie-credentials` blob. This characterization test seeds the two
 * copies with different keys and records which one `types/jodie.ts` reads after `JodieConfig.load`,
 * and what a save writes into each. `config/ProviderConfigStore.ts` follows what it measures.
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

const PROVIDER_KEY = 'jjodie_provider_claude';
const BLOB_KEY = 'jjodie-credentials';

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

/** The blob as `JodieConfig.save` writes it: `providers` is an object keyed by provider name. */
function seedBlob(claudeKey: string): void {
    storage.set(BLOB_KEY, JSON.stringify({
        providers: { Claude: { name: 'Claude', apiKey: claudeKey, model: 'claude-opus-4-7', baseUrl: '', enabled: true } },
        dockWidth: 420, appVersion: '1.0.0',
    }));
}

function seedProvider(claudeKey: string): void {
    storage.set(PROVIDER_KEY, JSON.stringify({ name: 'Claude', apiKey: claudeKey, model: 'claude-opus-4-7', baseUrl: '', enabled: true }));
}

const blob = () => JSON.parse(storage.get(BLOB_KEY) ?? 'null');
const providerRecord = () => JSON.parse(storage.get(PROVIDER_KEY) ?? 'null');

describe('R-AI-6: which stored key copy today\'s code reads', () => {
    it('reads jjodie_provider_<name> when the two copies differ, in AIConfig.get and in JodieConfig.current', async () => {
        seedProvider('sk-ant-PROVIDER');
        seedBlob('sk-ant-BLOB');
        const { AIConfig, JodieConfig } = await import('../../../types/jodie');
        expect(AIConfig.get('Claude').apiKey).toBe('sk-ant-PROVIDER');
        expect(JodieConfig.current.providers.Claude.apiKey).toBe('sk-ant-PROVIDER');
    });

    it('never reads the blob copy: a key present only in the blob is not loaded', async () => {
        seedBlob('sk-ant-BLOB');
        const { AIConfig, JodieConfig } = await import('../../../types/jodie');
        expect(AIConfig.get('Claude').apiKey).toBe('');
        expect(JodieConfig.current.providers.Claude.apiKey).toBe('');
    });

    it('does not adopt the blob at load: an object `providers` fails the Array.isArray check, so dockWidth is not restored', async () => {
        seedProvider('sk-ant-PROVIDER');
        seedBlob('sk-ant-BLOB');
        const { JodieConfig } = await import('../../../types/jodie');
        expect(JodieConfig.current.dockWidth).toBeUndefined();
        // The load writes nothing: both copies are still as seeded.
        expect(blob().providers.Claude.apiKey).toBe('sk-ant-BLOB');
        expect(providerRecord().apiKey).toBe('sk-ant-PROVIDER');
    });
});

describe('R-AI-6: what a save writes into each copy today', () => {
    it('AIConfig.save writes the key into both copies', async () => {
        seedProvider('sk-ant-PROVIDER');
        seedBlob('sk-ant-BLOB');
        const { AIConfig } = await import('../../../types/jodie');
        const config = AIConfig.get('Claude');
        config.apiKey = 'sk-ant-SAVED';
        config.save();
        expect(providerRecord().apiKey).toBe('sk-ant-SAVED');
        expect(blob().providers.Claude.apiKey).toBe('sk-ant-SAVED');
    });

    it('AIConfig.update writes the provider key only and leaves the blob copy as it was', async () => {
        seedProvider('sk-ant-PROVIDER');
        seedBlob('sk-ant-BLOB');
        const { AIConfig } = await import('../../../types/jodie');
        AIConfig.get('Claude').update({ apiKey: 'sk-ant-UPDATED' });
        expect(providerRecord().apiKey).toBe('sk-ant-UPDATED');
        expect(blob().providers.Claude.apiKey).toBe('sk-ant-BLOB');
    });

    it('a save after a load rewrites the blob from memory: the seeded dockWidth is dropped', async () => {
        seedProvider('sk-ant-PROVIDER');
        seedBlob('sk-ant-BLOB');
        const { AIConfig } = await import('../../../types/jodie');
        AIConfig.get('Claude').save();
        expect(blob().dockWidth).toBeUndefined();
        expect(blob().appVersion).toBe('1.0.0');
    });
});

/**
 * #196 L1: the two stores on the localStorage keys of today (spec §5): round-trips, the two key
 * copies (R-AI-6), the blob fields the store does not own (R-AI-9), and the events they fire.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AIEvents } from '../../../events/registry';
import { CREDENTIALS_BLOB_KEY, ProviderConfigStore } from '../config/ProviderConfigStore';
import { AI_FEATURES, FeaturePreferenceStore } from '../config/FeaturePreferenceStore';
import { PROVIDER_IDS } from '../registry';

let storage: Map<string, string>;
let dispatched: CustomEvent[];
beforeEach(() => {
    storage = new Map<string, string>();
    dispatched = [];
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: (e: CustomEvent) => { dispatched.push(e); return true; } });
});
afterEach(() => vi.unstubAllGlobals());

const read = (key: string) => JSON.parse(storage.get(key) ?? 'null');

describe('ProviderConfigStore keys', () => {
    it('stores every provider under jjodie_provider_<name lowercase>', () => {
        expect(PROVIDER_IDS.map(p => ProviderConfigStore.storageKey(p))).toEqual([
            'jjodie_provider_claude', 'jjodie_provider_gpt', 'jjodie_provider_deepseek', 'jjodie_provider_gemini',
            'jjodie_provider_mistral', 'jjodie_provider_groq', 'jjodie_provider_ollama', 'jjodie_provider_kimi',
            'jjodie_provider_custom',
        ]);
        expect(CREDENTIALS_BLOB_KEY).toBe('jjodie-credentials');
    });

    it('round-trips apiKey, baseUrl, model and enabled through save and load, for every provider', () => {
        for (const p of PROVIDER_IDS) {
            ProviderConfigStore.save(p, { apiKey: `key-${p}`, baseUrl: `http://${p}`, model: `model-${p}`, enabled: true });
        }
        for (const p of PROVIDER_IDS) {
            expect(ProviderConfigStore.load(p)).toMatchObject({ apiKey: `key-${p}`, baseUrl: `http://${p}`, model: `model-${p}`, enabled: true });
            expect(ProviderConfigStore.get(p)).toEqual({ apiKey: `key-${p}`, baseUrl: `http://${p}`, model: `model-${p}` });
        }
    });

    it('reads a record written by today\'s AIConfig as it is, and keeps its other fields on save', () => {
        storage.set('jjodie_provider_claude', JSON.stringify({
            name: 'Claude', apiKey: 'sk-ant-old', model: 'claude-opus-4-7', baseUrl: 'https://api.anthropic.com/v1/messages',
            enabled: true, lastTested: 1700000000000, lastTestOk: true, replacedModel: 'claude-3-opus-20240229', messages: [],
        }));
        expect(ProviderConfigStore.get('Claude')).toEqual({ apiKey: 'sk-ant-old', model: 'claude-opus-4-7', baseUrl: 'https://api.anthropic.com/v1/messages' });
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-new' });
        expect(read('jjodie_provider_claude')).toEqual({
            name: 'Claude', apiKey: 'sk-ant-new', model: 'claude-opus-4-7', baseUrl: 'https://api.anthropic.com/v1/messages',
            enabled: true, lastTested: 1700000000000, lastTestOk: true, replacedModel: 'claude-3-opus-20240229', messages: [],
        });
    });

    it('nothing stored, or a malformed record, loads as null and builds an empty config', () => {
        expect(ProviderConfigStore.load('GPT')).toBeNull();
        expect(ProviderConfigStore.get('GPT')).toEqual({});
        storage.set('jjodie_provider_gpt', '{not json');
        expect(ProviderConfigStore.load('GPT')).toBeNull();
    });
});

describe('ProviderConfigStore, the two key copies (R-AI-6)', () => {
    it('reads the jjodie_provider_<name> copy when the blob copy differs', () => {
        storage.set('jjodie_provider_claude', JSON.stringify({ apiKey: 'sk-ant-PROVIDER' }));
        storage.set(CREDENTIALS_BLOB_KEY, JSON.stringify({ providers: { Claude: { apiKey: 'sk-ant-BLOB' } } }));
        expect(ProviderConfigStore.get('Claude').apiKey).toBe('sk-ant-PROVIDER');
    });

    it('never reads the blob copy: a key present only in the blob is not loaded', () => {
        storage.set(CREDENTIALS_BLOB_KEY, JSON.stringify({ providers: { Claude: { apiKey: 'sk-ant-BLOB' } } }));
        expect(ProviderConfigStore.get('Claude').apiKey).toBeUndefined();
    });

    it('a save writes the key into both copies', () => {
        storage.set(CREDENTIALS_BLOB_KEY, JSON.stringify({ providers: { Claude: { apiKey: 'sk-ant-BLOB' } } }));
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-SAVED' });
        expect(read('jjodie_provider_claude').apiKey).toBe('sk-ant-SAVED');
        expect(read(CREDENTIALS_BLOB_KEY).providers.Claude.apiKey).toBe('sk-ant-SAVED');
    });

    it('with no blob yet, a save creates it with the provider copy', () => {
        ProviderConfigStore.save('GPT', { apiKey: 'sk-1' });
        expect(read(CREDENTIALS_BLOB_KEY)).toEqual({ providers: { GPT: { name: 'GPT', apiKey: 'sk-1' } } });
    });
});

describe('ProviderConfigStore, the blob fields it does not own (R-AI-9)', () => {
    it('round-trips dockWidth, position, size, appVersion, another provider and an unknown field unchanged', () => {
        const other = { name: 'GPT', apiKey: 'sk-other', model: 'gpt-4o', enabled: false };
        storage.set(CREDENTIALS_BLOB_KEY, JSON.stringify({
            providers: { GPT: other, Claude: { apiKey: 'sk-ant-old' } },
            dockWidth: 420, position: { x: 10, y: 20 }, size: { width: 300, height: 500 }, appVersion: '1.0.0', future: { a: [1, 2] },
        }));
        ProviderConfigStore.save('Claude', { apiKey: 'sk-ant-new' });
        const blob = read(CREDENTIALS_BLOB_KEY);
        expect(blob.dockWidth).toBe(420);
        expect(blob.position).toEqual({ x: 10, y: 20 });
        expect(blob.size).toEqual({ width: 300, height: 500 });
        expect(blob.appVersion).toBe('1.0.0');
        expect(blob.future).toEqual({ a: [1, 2] });
        expect(blob.providers.GPT).toEqual(other);
        expect(blob.providers.Claude.apiKey).toBe('sk-ant-new');
    });
});

describe('ProviderConfigStore events', () => {
    it('a save fires PROVIDER_CHANGED with { provider, config } as AIConfig.save does', () => {
        const record = ProviderConfigStore.save('Groq', { apiKey: 'gsk_1', model: 'groq/compound' });
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].type).toBe(AIEvents.PROVIDER_CHANGED);
        expect(dispatched[0].type).toBe('ai-provider-changed');
        expect(dispatched[0].detail).toEqual({ provider: 'Groq', config: record });
        expect(dispatched[0].detail.config).toEqual({ name: 'Groq', apiKey: 'gsk_1', model: 'groq/compound' });
    });
});

describe('FeaturePreferenceStore', () => {
    it('stores every feature under jjodel_provider_<feature> as { providerId, modelId, updatedAt }', () => {
        expect(AI_FEATURES).toEqual(['documentation', 'chat', 'scriptblock', 'mappings', 'explain']);
        for (const f of AI_FEATURES) FeaturePreferenceStore.set(f, 'Claude', `model-${f}`);
        for (const f of AI_FEATURES) {
            const stored = read(`jjodel_provider_${f}`);
            expect(stored).toMatchObject({ providerId: 'Claude', modelId: `model-${f}` });
            expect(typeof stored.updatedAt).toBe('number');
            expect(FeaturePreferenceStore.get(f)).toEqual(stored);
        }
    });

    it('reads a preference written by today\'s AIConfig.setPreferred', () => {
        storage.set('jjodel_provider_chat', JSON.stringify({ providerId: 'GPT', modelId: 'gpt-4o', updatedAt: 1 }));
        expect(FeaturePreferenceStore.get('chat')).toEqual({ providerId: 'GPT', modelId: 'gpt-4o', updatedAt: 1 });
    });

    it('with no modelId, keeps the stored one for the same provider and drops it for another', () => {
        FeaturePreferenceStore.set('chat', 'Claude', 'claude-opus-4-7');
        expect(FeaturePreferenceStore.set('chat', 'Claude').modelId).toBe('claude-opus-4-7');
        expect(FeaturePreferenceStore.set('chat', 'GPT').modelId).toBeUndefined();
    });

    it('a set fires SETTINGS_CHANGED with the detail of AIConfig.setPreferred', () => {
        FeaturePreferenceStore.set('mappings', 'Gemini', 'gemini-3.7-flash');
        expect(dispatched).toHaveLength(1);
        expect(dispatched[0].type).toBe(AIEvents.SETTINGS_CHANGED);
        expect(dispatched[0].type).toBe('ai-settings-changed');
        expect(dispatched[0].detail).toEqual({ type: 'feature-preference', feature: 'mappings', providerId: 'Gemini', modelId: 'gemini-3.7-flash' });
    });

    it('reset removes the key; get then answers null', () => {
        FeaturePreferenceStore.set('explain', 'GPT');
        FeaturePreferenceStore.reset('explain');
        expect(storage.has('jjodel_provider_explain')).toBe(false);
        expect(FeaturePreferenceStore.get('explain')).toBeNull();
    });
});

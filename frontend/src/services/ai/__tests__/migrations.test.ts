/**
 * #196 L1: the four load-time migrations of the stored preferences (spec §6), copied from
 * `AIConfig` in types/jodie.ts with the same sentinels, run through the registry's model directory.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    FeaturePreferenceStore, GLOBAL_DEFAULT_KEY, GLOBAL_TO_PER_FEATURE_SENTINEL, LEGACY_MODEL_IDS_SENTINEL,
} from '../config/FeaturePreferenceStore';
import { hashKey } from '../catalog/catalogCache';
import { modelDirectory, registry } from '../registry';

let storage: Map<string, string>;
beforeEach(() => {
    storage = new Map<string, string>();
    vi.stubGlobal('localStorage', {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
        removeItem: (key: string) => storage.delete(key),
    });
    vi.stubGlobal('window', { dispatchEvent: () => true });
    vi.spyOn(console, 'info').mockImplementation(() => {});
});
afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

const read = (key: string) => JSON.parse(storage.get(key) ?? 'null');
const pref = (providerId: string, modelId?: string) => JSON.stringify({ providerId, modelId, updatedAt: 1 });
const snapshot = () => new Map(storage);

describe('the sentinels and the legacy key', () => {
    it('keeps the names of today', () => {
        expect(LEGACY_MODEL_IDS_SENTINEL).toBe('jjodel_migration:legacy_model_ids_v1');
        expect(GLOBAL_TO_PER_FEATURE_SENTINEL).toBe('jjodel_migration:global_to_per_feature');
        expect(GLOBAL_DEFAULT_KEY).toBe('jjodel_default_provider');
    });
});

describe('migrateGlobalDefaultToPerFeature', () => {
    it('gives every feature without a preference the global default, and leaves jjodel_default_provider in place', () => {
        storage.set(GLOBAL_DEFAULT_KEY, 'GPT');
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-opus-4-7'));
        FeaturePreferenceStore.migrateGlobalDefaultToPerFeature();
        for (const f of ['documentation', 'scriptblock', 'mappings', 'explain']) {
            expect(read(`jjodel_provider_${f}`)).toMatchObject({ providerId: 'GPT' });
            expect(read(`jjodel_provider_${f}`).modelId).toBeUndefined();
        }
        expect(read('jjodel_provider_chat')).toEqual({ providerId: 'Claude', modelId: 'claude-opus-4-7', updatedAt: 1 });
        expect(storage.get(GLOBAL_TO_PER_FEATURE_SENTINEL)).toBe('1');
        expect(storage.get(GLOBAL_DEFAULT_KEY)).toBe('GPT');
    });

    it('sets the sentinel even with no global default, and a second run is a no-op', () => {
        FeaturePreferenceStore.migrateGlobalDefaultToPerFeature();
        expect(storage.get(GLOBAL_TO_PER_FEATURE_SENTINEL)).toBe('1');
        storage.set(GLOBAL_DEFAULT_KEY, 'Claude');
        const before = snapshot();
        FeaturePreferenceStore.migrateGlobalDefaultToPerFeature();
        expect(storage).toEqual(before);
        expect(storage.has('jjodel_provider_chat')).toBe(false);
    });
});

describe('migrateLegacyModelIds', () => {
    it('maps legacy ids in the per-feature preferences and in the provider records, then sets the sentinel', () => {
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-sonnet-4-20250514'));
        storage.set('jjodel_provider_documentation', pref('GPT', 'gpt-4o'));
        storage.set('jjodie_provider_claude', JSON.stringify({ name: 'Claude', apiKey: 'sk-ant-x', model: 'claude-opus-4-20250514' }));
        FeaturePreferenceStore.migrateLegacyModelIds(modelDirectory);
        expect(read('jjodel_provider_chat').modelId).toBe('claude-sonnet-4-6');
        expect(read('jjodel_provider_documentation')).toEqual({ providerId: 'GPT', modelId: 'gpt-4o', updatedAt: 1 });
        expect(read('jjodie_provider_claude')).toEqual({ name: 'Claude', apiKey: 'sk-ant-x', model: 'claude-opus-4-6' });
        expect(storage.get(LEGACY_MODEL_IDS_SENTINEL)).toBe('1');
    });

    it('honours the sentinel: once set, a legacy id is left as stored', () => {
        storage.set(LEGACY_MODEL_IDS_SENTINEL, '1');
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-sonnet-4-20250514'));
        storage.set('jjodie_provider_claude', JSON.stringify({ model: 'claude-opus-4-20250514' }));
        FeaturePreferenceStore.migrateLegacyModelIds(modelDirectory);
        expect(read('jjodel_provider_chat').modelId).toBe('claude-sonnet-4-20250514');
        expect(read('jjodie_provider_claude').model).toBe('claude-opus-4-20250514');
    });

    it('does not write the blob copy, as today', () => {
        storage.set('jjodie_provider_claude', JSON.stringify({ model: 'claude-opus-4-20250514' }));
        FeaturePreferenceStore.migrateLegacyModelIds(modelDirectory);
        expect(storage.has('jjodie-credentials')).toBe(false);
    });
});

describe('sanitizeForeignFeatureModels', () => {
    it('drops a model of another provider and keeps the provider choice', () => {
        storage.set('jjodel_provider_chat', pref('Claude', 'gpt-4o'));
        FeaturePreferenceStore.sanitizeForeignFeatureModels(modelDirectory);
        const stored = read('jjodel_provider_chat');
        expect(stored.providerId).toBe('Claude');
        expect('modelId' in stored).toBe(false);
    });

    it('counts the parked Llama list as another provider, as today', () => {
        storage.set('jjodel_provider_mappings', pref('Groq', 'gemma2-9b-it'));
        FeaturePreferenceStore.sanitizeForeignFeatureModels(modelDirectory);
        expect(read('jjodel_provider_mappings').modelId).toBeUndefined();
    });

    it('keeps an own model, a model no provider lists (a pulled Ollama tag), and a shared id', () => {
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-opus-4-7'));
        storage.set('jjodel_provider_explain', pref('Ollama', 'my-pulled-tag'));
        storage.set('jjodel_provider_scriptblock', pref('Groq', 'llama-3.3-70b-versatile'));
        const before = snapshot();
        FeaturePreferenceStore.sanitizeForeignFeatureModels(modelDirectory);
        expect(storage).toEqual(before);
    });

    it('never touches a provider record', () => {
        storage.set('jjodie_provider_claude', JSON.stringify({ apiKey: 'sk-ant-x', model: 'gpt-4o' }));
        FeaturePreferenceStore.sanitizeForeignFeatureModels(modelDirectory);
        expect(read('jjodie_provider_claude')).toEqual({ apiKey: 'sk-ant-x', model: 'gpt-4o' });
    });
});

describe('retireModels', () => {
    it('moves a retired Gemini model to the first current one, in a preference and in the record, naming the replaced id', () => {
        storage.set('jjodel_provider_chat', pref('Gemini', 'gemini-2.0-flash-exp'));
        storage.set('jjodie_provider_gemini', JSON.stringify({ apiKey: 'AIza1', model: 'gemini-pro' }));
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(read('jjodel_provider_chat').modelId).toBe('gemini-3.7-flash');
        expect(read('jjodie_provider_gemini')).toEqual({ apiKey: 'AIza1', model: 'gemini-3.7-flash', replacedModel: 'gemini-pro' });
    });

    it('records in the provider record a model retired only in a preference', () => {
        storage.set('jjodel_provider_chat', pref('Gemini', 'gemini-1.5-pro'));
        storage.set('jjodie_provider_gemini', JSON.stringify({ apiKey: 'AIza1', model: 'gemini-3.6-flash' }));
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(read('jjodie_provider_gemini')).toEqual({ apiKey: 'AIza1', model: 'gemini-3.6-flash', replacedModel: 'gemini-1.5-pro' });
    });

    it('has no sentinel: a retired model stored again is moved again on the next run', () => {
        storage.set('jjodel_provider_chat', pref('Gemini', 'gemini-pro'));
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(read('jjodel_provider_chat').modelId).toBe('gemini-3.7-flash');
        storage.set('jjodel_provider_chat', pref('Gemini', 'gemini-pro'));
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(read('jjodel_provider_chat').modelId).toBe('gemini-3.7-flash');
    });

    it('keeps the model when a live catalog is cached for the key', () => {
        storage.set('jjodie_provider_gemini', JSON.stringify({ apiKey: 'AIza1', model: 'gemini-pro' }));
        storage.set('jjodel_models_gemini', JSON.stringify({ fetchedAt: 0, keyHash: hashKey('AIza1'), models: [{ id: 'gemini-9', label: 'G9', family: 'flash', rank: 1 }] }));
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(read('jjodie_provider_gemini')).toEqual({ apiKey: 'AIza1', model: 'gemini-pro' });
    });

    it('does not retire another provider\'s deprecated model', () => {
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-3-opus-latest'));
        const before = snapshot();
        FeaturePreferenceStore.retireModels(modelDirectory);
        expect(storage).toEqual(before);
    });
});

describe('load', () => {
    it('runs the four migrations in the order of JodieConfig.load', () => {
        const order: string[] = [];
        for (const name of ['migrateGlobalDefaultToPerFeature', 'migrateLegacyModelIds', 'sanitizeForeignFeatureModels', 'retireModels'] as const) {
            vi.spyOn(FeaturePreferenceStore, name).mockImplementation(() => { order.push(name); });
        }
        registry.load();
        expect(order).toEqual(['migrateGlobalDefaultToPerFeature', 'migrateLegacyModelIds', 'sanitizeForeignFeatureModels', 'retireModels']);
    });

    it('a second load is a no-op once the migrations have run', () => {
        storage.set(GLOBAL_DEFAULT_KEY, 'Claude');
        storage.set('jjodel_provider_chat', pref('Claude', 'claude-sonnet-4-20250514'));
        storage.set('jjodie_provider_gemini', JSON.stringify({ apiKey: 'AIza1', model: 'gemini-pro' }));
        registry.load();
        expect(read('jjodel_provider_chat').modelId).toBe('claude-sonnet-4-6');
        expect(read('jjodel_provider_documentation').providerId).toBe('Claude');
        const after = snapshot();
        registry.load();
        expect(storage).toEqual(after);
    });
});

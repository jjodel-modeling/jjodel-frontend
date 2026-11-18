/**
 * The provider registry (#196, spec §4): providerId → a provider instance configured from the
 * stores, with the live catalog of its key when one is cached.
 *
 * The static seed lists, the legacy-id map and the retirement rule are copied from types/jodie.ts
 * (`AI.<provider>.add(...)`, `claudeLegacyIdMap`, `RETIRING_PROVIDERS`, `resolveCurrentModelId`,
 * `isForeignModel`); the old copies stay until L6. Llama and Copilot are parked there (no
 * endpoint, never routed) and are not providers here, but Llama's model ids still count for the
 * foreign-model guard, as they do today.
 */
import { AnthropicCompatibleProvider } from './AnthropicCompatibleProvider';
import type { BaseProvider } from './BaseProvider';
import { GoogleCompatibleProvider } from './GoogleCompatibleProvider';
import { OpenAICompatibleProvider } from './OpenAICompatibleProvider';
import { cachedModels, isCatalogProvider } from './catalog/catalogCache';
import { FeaturePreferenceStore } from './config/FeaturePreferenceStore';
import type { ModelDirectory } from './config/FeaturePreferenceStore';
import { ProviderConfigStore } from './config/ProviderConfigStore';
import type { ProviderConfig, ProviderId, ProviderOptions, ProviderSpec } from './types';
import { AIModel, EAuthScheme, ECapabilities } from './types';

/** Today's `ALL_AI_PROVIDERS` order, without the parked Llama and Copilot. */
export const PROVIDER_IDS: readonly ProviderId[] = ['Claude', 'GPT', 'DeepSeek', 'Gemini', 'Mistral', 'Groq', 'Ollama', 'Kimi', 'Custom'];

/** Older or renamed Claude ids mapped onto current ones. Only Claude has renames. */
export const claudeLegacyIdMap: Record<string, string> = {
    'claude-sonnet-4-20250514':   'claude-sonnet-4-6',
    'claude-opus-4-20250514':     'claude-opus-4-6',
    'claude-haiku-4-20250514':    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-latest',
    'claude-3-opus-20240229':     'claude-3-opus-latest',
};

/** One `.add(...)` of types/jodie.ts: id, label, pdf, vision, deprecated, context window. */
export type SeedRow = [id: string, label: string, pdf: boolean, vision: boolean, deprecated?: boolean, contextWindow?: number];

const unkn = false;

export const SEEDS: Record<ProviderId, SeedRow[]> = {
    GPT: [
        ['gpt-4o',                    'GPT-4o',           true,  false],
        ['gpt-4o-mini',               'GPT-4o Mini',      true,  false],
        ['gpt-4-turbo',               'GPT-4 Turbo',      true,  false],
        ['gpt-4',                     'GPT-4',            false, false],
        ['gpt-3.5-turbo',             'GPT-3.5 Turbo',    false, false],
    ],
    Claude: [
        ['claude-opus-4-7',           'Claude Opus 4.7',  true,  true, false, 200_000],
        ['claude-opus-4-6',           'Claude Opus 4.6',  true,  true, false, 200_000],
        ['claude-sonnet-4-6',         'Claude Sonnet 4.6',true,  true, false, 200_000],
        ['claude-haiku-4-5-20251001', 'Claude Haiku 4.5', true,  true, false, 200_000],
        // Legacy — kept for users with persisted selections on older IDs
        ['claude-3-5-sonnet-latest',  'Claude 3.5 Sonnet',true,  true, true,  200_000],
        ['claude-3-opus-latest',      'Claude 3 Opus',    true,  true, true,  200_000],
        ['claude-3-haiku-20240307',   'Claude 3 Haiku',   true,  true, true,  200_000],
    ],
    DeepSeek: [
        ['deepseek-chat',             'DeepSeek Chat',    false, false],
        ['deepseek-coder',            'DeepSeek Coder',   false, false],
    ],
    Gemini: [
        ['gemini-3.7-flash',          'Gemini 3.7 Flash', true,  true],
        ['gemini-3.6-flash',          'Gemini 3.6 Flash', true,  true],
        ['gemini-3.5-flash-lite',     'Gemini 3.5 Flash Lite',   true,  true],
        // Legacy — kept for users with persisted selections on older IDs
        ['gemini-2.0-flash-exp',      'Gemini 2.0 Flash', false, false, true],
        ['gemini-1.5-pro',            'Gemini 1.5 Pro',   true,  true, true],
        ['gemini-1.5-flash',          'Gemini 1.5 Flash', true,  true, true],
        ['gemini-pro',                'Gemini Pro',       false, false, true],
    ],
    Mistral: [
        ['mistral-large-latest',      'Mistral Large',    false, false],
        ['mistral-small-latest',      'Mistral Small',    false, false],
        ['pixtral-large-latest',      'Pixtral Large',    true,  false],
        ['pixtral-12b-2409',          'Pixtral 12B',      true,  false],
        ['codestral-latest',          'Codestral',        false, false],
        ['ministral-8b-latest',       'Ministral 8B',     false, false],
    ],
    Kimi: [
        ['moonshot-v1-8k',            'Moonshot V1 8K',   false, false],
        ['moonshot-v1-32k',           'Moonshot V1 32K',  false, false],
        ['moonshot-v1-128k',          'Moonshot V1 128K', false, false],
    ],
    Ollama: [
        ['llama3.2',                  'Llama 3.2',        false, false],
        ['llama3.2:1b',               'Llama 3.2 1B',     false, false],
        ['llama3.1',                  'Llama 3.1',        false, false],
        ['mistral',                   'Mistral',          false, false],
        ['codellama',                 'Code Llama',       false, false],
        ['llava',                     'LLaVA',            true,  false],
        ['qwen2.5',                   'Qwen 2.5',         false, false],
    ],
    Groq: [
        ['groq/compound', 'Compound', unkn, unkn],
        ['groq/compound-mini', 'Compound Mini', unkn, unkn],
        ['llama-3.1-8b-instant', 'Llama 3.1 8B', unkn, unkn],
        ['llama-3.3-70b-versatile', 'Llama 3.3 70B', unkn, unkn],
        ['meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 scout 17B 16E', unkn, unkn],
        ['meta-llama/llama-prompt-guard-2-22m', 'Llama Prompt Guard 2 22M', unkn, unkn],
        ['meta-llama/llama-prompt-guard-2-86m', 'Prompt Guard 2 86M', unkn, unkn],
        ['openai/gpt-oss-120b', 'GPT OSS 120B', unkn, unkn],
        ['openai/gpt-oss-20b', 'GPT OSS 20B', unkn, unkn],
        ['openai/gpt-oss-safeguard-20b', 'Safety GPT OSS 20B', unkn, unkn],
        ['whisper-large-v3', 'Whisper', unkn, unkn],
        ['whisper-large-v3-turbo', 'Whisper Large V3 Turbo', unkn, unkn],
        ['moonshotai/kimi-k2-instruct-0905', 'Kimi K2 0905', unkn, unkn],
        ['qwen/qwen3-32b', 'Qwen3-32B', unkn, unkn],
        ['canopylabs/orpheus-v1-english', 'Canopy Labs Orpheus V1 English', unkn, unkn],
    ],
    Custom: [
        ['custom', 'Custom', false, false],
    ],
};

/** The model ids of the parked Llama entry of types/jodie.ts: not a provider, still a foreign-model owner. */
const PARKED_MODEL_IDS: Record<string, readonly string[]> = {
    Llama: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'llava-v1.5-7b-4096-preview', 'gemma2-9b-it'],
};

/**
 * Providers whose static list is every model their endpoint still serves (#179): without a live
 * catalog, a deprecated or unlisted id there is a retired model.
 */
const RETIRING_PROVIDERS: readonly ProviderId[] = ['Gemini'];

function seedModel([id, label, pdf, vision, , contextWindow]: SeedRow): AIModel {
    const capabilities: ECapabilities[] = [];
    if (vision) capabilities.push(ECapabilities.IMAGES);
    if (pdf) capabilities.push(ECapabilities.DOCUMENTS);
    return new AIModel(id, label, capabilities, contextWindow);
}

function openaiSpec(name: ProviderId, company: string, baseUrl: string, extra: Partial<ProviderSpec> = {}): ProviderSpec {
    return { name, company, family: 'openai', baseUrl, authScheme: EAuthScheme.BEARER, requiresKey: true, seedModels: SEEDS[name].map(seedModel), ...extra };
}

export const PROVIDER_SPECS: Readonly<Record<ProviderId, ProviderSpec>> = {
    GPT:      openaiSpec('GPT',      'OpenAI',   'https://api.openai.com/v1/chat/completions'),
    DeepSeek: openaiSpec('DeepSeek', 'DeepSeek', 'https://api.deepseek.com/v1/chat/completions'),
    Mistral:  openaiSpec('Mistral',  'Mistral',  'https://api.mistral.ai/v1/chat/completions'),
    Groq:     openaiSpec('Groq',     'Groq',     'https://api.groq.com/openai/v1/chat/completions'),
    Kimi:     openaiSpec('Kimi',     'Moonshot', 'https://api.moonshot.cn/v1/chat/completions'),
    // Default local endpoint; the user's Base URL replaces it, and enables the provider.
    Ollama:   openaiSpec('Ollama',   'Ollama',   'http://localhost:11434/v1/chat/completions', { authScheme: EAuthScheme.NONE, requiresKey: false, userBaseUrl: true }),
    Custom:   openaiSpec('Custom',   'Custom',   '', { userBaseUrl: true }),
    Claude: {
        name: 'Claude', company: 'Anthropic', family: 'anthropic', baseUrl: 'https://api.anthropic.com/v1/messages',
        authScheme: EAuthScheme.X_API_KEY, requiresKey: true, seedModels: SEEDS.Claude.map(seedModel), legacyIds: claudeLegacyIdMap,
    },
    Gemini: {
        name: 'Gemini', company: 'Google', family: 'google', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
        authScheme: EAuthScheme.QUERY_KEY, requiresKey: true, seedModels: SEEDS.Gemini.map(seedModel),
    },
};

function isProviderId(id: string): id is ProviderId {
    return (PROVIDER_IDS as readonly string[]).includes(id);
}

/** The stored settings; with none, the first seed model is the provider's model, as `new JodieConfig()` sets it. */
function configOf(id: ProviderId): ProviderConfig {
    const config = ProviderConfigStore.get(id);
    return { ...config, model: config.model ?? PROVIDER_SPECS[id].seedModels[0]?.apiName };
}

function liveModelsOf(id: ProviderId, apiKey: string | undefined): AIModel[] {
    return isCatalogProvider(id) ? cachedModels(id, apiKey) ?? [] : [];
}

/** Every id `provider` lists (seed and live catalog), a parked entry's ids, or none. */
function modelIdsOf(provider: string): Set<string> {
    if (isProviderId(provider)) return new Set(registry.get(provider).models().map(m => m.apiName));
    return new Set(PARKED_MODEL_IDS[provider] ?? []);
}

function listedByOther(provider: string, modelId: string): boolean {
    return [...PROVIDER_IDS, ...Object.keys(PARKED_MODEL_IDS)].some(p => p !== provider && modelIdsOf(p).has(modelId));
}

function legacy(provider: string, modelId: string | undefined): string | undefined {
    if (!modelId || !isProviderId(provider)) return modelId;
    return PROVIDER_SPECS[provider].legacyIds?.[modelId] ?? modelId;
}

/** The answers the migrations of FeaturePreferenceStore need. */
export const modelDirectory: ModelDirectory = {
    providers: () => PROVIDER_IDS,
    legacy,
    current(provider, modelId) {
        const id = legacy(provider, modelId);
        // A live catalog lists what the key can use: a missing model is flagged and kept, never swapped.
        if (!id || !isProviderId(provider) || !RETIRING_PROVIDERS.includes(provider)) return id;
        if (liveModelsOf(provider, configOf(provider).apiKey).length) return id;
        const rows = SEEDS[provider];
        const row = rows.find(r => r[0] === id);
        if (row && !row[4]) return id;
        return rows.find(r => !r[4])?.[0] ?? id;
    },
    isForeign(provider, modelId) {
        if (!modelId || modelIdsOf(provider).has(modelId)) return false;
        return listedByOther(provider, modelId);
    },
};

export const registry = {
    /** A provider built from its stored settings and the cached catalog of its key. */
    get(id: ProviderId, options: ProviderOptions = {}): BaseProvider {
        const spec = PROVIDER_SPECS[id];
        const config = configOf(id);
        const wiring: ProviderOptions = {
            isModelOfOtherProvider: modelId => listedByOther(id, modelId),
            liveModels: () => liveModelsOf(id, config.apiKey),
            ...options,
        };
        switch (spec.family) {
            case 'anthropic': return new AnthropicCompatibleProvider(spec, config, wiring);
            case 'google':    return new GoogleCompatibleProvider(spec, config, wiring);
            default:          return new OpenAICompatibleProvider(spec, config, wiring);
        }
    },

    /** Every provider, in registry order. */
    all(options?: ProviderOptions): BaseProvider[] {
        return PROVIDER_IDS.map(id => registry.get(id, options));
    },

    /** The configured providers, in registry order (`JodieConfig.getEnabledProviders`). */
    enabled(options?: ProviderOptions): BaseProvider[] {
        return registry.all(options).filter(p => p.enabled());
    },

    /** The load-time migrations of the stored preferences, as `JodieConfig.load` runs them. */
    load(): void {
        FeaturePreferenceStore.load(modelDirectory);
    },
};

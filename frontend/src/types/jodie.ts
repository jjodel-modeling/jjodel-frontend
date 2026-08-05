/**
 * Jodie AI Assistant Types
 * Type definitions for the multi-provider AI assistant
 */
import type {Dictionary, GObject} from "../joiner";
import {
    Log,
    RuntimeAccessible,
    U
} from "../joiner";
import { AIEvents } from '../events/registry';

// Provider logo imports
import openaiLogo from '../assets/icons/providers/openai.svg';
import anthropicLogo from '../assets/icons/providers/anthropic.svg';
import deepseekLogo from '../assets/icons/providers/deepseek.svg';
import mistralLogo from '../assets/icons/providers/mistral.svg';
import geminiLogo from '../assets/icons/providers/gemini.svg';
import groqLogo from '../assets/icons/providers/groq.svg';
import kimiLogo from '../assets/icons/providers/kimi.svg';
import ollamaLogo from '../assets/icons/providers/ollama.svg';

export class AIProvider {
    static isValidProvider(provider: any): provider is TAIProvider { return !!companymap[provider as TAIProvider]; }
    static isValidCompany(company: any): company is TAICompany { return !!aimap[company as TAICompany]; }

    public static Claude = "Claude" as const;
    public static GPT = "GPT" as const;
    public static DeepSeek = "DeepSeek" as const;
    public static Gemini = "Gemini" as const;
    public static Mistral = "Mistral" as const;
    public static Groq = "Groq" as const;
    public static Ollama = "Ollama" as const; // different company from llama
    public static Llama = "Llama" as const; // from meta
    public static Copilot = "Copilot" as const;
    public static Kimi = "Kimi" as const;
    public static Custom = "Custom" as const;
}

export class AICompany {
    public static Anthropic = "Anthropic" as const;
    public static OpenAI = "OpenAI" as const;
    public static DeepSeek = "DeepSeek" as const;
    public static Google = "Google" as const;
    public static Mistral = "Mistral" as const;
    public static Groq = "Groq" as const;
    public static Ollama = "Ollama" as const;
    public static Meta = "Meta" as const;
    public static Microsoft = "Microsoft" as const;
    public static Moonshot = "Moonshot" as const;
    public static Custom = "Custom" as const;
}

const aimap: Dictionary<TAICompany, TAIProvider> = {
    [AICompany.Anthropic]: AIProvider.Claude,
    [AICompany.OpenAI]:    AIProvider.GPT,
    [AICompany.DeepSeek]:  AIProvider.DeepSeek,
    [AICompany.Google]:    AIProvider.Gemini,
    [AICompany.Mistral]:   AIProvider.Mistral,
    [AICompany.Groq]:      AIProvider.Groq,
    [AICompany.Ollama]:    AIProvider.Ollama,
    [AICompany.Meta]:      AIProvider.Llama,
    [AICompany.Microsoft]: AIProvider.Copilot,
    [AICompany.Moonshot]:  AIProvider.Kimi,
    [AICompany.Custom]:    AIProvider.Custom,
};
const companymap: Dictionary<TAIProvider, TAICompany> = {} as any;
for (let k in aimap) { let k0 = k as TAICompany; let v = aimap[k0]; if (typeof v === 'string') companymap[v] = k0; }

export function getAICompany(provider: TAIProvider): TAICompany { return companymap[provider]; }
export function getAIProvider(company: TAICompany): TAIProvider { return aimap[company]; }

export type TAIProvider = Exclude<Exclude<Exclude<keyof typeof AIProvider, "prototype">, 'isValidProvider'>, 'isValidCompany'>;
export type TAICompany  = Exclude<Exclude<Exclude<keyof typeof AICompany,  "prototype">, 'isValidProvider'>, 'isValidCompany'>;

// All supported providers in display order
export const ALL_AI_PROVIDERS: TAIProvider[] = Object.keys(companymap) as any;
export const ALL_AI_COMPANIES: TAICompany[] = Object.keys(aimap) as any;

export type AIFeature = 'documentation' | 'chat' | 'scriptblock' | 'mappings' | 'explain';
export interface ProviderPreference {
    providerId: string;
    /** Optional model identifier, persisted per-feature. When absent, callers fall back
     * to the provider's `AIConfig.model` (legacy location during the deprecation window). */
    modelId?: string;
    updatedAt: number;
}

/**
 * Maps older/renamed Claude model IDs onto current ones. Used at load-time to migrate
 * persisted selections silently, and at read-time as a safety net. Extend per-provider
 * if future renames happen elsewhere.
 *
 * NOTE(future — Pattern C): when dynamic model discovery lands, these maps should still
 * apply as a pre-filter before querying the provider endpoint, so a rollback does not
 * strand users on a name the endpoint no longer recognizes.
 */
export const claudeLegacyIdMap: Record<string, string> = {
    'claude-sonnet-4-20250514':   'claude-sonnet-4-6',
    'claude-opus-4-20250514':     'claude-opus-4-6',
    'claude-haiku-4-20250514':    'claude-haiku-4-5-20251001',
    'claude-3-5-sonnet-20241022': 'claude-3-5-sonnet-latest',
    'claude-3-opus-20240229':     'claude-3-opus-latest',
};

/** Per-provider legacy ID maps. Only Claude has renames in this pass; other providers
 * preserve their existing IDs unchanged. Add more entries here when renaming elsewhere. */
const legacyIdMaps: Partial<Record<TAIProvider, Record<string, string>>> = {
    Claude: claudeLegacyIdMap,
} as any;

/**
 * Resolve a (possibly legacy) model ID to its current canonical form for the given provider.
 * Returns the input unchanged if no mapping applies.
 */
export function resolveLegacyModelId(provider: TAIProvider, modelId: string | undefined): string | undefined {
    if (!modelId) return modelId;
    const map = legacyIdMaps[provider];
    if (!map) return modelId;
    return map[modelId] ?? modelId;
}

/**
 * True when `modelId` is a known model of `provider` (present in its version registry).
 */
export function isModelOfProvider(provider: TAIProvider, modelId: string | undefined): boolean {
    return !!(modelId && AI[provider]?.versions?.[modelId]);
}

/**
 * True when `modelId` clearly belongs to a DIFFERENT provider — absent from `provider`'s
 * registry but present in some other provider's registry. Models that are in no registry
 * (custom / user-pulled Ollama tags) are NOT considered foreign, so they stay usable.
 * Used to block provider/model mismatches (e.g. an OpenAI "gpt-4o" model sent to Claude).
 */
export function isForeignModel(provider: TAIProvider, modelId: string | undefined): boolean {
    if (!modelId) return false;
    if (isModelOfProvider(provider, modelId)) return false;
    return ALL_AI_PROVIDERS.some(p => p !== provider && !!AI[p]?.versions?.[modelId]);
}

@RuntimeAccessible('AI')
export class AI{
    static cname = 'AI';
    static GPT: AI;
    static Claude: AI;
    static DeepSeek: AI;
    static Gemini: AI;
    static Mistral: AI;
    static Groq: AI;
    static Ollama: AI;
    static Llama: AI;
    static Copilot: AI;
    static Kimi: AI;
    static Custom: AI;
    static ACTIVE_PROVIDER_KEY = 'jjodie_active_provider';
    static WINDOW_STATE_KEY = 'jjodel_jodie_window';
    static LEGACY_SETTINGS_KEY = 'jjodie-settings';
    static DOCUMENTATION_STORAGE_PREFIX = 'jjodie_doc_';
    static GLOBAL_DEFAULT_KEY = 'jjodel_default_provider';
    static STORAGE_PREFIX = 'jjodel_provider_';
    static STORAGE_GLOBAL_CONFIG: string = 'jjodie-credentials';
    static get(provider: TAIProvider): AI { return AI[provider]; }
    name: TAIProvider;
    company: TAICompany;
    keyUrl: string;
    storageKey: string;
    versions: Dictionary<string, AIVersion> = {};
    // version?: string;
    endpoint!: string;
    proxy?: string;
    requiresKey: boolean = true;
    /** Auth scheme for OpenAI-compatible request construction (consumed by
     *  AIProviderService.chatOpenAICompatible / testOpenAICompatible). Default 'bearer'
     *  (Authorization: Bearer). Claude uses 'x-api-key', Gemini 'query-key', Ollama 'none'. */
    authScheme: 'bearer' | 'x-api-key' | 'query-key' | 'none' = 'bearer';
    // gui stuff
    color!: string;
    bgColor!: string;
    keyPlaceholder!: string;
    initial!: string;
    logo?: string; // img url
    bi_icon?: string; // bootstrap icon

    constructor(name: TAIProvider, company: TAICompany, keyUrl: string) {
        this.name = name;
        this.company = company;
        this.keyUrl = keyUrl;
        this.storageKey = "jjodie_provider_" + name.toLowerCase();
        (AI as any)[name] = this;
    }

    addGUIinfo(initial: string, keyPlaceholder: string, color: string, background: string, logo?: string){
        this.initial = initial;
        this.keyPlaceholder = keyPlaceholder;
        this.color = color;
        this.bgColor = background;
        this.logo = logo;
    }

    add(name: string, label: string, pdf: boolean = false, vision: boolean = false, deprecated: boolean = false, contextWindow?: number): this {
        this.versions[name] = new AIVersion(label, pdf, vision, deprecated, contextWindow);
        // if (!this.version) this.version = name;
        return this;
    }
    getEndpoint(): string {
        // Proxy endpoints for providers that don't support CORS
        // Update the subdomain after deploying the Cloudflare Worker
        const PROXY_URL = 'https://jjodel-ai-proxy.alfonso99.workers.dev';
        const PROXY_LOCAL_URL = 'http://localhost:8787';

        if (!this.proxy || window.location.hostname === 'localhost') return this.endpoint;
        /*switch (this.name) {
            case AIProvider.Claude:
            case AIProvider.Gemini:
            default: return '';
        }*/
        return PROXY_URL + this.proxy;
    }
    hasVision(version?: string): boolean{
        let model = version && this.versions[version];
        if (model) return model.capabilities.vision;
        else return Object.values(this.versions).some(v=> v.capabilities.vision);
    }
    hasPdf(version?: string): boolean{
        let model = version && this.versions[version];
        if (model) return model.capabilities.pdf;
        else return Object.values(this.versions).some(v=> v.capabilities.pdf);
    }
    hasAttachments(version?: string): boolean{
        let model = version && this.versions[version];
        if (model) return model.capabilities.vision || model.capabilities.pdf;
        else return Object.values(this.versions).some(v=> v.capabilities.vision || v.capabilities.pdf);
    }

    static getActiveVersion(provider: TAIProvider): AIVersion | null {
        return AI[provider].versions[AIConfig.get(provider).model] || null;
    }
}

export class AIVersion {
    label: string;
    capabilities: {
        pdf: boolean;
        vision: boolean;
    }
    deprecated: boolean;
    /**
     * Context window size in tokens. Optional — omit when the figure is unknown or
     * provider-dependent. Used by UI to surface capability badges.
     */
    contextWindow?: number;
    constructor(label: string, pdf: boolean = false, vision: boolean = false, deprecated: boolean = false, contextWindow?: number) {
        this.label = label;
        this.capabilities = {pdf, vision};
        this.deprecated = deprecated;
        this.contextWindow = contextWindow;
    }
}

new AI(AIProvider.GPT,      AICompany.OpenAI,   'https://platform.openai.com/api-keys',       );
new AI(AIProvider.Claude,   AICompany.Anthropic,'https://console.anthropic.com/settings/keys',);
new AI(AIProvider.Gemini,   AICompany.Google,   'https://aistudio.google.com/apikey',         );
new AI(AIProvider.DeepSeek, AICompany.DeepSeek, 'https://platform.deepseek.com/api_keys',     );
new AI(AIProvider.Mistral,  AICompany.Mistral,  'https://console.mistral.ai/api-keys',        );
new AI(AIProvider.Groq,     AICompany.Groq,     'https://console.groq.com/keys',              );
new AI(AIProvider.Kimi,     AICompany.Moonshot, 'https://platform.moonshot.cn/console/api-keys',                                          );
new AI(AIProvider.Ollama,   AICompany.Ollama,   '',); // Ollama is local, no API key page
new AI(AIProvider.Llama,    AICompany.Meta,     '?',                                          );
new AI(AIProvider.Copilot,  AICompany.Microsoft,'?',                                          );
new AI(AIProvider.Custom,   AICompany.Custom,   '',                                           );
AI.Ollama.requiresKey = false;

// template new AI(AIProvider., AICompany., '', '', 'sk-...', );
AI.GPT     .addGUIinfo('GPT','sk-...',      '#059669', '#D1FAE5', openaiLogo);
AI.Claude  .addGUIinfo('C',  'sk-ant-...',  '#D97706', '#FEF3C7', anthropicLogo);
AI.Mistral .addGUIinfo('M',  '',            '#ff7000', '#EDE9FE', mistralLogo);
AI.Gemini  .addGUIinfo('Gm', 'AIza...',     '#7C3AED', '#EDE9FE', geminiLogo);
AI.DeepSeek.addGUIinfo('D',  'sk-...',      '#2563EB', '#DBEAFE', deepseekLogo);
AI.Groq    .addGUIinfo('Gq', 'gsk_...',     '#EF4444', '#FEE2E2', groqLogo);
AI.Kimi    .addGUIinfo('K',  '',            '#0891B2', '#CFFAFE', kimiLogo);
AI.Ollama  .addGUIinfo('O',  '',            '#475569', '#F1F5F9', ollamaLogo);
AI.Llama   .addGUIinfo('L',  '',            '#8a6565', '#FEE2E2', );
AI.Copilot .addGUIinfo('Cp', '',            '#4ab409', '#FEE2E2', );
AI.Custom  .addGUIinfo('-', 'Enter api key','#000',    '#fff',);

AI.GPT
    .add('gpt-4o',                    'GPT-4o',           true,  false)
    .add('gpt-4o-mini',               'GPT-4o Mini',      true,  false)
    .add('gpt-4-turbo',               'GPT-4 Turbo',      true,  false)
    .add('gpt-4',                     'GPT-4',            false, false)
    .add('gpt-3.5-turbo',             'GPT-3.5 Turbo',    false, false)
AI.Claude
    .add('claude-opus-4-7',           'Claude Opus 4.7',  true,  true, false, 200_000)
    .add('claude-opus-4-6',           'Claude Opus 4.6',  true,  true, false, 200_000)
    .add('claude-sonnet-4-6',         'Claude Sonnet 4.6',true,  true, false, 200_000)
    .add('claude-haiku-4-5-20251001', 'Claude Haiku 4.5', true,  true, false, 200_000)
    // Legacy — kept for users with persisted selections on older IDs
    .add('claude-3-5-sonnet-latest',  'Claude 3.5 Sonnet',true,  true, true,  200_000)
    .add('claude-3-opus-latest',      'Claude 3 Opus',    true,  true, true,  200_000)
    .add('claude-3-haiku-20240307',   'Claude 3 Haiku',   true,  true, true,  200_000)
AI.DeepSeek
    .add('deepseek-chat',             'DeepSeek Chat',    false, false)
    .add('deepseek-coder',            'DeepSeek Coder',   false, false)
AI.Gemini
    .add('gemini-3.5-flash',          'Gemini 3.5 Flash', true,  true)
    .add('gemini-1.5-pro',            'Gemini 1.5 Pro',   true,  true)
    .add('gemini-1.5-flash',          'Gemini 1.5 Flash', true,  true)
    .add('gemini-pro',                'Gemini Pro',       false, false, true)
AI.Mistral
    .add('mistral-large-latest',      'Mistral Large',    false, false)
    .add('mistral-small-latest',      'Mistral Small',    false, false)
    .add('pixtral-large-latest',      'Pixtral Large',    true,  false)
    .add('pixtral-12b-2409',          'Pixtral 12B',      true,  false)
    .add('codestral-latest',          'Codestral',        false, false)
    .add('ministral-8b-latest',       'Ministral 8B',     false, false)
AI.Llama
    .add('llama-3.3-70b-versatile',   'Llama 3.3 70B',    false, false)
    .add('llama-3.1-8b-instant',      'Llama 3.1 8B',     false, false)
    .add('mixtral-8x7b-32768',        'Mixtral 8x7B',     false, false)
    .add('llava-v1.5-7b-4096-preview','LLaVA 1.5 7B',     true,  false)
    .add('gemma2-9b-it',              'Gemma 2 9B',       false, false)
AI.Copilot;

AI.Kimi
    .add('moonshot-v1-8k',            'Moonshot V1 8K',   false, false)
    .add('moonshot-v1-32k',           'Moonshot V1 32K',  false, false)
    .add('moonshot-v1-128k',          'Moonshot V1 128K', false, false)
AI.Ollama
    .add('llama3.2',                  'Llama 3.2',        false, false)
    .add('llama3.2:1b',               'Llama 3.2 1B',     false, false)
    .add('llama3.1',                  'Llama 3.1',        false, false)
    .add('mistral',                   'Mistral',          false, false)
    .add('codellama',                 'Code Llama',       false, false)
    .add('llava',                     'LLaVA',            true,  false)
    .add('qwen2.5',                   'Qwen 2.5',         false, false)
const unkn = false;
AI.Groq // NB: groq is infrastructure provider, not llm. but have a LLM made of mergers of other models?
// Groq
    .add('groq/compound', 'Compound', unkn, unkn)
    .add('groq/compound-mini', 'Compound Mini', unkn, unkn)
// Meta
    .add('llama-3.1-8b-instant', 'Llama 3.1 8B', unkn, unkn)
    .add('llama-3.3-70b-versatile', 'Llama 3.3 70B', unkn, unkn)
    // .add('meta-llama/llama-4-maverick-17b-128e-instruct', '', unkn, unkn) // Deprecated
    .add('meta-llama/llama-4-scout-17b-16e-instruct', 'Llama 4 scout 17B 16E', unkn, unkn)
    // .add('meta-llama/llama-guard-4-12b', '', unkn, unkn) // Deprecated
    .add('meta-llama/llama-prompt-guard-2-22m', 'Llama Prompt Guard 2 22M', unkn, unkn)
    .add('meta-llama/llama-prompt-guard-2-86m', 'Prompt Guard 2 86M', unkn, unkn)
// OpenAI
    .add('openai/gpt-oss-120b', 'GPT OSS 120B', unkn, unkn)
    .add('openai/gpt-oss-20b', 'GPT OSS 20B', unkn, unkn)
    .add('openai/gpt-oss-safeguard-20b', 'Safety GPT OSS 20B', unkn, unkn)
    .add('whisper-large-v3', 'Whisper', unkn, unkn)
    .add('whisper-large-v3-turbo', 'Whisper Large V3 Turbo', unkn, unkn)
// Moonshot AI
    // .add('moonshotai/kimi-k2-instruct', 'Kimi K2 Instruct', unkn, unkn) // Deprecated
    .add('moonshotai/kimi-k2-instruct-0905', 'Kimi K2 0905', unkn, unkn)
// Alibaba Cloud
    .add('qwen/qwen3-32b', 'Qwen3-32B', unkn, unkn)
// Canopy Labs
    // arabic language ai is too niche .add('canopylabs/orpheus-arabic-saudi', 'Canopy Labs Orpheus Arabic Saudi', unkn, unkn)
    .add('canopylabs/orpheus-v1-english', 'Canopy Labs Orpheus V1 English', unkn, unkn)

/*AI.???
    .add('mixtral-8x7b-32768',               'Mixtral 8x7B',        false, false)
    .add('llava-v1.5-7b-4096-preview',       'LLaVA 1.5 7B',        true,  false)
    .add('gemma2-9b-it',                     'Gemma 2 9B',          false, false)
    .add('llava-v1.5-7b-4096-preview',       'LLaVA 1.5 7B',        true,  false)
*/
AI.Claude.proxy = '/v1/anthropic/messages';
AI.Gemini.proxy = '/v1/gemini';

AI.GPT.endpoint = 'https://api.openai.com/v1/chat/completions';
AI.Claude.endpoint = 'https://api.anthropic.com/v1/messages';
AI.DeepSeek.endpoint = 'https://api.deepseek.com/v1/chat/completions';
AI.Gemini.endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';
AI.Mistral.endpoint = 'https://api.mistral.ai/v1/chat/completions';
AI.Groq.endpoint = 'https://api.groq.com/openai/v1/chat/completions';
AI.Kimi.endpoint = 'https://api.moonshot.cn/v1/chat/completions';
AI.Ollama.endpoint = 'http://localhost:11434/v1/chat/completions'; // Default local, configurable via baseUrl

// Auth scheme per provider (registry-driven; read by the OpenAI-compatible transport in
// AIProviderService). The 'bearer' assignments are explicit for clarity even though it is the
// class default. Llama/Copilot are parked (no endpoint, not routed) and keep the default.
AI.GPT.authScheme      = 'bearer';
AI.DeepSeek.authScheme = 'bearer';
AI.Mistral.authScheme  = 'bearer';
AI.Groq.authScheme     = 'bearer';
AI.Kimi.authScheme     = 'bearer';
AI.Custom.authScheme   = 'bearer';
AI.Claude.authScheme   = 'x-api-key';
AI.Gemini.authScheme   = 'query-key';
AI.Ollama.authScheme   = 'none';

AI.GPT.bi_icon = 'openai'; // chat-dots bubble speech generic candidate
AI.Claude.bi_icon = 'claude';
AI.DeepSeek.bi_icon = 'robot'; // missing
AI.Gemini.bi_icon = 'stars';
AI.Mistral.bi_icon = 'robot'; // missing
AI.Groq.bi_icon = 'robot'; // missing
AI.Llama.bi_icon = 'meta';
AI.Kimi.bi_icon = 'moon';
AI.Ollama.bi_icon = 'robot'; // missing

type TAIVersion = string;

@RuntimeAccessible('AIConfig')
export class AIConfig{
    static cname = 'AIConfig';
    private static map: Dictionary<TAIProvider, ProviderConfig> = {} as any;
    // static default: AIConfig;
    name: TAIProvider;
    model: TAIVersion;
    enabled: boolean;
    apiKey: string = '';
    baseUrl: string; // equivalent to AI.endpoint? redundant?
    lastTested?: number;
    /** Outcome of the most recent connection test for the current key: true=passed, false=failed,
     *  undefined=not tested (or invalidated by a credential edit). Drives the Settings status pill. */
    lastTestOk?: boolean;
    messages: ChatMessage[] = [];
    isOpen: boolean = false;
    isMinimized: boolean = false;
    isWaiting: boolean = false;
    hasUnread: boolean = false;
    lastUsed?: number;

    // loads config if it was saved, or create a new config.
    static new(name: TAIProvider, model: TAIVersion, url?:string){
        let ret: AIConfig = AIConfig.get(name);
        if (ret) return;
        else return new AIConfig(name, model, url);
    }

    private constructor(name: TAIProvider, model: TAIVersion, url?:string) {
        this.name = name;
        this.model = model;
        this.baseUrl = url || '';
        this.enabled = false;
        AIConfig.map[name] = this;
    }

    static get(provider: TAIProvider): AIConfig {
        let config: AIConfig | null;
        try {
            let llm = AI[provider];
            const json = localStorage.getItem(llm.storageKey);
            if (!json) config = null;
            else config = JSON.parse(json);
            config = U.toInstanceOf(config, AIConfig as any);
        } catch { config = null; }
        if (config) {
            AIConfig.map[provider] = config;
            // JodieConfig.current.providers[provider] = config;
            return config;
        }
        return AIConfig.map[provider];
    }
    static set(provider: TAIProvider, config: Partial<AIConfig>): void { AIConfig.get(provider).update(config); }

    static getPreferred(feature: AIFeature): TAIProvider {
        try {
            // 1. Check per-feature override
            const stored = localStorage.getItem(`${AI.STORAGE_PREFIX}${feature}`);
            if (stored) {
                const pref: ProviderPreference = JSON.parse(stored);
                return pref.providerId as TAIProvider;
            }
        } catch (e) {
            console.warn(`Failed to read provider preference for ${feature}:`, e);
        }

        // 2. First enabled provider in declaration order (no global default).
        return AIConfig.getFirstEnabledProvider();
    }

    /**
     * Returns the first provider that is configured/enabled, in declaration order.
     * Falls back to the first declared provider if none are enabled, preserving today's
     * behavior (Claude was the pre-seeded default) so callers get a non-null TAIProvider.
     */
    private static getFirstEnabledProvider(): TAIProvider {
        const enabled = JodieConfig.getEnabledProviders();
        if (enabled.length > 0) return enabled[0];
        return ALL_AI_PROVIDERS[0];
    }

    static setPreferred(feature: AIFeature, providerId: TAIProvider, modelId?: string): void {
        // If modelId not supplied, preserve any previously-stored modelId for this feature.
        let preservedModelId = modelId;
        if (preservedModelId === undefined) {
            try {
                const existing = localStorage.getItem(`${AI.STORAGE_PREFIX}${feature}`);
                if (existing) {
                    const prev: ProviderPreference = JSON.parse(existing);
                    // Only preserve if the previous modelId still belongs to this provider's registry.
                    if (prev.providerId === providerId && prev.modelId) preservedModelId = prev.modelId;
                }
            } catch { /* ignore */ }
        }
        const pref: ProviderPreference = {providerId, modelId: preservedModelId, updatedAt: Date.now()};
        localStorage.setItem(`${AI.STORAGE_PREFIX}${feature}`, JSON.stringify(pref));
        // Notify listeners (e.g. Jodie.tsx re-reads current provider/model) that a preference changed.
        window.dispatchEvent(new CustomEvent(AIEvents.SETTINGS_CHANGED, {
            detail: { type: 'feature-preference', feature, providerId, modelId: preservedModelId }
        }));
    }

    /**
     * Returns the per-feature model selection, resolving legacy IDs through the map.
     * Returns undefined when no model has been chosen for this feature.
     * Callers should fall back to the provider's AIConfig.model if they need a concrete ID.
     */
    static getPreferredModel(feature: AIFeature): string | undefined {
        try {
            const stored = localStorage.getItem(`${AI.STORAGE_PREFIX}${feature}`);
            if (!stored) return undefined;
            const pref: ProviderPreference = JSON.parse(stored);
            if (!pref.modelId) return undefined;
            const resolved = resolveLegacyModelId(pref.providerId as TAIProvider, pref.modelId);
            // Integrity guard: a stored modelId that belongs to a different provider than
            // pref.providerId is a corrupted preference — ignore it so callers fall back to
            // the provider's own default model (prevents a provider/model mismatch on send).
            if (resolved && isForeignModel(pref.providerId as TAIProvider, resolved)) return undefined;
            return resolved;
        } catch {
            return undefined;
        }
    }

    /**
     * Resolve the effective (provider, model) pair for a feature. The provider falls back
     * to first-enabled; the model falls back to the provider's AIConfig.model if no per-feature
     * modelId has been recorded yet (legacy location during deprecation window).
     */
    static resolveFeatureSelection(feature: AIFeature): { providerId: TAIProvider; modelId: string } {
        const providerId = AIConfig.getPreferred(feature);
        const perFeature = AIConfig.getPreferredModel(feature);
        const modelId = perFeature ?? AIConfig.get(providerId)?.model ?? '';
        return { providerId, modelId };
    }

    /**
     * One-shot migration from the legacy global default (`jjodel_default_provider`)
     * to per-feature preferences (`jjodel_provider_<feature>`). Idempotent: protected
     * by a sentinel key so it never runs twice. Silent unless something fails.
     *
     * Deprecation window (Phase 3): the legacy `jjodel_default_provider` key is NOT
     * deleted here — leaving it for one release so that users rolling back do not
     * lose their preference. TODO: remove the key read + the `AI.GLOBAL_DEFAULT_KEY`
     * constant in the next release once migration has run on all installs.
     */
    /**
     * One-shot migration that rewrites any persisted legacy model IDs to their current
     * canonical form, for both per-feature preferences and per-provider AIConfig.model.
     * Idempotent: sentinel-protected. Silent.
     */
    static migrateLegacyModelIds(): void {
        const SENTINEL_KEY = 'jjodel_migration:legacy_model_ids_v1';
        try {
            if (localStorage.getItem(SENTINEL_KEY) === '1') return;

            // 1. Per-feature preferences (jjodel_provider_<feature>)
            const features: AIFeature[] = ['documentation', 'chat', 'scriptblock', 'mappings', 'explain'];
            for (const feature of features) {
                const key = `${AI.STORAGE_PREFIX}${feature}`;
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                try {
                    const pref: ProviderPreference = JSON.parse(raw);
                    if (!pref.modelId) continue;
                    const resolved = resolveLegacyModelId(pref.providerId as TAIProvider, pref.modelId);
                    if (resolved && resolved !== pref.modelId) {
                        pref.modelId = resolved;
                        pref.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(pref));
                    }
                } catch { /* skip malformed entries */ }
            }

            // 2. Per-provider AIConfig.model (stored under AI[provider].storageKey)
            for (const providerName of ALL_AI_PROVIDERS) {
                const llm = AI[providerName];
                if (!llm?.storageKey) continue;
                const raw = localStorage.getItem(llm.storageKey);
                if (!raw) continue;
                try {
                    const cfg = JSON.parse(raw);
                    const currentModel: string | undefined = cfg?.model;
                    const resolved = resolveLegacyModelId(providerName, currentModel);
                    if (resolved && resolved !== currentModel) {
                        cfg.model = resolved;
                        localStorage.setItem(llm.storageKey, JSON.stringify(cfg));
                    }
                } catch { /* skip malformed entries */ }
            }

            localStorage.setItem(SENTINEL_KEY, '1');
        } catch (e) {
            console.warn('[jodie] migrateLegacyModelIds failed:', e);
        }
    }

    /**
     * One-time sanitizer for already-corrupted per-feature preferences: drops any stored
     * modelId that belongs to a different provider than its own pref.providerId (e.g. a
     * "chat" pref left pointing at an OpenAI model under the Claude provider). Keeps the
     * provider choice; the read path then falls back to that provider's own default model.
     *
     * Idempotent: only writes when it actually repairs something, so a clean install is a
     * no-op and re-running finds nothing to fix. Never reads or writes provider credential
     * storage (jjodie_provider_<name>) — it only touches jjodel_provider_<feature> prefs,
     * which contain no API keys — so it can never drop a stored key. Logs one concise line
     * when (and only when) it repairs at least one preference.
     */
    static sanitizeForeignFeatureModels(): void {
        try {
            const features: AIFeature[] = ['documentation', 'chat', 'scriptblock', 'mappings', 'explain'];
            let repaired = 0;
            for (const feature of features) {
                const key = `${AI.STORAGE_PREFIX}${feature}`;
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                try {
                    const pref: ProviderPreference = JSON.parse(raw);
                    if (!pref.modelId) continue;
                    const resolved = resolveLegacyModelId(pref.providerId as TAIProvider, pref.modelId) ?? pref.modelId;
                    if (isForeignModel(pref.providerId as TAIProvider, resolved)) {
                        delete pref.modelId; // keep providerId; never touches credential storage
                        pref.updatedAt = Date.now();
                        localStorage.setItem(key, JSON.stringify(pref));
                        repaired++;
                    }
                } catch { /* skip malformed entries */ }
            }
            if (repaired > 0) console.info(`[jodie] sanitizeForeignFeatureModels: repaired ${repaired} mismatched per-feature model preference(s).`);
        } catch (e) {
            console.warn('[jodie] sanitizeForeignFeatureModels failed:', e);
        }
    }

    static migrateGlobalDefaultToPerFeature(): void {
        const SENTINEL_KEY = 'jjodel_migration:global_to_per_feature';
        try {
            if (localStorage.getItem(SENTINEL_KEY) === '1') return;
            const globalDefault = localStorage.getItem(AI.GLOBAL_DEFAULT_KEY);
            if (globalDefault) {
                // Enumerate every feature in the AIFeature union. Keep in sync with the type.
                const features: AIFeature[] = ['documentation', 'chat', 'scriptblock', 'mappings', 'explain'];
                for (const feature of features) {
                    const key = `${AI.STORAGE_PREFIX}${feature}`;
                    if (localStorage.getItem(key) === null) {
                        const pref: ProviderPreference = { providerId: globalDefault, updatedAt: Date.now() };
                        localStorage.setItem(key, JSON.stringify(pref));
                    }
                }
            }
            localStorage.setItem(SENTINEL_KEY, '1');
        } catch (e) {
            console.warn('[jodie] migrateGlobalDefaultToPerFeature failed:', e);
        }
    }

    /**
     * Resetta la preferenza al default
     */
    static resetPreference(feature: AIFeature): void {
        localStorage.removeItem(`${AI.STORAGE_PREFIX}${feature}`);
    }

    update(config: Partial<AIConfig>): void{
        let provider = this.name;
        try {
            const existing = AIConfig.get(provider);
            const updated: AIConfig = {...existing, ...config} as AIConfig;
            localStorage.setItem(AI[this.name].storageKey, JSON.stringify(updated));
            AIConfig.map[this.name] = updated;

            // Dispatch event to notify other components
            window.dispatchEvent(new CustomEvent(AIEvents.PROVIDER_CHANGED, {
                detail: { provider, config: updated }
            }));
        } catch (error) {
            console.error(`Failed to save provider config for ${provider}:`, error);
        }}
    save(cascadeGlobal: boolean = true){
        const aiConfig = AI[this.name];
        if (!aiConfig?.storageKey) {
            console.warn(`[AIConfig2.save] No AI config found for provider: ${this.name}`);
            return;
        }
        localStorage.setItem(aiConfig.storageKey, JSON.stringify(this));
        // Dispatch event to notify other components
        window.dispatchEvent(new CustomEvent(AIEvents.PROVIDER_CHANGED, {
            detail: { provider: this.name, config: this }
        }));
        if (cascadeGlobal) JodieConfig.current.save(false);
        // NB: no need to update JodieConfig.current too bcs this structure is nested in it.
    }

    requiresKey() { return AI[this.name].requiresKey; }
    hasValidKey() { return this.isConfigured(); } // this.apiKey || !this.requiresKey(); }

    // For Ollama: show success if enabled + lastTested (no API key required)
    // For others: show success if apiKey + enabled + lastTested
    wasSuccessfullyTested() { return this.hasValidKey() && this.enabled && this.lastTested; }

    getStatus() {
        // NB: when config is changed, lastTested is erased too in ProviderConfigModal
        if (this.lastTested) {
            if (this.enabled) return { text: 'Connected', class: 'connected' };
            else return { text: 'Error', class: 'error' };
        }

        if (this.isConfigured()) return { text: 'Not configured', class: 'not-configured' };

        // Has API key but not tested = Ready to test
        return { text: 'Ready', class: 'ready' };
    };

    isConfigured() : boolean {
        if (!this?.name) return false;
        let llm = AI[this.name];
        if (!llm) return false;
        let config = this;
        if (llm.name === AIProvider.Custom) return !!(config.baseUrl || config.apiKey);
        else return !!(llm.requiresKey ? config.apiKey : config.baseUrl);
    }
}

/*new AIConfig(AIProvider.Claude, 'claude-sonnet-4-20250514');
new AIConfig(AIProvider.GPT, 'gpt-4o');
new AIConfig(AIProvider.DeepSeek, 'deepseek-chat');
new AIConfig(AIProvider.Gemini, 'gemini-3.5-flash');
new AIConfig(AIProvider.Mistral, 'mistral-large-latest');
new AIConfig(AIProvider.Groq, 'llama-3.3-70b-versatile');
new AIConfig(AIProvider.Kimi, 'moonshot-v1-8k');
new AIConfig(AIProvider.Ollama, 'llama3.2', 'http://localhost:11434');*/
// NB: Default Ollama base URL (can be overridden in provider config)


export type ProviderConfig = AIConfig;

@RuntimeAccessible('JodieConfig')
export class JodieConfig {
    static cname = 'JodieConfig';
    static default: JodieConfig = new JodieConfig();
    static current: JodieConfig = JodieConfig.load();
    providers: Dictionary<TAIProvider, ProviderConfig>;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
    appVersion: string =  '1.0.0';

    constructor() {
        (AIConfig as any).map = {};
        for (let name of ALL_AI_PROVIDERS) {
            let llm = AI[name];
            AIConfig.new(name, Object.keys(llm.versions)[0], llm.requiresKey ? llm.endpoint : undefined);
        }
        this.providers = (AIConfig as any).map;
    }

    public save(cascadeIndividuals: boolean = true): this{
        try {
            const json = JSON.stringify(this);
            let name: TAIProvider;
            localStorage.setItem(AI.STORAGE_GLOBAL_CONFIG, json);
            if (cascadeIndividuals) for (name in this.providers) {
                this.providers[name]?.save(false);
            }
        } catch (error) {
            console.error('[CredentialsService] Failed to save store:', error);
            throw new Error('Failed to save credentials');
        }
        return this;
    }
    static load(json?: string | GObject | null): JodieConfig {
        // One-shot migrations (both sentinel-protected + idempotent).
        // (1) Legacy global default → per-feature preferences.
        // (2) Legacy/renamed model IDs in persisted state → current canonical IDs.
        // Placed at the very start so they run regardless of which exit path load() takes.
        AIConfig.migrateGlobalDefaultToPerFeature();
        AIConfig.migrateLegacyModelIds();
        // (3) Repair per-feature prefs whose modelId belongs to a different provider.
        AIConfig.sanitizeForeignFeatureModels();

        let data: GObject<JodieConfig>;
        if (!json) json = localStorage.getItem(AI.STORAGE_GLOBAL_CONFIG);
        try {
            data = (typeof json === 'string' ? JSON.parse(json) : json) as JodieConfig;
        } catch (e) {
            Log.eDevv('Failed to load JodieConfig:', {json});
            if (!JodieConfig.current) JodieConfig.current = new JodieConfig();
            return JodieConfig.current;
        }

        // Validate structure
        if (!data || !Array.isArray(data.providers)) {
            // if it fails on first load (both no argument and no saved stuff in storage), just initialize at default
            if (!JodieConfig.current) {
                JodieConfig.current = new JodieConfig();
                return JodieConfig.current;
            }
            Log.eDevv('JodieConfig: Invalid credentials format', {data, json});
            return JodieConfig.current;
        }

        data = U.toInstanceOf(data, JodieConfig);
        (AIConfig as any).map = data.providers;
        let k: TAIProvider;
        for (k in data.providers) {
            data.providers[k] = U.toInstanceOf(data.providers[k], AIConfig as any);
        }
        JodieConfig.current = data;
        return data.save(true);
    }

    static hasEnabledProviders() { return JodieConfig.getEnabledProviders().length > 0; }
    static getEnabledProviders(): TAIProvider[] {
        return ALL_AI_PROVIDERS.filter(provider => {
            if (!provider) return false;
            const config = AIConfig.get(provider);
            return !!config?.isConfigured();
        });
    }

    export(): string { return JSON.stringify(this, null, 2); }

}

/**
 * Image attached to a chat message
 */
export interface ChatImage {
    id: string;
    data: string;        // Base64 encoded image data
    mimeType: string;    // e.g., 'image/png', 'image/jpeg'
    preview: string;     // Data URL for preview display
    name?: string;       // Optional filename
}

/**
 * Document (PDF) attached to a chat message
 */
export interface ChatDocument {
    id: string;
    data: string;        // Base64 encoded document data
    mimeType: string;    // e.g., 'application/pdf'
    name: string;        // Filename (required for documents)
    size: number;        // File size in bytes
}

export interface ChatMessage {
    id: string;
    /** Discriminator. Optional for backwards-compatibility; absent treated as 'chat'. */
    kind?: 'chat';
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    provider?: TAIProvider;
    userName?: string;
    images?: ChatImage[];      // Attached images for vision-capable providers
    documents?: ChatDocument[]; // Attached documents (PDF) for supported providers
    jjscriptResult?: {         // JjScript command result metadata
        success: boolean;
        command: string;
        input?: string;        // original typed input, for the one-shot "Ask Jjodie" on a parse error
    };
    /**
     * Jjodie-mode offer: set when the typed input parsed as a complete JjScript
     * command. Rendered as an offer card ([Esegui] / [Chiedi a Jjodie]) instead
     * of being run silently or sent to the LLM. `consumed` disables the buttons
     * after a tap.
     */
    jjscriptOffer?: { input: string; consumed?: boolean };
}

// ============================================
// CONSOLE MODE (Jjodie / JjScript / JjEL)
// ============================================

// One console mode per language provider (id ↔ mode, 1:1). Legacy persisted
// values ('chat'/'code') are normalized on boot in Jodie.tsx.
export type ConsoleMode = 'jjodie' | 'jjscript' | 'jjel';
export type CodeFlavor = 'jjel' | 'js';

/** Cycle/selection order used by the chip picker and the Cmd+J / Ctrl+. cycle. */
export const CONSOLE_MODES: ConsoleMode[] = ['jjodie', 'jjscript', 'jjel'];

/** Human-facing label per mode (chip + picker). */
export const CONSOLE_MODE_LABELS: Record<ConsoleMode, string> = {
    jjodie: 'Jjodie',
    jjscript: 'JjScript',
    jjel: 'JjEL',
};

/** Origin of a console mode switch — groundwork for the announced switch event. */
export type ConsoleModeSwitchVia = 'cmdj' | 'ctrl-dot' | 'pill' | 'slash' | 'backtick';

/** REPL-style entry produced when the console runs in Code mode. */
export interface CodeEntry {
    id: string;
    kind: 'code';
    flavor: CodeFlavor;
    input: string;
    output:
        | { ok: true; value: unknown }
        | { ok: false; error: string };
    timestamp: number;
    /**
     * Diagnostic warnings emitted during evaluation (e.g. references to
     * undefined identifiers). Always defined; absent when the source had no
     * issues. Independent of `output.ok` — a successful expression can carry
     * warnings, and a failure does not necessarily produce them.
     */
    warnings?: CodeWarning[];
    /** Raw JjEL value when ok, retained for the inline inspector. */
    rawValue?: unknown;
}

/**
 * UI-side projection of a JjEL evaluator warning. Decoupled from
 * `JjelWarning` so the type used in chat history doesn't bleed jjel internals
 * into types/jodie. Today they map 1:1.
 */
export interface CodeWarning {
    kind: 'undefined-identifier' | 'property-not-found' | 'ambiguous-instance';
    identifier: string;
    suggestion: string | null;
    /** ambiguous-instance only: number of pool instances sharing the name. */
    count?: number;
    /** ambiguous-instance only: a sample owning class name for the hint, or null. */
    sampleClass?: string | null;
}

/** Anything that may appear in the unified Jjodie history. */
export type ConsoleEntry = ChatMessage | CodeEntry;

export function isCodeEntry(e: ConsoleEntry): e is CodeEntry {
    return (e as CodeEntry).kind === 'code';
}

export function isChatEntry(e: ConsoleEntry): e is ChatMessage {
    return (e as CodeEntry).kind !== 'code';
}

/**
 * Check if a provider/model combination supports vision (image input)
 * Uses the model capabilities from PROVIDER_MODELS
 * /
export function supportsVision(provider: TAIProvider, model?: string): boolean {
    // If model specified, check its capabilities
    if (model) {
        const capabilities = getModelCapabilities(provider, model);
        return capabilities.vision;
    }

    // If no model specified, check if provider has any vision-capable model
    // Return true if the default/first model supports vision
    const models = PROVIDER_MODELS[provider];
    if (models && models.length > 0) {
        return models[0].capabilities.vision;
    }

    return false;
}

/**
 * Check if a provider/model combination supports PDF documents
 * Uses the model capabilities from PROVIDER_MODELS
 * /
export function supportsPDF(provider: TAIProvider, model?: string): boolean {
    // If model specified, check its capabilities
    if (model) {
        const capabilities = getModelCapabilities(provider, model);
        return capabilities.pdf;
    }

    // If no model specified, check if provider has any PDF-capable model
    // Return true if the default/first model supports PDF
    const models = PROVIDER_MODELS[provider];
    if (models && models.length > 0) {
        return models[0].capabilities.pdf;
    }

    return false;
}

/**
 * Check if a provider/model supports any attachments (images or PDFs)
 * /
export function supportsAttachments(provider: TAIProvider, model?: string): boolean {
    return supportsVision(provider, model) || supportsPDF(provider, model);
}
*/

export interface ChatState {
    /** Unified history: chat messages and code REPL entries, sorted chronologically. */
    messages: ConsoleEntry[];
    isOpen: boolean;
    isMinimized: boolean;
    isWaiting: boolean;
    hasUnread: boolean;
}
// ============================================
// DOCUMENTATION TYPES
// ============================================

/**
 * Documentation section type
 * AUTO = auto-generated by Jjodie (can be regenerated)
 * USER = user-modified (preserved during regeneration)
 */
export type DocumentationSectionType = 'AUTO' | 'USER';

/**
 * A single section in the documentation
 */
export interface DocumentationSection {
    id: string;                         // e.g., 'overview', 'class:Entity', 'notes'
    type: DocumentationSectionType;     // AUTO or USER
    content: string;                    // Markdown content
    lastModified?: number;              // Timestamp of last modification
}

/**
 * Documentation status for UI indicators
 */
export type DocumentationStatus = 'never_generated' | 'up_to_date' | 'outdated' | 'editing';

/**
 * Full project documentation metadata
 */
export interface ProjectDocumentation {
    content: string;                    // Full Markdown content
    generatedAt: number;                // Timestamp of generation
    lastManualEdit?: number;            // Timestamp of last user edit
    projectHash: string;                // Hash of project state at generation
    sections: DocumentationSection[];   // Parsed sections
}

/**
// Provider endpoints
export const PROVIDER_ENDPOINTS = {
} as const;

 * Check if a provider needs proxy (doesn't support browser CORS)
 * /
export function providerNeedsProxy(provider: AIProvider): boolean {
    return provider === 'claude' || provider === 'gemini';
}

// ============================================
// MODEL CAPABILITIES
// ============================================

export interface ModelCapabilities {
    vision: boolean;      // Supports image input
    pdf: boolean;         // Supports PDF documents
}
type ModelInfo = AIVersion;

/ **
 * Get model info by provider and model ID
 * /
export function getModelInfo(provider: TAIProvider, modelId: string): AIVersion | undefined {
    return AI[provider].versions[modelId];
}

/**
 * Get model capabilities by provider and model ID
 * /
export function getModelCapabilities(provider: TAIProvider, modelId: string): ModelCapabilities {
    const model = getModelInfo(provider, modelId);
    return model?.capabilities || { vision: false, pdf: false };
}*/
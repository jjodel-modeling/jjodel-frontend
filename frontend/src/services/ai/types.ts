/**
 * Core types of the AI provider module (#196, spec docs/spec/claude_spec_2026-11-02_ai_provider_refactor.md §4).
 *
 * Plain TS with no runtime import: the module must not reach `joiner` or `types/jodie.ts`, whose
 * import chain needs `window` (CLAUDE.md §17), so its tests run in vitest's `node` environment.
 */

/** Output budget of a chat call when the request does not set one (was CHAT_MAX_OUTPUT_TOKENS). */
export const DEFAULT_MAX_OUTPUT_TOKENS = 8192;

export enum ECapabilities { IMAGES, DOCUMENTS }

export enum EAuthScheme { BEARER, X_API_KEY, QUERY_KEY, NONE }

export enum FailureCatalog { AUTH, RATE, NETWORK, SERVER }

/** The providers the module serves, one class per SDK family. */
export type ProviderId = 'GPT' | 'Claude' | 'Gemini' | 'DeepSeek' | 'Mistral' | 'Groq' | 'Kimi' | 'Ollama' | 'Custom';

/** The SDK family a provider is served by. */
export type ProviderFamily = 'openai' | 'anthropic' | 'google';

export type AIFeature = 'documentation' | 'chat' | 'scriptblock' | 'mappings' | 'explain';

export class AIModel {
    constructor(
        public apiName: string,
        public displayName: string = apiName,
        /** [] | [IMAGES] | [DOCUMENTS] | [IMAGES, DOCUMENTS] */
        public capabilities: ECapabilities[] = [],
        public contextWindow?: number,
    ) {}

    has(capability: ECapabilities): boolean {
        return this.capabilities.includes(capability);
    }
}

/** A base64 attachment of the current user turn. */
export interface Attachment {
    mimeType: string;
    data: string;
    name?: string;
}

export interface HistoryMessage {
    role: 'user' | 'assistant';
    content: string;
    /**
     * Base64 images of an earlier turn, sent again on that turn (R-AI-17). Dropped, not refused,
     * when the model does not declare IMAGES, as the text-only families of the old path dropped them.
     */
    images?: Attachment[];
    /** Base64 PDFs of an earlier turn, as `images` (R-AI-17). */
    documents?: Attachment[];
}

export interface ChatRequest {
    /** Rendered by PromptService at the call site. */
    system?: string;
    /** The conversation, the current user turn last. */
    history: HistoryMessage[];
    model?: string;
    /** Base64 images of the current turn; refused unless the model declares IMAGES. */
    images?: Attachment[];
    /** Base64 PDFs of the current turn; refused unless the model declares DOCUMENTS. */
    documents?: Attachment[];
    /** Default DEFAULT_MAX_OUTPUT_TOKENS. */
    maxOutputTokens?: number;
    /** Aborts the HTTP request, streaming included (R-AI-15). */
    signal?: AbortSignal;
}

export interface ConnectionTestResult {
    success: boolean;
    error?: string;
    failure?: FailureCatalog;
    warning?: string;
}

/**
 * What a provider is, independent of the user's settings. The registry builds one per provider
 * from the static seeds; tests pass fixtures.
 */
export interface ProviderSpec {
    name: ProviderId;
    /** Shown in messages, e.g. 'OpenAI' for GPT, 'Anthropic' for Claude. */
    company: string;
    family: ProviderFamily;
    /**
     * Default endpoint. A full chat endpoint is accepted: each family derives its SDK base URL from
     * it (e.g. `.../v1/chat/completions` becomes `.../v1`).
     */
    baseUrl: string;
    authScheme: EAuthScheme;
    requiresKey: boolean;
    /** True for the providers whose endpoint is the user's Base URL (Ollama, Custom). */
    userBaseUrl?: boolean;
    /** The static model list, in registry order; the first entry is the fallback model. */
    seedModels: AIModel[];
    /** Old or renamed model ids mapped onto current ones. */
    legacyIds?: Record<string, string>;
}

/** The user's settings of one provider. */
export interface ProviderConfig {
    apiKey?: string;
    baseUrl?: string;
    model?: string;
}

/** Wiring a provider receives from its owner (the registry), all optional. */
export interface ProviderOptions {
    /** Passed to the SDK client; tests pass a mock. */
    fetch?: typeof fetch;
    /** True when `modelId` is a known model of another provider (the foreign-model guard). */
    isModelOfOtherProvider?: (modelId: string) => boolean;
    /** The live catalog, when one is cached. */
    liveModels?: () => readonly AIModel[];
    /** Receives the warnings a provider raises (a discarded foreign model). Default console.warn. */
    onWarning?: (message: string) => void;
}

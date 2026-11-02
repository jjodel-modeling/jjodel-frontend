/**
 * The abstract provider of the AI module (#196, R-AI-3; spec §4 and the transport table of §6).
 *
 * A provider receives its spec, the user's settings and its wiring through the constructor: it
 * reads no localStorage and fires no event. The three families (OpenAI, Anthropic, Google
 * compatible) load their SDK with `await import(...)` inside a method (R-AI-2).
 *
 * Copied, not imported, from their live homes (L3/L6 delete the old copies): the key-prefix tables
 * and `validateKeyCoherence` of AIProviderService.ts, `isConfigured` and `isForeignModel` of
 * types/jodie.ts, the capability table and catalog ordering of aiModelCatalog.ts.
 */
import type {
    AIModel, ChatRequest, ConnectionTestResult, ProviderConfig, ProviderFamily, ProviderId, ProviderOptions, ProviderSpec,
} from './types';
import { DEFAULT_MAX_OUTPUT_TOKENS, EAuthScheme, ECapabilities, FailureCatalog } from './types';

// ── Key prefixes ─────────────────────────────────────────────────────────────

/**
 * Prefixes that unambiguously identify a provider, to catch a key pasted under the wrong one.
 * Google's `AIza` is left out on purpose, as in the live table: adding it changes behaviour.
 */
const DISTINCTIVE_KEY_PREFIXES: ReadonlyArray<{ prefix: string; provider: ProviderId; label: string }> = [
    { prefix: 'sk-ant-', provider: 'Claude', label: 'Anthropic (Claude)' },
    { prefix: 'gsk_',    provider: 'Groq',   label: 'Groq' },
];

/** Expected key prefix per provider where one is well known. DeepSeek shares OpenAI's `sk-`. */
const EXPECTED_KEY_PREFIX: Partial<Record<ProviderId, string>> = {
    Claude:   'sk-ant-',
    GPT:      'sk-',
    Groq:     'gsk_',
    DeepSeek: 'sk-',
};

// ── Catalog helpers ──────────────────────────────────────────────────────────

/** A listed model with the grouping the display order needs. */
export interface CatalogEntry {
    model: AIModel;
    /** Grouping key within the provider, e.g. 'opus', 'gpt:mini', 'flash-lite'. */
    family: string;
    /** Ordering within a family, higher is newer. */
    rank: number;
}

/** What the `models` endpoints do not report. Longest matching prefix wins. */
const CAPABILITY_TABLE: { prefix: string; pdf: boolean; vision: boolean; contextWindow?: number }[] = [
    { prefix: 'claude-',          pdf: true,  vision: true,  contextWindow: 200_000 },
    { prefix: 'claude-3-haiku',   pdf: false, vision: true,  contextWindow: 200_000 },
    { prefix: 'gpt-4o',           pdf: true,  vision: true  },
    { prefix: 'gpt-4.1',          pdf: true,  vision: true  },
    { prefix: 'gpt-5',            pdf: true,  vision: true  },
    { prefix: 'gemini-',          pdf: true,  vision: true  },
];

/** Conservative default: an unknown model gets no attachment capability. */
export function capabilitiesFor(id: string): { capabilities: ECapabilities[]; contextWindow?: number } {
    let match: (typeof CAPABILITY_TABLE)[number] | undefined;
    for (const row of CAPABILITY_TABLE) {
        if (id.startsWith(row.prefix) && (!match || row.prefix.length > match.prefix.length)) match = row;
    }
    if (!match) return { capabilities: [] };
    const capabilities: ECapabilities[] = [];
    if (match.vision) capabilities.push(ECapabilities.IMAGES);
    if (match.pdf) capabilities.push(ECapabilities.DOCUMENTS);
    return { capabilities, contextWindow: match.contextWindow };
}

/**
 * Display order: the newest of each family first (families ordered by their newest, newest first),
 * then every other model by rank, newest first. Ties keep the first seen.
 */
export function orderCatalog(entries: CatalogEntry[]): AIModel[] {
    const best = new Map<string, CatalogEntry>();
    for (const e of entries) {
        const cur = best.get(e.family);
        if (!cur || e.rank > cur.rank) best.set(e.family, e);
    }
    const heads = new Set(best.values());
    const byRank = (a: CatalogEntry, b: CatalogEntry) => b.rank - a.rank;
    return [
        ...entries.filter(e => heads.has(e)).sort(byRank),
        ...entries.filter(e => !heads.has(e)).sort(byRank),
    ].map(e => e.model);
}

// ── Failures ─────────────────────────────────────────────────────────────────

/** The fields of an SDK error the classifier reads (OpenAI/Anthropic APIError, Gemini ApiError). */
interface SdkErrorLike {
    status?: unknown;
    code?: unknown;
    error?: { code?: unknown; error?: { code?: unknown } };
    message?: unknown;
}

function statusOf(error: unknown): number | undefined {
    const status = (error as SdkErrorLike | null)?.status;
    return typeof status === 'number' ? status : undefined;
}

/** OpenAI answers an account with no credit with 429 and code `insufficient_quota` (R-AI-8). */
function isNoCredit(error: unknown): boolean {
    const e = error as SdkErrorLike | null;
    return e?.code === 'insufficient_quota' || e?.error?.code === 'insufficient_quota';
}

function messageOf(error: unknown): string {
    const message = (error as SdkErrorLike | null)?.message;
    return typeof message === 'string' ? message : String(error ?? '');
}

// ── Provider ─────────────────────────────────────────────────────────────────

export abstract class BaseProvider {
    readonly spec: ProviderSpec;
    protected config: ProviderConfig;
    protected options: ProviderOptions;

    constructor(spec: ProviderSpec, config: ProviderConfig = {}, options: ProviderOptions = {}) {
        this.spec = spec;
        this.config = config;
        this.options = options;
    }

    get name(): ProviderId { return this.spec.name; }
    get family(): ProviderFamily { return this.spec.family; }
    get apiKey(): string { return this.config.apiKey ?? ''; }
    get authScheme(): EAuthScheme { return this.spec.authScheme; }
    get requiresKey(): boolean { return this.spec.requiresKey; }

    /** The endpoint the SDK base URL is derived from: the user's Base URL where the provider takes one. */
    get baseUrl(): string {
        const own = this.spec.userBaseUrl ? (this.config.baseUrl ?? '').trim() : '';
        return own || this.spec.baseUrl;
    }

    /** 'Anthropic (Claude)', 'Groq'. */
    get label(): string {
        return this.spec.company && this.spec.company !== this.name ? `${this.spec.company} (${this.name})` : this.name;
    }

    /**
     * Configured, as `AIConfig.isConfigured` reads it: Custom by a Base URL or a key, a keyed provider
     * by its key, a keyless one (Ollama) by its Base URL.
     */
    enabled(): boolean {
        if (this.name === 'Custom') return !!(this.config.baseUrl || this.config.apiKey);
        return !!(this.requiresKey ? this.config.apiKey : this.config.baseUrl);
    }

    /** The static seed, then the live models it does not list. */
    models(): AIModel[] {
        const seed = this.spec.seedModels;
        const live = this.options.liveModels?.() ?? [];
        const seen = new Set(seed.map(m => m.apiName));
        return [...seed, ...live.filter(m => !seen.has(m.apiName))];
    }

    model(apiName: string): AIModel | undefined {
        return this.models().find(m => m.apiName === apiName);
    }

    /** True when `modelId` is not this provider's and another provider lists it. */
    protected isForeignModel(modelId: string): boolean {
        if (this.model(modelId)) return false;
        return !!this.options.isModelOfOtherProvider?.(modelId);
    }

    protected legacy(modelId: string | undefined): string | undefined {
        if (!modelId) return modelId;
        return this.spec.legacyIds?.[modelId] ?? modelId;
    }

    /**
     * The model a call uses for `requested`: the request, else the configured model, through the
     * legacy map. A model of another provider is never sent: it falls back to the configured model,
     * else to the first seed, with a warning. Custom has no registry and is exempt.
     */
    resolveModel(requested?: string): string {
        // The Custom registry entry is a selector placeholder, not an endpoint model id.
        if (this.name === 'Custom' && requested === 'custom') requested = undefined;
        let modelId = this.legacy(requested ?? this.config.model) ?? '';
        if (modelId && this.name !== 'Custom' && this.isForeignModel(modelId)) {
            let own = this.legacy(this.config.model) ?? '';
            if (!own || this.isForeignModel(own)) own = this.spec.seedModels[0]?.apiName ?? '';
            this.warn(`Discarding model "${modelId}" — not a ${this.name} model; using "${own}" instead.`);
            modelId = own;
        }
        return modelId;
    }

    /**
     * A plain-language error when the key's prefix does not fit this provider, else null. Keyless
     * providers and Custom are not judged; an empty key is `enabled()`'s concern.
     */
    validateKey(): string | null {
        if (!this.requiresKey || this.name === 'Custom') return null;
        const apiKey = this.apiKey.trim();
        if (!apiKey) return null;
        for (const d of DISTINCTIVE_KEY_PREFIXES) {
            if (apiKey.startsWith(d.prefix) && d.provider !== this.name) {
                return `This looks like a ${d.label} API key, but the active provider is ${this.label}. Enter the ${this.label} key, or switch the provider in Settings.`;
            }
        }
        const expected = EXPECTED_KEY_PREFIX[this.name];
        if (expected && !apiKey.startsWith(expected)) {
            return `${this.label} API keys should start with "${expected}". The key you entered does not — please check it in Settings.`;
        }
        return null;
    }

    /** A refusal when the request carries an attachment the model does not declare, else null. */
    protected checkAttachments(modelId: string, req: ChatRequest): string | null {
        const model = this.model(modelId);
        if (req.images?.length && !model?.has(ECapabilities.IMAGES)) {
            return `The model "${modelId}" does not accept images.`;
        }
        if (req.documents?.length && !model?.has(ECapabilities.DOCUMENTS)) {
            return `The model "${modelId}" does not accept PDF documents.`;
        }
        return null;
    }

    /** Every check before a chat call; throws the message the caller shows. Returns the model. */
    protected prepare(req: ChatRequest): string {
        if (!this.enabled()) throw new Error(`Provider ${this.name} is not configured. Please add your API key in Settings.`);
        // Custom is configured by a key alone, but has no endpoint without a Base URL (R-AI-18).
        if (this.name === 'Custom' && !(this.config.baseUrl ?? '').trim()) {
            throw new Error('Custom provider requires a Base URL. Set it in Settings.');
        }
        const keyError = this.validateKey();
        if (keyError) throw new Error(keyError);
        const modelId = this.resolveModel(req.model);
        if (!modelId.trim()) throw new Error(`No model selected for ${this.name}. Please choose a model in Settings.`);
        const refusal = this.checkAttachments(modelId, req);
        if (refusal) throw new Error(refusal);
        return modelId;
    }

    protected maxOutputTokens(req: ChatRequest): number {
        return req.maxOutputTokens ?? DEFAULT_MAX_OUTPUT_TOKENS;
    }

    async chat(req: ChatRequest): Promise<string> {
        const modelId = this.prepare(req);
        return this.send(modelId, req);
    }

    async *chatStream(req: ChatRequest): AsyncIterable<string> {
        const modelId = this.prepare(req);
        yield* this.stream(modelId, req);
    }

    /** The models the key can use, from the provider's `models` endpoint, in display order. */
    retrieveAvailableModels(): Promise<AIModel[]> {
        return this.listModels();
    }

    /**
     * One minimal call with the model the chat uses; a failure is classified. `modelId` is the
     * chat's requested model, resolved as a chat call resolves it (#179); none tests the configured one.
     */
    async test(modelId?: string): Promise<ConnectionTestResult> {
        if (!this.enabled()) {
            return { success: false, error: this.requiresKey ? 'API key not configured' : `${this.name} requires a Base URL.` };
        }
        if (this.name === 'Custom' && !(this.config.baseUrl ?? '').trim()) {
            return { success: false, error: 'Custom provider requires a Base URL.' };
        }
        const keyError = this.validateKey();
        if (keyError) return { success: false, failure: FailureCatalog.AUTH, error: keyError };
        const resolved = this.resolveModel(modelId);
        if (!resolved.trim()) return { success: false, error: `No model selected for ${this.name}. Please choose a model in Settings.` };
        try {
            await this.probe(resolved);
            return { success: true };
        } catch (error) {
            return this.classify(error, resolved);
        }
    }

    /**
     * A failed call as a test result. 401/403 and a 400 naming the key are AUTH; 429 is RATE, with
     * its own message for an account with no credit (R-AI-8); 5xx is SERVER; no HTTP status at all
     * (CORS, DNS, refused connection, the SDKs' «Connection error.») is NETWORK. A 404 is SERVER:
     * the key was accepted and the provider reached, but the model does not answer.
     */
    protected classify(error: unknown, modelId: string): ConnectionTestResult {
        const status = statusOf(error);
        const message = messageOf(error);
        if (status === undefined) {
            return { success: false, failure: FailureCatalog.NETWORK, error: this.networkMessage() };
        }
        if (status === 401 || status === 403 || (status === 400 && /API_KEY_INVALID|api[ _]?key/i.test(message))) {
            return { success: false, failure: FailureCatalog.AUTH, error: this.authMessage(status) };
        }
        if (status === 429) {
            return isNoCredit(error)
                ? { success: false, failure: FailureCatalog.RATE, error: `No credit left on the account. Add credit in the ${this.spec.company} Console, then test again.` }
                : { success: false, failure: FailureCatalog.RATE, error: 'Rate limit exceeded. Please try again in a moment.' };
        }
        if (status === 404) {
            return { success: false, failure: FailureCatalog.SERVER, error: this.notFoundMessage(modelId) };
        }
        if (status >= 500) {
            return { success: false, failure: FailureCatalog.SERVER, error: `${this.spec.company} error (${status}). Please try again later.` };
        }
        return { success: false, error: `API Error (${status})${message ? ': ' + message : ''}` };
    }

    protected authMessage(status: number): string {
        if (this.family === 'google') return 'Invalid API key or key not allowed. Check your key in Google AI Studio.';
        return status === 403
            ? `This key is not allowed to use this model (403). Check its permissions in the ${this.spec.company} Console.`
            : `Invalid API key. Please check your key in the ${this.spec.company} Console.`;
    }

    protected notFoundMessage(modelId: string): string {
        return `Model "${modelId}" not found or not available to this key. Pick another ${this.name} model.`;
    }

    protected networkMessage(): string {
        return `Cannot reach ${this.host()} (network or CORS).`;
    }

    protected host(): string {
        try { return new URL(this.sdkBaseUrl()).host; } catch { return this.baseUrl; }
    }

    protected warn(message: string): void {
        (this.options.onWarning ?? console.warn)(`[ai/${this.name}] ${message}`);
    }

    /** The base URL handed to the SDK client, derived from `baseUrl`. */
    abstract sdkBaseUrl(): string;
    /** One non-streaming chat call with a resolved, checked model. */
    protected abstract send(modelId: string, req: ChatRequest): Promise<string>;
    /** One streaming chat call with a resolved, checked model. */
    protected abstract stream(modelId: string, req: ChatRequest): AsyncIterable<string>;
    /** The minimal call of `test()`; throws the SDK error on failure. */
    protected abstract probe(modelId: string): Promise<void>;
    protected abstract listModels(): Promise<AIModel[]>;
}

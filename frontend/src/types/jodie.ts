/**
 * Jodie AI Assistant Types
 * Type definitions for the multi-provider AI assistant
 */
import type {Dictionary} from "../joiner";
import {} from "../joiner";

export class AI{
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
    name: TAIProvider;
    company: TAICompany;
    constructor(name: TAIProvider, company: TAICompany) {
        this.name = name;
        this.company = company;
        (AI as any)[name] = this;
    }
}

export class AIProvider {
    static isValidProvider(provider: any): provider is TAIProvider { return !!companymap[provider as TAIProvider]; }
    static isValidCompany(company: any): company is TAICompany { return !!aimap[company as TAICompany]; }

    public static Claude: "Claude" = "Claude";
    public static GPT: "GPT" = "GPT";
    public static DeepSeek: "DeepSeek" = "DeepSeek";
    public static Gemini: "Gemini" = "Gemini";
    public static Mistral: "Mistral" = "Mistral";
    public static Groq: "Groq" = "Groq";
    public static Ollama: "Ollama" = "Ollama"; // different company from llama
    public static Llama: "Llama" = "Llama"; // from meta
    public static Copilot: "Copilot" = "Copilot";
    public static Kimi: "Kimi" = "Kimi";
}
export class AICompany {
    public static Anthropic: "Anthropic" = "Anthropic";
    public static OpenAI: "OpenAI" = "OpenAI";
    public static DeepSeek: "DeepSeek" = "DeepSeek";
    public static Google: "Google" = "Google";
    public static Mistral: "Mistral" = "Mistral";
    public static Groq: "Groq" = "Groq";
    public static Ollama: "Ollama" = "Ollama";
    public static Meta: "Meta" = "Meta";
    public static Microsoft: "Microsoft" = "Microsoft";
    public static Moonshot: "Moonshot" = "Moonshot";
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

export interface ProviderConfig {
    provider: TAIProvider;
    apiKey: string;
    model: string;
    enabled: boolean;
    baseUrl?: string; // Custom base URL (used by Ollama for non-default endpoints)
}

export interface JodieConfig {
    providers: Record<TAIProvider, ProviderConfig>;
    activeProvider: TAIProvider;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
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
    };
}

/**
 * Check if a provider/model combination supports vision (image input)
 * Uses the model capabilities from PROVIDER_MODELS
 */
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
 */
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
 */
export function supportsAttachments(provider: TAIProvider, model?: string): boolean {
    return supportsVision(provider, model) || supportsPDF(provider, model);
}

export interface ChatState {
    messages: ChatMessage[];
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
 * Documentation storage key pattern
 */
export const DOCUMENTATION_STORAGE_PREFIX = 'jjodie_doc_' as const;

// Provider endpoints
export const PROVIDER_ENDPOINTS = {
    claude: 'https://api.anthropic.com/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
    mistral: 'https://api.mistral.ai/v1/chat/completions',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    kimi: 'https://api.moonshot.cn/v1/chat/completions',
    ollama: 'http://localhost:11434/v1/chat/completions', // Default local, configurable via baseUrl
} as const;

// Default Ollama base URL (can be overridden in provider config)
export const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';

// Proxy endpoints for providers that don't support CORS
// Update the subdomain after deploying the Cloudflare Worker
const PROXY_BASE_URL = 'https://jjodel-ai-proxy.alfonso99.workers.dev';
const PROXY_BASE_URL_DEV = 'http://localhost:8787';

export const PROXY_ENDPOINTS = {
    anthropic: `${PROXY_BASE_URL}/v1/anthropic/messages`,
    gemini: `${PROXY_BASE_URL}/v1/gemini`,
} as const;

// For local development
export const PROXY_ENDPOINTS_DEV = {
    anthropic: `${PROXY_BASE_URL_DEV}/v1/anthropic/messages`,
    gemini: `${PROXY_BASE_URL_DEV}/v1/gemini`,
} as const;

// Helper to get correct proxy URL
export function getProxyEndpoint(provider: 'anthropic' | 'gemini'): string {
    const isDev = typeof window !== 'undefined' && window.location.hostname === 'localhost';
    return isDev ? PROXY_ENDPOINTS_DEV[provider] : PROXY_ENDPOINTS[provider];
}

/**
 * Check if a provider needs proxy (doesn't support browser CORS)
 */
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

export interface ModelInfo {
    value: string;        // Model ID for API
    label: string;        // Display name
    capabilities: ModelCapabilities;
    deprecated?: boolean; // If model is deprecated
}

// Available models per provider with capabilities
export const PROVIDER_MODELS: Dictionary<TAIProvider, ModelInfo[]> = {
    [AIProvider.Claude]: [
        { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4', capabilities: { vision: true, pdf: true } },
        { value: 'claude-opus-4-20250514', label: 'Claude Opus 4', capabilities: { vision: true, pdf: true } },
        { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4', capabilities: { vision: true, pdf: true } },
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet', capabilities: { vision: true, pdf: true } },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus', capabilities: { vision: true, pdf: true } },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku', capabilities: { vision: true, pdf: true } },
    ],
    [AIProvider.GPT]: [
        { value: 'gpt-4o', label: 'GPT-4o', capabilities: { vision: true, pdf: false } },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', capabilities: { vision: true, pdf: false } },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', capabilities: { vision: true, pdf: false } },
        { value: 'gpt-4', label: 'GPT-4', capabilities: { vision: false, pdf: false } },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', capabilities: { vision: false, pdf: false } },
    ],
    [AIProvider.DeepSeek]: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat', capabilities: { vision: false, pdf: false } },
        { value: 'deepseek-coder', label: 'DeepSeek Coder', capabilities: { vision: false, pdf: false } },
    ],
    [AIProvider.Gemini]: [
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash', capabilities: { vision: true, pdf: true } },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro', capabilities: { vision: true, pdf: true } },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash', capabilities: { vision: true, pdf: true } },
        { value: 'gemini-pro', label: 'Gemini Pro', capabilities: { vision: false, pdf: false }, deprecated: true },
    ],
    [AIProvider.Mistral]: [
        { value: 'mistral-large-latest', label: 'Mistral Large', capabilities: { vision: false, pdf: false } },
        { value: 'mistral-small-latest', label: 'Mistral Small', capabilities: { vision: false, pdf: false } },
        { value: 'pixtral-large-latest', label: 'Pixtral Large', capabilities: { vision: true, pdf: false } },
        { value: 'pixtral-12b-2409', label: 'Pixtral 12B', capabilities: { vision: true, pdf: false } },
        { value: 'codestral-latest', label: 'Codestral', capabilities: { vision: false, pdf: false } },
        { value: 'ministral-8b-latest', label: 'Ministral 8B', capabilities: { vision: false, pdf: false } },
    ],
    [AIProvider.Llama]: [
        { value: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B', capabilities: { vision: false, pdf: false } },
        { value: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B', capabilities: { vision: false, pdf: false } },
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', capabilities: { vision: false, pdf: false } },
        { value: 'llava-v1.5-7b-4096-preview', label: 'LLaVA 1.5 7B', capabilities: { vision: true, pdf: false } },
        { value: 'gemma2-9b-it', label: 'Gemma 2 9B', capabilities: { vision: false, pdf: false } },
    ],
    [AIProvider.Groq]: [
    ],
    [AIProvider.Copilot]: [
    ],

    [AIProvider.Kimi]: [
        { value: 'moonshot-v1-8k', label: 'Moonshot V1 8K', capabilities: { vision: false, pdf: false } },
        { value: 'moonshot-v1-32k', label: 'Moonshot V1 32K', capabilities: { vision: false, pdf: false } },
        { value: 'moonshot-v1-128k', label: 'Moonshot V1 128K', capabilities: { vision: false, pdf: false } },
    ],
    [AIProvider.Ollama]: [
        { value: 'llama3.2', label: 'Llama 3.2', capabilities: { vision: false, pdf: false } },
        { value: 'llama3.2:1b', label: 'Llama 3.2 1B', capabilities: { vision: false, pdf: false } },
        { value: 'llama3.1', label: 'Llama 3.1', capabilities: { vision: false, pdf: false } },
        { value: 'mistral', label: 'Mistral', capabilities: { vision: false, pdf: false } },
        { value: 'codellama', label: 'Code Llama', capabilities: { vision: false, pdf: false } },
        { value: 'llava', label: 'LLaVA', capabilities: { vision: true, pdf: false } },
        { value: 'qwen2.5', label: 'Qwen 2.5', capabilities: { vision: false, pdf: false } },
    ],
    /*[AIProvider.???]: [
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', capabilities: { vision: false, pdf: false } },
        { value: 'llava-v1.5-7b-4096-preview', label: 'LLaVA 1.5 7B', capabilities: { vision: true, pdf: false } },
        { value: 'gemma2-9b-it', label: 'Gemma 2 9B', capabilities: { vision: false, pdf: false } },
        { value: 'llava-v1.5-7b-4096-preview', label: 'LLaVA 1.5 7B', capabilities: { vision: true, pdf: false } },
    ],*/
};

/**
 * Get model info by provider and model ID
 */
export function getModelInfo(provider: TAIProvider, modelId: string): ModelInfo | undefined {
    return PROVIDER_MODELS[provider]?.find(m => m.value === modelId);
}

/**
 * Get model capabilities by provider and model ID
 */
export function getModelCapabilities(provider: TAIProvider, modelId: string): ModelCapabilities {
    const model = getModelInfo(provider, modelId);
    return model?.capabilities ?? { vision: false, pdf: false };
}

// Provider display info - colors for icon backgrounds
export const PROVIDER_INFO: Dictionary<TAIProvider, {name: string, company: string, color: string, bgColor: string, textIcon:string}> = {
    [AIProvider.Claude]: {
        name: 'Claude',
        company: 'Anthropic',
        color: '#D97706',
        bgColor: '#FEF3C7',
        textIcon: 'C',
    },
    [AIProvider.GPT]: {
        name: 'ChatGPT',
        company: 'OpenAI',
        color: '#059669',           // emerald-600
        bgColor: '#D1FAE5',         // emerald-100
    },
    [AIProvider.DeepSeek]: {
        name: 'DeepSeek',
        company: 'DeepSeek AI',
        color: '#2563EB',           // blue-600
        bgColor: '#DBEAFE',         // blue-100
    },
    [AIProvider.Gemini]: {
        name: 'Gemini',
        company: 'Google',
        color: '#7C3AED',           // violet-600
        bgColor: '#EDE9FE',         // violet-100
    },
    [AIProvider.Mistral]: {
        name: 'Mistral',
        company: 'Mistral AI',
        color: '#F97316',           // orange-600
        bgColor: '#FFEDD5',         // orange-100
    },
    [AIProvider.Groq]: {
        name: 'Groq',
        company: 'Groq',
        color: '#EF4444',           // red-600
        bgColor: '#FEE2E2',         // red-100
    },
    [AIProvider.Kimi]: {
        name: 'Kimi',
        company: 'Moonshot AI',
        color: '#0891B2',           // cyan-600
        bgColor: '#CFFAFE',         // cyan-100
    },
    [AIProvider.Ollama]: {
        name: 'Ollama',
        company: 'Local',
        color: '#475569',           // slate-600
        bgColor: '#F1F5F9',         // slate-100
        company: getAICompany(AIProvider.Ollama),
        textIcon: 'OL',
    },
    [AIProvider.Llama]: {
        name: AIProvider.Llama,
        company: getAICompany(AIProvider.Llama),
        color: '#8a6565',
        bgColor: '#FEE2E2',
        textIcon: 'LL',
    },
    [AIProvider.Copilot]: {
        name: AIProvider.Copilot,
        company: getAICompany(AIProvider.Copilot),
        color: '#4ab409',
        bgColor: '#FEE2E2',
        textIcon: 'CP',
    },
} as const;

// Default Jodie configuration
export const DEFAULT_JODIE_CONFIG: JodieConfig = {
    providers: {
        claude: {
            provider: 'claude',
            apiKey: '',
            model: 'claude-sonnet-4-20250514',
            enabled: false,
        },
        openai: {
            provider: 'openai',
            apiKey: '',
            model: 'gpt-4o',
            enabled: false,
        },
        deepseek: {
            provider: 'deepseek',
            apiKey: '',
            model: 'deepseek-chat',
            enabled: false,
        },
        gemini: {
            provider: 'gemini',
            apiKey: '',
            model: 'gemini-2.0-flash-exp',
            enabled: false,
        },
        mistral: {
            provider: 'mistral',
            apiKey: '',
            model: 'mistral-large-latest',
            enabled: false,
        },
        groq: {
            provider: 'groq',
            apiKey: '',
            model: 'llama-3.3-70b-versatile',
            enabled: false,
        },
        kimi: {
            provider: 'kimi',
            apiKey: '',
            model: 'moonshot-v1-8k',
            enabled: false,
        },
        ollama: {
            provider: 'ollama',
            apiKey: '',  // Ollama doesn't require API key by default
            model: 'llama3.2',
            enabled: false,
            baseUrl: 'http://localhost:11434',
        },
    },
    activeProvider: 'claude',
    position: undefined,
    size: undefined,
};


// Aggiungi queste interface
export interface ConfidenceScore {
    overall: number;
    sections: Record<string, number>;
    factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
    factor: string;
    impact: 'positive' | 'negative';
    weight: number;
}

// Modifica ProjectDocumentation aggiungendo:
export interface ProjectDocumentation {
    content: string;
    generatedAt: number;
    lastManualEdit?: number;
    projectHash: string;
    sections: DocumentationSection[];
    confidence?: ConfidenceScore;  // ← AGGIUNGI QUESTA RIGA
}
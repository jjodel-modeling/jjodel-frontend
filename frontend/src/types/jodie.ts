import { Dictionary } from "../joiner";

/**
 * Jodie AI Assistant Types
 * Type definitions for the multi-provider AI assistant
 */

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
    baseUrl?: string;
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
} as const;

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
    ],
    [AIProvider.Groq]: [
    ],
    [AIProvider.Ollama]: [
    ],
    [AIProvider.Copilot]: [
    ],

    /*[AIProvider.???]: [
        { value: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B', capabilities: { vision: false, pdf: false } },
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

// Provider display info
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
        color: '#059669',
        bgColor: '#D1FAE5',
        textIcon: 'GPT',
    },
    [AIProvider.DeepSeek]: {
        name: 'DeepSeek',
        company: 'DeepSeek AI',
        color: '#2563EB',
        bgColor: '#DBEAFE',
        textIcon: 'DS',
    },
    [AIProvider.Gemini]: {
        name: 'Gemini',
        company: 'Google',
        color: '#7C3AED',
        bgColor: '#EDE9FE',
        textIcon: 'G',
    },
    [AIProvider.Mistral]: {
        name: 'Mistral',
        company: 'Mistral AI',
        color: '#F97316',
        bgColor: '#FFEDD5',
        textIcon: 'M',
    },
    [AIProvider.Groq]: {
        name: 'Groq',
        company: 'Groq',
        color: '#EF4444',
        bgColor: '#FEE2E2',
        textIcon: 'GQ',
    },
    [AIProvider.Ollama]: {
        name: AIProvider.Ollama,
        company: getAICompany(AIProvider.Ollama),
        color: '#4ab409',
        bgColor: '#FEE2E2',
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
        color: '#0f9bae',
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
    } as any,
    activeProvider: AIProvider.Claude,
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
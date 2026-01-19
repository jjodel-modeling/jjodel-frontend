/**
 * Jodie AI Assistant Types
 * Type definitions for the multi-provider AI assistant
 */

export type AIProvider = 'claude' | 'openai' | 'deepseek' | 'gemini';

export interface ProviderConfig {
    provider: AIProvider;
    apiKey: string;
    model: string;
    enabled: boolean;
}

export interface JodieConfig {
    providers: Record<AIProvider, ProviderConfig>;
    activeProvider: AIProvider;
    position?: { x: number; y: number };
    size?: { width: number; height: number };
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    provider?: AIProvider;
    userName?: string;
}

export interface ChatState {
    messages: ChatMessage[];
    isOpen: boolean;
    isMinimized: boolean;
    isWaiting: boolean;
    hasUnread: boolean;
}

// Provider endpoints
export const PROVIDER_ENDPOINTS = {
    claude: 'https://api.anthropic.com/v1/messages',
    openai: 'https://api.openai.com/v1/chat/completions',
    deepseek: 'https://api.deepseek.com/v1/chat/completions',
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
} as const;

// Available models per provider
export const PROVIDER_MODELS = {
    claude: [
        { value: 'claude-sonnet-4-20250514', label: 'Claude Sonnet 4' },
        { value: 'claude-opus-4-20250514', label: 'Claude Opus 4' },
        { value: 'claude-haiku-4-20250514', label: 'Claude Haiku 4' },
        // Stable fallback models
        { value: 'claude-3-5-sonnet-20241022', label: 'Claude 3.5 Sonnet (Stable)' },
        { value: 'claude-3-opus-20240229', label: 'Claude 3 Opus (Stable)' },
        { value: 'claude-3-haiku-20240307', label: 'Claude 3 Haiku (Stable)' },
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    ],
    deepseek: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
    gemini: [
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
        { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
        { value: 'gemini-pro', label: 'Gemini Pro' },
    ],
} as const;

// Provider display info
export const PROVIDER_INFO = {
    claude: {
        name: 'Claude',
        company: 'Anthropic',
        color: '#D97706',
        bgColor: '#FEF3C7',
        textIcon: 'C',
    },
    openai: {
        name: 'ChatGPT',
        company: 'OpenAI',
        color: '#059669',
        bgColor: '#D1FAE5',
        textIcon: 'GPT',
    },
    deepseek: {
        name: 'DeepSeek',
        company: 'DeepSeek AI',
        color: '#2563EB',
        bgColor: '#DBEAFE',
        textIcon: 'DS',
    },
    gemini: {
        name: 'Gemini',
        company: 'Google',
        color: '#7C3AED',
        bgColor: '#EDE9FE',
        textIcon: 'G',
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
    },
    activeProvider: 'claude',
    position: undefined,
    size: undefined,
};

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
    ],
    openai: [
        { value: 'gpt-4o', label: 'GPT-4o' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
        { value: 'gpt-4', label: 'GPT-4' },
    ],
    deepseek: [
        { value: 'deepseek-chat', label: 'DeepSeek Chat' },
        { value: 'deepseek-coder', label: 'DeepSeek Coder' },
    ],
    gemini: [
        { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash' },
        { value: 'gemini-pro', label: 'Gemini Pro' },
    ],
} as const;

// Provider display info
export const PROVIDER_INFO = {
    claude: {
        name: 'Claude',
        company: 'Anthropic',
        color: '#D97757',
        icon: 'bi-robot',
    },
    openai: {
        name: 'ChatGPT',
        company: 'OpenAI',
        color: '#10a37f',
        icon: 'bi-chat-dots',
    },
    deepseek: {
        name: 'DeepSeek',
        company: 'DeepSeek AI',
        color: '#3b82f6',
        icon: 'bi-stars',
    },
    gemini: {
        name: 'Gemini',
        company: 'Google',
        color: '#8b5cf6',
        icon: 'bi-gem',
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

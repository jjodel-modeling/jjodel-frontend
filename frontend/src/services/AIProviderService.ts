/**
 * AI Provider Service
 * Handles API calls to different AI providers (Claude, OpenAI, DeepSeek, Gemini)
 */

import { AIProvider, ChatMessage, PROVIDER_ENDPOINTS } from '../types/jodie';
import { JodieConfigService } from './JodieConfig';

// System prompt for Jodie
const JODIE_SYSTEM_PROMPT = `You are Jodie, an expert AI assistant for Jjodel - a metamodeling and domain-specific language (DSL) design tool.

Your expertise includes:
- Metamodel design patterns and best practices
- UML class diagrams and relationships (inheritance, composition, aggregation)
- Model-Driven Development (MDD) and Model-Driven Architecture (MDA)
- Domain-Specific Languages (DSLs)
- Ecore and EMF concepts
- Model validation and constraints (OCL-like expressions)
- Code generation from models

Guidelines:
- Be concise but thorough
- Provide practical examples when helpful
- Suggest design patterns for common modeling scenarios
- Help users understand trade-offs in design decisions
- Use proper metamodeling terminology

When the user asks about their specific metamodel, provide relevant guidance based on general metamodeling principles.`;

export class AIProviderService {
    /**
     * Send a message to the specified AI provider
     */
    static async chat(
        message: string,
        provider: AIProvider,
        conversationHistory: ChatMessage[] = []
    ): Promise<string> {
        const config = JodieConfigService.getProvider(provider);

        if (!config || !config.apiKey) {
            throw new Error(`Provider ${provider} is not configured. Please add your API key in Settings.`);
        }

        switch (provider) {
            case 'claude':
                return await this.chatClaude(message, config.apiKey, config.model, conversationHistory);
            case 'openai':
                return await this.chatOpenAI(message, config.apiKey, config.model, conversationHistory);
            case 'deepseek':
                return await this.chatDeepSeek(message, config.apiKey, config.model, conversationHistory);
            case 'gemini':
                return await this.chatGemini(message, config.apiKey, config.model, conversationHistory);
            default:
                throw new Error(`Unknown provider: ${provider}`);
        }
    }

    /**
     * Chat with Claude (Anthropic)
     */
    private static async chatClaude(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[]
    ): Promise<string> {
        // Build messages array with history
        const messages = [
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user' as const, content: message },
        ];

        const response = await fetch(PROVIDER_ENDPOINTS.claude, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model,
                max_tokens: 2000,
                system: JODIE_SYSTEM_PROMPT,
                messages,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    /**
     * Chat with ChatGPT (OpenAI)
     */
    private static async chatOpenAI(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[]
    ): Promise<string> {
        // Build messages array with system prompt and history
        const messages = [
            { role: 'system' as const, content: JODIE_SYSTEM_PROMPT },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user' as const, content: message },
        ];

        const response = await fetch(PROVIDER_ENDPOINTS.openai, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`OpenAI API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Chat with DeepSeek
     */
    private static async chatDeepSeek(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[]
    ): Promise<string> {
        // Build messages array (OpenAI-compatible format)
        const messages = [
            { role: 'system' as const, content: JODIE_SYSTEM_PROMPT },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user' as const, content: message },
        ];

        const response = await fetch(PROVIDER_ENDPOINTS.deepseek, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                model,
                messages,
                max_tokens: 2000,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`DeepSeek API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Chat with Gemini (Google)
     */
    private static async chatGemini(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[]
    ): Promise<string> {
        // Build contents array for Gemini format
        const contents = [
            // System instruction as first user message
            {
                role: 'user',
                parts: [{ text: `System instructions: ${JODIE_SYSTEM_PROMPT}\n\nPlease acknowledge.` }],
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I am Jodie, your metamodeling assistant.' }],
            },
            // Conversation history
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            })),
            // Current message
            {
                role: 'user',
                parts: [{ text: message }],
            },
        ];

        const response = await fetch(
            `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents,
                    generationConfig: {
                        maxOutputTokens: 2000,
                    },
                }),
            }
        );

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    /**
     * Test if a provider's API key is valid
     */
    static async testConnection(provider: AIProvider): Promise<{ success: boolean; error?: string }> {
        try {
            const config = JodieConfigService.getProvider(provider);

            if (!config || !config.apiKey) {
                return { success: false, error: 'API key not configured' };
            }

            // Use provider-specific test methods for better error handling
            switch (provider) {
                case 'claude':
                    return await this.testClaude(config.apiKey, config.model);
                case 'openai':
                    return await this.testOpenAI(config.apiKey, config.model);
                case 'deepseek':
                    return await this.testDeepSeek(config.apiKey, config.model);
                case 'gemini':
                    return await this.testGemini(config.apiKey, config.model);
                default:
                    return { success: false, error: `Unknown provider: ${provider}` };
            }
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message || 'Connection test failed',
            };
        }
    }

    /**
     * Test Claude API connection
     */
    private static async testClaude(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Validate API key format
            if (!apiKey.startsWith('sk-ant-')) {
                return {
                    success: false,
                    error: 'Invalid API key format. Claude API keys should start with "sk-ant-"',
                };
            }

            const response = await fetch(PROVIDER_ENDPOINTS.claude, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API Error (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    if (errorJson.error?.message) {
                        errorMsg = errorJson.error.message;
                    } else if (errorJson.message) {
                        errorMsg = errorJson.message;
                    }
                } catch {
                    errorMsg += `: ${errorText.substring(0, 150)}`;
                }

                // Helpful hints based on status code
                if (response.status === 401) {
                    errorMsg = 'Invalid API key. Please check your key in the Anthropic Console.';
                } else if (response.status === 429) {
                    errorMsg = 'Rate limit exceeded. Please try again in a moment.';
                } else if (response.status === 400) {
                    errorMsg = 'Bad request. The model may be incorrect or unavailable.';
                }

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;

            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                return {
                    success: false,
                    error: 'Network error. Check your internet connection.',
                };
            }

            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    /**
     * Test OpenAI API connection
     */
    private static async testOpenAI(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            if (!apiKey.startsWith('sk-')) {
                return {
                    success: false,
                    error: 'Invalid API key format. OpenAI API keys should start with "sk-"',
                };
            }

            const response = await fetch(PROVIDER_ENDPOINTS.openai, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API Error (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
                } catch {
                    errorMsg += `: ${errorText.substring(0, 150)}`;
                }

                if (response.status === 401) {
                    errorMsg = 'Invalid API key. Please check your key in the OpenAI Dashboard.';
                }

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Failed to fetch')) {
                return { success: false, error: 'Network error. Check your internet connection.' };
            }
            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    /**
     * Test DeepSeek API connection
     */
    private static async testDeepSeek(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(PROVIDER_ENDPOINTS.deepseek, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model,
                    max_tokens: 10,
                    messages: [{ role: 'user', content: 'Hi' }],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API Error (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
                } catch {
                    errorMsg += `: ${errorText.substring(0, 150)}`;
                }

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Failed to fetch')) {
                return { success: false, error: 'Network error. Check your internet connection.' };
            }
            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    /**
     * Test Gemini API connection
     */
    private static async testGemini(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(
                `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: 'Hi' }] }],
                        generationConfig: { maxOutputTokens: 10 },
                    }),
                }
            );

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API Error (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorMsg;
                } catch {
                    errorMsg += `: ${errorText.substring(0, 150)}`;
                }

                if (response.status === 400) {
                    errorMsg = 'Invalid API key or model. Check your key in Google AI Studio.';
                }

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Failed to fetch')) {
                return { success: false, error: 'Network error. Check your internet connection.' };
            }
            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }
}

export default AIProviderService;

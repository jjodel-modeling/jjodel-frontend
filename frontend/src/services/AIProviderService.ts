/**
 * AI Provider Service
 * Handles API calls to different AI providers (Claude, OpenAI, DeepSeek, Gemini)
 */

import { AIProvider, ChatMessage, ChatImage, ChatDocument, PROVIDER_ENDPOINTS } from '../types/jodie';
import { JodieConfigService } from './JodieConfig';
import { buildSystemPromptWithContext } from '../constants/jjodiePrompt';

export class AIProviderService {
    /**
     * Send a message to the specified AI provider
     * @param message - The user's message
     * @param provider - Which AI provider to use
     * @param conversationHistory - Previous messages in the conversation
     * @param projectContext - Optional context string about the current project/metamodel
     * @param images - Optional images to include with the message
     * @param documents - Optional PDF documents to include with the message
     */
    static async chat(
        message: string,
        provider: AIProvider,
        conversationHistory: ChatMessage[] = [],
        projectContext?: string,
        images?: ChatImage[],
        documents?: ChatDocument[]
    ): Promise<string> {
        const config = JodieConfigService.getProvider(provider);

        if (!config || !config.apiKey) {
            throw new Error(`Provider ${provider} is not configured. Please add your API key in Settings.`);
        }

        // Build system prompt with optional project context
        const systemPrompt = buildSystemPromptWithContext(projectContext);

        switch (provider) {
            case 'claude':
                return await this.chatClaude(message, config.apiKey, config.model, conversationHistory, systemPrompt, images, documents);
            case 'openai':
                return await this.chatOpenAI(message, config.apiKey, config.model, conversationHistory, systemPrompt, images);
            case 'deepseek':
                return await this.chatDeepSeek(message, config.apiKey, config.model, conversationHistory, systemPrompt);
            case 'gemini':
                return await this.chatGemini(message, config.apiKey, config.model, conversationHistory, systemPrompt, images, documents);
            case 'mistral':
                return await this.chatMistral(message, config.apiKey, config.model, conversationHistory, systemPrompt, images);
            case 'groq':
                return await this.chatGroq(message, config.apiKey, config.model, conversationHistory, systemPrompt);
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
        history: ChatMessage[],
        systemPrompt: string,
        images?: ChatImage[],
        documents?: ChatDocument[]
    ): Promise<string> {
        // Build messages array with history
        const messages = [
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: (msg.images?.length || msg.documents?.length)
                    ? this.buildClaudeContent(msg.content, msg.images, msg.documents)
                    : msg.content,
            })),
        ];

        // Build current message content with images/documents if present
        const hasAttachments = (images?.length ?? 0) > 0 || (documents?.length ?? 0) > 0;
        const currentContent = hasAttachments
            ? this.buildClaudeContent(message, images, documents)
            : message;

        messages.push({ role: 'user' as const, content: currentContent });

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
                system: systemPrompt,
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
     * Build Claude content array with images, documents and text
     */
    private static buildClaudeContent(
        text: string,
        images?: ChatImage[],
        documents?: ChatDocument[]
    ): Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> {
        const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [];

        // Add documents first (PDFs)
        if (documents) {
            for (const doc of documents) {
                content.push({
                    type: 'document',
                    source: {
                        type: 'base64',
                        media_type: doc.mimeType,
                        data: doc.data,
                    },
                });
            }
        }

        // Add images
        if (images) {
            for (const img of images) {
                content.push({
                    type: 'image',
                    source: {
                        type: 'base64',
                        media_type: img.mimeType,
                        data: img.data,
                    },
                });
            }
        }

        // Add text
        if (text) {
            content.push({ type: 'text', text });
        }

        return content;
    }

    /**
     * Chat with ChatGPT (OpenAI)
     */
    private static async chatOpenAI(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string,
        images?: ChatImage[]
    ): Promise<string> {
        // Build messages array with system prompt and history
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
            { role: 'system' as const, content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.images?.length ? this.buildOpenAIContent(msg.content, msg.images) : msg.content,
            })),
        ];

        // Build current message content with images if present
        const currentContent = images?.length
            ? this.buildOpenAIContent(message, images)
            : message;

        messages.push({ role: 'user' as const, content: currentContent });

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
     * Build OpenAI content array with images and text
     */
    private static buildOpenAIContent(text: string, images: ChatImage[]): Array<{ type: string; text?: string; image_url?: { url: string } }> {
        const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [];

        // Add text first for OpenAI
        if (text) {
            content.push({ type: 'text', text });
        }

        // Add images
        for (const img of images) {
            content.push({
                type: 'image_url',
                image_url: {
                    url: `data:${img.mimeType};base64,${img.data}`,
                },
            });
        }

        return content;
    }

    /**
     * Chat with DeepSeek
     */
    private static async chatDeepSeek(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string
    ): Promise<string> {
        // Build messages array (OpenAI-compatible format)
        const messages = [
            { role: 'system' as const, content: systemPrompt },
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
        history: ChatMessage[],
        systemPrompt: string,
        images?: ChatImage[],
        documents?: ChatDocument[]
    ): Promise<string> {
        // Build contents array for Gemini format
        const contents: Array<{ role: string; parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> }> = [
            // System instruction as first user message
            {
                role: 'user',
                parts: [{ text: `System instructions: ${systemPrompt}\n\nPlease acknowledge.` }],
            },
            {
                role: 'model',
                parts: [{ text: 'Understood. I am Jjodie, your metamodeling assistant.' }],
            },
            // Conversation history
            ...history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: (msg.images?.length || msg.documents?.length)
                    ? this.buildGeminiParts(msg.content, msg.images, msg.documents)
                    : [{ text: msg.content }],
            })),
        ];

        // Build current message parts with images/documents if present
        const hasAttachments = (images?.length ?? 0) > 0 || (documents?.length ?? 0) > 0;
        const currentParts = hasAttachments
            ? this.buildGeminiParts(message, images, documents)
            : [{ text: message }];

        contents.push({
            role: 'user',
            parts: currentParts,
        });

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
     * Build Gemini parts array with images, documents and text
     */
    private static buildGeminiParts(
        text: string,
        images?: ChatImage[],
        documents?: ChatDocument[]
    ): Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> {
        const parts: Array<{ text?: string; inline_data?: { mime_type: string; data: string } }> = [];

        // Add documents first (PDFs) for Gemini
        if (documents) {
            for (const doc of documents) {
                parts.push({
                    inline_data: {
                        mime_type: doc.mimeType,
                        data: doc.data,
                    },
                });
            }
        }

        // Add images
        if (images) {
            for (const img of images) {
                parts.push({
                    inline_data: {
                        mime_type: img.mimeType,
                        data: img.data,
                    },
                });
            }
        }

        // Add text
        if (text) {
            parts.push({ text });
        }

        return parts;
    }

    /**
     * Chat with Mistral AI
     */
    private static async chatMistral(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string,
        images?: ChatImage[]
    ): Promise<string> {
        // Build messages array (OpenAI-compatible format for Pixtral vision models)
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | Array<{ type: string; text?: string; image_url?: string }> }> = [
            { role: 'system' as const, content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.images?.length ? this.buildMistralContent(msg.content, msg.images) : msg.content,
            })),
        ];

        // Build current message content with images if present
        const currentContent = images?.length
            ? this.buildMistralContent(message, images)
            : message;

        messages.push({ role: 'user' as const, content: currentContent });

        const response = await fetch(PROVIDER_ENDPOINTS.mistral, {
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
            throw new Error(`Mistral API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    /**
     * Build Mistral content array with images and text (Pixtral format)
     */
    private static buildMistralContent(text: string, images: ChatImage[]): Array<{ type: string; text?: string; image_url?: string }> {
        const content: Array<{ type: string; text?: string; image_url?: string }> = [];

        // Add text first
        if (text) {
            content.push({ type: 'text', text });
        }

        // Add images as data URLs
        for (const img of images) {
            content.push({
                type: 'image_url',
                image_url: `data:${img.mimeType};base64,${img.data}`,
            });
        }

        return content;
    }

    /**
     * Chat with Groq
     */
    private static async chatGroq(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string
    ): Promise<string> {
        // Build messages array (OpenAI-compatible format)
        const messages = [
            { role: 'system' as const, content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user' as const, content: message },
        ];

        const response = await fetch(PROVIDER_ENDPOINTS.groq, {
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
            throw new Error(`Groq API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
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
                case 'mistral':
                    return await this.testMistral(config.apiKey, config.model);
                case 'groq':
                    return await this.testGroq(config.apiKey, config.model);
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

    /**
     * Test Mistral API connection
     */
    private static async testMistral(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(PROVIDER_ENDPOINTS.mistral, {
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
                    errorMsg = 'Invalid API key. Please check your key in the Mistral Console.';
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
     * Test Groq API connection
     */
    private static async testGroq(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            const response = await fetch(PROVIDER_ENDPOINTS.groq, {
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
                    errorMsg = 'Invalid API key. Please check your key in the Groq Console.';
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

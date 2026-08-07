/**
 * AI Provider Service
 * Handles API calls to different AI providers (Claude, OpenAI, DeepSeek, Gemini)
 */

import {AIProvider, TAIProvider, ChatMessage, ChatImage, ChatDocument, AI, AIConfig, resolveLegacyModelId, isForeignModel, getAICompany} from '../types/jodie';
import { PromptService } from './PromptService';
import { PromptContext } from '../types/prompts';

/**
 * Output-token ceiling for full chat completions (the Jodie chat, which is also how
 * JjScript is generated). Sized to comfortably cover large generated scripts
 * (~500 commands ≈ ~8000 tokens) so the model is not cut off mid-script, which would
 * otherwise emit a truncated JjScript. Kept within the output cap of the current
 * default models. Applies to every provider's chat path (NOT the max_tokens:10 used by
 * the connection-test calls).
 */
const CHAT_MAX_OUTPUT_TOKENS = 8192;

export class AIProviderService {
    /**
     * Send a message to the specified AI provider
     * @param message - The user's message
     * @param provider - Which AI provider to use
     * @param conversationHistory - Previous messages in the conversation
     * @param projectContext - Optional context string about the current project/metamodel
     * @param images - Optional images to include with the message
     * @param documents - Optional PDF documents to include with the message
     * @param model - Optional explicit model ID. When omitted, falls back to `AIConfig.get(provider).model`
     *                (legacy per-provider field, still honoured during the deprecation window).
     */
    static async chat(
        message: string,
        provider: TAIProvider,
        conversationHistory: ChatMessage[] = [],
        projectContext?: string,
        images?: ChatImage[],
        documents?: ChatDocument[],
        model?: string
    ): Promise<string> {
        const config = AIConfig.get(provider);
        let llm = AI[provider];
        // Ollama doesn't require API key
        if (!config) {
            throw new Error(`Provider ${provider} is not configured. Please configure it in Settings.`);
        }
        if (!config.isConfigured()) {
            throw new Error(`Provider ${provider} is not configured. Please add your API key in Settings.`);
        }

        // Pre-send validation (no network call): the API key's prefix must be coherent with
        // the active provider. Surfaces a plain-language message through the caller's existing
        // error channel (e.g. the Jodie chat bubble) instead of a cryptic 401 from the endpoint.
        const keyError = this.validateKeyCoherence(provider, config);
        if (keyError) throw new Error(keyError);

        // Resolve effective model: explicit param > per-provider config. Run through legacy ID map
        // so stale identifiers (e.g. persisted before a rename) reach the current canonical form.
        let effectiveModel = resolveLegacyModelId(provider, model ?? config.model) ?? config.model ?? '';
        // Guard the provider/model pairing: a model belonging to a *different* provider (e.g. a
        // per-feature "chat" model chosen under OpenAI while the active provider is Claude) must
        // never be sent — it yields a cryptic 404. Fall back to the provider's own model.
        // Custom has no model registry — any user-supplied model is valid (e.g. an OpenAI-compatible
        // proxy serving 'gpt-4o' or 'mistral-large-latest'), so it must bypass the foreign-model guard.
        if (effectiveModel && provider !== AIProvider.Custom && isForeignModel(provider, effectiveModel)) {
            let own = resolveLegacyModelId(provider, config.model) ?? config.model ?? '';
            if (!own || isForeignModel(provider, own)) own = Object.keys(llm?.versions ?? {})[0] ?? '';
            console.warn(`[AIProviderService] Discarding model "${effectiveModel}" — not a ${provider} model; using "${own}" instead.`);
            effectiveModel = own;
        }
        if (!effectiveModel.trim()) {
            throw new Error(`No model selected for ${provider}. Please choose a model in Settings.`);
        }

        // Build system prompt with optional project context using PromptService
        const context: PromptContext | undefined = projectContext
            ? { customVariables: { projectContext } }
            : undefined;
        const systemPrompt = PromptService.getRendered('chat', context);

        switch (provider) {
            case AIProvider.Claude:
                return await this.chatClaude(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt, images, documents);
            case AIProvider.GPT:
                return await this.chatOpenAI(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt, images);
            case AIProvider.DeepSeek:
                return await this.chatDeepSeek(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt);
            case AIProvider.Gemini:
                return await this.chatGemini(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt, images, documents);
            case AIProvider.Mistral:
                return await this.chatMistral(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt, images);
            case AIProvider.Groq:
                return await this.chatGroq(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt);
            case AIProvider.Kimi:
                return await this.chatKimi(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt);
            case AIProvider.Ollama:
                return await this.chatOllama(message, effectiveModel, conversationHistory, systemPrompt, config.baseUrl);
            case AIProvider.Custom:
                return await this.chatCustom(message, config.apiKey, effectiveModel, conversationHistory, systemPrompt, config.baseUrl, images);
            case AIProvider.Llama:
                throw new Error('Llama is not yet supported (no endpoint configured).');
            case AIProvider.Copilot:
                throw new Error('Copilot is not yet supported.');
            default:
                throw new Error(`Unsupported provider: ${provider}`);
        }
    }

    /**
     * Resolve an OpenAI-compatible chat-completions URL from a user-supplied base URL.
     * Shared by the two baseUrl providers (Ollama, Custom). Idempotent and robust:
     *   - already a full ".../chat/completions"   → used as-is
     *   - a versioned root ".../v1" (or /v2, …)    → append "/chat/completions"
     *   - a bare host "http://localhost:11434"     → append "/v1/chat/completions"
     * Trailing slashes are trimmed first.
     */
    private static resolveChatCompletionsUrl(baseUrl: string): string {
        const b = baseUrl.trim().replace(/\/+$/, '');
        if (/\/chat\/completions$/.test(b)) return b;          // full endpoint already
        if (/\/v\d+$/.test(b)) return `${b}/chat/completions`; // .../v1 root, append
        return `${b}/v1/chat/completions`;                     // bare host (Ollama default)
    }

    /**
     * Shared transport for all OpenAI-compatible providers (GPT, DeepSeek, Mistral, Groq, Kimi,
     * Ollama, Custom). Performs ONLY the network round-trip: it takes an already-built `messages`
     * array (each caller keeps its own content builder) plus provider-specific `bodyExtras`
     * (e.g. {max_tokens} vs {stream:false}), applies auth per the registry `authScheme`, POSTs the
     * standard chat-completions body, extracts the assistant text, and reports errors in the
     * existing style. Claude/Gemini are NOT OpenAI-compatible and keep their dedicated methods.
     */
    private static async chatOpenAICompatible(
        endpoint: string,
        authScheme: AI['authScheme'],
        apiKey: string,
        model: string,
        messages: any[],
        bodyExtras: Record<string, unknown>,
        providerLabel: string
    ): Promise<string> {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (authScheme === 'bearer') headers['Authorization'] = `Bearer ${apiKey}`;

        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body: JSON.stringify({ model, messages, ...bodyExtras }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`${providerLabel} API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        if (data.choices?.[0]?.finish_reason === 'length') {
            console.warn(`[AIProviderService] ${providerLabel} response hit the token limit (finish_reason=length) — output was truncated and may be incomplete. Raise CHAT_MAX_OUTPUT_TOKENS if this recurs.`);
        }
        return data.choices[0].message.content;
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

        const response = await fetch(AI.Claude.endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
                'anthropic-dangerous-direct-browser-access': 'true',
            },
            body: JSON.stringify({
                model,
                max_tokens: CHAT_MAX_OUTPUT_TOKENS,
                system: systemPrompt,
                messages,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Claude API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        if (data.stop_reason === 'max_tokens') {
            console.warn('[AIProviderService] Claude response hit max_tokens — output was truncated and may be incomplete (e.g. a cut-off JjScript). Raise CHAT_MAX_OUTPUT_TOKENS if this recurs.');
        }
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

        return this.chatOpenAICompatible(
            AI.GPT.getEndpoint(),
            AI.GPT.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'OpenAI'
        );
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

        return this.chatOpenAICompatible(
            AI.DeepSeek.getEndpoint(),
            AI.DeepSeek.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'DeepSeek'
        );
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

        // Use proxy endpoint to avoid CORS issues
        const proxyUrl = `${AI.Gemini.getEndpoint()}/${model}/generateContent?key=${apiKey}`;

        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents,
                generationConfig: {
                    maxOutputTokens: CHAT_MAX_OUTPUT_TOKENS,
                },
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API error: ${response.status} - ${error}`);
        }

        const data = await response.json();
        if (data.candidates?.[0]?.finishReason === 'MAX_TOKENS') {
            console.warn('[AIProviderService] Gemini response hit MAX_TOKENS — output was truncated and may be incomplete. Raise CHAT_MAX_OUTPUT_TOKENS if this recurs.');
        }
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

        return this.chatOpenAICompatible(
            AI.Mistral.getEndpoint(),
            AI.Mistral.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'Mistral'
        );
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

        return this.chatOpenAICompatible(
            AI.Groq.getEndpoint(),
            AI.Groq.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'Groq'
        );
    }

    /**
     * Chat with Kimi (Moonshot AI) - OpenAI-compatible API
     */
    private static async chatKimi(
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

        return this.chatOpenAICompatible(
            AI.Kimi.getEndpoint(),
            AI.Kimi.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'Kimi'
        );
    }

    /**
     * Chat with Ollama (Local) - OpenAI-compatible API
     */
    private static async chatOllama(
        message: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string,
        baseUrl?: string
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

        const endpoint = baseUrl ? this.resolveChatCompletionsUrl(baseUrl) : AI.Ollama.endpoint;

        return this.chatOpenAICompatible(
            endpoint,
            AI.Ollama.authScheme,
            '',
            model,
            messages,
            { stream: false, max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'Ollama'
        );
    }

    /**
     * Chat with a user-configured Custom provider (any OpenAI-compatible chat-completions endpoint).
     * Endpoint comes from the user's Base URL (normalized via resolveChatCompletionsUrl); a missing
     * Base URL fails loudly because Custom's isConfigured() passes on an API key alone.
     */
    private static async chatCustom(
        message: string,
        apiKey: string,
        model: string,
        history: ChatMessage[],
        systemPrompt: string,
        baseUrl: string,
        images?: ChatImage[]
    ): Promise<string> {
        if (!baseUrl || !baseUrl.trim()) {
            throw new Error('Custom provider requires a Base URL. Set it in Settings.');
        }

        // OpenAI-compatible message shape (same content builder as GPT).
        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [
            { role: 'system' as const, content: systemPrompt },
            ...history.map(msg => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.images?.length ? this.buildOpenAIContent(msg.content, msg.images) : msg.content,
            })),
        ];
        const currentContent = images?.length ? this.buildOpenAIContent(message, images) : message;
        messages.push({ role: 'user' as const, content: currentContent });

        return this.chatOpenAICompatible(
            this.resolveChatCompletionsUrl(baseUrl),
            AI.Custom.authScheme,
            apiKey,
            model,
            messages,
            { max_tokens: CHAT_MAX_OUTPUT_TOKENS },
            'Custom'
        );
    }

    /**
     * Test if a provider's API key is valid
     */
    static async testConnection(provider: TAIProvider): Promise<{ success: boolean; error?: string }> {
        try {
            const config = AIConfig.get(provider);
            const llm = AI[provider];

            if (!config) return { success: false, error: 'Provider not configured' };

            // Ollama doesn't require API key, other providers do
            if (!config.isConfigured()) return { success: false, error: 'API key not configured' };

            // Claude/Gemini keep their dedicated tests; the OpenAI-compatible providers route
            // through the shared testOpenAICompatible, preserving each provider's success criterion
            // and 401/404/network hints via parameters.
            switch (provider) {
                case AIProvider.Claude:
                    return await this.testClaude(config.apiKey, config.model);
                case AIProvider.Gemini:
                    return await this.testGemini(config.apiKey, config.model);
                case AIProvider.GPT:
                    return await this.testOpenAICompatible(AI.GPT.getEndpoint(), AI.GPT.authScheme, config.apiKey, config.model, { max_tokens: 10 }, {
                        expectedKeyPrefix: 'sk-',
                        invalidKeyHint: 'Invalid API key. Please check your key in the OpenAI Dashboard.',
                    });
                case AIProvider.DeepSeek:
                    return await this.testOpenAICompatible(AI.DeepSeek.getEndpoint(), AI.DeepSeek.authScheme, config.apiKey, config.model, { max_tokens: 10 });
                case AIProvider.Mistral:
                    return await this.testOpenAICompatible(AI.Mistral.getEndpoint(), AI.Mistral.authScheme, config.apiKey, config.model, { max_tokens: 10 }, {
                        invalidKeyHint: 'Invalid API key. Please check your key in the Mistral Console.',
                    });
                case AIProvider.Groq:
                    return await this.testOpenAICompatible(AI.Groq.getEndpoint(), AI.Groq.authScheme, config.apiKey, config.model, { max_tokens: 10 }, {
                        invalidKeyHint: 'Invalid API key. Please check your key in the Groq Console.',
                    });
                case AIProvider.Kimi:
                    return await this.testOpenAICompatible(AI.Kimi.getEndpoint(), AI.Kimi.authScheme, config.apiKey, config.model, { max_tokens: 10 }, {
                        invalidKeyHint: 'Invalid API key. Please check your key in the Moonshot AI Console.',
                    });
                case AIProvider.Ollama: {
                    const endpoint = config.baseUrl ? this.resolveChatCompletionsUrl(config.baseUrl) : AI.Ollama.endpoint;
                    return await this.testOpenAICompatible(endpoint, AI.Ollama.authScheme, '', config.model, { stream: false }, {
                        notFoundHint: `Model "${config.model}" not found. Make sure it's pulled in Ollama.`,
                        networkErrorHint: `Cannot connect to Ollama at ${endpoint}. Make sure Ollama is running.`,
                    });
                }
                case AIProvider.Custom: {
                    if (!config.baseUrl || !config.baseUrl.trim()) return { success: false, error: 'Custom provider requires a Base URL.' };
                    return await this.testOpenAICompatible(this.resolveChatCompletionsUrl(config.baseUrl), AI.Custom.authScheme, config.apiKey, config.model, { max_tokens: 10 });
                }
                case AIProvider.Llama:
                    return { success: false, error: 'Llama is not yet supported (no endpoint configured).' };
                case AIProvider.Copilot:
                    return { success: false, error: 'Copilot is not yet supported.' };
                default:
                    return { success: false, error: `Unsupported provider: ${provider}` };
            }
        } catch (error) {
            return {
                success: false,
                error: 'Connection test failed.\n' + ((error as Error).message || ''),
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

            // Use proxy endpoint to avoid CORS issues
            const proxyUrl = AI.Claude.getEndpoint();

            const response = await fetch(proxyUrl, {
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
                    } else if (errorJson.error) {
                        errorMsg = typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error);
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
                } else if (response.status === 403) {
                    errorMsg = 'Access denied. Origin not allowed by proxy.';
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
                    error: 'Network error. The proxy service may be unavailable.',
                };
            }

            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    /**
     * Test Gemini API connection (via proxy)
     */
    private static async testGemini(apiKey: string, model: string): Promise<{ success: boolean; error?: string }> {
        try {
            // Use proxy endpoint to avoid CORS issues
            const proxyUrl = `${AI.Gemini.getEndpoint()}/${model}:generateContent?key=${apiKey}`;
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Hi' }] }],
                    generationConfig: { maxOutputTokens: 10 },
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

                if (response.status === 400 || response.status === 403) {
                    errorMsg = 'Invalid API key or model. Check your key in Google AI Studio.';
                }

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Failed to fetch')) {
                return { success: false, error: 'Network error. The proxy service may be unavailable.' };
            }
            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    /**
     * Shared connection test for all OpenAI-compatible providers (GPT, DeepSeek, Mistral, Groq,
     * Kimi, Ollama, Custom). POSTs a minimal "Hi" probe and treats any 2xx as success. Per-provider
     * differences are passed as options: an optional key-prefix format check, and 401/404/network
     * hint overrides. Body shape varies via `bodyExtras` ({max_tokens:10} vs {stream:false}).
     */
    private static async testOpenAICompatible(
        endpoint: string,
        authScheme: AI['authScheme'],
        apiKey: string,
        model: string,
        bodyExtras: Record<string, unknown>,
        opts?: {
            expectedKeyPrefix?: string;
            invalidKeyHint?: string;
            notFoundHint?: string;
            networkErrorHint?: string;
        }
    ): Promise<{ success: boolean; error?: string }> {
        try {
            if (opts?.expectedKeyPrefix && !apiKey.startsWith(opts.expectedKeyPrefix)) {
                return {
                    success: false,
                    error: `Invalid API key format. Keys should start with "${opts.expectedKeyPrefix}"`,
                };
            }

            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (authScheme === 'bearer') headers['Authorization'] = `Bearer ${apiKey}`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Hi' }], ...bodyExtras }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                let errorMsg = `API Error (${response.status})`;

                try {
                    const errorJson = JSON.parse(errorText);
                    errorMsg = errorJson.error?.message || errorJson.message || errorJson.error || errorMsg;
                } catch {
                    errorMsg += `: ${errorText.substring(0, 150)}`;
                }

                if (response.status === 401 && opts?.invalidKeyHint) errorMsg = opts.invalidKeyHint;
                if (response.status === 404 && opts?.notFoundHint) errorMsg = opts.notFoundHint;

                return { success: false, error: errorMsg };
            }

            await response.json();
            return { success: true };
        } catch (error) {
            const errorMessage = (error as Error).message;
            if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
                return { success: false, error: opts?.networkErrorHint || 'Network error. Check your internet connection.' };
            }
            return { success: false, error: `Connection error: ${errorMessage}` };
        }
    }

    // ── Pre-send credential validation ───────────────────────────────────────────

    /**
     * Distinctive key prefixes that unambiguously identify a provider. Used to detect a key
     * pasted under the wrong provider (e.g. a Google "AIza…" key under OpenAI).
     */
    private static readonly DISTINCTIVE_KEY_PREFIXES: ReadonlyArray<{ prefix: string; provider: TAIProvider }> = [
        { prefix: 'sk-ant-', provider: AIProvider.Claude },
        //{ prefix: 'AIza',    provider: AIProvider.Gemini },
        { prefix: 'gsk_',    provider: AIProvider.Groq },
    ];

    /**
     * Expected key prefix per provider, where one is well-known. DeepSeek shares OpenAI's
     * "sk-" prefix, so those two cannot be told apart by prefix alone.
     */
    private static readonly EXPECTED_KEY_PREFIX: Partial<Record<TAIProvider, string>> = {
        [AIProvider.Claude]:   'sk-ant-',
        [AIProvider.GPT]:      'sk-',
        //[AIProvider.Gemini]:   'AIza',
        [AIProvider.Groq]:     'gsk_',
        [AIProvider.DeepSeek]: 'sk-',
    };

    /** Human-friendly provider label, e.g. "OpenAI (GPT)", "Anthropic (Claude)", "Groq". */
    private static providerLabel(provider: TAIProvider): string {
        const company = getAICompany(provider);
        return company && company !== provider ? `${company} (${provider})` : provider;
    }

    /**
     * Returns a plain-language error string when the API key's prefix is incoherent with the
     * active provider, or null when the key looks fine (or coherence cannot be judged).
     * Skips providers that don't require a key (Ollama) and the Custom provider. Assumes the
     * key is present (empty keys are handled upstream by AIConfig.isConfigured()).
     */
    private static validateKeyCoherence(provider: TAIProvider, config: AIConfig): string | null {
        const llm = AI[provider];
        if (!llm || !llm.requiresKey || provider === AIProvider.Custom) return null;
        const apiKey = (config.apiKey || '').trim();
        if (!apiKey) return null;

        // A. The key unmistakably belongs to a *different* provider.
        for (const d of this.DISTINCTIVE_KEY_PREFIXES) {
            if (apiKey.startsWith(d.prefix) && d.provider !== provider) {
                return `This looks like a ${this.providerLabel(d.provider)} API key, but the active provider is ${this.providerLabel(provider)}. Enter the ${this.providerLabel(provider)} key, or switch the provider in Settings.`;
            }
        }
        // B. The active provider has a well-known prefix the key does not match.
        const expected = this.EXPECTED_KEY_PREFIX[provider];
        if (expected && !apiKey.startsWith(expected)) {
            return `${this.providerLabel(provider)} API keys should start with "${expected}". The key you entered does not — please check it in Settings.`;
        }
        return null;
    }
}

export default AIProviderService;

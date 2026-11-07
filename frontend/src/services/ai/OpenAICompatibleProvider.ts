/**
 * The OpenAI-compatible family (`openai` SDK): GPT, DeepSeek, Groq, Mistral, Kimi, Ollama, Custom.
 * The SDK is loaded by `await import('openai')` inside `client()` (R-AI-2).
 */
import type OpenAI from 'openai';
import { BaseProvider, capabilitiesFor, orderCatalog } from './BaseProvider';
import type { CatalogEntry } from './BaseProvider';
import type { ChatRequest } from './types';
import { AIModel, EAuthScheme, ECapabilities } from './types';

/**
 * The SDK `baseURL` for a user-supplied endpoint; the SDK appends `/chat/completions` itself.
 *   - a full ".../chat/completions"  → the part before it
 *   - a versioned root ".../v1"      → used as-is
 *   - a bare host "http://host:11434" → "/v1" appended (Ollama's default)
 * Trailing slashes are trimmed first.
 */
export function openAIBaseUrl(endpoint: string): string {
    const b = endpoint.trim().replace(/\/+$/, '');
    if (/\/chat\/completions$/.test(b)) return b.replace(/\/chat\/completions$/, '');
    if (/\/v\d+$/.test(b)) return b;
    return `${b}/v1`;
}

/**
 * OpenAI family: `line:tier`. line = gpt | chatgpt | o (o1, o3, o4...); tier = the trailing
 * mini | nano token, else base. A dated snapshot (`-YYYY-MM-DD`) is grouped with its alias.
 */
export function openaiFamily(id: string): string {
    const base = id.replace(/-\d{4}-\d{2}-\d{2}$/, '');
    const line = base.startsWith('chatgpt-') ? 'chatgpt' : /^o\d/.test(base) ? 'o' : 'gpt';
    const last = base.split('-').pop() ?? '';
    const tier = last === 'mini' || last === 'nano' ? last : 'base';
    return `${line}:${tier}`;
}

const OPENAI_SNAPSHOT = /-\d{4}-\d{2}-\d{2}$/;
/** Models the chat-completions path cannot use (audio, image, search, Responses-only...). */
const OPENAI_DENY = /audio|realtime|transcribe|tts|image|search|embedding|moderation|instruct|whisper|dall-e|codex|deep-research|-pro(-|$)/;

/**
 * Every `X-Stainless-*` header the installed `openai` SDK (7.47.0: `internal/detect-platform.mjs`,
 * `client.mjs`, the polling helpers) can add, set to null so none reaches the wire (R-AI-19): the CORS
 * preflight of api.mistral.ai and api.moonshot.cn rejects them, and the request then reads as a
 * connection error instead of its status. A null in `defaultHeaders` is the SDK's way to unset one.
 */
const NO_STAINLESS_HEADERS: Record<string, null> = {
    'X-Stainless-Lang': null,
    'X-Stainless-Package-Version': null,
    'X-Stainless-OS': null,
    'X-Stainless-Arch': null,
    'X-Stainless-Runtime': null,
    'X-Stainless-Runtime-Version': null,
    'X-Stainless-Retry-Count': null,
    'X-Stainless-Timeout': null,
    'X-Stainless-Helper-Method': null,
    'X-Stainless-Poll-Helper': null,
    'X-Stainless-Custom-Poll-Interval': null,
};

type ContentPart =
    | { type: 'text'; text: string }
    | { type: 'image_url'; image_url: { url: string } }
    | { type: 'file'; file: { filename: string; file_data: string } };

export class OpenAICompatibleProvider extends BaseProvider {
    sdkBaseUrl(): string {
        return openAIBaseUrl(this.baseUrl);
    }

    protected async client(): Promise<OpenAI> {
        const { default: OpenAIClient } = await import('openai');
        // A keyless call (Ollama, a Custom endpoint without key) sends no Authorization header; the
        // SDK refuses an empty key, so it gets a placeholder that the null header then removes.
        const keyless = this.authScheme === EAuthScheme.NONE || !this.apiKey;
        return new OpenAIClient({
            apiKey: keyless ? 'none' : this.apiKey,
            baseURL: this.sdkBaseUrl(),
            organization: null,
            project: null,
            dangerouslyAllowBrowser: true,
            maxRetries: 0,
            fetch: this.options.fetch,
            defaultHeaders: keyless ? { ...NO_STAINLESS_HEADERS, Authorization: null } : NO_STAINLESS_HEADERS,
        });
    }

    /**
     * System, then the history; a turn with attachments is text, images, PDFs. An earlier turn keeps
     * its own attachments the model declares (R-AI-17); the current turn adds the request's.
     */
    protected messages(req: ChatRequest, modelId: string): OpenAI.Chat.ChatCompletionMessageParam[] {
        const model = this.model(modelId);
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (req.system) messages.push({ role: 'system', content: req.system });
        const last = req.history.length - 1;
        req.history.forEach((msg, i) => {
            const current = i === last && msg.role === 'user';
            const images = [...(model?.has(ECapabilities.IMAGES) ? msg.images ?? [] : []), ...(current ? req.images ?? [] : [])];
            const documents = [...(model?.has(ECapabilities.DOCUMENTS) ? msg.documents ?? [] : []), ...(current ? req.documents ?? [] : [])];
            if (!images.length && !documents.length) {
                messages.push({ role: msg.role, content: msg.content } as OpenAI.Chat.ChatCompletionMessageParam);
                return;
            }
            const parts: ContentPart[] = [];
            if (msg.content) parts.push({ type: 'text', text: msg.content });
            for (const img of images) {
                parts.push({ type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.data}` } });
            }
            for (const doc of documents) {
                parts.push({ type: 'file', file: { filename: doc.name ?? 'document.pdf', file_data: `data:${doc.mimeType};base64,${doc.data}` } });
            }
            messages.push({ role: msg.role, content: parts } as OpenAI.Chat.ChatCompletionMessageParam);
        });
        return messages;
    }

    protected async send(modelId: string, req: ChatRequest): Promise<string> {
        const client = await this.client();
        const completion = await client.chat.completions.create({
            model: modelId,
            messages: this.messages(req, modelId),
            max_tokens: this.maxOutputTokens(req),
        }, { signal: req.signal });
        return completion.choices[0]?.message?.content ?? '';
    }

    protected async *stream(modelId: string, req: ChatRequest): AsyncIterable<string> {
        const client = await this.client();
        const chunks = await client.chat.completions.create({
            model: modelId,
            messages: this.messages(req, modelId),
            max_tokens: this.maxOutputTokens(req),
            stream: true,
        }, { signal: req.signal });
        for await (const chunk of chunks) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
        // The SDK ends an aborted stream quietly; it ends with the abort error, as the Google family's does.
        req.signal?.throwIfAborted();
    }

    protected async probe(modelId: string): Promise<void> {
        const client = await this.client();
        await client.chat.completions.create({
            model: modelId,
            messages: [{ role: 'user', content: 'Hi' }],
            max_tokens: 10,
        });
    }

    protected async listModels(): Promise<AIModel[]> {
        const client = await this.client();
        const entries: CatalogEntry[] = [];
        for await (const m of client.models.list()) {
            if (typeof m?.id !== 'string') continue;
            const created = (typeof m.created === 'number' ? m.created : 0) * 1000;
            if (this.name === 'GPT') {
                if (!/^(gpt-|chatgpt-|o\d)/.test(m.id) || OPENAI_DENY.test(m.id)) continue;
                const { capabilities, contextWindow } = capabilitiesFor(m.id);
                entries.push({
                    model: new AIModel(m.id, m.id, capabilities, contextWindow),
                    family: openaiFamily(m.id),
                    rank: OPENAI_SNAPSHOT.test(m.id) ? created - 1e13 : created,
                });
            } else {
                const { capabilities, contextWindow } = capabilitiesFor(m.id);
                entries.push({ model: new AIModel(m.id, m.id, capabilities, contextWindow), family: m.id, rank: created });
            }
        }
        return orderCatalog(entries);
    }

    protected notFoundMessage(modelId: string): string {
        if (this.name === 'Ollama') return `Model "${modelId}" not found. Make sure it's pulled in Ollama.`;
        return super.notFoundMessage(modelId);
    }

    protected networkMessage(): string {
        if (this.name === 'Ollama') return `Cannot connect to Ollama at ${this.sdkBaseUrl()}. Make sure Ollama is running.`;
        return super.networkMessage();
    }
}

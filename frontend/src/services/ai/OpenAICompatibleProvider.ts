/**
 * The OpenAI-compatible family (`openai` SDK): GPT, DeepSeek, Groq, Mistral, Kimi, Ollama, Custom.
 * The SDK is loaded by `await import('openai')` inside `client()` (R-AI-2).
 */
import type OpenAI from 'openai';
import { BaseProvider, capabilitiesFor, orderCatalog } from './BaseProvider';
import type { CatalogEntry } from './BaseProvider';
import type { ChatRequest } from './types';
import { AIModel, EAuthScheme } from './types';

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
            defaultHeaders: keyless ? { Authorization: null } : undefined,
        });
    }

    protected messages(req: ChatRequest): OpenAI.Chat.ChatCompletionMessageParam[] {
        const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
        if (req.system) messages.push({ role: 'system', content: req.system });
        const last = req.history.length - 1;
        req.history.forEach((msg, i) => {
            const attachments = i === last && msg.role === 'user' && (req.images?.length || req.documents?.length);
            if (!attachments) {
                messages.push({ role: msg.role, content: msg.content } as OpenAI.Chat.ChatCompletionMessageParam);
                return;
            }
            const parts: ContentPart[] = [];
            if (msg.content) parts.push({ type: 'text', text: msg.content });
            for (const img of req.images ?? []) {
                parts.push({ type: 'image_url', image_url: { url: `data:${img.mimeType};base64,${img.data}` } });
            }
            for (const doc of req.documents ?? []) {
                parts.push({ type: 'file', file: { filename: doc.name ?? 'document.pdf', file_data: `data:${doc.mimeType};base64,${doc.data}` } });
            }
            messages.push({ role: 'user', content: parts });
        });
        return messages;
    }

    protected async send(modelId: string, req: ChatRequest): Promise<string> {
        const client = await this.client();
        const completion = await client.chat.completions.create({
            model: modelId,
            messages: this.messages(req),
            max_tokens: this.maxOutputTokens(req),
        });
        return completion.choices[0]?.message?.content ?? '';
    }

    protected async *stream(modelId: string, req: ChatRequest): AsyncIterable<string> {
        const client = await this.client();
        const chunks = await client.chat.completions.create({
            model: modelId,
            messages: this.messages(req),
            max_tokens: this.maxOutputTokens(req),
            stream: true,
        });
        for await (const chunk of chunks) {
            const text = chunk.choices[0]?.delta?.content;
            if (text) yield text;
        }
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

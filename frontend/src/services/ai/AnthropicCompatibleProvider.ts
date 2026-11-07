/**
 * The Anthropic family (`@anthropic-ai/sdk`): Claude. The SDK is loaded by
 * `await import('@anthropic-ai/sdk')` inside `client()` (R-AI-2). With `dangerouslyAllowBrowser`
 * it sends `anthropic-dangerous-direct-browser-access: true` itself, and the key as Bearer.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, capabilitiesFor, orderCatalog } from './BaseProvider';
import type { CatalogEntry } from './BaseProvider';
import type { ChatRequest } from './types';
import { AIModel, ECapabilities } from './types';

/** The SDK `baseURL`: the host, without a `/v1/messages` or `/v1` the endpoint may carry. */
export function anthropicBaseUrl(endpoint: string): string {
    return endpoint.trim().replace(/\/+$/, '').replace(/\/v1(\/messages)?$/, '');
}

/**
 * Anthropic family: the first all-letter token after `claude-`.
 * `claude-opus-4-7` → opus, `claude-3-5-sonnet-20241022` → sonnet.
 */
export function claudeFamily(id: string): string {
    const tokens = id.split('-');
    if (tokens[0] !== 'claude') return 'other';
    return tokens.slice(1).find(t => /^[a-z]+$/.test(t)) ?? 'other';
}

type ContentBlock =
    | { type: 'text'; text: string }
    | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
    | { type: 'document'; source: { type: 'base64'; media_type: string; data: string } };

export class AnthropicCompatibleProvider extends BaseProvider {
    sdkBaseUrl(): string {
        return anthropicBaseUrl(this.baseUrl);
    }

    protected async client(): Promise<Anthropic> {
        const { default: AnthropicClient } = await import('@anthropic-ai/sdk');
        return new AnthropicClient({
            apiKey: this.apiKey,
            authToken: null,
            baseURL: this.sdkBaseUrl(),
            dangerouslyAllowBrowser: true,
            maxRetries: 0,
            fetch: this.options.fetch,
        });
    }

    /**
     * Documents first, then images, then the text, as the live code builds a Claude turn. An earlier
     * turn keeps its own attachments the model declares (R-AI-17); the current turn adds the request's.
     */
    protected messages(req: ChatRequest, modelId: string): Anthropic.MessageParam[] {
        const model = this.model(modelId);
        const last = req.history.length - 1;
        return req.history.map((msg, i) => {
            const current = i === last && msg.role === 'user';
            const documents = [...(model?.has(ECapabilities.DOCUMENTS) ? msg.documents ?? [] : []), ...(current ? req.documents ?? [] : [])];
            const images = [...(model?.has(ECapabilities.IMAGES) ? msg.images ?? [] : []), ...(current ? req.images ?? [] : [])];
            if (!documents.length && !images.length) return { role: msg.role, content: msg.content };
            const content: ContentBlock[] = [];
            for (const doc of documents) {
                content.push({ type: 'document', source: { type: 'base64', media_type: doc.mimeType, data: doc.data } });
            }
            for (const img of images) {
                content.push({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.data } });
            }
            if (msg.content) content.push({ type: 'text', text: msg.content });
            return { role: msg.role, content } as Anthropic.MessageParam;
        });
    }

    protected async send(modelId: string, req: ChatRequest): Promise<string> {
        const client = await this.client();
        const message = await client.messages.create({
            model: modelId,
            max_tokens: this.maxOutputTokens(req),
            ...(req.system ? { system: req.system } : {}),
            messages: this.messages(req, modelId),
        }, { signal: req.signal });
        return message.content.map(block => (block.type === 'text' ? block.text : '')).join('');
    }

    protected async *stream(modelId: string, req: ChatRequest): AsyncIterable<string> {
        const client = await this.client();
        const events = await client.messages.create({
            model: modelId,
            max_tokens: this.maxOutputTokens(req),
            ...(req.system ? { system: req.system } : {}),
            messages: this.messages(req, modelId),
            stream: true,
        }, { signal: req.signal });
        for await (const event of events) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
        }
        // The SDK ends an aborted stream quietly; it ends with the abort error, as the Google family's does.
        req.signal?.throwIfAborted();
    }

    /** One `messages.create` with `max_tokens` 1 on the configured model, never `models.list` (R-AI-7). */
    protected async probe(modelId: string): Promise<void> {
        const client = await this.client();
        await client.messages.create({
            model: modelId,
            max_tokens: 1,
            messages: [{ role: 'user', content: 'Hi' }],
        });
    }

    protected async listModels(): Promise<AIModel[]> {
        const client = await this.client();
        const entries: CatalogEntry[] = [];
        for await (const m of client.models.list({ limit: 1000 })) {
            if (typeof m?.id !== 'string' || !m.id.startsWith('claude-')) continue;
            const { capabilities, contextWindow } = capabilitiesFor(m.id);
            entries.push({
                model: new AIModel(m.id, m.display_name || m.id, capabilities, contextWindow),
                family: claudeFamily(m.id),
                rank: Date.parse(String(m.created_at)) || 0,
            });
        }
        return orderCatalog(entries);
    }
}

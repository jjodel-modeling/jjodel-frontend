/**
 * The Anthropic family (`@anthropic-ai/sdk`): Claude. The SDK is loaded by
 * `await import('@anthropic-ai/sdk')` inside `client()` (R-AI-2). With `dangerouslyAllowBrowser`
 * it sends `anthropic-dangerous-direct-browser-access: true` itself, and the key as Bearer.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { BaseProvider, capabilitiesFor, orderCatalog } from './BaseProvider';
import type { CatalogEntry } from './BaseProvider';
import type { ChatRequest } from './types';
import { AIModel } from './types';

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

    /** Documents first, then images, then the text, as the live code builds a Claude turn. */
    protected messages(req: ChatRequest): Anthropic.MessageParam[] {
        const last = req.history.length - 1;
        return req.history.map((msg, i) => {
            const attachments = i === last && msg.role === 'user' && (req.images?.length || req.documents?.length);
            if (!attachments) return { role: msg.role, content: msg.content };
            const content: ContentBlock[] = [];
            for (const doc of req.documents ?? []) {
                content.push({ type: 'document', source: { type: 'base64', media_type: doc.mimeType, data: doc.data } });
            }
            for (const img of req.images ?? []) {
                content.push({ type: 'image', source: { type: 'base64', media_type: img.mimeType, data: img.data } });
            }
            if (msg.content) content.push({ type: 'text', text: msg.content });
            return { role: 'user', content } as Anthropic.MessageParam;
        });
    }

    protected async send(modelId: string, req: ChatRequest): Promise<string> {
        const client = await this.client();
        const message = await client.messages.create({
            model: modelId,
            max_tokens: this.maxOutputTokens(req),
            ...(req.system ? { system: req.system } : {}),
            messages: this.messages(req),
        });
        return message.content.map(block => (block.type === 'text' ? block.text : '')).join('');
    }

    protected async *stream(modelId: string, req: ChatRequest): AsyncIterable<string> {
        const client = await this.client();
        const events = await client.messages.create({
            model: modelId,
            max_tokens: this.maxOutputTokens(req),
            ...(req.system ? { system: req.system } : {}),
            messages: this.messages(req),
            stream: true,
        });
        for await (const event of events) {
            if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') yield event.delta.text;
        }
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

/**
 * The Google family (`@google/genai`): Gemini. The SDK is loaded by `await import('@google/genai')`
 * inside `client()` (R-AI-2); it sends the key as `x-goog-api-key` (its default) and takes a PDF
 * as an `inlineData` part.
 */
import type { Content, GoogleGenAI, Part } from '@google/genai';
import { BaseProvider, capabilitiesFor, orderCatalog } from './BaseProvider';
import type { CatalogEntry } from './BaseProvider';
import type { ChatRequest } from './types';
import { AIModel } from './types';

/** The SDK `baseUrl`: the host, without the `/v1beta/models` or `/v1beta` the endpoint may carry. */
export function googleBaseUrl(endpoint: string): string {
    return endpoint.trim().replace(/\/+$/, '').replace(/\/v1beta(\/models)?$/, '');
}

/**
 * Gemini family and rank from the id, since the API gives no date:
 * `gemini-<ver>-<tier>[-preview…|-exp…|-NNN|-latest]` → family = tier ('pro', 'flash', 'flash-lite').
 * Rank = version, then stable (3) over preview/exp (2) over a -NNN pin (1) over an alias (0).
 */
export function geminiFamilyRank(id: string): { family: string; rank: number } {
    const m = /^gemini-(\d+(?:\.\d+)?)-(.+)$/.exec(id);
    const ver = m ? parseFloat(m[1]) : 0;
    let rest = m ? m[2] : id.replace(/^gemini-/, '');
    let stability = 3;
    if (/-latest$/.test(rest)) { rest = rest.replace(/-latest$/, ''); stability = 0; }
    else if (/-(preview|exp)(-.*)?$/.test(rest)) { rest = rest.replace(/-(preview|exp)(-.*)?$/, ''); stability = 2; }
    else if (/-\d{3}$/.test(rest)) { rest = rest.replace(/-\d{3}$/, ''); stability = 1; }
    return { family: rest || 'other', rank: ver * 100 + stability };
}

const GEMINI_DENY = /embedding|aqa|imagen|veo|tts|image|live|audio|robotics|computer-use/;

export class GoogleCompatibleProvider extends BaseProvider {
    sdkBaseUrl(): string {
        return googleBaseUrl(this.baseUrl);
    }

    protected async client(): Promise<GoogleGenAI> {
        const { GoogleGenAI: GoogleClient } = await import('@google/genai');
        return new GoogleClient({
            apiKey: this.apiKey,
            httpOptions: { baseUrl: this.sdkBaseUrl(), ...(this.options.fetch ? { fetch: this.options.fetch } : {}) },
        });
    }

    /** History as `user`/`model` turns; the attachments of the current turn before its text. */
    protected contents(req: ChatRequest): Content[] {
        const last = req.history.length - 1;
        return req.history.map((msg, i) => {
            const parts: Part[] = [];
            if (i === last && msg.role === 'user') {
                for (const doc of req.documents ?? []) parts.push({ inlineData: { mimeType: doc.mimeType, data: doc.data } });
                for (const img of req.images ?? []) parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
            }
            if (msg.content || !parts.length) parts.push({ text: msg.content });
            return { role: msg.role === 'user' ? 'user' : 'model', parts };
        });
    }

    protected async send(modelId: string, req: ChatRequest): Promise<string> {
        const client = await this.client();
        const response = await client.models.generateContent({
            model: modelId,
            contents: this.contents(req),
            config: {
                ...(req.system ? { systemInstruction: req.system } : {}),
                maxOutputTokens: this.maxOutputTokens(req),
            },
        });
        return response.text ?? '';
    }

    protected async *stream(modelId: string, req: ChatRequest): AsyncIterable<string> {
        const client = await this.client();
        const chunks = await client.models.generateContentStream({
            model: modelId,
            contents: this.contents(req),
            config: {
                ...(req.system ? { systemInstruction: req.system } : {}),
                maxOutputTokens: this.maxOutputTokens(req),
            },
        });
        for await (const chunk of chunks) {
            const text = chunk.text;
            if (text) yield text;
        }
    }

    protected async probe(modelId: string): Promise<void> {
        const client = await this.client();
        await client.models.generateContent({
            model: modelId,
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }],
            config: { maxOutputTokens: 1 },
        });
    }

    protected async listModels(): Promise<AIModel[]> {
        const client = await this.client();
        const entries: CatalogEntry[] = [];
        const pager = await client.models.list({ config: { pageSize: 1000 } });
        for await (const m of pager) {
            if (typeof m?.name !== 'string' || !m.supportedActions?.includes('generateContent')) continue;
            const id = m.name.replace(/^models\//, '');
            if (!id.startsWith('gemini-') || GEMINI_DENY.test(id)) continue;
            const { capabilities } = capabilitiesFor(id);
            entries.push({
                model: new AIModel(id, m.displayName || id, capabilities, typeof m.inputTokenLimit === 'number' ? m.inputTokenLimit : undefined),
                ...geminiFamilyRank(id),
            });
        }
        return orderCatalog(entries);
    }
}

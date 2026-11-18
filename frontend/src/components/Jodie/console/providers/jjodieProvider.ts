/**
 * Jjodie (LLM) console provider.
 *
 * Wraps the LLM call (the provider's chat, src/services/ai) with the same RAG augmentation
 * and per-feature model selection the Jodie chat handler used inline. Provider
 * selection / auto-switch and the surrounding state updates (user message,
 * isWaiting, hasUnread) stay in the handler; this provider only computes the
 * assistant reply from an already-resolved provider.
 *
 * The chat() error is intentionally not caught here: it propagates to the
 * handler's try/catch, which builds the user-facing error message and preserves
 * the hasUnread semantics (only the success path sets hasUnread). The inner RAG
 * try/catch mirrors the handler and never propagates.
 */
import type { LanguageProvider, ConsoleContext, ConsoleResult } from '../types';
import type { ChatDocument, ChatImage, ChatMessage } from '../../types';
import { JjodieRagService } from '../../../../services/JjodieRagService';
import { PromptService } from '../../../../services/PromptService';
import { registry } from '../../../../services/ai';
import type { Attachment, HistoryMessage } from '../../../../services/ai';
import { isProviderId, preferredModelId } from '../../../common/ProviderModelSelector';

/** A chat attachment as the AI module takes it (base64 data, MIME type, name). */
function toAttachments(files: (ChatImage | ChatDocument)[] | undefined): Attachment[] | undefined {
    return files?.length ? files.map(f => ({ mimeType: f.mimeType, data: f.data, name: f.name })) : undefined;
}

export const jjodieProvider: LanguageProvider = {
    id: 'jjodie',
    displayName: 'Jjodie',
    async run(input: string, ctx: ConsoleContext): Promise<ConsoleResult> {
        const providerToUse = ctx.activeProvider;
        if (!providerToUse) {
            // Guaranteed by the handler, which resolves the provider (incl.
            // auto-switch) before invoking this provider. Guard keeps the type
            // honest; it never fires in the wired path.
            throw new Error('jjodieProvider.run requires ctx.activeProvider');
        }
        const history = ctx.history ?? [];

        // Get RAG-augmented context based on query
        let augmentedContext = ctx.projectContext;
        if (ctx.ragInitialized) {
            try {
                const ragContext = await JjodieRagService.getAugmentedContext(input);
                if (ragContext) {
                    // Combine structural context with RAG-retrieved context
                    augmentedContext = ctx.projectContext
                        ? `${ctx.projectContext}\n\n---\n\n**Relevant Information:**\n${ragContext}`
                        : `**Relevant Information:**\n${ragContext}`;
                }
            } catch (ragError) {
                console.warn('[Jodie] RAG context retrieval failed:', ragError);
            }
        }

        if (!isProviderId(providerToUse)) throw new Error(`Unsupported provider: ${providerToUse}`);

        // Call AI provider with augmented context, images and documents: the system prompt is the
        // chat prompt with the project context, the history keeps each turn's attachments (R-AI-17),
        // and the current turn goes last. Per-feature model (falls back to the provider's model).
        const system = PromptService.getRendered('chat', augmentedContext ? { customVariables: { projectContext: augmentedContext } } : undefined);
        const turns: HistoryMessage[] = history.map(msg => ({
            role: msg.role,
            content: msg.content,
            images: toAttachments(msg.images),
            documents: toAttachments(msg.documents),
        }));
        const response = await registry.get(providerToUse).chat({
            system,
            history: [...turns, { role: 'user', content: input }],
            model: preferredModelId('chat'),
            images: toAttachments(ctx.images),
            documents: toAttachments(ctx.documents),
        });

        const assistantMessage: ChatMessage = {
            id: ctx.makeId(),
            kind: 'chat',
            role: 'assistant',
            content: response,
            timestamp: Date.now(),
            provider: providerToUse,
        };

        return { entries: [assistantMessage] };
    },
};

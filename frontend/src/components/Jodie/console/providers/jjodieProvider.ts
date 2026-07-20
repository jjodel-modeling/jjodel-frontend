/**
 * Jjodie (LLM) console provider.
 *
 * Wraps the LLM call (AIProviderService.chat) with the same RAG augmentation
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
import type { ChatMessage } from '../../../../types/jodie';
import { AIConfig } from '../../../../types/jodie';
import { AIProviderService } from '../../../../services/AIProviderService';
import { JjodieRagService } from '../../../../services/JjodieRagService';

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

        // Call AI provider with augmented context, images and documents.
        // Pass per-feature model (falls back to provider's AIConfig.model inside chat()).
        const chatModel = AIConfig.getPreferredModel('chat');
        const response = await AIProviderService.chat(
            input, providerToUse, history, augmentedContext, ctx.images, ctx.documents, chatModel,
        );

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

/**
 * JjScript console provider.
 *
 * Wraps the existing JjScript entry points (JjScriptService.execute +
 * formatResultForChat) and produces the same assistant ChatMessage — carrying
 * jjscriptResult:{success,command} — that the Jodie chat handler built inline.
 *
 * Errors are intentionally not caught here: they propagate to the handler's
 * existing try/catch, which builds the "JjScript Error" message exactly as
 * before. This keeps the success/error state sequence unchanged.
 */
import type { LanguageProvider, ConsoleContext, ConsoleResult } from '../types';
import type { ChatMessage } from '../../../../types/jodie';
import { JjScriptService } from '../../../../jjscript';

export const jjscriptProvider: LanguageProvider = {
    id: 'jjscript',
    displayName: 'JjScript',
    async run(input: string, ctx: ConsoleContext): Promise<ConsoleResult> {
        // Execute JjScript command
        const result = await JjScriptService.execute(input);

        // Format result as chat message
        const responseContent = JjScriptService.formatResultForChat(result);

        const assistantMessage: ChatMessage = {
            id: ctx.makeId(),
            kind: 'chat',
            role: 'assistant',
            content: responseContent,
            timestamp: Date.now(),
            jjscriptResult: {
                success: result.success,
                command: result.command,
            },
        };

        return { entries: [assistantMessage] };
    },
};

/**
 * JjScript console provider.
 *
 * Wraps the existing JjScript entry points (JjScriptService.execute +
 * formatResultForChat) and produces the same assistant ChatMessage — carrying
 * jjscriptResult:{success,command} — that the Jodie chat handler built inline.
 *
 * An input with one command goes to the executor as typed. Errors are
 * intentionally not caught on that path: they propagate to the handler's
 * existing try/catch, which builds the "JjScript Error" message exactly as
 * before. This keeps the success/error state sequence unchanged.
 *
 * An input with several commands runs them one by one, as Run and
 * executeScript read a script: one command per line, do...end blocks grouped,
 * blank lines and comments skipped. The parser reads a single command, so the
 * whole input in one execute ran the first line and dropped the rest in
 * silence. Each command gets its own result entry; the run stops at the first
 * failure and says which lines were not run. A thrown command becomes the same
 * "JjScript Error" message the handler builds, so the earlier results stay.
 */
import type { LanguageProvider, ConsoleContext, ConsoleResult } from '../types';
import type { ChatMessage } from '../../types';
import { JjScriptService, parse } from '../../../../jjscript';
import { groupBlockCommands } from '../../../../jjscript/executor/executor';

/**
 * The commands of a console input, one per line (R-JJD-4): do...end blocks
 * grouped into one command, blank lines and `//` / `#` comment lines dropped.
 */
export function consoleCommands(input: string): string[] {
    return groupBlockCommands(input.split('\n'))
        .map(c => c.trim())
        .filter(c => c && !c.startsWith('//') && !c.startsWith('#'));
}

async function resultEntry(input: string, ctx: ConsoleContext): Promise<{ entry: ChatMessage; success: boolean }> {
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
            input,
        },
    };

    return { entry: assistantMessage, success: result.success };
}

function failureEntry(content: string, command: string, input: string, ctx: ConsoleContext): ChatMessage {
    return {
        id: ctx.makeId(),
        kind: 'chat',
        role: 'assistant',
        content,
        timestamp: Date.now(),
        jjscriptResult: { success: false, command, input },
    };
}

export const jjscriptProvider: LanguageProvider = {
    id: 'jjscript',
    displayName: 'JjScript',
    async run(input: string, ctx: ConsoleContext): Promise<ConsoleResult> {
        const commands = consoleCommands(input);
        if (commands.length <= 1) {
            const { entry } = await resultEntry(input, ctx);
            return { entries: [entry] };
        }

        const entries: ChatMessage[] = [];
        for (let i = 0; i < commands.length; i++) {
            let success: boolean;
            try {
                const r = await resultEntry(commands[i], ctx);
                entries.push(r.entry);
                success = r.success;
            } catch (error) {
                entries.push(failureEntry(`**JjScript Error:** ${(error as Error).message}`, 'unknown', commands[i], ctx));
                success = false;
            }
            if (!success) {
                const rest = commands.slice(i + 1);
                if (rest.length > 0) {
                    const notRun = `Stopped at the first error: ${rest.length} ${rest.length === 1 ? 'command was' : 'commands were'} not run.\n\n\`\`\`\n${rest.join('\n')}\n\`\`\``;
                    entries.push(failureEntry(notRun, 'not-run', rest.join('\n'), ctx));
                }
                break;
            }
        }
        return { entries };
    },
    detect(input: string): boolean {
        // Strict parse: true only when the whole input is a complete JjScript
        // command (trailing natural-language tokens → false, so the offer never
        // steals a plain sentence from the LLM). Empty/whitespace → false.
        if (!input.trim()) return false;
        return parse(input, { strict: true }).success;
    },
};

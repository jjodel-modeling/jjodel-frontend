/**
 * JjEL console provider (Code mode).
 *
 * Wraps evaluateJjelInJodie and produces the same CodeEntry the Code-mode
 * handler built inline. The JS flavor remains unavailable (reserved for a later
 * phase), matching the current placeholder outcome. The JjEL evaluation is
 * synchronous; `run` is async only to satisfy the LanguageProvider interface.
 */
import type { LanguageProvider, ConsoleContext, ConsoleResult } from '../types';
import type { CodeEntry } from '../../../../types/jodie';
import { evaluateJjelInJodie } from '../../jodieJjelContext';

export const jjelProvider: LanguageProvider = {
    id: 'jjel',
    displayName: 'JjEL',
    async run(input: string, ctx: ConsoleContext): Promise<ConsoleResult> {
        const flavor = ctx.codeFlavor ?? 'jjel';
        const outcome = flavor === 'jjel'
            ? evaluateJjelInJodie(input)
            : { ok: false as const, text: 'JS flavor is not yet available.', warnings: [] };
        const entry: CodeEntry = {
            id: ctx.makeId(),
            kind: 'code',
            flavor,
            input,
            output: outcome.ok
                ? { ok: true, value: outcome.text }
                : { ok: false, error: outcome.text },
            timestamp: Date.now(),
            warnings: outcome.warnings.length > 0 ? outcome.warnings : undefined,
            rawValue: outcome.ok ? outcome.value : undefined,
        };
        return { entries: [entry] };
    },
};

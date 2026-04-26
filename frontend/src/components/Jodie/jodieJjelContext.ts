/**
 * Jjodie code-mode JjEL context builder.
 *
 * Reuses the same buildEvalContext used by JjScript's `eval` command, by
 * synthesizing a minimal ExecutionContext from the current user's project.
 * This keeps the variable shape (`classes`, `instances`, `data`, `node`,
 * <ClassName> bindings, etc.) identical to what users see in the standalone
 * JjEL console and JjScript eval.
 */

import { buildEvalContext } from '../../jjscript';
import type { ExecutionContext } from '../../jjscript/types';
import { jjelEval } from '../../jjel';
import type { JjelValue } from '../../jjel';
import { DUser, L, LUser, LProject } from '../../joiner';

function getCurrentProjectId(): string | null {
    try {
        const user: LUser = L.fromPointer(DUser.current);
        const project = user?.project as LProject | undefined;
        return project?.id ?? null;
    } catch {
        return null;
    }
}

function makeMinimalContext(): ExecutionContext {
    return {
        projectId: getCurrentProjectId() ?? '',
        history: [],
        variables: new Map(),
    };
}

/** Build the JjEL variable bindings as the JjScript eval command would. */
export function buildJodieJjelVariables(): Record<string, JjelValue> {
    const ctx = makeMinimalContext();
    return buildEvalContext(ctx);
}

export interface JjelEvalOutcome {
    ok: boolean;
    /** Stringified result (success) or error message (failure). */
    text: string;
    /** Raw JjEL value when ok; useful for future structured rendering. */
    value?: JjelValue;
}

/** Format a JjEL value for REPL display. */
function formatJjelValue(value: JjelValue): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) {
        if (value.length === 0) return '[]';
        return '[' + value.map(formatJjelValue).join(', ') + ']';
    }
    if (typeof value === 'object') {
        const name = (value as any).name;
        if (typeof name === 'string' && name.length > 0) return name;
        try { return JSON.stringify(value); }
        catch { return '[object]'; }
    }
    return String(value);
}

/** Evaluate a JjEL expression in the current Jjodie code-mode context. */
export function evaluateJjelInJodie(expression: string): JjelEvalOutcome {
    try {
        const variables = buildJodieJjelVariables();
        const value = jjelEval(expression, variables);
        return { ok: true, text: formatJjelValue(value), value };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return { ok: false, text: msg.replace(/^JjEL (parse |evaluation )?error: /, '') };
    }
}

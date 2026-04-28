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
import { jjelEvalWithDiagnostics } from '../../jjel';
import type { JjelValue, JjelWarning } from '../../jjel';
import { DUser, L, LUser, LProject } from '../../joiner';
import { formatJjelValue } from './jjelValueFormatter';

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
    const variables = buildEvalContext(ctx);
    // Spec section 2.13.2 (rev 2026-04-27): `self` is an alias of `data`
    // in Code mode when an element is selected. Symmetric behavior: if
    // `data` is not bound (no selection), `self` is also not bound.
    if ('data' in variables) {
        variables.self = variables.data;
    }
    return variables;
}

export interface JjelEvalOutcome {
    ok: boolean;
    /** Stringified result (success) or error message (failure). */
    text: string;
    /** Raw JjEL value when ok; useful for future structured rendering. */
    value?: JjelValue;
    /**
     * Diagnostic warnings collected during evaluation (e.g. undefined
     * identifiers). Empty array when none. Always present on the success
     * branch; never populated on the parse/throw failure branch.
     */
    warnings: JjelWarning[];
}

/** Evaluate a JjEL expression in the current Jjodie code-mode context. */
export function evaluateJjelInJodie(expression: string): JjelEvalOutcome {
    try {
        const variables = buildJodieJjelVariables();
        const { value, warnings } = jjelEvalWithDiagnostics(expression, variables);
        return { ok: true, text: formatJjelValue(value), value, warnings };
    } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        return {
            ok: false,
            text: msg.replace(/^JjEL (parse |evaluation )?error: /, ''),
            warnings: [],
        };
    }
}

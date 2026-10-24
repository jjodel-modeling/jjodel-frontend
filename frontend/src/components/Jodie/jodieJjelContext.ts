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
import { EvaluationContext, JjelEvaluator, JjelTimeoutError } from '../../jjel';
import { parseExpression } from '../../jjel/parser';
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
    /** True when the evaluation hit its deadline (R-JJD-9): muted, not an error. */
    timedOut?: boolean;
}

/** One element the live JjEL result is evaluated on (P-2026-10-24-0241). */
export interface JjelLiveTarget {
    elementId: string;
    nodeId?: string;
}

/** What the result block shows of a target: `self <level> <kind> <path>`. */
export interface JjelLiveTargetInfo {
    level: 'M1' | 'M2';
    kind: string;
    path: string;
}

export type JjelLiveStatus = 'ok' | 'not-applicable' | 'timed-out' | 'error';

export interface JjelLiveRow {
    /** `null`: evaluated with no element bound to `self`. */
    target: JjelLiveTarget | null;
    info: JjelLiveTargetInfo | null;
    status: JjelLiveStatus;
    /** The formatted value, or the muted / error text of the other statuses. */
    text: string;
    /** Type of the value; empty unless `status` is `ok`. */
    type: string;
}

/** Deadline of one live evaluation round, over all its targets (S3a `deadline`). */
export const JJEL_LIVE_DEADLINE_MS = 500;

/** Deadline of one conversation evaluation, the JjEL mode submit (R-JJD-9). */
export const JJEL_CONVERSATION_DEADLINE_MS = 2000;

/** Muted reply of a conversation evaluation that hit its deadline. */
export function jjelTimedOutText(budgetMs: number): string {
    return `timed out after ${budgetMs / 1000} s`;
}

function stripJjelErrorPrefix(msg: string): string {
    return msg.replace(/^JjEL (parse |evaluation )?error: /, '');
}

/** Kind and path of a model element, read from its L-proxy. */
export function describeJjelTarget(elementId: string): JjelLiveTargetInfo {
    let l: any = null;
    try { l = L.fromPointer(elementId as any); } catch { /* unresolved */ }
    const className: string = typeof l?.className === 'string' ? l.className : '';
    const read = (f: () => unknown): string => {
        try { const v = f(); return typeof v === 'string' && v ? v : ''; } catch { return ''; }
    };
    if (className === 'DObject' || className === 'DValue') {
        const kind = read(() => l.instanceof?.name) || className.replace(/^D/, '');
        const name = read(() => l.name) || elementId;
        const model = read(() => l.model?.name);
        return { level: 'M1', kind, path: model ? `${model}.${name}` : name };
    }
    const kind = className ? className.replace(/^D/, '') : 'Element';
    const path = read(() => l.fullname) || read(() => l.name) || elementId;
    return { level: 'M2', kind, path };
}

/** Type label of a JjEL value, for the 12 px line next to the value. */
export function jjelTypeName(value: unknown): string {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'string') return 'String';
    if (typeof value === 'number') return Number.isInteger(value) ? 'Integer' : 'Real';
    if (typeof value === 'boolean') return 'Boolean';
    if (Array.isArray(value)) return `Collection(${value.length})`;
    if (typeof value === 'object') {
        const v = value as { __jjelFunction?: unknown; instanceOf?: { name?: unknown } | null; __type?: unknown };
        if (v.__jjelFunction === true) return 'Function';
        const cls = v.instanceOf?.name;
        if (typeof cls === 'string' && cls) return cls;
        if (typeof v.__type === 'string' && v.__type) return v.__type;
        return 'Object';
    }
    return typeof value;
}

/**
 * Evaluate `expression` once per target, `self` bound to each in turn, the whole round
 * bounded by one deadline. No target: one row with `self` unbound. A parse error is one
 * error row. A null value that came with a `property-not-found` warning is
 * `not-applicable`, not an error: the element's metaclass has no such feature.
 */
export function evaluateJjelLive(
    expression: string,
    targets: readonly JjelLiveTarget[],
    budgetMs: number = JJEL_LIVE_DEADLINE_MS,
): JjelLiveRow[] {
    const parsed = parseExpression(expression);
    const list: (JjelLiveTarget | null)[] = targets.length ? [...targets] : [null];
    if (parsed.errors.length > 0 || !parsed.expression) {
        const msg = parsed.errors[0]?.message ?? 'No expression produced';
        return list.map((t) => ({
            target: t, info: t ? describeJjelTarget(t.elementId) : null, status: 'error', text: msg, type: '',
        }));
    }
    const expr = parsed.expression;
    const deadline = Date.now() + budgetMs;
    return list.map((t): JjelLiveRow => {
        const info = t ? describeJjelTarget(t.elementId) : null;
        if (Date.now() > deadline) return { target: t, info, status: 'timed-out', text: 'timed out', type: '' };
        try {
            const variables = buildEvalContext(makeMinimalContext(), { self: t });
            if ('data' in variables) variables.self = variables.data;
            const ctx = new EvaluationContext(variables);
            ctx.deadline = deadline;
            const { value, warnings } = new JjelEvaluator(ctx).evaluateWithDiagnostics(expr, ctx);
            if ((value === null || value === undefined) && warnings.some((w) => w.kind === 'property-not-found')) {
                return { target: t, info, status: 'not-applicable', text: `not applicable to ${info?.kind ?? 'the selection'}`, type: '' };
            }
            return { target: t, info, status: 'ok', text: formatJjelValue(value), type: jjelTypeName(value) };
        } catch (e) {
            if (e instanceof JjelTimeoutError) return { target: t, info, status: 'timed-out', text: 'timed out', type: '' };
            const msg = e instanceof Error ? e.message : String(e);
            return { target: t, info, status: 'error', text: stripJjelErrorPrefix(msg), type: '' };
        }
    });
}

/**
 * Evaluate a JjEL expression in the current Jjodie code-mode context, bounded by the
 * S3a deadline (R-JJD-9): past `budgetMs` the outcome is `timedOut`, not an error.
 */
export function evaluateJjelInJodie(
    expression: string,
    budgetMs: number = JJEL_CONVERSATION_DEADLINE_MS,
): JjelEvalOutcome {
    try {
        const parsed = parseExpression(expression);
        if (parsed.errors.length > 0) throw new Error(`JjEL parse error: ${parsed.errors[0].message}`);
        if (!parsed.expression) throw new Error('JjEL parse error: No expression produced');
        const ctx = new EvaluationContext(buildJodieJjelVariables());
        ctx.deadline = Date.now() + budgetMs;
        const { value, warnings } = new JjelEvaluator(ctx).evaluateWithDiagnostics(parsed.expression, ctx);
        return { ok: true, text: formatJjelValue(value), value, warnings };
    } catch (e) {
        if (e instanceof JjelTimeoutError) {
            return { ok: false, text: jjelTimedOutText(budgetMs), warnings: [], timedOut: true };
        }
        const msg = e instanceof Error ? e.message : String(e);
        return {
            ok: false,
            text: msg.replace(/^JjEL (parse |evaluation )?error: /, ''),
            warnings: [],
        };
    }
}

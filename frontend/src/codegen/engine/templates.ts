/**
 * templates — template records registered as JjEL builtins (slice S2, R-GEN-4, R-GEN-12; spec §4, discovery §A.3,
 * §B.1, U1).
 *
 * A template is a stored record `{name, params, body}`: the body is a JjEL expression parsed by `parseTemplate`,
 * usually one interpolated string, and its value is a Text. Each record becomes a builtin of the one evaluation
 * context of a generation (the JjTL helper precedent, `jjtl/executor/executor.ts`), so templates call each other
 * and themselves with no definition syntax. A call evaluates the body in a child of that context with the
 * parameters bound, missing arguments `null`: a template sees the globals and its parameters, never its caller's
 * locals.
 *
 * Found before evaluation, each a template problem with its position: a duplicate name (the first definition is
 * used), a name that is not a JjEL identifier or that names a JjEL builtin, a parse error, and `with … do`
 * anywhere in the body (discovery §B.1: it binds an object's features as bare names, where reads cannot be told
 * apart). The refusal reuses the walker of the guard subset checker, `checkGuardSubset`, and keeps its `E-WITH`
 * diagnostics only. A template with a problem is not evaluated; a call to it is an error.
 *
 * Recursion is bounded: more than `MAX_TEMPLATE_DEPTH` nested calls throw, and the hole that made the call turns
 * the throw into one error fragment (origin.ts) instead of a stack overflow. 64 is far above the containment depth
 * of a model a template walks, and about a tenth of the depth at which the stack runs out: without the bound, a
 * template that calls itself once per level overflowed above 625 levels under vitest's node (measured in S2).
 *
 * Pure: JjEL, the guard subset checker and the engine.
 */

import { JjelTokenType, createFunction, parseTemplate, tokenize } from '../../jjel';
import type { EvaluationContext, JjelEvaluator, JjelExpression, JjelValue } from '../../jjel';
import { checkGuardSubset } from '../../model/simulation/subsetChecker';
import type { OriginHost, TemplateSources } from './origin';
import type { TemplatePosition, Text } from './text';

/** A template as stored (templateCodec.ts) and as the panel edits it. `target` names the target language, when set. */
export interface TemplateRecord {
    readonly name: string;
    readonly params: readonly string[];
    readonly body: string;
    readonly target?: string;
}

/** Nested template calls at most: one more is an error. */
export const MAX_TEMPLATE_DEPTH = 64;

/** Why a template cannot be used, where in its source. */
export interface TemplateProblem extends TemplatePosition {
    readonly message: string;
}

export interface TemplateSet {
    readonly problems: readonly TemplateProblem[];
    /** A template of that name was registered (with or without problems). */
    has(name: string): boolean;
    /** It was registered and has no problem. */
    usable(name: string): boolean;
    /** Calls the template: its Text. Throws what its evaluation throws outside a hole. */
    call(name: string, args: readonly JjelValue[]): Text;
}

const isIdentifier = (name: string): boolean => {
    const { tokens, errors } = tokenize(name);
    return errors.length === 0 && tokens.length === 2 && tokens[0].type === JjelTokenType.IDENTIFIER && tokens[0].value === name;
};

function positionIn(body: string, template: string, line: number, column: number): TemplatePosition {
    let offset = 0;
    for (let l = 1; l < line; l++) {
        const nl = body.indexOf('\n', offset);
        if (nl < 0) break;
        offset = nl + 1;
    }
    return { template, offset: offset + column - 1, line, column };
}

/**
 * Registers `records` as builtins of `root`, the context of the generation, evaluated by `evaluator` with `host`
 * as its Text host; their sources go to `sources`, for the positions of holes and literal text.
 */
export function registerTemplates(
    records: readonly TemplateRecord[],
    root: EvaluationContext,
    evaluator: JjelEvaluator,
    host: OriginHost,
    sources: TemplateSources,
): TemplateSet {
    const problems: TemplateProblem[] = [];
    const compiled = new Map<string, { record: TemplateRecord; expr: JjelExpression | null }>();
    let depth = 0;

    for (const record of records) {
        const name = record.name;
        const start: TemplatePosition = { template: name, offset: 0, line: 1, column: 1 };
        if (compiled.has(name)) {
            problems.push({ ...start, message: `Template '${name}' is defined twice: the first definition is used` });
            continue;
        }
        if (!isIdentifier(name)) {
            problems.push({ ...start, message: `Template name '${name}' is not an identifier` });
            continue;
        }
        if (root.hasBuiltin(name)) {
            problems.push({ ...start, message: `Template name '${name}' is a JjEL builtin` });
            continue;
        }
        const parsed = parseTemplate(record.body);
        let expr: JjelExpression | null = parsed.expression;
        if (parsed.errors.length > 0 || !expr) {
            for (const e of parsed.errors) problems.push({ ...positionIn(record.body, name, e.line, e.column), message: e.message });
            if (parsed.errors.length === 0) problems.push({ ...start, message: `Template '${name}' has no body` });
            expr = null;
        } else {
            const refused = checkGuardSubset(expr).filter(d => d.code === 'E-WITH');
            for (const d of refused) {
                const at = d.location?.start;
                problems.push({
                    template: name, offset: at?.offset ?? 0, line: at?.line ?? 1, column: at?.column ?? 1,
                    message: '`with … do` is not allowed in a template: it binds the features of its object as bare names, so their reads have no origin; navigate with `x.f`',
                });
            }
            if (refused.length > 0) expr = null;
            else sources.register(name, record.body, expr);
        }
        compiled.set(name, { record, expr });
    }

    const call = (name: string, args: readonly JjelValue[]): Text => {
        const entry = compiled.get(name);
        if (!entry) throw new Error(`No template named '${name}'`);
        if (!entry.expr) throw new Error(`Template '${name}' has errors and cannot be called`);
        if (depth >= MAX_TEMPLATE_DEPTH) {
            throw new Error(`Template '${name}' called more than ${MAX_TEMPLATE_DEPTH} levels deep: the recursion has no end`);
        }
        depth++;
        try {
            const bindings: Record<string, JjelValue> = {};
            entry.record.params.forEach((p, i) => { bindings[p] = args[i] ?? null; });
            return host.toText(evaluator.evaluate(entry.expr, root.child(bindings)));
        } finally {
            depth--;
        }
    };

    for (const [name, { record }] of compiled) {
        root.registerBuiltin(name, createFunction([...record.params], args => call(name, args) as unknown as JjelValue));
    }

    return {
        problems,
        has: name => compiled.has(name),
        usable: name => !!compiled.get(name)?.expr,
        call,
    };
}

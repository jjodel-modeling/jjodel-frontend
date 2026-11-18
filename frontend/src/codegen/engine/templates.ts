/**
 * templates — template records registered as JjEL builtins (slice S2, R-GEN-4, R-GEN-12; spec §4, discovery §A.3,
 * §B.1, U1).
 *
 * A template is a stored record `{name, params, body, mode?}`: the body is a JjEL expression parsed by `parseTemplate`,
 * usually one interpolated string, or in text mode the inside of one, parsed by `parseTemplateText` (S5, R-GEN-25,
 * R-GEN-26); its value is a Text. Each record becomes a builtin of the one evaluation
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
 * Templates may share a name when they type their first parameter, `paramType` (P-2026-10-31-1410, dispatch.ts): the
 * one builtin of the name calls the typed template whose type is the most specific supertype (or the class itself) of
 * the first argument's metaclass, else the untyped one, else it throws naming the class; two equally specific matches
 * throw too, and are a problem before evaluation when the generation knows the class graph (`classes`). A template is
 * known by its key, `name` or `name:Type` (`templateKey`): duplicates are of keys, positions and origins carry the key,
 * and a template whose arity differs from the first of its name is a problem and is not registered. A record with no
 * `paramType` keeps today's path: an untyped name alone calls its one template.
 *
 * Recursion is bounded: more than `MAX_TEMPLATE_DEPTH` nested calls throw, and the hole that made the call turns
 * the throw into one error fragment (origin.ts) instead of a stack overflow. 64 is far above the containment depth
 * of a model a template walks, and about a tenth of the depth at which the stack runs out: without the bound, a
 * template that calls itself once per level overflowed above 625 levels under vitest's node (measured in S2).
 * Depth does not bound fan-out (two self-calls per level stay under 64 and make 2^64 calls): each call is also a
 * checkpoint of the generation's budget (text.ts, R-GEN-28), for the time before it runs and the output after.
 *
 * Pure: JjEL, the guard subset checker and the engine.
 */

import { JjelTokenType, createFunction, parseTemplate, parseTemplateText, tokenize } from '../../jjel';
import type { EvaluationContext, JjelEvaluator, JjelExpression, JjelParserResult, JjelValue } from '../../jjel';
import { checkGuardSubset } from '../../model/simulation/subsetChecker';
import { arityProblem, dispatchProblems, metaclassOf, mostSpecific, templateKey } from './dispatch';
import type { ClassGraph } from './dispatch';
import type { OriginHost, TemplateSources } from './origin';
import { GenerationBudget } from './text';
import type { TemplatePosition, Text } from './text';

/**
 * How a body is read (R-GEN-25): `text`, the inside of one interpolated string (`parseTemplateText`), or `expression`,
 * a JjEL expression (`parseTemplate`). A record with no mode is an expression, so every template saved before the
 * field keeps its parse and its output.
 */
export type TemplateMode = 'text' | 'expression';

/**
 * A template as stored (templateCodec.ts) and as the panel edits it. `target` names the target language, when set;
 * `paramType` the metaclass its first parameter dispatches on (dispatch.ts), absent for an untyped template.
 */
export interface TemplateRecord {
    readonly name: string;
    readonly params: readonly string[];
    readonly paramType?: string;
    readonly body: string;
    readonly mode?: TemplateMode;
    readonly target?: string;
}

/** The mode of a record: absent reads `expression`. */
export const modeOf = (record: { readonly mode?: TemplateMode }): TemplateMode => (record.mode === 'text' ? 'text' : 'expression');

/** The parse of a body in its mode: the one dispatch of the engine and of the editor's markers (R-GEN-26). */
export function parseTemplateBody(record: { readonly body: string; readonly mode?: TemplateMode }): JjelParserResult {
    return modeOf(record) === 'text' ? parseTemplateText(record.body) : parseTemplate(record.body);
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

interface Entry {
    readonly record: TemplateRecord;
    readonly expr: JjelExpression | null;
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
 * as its Text host; their sources go to `sources`, for the positions of holes and literal text. `budget` is the
 * generation's, the one `host` checks. `classes`, the metamodel's class graph when known, adds the type and ambiguity
 * problems of dispatched names (dispatch.ts).
 */
export function registerTemplates(
    records: readonly TemplateRecord[],
    root: EvaluationContext,
    evaluator: JjelEvaluator,
    host: OriginHost,
    sources: TemplateSources,
    budget: GenerationBudget = new GenerationBudget(),
    classes: ClassGraph | null = null,
): TemplateSet {
    const problems: TemplateProblem[] = [];
    const compiled = new Map<string, Entry[]>();
    let depth = 0;

    for (const record of records) {
        const name = record.name;
        const key = templateKey(record);
        const start: TemplatePosition = { template: key, offset: 0, line: 1, column: 1 };
        const group = compiled.get(name);
        if (group?.some(e => templateKey(e.record) === key)) {
            const which = record.paramType !== undefined ? ` for ${record.paramType}` : '';
            problems.push({ ...start, message: `Template '${name}' is defined twice${which}: the first definition is used` });
            continue;
        }
        const arity = arityProblem(record, group?.[0].record);
        if (arity) {
            problems.push({ ...start, message: arity });
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
        const parsed = parseTemplateBody(record);
        let expr: JjelExpression | null = parsed.expression;
        if (parsed.errors.length > 0 || !expr) {
            for (const e of parsed.errors) problems.push({ ...positionIn(record.body, key, e.line, e.column), message: e.message });
            if (parsed.errors.length === 0) problems.push({ ...start, message: `Template '${key}' has no body` });
            expr = null;
        } else {
            const refused = checkGuardSubset(expr).filter(d => d.code === 'E-WITH');
            for (const d of refused) {
                const at = d.location?.start;
                problems.push({
                    template: key, offset: at?.offset ?? 0, line: at?.line ?? 1, column: at?.column ?? 1,
                    message: '`with … do` is not allowed in a template: it binds the features of its object as bare names, so their reads have no origin; navigate with `x.f`',
                });
            }
            if (refused.length > 0) expr = null;
            else sources.register(key, record.body, expr, modeOf(record));
        }
        if (group) group.push({ record, expr });
        else compiled.set(name, [{ record, expr }]);
    }
    if (classes) {
        const registered = [...compiled.values()].flat().map(e => e.record);
        for (const p of dispatchProblems(registered, classes)) {
            if (p.severity === 'error' && p.kind !== 'arity') problems.push({ template: p.key, offset: 0, line: 1, column: 1, message: p.message });
        }
    }

    /** The template of `name` a call with first argument `first` runs: the only one of an untyped name, else dispatched. */
    const choose = (name: string, group: readonly Entry[], first: JjelValue | undefined): Entry => {
        const typed = group.filter(e => e.record.paramType !== undefined);
        const untyped = group.find(e => e.record.paramType === undefined);
        if (typed.length === 0 && untyped) return untyped;
        const meta = metaclassOf(first);
        if (!meta) {
            if (untyped) return untyped;
            throw new Error(`Template '${name}' dispatches on the class of its first argument, which is not a model object`);
        }
        const picks = mostSpecific(meta.graph, meta.name, typed.map(e => e.record.paramType as string));
        if (picks.length > 1) throw new Error(`Template '${name}' is ambiguous for class ${meta.name}: ${picks.map(t => `'${name}:${t}'`).join(' and ')} match equally`);
        if (picks.length === 1) return typed.find(e => e.record.paramType === picks[0]) as Entry;
        if (untyped) return untyped;
        throw new Error(`No template '${name}' applies to class ${meta.name}`);
    };

    const call = (name: string, args: readonly JjelValue[]): Text => {
        const group = compiled.get(name);
        if (!group) throw new Error(`No template named '${name}'`);
        const entry = choose(name, group, args[0]);
        const key = templateKey(entry.record);
        if (!entry.expr) throw new Error(`Template '${key}' has errors and cannot be called`);
        const at: TemplatePosition = { template: key, offset: 0, line: 1, column: 1 };
        budget.checkpoint(at);
        if (depth >= MAX_TEMPLATE_DEPTH) {
            throw new Error(`Template '${key}' called more than ${MAX_TEMPLATE_DEPTH} levels deep: the recursion has no end`);
        }
        depth++;
        budget.enter(at);
        try {
            const bindings: Record<string, JjelValue> = {};
            entry.record.params.forEach((p, i) => { bindings[p] = args[i] ?? null; });
            const expr = entry.expr;
            return budget.measure(host.evaluateBody(expr, () => evaluator.evaluate(expr, root.child(bindings))));
        } finally {
            budget.leave();
            depth--;
        }
    };

    for (const [name, group] of compiled) {
        root.registerBuiltin(name, createFunction([...group[0].record.params], args => call(name, args) as unknown as JjelValue));
    }

    return {
        problems,
        has: name => compiled.has(name),
        usable: name => !!compiled.get(name)?.some(e => e.expr),
        call,
    };
}

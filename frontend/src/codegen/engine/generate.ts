/**
 * generate — the one entry point of the template engine (slice S2; spec §4, §5, §7, R-GEN-4, R-GEN-5, R-GEN-7).
 *
 * `generate(globals, lookup, modelId, templates, entry, args?)` evaluates the template `entry` over a model and
 * returns its Text, the rendered code, the map from output ranges to origins, and the errors: the template problems
 * found before evaluation, then the error fragments of the output, in order.
 *
 * `globals` is the record `buildEvalContext` returns for the model (jjscript/executor/commands/eval.ts, with
 * `extentModelId: modelId`), built by the caller: it imports the joiner, so this module cannot call it, and the one
 * builder of JjEL contexts over a model stays the only one (guardContext.ts, the same arrangement; ratified for S2
 * under RC-21). The handles of its pool, `globals.instances`, are the ones `stc` returns, matched by `id`.
 *
 * The context: the globals, then `stc`, the read-only view of the model's STC roles (codegen/stcAccess.ts), `null`
 * when the metamodel binds none. Its element lists are the pool's handles; `trigger`, `source`, `target`, `guard`
 * and `actions` are JjEL functions of one element. The context's Text host and read observer are an `OriginHost`.
 *
 * Templates never write: JjEL has no assignment, and nothing here writes the lookup or the record.
 *
 * Pure: JjEL, the STC accessor and the engine.
 */

import { EvaluationContext, JjelEvaluator, createFunction } from '../../jjel';
import type { JjelValue } from '../../jjel';
import { stcAccess } from '../stcAccess';
import type { StcElement, StcView } from '../stcAccess';
import { OriginHost, TemplateSources } from './origin';
import { registerTemplates } from './templates';
import type { TemplateRecord } from './templates';
import { EMPTY_TEXT, fragment, makeText, renderText, textErrors } from './text';
import type { Text, TemplatePosition, TextMapEntry } from './text';

type Lookup = Record<string, any>;

export interface GenerateError extends TemplatePosition {
    readonly message: string;
}

export interface GenerateResult {
    readonly text: Text;
    readonly code: string;
    readonly map: readonly TextMapEntry[];
    readonly errors: readonly GenerateError[];
    readonly hasErrors: boolean;
}

/** The STC view as a JjEL value: its lists as they are, its accessors as functions of one element. */
function stcValue(view: StcView<JjelValue>): JjelValue {
    const fn = (read: (t: StcElement) => unknown): JjelValue =>
        createFunction(['element'], ([t]) => read(t as unknown as StcElement) as JjelValue) as unknown as JjelValue;
    return Object.freeze({
        __type: 'Stc',
        profile: view.profile as unknown as JjelValue,
        nodes: view.nodes as JjelValue[],
        transitions: view.transitions as JjelValue[],
        initial: view.initial as JjelValue[],
        events: view.events as JjelValue[],
        net: view.net as unknown as JjelValue,
        trigger: fn(t => view.trigger(t)),
        source: fn(t => view.source(t)),
        target: fn(t => view.target(t)),
        guard: fn(t => view.guard(t)),
        actions: fn(t => view.actions(t)),
    }) as unknown as JjelValue;
}

export function generate(
    globals: Record<string, JjelValue>,
    lookup: Lookup,
    modelId: string,
    templates: readonly TemplateRecord[],
    entry: string,
    args: readonly JjelValue[] = [],
): GenerateResult {
    const handles = new Map<string, JjelValue>();
    const pool = globals.instances;
    if (Array.isArray(pool)) {
        for (const h of pool) {
            const id = h && typeof h === 'object' ? (h as Record<string, unknown>).id : undefined;
            if (typeof id === 'string' && id !== '' && !handles.has(id)) handles.set(id, h);
        }
    }
    const view = stcAccess<JjelValue>(lookup, modelId, id => handles.get(id) ?? null);

    const ctx = new EvaluationContext({ ...globals, stc: view ? stcValue(view) : null });
    const sources = new TemplateSources();
    const host = new OriginHost(lookup, sources);
    ctx.textHost = host;
    ctx.readObserver = host.observe;
    const evaluator = new JjelEvaluator(ctx);
    const set = registerTemplates(templates, ctx, evaluator, host, sources);

    const errors: GenerateError[] = set.problems.map(p => ({ template: p.template, offset: p.offset, line: p.line, column: p.column, message: p.message }));
    let text = EMPTY_TEXT;
    if (!set.has(entry)) {
        errors.push({ template: entry, offset: 0, line: 1, column: 1, message: `No template named '${entry}'` });
    } else if (set.usable(entry)) {
        try {
            text = set.call(entry, args);
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            text = makeText([fragment('', { kind: 'error', template: entry, offset: 0, line: 1, column: 1, message })]);
        }
    }
    for (const e of textErrors(text)) errors.push({ template: e.template, offset: e.offset, line: e.line, column: e.column, message: e.message });

    const { code, map } = renderText(text);
    return { text, code, map, errors, hasErrors: errors.length > 0 };
}

/**
 * actionEvaluator — the actions of a step, compiled once and evaluated on σ
 * (wave B2 of the state operator, R-SIM-17, R-SIM-18, R-SIM-43).
 *
 * `compileAction` runs once per `Action` text per run: blank is no action; a
 * text `parseAction` rejects is a compile defect, reported when its site is
 * evaluated, so the core halts the step with `action-defect`. No subset check:
 * the static check of actions arrives with the typed checker of lane C.
 *
 * `makeActionOracle` is the core's `ActionOracle`. For one site it evaluates
 * every action of the site, in order, on the σ the core hands it — the state
 * before the step, never one an earlier action has written — and returns the
 * assignments. The core applies them together and halts on a double
 * assignment, an undeclared target or a value outside its domain (`netStep.ts`).
 * What the core does not check is checked here: the value is a boolean, a
 * number or a string; the target is a model element; and locality (R-SIM-18):
 * `node.[a]` assigns only a presentation attribute, any other target only a
 * semantic one. An undeclared target is left to the core.
 *
 * The context is the guard's (`buildGuardContext`) with `self` the site
 * element: the place for entry and exit, the edge or the transition for
 * `transition`. `node.[a]` reads the presentation of that element only,
 * through the accessor the core built for the site.
 *
 * Not wired: the bridge keeps `NO_SIM_ACTIONS` until lane C brings the action
 * roles and the declarations (R-SIM-39, R-SIM-52).
 *
 * Pure: JjEL, the shared diagnostics of `jjelTriState.ts` and the guard context.
 */

import { parseAction } from '../../jjel/parser';
import { JjelEvaluator, isJjelObject } from '../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelAction, JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { describeType, firstAbsence } from '../jjelTriState';
import { buildGuardContext, toJjelStateAccess } from './guardContext';
import type { SimSnapshot } from './guardContext';
import type { ActionOracle, ActionOutcome, ActionSite, CompiledNet, SimAssignment, SimValue } from './netTypes';

export interface CompiledAction {
    readonly source: string;
    /** `null` when the text does not parse. */
    readonly action: JjelAction | null;
    /** The parse error, `line:column message`; `null` when the action parsed. */
    readonly defect: string | null;
}

/** Path B, as for guards (`guardEvaluator.ts`): no context at construction, so no builtins. */
const EVALUATOR = new JjelEvaluator();

/** One action, `null` when blank (`undefined`, `null`, whitespace): no action. */
export function compileAction(source: string | null | undefined): CompiledAction | null {
    const text = source ?? '';
    if (text.trim() === '') return null;
    const parsed = parseAction(text);
    if (parsed.errors.length > 0 || !parsed.action) {
        const e = parsed.errors[0];
        return { source: text, action: null, defect: e ? `${e.line}:${e.column} ${e.message}` : 'no action produced' };
    }
    return { source: text, action: parsed.action, defect: null };
}

/** The `0..*` actions of a site, in order, blanks dropped. */
export function compileActions(sources: ReadonlyArray<string | null | undefined>): CompiledAction[] {
    const out: CompiledAction[] = [];
    for (const source of sources) {
        const c = compileAction(source);
        if (c) out.push(c);
    }
    return out;
}

/** The key of a site: role and element, so the entry and the exit of one place are two sites. */
export function actionSiteKey(site: ActionSite): string {
    return `${site.role}:${site.element}`;
}

type Evaluated = { readonly ok: true; readonly value: JjelValue } | { readonly ok: false; readonly why: string };

/** One expression with diagnostics, as `evaluateTriState` reads them: an exception, then an absence. */
function evaluate(expr: JjelExpression, ctx: EvaluationContext): Evaluated {
    let out: { value: JjelValue; warnings: JjelWarning[] };
    try {
        out = EVALUATOR.evaluateWithDiagnostics(expr, ctx);
    } catch (error) {
        const e: any = error;
        return { ok: false, why: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}` };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        return {
            ok: false,
            why: absent.suggestion
                ? `'${absent.identifier}' does not exist; maybe '${absent.suggestion}'`
                : `'${absent.identifier}' does not exist`,
        };
    }
    return { ok: true, value: out.value };
}

function isSimValue(value: JjelValue): value is SimValue {
    return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
}

/** One action at one site: its assignment, or why there is none. */
function evaluateAction(
    c: CompiledAction, site: ActionSite, ctx: EvaluationContext, declared: CompiledNet['declared'],
): SimAssignment | string {
    if (c.action === null) return c.defect ?? 'no action produced';
    const { target, value } = c.action;
    const attr = target.attribute;

    // The element: the site for `node`, recognized by syntax (R-SIM-42); otherwise the path over the frozen M.
    const onNode = target.object.type === 'Identifier' && target.object.name === STATE_RESERVED.presentationRoot;
    let element = site.element;
    if (!onNode) {
        const object = evaluate(target.object, ctx);
        if (!object.ok) return `the target: ${object.why}`;
        const id = isJjelObject(object.value) ? (object.value as any).id : undefined;
        if (typeof id !== 'string' || id === '') return `the target is ${describeType(object.value)}, not a model element`;
        element = id;
    }

    // Locality (R-SIM-18): an undeclared target is the core's to refuse.
    const decl = declared.get(element)?.get(attr);
    if (decl?.space === 'semantic' && onNode) return `'${attr}' is a semantic attribute: node.[${attr}] assigns presentation only`;
    if (decl?.space === 'presentation' && !onNode) return `'${attr}' is a presentation attribute: only node.[${attr}] assigns it`;

    const rhs = evaluate(value, ctx);
    if (!rhs.ok) return rhs.why;
    if (!isSimValue(rhs.value)) return `the value is ${describeType(rhs.value)}, not a boolean, a number or a string`;
    return { element, attr, value: rhs.value };
}

/**
 * The core's `ActionOracle`: the actions of `actions` (keyed by `actionSiteKey`)
 * over the snapshot, with the places and the declarations of the compiled net.
 * A site with no actions assigns nothing; the first action that fails makes the
 * whole site a defect, whose detail names the action text.
 */
export function makeActionOracle(
    snapshot: SimSnapshot,
    net: Pick<CompiledNet, 'places' | 'declared'>,
    actions: ReadonlyMap<string, readonly CompiledAction[]>,
): ActionOracle {
    return (site, event, state): ActionOutcome => {
        const list = actions.get(actionSiteKey(site)) ?? [];
        if (list.length === 0) return { kind: 'ok', assignments: [] };
        const ctx = buildGuardContext(snapshot, { transitionId: site.element }, { event }, toJjelStateAccess(state, net.places));
        if (ctx === null) {
            return { kind: 'defect', detail: `'${list[0].source}': the site ${site.element} or the event has no handle in the snapshot` };
        }
        const assignments: SimAssignment[] = [];
        for (const c of list) {
            const out = evaluateAction(c, site, ctx, net.declared);
            if (typeof out === 'string') return { kind: 'defect', detail: `'${c.source}': ${out}` };
            assignments.push(out);
        }
        return { kind: 'ok', assignments };
    };
}

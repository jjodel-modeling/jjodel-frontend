/**
 * actionEvaluator — the actions of a step, compiled once and evaluated on σ
 * (wave B2 of the state operator, R-SIM-17, R-SIM-18, R-SIM-43).
 *
 * `compileAction` runs once per `Action` text per run: blank is no action; a
 * text `parseAction` rejects is a compile defect, reported when its site is
 * evaluated, so the core halts the step with `action-defect`. So is a semantic
 * assignment whose right-hand side reads `node` (E-NODE of the subset checker,
 * R-SIM-18, R-SIM-70): presentation never flows into σ. The bridge lists both
 * at Reset (lane C1), and the transition stays a candidate.
 *
 * `foldActionTarget` resolves a target before the run when it depends on
 * neither σ nor the event (report H4 of lane C): the bridge judges those
 * statically (undeclared, locality, a double target), and the core's run-time
 * halts stay for the rest.
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
 * Wired by the bridge since lane C1 (R-SIM-69); `NO_SIM_ACTIONS` stays the
 * oracle of a run with no action role bound.
 *
 * Pure: JjEL, the shared diagnostics of `jjelTriState.ts`, the subset checker
 * and the guard context.
 */

import { parseAction } from '../../jjel/parser';
import { JjelEvaluator, isJjelObject } from '../../jjel/evaluator';
import type { EvaluationContext, JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelAction, JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { describeType, firstAbsence } from '../jjelTriState';
import { buildGuardContext, toJjelStateAccess } from './guardContext';
import type { SimSnapshot } from './guardContext';
import { checkGuardSubset } from './subsetChecker';
import type { ActionOracle, ActionOutcome, ActionSite, CompiledNet, SimAssignment, SimValue } from './netTypes';

export interface CompiledAction {
    readonly source: string;
    /** `null` when the text does not parse. */
    readonly action: JjelAction | null;
    /**
     * Why the action never runs: the parse error, `line:column message`, or,
     * with `action` set, the subset error `E-NODE: …`; `null` otherwise.
     */
    readonly defect: string | null;
}

/** `node.[a]`: the target is the site's presentation, recognized by syntax (R-SIM-42). */
function onNode(action: JjelAction): boolean {
    const object = action.target.object;
    return object.type === 'Identifier' && object.name === STATE_RESERVED.presentationRoot;
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
    // A semantic assignment reads σ and M, never presentation (R-SIM-18, report §7.7).
    if (!onNode(parsed.action) && checkGuardSubset(parsed.action.value, text).some(d => d.code === 'E-NODE')) {
        return {
            source: text, action: parsed.action,
            defect: 'E-NODE: `node` is presentation state: a semantic assignment cannot read it (R-SIM-18).',
        };
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

/** A target resolved before the run: the element, the attribute, and whether it is `node.[a]`. */
export interface FoldedTarget {
    readonly element: string;
    readonly attr: string;
    readonly onNode: boolean;
}

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

/** Whether an expression reads σ (`.[x]`) or names `event`: then its value is known only in the step. */
function dependsOnStep(node: unknown): boolean {
    if (node === null || typeof node !== 'object') return false;
    if (Array.isArray(node)) return node.some(dependsOnStep);
    const e = node as { type?: unknown; name?: unknown };
    if (e.type === 'StateAccess') return true;
    if (e.type === 'Identifier' && e.name === 'event') return true;
    return Object.entries(node).some(([key, child]) => key !== 'location' && dependsOnStep(child));
}

/**
 * The target of `c` at `site` when it depends on neither σ nor the event
 * (report H4): `node.[a]` is the site; any other path is evaluated once over
 * the frozen M, with `self` the site. `null` when it depends on them, when the
 * action does not parse, or when the path does not resolve to an element: the
 * run decides then.
 */
export function foldActionTarget(c: CompiledAction, site: ActionSite, snapshot: SimSnapshot): FoldedTarget | null {
    if (c.action === null) return null;
    const { target } = c.action;
    if (onNode(c.action)) return { element: site.element, attr: target.attribute, onNode: true };
    if (dependsOnStep(target.object)) return null;
    const ctx = buildGuardContext(snapshot, { transitionId: site.element }, { event: null });
    if (ctx === null) return null;
    const object = evaluate(target.object, ctx);
    const id = object.ok && isJjelObject(object.value) ? (object.value as any).id : undefined;
    return typeof id === 'string' && id !== '' ? { element: id, attr: target.attribute, onNode: false } : null;
}

/** One action at one site: its assignment, or why there is none. */
function evaluateAction(
    c: CompiledAction, site: ActionSite, ctx: EvaluationContext, declared: CompiledNet['declared'],
): SimAssignment | string {
    if (c.action === null || c.defect !== null) return c.defect ?? 'no action produced';
    const { target, value } = c.action;
    const attr = target.attribute;

    // The element: the site for `node`, recognized by syntax (R-SIM-42); otherwise the path over the frozen M.
    const isNode = onNode(c.action);
    let element = site.element;
    if (!isNode) {
        const object = evaluate(target.object, ctx);
        if (!object.ok) return `the target: ${object.why}`;
        const id = isJjelObject(object.value) ? (object.value as any).id : undefined;
        if (typeof id !== 'string' || id === '') return `the target is ${describeType(object.value)}, not a model element`;
        element = id;
    }

    // Locality (R-SIM-18): an undeclared target is the core's to refuse.
    const decl = declared.get(element)?.get(attr);
    if (decl?.space === 'semantic' && isNode) return `'${attr}' is a semantic attribute: node.[${attr}] assigns presentation only`;
    if (decl?.space === 'presentation' && !isNode) return `'${attr}' is a presentation attribute: only node.[${attr}] assigns it`;

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

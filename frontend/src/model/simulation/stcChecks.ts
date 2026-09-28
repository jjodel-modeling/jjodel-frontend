/**
 * stcChecks — the guard and action rules neither Reset nor the problems
 * registry had (slice P2b, docs/discovery/discovery_2026-09-27_sim_checker_gap.md
 * §8, R-SIM-70 as extended). The bridge calls them from `guardDefectsOf` and
 * `actionDefectsOf`, so the defects line and the registry gain them together.
 *
 * - R1: a `.[x]` read, or a target the run resolves, whose name no declaration
 *   has; `marked` and `tokens` are every place's.
 * - R2: a guard read whose object folds (no σ, no event, no bound variable),
 *   judged like a folded target: no element, undeclared on it, `marked` or
 *   `tokens` off a place, a presentation attribute.
 * - R3 lives beside `foldActionTarget` (`judgeActionTarget`, actionEvaluator.ts).
 * - R4: the subset checker's errors on an action's right side, E-NODE aside
 *   (the action's own compile defect, and allowed on a presentation target).
 * - R5: a right side that folds to a non-scalar, or to a value outside the
 *   target's domain.
 * - R6: a guard that is a `.[x]` read of a non-boolean declaration.
 *
 * R-SIM-88 (P-2026-09-28-0034) adds, beside the rules, what the bridge asks
 * before a step: `inputReads`, the input reads of an expression folded as R2
 * folds; and `checkInputTarget`, a target the run resolves whose name only an
 * input has (a folded one is the bridge's, as for a derived target).
 *
 * Every rule is a certainty before the run: the texts are those the run would
 * give when it meets the same text. What depends on σ or the event stays the
 * run's to halt on (R-SIM-70), and a guard or an action judged here is still
 * evaluated by the run as before.
 *
 * Pure: JjEL, the shared diagnostics, the subset checker and the guard context.
 */

import { JjelEvaluator, isJjelObject } from '../../jjel/evaluator';
import type { JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelExpression, StateAccessExpr } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { describeType, firstAbsence } from '../jjelTriState';
import { buildGuardContext } from './guardContext';
import type { SimSnapshot } from './guardContext';
import { checkGuardSubset } from './subsetChecker';
import { inDomain } from './netStep';
import type { CompiledAction, FoldedTarget } from './actionEvaluator';
import type { ActionSite, CompiledNet, Domain, InputRead, SimValue } from './netTypes';

/** The reasons of a rule, a subset of the bridge's `CompileDefect['reason']`. */
export type StcDefectReason = 'undeclared' | 'unresolved' | 'locality' | 'subset' | 'value' | 'read-only';

export interface StcDefect {
    readonly reason: StcDefectReason;
    readonly detail: string;
    /** The form of the one line, when it is not derived from the detail. */
    readonly short?: string;
}

/** What the rules read: M frozen, the declarations, the places, and a name for an element. */
export interface StcScope {
    readonly snapshot: SimSnapshot;
    readonly net: Pick<CompiledNet, 'attributes' | 'declared' | 'places'>;
    /** Never the id: the line and the title name elements (R-SIM-62). */
    readonly nameOf: (id: string) => string;
}

/** Path B, as for guards and actions: no context at construction, so no builtins. */
const EVALUATOR = new JjelEvaluator();

const NONE: ReadonlySet<string> = new Set<string>();

/** Every expression node of `node`, pre-order, with the names its binders bind there. */
function walk(node: unknown, bound: ReadonlySet<string>, visit: (e: JjelExpression, bound: ReadonlySet<string>) => void): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const x of node) walk(x, bound, visit);
        return;
    }
    const e = node as any;
    const within = (names: readonly string[]) => new Set([...bound, ...names]);
    if (typeof e.type === 'string') {
        visit(e as JjelExpression, bound);
        switch (e.type) {
            case 'Lambda':
                walk(e.body, within(e.params), visit);
                return;
            case 'ForAll':
                walk(e.collection, bound, visit);
                walk([e.filter, e.projection], within([e.variable]), visit);
                return;
            case 'Exists':
                walk(e.collection, bound, visit);
                walk(e.predicate, within([e.variable]), visit);
                return;
        }
    }
    for (const [key, child] of Object.entries(e)) if (key !== 'location') walk(child, bound, visit);
}

/** Whether `e` has one value over the frozen M: it reads no σ, names no `event` and no bound variable. */
function folds(e: JjelExpression, bound: ReadonlySet<string>): boolean {
    let ok = true;
    walk(e, bound, (x, b) => {
        if (x.type === 'StateAccess') ok = false;
        else if (x.type === 'Identifier' && (x.name === 'event' || b.has(x.name))) ok = false;
    });
    return ok;
}

type Folded = { readonly ok: true; readonly value: JjelValue } | { readonly ok: false; readonly why: string };

/** `e` over the frozen M, `self` the site and no event, as the run evaluates it; `null` when the site has no handle. */
function fold(e: JjelExpression, site: string, snapshot: SimSnapshot): Folded | null {
    const ctx = buildGuardContext(snapshot, { transitionId: site }, { event: null });
    if (ctx === null) return null;
    let out: { value: JjelValue; warnings: JjelWarning[] };
    try {
        out = EVALUATOR.evaluateWithDiagnostics(e, ctx);
    } catch (error) {
        const x: any = error;
        return { ok: false, why: x?.message ?? String(x) };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        return { ok: false, why: absent.suggestion ? `'${absent.identifier}' does not exist; maybe '${absent.suggestion}'` : `'${absent.identifier}' does not exist` };
    }
    return { ok: true, value: out.value };
}

function isSimValue(value: JjelValue): value is SimValue {
    return typeof value === 'boolean' || typeof value === 'number' || typeof value === 'string';
}

function elementId(value: JjelValue): string | null {
    const id = isJjelObject(value) ? (value as any).id : undefined;
    return typeof id === 'string' && id !== '' ? id : null;
}

const RESERVED: readonly string[] = STATE_RESERVED.readOnlyAttributes;
const [MARKED] = RESERVED;

/** R1: a name no declaration has; `marked` and `tokens` are every place's. */
function undeclaredName(attr: string, scope: StcScope): StcDefect | null {
    if (RESERVED.includes(attr) || scope.net.attributes.some(d => d.name === attr)) return null;
    return { reason: 'undeclared', detail: `no state attribute is declared with the name '${attr}'`, short: `undeclared '${attr}'` };
}

/** R2: one read whose object folds, judged on the element it folds to, as `toJjelStateAccess` would read it. */
function foldedRead(e: StateAccessExpr, site: string, scope: StcScope): StcDefect | null {
    const attr = e.attribute;
    const object = fold(e.object, site, scope.snapshot);
    if (object === null) return null;
    if (!object.ok) {
        return { reason: 'unresolved', detail: `'.[${attr}]' needs a model element on its left: ${object.why}`, short: `unresolved .[${attr}]` };
    }
    const id = elementId(object.value);
    if (id === null) {
        const v = object.value;
        const got = v === null ? 'null' : Array.isArray(v) ? 'a collection' : typeof v;
        return { reason: 'unresolved', detail: `'.[${attr}]' needs a model element on its left, got ${got}`, short: `unresolved .[${attr}]` };
    }
    const where = scope.nameOf(id);
    if (RESERVED.includes(attr)) {
        return scope.net.places.has(id) ? null : {
            reason: 'undeclared', detail: `'${attr}' is not a state attribute of ${where}: only a place has it`, short: `'${attr}' on ${where}, not a place`,
        };
    }
    const decl = scope.net.declared.get(id)?.get(attr);
    if (!decl) return { reason: 'undeclared', detail: `'${attr}' is not a state attribute of ${where}`, short: `undeclared '${attr}' on ${where}` };
    if (decl.space !== 'semantic') {
        return { reason: 'locality', detail: `'${attr}' is a presentation attribute of ${where}: a guard cannot read it`, short: `locality, '${attr}' is ${decl.space}` };
    }
    return null;
}

/** The type a domain's values have, `null` for a boolean or no domain. */
function nonBoolean(domain: Domain | null): string | null {
    if (domain === null || domain.kind === 'boolean') return null;
    return domain.kind === 'range' ? 'number' : 'string';
}

/** R6: the guard is one `.[x]` read, and what it reads is never a boolean. */
function readType(e: StateAccessExpr, site: string, scope: StcScope): string | null {
    const attr = e.attribute;
    if (RESERVED.includes(attr)) return attr === MARKED ? null : 'number';
    if (folds(e.object, NONE)) {
        const object = fold(e.object, site, scope.snapshot);
        const id = object?.ok ? elementId(object.value) : null;
        const decl = id === null ? undefined : scope.net.declared.get(id)?.get(attr);
        return decl ? nonBoolean(decl.domain) : null;
    }
    const types = new Set(scope.net.attributes.filter(d => d.name === attr).map(d => nonBoolean(d.domain)));
    const [only] = types;
    return types.size === 1 ? only ?? null : null;
}

/**
 * R1, R2 and R6 on a guard that compiled (parse and subset passed), `site` the
 * element it is attached to: the first read that fails, in pre-order, then the
 * type of a guard that is one read. `null` when none applies.
 */
export function checkGuard(expr: JjelExpression, site: string, scope: StcScope): StcDefect | null {
    // Assigned in the visitor: the cast keeps TypeScript from narrowing it to `null` here.
    let found = null as StcDefect | null;
    walk(expr, NONE, (e, bound) => {
        if (found !== null || e.type !== 'StateAccess') return;
        if (e.object.type === 'Identifier' && e.object.name === STATE_RESERVED.presentationRoot) return;
        found = undeclaredName(e.attribute, scope) ?? (folds(e.object, bound) ? foldedRead(e, site, scope) : null);
    });
    if (found !== null) return found;
    if (expr.type !== 'StateAccess' || (expr.object.type === 'Identifier' && expr.object.name === STATE_RESERVED.presentationRoot)) return null;
    const type = readType(expr, site, scope);
    return type === null ? null : { reason: 'value', detail: `the guard returns ${type}, not a boolean`, short: `returns ${type}` };
}

/** R4: an error of the subset checker on the right side; E-NODE is the action's compile defect, or allowed on `node.[a]`. */
export function checkActionSubset(c: CompiledAction): StcDefect | null {
    if (c.action === null || c.defect !== null) return null;
    const error = checkGuardSubset(c.action.value, c.source).find(d => d.severity === 'error' && d.code !== 'E-NODE');
    return error ? { reason: 'subset', detail: `${error.code}: ${error.message}` } : null;
}

/** R1 on a target the run resolves (it reads σ or the event): its name, since its element is not known. */
export function checkTargetName(c: CompiledAction, scope: StcScope): StcDefect | null {
    return c.action === null ? null : undeclaredName(c.action.target.attribute, scope);
}

/**
 * R1 on the reads of the right side, then R5 on its value when it folds: a
 * non-scalar, or, with `target` folded, a value outside the declaration's
 * domain, as the core would halt on it. `null` when none applies.
 */
export function checkActionValue(c: CompiledAction, site: ActionSite, target: FoldedTarget | null, scope: StcScope): StcDefect | null {
    if (c.action === null) return null;
    const { value } = c.action;
    // Assigned in the visitor: the cast keeps TypeScript from narrowing it to `null` here.
    let found = null as StcDefect | null;
    walk(value, NONE, e => {
        if (found === null && e.type === 'StateAccess') found = undeclaredName(e.attribute, scope);
    });
    if (found !== null) return found;
    if (!folds(value, NONE)) return null;
    const v = fold(value, site.element, scope.snapshot);
    if (v === null || !v.ok) return null;
    if (!isSimValue(v.value)) {
        const type = describeType(v.value);
        return { reason: 'value', detail: `the value is ${type}, not a boolean, a number or a string`, short: `value is ${type}` };
    }
    const decl = target === null ? undefined : scope.net.declared.get(target.element)?.get(target.attr);
    if (target === null || !decl || inDomain(v.value, decl.domain)) return null;
    return {
        reason: 'value', detail: `${target.attr} of ${scope.nameOf(target.element)} would be ${String(v.value)}, outside its domain`,
        short: `${target.attr} = ${String(v.value)}, outside its domain`,
    };
}

/** R-SIM-88: the defect of an assignment to an input, whichever way the target is known. */
export function inputTarget(attr: string): StcDefect {
    return { reason: 'read-only', detail: `'${attr}' is an input and cannot be assigned`, short: `assigns input '${attr}'` };
}

/**
 * R-SIM-88 on a target the run resolves (it reads σ or the event): when every
 * declaration of its name is an input, the assignment can only halt `read-only`.
 */
export function checkInputTarget(c: CompiledAction, scope: StcScope): StcDefect | null {
    if (c.action === null) return null;
    const attr = c.action.target.attribute;
    const decls = scope.net.attributes.filter(d => d.name === attr);
    return decls.length > 0 && decls.every(d => d.input === true) ? inputTarget(attr) : null;
}

/**
 * R-SIM-88: the input reads of one expression attached to `site`, in pre-order,
 * each (element, name) once. A read whose object folds (no σ, no event, no bound
 * variable) names the element it folds to, and counts when that element declares
 * the name as an input; any other read of an input's name counts every element
 * that declares it as an input, since the run may read any of them. `node.[x]`
 * is presentation, never an input; an input without a domain is a declaration
 * defect and is not asked.
 */
export function inputReads(expr: JjelExpression, site: string, scope: StcScope): InputRead[] {
    const names = new Set(scope.net.attributes.filter(d => d.input === true).map(d => d.name));
    if (names.size === 0) return [];
    const out: InputRead[] = [];
    const seen = new Set<string>();
    const add = (element: string, attr: string) => {
        const decl = scope.net.declared.get(element)?.get(attr);
        if (decl?.input !== true || decl.domain === null) return;
        const key = `${element}\u0000${attr}`;
        if (seen.has(key)) return;
        seen.add(key);
        out.push({ element, attr, domain: decl.domain });
    };
    walk(expr, NONE, (e, bound) => {
        if (e.type !== 'StateAccess' || !names.has(e.attribute)) return;
        if (e.object.type === 'Identifier' && e.object.name === STATE_RESERVED.presentationRoot) return;
        if (folds(e.object, bound)) {
            const object = fold(e.object, site, scope.snapshot);
            const id = object?.ok ? elementId(object.value) : null;
            if (id !== null) add(id, e.attribute);
            return;
        }
        for (const element of scope.net.declared.keys()) add(element, e.attribute);
    });
    return out;
}

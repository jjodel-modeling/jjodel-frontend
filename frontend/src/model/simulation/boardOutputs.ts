/**
 * boardOutputs — what an output device of the I/O board reads (R-SIM-110, R-SIM-111;
 * P-2026-10-03-1845 Lane 1, docs/discovery/discovery_2026-10-03_sim_io_board.md §4).
 *
 * An output expression is an anonymous global DEFINE: a read-only function of σ.
 * `compileOutput` applies the checks a semantic equation gets in
 * `derivedEvaluator.compileDerived`, in its order: a strict parse; the subset
 * checker, `E-NODE` included (an output is semantic, R-SIM-18); `event`, which is
 * `null` after a step; a read of an input's name, chosen per step and never in σ
 * (R-SIM-88); a read of a presentation name. Then R1 of the guard checker: a name
 * no declaration has is undeclared, `marked` and `tokens` being every place's, so
 * `X.[marked]` compiles with no declaration at all (the State machine profile).
 * With the run's snapshot, R2 on the output's own context: the element left of a
 * `.[x]` that names it directly (an identifier no lambda or quantifier binds) is
 * folded over M with `self` the model root, and must be a model element carrying
 * the attribute, a place for `marked` and `tokens`. `stcChecks.checkGuard` cannot
 * do it here: its fold binds `self` to a transition's handle, which the model has
 * not, so it folds nothing at the model (found in Lane 1). Without the snapshot a
 * read that passes every check can still fail when evaluated (`tc.[marked]` on a
 * transition, report H6): that is a reading, not a compile defect.
 *
 * `evaluateOutput` runs on the context of a global equation
 * (`derivedEvaluator.ts` `evaluateDerived`): `self` the model root, `event` null,
 * σ through the core's accessor, so a DEFINE is read from σ's derived map, never
 * recomputed. A value that is not a boolean, a finite number or a string, an
 * absent identifier and an exception are defects: a reading never throws.
 *
 * `pulseLit` is the Pulse LED, a Mealy output: lit on the step whose fired
 * transition, or whose input, is the one named. It reads the trace, not σ, so it
 * is presentation and stays out of the `.smv` export (R-SIM-111).
 *
 * Pure: JjEL, the shared diagnostics of `jjelTriState.ts`, the subset checker,
 * the guard context and the core's accessor.
 */

import { parseExpressionStrict } from '../../jjel/parser';
import { JjelEvaluator } from '../../jjel/evaluator';
import type { JjelValue, JjelWarning } from '../../jjel/evaluator';
import type { JjelExpression } from '../../jjel/types/ast';
import { STATE_RESERVED } from '../../jjel/stateReserved';
import { describeType, firstAbsence } from '../jjelTriState';
import { toJjelStateAccess } from './guardContext';
import type { SimSnapshot } from './guardContext';
import { stateAccess } from './netStep';
import { checkGuardSubset } from './subsetChecker';
import type { CompiledNet, SimState, SimValue } from './netTypes';

/** What an output compiles against: the run's declarations and places; the snapshot when a run exists. */
export interface OutputScope {
    readonly net: Pick<CompiledNet, 'modelId' | 'attributes' | 'declared' | 'places'>;
    readonly snapshot?: SimSnapshot;
    readonly nameOf?: (id: string) => string;
}

export type OutputDefectCode = 'empty' | 'parse' | 'subset' | 'node' | 'event' | 'input' | 'undeclared' | 'unresolved';

export interface OutputDefect {
    readonly code: OutputDefectCode;
    /** One line for a title or a caption: `undeclared 'nope'`. */
    readonly short: string;
    readonly detail: string;
}

export interface CompiledOutput {
    readonly source: string;
    /** `null` when the output does not compile. */
    readonly expr: JjelExpression | null;
    readonly defect: OutputDefect | null;
}

export type OutputReading =
    | { readonly kind: 'value'; readonly value: SimValue }
    | { readonly kind: 'defect'; readonly detail: string };

/** One committed step as the Pulse LED reads it (simRunState.ts `SimTraceStep`). */
export interface PulseStep {
    readonly event: string | null;
    readonly selector: string | null;
    readonly kind: string;
}

/** Every node of an AST, in pre-order, locations aside (as `derivedEvaluator.ts` visits). */
function visit(node: unknown, f: (e: Record<string, unknown>) => void): void {
    if (node === null || typeof node !== 'object') return;
    if (Array.isArray(node)) {
        for (const x of node) visit(x, f);
        return;
    }
    f(node as Record<string, unknown>);
    for (const [key, child] of Object.entries(node)) if (key !== 'location') visit(child, f);
}

const RESERVED: readonly string[] = STATE_RESERVED.readOnlyAttributes;

const defective = (source: string, code: OutputDefectCode, short: string, detail: string = short): CompiledOutput =>
    ({ source, expr: null, defect: { code, short, detail } });

export function compileOutput(text: string, scope: OutputScope): CompiledOutput {
    if (text.trim() === '') return defective(text, 'empty', 'no expression');
    const parsed = parseExpressionStrict(text);
    if (parsed.errors.length > 0 || !parsed.expression) {
        const e = parsed.errors[0];
        return defective(text, 'parse', e ? `parse error ${e.line}:${e.column}` : 'parse error', e ? `parse error ${e.line}:${e.column} ${e.message}` : 'parse error, no expression');
    }
    const expr = parsed.expression;
    const error = checkGuardSubset(expr, text).find(d => d.severity === 'error');
    if (error) {
        return error.code === 'E-NODE'
            ? defective(text, 'node', 'reads node', 'E-NODE: `node` is presentation state: an output reads σ only (R-SIM-18).')
            : defective(text, 'subset', error.code, `${error.code}: ${error.message}`);
    }
    let event = false;
    const reads: string[] = [];
    visit(expr, e => {
        if (e.type === 'Identifier' && e.name === 'event') event = true;
        if (e.type === 'StateAccess' && typeof e.attribute === 'string' && !reads.includes(e.attribute)) reads.push(e.attribute);
    });
    if (event) return defective(text, 'event', 'reads event', 'the output reads event, which is null after a step: an output is a function of σ alone');
    const attributes = scope.net.attributes;
    for (const attr of reads) {
        if (RESERVED.includes(attr)) continue;
        if (attributes.some(d => d.name === attr && d.input === true)) {
            return defective(text, 'input', `reads the input '${attr}'`, `the output reads the input '${attr}', chosen at each step and never in σ (R-SIM-88)`);
        }
        if (attributes.some(d => d.name === attr && d.space === 'presentation')) {
            return defective(text, 'node', `reads '${attr}', presentation`, `E-NODE: the output reads the presentation attribute '${attr}' (R-SIM-18).`);
        }
        if (!attributes.some(d => d.name === attr)) {
            return defective(text, 'undeclared', `undeclared '${attr}'`, `no state attribute is declared with the name '${attr}'`);
        }
    }
    if (scope.snapshot) {
        const found = foldedReads(expr, scope, scope.snapshot);
        if (found) return { source: text, expr: null, defect: found };
    }
    return { source: text, expr, defect: null };
}

/** The names a lambda or a quantifier binds anywhere in the expression: never folded. */
function bindersOf(expr: JjelExpression): Set<string> {
    const out = new Set<string>();
    visit(expr, e => {
        if (e.type === 'Lambda' && Array.isArray(e.params)) for (const p of e.params) if (typeof p === 'string') out.add(p);
        if ((e.type === 'ForAll' || e.type === 'Exists') && typeof e.variable === 'string') out.add(e.variable);
    });
    return out;
}

/** The context of a global equation over the frozen M, without σ: what the identifier left of `.[x]` names. */
function outputContext(snapshot: SimSnapshot) {
    return snapshot.base.child({ self: snapshot.model, event: null, model: snapshot.model });
}

/**
 * R2 for an output: each `.[x]` whose left side is an identifier naming a model element directly, folded over M
 * as the output will be evaluated, `self` the model root. The first read that names no element, `marked` or
 * `tokens` off a place, or an attribute the element does not carry is the defect; `null` when none.
 */
function foldedReads(expr: JjelExpression, scope: OutputScope, snapshot: SimSnapshot): OutputDefect | null {
    const binders = bindersOf(expr);
    const nameOf = scope.nameOf ?? (id => id);
    let found: OutputDefect | null = null;
    visit(expr, e => {
        if (found !== null || e.type !== 'StateAccess' || typeof e.attribute !== 'string') return;
        const object = e.object as Record<string, unknown> | undefined;
        if (!object || object.type !== 'Identifier' || typeof object.name !== 'string') return;
        if (object.name === 'event' || object.name === STATE_RESERVED.presentationRoot || binders.has(object.name)) return;
        const attr = e.attribute;
        const unresolved = (why: string): OutputDefect => ({ code: 'unresolved', short: `unresolved .[${attr}]`, detail: `'.[${attr}]' needs a model element on its left: ${why}` });
        let out: { value: JjelValue; warnings: JjelWarning[] };
        try {
            out = EVALUATOR.evaluateWithDiagnostics(object as unknown as JjelExpression, outputContext(snapshot));
        } catch (error) {
            found = unresolved((error as any)?.message ?? String(error));
            return;
        }
        const absent = firstAbsence(out.warnings);
        if (absent) {
            found = unresolved(`'${absent.identifier}' does not exist`);
            return;
        }
        const id = out.value !== null && typeof out.value === 'object' ? (out.value as any).id : undefined;
        if (typeof id !== 'string' || id === '') {
            found = unresolved(`got ${describeType(out.value)}`);
            return;
        }
        if (RESERVED.includes(attr)) {
            if (!scope.net.places.has(id)) {
                found = { code: 'unresolved', short: `'${attr}' on ${nameOf(id)}, not a place`, detail: `'${attr}' is not a state attribute of ${nameOf(id)}: only a place has it` };
            }
            return;
        }
        if (!scope.net.declared.get(id)?.has(attr)) {
            found = { code: 'undeclared', short: `undeclared '${attr}' on ${nameOf(id)}`, detail: `'${attr}' is not a state attribute of ${nameOf(id)}` };
        }
    });
    return found;
}

/** Path B, as for guards, actions and equations: no context at construction, so no builtins. */
const EVALUATOR = new JjelEvaluator();

function isSimValue(value: JjelValue): value is SimValue {
    return typeof value === 'boolean' || typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value));
}

export function evaluateOutput(
    output: CompiledOutput, snapshot: SimSnapshot, net: Pick<CompiledNet, 'modelId' | 'places'>, state: SimState,
): OutputReading {
    if (output.defect !== null || output.expr === null) return { kind: 'defect', detail: output.defect?.detail ?? 'no expression' };
    const ctx = snapshot.base.child({ self: snapshot.model, event: null, model: snapshot.model });
    ctx.stateAccess = toJjelStateAccess(stateAccess(state, net.modelId), net.places);
    let out: { value: JjelValue; warnings: JjelWarning[] };
    try {
        out = EVALUATOR.evaluateWithDiagnostics(output.expr, ctx);
    } catch (error) {
        const e: any = error;
        return { kind: 'defect', detail: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}` };
    }
    const absent = firstAbsence(out.warnings);
    if (absent) {
        return {
            kind: 'defect',
            detail: absent.suggestion ? `'${absent.identifier}' does not exist; maybe '${absent.suggestion}'` : `'${absent.identifier}' does not exist`,
        };
    }
    if (!isSimValue(out.value)) return { kind: 'defect', detail: `the value is ${describeType(out.value)}, not a boolean, a number or a string` };
    return { kind: 'value', value: out.value };
}

/** Lit on step `n` (1-based, the trace's) when it fired the transition named, or fired on the event named. */
export function pulseLit(trace: readonly PulseStep[], n: number, on: { readonly kind: 'event' | 'transition'; readonly id: string }): boolean {
    if (!Number.isInteger(n) || n < 1 || n > trace.length) return false;
    const step = trace[n - 1];
    if (step.kind !== 'fired') return false;
    return on.kind === 'transition' ? step.selector === on.id : step.event === on.id;
}

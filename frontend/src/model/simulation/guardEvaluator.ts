/**
 * guardEvaluator — a guard, compiled once and evaluated on a configuration
 * (step 2, spec §5.2, R-SIM-15, R-SIM-17).
 *
 * `compileGuard` runs once per guard per run: an absent guard is `true` with
 * nothing to parse (R-SIM-17, degenerate case); a guard that does not parse, or
 * that the subset checker rejects, is a defect for the whole run and is never
 * evaluated. `evaluateGuard` runs per candidate and returns `true`, `false` or a
 * defect: the tri-state shared with validation (`model/jjelTriState.ts`), so a
 * guard and a validation rule on the same text and the same bindings answer the
 * same. A defect is never `true` and never `false`: the arc leaves the
 * candidates and the label says why (spec §5.2).
 *
 * Path B (R-SIM-14): the evaluator is built WITHOUT a context and evaluates on
 * the guard context. Its builtins (`now`, `today`, `date`, `String`, …) are
 * registered on its own context, which is never used, so a guard has none of
 * them: no clock, no conversions, and a root named like a builtin is not
 * shadowed. The evaluator keeps no state across evaluations on another
 * context, so one instance serves every guard.
 *
 * The step does not call this module yet: guards enter the step at step 3.
 *
 * Pure: JjEL, the shared tri-state and the subset checker.
 */

import { parseExpression } from '../../jjel/parser';
import { JjelEvaluator } from '../../jjel/evaluator';
import type { EvaluationContext } from '../../jjel/evaluator';
import type { JjelExpression } from '../../jjel/types/ast';
import { describeType, evaluateTriState } from '../jjelTriState';
import type { NotEvaluableReason } from '../jjelTriState';
import { checkGuardSubset } from './subsetChecker';
import type { SubsetDiagnostic } from './subsetChecker';

/** Why a guard gave no verdict: at compile time, for a missing handle, or one of the three entrances. */
export type GuardDefectReason = 'parse-error' | 'subset' | 'no-handle' | NotEvaluableReason;

export interface CompiledGuard {
    readonly source: string;
    /** `null` for an absent guard, which is `true`. */
    readonly expr: JjelExpression | null;
    /** Every diagnostic of the subset checker, warnings and not-verifiable included. */
    readonly diagnostics: readonly SubsetDiagnostic[];
    /** Set when the guard never runs: it does not parse, or the checker reports an error. */
    readonly defect: { readonly reason: 'parse-error' | 'subset'; readonly detail: string } | null;
}

export type GuardOutcome =
    | { kind: 'true' }
    | { kind: 'false' }
    | { kind: 'defect'; reason: GuardDefectReason; detail: string };

/** Path B: no context at construction. */
const EVALUATOR = new JjelEvaluator();

/**
 * Parses and checks a guard. Absent means `undefined`, `null` or blank
 * (R-SIM-17: an undeclared role or an empty feature).
 */
export function compileGuard(source: string | null | undefined): CompiledGuard {
    const text = source ?? '';
    if (text.trim() === '') return { source: text, expr: null, diagnostics: [], defect: null };

    const parsed = parseExpression(text);
    if (parsed.errors.length > 0 || !parsed.expression) {
        const e = parsed.errors[0];
        return {
            source: text, expr: null, diagnostics: [],
            defect: { reason: 'parse-error', detail: e ? `${e.line}:${e.column} ${e.message}` : 'no expression produced' },
        };
    }

    const diagnostics = checkGuardSubset(parsed.expression, text);
    const error = diagnostics.find(d => d.severity === 'error');
    return {
        source: text,
        expr: parsed.expression,
        diagnostics,
        defect: error ? { reason: 'subset', detail: `${error.code}: ${error.message}` } : null,
    };
}

/**
 * The outcome of a compiled guard on a guard context (`buildGuardContext`).
 * `ctx` is `null` when the transition or the event has no handle in the
 * snapshot. Never throws.
 */
export function evaluateGuard(guard: CompiledGuard, ctx: EvaluationContext | null): GuardOutcome {
    if (guard.defect) return { kind: 'defect', reason: guard.defect.reason, detail: guard.defect.detail };
    if (guard.expr === null) return { kind: 'true' };
    if (ctx === null) {
        return { kind: 'defect', reason: 'no-handle', detail: 'the transition or the event has no handle in the snapshot' };
    }

    const out = evaluateTriState(EVALUATOR, guard.expr, ctx);
    switch (out.kind) {
        case 'verdict':
            return { kind: out.value ? 'true' : 'false' };
        case 'exception': {
            const e: any = out.error;
            return { kind: 'defect', reason: 'exception', detail: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}` };
        }
        case 'absent':
            return {
                kind: 'defect', reason: 'absent-identifier',
                detail: out.warning.suggestion
                    ? `'${out.warning.identifier}' does not exist; maybe '${out.warning.suggestion}'`
                    : `'${out.warning.identifier}' does not exist`,
            };
        case 'non-boolean':
            return { kind: 'defect', reason: 'non-boolean', detail: `the guard returned ${describeType(out.value)}, not a boolean` };
    }
}

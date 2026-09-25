/**
 * jjelTriState — the tri-state of a JjEL predicate, shared by validation and
 * simulation (R-SIM-15).
 *
 * Moved out of `model/validation/validationEvaluator.ts`, where it was the body
 * of the instance loop, so that the simulation's guard evaluator reuses it
 * instead of copying it. `verdict`, `Verdict`, `NotEvaluableReason`,
 * `describeType` and `firstAbsence` are moved verbatim; `evaluateTriState` is
 * the loop body, with the order it had: exception, then absence, then type.
 * Validation keeps its messages: this module returns data, and each caller
 * writes its own `detail`.
 *
 * The rationale of the three entrances and of the single verdict function is
 * in the header of `validationEvaluator.ts` (R-VAL-13), not repeated here.
 *
 * Pure: the only dependency is JjEL, so the module imports under the node test
 * bench.
 */

import type { EvaluationContext, JjelEvaluator, JjelValue, JjelWarning } from '../jjel/evaluator';
import type { JjelExpression } from '../jjel/types/ast';

/** Perche' una regola non e' stata valutabile su un'istanza. Tre valori, i tre ingressi
 *  di R-VAL-13. */
export type NotEvaluableReason = 'exception' | 'non-boolean' | 'absent-identifier';

/** Il verdetto di una regola su un'istanza. */
export type Verdict = 'satisfied' | 'violated' | 'not-boolean';

/**
 * L'UNICA funzione che trasforma un valore JjEL in un verdetto, e non converte niente.
 *
 * `true` -> soddisfatta. `false` -> violata. Tutto il resto -> **non e' un verdetto**:
 * `'not-boolean'`, che il chiamante mappa su non valutabile e sul canale di authoring.
 *
 * Non si aggiunga qui una regola di conversione, per quanto ragionevole sembri. Vedi
 * l'intestazione del modulo: il sistema ne ha gia' due e divergono; questa sarebbe la
 * terza, nel posto peggiore. R-VAL-13.
 */
export function verdict(value: JjelValue): Verdict {
    if (value === true) return 'satisfied';
    if (value === false) return 'violated';
    return 'not-boolean';
}

/** Il tipo del valore, come lo si scrive in una diagnostica. `null` e gli array non
 *  sono `'object'`: chi legge il referto deve vedere la differenza che conta. */
export function describeType(value: JjelValue): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return `array(${value.length})`;
    return typeof value;
}

/** Il primo warning che segnala un'assenza, o `null`. `ambiguous-instance` NON e'
 *  un'assenza — il nome c'e', ce n'e' troppo — e non apre il terzo ingresso. */
export function firstAbsence(warnings: JjelWarning[]): JjelWarning | null {
    for (const w of warnings) {
        if (w.kind === 'undefined-identifier' || w.kind === 'property-not-found') return w;
    }
    return null;
}

/**
 * The outcome of one evaluation. `verdict` is the only kind that decides; the
 * other three are the entrances of "not evaluable" (R-VAL-13), and none of them
 * is ever a verdict.
 */
export type TriState =
    | { kind: 'verdict'; value: boolean }
    | { kind: 'exception'; error: unknown }
    | { kind: 'absent'; warning: JjelWarning }
    | { kind: 'non-boolean'; value: JjelValue };

/**
 * Evaluates `expr` on `ctx` and classifies the result. Never throws: every
 * exception is caught, not only `JjelEvaluationError`, because the class of the
 * error does not change the outcome, which is not a verdict.
 *
 * Order: exception, then absence, then type (validation's order, R-VAL-13):
 * between the two diagnoses, the absence says where to intervene.
 */
export function evaluateTriState(
    evaluator: JjelEvaluator,
    expr: JjelExpression,
    ctx: EvaluationContext,
): TriState {
    let value: JjelValue;
    let warnings: JjelWarning[];
    try {
        const out = evaluator.evaluateWithDiagnostics(expr, ctx);
        value = out.value;
        warnings = out.warnings;
    } catch (error) {
        return { kind: 'exception', error };
    }

    const absent = firstAbsence(warnings);
    if (absent) return { kind: 'absent', warning: absent };

    const v = verdict(value);
    if (v === 'satisfied') return { kind: 'verdict', value: true };
    if (v === 'violated') return { kind: 'verdict', value: false };
    return { kind: 'non-boolean', value };
}

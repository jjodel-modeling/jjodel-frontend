/**
 * stateReserved — the one list of the names the state operator `.[x]` reserves
 * (R-SIM-18, R-SIM-30, R-SIM-42).
 *
 * Read by the parser (an action never assigns a read-only attribute), the
 * evaluator (`node.[x]` is recognized by syntax), the guard checker of the
 * simulator (`model/simulation/subsetChecker.ts`, its `GUARD_ROOTS`) and the
 * autocompletion. None of these names is a lexer keyword: `node` still means
 * the selected graph vertex in the Console, Jodie and validation contexts
 * (`buildEvalContext`), and a metaclass or an instance may be called `model`.
 *
 * Pure: no imports.
 */
export const STATE_RESERVED = Object.freeze({
    /** The operator: one contiguous token (`. [` is not it). */
    operator: '.[',
    /** The roots of a guard or an action. A local variable must not take their names. */
    roots: Object.freeze(['self', 'event', 'model', 'node']) as readonly string[],
    /** `node.[x]`: the presentation of the element the expression is attached to. */
    presentationRoot: 'node',
    /** Attributes every place has, readable and never assignable (R-SIM-30). */
    readOnlyAttributes: Object.freeze(['marked', 'tokens']) as readonly string[],
});

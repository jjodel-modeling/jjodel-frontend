# Discovery 2026-11-05: a failing JjEL method inside JjTL stops the mapping (R-FA-12)

- Prompt-ID: P-2026-11-05-1530 (work), closed by P-2026-11-05-2225 (continuation after the context ceiling)
- Sessions: fabbcff6 (P-2026-11-05-1530), 7830b3e4 (P-2026-11-05-2225)
- Tree: `~/jjodel-w-jjtlmeth`, branch `jjtl-method-failure-error`; work cut at `5f18f7e19`, code committed as
  `32e777031`, docs as `097410e34` (SPEC) and `8746cb976` (decisions)
- Executor model: Anthropic Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads
  the real files.

Tags: **measured** = a run in P-2026-11-05-1530 or P-2026-11-05-2225, with the code version named; **read** = a
file or a doc. The figures of P-2026-11-05-1530 are taken from its handoff (`handoff.md` of that lane), which
recorded them as measured; this session did not rerun the node regression.

## 0. Answer in brief

- A JjEL method the value's type does not have (`"4".log2()`) and a library method that throws now stop a JjTL
  mapping with an error on both parse paths, never a warning with `null` (R-FA-12, extends R-FA-11). Measured on
  `32e777031`: JjTL + JjEL suites 1,250/1,250, only the known import-red `ai-prompt-sanitization.test.ts`.
- JjEL outside JjTL throws exactly what it threw before. The evaluator puts a symbol-keyed mark on the same error
  object instead of throwing a subclass, because the validation overlay prints the constructor name (§2).
- One existing test changed its expectation: `jjtlSourceValues.test.ts`, where `tags.size()` on a bare string now
  stops the run (§3). It is not a transformation fixture.
- The node regression on the real transformations is unchanged: six runs, all SAME, 0 warnings, 0 errors (§4,
  measured in P-2026-11-05-1530 on the final mark design).
- The negative case (`Core.xlen` set to `"4"`) stops with one error naming the rule and the source element (§5).
- Whether the app writes back the target model of a failed run was **not measured** (§6).

## 1. Hypotheses under test

1. *A method failure can be told apart from the other JjEL errors without changing what JjEL throws.* Holds:
   a symbol mark on the same object, guard test green (§2). Measured.
2. *Turning method failures into errors breaks no real transformation.* Holds on the six node runs (§4). Measured
   in P-2026-11-05-1530.
3. *Only JjTL tests that assert a method warning change.* Partly: one test outside `jjtl/`,
   `jjtlSourceValues.test.ts`, asserted the old warning (§3). Measured.
4. *A subclass `JjelMethodError extends JjelEvaluationError` is invisible outside JjTL.* Falsified by reading:
   the validation overlay prints `e.constructor.name` (§2). Read.

## 2. The mark instead of a subclass

The first version threw `JjelMethodError extends JjelEvaluationError`. Dropped (read):
`frontend/src/model/validation/validationEvaluator.ts:300`:

```
detail: `${e?.constructor?.name ?? 'Error'}: ${e?.message ?? String(e)}`,
```

A subclass would change what the validation overlay shows (`JjelMethodError: ...` in place of
`JjelEvaluationError: ...` or `RangeError: ...`), a change of JjEL outside JjTL. The final design marks the
error it already threw, `frontend/src/jjel/evaluator/evaluator.ts:93-99`:

```
const METHOD_FAILURE = Symbol('jjelMethodFailure');
...
    if (e !== null && typeof e === 'object' && !(METHOD_FAILURE in e)) {
        try {
            (e as any)[METHOD_FAILURE] = method;
```

read through the exported `methodFailureOf` (`evaluator.ts:108`). The guard test "JjEL on its own throws what it
threw before" in `frontend/src/jjtl/executor/__tests__/method-failure.test.ts` pins the constructor name
`JjelEvaluationError`, a `RangeError` instance, and `Object.keys(error)` empty (measured green on `32e777031`).

What is marked (read, from the handoff's design): an unknown method on a non-null receiver that is not a model
element (string, number, boolean, array, bit-vector, function); anything thrown by a string, date, number or
bit-vector library method; a bit-vector defect raised by a collection method's own code. Not marked: errors from
lambdas passed to collection methods (the lambda's own), a method on null (`Cannot call method 'x' on null`, a
read on null), an unknown method on a model element (`c.nofeature()`, a missing feature), the text-host
`map`/`join` paths.

The executor turns a marked error into a `JjtlBuiltinError` of kind `'Method'`,
`frontend/src/jjtl/executor/executor.ts:3002-3008`:

```
const method = methodFailureOf(error);
if (method !== undefined) {
    const failed = new JjtlBuiltinError(method, error instanceof Error ? error.message : String(error), 'Method');
    const { currentRuleName, currentInstanceName } = this.context;
    if (currentRuleName) failed.origin = ` (rule '${currentRuleName}', source element '${currentInstanceName ?? '?'}')`;
```

The new `kind` parameter defaults to `'Builtin'` (`executor.ts:381`), so R-FA-11's messages stay byte-identical.
The origin is added because a binding's error prefix (`Failed to map (creation) -> wires`) does not name the rule.

## 3. The changed test

`frontend/src/components/project/__tests__/jjtlSourceValues.test.ts:224-226` (measured green on `32e777031`):

```
expect(result.success).toBe(false);
...
expect(result.errors[0]).toMatch(/^Failed to map \(creation\) -> d: Method 'size' failed in expression at line 9, column \d+ \(rule 'Arbiter -> M', source element 'arb'\): Unknown method 'size' for type String/);
```

Cause (measured in P-2026-11-05-1530, full suite on the subclass design: 2 failed, both this file, both parse
paths): `tags.size()` on the bare string `'fixed'` (count-based serializer, no declared bound) now stops `d`. The
bare element's `size`/`first`/`map` and `size` on null stay warnings, and the test keeps them. Scope expansion:
the file runs the executor but lives outside `jjtl/`.

## 4. Node regression (measured in P-2026-11-05-1530, final mark design)

Sources flattened with P-2026-11-05-1400's `xmi2flat.py`, byte-identical to that lane's `src/*.json`.

| run | elements | result |
|---|---|---|
| rv_mc4 | 2,524/2,524 | SAME |
| rv_pf4 | 2,680/2,680 | SAME |
| rv_mc32 | 2,524/2,524 | SAME |
| core_mc4 | 961/961 | SAME |
| generated control on rv_mc4 | 2,524/2,524 | SAME |
| arbiter3 (source-text path) | 108/108 | SAME |

All byte-equal after normalisation, success true, 0 warnings, 0 errors.

## 5. The negative case (measured in P-2026-11-05-1530)

rv_mc4 with `Core.xlen` set to `"4"`: success false, 0 warnings, 1 error:

```
Failed to map (creation) -> wires: Method 'log2' failed in expression at line 461, column 14 (rule 'Core -> Module', source element 'rv_mc4'): Unknown method 'log2' for type String. Available: ...
```

Before the fix the same input gave a warning and `null`, and the run read as done.

## 6. Not measured: the app write-back of a failed run

The node harness still wrote a Module (modules 1) for the failed run. Whether the app writes the target model of a
failed run back into the project was **not measured**. P-2026-11-05-2225 allowed the measurement only with a
P-2026-11-05-1400 probe in one call at load under 20; the load at the check was 95.50 (measured, `uptime`,
22:30), so the probe was not run.

## 7. Gates on the final code (measured in P-2026-11-05-2225 on `8746cb976`)

- `npm run typecheck`: exit 0.
- JjTL + JjEL suites + `jjtlSourceValues.test.ts`: 51 files passed, 1 failed (known import-red
  `ai-prompt-sanitization.test.ts`), 1,250/1,250 tests.
- `npm run build`: `✓ built in 1m 36s`, only the chunk-size warning.
- Full `npm run test`: 6 files failed / 528 passed; 1 test failed / 14,278 passed / 2 skipped. Three files are
  the known import-reds. The other three are timing under load: `irCollapsedRender.test.ts` and
  `irSelectionRing.test.ts` (`Hook timed out in 10000ms`, Chromium layout) and `tolerant.test.ts:268`
  (`expected 2066.323375 to be less than 1000`, a wall-clock guard). Rerun alone: 3/3 files, 74/74 tests passed.

## 8. Dependencies and risks

- A JjTL transformation that relied on a method returning `null` with a warning now stops. In this tree only
  `jjtlSourceValues.test.ts` did (measured, full suite); projects outside the tree were not searched.
- R-FA-12's boundary for a method on null and on a model element without that feature is provisional
  (decided unattended in P-2026-11-05-1530).

## 9. Open questions

1. Should R-FA-11's builtin errors name the rule and source element too, as R-FA-12's method errors do (left
   unchanged to keep R-FA-11's messages byte-identical)?
2. Should a method called on null, or on a model element without that feature, also stop the mapping (today a
   warning with `null`, provisional)?
3. Does the app write back the target model of a failed run? To measure when load allows.

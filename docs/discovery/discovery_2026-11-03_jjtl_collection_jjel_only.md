# Discovery 2026-11-03 — JjTL: can JjEL parse every `forall` collection?

- Prompt-ID: P-2026-11-03-1016
- Prompt file: `docs/prompts/claude_2026-11-03_1016_prompt_jjtl_collection_jjel_only.md`
- Session: 826168f4-1dda-445b-8da4-92bc6679094d
- Tree: `~/jjodel-w-jjtlonly`, branch `jjtl-collection-jjel-only`, HEAD `9ee5da178`
- Executor model: Claude Opus 5.5
- This report is a set of hypotheses with evidence, not a definitive reference. Read the real files before you act on it.

## Objective

P-2026-11-02-2345 parses a forall collection with the legacy parser first and falls back to JjEL. Sending every collection to JjEL broke AST assertions in `frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts` and the run-time parity of fixture `tests#107` (`range() takes integers, got null`). This report finds the cause and decides whether Phase 2 (JjEL as the only parser of a forall collection when source is present) stays inside the prompt's conditions.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A name resolves differently in the JjEL evaluator under the JjTL context (`nregs` gets a value on one path and not on the other) | **Falsified** (measured): both paths compute `range(null)`, and the message is `got null` on both |
| H2 | The JjEL route builds a different AST for a collection in some fixture | **Falsified** for the parity fixtures (measured): with JjEL-always, all 144 fixtures give the same normalized AST. The only AST differences are wrapper shapes in three unit tests (F4) |
| H3 | The fixture is wrong | **Falsified** (read): `tests#107` reads `range(nregs)` over a synthetic source that has no `nregs`, and both paths agree that the value is `null`. The fixture shows a real difference between the two paths |
| H4 | The legacy route and the JjEL route handle the same evaluation error differently in the executor | **Holds** (measured): the legacy route throws and the JjEL route warns and returns null (F1-F3) |

## Files read (full paths)

- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjtl/parser/parser.ts` (lines 580-750, 800-950)
- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjtl/executor/executor.ts` (lines 1908-1918, 2296-2304, 2790-2892, 3995-4020)
- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjel/evaluator/evaluator.ts` (lines 120-127, read only, out of scope)
- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjtl/__tests__/jjel-path-parity.test.ts` (whole, 251 lines)
- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjtl/__tests__/fixtures/parity-sources.json` (entry `tests#107` only)
- `/Users/alfonso/jjodel-w-jjtlonly/frontend/src/jjtl/parser/__tests__/forall-multivar.test.ts` (lines 40-116)
- `/Users/alfonso/jjodel-w-jjtlonly/docs/log-inbox/maintenance.md` (lines 614-706)

## Probes (measured on HEAD `9ee5da178`; both edits reverted, tree clean afterwards)

- **P1, JjEL-always.** One line added at the top of `forAllCollection` (`parser.ts:670`): `if (true) { return this.parseJjELExpression(stops); }`. Run: `npx vitest run` on the parity test and both `forall-multivar` tests, giving 4 failed and 179 passed (log `.agent-logs/probe-jjel-always-20261103-101352.log`; the 101348 log is an aborted run on an unknown CLI flag). The failures: parity `tests#107`, plus three parser assertions (F4).
- **P2, P1 plus one executor alignment.** The legacy builtin fast path (`executor.ts:2862`) was wrapped in the same warn-and-null catch that the delegation uses. Parity: **145 passed (145)** (`probe-exec-align-20261103-101432.log`). `src/jjtl src/jjel`: 3 tests failed (the three AST assertions of F4), 1045 passed, plus the 7 known files red at import (`window is not defined`) (`probe-exec-align-suite-20261103-101440.log`). P1 is the positive control for P2: the same parity run, without the executor edit, has `tests#107` red, so the probe has signal.

## Findings

**F1 — the fixture** (read). `tests#107`:
```
Core c -> M {
    -> regs {
        forall i in range(nregs) -> Register {
```
`syntheticSource` (`jjel-path-parity.test.ts:158-168`) writes `id, className, __type, name, value, active`, so `nregs` is absent and reads as `null` on both paths.

**F2 — the legacy route throws** (read and measured). On the legacy AST, `range(nregs)` is a `FunctionCall` with an `Identifier` callee. It takes the fast path, which sits **outside** any try. `executor.ts:2859-2863`:
```
                const builtin = ctx.getBuiltin(fnName);
                if (builtin) {
                    const args = fc.arguments.map(arg => this.evaluateExpression(arg, ctx));
                    return builtin.call(args, ctx);
                }
```
The `JjelEvaluationError` (`jjel/evaluator/evaluator.ts:126`, `throw new JjelEvaluationError(\`range() takes integers, got ${got}\`);`) passes through the forall collection evaluation (`executor.ts:2302`, `const collectionValue = this.evaluateExpression(vars[level].collection, ctx);`). The feature mapping catches it (`executor.ts:1912-1916`, `` `Failed to map ${mapping.sourceAttribute || '(creation)'} -> ${mapping.targetAttribute}: ${errorMessage}` ``). Measured legacy result: `success: false`, `errors: ["Failed to map (creation) -> regs: range() takes integers, got null" x2]`, `warnings: []`.

**F3 — the JjEL route warns** (read and measured). A `JjelExpression` wrapper is not a `FunctionCall`, so it goes to the delegation inside the try. `executor.ts:2881-2886`:
```
        } catch (error) {
            // Log and fall back to null on evaluation errors
            ...
            this.warnings.push(`Expression evaluation failed (${expr.type}): ${errorMessage}`);
            return null;
```
Measured JjEL result: `success: true`, `errors: []`, `regs: []` on both targets, and the warnings `Expression evaluation failed (...): range() takes integers, got null` x2.

**F4 — the AST assertions are about shape only** (measured). Under P1 three assertions fail, not the two the 2345 ticket counted:
- `forall-multivar.test.ts:57`, `expect((f.bindings![1].collection as any).name).toBe('ys')`. The node is a `JjelExpression` wrapper, so `.name` is `undefined` and the identifier sits in `.expression`.
- `forall-multivar.test.ts:64`, `expect(f.bindings![2].collection.type).toBe('MemberAccess')`. Received `'JjelExpression'`.
- `forall-multivar.test.ts:101`, the same as :57, in the 2345 block.
After `normalize` (legacy node through `toJjelAst`, wrapper unwrapped) the parity test finds these ASTs equal for every fixture. None of the three is a semantic difference.

**F5 — the cause is in the executor, not the parser** (measured by P2). The two parsers agree once the AST is normalized. What differs is the executor's error contract for one node shape: a JjTL-native `FunctionCall` of a builtin throws, and every other expression warns and returns null. Aligning that one fast path makes `tests#107` and all 144 fixtures equal between the paths, with no other change in `src/jjtl` or `src/jjel`.

## Why Phase 2 was not started

The prompt allows Phase 2 only when "every existing run-time result stays the same" and makes "changing ... the result of any fixture" a stop. Each of the three routes changes `tests#107`:
- **JjEL-only parser, executor unchanged.** On the app path (source present), `tests#107` goes from an error (`success: false`) to a warning with an empty `regs` (`success: true`).
- **JjEL-only parser plus executor alignment (P2).** The same change, and the legacy no-source path changes the same way.
- **Making the JjEL route throw like the legacy route.** This changes every expression the app already delegates to JjEL (`:=`, `where`, conversions, `such that`), which today warns. It is a wider change of results.

The fix is small and lives inside `frontend/src/jjtl/` (one try around `executor.ts:2862`). But it is a semantic choice between "a failing builtin in a collection aborts the feature mapping" and "it warns and yields null". That choice is Alfonso's.

## Dependencies and risks

- The 7 files red at import (`forall-mapping.test.ts` among them) did not run under P2. Any of their assertions that pins the legacy throw goes unmeasured.
- `_evaluateFunctionCallLegacy` (`executor.ts:4001`, `@deprecated`) has the same unguarded `builtin.call`. It was not changed or measured. Whether anything still calls it was not checked in this phase.
- If the warn-and-null contract is chosen, a forall over a failing collection silently creates nothing, and the user sees only a warning. The legacy error is louder.
- Read in passing, not measured: the async evaluation path (`evaluateExpressionAsync`) was not traced for the same fast-path asymmetry.

## Open questions

1. Which contract should a failing builtin call have inside an expression: abort the mapping with an error (legacy today), or warn and yield null (JjEL today and the documented intent of `evaluateExpression`, `executor.ts:2882`)?
2. If warn-and-null: may `tests#107` change its run-time result on both paths (error → warning, `success: false` → `true`), in a lane that touches `executor.ts:2859-2863` and then makes JjEL the only parser of a forall collection?
3. If error: should the JjEL route rethrow builtin failures, given that this changes the result of every expression already delegated to JjEL?
4. Should the three AST assertions in F4 move to the wrapper shape (`.expression.name`, `.expression.type`) in that same lane?

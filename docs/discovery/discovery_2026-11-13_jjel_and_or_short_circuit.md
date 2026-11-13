# Discovery: JjEL `and`/`or` short-circuit, and the hint for `oclIsTypeOf`

- Prompt-ID: P-2026-11-13-1246 (`docs/prompts/claude_2026-11-13_1246_prompt_jjel_and_or_hint.md`), chat C-2026-11-12-1346
- Session: 754b29b2-6a24-45f9-b4ad-17d2bc402f58
- Tree: `~/jjodel-w-jjel-bookfix`, branch `jjel-and-or`, HEAD `d648c4a02`
- Executor: Claude Opus 5.5 (`claude-opus-5-5`), effort xhigh
- Phase 1, read-only on product code. This report is a set of hypotheses with evidence, not a definitive reference: whoever uses it rereads the real files.

## 1. Goal

Make `and`/`or` short-circuit as `frontend/src/jjel/SPEC.md` states, under the prompt's constraint: on every input where the present evaluator returns a value, the result stays the same. Separately, give `oclIsTypeOf` its own lexer hint.

## 2. Hypotheses under test

| # | Hypothesis (from the prompt) | Verdict |
|---|---|---|
| H1 | The evaluator evaluates both operands of `and`/`or`, and `implies` short-circuits | **Holds** (read, §4.1; measured, §5) |
| H2 | The only cells that change are cells where the present evaluator throws | **Partly**. On the value, yes: every cell that returns a value keeps it (measured, §5). But one side channel changes: an absent-identifier *warning* raised by a skipped right operand disappears, and the guard and validation layers turn that warning into a verdict (§5.2) |
| H3 | `and`/`or` on bit-vector operands are bitwise and need both operands | **Falsified**. The *operators* `and`/`or` with a bit-vector operand are a defect, in both the evaluator and the JS target. Bitwise AND/OR is the *method* `x.and(y)` / `x.or(y)` (§4.2) |
| H4 | The JS target states and implements eager evaluation | **Holds** (§4.3) |
| H5 | Something else assumes the eager semantics | **Holds**. The subset checker raises `E-EAGER` (an error) on the null-guard idiom, and four help and README pages tell users to rewrite it (§4.4, §4.7) |
| H6 | A dependency analysis evaluates both operands, so that skipping the right one would miss a re-evaluation | **Falsified**. Every dependency walk found is syntactic over the AST, so it over-approximates and is unaffected (§4.6) |
| H7 | `x.instanceOf.name == "T"` is the exact-class test | **Holds** (measured, §5.3) |
| H8 | `is` has kind-of semantics, so the present hint is right for `oclIsKindOf` | **Falsified on model instances** (measured, §5.3): `o is Sub` and `o is Base` are both `false` on an instance shaped like `buildEvalContext`'s record. The subset checker already states this (`subsetChecker.ts:354`) |

## 3. Files read (full paths, read windows)

- `frontend/src/jjel/evaluator/evaluator.ts`: 40-170, 320-359, 440-640, 1099-1102, 1150-1180, 1350-1370
- `frontend/src/jjel/evaluator/builtins/bitvectors.ts`: 170-225
- `frontend/src/jjel/evaluator/context.ts`: 95-120 (`TypeRegistry.isInstance`)
- `frontend/src/jjel/SPEC.md`: 103-107, 512-518, 589 (cut), 770-782
- `frontend/src/jjel/index.ts`: 80-160
- `frontend/src/jjel/lexer/lexer.ts`: 1-50
- `frontend/src/jjel/__tests__/lexer-own-keys.test.ts`: 45-75; `bitvector.test.ts`: 1-30, 222-239; `evaluator.test.ts`: 44-46 (grep)
- `frontend/src/codegen/target/js/printer.ts`: 25-54, 215-236, 380-479, 690-770 (+ grep of 499, 561)
- `frontend/src/codegen/target/js/__tests__/printer.test.ts`: 90-114 (+ grep of 282, 505, 535)
- `frontend/src/codegen/target/js/__tests__/printer.differential.test.ts`: grep only (161, 192, 266)
- `frontend/scripts/probe/codegen-runner.ts`: 1-12, 118-140
- `frontend/src/model/simulation/subsetChecker.ts`: 1-40, 225-335 (+ grep of 46, 90, 354)
- `frontend/src/model/simulation/guardEvaluator.ts`: 80-115; `__tests__/guardEvaluator.test.ts`: 170-240
- `frontend/src/model/simulation/__tests__/subsetChecker.test.ts`: grep only (6, 33-36, 66-92)
- `frontend/src/model/simulation/__tests__/guardContext.test.ts`: 18-67
- `frontend/src/model/simulation/actionEvaluator.ts`: 140-162; `derivedEvaluator.ts`: 212-240; `bvToSmv.ts`: 1-30 (+ grep of 143)
- `frontend/src/model/validation/validationEvaluator.ts`: 40-64; `frontend/src/model/jjelTriState.ts`: 82-104
- `frontend/src/jjtl/executor/executor.ts`: 3045-3062, 3170-3214, 4570-4646
- `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`: 176-192
- `docs/help/simulation/simulation-guide.md`: 125-131; `docs/help/simulation/simulation-semantics.md`: grep (187, 193)
- `frontend/src/codegen/examples/turnstile/README.md`: 80-84
- `docs/jjtl-jjel-paper.tex`: grep (458, 569-571, 1248-1251), 1240-1253
- `docs/decisions.md`: 1640-1656 (R-SIM-14, R-SIM-15)
- `docs/log-inbox/maintenance.md`: 1027-1072 (the ticket of 2026-11-13, whole)

## 4. Findings (read)

### 4.1 Evaluator

- Both operands are evaluated before the operator is known to need them. `evaluator.ts:456-457`: `const left = this.evaluate(expr.left, ctx);` / `const right = this.evaluate(expr.right, ctx);`. The `+` text-host branch at 447-454 runs before these lines and does not concern `and`/`or`.
- The operator itself, `evaluator.ts:541-545`: `case 'and': return this.isTruthy(left) && this.isTruthy(right);` / `case 'or': return this.isTruthy(left) || this.isTruthy(right);`. The result is always a boolean.
- A bit-vector operand is diverted before the switch, `evaluator.ts:471-476`: `if (isBitVector(left) || isBitVector(right)) { ... return withBitVectorDefects(() => applyBitVectorOperator(op, left, right)); }`.
- `implies` already short-circuits, `evaluator.ts:1158-1164`: `const left = this.evaluate(expr.left, ctx);` / `if (!this.isTruthy(left)) return true;` / `return this.isTruthy(this.evaluate(expr.right, ctx));`.
- Truthiness, `evaluator.ts:1355-1363`: null is false, booleans are themselves, numbers are `!== 0`, strings and arrays are non-empty, `if (isBitVector(value)) throw ...noTruthValue...`, anything else is true. `isTruthy` throws only on a bit-vector.

### 4.2 Bit-vectors: the operators are defects, not bitwise

- `bitvectors.ts:212-216`: `case 'and': case 'or': throw new BitVectorDefect(\`${label} needs booleans, got ${describeOperand(a)} and ${describeOperand(b)}: a bit-vector has no truth value\`);`. The message names **both** operands.
- Bitwise AND/OR is a method: `printer.ts:303-304`: `['and', (x, args) => $bvBitwise('and', x, args, (p, q) => p & q)]`, `['or', ...]`. A `MethodCall` is not affected by this lane.
- SPEC agrees, `SPEC.md:589`: "A vector has no truth value: `not x`, `if x`, `x and y`, `Boolean(x)` and a lambda predicate returning a vector are defects".
- Pinned by `bitvector.test.ts:233-234`: `expect(defect('bits(8, 1) and true')).toMatch(/^'and' needs booleans/);` / `expect(defect('true or bits(8, 1)')).toMatch(/^'or' needs booleans/);`. The second line is a cell that changes (§6).

### 4.3 JavaScript target (the only generator target)

- `ls frontend/src/codegen/target` lists `js` only (measured). There is no other generator target.
- Header contract, `printer.ts:38-39`: "`and` and `or` evaluate both operands (`evaluator.ts`, `evaluateBinary`): they print as calls, whose arguments JavaScript evaluates in full."
- Emission, `printer.ts:723`: ``return `${BINARY[e.operator]}(${p(e.left)}, ${p(e.right)})`;``. For comparison, `implies` prints as JS short-circuit, `printer.ts:731`: ``(!$truthy(${p(e.left)}) || $truthy(${p(e.right)}))``.
- Runtime, `printer.ts:449-451`: `/** Both operands arrive evaluated: JjEL's and/or never short-circuit. */` / `function $and(a, b) { return $isBV(a) || $isBV(b) ? $bvOp('and', a, b) : $truthy(a) && $truthy(b); }` / `function $or(...)` in the same form. `$bvOp('and'|'or')` throws the evaluator's message verbatim (`printer.ts:228-230`).
- A subexpression that does not depend on the step is folded through the evaluator (`printer.ts:709`: `if (!dependsOnStep(e)) return fold(w, e, scope);`), and "A fold that throws prints a throw at its place, so it fires only when the evaluator would reach it" (`printer.ts:25-26`). A Binary that is static as a whole therefore inherits the evaluator's new semantics with no change to the printer. Only the step-dependent path at 723 needs the change.
- Tests that pin the printed form or eager evaluation:
  - `printer.test.ts:98-108`: "Binary `and` evaluates both operands: a throwing right side throws (mutant: short-circuit `&&`)", on `model.[b] > 0 and model.[zzz] > 0`, and the `or` twin on `model.[a] > 0 or model.[zzz] > 0`.
  - `printer.test.ts:505, 535`: the exact strings `'$and($gt($tokens(state, $ID.P), 0), $marked(state, $ID.Q))'` and the `"P"` variant.
  - `printer.test.ts:282`: `['self.requires != null and self.requires.count > model.[a]', 'E-EAGER']`, in a table of refusals.
  - `printer.differential.test.ts:192, 266`: a tally `eagerThrow` (a throw on a source containing ` and ` or ` or `) asserted `toBeGreaterThan(0)` per seed. It may stay above 0 after the fix, because a right operand can still throw when the left operand does not decide. To be measured in Phase 2.
  - `frontend/scripts/probe/codegen-runner.ts:125, 129`: a Playwright probe, not a vitest test, that checks "and with a throwing right operand throws" on `$and(false, $read(...))`. It needs a dev server.

### 4.4 Translatable subset (guards and semantic type class actions): `E-EAGER`

- Header, `subsetChecker.ts:14-24`: "── The eager `and`/`or` (option (a), ruling 1) ── The evaluator evaluates both operands of `and` and `or` ... against `jjel/SPEC.md`. So the null-guard idiom `x != null and x.p` throws when `x` is null ... The evaluator is not changed here (R-SIM-15: its lane); the checker rejects the idiom and gives the rewrite that short-circuits ... The rewrites keep their meaning if `and`/`or` ever short-circuit."
- The check, `subsetChecker.ts:311-314`: `const idiom = eagerIdiom(b); if (idiom) report(w, 'E-EAGER', eagerMessage(w, b, idiom), e);`. Its severity is `'E-EAGER': 'error'` (`:90`), so a guard with the idiom never runs (R-SIM-17, `:9`). The helpers are `eagerIdiom` (`:246-254`), `eagerMessage` (`:256-266`) and `navigatesThrough` (`:236-243`). `E-EAGER` is a member of the code union at `:46`.
- `docs/decisions.md:1651-1653` (R-SIM-15): "`and`/`or` eager ... l'eager è un bug contro `SPEC.md` da correggere nella sua corsia". This lane is that lane.
- After the fix the idiom is correct, and `E-EAGER` would reject valid guards. The check goes with the fix ("they change together or not at all").
- Tests: `subsetChecker.test.ts:66-92` (E-EAGER and-form, or-form, the longer forms, and the negatives), `guardEvaluator.test.ts:213-240` ("the rewrites the checker suggests for the eager idiom (ruling 1)": they call `suggestion()`, which expects an `E-EAGER` diagnostic), `printer.test.ts:282`.
- There is no `.smv` exporter: `bvToSmv.ts:13`: "There is no `.smv` exporter: this is what its lane consumes." `bvToSmv.ts:143-144` prints boolean `and`/`or` as nuXmv `&`/`|`, which are total. Short-circuit does not affect them.

### 4.5 JjTL and JjScript

- JjTL delegates to JjEL through the AST bridge, so it inherits the change. Its legacy binary evaluator, `executor.ts:4587-4641` (`return Boolean(left) && Boolean(right);`), is marked `@deprecated Replaced by JjEL evaluator delegation via astBridge` (`:4585`). `command grep -n "_evaluateBinaryExpressionLegacy" frontend/src/jjtl/executor/executor.ts` returns only its definition at 4587, which is also the positive control. It is dead code, and Rule 9 leaves it untouched.
- An interactive call nested in an expression is not executed: `executor.ts:3049-3056`: "An interactive call nested inside another expression opens no dialog ... The JjEL path fails the whole expression in its evaluator". So `not isDerived or confirm(...)` (`docs/jjtl-jjel-paper.tex:1242`) opens no dialog either way. After the fix, with `isDerived` false, the expression returns `true` where it now fails. That is a throw cell.
- JjScript: `command grep -rn -E "case '(and|or)'|operator === '(and|or)'|..." --include='*.ts'` over `frontend/src` found no hit under `jjscript/`. Positive control: `command grep -rln "evaluate\|Token" frontend/src/jjscript --include='*.ts'` lists files, so the path is searchable.
- `irCompile.ts:182-189` (critical zone, `viewpoint/ir/`) compiles IR predicate groups, not JjEL, and already short-circuits (`parts.every(...)`, `parts.some(...)`). It is not touched.

### 4.6 Dependency analyses (H6)

- `printer.ts:561-567` and `actionEvaluator.ts:156-162` (`dependsOnStep`), and `derivedEvaluator.ts:222-226` (`readsState`), are syntactic walks over every child of the AST: `Object.entries(node).some(([key, child]) => ... dependsOnStep(child))`. They see both operands whether or not the right one is evaluated, so the result is an over-approximation and is unchanged. `derivedEvaluator.ts:236` `foldObject` evaluates the *receiver* of a `.[x]`, not an `and`/`or`.
- No analysis was found that records reads during evaluation. Search: `command grep -rln -E "recordRead|onRead|trackRead|collectDep|dependenc(y|ies)Of|readSet|freeVariables|collectReads"` over `frontend/src`. The four hits are unrelated (a React callback `onRead`, sim role dependencies). Those hits are the positive control that the search ran.

### 4.7 Documents that state a semantics

| File:line | States | After the fix |
|---|---|---|
| `jjel/SPEC.md:106, 516-517, 778` | short-circuit | already right; `:589` "`x and y` ... are defects" needs "when reached" (§6) |
| `codegen/target/js/printer.ts:38-39, 449` | eager | rewrite |
| `model/simulation/subsetChecker.ts:14-24` | eager, E-EAGER | rewrite |
| `docs/help/simulation/simulation-guide.md:129` | "`x != null and x.p`, because JjEL evaluates both sides of `and`. Write `if x != null then x.p else false`" | drop the idiom from the rejected list |
| `docs/help/simulation/simulation-semantics.md:187, 193` | the E-EAGER row and its rewrite | drop. Also, `:193` gives "`x == null implies x.p`" as the rewrite of the `or` form, which is wrong: the checker prints `x != null implies x.p` (`subsetChecker.ts:264`) |
| `codegen/examples/turnstile/README.md:82` | "`and` and `or` evaluate both sides" | rewrite |
| `docs/jjtl-jjel-paper.tex:571` | footnote: "The current implementation (v0.x) evaluates both operands eagerly" | drop the footnote (Q5) |

No other help page states either semantics. Search: `command grep -rn -i -E "both (sides|operands)|eager"` over `docs/help`, `frontend/src/jjel`, `codegen`, `model/simulation` and `jjtl/SPEC.md`. It hit the simulation pages above, which is the positive control.

### 4.8 The hint

- `lexer.ts:19-20`: `oclIsTypeOf: "JjEL uses 'expr is Type', not 'expr.oclIsTypeOf(Type)' (which is OCL syntax).",` and the same for `oclIsKindOf`.
- `lexer-own-keys.test.ts:61-62`: `oclIsTypeOf: "'expr is Type'",` / `oclIsKindOf: "'expr is Type'",`. `parser.test.ts:533-537` checks only `toContain('oclIsTypeOf')`.
- `is` on instances: `subsetChecker.ts:354`: "`is` is false on model instances: write `self.instanceOf == ' + e.targetType + '`." `TypeRegistry.isInstance` (`context.ts:103-120`) matches `__type` or `className` against registered types. On an instance `__type` is `'Object'`, and on an L proxy `className` is the D-name (root CLAUDE.md §3.13, `model/CLAUDE.md`).

## 5. Findings (measured)

Probe `docs/discovery/harness/_tmp_andor_probe.test.ts` (gitignored, `git check-ignore` confirmed), run on HEAD `d648c4a02` with vitest 4.1.4 through `scripts/run-quiet.mjs`, exit 0, output `_tmp_andor_probe.out.tsv`, 144 lines read in full.

### 5.1 The table of `and`/`or` today and under the decision

Operand classes: T `true`, F `false`, N `null`, t `1` (truthy non-boolean), f `""` (falsy non-boolean), BV `bits(8, 1)`, X `nul.x` (throws "Cannot access property 'x' of null"), A `unknownX` (absent identifier: `null` plus a warning). Every result today is a boolean or a throw. "Today" is measured. "Decision" is the rule of §6.1, derived, not run.

**`L and R`.** Cells that change are in bold.

| L \ R | T | F | N | t | f | BV | X | A |
|---|---|---|---|---|---|---|---|---|
| T | true | false | false | true | false | throw BV | throw X | false +w |
| F | false | false | false | false | false | **throw BV → false** | **throw X → false** | **false +w → false** |
| N | false | false | false | false | false | **throw BV → false** | **throw X → false** | **false +w → false** |
| t | true | false | false | true | false | throw BV | throw X | false +w |
| f | false | false | false | false | false | **throw BV → false** | **throw X → false** | **false +w → false** |
| BV | throw BV | throw BV | throw BV | throw BV | throw BV | throw BV | throw X | throw BV |
| X | throw X | … | … | … | … | … | … | throw X |
| A | false +w | false +w | false +w | false +w | false +w | **throw BV → false +w** | **throw X → false +w** | false +w |

**`L or R`** is symmetric: the left decides when it is truthy and not a bit-vector, so the bold cells are rows T and t, in columns BV, X (throw → `true`) and A (`true` +w → `true` with no warning). Rows F, N, f and A evaluate the right operand as they do today. Rows BV and X are unchanged.

The BV row stays identical, message included, only if the right operand is still evaluated when the left is a bit-vector. Today `bits(8, 1) and nul.x` throws X, not BV (probe line 47), because the right operand is evaluated first.

Under the constraint: every cell that returns a value today keeps it. The cells that change are:
- (a) throw → value: the left decides, and the right throws or is a bit-vector.
- (b) the A column, under a deciding left: same value, but the warning is gone.

### 5.2 The warning side channel (H2, partly)

Probe lines 142-144: `compileGuard`/`evaluateGuard` on `false and unknownX` → `{"kind":"defect","reason":"absent-identifier",...}`; `true or unknownX` → the same defect; `false implies unknownX` → `{"kind":"true"}`. The tri-state (`jjelTriState.ts:97-98`, `if (absent) return { kind: 'absent', ... }`) reads warnings before the value. So in the guard layer and in validation, (b) turns a defect into a verdict. `implies` and `if` already behave like the new rule (probe 129, 132: `false implies unknownX` → `true`, `if false then unknownX else false` → `false`, no warning). Row `guardEvaluator.test.ts:190` `['false and unknownX', 'defect:absent-identifier']` pins the old answer. → Q1.

### 5.3 Exact class versus `is`

Probe lines 133-141, on a `Sub` class whose `superTypes` is `[Base]` and an instance `o` of `Sub`, in the shape of `buildEvalContext`'s record (`guardContext.test.ts:28-40`): `o is Sub` → `false`, `o is Base` → `false`, `o.instanceOf.name == "Sub"` → `true`, `o.instanceOf.name == "Base"` → `false`, `o.instanceOf == Sub` → `true`, `o.instanceOf == Base` → `false`. The present hints (probe 140-141) are identical for the two OCL forms. This was measured on the record shape, not on live L proxies: the bench cannot import the joiner. The exact-class test by name holds. `is` is not a kind-of test on instances in this shape.

## 6. Proposed fixes

### 6.1 `and`/`or` (point 1 and 2): one rule, two implementations

Rule: evaluate the left operand. If it is **not** a bit-vector and its truthiness decides (falsy for `and`, truthy for `or`), return `false` or `true` without evaluating the right operand. Otherwise evaluate the right operand and apply the present operator unchanged. Bit-vector rule (point 2): a bit-vector on the left never decides. The right operand is still evaluated and the present defect is thrown, with the same message naming both operands. A bit-vector on the right is reached only when the left does not decide. In the cells where it is not reached (`false and bits(…)`), today's result is a throw, so the constraint holds.

- **Evaluator** (`evaluator.ts`, about 5 lines inserted before 456):
  ```ts
  // `and`/`or` short-circuit (SPEC.md:106): a left operand that decides skips the right one; a bit-vector never decides.
  if (expr.operator === 'and' || expr.operator === 'or') {
      const left = this.evaluate(expr.left, ctx);
      if (!isBitVector(left) && this.isTruthy(left) === (expr.operator === 'or')) return expr.operator === 'or';
      return this.applyBinaryOperator(expr.operator, left, this.evaluate(expr.right, ctx));
  }
  ```
- **JS target** (`printer.ts`): at 723, `and`/`or` print the right operand as a thunk, `` `${BINARY[op]}(${p(e.left)}, () => ${p(e.right)})` ``, and the runtime takes it:
  `function $and(a, b) { if (!$isBV(a) && !$truthy(a)) return false; const r = b(); return $isBV(a) || $isBV(r) ? $bvOp('and', a, r) : $truthy(r); }`, with `$or` symmetric. The comments at 38-39 and 449 are rewritten.
- **Subset checker** (`subsetChecker.ts`): stop raising `E-EAGER` (remove the `report` at 314) and rewrite the header 14-24. Q4 covers what happens to the code name and the helpers.
- **Tests first, red on the present code:**
  - evaluator: `false and nul.x` → `false`, `true or nul.x` → `true`, `false and bits(8,1)` → `false`. Controls: `true and nul.x` and `false or nul.x` still throw, `bits(8,1) and nul.x` still throws X, and `bits(8,1) and true` keeps its message.
  - printer: invert 98-108 to "short-circuit: the right side is not reached when the left decides (mutant: eager)", keeping the throwing control. Update the strings at 505 and 535 to the thunk form, and line 282 (the guard is now printed, not refused).
  - subset checker: the idiom gives no diagnostic. The negatives at 87-92 stay.
  - `guardEvaluator.test.ts:213-240`: the idiom itself now evaluates: `false` on `o_t1`, `true` on `o_t2`, like its old rewrite.
  - `bitvector.test.ts:234`: becomes `false or bits(8, 1)`, which still reaches the vector, plus a new row for `true or bits(8, 1)` → `true`.
- **Negative control:** revert the evaluator's early return alone. The evaluator tests go red, and the differential test goes red where the printer short-circuits and the evaluator does not. Then revert the printer alone, symmetrically.
- **Files:** evaluator.ts, printer.ts, subsetChecker.ts, and tests in four files (evaluator.test.ts or a new short-circuit test file, bitvector.test.ts, printer.test.ts, subsetChecker.test.ts, guardEvaluator.test.ts), plus `scripts/probe/codegen-runner.ts:125-129`. Then docs: SPEC.md (`:589`, "when reached"), the two simulation help pages, the turnstile README and the paper's footnote (Q5). That is more than 5 files, so Rule 19 applies: this list is the confirmation request.
- **Critical zone:** none of these files is in CLAUDE.md §3.1, and none is a §3.2 trigger. `irCompile.ts` is in the zone and is not touched. No visual check is expected: the change is evaluation only, and the guard panel shows the same verdicts except in the cells above.

### 6.2 The hint (point 5)

- `lexer.ts:19` becomes `oclIsTypeOf: "JjEL tests the exact class with 'expr.instanceOf.name == \"Type\"', not 'expr.oclIsTypeOf(Type)' (which is OCL syntax).",`. It is the form `evaluator.ts:617` already teaches ("use 'obj.instanceOf.name'"). `lexer-own-keys.test.ts:61` becomes `oclIsTypeOf: "'expr.instanceOf.name == \"Type\"'",`, which is red on the present code.
- Negative control: restore the old message. Line 61 fails and the `oclIsKindOf` row stays green.
- Files: 2. Critical zone: no.
- Not in the ticket but measured (§5.3): the `oclIsKindOf` hint sends users to `is`, which is `false` on model instances. → Q3.

## 7. Dependencies and risks

- **Users' guards that relied on the throw.** A guard that is a defect today (the guard never fires) can become `false` or `true`. Under R-SIM-17 an arc with a defective guard is never a candidate. So an arc whose guard was `false and <throwing>` stays non-firing (`false`), but an arc with `true or <throwing>` starts to fire. Such a guard was an error before, so the author already saw it as one.
- **Validation rules:** the same logic applies. "Non valutabile" (not evaluable) becomes a verdict in the cells above and in the A column (Q1).
- **Saved projects:** no persisted format changes, so no VersionFixer migration is needed. The evaluator's results on value cells are identical.
- **`docs/decisions.md` R-SIM-15 and "ruling 1"** of P-2026-09-24-1520 describe E-EAGER as interim. Retiring it may deserve a decisions row. That is for the chat, not this lane.
- The differential test's `eagerThrow > 0` assertion may need a new name or threshold once both sides short-circuit (to be measured).

## 8. Open questions

1. Q1: in the A column, under a deciding left (`false and unknownX`), the warning disappears, so the guard and validation layers answer a verdict instead of `absent-identifier`, as `implies` and `if` already do. Accept, and update `guardEvaluator.test.ts:190` to `false`?
2. Q2: `bitvector.test.ts:234` pins `true or bits(8, 1)` as a defect, a cell the decision turns into `true`. Change that row to `false or bits(8, 1)` and add `true or bits(8, 1)` → `true`?
3. Q3: the `oclIsKindOf` hint also sends users to `is`, which is `false` on model instances. Fix it in this lane, or file a ticket?
4. Q4: `E-EAGER`: stop raising it but keep the code in the exported union with `// TODO: cleanup` (Rules 9 and 11), deleting only the helpers the fix orphans, or delete it entirely?
5. Q5: drop the footnote at `docs/jjtl-jjel-paper.tex:571`, which becomes false?
6. Q6: `scripts/probe/codegen-runner.ts:125-129` pins eager in a Playwright probe that needs a dev server. Update it to the thunk form and the new expectation without running it in this lane?

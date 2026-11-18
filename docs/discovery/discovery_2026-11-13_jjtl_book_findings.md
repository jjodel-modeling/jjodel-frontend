# Discovery — JjTL book findings: binding invertibility on the app path (#897), creation blocks on one feature (#898)

- Prompt-ID: P-2026-11-13-1245 (`docs/prompts/claude_2026-11-13_1245_prompt_jjtl_book_findings.md`), chat C-2026-11-12-1346
- Session: 4a1b7812-f65e-4332-b6e2-34975a898547
- Tree: `~/jjodel-w-jjtl-bookfix`, branch `jjtl-book-findings`, HEAD `d648c4a02` (equal to the tip of `alfonso-frontend-jjtl` at start)
- Executor model: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream rereads the real files.

## 1. Goal

Reproduce both tickets of `docs/log-inbox/maintenance.md:1040` and `:1051` on the current trunk, enumerate what
depends on the present behaviour, and propose the smallest fix for each, with the tests to write first.

## 2. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | On the app parse path (source text passed) `name := name` is traced `invertible: false`; on the legacy path `true`. | **Holds** (measured, §4.1) |
| H2 | The cause is the missing `JjelExpression` case in `isExpressionInvertible`. | **Holds** (read, §4.2) |
| H3 | Some consumer of the flag has code that never ran in the app because the flag was always false. | **Falsified** (read, §4.3): no consumer acts on the flag beyond display and counting |
| H4 | Tests pin the present invertibility answer. | **Falsified** (search + positive control, §4.4) |
| H5 | Two creation blocks on one feature overwrite: only the second block's objects remain. | **Holds**, on both parse paths, for every combination of single and `forall` blocks (measured, §5.1) |
| H6 | The overwrite is a deliberate, specified behaviour. | **Falsified** (read, §5.3): kept "as before" in a comment, the SPEC is silent |
| H7 | Accumulation could duplicate elements across re-executions. | **Falsified** (read, §5.4): every run builds fresh targets and a new model |
| H8 | Tests pin the overwrite. | **Falsified** (scan + positive control, §5.5) |

## 3. Files read

- `/Users/alfonso/jjodel-w-jjtl-bookfix/docs/log-inbox/maintenance.md` (1035-1072, the two tickets whole)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/CLAUDE.md`
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/parser/parser.ts` (55-66, 395-432, 860-970, 1764-1767)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/types/ast.ts` (160-272)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjel/types/ast.ts` (20-169)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/executor/executor.ts` (612-640, 925-969, 1140-1196, 1795-1840, 2040-2245, 2400-2456, 3740-3784, 3860-3949, 4270-4339, 4840-4849)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/executor/astBridge.ts` (57-110)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/executor/traceModel.ts` (220-240, 271-335, plus grep hits)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/hooks/useJjtlExecutor.ts` (100-125, 235-250)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/hooks/useJjtlParser.ts` (40-61)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/views/MappingTraceView.tsx` (150-175, 210-226, 350-372)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/analyzer/bidirectionality.ts` (372-402, 474-490)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/SPEC.md` (209-262, 630-665, 802-842)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/__tests__/jjel-path-parity.test.ts` (1-80, assertions 136-250)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/__tests__/fixtures/class2relational.ts` (106-162)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/jjtl/executor/__tests__/nested-creation-into-features.test.ts` (1-90)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/components/project/ProjectEditor.tsx` (1795-1830)
- `/Users/alfonso/jjodel-w-jjtl-bookfix/frontend/src/components/project/nestedMaterialization.ts` (252-330)
- Book, read-only: `/Users/alfonso/jjodel-book-w-book32/author/tools/codegen-fixture/uml2rdbms-as-printed.jjtl`,
  `reviewRuns.test.ts` (1-130, 196-255), `run.sh` (1-30). `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` only by grep (no hit on
  invertibility or on several blocks per feature).

Probe (gitignored, `frontend/scripts/smoke/_tmp_*`): `_tmp_probe_jjtl_book.test.ts`, run with
`npx vitest run --config scripts/smoke/_tmp_vitest.config.ts` from `frontend/`, exit 0; output in `_tmp_probe_out.txt`
(638 lines). Source model and target metamodel copied in shape from the book's `reviewRuns.test.ts` (APP, SIMPLE_RDBMS
with opposites), plus extra string attributes on `Schema` for the #897 cases. Every measurement below is on `d648c4a02`.

## 4. #897 — invertibility on the app parse path

### 4.1 Reproduction (measured)

Rules `Package -> Schema { name := name; label := name + "_s"; pre := "p_" + name; up := name.toUpper(); lit := "x";
cond := if name == "a" then "b" else "c" }` and `Class -> Table where isPersistent { name := name; pkgName := package.name }`:

| binding | app path (source) | legacy path |
|---|---|---|
| `name := name` | `inv=false` | `inv=true inverse=undefined` |
| `label := name + "_s"` | `inv=false` | `inv=true inverse="label.substring(0, label.length - 2)"` |
| `pre := "p_" + name` | `inv=false` | `inv=true inverse="pre.substring(2)"` |
| `up := name.toUpper()` | `inv=false` | `inv=false` |
| `lit := "x"` | `inv=false` | `inv=true inverse=undefined` |
| `cond := if ... then ... else ...` | `inv=false` | `inv=false` |
| `pkgName := package.name` | `inv=false` | `inv=true inverse=undefined` |
| book: `schema := package` | `inv=false` | `inv=true` |
| legacy arrow `name -> name` | `inv=true inverse="name"` | `inv=true inverse="name"` |

The legacy arrow form agrees on both paths because it carries no expression (`executor.ts:2152-2153`).

### 4.2 Cause (read)

- The app parses with the source text: `hooks/useJjtlParser.ts:61` `const parserResult = parse(lexerResult.tokens, source);`.
- With source, `:=` delegates to JjEL: `parser/parser.ts:420-422` `expression = this.source !== undefined ? this.parseJjELExpression([TokenType.NEWLINE, TokenType.RBRACE]) : this.expression();`,
  which returns a wrapper: `parser/parser.ts:906-908` `type: 'JjelExpression', expression: jjelResult.expression,`.
- `executor/executor.ts:2170-2204` switches on `'Identifier'`, `'MemberAccess'`, `'NullSafeMemberAccess'`,
  `'BinaryExpression'`, `'FunctionCall'`, `'Literal'`; `:2202-2203` `default: return false;`. No `'JjelExpression'` case.
- What the wrapper carries: the JjEL AST only (`jjtl/types/ast.ts:269-272` `type: 'JjelExpression'; expression: JjelExpression;`),
  plus `location`; no source text. Its inner nodes share the names `Identifier`, `MemberAccess`, `NullSafeMemberAccess`,
  `Literal` with the legacy ones (`jjel/types/ast.ts:58, 72, 124, 135`), but the binary node is `type: 'Binary'`
  (`jjel/types/ast.ts:95`), not `'BinaryExpression'`, and calls are `MethodCall` / `FunctionCall` with `args`.
  `executor/astBridge.ts:104-108` maps the legacy `'BinaryExpression'` to `type: 'Binary'`. There is no reverse bridge.
- `computeInverseExpression` has the same gap: `executor.ts:2215` tests `inverseExpr.type === 'BinaryExpression'`, so the
  `substring` inverse is never produced on the app path either.

### 4.3 Consumers of the flag (read; grep `invertib` over `frontend/src`, 40 hits, all listed)

| consumer | what it does | change when a property reference becomes `true` |
|---|---|---|
| `executor/traceModel.ts:330-333` | `if (!invertible) { this.link.invertible = false; }` (weakest link, initialised `!hasGuard` at `:162`) | a link whose bindings are all invertible and has no guard becomes `invertible: true`; a link with a creation block stays false (creation bindings are recorded `false`, `executor.ts:2062-2065`) |
| `executor/traceModel.ts:279-290` `getStats()` | counts | its only caller is `executor.ts:858`, whose output feeds a commented-out log (`:863`) |
| `hooks/useJjtlExecutor.ts:114`, `:244` | copies `invertible: b.invertible` into the panel's `TraceEntry` | value copied, no logic |
| `views/MappingTraceView.tsx:162`, `:175`, `:223` | `Invertible` percentage in the stats bar | the percentage rises from 0 % to the real share |
| `views/MappingTraceView.tsx:359-363` | `{binding.invertible && ( <span className="trace-binding-invertible" ...` | the ↔ icon appears on those bindings |
| `inverseExpression` (`traceModel.ts:326`) | stored | **no reader** in `frontend/src` (grep `inverseExpression`: traceModel and SPEC only) |
| `traceModel.ts:231` `reverseResolve` | backward lookup | does not read `invertible` |
| `analyzer/bidirectionality.ts` | static analysis with its own switch, no `'JjelExpression'` case either (`:382-391`) | not a consumer of the flag; exported from `jjtl/index.ts:23`, **no caller** (grep `analyzeBidirectionality`: SPEC, index, the file) |

No backward execution, synchronisation or persistence reads the flag: the trace is not persisted (grep `trace` in
`ProjectEditor.tsx`: three comments about the display, `:1433`, `:2432`, `:2434`). The risk of dormant code waking up
is therefore limited to the panel's display. H3 falsified.

### 4.4 Tests that pin the present answer

`grep -rn invertible frontend/src/jjtl/__tests__` and `executor/__tests__`: no hit. Positive control on the same command
over `frontend/src`: hits `codegen/target/js/__tests__/identifiers.test.ts:102`, so the search reaches test files. No test
pins either answer. `jjel-path-parity.test.ts` compares ASTs and `{ warnings, roots, ... }` of the two paths
(`:216-220` in the read window), not the trace, which is why the divergence passed it.

### 4.5 Proposed fix

`executor/executor.ts` only, about 20 lines:
1. `isExpressionInvertible`: `case 'JjelExpression': return this.isJjelExpressionInvertible((expr as JjelExpressionWrapperAST).expression);`
2. a private `isJjelExpressionInvertible(e: JjelExpression)` mirroring the legacy cases one for one: `Identifier`,
   `MemberAccess`, `NullSafeMemberAccess`, `Literal` → `true`; `Binary` with operator `+` and a `Literal` side → `true`;
   anything else → `false`.
3. `computeInverseExpression`: unwrap a `JjelExpression` and accept `'Binary'` where it accepts `'BinaryExpression'`, so the
   `substring` inverse is the same string on both paths.

Mirroring rather than normalising the legacy side through `toJjelAst` leaves the legacy path's code untouched.

- Tests first: new `frontend/src/jjtl/executor/__tests__/binding-invertibility.test.ts`, each binding of §4.1 run on both
  paths, asserting `invertible` and `inverseExpression` equal on the two paths and equal to the legacy column. Red today on
  `name`, `label`, `pre`, `lit`, `pkgName`, `schema := package` (app path).
- Negative control: `up := name.toUpper()` and `cond := if ...` stay `false` on both paths (they die under a mutation that
  makes the new helper's default `true`); dropping the new `case` turns the test red again.
- Visual check: due. The trace panel shows the ↔ icon and a non-zero `Invertible` percentage after the fix
  (`MappingTraceView.tsx:223`, `:359`).
- Critical zone (CLAUDE.md §3.1, §3.2): not involved. Grammar and exported trace types unchanged.

## 5. #898 — creation blocks on one feature

### 5.1 Reproduction (measured, both parse paths give the same result in every case)

| rule body after `name := name` | `Table.cols` after the run |
|---|---|
| book program as printed (`-> cols { -> Column }` then `-> cols { forall a in attrs -> Column }`) | `["name", "age"]`, key column lost; `columnInstances: []`, no warning, no error |
| single + single (`_tid`, `_k2`) | `"Customer_k2"` (one object, not an array) |
| single + forall | `["name", "age"]` |
| forall + single | `"Customer_tid"` |
| forall + forall | `["name_2", "age_2"]` |
| `-> pkey { -> Column }` twice (single-valued reference) | `pkey = "pk2"` |
| single block, then `cols := attrs` (with `Attribute -> Column`) | `["Customer_tid", "name", "age"]` |
| `cols := attrs`, then single block | `["name", "age", "Customer_tid"]` |
| `cols := attrs` alone | `["name", "age"]` |

So a creation block followed by a binding, and a binding followed by a block, already accumulate in written order; only
block after block overwrites.

### 5.2 Where the block writes (read)

- `executor.ts:2442` (`featureForAll`) `targetInstance[shape.featureName] = this.afterPlacedTargets(targetInstance, shape.featureName, results);`
  and `:2451` (`featureCreation`) the same with `created`.
- `executor.ts:3933-3942`, the doc says it: "Without placed targets the value is `created`, as before: the feature is
  overwritten." The filter keeps only rule targets placed by a binding: `:3936-3939`
  `const claim = this.containerOf.get(el); return !!claim && claim.container === owner && claim.feature === feature;`
  — objects created by an earlier block are not claims, so they are dropped at `:3940` `if (placed.length === 0) return created;`.
- The binding side keeps them: `placeInContainer`, `executor.ts:3889`
  `const created = priorItems.filter(el => el && typeof el === 'object' && el.__nested);` and returns `[...created, ...placed]` (`:3906`).
  That is the asymmetry. Every object created in a body carries `__nested: true` (`executor.ts:2587`; SPEC.md:245-247).

### 5.3 What the specification says (read)

- `SPEC.md:211-213`: "`-> feature { ... }` creates objects and stores them **in that feature of the enclosing target instance**."
- `SPEC.md:649-651`, the only rule on several writers of one feature: "A second binding of the same feature on the same
  owner replaces the first and releases its claims. Objects created into that feature by `-> feature { ... }` are kept in
  source order with the placed targets: created first, then placed, or the reverse."
- Nothing in SPEC.md, README.md, `docs/help/reference/jjtl.md` or the development plan on two creation blocks on one
  feature (grep `overwrit|accumulat|second block|several .*blocks|same feature`, one hit, the line above). The overwrite
  dates from before `01c2a9ccb` (2026-11-02, A1 containment placement), which kept it "as before". H6 falsified.

### 5.4 Cases around it (read)

- Single-valued feature: the executor's feature index carries no multiplicity (`executor.ts:612-618`
  `interface TargetFeatureInfo { name; isReference; typeName?; composition? }`, built at `:945-950`), so the executor cannot
  tell `cols` from `pkey` today. Write-back adds every child of a nested feature with `slot.addObject(...)`, one per child
  (`components/project/nestedMaterialization.ts:281-292`); what the D-layer does with a second child in an upper-bound-1
  containment was not measured here.
- Block then `:=` binding on the same feature: already accumulates (§5.1, through `placeInContainer`).
- Re-execution: `execute()` builds a new executor (`executor.ts:4847` `const executor = new JjtlExecutor(ast);`), every rule
  application creates a fresh target (`:3756`), pass 2 runs each body once per pending pair (`:1822-1836`), and the app
  writes each run into a new model (`ProjectEditor.tsx:1795-1796`, `SetFieldAction.new(project.id, 'models', dModel.id, '+=', true)`).
  Nothing from a previous run is reused through the trace, so accumulation cannot duplicate across runs. H7 falsified.
- Trace: each block's creation binding records only its own objects (`executor.ts:2062-2065`), so the trace panel does not
  change with the fix.

### 5.5 Tests that pin the present behaviour

A brace-aware scan (python from the shell, nothing written) of the 132 parity sources and every template literal of
`frontend/src/jjtl/**/__tests__/**/*.ts` (766 sources) for a rule body with two top-level `-> f {` blocks on one feature:
no hit. Positive control, same scanner on the book program: `Class -> Table where isPersistent { ['cols', 'cols']`. An
earlier line-based scan's seven hits were separate `it` cases (checked by hand in `let-in-nested-bodies.test.ts` and
`forall-multivar.test.ts`). The full suite is the measurement for anything the scan cannot see; it runs in Phase 2.

### 5.6 Proposed fix

`executor/executor.ts`, `afterPlacedTargets`, about 3 lines plus its comment: keep the prior items that are placed here
**or** were created in a body (`el.__nested`), the same rule `placeInContainer` applies at `:3889`, and append the new
objects after them; without such items return `created` as today. One block stays a single object (unchanged); two
blocks give an array in written order.

- Tests first: new `frontend/src/jjtl/executor/__tests__/creation-blocks-accumulate.test.ts`, both parse paths: single +
  single, single + forall (the book's shape, asserting `["Customer_tid", "name", "age"]`), forall + single, forall + forall.
  Red today on all four.
- Regression guards (green before and after): one block alone; block then `cols := attrs`; `cols := attrs` then block;
  `cols := attrs` alone.
- Negative control: restoring the old filter turns the four red.
- Single-valued feature: see question 3; the test for it follows the answer.
- Visual check: due on the generated model (the book's table gains its key column in the model view after a run); the
  trace panel is unchanged.
- Critical zone: not involved. `ProjectEditor.tsx` and `nestedMaterialization.ts` are read, not edited.

## 6. Dependencies and risks

- #897 changes only what the panel shows; no code acts on the flag (§4.3). The weakest-link `link.invertible` rises for
  unguarded rules without creation blocks.
- #898: the `__nested` filter also keeps a `__nested` object that a `:=` binding put into a non-containment feature
  (`executor.ts:4026` returns a `__nested` value as is) if a block on the same feature follows it; `placeInContainer` has the
  same reach today. Exact per-feature bookkeeping would need `noteNestedParent` (`:3922-3926`) to record the feature too.
- Found next to the fix, not in scope, for tickets:
  - a. `computeInverseExpression` gives `undefined` for `name := name` on both paths; `SPEC.md:808` promises "`name := label`".
  - b. Literal: `executor.ts:2198-2200` "Constant values are technically invertible" returns `true`; `SPEC.md:813` says
    "`Literal` expression | No".
  - c. `analyzer/bidirectionality.ts` has no `'JjelExpression'` case (`:382-391`) and no caller.
  - d. `:=` bindings are traced with `expression: undefined` (`executor.ts:2055-2056` computes `expressionSource` only for
    `conversion.expression`); the probe shows `expr=undefined` on every `:=` binding of both paths.

## 7. Open questions

1. #897, Literal: mirror the code (`true`) so both paths agree, leaving the SPEC mismatch (6.b) to a ticket? Recommended: mirror the code.
2. #897, `inverseExpression` of a property reference: keep `undefined` as the legacy `:=` path does (6.a to a ticket)? Recommended: keep, ticket.
3. #898, a second block on a single-valued feature: (a) accumulate everywhere (the executor cannot tell, write-back behaviour unmeasured), or (b) add an optional `many` from `upperBound` to the internal `TargetFeatureInfo`, accumulate when many or unknown, keep the last and warn when known single-valued? Recommended: (b).
4. #898, which prior objects survive: any `__nested` object (as `placeInContainer` does), or only those a block created in this very feature? Recommended: `__nested`, for symmetry with SPEC.md:649-651.
5. File 6.a-6.d as tickets in the Phase 2 log entry? Recommended: yes.

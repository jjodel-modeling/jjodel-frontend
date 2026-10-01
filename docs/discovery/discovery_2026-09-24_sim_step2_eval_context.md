# Discovery — simulation step 2, the evaluation context

**Prompt-ID**: `P-2026-09-24-1520`
**Prompt file**: `docs/prompts/claude_2026-09-24_1520_prompt_sim_step2_eval_context.md`
**Session**: `a0c28f91-318f-4fee-b28d-7be97bf91c30`
**Tree**: `/Users/alfonso/jjodel-sim`, branch `simulation-engine`, HEAD `6cdba58cf` (the prompt commit on
top of `7cb1a716b`). Working tree clean at the start and during the phase.
**Executor**: Anthropic Claude Opus 5.5 (session banner).
**Type**: Phase 1, read-only. No source file modified. This report is a set of hypotheses with
evidence, not a reference: whoever uses it downstream re-reads the real files.
**Probe**: `probe_2026-09-24_sim_step2.ts`, session scratchpad, **56 PASS 0 FAIL, exit 0**. Bundled
with `node_modules/.bin/esbuild <probe> --bundle --platform=node --format=esm` and run with `node`:
it executes the real `jjel/parser`, `jjel/evaluator` and `model/validation/validationEvaluator.ts`
from source (P11). Not committed. Cases are quoted by id (`[2a]`, …); §13 lists them.

---

## 0. Summary

1. **Every 2026-09-13 finding that matters for guards still holds** on this branch, measured
   (§3): two evaluator paths, eager `and`/`or`, silent `null` on a primitive property, keywords
   after a dot. `jjel/` has had no code commit since `2b77263e5` (2026-08-30), before that report.
2. **The builder can sit on `buildEvalContext`'s output, with two cuts and one guard.** Cut `data`
   and `node`: they come from `_lastSelected` and carry live L-proxy values
   (`eval.ts:329-336`, `:939`). Guard the deep-freeze against L proxies: `proxy.ts` has no
   `preventExtensions`/`defineProperty` trap (commented out at `:133-139`), so freezing a proxy would
   reach its target. The ambiguity `Map` is not protected by `Object.freeze` `[6d]`, but no
   expression can reach it.
3. **The tri-state is not importable as it stands.** Only `verdict` is exported; the three
   entrances are inline in the loop of `evaluateValidation` (`validationEvaluator.ts:316-365`).
   Reuse needs the extraction R-SIM-15 already prescribes: a file outside `model/simulation/`.
4. **`node` does not collide in the IR rule context**: the IR predicate language has no
   identifiers at all. `node` is bound elsewhere, in `buildEvalContext` (the selected vertex) and in
   the classic view scope (`selectors.ts:728`). No fallback to `look` is needed for guards.
5. **The rewrite of the eager idiom is not `implies` for the `and` form.** `x != null implies x.p`
   is `true` on null `[2d]`. The `and` form rewrites to `if … then … else false` `[2f]`, the `or`
   form to `implies`. `?.` is unsafe under ordering comparisons: `x?.p < 5` is `true` on null `[2k]`.
6. **Baseline**: typecheck exit 2 with the 14 known errors, vitest 4240 passed and 9 files red at
   import, build exit 0.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The 2026-09-13 findings still hold on this branch | **Holds** | §3, measured `[1a..1e][2a..2m][3a..3e][4a..4i]` |
| H2 | The builder can reuse `buildEvalContext`'s output as is | **Partly** | `data`/`node` must go (`eval.ts:329-336`); the freeze must stop at proxies (`proxy.ts:133-139`); the ambiguity `Map` survives `Object.freeze` `[6d]` |
| H3 | The validation tri-state can be imported as is | **Falsified** | only `verdict` is exported (`validationEvaluator.ts:223`); the entrances are inline (`:316-365`); `firstAbsence`, `describeType` are private (`:231`, `:239`) |
| H4 | `node` already means something in the IR rule context | **Falsified** | `pathExpr.ts:23`, `irTypes.ts:25-53`; `node` is bound only outside the IR (§6) |
| H5 | `model`, `event`, `node` collide with path B builtins | **Falsified** | path B has none `[1b][1e]`; not builtins on path A either `[5e]` |
| H6 | A guard mentioning `node` is caught at run time anyway | **Partly** | unbound `node` gives `undefined-identifier` `[5d]`, but a binder or `with…do` rebinds it `[5f][5h]`: the static check needs scopes |
| H7 | `x != null implies x.p` is the rewrite of `x != null and x.p` | **Falsified** | `true` vs intended `false` on null `[2d]`; `[2f]` is the right one |

---

## 2. Objective and files read

Objective: measure what step 2 builds on, propose the builder, the guard evaluator and the subset
checker, and bring the eager `and`/`or` question to Alfonso with concrete guards (prompt, COSA and
COME 1-8).

Read in full unless a range is given. All under `/Users/alfonso/jjodel-sim/`.

- `CLAUDE.md`; `docs/PROTOCOL.md` (P1-P14 in full, P15 head); `frontend/src/jjel/CLAUDE.md`;
  `frontend/src/model/CLAUDE.md` (headings only: nothing on pure modules)
- `docs/prompts/claude_2026-09-24_1520_prompt_sim_step2_eval_context.md`
- `docs/log-inbox/simulation.md` (the two 2026-09-24 entries); `docs/claude-code-log.md` head
- `docs/decisions.md` 1247-1405 (R-SIM-1..19)
- `docs/discovery/discovery_2026-09-13_jjel_eval_context.md` (642 lines)
- `docs/spec/claude_spec_2026-09-13_computational_model.md` 20-40, 85-175, 219-257 (§2, §4, §5, §9)
- `frontend/src/model/simulation/types.ts`, `step.ts`, `stcFromRoles.ts`, `isKindOf.ts`,
  `objectSlots.ts`; `__tests__/` listed, not read
- `frontend/src/model/validation/validationEvaluator.ts`, `validationContext.ts`;
  `validationTypes.ts` (export lines only); `__tests__/validationEvaluator.test.ts` (grep for
  `detail` and `verdict(`)
- `frontend/src/jjscript/executor/commands/eval.ts` 1-420, 615-725 (`buildEvalContext`,
  `fillInstanceSlots`), function index; `jjscript/executor/utils.ts` 182-205, 295-318
- `frontend/src/jjel/evaluator/evaluator.ts` 60-160, 205-420, 440-560, 836-1050;
  `jjel/evaluator/context.ts` 70-100, 165-200, 240-389; `jjel/evaluator/index.ts`;
  `jjel/types/ast.ts` 1-60, 76-105 and the node shapes (grep); `jjel/types/tokens.ts` 100-126;
  `jjel/lexer/lexer.ts` 385-410; `jjel/parser/parser.ts` (grep `IDENTIFIER`); `jjel/SPEC.md` 103-112
  and grep `short-circuit`
- `frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts`; `ir/irReadCtx.ts` 1-80;
  `ir/irTypes.ts` (grep); `frontend/src/redux/selectors/selectors.ts:728`;
  `frontend/src/joiner/proxy.ts` (grep for traps)

---

## 3. Item 1 — the 2026-09-13 findings, re-measured

| Finding | Today | Evidence (read) | Probe (measured) |
|---|---|---|---|
| Two evaluator paths | **Holds.** The constructor registers `now`, `today`, `date`, `datetime`, `parseDate`, `String`, `Number`, `Boolean`, `Array` on its own context; identifiers check builtins first | `evaluator.ts:76-77` `this.context = context \|\| new EvaluationContext();` / `this.registerGlobalBuiltins();`; `:213` `if (ctx.hasBuiltin(expr.name)) {` | `[1a]` path A `now() != null` true; `[1b]` path B `Function 'now' is not defined`; `[1c][1d]` `date` shadowed on A only; `[1e]` `String` undefined on B |
| `buildEvalContext` snapshot shape | **Holds.** Plain shells and handles, references resolved by pointer to pool handles, extent restricted by `extentModelId`; `data`/`node` copy live L-getter values of the selection | `eval.ts:143` `selectExtentModels<any>(…, opts?.extentModelId)`; `:331` `variables['data'] = wrapSelectedElement(me, …)`; `:335` `variables['node'] = wrapSelectedElement(n, …)`; `:939` `result[key] = v;` | Not measurable: `joiner` does not import under node (`window is not defined`). Read only |
| Eager `and`/`or` | **Holds.** Both operands evaluated, then combined by truthiness | `evaluator.ts:273-274` `const left = this.evaluate(expr.left, ctx);` / `const right = this.evaluate(expr.right, ctx);`; `:343-347` `return this.isTruthy(left) && this.isTruthy(right);` | `[2a][2b]` throw on null; `[2c]` control true; `[2g]` `false and unknownX` is `false` plus a warning; through validation `[8a]` not-evaluable:exception, `[8c]` not-evaluable:absent-identifier |
| Silent `null` on a primitive property | **Holds.** Warnings are pushed only in the object branch; strings, numbers, booleans fall through | `evaluator.ts:548` `return null;` (end of `getProperty`; the warning block is `:517-545`) | `[3a][3b][3e]` null, 0 warnings; `[3d]` control on an object warns; through validation `[8f]` `self.name.foo == null` is **satisfied** (the 09-13 case was deduced, now measured) |
| Keyword after a dot | **Holds.** Lowercase keyword lookup, and only `IDENTIFIER` after `.` | `lexer.ts:397-400` `const textLower = text.toLowerCase();` … `JJEL_KEYWORDS[textLower]`; `parser.ts:342` `consume(JjelTokenType.IDENTIFIER, "Expected property name after '.'")` | `[4a..4c]` parse errors; `[4d]` control; `[4e]` binding `true` unreachable; `[4f]` `event.[x]` does not parse today; `[4g..4i]` `model`, `node`, `event` are not keywords |

Two more, carried because the checker needs them:

- **`is` on an M1 handle is `false`** `[7a]`, control `self.instanceOf == State` `true` `[7b]`. The
  registry reads `__type`/`className` (`context.ts:78-95`).
- **`and`/`or`/`not` convert non-booleans by truthiness** (new observation). `[] and true` is
  `false` `[2h]`, `"a" and 1` is `true` `[2i]`: a non-boolean operand never reaches the
  `non-boolean` entrance, because the operator returns a boolean (`evaluator.ts:343-347`, `:363`).

---

## 4. Item 2 — the builder and the snapshot's lifetime

### 4.1 What the probe settles

- Extra roots need no evaluator change: `self`, `event`, `model`, `node` resolve as plain bindings
  on path B `[5a]`, `event == null` holds with `event: null` `[5b]`, `event.name` throws `[5c]`.
- A deep-frozen cyclic snapshot evaluates and stays unchanged: 7 expressions (`sortBy`, `all`,
  `forall` with filter, `with…do`, identity through a cycle, `instanceOf ==`) `[6b][6c]`; positive
  control `[6a]`, a write on a frozen handle throws `TypeError`.
- `Object.freeze` on a `Map` does not stop `Map.set` `[6d]`; the walk freezes its entries `[6e]`.
- A shallow spread of the frozen record plus roots works `[6f]`.

### 4.2 Proposed signature (file `model/simulation/guardContext.ts`, new)

```ts
/** M, frozen once per run (R-SIM-14). */
export interface SimSnapshot {
    readonly modelId: string;
    /** One EvaluationContext over the frozen globals, without `data`/`node`. */
    readonly base: EvaluationContext;
    /** Pool handle by DObject id: `self` and `event` are looked up here. */
    readonly handleById: ReadonlyMap<string, JjelValue>;
    /** The `model` root: frozen `{ __type: 'Model', id, name }` until `model.[i]` exists. */
    readonly model: JjelValue;
}

/** Once per run: copies the record without `data`/`node`, deep-freezes it (objects, arrays,
 *  Map entries), refuses an L proxy instead of freezing through it. */
export function freezeSnapshot(
    globals: Record<string, JjelValue>,
    model: { id: string; name: string },
): SimSnapshot;

/** Per guard evaluation: `base.child({ self, event, model })`. `null` when the site has no
 *  handle in the snapshot (the guard evaluator reports it as a defect). */
export function buildGuardContext(
    snapshot: SimSnapshot,
    site: { transitionId: string },
    step: { event: string | null },
): EvaluationContext | null;
```

**Lifetime.** `freezeSnapshot` runs once at run start (Reset). The snapshot dies with the run:
R-SIM-13 interrupts a run on any transaction touching the model, so it never outlives a model
change. Per step nothing is rebuilt but the roots: `buildGuardContext` pushes one child scope on
the shared base (`context.ts:330-347`), O(1) per guard instead of the O(|globals|) copy that
validation pays per evaluation (`validationEvaluator.ts:314`). Evaluation writes only to the child
scopes it creates (`evaluator.ts:862-878`, `:916-943`, `:949-961`), never to the base.

**The impure bridge is step 3, not step 2.** Whoever calls `buildEvalContext` imports `joiner`, so
it cannot live in the pure core. At step 3 it goes in `components/editor-v2/sim/` and must pass
`targetMetamodelId` = the model's metamodel: without it `getTargetMetamodel` falls back to the
active metamodel (`utils.ts:308-317`), and a model of another metamodel gets an empty pool
(validation's `minimalExecutionContext` has exactly this gap, `validationContext.ts:108-115`,
acknowledged at `:181-184`).

### 4.3 What `self` is

- **Guard on a transition**: the pool handle of the transition instance, `handleById.get(transitionId)`,
  the same object that navigation from the source reaches, so identity holds. A transition held by
  containment (R-SIM-10) is still an M1 object, so it has a handle.
- **Node-level expression** (entry/exit actions, derived attributes: not in this step): the node's
  handle; there, and only there, `node` is bound, to the node's presentation state (R-SIM-18).
- **`event`**: the pool handle of the current event instance (R-SIM-16: events are M1 instances of
  the same model), `null` for ε.
- **`self`'s features are not flattened into bare names**, unlike validation
  (`validationEvaluator.ts:302` `...(input.globals ?? {}), ...instance.bindings, self: instance.self,`).
  A transition metaclass with a feature called `event` (a trigger reference, a likely name) would
  shadow the root. Q4.

### 4.4 σ at step 3, as a type only

```ts
/** σ as a guard or action will read it (R-SIM-11, R-SIM-18, R-SIM-19). Type only in step 2:
 *  nothing can read it before the `.[x]` operator exists. */
export interface SimStateReader {
    /** Semantic attribute `attr` of `elementId`; `undefined` when not declared. */
    read(elementId: string, attr: string): JjelValue | undefined;
    /** Presentation attribute of the site element only (locality, R-SIM-18). */
    readPresentation(attr: string): JjelValue | undefined;
    /** The derived boolean view of the marking (R-SIM-11). */
    isMarked(elementId: string): boolean;
}
```

At step 3 the step input gains `state: SimStateReader`. How `e.[x]` reaches it (a context field, a
reserved key like `__ambiguousInstances`) belongs to the Expression lane that brings the operator
(R-SIM-17), not here.

---

## 5. Item 3 — the shared tri-state

Today `validationEvaluator.ts` exports `verdict` (`:223`), `Verdict` (`:211`) and
`NotEvaluableReason` (`:150`). The three entrances are the body of the instance loop: the
`try`/`catch` of entrance 1 (`:318-333`), `firstAbsence` for entrance 3 (`:337-348`, function at
`:239-244`, private), `verdict` and entrance 2 (`:350-365`, `describeType` at `:231-235`, private).
Nothing a second caller could call.

**Reuse needs a change there.** Proposal, R-SIM-15 read literally ("escono in un modulo puro sotto
`model/`"):

- **new** `frontend/src/model/jjelTriState.ts`: `verdict`, `Verdict`, `NotEvaluableReason`,
  `describeType` and `firstAbsence` moved verbatim, plus one function:

  ```ts
  export type TriState =
      | { kind: 'verdict'; value: boolean }
      | { kind: 'exception'; error: unknown }
      | { kind: 'absent'; warning: JjelWarning }
      | { kind: 'non-boolean'; value: JjelValue };
  export function evaluateTriState(
      evaluator: JjelEvaluator, expr: JjelExpression, ctx: EvaluationContext,
  ): TriState;   // exception, then absence, then type: the order of :316-365
  ```

- **modified** `frontend/src/model/validation/validationEvaluator.ts`: the loop calls
  `evaluateTriState` and formats `detail` exactly as today (the Italian strings stay in validation;
  the suite asserts on them, `validationEvaluator.test.ts:152`, `:224`, `:238`, `:246`); `verdict`,
  `Verdict`, `NotEvaluableReason` stay exported from it by re-export (rules 2 and 11).

The alternative the prompt names, a helper exported from `validationEvaluator.ts`, touches one file
instead of two but makes simulation import validation, which R-SIM-15 moved away from. Q2. R-SIM-15
also asks for its own commit with the validation tests green before and after; the prompt's Phase 2
says one code commit. Q3.

Search for `validationEvaluator'` importers: `validationContext.ts:64`,
`components/editor-v2/problems/validationToProblems.ts:57` (type `Violation` only), the test. None
is affected by the move.

---

## 6. Item 4 — R-SIM-18 name check

**In the IR rule context of editor v2, `node` means nothing**, and neither do `model` and `event`.
The IR predicate and conditional language has no identifiers: a `PathExpr` step is
`/^(\$[A-Za-z_][A-Za-z0-9_]*|value|values(\[\d+\])?)$/` (`pathExpr.ts:23`), always from the drawn
element, and predicates are ops over paths and literals (`irTypes.ts:25-48`, `{ op: 'marked'; path?: PathExpr }`
at `:47`; conditionals `{ rules: { when: Predicate; then: T }[]; default?: T }` at `:53`). Search:
`command grep -rnE "['\"\`](node|model|event|self|data)['\"\`]" ir/` excluding tests, exit 0, two hits,
both prose in a comment of `IRNodeContent.tsx:321-322`; positive control `command grep -rn "isMarked" ir/irReadCtx.ts`,
three hits. No JjEL import in `ir/` or `authoring/` (`command grep -rln "jjel"`, exit 1).

**Where `node` is bound today, outside the IR:**

- `buildEvalContext`, the selected graph vertex: `eval.ts:335` `if (n) variables['node'] = wrapSelectedElement(n, …);`.
  The guard builder strips it (§4.2).
- The classic view scope: `selectors.ts:728` `tnv.jsScore = tv.jsCondition({data, node, view, constants: tv.constants});`,
  where `node` is the graph element of one vertex. R-SIM-18 already extends views with
  `node.[x]`, but with a different granularity: R-SIM-18's presentation state is "unico per
  elemento e condiviso da tutti i suoi nodi grafici", the classic `node` is one vertex. Not a
  collision for guards; a note for the step that brings `node.[x]` to views.

**No fallback to `look` needed** for step 2.

**`model`, `event` on path B**: no builtins exist on path B `[1b][1e]`, and on path A the nine
builtins do not include them `[5e]`. The only other sources of top-level names are the class shells
(`eval.ts:318` `if (name in variables) continue;`) and bare unique instance names
(`eval.ts:372` `if (!(nm in variables)) variables[nm] = …`). A metaclass or a unique instance named
`event`, `model` or `self` would be a global; the roots sit in the child scope and win, as `self`
wins in validation. The instance becomes unreachable bare, reachable qualified (`Class.name`).

---

## 7. Item 5 — eager `and`/`or`: the question for Alfonso

The idiom, on a transition with an optional reference `requires` to a door:

- `self.requires != null and self.requires.locked` — intended `false` when unset. Today it throws
  `[2a]`: the guard is a **defect**, the arc leaves the candidates. Same candidacy as `false`, but
  reported as a broken guard.
- `self.requires == null or self.requires.locked` — intended `true` when unset. Today it throws
  `[2b]`: the arc **leaves the candidates when it should fire**. This is the form that changes
  behaviour.

**Option (a) — the checker rejects the idiom, the evaluator stays.** Authoring error on a binary
`and`/`or` whose left operand null-tests a path `P` and whose right operand navigates `P.`:

- `and` form: "`and` evaluates both sides. Write `if self.requires != null then self.requires.locked else false`."
  Measured `[2f]` `false` on null.
- `or` form: "Write `self.requires != null implies self.requires.locked`." Measured `[2d]` `true` on null.
- Not suggested: `implies` for the `and` form (`true` on null, H7), and `?.` under an ordering
  comparison (`self.requires?.level < 5` is `true` on null `[2k]`; `== true` is safe `[2e][2j]`).

Validation, JjTL, JjScript and the console are untouched. Residual: an unguarded navigation that
does not match the pattern still throws at run time and is a defect, visible in the label. The
rewritten guards stay correct if (b) lands later.

**Option (b) — `and`/`or` short-circuit in the evaluator.** The guard as written works: `false` and
`true` on null. The change is in `jjel/evaluator/evaluator.ts:273-274`, excluded from this step, and
it moves results elsewhere: validation `[8a]` goes from not-evaluable:exception to **violated**, and
`[8c]` `false and unknownX` from not-evaluable:absent-identifier to **violated** (the warning is
never emitted); JjTL, JjScript and the console return values where they threw. It is what
`jjel/SPEC.md:103`, `:416` and `:640` promise, and R-SIM-15 already calls the eager behaviour "un
bug contro `SPEC.md` da correggere nella sua corsia".

**Recommendation: (a) for step 2, as a blocking authoring error**, with (b) left to its own lane as
R-SIM-15 says; when (b) lands the rule is retired and the rewritten guards keep their meaning.
Not decided here. Q1.

---

## 8. Item 6 — the subset checker

A walker over the 21 kinds of `JjelExpression` (`ast.ts:24-45`) with a scope stack for binders
(lambda parameters, `forall`/`exists` variables). No walker exists outside `jjel/`: the only full
switch is the evaluator's (`command grep -rln "case 'WithDo'\|case 'NullSafeMethodCall'" src`, one
hit, `jjel/evaluator/evaluator.ts`). The switch ends in a `never` check, so the future `.[x]` node
(R-SIM-18) is a compile error until handled. No receiver types in step 2: method diagnostics go by
name only where the name is unambiguous (§7.2 of the 09-13 report).

Severity: **E** = error, the guard is a defect and never runs; **W** = warning, it runs;
**T** = not translatable, it runs and simulates, and marks the guard not verifiable for the `.smv`
exporter.

| Construct | Verdict | Code | Why |
|---|---|---|---|
| Literal `true`/`false`, integer, string, `null` | accept | | constants; `event == null` is the ε test |
| Literal decimal | T | `T-DECIMAL` | reals (09-13 §7.1) |
| Identifier `self`, `event`, `model` | accept | | roots (R-SIM-18) |
| Identifier `node`, free | E | `E-NODE` | R-SIM-18: semantics does not depend on presentation |
| Identifier `data`, free | E | `E-DATA` | not a root; the builder strips it (§4.2) |
| Other free identifier | accept | | class or instance name on M; unknown ones hit the absent entrance at run time |
| Binder named `self`, `event`, `model`, `node` | E | `E-SHADOW` | rebinds a root `[5f]`; R-SIM-18 reserves `node`, `model` (Q5) |
| `.p`, `[i]`, `?.p` | accept | | navigation on M |
| `?.p` as operand of `<`, `<=`, `>`, `>=` | W | `W-NULLCMP` | `null < n` is `true` `[2k]` |
| `==`, `!=`, `<`, `>`, `<=`, `>=`, `+`, `-`, `*`, unary `-`, `??`, `implies`, `exists` | accept | | bounded integers, enums, finite disjunction |
| `/`, `%` | T | `T-DIV`, `T-MOD` | doubles; `%` sign vs nuXmv `mod` unmeasured |
| `and`/`or` with the eager idiom (§7) | E | `E-EAGER` | pending Q1 |
| `and`/`or`/`not` on a syntactically non-boolean operand (number, string, array, object literal, `forall`) | W | `W-TRUTHY` | converted silently `[2h][2i]` |
| `if … then …` without `else` | E | `E-NOELSE` | `null` on the false branch: a latent non-boolean defect (Q9) |
| `is Type` | W | `W-IS` | `false` on M1 handles `[7a]` (R-SIM-15: "li segnala il checker") |
| Guard whose top node is `forall` | E | `E-FORALL` | returns an array: never a verdict (R-VAL-13); suggest `.all(x => …)` |
| `forall` as an operand (`.size`, `.isEmpty`, …) | accept | | finite over M |
| Lambda as a method argument | accept | | quantifier-shaped builtins |
| Lambda elsewhere, object literal | E | `E-VALUE` | a function or record is never a verdict |
| `with … do` | E | `E-WITH` | dynamic scope: a feature named `node` rebinds the root `[5h]`, so no root analysis is sound (Q6) |
| `name(args)` | E | `E-CALL` | path B has no builtins `[1b][1e]`; only a caller-bound function could answer, and the builder binds none |
| Method in a (c)-only group: date methods, `sqrt`, `pow`, `exp`, `log`, `log10`, `log2`, trig, `toFixed`, `toPrecision`, `toExponential`, `toHex`, `toBinary`, `toOctal`, `avg`, `sortBy`, `sortByDescending`, `groupBy`, `distinctBy`, `take`, `skip`, `takeWhile`, `skipWhile`, `join`, `matches` | T | `T-METHOD` | 09-13 §7.2 |
| Method shared by strings and collections (`reverse`, `indexOf`, `contains`, `isEmpty`, `length`, …) | accept | | needs receiver types, deferred |
| `.[x]`, `?.[` | parse error today `[4f]` | | rule arrives with the Expression lane |

**Where each diagnostic goes.**

- **Authoring** (static, on the text): parse errors and every E, W, T above. In step 2 they are
  data only: nothing reaches the UI.
- **Run start** (once per run, on frozen M): the checker runs again over every guard, since guards
  are M data and M is frozen; an E-guard is a defect for the whole run and its arc is never a
  candidate (R-SIM-17). Wired at step 3.
- **Run time** (per evaluation, the shared tri-state): exception, absent identifier or property,
  non-boolean result, and a site without a handle. The arc leaves the candidates (spec §5.2).
- **Uncaught anywhere**: the silent primitive property `[3c][8f]`. The run-time entrances cannot
  see it and the checker needs receiver types. Declared, not solved.
- **Model conformance** (a malformed `Expression` value in the problems registry, R-SIM-17): the
  Expression type lane, not step 2.

---

## 9. Item 7 — test plan, one mutation per rule

All tests run the public functions (P11); snapshots are synthetic records shaped like
`buildEvalContext`'s output, because `buildEvalContext` does not import under node. That gap is
declared, not filled with a source-text test (CLAUDE.md §5).

| Rule | Test | Mutation that must turn it red |
|---|---|---|
| Frozen snapshot rejects writes | after `freezeSnapshot`, a write to a nested handle field and a `push` on a pool array throw `TypeError`, values unchanged; Map entries frozen | shallow `Object.freeze` instead of the walk; walk skipping Map values |
| `data`/`node` never reach a guard | globals with `data`, `node`: `data == null` in a guard is an absent-identifier defect | not stripping |
| The freeze stops at a proxy | a stand-in object with `__isProxy: true` in the globals: `freezeSnapshot` refuses and the object stays unfrozen (stand-in declared: a real L proxy does not load under node) | dropping the check |
| Path B has no `now()` | `now() != null` and `String(1) == "1"` are exception defects (`not defined`) | `new JjelEvaluator(ctx)` (path A): `now()` answers |
| `node` in a guard is rejected | `self.x == 1 and node == null` gives `E-NODE`; `exists node in [1] \| node == 1` gives `E-SHADOW`; `exists y in [1] \| y == 1` is clean; at run time an unbound `node` is an absent defect | removing `node` from the forbidden roots; binding `node` in `buildGuardContext` |
| Tri-state equals validation's | ≥ 8 rows (`[2a]`, `[2m]` `TypeError`, `[2g]`, `[8d]`, `true`, `false`, `[2e]`, `[8f]`), each through `evaluateValidation` (one rule, one instance, empty bindings) and `evaluateGuard`; satisfied→true, violated→false, not-evaluable(r)→defect(r) | truthiness instead of `verdict`; ignoring warnings; catching only `JjelEvaluationError`; type checked before absence |
| Absent guard is `true` (R-SIM-17) | `undefined`, `null`, `''`, `'  '` give `true` | removing the early return (`''` becomes a parse defect) |
| Malformed guard is not `true` | `'a = 1'` is a parse-error defect | mapping parse errors to absent |
| Roots win over globals | a global named `event` or `model` is hidden by the root | roots put under the globals |
| `self` is the pool handle | `buildGuardContext(...).get('self') === handleById.get(id)` | a copy of the handle (JjEL `==` is structural and would not see it, so the test asserts in TS) |
| Parity oracle | `step.test.ts` byte-identical; `step.ts`, `types.ts` untouched | — |

Mutations on the extracted `jjelTriState.ts` are killed, or not, by `validationEvaluator.test.ts`:
to be measured in Phase 2 on the extraction commit.

---

## 10. Item 8 — baseline gates at `6cdba58cf`

| Gate | Result |
|---|---|
| `npm run typecheck` | exit 2, **14** errors: `api/data.ts` ×3 (868 ×2, 1126), `common/Dummy.ts:46`, `EditorV2.tsx:3114`, `Measurable.tsx` ×6 (271, 287, 289, 292, 298, 302), `Jodie/ChatMessages.tsx:271`, `project/ProjectEditor.tsx:226`, `pages/components/Dashboard.tsx:586`. Count on the complete output |
| `npx vitest run` (vitest 4.1.4) | exit 1: **4240 passed, 0 failed**; 175 files passed, **9 red at import**, `ReferenceError: window is not defined` (two groups): `jjscript/__tests__/context-binding`, seven `jjtl/__tests__/*` (`abstract-target`, `ai-prompt-sanitization`, `circular-refs`, `executor-bridge`, `executor-llayer`, `forall-mapping`, `source-alias`), `utils/__tests__/UDComparator` |
| `npm run build` | exit 0, the known chunk-size warning, 42.7 s |

As expected by the prompt: 14 errors, 4240 tests.

---

## 11. Risks

| # | Risk | Evidence | Severity |
|---|---|---|---|
| R1 | Deep-freezing through an L proxy reaches its target: no `preventExtensions`/`defineProperty` trap | `proxy.ts:133-139` (commented out), read not measured | high if the guard is missing |
| R2 | `and`/`or`/`not` hide non-boolean operands | `[2h][2i]` | medium; `W-TRUTHY` covers literals only |
| R3 | Silent primitive property reaches a verdict | `[3c][8f]` | medium; no entrance sees it |
| R4 | `?.` under an ordering comparison is `true` on null | `[2k]` | medium; `W-NULLCMP` |
| R5 | The step 3 bridge picks the active metamodel without `targetMetamodelId` | `utils.ts:308-317` | medium, step 3 |
| R6 | Guards and validation rules differ on the same text (no flattened features) | `validationEvaluator.ts:302` | low, by design (Q4) |
| R7 | Tri-state extraction breaks validation silently | the suite asserts on `detail` (`validationEvaluator.test.ts:152-246`) | low with suite green before and after |
| R8 | The snapshot shape is read, not measured | `joiner` does not load under node | low; synthetic fixtures mirror `eval.ts` |

---

## 12. Open questions for Alfonso

1. **Eager `and`/`or`**: option (a), the checker's blocking `E-EAGER` with the rewrites of §7, or
   option (b), the evaluator change in its own lane first? Recommended (a).
2. Shared tri-state: new `model/jjelTriState.ts` (R-SIM-15 literal, recommended) or a helper
   exported from `validationEvaluator.ts` (the prompt's wording)?
3. Commits: R-SIM-15 wants the extraction in its own commit, the prompt says one code commit.
   Recommended two code commits (A extraction, B simulation) plus the docs commit.
4. Guards do not flatten `self`'s features into bare names, unlike validation rules. Confirm.
5. `E-SHADOW` on binders named `self` and `event` too, beyond R-SIM-18's `node` and `model`. Confirm.
6. `with … do` rejected in guards (`E-WITH`). Confirm.
7. Non-translatable constructs are T (simulable, not verifiable), not errors. Confirm.
8. `model` in step 2 is a frozen `{ __type: 'Model', id, name }`, placeholder for `model.[i]`. Confirm.
9. `if` without `else` in a guard is an error (`E-NOELSE`), not a warning. Confirm.
10. Commit types: `refactor:` for A, `feat:` for B (P6 wants them named)?

---

## 13. Proposed Phase 2 diff

**Commit A — `refactor:`, the tri-state out of validation (R-SIM-15).**

- `frontend/src/model/jjelTriState.ts` — **new**. `verdict`, `Verdict`, `NotEvaluableReason`,
  `describeType`, `firstAbsence` moved verbatim; `TriState` and `evaluateTriState` (§5). Imports JjEL
  only.
- `frontend/src/model/validation/validationEvaluator.ts` — **modified**. The loop body of
  `:316-365` calls `evaluateTriState` and keeps its `detail` strings; re-exports the three names.
  Outputs byte-identical. Gate: `npx vitest run src/model/validation` green before and after, full
  suite 4240.

**Commit B — `feat:`, step 2 of the plan.**

- `frontend/src/model/simulation/guardContext.ts` — **new**. `SimSnapshot`, `freezeSnapshot`,
  `buildGuardContext`, `SimStateReader` (type only) (§4).
- `frontend/src/model/simulation/guardEvaluator.ts` — **new**. `compileGuard(source)` (absent →
  `true` without parsing; parse and subset check once per run) and `evaluateGuard(compiled, ctx)` →
  `{ kind: 'true' } | { kind: 'false' } | { kind: 'defect'; reason; detail }`, through
  `evaluateTriState` on path B.
- `frontend/src/model/simulation/subsetChecker.ts` — **new**. `checkGuardSubset(expr)` →
  `SubsetDiagnostic[]` (`code`, `severity`, `message`, `location`), §8.
- `frontend/src/model/simulation/__tests__/guardContext.test.ts`, `guardEvaluator.test.ts`,
  `subsetChecker.test.ts` — **new**. §9, mutations reported in the commit body.

Not touched: `step.ts`, `types.ts`, `stcFromRoles.ts`, `step.test.ts` (byte-identical), the panel,
`jjel/*`, `eval.ts`. The identifiers above are unused today (`command grep -rnw` over `src` and
`scripts`, 0 hits each; control `buildEvalContext`, 29 hits).

**8 files across the two code commits**, above the five of rule 19, and 2 of them outside
`model/simulation/` (`model/jjelTriState.ts`, `model/validation/validationEvaluator.ts`): declared
here for the GO.

**Commit C — docs.** The entry in `docs/log-inbox/simulation.md`, the Status flip of the prompt
file.

---

## 14. The probe

`probe_2026-09-24_sim_step2.ts` (scratchpad). `run(src, vars, path)` builds
`new EvaluationContext(vars)` and evaluates with `new JjelEvaluator(ctx)` (path A) or
`new JjelEvaluator()` (path B), recording value plus warnings, the thrown class, or the parse error.
Group 8 runs `evaluateValidation` itself on one rule and one instance.

Positive controls: `[2c]` (the throw of `[2a]` comes from null navigation), `[3d]` (the warning
channel works on objects), `[4d]` (a non-keyword after a dot parses), `[6a]` (the freeze is active),
`[7b]` (the handle is well formed).

Groups: 1 paths (5), 2 eager and truthiness (13), 3 primitive property (5), 4 lexer (9), 5 roots (8),
6 freeze (6), 7 `is` (2), 8 validation tri-state (8). **56 PASS 0 FAIL, exit 0.** The 2026-09-13
probe is not recoverable: `find /private/tmp/claude-501 -name "probe_2026-09-13_jjel*"` returned
nothing, exit 0, while the same `find` with `probe_*.mts` listed seven other probes.

---

## 15. State of the tree

No source file modified. Written by this phase: this report only, committed alone with pathspec.

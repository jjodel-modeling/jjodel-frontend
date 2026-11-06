# Discovery 2026-11-02 — JjEL `forall` / `exists` over several variables

- Prompt-ID: P-2026-11-02-1330 (`docs/prompts/claude_2026-11-02_1330_prompt_jjel_forall_multivar.md`)
- Session: lane session of C-2026-11-02-1319 (session id not exposed to the agent)
- Tree: `~/jjodel-w-jjelmultivar`, branch `jjel-forall-multivar`, HEAD `17beac16c`
- Executor model: Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it re-reads the real files.

## Objective

Decide how the JjEL parser implements R-FA-1..6 (`docs/decisions.md:7100-7122`) and what every reader of the
JjEL AST does with the result, before writing tests and code.

## Hypotheses under test

1. **R-FA-6 as written (`forall` → nested `flatMap` over a one-variable `forall`) has the semantics of R-FA-1..3.**
   Partly falsified. Same values on arrays; on a non-array first collection `flatMap` throws where `forall` gives `[]`
   (measured, §F1). The variant `(forall x in A : <inner>).flatten()` matches on every probed case (§F1).
2. **`exists` → nested `exists` has the semantics of R-FA-4.** Holds (measured, §F1: non-array inner gives `false`).
3. **No new AST node and no exported type change are needed.** Holds for the `flatten` variant: it uses `ForAll`,
   `MethodCall`, `ObjectLiteral`, `Identifier`, `Exists` only (read, `frontend/src/jjel/types/ast.ts:24-46`).
4. **Every AST reader is correct by construction.** Holds for values (they all see ordinary nodes); one reader loses
   a static diagnostic (§F4), one reader never offered bound variables at all (§F6).

## Files read (full paths, this tree, HEAD 17beac16c)

- `frontend/src/jjel/parser/parser.ts:743-817` (`forAll`, `exists`)
- `frontend/src/jjel/types/ast.ts:1-360` (window; `ForAllExpr` 262-268, `ExistsExpr` 278-283, `ObjectLiteralExpr` 352-360)
- `frontend/src/jjel/evaluator/evaluator.ts:833-912, 960-1157` (method dispatch, lambda, forall/exists)
- `frontend/src/jjel/evaluator/builtins/collections.ts:70-100, 365-380` (`flatMap`, `flatten`)
- `frontend/src/codegen/target/js/printer.ts:640-789`
- `frontend/src/codegen/engine/generatorFile.ts:140-209`
- `frontend/src/codegen/engine/origin.ts:10-30, 335-370`
- `frontend/src/codegen/ui/templateCompletion.ts:150-239`
- `frontend/src/model/simulation/subsetChecker.ts:60-75, 90-405`
- `frontend/src/model/simulation/derivedEvaluator.ts:225-331`
- `frontend/src/model/simulation/guardEvaluator.ts:110-111` (grep window)
- `frontend/src/jjel/autocomplete/context.ts` (whole, 150 lines), `providers/identifier.ts` (whole, 133 lines), `index.ts:1-40`
- `frontend/src/jjscript/parser/parser.ts:120-204`
- `frontend/src/model/validation/validationEvaluator.ts:97-101` (imports)
- `docs/decisions.md:7100-7122`

## Findings

### F1 — probe of the hand desugaring (measured, vitest, HEAD 17beac16c, probe file removed afterwards)

`S = [{name:'a',p:1,children:[{name:'a1'}]}, {name:'b',p:2,children:[]}]`, `N = null`, `O = {name:'o'}`, `Str = 'xy'`, outer `x = 'outer'`.

| expression | result |
|---|---|
| `S.flatMap(x => forall y in S : x.name + y.name)` | `["aa","ab","ba","bb"]` |
| `(forall x in S : (forall y in S : x.name + y.name)).flatten()` | `["aa","ab","ba","bb"]` |
| `S.flatMap(x => forall y in S such that x.p < y.p : x.name + y.name)` | `["ab"]` |
| `N.flatMap(x => …)` | THROWS `Cannot call method 'flatMap' on null` |
| `O.flatMap(x => …)` | THROWS `Unknown method 'flatMap' for type Object` |
| `Str.flatMap(x => …)` | THROWS `Unknown method 'flatMap' for type String. …` |
| `(forall x in N : (forall y in S : y.name)).flatten()` | `[]` |
| `(forall x in S : (forall y in N : y.name)).flatten()` | `[]` |
| `forall y in Str : y` / `forall y in O : y` | `[]` / `[]` |
| `[S.flatMap(x => forall y in [1] : x.name), x]` | `[["a","b"],"outer"]` (lambda shadows, outer restored) |
| `(forall x in S : (forall z in x.children : x.name + z.name)).flatten()` | `["aa1"]` (dependent) |
| `(forall x in S : (forall y in S : {x: x, y: y})).flatten().map(p => p.x.name + p.y.name)` | `["aa","ab","ba","bb"]` |
| `(forall x in S : (forall y in S : [x.p, y.p])).flatten()` | `[[1,1],[1,2],[2,1],[2,2]]` (array projection kept: one level) |
| `exists x in S such that exists y in S such that x != y and x.name == y.name` | `false` |
| `exists x in S such that exists y in N such that true` | `false` |

Cause of the throw, read: `evaluator.ts:836-840` «`if (obj === null) { throw new JjelEvaluationError(\`Cannot call method '${expr.method}' on null\``»;
`forall` instead: `evaluator.ts:1114` «`if (!Array.isArray(collection)) return [];`». `flatten` is one level:
`collections.ts:369` «`flatten() - Flatten nested arrays one level`», and on an array the dispatch always reaches the
builtin (`evaluator.ts:896-903`).

**Consequence**: desugar `forall x in A, <rest>` to `(forall x in A : <rest desugared>).flatten()`. The outer `forall`
gives `[]` on a non-array, each inner one gives an array, `flatten` removes exactly one level. This deviates from the
wording of R-FA-6 (`flatMap`) for the reason R-FA-6 itself names («a non-array collection must give `[]`»), and needs
no new node.

### F2 — same-collection spelling re-evaluates the collection per outer element (read)

`forall x, y in S` desugars to two `forall` over the same `S`; the inner one is evaluated with `x` bound
(`evaluator.ts:1118` «`const childCtx = ctx.child({ [expr.variable]: item });`»). If `S` itself reads a name of its own
list (`forall x, y in x.children`, outer `x`), the inner copy reads the new `x`: not the OCL meaning, where `S` is read
once. Proposed: a parse error when the collection of a multi-name binding reads one of the names that binding
introduces before the last.

### F3 — JS printer and codegen (read)

Non-step expressions fold through the evaluator (`printer.ts:709` «`if (!dependsOnStep(e)) return fold(w, e, scope);`»),
so the generated JavaScript agrees with the evaluator by construction. A step-dependent multi-variable `forall` is a
`MethodCall` `flatten` and is refused (`printer.ts:680-682` «`'${e.method}' is called on a value known only in the step: it has no translation.`»),
as the one-variable form is (`printer.ts:748-749`). Nested `exists` prints through `exists()` with a child scope per
element (`printer.ts:657-667`). `generatorFile.ts:178-188` binds `ForAll`/`Exists` variables for free-call detection:
each desugared variable is a `ForAll` variable, so bound. `origin.ts:348` records lambda bodies as parts
(`evaluatePart`): the `flatten` shape adds no lambda, so no new parts; the `flatMap` shape would have.

### F4 — simulator guards (read)

`subsetChecker.ts:399-401` «`if (expr.type === 'ForAll') { report(w, 'E-FORALL', …`» fires on the top node only. A
multi-variable `forall` is a top `MethodCall`, so E-FORALL would not fire; the run still rejects it:
`guardEvaluator.ts:111` «`the guard returned ${describeType(out.value)}, not a boolean`». Not silent, but the static
message is lost. Small local fix: E-FORALL also on a top `flatten()` whose object is a `ForAll`. Variables are bound for
the walk (`subsetChecker.ts:357-367`) and checked against the reserved roots (`checkBinder`), per variable.
`derivedEvaluator.ts:306-317` gives each `ForAll`/`Exists` variable the elements of its folded collection; with the
`flatMap` shape the lambda variable would get them too (`:290-303`), so both shapes work there.

### F5 — JjScript `eval`, validation (read)

`jjscript/parser/parser.ts:136-146`: a line starting with `forall` without `do` is delegated whole to JjEL
(«`const args: EvalArgs = { command: 'eval', expression: this.remainingInput() };`»); `exists` too (`:151-155`).
`isForAllDoCommand` decides by the presence of `do`, not by the binding list. Validation parses with
`parseExpression` and evaluates with `JjelEvaluator` (`validationEvaluator.ts:97-98`): inherits.

### F6 — completion (read)

`templateCompletion.ts:189-196` binds `node.variable` of each `ForAll`/`Exists` with the class of `C.instances`:
every desugared variable keeps its class (the `flatMap` shape would give the lambda variable `''`). The JjEL
autocomplete offers **no bound variable at all**, for one variable either: `providers/identifier.ts` (read whole)
suggests the Level 1 collections, `data`/`node` and class names only. `context.ts:87-126` recognises
`forall <id> in` only, not `forall x, y in` nor `, y in`. No test imports the JjEL autocomplete: `command grep -rln
"getJjelSuggestions\|detectJjelContext" src --include='*.test.ts'` gives 0 files; positive control, same command with
`jjelEval`, gives 10.

## Dependencies and risks

- Shared AST nodes: `forall x, y in S` puts the same `S` object at two places in the tree. Readers keyed by node
  (`origin.ts` assemblies) see one key evaluated more than once, as an inner collection already is per iteration.
- Location of synthesized nodes: one range for the whole expression; diagnostics on a desugared `ForAll` point at it.
- JjScript and JjTL parsers are other lanes (P-2026-11-02-1332, -1331).

## Open questions

1. Accept the `flatten` desugaring in place of the literal `flatMap` of R-FA-6 (F1)? Recommended: yes, R-FA-6 amended.
2. Accept the parse error of F2 for a self-reading collection in the same-collection spelling?
3. `f(forall x in S, y)` is a parse error today (no filter, no projection): "stays two arguments" can only mean the
   comma is never taken as a binding there; the two-argument forms need a filter or a projection. Confirm.
4. E-FORALL on the desugared shape in `subsetChecker.ts` (F4), as a small local consumer fix: accept?

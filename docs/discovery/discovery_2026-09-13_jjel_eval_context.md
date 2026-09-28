# Discovery — the JjEL evaluator and its context, measured against the simulation spec

**Date**: 2026-09-13
**Prompt**: `docs/prompts/claude_2026-09-13_0100_prompt_discovery_jjel_eval_context.md`
**Type**: Phase 1, read-only. No source file modified.
**Lane**: simulation engine, computational model. Parallel to
`claude_2026-09-13_0030_prompt_discovery_simulation_engine.md`; `frontend/src/components/editor-v2/sim/`
was not read (§2).
**Feeds**: `docs/spec/claude_spec_2026-09-13_computational_model.md` §5.1, §5.4, §9 step 2, §11 second point.
**Probe**: `probe_2026-09-13_jjel_eval_context.mts`, **79 PASS 0 FAIL**, run with
`cd frontend && npx tsx <scratchpad>/probe_2026-09-13_jjel_eval_context.mts`. It stays in the session
scratchpad and is **not committed**: the prompt allows exactly two written files. Its cases are
quoted by id (`[1a]`, `[3a]`, …) and reproduced in §12.

---

## 0. Summary

1. **One evaluator, two ways of calling it, and they differ.** `new JjelEvaluator(ctx)` registers
   the global builtins (`now`, `today`, `date`, `datetime`, `parseDate`, `String`, `Number`,
   `Boolean`, `Array`) **on the context it is given**. Validation and JjTL build the evaluator
   without a context and evaluate on a separate one: `now()` is undefined there `[1b]`, while a
   binding called `date` is shadowed by the builtin on the other path `[1c]`.
2. **`buildEvalContext` builds a detached snapshot.** Class shells, instance handles and
   collections are plain JS objects, not proxies. The exception is `data` and `node`, which copy
   the live L-proxy values of the selected element. The console and JjTL hand the evaluator live
   L proxies throughout.
3. **In practice a read-only exposure already exists, but nothing enforces it.** The language has
   no assignment `[6c][6d]`. The evaluator never writes to a value: 12 expressions on a deep-frozen
   context all evaluate and the snapshot is unchanged `[6a*][6b]`. JS functions in the context are
   never invoked `[6e][6f][6g]`. A write is possible only through a `JjelFunction` that the caller
   binds `[6h][6i]`. The boundary to enforce is the context builder, not the proxy layer and not
   the evaluator.
4. **Extra roots need no evaluator change.** The context is an open record
   (`Record<string, JjelValue>` into `Map` scopes), and `state` and `event` work as they are
   `[7a..7g]`.
5. **"JjEL throws on absent" is only partly true.** It throws on `.` or a method call over `null`
   `[2b]`. It returns a silent `null` for an absent identifier `[2a]` or property `[2d]`, and for a
   property of a number or string it returns `null` **with no warning at all** `[2e][2f]`.
   Collection methods throw a JS `TypeError`, not `JjelEvaluationError`, when given a non-function
   `[2k]`.
6. **`and`/`or` do not short-circuit** `[3a][3b]`, contrary to `SPEC.md:103,416`. This was already
   recorded on 2026-06-26 and is still true. The guard idiom `x != null and x.p` throws. `implies`,
   `if`, `?.` and `??` do short-circuit `[3c..3e]`.
7. **The translatable subset** is decided by what an expression depends on, not by construct alone:
   almost everything folds to a constant over the frozen model M, and the census in §7 classifies
   each construct by what happens when it reads σ or e. Doubles, strings, dates and collections
   as values stored in state are out.
8. **Lexer**: 18 of 18 JjEL keywords break after a dot `[8a..8c]`. A binding named
   `true`/`false`/`null` is **silently** unreachable `[8e][8f]`. JjEL and JjTL do not share a
   reserved-word list.

---

## 1. Hypotheses this discovery falsifies

| # | Hypothesis | Outcome |
|---|---|---|
| H1 | There is one entry point and every caller gets the same builtins | **FALSIFIED**: two paths, builtins differ (§3.2) |
| H2 | Every caller reuses `buildEvalContext` | **FALSIFIED**: Console and JjTL build their own (§3.3) |
| H3 | The model reaches JjEL as L proxies, so an expression could write through a setter | **FALSIFIED for `buildEvalContext`** (plain snapshot), **true for Console/JjTL and for `data`/`node`**, but no JJEL construct invokes a setter or a JS function (§4.3) |
| H4 | Adding `state`/`event` roots requires touching the evaluator | **FALSIFIED** (§5) |
| H5 | JjEL throws on absent values | **PARTLY**: throws on null navigation only (§6) |
| H6 | `and`/`or` short-circuit as `SPEC.md` says | **FALSIFIED** (§6.2) |
| H7 | `utils/edgeExpressionEval.ts` is a JjEL caller | **FALSIFIED**: it is a separate path evaluator with no JjEL import (§3.3) |

---

## 2. Files read

All paths relative to `/Users/alfonso/jjodel/`. Read in full unless a range is given.

- `frontend/src/jjel/index.ts`, `jjel/evaluator/index.ts`, `jjel/evaluator/evaluator.ts` (1114),
  `jjel/evaluator/context.ts` (446), `jjel/evaluator/modelContext.ts` (83)
- `frontend/src/jjel/lexer/lexer.ts` (501), `jjel/parser/parser.ts` (862), `jjel/types/tokens.ts`,
  `jjel/types/ast.ts`
- `frontend/src/jjel/evaluator/builtins/index.ts`, `collections.ts`, `strings.ts`, `numbers.ts`,
  `dates.ts` (the middle of `dates.ts`, `addYears` to `endOfYear`, was truncated in the tool
  output; the registry `getDateMethod` at its end was read in full); `jjel/metadata/builtins.ts`;
  `jjel/SPEC.md`
- `frontend/src/jjscript/executor/commands/eval.ts` (1070); `let.ts` 100-140; `forall.ts` 20-80;
  `jjscript/types.ts` 488-508 (`ExecutionContext`), 585-590 (`KEYWORDS`)
- `frontend/src/model/validation/validationEvaluator.ts` (381), `validationContext.ts` (223)
- `frontend/src/components/Jodie/jodieJjelContext.ts` (77); `components/editors/Console.tsx` 50-100,
  668-692 and the `_context` grep hits
- `frontend/src/utils/edgeExpressionEval.ts` (103); `joiner/ExecuteOnRead.ts` 110-150
- `frontend/src/jjtl/executor/executor.ts` 129-200, 365-385, 855-885, 2274-2345, 2350-2372,
  2420-2440, 3240-3275; `jjtl/lexer/lexer.ts` 300-394; `jjtl/types/tokens.ts` 105-136
- `frontend/src/joiner/proxy.ts` 330-640 (get/set/has traps)
- `docs/spec/claude_spec_2026-09-13_computational_model.md`;
  `docs/spec/claude_spec_2026-09-08_user_defined_validation.md` 180-260, 355-380
- `docs/discovery/discovery_2026-09-08_keyword_dopo_il_punto.md`; `docs/discovery/2026-06-26_jjel_status.md` 15-40, 100-112

**Not read**: `frontend/src/components/editor-v2/sim/`. It was touched only by
`command grep -rln "jjel" src/components/editor-v2/sim`: **zero hits, exit 1**. The same pattern
run as an import search over all of `frontend/src` returned 30 lines, so the search has signal.

---

## 3. Entry points and callers (COSA 1)

### 3.1 The functions that evaluate

| Function | Signature (verbatim) | Site |
|---|---|---|
| `jjelEval` | `export function jjelEval(source: string, variables?: Record<string, JjelValue>): JjelValue` | `jjel/index.ts:74-90` |
| `jjelEvalWithDiagnostics` | `export function jjelEvalWithDiagnostics(source: string, variables?: Record<string, JjelValue>,): JjelEvalResult` | `jjel/index.ts:124-140` |
| `evaluate` | `export function evaluate(expr: JjelExpression, context?: EvaluationContext \| Record<string, JjelValue>): JjelValue` | `evaluator.ts:1100-1114` |
| `JjelEvaluator.evaluate` | `evaluate(expr: JjelExpression, ctx?: EvaluationContext): JjelValue` | `evaluator.ts:148` |
| `JjelEvaluator.evaluateWithDiagnostics` | `evaluateWithDiagnostics(expr: JjelExpression, ctx?: EvaluationContext,): { value: JjelValue; warnings: JjelWarning[] }` | `evaluator.ts:129-143` |
| `parseExpression` | `export function parseExpression(source: string): JjelParserResult` | `parser.ts:845-862` |

`jjelEval` and `jjelEvalWithDiagnostics` **throw** a plain `Error('JjEL parse error: …')` on a parse
error (`index.ts:80-86`, `:130-135`); `parseExpression` returns the errors instead (`parser.ts:849-858`,
`:67-77`).

### 3.2 Two paths, different builtins

`constructor(context?: EvaluationContext)` does `this.context = context || new EvaluationContext();
this.registerGlobalBuiltins();` (`evaluator.ts:75-78`), and the registration writes into
`this.context` (`:83-116`). `evaluateIdentifier` checks `ctx.hasBuiltin` **before** the scopes
(`:213-219`), and `evaluateFunctionCall` checks `ctx.getBuiltin` first (`:706-707`).

- **Path A**: the evaluator is built on the context it evaluates, as in `jjelEval` (`index.ts:88-89`
  via `evaluate`, `evaluator.ts:1112`) and `jjelEvalWithDiagnostics` (`index.ts:137-139`). The nine
  builtins are present `[1a]`, and a binding with the same name is hidden: `date == 5` with
  `{date: 5}` is `false` `[1c]`.
- **Path B**: `new JjelEvaluator()` evaluating on another `EvaluationContext`, as in
  `validationEvaluator.ts:296,314,319` and the JjTL executor (`executor.ts:377`, `:871`,
  `:2434`). Here `now()` gives `Function 'now' is not defined` `[1b]` and `{date: 5}` is reachable
  `[1d]`. JjTL registers its own builtins on its context (`resolve` `:918`, `resolveAll` `:930`,
  helpers `:890`) and, deduced from the same code, has no date constructors on that path. JjTL
  also uses path A at `:2362` (`jjelEval(path, this.contextToRecord(ctx))`).

### 3.3 Callers

Found with `command grep -rn -E "\b(jjelEval|jjelEvalWithDiagnostics|JjelEvaluator|evaluateWithDiagnostics|new EvaluationContext)\b"`
and an import search for `jjel` over `frontend/src`, excluding `__tests__`.

| Caller | Call | Context built by |
|---|---|---|
| `jjscript/executor/commands/eval.ts:40` | `jjelEval(expression, variables)` | `buildEvalContext(context)` `:32`, then `context.variables` overlaid `:35-37` |
| `jjscript/executor/commands/let.ts:132` | `jjelEval(expr, variables)` | `buildEvalContext(context)` `:125`, overlay `:128-130` |
| `jjscript/executor/commands/forall.ts:38`, `:57` | `jjelEval(...)` | `buildEvalContext(context)` `:32` plus overlay; per element `{...evalVars, [args.variable]: element}` |
| `components/Jodie/jodieJjelContext.ts:67` | `jjelEvalWithDiagnostics(expression, variables)` | `buildEvalContext(ctx)` `:39` on a synthesized `ExecutionContext`; `variables.self = variables.data` `:44-46` |
| `model/validation/validationEvaluator.ts:319` | `evaluator.evaluateWithDiagnostics(c.expr, ctx)` | globals from `validationContext.ts:159` `buildEvalContext(minimalExecutionContext(), { extentModelId: modelid })`; per instance `{ ...(input.globals ?? {}), ...instance.bindings, self: instance.self }` `validationEvaluator.ts:301-303` |
| `components/editors/Console.tsx:690` | `jjelEval(code, jjelContext)` | **its own**: `flattenProxyContext(dataObj)` (`:62`) + `extractAttributeValues` `:684` + `{ ...flattened, ...this._context }` `:685`; `_context` from a view's `evalContext` `:813` or props `:816`, `:867` |
| `jjtl/executor/executor.ts:2434`, `:2768` | `this.jjelEvaluator.evaluate(...)` | **its own**: `createInstanceContext` `:2274-2334`, a child of `new EvaluationContext(bindings)` `:871` |
| `jjtl/executor/executor.ts:2362` | `jjelEval(path, this.contextToRecord(ctx))` | **its own**: `contextToRecord` `:3249` |
| `jjtl/parser/parser.ts:51` | `parseExpression as parseJjEL` | parse only |

User-facing entry points one level up: JjScript `eval` `jjscript/executor/executor.ts:169`; Jodie
`components/Jodie/console/providers/jjelProvider.ts:19`; validation `components/editor-v2/Toolbar.tsx:723`
(`runValidationOnModel`); JjTL `jjtl/executor/executor.ts:3328`.

**`utils/edgeExpressionEval.ts` is not a JjEL caller.** The file has no import at all. It
evaluates a path by `expr.split('.')` (`parseSegments`) with one numeric bracket form, and returns
only LObject-shaped values. Its one importer is `joiner/ExecuteOnRead.ts:17`, which publishes it
as `windoww.evalEdgeExpression` (`:129`). The 2026-06-26 status report, row A2, already lists it
as a separate engine.

### 3.4 The shared builder

`buildEvalContext` exists on this branch (`jjscript/executor/commands/eval.ts:122-125`, re-exported
at `jjscript/index.ts:52`):

```ts
export function buildEvalContext(
    context: ExecutionContext,
    opts?: BuildEvalContextOptions,
): Record<string, JjelValue> {
```

and its restriction parameter (`:92-110`):

```ts
export interface BuildEvalContextOptions {
    ...
    extentModelId?: string;
}
```

`extentModelId` narrows the **pool** (`selectExtentModels(... , opts?.extentModelId)` `:143`), and so
everything derived from it: `instances`, the shells' `instances`/`allInstances`/`instanceCount`,
qualified and bare instance names, and the ambiguity map. Classes and name resolution stay
project-wide (`:99-101`). `ExecutionContext` (`jjscript/types.ts:488-508`) has
`projectId`, `modelId?`, `targetMetamodelId?`, `level?`, `selectedElement?`, `history`,
`variables: Map<string, any>`.

Reusers: `eval.ts`, `let.ts`, `forall.ts`, `jodieJjelContext.ts`, `validationContext.ts`. Own
builders: `Console.tsx`, JjTL.

---

## 4. Context shape (COSA 2)

### 4.1 The context object

`EvaluationContext` (`context.ts:244-389`) holds:

- `private scopes: Map<string, JjelValue>[]`
- `private builtins: Map<string, JjelFunction>`
- `readonly typeRegistry`, `diagnostics?`, `ambiguousInstances?`

The constructor `(initialBindings?: Record<string, JjelValue>, typeRegistry?: TypeRegistry)` copies
every binding into the first scope, and lifts the reserved key `AMBIGUOUS_INSTANCES_KEY =
'__ambiguousInstances'` into `ambiguousInstances` (`:271-276`, `:177`). `child()` copies the scope
array, **shares the builtins map by reference** (`:333`), shares the diagnostics sink and pushes a
scope (`:330-347`). Values are typed as
`null | boolean | number | string | JjelValue[] | JjelObject | JjelFunction` (`:13-20`), where
`JjelObject` is an open record `{ [key: string]: JjelValue }` (`:25-27`).

### 4.2 What `buildEvalContext` puts in it

The roots are `classes` (`:157`), `instances` (`:185`), `attributes` (`:274`), `references` (`:284`),
`packages` (`:288`), `enumerations` (`:292`), `metamodel` (`:295`) and `project` (`:303`). On top
of those it binds:

- every class shell under its name, skipped on collision (`:315-320`);
- `data` and `node` (`:325-339`);
- every instance whose name is unique across the pool (`:371-372`), skipped on collision; the
  names that are not unique go to the ambiguity map (`:373-405`).

A shell carries `instances`, `allInstances`, `instanceCount` and the qualified instance-by-name
bindings (`:243-263`). A handle carries `id`, `__type: 'Object'`, `name`, `instanceOf`/`instanceof`
(the shared shell), the feature slots (`fillInstanceSlots` `:615-707`) and `parent` (`:704-706`).

**How the model is exposed.** The pieces behave differently:

| Piece | Form | Evidence |
|---|---|---|
| class shells, attributes, references, packages, enums | plain objects | `shallowClassToJjelValue` `:419-484` and siblings |
| instance handles | plain objects: attribute values via the L getter then **collapsed** (enum literal to its name, `:628-644`); references resolved **by pointer** to pool handles (`:663-680`) | `fillInstanceSlots` |
| `data`, `node` | a plain wrapper whose fields are **the values of the L getters**, i.e. live L proxies and arrays of them | `wrapSelectedElement` `:933-941`: `result[key] = v` for every `Reflect.ownKeys(me)` key |
| Console context | live L proxies | `Console.tsx:62-81`, `:685` |
| JjTL context | live L proxies: `shallowToJjelValue` "passes objects and arrays through as-is" | `executor.ts:163-170`, `:2275-2289` |

That handles contain no proxy is deduced from the code, not measured: `joiner` does not import
under the node test bench (logged 2026-09-12, A2).

### 4.3 Can an expression write?

**Through the language: no.** `JjelExpression` has 21 node kinds (`ast.ts:24-45`) and none of them
assigns. A single `=` is a lexer error (`lexer.ts:120-133`): `a = 1` and `state.count = 3` both give
`Unexpected '='. Did you mean '==' or '=>'?` `[6c][6d]`.

**Through the evaluator: no.** The only `set` calls are on child *contexts*: lambda parameters
(`evaluator.ts:872`), `with…do` (`:956`) and the per-item scope of `forall`/`exists` (`:922`,
`:939`). Nothing writes to a value. The builtins that reorder copy first (`sortBy`,
`sortByDescending`, `reverse`: `[...array]` in `collections.ts`).

Measured with a positive control. The context was deep-frozen and ESM strict mode was active, so
a JS write on it throws `TypeError` `[6p]`. On it, 12 expressions (sortBy, reverse,
sortByDescending, groupBy, distinctBy, flatMap, array `+`, forall with a filter, `with…do`, an
object literal, map/sum, take/skip) all returned values `[6a0..6a11]`, and the JSON snapshot was
unchanged afterwards `[6b]`.

**Through a JS function in the context: no.**

- A `FunctionCall` resolves only a builtin or a bound `JjelFunction`, otherwise it throws
  (`evaluator.ts:703-718`) `[6e]`.
- A method call on an object calls only a `JjelFunction`. With zero arguments it **returns the
  function uncalled** (`:771-783`) `[6f]`; with arguments it throws `Unknown method` `[6g]`.

So the closures that L getters return (`get_addClass`, `get_addValue`, …) cannot be called from JjEL.

**Through a caller-bound `JjelFunction`: yes.** `tick() + tick()` evaluated to `3`, and the
counter written by the bound function read `2` `[6h][6i]`. JjTL binds `resolve`, `resolveAll` and
the helpers this way.

**Through a proxy getter that writes when read.** A heuristic census covered 429 `get_*` bodies
in `model/logicWrapper/LModelElement.tsx` and `joiner/classes.ts` (brace matching plus a regex for
`SetFieldAction|SetRootFieldAction|DeleteElementAction|TRANSACTION|.new(`). **15** bodies contain a
write primitive. All 15 were opened:

- 14 return a closure, so the write happens only when it is called: `get_addAnnotation` :548,
  `get_addPackage` :1935, `get_addClass` :1947 and :4148, `get_addEnumerator` :1960 and :4558,
  `get_addParameter` :2465, `get_addAttribute` :3259, `get_addReference` :3278,
  `get_addOperation` :3286, `get_addLiteral` :4857, `get_t2m` :6292 and :6933, `get_addValue` :6630;
- 1 is a false positive: `get_ecore` :326 sits inside a comment block.

**No getter in those two files writes when read.** Other L files (view, graph, joiner remainder)
were not scanned. This only matters when a live L proxy reaches the context.

### 4.4 Does a read-only exposure already exist, and where?

- **Evaluator boundary**: nothing to add. It is already write-free (§4.3).
- **Context-builder boundary**: this is where read-only holds today, *de facto*. The snapshot is
  detached for everything `buildEvalContext` builds, except `data`/`node`. It is not *enforced*:
  nothing freezes it, and a change to the builder could put a proxy in. Deep-freezing is compatible
  with the evaluator `[6a*][6b]`.
- **Proxy layer**: a flag exists, at the wrong granularity. When `d.__readonly` is set, the set
  trap returns `true` without writing (`proxy.ts:459-465`). The flag is **persisted** state:
  `set_readOnly` uses `SetFieldAction.new(c.data, '__readonly', val)` and recurses on children and
  annotations (`joiner/classes.ts:2102-2106`). It is per element, global to every reader including
  the editor, silent, and it does not cover a direct `SetFieldAction`. It cannot serve as a
  per-evaluation boundary.

Deduced, for spec §11: **the boundary is the context builder.** A simulation builder that reuses the
`buildEvalContext` snapshot and does not bind `data`/`node` gets a read-only M with no change to
the evaluator or the proxies. "Writes admitted on state only" is not a context property at all.
JjEL never writes; per spec §5.3 the engine assigns the *value* of an expression to a state
component. So that boundary sits in the engine.

---

## 5. Additional roots (COSA 3)

The context is **an open record fed into a `Map`**, not a closure and not a typed structure:
`initialBindings?: Record<string, JjelValue>` (`context.ts:264`), stored as
`Map<string, JjelValue>` (`:245`, `:304-309`). A caller adds `state` and `event` by adding keys.
Measured with `{ self, state: { marking, count }, event }`:

| Expression | Result | Case |
|---|---|---|
| `state.marking.S1 and event == "go" and state.count < 3 and self.name == "T1"` | `true`, 0 warnings | `[7a]` |
| `event == null` with `event: null` | `true` | `[7b]` |
| `event.id` with `event: null` | throws `Cannot access property 'id' of null` | `[7c]` |
| `state.marking.S9` (absent key) | `null` + `property-not-found:S9` | `[7d]` |
| `forall state in [1,2] : state` | `[1,2]`: an inner binder shadows the root | `[7e]` |
| `state.marking["S1"]` | `true` | `[7f]` |
| `exists n in ns \| state.marking[n]` | `true` | `[7g]` |

Constraints on the names of new roots, all measured or read:

- **Builtins win over bindings on path A** `[1c]`: `now`, `today`, `date`, `datetime`, `parseDate`,
  `String`, `Number`, `Boolean`, `Array` (`evaluator.ts:85`, `:94-115`), plus whatever JjTL registers.
- **Keywords** cannot follow a dot `[8a..8c]`, and `true`/`false`/`null` cannot be binding names `[8e][8f]` (§8).
- **Collisions with class and instance names.** `buildEvalContext` protects its own keys by skipping
  (`eval.ts:318`, `:372`). A caller that overlays afterwards overwrites silently, as `eval.ts:35-37`
  and `validationEvaluator.ts:301-303` do. Under the validation merge order a *feature* of the
  instance named `state` or `event` would shadow the root. Deduced, not measured.
- **Reserved key** `__ambiguousInstances` (`context.ts:177`).

---

## 6. Errors and the tri-state (COSA 4)

### 6.1 Behaviour by situation

| Situation | Behaviour | Site | Case |
|---|---|---|---|
| unknown identifier | `null`; warning only when a diagnostics sink is set | `evaluator.ts:222-265` | `[2a]` |
| absent property on an object | `null` + `property-not-found` | `:517-545` | `[2d]` `[7d]` |
| **absent property on a number/string** | **`null`, no warning** | `:548` | `[2e]` `[2f]` |
| non-accessor property on an array | throws `JjelEvaluationError` | `:436-440` | `[2g]` |
| `.p` on `null` | throws `JjelEvaluationError` | `:383-388` | `[2b]` |
| `.m()` on `null` | throws `JjelEvaluationError` | `:676-681` | (code) |
| `?.p` on `null` | `null` | `:396-398` | `[2c]` |
| unknown method | throws `JjelEvaluationError` | `:785-797` | `[2h]` |
| unknown function | throws `JjelEvaluationError` | `:714-717` | `[2i]` |
| `className` on an instance | throws `JjelEvaluationError` | `:409-418` | `[2j]` |
| non-function where a lambda is expected | **throws `TypeError`** (`predicate.call is not a function`) | `collections.ts` `all` | `[2k]` |
| arithmetic type mismatch | `null` (`1 - "a"`, `true + 1`) | `:294-307` | `[4b]` `[4c]` |
| `+` with a string | concatenation (`"1a"`) | `:283-285` | `[4a]` |
| comparison of mixed types | string comparison, returns a boolean | `:1050-1051` | `[4d]` |
| `null < 1` | `true` | `:1035` | `[4e]` |
| `/`, `%` by zero | `null` | `:311`, `:318` | `[4g]` |
| `/` on integers | a double (`7 / 2` is `3.5`) | `:309-313` | `[4f]` |
| `forall` / `exists` over a non-array | `[]` / `false`, silent | `:918`, `:936` | `[2m]` `[2l]` |
| `if` without `else`, false | `null` | `:838` | `[2n]` |
| parse error | `jjelEval` throws a plain `Error`; `parseExpression` returns errors | `index.ts:80-86` | `[6c]` |

### 6.2 `and` / `or` are eager

`evaluateBinary` evaluates **both** operands (`evaluator.ts:273-274`) before `applyBinaryOperator`
combines them (`:343-347`). So `a != null and a.b == 1` with `a: null` throws `[3a]`, and so does
`a == null or a.b == 1` `[3b]`; the control with `a: {b: 1}` gives `true` `[3f]`. `implies`
short-circuits (`:904-910`) `[3c]`, as do `if` `[3d]` and `?.`/`??` `[3e]`. Recorded as B3 in
`docs/discovery/2026-06-26_jjel_status.md` and **unchanged since**. `SPEC.md:103`, `:416` and the
table at `:640` still say short-circuit.

A second consequence: `false and unknownX` evaluates to `false` **and** emits
`undefined-identifier:unknownX` `[3g]`. Validation checks warnings before type
(`validationEvaluator.ts:337-348`), so a result fully decided by its left operand is reported as
*not evaluable*.

### 6.3 The claim "JjEL throws on absent"

The validation spec states it at §5 (`claude_spec_2026-09-08_user_defined_validation.md:193`), and
the three entrances at `validationEvaluator.ts:37-63` answer it.

**Confirmed for navigation over `null`** `[2b][7c]`. **Refuted as a general statement**: an absent
name or property is a silent `null`, and the validation lane already covers that with its third
entrance (warnings).

**One case none of the three entrances catches**: a property read on a primitive gives `null` with
no warning `[2e][2f]`. If the expression then stays boolean, for example `self.name.foo == null`,
the rule yields a verdict computed on an absence. That example is deduced from `[2f]` and
`evaluator.ts:1013-1014`, not run.

Also, `[2k]` throws `TypeError`, which validation still maps to *exception* because it catches
everything (`validationEvaluator.ts:322-332`); a caller that catches only `JjelEvaluationError`
would not.

---

## 7. The translatable subset — census (COSA 5)

**Counts.** 21 AST node kinds (`ast.ts:24-45`). Builtins:

- 31 collection (`getCollectionMethod`), 36 string (`getStringMethod`), 35 number (`getNumberMethod`);
- 36 date methods + 5 date constructors (`getDateMethod`, `getDateConstructor`);
- 4 conversion builtins (`evaluator.ts:94-115`).

Hard-coded properties:

- arrays: `length`, `size`, `first`, `last`, `isEmpty`, `isNotEmpty`, `notEmpty` (`:422-434`);
- strings: `length`, `size`, `isEmpty`, `isNotEmpty`, `notEmpty`, `toUpper[Case]`, `toLower[Case]`,
  `trim`, `trimStart`, `trimLeft`, `trimEnd`, `trimRight` (`:445-468`);
- class shells (`:476-513`): `superclass`, `superclasses`, `extends`, `allSuperclasses`,
  `subclass`, `subclasses`, `allSubclasses`.

**The axis that decides.** Most constructs fold to constants when their operands depend **only on
M**, which is frozen (spec §2). The classification below is for operands that depend on **σ or e**.
Legend: (a) finite-expandable, (b) expressible with restrictions, (c) not expressible.

### 7.1 Core constructs

| Construct | Site | Class | Note |
|---|---|---|---|
| Literal `true`/`false`, integer | `parser.ts:410-430` | a | |
| Literal decimal (`EDouble`) | `parser.ts:420-429` | c | reals; JjEL has one `number` type at runtime |
| Literal string | `parser.ts:432-440` | a / c | (a) as an enum or identifier constant compared with M or `event`; (c) as a value of σ |
| `null` | `parser.ts:442-450` | b | needs an explicit *absent* in the domain; spec §2 gives it only to `event` |
| Identifier | `evaluator.ts:211-266` | a | roots and bound names; (c) when it names a caller-bound function |
| `.p`, `?.p` | `:380-401` | a / b | on M resolved at translation; on a σ component, a per-element read; `?.` needs *absent* (b) |
| `[i]` | `:967-978` | a / b | (a) with an M-enumerable index `[7g]`; (b) with an arithmetic index |
| `==`, `!=` | `:324-328` | a | bool, bounded int, enum. **Equality is structural**, not identity (`:1012-1031`): two objects with the same fields are equal `[4k]`. Over M handles this matches identity because ids are unique (deduced) |
| `<`, `>`, `<=`, `>=` | `:330-340` | a / c | (a) on bounded ints; mixed types fall back to string comparison `[4d]`: (c) |
| `+`, `-`, `*` | `:282-307` | b | bounded ints, with an out-of-domain result a defect (§3.2 of the spec); `+` on strings or arrays is (c) |
| `/` | `:309-314` | c | returns doubles `[4f]`; division by zero `null` |
| `%` | `:316-321` | b | JS remainder; its sign semantics against nuXmv `mod` are not measured |
| `and`, `or`, `not`, `implies` | `:343-347`, `:362`, `:904` | a | eager `and`/`or` (§6.2): a guard that throws in JjEL is a total formula in nuXmv |
| unary `-` | `:365-369` | b | |
| `if … then … else` | `:827-839` | b | `case`; without `else` it yields `null`, which is (c) for a guard |
| `??` | `:841-847` | b | |
| `is Type` | `:853-856` | a (in principle) | resolved on M; **measured `false` on an M1 handle** `[4m]` because the registry reads `__type`/`className` (`context.ts:78-95`); `instanceOf == C` works `[4n]` |
| Lambda | `:862-878` | a / c | (a) only as the argument of a quantifier-shaped builtin; (c) as a value |
| `[ … ]` | `:884-886` | a / c | (a) as a finite set of M constants; (c) as a value of σ |
| `{ … }` | `:892-898` | c | |
| `forall … such that … : …` | `:916-932` | a / b | (a) filter and projection over M; with a σ-dependent filter the result is a state-dependent set, expandable only when consumed by `size`/`isEmpty`/`all`/`any` (b) |
| `exists … \| …` | `:934-943` | a | finite disjunction |
| `with … do …` | `:949-961` | a | sugar |
| `name(args)` | `:703-718` | c | caller-bound functions (JjTL `resolve`, helpers) |
| interpolated string | `:984-997` | n/a | the parser never produces it: `"a${x}b"` gives `Expected expression` `[8h]`; `SPEC.md` §9.4 |

### 7.2 Builtins

| Group | (a) over M, or finite-expandable | (b) | (c) |
|---|---|---|---|
| Collection (31) | `all`, `any`, `none`, `isEmpty`, `isNotEmpty`, `contains`, `count(p)`, `size`, `first`, `last`, `at`, `indexOf` (fixed order of M), `filter`, `map`, `flatMap`, `flatten`, `distinct` (as intermediates over M) | `sum`, `min`, `max` on bounded ints; `count`/`first`/`last` over a σ-dependent filter | `avg` (double); `sortBy`, `sortByDescending`, `groupBy`, `distinctBy`, `take`, `skip`, `takeWhile`, `skipWhile`, `join`; any collection used as a value of σ |
| String (36) | all of them, folded to constants over M | — | all of them over σ/e (strings are not in state); `matches` (regex) |
| Number (35) | — | `abs`, `sign`, `clamp`, `between`, `mod`, `div`, `isPositive`, `isNegative`, `isZero`, `isInteger`; `round`/`floor`/`ceil`/`trunc` (identity on ints) | `sqrt`, `pow`, `exp`, `log`, `log10`, `log2`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `toFixed`, `toPrecision`, `toExponential`, `toString`, `toHex`, `toBinary`, `toOctal`, `isFinite`, `isNaN` |
| Date (36 + 5) | — | — | all of them. `now()` and `today()` read the clock, so they are non-deterministic on a frozen configuration; present only on path A |
| Conversion (4) | — | — | `String`, `Number`, `Boolean`, `Array`; path A only |
| Class shell properties (7) | all, resolved on M | — | — |

**Two dispatch facts that matter to a checker.**

- The receiver type picks the method. On a string, string methods are tried **before** date methods
  (`evaluator.ts:749-759`), so the date `format` is unreachable on a string.
- The names `reverse`, `indexOf`, `contains`, `isEmpty`, `isNotEmpty`, `length` exist on both
  strings and collections.

A static checker therefore needs the receiver type. The name alone is not enough.

**Documentation drift, recorded here and not corrected.**

- `SPEC.md` §7.3 says `filter`/`map` are removed; they are registered in `getCollectionMethod`.
- The header of `jjel/index.ts:10,15,21` and the JSDoc examples in `collections.ts` still show the
  lambda as `x: expr`, which does not parse `[8g]`.

---

## 8. Lexer situation (COSA 6)

`JJEL_KEYWORDS` has 18 entries (`jjel/types/tokens.ts:106-125`). The lexer lowercases the
identifier before the lookup (`jjel/lexer/lexer.ts:397-400`), and the parser accepts only
`IDENTIFIER` after `.` and `?.` (`parser.ts:342`, `:365`). As a result every keyword (and every
case variant: `forAll`, `True`, `IF`) is a parse error after a dot:

- measured 18/18 on 2026-09-08 (`discovery_2026-09-08_keyword_dopo_il_punto.md` §4.1);
- re-measured here on `event.in`, `state.do`, `xs.forAll(x => x)` `[8a..8c]`, with control
  `event.name` `[8d]`.

**Only `true`, `false`, `null` are silent.** As bare identifiers they parse as literals, so a
binding with one of those names is unreachable without any error: `{true: 5}` evaluates `true` to
`true`, `{null: 5}` evaluates `null` to `null` `[8e][8f]`.

**The reserved-word lists are not shared.** JjTL has its own `JJTL_KEYWORDS`
(`jjtl/types/tokens.ts:105-136`, 25 entries, same lowercase lookup at `jjtl/lexer/lexer.ts:330`),
with 14 words in common with JjEL. JjScript has a third list, `KEYWORDS`
(`jjscript/types.ts:585-590`). The escape hatch `a["in"]` works (2026-09-08 report §5; here
`state.marking["S1"]` `[7f]`). Nothing was fixed.

---

## 9. Step 2 of the plan: files, foundations, breakage, unknowns

This is a mapping, not a design. No implementation is drafted.

### 9.1 Files that would be touched

| File | Why | Nature |
|---|---|---|
| a **new** three-root context builder | builds `{ self, state, event }` over the M snapshot, without `data`/`node` | new module; **location open** (Q1) |
| a **new** guard / action-expression evaluator | runs a compiled expression on a configuration, applies the tri-state | new pure module; the precedent is `model/validation/validationEvaluator.ts` (imports JjEL only) |
| a **new** subset checker | walks `JjelExpression` (`jjel/types/ast.ts`) and emits diagnostics | new pure module; **no JjEL AST visitor exists** outside `jjel/` and `jjtl/` (grep for `JjelExpression` outside them hits only `validationEvaluator.ts`, which does not walk); the nearest walker is `jjtl/executor/astBridge.ts` (JjTL to JjEL) |
| `jjscript/executor/commands/eval.ts` | only if the builder needs a variant of `buildEvalContext` (e.g. skip `data`/`node`, or return the pool or `classByName`) | extension of `BuildEvalContextOptions` with optional fields (Rule 11 allows it); five callers depend on the default path |
| `jjel/evaluator/*` | **not needed** for read-only M (§4.3) or extra roots (§5) | only if eager `and`/`or`, `is` on handles, or the silent primitive property are to be changed (Q3), which is a cross-lane change |

### 9.2 What it builds on

- the open-record context `[7a..7g]`;
- the `buildEvalContext` snapshot, with shared shell and handle identity and pointer-resolved
  references;
- `extentModelId` to limit the extent to one model;
- the validation tri-state with its three entrances and `verdict` (`validationEvaluator.ts:223`),
  which spec §5.2 already asks guards to follow;
- deep-freeze compatibility `[6a*][6b]`;
- no write construct in the language `[6c][6d]`.

### 9.3 What it would break, if done carelessly

- **Changing `buildEvalContext`'s default path** reaches the console, JjScript `eval`/`let`/`forall`,
  Jodie and validation together.
- **Making `and`/`or` short-circuit** changes validation verdicts: `[3a]` would become `false`
  instead of *not evaluable*, and `[3g]`'s warning would disappear. It also changes JjTL and
  JjScript results.
- **Adding `state`/`event` to `buildEvalContext` itself** instead of a simulation-only builder
  would shadow or be shadowed by metaclasses or instances with those names in existing
  expressions (§5).
- **Path choice.** Building the evaluator on the context (path A) makes `now()` and the date and
  conversion builtins available to guards and shadows roots named like them `[1a][1c]`. Path B
  avoids both.

### 9.4 Unknowns

- **The shape of σ**, owned by the engine discovery: whether the marking is keyed by element id,
  name or handle. Names are not unique (the ambiguity map exists for that reason), and an absent
  key yields `property-not-found` `[7d]`.
- **What `self` is** for a guard on an edge (a pool handle, presumably) and for node-level actions.
- **Cost.** `buildEvalContext` is O(objects × features) with no cache (`eval.ts:197-198`). Because
  M is frozen for a run (spec §2), the snapshot can be built once per run and only σ and e rebuilt
  per step. Whether the engine can guarantee the store does not change mid-run is not known here.
- **Arithmetic against nuXmv.** Integer division and the sign of `%` were not measured against
  nuXmv semantics.
- **Other L files.** Whether proxy getters outside `LModelElement.tsx`/`classes.ts` write when read
  (§4.3) matters only if a live L proxy enters the context.
- **Which reserved-word list** governs event identifiers and state component names: JjEL's 18, the
  union with JjTL (29, per the 2026-09-08 report), plus nuXmv's own reserved words (not measured).

---

## 10. Risks

| # | Risk | Evidence | Severity |
|---|---|---|---|
| R1 | Guard idiom `x != null and x.p` throws, making the guard *defective* rather than `false` | §6.2 `[3a]` | high for authoring |
| R2 | Property of a primitive is a silent `null` that no tri-state entrance sees | §6.3 `[2e][2f]` | medium |
| R3 | A builtin shadows a root or event name on path A | §3.2 `[1c]` | medium |
| R4 | `is` returns `false` on M1 handles, so a type-test guard is silently false | §7.1 `[4m]` | medium |
| R5 | `data`/`node` carry live L proxies into any context that keeps them | §4.2 | low if the simulation builder omits them |
| R6 | A caller-bound `JjelFunction` can write; read-only depends on the builder never binding one | §4.3 `[6h][6i]` | low, but it is the only write path |
| R7 | Structural equality: two distinct plain objects with equal fields compare equal | §7.1 `[4k]` | low over M handles; relevant if σ values become objects |
| R8 | `SPEC.md` disagrees with the code on short-circuit and `filter`/`map` | §6.2, §7.2 | low, but it misleads authors |

---

## 11. Open questions for Alfonso

**Q1 — Where does the three-root builder live?** `components/editor-v2/sim/` is the other lane's
perimeter today. A `model/simulation/` sibling of `model/validation/` would mirror the pure
evaluator plus context-bridge split already in place.

**Q2 — Path A or path B for guards?** Path B (the validation form) keeps `now()` and the date and
conversion builtins out, and leaves root names free. Path A gives them. Spec §5.1 ("no I/O") points
to B.

**Q3 — Do the three evaluator behaviours of §10 (R1 eager `and`/`or`, R2 silent primitive
property, R4 `is` on handles) belong to step 2, or stay forbidden in the subset checker?** Fixing
them in the evaluator is a cross-lane change (validation, JjTL, JjScript, console). Forbidding or
rewriting them in the checker is local.

**Q4 — Reuse validation's `verdict` and the three entrances, or a sibling module?** Reusing them
couples the two lanes. Duplicating them creates the "third converter" that
`validationEvaluator.ts:16-35` warns against.

**Q5 — Deep-freeze the M snapshot?** It is measured compatible. It would turn the *de facto*
read-only into an enforced one, at the cost of one traversal per run.

---

## 12. The probe

The file `probe_2026-09-13_jjel_eval_context.mts` sits in the session scratchpad. It imports
`jjel/parser` and `jjel/evaluator` from source and executes them (P11): no copies, no mirrors.

**The two evaluation paths.** `run(src, vars, path)` builds `new EvaluationContext(vars)`. Path A
passes that context to `new JjelEvaluator(ctx)`; path B uses `new JjelEvaluator()` without it.
Every case then calls `evaluateWithDiagnostics` and records one of three outcomes: value plus
warnings, the thrown error class, or the parse error.

**Positive controls** (P12):

- `[3f]` is the same expression as `[3a]` on a non-null input, so the throw in `[3a]` comes from the
  null navigation, not the parse;
- `[6p]` shows that the freeze was active (a JS write throws);
- `[8d]` is a non-keyword after a dot, which parses.

**Result: 79 PASS 0 FAIL, exit 0.** Group totals: 1 (4), 2 (14), 3 (7), 4 (16), 5 (2), 6 (21), 7 (7),
8 (8). The per-case output is quoted in §§3-8.

A second script, `getter_writes.mjs` (scratchpad, not committed), produced the census of §4.3:
`get_ bodies scanned: 429; with a write primitive: 15`. The existing JjEL and validation suites were
also run: `npx vitest run src/jjel src/model/validation` gives **6 files, 269 tests passed**.

---

## 13. State of the tree at the end

No source file modified. Written by this run: this report and the entry in
`docs/claude-code-log.md`. Pre-existing and not touched:

- `ValidationRulesModal.tsx`/`.scss`, dirty and belonging to another lane;
- six `jjscript/executor` files already **staged** by another session (`resolvers.ts`,
  `resolvers.test.ts`, `commands/create.ts`, `delete.ts`, `list.ts`, `rename.ts`).

Those staged files were left in the index. The commit passes an explicit pathspec (CLAUDE.md §6.4).

**How the commit actually went.** Two things happened before this run's commit:

- the staged `jjscript/executor` files left with `a52dfe5f3`;
- the parallel lane committed `46f4f584d`, "docs: add the simulation engine state discovery and
  its log entry". That commit took the whole working-tree `docs/claude-code-log.md`, which already
  held **both** 2026-09-13 discovery entries.

So **this run's log entry landed in `46f4f584d`**, whose message names only the other one.
Verified byte for byte (the entry in `HEAD` diffs clean against the one written here). This run
detected the HEAD move and aborted its own commit, which was built on a temporary index containing
only its entry. It then committed this report alone. No history rewrite.

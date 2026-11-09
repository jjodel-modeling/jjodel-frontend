# JjTL gaps measured on the generic Brief transformation (Phase 1, discovery)

- Prompt-ID: P-2026-11-08-0125 (`docs/prompts/claude_2026-11-08_0125_prompt_jjtl_kernel_gaps_discovery.md`)
- Session: 5fc107ab-e971-4963-ae17-91fb6008a92d, unattended
- Tree: `~/jjodel-w-kgaps`, branch `jjtl-kernel-gaps`, HEAD `23c28c21f`
- Executor model: Claude Opus 5.5 (`claude-opus-5-5`)
- This report is a set of hypotheses with evidence, not a reference. Whoever uses it rereads the real files.

Inputs are the lane inputs of the hardware Brief kernel, read only and not in this repo: `Brief2SyncRTL.jjtl` (328 lines),
`Brief.ecore`, `SyncRTL.ecore`, `syncrtl-classes.json`, two flat Briefs `rv_mc4.flat.json` (core) and
`arb3_fixed.flat.json` (arbiter), the probe `hwproto_kernel.test.ts`, the design note `brief-kernel.md`. They are cited
by file name and line; nothing of them is copied here beyond short quotes.

`git diff --stat 02269f010 HEAD -- frontend/src/jjtl` is empty (measured): the JjTL of this branch is the JjTL of the
trunk the 21-Brief regression was measured on (2026-11-07).

## 0. Answer in brief

- **Baseline (measured, both Briefs, this HEAD).** The probe gives `success true`, 0 warnings, 0 errors on both: the
  arbiter Brief, 143 source objects, gives 1 Module of 168 target objects (3 inputs, 3 outputs, 6 regs, 3 wires,
  6 properties) in 98 ms; the core Brief, 2,031 source objects, gives 1 Module of 2,524 target objects (2 inputs,
  4 outputs, 10 regs, 114 wires, 36 properties) in 890 ms (vitest `tests` time, one run each). SHA-256 of the probe
  outputs, first 16 hex digits: arbiter `5c0d9731c4bb9632`, core `2a34b97ab348ce64`. These are the in-repo oracle a
  slice keeps unchanged; the 21-Brief regression stays outside the repo.
- **The five, by what they cost the transformation:** 3 (context) far first, then 7 (multi-model, cheap in the
  transformation, 98% of every core Brief in the models), 10 (inheritance matching), 4 (name lists), 5 (log2).
- **Item 3 is the one that shapes the transformation.** It has 34 called rules and 24 of its 31 helpers taking `cx`,
  51 `one(cx, ...)` calls and 58 `className ==` tests, 0 lazy rules and 0 uses of `extendEnv`/`envLookup` (measured,
  grep counts on the input): it reimplements by hand the environment of slice B (R-JTG-5), closures included
  (`{ e: a.expr, cx: cx }`, line 106). The reason holds, and is worse than stated: in a helper, `envLookup("x") + "_w"`
  gives `"[object Object]_w"` and `envLookup("w") + 1` gives `null`, **with `success true`** (measured, probe §3.3).
  Through a rule-body `let`, both already work today (R-JTG-15): `"add_w"` and `4`.
- **Recommended for item 3:** a builtin `envValue(name[, env])` returning the bound value as bound (a string a string,
  an integer an integer, a source element the element), never a demand. No grammar, no change to the trace key (the
  bound values are in it already), no change to `envLookup`. A context outside the trace key is wrong for every value
  that varies (loop variables, macro arguments) and is not recommended; a transformation-level `let` covers only the
  run constants and needs grammar. Separately, a demand used as a value in an expression should be an error, as
  R-FA-11 asks of a failing builtin.
- **Item 7:** no grammar needed for the case at hand: library, template and patterns conform to the same kernel
  metamodel as the Brief, so "several source models" is the union of the objects of several models of one metamodel.
  Pass 1 matches over the union; the trace already keys by source id; the app needs a multi-select in the execute
  dialog and an optional list of source models in the generation record. Typed `from A, B` is a second step.
- **Items 4 and 5 need no JjTL change** (read and measured): many-valued attributes are carried end to end already
  (XMI import splits on whitespace, the executor gets a list by upper bound, write-back writes the list, export joins
  with spaces), and `n.log2().ceil()` is exact for every n in 1..2^22 in V8 (measured). They are changes to the kernel
  metamodel and the transformation, owned by the kernel's author.
- **Item 10:** what the transformation needs is matching on supertypes (SPEC §3.2), not rule inheritance (SPEC gap 10
  is `abstract`/`extends`, a different feature). The executor receives no source metamodel, so supertypes must come
  with the source objects; a policy for a subclass matched by two rules is Alfonso's.
- **Slices proposed (§9):** S1 `envValue`, S2 demand-as-value error, S3 multi-model union in the executor, S4 its app
  side, S5 supertype matching. No slice touches a critical-zone file (§3.1 of `CLAUDE.md`).

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | `envLookup` cannot feed a name or an integer | holds, with a nuance | §3.3: fails silently in a helper and in a binding; works through a `let` |
| H2 | The transformation's explicit context is the largest workaround | holds | §3.1 counts |
| H3 | Multi-model needs grammar | falsified for this case | §4: same metamodel, union of objects |
| H4 | JjTL lacks many-valued attributes | falsified | §6: carried end to end |
| H5 | `log2` is a JjTL limit | falsified | §7: `.log2().ceil()` exact (measured) |
| H6 | Inheritance matching is SPEC gap 10 | partly | §5: §3.2 says matching; gap 10 is rule inheritance |
| H7 | The transformation gives the same output on this branch | holds | §2: no JjTL diff since `02269f010`, both runs succeed |

## 2. Baseline run (measured)

The probe was copied to `frontend/src/jjtl/executor/__tests__/hwproto_kernel.test.ts`, run once per Brief through
`scripts/run-quiet.mjs` (labels `kgaps-arb3`, `kgaps-rv`, exit 0, 1/1 passed), and removed; `git status` clean after.

| Brief | source objects | target objects | inputs | outputs | regs | wires | properties | tests time | output sha256/16 |
|---|---|---|---|---|---|---|---|---|---|
| arbiter | 143 | 168 | 3 | 3 | 6 | 3 | 6 | 98 ms | `5c0d9731c4bb9632` |
| core | 2,031 | 2,524 | 2 | 4 | 10 | 114 | 36 | 890 ms | `2a34b97ab348ce64` |

Of the source objects (measured, by walking `_containerId` up to the child of the Brief):

| Brief | Brief's own | Library | Template | copied share |
|---|---|---|---|---|
| arbiter | 19 | 109 | 15 | 86.7% |
| core | 38 | 1,044 | 949 | 98.1% |

## 3. Item 3: the explicit context

### 3.1 What the transformation does (read, measured counts)

- `Brief2SyncRTL.jjtl:16-17`: "The context is an explicit list of { k, v } frames, innermost first, passed to every
  rule: JjTL's environment (envLookup) yields demands, not values, so it cannot feed a name or an integer."
- `:24-25`: `helper bind(cx, k, v) { [[{ k: k, v: v }], cx].flatten() }` and `helper val(cx, k) { (forall p in cx such
  that p.k == k : p.v).first() }`: a linear scan per read, 12 `val(cx` sites.
- `:105-106`: macro arguments as hand-made closures: `{ k: a.name, v: { e: a.expr, cx: cx } }`; `:118` lowers them in
  their own context: `low(val(cx, x.name).cx, val(cx, x.name).e)`. This is R-JTG-5's closure, written in data.
- `:126-163`: `helper low(cx, x)`, a 36-way `className ==` dispatch onto the called rules `mkRef` ... `mkProperty`
  (`:166-286`). With lazy rules this dispatch is what JjTL does by itself (`lazyBySourceType`, `executor.ts:1312-1319`).
- Counts on the input (measured, grep): 34 `rule`, all `mk*(cx, x)`; 31 `helper`, 24 taking `cx`; 51 `one(cx`;
  32 `ev(cx`; 12 `subst(`; 58 `className ==`; 1 matched rule (`Brief b -> Module`, `:320`); 0 `lazy`; 0 `extendEnv`,
  `envLookup`, `envHas`.

### 3.2 What exists in JjTL today (read)

- `executor.ts:320-328`: "interface Environment { readonly parent: Environment | null; readonly bindings:
  ReadonlyMap<string, Closure>; }" and "A bound value: the expression as written and the environment of its binding site."
- `executor.ts:3237-3241`: `envLookup` "return (closure ? this.makeDemand({ kind: 'closure', name, closure }) : null)".
- `executor.ts:3324-3326`: demands are realized by `resolveBinding` ("A binding's value: demands realized first"),
  and `executor.ts:3501-3503` by `letValue` ("its expression evaluated once, at the binding, with the calls and
  environment lookups it holds carried out there").
- `executor.ts:3268`: `envKey(env)`, "The structural key of an environment: the visible bindings ... each as its
  value's identity": bound values are already part of the trace key (R-JTG-6).
- `executor.ts:3588-3590`: a called rule's `Env` parameter sets the environment of its application.
- `called-lazy-rules.test.ts:234-247` already writes the pattern the transformation needs: `rule under(e, env: Env) = e`,
  `lazy Var v = if envHas(v.name) then envLookup(v.name) else mkRef(v)`, `lazy Bind b = under(b.expr, extendEnv(...))`.
- Scoping, read: a rule body starts from the root context, `executor.ts:2883` "return this.context.evalContext.child(bindings);",
  while a helper runs in a child of its caller's context, `executor.ts:1394` "const childCtx = ctx.child(bindings);"
  with `jjel/evaluator/evaluator.ts:926` "if (builtin) return builtin.call(args, ctx);". A helper therefore sees its
  caller's JjEL variables (dynamic), a called rule does not. Not relied on below; noted because it is undocumented.

### 3.3 Probe (measured)

A temporary `kgaps_env_probe.test.ts` (removed after the run, exit 0) on a toy `Main(expr: Add(Var x, Const 1))`
lowered under `extendEnv(["x", "w"], ["add", 3])`:

| case | written | result |
|---|---|---|
| A | `helper tag(n) { envLookup(n) + "_w" }`, `name := tag(v.name)` | `success true`, `Ref("[object Object]_w")` |
| B | `let $n = envLookup(v.name) in { name := $n + "_w" }` | `success true`, `Ref("add_w")` |
| C | `value := envLookup("w") + value` | `success true`, `Const(null)` |
| D | `let $w = envLookup("w") in { value := $w + value }` | `success true`, `Const(4)` |

A and C are silent wrong outputs: the demand marker `{ __jjtlDemand: id }` is an object, and JjEL's `+`
(`jjel/evaluator/evaluator.ts:480-490`, read) concatenates it as text beside a string, "return String(left ?? '') +
String(right ?? '');", and returns `null` beside a number ("return null;" after the number and array cases).

### 3.4 Options compared

**(1) A read-only context outside the trace key.** A second channel on the application frame beside `env`, inherited
by called rules and visible to helpers, entered through a parameter like `Env` (no grammar: `paramType` is compared as
a string, `executor.ts:3589`), read by a builtin. Outside the key means a `unique` rule (R-JTG-16), a `unique lazy`, or
an implicit resolution under one environment returns the same target for two different contexts. Every name pattern of
the kernel (`is_{op.lower}`, `Requirement:{req}`) depends on the loop variable and the macro arguments, so those
collapse: wrong targets, or R-JTG-4 double claims. It is safe only for values constant over the run. Two scoping
mechanisms to learn. Not recommended.

**(2) A transformation-level `let`.** Grammar (the 6-file checklist of `frontend/src/jjtl/CLAUDE.md`), evaluated once
before pass 1. It covers the run constants (`__brief`, `__library`, `name`, `realization`, the params; `:291-292`) and
nothing that varies. Constant only while a model holds one Brief. Read, not measured: the constants are reachable
today through `data`, bound to the source model at `executor.ts:1257` ("data: shallowToJjelValue(sourceModel)") and not
rebound by `createInstanceContext` (`:2823-2827` rebinds `source`, `self`, `it`), unless an instance has a feature
named `data`.

**(3) Extending `envLookup` to return values.** Returning the value always breaks the point of `envLookup`: a bound
expression is lowered under its binding site (R-JTG-5, `called-lazy-rules.test.ts:245`). A narrow variant, a value for
a primitive and a demand otherwise, is backward compatible (a realized primitive is the primitive,
`executor.ts:3452` returns a value that needs no realization unchanged) and fixes A and C, but a helper that wants the
bound element itself (to read its `props`) still gets a demand.

**(4) Recommended: `envValue(name[, env])`.** Beside `envLookup` in `registerEnvironmentBuiltins`
(`executor.ts:3223-3242`): the closure's `value` as bound, no demand; with an optional second argument, an `extendEnv`
marker (`environmentOf`, `:3250`) to read from instead of the current environment, which is what a `where` condition
tested with the candidate bound needs (`Brief2SyncRTL.jjtl:95`, `test(bind(cx, f.v, n), f.where)`). No grammar. Trace
key unchanged: what it reads is already in `envKey`. Extends R-JTG-11 (the builtins are reserved for called rules; a
helper called from one runs inside its frame, `currentEnvironment()` at `:3317`). With it the transformation can drop
`cx` and `low`/`one`: `lazy Ref x -> Ref { name := subst(x.name) }`, `lazy Arg a = envLookup(a.name)`,
`lazy Use u = under(..., extendEnv(argNames, argValues))`, `lazy ForEach f = chosen(f).map(n => under(f.body,
extendEnv([f.v], [n])))`, containment by implicit resolution (R-JTG-6). Estimate, read and not measured: `:24-25`,
`:105-163` and the `cx` of every rule and helper go, the 34 `mk*` rules become lazy rules of one or two lines.

**Interactions.** R-JTG-6: every expansion stays fresh, as the prototype's `lows` does today (no rule `unique`).
R-JTG-13: `envValue` returns no target, so it cannot meet a lazy node through `resolve`. R-FA-11..13: a failing
`envValue` (unbound name) returns `null` like `envLookup`; whether it errors is a decision (§10). R-FA-14 untouched.
App write-back: untouched, the targets are the same kind. Performance: `envKey` is cached per environment object
(`envKeys`, `:1305`); environments one frame per binding are longer than today's and should be measured on the core Brief.

**Separately: a demand used as a value.** Cases A and C should stop the run naming the builtin and the expression
(R-FA-11, R-FA-13 form), not write `"[object Object]_w"`. Where: the JjEL binary operators see the marker as an object;
the check fits in the executor where the expression's value is returned to a helper or a binding (`evaluateExpression`),
not in JjEL. A slice of its own (S2), registered as a ticket in the inbox.

**Verification.** Unit tests beside `called-lazy-rules.test.ts` (envValue of a string, an integer, an element, an
unbound name, under an `extendEnv` marker; A and C as errors). Oracle: the unchanged `Brief2SyncRTL.jjtl` keeps the two
hashes of §2; the gain is shown by a lazy-rule rewrite of the transformation (the kernel author's) giving the same two
hashes and the 21-Brief regression, with its line count beside 328.

## 4. Item 7: one source model

### 4.1 What the transformation does (read)

- `Brief2SyncRTL.jjtl:20-21`: "Libraries are contained, not separate models: JjTL has no multi-model source yet (SPEC
  12.3, gap 7)."; it reaches them as `b.lib`, `b.realization` (`:291`, `:299-316`, `:320-327`) and by name inside them
  (`item`, `macro`, `order`: `:60-62`, `:81-85`, `:101-104`). Cost in the transformation: small. Cost in the models:
  §2, 98.1% of the core Brief is library and template, copied into each.

### 4.2 What exists (read)

- `parser/parser.ts:81-82`: `this.consume(TokenType.FROM, ...)` then one `IDENTIFIER`: `from A, B` does not parse.
  `SPEC.md:116`: "Current implementation: Single model per `from`/`to`. Multi-model is Phase 1 future work."
  `SPEC.md:132` already has `qualifiedType = ( IDENTIFIER "." )? IDENTIFIER`.
- `executor.ts:643`: `execute(sourceModel: any, targetMetamodel?: any)`; the source is an array of objects
  (`:1410`). `executor.ts:1276-1280`: rules indexed by `src.className`, unqualified.
- Trace: `executor.ts:3531-3532` keys a realized source by `element?.id ?? element?.name`; `:3632` writes
  `modelName: this.ast.sourceMetamodel || 'source'`, one name for every source element. The name-keyed map
  `targetsBySourceName` (`TargetEntry`, `:304-311`) can meet equal names across models, as it can within one today.
- App: `jjtl/types/transformation.ts:15` one `sourceMetamodelId?`; `ExecuteTransformationDialog.tsx:76-77` filters
  models by `isModelCompatibleWithSource`, `:250-253` one `<select>` bound to `sourceModelId`; the callback carries one
  id (`DockManager.tsx:442`, `JjtlDevelopmentEnv.tsx:298`); `ProjectEditor.tsx:1450` "const sourceModel =
  models.find(m => m.id === sourceModelId);" and serializes `allSubObjects` (`:1476-1477`); the generation record
  `model/megamodelInference.ts:40-44` has one `sourceModelId`.

### 4.3 Smallest change

Several models of the **same** source metamodel, their objects concatenated: no grammar, `execute` unchanged in
signature. Pass 1 matches over the union, so `Brief b -> Module` fires once per selected Brief: several Briefs and one
library give one Module each. The kernel then holds `lib` and `realization` as a name or a cross-model reference,
not a containment (the kernel author's change, decision B of `brief-kernel.md:175-176`). In the executor: the trace's
`modelName` per element. In the app: the dialog becomes a list of compatible models with checkboxes,
`ProjectEditor` serializes each chosen model, the generation record gains an optional `sourceModelIds?: string[]`
(Rule 11 allows an optional property; no VersionFixer migration, as old records keep `sourceModelId`). Typed
`from Brief, Lib` with qualified types is a later slice, with grammar, when two source metamodels are needed.

Interactions: R-JTG-6 and R-JTG-16 key by id, global in Jjodel, so no collision in the app; the flat JSON of the node
probe numbers ids per file (`S40`), so a node probe of separate files must prefix them. R-JTG-13 unchanged. R-FA-14
unchanged. Write-back: one target model, unchanged; R-JTG-14 one undo step, unchanged.

Verification: the node probe with the core Brief split into three flat files (Brief 38 objects, library 1,044,
template 949) concatenated gives the hash of §2 once the kernel's `lib` containment is replaced; the 21-Brief
regression with one shared library.

### 4.4 Layer Impact Report for S4 (the app side)

No critical-zone file of `CLAUDE.md` §3.1 is touched; written because S4 changes the read path of the source model.

```
Layers touched:
  [ ] D-layer  [x] L-layer (read only: allSubObjects of several models)  [ ] JjOM
  [ ] Canvas v2-flow  [ ] Canvas classic  [ ] Sync layer
  [x] Persistence (optional sourceModelIds on the generation record; no jsxString)
What changes: the source array handed to execute() is the union of the chosen models; the dialog selects several.
What does NOT change: write-back, the output model, the undo step, every single-model run (one id = today's path).
Cross-layer interaction: megamodel inference reads the generation record; an old record has sourceModelId only.
Smoke: run Class2Relational on one model -> identical output; run the kernel on Brief + library -> one Module.
```

## 5. Item 10: inheritance-based source matching

### 5.1 What the transformation does (read)

`brief-kernel.md:13-16`: "An `Item` has integer `props`, string `texts` and expression `slots` ... Option A2 needs
inheritance-based matching, which JjTL lacks". In the transformation: `prop`, `text` (`:63-64`), `item` (`:60-62`),
`slots` (`:98-100`), `IntProp` (`:40`). Cost in the transformation: about 8 lines; the cost is the weak typing of the
libraries, which a Brief editor cannot check.

### 5.2 What exists (read)

- `SPEC.md:147`: "Source matching: Exact class name match (string equality on `className` or `__type`). No
  inheritance-based matching in current implementation." `SPEC.md:1155` gap 10 is "**Rule inheritance** | `abstract` /
  `extends`": a different feature, not what the kernel needs.
- Exact-name indexes: `executor.ts:1278` (`rulesBySourceType.get(src.className)`), `:1315` (lazy), `:1515`
  (`sourceInstances.get(sourceClassName)`), `:3370-3372` (`sourceRuleOf`).
- The executor has supertypes for the **target** only (`classIsOrExtends`, `:873`, `superNames`, `:3341`); it
  receives no source metamodel (`:643`).
- No reflective read by a computed feature name in JjEL (search: `^\s+(get|keys)[,:]` and `'(get|keys|eGet|feature)'`
  over `jjel/evaluator/`, empty; positive control `^\s+(log2|get|keys)[,:]` finds `numbers.ts:283 log2,`). A typed
  library (`Instruction extends Item` with `mask`) read by a template that names the feature in data (`IntProp.key`)
  needs one.

### 5.3 Smallest change

`ProjectEditor` adds the ancestor class names to each serialized object (it resolves `instanceof` already,
`:1496-1497`); the executor indexes each instance under its class and its ancestors, and looks a rule up most specific
first. Policy, Alfonso's: a subclass instance with a rule on its class and one on its superclass gets the most specific
only, or both. Interactions: both firing into one containment is an R-JTG-4 double claim; `sourceRuleOf` requires one
rule (`:3379`), so "both" makes implicit resolution ambiguous; `lazyOrMatched` (`:3393`) unchanged in kind. R-JTG-13
unchanged. Write-back unchanged. Verification: a unit test with `Node` and `Ref extends Node`; the kernel oracle is
unaffected until the kernel uses typed libraries.

## 6. Item 4: lists of names as strings (read)

The transformation: `Brief2SyncRTL.jjtl:79-80` "Lists of names are one string ... (no many-valued attributes in the
kernel)", `helper words(s)` with 6 uses; `Brief.ecore:64`, `:75`, `:97-98` declare `names`, `kinds`, `skip` as single
`EString`. In the core Brief 19 such attributes are non-empty, 6 hold a space-separated list (5 `ItemSet`, 1 `Pattern`,
measured).

The platform carries many-valued attributes end to end: XMI import, `XMIService.ts:961-963` "EMF default: whitespace
split for multi-valued primitive attributes."; to the executor, `jjtlSourceValues.ts:51` "if (many === true) return
meaningful.map(wrap);"; write-back, `ProjectEditor.tsx:2192` "if (Array.isArray(attrValue)) feature.values =
attrValue;"; export, `XMIService.ts:337` "attrs.push(`${featureName}=\"${rendered.join(' ')}\"`);". The XMI text is the
same either way. Change: `upperBound="-1"` on those attributes in the kernel and `words(x)` becomes `x`; no JjTL change.
Verification: the two hashes of §2 with the kernel changed and the flat Briefs regenerated as lists.

## 7. Item 5: `log2` (measured and read)

`Brief2SyncRTL.jjtl:43` "ev(cx, e.op).log2()"; `jjel/evaluator/builtins/numbers.ts:98-99` "return Math.log2(num);".
Measured in node (V8, as vitest): `Math.ceil(Math.log2(n))` equals the bit width needed for n values for every n in
1..2^22, and `Math.log2(2^k) === k` for k in 0..52. So `IntLog2` can be defined as ceiling log2 and written
`.log2().ceil()` today (`numbers.ts:42-43` `ceil`). The hand-made `idiv` (`:51-53`) has `div` beside it,
`numbers.ts:259-260` "return Math.floor(num / divisor);"; ceiling division is `(a + b - 1).div(b)` (read, not run
through JjTL). No JjTL change; a `clog2` method in JjEL is optional. The fixed 4-bit counters (`brief-kernel.md:31-32`)
can then follow the bound. Verification: the two hashes of §2 unchanged where widths are powers of two.

## 8. Risks and dependencies

- The 21-Brief regression is outside the repo: the in-repo oracle is two Briefs and two hashes.
- §3.4 (4) assumes environments of many frames stay fast enough on the core Brief (890 ms today); unmeasured.
- The helper dynamic scope of §3.2 is undocumented behaviour; a slice that relies on it should first make it a rule.
- Item 7 depends on the kernel author moving `lib`/`realization` out of containment; item 10 on decision A.

## 9. Recommended slices, one lane each

1. **S1 `envValue(name[, env])`**: `executor.ts`, `SPEC.md` §4/§7, a test file, an R-JTG row extending R-JTG-11.
2. **S2 a demand used as a value stops the run**: `executor.ts`, a test, an R-FA row extending R-FA-11.
3. **S3 several source models of one metamodel, executor side**: `executor.ts` (trace `modelName` per element),
   `SPEC.md` §3.1, a test; node probe with three flat files.
4. **S4 the app side of S3**: `ExecuteTransformationDialog.tsx`, `JjtlDevelopmentEnv.tsx`, `DockManager.tsx`,
   `ProjectEditor.tsx`, `megamodelInference.ts`: more than 5 files with the test, so the lane lists them first (Rule 19).
5. **S5 matching on supertypes**: `ProjectEditor.tsx` (ancestors), `executor.ts`, `SPEC.md` §3.2, a test.

Items 4 and 5 are the kernel author's, after S1. Typed `from A, B` and reflective feature read wait for a case.

## 10. Questions for Alfonso

1. Item 3: `envValue(name[, env])` (recommended), the narrow `envLookup` returning primitives, or a top-level `let`?
2. Does an unbound name in `envValue` stop the run (R-FA-11) or return `null` like `envLookup`?
3. A demand used as a value in an expression (cases A, C): an error that stops the run (recommended)?
4. Item 7: several models of one metamodel first (no grammar), typed `from A, B` later?
5. In the dialog: checkboxes over the compatible models, or one primary model plus "also include"?
6. Item 10: most specific rule only, or every rule on the instance's class and supertypes?
7. Should helpers' dynamic visibility of their caller's variables become a rule, or be closed?

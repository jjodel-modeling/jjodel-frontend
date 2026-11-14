# Discovery — three checks asked by the book review (Q17, Q18, Q19)

- Prompt-ID: P-2026-11-14-1235
- Prompt: `docs/prompts/claude_2026-11-14_1235_prompt_book_review_trunk_checks.md`
- Session: `8c982a56-d8ba-4d0f-95cb-e14404f1007e`
- Tree: `~/jjodel-w-book-review-checks`, branch `book-review-checks`, HEAD `8252a8aa4`
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- Date: 2026-11-14

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads the real files.

**Measured** means a probe run in this phase on HEAD `8252a8aa4`. **Read** means a file read. The three probes are vitest files named `_tmp_book_q1{7,8,9}_probe.test.ts`. Each one ran once through `scripts/run-quiet.mjs` (exit 0, 1 test passed) and was deleted afterwards. They were never committed. Their logs are in `.agent-logs/q17-*.log`, `q18-*.log` and `q19-*.log` at the repo root. The probe code is summarised in each section.

## Objective

Three questions about the trunk code that the verification of the second external review of the Jjodel book raised. They are Q17 (JjGen and `forall`, book Listing 12.1 and §12.3), Q18 (JjScript `create instance of State "red"`, book §13.2.3) and Q19 (JjTL coercion in a `:=` binding, book §11.8.1). The book repository was not opened.

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|------------|---------|
| H1 | JjEL `forall x in C such that p : e` returns a set: it loses the order or the repetitions. | **Falsified**, measured. It returns an array in source order, with repetitions kept. |
| H2 | A JjGen hole or loop has a `forall` of its own with different semantics. | **Falsified**, read and measured. JjGen has no loop or block form. A hole is a JjEL expression evaluated by the same evaluator. |
| H3 | `map`/`filter` are needed to keep order and repetitions. | **Falsified**, measured. `forall` and `filter(...).map(...)` give the same output. |
| H4 | The quoted string of `create instance` sets only the `name` attribute. | **Falsified**, read and measured. It sets the object's own name (`data.name` and `initialName`) and also binds a script handle. It does not write the `name` attribute slot. |
| H5 | A metaclass with no `name` attribute makes `create instance ... "red"` fail. | **Falsified**, measured. Creation succeeds. Only a later `set red.name = ...` fails, with `UNKNOWN_PROPERTY`. |
| H6 | The JjTL executor converts a binding's primitive to the feature's type, or refuses a mismatch. | **Falsified**, measured on both parse paths. The value is assigned unconverted, with no warning and no error. |

## Files read (full paths)

- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjel/evaluator/evaluator.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjel/evaluator/builtins/collections.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjel/SPEC.md` (lines 219-224)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/codegen/engine/generate.ts`, `templates.ts`, `origin.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/codegen/engine/__tests__/generate.test.ts`, `budget.test.ts` (bench pattern)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjscript/parser/parser.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjscript/executor/commands/instance.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjscript/executor/handleRegistry.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjscript/executor/__tests__/m1Containment.test.ts` (bench pattern)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/model/CLAUDE.md` §3.12
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjtl/executor/executor.ts`
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/jjtl/executor/__tests__/builtin-error.test.ts` (bench pattern)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/components/project/ProjectEditor.tsx` (`writeAttribute`)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/model/logicWrapper/LModelElement.tsx` (value setter and getters)
- `/Users/alfonso/jjodel-w-book-review-checks/frontend/src/common/U.tsx` (`getFirstNumber`)

Some line references below came from an `explorer` subagent and were not re-opened in this session. Each one is marked *(agent read)*. Every line that is quoted verbatim was read in this session.

---

## Q17 — JjGen, `forall` in a template

### Answer

**In JjEL, `forall` keeps both the order of the collection and its repetitions.** It does not return a set. The result is a plain array, built by one pass over the source in its own order:
- `such that` drops the items that fail the filter.
- `: e` replaces each remaining item with `e`.
- Nothing deduplicates. Deduplication is the explicit `.distinct()`.

**In a JjGen hole it is the same.** JjGen has no loop or block form of its own. A template body is a JjEL interpolated string, and each `${...}` hole is evaluated by the same `JjelEvaluator`. So `${forall s in xs : row(s)}` iterates in order and keeps repetitions.

**`map`/`filter` are not needed for order or repetitions.** `xs.filter(x => p).map(x => e)` and `forall x in xs such that p : e` gave the same output in every case probed.

The one practical difference in a hole is the separator. A collection placed directly in a hole is rendered joined with `", "`. To get a different separator, write `.join(sep)` explicitly. That works on a `forall` result as well as on a `map` result.

Whatever order `State.allInstances` itself has, `forall` and `map` both inherit it. That order was not measured here.

### Evidence

- **Read:** `frontend/src/jjel/evaluator/evaluator.ts:1178-1194`, `evaluateForAll`:
  ```
  const results: JjelValue[] = [];
  for (const item of collection) {
  ...
      results.push(expr.projection ? this.evaluate(expr.projection, childCtx) : item);
  ```
  The filter at `:1186-1188` is `if (!this.isTruthy(passes)) continue;`. There is no Set and no membership check.
- **Read:** `frontend/src/jjel/evaluator/builtins/collections.ts:47-62` (`filter`) pushes the matching items in order. `:68-74` (`map`) is `return array.map(item => transformer.call([item], ctx));`.
- **Read:** `frontend/src/codegen/engine/origin.ts:246`, the rendering of a collection placed in a hole: `if (Array.isArray(value)) return value.map(plain).join(', ');`.
- **Read, a divergence worth knowing:** `frontend/src/jjel/SPEC.md:221-223`, the forms table, labels the return of all three forms as `Set`:
  ```
  | `forall x in S such that P` | Set | Filter: elements where P is true |
  | `forall x in S: expr` | Set | Map: transform each element |
  ```
  The code returns an ordered array with repetitions. The label describes the set-builder notation, not the runtime value.
- *(agent read)* `frontend/src/codegen/engine/generate.ts` (around lines 85-95) builds the context, sets `ctx.textHost` and runs `new JjelEvaluator(ctx)`. Holes go through `evaluateHole` (`evaluator.ts:1337-1356`).
- *(agent read)* `frontend/src/codegen/` contains no loop or block construct. The search for `forall` found only the completion and highlighting files, `target/js/printer.ts` and tests.

### Probe (measured)

The probe is `frontend/src/codegen/engine/__tests__/_tmp_book_q17_probe.test.ts`, deleted after the run.
- JjEL cases call `jjelEval(src, { xs })`.
- JjGen cases call `generate({ xs }, {}, 'm', [main, row], 'main', [])`.
- The template `main` is in `text` mode with the hole under test.
- The template `row(s)` is `state ${s.name};`.
- The input is `xs = [{name:'b'},{name:'a'},{name:'b'},{name:'c'}]`.

Output, verbatim:

```
[Q17] jjel forall x in [3,1,2,1,3] : x => [3,1,2,1,3]
[Q17] jjel forall x in xs : x.name => ["b","a","b","c"]
[Q17] jjel forall x in xs such that x.name != "c" : x.name => ["b","a","b"]
[Q17] jjel xs.filter(x => x.name != "c").map(x => x.name) => ["b","a","b"]
[Q17] jjel (forall x in xs : x.name).distinct() => ["b","a","c"]
[Q17] jjgen ${forall x in xs : x.name} => {"code":"b, a, b, c","errors":[]}
[Q17] jjgen ${forall x in xs such that x.name != "c" : x.name} => {"code":"b, a, b","errors":[]}
[Q17] jjgen ${forall s in xs : row(s)} => {"code":"state b;, state a;, state b;, state c;","errors":[]}
[Q17] jjgen ${(forall s in xs : row(s)).join("\n")} => {"code":"state b;\nstate a;\nstate b;\nstate c;","errors":[]}
[Q17] jjgen ${xs.map(s => row(s)).join("\n")} => {"code":"state b;\nstate a;\nstate b;\nstate c;","errors":[]}
```

**Limit:** the probe uses synthetic globals, as the existing `budget.test.ts` bench does. `State.allInstances` on a real model was not run.

---

## Q18 — JjScript, `create instance of State "red"`

### Answer

**The quoted string sets two things.**
1. **The new object's own name.** It is passed to `DObject.new` as the name, so it becomes `data.name`, and it is also copied into `initialName`.
2. **A script-internal handle.** `red` is registered for the rest of the run and maps to the new object's id.

**It does not write the `name` attribute slot.** The create path never looks at the metaclass attributes.
- When the metaclass has a `name : EString` attribute, that slot stays empty. The identity-slot getter then shows `initialName`. That is the reason for the `initialName` write (see the comment quoted below).
- When the metaclass has **no** `name` attribute, nothing changes: creation succeeds with no error or warning, and the string is still the object's name and the handle. The difference shows only afterwards: `set red.name = "Red"` fails with `UNKNOWN_PROPERTY`, because `name` is neither an attribute nor a reference of `State`.

**The string is usable afterwards as an identifier.** `set red.label = ...` works, and `set red.name = "Red"` works when the attribute exists. Resolution follows `resolveInstanceHandle`:
1. If `red` is a handle bound in this run, the lookup is by id, so it still works after the name changes.
2. Otherwise the model is searched by name. No match gives "No instance named". Two or more matches give `AMBIGUOUS_INSTANCE`, and the write is refused.

Two more rules:
- A second `create ... "red"` in the same run is refused with `HANDLE_IN_USE`.
- The unquoted form `create instance of State blue` is accepted and behaves the same way.

### Evidence

- *(agent read)* Parser, `frontend/src/jjscript/parser/parser.ts:393-395`. The name, quoted or bare, goes to `options.defaultValue = { kind: 'string', value }`. Any other trailing token is refused (`:318-322`).
- **Read:** `frontend/src/jjscript/executor/commands/instance.ts:613-617`:
  ```
  const className = args.name;  // grammar: create instance <ClassName> ["<name>"]
  const explicitInstanceName =
      args.options?.defaultValue?.kind === 'string'
  ```
- **Read:** `instance.ts:709-725`. The name goes to `DObject.new(metaclass.id, ..., instanceName, true)`, followed by:
  ```
  // Apply the explicit instance name to initialName as well. DObject.new always
  // stamps initialName with the auto default (<Class>_<N>), and the M1 identity-slot
  // value getter (LModelElement.tsx ~7280) surfaces initialName BEFORE data.name for an
  ```
  and `(dObject as any).initialName = explicitInstanceName;`.
- **Read:** `instance.ts:737-738`, the handle:
  ```
  // Bind the creation handle to the stable DObject id for the rest of the run.
  registerHandle(instanceName, dObject.id);
  ```
- **Read:** `instance.ts:693-703`, the duplicate check: `if (hasHandle(instanceName)) {` returns `code: 'HANDLE_IN_USE'`.
- **Read:** `instance.ts:246-261`, `resolveInstanceHandle`:
  ```
  const id = getHandleId(handle);
  if (id) {
      const obj = LPointerTargetable.fromPointer(id) as any;
      if (obj && obj.id) return { ok: true, value: obj }; // registry wins: id-based, race-free
  ```
  Then `findInstanceByName`. One match succeeds, zero gives "No instance named", and two or more return the candidates (ambiguous).
- **Read:** `instance.ts:1064-1074`, `set` on a property the metaclass does not have: `code: 'UNKNOWN_PROPERTY'`, `'${args.property}' is neither an attribute nor a reference of '...'`.
- **Read:** `instance.ts:1112-1125`. An attribute `set` writes through the `$`-proxy: `featureProxy.value = primitive`. With a `name : EString` slot, `frontend/src/model/CLAUDE.md` §3.12 says that the slot write propagates onto `data.name`.
- *(agent read)* `frontend/src/jjscript/__tests__/handleRegistry.test.ts:62-77`. After `set x.name = ...` in the same run, the handle still resolves. The registry is cleared at `EXECUTION_START`, so a later run resolves by the current name only.

### Probe (measured)

The probe is `frontend/src/jjscript/executor/__tests__/_tmp_book_q18_probe.test.ts`, deleted after the run.
- It uses the mocks of `m1Containment.test.ts`, with the joiner reduced to an in-memory store and the real parser and handlers.
- The metaclass `State` has the attribute `label` and no `name`.
- The metaclass `Named` has `name` and `label`.
- Each created object gets one recording `$`-proxy per attribute.

Output, verbatim:

```
[Q18] create instance of State "red" => {"success":true,"message":"Created instance 'red' of State"} | DObject.new name="red" initialName="red" | handle=new1
[Q18] create instance of Named "green" => {"success":true,"message":"Created instance 'green' of Named"} | DObject.new name="green" initialName="green" | handle=new2
[Q18] create instance of State blue => {"success":true,"message":"Created instance 'blue' of State"} | DObject.new name="blue" initialName="blue" | handle=new3
[Q18] create instance of State "red" => {"success":false,"message":"Handle 'red' already used in this script","code":"HANDLE_IN_USE","error":"The instance handle 'red' is already bound in this run. Use a different handle; the 'name' attribute can still be set to any (even duplicate) value afterwards."} | DObject.new name=undefined initialName=undefined | handle=new1
[Q18] set red.name = "Red" => {"success":false,"message":"Property 'name' is not a feature of class 'State'","code":"UNKNOWN_PROPERTY","error":"'name' is neither an attribute nor a reference of 'State'"} | writes on $name=undefined
[Q18] set red.label = "Red" => {"success":true,"message":"Set red.label = \"Red\""} | writes on $label=["Red"]
[Q18] set green.name = "Green" => {"success":true,"message":"Set green.name = \"Green\""} | writes on $name=["Green"]
[Q18] set green.label = "G" => {"success":true,"message":"Set green.label = \"G\""} | writes on $label=["G"]
[Q18] set blue.label = "B" => {"success":true,"message":"Set blue.label = \"B\""} | writes on $label=["B"]
[Q18] set nobody.label = "x" => {"success":false,"message":"Instance 'nobody' not found","code":"INSTANCE_NOT_FOUND","error":"No instance named 'nobody' in 'M1'"} | writes on $label=undefined
```

**Limit:** the joiner is mocked. The propagation from the slot to `data.name` (§3.12) and the identity-slot getter were read, not run. The `create` lines show no write on the `$name` proxy of `green`, which confirms that `create` does not touch the slot.

---

## Q19 — JjTL, coercion in a `:=` binding

### Answer

**The executor assigns the value unconverted.** It does not refuse the binding. It emits no warning to `warnings`, no entry in `errors` and no console message. This holds on both parse paths:
- the legacy path: `new JjtlParser(tokens)`, with native expression AST;
- the JjEL path: `new JjtlParser(tokens, source)`, which is the one the app uses.

In the executor:
- Attributes are indexed with no type, so there is nothing to compare against.
- The binding is written by a plain property assignment on the in-memory target instance.

Downstream, the write-back to the real model passes the value as it is to `feature.value`. There the L-layer setter is deliberately loose ("will cast on get"), and the cast happens when the value is read.

| Target feature | Source value | Executor stores (measured, both paths) | Warning / error | L-layer read of the stored raw (read, not run) |
|---|---|---|---|---|
| EString | `42`, `c.n` (int) | number `42` | none | `v ? v + '' : ''` gives `"42"`. Note: `0` reads `""`. |
| EString | `true`, `c.flag` | boolean `true` | none | `"true"`. Note: `false` reads `""`. |
| EString | `3.7` | number `3.7` | none | `"3.7"` |
| EInt | `"42"`, `c.k` | string `"42"` | none | `numbercasting`, then `U.getFirstNumber`, gives `42` |
| EInt | `"abc"`, `c.t` | string `"abc"` | none | `getFirstNumber` returns `null`, which is clamped to `0` |
| EInt | `3.7`, `c.x` | number `3.7` | none | rounded, `4` |
| EInt | `true` | boolean `true` | none | `numbercasting` returns `NaN` (a non-string, non-number value) |
| EBoolean | `1` | number `1` | none | `U.fromBoolString("1", ...)` (not traced further) |
| EBoolean | `"false"`, `"yes"` | the string as given | none | `U.fromBoolString(...)` (not traced further) |
| EDouble | `"3.5"` | string `"3.5"` | none | `getFirstNumber` gives `3.5` (no rounding) |
| EDouble | `7` | number `7` | none | `7` |

### Evidence

- **Read:** `frontend/src/jjtl/executor/executor.ts:2099-2103`, in `executeAttributeMappingWithTrace` (`:2048`):
  ```
  const resolved = await this.resolveBinding(value, mapping.targetAttribute, targetInstance);

  // Set target attribute
  const finalValue = fromJjelValueKeepingTargets(resolved);
  targetInstance[mapping.targetAttribute] = finalValue;
  ```
  The same two lines appear in `executeAttributeMapping` (`:2273`, write at `:2329-2330`) and in the third binding site at `:2899-2900`.
- *(agent read)* `executor.ts:941`. Attributes are indexed as `{ name, isReference: false }` with no type. `featureTypeOf` (`:3487`) reads `.typeName`, which is filled for references only (`:947-951`). The only check made per binding is `warnUndeclaredBinding` (`:1138`), which covers a feature that does not exist, not a type.
- **Read:** `frontend/src/components/project/ProjectEditor.tsx:2194` (`writeAttribute`) and `:2216-2217`:
  ```
  if (Array.isArray(attrValue)) feature.values = attrValue;
  else feature.value = attrValue;
  ```
- **Read:** `frontend/src/model/logicWrapper/LModelElement.tsx:7991`, in the value setter: `// loose checks, i can assign any primitive to any primitive (will cast on get)`. The only primitive refused nearby is a Date assigned to a non-string, non-date type (`:7994-7998`).
- **Read:** `LModelElement.tsx:7651-7662`, `numbercasting`, quoted from its first lines:
  ```
  if (typeof v !== "number") {
      if (!v) v = 0;
      else if (v === "true") v = 1;
  ```
  It is followed by `getFirstNumber` for strings, `return NaN` for other values, the clamp, and `round ? Math.round(v) : v`.
- **Read:** `LModelElement.tsx:7787`, the EString read: `mapperfunc = v => v ? v + '' : ''`.
- **Read:** `LModelElement.tsx:7817`, the EBoolean read: `mapperfunc = v => typeof v === "boolean" ? v : U.fromBoolString(v+'', v?.length>0, false);`.
- **Read:** `frontend/src/common/U.tsx:1882-1898`, `getFirstNumber`: the first numeric match, or `valueifmismatch`, which defaults to `null`.

### Probe (measured)

The probe is `frontend/src/jjtl/executor/__tests__/_tmp_book_q19_probe.test.ts`, deleted after the run.
- The bench is the one of `builtin-error.test.ts`, with the joiner mocked for `U.asNumber` only and the lexer, parser and executor unstubbed.
- The target class `T` has the attributes `s:EString`, `i:EInt`, `b:EBoolean` and `d:EDouble`. The type is given as `type.name`, `eType` and `typeName`, so an executor that looked at it could find it.
- The source is `{ n: 42, t: 'abc', k: '42', flag: true, x: 3.7 }`.
- The rule is `Core c -> T { <f> := <e> }`, with one case per run and both parse paths.

Output, verbatim. The `jjel` lines were identical to the `legacy` lines, case for case; three are shown.

```
[Q19] legacy s:EString := 42 => number 42 | success=true errors=[] warnings=[]
[Q19] legacy s:EString := c.n => number 42 | success=true errors=[] warnings=[]
[Q19] legacy s:EString := true => boolean true | success=true errors=[] warnings=[]
[Q19] legacy s:EString := c.flag => boolean true | success=true errors=[] warnings=[]
[Q19] legacy s:EString := 3.7 => number 3.7 | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := "42" => string "42" | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := c.k => string "42" | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := "abc" => string "abc" | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := c.t => string "abc" | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := 3.7 => number 3.7 | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := c.x => number 3.7 | success=true errors=[] warnings=[]
[Q19] legacy i:EInt := true => boolean true | success=true errors=[] warnings=[]
[Q19] legacy b:EBoolean := 1 => number 1 | success=true errors=[] warnings=[]
[Q19] legacy b:EBoolean := "false" => string "false" | success=true errors=[] warnings=[]
[Q19] legacy b:EBoolean := "yes" => string "yes" | success=true errors=[] warnings=[]
[Q19] legacy d:EDouble := "3.5" => string "3.5" | success=true errors=[] warnings=[]
[Q19] legacy d:EDouble := 7 => number 7 | success=true errors=[] warnings=[]
[Q19] jjel   s:EString := 42 => number 42 | success=true errors=[] warnings=[]
[Q19] jjel   i:EInt := "abc" => string "abc" | success=true errors=[] warnings=[]
[Q19] jjel   d:EDouble := 7 => number 7 | success=true errors=[] warnings=[]
```

The binding ran in every case: each line shows a value, not `undefined`. That is the positive control for the claim that no warning was emitted.

**Limit:** the L-layer read column comes from reading the code. It needs the store and was not run under node. The `EBoolean` read through `U.fromBoolString` was not traced.

---

## Dependencies and risks

- Q17: `SPEC.md:221-223` labels the `forall` forms `Set` while the runtime value is an ordered array with repetitions. A reader of the SPEC, or of the book if it quotes the SPEC, can draw the wrong conclusion. Nothing was changed: the lane is read-only on this point.
- Q19: an ill-typed binding is silent end to end. The book can state that as the current behaviour. It is not a refusal and not a conversion, and it surfaces only as a coerced value on read (`"abc"` read as EInt gives `0`, `true` gives `NaN`).
- Q18: with a `name` attribute present, the quoted string does not fill the slot. The displayed name comes from `initialName` through the identity-slot getter. That is consistent with §3.12, but a book sentence such as "sets the name attribute" would be imprecise.

## Open questions

1. Should `jjel/SPEC.md:221-223` say "Sequence" or "ordered collection" instead of `Set`, in a lane of its own?
2. Should JjTL warn on a primitive binding whose type differs from the feature's declared type (a ticket, not opened here)?
3. Should `create instance of C "x"` also write the `name : EString` slot when the metaclass has one, rather than relying on `initialName`?

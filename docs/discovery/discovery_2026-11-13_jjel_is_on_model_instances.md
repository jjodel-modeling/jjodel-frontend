# Discovery: JjEL `is` on model instances

- Prompt-ID: P-2026-11-13-1305 (Front: maintenance, chat C-2026-11-12-1346)
- Prompt file: `docs/prompts/claude_2026-11-13_1305_prompt_jjel_is_on_instances_discovery.md`
- Session: `a08f97ee-053c-4e01-b19c-5f87d4c245d5`
- Tree: `~/jjodel-w-jjel-is`, branch `jjel-is-instances`, HEAD `145921db6`, clean at start
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`), effort xhigh
- Phase 1, read-only on product code. This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the real files.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | `is` works on model instances in some context the 1246 measure did not look at | **Falsified.** In every context that passes `buildEvalContext` records (validation, JjScript `eval`/`let`/`forall`, Jjodie, JjGen, STC guard, generated JavaScript), `o is Sub` is `false` even for the exact class; the IR refuses `is` outright. Two cases answer something else: on the Console's L proxy `is` answers only `DObject`, and in JjTL it is exact-class. None of them is kind-of (§3) |
| H2 | Some production code fills `TypeRegistry`, so the `superTypes` branch of `isInstance` runs somewhere | **Falsified.** No production caller of `register` exists (§4.1) |
| H3 | SPEC promises kind-of on model instances | **Holds.** `SPEC.md:421` (§2) |
| H4 | A kind-of `is` can be built without the critical zone or an exported interface | **Holds** for every context except JjTL, from `TypeRegistry.isInstance` alone (§6). JjTL source records carry no hierarchy (§3.3) |

## 2. What SPEC and the help pages say (read)

- `frontend/src/jjel/SPEC.md:62-69`, §2 "Type Hierarchy (for `is` operator)": "The `is` operator checks type membership including supertypes:", then primitive aliases, `Array`/`List`/`Collection`, "`Object`, `Null`", `BitVector`, "JjOM types: `DClass`, `DPackage`, `DEnumerator`, etc."
- `frontend/src/jjel/SPEC.md:421`, §5.8: "Checks whether the value is an instance of the given type, including subtypes (kind-of semantics)." Its examples are `element is DClass` and `element is DPackage` (`:425-426`). It has no example on an M1 instance and nothing on null.
- In-app help. `docs/help/reference/jjel.md:15` lists `is` among the operators with no semantics. `frontend/src/jjel/autocomplete/providers/keyword.ts:38` describes it only as `'Type check'`. `frontend/src/jjel/lexer/lexer.ts:19-20` gives the same hint for both OCL tests: "JjEL uses 'expr is Type', not 'expr.oclIsTypeOf(Type)'" and the same for `oclIsKindOf`. That is the open ticket at `docs/log-inbox/maintenance.md:1062`, which lane 1246 covers.
- `docs/help/simulation/simulation-semantics.md:193` names `W-IS` among the checker's warnings.
- Read, not in SPEC: `x is Null` **does not parse**. `frontend/src/jjel/parser/parser.ts:351` reads `this.consume(JjelTokenType.IDENTIFIER, "Expected type name after 'is'")`, and the lexer lowercases before the keyword lookup, so `Null` becomes the `NULL` token (`lexer.ts:643`). Measured: `null is Null` throws "JjEL parse error: Expected type name after 'is'". So the `case 'Null'` at `context.ts:149-150` cannot be reached from source text.

## 3. Measures, context by context

Probe: `docs/discovery/harness/_tmp_is_probe.test.ts`, run with `_tmp_is_probe.vitest.mts`. Both are gitignored, not committed, measured on `145921db6`. The metamodel has `Base`, `Sub extends Base`, `Leaf extends Sub`, and an unrelated `Other`. The instances are `o: Sub`, `b: Base`, `l: Leaf` and `u: Other`. The real `buildEvalContext` (`frontend/src/jjscript/executor/commands/eval.ts:128`) ran under the mocks of `classShellFlags.test.ts:21-39`, and its output was handed to each context's real evaluator.

The handle that `buildEvalContext` builds for an instance (measured): `__type: 'Object'`, **no `className`** (`eval.ts:583-590`), and `instanceOf` set to the shared class shell `Sub`. That shell's `superTypes` holds the `Base` shell (`eval.ts:176-187`). `superTypes` holds direct supertypes only, read from `extends` (`eval.ts:446-452`).

| Context | Builder and value passed | `TypeRegistry` | instance of `T` | subclass of `T` | unrelated | not a class |
|---|---|---|---|---|---|---|
| Validation rule | `validationContext.ts:159` `buildEvalContext(..., { extentModelId })`, `self` = pool handle (record) | empty | **false** (`b is Base`, rule violated) | **false** (`o`, `l is Base`) | false | false |
| View predicate (IR) | does not go through the evaluator: `pathExpr.ts:21` only parses paths | n/a | refused: `[ir] invalid PathExpr step "self is Base"` | same | same | same |
| Console, JjEL mode | `Console.tsx:679-690`: `data` = the selected **L proxy**, plus flattened props | empty | **false** (`data is Sub`) | **false** | false | false. `data is DObject` is **true**: `className` is the D-name (root CLAUDE.md §3.13) |
| Console JjScript `eval`, Jjodie, JjScript `let` | `buildEvalContext` (`eval.ts:32`, `jodieJjelContext.ts:40`), record | empty | **false** (`o is Sub`) | **false** (`o`, `l is Base`) | false | false |
| JjScript `forall ... such that` | `forall.ts:32,52-57`, `{...evalVars, x: element}`, record | empty | **0 matched** for `x is Sub` | **0 matched** for `x is Base` | | |
| JjTL `where` / binding | `ProjectEditor.tsx:1571-1576` plain record `{ id, name, className: 'Sub', __type: 'Sub', ... }`, real `execute` | empty | **true**: `Sub s2 -> Out2 where s2 is Sub` produced Out2 with `a := s2 is Sub` = true | **false**: `Sub s -> Out where s is Base` produced nothing | | |
| JjGen hole | `generate.ts:100-106` `new EvaluationContext({ ...globals, ... })`, record | empty | **false** | **false** | | |
| STC guard (evaluator) | `freezeSnapshot` + `buildGuardContext` (`guardContext.ts:129,186`), `self` = record | empty | `{ kind: 'false' }` | `{ kind: 'false' }` | `{ kind: 'false' }` | |
| STC action (evaluator) | `actionEvaluator.ts:188`: the same `buildGuardContext` | empty | same evaluator and same context as the guard; **not measured separately** | | | |
| Generated JavaScript | `printer.ts:781` `printGuard`; `self` does not depend on the step, so it folds (`printer.ts:709`) | — | `{ ok: true, code: "false" }` | `{ ok: true, code: "false" }` | | |
| Subset checker | `subsetChecker.ts:353-354` | — | `W-IS` warning: "`is` is false on model instances: write `self.instanceOf == Base`." | | | |

The probe's positive controls had signal on the same records. `o is Object` is true, `Sub is Class` and `Sub is DClass` are true, `"s" is String` is true, and `o.instanceOf == Sub` is true.

Read for the generated JavaScript: `is` over a value known only in the step (`event`) is refused as `P-STEP` (`printer.ts:746-747`: `case 'IsType': return step('`is`')`). Otherwise `is` is folded over M by the evaluator, so a fix in the evaluator reaches the JavaScript with no printer change.

### 3.1 Why the evaluator answers false (read)

`evaluator.ts:1099-1101`: `evaluateIsType` → `ctx.typeRegistry.isInstance(value, expr.targetType)`. In `context.ts:95-154`:
- `:104-111` matches `__type`. On an instance that is `'Object'`, so it matches only `is Object`.
- `:114-121` matches `className`. The record has none, and the L proxy has `'DObject'`.
- The `superTypes` lookups at `:109-110` and `:119-120` read the registry, which is empty everywhere (§4.1). Even if it were filled, `.includes` would go only one level up.
- Nothing reads `instanceOf`.

### 3.2 Console JjEL mode (measured on a stand-in)

The joiner does not load under the node bench, so the probe used a JS `Proxy` over `{ className: 'DObject', instanceof: <LClass stand-in with name and extends> }`. A real `LObject` also exposes `instanceof` (lowercase) and `className` `'DObject'`, and its class's `extends` is read in production by `eval.ts:448` (`cls.extends || cls.extend || cls.superClasses`). That production read is the evidence that the walk below would find the parents on an L proxy. The stand-in itself proves nothing about the real joiner. The real check is a check in the app (§6, visual).

### 3.3 JjTL (measured)

Source elements are plain records whose `className` and `__type` are the M2 class name (`ProjectEditor.tsx:1574-1575`). So `is` is exact-class there by accident of the `__type` branch (`context.ts:106`). The records carry no supertypes, the executor does not receive the source metamodel (`executor.ts:4840-4848`, `execute(ast, sourceModel, targetMetamodel?)`), and it registers no types. JjTL matching is exact by design. `jjtl/SPEC.md:147` says: "Exact class name match (string equality on `className` or `__type`). No inheritance-based matching".

## 4. Mechanisms that include subclasses, and where exact is the rule

| Mechanism | Verdict | Evidence |
|---|---|---|
| Validation scoping | kind-of | `validationContext.ts:134`: `for (const s of (cls.allSuperClasses ?? [])) push(s?.id)`. `validationEvaluator.ts:271`: `const chain = new Set(instance.classChain)` |
| JjGen template dispatch | kind-of | `codegen/engine/dispatch.ts:8-9`: "the one whose type is the most specific supertype (or the class itself)". Holes: `codegen/stcAccess.ts:165`, `ids.filter(id => isKindOf(lookup, id, cls))` |
| STC roles / simulation | kind-of | `model/simulation/isKindOf.ts:26-50`: walks `lookup[cid]?.extends` transitively and cycle-safe. Used by `codegen/target/js/access.ts:145`, `stcFromRoles.ts:63` |
| IR view matching | kind-of | `components/editor-v2/viewpoint/ir/irReadCtx.ts:136` `classAncestry`, `:233` `classAncestryNames(idlookup, cid).includes(className)` |
| `T.allInstances` | kind-of | `eval.ts:229-233,245-246` (`subclassNames` from `cls.allSubclasses`) |
| `T.instances` | exact | `eval.ts:242-243`: `if (instType === cName) { instances.push(sharedJjel);` |
| JjTL rule matching | exact | `jjtl/SPEC.md:147`. `executor.ts:1541`: buckets keyed by `inst.className \|\| inst.__type` |
| `instanceOf ==` | exact | identity of the shared class shell (`eval.ts:156`, "so `obj.instanceOf == Person` works") |
| JjEL `is` today | neither: false on instances, exact in JjTL | §3 |

Every mechanism that answers "is this element a T" in the product is kind-of, except the two that are explicitly exact (`T.instances`, JjTL matching). A kind-of `is` agrees with validation, JjGen, STC roles, the IR and `allInstances`.

### 4.1 Absence of a registry filler (read, with control)

`command grep -rn -E "TypeRegistry|typeRegistry" frontend/src` with `__tests__` and `context.ts` excluded returns only `evaluator.ts:1101`, `jjel/evaluator/index.ts:8` and `jjel/index.ts:47` (exports). The same grep did find the one consumer, `evaluator.ts:1101`, which serves as the positive control. `new TypeRegistry()` appears only at `context.ts:426`.

## 5. Who relies on the present answer

Found by an explorer subagent, with the lines re-read in this session:

- `frontend/src/model/simulation/__tests__/guardEvaluator.test.ts:105-107`: `compileGuard('self is Transition')` → `['W-IS']`, and `expect(run('self is Transition')).toEqual({ kind: 'false' })`. It **changes** to `{ kind: 'true' }`.
- `frontend/src/codegen/target/js/__tests__/printer.test.ts:218-220`: "IsType on M folds (W-IS stays a warning)", `expect(agreed('(self is Transition) == model.[f]')).toBe(false)`. **Probably changes.** It compares the printer with the evaluator, so both move together. The test name and its literal `false` need a rewrite.
- `frontend/src/model/simulation/__tests__/subsetChecker.test.ts:150-155` ("W-IS: `is` on instances", message contains `self.instanceOf == Transition`) and `:191-194` (`bySeverity` expects `warning: 'W-IS'`). These **change** if `W-IS` is removed.
- `subsetChecker.ts:354` and `docs/help/simulation/simulation-semantics.md:193` give the message and its documentation.
- Unaffected: `jjel/__tests__/bitvector.test.ts:368-370` (BitVector), `parser.test.ts:140,536,588`, `jjtl/__tests__/astBridge.test.ts:307-316`, and `lexer-own-keys.test.ts:61-62`, which is lane 1246's hint.
- Fixtures and demos: no ` is <Class>` on an instance in `frontend/public/examples/codegen/*.jjodel`, in `frontend/src/codegen/examples/*/*.json`, in `docs/` or in `docs/demo/models_2026_simulator_demo.md`. The positive controls hit: `default-text.generator.json:34,131` uses `is Array`, which stays primitive, and `Transition` occurs 19 times in the MODELS demo file. **No demo expression changes value.**

## 6. Proposed fix

**Where.** In `TypeRegistry.isInstance` (`frontend/src/jjel/evaluator/context.ts:95`), between the `className` branch and the primitive switch. It is not in the evaluator's `is` case and not in the context builders, which already hand every instance with its class shell and the direct `superTypes`.

```ts
// A model instance is a T when its class, or a supertype of it, is named T (kind-of, SPEC §5.8).
if (isJjelObject(value) && (value.__type === 'Object' || value.className === 'DObject')
    && classChainNamed((value as any).instanceof ?? (value as any).instanceOf, typeName)) return true;
```

A module-level helper of about 10 lines does a cycle-safe breadth-first walk over `c.superTypes ?? c.extends`, comparing `c.name === typeName`. It reads the shell on records and the LClass getter on L proxies. It writes nothing and does not touch `className` (§3.13 untouched). The guard on `__type === 'Object'` / `'DObject'` keeps class shells out, so `Sub is Base` stays false and `Sub is DClass` stays true. Names match by name, like JjTL and the IR.

**Files.**
1. `frontend/src/jjel/evaluator/context.ts` (the branch and the helper).
2. `frontend/src/model/simulation/subsetChecker.ts:353-356`: drop the `W-IS` report, keep `plain(e.expression)`.
3. Tests (below).
4. Docs, in a separate commit (P13): `SPEC.md` §2 and §5.8 (one sentence on instances, and `Null` not parsing), and `docs/help/simulation/simulation-semantics.md:193`.

No file of the critical zone (CLAUDE.md §3.1/§3.2), no exported interface and no grammar change. `evaluator.ts` and `printer.ts` are untouched.

**Tests first, red on this tree.** A new `frontend/src/jjel/__tests__/is-kind-of.test.ts` over hand-made shells covers:
- exact → true; subclass → true; grandchild → true (transitive);
- unrelated → false; unknown name → false;
- a `superTypes` cycle terminates; `Sub is Base` on a class shell → false; `Sub is DClass` → true; primitives unchanged;
- an L-proxy stand-in: `data is Base` → true and `data is DObject` → true.

One case runs through the real `buildEvalContext` under the mocks of `classShellFlags.test.ts`, which fixes the record shape. Then the four pinned assertions of §5 are updated.

**Mutation bench.** Dropping the walk (exact only) kills the subclass and grandchild tests. Dropping `seen` makes the cycle test hang. Dropping the `.extends` fallback kills the L-proxy test. The `__type` guard is declared intent: class shells carry no `instanceof`, so no output distinguishes it (CLAUDE.md §5, last sub-rule).

**Negative control.** `o is Other`, `o is Nope` and `Sub is Base` stay false. On the unfixed tree the new tests are red and the probe reproduces §3.

**Visual check.** None on rendering. One check in the app is due for the Console's JjEL mode, `data is <superclass>` on a selected instance, because the L-proxy path is only measured on a stand-in (§3.2).

**Generated JavaScript.** No change. It folds `is` through the evaluator (§3), so `self is Base` prints `true` after the fix. `is` on `event` stays `P-STEP`.

**JjTL is not reached by this fix.** Its records have no `instanceOf` and no hierarchy (§3.3). Reaching it would need the source-record serializer in `ProjectEditor.tsx:1571` to carry the ancestor names, with the executor's copies keeping them. That changes the shape of JjTL source elements, outside this prompt (Q3).

## 7. Dependencies and risks

- **Overlap with lane P-2026-11-13-1246** (branch `jjel-and-or`, uncommitted work in `~/jjodel-w-jjel-bookfix`, read with `git status --short` only). Its working tree modifies `codegen/target/js/printer.ts`, `printer.test.ts`, `jjel/evaluator/evaluator.ts`, `model/simulation/__tests__/guardEvaluator.test.ts` and `subsetChecker.test.ts`, and per its prompt `subsetChecker.ts`. This fix touches `subsetChecker.ts` (one case) and the three test files of §5. The textual conflict is likely small, but the same test files move in both lanes. `context.ts` is not in its set.
- The user-visible value changes from false to true for `is <class or superclass>` on instances. No demo or fixture uses it (§5), and validation rules a user wrote with `is` would start passing. That is the intended effect, and not measurable on user projects from here.
- A user class named like a builtin (`String`, `Object`) now matches by name on an instance. `o is Object` was already true.
- JjTL and the rest would still disagree after the fix: `is Base` on a `Sub` source element stays false in JjTL.

## 8. Open questions

1. Is the fix of §6 (`TypeRegistry.isInstance`, records and L proxies) approved for Phase 2?
2. Should `W-IS` be removed rather than reworded, since after the fix there is nothing to warn about?
3. Should JjTL `is` stay exact for now, stated in SPEC and in a ticket, rather than carried in this lane?
4. Should Phase 2 wait for `jjel-and-or` to merge into the trunk, and rebase on it, given the shared test files?
5. Should `x is Null`, which does not parse, go in a ticket and in a SPEC note only, with no fix here?

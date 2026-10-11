# Discovery — JjEL: a multi-valued feature navigates to its first value

Prompt-ID: P-2026-10-12-0120 · prompt `docs/prompts/claude_2026-10-12_0120_prompt_jjel_multivalued_navigation.md`
Session: 7c761f86-d9bb-4d58-a1af-de03b52d0a96 · tree `~/jjodel-w-jjelmulti`, branch `jjel-multivalued`, HEAD `0c8a1832f`
Model: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)

This report is a set of hypotheses with evidence (P4), not a reference: whoever uses it re-reads the files.
Every claim is tagged **measured** (run in this phase, on `0c8a1832f`) or **read** (a file, at that HEAD).

## 0. Answer in brief

- **Where it collapses.** In one shared function, `extractAttributeValues`
  (`frontend/src/jjel/evaluator/modelContext.ts:73`, and `:51` for `$`-keyed own properties), which reads
  `$f.value` for every feature whatever its upper bound. `LValue.get_value` is `get_values(...)[0]`
  (`LModelElement.tsx:7550-7552`), so a multi-valued feature yields its first value, and an empty one yields
  `undefined` and is left unbound. Before the evaluator, as the chat read it.
- **Who collapses (measured on the live app, probe of §4).** The Jodie JjEL console (`self` = `data` =
  `wrapSelectedElement`, the console of the report) and the classic Console (bare feature names). The table of the
  report is reproduced cell for cell. **Not** collapsing: the pool handles (`instances`, bare instance names,
  `Class.instances`), hence validation, simulation guards/actions/derived, codegen: they are filled by
  `fillInstanceSlots`, which already decides on the declared upper bound (`eval.ts:659-661`, since `31bdbfe06`,
  2026-06-12).
- **A second collapse, separate.** JjTL's real source builder (`ProjectEditor.tsx:1540-1546`) shapes each
  feature by the **number** of values: 0 → `null`, 1 → the value, n → array. It does not go through
  `extractAttributeValues`, so the fix of the shared layer does not reach it. Out of this lane's files; awaiting
  Alfonso (Q1).
- **Not intended.** No R- row, SPEC section or ratification makes the first value the meaning of a multi-valued
  navigation (§6). The 2026-06-11 discovery left «`data` via `$ref.value`» explicitly unverified.
- **Multiplicity today.** Pool handles and the canvas decide on the declared upper bound
  (`eval.ts:661`; `jjomTransformers.ts:345`, the `[n]` counter shows `held.length` only when `isMany`). The
  `self`/`data` wrapper decided nothing (always `.value`), JjTL decides on the count.
- **Recommendation.** Fix `extractAttributeValues` once: the declared upper bound picks `.values` (array, slot
  order, `[]` when empty) or `.value` (`null` when empty and the name is not already bound). The census (§5) finds
  no shipped expression iterating a non-collection, so the two `forall`/`exists` guards go in too; the codegen
  printer keeps a `false` on that defect (`printer.ts:409`, Q4).

Decisions taken (unattended) and awaiting Alfonso: §9.

## 1. Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The collapse happens where the host object `self` is built, before the evaluator | **holds** (measured, §2) |
| H2 | `getProperty` passes `obj[property]` through unchanged | **holds** (read, `evaluator.ts:529-532`) |
| H3 | Every reader of the list collapses | **falsified**: two collapse via this path, JjTL by its own builder, the rest are correct (measured, §4) |
| H4 | The collapse is intended by a ratified decision | **falsified** (read, §6) |
| H5 | Multiplicity is decided by the declared upper bound | **partly**: pool and canvas yes, `self`/`data` never, JjTL by count (§3) |
| H6 | A `forall`/`exists` over a non-collection hides the bug | **holds** (measured: `(forall s in self.subTransitions ...)` is `[]` on Region_0) |

## 2. The path of `self`, from the console to the evaluator (read; confirmed measured)

1. `components/Jodie/console/providers/jjelProvider.ts:19` — `? evaluateJjelInJodie(input)`
2. `components/Jodie/jodieJjelContext.ts:39` — `const variables = buildEvalContext(ctx);` and `:43-44`
   `if ('data' in variables) { variables.self = variables.data; }`
3. `jjscript/executor/commands/eval.ts:330-331` — `const me = LPointerTargetable.fromPointer(selectedMeId) as any;`
   / `if (me) variables['data'] = wrapSelectedElement(me, classByName, instanceById, fillWorklist);`
4. `eval.ts:928-939` (`wrapSelectedElement`) copies every own key of the L-proxy: `keys = Reflect.ownKeys(me);` …
   `result[key] = v;`. Measured on Region_0: 130 own keys, `features` among them, **no `$` key**; `'subVertices' in
   lobj` is `false` and `lobj.subVertices` returns the slot (`LValue`) itself.
5. `eval.ts:945` — `extractAttributeValues(me, result);`
6. `jjel/evaluator/modelContext.ts:63-76` (Strategy 2, the one that fires: Strategy 1 at `:41-60` iterates `$`
   own keys and finds none on a real L-proxy):
   ```
   const features = context.features;
   if (Array.isArray(features)) {
       for (const feature of features) {
           ...
               const dollarProp = proxy['$' + fname];
               if (dollarProp != null && typeof dollarProp === 'object' && 'value' in dollarProp) {
                   const val = dollarProp.value;
                   if (val !== undefined) {
                       context[fname] = val;
   ```
7. `model/logicWrapper/LModelElement.tsx:7550-7552` — `get_value` is
   `return this.get_values(context, true, namedPointers, ecorePointers, shapeless, keepempties, withmetainfo, 1)[0] as any;`
   Measured on Region_0: `$subVertices.value` = `{InitialState_0}`, `.values` = `[{InitialState_0}, {State_0}]`,
   `$subVertices.instanceof.upperBound` = `-1`, `className` `DReference`.
8. `jjel/evaluator/evaluator.ts:529-532` — `if (property in obj) { const value = obj[property] ?? null;
   ctx.readObserver?.(obj, property, value); return value; }` passes it through.
9. `evaluator.ts:937-938` — `if (!Array.isArray(collection)) return [];` and `:955-956`
   `if (!Array.isArray(collection)) return false;` turn the single object into an empty result.

The collapsing line is `modelContext.ts:73` (`const val = dollarProp.value;`), with its twin `:51` for objects
that do carry `$` own keys (plain test doubles, older shapes).

The pool handle of the same object is filled by `fillInstanceSlots` (`eval.ts:659-661`):
```
let ub: any;
try { ub = meta?.upperBound; } catch { ub = undefined; }
const isMany = ub === -1 || ub === '*' || (typeof ub === 'number' && ub > 1);
```
and `eval.ts:679` `handle[fname] = isMany ? resolved : (resolved.length ? resolved[0] : null);`. `wrapSelectedElement`
never calls it on `data`: the selected element is a second, shallower wrapper of an object that also sits in the
pool (`Region_0.subVertices.size` is `2` in the same context where `self.subVertices.size` is `null`).

## 3. Scope: which features, how multiplicity is decided (measured)

Fixture built by the probe (§4), D-layer asserted 13/13 before any reading: multi-valued containment
(`StateMachine.regions`, `Region.subVertices`, `Region.subTransitions`), multi-valued non-containment
(`State.outgoing`), multi-valued attribute (`State.tags : EString[*]`), single-valued non-containment
(`Transition.source`, `Transition.target`), with 0, 1 and 2 values.

On `self`/`data` the collapse covers **all three kinds**, containment or not, reference or attribute, and every
count: 2 values → the first; 1 value → the object, not a list of one; 0 values → absent (`null` with a
`property-not-found` warning, and `.size` on it throws «Cannot access property 'size' of null»). A single-valued
feature with 1 value is right; with 0 it reads `null` but with a spurious `property-not-found` warning (the pool
gives `null` and no warning).

M2 navigation (a class's `attributes`, `references`) is not this path: when the selected element is a metaclass,
`wrapSelectedElement` overwrites those keys from the class shell (`eval.ts:971-985`, `result.attributes =
classPlainObj.attributes ?? [];`), arrays by construction (read).

How multiplicity is decided today:

| Where | Rule | Evidence |
|---|---|---|
| Pool handle (`fillInstanceSlots`) | declared upper bound, `-1`/`*`/`>1` | `eval.ts:661` (read), measured above |
| Canvas row and `[n]` counter | declared upper bound, `ub !== 1`; the counter shows `held.length` | `utils/jjomTransformers.ts:344-345` `isMany = typeof ub === 'number' && ub !== 1;`, `nodes/ObjectNode.tsx:693` `cardinality: f.isMany ? \`[${held.length}]\` : null,` (read) |
| `self`/`data`, classic Console bare names | none: always `.value` | `modelContext.ts:51`, `:73` |
| JjTL source instances | number of values | `components/project/ProjectEditor.tsx:1540-1546` (read) |

## 4. The readers (measured unless marked)

Probe `frontend/scripts/smoke/_tmp_jjelmulti_probe.ts` (gitignored, P11: real app, live store, real L-proxies),
Vite of this tree on 3147, `npx tsx`, exit 0, zero page errors. Columns: `jodie` = `evaluateJjelInJodie`;
`pool` = same context, the instance by bare name; `valid` = `buildValidationInput(m1)` handle with its globals
and bindings; `bare` = the classic Console's flattening, `flattenProxyContext` copied key for key
(`Console.tsx:63-81`) then `extractAttributeValues` (`Console.tsx:684`); `lproxy` = `{ self: <raw L-proxy> }`.

Region_0 (the report's six expressions):

| Expression | jodie | pool | valid | bare |
|---|---|---|---|---|
| `self.name` | `"Region_0"` | `"Region_0"` | `"Region_0"` | `"Region_0"` |
| `self.subVertices` | `{InitialState_0}` | `[InitialState_0, State_0]` | same | `{InitialState_0}` |
| `self.subVertices.size` | `null` ⚠ property-not-found | `2` | `2` | `null` ⚠ |
| `self.subTransitions` | `{Transition_0}` | `[Transition_0]` | same | `{Transition_0}` |
| `(forall s in self.subTransitions such that true)` | `[]` | `[Transition_0]` | same | `[]` |
| `(forall s in [1, 2, 3] such that true)` | `[1, 2, 3]` | same | same | same |

The `jodie` column is the report's table, cell for cell. Full table (8 objects, 33 expressions) in the probe
output; the shape is the same on every multi-valued feature, e.g. `State_0.tags.size` is `1` on `self`, `2` on the
pool; `State_2.outgoing` is `{Transition_0}` on `self`, `[Transition_0, Transition_1]` on the pool;
`Region_1.subTransitions` (0 values) is `null` ⚠ on `self`, `[]` on the pool.

| Reader | Binds `self`/names from | Collapses? | How known |
|---|---|---|---|
| Jodie JjEL console | `wrapSelectedElement` → `extractAttributeValues` | **yes** | measured (`jodie`) |
| JjScript `eval`/`let`/`forall`, `data` | same builder, `data` | **yes** | measured (same `data` as `jodie`; `self` is `data`) |
| JjEL autocomplete (`jjel/autocomplete/providers/identifier.ts:17`) | `buildJodieJjelVariables` | yes, it infers from the same values | read |
| Classic Console, bare feature names | `flattenProxyContext` + `extractAttributeValues` | **yes** | measured (`bare`, emulated flatten) |
| Classic Console, `data.f` | the raw L-proxy | no collapse: `null` ⚠ property-not-found, because `'f' in lproxy` is false | measured (`lproxy`); a different defect, §8 |
| Validation (`validationContext.ts:159`, `:189` `self: handle`) | pool handle | no | measured (`valid`) |
| Simulation guards/actions (`guardContext.ts:165` `const self = snapshot.handleById.get(site.transitionId);`) | pool handle, frozen | no | read; same handles as `pool` (measured) |
| Simulation derived (`derivedEvaluator.ts:380`, `snapshot.handleById.get(owner)`) | pool handle | no | read |
| Codegen (`codegen/ui/CodePanel.tsx:83`, `oracle.ts:340`, over `buildEvalContext(..., { extentModelId })`) | pool handles via the guard snapshot | no | read |
| JjTL (`jjtl/executor/executor.ts:2274-2294`) | `self` = the source record; names via `proxyEntries` then `extractAttributeValues` | **yes, by count**, through `ProjectEditor.tsx:1540-1546`; `extractAttributeValues` is a no-op there (plain records, no `$` keys, no `features`) | read, not run (the builder is inline in a component method) |
| View expressions, IR PathExpr/Conditional (`irCompile.ts:145-147`) | its own walker over `ReadCtx`, `$f.value` / `$f.values` chosen by the author | no (not JjEL's path) | read |
| JSX templates | JavaScript over L-proxies, not JjEL | not in scope | read |

## 5. Census of shipped expressions (point 5)

Run by a read-only subagent of this session with `command grep -rniE` (BSD grep, so `--include` filters and
gitignored paths are reached), every absence with a positive control on the same path and tool.

- **Shipped JjEL in source (non-test)**: `(forall|exists)\s+<id>\s+in\s` over `frontend/src` minus tests gives 27
  hits, **all comments, JSDoc or help/error text**, none evaluated (e.g. `eval.ts:80` `'Check expression syntax.
  Example: forall c in classes : c.name'`, `evaluator.ts:452`, `ValidationRulesModal.tsx:436`). Default views,
  seeds (`seed|DEFAULT_RULES|defaultRules|builtinRules`: none), autocomplete (`autocomplete/providers/keyword.ts:24-25`,
  bare keywords), Jodie prompts (`constants/defaultPrompts.ts:513-514` is OCL `->forAll(`), `examples/statechartplus*.ts`
  (OCL `->exists(`), codegen templates (`.map(...)` only): zero. Controls: `such that` 32 hits, `self\.` in
  `editor-v2/sim` + `model/simulation` 15, in `examples/` 22.
- **Data files**: `frontend/public/docs/help/reference/jjel.md:9` `forall a in attributes such that a.isPublic :
  a.name` (a collection). The 8 `.jjodel` files and the 2 codegen example JSONs: 0 `forall`/`exists` (control:
  `model\.\[` 6 hits, e.g. `turnstile.json:135` `"model.[coins] >= 2"`).
- **Tests**: 116 lines in 20 files iterate arrays or multi-valued collections only (`ownedAttributes`, `attributes`,
  `classes`, `self.children`, `[1,2,3]`, `Transition.instances`, …). Searches for single-valued operands
  (`self.source|target|parent|father|name|type|nextState|from|to`, `node`, `event`, bare `self`/`model`) and for
  string/number operands: 0. The tests that pin the non-array branch use `null`, which keeps `[]`/`false`:
  `jjel/__tests__/evaluator.test.ts:145` and `:178`, `model/validation/__tests__/validationEvaluator.test.ts:227-228`
  (titled «forall su un NON array torna [] e non lancia», operand `nonEsiste`, an unbound name that evaluates to
  `null`; it stays green, its title becomes imprecise).
- **Multi-valued read as one object**: no shipped expression found (STC `.[x]` strings in `model/simulation` and
  `editor-v2/sim`: 54 hits, all comments, placeholders or UI text; codegen interpolations use `.map(...)`).
- **Engines beside the evaluator**: `codegen/target/js/printer.ts:409` `if (!Array.isArray(coll.value) ||
  coll.value.length === 0) return 'false';` keeps the old `false` for a step-dependent `exists` over a folded
  non-collection, so after the guard the printed JS and the engine disagree **on a defective expression only**;
  step-independent `forall`/`exists` fold through the evaluator (`printer.ts:354-357`) and inherit the error.
  `derivedEvaluator.ts:259` wraps a single value as `[v]` only to collect read sets (static), evaluation goes
  through the evaluator (`:514-519`). `subsetChecker.ts:347-357` is syntactic.

Verdict: no shipped expression iterates a value that is not a collection, and none relies on a multi-valued
feature reading as one object. The two guards of the prompt stay in Phase 2. Their user-visible effect is on
hand-typed expressions over a single object, which today return `[]`/`false` in silence.

## 6. History (read)

- `modelContext.ts` was added in `85b33c57d` (2026-03-13, subject «Fix CSS class conflict between MegamodelView
  and EditorV2», a bundled commit); `git blame -L 62,82` gives that sha for every line of Strategy 2, `.value`
  included. `git log -S"const dollarProp = proxy['$' + fname];"` returns that commit only.
- `wrapSelectedElement` and its call to `extractAttributeValues` arrived in `f03a765d6` (2026-04-15, «wrap JjEL su
  JjOM»), blame `eval.ts:925-946`.
- The pool's upper-bound rule arrived in `31bdbfe06` (2026-06-12, «feat: materialize M1 feature slots on JjEL
  extent instance handles»), with the comment «Shape follows cardinality: upperBound 1 -> single value | handle |
  null; multi -> array (never null).» (`eval.ts:610-611`). It was not extended to `data`.
- `docs/discovery/2026-06-11_jjel_m1_navigation_discovery.md:144` already flagged «"`data.nextState` may partially
  surface" as a code-path inference, not a verified fact», and `:357` lists «`data` via `$ref.value` unverified».

Intent: searches with `command grep -ci` (BSD grep, not the ugrep wrapper) over `docs/decisions.md`,
`frontend/src/jjel/SPEC.md`, `docs/spec/concern_languages.md`, `docs/ratifiche/`, `docs/discovery/`:

| Pattern | decisions | SPEC | concern_languages | ratifiche (files) | discovery (files) |
|---|---|---|---|---|---|
| `multi-valued\|multivalued\|multi-value` | 8 | 0 | 0 | 2 | 32 |
| `first value\|primo valore` | 1 | 0 | 0 | 0 | 2 |
| positive control `forall` | 4 | 49 | 2 | — | — |

The 8 `decisions.md` hits are UI and simulation rows (`:1562` canvas editing, `:2439-2443` sim Entry/Exit/Guard
lists, `:4632`, `:4756` derivation); the one «primo valore» (`:2483`) names a mutation killed by tests, not a
semantics. None makes the first value the meaning of a multi-valued navigation; `SPEC.md:553` reads
`forall r in references such that r.upperBound == 1`, i.e. it treats `references` as a collection. H4 falsified.

## 7. Dependencies and risks

- The fix sits in `jjel/evaluator/modelContext.ts`, outside §3.1 and outside `src/jjscript/`; its callers are
  `eval.ts:586` (pool, overwritten right after by `fillInstanceSlots`), `eval.ts:945` (`data`), `Console.tsx:684`,
  `executor.ts:2294` and `:3272` (JjTL, inert on plain records). No exported interface changes.
- `readObserver` fires in `getProperty`, on the read of the host object; the fix changes the value bound, not the
  read, so the observation stays on the same reads (`evaluator.ts:531`).
- References read through `.values` are L-proxies, as `.value` gave before: `self.subVertices[0] ==
  InitialState_0` (pool handle) stays false, as `self.source == InitialState_0` already is. Identity between
  `data` and the pool is a further step (Q3).

## 8. Out of scope, seen

- `'f' in lproxy` is `false` for feature names on a raw L-proxy, so `data.f` in the classic Console and `self.f`
  over any raw L-proxy reads `null` with a warning (measured, `lproxy` column). Not a collapse.
- JjTL's count-based shaping (§4, Q1).

## 9. Decisions

Decisions taken (unattended):

1. Fix at `extractAttributeValues`, both strategies, with the same predicate as `fillInstanceSlots`
   (`ub === -1 || ub === '*' || ub > 1`), so pool and `data` agree by construction.
2. An empty single-valued slot binds `null` only when the name is not already bound, so the identity `name`
   (overridden by the `name` attribute only when it holds a value, `modelContext.ts:19-21`) is untouched.
3. Tests run `buildEvalContext` and `evaluateJjelInJodie` for real with the joiner barrel mocked (precedent
   `jjscript/executor/__tests__/m1Operators.test.ts:21`); the test file lives under `jjel/__tests__/`, nothing is
   added under `src/jjscript/`.

Decisions awaiting Alfonso:

1. JjTL source records shaped by count (`ProjectEditor.tsx:1540-1546`): same rule, in its own lane?
   Recommended: yes, a fast lane on `ProjectEditor.tsx` reading the feature's upper bound.
2. The raw L-proxy answers `false` to `'f' in proxy` for feature names (§8): a ticket?
   Recommended: a low-priority ticket, no fix in this lane.
3. `data`/`self` references are L-proxies, not pool handles: bind `self` to the pool handle when the selection
   is in the pool? Recommended: yes, in a later lane, after this one is verified.
4. The codegen JS printer prints `false` for a step-dependent `exists` over a non-collection
   (`printer.ts:409`) where the engine now raises: align it? Recommended: yes, refuse it at print time with the
   evaluator's message, in a codegen lane.

## Appendix — files read

`frontend/src/jjel/evaluator/modelContext.ts`, `frontend/src/jjel/evaluator/evaluator.ts` (`:416-560`,
`:920-990`, `:1156-1168`), `frontend/src/jjscript/executor/commands/eval.ts` (whole),
`frontend/src/components/Jodie/jodieJjelContext.ts`, `frontend/src/components/Jodie/console/providers/jjelProvider.ts`,
`frontend/src/components/editors/Console.tsx` (`:55-100`, `:560-800`), `frontend/src/jjtl/executor/executor.ts`
(`:99-170`, `:960-1112`, `:1240-1272`, `:2270-2310`, `:3250-3330`), `frontend/src/components/project/ProjectEditor.tsx`
(`:1490-1576`), `frontend/src/model/validation/validationContext.ts` (`:145-212`),
`frontend/src/model/simulation/guardContext.ts` (grep), `frontend/src/model/simulation/derivedEvaluator.ts` (grep),
`frontend/src/model/logicWrapper/LModelElement.tsx` (`:7540-7600`),
`frontend/src/components/editor-v2/viewpoint/ir/pathExpr.ts` (`:30-100`), `.../ir/irCompile.ts` (`:120-160`),
`frontend/src/components/editor-v2/utils/jjomTransformers.ts` (`:338-346`),
`frontend/src/components/editor-v2/nodes/ObjectNode.tsx` (`:660-695`), `docs/decisions.md` (R-VAL-13, R-J series,
R-SIM-14), `docs/discovery/2026-06-11_jjel_m1_navigation_discovery.md` (grep).

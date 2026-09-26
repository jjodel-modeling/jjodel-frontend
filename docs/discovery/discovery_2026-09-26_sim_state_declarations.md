# Discovery — lane C of the simulator: declared state attributes (R-SIM-19) and the action role keys (R-SIM-52)

- Prompt-ID: `P-2026-09-26-1705` (chat `C-2026-09-26-1702`)
- Prompt file: `docs/prompts/claude_2026-09-26_1705_prompt_sim_state_declarations_discovery.md`
- Session: `e09f8431-b237-4ff4-b0e5-4692d17ace73`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `69181e20a` (parent `7e1c9e8cc`), tree clean at start
- Executor: Opus 5.5 (session banner)
- Phase 1, read-only. No source file edited. A dev server on 3002 from this tree was started for the measurements
  and stopped at the end.

This report is a set of hypotheses with evidence, not a definitive reference. Whoever uses it downstream re-reads
the real files. Tags: **[R]** read in a file or a doc of HEAD `69181e20a`; **[M]** measured in this phase, on the
same HEAD, by the probes named in §10.

---

## 0. Answer in brief

- **Bag option: D1**, one additive key `simStateAttributes` holding a JSON array of declaration records, encoded
  and decoded like `simProfile` but decoded **per record** with defects. It keeps R-SIM-2 intact (flat key,
  primitive value), costs zero VersionFixer steps, is covered by `runSignature` without a change, survives «Custom»
  reconstruction once the catalog gives `stateAttributes` its key, and is the list the `.smv` exporter reads
  directly (VAR, DEFINE, frame condition). D2 contradicts spec §3 («never a stereotype inside» the metamodel), D3
  contradicts R-SIM-47 («mai il profilo») and dies with Custom.
- **Lane split: two lanes.** C1 = stored attributes, the three action keys wired into `NetStc`/`compileNet`/the
  bridge, compile-time defects of declarations and actions, the Data group of the panel (two code commits: pure
  core plus bridge, then panel). C2 = derived attributes (`DEFINE`): equation, dependency graph, circularity check,
  read-side resolver. Split point: C2 is the only one that touches `guardContext.ts`.
- **The core already produces every run-time outcome** Phase 2 must render (undeclared target, double target,
  domain, locality) [M]. Three gaps were measured: `compileNet` validates no declaration at all; the halt line of an
  undeclared target prints the **raw pointer id** of the element on 3002; a semantic assignment can read
  `node.[x]` (presentation leaking into semantics, against R-SIM-18).

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | Nothing in the M2 bag produces declarations, and no action key reaches `NetStc` | **holds** | §2(a)(b), grep with control §2(b); `startRun` calls `compileNet` without `decls` (`simBridge.ts:200`) [R] |
| H2 | `compileNet` validates the declarations it is given | **falsified** | eight malformed declarations, zero defects (§7.2) [M] |
| H3 | Evaluator plus core already give every outcome Phase 2 must render | **holds, two text gaps** | §7.3-§7.4 [M]; raw id in the halt line on 3002 (§7.5), source text in the halt line against R-SIM-62 (§5.4) |
| H4 | A double target can always be detected at compile time | **partly** | a target whose element depends on σ parses: `(if model.[f] then p1 else p2).[visits] := 1` (§7.4) [M]; static detection is complete only for targets that fold without σ |
| H5 | The profile modules and the modal of R-SIM-55 are wired | **falsified** | no production consumer of `simProfiles.ts`, `profileCodec.ts`, `roleCatalog.ts` (grep with control, §2(e)); the panel renders four groups inline (`SimulationPanel.tsx:145-151`) [R] |
| H6 | A JSON-string key round-trips through the M2 bag | **holds for write and raw read** | [M] §7.6; side observation: the proxy `state` exposes no `sim*` key and writing `undefined` did not remove a key, control keys included |
| H7 | An `Action [0..*]` value is stored as a `DValue.values` array, in order, and `objectSlotValues` reads it | **holds** | [M] on 3002, §7.5 |
| H8 | R-SIM-18 locality is enforced on actions | **partly** | the target side is (§7.3) [M]; the right-hand side is not: `p2.[visits] := node.[color]` fires (§7.7) [M] |

---

## 2. What exists [R]

### (a) The bag keys the M2 panel writes, and how a feature pointer is validated

The panel writes exactly the keys of `ROLE_SPECS` (`frontend/src/components/editor-v2/sim/simRoleStatus.ts:47-74`),
twenty `sim*` keys from `simNode` to `simEventIdentifier`; `simEvent` is derived and not shown. The write:

`SimulationPanel.tsx:247`: `lmm.state = { [key]: value === '' ? undefined : value };`

The only check before it is the overlap verdict of R-SIM-16 (`SimulationPanel.tsx:234-243`). A feature pointer
such as `simGuard` is picked from `options.attributes`, which lists **every attribute of every class, abstract
included**, labelled `Class.attr` (`SimulationPanel.tsx:91-100`): no type filter (R-SIM-44 allows EString and
`Expression` for guards, nothing enforces it) and no owner filter. The run reads the guard by pointer:

`simBridge.ts:136`: `const value = objectSlotValues(lookup, site, stc.guard)[0];`

A transition whose class has no slot for that feature reads `undefined`, which is an absent guard, which is
`true` (`guardEvaluator.ts` `compileGuard`, R-SIM-17). The binding compatibility check (type, owner, multiplicity)
is declared for a later lane: `simProfiles.ts:254`: `/** The verdict of the binding compatibility check (type,
owner, multiplicity), a later lane. */`.

### (b) `netStcFromRoles`, and why `simAction`, `simEntry`, `simExit` do not reach it

`netCompile.ts:43-51` (`ROLE_KEYS`) maps nineteen keys; none of the three. `NetStc` has `guard` and no action field
(`netTypes.ts:74-98`). The catalog names the keys and says so:

`roleCatalog.ts:9-11`: `` `simAccepting`, `simActivityFinal`, `simAction`, `simEntry`, `simExit`, `` …
`are new and provisional (R-SIM-52): nothing reads or writes them yet.`

`roleCatalog.ts:158-161`: `stateAttributes: { group: 'data', key: null, kind: 'declarations', dependsOn: [], …`

Search: `command grep -rn -e simAction -e simEntry -e simExit -e simStateAttributes` over `frontend/src`
(`.ts`, `.tsx`, tests excluded): four hits, all in `roleCatalog.ts`. Positive control, same command for
`simGuard`: five files.

### (c) How `compileNet` consumes `decls`, and who reads `declared`

`netCompile.ts:391-408`: for each declaration, the owners are the model (`metaclass === null`) or the ids that are a
kind of the metaclass; `if (byName.has(decl.name)) continue;` (`:401`) keeps the first declaration of a name
silently; the initial value goes into `attrs` (semantic) or `presentation`. No check of any field.

Readers of `declared`: `netStep.ts:237-238` (undeclared target halts), `:242` (domain on semantic),
`actionEvaluator.ts:126-128` (locality). `CompiledNet.attributes` has no production reader (grep `\.attributes`
over `sim/` and `model/simulation/`, tests excluded: one unrelated hit; control `\.declared`: two hits). Guards read
σ through `toJjelStateAccess` (`guardContext.ts:189-197`), whose `read` falls to `state.attrs`
(`netStep.ts:52`); an undeclared attribute is `undefined`, which the evaluator turns into a thrown error and the
guard into a defect.

### (d) What `netStep.ts` does with assignments, and what `NO_SIM_ACTIONS` guards

`netStep.ts:229-247`: every site is evaluated on `cfg.state`, the state before the step; per assignment:
undeclared → `action-defect` (`:238`), second write of the same `(element, attr)` → `double-assignment` (`:240`),
semantic outside its domain → `domain` (`:242-244`); then all writes land together (`:249-253`).

`simBridge.ts:156-157`: `/** No assignment until lane C (R-SIM-39): a step moves the marking only. */`
`export const NO_SIM_ACTIONS: ActionOracle = () => ({ kind: 'ok', assignments: [] });`, installed by `startRun`
(`:217`) and pinned by `simBridge.test.ts:428-429` («the action oracle of the run is still NO_SIM_ACTIONS until
lane C»).

### (e) `simProfile`: encoding, decoding, `validateProfile`

`profileCodec.ts:22-25`: the id for a system profile, `JSON.stringify(profile)` otherwise. `decodeProfile`
(`:66-103`) is all or nothing: any malformed field returns `null`; unknown fields are dropped. Without the key,
`inferCustomProfile` (`:143-196`) rebuilds «Custom» from the set keys; `isSet` returns `false` for a `null` key
(`:119-123`), so `stateAttributes` is always `off` «Not bound» (measured, §7.8).

`validateProfile` (`simProfiles.ts:218-248`) is generic over `ROLE_IDS`: the Data group enters only through
`dependsOn` (`action`→`transition`, `entry`/`exit`→`node`, `stateAttributes`→none). The open ticket of
`P-2026-09-25-1840` (a derived role whose `from` is off) concerns Initial marking, not the Data group.

None of the three profile modules is imported by production code. Search: `command grep -rn -e simProfile -e
decodeProfile -e inferCustomProfile -e validateProfile -e ROLE_CATALOG -e roleCatalog` over `frontend/src`,
tests and the three files excluded: two hits in `pages/Account.tsx` (a local, unrelated `validateProfile`).
Positive control, `netStcFromRoles`: hits in the panel, the bridge and `simRoleStatus.ts`. So the modal of
R-SIM-55 does not exist; the panel renders `ROLE_GROUPS` inline (`SimulationPanel.tsx:145-151`), `simGuard` in
General.

### (f) The `Expression` and `Action` types of lane A

Ids `Pointer_EXPRESSION`, `Pointer_ACTION` (`common/Defaults.ts:86-87`); enum `ShortAttribETypes.Expression`,
`.Action` (`common/U.tsx:3338-3339`); editor labels (`components/editor-v2/types.ts:36-37`, `:53-54`); migration
`2.228 -> 2.229` (`redux/VersionFixer.tsx:1244`, read only); Ecore export as EString with a `jjodel`/`type`
annotation (`services/export/EcoreService.ts:333-338`) and back on import (`api/data.ts:695`). The checker hook is
syntax only: `model/conformance/ConformanceValidator.ts:238-258` runs `parseExpressionStrict` or `parseAction` on
every non-blank value of a slot typed with one of the two ids, and reports a `type_mismatch` warning. It iterates
every value of the slot (`:215-221`), so an `Action [0..*]` slot is checked value by value. Nothing contextual
(declared target, locality, `node` in a guard) runs there.

---

## 3. Declarations in the bag: options

The record R-SIM-19 needs: name, metaclass (or global), space, domain (semantic only), initial, and for a derived
attribute an equation. `StateAttributeDecl` (`netTypes.ts:37-45`) already has the first five.

| | D1: key `simStateAttributes`, JSON string | D2: M2 elements (marker-typed attribute, or annotation) | D3: inside `simProfile` |
|---|---|---|---|
| Files | new pure codec (`model/simulation/`), `roleCatalog.ts` (key), `simBridge.ts`, panel, scss | (i) a third primitive type: `U.tsx`, `Defaults.ts`, `types.ts`, `VersionFixer.tsx`, `EcoreService.ts`, conformance; (ii) annotations: bridge walk of `DAnnotation`s, `runSignature`, the panel writing M2 elements | `simProfiles.ts`, `profileCodec.ts`, bridge, panel |
| Exported interfaces | none changed; new exports | (i) `EDataType` union, `ShortAttribETypes` | `SimProfile` gains a field |
| VersionFixer | zero | (i) one step, **critical zone**; (ii) zero | zero |
| R-SIM-2 | intact: flat key, primitive value, the `simProfile` precedent (R-SIM-55) | outside the bag: not concerned, but the STC moves into the metamodel | inside another key's value |
| «Custom» (R-SIM-55) | survives, once `roleCatalog.ts:159` has the key: `isSet` is generic | survives (not in the bag) | **lost**: no `simProfile`, no declarations |
| Ecore export | not exported, like every role key today (`_state` 0 hits in `EcoreService.ts`, control `escapeXml` 24) | (i) and (ii) exported | not exported |
| `.smv` exporter | reads one decoded list | walks classes and annotations | decodes the profile, against R-SIM-47 |
| `runSignature` | covered already: every `sim*` key (`simBridge.ts:248`) | (ii) not covered: `:261-263` reads name, abstract, attributes, references, extends of a `DClass`, no annotation | covered |
| M2 editing | a table in the Data group, one write of the whole string per commit | (i) the metamodel editor; (ii) a new write path to M2 elements from the panel | the profile modal, which does not exist |

Against D2: spec §3 (`docs/spec/claude_spec_2026-09-13_computational_model.md:47-48`): «it is external to the
metamodel, never a stereotype inside it»; variant (i) also gives every M1 instance a slot for a σ component, which
R-SIM-18 forbids («mai nel `DObject`»), and needs a VersionFixer step. Against D3: R-SIM-47 (`docs/decisions.md:1750`)
«Motore ed esportatore leggono i ruoli risolti, mai il profilo»; a system profile is stored as its id alone
(`profileCodec.ts:24`), declarations point to metaclasses of one metamodel while a profile is per language, and the
personal library is deferred (R-SIM-55).

**Recommendation: D1.** Decode per record: one malformed record is a defect of that record, the others compile
(unlike `decodeProfile`, where one bad field voids the whole value). Record shape = `StateAttributeDecl`, plus an
optional `equation` in C2. An empty set is written as `'[]'`, never as `undefined` (§8, risk 7).

---

## 4. Action keys: the wiring

1. **`NetStc` and `netStcFromRoles`.** Three optional fields (`action`, `entry`, `exit`; Rule 11 allows them) and
   three pairs in `ROLE_KEYS` (`netCompile.ts:43-51`). The runnability condition (`:79-81`) does not change.
2. **Reading the values.** A table built at Reset beside `compileGuards` (`simBridge.ts:130-142`): for every
   `actionSite` of every transition, the feature by role (`transition`→`stc.action`, `entry`→`stc.entry`,
   `exit`→`stc.exit`), `objectSlotValues(lookup, site.element, feature).map(String)`, `compileActions`, keyed by
   `actionSiteKey`. Measured on 3002: the slot holds the values in order and `objectSlotValues` returns them all
   (§7.5). Values are read from the raw lookup, as guards are; the frozen snapshot is only the evaluation context.
3. **Sites.** Control flow: exit of each source, the edges themselves (for a fused fork/join: its edges, not the
   node, `netCompile.ts:250`, `:283-293`), entry of each target. Petri: exit of the preset, the transition
   element, entry of the postset (`netCompile.ts:344`); **arcs are never sites** (§7.1: `t1` has sites
   `exit:p1`, `transition:t1`, `entry:p2`). So in Petri `simAction` binds a feature of the transition metaclass,
   which matches its `dependsOn: ['transition']`.
4. **One parallel assignment** is already the core's (`netStep.ts:229-253`), measured across sites (§7.4).
5. **Where each defect is raised.**

   | Defect | Today | Proposed |
   |---|---|---|
   | action does not parse | run time, when its site fires (`actionEvaluator.ts:5-8`) | Reset, `compileDefects`; run time stays |
   | declaration malformed | nowhere (§7.2) | Reset, `compileDefects` |
   | undeclared target | run time (`netStep.ts:238`) | Reset when the target folds without σ and event; run time stays |
   | locality | run time (`actionEvaluator.ts:127-128`) | same split |
   | double target in a step | run time (`netStep.ts:240`) | same split, per transition over its sites |
   | `node` read by a semantic assignment | nowhere (§7.7) | Reset: `checkGuardSubset` on the right-hand side already reports `E-NODE` (§7.7) |
   | value outside the domain | run time (`netStep.ts:242`) | run time only |

   Static detection cannot be complete (H4), so the run-time halts stay the backstop. Recommended effect of a
   compile-time action defect: reported in the defects line, the transition **stays a candidate** and halts if
   fired; excluding it, as a guard defect does, would make a transition vanish for an effect it has not produced
   yet (question 6).
6. **Reaching the panel.** Compile defects: the defects line above the buttons (R-SIM-61, R-SIM-65, R-SIM-66), via
   `defectsLine`/`defectsTitle` (`simBridge.ts:345-362`). `CompileDefect.role` is the literal `'guard'` and
   `reason` is `'parse-error' | 'subset'` (`simBridge.ts:164-170`): widening them modifies an exported interface
   beyond an optional property (Rule 11), to be authorized (question 7). Halts: the halt line above the buttons
   (`haltMessage`, `simBridge.ts:288-298`) and «… halted the run» in the one slot of R-SIM-66
   (`lastStepText`, `:554-555`). Two text defects there, §5.4.
7. **`NO_SIM_ACTIONS`.** Kept as the oracle when no action role is bound (it skips building a context per site),
   not a per-run flag: no user need calls for a switch. The assertion of `simBridge.test.ts:428-429` changes with
   the wiring: a committed test to be rewritten, named here.
8. **Tests B2 already has.** `actionEvaluator.test.ts` (26 `it`): compile and blanks, site keys, the oracle on one
   site, right-hand side defects, target defects, locality both ways, the swap through the core, entry and exit of
   one place, parse and right-hand side halts, Ex1 and Ex2 end to end. `netStep.test.ts` (36 `it`) covers
   declared, domain and double assignment with hand declarations (`:211-244`). Phase 2 adds only: the codec, the
   declaration defects of `compileNet`, the bridge table (pointer by role, order, blanks), `startRun` with a bag
   carrying declarations and action keys, the compile-time action defects, the halt texts.

---

## 5. Derived attributes, domains, initial values

### 5.1 Costs

- **Domain authoring**: `Domain` admits `boolean`, `range {min,max}`, `enum {literals}` (`netTypes.ts:27-30`);
  `inDomain` (`netStep.ts:176-183`). Authoring cost is UI only: three kinds, min and max, a literal list. Missing
  today: `min <= max`, integer bounds, distinct identifier literals (§7.2 accepted `min: 5, max: 1`).
- **Initial value typed against the domain**: not checked (§7.2: 7 in `0..3`, `'C'` in `{A, B}`). A compile defect
  per record, cheap. Recommended input form: a JjEL literal (`true`, `3`, `'red'`, `A`), parsed with
  `parseExpressionStrict` and required to be a literal, so the type is explicit.
- **Presentation attribute** (`node.[x]`): domain `null`, `inDomain` accepts any value (`netStep.ts:177`); only the
  initial's literal form types it. Cheap.
- **Derived attribute** (`DEFINE`): an optional `equation` on the record; strict parse and subset check (no `:=`,
  `E-NODE` for a semantic one); a dependency graph from the `StateAccess` nodes of each equation, keyed by
  attribute name (syntactic, conservative, since the element is a path), with a cycle defect; evaluation on read,
  with `self` the owner, on σ, memoized per σ: the reader behind `toJjelStateAccess` (`guardContext.ts:189-197`)
  resolves a derived name instead of `state.attrs`; an action assigning it is a defect; a derived value outside its
  domain is a defect at read. `StateAttributeDecl.initial` is required (`netTypes.ts:44`) and a derived attribute
  has none: making it optional is a Rule 11 modification (question 17). Moderate cost, independent of C1 except for
  the record shape.

### 5.2 Recommended split

- **C1**, stored attributes and action keys. Code commit 1, pure and bench-testable: new codec,
  `roleCatalog.ts` (key of `stateAttributes`), `netTypes.ts` (three optional `NetStc` fields), `netCompile.ts`
  (`ROLE_KEYS`, declaration defects), `actionEvaluator.ts` (static target folding, `E-NODE` on semantic right-hand
  sides), `simBridge.ts` (decode, table, oracle, `compileDefects`, texts), plus `netStep.ts`/`netTypes.ts`
  `HaltReason` only if question 8 is ratified. Code commit 2, visual: `simRoleStatus.ts`, `SimulationPanel.tsx`,
  `simulation-panel.scss`. More than five files: Rule 19 pause at Phase 2 start.
- **C2**, derived attributes: codec field, `netTypes.ts` (`equation?`), `netCompile.ts` (cycle check),
  `guardContext.ts` (derived resolver), `actionEvaluator.ts` (read-only target), panel field. **Split point:
  `guardContext.ts`** is touched by C2 only.

---

## 6. The outcomes Phase 2 renders (summary of §7)

| Case | Core outcome | Line today |
|---|---|---|
| undeclared target | `halted`, `action-defect`, detail `'count' is not a declared attribute of <id>` | `Halted: the transition action of t1 failed: 'count' is not a declared attribute of Pointer1790456870281_USER_129.` (3002) |
| double target, one site or across sites, same value too | `halted`, `double-assignment` | `Halted: visits of p2 is assigned twice in one step.` |
| outside the domain, or wrong type | `halted`, `domain` | `Halted: visits of p2 would be 9, outside its domain.` / `… would be x, …` |
| locality | `halted`, `action-defect` | `Halted: the transition action of t1 failed: 't1.[color] := 'red'': 'color' is a presentation attribute: only node.[color] assigns it.` |
| declared only | `fired`, `label.assignments` `[{p2, visits, 1}]` | `ε: t1 (p1 → p2) fired`: the assignment is not shown anywhere |

In every halt σ is unchanged (`next.state === state`, measured).

---

## 7. Measurements [M]

All on HEAD `69181e20a`. The pure probe imports the real modules from `src`; the fixture is `b2net` of
`_tmp_b2_scenario.js` as a raw lookup: `p1` (3 tokens) `-a1->` `t1` `-a2->` `p2`, k = 3, guard of `t1`
`p2.[tokens] < 2`, Petri shape. Declarations: `visits` (Place, semantic, `range 0..3`, initial 0), `color` (PTrans,
presentation, initial `'grey'`), and for (c) `f` (global, boolean, `false`).

### 7.1 (a) `compileNet` with two declarations

```
stc        {"shape":"petri","bound":3,"node":"Place","transition":"PTrans","initialMarking":"f_tokens","guard":"f_guard","arc":"Arc","arcSource":"f_src","arcTarget":"f_tgt"}
sites      t1: exit:p1, transition:t1, entry:p2
declared   {"p1":{"visits":"semantic"},"p2":{"visits":"semantic"},"t1":{"color":"presentation"}}
initial    marking {"p1":3}; attrs {"p1":{"visits":0},"p2":{"visits":0}}; presentation {"t1":{"color":"grey"}}
defects    []
```

The same on 3002 with the real ids (`cnet`, §7.5): identical `declared`, `attrs`, `presentation`, `defects: []`.

### 7.2 What `compileNet` does not check

Eight declarations in one call: initial 7 in `0..3`; semantic with domain `null`; the reserved name `tokens`; the
metaclass `NoSuchClass`; enum initial `'C'` not in `{A, B}`; `visits` twice (Place semantic, then PNode
presentation); `range 5..1`. Result: `defects: []`. `attrs` carries `over: 7`, `inv: 5`, `mode: "C"`; `ghost` has no
owner and vanishes; the second `visits` is dropped on `p1`, `p2` (first wins) but applies to `t1`, a PNode: **the same
name is semantic on the places and presentation on the transition**. A declared `tokens` is unreadable: the adapter
answers `tokens` from the marking before `read` (`guardContext.ts:192-193`).

### 7.3 (b) One arc site, two actions

Site `transition:t1` (in Petri the arcs have no site), actions `p2.[visits] := p2.[visits] + 1` and
`p1.[count] := 1`:

```
oracle raw   {"kind":"ok","assignments":[{"element":"p2","attr":"visits","value":1},{"element":"p1","attr":"count","value":1}]}
step         halted, action-defect, detail "'count' is not a declared attribute of p1"   (reversed order: the same)
declared only  fired, assignments [{p2, visits, 1}], attrs p2.visits = 1
node.[color] := 'red'   fired, presentation t1.color = "red"
t1.[color] := 'red'     halted, action-defect, "…'color' is a presentation attribute: only node.[color] assigns it"
entry p2: node.[visits] := 1   halted, action-defect, "…'visits' is a semantic attribute: node.[visits] assigns presentation only"
p2.[visits] := 9        halted, domain, value 9
p2.[visits] := 'x'      halted, domain, value "x"
```

The oracle never refuses an undeclared target; the core does, at the first one in site order.

### 7.4 (c) A double target

```
same site  p2.[visits] := 1, p2.[visits] := 2   oracle raw: ok, both assignments; step: halted double-assignment p2.visits
same value p2.[visits] := 1 twice                step: halted double-assignment
across     exit:p1 p2.[visits] := 1, transition:t1 p2.[visits] := 2, entry:p2 model.[f] := true   halted double-assignment
distinct   exit:p1 p1.[visits] := 1, entry:p2 p2.[visits] := 1   fired, attrs p1 = 1, p2 = 1, M.f = false
dynamic    (if model.[f] then p1 else p2).[visits] := 1   parses, target object IfThenElse; with p2.[visits] := 2 on the same site: halted double-assignment
event      event.[visits] := 1   parses
```

The evaluator reports nothing about a double target; only the core does, at run time. A target can depend on σ and
on the event, so a compile-time check covers only the targets that fold.

### 7.5 On 3002: the `Action [0..*]` slot and the real snapshot

`_tmp_c_scenario.js` = `_tmp_b2_scenario.js` plus `PTrans.actions : Action [0..*]` and `Place.entry : Action [0..*]`
(`upperBound = -1`), model `cnet`, `t1.actions` set to the two actions of §7.3 and `p2.entry` to
`p2.[visits] := 1`.

```
feature      {"type":"Pointer_ACTION","upperBound":-1,"lowerBound":0}
raw slot     {"className":"DValue","instanceof":true,"values":["p2.[visits] := p2.[visits] + 1","p1.[count] := 1"]}
proxy        .values = both, in order; .value = the first
objectSlotValues(lookup, t1, actions) = both, in order
globals of buildEvalContext: p1, p2, t1 present by name, each with its id
table        exit:p1 [], transition:t1 [both], entry:p2 ["p2.[visits] := 1"]
from slots   halted, action-defect: "Halted: the transition action of t1 failed: 'count' is not a declared attribute of Pointer1790456870281_USER_129."
t1 declared only, entry kept    halted, double-assignment: "Halted: visits of p2 is assigned twice in one step."
t1 declared only, entry empty   fired, p2.visits = 1
console errors: 1, "failed to get project {project: null}" (already noted by the B2 entry, not investigated)
```

The pure probe hid the id leak because its ids are names. The detail string of `netStep.ts:238` embeds
`a.element`, and `haltMessage` prints the detail verbatim (`simBridge.ts:296-297`).

### 7.6 On 3002: a JSON-string key in the M2 bag

Written as the panel writes a role (`LPointerTargetable.fromPointer(mm).state = { simStateAttributes: json }`) on the
first metamodel of the RowViewSmoke seed, 135 bytes with a real class pointer inside:

```
raw _state.simStateAttributes === json, type string; other keys kept
proxy .state: an object with no keys; .state.simStateAttributes undefined
controls simProbePointer (a class id) and simProbeText ('abc'): raw yes; proxy none of them
after writing { key: undefined } and waiting 3 s: all three keys still in the raw bag, still strings
```

Measured through the proxy call, not through the panel's select; the panel's clear path is the same call
(`SimulationPanel.tsx:244-247`, whose comment says `set_state` removes the key). Not investigated further: out of this
lane. The panel reads the raw bag (`SimulationPanel.tsx:680`), so the empty proxy does not reach it.

### 7.7 The checkers, and presentation read by a semantic assignment

```
parseExpressionStrict  node.[x] > 0                  parses; checkGuardSubset: E-NODE
parseAction            node.[x] := node.[x] + 1       parses; right-hand side subset: E-NODE
parseAction            node.[marked] := true          refused: 'marked' is read-only
parseAction            self.[visits] := node.[x]      parses; right-hand side subset: E-NODE
parseAction            p2.[visits] := 1 p1.[visits] := 2   refused: Unexpected 'p1' after the end of the action
step                   t1: p2.[visits] := node.[color]  (color = 2)   fired, p2.visits = 2
```

The conformance hook accepts all four well-formed texts (syntax only, §2(f)); actions run no subset check
(`actionEvaluator.ts:6-8`: «No subset check: the static check of actions arrives with the typed checker of lane C»),
so a semantic attribute can take a presentation value.

### 7.8 Sizes and profiles

```
JSON of declaration records with a 32-char pointer: 1 → 138 B, 5 → 686 B, 20 → 2751 B; a derived record 134 B
simProfile: system 20 B (the id); a user copy of Extended state machine 1511 B
Custom of a bag with simAction, simEntry, simStateAttributes set: action edit, entry edit, exit off «Not bound»,
  stateAttributes off «Not bound» (key null in the catalog), ignoredKeys []
Extended state machine: guard, action, entry, exit, stateAttributes all edit; validateProfile []; checkable
```

---

## 8. Risks

1. **Re-render.** `mapStateToProps` runs on every dispatch (`SimulationPanel.tsx:672-697`). Passing the raw string as
   its own primitive prop costs a read and a string compare; parsing belongs in a `useMemo` on that string. Folding
   it into `roleSig` would re-stringify it on every dispatch. [R], not measured.
2. **Size on the channel.** Each edit sends the whole string through one `SetFieldAction` on `_state`
   (`joiner/classes.ts:2375-2377`); 2.7 KB for twenty records [M]. The editor commits on blur or Enter, never per
   keystroke (undo history and collaborative traffic).
3. **Profile modes.** No effect today (H5). Once wired, an `off` Data role is not read even with its key set
   (`simProfiles.ts:268-270`): `stateAttributes` off means `decls = []`, and every action halts as undeclared;
   `inferCustomProfile` already reports such keys in `ignoredKeys`.
4. **`validateProfile` ticket.** Open, outside the Data group; C1 does not need to close it. Giving `action`,
   `entry`, `exit` a dependency on `stateAttributes` would let `dependencyOff` catch actions without declarations
   (question 4).
5. **Checker gap.** The contextual rules run at Reset only (guards) or not at all (actions, §7.7): `node.[x]` in a
   guard is not in the problems registry, and a semantic action can read presentation.
6. **Critical zone.** D1 touches no file of §3.1: no `VersionFixer.tsx`, no `DV.tsx`. D2 variant (i) would need a
   VersionFixer step (critical zone): named, not pursued. The view side of R-SIM-18 (`data.[x]`, `node.[x]` in the
   IR) touches the R-SIM-4 files and stays out of C.
7. **Clearing the bag.** §7.6: writing `undefined` did not remove a key. The declarations editor writes `'[]'` for an
   empty set; the observation deserves a ticket of its own, verified through the panel's select.
8. **Dangling metaclass.** A deleted metaclass leaves a declaration with no owner, silently (§7.2 `ghost`): a
   declaration defect in C1. Pointers inside the JSON string are plain text, like every role value in the bag.
9. **Same name, two spaces** through overlapping metaclasses (§7.2): a compile defect, not a silent first-wins.
10. **Ecore.** The bag is not exported to `.ecore` (§3): declarations, like the role keys, do not survive an Ecore
    round-trip; the project JSON keeps them.

---

## 9. Questions for Alfonso

1. Bag option D1, key `simStateAttributes`, JSON array of records? Recommended.
2. Decode per record, a malformed record being a defect of its own, not all-or-nothing like `decodeProfile`? Recommended.
3. Catalog: `stateAttributes.key` from `null` to `'simStateAttributes'` (`roleCatalog.ts:159`), kind unchanged? Recommended.
4. `action`, `entry`, `exit` depend on `stateAttributes` in the catalog? Recommended.
5. Two lanes, C1 (two code commits: pure core plus bridge, then panel) and C2 (derived)? Recommended.
6. A compile-time action defect is reported at Reset and the transition stays a candidate, halting if fired? Recommended over exclusion.
7. Authorize widening `CompileDefect.role` and `reason` (`simBridge.ts:164-170`, Rule 11)? Recommended.
8. A `HaltReason` kind of its own for an undeclared target, with element and attribute (`netTypes.ts:233-237`, `netStep.ts:238`, core change), so the line names the element? Recommended over parsing the detail in the bridge.
9. Halt line without the action source text, the source in the `title` only (R-SIM-62)? Recommended.
10. `E-NODE` on the right-hand side of a semantic assignment, as a compile defect? Recommended.
11. The Data group inline as a fifth group, `simGuard` moving there from General; the modal of R-SIM-55 stays its own lane? Recommended.
12. Option lists of the Data roles filtered by type (Guard: `Expression` or EString; Action, Entry, Exit: `Action` or EString), owner filter left to the binding check? Recommended.
13. Assignments of the last step in the `title` of «Last step» only; no σ table in C1? Recommended.
14. Initial values written as JjEL literals and typed by them, for presentation too? Recommended.
15. Enumeration literals as free identifiers in the record, not a pointer to an M2 `DEnumerator`? Recommended.
16. An empty set written as `'[]'`, and a ticket for the `undefined` removal of §7.6? Recommended.
17. C2: keep `initial` required and ignored for a derived attribute (Rule 11), rather than a type of its own? Recommended.
18. A name declared twice on one element (through a subclass and its superclass) becomes a compile defect, first-wins kept as the effect? Recommended.

---

## 10. Files read and probes

**Read** (full paths under `/Users/alfonso/jjodel-sim/`):
`frontend/src/model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts`, `actionEvaluator.ts`, `guardContext.ts`,
`guardEvaluator.ts` (`:36-60`), `subsetChecker.ts` (`:1-80`, exports), `roleCatalog.ts`, `simProfiles.ts`,
`profileCodec.ts`, `stcFromRoles.ts`, `types.ts`, `objectSlots.ts`, `isKindOf.ts`;
`frontend/src/model/simulation/__tests__/actionEvaluator.test.ts` (`:1-102`, `:230-312`, `it` list),
`netStep.test.ts` (grep);
`frontend/src/components/editor-v2/sim/simBridge.ts`, `simRoleStatus.ts`, `simRunState.ts`, `SimulationPanel.tsx`;
`frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (grep);
`frontend/src/common/U.tsx` (`:3320-3380`), `frontend/src/common/Defaults.ts` (`:80-110`),
`frontend/src/components/editor-v2/types.ts` (`:25-60`), `frontend/src/redux/VersionFixer.tsx` (`:1225-1270`, read
only), `frontend/src/services/export/EcoreService.ts` (`:320-360`, grep), `frontend/src/api/data.ts` (`:680-720`),
`frontend/src/model/conformance/ConformanceValidator.ts` (`:1-60`, `:180-285`),
`frontend/src/model/logicWrapper/LModelElement.tsx` (`:1490-1515`, grep), `frontend/src/jjel/parser/parser.ts`
(`:95-140`), `frontend/src/jjel/types/ast.ts` (`:385-410`), `frontend/src/jjel/stateReserved.ts`,
`frontend/src/joiner/classes.ts` (`:2325-2400`), `frontend/src/redux/reducer/reducer.ts` (`:185-240`);
`docs/spec/claude_spec_2026-09-13_computational_model.md` (`:27-100`, `:130-230`); `docs/decisions.md` (R-SIM-2,
R-SIM-17..19, R-SIM-39..66); `docs/discovery/discovery_2026-09-25_state_operator_core_types.md` (§5.3, §7.3, §7.4);
`docs/log-inbox/simulation.md`; `CLAUDE.md`.

**Probes** (gitignored, kept):
- `frontend/scripts/smoke/_tmp_c_probe.vitest.config.ts`, `frontend/scripts/smoke/_tmp_c_probe/decls.test.ts`:
  pure core, `npx vitest run --config scripts/smoke/_tmp_c_probe.vitest.config.ts --silent=false`, exit 0,
  6 tests, 49 `[C]` lines (§7.1-§7.4, §7.7, §7.8).
- `frontend/scripts/smoke/_tmp_c_vite.config.ts`: the 3002 server of this tree, own cache dir in the scratchpad.
- `frontend/scripts/smoke/_tmp_c_scenario.js`, `frontend/scripts/smoke/_tmp_c_live.ts`: `npx tsx`, exit 0 (§7.5).
- `frontend/scripts/smoke/_tmp_c_bagkey.ts`: `npx tsx`, exit 0 (§7.6).

`npm run check:scripts` with these files on disk: exit 1, one finding, the known `_tmp_sim1_verify.ts:186`
(58 files scanned, 22 of them `_tmp_*`); none in the `_tmp_c_*` probes.

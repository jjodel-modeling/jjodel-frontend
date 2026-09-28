# Discovery — lane C2 of the simulator: derived state attributes (nuXmv `DEFINE`)

- Prompt-ID: `P-2026-09-27-0140` (`docs/prompts/claude_2026-09-27_0140_prompt_sim_derived_attributes_discovery.md`)
- Chat: `C-2026-09-26-1702`; session `cd30882e-3c69-4f8e-93eb-19831296de9f` (launched by `lane-run`, unattended)
- Tree: `~/jjodel-icons`, branch `sim-derived`, HEAD `4faa9de7a` (parent `8b5871f29`, closure of lane C1)
- Executor: Anthropic Claude Opus 5.5 (`claude-opus-5-5`)
- Phase 1, read-only. No source file edited. This report is a set of hypotheses with evidence, not a reference:
  whoever uses it downstream re-reads the real files.

Tags: **[R]** read in a file at HEAD `4faa9de7a`; **[M]** measured in this phase on that HEAD (pure probe under
vitest, live probe on a dev server of this tree on port 3005).

P15 note: RC-25..RC-30, cited by the prompt, are not on this branch. `88fe737b7` (ratify RC-25..28) is not an
ancestor of HEAD (`git merge-base --is-ancestor` exit 1); they were read from
`alfonso-frontend-jjtl:docs/decisions.md:187-236`. The two closing sections follow RC-26 as written there.

---

## 0. Answer in brief

- **What C1 left.** A stored attribute reaches a guard or an action through one chain: `netStep.ts` `stateAccess`
  reads `state.attrs` → `guardContext.ts` `toJjelStateAccess` adds `marked`/`tokens` → JjEL
  `evaluateStateAccess` throws on `undefined`. σ is a new immutable `SimState` per fired step; nothing is memoised
  per configuration. The codec ignores `equation`, and a derived-only record is today a record defect («initial not a
  JjEL literal»). The panel's table **drops `equation` from every record at the first edit of any cell** [M, live].
  `simStateOutput` and `simTransitionOutput` have no reader at all.
- **Recommended strategy: E1, eager.** After each fired step, and at Reset, every derived attribute is evaluated once
  on the new σ, in dependency order, into a read-only `derived` part of `SimState`; `stateAccess.read` falls back to
  it, so `toJjelStateAccess` and the guard/action oracles do not change. The core calls an optional derived oracle
  after assembling σ′ and halts on a failure or an out-of-domain value, as it does for actions. Measured cost:
  10 000 evaluations (20 derived × 500 elements) in 5.2 ms per step.
- **Graph:** keyed by attribute name, from the `StateAccess` nodes of each equation; conservative (one measured false
  positive), sound, a few lines. Cycle = declaration defect at Reset.
- **Exported interfaces that change:** `StateAttributeDecl` (`initial` optional, `equation?`), `SimState`
  (`derived?`), `HaltReason` (two variants), `DeclarationDefectCode` (new codes), `StateAttributeRecord`
  (`equation?`), `step` (optional sixth parameter), `SimRun` (`derived?`), `CompileDefect.reason` (one literal). All
  additive or authorized by R-SIM-72; no consumer outside the lane.

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | A read-only value can be served to guards and actions through the C1 accessor chain without touching `guardContext.ts` | **holds** | [M] §4.1: a guard on σ1 reads `p2.[busy]`, `model.[total]`, `p1.[loaded]` through the unchanged `toJjelStateAccess` over a `SimStateAccess` whose `read` falls back to a derived map: `true`; without the map: defect |
| H2 | The existing evaluator evaluates an equation with `self` the owner | **partly** | [M] per-element owners work through `buildGuardContext`; for a global (owner = the model) `buildGuardContext(snapshot, {transitionId: 'M'})` returns `null`, because the model is not in `handleById` (`guardContext.ts:165-166`). A second builder is needed |
| H3 | Dependencies can be read from the AST | **holds, by name only** | [M] §4.2: `StateAccess.attribute` gives the name; the element is static only for the roots `self`, `model` and an instance name; `self.target.[b]` and `(if … then p1 else p2).[b]` have no static root |
| H4 | A cycle is detectable on the AST at Reset | **holds** | [M] `a := model.[b] + 1`, `b := model.[a]` → cycle `a, b, a`; `a := self.[a] + 1` → `a, a` |
| H5 | The codec «ignores» `equation` (R-SIM-68) in a way that keeps it | **falsified for the table** | [M] decode ignores it (a record with both decodes as stored); `stateAttributeRows` drops it and `encodeStateAttributes` rewrites every record without it; live on 3005 the raw string after one edit of row 1 has no `equation` |
| H6 | The C1 table survives a record carrying `equation` | **partly** | [M, live] it renders (no crash, three rows of 60 px), the derived-only row shows an empty initial cell; but any edit erases every `equation` (H5), and Reset lists `1 defect: total (initial not a JjEL literal).` |
| H7 | `simStateOutput`/`simTransitionOutput` go through the state path today | **falsified** | [R] no reader outside `roleCatalog.ts` and `simProfiles.ts` (§3.5) |
| H8 | E1 and E2 give the same values | **holds when `event` is excluded and E2's memo is keyed by σ** | [M] §4.1: same values on σ1; E2 memo per σ 3 evaluations for 3 guard reads, per accessor 9 |

---

## 2. Objective

Map what C1 left for derived attributes (R-SIM-19, R-SIM-51, R-SIM-72), where an equation would be evaluated, what
each strategy costs, and how the dependency graph, the record and the panel should look, so that the chat can fix
one design for Phase 2 without a second discovery.

---

## 3. What exists [R]

### 3.1 The accessor chain from σ to a guard and an action

1. σ is `SimState` (`netTypes.ts:68-73`): `marking`, `attrs` («Element id (the model id for a global) → attribute →
   value»), `presentation`.
2. The core's accessor, `netStep.ts:50-57`:
   `read: (elementId, attr) => state.attrs.get(elementId)?.get(attr),` and
   `readPresentation: attr => (site === undefined ? undefined : state.presentation.get(site)?.get(attr)),`.
3. The JjEL adapter, `guardContext.ts:189-198`: `marked` and `tokens` answered on places only, then
   `return access.read(elementId, attr);`.
4. The hook on the context, `guardContext.ts:173-175`: `const ctx = snapshot.base.child({ self, event, model: snapshot.model }); if (state) ctx.stateAccess = state;`, inherited by child scopes (`jjel/evaluator/context.ts:356`).
5. The evaluator, `jjel/evaluator/evaluator.ts:1016-1019`: `const value = access.read(id, expr.attribute); if (value === undefined) { throw new JjelEvaluationError(\`'${expr.attribute}' is not a state attribute of …\`` — never a silent null.
6. Guards: `simBridge.ts:156-161` builds the context per call with
   `toJjelStateAccess(state, places)`; actions: `actionEvaluator.ts:211`, same adapter, `self` the site element.

The accessor reads only `state.attrs`; `CompiledNet.declared` is consulted by the core for assignments
(`netStep.ts:238`), never by a read. So a value placed where `stateAccess.read` looks is visible to every guard,
action and future equation with no change to steps 3-6.

### 3.2 Where σ is materialised, and memoisation

- Initial σ: `compileNet`, `netCompile.ts:478` `initial: { marking, attrs, presentation },` with
  `values.set(decl.name, decl.initial);` at `:464`. Installed as `config: { state: net.initial, event: null }`
  (`simBridge.ts:328`).
- Per step: `netStep.ts:250-254` builds a new `SimState` from the new marking and `applyAll` of the writes; a discard
  keeps `cfg.state` (`:222`), a quiescence returns `cfg` itself (`:221`), a halt keeps `cfg.state` (`:225`).
- Committed by `simCommit`, `simRunState.ts:113-124`.
- Memoised: only `transitionsById` per net (`netStep.ts:75-84`, a `WeakMap` on `CompiledNet`). Nothing is memoised
  per configuration: `candidates` builds `stateAccess(state)` per call (`netStep.ts:147`), the step one per action
  site (`:235`), and the bridge recomputes candidates for the status and the reasons (`simBridge.ts:649`, `:758`).
- Guards and actions are compiled once per run (`compileGuards`, `simBridge.ts:137-149`;
  `compileActionTable`, `:179-193`) and evaluated on every call.

### 3.3 The codec and `equation`

- The header says it: `stateAttributesCodec.ts:16-17` «Unknown fields are ignored, so lane C2 adds `equation` without
  a new format.»
- `decodeRecord` requires the initial literal: `:108-109`
  `const initial = typeof r.initial === 'string' ? parseInitialLiteral(r.initial) : null; if (initial === null) return defect('initial not a JjEL literal');`.
- `StateAttributeRecord` (`:29-35`) has five fields; `stateAttributeRows` (`:141-151`) builds exactly those five, and
  `encodeStateAttributes` (`:58-64`) writes exactly those five. The row model is what the panel edits and re-encodes
  whole (`SimulationPanel.tsx:216`, `:228-233`). Hence §4.4.

### 3.4 The panel's table

`SimulationPanel.tsx:208-214`: «one row of two fixed lines per declaration (name, metaclass or global, initial value
as a JjEL literal; space, domain kind and its fields)». Line 1 (`:312-336`): name cell, metaclass select, initial
cell (`:326`, aria «Initial value of state attribute n, a JjEL literal»), remove. Line 2 (`:337-373`): space select,
domain select, domain fields; presentation hides the domain cells but keeps them «so the row keeps its layout»
(`:347`). `patchOf` (`:235-260`) maps a cell to a field; `add` (`:293-295`) creates a stored boolean `x<n>` with
`initial: 'false'`. For an equation the table needs: the field in the row model (codec), a way to say stored or
derived, an equation cell, and `patchOf`/`add` cases.

### 3.5 `simStateOutput` and `simTransitionOutput`

- `roleCatalog.ts:163-170`: group `output`, keys `simStateOutput`, `simTransitionOutput`, kind `attribute`; the header
  `:9-10`: «new and provisional (R-SIM-52): nothing reads or writes them yet».
- `simProfiles.ts:162-167`: active and required in the Moore and Mealy profiles.
- Not in `ROLE_SPECS` (`simRoleStatus.ts`: search for `simStateOutput` returns nothing; control `simGuard` found at
  `:24`, `:65`), so the M2 face has no select for them; not in `ROLE_KEYS` of `netCompile.ts:46-55`, so no run reads
  them. Search: `command grep -rn 'simStateOutput\|simTransitionOutput\|stateOutput\|transitionOutput'` over
  `frontend/src` (`*.ts`, `*.tsx`), exit 0, hits only in `roleCatalog.ts` and `simProfiles.ts`, which is also the
  positive control of the search.
- R-SIM-51 (`docs/decisions.md:1770-1774`): «letti dal modello congelato del run … Gli output calcolati sono attributi
  derivati (R-SIM-19)». Read as: an output bound by the role is a feature read on frozen M (no JjEL, no σ beyond the
  marking); a *computed* output is a derived attribute. So the two go through **separate paths**: role-bound outputs
  are a frozen-M read keyed by the marked place (Moore) or the fired transition (Mealy); computed outputs are C2
  derived attributes, read from σ like any other. Neither path exists today.

### 3.6 JjEL entry points

`parseExpressionStrict` (`jjel/parser/parser.ts:929-947`) for expressions, `parseAction` (`:951-967`) for actions;
`StateAccessExpr` (`jjel/types/ast.ts:324-328`: `type: 'StateAccess'; object: JjelExpression; attribute: string;`);
`STATE_RESERVED` (`jjel/stateReserved.ts:14-23`): roots `self`, `event`, `model`, `node`, read-only `marked`,
`tokens`. The subset checker (`subsetChecker.ts:387-394`) flags `node` as `E-NODE` whatever the space
(`:272`), and has no rule on `event`. `actionEvaluator.ts:138-146` already has `dependsOnStep`, which detects
`StateAccess` and the identifier `event` on an AST.

---

## 4. Measurements [M]

Pure probe: `frontend/scripts/smoke/_tmp_c2_probe/derived.test.ts`, run with
`npx vitest run --config scripts/smoke/_tmp_c2_probe.vitest.config.ts --silent=false --reporter=verbose`, exit 0,
7 tests passed, 44 `[C2]` lines (the verbose reporter is needed: the default one prints no console output of passed tests, measured: 0 lines). Fixture: `cnet` of `simBridge.test.ts:689-707` (the `b2net` topology
`p1 (3 tokens) -a1-> t1 -a2-> p2`, ids `P1x`, `T1x`, `P2x`, plus the action roles), run through the real
`startRun`/`pressInput`, with `visits` declared on places (`0..3`, initial `0`), `t1` action
`p2.[visits] := p2.[visits] + 1`, `p1` exit `p1.[visits] := p1.[visits] + 1`. Equations were evaluated by hand with
`JjelEvaluator.evaluateWithDiagnostics` on a snapshot frozen by `freezeSnapshot` over the same record builder.

### 4.1 (a) A derived attribute over stored ones, read by a guard

Equations: `busy := self.[visits] > 0` and `loaded := self.[tokens] >= 2` per place, `total := p1.[visits] + p2.[visits]`
and `count := (if p1.[busy] then 1 else 0) + (if p2.[busy] then 1 else 0)` global.

```
a.global self: buildGuardContext(snapshot, {transitionId: M}) = null
a.E1 at Reset {"p1":{"busy":false,"loaded":true},"p2":{"busy":false,"loaded":false},"cnet":{"total":0,"count":0}} failures [] outside []
a.step ε: t1 (p1 → p2) fired
a.σ1 attrs {"p1":{"visits":1},"p2":{"visits":1}} marking {"P1x":2,"P2x":1}
a.E1 after step {"p1":{"busy":true,"loaded":true},"p2":{"busy":true,"loaded":false},"cnet":{"total":2,"count":2}} failures [] outside []
a.E1 wrong order (count before busy) failures ["M.count: JjelEvaluationError: 'busy' is not a state attribute of p1"]
a.guard on σ1 with the map of σ0 (stale) {"kind":"false"}
a.guard on σ1 (E1 map)                    {"kind":"true"}
a.guard on σ1 without the map {"kind":"defect","reason":"exception","detail":"JjelEvaluationError: 'busy' is not a state attribute of p2"}
a.E2 memo per σ: three reads ["true","true","true"] evaluations 3
a.E2 memo per accessor: three reads ["true","true","true"] evaluations 9
```

(The probe's line for the stale case prints «on σ0 (E1 map)»; the state passed was σ1 with σ0's map, as the
parenthesis on the same line says.) The guard was
`p2.[busy] and model.[total] == 2 and not p1.[loaded] == false`. Findings: the chain works for a read-only value; the
global owner needs its own context builder (`self` bound to the model root, as the probe did with
`snapshot.base.child({ self: snapshot.model, event: null, model: snapshot.model })`); evaluation order matters when
the map starts empty, and a failure is loud; a stale map gives a wrong answer silently.

### 4.2 (b) Dependencies and cycles

```
b.reads a [{"attr":"b","root":"model"}] b [{"attr":"a","root":"model"}]
b.cycle a,b ["a","b","a"]
b.bare `b + 1`: StateAccess reads [] identifiers are M names, not state
b.self cycle ["a","a"]
b.acyclic null order by names: busy before count
b.name graph: Place.a := self.[b], PTr.b := self.[a] cycle ["a","b","a"]
b.(metaclass, name) graph with self resolved cycle null
b.roots of three paths (self.target, p1, a σ-dependent if) [null,"p1",null,"model"]
b.checkGuardSubset node.[color] == 'red' ["E-NODE"]
b.checkGuardSubset self.[visits] > 0 []
b.checkGuardSubset event == null []
b.checkGuardSubset if self.[visits] > 0 then 1 ["E-NOELSE"]
b.checkGuardSubset forall x in self.out | true ["E-FORALL"]
b.checkGuardSubset now() ["E-CALL"]
```

The prompt's shorthand `a := b + 1` has no `StateAccess`: a bare `b` is an identifier of M, an absent one at run
time; the record form is `model.[b] + 1`. The name graph has a false positive when two metaclasses use crossing
names; the (metaclass, name) graph removes it only for the `self` root.

### 4.3 (c) Equations that throw or leave the domain

```
c. model p9.[visits] -> {"ok":false,"why":"JjelEvaluationError: '.[visits]' needs a model element on its left, got null"}
c. model p1.[nosuch] -> {"ok":false,"why":"JjelEvaluationError: 'nosuch' is not a state attribute of p1"}
c. model p1.[visits] / 0 -> {"ok":true,"value":null} inDomain 0..3: false
c. p1 (self.[visits] + 1) / 2 -> {"ok":true,"value":0.5} inDomain 0..3: false
c. model p1.[visits] + 10 -> {"ok":true,"value":10} inDomain 0..3: false
c. model p1.[marked] -> {"ok":true,"value":true} inDomain 0..3: false
c. model t1.[tokens] -> {"ok":false,"why":"JjelEvaluationError: 'tokens' is not a state attribute of t1"}
```

A missing element and an unknown attribute throw (the evaluator never returns a silent null there). Division by zero
does **not** throw: it returns `null`, which is not a `SimValue`; a half is a number outside an integer range.
Both are caught only by a type and domain check on the value.

### 4.4 (d) The codec and the table on a record with `equation`

Records: `visits` (stored), `total` (global, `equation` only), `both` (`initial: '0'` and `equation`).

```
d.decode decls [{"name":"visits","initial":0,...},{"name":"both","initial":0,"keys":["name","metaclass","space","domain","initial"]}] defects [{"index":1,"name":"total","code":"record","message":"initial not a JjEL literal"}]
d.rows [{"name":"visits","initial":"0",...},{"name":"total","initial":"",...},{"name":"both","initial":"0",...}]   (keys: the five, no equation)
d.equation survives the edit false
d.re-decoded defects [{"index":1,"name":"total","code":"record","message":"initial not a JjEL literal"}]
d.compileNet without initial: declarationDefects [{"index":0,"name":"total","code":"initial","message":"initial undefined outside 0..6"}] σ attrs of M [["total",null]]
```

The last line measures the Rule 11 readers of `StateAttributeDecl.initial` in the compiler: a declaration without
it reaches `inDomain(decl.initial, domain)` (`netCompile.ts:384`) and `values.set(decl.name, decl.initial)`
(`:464`), which puts `undefined` in σ.

### 4.5 On 3005 (live, `_tmp_c2_live.ts`, `npx tsx`, exit 0)

Dev server of this tree: `npx vite --port 3005 --strictPort` (3000, 3001, 3003, 3004 were listening and were not
touched; 3002 was free and left alone per the prompt), this tree's own cache `frontend/.vite-cache`
(`vite.config.ts` `cacheDir`), stopped at the end (`lsof -iTCP:3005` empty after). Scenario `_tmp_c2_scenario.js`
(copy of `~/jjodel-sim/frontend/scripts/smoke/_tmp_c_scenario.js`, one action on `t1`, `p2` entry blank) in the
RowViewSmoke project; `simAction` and `simStateAttributes` written through the proxy as the panel writes them.

```
1.RAW written === read true
1.ROW 1 visits: initial "0", metaclass Place, semantic, range 0..3, height 60
1.ROW 2 total:  initial "" (placeholder "initial"), Global, semantic, range 0..6, height 60
1.ROW 3 both:   initial "false", Global, semantic, boolean, height 60
2.RAW after editing row 1 {"v":1,"attrs":[{"name":"visits",…,"initial":"1"},{"name":"total",…,"initial":""},{"name":"both",…,"initial":"false"}]}
2.equation kept false
3.RAW restored true
READ 3.reset {"status":"Running","lines":[{"text":"1 defect: total (initial not a JjEL literal).","title":"total: initial not a JjEL literal"},{"text":"Last step: Reset",…}]}
READ 3.step  {"status":"Running","lines":[{"text":"1 defect: total (initial not a JjEL literal).",…},{"text":"Last step: ε: t1 (p1 → p2) fired","title":"Last step: ε: t1 (p1 → p2) fired\nassignments: p2.visits = 1"}]}
ERRORS 1   console: failed to get project {project: null}   (the known ticket of the C1 entry)
```

The positive control of step 2 discriminates: the edit did land (row 1's `initial` became `"1"` in the raw string),
and in the same write both `equation` fields disappeared and `total` gained `"initial":""`. The table shows the
derived row as a stored row with an empty initial, and the record with both as a plain stored row (screenshot
`/tmp/c2-shots-cd30882e/c2_01_table_with_equation.png`, outside the tree).

### 4.6 (e) Cost

```
e.one ε press: guard calls 2 fresh accessors 2 | the panel view after it: guard calls 2 fresh accessors 2
e.E1 n=1 m=10: 10 evaluations, 0.03 ms per step, 2.6 µs each
e.E1 n=5 m=100: 500 evaluations, 0.52 ms per step, 1.0 µs each
e.E1 n=10 m=200: 2000 evaluations, 1.19 ms per step, 0.6 µs each
e.E1 n=20 m=500: 10000 evaluations, 5.19 ms per step, 0.5 µs each
```

Equation used for the timing: `self.[visits] + k > 2 and model.[g] < 5`, each owner through `buildGuardContext`
(five repetitions, first run discarded). The «panel view» counted is `netRunStatus` plus `stopReason` only, a lower
bound of what the panel computes per action (it also calls `inputReason` per enabled button).

---

## 5. Two evaluation strategies

### E1, eager

After σ′ is assembled in `step` (`netStep.ts:250-254`) and on `net.initial` at Reset, every derived attribute is
evaluated once on that σ, in dependency order, into a fresh read-only `derived` part of `SimState`; `stateAccess.read`
reads `attrs`, then `derived`. The evaluation is an oracle passed to the core, like guards and actions
(R-SIM-14 keeps JjEL out of the core): `DerivedOracle = (state: SimState) => ok(values) | defect(element, attr, detail)`,
an optional sixth parameter of `step`, whose only production caller is `simBridge.ts:764` (search `step(` in
`model/simulation` and `components/editor-v2/sim`, tests excluded: one caller). The core checks each value against
its declaration as it does for assignments (`netStep.ts:243`).

- **Files**: `stateAttributesCodec.ts`, `netTypes.ts`, `netCompile.ts`, `netStep.ts`, a new
  `model/simulation/derivedEvaluator.ts` (compile, graph, order, oracle, the equation context), `simBridge.ts`,
  `simRunState.ts` (type of `SimRun`), `SimulationPanel.tsx`, perhaps `simulation-panel.scss`; tests for each.
  `guardContext.ts` and `actionEvaluator.ts` unchanged.
- **Interfaces**: `StateAttributeDecl.initial?`, `.equation?`; `SimState.derived?` (optional: every existing
  constructor still compiles); `HaltReason` + `derived` (element, attr, detail) and `read-only` (site, element,
  attr); `DeclarationDefectCode` + equation codes; `step(…, derived?)`; `SimRun.derived?`.
- **Cycle**: found at Reset on the graph; the members are not evaluated, so a read of one throws «is not a state
  attribute» (a guard defect, or an action halt); a declaration defect names them.
- **Runtime error**: at Reset a declaration defect in the defects line, the value absent, the run starts (C1's rule:
  defects reported, not enforced, `netCompile.ts:403-404`); after a step a halt `derived`, σ unchanged, like
  `action-defect`. A value that is not a `SimValue` (`1 / 0` gives `null`, §4.3) is the same failure.
- **Out of domain**: at Reset a declaration defect with the value kept (parity with C1's initial outside its domain,
  `netCompile.ts:384-386` reports and `:464` applies); after a step a halt `domain`, the existing kind
  (`netTypes.ts:261`), so `haltMessage` already words it.
- **Cost**: Σ over derived declarations of their owners, once per fired step and once at Reset; 0.5-2.6 µs each
  (§4.6), 5.2 ms for 10 000. Discard, quiescence and halt keep σ and so keep `derived` with it: no evaluation. Reads
  cost a map lookup; the panel can show a derived value (a computed output, R-SIM-51) without evaluating anything.

### E2, lazy

`toJjelStateAccess` (or a resolver beside it) evaluates a derived attribute when read, memoised per σ.

- **Files**: the same minus the step oracle, plus `guardContext.ts` (the resolver, the memo, a re-entrancy guard);
  the bridge wires the resolver into both oracles.
- **Interfaces**: the declaration and `HaltReason` changes as E1 but `derived`; and, for a memo per σ, a way to reach
  the `SimState` from the accessor: `SimStateAccess` (`netTypes.ts:82-84`) exposes only reads, and a new accessor is
  built per `candidates` call and per action site (§3.2). Without that change the memo is per accessor: 9
  evaluations instead of 3 for three reads (§4.1), and 4 fresh accessors per ε press on cnet (§4.6).
- **Cycle**: the static check is the same; a cycle the static graph misses would recurse until the stack overflows
  unless the resolver keeps an in-progress set.
- **Runtime error**: surfaces as the reader's failure: a guard defect (the arc leaves the candidates, attributed to
  the guard) or an action defect (a halt attributed to the action). A derived attribute nobody reads is never
  evaluated, so its failure and its domain are never checked, against spec §3.2 («the domain is checked at the
  boundary of every effect … never a state that propagates»).
- **Cost**: only what is read, but per panel action the bridge evaluates guards several times (§4.6), and the panel
  would need the evaluator in its render path to show a derived value.

### Which one is `DEFINE`

A `DEFINE` is a pure function of the current state. Both strategies compute f(σ) for the σ being read, so both are
exact **provided** (i) the equation cannot read `event`, and (ii) E2's memo is keyed by σ, not by accessor. With
`event` readable E2 is not a `DEFINE`: evaluated inside a guard context it would see the step's input, a function of
state and input; E1 always evaluates with the event consumed (`next.event === null`, `netStep.ts:257`), where `event`
is constantly `null`. E1 additionally makes every state of the trace carry its derived values (the value is fixed
when the state exists, restored with it by the step-back primitive of `simReset`, `simRunState.ts:93-101`), and
checks every derived value at every effect, which is the spec's domain rule. **Recommended: E1.** It amends the
description of C2 in R-SIM-71 («risolutore in lettura in `guardContext.ts`»), a provisional row.

---

## 6. Dependency graph and cycles

- **Reading the dependencies.** Walk the equation's AST and collect `StateAccess.attribute`. The element is static
  only when the object is the identifier `self` (the owner), `model` (the model) or an instance name of the frozen
  M; any feature navigation (`self.target.[b]`) or σ-dependent expression has no static element (§4.2, the `roots`
  line). `actionEvaluator.ts:138-146` (`dependsOnStep`) and `foldActionTarget` (`:155-165`) show that a path free of
  σ and `event` could be folded over frozen M, per owner.
- **G1, by name** (recommended): an edge `a → b` when the equation of a derived named `a` reads `.[b]` and some
  derived is named `b`. Sound (a superset of every real dependency), a few lines, and its topological order is a
  correct evaluation order for E1 (§4.1: `busy` before `count`). Cost: rejects a model that is acyclic per element
  (§4.2: `Place.a := self.[b]`, `PTr.b := self.[a]`), and any recursion over M's structure
  (`depth := self.parent.[depth] + 1`), which nuXmv would accept when M is acyclic.
- **G2, by (metaclass, name)**: removes the false positive for `self` only; every other path falls back to the name.
  More code for a partial gain.
- **G3, by (element, attr)**, folding each path per owner over frozen M, the name as fallback: exact where M decides,
  the shape nuXmv's flattening has. Additive over G1 without a format change; worth it when a use case needs it.
- **The cycle defect** at Reset, one per declaration in the cycle: `total (equation cycle: total → count → total)`.
- **`self`**: the owner element; for a global, the model root (the value of `model`), so `self.[x]` and `model.[x]`
  agree. Needs a context builder of its own, since `buildGuardContext` returns `null` for the model (§4.1).
- **`model`**: allowed, as in guards.
- **`event`**: forbidden, a declaration defect («an equation reads event»). nuXmv would need the event `IVAR` in the
  `DEFINE`, and under E1 it would always read `null` (§5). `checkGuardSubset` does not flag it (§4.2), so the check
  is the derived compiler's own, over the same AST walk as `dependsOnStep`.
- **`node`**: `E-NODE` in a semantic equation (the checker already reports it, §4.2); in a presentation equation it
  is allowed and means the owner's presentation, so the derived compiler skips `E-NODE` there, as `compileAction`
  does for a `node` target (`actionEvaluator.ts:79-86`). The other `E-*` codes of the checker apply unchanged
  (`E-NOELSE`, `E-FORALL`, `E-CALL`, measured).

---

## 7. Record and panel

- **Record (R-SIM-72).** `decodeRecord` checks exclusivity: both present → record defect «initial and equation»;
  neither → «no initial or equation» (today's «initial not a JjEL literal» when the initial is missing,
  `stateAttributesCodec.ts:108-109`). `equation` must be a non-blank string. Parse, subset, `event` and cycle
  checks are **declaration** defects at Reset, not record defects: the declaration stays, so an action that
  assigns it is refused as read-only rather than as undeclared (C1's «a defective declaration still applies where it
  can», `netCompile.ts:403-404`).
- **Field order.** R-SIM-67's fixed order holds: `name, metaclass, space, domain`, then `initial` or `equation`,
  never both.
- **Row model.** `StateAttributeRecord` gains `equation?`; `stateAttributeRows` and `encodeStateAttributes` carry it,
  which alone stops the data loss of §4.5 (the panel re-encodes through them). `initial` stays a string in the row
  (`''` for a derived row), so the panel's row type does not change shape.
- **Rule 11, readers that assume `initial`.** `netCompile.ts:384-385` (the domain check), `netCompile.ts:464` (the
  initial σ), `stateAttributesCodec.ts:108-110` (builds it), and the test helper `actionEvaluator.test.ts:72`
  (`space.get(el)!.set(d.name, d.initial);`). The panel reads the row's `initial` (`SimulationPanel.tsx:238`, `:326`),
  a different type. Search: `command grep -rn '\.initial\b'` over `model/simulation` and `components/editor-v2/sim`
  with `net.initial`, `stc.initial`, `profile.modes.initial` set aside by reading each hit.
- **Table.** An explicit select «stored | derived», not the presence of the cell: a new derived row with no equation
  typed yet would otherwise be indistinguishable from a stored row with an empty initial (exactly what the C1 table
  shows today, §4.5). For a derived row the value cell becomes the equation cell (aria «Equation of state attribute
  n, a JjEL expression», full text in `title`); switching kind clears the other field. The equation is longer than a
  literal: on the measured 60 px two-line row the initial cell is the narrowest; a third line for the equation, only
  on derived rows, is the likely layout. Decided at the visual check.
- **An action assigning a derived attribute.** At Reset, when the target folds, `actionDefectsOf`
  (`simBridge.ts:237-283`) finds a declaration with an equation and reports `t1 action (assigns derived 'total')`
  (`CompileDefect.reason` + `read-only`); at run time the core refuses it beside the undeclared check
  (`netStep.ts:238-239`) with the halt `read-only`, «Halted: the transition action of t1 failed: 'total' is derived
  and cannot be assigned.»

---

## 8. Phase 2 shape

One lane, two code commits as C1: (1) pure core and bridge (`stateAttributesCodec.ts`, `netTypes.ts`,
`netCompile.ts`, `netStep.ts`, `derivedEvaluator.ts` new, `simBridge.ts`, `simRunState.ts`, tests); (2) panel
(`SimulationPanel.tsx`, perhaps `simulation-panel.scss`). More than five files: Rule 19 listing at Phase 2 start.
No critical-zone file (CLAUDE.md §3.1). Visual check: the table and the defects line. Oracle of non-regression: with
no derived declared the oracle is absent and `step` is unchanged (as `NO_SIM_ACTIONS`, `simBridge.ts:164`).

---

## 9. Risks

1. **Data loss today.** Any edit of the C1 table erases every `equation` (§4.5). No one writes equations yet; the
   codec change of C2 must land before, or with, anything that does.
2. **Stale derived map.** A map not recomputed after a step answers silently wrong (§4.1). E1 must build `derived`
   fresh on every σ′, never copy the previous one forward (as `applyAll` copies `attrs`).
3. **Division by zero is `null`** (§4.3), not an error: the value check must reject non-`SimValue`s, or the failure
   passes as a value.
4. **Name graph false positives** (§4.2) reject valid models; the message must name the cycle so the author can
   rename.
5. **Error wording.** A derived attribute that failed at Reset is absent, so a reader gets «'total' is not a state
   attribute of cnet», true of the value, misleading about the declaration. Phase 2 may distinguish «derived 'total'
   has no value» in the accessor.
6. **R-SIM-51.** The Mealy output of the last firing is λ(q, t): evaluated on the σ before the step. Under E1 that
   σ is `run.config.state` before `simCommit` (`simBridge.ts:755-765`), readable without a label change; the output
   lane decides.
7. **RC-27.** The recommendation of E1 touches more than one exported interface (`SimState`, `HaltReason`,
   `StateAttributeDecl`, `step`); RC-27 asks a second agent's `Verified:` line before adoption.

---

## 10. Decisions taken (unattended)

Numbered, one recommendation each; RC-25 (`provisional, unattended`) applies when the chat adopts them.

1. Strategy E1: eager evaluation into `SimState.derived`, by an optional `DerivedOracle` of `step`, at Reset and after
   every fired step. Recommended: E1 (§5). Amends the provisional R-SIM-71 on where C2's resolver lives.
2. Equation roots: `self` the owner, the model root for a global; `model` allowed; `event` forbidden (declaration
   defect); `node` `E-NODE` on a semantic equation, allowed on a presentation one. Recommended as stated (§6).
3. Dependency graph keyed by name (G1), cycle as a declaration defect on every member, topological order by name as
   the evaluation order; G3 left as an additive refinement. Recommended: G1 (§6).
4. A failing equation: declaration defect at Reset (value absent, run starts); halt `derived` after a step, σ
   unchanged; a non-`SimValue` result counts as a failure. Recommended as stated (§5).
5. A derived value out of domain: declaration defect at Reset with the value kept; halt `domain` after a step.
   Semantic derived attributes keep C1's required domain. Recommended as stated (§5).
6. Record: exclusivity in the codec as a record defect; parse, subset, `event`, cycle as declaration defects;
   `StateAttributeDecl.initial?` and `.equation?`; `StateAttributeRecord.equation?` with `initial` `''` in derived
   rows. Recommended as stated (§7).
7. Panel: a «stored | derived» select, an equation cell for derived rows, layout fixed at the visual check.
   Recommended (§7).
8. Action on a derived target: compile defect `read-only` at Reset when the target folds, halt `read-only` in the
   core. Recommended (§7).
9. Presentation derived attributes: in the same pass, readable by `node.[x]` of their own element only.
   Recommended.
10. R-SIM-51 outputs: not wired in C2; role-bound outputs are a separate frozen-M path, computed outputs are derived
    attributes on the E1 path (§3.5). Recommended: a lane of its own after C2.
11. Phase 2: one lane, two code commits, Rule 19 listing, visual check (§8). Recommended.

## 11. Decisions awaiting Alfonso

None of the RC-26 list: no critical-zone file; every exported interface that changes is additive or authorized by
R-SIM-72, with its consumers inside the lane (§5, §7); no R- row ratified by Alfonso is amended (R-SIM-71, amended by
decision 1, is provisional; R-SIM-19 and R-SIM-51 are implemented as written); no file and no persisted data
deleted (the equation loss of §4.5 is C1's current behaviour, which C2 removes); nothing on model, effort, cost or
push. Whether the MODELS demo shows the simulation panel is not written anywhere found
(`command grep -rln 'MODELS demo' docs`: no hit on this branch; the only hit on the trunk is RC-26 itself,
`alfonso-frontend-jjtl:docs/decisions.md:202`); if it does, the table change of decision 7 is an RC-26 item.

---

## 12. Files read and probes

**Read** (full paths under `/Users/alfonso/jjodel-icons/`):
`frontend/src/model/simulation/netTypes.ts`, `stateAttributesCodec.ts`, `guardContext.ts`, `netStep.ts`,
`netCompile.ts`, `guardEvaluator.ts`, `actionEvaluator.ts`, `subsetChecker.ts`, `roleCatalog.ts` (whole);
`frontend/src/model/simulation/simProfiles.ts` (`:162-167`, grep), `frontend/src/model/jjelTriState.ts` (exports);
`frontend/src/components/editor-v2/sim/simBridge.ts`, `simRunState.ts` (whole), `SimulationPanel.tsx` (`:1-60`,
`:160-520`, `:620-660`, `:740-770`, `:900-981`), `simRoleStatus.ts` (grep);
`frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts` (`:1-140`, `:440-520`, `:660-730`, grep);
`frontend/src/model/simulation/__tests__/*` (grep for `.initial`);
`frontend/src/jjel/stateReserved.ts`, `jjel/types/ast.ts` (`:318-335`, `:395-410`), `jjel/evaluator/context.ts`
(`:236-282`, `:350-360`), `jjel/evaluator/evaluator.ts` (`:990-1022`), `jjel/parser/parser.ts` (`:925-970`);
`frontend/vite.config.ts` (server and cache), `frontend/vitest.config.ts`, `frontend/scripts/smoke/states.ts`
(`seed`), `frontend/scripts/smoke/README-probes.md` (`:1-60`);
`docs/PROTOCOL.md` (P1-P4, P11-P16), `docs/decisions.md` (R-SIM-16..26, R-SIM-39..55, R-SIM-67..72),
`alfonso-frontend-jjtl:docs/decisions.md:185-240` (RC-25..30), `docs/spec/claude_spec_2026-09-13_computational_model.md`
(`:27-95`, `:130-230`), `docs/discovery/discovery_2026-09-26_sim_state_declarations.md` (§5, §7.5-7.8, §10),
`docs/log-inbox/simulation.md`; `~/jjodel-sim/frontend/scripts/smoke/_tmp_c_scenario.js`, `_tmp_c1_visual.ts`,
`_tmp_c1_vite.config.ts`, `_tmp_c_probe.vitest.config.ts` (another tree's gitignored probes, read only).

**Probes** (gitignored `_tmp_*`, kept in this tree, not committed):
- `frontend/scripts/smoke/_tmp_c2_probe.vitest.config.ts` and `frontend/scripts/smoke/_tmp_c2_probe/derived.test.ts`:
  pure core and bridge, `npx vitest run --config scripts/smoke/_tmp_c2_probe.vitest.config.ts --silent=false --reporter=verbose`, exit 0, 7 passed (§4.1-§4.4, §4.6).
- `frontend/scripts/smoke/_tmp_c2_scenario.js` and `frontend/scripts/smoke/_tmp_c2_live.ts`: `npx tsx`, exit 0, on
  3005 (§4.5). Screenshots `/tmp/c2-shots-cd30882e/`, server log `/tmp/c2-vite-3005.log`, both outside the tree.

`npm run check:scripts` with these probes on disk: exit 0, «PASS 31 file(s)», 3 of them `_tmp_*`. `git status
--porcelain` empty after the probes.

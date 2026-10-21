# Discovery 2026-10-21 — hardware notation demonstrator: plan of the example project

- Prompt-ID: P-2026-10-21-0950 (`docs/prompts/claude_2026-10-21_0950_prompt_hw_demonstrator_plan.md`)
- Chat: C-2026-10-20-2055 · Front: hw-notation · Phase 1, read-only
- Session: b169adbf-9aa9-48a0-b724-a61ff7a28602 (§0-§8); §9-§13 by P-2026-10-21-1012, session
  66c12855-e1c5-4117-ad8d-d1c752246089, after the AM-8 ceiling (RC-51), from the handoff in
  `~/.jjodel-lanes/P-2026-10-21-0950/handoff.md`; it adds model checking with nuXmv (Alfonso, 2026-10-21)
- Tree: `~/jjodel-w-hwdemo`, branch `hw-demo`, HEAD `3afead0b1` (docs: prompt P-2026-10-21-0950)
- Executor model: Opus 5.5 (`claude-opus-5-5`), effort xhigh
- Baseline: `npm run typecheck` exit 0, no `error TS` line (log `.agent-logs/typecheck-baseline-20261021-094708.log`)

This report is a set of hypotheses with evidence, not a reference. Whoever uses it downstream re-reads the real files.
Tags: **[read]** = read in a file in this phase; **[measured]** = a run in this phase, on HEAD `3afead0b1`;
**[agent]** = reported by an Explore subagent with `file:line`, quote re-checked by me where marked ✓.

## 0. Hypotheses under test

The chat's provisional decisions D1..D5 (prompt §«Decisions taken by the chat»). Verdicts in §8.

## 1. Objective

Plan the demonstrator project (a hardware design notation simulated cycle by cycle and turned into Verilog, checked
against Verilator) into slices that each fit one session, from what the trunk can do today.

## 2. Files read

Read by me (windows as cited): `docs/PROTOCOL.md` (P14, lines 325-349), `docs/decisions.md` (R-GEN 5938-6027, R-LIB
6165-6249), `docs/log-inbox/hw-notation.md` (whole), `frontend/src/jjel/SPEC.md` (531-561),
`frontend/scripts/examples/build-codegen-examples.ts` (3-20), `frontend/scripts/probe/bpmn-lanes-fixture.ts`
(237-274), `frontend/src/model/simulation/stateAttributesCodec.ts` (290-313), `frontend/src/codegen/engine/generate.ts`
(60-109), `frontend/src/codegen/ui/CodePanel.tsx` (grep lines 10, 44, 196-261, 434-473),
`frontend/src/services/export/EcoreService.ts` (grep lines 76-405), `frontend/src/model/CLAUDE.md` (§9.3).

Read by five Explore subagents (Sonnet), conclusions with `file:line` reported in the sections below:
`frontend/src/codegen/examples/{turnstile,petri-producer-consumer}/*`, `frontend/src/codegen/examples/__tests__/importable.test.ts`,
`frontend/src/codegen/oracle/{oracle.ts,__tests__/*}`, `frontend/src/codegen/engine/{templates.ts,templateCodec.ts,origin.ts}`,
`frontend/src/codegen/target/js/{printer.ts,access.ts}`, `frontend/src/jjel/evaluator/builtins/bitvectors.ts`,
`frontend/scripts/oracle/bv-verilator.mjs`, `frontend/scripts/probe/uml-class-object-fixture.ts`,
`docs/spec/claude_spec_2026-10-10_code_generation_pilot.md`, `build-gallery.ts` at `18ce5cdf1` (branch
`library-gallery`); the JjTL, simulator and risk files are listed in §4, §5 and §9.

## 3. How the existing examples are built and shipped (COSA 1)

**Built in the running app by a Playwright probe and saved by the app's own export; never hand-written, never built
in node.**

- Shipped files **[read ✓]**: `frontend/public/examples/codegen/{turnstile,petri-producer-consumer}.jjodel`, a raw
  DProject JSON whose `state` is the whole store compressed with `async-lz-string` (`src/codegen/examples/__tests__/importable.test.ts`, per the agent).
- Generator **[read ✓]**: `frontend/scripts/examples/build-codegen-examples.ts:5` «The files are written by the app's
  own export, not by hand.»; `:9-10` «the fixture's bags are written with the `state` setter, its ids mapped to the
  app's by name»; `:15-16` «Navbar's File → «Download Project» is clicked (`ProjectsApi.save`, then
  `buildProjectExportJson`, then `U.download`)»; run `:18` «`~/.local/bin/node frontend/scripts/lane-run.mjs probe
  <worktree> frontend/scripts/examples/build-codegen-examples.ts`». No npm script **[agent]**.
- It starts from a base scene, not from nothing **[agent]**: it imports `scripts/probe/fixtures/scene_3_DemoESM.jjodel`
  or `scene_2_DemoPetri.jjodel` through `ProjectsApi.importFromText`; the Petri model is built by a JjScript array of
  the fixture (`build-codegen-examples.ts:100` «const JJSCRIPT = (lines: string[], mm: ...»).
- The spec next to each example **[agent]**: `src/codegen/examples/<name>/<name>.json`, keys `name, description,
  scene, profile, metamodelId, modelId, lookup, jjscript, scenario, mutation`; `lookup.MM._state` carries the roles
  (`simNode`, `simInitial`, `simTransition`, `simTrigger`, `simGuard`, `simAction`, `simEntry`, …) and
  `genTemplates`.
- Storage keys **[read ✓]**: `src/codegen/engine/templateCodec.ts:31` «export const GEN_TEMPLATES_KEY =
  'genTemplates';» (metamodel `_state`, R-GEN-12); `src/model/simulation/stateAttributesCodec.ts:44` «export const
  STATE_ATTRIBUTES_KEY = 'simStateAttributes';»; `src/model/simulation/scenarioCodec.ts:43` «export const
  RUN_SCENARIOS_KEY = 'runScenarios';» (model `_state`).
- Tests on the shipped files **[agent]**: `src/codegen/examples/__tests__/importable.test.ts` decompresses `state`,
  checks roles, templates, state attributes and the scenario against the fixture, and runs generation and the oracle on
  the file's store; the import half runs only in the browser probe `scripts/probe/codegen-examples.ts`. The loader
  `src/codegen/oracle/__tests__/exampleFixture.ts` hard-codes `EXAMPLES = ['turnstile', 'petri-producer-consumer']`.
- The gallery build **[measured]** is not on this branch: `build-gallery.ts` exists at `18ce5cdf1`, and
  `git merge-base --is-ancestor 18ce5cdf1 HEAD` says not an ancestor; `git branch -a --contains 18ce5cdf1` lists
  `library-gallery`, `tpl-b1`, `tpl-b2`, `tpl-c`, `tpl-c2`. Per the agent it follows the same pattern (line 6 «The
  files are written by the app's own importers and export, not by hand.»), imports `.ecore`/`.xmi` from
  `scripts/library/gallery/<id>/`, writes viewpoints through `view.ir`, and writes
  `public/library/gallery/<id>/<n>.jjodel`, never rewriting a published version (R-LIB-9).
- `scripts/probe/uml-class-object-fixture.ts` **[agent]**: also in-app (`:3` «built in the real app on its own dev
  server and exported as the File menu's «Download Project» does»), through the helpers of
  `scripts/probe/bpmn-lanes-fixture.ts` (`createProject`, `buildMetamodel` with `pkg.addClass`/`cls.addAttribute`/
  `cls.addReference` at `:242-249`, `buildObjects`, `buildLinks`, `buildViewpoint` with `DViewPoint.newVP` and
  `view.ir = {...}`, `saveScene` at `:184`); no roles, no templates; output outside the repo.

**Recommendation.** One build script `frontend/scripts/examples/build-hw-cpu.ts`, a copy of the
`build-codegen-examples.ts` harness (fresh browser context, `INSTALL` of the `_state` bags by name, scenario store,
rename, Download Project) that builds both metamodels **from nothing** with the `bpmn-lanes-fixture.ts` helpers (no
base scene exists for them), builds the models with JjScript lines or `buildObjects`/`buildLinks`, writes the
viewpoints through `view.ir` (the gallery pattern), and writes `frontend/public/examples/hw/hw-cpu.jjodel`. Next to it
a spec `src/codegen/examples/hw-cpu/hw-cpu.json` in the `turnstile.json` shape (roles, templates, state attributes,
scenario by name), so the node tests read the same truth the script installs. Cost: a dev server and Chromium per
build (no node-only path: the joiner writes to `window`). Generalise `EXAMPLES` in `exampleFixture.ts` so the
existing importable and oracle tests cover the new file. Whether it also enters the gallery (`library-gallery` is not
merged) is §13, item 1.

## 4. D1 — two metamodels, a JjTL transformation, templates on the target (COSA 2)

Files (agent, with my re-reads marked ✓): `frontend/src/jjtl/executor/executor.ts`, `frontend/src/jjtl/parser/parser.ts`,
`frontend/src/jjtl/SPEC.md`, `frontend/src/jjtl/CLAUDE.md`, `frontend/src/components/project/ProjectEditor.tsx`,
`NewTransformationDialog.tsx`, `ExecuteTransformationDialog.tsx`, `JjtlDevelopmentEnv.tsx`, `DockManager.tsx`,
`frontend/src/jjtl/executor/__tests__/{contained-sources,nested-creation-into-features}.test.ts`,
`docs/jjtl/JJTL-DEVELOPMENT-PLAN.md`. No test was run by the agent or by me in this section: «executed» below means
a test file that loads in vitest (the two `executor/__tests__` files mock the `joiner`), not an observed pass.

### 4.1 One project, two metamodels, a transformation — holds

- Header **[read ✓]** `parser.ts:73` «transformation = "transformation" IDENTIFIER "from" IDENTIFIER "to" IDENTIFIER
  (classMapping | helper)*». The names in the header are labels: binding is by the ids stored on the transformation,
  `sourceMetamodelId`/`targetMetamodelId` (`types/transformation.ts:15-17` **[agent]**), and execution looks up
  `metamodels.find(mm => mm.id === transformation.targetMetamodelId)` (`ProjectEditor.tsx:1420` **[agent]**). One
  source model per run (`SPEC.md:108` «Single model per `from`/`to`» **[agent]**).
- Run **[agent]**: transformation tab (`JjtlDevelopmentEnv`), «Execute transformation (Ctrl+Enter)»
  (`JjtlDevelopmentEnv.tsx:683`) → `ExecuteTransformationDialog` (source model, output model name) →
  `ProjectEditor.handleExecuteTransformation` (`:1383`) → `execute(ast, sourceModel, targetMetamodel)`
  (`executor.ts:3321`, called at `ProjectEditor.tsx:1576`), an in-memory result; then the write-back creates a **new**
  M1 model `DModel.new(uniqueOutputName, targetMetamodel.id, false, true)` (`ProjectEditor.tsx:1684`), tagged
  `generatedBy`, and fills it with `DObject.new` plus timer-driven steps 8/8b.
- **No headless path [agent]**: the D-layer write-back lives only in `ProjectEditor.tsx`; tests call `execute()` on
  JSON arrays with a stub metamodel. So the `VerilogAst` model of the demonstrator can only be produced in the app
  (the build script of §3 clicks Execute, or calls the handler in-page), and every claim below about the write-back is
  read, not measured.

### 4.2 References between target objects — implemented, untested on the positive path

- Two passes **[read ✓]** `executor.ts:493-499` «Pass 1 — match each mapping against source instances, evaluate guard
  (`where`), create empty target instances, register them in the trace. […] Pass 2 — evaluate bindings with the full
  trace available, so cross-type resolution (source element → target element) works regardless of rule order.» So a
  forward reference to an object created by a later rule resolves.
- Mechanism **[agent]**: every `:=` goes through `applyCrossTypeResolution` (`executor.ts:2525`) → `resolveValue`
  (`:2598`) → `wrapIfTargetReference` (`:2536`); explicit `resolve(x)` / `resolve(x, T)` intercepted at `:2748-2800`;
  two rules from the same source type require `resolve(x, T)`, else «Ambiguous cross-type resolution» (`:2652`); a
  reference to a type no rule maps resolves to `null`, fail-open (`:2701`). Trace: `targetsBySourceName`
  (`:281`), `context.trace` (`:1325`), `TraceModelBuilder` (`traceModel.ts`, built at `:521`).
- Write-back of a reference **[agent]**: `feature.setValueAtPosition(ri, targetRealId, { isPtr: true })`
  (`ProjectEditor.tsx:2223`, step 8b). Keyed by source id only (`ProjectEditor.tsx:1779`
  `sourceIdToObjectName.set(String(__sourceId), objectName)`): two targets from one source element overwrite each
  other in that map (the agent's inference, not run).
- **Only rule-created objects can be referenced**: an object created *nested* inside a rule (`__nested`) is not a
  reference target (`executor.ts:2542`, `SPEC.md:655-659` **[agent]**).
- **No positive test [agent]**: grep of the jjtl tests for `resolve(`, `__ref_result`, `targetsBySourceName` finds only
  a negative case (`nested-creation-into-features.test.ts:386`). `docs/jjtl/JJTL-DEVELOPMENT-PLAN.md` (last commit
  2026-02-10, `40fc9ff66`) still says «No trace model / No cross-reference resolution» (lines 21-22): stale against the
  executor.

### 4.3 Containment depth — the write-back stores one level of nesting

- **[read ✓]** `ProjectEditor.tsx:1833-1856`: for each top-level instance the write-back collects the children marked
  `__nested` into `pendingNestedCreations`; each child is then created with `slot.addObject` and only its attributes are
  copied (`ProjectEditor.tsx:2017-2023` «if (!childAttrNames.has(k)) continue;»). A grandchild is neither, so it is
  **dropped without a warning** (the agent's reading; the executor itself recurses, `executor.ts:1996`). Executed proof
  exists for level 1 only (`nested-creation-into-features.test.ts:137-157` **[agent]**).
- `VerilogAst` is deep: `Module.items → ModuleInstantiation.instances → Instance.connections → PortConnection` is four
  levels; `Module.items → PortDeclaration → PortId` (after §6.3) and `AlwaysConstruct.eventControl → EventTerm` are
  three. Built from nested creations, all but the first level would be lost.
- The way around it in today's JjTL: **every `VerilogAst` object a rule creates from its own source element** (flat
  rules, each referenceable), with the containment features set by `resolve(...)`. Whether the write-back of a
  *containment* feature through `setValueAtPosition(…, { isPtr: true })` reparents an already-created root object is
  **unknown**: not read, not tested. This is the first measurement S-C must make (§10).

### 4.4 Strings, multi-valued attributes, enums, abstract targets

- String building **[agent, executed]**: `name := parent.name + "." + name` (`contained-sources.test.ts:126`) gives
  `['Person.ssn', 'Person.age', 'Company.vat']` (`:132`). An expression text like `a.name + " + " + b.name` is the
  same mechanism; JjTL bindings are JjEL, so `bits(w, v).toVerilog()` is available (R-BV, §5.0).
- Multi-valued attributes **[agent, read]**: write-back `if (Array.isArray(attrValue)) feature.values = attrValue`
  (`ProjectEditor.tsx:2105`); no test.
- Enums **[agent; design note read ✓ in `jjtl/CLAUDE.md`]**: «Enum values travel through the executor as the
  literal's name, a plain string, and are resolved to the `DEnumLiteral` pointer in `writeAttribute` at write-back
  time» (`ProjectEditor.tsx:2094-2098`). **Hazard**: the lexer lowercases before the keyword lookup (`lexer.ts:330`)
  and `input` is a JjTL keyword (`types/tokens.ts:120`), so a bare `direction := INPUT` does not parse; write
  `direction := "INPUT"` (agent's inference from the parser; `OUTPUT`, `INOUT` are not keywords). `VerilogAst`'s
  `PortDirection` literal `INPUT` is exactly this case.
- Abstract targets are refused **[agent]**: `executor.ts:703` «Cannot use abstract class '${targetClass}' as
  transformation target»; rules must create `PortDeclaration`, `NetDeclaration`, … not `ModuleItem`. Harmless here.
### 4.5 Probe: the executor on a `HwDesign → VerilogAst` fragment **[measured]**

Scratch probe `frontend/.vite-cache/hw-probe/jjtl-refs.probe.test.ts` (gitignored, not committed), run with its own
vitest config through `scripts/run-quiet.mjs` (logs `.agent-logs/jjtl-probe-20261021-095519.log`, `jjtl-probe2-20261021-095537.log`,
`jjtl-probe3-20261021-095546.log`; all exit 0); the `joiner` mocked exactly as `nested-creation-into-features.test.ts:18-28`, the executor
unstubbed. Source: two `Component`s, three `Port`s (`owner` reference, `dir`, `width`), one `Wire` (`src`, `tgt`).
Target stub: `Module.items` (containment) → `PortDeclaration.ports` (containment) → `PortId`; `ModuleInstantiation`;
`PortConnection.port` → `PortId`. HEAD `3afead0b1`.

| Variant | Rules | Result |
|---|---|---|
| flat | `Component -> Module { items := resolve(ports, PortDeclaration) }`, `Port -> PortDeclaration { direction := if dir == "IN" then "INPUT" else "OUTPUT"; ports := resolve(self, PortId) }`, `Port -> PortId { name := name }`, `Wire -> PortConnection { port := resolve(tgt, PortId) … }` | `success: true`, no error, no warning. `Module alu.items` → 2 `PortDeclaration`s (forward, created by a later rule); `PortDeclaration.ports` → its `PortId` (two rules from one source type, disambiguated by `resolve(x, T)`); `PortConnection.port` → `PortId d`. Enum literal as a string: `"INPUT"`/`"OUTPUT"` |
| flat, attribute through a source reference | `expression := src.name + "_" + tgt.name` | `"_"`: `src.name` and `tgt.name` read empty |
| nav | `Wire -> PortConnection { expression := src.name }`; `Port -> PortId { name := owner.name + "_" + name }` | `expression: null`; `PortId.name`: `"_a"`, `"_y"`, `"_d"` (the owner's name reads empty) |
| navResolve | `Port -> PortId` **before** `Wire -> PortConnection { expression := resolve(src, PortId).name }` | `"y"`: works — the value is read from the *target* the source maps to |
| navResolveRev | the same two rules in the **opposite** order | `expression: null`: pass 2 evaluates in rule order, so the trick depends on rule order |
| navForall | `expression := (forall s in [src]: s.name).first`; also `name := forall p in ports: p.name` | parse error «Expected expression» |
| nested | `-> items { forall p in ports -> PortDeclaration { -> ports { -> PortId { name := p.name } } } }` | executor builds the 2-level tree (`__nested: true`, `__sourceId` = the rule's `C1`); per §4.3 the write-back would keep `PortDeclaration` and drop `PortId` |

Conclusions: (1) target-to-target references, forward ones included, **work in the executor**; this is the first
positive measurement of them (§4.2 had none). (2) **Reading an attribute through a single-valued source reference
inside a binding returns null** — the F4 finding of `docs/2026-07-06_gate_visivo_jjtl_binding.md:101` (per the agent)
still holds on HEAD. The transformation needs it everywhere it prints a connection (`assign acc_d = alu_y;` needs the
names at both ends of a wire). Workaround today: order the rules so the referenced target is filled first and read it
back with `resolve(x, T).attr`; fragile, and silent when wrong (null, no warning). The clean fix is the executor's
dereference of `{__ref}` in a binding's member access, a JjTL lane of its own (§10, S-C0). (3) Whether the write-back
turns `items := resolve(...)` on a **containment** feature into containment (reparenting the rule-created
`PortDeclaration` under its `Module`) is still not measured: it needs the app (§4.1).

- Rule 21 (CLAUDE.md): the target model must come from the transformation's own `DModel.new` with an explicit name,
  never from `createM1()` (which the fixture helper `buildModelShell` uses, `bpmn-lanes-fixture.ts:262`). The build
  script uses `buildModelShell` for the `HwDesign` source model only.

## 5. D2 — what the simulator needs for a CPU (COSA 3)

### 5.0 Facts that bound the design

- **[read ✓]** A per-metaclass stored attribute (a register) is declared on the **metamodel**; a model declares globals
  only: `src/model/simulation/stateAttributesCodec.ts:303` «if (decl.metaclass !== null) defects.push({ index, name:
  decl.name, code: 'record', message: 'a model declares globals only' });». Same reading as R-BV-9.
- **[read ✓]** JjEL bit-vectors (`src/jjel/SPEC.md:533-537`): «A vector never enters the model data»; «`bits(w, v)`
  (unsigned) and `sbits(w, v)` (signed)»; a `0x`/`0b` **string** is a bit pattern (`sbits(8, '0xff')` is -1); «Both
  operands must be vectors of the same width **and** the same signedness (stricter than Verilog, R-BV-3)»; methods
  `slice(hi, lo)` (Verilog `x[hi:lo]`), `concat`, `zext`/`sext`/`trunc`, `and`/`or`/`xor`/`not`, `shl`/`shr`/`ashr`.
  So every field extraction the ISA needs (`IR.slice(7,4)`) and every ALU operation of D4 exists.
- **[read]** Open ticket (`docs/log-inbox/hw-notation.md:9-12`): «JjEL reads `0xFF` as the number `0` followed by the
  identifier `xFF`, and the lenient `parse()` keeps the first expression and drops the rest without an error». A hex
  literal typed by the engineer in a live demo silently becomes 0.

### 5.1 What the simulator offers (read)

Files (agent): `frontend/src/model/simulation/{roleCatalog.ts,netCompile.ts,netTypes.ts,netStep.ts,actionEvaluator.ts,derivedEvaluator.ts,guardContext.ts,stateAttributesCodec.ts,scenarioCodec.ts,simProfiles.ts}`,
`frontend/src/components/editor-v2/sim/{simBridge.ts,simRunState.ts,simScenarios.ts,simBoard.ts,simBoardClock.ts}`,
`frontend/src/codegen/oracle/observe.ts`, `docs/spec/claude_spec_2026-09-13_computational_model.md`.

- **Roles** are flat `sim*` keys of the metamodel's `_state` (`roleCatalog.ts:24-31`, `:66-179` **[agent]**): `simNode`,
  `simInitial`, `simTerminal`, `simTransition`, `simOwnedTransitions`, `simNextState`, `simTrigger`, `simGuard`,
  `simAction`, `simEntry`, `simExit`, `simStateAttributes`, … Profiles include `extendedStateMachine`, `moore`,
  `mealy` (`simProfiles.ts:140-166` **[agent]**). D2's control FSM is an `extendedStateMachine` like the turnstile.
- **Domains** are exactly four (`netTypes.ts:28-37` **[agent]**): `boolean`, `range{min,max}`, `enum{literals}`,
  `word{widthFeature,signed}`. No array, no map; the spec excludes «variable-size collections in state»
  (`claude_spec_2026-09-13_computational_model.md:182-186` **[agent]**).
- **Initial values are literals [read ✓]**: `stateAttributesCodec.ts:112` `parseInitialLiteral` accepts a literal, an
  identifier, or «a bit-vector `bits(w, n)` / `sbits(w, n)` with literal arguments in range» (`:107-110`); anything else
  is `null`. So a memory cell **cannot** take its initial content from a model attribute (`self.init`): one literal
  applies to every element of the metaclass.
- **One step = one parallel assignment [read ✓]**: `netStep.ts:296` «One parallel assignment: every right-hand side on σ,
  then every write together.»; `:310` a second write to the same element and attribute halts with
  `double-assignment`. The sites of a step are the source's exit, the transition's action and the target's entry
  (agent, `netStep.ts`). **This is the semantics of Verilog non-blocking assignments at a clock edge**, which is what
  makes the CPU cycle-faithful: every right-hand side reads the registers before the edge.
- **Candidates evaluate guards [read ✓]**: `netStep.ts:7-8` «a transition the input accepts, whose preset is enabled,
  that no inhibitor blocks and whose guard is true». With mutually exclusive opcode guards on the DECODE transitions
  there is one candidate, and Play does not stop to ask (Play stops at a choice of two or more,
  `simBridge.ts:1560-1574` **[agent]**). A fused `else` exists (`netStep.ts:155` `elseOutcome`).
- **Writing another element [agent, tested]**: by name `Q.[n] := 1` (`actionEvaluator.test.ts:137`), by reference
  `self.next.[n] := 1` (`:138`); a bare name resolves only if unique in the pool and not a class name
  (`jjscript/executor/commands/eval.ts:351-372`).
- **Derived attributes exist but cannot be words [read ✓]**: `derivedEvaluator.ts:534-535` `isSimValue` accepts
  `boolean | number | string` only, and `:567-568` fails «not a boolean, a number or a string». So **«wires as derived
  attributes» (prompt COSA 3) does not hold for a word-valued wire**: the ALU result, a mux output, a field of IR
  cannot be a derived word. They are written inline in the actions (§5.3).
- **Clock**: a step consumes one event or ε (`netTypes.ts:120-123`, `netStep.ts:134-137` **[agent]**). Play presses ε
  up to `MAX_PLAY_STEPS = 1000` (`simRunState.ts:131`); the I/O board Clock presses an event on a timer
  (`simBoardClock.ts:2-3` «time as an environment source, not model time»).
- **Trace**: `configAt(run, n)` (`simRunState.ts:320`) gives `{state, event}`; the control state is
  `cfg.state.marking` (a `Map`), registers in `cfg.state.attrs`; `observeSim(state)` (`codegen/oracle/observe.ts:41`)
  is the JSON projection, a vector serialised by its `toJSON` in Verilog form (`bitvectors.ts:44-46`) **[agent]**.
- **The word domain has never run through `startRun` or the panel [agent]**: R-BV-8 leaves the declaration dialog «a
  later item»; `simBoard.ts` has a `word` case for the domain text and `domainLength` returns `null` for it
  (**[read ✓]** `simBoard.ts:493` «case 'word': return `${domain.signed ? 'signed' : 'unsigned'} word`;», `:588`). The
  build script writes `simStateAttributes` by hand (as `build-codegen-examples.ts` already does).

### 5.2 Probe: memory and register-file forms **[measured]**

Scratch probe `frontend/.vite-cache/hw-probe/sim-mem.probe.test.ts` (not committed), the `wordDomain.test.ts:37-83`
harness copied (raw lookup → `compileNet`, `freezeSnapshot`, `makeActionOracle`, `step`); registers `PC`, `ACC` and
cells `M0` (`addr 0`, `init '0x1f'`), `M1` (`addr 1`, `init '0xa5'`), all `word` of width 8 read from a slot, initial
`0`; one step from Reset per row (logs `.agent-logs/sim-probe-20261021-095650.log`, `sim-probe2-…`; exit 0).

| Action text (one step) | Result |
|---|---|
| `PC.[r] := PC.[r] + bits(8, 1)` | fired, `PC = 8'h1` (bare name as the target) |
| `ACC.[r] := bits(8, cells.filter(c => c.addr == PC.[r].toNumber()).first.init)` | fired, `ACC = 8'h1f`: a **ROM** read of frozen model data selected by a σ value |
| `cells.filter(c => c.addr == PC.[r].toNumber() + 1).first.[r] := bits(8, 9)` | fired, `M1 = 8'h9`: a **dynamic write target** lands (the agent found no test of it) |
| the write above, then next step `ACC.[r] := cells.filter(…).first.[r] + bits(8, 1)` | both fired, `ACC = 8'ha`: dynamic read of σ |
| `M0.[r] := if PC.[r] == bits(8, 0) then bits(8, 7) else M0.[r]` and the same for `M1` | fired, `M0 = 8'h7`: the unrolled fallback works too |
| `ACC.[r] := bits(8, '0xf0').slice(7, 4).zext(8)` | fired, `ACC = 8'hf`: field extraction for the ISA |
| `ACC.[r] := bits(8, 0xFF)` | halted `action-defect` «1:21 Expected ')' after function arguments» |

So in an action, `0xFF` is a parse **error** (the action parser is strict); the silent-zero ticket
(`hw-notation.md:9`) concerns the lenient `parse()` path. Hex constants are written as strings, `bits(8, '0xff')`.

### 5.3 The CPU as the simulator can run it

**Cycle semantics.** One control state = one clock cycle. Its register transfers are its **exit action** (`simExit`):
they fire on the step that leaves the state, all right-hand sides on the pre-edge σ, which is the `always @(posedge
clk)` block of the Verilog. No entry actions and no transition actions on the datapath registers (a transfer in both
the exit of S and the entry of S' would double-assign and halt). The clock is either ε (Play runs the program to HALT)
or one `clk` event instance that every transition takes as trigger (the board Clock animates it); §12 decision 4.

**Memory.** Harvard: the program is a ROM of frozen cells (`Cell.init: EString`, read with `bits(w, c.init)`, measured);
the data memory is a RAM of σ cells (`Cell.value: word`), initial `0` for all, written by a dynamic target (measured).
A unified memory would need a per-cell initial from the model, which `parseInitialLiteral` refuses. The register file
of D4 (four registers) is four `Register` instances selected the same way (`regs.filter(r => r.index ==
IR.[value].slice(1,0).toNumber()).first.[value]`) or an accumulator (§12 decision 3).

**The smallest fragment, as declared** (ids by name; the build script maps them, as `INSTALL` does):

```text
HwDesign (metamodel)
  Register   : Component   width: EInt, reset: EInt
  Alu        : Component   width: EInt
  Mux        : Component   width: EInt
  Cell                     addr: EInt, width: EInt, init: EString
  State                    name, exit: EString (the RT actions), out: Transition[*] (containment)
  Transition               guard: EString, next: State[1]
  InitialState : State

_state (metamodel)
  simProfile         = extendedStateMachine
  simNode            = State          simInitial = InitialState
  simTransition      = Transition     simOwnedTransitions = State.out    simNextState = Transition.next
  simGuard           = Transition.guard                                  simExit = State.exit
  simStateAttributes = {"v":1,"attrs":[
     {"name":"value","metaclass":"Register","space":"semantic",
      "domain":{"kind":"word","widthFeature":"Register.width","signed":false},"initial":0},
     {"name":"value","metaclass":"Cell","space":"semantic",
      "domain":{"kind":"word","widthFeature":"Cell.width","signed":false},"initial":0}]}

model
  PC: Register {width 8}   IR: Register {width 8}   ACC: Register {width 8}   Z: Register {width 1}
  alu: Alu {width 8}       muxB: Mux {width 8}
  FETCH: InitialState {exit: "IR.[value] := bits(8, rom.cells.filter(c => c.addr == PC.[value].toNumber()).first.init)
                              PC.[value] := PC.[value] + bits(8, 1)"}
  DECODE: State            -- no transfer
  EXEC_ADD: State {exit: "ACC.[value] := ACC.[value] + ram.cells.filter(c => c.addr == IR.[value].slice(3,0).toNumber()).first.[value]
                          Z.[value] := if ACC.[value] + ram.cells.filter(…).first.[value] == bits(8, 0) then bits(1, 1) else bits(1, 0)"}
  DECODE -> EXEC_ADD  guard "IR.[value].slice(7, 4) == bits(4, '0x2')"
```

What the simulator **cannot** express today, with the smallest workaround: (1) an array in σ → one `Cell` element per
word (measured above); (2) a per-element initial from the model → Harvard ROM read from frozen data (measured); (3) a
word-valued derived attribute (a wire, an ALU output) → inline in the exit action, repeated where two transfers need it
(the `Z` line above repeats the sum); (4) nothing structural ties the datapath view to the transfers: the
`alu`/`muxB` components and the wires are **documentation the simulator does not read**, unless the transfers are
generated from them (§8, D2 amendment).

## 6. D3 — the `VerilogAst` changes (COSA 4)

### 6.1 Where the partner's metamodel is

**[measured]** It is not in the repository. `grep -r -l -m 1 -E 'AlwaysConstruct|ModuleInstantiation|PortConnection'`
from the repo root returns only `docs/prompts/claude_2026-10-21_0950_prompt_hw_demonstrator_plan.md`; positive
control, the same command for `P-2026-10-21-0950` under `docs/`, returns the prompt and this report. So the only
source today is the prose of the prompt (§Context). Slice S-C either rebuilds `VerilogAst` from that prose or starts
from an export of the engineer's project, if Alfonso can supply one (§11, question 1).

### 6.2 What the metamodel's own shape says about the three references (analysis of the prompt's description)

A reference needs one object per referenced name. Three of the four name-to-reference changes of D3 meet a
declaration that holds *several* names in one string list, so the target object does not exist yet:

| D3 change | Referenced thing | Declared today as | Consequence |
|---|---|---|---|
| `PortConnection.port` → reference | a port of the instantiated module | `PortDeclaration.names: EString[1..*]` (one declaration, several names: `input wire a, b;`) | no object per port: the reference has no target. Needs a per-name object (§6.3). |
| `EventTerm.signal` → reference | a port (`posedge clk`) or a net/variable | port: `PortDeclaration.names`; net: `NetDeclaration.variables` → `VarDeclId` (one object per name) | the target type is "port or variable": needs a common supertype. |
| `ModuleInstantiation.moduleName` → reference | a `Module` | `Module` (one object per module) | works as is, provided the instantiated module is in the same model. |
| `Module.portNames` removed | — | derivable from the `PortDeclaration`s of the module (Verilog 2001 ANSI header) | confirmed by the shape; the template prints the header from the declarations. |

### 6.3 The amendment the shape forces (to be confirmed against JjTL in §4 and the templates in §7)

- Add `PortId` (name), contained by `PortDeclaration.ports: PortId[1..*]`, replacing `PortDeclaration.names`; this is
  the `VarDeclId` precedent of `NetDeclaration.variables`, so it is the metamodel's own idiom, not a new one.
- Add an abstract `Signal` (name) as the supertype of `PortId` and `VarDeclId`; `EventTerm.signal: Signal [1]`.
- `PortConnection.port: PortId [1]`; `ModuleInstantiation.module: Module [1]` (renamed from `moduleName` because it is
  no longer a name — or kept as `moduleName` if the engineer prefers continuity; the rename is cosmetic).
- `ParamOverride.name` is the fourth name of the same kind (a parameter of the instantiated module). It is not in D3;
  for the demonstrator the CPU has no parameterized instantiation, so it can stay a string (§11, question 3).
- Expressions (`Assignment.lvalue`, `.expression`, `PortConnection.expression`, `bodyText`, `Range.msb/lsb`) stay
  strings: Verilog expressions are a language of their own and the transformation writes them (§4, §7).

## 7. Code generation path, and D5 trace comparison (COSA 5, 6)

### 7.1 How an R-GEN template emits text

- A template is a record `{name, params, body}` (`src/codegen/engine/templates.ts:33` **[agent]**) whose body is a JjEL
  interpolated string, holes `${…}`, loops as `.map(…).join(…)`, conditionals as `if … then … else …`
  (`src/jjel/SPEC.md:697` **[agent]**; loop example in `src/codegen/examples/turnstile/turnstile.json:27`
  `${stc.nodes.map(s => s.name).join(", ")}`). Templates call each other by name, recursion bounded at 64
  (`templates.ts:41` **[agent]**).
- Storage: the **metamodel's** `_state.genTemplates` (§3). The panel is per M1 model and takes the templates of that
  model's metamodel **[read ✓]**: `src/codegen/ui/CodePanel.tsx:10` «Templates: the templates of the model's
  metamodel, its `_state` key `genTemplates`»; `:201` reads `state.idlookup?.[metamodelId]?._state?.[GEN_TEMPLATES_KEY]`.
  So Verilog templates live on `VerilogAst` and run on the `VerilogAst` model, as D1 says.
- **Generation works without a simulation STC [read ✓]**: `src/codegen/engine/generate.ts:88` «stc: view ?
  stcValue(view) : null, target: view ? jsTarget(globals, lookup, modelId) : null». `VerilogAst` has no STC, so a
  Verilog template navigates the model through `instances` and the objects bound by name (`buildEvalContext`), never
  through `stc` or `target`.
- **Text, not JS [agent]**: the pilot spec, `docs/spec/claude_spec_2026-10-10_code_generation_pilot.md:78`
  «Generation is target-agnostic (any text). Execution exists only for targets with a runner». Run and Check are
  JS-only (worker); a Verilog output is generated and shown, never run in the app.
- **One entry, one string [read ✓]**: `generate.ts:102` «text = set.call(entry, args);»; the agent's grep of
  `CodePanel.tsx`, `generate.ts`, `text.ts` for `download|Blob|filename|writeFile` found nothing. So there is no
  per-object file emission and no download: the CPU is one Verilog text (all modules in one file is legal Verilog) and
  the testbench is a second entry template (`tb`), chosen by `entryName` (`CodePanel.tsx:261`
  «setResult(generate(globals, lookup, modelid, templates, entryName));»). Getting the text onto disk for Verilator is
  the trace script's job (§7.4).

### 7.2 How bit-vector constants print

**[agent, quote re-read in SPEC ✓]** `src/jjel/evaluator/builtins/bitvectors.ts:62-66`: hex padded to ⌈w/4⌉ digits,
`s` for signed, raw two's-complement bits — ``return `${x.width}'${x.signed ? 's' : ''}h${x.bits.toString(16).padStart(digits, '0')}` ``;
`bits(8,255)` → `8'hff`, `sbits(8,-128)` → `8'sh80`, `sbits(4,-1)` → `4'shf`. A template hole prints a vector in that
form: `src/codegen/engine/origin.ts:201` «if (isBitVector(value)) return toVerilog(value);». So a template prints a
reset value or an opcode constant with `${bits(self.width, self.reset)}` and gets a legal Verilog sized literal. Note:
the model data never holds a vector (SPEC §7.5), so the transformation and the templates *build* vectors from
`EInt`/`EString` attributes; `VerilogAst` keeps strings (`Range.msb`, `.expression`), and the JjTL rule writes them
with `bits(w, v).toVerilog()` or plain decimal text.

### 7.3 What the JS target needs for the R-GEN-8 / R-GEN-11 oracle

- The oracle is implemented **[agent]**: `src/codegen/oracle/oracle.ts` (`compareTraces` `:154`, `simulate` `:216`,
  `runOracle` `:292`), tested by `oracle/__tests__/examples.test.ts` (both examples pass, a mutated program diverges
  at the right step) and `bitvector.test.ts` (an 8-bit register, 258 coins).
- The generated program is written by **the example's own templates** (`initial`, `step`, `observe`, `main` as text),
  using `target.guard`/`target.actions`/`target.initial` (`target/js/access.ts:5-24` **[agent]**). So the JS oracle
  for the CPU costs one more set of templates on `HwDesign` (copied from `turnstile.json`'s `engine`/`main`), not new
  code — *except* the known gap: the example templates' `inDomain` has no `word` case (`docs/log-inbox/hw-notation.md:19`,
  confirmed by the agent: «if (domain.kind === 'range') ... return typeof value === 'string' &&
  domain.literals.includes(value);»), so the first write of a register halts `domain`. The CPU's templates need a
  `word` branch (width from `target.net`), and the ticket's fix belongs in the shared example templates.
- The ticket «a Run result holding a bit-vector breaks JSON.stringify» (`hw-notation.md:14`) is **already fixed** on
  this tree **[agent; read ✓ by the Depends entry]**: merge `eee32699f` brought `ui/displayJson.ts`, used at
  `CodePanel.tsx:583` and `checkView.ts:77,86`. The inbox ticket stays (add-only); its closure is the S3/codepanel
  lane's entry.
- The JS oracle is **optional** for the demonstrator: it proves *Jjodel generated JS = Jjodel simulator*, while D5
  proves *Jjodel simulator = Verilator on the generated Verilog*. The second is the partner's question; the first is
  a cheap extra if the templates are copied (§10, S-B').

### 7.4 D5 — trace format and the comparison script

- Reusable from `frontend/scripts/oracle/bv-verilator.mjs` **[agent]**: `run(cmd, args, cwd, logPath)` (`:127`, spawn,
  log, reject on non-zero); the build line `verilator --binary --top-module <name> -Wno-WIDTH -j 0 -CFLAGS -O0 --Mdir
  obj -o sim <name>.sv` (`:149-152`); run `obj/sim` (`:153`) and parse `$display` lines with a regex (`:156`); the
  version check `execFileSync('verilator', ['--version'])` (`:162`); scratch under `frontend/.vite-cache/`. Not
  reusable: the operator families, the write-back into `bv-cases.json`, and there is no clock. **[measured]**
  `verilator --version` → «Verilator 5.052 2026-09-05», `/opt/homebrew/bin/verilator`.
- **Trace format (proposed, one line per cycle, both sides)**: `<cycle> <state> <PC> <IR> <ACC|R0..R3> <Z>` with the
  registers in the Verilog form of `toVerilog` (`8'h1f`). On the Verilog side the generated testbench prints it with
  `$display("%0d %0d %h %h %h %b", cycle, state, pc, ir, acc, z)` at each `posedge clk` after the update (`#1` or
  `negedge` sampling — §9 risk R5); on the Jjodel side the simulator's σ after each clock step is projected the same way
  (state name → index by the ISA/FSM order). Hex without width prefix on both sides keeps the parse to one regex.
- **The comparison script** `frontend/scripts/oracle/hw-cpu-verilator.mjs` (inputs: the generated `cpu.v`, `tb.v`, the
  Jjodel trace `hw-cpu.trace.json`; outputs: `.vite-cache/hw-oracle/verilator.trace`, a JSON verdict
  `{cycles, agreements, firstMismatch: {cycle, register, jjodel, verilator}}`, exit 1 on mismatch). The Jjodel trace
  comes from a node test that runs the simulator headless on the example's fixture (the `examples.test.ts` route) and
  writes the committed `hw-cpu.trace.json`; the Verilog text comes from `generate` on the `VerilogAst` model in the same
  test (synthetic lookup, `recordOf` in `exampleFixture.ts` **[agent]**). Then, as for `oracle:bv`, the normal suite
  checks the committed expected trace without Verilator, and `npm run oracle:hw` regenerates and compares with it.

## 8. Verdicts D1..D5

### The question under all five: where does the behaviour live, and how does it reach Verilog?

The simulator runs JjEL texts bound to the control states (§5.3). Verilator runs Verilog. For «the same program» to be
the same *by construction*, the Verilog of each register transfer must be printed **from the JjEL text the simulator
runs**, by one function whose operator mapping is already checked against Verilator (R-BV-10, the `oracle.mapping`
of `bv-cases.json`: «the Verilog form of each operator is recorded in the table's `oracle.mapping`», SPEC
`:561` **[read ✓]**). That function does not exist: the codegen has a JjEL→JS printer (`codegen/target/js/printer.ts`)
and no JjEL→Verilog one (the pilot spec has no mention of Verilog, §7.1). Every other route fails on a measured or
read fact:

- structured transfers in `HwDesign`, printed to Verilog by JjTL: the simulator cannot run them without a JjEL text,
  and nothing in the app derives a text from objects (templates never write the model, R-GEN-7);
- JjTL printing the behaviour: JjTL cannot read an attribute through a source reference (§4.5, measured) and has no
  JjEL parser at hand;
- the datapath view driving the simulation: no netlist evaluation, no derived words (§5.1).

So the plan adds **a JjEL→Verilog printer for the register-transfer subset** (`codegen/target/verilog/`), the second
target R-GEN-16 anticipated («Named `target`, not `js`, so a second target plugs in without renaming»). It is the
centre of the demonstrator, and the D5 comparison is its oracle.

### D1 — two metamodels in one project, JjTL between them, templates on the target: **amended**

Holds as a capability (§4.1, read; §4.5, measured): one project, two metamodels, `transformation hw_to_verilog from
HwDesign to VerilogAst`, a new target model written by Execute, references between target objects. Amended in two
points:
1. **Two routes to the same Verilog text, the direct one first.** Route A: templates on `HwDesign` print the Verilog
   through the printer; it reaches Verilator without JjTL. Route B: JjTL builds the `VerilogAst` model (structure:
   modules, ports, nets, memories, the state `localparam`s, the always block, the testbench instantiation), the
   always block's `bodyText` printed by the same printer, exposed to JjTL bindings as one helper; templates on
   `VerilogAst` print it. A test asserts that A and B produce the same text. A is the demo's safety net and the
   oracle of B; B is the partner's metamodel at work.
2. **Two JjTL prerequisites before B**: reading an attribute through a source reference in a binding (F4, null today,
   §4.5), and a measurement of the write-back of a containment feature set by `resolve` (§4.3), since nested
   creation keeps one level only.

### D2 — three views; the control FSM on the existing roles; registers as stored `word` attributes: **amended**

Confirmed: the control FSM is an `extendedStateMachine` (`simNode`/`simTransition`/`simGuard`…); registers are σ
attributes with a `word` domain whose `widthFeature` is the register's `width`, declared on the metamodel
(`stateAttributesCodec.ts:303`); guards on opcode fields are JjEL `slice` comparisons (§5.2, measured). Amended:
1. **The register transfers of a cycle are the exit action of its control state** (parallel assignment on the pre-edge
   σ, `netStep.ts:296`): one state = one cycle, no entry or transition actions on registers.
2. **Wires are not derived attributes**: a derived word is refused (`derivedEvaluator.ts:534-535`); combinational
   values are written inline in the transfers.
3. **The datapath view is structure the simulator does not read.** Components, ports with widths and wires are drawn
   and give the Verilog declarations (register widths, memory depths); the behaviour is the control view. Making the
   datapath drive the behaviour (a structural Verilog with an ALU module per component) is a later step (§11, q. 4).
4. **Memory is Harvard**: a ROM of frozen cells (`init: EString`, read with `bits(w, c.init)`) and a RAM of σ cells,
   both measured (§5.2); a unified memory would need a per-element initial value, which `parseInitialLiteral` refuses.

### D3 — `VerilogAst` changes minimal and motivated: **amended**

The three references and the removal of `portNames` are right, and the demonstrator uses all three if the testbench is
a `Module` of the same model (`tb` instantiates `cpu` → `ModuleInstantiation.module`; its connections →
`PortConnection.port`; `always @(posedge clk)` → `EventTerm.signal`). Amended by the metamodel's own shape (§6.2):
two references have no target object today because `PortDeclaration.names` is a string list. Add `PortId` (the
`VarDeclId` idiom) and an abstract `Signal` above `PortId` and `VarDeclId`. Expressions stay strings: confirmed, and
they are printed by the printer, not by JjTL string concatenation. The partner's metamodel is not in the repo
(§6.1).

### D4 — an 8-bit multicycle CPU, about ten instructions: **confirmed, with the shape fixed**

8-bit instruction `oooo aaaa` (4-bit opcode, 4-bit address or immediate); ten instructions `NOP, LDA a, STA a, ADD a,
SUB a, AND a, LDI i, JZ a, JMP a, HLT`; accumulator `ACC`, flag `Z` (1 bit), `PC` (4 bits: widths are per element, R-BV-7, so `PC + bits(4, 1)` wraps at
16 as the address space does), `IR`; ROM 16 ×
8 (program), RAM 16 × 8 (data). States: `FETCH, DECODE, EX_LDA, EX_STA, EX_ADD, EX_SUB, EX_AND, EX_LDI, EX_JZ, EX_JMP,
HALT` (11), transitions ≈ 20 (DECODE fans out on opcode guards, every `EX_*` returns to FETCH, `HLT` goes to `HALT`,
which has no way out: quiescence). Three cycles per instruction. Accumulator rather than a four-register file: the
register-file selection by an IR field works (§5.2, dynamic target) but doubles the reading cost for an engineer who
sees the model for the first time; the register file is the first extension.

### D5 — the same program in Jjodel and in Verilator, per-cycle register traces compared: **confirmed**

The structure of `bv-verilator.mjs` carries over (spawn, `verilator --binary`, `$display` + regex, scratch under
`.vite-cache/`, §7.4); the difference is a clocked testbench. The simulator side is the headless `step` loop or
`startRun` + `configAt` (agent, `simBridge.ts:724`), projected with `observeSim`. The committed expected trace is
checked in the normal suite without Verilator, as `bitvectorOracle.test.ts` does for the operators.

## 9. Risks for a live demonstration (COSA 7)

Tags as in the header, plus **[prev]**: read or measured by the session of P-2026-10-21-0950 and carried by its
handoff, not re-opened here (the continuation prompt asks not to re-read the sources of §0-§8). R1-R11 are that
session's table; R12-R16 are the nuXmv part, read or measured in this session on HEAD `2c2c15eda`.

| # | Risk | Evidence | Mitigation in the plan |
|---|---|---|---|
| R1 | Size. The demo project is about 150-250 objects (two metamodels, ~40 datapath and control elements, 32 memory cells, the `VerilogAst` model of route B). The largest model measured so far, 407 objects: click 0.45 s, drag 1.7 s, open 2.7 s; save 5.6-6.6 s on the dev build | [prev] round-3 prompt `:26-29`; `…round2.md:185` | ROM and RAM cells stay out of the datapath viewpoint (one `Memory` vertex, cells listed in the inspector); the demo runs on a production build, not the dev server |
| R2 | A JjScript build slows from 1.45 s to 9.1 s between 47 and 355 objects | [prev] `discovery_2026-10-01_jjscript_run_slowdown.md:9` | The model is built once, unattended, by the build script; never typed live |
| R3 | There is no port concept: an edge attaches to the vertex hull | [prev] spec addendum `:21`, `:196` | Ports are M1 objects with their own vertex, claimed by the containment channel; wires are objects-as-edges (the Petri `Arc` pattern), never plain references (`useM1ReferenceEdges.ts:146-148` dedupes by vertex pair, so two wires between one pair of components would be one edge) |
| R4 | `MAX_HANDLES_PER_SIDE = 4` | [prev] `portDistribution.ts:520`; ticket `claude-code-log-archive.md:4719` | One vertex per port keeps every component under the cap; no edit of `portDistribution.ts` (critical zone) |
| R5 | Off-by-one in trace sampling: the Verilog side can print before or after the edge | [prev] §7.4 | The testbench prints at `negedge clk`; the first S-E comparison is checked by hand on two instructions before the script trusts it |
| R6 | Hex literals: `0xFF` is a parse error in an action, a silent 0 on the lenient path | §5.2 [measured]; `hw-notation.md:9` | Every constant is a string, `bits(8, '0xff')`; the README says so; the lexer ticket stays open |
| R7 | The word domain has never run through `startRun` or the panel | §5.1 | The first gate of S-B is an in-app probe that runs the program and reads the board and the inspector |
| R8 | The example templates' `inDomain` has no `word` case | §7.3; `hw-notation.md:19` | Only for S-B' (the optional JS oracle) |
| R9 | Critical zone. Building edits no §3.1 file; opening a project runs `VersionFixer.update` | [prev] `SaveManager.ts:56`, `VersionFixer.tsx:142`, `:146-153` | The `.jjodel` file is written only by the app's export (never by hand), so the migration path is the one every project takes; the printer and the exporter live outside §3.1 (`codegen/target/verilog/`, `model/simulation/`); the F4 fix is in `jjtl/executor/executor.ts` and `ProjectEditor.tsx`, neither in §3.1 |
| R10 | Edges whose source is a nested vertex are deleted | [prev] ticket of branch `nested-vertices`; `useM1ReferenceEdges.ts:158` | Wires are objects, not references (R3); no port vertex is nested inside its component's vertex |
| R11 | A derived viewpoint enters a drag loop | [prev] `elk-handles-a3`; trunk amplifier `archive:995` | Viewpoints are hand-written through `view.ir` (R-LIB-9), no derived viewpoint |
| R12 | **nuXmv is not installed** on this machine, and its licence is narrow | [measured] `command -v nuXmv nuxmv NuSMV nusmv` exit 1, no output; positive control `command -v verilator node` exit 0 (`/opt/homebrew/bin/verilator`); `uname -m` → `arm64`. [read, web 2026-10-21] `nuxmv.fbk.eu/download.html`: version 2.2.0 «(June 4, 2026)», binaries for Linux x86_64 and **macOS arm64** (no Intel macOS, Windows «coming soon»), each with a SHA-256 file, direct links, no registration; `license.html`: «nuXmv can be used only for non-commercial or academic purposes», the source «only for reading with no right of modification». Not in Homebrew (prompt; `brew` not queried here, it would hit the network) | Installed by hand, outside the repo, never from a script of the plan: download the macOS arm64 archive of 2.2.0 and its SHA-256 file, check the digest (`shasum -a 256`), unpack under `~/opt/nuXmv-2.2.0/`, put its `bin/` on `PATH`; if Gatekeeper refuses the unsigned binary, clear the quarantine attribute of that one file (not verified). The binary is not redistributable with the frontend (spec `computational_model.md:235-236` [read]), so the checker runs on the presenter's Mac through a node script, never inside the app. Whether a project with an industrial partner is «academic» use is §13 item 4 |
| R13 | `bvToSmv` covers the bit-vector operators, not the whole text the CPU's actions use | [read] `bvToSmv.ts:244-276`: the node kinds are `Literal`, `FunctionCall` (`bits`/`sbits` only), `Unary`, `Binary`, `MethodCall`, `MemberAccess`; no `Conditional` (`if … then … else`); `toNumber` is in `ZERO_ARG` (`:241`) but the method switch (`:164-234`) has no case for it, so it throws «has no nuXmv translation»; nothing for `coll.filter(c => …).first` | The exporter (S-G) adds three forms around `bvToSmv`, through its `leaves` callback and a pre-pass: `if-then-else` → `case c : a; TRUE : b; esac`; the memory idiom `cells.filter(c => c.addr == E.toNumber()).first.X` → a `case` over the frozen `addr` constants, `E = 0udW_k`, which removes `toNumber` where the CPU uses it; anything else is a `SmvTranslationDefect` naming the element. The subset checker's T-codes (`subsetChecker.ts:61`, `:83`) stay the gate of what a guard may say |
| R14 | State space. The concrete program is one deterministic path (≈ 3 cycles × instructions run); a ROM left free for program-independent properties adds 128 frozen bits to 128 RAM bits and ~25 register and control bits | Arithmetic on D4's shape (§8); no run (R12) | Two exports of one model (§10, S-G): **concrete ROM** (constants from the cells' `init`), checked with BDDs, for the program's own properties; **free ROM** (`FROZENVAR rom_k`), checked with IC3 or bounded model checking, for the structural ones. The engine and the time per property are the first measurement of S-G; a property over 30 s on the presenter's Mac leaves the live part of the demo and is shown as a recorded result |
| R15 | A counterexample of the free-ROM export **is a program**, not only a run: the frozen `rom_k` values are part of it | Consequence of R14 and of `parseInitialLiteral` (§5.1: a model cannot give per-cell initials to σ) | The trace converter (S-H) returns two things: the ROM contents, written into the cells' `init` (a model edit, done by the build script or by JjScript), and the run as a `ScenarioRecord` (`scenarioCodec.ts:54-75`). For the concrete export it returns the run only |
| R16 | An undefined opcode deadlocks DECODE. A 4-bit opcode has 16 values and D4 defines 10 | §8 D4 | The model ships with DECODE's fused `else` (`netStep.ts:155`, §5.1) to FETCH, so 6 opcodes act as `NOP`; the structural property of §10 S-G checks it. Removing that `else` live and letting nuXmv name the missing opcode is a demo choice (§13 item 1) |

Not a risk, recorded because the prompt asks: **yosys and Icarus Verilog are not installed** either ([measured]
`command -v yosys iverilog` exit 1, no output). Yosys' SMV backend would let the same properties be checked on the
generated Verilog; it is not in this plan (§11, question 8).

## 10. Slice plan

Every slice: Phase 1 discovery only where marked, otherwise a direct Phase 2 on the file set below; gates
`npm run typecheck` exit 0, `npm run build` when `src/` changes, `npm run test` on the named test files, and, when
`frontend/scripts/` changes, `npm run typecheck:scripts` and `npm run check:scripts`; a closing entry in
`docs/log-inbox/hw-notation.md` with `npm run check:docs`. Tier as `lane-run`'s rule decides (P16). «Fits» is an
estimate against the 200k ceiling (RC-51), from the S1-S3 bit-vector lanes that each closed in one session and from
this plan's first session, which hit the ceiling at 210k on reading alone; it is a judgement, not a measure. A slice
that would not fit is split here.

### 10.1 The slices

**S-D0 — the JjEL→Verilog printer of the register-transfer subset, with its oracle.** The centre (§8).
- Files (new): `frontend/src/codegen/target/verilog/printer.ts`, `…/verilog/__tests__/printer.test.ts`,
  `frontend/src/model/simulation/memoryIdiom.ts` (the recogniser of `coll.filter(c => c.F == E).first.X`, pure, shared
  with S-G1, so it sits in the simulation core that both the codegen and the exporter may import) and its test;
  `frontend/scripts/oracle/bv-printer-verilator.mjs` (a sibling of `bv-verilator.mjs`, reusing its `run` and build
  line, §7.4).
- Subset: σ reads `X.[a]` and the memory idiom (→ `x`, `ram[e]`, `rom[e]`, the `toNumber` inside the idiom dropped);
  `bits`/`sbits` constants (→ `toVerilog`, §7.2); the 24 operators of `oracle.mapping` in
  `src/jjel/__tests__/fixtures/bv-cases.json` ([measured] 24 keys, 4733 rows); `if … then … else` (→ `c ? a : b`);
  comparisons; an action's `X.[a] := e` lines (→ `x <= e;`). Anything else is a defect that names the element.
- The width trap: JjEL widths are exact (R-BV-3), Verilog widths are context-determined (IEEE 1800-2017 §11.6), so a
  printed `a + b` read in a wider context keeps the carry. The printer wraps every operator result that is the
  operand of another operator in a self-determined concatenation `{…}`; the composed tests below are its oracle,
  since every row of the table holds one operator.
- Tests: (a) normal suite: every row of `bv-cases.json` printed, the text equal to its operator's `oracle.mapping`
  form instantiated on the row; (b) composed golden cases where the context would change the value (`(a + b).zext(16)`,
  `(a + b) == c` with a carry, `(a.shl(1)).slice(8, 1)`) with values computed by the S1 evaluator; (c) the Verilator
  mode compiles the printed text of (a) and (b) and compares with the rows' values (`node scripts/oracle/bv-printer-verilator.mjs`,
  not in the normal suite). Mutation bench on the wrapping rule and on the signed casts of `ashr`/`zext`/`sext`.
- Depends on nothing. **Fits** one session if (c) reuses `bv-verilator.mjs` as is; if not, (c) moves to S-E.
- Parallel with S-A1 and S-C0 (disjoint files).

**S-A1 — the `HwDesign` metamodel and the CPU model, built by a script.**
- Files: new `frontend/scripts/examples/build-hw-cpu.ts` (the `build-codegen-examples.ts` harness, the metamodel from
  nothing with the `bpmn-lanes-fixture.ts` helpers, §3), new `frontend/src/codegen/examples/hw-cpu/hw-cpu.json` (the
  spec in the `turnstile.json` shape), generated `frontend/public/examples/hw/hw-cpu.jjodel`; edited
  `frontend/src/codegen/oracle/__tests__/exampleFixture.ts` (`EXAMPLES` generalised, §3).
- Content: the D4 shape (§8) over the three views of D2 (ISA: instruction formats, fields with bit ranges,
  opcodes; datapath; control): the ISA classes (an `Instruction` with its opcode, a `Field` with `hi`/`lo`),
  `Register`, `Alu`, `Mux`, `Port`, `Wire`, `Memory`, `Cell`, `State`, `Transition`, `InitialState`; the 11 control
  states and ~20 transitions with their exit texts and guards; ROM and RAM as 16
  `Cell`s each; default viewpoints only.
- Tests: `src/codegen/examples/__tests__/importable.test.ts` on the new file (through `EXAMPLES`); the import probe
  `scripts/probe/codegen-examples.ts` extended to it.
- Depends on nothing. Playwright and a dev server per build (§3). **Fits** one session.

**S-B — simulation roles and a running program with a committed trace.**
- Files: `hw-cpu.json` (`lookup.MM._state`: the roles of §5.3, `simStateAttributes`, the program in the ROM cells'
  `init`, a scenario with its `expect`), `build-hw-cpu.ts` (the `INSTALL` of the bags), the regenerated `.jjodel`; new
  `frontend/src/codegen/examples/hw-cpu/__tests__/hw-cpu.run.test.ts` and committed
  `frontend/src/codegen/examples/hw-cpu/hw-cpu.trace.json` (one line per cycle in the format of §7.4).
- The program: at most 16 bytes, with a loop (`JZ`, `JMP`) and a result written to RAM, for example a product by
  repeated addition; `HALT` has role `simTerminal`, so its quiescence is acceptance; DECODE carries the fused `else`
  of R16.
- Tests: the headless step loop (the `wordDomain.test.ts` harness, §5.2) to quiescence, the trace equal to the
  committed one, the scenario's `expect` true; the first gate is the in-app probe of R7 (Play to HALT, the board and
  the inspector read).
- Depends on S-A1. **Fits** one session.

**S-A2 — the three viewpoints of D2 (ISA, datapath, control).**
- Files: `build-hw-cpu.ts` (viewpoints through `view.ir`, the gallery pattern, R-LIB-9), the regenerated `.jjodel`.
- Constraints: R3, R4, R10, R11 (ports as vertices, wires as objects-as-edges, no nesting, no derived viewpoint); no
  edit of `portDistribution.ts`, `DynamicHandles.tsx` or any §3.1 file.
- Tests: the import probe takes a screenshot per viewpoint; visual smoke (P-clause) with the acceptance criterion
  written before the run (CLAUDE.md §5).
- Depends on S-B (the same build script). **Fits** one session; the canvas risks make it the slice most likely to
  stop on a visual finding.

**S-D — route A: the Verilog target in the engine, the templates on `HwDesign`, the testbench.**
- Files: new `frontend/src/codegen/target/verilog/access.ts` (the `jsTarget` shape of `target/js/access.ts`:
  `guard`, `actions`, `initial`, printing Verilog through S-D0); `frontend/src/codegen/engine/generate.ts` (which
  target binds `target`, today `jsTarget` at `:88` [read]), and the template set's optional target field in
  `engine/templateCodec.ts` (additive, R-GEN-12, Rule 11); `hw-cpu.json` (`genTemplates`: entries `cpu` and `tb`),
  `build-hw-cpu.ts`, the regenerated `.jjodel`; committed `frontend/src/codegen/examples/hw-cpu/expected/{cpu.v,tb.v}`.
- Content: one module `cpu` (state `localparam`s, registers, `reg [7:0] rom [0:15]` with an `initial` from the cells'
  `init`, `ram`, one `always @(posedge clk)` with a `case (state)` whose arms are the exit transfers and the next
  state), and a `tb` that instantiates it, clocks it and prints the §7.4 line at `negedge clk` (R5).
- Tests: generation on the fixture equals the committed `.v` texts; `verilator --lint-only` on them inside the S-E
  script (not the normal suite).
- Depends on S-D0, S-B. **Fits** one session.

**S-E — the trace comparison with Verilator (D5).**
- Files: new `frontend/scripts/oracle/hw-cpu-verilator.mjs` (§7.4), `frontend/package.json` (script `oracle:hw`, no
  dependency), committed `frontend/src/codegen/examples/hw-cpu/hw-cpu.verilator.trace`, and a normal-suite test that
  the committed Verilator trace equals `hw-cpu.trace.json` without running Verilator (the `bitvectorOracle.test.ts`
  pattern).
- Tests: `npm run oracle:hw` green; a mutation (one transfer changed in the template output) makes it name the first
  diverging cycle and register.
- Depends on S-B, S-D. **Fits** one session. After it the demo runs end to end: model → simulation → Verilog →
  Verilator, same trace.

**S-G1 — the `.smv` exporter, core.**
- Where: `frontend/src/model/simulation/smvExport.ts`, new, pure, next to `bvToSmv.ts` (the layout of the
  computational model spec, `:241-243` [read]: «the pure core in `frontend/src/model/simulation/` (… subset checker,
  step function, exporter; no React)»). Tests in `…/__tests__/smvExport.test.ts`, goldens in
  `…/__tests__/fixtures/{turnstile,hw-cpu}.smv`.
- Reads: `CompiledNet` (`netTypes.ts:252-282` [read]: `transitions` with `preset`, `postset`, `triggers`,
  `guardSites`, `elseOf`, `actionSites`; `attributes`, `declared`, `widths`, `initial`, `final`, `defects`), the frozen
  snapshot M (element names; the `addr` and `init` of the cells become constants), the guard and action texts of the
  sites parsed by the JjEL parser, the watches of `runWatches` (`watchCodec.ts`, R-SIM-137), and `bvToSmv` with a
  `leaves` callback for σ reads.
- Translates today, by the spec's table (§8 of `computational_model.md:214-228` [read]): the **control FSM** of a
  one-token state machine (bound 1) as one enumerated `VAR state` from `simNode`, `init` from `simInitial`, one
  `DEFINE en_<t>` per transition (source state, trigger against the event `IVAR`, guard, `else` as the negation of its
  siblings' guards), the selector `IVAR` with `TRANS` admissibility, `DEFINE final` from `simTerminal`, and a quiescent
  step that changes nothing; the **σ attributes** in all four domains of `netTypes.ts:28-37` (`boolean`,
  `min..max`, `{literals}`, `unsigned word[N]`/`signed word[N]` with N per element from `CompiledNet.widths`),
  initials from `CompiledNet.initial`; the **transfers** as `ASSIGN next(x) := case <writes of x> ; TRUE : x; esac;`,
  the `TRUE` arm being the frame condition, a memory write unrolled per cell (`case en_<t> & e = 0ud4_k : v; …`); the
  **watches** as `INVARSPEC`. The three forms `bvToSmv` lacks (R13) are added in the exporter.
- Refused with a defect, first cut: a Petri marking with bound above 1, fork and join, a derived attribute (`DEFINE`
  by `derivedEvaluator`, later), `toNumber` outside the memory idiom, `/`, `%`, strings, decimals.
- Tests: goldens for the turnstile and the CPU; a round trip by the simulator itself (every `DEFINE en_<t>` evaluated
  on the configurations of the committed trace equals the simulator's candidate set, so the export is checked against
  the semantics without nuXmv); mutation bench on the frame arm, the `else` negation and the cell unrolling.
- Depends on S-D0 (`memoryIdiom.ts`) and reads the S-B fixture. **Fits** one session.

**S-G2 — the structural properties, generated from the model.**
- Files: `smvExport.ts` (a `properties` section and the free-ROM variant), its tests and goldens.
- Generated, none written by hand, each named by the element it is about:
  1. *No deadlock except a final state*: `INVARSPEC final | some_enabled`, and *final is quiescent*:
     `INVARSPEC final -> !some_enabled`; one instance `INVARSPEC state = s -> some_enabled` per non-final `s`, so the
     report names the state.
  2. *Every state returns to the initial one*: `LTLSPEC G F (state = FETCH | final)`; plus a graph check in the
     exporter itself, without nuXmv, that every node reaches the initial node or a final one ignoring guards.
  3. *At most one write per attribute per step*: checked statically from the sites of each transition (exit of the
     source, the transition's action, entry of the target, `netStep.ts:296`, `:310`) for named targets; for two
     memory writes in one firing, `INVARSPEC !(en_<t> & e1 = e2)`. On the CPU this is proved by the exporter (one
     memory write, in `EX_STA`).
  4. *Every opcode has a path in the control*: in the **free-ROM** export (`FROZENVAR rom_k : unsigned word[8]`,
     R14) FETCH can load any byte into IR, so the instance of item 1 at `DECODE` holds iff every opcode has a
     transition; its counterexample's ROM names the opcode (R15). The exporter is generic and knows no opcode; the
     per-opcode instances, one `INVARSPEC (state = DECODE & IR_value[7:4] = 0ud4_<op>) -> some_enabled` per
     `Instruction` of the ISA view, are printed by a template entry `smvIsa` on `HwDesign` in S-H, so they too come
     from the model.
  5. *No choice*: `INVARSPEC !(en_<t> & en_<u>)` for sibling transitions, so Play never stops to ask
     (`simBridge.ts:1560-1574`, §5.1).
  6. *Memory addresses in range*: one `INVARSPEC` per idiom occurrence, proved by the exporter when the cells cover
     every value of the index's width (16 cells, 4-bit index).
- Depends on S-G1. **Fits** one session.

**S-H — nuXmv on the CPU: the run script, two domain properties, counterexamples as scenarios.**
- Files: new `frontend/scripts/oracle/hw-cpu-nuxmv.mjs` (a sibling of the Verilator scripts: version check, a
  `-source` command file, `read_model`, `go`, `check_invar`, `check_ltlspec`, the engine of R14 per variant, the trace
  printed with the XML plugin of `show_traces`, number read from `show_plugins`), `frontend/package.json` (script
  `mc:hw`), new `frontend/src/model/simulation/smvTrace.ts` (pure: an XML trace and the exporter's name map → a
  `ScenarioRecord`, plus the ROM contents for a free-ROM trace), its test, committed
  `frontend/src/codegen/examples/hw-cpu/hw-cpu.properties.smv` and the verdicts `hw-cpu.mc.json`.
- Domain properties (written by hand, in the committed file): *`PC` is constant after `HALT`*:
  `FROZENVAR pc0 : unsigned word[4];  LTLSPEC G ((state = HALT & PC_value = pc0) -> X PC_value = pc0)`, the frozen
  `pc0` quantifying over every value; *the program halts with its result*:
  `LTLSPEC F state = HALT` and `LTLSPEC G (state = HALT -> RAM_15_value = 0ud8_<expected>)` on the concrete export. An
  optional third as a watch, so the simulator and nuXmv read one text (R-SIM-137): at FETCH, `Z` is set iff `ACC` is
  zero; it holds only if every instruction that writes `ACC` writes `Z` (§11, question 7).
- Counterexample → scenario: each trace state after the first becomes one `ScenarioStep` (`scenarioCodec.ts:61-66`
  [read]): `event` from the event `IVAR`, `selector` from the selector `IVAR` where there was a choice and `null`
  otherwise, `kind` `fired` or `quiescence`, `inputs` from the input `IVAR`s; an LTL lasso contributes its stem and
  one turn of its loop, within `SCENARIO_MAX_STEPS = 1000` (`scenarioCodec.ts:46` [read]); the scenario's name is the
  property's. That is the spec's «same information; replayable without conversion» (`computational_model.md:228`)
  for the concrete export; for the free-ROM export the ROM contents are written into the cells' `init` first (R15).
  Round-trip test: the scenario replayed by the step loop reaches a configuration that violates the property's
  watch. Entry into the app: the build script adds a second model of the same metamodel, `cpu-decode-gap` (DECODE
  without its `else`), whose `runScenarios` holds the counterexample nuXmv returned for it (so `build-hw-cpu.ts` and
  `hw-cpu.json` are in this slice's files too); a panel command to load a trace is not in this plan (§11, question 9).
- Normal suite without nuXmv: the export of the fixture hashes to the one recorded in `hw-cpu.mc.json`, so a model
  change without a new `npm run mc:hw` fails (the `oracle:bv` pattern).
- Depends on S-G2 and on **nuXmv installed** (R12, §13 item 4); blocked without it. **Fits** one session.

**S-C0 — the two JjTL prerequisites of D1.** Phase 1 first (a JjTL lane of its own, §8 D1.2).
- Files: `frontend/src/jjtl/executor/executor.ts` (F4: dereference a source `{__ref}` in a binding's member access),
  a new test in `frontend/src/jjtl/executor/__tests__/`; the containment write-back measurement is an in-app probe
  (`frontend/scripts/probe/`, scratch) and, if it fails, a fix in `frontend/src/components/project/ProjectEditor.tsx`
  (`:1833-1856`, `:2017-2023`, §4.3).
- Tests: the §4.5 variants `flat`, `nav`, `navResolveRev` as executed tests, the last two green after the fix.
- Depends on nothing. **Fits** one session for F4 and the probe; a `ProjectEditor.tsx` fix is a second session.
- Parallel with S-D0 and S-A1.

**S-C1 — `VerilogAst` revised and the transformation `hw_to_verilog`.**
- Files: the build script (the `VerilogAst` metamodel per §6.3: `PortId`, abstract `Signal`, the three references, no
  `portNames`), the transformation text in the spec JSON, the regenerated `.jjodel`; the printer exposed to JjTL
  bindings as one helper for `bodyText` (§8 D1.1), in the JjTL executor's builtins.
- Depends on S-C0, S-D. **Fits** one session.

**S-C2 — templates on `VerilogAst` and the test A == B.**
- Files: `hw-cpu.json` (the `VerilogAst` template set), the build script, a test that route B's text equals route A's
  committed `cpu.v`/`tb.v` byte for byte.
- Depends on S-C1. **Fits** one session.

**S-F — a one-page README for the engineer.**
- File: `frontend/src/codegen/examples/hw-cpu/README.md`: what the notation is, how to open the project, run the
  program, read the trace, generate Verilog, run `npm run oracle:hw` and `npm run mc:hw`, the hex-as-string rule (R6),
  what is not covered (§5.3 limits, the derived-word limit). No partner name.
- Depends on S-E and S-H (and S-C2 if route B is in the demo). **Fits** a light session.

**S-B' (optional) — the JS oracle of the CPU (R-GEN-11).** `hw-cpu.json` JS templates copied from `turnstile.json`,
the `word` case of `inDomain` in the shared example templates (R8, `hw-notation.md:19`); after S-B; one session; not
needed by the demo.

### 10.2 Order, parallelism, what the demo needs

The **build track** is serial and is the critical path: `build-hw-cpu.ts`, `hw-cpu.json` and the generated
`.jjodel` are edited by S-A1, S-B, S-D, S-A2, S-H, S-C1 and S-C2, in that order. Everything else runs beside it.

| Wave | Slices in parallel (disjoint files) | Note |
|---|---|---|
| 1 | S-D0 · S-A1 · S-C0 | `codegen/target/verilog/` + `memoryIdiom.ts` · build track · `jjtl/` |
| 2 | S-B | build track |
| 3 | S-D · S-G1 | build track + `codegen/engine/` · `model/simulation/smvExport.ts` only |
| 4 | S-A2 · S-E · S-G2 | build track · `scripts/oracle/` + `package.json` · `smvExport.ts` |
| 5 | S-H | build track, `package.json` after S-E (one line each: `oracle:hw`, `mc:hw`) |
| 6 | S-C1, then S-C2 | build track; route B |
| 7 | S-F | after S-E and S-H (and S-C2 if route B is in the demo) |

The demo cannot do without: **S-D0, S-A1, S-B, S-A2, S-D, S-E** (the model simulated, its Verilog generated and
agreeing with Verilator) and, now that model checking is part of it, **S-G1, S-G2, S-H**, plus **S-F**. Route B
(S-C0, S-C1, S-C2) shows the engineer's own metamodel at work and has route A as its oracle; the demo works without
it. S-B' is optional. Fourteen slices, one of them optional; the demo minimum is ten, about ten sessions.

## 11. Open questions

Numbered as §3-§9 cite them. None blocks wave 1 of §10.2.

1. Is an export of the engineer's `VerilogAst` project available, or does S-C1 rebuild it from the prose of the
   prompt (§6.1)? Blocks S-C1 only.
2. Clock: decision 4 (§12) takes ε; does the engineer prefer a visible `clk` event on the board? It changes the
   export by one event `IVAR`, nothing else.
3. Does `ParamOverride.name` stay a string (§6.3)? Yes for the CPU, which has no parameterised instance.
4. The datapath driving the behaviour (structural Verilog, one module per component, §8 D2.3): a later round, or
   never?
5. F4 (§4.5): fixed in the JjTL executor (S-C0), or worked around by rule order in `hw_to_verilog`?
6. Where the project ships: `frontend/public/examples/hw/` (this plan) or the gallery, which is not merged (§3)?
7. ISA: does every instruction that writes `ACC` (`LDA`, `LDI`, `ADD`, `SUB`, `AND`) also write `Z`? It decides
   whether the `Z` invariant of S-H holds or is a finding about the ISA.
8. Yosys' SMV backend, to check the same properties on the generated Verilog: a later round or never? Yosys is not
   installed (§9).
9. A panel command that loads a nuXmv counterexample into `runScenarios`: a later item, or part of the demo (S-H
   installs it from the build script instead)?
10. The nuXmv engine per export (BDD, IC3, bounded) and the time per property: measured in S-H; a free-ROM property
    above 30 s on the presenter's Mac is shown as a recorded result (R14).
11. The program in ROM (S-B): a product by repeated addition, a sum, a countdown? Its expected result enters both the
    scenario's `expect` and the `LTLSPEC` of S-H.

## 12. Decisions taken (unattended)

Taken under RC-25 by this discovery, each reversible on the branch; numbered as §5.3 cites them. None is an item of
RC-26's list.

1. **The verdicts of §8**: D1 amended (two routes, A first; the JjTL prerequisites), D2 amended (exit actions, no
   derived wires, the datapath as structure, Harvard memory), D3 amended (`PortId`, `Signal`), D4 confirmed with its
   shape, D5 confirmed.
2. **Harvard memory**: a ROM of frozen cells read with `bits(w, c.init)` and a RAM of σ cells (§5.2, measured).
3. **An accumulator**, not a register file; the register file is the first extension (§8 D4).
4. **The clock is ε**: Play runs the program to `HALT`, and the `.smv` export has no event `IVAR` for it; a `clk`
   event is a later variant (§11, question 2).
5. **One control state is one cycle**; its transfers are its exit action, no entry or transition action writes a
   register (§5.3).
6. **The JjEL→Verilog printer is the centre**, in `frontend/src/codegen/target/verilog/` (R-GEN-16's second target),
   and its operator forms are those of `oracle.mapping` (R-BV-10).
7. **Route A before route B**; a test A == B when B lands (§8 D1).
8. **One build script** per §3, the app's own export, a spec JSON beside it read by the node tests.
9. **Ports are vertices, wires are objects-as-edges**, nothing nested, viewpoints hand-written (R3, R4, R10, R11).
10. **Constants are strings**, `bits(8, '0xff')` (R6); **the testbench samples at `negedge clk`** (R5).
11. **The printer wraps a nested operator result in `{…}`**, so Verilog's context widths cannot change a JjEL value
    (S-D0).
12. **One recogniser of the memory idiom**, `frontend/src/model/simulation/memoryIdiom.ts`, read by the printer and
    by the exporter, so the two cannot disagree on what a memory access is.
13. **The `.smv` exporter is `frontend/src/model/simulation/smvExport.ts`**, pure, the place the computational model
    spec gives it (`:241-243`); its first cut is the one-token state machine with the four σ domains, the rest
    refused with a defect (S-G1).
14. **Two exports of one model**: concrete ROM for the program's properties, free ROM for the structural ones (R14).
15. **The structural properties are generated**, six families (S-G2); the per-opcode instances come from the ISA view
    through a template (S-H). **The domain properties are written once** in `hw-cpu.properties.smv`, and an invariant
    that the simulator can also read is a watch (R-SIM-137).
16. **A counterexample becomes a `ScenarioRecord`** by a pure `smvTrace.ts`, plus the ROM contents for a free-ROM
    trace (R15).
17. **nuXmv runs from a node script on the presenter's Mac**, never inside the app and never shipped with it (spec
    `:235-236`); the normal suite checks a committed verdict without nuXmv, as for Verilator.
18. **DECODE has a fused `else` to FETCH**, so the six undefined opcodes act as `NOP` and the shipped model is
    deadlock-free (R16).

## 13. Decisions awaiting Alfonso

(pending)

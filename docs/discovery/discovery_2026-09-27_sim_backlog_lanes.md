# Discovery — the simulator backlog cut into parallel lanes, after E1 and E2

- Prompt-ID: `P-2026-09-27-1625` (chat `C-2026-09-27-1437`)
- Prompt file: `docs/prompts/claude_2026-09-27_1625_prompt_discovery_sim_backlog_lanes.md`
- Session: `889e4663-5863-4464-ae6e-2db92967b65d`
- Tree: `~/jjodel-sim`, branch `simulation-engine`, HEAD `8479b6242` (the prompt commit; parent `2b1b346da`, the trunk).
  `git status` empty at the start.
- Executor: Opus 5.5 (session banner)
- Read-only. No file under `frontend/` was written, no probe was run, no dev server was started.

This report is a set of hypotheses with evidence, not a definitive reference. Anyone who uses it downstream should
re-read the real files. Tags: **[M]** measured in this phase (a command run on this tree or on a branch ref, named);
**[R]** read in a file of HEAD `8479b6242`, or of the branch named. Line numbers are those of HEAD unless a branch is
named.

---

## 0. Answer in brief

- **24 open items**, each with its origin (§4). The prompt's ten are all open. The checkpoint's «still open» list
  (`sessione_2026-09-27_4.md:37-38`) is not the whole backlog: 11 more items sit as tickets in the active log and the
  inbox. The other tickets read were checked and found closed, taken by E1 or E2, or outside the simulator
  (§4.8).
- **Wave 1 (launchable now) has one code lane and six read-only discoveries.** Only one code item is ready to build
  and touches neither E1's nor E2's files: the binding compatibility check, a new pure module of the modal lane.
  - The other items that avoid those files (S3, S15, S16, S23, S24) need a Phase 1 first. Most wait for Alfonso too.
  - Every remaining code item touches `simBridge.test.ts` (in E1's diff), or `SimulationPanel.tsx` /
    `simRoleStatus.ts` (in E2's list).
  - The six discoveries prepare what comes after MODELS: the canvas side of G3, outputs and Accepting, the checker
    gap, R-SIM-74, the modal, and enum step B.
- **Wave 2 splits in two.** E1 already has both code commits (`45a796050`, `bce34aee1` on `sim-e1-engine` [M]), so
  its files free first:
  - **2a** (after E1): derived diagnostics, stale comments, and the `∅` lane if Alfonso wants it.
  - **2b** (after E2): the readiness re-measure, the demo script, and the M2 summary fixes.
  - **Wave 3** (merges after MODELS): one panel lane at a time, since seven items share `SimulationPanel.tsx`, and
    four lanes that run beside it with disjoint files.
- **Freeze rule proposed:** a code merge may land before 2026-10-01 evening only if it lands before
  `sim-readiness-3`. That lane's run is the last measurement of the trunk before the freeze. The wave-1 discoveries,
  the unwired `sim-binding-compat` and `sim-comments` change nothing the demo shows.
- **Three findings the chat should know before launching:**
  - E2's DOVE swaps two paths. It names `model/simulation/modelMarkings.ts` (absent) and `sim/stcFromRoles.ts`
    (absent); the files are the other way round [M].
  - R-SIM-74's deferred refinement «(metaclasse, nome)» would not lift the containment recursion. The collection
    form is also refused by R-SIM-43 and by the evaluator [R].
  - «Clear bindings» can avoid the core. Every reader treats `''` as unset [R].

---

## 1. Hypotheses under test

| # | Hypothesis | Verdict | Evidence |
|---|---|---|---|
| H1 | The checkpoint's «still open» list is the whole simulator backlog | **falsified** | 12 items at `sessione_2026-09-27_4.md:37`, and the `∅` glyph at `:38` [R]. Open tickets outside it: `claude-code-log.md:251-255` (stale `simEvent`), `:287-290` (dead helpers), `:292-295` (Trigger options), `:377-379` (SimModelView, rename, comments); `docs/log-inbox/simulation.md:24` (checker gap), `:25` (select-all), `:41` (derived-absent message), `:115` (unreadable hint) [R] |
| H2 | The prompt's ten items are all still open | **holds** | each re-read in code (§4). None is closed by a commit on the trunk or on `sim-e1-engine`, `sim-e2-panel-bound` [M: `git log`, `git diff --stat`] |
| H3 | Enough code items avoid E1's and E2's files to fill a wave 1 of code lanes | **falsified**: one is ready | S11a (new files) is disjoint and ready. S3, S15, S16, S23 and S24 are disjoint but need a Phase 1 first. The rest touch E1's `simBridge.test.ts` or E2's `SimulationPanel.tsx` / `simRoleStatus.ts` (§4.9, column «E1/E2») [R] |
| H4 | E1's file set is its DOVE | **holds**, with the optional test taken | `git diff --stat 5260df11f sim-e1-engine`: 8 files, `simBridge.test.ts` among them (+26) [M] |
| H5 | E2's DOVE paths name existing files | **falsified** | `test -f`: `model/simulation/modelMarkings.ts` 1, `components/editor-v2/sim/modelMarkings.ts` 0, `components/editor-v2/sim/stcFromRoles.ts` 1, `model/simulation/stcFromRoles.ts` 0 [M] |
| H6 | The refinement R-SIM-74 defers («per (metaclasse, nome)») lifts the containment recursion | **falsified** | report C2 §6: G2 «removes the false positive for `self` only; every other path falls back to the name» (`discovery_2026-09-27_sim_derived_attributes.md:353`). `children.[total]` is refused anyway: `evaluator.ts:1011-1014` [R] |
| H7 | «Clear bindings» needs `set_state` to delete a key (a core change) | **partly** | `''` is unset for every reader (§4.2 S9), so a clear can write `''`. The two measurements of `undefined` disagree (§4.2 S9) [R] |
| H8 | Only G3's canvas side touches the critical zone | **falsified** | the checker gap (S16) and the saved-states detector (S24) live in `components/editor-v2/problems/`, a §3.1 directory [R] |

---

## 2. Objective

Collect every open simulator item, with its origin. Say for each one:
- what it is and which files it touches, verified by reading;
- its tests and its size;
- whether it is an RC-26 item;
- whether it changes the MODELS demo;
- where it collides with E1 (`P-2026-09-27-1610`) and E2 (`P-2026-09-27-1611`).

Then group the items into waves of lanes with disjoint file sets, so the chat can launch each wave as soon as E1 and
E2 free their files.

---

## 3. Sources read

Full paths under `/Users/alfonso/jjodel-sim/` unless a branch is named.

**Docs:**
- `CLAUDE.md`: whole (session context).
- `docs/PROTOCOL.md`: `:32-64` (P4, P6), `:220-292` (P13), `:368-417` (P16).
- `docs/decisions.md`:
  - `:140-246` (RC-20..30), `:247-275` (R-EDGE);
  - `:1422-1453` (R-SIM-1..6), `:1686-1704` (R-SIM-33), `:1778-1802` (R-SIM-40..43);
  - `:1855-1912` (R-SIM-50..56), `:2024-2136` (R-SIM-73..82).
- `docs/log-inbox/simulation.md`: whole. `docs/log-inbox/views.md`: whole.
- `docs/log-inbox/harness.md`: grep of `sim`.
- `docs/claude-code-log.md`: `:1-30`, `:80-125`, `:251-300`, `:365-395`, and grep of `Ticket` in `:435-484`.
- Session checkpoints:
  - `docs/sessioni/sessione_2026-09-27_4.md`: whole;
  - `docs/sessioni/sessione_2026-09-27.md`: `:14-32`, plus its open-items section;
  - `docs/sessioni/sessione_2026-09-27_2.md`, `_3.md`, `sessione_2026-09-26_simulatore.md`: open-items sections.
- `docs/digest/2026-09-27.md`: `:1-80`.
- Discovery reports:
  - `docs/discovery/discovery_2026-09-27_sim_demo_readiness_2.md`: `:22-64`, `:282-414`;
  - `docs/discovery/discovery_2026-09-27_sim_demo_readiness.md`: `:380-410`, `:440-450`, grep of `canvas`;
  - `docs/discovery/discovery_2026-09-27_sim_profiles_panel.md`: `:147-173`, `:246-292`, `:358-426`;
  - `docs/discovery/discovery_2026-09-27_sim_derived_attributes.md`: `:118-133`, `:181-203`, `:341-472`;
  - `docs/discovery/discovery_2026-09-27_enum_edge_guard.md`: `:1-45`, `:239-389`;
  - `docs/discovery/discovery_2026-09-27_sim_demo_hint_path_trunk.md`: headings and §8;
  - `docs/discovery/discovery_2026-09-26_sim_state_declarations.md`: §7.6 (`:351-363`).
- `docs/demo/models_2026_simulator_demo.md`: `:295-347`, grep of `∅`, `Configure`, `Kept`.
- Status lines of the 2026-09-26/27 simulator prompts under `docs/prompts/` (grep).

**Branch refs, read with `git show` (not in this tree):**
- `sim-post-models-engine:docs/discovery/discovery_2026-09-27_sim_post_models_engine.md`: whole. It is cited as
  «E1/E2 scope» by the prompt, and it is not on the trunk.
- `5260df11f` (E1 prompt, `docs/prompts/claude_2026-09-27_1610_prompt_sim_e1_engine_g6_g7.md`) and `d685b5738` (E2
  prompt, `…_1611_prompt_sim_e2_panel_row_bound.md`): whole.
- `sim-e1-engine:frontend/src/model/simulation/roleCatalog.ts` `:5-14`; `netStep.ts`, `netTypes.ts`: grep.

**Code** (`frontend/src/`):
- `model/simulation/derivedEvaluator.ts`: `:1-60`, `:90-259`.
- `model/simulation/netStep.ts`: `:20-24`, `:205-321`.
- `model/simulation/netTypes.ts`: `:3-7`, `:240-316`.
- `model/simulation/stcFromRoles.ts`: `:1-40`.
- `model/simulation/profileBinder.ts`: `:360-402`.
- `model/simulation/simProfiles.ts`: `:250-310`.
- `components/editor-v2/sim/simRoleStatus.ts`: `:215-352`, `:110-145`.
- `components/editor-v2/sim/simBridge.ts`: exports list, `:160-172`, `:778-865`.
- `components/editor-v2/sim/SimulationPanel.tsx`: `:268-280`, `:316-326`, `:410-425`, `:466-480`, `:725-760`, and
  greps.
- `components/editor-v2/sim/metamodelSketch.ts`: `:1-40`.
- `jjel/evaluator/evaluator.ts`: `:995-1025`.
- `model/simulation/guardContext.ts`: `:189-198`.
- `components/editor-v2/sim/__tests__/simBridge.test.ts`: `:1-40` and the `describe` list.
- `find model/simulation components/editor-v2/sim -type f | xargs wc -l` (the inventory, 45 files) [M].

---

## 4. The items

### 4.0 The fixed side: E1's and E2's files

**E1** (`sim-e1-engine`, `~/jjodel-icons`). Two code commits exist: `45a796050` (G6) and `bce34aee1` (G7).
`git diff --stat 5260df11f sim-e1-engine` lists 8 files [M]:
- `model/simulation/netTypes.ts`, `netCompile.ts`, `netStep.ts`, `roleCatalog.ts`;
- `__tests__/netCompile.test.ts`, `netStep.test.ts`, `roleCatalog.test.ts`;
- `components/editor-v2/sim/__tests__/simBridge.test.ts`.

The closure also writes `docs/decisions.md` and `docs/log-inbox/simulation.md`.

**E2** (`sim-e2-panel-bound`, `~/jjodel-open`). No code commit yet [M: `git log d685b5738..sim-e2-panel-bound`
empty]. Its DOVE, with the two paths corrected (H5):
- `components/editor-v2/sim/simRoleStatus.ts`, `SimulationPanel.tsx`, `modelMarkings.ts`;
- `model/simulation/stcFromRoles.ts`;
- one new module under `model/simulation/`, name unknown until the lane greps for a free one;
- their tests: `sim/__tests__/simRoleStatus.test.ts`, `sim/__tests__/modelMarkings.test.ts`,
  `model/simulation/__tests__/events.test.ts` (the tests of `stcFromRoles` live there), and the new module's test;
- possibly `simulation-panel.scss`;
- the docs: `docs/decisions.md`, the inbox.

«Conflict» in the tables below means a shared file with either set.

### 4.1 Engine and run

**S1. A failed presentation equation after a step is shown nowhere.**
- **Origin.** `docs/log-inbox/simulation.md:44`: «A failed presentation equation is not surfaced; consider a line in
  «Last step» title.» Measured at `:37`: «A presentation failure after a step leaves the value out and is shown
  nowhere.»
- **Where it is lost.** In the step:
  - `netStep.ts:270`: `const failure = out.failures.find(f => f.space === 'semantic');` The presentation failures of
    `out` are dropped there.
  - `NetLabel` (`netTypes.ts:286-294`) has no field for them.
- **Where the title is built.** `simBridge.ts:856-864` (`pressInput`, `lastStepTitle`). The panel only shows it:
  `SimulationPanel.tsx:724`, `:1073`.
- **Files.** Recommended route, bridge only: `simBridge.ts` (`pressInput` asks `run.derived` again on σ′ for the
  presentation failures when a declared presentation value is missing) and `simBridge.test.ts`.
  - The engine route would add `NetLabel.derivedFailures?` (Rule 11, additive).
  - That route touches `netTypes.ts`, `netStep.ts` and `netStep.test.ts`, three E1 files.
- **Tests.** A presentation equation that fails after a fired step gives a `presentation: … failed: …` line in the
  title. Control: a semantic failure still halts `derived`, with no change.
- **Size.** Fast.
- **RC-26.** No.
- **Demo.** No change: no preset declares an equation.
- **Conflict.** `simBridge.test.ts` (E1).

**S2. A derived attribute that failed at Reset reads as «not a state attribute».**
- **Origin.** `docs/log-inbox/simulation.md:41`: «a reader says «'total' is not a state attribute of cnet»: true of
  the value, misleading about the declaration.»
- **The message.** `jjel/evaluator/evaluator.ts:1016-1018`: `const value = access.read(id, expr.attribute);` /
  `if (value === undefined) {` / `` throw new JjelEvaluationError(`'${expr.attribute}' is not a state attribute of `` …
- **The adapter.** It cannot tell «not declared» from «declared, no value»: `guardContext.ts:189-195`
  (`toJjelStateAccess`).
- **Files.** `guardContext.ts`: an optional `declared` argument; a declared derived attribute with no value throws
  «derived 'total' has no value (its equation failed)». Its three callers pass it:
  - `derivedEvaluator.ts:224`;
  - `actionEvaluator.ts:211`;
  - `simBridge.ts:167`.
- **Tests.** `guardContext.test.ts`, `derivedEvaluator.test.ts`, `actionEvaluator.test.ts`, and `simBridge.test.ts`
  for the guard wiring.
- **Size.** Full (more than 3 files) with S1.
- **RC-26.** No.
- **Demo.** No change.
- **Conflict.** `simBridge.test.ts` (E1).

**S3. R-SIM-74: a well-founded recursion is refused.**
- **Origin.** `docs/log-inbox/simulation.md:39`; `docs/decisions.md:2046-2054`: «Limite dichiarato: una ricorsione
  ben fondata sul contenimento (`total := own + sum(children.[total])`) è un self-loop per nome e viene rifiutata …
  Rinviato un raffinamento per (metaclasse, nome).»
- **The code.** The name graph is `derivedEvaluator.ts:137-144` («The graph by name (G1)») and the topological order
  `:157-168`.
- **Two facts decide the lane [R]:**
  - **(a) The refinement the row defers does not lift the limit.** Report C2 §6 (`:353`) says G2 «removes the false
    positive for `self` only; every other path falls back to the name». `self.parent.[depth]` and
    `children.[total]` read through a feature path, so only G3, per (element, attr) folded over frozen M (`:355`),
    orders them.
  - **(b) The collection form is refused before the graph.** R-SIM-43 (`decisions.md:1799-1800`): «Un percorso che
    dà una collezione o `null` è un difetto a tempo di run». `evaluator.ts:1011-1014`: `'.[${expr.attribute}]' needs
    a model element on its left, got ${got}`, with `got` = «a collection».
- **Files, Phase 2 (provisional, for the discovery to confirm).**
  - `derivedEvaluator.ts`: `compileDerived` keeps a self-loop as a candidate, and `makeDerivedOracle`, which already
    holds the snapshot and the net (`:251-259`), orders per element. Plus `derivedEvaluator.test.ts`.
  - For the collection form, `jjel/evaluator/evaluator.ts` (JjEL, outside the simulator) as well.
- **Size.** Full, with a Phase 1 first.
- **RC-26.** Yes. It amends R-SIM-74, and for the collection form R-SIM-43, ratified 2026-09-25. R-SIM-74 is
  ratified by the morning digest, point 1 (`sessione_2026-09-27.md:20`), although `decisions.md:2046` still carries
  `provisional, unattended`.
- **Demo.** No change.
- **Conflict.** None with E1/E2 files.

**S4. Outputs (R-SIM-76, R-SIM-51) and Accepting (R-SIM-50); DFA, NFA, Moore and Mealy stay hidden until then.**
- **Origin.**
  - `docs/log-inbox/simulation.md:40`: «`simStateOutput` and `simTransitionOutput` still have no reader: the outputs
    lane after C2.»
  - `docs/decisions.md:2063-2069` (R-SIM-76), `:1855-1863` (R-SIM-50, R-SIM-51).
  - `:1888-1891`, «Punti aperti chiusi» (2): «l'implementazione entra con la corsia di Accepting e degli output».
  - M3 A2 (`simulation.md:74`): four presets, «DFA, NFA, Moore and Mealy hidden until R-SIM-50/51».
- **Absence [M].** `command grep -rn 'simAccepting\|simStateOutput\|simTransitionOutput\|PANEL_PROFILES'` over
  `frontend/src`, tests excluded, exit 0. The three keys hit only in `roleCatalog.ts:9,76,164,168`, the preset list
  only in `SimulationPanel.tsx:71,920`. Positive control, `simTerminal` through the same command: 6 hits in
  `SimulationPanel.tsx:189`, `simRoleStatus.ts:30,70`, `stcFromRoles.ts:24`, `netCompile.ts:48`, `netTypes.ts:214`.
- **Files [R], for the discovery to confirm.**
  - `netTypes.ts`, `netCompile.ts` (a `ROLE_KEYS` pair, the accepting set), `netStep.ts` (the predicate).
  - `simBridge.ts` (the output of the marked place on frozen M; the Mealy output on the σ before the step, report C2
    risk 6, `discovery_2026-09-27_sim_derived_attributes.md:426-428`).
  - `simRoleStatus.ts` (`ROLE_SPECS`), `SimulationPanel.tsx` (`ROLE_GROUPS`, the M1 face, `PANEL_PROFILE_IDS`).
  - `stcFromRoles.ts` (`simAccepting` in the node sort).
  - `roleCatalog.ts` header and `roleCatalog.test.ts`.
- **Size.** Full (more than 3 files), with a Phase 1 first.
- **RC-26.** Showing the four hidden presets changes what the demo leaves out (A2). The engine wiring alone does not.
- **Demo.** After MODELS.
- **Conflict.** E1 (engine files, tests) and E2 (`simRoleStatus.ts`, `SimulationPanel.tsx`, `stcFromRoles.ts`).

**S5. The bridge reads keys whose role is `off` (the D4 resolver); after G6 a stale `simActivityFinal` becomes live.**
- **Origin.**
  - `docs/decisions.md:2093-2094` (R-SIM-78): «il risolutore che salta le chiavi `off` arriva dopo la riga Petri di
    R-SIM-54 (D4)». That row was amended by `7455d0075`, so the condition holds.
  - `docs/log-inbox/simulation.md:68`, the last item of the modal ticket.
  - Post-MODELS report §5.1 risk 1 (branch `sim-post-models-engine`): «After G6, a `simActivityFinal` left by an
    earlier Flowchart Apply ends runs under another profile.»
- **Files.**
  - `simProfiles.ts`: a pure `activeBag(profile, bag)`, with `simProfiles.test.ts`.
  - `simBridge.ts`: `startRun` and `runSignature` read the resolved bag. Plus `simBridge.test.ts`.
  - `SimulationPanel.tsx`: the M1 gate reads roles from the bag (`missingEngineRoles`, `simRoleStatus.ts:139-145`),
    and `petriShape` follows `roles.simArc`, so the resolver has to apply there too or the gate and the run disagree
    [R, inference].
- **Size.** Full (more than 3 files).
- **RC-26.** No: R-SIM-78 schedules it, and it amends nothing.
- **Demo.** A run of a bag with set-but-off keys changes. The demo applies from empty bags (script §3, «from an empty
  bag»), so its runs should not change. That is inferred, to be measured, and it touches the run path, so the merge
  comes after MODELS.
- **Conflict.** E1 (`simBridge.test.ts`) and E2 (`SimulationPanel.tsx`).

### 4.2 The M2 face (profiles, summary, bindings)

**S6. «Kept: Node»: the other proposals come from the binder's own Node, not the kept one.**
- **Origin.** `docs/log-inbox/simulation.md:73`.
- **The code.**
  - `bindProfile(profile, sketch)` (`profileBinder.ts:376-402`) sees no bag. It picks its own node
    (`controlFlowCore` / `petriRoles`, `:382-386`) and derives the rest from it.
  - `profileSummary` only notices the difference (`simRoleStatus.ts:336-338`, `kept.push(...)`).
- **Files.**
  - `profileBinder.ts`: an optional third argument, the set bag keys; dependent rules start from a kept Node or
    Transition. Rule 11: an optional parameter, additive.
  - `profileBinder.test.ts`.
  - `SimulationPanel.tsx:507` (the call).
- **Size.** Fast.
- **RC-26.** No.
- **Demo.** No change: presets are applied from empty bags.
- **Conflict.** E2 (`SimulationPanel.tsx`).

**S7. A bag saved before R-SIM-38 changes its event class silently.**
- **Origin.** `docs/claude-code-log.md:251-255`: «Wanted: a warning on the M2 face when a stored `simEvent` differs
  from the derived class, naming both».
- **Still open [R].** The stale value is ignored (`simBridge.ts:396`, `SimulationPanel.tsx:1158`), and no warning
  compares it: grep of `simEvent` over the sim panel files, 13 hits, none a comparison.
- **Files.** `simRoleStatus.ts` (a pure warning), `simRoleStatus.test.ts`, `SimulationPanel.tsx` (one line).
- **Size.** Fast.
- **RC-26.** No.
- **Demo.** No change.
- **Conflict.** E2.

**S8. The declarations hint also shows when `simStateAttributes` is set but unreadable.**
- **Origin.** `docs/log-inbox/simulation.md:115`.
- **The code.** `simRoleStatus.ts:349-350`: `stateAttributeRows(...).rows.length === 0` is true for an unreadable key
  as for an empty one.
- **Files.** `simRoleStatus.ts`, `simRoleStatus.test.ts`.
- **Size.** Fast.
- **RC-26.** No.
- **Demo.** No change.
- **Conflict.** E2.

**S9. «Clear bindings».**
- **Origin.** `docs/log-inbox/simulation.md:70`; R-SIM-78 (`decisions.md:2092`): «un'azione «Clear bindings» è
  rinviata».
- **The ticket's premise is `set_state` with `undefined`.** Two measurements disagree:
  - C1 report §7.6 (`discovery_2026-09-26_sim_state_declarations.md:360`): «after writing { key: undefined } and
    waiting 3 s: all three keys still in the raw bag»;
  - C1 entry Notes (`simulation.md:21`): «set_state to undefined via the panel select removed the key».
  - The panel writes exactly that on a cleared select: `SimulationPanel.tsx:565`, `lmm.state = { [key]: value === ''
    ? undefined : value };`.
- **A route without the core [R].** `''` is unset for every reader:
  - `netCompile.ts:41` `if (raw === undefined || raw === null || raw === '') return undefined;`;
  - `simProfiles.ts:291` `return typeof value === 'string' && value !== '';`;
  - `profileCodec.ts:122` (the same);
  - `stcFromRoles.ts:13-16` (`pointer`);
  - `simRoleStatus.ts` `isSetKey` (`:249-252`).
- **Files.** `simRoleStatus.ts` (a pure clear patch), `simRoleStatus.test.ts`, `SimulationPanel.tsx` (the button).
  First a probe of the `undefined` path.
- **Size.** Fast.
- **RC-26.** Only if the lane ends up needing `set_state` (R-SIM-4, ratified).
- **Demo.** A new button on the M2 face, so after MODELS.
- **Conflict.** E2.

**S10. The Trigger select lists every reference of the metamodel.**
- **Origin.** `docs/claude-code-log.md:292-295`: «Restrict the options to the references of the arc/transition
  class.»
- **Still open [R].**
  - `SimulationPanel.tsx:731-737`, `optionsFor` returns `options.references` for a reference role;
  - `:745-752`, `selectOptions` filters only Node, Transition and the Data roles.
  - The binder's lineage rule (`profileBinder.ts:259`) applies to proposals, not to the select.
- **Files.** `SimulationPanel.tsx`, plus a pure filter.
- **Folded into S11** («binding dropdowns with compatible candidates only»), with S11a's module as the filter.
- **Size.** Fast.
- **RC-26.** No.
- **Demo.** No change.
- **Conflict.** E2.

**S11. The modal lane (R-SIM-55).**
- **Origin.** `docs/log-inbox/simulation.md:68`; profiles report §4, «What the modal lane adds»
  (`discovery_2026-09-27_sim_profiles_panel.md:363-372`):
  - the modal shell with «Configure…» pointed at it;
  - the compatibility check producing `BindingVerdict` («with warnings»);
  - compatible-only dropdowns;
  - user profiles, «Save as…» and the modified state;
  - the Step 1 cards;
  - the inert SMV placeholder;
  - the resolver (here S5).
- **Size** (report `:284`). «About 12-15 files … Two to three lanes».
- **Sub-lanes:**
  - **S11a, the compatibility check, as a pure module.** `BindingVerdict` exists and nothing produces it:
    `simProfiles.ts:259`, `export type BindingVerdict = 'ok' | 'warn' | 'incompatible';`. `checkability` already
    takes `verdicts?` (`:299-309`). `simRoleStatus.ts:227` reads «never «with warnings» (D5)».
    - Files: a new `model/simulation/bindingCompat.ts` plus a new `__tests__/bindingCompat.test.ts`, over
      `MetamodelSketch` (`profileBinder.ts`) and the catalog. Unwired.
    - Size: fast.
    - RC-26: no.
    - Demo: no change (nothing imports it).
    - Conflict: none.
  - **S11b, the shell and the system presets.**
    - Files: a new `sim/SimRolesModal.tsx` and `.scss`; `events/registry.ts` (`SIM_ROLES_OPEN`); `App.tsx` (mount);
      `SimulationPanel.tsx`; `simulation-panel.scss`. The pattern of `SymbolEditorModal` (report `:147-173`).
    - Size: full (more than 3 files), with a visual check.
    - Demo: changes the M2 face, so after MODELS.
    - Conflict: E2.
  - **S11c, user profiles, Save as…, and the compatible-only dropdowns (with S10).**
    - Files: `simProfiles.ts`, `profileCodec.ts`, `SimRolesModal.tsx`, `SimulationPanel.tsx`, tests.
    - Size: full.
    - Demo: after MODELS.
    - Conflict: E2.
- **RC-26 for S11b and S11c.** No: they implement R-SIM-55 as ratified and close R-SIM-79's declared deviation.

### 4.3 The M1 face and the declarations table

**S12. The table's own «Add attribute» scrolls nothing; a prefilled cell keeps the caret after its text.**
- **Origin.** `docs/log-inbox/simulation.md:210`. Also `:25` (keyboard select-all appends; not reproduced).
- **The code [R].**
  - `SimulationPanel.tsx:321-323` `add()` commits a row with `initial: 'false'`;
  - `:420` the table's button has only `onClick={add}`;
  - only the hint scrolls (`:474-475`, `add?.scrollIntoView({ block: 'nearest' });`);
  - the prefilled kinds are at `:274`.
- **Files.** `SimulationPanel.tsx`, maybe `simulation-panel.scss`.
- **Tests.** The panel does not load under vitest (profiles report `:254`), so the check is a probe (RC-23).
- **Size.** Fast, with a visual check.
- **RC-26.** Yes if before MODELS: it changes the gestures the script names (demo §2.3, «the three scrolls and the
  double-clicks», `simulation.md:213`).
- **Demo.** After MODELS.
- **Conflict.** E2.

**S13. `∅` at 11-12 px reads like `ø`.**
- **Origin.**
  - `docs/sessioni/sessione_2026-09-27_4.md:38`: «Visual, for Alfonso's walk: the `∅` glyph at 11-12 px»;
  - readiness-2 risk 5 (`discovery_2026-09-27_sim_demo_readiness_2.md:347-352`);
  - the script, `models_2026_simulator_demo.md:328`: «**Say** "t3 has an empty postset."»
- **The glyph.**
  - `simBridge.ts:513` `if (arcs.length === 0) return '∅';`;
  - `:553` `Marking: ${places.length === 0 ? '∅' : …}`.
  - Pinned by `simBridge.test.ts:352-393` (five assertions).
- **Files.** `simBridge.ts`, `simBridge.test.ts`; then, in a docs commit, `models_2026_simulator_demo.md:151-152`,
  `:328`.
- **Size.** Fast.
- **RC-26.** Yes: what the demo shows, and a perceptual judgement.
- **Demo.** Changes it, before the freeze if Alfonso asks.
- **Conflict.** E1 (`simBridge.test.ts`).

**S14. On a state machine the M1 line reads «Marking: locked».**
- **Origin.** Readiness-2 §11 Q1 (`discovery_2026-09-27_sim_demo_readiness_2.md:408-409`): «Should the M1 line read
  «Marking: locked» on a state machine, or «State: locked»? R-SIM-82 fixed «Marking:» for all presets.»
  Unanswered [R].
- **Files.** `simBridge.ts` (`markingLine`, `:538-553`), `simBridge.test.ts`, maybe the call at
  `SimulationPanel.tsx:656`.
- **Size.** Fast.
- **RC-26.** Yes: it amends R-SIM-82 (ratified, «non sono provvisorie», `decisions.md:2112`), and the demo shows the
  line.
- **Conflict.** E1, and E2 if the call changes.

### 4.4 Canvas and checks

**S15. G3's canvas side: token counts and σ on the nodes during a run (wave 3c).**
- **Origin.**
  - Readiness-2 G3 row (`:291`): «canvas: `p1` reads `tokens 2` in `petri_2_after_run.png`», and risk 1;
  - `sessione_2026-09-27_4.md:37`;
  - R-SIM-33 3c (`decisions.md:1689-1690`): «candidati sul canvas come secondo canale accanto a `'mark'`, critical
    zone, discovery propria»;
  - the script, §4 and §5 (`models_2026_simulator_demo.md:322-325`, `:341`).
- **Files [R].**
  - The four files of R-SIM-4 (`decisions.md:1440-1444`): `viewpoint/ir/pathExpr.ts`, `irReadCtx.ts`,
    `irCrossDeps.ts`, `IRNodeContent.tsx`.
  - The run-state readers outside `sim/`: `nodes/ObjectNode.tsx:40,271-272`, `viewpoint/ir/irResolve.ts:14,89`,
    `viewpoint/ir/useIRContainment.ts:15,120` [M: `command grep -rn 'isSimActive\|getSimRun\|useSimVersion'`, exit 0,
    3 files outside `sim/`].
  - `sim/simRunState.ts`.
- **Critical zone.** `viewpoint/ir/` is a §3.1 row. Layer Impact Report, and the RC-30 go-ahead for an orchestrated
  run.
- **Size.** Full (critical zone), with a Phase 1 first.
- **RC-26.** Yes, three times: the critical zone; it amends R-SIM-4 (ratified 2026-08-17, «estensioni future con
  ratifica dedicata»); and it changes the demo.
- **Conflict.** None with E1/E2.

**S16. `node.[x]` in a guard is reported only at Reset, never in the problems registry; actions get no contextual
check.**
- **Origin.** `docs/log-inbox/simulation.md:24`.
- **Related.** C2's probe (4), `simulation.md:37`: «`cnet.[total] := 5` does not resolve … no defect at Reset, then
  an action-defect halt».
- **Absence [M].** `command grep -rln 'checkGuardSubset\|subsetChecker'` over `frontend/src`, tests excluded, exit
  0: `actionEvaluator.ts`, `guardEvaluator.ts`, `derivedEvaluator.ts`, `subsetChecker.ts`, `jjel/stateReserved.ts`.
  No file under `components/editor-v2/problems/` (13 files listed) is among them.
- **Files.** `components/editor-v2/problems/`: a producer and its Sync, `registry.ts`, and perhaps a
  `NodeProblemKind` literal (an exported union). `subsetChecker.ts` is reused.
- **Size.** Full (critical zone), with a Phase 1 first.
- **RC-26.** Yes (critical zone).
- **Demo.** After MODELS.
- **Conflict.** None with E1/E2.

### 4.5 Cleanup

**S17. Dead since R-SIM-38.** `eventRoleWarning` (`simRoleStatus.ts:176`; tests `simRoleStatus.test.ts:17,167-169`)
and `roleWriteVerdict` (`stcFromRoles.ts:92`; tests `events.test.ts:17,189-233`).
- **Origin.** `docs/claude-code-log.md:287-290`.
- **Size.** Fast.
- **Conflict.** E2 (all four files).

**S18. `SimModelView` slimming.**
- **Origin.** `docs/claude-code-log.md:377`.
- **What.** The members `types.ts:42-44` and the stubs `simBridge.ts:98-99`, plus the test views of `netCompile`,
  `netStep`, `events` and `netParity` tests.
- **Size.** Full: an exported interface change, whose consumers are all inside the lane.
- **Conflict.** E1 (`netCompile.test.ts`, `netStep.test.ts`) and E2 (`events.test.ts`).

**S19. Rename `stcFromRoles.ts`.**
- **Origin.** `docs/claude-code-log.md:378`.
- **What.** The importers `simRoleStatus.ts:17-18`, `SimulationPanel.tsx:50,58` and `events.test.ts:17`. The comments
  that name the file: `profileCodec.ts:118`, `simProfiles.ts:274`, `simRoleStatus.ts:248`, `netTypes.ts:111`.
- **Size.** Fast. Rule 2: the prompt must ask for the rename.
- **Conflict.** E1 and E2.

**S20. Comments that describe the old state.**
- **Origin.** `docs/claude-code-log.md:379`.
- **Still stale on HEAD [R]:**
  - `netStep.ts:23` «Not wired yet (R-SIM-33).»;
  - `netTypes.ts:5` «is not wired yet»;
  - `isKindOf.ts:17` «`step.test.ts` runs both walks»;
  - `guardEvaluator.ts:21` «The step does not call this module yet».
- **On `sim-e1-engine`.** The first two are unchanged. The `roleCatalog.ts` header is already fixed by E1 [M: `git
  show`].
- **Size.** Full by count (4 files). Comments only.
- **Conflict.** E1 (`netStep.ts`, `netTypes.ts`).

### 4.6 The demo

**S21. Re-measure the demo on the trunk once E1 and E2 are in.**
- **Origin.**
  - Readiness-2 risk 7 (`:353-354`): «A later trunk commit to `SimulationPanel.tsx` or `simBridge.ts` needs a re-run
    of these probes.»
  - The script (`models_2026_simulator_demo.md:334`): «The summary button on Flow (§2.4) is not measured.»
- **Files.** A report only. Probes `_tmp_demo3_*` gitignored, copied from `_tmp_demo2_*` (present in this tree [M:
  `ls`]).
- **Size.** Fast (a probe lane).
- **RC-26.** No (read-only).
- **Conflict.** None: no source file.

**S22. The script after E1 and E2.**
- **Origin.**
  - E2's COSA: «It changes one thing the demo shows: the Petri proposal reads `Bound → 4` … the script update is a
    separate docs lane after the merge».
  - Script step 3 (`models_2026_simulator_demo.md:134`) and the constraints of decision E (`:305-310`), which E1 lifts.
  - §5 (`:341-347`).
  - The §2.4 double-click left out by 1540 (`simulation.md:222`).
- **Files.** `docs/demo/models_2026_simulator_demo.md`.
- **Size.** Fast.
- **RC-26.** Yes: the lane is what the demo shows, and decision H is Alfonso's.
- **Conflict.** None.

### 4.7 On the prompt's list, outside the simulator's files

**S23. Enum step B: the model invariant and the Ecore import (R-EDGE-2).**
- **Origin.** `docs/log-inbox/views.md:43-47`; `docs/decisions.md:261-267`.
- **Files.** `model/logicWrapper/LModelElement.tsx` (`set_type`, `_canExtend`, a refusing `set_extends`), a new pure
  `model/classifierKindRules.ts` with its test, and `api/data.ts` (`LinkAllNamesToIDs`).
- **Precondition, in the row.** «Prima della sua Fase 2 va misurato che il caricamento, undo/redo e il replay di
  VersionFixer non passino per i setter guardati».
- **Size.** Full (more than 3 files; a core change, Rule 5), with a Phase 1 first.
- **RC-26.** Not listed. Rule 5's approval rests on R-EDGE-2, ratified in the morning digest (point 1,
  `sessione_2026-09-27.md:20`).
- **Demo.** None directly. The setters sit on every load path, so the merge comes after MODELS.
- **Conflict.** None.

**S24. Saved metamodels may hold the three shapes the canvas now refuses (R-EDGE-3).**
- **Origin.** `docs/log-inbox/views.md:37-41`: «The producer decision is taken at the closure of step C2, no later
  than 2026-10-04.»
- **Options.**
  - A producer in `components/editor-v2/problems/` (critical zone; a new `NodeProblemKind`).
  - A VersionFixer migration (a migration and a deletion of persisted data).
- **RC-26.** Yes, either way.
- **Conflict.** None with E1/E2. It shares `problems/registry.ts` with S16.

### 4.8 Checked and not in the backlog

**Closed [R]:**

| Ticket | Closed by |
|---|---|
| G13, G14; the ε ticket of R3 | `5739b950f` |
| Doubled chevron in dark selects | `50c198da5` |
| `validateProfile` derived-from-off | `6ade65d90` |
| R-SIM-73 wording; Guard `off` in Petri | `7455d0075` and the R-SIM-54/73 amendments |
| Conflict markers in the inbox | `a13e3257c` |
| Cmd+Z on the Mac | verified by Alfonso, `sessione_2026-09-27.md:37` |
| Run controls hidden without Terminal (`claude-code-log.md:483`) | `ENGINE_ROLE_KEYS` has no `simTerminal`, `simRoleStatus.ts:110-113` |
| Control-flow bag with `simInitialMarking` and no `simInitial` | R-SIM-56, «Chiude il ticket di `P-2026-09-25-1805`» |

**Taken by E1 or E2:**
- G6 (`simActivityFinal` read by the engine) and G7 (`else` over fused transitions): E1.
- `simActivityFinal` with no select (`simulation.md:72`): E2's G6 row.
- The Bound as a lower bound (`simulation.md:114`, G12 engine side): E2.
- `else` into a join: Alfonso's «B no», post-MODELS report §7.

**Excluded:** the `.smv` exporter («excluded by mandate», `sessione_2026-09-27.md:86`).

**Outside the simulator:**
- the console error `failed to get project` (`simulation.md:23`);
- JjEL's silent `null` on `self.name.foo`;
- validation without `targetMetamodelId` (R-SIM-33 ticket, «Corsia propria, fuori dalla simulazione»);
- PolymetricView, context menu and the `/editor-v2` route (09-24 entry);
- the stale gitignored step-1 probes;
- the `lane-run` merge template without the `simulation-engine` fast-forward (`harness.md:98`, a harness ticket; see
  risk 7).

### 4.9 Summary table

«E1/E2» names the shared files. «Pre-freeze» follows the rule of §5.

| # | Item | Size | RC-26 | Demo changes | E1/E2 | Lane |
|---|---|---|---|---|---|---|
| S1 | presentation failure surfaced | fast | no | no | E1 `simBridge.test.ts` | `sim-derived-diagnostics` (2a) |
| S2 | derived-absent message | full (with S1) | no | no | E1 `simBridge.test.ts` | `sim-derived-diagnostics` (2a) |
| S3 | R-SIM-74 recursion | full | **yes** (R-SIM-74, R-SIM-43) | no | none | `sim-derived-recursion`: P1 wave 1, P2 wave 3 |
| S4 | outputs and Accepting | full | **yes** when the presets show | after MODELS | E1 + E2 | `sim-outputs-accepting`: P1 wave 1, P2 wave 3 |
| S5 | `off`-key resolver | full | no | no (inferred) | E1 + E2 | `sim-off-resolver` (3) |
| S6 | Kept: Node | fast | no | no | E2 | `sim-summary-fixes` (2b) |
| S7 | stale `simEvent` warning | fast | no | no | E2 | `sim-summary-fixes` (2b) |
| S8 | unreadable-declarations hint | fast | no | no | E2 | `sim-summary-fixes` (2b) |
| S9 | Clear bindings | fast | no (`''` route) | M2 button | E2 | `sim-clear-bindings` (3) |
| S10 | Trigger options | fast | no | no | E2 | in `sim-user-profiles` (3) |
| S11a | compatibility check, pure | fast | no | no | none | `sim-binding-compat` (1) |
| S11b | modal shell | full | no | M2 face | E2 | `sim-modal-shell` (3) |
| S11c | user profiles | full | no | M2 face | E2 | `sim-user-profiles` (3) |
| S12 | table add and prefilled cells | fast | **yes** before MODELS | script §2.3 | E2 | `sim-decl-table` (3) |
| S13 | `∅` glyph | fast | **yes** | yes | E1 | `sim-empty-glyph` (2a, only on Alfonso's yes) |
| S14 | «Marking:» on a state machine | fast | **yes** (R-SIM-82) | yes | E1 (+E2) | only on Alfonso's yes |
| S15 | G3 canvas side | full, critical zone | **yes** | yes | none | `sim-canvas-state`: P1 wave 1, P2 wave 3 |
| S16 | checker gap | full, critical zone | **yes** | no | none | `sim-checker-gap`: P1 wave 1, P2 wave 3 |
| S17 | dead helpers | fast | no | no | E2 | `sim-cleanup` (3, last) |
| S18 | SimModelView | full | no | no | E1 + E2 | `sim-cleanup` (3, last) |
| S19 | rename `stcFromRoles.ts` | fast | no | no | E1 + E2 | `sim-cleanup` (3, last) |
| S20 | stale comments | full by count | no | no | E1 | `sim-comments` (2a) |
| S21 | readiness re-measure | fast | no | no | none | `sim-readiness-3` (2b) |
| S22 | demo script after E1/E2 | fast | **yes** | yes | none | `sim-demo-script-3` (2b) |
| S23 | enum step B | full | no (Rule 5 via R-EDGE-2) | no | none | `enum-step-b`: P1 wave 1, P2 wave 3 |
| S24 | saved-states detector | full, critical zone | **yes** | no | none | after S23 and S16 (3) |

---

## 5. The waves

**Common gates.**
- **Code lanes.** From `frontend/`, each in the foreground (P16):
  - `npm run typecheck` (the 14 of §17);
  - vitest on `src/model/simulation` and `src/components/editor-v2/sim`: the baseline stated before the run, the new
    tests red first, then green;
  - `npm run build` (exit 0);
  - `npm run check:docs` and `npm run check:scripts`;
  - a mutation bench on the new tests.
- **Visual lanes.** A probe on the lane's own port, crops for the chat (RC-23).
- **Discoveries.** `check:docs`, `git status` clean after every probe.
- **Critical-zone Phase 2.** A Layer Impact Report in `docs/lir/` first, and the RC-30 go-ahead.
- **Ports.** 3015 and 3016 are E1's and E2's. New lanes take 3017 and up.

**Pre-freeze rule** (decision 7 in §7). A code merge before 2026-10-01 evening must land before `sim-readiness-3`
runs. That run is the last measurement of the trunk before the freeze. Anything after it waits for 2026-10-04.

### Wave 1: launchable now

The seven lanes are disjoint from E1, from E2 and from each other. None has a visual check (RC-22 shape).

| Lane | Items | Files written | Size | Gates | Pre-freeze merge |
|---|---|---|---|---|---|
| `enum-step-b` | S23, Phase 1: measure load, undo/redo and VersionFixer replay through `set_type` / `_canExtend` (the R-EDGE-2 precondition) | new report, `docs/log-inbox/views.md`, prompt flip | full (Phase 1 of a core change) | discovery gates; probes on 3017 | yes (docs) |
| `sim-binding-compat` | S11a: a pure `bindingVerdicts(profile, bag, sketch)`, unwired | `frontend/src/model/simulation/bindingCompat.ts` (new), `__tests__/bindingCompat.test.ts` (new) | fast | code gates, mutation bench | yes (nothing imports it) |
| `sim-canvas-state` | S15, Phase 1 (R-SIM-33 3c): what a run-state channel into `viewpoint/ir/` needs, candidates and counts; critical-zone files read only | new report, inbox, flip | full (critical zone in Phase 2) | discovery gates | yes (docs) |
| `sim-outputs-accepting` | S4, Phase 1: R-SIM-50/51 in the engine and on both faces, and when to show the four presets; engine files read on `sim-e1-engine` (risk 5) | new report, inbox, flip | full | discovery gates | yes (docs) |
| `sim-checker-gap` | S16, Phase 1: a producer of STC guard and action checks in the problems registry, with C2's probe (4) | new report, inbox, flip | full (critical zone in Phase 2) | discovery gates | yes (docs) |
| `sim-derived-recursion` | S3, Phase 1: a per-(element, attr) graph over frozen M, and the collection form against R-SIM-43 | new report, inbox, flip | full | discovery gates | yes (docs) |
| `sim-modal` | S11b and S11c, Phase 1: the shell, the event, the mount, user profiles and the Step 1 cards; it reads S11a's module if merged | new report, inbox, flip | full | discovery gates | yes (docs) |

**Order when worktrees are short (risk 4):**
1. `enum-step-b`: its S24 decision has a date.
2. `sim-binding-compat`: the only code lane.
3. `sim-canvas-state`: the largest visible gap after MODELS.
4. `sim-outputs-accepting`.
5. `sim-checker-gap`.
6. `sim-derived-recursion`.
7. `sim-modal`.

### Wave 2a: after E1's merge (E2 may still run)

| Lane | Items | Files | Size | Pre-freeze merge |
|---|---|---|---|---|
| `sim-empty-glyph` (only on Alfonso's yes) | S13 | `sim/simBridge.ts`, `sim/__tests__/simBridge.test.ts`; then, in a docs commit, `docs/demo/models_2026_simulator_demo.md` | fast, visual | yes, before `sim-readiness-3` (it is a demo change by design) |
| `sim-derived-diagnostics` | S1, S2 | `model/simulation/derivedEvaluator.ts`, `guardContext.ts`, `actionEvaluator.ts`, `sim/simBridge.ts`; tests `derivedEvaluator.test.ts`, `guardContext.test.ts`, `actionEvaluator.test.ts`, `sim/__tests__/simBridge.test.ts` | full (more than 3 files) | only before `sim-readiness-3`; otherwise after 2026-10-04 |
| `sim-comments` | S20 | `model/simulation/netStep.ts`, `netTypes.ts`, `isKindOf.ts`, `guardEvaluator.ts` (comments only) | full by count | yes (comments) |

`sim-empty-glyph` and `sim-derived-diagnostics` share `simBridge.ts` and its test. If Alfonso says yes to the glyph,
it goes first and diagnostics queues behind it, with its merge position fixed (RC-22).

### Wave 2b: after E2's merge

| Lane | Items | Files | Size | Pre-freeze merge |
|---|---|---|---|---|
| `sim-summary-fixes` | S6, S7, S8 | `model/simulation/profileBinder.ts`, `__tests__/profileBinder.test.ts`, `sim/simRoleStatus.ts`, `sim/__tests__/simRoleStatus.test.ts`, `sim/SimulationPanel.tsx` | full (more than 3 files), visual (M2 summary lines) | only before `sim-readiness-3` (off the demo path by construction) |
| `sim-readiness-3` | S21 | new report, inbox, flip; probes `_tmp_demo3_*` gitignored | fast (probe) | yes. It runs after every pre-freeze code merge, as the last one |
| `sim-demo-script-3` | S22 | `docs/demo/models_2026_simulator_demo.md` | fast (docs) | yes, after `sim-readiness-3`, with Alfonso's word on decision H |

### Wave 3: after the wave-2 merges; merges after MODELS (2026-10-04)

**The panel chain, one at a time.** Each lane touches `sim/SimulationPanel.tsx`:
1. `sim-off-resolver` (S5): `simProfiles.ts`, `simBridge.ts`, `SimulationPanel.tsx`, `simProfiles.test.ts`,
   `simBridge.test.ts`. Full. It goes first because it closes the stale-key risk that E1 makes live.
2. `sim-clear-bindings` (S9): `simRoleStatus.ts`, `simRoleStatus.test.ts`, `SimulationPanel.tsx`. Fast; a probe of
   `undefined` first.
3. `sim-decl-table` (S12): `SimulationPanel.tsx`, perhaps `simulation-panel.scss`. Fast, visual.
4. `sim-modal-shell` (S11b), then `sim-user-profiles` (S11c with S10). Full, visual.
5. `sim-outputs-accepting` Phase 2 (S4). Full, visual. The four presets are shown only on Alfonso's word.
6. `sim-cleanup` (S17, S18, S19) last. Full.

**Beside the chain, disjoint from it and from each other:**
- `sim-canvas-state` Phase 2 (critical zone, Alfonso);
- `sim-checker-gap` Phase 2 (critical zone, Alfonso), then S24's producer, which shares `problems/registry.ts`;
- `enum-step-b` Phase 2, if its Phase 1 clears the load paths;
- `sim-derived-recursion` Phase 2 (Alfonso). It shares `derivedEvaluator.ts` with `sim-derived-diagnostics`, so it
  comes after that merge.
- S14 only on Alfonso's yes. It shares `simBridge.ts` with `sim-off-resolver`, so it queues.

---

## 6. Risks

1. **E2's DOVE swaps two paths (H5).** Rule 15 («A cited path that doesn't exist → STOP») may stop E2 as `blocked`,
   or it proceeds under RC-10 and says so. Either way the chat should expect it.
2. **E2 may reach an E1 file.** The exploration reuses the firing rule. The post-MODELS report says «`fireMarking` is
   private today, so it is exported or its 6 lines are repeated», and `fireMarking` is a private function in
   `netStep.ts:125`. E2's prompt stops on any E1 file, so expect six repeated lines or a `question`.
3. **`docs/decisions.md` is not a union file.** E1 and E2 both append R- rows, and so will later code lanes. The
   second merge conflicts textually unless the merge lane resolves it. The inbox is a union file (checkpoint `_4`,
   «an inbox conflict launches»).
4. **Worktrees.** `git worktree list` [M]:
   - `~/jjodel-icons` is E1's, `~/jjodel-open` E2's;
   - `~/jjodel-gate` is on `harness-p16-merge-rules`, `~/jjodel-trace` on `harness-trace`;
   - `~/jjodel` is `validation-skeleton`, `~/jjodel-release` the trunk.
   Only `~/jjodel-sim` frees at the end of this lane. Wave 1 needs temporary worktrees (P14, with the `node_modules`
   symlink) or runs in the order of §5.
5. **Stale reads.** `sim-outputs-accepting` and `sim-derived-recursion` read engine files that E1 changes. Until E1
   merges they must read `sim-e1-engine`'s tip (`git show`), or they cite lines that will move.
6. **Readiness-2 stops holding when E2 merges.** It quotes `Bound → 2` and step 3 (script `:134`). Its own risk 7
   asks for a re-run after any `SimulationPanel.tsx` change. Between E2's merge and `sim-readiness-3`, the script
   describes a trunk that no longer exists.
7. **The merge-into-trunk template has no `simulation-engine` fast-forward** (`harness.md:98`, ticket (2)). Every
   wave merge adds it by hand. Otherwise the next wave branches from a stale `simulation-engine`.
8. **The panel serialises wave 3.** Seven of its lanes share `SimulationPanel.tsx` (1218 lines [M]). After MODELS the
   real parallelism is one panel lane plus four disjoint lanes (canvas, checker, enum, recursion).
9. **Ratification markers.** `decisions.md:2031-2095` keep `provisional, unattended` on R-SIM-73..79 and R-EDGE-1..3.
   The checkpoint records them ratified in the morning digest (point 1). This report treats them as ratified (the
   worse option), so S3 goes to Alfonso.
10. **S11a's rule table is a design.** Which binding is `warn` and which `incompatible` is not written anywhere. The
    lane derives it from `roleCatalog` (`kind`, `dependsOn`) and the binder's rules, and lists it in its commit body.
    A `question` stop is possible.

---

## 7. Decisions taken (unattended)

1. **Wave 2 splits into 2a (after E1) and 2b (after E2).** E1 has both code commits and frees its files first. S1,
   S2, S13 and S20 need only E1's files.
2. **Bundles:**
   - S1 and S2: the same files, both C2 tickets.
   - S6, S7 and S8: all three are `profileSummary` and the M2 summary.
   - S17, S18 and S19: the cleanup, last, since it touches everything.
   - S10 goes into S11c: compatible-only dropdowns, over S11a's module.
3. **No test moved to a new file to fake disjointness.** A wave-1 lane on `simBridge.ts` could have put its tests
   beside E1's, in a second file, to pass RC-22 check 1. The fixtures of `simBridge.test.ts` are local, and E1 frees
   the file soon, so those lanes wait for 2a.
4. **The modal lane's compatibility check comes first, as a pure unwired module (S11a).** It is the only code item
   with no E1 or E2 file, and S10 and S11c need it.
5. **S9 route: write `''`.** Every reader already treats it as unset (quotes in §4.2), so no core change is needed.
   The lane measures `undefined` first, because two measurements disagree.
6. **The enum lane is `enum-step-b`, not `sim-…`.** It touches no simulator file, merges into the trunk, and its inbox
   is `views.md`. RC-22's prefix is for simulator lanes.
7. **Pre-freeze rule.** A code merge before 2026-10-01 evening must precede `sim-readiness-3`, so the last
   measurement covers it.
8. **E1's and E2's sets.** E1's is its actual diff. E2's is its DOVE, with the two paths corrected and `events.test.ts`
   counted as a possible E2 file (the tests of `stcFromRoles`).
9. **S5 opens wave 3's panel chain,** ahead of Clear bindings: it closes the risk that E1 makes live.
10. **Items outside the simulator stay out** (§4.8), except S23 and S24, which the prompt names.

---

## 8. Decisions awaiting Alfonso (RC-26)

- **A. The `∅` glyph (S13).** Keep it, or write the empty side as a word before the freeze? It is a perceptual
  judgement on what the demo shows. Recommended: decide on the 3001 walk. If it is unreadable, run `sim-empty-glyph`
  in wave 2a, before `sim-readiness-3`.
- **B. The script after E2 (S22, decision H).** With E2 merged, Apply proposes `Bound → 4`, and step 3 plus its «Say»
  are wrong. Recommended: if E2 lands before the freeze, drop step 3 and say «Apply proposes 4». Otherwise the script
  stays as it is.
- **C. R-SIM-74 and R-SIM-43 (S3).** Accept a well-founded recursion, with a graph per (element, attr) over frozen M,
  and for the collection form a collection-valued `.[x]`. Recommended: Phase 1 now, no amendment before MODELS.
- **D. G3's canvas side (S15).** It amends R-SIM-4, touches the critical zone and changes the demo. Recommended:
  Phase 1 now, Phase 2 after MODELS.
- **E. The checker gap (S16).** A producer in `problems/`, in the critical zone. Recommended: Phase 1 now, Phase 2
  after MODELS.
- **F. «Marking:» or «State:» on a state machine (S14, R-SIM-82).** Recommended: keep «Marking:» for MODELS, which the
  script quotes, and revisit after.
- **G. The saved-states detector (S24, R-EDGE-3, by 2026-10-04).** A producer (critical zone) or a migration (a
  migration and a deletion of persisted data). Recommended: the producer, built after `enum-step-b`'s Phase 1 and
  after MODELS.
- **H. The four hidden presets (S4, A2).** Recommended: keep them hidden until the outputs and Accepting engine is
  merged, and show them in S4's Phase 2, after MODELS.

---

## 9. Questions for the chat

1. Can the chat create temporary worktrees for wave 1 (P14), or should wave 1 run in the order of §5 in `~/jjodel-sim`
   alone?
2. Should `sim-readiness-3` wait for `sim-summary-fixes` and `sim-derived-diagnostics`, or run as soon as E2 merges
   and leave those two for after MODELS?
3. Is `sim-modal`'s Phase 1 wanted now, or does the profiles report §4 suffice until MODELS?

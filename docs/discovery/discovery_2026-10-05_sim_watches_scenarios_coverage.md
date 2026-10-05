# Discovery: watches, step back, scenarios and coverage in the simulator (R-SIM-137..140)

Prompt-ID: P-2026-10-05-1655 · prompt `docs/prompts/claude_2026-10-05_1655_prompt_discovery_sim_watches_scenarios_coverage.md` · chat C-2026-10-05-1110 · session `79af1684-ff0b-41a6-87c2-59c96179d64e` · tree `~/jjodel-w-simverif`, branch `sim-verif`, read on HEAD `d48373101`; probe committed in `8511a9c16` · executor Claude Opus 5.5 (`claude-opus-5-5`). This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files. [M] = measured in this phase by the probe `frontend/scripts/probe/sim-verif-bench.ts` on the four demo scenes (node, no port; canonical run 35 PASS, 0 FAIL, `EXIT=0`). [R] = read.

## 0. Answer in brief

**Answer.** All four rows fit the simulator's own files. They need no critical-zone file, no core change, no VersionFixer step, no new dependency, and no exported interface outside `sim/` and `model/simulation/`.
- **Watches.** A watch cannot use the guard oracle, which needs a transition as `self` (`guardContext.ts:165-166`). The board's output path fits as it is: `compileOutput`/`evaluateOutput` (`boardOutputs.ts:98-137, 207-229`) with `self` the model root and `event` null, plus a boolean check. Measured [M]:
  - `X.[marked]` reads under State machine with no state attributes.
  - `model.[x]` and `self.[x]` both read the global.
  - `node.[x]`, `event` and undeclared names are refused before Reset. `1 + 1` is caught at evaluation as non-boolean.
  - Cost: 1.6-2.1 µs per evaluation and 6-11 µs per compile.
  - Play under Random stopped by a breakpoint stops at the same step for the same seed, 5/5 seeds.
- **Step back.** The trace already keeps what a pop needs, so **no stack is added**. Popping (trace, kept list, `configAt(m-1)`, halt) gives back the record of one step earlier [M]:
  - 30/30 steps of the four paths, and 6/6 past the 1000 cap.
  - Terminated, Deadlock and Halted all return to Running.
  - The worst pop, with nothing kept, replays 1004 steps in 3.3-7.3 ms.
  - Memory: 285-1038 B per kept configuration and 76-107 B per trace entry, so about 1 MB per model at the cap.
- **Scenarios.** A scenario is the trace projected to its inputs (`event`, `selector`, `kind`, `inputs?`), with ids, so renames keep it [M on PEST]. Size is about 100 B per step. Replay from Reset through `pressInput` reproduces the trace on 4/4 scenes in 0.4-1.1 ms. Two tamperings are caught as divergence.
- **Coverage.** Counts taken from each fired step's label equal counts recomputed from the trace (4/4) [M]. On the ESM path `off` is never visited and `ts` never fires. The node overlay can show them. Edges drawn by derived views (`irobj_<id>`) have no overlay today; their `<g>` carries `data-id` (xyflow 12.10.2).
- **Keys.** `simWatches` and `simScenarios` move `runSignature`. `runWatches`, `runScenarios`, `watches` and `scenarios` do not [M]. So saving a scenario mid-run with a `sim*` key would interrupt that run.

**Recommendation.** Three Phase 2 lanes (§6), in R-SIM-141's order: **1 `sim-watches`**, then **2 `sim-back-scenarios`**, then **3 `sim-coverage`**. Lane 3's files are disjoint from the other two, but it is visual, so RC-22's shape (one visual lane at a time) queues it. Its pure store can run beside Lane 1.

**Decisions taken (unattended, RC-25):** 12, listed in §8.1. The most consequential three:
1. The keys `runWatches` and `runScenarios` in the M1 bag.
2. The watch stop comes after the press in `playPress`, level-triggered, and also switches the clocks off.
3. Step back is a pop primitive `simStepBack` that does not rewind `draws`.

**Decisions awaiting Alfonso (RC-26):** none.

**Questions** (§8.3, each answerable as recommended):
1. Breakpoint semantics. Recommended: level-triggered, checked after every committed step, never on the configuration Play starts from.
2. Coverage on edges. Recommended: nodes only in Lane 3, edges in a later measured slice through the canvas layer.
3. `draws` on a step back. Recommended: keep it, so a retaken Random choice may differ (R-SIM-138), as measured at 100/200.

---

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | A watch can be evaluated with the guard machinery after a step. | **Partly [R][M].** Not with the guard oracle: `buildGuardContext` returns `null` without a transition handle as `self` (`guardContext.ts:165-166`). Yes with the global-DEFINE context the board's outputs use (`boardOutputs.ts:211-212`), on `run.snapshot` (`simRunState.ts:111`, set by `startRun`, `simBridge.ts:652`); measured on 15 watches over the four paths. |
| H2 | Step back needs a new stack of configurations. | **Falsified [M].** `keptConfigs` (`simRunState.ts:106`) and `configAt` (`:315-331`) already rebuild step m-1; a pop equals the record one step earlier 30/30, and 6/6 past the cap in every reading. Only the kept list itself is one shorter past the cap (1/6 equal), a cache `configAt` refills by replay. |
| H3 | Watches and scenarios can live under a `sim*` key like the declarations. | **Falsified [M].** `modelRunBag` copies every `sim*` key of the model bag (`simBridge.ts:189`) into `runSignature` (`:692-693`); `simWatches` and `simScenarios` moved it on 4/4 scenes, so recording a scenario during a run would interrupt that run (R-SIM-34). |
| H4 | A scenario recorded by element names survives renames. | **Falsified by construction [R], the id form holds [M].** The trace records ids (`SimTraceStep`, `simRunState.ts:65-73`); with every PEST event renamed (labels `coinRenamed`, `pushRenamed`, `stopRenamed`) the id-keyed scenario replayed. |
| H5 | Coverage needs the step function to report visits. | **Falsified [M].** The label of a fired step carries `selector` and `produced` (`netStep.ts:328-332`); visits and firings from it equal those recomputed from the trace and the net, 4/4 scenes. |
| H6 | The canvas can mark transitions only where they are nodes. | **Partly [R].** The overlay is mounted by `ObjectNode` only (`ObjectNode.tsx:999, 1238, 1438`); `command grep -rln -i -E 'simRunState\|sim-active\|simulation' frontend/src/components/editor-v2/edges` exits 1 (control: `export` found in `UnifiedEdge.tsx` through the same tool). An edge drawn for an object is `irobj_<objectId>` (`irEdgeViews.ts:327`) and its `<g>` has `data-id` (`@xyflow/react` 12.10.2, `dist/esm/index.mjs:2920`), so a stylesheet could reach it without touching the edges array. On the four demo scenes every transition origin is a `DObject` drawn as a node in the default view [M: `originKinds: ["DObject"]`]. |
| H7 | A Random Play stopped by a watch is not reproducible. | **Falsified [M].** Petri, breakpoint `p3.[marked]`, seeds 1-5, two runs each: same stop step and trace each time. |

## Files read

**`frontend/src/components/editor-v2/sim/`:** `simRunState.ts` (all), `simBridge.ts` (all), `SimulationPanel.tsx` (1-140, 287-1250), `SimInspector.tsx` (1-60, 150-403), `SimCanvasLayer.tsx` (all), `SimNodeRunState.tsx` (all), `simCanvasState.ts` (all), `simViewerPrefs.ts` (all), `SimDataModal.tsx` (all), `simBoardFace.ts` (1-80, 300-360), `simBoardClock.ts` (1-80, grep 108-232), `simBoardSound.ts` (all), `simBoardDevices.tsx` (grep), `simHideEvents.ts` (1-80), `simulation-panel.scss` (50-75, 368-405).

**`frontend/src/model/simulation/`:** `netTypes.ts` (all), `netStep.ts` (all), `guardEvaluator.ts` (all), `guardContext.ts` (all), `boardOutputs.ts` (all), `stateAttributesCodec.ts` (1-120, exports), `boardCodec.ts` (1-140), `derivedEvaluator.ts` (grep).

**Other code:** `components/editor-v2/EditorV2.tsx` (1540-1600, grep), `components/editor-v2/nodes/ObjectNode.tsx` (grep), `components/editor-v2/edges/UnifiedEdge.tsx` (186-200, grep), `components/editor-v2/viewpoint/ir/irEdgeViews.ts` (grep 327), `joiner/classes.ts` (2356-2403), `pages/components/Project.tsx` (170-180), `redux/VersionFixer.tsx` (grep `_state`), `components/project/ProjectEditor.tsx` (grep), `node_modules/@xyflow/react/dist/esm/index.mjs` (2910-2925), `node_modules/bootstrap-icons/font/bootstrap-icons.json` (names).

**Docs:** `CLAUDE.md`; `docs/PROTOCOL.md` P1-P6, P10-P12, P16; `docs/decisions.md` RC-20..39, R-SIM-1..15, R-SIM-57..63, R-SIM-88, R-SIM-94..141; `docs/spec/claude_spec_2026-09-13_computational_model.md` (all); `docs/discovery/discovery_2026-10-03_sim_io_board.md` (1-136, 275-293); `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (grep); `docs/demo/models_2026_simulator_demo.md` (grep); `docs/log-inbox/simulation.md` (1-60); the gitignored bench `~/jjodel-w-simstate/frontend/scripts/smoke/_tmp_simstate_{load,bench}.ts` (read only, the model of this probe).

## The probe [M]

`frontend/scripts/probe/sim-verif-bench.ts` (`8511a9c16`), run as `npx --no-install tsx --expose-gc scripts/probe/sim-verif-bench.ts` from `frontend/`. Log: `frontend/scripts/smoke/_tmp_sim-verif-bench.log` (gitignored).

- **What it runs.** The fixtures `scripts/probe/fixtures/scene_*.jjodel` were compared with `cmp`: byte-equal to `~/jjodel-demo-exports/`. Each scene gets its preset as the panel's Apply writes it, and the script's globals for ESM and Flow B. Then the script's path runs through `startRun`/`pressInput`.
- **The one part that is not the app's.** The JjEL record is a stand-in of `buildEvalContext` (the pool, unique names bound), as in the 2026-10-02 bench.
- **Positive controls.** A Last step line of the demo script, word for word, per scene:
  - PEST step 2: `coin: t1 (locked → unlocked) fired`;
  - Petri step 4: `ε: t1 (p1 → p2 ×2) fired`, Deadlock at `p2 ×2, p3`;
  - ESM step 10: `coin: tc (locked → locked) halted the run`;
  - Flow B step 2: `ε: f2 (work → d1) fired`.
- **Runs.** Run 1 had one FAIL, «pop past the cap». It compared the kept list too, which a pop at the cap leaves one shorter. The check was split into every reading (6/6) and the kept list alone (1/6, reported). Runs 1 and 2 wrote their logs to `/tmp`, outside the worktree; those files were deleted, and the canonical run (the fourth) writes inside the tree.
- **Not exercised.** Input variables: no demo scene declares one. The ESM rename did not change its event labels: the identifier slot renamed is not where ESM's labels come from, so the rename evidence is PEST's.

## 1. Watch evaluation (Q1)

**Where guards are evaluated [R].**
- `candidates` evaluates each structurally enabled transition's guard on the configuration it is given (`netStep.ts:191-219`), through the run's oracle `makeGuardOracle` (`simBridge.ts:306-319`).
- That oracle binds `self` to the site's handle: `const self = snapshot.handleById.get(site.transitionId); if (self === undefined) return null;` (`guardContext.ts:165-166`). A watch has no site, so it cannot go through this oracle.

**Where a watch can be evaluated [R][M].**
- The board's outputs already evaluate a σ-only expression "as a global DEFINE": `const ctx = snapshot.base.child({ self: snapshot.model, event: null, model: snapshot.model }); ctx.stateAccess = toJjelStateAccess(stateAccess(state, net.modelId), net.places);` (`boardOutputs.ts:211-212`).
- The checks `compileOutput` applies are the ones R-SIM-137 asks for:
  - parse;
  - the subset checker with E-NODE (`:106-110`);
  - `event` (`:118`);
  - an input (`:122-124`);
  - a presentation name (`:125-127`);
  - undeclared (`:128-130`);
  - with the run's snapshot, R2 on the element left of `.[x]` (`:132-135`).
- A non-boolean value is not a compile defect: `evaluateOutput` accepts any `SimValue`. The watch adds the boolean check, as the LED face does (`simBoardFace.ts:353-355`).

Measured, values per configuration (T, F, D = defect) along each path, step 0 first:

| Scene | Watch | Before Reset | At run | Values | First hit |
|---|---|---|---|---|---|
| PEST (State machine, no attributes) | inv `locked.[marked] or unlocked.[marked] or off.[marked]` | ok | ok | TTTTTTTTTTT | none |
| PEST | bp `unlocked.[marked]` | ok | ok | FFTTFTFFTFF | 2 |
| PEST | inv `node.[shade] == 1` | `node: reads node` | same | D… | — |
| PEST | inv `model.[coins] <= 3` | `undeclared 'coins'` | same | D… | — |
| PEST | inv `1 + 1` | ok | `non-boolean: number` | D… | — |
| PEST | bp `event == null` | `event: reads event` | same | D… | — |
| Petri | inv `p2.[tokens] < 2` | ok | ok | TFFTF | 1 |
| Petri | bp `p3.[marked]` | ok | ok | FFFTT | 3 |
| ESM | inv `model.[coins] <= 2` | ok | ok | TTTTTTTTTFF | 9 |
| ESM | bp `model.[paid]` (a DEFINE) | ok | ok | FFFFTFFFTTT | 4 |
| ESM | inv `self.[coins] == model.[coins]` | ok | ok | all T | none |
| Flow B | inv `model.[count] <= 1` | ok | ok | TTTTFFF | 4 |
| Flow B | bp `left.[marked] and right.[marked]` | ok | ok | FFFFFTF | 5 |

`self` in a watch is the model root, as in an output. So `self.[x]` and `model.[x]` read the same global [M, ESM]. Cost: 1.63-2.08 µs per evaluation and 6-11 µs per compile [M]. The press itself costs about 120 µs (board report §0).

**How Play stops today [R].**
- `playTick` reads, in order (`simBridge.ts:1439-1449`):
  1. no run;
  2. `Terminated`, `Deadlock` or `Halted`;
  3. `steps >= policy.k`;
  4. an ε press that asks an input;
  5. no ε candidate;
  6. two or more candidates under Ask.
- `playPress` presses with `pressStep` (`:1469-1479`), which draws under Random (`:1419-1423`).
- The panel's timer effect reads the result, sets `playing` to null and writes the note (`SimulationPanel.tsx:692-708`, `playStopLine` at `simBridge.ts:1482-1493`).

**Where a watch stop plugs in (recommended).**
- **In Play.** In `playPress`, right after its press committed a step: evaluate the watches on the new live configuration, and on a hit return `stop: 'watch'`, a new `PlayStop` literal (`:1426`).
- **Why not at the start of the next tick.** Checking there would leave 500 ms for a clock tick (R-SIM-135) to move past the breakpoint. Checking after the press also means Play never stops on the configuration it was started from: each Play press makes at least one step.
- **Under Random.** It is the same check after the drawn step. The probe's loop ran the same order (`playTick`, `pressStep`, check): 5/5 seeds stop at the same step on a second run [M]. The stop is therefore reproducible from the seed and the trace.
- **Other sources.** Hand presses, the board and clock ticks all reach the panel through `show` (`SimulationPanel.tsx:635-650`, called from `fire` `:660-673`, Play `:698`, clocks `:802-809`, the input dialog `:1069`). `show` is where the panel computes the hits for its line.
- **A hit outside Play.** A hand step is reported and never refused (R-SIM-137). The clocks are switched off with a new `ClockOff` literal `'watch'` (`simBoardClock.ts:51`). Otherwise a clock moves the run past a breakpoint the user has just been shown. This amends provisional R-SIM-122(5).

**The panel's line.** One row above the buttons, in the halt line's form (`SimulationPanel.tsx:1085`), shown only when the live configuration has a hit:
- `Invariant coinsBelow3 false at step 9 · coin: tc (locked → locked) fired`;
- `Breakpoint paid at step 4 · …`.

The first hit is named, in declaration order; with more than one, the line ends `and n more` and the title lists them all. It names the watch, the step and the firing (R-SIM-137). The panel grows upward and the buttons do not move (R-SIM-65, R-SIM-66).

## 2. Watch storage and editing (Q2)

**Today's per-model records [R].**
- `simStateAttributes` in the M1 bag, `{"v":1,"attrs":[…]}`, fixed field order, decoding tolerant record by record (`stateAttributesCodec.ts:5-26, 40, 81-89`).
- `ioBoard` in the M1 bag, deliberately not a `sim*` key (`boardCodec.ts:15-18, 66`).

**The write path.**
- `set_state` merges like a patch. A value `===` the old one is skipped (`joiner/classes.ts:2390`). One `TRANSACTION` holds the `+=` and `-=` (`:2398-2400`), so a write is one undo step.
- The State dialog writes in one assignment (`SimDataModal.tsx:101-106`).

**Key, recommended.** `runWatches` [M: it leaves `runSignature` on 4/4 scenes]. The value is one JSON string, `{"v":1,"watches":[{"name","kind","text"}…]}`:
- fields in that order;
- `kind` is `invariant` or `breakpoint`;
- decoding tolerant record by record, with these defects: not JSON, no `v` or `watches`, a name missing or used twice, a kind unknown, a text that is not a string;
- the empty list is written as `[]`, never a removed key (the undo-of-a-removed-key ticket, R-SIM-99).
- Alternative, not recommended: `simWatches` plus an exception in `modelRunBag`. That is the alternative the board rejected (board report §2).

**Round trip [R], to re-measure in the Phase 2 probe.**
- The four exports carry an empty model bag [M: `model bag keys in the export []` ×4]. With no key, nothing reads it or writes it, so the bytes are identical by construction.
- For a non-`sim*` string key in the M1 bag, the board discovery measured save, the `.jjodel` text, import with every id renewed by `U.replaceAll` (`Project.tsx:177`) and the reopen (board report §2, H3). The same mechanics apply to `runWatches`.
- No VersionFixer step: its only `_state` line seeds `{}` (`VersionFixer.tsx:1249`).

**Where watches are edited.**
- The State page of R-SIM-102 is the model's «State…» dialog (`SimDataModal.tsx`). Its entry is absent under profiles without state attributes: `{!modelDataOff && (<button …>State…`, `SimulationPanel.tsx:964-976`. That is exactly where `X.[marked]` watches matter (PEST, Petri).
- **Recommended:** a dialog of their own, `SimWatchesModal.tsx`. It is portaled and reuses `SimRolesModal.scss`, as `SimDataModal` does. It opens from an icon in the run inspector's header, which exists before Reset and under every profile (`SimInspector.tsx:264-273`). Apply writes `runWatches` in one `state` assignment: one undo step, no interruption.
- The inspector gains a section listing each watch's value on the step shown. The section is present only when the model has watches, so the demo scenes keep the inspector they have. The trace rows mark the steps where a watch hit.

**Defects [R].** They are shown on the watch and never join `compileDefects` or the Reset line, as R-SIM-117 does for board bindings.
- In the dialog: compiled without a snapshot (parse, E-NODE, `event`, input, presentation, undeclared).
- In the inspector: with the run's snapshot, which adds R2 `unresolved`, evaluation errors and non-boolean values.

**Naming.** The panel already has a «Watch» section, the pinned attributes of R-SIM-104 (`SimulationPanel.tsx:1086-1103`; `watchRows`, `SimWatchRow`, `simBridge.ts:899-952`). So the UI never says "watch" for these. It says «Invariants and breakpoints», «Invariant …», «Breakpoint …». Renaming R-SIM-104's label would amend a row Alfonso ratified (RC-26), and it is not needed.

## 3. Step back (Q3)

**What the run keeps [R].**
- `trace` holds per step `event`, `selector`, `kind`, `origin?` and `inputs?` (`simRunState.ts:65-73`).
- `keptConfigs` holds the configuration after each of the last `SIM_KEEP_CONFIGS = 1000` steps (`:106, 129`), appended by `traced` (`:341-355`).
- `configAt(run, n)` answers from the kept list, from `net.initial`, or by replay over the recorded selectors and inputs (`:315-331`).
- `halt` is set by a halted step (`:375-378`).
- `draws` is the index of the next draw (`:98-99`).
- The selector state of the panel (an open list, an open input dialog) is panel state, not run state (`SimulationPanel.tsx:303-304`).

**The pop [M].**
- `config = configAt(run, m-1)`, `trace` and `keptConfigs` without their last entry, `halt` cleared when the popped step was `halted`.
- It equals the record of one step earlier in every reading: configuration, halt, trace, status, the candidates of ε and of every event, `configAt` for every n, the panel's ε gate.
  - 10/10 PEST, 4/4 Petri, 10/10 ESM, 6/6 Flow B.
  - 6/6 at steps 1000..1005 past the cap.
- Status after one pop: Terminated → Running (PEST, Flow B), Deadlock → Running (Petri), Halted → Running (ESM). This is R-SIM-138's «at Running whatever the status after it was».
- Pressing the same input again gives the popped record back, 4/4.
- **No stack is added.** `simReset` already calls itself «later the restore primitive of step-back, spec §9.4» (`simRunState.ts:272`). A primitive of its own is still recommended, `simStepBack(modelId)`. It drops a viewed step, bumps `'mark'` once, and is a no-op at step 0. It stays apart from `simReset` so that Reset-time counting (coverage, §5) never fires on a step back.

**Bound [M].**
- Per step: kept configuration 285 B (PEST), 411 B (Petri), 1038 B (ESM), 542 B (Flow B); trace entry 76-107 B (median of 3, N = 1000).
- At the cap that is at most about 1 MB per model.
- These figures are 3-10 times the 71-109 B of the 2026-10-02 bench. The method here drops every run record and counts what the kept lists alone retain; the difference is not reconciled.
- The step back itself needs no bound. A pop beyond the kept window replays: the worst case, nothing kept, is 3.3-7.3 ms for 1004 steps [M]. **Recommended: unbounded, back to step 0.**

**Random [M].**
- Petri, 200 seeds, a drawn first step, popped, then Step again.
- With `draws` rewound, the same transition comes back 200/200. With `draws` kept, 100/200 (two candidates).
- R-SIM-138 says a retaken choice «may differ», so **`draws` is kept.** Replay does not need the seed (`configAt` replays selectors, `:307-313`), so the trace stays replayable.

**Board outputs and clocks [R].**
- Outputs read `configAt(run, scene.n)` with `n = view ?? live` (`simBoardFace.ts:326`), and the Pulse LED reads `pulseLit(trace, n)` (`:342`). After a pop both show step m-1 with no change.
- The Buzzer sounds on a live rising edge (`simBoardSound.ts:81-92`), so a backward step could sound. The card should pass `muted` on a step that went back (`simBoardDevices.tsx:568`): `observe` still moves its edge (`:91`).
- Clocks:
  - `check` detects Reset by `run.net !== net` (`simBoardClock.ts:144`). A pop keeps the net, so a running clock keeps ticking, which is not rewound (R-SIM-138).
  - A clock that went off at Terminated, Deadlock or Halted stays off: `arm` re-arms only on a new net (`:227-232`).
  - A hand action leaves clocks as they are (R-SIM-122(5)).

**The button.** The transport row is `gap: 8px` and the buttons are 28 px (`simulation-panel.scss:372-386`): four take 136 px and five take 172 px of a 288 px panel. **Recommended:**
- placed between Reset and Step: `Reset | Step back | Step | Play | Stop`;
- glyph `bi-skip-start-fill`, which is installed;
- title «Step back»;
- enabled while the trace is not empty.

It stops Play (a hand press does, R-SIM-101), closes an open list or input dialog as Reset does (`SimulationPanel.tsx:561-571`), returns a viewed step to live, and rewrites the status line from the new last trace entry, worded as the inspector's `stepText` (`SimInspector.tsx:293-297`). Step's top does not move (same row).

## 4. Scenarios (Q4)

**What an input is in the trace [R].**
- `event`: an event instance id, or null for ε.
- `selector`: a transition id, which is the edge's or the Petri transition's object id, a fused fork or join's node id, or `node#edge` (`netTypes.ts:210-211`).
- `inputs`: the IVAR values given, each as `{ element, attr, value }` (`simRunState.ts:71-72`).
- The ε choice is the selector. `origin` says who chose (R-SIM-100).

**Identity across renames.**
- Ids, as the board's bindings settled (R-SIM-117). Measured on PEST: every event renamed, and the scenario replays [M].
- Import renews ids inside the JSON string (board report H3). A `node#edge` selector has both ids replaced.
- An IVAR is named by (element id, attr name): renaming a declaration breaks that step, which is reported as divergence. This is the board's rule.

**Key and codec.**
- **Recommended:** `runScenarios` [M: it leaves `runSignature`]. A `sim*` key would interrupt the run that is being recorded from.
- Value: `{"v":1,"scenarios":[{"name","steps":[{"event","selector","kind","inputs"?}],"expect"?}]}`. `expect` is the optional final condition: a boolean JjEL text, compiled and read like a watch, kept inline so that a scenario handed in by a student is self-contained.
- Decoding is tolerant scenario by scenario.
- Size: 289-981 B for 4-10 steps [M]. **Recommended cap:** 1000 steps per scenario (= `SIM_KEEP_CONFIGS` = `MAX_PLAY_STEPS`). A longer trace is refused with its reason: every save is a project write and an undo entry.

**Replay path.**
- Reset, then for each step the probe's checks, in order:
  1. the run is Running;
  2. the event is still in the model;
  3. the input is enabled (`panelInputs` over `structuralInputs`);
  4. the recorded selector is a candidate, or there is no candidate where none was;
  5. the inputs the step asks (`inputAsks`) are given.
- Then `pressInput(modelId, event, selector, lookup, label, inputs)`, the function the panel's `fire` calls (`SimulationPanel.tsx:671`, `simBridge.ts:1382-1387`), and a check that the committed `kind` is the recorded one.
- [M]: the replays equal the recorded trace and σ, 4/4, in 0.4-1.1 ms including the Reset.
- Divergence [M]:
  - step 2 dropped: caught at step 2, or at step 4 in ESM, as «choice not offered»;
  - a selector never offered at step 1: caught at step 1.
- Final condition [M]: PEST and Petri pass; ESM `model.[coins] <= 2` and Flow B `model.[count] <= 1` fail, as their values say.

**Recommended behaviour.**
- The replay runs synchronously, not at Play's pace.
- Watches are read after each step but do not stop it; the result is pass, fail (the final condition is false) or diverged at n, with the reason.
- A replayed scenario counts like a run for coverage (R-SIM-140), since it commits through the same path.
- Clocks are not armed by a replay's Reset: the panel calls `clocks.arm(() => [])` right after it, so `armed` takes that net (`simBoardClock.ts:227-232`).
- The policy is not read: choices come from the selectors (spec §6).

**The list's place.** In the run inspector:
- a «Save as scenario» icon in the trace section's head (`SimInspector.tsx:374-379`);
- a «Scenarios» section under the trace, with name, steps, the last result, Replay and Delete.

The compact panel, which is the demo path, gains nothing.

## 5. Coverage (Q5)

**Where counts can be gathered [R][M].**
- A fired step's label holds `selector` and `produced`, the postset arcs (`netStep.ts:328-332`).
- Definitions:
  - **visits(place)** = 1 if it is initially marked, plus one for each fired step whose postset holds it. This counts token arrivals and includes self-loops.
  - **firings(transition)** = the fired steps that chose it.
  - Halted, discard and quiescence steps count nothing.
- The same counts recomputed from the trace and the net are equal, 4/4 [M]. So they can be taken without `netStep.ts` (R-SIM-59's rule: no core change).
- Demo paths [M]:

| Scene | Places visited | Transitions fired |
|---|---|---|
| PEST | 3/3 | 5/5 |
| Petri | 4/4 | 3/3 |
| ESM | 2/3 (`off` never visited) | 3/4 (`ts` never fired) |
| Flow B | 6/6 | 5/5 |

**Where they live, recommended.**
- A new `sim/simCoverage.ts`: per `modelId`, outside the run record, because `simReset` replaces that record (`simRunState.ts:277-281`).
- Its own version channel, like `simViewerPrefs.ts:97-104`, never `'mark'`. The `'mark'` version re-renders `ObjectNode` and the IR resolvers (`ObjectNode.tsx:278`, `irResolve.ts:84, 167`, `useIRContainment.ts:122`, `useIRFormView.ts:99`).
- What keeps the counts: Reset, Stop, a model switch, a step back (it does not decrement: coverage is what was exercised). The Clear button empties them. A reload loses them, as it loses viewer preferences.
- **Counting site, recommended:** the canvas layer observes the live run. It is mounted while a run exists, panel open or closed (`SimulationPanel.tsx:811, 830, 1239`), and re-renders on `'mark'` (`SimCanvasLayer.tsx:30`). It counts the trace's growth since its last count, and a new `net` as a Reset. A synchronous replay is counted from its trace in one render. This keeps Lane 3 off `simRunState.ts` and `simBridge.ts`.
- **Alternative:** increment in `simCommit`/`simReset` directly. That is simpler, but it shares `simRunState.ts` with Lane 2.

**Overlay [R].**
- `SimNodeRunState` returns `null` for an element the run does not know (`SimNodeRunState.tsx:56`; `nodeStateOf` `simCanvasState.ts:177`). So it must also read the coverage store for the net's places and transition origins.
- Look: a count chip, and a dashed ring on the never-visited and never-fired. Both are absolutely positioned and `pointer-events: none`, like today's ring, so every box is unchanged.
- The switch: «Coverage» in the canvas layer's controls, next to «Globals» (`SimCanvasLayer.tsx:45-69`). It is off by default, a viewer preference `coverage?` (an optional field, rule 11), with the summary `n/m places · k/l transitions` and «Clear» when on.
- Off state: the switch off, or no run.

**Edges.**
- Only nodes are reachable today [R, H6].
- An edge-object of a derived view is `irobj_<id>` with `data-id` on its `<g>`. A stylesheet from the canvas layer could mark it without touching `EditorV2.tsx` or the edges array.
- The alternative is a `className` on the arrays EditorV2 hands to React Flow, the `hideRunEvents` pattern (`EditorV2.tsx:1554-1563`, `simHideEvents.ts:65-80`). It touches `EditorV2.tsx` and builds a new edges array at every step.
- Neither was tried in this phase.

## 6. Phase 2 split (Q6)

All three lanes are heavy tier with tests first and a mutation bench. Every new identifier was grepped in `frontend/src`, 0 hits each: `runWatches`, `runScenarios`, `simWatches`, `simScenarios`, `simCoverage`, `simStepBack`, `stepBack`, `SimScenario`, `sim-panel__back`, `sim-node-run__cov`, `sim-canvas-layer__coverage`, `compileWatch`, `evaluateWatch`. Control: `sim-panel__hint`, 22 hits. `SimWatch` is taken (6 hits, `SimWatchRow`), so the new types are not named `SimWatch*`.

**Lane 1 `sim-watches`** (visual):
- New:
  - `model/simulation/watchCodec.ts`;
  - `model/simulation/watchEvaluator.ts` (`compileOutput`/`evaluateOutput` plus the boolean check and the hit rule);
  - `sim/SimWatchesModal.tsx`.
- Touched:
  - `sim/simBridge.ts`: `PlayStop` gains `'watch'`, the check in `playPress`, the line text;
  - `sim/SimulationPanel.tsx`: hits in `show`, the line, stopping Play and the clocks;
  - `sim/SimInspector.tsx` and `.scss`: the header icon, the section, the trace marks;
  - `sim/simBoardClock.ts`: `ClockOff` gains `'watch'`, plus `clockOffText`.
- Tests first:
  - `model/simulation/__tests__/watchCodec.test.ts`: byte-identical round trip, absent means no key, `[]`, tolerant decoding;
  - `model/simulation/__tests__/watchEvaluator.test.ts`: `X.[marked]` without attributes, `model`/`self`, `node`/`event`/input/undeclared refused, non-boolean a defect;
  - `sim/__tests__/simBridge.test.ts`: the stop after the press, never on the start configuration, the same seed giving the same stop;
  - `sim/__tests__/simBoardClock.test.ts`: off at a hit.
- More than 5 files, so the prompt lists them (rule 19).

**Lane 2 `sim-back-scenarios`** (visual, after Lane 1: it shares `SimulationPanel.tsx` and `SimInspector.tsx`, and `expect` needs `watchEvaluator`):
- New: `model/simulation/scenarioCodec.ts`; `sim/simScenarios.ts` (record, step check, replay loop over `pressInput`).
- Touched:
  - `sim/simRunState.ts`: `simStepBack`;
  - `sim/SimulationPanel.tsx`: the button, the replay handler;
  - `sim/SimInspector.tsx` and `.scss`: Save as scenario, the Scenarios section;
  - `sim/simBoardDevices.tsx`: the buzzer muted on a backward step.
- Tests first:
  - `sim/__tests__/simRunState.test.ts`: the pop equals the earlier record from each status, past the cap, with nothing kept; draws kept; view back to live; one bump; no-op at 0;
  - `model/simulation/__tests__/scenarioCodec.test.ts`;
  - `sim/__tests__/simScenarios.test.ts`: replay equals the trace; the divergences of §4, the input one included; the final condition; the cap.

**Lane 3 `sim-coverage`** (visual, files disjoint from Lanes 1 and 2):
- New: `sim/simCoverage.ts` with `sim/__tests__/simCoverage.test.ts`: counts from the trace equal counts from the labels; Reset and a pop keep them; Clear; its own channel, not `'mark'`.
- Touched: `sim/SimCanvasLayer.tsx`, `sim/SimNodeRunState.tsx`, `sim/simNodeRunState.scss`, `sim/simViewerPrefs.ts` with `sim/__tests__/simViewerPrefs.test.ts`.

**Parallelism.**
- RC-22's file and interface checks pass for Lane 3 beside either other lane.
- Its shape allows one visual lane at a time, so: Lane 1, then Lane 2, then Lane 3.
- The pure `simCoverage.ts` and its test may run beside Lane 1 as a non-visual lane.

**The four demo scenes, byte-identical (every lane),** with no `runWatches` or `runScenarios` key and coverage off:
- every panel reading of the script (the `trunk_readings` oracle, the 50/50 readings of the R-SIM-130 probe);
- Step's top at 854.5 px and the status line;
- the State dialog;
- the inspector at 400/372 px;
- the canvas layer;
- the four exports open with no key added.

Declared visible additions:
- Lane 1: one icon in the inspector header.
- Lane 2: the Step back button in the transport row (Step moves right, its top does not) and one icon in the trace head.
- Lane 3: one toggle in the canvas layer's controls (the right-aligned controls shift left).

## 7. Risks (Q7)

1. **Critical zone: none.** The plan never needs any of these: `useJjomSync.ts`, `portDistribution.ts`, `handlePosition.ts`, `editor-v2/viewpoint/ir/` (`irEdgeViews.ts` included), `VersionFixer.tsx`, `canvasToJjom.ts`. Coverage on edges, if ever done through the edges array, touches `EditorV2.tsx`: outside the simulator but not in the critical zone. Stop and report if a lane finds otherwise.
2. **Propagation through `'mark'` (rule 20).** A step back bumps `'mark'` as any fired step does. `isSimActive` and `getSimPresentation` then read the restored configuration, so IR views reading `marked` or `node.[x]` (R-SIM-108) follow it, through the existing path with no new code there. The coverage store must not use `'mark'`.
3. **Exported interfaces.** None outside the simulator. Inside it:
   - `PlayStop` gains `'watch'` (`simBridge.ts:1426`) and `ClockOff` gains `'watch'` (`simBoardClock.ts:51`); their consumers are all in `sim/`;
   - `SimViewerPrefs` gains the optional `coverage?`;
   - `SimRun`, `SimTraceStep` and `SimOrigin` are unchanged.
4. **Persistence.** Each save of watches or scenarios is a project write and one undo step. The scenario cap keeps a 10k-step trace (about 1 MB) out of the bag. `replaceAll` over ids can clobber an id that is a prefix of another; that is inherited, true of every pointer (board report §2).
5. **Collisions.**
   - `runWatches` and `runScenarios` have 0 hits, but the M1 bag is the model's `state` and a user could write the same key.
   - The UI word «Watch» is already R-SIM-104's (§2).
6. **Not measured here.** In the browser: the dialog, the inspector and the canvas layer, save/export/import/reopen with the new keys, and edges. In the engine: input variables in a replay (no demo scene has one). These are for the lanes' probes.

## 8. Decisions and questions

### 8.1 Decisions taken (unattended, RC-25, provisional)

1. **W1.** Key `runWatches` in the M1 bag, `{"v":1,"watches":[{name,kind,text}]}`, fixed order, tolerant, `[]` when empty, no VersionFixer step (§2).
2. **W2.** A watch is compiled and read as a board output (global DEFINE: `self` the model root, `event` null) plus a boolean check. Its defects show on the watch, never in the Reset line (§1, §2).
3. **W3.** Watches are read after every committed step. Play's watch stop goes in `playPress` after its press, level-triggered and identical under Random. A hit switches the clocks off (`'watch'`, amending provisional R-SIM-122(5)). A hand step reports and never refuses (§1).
4. **W4.** UI wording «Invariants and breakpoints», never «watch». A dialog `SimWatchesModal` opened from the inspector header. An inspector section only when watches exist. The hit line above the buttons (§2).
5. **S1.** Step back is a pop primitive `simStepBack` over the kept configurations and `configAt`. No stack, no bound, a no-op at step 0 (§3).
6. **S2.** `draws` is not rewound by a step back (§3).
7. **S3.** The button goes between Reset and Step, `bi-skip-start-fill`, «Step back». It stops Play, leaves the clocks alone, mutes the Buzzer for that change, and returns the view to live (§3).
8. **C1.** Key `runScenarios`. Steps recorded as `{event, selector, kind, inputs?}` by id. An inline `expect`. A cap of 1000 steps (§4).
9. **C2.** Replay is synchronous from Reset through `pressInput`, with the five checks of §4 and a check of the committed kind. Watches do not stop it. Clocks are not armed by it. It counts as a run (§4).
10. **C3.** Scenarios live in the run inspector: Save from the trace head, a Scenarios section (§4).
11. **V1.** Counts per model in `simCoverage.ts`, on their own channel. Visits are token arrivals and firings are fired steps. Reset, Stop and a step back keep them; Clear empties them (§5).
12. **V2.** Overlay on nodes, switched from the canvas layer, off by default; counting by observing the live run from the canvas layer (§5).

### 8.2 Decisions awaiting Alfonso (RC-26)

None. No critical-zone edit and no exported-interface change outside the simulator. No amendment of a row Alfonso ratified: R-SIM-104's «Watch» is kept, and R-SIM-137 itself adds the watch stop to R-SIM-101's list. No deletion. The MODELS demo of 2026-10-04 is past, and R-SIM-141 authorises the merges after the chat's visual check.

### 8.3 Questions

1. Breakpoints: stop whenever true after a step (level), or only when they become true (edge)? Recommended: level, as R-SIM-137 reads, checked after every committed step and never on the configuration Play starts from.
2. Coverage on edges drawn by derived views? Recommended: nodes only in Lane 3; edges in a later slice through a canvas-layer stylesheet on `data-id`, measured.
3. `draws` after a step back? Recommended: kept, so a retaken Random choice may differ (100/200 measured); rewinding would make it a redo (200/200).
4. Where coverage counts? Recommended: by observing the live run from the canvas layer, which keeps Lane 3 disjoint; the alternative is an increment in `simCommit`/`simReset`.
5. Order of the lanes? Recommended: Lane 1, then Lane 2, then Lane 3, with `simCoverage.ts` and its test optionally beside Lane 1 as a non-visual lane.

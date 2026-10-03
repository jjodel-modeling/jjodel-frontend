# Discovery: the simulator's I/O board (R-SIM-110..115)

Prompt-ID: P-2026-10-03-1845 · prompt `docs/prompts/claude_2026-10-03_1845_prompt_sim_io_board_discovery.md` · chat C-2026-10-03-1610 · session `1fbc9ef8-7d10-4283-9bcd-655465a5af64` · tree `~/jjodel-w-ioboard`, branch `sim-io-board`, HEAD `bb20f1a12` · executor Claude Opus 5.5 (`claude-opus-5-5`). This report is a set of hypotheses with evidence, not a reference: whoever uses it re-reads the files. [M] = measured in this phase on `bb20f1a12` by the probe `frontend/scripts/probe/io-board-outputs.ts`, committed in `ba0668d80` (port 3079, headless Chromium, 1600×1000, DemoESM). [R] = read.

## 0. Answer in brief

**Answer.** The board fits the simulator's own files. It needs no critical-zone file, no core change, no VersionFixer step and no new dependency. Measured on DemoESM:
- **Outputs.** Ten outputs evaluate in a mean 5.2 µs per step, 10 µs at most, against 120 µs for the press itself. They are evaluated the way a global DEFINE is: `self` is the model root, `event` is null.
- **`X.[marked]`** compiles and reads under the State machine profile, which has no state attributes. Under that profile `model.[coins]` is flagged `undeclared`.
- **The board record** sits in the M1 bag as one JSON string. It survives save, the `.jjodel` text, import (which renews every id, so the event id inside was remapped to the imported `coin`) and the reopen.
- **The key decides one thing:** a `sim*` key moves `runSignature`, so every board edit would interrupt the run. `ioBoard` does not.

The missing pieces:
- `SimRun` does not carry the frozen snapshot that outputs evaluate on. Re-freezing it costs 14 ms per Reset [M].
- Events carry no runtime parameter. A digit travels as an event instance's slot (`event.digit`) or as an IVAR.
- No `.smv` exporter exists.

**Recommendation: two lanes, sequential, on disjoint files (§8).**
- **Lane 1 `sim-io-board-model`: the model and the editor, nothing visible in the app.** The codec, output compile and evaluation, binding resolution, held inputs, the keypad, editor operations, the `SimRun.snapshot` seam and the editor modal. Checked by tests, a mutation bench and a harness probe.
- **Lane 2 `sim-io-board-skins`: the board and its wiring, visual.** The board card with Variant A and Variant B, the device faces, the skin preference, and the panel wiring: the board button, a slot shared with the inspector, presses through the panel's `fire`, the editor opened from the board.

**Decisions taken (unattended, RC-25; every one in §10).**
1. Key `ioBoard` in the M1 bag (`_state`), value `{"v":1,"devices":[...]}`, one `state` write and one undo step, no VersionFixer bump (§2).
2. Elements are bound by id (event instance, place). An IVAR is bound by (element, name). An output is bound by expression text, with a structured `marked(place)` form for the LED (§3).
3. Outputs are evaluated as a global DEFINE: `SimRun` gains an optional `snapshot` field (§4).
4. The board and the inspector share one card slot: one is open at a time. The board's foot carries the viewed step and «Back to live» (§1).
5. Switch and Slider answer only the presses made by hand while the board is open. Play stops at an input as R-SIM-101 says. An event's choice list opens under Ask and under Random alike (R-SIM-101 A3) (§5).
6. The keypad digit buffer lives in the device, and only Enter is a step. In Events mode each key is bound to an event instance (§6).

**Decisions awaiting Alfonso (RC-26).**
1. The board button in the panel header changes what the MODELS demo shows. Recommended: merge Lane 1 when it is green, since it is demo-neutral, and merge Lane 2 after the demo.

**Questions.**
1. Should Variant B survive a collapsed panel for presenting? Recommended: no in the first cut (§10).

---

## Hypotheses under test

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | The board can mount beside the inspector, both open. | **Falsified [R], derived from a measurement.** The inspector is clamped to 372 px when the rail is open, against 400 px declared (`docs/demo/models_2026_simulator_demo.md` §2.3, measured by P-2026-10-03-0120). So the editor width minus the inset is 1190 px (584 + 372 + 234). The free band runs from x 584 to 956, and it is wholly taken by the inspector. A second card beside it would have 0 px. |
| H2 | A per-model record can ride the M1 bag under a `sim*` key, as `simStateAttributes` does. | **Falsified for this record [M].** `modelRunBag` copies every `sim*` key of the model bag (`simBridge.ts:189`) into `runSignature` (`simBridge.ts:691`). A `simBoard` write moved the signature, and the panel would interrupt the run (`SimulationPanel.tsx:426-446`). `ioBoard` did not move it. |
| H3 | Ids stored inside a JSON-string bag value break on import. | **Falsified [M].** `duplicateProject` renews every id by text replacement over the serialized state (`pages/components/Project.tsx:173-177`). The event id inside `ioBoard` came back as the new `coin`'s id, owned by the imported `demoESM`. |
| H4 | An output can be evaluated with the guard context. | **Partly [R][M].** `buildGuardContext` needs a transition as `self` and returns `null` without one (`guardContext.ts:166`). The derived evaluator's context fits instead: `snapshot.base.child({ self, event: null, model })` with `self` the model root for a global (`derivedEvaluator.ts:555-561`). Measured on it: ten outputs, eleven configurations, all values as the demo script's table. |
| H5 | `X.[marked]` needs state attributes. | **Falsified [M].** `marked` is reserved (`stcChecks.ts:139-142`) and is answered from the marking on a place (`guardContext.ts`, `toJjelStateAccess`). Under State machine, `locked.[marked]`, `unlocked.[marked]` and `off.[marked]` compile and follow the configuration: `[T,F,F]` before `stop`, `[F,F,T]` after it. |
| H6 | The checks the run applies flag every bad output before it is evaluated. | **Partly [M].** `model.[nope]` (undeclared), `node.[shade]` (E-NODE), `event.name` and `model.[coins] + event` (event) are flagged at compile. `tc.[marked]` passes the checks and fails at evaluation with an exception. A device must therefore also flag an evaluation defect. |
| H7 | An event can carry a digit today. | **Partly [R].** A step's input is an event instance id (`simRunState.ts:65`) with no runtime parameter. The instance's slots are in M, and actions bind `event` (`actionEvaluator.ts:235`), so `event.digit` reads the key's digit. An IVAR answered by the device is the other channel (`withInputs`, `simRunState.ts:285-298`). |
| H8 | A `.smv` exporter exists to map outputs to DEFINE. | **Falsified [R].** No code emits `.smv`. The search `command grep -rn 'MODULE main' frontend/src frontend/scripts` exits 1, and so does the search for `exportSmv\|toSmv\|smvExport`. Positive control: `simProfile` has hits through the same tool. The spec places the exporter "between steps 4 and 5" (`docs/spec/claude_spec_2026-09-13_computational_model.md:233-234, 268`). |

## Files read

**Under `frontend/src/components/editor-v2/sim/`:** `SimulationPanel.tsx` (all), `SimInspector.tsx` (all), `SimInspector.scss` (1-80), `simRunState.ts` (all), `simViewerPrefs.ts` (all), `simInputs.ts` (all), `SimInputDialog.tsx` (1-60), `SimCanvasLayer.tsx` (1-60), `simulation-panel.scss` (45-75, grep), `simNodeRunState.scss` (grep), `simBridge.ts` (1-330, 554-735, 1060-1110, 1200-1521), `SimDataModal.tsx` (grep), `simRoleStatus.ts` (grep, 612-627).

**Under `frontend/src/model/simulation/`:** `guardContext.ts`, `guardEvaluator.ts`, `derivedEvaluator.ts` (1-140, 425-470, 500-599), `netStep.ts` (37-102, grep), `netTypes.ts` (27-71), `stcChecks.ts` (130-240), `stateAttributesCodec.ts` (1-60, grep), `actionEvaluator.ts` (grep), `simProfiles.ts` (140-160).

**Other code:** `components/editor-v2/EditorV2.tsx` (grep 113, 543, 4389, 4584), `components/editors/PropertiesWithTreeView.tsx` (grep 636-658), `pages/components/Project.tsx` (139-215), `api/persistance/projects.ts` (124-140, 257-302), `pages/components/Navbar.tsx:1397`, `redux/VersionFixer.tsx` (139-152, grep 1237; read only), `joiner/classes.ts` (2356-2403), `jjscript/executor/commands/eval.ts` (122-140), `jjel/lexer/lexer.ts` (grep).

**Docs:** `docs/decisions.md` (R-SIM-4, 6, 18, 88, 94, 99..115, RC-21..26), `docs/PROTOCOL.md` P16, `docs/demo/models_2026_simulator_demo.md` (1-30, 230-366), `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (1-60), `docs/log-inbox/simulation.md`.

**Delegated read-only searches, their claims re-checked at the cited lines:**
- the bag's persistence path: `set_state`, save, export, import, VersionFixer;
- the `.smv` exporter's status, with the commands and positive controls of H8.

**Fixture:** `frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel`, a byte copy of `~/jjodel-demo-exports/scene_3_DemoESM.jjodel` (`cmp` equal).

**Decoded with `frontend/scripts/smoke/_tmp_ioboard_decode.mjs` (gitignored):** both models of the export carry `_state {}`. The model holds `locked : Initial`, `unlocked : State`, `off : Terminal`, the events `coin`, `push`, `stop`, and the transitions `tc`, `tp`, `tu`, `ts`, as in script §2.3.

## The probe [M]

`frontend/scripts/probe/io-board-outputs.ts` was run with `lane-run probe <worktree> … --port 3079 --id P-2026-10-03-1845`. The final run printed ALL GREEN with `EXIT=0`. Log: `~/.jjodel-lanes/P-2026-10-03-1845/probe-io-board-outputs.log`; it holds three runs, the last one counts. JSON: `frontend/scripts/smoke/_tmp_io-board-outputs.json` (gitignored).

**Setup.** Nothing is clicked. The probe applies the preset as the panel's Apply does (`profileBindings`, `profilePatch`, then `L(mm).state = …`). It declares the script's two globals in the M1 bag, starts the run with `startRun` and installs it with `simReset`. Each step goes through `pressInput`.

**Positive control.** The «Last step» lines of the ten ESM presses match the script word for word, from `push: discarded, tp guard false` to `coin: tc (locked → locked) halted the run`. Step 5 reads `unlocked`, `coins 0`; step 10 reads `coins 3, paid true`.

**First run.** One check was red: `tc.[marked]`, expected flagged at compile. It is caught at evaluation (H6). The check was rewritten to "flagged at compile or at evaluation", and that is the verdict this report records.

**Page errors.** 50 console errors per run, not compared against a baseline. 24 are `Cannot serialize in ecore, found loop` (`LModelElement.tsx:5939`) and 24 are their stack lines; they appear around save.

## 1. Mount point (Q1)

**Where the inspector is mounted today [R].**
- `SimulationPanel` owns `inspectorOpen` (`SimulationPanel.tsx:315`) and resets it on a model change (`:316`).
- Closing the inspector returns the view to live: `closeInspector` calls `simSetView(modelid, null)` (`:729-732`). Collapsing the panel closes it too (`:792`).
- The card is rendered as a sibling of the panel (`:1131-1135`), so it hides with its tab.

**Geometry [R], quoted verbatim.**
- The panel: `left: calc(200px + 16px + 48px + 16px)`, `bottom: 16px` (`simulation-panel.scss:55-56`), `width: 288px` (`:69`).
- The inspector: `left: 584px; bottom: 16px; width: 400px; max-width: calc(100% - 584px - var(--jj-canvas-right-inset, 0px) - 234px)` (`SimInspector.scss:24-31`).
- `--jj-canvas-right-inset` is set on `<body>` by `PropertiesWithTreeView.tsx:655` and only read in `sim/`.
- The canvas layer sits top-right: `top: calc(var(--jj-toolbar-height, 40px) + 16px); right: calc(var(--jj-canvas-right-inset, 0px) + 16px)` (`simNodeRunState.scss:179-182`). The MiniMap sits bottom-right (`EditorV2.tsx:4389`).

**Where the viewer preferences live [R].** The pins of R-SIM-104, with the tags, the globals card and `inspectNode`, are in `simViewerPrefs.ts:30-41`. That is a module singleton per model with its own version channel, outside Redux and never in a bag (`:6-13`). The skin (A or B) and «Show bindings» belong there as two optional fields. The type is exported, and adding optional fields breaks no consumer (rule 11).

**Why the board cannot sit beside the inspector.** H1: there is no room.

| Option | What it needs | Verdict |
|---|---|---|
| (a) One card slot shared with the inspector. The panel header gets a second icon button beside ⤢. Opening the board closes the inspector and the reverse; closing the last one returns to live. The board's foot carries the status block (R-SIM-114) and the viewed step, «Viewing step n · Back to live», through `getSimView` and `simSetView` (`simRunState.ts:392-409`). | panel state beside `inspectorOpen`; the board reads `getSimView` and `configAt` as the inspector does (`SimInspector.tsx:164-168`) | **Recommended.** It keeps the 584/400 geometry already measured. R-SIM-113's «outputs show that step» works from the board's own foot. |
| (b) Board stacked above the inspector, both open | the inspector card measures 442 px (P-2026-10-03-1015); the board needs about 300 px; on a 1000 px viewport this barely fits | Alternative. Lane 2's probe can measure it; it fails on short screens. |
| (c) A dock tab | it hides the canvas (discovery 2026-10-02 H1) | Rejected, for the reason the inspector rejected it. |

**When the panel collapses,** the board closes as the inspector does (`:792`). The choice list and the input dialog of a press render only in the panel's open branch (`SimulationPanel.tsx:937-984`). A board left alive under a collapsed panel would fire presses whose list nobody sees.

## 2. Persistence key (Q2)

**The per-model record today [R].**
- The M1 bag holds one key, `simStateAttributes`. It is written by the State dialog in one assignment, `lmodel.state = modelDataPatch(draft)` (`SimDataModal.tsx:104`; `simBridge.ts:221-223`).
- Its value is a JSON string `{"v":1,"attrs":[...]}` with a fixed field order. Decoding is tolerant record by record (`stateAttributesCodec.ts:1-31, 40, 81-89`).
- `simInputs.ts` holds no persisted record: only the dialog rows and the form of a declaration row (`simInputs.ts:26-114`).

**The write path [R].** `set_state` merges like a patch:
- A value `===` the old one is skipped.
- A key set to `undefined` is removed.
- Everything happens in one `TRANSACTION` with `SetFieldAction(_state, …, '+=')` and `'-='` (`joiner/classes.ts:2356-2403`, the TRANSACTION at 2398-2400). So a board write is one undo step.
- The bag must be JSON-plain: nested objects escape the shallow `+=` copy (R-SIM-2).

**Recommendation.** Key `ioBoard`. Value: the JSON string `{"v":1,"devices":[{id, kind, cell:[col,row], label?, binding, options?}...]}`, fields in a fixed order. An empty board is written as `devices: []`, never by removing the key: the removal-undo ticket noted at `simRoleStatus.ts:278-287` applies to removals.

**Measured [M].**
- **Signature.** A `simBoard` write moved `runSignature` (`simBoardMoves: true`). An `ioBoard` write did not (`ioBoardMoves: false`).
- **No reader yet.** `command grep -rn ioBoard frontend/src` exits 1. Control: `simStateAttributes` has 44 lines.
- **Alternative** (kept, not recommended): `simBoard`, excluded in `modelRunBag`. That adds a "`sim*` except" rule inside the run's signature code.

**Round trip [M].**
- **Save:** `ProjectsApi.save` writes a state that holds `ioBoard` (`savedHasKey: true`).
- **Export:** a `.jjodel` file is that saved DProject, `U.download(`${project.name}.jjodel`, JSON.stringify(buildProjectExportJson(dproject …)))` (`Navbar.tsx:1397`).
- **Import:** `importFromText` goes through `duplicateProject`, which renews ids with `str = U.replaceAll(str, id, Constructors.makeID())` (`Project.tsx:177`). The reopened model carried `ioBoard`. Its event id resolved to the object named `coin` owned by the new `demoESM`, and differed from the source id.
- **Reopen:** loading goes through `SaveManager.load` and `VersionFixer.update`. No migration reads or writes a bag key: VersionFixer's only `_state` lines seed `{}` in 2.228→2.229 (`VersionFixer.tsx:1237`, last migration).
- **No version bump is needed.** A bump would also regenerate every untouched default view (`VersionFixer.tsx:141-151`).

**Old projects [R][M].** A project without the key opens unchanged: nothing reads `ioBoard`. DemoESM, decoded in this phase, carries `_state {}` on both models [M]; for the other three exports R-SIM-94 records «the four demo exports carry an empty model bag» [R], not re-decoded here. A model generated by a transformation has its M1 `_state` replaced (`ProjectEditor.tsx:1724-1730`, per the delegated read) and loses a board, as it loses its declarations.

**An inherited risk, not the board's.** `replaceAll` over ids in sequence can clobber an id that is a prefix of another (`…_USER_5` against `…_USER_57`). That holds equally for every pointer in a project.

## 3. Binding resolution (Q3)

**What carries an identity [R].**
- **Event instances:** DObject ids. The run's alphabet is a list of ids (`simRunState.ts:87`; `eventAlphabet`, `netCompile.ts:645`).
- **Places:** ids (`run.net.places`).
- **Declarations:** no id. A record is `name, metaclass, space, domain, initial|equation|input` (`stateAttributesCodec.ts:46-54`), and an input is found by `run.net.declared.get(element)?.get(attr)?.input === true` (`simRunState.ts:288`).

**Recommended binding kinds,** resolved against the run record at Reset and on each board edit, never inside `startRun`:

| Binding | Stored as | Resolves when | Flag when it does not |
|---|---|---|---|
| event (Button, Switch on/off, Keypad key) | event instance id | `run.alphabet.includes(id)` | `deleted event` when the id is gone from the lookup; `not an event` when the id exists outside the alphabet. A rename keeps it [M, H3 for import]. |
| ivar (Switch, Slider, Keypad value) | `{ element: modelId \| objectId, attr }` | `declared…input === true` | `IVAR 'x' not declared`. A rename of the declaration breaks it; declarations have no id. |
| marked (LED, structured) | place id | `run.net.places.has(id)` | `not a state of this run` |
| expr (LED, 7-segment, Text display, Gauge) | JjEL text | compiles with the checks of §4 | the compile defect, or the evaluation defect (H6) |
| pulse (Pulse LED) | transition id or event id | in `run.net.transitions` or the alphabet | as for event |

**A profile without state attributes [M].** Under such a profile the run's net has no declarations: `runBag` and `modelRunBag` drop the key (`simBridge.ts:170-191`).
- `model.[coins]` compiles to `undeclared: undeclared 'coins'` under State machine [M].
- An ivar binding and a Gauge (range domain) have no declaration to resolve against.
- The panel already knows this mode (`modelDataOff`, `SimulationPanel.tsx:1270`) and words it (`stateAccessHint`, `:221-239`). The device flag should reuse that wording: «State machine» has no state attributes: use Extended state machine.

**The run never breaks.** Board defects are per device and never join `compileDefects` (`simBridge.ts:652-660`), so the panel's lines stay as they are. An output that fails at evaluation shows `Err` and its reason in the title. It never throws out of the board: `evaluateTriState` and `evaluate` catch (`derivedEvaluator.ts:514-530`).

## 4. Output evaluation (Q4)

**Where σ expressions are evaluated today [R].**
- Guards: `makeGuardOracle` (`simBridge.ts:306-320`) through `buildGuardContext(snapshot, { transitionId: site }, { event }, access)`. `self` must be a transition: `if (self === undefined) return null;` (`guardContext.ts:166`).
- Derived equations: `const ctx = snapshot.base.child({ self, event: null, model: snapshot.model }); ctx.stateAccess = toJjelStateAccess(stateAccess(working, owner), net.places);` (`derivedEvaluator.ts:560-561`), `self` being `snapshot.model` for a global (`:555`).
- The compile checks of a semantic equation: strict parse, subset with E-NODE, no `event`, no input name, no presentation read (`derivedEvaluator.ts:425-470`).

**Recommendation.** An output is an anonymous global DEFINE. It compiles with those checks plus `checkGuard`'s R1/R2 (`stcChecks.ts:198`), with the R6 `value` reason ignored because outputs may be numbers. It evaluates on the derived context with `event` null.
- The step shown is `configAt(run, getSimView(id) ?? live)`, as in the inspector (`SimInspector.tsx:164-168`). So a viewed past step shows its outputs (R-SIM-113).
- Pulse LED reads `run.trace[n-1]`: kind `fired` or `halted`, then its `selector` or `event` (`simRunState.ts:64-72`). It never reads σ.

**Measured [M].**

| Measure | Value |
|---|---|
| Ten outputs evaluated × 200 repetitions per configuration, eleven configurations (Reset and ten presses): mean per step | 0.0052 ms |
| min / max per step | 0.0035 / 0.0100 ms |
| One `pressInput` | 0.120 ms |
| Values at step 4 (`coin`) | `[true,false,false,2,true,true,21,true,false,false]`, so `paid` (a DEFINE) is read through σ's derived map (`netStep.ts:64`) |
| Second snapshot freeze | 14.4 ms (ESM), 14.2 ms (SM) |

**The seam.** The run keeps its snapshot only inside its oracles' closures. `startRun` freezes it at `simBridge.ts:619` and `SimRun` has no field for it (`simRunState.ts:75-106`).
- **Recommended:** `SimRun.snapshot?: SimSnapshot`, set by `startRun`, one line. The exported interface gains an optional property (rule 11).
- **Alternative:** re-freeze when the board opens, at 14 ms. That duplicates `startRun`'s builder.
- **Rejected:** compiling outputs inside `startRun`, which would make a board edit need a Reset.

**When to re-read.** A discard or a quiescence does not bump `'mark'` (`simRunState.ts:373-377`). The panel re-renders after every press through `tick` (`SimulationPanel.tsx:286, 601`), so the board, rendered by the panel, re-reads on `tick` as the inspector does.

## 5. Input machinery reuse (Q5)

| Need | Today [R] | For a device |
|---|---|---|
| Fire an event | `fire(event, selector?, values?, drawFrom?)` (`SimulationPanel.tsx:611-622`) over `pressInput`, `pressStep`, `pressRandom` (`simBridge.ts:1365, 1402, 1383`); `show` handles list, dialog and «Last step» (`:587-602`) | **As is:** the panel passes `fire` to the board as a prop. |
| IVAR dialog (R-SIM-88) | a press without `values` returns `asks` (`simBridge.ts:1488-1492`); `asking` state + `SimInputDialog` with `inputRows` (`SimulationPanel.tsx:976-984`, `simInputs.ts:39`) | **As is** when the device gives every value (Keypad value mode). **Seam** for a partial answer: `press` with `values` asks nothing more, so the board subtracts its held values from `inputAsks(run, e)` (`simBridge.ts:1249`). The rest goes to the dialog: `AskingInputs` gains `given?`, and its confirm merges `given` with the answer. |
| Choices Ask \| Random (R-SIM-101) | `pressStep` reads the policy for ε only; an event's list never reads it (A3) | **As is.** No device presses ε. An event's list opens under both policies (D5). |
| Disabled with a reason | `view.inputs.events`, `view.noCandidate` (`inputReason`), `view.asks` (`inputAsks`) in the panel's memo (`:451-511`); titles from the local closures `inputTitle` and `offTitle` (`:717-727`) | **Seam:** lift the two title closures into one pure exported helper, so panel and board give byte-identical titles. The board gets `view`'s three maps as props. |
| Back to live (R-SIM-106) | every press calls `simSetView(modelId, null)` (`simBridge.ts:1486`) | **As is.** |
| Keypad domain check | `parseInputValue(domain, text)` (`simInputs.ts:44-57`) | **As is**, plus a reason string (new, pure). |

**Held inputs (Switch, Slider).** The value is recorded on the step that reads it (`SimTraceStep.inputs`, `simRunState.ts:70-71`) and replayed by `configAt` (`:318-323`). A flip is not a step, as typing in the R-SIM-88 dialog is not one; a reading of R-SIM-110 in §10.

**Play.** `playTick` stops when an ε press reads an input (`simBridge.ts:1427`, R-SIM-101 A2). Letting held values answer Play's ticks would amend a ratified row, so the first cut keeps Play as it is.

## 6. Keypad modes (Q6)

**An event has no runtime parameter [R].** A step's input is `event: string | null`, an event instance id (`simRunState.ts:65`). The instance's slots are in the frozen M, and both guards and actions bind `event` to its handle (`guardContext.ts:159-173`, `actionEvaluator.ts:235`).

**Events mode (R-SIM-112).**
- **E1, recommended:** each key is bound to an event instance (`d0`…`d9`) whose `digit` slot the machine reads. For example: `model.[pin] := model.[pin] * 10 + event.digit`. It needs nothing new; in nuXmv the keys are values of the event enum.
- **E2:** one event `key` plus an IVAR `model.[digit]` answered by the key through `values`. It needs nothing new either; it is the value mode with "fire on every key", left out of the first cut.

**Where the buffer lives.**
- Value mode: in the device. That is React state of the board, cleared at Reset and Stop, never persisted, not a step until Enter. Enter fires the bound event with `[{ element, attr, value: buffer }]`, the input dialog with another face (R-SIM-112).
- Events mode: in σ, a VAR the model declares (for example `pin`). The board adds none (R-SIM-110).
- Keys outside the IVAR's domain: `parseInputValue` gives `null`, so the key is shown off with the reason, or hidden by an option of the device.

## 7. nuXmv mapping (Q7)

**There is no exporter (H8) [R].** The plan, with its sources:
- the exporter lives in `model/simulation/` (R-SIM-14, `decisions.md:1618`);
- stored attributes become VAR and derived ones DEFINE (R-SIM-19);
- inputs become IVAR (R-SIM-88);
- presentation stays out (R-SIM-18).

**Outputs map cleanly to DEFINE.** An output passes exactly the checks of a global semantic DEFINE (§4), so it becomes `DEFINE <name> := <expr>` once the JjEL→nuXmv translation exists. That translation is deferred, which is why the R-SIM-103 preview was dropped. `marked(place)` is a DEFINE over the marking variable.

**Inputs add nothing.** A Button names a value of the event IVAR. Switch, Slider and Keypad value name an IVAR already declared.

**The Pulse LED stays out of the export.** It reads `trace` (selector or event of the last step), not σ, so it is presentation (R-SIM-111). Lane 1's table «device → binding → nuXmv» shows it as `—`.

## 8. Phase 2 split (Q8)

**Order.** Sequential: Lane 2 uses Lane 1's exported types, so RC-22 check 2 fails for a parallel launch.

**Disjoint files.** The sets below are disjoint. The price: Lane 1's editor has no entry in the app until Lane 2 opens it from the board header. Lane 1 is therefore checked by tests, a mutation bench and a harness probe that mounts the editor through the dev server (a module under `frontend/scripts/probe/`).

**The non-disjoint alternative** gives Lane 1 an in-app entry: Lane 1 also adds the header button to `SimulationPanel.tsx`, and Lane 2 rewires it. Not recommended: R-SIM-115 asks for disjoint files.

### Lane 1: `sim-io-board-model` (heavy tier; no visual change in the app)

**Tests first:**
- `model/simulation/__tests__/boardCodec.test.ts`: round trip; fixed field order (the same record gives the same string); tolerant decoding per device; an unknown kind becomes a defect and the others decode; empty `devices: []`.
- `model/simulation/__tests__/boardOutputs.test.ts`: parity with `compileDerived` on parse, E-NODE, event and input reads; `checkGuard` R1/R2; `self` the model root and `event` null; `X.[marked]` without declarations; an exception becomes a defect; the DemoESM ten-step table as fixture values; a Pulse from `trace[n-1]`.
- `components/editor-v2/sim/__tests__/simBoard.test.ts`: resolution per kind (event by id in the alphabet, deleted, not an event; ivar by `input === true`; place; profile off flagged with the panel's wording); held values against `asks` (covered, partial, none); keypad parse and its reason; editor operations (add, move to a cell, rebind, remove); the nuXmv table rows.
- `sim/__tests__/simBridge.test.ts`: `run.snapshot` is set and frozen; the lifted title helper returns the panel's current strings.

**New files:**
- `frontend/src/model/simulation/boardCodec.ts` (`IO_BOARD_KEY = 'ioBoard'`, types, encode, decode)
- `frontend/src/model/simulation/boardOutputs.ts`
- `frontend/src/components/editor-v2/sim/simBoard.ts`
- `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx` and `SimBoardEditor.scss`: a portaled modal in the shell of `SimRolesModal`, holding the palette, the board in edit mode as schematic tiles, the binding inspector and the table. Apply is one `state` write of `ioBoard`.
- The three test files above.

**Touched files:** `sim/simRunState.ts` (`snapshot?` on `SimRun`), `sim/simBridge.ts` (`startRun` keeps the snapshot; the pure title helper), `sim/__tests__/simBridge.test.ts`.

**Count:** about ten files, more than five, so the prompt's DOVE confirms them (rule 19).

### Lane 2: `sim-io-board-skins` (heavy tier; visual, RC-23)

**Tests first:**
- `sim/__tests__/simViewerPrefs.test.ts`: `boardSkin` defaults to `'board'` and `showBindings` to `false`; they live on the prefs channel, never on `'mark'`.
- `sim/__tests__/simBoardFace.test.ts`: what each device shows from the run, the view and the resolution: lit, value, `Err` (out of domain or defect), off with its title, viewed step.

**New files:**
- `sim/SimBoard.tsx` and `SimBoard.scss`: the card in the 584/400 slot. Variant A puts outputs above, inputs below, captions and the status foot. Variant B is the front panel with «Show bindings»; the skin switch sits in the header and «Edit…» opens Lane 1's editor.
- `sim/simBoardDevices.tsx`: the nine device faces, one per skin.
- `sim/simBoardFace.ts` and its test.

**Touched files:**
- `sim/SimulationPanel.tsx`: the header button; `boardOpen`, exclusive with `inspectorOpen`; `fire` and `view` passed to the board; `AskingInputs.given`; the title helper at the two call sites.
- `sim/simViewerPrefs.ts` and its test.

**Lane probe:** DemoESM with a board of a Button per event, an LED per state, a 7-segment on `model.[coins]` and a Pulse on `tc`. It runs the script's ten presses from the board and compares the panel's lines with the hand run.

### The four demo scenes, byte-identical (both lanes)

On PEST, Petri, ESM and Flow B without a board record:
- every panel reading of the script (`docs/demo/models_2026_simulator_demo.md` §2, the `trunk_readings` oracle);
- Step's top at 854.5 px and the status line;
- the State dialog (1120×600, two columns);
- the inspector (400/372 px, 442 px card);
- the canvas layer;
- the four exports open with no key added.

The one visible change is Lane 2's header icon. Lane 1 changes nothing on screen: `runSignature` is equal because `ioBoard` is not a `sim*` key [M], and `compileDefects` is equal because board defects never join it.

## 9. Risks

1. **Expression bindings break on renames.** A rename turns them into an `absent-identifier` defect, flagged and never fatal. The structured kinds (event, place) do not break. Declarations have no id, so an IVAR binding breaks on a rename. Giving declarations ids would change the R-SIM-67 record form, which is out of scope.
2. **The board slot is shared with the inspector.** A user cannot watch the full σ and press devices at once. Mitigations: the Watch rows stay in the panel, and the board foot carries the step.
3. **Held inputs are visible only while the board is open.** Closed, a press asks through the dialog as today, which keeps the demo scenes unchanged.
4. **The console noise around save** (`Cannot serialize in ecore`, 24 per run) is not compared against a baseline. It is pre-existing as far as this phase can tell, not proved.

## 10. Decisions

### Decisions taken (unattended, RC-25, provisional)

1. **D1.** Key `ioBoard` in the M1 bag, a JSON string `{"v":1,"devices":[…]}` in fixed field order, written in one `state` assignment, never removed. No VersionFixer bump. Evidence: §2 [M]. Alternative: `simBoard` plus an exclusion in `modelRunBag`.
2. **D2.** Positions are grid cells, so both skins draw the same record (R-SIM-114).
3. **D3.** Bindings: event and place by id; IVAR by (element, name); outputs as JjEL text plus a structured `marked(place)`; Pulse by transition or event id (§3).
4. **D4.** Outputs compile as a global semantic DEFINE plus R1/R2 and evaluate with `self` the model root and `event` null. `SimRun.snapshot?` is added as an optional field (§4).
5. **D5.** R-SIM-113 «Choices applies to presses» is read with R-SIM-101 A3: an event's list opens under Ask and Random alike. No device presses ε.
6. **D6.** Held values (Switch, Slider) answer hand presses only while the board is open. Play stops at an input as today. The alternative, Play continuing on held values, amends R-SIM-101 A2 and would wait for Alfonso.
7. **D7.** R-SIM-110's «every press is a step» is read as every press that reaches the machine. A Switch flip and a keypad digit are not steps, as typing in the R-SIM-88 dialog is not one. Their values enter the trace on the step that reads them, so they are replayable.
8. **D8.** The keypad buffer lives in the device in value mode. Events mode binds each key to an event instance (E1).
9. **D9.** The board and the inspector share one card slot; the board's foot carries the viewed step; the board closes with the panel (§1).
10. **D10.** Two sequential lanes on disjoint files. Lane 1 has no in-app entry (§8).

### Decisions awaiting Alfonso (RC-26)

1. **What the MODELS demo shows.** Lane 2 adds an icon to the panel header in all four scenes; Lane 1 changes nothing on screen. Recommended: merge Lane 1 when it is green, and merge Lane 2 after the demo of 2026-10-04.

### Questions

1. Should Variant B, the front panel, survive a collapsed panel for presenting? Recommended: no in the first cut. The choice list and the dialog live in the panel's open branch (`SimulationPanel.tsx:937-984`).

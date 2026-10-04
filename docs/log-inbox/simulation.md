# log-inbox — lane «simulation»

Entries written by the simulation lane on `simulation-engine` (slice 0), moved here verbatim from
the three log-entry commits that were not cherry-picked (`22a593315`, `960de31d8`, `baf7b2b8a`,
reachable from the tag `archive/simulation-engine-2026-09-14`). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file
(P9, P-2026-09-19-1740 addendum item 2).

---


## 2026-10-02 — discovery: the simulator's state UI, R-SIM-102..107 and 109 (P-2026-10-02-2340)
**Prompt**: `claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md`, heavy tier, read-only on `~/jjodel-w-simstate`, branch `sim-state-disc`: where the inspector docks, the `.smv` preview, «Written by»/«Read by», kept configurations, viewer preferences, the «Data» label, the demo per lane; a Phase 2 plan of at most three lanes.
**Files touched**: `docs/discovery/discovery_2026-10-02_sim_state_ui.md` (new), the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (docs only; the benches are gitignored `_tmp_*` under `frontend/scripts/smoke/`)
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Benches on the four demo exports reproduce the script's readings word for word. Kept configurations about 100 B each (100 KiB for 1000), 3.2 KB on a 62-global σ; replay 3-13 µs a step, equal to live 4/4; the trace lacks input values. Inspector: a floating card beside the panel. Preview dropped. Lanes A ∥ B, then C. Report §0, §8.
**Prompt document name**: 2026-10-02 23:40

## 2026-10-03 — merge: sim-state-disc into alfonso-frontend-jjtl (P-2026-10-03-0032)
**Prompt**: `claude_2026-10-03_0032_prompt_merge_sim-state-disc.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-disc` at `fece79bc3` into `alfonso-frontend-jjtl`, merge base `872d0abe8`, 3 commits on the branch side.
**Files touched**: merge `6dc5fdc4b`: 4 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-02_sim_state_ui.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-02_2340_prompt_discovery_sim_state_ui.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6dc5fdc4b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6695 tests in 268 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs only: rows R-SIM-102..109 and two discovery reports; no code on the branch
**Notes**: Rollback tag `pre-sim-state-disc` on `7c9ae4e0d` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0032/result.json`.
**Prompt document name**: 2026-10-03 00:32

## 2026-10-03 — feat: the run model of the simulator's state UI, Lane A (P-2026-10-03-0040)
**Prompt**: `claude_2026-10-03_0040_prompt_sim_state_model.md`, heavy tier, `~/jjodel-w-simmodel` on `sim-state-model`: §8.1 and §8.4 of the state UI discovery and the R-SIM-108 reader; inputs on the trace, kept configurations and replay, the viewed step, the face's builders, `simViewerPrefs.ts`, `presentationOf` and `getSimPresentation`. Tests first, mutation bench, no visual change.
**Files touched**: `14311a636`: `sim/simRunState.ts`, `sim/simViewerPrefs.ts` (new), `sim/simBridge.ts`, `sim/simCanvasState.ts`, `model/simulation/netStep.ts`, and their tests `simRunState`, `simBridge`, `simCanvasState`, `simViewerPrefs` (new), `netStep`; the prompt's Status and this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (ten code files, all in the prompt's DOVE, which confirmed them under rule 19)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: configAt and withInputs live in simRunState.ts, not simBridge.ts as the discovery placed them: the store's viewed reads need them and simBridge imports the store. Mutation bench 53/56, the 3 survivors equivalent (view deletes behind viewedOf's identity check). Readings of the four scenes identical to the base tree; replay equal to kept 30/30. Propagation of discovery §4: isSimActive feeds ReadCtx.isMarked, so a viewed step reaches IR views once Lane C sets one.
**Prompt document name**: 2026-10-03 00:40

## 2026-10-03 — merge: sim-state-model into alfonso-frontend-jjtl (P-2026-10-03-0114)
**Prompt**: `claude_2026-10-03_0114_prompt_merge_sim-state-model.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-model` at `6ae536200` into `alfonso-frontend-jjtl`, merge base `fece79bc3`, 3 commits on the branch side.
**Files touched**: merge `2a60dbd3d`: 12 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_0040_prompt_sim_state_model.md`, `frontend/src/components/editor-v2/sim/__tests__/simBridge.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simCanvasState.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simRunState.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simViewerPrefs.test.ts`, `frontend/src/components/editor-v2/sim/simBridge.ts`, `frontend/src/components/editor-v2/sim/simCanvasState.ts`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `2a60dbd3d` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6764 tests in 270 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: no visual change: Lane A is pure; gates green (typecheck 14 = baseline, 6764 tests, build, docs, agents); demo readings identical per the lane
**Notes**: Rollback tag `pre-sim-state-model` on `47d6dc97d` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0114/result.json`.
**Prompt document name**: 2026-10-03 01:14

## 2026-10-03 — feat: the State page of the roles dialog and the model's State dialog (P-2026-10-03-0041)
**Prompt**: `claude_2026-10-03_0041_prompt_sim_state_dialog.md`, heavy tier, Phase 2 Lane B on `~/jjodel-w-simdialog`, branch `sim-state-dialog`: report §8.2 as R-SIM-109 adopts it, R-SIM-103 and R-SIM-102 in the dialogs; tests first; visual check by the chat, then its two fixes (kind chip colours, Globals once in the model dialog).
**Files touched**: code `b8ac89fcd`: `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `SimRolesModal.scss`, `SimDataModal.tsx`, `simRoleStatus.ts`, `simStateUsage.ts` (new), `__tests__/simRoleStatus.test.ts`, `__tests__/simStateUsage.test.ts` (new); fix `a57092326`: `SimRolesModal.tsx`, `SimRolesModal.scss`. Demo `0889e83be`, `b4b32bd72`: `docs/demo/models_2026_simulator_demo.md`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14 errors, the §17 set diffed by file and code; sim suites 395/395 (red first: 4 failed and a missing module); build exit 0, chunk-size warning only; probe readings after Reset as the script's (`Marking: locked · coins = 0, paid = false`, `Marking: i0 · count = 0`). Full vitest not run: the prompt names the sim suites.
**Out-of-scope changes**: yes — no file outside DOVE (ten files over five commits, above five, DOVE taken as the confirmation), but two typecheck logs were first written to `/tmp`, outside the worktree, then moved into the gitignored `frontend/scripts/smoke/`.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on the fresh crops, GO 2026-10-03 (State page two columns with the one-way arrow, E-NODE before Apply, Written by/Read by on ESM and Flow B, DEFINE indigo and IVAR amber chips, concrete chips dashed pink, model dialog with Globals once), after two fixes asked on the first crops; lane probe on 3064, light, 1600×1000, 78/78; crops `docs/discovery/harness/_tmp_simdialog_*.png`, gitignored
**Notes**: Both dialogs 1120×600. Mutation bench 21/21. The hexes the check named for DEFINE and IVAR exist only as component literals; the entity tokens used resolve to #EBE6FC/#5A4A7F and #F3E8D3/#6B5110. Commit type `feat` chosen: the prompt names none (P6). The first closure commit 263a2cdf0 was taken back with a soft reset and is replaced by this one. The role selects span the wide dialog. One console error at page load.
**Prompt document name**: 2026-10-03 00:41
**Ticket** (P-2026-10-03-0041): the probe kit's walk (`~/.jjodel-lanes/probe-kit/simgate/_tmp_simgate_walk.ts`, `semanticType`) looks for the R-SIM-97 Semantic type field; this tree has R-SIM-99's Simulation toggle and the picker, so the lane probe drives those instead (`frontend/scripts/smoke/_tmp_simdialog_probe.ts`, gitignored).

## 2026-10-03 — merge: sim-state-dialog into alfonso-frontend-jjtl (P-2026-10-03-0157)
**Prompt**: `claude_2026-10-03_0157_prompt_merge_sim-state-dialog.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-dialog` at `f580d8f78` into `alfonso-frontend-jjtl`, merge base `fece79bc3`, 6 commits on the branch side.
**Files touched**: merge `995a7b057`: 10 files from the branch side (`docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_0041_prompt_sim_state_dialog.md`, `frontend/src/components/editor-v2/sim/SimDataModal.tsx`, `frontend/src/components/editor-v2/sim/SimRolesModal.scss`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simRoleStatus.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simStateUsage.test.ts`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `995a7b057` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6821 tests in 272 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Lane B visually checked on its branch by the chat (State page, kind chips, E-NODE, model dialog); 9 gates green
**Notes**: Rollback tag `pre-sim-state-dialog` on `7aba76bfa` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0157/result.json`.
**Prompt document name**: 2026-10-03 01:57

## 2026-10-03 — feat: node.[x] read by IR views, R-SIM-108 interpreter side (P-2026-10-03-0121)
**Prompt**: `claude_2026-10-03_0121_prompt_sim_node_read.md`, heavy tier, `~/jjodel-w-simnoderead` on `sim-node-read`, RC-30 go-ahead: §5 and §6 of the node.[x] discovery; `presentationAttrOf` through the JjEL parser, `compilePath` reading `ReadCtx.getPresentation` with the `'mark'` channel, endpoints refusing it, `makeReadCtx` injecting `getSimPresentation`. LIR first, tests first, mutation bench, probe with scene C on node.[x].
**Files touched**: `b60775776`: `docs/lir/lir_2026-10-03_sim_node_read.md` (new). `bf81fc979`: `viewpoint/ir/pathExpr.ts`, `irCompile.ts`, `irReadCtx.ts`, `irReadCtxLproxy.ts`, tests `pathExpr.test.ts`, `irPresentation.test.ts` (new). Closure: `docs/discovery/discovery_2026-10-03_sim_node_read_addendum.md` (new), the R-SIM-108 row of `docs/decisions.md`, the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (the addendum is a file of its own, not appended to the report: the report is on `sim-node-disc` at `8bd04b0c4`, unmerged, absent from this tree; eleven files in all, every other one in the prompt's DOVE)
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: Probe on 3070: C rewritten on node.[x] has C's commits (9) and run-editor renders on the four scenes, the label shows the stand-in value on every IR node, default-viewpoint scenes equal to the report. Golden compile of views without node.[x] byte-identical. Bench 12/13, the survivor a defensive check. Typecheck 14 = baseline, 2217 tests, build exit 0. The report's probe stand-in lacked Lane A's net fields; details in the addendum.
**Prompt document name**: 2026-10-03 01:21

## 2026-10-03 — merge: sim-node-read into alfonso-frontend-jjtl (P-2026-10-03-0208)
**Prompt**: `claude_2026-10-03_0208_prompt_merge_sim-node-read.md`, a direct merge by `lane-run merge --direct`, no session: `sim-node-read` at `6eb66ddb1` into `alfonso-frontend-jjtl`, merge base `f7131a405`, 4 commits on the branch side.
**Files touched**: merge `b5427d7a5`: 11 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-03_sim_node_read_addendum.md`, `docs/lir/lir_2026-10-03_sim_node_read.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_0121_prompt_sim_node_read.md`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irPresentation.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/pathExpr.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irCompile.ts`, and 3 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `b5427d7a5` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6847 tests in 273 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: sim-node-read: no change on the demo scenes (default viewpoint), probe on 3070 by the lane; 9 gates green
**Notes**: Rollback tag `pre-sim-node-read` on `f74c7a198` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0208/result.json`.
**Prompt document name**: 2026-10-03 02:08

## 2026-10-03 — feat: the M1 face, run inspector and canvas tags of the state UI, Lane C (P-2026-10-03-0120)
**Prompt**: `claude_2026-10-03_0120_prompt_sim_state_face.md`, heavy tier, Phase 2 Lane C on `~/jjodel-w-simface`, branch `sim-state-face`: report §8.3 as R-SIM-109 adopts it, R-SIM-104, 105, 106 (UI), 107, 109 and R-SIM-102 on the face and the canvas, rendering Lane A's builders; lane probe on the four demo exports; the chat's visual check, then its two fixes (the seed in the title only, Watch four rows with the globals by default).
**Files touched**: code `6eedc4bf3`, fixes `d7ff4f821`, `16539631f`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `simulation-panel.scss`, `SimInspector.tsx` (new), `SimInspector.scss` (new), `SimNodeRunState.tsx`, `simNodeRunState.scss`, `SimCanvasLayer.tsx` (new). Demo `eb7d54c6b`, `d9e344274`: `docs/demo/models_2026_simulator_demo.md`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Typecheck 14 errors, the §17 set, none in `sim/`; sim suites 978/978 in 28 files; build exit 0, chunk-size warning only; lane probe on 3068, light, 1600×1000, 138/138, the four scenes' readings line for line as the script's. Not run: Play, the reasons list, the dark theme.
**Out-of-scope changes**: yes — no file outside DOVE (ten files over six commits, above five, DOVE taken as the confirmation), but three scratch outputs (a typecheck log, two probe stdouts) were first written to `/tmp`, outside the worktree, then deleted; later ones went to the gitignored `frontend/scripts/smoke/`.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 GO 2026-10-03 on the fresh crops (status line with step and last step, seed in the title only; Watch at most four rows; panel, Marking chips, Events, inspector with the viewed step, trace, canvas tags and Inspect switch as checked at 02:31), after two fixes asked on the first crops (`16539631f`); lane probe 138/138 on 3068, light, 1600×1000; crops `docs/discovery/harness/_tmp_simface_*.png`, gitignored
**Notes**: Amends R-SIM-104 on the seed: in the status line's title only, as R-SIM-100 had it. Watch: the globals by default, at most four rows (`facePins`). The chat adopted the lane's four choices as recommended: the panel stays live while a step is viewed; closing the inspector or collapsing the panel returns to live; the canvas layer under the toolbar; the inspector clamped at 234 (MiniMap 202 px). Demo lines 62, 270, 403 also rewritten by Lane B: union at the second merge.
**Prompt document name**: 2026-10-03 01:20
**Ticket** (P-2026-10-03-0120): with the seed gone the last step still loses its tail in 184 px of status line: PEST and ESM by 23-71 px, Flow B's step 6 by 17 px, Petri's step 4 behind the Deadlock reason (61 px left); it reads whole in Petri's steps 1-3 and Flow B's 1-5. The title carries it whole; a perceptual item for Alfonso.

## 2026-10-03 — merge: sim-state-face takes alfonso-frontend-jjtl (P-2026-10-03-0304)
**Prompt**: `claude_2026-10-03_0304_prompt_sim-state-face_take_trunk.md`, full lane, `~/jjodel-w-simface` on `sim-state-face`: RC-14, the trunk at `04dd1c7e5` into the branch with one `--no-ff` merge, base `f7131a405`; the demo-script conflict resolved with the chat's text (RC-21); then, on the chat's two answers, the test red the merge gates found and the three `Data…` left in §4 of the demo script.
**Files touched**: merge `536e27cf1`: the trunk's 39 files (37 clean, equal to the trunk's; resolved `docs/demo/models_2026_simulator_demo.md` by the chat's text, `docs/log-inbox/simulation.md` by union). `9b5386835`: `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irActivityRender.test.ts`. `6edc4b34c`: `docs/demo/models_2026_simulator_demo.md`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: 2026-10-03 01:20
**Causa**: (c)
**Regressions**: unknown. Gates on `6edc4b34c`: typecheck 14 errors, the §17 set; typecheck:scripts exit 0; vitest 6847/6847 in 273 files, the 9 red at import, equal to the trunk tip's count measured read-only in `~/jjodel-release`; hooks 344; build exit 0, chunk-size warning only; check:docs 4/4, check:scripts PASS, check:addonly PASS. No visual probe ran on the merged tree.
**Out-of-scope changes**: yes — the test file and the three §4 lines of the demo script, beyond the prompt's DOVE, authorized by the chat; the merge itself carries 39 files, above five, the trunk's, listed in the prompt.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the face checked on the branch at 02:31 and 02:49 (RC-23), before the merge; the merge adds trunk code on files disjoint from the branch's, not re-probed on this tree
**Notes**: Corregge/Causa for the test commit only: since `6eedc4bf3` (R-SIM-107) `SimNodeRunState` reads `getSimRun`, missing from the test's mock, and the σ card the test pinned is gone; the 0120 lane ran the sim suites only. Fix: the mock stub, the σ fixtures with `before`, `cornerSigma` re-pinned to `f19f2252a2347426`. Mutation bench not run. §4 stale `Data…` fixed in a docs commit (P13: never with code).
**Prompt document name**: 2026-10-03 03:04

## 2026-10-03 — merge: sim-state-face into alfonso-frontend-jjtl (P-2026-10-03-0345)
**Prompt**: `claude_2026-10-03_0345_prompt_merge_sim-state-face.md`, a direct merge by `lane-run merge --direct`, no session: `sim-state-face` at `fabcef855` into `alfonso-frontend-jjtl`, merge base `04dd1c7e5`, 12 commits on the branch side.
**Files touched**: merge `d90138dea`: 12 files from the branch side (`docs/demo/models_2026_simulator_demo.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_0120_prompt_sim_state_face.md`, `docs/prompts/claude_2026-10-03_0304_prompt_sim-state-face_take_trunk.md`, `frontend/src/components/editor-v2/sim/SimCanvasLayer.tsx`, `frontend/src/components/editor-v2/sim/SimInspector.scss`, `frontend/src/components/editor-v2/sim/SimInspector.tsx`, `frontend/src/components/editor-v2/sim/SimNodeRunState.tsx`, and 4 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `d90138dea` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6883 tests in 275 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Lane C checked visually on its branch at 02:31 and 02:49; take-trunk P-2026-10-03-0304 changed docs and one test only; 9 gates green, 6883 tests; no visual probe on the merged tree, Alfonso round on 3001 is the check
**Notes**: Rollback tag `pre-sim-state-face-P-2026-10-03-0345` on `f564a83d6` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-0345/result.json`.
**Prompt document name**: 2026-10-03 03:45

## 2026-10-03 — fix: the run inspector's trace scrolls in six rows (P-2026-10-03-1015)
**Prompt**: `claude_2026-10-03_1015_prompt_sim_inspector_trace_scroll.md`, light tier, fast lane, `~/jjodel-w-simtrace` on `sim-trace-scroll`: the inspector's trace a fixed scroll area showing the latest six steps, the card's height free of the trace, the newest step in view on a commit unless the reader scrolled down, a chosen step scrolled into view, «N steps» kept.
**Files touched**: code `f507a382f`: `frontend/src/components/editor-v2/sim/SimInspector.tsx`, `frontend/src/components/editor-v2/sim/SimInspector.scss`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: 2026-10-03 01:20
**Causa**: (a)
**Regressions**: unknown. Typecheck 14 errors, the §17 set; sim suites and `irActivityRender.test.ts` 1019/1019 in 30 files; build exit 0, chunk-size warning only; lane probe on 3072, light, 1600×1000, DemoESM, 20/20. Not run: the dark theme, the rail collapsed, the other three scenes, Lane C's probe.
**Out-of-scope changes**: yes — no file outside DOVE; one write outside the worktree: the baseline probe log renamed to `probe-_tmp_simtrace_probe.base.log` in the lane folder `~/.jjodel-lanes/P-2026-10-03-1015/`, which `lane-run` writes.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 GO 2026-10-03 on the crops at step 12 and at step 12 viewing step 1 (trace area six rows, newest first, scrollable, viewed row in view; card 442 px at steps 2, 6, 12 per the probe); lane probe 20/20 on 3072, light, 1600×1000; crops `docs/discovery/harness/_tmp_simtrace_step3.png`, `_step12.png`, `_step12_viewed.png`, the `_base_` ones before the fix, gitignored
**Notes**: Card 442 px at steps 0..12 and 14, before 332..596; at steps 2, 6, 12: 442, 442, 442. Trace area 132 px (6 × 22, the row measured), scrollHeight 286 at step 12. Lane's choice: Back to live also scrolls the live row into view, as a step shown without a commit; the row's focus outline moves inside it. The scrollbar is not painted in the crops (Playwright hides it), its 3 px gutter measured. Corregge 0120: its prompt left the trace unbounded.
**Prompt document name**: 2026-10-03 10:15

## 2026-10-03 — merge: sim-trace-scroll into alfonso-frontend-jjtl (P-2026-10-03-1031)
**Prompt**: `claude_2026-10-03_1031_prompt_merge_sim-trace-scroll.md`, a direct merge by `lane-run merge --direct`, no session: `sim-trace-scroll` at `c44875905` into `alfonso-frontend-jjtl`, merge base `4d190162f`, 3 commits on the branch side.
**Files touched**: merge `f02502d10`: 4 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_1015_prompt_sim_inspector_trace_scroll.md`, `frontend/src/components/editor-v2/sim/SimInspector.scss`, `frontend/src/components/editor-v2/sim/SimInspector.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f02502d10` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6883 tests in 275 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: trace scroll checked on its branch (card 442 px at steps 2, 6, 12; six rows; viewed row in view); 9 gates green
**Notes**: Rollback tag `pre-sim-trace-scroll` on `39ae40a83` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1031/result.json`.
**Prompt document name**: 2026-10-03 10:31

## 2026-10-03 — fix: the panel and the inspector explain a profile without state attributes (P-2026-10-03-1420)
**Prompt**: `claude_2026-10-03_1420_prompt_sim_profile_state_hint.md`, fast lane, light tier, `~/jjodel-w-simhint` on `sim-profile-hint`: under a profile whose `stateAttributes` mode is off, one hint line where the Undeclared line sits and once at the top of the inspector's σ section; with it on, nothing changes.
**Files touched**: code `ff8e22e22`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (`stateAccessHint`, the `stateHint` state, `modelProfileName`), `frontend/src/components/editor-v2/sim/SimInspector.tsx` (optional prop `stateHint`; no SCSS rule needed: `sim-panel__hint` wraps in the card); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `ff8e22e22`: typecheck exit 2 with 14 errors, the §17 set, none under `sim/`; vitest on `editor-v2/sim`, `model/simulation` and `irActivityRender.test.ts` 30 files, 1020 of 1020; build exit 0. After the round trip back to Extended state machine the panel lines are identical to those before it.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 19 PASS, 0 FAIL on 3073, DemoESM imported read-only, 1600×1000, default theme, light in the crops; the chat's visual check pending, RC-23; crops `docs/discovery/harness/_tmp_simhint_panel_statemachine.png`, `_inspector_statemachine.png`, `_panel_extended.png`, gitignored)
**Notes**: Matched reason: 'undeclared' only ('declaration' cannot arise under off: runBag and modelRunBag drop the key). On DemoESM under State machine 3 defects become 1 (actions off); the hint names model.[paid]. Panel line clamped at 288 px (scrollWidth 362 over 262), full text in the title. SimulationPanel does not import in the bench (window, monaco): helper run through esbuild. Console: one reducer 'Invalid action path', not compared against the base.
**Prompt document name**: 2026-10-03 14:20

## 2026-10-03 — fix: the state hint wraps in two rows so its remedy is readable (P-2026-10-03-1420)
**Prompt**: the chat's check of `claude_2026-10-03_1420_prompt_sim_profile_state_hint.md` after `ff8e22e22`, same lane: the hint ended in an ellipsis at `use Ext…` in the 288 px panel; drop `--line` for this hint only so it wraps to two rows at most, text unchanged, re-measure the hint height and the transport row top before and after Reset, recrop.
**Files touched**: code `1c4212b43`: `frontend/src/components/editor-v2/sim/SimulationPanel.tsx` (the hint takes `sim-panel__hint--halt`, no `--line`), `frontend/src/components/editor-v2/sim/simulation-panel.scss` (one declaration, `overflow: hidden`, in the existing `&__hint--halt`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: 2026-10-03 14:20 (`claude_2026-10-03_1420_prompt_sim_profile_state_hint.md`, its first pass `ff8e22e22`: the hint reused `--line`)
**Causa**: (a)
**Regressions**: no. Gates on `1c4212b43`: typecheck exit 2 with 14 errors, the §17 set, none under `sim/`; vitest on `editor-v2/sim`, `model/simulation` and `irActivityRender.test.ts` 30 files, 1020 of 1020; build exit 0; check:docs exit 0. The halt line is unchanged: it had `overflow: hidden` from `--line` already.
**Out-of-scope changes**: yes — `simulation-panel.scss` is outside the first prompt's DOVE; the chat's follow-up put it in scope for one rule, and the change is one declaration on an existing rule, not a new class.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe 21 PASS, 0 FAIL on 3073, DemoESM, 1600×1000, default theme; the chat's visual check pending, RC-23; crops `docs/discovery/harness/_tmp_simhint_panel_statemachine.png`, `_panel_statemachine_long.png`, `_inspector_statemachine.png`, `_panel_extended.png`, gitignored)
**Notes**: Measures on 3073, DemoESM under State machine: hint 41 px, two rows, not clamped sideways; transport row top 873 at Not started and 873 after Reset. --halt alone does not clip: a long name injected laid out 3 rows (scrollHeight 54 over 41) and the third painted over MARKING until overflow: hidden went into the --halt rule; the halt line already had it. A speck of that third row's top shows in the 4 px bottom padding. The SetFieldAction2 console error is left to the chat's ticket.
**Prompt document name**: 2026-10-03 14:20

## 2026-10-03 — merge: sim-profile-hint into alfonso-frontend-jjtl (P-2026-10-03-1452)
**Prompt**: `claude_2026-10-03_1452_prompt_merge_sim-profile-hint.md`, a direct merge by `lane-run merge --direct`, no session: `sim-profile-hint` at `91c8964ae` into `alfonso-frontend-jjtl`, merge base `764e00502`, 5 commits on the branch side.
**Files touched**: merge `aefaddcf5`: 5 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_1420_prompt_sim_profile_state_hint.md`, `frontend/src/components/editor-v2/sim/SimInspector.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/simulation-panel.scss`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `aefaddcf5` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6946 tests in 277 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat check (RC-23) on the lane probe of P-2026-10-03-1420: hint on two rows 41 px, transport row 873 before and after Reset under both profiles; gates of the direct merge green; Alfonso look on 3001 pending
**Notes**: Rollback tag `pre-sim-profile-hint` on `ccb15ff9c` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1452/result.json`.
**Prompt document name**: 2026-10-03 14:52

## 2026-10-03 — fix: a state attribute's initial value follows its domain (P-2026-10-03-1520)
**Prompt**: `claude_2026-10-03_1520_prompt_sim_initial_default.md`, fast, light tier, `~/jjodel-w-siminit` on `sim-initial-default`: a new state attribute started at `false` whatever its domain, and an edit of kind, min, max or literals left the stale initial in place; the initial now takes the domain's default (false, the range minimum, the first enum literal) and keeps a value typed inside the domain.
**Files touched**: code `777a5da2f`: `frontend/src/model/simulation/stateAttributesCodec.ts` (two additive exports, `defaultInitialOf` and `initialFollowingDomain`), `frontend/src/model/simulation/__tests__/stateAttributesCodec.test.ts`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx` (`patchOf`, a `domainPatch` helper); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `777a5da2f`: typecheck exit 2 with 14 errors, the §17 set; vitest on `model/simulation` and `editor-v2/sim` 29 files, 1022 of 1022; build exit 0. Tests 16 of 48 red first, then green. Mutation bench on the two helpers 12/12 killed.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3075, DemoESM, 1600×1000, light, 17 PASS 0 FAIL; the chat's visual check pending, RC-23; crops in `~/.jjodel-lanes/P-2026-10-03-1520/`, outside the tree)
**Notes**: `patchOf` is not testable in the bench (SimRolesModal.tsx imports the joiner), so the rule lives in the codec and the wiring is covered by the probe only, derived row included by cell count. The four demo exports carry no `sim*` key, so no initial outside its domain; the run still starts on one and reports an `initial` defect. Open: derived to stored leaves initial empty (`formPatch`, simInputs.ts).
**Prompt document name**: 2026-10-03 15:20

## 2026-10-03 — merge: sim-initial-default into alfonso-frontend-jjtl (P-2026-10-03-1535)
**Prompt**: `claude_2026-10-03_1535_prompt_merge_sim-initial-default.md`, a direct merge by `lane-run merge --direct`, no session: `sim-initial-default` at `095840d88` into `alfonso-frontend-jjtl`, merge base `cceec3f05`, 3 commits on the branch side.
**Files touched**: merge `f614230e8`: 5 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_1520_prompt_sim_initial_default.md`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/model/simulation/__tests__/stateAttributesCodec.test.ts`, `frontend/src/model/simulation/stateAttributesCodec.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f614230e8` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6962 tests in 277 files, 9 red at import, hooks 344; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat smoke on 3001: HTTP 200, the served stateAttributesCodec carries defaultInitialOf; all eight gates green; Alfonso look pending
**Notes**: Rollback tag `pre-sim-initial-default` on `cceec3f05` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1535/result.json`.
**Prompt document name**: 2026-10-03 15:35

## 2026-10-03 — fix: simulation UI polish, tags, roles line, state heading, initials (P-2026-10-03-1630)
**Prompt**: `claude_2026-10-03_1630_prompt_sim_polish.md`, full, heavy tier, `~/jjodel-w-simpolish` on `sim-polish`: five fixes in the simulation UI before the MODELS demo: long tags cut in the Simulation roles window, the roles line deaf to manual choices, «Marking» on non-Petri runs, derived to stored leaving the initial empty, presentation to semantic keeping a stale initial.
**Files touched**: code `26e05dba3`: `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `SimRolesModal.scss`, `SimInspector.tsx`, `SimulationPanel.tsx`, `simInputs.ts`, `simLabels.ts` (new), `__tests__/simInputs.test.ts`, `__tests__/simLabels.test.ts` (new), all under `editor-v2/sim/`; this commit: this entry, the ticket below and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `26e05dba3`: typecheck exit 2 with 14 errors, the §17 set; vitest on `editor-v2/sim` and `model/simulation` 30 files, 1039 of 1039; build exit 0. Tests red first (simLabels missing, 6 of 15 simInputs red), then green. Mutation bench 22/22 killed, controls green.
**Out-of-scope changes**: no — ten files over two commits, above five (RC-11, rule 19): the eight code files and the two docs files, each in the prompt's DOVE, taken as the confirmation.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3076, four demo scenes, 1600×1000: dark 106 PASS 0 FAIL; light 105 PASS 1 FAIL, a reducer error at DemoPEST open that the same probe on HEAD's code also logs; the chat's visual check pending, RC-23; crops in `~/.jjodel-lanes/P-2026-10-03-1630/`)
**Notes**: Point 1: no role label is cut (eight presets, four scenes); the cut tags are R-SIM-90's, absent from the demo scenes (one candidate per row), reproduced with a probe-only attribute: `Transition.acceptanceCondition` shown 90 of 180 px, now whole, row still 32 px. Point 2 reads «assigned»: it counts edits and stored values, not matches. `matchLine` (simRolesDraft.ts) is now read by tests only.
**Prompt document name**: 2026-10-03 16:30

## 2026-10-03 — ticket: two console errors on the demo scenes predate the simulation UI
**Ticket**: On the four demo exports, probed on 3076 with this lane's code and with HEAD's: «Invalid action path 0» (`deepCopyButOnlyFollowingPath`, reducer.ts, a SetFieldAction on an undefined path) at scene open, before any simulation UI mounts, intermittent: in the two phase-tagged light runs on DemoPEST twice and DemoESM once (HEAD's run included), in earlier untagged runs on DemoPetri and DemoESM, never in the dark run; and «Cannot serialize in ecore, found loop» (`generateEcoreJson_impl`) on DemoPEST and DemoESM after the model tab opens and Reset runs. The prompt's gate «the scenes open with no console error» cannot hold until the first is fixed.
**Priority**: medium
**Found in**: P-2026-10-03-1630
**Detail**: ~/.jjodel-lanes/P-2026-10-03-1630/probe-_tmp_simpolish_probe.head.log

## 2026-10-03 — merge: sim-polish into alfonso-frontend-jjtl (P-2026-10-03-1730)
**Prompt**: `claude_2026-10-03_1730_prompt_merge_sim-polish.md`, a direct merge by `lane-run merge --direct`, no session: `sim-polish` at `c482d7785` into `alfonso-frontend-jjtl`, merge base `d2a1866b6`, 3 commits on the branch side.
**Files touched**: merge `26b62ea01`: 10 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-03_1630_prompt_sim_polish.md`, `frontend/src/components/editor-v2/sim/SimInspector.tsx`, `frontend/src/components/editor-v2/sim/SimRolesModal.scss`, `frontend/src/components/editor-v2/sim/SimRolesModal.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simInputs.test.ts`, `frontend/src/components/editor-v2/sim/__tests__/simLabels.test.ts`, and 2 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `26b62ea01` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 6996 tests in 278 files, 9 red at import, hooks 352; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: chat RC-23 on the lane crops: roles counter 11 of 13 assigned, Configuration on DemoESM and Marking on DemoPetri, attribute tag whole, presentation to semantic initial false; eight gates of the direct worker green (vitest 6996)
**Notes**: Rollback tag `pre-sim-polish` on `49957d340` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-03-1730/result.json`.
**Prompt document name**: 2026-10-03 17:30

## 2026-10-03 — discovery: the simulator's I/O board, R-SIM-110..115 (P-2026-10-03-1845)
**Prompt**: `claude_2026-10-03_1845_prompt_sim_io_board_discovery.md`, heavy tier, read-only on `~/jjodel-w-ioboard`, branch `sim-io-board`: R-SIM-115's eight questions (mount point, persistence key, binding resolution, output evaluation, input machinery reuse, keypad modes, nuXmv mapping, Phase 2 split), a probe where a number decides.
**Files touched**: probe `ba0668d80`: `frontend/scripts/probe/io-board-outputs.ts`, `frontend/scripts/probe/fixtures/scene_3_DemoESM.jjodel` (byte copy). Report `bf8ed5b78`: `docs/discovery/discovery_2026-10-03_sim_io_board.md`. This commit: the Status line of the prompt, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no (no file under `frontend/src`; check:scripts PASS, typecheck:scripts exit 0, whose scope excludes `probe/`)
**Out-of-scope changes**: yes — no file outside DOVE, but two scratch writes outside the worktree, `/tmp/io-board-outputs.json` (the probe's first default) and an empty `/tmp/claude-ioboard`, both deleted; the output now goes to the gitignored `frontend/scripts/smoke/`.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Probe on 3079, DemoESM, final run ALL GREEN: ten outputs 5.2 µs a step (press 120 µs), X.[marked] reads under State machine, a sim* key moves runSignature and ioBoard does not, ioBoard survives save, import (event id remapped) and reopen. 50 console errors a run (ecore serialize loop at save), no baseline. Report §0, §8, §10.
**Prompt document name**: 2026-10-03 18:45

## 2026-10-03 — feat: the I/O board's model and editor, Lane 1 (P-2026-10-03-1845)
**Prompt**: the chat's GO on `claude_2026-10-03_1845_prompt_sim_io_board_discovery.md`, same session and branch `sim-io-board`: Phase 2 Lane 1 `sim-io-board-model` of the report's §8, decisions 1-6 and question 1 adopted; tests first, mutation bench, harness probe on 3079, demo scenes byte-identical, R-SIM rows; no merge.
**Files touched**: `879b591ef`: `boardCodec.ts`, `boardOutputs.ts` (new, `model/simulation/`), `sim/simBoard.ts`, `SimBoardEditor.tsx`, `SimBoardEditor.scss` (new), `simRunState.ts`, `simBridge.ts`. `f03462c33`: `boardCodec.test.ts`, `boardOutputs.test.ts`, `simBoard.test.ts` (new), `simBridge.test.ts`. `2b3ea44e9`: `boardOutputs.ts`, a comment. `6b2a1f53c`: `scripts/probe/io-board-lane1.ts`, `io-board-editor-harness.tsx`, two fixtures. This commit: `docs/decisions.md`, the report's addendum, the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set by file and code; vitest 7077/7077 in 273 files, the 9 known suites red at import; build exit 0, chunk-size warning only, the editor absent from `dist/`; the four demo scenes' readings byte-identical to the base, 34 rows.
**Out-of-scope changes**: yes — the eleven code and test files are the GO's DOVE (it counts SimBoardEditor.tsx/.scss as one), the probe its harness probe; beyond its list, the report's addendum; one scratch write outside the worktree, `/tmp/ioboard_msg.txt`, a commit message, deleted at once.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3079, light, 1600×1000, DemoESM through the harness: 12/12, Apply one undo step, signature unchanged; crops light and dark in `~/.jjodel-lanes/P-2026-10-03-1845/`; the chat's visual check pending, RC-23)
**Notes**: Bench 58/58 (codec 15, outputs 18, resolution 22, seams 3), one survivor killed by a test added. checkGuard folds nothing at the model, so outputs fold their own R2. R-SIM-116 and 118 verified by an RC-27 agent. Six first reds were the fixture's (`initial: ''` on derived and input records). The undo needs `U.userHasInteracted` in a probe. Report addendum.
**Prompt document name**: 2026-10-03 18:45

## 2026-10-03 — feat: the I/O board's two skins and the panel wiring, Lane 2 (P-2026-10-03-2000)
**Prompt**: `claude_2026-10-03_2000_prompt_sim_io_board_skins.md`, heavy tier, `~/jjodel-w-ioskins` on `sim-io-board-skins` (from `11b4df6ce`): Lane 2 of the I/O board report §8, the card with Variants A and B, the device faces, the skin prefs, the panel wiring; tests first, mutation bench, lane probe on 3081 light and dark, the four demo scenes against the base; no merge.
**Files touched**: `8c3a0e561`: `sim/SimBoard.scss`, `sim/simBoardDevices.tsx`, `sim/simBoardFace.ts` (new), `SimulationPanel.tsx`, `simViewerPrefs.ts`, `SimBoardEditor.tsx` (the footer string). `734294d19`: `__tests__/simBoardFace.test.ts` (new), `__tests__/simViewerPrefs.test.ts`. This commit: the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set by file and code; vitest 7106/7106 in 283 files, the 9 known suites red at import; build exit 0, chunk-size warning only; the four demo scenes' face, State dialog, inspector (372/400 × 442) and canvas readings equal to the base, 0 differing paths, Step's top 873.
**Out-of-scope changes**: yes — eight files, all in the DOVE (rule 19), but `SimBoard.tsx` was not created: its card lives in `simBoardDevices.tsx` (Notes). Four scratch writes outside the worktree, three gate outputs and a backup in `/tmp`, moved into the gitignored `frontend/scripts/smoke/` or deleted.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3081, 1600×1000, DemoESM with a board: 50/50, the ten presses from the board equal to the hand run, Variants A and B, «Show bindings» on and off, a viewed step, the two cards never together; crops light and dark in `~/.jjodel-lanes/P-2026-10-03-2000/`; the chat's visual check pending, RC-23)
**Notes**: `SimBoard.tsx` beside Lane 1's `simBoard.ts` differs only in case: on this disk `./SimBoard` resolves to `simBoard.ts` (tsc TS1149, Vite tries .ts first), so the card is `SimBoard` in `simBoardDevices.tsx`; a rename to a new file waits for Alfonso. Bench 36/36 on `simBoardFace.ts`, prefs 2/2. Held Switch and Slider values and `AskingInputs.given` are unit-tested only: DemoESM has no input. The prompt's 854.5 px is 873 since P-2026-10-03-0120.
**Prompt document name**: 2026-10-03 20:00

## 2026-10-03 — merge: sim-io-board-skins into alfonso-frontend-jjtl (P-2026-10-03-2327)
**Prompt**: `claude_2026-10-03_2327_prompt_merge_sim-io-board-skins.md`, full lane, a lane-run session: `sim-io-board-skins` at `c0cb7551d` into `alfonso-frontend-jjtl` by `--no-ff` of the explicit sha, merge base `7a249ef87`, 13 commits on the branch side (I/O board Lane 1 and Lane 2, the header icon included, by Alfonso's approval), 54 on the trunk side (the prompt `5e33d9a88` and the auto-intake chore `53aed9baa` on top).
**Files touched**: merge `18926660a`: 29 files from the branch side, 21 added and 8 modified (`docs/decisions.md`, auto-merged with RC-40, RC-41 and R-VP-54..57; the I/O board report, two prompts, `docs/log-inbox/simulation.md`, three probes and three fixtures, 11 source files under `editor-v2/sim/` and `model/simulation/`, 6 test files of which 4 new). This commit: this entry and the Status line of `claude_2026-10-03_2327_prompt_merge_sim-io-board-skins.md`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `18926660a`: typecheck 14, the §17 set by file and code; typecheck:scripts exit 0; vitest 7255 of 7255 in 292 files, 9 red at import (the §17 nine, the trunk tip's set), as expected (trunk tip 7160 in 288 plus the branch's 95: 88 in 4 new files, 7 in 2 modified ones); hooks 424, as expected (the branch adds none); build exit 0, chunk-size warning; check:docs 4/4; check:agents green; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no. The merge brings the branch's 29 files, declared by its prompts (RC-11). The rollback tag (a ref, not a file) was not in the prompt: RC-31, as in `843b2fa6b`. Scratch gate outputs and the commit message went to `/tmp`; the branch's tests were counted read-only in `~/jjodel-w-ioskins`, as the prompt allows.
**Layer Impact Report**: not-required (a merge of reviewed commits)
**Smoke visivo**: passato — chat, unattended, 2026-10-03 23:55 on 3001 at `18926660a`: HTTP 200, `simBoardDevices.tsx` served with `SimBoard`, no new console error; the P-2026-10-03-2000 board probe on the merged trunk via lane-run probe on 3082, 50/50, ten presses equal to the hand run; crops Variant A light and B with bindings dark identical to the branch. Alfonso in the morning digest.
**Notes**: Rollback tag `pre-sim-io-board-skins` on `53aed9baa` (RC-31). No union resolution; probes 21/21 once, control R-VP-58 absent. The first run of this prompt stopped blocked on a dirty tree (`auto-intake.config.json`); the chat committed it as `53aed9baa`. Step 6's reset target `48eec06d5` was stale after `5e33d9a88`; the pre-merge tip was `53aed9baa`, not needed. The build's 43 Sass @import deprecations come from older files, none from the branch.
**Prompt document name**: 2026-10-03 23:27

## 2026-10-04 — feat: event nodes and their edges hidden on the canvas during a run (P-2026-10-04-0935)
**Prompt**: `claude_2026-10-04_0935_prompt_sim_hide_events_during_run.md`, heavy tier, fast lane, `~/jjodel-w-simhide` on `sim-hide-events`: while a run exists the canvas draws neither the event instances nor the edges incident to them, view-only, 0 px for every other element; tests first, mutation bench, probe on the four demo scenes and a hand-made statechart; hard stop for the visual check.
**Files touched**: code `8d0021987`: `frontend/src/components/editor-v2/sim/simHideEvents.ts` (new), `sim/__tests__/simHideEvents.test.ts` (new), `EditorV2.tsx`, `edges/UnifiedEdge.tsx`. Closure commit after the visual GO (P13): the prompt's Status line, this entry.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no. Typecheck 14, the §17 set by file and code; typecheck:scripts and check:scripts exit 0; vitest 7285 of 7289, the 9 known import failures, the 4 others lane-run harness timeouts at load 20-30, 121/121 on a rerun of their two files at load 6; build exit 0, chunk-size warning only; lane probe 309/309 against the base tree.
**Out-of-scope changes**: yes — six files over two commits, above five (RC-11, rule 19): the four code files and the two closure files. `UnifiedEdge.tsx` is beyond the place the prompt suggests (`EditorV2.tsx`): it keeps the hidden events' boxes as route obstacles (Notes). No file outside the worktree; the dev server on 3097 ran from this tree.
**Layer Impact Report**: not-required (no §3.1 file)
**Smoke visivo**: passato (lane probe on 3097, light, 1600×1000: 309/309 on PEST, Petri, ESM, Flow B, PEST in its derived statechart and the hand-made scene; crops `frontend/scripts/smoke/_tmp_simhide_crops/<scene>_{before,reset,running,final,stop}_600.png` and `<scene>_running_dark_600.png`, gitignored; visual GO from Alfonso on the crops, 2026-10-04)
**Notes**: Partial on the spec, not the code: Reset starts a run here (R-SIM-29), so 'after Reset equals Not started' contradicts item 1; read as after Stop. A collapsed panel keeps its run: events stay hidden. React Flow's hidden dropped the boxes from the router, so other edges re-routed (ESM, 2 boxes) and PEST kept stale lanes after Stop; occupiesCanvas keeps them as obstacles. Hops over hidden edges go. Bench 13/16, 3 equivalent. Type feat chosen (P6).
**Prompt document name**: 2026-10-04 09:35

**Inline check** (P-2026-10-04-0935, the prompt's ten lines):
- Run state: `simRunState.ts`, a module singleton outside Redux, one record per model from Reset (`simReset`) to Stop or unmount (`simClear`): a record exists iff the status is Running, Terminated, Deadlock or Halted; Not started is no record (R-SIM-29).
- The canvas learns it through `useSimVersion()` (the `'mark'` channel: Reset, a fired or halted step, Stop) and `getSimRun(modelid)`; the event ids are the run's `alphabet`, the instances of the `simEvent` class at Reset, `[]` without the role.
- Narrowest filter: the arrays EditorV2 hands to React Flow, after `useIRContainment`: a node whose `idlookup[vertex].model` is an event, and every edge with such a node at an end, flagged `hidden`, never removed; memoised on the alphabet, which a step keeps.
- `hidden` keeps the elements in React Flow's store (handles unchanged), but the route avoidance, the arc obstacles and the lane pass skip hidden nodes: `occupiesCanvas` keeps the run's hidden nodes there, so no other edge moves.
- New identifiers `simHideEvents.ts`, `hideRunEvents`, `occupiesCanvas`, `simRunHidden`: a global grep found none before.

## 2026-10-04 — merge: sim-hide-events takes alfonso-frontend-jjtl (P-2026-10-04-1213)
**Prompt**: `claude_2026-10-04_1213_prompt_sim-hide-events_take_trunk.md`, full lane, a lane-run session in `~/jjodel-w-simhide` on `sim-hide-events`: RC-14, the trunk at the explicit sha `5b4d6c887` into the branch with one `--no-ff` merge, base `43685438b`, 12 commits on the trunk side (object-as-edge delete, R-B17, D-UI-15), 3 on the branch side and this prompt on top; hard stop for the chat's visual GO, then this closure.
**Files touched**: merge `c53a5a8d1`, the trunk's 15 files, none resolved by hand: `AGENTS.md`, `CLAUDE.md`, `docs/DESIGN-SYSTEM.md`, `docs/PROTOCOL.md`, `docs/decisions.md`, `docs/log-inbox/views.md`, the object-edge-delete discovery and its two prompts, `frontend/scripts/probe/object-edge-delete.ts`, `EditorV2.tsx` (auto-merged, the only file on both sides), `canvasToJjom.ts`, `syncDeleteObjectAsEdge.test.ts`, `frontend/src/styles/CLAUDE.md` and `AGENTS.md`. This commit: the prompt's Status line, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c53a5a8d1`: typecheck exit 2, 14 errors, the §17 set by file and code; typecheck:scripts exit 0; vitest 7305 of 7305 in 296 files, the 9 red at import, as expected (trunk tip 7289 measured read-only in `~/jjodel-release`, plus the branch's 16); hooks 424, as expected (the trunk's 424, the branch adds none); build exit 0, chunk-size and Sass deprecation warnings only; check:docs 4/4; check:scripts PASS; check:addonly PASS.
**Out-of-scope changes**: no. The merge carries the trunk's 15 files, above five (RC-11), declared by the prompt's measurement; this commit carries the two files of step 9. Scratch gate outputs and the commit message went to `/tmp`; the trunk's counts were taken read-only in `~/jjodel-release`, as the prompt allows.
**Layer Impact Report**: not-required (a merge of reviewed commits; `canvasToJjom.ts` comes with the trunk's `5557a714b`)
**Smoke visivo**: passato — chat, unattended, GO on `c53a5a8d1` at step 8 (the branch's visual probes on the merged tree, RC-23); Alfonso in the morning digest
**Notes**: Merge-tree zero conflicts, tree `700949a33`, the one the commit records; no union resolution. Probes once each, control R-RAIL-46 absent, but `- **R-RAIL-44**` counts 2, not the prompt's 1: the trunk tip has 2 (the row marked superseded and its pointer under «Superate», both `18a861da7`) and the merged `decisions.md` is the trunk's byte for byte. `EditorV2.tsx` read whole: disjoint hunks, each import and declaration once.
**Prompt document name**: 2026-10-04 12:13

## 2026-10-04 — merge: sim-hide-events into alfonso-frontend-jjtl (P-2026-10-04-1456)
**Prompt**: `claude_2026-10-04_1456_prompt_merge_sim-hide-events.md`, a direct merge by `lane-run merge --direct`, no session: `sim-hide-events` at `452b810ac` into `alfonso-frontend-jjtl`, merge base `5b4d6c887`, 6 commits on the branch side.
**Files touched**: merge `b3fe55c5d`: 7 files from the branch side (`docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-04_0935_prompt_sim_hide_events_during_run.md`, `docs/prompts/claude_2026-10-04_1213_prompt_sim-hide-events_take_trunk.md`, `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/edges/UnifiedEdge.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simHideEvents.test.ts`, `frontend/src/components/editor-v2/sim/simHideEvents.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `b3fe55c5d` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7305 tests in 296 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: 3001 HTTP 200, serves simHideEvents.ts from the merged trunk; eight gates green in result.json; visual GO by Alfonso on the branch crops (P-2026-10-04-0935)
**Notes**: Rollback tag `pre-sim-hide-events` on `5b4d6c887` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-04-1456/result.json`.
**Prompt document name**: 2026-10-04 14:56

## 2026-10-04 — feat: a Clock input device on the I/O board (P-2026-10-04-0150)
**Prompt**: `claude_2026-10-04_0150_prompt_sim_io_clock.md`, heavy tier, `~/jjodel-w-ioclock` on `sim-io-clock` (from `43685438b`), lane auto: the Clock as a fifth input of the board, time as an environment source (R-SIM-122); report first, then tests first, the timer through the panel's `fire`, both skins, the editor's period field; probe on 3083 light and dark; no merge.
**Files touched**: report `51b074753`. `52ddd7163`: `model/simulation/boardCodec.ts`, `sim/simBoard.ts`, `sim/simBoardClock.ts` (new), `sim/simBoardFace.ts`, `sim/simBoardDevices.tsx`, `sim/SimBoard.scss`, `sim/SimBoardEditor.tsx`, `sim/SimulationPanel.tsx`. `bed918e5f`: `boardCodec.test.ts`, `simBoard.test.ts`, `simBoardFace.test.ts`, `simBoardClock.test.ts` (new). This commit: `docs/decisions.md` (R-SIM-122), the report's addendum, the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set by file and code; vitest 7310/7310 in 295 files, the 9 known suites red at import; build exit 0; check:scripts exit 0; mutation bench 48/48; the four demo scenes 50/50 on the base and after, 0 differing paths, header and board card included.
**Out-of-scope changes**: yes — one scratch write outside the worktree, `/tmp/ioclock_sass_check.css` from an `npx sass` check, deleted at once. Code: twelve files over two commits, above five (rule 19), all in the prompt's DOVE as the report's §6 listed them; `SimBoardEditor.scss` listed and untouched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3083, 1600×1000: clock 22/22, microwave 8/8 reading 01:25 after 5 s, Play beside the clock with a failing control without keepPlay, scenes diff 0; crops light and dark in `~/.jjodel-lanes/P-2026-10-04-0150/`; the chat's visual check pending, RC-23)
**Notes**: fire gains keepPlay so a tick leaves Play running; the panel is outside the node bench, so the probe's control stands for its test. Ticks use the board's held values (provisional R-SIM-120 read as presses from the board); a choice list drops ticks as the dialog does; a board edit switches clocks off. Variant A's first layout overflowed its tile, fixed before the commit. Report: docs/discovery/discovery_2026-10-04_sim_io_clock.md.
**Prompt document name**: 2026-10-04 01:50

## 2026-10-04 — merge: sim-io-clock into alfonso-frontend-jjtl (P-2026-10-04-1504)
**Prompt**: `claude_2026-10-04_1504_prompt_merge_sim-io-clock.md`, a direct merge by `lane-run merge --direct`, no session: `sim-io-clock` at `452efc6f1` into `alfonso-frontend-jjtl`, merge base `43685438b`, 5 commits on the branch side.
**Files touched**: merge `6704563a8`: 16 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-04_sim_io_clock.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-04_0150_prompt_sim_io_clock.md`, `frontend/src/components/editor-v2/sim/SimBoard.scss`, `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx`, `frontend/src/components/editor-v2/sim/SimulationPanel.tsx`, `frontend/src/components/editor-v2/sim/__tests__/simBoard.test.ts`, and 8 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `6704563a8` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7342 tests in 297 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: RC-23 by the chat on the lane crops (light): editor palette and period field, Variant A with tick count equal to the step count, microwave display 01:25 at secs 85 after plus x3, start and five ticks, plus and start disabled while Cooking. Alfonso accepted decision 1 of R-SIM-122 (a tick answers inputs from the board's switch and slider values), 2026-10-04. Tickets, low: the clock's On face pairs a pause icon with the word On (state and action mixed, use Pause/Start); binding captions truncated, more visible on clock tiles. Note: R-RAIL-44 under Superate de-bolded on the trunk (c25c758f4) so the duplicate-row probe no longer trips on D-UI-15.
**Notes**: Rollback tag `pre-sim-io-clock` on `c25c758f4` (RC-31). Union: `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-04-1504/result.json`.
**Prompt document name**: 2026-10-04 15:04

## 2026-10-04 — feat: styles of the I/O board's front panel, the model (P-2026-10-04-1130)
**Prompt**: `claude_2026-10-04_1130_prompt_sim_io_panel_model.md`, heavy tier, `~/jjodel-w-iopanel` on `sim-io-panel` (from `452efc6f1`), lane auto, first of a chain with P-2026-10-04-1131: report first, then tests first, the board record's theme, accent, cols, span and style, the kinds silk and buzzer, occupancy by span, the editor's pure operations, `maxDisplayLength`, `simBoardIcons.ts`; D-UI-16 and R-SIM-123..129; no merge.
**Files touched**: report `d03957dd1`. `906cb0f2e`: `model/simulation/boardCodec.ts`, `sim/simBoard.ts`, `sim/simBoardFace.ts`, `sim/simBoardIcons.ts` (new), `sim/SimBoardEditor.tsx` and `sim/simBoardDevices.tsx` (two map entries each). `c18397a5c`: `boardCodec.test.ts`, `simBoard.test.ts`, `simBoardFace.test.ts`, `simBoardIcons.test.ts` (new). This commit: `docs/decisions.md` (D-UI-16, R-SIM-123..129), the report's addendum, the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set by file and code; vitest 7360/7360 in 296 files, the 9 known suites red at import; build exit 0, chunk-size warning only; every board saved today encodes byte for byte as on `b27138436`; mutation bench 63/63.
**Out-of-scope changes**: yes — `SimBoardEditor.tsx` and `simBoardDevices.tsx` were outside the prompt's DOVE (no `.tsx`): widened by the chat's answer to the report's question 1, two lines each. Ten code files over two commits, above five (rule 19), all listed in the report's §6 before the code.
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (no rendering in this lane beyond two placeholder map entries; what is drawn is P-2026-10-04-1131's, with its probe)
**Notes**: Network loss near 11:51 ended the first session mid-test; resumed on the same tree, the one modified test file kept. The Write tool stored a regex range as literal combining marks; the bench exposed it (a mutant that could not apply), rewritten as escapes before the commit. D-UI-15 is on the trunk only: D-UI-16 sits after D-UI-14, a hunk at the merge. Report: docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md.
**Prompt document name**: 2026-10-04 11:30

## 2026-10-04 — feat: styles of the I/O board's front panel, what is drawn (P-2026-10-04-1131)
**Prompt**: `claude_2026-10-04_1131_prompt_sim_io_panel_faces.md`, heavy tier, `~/jjodel-w-iopanel` on `sim-io-panel`, second of the chain after P-2026-10-04-1130, lane auto: R-SIM-130..133, themes, shapes, icons, display sizes, columns and the floating window, keycaps and shortcuts, silkscreen, buzzer, the editor's style controls and icon picker; tests first, probe on 3084, no merge.
**Files touched**: `c79cf7774`: `model/simulation/boardCodec.ts`, `sim/SimBoard.scss`, `sim/SimBoardEditor.scss`, `sim/SimBoardEditor.tsx`, `sim/simBoardDevices.tsx`, `sim/simViewerPrefs.ts`, `sim/simBoardLook.ts` (new), `sim/simBoardSound.ts` (new). `372273fd8`: `boardCodec.test.ts`, `simViewerPrefs.test.ts`, `simBoardCard.test.ts`, `simBoardLook.test.ts`, `simBoardSound.test.ts` (new), two base markup fixtures (new). This commit: `docs/decisions.md` (R-SIM-130..133), the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set; vitest 7405/7405 in 299 files, the 9 known suites red at import; build exit 0; mutation bench 58/58; a board without the new fields renders the markup of `ab7907ad9` but for the keycaps, `aria-keyshortcuts`, the card's tabindex and the Pop out button; the four demo scenes 50/50 base and after, 0 differing paths.
**Out-of-scope changes**: yes — `boardCodec.ts` and its test, outside `sim/`, for a bug found here as the DOVE allows (a Pulse LED's absent colour amber). Eight code files and seven test files over two commits, above five (rule 19), all in the DOVE by directory; `SimulationPanel.tsx` named by the prompt and untouched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3084, 1600×1000, light: panel 32/32, scenes diff 0; crops in `~/.jjodel-lanes/P-2026-10-04-1131/`; the chat's visual check pending, RC-23)
**Notes**: The mock-up was not visible to the lane: role colours, swatches and the faces by theme were chosen and listed in R-SIM-130. The base scenes ran on the six sources restored from HEAD by copy, the index untouched (P13), then restored and compared byte for byte. A wide window's first place can sit under the canvas layer's Globals control: for the visual check. No discovery of its own (RC-11).
**Prompt document name**: 2026-10-04 11:31

## 2026-10-04 — ticket: a front panel press with an icon truncates its label in one cell
**Ticket**: On Variant B a key-shaped Button one cell wide (80.5 px on 4 columns) with an icon and a label of six characters or more shows the label cut with an ellipsis: «+ Coin» reads «+ C…» in the crop `_tmp_iopanel_B_graphite.png`. The text is still the title and the aria-label. Seen by the chat's visual check (RC-23) of P-2026-10-04-1131, no fix in that lane; the way out is a span of 2, the mode `icon`, or a smaller font or a tighter gap on the press.
**Priority**: low
**Found in**: P-2026-10-04-1131

## 2026-10-04 — ticket: a wide floating board can open under the canvas layer's Globals control
**Ticket**: A 6- or 8-column board opens as a floating window at the card slot's left, 16 px under the toolbar (R-SIM-132); its top right corner then sits under the canvas layer's Globals and «Inspect node.[x]» controls, which paint above it (crop `_tmp_iopanel_B_six_columns_window.png`). The window drags away and keeps its place as a viewer pref. Seen by the lane probe and the chat's visual check of P-2026-10-04-1131, no fix in that lane; the way out is a first place at the slot's bottom, or the window above that layer.
**Priority**: low
**Found in**: P-2026-10-04-1131

## 2026-10-04 — merge: sim-io-panel into alfonso-frontend-jjtl (P-2026-10-04-1540)
**Prompt**: `claude_2026-10-04_1540_prompt_merge_sim-io-panel.md`, a direct merge by `lane-run merge --direct`, no session: `sim-io-panel` at `5525c3e7c` into `alfonso-frontend-jjtl`, merge base `452efc6f1`, 9 commits on the branch side.
**Files touched**: merge `19b29dc2b`: 26 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-04_sim_io_panel_styles.md`, `docs/log-inbox/simulation.md`, `docs/prompts/claude_2026-10-04_1130_prompt_sim_io_panel_model.md`, `docs/prompts/claude_2026-10-04_1131_prompt_sim_io_panel_faces.md`, `frontend/src/components/editor-v2/sim/SimBoard.scss`, `frontend/src/components/editor-v2/sim/SimBoardEditor.scss`, `frontend/src/components/editor-v2/sim/SimBoardEditor.tsx`, and 18 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `19b29dc2b` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 7437 tests in 301 files, 9 red at import, hooks 424; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Merge 19b29dc2b, eight gates green (typecheck 14, vitest 7437, build 0, checks 0); union on docs/decisions.md places D-UI-16 right after D-UI-15; 3001 answers 200. RC-23 already passed on the branch crops (5525c3e7c). GO for the closure.
**Notes**: Rollback tag `pre-sim-io-panel` on `da3a18d72` (RC-31). Union: `docs/decisions.md`, `docs/log-inbox/simulation.md`. Worker and gates: `~/.jjodel-lanes/P-2026-10-04-1540/result.json`.
**Prompt document name**: 2026-10-04 15:40

## 2026-10-04 — feat: an implicit Clock on the I/O board, auto-start and idle ticks (P-2026-10-04-1625)
**Prompt**: `claude_2026-10-04_1625_prompt_sim_clock_auto.md`, heavy tier, `~/jjodel-w-clockauto` on `sim-clock-auto`, lane auto: R-SIM-134 (an optional `autoStart`, on for new clocks, armed with the run), R-SIM-135 (the clocks owned by the panel, ticking with the board closed), R-SIM-136 (a tick that enables nothing is not a step); discovery committed first, tests first, probe on 3085, no merge.
**Files touched**: `c106cb329`: `docs/discovery/discovery_2026-10-04_sim_clock_auto.md` (new). `3a71b2a21`: `model/simulation/boardCodec.ts`, `sim/simBoard.ts`, `sim/simBoardClock.ts`, `sim/simBoardFace.ts`, `sim/simBoardDevices.tsx`, `sim/SimulationPanel.tsx`, `sim/SimBoardEditor.tsx`. `7aa9e4889`: `boardCodec.test.ts`, `simBoard.test.ts`, `simBoardClock.test.ts`, `simBoardFace.test.ts`. This commit: `docs/decisions.md`, the report's addendum, the prompt's Status, this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0; mutation bench 33/35, two survivors equivalent; the four demo scenes 50/50 base and after, 0 differing paths.
**Out-of-scope changes**: no (seven code files and four test files over two commits, above five (rule 19), each named by the report's §6 inside the DOVE, which asked for that list)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe on 3085, 1600×1000, light: microwave 20/20, scenes diff 0; crops in `~/.jjodel-lanes/P-2026-10-04-1625/`; the chat's visual check pending, RC-23)
**Notes**: Owner: the panel, not a singleton. Manual clocks freed from the card too. Collapse does not unmount the panel: it switches the clocks off with reason `panel`. Idle test = the button's grey test, structural: a guard-refused tick is still a discard step (report R3). The panel does not import under the node bench: its wiring is measured by the probe only. Report §5 and addendum.
**Prompt document name**: 2026-10-04 16:25

## 2026-10-04 — fix: the Clock's keycap above its corner on the front panel (P-2026-10-04-1625)
**Prompt**: the chat's RC-23 on the six crops of P-2026-10-04-1625, pass with one fix: on Variant B the Clock's keycap covered its tick counter; move the keycap or the counter, both readable on the four themes and Variant A, face and cell sizes unchanged; one fix commit, the B crops retaken, typecheck, tests, build. Same prompt file, same session.
**Files touched**: `836d36936`: `sim/SimBoard.scss`. This commit: `a43bf38f2`'s rewrite of the lane's entry above undone verbatim (`Log-Repair: a43bf38f2`), this entry.
**Outcome**: ✅ completed
**Corregge**: 2026-10-04 16:25
**Causa**: (d)
**Regressions**: no. After the fix: typecheck 14, the §17 set; vitest 7458/7458 in 301 files, the 9 known suites red at import; build exit 0, chunk-size warning only.
**Out-of-scope changes**: no (`sim/SimBoard.scss`, outside the report's §6 and inside the DOVE, is the file of the fix the chat asked)
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: the after crops, Variant B graphite and print, keycap T and counter both readable; Variant A, the keycap over the toggle's corner as before
**Notes**: On Variant B the device has no edge: only the Clock's keycap moves, `top: -9px`, into the front's 12 px padding or the 10 px gap between rows. Probe on the four themes and Variant A, before and after: no keycap over a counter, period, name, switch or another device; every cell, face, counter and switch box as before; Variant A's keycap where it was.
**Prompt document name**: 2026-10-04 16:25

**Ticket** (low, found in P-2026-10-04-1625): the lane probe's check «the keycap is the topmost element at its pixel» fails on every clock, Variant A included, which the fix did not move; the chat read the Variant A after crop and found the T keycap fully visible over the button's corner, so the check is a probe artifact (the keycap takes `pointer-events: none`; toggling it for the measure did not change the reading), no code change. A later probe of keycaps should read the pixel colour instead.

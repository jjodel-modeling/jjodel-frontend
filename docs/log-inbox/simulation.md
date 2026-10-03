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

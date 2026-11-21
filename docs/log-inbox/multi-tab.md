# log-inbox — lane «multi-tab»

Entries written by the multi-tab lanes (P9, parallel lanes). Whoever closes the batch moves them
into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and empties this file. The
active log is not touched by this lane.

## 2026-11-07 — merge: multi-tab into alfonso-frontend-jjtl (P-2026-11-07-0041)
**Prompt**: `claude_2026-11-07_0041_prompt_merge_multi-tab.md`, a direct merge by `lane-run merge --direct`, no session: `multi-tab` at `1ab4568ff` into `alfonso-frontend-jjtl`, merge base `6fcf5d5df`, 11 commits on the branch side.
**Files touched**: merge `0d48b6eb0`: 3 files from the branch side (`docs/discovery/discovery_2026-11-06_multi_tab_viewpoints.md`, `docs/prompts/claude_2026-11-06_2350_prompt_multi_tab_viewpoints_discovery.md`, `docs/prompts/claude_2026-11-07_0030_prompt_multi_tab_viewpoints_discovery_cont.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0d48b6eb0` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 14495 tests in 537 files, 3 red at import, hooks 967; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge: discovery report of the multi-tab front and the Status flips of its two prompts; no source change
**Notes**: Rollback tag `pre-multi-tab` on `03be29abc` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-07-0041/result.json`.
**Prompt document name**: 2026-11-07 00:41

## 2026-11-07 — fix: a model tab stops rewriting the viewpoint of the other open tabs
**Prompt**: lane L1 of multi-tab (R-MT-16): the mount-only restore of the saved viewpoint runs only for the dock's active tab; the preference is written by the picker, for its own model only
**Files touched**: frontend/src/components/abstract/tabs/EditorSwitch.tsx, frontend/src/components/editor-v2/Toolbar.tsx, frontend/src/components/abstract/tabs/__tests__/editorSwitchViewpointPrefs.test.ts (d9949895c)
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (GO 2026-11-07, RC-23: scenes 1, 2, 3a, 4 FAIL on base, PASS after; 3b known gap, B's saved abstract syntax not restored, deferred to L2)
**Notes**: Test red 10/10, green 10/10; mutation bench kills the guard (1) and an id-blind active check (2); React wiring not executed by the bench (node, no DOM). Picker deps kept [modelId]: two source-text tests slice up to it. 3b: `!savedVpId` skips the '' preference, pre-existing and outside R-MT-16. Probe and outputs in ~/.jjodel-lanes/P-2026-11-07-0105/.
**Prompt document name**: 2026-11-07 01:05

## 2026-11-07 — merge: multi-tab-l1 into alfonso-frontend-jjtl (P-2026-11-07-0231)
**Prompt**: `claude_2026-11-07_0231_prompt_merge_multi-tab-l1.md`, a lane session after `lane-run merge --direct` fell back: `multi-tab-l1` at `842094952` into `alfonso-frontend-jjtl`, merge base `f4c031b3e`, 3 commits on the branch side.
**Files touched**: merge `04b782a5b`: 5 files from the branch side (`docs/log-inbox/multi-tab.md`, `docs/prompts/claude_2026-11-07_0105_prompt_multi_tab_l1_editorswitch_crosswrites.md`, `frontend/src/components/abstract/tabs/EditorSwitch.tsx`, `frontend/src/components/abstract/tabs/__tests__/editorSwitchViewpointPrefs.test.ts`, `frontend/src/components/editor-v2/Toolbar.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `04b782a5b`: typecheck exit 0, no error TS; typecheck:scripts exit 0; vitest 14505 tests (14495 + 10 new), 3 red at import, 3 load timeouts red on the trunk tip too and green alone; hooks 967; build exit 0; check:docs 5/5; check:agents, check:scripts, check:addonly PASS.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: smoke on 3001 and GO in C-2026-11-06-2333; RC-23 done on lane P-2026-11-07-0105
**Notes**: Union on docs/log-inbox/multi-tab.md: the trunk block was empty, result equals the branch side, only the markers removed. Branch vitest not runnable read-only in /Users/alfonso/jjodel-w-mtl1 (no node_modules); the 10 new tests were counted in the source and confirmed after the merge. The tip moved before this commit: textual-d-writing-aids merged by another chat (5e1179252), my two files untouched.
**Prompt document name**: 2026-11-07 02:31

## 2026-11-07 — merge: multi-tab-l0b into alfonso-frontend-jjtl (P-2026-11-07-0351)
**Prompt**: `claude_2026-11-07_0351_prompt_merge_multi-tab-l0b.md`, a direct merge by `lane-run merge --direct`, no session: `multi-tab-l0b` into `alfonso-frontend-jjtl`; closed by hand by the project chat after the worker stopped blocked.
**Files touched**: merge `38f2f079d`: the L0b report `docs/discovery/discovery_2026-11-07_layout_switch_after_242a82bcd.md` and the Status of `docs/prompts/claude_2026-11-07_0106_prompt_multi_tab_l0b_layout_switch_probe.md`; this commit: this entry, the Status of the merge prompt, R-MT-18..19, the session checkpoint.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `38f2f079d` in the worker all green except vitest, 2 failed in `languageService.test.ts` and `outline.test.ts` (timing budgets under load about 120); rerun alone at load 7: 67/67 green.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Rollback tag `pre-multi-tab-l0b` on `275486660`. Docs-only merge; the red files are timing tests outside the merge. Worker and gates: `~/.jjodel-lanes/P-2026-11-07-0351/result.json`.
**Prompt document name**: 2026-11-07 03:51

## 2026-11-07 — fix: a viewpoint switch re-transforms every vertex once (R-MT-19)
**Prompt**: `claude_2026-11-07_0430_prompt_multi_tab_layout_key_fix.md`, lane full, critical zone: the layout key becomes an input of the incremental sync of `useJjomSync.ts`, LIR first, red tests first, fix, gates; visual check in lane P-2026-11-07-0431.
**Files touched**: `docs/discovery/lir_2026-11-07_layout_key_resync.md` (f17528bb1); `frontend/src/components/editor-v2/sync/__tests__/vertexSnapshotLayoutKey.test.ts` (b1c6dd226); `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, `frontend/src/components/editor-v2/sync/vertexSnapshot.ts` (03a093081); this entry and the Status of the prompt file, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. No app check in this lane (lane 0431). Gates on 03a093081: typecheck exit 0; vitest 14532 passed, 2 skipped, 3 files red at import (the §17 set); build exit 0, chunk-size warning only; check:docs exit 0.
**Out-of-scope changes**: yes. Six files, all named by the prompt. The selector-2 body and the `:1406` comparison moved verbatim into `vertexSnapshot.ts`, so the bench executes them: beyond the bare key check.
**Layer Impact Report**: produced
**Smoke visivo**: app probes passed (lanes 0431 on 03a093081, 0628 on 8328662df): layout switch 3|3 on all 6 steps × 3 runs, container switch c0 = c2; Alfonso's visual GO still owed (crops in ~/.jjodel-lanes/P-2026-11-07-0555/crops-0628/)
**Notes**: Red 8/8 on b1c6dd226, green 8/8. Bench: dropping term:layoutKey kills 3, the key on edges 1, the ch: comparison 3. The key sits in each vertex's ch: number, not a per-run flag, so the anti-bounce carry-over keeps the old key (LIR). Not executed by the bench: the hook wiring and the transformer (joiner, no DOM). The prompt's reference lir_2026-10-21_jjomsync_incremental.md does not exist in docs/discovery.
**Prompt document name**: 2026-11-07 04:30

## 2026-11-07 — perf: a key-only layout switch skips the transformer (R-MT-19)
**Prompt**: `claude_2026-11-07_0555_prompt_multi_tab_layout_key_cost.md`, lane full, critical zone: cut the cost of the re-transform 0430 added to a viewpoint switch; items 3-5 (probes, gates, closure) continued by P-2026-11-07-0628 after the soft context ceiling.
**Files touched**: `docs/discovery/lir_2026-11-07_layout_key_resync.md` (e6241d590, closing addendum in the 0628 docs commit); `frontend/src/components/editor-v2/sync/__tests__/vertexSnapshotLayoutKey.test.ts` (e6aa6c026); `frontend/src/components/editor-v2/hooks/useJjomSync.ts`, `frontend/src/components/editor-v2/sync/vertexSnapshot.ts` (8328662df); this inbox and the Status of prompts 0430, 0431, 0555, 0628 (0628 docs commit).
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-07 04:30
**Causa**: (c)
**Regressions**: unknown
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile in this lane: app probes pass on 8328662df (layout 3|3 on all 6 steps × 3 runs, container c0 = c2); Alfonso's visual GO is owed
**Notes**: Switch on the 407-object model, head minus parent: +474 ms mean over 3 pairs (0431: +723), above the 300 ms target; noisy pairs. LObject.name reads per switch dropped from 3458 to 407. Sync files +10 ms (was +231). The rest is React Flow (+186) and DynamicHandles (+149) on nodes that really move, out of scope; acceptance is Alfonso's call. Vitest ms-budget reds are from load: green when rerun alone. 9 files across the lanes, all named by the prompts. Figures in the LIR addendum.
**Prompt document name**: 2026-11-07 05:55

## 2026-11-07 — merge: multi-tab-layout-key into alfonso-frontend-jjtl (P-2026-11-07-0748)
**Prompt**: `claude_2026-11-07_0748_prompt_merge_multi-tab-layout-key.md`, lane full (merge): `multi-tab-layout-key` at `9353e859e` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `da2af3bf7`: the 9 files of the branch (LIR, this inbox, 4 prompts, `useJjomSync.ts`, `vertexSnapshot.ts`, `vertexSnapshotLayoutKey.test.ts`); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `da2af3bf7`: typecheck and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 541 files, 14586 tests as expected (tip 14567 + 19), 2 failed and 1 hook failed (timing, Chromium close hook), red on the tip too, 72/72 green alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato: chat RC-23 on the 0628 crops of the same code 8328662df (layout switch A-B-A and reload 3/3 at every step, container switch 0 failures; crop_2_B nodes at B positions, light theme)
**Notes**: Merge tree `6314007db` equal to the merge-tree measure; probes 12/12 once. Branch vitest count not run in `/Users/alfonso/jjodel-w-mtlk` (no node_modules there; writing forbidden): the new file's 19 tests counted at `9353e859e` and confirmed 19/19 on the merge. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 07:48

## 2026-11-07 — fix: problem producers clear only on the last unmount of a model
**Prompt**: `claude_2026-11-07_0833_prompt_multi_tab_l4b_problem_producers.md`, lane L4b: a ref count per (producer, model) in `problems/registry.ts`, so closing one tab no longer erases the badges of another tab on the same model (discovery §4.2).
**Files touched**: `fd90572de`: `problems/__tests__/producerMounts.test.ts` (new); `65e74534d`: `problems/registry.ts`, `ConformanceProblemSync.tsx`, `SimCheckProblemSync.tsx`, `ValidationFreshnessSync.tsx`; this commit: this entry and the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates: typecheck exit 0, build exit 0, check:docs 5/5; vitest 542 files, 14591 passed, 4 files red: the 3 known `window` imports and `irCollapsedRender` (Chromium close hook timeout), 13/13 green alone. The two-tab path is not reachable until L6, so no app check.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (reachable from L6)
**Notes**: Counted per producer AND model: one editor releases its producers in sequence, a shared count would never reach zero on the first. Uniqueness has no unmount cleanup, unchanged. The three effects now key on [modelid] (Conformance was []), so an in-place model switch clears the old model at its last release. The last conformance instance also clears entries owned by the model it did not write. Mutation bench in `65e74534d`: 4 mutations, all killed.
**Prompt document name**: 2026-11-07 08:33

## 2026-11-07 — merge: multi-tab-l4b into alfonso-frontend-jjtl (P-2026-11-07-0853)
**Prompt**: `claude_2026-11-07_0853_prompt_merge_multi-tab-l4b.md`, lane full (merge): `multi-tab-l4b` at `a9d626afe` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `ee9d7dbba`: the 7 files of the branch (this inbox, the L4b prompt, `problems/registry.ts`, `ConformanceProblemSync.tsx`, `SimCheckProblemSync.tsx`, `ValidationFreshnessSync.tsx`, `producerMounts.test.ts`); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Gates on `ee9d7dbba`: typecheck and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 542 files, 14593 tests as expected (tip 14586 + 7), 0 failed, 4 files red: the 3 known `window` imports and `irCollapsedRender` (Chromium close hook timeout), red on the tip too, green alone. The two-tab path has no app check before L6.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile (two tabs on one model are reachable only from L6; chat GO on 7 unit tests and a mutation bench of 4 mutants)
**Notes**: Merge tree `1447dede4` equal to the merge-tree measure; probe 1/1 once. Branch vitest count not run in `/Users/alfonso/jjodel-w-mtl4b` (no node_modules there; writing forbidden): the 7 new tests taken from the branch entry and confirmed 7/7 on the merge. Trunk tip also had an `elementWaiterScope` timing red, green alone. Status reads "non applicabile", not the template's "passata", per the GO. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 08:53
## 2026-11-07 — feat: per-tab viewpoint plumbing, saved abstract syntax restored (multi-tab L2)
**Prompt**: lane L2 of multi-tab (P-2026-11-07-0440): tab viewpoint state in EditorSwitch, optional viewpointId on EditorContext, viewport key and R3 from it, getLayoutKeyFor beside getLayoutKeyOf, picker writes the tab value (Q2), focus write (Q7), R-MT-18
**Files touched**: docs/discovery/lir_2026-11-07_tab_viewpoint_plumbing.md (029d1ea4e); vertexLayoutAdapter.test.ts, editorSwitchViewpointPrefs.test.ts (2f1f166b8); vertexLayoutAdapter.ts, EditorContext.tsx, EditorSwitch.tsx, EditorV2.tsx, Toolbar.tsx (a99ea2482)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (P-2026-11-07-0457, 3 runs per tree: V1, V2, R-MT-18 3/3; V3 +1 undo step per focus write; one tab equal to base 52/52; LIR addendum)
**Notes**: Red 7/26, green 26/26. Gates: typecheck 0, build 0, vitest 7 files red: the 3 baseline imports, plus languageService, tolerant (timing), laneBoard (port 4700 held by the live board) and irSelectionRing under load, all green rerun alone. App check owed to the continuation lane: LIR §5 V1-V3 are visible with two model tabs (focus restores the tab's viewpoint, an undo step).
**Prompt document name**: 2026-11-07 04:40

## 2026-11-07 — fix: the viewpoint write on tab focus adds no undo entry (multi-tab L2)
**Prompt**: lane L2 of multi-tab (P-2026-11-07-0935, R-MT-20): the focus write adds no undo entry, a picker change keeps its own; scope expanded on approval (Alfonso 10:06) to reducer.ts, action.ts, lastViewpoint.ts
**Files touched**: undoGroup.test.ts, editorSwitchViewpointPrefs.test.ts, lastViewpointNoUndo.test.ts (9b9e9b103); EditorSwitch.tsx, action.ts, reducer.ts, lastViewpoint.ts (8ab8077be); undoGroup.test.ts (d16f662ac); reducer.ts (1acbbdf99)
**Outcome**: ✅ completed
**Corregge**: 2026-11-07 04:40
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato (0457 probe copies, 3 runs: V3 +0 undo per focus, control +0; V1, V2, R-MT-18, one tab identical to 0457 run 1)
**Notes**: (1) Focus -> activateViewpoint -> SetFieldAction + SetRootFieldAction; fire() queues them in the open 300 ms batch; _reducer pushes the CompositeAction delta. Limit: noUndo is read on the dispatched action, or on a CompositeAction whose every action has it; a mixed batch keeps its entry. The planned one-line check missed the batch (app V3 still +1, Causa (c) second); widened at the same line, red d16f662ac. Gates: typecheck 0, build 0, vitest 3 baseline + 4 timing green alone.
**Prompt document name**: 2026-11-07 09:35

**Ticket** (P-2026-11-07-0935): out of scope, approved: reducer.ts (core), action.ts, lastViewpoint.ts; 7 code and test files, above the five of rule 19. The reducer clause on CompositeAction goes beyond the approved one-line check on the dispatched action: same line, same effect, reported for ratification. The undoGroup harness CompositeAction mock became a class. A dev server reloaded on reducer.ts made the probe time out at B's picker twice (with and without the clause); a fresh server passed 3/3.
## 2026-11-07 — merge: multi-tab-l2 into alfonso-frontend-jjtl (P-2026-11-07-1210)
**Prompt**: `claude_2026-11-07_1210_prompt_merge_multi-tab-l2.md`, lane full (merge): `multi-tab-l2` at `dcd7ed29d` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `02c2ff850`: the 17 files of the branch (this inbox, the LIR, three L2 prompts, `EditorSwitch.tsx`, `EditorV2.tsx`, `Toolbar.tsx`, `EditorContext.tsx`, `vertexLayoutAdapter.ts`, `action.ts`, `reducer.ts`, `lastViewpoint.ts` and four test files); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `02c2ff850`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 550 files, 14764 tests as expected (tip 14743 + 21), 1 failed (`outline` 10 ms budget at 10.03 ms, green 3/3 alone), 3 files red: the known `window` imports. Tip at load ~100: 2 failed, 7 files red, green alone or Chromium close hook only.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat GO on the P-2026-11-07-0935 app check of the same code: focus write +0 undo entries 3/3, picker keeps its entry; V1, V2, R-MT-18 3/3; one tab unchanged)
**Notes**: Merge tree `e75e02472` equal to the merge-tree measure; probes 15/15 once, R-FA-15 absent. Branch vitest count not run in `/Users/alfonso/jjodel-w-mtl2` (no node_modules there; writing forbidden): the 21 new tests counted at `dcd7ed29d` (undoGroup `dt` loop counted twice), the four files 76/76 green on the merge. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 12:10

## 2026-11-07 — feat: the three canvas doors take the tab's layout key (multi-tab L3)
**Prompt**: `claude_2026-11-07_1249_prompt_multi_tab_l3_tab_layout_key.md`, lane full (critical zone): the transformer, the five layout writes and the content-size hook take the tab's layout key, `useJjomSync` gets the tab's viewpoint; continued after the AM-8 soft ceiling with Alfonso's RC-21 answers (the `EditorV2.tsx:610` argument, seven test-mock completions).
**Files touched**: `d9424764a` the LIR; `4678327cc` four new test files, red; `1015af5e1` `jjomTransformers.ts`, `canvasToJjom.ts`, `useJjomSync.ts`, `useContentSize.ts` and seven mocks under `viewpoint/ir/__tests__/`; `0002f1ae4` `EditorV2.tsx` (the `useJjomSync` call only) and `useJjomSyncTabKey.test.ts`; this entry and the Status of the prompt, uncommitted (RC-17).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no: app check P-2026-11-07-1352, single-tab layout probe 3/3 every step x3, container probe 0 failures, 0457 V1/V2/V3/R-MT-18 step lines identical
**Out-of-scope changes**: yes: `EditorV2.tsx` (one call) and the mocks of `irA1Render`, `irC2Render`, `irEmptyRows`, both ratified by Alfonso (RC-21) before their commit
**Layer Impact Report**: produced
**Smoke visivo**: passato (probes and four light-theme crops of P-2026-11-07-1352, LIR §6; Alfonso's visual check due)
**Notes**: useJjomSync takes the tab viewpoint by parameter: EditorV2Inner calls it above the EditorContext.Provider it renders (LIR §0). Gates on 0002f1ae4: typecheck exit 0, 0 error TS; build exit 0; vitest 554 files, 14791 tests (tip 14764 + 27), 1 failed (tolerant 1029 ms > 1000) and 2 Chromium close hooks timed out (irCollapsedRender, irSelectionRing), 82/82 alone; 3 known window files. At the AM-8 stop a broad pkill -f vitest -U uid may have killed other sessions' vitest runs.
**Prompt document name**: 2026-11-07 12:49

## 2026-11-07 — merge: multi-tab-l3 into alfonso-frontend-jjtl (P-2026-11-07-1438)
**Prompt**: `claude_2026-11-07_1438_prompt_merge_multi-tab-l3.md`, lane full (merge): `multi-tab-l3` at `17e21bac6` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, zero conflicts measured.
**Files touched**: merge `9c75afa97`: the 20 files of the branch (this inbox, the LIR, two L3 prompts, `EditorV2.tsx`, `useJjomSync.ts`, `canvasToJjom.ts`, `jjomTransformers.ts`, `useContentSize.ts`, four new test files and seven test mocks); this commit: this entry and the Status of the merge prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `9c75afa97`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts, check:addonly PASS, hooks 967/967; vitest 557 files, 14856 passed and 2 skipped as expected (tip 14829 + 27), 0 failed, 3 files red: the known `window` imports.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat GO on the P-2026-11-07-1352 app check of the same code: two tabs on two models at their own viewpoints 4/4, a drag in B writes under its tab key only, single tab 3/3, container 0 failures, 0457 scenes unchanged)
**Notes**: Tip moved during the gates by another chat's docs-only `df5788565` (codegen inbox, 1418 Status), accepted as trunk; probes 14/14 re-run on the merged tree, R-TXT-59 absent. Branch vitest not run in `/Users/alfonso/jjodel-w-mtl3` (no node_modules; writing forbidden): 27 new tests counted at `17e21bac6`. Lane board not restarted: no file under `frontend/scripts/lane-board/`.
**Prompt document name**: 2026-11-07 14:38
## 2026-11-07 — demo: Smart building multi-tab project, built through the app, exported and delivered
**Prompt**: `claude_2026-11-07_1439_prompt_multi_tab_demo_project_cont.md`, continuation of P-2026-11-07-1417 after its context ceiling: run `build.mjs` end to end, check two tabs and the in-tab switch, Download Project, re-import in a fresh profile, deliver to `~/Downloads/`.
**Files touched**: this entry and the Status of the 1417 and 1439 prompt files; no source change. Outside the tree: `~/Downloads/jjodel-multitab-demo.{jjodel,md}` and two crops; scripts and outputs in `~/.jjodel-lanes/P-2026-11-07-1439/`.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (crops of Apartment on Floor plan, Office on Control wiring and Apartment switched to Control wiring, checked by the session)
**Notes**: Second run ALL PASS 24/24: models 19 and 28 objects, two exclusive viewpoints, V1-V4, in-tab switch and back, Office kept its viewpoint, re-import counts and 12 positions (record and DOM). First run: 2 script bugs, fixed in the 1439 copy of `build.mjs`: record collector matched DObject on a `model` field it lacks (12 nulls), export check searched the lz-compressed `state`. Colour is by subclass, not DeviceKind (stated in the md).
**Prompt document name**: 2026-11-07 14:39

## 2026-11-07 — release: 3.1.2, the layout-key fix on the 3.1.1 base (P-2026-11-07-1536)

**Prompt**: `claude_2026-11-07_1536_prompt_layout_key_patch_check_312p.md`, lane full (measurement only): app check of the layout-key fix on `release/3.1.2-patch` (3.1.1 `e080ab534` plus four cherry-picks and the release commit `ea287b0f0`), before the PR.
**Files touched**: this entry and the 1536 prompt file with its Status; no source change on the trunk. Release branch `release/3.1.2-patch`, PR #210 into `dotnet-backend-integration`, merged by Alfonso as `ec4f2543e`, tag `3.1.2` on `ec4f2543e` (a first tag on `e080ab534`, before the merge, was deleted and redone).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Branch: layout probe 3/3 at every step in three runs, container probe 0 failures, 0 page errors. Base 3.1.1: the same probe shows the regression (A→B 0/3), so it sees the bug. Gates by hand on `ea287b0f0`: `tsc --noEmit` exit 0, the six sync test files 105/105, `vite build` exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (measurement; the fix's LIR is the one above)
**Smoke visivo**: passato (Alfonso 2026-11-07 17:38 «i crop vanno bene»: `crop_2_B.png`, `crop_3_A.png`, `crop_5_A_reload.png` in `~/.jjodel-lanes/P-2026-11-07-1536/crops-1536/`)
**Notes**: `release/3.1.2-patch` lacks the 3.1.1 welcome-key seed in `states.ts`; the probes set it themselves, only the branch's smoke seeds are affected. The `staging` CHANGELOG entry `[3.1.2]` was reworded to describe this patch (`4f567dd45`). The merge started the branch's Docker and Azure test-jjodel workflows; the tag starts none. R-MT-23 still names `origin/staging` and a PR to `main`: the release followed Alfonso's 15:32 choice (PR #209 closed, fix-only 3.1.2 from 3.1.1).
**Prompt document name**: 2026-11-07 15:36

## 2026-11-07 — feat: IR resolution follows the tab's viewpoint (multi-tab L5)
**Prompt**: `claude_2026-11-07_1516_prompt_multi_tab_l5_ir_resolution.md`, lane full (critical zone): IR hooks, `IRForm`, the metaclass palette and the Symbol Editor opener take the tab's viewpoint id; cut at the AM-8 ceiling and closed by P-2026-11-07-1730 (remaining gates, app check, crops).
**Files touched**: `a87146a64` the LIR; `7b3cf6d2a` `irTabViewpoint.test.ts`, `metaclassPalette.test.ts`, red; `f2ddead3d` Option A, seven source files: `irResolve.ts`, `useIRContainment.ts`, `IRForm.tsx`, `metaclassPalette.ts`, `SymbolEditorModal.tsx`, `EditorV2.tsx`, `ObjectNode.tsx`, and the React stubs of `irPresentation.test.ts` and `irSimActive.test.ts` (`useContext: () => null`, no assertion changed); 1730: LIR §7, this entry, two Status lines.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no: app check P-2026-11-07-1730, single-tab layout probe 3/3 every step x3, container probe 0 failures, 0457 V1/V2/V3/R-MT-18 and ONE summary lines identical to 1352 r1
**Out-of-scope changes**: yes: `EditorV2.tsx`, `ObjectNode.tsx` and the two test mocks beyond the five files of the prompt, Option A ratified by Alfonso (RC-21) before the change
**Layer Impact Report**: produced
**Smoke visivo**: passato (demo two tabs 18/18 and 25/25 nodes, own colours, x3; L3 pair 6/6, was 6/10; three light-theme crops, LIR §7; Alfonso's visual check due)
**Notes**: Gates. 1516 on f2ddead3d: typecheck exit 0, 0 error TS; vitest 558 files, 14873 passed, 2 skipped; red: 3 known window files, tolerant (1274 ms > 1000), irCollapsedRender and irSelectionRing (Chromium hook timeouts), all green alone. 1730: build exit 0 (chunk warning only), check:docs 5/5. Benches: guard removed, only cross-deps red; null mapped to root, 7 of 14 red. No node-side Symbol Editor opener exists: contract checked by dispatch (LIR §7).
**Prompt document name**: 2026-11-07 15:16

## 2026-11-07 — ticket: publishedChannelSlots is one module-level list for every IR canvas
**Ticket**: `publishedChannelSlots` (`useIRContainment.ts:61`) is a single module-level list shared by every IR canvas: two IR canvases (two tabs, or already two models before multi-tab) overwrite each other's list. Out of L5; L5 made only the cross-deps epoch and bar-orientation resets per instance.
**Priority**: medium
**Found in**: P-2026-11-07-1516
**Detail**: docs/discovery/lir_2026-11-07_l5_ir_resolution_tab_viewpoint.md

## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l5 (P-2026-11-08-0012)
**Prompt**: `claude_2026-11-08_0012_prompt_multi-tab-l5_take_trunk.md`, lane full (trunk into branch, RC-14): the trunk `alfonso-frontend-jjtl` at `5c15e491e` into `multi-tab-l5`, one `--no-ff` merge commit of the explicit sha, merge base `4834b0edb`, 161 trunk commits, 1 conflict measured.
**Files touched**: merge `f2b5d1934`: the 126 files of the trunk side; union resolution of `docs/log-inbox/multi-tab.md` (the trunk's 3.1.2 entry, then the branch's L5 entry and ticket, verbatim); `EditorV2.tsx` auto-merged; this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `f2b5d1934`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:scripts and check:addonly PASS, hooks 967/967; vitest 568 files, 15088 passed and 2 skipped as expected (trunk tip 15070 + 18), 0 failed, 3 files red: the known `window` imports.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat GO C-2026-11-07-0425 on the gates and the clean reading of the auto-merged EditorV2.tsx; the L5 app check P-2026-11-07-1730, crops OK by Alfonso 18:58, stands)
**Notes**: Probes 48/48 once, R-MT-25 absent; union removes 0 lines vs either parent. EditorV2.tsx read whole (5423 lines) by an explorer subagent: disjoint regions, no duplicate. No node_modules here: temporary symlink to ~/jjodel/frontend/node_modules for the gates, removed after (P14). Trunk moved during the gates to docs-only `819c700b5`; the merge stays on `5c15e491e`.
**Prompt document name**: 2026-11-08 00:12

## 2026-11-08 — merge: multi-tab-l5 into alfonso-frontend-jjtl (P-2026-11-08-0055)
**Prompt**: `claude_2026-11-08_0055_prompt_merge_multi-tab-l5.md`, lane full (merge, RC-14): `multi-tab-l5` at `5bcafa843` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `5c15e491e`, 8 branch commits, zero conflicts measured.
**Files touched**: merge `46554f772`: the 16 files of the branch side, no union resolution (index tree `2bab2be03` equal to the merge-tree result); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `46554f772`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts and check:addonly PASS, hooks 967/967; vitest 568 files, 15100 passed and 2 skipped (15102 as expected: trunk tip 15084 + 18), 0 failed, 3 files red: the known `window` imports.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat GO C-2026-11-07-0425 on the merge gates; the L5 app check P-2026-11-07-1730, crops OK by Alfonso 2026-11-07 18:58, and the take-trunk gates on `f2b5d1934` stand for this code)
**Notes**: Probes 5/5 once. Files on both sides: none; governance files on the branch: none. Branch's 18 new tests counted from its test diff: vitest cannot start in the branch tree (no node_modules), not written there. Trunk-tip vitest at load ~112 had 5 timing-bound reds (timeouts, 50 ms budget, Chromium layout); all passed on the merge at load ~16. Lane board untouched, not restarted; 3001 up, not restarted.
**Prompt document name**: 2026-11-08 00:55

## 2026-11-08 — fix: one populate owner per model, the last instance clears (multi-tab L4)
**Prompt**: `claude_2026-11-08_0131_prompt_multi_tab_l4_populate_owner.md`, lane full (critical zone): a per-model populate owner in `syncState.ts`, used by `useJjomSync.ts` to gate the populate creators; the registry clears run on the last instance of the model. Continued by P-2026-11-08-0150 (gates, two-tab measurement, cut at the AM-8 ceiling) and closed by P-2026-11-08-0245 (rerun, regressions, closure).
**Files touched**: `f888be09f` the LIR; `634dceabf` `useJjomSyncPopulateOwner.test.ts`, `populateOwner.test.ts`, red (16 of 18 on `db65de069`); `587aed3cf` `syncState.ts`, `useJjomSync.ts`, `useJjomSyncPopulateOwner.test.ts`; 0245: LIR §7, this entry and the ticket, three Status lines.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no: 0245 on `587aed3cf`, layout probe 3/3 every step x3, container 0 failures, 0457 V1/V3/V2/R-MT-18 17 PASS 0 FAIL, demo tabs 18/18 and 25/25; two-tab scene rerun identical to 0150 (vertex 2 -> 1, registries kept after the owner's close, cleared after the last)
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: passato (probes of 0150 and 0245, pageerrors 0 in every run; four light-theme crops in `~/.jjodel-lanes/P-2026-11-08-0150/`, LIR §7; Alfonso's visual check due)
**Notes**: Gates. 0131 on 587aed3cf: typecheck exit 0, 0 error TS; vitest 570 files, 15124 passed, 2 skipped, 3 files red: the known window imports; bench 10 mutations, all killed. 0150: build exit 0, check:docs exit 0; 0245: check:docs after the closure edits. Departures (console creation through ContextMenu.tsx:321, :325; viewport framing in tab 2; 0150 runs started at load 64.15, rerun at 2.40) and the §3.7 edge duplicate not reproducing on the parent: LIR §7.
**Prompt document name**: 2026-11-08 01:31

## 2026-11-08 — ticket: sync registries have no model key, the last tab of model N clears model M
**Ticket**: The five registries the populate unmount clears (`canvasEdgePairs`, `edgeRefIds`, `canvasUpdatedIds`, `syncModes`, `dropCreatedIds`) are module-level and keyed by element id only: the last tab of model N unmounting clears the entries of an open tab on model M. L4 changed only when the clears run (the last instance of the model), not what they clear; out of L4. Keying them by model needs the writers outside L4 (`canvasToJjom.ts`, `useM1ReferenceEdges.ts`, `jjomTransformers.ts:679`, `EditorV2.tsx`) to pass a model id, or a clear by membership in the model's graph.
**Priority**: medium
**Found in**: P-2026-11-08-0131
**Detail**: docs/discovery/lir_2026-11-07_l4_populate_owner.md

## 2026-11-08 — merge: multi-tab-l4 into alfonso-frontend-jjtl (P-2026-11-08-0737)
**Prompt**: `claude_2026-11-08_0737_prompt_merge_multi-tab-l4.md`, lane full (merge, RC-14): `multi-tab-l4` at `d2b184780` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `db65de069`, 6 branch commits, zero conflicts measured.
**Files touched**: merge `0046f604a`: the 9 files of the branch side (`syncState.ts`, `useJjomSync.ts`, two tests, the LIR, three prompts, `docs/log-inbox/multi-tab.md`), no union resolution (index tree `7d6f75649` equal to the merge-tree result); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `0046f604a`: typecheck (0 `error TS`) and typecheck:scripts exit 0, build exit 0, check:docs 5/5, check:agents, check:scripts and check:addonly PASS, hooks 967/967 (967 + 0); vitest 574 files, 15184 passed and 2 skipped (as expected: trunk tip 15165 + 19), 0 failed tests; files red: the known 3 `window` imports, and two Chromium `afterAll` close timeouts (`irCollapsedRender`, `irSelectionRing`) at load 86, both green alone.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required (the merge writes no code of its own; the critical-zone code it carries has the branch's LIR, `f888be09f`, `docs/discovery/lir_2026-11-07_l4_populate_owner.md`)
**Smoke visivo**: passato (chat GO C-2026-11-07-0425 on the merge gates; Alfonso's Ok 2026-11-08 07:37 on the 0150 crops, and the 0150 and 0245 measurements on the same code)
**Notes**: Probes 17/17 once. Files on both sides: none; governance files on the branch: none. The 19 new tests counted on the merge from the two added files, byte-equal to d2b184780: vitest cannot start in the branch tree (no node_modules), not written there; a first static count said 18. Trunk-tip vitest at load 32: the 3 import reds plus an irCollapsedRender close timeout, 13/13 alone. check:docs 5/5, not the prompt's 4/4. Lane board unchanged, not restarted; 3001 up, not restarted.
**Prompt document name**: 2026-11-08 07:37

## 2026-11-08 — feat: a second tab on one model, Open in new tab and Open beside (multi-tab L6)
**Prompt**: `claude_2026-11-08_0808_prompt_multi_tab_l6_second_tab.md`, lane full: tab-id helper `<modelId>~tab<N>`, decoding at the sites that read a tab id as a model id, `closeTabsForEntity` on every tab of the entity, `openBeside` by tab id, the two menu items on the model row. List widened by Alfonso's GO (RC-21) with `EditorSwitch.tsx`, `ModelTab.tsx`, `MyRcDock.tsx`. Closed by the continuation lanes P-2026-11-08-0852 (app check) and P-2026-11-08-1003 (paint fix of the beside panel).
**Files touched**: `46cde4fdc` and the follow-up: the discovery note; `64b18a050` five test files, red; `89fa42c59` `modelTabId.ts` (new), `TabDataMaker.tsx`, `ModelTab.tsx`, `EditorSwitch.tsx`, `Dock.tsx`, `DockManager.tsx`, `MyRcDock.tsx`, `Navbar.tsx`, `TreeViewContent.tsx`; `7f8e8c0fb` `ScriptTab.scss` (the beside panel is painted); the discovery note, this entry and the three Status flips.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (app probes; the maximized fallback stays red, known limit; Alfonso's visual check due)
**Notes**: Partial: known limits. On 7f8e8c0fb: typecheck exit 0, build passed, the 5 L6 test files 38 passed, check:docs exit 0; no full vitest (no TS changed). App: Open beside painted 3/3, 27 nodes, left 18; Refactoring split 8 nodes; demo 15/15. Red: maximized fallback, tab in a hidden placeholder. Console not observed. Cause c: discovery 2026-11-06 §2.2 missed three readers. Tables: `discovery_2026-11-08_l6_second_tab.md`.
**Prompt document name**: 2026-11-08 08:08

## 2026-11-08 — ticket: the Console reads the dock tab id as a model id
**Ticket**: `components/editors/Console.tsx:846-848,1058-1059` resolve the active tab id with `fromPointer`. On a second tab of a model (`<modelId>~tab<N>`, L6) the lookup misses: no crash, but the Console sees no active model and `:1059` clears its node. Read from the code, not observed at runtime (`.console-tab-v2` is not mounted in the demo layout). JjScript is not affected: measured, it finds the model through the `EDITOR_TYPE_CHANGE` cache. The fix is `modelOfTabId` (`components/abstract/tabs/modelTabId.ts`) at those lines.
**Priority**: medium
**Found in**: P-2026-11-08-0808
**Detail**: docs/discovery/discovery_2026-11-08_l6_second_tab.md

## 2026-11-08 — merge: alfonso-frontend-jjtl into multi-tab-l6 (P-2026-11-08-1156)
**Prompt**: `claude_2026-11-08_1156_prompt_multi-tab-l6_take_trunk.md`: the trunk at `34a511ffb` into `multi-tab-l6`, one merge commit, `--no-ff`, before the branch's own merge (RC-14). Merge base `f64bd6592`, 74 commits on the trunk side, 8 on the branch side.
**Files touched**: merge `7b4a75718`: the 45 files of the trunk side against the first parent (`git diff --name-only 7b4a75718^1 7b4a75718`), none by hand; both sides: `frontend/src/components/abstract/DockManager.tsx`, auto-merged, read top to bottom. Closure commit: this inbox and the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `7b4a75718`: typecheck exit 0; typecheck:scripts exit 0; vitest 15366 passed, 3 skipped, 584 files, the 3 files red at import (trunk 15328 + 38 of the branch); hooks 967; build exit 0; check:docs 5/5; check:scripts and check:addonly PASS. The visual probes were not rerun on the merge commit.
**Out-of-scope changes**: no — above five files only as the merge the prompt names (RC-11), listed by the command in Files touched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat GO (C-2026-11-07-0425) on Alfonso's ok to the 0852 and 1003 crops, taken before the merge; no probe rerun on `7b4a75718`, the trunk merge lane reruns them.
**Notes**: Vitest took three runs: at load 113-146 `tolerant.test.ts` broke its wall-clock guards (1726 and 1086 ms against 1000; 60 against 50 ms) and `irCollapsedRender` a hook timeout; both files green alone twice, run 3 green. `frontend/node_modules` absent: temporary symlink to the shared one (P14), removed after the gates. A hook run overran the tool timeout, stopped, rerun in the foreground. check:docs is 5/5 here, the prompt said 4/4.
**Prompt document name**: 2026-11-08 11:56

## 2026-11-08 — merge: multi-tab-l6 into alfonso-frontend-jjtl (P-2026-11-08-1247)
**Prompt**: `claude_2026-11-08_1247_prompt_merge_multi-tab-l6.md`, lane full (merge, RC-14): `multi-tab-l6` at `76f051677` into `alfonso-frontend-jjtl`, one `--no-ff` merge commit of the explicit sha, merge base `34a511ffb`, 11 branch commits, zero conflicts measured.
**Files touched**: merge `bc4b137cd`: the 21 files of the branch side (`git diff --name-only bc4b137cd^1 bc4b137cd`), none by hand, no union resolution (tree `64b0f76b9` equal to the merge-tree result); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — gates on `bc4b137cd`: typecheck (0 `error TS`) and typecheck:scripts exit 0; build exit 0; check:docs 5/5; check:agents, check:scripts and check:addonly PASS; hooks 967/967 (967 + 0); vitest 584 files, 15381 passed and 3 skipped, 15384 total as stated before the merge (trunk tip 15346 + 38), 0 failed tests, the 3 files red at import. The GO cites no probe rerun on the merge commit.
**Out-of-scope changes**: no — above five files only as the merge the prompt names (RC-11), listed by the command in Files touched.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat GO (C-2026-11-07-0425) on Alfonso's ok of 2026-11-08 11:56 to the 0852 and 1003 crops, the app checks 0852 and 1003 on the same code and the merge gates; this lane ran no probe on `bc4b137cd`.
**Notes**: Probes 5/5 once. Files on both sides: none; governance files on the branch: none. The 38 new tests counted statically at 76f051677 (5 new files), confirmed by the merge total: vitest cannot start in the branch tree (no node_modules), not written there. Trunk-tip vitest at load 115: 4 wall-clock reds in 3 codegen/textual files, 176/176 alone, absent on the merge. A trunk-tip hook run overran the tool timeout, finished in background. check:docs 5/5, not 4/4. Lane board, 3001 not restarted.
**Prompt document name**: 2026-11-08 12:47

**Ticket** (merge prompt, step 6): the `check:addonly` rollback names `3d0cc984d` as the pre-merge tip, but the tip before the merge was `af51a3094`, the prompt's own commit. Not triggered here; run as written it would also drop the prompt commit.

## 2026-11-08 — fix: the beside layout, rail column, width cap, app bar, minimap, toolbar (multi-tab L6b)
**Prompt**: `claude_2026-11-08_1608_prompt_multi_tab_l6b_beside_layout.md` and its continuations `claude_2026-11-08_1633_prompt_multi_tab_l6b_finish.md` and `claude_2026-11-08_1729_prompt_multi_tab_l6b_rail_edge.md`, lane full, layout only: side panels off the left canvas, the 710 cap lifted, the app bar listing the tab beside, the right minimap in its canvas, a toolbar of icons that scrolls in a narrow pane, and (1729) the rail at the window's edge in a split. Extended by L6c, `claude_2026-11-08_1855_prompt_multi_tab_l6c_single_palette.md` and its finish `claude_2026-11-08_2025_prompt_multi_tab_l6c_finish.md`: one Instances palette for a split, following the active pane, the active pane marked on its toolbar, tabs of one model named by viewpoint, each canvas fitting its own area and refitting once on entering a split, auto layout written under its tab's key. Extended by L6d, `claude_2026-11-08_2045_prompt_multi_tab_l6d_divider_inactive_pane.md`, closed by P-2026-11-08-2200: a visible divider with a grip, the cyan mark of the active pane removed, the inactive pane's commands disabled with the first press only activating it.
**Files touched**: `6d229bff2` the note; `1cb96945d` `abstract/style.scss`; `0aff5a02a` `abstract/style.scss`, `properties-with-tree-view.scss`; `541ba4cb8` `Navbar.tsx`; `fa3b09e2f`, `b89421b06` `EditorV2.scss`; `0189a0928` `abstract/style.scss`, `EditorV2.scss`, `properties-with-tree-view.scss`; the note, this entry and the three Status flips. L6c: `efb5cfa2c` the note; `3730eec83` `canvasSplit.ts` and its test (new), `useCanvasSplit.ts` (new), `DockManager.tsx`, `EditorV2.tsx`, `PalettePanel.tsx`, `EditorV2.scss`; `a204ce6ac` `EditorV2.tsx`, `EditorV2.scss`; `15c50dbd8` `Navbar.tsx`; `d10579948`, `7da938887`, `81c7608af` `EditorV2.tsx`; the note `discovery_2026-11-08_l6c_single_palette.md`, this entry and the two Status flips. L6d: `7dbaf45bb` `EditorV2.scss`; `f45805984` `abstract/style.scss`; `efcda31f1` `EditorV2.tsx`, `Toolbar.tsx`, `EditorV2.scss`, `canvasSplit.ts` and its test; the same note, this entry and the Status flip.
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 08:08
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced (L6c, E4: in chat before the diff; the rest not-required)
**Smoke visivo**: passato (app probes at 1600 and 1280, L6c 24/24 four runs; Alfonso's visual check due; L6d 45/45 four runs, Alfonso's visual GO 2026-11-08 21:55)
**Notes**: Typecheck 0, build 0, check:docs 0, vitest 12 files 147 passed. 1729, from Alfonso's look at the 1633 crops: the rail stood between the tabs; `0189a0928` puts its column after the last panel, at the window's edge. Split 3/3 at 1600 and 1280; single tab and Refactoring split same as 1633; demo 15/15. The divider was not dead (1608's probe). R-MT-26 kept every control. Tables and limits: `discovery_2026-11-08_l6b_beside_layout.md`. L6c: `discovery_2026-11-08_l6c_single_palette.md`.
**Prompt document name**: 2026-11-08 17:29

## 2026-11-08 — merge: multi-tab-l6b into alfonso-frontend-jjtl (P-2026-11-08-2223)
**Prompt**: `claude_2026-11-08_2223_prompt_merge_multi-tab-l6b.md`, lane full (merge; zero conflicts measured): bring `multi-tab-l6b` at bc55c840b into the trunk with one `--no-ff` merge commit of the explicit sha, merge base f081ad4f2; re-measure, probes, gates, hard stop for the chat's GO.
**Files touched**: 5a9887622 (merge), 22 files — `frontend/src/components/abstract/DockManager.tsx`, `abstract/style.scss`, `editor-v2/EditorV2.scss`, `EditorV2.tsx`, `Toolbar.tsx`, `hooks/useCanvasSplit.ts`, `panels/PalettePanel.tsx`, `utils/canvasSplit.ts` and its test, `editors/properties-with-tree-view.scss`, `pages/components/Navbar.tsx`, three discovery notes (L6b, L6c, L6e), seven prompts, `docs/log-inbox/multi-tab.md`; docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 586 passed files, 15565 passed, 0 failed and 3 skipped (15568, expected 15546 + 22): the known 3 red at import; hooks 21 files 967/967 (expected 967 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: no (above five files: the merge brings the branch's 22, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat smoke 23:02: 3001 serves the trunk, index, EditorV2.tsx and DockManager.tsx transform with 200; Alfonso's visual GO on the same code on 3061 at 21:55)
**Notes**: No conflict, no union; all probes as expected. Trunk tip full vitest: 2 load reds under concurrent runs (laneRun timeout, outline 10 ms), both green alone; none on the merge. The first trunk hook run went to the background on timeout: stopped, re-run in the foreground. check:docs 5/5, not the prompt's 4/4. Lane board not restarted (no change). Rule 16: active log read only at closure. Tip moved after the merge by docs-only 6fea9e8e2 (P-2026-11-08-2230), another chat.
**Prompt document name**: 2026-11-08 22:23

## 2026-11-19 — fix: sync registries keyed by model (multi-tab L4c)
**Prompt**: `claude_2026-11-19_1530_prompt_multi-tab-l4c-registries-by-model.md`, lane full, critical zone (R-MT-26 item 4, GO 15:28): key the `syncState.ts` registries by model so the last tab of model A no longer clears model B's entries; design §4.4 of the editor groups discovery
**Files touched**: 2837e117d (code): `editor-v2/sync/syncState.ts`, `sync/__tests__/syncStateByModel.test.ts` (new), `hooks/useJjomSync.ts`, `sync/canvasToJjom.ts`, `hooks/useM1ReferenceEdges.ts`, `utils/jjomTransformers.ts`, `hooks/useJjomSelection.ts`, `EditorV2.tsx`; dfef10a39 (docs): `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` §11, `docs/decisions.md` R-MT-29; this commit: the prompt's Status, this inbox
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (above five files: the ten above, all in the prompt's approved list of §4.4; `m1EdgeSweep.ts` needed no change)
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile (no visual change; app probe 6/6 on 3074, chat check 2026-11-19 15:57)
**Notes**: Probe: SmartBuilding registered edges 5/5/5/5 at r0..r3 (5/5/0/0 before, §4.2); Families 8 edges stable; drag kept; drop +1 node, no duplicate edge; save/reload identical. Typecheck 0, vitest 628 passed / 3 known import failures, build ok. S3 rewritten twice (criterion, then a close that never fired), told in §11.4. Shared bucket left for `createCompositionEdgeForObjects` and `transformJjomGraph`.
**Prompt document name**: 2026-11-19 15:30

## 2026-11-19 — ticket: createCompositionEdgeForObjects never finds the child vertex
**Ticket**: Both callers (`ContextMenu.tsx:372`, the classic menu's "Add <Class>"; `createAdapter.ts:468`, `createInstance` with an owner) call `createVertexForObject` and then `createCompositionEdgeForObjects` in the same task. The writer's `findVertexIdForObject` reads `store.getState()`, which does not yet hold the child's vertex (actions reach the store one macrotask later, `action.ts:352`), so it warns `vertex(es) not found` with `childVertexId: null` and returns `null` before `DVoidEdge.new2` and `markCanvasUpdated`. The composition edge appears anyway, drawn later by another writer. The model-keyed mark of L4d is therefore never written at runtime; only the unit test exercises it.
**Priority**: low
**Found in**: P-2026-11-19-1625
**Detail**: docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md

## 2026-11-19 — fix: no clear from a model-less editor, composition edges by model (multi-tab L4d)
**Prompt**: `claude_2026-11-19_1625_prompt_multi-tab-l4d-relaunch.md`, lane full, critical zone (R-MT-26 item 4, go-ahead flag): relaunch of the blocked P-2026-11-19-1610 for the two residues of L4c: a model-less editor's unmount clears nothing, `createCompositionEdgeForObjects` files under the model its callers pass
**Files touched**: d0c786696 (code): `editor-v2/sync/syncState.ts`, `hooks/useJjomSync.ts`, `sync/canvasToJjom.ts`, `contextMenu/ContextMenu.tsx`, `hooks/createAdapter.ts`, `sync/__tests__/syncStateByModel.test.ts`, `hooks/__tests__/createAdapterFlow.test.ts` (:98); 9f73ac082 (docs): discovery §11.5, `docs/decisions.md` R-MT-29 (one sentence); eaad9e54d: ticket in this inbox; ea99c4c40: Status of 1625 and 1610; this commit: this inbox
**Outcome**: ⚠️ partial
**Corregge**: 2026-11-19 15:30 `claude_2026-11-19_1530_prompt_multi-tab-l4c-registries-by-model.md`
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: yes (the ticket entry eaad9e54d in this inbox, outside the approved list; above five files: the seven code files above, all approved)
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile (no visual change; app probe S1-S6 on 3074, chat check 2026-11-19 16:46)
**Notes**: Probe S1-S5 pass as in L4c (MM 8/5 at r0..r3, Families 8, drag kept, drop +1, save/reload identical). S6: edge kept (B 44 to 45, rendered, 0 dup), mark check fails: both callers reach the writer with childVertexId null (store one macrotask behind), ticket filed. Typecheck 0, vitest 628 / 3 known, build ok. Second cause (c): the prompt assumed the writer marks. Unknown: the A-to-no-model switch then unmount, not measured (§11.5).
**Prompt document name**: 2026-11-19 16:25

## 2026-11-19 — merge: multi-tab-l4c into alfonso-frontend-jjtl (P-2026-11-19-1705)
**Prompt**: `claude_2026-11-19_1705_prompt_merge_multi-tab-l4c.md`, lane full (merge; zero conflicts measured): bring `multi-tab-l4c` at 8b5ff3c6b into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 2f9277a66; re-measure, probes, gates, hard stop for the chat's GO.
**Files touched**: 3ca35aebc (merge), 17 files — `frontend/src/components/editor-v2/sync/syncState.ts`, `sync/canvasToJjom.ts`, `sync/__tests__/syncStateByModel.test.ts`, `hooks/useJjomSync.ts`, `hooks/useM1ReferenceEdges.ts`, `hooks/useJjomSelection.ts`, `hooks/createAdapter.ts`, `hooks/__tests__/createAdapterFlow.test.ts`, `utils/jjomTransformers.ts`, `EditorV2.tsx`, `contextMenu/ContextMenu.tsx`, the editor groups discovery, three prompts, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry and the Status of the prompt
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 628 passed files, 16495 passed, 0 failed and 3 skipped (16498, expected 16482 + 13): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: no (above five files: the merge brings the branch's 17, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-19 17:24, unattended, on the gates and the branch probes S1-S6; Alfonso in the morning digest)
**Notes**: No conflict, no union; merge tree 1e294ae8a equal to the committed tree; probes as expected (R-MT-29 once, R-MT-30 none, three headings once). Step 1 not met to the letter: the 1610 prompt reads superseded, not eseguito; accepted as terminal, named in the prompt's findings, declared in the merge body. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-19 17:05

## 2026-11-19 — feat: editor groups core, Split Right only (multi-tab lane 2a)
**Prompt**: `claude_2026-11-19_1745_prompt_multi-tab-groups-2a-finish.md`, lane full, finish of P-2026-11-19-1600 (stopped at the context ceiling, RC-51): openBeside without its split (Q12), R-MT-30, full gates, probe at 1600 and 1280, visual stop
**Files touched**: P-2026-11-19-1600: 1c248d9e0 (`tabs/dockGroups.ts` + test), b1c458f83 (`DockManager.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx`, `Toolbar.tsx`, `codegen/ui/canvasSelection.ts`, 6 test files); this lane: f0af162bf (`DockManager.tsx`, `__tests__/dockManagerSecondTab.test.ts`), 5a8189689 (`docs/decisions.md` R-MT-30); this commit: this inbox, R-MT-30 GO, Status of 1745 and 1600
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (above five files in the parent: 14 code files; test files outside the listed scope: `myRcDockSecondTab.test.ts`, `editorSwitchSecondTab.test.ts`, `openTextualTab.test.ts`, `dockManagerSecondTab.test.ts`, `dockSecondTabEvents.test.ts`)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-19 18:15 on 3075; probe P1-P7 7/7 at 1600 and 1280, 0 console errors)
**Notes**: Typecheck 0, vitest 629 files / 3 known import failures, build ok, check:docs 5/5. P4 (tab moved group 2 to 1) and P6 (tab activated in group 2) driven through the dock API: per-group strips are hidden until lane 2b. Edge refusals via dockMove, no mouse edge drop. At 1280 group 1's canvas is ~257 px (lane 5, Q14). Probe and crops in ~/.jjodel-lanes/P-2026-11-19-1745/.
**Prompt document name**: 2026-11-19 17:45

## 2026-11-19 — merge: multi-tab-groups-2a into alfonso-frontend-jjtl (P-2026-11-19-1830)
**Prompt**: `claude_2026-11-19_1830_prompt_merge_multi-tab-groups-2a.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-groups-2a` at f0c35e0fc into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 3ca35aebc; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: 9ada8807b (merge), 18 files — `tabs/dockGroups.ts` + test, `DockManager.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx`, `Toolbar.tsx`, `codegen/ui/canvasSelection.ts`, 6 other test files, two prompts, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 1830 and of 1821
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 629 passed files, 16522 passed, 0 failed and 3 skipped (16525, expected 16495 + 27): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (the Status of P-2026-11-19-1821, flipped to superseded on the chat's GO instruction; above five files: the merge brings the branch's 18, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-19 18:46, unattended, on the gates and Alfonso's visual GO on 2a at 18:15; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, resolved by union (trunk's l4c merge entry first, then the branch's 2a entry; a pure 13-line addition over each side). Probes as expected (R-MT-30 once, R-MT-31 none, two headings once). Trunk had 3 commits since the base, not 2: adcf9c6ee adds this prompt on top of 1821, an earlier rendering never run. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-19 18:30

## 2026-11-19 — feat: one tab strip per editor group, groups keep their width (multi-tab lane 2b)
**Prompt**: `claude_2026-11-19_1915_prompt_multi-tab-groups-2b-finish.md`, lane full, finish of P-2026-11-19-1820 (stopped at the context ceiling, RC-51): group 1 widening, 1280 squeezed tabs, probe at 1600 and 1280, gates, commits, R-MT-30 sentence, visual stop
**Files touched**: 021642d48 (`Navbar.tsx`, `navbar.scss`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`, `DockManagerStyles.scss`, `abstract/style.scss`); b25a2b494 (`docs/decisions.md` R-MT-30); this commit: this inbox, Status of 1915 and 1820
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (7 code files, above five; `style.scss` outside the listed scope, approved in chat: the `.dock-hbox` exclusion on the five legacy blocks, 20 selectors, not the 10 first stated)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-19 21:18 «ok molto meglio» on 3082; probe S0-S7 10/10 at 1600 and 1280, 0 console errors)
**Notes**: Widening predates the strips: closing group 1's active tab activates the hidden summary, body summary rule of style.scss collapsed the last group (trunk 9ada8807b identical, 1034/0 px). S6 at 1280 was the same collapse. Gates: typecheck 0, build ok, check:docs 0; vitest 3 known import failures, contextCeiling.test.ts green only with JJODEL_LANE_LOG(_FROM) unset. Probe, crops in ~/.jjodel-lanes/P-2026-11-19-1915/.
**Prompt document name**: 2026-11-19 19:15

## 2026-11-19 — ticket: metamodels always open in the left group
**Ticket**: Reported by Alfonso at the lane 2b visual check: a metamodel opens in the left group (group 1) whatever the active group, not in the active group as G3 says for every artifact. Next lane.
**Priority**: medium
**Found in**: P-2026-11-19-1915

## 2026-11-19 — merge: multi-tab-groups-2b into alfonso-frontend-jjtl (P-2026-11-19-2124)
**Prompt**: `claude_2026-11-19_2124_prompt_merge_multi-tab-groups-2b.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-groups-2b` at b18a0b03d into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 9ada8807b; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: f84c48f21 (merge), 11 files — `Navbar.tsx`, `navbar.scss`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`, `DockManagerStyles.scss`, `abstract/style.scss`, two prompts, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 2124
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 629 passed files, 16522 passed, 0 failed and 3 skipped (16525, expected 16522 + 0, the branch measured identical): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 11, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-19 21:37, unattended, on the gates and Alfonso's visual GO on 2b at 21:18; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, resolved by union (trunk's 2a merge entry first, then the branch's 2b entry and its ticket; a pure addition, 18 lines over the trunk, 13 over the branch). Probes as expected (three headings once). Trunk side 4 files, not 3: c1f08b3c5 adds this prompt. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-19 21:24

## 2026-11-19 — feat: metamodels in editor groups, second tab and Split Right (multi-tab lane mm)
**Prompt**: `claude_2026-11-19_2125_prompt_multi-tab-metamodel-groups.md`, lane full: metamodels open in the active group (G3), second tab `<id>~tab<N>`, Split Right on metamodel tabs, tab viewpoint per metamodel tab, R-MT-31
**Files touched**: c7e6d5661 (`DockManager.tsx`, `EditorSwitch.tsx`, `TabDataMaker.tsx`, `MetamodelTab.tsx`, `Navbar.tsx`, `dockManagerSecondTab.test.ts`, `editorSwitchSecondTab.test.ts`); eed0b25e2 (`docs/decisions.md` R-MT-31); this commit: this inbox, Status of 2125
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (7 code files, above five; `TabDataMaker.tsx` and `MetamodelTab.tsx` outside the listed six, approved in chat 21:41)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-19 22:06 on 3087; probe T1-T7 9/9 at 1600 and 1280, 0 console errors)
**Notes**: Gates: typecheck 0, build ok, check:docs 5/5, vitest 3 known import failures. Metamodel picker stays Abstract syntax until G10; the viewpoint-change probe step is not applicable. Tree View metamodel row does not open a tab: T2/T3 opened through open2 (rail's door). Cut-off active tab in a 396 px group (2b strips) goes to the width lane. Probe, crops in ~/.jjodel-lanes/P-2026-11-19-2125/.
**Prompt document name**: 2026-11-19 21:25

## 2026-11-19 — merge: multi-tab-groups-mm into alfonso-frontend-jjtl (P-2026-11-19-2214)
**Prompt**: `claude_2026-11-19_2214_prompt_merge_multi-tab-groups-mm.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-groups-mm` at f9fe85e46 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base f84c48f21; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: 83a45cf2e (merge), 11 files — `DockManager.tsx`, `EditorSwitch.tsx`, `MetamodelTab.tsx`, `TabDataMaker.tsx`, `Navbar.tsx`, `dockManagerSecondTab.test.ts`, `editorSwitchSecondTab.test.ts`, two prompts, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 2214
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 629 passed files, 16531 passed, 0 failed and 3 skipped (16534, expected 16522 + 9, the branch measured identical): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 11, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-19 22:30, unattended, on the gates and Alfonso's visual GO on the branch at 22:06 on 3087; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, resolved by union (trunk's 2b merge entry first, then the branch's lane mm entry; a pure addition, 13 lines over either side). Probes as expected (R-MT-31 once, R-MT-32 none, two headings once). Trunk side 4 files, not 3: 7f4222a73 adds this prompt. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-19 22:14

## 2026-11-19 — fix: the project tab does not make its group active (multi-tab lane active-group)
**Prompt**: `claude_2026-11-19_2236_prompt_multi-tab-active-group.md`, lane full: a model or metamodel opened from the project dashboard landed in group 1, not the active group; only artifact tabs now count for the active group, R-MT-32
**Files touched**: 52cdcda06 (`dockGroups.ts`, `Dock.tsx`, `DockManager.tsx`, `dockGroups.test.ts`, `dockManagerSecondTab.test.ts`); f83fc698b (`docs/decisions.md` R-MT-32); this commit: this inbox, Status of 2236
**Outcome**: ✅ completed
**Corregge**: 2026-11-19 16:00
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes (6 files, above five, all on the prompt's approved list: the five above and `docs/decisions.md`; `MyRcDock.tsx` untouched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-19 23:15 on 3095; mouse probe 9/9 at 1600 and 1280, 0 console errors)
**Notes**: Root cause: the app bar project label and the dashboard press noted the summary tab, so group 1 went active before open. Filter in noteActiveTab via DockManager's DModel test. Gates: typecheck 0, build ok, vitest 3 known import failures, check:docs 5/5, decisions gates 85/85. Probe without the filter fails the 3 reported steps. Known residue, not this lane: left bar and status bar follow the last artifact tab while the dashboard shows. Crops in ~/.jjodel-lanes/P-2026-11-19-2236/.
**Prompt document name**: 2026-11-19 22:36

## 2026-11-19 — merge: multi-tab-active-group into alfonso-frontend-jjtl (P-2026-11-19-2320)
**Prompt**: `claude_2026-11-19_2320_prompt_merge_multi-tab-active-group.md`, lane full (merge; zero conflicts measured): bring `multi-tab-active-group` at fe8ba6e90 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base 804ddd61d; re-measure, probes, gates, hard stop for the chat's GO.
**Files touched**: d29dcd79c (merge), 8 files — `dockGroups.ts`, `Dock.tsx`, `DockManager.tsx`, `dockGroups.test.ts`, `dockManagerSecondTab.test.ts`, the 2236 prompt, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 2320
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 629 passed files, 16537 passed, 0 failed and 3 skipped (16540, expected 16531 + 6, the branch measured identical): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 8, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-19 23:34, unattended, on the gates and Alfonso's visual GO on the branch at 23:15 on 3095; Alfonso in the morning digest)
**Notes**: Zero conflicts, no union; merge tree 57629800d equals the commit's tree. Probes as expected (R-MT-32 once, R-MT-33 none, the lane heading once). Trunk side 1 file: 80d501973 adds this prompt. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-19 23:20

## 2026-11-20 — feat: editor groups persist per user and project (multi-tab lane 3, G7)
**Prompt**: `claude_2026-11-19_2328_prompt_multi-tab-group-persistence.md`, lane full: groups, tab order, active tabs, widths, active group and tab viewpoints restored at project open from `localStorage`, R-MT-33
**Files touched**: 6ba59e56f and 5099d9d14 (`groupPersistence.ts` + test, `Dock.tsx`, `DockManager.tsx`, `EditorSwitch.tsx`); 93eebb0f5 (`docs/decisions.md` R-MT-33); this commit: this inbox, Status of 2328
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-20 16:06 on 3110; mouse probe 15/15 at 1600, 0 console errors)
**Notes**: Gates: typecheck 0, build ok, vitest 3 known import failures, check:docs 5/5, decisions gates 85/85. The probe caught two defects, fixed before commit: a press moving the active group took no record; tabs not mounted after restore lost their viewpoint (seeded from the plan). Dock calls use `?.` as the test mock lacks them. Crops in ~/.jjodel-lanes/P-2026-11-19-2328/.
**Prompt document name**: 2026-11-19 23:28

## 2026-11-20 — ticket: G7 residues for the width lane
**Ticket**: (1) at 1280 the viewpoint picker of a half-width group does not open (narrow toolbar under the floating rail), so the G7 probe's viewpoint step was not run there; (2) the `loadTab` prop now also serves the `LAYOUT_MODE_CHANGE` handler of `Dock.tsx`, whose `loadLayout` rebuilds model tabs instead of dropping them; not probed, and the handler still reads the first two dock panels as left and right.
**Priority**: medium
**Found in**: P-2026-11-19-2328
**Detail**: docs/decisions.md R-MT-33

## 2026-11-20 — merge: multi-tab-persistence into alfonso-frontend-jjtl (P-2026-11-20-1611)
**Prompt**: `claude_2026-11-20_1611_prompt_merge_multi-tab-persistence.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-persistence` at 7a10ea867 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base d29dcd79c; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: 4d390832f (merge), 8 files — `groupPersistence.ts`, `groupPersistence.test.ts`, `Dock.tsx`, `DockManager.tsx`, `EditorSwitch.tsx`, the 2328 prompt, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 1611
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 630 passed files, 16549 passed, 0 failed and 3 skipped (16552, expected 16537 + 12, the branch measured identical): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 8, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-20 16:26, unattended, on the gates and Alfonso's visual GO on the branch at 16:06 on 3110; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, resolved by union: trunk's 2320 merge entry first, then the branch's G7 entry and ticket, verbatim. Probes as expected (R-MT-33 once, R-MT-34 none, the three headings once). Trunk side 4 files: the 2320 flip, the 1610 and 1611 prompts. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-20 16:11

## 2026-11-20 — fix: the last children[0] readers go through the active group (multi-tab lane 6)
**Prompt**: `claude_2026-11-19_2336_prompt_multi-tab-readers.md`, lane full: Console, navigationUtils, JjScript utils, openTemplateEditor and canvasSelection read the active tab of the dock's first panel; route them through `dockGroups.ts`, one-group behaviour unchanged, outside hits reported only
**Files touched**: 8f6d70f46 (`Console.tsx`, `navigationUtils.ts`, `jjscript/executor/utils.ts`, `openTemplateEditor.ts`, `canvasSelection.ts`, `openTemplateEditor.test.ts`, new `utils/__tests__/navigationUtils.test.ts`); this commit: this inbox
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes (7 files, above five, all on the prompt's approved list: the five and their tests)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (mouse probe 11/11 at 1600, 0 console errors, dev server 3072; Alfonso's look pending at the hard stop)
**Notes**: activeTabId + modelOfTabId (Console, JjScript), modelGroups (navigationUtils counts every group), activeGroup (codegen). Gates: typecheck 0, vitest 3 known import failures only, build ok. Bench: 4 two-group tests die on HEAD. Probe control on HEAD: 9/11, S3 and S4 fail. Crops, probe and control in ~/.jjodel-lanes/P-2026-11-19-2336/.
**Prompt document name**: 2026-11-19 23:36

**Ticket** (lane 6 findings, not fixed): (1) the JjScript probe step does not discriminate: the EDITOR_TYPE_CHANGE cache names Office on HEAD too, so the dock reader of `jjscript/executor/utils.ts` is a fallback the UI rarely reaches. (2) `children[0]` hits left outside the five: `Dock.tsx` 197, 217 (known, R-MT-30), `MyRcDock.tsx` 276, `Navbar.tsx` 736, 1938, 1941. (3) A template tab in group 2 squeezes group 1 to about 135 px (crop s4); lane 5 width rule. (4) The generator pane says «No model conforms to SmartBuilding» with Apartment and Office open, on HEAD too.

## 2026-11-20 — merge: multi-tab-readers into alfonso-frontend-jjtl (P-2026-11-20-1630)
**Prompt**: `claude_2026-11-20_1630_prompt_merge_multi-tab-readers.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-readers` at b82fbe793 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base d29dcd79c; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: 04f913cba (merge), 9 files — `Console.tsx`, `navigationUtils.ts`, `navigationUtils.test.ts`, `jjscript/executor/utils.ts`, `openTemplateEditor.ts`, `openTemplateEditor.test.ts`, `canvasSelection.ts`, the 2336 prompt, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 1630
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 631 passed files, 16556 passed, 0 failed and 3 skipped (16559, expected 16549 + 7): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 9, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-20 16:52, unattended, on the gates and Alfonso's visual GO on the branch at 16:06 on 3072; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, two hunks (shared field lines interleaved), rebuilt from the stage files by union: trunk's four entries first, then the branch's lane 6 entry and ticket, verbatim. Probes as expected. Branch-tree hook run: 1 laneBoard port test timed out (10084 ms, load), green on trunk and merge. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-20 16:30

## 2026-11-20 — feat: the project dashboard opens full screen over the editor groups
**Prompt**: `P-2026-11-20-1632`, lane full: the `project_summary` tab becomes a full-screen view over all groups (groups mounted underneath), toggled by the app bar project label, Esc closes, an artifact opened from it closes it, summary mode while shown, not persisted; R-MT-34
**Files touched**: 37a3dc87f (`Dock.tsx`, `DockManager.tsx`, `abstract/style.scss`, `tabs/dockGroups.ts` + test, `tabs/groupPersistence.ts` + test, `Navbar.tsx`, `pages/dashboard.scss`); this commit: `docs/decisions.md` R-MT-34, this inbox
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: fallito (mouse probe 18/19 at 1600 and 1280, 0 console errors: over the dashboard the status bar still shows the last model's breadcrumb; Alfonso's visual check pending on 3121)
**Notes**: Point 4 needs `StatusBar.tsx` (`_lastSelected` fallback), outside the file list: asked, not done. Group 1 lost its display with the summary tab (`.not-strip` shows only panels with a pinnable header), fixed in style.scss. Gates: typecheck 0, build ok, check:docs 5/5, decisions gates 85/85, vitest 3 known import failures plus contextCeiling.test.ts red only under the lane's JJODEL_LANE_LOG* env (32/32 without). Continuation of session 42462f6f. Crops in ~/.jjodel-lanes/P-2026-11-20-1632/.
**Prompt document name**: 2026-11-20 16:32

## 2026-11-20 — ticket: status bar shows the last model over the project dashboard
**Ticket**: with the dashboard shown (R-MT-34), `StatusBar.tsx` still renders the last model's breadcrumb: the ACTIVE_TAB `project_summary` sets its context to `editor` and `useActiveModel` falls back to `_lastSelected`, which opening a model sets. The old summary tab had the same residue (P-2026-11-19-2236 Notes). Fix outside the 1632 scope: treat `project_summary` as the project context.
**Priority**: medium
**Found in**: P-2026-11-20-1632
**Detail**: docs/decisions.md R-MT-34

## 2026-11-20 — fix: status bar in project mode over the project dashboard
**Prompt**: `P-2026-11-20-1632`, chat check 17:04 (RC-21 recommendation adopted): `StatusBar.tsx` approved for one change, the status bar in project mode while the dashboard shows; probe step at 1600 and typecheck again
**Files touched**: 963973425 (`StatusBar.tsx`); this commit: `docs/decisions.md` R-MT-34 (status bar sentence, probe count), this inbox
**Outcome**: ✅ completed
**Corregge**: 2026-11-20 16:32 (the same lane, its status bar step)
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: yes (`StatusBar.tsx`, approved in the chat check before the change)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (mouse probe 19/19 at 1600, 0 console errors; Alfonso's visual check pending on 3121)
**Notes**: `project_summary` joins the prefixes StatusBar reads as the project context, so `useActiveModel`'s `_lastSelected` fallback no longer reaches the breadcrumb. Closes the ticket filed by this lane. With two groups and group 2 active, a click on the app bar project label opens the dashboard (probe steps P2, P3). Typecheck 0. The R-MT-34 row was written by this lane and not yet merged, so it is corrected in place.
**Prompt document name**: 2026-11-20 16:32

## 2026-11-20 — close: project dashboard full screen, visual GO
**Prompt**: `P-2026-11-20-1632`, closure: Alfonso's visual GO 2026-11-20 17:46 on 3121 («ok funziona»); Status flip, dev server on 3121 stopped
**Files touched**: this commit: the 1632 prompt (Status), this inbox
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-20 17:46 on 3121; mouse probe 19/19 at 1600, 0 console errors)
**Notes**: Closes the two entries above, whose Smoke visivo said the check was pending: they were committed before the GO instead of riding in the closure commit (P13), so the GO is recorded here and they stay as written (add-only). Last code commit 963973425.
**Prompt document name**: 2026-11-20 16:32

## 2026-11-20 — merge: multi-tab-dashboard into alfonso-frontend-jjtl (P-2026-11-20-2159)
**Prompt**: `claude_2026-11-20_2159_prompt_merge_multi-tab-dashboard.md`, lane full (merge; 1 conflict measured, `docs/log-inbox/multi-tab.md`): bring `multi-tab-dashboard` at 27b2de300 into the trunk with one `--no-ff` merge commit of the explicit sha, merge base d2628b041; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: e58a5d187 (merge), 13 files — `StatusBar.tsx`, `Dock.tsx`, `DockManager.tsx`, `abstract/style.scss`, `dockGroups.ts`, `dockGroups.test.ts`, `groupPersistence.ts`, `groupPersistence.test.ts`, `Navbar.tsx`, `dashboard.scss`, the 1632 prompt, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 2159
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 631 passed files, 16562 passed, 0 failed and 3 skipped (16565, expected 16556 + 6): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 13, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-20 22:13, unattended, on the gates and Alfonso's visual GO on the branch at 17:46 on 3121; Alfonso in the morning digest)
**Notes**: One conflict, this inbox, two hunks (shared field lines interleaved), rebuilt from the stage files by union: trunk's lane 6 entry, its ticket and the 1630 merge entry first, then the branch's four 1632 entries, verbatim. Probes as expected (R-MT-34 once, R-MT-35 none, six headings once). New tests counted on the two tabs test files: 37 trunk, 43 branch. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-20 21:59

## 2026-11-20 — discovery: editor chrome parity, stopped before Phase 2 (multi-tab lane edchrome)
**Prompt**: `claude_2026-11-20_1610_prompt_editor-chrome-parity.md`, lane full: one chrome for canvas and text editor, D1..D7 decided by the chat; Phase 1 discovery, then Phase 2 unless a stop condition holds
**Files touched**: 779ea395e (`docs/discovery/discovery_2026-11-20_editor_chrome_parity.md`); this commit: this inbox
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Stop conditions 1 and 2 hold: the Code pill launches the code generator (CodePanel.tsx:9), Text opens a separate txt_ tab (openTextualTab.tsx:46), Text|EBNF|Syntax switches the textual tab's content; SyntaxForm and the EBNF editor are mounted only in TextualTab. Phase 2 would also exceed ten source files. No code, no R-MT rows, no dev server. Questions in the report §7.
**Prompt document name**: 2026-11-20 16:10

## 2026-11-20 — feat: editor chrome parity, narrowed Phase 2 (multi-tab lane edchrome)
**Prompt**: `claude_2026-11-20_1610_prompt_editor-chrome-parity.md`, Phase 2 as narrowed by the chat (16:35): S1 one active-tab style, S2 shared editor bar, S3 `Diagram | Text` as a tab switch; D4, D5 move, D6 deferred; continued after a context ceiling
**Files touched**: fc0d8987b `DockManagerStyles.scss`; f8f03322b `EditorBar.tsx`, `EditorBar.scss`, `representationSwitch.ts`, its test, `Toolbar.tsx`, `TextualTab.tsx`, `TextualTab.scss`; 4ec528ab8 `EditorBar.tsx`, `EditorBar.scss`; docs: `decisions.md` R-MT-33..36, discovery report §8, this inbox
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: yes
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe 12/12 at 1600 and 1280; Split Right residual, report §8.2; Alfonso's visual check pending)
**Notes**: 8 source files, over five: listed above; representationSwitch.ts was not in DOVE. Probe found Split Right pushed out of narrow canvas bars by the switch (−119px at 1600); 4ec528ab8 shrinks the labels first, residual −32px (R-MT-26 scroll). contextCeiling.test.ts red only under lane env. Report: docs/discovery/discovery_2026-11-20_editor_chrome_parity.md §8.
**Prompt document name**: 2026-11-20 16:10

## 2026-11-20 — fix: icon-only Diagram | Text, Split Right never scrolls out (multi-tab lane edchrome)
**Prompt**: chat decision on the Split Right residual (RC-25, unattended): switch icon-only in both bars at every width, Split Right never scrolls out, disabled Text on the existing disabled token, EBNF/Syntax cut left as is, R-MT row amended
**Files touched**: 4ec5f6196 `EditorBar.tsx`, `EditorBar.scss`; docs: `decisions.md` R-MT-34 and R-MT-35 amended, discovery report §8.3, this inbox
**Outcome**: ✅ completed
**Corregge**: 2026-11-20 16:10 claude_2026-11-20_1610_prompt_editor-chrome-parity.md
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe 17/17 at 1600 and 1280; Alfonso's visual check pending)
**Notes**: Icon-only alone could not hold Split Right (the switch was already 59px where it measured −32): the left and middle zones now scroll in `.editor-bar__scroll`, the right zone and rail cell stay out. Split Right gap 443/403 alone, 59/59 left group, 35/35 right group. §8.2's «metamodel alone» rows were the left group of the split: corrected in §8.3.
**Prompt document name**: 2026-11-20 16:10

## 2026-11-20 — fix: one control style for both bars, identity cell removed (multi-tab lane edchrome)
**Prompt**: Alfonso's visual check 21:59-22:07: remove the canvas bar's identity cell; Text tab filter and breadcrumb rows of one height and one bottom line; flat 28px icon buttons, one divider, no zoom pill, one secondary-text style in both bars; R-MT-34 amended
**Files touched**: e36a00f7a `Toolbar.tsx`, `EditorBar.tsx`, `EditorBar.scss`, `TextualTab.scss`; docs: `decisions.md` R-MT-34 amended, discovery report §8.4, this inbox
**Outcome**: ✅ completed
**Corregge**: 2026-11-20 16:10 claude_2026-11-20_1610_prompt_editor-chrome-parity.md
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe-uni and probe-ecp 17/17 at 1600 and 1280, no console errors; Alfonso's visual check pending)
**Notes**: The cell was also the bar's room over the rail: the rail overlay starts at y 91, inside the bar band, so without it Split Right took no click. An empty `editor-bar__rail-reserve` replaces it. Also: status dot-separated from the language, name keeps a 48px floor at 1280. Report §8.4.
**Prompt document name**: 2026-11-20 16:10

## 2026-11-20 — close: editor chrome parity, visual GO (multi-tab lane edchrome)
**Prompt**: `claude_2026-11-20_1610_prompt_editor-chrome-parity.md`, lane full: one chrome for the diagram canvas and the Text tab (D1-D7, R-MT-33..36), closure after Alfonso's visual GO
**Files touched**: code fc0d8987b, f8f03322b, 4ec528ab8, 4ec5f6196, e36a00f7a, 331035777 (`DockManagerStyles.scss`, `EditorBar.tsx`, `EditorBar.scss`, `Toolbar.tsx`, `TextualTab.tsx`, `TextualTab.scss`, `representationSwitch.ts`, its test); docs: `decisions.md` R-MT-33..36, discovery report §1-§8.4; this commit: this inbox, Status of 1610
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes (8 source files, above five; `representationSwitch.ts` and its test not in DOVE)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso GO 2026-11-20 22:51 on 3120; probe-ecp 17/17 and probe-uni at 1600 and 1280, 0 console errors)
**Notes**: GO covers shared bar, neutral active tab, icon-only Diagram|Text, identity cell removed, filter and breadcrumb rows aligned, uniform controls. Partial against the prompt: Phase 2 ran as narrowed by the chat (report §8), D4 (EBNF/Syntax), D5 status move and D6 (tree, shared breadcrumb) deferred. Open finding: the rail overlay's top ignores the tab strip (report §8.4).
**Prompt document name**: 2026-11-20 16:10

## 2026-11-20 — docs: branch R-MT-33 and R-MT-34 renumbered to R-MT-37 and R-MT-38 (multi-tab lane edchrome)
**Prompt**: `claude_2026-11-20_2305_prompt_editor-chrome-renumber.md`, lane fast: the merge lane P-2026-11-20-2257 found the trunk already holding R-MT-33 (editor groups persist, P-2026-11-19-2328) and R-MT-34 (full-screen dashboard, P-2026-11-20-1632); RC-14, the branch resolves the id collision before the merge
**Files touched**: code comments `EditorBar.tsx`, `EditorBar.scss`, `Toolbar.tsx`, `TextualTab.tsx`, `TextualTab.scss`, `DockManagerStyles.scss`; docs: `decisions.md` (the two P-2026-11-20-1610 rows), discovery report §8, this inbox, Status of 2305
**Outcome**: ✅ completed
**Corregge**: 2026-11-20 16:10 claude_2026-11-20_1610_prompt_editor-chrome-parity.md
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Correction to the add-only entries above: in the five entries of P-2026-11-20-1610 (discovery, feat, two fixes, close), R-MT-33 reads R-MT-37 and R-MT-34 reads R-MT-38; «R-MT-33..36» reads «R-MT-35..38». R-MT-35 and R-MT-36 keep their ids. The prompt file of 1610 keeps its text.
**Prompt document name**: 2026-11-20 23:05

## 2026-11-20 — merge: editor-chrome-parity into alfonso-frontend-jjtl (P-2026-11-20-2309)
**Prompt**: `claude_2026-11-20_2309_prompt_merge_editor-chrome-parity.md`, lane full (merge; 2 conflicts measured, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`): bring `editor-chrome-parity` at f2e75e4ed into the trunk with one `--no-ff` merge commit of the explicit sha, merge base d4ddede1d; re-measure, probes, union, gates, hard stop for the chat's GO.
**Files touched**: a448f35d1 (merge), 13 files — `TextualTab.scss`, `TextualTab.tsx`, `DockManagerStyles.scss`, `EditorBar.scss`, `EditorBar.tsx`, `Toolbar.tsx`, `representationSwitch.ts`, `representationSwitch.test.ts`, the editor chrome parity discovery report, the 1610 and 2305 prompts, `docs/decisions.md`, `docs/log-inbox/multi-tab.md`; docs commit — this entry, the Status of 2309
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on the merge: typecheck exit 0 (0 `error TS`), typecheck:scripts exit 0, vitest 3 failed | 632 passed files, 16570 passed, 0 failed and 3 skipped (16573, expected 16562 + 8): the known 3 red at import; hooks 22 files 985/985 (expected 985 + 0), build exit 0, check:docs 5/5, check:agents green, check:scripts PASS, check:addonly PASS.
**Out-of-scope changes**: yes (above five files: the merge brings the branch's 13, listed in Files touched)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat check 2026-11-20 23:27, unattended: 3001 answers 200 and serves the trunk's EditorBar.tsx, the code Alfonso approved visually on 3120 at 22:51; Alfonso in the morning digest)
**Notes**: Two conflicts, one hunk each, union from the stage files: decisions R-MT-33/34 then R-MT-37/38/35/36; this inbox, trunk's ten entries then the branch's six, one blank line between, verbatim. Probes as expected (six rows once, R-MT-39 none, sixteen headings once). New tests: 8 in representationSwitch.test.ts. check:docs 5/5, not 4/4. Lane board not restarted (no change); 3001 up, not restarted. Rule 16: active log not read.
**Prompt document name**: 2026-11-20 23:09

## 2026-11-21 — feat: canvas bar keeps editing, View › Syntax and Colors, syntax chip, overflow (P-2026-11-20-2310)
**Prompt**: `claude_2026-11-20_2310_prompt_canvas_toolbar_rationalization.md`, lane full, discovery then Phase 2 in cascade: syntax and colors leave the canvas bar for View › Syntax and View › Colors, one syntax chip per group, buttons by priority with an overflow menu, Basic and Advanced alike; no data moves.
**Files touched**: defd1fc19 (discovery report); d8fff434d, 10 files — `canvasViewChoices.ts` (new), `ToolbarOverflow.tsx` (new), `CanvasViewControls.scss` (new), `__tests__/canvasViewChoices.test.ts` (new, 23 tests), `Toolbar.tsx`, `EditorV2.tsx`, `ColorSchemeSelector.tsx`, `tabs/EditorSwitch.tsx`, `pages/components/Navbar.tsx`, `__tests__/dataManagerPicker.test.ts`; docs commit — this entry, the ticket below, R-MT-39 in `docs/decisions.md`, the Status of 2310
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: yes (accepted at the GO): in a group below the 280px floor (200px, a third Split Right at 1600) the right zone fills the bar and the editing buttons, before reachable in a 109px scroll box, are out of reach; left to the splitter lane's floor. Nothing else: probe scenes a-d as specified.
**Out-of-scope changes**: yes (above five files, listed in discovery §8; `dataManagerPicker.test.ts` outside that list: six source-text assertions on the eye remapped onto the chip)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe on 3140, scenes a-d measured from the DOM; visual GO from the project chat 2026-11-21, RC-23)
**Notes**: Gates: typecheck 0, build 0, vitest 1 failed test beyond the 3 known import reds, contextCeiling.test.ts, an env leak of this continuation session (ticket below; green with the variable unset). Chip 85px across Structured to ER, no shift. Commit subject shortened, 89 > 72. The eye was the syntax picker, so nothing moved to View as a checkable entry. Phase 2 decisions recorded in R-MT-39, not in a discovery addendum. Rule 16: active log not read in this continuation.
**Prompt document name**: 2026-11-20 23:10

## 2026-11-21 — ticket: contextCeiling.test.ts inherits JJODEL_LANE_LOG_FROM and goes red inside a lane continuation
**Ticket**: `frontend/scripts/hooks/__tests__/contextCeiling.test.ts`, «transcript_path wins over JJODEL_LANE_LOG», expects `deny` and gets null when `npm run test` runs in a session that exports `JJODEL_LANE_LOG_FROM`, as a lane-run continuation does. `run()` resets `JJODEL_LANE_LOG` but not `JJODEL_LANE_LOG_FROM`; `hookRunner.runScript` spawns with `{ ...process.env, ...env }`; `context-ceiling.mjs:265` then scopes the lane log to the session and offset. Measured 2026-11-21: red 3/3 with it, green with `env -u JJODEL_LANE_LOG_FROM`. An empty string does not reset it (`!== undefined` at :265): the helper has to drop the key.
**Priority**: medium
**Found in**: P-2026-11-20-2310

## 2026-11-21 — merge: toolbar-rationalize into alfonso-frontend-jjtl (P-2026-11-21-0028)
**Prompt**: `claude_2026-11-21_0028_prompt_merge_toolbar-rationalize.md`, direct merge by `lane-run merge --direct` (no conflicts, no file changed on both sides, trunk already merged into the branch at f15e52035), rollback tag `pre-toolbar-rationalize` on 92271b39b.
**Files touched**: cbbae0da3 (merge), 14 files from the branch (canvas toolbar rationalization of P-2026-11-20-2310: `Toolbar.tsx`, `ToolbarOverflow.tsx`, `canvasViewChoices.ts` and its test, `CanvasViewControls.scss`, `ColorSchemeSelector.tsx`, `EditorV2.tsx`, `EditorSwitch.tsx`, `Navbar.tsx`, `dataManagerPicker.test.ts`, discovery report, prompt, decisions, this inbox); 366c6a046 (R-MT-39 header).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no in the product. Gates on the merge: typecheck 0, typecheck:scripts 0, build 0, check:docs, check:agents, check:scripts, check:addonly ok; vitest red with 2 failures beyond the 3 known import failures, both in the decisions parser gates (`docsDigest.test.ts` HeaderParseError, `decisionsQuery.test.ts` recogniser ratio): the R-MT-39 header carried a nested parenthesis and no ratification clause. Fixed in 366c6a046 by rewriting the header in the register format; both files then pass (60/60, 25/25) and check:addonly stays clean. The `contextCeiling.test.ts` failure seen in the lane did not reproduce in the merge run.
**Out-of-scope changes**: yes (366c6a046, the R-MT-39 header of this merge's own branch).
**Layer Impact Report**: not-required
**Smoke visivo**: passato (chat RC-23 on the lane shots `advanced-a-chip-popover.png`, `menu-view_notation_wireframe.png` and the DOM measures of scenes a-d, 2026-11-21 00:24; Alfonso in the morning digest)
**Notes**: The direct worker exited `blocked` on the red vitest gate and left the merge commit in place, as designed; the chat fixed the cause on the trunk instead of rolling back.
**Prompt document name**: 2026-11-21 00:28

## 2026-11-21 — fix: right rail toggle moves from the canvas bar to the rail (P-2026-11-20-2250)
**Prompt**: `claude_2026-11-20_2250_prompt_right_rail_toggle.md`: the `>>` rail collapse leaves the canvas bar, where every editor group had one, for the rail's top row; collapsed, the rail leaves a 28px strip whose "Show panel" button sits at the same y. Phase 1 discovery, Phase 2 in a continuation after the context ceiling, on the tree merged with the trunk (R-MT-39).
**Files touched**: 9eafca6ba (discovery report); 49c159ed8 (`frontend/src/components/editor-v2/Toolbar.tsx`, `frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss`); the docs commit of this entry (this inbox, the prompt's Status, the discovery addendum).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown. Measured at 1600x1000 (probe `probe-after.mjs`, 0 console errors): single canvas and two groups, collapse, reopen, reload in both states, Cmd+B, Basic and Advanced; typecheck 0, build 0, 81/81 in the three test files that name `Toolbar`. Not measured: generator tab beside the canvas, Filter-first and Focus-first rows, kill-switch layouts, Jjodie docked.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe, DOM measures and crops `crop-after-1600-*.png` in `~/.jjodel-lanes/P-2026-11-20-2250/`); Alfonso's check pending
**Notes**: The merged tree differs from Phase 1: R-MT-38 removed the identity cell, so the strip's room in the bar is the existing `editor-bar__rail-reserve`, now rendered in every rail state and sized by --jj-rail-width (28 while the strip shows); EditorV2.scss is untouched (the Split Right box is gated in TSX). The strip sits outside the --shell-* roots: var() fallbacks. R-MT-39: the toggle moved, nothing dropped. R-RAIL-11: the inset is still the rail's footprint. Detail: discovery addendum.
**Prompt document name**: 2026-11-20 22:50
## 2026-11-21 — fix: notation and colors persisted per tab (P-2026-11-21-0100)
**Prompt**: `claude_2026-11-21_0100_prompt_per_tab_notation_colors.md`, lane full, discovery then Phase 2 in cascade: notation and colors persisted per tab with the viewpoint's store, read order tab, global key, default; a choice writes both.
**Files touched**: bb0ebf6d9 (discovery report); 0c342c802 — `tabs/groupPersistence.ts`, `tabs/__tests__/groupPersistence.test.ts` (+6 tests), `EditorV2.tsx`, `DockManager.tsx`; docs commit — this entry, R-MT-40 in `docs/decisions.md`, the Status of 0100
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck 0, build 0, vitest 16599 passed with only the 3 known import reds; probe scenes all green
**Out-of-scope changes**: yes (`DockManager.tsx`, not named in DOVE; read as part of the per-tab viewpoint persistence, discovery §0)
**Layer Impact Report**: not-required
**Smoke visivo**: passato (probe by mouse on 3141 at 1600, 11/11, 0 page errors; crops `tabprefs-a/b/c-*.png` in the lane folder)
**Notes**: Mutation bench 8/8 killed (commit message). `canvasViewChoices.ts` and `ColorSchemeSelector.tsx` unchanged: every choice reaches EditorV2's two setters. The probe must press Save before reload, else a new metamodel is lost (pre-existing). The in-memory check after close imports the module in the page; its control proves the module was reached, not that it is the app's instance; the store check is the spec'd one.
**Prompt document name**: 2026-11-21 01:00

## 2026-11-21 — merge: per-tab-view-prefs into alfonso-frontend-jjtl (P-2026-11-21-0127)
**Prompt**: `claude_2026-11-21_0127_prompt_merge_per-tab-view-prefs.md`, a direct merge by `lane-run merge --direct`, no session: `per-tab-view-prefs` at `7d8077241` into `alfonso-frontend-jjtl`, merge base `bacae8815`, 4 commits on the branch side.
**Files touched**: merge `1ca31c62c`: 8 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-11-21_per_tab_notation_colors.md`, `docs/log-inbox/multi-tab.md`, `docs/prompts/claude_2026-11-21_0100_prompt_per_tab_notation_colors.md`, `frontend/src/components/abstract/DockManager.tsx`, `frontend/src/components/abstract/tabs/__tests__/groupPersistence.test.ts`, `frontend/src/components/abstract/tabs/groupPersistence.ts`, `frontend/src/components/editor-v2/EditorV2.tsx`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `1ca31c62c` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 16602 tests in 636 files, 3 red at import, hooks 985; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Chat check 2026-11-21 01:38 (RC-23, unattended): 3001 answers 200 and serves the trunk; the UI is unchanged by this merge and the behaviour was verified by the lane probe on 3141 (11/11 DOM steps, saved-record check). Alfonso in the morning digest.
**Notes**: Rollback tag `pre-per-tab-view-prefs` on `bacae8815` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-11-21-0127/result.json`.
**Prompt document name**: 2026-11-21 01:27

## 2026-11-21 — fix: collapsed rail leaves only the reopen button (P-2026-11-20-2250)
**Prompt**: rework after Alfonso's visual check on 3008 (2026-11-21 09:06): open rail fine; collapsed, leave only the `<<` button, no vertical strip taking space. Continuation after the context ceiling, on the tree merged with the trunk (200b50060).
**Files touched**: 9e1233cbc (`frontend/src/components/editors/PropertiesWithTreeView.tsx`, `frontend/src/components/editors/properties-with-tree-view.scss`, `frontend/src/components/editor-v2/EditorBar.scss`, `frontend/src/components/editor-v2/Toolbar.tsx`, comments only in the last); the docs commit of this entry (this inbox, the prompt's Status).
**Outcome**: ✅ completed
**Corregge**: 2026-11-20 22:50
**Causa**: (f)
**Regressions**: unknown. Probe `probe-rework.mjs` at 1600 and 1280, 0 console errors: one and two panes, collapse, reload collapsed, reopen, Cmd+B, Basic and Advanced; Show rect = Hide rect, vars rail 0 / inset 0 / reopen 32 collapsed, panes margin-right 0, last-pane reserve 31, Split Right and syntax chip hit true. typecheck 0, build ok, 81/81 in the three `Toolbar` test files. Not measured: generator tab beside, kill-switch layouts, Jjodie docked.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (lane probe, DOM measures and crops `crop-rework-{1600,1280}-*.png` in `~/.jjodel-lanes/P-2026-11-20-2250/`); Alfonso's check pending
**Notes**: Causa (f): the strip was the prompt's own item 3, the spec changed at the visual check; (a) arguable. New body var `--jj-rail-reopen-width` from the same single writer; the bar reserve takes max(rail, reopen). Button z-index 899 (one below the column, as the strip was), not the handoff's 900, so the exit still slides over it. Hover background still wins over the tint (measured rgb(233,239,246) under the pointer, rgb(248,250,252) after reload).
**Prompt document name**: 2026-11-20 22:50

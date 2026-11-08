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
**Prompt**: `claude_2026-11-08_1608_prompt_multi_tab_l6b_beside_layout.md` and its continuations `claude_2026-11-08_1633_prompt_multi_tab_l6b_finish.md` and `claude_2026-11-08_1729_prompt_multi_tab_l6b_rail_edge.md`, lane full, layout only: side panels off the left canvas, the 710 cap lifted, the app bar listing the tab beside, the right minimap in its canvas, a toolbar of icons that scrolls in a narrow pane, and (1729) the rail at the window's edge in a split. Extended by L6c, `claude_2026-11-08_1855_prompt_multi_tab_l6c_single_palette.md` and its finish `claude_2026-11-08_2025_prompt_multi_tab_l6c_finish.md`: one Instances palette for a split, following the active pane, the active pane marked on its toolbar, tabs of one model named by viewpoint, each canvas fitting its own area and refitting once on entering a split, auto layout written under its tab's key.
**Files touched**: `6d229bff2` the note; `1cb96945d` `abstract/style.scss`; `0aff5a02a` `abstract/style.scss`, `properties-with-tree-view.scss`; `541ba4cb8` `Navbar.tsx`; `fa3b09e2f`, `b89421b06` `EditorV2.scss`; `0189a0928` `abstract/style.scss`, `EditorV2.scss`, `properties-with-tree-view.scss`; the note, this entry and the three Status flips. L6c: `efb5cfa2c` the note; `3730eec83` `canvasSplit.ts` and its test (new), `useCanvasSplit.ts` (new), `DockManager.tsx`, `EditorV2.tsx`, `PalettePanel.tsx`, `EditorV2.scss`; `a204ce6ac` `EditorV2.tsx`, `EditorV2.scss`; `15c50dbd8` `Navbar.tsx`; `d10579948`, `7da938887`, `81c7608af` `EditorV2.tsx`; the note `discovery_2026-11-08_l6c_single_palette.md`, this entry and the two Status flips.
**Outcome**: ✅ completed
**Corregge**: 2026-11-08 08:08
**Causa**: (d)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: produced (L6c, E4: in chat before the diff; the rest not-required)
**Smoke visivo**: passato (app probes at 1600 and 1280, L6c 24/24 four runs; Alfonso's visual check due)
**Notes**: Typecheck 0, build 0, check:docs 0, vitest 12 files 147 passed. 1729, from Alfonso's look at the 1633 crops: the rail stood between the tabs; `0189a0928` puts its column after the last panel, at the window's edge. Split 3/3 at 1600 and 1280; single tab and Refactoring split same as 1633; demo 15/15. The divider was not dead (1608's probe). R-MT-26 kept every control. Tables and limits: `discovery_2026-11-08_l6b_beside_layout.md`. L6c: `discovery_2026-11-08_l6c_single_palette.md`.
**Prompt document name**: 2026-11-08 17:29

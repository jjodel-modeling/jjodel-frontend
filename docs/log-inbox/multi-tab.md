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

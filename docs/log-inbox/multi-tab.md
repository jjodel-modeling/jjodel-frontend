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

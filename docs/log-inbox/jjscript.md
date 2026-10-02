# log-inbox — lane «jjscript»

Entries written by the JjScript lane while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-01 — perf(jjscript): Run slowdown, attribution and two of three fixes (P-2026-10-01-2136)
**Prompt**: `claude_2026-10-01_2136_prompt_jjscript_run_slowdown.md`, full lane on `~/jjodel-w-runperf`, branch `jjscript-run-perf`. Each Run from Jjodie got slower in a session. Phase 1 measured where each dispatch's main-thread time goes; the GO named three fixes: T8 (R-JS-7), an inactive-tab gate, own-edges handles.
**Files touched**: `ea6b53d92`, `56db69c32`: `frontend/scripts/probe/jjscript-run-slowdown.ts` (new). `30eb9136a`: `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md` (new). `4bbf7e640`: `frontend/src/jjscript/executor/runPasses.ts`, `elementWaiter.ts`, `executor/__tests__/retryPassWait.test.ts` (new). `a17444e9d`: `frontend/src/components/editor-v2/components/DynamicHandles.tsx`, `nodes/ClassNode.tsx`, `utils/__tests__/dynamicHandlesOwnEdges.test.ts` (new). Closure commit: `docs/decisions.md` (R-JS-7), the report's Phase 2 addendum, this file, the prompt's Status.
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (g)
**Regressions**: unknown. typecheck 14, the known set, at each commit; build exit 0; vitest `src/jjscript`, `src/components/editor-v2`, `src/components/abstract/tabs`: 3467 in 138 of 139 files before (inferred), 3488 in 141 of 142 after, `context-binding` red at import (known). Demo scenes: nodes and handles identical, 18 edge paths within 0.0001 px. The memo comparisons have no executing test.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non eseguito — to the chat: Run in Jjodie on a demo scene, handles and edge ends unchanged, a forward reference resolves on retry
**Notes**: Fix 1 not committed: its in-app check could not complete, load averages 200-380 from 20:55 UTC; parked in gitignored `_tmp_fix1_*`. Found: a pre-existing render loop, about 60 Hz, in a hidden editor holding a reference, not redux-driven (report addendum). Probe, baseline run 12: 11.5 s before, 9.8 s after T8, 6.6 s after fix 2. Ticket T8 closed by `4bbf7e640`.
**Prompt document name**: 2026-10-01 21:36

**Ticket** (T9, high): a hidden metamodel editor that holds a reference re-renders about 60 times a second with no dispatch: `useNodesState` and `useEdgesState` are set on every render (scout on `4bbf7e640`, both fixes off). It costs CPU between Runs and is the likely main share of the hidden-tab cost. The inactive-tab gate cannot stop it. Report addendum.

## 2026-10-02 — merge: jjscript-run-perf into alfonso-frontend-jjtl (P-2026-10-02-1445)
**Prompt**: `claude_2026-10-02_1445_prompt_merge_jjscript-run-perf.md`, a merge in a session (`lane-run merge --direct` fell back: a union hunk edits a base section of `docs/log-inbox/jjscript.md`): `jjscript-run-perf` at `7bd293e37` into `alfonso-frontend-jjtl`, merge base `ac3890b7e`, 7 commits on the branch side.
**Files touched**: merge `c3a9c9ffd`: 11 files from the branch side (`docs/decisions.md`, `docs/discovery/discovery_2026-10-01_jjscript_run_slowdown.md`, `docs/log-inbox/jjscript.md`, `docs/prompts/claude_2026-10-01_2136_prompt_jjscript_run_slowdown.md`, `frontend/scripts/probe/jjscript-run-slowdown.ts`, `frontend/src/components/editor-v2/components/DynamicHandles.tsx`, `nodes/ClassNode.tsx`, `utils/__tests__/dynamicHandlesOwnEdges.test.ts`, `frontend/src/jjscript/executor/elementWaiter.ts`, `runPasses.ts`, `executor/__tests__/retryPassWait.test.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `c3a9c9ffd`: typecheck 14, the §17 set; typecheck:scripts exit 0; vitest 6457 in 260 files (the trunk tip's 6442 in 258 plus the branch's 15 in 2 new files), 0 failed, the 9 known files red at import; hooks 344; build exit 0; check:docs 4/4; check:agents, check:scripts and check:addonly PASS.
**Out-of-scope changes**: no. 11 files, above Rule 19's five: all from the branch side, listed above; the merge is the prompt's scope.
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: 12-run check on the branch tip 7bd293e37 (localhost:3002): runs 1-9 at 2.1-2.7 s, runs 10-12 at 3.0-5.5 s against 9-12 s on the trunk at run 12; edges attached on the visible canvas; four demo scenes identical per the lane dumps; the check ran on the branch tip, and the merge shares no code file with the trunk side
**Notes**: Union in `docs/log-inbox/jjscript.md`: the trunk's preamble, then the branch's entry P-2026-10-01-2136 and ticket T9; the base's two entries, folded by `d2eb5fb83` and byte-identical in the active log, not carried back; accepted by the chat at the GO. No rollback tag: the prompt names none, pre-merge tip `9449073e4`. The tip then moved by another chat's merge of ir-corner-clip (`eaead2d71`, `3db161e62`), no file shared with this one.
**Prompt document name**: 2026-10-02 14:45

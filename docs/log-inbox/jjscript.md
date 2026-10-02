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

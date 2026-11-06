# log-inbox — lane «jjodie-ui-pba»

Entries written by the reducer pointedBy lane (front jjodie-ui, branch `jjp-pba`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — fix: reducer resolves parked pointedBy in the batch, one folder entry
**Prompt**: P-2026-10-24-1350, option A of the undo-after-apply report (drain `PendingPointedByPaths` at the end of `CompositeActionReducer`) with tests and a mutation bench, and ticket F8 (every new DVertex carried `vertexs` twice in `pointedBy`), core change authorised by R-JJD-12.
**Files touched**: frontend/src/redux/reducer/reducer.ts, frontend/src/redux/reducer/__tests__/pointedByBatchEnd.test.ts (56ad0e5ee, 08c6ca741); docs/log-inbox/jjodie-ui-pba.md, docs/prompts/claude_2026-10-24_1350_prompt_reducer_pointedby_batch_end.md (this commit)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 02:56
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: skipped
**Smoke visivo**: non applicabile
**Notes**: F8 cause: the hand push at reducer.ts:472 plus PointedBy.add of the derived folder action (:296). Bench: 4 mutants killed, 2 equivalent. On 3010: udo probe, click adds no entry (C1 1->1, C2 2->2, C3 3->3), queue empty, one vertexs per vertex; s4c ALL PASS; smoke GREEN; temp probe ALL PASS (M2 class, M1 object: one Cmd+Z each; Families 8 edges; save/reopen same). LIR: D-layer only, given in the closing report, not in chat before the diff.
**Prompt document name**: 2026-10-24 13:50

## 2026-10-24 — ticket: a rolled-back batch loses the pointedBy its start drain resolved
**Ticket**: `CompositeActionReducer` drains `PendingPointedByPaths` at its start (`reducer.ts:436`), and `resolveDirectly` removes each resolved entry from the queue (`joiner/classes.ts:1886`). If the batch then rolls back (`reducer.ts:547`, `return oldState`), the state with those writes is dropped and the entries are gone from the queue: the `pointedBy` is lost. Read, not measured; predates this lane.
**Priority**: low
**Found in**: P-2026-10-24-1350

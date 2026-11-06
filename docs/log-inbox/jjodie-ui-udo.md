# log-inbox — lane «jjodie-ui-udo»

Entries written by the Jjodie undo-after-apply lane (front jjodie-ui, branch `jjp-udo`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — discovery: the extra undo entry after Apply is a parked pointedBy
**Prompt**: P-2026-10-24-0657, read-only discovery of the `Create element` undo entry (only DVertex `pointedBy`) that a canvas click pushes after a script Apply: its writer, whether it predates S4c, whether it belongs to the Apply group; probe, report with two fix options.
**Files touched**: frontend/scripts/probe/jjodie-udo-after-apply.ts (f69ce438f); docs/discovery/discovery_2026-10-24_undo_after_apply.md (1bfa7192c); docs/log-inbox/jjodie-ui-udo.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Measured on 3014: the click reduces only `_lastSelected`; the entry is the vertex batch's `graph.subElements` pointedBy, parked in PendingPointedByPaths (path sort puts the graph before the new vertex) and drained at the next composite. Same on one creation outside the group, so it predates S4c. Recommended: drain the queue at the end of the batch too (reducer.ts, core, not critical zone). LIR sketch in the report.
**Prompt document name**: 2026-10-24 06:57

**Ticket** (F8 of the report): every new DVertex carries `vertexs` twice in `pointedBy`; candidate `reducer.ts:471-472` (in-place push into `action.value`), not traced.

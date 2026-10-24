# log-inbox — lane «jjodie-ui-s4c»

Entries written by the Jjodie S4c lane (front jjodie-ui, branch `jjp-s4c`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: Apply of a previewed script as one undo step (S4c)
**Prompt**: P-2026-10-24-0256, slice S4c under R-JJD-6: an undo group in reducer.ts (begin/end, nesting, empty group, end without begin), Apply wrapped in it after flushing the pending COMMIT, planned against created objects per metaclass with a mismatch in the bar and on the console; reducer tests first, a mutation bench, a probe.
**Files touched**: frontend/src/redux/reducer/reducer.ts, frontend/src/redux/reducer/__tests__/undoGroup.test.ts, frontend/src/components/editor-v2/preview/PreviewBar.tsx, frontend/src/components/editor-v2/preview/PreviewBar.scss, frontend/src/components/editor-v2/preview/previewApplyCheck.ts, frontend/src/components/editor-v2/preview/__tests__/previewApplyCheck.test.ts (74fab8b7c); frontend/scripts/probe/jjodie-s4c-apply-undo.ts (a12b100fd); docs/log-inbox/jjodie-ui-s4c.md, docs/prompts/claude_2026-10-24_0256_prompt_jjodie_s4c_apply_one_undo.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile
**Notes**: The fold is a deep compose (older value wins), not U.objectMergeInPlace as R-JJD-6 names: that merge is shallow and drops the second idlookup (mutant M1 fails 7 of 11). In-group deltas are pushed unmerged, uncapped. Bench 12/12 killed. Probe on 3013 ALL PASS: Apply +1 entry, one Cmd+Z removes 3 objects, Cmd+Shift+Z restores. Out of scope: previewApplyCheck.ts and tests (pure, bench), the scss rule, the probe. Gates: typecheck 0, vitest 11846 + 9 known, build ok, smoke GREEN.
**Prompt document name**: 2026-10-24 02:56

**Ticket** (S4c probe, case B): a click on the canvas pane after Apply pushes an undo entry of its own, titled `Create element`, holding only `pointedBy` of the three new DVertex. A user who clicks the canvas before Cmd+Z needs two undos to remove the applied objects. Measured in `jjodie-s4c-apply-undo.ts`, not traced to its writer (canvas or sync layer, outside this lane); whether a single hand-made creation shows the same was not measured.

# log-inbox — lane «graphvertex»

Entries written by the graphvertex lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-20 — fix(editor-v2): graphVertex hides the edges a container encloses, R-GV-18 (P-2026-10-20-1420)
**Prompt**: with `containment.edges: 'hide'`, `suppressChannelEdges` also hides every instanceRef/composition edge between a container that declares hide and an object it encloses (own claim or deeper through `parentOf`), in either direction; channel step and S3 drops kept. Critical zone, go-ahead by Alfonso, Phase 1 waived, LIR first.
**Files touched**: `docs/lir/lir_2026-10-20_gv_enclosed_edges.md` (a94a06f28); `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irContainerLayout.test.ts` (ca92882ed); `docs/log-inbox/graphvertex.md`, `docs/prompts/claude_2026-10-20_1420_prompt_gv_enclosed_edges.md` (closure commit)
**Outcome**: ⚠️ partial
**Corregge**: —
**Causa**: (a)
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: produced
**Smoke visivo**: non applicabile — the visual check is the chat's, after the merge, on «Jjodel harness» (RC-23); the lane ran none
**Notes**: Requirement (d) was unsatisfiable: the R-GV-4 fixture draws t inside L, so R-GV-18 also hides e2, e4, e5 there; four existing cases had their expected hidden sets widened to that union, every other assertion unchanged (LIR §2). The rule covers every hide container, multi-hop included; a lost claim does not enclose. Bench 6/6 mutants killed, table in ca92882ed. Gates: typecheck 0, vitest ir 1235/1235, build 0.
**Prompt document name**: 2026-10-20 14:20

## 2026-10-20 — merge: gv-enclosed-edges into alfonso-frontend-jjtl (P-2026-10-20-1437)
**Prompt**: `claude_2026-10-20_1437_prompt_merge_gv-enclosed-edges.md`, a direct merge by `lane-run merge --direct`, no session: `gv-enclosed-edges` at `f9251ed60` into `alfonso-frontend-jjtl`, merge base `68fd369ee`, 3 commits on the branch side.
**Files touched**: merge `841230360`: 5 files from the branch side (`docs/lir/lir_2026-10-20_gv_enclosed_edges.md`, `docs/log-inbox/graphvertex.md`, `docs/prompts/claude_2026-10-20_1420_prompt_gv_enclosed_edges.md`, `frontend/src/components/editor-v2/viewpoint/ir/__tests__/irContainerLayout.test.ts`, `frontend/src/components/editor-v2/viewpoint/ir/irContainment.ts`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `841230360` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9446 tests in 384 files, 9 red at import, hooks 957; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: BPMN viewpoint of Jjodel harness after merge 841230360: 42 edges (all irobj_ flows), 0 reference edges (was 107 = 42 + 65), 48 nodes; R-GV-18 holds
**Notes**: Rollback tag `pre-gv-enclosed-edges` on `68fd369ee` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-20-1437/result.json`.
**Prompt document name**: 2026-10-20 14:37

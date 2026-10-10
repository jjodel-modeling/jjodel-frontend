# log-inbox — lane «stale-m1-edge»

Entries written by the stale-m1-edge lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — docs(discovery): stale M1 reference edge, root cause and fix plan (P-2026-10-10-1600)
**Prompt**: `claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md`, full lane, Phase 1 read-only on `~/jjodel-w-staleedge` (branch `stale-m1-edge`): reproduce the S3 ticket's stale RF edge on the trunk with a probe, name the root cause, read the reference-delete and update-depth lanes, draft the fix's LIR, place it against nested-vertices S2/S3.
**Files touched**: `46bcfcb92`: `frontend/scripts/probe/stale-m1-edge.ts` (new). This commit: `docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md` (new), `docs/discovery/assets/stale-m1-edge/` (8 files: three probe logs, the run 3 JSON, four crops), this inbox file (new).
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (eleven files over two commits, above five (rule 19), each in the prompt's DOVE; no file under `frontend/src/`)
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Reproduced 3/3 on the trunk: the reconcile's bare DeleteElementAction leaves the id in graph.subElements (the ticket said it left), so useJjomSync never drops the RF edge; 1, 2, 3 stale edges drawn over three round trips. Control: m1EdgeSweep's subElements scrub drops them in 1 s. Fix F1, one line in useM1ReferenceEdges.ts; draft LIR in the report §7.4. Report, assets and entry in one commit, as the prompt's COME asks (the skills say separate commits).
**Prompt document name**: 2026-10-10 16:00

## 2026-10-10 — ticket: a bare DeleteElementAction leaves the edge id in its vertices' edgesOut and edgesIn
**Ticket**: Measured on the useM1ReferenceEdges reconcile: every deleted DVoidEdge id stays in the source vertex's edgesOut and the target vertex's edgesIn (also after its subElements entry is scrubbed). The comments at useJjomSync.ts:796 and :894-896 say DeleteElementAction maintains those reciprocals via pointedBy. No editor-v2 reader of the two arrays was found; deleteM1Link and m1EdgeSweep do not scrub them either.
**Priority**: low
**Found in**: P-2026-10-10-1600
**Detail**: docs/discovery/discovery_2026-10-10_stale_m1_reference_edge.md

## 2026-10-10 — fix(sync): a stale M1 reference edge leaves graph.subElements, F1 (P-2026-10-10-1600)
**Prompt**: Phase 2 GO of `claude_2026-10-10_1600_prompt_stale_m1_edge_discovery.md` in the same session, F1 only (critical zone, go-ahead 17:16, recorded 17:40 after a first resume stopped on the hook): LIR first, then the scrub in `useM1ReferenceEdges.ts`'s delete TRANSACTION, a red-first fake-barrel test and a mutation bench, the probe as acceptance, the reference-delete M1 matrix as control, gates; hard stop.
**Files touched**: `df7904064`: `docs/lir/lir_2026-10-10_stale_m1_edge_f1.md` (new). `ad08a8519`: `frontend/src/components/editor-v2/hooks/useM1ReferenceEdges.ts`, `hooks/__tests__/useM1ReferenceEdges.test.ts` (new). `82b4b71c6`: `frontend/scripts/probe/stale-m1-edge.ts`. This commit: the report (Phase 2 addendum), the LIR §4, `docs/discovery/assets/stale-m1-edge/` (10 new files), this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no (sixteen files over four commits, above five (rule 19), each named by the GO's COSA and COME; no edit to useJjomSync.ts, m1EdgeGate.ts or m1EdgeSweep.ts)
**Layer Impact Report**: produced
**Smoke visivo**: passato (lane probe 50/50 on 3123, control 25/25 before and after; the visual GO of the chat and Alfonso is pending)
**Notes**: Test red first 4/7, then 7/7; bench 10/10 killed. tsc 14 = baseline; hooks 175, editor-v2 3455; full 7735 passed, 9 known import failures; build 0. Probe 31 failures before F1, 50/50 after. The handle check was narrowed to the source handle (the one stale edges took) plus stability across re-adds: the target side of a re-created edge is right-0 before and after F1, bottom-0 at open. S3 fixture not run (ir-graphvertex not on the trunk).
**Prompt document name**: 2026-10-10 16:00

**Ticket** (lane, low): an M1 reference edge re-created after open enters its target on another side than the same edge at open (Running→stop: bottom-0 at open, right-0 at every re-add, before and after F1). Not a staleness effect; whether a re-created edge should take its old side back is a layout question.

## 2026-10-10 — merge: stale-m1-edge into alfonso-frontend-jjtl (P-2026-10-10-1809)
**Prompt**: `claude_2026-10-10_1809_prompt_merge_stale-m1-edge.md`, a direct merge by `lane-run merge --direct`, no session: `stale-m1-edge` at `bf21aa74f` into `alfonso-frontend-jjtl`, merge base `7a271476c`, 7 commits on the branch side.
**Files touched**: merge `834152b68`: 25 files from the branch side (`docs/discovery/assets/stale-m1-edge/control-refdelete-m1-after.log`, `docs/discovery/assets/stale-m1-edge/control-refdelete-m1-before.log`, `docs/discovery/assets/stale-m1-edge/crop_after_A2-after.png`, `docs/discovery/assets/stale-m1-edge/crop_after_A2.png`, `docs/discovery/assets/stale-m1-edge/crop_after_C1-after.png`, `docs/discovery/assets/stale-m1-edge/crop_after_C1.png`, `docs/discovery/assets/stale-m1-edge/crop_after_R2-after.png`, `docs/discovery/assets/stale-m1-edge/crop_after_R2.png`, and 17 more); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `834152b68` in the worker: typecheck 14 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 8032 tests in 329 files, 9 red at import, hooks 487; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: Alfonso visual GO on F1 at 18:08 (lane probe 50/50 on 3123, control 25/25)
**Notes**: Rollback tag `pre-stale-m1-edge` on `c28297230` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-10-1809/result.json`.
**Prompt document name**: 2026-10-10 18:09

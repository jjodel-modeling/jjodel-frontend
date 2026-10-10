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

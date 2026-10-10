# log-inbox — lane «relayout-on-open»

Entries written by the relayout-on-open lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-10 — fix(editor-v2): no whole-graph re-layout on an open that creates (P-2026-10-10-1155)
**Prompt**: `claude_2026-10-10_1155_prompt_relayout_on_open_fix.md`, full lane on `~/jjodel-w-relayout` (branch `relayout-on-open`): root cause of the open-time ELK that re-lays the whole canvas when an open creates one vertex (nested-vertices probe, E3b), then a fix in `EditorV2.tsx` behind a pure tested predicate, measured with that probe.
**Files touched**: code `b58d8631f`: `frontend/src/components/editor-v2/EditorV2.tsx`, `frontend/src/components/editor-v2/utils/autoLayoutOnOpen.ts` (new), `frontend/src/components/editor-v2/utils/__tests__/autoLayoutOnOpen.test.ts` (new). Probe `12c329749`: `frontend/scripts/probe/nested-vertices.ts`. This commit: `docs/discovery/discovery_2026-10-10_relayout_on_open.md`, `docs/discovery/assets/relayout-on-open/` (`probe_base.{log,json}`, `probe_after.{log,json}`, `e3b_positions.json`), this entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown — `npx tsc --noEmit` 14, the §17 set; editor-v2 147 files, 3448 passed; full suite 7725 passed, the 9 known import reds; build exit 0; check:scripts and typecheck:scripts exit 0; predicate 9/9, mutation bench 9/9 killed; probe E1 and E3a unchanged against the base run. Not run: the transformation flow (kept by read and by a unit test) and the MODELS demo scenes.
**Out-of-scope changes**: no — eleven files over three commits, above five (RC-11, rule 19), every one in the prompt's DOVE, taken as the confirmation. The probe changed beyond a parameter (one field, one MEAS line), declared in the report.
**Layer Impact Report**: not-required — no §3.1 or §3.2 file touched; `useJjomSync.ts` only read.
**Smoke visivo**: passato — lane probe on 3155, unattended: E1 0/10 nodes on the default grid, E3a 0/10 moved, E3b 0/10 moved and 0/10 records changed (sentinel record byte-identical), ProbeRoot created at 470,950; the chat's visual GO pending.
**Notes**: «Persisted position» read as a layout record (`layoutByViewpoint`, any key), not the seed: the literal reading would stop laying out transformation outputs, whose vertices exist on ProjectEditor's grid before the open. Residual: seed-only layouts (pre-2026-08-24, classic editor) are still re-laid out by a creating open, as today. Report: `docs/discovery/discovery_2026-10-10_relayout_on_open.md`.
**Prompt document name**: 2026-10-10 11:55

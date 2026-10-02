# log-inbox — lane «views»

Entries written by the views lane while three sessions share this tree (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-09-30 — feat(views): edge ends, seven glyphs, Conditional ends, end roles, slice E (P-2026-09-30-1810)
**Prompt**: `claude_2026-09-30_1810_prompt_edge_ends.md`, Phase 1 then 2 in cascade, heavy, on `~/jjodel-w-edgeends` branch `edge-ends` (from `viewpoint-notations` `30f3d8a81`): seven more edge ends, each end a Conditional resolved per instance, a multiplicity and a role per end, the line cut at the glyph's back, the panel grouped with Conditional ends and end labels in Advanced; no notation bound.
**Files touched**: report `77c2f946b` + §9 here: `docs/discovery/discovery_2026-09-30_edge_ends.md`. Code `8f3e7c307`: `viewpoint/ir/{irTypes,irValidate,irCompile,irEdgeViews}.ts`, `edges/edgeEndGlyphs.ts` (new), `edges/UnifiedEdge.tsx`, `utils/edgeUtils.ts`, `viewpoint/authoring/EdgeAuthoringPanel.tsx`, `EditorV2.scss`; tests `irEdgeEnds`, `irEdgeEndsRender`, `edgeEndGlyphs` (new), `irValidate`. Code `462fba92d`: `irCompile.ts`, two tests. This commit: report §9, `docs/decisions.md` (R-EE-1..4), this entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — on `462fba92d`: typecheck exit 2, 14 errors, the §17 set; vitest 6255 passed, 0 failed, the 9 known files red at import; build exit 0. Red first on `77c2f946b`: 14 failed, 1 file at import; 9 markup pins taken there stay green. Mutation bench 22/23, the survivor equivalent.
**Out-of-scope changes**: no — 16 files, all in the report's §5 list (Rule 19, flagged there, RC-11); `EditorV2.scss` and `edgeEndGlyphs.ts` named by the report, as the prompt's DOVE asked.
**Layer Impact Report**: produced (report §6, in the Phase 1 commit before the first source edit)
**Smoke visivo**: passato (lane probe on 3093 16/16: 42 fixture links, light and dark, widths 1 and 2; the four demo scenes 0 px from the pre-edit shots) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_edgeends_crops/ee_fixture_w{1,2}_{light,dark}{,_new}_600.png`
**Notes**: Eight questions adopted as recommended, unattended (RC-21/RC-25), rows R-EE-1..4; Q2 (end labels widened to `TextSource | EdgeEndLabels`, R-VP-23 kept) verified by a second agent (RC-27), whose scratch folders in /tmp were removed. `bar` also names a ShapeForm (Q1). Tips stop on the handle's outer edge, as every IR arrow. Detail in the report §0, §9.
**Prompt document name**: 2026-09-30 18:10

## 2026-10-02 — merge: alfonso-frontend-jjtl into edge-ends, slice E synced with the trunk (P-2026-10-02-1505)
**Prompt**: `claude_2026-10-02_1505_prompt_edge_ends_trunk_sync.md`, Phase 1 then 2 in cascade, heavy, on `~/jjodel-w-edgeends` branch `edge-ends`: the trunk into slice E before its merge, both intents kept, gates at baseline (RC-14).
**Files touched**: report `b7d0885e9` + §7 here: `docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md`. Merge `1e1ce1334` of `eaead2d71`, resolved: `edges/UnifiedEdge.tsx`, `viewpoint/ir/irEdgeViews.ts`, `docs/log-inbox/views.md`. Fix `9e1f9fae5`: `edges/UnifiedEdge.tsx`, `viewpoint/ir/__tests__/irEdgeEndsRender.test.ts`; `119046cb2`: the same test file. This entry, the prompt's Status.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no — typecheck exit 2, 14 errors, the §17 set; vitest 6502/6503, 11 files red: the 9 known at import, `irSelectionRing.test.ts` and `traceMonitor.test.ts` green alone (load); build exit 0; `check:scripts` PASS; mutation benches: the fix 9/9, slice E 22/23 (T13 equivalent). `check:addonly` red on the merge only, inherited from `d2eb5fb83` (report §7).
**Out-of-scope changes**: no — the merge, the two code files resolved as the report says, and the fix the report names (Q3) with its tests, in separate `fix:` commits (DOVE).
**Layer Impact Report**: produced (report §4, in the Phase 1 commit; no §3.2 file in any resolution)
**Smoke visivo**: passato (lane probe on 3095, light: base 5/5 on the `c3a9c9ffd` code, after 20/20; the four demo scenes and DemoFlowB as Activity (UML) byte-identical to base, bars 7×120 painted 5×118, every flow on the open arrowhead; slice E's fixture at widths 1 and 2) — chat, RC-23, pending; crops `frontend/scripts/smoke/_tmp_ee_sync_crops/`
**Notes**: Q1-Q3 adopted as recommended (RC-21): `eaead2d71` merged pinned, the trunk moving to `7de984795` meanwhile (the next merge meets only a `views.md` union); `views.md` = the trunk preamble + the slice E entry; the junction trunk takes its own new-end marker. `check:addonly` flags the merge only: 172 entries, all 185 that leave the inboxes verbatim in the log or archive (ticket below). Detail in the report §0, §7.
**Prompt document name**: 2026-10-02 15:05

## 2026-10-02 — ticket: check:addonly refuses a fold and a rotation in one commit, and every trunk merge across it
**Ticket**: `check:addonly` explains an inbox entry that disappears only by the active log of the same commit, never by the archive. The trunk's `d2eb5fb83` (P-2026-10-01-2344) folded the inboxes and rotated the log in one commit, so `npm run check:addonly -- d2eb5fb83` fails on the trunk itself. Every merge of the trunk into a branch that still carries the pre-fold inboxes fails the same way, measured on `1e1ce1334`: 172 entries flagged, all verbatim in the archive. Either the archive joins the inbox pool, or fold and rotation stay two commits.
**Priority**: medium
**Found in**: P-2026-10-02-1505
**Detail**: docs/discovery/discovery_2026-10-02_edge_ends_trunk_sync.md

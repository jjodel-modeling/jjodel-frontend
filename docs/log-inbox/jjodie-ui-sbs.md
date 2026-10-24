# log-inbox — lane «jjodie-ui-sbs»

Entries written by the side-by-side Refactoring lane (front jjodie-ui, branch `jjp-sbs`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — feat: refactoring tab beside the target's own tab, preview on the real canvas
**Prompt**: P-2026-10-25-0020 (stopped at the context ceiling, probe 20/23) and its continuation P-2026-10-25-0040: the Refactoring tab holds the editor only, the target's own canvas tab is placed right of it in a dock split (40/60, persisted), Preview draws ghosts on that real canvas through `scriptPreviewStore`, the class-box pane only as the fallback under 1100 px. Short discovery: `docs/discovery/discovery_2026-10-25_refactoring_side_by_side.md` (DockManager.dock is the main dock; rc-dock's equal split and in-place sizes; two independent causes of the 0 px beside panel; the rsbOrg tab).
**Files touched**: `frontend/src/components/scripts/refactoringBeside.ts` (new: beside mode by width, beside action, split ratio) and its test; `frontend/src/components/editor-v2/preview/scriptPreviewStore.ts` (optional `owner`, publish and owned clear); `previewElements.ts` (M2 ghost placed beside the related class, removals struck through beside their holder); `PreviewBar.scss` and `scriptPreview.test.ts`; `frontend/src/components/abstract/DockManager.tsx` (`openBeside`, `besideRatio`); `ScriptTab.tsx` (beside mode, placement waits for the entry, owned preview); `ScriptTab.scss` (beside layout, the panels of the beside hbox shown despite `.not-strip`); `EditorV2.tsx` (canvas bar hidden when the preview has an owner); `frontend/src/components/abstract/style.scss` (split, sidebar, summary and transformation last-panel rules skip the beside hbox; authorised by 0040's Deroga); probes `refactoring-side-by-side.ts` (new) and `refactoring-split-preview.ts` (1080 px); `docs/decisions.md` (R-JJD-16); this file; both prompts' Status.
**Outcome**: ✅ completed
**Corregge**: 2026-10-25 00:20
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Transformation tab with a split, before and after the style.scss change: `+2` 1599 px, `+22` 0 px, identical. refactoring-side-by-side 25/25 (editor 544 px, canvas 815 px, share 0.400, 3 ghost edges); split-preview at 1080 px, jjodie-m2-preview, jjodie-s4c ALL PASS; typecheck 0; vitest 12036 tests, 9 known import failures; build 0; smoke GREEN 12/0/3. Out of scope: style.scss (Deroga), decisions.md row, the discovery report. R-JJD-16 amends ratified R-JJD-15: awaiting Alfonso.
**Prompt document name**: 2026-10-25 00:40

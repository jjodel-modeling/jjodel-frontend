# log-inbox — lane «jjodie-ui-rfa»

Entries written by the Refactoring-page lane (front jjodie-ui, branch `jjp-rfa`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: refactoring page split editor, diagnostics, preview and apply
**Prompt**: P-2026-10-24-2320 (stopped at the context ceiling with the UI committed as wip 383a3f2b0, probe red) and its continuation P-2026-10-24-2340: the Refactoring tab as editor plus read-only metamodel preview, planner diagnostics as you type, Preview then Apply as one undo, Jjodie's launcher following the dock
**Files touched**: frontend/src/jjscript/executor/effectsPlanner.ts, planWorld.ts, __tests__/featureHasValues.test.ts (new) (97ae687f2); frontend/src/components/scripts/refactoringDiagnostics.ts, refactoringPreview.ts, __tests__/refactoringDiagnostics.test.ts, __tests__/refactoringPreview.test.ts (all new) (c822cf9b7); frontend/src/components/abstract/tabs/ScriptTab.tsx, ScriptTab.scss, frontend/src/components/scripts/RefactoringPreviewPane.tsx, RefactoringPreviewPane.scss (new), frontend/src/components/editor-v2/preview/PreviewBar.tsx, frontend/src/components/Jodie/JodieWindow.css, frontend/scripts/probe/refactoring-split-preview.ts (new) (383a3f2b0, 61418c761)
**Outcome**: ✅ completed
**Corregge**: 2026-10-24 23:20
**Causa**: (g)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: Causa (g): 2320 hit the context ceiling. Out of scope: PreviewBar.tsx, planWorld.ts, JodieWindow.css (handoff of 2320, Deroga of 2340); 10 source files, listed below (RC-11). Gates on 61418c761: typecheck exit 0, vitest 12022/12022 with the 9 known window-is-not-defined files, build green, smoke 12/0/3 first run, probes rfa 29/29, rf1 20/20, rf2 15/15, hl 19/19. Benches: planner 5/5, diagnostics 8/8 killed.
**Prompt document name**: 2026-10-24 23:40

**Discovery** (step 1 of P-2026-10-24-2320). Header before: `ScriptTab.tsx:85-94` held an editor Save and «Run on <target>»; Run is `runScriptOnModel` (`scriptFiles.ts:136-143`), which opens the canvas, dispatches SCRIPT_PREVIEW_REQUEST and applies from the canvas PreviewBar. The planner `effectsPlanner.ts` `planEffects` is store-free and reusable outside the canvas. The ghost-preview pieces are not: `scriptPreviewStore.ts` is global and canvas-bound, `previewElements.ts` builds ReactFlow nodes. The one-undo Apply path is `PreviewBar.tsx` `applyAsOneStep` (beginUndoGroup/endUndoGroup). The launcher is `JodieMinimized` (`Jodie.tsx:968`), styled in `JodieWindow.css:865-930`; `JjodieWidget` has no importer (positive control: the same grep finds `JjodieWidget.tsx` itself).

**Source files** (10, over the 8 of the DOVE): `effectsPlanner.ts` the FEATURE_HAS_VALUES warning; `planWorld.ts` `m2.slotValues` (optional) feeding it; `refactoringDiagnostics.ts` planner output to lines, ranges, gutter and markers (pure); `refactoringPreview.ts` the class-box view model of `PlanWorld.m2` with the planned effects (pure); `RefactoringPreviewPane.tsx/.scss` the right pane and its bar; `ScriptTab.tsx/.scss` split layout, header, debounced planning, Preview/Apply/Discard; `PreviewBar.tsx` exports `applyAsOneStep` for the tab's Apply; `JodieWindow.css` the launcher on the window side while a Refactoring tab is active.

**Decisions taken (unattended)**, ratified as recommended, unattended (RC-21, RC-25), not yet rows of `docs/decisions.md`: (1) right pane = compact class-box renderer, not an embedded EditorV2 canvas (the canvas mounts useJjomSync, critical zone); an M1 target shows its metamodel, M1 effects as chips only. (2) Tab-local plan and preview state, not the global `scriptPreviewStore`. (3) `slotValues` filled for an M2 world only. (4) Underline only for unresolved-name codes with a column range; gutter dots for every warned line. (5) Editor width in `localStorage['jjodel.refactoring.editorWidth']`, 480..800, default 600. (6) Launcher rule `body:has(.dock-tabpane-active .script-tab) .jodie-minimized`; measured in 2340 on another dock tab: x 270 (default) against 1536 on the Refactoring tab, so no change. (7) `.script-tab__target` and `.script-tab__model` kept for the rf1 probe. (8, 2340) The probe's scene adds an attribute through JjScript, because `jjscript-m1-esm.jjodel` holds references only; Monaco is focused through its API before typing (its view-lines layer is 16777216 px wide and its centre sits under the right pane). (9, 2340) The wip commit 383a3f2b0 is not rewritten: the probe commit 61418c761 on top names it as verified.

**Crops**: `~/.jjodel-lanes/P-2026-10-24-2340/` `rfa_tab.png`, `rfa_editor_diagnostics.png`, `rfa_problem_list.png`, `rfa_preview_pane.png`, `rfa_other_tab_launcher.png`.

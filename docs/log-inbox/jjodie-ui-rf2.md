# log-inbox — lane «jjodie-ui-rf2»

Entries written by the run-from-tab Refactoring lane (front jjodie-ui, branch `jjp-rf2`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-24 — feat: run a refactoring from the artifact tab
**Prompt**: P-2026-10-24-2215 under R-JJD-14: «Run refactoring…» on the menu of a metamodel or model tab, listing only the compatible Refactorings (disabled with «No refactoring for this artifact» when none), run on the whole artifact through the ghost preview by the request function shared with the tab's Run on, tests for the listing and a probe.
**Files touched**: frontend/src/components/scripts/projectScripts.ts, frontend/src/components/scripts/scriptFiles.ts, frontend/src/components/scripts/RunRefactoringMenu.tsx, frontend/src/components/scripts/__tests__/refactoringsForArtifact.test.ts, frontend/src/components/megamodel/MegamodelContextMenu.tsx, frontend/src/pages/components/Navbar.tsx, frontend/scripts/probe/jjodie-rf2-run-from-tab.ts (6c92fc029); docs/log-inbox/jjodie-ui-rf2.md, docs/prompts/claude_2026-10-24_2215_prompt_run_refactoring_from_tab.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: produced
**Smoke visivo**: passato
**Notes**: No tab menu existed: the visible tabs are Navbar's app-bar buttons (rc-dock bar hidden), so the menu is a right-click there, reusing MegamodelContextMenu (+ optional title). Seven code files (rule 19, adopted unattended). Bench 5 mutants, 4 killed, 1 equivalent. Probe 15/15 on 3014, crop rf2_run_from_tab.png. Gates: typecheck 0, vitest 11996 + 9 known, build ok, smoke GREEN.
**Prompt document name**: 2026-10-24 22:15

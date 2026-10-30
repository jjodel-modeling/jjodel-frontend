# log-inbox — lane «jjodie-ui-tools»

Entries written by the Tools-menu Refactoring lane (front jjodie-ui, branch `jjp-tools`) while other lanes run in their own worktrees (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-10-25 — feat: run a refactoring from the Tools menu
**Prompt**: P-2026-10-25-0945 under R-JJD-17: Tools (Advanced) gains «Run refactoring on <name>…» for the active tab's model or metamodel, listing the compatible Refactorings by the right-click listing and running one by the same runScriptOnModel through the ghost preview; disabled with «Open a model or metamodel» or «No refactoring for this metamodel/model»; tests for label and state, a probe.
**Files touched**: frontend/src/components/scripts/projectScripts.ts, frontend/src/components/scripts/RunRefactoringMenu.tsx, frontend/src/pages/components/Navbar.tsx, frontend/src/components/scripts/__tests__/toolsRefactoringEntry.test.ts, frontend/scripts/probe/jjodie-tools-run-refactoring.ts (a6434d5d7); docs/log-inbox/jjodie-ui-tools.md (this commit)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato
**Notes**: projectScripts.ts and RunRefactoringMenu.tsx not named: the label/state rule and the per-entry rule (refactoringChoice) are pure there, shared by both menus so the list is one path. MenuEntry gains an optional title (native tooltip). Bench 4 mutants, 4 killed. Probe 9/9 on 3014, crop tools_run_refactoring.png. Gates: typecheck 0, vitest 12055 + 9 known, build ok.
**Prompt document name**: 2026-10-25 09:45

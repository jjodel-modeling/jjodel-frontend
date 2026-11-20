# Multi-tab: the project dashboard opens full screen over the editor groups

Prompt-ID: P-2026-11-20-1632
Chat: C-2026-11-18-2337
Front: multi-tab
Status: da eseguire
Lane: full (implementation, no critical-zone file)
Depends: R-MT-30..R-MT-33 and the readers lane, all merged into the trunk
Worktree: ~/jjodel-w-mtdash, branch multi-tab-dashboard, created from the trunk after the persistence merge (d2628b041), at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-20 15:59, 16:03; words in `~/.jjodel-lanes/P-2026-11-20-1632/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3081, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-20-1632 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: every lane of this front has come near it. Read R-MT-30..R-MT-33 from `docs/decisions.md` and Q4 in §10 of `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` only; read code by regions; commit each green step; write the handoff first if near the ceiling.

## COSA

Alfonso, 15:59: when the canvas is split in two or more groups and he opens the project dashboard to pick an artifact to open, the dashboard opens in the active split; it should open full screen. 16:03: he means the project dashboard (the `project_summary` tab: summary, models, generators), not the all-projects page.

Decision (Alfonso, 16:03, superseding Q4: «the summary tab stays in group 1»):

1. The project dashboard is no longer a tab of a group. It is a full-screen view over the whole editor area (all groups), as VS Code's Explorer is not an editor group. The groups stay mounted and intact underneath: tabs, viewpoints, widths, active group.
2. It opens and closes from the control that opens it today (find it: the app bar label or button that activates `project_summary`, `DockManager.activateProjectSummary`), and closes with Esc. Closing shows the groups as they were.
3. Opening a model or metamodel from the dashboard closes the dashboard and opens the artifact in the active group (R-MT-31, R-MT-32 unchanged).
4. While the dashboard is shown, the app is in summary mode: left bar, status bar and `body[data-editor-type]` say `summary`, not the last editor's (this removes the residue noted in the 2236 lane).
5. With no artifact open (a project just opened, or every tab closed), the dashboard is what shows, full screen, as today.
6. Persistence (R-MT-33): the dashboard is not saved in the layout any more; a saved record that still holds `project_summary` restores without it. Whether the dashboard was open is not persisted.

First, a short read in the reply (a discovery report in `docs/discovery/discovery_2026-11-20_dashboard_fullscreen.md` if it grows past a page): how `project_summary` is created, where it is placed, every reader of its id or of `editorType: 'summary'`, the control that opens it, and how the groups can stay mounted under an overlay (CSS over the dock area vs leaving the dock). Propose the file list (Rule 19 if more than five) and the approach; if the approach needs anything outside `DockManager.tsx`, `Dock.tsx`, `MyRcDock.tsx` (only if unavoidable: another chat's lane, P-2026-11-20-1610 editor-chrome-parity, edits it), `tabs/dockGroups.ts`, `tabs/groupPersistence.ts`, `pages/components/Dashboard.tsx`, `pages/components/Navbar.tsx`, their SCSS and tests, and `docs/decisions.md`, stop with Outcome: question. Otherwise go on.

Record the rule as the next free R-MT row in `docs/decisions.md`, superseding Q4 and amending R-MT-33 for the dashboard, in the register grammar (no free text in the header); run `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts` before committing.

## COME

Tests first where pure (persistence prunes `project_summary`; the dashboard state toggles; opening an artifact closes it). Gates: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs`. Mouse probe at 1600 and 1280, real clicks: open two models, Split Right, group 2 active; open the dashboard: it covers the whole editor area, left bar and status bar in summary mode; Esc: the two groups as they were, group 2 still active; open the dashboard again and open a third model from it by mouse: dashboard closed, model in group 2; close every tab: the dashboard shows full screen; reload with persistence: groups back, dashboard closed. No console errors. Crops in the lane folder. Commit code and docs separately, pathspec only, with the trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP.

HARD STOP for Alfonso's visual check, dev server running.

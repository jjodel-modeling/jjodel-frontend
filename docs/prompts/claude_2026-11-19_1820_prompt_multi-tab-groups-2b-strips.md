# Multi-tab editor groups, lane 2b: one tab strip per group

Prompt-ID: P-2026-11-19-1820
Chat: C-2026-11-18-2337
Front: multi-tab
Status: eseguito 2026-11-19 · lane full · 021642d48 · verifica visiva passata 2026-11-19 (closed by P-2026-11-19-1915, stopped at the context ceiling)
Lane: full (implementation, no critical-zone file)
Depends: P-2026-11-19-1600/1745 (lane 2a, groups core, merged into the trunk after Alfonso's visual GO 2026-11-19 18:15); discovery `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md` (Q1: per-group strips, rc-dock's own tab bar)
Worktree: ~/jjodel-w-mtg2b, branch multi-tab-groups-2b, created from the trunk after the 2a merge, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (words in `~/.jjodel-lanes/P-2026-11-19-1820/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-1820 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: every lane on this front has been near it. Read only §2.3, §2.4, §8.1, §8.2 and §10 (Q1, Q4) of the report and R-MT-30; read code by regions; commit each green step; if near the ceiling, write the handoff first.

## COSA

Each editor group gets its own tab strip, as in VS Code (G1, Q1 (a)):

1. Show rc-dock's own per-panel tab bar on the model panels (today hidden, `navbar.scss:2122` per §2.3), styled with the existing design tokens of the app bar tabs (same height, font, close cross, active tab mark, the textual badge), so a group's strip looks like today's app bar tabs.
2. Retire the tab list from the app bar (`Navbar.tsx`): the app bar keeps its project-level items. Readers of the old strip (`TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`) move to the per-group model through `tabs/dockGroups.ts`; the overflow menu becomes per strip.
3. Titles: `<model> · <viewpoint>` when a model shows in more than one tab (G5), on the group strips.
4. Dragging a tab by the mouse from one strip to another works (G4); drops on edges stay refused by the 2a veto. The project summary tab stays in group 1, not closable and not draggable (Q4).
5. The squeezed-tab bug of the old app bar (at 1280 a click on a squeezed tab's name closed it, multi-tab inbox ticket) must not exist on the new strips: check it explicitly and say how.

Files (Rule 19, approved, from §8.2): `Navbar.tsx`, `navbar.scss`, `TabsOverflowMenu.tsx`, `BottomToolbar.tsx`, `Dashboard.tsx`, `DockManagerStyles.scss`, plus `tabs/dockGroups.ts` and its test if a reader needs a new accessor, and `docs/decisions.md` (one sentence added to R-MT-30). Re-grep each before touching it. Anything else needs a question.

## COME

Then gates: typecheck at baseline, vitest green (three known import failures excepted), build ok, `npm run check:docs`. Probe at 1600 and 1280 with the mouse: two groups after Split Right, each with its own strip; click a tab in group 2 (group 2 becomes active, palette follows); drag a tab from group 2's strip to group 1's strip; close a tab with its cross; close the last tab of a group (the group closes); the app bar has no tab list; the squeezed-tab check of point 5; no console errors. Crops of both strips at both widths in the lane folder. Commit code and docs separately, pathspec only.

HARD STOP for Alfonso's visual check, dev server running.

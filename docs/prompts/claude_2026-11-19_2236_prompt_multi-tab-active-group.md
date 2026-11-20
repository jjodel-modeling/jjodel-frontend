# Multi-tab: the project tab does not make its group active

Prompt-ID: P-2026-11-19-2236
Chat: C-2026-11-18-2337
Front: multi-tab
Status: eseguito 2026-11-19 · lane full · 52cdcda06, f83fc698b · verifica visiva passata 2026-11-19 23:15
Lane: full (bug fix, no critical-zone file)
Depends: P-2026-11-19-2125 (metamodels in editor groups), merged 83a45cf2e, closed 804ddd61d
Worktree: ~/jjodel-w-mtact, branch multi-tab-active-group, created from the trunk at 804ddd61d plus this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (Alfonso 2026-11-19 22:32 and 22:35)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili.

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3081, 3087, 3790, 4700), left running at the hard stop with port and pid. Every reply opens with [P-2026-11-19-2236 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: the previous lanes of this front hit it. Read R-MT-30 and R-MT-31 only from docs/decisions.md, read code by regions, commit each green step, write the handoff first if near the ceiling.

## COSA

Alfonso, 22:32: «when I open a model or metamodel it is not loaded in the active canvas but always in the left one». 22:35: he opens from the project dashboard.

Root cause (chat analysis, to confirm in your first read): the active group is the group of the most recent tab passed to `noteActiveTab` (`components/abstract/tabs/dockGroups.ts`). `Dock.tsx` (the `onPress` effect, about lines 280-302) notes the active tab of any group pressed or focused, in capture phase. The project dashboard tab, from which models and metamodels are opened (`Dashboard.tsx` around 439-461, `ProjectEditor.tsx` around 1164, 1995, 3253), sits in group 1 (Q4 of the discovery). So the click that picks a model makes group 1 active an instant before `DockManager.open2` asks for the active group. The 2125 probe missed it because it called `open2` from code.

Rule (as VS Code's Explorer, which is not an editor group): only model and metamodel tabs (artifact tabs, including second tabs `<id>~tab<N>`) count for the active group. A press, a focus or an activation on any other tab (the project dashboard tab and any non-artifact tab) leaves the active group as it is. With no artifact tab ever noted, the fallback stays the first group. Opening, Split Right, close and the rest of R-MT-30/R-MT-31 are unchanged.

First, a short read in the reply (no report file unless it grows past a page): confirm the root cause; list every caller of `noteActiveTab` and every path that sets the active group (Dock.tsx onPress and handleLayoutChange, DockManager.tsx around 370, MyRcDock.tsx around 673); say how a tab is recognised as an artifact tab (existing predicate, tab group or id shape; reuse what exists, do not invent one if one is there); say where the project dashboard tab lives in the layout. If the dashboard opening path turns out to live outside the dock, stop with Outcome: question and the evidence.

Then implement, preferably by filtering in `noteActiveTab` (or in `activeGroup` over the recent list) so every caller gets the rule at once. Files approved: `dockGroups.ts`, `Dock.tsx`, `DockManager.tsx`, `MyRcDock.tsx`, their tests, `docs/decisions.md`. Anything else needs a question.

Record the rule as the next free R-MT row in `docs/decisions.md`, amending R-MT-30 (active group), in the register grammar (no free text in the header), and run `scripts/gates/__tests__/decisionsQuery.test.ts` and `docsDigest.test.ts` before committing.

## COME

Tests first, pure, in `dockGroups.test.ts`: a project or other non-artifact tab noted after an artifact tab does not move the active group; an artifact tab still does; with only non-artifact tabs noted, the first group. Gates: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs`. Mouse probe at 1600 and 1280, with real clicks, no `open2` from code: open model A, Split Right, click in the canvas of group 2, then click the project dashboard tab and open model B from the dashboard by mouse: B lands in group 2. Same with a metamodel from the dashboard. Click in group 1's canvas, then open from the dashboard: it lands in group 1. Opening an artifact already in the active group focuses its tab. No console errors. Crops in the lane folder. Commit code and docs separately, pathspec only, with the trailers Model: claude-opus-5-5, Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>, Claude-Session: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP.

HARD STOP for Alfonso's visual check, dev server running.

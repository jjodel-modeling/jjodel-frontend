# Multi-tab editor groups, lane 2a finish: gates, R-MT-30, probe, visual stop

Prompt-ID: P-2026-11-19-1745
Chat: C-2026-11-18-2337
Front: multi-tab
Status: da eseguire
Lane: full (finish of P-2026-11-19-1600, stopped at the context ceiling, RC-51)
Depends: P-2026-11-19-1600 (commits 1c248d9e0, b1c458f83; handoff in `~/.jjodel-lanes/P-2026-11-19-1600/handoff.md`, marked Continuation: context-ceiling)
Worktree: ~/jjodel-w-mtg2a, branch multi-tab-groups-2a, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (words in `~/.jjodel-lanes/P-2026-11-19-1745/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. Dev server on 3075 if free (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700); leave it running at the hard stop and give port and pid. Every reply opens with [P-2026-11-19-1745 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Read the parent prompt and the handoff; do not reread code the parent already changed unless a gate fails there.

## COSA

Do the parent's remaining steps from its handoff, with the chat's answers to its three decisions:

1. Refactoring tab: it opens in the active group like any artifact (Q12). Remove the `openBeside` exception from the veto, so Split Right is the only way to make a group. If a test pins the old placement, update it and say which.
2. Generator tabs stay as they are for lane 6 (agreed).
3. Metamodels: no Split Right for now, as the parent did (R-MT-25). This is parked as a question for Alfonso; do not change it.

Then: add R-MT-30 to `docs/decisions.md` (provisional until Alfonso's visual GO; editor groups as in VS Code, Split Right only, Q1..Q14 as recommended, superseding L6e, R-MT-27's automatic other viewpoint and R-MT-28; note the three items above and that the layout-mode handlers of `Dock.tsx` still treat the first two panels as left and right, left for a later lane). Run the full vitest, the build and `npm run check:docs`. Start the dev server and run the parent's probe at 1600 and 1280: model and metamodel in one group; Split Right on the model gives two groups with the copy on the same viewpoint, active; another artifact lands in the active group; drag a tab from group 2 to group 1; closing the last tab of a group closes it; a tab activated in group 2 fires `ACTIVE_TAB` and the palette follows; drops on edges refused; no console errors. Crops in this lane folder. Commit code and docs separately, pathspec only.

HARD STOP for Alfonso's visual check with the probe results, the crops and the dev server running. The log entry comes after his GO.

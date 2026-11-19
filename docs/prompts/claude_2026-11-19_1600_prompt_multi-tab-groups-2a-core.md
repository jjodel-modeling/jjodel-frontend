# Multi-tab editor groups, lane 2a: groups core (Split Right, veto, active group)

Prompt-ID: P-2026-11-19-1600
Chat: C-2026-11-18-2337
Front: multi-tab
Status: da eseguire
Lane: full (implementation, no critical-zone file)
Depends: P-2026-11-19-1330/1350 (editor groups discovery, `docs/discovery/discovery_2026-11-19_multi_tab_editor_groups.md`, Q1..Q14 as recommended, GO of Alfonso 2026-11-19 15:28); P-2026-11-19-1530 (L4c, merged into the trunk)
Worktree: ~/jjodel-w-mtg2a, branch multi-tab-groups-2a, created from the trunk `alfonso-frontend-jjtl` after the L4c merge, at this prompt's commit
Request: https://claude.ai/code/session_01DQt9R5BmL7gprPWEQuuqbP (words in `~/.jjodel-lanes/P-2026-11-19-1600/request.md`)
Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Before anything else run pwd, git branch --show-current, git log -1, git status --short: HEAD is this prompt's commit and the tree is clean, otherwise stop with Outcome: blocked. No subagents, no background tasks. A dev server on a free port (lsof first; never 3000, 3001, 3003, 3061, 3062, 3790, 4700); leave it running at the hard stop and give port and pid. Every reply opens with [P-2026-11-19-1600 · session <id>]. Final line: Outcome: done | hard-stop | question | blocked. Summary lines only through node scripts/run-quiet.mjs; never cat a log. Context ceiling: five lanes on this front hit it. Read the report's §0, §2, §3, §8.1, §8.2 and §10 only; read code by regions; commit each green step at once; if near the ceiling, write the handoff before anything else.

## COSA

Lane 2a of §8.1: the groups core. The rc-dock panels of the models area are VS Code editor groups (G1..G6 of `docs/prompts/claude_2026-11-19_1330_prompt_multi-tab-editor-groups-discovery.md`).

1. `tabs/dockGroups.ts` (new, with tests): the active group accessor (the group of the last focused or activated tab), the list of model groups in order, the group of a tab. Every reader of `dockbox.children[0]` that drives focus or `ACTIVE_TAB` in the files of this lane goes through it (`Dock.tsx:361` first: a tab activated in a second group must fire `ACTIVE_TAB`). The other readers stay for lane 6.
2. `DockManager.splitRight()`: a new group immediately to the right of the active group, holding a copy of the active tab (same model, same viewpoint, shared layout); it halves the active group's width (Q2). The split icon of the canvas toolbar calls it. Repeated splits work.
3. The `dockMove` veto: no drop on an edge, no other direction, no floating; tabs can be dragged between existing groups (G4). `tabLocked`/`floatable: false` on the models panels as §2.4 says. Closing the last tab of a group closes the group; the project summary tab stays in group 1, not closable, not draggable (Q4).
4. G3: opening an artifact opens it as a tab in the active group, or focuses it if that group already has it; non-model tabs are focused where they are open (Q3); generator and other `dockBeside` tabs open in the active group (Q12); «Open beside ▸ <viewpoint>» of the Tree View becomes Split Right with that viewpoint (Q8).
5. `refreshCanvasSplit` on a tab change in any group; the single Instances palette follows the active group; a group whose active tab is not a canvas leaves the palette to the last active canvas group, shown collapsed (Q6). The L6c/L6d rules hold: inactive groups run no command, the first click only activates.
6. Record R-MT-30 in `docs/decisions.md` (provisional until Alfonso's visual GO): editor groups as in VS Code, Split Right only, Q1..Q14 as recommended, superseding L6e, R-MT-27's automatic other viewpoint and R-MT-28.

The per-group tab strips (Q1) are lane 2b, not this one: here the app bar strip stays, and must keep working with several groups (titles `<model> · <viewpoint>` when a model shows in more than one tab, G5).

Files (Rule 19, approved by this prompt, from §8.2): `DockManager.tsx`, `Dock.tsx`, `MyRcDock.tsx`, `EditorSwitch.tsx`, `EditorV2.tsx`, `Toolbar.tsx`, new `tabs/dockGroups.ts` and its test, `docs/decisions.md`, plus the Tree View file of the «Open beside» items and the opener of the `dockBeside` tabs if they are not among these (name them before editing). Re-grep each before touching it. Anything else needs a question.

## COME

Tests first for `dockGroups.ts`. Then the code, one commit per step that is green. Gates at the end: typecheck at baseline, vitest green (the three known import failures excepted), build ok, `npm run check:docs` from `frontend/`. Then a probe on the dev server at 1600 and 1280: open a model and a metamodel (one group, two tabs); Split Right on the model (two groups, the copy on the same viewpoint, active); open another artifact (it lands in the active group); drag a tab from group 2 to group 1; close the last tab of a group (the group closes); a tab activated in group 2 fires `ACTIVE_TAB` and the palette follows; drops on edges refused; no console errors. Crops in the lane folder.

HARD STOP for the visual check, with the probe results, the crops and the dev server running.

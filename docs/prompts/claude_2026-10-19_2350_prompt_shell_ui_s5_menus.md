# Shell S5: menus

Prompt-ID: P-2026-10-19-2350
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (menu blocks of two shared sheets, one component sheet)
Status: eseguito 2026-10-20 · lane shell-ui · 40a3626a0 · verifica visiva passata 2026-10-20
Depends: P-2026-10-19-2325
Request: Alfonso, 2026-10-19 23:19: «Procedere ora» (run S2 and S5 before the tpl-e/tpl-int merges, stylesheets only).

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s5`, branch `shell-ui-s5`, from the trunk commit that adds this prompt (S1 to S4 and S6 to S9 are on the trunk there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-2350 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. If you approach the context ceiling, write `~/.jjodel-lanes/P-2026-10-19-2350/handoff.md` and `handoff.diff` and stop with `Outcome: hard-stop`.

## Overlap with the tpl front (RC-22, ratified by Alfonso)
The branches `tpl-e` and `tpl-int` (another chat, not on the trunk) touch `pages/components/navbar.scss` and `Navbar.tsx`. Never touch `Navbar.tsx` or any TSX; do not move, reorder or rename existing rules or classes; edit declarations in place or add scoped rules. Record in the entry the exact line ranges you changed in each sheet.

## Context (do not redo the analysis)
Read §3.1 (Menus: the three `.context-menu` systems), §3.8 (the `.context-menu` triple definition), §4 (S5 row) and the S5 open question in §7 of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`, and R-SHELL-2 and R-SHELL-5 in `docs/decisions.md`. The tokens `--shell-radius-menu`, `--shell-border`, `--shell-menu-shadow` and `--shell-menu-item-height` (36 Basic, 28 Advanced) exist since S1 and are declared on `.context-menu` among other roots. The S2 entry in `docs/log-inbox/shell-ui.md` lists one leftover: the user-menu trigger in the navbar menu block keeps a 6 px radius; fix it here.

## COSA
1. Find by measurement which `.context-menu` rule actually paints each menu: the topbar File/Edit/View/Help menus and the user menu, the canvas context menu (right click on the editor canvas), and the legacy MetamodelTab menu if it is still reachable. Edit only the rules that paint; report which ones.
2. Every shell menu panel: radius `--shell-radius-menu` (8 px), 1 px `--shell-border`, one shadow `--shell-menu-shadow` (no stacked shadows), white surface; items at `--shell-menu-item-height` (36 px Basic, 28 px Advanced, R-SHELL-2) with the label vertically centred; item radius 4 px where items have a hover fill; text `--shell-text-1`, shortcuts and secondary text `--shell-text-3`, disabled items keep their current colour (D-UI-13 Em. 6); no text under 11 px; weights at most 600 (500 under 12 px); separators 1 px `--shell-border`.
3. The user-menu trigger radius 6 to 4 px (S2 leftover).
4. A legacy dark menu, if one paints: decide by measure. If it is reachable from the normal UI, bring it to the same light treatment; if it is unreachable, leave it and say so in the entry.

## DOVE
`frontend/src/components/editor-v2/EditorV2.scss` (menu block only, around lines 3978-4133; verify), `frontend/src/pages/components/navbar.scss` (menu block only), `frontend/src/components/contextMenu/ContextMenu.scss` only if it paints. Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on any test reading the three sheets or ContextMenu (grep), `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000, Basic and Advanced: the File menu open in the editor, the user menu open, and the canvas context menu open on a metamodel: panel radius 8, border 1 px, one shadow; item height 36 Basic and 28 Advanced; text under 11 px 0; weights at most 600; menu position (top-left anchor) unchanged; nav `0,0,1600,50`, toolbar `201,51,1398,40`, rail `1200,91,400,877`, canvas `201,91,1398,876` unchanged; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec, the sheets you changed). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3021 from this worktree (`npm start -- --port 3021`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-2350/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: one docs commit (entry and Status), stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to any TSX, `:root` or token files; no change outside the menu blocks; no renamed or moved rule; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (§5, §17); `docs/decisions.md` R-SHELL-2, R-SHELL-5, D-UI-13; the discovery report; the S2 and S4 entries in `docs/log-inbox/shell-ui.md`.

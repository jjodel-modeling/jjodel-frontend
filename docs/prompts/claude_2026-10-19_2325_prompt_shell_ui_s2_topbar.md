# Shell S2: topbar

Prompt-ID: P-2026-10-19-2325
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (one shared sheet, topbar blocks only)
Status: da eseguire
Depends: P-2026-10-19-1725
Request: Alfonso, 2026-10-19 23:19: «Procedere ora» (run S2 and S5 before the tpl-e/tpl-int merges, stylesheets only).

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s2`, branch `shell-ui-s2`, from the trunk commit that adds this prompt (S1, S3, S4, S6-S9 are on the trunk there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-2325 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`. If you approach the context ceiling, write `~/.jjodel-lanes/P-2026-10-19-2325/handoff.md` and `handoff.diff` and stop with `Outcome: hard-stop`.

## Overlap with the tpl front (RC-22, ratified by Alfonso)
The branches `tpl-e` and `tpl-int` (another chat, not on the trunk) touch `pages/components/navbar.scss` (about 13 lines) and `pages/components/Navbar.tsx`. Alfonso chose to run S2 now. To keep their later merge small: change only `navbar.scss`, never `Navbar.tsx`; do not move, reorder or rename existing rules or classes; edit declarations in place or add rules scoped under `nav.nav-container`. Record in the entry the exact line ranges you changed, so the tpl chat can resolve its `merge --trunk-into` quickly.

## Context (do not redo the analysis)
Read §3.1 (Topbar, Files shared), §3.6 (topbar target rows), §3.7 (Topbar row), §3.8 and §4 (S2 row) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`, and R-SHELL-1 and R-SHELL-5 in `docs/decisions.md`. The `--shell-*` tokens exist since S1, declared on `nav.nav-container` among others. S3, S4 and S6-S9 show the pattern (entries in `docs/log-inbox/shell-ui.md`). The menu block of `navbar.scss` is S5's, not this lane's.

## COSA
1. Topbar (`nav.nav-container`, non-menu blocks of `navbar.scss`): radii to `--shell-radius-control` (4 px) for buttons, the mode switch and its options, badges and the project pill; groups to `--shell-radius-menu` (8 px) where a container groups controls; neutral borders 1 px `--shell-border`; text colours to `--shell-text-1/2/3` (`#94a3b8`-like text to `--shell-text-3`, except inside a disabled control, D-UI-13 Em. 6); no text under 11 px (badges included); weights 700 to 600 and 600 under 12 px to 500.
2. Hit targets: every icon button and the Basic/Advanced switch options reach 24 px tall (`--shell-hit`) without changing the topbar height (50 px) or the switch's outer rect; use negative margins or a `::before` hit box as S8 did, and check with `elementFromPoint` on integer 24x24 boxes.
3. Muted icons in Advanced only: topbar icon buttons `--shell-text-3`, `--shell-text-1` on hover and focus-visible, under `html[data-mode="advanced"]`; Basic unchanged; active and disabled excluded.
4. Do not touch the menu block (dropdowns, File/Edit/View menus): that is S5.

## DOVE
`frontend/src/pages/components/navbar.scss`, non-menu blocks only. Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on any test reading `navbar.scss` or the Navbar (grep), `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000, Basic and Advanced, on the projects page and inside the editor with a metamodel open: appbar rect `0,0,1600,50` (or its current rect, unchanged); mode switch rect unchanged; switch options 24 px tall; text under 11 px in the topbar 0; border widths only 1 px; radii only 4, 8, pills and circles; weights at most 600; icons `#64748b` in Advanced, unchanged in Basic; toolbar `201,51,1398,40`, rail and canvas rects unchanged; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec, the one sheet). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3020 from this worktree (`npm start -- --port 3020`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-2325/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: one docs commit (entry and Status), stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `Navbar.tsx`, `:root` or token files; no change to the menu block of `navbar.scss`; no renamed or moved rule; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (§5, §17); `docs/decisions.md` R-SHELL-1, R-SHELL-5, D-UI-13; the discovery report; the S4 and S8 entries in `docs/log-inbox/shell-ui.md` for the muted-icon and hit-box patterns.

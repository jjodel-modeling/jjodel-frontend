# Shell S8: rail density, targets, muted icons and outer borders

Prompt-ID: P-2026-10-19-1930
Chat: C-2026-10-19-1610
Front: shell-ui
Lane: full (rail sheet plus the palette's outer border in EditorV2.scss)
Status: da eseguire
Depends: P-2026-10-19-1830
Request: Alfonso, 2026-10-19 17:45: «ok alle raccomandazioni» (A2 and A3 in the discovery §8), ratified as R-SHELL-2 and R-SHELL-3.

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-shellui-s8`, branch `shell-ui-s8`, from the trunk commit that adds this prompt (S1, S3, S4, S6 and S7 are on the trunk there). Before anything else: `pwd`, branch, `git log -1` and a clean `git status --short`; otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply opens with `[P-2026-10-19-1930 · session <id>]`. Every final message ends with `Outcome: done | hard-stop | question | blocked`. Questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

## Context (do not redo the analysis)
Read §3.1 (Properties rail, Left palette), §3.6 (target rows), §3.7 (Properties rail row) and §4 (S8) of `docs/discovery/discovery_2026-10-19_shell_visual_consolidation.md`, and the rows R-SHELL-2, R-SHELL-3 and R-SHELL-5 with the emendations under R-RAIL-7 and D-UI-11 in `docs/decisions.md`. The `--shell-*` tokens exist since S1 (`--shell-row-height` 26/24, `--shell-hit` 24px, `--shell-border`), `html[data-mode]` is written by Navbar. S6 styled the rail surfaces, S7 the section titles.

## COSA
1. Tree row height (R-SHELL-2): the rail tree rows read `--shell-row-height`, so 26 px in Basic and 24 px in Advanced. Rail-scoped in `properties-with-tree-view.scss`, never in `tree-view-sidebar.scss`.
2. Hit targets (R-SHELL-5): rail toggles, row actions and focus-bar buttons reach at least 24 x 24 (`--shell-hit`) without moving the layout. Where the visible control is smaller (for example `toggleXs`), extend the hit area with a positioned `::before` and verify it with `document.elementFromPoint` at the four corners of the 24 x 24 box: each must return the control or a descendant. Report the before/after count of targets under 24 px.
3. Muted action icons in Advanced only: rail row-action and header icon buttons `--shell-text-3`, `--shell-text-1` on hover and focus-visible, under `html[data-mode="advanced"]`; Basic unchanged; disabled and active states excluded (same pattern as S4 in `EditorV2.scss`).
4. Outer borders (R-SHELL-3), both together: the rail's outer left border and the left palette's outer right border move from `--border-subtle` to 1 px `--shell-border`. The rail rule goes in PWT under `.properties-with-tree-view--floating`; the palette rule in `EditorV2.scss`, palette block only (one declaration). Same colour on both sides, verified by computed style.
5. `.jj-section-title` in the rail (the Contents sub-lists CLASSES, ENUMERATORS, PACKAGES): today 11 px, 600, uppercase, `#94a3b8`. Colour to `--shell-text-3`, weight 500 (R-SHELL-5: 600 under 12 px becomes 500). Keep uppercase and size: it is a list-group label, like the palette category label. Rail-scoped.
6. Out of scope: the 9 px `span.anchor-viz__point-label` in NodeEditor (ticket from S7) and the react-select inner input box (ticket from S6). Leave both; do not touch NodeEditor or JjSelect.

## DOVE
`frontend/src/components/editors/properties-with-tree-view.scss`; `frontend/src/components/editor-v2/EditorV2.scss`, palette block only, the outer-border declaration only. Nothing else.

## Gates
typecheck at baseline (CLAUDE.md §17), vitest on `panelSections.test.ts`, `dataManagerSection.test.ts`, any test reading PWT or E, `npm run build` exit 0, `npm run smoke`. DOM measures at 1600x1000 on three rail states (metamodel, class, attribute selected), Basic and Advanced: rail rect `1200,91,400,877`, palette rect `1,51,200,916` and canvas rect `201,91,1398,876` unchanged; tree row height 26 Basic, 24 Advanced; targets under 24 px in the rail 0 (by `elementFromPoint`); both outer borders 1 px with the same computed colour; icons `#64748b` in Advanced, unchanged in Basic; no text under 11 px; no new clipped text; console errors no more than `init_dash`. Report before/after numbers in the entry.

## Closure
Code commit (pathspec, the two sheets only). Write the log entry in `docs/log-inbox/shell-ui.md` and the `Status:` flip, uncommitted (RC-17). Start a dev server on port 3018 from this worktree (`npm start -- --port 3018`, detached), write its PID to `~/.jjodel-lanes/P-2026-10-19-1930/dev.pid`, leave it running, and exit with `Outcome: hard-stop` (visual check due). On the GO: one docs commit (entry and Status), stop the dev server, `check:docs`, `Outcome: done`.

## NON FARE
No change to `:root` or token files; no rule in `tree-view-sidebar.scss`; no change to the canvas, vertex, toolbar or menu blocks of `EditorV2.scss`; no change to NodeEditor or JjSelect; no file outside DOVE; no dev server on 3000, 3001 or 3003; no push, no merge.

## RIFERIMENTI
`CLAUDE.md` (naming checks, §5, §17); `docs/decisions.md` R-SHELL-2, R-SHELL-3, R-SHELL-5, R-RAIL-7, D-UI-11; the discovery report; S4 entry in `docs/log-inbox/shell-ui.md` for the muted-icon pattern.

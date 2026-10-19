# File › New menu, 3.2 structure (L-E)

Prompt-ID: P-2026-10-19-1650
Lane: full (main menu structure in a 2146-line file, a local menu type extended)
Depends: P-2026-10-19-1618 (New model dialog and `OPEN_NEW_MODEL_DIALOG`, merged on `tpl-int`)
Chat: C-2026-10-19-1501
Front: notation-library
Status: da eseguire
Corregge: none (new work)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes of P-2026-10-19-1510 (L-E after L-D)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-tpl-e`, branch `tpl-e`, created by the chat from `tpl-int` (`tpl-b1` with `tpl-b2`, `tpl-c`, `tpl-d` merged) plus this prompt. Dev server for your own screenshots: `npm start -- --port 3106 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 90 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1650 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in your report section. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it. Before introducing any new identifier `rg` it under `frontend/src`.

## Sources (read first)

- Handoff `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` §6.
- L-A report `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` §2 (menu anatomy, `Navbar.tsx` lines) and the section «P-2026-10-19-1618».
- Trunk rows R-LIB-18 and R-LIB-20: `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A8 'R-LIB-(18|20)'`.

## COSA

The File › New submenu of handoff §6 cut to 3.2 by R-LIB-20 (no BUILT-IN NOTATIONS section, no notation entries, no Browse notations…, in either mode).

1. `MenuEntry` (local, not exported) gains a section-label form (a non-interactive uppercase row, not a disabled item); `makeEntry` renders it. No fourth cascade level anywhere.
2. File › New, replacing today's top-level `New Project` and `New ›`:
   - **Basic:** Project… · divider · Model › (section label CONFORMING TO, then one entry per metamodel of the current project) · divider · From template….
   - **Advanced:** Project… · divider · Metamodel · Model › (as Basic) · Viewpoint · Transformation · divider · From template….
   - Model › above 5 metamodels: the 5 most recent plus More…; More… dispatches `OPEN_NEW_MODEL_DIALOG` with no preselection. Each metamodel entry creates the model at once through `createM1` (no ellipsis), as today.
   - Project… keeps the Alt+Cmd+N shortcut and today's `NEW_PROJECT` dispatch. The report §2 suspects `NEW_PROJECT` is dead inside a project: check it in the browser; if it is dead, make Project… navigate to the dashboard and open its create dialog with the smallest local change in `Navbar.tsx`, or leave it and record it, whichever needs no file outside DOVE.
   - Metamodel: `createM2(project)` as today. Viewpoint: `CREATE_VIEWPOINT`. Transformation: `OPEN_NEW_TRANSFORMATION_DIALOG`. From template…: navigate to `#/templates`.
   - Ellipsis only on items that open a dialog or a page (Project…, From template…, More…).
   - Outside a project: Metamodel, Model, Viewpoint and Transformation disabled; Project… and From template… enabled.
3. All other File items stay as they are, in their order.

## DOVE

`frontend/src/pages/components/Navbar.tsx`, `frontend/src/pages/components/menu/menu.scss` (or `navbar.scss`, whichever already styles menu rows; one of them); closing docs as below.

## Gates

Typecheck, `check:docs`. Browser smoke on 3106 (offline mode, a cloned gallery project): File › New in Basic and Advanced, inside and outside a project, each action once (a model is created and named, the dialog opens from More… with a project of six metamodels if you can build one cheaply, else say so), screenshots under `docs/discovery/assets/tpl-e/`.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits with `(P-2026-10-19-1650)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1650» appended to the L-A report, one entry in `docs/log-inbox/templates-ui.md`, this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane tpl-e · <sha> · visual check owed to the chat (RC-23)`. Then `Outcome: done`.

## NON FARE

No file outside DOVE. No `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, handoff edits. No new dependency. No push. Nothing from the deferred list of R-LIB-20.

## HARD STOP

None before the closing commit.

# Dashboard sidebar and quick tip on Templates (L-B2)

Prompt-ID: P-2026-10-19-1616
Lane: fast (three files, dashboard shell)
Depends: P-2026-10-19-1510 (branch `tplui-disc`, report §1.4, §1.5, §7)
Chat: C-2026-10-19-1501
Front: notation-library
Status: eseguito 2026-10-19 · lane tpl-b2 · b25c41db8 · visual check passed 2026-10-22 11:45 (chat C-2026-10-22-1050, RC-23, built-in browser at 1440×900 on the trunk dev server)
Corregge: none (new work)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes and the Q3/Q4 recommendations of P-2026-10-19-1510

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-tpl-b2`, branch `tpl-b2`, created by the chat from `tplui-disc` plus this prompt. Dev server for your own screenshots: `npm start -- --port 3102 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 60 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1616 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in your report section. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it. Before introducing any new identifier (class, token, export, event) `rg` it under `frontend/src` (CLAUDE.md, name check); use the `tpl-` page prefix where the report §5 says the plain name is taken.

## Sources (read first)

- `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (the handoff; artboards on the Design canvas «Jjodel Templates page»).
- `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` (the L-A report: §1 page, §2 menu, §3 creation, §4 snapshots, §5 tokens, §6 catalog, §7 lane split).
- Trunk rows R-LIB-11..20: `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A8 'R-LIB-(1[1-9]|20)'`. R-LIB-20 fixes the 3.2 cut and the Q3 values.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits as the work needs, conventional type, `(P-2026-10-19-1616)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1616» appended to the L-A report (what was done, measurements, unattended decisions, how to see it), one entry in `docs/log-inbox/templates-ui.md`, and this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane <branch> · <sha> · visual check owed to the chat (RC-23)`. Gates: `npm run -s check:docs` and the gates named below. Then `Outcome: done`.

## NON FARE

No file outside DOVE. No `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, handoff edits. No new dependency. No push. No dark-theme work (D-UI-15). Nothing from the deferred list of R-LIB-20 (Notations page, Built-in tab, notation entries, Collections).

## COSA

Handoff §2.4, within the 3.2 cut of R-LIB-20.

1. In `frontend/src/pages/components/LeftBar.tsx`: on the Templates page the FILTERS group (Private, Public, Collaborative) is not rendered. The active BROWSE/dashboard item carries `aria-current=page`. BROWSE keeps its current items: no Notations item and no Collections item in 3.2 (R-LIB-20).
2. In `frontend/src/pages/dashboard.scss`: the active item gets slate-100 fill, 600 weight and a 3px inset bar in slate-700 (tokens `--color-slate-100`, `--color-slate-700`). This applies to every dashboard page using the same item: accepted (report §8.7); list the pages it changes in the report.
3. In `frontend/src/components/NotificationWidget/NotificationWidget.tsx`: the quick tip «Right-click on elements for more options» is not shown on `#/templates`, extending the existing route check (report §1.5). No change to the remote text source.

## DOVE

The three files above; closing docs as above.

## Gates

Typecheck, `check:docs`. Screenshots at 1440×900 of All projects and Templates showing the active state, the absent FILTERS on Templates and their presence on All projects, under `docs/discovery/assets/tpl-b2/`.

## HARD STOP

None before the closing commit.

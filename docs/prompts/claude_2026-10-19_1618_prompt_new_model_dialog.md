# New model dialog, metamodel tab (L-D)

Prompt-ID: P-2026-10-19-1618
Lane: full (new dialog, ProjectEditor wiring, an optional parameter on an exported creator)
Depends: P-2026-10-19-1510 (branch `tplui-disc`, report §3)
Chat: C-2026-10-19-1501
Front: notation-library
Status: eseguito 2026-10-19 · lane tpl-d · 6d70d38c1 · visual check passed 2026-10-22 11:45 (chat C-2026-10-22-1050, RC-23, built-in browser at 1440×900 on the trunk dev server)
Corregge: none (new work)
Request: Alfonso, 2026-10-19 16:09, in the project chat: «Si velocissimo», on the lanes and the Q3/Q4 recommendations of P-2026-10-19-1510

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Worktree: `~/jjodel-w-tpl-d`, branch `tpl-d`, created by the chat from `tplui-disc` plus this prompt. Dev server for your own screenshots: `npm start -- --port 3104 --strictPort`, stopped before the end.

Model and tier: as `lane-run` decides; effort `high`. Time limit 90 minutes.

## Lane discipline

Every reply opens with `[P-2026-10-19-1618 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list; decisions you take go in a «Decisions taken (unattended)» list in your report section. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole. Before anything else: `pwd`, branch and `git log -1` match the Worktree line; otherwise `Outcome: blocked`. `frontend/node_modules` is a symlink (P14), leave it. Before introducing any new identifier (class, token, export, event) `rg` it under `frontend/src` (CLAUDE.md, name check); use the `tpl-` page prefix where the report §5 says the plain name is taken.

## Sources (read first)

- `docs/design/claude_2026-10-19_design_handoff_templates_notations_file_new.md` (the handoff; artboards on the Design canvas «Jjodel Templates page»).
- `docs/discovery/discovery_2026-10-19_templates_notations_file_new.md` (the L-A report: §1 page, §2 menu, §3 creation, §4 snapshots, §5 tokens, §6 catalog, §7 lane split).
- Trunk rows R-LIB-11..20: `git show alfonso-frontend-jjtl:docs/decisions.md | rg -n -A8 'R-LIB-(1[1-9]|20)'`. R-LIB-20 fixes the 3.2 cut and the Q3 values.

## Closing (P13, RC-17), explicit pathspecs, no push

Code commits as the work needs, conventional type, `(P-2026-10-19-1618)` suffix, trailer `Model:` (P6). Then one docs commit: a section «P-2026-10-19-1618» appended to the L-A report (what was done, measurements, unattended decisions, how to see it), one entry in `docs/log-inbox/templates-ui.md`, and this prompt's `Status:` flipped to `eseguito 2026-10-19 · lane <branch> · <sha> · visual check owed to the chat (RC-23)`. Gates: `npm run -s check:docs` and the gates named below. Then `Outcome: done`.

## NON FARE

No file outside DOVE. No `decisions.md`, `PROTOCOL.md`, `CLAUDE.md`, handoff edits. No new dependency. No push. No dark-theme work (D-UI-15). Nothing from the deferred list of R-LIB-20 (Notations page, Built-in tab, notation entries, Collections).

## COSA

Handoff §5 with only the «Metamodel in this project» tab (R-LIB-20: no Built-in tab in 3.2, so no tab bar either: a single panel titled by the dialog).

1. New `frontend/src/components/NewModelDialog/NewModelDialog.tsx` and `.scss`: `role=dialog`, `aria-modal`, `aria-labelledby`; title «New model», subtitle «Choose what the model conforms to.», close button labelled «Close». A list of the project's metamodels (single choice, `aria-pressed` or radio), a «Model name» field defaulting to the auto name `createM1` would give, Cancel (secondary) and Create model (primary). Reuse `.dialog-overlay`/`.dialog-content` (report §5) and `components/common/Button`. Size: the handoff's 1000×720 is for two tabs; size it to its content, max 720px wide.
2. `createM1(project, metamodel, open = true, name0?: string)` in `frontend/src/pages/components/Navbar.tsx:102`: an optional trailing name, used when given and unique among `metamodel.models` (else the existing suffix rule). Nothing else in `Navbar.tsx`.
3. `frontend/src/events/registry.ts`: a constant `OPEN_NEW_MODEL_DIALOG` (check it is free), payload optional `{ metamodelId?: string }` to preselect.
4. `frontend/src/components/project/ProjectEditor.tsx`: `handleNewModelClick` (`:1124`) and the `CREATE_MODEL` listener (`:1166`) open the dialog instead of creating directly, preselecting when there is exactly one metamodel; a listener for the new event. With no metamodel the dialog shows the empty state «This project has no metamodel yet.» and a disabled Create.
5. If the critical-zone hook asks for a Layer Impact Report on `createM1` (report §8.5), write it in `docs/lir/` and proceed: the chat launched this lane with the critical-zone go-ahead (RC-30).

## DOVE

`frontend/src/components/NewModelDialog/NewModelDialog.tsx` (new), `frontend/src/components/NewModelDialog/NewModelDialog.scss` (new), `frontend/src/pages/components/Navbar.tsx` (only `createM1`), `frontend/src/events/registry.ts`, `frontend/src/components/project/ProjectEditor.tsx`, `docs/lir/` if needed; closing docs as above.

## Gates

Typecheck, the existing unit tests touching `createM1` if any, `check:docs`. A browser smoke on port 3104: open a gallery project with one metamodel and one with two, create a named model through the rail `+`, check it appears with that name; screenshots under `docs/discovery/assets/tpl-d/`.

## HARD STOP

None before the closing commit.

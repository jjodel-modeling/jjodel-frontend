# Code generation S8: the two lecture examples as projects a student imports

Prompt-ID: P-2026-10-11-1415
Chat: C-2026-10-10-0046
Lane: full (discovery of the project import path, two exported project files, README update, a probe that imports
them; a light visual check). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: P-2026-10-11-1052, P-2026-10-11-1053
Front: codegen-pilot
Request: https://claude.ai/code/session_01QYGEHstF7K66SVXwe8L7ep
Status: eseguito 2026-10-11 · lane codegen-examples · discovery 2cf1ae68c · code 4a7fb2755 · log 0e6153215 · tsc 14 = base, vitest src/codegen 345 (329 + 16), build exit 0 (files in dist/examples/codegen), check:codegen-lazy green, probes codegen-examples 71/71, codegen-panel 46/46, codegen-oracle 35/35, codegen-check 43/43, build script 21/21, mutation bench 3/3 · visual check passata 2026-10-11 (RC-23 by the chat on 3 crops, GO by Alfonso 15:37); files are .jjodel, not .jjodel.json; ticket: ProjectEditor Download button writes a format Import cannot read (read, not run)
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-codegen-examples`, branch `codegen-examples`, cut from the trunk tip that carries S1..S7b
(merge `f735959f6`, P-2026-10-11-1250, or later); the branch carries the docs commit adding this prompt.
`frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, a clean `git status`, and
`frontend/src/codegen/examples/turnstile/README.md`, `frontend/src/codegen/ui/CodePanel.tsx`,
`frontend/src/components/common/ExportImportMenu.tsx` present. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-11-1415 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)

The lecture on code generation is at the end of October; the 3.2 freeze is 2026-10-23. Read the log entries in
`docs/log-inbox/codegen-*.md` first (S6 oracle, S7a names, S7b check above all) and R-GEN-11, R-GEN-15, R-GEN-17 in
`docs/decisions.md`.

Today a student cannot get the two lecture examples into the app. `frontend/src/codegen/examples/{turnstile,
petri-producer-consumer}/` hold JSON **fixtures** for the tests (a `lookup` with readable ids, a scenario, a mutation),
not projects. The READMEs have the student write `genTemplates` from the browser console and, for the Petri net, build
the model with 42 JjScript commands; the scenario is recorded by hand. S6 filed this as a ticket.

Jjodel already exports and imports projects: `components/common/ExportImportMenu.tsx`,
`components/common/ImportDropZone.tsx` (dashboard and project editor), with `.json` files. There is no example
gallery in the app and nothing under `frontend/public/` that serves example projects.

What the student must be able to do, with no console and no JjScript: get one file per example, import it with the
app's own Import, open the model, turn on the Code panel setting, press «Generate», «Run», and «Check» on the stored
scenario, and see the pass line of S7b.

## WHAT

1. **Phase 1, discovery (read-only, short).** Find the export format and the import path (which component, which
   function, what the file holds, whether `_state` keys such as `genTemplates`, the simulation roles and
   `runScenarios` survive an export and an import, how ids are remapped on import, and whether a project imported
   twice gets a suffixed name). Write the report to `docs/discovery/discovery_2026-10-11_codegen_importable_examples.md`
   (naming `discovery_<date>_<description>.md`; objective, files read with full paths, findings, risks, open
   questions). Do not stop after it unless a finding below applies; then continue with Phase 2.
   - If a `_state` key the examples need does **not** survive export and import, stop with `Outcome: question` and a
     `Recommended:` line: changing persistence is out of scope here.
2. **Phase 2, the files.** Produce one importable project file per example with the app's own export, not by hand:
   a probe builds each example in a running app (from the fixture: metamodel, model, simulation roles, templates,
   data declarations; the Petri net through the README's JjScript), records the fixture's scenario in the model's
   stored scenarios under the same name, then calls the same export function the menu calls and saves its output.
   Commit the two files as `frontend/public/examples/codegen/turnstile.jjodel.json` and
   `frontend/public/examples/codegen/petri-producer-consumer.jjodel.json` (if the export's natural extension differs,
   use it and say so), so that a deployed app serves them at `/examples/codegen/…` and a student can download them.
   Also add a small `frontend/scripts/examples/build-codegen-examples.ts` (or the probe itself, say which) that
   regenerates both files, so they can be rebuilt when the format changes.
3. **Round trip, as a test and in the probe.** In a fresh app session: import each file through the same import
   path a user takes (the drop zone or the menu's file input, not a store call), open the model, enable the setting,
   «Generate» with no errors, «Run» with no runtime error, «Check» on the stored scenario: the pass line with the
   expected step count (7 for the turnstile, 8 for the Petri net). Then import the same file a second time and assert
   that both projects work (ids remapped, no collision with the first import). A node test, if the export and import
   functions are callable without React, checks the same `_state` keys survive a round trip.
4. **READMEs.** Rewrite the "how to run it" part of both READMEs in English for a student: download the file
   (the `/examples/codegen/…` URL and the repo path), Import, open the model, turn on the Code panel in Advanced
   settings, Generate, Run, Check, and how to try the mutation from the Templates tab. Keep the console path only as
   a short note for developers. Follow the writing rules of the project (no em dashes, no filler).
5. **Crops**, light theme, into the lane folder's `crops/`: the dashboard right after importing the turnstile file;
   the Code panel of the imported turnstile after «Check» (pass line); the same for the Petri net
   (`import_dashboard.png`, `turnstile_check.png`, `petri_check.png`).
6. **Gates**: `npx tsc --noEmit` (same set as base), `src/codegen` suites (base counts plus new), `npm run build`
   (and confirm the two files are copied to the build output), `npm run check:codegen-lazy`, `typecheck:scripts`,
   `check:scripts`, the existing codegen probes (`codegen-panel`, `codegen-oracle`, `codegen-check`) unchanged and
   green, the new probe. Mutation bench (P11), in the commit body: the export drops `runScenarios`; the file of one
   example carries the other's templates; the second import reuses the first import's ids. Survivors are reported.
7. **Commits**: one `docs(discovery): …` commit with the report; one `feat(codegen): …` commit with the files, the
   script, the probe and the READMEs; then the log entry with the `log-entry` skill into
   `docs/log-inbox/codegen-examples.md` in a docs commit. Stop with `Outcome: hard-stop` after the crops. No merge.

## DOVE

`frontend/public/examples/codegen/*`, `frontend/scripts/examples/` (new), the probe under `frontend/scripts/probe/`,
`frontend/src/codegen/examples/*/README.md`, a test under `frontend/src/codegen/examples/__tests__/` if point 3 allows
it, `docs/discovery/discovery_2026-10-11_codegen_importable_examples.md`, `docs/log-inbox/codegen-examples.md`.

## NON FARE

- No edit to the export or import code, to persistence, to `VersionFixer`, to any component under
  `frontend/src/components/`, or to `frontend/src/codegen/` outside the READMEs and the new test. If the round trip
  needs one of those, stop with `Outcome: question` and a `Recommended:` line.
- No example gallery, no new button, no new menu entry in this slice.
- No change to the fixtures or to the existing tests.
- No dependency, no `git add .`, no `git stash`, no push.

## RIFERIMENTI

- R-GEN-11, R-GEN-15, R-GEN-17; S6, S7a, S7b log entries; the two example READMEs.
- `CLAUDE.md` (writing rules, discovery report), `docs/PROTOCOL.md` P8, P9, P11, P13, P14, P16.

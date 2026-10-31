# Generators panel export anomalies and three import behaviours

Prompt-ID: P-2026-10-31-1342
Chat: C-2026-10-31-1328
Front: codegen
Status: da eseguire
Lane: full (six observations across the Generators panel, the Code panel and two importers, two-phase)
Depends: none
Worktree: ~/jjodel-w-genanom, branch gen-anomalies (from alfonso-frontend-jjtl 5b19ebfc8)
Request: none (typed in the project chat on 2026-10-31; kept locally via --request)

Before anything else run `pwd` and `git branch --show-current`; if the answer is not `~/jjodel-w-genanom` on
`gen-anomalies`, stop with `Outcome: blocked`. Check that `P-2026-10-31-1342` exists only as this file in
`docs/prompts/` and as this lane in `~/.jjodel-lanes/`. Every reply opens with `[P-2026-10-31-1342 · session <id>]`.

No subagents, no background tasks. One probe run per tool call.

## COSA

Two generators on one metamodel, exported with "Export as JSON" from the Generators panel (format
`jjodel-generator` 1.0, P-2026-10-30-1430, on the trunk since 1ed207097):

1. Top-level `entry` is "template1" in both files, while the output's entry is in `files[0].entry` ("main"). In
   one of them no template is named "template1". Either the top-level field is stale or it is not updated when
   the entry template is renamed or the files list is set.
2. One generator holds ten templates named template1, template3, ..., template19, all `mode: "text"`, empty
   bodies. It was meant to hold ten named templates with bodies (imported from a file, or entered by hand: not
   confirmed). Check whether an import can create placeholders and then fail to fill them silently.
3. A template meant as an expression (`temporal`) is `mode: "text"`. If the importer or the editor changed the
   mode, it prints its body verbatim.

Later the same day a generator imported from a file in the export format (24 templates, three files) round
trips: export equals the imported file. Points 1 and 3 may concern only generators edited in the panel.

4. After deleting a metamodel, its generator stays selected in the Code panel as "<name> (gone)", the preview
   keeps generating from it, and only the template pane says nothing can be saved. Expected: the panel switches
   to a live metamodel, or the preview is disabled.
5. Importing a model (XMI) whose `xsi:type` names a class the loaded metamodel lacks creates instances of the
   abstract supertype, drops their children, and ends with "Success with warnings". Expected: never instantiate
   an abstract class; the import fails, or the affected objects are skipped and counted in a warning that names
   the missing class.
6. To be confirmed: importing a newer Ecore with the same nsURI did not replace the loaded metamodel; the classes
   appeared only after deleting the old one and importing again.

Expected overall: export, import, export gives the same file; the top-level entry is consistent with `files`; an
import that cannot create a template reports it instead of leaving a placeholder.

## DOVE

To establish in discovery. Expected: `frontend/src/codegen/engine/generatorFile.ts`,
`frontend/src/codegen/ui/generatorTransfer.ts`, the generator store and the panel that creates and renames
templates and sets `files`, the Code panel selection, the XMI importer (`handleImportXmi` in
`frontend/src/components/project/ProjectEditor.tsx` and its helpers), the Ecore importer.

## COME

### Phase 1: discovery (read-only)

For each point: reproduce it with a node test or a reading of the code path (state which), give the root cause
with file and line, or say it does not reproduce and why. For 2, find every path that creates a template named
`template<N>` and whether any import path can stop after creating it. For 6, say what the Ecore importer does
on an nsURI collision today and whether replacing is a behaviour change that needs Alfonso (it can delete
classes that models instantiate: say so). Propose the Phase 2 split: which points form one lane, which must be
separate (importers versus Generators panel), and which need a decision from Alfonso. Grep every new
identifier you plan to add.

Save the report as `docs/discovery/discovery_2026-10-31_generators_export_and_import_anomalies.md` (objective,
files read with full paths, findings, risks, open questions), commit it (`git add` that file only), and stop:
hard stop with `Outcome: hard-stop`.

## RIFERIMENTI

- P-2026-10-30-1430 (generator file format) and its discovery report
- `docs/decisions.md` R-GEN rows (R-GEN-25 on `mode`)

## Lane discipline

`git add <specific files>` only. Conventional commit messages in English, one line, suffix `(P-2026-10-31-1342)`.
No push, no merge into the trunk. Report closes with «Decisions taken (unattended)» and «Decisions awaiting
Alfonso», then `Outcome: done | hard-stop | question | blocked`.

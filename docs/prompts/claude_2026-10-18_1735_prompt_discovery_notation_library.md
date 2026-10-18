# Notation library and project gallery: seal, provenance, clone, packaging (discovery)

Prompt-ID: P-2026-10-18-1735
Chat: C-2026-10-18-0110
Front: notation-library
Lane: full (discovery, read-only; heavy)
Status: eseguito 2026-10-18 · lane notation-library · Phase 1 report, docs commit carrying this line · hard-stop, no Phase 2 without GO
Request: Alfonso, 2026-10-18 17:28, «adesso procedi in autonomia fino all'implementazione», after ratifying R-LIB-1..6 (`docs/decisions.md`, series R-LIB) and the catalog `docs/library/catalog.json`
Depends: —
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-library`, branch `notation-library-disc`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1735 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the report under «Decisions taken (unattended)».
Time limit: 75 minutes. Phase 1 only: read-only on `frontend/` and `backend/` if present; the only writes are the report and the docs commit.
Output discipline (CLAUDE.md §0.1): read long files with `offset`/`limit` around the lines a grep names.

## Context (decided, do not reopen)
Read the R-LIB series in `docs/decisions.md` and `docs/library/catalog.json` first. In short: a *sealed notation* (case 1) is a complete language the user only models with; its M2 components (metamodel, viewpoints, validation, simulation profile, codegen templates) are copied into the project, hidden as the default syntax is, marked with the notation's id and version, and protected on every M2 write path, not only in the UI; no unlock into an editable project. A *gallery project* (case 2) is cloned into the user's workspace and owned entirely; the original never changes. The catalog file is the source of what is shared until an administration service replaces it with the same schema. The parked specs `docs/spec/parcheggiate/spec_parcheggiata_templates_featured_projects.md` and `spec_parcheggiata_templates_explore.md` keep their clone semantics (deep copy, new ids, passive `_clonedFrom`) and read-only opening; their server-side `featured` flag and `curator` role are amended by R-LIB-6.

Measured by the chat (do not redo): derived notations live in `frontend/src/components/editor-v2/viewpoint/derive/notations.ts` (`DERIVED_NOTATIONS`) with `utils/deriveViewpoint.ts`; the derived binding is persisted on the viewpoint's `_state` (`derivedFrom`, `derivedNotation`, `derivedRole_<classId>`); symbol presets are in `viewpoint/ir/notationCatalog.ts`; the codegen examples ship as `frontend/public/examples/codegen/*.jjodel`, built by `frontend/scripts/examples/build-codegen-examples.ts`; the classic Ecore/XMI sources of R-LIB-5 are under `frontend/src/__tests__/fixtures/xmi-m1/`; the BPMN and statechart benchmarks are built by `frontend/scripts/probe/bpmn-lanes-fixture.ts` and `statechart-fixture.ts`.

## Questions (answer each with file:line evidence and a `Recommended:` line)
- **Q1 Hiding.** How is the default syntax (default viewpoint) hidden today: tree, rail, viewpoint lists, menus, panels? Can the same mechanism hide every M2 component of a sealed notation, or does it need a general marker? Where would the provenance (notation id, version) live in the persisted project so that export and import keep it (R-B9 persisted names)?
- **Q2 Write paths to M2.** List every path that can create, change or delete an M2 element or a viewpoint/STC/validation/template of a project: canvas and properties panel, tree, menus, JjScript (console and scripts), Jjodie (what it executes), JjTL (can a target be M2?), import (.jjodel, XMI/Ecore), VersionFixer, undo/redo, paste. Find the narrowest choke point(s) where a «sealed element» guard would intercept all of them; say whether it falls in the critical zone (`useJjomSync.ts`, `portDistribution.ts`, reducer) and what a Layer Impact Report would cover. Separate what a UI-only guard covers from what needs the core.
- **Q3 Project shape.** How a project holds its metamodels and models; whether an M1 model can be created in a project whose metamodel was copied in; what «new project» and «import project» do today, client side and server side (endpoints, if any).
- **Q4 Read-only.** Does a read-only mode of the editor exist (open question #1 of the parked spec)? If not, what would it touch?
- **Q5 Gallery clone.** The Dashboard sidebar has a Templates entry: its state today. Can a gallery clone be done entirely on the client (fetch a `.jjodel` from `frontend/public/library/`, import it as a new project with new ids and `_clonedFrom`), the way the codegen examples are imported? What does it need from the backend, if anything?
- **Q6 Classic Ecore projects.** Can the current XMI/Ecore importer turn Library, Families and Persons, StateMachine, Graph and Shapes (R-LIB-5) into `.jjodel` projects with default viewpoints, by a build script like `build-codegen-examples.ts`? What is missing (Library, Graph and Shapes have no M1)?
- **Q7 Sealed package format.** Propose the on-disk format of a sealed notation (for instance a `.jjodel` built by a script under `frontend/public/library/notations/<id>/` plus the catalog entry) and the «new model from a notation» flow: where in the UI it starts, what it copies, how the project shows only the model editor. Which existing piece of the derived notations (IR views, layout profiles, simulation profiles) can a sealed package reuse as is.
- **Q8 Slices.** Propose the slices in order, each with its files, its lane kind (fast/full and trigger), whether it is in the critical zone, and a probe that proves it. Name the first two slices that can run without touching the critical zone. Say which slices could land before the 3.2 freeze of 2026-10-23 (this is a question for Alfonso, not a decision of the lane).

## Report
Save it as `docs/discovery/discovery_2026-10-18_notation_library.md` (naming `discovery_<date>_<description>.md`, folder `docs/discovery/`). It opens with `## 0. Answer in brief`, at most 40 lines: the answers, the recommendation, the decisions awaiting Alfonso, and the questions with their `Recommended:` lines; the rest is appendix, with the file paths read.

## Commits (P13), explicit pathspecs
One docs commit: the report, the log entry in `docs/log-inbox/notation-library.md` (§21.2, `Corregge: —`) and the Status flip of this prompt. `npm run check:docs` must pass. No push, no merge (RC-19).

## HARD STOP
At the end of Phase 1, `Outcome: hard-stop`. No Phase 2 without a GO from the chat.

## NON FARE
No change under `frontend/src`, `frontend/public` or `frontend/scripts`. No new dependency. No edit of `docs/decisions.md` or `docs/library/catalog.json`.

## RIFERIMENTI
`docs/decisions.md` (R-LIB, R-VP-21, R-B9, R-GV); `docs/library/catalog.json`; the two parked specs above; `frontend/src/utils/deriveViewpoint.ts`; `frontend/src/components/editor-v2/viewpoint/derive/notations.ts`; `frontend/scripts/examples/build-codegen-examples.ts`; `frontend/src/codegen/examples/__tests__/importable.test.ts`.

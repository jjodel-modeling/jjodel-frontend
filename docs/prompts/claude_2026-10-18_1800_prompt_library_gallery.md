# Library gallery: build the five R-LIB-5 projects and clone them from Templates (slices S1 and S2)

Prompt-ID: P-2026-10-18-1800
Chat: C-2026-10-18-0110
Front: notation-library
Lane: full (more than 3 files; new build script and assets, Templates page)
Status: da eseguire
Request: Alfonso, 2026-10-18 17:28, «adesso procedi in autonomia fino all'implementazione», on R-LIB-1..6 and `docs/library/catalog.json`
Depends: P-2026-10-18-1735 (discovery, `docs/discovery/discovery_2026-10-18_notation_library.md`)
Corregge: —

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gallery`, branch `library-gallery`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and `git status` match; otherwise stop with `Outcome: blocked`. Runs in parallel with P-2026-10-18-1801 (RC-22): that lane only adds `frontend/src/model/librarySeal.ts` and its tests.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-18-1800 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`. Unattended (RC-21, RC-25): take the recommended answer on every question outside the RC-26 list and record it in the report.
Time limit: 90 minutes. No separate discovery: the discovery report above is the discovery (§0, §6, §7, §9 rows S1 and S2, «Decisions taken (unattended)» 2, 3, 6, 7). Append a section «Gallery S1+S2 (P-2026-10-18-1800)» to it with what you measured.

## S1 — build the gallery (first commit)
1. Write the missing sources under `frontend/scripts/library/gallery/`: `Families.ecore` and `Persons.ecore` matching the classic Families2Persons metamodels so that `sample-Families.xmi` and `sample-Persons.xmi` (fixtures in `frontend/src/__tests__/fixtures/xmi-m1/`) resolve by nsURI or EPackage name (`XMIService.ts:36-58`); small sample M1 XMIs for Library (a library with at least 3 books, 2 writers, the references set), Graph (at least 4 nodes, 5 edges) and Shapes (at least one instance per concrete class). Copy, do not move, the fixtures you reuse.
2. `frontend/scripts/library/build-gallery.ts`: a Playwright build run through `lane-run probe`, on the model of `frontend/scripts/examples/build-codegen-examples.ts` (import the Ecore with the app's own importer through `setInputFiles` or `page.evaluate`, then the XMI M1, then export via File → Download Project). One project per catalog entry of kind `galleryProject`: `library`, `familiesPersons` (both metamodels, both models, in one project), `stateMachineEcore` (the Heater model, with its deliberate `Broken` instance kept), `graph`, `shapes`. Output: `frontend/public/library/gallery/<id>.jjodel`. Project names are the catalog labels. Projects render with the default syntax (R-IRN-15); add no viewpoint.
3. A vitest file `frontend/src/library/__tests__/gallery.test.ts` on the model of `codegen/examples/__tests__/importable.test.ts`: every catalog `galleryProject` has its file, the file is well formed, carries the expected counts of metamodels, models and objects, and no id is a prefix of another.
4. In `docs/library/catalog.json`, for each built entry: `"status": "available"` and `"package": "library/gallery/<id>.jjodel"` (the path under `frontend/public`). Keep the file's formatting.

## S2 — clone from Templates (second commit)
1. `frontend/src/pages/Templates.tsx`: replace the `ComingSoonPlaceholder` with a card grid of the catalog's available `galleryProject` entries (label, the counts of metamodels and models, a one-line description you add as an optional `description` field in the catalog for each gallery entry). The catalog is imported at build time from `docs/library/catalog.json` only if Vite can reach it cleanly; otherwise copy it at build into `frontend/public/library/catalog.json` with a small script and fetch it. Say which in the report. Design system tokens only, slate/cyan, Bootstrap Icons, 11px secondary text, 8px grid, no layout shift.
2. Each card has a primary button «Clone to my workspace» that opens a small modal with «Project name» prefilled with the label, Cancel and «Clone & open». The clone is client side: `fetch` the package, `.text()`, `ProjectsApi.importFromText`, then open the new project.
3. `frontend/src/api/persistance/projects.ts`: honour the unused `name` parameter of the import (`projects.ts:257`) so a clone gets the chosen name and no « copy» suffix; set `_clonedFrom: <catalog id>` on the DProject entry inside the state blob (the online DTO drops top-level unknown fields). Keep the existing behaviour of the other callers (File > Import keeps its « copy» suffix). If the name collides with an existing project, apply the `(1)`, `(2)` convention.
4. Probe the megamodel registration under the old id (`projects.ts:264-265`): if the clone loses the megamodel edges, open a ticket with `lane-run ticket --front notation-library` and do not fix it in this lane unless the fix is one line in `projects.ts`.

## Checks
Typecheck, the new vitest file and `npm run build` pass. Headless probe on its own port (never 3000, 3001, 3003), via `lane-run probe`: for each of the five entries, clone from Templates, then the new project id differs from the file's, the name is the chosen one, `_clonedFrom` survives save and reopen, the metamodels/models/objects counts match the file, and the default editor shows the model. Screenshots of the Templates page and of one cloned project at 1440×900, light theme, into `docs/discovery/assets/library-gallery/`. Leave the dev server running for the chat's visual check (RC-23).

## Commits (P13), explicit pathspecs
1. `feat(library): build the five gallery projects (S1, P-2026-10-18-1800)`: sources, build script, packages, test, catalog.
2. `feat(library): clone gallery projects from Templates (S2, P-2026-10-18-1800)`: Templates page, projects.ts, catalog descriptions and anything the catalog delivery needs.
3. Report section, screenshots, log entry in `docs/log-inbox/notation-library.md` and Status flip: written in the worktree, left uncommitted for the chat's closure commit after the visual check.

No push, no merge (RC-19). Hard stop after the checks: `Outcome: hard-stop`.

## NON FARE
No change to `redux/reducer/reducer.ts`, `joiner/`, `useJjomSync.ts`, `portDistribution.ts`, the importers (`EcoreService.ts`, `XMIService.ts`) or the backend. No read-only mode (slice S7). No sealed notation work (S3..S6). No new dependency. Do not touch the derived-notation files.

## RIFERIMENTI
`docs/discovery/discovery_2026-10-18_notation_library.md`; `docs/library/catalog.json`; `docs/decisions.md` R-LIB-1..6; `docs/spec/parcheggiate/spec_parcheggiata_templates_featured_projects.md` (UX of the clone modal); `frontend/scripts/examples/build-codegen-examples.ts`; `frontend/src/codegen/examples/__tests__/importable.test.ts`; `frontend/src/api/persistance/projects.ts:257-298`; `frontend/src/pages/Templates.tsx`.

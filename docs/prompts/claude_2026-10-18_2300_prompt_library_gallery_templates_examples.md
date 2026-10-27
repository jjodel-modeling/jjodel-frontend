# Library gallery: templates and examples, versioned and citable (R-LIB-9)

Prompt-ID: P-2026-10-18-2300
Chat: C-2026-10-18-2254
Front: notation-library
Lane: full (more than 3 files: build script, seven packages, catalog, Templates page, route, test, probe)
Status: eseguito 2026-10-18 · lane notation-library · 4a3c1db49 (correction round 2) · verifica visiva passata 2026-10-19 16:41 (Alfonso, RC-23)
Request: Alfonso, 2026-10-18 22:54, «scrivi e lancia la lane della galleria secondo R-LIB-9»
Depends: P-2026-10-18-1800 (gallery S1+S2, closure 04b9d9a48), P-2026-10-18-2150 (S1b, held without GO)
Corregge: P-2026-10-18-2150 (derived viewpoints rejected at the chat's visual check, superseded by R-LIB-9)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-gallery`, branch `library-gallery`, HEAD `2925b96d8` plus this prompt cherry-picked by the chat. Expected dirty state at start (left by 2150, yours to commit in step 0): modified `docs/discovery/discovery_2026-10-18_notation_library.md`, `docs/log-inbox/notation-library.md`, `docs/prompts/claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`, three PNGs under `docs/discovery/assets/library-gallery/`; untracked `viewpoint-*.png` there. Anything else: `Outcome: blocked`. A dev server on port 3095 serves this tree for Alfonso: do not stop it.

Model and tier: heavy, Opus 5.5 as pinned (RC-16), effort `high`. Time limit 90 minutes.

## Lane discipline
Every reply opens with `[P-2026-10-18-2300 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; every question with a recommendation carries `Recommended: <one line>`. Unattended (RC-21, RC-25): outside the RC-26 list take the recommended answer and record it. Append a section «Gallery templates and examples (P-2026-10-18-2300)» to `docs/discovery/discovery_2026-10-18_notation_library.md`. If the AM-8 ceiling stops you, leave the handoff as usual: steps 1 and 2 are committed separately so a cut loses at most one step.

## The decision you implement (R-LIB-9, on the trunk, not on this branch)
Two tiers. A *template* is a small didactic project teaching one concept: metamodel, a sample model, one clear viewpoint written by hand with the IR (never derived). An *example* is a complete case of a whole language. Every entry has a stable id and explicit versions; a published version is never rewritten (a fix is a new version); deep link `/templates/<id>@<n>`. One folder per id: `frontend/public/library/gallery/<id>/<n>.jjodel`, sources under `frontend/scripts/library/gallery/<id>/`. The tier is a catalog field (`tier: template | example`), not a folder. The Templates page shows two sections. In 3.2: the five R-LIB-5 projects as templates, `turnstile` and `petri-producer-consumer` as examples.

## COSA

**Step 0, record and revert.** Commit the S1b record as left on disk, with the 2150 Status rewritten to `Status: eseguito 2026-10-18 · lane notation-library · 2925b96d8 · held without GO, superseded by R-LIB-9 (P-2026-10-18-2300)` and the inbox entry's `Outcome` ❌, `Causa` (f). Then `git revert --no-edit 2925b96d8`.

**Step 1, structure.**
- Ids, final and citable (chat's decision, vetoable): `library`, `families-persons`, `state-machine`, `graph`, `shapes`, `turnstile`, `petri-producer-consumer`. Rename the S1 entries accordingly; nothing is published yet, so no citation breaks.
- Catalog (`docs/library/catalog.json`, top-level `version: 2`): each gallery entry gains `tier`, `version` (current n) and `versions: [{ n, file, published, sha256, notes }]`, `status: available`. All seven at version 1, `published: 2026-10-18`.
- Files: `public/library/gallery/<id>/1.jjodel`; sources moved to `scripts/library/gallery/<id>/`. The two examples are copied from `public/examples/codegen/` (those files stay where they are: their README points at them).
- `_clonedFrom` on a clone becomes `<id>@<n>`.
- Templates page: two sections, «Templates» then «Examples», cards in catalog order, each card shows `<id>@<n>`. Only the current version gets a card.
- Deep link: under the HashRouter the route is `#/templates/:ref`, `ref` = `<id>@<n>` or `<id>` (current version). It opens the page with that version's clone dialog prefilled. An unknown id or version shows one line above the sections, `No gallery entry <ref>.`, and the page as usual.

**Step 2, hand-written template viewpoints.** One viewpoint per template metamodel, written with the IR as the probes do (`buildViewpoint` in `scripts/probe/bpmn-lanes-fixture.ts:311`; `SC_VIEWS` in `scripts/probe/statechart-fixture.ts:94` shows hidden containers, graphVertex frames, object-as-edge transitions, and a reference edge drawn clear). It is the project's active viewpoint on open (`activateViewpoint`, as S1b found). Name it after the metamodel (`Graph`, `Library`, `Families`, `Persons`, `StateMachine`, `Shapes`). Acceptance criteria, mechanical, on the sample models:
- `graph`: 4 Node vertices labelled by name; the Graph object not drawn; one arc per (Edge, target) pair, source node to target node, open arrow; 0 rows, 0 containment arcs. If an object-as-edge cannot fan out over a multi-valued `target`, make `Edge.target` single-valued in the gallery's `Graph.ecore` and split the two-target edge into two Edges (fixture untouched); record it.
- `library`: Book, Magazine, Writer and Member as vertices (no Book as a row); the Library object not drawn; one arc per `authors` value Book→Writer and per `borrowedBy` value; 0 containment arcs.
- `state-machine`: the StateMachine not drawn; one vertex per State, initial and final told apart by `kind` (filled dot, double circle; mind R-FRM-3 on enum values); a State with `substates` as a graphVertex frame; one arc per Transition labelled `trigger [guard]` (guard part only when set); `outgoing` drawn clear; 0 containment arcs; every vertex inside the viewport after fit (S1b had `Broken` under the minimap).
- `families-persons`: each Family a frame headed by `lastName` holding its Members labelled by `firstName`; Persons: Male and Female vertices by `fullName`, told apart by one shape or border, not by colour alone; 0 rows, 0 containment arcs.
- `shapes`: the Canvas a frame headed by `name`; Circle drawn as a circle, Square as a square, each labelled `label`; 0 containment arcs.
The card count line becomes «N metamodels · N models · N viewpoints», viewpoints other than `Default`.

**Examples.** Package them unchanged; screenshot each of their viewpoints; record what you see (defects included) as observations. Do not edit their viewpoints in this lane.

## DOVE
`frontend/scripts/library/build-gallery.ts`, `frontend/scripts/library/gallery/**`, `frontend/public/library/gallery/**`, `docs/library/catalog.json` and its committed copy `frontend/public/library/catalog.json`, `frontend/src/pages/Templates.tsx` (and its scss if any), `frontend/src/App.tsx` (one route), `frontend/src/api/` only where `_clonedFrom` is written, `frontend/src/library/__tests__/gallery.test.ts`, `frontend/scripts/probe/library-gallery-clone.ts`. No editor, IR or `deriveViewpoint.ts` change: if a criterion needs one, stop and ask with a recommendation.

## Checks
Typecheck at baseline, the gallery test (per version: the file's sha256 equals the catalog's; the catalog copy equals `public/library/catalog.json`; per template: one non-Default viewpoint, active on open, with the expected view kinds), `npm run build`. Mutation bench on the sha check and the ref parser (in place, restored). The clone probe, own port (never 3000, 3001, 3003, 3095), 1440×900, light: clone each of the seven, open, assert each criterion above from the DOM (vertex, arc and row counts; no `.react-flow__edge` between a container and its children), screenshot `docs/discovery/assets/library-gallery/<id>.png` (examples: one per viewpoint), `templates-page.png`, and the deep link `#/templates/graph@1` and `#/templates/nope@9`.

## Commits (P13), explicit pathspecs
1. docs: S1b record (step 0). 2. the revert. 3. `feat(library): versioned gallery folders, two tiers, deep link (P-2026-10-18-2300)` plus `docs(library): catalog v2 (P-2026-10-18-2300)`. 4. `feat(library): hand-written template viewpoints (P-2026-10-18-2300)`. Report section, screenshots, inbox entry and Status flip: uncommitted for the chat's closure after the visual check (RC-17). No push, no merge (RC-19). `Outcome: hard-stop` at the end, with the port that serves this tree.

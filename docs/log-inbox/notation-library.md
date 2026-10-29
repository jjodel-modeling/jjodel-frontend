# log-inbox — lane «notation-library»

Entries written by the notation-library lanes on `notation-library-disc` (P9, parallel lanes). Whoever closes
the batch moves them into `docs/claude-code-log.md` **verbatim and in this order** (RC-12) and
empties this file. The active log is not touched by this lane.

---

## 2026-10-18 — discovery: notation library and gallery, seal, provenance, clone, packaging (P-2026-10-18-1735)
**Prompt**: Phase 1 read-only discovery of R-LIB: hiding of the default syntax, every M2 write path and its choke point, project shape, read-only mode, client-side gallery clone, Ecore gallery build, sealed package format, slices
**Files touched**: docs/discovery/discovery_2026-10-18_notation_library.md (new), docs/log-inbox/notation-library.md (new), docs/prompts/claude_2026-10-18_1735_prompt_discovery_notation_library.md (Status)
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Read only, nothing run. Choke point: reducer.ts:541-549 (core, S6 in critical zone); LoadAction outside it, undo covered by induction. Default hiding is a fixed-id allowlist, so the seal needs a _state marker. The gallery clone is client-only via importFromText. The Ecore build needs Playwright, Families/Persons.ecore missing. 8 slices, S1 and S2 clear of the zone. 5 decisions await Alfonso (report §0).
**Prompt document name**: 2026-10-18 17:35

## 2026-10-18 — merge: notation-library-disc into alfonso-frontend-jjtl (P-2026-10-18-1753)
**Prompt**: `claude_2026-10-18_1753_prompt_merge_notation-library-disc.md`, a direct merge by `lane-run merge --direct`, no session: `notation-library-disc` at `1672611e4` into `alfonso-frontend-jjtl`, merge base `3d4508986`, 1 commit on the branch side.
**Files touched**: merge `19564fe5b`: 3 files from the branch side (`docs/discovery/discovery_2026-10-18_notation_library.md`, `docs/log-inbox/notation-library.md`, `docs/prompts/claude_2026-10-18_1735_prompt_discovery_notation_library.md`); this commit: this entry and the Status of the prompt file.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no. Gates on `19564fe5b` in the worker: typecheck 0 errors, the receiving tip's set; typecheck:scripts exit 0; vitest 9364 tests in 382 files, 9 red at import, hooks 885; build exit 0; check:docs exit 0; check:agents exit 0; check:scripts exit 0; check:addonly exit 0.
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended: docs-only merge: discovery report, inbox entry, Status flip; no code
**Notes**: Rollback tag `pre-notation-library-disc` on `062a05434` (RC-31). Union: none. Worker and gates: `~/.jjodel-lanes/P-2026-10-18-1753/result.json`.
**Prompt document name**: 2026-10-18 17:53

## 2026-10-18 — ticket: import loses the user-defined megamodel edges: registered under the file's project id
**Ticket**: `ProjectsApi.importFromText` registers the file's user-defined megamodel edges under the file's project id (`projects.ts:264-265`, before `duplicateProject` renews every id), so every import, File > Import and a gallery clone alike, loses them: `ProjectEditor.tsx:482` reads `getSerializedMegamodel(<new id>)`. Measured by scripts/probe/library-gallery-clone.ts (P-2026-10-18-1800): one user-defined edge in a package, cloned, gives `getSerializedMegamodel(newId) = undefined` and 1 edge under the old id. Not one line: the edges' `source`/`target` hold artifact ids the import renews, so the fix registers after the duplicate and remaps the ids (duplicateProject's map). The five gallery packages carry `edges: []`, so no clone loses anything today.
**Priority**: medium
**Found in**: P-2026-10-18-1800

## 2026-10-18 — feat: library gallery, five R-LIB-5 projects built and cloned from Templates (P-2026-10-18-1800)
**Prompt**: S1 build the five gallery projects (Playwright, app importers and export) with an importable-style test and catalog status/package; S2 Templates card grid with a clone modal, importFromText honours the name and sets _clonedFrom, megamodel probe
**Files touched**: S1 `ca6dc27fe` scripts/library/build-gallery.ts, scripts/library/gallery/ (12 sources), public/library/gallery/*.jjodel (5), src/library/__tests__/gallery.test.ts; `e2f47ea6e` docs/library/catalog.json. S2 `86eea439f` catalog; `d8ed13f1c` package.json, api/persistance/projects.ts, pages/Templates.tsx, pages/Templates.scss, public/library/catalog.json, scripts/library/copy-catalog.mjs, scripts/probe/library-gallery-clone.ts, gallery.test.ts. Visual fix `3fa4b921a`: Templates.tsx, Templates.scss, the probe. Closure: discovery report section, assets/library-gallery/ (4 png), this inbox, prompt Status
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 4/4
**Notes**: Out of scope: package.json (prebuild), public/library/catalog.json, copy-catalog.mjs, the probe; S2 code commit has 8 files (>5). Gates: typecheck 0, build 0, check:scripts 0, gallery.test 31, build probe ALL GREEN, clone probe 55/55 after the visual fix (shell = Projects page, dialog measured opaque at rest, popups closed). 4+1 commits (P13 hook). Two tickets: megamodel loss, mode toggle. GO 2026-10-18. Details: report §«Gallery S1+S2».
**Prompt document name**: 2026-10-18 18:00

## 2026-10-18 — ticket: the app-bar mode control shows Basic after leaving All Projects, the stored mode is advanced
**Ticket**: Leaving All Projects for another dashboard page resets the Redux `advanced` flag to false while `localStorage['jjodel.interfaceMode']` stays `advanced`, so the app-bar Basic|Advanced control (Navbar.tsx:2020 reads `props.advanced`) shows Basic. Measured 2026-10-18 (P-2026-10-18-1800), fresh context seeded advanced, `state.advanced` sampled every 2 s: true for 20 s on `#/allProjects`, false from the first sample after `#/explore` or `#/templates`, no page reload (`load` fired once), 4 of 4 runs. Explore is the untouched placeholder, so the Templates page is not the cause. The Navbar's restore effect runs once per mount and only on its first render.
**Priority**: low
**Found in**: P-2026-10-18-1800

## 2026-10-18 — feat: derived viewpoints in the five gallery projects, S1b (P-2026-10-18-2150)
**Prompt**: each gallery project gets derived viewpoints through createDerivedViewpoint in the build (statechart and Generic for StateMachine, Generic elsewhere, one per metamodel for Families and Persons), the first one active; test, Templates count line, clone probe with viewpoint screenshots
**Files touched**: `2925b96d8` scripts/library/build-gallery.ts, public/library/gallery/*.jjodel (5), src/library/__tests__/gallery.test.ts, src/pages/Templates.tsx, scripts/probe/library-gallery-clone.ts. Closure: discovery report section, assets/library-gallery/ (6 new png, 3 retaken), this inbox, prompt Status
**Outcome**: ❌ problems
**Corregge**: 2026-10-18 18:00 (`claude_2026-10-18_1800_prompt_library_gallery.md`: its S1 step 2 said «add no viewpoint»)
**Causa**: (f)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: fallito — rejected at the chat's visual check, superseded by R-LIB-9 (P-2026-10-18-2300)
**Notes**: Out of scope: the clone probe. Code commit 9 files (>5). Gates: typecheck 0, build 0, check:scripts 0, typecheck:scripts 0, gallery.test 42 (bench: old graph.jjodel, 3 red), build ALL GREEN, clone probe 76/76. Statechart prefill from signals, State=node, Transition=transition, fallback unused. Active viewpoint via activateViewpoint (project.activeViewpoint + root). Gap: Graph Generic draws Edge objects as compartment rows, not arcs. Details: report §«Gallery viewpoints S1b».
**Prompt document name**: 2026-10-18 21:50

## 2026-10-18 — feat: gallery templates and examples, versioned, deep link, hand-written viewpoints (P-2026-10-18-2300)
**Prompt**: R-LIB-9: record and revert S1b; per-id version folders, catalog v2 with tier and versions, two-section Templates page, #/templates/<id>@<n>; one hand-written IR viewpoint per template metamodel, active on open, checked by the clone probe; examples packaged unchanged
**Files touched**: `739dc4ca8` S1b record; `7672cd683` revert; `b08ce9444` + `81c5bc7b3` docs/library/catalog.json; `8602e2c4f` public/library/{catalog.json,gallery/**}, scripts/library/{build-gallery.ts,gallery/**}, src/library/{galleryRef.ts,__tests__/gallery.test.ts}, pages/Templates.{tsx,scss}, App.tsx, the probe; `23fe96d80` build-gallery, gallery/graph sources, 5 packages, test, Templates.tsx, probe. Closure: report section, assets, this inbox, prompt Status
**Outcome**: ✅ completed
**Corregge**: 2026-10-18 21:50 (`claude_2026-10-18_2150_prompt_library_gallery_viewpoints.md`: derived viewpoints rejected at the visual check)
**Causa**: (f)
**Regressions**: no
**Out-of-scope changes**: yes
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso 2026-10-19 16:41)
**Notes**: Out of scope: src/library/galleryRef.ts (new, pure). Round 1 (`d3e02370e`, `ba7eb0f33`): corner-hit visibility check (bench: the 5 cut vertices), layouts <= 520 px, bullseye final, arcs apart, card id line; probe 132/132. Round 2 (`86ff4e69c`, `4a3c1db49`): JRR Tolkien, no-badge check (bench: fails on the old name), library probe 27/27. Gates 0, gallery.test 49. Handle gap: ticket. Report §«Gallery templates and examples».
**Prompt document name**: 2026-10-18 23:00

## 2026-10-18 — ticket: edges end about 5 px off the node border in every diagram
**Ticket**: React Flow ends an edge at the outer edge of its handle, and the handles are 8 px `.mm-anchor` boxes centred on the node border, so every arc, in every syntax (default and IR), starts and ends 4–5 px off its node's ink (measured 5 px on every arc of the five gallery templates). An editor lane: end edges on the border (DynamicHandles.tsx / UnifiedEdge.tsx). Not touched in the gallery lane.
**Priority**: medium
**Found in**: P-2026-10-18-2300
**Detail**: docs/discovery/discovery_2026-10-18_notation_library.md §«Gallery templates and examples», Correction round 1, item 3c

## 2026-10-19 — feat: hand-written viewpoints for the two gallery examples (P-2026-10-19-0300)
**Prompt**: R-LIB-10: one hand-written IR viewpoint per example, active on open, Turnstile statechart on DemoESM and Petri net on DemoPetri; layout by the build; code generation and simulation unchanged; rebuild of version 1 (unpublished)
**Files touched**: `126e5972f` docs/library/catalog.json; `18ce5cdf1` frontend/scripts/library/build-gallery.ts, frontend/public/library/{catalog.json,gallery/turnstile/1.jjodel,gallery/petri-producer-consumer/1.jjodel}, frontend/src/library/__tests__/gallery.test.ts, frontend/scripts/probe/library-gallery-clone.ts. Closure: report section, assets, this inbox, prompt Status
**Outcome**: ✅ completed
**Corregge**: 2026-10-18 23:00 (`claude_2026-10-18_2300_prompt_library_gallery_templates_examples.md`: examples packaged on abstract syntax)
**Causa**: (f)
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso 2026-10-19 16:41)
**Notes**: Examples opened from the stored record with their own ids, not imported: the $ID table of the generated code then matches byte for byte (bench: the importing build failed it). Codegen equal on 12 / 13+13 templates. Clone probe 62/62 on the examples, all seven 176/176. Its open item (stale tokens during a Petri run, an emptied place's initial dot beside the run's «0») was closed by P-2026-10-19-0930 (`simActive`). Report §«Example viewpoints».
**Prompt document name**: 2026-10-19 03:00

## 2026-10-19 — feat: IR predicate simActive, the Petri example's tokens hidden during a run (P-2026-10-19-0930)
**Prompt**: add `{ op: 'simActive' }`, true while a run is active on the element's model, on the 'mark' channel, both backends, offered in the conditional editor as `sim active`, validateIR; tests, round trip, compiler bench; the Petri Place view draws its tokens under `not simActive`, petri-producer-consumer@1 rebuilt (unpublished)
**Files touched**: `50ab1d74c` viewpoint/ir/{irTypes,irReadCtx,irReadCtxLproxy,irCompile,irValidate}.ts, ir/__tests__/irSimActive.test.ts, ui/ConditionalEditor/conditional.ts (+test), ui/PredicateBuilder/{predicateDefaults.ts,PredicateBuilder.tsx} (+test); `15fac4bfa` docs/library/catalog.json; `e1bb5db65` scripts/library/build-gallery.ts, public/library/{catalog.json,gallery/petri-producer-consumer/1.jjodel}, scripts/probe/library-gallery-clone.ts. Closure: report section, two screenshots, this inbox, prompt Status
**Outcome**: ✅ completed
**Corregge**: 2026-10-19 03:00 (`claude_2026-10-19_0300_prompt_library_example_viewpoints.md`: an emptied place kept its initial dot beside the run's 0)
**Causa**: (c)
**Regressions**: no
**Out-of-scope changes**: no — 15 files, all in DOVE (above five, RC-11): the 11 of `50ab1d74c`, the catalog, build-gallery, the package, the probe
**Layer Impact Report**: not-required
**Smoke visivo**: passato (Alfonso 2026-10-19 16:41)
**Notes**: Channel 'mark': simReset and simClear already bump it. Model by `father` walk in the draw backend, run by getSimRun. Bench 5/5 compiler, 4/4 backends. Probe bench on the old package: 1 FAIL, ready alone; rebuilt: 40/40, all seven 178/178. `marked` is not in the builder's list (R-MK-9 M2 never landed), so simActive is offered alone, no «Reads state» group. Commit 1 subject shortened to 72. Report §«IR predicate for a running simulation».
**Prompt document name**: 2026-10-19 09:30

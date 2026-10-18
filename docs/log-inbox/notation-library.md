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

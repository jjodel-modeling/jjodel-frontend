# log-inbox — lane «dashboard-drop-import»

Entries written by the dashboard-drop-import lane on its own branch (P9, parallel lanes).
Whoever closes the batch moves them into `docs/claude-code-log.md` **verbatim and in this order**
(RC-12) and empties this file. The active log is not touched by this lane.

---

## 2026-11-08 — discovery: dashboard drop import, stopped before Phase 2 (P-2026-11-08-1845)
**Prompt**: read-only discovery for the dashboard drop import (Q1..Q8), report committed, hard stop before Phase 2.
**Files touched**: `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (9895f28c2); this inbox entry.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: no
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: Measured on the dev server of this tree, port 3055, Chromium via CDP drag, offline, light. A dashboard-wide drop already exists, against the prompt's premise. Toast system exists, so Q3 does not end in a question. Not measured: online path, real Esc, Safari, Firefox. Status line not flipped: the prompt limits this lane to the report and this entry. Nine open questions in the report.
**Prompt document name**: 2026-11-08 18:45

**Ticket** (found here, not fixed): `importFromText` without `clone` does not await its transaction, so a `{}` or empty-state `.jjodel` shows "Project imported" while nothing is added; a drop on `#/archive` can create a duplicate project name, because the store there does not hold the project list. Evidence in the report, Q2.

## 2026-11-08 — fix(dashboard): shared .jjodel import, awaited transaction, failures reported (P-2026-11-08-2015)
**Prompt**: lane A of the dashboard drop import: pure module with filter, partition and one-at-a-time import; `importFromText` awaited on both paths and rejecting when nothing is stored; both drops and the picker delegate; drop import only on All Projects.
**Files touched**: `frontend/src/api/persistance/jjodelImport.ts` (new), `frontend/src/api/persistance/__tests__/jjodelImport.test.ts` (new), `frontend/src/api/persistance/projects.ts`, `frontend/src/pages/AllProjects.tsx`, `frontend/src/pages/components/Dashboard.tsx` (a99f65a81); this inbox entry and the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: non applicabile
**Notes**: DOM probe, port 3056, offline, light: all cases passed, picker and clone too. Online path not run, hence Regressions unknown. Depth rests at 1 on the dashboard, flushed by the 300 ms interval, and dispatch is a setTimeout 0, so `importFromText` commits and waits one tick before reading the store; without it valid imports reported failure (measured). Mutation bench: 20 of 20 killed. `importJjodelFile` takes the importer as second argument. Typecheck 0, vitest only the 3 known red files.
**Prompt document name**: 2026-11-08 20:15

**Ticket** (found here, not fixed): the picker on `#/archive` still adds a duplicate name (`Turnstile copy` measured), because the store there does not hold the project list (report Q2). A `.pdf` dropped on the modal logs `invalid file` and shows no toast, left as it is by item 5, for lane B or C. Online, a failed POST alerts and the project is still created and counted as imported (`projects.ts`, `Online.import`), unchanged.

## 2026-11-08 — feat(dashboard): import modal with drop area, empty state import (P-2026-11-08-2040)
**Prompt**: lane B of the dashboard drop import: redesigned Import modal (label around a hidden multiple input, closes only on backdrop, close, Cancel, Esc), empty state copy and "Import .jjodel file" button behind an optional prop, DOM probe and crops.
**Files touched**: `frontend/src/pages/AllProjects.tsx`, `frontend/src/pages/dashboard.scss`, `frontend/src/components/EmptyDashboard/EmptyDashboard.tsx`, `frontend/src/components/EmptyDashboard/empty-dashboard.scss`, `frontend/src/pages/components/catalog/Catalog.tsx` (549c87a12); this inbox entry and the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 4/4 sui crop (RC-23); sonda della corsia 34/34, porta 3057, offline, light
**Notes**: No helper added: the backdrop test is one inline comparison, so no new file or unit test. A selection leaves the modal open, as the reset of the input implies; a drop closes it as before. The empty state button calls `ProjectsApi.import`. Copy and button only on All Projects. Probe used a synthetic DragEvent, not a CDP drag. Online path not run, hence Regressions unknown. Typecheck exit 0, vitest only the 3 known red files, build exit 0, check:docs 5/5.
**Prompt document name**: 2026-11-08 20:40

**Ticket** (found here, not fixed): a successful import from the modal shows no feedback, and after a selection the modal stays open, so only the cards behind the backdrop change; for lane C, which owns the toasts. A non-`.jjodel` file taken through the picker's "All files" option only logs `invalid file`, like the modal drop (lane A's ticket).

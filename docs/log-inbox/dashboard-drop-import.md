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

## 2026-11-08 — feat(dashboard): drag tracking and drop overlay (P-2026-11-08-2115)
**Prompt**: lane C1 of the dashboard drop import: pure drag transition function with tests and mutation bench, hook and wiring on `.dashboard-container`, overlay fixed over the rect of `.dash-content`, CDP probe and crops.
**Files touched**: `frontend/src/pages/components/dashboardFileDrag.ts` (new), `frontend/src/pages/components/__tests__/dashboardFileDrag.test.ts` (new), `frontend/src/pages/components/useDashboardFileDrag.ts` (new), `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/pages/dashboard.scss` (a6ccf5cdc); this inbox entry and the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 3/3 sui crop (RC-23); sonda della corsia 47/47, porta 3062, offline, light; Esc reale durante un drag OS non misurato, item per Alfonso
**Notes**: Mutation bench 19 of 19 killed. The modal state is read from the DOM, because `AllProjects.tsx` is out of scope. Null-related dragleave, window dragend and Escape were exercised with synthetic events; a real Esc during an OS drag is not measured, an item for Alfonso. The glyph needed its colour on the `<i>`: `i.bi` paints it (measured). Online path not run, hence Regressions unknown. Typecheck 0, vitest only the 3 known red files, build 0.
**Prompt document name**: 2026-11-08 21:15

**Ticket** (found here, not fixed): Safari and Firefox `dragleave` are still not measured: if a browser reports a null `relatedTarget` between children, the overlay would clear until the next `dragover`. The dashboard no longer renders `.drop-overlay`; its rule stays in `dashboard.scss` (Rule 9).

## 2026-11-08 — feat(dashboard): drop import panel and toasts (P-2026-11-08-2145)
**Prompt**: lane C2a of the dashboard drop import: shared toast as a polite live region with `role="alert"` only on errors and warnings, progress panel, dashboard wiring with "Open project", tests of the pure mapping with mutation bench, CDP probe and crops.
**Files touched**: `frontend/src/components/Toast/Toast.tsx`, `frontend/src/components/Toast/ToastContainer.tsx`, `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/pages/components/DropImportPanel.tsx` (new), `frontend/src/pages/components/DropImportPanel.scss` (new), `frontend/src/pages/components/__tests__/DropImportPanel.test.ts` (new) (71db7bd16); this inbox entry and the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no — six files, the prompt's own list, confirmed there under Rule 19
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 3/3 sui crop (RC-23); sonda della corsia 50/50, porta 3063, offline, light
**Notes**: Bench 37 of 37 killed. Summary rule: per-file toasts up to 3 outcomes, one per kind above. Panel sits beside the toast column. Toast's own `aria-live` removed: it turned `role="alert"` polite. Dashboard loops on `importJjodelFile`: `importJjodelFiles` reports only at the end. A drop during an import extends the batch. Sole console error: the `{}` fixture (measured). Online path not run, hence Regressions unknown. Typecheck 0, vitest only the 3 known red files, build 0.
**Prompt document name**: 2026-11-08 21:45

**Ticket** (found here, not fixed): the toast stack paints over the Quick Tip card, same corner, measured on the crops and independent of this lane. Below about 680 px wide the panel can meet the toast column, which goes full width at 480 px; not handled. The panel title stays "Importing N projects" once settled, as the prompt words it; an item for Alfonso.

## 2026-11-08 — feat(dashboard): imported card marker and modal feedback (P-2026-11-08-2215)
**Prompt**: lane C2b of the dashboard drop import: recent-imports module with injectable clock, "Imported" bar and badge on gallery cards and list rows without layout shift, dashboard and modal imports recorded, modal raising lane C2a's toasts, tests with mutation bench, CDP probe and crops.
**Files touched**: `frontend/src/pages/components/recentImports.ts` (new), `frontend/src/pages/components/__tests__/recentImports.test.ts` (new), `frontend/src/pages/components/Project.tsx`, `frontend/src/pages/components/project-card.scss`, `frontend/src/pages/components/Dashboard.tsx`, `frontend/src/pages/AllProjects.tsx` (fbddf536a); this inbox entry and the Status line of the prompt.
**Outcome**: ✅ completed
**Corregge**: —
**Causa**: —
**Regressions**: unknown
**Out-of-scope changes**: no — six files, the prompt's own list, confirmed there under Rule 19
**Layer Impact Report**: not-required
**Smoke visivo**: passato — chat, unattended, 3/3 sui crop (RC-23); sonda della corsia 35/35, porta 3064, offline, light
**Notes**: Lifetime 6 s. Bench 19 of 20 killed; the survivor, notify before delete, is equivalent: `has` reads the time. Modal: its failure alert and invalid-file console line became lane C2a's toasts. A first full vitest also failed laneRun, laneRunDirect and budget under load 25; all passed alone and in the full rerun, only the 3 known red. Console: the `{}` fixture and React's `key` warning from `props.key` in list mode. Online path not run, hence Regressions unknown. Typecheck 0, build 0.
**Prompt document name**: 2026-11-08 22:15

**Ticket** (found here, not fixed): the empty state's import button (`ProjectsApi.import`) neither marks the card nor raises these toasts, outside item 3 of the prompt. The toast also paints over the "Support Jjodel" card, same corner as the Quick Tip, seen on the modal crop. Right after an import in list mode every row sat 12 px off its settled top, settled within 1 s; marked and unmarked rows alike, cause not isolated.

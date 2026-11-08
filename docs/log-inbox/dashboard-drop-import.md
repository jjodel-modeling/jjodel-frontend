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

# Dashboard drop import: Phase 1 discovery

Prompt-ID: P-2026-11-08-1845
Chat: C-2026-11-08-1832
Front: maintenance
Lane: full (more than three files; extracts a shared import function, so an exported interface changes)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`, created from the trunk
`alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here
(clean tree, HEAD on the trunk tip at launch). Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-1845 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log or a large file; read the relevant ranges. Stop and write a
handoff in `~/.jjodel-lanes/P-2026-11-08-1845/handoff.md` before the context ceiling, not after.

## Contesto (non rifare l'analisi)

Today a `.jjodel` project is imported only from the Projects dashboard (`#/allProjects`) by clicking Import,
which opens a modal ("Drop the file to import a .Jjodel project" / "select project"). A design produced in
Claude Design asks for:

1. one shared import function (e.g. `importJjodelFile(file: File): Promise<ImportResult>`) called by both the
   modal and a new drop handler, with no duplicated parsing or loading;
2. a drop target on the whole dashboard, active only on `#/allProjects` and only for drags carrying files,
   with an overlay on the main content area (not the sidebar): 2px dashed slate-700 border, radius 16px,
   inset 16px, background `rgba(241,245,249,0.94)`, upload icon in a 72px slate-700 circle, title "Drop to
   import", subtext "Release to add the project to your library. Only .jjodel files are imported, anything
   else is skipped.", `pointer-events: none`, `aria-hidden`;
3. sequential import of several files per drop, filtered by `/\.jjodel$/i`; a bottom-right panel "Importing N
   project(s)" with one row per file; success toast with "Open project" and "Dismiss"; the new card marked
   with a top accent bar and an "Imported" badge for a few seconds; error toast (`role="alert"`) for rejected
   extensions and per-file parse failures; toasts in an `aria-live="polite"` region;
4. a redesigned modal: title "Import project", close button (`aria-label="Close"`), Cancel in a light footer,
   a `<label>` wrapping a visually hidden `<input type="file" accept=".jjodel" multiple>`, drop area "Drop
   .jjodel files here / or browse your computer", hint "You can also drop files directly on the Projects
   page, without opening this dialog.", input value reset after each selection;
5. empty state copy mentioning drop, plus an "Import .jjodel file" secondary button next to "New project";
6. a single drop never imports twice when the modal is open; collision and failure behaviour unchanged.

This lane does not implement any of it. It establishes the facts the Phase 2 lanes need.

## COSA

Read-only discovery. Write the report to
`docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (P4: hypothesis, objective, files read with full
paths, findings with `file:line` and verbatim quotes, dependencies and risks, open questions). The hard stop is
not reached until the report is written and committed.

The report answers, each with evidence:

- **Q1 Import path.** Where the modal component lives (search "Drop the file to import", "select project"),
  where the `.jjodel` file is read, parsed and loaded, and whether that is already a function or is wired
  inside the component. Every caller of that logic.
- **Q2 Collisions and failures.** What happens today when the imported project's name already exists (the
  project convention is the `(1)`, `(2)` suffix: is it applied on import?) and when the file fails to parse.
  If there is no collision handling, say so; do not propose one.
- **Q3 Notifications.** Whether a toast or notification system, or any `aria-live` region, already exists, and
  how it is used. If none exists, state it plainly: Phase 2 then needs a decision and this lane ends with
  `Outcome: question`.
- **Q4 Current drop behaviour.** What the browser does today when a `.jjodel` file and a `.pdf` are dropped on
  `#/allProjects` and on the editor (navigates away? ignored?). Measure on the dev server in this worktree
  (P14 `node_modules` symlink, free port), from DOM and console, light theme only (D-UI-15). Any existing
  `dragover`/`drop`/`dataTransfer` handlers in the app (`grep` across `frontend/src`, quoted globs).
- **Q5 Mounting.** The dashboard page component for `#/allProjects`, the element that is the main content area
  as opposed to the sidebar, and whether the import modal renders inside the page or in a portal (this decides
  how "one import per drop" is enforced).
- **Q6 Project list and opening.** How the list refreshes after an import and which call opens a project, so
  "Open project" and the "Imported" marker can reuse them.
- **Q7 Tokens.** Which existing CSS variables or SCSS tokens map to slate-700, slate-100, the 16px modal radius,
  the 8px button radius, and a success colour usable for the accent bar. Report gaps; do not add tokens.
- **Q8 Proposal for Phase 2.** A split into short lanes (suggested: A shared function plus extension filter and
  its tests, no visible change; B modal and empty state; C dashboard hook, overlay, progress panel, toasts,
  crops). For each visual element (overlay, progress panel, toasts, card marker, modal drop area) one line:
  current state, expected state, DOM measure that verifies it. For the drag tracking, how the overlay is reset
  on `drop`, on window `dragend`, and on `dragleave` with `relatedTarget === null`, and the test cases that
  cover those resets.

## HARD STOP

After the report is committed: stop, final message with the report path and `Outcome: hard-stop` (or
`question` per Q3). No Phase 2 work in this session.

## NON FARE

- No edit to any source file, style, test or config. The only file written is the report (plus the log entry).
- No new dependency, no new token, no new identifier.
- No guess presented as a finding: an absence claim states the search that supports it (R-RAIL-28).
- No `git add .`, no stash. Commit the report alone with its pathspec, trailer `Model:`.

## RIFERIMENTI

- `CLAUDE.md` (conventions, §21 log entry), `docs/PROTOCOL.md` P4, P9, P13, P14, P16.
- `docs/decisions.md`: D-UI-15 (light theme only), RC-17, RC-23.
- Log entry in `docs/log-inbox/dashboard-drop-import.md`, per P9.

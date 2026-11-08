# Dashboard drop import, lane B: import modal and empty state

Prompt-ID: P-2026-11-08-2040
Chat: C-2026-11-08-1832
Request: https://claude.ai/code/session_01DQt9R79sHuFgu9doZgQErw (Alfonso, «ok alle raccomandazioni» on the P-2026-11-08-1845 report, 2026-11-08 20:08)
Front: maintenance
Depends: P-2026-11-08-1845, P-2026-11-08-2015
Lane: full (five files, visible change on the Projects dashboard)
Status: eseguito 2026-11-08 · lane dashboard-drop-import · 549c87a12 · verifica visiva passata 2026-11-08

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`. Before anything else: `pwd`, branch, `git log -1`
(the commit that adds this prompt, on top of lane A's closure) and `git status` (clean). Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2040 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log, a probe output or a large file; read ranges, grep summary lines. Commit
code as soon as the gates are green. Write a handoff in `~/.jjodel-lanes/P-2026-11-08-2040/handoff.md` before the
context ceiling, not after.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q1, Q5, Q7, Q8 table) and lane A's log entry in
`docs/log-inbox/dashboard-drop-import.md`. Lane A put the import behind one shared module (the import functions of
`ProjectsApi` and the new module next to `projects.ts`); this lane only changes markup and styles and calls that
module. Decisions D1..D9 are the report's nine recommendations, ratified by Alfonso; D2 (collision naming unchanged)
and D9 (navbar untouched) bind this lane.

The modal today is inline JSX in `frontend/src/pages/AllProjects.tsx:101-114`; `:102` closes it on any click inside
(`onClick={mouseleave}` with no `stopPropagation`), which would unmount a `<label>`-wrapped file input before its
`change` fires (report Q5). It renders outside the dashboard tree, so a drop on it cannot bubble to the dashboard
handler: keep it that way.

## COSA

1. **Modal** (`AllProjects.tsx`, `frontend/src/pages/dashboard.scss`): title "Import project"; close button with
   `aria-label="Close"`; Cancel in a light footer; a drop area that is a `<label>` wrapping a visually hidden
   `<input type="file" accept=".jjodel" multiple>`, text "Drop .jjodel files here" and "or browse your computer";
   hint "You can also drop files directly on the Projects page, without opening this dialog."; the input's value is
   reset after each selection so the same file can be chosen twice. Selection and drop both go through lane A's
   module with all the files. Clicks inside the panel no longer close the modal; a click on the backdrop, the close
   button, Cancel and Esc do. Panel radius `--radius-modal`, buttons `--radius-button`, colours from tokens (report
   Q7); no new token. Existing class names stay (Rule 2); new ones are checked unused with a global `grep` first.
2. **Empty state** (`EmptyDashboard.tsx` and its stylesheet, `Catalog.tsx` where it is rendered; confirm the paths):
   copy that mentions dropping `.jjodel` files on the page, and an "Import .jjodel file" secondary button next to
   "New project" that opens the same picker (an optional prop, default off, so other uses of `EmptyDashboard` do not
   change).
3. **Tests**: a unit test for any pure helper you add (for example the decision whether a click closes the modal).
   No snapshot tests.
4. **Probe and crops** (DOM and console, light theme only, D-UI-15, dev server of this tree on a free port): modal
   open, `input[type=file]` has `accept=".jjodel"` and `multiple`; clicking the label leaves the modal mounted;
   choosing two fixtures (`frontend/public/examples/codegen/turnstile.jjodel`, `petri-producer-consumer.jjodel`)
   adds two projects; `input.value === ''` afterwards; a drop of one valid file on the modal adds exactly one project
   (no double import); backdrop click and Esc close it. Crops at 1440x900 in
   `~/.jjodel-lanes/P-2026-11-08-2040/crops/`: modal at rest, modal with the drop area hovered, empty dashboard, and
   the dashboard with projects (expected unchanged). Name each crop for what it shows.

## HARD STOP

Gates at baseline (typecheck count from `CLAUDE.md` §17, vitest, build, `check:docs`), code commit with its pathspec,
log entry in `docs/log-inbox/dashboard-drop-import.md` uncommitted while the visual check is due (RC-17). Stop with
`Outcome: hard-stop (visual check due)` and the crop paths. The chat checks the crops (RC-23) and resumes this session
for the closure.

## NON FARE

- Touch only `AllProjects.tsx`, `dashboard.scss`, `EmptyDashboard.tsx`, its stylesheet, `Catalog.tsx`, plus a test
  for a new helper. Lane A's module, `projects.ts`, `Dashboard.tsx`, toasts, `Project.tsx` and `Navbar.tsx` are out
  of scope (lane C owns the dashboard overlay and the toasts).
- No dark-theme styles (D-UI-15). No new dependency, no new token, no renamed class.
- No `git add .`, no stash. Trailer `Model:` on every commit.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q5, Q7, Q8 table row "Modal drop area").
- `CLAUDE.md` §5, §17, §21; `docs/PROTOCOL.md` P8, P9, P13, P14, P16; `docs/decisions.md` D-UI-15, RC-17, RC-23.

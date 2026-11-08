# Dashboard drop import, lane C2a: progress panel and import toasts

Prompt-ID: P-2026-11-08-2145
Chat: C-2026-11-08-1832
Request: https://claude.ai/code/session_01DQt9R79sHuFgu9doZgQErw (Alfonso, «ok alle raccomandazioni» on the P-2026-11-08-1845 report, 2026-11-08 20:08)
Front: maintenance
Depends: P-2026-11-08-1845, P-2026-11-08-2015, P-2026-11-08-2040, P-2026-11-08-2115
Lane: full (six files counting the test; changes the shared toast, used by the whole app)

Rule 19: this prompt names six files (five plus one test). The chat confirms that count here, inside the scope
Alfonso ratified with D5; a seventh file is a stop.
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`. Before anything else: `pwd`, branch, `git log -1`
(the commit that adds this prompt, on top of lane C1's closure) and `git status` (clean). Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2145 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log, a probe output or a large file; read ranges, grep summary lines. Commit
code as soon as the gates are green. Stop any dev server you start before your final message, or the session does
not exit. Write a handoff in `~/.jjodel-lanes/P-2026-11-08-2145/handoff.md` before the
context ceiling, not after.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q3, Q6, Q8 table) and the entries of lanes A,
B and C1 in `docs/log-inbox/dashboard-drop-import.md`. Lane A returns one result per file (`ok`, `projectId` or
`reason`) and today reports each with `U.alert`; lane C1 drew the overlay. This lane replaces the dashboard's
`U.alert` calls with a progress panel and the design's toasts. Decisions ratified by Alfonso that bind this lane:

- **D5**: the shared toast changes: a polite live region that exists before the first toast (today the container is
  unmounted when empty and has no `aria-live`, `ToastContainer.tsx:18`), and `role="alert"` only on error and warning
  toasts (today every toast has it, `Toast.tsx:104`). Declared in scope; it affects every toast in the app.
- **D6**: "Dismiss" stays the existing icon button with `aria-label="Dismiss"`; no text button is added.
- **D7**: user toast preferences may suppress import toasts (`ToastContext.tsx:126`); the progress panel still shows
  every outcome, so nothing is lost.

## COSA

1. **Toast accessibility** (`Toast.tsx`, `ToastContainer.tsx`): the container renders always (empty when there are no
   toasts) with `aria-live="polite"`; error and warning toasts carry `role="alert"`, success and info do not. No other
   behaviour of the toast changes (durations, cap of 5, preferences).
2. **Progress panel** (new component and its stylesheet, names checked unused with a global `grep`): bottom-right,
   title "Importing N project(s)" (singular for one), one row per dropped file in drop order with its name and state
   (pending, importing, imported, failed, skipped for a rejected extension); it stays until every file is settled,
   then closes on its own after a short delay or on its close button. It must not overlap the toast stack, which sits
   in the same corner: measure both rects.
3. **Dashboard wiring** (`Dashboard.tsx`): the drop drives the panel from lane A's results as each file settles; on
   success a success toast "Project imported" with the action "Open project", which navigates the way
   `Project.tsx:195` does, to the id lane A returns; the toast lasts long enough to be clicked (`duration` or
   `dismiss: 'manual'`, report Q3). A failed file gives an error toast; rejected extensions give one warning toast for
   the drop, naming how many files were skipped. With many files, prefer one summary toast over one per file so the
   cap of 5 does not drop outcomes; say which rule you applied.
4. **Tests**: a pure function that maps results to panel rows and to the toasts to raise (tested: order, singular and
   plural title, summary rule, skipped count). Mutation bench per `CLAUDE.md` §5.
5. **Probe and crops** (CDP drag with files, DOM and console, light theme, dev server on a free port): two valid
   files and one `.pdf` in one drop; panel rows equal 3 with the right states; `.jj-toast-container` has
   `aria-live="polite"` before the first toast; the success toast has the "Open project" action and clicking it
   reaches `#/project?id=<id returned by lane A>`; an error toast has `role="alert"`, a success toast does not; panel
   and toast rects do not intersect. Crops at 1440x900 in `~/.jjodel-lanes/P-2026-11-08-2145/crops/`: panel while
   importing, panel settled with the success toast, error toast.

## HARD STOP

Gates at baseline, code commit with its pathspec, log entry in `docs/log-inbox/dashboard-drop-import.md` uncommitted
while the visual check is due (RC-17). Stop with `Outcome: hard-stop (visual check due)` and the crop paths.

## NON FARE

- Touch only `Toast.tsx`, `ToastContainer.tsx`, `Dashboard.tsx`, the new panel and its stylesheet, plus the test of the
  new pure function. The card marker and the modal's feedback belong to lane C2b; lane A's module, `projects.ts`,
  `AllProjects.tsx` and `Project.tsx` are out of scope.
- No change to toast durations, cap or preferences beyond what COSA 1 says. No dark-theme styles (D-UI-15). No new
  dependency or token.
- No `git add .`, no stash. Trailer `Model:` on every commit.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q3, Q6, Q8).
- `CLAUDE.md` §5, §17, §21; `docs/PROTOCOL.md` P8, P9, P13, P14, P16; `docs/decisions.md` D-UI-15, RC-17, RC-23.

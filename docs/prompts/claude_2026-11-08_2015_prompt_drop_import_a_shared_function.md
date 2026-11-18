# Dashboard drop import, lane A: shared import function, filter, awaited transaction

Prompt-ID: P-2026-11-08-2015
Chat: C-2026-11-08-1832
Request: https://claude.ai/code/session_01DQt9R79sHuFgu9doZgQErw (Alfonso, «ok alle raccomandazioni» on the nine open questions of the P-2026-11-08-1845 report, 2026-11-08 20:08)
Front: maintenance
Depends: P-2026-11-08-1845
Lane: full (five files; changes when `ProjectsApi.importFromText` resolves and what it returns, an exported interface)
Status: eseguito 2026-11-08 · lane dashboard-drop-import · a99f65a81

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`. Before anything else: `pwd`, branch, `git log -1`
(the commit that adds this prompt) and `git status` (clean). Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2015 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log, a probe output or a large file; read ranges, grep summary lines. Commit
code as soon as the gates are green, then write the closure. Write a handoff in
`~/.jjodel-lanes/P-2026-11-08-2015/handoff.md` before the context ceiling, not after.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` first (Q1, Q2, Q6, Q8 and the open questions);
it is on this branch. Alfonso answered the nine open questions with the report's recommendations. The ones that bind
this lane:

- **D1** (question 1): drop import works only on `#/allProjects` (`active === 'All'` in `GenericDashboard`). On the
  other dashboard pages `dragover` and `drop` stay prevented, so a drop never navigates away, but nothing is imported.
- **D2** (question 2): collision naming stays as it is (` copy`, ` copy2`, `Project.tsx:144-157`). No `(1)` form.
- **D3** (question 3): a file whose transaction fails (`{}`, valid JSON with an empty `state`) is a failure, reported
  as a failure, not as "Project imported".
- **D4** (question 4): `importFromText` awaits its transaction on the non-clone path too, as the clone path does
  (`projects.ts:306`), and resolves with the id of the project actually stored.
- **D9** (question 9): the navbar "Import Project" keeps calling `ProjectsApi.import`, which delegates to the shared
  function. `Navbar.tsx` is not touched.

D5..D8 belong to lanes B and C; this lane does not touch toasts, the modal markup, the overlay or the cards.

## COSA

1. **Pure module** (new file, name of your choice after a global `grep` shows it unused, next to `projects.ts` or in
   `frontend/src/api/persistance/`): the extension filter `/\.jjodel$/i`; a partition of a `FileList` or `File[]` into
   accepted and rejected, order kept; `importJjodelFiles(files, importer)` that imports the accepted files **one at a
   time** (at most one in flight), keeps going after a failing file, and returns one result per file
   (`{ file, ok: true, projectId } | { file, ok: false, reason }`, rejected extensions included). The importer is
   injected, so the module loads in node without `projects.ts`. Export `importJjodelFile(file)` for a single file.
2. **`projects.ts`**: `importFromText` awaits the transaction on both paths and returns the stored project's id.
   Failure is detected by whether that id is in `store.getState().projects` after the await, not by the boolean of
   `done` (report Q2: `END` returns `false` at depth above 0). A failed transaction rejects (or returns a failure the
   module maps to `ok: false`); say which and why in the closure. `ProjectsApi.import` delegates to the shared function
   and accepts several files from the picker, as the module does.
3. **`Dashboard.tsx` `:290-310`**: delegates to the module with all the dropped files (not `files[0]`), imports only
   when the active page is All Projects (D1), keeps `preventDefault` on every dashboard page.
4. **`AllProjects.tsx` `:57-80`**: the modal drop delegates to the same module. Keep the modal's markup and classes;
   lane B redesigns it.
5. **Notifications in this lane**: keep the existing `U.alert` calls and texts, one per outcome, so the visible
   behaviour changes only where D1 and D3 say: a `{}` or empty-state file shows the error ("Import failed"), a drop on
   another dashboard page imports nothing, several files import in order. Lane C replaces these calls.
6. **Tests first** (vitest, next to the module): filter table including `a.jjodel`, `UP.JJODEL`, `a.jjodel.pdf`,
   `a.pdf`, no extension; order kept; at most one import in flight (a stub importer that counts concurrent calls);
   a failing file does not stop the next; a rejected extension yields `ok: false` with its reason; an importer that
   resolves but whose id is absent counts as a failure (if that check lives in the module). Mutation bench per
   `CLAUDE.md` §5 on the module.
7. **Probe** (DOM and console, light theme, dev server of this tree on a free port, P14 symlink already present):
   on `#/allProjects` drop two valid fixtures (`frontend/public/examples/codegen/turnstile.jjodel`,
   `petri-producer-consumer.jjodel`) in one drop: two projects added, in order; drop `{}`: error, zero added; drop
   `.pdf` plus a valid `.jjodel`: the `.jjodel` is imported, the `.pdf` warned; drop a `.jjodel` on `#/archive`:
   zero added, URL unchanged; open the modal and drop one valid file: exactly one added. Navbar "Import Project" picker
   path: read, and run if the harness can set files on the detached input. Throwaway scripts stay outside the repo.

## HARD STOP

Gates at baseline (typecheck count from `CLAUDE.md` §17, vitest, build, `check:docs`). Code commit with its pathspec,
then the log entry in `docs/log-inbox/dashboard-drop-import.md` (P9) and the Status flip in a separate docs commit.
No visual check is due for this lane (no layout change): close with `Outcome: done`. Stop with `Outcome: question`
if awaiting the transaction changes the behaviour of the gallery clone path (`Templates.tsx:103`) or of an online
import in a way the report did not foresee.

## NON FARE

- Touch only the five files above plus the new module and its test. `Navbar.tsx`, toasts, `Project.tsx`, styles,
  `EmptyDashboard` are out of scope.
- No change to collision naming (D2), no new dependency, no new token.
- No `git add .`, no stash. Trailer `Model:` on every commit.
- No absence claim without the search that supports it (R-RAIL-28).

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q1, Q2, Q6, Q8, open questions 1-4, 9).
- `CLAUDE.md` §5 (mutation bench), §17 (baseline), §21 (log entry); `docs/PROTOCOL.md` P4, P9, P13, P14, P16.
- `docs/decisions.md`: D-UI-15, RC-17, RC-23.

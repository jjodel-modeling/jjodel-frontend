# Dashboard drop import, lane C1: drag tracking and drop overlay

Prompt-ID: P-2026-11-08-2115
Chat: C-2026-11-08-1832
Request: https://claude.ai/code/session_01DQt9R79sHuFgu9doZgQErw (Alfonso, «ok alle raccomandazioni» on the P-2026-11-08-1845 report, 2026-11-08 20:08)
Front: maintenance
Depends: P-2026-11-08-1845, P-2026-11-08-2015, P-2026-11-08-2040
Lane: full (five files, visible change on the Projects dashboard)
Status: eseguito 2026-11-08 · lane dashboard-drop-import · a6ccf5cdc · verifica visiva passata 2026-11-08 (chat, sui crop, RC-23)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`. Before anything else: `pwd`, branch, `git log -1`
(the commit that adds this prompt, on top of lane B's closure) and `git status` (clean). Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2115 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log, a probe output or a large file; read ranges, grep summary lines. Commit
code as soon as the gates are green. Write a handoff in `~/.jjodel-lanes/P-2026-11-08-2115/handoff.md` before the
context ceiling, not after.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q4, Q5, Q7, Q8 "Drag tracking and resets") and
the log entries of lanes A and B in `docs/log-inbox/dashboard-drop-import.md`. Lane A routes every import through the
shared module and restricts the dashboard drop to All Projects (D1). Lane B redesigned the modal and the empty state.
This lane adds the overlay the design asks for. D8, ratified by Alfonso: the overlay is `position: fixed`, with the
rect of `.dash-content` read at drag start and on resize, touching no shared layout (`.dash-content` scrolls and is
`position: static`, report Q5).

Measured facts that bind this lane (report Q4, Q8): `files.length` is 0 during `dragover`, so the decision to raise
the overlay is `dataTransfer.types.includes('Files')`; no `dragend` arrives for a file dragged from outside the
document; a `dragleave` with `relatedTarget === null` means the pointer left the window; a drop on the modal does not
bubble to the dashboard tree, so the handlers stay React handlers on that tree, never `window` listeners for the drop.

## COSA

1. **Pure transition function** (new module, name checked unused with a global `grep`): state `{ active: boolean }`
   and the inputs `dragenter`/`dragover` (with `hasFiles`, `route`, `modalOpen`), `dragleave` (with
   `relatedTargetInside: boolean | null`), `drop`, `dragend`, `escape`. Raises only for files, on All Projects, with
   the modal closed; clears on `drop`, on `dragend`, on `dragleave` with a null related target or one outside the
   dashboard; keeps on `dragleave` towards a descendant.
2. **Tests first** on that function, the cases of report Q8: `drop` clears; `dragend` clears; `dragleave` with null
   related clears; to a descendant keeps; to an outside element clears; `dragover` without `Files` does not raise;
   other route does not raise; modal open does not raise. Mutation bench per `CLAUDE.md` §5.
3. **Hook and wiring** (`Dashboard.tsx` plus the hook): `.dashboard-container` handlers drive the function; a window
   `dragend` listener is added as a reset only (it is not relied upon). The overlay renders over the rect of
   `.dash-content` only, never the sidebar or the navbar, with an inset of `--space-4` per side, and follows window
   resize while active.
4. **Overlay** (stylesheet: `dashboard.scss` or a new one next to the hook): 2px dashed `--color-slate-700` border,
   radius `--radius-modal`, background `rgba(241, 245, 249, 0.94)` as a literal with a one-line comment (no token
   exists, report Q7; do not add one), upload icon (`bi-upload`, Bootstrap Icons only) in a 72px circle filled with
   `--color-slate-700`, title "Drop to import", subtext "Release to add the project to your library. Only .jjodel
   files are imported, anything else is skipped.", `pointer-events: none`, `aria-hidden="true"`. Its z-index sits
   above the dashboard content and below the modal (`--z-modal`). The existing `.drop-overlay` class, if still
   rendered, is replaced in this tree only for the dashboard, not renamed.
5. **Probe and crops** (CDP `Input.dispatchDragEvent` with files, DOM and console, light theme, dev server on a free
   port): overlay rect equals the `.dash-content` rect minus 16 per side, also with `scrollTop > 0`; no intersection
   with `.leftbar`; computed border, radius, `pointer-events: none`, `aria-hidden`; a text drag raises nothing; a
   drag on `#/archive` raises nothing; drop clears and imports through lane A's path; dragleave out of the window
   clears. Crops at 1440x900 in `~/.jjodel-lanes/P-2026-11-08-2115/crops/`: overlay over a short list, overlay over a
   scrolled list, empty dashboard with overlay. A real Esc during an OS drag cannot be measured here: list it as an
   item for Alfonso's check, do not claim it.

## HARD STOP

Gates at baseline, code commit with its pathspec, log entry in `docs/log-inbox/dashboard-drop-import.md` uncommitted
while the visual check is due (RC-17). Stop with `Outcome: hard-stop (visual check due)` and the crop paths.

## NON FARE

- Touch only the new module and its test, the hook, `Dashboard.tsx` and one stylesheet. Lane A's module,
  `projects.ts`, `AllProjects.tsx`, toasts and `Project.tsx` are out of scope (lane C2 owns progress, toasts and the
  card marker).
- No `window` listener for `drop` or `dragover`. No dark-theme styles (D-UI-15). No new dependency or token.
- No `git add .`, no stash. Trailer `Model:` on every commit.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q4, Q5, Q7, Q8).
- `CLAUDE.md` §5, §17, §21; `docs/PROTOCOL.md` P8, P9, P13, P14, P16; `docs/decisions.md` D-UI-15, RC-17, RC-23.

# Dashboard drop import, lane C2b: "Imported" card marker and modal feedback

Prompt-ID: P-2026-11-08-2215
Chat: C-2026-11-08-1832
Request: https://claude.ai/code/session_01DQt9R79sHuFgu9doZgQErw (Alfonso, «ok alle raccomandazioni» on the P-2026-11-08-1845 report, 2026-11-08 20:08)
Front: maintenance
Depends: P-2026-11-08-1845, P-2026-11-08-2015, P-2026-11-08-2040, P-2026-11-08-2115, P-2026-11-08-2145
Lane: full (six files counting the test, visible change on the project cards)
Status: eseguito 2026-11-08 · lane dashboard-drop-import · fbddf536a · verifica visiva passata 2026-11-08 (chat, sui crop, RC-23)

Rule 19: this prompt names six files (five plus one test). The chat confirms that count here, inside the scope
Alfonso ratified; a seventh file is a stop.

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-dropimport`, branch `dashboard-drop-import`. Before anything else: `pwd`, branch, `git log -1`
(the commit that adds this prompt, on top of lane C2a's closure) and `git status` (clean). Otherwise stop with
`Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2215 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

Context discipline: never `cat` a whole log, a probe output or a large file; read ranges, grep summary lines. Commit
code as soon as the gates are green. Stop any dev server you start before your final message, or the session does
not exit. Write a handoff in `~/.jjodel-lanes/P-2026-11-08-2215/handoff.md` before the context ceiling, not after.

## Contesto (non rifare l'analisi)

Read `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q6, Q8 table row "Card marker") and the entries
of lanes A, B, C1 and C2a in `docs/log-inbox/dashboard-drop-import.md`. Lane A returns the stored project's id for
every imported file; lane C2a drives the progress panel and the toasts from those results on the dashboard. Two gaps
remain: the new card carries no mark, and an import from the modal gives no feedback (lane B's ticket).

Report Q6: the default view renders `article.gallery-card` (`Project.tsx:582`, via `Catalog.tsx:503`
`mode="gallery"`); the list view is `Catalog.tsx:111` `mode="list"`; no project element carries a `data-id`;
`.project-card__accent` belongs to a variant `Catalog.tsx` does not render.

## COSA

1. **Recent imports** (new module, name checked unused with a global `grep`): records the ids of projects just
   imported, with the time, and drops each after a few seconds (state the value, around 6 s); a subscription the cards
   can read without props drilling (the project uses hooks and context, or custom DOM events when callbacks do not
   reach). Pure and testable: the expiry is driven by an injectable clock.
2. **Marker** (`Project.tsx` and its stylesheet, confirm the path): a card whose id is in the recent set shows a top
   accent bar in `--color-success` and an "Imported" badge, in both gallery and list mode; the card's size does not
   change when the marker appears or goes (no layout shift: overlay the bar, fixed badge slot). Add a `data-id` only if
   needed to measure, as a new attribute, not a renamed one.
3. **Wiring** (`Dashboard.tsx`, `AllProjects.tsx`): every successful result from the dashboard drop and from the modal
   (drop and picker) is recorded in the recent set. The modal reuses lane C2a's mapping so that its imports raise the
   same toasts as the dashboard; no second copy of the toast texts.
4. **Tests**: the recent-imports module (add, expiry, several ids, re-import of the same id refreshes it). Mutation
   bench per `CLAUDE.md` §5.
5. **Probe and crops** (CDP drag with files, DOM and console, light theme, dev server on a free port, stopped before
   the final message): after a drop of one valid file the marker is on exactly the new card and absent after the
   expiry; the card's rect is identical with and without the marker; the same in list mode; an import from the modal
   raises the success toast and marks the card. Crops at 1440x900 in `~/.jjodel-lanes/P-2026-11-08-2215/crops/`:
   gallery with a marked card, list with a marked card, success toast after a modal import.

## HARD STOP

Gates at baseline, code commit with its pathspec, log entry in `docs/log-inbox/dashboard-drop-import.md` uncommitted
while the visual check is due (RC-17). Stop with `Outcome: hard-stop (visual check due)` and the crop paths.

## NON FARE

- Touch only the new module and its test, `Project.tsx`, its stylesheet, `Dashboard.tsx` and `AllProjects.tsx`. The
  toast components, the progress panel, lane A's module and `projects.ts` are out of scope.
- No change to collision naming (D2). No dark-theme styles (D-UI-15). No new dependency or token. No renamed class.
- No `git add .`, no stash. Trailer `Model:` on every commit.

## RIFERIMENTI

- Report `docs/discovery/discovery_2026-11-08_dashboard_drop_import.md` (Q6, Q8).
- `CLAUDE.md` §5, §17, §21; `docs/PROTOCOL.md` P8, P9, P13, P14, P16; `docs/decisions.md` D-UI-15, RC-17, RC-23.

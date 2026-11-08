# Notices and tips: discovery of the current notification card

Prompt-ID: P-2026-11-08-2230
Chat: C-2026-11-08-2220
Front: maintenance
Lane: full (more than three files expected in Phase 2; external data source; persistence of seen state)
Status: da eseguire

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-notices`, branch `notices-discovery`, created from the current trunk tip of
`alfonso-frontend-jjtl`. Before anything else: `pwd`, branch, `git log -1` and `git status` are as stated here.
Otherwise stop.

## Lane discipline
Every reply of this session opens with `[P-2026-11-08-2230 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
Context discipline: never `cat` a whole log or a large file; grep the lines you need.

## Contesto (non rifare l'analisi)

Jjodel shows a "QUICK TIP" card at the bottom right of the canvas (lightbulb icon, title, message, footer
"Tip 1 of 1" with a Next button). It was meant for two purposes: announcements to users and usage tips. Observed
by Alfonso on 2026-11-08: once the tips have been seen, the card keeps appearing; the footer reads "Tip 1 of 1"
although the source has six active tips; a second card edge is visible behind the first one (two instances, or a
stale container).

The content comes from Notion, database "** Jjodel Notifications"
(data source `collection://2eb4b66b-db50-808c-9334-000b17d45e1c`), columns: `Title` (title, empty on every row),
`Message` (text), `Category` (select: `system-notice`, `tip`), `Priority` (select: `info`, `warning`,
`success`, `error`), `Active` (checkbox). Six rows today, all `Category = tip`, all active.
A staging database "Jjodel Tips (staging)" exists beside it with 56 draft tips; the app must not read it.

Direction (to be ratified after this discovery): two distinct components. Announcements: a dismissible banner at
the top of the canvas, shown once per announcement id until dismissed, with a severity and an optional link and
date window. Tips: a compact card at the bottom left, at most one per session, never repeating a tip already seen,
silent once all tips are seen, with a "Turn off tips" control and a way to browse all tips from the Help menu.

## COSA

Phase 1 only, read-only. Answer, with `file:line` and verbatim quotes:

1. Where the card is rendered: component, SCSS, mount point(s). Why two cards can be on screen at once.
2. How the content is fetched: endpoint, server or client, where the Notion token lives (it must not be in the
   client bundle; say so explicitly if it is), caching, error and offline behaviour, which Notion columns are read,
   how `Active`, `Category` and `Priority` are used.
3. How "seen" is tracked today: storage key, what is stored (index, page id, message text), when it is written,
   and the exact reason the card reappears after all tips are seen. Reproduce on `npm start` and record the
   storage contents before and after.
4. Why the footer reads "Tip 1 of 1" with six active rows (filtering, pagination, empty `Title`, other).
5. Every other consumer of the same data or component (status bar, notifications bell, Help menu, onboarding).
6. Whether a settings or user-preferences store exists that can hold "tips off" across sessions and devices, or
   only localStorage.
7. Existing CSS class names and custom events in this area, so that Phase 2 does not collide (grep, quoted globs).
8. A Layer Impact Report is not expected: confirm that nothing in the path touches `useJjomSync.ts` or
   `portDistribution.ts`.

Measure on the live UI in light theme only; take numbers from the DOM and the console, not from screenshots:
card position and size (px), z-index, and the stacking with the right panel and the status bar.

## Report

Write the report to `docs/discovery/discovery_2026-11-08_notices_and_tips.md` (P4 minimum content: hypothesis,
objective, files read with full paths, findings with `file:line` and quotes, dependencies and risks, open questions
for Alfonso). Commit it alone, docs only, with pathspec. The hard stop is not reached until the report is
committed.

## HARD STOP

After the report commit. No code changes in this lane.

## NON FARE

No edits to product code, SCSS, or the Notion databases. No new dependencies. No `git add .`, no stash.

## RIFERIMENTI

`docs/PROTOCOL.md` P4, P9, P13, P16; `CLAUDE.md` §3 (critical zone), §21; template "Task visivi": the Phase 2
prompt will need current position and size in px, target position and size, and one mechanical acceptance
criterion, so record the current numbers precisely.

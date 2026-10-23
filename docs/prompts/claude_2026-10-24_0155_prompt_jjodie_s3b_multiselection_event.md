# Jjodie S3b: publish the canvas multi-selection

Prompt-ID: P-2026-10-24-0155
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S3b, probe then code)
Depends: P-2026-10-24-0115
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`). P8: no visible change; the
probe below measures behaviour, not looks.

Worktree: `~/jjodel-w-jjp-s3b`, branch `jjp-s3b`, cut from `jjodie-panel` at `90ca101c2` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0155 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files (CLAUDE.md §3.2) are not authorised: if
one is needed, stop. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green.
One probe run per tool call. Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat`
a whole large file or log; `EditorV2.tsx` (5080 lines) is read by line ranges found with grep; test, build and probe
output is read through `tail` or `grep` of the summary lines. Dev server only on a free port in 3010..3019 (check with
`lsof`), never 3000, 3001 or 3003; stop it at the end. Subject lines without `(P-...)` suffix, Prompt-ID in the body,
`Model:` trailer. Close with the log-inbox entry (skill `log-entry`) and the Status flip in one docs-only commit.
Nothing merges anywhere: the chat merges `jjp-s3b` into `jjodie-panel`.

## Read first, and only this

The report: Q4, Q7 (row S3b), «Decisions taken», «Dependencies and risks» (shift-click vs `selectElement` is not
measured). Row R-JJD-3 in `docs/decisions.md`.

## COSA

Slice S3b under R-JJD-3:

1. Probe first (a small script under `frontend/scripts/probe/`, following the existing ones): open a model with at
   least three nodes, click one node, then shift-click a second and a third, and record what React Flow reports as
   selected after each step and whether `selectElement` / `_lastSelected` collapses the shift selection. Write the
   answer in the log entry in three lines.
2. Add one event to `events/registry.ts` (append only; grep the name first) that carries the current canvas selection
   as an ordered list of element ids (the ids Jjodie can resolve to L-proxies, as `_lastSelected` does), emitted from
   `EditorV2.tsx` when React Flow's selected nodes change, debounced to one emission per animation frame, and never
   emitted when the list is unchanged. Single selection keeps working exactly as today.
3. A unit test for the pure part (list equality and ordering), and the probe re-run showing the event payload for
   one, two and three selected nodes.

If the probe shows shift-click selection cannot survive `selectElement` without changing selection semantics, stop with
`Outcome: question` and a `Recommended:` line.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(canvas): publish the multi-selection as an event`).

## HARD STOP

None: close with the docs commit and `Outcome: done`.

## NON FARE

No edit to Jjodie files, to `reducer.ts` or to any critical-zone file. No merge, no push.

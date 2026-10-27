# Jjodie: discovery of the extra undo entry after Apply

Prompt-ID: P-2026-10-24-0657
Lane: full (discovery, read-only)
Depends: P-2026-10-24-0256
Chat: C-2026-10-24-0020
Front: jjodie-ui
Status: eseguito 2026-10-24 · lane jjodie-ui · report 1bfa7192c · fixed by P-2026-10-24-1350
Corregge: none
Request: Alfonso, 2026-10-24 06:51, in the project chat («ok alle raccomandazioni» on the night digest)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: Phase 1 only; Phase 2 needs a GO from the project chat (and a critical-zone go-ahead if the cause lies there).

Worktree: `~/jjodel-w-jjp-udo`, branch `jjp-udo`, cut from `jjodie-panel` at `eb80f99d5` plus the commit that adds this
prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short`. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0657 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files (CLAUDE.md §3.2) are not authorised: if one is needed, stop.
Time limit: 60 minutes. No subagents, no background tasks. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; read by grep-found ranges; test, build and probe output through `tail` or `grep`. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Nothing merges anywhere: the chat merges.
Log entry in `docs/log-inbox/jjodie-ui-udo.md`. Read only: no edit under `frontend/src`; a probe under `frontend/scripts/probe/` is allowed.

## Read first, and only this

Rows R-JJD-6 and R-JJD-11. `docs/log-inbox/jjodie-ui-s4c.md` (the ticket: after Apply, a canvas click adds an undo
entry `Create element` holding only `pointedBy` on the new vertices).

## COSA

Find which code writes that entry and why on the first click after Apply. Questions: does the same happen after a single
hand-made creation (so it predates S4c)? Which writer sets `pointedBy` (canvas, `useJjomSync`, reducer, L-layer)? Is it a
deferred write that should belong to the Apply group (then the group must wait for it), or an unrelated side effect of
the click? Measure with a probe (one Apply, one click, list the undo stack entries with their deltas; same after a manual
creation). Write `docs/discovery/discovery_2026-10-24_undo_after_apply.md` with file:line evidence, the cause, two fix
options (one avoiding the critical zone if possible), and `Recommended:`. If the fix lies in a critical-zone file, say
so and include a Layer Impact Report sketch. Commit docs-only.

## HARD STOP

After the report: `Outcome: hard-stop`.

## NON FARE

No product code change. No merge, no push.

# Jjodie: bound JjEL evaluation in the conversation

Prompt-ID: P-2026-10-24-0655
Lane: full (small, R-JJD-9)
Depends: P-2026-10-24-0136, P-2026-10-24-0241
Chat: C-2026-10-24-0020
Front: jjodie-ui
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 06:51, in the project chat («ok alle raccomandazioni» on the night digest)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).

Worktree: `~/jjodel-w-jjp-jto`, branch `jjp-jto`, cut from `jjodie-panel` at `eb80f99d5` plus the commit that adds this
prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short`. Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0655 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list. Critical-zone files (CLAUDE.md §3.2) are not authorised: if one is needed, stop.
Time limit: 60 minutes. No subagents, no background tasks. One probe run per tool call. Context discipline: never `cat`
a whole large file or log; read by grep-found ranges; test, build and probe output through `tail` or `grep`. Dev server
only on a free port in 3010..3019 (check with `lsof`), never 3000, 3001 or 3003; stop it at the end. Light theme only.
Subject lines without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Nothing merges anywhere: the chat merges.
Log entry in `docs/log-inbox/jjodie-ui-jto.md`.

## Read first, and only this

Row R-JJD-9 in `docs/decisions.md`. `docs/log-inbox/jjodie-ui.md` (S3a: `JjelTimeoutError`) and
`docs/log-inbox/jjodie-ui-s3c.md` (its note on the nested `forall` that froze the page).

## COSA

Every JjEL evaluation started from the Jjodie conversation (the JjEL mode submit and any other path that evaluates
JjEL from Jjodie outside the live result) runs with the S3a deadline at 2000 ms. On a timeout the reply shows `timed out
after 2 s` in the muted style used by S3c, not as an error. Live evaluation keeps its 500 ms. Tests for the deadline
wiring where the path is testable; a probe that submits the nested `forall` from the S3c log and checks the page stays
responsive (a second action within 3 s) and the message appears. Gates: typecheck at the baseline of CLAUDE.md §17,
vitest (summary lines), build. Commit (`fix(jjodie): bound JjEL evaluation in the conversation`), then the docs commit.

## HARD STOP

None: `Outcome: done` with the probe result.

## NON FARE

No change to the JjEL evaluator beyond reading the existing deadline; no critical-zone file. No merge, no push.

# Jjodie S3a: JjEL evaluation deadline

Prompt-ID: P-2026-10-24-0136
Chat: C-2026-10-24-0020
Front: jjodie-ui
Lane: full (implementation S3a, no visual change)
Depends: P-2026-10-24-0115
Status: da eseguire
Corregge: none
Request: Alfonso, 2026-10-24 00:40 and 01:14, in the project chat (unattended run; S6 and one-step Apply approved)
Model: claude-opus-5-5

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 is done (`docs/discovery/discovery_2026-10-24_jjodie_panel_jjel_live.md`). P8 does not apply (nothing visible).

Worktree: `~/jjodel-w-jjp-s3a`, branch `jjp-s3a`, cut from `jjodie-panel` at `9dc2f3c6e` plus the commit that adds
this prompt. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules`
symlink may show). Otherwise stop.

## Lane discipline

Every reply opens with `[P-2026-10-24-0136 · session <id>]`; every final message ends with
`Outcome: done | hard-stop | question | blocked`; every question carries `Recommended: <one line>`. Unattended
(RC-21, RC-25) except the RC-26 list: Alfonso is asleep. Critical-zone files (CLAUDE.md §3.2) are not authorised: if
one is needed, stop. Time limit: 75 minutes. No subagents, no background tasks. Commit as soon as the gates are green.
One probe run per tool call. Context discipline (the first lane of this front stopped at the 200k ceiling): never `cat`
a whole large file or log; test and build output is read through `tail` or `grep` of the summary lines. Subject lines
without `(P-...)` suffix, Prompt-ID in the body, `Model:` trailer. Close with the log-inbox entry (skill `log-entry`)
and the Status flip in one docs-only commit. Nothing merges anywhere: the chat merges `jjp-s3a` into `jjodie-panel`.

## Read first, and only this

The report: Q5, Q7 (row S3a), «Decisions taken». The rows R-JJD-1..6 in `docs/decisions.md` (section «R-JJD»).

## COSA

Slice S3a under R-JJD-3: an optional `deadline` on the JjEL `EvaluationContext` (`jjel/evaluator/context.ts`),
checked in `JjelEvaluator.evaluate` (`jjel/evaluator/evaluator.ts`, its single dispatch point). When the clock passes
the deadline the evaluation stops with a distinct, typed outcome that a caller can tell apart from parse, runtime and
missing-feature errors (name it after what the code already uses for errors; grep first). Without a deadline nothing
changes: evaluation stays synchronous, on the main thread, and every existing test passes unchanged.

Tests first (a new file under `jjel/__tests__/`): an expression that exceeds a short deadline yields the timeout
outcome; the same expression without a deadline yields its value; a fast expression under a generous deadline yields
its value; the missing-feature warning (`property-not-found`) is unchanged. Then the code. Mutation bench: at least
three mutants on the deadline check, all killed.

Gates: typecheck at the baseline of CLAUDE.md §17, vitest (summary lines), build. Commit
(`feat(jjel): optional evaluation deadline`).

## HARD STOP

None: close with the docs commit and `Outcome: done`.

## NON FARE

No change outside `frontend/src/jjel/`. No worker. No merge, no push.

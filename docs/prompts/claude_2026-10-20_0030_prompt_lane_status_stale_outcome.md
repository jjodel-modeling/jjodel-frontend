# lane-run status: no stale Outcome after a resumed run dies (issue #181)

Prompt-ID: P-2026-10-20-0030
Chat: C-2026-10-20-0003
Front: harness
Lane: full (lane-run.mjs, its test, README line)
Status: da eseguire
Request: https://claude.ai/code/session_01Mk7LmH7N6YcSQiKx7oNZP5 (Alfonso, 2026-10-20 00:03: «chiudi tutto quello che puoi chiudere, compresi i ticket, vai in /lane auto»)
Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: no UI change; the gates and a replayed log are the check.
Worktree: `~/jjodel-w-statusstale`, branch `lane-status-stale`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.
Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-20-0030 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context

GitHub issue #181 (read it with `gh issue view 181 -R jjodel-modeling/jjodel-frontend`): after `lane-run resume`, if the new run dies on the account usage limit («You've hit your session limit», «weekly limit») or otherwise exits without writing an `Outcome` line, `lane-run status <id>` and `status --all` still print the Outcome of the previous run (measured three times on P-2026-10-07-0950). The true state is only in the last `result` event of `log.jsonl`.

## COSA

1. Find where `status` derives the Outcome (from `log.jsonl`, `exit.txt` or both) and how a resume marks the start of a new run (`started.txt` is rewritten on resume). Make the Outcome belong to the latest run only: if the latest run has no `Outcome:` line, status prints `none` (or `limit` when the last result or the stderr tail matches the usage-limit messages, and `died` for any other non-zero exit without an Outcome). Keep the column width and the existing outcome values unchanged for every other case.
2. Tests in the existing lane-run test file: a log with run 1 ending `Outcome: hard-stop` and run 2 ending on a usage-limit result with exit 1 reads `limit`; the same with a plain non-zero exit reads `died`; a run 2 that writes `Outcome: done` reads `done`; a lane never resumed is unchanged.
3. One line in the lane-run README (or the harness doc that lists outcome values) for `limit` and `died`.
4. Check the lane board (`frontend/scripts/lane-board/lane-board.mjs`) and Tack (`tack/`) only by `rg`: if either parses the status output and would choke on the two new values, say so in the report; do not edit them.
5. Commits (`git add` named files only): `fix(harness): lane-run status reads the Outcome of the latest run only (P-2026-10-20-0030)`, trailer `Model:` (P6), body `Closes #181`; then `docs: Status flip and log entry (P-2026-10-20-0030)` with the harness log-inbox entry (P9) and this prompt's `Status:`. `check:scripts` and `check:docs` from `frontend/`.

## DOVE

`frontend/scripts/lane-run.mjs`, its test, the lane-run README or harness doc line, the harness log inbox, this prompt.

## NON FARE

Do not edit anything under `~/.jjodel-lanes/`. No change to `lane-board.mjs` or `tack/`. No push, no merge.

## HARD STOP

None planned. `question` if the fix needs a change in the format of `exit.txt` or `log.jsonl` that other readers depend on.

## RIFERIMENTI

Issue #181; `docs/PROTOCOL.md` P16; RC-20..RC-30 in `docs/decisions.md`.

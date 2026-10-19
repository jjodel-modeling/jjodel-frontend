# Tack slice 4, continuation after the context ceiling

Prompt-ID: P-2026-10-19-1405
Chat: C-2026-10-19-0001
Front: tack
Lane: fast (closure of P-2026-10-19-1335: one cross-check, README, commits; code and tests already written)
Status: da eseguire
Depends: P-2026-10-19-1335
Corregge: none (continuation under RC-51, not a repair)
Request: Alfonso, 2026-10-19 13:32, in the project chat: «procedi con la slice 4 ?» (same request as P-2026-10-19-1335)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation). P8 does not apply (no UI).

Worktree: `~/jjodel-w-tack-s4`, branch `tack-s4`, **reused as is**: HEAD is `52f93aadf` with the uncommitted work of P-2026-10-19-1335 (7 modified and 9 new files under `tack/`). Before anything else: `pwd`, branch, `git log -1` (must be `52f93aadf`) and `git status --short` (only `tack/` paths); otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1405 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Read files above 500 lines with `offset`/`limit` or `rg`, never whole. Node: `~/.local/bin/node` for every Tack command and test.

## Context

The session of P-2026-10-19-1335 hit the 200k context ceiling (RC-51) with code and tests done (86/86) and nothing committed. Read first, and only these: `~/.jjodel-lanes/P-2026-10-19-1335/handoff.md` and the prompt `docs/prompts/claude_2026-10-19_1335_prompt_tack_s4_metrics.md` (its COSA, DOVE, NON FARE and HARD STOP still apply). Do not re-read the code it wrote unless a step below fails. The five unattended decisions listed in the handoff stand.

## COSA

1. `cd tack && ~/.local/bin/node --test`: must be 86/86 before anything else.
2. Run the cost cross-check: `TZ=Europe/Rome ~/.local/bin/node /tmp/tack-s4-acc/xcheck.mjs /tmp/tack-s4-acc/real.db`. Tack's daily cost for 2026-10-13..19 is split into lane and non-lane sessions and compared with the board's `spendByDay`. Explain every day where Tack's lane share and the board differ by more than 5%. If a difference has no nameable cause, stop with `Outcome: question` and the numbers.
3. Update `tack/README.md`: the metrics, the layer each needs, `tack metrics`, the link methods, local-time days with the UTC option, the subagent-cost estimate and its method.
4. Commit as P-2026-10-19-1335 asked, with this lane's ID in both subjects:
   1. `feat(tack): layer-1 metrics, worktree resolution, rename fix (P-2026-10-19-1335, P-2026-10-19-1405)` with `tack/**`. Trailer `Model:` (P6).
   2. `docs: Status flip and log entry for Tack slice 4 (P-2026-10-19-1405)` with one entry in `docs/log-inbox/tack.md` (resolution counts by method and reason, the two cross-checks, the five decisions) and the `Status:` lines of **both** prompts (1335 flipped to `eseguito ... · completed by P-2026-10-19-1405 · <sha>`).
5. `check:docs` from `frontend/`.

## DOVE

`tack/**`, `docs/log-inbox/tack.md`, the `Status:` lines of the 1335 and 1405 prompts. Nothing else.

## NON FARE

Everything in the NON FARE of P-2026-10-19-1335. No new metric or feature beyond the handoff. No push.

## HARD STOP

None planned: close with `Outcome: done`.

## RIFERIMENTI

- `~/.jjodel-lanes/P-2026-10-19-1335/handoff.md`, `handoff.diff`
- `docs/prompts/claude_2026-10-19_1335_prompt_tack_s4_metrics.md`
- `docs/PROTOCOL.md` context ceiling (RC-51)

# Tack slice 5b, continuation after the context ceiling

Prompt-ID: P-2026-10-19-1555
Chat: C-2026-10-19-0001
Front: tack
Lane: fast (closure of P-2026-10-19-1520: run the board, measure, README, commits; code and tests already written)
Status: da eseguire
Depends: P-2026-10-19-1520
Corregge: none (continuation under RC-51, not a repair)
Request: Alfonso, 2026-10-19 14:35, in the project chat: «Procedi» (same request as P-2026-10-19-1520)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation). P8 replaced as in P-2026-10-19-1520: the chat does the visual check after exit.

Worktree: `~/jjodel-w-tack-s5b`, branch `tack-s5b`, **reused as is**: HEAD `f4464519f` with the uncommitted work of P-2026-10-19-1520 (8 modified and 5 new files under `tack/`). Before anything else: `pwd`, branch, `git log -1` (must be `f4464519f`) and `git status --short` (only `tack/` paths); otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1555 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Node: `~/.local/bin/node`. Do not re-read the board code or Jjodel's board: read only the handoff and the prompt below; open a source file only if a step fails, and then only the function involved.

## Context

The session of P-2026-10-19-1520 hit the 200k context ceiling (RC-51) with Timeline, Insights, the Sessions fixes and 112/112 tests done, nothing committed. Read first, and only these: `~/.jjodel-lanes/P-2026-10-19-1520/handoff.md` and `docs/prompts/claude_2026-10-19_1520_prompt_tack_s5b_timeline_insights.md` (its COSA, DOVE, NON FARE still apply). The seven unattended decisions in the handoff stand.

## COSA

1. `cd tack && ~/.local/bin/node --test`: must be 112/112 first.
2. Stop the 5a board (PID in `/tmp/tack-s5a/board.pid`, 10945 at 15:50; check with `ps` that it is a `tack` node process before `kill`). Copy `/tmp/tack-s5a/real.db` to `/tmp/tack-s5b/real.db` and start the 5b board on port 4710 with that store, `--no-open`, in the background with `nohup`, PID in `/tmp/tack-s5b/board.pid`. Leave it running.
3. Measure with headless checks you can run from the shell (the API, and the served HTML/JS sizes); the DOM measurements at 1440 and 800 px are done by the chat in the browser after you exit, so do not try to drive a browser. Record in the entry: API timings for `/api/metrics` and `/api/timeline` on Jjodel, and the number of charts each tab declares.
4. A mutation bench on `src/board/charts.js` (at least three mutants, in place, restored), as P-2026-10-19-1520 would have done.
5. Update `tack/README.md` (views, `/api/timeline`, chart helpers, model-family colours, the date range on Insights).
6. Commit:
   1. `feat(tack): Timeline and Insights views, Sessions fixes (P-2026-10-19-1520, P-2026-10-19-1555)` with `tack/**`. Trailer `Model:` (P6).
   2. `docs: Status flip and log entry for Tack slice 5b (P-2026-10-19-1555)` with one entry in `docs/log-inbox/tack.md` (decisions, measurements, bench) and the `Status:` lines of both prompts (1520 flipped to `eseguito ... · completed by P-2026-10-19-1555 · <sha>`).
7. `check:docs` from `frontend/`.

## DOVE

`tack/**`, `docs/log-inbox/tack.md`, the `Status:` lines of the 1520 and 1555 prompts, and the two `/tmp` folders. Nothing else.

## NON FARE

Everything in the NON FARE of P-2026-10-19-1520. No new view, chart or metric beyond the handoff. No push.

## HARD STOP

None planned: close with `Outcome: done`.

## RIFERIMENTI

- `~/.jjodel-lanes/P-2026-10-19-1520/handoff.md`, `handoff.diff`
- `docs/prompts/claude_2026-10-19_1520_prompt_tack_s5b_timeline_insights.md`

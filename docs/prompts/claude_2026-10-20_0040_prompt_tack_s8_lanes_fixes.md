# Tack slice 8, fix: false waiting lanes and truncated IDs on the Lanes page

Prompt-ID: P-2026-10-20-0040
Chat: C-2026-10-19-1748
Front: tack
Lane: fast (two corrections found by the chat's visual check, on the slice 8 branch before its merge)
Status: da eseguire
Depends: P-2026-10-20-0018
Corregge: P-2026-10-19-2330
Request: Alfonso, 2026-10-19 23:43, in the project chat: «gestisci il tuo in automatico» (R-TACK-4)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: the chat checks the board after exit (RC-23). Phase 1 is reduced to item 1 of COSA, written into the log entry, no separate report and no hard stop.

Worktree: `~/jjodel-w-tack-s8`, branch `tack-s8`, HEAD `0806585e8`, clean tree. Before anything else: `pwd`, branch, `git log -1`, `git status --short` (only the `frontend/node_modules` link); otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline
Every reply opens with `[P-2026-10-20-0040 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 60 minutes. Node: `~/.local/bin/node`. Read only the lines you change (`grep -n`, then ranges). Tests with `--test-reporter=dot` piped through `grep -E 'not ok|# (tests|pass|fail)'`. Handoff at 120k.

## Context (measured by the chat on 4710, 2026-10-20 00:27)
The page renders. Two defects:

**A. Waiting shows 14 lanes, the 4700 board showed 1 an hour earlier.** Among them P-2026-10-19-1800 and P-2026-10-19-2140, both closed and merged: the trunk commit `e0fd6d286` names them in its subject (`feat(tack): s7 settings+notify P-2026-10-19-1800 P-2026-10-19-2140 (P-2026-10-19-2225)`) and the prompt files read `Status: eseguito`. Others (P-2026-10-19-1620, 1335, 1157, 2018-10-18-*) are closed on the 4700 board through their trunk prompt `Status:`. The rule ratified in Q2 (`LANE_CLOSURE`, `src/board/api.mjs:200`: a commit naming the Prompt-ID after the lane ended) is too narrow: a banner that lists 14 lanes when 1 is waiting will be ignored. The chat reverses Q2 under R-TACK-4.

**B. The Last 24 hours table truncates the Prompt-ID and the title** («P-2026-1…», «Tack slice …») at 1400 px. An ID must never be cut.

## COSA
1. Find why `e0fd6d286` does not close P-2026-10-19-1800 (ID matching only in parentheses, commit outside the scanned range, timing, or the store copy), and fix the matching so that any occurrence of the Prompt-ID in a commit subject or body, after the lane ended, closes it.
2. Add the second closure source: the `Status:` line of the lane's prompt file (path in `prompt.txt`), read at the repository's current HEAD. A lane is closed when that line starts with `eseguito` or `done` (case-insensitive). This is the 4700 rule; Tack already parses that header for `Chat:` and `Front:`. Update `LANE_CLOSURE` to name both sources, and the tooltip.
3. Table B: the Prompt-ID column never truncates (`white-space: nowrap`, a minimum width from the content); the title takes the remaining width and wraps to two lines at most before ellipsis, with the full title in `title=`.
4. Tests: a commit naming the ID outside parentheses closes the lane; a prompt `Status: eseguito …` closes it; `Status: da eseguire` does not; an ID in the table is rendered whole. Full suite green (≥ 210).
5. Restart the board on 4710 as before (PID in `/tmp/tack-s8/board.pid`, `TACK_NOTIFY=off`, store `/tmp/tack-s8/real.db` refreshed from `/tmp/tack-s7/real.db` only if the schema allows; otherwise keep it and say so). Report the new Waiting count from `/api/lanes`.
6. One `fix(tack)` commit, one docs commit with the log entry (item 1's finding first) and this prompt's `Status:` line (copy the prompt onto the branch from the trunk).

## DOVE
`tack/**`, `docs/log-inbox/tack.md`, this prompt file. Nothing else.

## NON FARE
No change to `frontend/scripts/lane-board/` (R-TACK-2) or `lane-run.mjs`. No push, no merge.

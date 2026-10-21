# Tack slice 6, continuation after the context ceiling

Prompt-ID: P-2026-10-19-1655
Chat: C-2026-10-19-0001
Front: tack
Lane: full (second half of P-2026-10-19-1620: CLI, API, Insights, chart fix, tests, parity run, closure)
Status: eseguito 2026-10-19 · lane tack-s6 · 6f0353e74, 35ae04d0c · merged 1aa42cc25 · parity re-run by the chat 17:15, ok · visual check passed
Depends: P-2026-10-19-1620
Corregge: none (continuation under RC-51, not a repair)
Request: https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215 (Alfonso, 2026-10-19 16:15, in the project chat: «si» to slice 6 (same request as P-2026-10-19-1620))

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (continuation). P8 replaced as in P-2026-10-19-1620: the chat checks the board after exit.

Worktree: `~/jjodel-w-tack-s6`, branch `tack-s6`, **reused as is**: HEAD `3d81e92f7` with the uncommitted work of P-2026-10-19-1620 (18 paths under `tack/`). Before anything else: `pwd`, branch, `git log -1` (must be `3d81e92f7`) and `git status --short` (only `tack/` paths); otherwise stop with `Outcome: blocked`. Do not reset, stash or re-create anything.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-1655 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 90 minutes. Node: `~/.local/bin/node`.

**Context budget.** Read first, and only: `~/.jjodel-lanes/P-2026-10-19-1620/handoff.md`, then the COSA, DOVE, NON FARE and Gates of `docs/prompts/claude_2026-10-19_1620_prompt_tack_s6_jjodel_parity.md`. Do not read `handoff.diff` whole (the work is already in the tree) and do not read Jjodel's board again: everything you need from it is in the handoff and in the copied helpers under `tack/`. Open a Tack file only to change it, by function. Run tests with `--test-reporter=dot` and print only failures. Write a new handoff at 150k, not at 200k.

## Context

P-2026-10-19-1620 stopped at the 200k ceiling with about half of slice 6 written and nothing committed: tests are 107/113 (6 red). Its five unattended decisions stand (prompt-unit regex widened to the `Prompt-ID:` header line; duplicate units suffixed `-2`, `-3`; `files` and `notes` dropped by the importer; commit link restricted to commits reachable from the session's branch or from the second parent of a merge naming it; schema 4). Already measured on `/tmp/tack-s6/`: importer 1,980 entries read, 1,177 converted and passing `tack check`; 421 sessions with a unit from the prompt, 97 from a reachable commit.

## COSA

Finish the list «Still to do» of the handoff, in this order, committing nothing until all of it is green:

1. `tack import jjodel-log` and `tack parity jjodel --days 14` in the CLI; layer-2/3 lines in `tack metrics`.
2. API and Insights: fix `sessionsApi` returning `branch` as null under schema 4 (the Sessions fallback to the branch must work again); layer-3 panels on Insights for repositories that have the data.
3. Chart label fix (item 6 of 1620): axis text 10-11 px at any width, no cut label.
4. Make the 6 red tests green (fix the code, or a test only where the schema-4 change makes its expectation wrong; say which in the entry) and add the new tests listed in 1620's item 8.
5. Run `tack parity jjodel --days 14` on the real store copy. The handoff flags a likely first-shot difference on lane P-2026-10-13-1930 (its correction comes from P-2026-10-17-1945, whose target has no log entry of its own, so the importer rejects it). Resolve it in Tack if the board's rule can be reproduced from the lane folders without the log entry; otherwise stop with `Outcome: question`, the per-day cost table and the first-shot list, and `Recommended:` your fix.
6. README; board on port 4710 with the real store copy, left running (stop the current one first: PID in `/tmp/tack-s5b/board.pid`, check it is a `tack` node process); the two commits as 1620 specified, with this lane's ID added to both subjects; the log entry (parity table, importer counts, decisions of both sessions); the `Status:` lines of both prompts (1620 flipped to `eseguito ... · completed by P-2026-10-19-1655 · <sha>`); `check:docs`.

## DOVE

As P-2026-10-19-1620, plus the `Status:` line of this prompt.

## NON FARE

Everything in the NON FARE of P-2026-10-19-1620. No new feature beyond its COSA. No push.

## HARD STOP

None planned: close with `Outcome: done`, or `Outcome: question` as in item 5.

## RIFERIMENTI

- `~/.jjodel-lanes/P-2026-10-19-1620/handoff.md`
- `docs/prompts/claude_2026-10-19_1620_prompt_tack_s6_jjodel_parity.md`

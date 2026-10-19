# Lane board: chat link from the trunk prompt when the lane's copy has none

Prompt-ID: P-2026-10-19-2229
Chat: C-2026-10-19-1747
Front: harness
Lane: fast (one fallback in `lane-board.mjs`, its test, README line)
Status: eseguito 2026-10-19 · lane boardurl · df1803517 · board on 4701: 12 of 12 backfilled Tack rows carry a chatUrl from the trunk prompt (rows without one 268 -> 254)
Depends: P-2026-10-19-2105
Corregge: P-2026-10-19-2105 (step 5 failed: the backfilled `Request:` lines never reach the board)
Request: https://claude.ai/code/session_018RaPfFUZaHRjEo11BkNXZB (Alfonso, 2026-10-19 22:26: «ok alle raccomandazioni», item 2)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 replaced: the chat checks the board after the merge (no visual change, only links that were missing).

Worktree: `~/jjodel-w-boardurl`, branch `boardurl`, created by the chat from the trunk; the commit that adds this prompt is on the branch. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-2229 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Node: `~/.local/bin/node`. Read every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (measured, do not redo)

P-2026-10-19-2105 (branch `requrl`, merging now as P-2026-10-19-2227) rewrote the `Request:` line of 12 Tack prompts to start with the chat URL. The board still shows those 12 lanes (chats `C-2026-10-19-0001` and `C-2026-10-19-1748`) without `chatUrl`, because it reads a lane's header from the copy `lane-run` keeps, `~/.jjodel-lanes/<id>/input-1.md` (`lane-board.mjs` around line 77), which holds the old line. Those copies record what the lane was given and must not be edited.

## COSA

1. In `ownChatUrl` (around line 1054), after the lane's own `Request:` and the `Claude-Session:` trailer, add a third source: the `Request:` line of the prompt file in the trunk's `docs/prompts/` whose `Prompt-ID:` matches the lane (the file named in the lane's `prompt.txt`, read at `REPO`; a missing file is no URL). Record it as `chatUrlFrom: 'prompt'`, and add its tooltip text to `chatFrom` (around line 2025): «from the prompt on the trunk». Cache the reads like `promptCommits` (same 5-minute window). The existing chat-id inference still runs after it.
2. Test (the board's existing test file): a lane whose `input-1.md` has a non-URL `Request:` and whose trunk prompt starts with a URL gets that URL with `chatUrlFrom: 'prompt'`; the lane's own URL still wins over the trunk's.
3. One line in `frontend/scripts/lane-board/README.md` where the chat link sources are listed.
4. Verify after the merge of P-2026-10-19-2227 has landed (if it has not, rebase on the trunk first): start the board from the worktree on port 4701 (`nohup`, killed at the end), and count rows without `chatUrl` before (from 4700) and after (from 4701). All 12 rows of the two Tack chats must have a URL.
5. Commit (`git add` named files only): `fix(harness): lane board takes the chat URL from the trunk prompt (P-2026-10-19-2229)`, trailer `Model:` (P6); then `docs: Status flip and log entry (P-2026-10-19-2229)` with the log-inbox entry (P9) and this prompt's `Status:`. `check:scripts` and `check:docs` from `frontend/`.

## DOVE

`frontend/scripts/lane-board/lane-board.mjs`, its test, `frontend/scripts/lane-board/README.md`, the harness log inbox, this prompt.

## NON FARE

Do not edit anything under `~/.jjodel-lanes/`. Do not touch `lane-run.mjs` or `tack/`. Do not restart the launchd board on 4700: the merge lane handles it.

## HARD STOP

None planned. Stop with `question` if any of the 12 rows still lacks a URL after the change, with the reason per row.

## RIFERIMENTI

RC-43 in `docs/decisions.md`; `ownChatUrl`, `promptCommits`, `chatFrom` in `lane-board.mjs`; the closing report of P-2026-10-19-2105 in `~/.jjodel-lanes/P-2026-10-19-2105/log.jsonl`.

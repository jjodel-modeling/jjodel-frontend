# Every lane links its chat: Request URL gate and Tack backfill

Prompt-ID: P-2026-10-19-2050
Chat: C-2026-10-19-1747
Front: harness
Lane: fast (one refusal in `lane-run start`, its tests, a header backfill in docs/prompts, one PROTOCOL line)
Status: da eseguire
Depends: none
Corregge: none
Request: https://claude.ai/code/session_018RaPfFUZaHRjEo11BkNXZB (Alfonso, 2026-10-19 17:47: «nelle lane cliccando non apre la chat corrispondente»; 20:48 «vai»)

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P8 does not apply, no UI change (the board's rendering is untouched).

Worktree: `~/jjodel-w-requrl`, branch `requrl`, created by the chat from the trunk at the docs commit that added this prompt. Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: as `lane-run start` assigns.

## Lane discipline

Every reply opens with `[P-2026-10-19-2050 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25) except the RC-26 list. Time limit: 45 minutes. Node: `~/.local/bin/node`. Read `docs/decisions.md`, the logs and every file above 500 lines with `offset`/`limit` or `rg`, never whole.

## Context (measured by the chat, do not redo)

The lane board links a lane to its claude.ai conversation through `ownChatUrl` in `frontend/scripts/lane-board/lane-board.mjs` (around line 1054): first word of the `Request:` header if it is a `https://claude.ai/` URL, else the `Claude-Session:` trailer of the commit that added the prompt, else (around line 600) inference from another lane with the same `Chat:` id. Alfonso confirmed the `claude.ai/code/session_…` links open the right chat.

All 11 prompts of chat `C-2026-10-19-0001` and the one of `C-2026-10-19-1748` (Tack, P-2026-10-19-1100 to 1800) have none of the three: those chats commit through the Mac shell, so their commits carry `Co-Authored-By` but no `Claude-Session:`, and their `Request:` line starts with «Alfonso, …», against RC-43 (`Request: <URL>` or `Request: none (<reason>)`). `lane-run start` today only warns when the `Request:` line is missing altogether (around line 1203), so the defect passes silently. Many other chats also write a non-URL `Request:` and are saved by the trailer; the gate must not break them.

Known URLs: `C-2026-10-19-0001` is https://claude.ai/chat/1b373b77-3e1f-4c66-b75e-9eec8a5ba215, `C-2026-10-19-1748` is https://claude.ai/chat/f96ef649-86b6-4a81-9ceb-08b0bfb9fd4c.

## COSA

1. **Gate in `lane-run start`.** After the RC-43 check, for a non-merge prompt (same exemptions as `unnamed`): the lane is *linked* when the first word of `Request:` is an `https://` URL, or `--request` was given, or the commit that added the prompt file carries a `Claude-Session:` trailer whose value matches `^https://claude\.ai/`. `Request: none (…)` is accepted as declared. Otherwise refuse, before anything is written, with: `<prompt>: the lane cannot be linked to its chat: start the Request: line with the chat URL, or commit the prompt with the Claude-Session: trailer (P13, RC-43)`. Reuse the existing git helpers of `lane-run.mjs`; no new dependency.
2. **Tests** in the existing `lane-run` test file: refused (non-URL Request, no trailer); started (URL Request); started (non-URL Request, trailer present); started (`none (…)`); merge prompt exempt. A mutation that drops the trailer branch must fail a test.
3. **Backfill.** In every prompt under `docs/prompts/` whose header has `Chat: C-2026-10-19-0001` or `Chat: C-2026-10-19-1748`, rewrite the `Request:` line as `Request: <chat URL> (<previous text>)`, changing nothing else in the file. Report the count (expected 12).
4. **PROTOCOL.** One sentence under P13 (where `Request:` is described): a chat that commits from the Mac shell starts `Request:` with its own URL or adds its `Claude-Session:` trailer to the commit; `lane-run start` refuses a prompt with neither.
5. **Verify** with `curl -s localhost:4701/api` from a board started in the worktree on port 4701 (`node frontend/scripts/lane-board/lane-board.mjs --port 4701`, background with `nohup`, killed at the end): every row with `chat` `C-2026-10-19-0001` or `C-2026-10-19-1748` has a non-empty `chatUrl`. Record the before/after counts of rows without `chatUrl`.
6. **Commit** (`git add` named files only):
   1. `fix(harness): lane-run start refuses a lane its board cannot link to a chat (P-2026-10-19-2050)` with `lane-run.mjs` and its test. Trailer `Model:` (P6).
   2. `docs: Request URLs for the Tack chats and the P13 sentence (P-2026-10-19-2050)` with the backfilled prompts, `docs/PROTOCOL.md`, the log-inbox entry (P9) and this prompt's `Status:` flip.
7. `check:docs` and `check:scripts` from `frontend/`.

## DOVE

`frontend/scripts/lane-run.mjs`, its test file, `docs/prompts/*` (only the `Request:` lines named in COSA 3), `docs/PROTOCOL.md`, the harness log inbox, this prompt.

## NON FARE

Do not touch `lane-board.mjs` or anything under `tack/`. Do not rewrite `Request:` lines of other chats. Do not make the gate a warning: it refuses. No new decision row in `docs/decisions.md` (this enforces RC-43, it does not amend it).

## HARD STOP

None planned: the lane runs to `Outcome: done`. Stop with `question` only if the gate would refuse a lane currently running or a prompt of today's other chats that has neither URL nor trailer; list them with `Recommended:`.

## RIFERIMENTI

RC-43 and RC-44 in `docs/decisions.md`; P13 in `docs/PROTOCOL.md`; `ownChatUrl` and `promptCommits` in `frontend/scripts/lane-board/lane-board.mjs` (read only).

# Lane board: the chat of each lane opens its claude.ai conversation

Prompt-ID: P-2026-10-10-1816
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: fast (one file, `frontend/scripts/lane-board/lane-board.mjs`, outside the critical zone)
Depends: P-2026-10-10-1742
Status: eseguito 2026-10-10, lane P-2026-10-10-1816 (board-chat-links, 226fce084); visual check passed (chat, built-in browser on 4703, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-chatlinks`, branch `board-chat-links`, cut from the tip of `lane-board-columns` (`3339c11ee`,
fixed column widths, verified and waiting to merge), because both touch the Lanes-tab rendering; the docs commit
adding this prompt is the first commit on the branch. `frontend/node_modules` symlinked (P14). Before anything
else: `pwd`, branch, `git log -2` and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-1816 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.

## Context (measured, do not redo the analysis)
The Lanes tab shows under "Launched by" the chat id of a lane (`C-YYYY-MM-DD-HHmm`, from the `Chat:` header). That
id is coined by the chat and opens nothing. Alfonso wants it to open the conversation. Three sources hold a real
URL, all `https://claude.ai/code/session_…`:
1. the `Request:` header of the prompt (RC-43, from 2026-10-10; four sessions use it already);
2. the `Claude-Session:` trailer of the commit that added the prompt: since 2026-09-20 about 25 distinct session
   URLs appear there, but less than half of the prompt commits carry it (56 of 138 since 2026-10-01);
3. by chat id: a lane without its own URL whose `Chat:` id appears in other lanes that have one.
`promptCommits()` (`lane-board.mjs:386`) already reads the commit that added each prompt with its full body (`%B`),
and `launcherOf()` (`:410`) builds the "Launched by" data; the client renders it in `launch` (`:860`).

## WHAT
1. Server: give each lane row `chatUrl` and `chatUrlFrom` (`request` | `commit` | `chat-id` | empty), in this
   priority: the `Request:` header when it is an `https://claude.ai/` URL; else the `Claude-Session:` trailer of the
   commit that added the prompt; else, by chat id, the URL most recently seen for the same `Chat:` id in another
   lane (by Prompt-ID). Accept only URLs that start with `https://claude.ai/`. Reuse what `promptCommits()` already
   reads; no extra git call per lane.
2. Client: in the "Launched by" cell, the chat id becomes a link to `chatUrl` (`target="_blank" rel="noopener"`),
   with a `title` naming the source (for example "from the Request header", "from the commit that added the
   prompt", "inferred from P-2026-10-10-1150, same chat id"). Without a URL the id stays plain text. A lane with no
   chat id but a URL shows a short "chat" link in the same place. Keep the fixed column width of the branch you
   start from; the link truncates like the rest of the cell.
3. Report coverage on the real data, by source: how many rows of `/api` get a URL from each source and how many get
   none, overall and for the last 7 days.
4. Checks: `node --check frontend/scripts/lane-board/lane-board.mjs`; `npm run check:scripts` from `frontend/`;
   start this tree's board in the background on port 4703 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4703-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4703 --refresh 30`;
   report its PID and leave it running.
5. One code commit with an explicit pathspec, `feat(harness): lane board links each lane to its chat`, then the
   log entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), then stop with
   `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `timeline.js`, `insights.js` or `lane-run.mjs`; change any other column.
- Touch the launchd service `io.jjodel.lane-board`, ports 4700 to 4702, or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-23, RC-43.

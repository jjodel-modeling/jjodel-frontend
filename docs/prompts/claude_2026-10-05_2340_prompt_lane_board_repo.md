# Prompt: the lane board moves into the repo

Prompt-ID: P-2026-10-05-2340
Chat: C-2026-10-05-1116
Lane: full (more than 3 files: three copied scripts, a README, `package.json`, the log entry). Tier: heavy (RC-32 on a full lane). Model: the default of `.claude/settings.json`, no deviation. No critical-zone go-ahead.
Depends: none
Status: da eseguire
Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-laneboard`, branch `lane-board`, cut from the trunk at `078325ee6`, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` (the docs commit adding this prompt, on top of `078325ee6`) and a clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline

Every reply of this session opens with `[P-2026-10-05-2340 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.

## Context (do not redo the analysis)

On 2026-10-05 chat `C-2026-10-05-1116` built a read-only live board of the lanes for Alfonso, outside the repo, in `~/.jjodel-lanes/board/`: a Node server with no dependencies (`lane-board.mjs`) and two browser scripts it serves (`timeline.js`, `insights.js`). It runs under the launchd agent `io.jjodel.lane-board` on http://localhost:4700. It reads `lane-run status --all`, the lane folders of `~/.jjodel-lanes/`, and `git log --all -- docs/prompts/` of `~/jjodel` (who launched each lane). It writes nothing but its own cache, `~/.jjodel-lanes/board/timeline-cache.json`. Three tabs: Lanes (table), Timeline (turns, decisions, waits, overlaps, dependencies, parallelism chart), Insights (aggregates, Perfetto trace and XES exports). It already parses a `Depends:` header line (introduced in parallel by lane `P-2026-10-05-2341`) and draws it as a solid arrow. Alfonso asked for it to be versioned.

## COSA

1. Create `frontend/scripts/lane-board/` with the three files copied **byte for byte** from `~/.jjodel-lanes/board/` (read them there, do not edit that folder). Their md5 must be: `lane-board.mjs` 56d1ef69f6f1e3ad4357d2d666869049, `timeline.js` d3eeca2ec2c428c294f49b6bb68922d0, `insights.js` 5cdb6bb0013e376840360d5ad997ce1f. If any differs, stop with `Outcome: question`. No edit to their content in this lane: the board resolves `lane-run.mjs` beside itself (`../lane-run.mjs`) when it runs from the repo.
2. `frontend/scripts/lane-board/README.md`, in English, short: what the board shows (the three tabs, one paragraph each), that it is read-only (writes only its cache under `~/.jjodel-lanes/board/`), how to run it (`node frontend/scripts/lane-board/lane-board.mjs [--port 4700] [--refresh 30]`, or `npm run lane-board` from `frontend/`), its environment variables (`JJODEL_LANES`, `LANE_RUN`, `JJODEL_REPO`, `LANE_BOARD_CACHE`, `LANE_BOARD_PORT`, `LANE_BOARD_REFRESH`, read their defaults from the code), the launchd agent (label `io.jjodel.lane-board`, a minimal plist with RunAtLoad and KeepAlive as a code block, `launchctl bootstrap` / `bootout` / `kickstart -k`), how the launcher of a lane is classified (from the commit that added its prompt) and the exports (`/export/trace.json` for ui.perfetto.dev, `/export/lanes.xes` for process mining, both with `?days=<n>`). Port 4700 is outside the 30xx range of dev servers and probes; say so.
3. `frontend/package.json`: one script, `"lane-board": "node scripts/lane-board/lane-board.mjs"`, placed after `"smoke"`. Nothing else in that file.
4. Log entry in `docs/log-inbox/harness.md` (P9 format).

## Tests and gates (all in the foreground)

`node --check` on the three files; `npm run check:scripts`; `npm run check:docs`; `npm run typecheck:scripts` (if it now reports errors only in the new `.mjs`/`.js` files because they are type-checked, stop with `Outcome: question` and the fix you recommend). One live check in a single foreground command, from `frontend/`: start `node scripts/lane-board/lane-board.mjs --port 4701` in the background of that same command, wait 3 s, `curl` `/api`, `/api/timeline`, `/export/trace.json?days=1` and `/export/lanes.xes?days=1` (status codes and sizes), then kill that process (its PID only). Port 4701, never 3001 and never a 30xx port. Report the four codes.

## Commits and closure

One code commit with the three scripts, the README and `package.json`: `feat(harness): lane board in the repo (frontend/scripts/lane-board)`. A harness lane has no visual check: the closure commit follows at once, with the Status flip (`Status: eseguito <YYYY-MM-DD> · lane lane-board · <sha>`) and the log entry. Then `Outcome: done`. Do not merge.

## NON FARE

No edit to `lane-run.mjs` or to any other script; no edit to the content of the three copied files; no change to `~/.jjodel-lanes/` or to the launchd agent (the chat repoints it after the merge); no `git stash`, no `git add .`, no files outside the worktree except reading the three sources.

## RIFERIMENTI

`CLAUDE.md`, `docs/PROTOCOL.md` P9, P13, P16.

# Arch column: the lane board and lane-usage show the architect's tokens per lane from architect.json

Prompt-ID: P-2026-10-18-1155
Chat: C-2026-10-17-1757
Front: harness
Lane: fast (lane board, lane-usage and their tests; outside the critical zone; tier drawn (RC-45): light)
Status: eseguito 2026-10-18 · lane harness · e10902120
Depends: P-2026-10-18-1045
Request: none (Alfonso, 2026-10-18 11:34 «c'è un modo per stimare anche l'architetto?» and 11:44 «applica tutto il più possibile in automatico»; words kept in the lane folder's request.md, RC-43)

Protocollo: docs/PROTOCOL.md — clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (one-session implementation lane, RC-17; the contract is in this prompt). P8 in its RC-23 form: the chat checks `/api` after the launchd restart, no screenshot.

Worktree: `~/jjodel-w-archcol`, branch `lane-board-arch`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, with `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch and `git log -1` match; otherwise stop with `Outcome: blocked`.

Model and tier: light, `claude-sonnet-5-5` (RC-32), effort `high`. Launched with `--tier light` from the RC-45 draw.

## Lane discipline
Every reply opens with `[P-2026-10-18-1155 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`; unattended (RC-21, RC-25). Time limit: 60 minutes (RC-20). Output discipline (CLAUDE.md §0.1): Read with `offset`/`limit` on `lane-board.mjs` (1600 lines), tests through `run-quiet.mjs`, never start the board on 4700 (use `--port 4710` for a manual check and stop it).

## Context (the contract; do not redo the analysis)
The lane board shows the executor's tokens since P-2026-10-18-1045 (columns In, Out, Total, Ctx max, from `lane-usage.mjs`). The architect (the project chat that writes the prompts and drives the lanes) is a session too, with a transcript where every call carries `usage`; it is not visible to `lane-run`. From today the chat writes, in each lane folder, `~/.jjodel-lanes/<Prompt-ID>/architect.json` with its own cumulative counters at launch and at close (decision of chat C-2026-10-17-1757 under RC-25, 2026-10-18 11:50; eight lanes of 2026-10-18 are already backfilled). Schema 1:

```json
{ "schema": 1, "chat": "C-2026-10-17-1757", "model": "claude-fable-5-1", "source": "<free text>",
  "launch": { "at": <epoch seconds>, "calls": n, "input": n, "cacheRead": n, "cacheCreation": n, "output": n, "totalIn": n, "ctxMax": n, "ctxLast": n },
  "close":  { same fields, or absent while the lane is open },
  "delta":  { "calls": n, "input": n, "cacheRead": n, "cacheCreation": n, "output": n, "totalIn": n } }
```
`launch` and `close` are cumulative since the chat session started; `delta` is `close` minus `launch` and is what the lane cost the architect. When `close` is absent the lane is still open from the chat's point of view and the delta is not known.

## COSA
1. `lane-usage.mjs`: read `architect.json` when present (schema 1 only; anything else is reported as `architect: unreadable` and ignored). The text output gains one line `architect  calls <n>  in <totalIn>  out <output>  (chat <id>)` or `architect  open` or `architect  none`; the JSON form gains `architect: {chat, model, delta} | null` and `architectOpen: true|false`; `--all` gains a column `arch` (delta `totalIn + output`, abbreviated like the others, `open` or `n/a`). The existing counts are unchanged.
2. Lane board, Lanes tab (both variants): one column `Arch` after `Total`, abbreviated like the token columns, title with the exact integers and the chat id, `open` while `close` is absent, `n/a` when the file is absent. The row's `/api` fields: `archIn`, `archOut`, `archTotal`, `archChat`, `archOpen`. `COL_W` fixed width; the usage cache (`usage-cache.json`) keys this file by its own size and mtime, or reads it uncached if simpler (it is small; say which in the entry).
3. Insights tab, Tokens block: two more figures per tier and per model, the sum and median of `Arch` over the closed lanes that have it, and the ratio architect over executor (sum of `Arch` divided by sum of `Total`) with the number of lanes that carry both. Raw numbers in `/api/insights`.
4. README: the `Arch` column, the schema above (verbatim), who writes the file and that the board never writes it.
5. Tests: `laneUsage.test.ts` (present, absent, open, unreadable; `--all` column; JSON fields) and `laneBoard.test.ts` (column in both variants, `open`, `n/a`, the two Insights figures on a two-lane fixture). Fixtures under the existing `fixtures/lane-usage/`: add `architect.json` to one lane, an open one to another.

## Gates
`laneUsage.test.ts`, `laneBoard.test.ts`, then all of `scripts/hooks`, through `run-quiet.mjs`; `typecheck:scripts` exit 0; `check:scripts` PASS; `check:docs` after the docs commit. Real run: `node frontend/scripts/lane-usage.mjs P-2026-10-18-0945` must print the architect line with `in 17073234 out 58831`; put it in the entry.

## Commits (P13, RC-17), explicit pathspecs
Commit 1, `feat(harness): lane board and lane-usage show the architect's tokens per lane (P-2026-10-18-1155)` (under 72 without the suffix): `lane-usage.mjs`, `lane-board.mjs`, `insights.js` if needed, the two tests, the fixtures. Commit 2: `frontend/scripts/lane-board/README.md` alone (the bash-guard counts it as code, see the B3b entry). Commit 3, docs: the log entry in `docs/log-inbox/harness.md` and the Status flip of this prompt. No push, no merge (RC-19); the chat merges and restarts the launchd agent.

## HARD STOP
None planned.

## NON FARE
Do not touch `lane-run.mjs`, `timeline.js`, `requirements.js`, hooks, `.claude/`, `CLAUDE.md`, `docs/PROTOCOL.md`, `docs/decisions.md`. Do not write `architect.json` anywhere (the chat writes it). No `git add .`, no `git stash`, no `git reset --hard`.

## RIFERIMENTI
`~/.jjodel-lanes/P-2026-10-18-0945/architect.json` (a real file of the schema); `frontend/scripts/lane-usage.mjs`; `frontend/scripts/lane-board/lane-board.mjs` (`COL_W`, `cols`, `/api/insights`, the usage cache added by P-2026-10-18-1045); `frontend/scripts/lane-board/README.md`; `docs/log-inbox/harness.md` entries of P-2026-10-18-0100 and P-2026-10-18-1045; `docs/decisions.md` RC-17, RC-20, RC-21, RC-25, RC-32, RC-43, RC-45; `docs/PROTOCOL.md` P6, P13, P14.

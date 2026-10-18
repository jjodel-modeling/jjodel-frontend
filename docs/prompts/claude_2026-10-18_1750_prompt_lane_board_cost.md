# Lane board: cost per lane and spend per day in the Lanes tab

Prompt-ID: P-2026-10-18-1750
Chat: C-2026-10-18-1750
Front: harness
Lane: fast (one module of the lane board, its README and its test; no critical zone, no exported interface)
Status: da eseguire
Request: Alfonso, 2026-10-18 17:40, through the lane status chat: «costo in dollari per lane nella tab Lanes e spesa totale per giorno»
Depends: P-2026-10-18-1428 (merged)
Corregge: —

Protocollo: docs/PROTOCOL.md, clausole P1..P16 applicabili (tutte salvo deroga esplicita nel prompt).
Deroga: P4 does not apply (fast lane: the check below is the discovery, at most ten lines in the entry). P8 applies to the board, not to the app: see Checks.

Worktree: `~/jjodel-w-lanecost`, branch `lane-cost`, created by the chat from the local `alfonso-frontend-jjtl` at the docs commit that added this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1`, `git status` match; otherwise `Outcome: blocked`.

Model and tier: as `lane-run start` assigns; no critical zone, no visual bug.

## Lane discipline

Every reply opens with `[P-2026-10-18-1750 · session <id>]`; every final message ends with `Outcome: done | hard-stop | question | blocked`; questions carry `Recommended: <one line>`. Unattended (RC-21, RC-25) outside the RC-26 list; record the choices in the entry. Time limit 60 minutes. Tests through `run-quiet.mjs`; read `lane-board.mjs` (1784 lines) with Read and `offset`/`limit`, never whole.

## Context (do not redo the analysis)

The cost is already read: `logFacts` (`lane-board.mjs:777-792`) keeps `costUSD` as the max of `total_cost_usd` over the `result` events, which is cumulative over the session and restored by a resume (0 decreases in 196 consecutive pairs, 2026-10-10). Today only the Insights tab shows it (`:1262`). The Lanes tab rows come from the /api builder (`:539-576`), its columns from `table()` (`:1670-1685`), `tips` and `COL_W`; the earlier days are grouped by start day in `renderOlder()` (`:1704-1712`). Turns are built from `input-k.md` mtimes and the `result` durations (`:655-660`, `:855-880`). Token columns are cached per lane by log size and mtime (`laneTokens`, `usage-cache.json`).

## COSA

1. **Cost column.** In both Lanes tables (live and earlier), a `Cost` column after `Arch`, width 64 px. Cell: `$` and two decimals, `<$0.01` above zero and below a cent, empty when the lane has no `result` with a cost (chains included). Cell title: the full value and the number of sessions (`init` events). Header tip, verbatim: «List price at API rates: total_cost_usd as Claude Code reports it, cumulative over the lane's sessions. Not what the subscription costs. The architect chat is not included.» Check on one lane with subagents whether its `modelUsage` lists the subagent model; record the answer in the entry, and if subagents are included add « Subagents included.» to the tip.
2. **Spend per day, by turn.** A pure exported function that takes the cost-bearing `result` events of a log in order and the lane's turns, and returns `{ 'YYYY-MM-DD': usd }`. The delta of each event is the increase of `total_cost_usd` over the previous event of the same log; a decrease means a new session, and the delta is then the value itself. A delta lands on the local day (the same local-day rule as `row.day`, `:566`) of the end of the turn that the event closes; an event that closes no turn (a task notification) lands on the end of the preceding turn; a lane without input files has one turn and lands on its end. Cache it with the token columns, keyed on log size and mtime (bump the cache key), so a refresh reads only the logs that changed.
3. **Totals.** `/api` gains `spendByDay`, summed over all lanes. Each `renderOlder` summary appends ` · $X.XX` for its day, read from `spendByDay` (it is the spend of that day, not the sum of the rows shown under it: a lane started the day before can add to it). The meta line gains ` · today $X.XX`. Title of both, verbatim: «Spend on this day at API list price, each turn counted on the day it ended. The architect chat is not included.»
4. **README.** In `frontend/scripts/lane-board/README.md`, where the Lanes tab columns are described, two short paragraphs: the Cost column and the day totals, with the attribution rule of item 2 and what is excluded.

## DOVE

`frontend/scripts/lane-board/lane-board.mjs`, `frontend/scripts/lane-board/README.md`, `frontend/scripts/hooks/__tests__/laneBoard.test.ts`. Anything else: stop and ask with a recommendation.

## Checks

Tests first in `laneBoard.test.ts` for the function of item 2: increments, reset on decrease, a notification between turns, a turn that ends after local midnight, no cost events. `scripts/hooks` suite green at its count plus the new tests; `typecheck:scripts` 0; `check:scripts` PASS; `check:docs` PASS on the docs commit. Then start the board from this worktree on port 4711 with `LANE_BOARD_CACHE` pointing to a file under `/tmp/lanecost/` (never the shared cache in `~/.jjodel-lanes/board/`), report three lanes of today with Cost and the today total, and leave it running for the chat's check (RC-23): `Outcome: hard-stop`. After the GO (a resume): docs commit with the Status flip and the P9 entry in `docs/log-inbox/harness.md`, then `Outcome: done`.

## NON FARE

No change to `logFacts` semantics, to the Insights tab or to other columns' widths; no new dependency; no restart of the shared board on 4700.

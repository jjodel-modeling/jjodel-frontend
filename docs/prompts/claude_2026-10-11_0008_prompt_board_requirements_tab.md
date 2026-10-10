# Lane board: Requirements tab over req-trace.mjs

Prompt-ID: P-2026-10-11-0008
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: full (four files: board, new requirements.js, README, one new test file)
Depends: P-2026-10-10-2022, P-2026-10-10-2103
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardreq`, branch `board-requirements`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-0008 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` (lane P-2026-10-10-1806) planned the port of
branch `harness-req-tab` onto the trunk board; Alfonso approved it in chat. S1 to S4 are on the trunk: `lane-run
resolve`, progress in the Phase cell, `frontend/scripts/req-trace.mjs` (S3, verbatim, no caller yet) and the status
strip. This lane is the last slice, **S5** (§7, wave 3): feature F2, the Requirements tab. Read §3 row F2, §5 (the
`laneBoardStrip.test.ts` row, whose Requirements-route test moves here), §6 (what the tab needs from the server) and
§8 R2, R5, R6. Branch sources at `35240a582` (tag `archive/harness-req-tab-2026-10-10`): `frontend/scripts/board/
requirements.js` (155 lines), `requirements()` and its routes in `frontend/scripts/lane-board.mjs` (`:684-708`, `:882`,
`:886`), and the Requirements-route test in `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts` (`:153-159`).
Read them with `git show 35240a582:<path>`. The trunk board is the base (D1); the port is a fresh edit (D2).

Alfonso decided R5 and R6 in chat:
- **R5, milestones.** Keep the branch's grouping by milestone, including the group of rows realized after the last
  milestone (today the only milestone is the built-in MODELS freeze of 2026-10-07, so 12 rows land there). When
  `docs/goals/milestones.json` exists, `req-trace.mjs` already reads it; the tab shows whatever it returns. Invent no
  milestone and no date.
- **R6, opposing pairs.** 612 pairs today. Do not render one flat table: group the pairs by goal-model conflict (11
  today), one collapsed group per conflict (`<details>`, closed by default) whose summary names the conflict and its
  pair count; the pairs show when a group is opened. If a pair carries no conflict name in the `req-trace` output,
  put it in a last group "unassigned" and say in the report how many there are.

## WHAT
1. **Server, `frontend/scripts/lane-board/lane-board.mjs`.** Port `requirements()`: it spawns
   `req-trace.mjs` asynchronously, at most one run at a time, keeps the JSON 60 s, kills a run at 120 s. Trunk paths:
   `REQ_TRACE = join(HERE, '..', 'req-trace.mjs')`, `REQ_REPO = join(HERE, '..', '..', '..')`; env overrides
   `REQ_TRACE_REPO` and `REQ_TRACE_TRUNK` (§6). Routes: `/api/requirements` and the static asset `/requirements.js`,
   served beside `timeline.js` and `insights.js`. Page: a `Requirements` tab button after `Insights`, its `showTab`
   entry and refresh hook. The strip must still follow the last tab button (S4's assertion is order-independent).
2. **Client, new `frontend/scripts/lane-board/requirements.js`**, from the branch file: rows grouped by cluster, then
   milestone, with the family, status, realized and softgoal filters; the R5 and R6 rules above. Use the trunk page's
   CSS variables (all exist in the trunk `:root`, §6). Fixed widths in its tables, as the other tabs do: no layout
   shift when a filter changes or a group opens.
3. **README.** `frontend/scripts/lane-board/README.md`: the tab, what it reads, the 60 s cache and the 120 s kill,
   `REQ_TRACE_REPO`/`REQ_TRACE_TRUNK`, and that it reads the board checkout's working tree (§9 D6).
4. **Tests.** New file `frontend/scripts/hooks/__tests__/laneBoardRequirements.test.ts`: the route on a fixture repo
   (temp git repo with a minimal `docs/decisions.md` and one prompt, via `REQ_TRACE_REPO`), single-flight (two
   concurrent requests spawn one run), the 60 s cache, `/requirements.js` served beside the board, the tab button in
   the nav, and the R6 grouping (pairs grouped by conflict, groups closed by default) run on the client code with a
   stub DOM as `laneBoardStrip.test.ts` does. Run the new cases on the base commit and record which fail.
5. **Mutation check.** At least 8 single-point mutations over the route, single-flight, cache, kill timer and the R6
   grouping, one at a time on a `/tmp` copy; report each.
6. **Gates and live check.** `node --check` on the board and `requirements.js`; the `laneBoard`, `laneBoardStrip` and
   `laneBoardRequirements` suites; `npm run check:scripts` from `frontend/`. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`.
   With `curl -s localhost:4702/api/requirements` report the counts (rows, realized, clusters, milestones, conflicts,
   opposing pairs) and the time of the first and of a cached response. Leave the board running and report its PID;
   the chat runs the RC-23 visual check (crop at 1400 px wide, §7) and stops it.
7. **Commits.** One code commit with an explicit pathspec of the four files. The subject must fit 72 characters
   (CLAUDE.md §6.2): `feat(harness): lane board Requirements tab (P-2026-10-11-0008)`. Then the log entry in
   `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch `req-trace.mjs`, `lane-run.mjs`, `lane-tracking.mjs`, `timeline.js` or `insights.js`.
- Create `docs/goals/milestones.json` or any file under `docs/goals/`.
- Change `COL_W`, the Lanes tab columns, the Phase cell or the strip.
- Delete or move the branches `harness-req-tab`, `harness-board-progress` or their worktrees (RC-26).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` §3 F2, §5, §6, §7 S5, §8 R2 R5 R6, §9 D6.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23.

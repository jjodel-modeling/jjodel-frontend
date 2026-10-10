# Lane board: status strip and the resolved colour in Timeline and Insights

Prompt-ID: P-2026-10-10-2103
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: full (five files: board, timeline.js, insights.js, README, one new test file)
Depends: P-2026-10-10-2021
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardstrip`, branch `board-strip`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2103 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` (lane P-2026-10-10-1806) planned the port of
branch `harness-req-tab` onto the trunk board in slices; Alfonso approved the plan in chat. Slices S1 (`lane-run
resolve`), S2 (progress in the Phase cell, resolved overlay in `collect()`, importable board) and S3 (`req-trace.mjs`)
are on the trunk. This lane is slice **S4** (§7, wave 2): features F1 and F6. Read §3 rows F1 and F6, §5 (the
`laneBoardStrip.test.ts` row), §7 S4 and §8 R8. The branch sources are at `35240a582` (tag
`archive/harness-req-tab-2026-10-10`): the parallel board `frontend/scripts/lane-board.mjs`, `frontend/scripts/board/
timeline.js`, `frontend/scripts/board/insights.js` and `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts`. Read
them with `git show 35240a582:<path>`. The trunk board in `frontend/scripts/lane-board/` is the base and wins wherever
both sides have a version (D1); the port is a fresh edit (D2).

## WHAT
1. **F1, status strip.** Port `STRIP`, `stripKey`, `stripCounts` and the page's `renderStrip` into the trunk
   `lane-board.mjs`: six pills at the end of the tab bar (running, question, hard-stop, blocked, resolved, done in the
   last 24 h), in the trunk's outcome colours (trunk `.hard-stop` is `var(--hs)`, keep it), zero counts dimmed. A
   click filters the Lanes tab to that state, as on the branch; if the branch has no way back to the full view, a
   second click on the same pill clears the filter. The filtered view
   goes through the trunk `table()`, so it inherits fixed widths and columns. The page embeds `stripKey.toString()`
   so the tests count with the page's own code, as on the branch.
2. **F6, resolved colour.** In `timeline.js`, port the branch's resolved hunks (last turn of a resolved lane in the
   ok colour, the legend entry, the turn title and detail annotation), on top of the trunk code (launcher grouping,
   `Depends:` links, newest first). Add a `resolved` entry to `window.LANE_OUTCOME_TIPS` so the legend tooltip
   explains it. In `insights.js`, the `OUTS` resolved entry. `/api/insights` keeps the raw outcome (D5, R8): do not
   change the server side of Insights.
3. **README.** `frontend/scripts/lane-board/README.md`: the strip and its filter, the resolved colour in Timeline.
4. **Tests.** New file `frontend/scripts/hooks/__tests__/laneBoardStrip.test.ts`, from the branch file adapted per §5:
   `SCRIPT` points to `lane-board/lane-board.mjs`; the nav assertion says "the strip follows the last tab button",
   not a hardwired `Requirements</button>` (S5 adds that tab later); drop the "board/ assets served from board/" test;
   leave the Requirements-route test out (it moves to S5). Reuse the `board()` helper conventions of
   `laneBoard.test.ts` (temp `JJODEL_REPO`, temp `LANE_BOARD_CACHE`). Run the new cases on the base commit and record
   which fail.
5. **Mutation check.** At least 8 single-point mutations over the strip counting, the filter, the resolved colour and
   the tip, one at a time on a `/tmp` copy; report each.
6. **Gates and live check.** `node --check` on the three scripts; the `laneBoard` and `laneBoardStrip` suites;
   `npm run check:scripts` from `frontend/`. Start this tree's board on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`.
   With `curl` confirm the strip counts against `/api`. Leave the board running and report its PID; the chat runs the
   RC-23 visual check (pills, filter, colours in Timeline) and stops it.
7. **Commits.** One code commit with an explicit pathspec of the five files. The subject must fit 72 characters
   (CLAUDE.md §6.2): `feat(harness): board status strip, resolved colour (P-2026-10-10-2103)`. Then the log
   entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`.
   No merge.

## DO NOT
- Add the Requirements tab, `/api/requirements` or `requirements.js`: that is S5.
- Touch `lane-run.mjs`, `lane-tracking.mjs` or `req-trace.mjs`.
- Change `COL_W`, the columns, or the Phase cell built by S2.
- Write `resolved.txt` in any real lane folder.
- Delete or move the branches `harness-req-tab`, `harness-board-progress` or their worktrees (RC-26).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` §3 F1 F6, §5, §7 S4, §8 R8, §9.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23.

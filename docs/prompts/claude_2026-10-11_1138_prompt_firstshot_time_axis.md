# Lane board Insights: First-shot over time on a true time axis

Prompt-ID: P-2026-10-11-1138
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Front: harness
Lane: fast (one source file, `frontend/scripts/lane-board/insights.js`, plus one new test file; outside the critical zone)
Depends: none
Status: eseguito 2026-10-11, lane P-2026-10-11-1138 (firstshot-time-axis, 3f5e33827); visual check passed (chat, built-in browser on 4702, RC-23)

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-fstime`, branch `firstshot-time-axis`, cut from the trunk tip that carries the docs commit adding
this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a clean
`git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-11-1138 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).

## Context (measured, do not redo the analysis)
The Insights card "First-shot over time" is drawn by `timeCard(c)` in `frontend/scripts/lane-board/insights.js`
(about `:291-360`). The x axis is a real time axis (`xOf(t)`), and the dashed marker lines (a model's first lane, the
RC rows) sit at their true time. The squares do not: each week's lanes are laid out as a grid that starts at the
week's left edge (`x0 = xOf(weeks[i]) + 6`, then `j % perRow` across and `floor(j / perRow)` up). So a square's x
says nothing about when its lane ran, and a marker line cannot be read against the squares inside a week (a lane
of Friday can sit left of a Monday marker). Alfonso asked in chat that the squares go on the time axis.

## WHAT
1. **Squares at their start time.** Each session lane's square is placed at `xOf(l.start)` (clamped to the chart
   range as today with `Math.max(l.start, t0)`). Squares that would overlap stack upward: bin the x axis in columns of
   `STEP` px, put each square in the column of its start, and stack within a column from the baseline up, in start
   order. Keep `CELL`, colours, the censored (young) style, the `data-tip` and the legend as they are.
2. **Height.** The chart height follows the tallest stack (at least 3 rows, as today). Measure the tallest stack for
   the ranges the card offers on today's data and report it. If it exceeds 30 rows for any range, widen the columns for
   that render (column width a multiple of `STEP`, squares centred in it) until it fits in 30 rows, and say which
   ranges needed it. No other rescaling.
3. **Weekly rate labels and week lines stay.** Keep the "NN% · k/n" label at each week's start and the separator line
   between weeks, and the "week of …" label under the axis. Add a light tick per day on the baseline (no labels) so a
   reader can place a square on its day.
4. **Subtitle.** Replace "one square each" with wording that says each square sits at the time its lane started and
   squares of the same moment stack. Keep the rest of the subtitle.
5. **Tests.** New file `frontend/scripts/hooks/__tests__/laneBoardInsights.test.ts`, running `insights.js` on a stub
   DOM as `laneBoardStrip.test.ts` does: a lane started later in a week is drawn to the right of an earlier one; two
   lanes started in the same column stack (same x, different y); a lane exactly at a marker's time has its square's
   column containing the marker's x; the tallest-stack height rule; the 30-row cap widening. Run them on the base
   commit and record which fail.
6. **Mutation check.** At least 6 single-point mutations over the placement, stacking and cap, one at a time on a
   `/tmp` copy; report each.
7. **Gates and live check.** `node --check` on `insights.js`; the `laneBoard`, `laneBoardStrip`,
   `laneBoardRequirements` and new suites; `npm run check:scripts` from `frontend/`. Start this tree's board on port
   4702 with `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`,
   leave it running and report its PID; the chat runs the RC-23 visual check of the card and stops it.
8. **Commits.** One code commit with an explicit pathspec of the two files, subject within 72 characters:
   `feat(harness): first-shot squares on the time axis (P-2026-10-11-1138)`. Then the log entry in
   `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`. No merge.

## DO NOT
- Touch other Insights cards, `lane-board.mjs`, `timeline.js`, `requirements.js` or `/api/insights`.
- Change what first-shot means or which lanes are counted.
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-23.

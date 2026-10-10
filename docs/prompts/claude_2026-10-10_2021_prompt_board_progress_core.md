# Lane board core: progress inside the Phase cell, blended estimate, resolved overlay, importable module

Prompt-ID: P-2026-10-10-2021
Chat: C-2026-10-10-0840
Request: https://claude.ai/code/session_01R4ggJvaEru8rnc1ttETkTN
Lane: full (eight files: board, README, one test file, five fixtures)
Depends: P-2026-10-10-1806
Status: da eseguire

Protocollo: docs/PROTOCOL.md, clauses P1..P16 apply (all, unless this prompt says otherwise).

Worktree: `~/jjodel-w-boardcore`, branch `board-progress-core`, cut from the trunk tip that carries the docs commit
adding this prompt, `frontend/node_modules` symlinked (P14). Before anything else: `pwd`, branch, `git log -1` and a
clean `git status`. Otherwise stop with `Outcome: blocked`.

## Lane discipline
Every reply of this session opens with `[P-2026-10-10-2021 · session <id>]`.
Every final message ends with one line: `Outcome: done | hard-stop | question | blocked`.
Every question that has a recommendation carries it in one line: `Recommended: <one line>`.
The lane does not touch the `Status` line of this prompt; the chat flips it.
Unattended: a question with one recommendation inside this lane's perimeter is answered as recommended (RC-21).
Two lanes run beside this one (P-2026-10-10-2020 on lane-run, P-2026-10-10-2022 on req-trace); their files are
disjoint from yours (RC-22).

## Context (measured, do not redo the analysis)
Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` (lane P-2026-10-10-1806) inventoried what the
unmerged branch `harness-req-tab` still adds to the trunk board. Alfonso approved its port plan in chat. This lane is
slice **S2** (§7): the board core. Read §3 rows F3, F4, F5, F7, §5 (the `laneBoard.test.ts` row and the fixtures row),
§7 S2, §8 R1, R3, R8 and §9 D1, D3, D4, D5 before writing code. The branch board is the parallel file
`frontend/scripts/lane-board.mjs` at `35240a582` (tag `archive/harness-req-tab-2026-10-10`); read it with
`git show 35240a582:frontend/scripts/lane-board.mjs`. The trunk board `frontend/scripts/lane-board/lane-board.mjs` is
the base: wherever both have a version, the trunk wins (D1). The port is a fresh edit, not a merge (D2).

R1 is decided: no Progress column. The Running table keeps its columns and `COL_W` widths. The segments and the current
step are drawn inside the Phase cell, with the phase text below them, truncated, full text in `title` on hover.

## WHAT
1. **F7, importable module.** The board listens only when run as a script: compare `realpathSync(process.argv[1])`
   with the realpath of the module's own file (both sides resolved, as `req-trace.mjs:609` does on the branch).
   Export `milestones`, `progressOf`, `compactEvent`, `laneEvents`, `estimate`, and whatever the ported tests import.
2. **F3, progress milestones.** Port `LADDERS` (phase2/fast 8 steps, discovery 6, merge 5), `milestones`,
   `progressOf`, `compactEvent` and `laneEvents` (incremental read of a running lane's `log.jsonl` tool calls). The
   trunk `kindOf` (with today's two-merges fix) picks the ladder. A lane folder holding `direct.json` gets
   `progress: null` (R3, D4). In `collect()`, a running row carries `progress`.
3. **F4, blended estimate.** With progress, `left = (phase rule + median × (1 − position/total)) / 2`, and `under 5 min`
   at the last step. Without progress the trunk rule is unchanged, word for word.
4. **F5, resolved overlay.** In `collect()`, after `row.tier`: an exited row with outcome `blocked` and a
   `resolved.txt` in its folder shows outcome `resolved`. CSS `.resolved` in the ok colour. The overlay is for the
   Lanes tab rows only: `/api/insights` and the exports keep the raw outcome (D5, R8). State which data path the XES
   and trace exports read and confirm they stay raw.
5. **Rendering (R1).** In the Running table's Phase cell: the segments (reached, skipped, pending), `n/m`, then the
   phase text. Scope the segment CSS as `.segs .seg`: the trunk's segmented controls already use `.seg`. No layout
   shift as progress advances: the cell's height is the same with and without progress.
6. **README.** `frontend/scripts/lane-board/README.md`: progress and its ladders, the blended estimate, the resolved
   overlay, and one sentence saying Insights keeps the raw outcome on purpose (R8).
7. **Tests.** Port `frontend/scripts/hooks/__tests__/laneBoard.test.ts` (622 lines on the branch) and the five
   fixtures `frontend/scripts/hooks/__tests__/fixtures/lane-board/*.jsonl` verbatim, then adapt per §5: `SCRIPT`
   points to `lane-board/lane-board.mjs`; in `board()`, set `JJODEL_REPO` to a temp repo so `launcherOf` does not run
   `git log --all` on a real checkout; the row key-set assertion matches the trunk's actual row keys (`t`,
   `launcher`, `start`, `end`, `work` and any other the trunk now emits); the header assertion follows R1 (no
   `Progress` header; the Phase cell carries the segments). Run the ported cases on the base commit first and record
   which fail.
8. **Mutation check.** Apply at least 10 single-point mutations over the ported code (ladders, `progressOf`, the
   estimate blend, the overlay, the listen guard), one at a time and reverted. The branch recorded 43 of 45 killed,
   2 equivalent. Report each with killed or survived.
9. **Gates and live check.** `node --check` on the board; the `laneBoard` suite; `npm run check:scripts` from
   `frontend/`. Start this tree's board in the background on port 4702 with
   `LANE_BOARD_CACHE=/tmp/lane-board-4702-timeline-cache.json node frontend/scripts/lane-board/lane-board.mjs --port 4702 --refresh 30`.
   Lanes P-2026-10-10-2020 and P-2026-10-10-2022 are likely running while you work: with `curl -s localhost:4702/api`
   paste the `progress` of the running rows, one exited `blocked` row (its outcome stays `blocked`, since no
   `resolved.txt` exists yet), and confirm that `node -e "import('<abs path>/lane-board.mjs')"` returns without
   opening a port. Leave the board running and report its PID; the chat runs the RC-23 visual check of the Running
   table and stops it.
10. **Commits.** One code commit with an explicit pathspec of the eight files,
   `feat(harness): lane board shows running lanes' progress in the Phase cell and the resolved outcome`. Then the log
   entry in `docs/log-inbox/harness.md`, uncommitted (RC-17), and stop with `Outcome: hard-stop (visual check due)`.
   No merge.

## DO NOT
- Touch `timeline.js`, `insights.js`, the status strip or the Requirements tab: those are slices S4 and S5.
- Touch `lane-run.mjs`, `lane-tracking.mjs` or `req-trace.mjs`.
- Change `COL_W`, the order of columns or rows, or the content of any existing column other than Phase.
- Delete or move the branches `harness-req-tab`, `harness-board-progress` or their worktrees (RC-26).
- Touch the launchd service `io.jjodel.lane-board`, port 4700 or `~/.jjodel-lanes/board/`.

## REFERENCES
- Discovery `docs/discovery/discovery_2026-10-10_board_req_tab_port.md` §3 F3 F4 F5 F7, §5, §7 S2, §8 R1 R3 R8, §9.
- `docs/PROTOCOL.md` P9, P13, P14, P16; RC-17, RC-21, RC-22, RC-23.
